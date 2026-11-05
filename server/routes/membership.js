/**
 * POS System - Membership Status Routes (TIER-1c, HANG-1)
 * Tra cứu hạng hiện tại của khách + CẤP / THU HỒI hạng "chỉ cấp" (chủ quán) + nhật ký hạng + PIN chủ quán.
 *
 * Việc MUA thẻ đi qua đúng luồng bán hàng thường (POST /api/pos/orders với membership_buy { tier_id, so_thang } — xem orders.js),
 * không có endpoint mua riêng ở đây (tránh 2 luồng thanh toán song song). CẤP không thu tiền, không qua đơn: chỉ quyền cap_hang
 * (mặc định chỉ owner) + PIN chủ quán (utils/pinChuQuan.js); mỗi lần cấp / thu hồi là MỘT dòng mới trong sổ (chỉ thêm).
 *
 * Logic tra hạng dùng chung qua utils/membershipStatus.js — MỘT NGUỒN duy nhất.
 */

const express = require('express');
const { query, queryOne, beginTransaction } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { normalizePhone, getNow } = require('../utils/helpers');
const { getMembershipStatus, hanCacHang, hanSauDong, HAN_VO_HAN } = require('../utils/membershipStatus');
const { coPinChuQuan, datPinChuQuan, kiemPinChuQuan } = require('../utils/pinChuQuan');

const router = express.Router();

const THANG_TOI_THIEU = 1;
const THANG_TOI_DA = 60;
const bao = (res, [status, code, error]) => res.status(status).json({ error, code });

// GET /api/pos/membership/status/:phone — tra cứu hạng hiện tại của 1 khách
router.get('/status/:phone', authenticate, async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) return res.status(400).json({ error: 'SĐT không hợp lệ' });
    const data = await getMembershipStatus(query, queryOne, getNow, phone);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pos/membership/nhat-ky/:phone — mọi dòng sổ thẻ của khách, mới trước (mua / cấp / thu hồi). Hạn vô hạn trả null.
router.get('/nhat-ky/:phone', authenticate, async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) return res.status(400).json({ error: 'SĐT không hợp lệ' });
    const ds = await query(`SELECT id, tier_id, tier_name, loai, so_thang, price_paid, order_id, purchased_at, expires_at, created_by
      FROM pos_membership_purchases WHERE customer_phone = ? ORDER BY purchased_at DESC, id DESC`, [phone]);
    res.json({ success: true, data: ds.map((d) => ({ ...d, expires_at: d.expires_at === HAN_VO_HAN ? null : d.expires_at })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pos/membership/pin-chu-quan — đã đặt PIN chủ quán chưa (không trả PIN / băm)
router.get('/pin-chu-quan', authenticate, async (req, res) => {
  try {
    res.json({ success: true, data: { co_pin: await coPinChuQuan() } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pos/membership/pin-chu-quan { mat_khau, pin, pin_lai, pin_cu } — chỉ tài khoản owner, gõ lại mật khẩu; đã có PIN thì cần pin_cu
router.post('/pin-chu-quan', authenticate, async (req, res) => {
  try {
    const b = req.body || {};
    const kq = await datPinChuQuan(req.user, b.mat_khau, b.pin, b.pin_lai, b.pin_cu);
    if (kq.loi) return bao(res, kq.loi);
    res.json({ success: true, message: 'Đã đặt PIN chủ quán' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Ghi MỘT dòng sổ cấp / thu hồi trong giao dịch (expires_at = hạn của hạng tính LÚC GHI — chỉ API /nhat-ky trả ra; màn nhật ký không hiện,
 *  hàm hạng không dùng: hạn thật cộng lại từ sổ). */
async function ghiDong(phone, hang, loai, soThang, nguoi) {
  const now = getNow();
  const tx = await beginTransaction();
  try {
    const dong = { tier_id: hang.id, tier_name: hang.name, loai, so_thang: soThang, purchased_at: now };
    const han = await hanSauDong(tx, phone, dong);
    await tx.run(`INSERT INTO pos_membership_purchases
      (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at, created_by, loai, so_thang)
      VALUES (?, ?, ?, 0, NULL, ?, ?, ?, ?, ?)`, [phone, hang.id, hang.name, now, han, nguoi, loai, soThang]);
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

/** Chung cho cấp / thu hồi: SĐT chuẩn hoá được (khách chỉ có ở SX vẫn cấp được — không đòi pos_customers, không tạo khách) + hạng chi_cap. */
async function docYeuCau(b) {
  const phone = normalizePhone(typeof b.phone === 'string' ? b.phone : '');
  if (!phone) return { loi: [400, 'SDT_KHONG_HOP_LE', 'SĐT không hợp lệ'] };
  const hang = await queryOne('SELECT * FROM pos_membership_tiers WHERE id = ? AND is_active = 1', [b.tier_id ?? null]);
  if (!hang || hang.cach_co !== 'chi_cap') return { loi: [400, 'HANG_KHONG_PHAI_CHI_CAP', 'Chỉ cấp được hạng "chỉ cấp" đang bật'] };
  return { phone, hang };
}

// POST /api/pos/membership/cap { phone, tier_id, so_thang (1–60 | null = không thời hạn), pin } — không thu tiền, không qua đơn
router.post('/cap', authenticate, checkPermission('cap_hang'), async (req, res) => {
  try {
    const b = req.body || {};
    const yc = await docYeuCau(b);
    if (yc.loi) return bao(res, yc.loi);
    const voHan = b.so_thang === null;
    const soThang = voHan ? null : Number(b.so_thang);
    if (!voHan && !(typeof b.so_thang === 'number' && Number.isInteger(soThang) && soThang >= THANG_TOI_THIEU && soThang <= THANG_TOI_DA)) {
      return bao(res, [400, 'SO_THANG_KHONG_HOP_LE', `Số tháng phải là số nguyên từ ${THANG_TOI_THIEU} đến ${THANG_TOI_DA}, hoặc không thời hạn`]);
    }
    const pin = await kiemPinChuQuan(b.pin);
    if (pin.loi) return bao(res, pin.loi);
    await ghiDong(yc.phone, yc.hang, 'cap', soThang, req.user.username);
    res.json({ success: true, data: await getMembershipStatus(query, queryOne, getNow, yc.phone) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pos/membership/thu-hoi { phone, tier_id, pin } — chỉ khi khách đang giữ hạng chi_cap đó còn hạn
router.post('/thu-hoi', authenticate, checkPermission('cap_hang'), async (req, res) => {
  try {
    const b = req.body || {};
    const yc = await docYeuCau(b);
    if (yc.loi) return bao(res, yc.loi);
    const han = hanCacHang(await query('SELECT * FROM pos_membership_purchases WHERE customer_phone = ? ORDER BY purchased_at, id', [yc.phone]))
      .get(Number(yc.hang.id))?.han;
    if (!han || han <= getNow()) return bao(res, [400, 'KHONG_CO_HANG_DE_THU_HOI', 'Khách không đang giữ hạng này']);
    const pin = await kiemPinChuQuan(b.pin);
    if (pin.loi) return bao(res, pin.loi);
    await ghiDong(yc.phone, yc.hang, 'thu_hoi', null, req.user.username);
    res.json({ success: true, data: await getMembershipStatus(query, queryOne, getNow, yc.phone) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
