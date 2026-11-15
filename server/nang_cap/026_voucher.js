/**
 * Bước 026 (VOUCHER-2): mẫu voucher + nhiều voucher một đơn. Chỉ THÊM bảng / cột (themCot tự chép bảng sao lưu trước khi ALTER).
 *   pos_mau_voucher                 mẫu voucher của Cài đặt → Voucher (kieu tien | phan_tram | ship_tien | ship_phan_tram; chinh_chu 0 = chia sẻ được).
 *   pos_voucher_grants.nguon        doi_diem (mặc định — mọi grant cũ là voucher đổi điểm) | khach_moi | gioi_thieu | tay …; mau_id, nguon_id;
 *                    .so_tien_giam  số tiền voucher này giảm ở đơn đã dùng (ghi lúc tiêu, xoá lúc trả).
 *   pos_discount_codes.giam_ship / ap_dung / ap_dung_ids / chinh_chu   luật của mẫu CHỤP vào mã lúc phát (sửa mẫu sau không đổi voucher đã phát).
 *   pos_orders.giam_ship            phần phí giao quán bù bằng voucher ship (shipping_fee = phần khách trả).
 *   pos_orders.giam_mon_thuong      1 = đơn từ VOUCHER-2: mã / voucher chỉ giảm món thường → tienDaTra.js tính dòng gói / thẻ / nạp đủ giá (Q7).
 *   pos_settings voucher_toi_da = 3 (INSERT OR IGNORE — không đè cài đặt chủ quán).
 * Dữ liệu (Q9, chủ quán 12.11): ưu đãi khách mới đang chạy kiểu giảm cả đơn → tạo SẴN một mẫu y cấu hình + signup_mau_voucher_id (chỉ khi chưa có);
 *   kiểu giảm 1 món nhóm khach_moi → không tạo, chủ quán chọn mẫu. Bảng chưa có → bỏ qua (kho thử chỉ có bảng kho).
 */
const { getNow } = require('../utils/helpers');

module.exports.chay = async (tx, { themCot }) => {
  const coBang = async (ten) => !!(await tx.queryOne("SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = ?", [ten]));
  await tx.run(`CREATE TABLE IF NOT EXISTS pos_mau_voucher (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ten TEXT NOT NULL,
    kieu TEXT NOT NULL,
    gia_tri INTEGER NOT NULL,
    tran INTEGER NOT NULL DEFAULT 0,
    don_toi_thieu INTEGER NOT NULL DEFAULT 0,
    ap_dung TEXT NOT NULL DEFAULT 'tat_ca',
    ap_dung_ids TEXT,
    han_ngay INTEGER NOT NULL,
    chinh_chu INTEGER NOT NULL DEFAULT 0,
    bat INTEGER NOT NULL DEFAULT 1,
    tao_boi TEXT,
    tao_luc TEXT NOT NULL,
    sua_luc TEXT
  )`);
  if (await coBang('pos_voucher_grants')) {
    await themCot('pos_voucher_grants', "nguon TEXT NOT NULL DEFAULT 'doi_diem'");
    await themCot('pos_voucher_grants', 'mau_id INTEGER');
    await themCot('pos_voucher_grants', 'nguon_id INTEGER');
    await themCot('pos_voucher_grants', 'so_tien_giam INTEGER');
    await tx.run('CREATE INDEX IF NOT EXISTS idx_voucher_grant_don ON pos_voucher_grants(used_order_id)');
  }
  if (await coBang('pos_discount_codes')) {
    await themCot('pos_discount_codes', 'giam_ship INTEGER NOT NULL DEFAULT 0');
    await themCot('pos_discount_codes', "ap_dung TEXT NOT NULL DEFAULT 'tat_ca'");
    await themCot('pos_discount_codes', 'ap_dung_ids TEXT');
    await themCot('pos_discount_codes', 'chinh_chu INTEGER NOT NULL DEFAULT 0');
  }
  if (await coBang('pos_orders')) {
    await themCot('pos_orders', 'giam_ship INTEGER NOT NULL DEFAULT 0');
    await themCot('pos_orders', 'giam_mon_thuong INTEGER NOT NULL DEFAULT 0');
  }
  if (!(await coBang('pos_settings'))) return;
  await tx.run("INSERT OR IGNORE INTO pos_settings (key, value, updated_at) VALUES ('voucher_toi_da', '3', ?)", [getNow()]);
  const cfg = {};
  for (const r of await tx.query("SELECT key, value FROM pos_settings WHERE key LIKE 'signup_%'")) cfg[r.key] = r.value;
  const giaTri = Math.round(Number(cfg.signup_discount_value) || 0);
  if (cfg.signup_mau_voucher_id || cfg.signup_scope === 'item' || giaTri <= 0) return;
  const phanTram = cfg.signup_discount_type !== 'fixed';
  const r = await tx.run(`INSERT INTO pos_mau_voucher (ten, kieu, gia_tri, tran, don_toi_thieu, ap_dung, han_ngay, chinh_chu, bat, tao_boi, tao_luc)
    VALUES (?, ?, ?, 0, ?, 'tat_ca', ?, 0, 1, 'nang_cap_026', ?)`,
  ['Ưu đãi khách mới', phanTram ? 'phan_tram' : 'tien', phanTram ? Math.min(100, giaTri) : giaTri, Math.max(0, Math.round(Number(cfg.signup_min_order) || 0)),
    Math.max(1, Math.round(Number(cfg.signup_voucher_valid_days) || 30)), getNow()]);
  await tx.run("INSERT OR IGNORE INTO pos_settings (key, value, updated_at) VALUES ('signup_mau_voucher_id', ?, ?)", [String(Number(r.lastInsertRowid)), getNow()]);
};
