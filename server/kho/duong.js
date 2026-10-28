/**
 * KHO-1 — đường /api/pos/kho: nhận yêu cầu, kiểm quyền (ở MÁY CHỦ), gọi hàm của tinh.js / duLieu.js / nhapSx.js.
 * Quyền (phiếu I): chủ quán mọi thứ · quản lý thêm / sửa nguyên liệu, nhóm, nhà cung cấp, xem công thức · nhân viên chỉ xem nguyên liệu.
 * Ghi: trongGiaoDich + loiGhi dùng chung (kho bận → 409 KHO_BAN).
 */
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const csdl = require('../database');
const { authenticate, checkRole } = require('../middleware/auth');
const { loiGhi, trongGiaoDich } = require('../routes/wallets');
const { getNow } = require('../utils/helpers');
const tinh = require('./tinh');
const duLieu = require('./duLieu');
const nhapSx = require('./nhapSx');

const router = express.Router();
const QUAN_LY = checkRole('owner', 'manager');
const CHU_QUAN = checkRole('owner');

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
router.get('/nguyen-lieu', doc(() => duLieu.docNguyenLieu(csdl)));

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

// ── Nhóm nguyên liệu, nhà cung cấp: cùng một khuôn thêm / sửa ──
for (const [duong, bang, cot] of [['nhom', 'kho_nhom_nguyen_lieu', ['ten', 'thu_tu']], ['nha-cung-cap', 'kho_nha_cung_cap', ['ten', 'sdt', 'ghi_chu', 'dang_dung']]]) {
  const giaTri = (b) => cot.map((c) => (c === 'ten' ? String(b.ten ?? '').trim() : b[c] ?? (c === 'dang_dung' ? 1 : c === 'thu_tu' ? 0 : null)));
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
    res.json({ nguyen_lieu: kq.map((d) => ({ ...nl.get(d.nguyen_lieu_id), ...d })) });
  } catch (e) { console.error('Lỗi triển khai công thức:', e); res.status(500).json({ error: 'Lỗi máy chủ', code: 'LOI_MAY_CHU' }); }
});

router.put('/san-pham/:id', CHU_QUAN, async (req, res) => {
  const spId = Number(req.params.id);
  const { kieu, nhom_id: nhomId = null, cong_thuc: dongVao = [] } = req.body || {};
  if (!tinh.KIEU_SAN_PHAM.includes(kieu)) return res.status(400).json({ error: 'Kiểu sản phẩm không hợp lệ', code: 'KIEU_SAI' });
  const dong = Array.isArray(dongVao) ? dongVao.map((d) => ({ nguyen_lieu_id: Number(d.nguyen_lieu_id) || null,
    thanh_phan_id: Number(d.thanh_phan_id) || null, luong: Number(d.luong) })) : null;
  if (!dong || dong.some((d) => !(d.luong > 0) || !Number.isFinite(d.luong) || !d.nguyen_lieu_id === !d.thanh_phan_id)) {
    return res.status(400).json({ error: 'Dòng công thức sai: mỗi dòng một nguyên liệu HOẶC một sản phẩm, lượng > 0', code: 'DONG_CONG_THUC_SAI' });
  }
  try {
    const kq = await trongGiaoDich(async (tx) => {
      if (await duLieu.demThieu(tx, 'pos_products', [spId, ...dong.filter((d) => d.thanh_phan_id).map((d) => d.thanh_phan_id)])
        || await duLieu.demThieu(tx, 'kho_nguyen_lieu', dong.filter((d) => d.nguyen_lieu_id).map((d) => d.nguyen_lieu_id))) {
        return { huy: true, loi: [400, { error: 'Món hoặc nguyên liệu không có', code: 'KHONG_THAY' }] };
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
      await duLieu.luuSanPham(tx, spId, kieu, nhomId, dong, getNow());
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
    if (req.file) fs.rmSync(req.file.path, { force: true });
  }
}));

module.exports = router;
