/**
 * KHO-1 — đường /api/pos/kho: nhận yêu cầu, kiểm quyền (ở MÁY CHỦ), gọi hàm của tinh.js / duLieu.js / nhapSx.js.
 * Quyền (phiếu I): chủ quán mọi thứ · quản lý thêm / sửa nguyên liệu, nhóm, nhà cung cấp, xem công thức · nhân viên chỉ xem nguyên liệu.
 * KHO-2a: chủ — mọi thứ · quản lý — định mức, tạo + duyệt phiếu, xem giá · nhân viên — Pha chế, tạo phiếu, tồn KHÔNG giá. Đường lạ → 403.
 * KHO-2b: đặt hàng (DH) · nhận hàng (PN) · phát sinh (PS) — mọi vai trò tạo; duyệt / từ chối quản lý (người KHÁC người tạo), đơn vượt hạn mức chỉ chủ quán;
 * sửa / huỷ chỉ chủ quán. Hàm tạo ở nhapHang.js / phatSinh.js.
 * KHO-GON-1: việc hôm nay (mọi vai trò) · mẫu việc, ngưỡng (chủ / quản lý) · số ca, cho quản lý chỉnh tay, mở lại việc (chủ quán) · kiểm kê / bàn giao
 * (mọi vai trò, phiếu KK đã duyệt ngay) · chỉnh tồn tay (chủ quán; quản lý khi công tắc bật) · diễn biến (chủ / quản lý). Tạo PX / PN / PS → ghi diễn biến
 * + tự xong việc trong CÙNG giao dịch (viec.sauTaoPhieu).
 * Ghi: trongGiaoDich + loiGhi dùng chung (kho bận → 409 KHO_BAN).
 */
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const csdl = require('../database');
const { authenticate, checkRole } = require('../middleware/auth');
const { loiGhi, trongGiaoDich } = require('../routes/wallets');
const { getNow, addDaysToDateString } = require('../utils/helpers');
const tinh = require('./tinh');
const duLieu = require('./duLieu');
const nhapSx = require('./nhapSx');
const nhapHang = require('./nhapHang');
const phatSinh = require('./phatSinh');
const banHang = require('./banHang');   // KHO-3a
const viec = require('./viec');   // KHO-GON-1
const kiemKe = require('./kiemKe');   // KHO-GON-1

const router = express.Router();
const QUAN_LY = checkRole('owner', 'manager');
const CHU_QUAN = checkRole('owner');
const VAI_QUAN_LY = ['owner', 'manager'];
const NHAN_VIEN = checkRole(...VAI_QUAN_LY, 'staff');

router.use(authenticate, (req, res, next) => {
  const hong = csdl.layNangCapHong();
  if (hong) return res.status(503).json({ error: `Nâng cấp dữ liệu hỏng (${hong}) — báo người làm kỹ thuật`, code: 'NANG_CAP_HONG' });
  next();
});

const tenTrung = (res) => res.status(409).json({ error: 'Tên này đã có — chọn tên khác', code: 'TEN_TRUNG' });
const loiGhiKho = (res, e) => (tinh.laTrungKhoa(e) ? tenTrung(res) : loiGhi(res, e));
const doc = (lay) => async (req, res) => {
  try { res.json(await lay(req)); } catch (e) { console.error('Lỗi đọc kho:', e); res.status(500).json({ error: 'Lỗi máy chủ', code: 'LOI_MAY_CHU' }); }
};

// ── Nguyên liệu ──
// Giá nhập (giá vốn) chỉ cho chủ quán / quản lý — danh sách CHO PHÉP, cùng khuôn checkRole (vai trò lạ cũng không thấy).
router.get('/nguyen-lieu', doc((req) => duLieu.docNguyenLieu(csdl, !['owner', 'manager'].includes(req.user.role))));

router.post('/nguyen-lieu', QUAN_LY, async (req, res) => {
  const cot = duLieu.cotNguyenLieu(req.body || {});
  if (!cot) return res.status(400).json({ error: 'Chưa nhập tên nguyên liệu', code: 'THIEU_TEN' });
  try { res.json({ success: true, id: (await duLieu.themNguyenLieu(csdl, cot, getNow())).lastInsertRowid }); } catch (e) { loiGhiKho(res, e); }
});

router.put('/nguyen-lieu/:id', QUAN_LY, async (req, res) => {
  const cot = duLieu.cotNguyenLieu(req.body || {});
  if (!cot) return res.status(400).json({ error: 'Chưa nhập tên nguyên liệu', code: 'THIEU_TEN' });
  try {
    const kq = await duLieu.suaNguyenLieu(csdl, Number(req.params.id), cot, getNow());
    if (!kq.changes) return res.status(404).json({ error: 'Không thấy nguyên liệu', code: 'KHONG_THAY' });
    res.json({ success: true });
  } catch (e) { loiGhiKho(res, e); }
});

router.delete('/nguyen-lieu/:id', QUAN_LY, async (req, res) => {
  try {
    if ((await duLieu.xoaNguyenLieu(csdl, Number(req.params.id))).changes) return res.json({ success: true });
    res.status(409).json({ error: 'Nguyên liệu đang nằm trong công thức hoặc phiếu kho — dùng "Ngừng dùng" thay vì xoá', code: 'NGUYEN_LIEU_DANG_DUNG' });
  } catch (e) { loiGhi(res, e); }
});

// ── Nhóm nguyên liệu, nhà cung cấp, nhóm công thức (KHO-2a: % lệch cho phép): cùng một khuôn thêm / sửa ──
const soKhongAm = (x) => (x !== '' && x != null && Number(x) >= 0 && Number.isFinite(Number(x)) ? Number(x) : null);
for (const [duong, bang, cot] of [['nhom', 'kho_nhom_nguyen_lieu', ['ten', 'thu_tu']], ['nha-cung-cap', 'kho_nha_cung_cap', ['ten', 'sdt', 'ghi_chu', 'dang_dung']],
  ['nhom-cong-thuc', 'kho_nhom_cong_thuc', ['ten', 'thu_tu', 'lech_cho_phep']]]) {
  const giaTri = (b) => cot.map((c) => (c === 'ten' ? String(b.ten ?? '').trim() : c === 'lech_cho_phep' ? soKhongAm(b[c])
    : b[c] ?? (c === 'dang_dung' ? 1 : c === 'thu_tu' ? 0 : null)));
  router.post(`/${duong}`, QUAN_LY, async (req, res) => {
    const v = giaTri(req.body || {});
    if (!v[0]) return res.status(400).json({ error: 'Chưa nhập tên', code: 'THIEU_TEN' });
    try {
      const kq = await csdl.run(`INSERT INTO ${bang} (${cot.join(', ')}) VALUES (${cot.map(() => '?').join(', ')})`, v);
      res.json({ success: true, id: kq.lastInsertRowid });
    } catch (e) { loiGhiKho(res, e); }
  });
  router.put(`/${duong}/:id`, QUAN_LY, async (req, res) => {
    const v = giaTri(req.body || {});
    if (!v[0]) return res.status(400).json({ error: 'Chưa nhập tên', code: 'THIEU_TEN' });
    try {
      const kq = await csdl.run(`UPDATE ${bang} SET ${cot.map((c) => c + ' = ?').join(', ')} WHERE id = ?`, [...v, Number(req.params.id)]);
      if (!kq.changes) return res.status(404).json({ error: 'Không thấy', code: 'KHONG_THAY' });
      res.json({ success: true });
    } catch (e) { loiGhiKho(res, e); }
  });
}

// ── Sản phẩm & công thức ──
router.get('/san-pham', QUAN_LY, doc(() => duLieu.docSanPham(csdl)));

router.get('/san-pham/:id/trien-khai', QUAN_LY, async (req, res) => {
  const soPhan = Number(req.query.so_phan);
  if (!(soPhan > 0)) return res.status(400).json({ error: 'Số phần phải lớn hơn 0', code: 'SO_PHAN_SAI' });
  try {
    const kq = tinh.trienKhai({ goc: Number(req.params.id), bang: await duLieu.docBangCongThuc(csdl) }, soPhan);
    const nl = new Map((await csdl.query('SELECT id, ten, don_vi_luu, don_vi_hien, he_so_doi FROM kho_nguyen_lieu')).map((r) => [Number(r.id), r]));
    res.json({ nguyen_lieu: kq.map((d) => { const n = nl.get(d.nguyen_lieu_id) || {}; return { ...n, ...d, luong_hien: tinh.doiDonVi(d.luong, n.he_so_doi || 1) }; }) });
  } catch (e) { console.error('Lỗi triển khai công thức:', e); res.status(500).json({ error: 'Lỗi máy chủ', code: 'LOI_MAY_CHU' }); }
});

router.put('/san-pham/:id', CHU_QUAN, async (req, res) => {
  const spId = Number(req.params.id);
  const { kieu, nhom_id: nhomId = null, cong_thuc: dongVao = [] } = req.body || {};
  if (!tinh.KIEU_SAN_PHAM.includes(kieu)) return res.status(400).json({ error: 'Kiểu sản phẩm không hợp lệ', code: 'KIEU_SAI' });
  // KHO-2a: không gửi han_ngay = giữ hạn đang có (màn công thức cũ không gửi trường này); null / '' = bỏ hạn; còn lại phải là số NGUYÊN ngày > 0
  // (addDaysToDateString cắt phần lẻ — 0.5 ngày thành lô hết hạn ngay lúc vào kho)
  const hanVao = req.body.han_ngay;
  const hanNgay = 'han_ngay' in req.body ? tinh.soNgayNguyen(hanVao) : undefined;
  if (hanNgay === null && hanVao !== null && hanVao !== '') {
    return res.status(400).json({ error: `Hạn dùng phải là số ngày nguyên từ 1 tới ${tinh.HAN_NGAY_TOI_DA}`, code: 'HAN_SAI' });
  }
  // KHO-3a B8: "Cho bán khi thiếu nguyên liệu" — chỉ chủ quán (đường này CHU_QUAN); không gửi = giữ; chỉ 0 / 1.
  const choBanThieu = 'cho_ban_thieu' in req.body ? [0, 1].indexOf(Number(req.body.cho_ban_thieu)) : undefined;
  if (choBanThieu === -1) return res.status(400).json({ error: 'Cho bán khi thiếu nguyên liệu chỉ nhận 0 hoặc 1', code: 'CHO_BAN_THIEU_SAI' });
  const dong = Array.isArray(dongVao) ? dongVao.map((d) => ({ nguyen_lieu_id: Number(d.nguyen_lieu_id) || null,
    thanh_phan_id: Number(d.thanh_phan_id) || null, luong: Number(d.luong) })) : null;
  if (!dong || dong.some((d) => !(d.luong > 0) || !Number.isFinite(d.luong) || !d.nguyen_lieu_id === !d.thanh_phan_id)) {
    return res.status(400).json({ error: 'Dòng công thức sai: mỗi dòng một nguyên liệu HOẶC một sản phẩm, lượng > 0', code: 'DONG_CONG_THUC_SAI' });
  }
  try {
    const kq = await trongGiaoDich(async (tx) => {
      if (await duLieu.demThieu(tx, 'pos_products', [spId, ...dong.filter((d) => d.thanh_phan_id).map((d) => d.thanh_phan_id)])
        || await duLieu.demThieu(tx, 'kho_nguyen_lieu', dong.filter((d) => d.nguyen_lieu_id).map((d) => d.nguyen_lieu_id))
        || (nhomId != null && await duLieu.demThieu(tx, 'kho_nhom_cong_thuc', [Number(nhomId)]))) {
        return { huy: true, loi: [400, { error: 'Món, nguyên liệu hoặc nhóm không có', code: 'KHONG_THAY' }] };
      }
      const bang = await duLieu.docBangCongThuc(tx);
      bang[spId] = dong.map((d) => (d.nguyen_lieu_id ? { nguyen_lieu_id: d.nguyen_lieu_id, luong: d.luong } : { thanh_phan_id: d.thanh_phan_id, luong: d.luong }));
      try {
        tinh.trienKhai({ goc: spId, bang }, 1);
      } catch (e) {
        if (e.code !== 'CONG_THUC_VONG_LAP') throw e;
        const chuoi = (await duLieu.tenSanPham(tx, e.chuoi)).join(' → ');
        return { huy: true, loi: [400, { error: `Công thức vòng lặp: ${chuoi}`, code: 'CONG_THUC_VONG_LAP' }] };
      }
      await duLieu.luuSanPham(tx, spId, kieu, nhomId, dong, getNow(), hanNgay, choBanThieu);
      return {};
    });
    if (kq.loi) return res.status(kq.loi[0]).json(kq.loi[1]);
    res.json({ success: true });
  } catch (e) { loiGhi(res, e); }
});

// ── Nhập từ SX (chỉ chủ quán): ghi = '0' xem trước, '1' ghi. File tạm luôn xoá. ──
const nhanFile = multer({ dest: nhapSx.THU_MUC_TAM, limits: { fileSize: nhapSx.GIOI_HAN_FILE_SX } }).single('file');
router.post('/nhap-sx', CHU_QUAN, (req, res) => nhanFile(req, res, async (loiNhan) => {
  try {
    if (loiNhan && loiNhan.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: `File quá lớn (tối đa ${nhapSx.GIOI_HAN_FILE_SX / 1024 / 1024} MB)`, code: 'FILE_QUA_LON' });
    }
    if (loiNhan || !req.file) return res.status(400).json({ error: 'Chưa nhận được file sao lưu SX', code: 'FILE_SX_HONG' });
    const sx = await nhapSx.docFileSx(req.file.path);
    if (req.body.ghi !== '1') return res.json({ ke_hoach: nhapSx.lapKeHoach(sx, await nhapSx.docHienCo(csdl)), da_ghi: false });
    const keHoach = await trongGiaoDich(async (tx) => {
      const kh = nhapSx.lapKeHoach(sx, await nhapSx.docHienCo(tx));
      await nhapSx.ghiKeHoach(tx, kh, getNow());
      return kh;
    });
    res.json({ ke_hoach: keHoach, da_ghi: true });
  } catch (e) {
    if (e.code === 'FILE_SX_HONG') return res.status(400).json({ error: e.message, code: e.code });
    loiGhi(res, e);
  } finally {
    if (req.file) for (const duoi of ['', '-journal', '-wal', '-shm']) fs.rmSync(req.file.path + duoi, { force: true });
  }
}));

// ═════════════════════════════ KHO-2a — pha chế · phiếu xuất · tồn ═════════════════════════════
const anGia = (req) => !VAI_QUAN_LY.includes(req.user.role);
const traVe = (req, res, obj) => res.json(anGia(req) ? tinh.boGia(obj) : obj);
const thieuLyDo = (res) => res.status(400).json({ error: 'Cần ghi lý do', code: 'THIEU_LY_DO' });
const lyDoCua = (req) => String(req.body?.ly_do ?? '').trim();

/** [{ san_pham_id, so_phan }] hợp lệ (số phần > 0, không trùng món) hoặc null. */
function monHopLe(ds) {
  if (!Array.isArray(ds) || !ds.length) return null;
  const mon = ds.map((m) => ({ san_pham_id: Number(m?.san_pham_id), so_phan: Number(m?.so_phan) }));
  const dung = mon.every((m) => m.san_pham_id > 0 && m.so_phan > 0 && Number.isFinite(m.so_phan)) && new Set(mon.map((m) => m.san_pham_id)).size === mon.length;
  return dung ? mon : null;
}
const LOI_SO_PHAN = { error: 'Chọn ít nhất một món, số phần lớn hơn 0', code: 'SO_PHAN_SAI' };
const soPhanSai = (res) => res.status(400).json(LOI_SO_PHAN);

async function traPhieu(req, res, id, them = {}) {
  const p = await duLieu.docPhieu(csdl, id, getNow().slice(0, 10));
  if (!p) return res.status(404).json({ error: 'Không thấy phiếu', code: 'KHONG_THAY' });
  traVe(req, res, { ...p, ...them });
}

/**
 * Đường ghi phiếu: lam(req, tx, luc) trả { loi } (rollback, trả lỗi) hoặc { id, ...them } (trả phiếu đầy đủ).
 * khiTrung(req): đụng khoá duy nhất → id phiếu đã có (bấm hai lần) hoặc null.
 */
const ghiPhieu = (lam, khiTrung) => async (req, res) => {
  try {
    const luc = getNow();
    const kq = await trongGiaoDich(async (tx) => { const r = await lam(req, tx, luc); return r.loi ? { ...r, huy: true } : r; });
    if (kq.loi) return res.status(kq.loi[0]).json(kq.loi[1]);
    const { id, ...them } = kq;
    await traPhieu(req, res, id, them);
  } catch (e) {
    const id = khiTrung && tinh.laTrungKhoa(e) ? await khiTrung(req).catch(() => null) : null;
    if (id) return traPhieu(req, res, id).catch((e2) => loiGhi(res, e2));
    loiGhi(res, e);
  }
};

router.get('/pha-che', NHAN_VIEN, doc((req) => {
  const luc = getNow();
  const homNay = luc.slice(0, 10);
  if (req.query.ngay !== 'ngay_mai') return duLieu.docPhaChe(csdl, homNay, luc);
  const mai = addDaysToDateString(homNay, 1);
  return duLieu.docPhaChe(csdl, mai, mai + 'T00:00:00');   // "cho ngày mai": lô còn hạn lúc 00:00 ngày mai
}));

router.get('/dinh-muc', QUAN_LY, doc(() => duLieu.docDinhMuc(csdl)));

router.put('/dinh-muc', QUAN_LY, async (req, res) => {
  const spId = Number(req.body?.san_pham_id);
  const dong = Array.isArray(req.body?.dinh_muc) ? req.body.dinh_muc.map((d) => ({ thu: d?.thu == null || d.thu === '' ? null : Number(d.thu), so_luong: Number(d?.so_luong) })) : null;
  if (!(spId > 0) || !dong || dong.some((d) => (d.thu !== null && !(Number.isInteger(d.thu) && d.thu >= 0 && d.thu <= 6)) || !(d.so_luong >= 0) || !Number.isFinite(d.so_luong))
    || new Set(dong.map((d) => d.thu)).size !== dong.length) {
    return res.status(400).json({ error: 'Định mức sai: mỗi thứ (0–6 hoặc mọi ngày) một dòng, số phần ≥ 0', code: 'DINH_MUC_SAI' });
  }
  try {
    const kq = await trongGiaoDich(async (tx) => {
      if (await duLieu.demThieu(tx, 'pos_products', [spId])) return { huy: true };
      await duLieu.luuDinhMuc(tx, spId, dong);
      return {};
    });
    if (kq.huy) return res.status(404).json({ error: 'Không thấy món', code: 'KHONG_THAY' });
    res.json({ success: true });
  } catch (e) { loiGhi(res, e); }
});

// Nhân viên tạo → chờ duyệt (trừ khi chủ quán tắt công tắc); quản lý / chủ → tự duyệt. Cùng ma_gui (bấm hai lần) → trả phiếu đã tạo.
const maGuiCua = (req) => (req.body?.ma_gui ? String(req.body.ma_gui).slice(0, 80) : null);
const timMaGui = async (req) => (maGuiCua(req) ? Number((await csdl.queryOne('SELECT id FROM kho_phieu WHERE ma_gui = ?', [maGuiCua(req)]))?.id) || null : null);
/** KHO-GON-1: tạo phiếu xong (không lỗi) → diễn biến + tự xong việc, cùng giao dịch (bấm hai lần: lần sau rollback, không ghi đôi). */
const kemDienBien = async (req, tx, luc, r) => { if (!r.loi) await viec.sauTaoPhieu(tx, r.id, req.user.username, luc); return r; };
router.post('/phieu-xuat', NHAN_VIEN, (req, res, next) => (monHopLe(req.body?.mon) ? next() : soPhanSai(res)), ghiPhieu(async (req, tx, luc) => kemDienBien(req, tx, luc,
  await duLieu.taoPhieuXuat(tx, { mon: monHopLe(req.body.mon), nguoi: req.user.username, maGui: maGuiCua(req), luc, lucLam: luc,
    tuDuyet: VAI_QUAN_LY.includes(req.user.role) || !(await duLieu.nvCanDuyet(tx)) })), timMaGui));

// ── KHO-2b: đặt hàng · nhận hàng · phát sinh. THAN: thân yêu cầu → đối số hàm tạo — MỘT chỗ cho tạo và sửa. ──
const soId = (x) => (Number(x) > 0 ? Number(x) : null);
const chuHoacNull = (x) => String(x ?? '').trim() || null;
const THAN = {
  DH: (b) => ({ mon: b.mon ?? [], nguyenLieu: b.nguyen_lieu ?? [], nccId: soId(b.nha_cung_cap_id), ghiChu: chuHoacNull(b.ghi_chu) }),
  PN: (b) => ({ donId: soId(b.don_id), dong: b.dong, nccId: soId(b.nha_cung_cap_id), ghiChu: chuHoacNull(b.ghi_chu) }),
  PS: (b) => ({ suCo: b.su_co, muc: b.muc, ghiChu: chuHoacNull(b.ghi_chu) }),
};
const TAO = { DH: nhapHang.taoDatHang, PN: nhapHang.taoPhieuNhan, PS: phatSinh.taoPhatSinh };
const nguoiCua = (req, luc) => ({ nguoi: req.user.username, vaiTro: req.user.role, quanLy: VAI_QUAN_LY.includes(req.user.role), maGui: maGuiCua(req), luc });
for (const [duong, loai] of [['phieu-dat', 'DH'], ['phieu-nhan', 'PN'], ['phieu-phat-sinh', 'PS']]) {
  router.post(`/${duong}`, NHAN_VIEN, ghiPhieu(async (req, tx, luc) => kemDienBien(req, tx, luc,
    await TAO[loai](tx, { ...THAN[loai](req.body || {}), ...nguoiCua(req, luc) })), timMaGui));
}
router.get('/goi-y-nhap', NHAN_VIEN, doc((req) => nhapHang.goiYNhap(csdl, getNow()).then((r) => (anGia(req) ? tinh.boGia(r) : r))));
router.get('/phat-sinh/goi-y', NHAN_VIEN, doc((req) => phatSinh.goiY(csdl, String(req.query.su_co || ''), getNow()).then((r) => (anGia(req) ? tinh.boGia(r) : r))));

router.get('/phieu', NHAN_VIEN, doc((req) => duLieu.dsPhieu(csdl, req.query, getNow().slice(0, 10)).then((r) => (anGia(req) ? tinh.boGia(r) : r))));

router.get('/phieu/:id', NHAN_VIEN, async (req, res) => {
  try { await traPhieu(req, res, Number(req.params.id)); } catch (e) { console.error('Lỗi đọc phiếu:', e); res.status(500).json({ error: 'Lỗi máy chủ', code: 'LOI_MAY_CHU' }); }
});

// In: chỉ đếm lần in (lần ≥ 2 in "IN LẠI · LẦN n"). Máy in lỗi không đụng sổ — giấy in ở máy khách.
router.post('/phieu/:id/in', NHAN_VIEN, ghiPhieu(async (req, tx) => {
  const id = Number(req.params.id);
  const kq = await tx.run("UPDATE kho_phieu SET so_lan_in = so_lan_in + 1 WHERE id = ? AND trang_thai = 'da_duyet'", [id]);
  return kq.changes ? { id } : { loi: [404, { error: 'Không thấy phiếu đã duyệt', code: 'KHONG_THAY' }] };
}));

router.post('/phieu/:id/duyet', QUAN_LY, ghiPhieu(async (req, tx, luc) => {
  const r = await duLieu.duyetPhieu(tx, Number(req.params.id), req.user.username, luc, req.user.role);
  return r.loi ? r : { id: Number(req.params.id) };
}));

router.post('/phieu/:id/tu-choi', QUAN_LY, (req, res, next) => (lyDoCua(req) ? next() : thieuLyDo(res)), ghiPhieu(async (req, tx, luc) => {
  const r = await duLieu.tuChoiPhieu(tx, Number(req.params.id), req.user.username, lyDoCua(req), luc);
  if (!r.loi) await viec.canhBaoSauChot(tx, Number(req.params.id), req.user.username, luc);   // KHO-GON-1 Q4
  return r.loi ? r : { id: Number(req.params.id) };
}));

router.post('/phieu/:id/ket-qua', NHAN_VIEN, (req, res, next) => {
  const soThuc = req.body?.so_thuc;
  if (!(Number(req.body?.san_pham_id) > 0) || (soThuc != null && soThuc !== '' && !(Number(soThuc) >= 0))) {
    return res.status(400).json({ error: 'Số thực ra phải ≥ 0', code: 'SO_PHAN_SAI' });
  }
  next();
}, ghiPhieu(async (req, tx, luc) => {
  const id = Number(req.params.id);
  const soThuc = req.body.so_thuc == null || req.body.so_thuc === '' ? null : Number(req.body.so_thuc);
  const r = await duLieu.ghiKetQua(tx, { phieuId: id, spId: Number(req.body.san_pham_id), soThuc, ghiChu: String(req.body.ghi_chu ?? '').trim() || null,
    nguoi: req.user.username, luc });
  return r.loi ? r : { id, lech: r.lech };
}));

router.post('/phieu/:id/huy', CHU_QUAN, (req, res, next) => (lyDoCua(req) ? next() : thieuLyDo(res)), ghiPhieu(async (req, tx, luc) => {
  const r = await duLieu.huyPhieu(tx, Number(req.params.id), lyDoCua(req), req.user.username, luc);
  if (!r.loi) await viec.canhBaoSauChot(tx, Number(req.params.id), req.user.username, luc);   // KHO-GON-1 Q4: huỷ phiếu còn chờ = từ chối
  return r.loi ? r : { id: Number(req.params.id) };
}));

// Sửa = huỷ phiếu cũ + phiếu MỚI thay_cho_id tự duyệt. Rẽ theo loại TRƯỚC khi kiểm thân — thân sai loại → 400, rollback (phiếu cũ còn nguyên).
// DH / PN / PS: chỉ sửa phiếu ĐÃ duyệt (chủ quán chốt 31.10 cho phiếu nhận; DH / PS cùng luật — vòng sửa 1: sửa phiếu chờ duyệt sẽ tự duyệt,
// vòng qua luật người KHÁC duyệt / hạn mức). Huỷ / sửa bị chặn khi lô thành phẩm đã bị phiếu khác trừ (duLieu.huyPhieu). Trường không gửi
// (ghi chú = số hoá đơn, nhà cung cấp, loại chuyện) lấy của phiếu cũ.
router.post('/phieu/:id/sua', CHU_QUAN, (req, res, next) => (lyDoCua(req) ? next() : thieuLyDo(res)), ghiPhieu(async (req, tx, luc) => {
  const id = Number(req.params.id);
  const cu = await tx.queryOne('SELECT loai, trang_thai, don_id, nha_cung_cap_id, ghi_chu, su_co FROM kho_phieu WHERE id = ?', [id]);
  if (!cu || cu.loai === 'PX') {
    if (!monHopLe(req.body.mon)) return { loi: [400, LOI_SO_PHAN] };
    const sua = await duLieu.suaPhieu(tx, id, monHopLe(req.body.mon), req.user.username, lyDoCua(req), luc);
    if (!sua.loi) await viec.canhBaoSauChot(tx, id, req.user.username, luc);   // KHO-GON-1 Q4: sửa phiếu xuất CHỜ duyệt sau chốt
    return sua;
  }
  if (!TAO[cu.loai]) return { loi: [400, { error: 'Loại phiếu này không sửa được', code: 'KHONG_SUA_DUOC' }] };
  if (cu.trang_thai === 'cho_duyet') return { loi: [409, { error: 'Chỉ sửa phiếu đã duyệt — phiếu chờ duyệt thì từ chối / huỷ rồi tạo lại', code: 'PHIEU_CHUA_DUYET' }] };
  // phiếu đã huỷ: huyPhieu trả 409 PHIEU_DA_XU_LY — cùng mã với phiếu xuất (LUAT §2)
  const huy = await duLieu.huyPhieu(tx, id, lyDoCua(req), req.user.username, luc);
  if (huy.loi) return huy;
  await viec.canhBaoSauChot(tx, id, req.user.username, luc);   // KHO-GON-1 Q4: sửa = huỷ phiếu cũ
  return TAO[cu.loai](tx, { ...THAN[cu.loai]({ nha_cung_cap_id: cu.nha_cung_cap_id, ghi_chu: cu.ghi_chu, su_co: cu.su_co, ...req.body }), donId: cu.don_id == null ? null : Number(cu.don_id), ...nguoiCua(req, luc), maGui: null,
    thayCho: id, lyDo: lyDoCua(req), ep: true });
}));

router.get('/mon-chua-san', QUAN_LY, doc(() => banHang.monChuaSan(csdl, getNow())));   // KHO-3a A7

// KHO-GON-1: kèm quyền chỉnh tay (nút ở chi tiết một thứ) + mốc lúc đọc (C5 — kiemKe.js).
router.get('/ton', NHAN_VIEN, doc(async (req) => {
  const luc = getNow();
  const r = await duLieu.docTon(csdl, luc);
  return { ...(anGia(req) ? tinh.boGia(r) : r), duoc_chinh_tay: await duocChinhTay(csdl, req), moc: await kiemKe.docMoc(csdl), moc_luc: luc };
}));

// ═════════════════════════════ KHO-GON-1 — việc hôm nay · kiểm kê · bàn giao · chỉnh tay · diễn biến ═════════════════════════════
/** Ghi trong giao dịch: lam(req, tx, luc) trả { loi } (rollback) hoặc dữ liệu trả về. */
const ghiVaTra = (lam) => async (req, res) => {
  try {
    const kq = await trongGiaoDich(async (tx) => { const r = await lam(req, tx, getNow()); return r.loi ? { ...r, huy: true } : r; });
    if (kq.loi) return res.status(kq.loi[0]).json(kq.loi[1]);
    res.json({ success: true, ...kq });
  } catch (e) { loiGhi(res, e); }
};
/** Chỉnh tồn tay: chủ quán luôn; quản lý chỉ khi chủ quán bật công tắc; còn lại không. */
const duocChinhTay = async (csdl2, req) => req.user.role === 'owner' || (req.user.role === 'manager' && (await viec.docCaiDat(csdl2)).ql_chinh_tay);
const caCua = (req) => (tinh.CA.includes(req.body?.ca) ? req.body.ca : null);
const idCua = (req) => Number(req.params.id);
const CHE_DO = ['kiemke', 'bangiao'];

router.post('/viec/hom-nay', NHAN_VIEN, ghiVaTra((req, tx, luc) => viec.homNay(tx, { vaiTro: req.user.role, ca: caCua(req), luc })));
router.post('/viec', NHAN_VIEN, ghiVaTra((req, tx, luc) => viec.themViec(tx, { ten: req.body?.ten, giao: req.body?.giao || undefined,
  nguyenLieuId: soId(req.body?.nguyen_lieu_id), nguoi: req.user.username, luc })));
router.post('/viec/:id/xong', NHAN_VIEN, ghiVaTra((req, tx, luc) => viec.xongViec(tx, { id: idCua(req), vaiTro: req.user.role, ca: caCua(req), nguoi: req.user.username, luc })));
router.post('/viec/:id/mo-lai', CHU_QUAN, ghiVaTra((req, tx, luc) => viec.moLai(tx, { id: idCua(req), nguoi: req.user.username, luc })));

router.get('/viec-mau', QUAN_LY, doc(async () => ({ mau: await viec.dsMau(csdl) })));
router.post('/viec-mau', QUAN_LY, ghiVaTra((req, tx, luc) => viec.themMau(tx, req.body || {}, luc)));
router.put('/viec-mau/:id', QUAN_LY, ghiVaTra((req, tx, luc) => viec.suaMau(tx, idCua(req), req.body || {}, luc)));
router.post('/viec-mau/:id/len', QUAN_LY, ghiVaTra((req, tx) => viec.doiThuTu(tx, idCua(req), -1)));
router.post('/viec-mau/:id/xuong', QUAN_LY, ghiVaTra((req, tx) => viec.doiThuTu(tx, idCua(req), 1)));
router.delete('/viec-mau/:id', QUAN_LY, ghiVaTra((req, tx) => viec.xoaMau(tx, idCua(req))));

router.get('/cai-dat-viec', QUAN_LY, doc(() => viec.docCaiDat(csdl)));
// Số ca · cho quản lý chỉnh tay: chỉ chủ quán (Q2 — cùng luật 29.10 "cài đặt kho chỉ chủ quán"). Không gửi = giữ.
router.put('/cai-dat-viec', CHU_QUAN, ghiVaTra(async (req, tx, luc) => {
  const b = req.body || {};
  const soCa = 'so_ca' in b ? [1, 2].find((x) => x === Number(b.so_ca)) : undefined;
  const ql = 'ql_chinh_tay' in b ? [0, 1].find((x) => x === Number(b.ql_chinh_tay)) : undefined;
  if (('so_ca' in b && soCa === undefined) || ('ql_chinh_tay' in b && ql === undefined)) {
    return { loi: [400, { error: 'Số ca là 1 hoặc 2; cho quản lý chỉnh tay là 0 hoặc 1', code: 'CAI_DAT_KHONG_HOP_LE' }] };
  }
  await viec.luuCaiDat(tx, { soCa, qlChinhTay: ql }, luc);
  return {};
}));
// Ngưỡng cảnh báo + "Kiểm hằng ngày": CHỈ hai cột này (PUT /nguyen-lieu ghi đè cả dòng — không thêm cột mới vào đó).
router.put('/nguong', QUAN_LY, ghiVaTra(async (req, tx) => {
  const ds = Array.isArray(req.body?.nguyen_lieu) ? req.body.nguyen_lieu : null;
  const sai = !ds || ds.some((d) => !(Number(d?.id) > 0) || ('ton_toi_thieu' in d && d.ton_toi_thieu !== null && d.ton_toi_thieu !== '' && soKhongAm(d.ton_toi_thieu) === null)
    || ('kiem_hang_ngay' in d && ![0, 1].includes(Number(d.kiem_hang_ngay))));
  if (sai) return { loi: [400, { error: 'Ngưỡng là số ≥ 0 hoặc trống; kiểm hằng ngày là 0 hoặc 1', code: 'NGUONG_SAI' }] };
  for (const d of ds) {
    if ('ton_toi_thieu' in d) await tx.run('UPDATE kho_nguyen_lieu SET ton_toi_thieu = ? WHERE id = ?', [soKhongAm(d.ton_toi_thieu), Number(d.id)]);
    if ('kiem_hang_ngay' in d) await tx.run('UPDATE kho_nguyen_lieu SET kiem_hang_ngay = ? WHERE id = ?', [Number(d.kiem_hang_ngay), Number(d.id)]);
  }
  return {};
}));

router.get('/kiem-ke', NHAN_VIEN, (req, res, next) => (CHE_DO.includes(req.query.che_do) ? next()
  : res.status(400).json({ error: 'Chế độ là kiemke hoặc bangiao', code: 'CHE_DO_SAI' })), doc((req) => kiemKe.docDanhSach(csdl, req.query.che_do, getNow())));
// Kiểm kê tối của NHÂN VIÊN: phản hồi POST chỉ "đã chốt" — không dòng / số lệch, không mã phiếu (Q5: không dò được số máy lúc lưu). Chủ / quản lý
// nhận đủ. Đường ĐỌC khác vẫn cho nhân viên thấy số (chủ quán chốt Q6: giữ): Tồn kho, phiếu KK ở tab Phiếu, bàn giao (`may`).
router.post('/kiem-ke', NHAN_VIEN, ghiVaTra(async (req, tx, luc) => {
  if (!CHE_DO.includes(req.body?.che_do)) return { loi: [400, { error: 'Chế độ là kiemke hoặc bangiao', code: 'CHE_DO_SAI' }] };
  const r = await kiemKe.luuKiem(tx, { cheDo: req.body.che_do, moc: req.body.moc, mocLuc: req.body.moc_luc, dongVao: req.body.dong, ghiChuChung: req.body.ghi_chu_chung,
    nguoi: req.user.username, luc, maGui: maGuiCua(req) });
  return r.loi || req.body.che_do !== 'kiemke' || VAI_QUAN_LY.includes(req.user.role) ? r : { chot_id: r.chot_id, da_chot: true };
}));
router.post('/chinh-tay', QUAN_LY, (req, res, next) => (lyDoCua(req) ? next() : thieuLyDo(res)), ghiVaTra(async (req, tx, luc) => {
  if (!(await duocChinhTay(tx, req))) return { loi: [403, { error: 'Chủ quán chưa cho quản lý chỉnh tồn tay', code: 'CHI_CHU_QUAN' }] };
  return kiemKe.chinhTay(tx, { than: req.body, nguoi: req.user.username, luc, maGui: maGuiCua(req), lyDo: lyDoCua(req) });
}));

router.get('/dien-bien', QUAN_LY, doc(async (req) => {
  const luc = getNow();
  return viec.dienBien(csdl, req.user.username, luc.slice(0, 10), await viec.monCanChuY(csdl, luc));
}));
router.get('/dien-bien/so', QUAN_LY, doc(async (req) => ({ chua_xem: await viec.soChuaXem(csdl, req.user.username, getNow().slice(0, 10)) })));
router.post('/dien-bien/da-xem', QUAN_LY, ghiVaTra((req, tx) => viec.daXem(tx, req.user.username, req.body?.den_id)));

// Đường lạ dưới /api/pos/kho → 403 (không 404 lộ cấu trúc, không rơi sang router khác).
router.use((req, res) => res.status(403).json({ error: 'Không có quyền truy cập đường này', code: 'DUONG_LA' }));

module.exports = router;
