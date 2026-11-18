/**
 * KHO-3a (Câu 1, chủ quán 18.11) — MỘT hàm dựng món thử cho kho thử TẠM của từng bài: sau KHO-3a quầy chỉ bán món có kiểu + công thức + hàng.
 * Mọi món đang bán CHƯA có dòng kho → kiểu "làm sẵn", công thức 1 nguyên liệu "NL thử", một lô thành phẩm qua ĐÚNG đường pha chế thật của
 * KHO-2a (duLieu.taoPhieuXuat tự duyệt — không chèn tay vào bảng). Món đã có dòng kho (bài tự dựng) giữ nguyên. Gọi lại được (chỉ món mới).
 * KHÔNG có cờ / đường nào tắt luật bán theo kho: bài cũ bán được vì kho CÓ hàng thật, như quầy thật.
 * Gọi: await require('./gia_lap/monThu').dungMonThu(db) — db = module database.js bài đã nạp (thư mục máy chủ suy từ chính module đó,
 * nên bản sao đột biến --may-chu dùng đúng duLieu của bản sao).
 */
const path = require('path');

const SO_LO = 100000;   // đủ cho mọi bài cũ — không bài nào đụng ngưỡng hết hàng ngoài ý muốn

async function dungMonThu(db) {
  const tep = Object.values(require.cache).find((m) => m.exports === db)?.filename;
  if (!tep) throw new Error('dungMonThu: không tìm thấy database.js đã nạp');
  const duLieu = require(path.join(path.dirname(tep), 'kho', 'duLieu.js'));
  const { getNow } = require(path.join(path.dirname(tep), 'utils', 'helpers.js'));
  const mon = await db.query(`SELECT p.id FROM pos_products p WHERE p.is_active = 1
    AND NOT EXISTS (SELECT 1 FROM kho_san_pham s WHERE s.pos_product_id = p.id)`);
  if (!mon.length) return 0;
  const luc = getNow();
  const tx = await db.beginTransaction();
  try {
    let nl = await tx.queryOne("SELECT id FROM kho_nguyen_lieu WHERE ten_chuan = 'nl thử'");
    if (!nl) {
      nl = { id: Number((await tx.run("INSERT INTO kho_nguyen_lieu (ten, ten_chuan, don_vi_luu, he_so_doi, tao_luc) VALUES ('NL thử', 'nl thử', 'kg', 1, ?)", [luc])).lastInsertRowid) };
    }
    for (const m of mon) await duLieu.luuSanPham(tx, Number(m.id), 'lam_san', null, [{ nguyen_lieu_id: Number(nl.id), luong: 0.001 }], luc);
    const kq = await duLieu.taoPhieuXuat(tx, { mon: mon.map((m) => ({ san_pham_id: Number(m.id), so_phan: SO_LO })), nguoi: 'mon_thu', tuDuyet: true, luc, lucLam: luc });
    if (kq.loi) throw new Error('dungMonThu: ' + JSON.stringify(kq.loi));
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }
  return mon.length;
}

module.exports = { dungMonThu };
