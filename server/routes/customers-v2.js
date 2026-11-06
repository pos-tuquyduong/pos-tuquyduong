/**
 * POS System - Customers V2 Routes
 * API tra cứu khách (merge SX + POS wallets + registrations)
 * Phase B: Thêm API cập nhật chiết khấu + ghi chú
 * 
 * TURSO MIGRATION: Tất cả database calls dùng await
 */

const express = require("express");
const { query, queryOne, run } = require("../database");
const { authenticate, checkPermission } = require("../middleware/auth");
const { normalizePhone, isValidPhone, getNow } = require("../utils/helpers");
const { datNgaySinh, thanLoi } = require("./chuong-trinh");   // CT-1a
const { callSxApi } = require("../utils/sxApi");
const { hangNhieuKhach } = require("../utils/membershipStatus");

const router = express.Router();

const SX_API_KEY = process.env.SX_API_KEY || "";

// Helper: Lấy khách từ SX + lazy cache vào pos_customers
let lastCacheTime = 0;
const CACHE_INTERVAL = 5 * 60 * 1000; // Cache mỗi 5 phút

async function fetchSXCustomers() {
  try {
    if (!SX_API_KEY) return await getLocalCachedCustomers();
    // ISSUE-2: trước đây dùng fetchUrl() tự viết (http/https thô, KHÔNG timeout)
    // → khi SX treo (không lỗi rõ ràng, chỉ không phản hồi) thì request treo vô thời hạn.
    // callSxApi() đã có AbortController timeout (SX_TIMEOUT_MS, mặc định 8s) — dùng lại đúng
    // 1 chỗ, không viết trùng lần 2 (đây là API tìm kiếm khách hàng, cùng lỗi với API danh sách
    // khách hàng đã sửa trước đó — 2 endpoint khác nhau nhưng dùng chung hàm này).
    const customers = await callSxApi("/api/pos/customers/export");

    // Lazy cache: lưu vào pos_customers (throttled, không block response)
    if (customers.length > 0 && Date.now() - lastCacheTime > CACHE_INTERVAL) {
      lastCacheTime = Date.now();
      cacheCustomersToLocal(customers).catch(err =>
        console.error("Cache customers error:", err.message)
      );
    }

    return customers;
  } catch (err) {
    console.error("SX API error:", err.message);
    console.warn("⚠️ SX unavailable - dùng cache local");
    return await getLocalCachedCustomers();
  }
}

// Cache SX customers vào pos_customers (silent background)
async function cacheCustomersToLocal(sxCustomers) {
  let cached = 0;
  for (const c of sxCustomers) {
    const phone = normalizePhone(c.phone);
    if (!phone) continue;
    const parentPhone = c.parent_phone ? normalizePhone(c.parent_phone) : null;
    try {
      await run(`
        INSERT INTO pos_customers (phone, name, parent_phone, relationship, sx_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'active', ?, ?)
        ON CONFLICT(phone) DO UPDATE SET
          name = excluded.name,
          parent_phone = excluded.parent_phone,
          relationship = excluded.relationship,
          sx_status = 'active',
          updated_at = excluded.updated_at
      `, [phone, c.name, parentPhone, c.relationship, getNow(), getNow()]);
      cached++;
    } catch (e) { /* skip individual errors */ }
  }
  console.log(`📋 Cached ${cached}/${sxCustomers.length} customers to local`);
}

// Fallback: đọc từ pos_customers khi SX sập
async function getLocalCachedCustomers() {
  const customers = await query(
    "SELECT * FROM pos_customers WHERE sx_status = 'active' OR sx_status IS NULL"
  );
  if (customers.length > 0) {
    console.log(`📋 Fallback: loaded ${customers.length} customers from local cache`);
  }
  return customers.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    notes: c.notes,
    parent_phone: c.parent_phone,
    parent_name: null,
    relationship: c.relationship,
    status: 'active',
    subscriptions: [],
  }));
}

// Helper: Lấy map thông tin bổ sung từ pos_customers (CK + lý do) - ASYNC
async function getCustomerExtrasMap() {
  const extras = await query("SELECT phone, discount_type, discount_value, discount_note, address, customer_type, ngay_sinh FROM pos_customers");
  const map = {};
  extras.forEach((d) => (map[d.phone] = d));
  return map;
}

// ══════════════════════════════════════════════════════
// ROUTES CỤ THỂ - ĐẶT TRƯỚC /:phone
// ══════════════════════════════════════════════════════

/**
 * GET /api/pos/v2/customers/search/:query
 */
router.get("/search/:query", authenticate, async (req, res) => {
  try {
    const q = req.params.query?.trim().toLowerCase();
    if (!q || q.length < 1) {
      return res.status(400).json({ error: "Từ khóa quá ngắn" });
    }

    const sxCustomers = await fetchSXCustomers();
    const registrations = await query("SELECT * FROM pos_registrations");
    const wallets = await query("SELECT * FROM pos_wallets");
    const extrasMap = await getCustomerExtrasMap();

    const walletMap = {};
    wallets.forEach((w) => (walletMap[w.phone] = w));

    // Tạo map tên để lookup parent_name
    const customerNameMap = {};
    sxCustomers.forEach((c) => {
      customerNameMap[normalizePhone(c.phone)] = c.name;
    });
    registrations.forEach((r) => {
      if (!customerNameMap[r.phone]) {
        customerNameMap[r.phone] = r.name;
      }
    });

    // Tìm trong SX
    const sxResults = sxCustomers
      .filter((c) => c.name?.toLowerCase().includes(q) || c.phone?.includes(q))
      .map((c) => {
        const phone = normalizePhone(c.phone);
        const extras = extrasMap[phone];
        // Lấy parent_balance nếu có parent_phone (từ SX)
        const parentPhone = c.parent_phone ? normalizePhone(c.parent_phone) : null;
        const parentBalance = parentPhone ? (walletMap[parentPhone]?.balance || 0) : 0;
        return {
          ...c,
          balance: walletMap[phone]?.balance || 0,
          parent_balance: parentBalance, // Thêm số dư mẹ
          source: "sx",
          discount_type: extras?.discount_type || null,
          discount_value: extras?.discount_value || 0,
          discount_note: extras?.discount_note || null,
          address: extras?.address || null,
          customer_type: extras?.customer_type || null,
        };
      });

    // Tìm trong registrations
    const sxPhones = new Set(sxCustomers.map((c) => normalizePhone(c.phone)));
    const regResults = registrations
      .filter(
        (r) =>
          !sxPhones.has(r.phone) &&
          (r.name?.toLowerCase().includes(q) || r.phone?.includes(q)),
      )
      .map((r) => {
        const extras = extrasMap[r.phone];
        // Lấy parent_balance nếu có parent_phone (từ registrations)
        const parentPhone = r.parent_phone ? normalizePhone(r.parent_phone) : null;
        const parentBalance = parentPhone ? (walletMap[parentPhone]?.balance || 0) : 0;
        return {
          name: r.name,
          phone: r.phone,
          balance: walletMap[r.phone]?.balance || 0,
          parent_phone: parentPhone, // Thêm SĐT mẹ
          parent_name: parentPhone ? customerNameMap[parentPhone] || null : null, // Lookup tên mẹ
          parent_balance: parentBalance, // Thêm số dư mẹ
          source: "pos",
          is_pending: r.status === "pending",
          discount_type: extras?.discount_type || null,
          discount_value: extras?.discount_value || 0,
          notes: r.notes,
          discount_note: extras?.discount_note || null,
          address: extras?.address || null,
          customer_type: extras?.customer_type || null,
        };
      });

    res.json({ results: [...sxResults, ...regResults].slice(0, 20) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════
// ROUTES CHUNG
// ══════════════════════════════════════════════════════

/**
 * GET /api/pos/v2/customers
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const sxCustomers = await fetchSXCustomers();
    const wallets = await query("SELECT * FROM pos_wallets");
    const registrations = await query(
      "SELECT * FROM pos_registrations WHERE status = 'pending'",
    );
    const extrasMap = await getCustomerExtrasMap();

    const walletMap = {};
    wallets.forEach((w) => (walletMap[w.phone] = w));

    // LOY-1.5: số dư điểm còn hạn theo SĐT (đọc-thôi)
    const nowStr = getNow();
    const pointRows = await query(
      `SELECT customer_phone, COALESCE(SUM(points),0) AS points
       FROM pos_point_transactions
       WHERE expires_at IS NULL OR expires_at > ?
       GROUP BY customer_phone`,
      [nowStr],
    );
    const pointsMap = {};
    pointRows.forEach((p) => (pointsMap[p.customer_phone] = p.points));

    const regMap = {};
    registrations.forEach((r) => (regMap[r.phone] = r));

    // TIER-1c / HANG-1: hạng hiện tại (thứ bậc CAO NHẤT còn hạn) — CÙNG hàm với quầy (membershipStatus.js), 2 câu đọc, không N+1
    const tierMap = await hangNhieuKhach(query, getNow);

    // Merge SX + wallets
    const result = sxCustomers.map((c) => {
      const phone = normalizePhone(c.phone);
      const wallet = walletMap[phone];
      const extras = extrasMap[phone];
      delete regMap[phone];
      return {
        ...c,
        phone,
        balance: wallet?.balance || 0,
        points: pointsMap[phone] || 0,
        source: "sx",
        is_synced: true,
        discount_type: extras?.discount_type || null,
        discount_value: extras?.discount_value || 0,
        discount_note: extras?.discount_note || null,
        address: extras?.address || null,
        ngay_sinh: extras?.ngay_sinh || null,   // CT-1a
          customer_type: extras?.customer_type || null,
        membership: tierMap[phone] || null,
      };
    });

    // Thêm pending
    Object.values(regMap).forEach((r) => {
      const extras = extrasMap[r.phone];
      result.push({
        name: r.name,
        phone: r.phone,
        balance: walletMap[r.phone]?.balance || 0,
        points: pointsMap[r.phone] || 0,
        source: "pos",
        is_synced: false,
        is_pending: true,
        registration_id: r.id,
        requested_product: r.requested_product,
        membership: tierMap[r.phone] || null,
        discount_type: extras?.discount_type || null,
        discount_value: extras?.discount_value || 0,
        notes: r.notes,
        discount_note: extras?.discount_note || null,
        address: extras?.address || null,
        ngay_sinh: extras?.ngay_sinh || null,   // CT-1a
          customer_type: extras?.customer_type || null,
      });
    });

    res.json({ customers: result, total: result.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════
// ROUTES CÓ PARAMETER - ĐẶT SAU CÙNG
// ══════════════════════════════════════════════════════

/**
 * PUT /api/pos/v2/customers/:phone/address
 * Cập nhật địa chỉ khách hàng
 */
router.put("/:phone/address", authenticate, checkPermission('manage_users'), async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) {
      return res.status(400).json({ error: "SĐT không hợp lệ" });
    }

    const { address } = req.body;

    // Kiểm tra khách có tồn tại trong pos_customers không
    const existing = await queryOne("SELECT id FROM pos_customers WHERE phone = ?", [phone]);
    
    if (existing) {
      await run(`
        UPDATE pos_customers 
        SET address = ?, updated_at = ? 
        WHERE phone = ?
      `, [address || null, getNow(), phone]);
    } else {
      // Insert mới (khách từ SX chưa có record trong pos_customers)
      await run(`
        INSERT INTO pos_customers (phone, name, address, created_at) 
        VALUES (?, ?, ?, ?)
      `, [phone, 'Khách hàng', address || null, getNow()]);
    }

    res.json({ success: true, phone, address: address || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/pos/v2/customers/:phone/discount
 * KHACH-CK-1: chỉ còn ghi "Ghi chú khách" (cột discount_note, in trên hoá đơn) — đường màn Khách hàng dùng. Chiết khấu riêng từng
 * khách đã bỏ (chủ quán 29.10) → mức > 0 trả 400 CHIET_KHAU_RIENG_DA_BO (cùng câu, cùng mã với customers.js); mức luôn ghi 0.
 */
router.put("/:phone/discount", authenticate, checkPermission('manage_users'), async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) {
      return res.status(400).json({ error: "SĐT không hợp lệ" });
    }

    const { discount_value, discount_note } = req.body;
    if (Number(discount_value) > 0) {
      return res.status(400).json({ error: 'Đã bỏ chiết khấu riêng từng khách — dùng hạng thành viên hoặc mã giảm', code: 'CHIET_KHAU_RIENG_DA_BO' });
    }

    // Kiểm tra khách có tồn tại trong pos_customers không
    const existing = await queryOne("SELECT id FROM pos_customers WHERE phone = ?", [phone]);
    
    if (existing) {
      await run(`
        UPDATE pos_customers 
        SET discount_type = 'percent', discount_value = 0, discount_note = ?, updated_at = ?
        WHERE phone = ?
      `, [discount_note || null, getNow(), phone]);
    } else {
      // Insert mới (khách từ SX hoặc chưa có trong pos_customers)
      await run(`
        INSERT INTO pos_customers (phone, name, discount_type, discount_value, discount_note, created_at) 
        VALUES (?, ?, 'percent', 0, ?, ?)
      `, [phone, 'Khách hàng', discount_note || null, getNow()]);
    }

    res.json({ 
      success: true, 
      phone,
      discount_type: 'percent',
      discount_value: 0,
      discount_note: discount_note || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/pos/v2/customers/:phone/ngay-sinh   (CT-1a)
 * Ngày sinh nhập MỘT lần: đang trống → nhân viên nào cũng nhập được; ĐÃ CÓ → chỉ người có quyền sua_ngay_sinh (mặc định chỉ chủ quán),
 * bắt `ly_do`. Cùng hàm datNgaySinh với App (routes/chuong-trinh.js): kiểm ngày, giao dịch, sổ pos_ngay_sinh_sua. KHÔNG tạo khách mới,
 * KHÔNG lưu số căn cước.
 */
const quyenSuaNgaySinh = checkPermission('sua_ngay_sinh');
const traLoiNgaySinh = (res, l) => res.status(l.status).json({ success: false, error: l.error, code: l.code });
router.put("/:phone/ngay-sinh", authenticate, async (req, res, next) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone || !isValidPhone(phone)) return traLoiNgaySinh(res, thanLoi('SDT_KHONG_HOP_LE'));
    req.phoneNgaySinh = phone;
    const kh = await queryOne("SELECT ngay_sinh FROM pos_customers WHERE phone = ?", [phone]);
    if (!kh) return traLoiNgaySinh(res, thanLoi('KHACH_KHONG_TON_TAI'));
    if (kh.ngay_sinh == null) return next();   // đang trống: nhân viên nào cũng nhập được
    return quyenSuaNgaySinh(req, res, () => { req.duocSuaNgaySinh = true; next(); });   // đã có: cần quyền riêng
  } catch (err) {
    console.error('Ngày sinh lỗi:', err.message);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ', code: 'LOI_MAY_CHU' });
  }
}, async (req, res) => {
  try {
    const kq = await datNgaySinh({ phone: req.phoneNgaySinh, ngaySinh: (req.body || {}).ngay_sinh, lyDo: (req.body || {}).ly_do,
      nguoi: req.user.username, choPhepSua: req.duocSuaNgaySinh === true });
    if (kq.loi) return traLoiNgaySinh(res, kq.loi);
    res.json({ success: true, phone: req.phoneNgaySinh, ngay_sinh: kq.ngay_sinh });
  } catch (err) {
    console.error('Ngày sinh lỗi:', err.message);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ', code: 'LOI_MAY_CHU' });
  }
});

/**
 * GET /api/pos/v2/customers/:phone
 */
router.get("/:phone", authenticate, async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) {
      return res.status(400).json({ error: "SĐT không hợp lệ" });
    }

    const sxCustomers = await fetchSXCustomers();
    const sxCustomer = sxCustomers.find(
      (c) => normalizePhone(c.phone) === phone,
    );
    const wallet = await queryOne("SELECT * FROM pos_wallets WHERE phone = ?", [
      phone,
    ]);
    const registration = await queryOne(
      "SELECT * FROM pos_registrations WHERE phone = ?",
      [phone],
    );
    const posCustomer = await queryOne(
      "SELECT discount_type, discount_value, discount_note, address, customer_type FROM pos_customers WHERE phone = ?",
      [phone]
    );

    if (!sxCustomer && !wallet && !registration) {
      return res.status(404).json({ error: "Không tìm thấy khách hàng" });
    }

    let customer = {};
    if (sxCustomer) {
      customer = { ...sxCustomer, source: "sx", is_synced: true };
    } else if (registration) {
      customer = {
        name: registration.name,
        phone: registration.phone,
        notes: registration.notes,
        source: "pos",
        is_synced: false,
        is_pending: registration.status === "pending",
        registration_id: registration.id,
      };
    } else {
      customer = { phone, source: "pos", is_retail: true };
    }

    customer.balance = wallet?.balance || 0;
    customer.total_topup = wallet?.total_topup || 0;
    customer.total_spent = wallet?.total_spent || 0;
    customer.discount_type = posCustomer?.discount_type || null;
    customer.discount_value = posCustomer?.discount_value || 0;
    customer.discount_note = posCustomer?.discount_note || null;
    customer.address = posCustomer?.address || null;
    customer.customer_type = posCustomer?.customer_type || null;

    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/v2/customers/:phone/full
 */
router.get("/:phone/full", authenticate, async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) {
      return res.status(400).json({ error: "SĐT không hợp lệ" });
    }

    const sxCustomers = await fetchSXCustomers();
    const sxCustomer = sxCustomers.find(
      (c) => normalizePhone(c.phone) === phone,
    );
    const wallet = await queryOne("SELECT * FROM pos_wallets WHERE phone = ?", [
      phone,
    ]);
    const registration = await queryOne(
      "SELECT * FROM pos_registrations WHERE phone = ?",
      [phone],
    );
    const posCustomer = await queryOne(
      "SELECT discount_type, discount_value, discount_note, address, customer_type FROM pos_customers WHERE phone = ?",
      [phone]
    );

    let customer = {};
    if (sxCustomer) {
      customer = { ...sxCustomer, source: "sx" };
    } else if (registration) {
      customer = {
        name: registration.name,
        phone,
        source: "pos",
        is_pending: registration.status === "pending",
      };
    } else if (wallet) {
      customer = { phone, source: "pos", is_retail: true };
    } else {
      return res.status(404).json({ error: "Không tìm thấy" });
    }

    customer.balance = wallet?.balance || 0;
    customer.discount_type = posCustomer?.discount_type || null;
    customer.discount_value = posCustomer?.discount_value || 0;
    customer.discount_note = posCustomer?.discount_note || null;
    customer.address = posCustomer?.address || null;
    customer.customer_type = posCustomer?.customer_type || null;

    const transactions = await query(
      "SELECT * FROM pos_balance_transactions WHERE customer_phone = ? ORDER BY created_at DESC LIMIT 20",
      [phone],
    );
    const orders = await query(
      "SELECT * FROM pos_orders WHERE customer_phone = ? ORDER BY created_at DESC LIMIT 20",
      [phone],
    );

    res.json({ customer, transactions, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
