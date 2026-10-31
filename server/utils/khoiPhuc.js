/**
 * SAOLUU-2 — khôi phục sao lưu Excel: MỘT vị từ cho xem trước và khôi phục (lapKeHoach), MỘT giao dịch cho cả lần khôi phục (thucHien).
 * - Đọc trang với ô trống = null (sheet_to_json mặc định BỎ ô trống → cột trống ở dòng đầu mất ở mọi dòng); ô chữ rỗng '' giữ ''.
 * - Cột = cột của trang ∩ cột bảng hiện tại (PRAGMA table_info); cột lạ / đã bỏ → cot_bo_qua.
 * - Tất cả hoặc không: xoá (con trước) + chèn (cha trước, theo thứ tự BACKUP_TABLES — libsql bật khoá ngoại) trong một giao dịch; dòng đầu
 *   tiên hỏng → rollback, ném lỗi có bang / trang / dong (số dòng Excel) / ly_do.
 * Luật trang tiền (chanTrangTien) ở backup.js, chạy TRƯỚC hàm này.
 */
const XLSX = require('xlsx');
const { query } = require('../database');
const { trongGiaoDich } = require('../routes/wallets');   // cùng khuôn giuCho.js: một giao dịch, lỗi thì rollback rồi ném tiếp

const docTrang = (ws) => XLSX.utils.sheet_to_json(ws, { defval: null });

// Lý do ngắn cho chủ quán — không trả nguyên lời SQLite (LUAT §4).
const LY_DO = [[/CHECK constraint/i, 'vi phạm CHECK (giá trị không được phép)'], [/NOT NULL constraint/i, 'thiếu giá trị bắt buộc (NOT NULL)'],
  [/UNIQUE constraint|PRIMARY KEY/i, 'trùng khoá (UNIQUE)'],
  [/datatype mismatch/i, 'sai kiểu dữ liệu']];
// Khoá ngoại: cùng một mã mà nghĩa NGƯỢC nhau — xoá bảng cha khi bảng khác còn trỏ tới, hay chèn dòng con trỏ tới dòng không có.
const lyDo = (err, dangXoa) => (/FOREIGN KEY constraint/i.test(String(err?.message))
  ? (dangXoa ? 'còn dữ liệu ở bảng khác trỏ tới bảng này (khoá ngoại)' : 'trỏ tới dữ liệu không có (khoá ngoại)')
  : (LY_DO.find(([m]) => m.test(String(err?.message))) || [null, 'dữ liệu không hợp lệ'])[1]);
// CHỈ lỗi DỮ LIỆU của dòng (ràng buộc / sai kiểu) mới báo "dòng N hỏng"; lỗi hạ tầng (mạng, Turso hết giờ, kho bận…) ném nguyên → 500 / 409.
const laLoiDuLieu = (err) => /^SQLITE_(CONSTRAINT|MISMATCH)/.test(String(err?.code));

/** Kế hoạch từng trang của file: { sheet, table, label, recognized, fileRows, status: 'se_khoi_phuc' | 'skipped', code?, reason?, cot, cot_bo_qua, dong, viTri }. */
async function lapKeHoach(wb, bangSaoLuu) {
  // KHO-1 (chủ quán 28.10): kho_* CHỈ khi kho TRỐNG — đo MỘT lần; đếm lỗi (thiếu bảng kho) → bỏ qua bảng kho. pos_nang_cap không bao giờ.
  const demKho = await query('SELECT (SELECT COUNT(*) FROM kho_phieu) + (SELECT COUNT(*) FROM kho_nguyen_lieu) AS n').catch(() => null);
  const khoTrong = !!demKho && Number(demKho[0].n) === 0;
  const keHoach = [];
  for (const sheet of wb.SheetNames) {
    if (sheet === '_Metadata') continue;
    const viTri = bangSaoLuu.findIndex((t) => t.label === sheet);
    const bang = bangSaoLuu[viTri];
    const dong = docTrang(wb.Sheets[sheet]);
    const muc = { sheet, table: bang?.name || 'unknown', label: bang?.label || sheet, recognized: !!bang, fileRows: dong.length, viTri };
    const boQua = (code, reason) => keHoach.push({ ...muc, status: 'skipped', code, reason });
    if (!bang) { boQua('BANG_LA', 'Không nhận diện được bảng'); continue; }
    if (bang.name === 'pos_nang_cap') { boQua('NANG_CAP_KHONG_KHOI_PHUC', 'Sổ nâng cấp dữ liệu không khôi phục bằng file'); continue; }
    if (bang.name.startsWith('kho_') && !khoTrong) {
      if (demKho) boQua('KHO_CO_DU_LIEU', 'Bỏ qua bảng kho vì kho đang có dữ liệu');
      else boQua('KHO_KHONG_DEM_DUOC', 'Bỏ qua bảng kho vì không đếm được kho (thiếu bảng?)');
      continue;
    }
    const cotBang = new Set((await query(`PRAGMA table_info(${bang.name})`)).map((c) => c.name));
    if (!cotBang.size) { boQua('BANG_CHUA_CO', 'Bỏ qua vì cơ sở dữ liệu chưa có bảng này'); continue; }
    if (!dong.length) { boQua('TRANG_TRONG', 'Không có dữ liệu'); continue; }   // chủ quán 31.10: trang trống → bỏ qua, KHÔNG xoá bảng
    const cotTrang = Object.keys(dong[0]);
    keHoach.push({ ...muc, status: 'se_khoi_phuc', dong, cot: cotTrang.filter((c) => cotBang.has(c)),
      cot_bo_qua: cotTrang.filter((c) => !cotBang.has(c)) });
  }
  return keHoach;
}

/** Chạy kế hoạch trong MỘT giao dịch. Lỗi dữ liệu → ném { loiDong: { bang, trang, dong, ly_do } }; lỗi khác (kho bận, mạng) → ném nguyên lỗi. */
async function thucHien(keHoach) {
  const lam = keHoach.filter((m) => m.status === 'se_khoi_phuc').sort((a, b) => a.viTri - b.viTri);
  await trongGiaoDich(async (tx) => {
    const chay = async (m, soDong, sql, args) => {   // soDong null = câu xoá bảng
      try { await tx.run(sql, args); } catch (err) {
        if (!laLoiDuLieu(err)) throw err;
        throw Object.assign(new Error(err.message), { loiDong: { bang: m.table, trang: m.sheet, dong: soDong, ly_do: lyDo(err, soDong === null) } });
      }
    };
    for (const m of [...lam].reverse()) await chay(m, null, `DELETE FROM ${m.table}`, []);
    for (const m of lam) {
      const sql = `INSERT INTO ${m.table} (${m.cot.map((c) => `"${c}"`).join(', ')}) VALUES (${m.cot.map(() => '?').join(', ')})`;
      for (const d of m.dong) await chay(m, d.__rowNum__ + 1, sql, m.cot.map((c) => d[c]));   // dòng Excel thật (__rowNum__ đếm từ 0, đã tính dòng trống bị bỏ)
    }
  });
}

module.exports = { docTrang, lapKeHoach, thucHien };
