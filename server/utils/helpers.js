/**
 * POS System - Helper Functions
 */
const crypto = require('crypto');

/**
 * Tạo mã đơn hàng: ORD-YYYYMMDD-XXX
 */
function generateOrderCode() {
  const dateStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${dateStr}-${random}`;
}

/**
 * CK-NOIDUNG-1 — SỔ SỐ HOÁ ĐƠN theo ngày giờ VN, dãy CHUNG quầy (HD) + App (APP), 4 số, đếm lại từ 0001 mỗi ngày.
 * Cấp số = MỘT câu INSERT … SELECT MAX + 1 trong giao dịch ghi (BEGIN IMMEDIATE — hai giao dịch không đọc chung một MAX); UNIQUE (ngay, so)
 * là chốt cuối. Số > SO_HD_TOI_DA → ném (không cắt, không quay vòng) — cả giao dịch rollback. Giao dịch rollback thì số cũng rollback:
 * phiên / đơn hỏng trong giao dịch không để lại chỗ trống.
 * Nhận `tx` (đối tượng giao dịch: run + queryOne) từ nơi gọi — helpers không nạp database (tránh phụ thuộc vòng).
 */
const SO_HD_TOI_DA = 9999;
const THANG_CK = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const chuoiSoHd = (s) => s.kenh + String(s.so).padStart(4, '0');   // { kenh, so } → 'HD0016' / 'APP0016' — đúng chuỗi in to trên bill

async function capSoHoaDon(tx, { kenh, phienId = null, now }) {
  const ngay = now.slice(0, 10);
  const ins = await tx.run(`INSERT INTO pos_so_hoa_don (ngay, so, kenh, phien_id, luc)
    SELECT ?, COALESCE(MAX(so), 0) + 1, ?, ?, ? FROM pos_so_hoa_don WHERE ngay = ?`, [ngay, kenh, phienId, now, ngay]);
  const s = await tx.queryOne('SELECT * FROM pos_so_hoa_don WHERE id = ?', [Number(ins.lastInsertRowid)]);
  if (!s || s.so > SO_HD_TOI_DA) throw new Error(`Số hoá đơn ngày ${ngay} vượt ${SO_HD_TOI_DA} — báo chủ quán`);
  return s;
}

/** Nội dung chuyển khoản của một số: TQD<MMM><DD> <kênh><4 số> (vd "TQDNOV05 HD0016"), MMM / DD theo NGÀY CỦA SỐ (giờ VN). */
const noiDungCk = (s) => `TQD${THANG_CK[Number(s.ngay.slice(5, 7)) - 1]}${s.ngay.slice(8, 10)} ${chuoiSoHd(s)}`;

/**
 * Mã đơn ORD-<YYYYMMDD của số>-<kênh><4 số> (vd ORD-20261105-HD0016). Phiên đã giữ số → dùng ĐÚNG số đó (kể cả xác nhận tay sau khi QR
 * hết hạn); không có → cấp số HD mới. PHẢI gọi đầu giao dịch ghi tạo đơn (P26d (10)): kho bận ở đây rơi về route để rollback + 409.
 * Mọi chỗ in số bill đọc phần sau dấu '-' cuối → "HD0016". Đơn cũ giữ mã cũ (ORD-YYYYMMDD-NNN), không đánh số lại.
 */
async function taoMaDonTheoSo(tx, phienId, now) {
  const s = (phienId && await tx.queryOne('SELECT * FROM pos_so_hoa_don WHERE phien_id = ?', [phienId]))
    || await capSoHoaDon(tx, { kenh: 'HD', now });
  return { code: `ORD-${s.ngay.replace(/-/g, '')}-${chuoiSoHd(s)}`, soId: s.id };
}

/** Số hoá đơn đọc từ mã đơn: ORD-…-HD0016 → "HD0016"; mã cũ ORD-…-012 → "012" (cùng phép với số bill in to). */
const soHdCuaMa = (code) => String(code || '').split('-').pop();

/**
 * P15-QR — mã QR thành viên: QR_TIEN_TO + 12 ký tự ngẫu nhiên (≈ 60 bit), KHÔNG suy ra từ SĐT.
 * Bảng 32 ký tự bỏ I, O cho khỏi nhầm; 256 chia hết 32 nên `byte % 32` không lệch. Đối số cũ (SĐT) bị bỏ qua.
 * Tiền tố cố định để quầy phân biệt thẻ thành viên với mã khuyến mãi.
 */
const QR_TIEN_TO = 'TQD-';
const QR_BANG_KY_TU = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const QR_THU_TOI_DA = 5;
function generateQRCode() {
  return QR_TIEN_TO + Array.from(crypto.randomBytes(12), (b) => QR_BANG_KY_TU[b % 32]).join('');
}

/** Sinh mã chưa có trong pos_customers.qr_code; trùng thì sinh lại, quá QR_THU_TOI_DA lần thì ném. Nhận queryOne từ nơi gọi (helpers không nạp database). */
async function sinhQrKhongTrung(queryOne) {
  for (let lan = 0; lan < QR_THU_TOI_DA; lan++) {
    const ma = generateQRCode();
    if (!(await queryOne('SELECT 1 FROM pos_customers WHERE qr_code = ?', [ma]))) return ma;
  }
  throw new Error('không sinh được mã QR chưa trùng');
}

/**
 * Format số tiền VND
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

/**
 * Format ngày giờ Việt Nam
 */
function formatDateTime(date) {
  if (!date) return null;
  return new Date(date).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format ngày Việt Nam
 */
function formatDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Lấy ngày hôm nay (YYYY-MM-DD)
 */
function getToday() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
}

/**
 * Cộng thêm N ngày vào 1 chuỗi ngày ("YYYY-MM-DD" hoặc chuỗi ngày+giờ, chỉ lấy 10 ký tự đầu),
 * trả về đúng dạng ngày thuần "YYYY-MM-DD" — DÙNG CHUNG cho mọi nơi cần tính "hạn N ngày kể từ
 * ngày X" (voucher đổi điểm ở loyalty.js, voucher khách-mới ở signup-codes.js...). Tính bằng
 * lịch (Date.UTC trên riêng phần Y-M-D, không dính giờ/múi giờ) — tránh lệch ngày do cộng mili-
 * giây rồi format lại theo UTC (có thể lệch 1 ngày so với lịch Việt Nam thật).
 */
function addDaysToDateString(dateStr, days) {
  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/**
 * Lấy timestamp hiện tại
 */
function getNow() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).replace(' ', 'T');
}

/**
 * Validate số điện thoại Việt Nam
 */
function isValidPhone(phone) {
  if (!phone) return false;
  // Loại bỏ khoảng trắng, dấu gạch
  const cleaned = phone.replace(/[\s\-\.]/g, '');
  // Kiểm tra format: 0xx hoặc +84xx (9-11 số)
  return /^(0|\+84)[0-9]{9,10}$/.test(cleaned);
}

/**
 * Chuẩn hóa số điện thoại (về dạng 0xxx)
 */
function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/[\s\-\.]/g, '');
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  }
  return cleaned;
}

/**
 * Tính tổng tiền đơn hàng
 */
function calculateOrderTotal(items, discount = 0) {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0);
  return {
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount)
  };
}

/**
 * Parse CSV line (xử lý dấu phẩy trong ngoặc kép)
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result.map(field => field.replace(/^"|"$/g, ''));
}

/**
 * Escape CSV field
 */
function escapeCSVField(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Tạo CSV content từ data
 */
function generateCSV(headers, rows) {
  const headerLine = headers.map(escapeCSVField).join(',');
  const dataLines = rows.map(row => 
    headers.map(h => escapeCSVField(row[h])).join(',')
  );
  return '\uFEFF' + [headerLine, ...dataLines].join('\n'); // BOM for UTF-8
}

// Cộng tháng an toàn — tránh bẫy JS Date.setMonth() nhảy tháng khi ngày đích không tồn tại
// (vd 31/1 + 1 tháng KHÔNG được nhảy sang 3/3, phải chốt về ngày cuối tháng 2). Dùng chung
// cho mọi nơi tính hạn hiệu lực theo tháng (TIER-1c và về sau). Phép UTC thuần (GIO-VN-1): người gọi đưa giờ VN
// dạng `new Date(getNow() + 'Z')` → kết quả không phụ thuộc múi giờ máy chủ.
function addMonthsSafe(date, months) {
  const d = new Date(date.getTime());
  const targetMonth = d.getUTCMonth() + months;
  const lastDayOfTargetMonth = new Date(Date.UTC(d.getUTCFullYear(), targetMonth + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(d.getUTCDate(), lastDayOfTargetMonth));
  d.setUTCMonth(targetMonth);
  return d;
}

module.exports = {
  generateOrderCode,
  taoMaDonTheoSo, // POS-MADON-v1 → CK-NOIDUNG-1
  capSoHoaDon,
  noiDungCk,
  chuoiSoHd,
  soHdCuaMa,
  generateQRCode,
  sinhQrKhongTrung, // P15-QR
  QR_TIEN_TO,
  QR_THU_TOI_DA,
  formatCurrency,
  formatDateTime,
  formatDate,
  getToday,
  getNow,
  addDaysToDateString,
  isValidPhone,
  normalizePhone,
  calculateOrderTotal,
  parseCSVLine,
  escapeCSVField,
  generateCSV,
  addMonthsSafe
};
