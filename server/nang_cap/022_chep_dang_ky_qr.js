/**
 * Bước 022 (KHACH-APP-1 B, chủ quán 07.11; số 021 đã thuộc GIAO-1 — hai file cùng số thì bộ chạy bỏ qua file sau): phần chép lần cuối KHÔNG cần SX — chạy ngay cả khi bước 020 đang HOÃN.
 *  (1) đăng ký CHỜ (pos_registrations status 'pending') mà SĐT chưa có trong pos_customers → thành khách qua taoKhach (cùng hàm tạo
 *      khách; created_by giữ người nhập đăng ký). Đăng ký đã xuất sang SX không chép ở đây (về qua bước 020).
 *  (2) khách có qr_code TRỐNG (NULL / '') → cấp mã sinhQrKhongTrung — chỉ điền ô trống (điều kiện trong câu ghi), không đổi mã đã có,
 *      không đổi cột khác (kể cả updated_at).
 * Sao lưu _sao_luu_022_pos_customers trước khi ghi (khuôn themCot). Nhật ký pos_sync_logs type 'chep_khach_dang_ky' (record_count = số
 * đăng ký đã chép, details = {them_dang_ky, bo_qua, cap_qr, truoc, sau}). Kho trống chưa có bảng → bỏ qua (khuôn 003).
 */
const { taoKhach } = require('../utils/khachMoi');
const { sinhQrKhongTrung, getNow } = require('../utils/helpers');

module.exports.chay = async (tx) => {
  const co = async (bang) => !!(await tx.queryOne("SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = ?", [bang]));
  if (!(await co('pos_customers')) || !(await co('pos_registrations')) || !(await co('pos_sync_logs'))) return;
  const dem = async () => Number((await tx.queryOne('SELECT COUNT(*) AS n FROM pos_customers')).n);
  const truoc = await dem();
  const dk = await tx.query(`SELECT * FROM pos_registrations WHERE status = 'pending'
    AND phone NOT IN (SELECT phone FROM pos_customers) ORDER BY id`);
  const trong = await tx.query("SELECT id FROM pos_customers WHERE qr_code IS NULL OR qr_code = '' ORDER BY id");
  if (!dk.length && !trong.length) return;
  if (truoc > 0) await tx.run('CREATE TABLE IF NOT EXISTS _sao_luu_022_pos_customers AS SELECT * FROM pos_customers');
  const so = { them_dang_ky: 0, bo_qua: 0, cap_qr: 0 };
  for (const r of dk) {
    const t = await taoKhach({ phone: r.phone, name: r.name, notes: r.notes, parent_phone: r.parent_phone, relationship: r.relationship,
      requested_product: r.requested_product, requested_cycles: r.requested_cycles, created_by: r.created_by }, tx);
    if (t.loi || t.trung) so.bo_qua++; else so.them_dang_ky++;
  }
  for (const { id } of trong) {
    const kq = await tx.run("UPDATE pos_customers SET qr_code = ? WHERE id = ? AND (qr_code IS NULL OR qr_code = '')",
      [await sinhQrKhongTrung(tx.queryOne), id]);
    so.cap_qr += kq.changes;
  }
  const ghi = { ...so, truoc, sau: await dem() };
  await tx.run(`INSERT INTO pos_sync_logs (type, record_count, details, status, created_by, created_at)
    VALUES ('chep_khach_dang_ky', ?, ?, 'success', 'nang_cap', ?)`, [so.them_dang_ky, JSON.stringify(ghi), getNow()]);
  console.log(`📋 Chép đăng ký chờ + cấp QR: thêm ${so.them_dang_ky} · bỏ ${so.bo_qua} · cấp QR ${so.cap_qr} · POS trước ${truoc} → sau ${ghi.sau}`);
};
