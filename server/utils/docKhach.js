/**
 * KHACH-APP-1 (A) — MỘT hàm đọc khách cho bốn đường GET /v2/customers (danh sách, tìm, hồ sơ, hồ sơ đầy đủ). Nguồn DUY NHẤT pos_customers
 * (mọi dòng — chủ quán Q3 07.11) + đăng ký chưa thành khách; KHÔNG gọi SX. Mỗi SĐT một dòng (dòng khách thắng đăng ký). Ghép ví, điểm còn
 * hạn, hạng (hangNhieuKhach — cùng hàm quầy), tên + số dư mẹ. Không trả cột bí mật (password, pin_code): chọn trường, không rải dòng.
 * dangKy: 'cho' (danh sách — chỉ đăng ký pending, như trước) | 'tat_ca' (tìm / hồ sơ — mọi trạng thái, như trước).
 * Dạng trả ra giữ của đường SX cũ (source 'sx', is_synced) để màn quầy không đổi; thêm xung_ho.
 */
const { query } = require('../database');
const { getNow } = require('./helpers');
const { hangNhieuKhach } = require('./membershipStatus');

const theoSdt = (ds, khoa = 'phone') => Object.fromEntries(ds.map((d) => [d[khoa], d]));

async function docKhach({ dangKy = 'cho' } = {}) {
  const khach = await query('SELECT * FROM pos_customers ORDER BY id');
  const dk = await query(`SELECT * FROM pos_registrations${dangKy === 'cho' ? " WHERE status = 'pending'" : ''} ORDER BY id`);
  const vi = theoSdt(await query('SELECT phone, balance, total_topup, total_spent FROM pos_wallets'));
  const diem = theoSdt(await query(`SELECT customer_phone, COALESCE(SUM(points), 0) AS points FROM pos_point_transactions
    WHERE expires_at IS NULL OR expires_at > ? GROUP BY customer_phone`, [getNow()]), 'customer_phone');
  const hang = await hangNhieuKhach(query, getNow);
  const ten = { ...Object.fromEntries(dk.map((r) => [r.phone, r.name])), ...Object.fromEntries(khach.map((c) => [c.phone, c.name])) };

  const chung = (d) => {
    const me = d.parent_phone || null;
    return {
      name: d.name, phone: d.phone, notes: d.notes ?? null, parent_phone: me, parent_name: me ? ten[me] || null : null,
      relationship: d.relationship ?? null, balance: vi[d.phone]?.balance || 0, total_topup: vi[d.phone]?.total_topup || 0,
      total_spent: vi[d.phone]?.total_spent || 0, parent_balance: me ? vi[me]?.balance || 0 : 0, points: diem[d.phone]?.points || 0,
      membership: hang[d.phone] || null,
    };
  };
  const ra = new Map();
  for (const c of khach) {
    ra.set(c.phone, { id: c.id, ...chung(c), status: 'active', subscriptions: [], source: 'sx', is_synced: true, xung_ho: c.xung_ho ?? null,
      discount_type: c.discount_type || null, discount_value: c.discount_value || 0, discount_note: c.discount_note || null,
      address: c.address || null, ngay_sinh: c.ngay_sinh || null, customer_type: c.customer_type || null });
  }
  for (const r of dk) {
    if (ra.has(r.phone)) continue;
    ra.set(r.phone, { ...chung(r), source: 'pos', is_synced: false, is_pending: r.status === 'pending', registration_id: r.id,
      requested_product: r.requested_product, xung_ho: null, discount_type: null, discount_value: 0, discount_note: null,
      address: null, ngay_sinh: null, customer_type: null });
  }
  return [...ra.values()];
}

module.exports = { docKhach };
