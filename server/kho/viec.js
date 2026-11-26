/**
 * KHO-GON-1 — việc hôm nay (mẫu cố định + phát sinh), diễn biến cho chủ / quản lý, đã xem theo người. Hàm nhận `csdl` = module database hoặc
 * giao dịch (cùng query / queryOne / run). Ngày = getNow().slice(0, 10) — giờ VN máy chủ (LUAT §2).
 * Việc đặc biệt (bangiao · phache · kiemke) chỉ tự xong khi màn của nó lưu (tuXong); việc thường bấm Xong. Bỏ xong chỉ chủ quán (moLai).
 */
const tinh = require('./tinh');
const duLieu = require('./duLieu');

const loi = (http, code, error) => ({ loi: [http, { error, code }] });
const KHOA_SO_CA = 'kho_so_ca';
const KHOA_QL_CHINH_TAY = 'kho_ql_chinh_tay';
const TEN_LOAI_DB = { xong_viec: 'Xong việc', mo_lai: 'Mở lại việc', them_viec: 'Thêm việc phát sinh', pha_che: 'Pha chế', nhan_hang: 'Nhận hàng',
  phat_sinh: 'Phát sinh', kiem_ke: 'Chốt kiểm kê', nhan_ca: 'Nhận ca', chinh_tay: 'Chỉnh tồn tay' };

/** Cài đặt đọc phòng thủ (khoá kho_* chủ quán ghi được qua PUT /settings không kiểm giá trị): chỉ '2' là hai ca, chỉ '1' là quản lý được chỉnh tay. */
async function docCaiDat(csdl) {
  const r = new Map((await csdl.query('SELECT key, value FROM pos_settings WHERE key IN (?, ?)', [KHOA_SO_CA, KHOA_QL_CHINH_TAY])).map((x) => [x.key, String(x.value)]));
  return { so_ca: r.get(KHOA_SO_CA) === '2' ? 2 : 1, ql_chinh_tay: r.get(KHOA_QL_CHINH_TAY) === '1' };
}

async function luuCaiDat(tx, { soCa, qlChinhTay }, luc) {
  for (const [khoa, gt] of [[KHOA_SO_CA, soCa], [KHOA_QL_CHINH_TAY, qlChinhTay]]) {
    if (gt === undefined) continue;
    await tx.run('INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
      [khoa, String(gt), luc]);
  }
}

const ghiDienBien = (tx, { luc, loai, chiTiet = null, nguoi, chuY = false, phieuId = null, viec = TEN_LOAI_DB[loai] }) => tx.run(`INSERT INTO kho_dien_bien
  (ngay, luc, loai, viec, chi_tiet, nguoi, chu_y, phieu_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [luc.slice(0, 10), luc, loai, viec, chiTiet, nguoi, chuY ? 1 : 0, phieuId]);

/** Sinh việc của ngày từ mẫu — MỘT câu; ngày đã có việc từ mẫu thì không thêm (mẫu sửa / thêm giữa ngày áp dụng từ ngày sau). */
const sinhViec = (tx, ngay, luc) => tx.run(`INSERT OR IGNORE INTO kho_viec (ngay, mau_id, ten, giao, gio_han, loai, thu_tu, tao_luc)
  SELECT ?, id, ten, giao, gio_han, loai, thu_tu, ? FROM kho_viec_mau WHERE NOT EXISTS (SELECT 1 FROM kho_viec WHERE ngay = ? AND mau_id IS NOT NULL)`, [ngay, luc, ngay]);

const docViec = (csdl, ngay) => csdl.query('SELECT * FROM kho_viec WHERE ngay = ? ORDER BY mau_id IS NULL, thu_tu, id', [ngay]);

/** Màn Việc hôm nay: sinh (nếu chưa) + việc của người hỏi + nguyên liệu dưới ngưỡng (đang dùng, tồn < ton_toi_thieu). */
async function homNay(tx, { vaiTro, ca, luc }) {
  const ngay = luc.slice(0, 10);
  await sinhViec(tx, ngay, luc);
  const cd = await docCaiDat(tx);
  const tatCa = await docViec(tx, ngay);
  const ds = tatCa.filter((v) => tinh.viecHienCho(v, { vaiTro, soCa: cd.so_ca, ca }));
  // "đã giao" tính trên MỌI việc hôm nay — việc gọi hàng giao quản lý, nhân viên không thấy nó trong danh sách của mình
  const daGiao = new Set(tatCa.filter((v) => v.nguyen_lieu_id != null && !v.xong_luc).map((v) => Number(v.nguyen_lieu_id)));
  const ton = await duLieu.docTon(tx, luc);
  return { ngay, bay_gio: luc, so_ca: cd.so_ca, ca: ca || null, viec: ds.map((v) => ({ ...v, qua_gio: tinh.quaGio(v, luc) })),
    duoi_nguong: tinh.boGia(ton.nguyen_lieu.filter((n) => n.dang_dung && n.duoi_toi_thieu)
      .map((n) => ({ id: n.id, ten: n.ten, ton_hien: n.ton_hien, don_vi: n.don_vi_hien || n.don_vi_luu, da_giao: daGiao.has(Number(n.id)) }))) };
}

/** Việc phát sinh (chỉ trong ngày). Có nguyen_lieu_id → "Gọi thêm <tên>" giao quản lý; đã có việc chưa xong cho thứ đó → trả việc đó. */
async function themViec(tx, { ten, giao, nguyenLieuId, nguoi, luc }) {
  const ngay = luc.slice(0, 10);
  let tenViec = tinh.gonTen(ten);
  if (nguyenLieuId) {
    const nl = await tx.queryOne('SELECT ten FROM kho_nguyen_lieu WHERE id = ?', [nguyenLieuId]);
    if (!nl) return loi(404, 'KHONG_THAY', 'Không thấy nguyên liệu');
    const co = await tx.queryOne('SELECT * FROM kho_viec WHERE ngay = ? AND nguyen_lieu_id = ? AND xong_luc IS NULL', [ngay, nguyenLieuId]);
    if (co) return { viec: co };
    tenViec = `Gọi thêm ${nl.ten}`;
    giao = 'ql';
  }
  if (!tenViec) return loi(400, 'THIEU_TEN', 'Chưa nhập tên việc');
  const g = giao ?? 'nv';
  if (!tinh.GIAO_VIEC.includes(g)) return loi(400, 'GIAO_SAI', 'Giao cho: nhân viên, ca sáng, ca tối, quản lý hoặc tất cả');
  let kq;
  try {
    kq = await tx.run('INSERT INTO kho_viec (ngay, ten, giao, loai, thu_tu, nguyen_lieu_id, nguoi_tao, tao_luc) VALUES (?, ?, ?, ?, 0, ?, ?, ?)',
      [ngay, tenViec, g, 'thuong', nguyenLieuId || null, nguoi, luc]);
  } catch (e) {   // hai người cùng bấm "Giao việc gọi thêm" — khoá ux_kho_viec_goi_hang giữ MỘT việc
    if (!tinh.laTrungKhoa(e) || !nguyenLieuId) throw e;
    return { viec: await tx.queryOne('SELECT * FROM kho_viec WHERE ngay = ? AND nguyen_lieu_id = ? AND xong_luc IS NULL', [ngay, nguyenLieuId]) };
  }
  await ghiDienBien(tx, { luc, loai: 'them_viec', chiTiet: tenViec, nguoi });
  return { viec: await tx.queryOne('SELECT * FROM kho_viec WHERE id = ?', [Number(kq.lastInsertRowid)]) };
}

/** Bấm Xong (việc thường, hôm nay, của người bấm). Câu ghi khoá `xong_luc IS NULL` — hai người bấm cùng lúc chỉ một lần ghi. */
async function xongViec(tx, { id, vaiTro, ca, nguoi, luc }) {
  const v = await tx.queryOne('SELECT * FROM kho_viec WHERE id = ? AND ngay = ?', [id, luc.slice(0, 10)]);
  if (!v) return loi(404, 'KHONG_THAY', 'Không thấy việc hôm nay');
  if (v.loai !== 'thuong') return loi(409, 'VIEC_TU_XONG', 'Việc này tự xong khi lưu màn của nó — bấm "Làm"');
  if (!tinh.viecHienCho(v, { vaiTro, soCa: (await docCaiDat(tx)).so_ca, ca })) return loi(403, 'VIEC_KHONG_CUA_BAN', 'Việc này không giao cho bạn');
  const kq = await tx.run('UPDATE kho_viec SET nguoi_xong = ?, xong_luc = ? WHERE id = ? AND xong_luc IS NULL', [nguoi, luc, id]);
  if (!kq.changes) return loi(409, 'VIEC_DA_XONG', 'Việc đã xong — tải lại');
  await ghiDienBien(tx, { luc, loai: 'xong_viec', chiTiet: v.ten, nguoi });
  return {};
}

/** Chủ quán bỏ đánh dấu xong (ghi nhật ký). */
async function moLai(tx, { id, nguoi, luc }) {
  const v = await tx.queryOne('SELECT ten FROM kho_viec WHERE id = ?', [id]);
  const kq = await tx.run('UPDATE kho_viec SET nguoi_xong = NULL, xong_luc = NULL WHERE id = ? AND xong_luc IS NOT NULL', [id]);
  if (!kq.changes) return loi(409, 'VIEC_CHUA_XONG', 'Việc chưa xong — không có gì để mở lại');
  await ghiDienBien(tx, { luc, loai: 'mo_lai', chiTiet: v.ten, nguoi });
  return {};
}

/** Màn đặc biệt lưu xong → việc hôm nay tự xong: theo loại (bangiao · phache · kiemke) hoặc theo nguyên liệu (việc gọi hàng). */
async function tuXong(tx, { loai = null, nguyenLieuIds = [], nguoi, luc }) {
  const ngay = luc.slice(0, 10);
  if (loai) await sinhViec(tx, ngay, luc);   // màn lưu trước khi ai mở Việc hôm nay — việc vẫn phải xong
  if (loai) await tx.run('UPDATE kho_viec SET nguoi_xong = ?, xong_luc = ? WHERE ngay = ? AND loai = ? AND xong_luc IS NULL', [nguoi, luc, ngay, loai]);
  if (nguyenLieuIds.length) {
    await tx.run(`UPDATE kho_viec SET nguoi_xong = ?, xong_luc = ? WHERE ngay = ? AND xong_luc IS NULL AND nguyen_lieu_id IN (${duLieu.dauHoi(nguyenLieuIds)})`,
      [nguoi, luc, ngay, ...nguyenLieuIds]);
  }
}

/** Sau khi TẠO phiếu xuất / nhận / phát sinh (cùng giao dịch): ghi diễn biến + tự xong việc tương ứng. DH: không gì. */
async function sauTaoPhieu(tx, id, nguoi, luc) {
  const p = await tx.queryOne('SELECT loai, so_phieu FROM kho_phieu WHERE id = ?', [id]);
  const dong = await tx.query(`SELECT d.nguyen_lieu_id, d.so_luong, COALESCE(l.ten, sp.name) AS ten FROM kho_phieu_dong d LEFT JOIN kho_nguyen_lieu l ON l.id = d.nguyen_lieu_id
    LEFT JOIN pos_products sp ON sp.id = d.san_pham_id WHERE d.phieu_id = ? AND d.loai IN ('thanh_pham', 'nhap', 'phat_sinh') ORDER BY d.id`, [id]);
  const chuoi = dong.map((d) => `${d.ten} ${Number(Math.abs(d.so_luong).toFixed(3))}`).join(', ');
  if (p?.loai === 'PX') {
    await tuXong(tx, { loai: 'phache', nguoi, luc });
    await ghiDienBien(tx, { luc, loai: 'pha_che', chiTiet: `${p.so_phieu}: ${chuoi}`, nguoi, phieuId: id });
  } else if (p?.loai === 'PN') {
    await tuXong(tx, { nguyenLieuIds: [...new Set(dong.map((d) => Number(d.nguyen_lieu_id)))], nguoi, luc });
    await ghiDienBien(tx, { luc, loai: 'nhan_hang', chiTiet: `${p.so_phieu}: ${chuoi}`, nguoi, phieuId: id });
  } else if (p?.loai === 'PS') {
    await ghiDienBien(tx, { luc, loai: 'phat_sinh', chiTiet: `${p.so_phieu}: ${chuoi}`, nguoi, chuY: true, phieuId: id });
  }
}

// ── Mẫu việc (chủ / quản lý) ──
const dsMau = (csdl) => csdl.query('SELECT * FROM kho_viec_mau ORDER BY thu_tu, id');

/** Thân → { ten, giao, gio } hoặc { loi }. */
function thanMau(b) {
  const ten = tinh.gonTen(b.ten);
  const gio = tinh.chuanGio(b.gio_han);
  if (!ten) return loi(400, 'THIEU_TEN', 'Chưa nhập tên việc');
  if (!tinh.GIAO_VIEC.includes(b.giao)) return loi(400, 'GIAO_SAI', 'Giao cho: nhân viên, ca sáng, ca tối, quản lý hoặc tất cả');
  if (gio === undefined) return loi(400, 'GIO_SAI', 'Giờ hạn dạng HH:mm (00:00–23:59) hoặc để trống');
  return { ten, giao: b.giao, gio };
}

async function themMau(tx, b, luc) {
  const t = thanMau(b);
  if (t.loi) return t;
  const cuoi = await tx.queryOne('SELECT COALESCE(MAX(thu_tu), 0) AS n FROM kho_viec_mau');
  const kq = await tx.run("INSERT INTO kho_viec_mau (ten, giao, gio_han, loai, thu_tu, sua_luc) VALUES (?, ?, ?, 'thuong', ?, ?)", [t.ten, t.giao, t.gio, Number(cuoi.n) + 1, luc]);
  return { id: Number(kq.lastInsertRowid) };
}

async function suaMau(tx, id, b, luc) {
  const t = thanMau(b);
  if (t.loi) return t;
  const kq = await tx.run('UPDATE kho_viec_mau SET ten = ?, giao = ?, gio_han = ?, sua_luc = ? WHERE id = ?', [t.ten, t.giao, t.gio, luc, id]);
  return kq.changes ? {} : loi(404, 'KHONG_THAY', 'Không thấy mẫu việc');
}

/** Lên / Xuống: đổi chỗ với hàng xóm (đánh lại thu_tu cả danh sách — vài chục dòng). */
async function doiThuTu(tx, id, buoc) {
  const ds = await dsMau(tx);
  const i = ds.findIndex((m) => Number(m.id) === id);
  if (i < 0) return loi(404, 'KHONG_THAY', 'Không thấy mẫu việc');
  const j = i + buoc;
  if (j < 0 || j >= ds.length) return {};
  [ds[i], ds[j]] = [ds[j], ds[i]];
  for (const [n, m] of ds.entries()) await tx.run('UPDATE kho_viec_mau SET thu_tu = ? WHERE id = ?', [n + 1, m.id]);
  return {};
}

async function xoaMau(tx, id) {
  const m = await tx.queryOne('SELECT loai FROM kho_viec_mau WHERE id = ?', [id]);
  if (!m) return loi(404, 'KHONG_THAY', 'Không thấy mẫu việc');
  if (m.loai !== 'thuong') return loi(409, 'VIEC_KHONG_XOA', 'Việc bàn giao / pha sẵn / kiểm kê không xoá được — sửa tên, giờ được');
  await tx.run("DELETE FROM kho_viec_mau WHERE id = ? AND loai = 'thuong'", [id]);
  return {};
}

// ── Diễn biến · đã xem (theo NGƯỜI) ──
const denIdCua = async (csdl, nguoi) => Number((await csdl.queryOne('SELECT den_id FROM kho_dien_bien_xem WHERE nguoi = ?', [nguoi]))?.den_id || 0);
const soChuaXem = async (csdl, nguoi, ngay) => Number((await csdl.queryOne('SELECT COUNT(*) AS n FROM kho_dien_bien WHERE ngay = ? AND id > ?',
  [ngay, await denIdCua(csdl, nguoi)])).n);

async function dienBien(csdl, nguoi, ngay, monChuaSan) {
  const den = await denIdCua(csdl, nguoi);
  return { ngay, den_id: den, dong: await csdl.query('SELECT * FROM kho_dien_bien WHERE ngay = ? ORDER BY id DESC', [ngay]),
    chua_xem: await soChuaXem(csdl, nguoi, ngay),
    can_chu_y: { mon_chua_san: monChuaSan.mon, dien_bien: await csdl.query('SELECT * FROM kho_dien_bien WHERE chu_y = 1 AND id > ? ORDER BY id DESC LIMIT 50', [den]) } };
}

/** Đã xem tới den_id (không quá id lớn nhất lúc bấm — dòng tới sau vẫn là chưa xem). */
async function daXem(tx, nguoi, denId) {
  const max = Number((await tx.queryOne('SELECT COALESCE(MAX(id), 0) AS n FROM kho_dien_bien')).n);
  const den = Math.max(0, Math.min(Number(denId) || 0, max));
  await tx.run('INSERT INTO kho_dien_bien_xem (nguoi, den_id) VALUES (?, ?) ON CONFLICT(nguoi) DO UPDATE SET den_id = MAX(den_id, excluded.den_id)', [nguoi, den]);
  return {};
}

module.exports = { docCaiDat, luuCaiDat, ghiDienBien, homNay, themViec, xongViec, moLai, tuXong, sauTaoPhieu, dsMau, themMau, suaMau, doiThuTu, xoaMau,
  soChuaXem, dienBien, daXem };
