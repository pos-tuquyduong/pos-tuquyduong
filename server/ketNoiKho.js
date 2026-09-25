/**
 * POS-KHOTHU-v2 — MỘT nơi DUY NHẤT quyết định POS nối vào đâu (C15, C16).
 *
 *   Replit → KHO THỬ: file data/pos_thu.db · SX TẮT (trừ khi đặt SX_API_URL_THU)
 *   Render → KHO THẬT: Turso + SX production, y như trước patch
 *
 * LUẬT: không file nào khác được đọc process.env.TURSO_DATABASE_URL hay
 * process.env.SX_API_URL. Bộ kiểm nhóm K chặn commit nếu có.
 *
 * VÌ SAO không nhận ra Replit thì nghiêng về Turso: nhận sai trên Render mà rơi
 * vào file cục bộ thì đơn bán thật ghi vào ổ đĩa tạm, MẤT khi khởi động lại.
 * Nhận sai ở Replit thì chỉ quay về tình trạng cũ — và dòng log đầu tiên của
 * server báo PRODUCTION cho người thấy ngay.
 *
 * ⚠ Nếu sau này deploy POS bằng Replit Deployments thì PHẢI xem lại file này:
 * môi trường đó cũng có REPL_ID.
 */
const fs = require('fs');
const path = require('path');

const FILE_THU = path.join(__dirname, '..', 'data', 'pos_thu.db');

function laMayThu() {
  return !!(process.env.REPL_ID || process.env.REPL_SLUG || process.env.REPLIT);
}

/** Trả { laMayThu, cauHinh } — cauHinh đưa thẳng vào createClient(). */
function cauHinhTurso() {
  if (laMayThu()) {
    fs.mkdirSync(path.dirname(FILE_THU), { recursive: true });
    return { laMayThu: true, cauHinh: { url: 'file:' + FILE_THU } };
  }
  const url = process.env.TURSO_DATABASE_URL;
  if (!url || !url.trim()) {
    // B5 — cấu hình rỗng KHÔNG được coi là hợp lệ.
    throw new Error('POS-KHOTHU-v2: thiếu TURSO_DATABASE_URL — từ chối khởi động');
  }
  return {
    laMayThu: false,
    cauHinh: { url, authToken: process.env.TURSO_AUTH_TOKEN },
  };
}

/** Địa chỉ SX. Chuỗi rỗng = không gọi SX (sxApi.isSxConfigured() trả false). */
function diaChiSX() {
  if (laMayThu()) return (process.env.SX_API_URL_THU || '').trim();
  return process.env.SX_API_URL || '';
}

module.exports = { laMayThu, cauHinhTurso, diaChiSX, FILE_THU };
