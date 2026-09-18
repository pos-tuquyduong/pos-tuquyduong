/**
 * POS System - Helper Functions
 */

/**
 * Tạo mã đơn hàng: ORD-YYYYMMDD-XXX
 */
function generateOrderCode() {
  const dateStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${dateStr}-${random}`;
}

/**
 * POS-MADON-v1 — Tạo mã đơn theo SỐ THỨ TỰ trong ngày: ORD-YYYYMMDD-001
 *
 * Thay cho `generateOrderCode()` bốc ngẫu nhiên 3 số: chỉ 1.000 khả năng mỗi
 * ngày, bán 40 đơn là hơn nửa số ngày có trùng. Cột `code` có UNIQUE nên
 * trùng = đơn BỊ TỪ CHỐI lúc ghi, giữa lúc khách đang đứng chờ.
 *
 * Nhận `queryOne` từ nơi gọi để không tạo phụ thuộc vòng giữa helpers và
 * database (helpers hiện không nạp database, giữ nguyên như vậy).
 */
async function taoMaDonTheoSo(queryOne) {
  const ngay = new Date()
    .toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })
    .replace(/-/g, "");
  const dau = `ORD-${ngay}-`;

  // Số lớn nhất đã dùng hôm nay. Đơn CŨ mang mã ngẫu nhiên cũng cùng dạng
  // nên vẫn đếm được — mã mới luôn lớn hơn mọi mã cũ trong ngày.
  let ke = 1;
  try {
    const rows = await queryOne(
      `SELECT code FROM pos_orders WHERE code LIKE ? ORDER BY LENGTH(code) DESC, code DESC LIMIT 1`,
      [`${dau}%`],
    );
    if (rows && rows.code) {
      const phan = String(rows.code).slice(dau.length);
      const so = parseInt(phan, 10);
      if (Number.isFinite(so)) ke = so + 1;
    }
  } catch (e) {
    // Đọc hỏng thì bắt đầu từ 1 rồi để vòng dưới tự tránh trùng.
    console.error("Khong doc duoc ma don gan nhat:", e.message);
  }

  // Hai đơn cùng lúc có thể cùng tính ra một số. Hiếm ở một quầy nhưng vẫn
  // phải chặn: thử số kế tiếp cho tới khi tìm được mã chưa ai lấy.
  for (let i = 0; i < 30; i++) {
    const ma = dau + String(ke + i).padStart(3, "0");
    try {
      const da = await queryOne("SELECT id FROM pos_orders WHERE code = ?", [ma]);
      if (!da) return ma;
    } catch (e) {
      return ma; // không kiểm được thì cứ dùng, UNIQUE là chốt cuối
    }
  }

  // Hết 30 lần: dùng mã theo mili giây. Xấu nhưng KHÔNG BAO GIỜ được để
  // việc sinh mã chặn một ca bán thật.
  return dau + String(Date.now()).slice(-6);
}

/**
 * Tạo mã QR từ SĐT: QR-0901234567
 */
function generateQRCode(phone) {
  return `QR-${phone}`;
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
// cho mọi nơi tính hạn hiệu lực theo tháng (TIER-1c và về sau).
function addMonthsSafe(date, months) {
  const d = new Date(date.getTime());
  const targetMonth = d.getMonth() + months;
  const lastDayOfTargetMonth = new Date(d.getFullYear(), targetMonth + 1, 0).getDate();
  d.setDate(Math.min(d.getDate(), lastDayOfTargetMonth));
  d.setMonth(targetMonth);
  return d;
}

module.exports = {
  generateOrderCode,
  taoMaDonTheoSo, // POS-MADON-v1
  generateQRCode,
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
