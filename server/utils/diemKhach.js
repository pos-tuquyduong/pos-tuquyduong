/**
 * Điểm + ví voucher theo SĐT — MỘT nơi cho /loyalty/* (quầy, dịch vụ) và /api/kh/* (App KH). KH-API-1: TÁCH NGUYÊN từ
 * routes/loyalty.js, không đổi câu SQL hay cách suy trạng thái.
 */
const { query, queryOne } = require('../database');
const { getNow } = require('./helpers');
const { moTaVoucher, kieuCuaMa, xetVoucherConDung } = require('./voucherCode');   // VOUCHER-2: câu khách thấy + Q17 phép "còn dùng được" — MỘT hàm cho quầy và App

// Số dư điểm = SUM(points) các dòng CÒN HẠN. Không lưu số dư rời (bài học từ ví).
const BALANCE_SQL = `
  SELECT COALESCE(SUM(points), 0) AS points
  FROM pos_point_transactions
  WHERE customer_phone = ? AND (expires_at IS NULL OR expires_at > ?)
`;

/** Số dư điểm còn hạn + 50 dòng điểm gần nhất. */
async function layDiemKhach(phone) {
  const now = getNow();
  const row = await queryOne(BALANCE_SQL, [phone, now]);
  const history = await query(
    `SELECT id, type, points, order_id, expires_at, reason, created_at
     FROM pos_point_transactions
     WHERE customer_phone = ?
     ORDER BY id DESC LIMIT 50`,
    [phone],
  );
  return { points: row?.points || 0, history };
}

/** Ví voucher của khách; tatCa = cả đã dùng / hết hạn. */
async function layVoucherKhach(phone, tatCa) {
  // Q17 (chủ quán 13.11): "còn dùng được" = ĐÚNG phép lúc bán (voucherCode.xetVoucherConDung — kiemVoucherDon gọi cùng hàm): mã bật, đơn gốc P20b,
  // chính chủ, chưa dùng (g.status + lượt), hạn của MÃ (valid_from / valid_to), không bị phiên chờ chuyển khoản giữ (Q16). Trước Q17 ví lọc bằng
  // used_count + g.expires_at riêng → chip hiện mà máy chủ từ chối khi hai nơi lệch.
  const rows = await query(
    `SELECT g.id, g.code, g.status, g.status AS trang_thai, g.customer_phone AS chu, g.granted_at, g.expires_at, g.used_order_id, g.used_at,
            r.name AS reward_name, g.nguon,
            d.discount_type, d.discount_value, d.max_discount, d.used_count, d.usage_limit, d.valid_from, d.valid_to, d.is_active,
            d.min_order, d.giam_ship, d.ap_dung, d.chinh_chu
     FROM pos_voucher_grants g
     LEFT JOIN pos_reward_catalog r ON r.id = g.reward_id
     LEFT JOIN pos_discount_codes d ON UPPER(d.code) = UPPER(g.code)
     WHERE g.customer_phone = ?
     ORDER BY g.id DESC`,
    [phone],
  );
  const ra = [];
  for (const v of rows) {
    const loi = await xetVoucherConDung(v, { phone });
    if (loi && !tatCa) continue;
    const status = !loi ? 'available' : loi[0] === 'VOUCHER_DA_DUNG' ? 'used' : loi[0] === 'VOUCHER_HET_HAN' ? 'expired' : 'disabled';
    const { trang_thai, chu, usage_limit, valid_from, valid_to, ...dong } = v;   // eslint-disable-line no-unused-vars -- cột phụ cho phép xét, trả ra y cũ
    ra.push({
      ...dong,
      status,
      is_used: status === 'used',
      is_expired: status === 'expired',
      // VOUCHER-2: câu dựng từ luật đã chụp vào mã (sửa mẫu sau không đổi câu của voucher đã phát) + kiểu để quầy / App lọc.
      kieu: kieuCuaMa(v),
      mo_ta: moTaVoucher({ kieu: kieuCuaMa(v), gia_tri: v.discount_value, tran: v.max_discount, don_toi_thieu: v.min_order, ap_dung: v.ap_dung,
        het_han: v.expires_at }),
    });
  }
  return ra;
}

/**
 * KH-API-1 (E3) — mã giảm khách mới của DỮ LIỆU CŨ (nhận trước VOUCHER-2) cho SĐT này, CÒN dùng được: hồi đó /claim không ghi
 * pos_voucher_grants, mã voucher = đúng mã in bill, cột gắn SĐT là pos_signup_codes.claimed_phone. Từ VOUCHER-2 (Q2) /claim phát một mã
 * RIÊNG qua phatVoucher (dòng pos_voucher_grants nguon 'khach_moi', hiện ở layVoucherKhach) — mã riêng khác mã in bill nên không lọt vào đây.
 * Chỉ đọc.
 */
async function layMaKhachMoi(phone) {
  return query(
    `SELECT d.code, d.discount_type, d.discount_value, d.min_order, d.discount_scope, d.valid_to
     FROM pos_signup_codes s
     JOIN pos_discount_codes d ON UPPER(d.code) = UPPER(s.code)
     WHERE s.claimed_phone = ? AND COALESCE(d.used_count, 0) = 0 AND COALESCE(d.is_active, 1) = 1
       AND (d.valid_to IS NULL OR d.valid_to >= ?)
     ORDER BY s.id DESC`,
    [phone, getNow().slice(0, 10)],
  );
}

module.exports = { BALANCE_SQL, layDiemKhach, layVoucherKhach, layMaKhachMoi };
