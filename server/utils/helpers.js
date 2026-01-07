/**
 * POS System - Helper Functions
 */

/**
 * Tạo mã đơn hàng: ORD-YYYYMMDD-XXX
 */
function generateOrderCode() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${dateStr}-${random}`;
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

module.exports = {
  generateOrderCode,
  generateQRCode,
  formatCurrency,
  formatDateTime,
  formatDate,
  getToday,
  getNow,
  isValidPhone,
  normalizePhone,
  calculateOrderTotal,
  parseCSVLine,
  escapeCSVField,
  generateCSV
};
