/**
 * KHO-1 — đọc / ghi CSDL của mục kho (màn Nguyên liệu, Sản phẩm & công thức). Hàm nhận `csdl` = module database hoặc giao dịch
 * (cùng query / queryOne / run) để đường ghi chạy trong trongGiaoDich.
 * KHO-2a — pha chế, phiếu xuất (tạo · duyệt · từ chối · huỷ · sửa · kết quả), tồn. Tồn = Σ dòng phiếu da_duyet; còn lại theo lô = Σ dòng theo lo_id.
 * KHO-2b — duyệt / từ chối / huỷ chung cho mọi loại phiếu; đơn đặt hàng DH KHÔNG vào tồn; đọc phiếu DH / PN / PS. Tạo phiếu: nhapHang.js, phatSinh.js.
 */
const { addDaysToDateString } = require('../utils/helpers');
const { gonTen, chuanHoaTen, doiDonVi, laTrungKhoa, SAP_HET_HAN_NGAY, thuCuaNgay, chonDinhMuc, canLam, soNgayNguyen, lapPhieuXuat, chiaTheoLo, soPhieuKe, lechQuaNguong,
  trangThaiKetQua, trangThaiHan, bangPhieu, hanMuc, tongTien, trongHanMuc, conLaiDon, HAN_MUC_DAT_HANG_MAC_DINH, HAN_MUC_NOI_BO_MAC_DINH, SAI_SO } = require('./tinh');

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
  const sp = await csdl.query(`SELECT p.id, p.code, p.name, p.category, p.price, p.is_active, COALESCE(s.kieu, 'chua_dinh_luong') AS kieu, s.nhom_id, s.han_ngay
    FROM pos_products p LEFT JOIN kho_san_pham s ON s.pos_product_id = p.id ORDER BY p.sort_order, p.name`);
  return {
    san_pham: sp.map((p) => ({ ...p, cong_thuc: dong.filter((d) => d.san_pham_id === p.id)
      .map((d) => ({ ...d, luong_hien: d.nguyen_lieu_id ? doiDonVi(d.luong, d.he_so_doi) : d.luong })) })),
    nhom: await csdl.query('SELECT * FROM kho_nhom_cong_thuc ORDER BY thu_tu, ten'),
  };
}

/** Thay kiểu + nhóm + toàn bộ dòng công thức của một món (gọi trong giao dịch, sau khi đã kiểm vòng). hanNgay undefined = giữ hạn đang có. */
async function luuSanPham(tx, spId, kieu, nhomId, dong, luc, hanNgay) {
  await tx.run(`INSERT INTO kho_san_pham (pos_product_id, kieu, nhom_id, sua_luc) VALUES (?, ?, ?, ?)
    ON CONFLICT(pos_product_id) DO UPDATE SET kieu = excluded.kieu, nhom_id = excluded.nhom_id, sua_luc = excluded.sua_luc`, [spId, kieu, nhomId, luc]);
  if (hanNgay !== undefined) await tx.run('UPDATE kho_san_pham SET han_ngay = ? WHERE pos_product_id = ?', [hanNgay, spId]);
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

// ═════════════════════════════ KHO-2a ═════════════════════════════
const KHOA_CONG_TAC = 'kho_px_nv_can_duyet';
const DA_DUYET = "p.trang_thai = 'da_duyet' AND p.loai <> 'DH'";   // KHO-2b: đơn đặt hàng không đổi tồn
const KHOA_HAN_MUC_DAT_HANG = 'kho_han_muc_dat_hang';
const KHOA_HAN_MUC_NOI_BO = 'kho_han_muc_noi_bo';
const theoId = (ds, khoa = 'id') => new Map(ds.map((r) => [Number(r[khoa]), r]));
const dauHoi = (ds) => ds.map(() => '?').join(', ');

/** Hạn lô = giờ làm + N ngày theo lịch (giữ giờ). N không phải số ngày nguyên hợp lệ (soNgayNguyen) → lô không hạn. */
const hanLo = (luc, ngay) => (soNgayNguyen(ngay) ? addDaysToDateString(luc, soNgayNguyen(ngay)) + String(luc).slice(10) : null);

/** Công tắc "Nhân viên xuất kho cần duyệt": CHỈ '0' là tắt — không có dòng / giá trị lạ (khôi phục sao lưu không qua kiểm) = cần duyệt. */
const nvCanDuyet = async (csdl) => String((await csdl.queryOne('SELECT value FROM pos_settings WHERE key = ?', [KHOA_CONG_TAC]))?.value) !== '0';

/** KHO-2b: hạn mức (đồng) đặt hàng / dùng nội bộ — luật thiếu dòng / giá trị lạ ở tinh.hanMuc. */
const docHanMuc = async (csdl, khoa) => hanMuc((await csdl.queryOne('SELECT value FROM pos_settings WHERE key = ?', [khoa]))?.value,
  khoa === KHOA_HAN_MUC_NOI_BO ? HAN_MUC_NOI_BO_MAC_DINH : HAN_MUC_DAT_HANG_MAC_DINH);

/** MỘT câu "còn lại theo lô" cho Pha chế (đang có), Tồn và chia lô khi xuất. Chỉ lô còn hàng. */
const conLaiTheoLo = (csdl, dieuKien, args = [], sapXep = 'id') => csdl.query(`SELECT * FROM (SELECT l.*, (SELECT COALESCE(SUM(d.so_luong), 0)
  FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id WHERE d.lo_id = l.id AND ${DA_DUYET}) AS con FROM kho_lo l WHERE ${dieuKien})
  WHERE con > 1e-9 ORDER BY ${sapXep}`, args);

/** Tồn nguyên liệu = Σ mọi dòng của phiếu đã duyệt (kể cả phần thiếu không lô). */
const COT_TON_NL = `(SELECT COALESCE(SUM(d.so_luong), 0) FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id WHERE d.nguyen_lieu_id = l.id AND ${DA_DUYET})`;

const docMonLamSan = (csdl) => csdl.query(`SELECT p.id AS san_pham_id, p.name AS ten, s.nhom_id, s.han_ngay,
  EXISTS (SELECT 1 FROM kho_cong_thuc c WHERE c.san_pham_id = p.id) AS co_ct
  FROM kho_san_pham s JOIN pos_products p ON p.id = s.pos_product_id WHERE s.kieu = 'lam_san' AND p.is_active = 1 ORDER BY p.sort_order, p.name`);

/** Màn Pha chế cho ngày `ngay` (giờ VN): đang có = lô thành phẩm còn hạn tại `moc`. */
async function docPhaChe(csdl, ngay, moc) {
  const thu = thuCuaNgay(ngay);
  const dm = await csdl.query('SELECT san_pham_id, thu, so_luong FROM kho_dinh_muc');
  const lo = await conLaiTheoLo(csdl, 'l.san_pham_id IS NOT NULL AND (l.han_dung IS NULL OR l.han_dung > ?)', [moc]);
  return { ngay, thu, mon: (await docMonLamSan(csdl)).map((m) => {
    const dinhMuc = chonDinhMuc(dm.filter((d) => Number(d.san_pham_id) === Number(m.san_pham_id)), thu);
    const dangCo = lo.filter((l) => Number(l.san_pham_id) === Number(m.san_pham_id)).reduce((t, l) => t + Number(l.con), 0);
    return { san_pham_id: Number(m.san_pham_id), ten: m.ten, dinh_muc: dinhMuc, dang_co: dangCo, can_lam: canLam(dinhMuc, dangCo), co_cong_thuc: !!Number(m.co_ct) };
  }) };
}

async function docDinhMuc(csdl) {
  const dm = await csdl.query('SELECT san_pham_id, thu, so_luong FROM kho_dinh_muc ORDER BY thu IS NOT NULL, thu');
  return {
    mon: (await docMonLamSan(csdl)).map(({ co_ct, ...m }) => ({ ...m, san_pham_id: Number(m.san_pham_id),
      dinh_muc: dm.filter((d) => Number(d.san_pham_id) === Number(m.san_pham_id)).map((d) => ({ thu: d.thu, so_luong: d.so_luong })) })),
    nhom: await csdl.query('SELECT id, ten, thu_tu, lech_cho_phep FROM kho_nhom_cong_thuc ORDER BY thu_tu, ten'),
    nv_can_duyet: await nvCanDuyet(csdl),
    han_muc_dat_hang: await docHanMuc(csdl, KHOA_HAN_MUC_DAT_HANG),
    han_muc_noi_bo: await docHanMuc(csdl, KHOA_HAN_MUC_NOI_BO),
  };
}

/** Thay toàn bộ định mức một món (xoá rồi chèn trong giao dịch — UNIQUE không chặn trùng khi thu NULL). */
async function luuDinhMuc(tx, spId, dong) {
  await tx.run('DELETE FROM kho_dinh_muc WHERE san_pham_id = ?', [spId]);
  for (const d of dong) await tx.run('INSERT INTO kho_dinh_muc (san_pham_id, thu, so_luong) VALUES (?, ?, ?)', [spId, d.thu, d.so_luong]);
}

/** Số phiếu kế tiếp trong ngày của loại (soPhieuKe). MỘT hàm cho PX, DH, PN, PS. */
async function soPhieuMoi(tx, loai, luc) {
  const cuoi = await tx.queryOne('SELECT so_phieu FROM kho_phieu WHERE so_phieu LIKE ? ORDER BY id DESC LIMIT 1', [soPhieuKe(loai, luc, null).slice(0, -3) + '%']);
  return soPhieuKe(loai, luc, cuoi?.so_phieu);
}

/** KHO-2b: đầu phiếu DH / PN / PS. Trả id. Dòng do hàm tạo của từng loại ghi. */
async function themPhieu(tx, { loai, tuDuyet, nguoi, luc, nccId = null, ghiChu = null, donId = null, suCo = null, thayCho = null, lyDo = null, maGui = null }) {
  const kq = await tx.run(`INSERT INTO kho_phieu (loai, so_phieu, trang_thai, nha_cung_cap_id, nguoi_tao, tao_luc, nguoi_duyet, duyet_luc, thay_cho_id, ly_do, ghi_chu,
    ma_gui, don_id, su_co) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [loai, await soPhieuMoi(tx, loai, luc), tuDuyet ? 'da_duyet' : 'cho_duyet', nccId,
    nguoi, luc, tuDuyet ? nguoi : null, tuDuyet ? luc : null, thayCho, lyDo, ghiChu, maGui, donId, suCo]);
  return Number(kq.lastInsertRowid);
}

/** Tạo phiếu PX: dòng thành phẩm (+số phần) + dòng xuất nháp (−lượng, theo món). tuDuyet → ghi kho ngay, CÙNG giao dịch. */
async function taoPhieuXuat(tx, { mon, nguoi, tuDuyet, thayCho = null, lyDo = null, maGui = null, luc, lucLam }) {
  const px = lapPhieuXuat(mon, await docBangCongThuc(tx));
  if (px.thieu_cong_thuc.length) {
    const ten = await tenSanPham(tx, px.thieu_cong_thuc);
    return { loi: [400, { error: `Món chưa có công thức: ${ten.join(', ')}`, code: 'MON_CHUA_CONG_THUC' }] };
  }
  const kq = await tx.run(`INSERT INTO kho_phieu (loai, so_phieu, trang_thai, nguoi_tao, tao_luc, nguoi_duyet, duyet_luc, thay_cho_id, ly_do, ma_gui)
    VALUES ('PX', ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [await soPhieuMoi(tx, 'PX', luc), tuDuyet ? 'da_duyet' : 'cho_duyet', nguoi, luc,
    tuDuyet ? nguoi : null, tuDuyet ? lucLam : null, thayCho, lyDo, maGui]);
  const id = Number(kq.lastInsertRowid);
  for (const m of px.theo_mon) {
    await tx.run("INSERT INTO kho_phieu_dong (phieu_id, san_pham_id, so_luong, loai, nguoi, luc) VALUES (?, ?, ?, 'thanh_pham', ?, ?)", [id, m.san_pham_id, m.so_phan, nguoi, luc]);
    for (const n of m.nguyen_lieu) {
      await tx.run("INSERT INTO kho_phieu_dong (phieu_id, nguyen_lieu_id, so_luong, loai, cho_mon_id) VALUES (?, ?, ?, 'xuat', ?)", [id, n.nguyen_lieu_id, -n.luong, m.san_pham_id]);
    }
  }
  if (tuDuyet) await ghiKho(tx, id, lucLam, luc);
  return { id };
}

/**
 * Ghi kho cho phiếu VỪA chuyển da_duyet (gọi sau câu khoá trạng thái): (a) mỗi món một lô (hạn = giờ làm + hạn món, giá vốn khi mọi nguyên
 * liệu có giá); (b) mỗi nguyên liệu trừ lô còn hạn, hạn gần trước — dòng nháp nhận lô đầu, phần còn lại thêm dòng. MỘT hàm cho duyệt · tự duyệt · sửa.
 */
async function ghiKho(tx, phieuId, lucLam, luc) {
  const dong = await tx.query('SELECT * FROM kho_phieu_dong WHERE phieu_id = ? ORDER BY id', [phieuId]);
  const xuat = dong.filter((d) => d.loai === 'xuat');
  const nlIds = [...new Set(xuat.map((d) => Number(d.nguyen_lieu_id)))];
  const gia = theoId(nlIds.length ? await tx.query(`SELECT id, gia_nhap FROM kho_nguyen_lieu WHERE id IN (${dauHoi(nlIds)})`, nlIds) : []);
  const giaCua = (d) => gia.get(Number(d.nguyen_lieu_id))?.gia_nhap ?? null;
  for (const d of dong.filter((x) => x.loai === 'thanh_pham')) {
    const sp = await tx.queryOne('SELECT han_ngay FROM kho_san_pham WHERE pos_product_id = ?', [d.san_pham_id]);
    const cua = xuat.filter((x) => Number(x.cho_mon_id) === Number(d.san_pham_id));
    const giaVon = cua.length && cua.every((x) => giaCua(x) != null) ? Math.round(cua.reduce((t, x) => t - x.so_luong * giaCua(x), 0) / d.so_luong) : null;
    const lo = await tx.run('INSERT INTO kho_lo (san_pham_id, so_luong, han_dung, gia_von, phieu_id, tao_luc) VALUES (?, ?, ?, ?, ?, ?)',
      [d.san_pham_id, d.so_luong, hanLo(lucLam, sp?.han_ngay), giaVon, phieuId, luc]);
    await tx.run('UPDATE kho_phieu_dong SET lo_id = ? WHERE id = ?', [Number(lo.lastInsertRowid), d.id]);
  }
  for (const nlId of nlIds) {
    const lo = await conLaiTheoLo(tx, 'l.nguyen_lieu_id = ? AND (l.han_dung IS NULL OR l.han_dung > ?)', [nlId, luc], 'han_dung IS NULL, han_dung, id');
    const cua = xuat.filter((x) => Number(x.nguyen_lieu_id) === nlId);
    const daGan = new Set();
    for (const m of chiaTheoLo(cua.map((x) => ({ khoa: x, luong: -x.so_luong })), lo)) {
      const x = m.khoa;
      if (!daGan.has(x.id)) {
        daGan.add(x.id);
        await tx.run('UPDATE kho_phieu_dong SET lo_id = ?, so_luong = ?, don_gia = ? WHERE id = ?', [m.lo_id, -m.luong, giaCua(x), x.id]);
      } else {
        await tx.run("INSERT INTO kho_phieu_dong (phieu_id, nguyen_lieu_id, lo_id, so_luong, don_gia, loai, cho_mon_id) VALUES (?, ?, ?, ?, ?, 'xuat', ?)",
          [phieuId, nlId, m.lo_id, -m.luong, giaCua(x), x.cho_mon_id]);
      }
    }
  }
}

/** Câu khoá không đổi được dòng → vì sao: không có (404) · chính người tạo (403 TU_DUYET) · đã xử lý (409). */
async function viSaoKhongDoi(tx, id, nguoi) {
  const p = await tx.queryOne('SELECT trang_thai, nguoi_tao FROM kho_phieu WHERE id = ?', [id]);
  if (!p) return { loi: [404, { error: 'Không thấy phiếu', code: 'KHONG_THAY' }] };
  if (p.trang_thai === 'cho_duyet' && p.nguoi_tao === nguoi) return { loi: [403, { error: 'Người tạo phiếu không tự duyệt / từ chối được — nhờ người khác', code: 'TU_DUYET' }] };
  return { loi: [409, { error: 'Phiếu đã được xử lý — tải lại để xem', code: 'PHIEU_DA_XU_LY' }] };
}

/** KHO-2b: đơn đặt hàng vượt hạn mức đặt hàng ĐANG cài (hoặc thiếu giá) → chỉ chủ quán duyệt. */
const dhCanChuQuan = async (csdl, id) => !trongHanMuc(tongTien((await csdl.query("SELECT so_luong, don_gia FROM kho_phieu_dong WHERE phieu_id = ? AND loai = 'dat'", [id]))
  .map((d) => ({ so_luong: Number(d.so_luong), don_gia: d.don_gia == null ? null : Number(d.don_gia) }))), await docHanMuc(csdl, KHOA_HAN_MUC_DAT_HANG));

/** Ghi kho cho phiếu VỪA chuyển da_duyet, theo loại. DH không đổi kho. Trả { loi } khi không ghi được (giao dịch rollback). require muộn: hai file dùng hàm của file này. */
const ghiKhoTheoLoai = (tx, loai, id, luc) => ({
  PX: () => ghiKho(tx, id, luc, luc),
  PN: () => require('./nhapHang').ghiKhoNhan(tx, id, luc),
  PS: () => require('./phatSinh').ghiKhoPhatSinh(tx, id, luc),
}[loai] || (() => ({})))();

/** Duyệt / từ chối: CÙNG điều kiện khoá trong câu ghi (chờ duyệt + người duyệt khác người tạo) — hai người bấm cùng lúc chỉ một lần ghi. */
async function duyetPhieu(tx, id, nguoi, luc, vaiTro) {
  const p = await tx.queryOne('SELECT loai, trang_thai FROM kho_phieu WHERE id = ?', [id]);
  if (p?.loai === 'DH' && p.trang_thai === 'cho_duyet' && vaiTro !== 'owner' && await dhCanChuQuan(tx, id)) {
    return { loi: [403, { error: 'Đơn vượt hạn mức đặt hàng — chỉ chủ quán duyệt', code: 'CAN_CHU_QUAN' }] };
  }
  const kq = await tx.run(`UPDATE kho_phieu SET trang_thai = 'da_duyet', nguoi_duyet = ?, duyet_luc = ? WHERE id = ?
    AND trang_thai = 'cho_duyet' AND nguoi_tao <> ?`, [nguoi, luc, id, nguoi]);
  if (!kq.changes) return viSaoKhongDoi(tx, id, nguoi);
  return (await ghiKhoTheoLoai(tx, p.loai, id, luc)) || {};
}

async function tuChoiPhieu(tx, id, nguoi, lyDo, luc) {
  const kq = await tx.run(`UPDATE kho_phieu SET trang_thai = 'huy', ly_do = ?, nguoi_huy = ?, huy_luc = ? WHERE id = ?
    AND trang_thai = 'cho_duyet' AND nguoi_tao <> ?`, [lyDo, nguoi, luc, id, nguoi]);
  return kq.changes ? {} : viSaoKhongDoi(tx, id, nguoi);
}

/** Chủ quán huỷ (cũng là bước đầu của sửa). GIỮ mọi dòng — phiếu huy rơi khỏi tồn. Ghi người / giờ huỷ, giữ người đã duyệt. */
async function huyPhieu(tx, id, lyDo, nguoi, luc) {
  const kq = await tx.run(`UPDATE kho_phieu SET trang_thai = 'huy', ly_do = ?, nguoi_huy = ?, huy_luc = ? WHERE id = ?
    AND trang_thai IN ('cho_duyet', 'da_duyet')`, [lyDo, nguoi, luc, id]);
  return kq.changes ? {} : viSaoKhongDoi(tx, id, null);
}

/** Sửa = huỷ phiếu cũ + phiếu MỚI thay_cho_id, tự duyệt, hạn lô theo giờ làm THẬT của phiếu cũ. */
async function suaPhieu(tx, id, mon, nguoi, lyDo, luc) {
  const huy = await huyPhieu(tx, id, lyDo, nguoi, luc);
  if (huy.loi) return huy;
  const cu = await tx.queryOne('SELECT duyet_luc FROM kho_phieu WHERE id = ?', [id]);
  return taoPhieuXuat(tx, { mon, nguoi, tuDuyet: true, thayCho: id, lyDo, luc, lucLam: cu.duyet_luc || luc });
}

const lechCuaMon = async (csdl, spId) => (await csdl.queryOne(`SELECT n.lech_cho_phep FROM kho_san_pham s
  LEFT JOIN kho_nhom_cong_thuc n ON n.id = s.nhom_id WHERE s.pos_product_id = ?`, [spId]))?.lech_cho_phep ?? null;

/** Kết quả một món: dòng ket_qua = số thực − chuẩn, cùng lô. Một kết quả mỗi lô do CHỈ MỤC DUY NHẤT (ux_kho_ket_qua_lo) giữ. */
async function ghiKetQua(tx, { phieuId, spId, soThuc, ghiChu, nguoi, luc }) {
  const p = await tx.queryOne("SELECT * FROM kho_phieu WHERE id = ? AND loai = 'PX'", [phieuId]);
  if (!p) return { loi: [404, { error: 'Không thấy phiếu', code: 'KHONG_THAY' }] };
  if (p.trang_thai !== 'da_duyet' || p.thay_cho_id != null) {
    return { loi: [409, { error: 'Phiếu này không điền kết quả được (chưa duyệt, đã huỷ hoặc là phiếu sửa)', code: 'PHIEU_KHONG_DIEN' }] };
  }
  if (trangThaiKetQua(p.duyet_luc.slice(0, 10), luc.slice(0, 10), false, false) === 'tu_chot') {
    return { loi: [409, { error: 'Đã qua ngày — kết quả tự chốt đúng chuẩn. Sai thì chủ quán sửa phiếu', code: 'DA_TU_CHOT' }] };
  }
  const d = await tx.queryOne("SELECT lo_id, so_luong FROM kho_phieu_dong WHERE phieu_id = ? AND loai = 'thanh_pham' AND san_pham_id = ?", [phieuId, spId]);
  if (!d) return { loi: [404, { error: 'Món không có trong phiếu', code: 'KHONG_THAY' }] };
  const thuc = soThuc ?? Number(d.so_luong);
  try {
    await tx.run("INSERT INTO kho_phieu_dong (phieu_id, san_pham_id, lo_id, so_luong, ghi_chu, loai, nguoi, luc) VALUES (?, ?, ?, ?, ?, 'ket_qua', ?, ?)",
      [phieuId, spId, d.lo_id, thuc - Number(d.so_luong), ghiChu, nguoi, luc]);
  } catch (e) {
    if (!laTrungKhoa(e)) throw e;
    return { loi: [409, { error: 'Món này đã có kết quả — tải lại để xem', code: 'DA_CO_KET_QUA' }] };
  }
  return { lech: lechQuaNguong(Number(d.so_luong), thuc, await lechCuaMon(tx, spId)) };
}

const ngayLam = (p) => String(p.duyet_luc || p.tao_luc).slice(0, 10);
const ketQuaPhieu = (p, homNay, duKetQua) => (p.loai === 'PX' && p.trang_thai === 'da_duyet' ? trangThaiKetQua(ngayLam(p), homNay, duKetQua, p.thay_cho_id != null) : null);

/** Một phiếu đầy đủ (màn xem + in): bảng tổng (tồn hiện tại, cờ âm) + bảng theo món (lô, hạn, kết quả, lệch). */
async function docPhieu(csdl, id, homNay) {
  const p = await csdl.queryOne(`SELECT p.*, (SELECT t.id FROM kho_phieu t WHERE t.thay_cho_id = p.id ORDER BY t.id DESC LIMIT 1) AS thay_bang_id
    FROM kho_phieu p WHERE p.id = ?`, [id]);
  if (!p) return null;
  const dong = await csdl.query('SELECT * FROM kho_phieu_dong WHERE phieu_id = ? ORDER BY id', [id]);
  if (p.loai !== 'PX') return docPhieuNhap(csdl, p, dong);
  const nlIds = [...new Set(dong.filter((d) => d.nguyen_lieu_id != null).map((d) => Number(d.nguyen_lieu_id)))];
  const nl = theoId(nlIds.length ? await csdl.query(`SELECT l.id, l.ten, l.don_vi_luu, l.don_vi_hien, l.he_so_doi, ${COT_TON_NL} AS ton
    FROM kho_nguyen_lieu l WHERE l.id IN (${dauHoi(nlIds)})`, nlIds) : []);
  const spIds = [...new Set(dong.filter((d) => d.san_pham_id != null).map((d) => Number(d.san_pham_id)))];
  const ten = new Map(spIds.length ? (await tenSanPham(csdl, spIds)).map((t, i) => [spIds[i], t]) : []);
  const lo = theoId(await csdl.query('SELECT id, han_dung, gia_von FROM kho_lo WHERE phieu_id = ?', [id]));
  const b = bangPhieu(dong, nl, ten);
  const kqDong = dong.filter((d) => d.loai === 'ket_qua');
  const theo_mon = [];
  for (const m of b.theo_mon) {
    const d = kqDong.find((x) => Number(x.san_pham_id) === m.san_pham_id);
    const tt = ketQuaPhieu(p, homNay, !!d);
    const soThuc = d ? m.so_phan + Number(d.so_luong) : null;
    theo_mon.push({ ...m, han_dung: lo.get(m.lo_id)?.han_dung ?? null, gia_von: lo.get(m.lo_id)?.gia_von ?? null,
      ket_qua: tt && { trang_thai: tt, so_thuc: soThuc, ghi_chu: d?.ghi_chu ?? null, nguoi: d?.nguoi ?? null, luc: d?.luc ?? null,
        lech: d ? lechQuaNguong(m.so_phan, soThuc, await lechCuaMon(csdl, m.san_pham_id)) : false } });
  }
  const tong = b.tong.map((t) => ({ ...t, ton: Number(nl.get(t.nguyen_lieu_id)?.ton ?? 0), am: Number(nl.get(t.nguyen_lieu_id)?.ton ?? 0) < -1e-9 }));
  return { phieu: { ...p, ket_qua: ketQuaPhieu(p, homNay, kqDong.length >= b.theo_mon.length) }, tong, theo_mon };
}

/** KHO-2b: chuỗi id của một đơn và các đơn nó thay (sửa đơn = đơn mới thay_cho_id) — phiếu nhận của đơn cũ vẫn tính. */
async function chuoiDon(csdl, id) {
  const ids = [Number(id)];
  for (let p = await csdl.queryOne('SELECT thay_cho_id FROM kho_phieu WHERE id = ?', [id]); p?.thay_cho_id != null;
    p = await csdl.queryOne('SELECT thay_cho_id FROM kho_phieu WHERE id = ?', [p.thay_cho_id])) ids.push(Number(p.thay_cho_id));
  return ids;
}

/** Phần còn lại của đơn = dòng đặt − dòng nhận của phiếu nhận chờ duyệt / đã duyệt cùng chuỗi đơn (từ chối / huỷ → phần đó mở lại). */
async function docConLaiDon(csdl, donId) {
  const ids = await chuoiDon(csdl, donId);
  const dat = await csdl.query("SELECT nguyen_lieu_id, so_luong FROM kho_phieu_dong WHERE phieu_id = ? AND loai = 'dat' ORDER BY id", [donId]);
  const nhan = await csdl.query(`SELECT d.nguyen_lieu_id, d.so_luong FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id WHERE p.loai = 'PN'
    AND p.don_id IN (${dauHoi(ids)}) AND p.trang_thai IN ('cho_duyet', 'da_duyet') AND d.loai = 'nhap'`, ids);
  return conLaiDon(dat, nhan);
}

/** KHO-2b: phiếu DH / PN / PS — bảng dòng (tên, đơn vị hiện, hạn, lô). DH: tổng ước tính, cần chủ quán, còn lại. PN theo đơn: cờ lệch / ngoài đơn. */
async function docPhieuNhap(csdl, p, dong) {
  const ids = (cot) => [...new Set(dong.filter((d) => d[cot] != null).map((d) => Number(d[cot])))];
  const nlIds = ids('nguyen_lieu_id');
  const nl = theoId(nlIds.length ? await csdl.query(`SELECT id, ten, don_vi_luu, don_vi_hien, he_so_doi FROM kho_nguyen_lieu WHERE id IN (${dauHoi(nlIds)})`, nlIds) : []);
  const spIds = ids('san_pham_id');
  const ten = new Map(spIds.length ? (await tenSanPham(csdl, spIds)).map((t, i) => [spIds[i], t]) : []);
  const loIds = ids('lo_id');
  const lo = theoId(loIds.length ? await csdl.query(`SELECT id, han_dung FROM kho_lo WHERE id IN (${dauHoi(loIds)})`, loIds) : []);
  const datCua = p.loai === 'PN' && p.don_id != null ? new Map((await docConLaiDon(csdl, p.don_id)).con_lai.map((d) => [d.nguyen_lieu_id, d.dat])) : null;
  const ds = dong.map((d) => {
    const n = nl.get(Number(d.nguyen_lieu_id));
    const luong = Math.abs(Number(d.so_luong));
    const dat = datCua && datCua.get(Number(d.nguyen_lieu_id));
    return { id: Number(d.id), loai: d.loai, nguyen_lieu_id: n ? Number(d.nguyen_lieu_id) : null, san_pham_id: d.san_pham_id == null ? null : Number(d.san_pham_id),
      ten: n ? n.ten : ten.get(Number(d.san_pham_id)), don_vi: n ? n.don_vi_hien || n.don_vi_luu : 'phần', luong, luong_hien: n ? doiDonVi(luong, n.he_so_doi || 1) : luong,
      don_gia: d.don_gia, han_dung: d.han_dung ?? lo.get(Number(d.lo_id))?.han_dung ?? null, lo_id: d.lo_id == null ? null : Number(d.lo_id),
      cho_mon_id: d.cho_mon_id == null ? null : Number(d.cho_mon_id), ...(datCua && { ngoai_don: dat === undefined, lech: dat !== undefined && Math.abs(dat - luong) > SAI_SO }) };
  });
  const them = {};
  if (p.loai === 'DH') {
    them.tong_uoc_tinh = tongTien(ds.map((d) => ({ so_luong: d.luong, don_gia: d.don_gia == null ? null : Number(d.don_gia) })));
    them.can_chu_quan = p.trang_thai === 'cho_duyet' && await dhCanChuQuan(csdl, p.id);
  }
  const conLai = p.loai === 'DH' && p.trang_thai === 'da_duyet' ? (await docConLaiDon(csdl, p.id)).con_lai.map((d) => {
    const n = nl.get(d.nguyen_lieu_id) || {};
    return { ...d, ten: n.ten, don_vi: n.don_vi_hien || n.don_vi_luu, dat_hien: doiDonVi(d.dat, n.he_so_doi || 1), con_lai_hien: doiDonVi(d.con_lai, n.he_so_doi || 1) };
  }) : null;
  return { phieu: { ...p, ...them }, dong: ds, con_lai: conLai, tong: [], theo_mon: [] };
}

/** Danh sách phiếu — lọc loại / trạng thái / ngày tạo (giờ VN). Cũng là nguồn đếm "chờ duyệt". */
async function dsPhieu(csdl, loc, homNay) {
  const dk = [];
  const a = [];
  for (const [cot, gt] of [['p.loai = ?', loc.loai], ['p.trang_thai = ?', loc.trang_thai], ['substr(p.tao_luc, 1, 10) >= ?', loc.tu], ['substr(p.tao_luc, 1, 10) <= ?', loc.den]]) {
    if (gt) { dk.push(cot); a.push(String(gt)); }
  }
  const ds = await csdl.query(`SELECT p.*,
    (SELECT COUNT(*) FROM kho_phieu_dong d WHERE d.phieu_id = p.id AND d.loai = 'thanh_pham') AS so_mon,
    (SELECT COUNT(*) FROM kho_phieu_dong d WHERE d.phieu_id = p.id AND d.loai = 'ket_qua') AS so_ket_qua,
    (SELECT GROUP_CONCAT(sp.name || ' ×' || printf('%g', d.so_luong), ', ') FROM kho_phieu_dong d JOIN pos_products sp ON sp.id = d.san_pham_id
      WHERE d.phieu_id = p.id AND d.loai = 'thanh_pham') AS mon,
    (SELECT GROUP_CONCAT(DISTINCT COALESCE(l.ten, sp.name)) FROM kho_phieu_dong d LEFT JOIN kho_nguyen_lieu l ON l.id = d.nguyen_lieu_id
      LEFT JOIN pos_products sp ON sp.id = d.san_pham_id WHERE d.phieu_id = p.id AND d.loai IN ('dat', 'nhap', 'phat_sinh')) AS hang
    FROM kho_phieu p ${dk.length ? 'WHERE ' + dk.join(' AND ') : ''} ORDER BY p.id DESC LIMIT 300`, a);
  const ra = [];
  for (const p of ds) {
    ra.push({ ...p, ket_qua: ketQuaPhieu(p, homNay, Number(p.so_ket_qua) >= Number(p.so_mon)),
      can_chu_quan: p.loai === 'DH' && p.trang_thai === 'cho_duyet' && await dhCanChuQuan(csdl, p.id) });
  }
  return { phieu: ra };
}

/** Tồn kho: nguyên liệu (cờ dưới tối thiểu / âm) + thành phẩm theo lô (cờ hạn). bayGio = getNow(). */
async function docTon(csdl, bayGio) {
  const nl = await csdl.query(`SELECT l.id, l.ten, l.nhom_id, n.ten AS nhom_ten, l.don_vi_luu, l.don_vi_hien, l.he_so_doi, l.gia_nhap, l.ton_toi_thieu,
    l.dang_dung, ${COT_TON_NL} AS ton FROM kho_nguyen_lieu l LEFT JOIN kho_nhom_nguyen_lieu n ON n.id = l.nhom_id ORDER BY l.ten`);
  const sp = await csdl.query(`SELECT p.id AS san_pham_id, p.name AS ten, s.nhom_id, n.ten AS nhom_ten FROM kho_san_pham s
    JOIN pos_products p ON p.id = s.pos_product_id LEFT JOIN kho_nhom_cong_thuc n ON n.id = s.nhom_id
    WHERE s.kieu = 'lam_san' OR EXISTS (SELECT 1 FROM kho_lo l WHERE l.san_pham_id = p.id) ORDER BY p.name`);
  const lo = await conLaiTheoLo(csdl, 'l.san_pham_id IS NOT NULL', [], 'han_dung IS NULL, han_dung, id');
  const mocSapHet = hanLo(bayGio, SAP_HET_HAN_NGAY);
  return {
    nguyen_lieu: nl.map((r) => {
      const ton = Number(r.ton);
      return { ...r, ton, ton_hien: doiDonVi(ton, r.he_so_doi || 1), am: ton < -1e-9, duoi_toi_thieu: r.ton_toi_thieu != null && ton < Number(r.ton_toi_thieu) };
    }),
    thanh_pham: sp.map((m) => {
      const cua = lo.filter((l) => Number(l.san_pham_id) === Number(m.san_pham_id))
        .map((l) => ({ id: Number(l.id), con: Number(l.con), han_dung: l.han_dung, han: trangThaiHan(l.han_dung, bayGio, mocSapHet), gia_von: l.gia_von }));
      return { ...m, san_pham_id: Number(m.san_pham_id), ton: cua.reduce((t, l) => t + l.con, 0), lo: cua };
    }),
    nhom_nguyen_lieu: await csdl.query('SELECT id, ten FROM kho_nhom_nguyen_lieu ORDER BY thu_tu, ten'),
    nhom_cong_thuc: await csdl.query('SELECT id, ten FROM kho_nhom_cong_thuc ORDER BY thu_tu, ten'),
  };
}

module.exports = { docNguyenLieu, cotNguyenLieu, themNguyenLieu, suaNguyenLieu, xoaNguyenLieu, docBangCongThuc, docSanPham, luuSanPham,
  demThieu, tenSanPham, hanLo, nvCanDuyet, docPhaChe, docDinhMuc, luuDinhMuc, taoPhieuXuat, duyetPhieu, tuChoiPhieu, huyPhieu,
  suaPhieu, ghiKetQua, docPhieu, dsPhieu, docTon,
  KHOA_HAN_MUC_NOI_BO, theoId, dauHoi, conLaiTheoLo, docHanMuc, soPhieuMoi, themPhieu, docConLaiDon };
