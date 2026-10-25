/**
 * P3 — payOS: tạo link / QR thanh toán và kiểm chữ ký webhook. Khoá CHỈ ở biến môi trường (PAYOS_CLIENT_ID, PAYOS_API_KEY,
 * PAYOS_CHECKSUM_KEY), đọc lúc gọi; không bao giờ ghi vào log / câu trả. PAYOS_BASE_URL chỉ để bài thử trỏ về payOS giả.
 * Định dạng đối chiếu SDK chính thức payOSHQ/payos-lib-node (main): ký link = chuỗi cố định 5 trường; ký `data` webhook / vỏ trả = khoá
 * xếp tăng dần, null / 'null' / 'undefined' → rỗng, mảng → JSON, nối k=v bằng &, không mã hoá URL; HMAC-SHA256 hex bằng checksum key.
 */
const crypto = require('crypto');

const GOC_PAYOS = 'https://api-merchant.payos.vn';
const HAN_GOI_MS = 10000;

const khoa = () => ({ id: process.env.PAYOS_CLIENT_ID || '', api: process.env.PAYOS_API_KEY || '', ck: process.env.PAYOS_CHECKSUM_KEY || '' });
const daCauHinh = () => { const k = khoa(); return !!(k.id && k.api && k.ck); };
const hmac = (chuoi, ck) => crypto.createHmac('sha256', ck).update(chuoi).digest('hex');

function chuoiDuLieu(d) {
  const xep = (o) => (o && typeof o === 'object' ? Object.fromEntries(Object.keys(o).sort().map((x) => [x, o[x]])) : o);
  return Object.keys(d).sort().filter((x) => d[x] !== undefined).map((x) => {
    let v = d[x];
    if (Array.isArray(v)) v = JSON.stringify(v.map(xep));
    else if (v === null || v === 'null' || v === 'undefined') v = '';
    return `${x}=${v}`;
  }).join('&');
}

/** Chữ ký `data` đúng với checksum key. Khoá rỗng → luôn sai (không bao giờ HMAC với khoá rỗng). */
function kiemChuKy(data, chuKy) {
  const ck = khoa().ck;
  if (!ck || typeof chuKy !== 'string' || !data || typeof data !== 'object' || Array.isArray(data)) return false;
  const a = Buffer.from(hmac(chuoiDuLieu(data), ck)), b = Buffer.from(chuKy);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Tạo link thanh toán. expiredAt = giây Unix. Lỗi → ném { code: 'PAYOS_LOI' } (lời báo không chứa khoá). */
async function taoLink({ orderCode, amount, description, expiredAt }) {
  const k = khoa();
  const returnUrl = process.env.PAYOS_RETURN_URL || 'https://pos-tuquyduong.io.vn', cancelUrl = returnUrl;
  const signature = hmac(`amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`, k.ck);
  const r = await fetch((process.env.PAYOS_BASE_URL || GOC_PAYOS) + '/v2/payment-requests', {
    method: 'POST',
    headers: { 'x-client-id': k.id, 'x-api-key': k.api, 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderCode, amount, description, cancelUrl, returnUrl, expiredAt, signature }),
    signal: AbortSignal.timeout(HAN_GOI_MS),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || j.code !== '00' || !j.data || (j.signature && !kiemChuKy(j.data, j.signature))) {
    throw Object.assign(new Error(`payOS từ chối tạo link (HTTP ${r.status}, mã ${j && j.code})`), { code: 'PAYOS_LOI' });
  }
  return { qr: j.data.qrCode || null, checkout_url: j.data.checkoutUrl || null };
}

module.exports = { daCauHinh, kiemChuKy, taoLink };
