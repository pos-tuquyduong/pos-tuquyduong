/**
 * POS System - Loyalty Routes (LOY-2b)
 * Đọc điểm · đọc ví voucher · đổi điểm lấy voucher.
 *
 * NGUYÊN TẮC:
 * - POS là nguồn sự thật của điểm & voucher, khóa theo SĐT. App KH gọi thẳng 3 API này.
 * - Voucher đổi điểm TỰ DO CHUYỂN NHƯỢNG (chốt 15.07.2026): ai cầm mã cũng dùng được, chỉ giới hạn DÙNG 1 LẦN (usage_limit=1).
 *   VOUCHER-2 (Q1, 11.11): mẫu voucher chọn "Chia sẻ được" hoặc "Chỉ chính chủ"; quà đổi điểm hôm nay = chia sẻ được.
 * - Voucher đổi ra = 1 dòng pos_discount_codes (usage_limit=1) + 1 dòng ví, phát qua utils/voucherCode.js phatVoucher;
 *   đơn kiểm + tiêu voucher ở orders.js (kiemVoucherDon, giao dịch taoDon).
 * - Đổi điểm là giao dịch NGUYÊN TỬ: trừ điểm + đẻ mã + ghi ví — lỗi bất kỳ bước nào → hủy sạch
 *   (không mất điểm, không đẻ mã mồ côi). Khác với cộng điểm khi bán (ở đó điểm không được
 *   phép kéo đổ đơn); ở đây all-or-nothing CHÍNH LÀ yêu cầu nghiệp vụ.
 * - Turso trả lastInsertRowid dạng BigInt → luôn bọc Number() trước khi res.json().
 *
 * TURSO: mọi database call dùng await.
 */

const express = require('express');
const { query, queryOne, run, beginTransaction } = require('../database');
const { authenticate, authenticateServiceOrUser, checkPermission } = require('../middleware/auth');
const { getNow, normalizePhone } = require('../utils/helpers');
const { phatVoucher, mauTuQua } = require('../utils/voucherCode');   // VOUCHER-2: đổi điểm phát voucher qua hàm chung
// KH-API-1: số dư / lịch sử điểm + ví voucher dùng chung với /api/kh (cùng câu, cùng cách suy trạng thái).
const { BALANCE_SQL, layDiemKhach, layVoucherKhach } = require('../utils/diemKhach');
const { loiGhi } = require('./wallets');

const router = express.Router();

// Mã voucher: dùng chung utils/voucherCode.js (không định nghĩa lại ở đây — xem file đó
// để biết bảng chữ cái + lý do bỏ ký tự dễ nhầm).

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pos/loyalty/points/:phone — số dư điểm + lịch sử gần đây
// ─────────────────────────────────────────────────────────────────────────────
// ĐÃ VÁ (09.08.2026, chuẩn bị App KH): dùng authenticateServiceOrUser — App KH backend
// (sau này) gọi bằng X-Service-Key, nhân viên POS vẫn dùng JWT như cũ, không đổi gì.
router.get('/points/:phone', authenticateServiceOrUser, async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) return res.status(400).json({ error: 'Số điện thoại không hợp lệ' });

    const { points, history } = await layDiemKhach(phone);
    res.json({ success: true, phone, points, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pos/loyalty/vouchers/:phone — ví voucher của khách (?all=1 → cả đã dùng)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/vouchers/:phone', authenticateServiceOrUser, async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) return res.status(400).json({ error: 'Số điện thoại không hợp lệ' });

    const data = await layVoucherKhach(phone, req.query.all === '1');
    res.json({ success: true, phone, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pos/loyalty/redeem — đổi điểm lấy voucher (NGUYÊN TỬ)
// body: { phone, reward_id }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/redeem', authenticateServiceOrUser, async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const rewardId = parseInt(req.body.reward_id, 10);
    if (!phone) return res.status(400).json({ error: 'Thiếu số điện thoại khách' });
    if (!Number.isFinite(rewardId)) return res.status(400).json({ error: 'Thiếu quà cần đổi' });

    // ── Chuẩn bị NGOÀI transaction ──
    const reward = await queryOne(
      'SELECT * FROM pos_reward_catalog WHERE id = ? AND is_active = 1',
      [rewardId],
    );
    if (!reward) return res.status(404).json({ error: 'Quà không tồn tại hoặc đã tắt' });

    const cost = parseInt(reward.points_cost, 10);
    if (!Number.isFinite(cost) || cost < 1) {
      return res.status(400).json({ error: 'Quà cấu hình sai giá điểm' });
    }

    const now = getNow();

    // ── Transaction: all-or-nothing ──
    const tx = await beginTransaction();
    try {
      // Kiểm số dư BÊN TRONG tx để chặn đổi trùng khi bấm 2 lần cùng lúc.
      const balRow = await tx.queryOne(BALANCE_SQL, [phone, now]);
      const balance = balRow?.points || 0;
      if (balance < cost) {
        await tx.rollback();
        return res.status(400).json({ error: `Không đủ điểm (có ${balance}, cần ${cost})` });
      }

      // 1) Trừ điểm — dòng redeem không có hạn (đã trừ là trừ vĩnh viễn).
      const ptRes = await tx.run(
        `INSERT INTO pos_point_transactions (
           customer_phone, type, points, order_id, expires_at, reason, created_by, created_at
         ) VALUES (?, 'redeem', ?, NULL, NULL, ?, ?, ?)`,
        [phone, -cost, `Đổi quà: ${reward.name}`, req.user.username, now],
      );
      const pointTxId = Number(ptRes.lastInsertRowid);

      // 2–3) VOUCHER-2: đẻ mã dùng-một-lần + ghi ví voucher qua MỘT hàm phát (cùng giao dịch); quà = mẫu "chia sẻ được", nguồn doi_diem.
      const { code, grant_id: grantId, het_han: validTo } = await phatVoucher(tx, mauTuQua(reward), phone, 'doi_diem',
        { reward_id: rewardId, point_tx_id: pointTxId, ghi_chu: `Đổi điểm: ${reward.name} (${phone})`, nguoi: req.user.username });

      await tx.commit();

      res.json({
        success: true,
        message: `Đã đổi ${cost} điểm lấy "${reward.name}"`,
        data: {
          code,
          grant_id: grantId,
          reward_name: reward.name,
          discount_type: reward.discount_type,
          discount_value: reward.discount_value,
          expires_at: validTo,
          points_spent: cost,
          points_left: balance - cost,
        },
      });
    } catch (txErr) {
      await tx.rollback();
      throw txErr;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DIEM-MON-1 — công tắc "Tích điểm" theo món / gói trả trước / hạng bán được (Cài đặt → Điểm thưởng). Xem: quyền xem tab (manage_settings);
// đổi: manage_promotions. MỘT câu UPDATE cho cả danh sách đã chọn; tên bảng lấy từ danh sách trắng, id là số nguyên dương.
// Đổi công tắc không đổi đơn cũ: đơn lưu phần tiền tích điểm + cờ từng dòng lúc bán (orders.js, utils/diemThat.js).
// ─────────────────────────────────────────────────────────────────────────────
const BANG_TICH_DIEM = { mon: 'pos_products', goi: 'pos_packages', hang: 'pos_membership_tiers' };
const ID_TICH_DIEM_TOI_DA = 500;

router.get('/tich-diem', authenticate, checkPermission('manage_settings'), async (req, res) => {
  try {
    res.json({
      success: true,
      mon: await query('SELECT id, name AS ten, tich_diem FROM pos_products WHERE is_active = 1 AND price > 0 ORDER BY name'),
      goi: await query('SELECT id, name AS ten, tich_diem FROM pos_packages WHERE is_active = 1 ORDER BY name'),
      hang: await query("SELECT id, name AS ten, tich_diem FROM pos_membership_tiers WHERE is_active = 1 AND cach_co = 'ban' ORDER BY sort_order"),
    });
  } catch (err) {
    console.error('GET /loyalty/tich-diem:', err.message);
    res.status(500).json({ error: 'Không đọc được danh sách tích điểm', code: 'LOI_MAY_CHU' });
  }
});

router.put('/tich-diem', authenticate, checkPermission('manage_promotions'), async (req, res) => {
  try {
    const { loai, ids, bat } = req.body || {};
    const bang = Object.hasOwn(BANG_TICH_DIEM, loai) ? BANG_TICH_DIEM[loai] : null;
    if (!bang || !Array.isArray(ids) || !ids.length || ids.length > ID_TICH_DIEM_TOI_DA
      || !ids.every((id) => Number.isSafeInteger(id) && id > 0) || typeof bat !== 'boolean') {
      return res.status(400).json({ error: 'Chọn món / gói / hạng cần đổi tích điểm rồi thử lại', code: 'TICH_DIEM_SAI' });
    }
    const kq = await run(`UPDATE ${bang} SET tich_diem = ? WHERE id IN (${ids.map(() => '?').join(', ')})`, [bat ? 1 : 0, ...ids]);
    res.json({ success: true, doi: Number(kq.changes || 0) });
  } catch (err) {
    loiGhi(res, err);   // kho bận → 409 KHO_BAN, lỗi khác → 500 không lộ lời nội bộ
  }
});

module.exports = router;
