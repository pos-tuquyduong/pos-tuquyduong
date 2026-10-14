/**
 * POS System - Packages Routes
 * CRUD gói template (với lock) + customer packages + per-item delivery tracking
 */
const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { dieuKienLayTuGoi, daLayTheoLoai, gomTheoKhach, LOC_KHACH } = require('../utils/goiKhach');
const { loiGhi, trongGiaoDich, ghiHoan } = require('./wallets');   // GOI-2: kết thúc gói có hoàn ghi ví qua cùng một hàm với huỷ đơn
const { soTienHoanGoi } = require('../utils/tienDaTra');

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

// GOI-1 (Q4): một dòng một gói — tên khách (bảng khách theo SĐT đã chuẩn hoá, dự phòng tên trên đơn mua gói), lần lấy gần nhất;
// GOI-2: mã đơn mua (`order_code`, bấm sang màn Đơn hàng). MỘT câu cho cả `/all` lẫn `/theo-khach`.
const SQL_GOI_KHACH = `SELECT cp.*, p.code as pkg_code, p.name as pkg_name, p.price as pkg_price,
         p.unit as pkg_unit, p.package_items as pkg_items, COALESCE(c.name, ob.customer_name) as customer_name, ob.code as order_code,
         (SELECT MAX(o.created_at) FROM pos_orders o JOIN pos_order_items oi ON oi.order_id = o.id
           WHERE ${dieuKienLayTuGoi('cp.id')}) as last_delivery_at
  FROM pos_customer_packages cp JOIN pos_packages p ON cp.package_id = p.id
  LEFT JOIN pos_customers c ON c.phone = cp.customer_phone LEFT JOIN pos_orders ob ON ob.id = cp.order_id`;
const SAP_GOI_KHACH = " ORDER BY cp.status = 'active' DESC, cp.created_at DESC";

// GET /customer-packages/all — Tất cả gói, một dòng một gói
router.get('/customer-packages/all', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const params = [];
    let sql = SQL_GOI_KHACH;
    if (status && status !== 'all') { sql += ' WHERE cp.status = ?'; params.push(status); }
    res.json({ success: true, data: await query(sql + SAP_GOI_KHACH, params) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /customer-packages/theo-khach — Báo cáo → Gói SP (GOI-2, Q1–Q3): MỖI KHÁCH MỘT DÒNG kèm danh sách gói; lọc `loc` (dang_dung
// mặc định · lau · xong), `goi` (từ Cài đặt → tên gói), `phone` (từ chi tiết khách). Tìm tên / SĐT làm ở màn.
router.get('/customer-packages/theo-khach', authenticate, async (req, res) => {
  try {
    // Q3: gói đang dùng mà đã lấy đủ → Đã xong (nắn dữ liệu cũ, điều kiện chặt, chạy lại vô hại; code mới không sinh ra lệch này nữa).
    await run("UPDATE pos_customer_packages SET status = 'completed', updated_at = ? WHERE status = 'active' AND delivered_qty >= total_qty",
      [new Date().toISOString()]);
    const { loc = 'dang_dung', goi, phone } = req.query;
    const locKhach = Object.hasOwn(LOC_KHACH, loc) ? LOC_KHACH[loc] : null;
    if (!locKhach) return res.status(400).json({ success: false, error: `Bộ lọc "${loc}" không có — dùng dang_dung, lau hoặc xong` });
    const dk = [], params = [];
    if (goi) { dk.push('cp.package_id = ?'); params.push(goi); }
    if (phone) { dk.push('cp.customer_phone = ?'); params.push(phone); }
    const ds = await query(SQL_GOI_KHACH + (dk.length ? ' WHERE ' + dk.join(' AND ') : '') + SAP_GOI_KHACH, params);
    res.json({ success: true, data: gomTheoKhach(ds).filter(locKhach) });
  } catch (err) { loiGhi(res, err); }   // có lệnh ghi (nắn Q3): kho bận → 409 KHO_BAN, không phải 500
});

// GET /customer-packages/:id/hoan-du-kien — số tiền sẽ hoàn nếu kết thúc gói bây giờ (hiện trong hộp xác nhận TRƯỚC khi bấm).
router.get('/customer-packages/:id/hoan-du-kien', authenticate, checkPermission('refund_package'), async (req, res) => {
  try {
    const cp = await queryOne('SELECT * FROM pos_customer_packages WHERE id = ?', [req.params.id]);
    if (!cp) return res.status(404).json({ success: false, error: 'Không tìm thấy gói KH' });
    const { don, loi, error, ...tien } = await soTienHoanGoi({ query, queryOne }, cp);
    if (loi) return res.status(400).json({ success: false, code: loi, error });
    res.json({ success: true, data: tien });
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

// PUT /customer-packages/:id/cancel — Kết thúc gói (GOI-1 Q5 "Dừng gói"; GOI-2 Q4 thêm `hoan`): chỉ quyền hoàn gói, bắt lý do, KHÔNG xoá —
// giữ lịch sử để đối soát. `hoan: true` → hoàn phần còn lại vào ví theo soTienHoanGoi, ghi ví bằng ghiHoan như huỷ đơn; không gửi / false →
// không hoàn (như GOI-1). Mọi thứ trong MỘT giao dịch; cổng `status = 'active' AND delivered_qty < total_qty` chặn gói đã xong, đã kết thúc
// và hai người cùng bấm (chỉ một lần hoàn). `so_tien` client gửi chỉ để ĐỐI CHIẾU với số máy chủ tính (lệch → 409, không ghi gì).
router.put('/customer-packages/:id/cancel', authenticate, checkPermission('refund_package'), async (req, res) => {
  try {
    const { id } = req.params;
    const lyDo = String(req.body.reason || '').trim();
    const hoan = req.body.hoan === true;
    if (!lyDo) return res.status(400).json({ success: false, code: 'GOI_THIEU_LY_DO', error: 'Phải nhập lý do kết thúc gói' });
    const now = new Date().toISOString();
    const kq = await trongGiaoDich(async (tx) => {
      const cp = await tx.queryOne('SELECT * FROM pos_customer_packages WHERE id = ?', [id]);
      if (!cp) return { huy: true, status: 404, body: { success: false, error: 'Không tìm thấy gói KH' } };
      let tien = { tong: 0 };
      if (hoan) {
        tien = await soTienHoanGoi(tx, cp);
        if (tien.loi) return { huy: true, status: 400, body: { success: false, code: tien.loi, error: tien.error } };
        if (req.body.so_tien !== undefined && Number(req.body.so_tien) !== tien.tong) {
          const { don, ...hoan_du_kien } = tien;
          return { huy: true, status: 409, body: { success: false, code: 'GOI_HOAN_DOI_SO', hoan_du_kien,
            error: `Số tiền hoàn đã đổi thành ${tien.tong.toLocaleString('vi-VN')}đ — xem lại rồi bấm lại` } };
        }
      }
      const ghi = `${cp.notes ? cp.notes + '\n' : ''}Kết thúc gói (${hoan ? 'hoàn ' + tien.tong + 'đ' : 'không hoàn'}): ${lyDo} — ${req.user.username} ${now} (đã lấy ${cp.delivered_qty}/${cp.total_qty})`;
      const doi = await tx.run(`UPDATE pos_customer_packages SET status = 'cancelled', notes = ?, updated_at = ?
        WHERE id = ? AND status = 'active' AND delivered_qty < total_qty`, [ghi, now, id]);
      if (doi.changes !== 1) return { huy: true, status: 400, body: { success: false, code: 'GOI_KHONG_DUNG_DUOC', error: 'Gói không còn đang dùng — không kết thúc được' } };
      if (hoan && tien.tong > 0) {
        await ghiHoan(tx, tien.don, { me: tien.me, tuVi: tien.vi, tienMat: tien.tien_mat }, { nguoi: req.user.username, luc: now,
          ghiChu: `Hoàn kết thúc gói KH #${cp.id} (đơn ${tien.don.code})`,
          ghiChuMe: `Hoàn tiền mẹ kết thúc gói KH #${cp.id} (đơn ${tien.don.code}, KH: ${tien.don.customer_name})` });
      }
      return { cp, hoan: tien.tong };
    });
    if (kq.huy) return res.status(kq.status).json(kq.body);
    res.json({ success: true, hoan: kq.hoan, message: `Đã kết thúc gói (đã lấy ${kq.cp.delivered_qty}/${kq.cp.total_qty})${hoan ? ` — hoàn ${kq.hoan.toLocaleString('vi-VN')}đ vào ví` : ''}` });
  } catch (err) { loiGhi(res, err); }
});

module.exports = router;
