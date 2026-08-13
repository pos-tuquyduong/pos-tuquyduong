/**
 * POS System - Order Routes
 * Quản lý đơn hàng bán lẻ
 *
 * THIẾT KẾ: phone làm định danh chính
 * - Thanh toán số dư dùng pos_wallets (theo phone)
 * - Không dùng pos_customers.balance
 *
 * TURSO MIGRATION: Tất cả database calls dùng await
 */

const express = require("express");
const { query, queryOne, run, beginTransaction } = require("../database");
const { authenticate, checkPermission } = require("../middleware/auth");
const { generateVoucherCode } = require("../utils/voucherCode");
const { findEligibleItemForGroup, computeItemDiscountAmount } = require("../utils/itemScopeDiscount");
const {
  generateOrderCode,
  getNow,
  getToday,
  normalizePhone,
  addMonthsSafe,
} = require("../utils/helpers");
const { checkStock, outStockFIFO, inStockReturn } = require("../utils/sxApi");
const { readFlashState } = require("../utils/flashState");
const { getMembershipStatus, isTierUsable } = require("../utils/membershipStatus");

const router = express.Router();

/**
 * GET /api/pos/orders
 * Danh sách đơn hàng
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const {
      date,
      from,
      to,
      customer_phone,
      status,
      page = 1,
      limit = 50,
    } = req.query;

    let sql = `
      SELECT o.*, 
        (SELECT COUNT(*) FROM pos_order_items WHERE order_id = o.id) as item_count
      FROM pos_orders o WHERE 1=1
    `;
    const params = [];

    if (date) {
      sql += ` AND DATE(o.created_at) = ?`;
      params.push(date);
    } else {
      if (from) {
        sql += ` AND DATE(o.created_at) >= ?`;
        params.push(from);
      }
      if (to) {
        sql += ` AND DATE(o.created_at) <= ?`;
        params.push(to);
      }
    }
    if (customer_phone) {
      sql += ` AND o.customer_phone = ?`;
      params.push(normalizePhone(customer_phone));
    }
    if (status) {
      sql += ` AND o.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (page - 1) * limit);

    const orders = await query(sql, params);

    // Stats theo cùng khoảng thời gian filter
    let statsSql = `
      SELECT 
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as total_revenue,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
      FROM pos_orders 
      WHERE 1=1
    `;
    const statsParams = [];
    if (date) {
      statsSql += ` AND DATE(created_at) = ?`;
      statsParams.push(date);
    } else if (from || to) {
      if (from) { statsSql += ` AND DATE(created_at) >= ?`; statsParams.push(from); }
      if (to) { statsSql += ` AND DATE(created_at) <= ?`; statsParams.push(to); }
    } else {
      statsSql += ` AND DATE(created_at) = DATE('now', 'localtime')`;
    }
    const todayStats = await queryOne(statsSql, statsParams);

    res.json({ orders, todayStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/orders/:id
 * Chi tiết đơn hàng
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const order = await queryOne("SELECT * FROM pos_orders WHERE id = ?", [
      req.params.id,
    ]);
    if (!order) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }

    const items = await query(
      "SELECT * FROM pos_order_items WHERE order_id = ?",
      [order.id],
    );
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/orders
 * Tạo đơn hàng mới
 * Hỗ trợ: Thanh toán linh hoạt (số dư + tiền mặt/CK + ghi nợ)
 * Phase B: Hỗ trợ chiết khấu linh hoạt + phí ship
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const {
      customer_phone,
      customer_name,
      items = [],
      payment_method,
      discount = 0,
      discount_reason,
      notes,
      is_new_customer = false, // Flag để tạo registration cho khách mới
      // Các field mới cho thanh toán linh hoạt
      balance_amount = 0, // Số tiền trừ từ số dư
      cash_amount = 0, // Số tiền mặt
      transfer_amount = 0, // Số tiền chuyển khoản
      debt_amount = 0, // Số tiền ghi nợ
      due_date = null, // Hạn thanh toán (nếu ghi nợ)
      payment_status = "paid", // 'paid', 'partial', 'pending'
      // === Phase B: Chiết khấu + Shipping ===
      discount_type = null, // 'percent' | 'fixed' | null (dùng discount cũ)
      discount_value = 0, // Giá trị chiết khấu (% hoặc số tiền)
      discount_code = null, // Mã chiết khấu (nếu có)
      shipping_fee = 0, // Phí vận chuyển
      // === Số dư mẹ (khách con) ===
      parent_phone = null, // SĐT mẹ (nếu dùng số dư mẹ)
      parent_balance_amount = 0, // Số tiền trừ từ số dư mẹ
      // === Tiền khách đưa / tiền thối ===
      cash_received = 0, // Tiền khách đưa (TM)
      change_amount = 0, // Tiền thối
      // === Gói sản phẩm ===
      customer_package_id = null, // Giao từ gói → ID của customer_package
      package_buy = null, // Mua gói → { package_id, total_qty }
      // === TIER-1c: Mua thẻ hội viên (như 1 sản phẩm, cùng đơn với hàng thường) ===
      membership_buy = null, // { tier_id }
    } = req.body;

    // Validate — cho phép items rỗng nếu đang mua gói / mua thẻ hội viên
    if ((!items || !Array.isArray(items) || items.length === 0) && !package_buy && !membership_buy) {
      return res
        .status(400)
        .json({ error: "Đơn hàng phải có ít nhất 1 sản phẩm" });
    }
    if (membership_buy && membership_buy.tier_id && !customer_phone) {
      return res.status(400).json({ error: "Cần chọn khách hàng trước khi mua thẻ hội viên" });
    }

    // Lấy thông tin sản phẩm và tính tổng
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      let product;
      if (item.sx_product_type && item.sx_product_id !== undefined) {
        product = await queryOne(
          "SELECT * FROM pos_products WHERE sx_product_type = ? AND sx_product_id = ? AND is_active = 1",
          [item.sx_product_type, item.sx_product_id],
        );
      } else {
        product = await queryOne(
          "SELECT * FROM pos_products WHERE id = ? AND is_active = 1",
          [item.product_id],
        );
      }

      if (!product) {
        return res
          .status(400)
          .json({ error: "Sản phẩm không tồn tại hoặc đã ngừng bán" });
      }
      // SP từ gói (from_package=true) cho phép price=0
      if (!item.from_package && product.price <= 0) {
        return res
          .status(400)
          .json({ error: `Sản phẩm ${product.name} chưa có giá bán` });
      }

      // Kiểm tra tồn kho từ SX (cả gói và lẻ đều cần)
      try {
        const stockCheck = await checkStock(
          product.sx_product_type,
          product.sx_product_id,
          item.quantity,
        );
        if (!stockCheck.sufficient) {
          return res.status(400).json({
            error: `Không đủ hàng: ${product.name}. Tồn kho: ${stockCheck.stock}, cần: ${item.quantity}`,
          });
        }
      } catch (err) {
        console.error("Stock check error:", err.message);
      }

      // Mix mode: SP từ gói → 0đ, SP lẻ → giá thường
      const unitPrice = item.from_package ? 0 : product.price;
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product_id: product.id,
        product_code: product.code,
        product_name: product.name,
        unit: product.unit || 'túi',
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: itemTotal,
        sx_product_type: product.sx_product_type,
        sx_product_id: product.sx_product_id,
        from_package: !!item.from_package,
        is_special_group: !!product.is_special_group,
        note: item.note ? String(item.note).trim().slice(0, 200) : null,
      });
    }

    // Mua gói → thêm line item cho gói
    if (package_buy && package_buy.package_id) {
      const pkg = await queryOne('SELECT * FROM pos_packages WHERE id = ? AND is_active = 1', [package_buy.package_id]);
      if (!pkg) return res.status(400).json({ error: 'Gói sản phẩm không tồn tại' });
      const pkgQty = package_buy.pkg_qty || 1;
      subtotal += pkg.price * pkgQty;
      orderItems.push({
        product_id: -pkg.id,
        product_code: pkg.code,
        product_name: `📦 ${pkg.name} (${package_buy.total_qty} ${pkg.unit})`,
        unit: 'gói',
        quantity: pkgQty,
        unit_price: pkg.price,
        total_price: pkg.price * pkgQty,
        sx_product_type: null,
        sx_product_id: null,
        is_package_item: true,
      });
    }

    // TIER-1c: Mua thẻ hội viên → thêm line item cho thẻ (giống hệt cách mua gói)
    let membershipTier = null;
    if (membership_buy && membership_buy.tier_id) {
      membershipTier = await queryOne('SELECT * FROM pos_membership_tiers WHERE id = ? AND is_active = 1', [membership_buy.tier_id]);
      if (!membershipTier) return res.status(400).json({ error: 'Hạng thành viên không tồn tại hoặc đã bị xóa' });
      const cardPrice = Number(membershipTier.card_price) || 0;
      subtotal += cardPrice;
      orderItems.push({
        product_id: -1000000 - membershipTier.id, // né trùng với product_id thường và -pkg.id
        product_code: `THE-${membershipTier.name}`,
        product_name: `🎟️ Thẻ hội viên ${membershipTier.name}`,
        unit: 'thẻ',
        quantity: 1,
        unit_price: cardPrice,
        total_price: cardPrice,
        sx_product_type: null,
        sx_product_id: null,
        is_membership_item: true,
      });
    }

    // === F2: Giảm FLASH (tầng 1, tự động) — tính trước mọi chiết khấu (phương án A) ===
    // Chỉ giảm % cho món có (type,id) nằm trong danh sách flash, và ĐANG trong giờ VN.
    // Server tự quyết (không tin client). Lỗi đọc flash → coi như không flash (đơn vẫn chạy).
    let flashDiscountAmount = 0;
    let flashApplied = false;
    try {
      const flashState = await readFlashState(query, getNow);
      if (flashState.is_flash_now && flashState.percent > 0 && flashState.product_keys.length > 0) {
        const keySet = new Set(flashState.product_keys);
        let flashBase = 0;
        const matchedItems = [];
        for (const it of orderItems) {
          if (it.sx_product_type != null && it.sx_product_id != null) {
            const uid = `${it.sx_product_type}_${it.sx_product_id}`;
            if (keySet.has(uid)) {
              flashBase += it.unit_price * it.quantity;
              matchedItems.push(it);
            }
          }
        }
        if (flashBase > 0) {
          flashDiscountAmount = Math.round((flashBase * flashState.percent) / 100);
          flashApplied = true;
          // Hóa đơn (04.08.2026): giá đã giảm CHỈ để hiển thị từng món trên hóa đơn.
          // subtotal/total thật vẫn tính theo unit_price gốc + trừ flashDiscountAmount tổng như cũ — KHÔNG đổi.
          for (const it of matchedItems) {
            it.flash_unit_price = Math.round(it.unit_price * (1 - flashState.percent / 100));
          }
        }
      }
    } catch (flashErr) {
      console.error("⚠️ F2: lỗi đọc flash (bỏ qua, đơn vẫn chạy):", flashErr.message);
      flashApplied = false;
      flashDiscountAmount = 0;
    }

    // === Phase B: Tính chiết khấu ===
    let finalDiscountType = discount_type;
    let finalDiscountValue = discount_value;
    let finalDiscountAmount = 0;
    let finalDiscountCode = discount_code;
    let discountCodeId = null;
    let discountCodeScope = 'order'; // Bước 5: 'order' | 'item' — mặc định 'order' khớp hành vi cũ
    let discountCodeGroupId = null;

    // Ưu tiên 1: Mã chiết khấu
    if (discount_code) {
      const codeRecord = await queryOne(
        "SELECT * FROM pos_discount_codes WHERE UPPER(code) = UPPER(?) AND is_active = 1",
        [discount_code.trim()],
      );

      if (codeRecord) {
        // Kiểm tra hiệu lực
        // BUG-FIX (09.08.2026): trước đây dùng new Date().toISOString() = giờ UTC, lệch 7 tiếng
        // so với giờ Việt Nam — sửa bằng cách dùng đúng hàm dùng chung getToday() (đã có sẵn
        // trong helpers.js, đang được reports.js dùng đúng) thay vì tự viết lại logic tính ngày.
        const today = getToday();
        let codeValid = true;

        if (codeRecord.valid_from && today < codeRecord.valid_from)
          codeValid = false;
        if (codeRecord.valid_to && today > codeRecord.valid_to)
          codeValid = false;
        if (
          codeRecord.usage_limit > 0 &&
          codeRecord.used_count >= codeRecord.usage_limit
        )
          codeValid = false;
        // Bước 5: đơn tối thiểu CHỈ áp dụng cho voucher giảm-cả-đơn — voucher giảm-1-món
        // không có khái niệm đơn tối thiểu (đã chốt lúc thiết kế).
        if (codeRecord.discount_scope !== 'item' && codeRecord.min_order > 0 && subtotal < codeRecord.min_order)
          codeValid = false;

        if (codeValid) {
          finalDiscountType = codeRecord.discount_type;
          finalDiscountValue = codeRecord.discount_value;
          finalDiscountCode = codeRecord.code;
          discountCodeId = codeRecord.id;
          discountCodeScope = codeRecord.discount_scope === 'item' ? 'item' : 'order';
          discountCodeGroupId = codeRecord.applicable_group_id || null;
        }
      }
    }

    // Normalize phone (chuyển lên sớm hơn — TIER-2 cần biết khách là ai trước khi tính chiết khấu)
    const phone = normalizePhone(customer_phone);
    const normalizedParentPhone = parent_phone ? normalizePhone(parent_phone) : null;

    // === TIER-2: Giảm theo HẠNG THÀNH VIÊN (tầng cùng mức F2, tự động) ===
    // Bám ĐÚNG luật F2 đã có: đơn có dính Flash (flashApplied=true) → KHÔNG cộng giảm hạng,
    // giống hệt cách F2 chặn voucher %. Đơn không dính Flash thì hạng vẫn áp bình thường dù
    // Flash đang chạy ở chỗ khác. Server tự quyết (không tin client) — client CHỈ được hiển thị
    // trước, số thật luôn do server tính lại ở đây.
    let tierDiscountAmount = 0;
    let tierApplied = false;
    let appliedTierName = null; // hóa đơn: hiện đúng tên hạng thật của khách (KH tự đổi tên ở Cài đặt)
    if (!flashApplied && phone) {
      try {
        const membership = await getMembershipStatus(query, queryOne, getNow, phone);
        if (isTierUsable(membership.status)) {
          const tier = await queryOne(
            "SELECT discount_percent, special_discount_percent FROM pos_membership_tiers WHERE id = ?",
            [membership.tier_id],
          );
          if (tier) {
            appliedTierName = membership.tier_name;
            for (const it of orderItems) {
              if (it.is_package_item || it.is_membership_item) continue; // không giảm giá thẻ/gói
              // Math.min(90, ...) là phòng vệ 2 lớp — Settings đã chặn 0-90 lúc lưu rồi,
              // nhưng nếu dữ liệu lỡ bị hỏng (vd nhập tay thẳng vào DB), tuyệt đối không để
              // % giảm vượt 90 khiến giá món sau giảm thành ÂM (khách được "trả tiền" thay vì trả).
              const rawRate = it.is_special_group
                ? Number(tier.special_discount_percent) || 0
                : Number(tier.discount_percent) || 0;
              const rate = Math.min(90, Math.max(0, rawRate));
              if (rate > 0) {
                tierDiscountAmount += Math.round(it.unit_price * it.quantity * rate / 100);
                // Hóa đơn: giá đã giảm CHỈ để hiển thị từng món — không ảnh hưởng total thật.
                it.tier_unit_price = Math.round(it.unit_price * (1 - rate / 100));
              }
            }
            if (tierDiscountAmount > 0) tierApplied = true;
          }
        }
      } catch (tierErr) {
        console.error("⚠️ TIER-2: lỗi tính giảm hạng (bỏ qua, đơn vẫn chạy):", tierErr.message);
        tierDiscountAmount = 0;
        tierApplied = false;
      }
    }

    // Ưu tiên 2: Chiết khấu từ request (discount_type + discount_value)
    // Đã có từ params

    // Ưu tiên 3: Chiết khấu cũ (discount số cố định) - backward compatible
    if (!finalDiscountType && discount > 0) {
      finalDiscountType = "fixed";
      finalDiscountValue = discount;
    }

    // F2: đang flash → CHẶN giảm kiểu % (voucher % hoặc giảm tay %). Voucher TIỀN vẫn được.
    // Áp dụng cho CẢ voucher giảm-1-món (Bước 5) vì đọc finalDiscountType từ codeRecord.discount_type
    // như cũ, không phân biệt scope — tái dùng đúng điều kiện có sẵn, không viết luật riêng.
    if (flashApplied && finalDiscountType === "percent" && finalDiscountValue > 0) {
      return res.status(400).json({
        error: "Đang flash sale — chỉ dùng được voucher/giảm giá kiểu TIỀN, không dùng kiểu %.",
      });
    }

    // Bước 5: món được chọn để giảm (chỉ có giá trị khi discountCodeScope === 'item') —
    // khai báo ở đây để dùng lại lúc gắn signup_unit_price vào orderItems cho hóa đơn.
    let itemScopeTargetItem = null;

    // Tính số tiền chiết khấu
    if (discountCodeScope === 'item' && discountCodeId) {
      // Voucher giảm-1-món: KHÔNG tính theo subtotal — tìm đúng 1 món (giá cao nhất trong
      // nhóm được phép, có mặt trong giỏ) rồi chỉ giảm trên giá của đúng 1 đơn vị món đó.
      itemScopeTargetItem = await findEligibleItemForGroup(query, discountCodeGroupId, orderItems);
      if (!itemScopeTargetItem) {
        return res.status(400).json({
          error: "Đơn này chưa có món nào được áp mã này",
        });
      }
      finalDiscountAmount = computeItemDiscountAmount(
        finalDiscountType, finalDiscountValue, itemScopeTargetItem.unit_price
      );
      // Hóa đơn: đánh dấu đúng dòng món được giảm — CHỈ hiển thị, không đổi unit_price gốc
      // dùng để tính subtotal/total thật (đúng khuôn flash_unit_price/tier_unit_price).
      itemScopeTargetItem.signup_unit_price = Math.max(0, itemScopeTargetItem.unit_price - finalDiscountAmount);
    } else if (finalDiscountType === "percent" && finalDiscountValue > 0) {
      finalDiscountAmount = (subtotal * finalDiscountValue) / 100;
      // Giới hạn max_discount từ mã CK nếu có
      if (discountCodeId) {
        const codeRecord = await queryOne(
          "SELECT max_discount FROM pos_discount_codes WHERE id = ?",
          [discountCodeId],
        );
        if (
          codeRecord?.max_discount > 0 &&
          finalDiscountAmount > codeRecord.max_discount
        ) {
          finalDiscountAmount = codeRecord.max_discount;
        }
      }
    } else if (finalDiscountType === "fixed" && finalDiscountValue > 0) {
      finalDiscountAmount = finalDiscountValue;
    }

    // Đảm bảo chiết khấu (voucher/tay) không vượt phần CÒN LẠI sau giảm flash + giảm hạng
    finalDiscountAmount = Math.min(
      finalDiscountAmount,
      Math.max(0, subtotal - flashDiscountAmount - tierDiscountAmount),
    );
    // Nếu bị trần trên cắt bớt, đồng bộ lại giá hiển thị trên hóa đơn cho đúng số thật đã giảm
    // (ca cực hiếm — flash/tier gần như luôn không cùng áp dụng, nhưng vẫn xử lý cho chắc).
    if (itemScopeTargetItem) {
      itemScopeTargetItem.signup_unit_price = Math.max(0, itemScopeTargetItem.unit_price - finalDiscountAmount);
    }

    // Tính total: subtotal - giảm flash - giảm hạng - chiết khấu + phí ship
    const finalShippingFee = shipping_fee || 0;
    const total = Math.max(
      0,
      subtotal - flashDiscountAmount - tierDiscountAmount - finalDiscountAmount + finalShippingFee,
    );
    // Cột 'discount'/'discount_amount' = TỔNG giảm (flash + hạng + voucher) để hoá đơn & báo cáo
    // hiển thị đúng (subtotal − discount + ship = total). 'flash_discount'/'tier_discount' giữ riêng để phân tích.
    const totalDiscountAmount = finalDiscountAmount + flashDiscountAmount + tierDiscountAmount;

    // Xử lý thanh toán số dư từ pos_wallets
    let actualBalanceAmount = 0;
    let balanceBefore = 0;
    let balanceAfter = 0;

    // Tính toán số tiền thanh toán thực tế
    // Hỗ trợ cả payment_method cũ (backward compatible) và mới
    if (payment_method === "balance" && phone) {
      // Cách cũ: thanh toán toàn bộ bằng số dư
      const wallet = await queryOne(
        "SELECT * FROM pos_wallets WHERE phone = ?",
        [phone],
      );
      const currentBalance = wallet?.balance || 0;

      if (currentBalance < total) {
        return res.status(400).json({
          error: `Số dư không đủ. Hiện có: ${currentBalance.toLocaleString()}đ, cần: ${total.toLocaleString()}đ`,
        });
      }

      actualBalanceAmount = total;
      balanceBefore = currentBalance;
      balanceAfter = currentBalance - total;
    } else if (balance_amount > 0 && phone) {
      // Cách mới: thanh toán linh hoạt
      const wallet = await queryOne(
        "SELECT * FROM pos_wallets WHERE phone = ?",
        [phone],
      );
      const currentBalance = wallet?.balance || 0;

      if (currentBalance < balance_amount) {
        return res.status(400).json({
          error: `Số dư không đủ. Hiện có: ${currentBalance.toLocaleString()}đ`,
        });
      }

      actualBalanceAmount = balance_amount;
      balanceBefore = currentBalance;
      balanceAfter = currentBalance - balance_amount;
    }

    // === Xử lý số dư mẹ (nếu có) ===
    let actualParentBalanceAmount = 0;
    let parentBalanceBefore = 0;
    let parentBalanceAfter = 0;
    let parentName = null;

    if (parent_balance_amount > 0 && normalizedParentPhone) {
      const parentWallet = await queryOne(
        "SELECT * FROM pos_wallets WHERE phone = ?",
        [normalizedParentPhone],
      );
      const parentCurrentBalance = parentWallet?.balance || 0;

      if (parentCurrentBalance < parent_balance_amount) {
        return res.status(400).json({
          error: `Số dư mẹ không đủ. Hiện có: ${parentCurrentBalance.toLocaleString()}đ`,
        });
      }

      // Lấy tên parent để ghi log
      const parentReg = await queryOne(
        "SELECT name FROM pos_registrations WHERE phone = ?",
        [normalizedParentPhone],
      );
      parentName = parentReg?.name || normalizedParentPhone;

      actualParentBalanceAmount = parent_balance_amount;
      parentBalanceBefore = parentCurrentBalance;
      parentBalanceAfter = parentCurrentBalance - parent_balance_amount;
    }

    // Xác định payment_status thực tế
    let finalPaymentStatus = payment_status;
    let finalDebtAmount = debt_amount;

    if (debt_amount > 0) {
      finalPaymentStatus = (actualBalanceAmount > 0 || actualParentBalanceAmount > 0) ? "partial" : "pending";
      finalDebtAmount = debt_amount;
    } else {
      finalPaymentStatus = "paid";
      finalDebtAmount = 0;
    }


    // ─── An toàn tiền bạc: đối chiếu tổng thanh toán máy khách gửi lên với total server tự tính ───
    // Máy khách hiện CHƯA biết Flash lúc tính tiền mặt/chuyển khoản/ghi nợ cần thu (tính trước khi
    // biết kết quả server). Nếu lệch (vd đang có Flash mà máy khách gửi số như không có Flash) →
    // từ chối tạo đơn, KHÔNG bao giờ âm thầm ghi sai số tiền thu của khách.
    const paymentSum = Math.round(
      (Number(cash_amount) || 0) +
      (Number(transfer_amount) || 0) +
      actualBalanceAmount +
      actualParentBalanceAmount +
      finalDebtAmount
    );
    if (Math.abs(paymentSum - total) > 1) {
      return res.status(400).json({
        error: `Số tiền thanh toán (${paymentSum.toLocaleString('vi-VN')}đ) không khớp tổng đơn hàng thật (${total.toLocaleString('vi-VN')}đ)` +
          (flashApplied ? ' — đang áp dụng Flash sale, vui lòng tải lại giỏ hàng rồi thử lại.' : '.'),
      });
    }

    // ========== ATOMIC TRANSACTION: Tạo đơn hàng ==========
    // Tất cả thao tác DB (tạo đơn, trừ ví, ghi log) trong 1 transaction
    // Nếu bất kỳ bước nào lỗi → rollback tất cả, không mất tiền
    const orderCode = generateOrderCode();
    const now = getNow();

    // ─── LOY-1 Gói 2: chuẩn bị cộng điểm (mọi tính toán NGOÀI transaction) ───
    // Đọc cấu hình + tính điểm + tính hạn TRƯỚC khi mở tx. Trong tx chỉ còn 1 INSERT đã kiểm sẵn
    // → một lỗi điểm KHÔNG BAO GIỜ rollback được một ca bán thật.
    let loyaltyEarnPoints = 0;
    let loyaltyExpiresAt = null;
    let shouldEarnPoints = false;
    try {
      // F2: đơn có giảm flash → KHÔNG cộng điểm (đơn chỉ mua món thường vẫn cộng bình thường).
      if (phone && total > 0 && !flashApplied) {
        const loyRows = await query(
          `SELECT key, value FROM pos_settings WHERE key IN ('loyalty_enabled','loyalty_earn_per_amount','loyalty_expiry_mode')`,
        );
        const loy = {};
        for (const r of loyRows) loy[r.key] = r.value;
        if (loy.loyalty_enabled === 'true') {
          const per = parseInt(loy.loyalty_earn_per_amount, 10);
          if (Number.isFinite(per) && per >= 1) {
            loyaltyEarnPoints = Math.floor(total / per);
            if (loyaltyEarnPoints > 0) {
              shouldEarnPoints = true;
              // Hạn điểm: 'quarter' = cuốn chiếu theo quý (đầu quý tương ứng năm sau); ngược lại NULL = không hết hạn.
              if (loy.loyalty_expiry_mode === 'quarter') {
                const y = parseInt(now.slice(0, 4), 10);
                const m = parseInt(now.slice(5, 7), 10);
                const qStart = m <= 3 ? 1 : m <= 6 ? 4 : m <= 9 ? 7 : 10;
                const mm = qStart < 10 ? '0' + qStart : '' + qStart;
                loyaltyExpiresAt = (y + 1) + '-' + mm + '-01T00:00:00';
              }
            }
          }
        }
      }
    } catch (loyPrepErr) {
      console.error('⚠️ LOY-1: lỗi chuẩn bị điểm (bỏ qua, không ảnh hưởng đơn):', loyPrepErr.message);
      shouldEarnPoints = false;
    }

    const tx = await beginTransaction();
    let orderId;

    try {
      // Re-check wallet inside transaction (chống race condition)
      if (actualBalanceAmount > 0 && phone) {
        const freshWallet = await tx.queryOne(
          "SELECT * FROM pos_wallets WHERE phone = ?", [phone]
        );
        const freshBalance = freshWallet?.balance || 0;
        if (freshBalance < actualBalanceAmount) {
          await tx.rollback();
          return res.status(400).json({
            error: `Số dư không đủ. Hiện có: ${freshBalance.toLocaleString()}đ`,
          });
        }
        balanceBefore = freshBalance;
        balanceAfter = freshBalance - actualBalanceAmount;
      }

      if (actualParentBalanceAmount > 0 && normalizedParentPhone) {
        const freshParentWallet = await tx.queryOne(
          "SELECT * FROM pos_wallets WHERE phone = ?", [normalizedParentPhone]
        );
        const freshParentBalance = freshParentWallet?.balance || 0;
        if (freshParentBalance < actualParentBalanceAmount) {
          await tx.rollback();
          return res.status(400).json({
            error: `Số dư mẹ không đủ. Hiện có: ${freshParentBalance.toLocaleString()}đ`,
          });
        }
        parentBalanceBefore = freshParentBalance;
        parentBalanceAfter = freshParentBalance - actualParentBalanceAmount;
      }

      // 1. Tạo đơn hàng
      const result = await tx.run(
        `INSERT INTO pos_orders (
          code, customer_phone, customer_name,
          subtotal, discount, discount_reason, total,
          discount_type, discount_value, discount_amount, flash_discount, tier_discount, customer_tier, discount_code, shipping_fee,
          payment_method, cash_amount, transfer_amount, balance_amount, debt_amount,
          parent_phone, parent_balance_amount,
          cash_received, change_amount,
          payment_status, due_date,
          customer_package_id,
          status, notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?)`,
        [
          orderCode, phone || null, customer_name || "Khách lẻ",
          subtotal, totalDiscountAmount, discount_reason || null, total,
          finalDiscountType || null, finalDiscountValue || 0, totalDiscountAmount,
          flashDiscountAmount, tierDiscountAmount, appliedTierName || null,
          finalDiscountCode || null, finalShippingFee,
          payment_method === "debt" ? "debt" : payment_method,
          cash_amount || 0, transfer_amount || 0, actualBalanceAmount,
          finalDebtAmount,
          normalizedParentPhone || null, actualParentBalanceAmount,
          cash_received || 0, change_amount || 0,
          finalPaymentStatus, due_date || null,
          customer_package_id || null,
          notes || null, req.user.username, now,
        ],
      );
      orderId = Number(result.lastInsertRowid);

      // 2. Thêm chi tiết đơn hàng
      // Lưu ý: package virtual item có product_id âm (-pkg.id) — SQLite/Turso không enforce FK
      for (const item of orderItems) {
        await tx.run(
          `INSERT INTO pos_order_items (
            order_id, product_id, product_code, product_name,
            quantity, unit_price, total_price, unit, notes, flash_unit_price, tier_unit_price
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderId, item.product_id, item.product_code, item.product_name,
           item.quantity, item.unit_price, item.total_price, item.unit || 'túi', item.note || null,
           item.flash_unit_price || null, item.tier_unit_price || null],
        );
      }

      // 3. Trừ số dư khách (nếu có)
      if (actualBalanceAmount > 0 && phone) {
        await tx.run(
          `UPDATE pos_wallets SET balance = ?, total_spent = total_spent + ?, updated_at = ? WHERE phone = ?`,
          [balanceAfter, actualBalanceAmount, now, phone],
        );
        await tx.run(
          `INSERT INTO pos_balance_transactions (
            customer_phone, customer_name, type, amount,
            balance_before, balance_after, order_id,
            notes, created_by, created_at
          ) VALUES (?, ?, 'purchase', ?, ?, ?, ?, ?, ?, ?)`,
          [phone, customer_name || null, -actualBalanceAmount,
           balanceBefore, balanceAfter, orderId,
           "Thanh toán đơn hàng " + orderCode, req.user.username, now],
        );
      }

      // 4. Trừ số dư mẹ (nếu có)
      if (actualParentBalanceAmount > 0 && normalizedParentPhone) {
        await tx.run(
          `UPDATE pos_wallets SET balance = ?, total_spent = total_spent + ?, updated_at = ? WHERE phone = ?`,
          [parentBalanceAfter, actualParentBalanceAmount, now, normalizedParentPhone],
        );
        await tx.run(
          `INSERT INTO pos_balance_transactions (
            customer_phone, customer_name, type, amount,
            balance_before, balance_after, order_id,
            notes, created_by, created_at
          ) VALUES (?, ?, 'purchase', ?, ?, ?, ?, ?, ?, ?)`,
          [normalizedParentPhone, parentName, -actualParentBalanceAmount,
           parentBalanceBefore, parentBalanceAfter, orderId,
           `Trừ cho KH: ${customer_name || phone} - Đơn ${orderCode}`,
           req.user.username, now],
        );
      }

      // 5. Tăng used_count mã chiết khấu
      if (discountCodeId) {
        // BUG-FIX (13.08.2026) — race condition: kiểm tra usage_limit lúc nãy (đầu hàm,
        // ngoài transaction) rồi mới tăng used_count ở đây (trong transaction) — nếu 2 đơn
        // dùng CHUNG 1 mã bấm gần như cùng lúc ở 2 quầy, cả 2 có thể cùng đọc used_count
        // CŨ trước khi bên kia kịp tăng, dẫn tới mã bị dùng vượt quá usage_limit cho phép.
        // Sửa theo ĐÚNG khuôn đã có sẵn ở trên cho "số dư ví" (dòng ~654: "Re-check ...
        // trong transaction (chống race condition)") — đọc lại used_count LẦN NỮA ngay
        // trong transaction (transaction "write" khoá ghi độc quyền, đọc lúc này chắc chắn
        // là số mới nhất, không có đơn nào khác chen ngang được), rồi mới quyết định tăng.
        const freshCode = await tx.queryOne(
          "SELECT usage_limit, used_count FROM pos_discount_codes WHERE id = ?",
          [discountCodeId],
        );
        if (
          freshCode &&
          freshCode.usage_limit > 0 &&
          freshCode.used_count >= freshCode.usage_limit
        ) {
          await tx.rollback();
          return res.status(400).json({
            error: `Mã giảm giá "${finalDiscountCode}" vừa hết lượt dùng (có đơn khác vừa dùng trước). Vui lòng bỏ mã hoặc thử mã khác.`,
            code: "DISCOUNT_CODE_LIMIT_REACHED",
          });
        }
        await tx.run(
          "UPDATE pos_discount_codes SET used_count = used_count + 1, updated_at = ? WHERE id = ?",
          [now, discountCodeId],
        );
      }

      // 6. LOY-1 Gói 2: cộng điểm (đã tính sẵn NGOÀI tx). Bọc try/catch để lỗi ghi điểm
      //    KHÔNG kéo rollback đơn — tiền/đơn quan trọng hơn điểm thưởng.
      if (shouldEarnPoints) {
        try {
          await tx.run(
            `INSERT INTO pos_point_transactions (
              customer_phone, type, points, order_id, expires_at, reason, created_by, created_at
            ) VALUES (?, 'earn', ?, ?, ?, ?, ?, ?)`,
            [phone, loyaltyEarnPoints, orderId, loyaltyExpiresAt,
             `Tích điểm đơn ${orderCode}`, req.user.username, now],
          );
        } catch (loyErr) {
          console.error(`⚠️ Đơn ${orderCode} - Ghi điểm lỗi (bỏ qua, đơn vẫn hoàn tất):`, loyErr.message);
        }
      }

      // COMMIT - tất cả thành công → ghi vào DB
      await tx.commit();
      console.log(`✅ Đơn ${orderCode} - Transaction committed (order + wallet + log)`);

    } catch (txErr) {
      // BẤT KỲ lỗi nào → rollback tất cả, không mất tiền
      await tx.rollback();
      console.error(`❌ Đơn ${orderCode} - Transaction rolled back:`, txErr.message);
      throw txErr;
    }

    // ========== SAU TRANSACTION: Các thao tác không quan trọng ==========

    // Trừ kho SX (bên ngoài transaction vì gọi API external)
    // Bỏ qua virtual package items (is_package_item)
    for (const item of orderItems) {
      if (item.is_package_item || !item.sx_product_type) continue;
      try {
        await outStockFIFO(
          item.sx_product_type, item.sx_product_id,
          item.quantity, `POS: ${orderCode}`,
        );
      } catch (err) {
        console.error(`⚠️ Stock out failed for ${item.product_name}: ${err.message}`);
        try {
          await run(
            `INSERT INTO pos_stock_pending (
              order_code, order_id, sx_product_type, sx_product_id,
              product_name, quantity, direction, error_message, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'out', ?, ?)`,
            [orderCode, orderId, item.sx_product_type, item.sx_product_id,
             item.product_name, item.quantity, err.message, now],
          );
        } catch (logErr) {
          console.error("Failed to log pending stock:", logErr.message);
        }
      }
    }

    // Gói: tạo customer_package khi mua gói (hỗ trợ mua nhiều gói)
    if (package_buy && package_buy.package_id && phone) {
      const pkgQty = package_buy.pkg_qty || 1;
      try {
        for (let i = 0; i < pkgQty; i++) {
          const cpResult = await run(
            `INSERT INTO pos_customer_packages (customer_phone, package_id, order_id, total_qty, delivered_qty, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, 0, 'active', ?, ?)`,
            [phone, package_buy.package_id, orderId, package_buy.total_qty, now, now]
          );
          const newCpId = Number(cpResult.lastInsertRowid);
          console.log(`📦 Created customer package #${newCpId} (${i + 1}/${pkgQty}) for ${phone}: ${package_buy.total_qty} SP`);

          // Giao lần 1 cùng đơn — chỉ áp dụng cho gói đầu tiên
          if (i === 0) {
            const firstDeliveryQty = orderItems.reduce((s, item) => s + (item.from_package ? item.quantity : 0), 0);
            if (firstDeliveryQty > 0) {
              await run(
                `UPDATE pos_customer_packages 
                 SET delivered_qty = ?,
                     status = CASE WHEN ? >= total_qty THEN 'completed' ELSE 'active' END,
                     updated_at = ?
                 WHERE id = ?`,
                [firstDeliveryQty, firstDeliveryQty, now, newCpId]
              );
              await run('UPDATE pos_orders SET customer_package_id = ? WHERE id = ?', [newCpId, orderId]);
              console.log(`📦 First delivery: ${firstDeliveryQty} SP for package #${newCpId}`);
            }
          }
        }
      } catch (err) {
        console.error('Package buy record error:', err.message);
      }
    }

    // TIER-1c: mua thẻ hội viên → ghi vào sổ, TÍNH LẠI hạn dùng đúng cấu hình hiện tại
    if (membershipTier && phone) {
      try {
        const settingsRows = await query(
          "SELECT key, value FROM pos_settings WHERE key = 'tier_card_valid_months'",
        );
        let validMonths = parseInt(settingsRows[0]?.value, 10);
        if (!Number.isFinite(validMonths) || validMonths < 1) validMonths = 3;

        const nowDate = new Date(now.replace(' ', 'T'));
        const expiresDate = addMonthsSafe(nowDate, validMonths);
        const expiresAt = expiresDate.toISOString().slice(0, 19).replace('T', ' ');

        await run(
          `INSERT INTO pos_membership_purchases
            (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [phone, membershipTier.id, membershipTier.name, membershipTier.card_price, orderId, now, expiresAt, req.user.username],
        );
        console.log(`🎟️ Đã ghi mua thẻ ${membershipTier.name} cho ${phone}, hết hạn ${expiresAt}`);
      } catch (err) {
        console.error('Membership purchase record error:', err.message);
      }
    }

    // Gói: cập nhật delivered_qty khi giao từ gói (ATOMIC — tránh race condition)
    if (customer_package_id) {
      try {
        // Chỉ đếm SP từ gói (from_package=true), không đếm SP lẻ
        const deliveredQty = orderItems.reduce((s, i) => s + (i.from_package ? i.quantity : 0), 0);
        if (deliveredQty > 0) {
          await run(
            `UPDATE pos_customer_packages 
             SET delivered_qty = delivered_qty + ?, 
                 status = CASE WHEN delivered_qty + ? >= total_qty THEN 'completed' ELSE 'active' END,
                 updated_at = ?
             WHERE id = ?`,
            [deliveredQty, deliveredQty, now, customer_package_id]
          );
          console.log(`📦 Updated delivery +${deliveredQty} for package #${customer_package_id}`);
        }
      } catch (err) {
        console.error('Package delivery update error:', err.message);
      }
    }

    // Tạo registration cho khách mới (không quan trọng, lỗi không ảnh hưởng đơn)
    if (is_new_customer && phone && customer_name) {
      try {
        const existingReg = await queryOne(
          "SELECT id, notes FROM pos_registrations WHERE phone = ? AND status = ?",
          [phone, "pending"],
        );
        if (existingReg) {
          const newNotes = existingReg.notes
            ? `${existingReg.notes}, ${orderCode}`
            : `Từ POS - Đơn hàng: ${orderCode}`;
          await run("UPDATE pos_registrations SET notes = ? WHERE id = ?", [
            newNotes, existingReg.id,
          ]);
        } else {
          await run(
            `INSERT INTO pos_registrations (phone, name, notes, status, created_by, created_at)
            VALUES (?, ?, ?, 'pending', ?, ?)`,
            [phone, customer_name, `Từ POS - Đơn hàng: ${orderCode}`,
             req.user.username, now],
          );
        }
      } catch (regErr) {
        console.error("Registration creation error:", regErr);
      }
    }

    // Bước 3 (08.08.2026) — Mã ưu đãi khách mới: in trên bill, đổi lấy tài khoản App KH.
    // INERT với đơn hàng — lỗi ở đây KHÔNG được làm hỏng đơn đã tạo xong, chỉ log rồi bỏ qua.
    // Luật: in cho MỌI đơn, trừ khi đơn có SĐT và SĐT đó đã từng claim ưu đãi này trước đây.
    let signupCode = null;
    try {
      let alreadyClaimed = false;
      if (phone) {
        const claimedBefore = await queryOne(
          'SELECT id FROM pos_signup_codes WHERE claimed_phone = ? LIMIT 1',
          [phone]
        );
        alreadyClaimed = !!claimedBefore;
      }
      if (!alreadyClaimed) {
        // Chống trùng mã: thử tối đa 5 lần, cực hiếm khi đụng (~887 triệu tổ hợp)
        for (let attempt = 0; attempt < 5; attempt++) {
          const candidate = generateVoucherCode();
          const exists = await queryOne('SELECT id FROM pos_signup_codes WHERE code = ?', [candidate]);
          if (!exists) {
            await run(
              `INSERT INTO pos_signup_codes (code, order_id, order_customer_phone, issued_at)
               VALUES (?, ?, ?, ?)`,
              [candidate, orderId, phone || null, now]
            );
            signupCode = candidate;
            break;
          }
        }
      }
    } catch (signupErr) {
      console.error('Signup code creation error:', signupErr.message);
    }

    res.json({
      success: true,
      order: {
        id: orderId,
        code: orderCode,
        subtotal,
        discount_type: finalDiscountType,
        discount_value: finalDiscountValue,
        flash_discount: flashApplied ? flashDiscountAmount : 0,
        tier_discount: tierApplied ? tierDiscountAmount : 0,
        customer_tier: appliedTierName,
        discount: totalDiscountAmount,
        discount_amount: finalDiscountAmount,
        discount_code: finalDiscountCode,
        shipping_fee: finalShippingFee,
        total,
        items: orderItems,
        balance_after: balanceAfter,
        debt_amount: finalDebtAmount,
        payment_status: finalPaymentStatus,
        created_by: req.user.display_name || req.user.username,
        created_at: now,
        signup_code: signupCode,
      },
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: err.message });
  }
});
/**
 * POST /api/pos/orders/:id/pay-debt
 * Xác nhận thanh toán nợ cho đơn hàng
 * - Cập nhật debt_amount, cash_amount/transfer_amount
 * - Cập nhật payment_status thành 'paid' nếu hết nợ
 */
router.post("/:id/pay-debt", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method, amount } = req.body;

    // Validate payment_method
    if (!payment_method || !["cash", "transfer"].includes(payment_method)) {
      return res
        .status(400)
        .json({
          error: "Phương thức thanh toán không hợp lệ (cash hoặc transfer)",
        });
    }

    // Kiểm tra đơn hàng
    const order = await queryOne("SELECT * FROM pos_orders WHERE id = ?", [id]);
    if (!order) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({ error: "Đơn hàng đã bị hủy" });
    }

    if (order.payment_status === "paid") {
      return res
        .status(400)
        .json({ error: "Đơn hàng đã được thanh toán đầy đủ" });
    }

    if (!order.debt_amount || order.debt_amount <= 0) {
      return res.status(400).json({ error: "Đơn hàng không có nợ" });
    }

    const now = getNow();
    const paidAmount = amount || order.debt_amount;

    // Validate số tiền thanh toán
    if (paidAmount <= 0) {
      return res
        .status(400)
        .json({ error: "Số tiền thanh toán phải lớn hơn 0" });
    }

    if (paidAmount > order.debt_amount) {
      return res
        .status(400)
        .json({
          error: `Số tiền thanh toán không được vượt quá nợ (${order.debt_amount.toLocaleString()}đ)`,
        });
    }

    // Tính toán số nợ còn lại
    const remainingDebt = order.debt_amount - paidAmount;
    const newPaymentStatus = remainingDebt <= 0 ? "paid" : "partial";

    // Cập nhật đơn hàng
    if (payment_method === "cash") {
      await run(
        `
        UPDATE pos_orders SET 
          cash_amount = COALESCE(cash_amount, 0) + ?,
          debt_amount = ?,
          payment_status = ?
        WHERE id = ?
      `,
        [paidAmount, remainingDebt, newPaymentStatus, id],
      );
    } else {
      await run(
        `
        UPDATE pos_orders SET 
          transfer_amount = COALESCE(transfer_amount, 0) + ?,
          debt_amount = ?,
          payment_status = ?
        WHERE id = ?
      `,
        [paidAmount, remainingDebt, newPaymentStatus, id],
      );
    }

    // Log giao dịch thanh toán nợ
    if (order.customer_phone) {
      await run(
        `
        INSERT INTO pos_balance_transactions (
          customer_phone, customer_name, type, amount,
          balance_before, balance_after, order_id,
          notes, created_by, created_at
        ) VALUES (?, ?, 'debt_payment', ?, 0, 0, ?, ?, ?, ?)
      `,
        [
          order.customer_phone,
          order.customer_name,
          paidAmount,
          id,
          `Thanh toán nợ đơn ${order.code} bằng ${payment_method === "cash" ? "tiền mặt" : "chuyển khoản"}`,
          req.user.username,
          now,
        ],
      );
    }

    res.json({
      success: true,
      message: "Đã xác nhận thanh toán thành công",
      data: {
        order_id: id,
        order_code: order.code,
        paid_amount: paidAmount,
        payment_method: payment_method,
        remaining_debt: remainingDebt,
        payment_status: newPaymentStatus,
      },
    });
  } catch (err) {
    console.error("Pay debt error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**

/**
 * PUT /api/pos/orders/:id/cancel
 * Hủy đơn hàng - hoàn tiền vào pos_wallets + hoàn kho SX
 * ATOMIC: Hoàn ví + cập nhật trạng thái trong 1 transaction
 */
router.put(
  "/:id/cancel",
  authenticate,
  checkPermission("cancel_order"),
  async (req, res) => {
    try {
      const { reason } = req.body;
      const order = await queryOne("SELECT * FROM pos_orders WHERE id = ?", [
        req.params.id,
      ]);

      if (!order) {
        return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
      }
      if (order.status === "cancelled") {
        return res.status(400).json({ error: "Đơn hàng đã được hủy trước đó" });
      }

      const now = getNow();

      // ========== ATOMIC TRANSACTION: Hoàn tiền + hủy đơn ==========
      const tx = await beginTransaction();
      try {
        // Hoàn lại số dư vào pos_wallets
        if (order.balance_amount > 0 && order.customer_phone) {
          const phone = order.customer_phone;
          const wallet = await tx.queryOne(
            "SELECT * FROM pos_wallets WHERE phone = ?", [phone]
          );

          if (wallet) {
            const balanceBefore = wallet.balance;
            const balanceAfter = wallet.balance + order.balance_amount;

            await tx.run(
              "UPDATE pos_wallets SET balance = ?, total_spent = total_spent - ?, updated_at = ? WHERE phone = ?",
              [balanceAfter, order.balance_amount, now, phone],
            );

            await tx.run(
              `INSERT INTO pos_balance_transactions (
                customer_phone, customer_name, type, amount,
                balance_before, balance_after, order_id,
                notes, created_by, created_at
              ) VALUES (?, ?, 'refund', ?, ?, ?, ?, ?, ?, ?)`,
              [phone, order.customer_name, order.balance_amount,
               balanceBefore, balanceAfter, order.id,
               "Hoàn tiền hủy đơn " + order.code, req.user.username, now],
            );
          }
        }

        // Hoàn lại số dư MẸ vào pos_wallets
        if (order.parent_balance_amount > 0 && order.parent_phone) {
          const parentPhone = order.parent_phone;
          const parentWallet = await tx.queryOne(
            "SELECT * FROM pos_wallets WHERE phone = ?", [parentPhone]
          );

          if (parentWallet) {
            const pBalanceBefore = parentWallet.balance;
            const pBalanceAfter = parentWallet.balance + order.parent_balance_amount;

            await tx.run(
              "UPDATE pos_wallets SET balance = ?, total_spent = total_spent - ?, updated_at = ? WHERE phone = ?",
              [pBalanceAfter, order.parent_balance_amount, now, parentPhone],
            );

            await tx.run(
              `INSERT INTO pos_balance_transactions (
                customer_phone, customer_name, type, amount,
                balance_before, balance_after, order_id,
                notes, created_by, created_at
              ) VALUES (?, ?, 'refund', ?, ?, ?, ?, ?, ?, ?)`,
              [parentPhone, null, order.parent_balance_amount,
               pBalanceBefore, pBalanceAfter, order.id,
               `Hoàn tiền mẹ hủy đơn ${order.code} (KH: ${order.customer_name})`,
               req.user.username, now],
            );
          }
        }

        // ══ GÓI SP: Xử lý khi hủy đơn liên quan gói ══
        // Case 1: Đơn này là đơn "mua gói" → hủy TẤT CẢ customer_packages
        const cancelBuyPkgs = await tx.query(
          "SELECT id, delivered_qty FROM pos_customer_packages WHERE order_id = ?", [order.id]
        );
        if (cancelBuyPkgs && cancelBuyPkgs.length > 0) {
          for (const cp of cancelBuyPkgs) {
            if (cp.delivered_qty > 0) {
              await tx.run(
                `UPDATE pos_customer_packages SET status = 'cancelled', 
                 notes = ?, updated_at = ? WHERE id = ?`,
                [`Hủy gói - đơn mua ${order.code} bị hủy (đã giao ${cp.delivered_qty})`, now, cp.id]
              );
            } else {
              await tx.run("DELETE FROM pos_customer_packages WHERE id = ?", [cp.id]);
              await tx.run("UPDATE pos_orders SET customer_package_id = NULL WHERE customer_package_id = ? AND id != ?", [cp.id, order.id]);
            }
          }
          console.log(`📦 Hủy đơn mua gói: ${cancelBuyPkgs.length} packages`);
        }

        // ══ TIER-1c: Hủy đơn có mua thẻ hội viên → xóa dòng đã ghi (khách không còn được giữ hạng
        // từ đơn đã hoàn tiền). Không vi phạm nguyên tắc "chỉ thêm dòng" — đây là sửa lỗi/hoàn tiền,
        // giống hệt cách gói SP đã xử lý ở trên. Không ảnh hưởng hạng hiện tại nếu khách đã mua thẻ
        // MỚI HƠN sau đó (dòng mới hơn vẫn còn nguyên, "mới nhất còn hạn" vẫn đúng).
        const cancelledMembership = await tx.queryOne(
          "SELECT id, tier_name FROM pos_membership_purchases WHERE order_id = ?", [order.id]
        );
        if (cancelledMembership) {
          await tx.run("DELETE FROM pos_membership_purchases WHERE id = ?", [cancelledMembership.id]);
          console.log(`🎟️ Hủy đơn mua thẻ ${cancelledMembership.tier_name} (đơn ${order.code})`);
        }

        // Case 2: Đơn này là đơn "giao từ gói" → trừ delivered_qty
        const cancelBuyPkgIds = (cancelBuyPkgs || []).map(b => b.id);
        if (order.customer_package_id && !cancelBuyPkgIds.includes(order.customer_package_id)) {
          const cancelItems = await tx.query(
            `SELECT product_id, quantity, unit_price FROM pos_order_items WHERE order_id = ?`, [order.id]
          );
          const deliveredQty = (cancelItems || [])
            .filter(i => i.product_id > 0 && (i.unit_price === 0 || i.unit_price === null))
            .reduce((s, i) => s + i.quantity, 0);
          if (deliveredQty > 0) {
            await tx.run(
              `UPDATE pos_customer_packages 
               SET delivered_qty = MAX(0, delivered_qty - ?),
                   status = CASE WHEN status = 'completed' THEN 'active' ELSE status END,
                   updated_at = ?
               WHERE id = ?`,
              [deliveredQty, now, order.customer_package_id]
            );
            console.log(`📦 Hủy đơn giao: hoàn lại -${deliveredQty} SP cho package #${order.customer_package_id}`);
          }
        }

        // Cập nhật trạng thái đơn hàng
        await tx.run(
          `UPDATE pos_orders 
          SET status = 'cancelled', cancelled_reason = ?, cancelled_by = ?, cancelled_at = ?
          WHERE id = ?`,
          [reason || "Không có lý do", req.user.username, now, order.id],
        );

        await tx.commit();
        console.log(`✅ Hủy đơn ${order.code} - Transaction committed`);
      } catch (txErr) {
        await tx.rollback();
        console.error(`❌ Hủy đơn ${order.code} - Rolled back:`, txErr.message);
        throw txErr;
      }

      // Hoàn kho SX (bên ngoài transaction)
      const orderItems = await query(
        `SELECT oi.*, p.sx_product_type, p.sx_product_id 
        FROM pos_order_items oi
        LEFT JOIN pos_products p ON oi.product_id = p.id
        WHERE oi.order_id = ?`,
        [order.id],
      );
      for (const item of orderItems) {
        if (item.sx_product_type && item.quantity > 0) {
          try {
            await inStockReturn(
              item.sx_product_type, item.sx_product_id,
              item.quantity, order.code,
            );
          } catch (err) {
            console.error(`⚠️ Stock return failed: ${err.message}`);
            try {
              await run(
                `INSERT INTO pos_stock_pending (
                  order_code, order_id, sx_product_type, sx_product_id,
                  product_name, quantity, direction, error_message, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'in', ?, ?)`,
                [order.code, order.id, item.sx_product_type, item.sx_product_id,
                 item.product_name, item.quantity, err.message, now],
              );
            } catch (logErr) {
              console.error("Failed to log pending stock:", logErr.message);
            }
          }
        }
      }

      res.json({ success: true, message: "Đã hủy đơn hàng" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

/**
 * DELETE /api/pos/orders/:id
 * Xóa hẳn đơn hàng (chỉ owner) - hoàn tiền + hoàn kho
 * ATOMIC: Hoàn ví + xóa đơn trong 1 transaction
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res
        .status(403)
        .json({ error: "Chỉ owner mới có quyền xóa đơn hàng" });
    }

    const order = await queryOne("SELECT * FROM pos_orders WHERE id = ?", [
      req.params.id,
    ]);
    if (!order) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }

    const now = getNow();

    // Lấy items trước khi xóa (cần cho hoàn kho SX sau)
    const orderItems = await query(
      `SELECT oi.*, p.sx_product_type, p.sx_product_id 
      FROM pos_order_items oi
      LEFT JOIN pos_products p ON oi.product_id = p.id
      WHERE oi.order_id = ?`,
      [order.id],
    );

    // ========== ATOMIC TRANSACTION: Hoàn tiền + xóa đơn ==========
    const tx = await beginTransaction();
    try {
      // Hoàn lại số dư nếu đã trừ (và đơn chưa bị hủy)
      if (order.balance_amount > 0 && order.customer_phone && order.status !== "cancelled") {
        const phone = order.customer_phone;
        const wallet = await tx.queryOne(
          "SELECT * FROM pos_wallets WHERE phone = ?", [phone]
        );

        if (wallet) {
          const balanceBefore = wallet.balance;
          const balanceAfter = wallet.balance + order.balance_amount;

          await tx.run(
            "UPDATE pos_wallets SET balance = ?, total_spent = total_spent - ?, updated_at = ? WHERE phone = ?",
            [balanceAfter, order.balance_amount, now, phone],
          );

          await tx.run(
            `INSERT INTO pos_balance_transactions (
              customer_phone, customer_name, type, amount,
              balance_before, balance_after, order_id,
              notes, created_by, created_at
            ) VALUES (?, ?, 'refund', ?, ?, ?, ?, ?, ?, ?)`,
            [phone, order.customer_name, order.balance_amount,
             balanceBefore, balanceAfter, order.id,
             "Hoàn tiền xóa đơn " + order.code, req.user.username, now],
          );
        }
      }

      // Hoàn lại số dư MẸ nếu đã trừ (và đơn chưa bị hủy)
      if (order.parent_balance_amount > 0 && order.parent_phone && order.status !== "cancelled") {
        const parentPhone = order.parent_phone;
        const parentWallet = await tx.queryOne(
          "SELECT * FROM pos_wallets WHERE phone = ?", [parentPhone]
        );

        if (parentWallet) {
          const pBalanceBefore = parentWallet.balance;
          const pBalanceAfter = parentWallet.balance + order.parent_balance_amount;

          await tx.run(
            "UPDATE pos_wallets SET balance = ?, total_spent = total_spent - ?, updated_at = ? WHERE phone = ?",
            [pBalanceAfter, order.parent_balance_amount, now, parentPhone],
          );

          await tx.run(
            `INSERT INTO pos_balance_transactions (
              customer_phone, customer_name, type, amount,
              balance_before, balance_after, order_id,
              notes, created_by, created_at
            ) VALUES (?, ?, 'refund', ?, ?, ?, ?, ?, ?, ?)`,
            [parentPhone, null, order.parent_balance_amount,
             pBalanceBefore, pBalanceAfter, order.id,
             `Hoàn tiền mẹ xóa đơn ${order.code} (KH: ${order.customer_name})`,
             req.user.username, now],
          );
        }
      }

      // ══ GÓI SP: Hoàn lại delivered_qty hoặc xóa customer_package ══
      // Case 1: Đơn này là đơn "mua gói" → xóa TẤT CẢ customer_packages (có thể nhiều gói)
      const buyPkgs = await tx.query(
        "SELECT id FROM pos_customer_packages WHERE order_id = ?", [order.id]
      );
      if (buyPkgs && buyPkgs.length > 0) {
        for (const bp of buyPkgs) {
          await tx.run("UPDATE pos_orders SET customer_package_id = NULL WHERE customer_package_id = ? AND id != ?", [bp.id, order.id]);
        }
        await tx.run("DELETE FROM pos_customer_packages WHERE order_id = ?", [order.id]);
        console.log(`📦 Xóa ${buyPkgs.length} customer_packages (đơn mua gói bị xóa)`);
      }
      // Case 2: Đơn này là đơn "giao từ gói" → trừ delivered_qty
      const buyPkgIds = (buyPkgs || []).map(b => b.id);
      if (order.customer_package_id && !buyPkgIds.includes(order.customer_package_id)) {
        const deliveredQty = orderItems
          .filter(i => i.product_id > 0 && (i.unit_price === 0 || i.unit_price === null))
          .reduce((s, i) => s + i.quantity, 0);
        if (deliveredQty > 0) {
          await tx.run(
            `UPDATE pos_customer_packages 
             SET delivered_qty = MAX(0, delivered_qty - ?),
                 status = CASE WHEN status = 'completed' THEN 'active' ELSE status END,
                 updated_at = ?
             WHERE id = ?`,
            [deliveredQty, now, order.customer_package_id]
          );
          console.log(`📦 Hoàn lại -${deliveredQty} SP cho package #${order.customer_package_id}`);
        }
      }

      // Xóa records liên quan (tất cả bảng có FK → pos_orders)
      await tx.run("DELETE FROM pos_order_items WHERE order_id = ?", [order.id]);
      await tx.run("DELETE FROM pos_refund_requests WHERE order_id = ?", [order.id]);
      await tx.run("DELETE FROM pos_damage_logs WHERE order_id = ?", [order.id]);
      await tx.run("DELETE FROM pos_promotion_usage WHERE order_id = ?", [order.id]);
      await tx.run("DELETE FROM pos_invoice_logs WHERE order_id = ?", [order.id]);
      await tx.run("DELETE FROM pos_orders WHERE id = ?", [order.id]);

      await tx.commit();
      console.log(`✅ Xóa đơn ${order.code} - Transaction committed`);
    } catch (txErr) {
      await tx.rollback();
      console.error(`❌ Xóa đơn ${order.code} - Rolled back:`, txErr.message);
      throw txErr;
    }

    // Hoàn kho SX (bên ngoài transaction)
    if (order.status !== "cancelled") {
      for (const item of orderItems) {
        if (item.sx_product_type && item.quantity > 0) {
          try {
            await inStockReturn(
              item.sx_product_type, item.sx_product_id,
              item.quantity, order.code,
            );
          } catch (err) {
            console.error(`⚠️ Stock return failed: ${err.message}`);
            try {
              await run(
                `INSERT INTO pos_stock_pending (
                  order_code, order_id, sx_product_type, sx_product_id,
                  product_name, quantity, direction, error_message, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'in', ?, ?)`,
                [order.code, order.id, item.sx_product_type, item.sx_product_id,
                 item.product_name, item.quantity, err.message, now],
              );
            } catch (logErr) {
              console.error("Failed to log pending stock:", logErr.message);
            }
          }
        }
      }
    }

    res.json({ success: true, message: "Đã xóa đơn hàng" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
