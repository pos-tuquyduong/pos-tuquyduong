/**
 * POS System - Flash Sale Routes (F1)
 * Đọc cấu hình flash sale + tính "đang trong giờ flash" theo GIỜ VIỆT NAM.
 *
 * NGUYÊN TẮC (đồng bộ Web KH sau này):
 * - Cấu hình sống ở POS (nguồn sự thật). API này là HỢP ĐỒNG mà cả admin POS lẫn app KH đọc.
 * - Món được sale lưu bằng KHÓA BỀN unique_id = "type_id" (KHÔNG dùng code/tên — chúng đổi).
 *   → POS lúc bán và app lúc hiển thị cùng chỉ đúng một món.
 * - "Đang flash" tính ở SERVER theo giờ VN (getNow trả +7). Client chỉ hiển thị; lúc tạo đơn
 *   POS mới là người quyết (F2) → app & quầy không lệch, không gian lận giờ.
 * - Route này CHỈ ĐỌC (inert). Áp giảm giá thật là F2.
 *
 * TURSO: mọi database call dùng await.
 */

const express = require('express');
const { query } = require('../database');
const { authenticate } = require('../middleware/auth');
const { getNow } = require('../utils/helpers');

const router = express.Router();

const FLASH_KEYS = ['flash_enabled', 'flash_start', 'flash_end', 'flash_percent', 'flash_product_keys'];

// HH:mm hợp lệ 00:00–23:59
function isValidHHmm(s) {
  return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

/**
 * Đang trong khung giờ flash? So chuỗi "HH:mm" (giờ VN).
 * Hỗ trợ cả khung qua nửa đêm (start > end, vd 22:00→02:00).
 * Quy ước: gồm mốc bắt đầu, KHÔNG gồm mốc kết thúc [start, end).
 */
function computeIsFlashNow(enabled, start, end, nowHHmm) {
  if (!enabled) return false;
  if (!isValidHHmm(start) || !isValidHHmm(end)) return false;
  if (start === end) return false; // khung 0 phút
  if (start < end) return nowHHmm >= start && nowHHmm < end;
  return nowHHmm >= start || nowHHmm < end; // qua nửa đêm
}

// GET /api/pos/flash — cấu hình flash + trạng thái hiện tại (giờ VN)
router.get('/', authenticate, async (req, res) => {
  try {
    const placeholders = FLASH_KEYS.map(() => '?').join(',');
    const rows = await query(
      `SELECT key, value FROM pos_settings WHERE key IN (${placeholders})`,
      FLASH_KEYS,
    );
    const m = {};
    rows.forEach((r) => (m[r.key] = r.value));

    // product_keys: parse an toàn, chỉ giữ chuỗi "type_id" hợp lệ
    let productKeys = [];
    try {
      const parsed = JSON.parse(m.flash_product_keys || '[]');
      if (Array.isArray(parsed)) {
        productKeys = parsed.filter((k) => typeof k === 'string' && /^.+_.+$/.test(k));
      }
    } catch (e) {
      productKeys = [];
    }

    // percent: kẹp 1–90, sai → 0 (an toàn cho F2: 0% = không giảm)
    let percent = parseInt(m.flash_percent, 10);
    if (!Number.isFinite(percent) || percent < 1 || percent > 90) percent = 0;

    const enabled = m.flash_enabled === 'true';
    const start = isValidHHmm(m.flash_start) ? m.flash_start : null;
    const end = isValidHHmm(m.flash_end) ? m.flash_end : null;
    const nowHHmm = getNow().slice(11, 16);

    res.json({
      success: true,
      data: {
        enabled,
        start,
        end,
        percent,
        product_keys: productKeys,
        is_flash_now: computeIsFlashNow(enabled, start, end, nowHHmm),
        server_time_vn: nowHHmm,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
