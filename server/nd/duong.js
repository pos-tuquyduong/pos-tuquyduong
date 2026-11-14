/**
 * ND-API-1 — đường nối /api/nd (hợp đồng HOP_DONG_API_ND.md). Gắn ở server/index.js TRƯỚC cors chung của POS (origin '*'):
 * router tự làm CORS (chỉ hai tên miền App), đọc thân, 404, lỗi và ghi log của riêng nó — không bao giờ next() ra ngoài.
 * Mỗi cửa: kiểm quyền TRƯỚC (xacThuc.canQuyen) rồi mới đọc thân; quy tắc ở tinh.js, đọc / ghi ở duLieu.js.
 */
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { getNow } = require('../utils/helpers');
const { laLoiBan } = require('../database');
const T = require('./tinh');
const D = require('./duLieu');
const { dangNhap, canQuyen, guiLoi } = require('./xacThuc');

const TEN_MIEN_APP = ['https://tuquyduong.com', 'https://app-kh.pages.dev'];
const router = express.Router();
router.use(cors({ origin: TEN_MIEN_APP, methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'], maxAge: 7200 }));
router.use((req, res, next) => { console.log(`${getNow()} | ${req.method} /api/nd${req.path}`); next(); });   // không ghi thân, không vé

const thanThuong = express.json({ limit: T.GIOI_HAN.ban_toi_da_byte + 512 * 1024 });   // một bản 1 MB + vỏ
const thanLon = express.json({ limit: T.GIOI_HAN.nhap_toan_bo_toi_da_byte });
// multer coi tệp ĐÚNG bằng fileSize là vượt → nhận tới giới hạn + 1 rồi tự so (ảnh đúng 512.000 byte phải qua)
const nhanAnh = multer({ storage: multer.memoryStorage(), limits: { fileSize: T.GIOI_HAN.anh_toi_da_byte + 1, files: 1, fields: 5 } }).single('anh');
const lam = (fn) => (req, res, next) => fn(req, res).catch(next);
const tra = (res, kq) => (kq.loi ? guiLoi(res, kq.loi) : res.json({ success: true, ...kq }));
const soDuong = (x) => (/^\d{1,9}$/.test(String(x)) ? Number(x) : NaN);
const ghiChuHopLe = (g) => g == null || (typeof g === 'string' && g.length <= 500);

// ── công khai: App đọc mỗi lần mở ──
router.get('/ban-dang-chay', lam(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const soNay = await D.soBanDangChay();
  if (req.query.co !== undefined && soDuong(req.query.co) === soNay) return res.json({ success: true, khong_doi: true, so_ban: soNay });
  const b = await D.banDangChay();
  return res.json({ success: true, so_ban: b.so_ban, gia_tri: b.gia_tri });
}));

router.get('/anh/:ma', lam(async (req, res) => {
  const a = /^[0-9a-f]{64}$/.test(req.params.ma) ? await D.docAnh(req.params.ma) : null;
  if (!a) return guiLoi(res, 'KHONG_TIM_THAY');
  res.set({ 'Content-Type': a.loai, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' });
  return res.send(a.buf);
}));

router.post('/dang-nhap', thanThuong, lam(async (req, res) => {
  const { ten_dang_nhap: ten, mat_khau: mk } = req.body || {};
  if (typeof ten !== 'string' || typeof mk !== 'string' || !ten || ten.length > 100 || mk.length > 200) return guiLoi(res, 'DU_LIEU_KHONG_HOP_LE');
  return tra(res, await dangNhap(ten, mk, req.ip));
}));

// ── nháp ──
router.get('/nhap', canQuyen('nd_xem'), lam(async (req, res) => res.json({ success: true, so_ban: await D.soBanDangChay(), nhap: await D.dsNhap() })));

router.put('/nhap', canQuyen('nd_sua'), thanThuong, lam(async (req, res) => {
  const { khoa, gia_tri: giaTri, ban_goc: banGoc } = req.body || {};
  if (!T.khoaHopLe(khoa)) return guiLoi(res, 'KHOA_KHONG_HOP_LE');
  if (!T.giaTriHopLe(giaTri)) return guiLoi(res, 'GIA_TRI_KHONG_HOP_LE');
  if (!T.laSoKhongAm(banGoc)) return guiLoi(res, 'DU_LIEU_KHONG_HOP_LE', 'ban_goc phải là số bản (số nguyên ≥ 0)');
  return tra(res, await D.luuNhap(req.ndNguoi, khoa, giaTri, banGoc));
}));

router.delete('/nhap/:khoa', canQuyen('nd_sua'), lam(async (req, res) => {
  if (!T.khoaHopLe(req.params.khoa)) return guiLoi(res, 'KHOA_KHONG_HOP_LE');
  return tra(res, await D.xoaNhap(req.ndNguoi, req.params.khoa));
}));

// ── phiên bản ──
router.post('/cap-nhat', canQuyen('nd_cap_nhat'), thanThuong, lam(async (req, res) => {
  const { ban_goc: banGoc, ghi_chu: ghiChu } = req.body || {};
  if (!T.laSoKhongAm(banGoc) || !ghiChuHopLe(ghiChu)) return guiLoi(res, 'DU_LIEU_KHONG_HOP_LE', 'Cần ban_goc (số nguyên ≥ 0); ghi_chu tối đa 500 ký tự');
  return tra(res, await D.capNhat(req.ndNguoi, banGoc, ghiChu));
}));

router.get('/phien-ban', canQuyen('nd_xem'), lam(async (req, res) => res.json({ success: true, data: await D.dsBan() })));

router.get('/phien-ban/:so', canQuyen('nd_xem'), lam(async (req, res) => {
  const b = soDuong(req.params.so) >= 1 ? await D.motBan(soDuong(req.params.so)) : null;
  return b ? res.json({ success: true, ban: b }) : guiLoi(res, 'KHONG_TIM_THAY');
}));

router.post('/quay-lai', canQuyen('nd_cap_nhat'), thanThuong, lam(async (req, res) => {
  const { so, ban_goc: banGoc, ghi_chu: ghiChu } = req.body || {};
  if (!Number.isInteger(so) || so < 1 || !T.laSoKhongAm(banGoc) || !ghiChuHopLe(ghiChu)) {
    return guiLoi(res, 'DU_LIEU_KHONG_HOP_LE', 'Cần so (số bản ≥ 1) và ban_goc (số nguyên ≥ 0)');
  }
  return tra(res, await D.quayLai(req.ndNguoi, so, banGoc, ghiChu));
}));

// ── ảnh: multipart, trường `anh`; loại theo byte đầu tệp ──
router.post('/anh', canQuyen('nd_sua'), nhanAnh, lam(async (req, res) => {
  if (req.file && req.file.size > T.GIOI_HAN.anh_toi_da_byte) return guiLoi(res, 'QUA_LON');
  const loai = req.file ? T.loaiAnh(req.file.buffer) : null;
  if (!loai) return guiLoi(res, 'ANH_KHONG_HOP_LE');
  return tra(res, await D.luuAnh(req.file.buffer, loai));
}));

// ── xuất / nhập toàn bộ ──
router.get('/xuat', canQuyen('nd_xuat_nhap', true), lam(async (req, res) => {
  const tep = await D.xuat();
  await D.ghiXuat(req.ndNguoi);
  res.set('Content-Disposition', `attachment; filename="noi-dung-app-${tep.xuat_luc.slice(0, 10)}.json"`);
  return res.json(tep);
}));

router.post('/nhap-toan-bo', canQuyen('nd_xuat_nhap'), thanLon, lam(async (req, res) => {
  const kq = T.kiemTepNhap(req.body);
  if (kq.loi) return guiLoi(res, kq.loi[0], kq.loi[1]);
  return tra(res, await D.nhapToanBo(req.ndNguoi, kq.du_lieu));
}));

// ── đường lạ + lỗi: trả trong router (không rơi xuống trang quầy, giữ CORS của nd) ──
router.use((req, res) => guiLoi(res, 'KHONG_TIM_THAY'));
router.use((err, req, res, next) => {   // eslint-disable-line no-unused-vars
  if (err.type === 'entity.parse.failed') return guiLoi(res, 'DU_LIEU_KHONG_HOP_LE', 'Thân yêu cầu không phải JSON hợp lệ');
  if (err.type === 'entity.too.large' || err.code === 'LIMIT_FILE_SIZE') return guiLoi(res, 'QUA_LON');
  if (err instanceof multer.MulterError) return guiLoi(res, 'ANH_KHONG_HOP_LE', 'Gửi đúng một tệp ảnh ở trường "anh"');
  if (laLoiBan(err)) return guiLoi(res, 'KHO_BAN');
  console.error('Lỗi /api/nd:', err.message);
  return guiLoi(res, 'LOI_MAY_CHU');
});

module.exports = router;
