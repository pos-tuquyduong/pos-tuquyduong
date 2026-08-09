/**
 * POS System - Signup Codes Routes (Bước 4 của "Ưu đãi khách mới")
 *
 * POST /claim: cửa nhận mã — khách nhập mã in trên bill lúc tạo tài khoản App KH.
 * Kiểm hạn 24h (rolling từ lúc mã được in) + chặn SĐT đã từng claim (bất kể mã nào) →
 * phát ra 1 voucher THẬT trong pos_discount_codes, dùng đúng cấu hình owner đặt trong
 * Cài đặt (đọc qua pos_settings, key tiền tố `signup_`).
 *
 * ĐỔI THIẾT KẾ (09.08.2026, theo yêu cầu owner): mã voucher = ĐÚNG mã đã in trên bill,
 * KHÔNG sinh mã mới lúc claim nữa. Trước đây claim xong sẽ ra 1 mã khác hẳn — gây nhầm
 * lẫn (khách/nhân viên tưởng mã in-bill dùng được luôn). Giờ khách chỉ cần nhớ đúng 1 mã
 * duy nhất xuyên suốt từ lúc in tới lúc áp ở quầy.
 *
 * ⚠️ LƯU Ý KIẾN TRÚC (chưa giải quyết, ghi rõ để không quên): App KH backend CHƯA XÂY,
 * nên endpoint này hiện KHÔNG dùng `authenticate` (JWT nhân viên POS — App KH sẽ không
 * có JWT đó). Bảo vệ tạm thời dựa vào bản chất mã: 6 ký tự ngẫu nhiên, chỉ tồn tại thật
 * trên giấy in, hạn 24h, dùng 1 lần — brute-force gần như bất khả thi trong 24h
 * (~887 triệu tổ hợp). Khi xây App KH backend thật (M1), cần bổ sung xác thực
 * service-to-service (API key riêng cho App KH, khác JWT nhân viên) — CHƯA làm ở đây.
 */

const express = require('express');
const { query, queryOne, run, beginTransaction } = require('../database');
const { normalizePhone, getNow, getToday, addDaysToDateString } = require('../utils/helpers');

const router = express.Router();

const CODE_EXPIRE_HOURS = 24;
const DEFAULT_VALID_DAYS = 30;

async function getSignupConfig() {
  const rows = await query(
    "SELECT key, value FROM pos_settings WHERE key LIKE 'signup_%'"
  );
  const cfg = {};
  for (const r of rows) cfg[r.key] = r.value;
  return {
    enabled: cfg.signup_enabled === '1' || cfg.signup_enabled === 'true',
    scope: cfg.signup_scope === 'item' ? 'item' : 'order', // mặc định 'order' nếu chưa cấu hình
    discountType: cfg.signup_discount_type === 'fixed' ? 'fixed' : 'percent',
    discountValue: Number(cfg.signup_discount_value) || 0,
    minOrder: Number(cfg.signup_min_order) || 0,
    validDays: Number(cfg.signup_voucher_valid_days) || DEFAULT_VALID_DAYS,
  };
}

// POST /api/pos/signup-codes/claim
// Body: { code, phone }
router.post('/claim', async (req, res) => {
  try {
    const rawCode = String(req.body.code || '').trim().toUpperCase();
    const phone = normalizePhone(req.body.phone);

    if (!rawCode) {
      return res.status(400).json({ success: false, error: 'Thiếu mã ưu đãi' });
    }
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Số điện thoại không hợp lệ' });
    }

    const config = await getSignupConfig();
    if (!config.enabled) {
      return res.status(400).json({ success: false, error: 'Chương trình ưu đãi khách mới hiện đang tắt' });
    }

    const now = getNow();

    const signupRow = await queryOne(
      'SELECT * FROM pos_signup_codes WHERE UPPER(code) = ?',
      [rawCode]
    );
    if (!signupRow) {
      return res.status(404).json({ success: false, error: 'Mã không tồn tại' });
    }
    if (signupRow.claimed_at) {
      return res.status(400).json({ success: false, error: 'Mã này đã được sử dụng' });
    }

    // Hạn 24h rolling từ lúc in — so sánh bằng mili-giây, không phụ thuộc múi giờ chuỗi.
    const issuedMs = new Date(signupRow.issued_at.replace(' ', 'T') + 'Z').getTime();
    const nowMs = new Date(now.replace(' ', 'T') + 'Z').getTime();
    const hoursPassed = (nowMs - issuedMs) / (1000 * 60 * 60);
    if (!Number.isFinite(hoursPassed) || hoursPassed > CODE_EXPIRE_HOURS) {
      return res.status(400).json({ success: false, error: 'Mã đã hết hạn (quá 24 giờ kể từ lúc in)' });
    }

    // Chặn theo SĐT (không theo mã) — 1 SĐT chỉ claim được đúng 1 lần trong đời, bất kể mã nào.
    const claimedBefore = await queryOne(
      'SELECT id FROM pos_signup_codes WHERE claimed_phone = ? LIMIT 1',
      [phone]
    );
    if (claimedBefore) {
      return res.status(400).json({ success: false, error: 'Số điện thoại này đã từng nhận ưu đãi khách mới' });
    }

    // Nhóm sản phẩm áp dụng — chỉ cần khi scope='item', dùng đúng nhóm seed sẵn ở Bước 1.
    let applicableGroupId = null;
    if (config.scope === 'item') {
      const group = await queryOne("SELECT id FROM pos_product_groups WHERE code = 'khach_moi'");
      if (!group) {
        return res.status(500).json({ success: false, error: 'Chưa cấu hình nhóm sản phẩm cho ưu đãi khách mới' });
      }
      applicableGroupId = group.id;
    }

    // Sinh mã voucher: DÙNG THẲNG mã đã in-bill (rawCode) — không sinh mã mới nữa (đổi
    // thiết kế 09.08.2026). Chỉ cần phòng hờ trùng cực hiếm với 1 mã chiết khấu KHÁC đã
    // tồn tại từ trước (owner tự tạo tay, hoặc mã đổi-điểm) — tránh vỡ UNIQUE giữa transaction.
    const voucherCode = rawCode;
    const existingDiscountCode = await queryOne(
      'SELECT id FROM pos_discount_codes WHERE UPPER(code) = ?',
      [voucherCode]
    );
    if (existingDiscountCode) {
      return res.status(409).json({
        success: false,
        error: 'Mã này đang trùng với 1 mã khác trong hệ thống, vui lòng liên hệ quầy để được hỗ trợ.',
      });
    }

    // BUG-FIX (09.08.2026): valid_to phải là NGÀY THUẦN ("2026-09-08"), khớp đúng quy ước
    // cột này dùng ở mọi nơi khác trong hệ thống — trước đây lưu ngày+giờ đầy đủ, chỉ lộ lỗi
    // đúng vào NGÀY CUỐI hết hạn (so sánh chuỗi coi "còn hạn" dù thực ra đã qua giờ hết hạn).
    // BUG-FIX (09.08.2026): dùng đúng hàm dùng chung addDaysToDateString() (tính theo lịch
    // Y-M-D, không dính giờ/múi giờ) — thay vì cộng mili-giây rồi format lại theo UTC (có thể
    // lệch 1 ngày so với lịch Việt Nam thật, tuỳ giờ claim trong ngày).
    const validTo = addDaysToDateString(getToday(), config.validDays);

    // Giao dịch NGUYÊN TỬ — đánh dấu đã claim + phát voucher, lỗi bất kỳ bước nào → hủy sạch
    // (đúng khuôn mẫu loyalty.js /redeem, không để mã "claimed" mồ côi không có voucher).
    const tx = await beginTransaction();
    try {
      await tx.run(
        'UPDATE pos_signup_codes SET claimed_at = ?, claimed_phone = ? WHERE id = ?',
        [now, phone, signupRow.id]
      );
      await tx.run(
        `INSERT INTO pos_discount_codes (
           code, discount_type, discount_value, min_order, usage_limit, used_count,
           valid_from, valid_to, is_active, notes, discount_scope, applicable_group_id, created_at
         ) VALUES (?, ?, ?, ?, 1, 0, ?, ?, 1, ?, ?, ?, ?)`,
        [
          voucherCode, config.discountType, config.discountValue,
          config.scope === 'order' ? config.minOrder : 0,
          // BUG-FIX (09.08.2026): valid_from phải để NULL (dùng được ngay), không phải `now`.
          // Cột này ở mọi nơi khác lưu dạng CHỈ NGÀY ("2026-08-09"), còn `now` là ngày+giờ đầy
          // đủ ("2026-08-09T21:32:39") — so sánh chuỗi "2026-08-09" < "2026-08-09T21:32:39" ra
          // TRUE (vì là tiền tố của nhau) → hệ thống hiểu nhầm "chưa tới ngày bắt đầu", chặn
          // nhầm voucher vừa tạo. Voucher khách-mới không cần giới hạn ngày bắt đầu — để null.
          null, validTo,
          `Ưu đãi khách mới (claim ${now})`,
          config.scope, applicableGroupId, now,
        ]
      );
      await tx.commit();
    } catch (txErr) {
      await tx.rollback();
      throw txErr;
    }

    res.json({
      success: true,
      data: {
        voucher_code: voucherCode,
        discount_type: config.discountType,
        discount_value: config.discountValue,
        scope: config.scope,
        valid_to: validTo,
      },
    });
  } catch (err) {
    console.error('Signup code claim error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
