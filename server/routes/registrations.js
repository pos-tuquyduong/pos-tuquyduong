/**
 * POS System - Registrations Routes
 * Quản lý đăng ký subscription mới + Export logs + Revert
 * 
 * TURSO MIGRATION: Tất cả database calls dùng await
 */

const express = require('express');
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { getNow, getToday, normalizePhone } = require('../utils/helpers');
const { RELATIONSHIP_VALUES } = require('../constants/relationships');
const { taoKhach } = require('../utils/khachMoi');   // KHACH-APP-1
const { loiGhi, trongGiaoDich } = require('./wallets');

const router = express.Router();

// KHACH-APP-1 Q6b (chủ quán 07.11) — xoá đăng ký CHỜ xoá luôn khách CHỈ KHI: người xoá từ quản lý trở lên, dòng khách do chính đăng ký đó
// tạo (cùng người nhập, tạo từ lúc đăng ký trở đi — khách App / khách có từ trước KHÔNG xoá) và khách "trắng": ví 0 và không có dòng nào ở
// các bảng dưới (chủ quán: đơn, điểm, gói, giao dịch ví; thêm cho chắc: thẻ hạng, voucher, hoàn tiền, phiên thanh toán, đơn App, mã đăng
// nhập App, người nhận gắn SĐT). Điều kiện nằm TRONG câu xoá (không kiểm-rồi-xoá).
const VAI_XOA_KHACH = ['owner', 'manager'];
const DAU_VET_KHACH = [
  ['pos_orders', 'customer_phone'],
  ['pos_balance_transactions', 'customer_phone'],
  ['pos_point_transactions', 'customer_phone'],
  ['pos_customer_packages', 'customer_phone'],
  ['pos_membership_purchases', 'customer_phone'],
  ['pos_voucher_grants', 'customer_phone'],
  ['pos_refund_requests', 'customer_phone'],
  ['pos_phien_thanh_toan', 'phone'],
  ['pos_don_app', 'phone'],
  ['pos_kh_ma_dang_nhap', 'sdt'],
  ['pos_customers', 'parent_phone'],
];
const CAU_XOA_KHACH_TRANG = `DELETE FROM pos_customers WHERE phone = ? AND created_by = ? AND created_at >= ?
  AND NOT EXISTS (SELECT 1 FROM pos_wallets WHERE phone = ? AND (COALESCE(balance, 0) <> 0 OR COALESCE(total_topup, 0) <> 0 OR COALESCE(total_spent, 0) <> 0))
  ${DAU_VET_KHACH.map(([bang, cot]) => `AND NOT EXISTS (SELECT 1 FROM ${bang} WHERE ${cot} = ?)`).join('\n  ')}`;
const LY_DO_XOA_MAC_DINH = 'Xoá đăng ký chờ nhập nhầm — khách chưa có giao dịch nào';

// ══════════════════════════════════════════════════════
// ROUTES CỤ THỂ - ĐẶT TRƯỚC /:id
// ══════════════════════════════════════════════════════

/**
 * GET /api/pos/registrations/stats/summary
 */
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const stats = await queryOne(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'exported' THEN 1 ELSE 0 END) as exported
      FROM pos_registrations
    `);
    res.json({ stats: stats || { total: 0, pending: 0, exported: 0 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/registrations/export/csv
 * Chỉ tải CSV, KHÔNG đánh dấu exported
 */
router.get('/export/csv', authenticate, checkPermission('export_data'), async (req, res) => {
  try {
    const registrations = await query(`SELECT * FROM pos_registrations WHERE status = 'pending' ORDER BY created_at`);

    if (registrations.length === 0) {
      return res.status(400).json({ error: 'Không có đăng ký mới để export' });
    }

    // Tạo CSV content
    const headers = ['Tên KH', 'SĐT', 'Ghi chú', 'SĐT Khách chính', 'Quan hệ', 'Sản phẩm', 'Số CT', 'Nhóm', 'Ngày BĐ', 'Trạng thái'];
    const rows = registrations.map(r => [
      r.name || '',
      r.phone || '',
      r.notes || '',
      r.parent_phone || '',
      r.relationship || '',
      r.requested_product || '',
      r.requested_cycles || '',
      '',
      '',
      'Chờ xếp nhóm'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell + '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const fileName = `dang-ky-moi_${getToday()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send('\uFEFF' + csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/registrations/confirm-export
 * Xác nhận export thành công - đánh dấu exported + ghi log
 */
router.post('/confirm-export', authenticate, checkPermission('export_data'), async (req, res) => {
  try {
    // Lấy danh sách pending
    const pending = await query("SELECT id, phone, name FROM pos_registrations WHERE status = 'pending'");

    if (pending.length === 0) {
      return res.status(400).json({ error: 'Không có đăng ký nào để đánh dấu' });
    }

    const ids = pending.map(r => r.id);
    const now = getNow();
    const fileName = `dang-ky-moi_${getToday()}.csv`;

    // Đánh dấu exported
    const placeholders = ids.map(() => '?').join(',');
    await run(`UPDATE pos_registrations SET status = 'exported', exported_at = ?, exported_by = ? WHERE id IN (${placeholders})`,
      [now, req.user.username, ...ids]);

    // Ghi log
    await run(`INSERT INTO pos_export_logs (exported_at, exported_by, registration_ids, customer_count, file_name, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [now, req.user.username, JSON.stringify(ids), ids.length, fileName, now]);

    res.json({ 
      success: true, 
      count: ids.length,
      message: `Đã đánh dấu ${ids.length} khách exported`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/registrations/revert/:id
 * Hoàn tác 1 đăng ký từ exported về pending
 */
router.post('/revert/:id', authenticate, checkPermission('export_data'), async (req, res) => {
  try {
    const reg = await queryOne('SELECT * FROM pos_registrations WHERE id = ?', [req.params.id]);

    if (!reg) {
      return res.status(404).json({ error: 'Không tìm thấy' });
    }

    if (reg.status !== 'exported') {
      return res.status(400).json({ error: 'Chỉ có thể hoàn tác đăng ký đã exported' });
    }

    await run(`UPDATE pos_registrations SET status = 'pending', exported_at = NULL, exported_by = NULL WHERE id = ?`,
      [req.params.id]);

    res.json({ success: true, message: 'Đã hoàn tác về trạng thái chờ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/registrations/revert-last
 * Hoàn tác lần export gần nhất
 */
router.post('/revert-last', authenticate, checkPermission('export_data'), async (req, res) => {
  try {
    // Lấy log gần nhất
    const lastLog = await queryOne('SELECT * FROM pos_export_logs ORDER BY id DESC LIMIT 1');

    if (!lastLog) {
      return res.status(400).json({ error: 'Không có lịch sử export' });
    }

    const ids = JSON.parse(lastLog.registration_ids);

    // Hoàn tác các đăng ký
    const placeholders = ids.map(() => '?').join(',');
    await run(`UPDATE pos_registrations SET status = 'pending', exported_at = NULL, exported_by = NULL WHERE id IN (${placeholders}) AND status = 'exported'`,
      ids);

    // Xóa log
    await run('DELETE FROM pos_export_logs WHERE id = ?', [lastLog.id]);

    res.json({ 
      success: true, 
      count: ids.length,
      message: `Đã hoàn tác ${ids.length} khách từ lần export lúc ${lastLog.exported_at}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/registrations/export-logs
 * Lịch sử export
 */
router.get('/export-logs', authenticate, async (req, res) => {
  try {
    const logs = await query('SELECT * FROM pos_export_logs ORDER BY id DESC LIMIT 20');
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════
// ROUTES CHUNG
// ══════════════════════════════════════════════════════

/**
 * GET /api/pos/registrations
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;
    let sql = 'SELECT * FROM pos_registrations WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const registrations = await query(sql, params);
    const stats = await queryOne(`SELECT COUNT(*) as total, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending, SUM(CASE WHEN status = 'exported' THEN 1 ELSE 0 END) as exported FROM pos_registrations`);

    res.json({ registrations, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/registrations
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { phone, name, notes, parent_phone, relationship, requested_product, requested_cycles } = req.body;

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'SĐT không hợp lệ' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên không được để trống' });
    }

    const validRelationship = RELATIONSHIP_VALUES.includes(relationship) ? relationship : null;
    const normalizedParentPhone = parent_phone ? normalizePhone(parent_phone) : null;
    const soChu = requested_cycles ? parseInt(requested_cycles) : null;

    // KHACH-APP-1 (Q1 chủ quán 07.11): "Thêm khách" ghi đăng ký chờ + tạo khách THẬT bằng hàm chung — MỘT giao dịch. Đăng ký ghi TRƯỚC
    // (khách tạo từ giờ đăng ký trở đi — điều kiện "khách do đăng ký này tạo" của DELETE). Trùng đăng ký chặn trong câu ghi (không 500 khi đua).
    const kq = await trongGiaoDich(async (tx) => {
      const r = await tx.run(`
        INSERT INTO pos_registrations (phone, name, notes, parent_phone, relationship, requested_product, requested_cycles, status, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?) ON CONFLICT(phone) DO NOTHING`,
        [normalizedPhone, name.trim(), notes || null, normalizedParentPhone, validRelationship, requested_product || null, soChu, req.user.username, getNow()]
      );
      if (r.changes !== 1) return { huy: true, daDangKy: true };
      const t = await taoKhach({ phone: normalizedPhone, name, notes, parent_phone: normalizedParentPhone, relationship: validRelationship,
        requested_product, requested_cycles: soChu, created_by: req.user.username }, tx);
      if (t.loi || t.trung) return { huy: true, ...t };
      return { id: r.lastInsertRowid };
    });
    if (kq.daDangKy) return res.status(400).json({ error: 'SĐT đã được đăng ký', code: 'SDT_DA_DANG_KY' });
    if (kq.loi) return res.status(400).json({ error: kq.loi === 'TEN_TRONG' ? 'Tên không được để trống' : 'SĐT không hợp lệ', code: kq.loi });
    // Q7 (chủ quán 07.11): GIỮ CHẶN — khách đã có tài khoản thì tìm ở màn Bán hàng và bán gói như bán món; không lưu gì
    if (kq.trung) return res.status(409).json({ error: 'Khách đã có tài khoản — tìm khách ở màn Bán hàng để bán gói', code: 'KHACH_DA_CO_TAI_KHOAN' });

    const newReg = await queryOne('SELECT * FROM pos_registrations WHERE id = ?', [kq.id]);
    res.json({ success: true, registration: newReg });
  } catch (err) {
    loiGhi(res, err);
  }
});

// ══════════════════════════════════════════════════════
// ROUTES CÓ PARAMETER - ĐẶT SAU CÙNG
// ══════════════════════════════════════════════════════

/**
 * GET /api/pos/registrations/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const registration = await queryOne('SELECT * FROM pos_registrations WHERE id = ?', [req.params.id]);
    if (!registration) {
      return res.status(404).json({ error: 'Không tìm thấy' });
    }
    res.json(registration);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/pos/registrations/:id
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, notes, parent_phone, relationship, requested_product, requested_cycles } = req.body;
    const existing = await queryOne('SELECT * FROM pos_registrations WHERE id = ?', [req.params.id]);

    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy' });
    }
    if (existing.status === 'exported') {
      return res.status(400).json({ error: 'Không thể sửa đăng ký đã export' });
    }

    const validRelationship = RELATIONSHIP_VALUES.includes(relationship) ? relationship : null;
    const ten = name?.trim() || existing.name, ghiChu = notes ?? existing.notes, sdtMe = parent_phone ? normalizePhone(parent_phone) : null;

    // KHACH-APP-1 Q6a (chủ quán 07.11): sửa đăng ký chờ sửa luôn tên / ghi chú / SĐT mẹ / quan hệ của dòng khách cùng SĐT — MỘT giao dịch
    const kq = await trongGiaoDich(async (tx) => {
      const r = await tx.run(`UPDATE pos_registrations SET name = ?, notes = ?, parent_phone = ?, relationship = ?, requested_product = ?, requested_cycles = ?
        WHERE id = ? AND status IS NOT 'exported'`,
        [ten, ghiChu, sdtMe, validRelationship, requested_product || existing.requested_product, requested_cycles ? parseInt(requested_cycles) : existing.requested_cycles, existing.id]
      );
      if (r.changes !== 1) return { huy: true };
      await tx.run('UPDATE pos_customers SET name = ?, notes = ?, parent_phone = ?, relationship = ?, updated_at = ? WHERE phone = ?',
        [ten, ghiChu, sdtMe, validRelationship, getNow(), existing.phone]);
      return {};
    });
    if (kq.huy) return res.status(400).json({ error: 'Không thể sửa đăng ký đã export' });

    const updated = await queryOne('SELECT * FROM pos_registrations WHERE id = ?', [req.params.id]);
    res.json({ success: true, registration: updated });
  } catch (err) {
    loiGhi(res, err);
  }
});

/**
 * DELETE /api/pos/registrations/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const lyDo = (typeof req.body?.ly_do === 'string' && req.body.ly_do.trim()) || LY_DO_XOA_MAC_DINH;
    // KHACH-APP-1 Q6b: xoá đăng ký; xoá khách cùng SĐT chỉ khi đủ điều kiện (CAU_XOA_KHACH_TRANG) — MỘT giao dịch, có nhật ký
    const kq = await trongGiaoDich(async (tx) => {
      const dk = await tx.queryOne('SELECT * FROM pos_registrations WHERE id = ?', [req.params.id]);
      if (!dk) return { huy: true, khong: true };
      await tx.run('DELETE FROM pos_registrations WHERE id = ?', [dk.id]);
      if (dk.status !== 'pending' || !dk.created_by || !VAI_XOA_KHACH.includes(req.user.role)) return { xoaKhach: false };
      const kh = await tx.queryOne('SELECT * FROM pos_customers WHERE phone = ?', [dk.phone]);
      if (!kh) return { xoaKhach: false };
      const x = await tx.run(CAU_XOA_KHACH_TRANG, [dk.phone, dk.created_by, dk.created_at, dk.phone, ...DAU_VET_KHACH.map(() => dk.phone)]);
      if (x.changes !== 1) return { xoaKhach: false };
      await tx.run(`INSERT INTO pos_sync_logs (type, record_count, details, status, created_by, created_at) VALUES ('xoa_khach', 1, ?, 'success', ?, ?)`,
        [JSON.stringify({ phone: kh.phone, name: kh.name, ly_do: lyDo, registration_id: dk.id, khach: kh }), req.user.username, getNow()]);
      return { xoaKhach: true };
    });
    if (kq.khong) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json({ success: true, xoa_khach: kq.xoaKhach,
      message: kq.xoaKhach ? 'Đã xoá đăng ký và khách (khách chưa có giao dịch)' : 'Đã xoá đăng ký — khách giữ nguyên' });
  } catch (err) {
    loiGhi(res, err);
  }
});

module.exports = router;
