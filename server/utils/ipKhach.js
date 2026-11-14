/**
 * DANG-NHAP-2 (vòng 2) — IP THẬT của khách khi POS đứng sau Cloudflare (chủ quán 14.11).
 * Render đặt Cloudflare trước dịch vụ: `trust proxy = 1` chỉ cho IP máy Cloudflare, cả quán dùng chung vài "IP".
 * Cloudflare tự ghi đè `True-Client-IP` / `CF-Connecting-IP` (khách đi qua nó không giả được). KHÔNG dùng phần đầu
 * X-Forwarded-For (proxy chỉ nối thêm — khách giả được).
 * Không có header / không phải MỘT địa chỉ IPv4 / IPv6 hợp lệ → IP Express tính như cũ (Replit, bài thử chạy máy).
 */
const net = require('net');

const TEN_HEADER_IP_THAT = ['true-client-ip', 'cf-connecting-ip'];

function ipKhach(req) {
  for (const ten of TEN_HEADER_IP_THAT) {
    const v = req.headers && req.headers[ten];
    if (typeof v === 'string' && net.isIP(v.trim()) !== 0) return v.trim();
  }
  return req.ip;
}

module.exports = { ipKhach };
