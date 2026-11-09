/**
 * POS System - Membership Tier Routes (TIER-1a-v2, HANG-1)
 * Cài đặt hạng thành viên: tên, thứ bậc (sort_order — lớn = cao), % giảm thường / nhóm đặc biệt, cách có hạng (bán theo gói | chỉ cấp),
 * danh sách GÓI của hạng bán (số tháng 1–60, giá — trống thì chưa bán, bật / tắt) + mức làm tròn giá hạng (tier_round_to / tier_round_mode — chỉ màn Cài đặt hạng
 * dùng để xem trước; máy chủ KHÔNG dùng để tính giá đơn).
 * Hạng lên theo MUA GÓI ở quầy (orders.js) hoặc chủ quán CẤP (membership.js). card_price thôi dùng (giữ cột, không đọc / ghi).
 * MỌI thay đổi (PUT / DELETE) phải kèm PIN chủ quán `pin` (chủ quán 04.11 — cùng khoá sai 5 lần với cấp hạng): sửa %, giá gói, thứ bậc,
 * thêm hạng, đổi bán ↔ chỉ cấp đều là đường tới quyền lợi của hạng chỉ cấp — phiên đăng nhập (kể cả chủ quán) không đủ.
 *
 * TURSO: mọi database call dùng await; lastInsertRowid là BigInt → bọc Number() khi trả.
 */

const express = require('express');
const { query, run, beginTransaction } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { getNow } = require('../utils/helpers');
const { docGoi, soKhachGiuHang } = require('../utils/membershipStatus');
const { kiemPinChuQuan } = require('../utils/pinChuQuan');

const router = express.Router();

const ROUND_ALLOWED = [0, 500, 1000];
const CACH_CO = ['ban', 'chi_cap'];
const THANG_TOI_THIEU = 1;
const THANG_TOI_DA = 60;
const PHAN_TRAM_TOI_DA = 90;
const QUYEN_LOI_TOI_DA_DONG = 10;      // KH-THE-1: quyền lợi hạng (App KH đọc GET /hang quyen_loi[])
const QUYEN_LOI_TOI_DA_KY_TU = 120;    // mỗi dòng

const baoPin = (res, [status, code, error]) => res.status(status).json({ error, code });
const caiDat = (khoa, giaTri, now) => [`INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?)
  ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`, [khoa, giaTri, now]];

// GET /api/pos/tiers — danh sách hạng đang bật (theo thứ bậc) + gói + cấu hình làm tròn
router.get('/', authenticate, async (req, res) => {
  try {
    const tiers = await query('SELECT * FROM pos_membership_tiers WHERE is_active = 1 ORDER BY sort_order ASC, id ASC');
    const rows = await query("SELECT key, value FROM pos_settings WHERE key IN ('tier_round_to','tier_round_mode')");
    const s = {};
    rows.forEach((r) => (s[r.key] = r.value));
    let roundTo = parseInt(s.tier_round_to, 10);
    if (!ROUND_ALLOWED.includes(roundTo)) roundTo = 500;
    const roundMode = s.tier_round_mode === 'down' ? 'down' : 'nearest';
    res.json({ success: true, data: { tiers: tiers.map((t) => ({ ...t, goi: docGoi(t.goi) })), round_to: roundTo, round_mode: roundMode } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Quyền lợi gửi lên → chuỗi các dòng đã cắt khoảng trắng, bỏ dòng rỗng | null (không gửi → giữ chữ cũ) | { loi }. */
function kiemQuyenLoi(v, name) {
  if (v === undefined || v === null) return null;
  if (typeof v !== 'string') return { loi: `Hạng ${name}: quyền lợi phải là chữ` };
  const dong = v.split('\n').map((x) => x.trim()).filter(Boolean);
  if (dong.length > QUYEN_LOI_TOI_DA_DONG || dong.some((x) => x.length > QUYEN_LOI_TOI_DA_KY_TU)) {
    return { loi: `Hạng ${name}: quyền lợi tối đa ${QUYEN_LOI_TOI_DA_DONG} dòng, mỗi dòng ${QUYEN_LOI_TOI_DA_KY_TU} ký tự` };
  }
  return dong.join('\n');
}

/** Kiểm MỘT hạng gửi lên → { hang } đã chuẩn hoá hoặc { loi }. Hạng chi_cap luôn lưu gói rỗng. */
function kiemHang(t) {
  const name = String(t?.name ?? '').trim();
  const thuBac = Number(t?.sort_order);
  const pct = Number(t?.discount_percent);
  const specialPct = t?.special_discount_percent === undefined || t?.special_discount_percent === '' ? 0 : Number(t.special_discount_percent);
  const cachCo = t?.cach_co ?? 'ban';
  const id = t?.id === undefined || t?.id === null || t?.id === '' ? null : Number(t.id);
  if (!name) return { loi: 'Tên hạng không được trống' };
  if (id !== null && !Number.isInteger(id)) return { loi: `Hạng ${name}: mã hạng không hợp lệ` };
  if (!Number.isInteger(thuBac) || thuBac < 1) return { loi: `Hạng ${name}: thứ bậc phải là số nguyên từ 1` };
  if (!Number.isFinite(pct) || pct < 0 || pct > PHAN_TRAM_TOI_DA) return { loi: `Hạng ${name}: % giảm phải từ 0 đến ${PHAN_TRAM_TOI_DA}` };
  if (!Number.isFinite(specialPct) || specialPct < 0 || specialPct > PHAN_TRAM_TOI_DA) return { loi: `Hạng ${name}: % giảm nhóm đặc biệt phải từ 0 đến ${PHAN_TRAM_TOI_DA}` };
  if (!CACH_CO.includes(cachCo)) return { loi: `Hạng ${name}: cách có hạng phải là bán hoặc chỉ cấp` };
  const vao = t?.goi ?? [];
  if (!Array.isArray(vao)) return { loi: `Hạng ${name}: danh sách gói không hợp lệ` };
  const goi = [];
  for (const g of cachCo === 'ban' ? vao : []) {
    const soThang = Number(g?.so_thang);
    const gia = g?.gia === null || g?.gia === undefined || g?.gia === '' ? null : Number(g.gia);
    if (!Number.isInteger(soThang) || soThang < THANG_TOI_THIEU || soThang > THANG_TOI_DA) {
      return { loi: `Hạng ${name}: số tháng của gói phải là số nguyên từ ${THANG_TOI_THIEU} đến ${THANG_TOI_DA}` };
    }
    if (goi.some((x) => x.so_thang === soThang)) return { loi: `Hạng ${name}: hai gói cùng ${soThang} tháng` };
    if (gia !== null && !(Number.isInteger(gia) && gia > 0)) return { loi: `Hạng ${name}: giá gói ${soThang} tháng phải là số đồng nguyên lớn hơn 0 (hoặc để trống)` };
    goi.push({ so_thang: soThang, gia, bat: g?.bat !== false });
  }
  goi.sort((a, b) => a.so_thang - b.so_thang);
  const quyenLoi = kiemQuyenLoi(t?.quyen_loi, name);
  if (quyenLoi?.loi) return quyenLoi;
  return { hang: { id, name, sort_order: thuBac, discount_percent: pct, special_discount_percent: specialPct, cach_co: cachCo, goi, quyen_loi: quyenLoi } };
}

// PUT /api/pos/tiers — lưu các hạng (có id → sửa, không id → THÊM) + cấu hình làm tròn. Kiểm HẾT trước, ghi trong MỘT giao dịch.
router.put('/', authenticate, checkPermission('manage_promotions'), async (req, res) => {
  const sai = (error) => res.status(400).json({ error, code: 'HANG_KHONG_HOP_LE' });
  try {
    const { tiers, round_to, round_mode } = req.body || {};
    if (!Array.isArray(tiers)) return sai('Thiếu danh sách hạng');
    const ds = [];
    for (const t of tiers) {
      const k = kiemHang(t);
      if (k.loi) return sai(k.loi);
      ds.push(k.hang);
    }
    // Thứ bậc KHÔNG trùng giữa các hạng đang bật (gửi lên + hạng đang bật không gửi) — trùng thì "hạng cao nhất" mơ hồ.
    const conLai = (await query('SELECT id, sort_order FROM pos_membership_tiers WHERE is_active = 1'))
      .filter((h) => !ds.some((x) => x.id === Number(h.id)));
    const bac = [...ds.map((x) => x.sort_order), ...conLai.map((h) => Number(h.sort_order))];
    if (new Set(bac).size !== bac.length) return sai('Hai hạng không được cùng thứ bậc');
    const pin = await kiemPinChuQuan(req.body.pin);
    if (pin.loi) return baoPin(res, pin.loi);

    const now = getNow();
    const tx = await beginTransaction();
    try {
      for (const h of ds) {
        const goi = JSON.stringify(h.goi);
        if (h.id === null) {
          await tx.run(`INSERT INTO pos_membership_tiers (name, discount_percent, special_discount_percent, sort_order, is_active, cach_co, goi, quyen_loi, created_at, updated_at)
            VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`, [h.name, h.discount_percent, h.special_discount_percent, h.sort_order, h.cach_co, goi, h.quyen_loi ?? '', now, now]);
          continue;
        }
        // quyen_loi không gửi (máy quầy bản cũ đang mở) → COALESCE giữ chữ cũ
        const r = await tx.run(`UPDATE pos_membership_tiers SET name=?, discount_percent=?, special_discount_percent=?, sort_order=?, cach_co=?, goi=?,
          quyen_loi=COALESCE(?, quyen_loi), updated_at=? WHERE id=? AND is_active = 1`,
        [h.name, h.discount_percent, h.special_discount_percent, h.sort_order, h.cach_co, goi, h.quyen_loi, now, h.id]);
        if (r.changes !== 1) { await tx.rollback(); return sai(`Hạng ${h.name} không còn (đã xoá) — tải lại trang`); }
      }
      const rt = ROUND_ALLOWED.includes(parseInt(round_to, 10)) ? String(parseInt(round_to, 10)) : '500';
      await tx.run(...caiDat('tier_round_to', rt, now));
      await tx.run(...caiDat('tier_round_mode', round_mode === 'down' ? 'down' : 'nearest', now));
      await tx.commit();
    } catch (e) {
      await tx.rollback();
      throw e;
    }
    res.json({ success: true, message: 'Đã lưu hạng thành viên' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/pos/tiers/:id — xóa mềm 1 hạng (is_active=0). Còn khách giữ hạng này còn hạn → TỪ CHỐI 409 (hạng ẩn mà khách vẫn được giảm thì
// Cài đặt không còn thấy hạng đang có hiệu lực — kế hoạch HANG-1 mục 3).
router.delete('/:id', authenticate, checkPermission('manage_promotions'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID không hợp lệ' });
    const pin = await kiemPinChuQuan(req.body?.pin);
    if (pin.loi) return baoPin(res, pin.loi);
    const dangGiu = await soKhachGiuHang(query, getNow, id);
    if (dangGiu > 0) {
      return res.status(409).json({ error: `Còn ${dangGiu} khách đang giữ hạng này còn hạn — chưa xoá được`, code: 'HANG_CON_KHACH' });
    }
    await run('UPDATE pos_membership_tiers SET is_active=0, updated_at=? WHERE id=?', [getNow(), id]);
    res.json({ success: true, message: 'Đã xóa hạng' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
