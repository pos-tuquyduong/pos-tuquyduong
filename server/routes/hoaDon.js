/**
 * HD-1 — MỘT cửa dữ liệu hoá đơn: GET /api/pos/hoa-don/:id (nhân viên đăng nhập), CHỈ ĐỌC.
 * Hoá đơn ngay sau thanh toán và in lại đều vẽ từ đây (cùng số; màn hình không tự tính tiền).
 * Mọi số tiền lấy từ cột của pos_orders do POST /orders ghi; ở đây chỉ sắp xếp lại và bảo đảm: giá gốc − các khoản giảm + phí giao = tổng
 * hoá đơn, tổng các dòng thanh toán = tổng hoá đơn (đơn cũ ghi thiếu cột → phần lệch dồn vào cách trả chính).
 * N điểm của mã nhận điểm = CÙNG hàm với /signup-codes/nhan-diem (utils/nhanDiem.js).
 */
const express = require('express');
const { query, queryOne } = require('../database');
const { authenticate } = require('../middleware/auth');
const { getNow } = require('../utils/helpers');
const { tienTinhDiem } = require('../utils/diemThat');
const { docDuLieuNhanDiem, tinhDiemNhanMa } = require('../utils/nhanDiem');
const { docCauHinhNhanDiem, CODE_EXPIRE_HOURS } = require('./signup-codes');

const router = express.Router();

// Mục KHÔNG ẩn được khỏi hoá đơn; cài đặt (PUT /settings) từ chối khoá `invoice_an_<mục>`. Client giữ bản sao ở utils/hoaDon.js KHONG_AN.
// Gồm MỌI dòng tiền / thanh toán (ẩn một dòng làm chuỗi giá gốc → tổng và tổng các dòng thanh toán không cân với tổng hoá đơn) và
// các dòng nói tình trạng đơn (huỷ / hoàn, IN LẠI).
const KHONG_AN_DUOC = [
  'ten_quan', 'so_bill', 'lien_khach', 'lien_luu', 'in_lai', 'da_huy', 'da_hoan',
  'gia_goc', 'giam_hang', 'giam_flash', 'giam_ma', 'phi_giao', 'tong',
  'tieu_de_tt', 'tu_tk', 'tu_tk_me', 'ck', 'tm', 'ghi_no', 'dua_tra',
  'tem_in_lai',
];

const so = (v) => Math.round(Number(v) || 0);
const soBill = (code) => String(code || '').split('-').pop();
const cheSdt = (p) => { const s = String(p || '').replace(/\D/g, ''); return s.length >= 7 ? `${s.slice(0, 4)} ••• ${s.slice(-3)}` : s; };

/** Các dòng thanh toán có thật của đơn; tổng luôn bằng tổng hoá đơn. */
function dungThanhToan(o) {
  const tong = so(o.total);
  const t = { tien_mat: so(o.cash_amount), chuyen_khoan: so(o.transfer_amount), tai_khoan: so(o.balance_amount), tai_khoan_me: so(o.parent_balance_amount), ghi_no: so(o.debt_amount) };
  let lech = tong - Object.values(t).reduce((s, x) => s + x, 0);
  const chinh = o.payment_method === 'transfer' ? 'chuyen_khoan' : o.payment_method === 'balance' ? 'tai_khoan' : 'tien_mat';
  if (lech > 0) t[chinh] += lech;
  for (const k of ['tien_mat', 'chuyen_khoan']) if (lech < 0) { const bot = Math.min(t[k], -lech); t[k] -= bot; lech += bot; }
  return ['tai_khoan', 'tai_khoan_me', 'chuyen_khoan', 'tien_mat', 'ghi_no'].filter((k) => t[k] > 0).map((k) => ({ loai: k, so_tien: t[k] }));
}

/** Điểm của ĐÚNG đơn này (in lại không đổi theo số dư lúc in): trước − đổi quà + cộng = hiện có. Khách lẻ → null. */
async function dungDiem(o) {
  if (!o.customer_phone) return null;
  // Đơn rời 'completed' (huỷ / hoàn): P24 ghi dòng 'adjust' âm trừ lại điểm đã cộng (orders.js truDiemDon) → cộng ròng = 0, bill không hứa điểm đã bị trừ.
  const loaiCong = o.status === 'completed' ? "type = 'earn'" : "type IN ('earn', 'adjust')";
  const cong = so((await queryOne(`SELECT COALESCE(SUM(points), 0) AS n FROM pos_point_transactions WHERE order_id = ? AND customer_phone = ? AND ${loaiCong}`, [o.id, o.customer_phone]))?.n);
  const doi = o.discount_code
    ? so((await queryOne(
      `SELECT COALESCE(-SUM(t.points), 0) AS n FROM pos_voucher_grants g JOIN pos_point_transactions t ON t.id = g.point_tx_id
        WHERE UPPER(g.code) = UPPER(?) AND g.customer_phone = ?`, [o.discount_code, o.customer_phone]))?.n)
    : 0;
  const truoc = so((await queryOne(
    `SELECT COALESCE(SUM(points), 0) AS n FROM pos_point_transactions
      WHERE customer_phone = ? AND created_at <= ? AND (order_id IS NULL OR order_id < ?) AND (expires_at IS NULL OR expires_at > ?)`,
    [o.customer_phone, o.created_at, o.id, o.created_at]))?.n);
  return { truoc: truoc + doi, doi_qua: doi, cong, hien_co: truoc + cong };
}

/** Mã in trên bill + số điểm mã sẽ cộng (0 nếu không cộng được / đã dùng / hết hạn). Khách có SĐT → null (mã gắn SĐT, không in ô). */
async function dungMaNhanDiem(o) {
  if (o.customer_phone) return null;
  const m = await queryOne('SELECT code, issued_at, diem_nhan_luc, claimed_at FROM pos_signup_codes WHERE order_id = ? ORDER BY id LIMIT 1', [o.id]);
  if (!m) return null;
  const ch = await docCauHinhNhanDiem();
  const cfg = {};
  for (const r of await query("SELECT key, value FROM pos_settings WHERE key IN ('signup_enabled')")) cfg[r.key] = r.value;
  const uuDai = cfg.signup_enabled === 'true' || cfg.signup_enabled === '1';
  const gioDaQua = (new Date(getNow().replace(' ', 'T') + 'Z') - new Date(String(m.issued_at).replace(' ', 'T') + 'Z')) / 3600000;
  // Đơn phải hoàn tất + đã thu (cùng danh sách trắng với signup-codes.js kiemDonCuaMa). Mỗi loại ưu đãi có cột "đã dùng" và hạn RIÊNG,
  // đúng như đường dùng nó: điểm (/nhan-diem) = diem_nhan_luc + hạn cấu hình; ưu đãi khách mới (/claim) = claimed_at + CODE_EXPIRE_HOURS.
  const donHopLe = o.status === 'completed' && o.payment_status === 'paid';
  const dungDuocDiem = donHopLe && !m.diem_nhan_luc && gioDaQua <= ch.hanGio;
  const dungDuocUuDai = donHopLe && !m.claimed_at && gioDaQua <= CODE_EXPIRE_HOURS;
  let diem = 0;
  if (ch.bat && dungDuocDiem) {
    const { loy, daCong } = await docDuLieuNhanDiem(o.id);
    const kq = tinhDiemNhanMa({ don: o, tienDiem: tienTinhDiem(o), ch, loy, daCong });
    diem = kq.loi ? 0 : kq.diemCong;
  }
  return { ma: m.code, diem, uu_dai: uuDai && dungDuocUuDai, han_gio: ch.hanGio, han_gio_uu_dai: CODE_EXPIRE_HOURS };
}

router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const o = /^[1-9]\d{0,14}$/.test(req.params.id) && Number.isSafeInteger(id) ? await queryOne('SELECT * FROM pos_orders WHERE id = ?', [id]) : null;
    if (!o) return res.status(404).json({ error: 'Không tìm thấy đơn hàng', code: 'KHONG_THAY_DON' });

    const st = {};
    for (const r of await query("SELECT key, value FROM pos_settings WHERE key IN ('store_name','store_address','store_phone')")) st[r.key] = r.value;
    const items = await query('SELECT * FROM pos_order_items WHERE order_id = ? ORDER BY id', [o.id]);
    const gocTong = so(o.subtotal);
    const tongDon = so(o.total);
    const giamHang = so(o.tier_discount);
    // % hạng THẬT đã giảm lúc bán, suy từ giá đã lưu của từng dòng (không lấy % hiện tại của hạng: hạng có thể đã đổi, món nhóm đặc biệt bỏ qua thẻ).
    // Mọi dòng có giảm cùng một % → số đó; các dòng khác % hoặc không dòng nào giảm → null (bill chỉ in tên hạng, không kèm %).
    const phanTramDong = items.filter((m) => m.tier_unit_price != null && so(m.tier_unit_price) < so(m.unit_price)).map((m) => Math.round((so(m.unit_price) - so(m.tier_unit_price)) * 100 / so(m.unit_price)));
    const phanTramHang = phanTramDong.length && phanTramDong.every((p) => p === phanTramDong[0]) ? phanTramDong[0] : null;
    const giamFlash = so(o.flash_discount);
    const phiGiao = so(o.shipping_fee);
    // Khoản giảm bằng mã / quà suy ra từ tổng: giá gốc − hạng − Flash + phí giao − tổng (đơn cũ ghi cột `discount` không thống nhất)
    const giamMa = Math.max(0, gocTong - giamHang - giamFlash + phiGiao - tongDon);
    const soLan = so((await queryOne('SELECT COUNT(*) AS n FROM pos_invoice_logs WHERE order_id = ? AND is_deleted = 0', [o.id]))?.n);

    res.json({
      success: true,
      hoa_don: {
        quan: { ten: st.store_name || '', dia_chi: st.store_address || '', sdt: st.store_phone || '' },
        don: { id: o.id, code: o.code, so_bill: soBill(o.code), gio: o.created_at, nhan_vien: o.created_by || '', trang_thai: o.status, thanh_toan_trang_thai: o.payment_status },
        khach: {
          ten: o.customer_name || 'Khách lẻ', sdt_che: cheSdt(o.customer_phone), la_khach_le: !o.customer_phone,
          hang: o.customer_tier || null, phan_tram: o.customer_tier ? phanTramHang : null,
        },
        mon: items.map((m) => {
          const sl = so(m.quantity);
          const goc = so(m.unit_price);
          const hang = m.tier_unit_price != null && so(m.tier_unit_price) < goc ? so(m.tier_unit_price) : null;
          return {
            so_luong: sl, ten: m.product_name, ghi_chu: m.notes || '', gia_goc: goc, gia_hang: hang,
            thanh_tien_goc: goc * sl, thanh_tien: (hang ?? goc) * sl,
          };
        }),
        tien: { gia_goc: gocTong, giam_hang: giamHang, giam_flash: giamFlash, giam_ma: giamMa, ma_giam: o.discount_code || null, phi_giao: phiGiao, tong: tongDon },
        thanh_toan: dungThanhToan(o),
        khach_dua: o.payment_method === 'cash' ? so(o.cash_received) : 0,
        tra_lai: o.payment_method === 'cash' ? so(o.change_amount) : 0,
        diem: await dungDiem(o),
        ma_nhan_diem: await dungMaNhanDiem(o),
        so_lan_in: soLan,
      },
    });
  } catch (err) {
    console.error('hoa-don error:', err.message);
    res.status(500).json({ error: 'Lỗi máy chủ, thử lại sau', code: 'LOI_MAY_CHU' });
  }
});

module.exports = router;
module.exports.KHONG_AN_DUOC = KHONG_AN_DUOC;
