/**
 * Điểm + ví voucher theo SĐT — MỘT nơi cho /loyalty/* (quầy, dịch vụ) và /api/kh/* (App KH). KH-API-1: TÁCH NGUYÊN từ
 * routes/loyalty.js, không đổi câu SQL hay cách suy trạng thái.
 */
const { query, queryOne } = require('../database');
const { getNow } = require('./helpers');

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

/** Ví voucher đổi điểm của khách; tatCa = cả đã dùng / hết hạn. */
async function layVoucherKhach(phone, tatCa) {
  const today = getNow().slice(0, 10);
  // "Còn dùng được" = chưa bị luồng bán tiêu (used_count=0, đây mới là nguồn sự thật)
  // + chưa quá hạn + mã còn bật. KHÔNG dựa vào g.status: orders.js chỉ tăng used_count,
  // không đụng bảng grants (LOY-2c sẽ đồng bộ status; tới lúc đó lọc này vẫn đúng).
  const rows = await query(
    `SELECT g.id, g.code, g.status, g.granted_at, g.expires_at, g.used_order_id, g.used_at,
            r.name AS reward_name,
            d.discount_type, d.discount_value, d.max_discount, d.used_count, d.is_active
     FROM pos_voucher_grants g
     LEFT JOIN pos_reward_catalog r ON r.id = g.reward_id
     LEFT JOIN pos_discount_codes d ON UPPER(d.code) = UPPER(g.code)
     WHERE g.customer_phone = ?
     ${tatCa ? '' : `AND COALESCE(d.used_count, 0) = 0
                   AND COALESCE(d.is_active, 1) = 1
                   AND (g.expires_at IS NULL OR g.expires_at >= ?)`}
     ORDER BY g.id DESC`,
    tatCa ? [phone] : [phone, today],
  );

  return rows.map((v) => {
    const used = (v.used_count || 0) > 0;
    const expired = !!(v.expires_at && v.expires_at < today);
    const disabled = v.is_active === 0;
    return {
      ...v,
      // status SUY RA từ nguồn sự thật (used_count của mã + hạn), KHÔNG dùng cột status lưu sẵn
      // → không bao giờ lệch, không cần job đồng bộ. Cột g.status chỉ là vết tích, đừng tin.
      status: used ? 'used' : expired ? 'expired' : disabled ? 'disabled' : 'available',
      is_used: used,
      is_expired: expired,
    };
  });
}

/**
 * KH-API-1 (E3) — mã giảm khách mới phát qua /signup-codes/claim cho SĐT này, CÒN dùng được. /claim không ghi pos_voucher_grants;
 * cột gắn SĐT là pos_signup_codes.claimed_phone, mã voucher = đúng mã in bill (thiết kế 09.08.2026 — claim trước đó phát mã khác,
 * không nối được). Chỉ đọc.
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
