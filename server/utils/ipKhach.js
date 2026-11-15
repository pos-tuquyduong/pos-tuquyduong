/**
 * DANG-NHAP-2 (vòng 2) — IP THẬT của khách khi POS đứng sau Cloudflare (chủ quán 14.11).
 * Render đặt Cloudflare trước dịch vụ: `trust proxy = 1` chỉ cho IP máy Cloudflare, cả quán dùng chung vài "IP".
 * Cloudflare luôn ghi đè `CF-Connecting-IP` (khách đi qua nó không giả được); `True-Client-IP` chỉ là dự phòng. KHÔNG dùng phần đầu
 * X-Forwarded-For (proxy chỉ nối thêm — khách giả được).
 * Không có header / không phải MỘT địa chỉ IPv4 / IPv6 hợp lệ → IP Express tính như cũ (Replit, bài thử chạy máy).
 */
const net = require('net');

// CF-Connecting-IP đứng TRƯỚC: Cloudflare LUÔN ghi đè nó. True-Client-IP chỉ do Cloudflare đặt khi bật Managed Transform (hoặc Enterprise) —
// chưa bật thì khách tự gửi được, nên chỉ dùng khi không có CF-Connecting-IP (soát độc lập 14.11).
const TEN_HEADER_IP_THAT = ['cf-connecting-ip', 'true-client-ip'];

function ipKhach(req) {
  for (const ten of TEN_HEADER_IP_THAT) {
    const v = req.headers && req.headers[ten];
    if (typeof v === 'string' && net.isIP(v.trim()) !== 0) return v.trim();
  }
  return req.ip;
}

module.exports = { ipKhach };
