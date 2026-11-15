/**
 * DANG-NHAP-2 — giới hạn số lần gõ SAI mật khẩu ở đăng nhập POS. Đếm TRONG BỘ NHỚ máy chủ (không bảng): khởi động lại thì đếm về 0.
 * Hai bộ đếm, cùng cửa sổ 15 phút tính từ lần thử đầu (khuôn PIN chủ quán 5 lần / 15 phút — utils/pinChuQuan.js):
 *   · theo CẶP (tên đăng nhập đã trim + chữ thường, IP): tối đa SAI_TOI_DA_CAP lần — KHÔNG khoá theo tên trên mọi máy;
 *   · theo IP (mọi tên cộng lại): tối đa SAI_TOI_DA_IP lần — chặn rải nhiều tên.
 * `giuLuot` chạy ĐỒNG BỘ và ghi lượt TRƯỚC khi so mật khẩu (bcrypt chậm): gửi nhiều yêu cầu cùng lúc cũng chỉ được so tối đa SAI_TOI_DA_CAP lần.
 * Đăng nhập đúng gọi `dangNhapDung`: xoá đếm của cặp và trả lại lượt IP vừa giữ (lần đúng không phải lần sai).
 * Bộ nhớ: mục quá hạn bị dọn mỗi lần gọi; mỗi Map có trần TRAN_MUC (đầy thì bỏ mục cũ nhất).
 */
const SAI_TOI_DA_CAP = 5;
const SAI_TOI_DA_IP = 20;
const KHOA_PHUT = 15;
const TRAN_MUC = 5000;

const cap = new Map();   // `${ip}|${tên}` → { dem, hetHan }
const theoIp = new Map();   // ip → { dem, hetHan }

const khoaCap = (ip, ten) => `${ip}|${ten}`;
const chuanTen = (ten) => String(ten ?? '').trim().toLowerCase().slice(0, 100);

function don(map, now) {
  for (const [k, m] of map) if (m.hetHan <= now) map.delete(k);
}

function tang(map, khoa, now) {
  const m = map.get(khoa);
  if (m) { m.dem += 1; return; }
  if (map.size >= TRAN_MUC) map.delete(map.keys().next().value);
  map.set(khoa, { dem: 1, hetHan: now + KHOA_PHUT * 60 * 1000 });
}

/** Giữ một lượt thử. Trả { chan: false } (đã ghi lượt) hoặc { chan: true, phut } (số phút còn lại, làm tròn lên). */
function giuLuot(ip, tenDangNhap, now = Date.now()) {
  don(cap, now);
  don(theoIp, now);
  const k = khoaCap(ip, chuanTen(tenDangNhap));
  const c = cap.get(k);
  const i = theoIp.get(ip);
  const bi = [c && c.dem >= SAI_TOI_DA_CAP ? c : null, i && i.dem >= SAI_TOI_DA_IP ? i : null].filter(Boolean);
  if (bi.length) return { chan: true, phut: Math.ceil(Math.max(...bi.map((m) => m.hetHan - now)) / 60000) };
  tang(cap, k, now);
  tang(theoIp, ip, now);
  return { chan: false };
}

/** Đăng nhập đúng: xoá đếm của cặp, trả lại lượt IP đã giữ. */
function dangNhapDung(ip, tenDangNhap) {
  cap.delete(khoaCap(ip, chuanTen(tenDangNhap)));
  const i = theoIp.get(ip);
  if (i && --i.dem <= 0) theoIp.delete(ip);
}

const soMuc = () => cap.size + theoIp.size;

module.exports = { giuLuot, dangNhapDung, soMuc, SAI_TOI_DA_CAP, SAI_TOI_DA_IP, KHOA_PHUT, TRAN_MUC };
