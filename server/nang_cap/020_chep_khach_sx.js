/**
 * Bước 020 (KHACH-APP-1 B): chép LẦN CUỐI khách SX còn THIẾU trong pos_customers — sau bước này POS thôi đọc khách từ SX.
 * truoc() (ngoài giao dịch): SX trả danh sách khác rỗng → chép; SX không trả lời / không cấu hình / trả rỗng hay không phải danh sách →
 * HOÃN (danh sách quầy vẫn chạy từ pos_customers; lần khởi động sau thử lại). chay: chỉ THÊM khách thiếu qua taoKhach (cùng hàm tạo
 * khách — QR không trùng, ON CONFLICT(phone) DO NOTHING) — KHÔNG ghi đè dòng đã có (POS là bản đúng). Sao lưu _sao_luu_020_pos_customers
 * trước khi chép (khuôn themCot). Nhật ký: một dòng pos_sync_logs type 'chep_khach_sx' (record_count = số đã thêm, details =
 * {sx, da_co, them, bo_qua, truoc, sau}) + console — chủ quán đối chiếu sau = truoc + them, sx = da_co + them + bo_qua.
 */
const { callSxApi } = require('../utils/sxApi');
const { taoKhach } = require('../utils/khachMoi');
const { normalizePhone, getNow } = require('../utils/helpers');

module.exports.truoc = async () => {
  try {
    const ds = await callSxApi('/api/pos/customers/export');
    if (!Array.isArray(ds) || ds.length === 0) return { hoan: 'SX trả danh sách rỗng / sai dạng' };
    return { du_lieu: ds };
  } catch (e) {
    return { hoan: 'SX không trả lời: ' + e.message };
  }
};

module.exports.chay = async (tx, ctx, ds) => {
  const dem = async () => Number((await tx.queryOne('SELECT COUNT(*) AS n FROM pos_customers')).n);
  const truoc = await dem();
  if (truoc > 0) await tx.run('CREATE TABLE IF NOT EXISTS _sao_luu_020_pos_customers AS SELECT * FROM pos_customers');
  const daCo = new Set((await tx.query('SELECT phone FROM pos_customers')).map((d) => d.phone));
  const so = { sx: ds.length, da_co: 0, them: 0, bo_qua: 0 };
  for (const x of ds) {
    const c = x && typeof x === 'object' ? x : {};
    if (typeof c.phone === 'string' && daCo.has(normalizePhone(c.phone))) { so.da_co++; continue; }   // đã có: không đọc / ghi thêm
    const t = await taoKhach({ phone: c.phone, name: c.name, notes: c.notes, parent_phone: c.parent_phone, relationship: c.relationship,
      customer_type: 'subscription', sync_status: 'synced', sx_status: 'active', created_by: 'chep_sx' }, tx);
    if (t.loi) so.bo_qua++; else if (t.trung) so.da_co++; else so.them++;
  }
  const ghi = { ...so, truoc, sau: await dem() };
  await tx.run(`INSERT INTO pos_sync_logs (type, record_count, details, status, created_by, created_at)
    VALUES ('chep_khach_sx', ?, ?, 'success', 'nang_cap', ?)`, [so.them, JSON.stringify(ghi), getNow()]);
  console.log(`📋 Chép khách SX lần cuối: SX ${ghi.sx} · đã có ${ghi.da_co} · thêm ${ghi.them} · bỏ ${ghi.bo_qua} · POS trước ${truoc} → sau ${ghi.sau}`);
};
