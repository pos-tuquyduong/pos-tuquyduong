/**
 * Bước 014 (NAP-1): gói nạp ở quầy + ví hai ngăn. Chỉ THÊM bảng / cột (themCot tự chép bảng sao lưu trước khi ALTER).
 *   pos_goi_nap                      gói nạp: khách trả `khach_tra` → vào tài khoản `vao_tk` (≥ khach_tra; phần hơn = thưởng nạp, không hạn).
 *                                    Không xoá cứng (đơn cũ trỏ tới gói) — bớt gói = tắt `is_active`.
 *   pos_wallets.thuong               phần THƯỞNG NẠP còn trong số dư; tiền nạp = balance − thuong (suy ra, không lưu).
 *   pos_balance_transactions.thuong  phần của `amount` thuộc ngăn thưởng (có dấu). Dòng / ví cũ = 0 → toàn bộ là tiền nạp.
 * Bảng ví / sổ chưa có → bỏ qua phần đó (khuôn 013: máy thật luôn có — chỉ kho thử thiếu bảng).
 */
module.exports.chay = async (tx, { themCot }) => {
  await tx.run(`CREATE TABLE IF NOT EXISTS pos_goi_nap (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ten TEXT NOT NULL,
    khach_tra INTEGER NOT NULL,
    vao_tk INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    thu_tu INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT
  )`);
  const coBang = async (ten) => !!(await tx.queryOne("SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = ?", [ten]));
  for (const bang of ['pos_wallets', 'pos_balance_transactions']) {
    if (await coBang(bang)) await themCot(bang, 'thuong INTEGER NOT NULL DEFAULT 0');
  }
};
