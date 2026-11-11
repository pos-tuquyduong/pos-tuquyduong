/**
 * POS System - Customers V2 Routes
 * API tra cứu khách. KHACH-APP-1: khách MỘT nguồn pos_customers — bốn đường đọc gọi docKhach (utils/docKhach.js), KHÔNG gọi SX;
 * khách SX còn thiếu chép MỘT lần ở nang_cap/020. Tạo khách (ghi địa chỉ / ghi chú cho SĐT chưa là khách) qua taoKhach (utils/khachMoi.js).
 * Phase B: Thêm API cập nhật chiết khấu + ghi chú
 */

const express = require("express");
const { query, queryOne, run } = require("../database");
const { authenticate, checkPermission } = require("../middleware/auth");
const { normalizePhone, isValidPhone, getNow } = require("../utils/helpers");
const { datNgaySinh, thanLoi } = require("./chuong-trinh");   // CT-1a
const { docKhach } = require("../utils/docKhach");
const { taoKhach } = require("../utils/khachMoi");
const { loiGhi } = require("./wallets");

const router = express.Router();

/** Khách theo SĐT (một dòng của docKhach — đăng ký mọi trạng thái, như trước) hoặc null. */
const motKhach = async (phone) => (await docKhach({ dangKy: "tat_ca" })).find((c) => c.phone === phone) || null;

/** SĐT chưa là khách → tạo qua hàm chung (tên "Khách hàng") trước khi ghi một trường. Trùng (vừa tạo ở nơi khác) cũng được. → loi | null */
async function chacCoKhach(phone, nguoi) {
  if (await queryOne("SELECT id FROM pos_customers WHERE phone = ?", [phone])) return null;
  const t = await taoKhach({ phone, name: "Khách hàng", created_by: nguoi });
  return t.loi || null;
}

// ══════════════════════════════════════════════════════
// ROUTES CỤ THỂ - ĐẶT TRƯỚC /:phone
// ══════════════════════════════════════════════════════

/**
 * GET /api/pos/v2/customers/search/:query — tên / SĐT, tối đa 20 dòng
 */
router.get("/search/:query", authenticate, async (req, res) => {
  try {
    const q = req.params.query?.trim().toLowerCase();
    if (!q || q.length < 1) {
      return res.status(400).json({ error: "Từ khóa quá ngắn" });
    }
    const ds = await docKhach({ dangKy: "tat_ca" });
    res.json({ results: ds.filter((c) => c.name?.toLowerCase().includes(q) || c.phone?.includes(q)).slice(0, 20) });
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
    const customers = await docKhach();
    res.json({ customers, total: customers.length });
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

    if (await chacCoKhach(phone, req.user.username)) return res.status(400).json({ error: "SĐT không hợp lệ", code: "SDT_KHONG_HOP_LE" });
    await run("UPDATE pos_customers SET address = ?, updated_at = ? WHERE phone = ?", [address || null, getNow(), phone]);

    res.json({ success: true, phone, address: address || null });
  } catch (err) {
    loiGhi(res, err);
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

    if (await chacCoKhach(phone, req.user.username)) return res.status(400).json({ error: "SĐT không hợp lệ", code: "SDT_KHONG_HOP_LE" });
    await run(`UPDATE pos_customers SET discount_type = 'percent', discount_value = 0, discount_note = ?, updated_at = ?
      WHERE phone = ?`, [discount_note || null, getNow(), phone]);

    res.json({ 
      success: true, 
      phone,
      discount_type: 'percent',
      discount_value: 0,
      discount_note: discount_note || null
    });
  } catch (err) {
    loiGhi(res, err);
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
 * GET /api/pos/v2/customers/:phone — khách / đăng ký; chỉ có ví → khách lẻ; không gì → 404
 */
router.get("/:phone", authenticate, async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) {
      return res.status(400).json({ error: "SĐT không hợp lệ" });
    }
    const customer = await motKhach(phone);
    if (customer) return res.json(customer);
    const wallet = await queryOne("SELECT * FROM pos_wallets WHERE phone = ?", [phone]);
    if (!wallet) return res.status(404).json({ error: "Không tìm thấy khách hàng" });
    res.json({ phone, source: "pos", is_retail: true, balance: wallet.balance || 0, total_topup: wallet.total_topup || 0,
      total_spent: wallet.total_spent || 0, discount_type: null, discount_value: 0, discount_note: null, address: null, customer_type: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/v2/customers/:phone/full — như /:phone + 20 giao dịch ví + 20 đơn gần nhất
 */
router.get("/:phone/full", authenticate, async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) {
      return res.status(400).json({ error: "SĐT không hợp lệ" });
    }
    let customer = await motKhach(phone);
    if (!customer) {
      const wallet = await queryOne("SELECT balance FROM pos_wallets WHERE phone = ?", [phone]);
      if (!wallet) return res.status(404).json({ error: "Không tìm thấy" });
      customer = { phone, source: "pos", is_retail: true, balance: wallet.balance || 0, discount_type: null, discount_value: 0,
        discount_note: null, address: null, customer_type: null };
    }
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
