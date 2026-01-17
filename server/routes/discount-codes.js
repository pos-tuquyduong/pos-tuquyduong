/**
 * POS System - Discount Codes Routes
 * CRUD mã chiết khấu
 */

const express = require('express');
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { getNow } = require('../utils/helpers');

const router = express.Router();

/**
 * GET /api/pos/discount-codes
 * Lấy danh sách mã chiết khấu
 */
router.get('/', authenticate, (req, res) => {
  try {
    const { active_only } = req.query;

    let sql = `SELECT * FROM pos_discount_codes`;
    const params = [];

    if (active_only === 'true') {
      sql += ` WHERE is_active = 1`;
    }

    sql += ` ORDER BY created_at DESC`;

    const codes = query(sql, params);

    res.json(codes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/discount-codes/:id
 * Lấy chi tiết mã chiết khấu
 */
router.get('/:id', authenticate, (req, res) => {
  try {
    const code = queryOne('SELECT * FROM pos_discount_codes WHERE id = ?', [req.params.id]);
    
    if (!code) {
      return res.status(404).json({ error: 'Không tìm thấy mã chiết khấu' });
    }

    res.json(code);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/discount-codes/validate
 * Kiểm tra mã chiết khấu có hợp lệ không
 */
router.post('/validate', authenticate, (req, res) => {
  try {
    const { code, order_subtotal } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Vui lòng nhập mã chiết khấu' });
    }

    const discountCode = queryOne(
      'SELECT * FROM pos_discount_codes WHERE UPPER(code) = UPPER(?) AND is_active = 1',
      [code.trim()]
    );

    if (!discountCode) {
      return res.status(400).json({ error: 'Mã chiết khấu không tồn tại hoặc đã hết hiệu lực' });
    }

    // Kiểm tra ngày hiệu lực
    const today = new Date().toISOString().slice(0, 10);
    
    if (discountCode.valid_from && today < discountCode.valid_from) {
      return res.status(400).json({ error: 'Mã chiết khấu chưa có hiệu lực' });
    }
    
    if (discountCode.valid_to && today > discountCode.valid_to) {
      return res.status(400).json({ error: 'Mã chiết khấu đã hết hạn' });
    }

    // Kiểm tra giới hạn sử dụng
    if (discountCode.usage_limit > 0 && discountCode.used_count >= discountCode.usage_limit) {
      return res.status(400).json({ error: 'Mã chiết khấu đã hết lượt sử dụng' });
    }

    // Kiểm tra đơn tối thiểu
    if (discountCode.min_order > 0 && order_subtotal < discountCode.min_order) {
      return res.status(400).json({ 
        error: `Đơn hàng tối thiểu ${discountCode.min_order.toLocaleString()}đ để áp dụng mã này` 
      });
    }

    // Tính số tiền chiết khấu
    let discount_amount = 0;
    
    if (discountCode.discount_type === 'percent') {
      discount_amount = order_subtotal * discountCode.discount_value / 100;
      
      // Áp dụng giới hạn giảm tối đa
      if (discountCode.max_discount > 0 && discount_amount > discountCode.max_discount) {
        discount_amount = discountCode.max_discount;
      }
    } else {
      // fixed
      discount_amount = discountCode.discount_value;
    }

    res.json({
      valid: true,
      code: discountCode.code,
      discount_type: discountCode.discount_type,
      discount_value: discountCode.discount_value,
      discount_amount: discount_amount,
      message: discountCode.discount_type === 'percent' 
        ? `Giảm ${discountCode.discount_value}%` 
        : `Giảm ${discountCode.discount_value.toLocaleString()}đ`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/discount-codes
 * Tạo mã chiết khấu mới
 */
router.post('/', authenticate, checkPermission('manage_promotions'), (req, res) => {
  try {
    const {
      code,
      discount_type,
      discount_value,
      min_order,
      max_discount,
      usage_limit,
      valid_from,
      valid_to,
      notes
    } = req.body;

    // Validate
    if (!code || code.trim().length === 0) {
      return res.status(400).json({ error: 'Vui lòng nhập mã chiết khấu' });
    }

    if (!discount_value || discount_value <= 0) {
      return res.status(400).json({ error: 'Giá trị chiết khấu phải lớn hơn 0' });
    }

    if (discount_type === 'percent' && discount_value > 100) {
      return res.status(400).json({ error: 'Phần trăm chiết khấu không được vượt quá 100%' });
    }

    // Kiểm tra mã đã tồn tại
    const existing = queryOne('SELECT id FROM pos_discount_codes WHERE UPPER(code) = UPPER(?)', [code.trim()]);
    if (existing) {
      return res.status(400).json({ error: 'Mã chiết khấu đã tồn tại' });
    }

    const result = run(`
      INSERT INTO pos_discount_codes (
        code, discount_type, discount_value, min_order, max_discount,
        usage_limit, valid_from, valid_to, notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code.trim().toUpperCase(),
      discount_type || 'percent',
      discount_value,
      min_order || 0,
      max_discount || 0,
      usage_limit || 0,
      valid_from || null,
      valid_to || null,
      notes || null,
      req.user.username,
      getNow()
    ]);

    res.json({
      success: true,
      id: result.lastInsertRowid,
      message: 'Đã tạo mã chiết khấu thành công'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/pos/discount-codes/:id
 * Cập nhật mã chiết khấu
 */
router.put('/:id', authenticate, checkPermission('manage_promotions'), (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      discount_type,
      discount_value,
      min_order,
      max_discount,
      usage_limit,
      valid_from,
      valid_to,
      is_active,
      notes
    } = req.body;

    // Kiểm tra tồn tại
    const existing = queryOne('SELECT * FROM pos_discount_codes WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy mã chiết khấu' });
    }

    // Kiểm tra mã trùng (nếu đổi mã)
    if (code && code.trim().toUpperCase() !== existing.code) {
      const duplicate = queryOne(
        'SELECT id FROM pos_discount_codes WHERE UPPER(code) = UPPER(?) AND id != ?', 
        [code.trim(), id]
      );
      if (duplicate) {
        return res.status(400).json({ error: 'Mã chiết khấu đã tồn tại' });
      }
    }

    run(`
      UPDATE pos_discount_codes SET
        code = ?,
        discount_type = ?,
        discount_value = ?,
        min_order = ?,
        max_discount = ?,
        usage_limit = ?,
        valid_from = ?,
        valid_to = ?,
        is_active = ?,
        notes = ?,
        updated_at = ?
      WHERE id = ?
    `, [
      code ? code.trim().toUpperCase() : existing.code,
      discount_type || existing.discount_type,
      discount_value !== undefined ? discount_value : existing.discount_value,
      min_order !== undefined ? min_order : existing.min_order,
      max_discount !== undefined ? max_discount : existing.max_discount,
      usage_limit !== undefined ? usage_limit : existing.usage_limit,
      valid_from !== undefined ? valid_from : existing.valid_from,
      valid_to !== undefined ? valid_to : existing.valid_to,
      is_active !== undefined ? is_active : existing.is_active,
      notes !== undefined ? notes : existing.notes,
      getNow(),
      id
    ]);

    res.json({
      success: true,
      message: 'Đã cập nhật mã chiết khấu'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/pos/discount-codes/:id
 * Xóa mã chiết khấu
 */
router.delete('/:id', authenticate, checkPermission('manage_promotions'), (req, res) => {
  try {
    const { id } = req.params;

    const existing = queryOne('SELECT * FROM pos_discount_codes WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy mã chiết khấu' });
    }

    // Kiểm tra đã sử dụng chưa
    if (existing.used_count > 0) {
      // Chỉ vô hiệu hóa, không xóa
      run('UPDATE pos_discount_codes SET is_active = 0, updated_at = ? WHERE id = ?', [getNow(), id]);
      return res.json({
        success: true,
        message: 'Mã đã được sử dụng, đã vô hiệu hóa thay vì xóa'
      });
    }

    run('DELETE FROM pos_discount_codes WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Đã xóa mã chiết khấu'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/discount-codes/:id/increment-usage
 * Tăng số lần sử dụng (gọi khi tạo đơn hàng thành công)
 */
router.post('/:id/increment-usage', authenticate, (req, res) => {
  try {
    const { id } = req.params;

    run('UPDATE pos_discount_codes SET used_count = used_count + 1, updated_at = ? WHERE id = ?', [getNow(), id]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
