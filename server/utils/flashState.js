/**
 * Flash sale — trạng thái dùng chung (F1/F2).
 * MỘT NGUỒN logic cho cả API đọc (routes/flash.js) lẫn luồng bán (routes/orders.js)
 * → hai nơi không bao giờ tính khác nhau. Giờ so theo GIỜ VIỆT NAM (getNow trả +7).
 */

const FLASH_KEYS = ['flash_enabled', 'flash_start', 'flash_end', 'flash_percent', 'flash_product_keys'];

function isValidHHmm(s) {
  return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

/** Đang trong khung giờ flash? [start, end) — gồm mốc đầu, không gồm mốc cuối. Hỗ trợ qua nửa đêm. */
function computeIsFlashNow(enabled, start, end, nowHHmm) {
  if (!enabled) return false;
  if (!isValidHHmm(start) || !isValidHHmm(end)) return false;
  if (start === end) return false;
  if (start < end) return nowHHmm >= start && nowHHmm < end;
  return nowHHmm >= start || nowHHmm < end;
}

/**
 * Đọc cấu hình flash từ pos_settings + tính trạng thái hiện tại.
 * @param {Function} query - hàm query(sql, params) trả mảng row
 * @param {Function} getNow - hàm trả 'YYYY-MM-DDTHH:mm:ss' theo giờ VN
 * @returns {Promise<{enabled,start,end,percent,product_keys,is_flash_now,server_time_vn}>}
 */
async function readFlashState(query, getNow) {
  const placeholders = FLASH_KEYS.map(() => '?').join(',');
  const rows = await query(
    `SELECT key, value FROM pos_settings WHERE key IN (${placeholders})`,
    FLASH_KEYS,
  );
  const m = {};
  rows.forEach((r) => (m[r.key] = r.value));

  let productKeys = [];
  try {
    const parsed = JSON.parse(m.flash_product_keys || '[]');
    if (Array.isArray(parsed)) {
      productKeys = parsed.filter((k) => typeof k === 'string' && /^.+_.+$/.test(k));
    }
  } catch (e) {
    productKeys = [];
  }

  let percent = parseInt(m.flash_percent, 10);
  if (!Number.isFinite(percent) || percent < 1 || percent > 90) percent = 0;

  const enabled = m.flash_enabled === 'true';
  const start = isValidHHmm(m.flash_start) ? m.flash_start : null;
  const end = isValidHHmm(m.flash_end) ? m.flash_end : null;
  const nowHHmm = getNow().slice(11, 16);

  return {
    enabled,
    start,
    end,
    percent,
    product_keys: productKeys,
    is_flash_now: computeIsFlashNow(enabled, start, end, nowHHmm),
    server_time_vn: nowHHmm,
  };
}

module.exports = { readFlashState, computeIsFlashNow, isValidHHmm };
