/**
 * veQrThuongHieu.js — mã QR THANH TOÁN trên MÀN HÌNH, dạng thẻ thương hiệu (GIAO-DIEN-1 F; mẫu chủ quán duyệt 06.11). Bill / phiếu IN nhiệt
 * KHÔNG dùng file này — vẫn mã vuông đen `veQr.js` (qrSvg). Dùng lại thư viện qrcode-generator 1.4.4 sẵn có (cùng veQr.js), mức sửa lỗi H (30 %).
 * `veQrThuongHieu(text)` → { n, mucSua, hang, le, W, cham[{r,c,mau}], oGoc[{r,c,mau}], logo{tam,kinhLogo,kinhNen} } (n = 0: không vẽ được).
 * Hàm THUẦN: bài thử cong_cu/thu_GIAODIEN1.js giải mã lại bằng jsqr. Chấm tròn; 3 ô góc (vòng ngoài liền + lõi, tô đặc); màu theo 4 phần tư
 * (theo 4 mảnh logo); logo tròn trên nền tròn trắng ở giữa, đường kính logo ≤ TI_LE_LOGO bề ngang phần mã; nền mã TRẮNG kể cả giao diện tối.
 */
import qrcode from 'qrcode-generator';

export const MAU_GOC = { tt: '#253A6E', tp: '#966923', dt: '#347042', dp: '#B2342C' };   // trên-trái · trên-phải · dưới-trái · dưới-phải
export const TI_LE_LOGO = 0.2;
const TI_LE_NEN = 1.2;          // nền tròn trắng lớn hơn logo
const LE_TRANG = 3;             // viền trắng quanh mã, tính bằng ô (≥ 3)
const CAN_GOC = 7;              // ô góc 7×7

const phanTu = (r, c, n) => `${r + 0.5 < n / 2 ? 't' : 'd'}${c + 0.5 < n / 2 ? 't' : 'p'}`;

export function veQrThuongHieu(text) {
  const s = String(text ?? '');
  if (!s) return { n: 0 };
  const q = qrcode(0, 'H');
  try { q.addData(s, 'Byte'); q.make(); } catch { return { n: 0 }; }   // chuỗi quá dài: không vẽ, màn vẫn dựng được phần còn lại
  const n = q.getModuleCount();
  const hang = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => q.isDark(r, c)));
  const W = n + 2 * LE_TRANG, tam = W / 2;
  const kinhLogo = Math.floor(n * 0.19 * 100) / 100, kinhNen = Math.round(kinhLogo * TI_LE_NEN * 100) / 100;
  const trongGoc = (r, c) => (r < CAN_GOC && c < CAN_GOC) || (r < CAN_GOC && c >= n - CAN_GOC) || (r >= n - CAN_GOC && c < CAN_GOC);
  const cham = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (!hang[r][c] || trongGoc(r, c)) continue;
    if (Math.hypot(c + LE_TRANG + 0.5 - tam, r + LE_TRANG + 0.5 - tam) <= kinhNen / 2) continue;   // dưới nền logo
    cham.push({ r, c, mau: MAU_GOC[phanTu(r, c, n)] });
  }
  const oGoc = [[0, 0], [0, n - CAN_GOC], [n - CAN_GOC, 0]].map(([r, c]) => ({ r, c, mau: MAU_GOC[phanTu(r + 3, c + 3, n)] }));
  return { n, mucSua: 'H', hang, le: LE_TRANG, W, cham, oGoc, logo: { tam, kinhLogo, kinhNen } };
}

const so = (x) => Math.round(x * 1000) / 1000;

/** SVG vuông (viewBox W×W, co theo khung chứa); rỗng / quá dài → ''. `logoHref` = địa chỉ ảnh logo (asset của Vite). */
export function qrThuongHieuSvg(text, logoHref) {
  const v = veQrThuongHieu(text);
  if (!v.n) return '';
  const { W, le, logo } = v;
  const nhom = {};
  for (const x of v.cham) (nhom[x.mau] ||= []).push(`<circle cx="${x.c + le + 0.5}" cy="${x.r + le + 0.5}" r="0.47"/>`);
  const cham = Object.entries(nhom).map(([mau, ds]) => `<g fill="${mau}">${ds.join('')}</g>`).join('');
  const goc = v.oGoc.map((o) => {
    const x = o.c + le, y = o.r + le;
    return `<rect x="${x}" y="${y}" width="7" height="7" rx="2" fill="${o.mau}"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" rx="1.2" fill="#fff"/>` +
      `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="0.9" fill="${o.mau}"/>`;
  }).join('');
  const k = logo.kinhLogo;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" style="width:100%;height:100%;display:block"><rect width="${W}" height="${W}" fill="#fff"/>` +
    `${cham}${goc}<circle cx="${logo.tam}" cy="${logo.tam}" r="${so(logo.kinhNen / 2)}" fill="#fff"/>` +
    `<image href="${String(logoHref || '').replace(/"/g, '')}" x="${so(logo.tam - k / 2)}" y="${so(logo.tam - k / 2)}" width="${k}" height="${k}"/></svg>`;
}

/** Dòng dưới mã: "<số HD> · <nội dung CK>" — số HD là từ cuối của nội dung ("TQDNOV06 HD0016" → "HD0016"). */
export function dongChanThe(noiDung) {
  const s = String(noiDung ?? '').trim();
  return s ? `${s.split(/\s+/).pop()} · ${s}` : '';
}
