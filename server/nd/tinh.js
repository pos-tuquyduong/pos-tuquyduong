/**
 * ND-API-1 — phép tính THUẦN của kho nội dung App KH (không đọc CSDL, không đọc biến môi trường). Kho là "hộp chứa" khoá → giá trị:
 * POS không hiểu nghĩa từng chữ, App giữ danh mục. Mọi giới hạn ở GIOI_HAN (hợp đồng HOP_DONG_API_ND.md chép đúng các số này — bài thử canh).
 */
const crypto = require('crypto');

const GIOI_HAN = {
  khoa_toi_da: 80,                        // ký tự của một khoá [a-zA-Z0-9._-]
  ban_toi_da_byte: 1048576,               // một bản (JSON đầy đủ) — đo byte UTF-8, không đếm ký tự
  anh_toi_da_byte: 512000,                // "500 KB" = 512.000 byte (Q-G)
  nhap_toan_bo_toi_da_byte: 52428800,     // tệp Nhập toàn bộ 50 MB (Q-G)
  sai_toi_da: 5,                          // đăng nhập sai liền → khoá (Q-A: theo cặp tên + IP và theo IP)
  khoa_phut: 15,
  ve_gio: 12,                             // hạn vé /api/nd
  ghi_chu_toi_da: 500,                    // ký tự ghi chú của cap-nhat / quay-lai
};
const QUYEN = ['nd_xem', 'nd_sua', 'nd_cap_nhat', 'nd_xuat_nhap'];
const VIEC = ['luu', 'bo_nhap', 'cap_nhat', 'quay_lai', 'xuat', 'nhap'];
// Mã lỗi /api/nd → [status, lời cho người dùng]. Cùng tình huống → cùng mã ở mọi cửa (LUAT §2).
const LOI = {
  CHUA_DANG_NHAP: [401, 'Chưa đăng nhập hoặc phiên đã hết — đăng nhập lại'],
  SAI_DANG_NHAP: [401, 'Tên đăng nhập hoặc mật khẩu không đúng'],
  KHONG_DU_QUYEN: [403, 'Tài khoản này không có quyền làm việc này'],
  KHONG_TIM_THAY: [404, 'Không tìm thấy'],
  CO_BAN_MOI_HON: [409, 'Đã có bản mới hơn (người khác vừa cập nhật) — tải lại rồi làm tiếp'],
  KHO_DA_CO_DU_LIEU: [409, 'Kho nội dung đã có dữ liệu — Nhập toàn bộ chỉ dùng cho kho trống (chuyển máy chủ)'],
  KHO_BAN: [409, 'Máy chủ đang bận — bấm lại sau giây lát'],
  KHOA_KHONG_HOP_LE: [400, 'Khoá chỉ gồm chữ không dấu, số và dấu . _ - (1–80 ký tự)'],
  GIA_TRI_KHONG_HOP_LE: [400, 'Giá trị phải là chữ, số, đúng / sai, danh sách hoặc nhóm (không để trống)'],
  DU_LIEU_KHONG_HOP_LE: [400, 'Dữ liệu gửi lên không hợp lệ'],
  KHONG_CO_NHAP: [400, 'Chưa có thay đổi nào đã lưu để cập nhật'],
  ANH_KHONG_HOP_LE: [400, 'Ảnh phải là WebP, JPEG hoặc PNG thật'],
  QUA_LON: [413, 'Quá lớn: một bản tối đa 1 MB, một ảnh tối đa 500 KB, tệp nhập tối đa 50 MB'],
  QUA_NHIEU_LAN: [429, `Sai quá nhiều lần — thử lại sau ${GIOI_HAN.khoa_phut} phút`],
  LOI_MAY_CHU: [500, 'Lỗi máy chủ — thử lại sau'],
};

const MAU_KHOA = new RegExp(`^[a-zA-Z0-9._-]{1,${GIOI_HAN.khoa_toi_da}}$`);
const MAU_MA_ANH = /^[0-9a-f]{64}$/;
const khoaHopLe = (k) => typeof k === 'string' && MAU_KHOA.test(k);
const giaTriHopLe = (v) => typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v)) || (typeof v === 'object' && v !== null);
const laObject = (o) => typeof o === 'object' && o !== null && !Array.isArray(o);
const laSoKhongAm = (n) => Number.isInteger(n) && n >= 0;
const chuHoacTrong = (x) => x == null || typeof x === 'string';
const soByte = (obj) => Buffer.byteLength(JSON.stringify(obj), 'utf8');
const bam = (x) => crypto.createHash('sha256').update(x).digest('hex');
/** Q-E: khoá ký vé nd DẪN từ khoá vé POS (không thêm biến trên Render) — chữ ký vé hai bên khác nhau, không dùng lẫn được. */
function khoaVe(khoaPos) {
  if (!khoaPos) throw new Error('thiếu khoá ký vé POS');
  return crypto.createHmac('sha256', String(khoaPos)).update('nd-v1').digest('hex');
}

/** Loại ảnh theo BYTE ĐẦU tệp (không tin tên / loại khai báo). Không phải PNG / JPEG / WebP → null. */
function loaiAnh(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) return 'image/png';
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg';
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

/** Tóm tắt một bản cho danh sách phiên bản: "3 chỗ: a, b, c" (≤ 200 ký tự). */
function tomTat(cacKhoa) {
  const s = `${cacKhoa.length} chỗ: ${cacKhoa.join(', ')}`;
  return s.length > 200 ? s.slice(0, 199) + '…' : s;
}

/** Bất biến của danh sách bản (cùng đường ghi thường duLieu.doiBan: bản mới = bản đang chạy + 1): không bản nào, hoặc đúng MỘT bản đang chạy
 *  và đó là bản số LỚN NHẤT — không thì lần cập nhật sau đụng khoá chính, kho kẹt vĩnh viễn (soát vòng 1). Dùng cho nhập và xuất. */
function banChayDung(ban) {
  if (!ban.length) return true;
  const chay = ban.filter((b) => b.dang_chay === 1);
  return chay.length === 1 && chay[0].so_ban === Math.max(...ban.map((b) => b.so_ban));
}

/** Kiểm TRỌN tệp Nhập toàn bộ TRƯỚC khi ghi (tất cả hoặc không). Trả { loi: [code, lời] } hoặc { du_lieu } (ảnh kèm buf, loai theo byte). */
function kiemTepNhap(t) {
  const sai = (code, chu) => ({ loi: [code, chu] });
  if (!laObject(t) || t.dinh_dang !== 1) return sai('DU_LIEU_KHONG_HOP_LE', 'Tệp không phải tệp Xuất nội dung App (dinh_dang 1)');
  const { ban = [], nhap = [], anh = [], nhat_ky = [] } = t;
  if (![ban, nhap, anh, nhat_ky].every(Array.isArray)) return sai('DU_LIEU_KHONG_HOP_LE', 'Tệp thiếu danh sách ban / nhap / anh / nhat_ky');
  const soBan = new Set();
  for (const b of ban) {
    if (!laObject(b) || !Number.isInteger(b.so_ban) || b.so_ban < 1 || soBan.has(b.so_ban) || !laObject(b.gia_tri) || typeof b.luc !== 'string'
      || ![0, 1].includes(b.dang_chay) || !(b.tu_ban == null || Number.isInteger(b.tu_ban)) || ![b.ghi_chu, b.tom_tat, b.nguoi].every(chuHoacTrong)) {
      return sai('DU_LIEU_KHONG_HOP_LE', `Bản ${laObject(b) ? b.so_ban : '?'} trong tệp không hợp lệ`);
    }
    if (soByte(b.gia_tri) > GIOI_HAN.ban_toi_da_byte) return sai('QUA_LON', `Bản ${b.so_ban} quá 1 MB`);
    soBan.add(b.so_ban);
  }
  if (!banChayDung(ban)) return sai('DU_LIEU_KHONG_HOP_LE', 'Tệp phải có đúng một bản đang chạy, và đó là bản số lớn nhất');
  const khoa = new Set();
  for (const n of nhap) {
    if (!laObject(n) || !khoaHopLe(n.khoa) || khoa.has(n.khoa) || !giaTriHopLe(n.gia_tri) || !laSoKhongAm(n.ban_goc) || typeof n.luc !== 'string' || !chuHoacTrong(n.nguoi)) {
      return sai('DU_LIEU_KHONG_HOP_LE', 'Nháp trong tệp không hợp lệ');
    }
    khoa.add(n.khoa);
  }
  // cùng giới hạn với luuNhap (PUT /nhap): bản đang chạy + mọi nháp ≤ 1 MB — không thì sau khi nhập mọi lần Lưu / Cập nhật đều 413 (soát vòng 3)
  const dang = ban.find((b) => b.dang_chay === 1);
  if (soByte({ ...(dang ? dang.gia_tri : {}), ...Object.fromEntries(nhap.map((n) => [n.khoa, n.gia_tri])) }) > GIOI_HAN.ban_toi_da_byte) {
    return sai('QUA_LON', 'Bản đang chạy cộng các nháp trong tệp quá 1 MB');
  }
  const ma = new Set();
  const anhRa = [];
  for (const a of anh) {
    if (!laObject(a) || !MAU_MA_ANH.test(a.ma) || ma.has(a.ma) || typeof a.du_lieu_base64 !== 'string' || typeof a.luc !== 'string') {
      return sai('DU_LIEU_KHONG_HOP_LE', 'Ảnh trong tệp không hợp lệ');
    }
    const buf = Buffer.from(a.du_lieu_base64, 'base64');
    const loai = loaiAnh(buf);
    if (!loai || bam(buf) !== a.ma) return sai('ANH_KHONG_HOP_LE', `Ảnh ${a.ma.slice(0, 12)}… không phải WebP / JPEG / PNG thật hoặc lệch mã`);
    if (buf.length > GIOI_HAN.anh_toi_da_byte) return sai('QUA_LON', `Ảnh ${a.ma.slice(0, 12)}… quá 500 KB`);
    ma.add(a.ma);
    anhRa.push({ ma: a.ma, loai, buf, luc: a.luc });
  }
  for (const n of nhat_ky) {
    if (!laObject(n) || !VIEC.includes(n.viec) || typeof n.luc !== 'string' || !chuHoacTrong(n.nguoi)
      || ![n.so_ban, n.so_khoa].every((x) => x == null || Number.isInteger(x))) return sai('DU_LIEU_KHONG_HOP_LE', 'Nhật ký trong tệp không hợp lệ');
  }
  return { du_lieu: { ban, nhap, anh: anhRa, nhat_ky } };
}

module.exports = { GIOI_HAN, QUYEN, VIEC, LOI, khoaHopLe, giaTriHopLe, laSoKhongAm, soByte, bam, khoaVe, loaiAnh, tomTat, banChayDung, kiemTepNhap };
