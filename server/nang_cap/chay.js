/**
 * KHO-1 — bộ chạy NÂNG CẤP DỮ LIỆU đánh số (LUAT_XAY_APP §3). Bước = file `NNN_<ten>.js` cùng thư mục, xuất `chay(tx, { themCot })`.
 *
 * An toàn (chủ quán 28.10): mỗi bước MỘT giao dịch; câu ĐẦU của giao dịch là INSERT pos_nang_cap (khoá chính = số bước) → hai máy chủ
 * khởi động cùng lúc thì máy sau đụng khoá, huỷ cả giao dịch, bỏ qua bước — không chạy đôi, không nửa chừng. Bước hỏng → rollback,
 * DỪNG (không chạy bước sau), trả { hong: '<NNN_ten>: <lỗi>' }; database.js giữ lại để đường kho trả 503 — quầy vẫn mở.
 * Bước chỉ THÊM (bảng / cột / chỉ mục) và viết lặp lại được; thêm cột vào bảng có sẵn PHẢI qua themCot (tự chép bảng sao lưu trước).
 * Nhận hàm giao dịch từ database.js (không require nó — tránh vòng nạp; bài thử chạy được trên thư mục bước giả).
 */
const fs = require('fs');
const path = require('path');
const { getNow } = require('../utils/helpers');
const { laTrungKhoa } = require('../kho/tinh');

const MAU_BUOC = /^(\d{3})_[a-z0-9_]+\.js$/;

/** Thêm cột nếu chưa có. Bảng đang có dòng → chép sang _sao_luu_<NNN>_<bang> TRƯỚC khi ALTER (một lần). */
async function themCot(tx, so, bang, dinhNghia) {
  const cot = dinhNghia.trim().split(/\s+/)[0];
  if ((await tx.query(`PRAGMA table_info(${bang})`)).some((c) => c.name === cot)) return;
  const dong = await tx.queryOne(`SELECT COUNT(*) AS n FROM ${bang}`);
  if (Number(dong.n) > 0) await tx.run(`CREATE TABLE IF NOT EXISTS _sao_luu_${so}_${bang} AS SELECT * FROM ${bang}`);
  await tx.run(`ALTER TABLE ${bang} ADD COLUMN ${dinhNghia}`);
}

async function chayNangCap({ beginTransaction, query }, thuMuc = __dirname) {
  await query('CREATE TABLE IF NOT EXISTS pos_nang_cap (so INTEGER PRIMARY KEY, ten TEXT NOT NULL, luc TEXT NOT NULL)');
  for (const tep of fs.readdirSync(thuMuc).filter((f) => MAU_BUOC.test(f)).sort()) {
    const ten = tep.slice(0, -3);
    const so = tep.slice(0, 3);
    const tx = await beginTransaction();
    try {
      try {
        await tx.run('INSERT INTO pos_nang_cap (so, ten, luc) VALUES (?, ?, ?)', [Number(so), ten, getNow()]);
      } catch (e) {
        if (!laTrungKhoa(e)) throw e;
        await tx.rollback();   // bước đã chạy (hoặc máy khác vừa chạy) — bỏ qua
        continue;
      }
      await require(path.join(thuMuc, tep)).chay(tx, { themCot: (bang, dinhNghia) => themCot(tx, so, bang, dinhNghia) });
      await tx.commit();
    } catch (e) {
      await tx.rollback();
      return { hong: `${ten}: ${e.message}` };
    }
  }
  return { hong: null };
}

module.exports = { chayNangCap };
