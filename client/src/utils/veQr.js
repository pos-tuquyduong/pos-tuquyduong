/**
 * veQr.js — vẽ QR cho hoá đơn (HD-1). MỘT chỗ dùng thư viện qrcode-generator 1.4.4 (MIT): BH-2 dùng lại cho QR payOS.
 * `veQr(text)` → { n, hang } (hang[r][c] = ô đen); `qrSvg(text)` → chuỗi SVG nhúng thẳng vào hoá đơn / bản in.
 * Văn bản rỗng → không QR (n = 0, svg ''): chỗ gọi quyết "không in QR chết" bằng cách truyền chuỗi rỗng.
 */
import qrcode from 'qrcode-generator';

export function veQr(text) {
  const s = String(text ?? '');
  if (!s) return { n: 0, hang: [] };
  const q = qrcode(0, 'M');   // 0 = tự chọn cỡ nhỏ nhất đủ chứa; M ≈ 15 % sửa lỗi — in nhiệt 58 mm vẫn quét được
  q.addData(s, 'Byte');
  q.make();
  const n = q.getModuleCount();
  const hang = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => q.isDark(r, c)));
  return { n, hang };
}

/** SVG vuông, nền trắng, viền yên tĩnh 2 ô; co theo khung chứa (width/height do chỗ vẽ đặt). */
export function qrSvg(text) {
  const { n, hang } = veQr(text);
  if (!n) return '';
  const le = 2, W = n + 2 * le;
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (hang[r][c]) d += `M${c + le} ${r + le}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" shape-rendering="crispEdges" style="width:100%;height:100%"><rect width="${W}" height="${W}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
