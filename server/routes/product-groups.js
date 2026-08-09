/**
 * POS System - Product Groups Routes (Bước 1 của "Ưu đãi khách mới")
 *
 * Cơ chế nhóm sản phẩm DÙNG CHUNG — tách hoàn toàn khỏi is_special_group của TIER-2.
 * Hiện chỉ có đúng 1 nhóm cần dùng: code = 'khach_moi' (seed sẵn trong database.js).
 * Chưa dựng UI tạo/xoá nhóm tuỳ ý vì mới có 1 nhu cầu thật — khi có nhu cầu thứ 2
 * mới đáng mở rộng route này thành CRUD nhóm đầy đủ.
 *
 * INERT: route này chỉ đọc/ghi 2 bảng mới (pos_product_groups, pos_product_group_members).
 * Không đọc, không ghi vào pos_products, pos_orders, hay bất kỳ luồng tính tiền nào.
 */

const express = require('express');
const { query, queryOne, run, beginTransaction } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');

const router = express.Router();

// GET /api/pos/product-groups/:code/members
// Trả về nhóm + danh sách sản phẩm hiện đang thuộc nhóm (chỉ khoá định danh, không kèm tên/giá —
// client tự ghép với danh sách sản phẩm đã có sẵn từ /api/pos/products).
router.get('/:code/members', authenticate, async (req, res) => {
  try {
    const group = await queryOne('SELECT id, code, name FROM pos_product_groups WHERE code = ?', [req.params.code]);
    if (!group) {
      return res.status(404).json({ success: false, error: `Không tìm thấy nhóm sản phẩm "${req.params.code}"` });
    }
    const members = await query(
      'SELECT sx_product_type, sx_product_id FROM pos_product_group_members WHERE group_id = ?',
      [group.id]
    );
    res.json({ success: true, data: { group, members } });
  } catch (err) {
    console.error('Lỗi lấy thành viên nhóm sản phẩm:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/pos/product-groups/:code/members
// Body: { members: [{ sx_product_type, sx_product_id }, ...] }
// Thay thế TOÀN BỘ danh sách thành viên nhóm bằng danh sách gửi lên (xoá hết, chèn lại) —
// khớp đúng kiểu UI "tick chọn rồi Lưu" đang dùng ở Settings, không cần diff từng dòng.
router.put('/:code/members', authenticate, checkPermission('manage_settings'), async (req, res) => {
  const { members } = req.body;
  if (!Array.isArray(members)) {
    return res.status(400).json({ success: false, error: 'members phải là mảng' });
  }
  // Validate từng phần tử trước khi đụng DB — tránh ghi nửa chừng rồi mới phát hiện sai định dạng
  for (const m of members) {
    if (!m || typeof m.sx_product_type !== 'string' || !m.sx_product_type.trim() ||
        !Number.isInteger(m.sx_product_id)) {
      return res.status(400).json({
        success: false,
        error: 'Mỗi thành viên cần sx_product_type (chuỗi) và sx_product_id (số nguyên)',
      });
    }
  }

  const tx = await beginTransaction();
  try {
    const group = await tx.queryOne('SELECT id FROM pos_product_groups WHERE code = ?', [req.params.code]);
    if (!group) {
      await tx.rollback();
      return res.status(404).json({ success: false, error: `Không tìm thấy nhóm sản phẩm "${req.params.code}"` });
    }

    await tx.run('DELETE FROM pos_product_group_members WHERE group_id = ?', [group.id]);

    // Loại trùng lặp trong payload gửi lên (vd client lỡ gửi 2 lần cùng 1 sản phẩm) —
    // tránh vi phạm UNIQUE(group_id, sx_product_type, sx_product_id) giữa chừng transaction.
    const seen = new Set();
    for (const m of members) {
      const key = `${m.sx_product_type}::${m.sx_product_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      await tx.run(
        'INSERT INTO pos_product_group_members (group_id, sx_product_type, sx_product_id) VALUES (?, ?, ?)',
        [group.id, m.sx_product_type, m.sx_product_id]
      );
    }

    await tx.commit();
    res.json({ success: true, data: { count: seen.size } });
  } catch (err) {
    await tx.rollback();
    console.error('Lỗi lưu thành viên nhóm sản phẩm:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
