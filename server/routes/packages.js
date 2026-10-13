/**
 * POS System - Packages Routes
 * CRUD gói template (với lock) + customer packages + per-item delivery tracking
 */
const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { dieuKienLayTuGoi, daLayTheoLoai } = require('../utils/goiKhach');

// Helper: đếm KH đang dùng gói
const countActiveUsers = async (packageId) => {
  const r = await queryOne('SELECT COUNT(*) as c FROM pos_customer_packages WHERE package_id = ? AND status = ?', [packageId, 'active']);
  return r?.c || 0;
};

// ═══ TEMPLATE CRUD (lock khi có KH đang dùng) ═══

// GET / — Danh sách template (kèm active_users count)
router.get('/', authenticate, async (req, res) => {
  try {
    const { active } = req.query;
    let sql = `SELECT p.*, 
      (SELECT COUNT(*) FROM pos_customer_packages cp WHERE cp.package_id = p.id AND cp.status = 'active') as active_users
      FROM pos_packages p`;
    if (active === '1' || active === undefined) sql += ' WHERE p.is_active = 1';
    else if (active === '0') sql += ' WHERE p.is_active = 0';
    sql += ' ORDER BY p.sort_order ASC, p.id ASC';
    res.json({ success: true, data: await query(sql) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// P26c (Câu hỏi 3, chủ quán chốt 12.10): gói phải có ít nhất 1 lượt — số lượt khi bán lấy theo gói đã cài (A6).
const LUOT_SAI = { success: false, code: 'GOI_LUOT_KHONG_HOP_LE', error: 'Tổng SL SP của gói phải là số nguyên từ 1 trở lên' };
const luotHopLe = (v) => Number.isInteger(Number(v)) && Number(v) >= 1;
// GOI-1 (Q2): không lưu gói giá 0đ. (Q1): gói có danh sách loại → tổng = cộng SL các loại, mỗi loại SL nguyên ≥ 1.
const GIA_SAI = { success: false, code: 'GOI_GIA_KHONG_HOP_LE', error: 'Giá bán của gói phải lớn hơn 0đ' };
const tongTheoLoai = (ds) => {
  if (!Array.isArray(ds) || !ds.length) return { tong: 0 };
  const sai = ds.find((i) => !luotHopLe(i.qty));
  if (sai) return { loi: { success: false, code: 'GOI_LOAI_SL_SAI', error: `SL của ${sai.code || 'một loại'} trong gói phải là số nguyên từ 1 trở lên` } };
  return { tong: ds.reduce((s, i) => s + Number(i.qty), 0) };
};

// POST / — Thêm template
router.post('/', authenticate, checkPermission('manage_users'), async (req, res) => {
  try {
    const { code, name, description, price, unit, package_items, is_active, sort_order } = req.body;
    let { total_qty } = req.body;
    if (!code || !name) return res.status(400).json({ success: false, error: 'Mã và tên gói bắt buộc' });
    if (!(Number(price) > 0)) return res.status(400).json(GIA_SAI);
    const loai = tongTheoLoai(package_items);
    if (loai.loi) return res.status(400).json(loai.loi);
    if (loai.tong) total_qty = loai.tong;
    if (!luotHopLe(total_qty)) return res.status(400).json(LUOT_SAI);
    const dup = await queryOne('SELECT id FROM pos_packages WHERE code = ?', [code.trim().toUpperCase()]);
    if (dup) return res.status(400).json({ success: false, error: `Mã "${code}" đã tồn tại` });
    const now = new Date().toISOString();
    const result = await run(
      `INSERT INTO pos_packages (code, name, description, price, unit, total_qty, package_items, is_active, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code.trim().toUpperCase(), name.trim(), description || '', price || 0, unit || 'túi',
       total_qty || 0, package_items ? JSON.stringify(package_items) : null,
       is_active !== undefined ? (is_active ? 1 : 0) : 1, sort_order || 0, now, now]
    );
    const pkg = await queryOne('SELECT * FROM pos_packages WHERE id = ?', [result.lastInsertRowid]);
    res.json({ success: true, data: pkg, message: 'Đã thêm gói' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /:id — Sửa template (🔒 LOCK khi có KH đang dùng)
router.put('/:id', authenticate, checkPermission('manage_users'), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryOne('SELECT * FROM pos_packages WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, error: 'Không tìm thấy gói' });

    const activeUsers = await countActiveUsers(id);
    const { code, name, description, price, unit, package_items, is_active, sort_order } = req.body;
    let { total_qty } = req.body;
    if (price !== undefined && !(Number(price) > 0)) return res.status(400).json(GIA_SAI);
    if (package_items !== undefined || total_qty !== undefined) {   // bật / tắt không gửi hai trường này → không tính lại
      let ds = package_items;
      if (ds === undefined) try { ds = JSON.parse(existing.package_items || '[]'); } catch { ds = []; }
      const loai = tongTheoLoai(ds);
      if (loai.loi) return res.status(400).json(loai.loi);
      if (loai.tong) total_qty = loai.tong;
    }
    // Chỉ xét khi có gửi số lượt — bật / tắt gói (togglePkg) không gửi, vẫn chạy như cũ.
    if (total_qty !== undefined && !luotHopLe(total_qty)) return res.status(400).json(LUOT_SAI);

    // 🔒 Lock: có KH đang dùng → chỉ cho toggle is_active/sort_order
    if (activeUsers > 0) {
      const isToggleOnly = is_active !== undefined && !code && !name && !description && price === undefined && !unit && total_qty === undefined && !package_items;
      if (!isToggleOnly) {
        return res.status(400).json({
          success: false, locked: true, active_users: activeUsers,
          error: `Không thể sửa — ${activeUsers} KH đang dùng gói này. Hãy tạo gói mới.`
        });
      }
    }

    if (code && code.trim().toUpperCase() !== existing.code) {
      const dup = await queryOne('SELECT id FROM pos_packages WHERE code = ? AND id != ?', [code.trim().toUpperCase(), id]);
      if (dup) return res.status(400).json({ success: false, error: `Mã "${code}" đã tồn tại` });
    }

    const itemsJson = package_items !== undefined ? JSON.stringify(package_items) : existing.package_items;
    await run(
      `UPDATE pos_packages SET code=?, name=?, description=?, price=?, unit=?, total_qty=?, package_items=?, is_active=?, sort_order=?, updated_at=? WHERE id=?`,
      [(code || existing.code).trim().toUpperCase(), (name || existing.name).trim(),
       description !== undefined ? description : existing.description,
       price !== undefined ? price : existing.price, unit || existing.unit,
       total_qty !== undefined ? total_qty : existing.total_qty, itemsJson,
       is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
       sort_order !== undefined ? sort_order : existing.sort_order, new Date().toISOString(), id]
    );
    const updated = await queryOne('SELECT * FROM pos_packages WHERE id = ?', [id]);
    res.json({ success: true, data: updated, message: 'Đã cập nhật gói' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /:id (🔒 LOCK)
router.delete('/:id', authenticate, checkPermission('manage_users'), async (req, res) => {
  try {
    const { id } = req.params;
    const activeUsers = await countActiveUsers(id);
    if (activeUsers > 0) {
      return res.status(400).json({ success: false, locked: true, active_users: activeUsers,
        error: `Không thể xóa — ${activeUsers} KH đang dùng gói này.` });
    }
    const everUsed = await queryOne('SELECT COUNT(*) as c FROM pos_customer_packages WHERE package_id = ?', [id]);
    if (everUsed?.c > 0) {
      await run('UPDATE pos_packages SET is_active = 0, updated_at = ? WHERE id = ?', [new Date().toISOString(), id]);
      return res.json({ success: true, message: 'Gói đã có lịch sử → chuyển ngừng bán' });
    }
    await run('DELETE FROM pos_packages WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã xóa gói' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ═══ CUSTOMER PACKAGES ═══

// GET /customer/:phone — Gói của 1 khách (kèm per-item delivered)
router.get('/customer/:phone', authenticate, async (req, res) => {
  try {
    const pkgs = await query(
      `SELECT cp.*, p.code as pkg_code, p.name as pkg_name, p.price as pkg_price,
              p.unit as pkg_unit, p.package_items as pkg_items, p.total_qty as pkg_total_qty
       FROM pos_customer_packages cp
       JOIN pos_packages p ON cp.package_id = p.id
       WHERE cp.customer_phone = ?
       ORDER BY cp.status = 'active' DESC, cp.created_at DESC`,
      [req.params.phone]
    );
    // Per-item delivered cho gói active
    for (const pkg of pkgs) {
      if (pkg.status === 'active') {
        pkg.delivered_items = await daLayTheoLoai({ query }, pkg.id);   // GOI-1: cùng cách đếm với máy chủ chặn theo loại
      }
    }
    res.json({ success: true, data: pkgs });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /customer-packages/all — Tất cả gói (Reports)
router.get('/customer-packages/all', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    // GOI-1 (Q4): tên khách (bảng khách theo SĐT đã chuẩn hoá, dự phòng tên trên đơn mua gói) + lần lấy gần nhất.
    let sql = `SELECT cp.*, p.code as pkg_code, p.name as pkg_name, p.price as pkg_price,
                      p.unit as pkg_unit, p.package_items as pkg_items, COALESCE(c.name, ob.customer_name) as customer_name,
                      (SELECT MAX(o.created_at) FROM pos_orders o JOIN pos_order_items oi ON oi.order_id = o.id
                        WHERE ${dieuKienLayTuGoi('cp.id')}) as last_delivery_at
               FROM pos_customer_packages cp JOIN pos_packages p ON cp.package_id = p.id
               LEFT JOIN pos_customers c ON c.phone = cp.customer_phone LEFT JOIN pos_orders ob ON ob.id = cp.order_id`;
    const params = [];
    if (status && status !== 'all') { sql += ' WHERE cp.status = ?'; params.push(status); }
    sql += " ORDER BY cp.status = 'active' DESC, cp.created_at DESC";
    res.json({ success: true, data: await query(sql, params) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /customer-packages/:id/deliveries — Lịch sử giao
router.get('/customer-packages/:id/deliveries', authenticate, async (req, res) => {
  try {
    const deliveries = await query(
      `SELECT o.id, o.code as order_code, o.created_at, o.created_by,
              GROUP_CONCAT(oi.product_name || ' ×' || oi.quantity, ', ') as items,
              SUM(oi.quantity) as total_qty
       FROM pos_orders o JOIN pos_order_items oi ON oi.order_id = o.id
       WHERE ${dieuKienLayTuGoi()}
       GROUP BY o.id ORDER BY o.created_at ASC`, [req.params.id]);
    res.json({ success: true, data: deliveries });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// P26b (D): BỎ POST /buy — không màn hình nào gọi, tạo gói KHÔNG thu tiền. Gói bán qua POST /orders (package_buy).

// P26c (A4): BỎ PUT /customer-packages/:id/deliver — không màn hình gọi, cộng lượt không trần, không tạo đơn. Lấy từ gói qua
// POST /orders (customer_package_id).

// PUT /customer-packages/:id/cancel — Dừng gói (GOI-1, Q5): chỉ quyền hoàn gói, bắt lý do, KHÔNG hoàn tiền, KHÔNG xoá — giữ
// lịch sử để đối soát. Hoàn tiền chỉ một đường: huỷ đơn mua gói (P26c Q4).
router.put('/customer-packages/:id/cancel', authenticate, checkPermission('refund_package'), async (req, res) => {
  try {
    const { id } = req.params;
    const lyDo = String(req.body.reason || '').trim();
    if (!lyDo) return res.status(400).json({ success: false, code: 'GOI_THIEU_LY_DO', error: 'Phải nhập lý do dừng gói' });
    const cp = await queryOne('SELECT * FROM pos_customer_packages WHERE id = ?', [id]);
    if (!cp) return res.status(404).json({ success: false, error: 'Không tìm thấy gói KH' });
    const now = new Date().toISOString();
    const ghi = `${cp.notes ? cp.notes + '\n' : ''}Dừng gói: ${lyDo} — ${req.user.username} ${now} (đã lấy ${cp.delivered_qty}/${cp.total_qty})`;
    // Một phép chặn cả gói đã xong, đã dừng lẫn hai người cùng bấm.
    const doi = await run("UPDATE pos_customer_packages SET status = 'cancelled', notes = ?, updated_at = ? WHERE id = ? AND status = 'active'",
      [ghi, now, id]);
    if (doi.changes !== 1) return res.status(400).json({ success: false, code: 'GOI_KHONG_DUNG_DUOC', error: 'Gói không còn đang giao — không dừng được' });
    res.json({ success: true, message: `Đã dừng gói (đã lấy ${cp.delivered_qty}/${cp.total_qty})` });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
