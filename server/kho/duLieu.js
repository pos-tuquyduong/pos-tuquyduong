/**
 * KHO-1 — đọc / ghi CSDL của mục kho (màn Nguyên liệu, Sản phẩm & công thức). Hàm nhận `csdl` = module database hoặc giao dịch
 * (cùng query / queryOne / run) để đường ghi chạy trong trongGiaoDich.
 */
const { gonTen, chuanHoaTen, doiDonVi } = require('./tinh');

const soHoacNull = (x) => (x === '' || x == null || !Number.isFinite(Number(x)) ? null : Number(x));

/** anGia: nhân viên KHÔNG nhận giá nhập (giá vốn — LUAT_XAY_APP §4). */
async function docNguyenLieu(csdl, anGia) {
  const ds = await csdl.query(`SELECT l.*, n.ten AS nhom_ten, c.ten AS nha_cung_cap_ten FROM kho_nguyen_lieu l
      LEFT JOIN kho_nhom_nguyen_lieu n ON n.id = l.nhom_id LEFT JOIN kho_nha_cung_cap c ON c.id = l.nha_cung_cap_id ORDER BY l.ten`);
  return {
    nguyen_lieu: anGia ? ds.map(({ gia_nhap, ...r }) => r) : ds,
    nhom: await csdl.query('SELECT * FROM kho_nhom_nguyen_lieu ORDER BY thu_tu, ten'),
    nha_cung_cap: await csdl.query('SELECT * FROM kho_nha_cung_cap ORDER BY ten'),
  };
}

/** Thân yêu cầu → các cột nguyên liệu. Thiếu tên → null (đường trả 400). */
function cotNguyenLieu(d) {
  const ten = gonTen(d.ten);
  if (!ten) return null;
  const heSo = soHoacNull(d.he_so_doi);
  return [ten, chuanHoaTen(ten), soHoacNull(d.nhom_id), soHoacNull(d.nha_cung_cap_id), String(d.don_vi_luu || 'kg').trim(),
    d.don_vi_hien ? String(d.don_vi_hien).trim() : null, heSo > 0 ? heSo : 1, soHoacNull(d.gia_nhap), soHoacNull(d.ton_toi_thieu),
    soHoacNull(d.han_ngay), d.ghi_chu || null, d.dang_dung === 0 || d.dang_dung === '0' || d.dang_dung === false ? 0 : 1];
}
const COT_NL = 'ten, ten_chuan, nhom_id, nha_cung_cap_id, don_vi_luu, don_vi_hien, he_so_doi, gia_nhap, ton_toi_thieu, han_ngay, ghi_chu, dang_dung';

const themNguyenLieu = (csdl, cot, luc) => csdl.run(`INSERT INTO kho_nguyen_lieu (${COT_NL}, tao_luc) VALUES (${COT_NL.replace(/\w+/g, '?')}, ?)`, [...cot, luc]);
const suaNguyenLieu = (csdl, id, cot, luc) => csdl.run(`UPDATE kho_nguyen_lieu SET ${COT_NL.split(', ').map((c) => c + ' = ?').join(', ')}, sua_luc = ? WHERE id = ?`,
  [...cot, luc, id]);

/** Xoá cứng CHỈ khi không nằm trong công thức, lô hay dòng phiếu — một câu, changes = 0 là đang dùng (hoặc không có). */
const xoaNguyenLieu = (csdl, id) => csdl.run(`DELETE FROM kho_nguyen_lieu WHERE id = ?
  AND NOT EXISTS (SELECT 1 FROM kho_cong_thuc WHERE nguyen_lieu_id = ?) AND NOT EXISTS (SELECT 1 FROM kho_lo WHERE nguyen_lieu_id = ?)
  AND NOT EXISTS (SELECT 1 FROM kho_phieu_dong WHERE nguyen_lieu_id = ?)`, [id, id, id, id]);

/** { [spId]: [{ nguyen_lieu_id | thanh_phan_id, luong }] } — đầu vào của tinh.trienKhai. */
async function docBangCongThuc(csdl) {
  const bang = {};
  for (const d of await csdl.query('SELECT san_pham_id, nguyen_lieu_id, thanh_phan_id, luong FROM kho_cong_thuc ORDER BY id')) {
    (bang[d.san_pham_id] = bang[d.san_pham_id] || []).push(d.nguyen_lieu_id != null
      ? { nguyen_lieu_id: Number(d.nguyen_lieu_id), luong: d.luong } : { thanh_phan_id: Number(d.thanh_phan_id), luong: d.luong });
  }
  return bang;
}

/** Mọi món (cả món ẩn) + kiểu kho (không có dòng kho_san_pham = chua_dinh_luong) + dòng công thức có tên. */
async function docSanPham(csdl) {
  const dong = await csdl.query(`SELECT c.*, l.ten AS nguyen_lieu_ten, l.don_vi_luu, l.don_vi_hien, l.he_so_doi, p.name AS thanh_phan_ten
    FROM kho_cong_thuc c LEFT JOIN kho_nguyen_lieu l ON l.id = c.nguyen_lieu_id LEFT JOIN pos_products p ON p.id = c.thanh_phan_id ORDER BY c.id`);
  const sp = await csdl.query(`SELECT p.id, p.code, p.name, p.category, p.is_active, COALESCE(s.kieu, 'chua_dinh_luong') AS kieu, s.nhom_id
    FROM pos_products p LEFT JOIN kho_san_pham s ON s.pos_product_id = p.id ORDER BY p.sort_order, p.name`);
  return {
    san_pham: sp.map((p) => ({ ...p, cong_thuc: dong.filter((d) => d.san_pham_id === p.id)
      .map((d) => ({ ...d, luong_hien: d.nguyen_lieu_id ? doiDonVi(d.luong, d.he_so_doi) : d.luong })) })),
    nhom: await csdl.query('SELECT * FROM kho_nhom_cong_thuc ORDER BY thu_tu, ten'),
  };
}

/** Thay kiểu + nhóm + toàn bộ dòng công thức của một món (gọi trong giao dịch, sau khi đã kiểm vòng). */
async function luuSanPham(tx, spId, kieu, nhomId, dong, luc) {
  await tx.run(`INSERT INTO kho_san_pham (pos_product_id, kieu, nhom_id, sua_luc) VALUES (?, ?, ?, ?)
    ON CONFLICT(pos_product_id) DO UPDATE SET kieu = excluded.kieu, nhom_id = excluded.nhom_id, sua_luc = excluded.sua_luc`, [spId, kieu, nhomId, luc]);
  await tx.run('DELETE FROM kho_cong_thuc WHERE san_pham_id = ?', [spId]);
  for (const d of dong) {
    await tx.run('INSERT INTO kho_cong_thuc (san_pham_id, nguyen_lieu_id, thanh_phan_id, luong) VALUES (?, ?, ?, ?)',
      [spId, d.nguyen_lieu_id ?? null, d.thanh_phan_id ?? null, d.luong]);
  }
}

/** Đếm id KHÔNG có trong bảng (dòng công thức trỏ nguyên liệu / món không tồn tại). */
async function demThieu(csdl, bang, ids) {
  if (!ids.length) return 0;
  const co = await csdl.queryOne(`SELECT COUNT(*) AS n FROM ${bang} WHERE id IN (${ids.map(() => '?').join(', ')})`, ids);
  return new Set(ids).size - Number(co.n);
}

const tenSanPham = async (csdl, ids) => {
  const ten = new Map((await csdl.query(`SELECT id, name FROM pos_products WHERE id IN (${ids.map(() => '?').join(', ')})`, ids)).map((r) => [Number(r.id), r.name]));
  return ids.map((id) => ten.get(Number(id)) || `#${id}`);
};

module.exports = { docNguyenLieu, cotNguyenLieu, themNguyenLieu, suaNguyenLieu, xoaNguyenLieu, docBangCongThuc, docSanPham, luuSanPham,
  demThieu, tenSanPham };
