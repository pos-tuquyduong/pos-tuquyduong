/**
 * Bước 035 (NHOM-MON-1): danh sách nhóm món MỘT chỗ — pos_nhom_mon. CHỈ tạo bảng mới + chép dữ liệu (INSERT OR IGNORE), không đụng bảng cũ.
 *   ma: mã ỔN ĐỊNH = giá trị pos_products.category (không bao giờ đổi); ten: tên hiển thị (sửa được); thu_tu: thứ tự tab / nhóm menu;
 *   hien_quay / hien_app: hai công tắc độc lập. Mỗi giá trị category khác rỗng đang có → một nhóm; luôn có đủ hai nhóm gốc juice, tea
 *   (chép món từ SX gán đúng hai mã này). Tên đầu: juice → "Nước ép", tea → "Trà", mã lạ → chính mã. Chạy lại: không nhân đôi.
 */
const { getNow } = require('../utils/helpers');

const NHOM_GOC = [['juice', 'Nước ép'], ['tea', 'Trà']];

module.exports.chay = async (tx) => {
  await tx.run(`CREATE TABLE IF NOT EXISTS pos_nhom_mon (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ma TEXT NOT NULL UNIQUE,
    ten TEXT NOT NULL,
    thu_tu INTEGER NOT NULL DEFAULT 0,
    hien_quay INTEGER NOT NULL DEFAULT 1,
    hien_app INTEGER NOT NULL DEFAULT 1,
    tao_luc TEXT NOT NULL
  )`);
  const co = await tx.queryOne("SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = 'pos_products'");
  const la = co ? await tx.query("SELECT DISTINCT category AS ma FROM pos_products WHERE category IS NOT NULL AND TRIM(category) <> '' ORDER BY ma") : [];
  const goc = new Set(NHOM_GOC.map(([ma]) => ma));
  const ds = [...NHOM_GOC, ...la.map((r) => [r.ma, r.ma]).filter(([ma]) => !goc.has(ma))];
  const luc = getNow();
  const max = await tx.queryOne('SELECT COALESCE(MAX(thu_tu), 0) AS m FROM pos_nhom_mon');
  let thuTu = Number(max.m);
  for (const [ma, ten] of ds) {
    await tx.run('INSERT OR IGNORE INTO pos_nhom_mon (ma, ten, thu_tu, tao_luc) VALUES (?, ?, ?, ?)', [ma, ten, ++thuTu, luc]);
  }
};
