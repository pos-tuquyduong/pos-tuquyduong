// CHỖ DUY NHẤT App KH gọi máy chủ: chỉ /api/kh/*, gắn token khách, bắt { error, code }. Không fetch ở nơi khác.
import { loiTheoCode } from './dinhDang.js';

const KHOA_TOKEN = 'kh_token';
let tokenBoNho = '';
let khiHetPhien = () => {};

// localStorage có thể ném (cửa sổ riêng tư, chặn dữ liệu) → bọc, rơi về bộ nhớ trang.
export function docToken() {
  try { return localStorage.getItem(KHOA_TOKEN) || tokenBoNho; } catch { return tokenBoNho; }
}
export function luuToken(t) {
  tokenBoNho = t;
  try { localStorage.setItem(KHOA_TOKEN, t); } catch { /* chỉ giữ trong bộ nhớ */ }
}
export function xoaToken() {
  tokenBoNho = '';
  try { localStorage.removeItem(KHOA_TOKEN); } catch { /* không có gì để xoá */ }
}
export const datKhiHetPhien = (f) => { khiHetPhien = f; };

function loiApi(status, code, error) {
  const e = new Error(loiTheoCode(code, error));
  e.status = status; e.code = code;
  return e;
}

async function goi(phuongThuc, duong, than) {
  const token = docToken();
  const tieuDe = { 'Content-Type': 'application/json' };
  if (token) tieuDe.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`/api/kh${duong}`, { method: phuongThuc, headers: tieuDe, body: than === undefined ? undefined : JSON.stringify(than) });
  } catch {
    throw loiApi(0, 'MANG_LOI');
  }
  let dl = null;
  try { dl = await res.json(); } catch { /* không phải JSON */ }
  if (!res.ok || !dl) {
    if (res.status === 401 && token) { xoaToken(); khiHetPhien(); }
    throw loiApi(res.status, (dl && dl.code) || 'LOI_MAY_CHU', dl && dl.error);
  }
  return dl;
}

export const xinMa = (sdt) => goi('POST', '/dang-nhap/xin-ma', { sdt });
export const xacMinh = (sdt, ma, ten) => goi('POST', '/dang-nhap/xac-minh', { sdt, ma, ten });
export const layToi = () => goi('GET', '/toi');
export const doiTen = (ten) => goi('PUT', '/toi', { ten });
export const layMenu = () => goi('GET', '/menu');
export const layDiem = () => goi('GET', '/diem');
export const layVoucher = () => goi('GET', '/voucher');
export const layDon = (trang) => goi('GET', `/don?trang=${trang}`);
export const layChiTietDon = (ma) => goi('GET', `/don/${encodeURIComponent(ma)}`);
export const nhanMaBill = (ma) => goi('POST', '/nhan-ma-bill', { ma });
export const nhanDiem = (ma) => goi('POST', '/nhan-diem', { ma });
