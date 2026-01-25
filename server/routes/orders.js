/**
 * POS System - Order Routes
 * Quản lý đơn hàng bán lẻ
 * 
 * THIẾT KẾ: phone làm định danh chính
 * - Thanh toán số dư dùng pos_wallets (theo phone)
 * - Không dùng pos_customers.balance
 * 
 * TURSO MIGRATION: Tất cả database calls dùng await
 */

const express = require('express');
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { 
  generateOrderCode, 
  getNow, 
  normalizePhone
} = require('../utils/helpers');
const { checkStock, outStockFIFO, inStockReturn } = require('../utils/sxApi');

const router = express.Router();

/**
 * GET /api/pos/orders
 * Danh sách đơn hàng
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { date, from, to, customer_phone, status, page = 1, limit = 50 } = req.query;

    let sql = `
      SELECT o.*, 
        (SELECT COUNT(*) FROM pos_order_items WHERE order_id = o.id) as item_count
      FROM pos_orders o WHERE 1=1
    `;
    const params = [];

    if (date) {
      sql += ` AND DATE(o.created_at) = ?`;
      params.push(date);
    } else {
      if (from) { sql += ` AND DATE(o.created_at) >= ?`; params.push(from); }
      if (to) { sql += ` AND DATE(o.created_at) <= ?`; params.push(to); }
    }
    if (customer_phone) { 
      sql += ` AND o.customer_phone = ?`; 
      params.push(normalizePhone(customer_phone)); 
    }
    if (status) { sql += ` AND o.status = ?`; params.push(status); }

    sql += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (page - 1) * limit);

    const orders = await query(sql, params);
    const totalResult = await queryOne(`SELECT COUNT(*) as total FROM pos_orders`);
    const total = totalResult?.total || 0;

    const todayStats = await queryOne(`
      SELECT 
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as total_revenue,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
      FROM pos_orders 
      WHERE DATE(created_at) = DATE('now', 'localtime')
    `);

    res.json({ orders, total, todayStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/orders/:id
 * Chi tiết đơn hàng
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await queryOne('SELECT * FROM pos_orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    const items = await query('SELECT * FROM pos_order_items WHERE order_id = ?', [order.id]);
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/orders
 * Tạo đơn hàng mới
 * Hỗ trợ: Thanh toán linh hoạt (số dư + tiền mặt/CK + ghi nợ)
 * Phase B: Hỗ trợ chiết khấu linh hoạt + phí ship
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      customer_phone, customer_name, items, payment_method, 
      discount = 0, discount_reason, notes,
      is_new_customer = false,    // Flag để tạo registration cho khách mới
      // Các field mới cho thanh toán linh hoạt
      balance_amount = 0,      // Số tiền trừ từ số dư
      cash_amount = 0,         // Số tiền mặt
      transfer_amount = 0,     // Số tiền chuyển khoản
      debt_amount = 0,         // Số tiền ghi nợ
      due_date = null,         // Hạn thanh toán (nếu ghi nợ)
      payment_status = 'paid', // 'paid', 'partial', 'pending'
      // === Phase B: Chiết khấu + Shipping ===
      discount_type = null,    // 'percent' | 'fixed' | null (dùng discount cũ)
      discount_value = 0,      // Giá trị chiết khấu (% hoặc số tiền)
      discount_code = null,    // Mã chiết khấu (nếu có)
      shipping_fee = 0         // Phí vận chuyển
    } = req.body;

    // Validate
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Đơn hàng phải có ít nhất 1 sản phẩm' });
    }

    // Lấy thông tin sản phẩm và tính tổng
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      let product;
      if (item.sx_product_type && item.sx_product_id !== undefined) {
        product = await queryOne(
          'SELECT * FROM pos_products WHERE sx_product_type = ? AND sx_product_id = ? AND is_active = 1', 
          [item.sx_product_type, item.sx_product_id]
        );
      } else {
        product = await queryOne('SELECT * FROM pos_products WHERE id = ? AND is_active = 1', [item.product_id]);
      }

      if (!product) {
        return res.status(400).json({ error: 'Sản phẩm không tồn tại hoặc đã ngừng bán' });
      }
      if (product.price <= 0) {
        return res.status(400).json({ error: `Sản phẩm ${product.name} chưa có giá bán` });
      }

      // Kiểm tra tồn kho từ SX
      try {
        const stockCheck = await checkStock(product.sx_product_type, product.sx_product_id, item.quantity);
        if (!stockCheck.sufficient) {
          return res.status(400).json({ 
            error: `Không đủ hàng: ${product.name}. Tồn kho: ${stockCheck.stock}, cần: ${item.quantity}` 
          });
        }
      } catch (err) {
        console.error('Stock check error:', err.message);
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product_id: product.id,
        product_code: product.code,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: itemTotal,
        sx_product_type: product.sx_product_type,
        sx_product_id: product.sx_product_id
      });
    }

    // === Phase B: Tính chiết khấu ===
    let finalDiscountType = discount_type;
    let finalDiscountValue = discount_value;
    let finalDiscountAmount = 0;
    let finalDiscountCode = discount_code;
    let discountCodeId = null;

    // Ưu tiên 1: Mã chiết khấu
    if (discount_code) {
      const codeRecord = await queryOne(
        'SELECT * FROM pos_discount_codes WHERE UPPER(code) = UPPER(?) AND is_active = 1',
        [discount_code.trim()]
      );

      if (codeRecord) {
        // Kiểm tra hiệu lực
        const today = new Date().toISOString().slice(0, 10);
        let codeValid = true;
        
        if (codeRecord.valid_from && today < codeRecord.valid_from) codeValid = false;
        if (codeRecord.valid_to && today > codeRecord.valid_to) codeValid = false;
        if (codeRecord.usage_limit > 0 && codeRecord.used_count >= codeRecord.usage_limit) codeValid = false;
        if (codeRecord.min_order > 0 && subtotal < codeRecord.min_order) codeValid = false;

        if (codeValid) {
          finalDiscountType = codeRecord.discount_type;
          finalDiscountValue = codeRecord.discount_value;
          finalDiscountCode = codeRecord.code;
          discountCodeId = codeRecord.id;
        }
      }
    }

    // Ưu tiên 2: Chiết khấu từ request (discount_type + discount_value)
    // Đã có từ params

    // Ưu tiên 3: Chiết khấu cũ (discount số cố định) - backward compatible
    if (!finalDiscountType && discount > 0) {
      finalDiscountType = 'fixed';
      finalDiscountValue = discount;
    }

    // Tính số tiền chiết khấu
    if (finalDiscountType === 'percent' && finalDiscountValue > 0) {
      finalDiscountAmount = subtotal * finalDiscountValue / 100;
      // Giới hạn max_discount từ mã CK nếu có
      if (discountCodeId) {
        const codeRecord = await queryOne('SELECT max_discount FROM pos_discount_codes WHERE id = ?', [discountCodeId]);
        if (codeRecord?.max_discount > 0 && finalDiscountAmount > codeRecord.max_discount) {
          finalDiscountAmount = codeRecord.max_discount;
        }
      }
    } else if (finalDiscountType === 'fixed' && finalDiscountValue > 0) {
      finalDiscountAmount = finalDiscountValue;
    }

    // Đảm bảo chiết khấu không vượt subtotal
    finalDiscountAmount = Math.min(finalDiscountAmount, subtotal);

    // Tính total: subtotal - chiết khấu + phí ship
    const finalShippingFee = shipping_fee || 0;
    const total = Math.max(0, subtotal - finalDiscountAmount + finalShippingFee);

    // Normalize phone
    const phone = normalizePhone(customer_phone);

    // Xử lý thanh toán số dư từ pos_wallets
    let actualBalanceAmount = 0;
    let balanceBefore = 0;
    let balanceAfter = 0;

    // Tính toán số tiền thanh toán thực tế
    // Hỗ trợ cả payment_method cũ (backward compatible) và mới
    if (payment_method === 'balance' && phone) {
      // Cách cũ: thanh toán toàn bộ bằng số dư
      const wallet = await queryOne('SELECT * FROM pos_wallets WHERE phone = ?', [phone]);
      const currentBalance = wallet?.balance || 0;

      if (currentBalance < total) {
        return res.status(400).json({ 
          error: `Số dư không đủ. Hiện có: ${currentBalance.toLocaleString()}đ, cần: ${total.toLocaleString()}đ` 
        });
      }

      actualBalanceAmount = total;
      balanceBefore = currentBalance;
      balanceAfter = currentBalance - total;
    } else if (balance_amount > 0 && phone) {
      // Cách mới: thanh toán linh hoạt
      const wallet = await queryOne('SELECT * FROM pos_wallets WHERE phone = ?', [phone]);
      const currentBalance = wallet?.balance || 0;

      if (currentBalance < balance_amount) {
        return res.status(400).json({ 
          error: `Số dư không đủ. Hiện có: ${currentBalance.toLocaleString()}đ` 
        });
      }

      actualBalanceAmount = balance_amount;
      balanceBefore = currentBalance;
      balanceAfter = currentBalance - balance_amount;
    }

    // Xác định payment_status thực tế
    let finalPaymentStatus = payment_status;
    let finalDebtAmount = debt_amount;

    if (debt_amount > 0) {
      finalPaymentStatus = actualBalanceAmount > 0 ? 'partial' : 'pending';
      finalDebtAmount = debt_amount;
    } else {
      finalPaymentStatus = 'paid';
      finalDebtAmount = 0;
    }

    // Tạo đơn hàng
    const orderCode = generateOrderCode();
    const now = getNow();

    const result = await run(`
      INSERT INTO pos_orders (
        code, customer_phone, customer_name,
        subtotal, discount, discount_reason, total,
        discount_type, discount_value, discount_amount, discount_code, shipping_fee,
        payment_method, cash_amount, transfer_amount, balance_amount, debt_amount,
        payment_status, due_date,
        status, notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?)
    `, [
      orderCode,
      phone || null,
      customer_name || 'Khách lẻ',
      subtotal,
      finalDiscountAmount, // backward compatible: discount = discount_amount
      discount_reason || null,
      total,
      finalDiscountType || null,
      finalDiscountValue || 0,
      finalDiscountAmount,
      finalDiscountCode || null,
      finalShippingFee,
      payment_method === 'debt' ? 'debt' : payment_method,
      cash_amount || 0,
      transfer_amount || 0,
      actualBalanceAmount,
      finalDebtAmount,
      finalPaymentStatus,
      due_date || null,
      notes || null,
      req.user.username,
      now
    ]);

    const orderId = result.lastInsertRowid;

    // Thêm chi tiết đơn hàng
    for (const item of orderItems) {
      await run(`
        INSERT INTO pos_order_items (
          order_id, product_id, product_code, product_name,
          quantity, unit_price, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [orderId, item.product_id, item.product_code, item.product_name, item.quantity, item.unit_price, item.total_price]);

      // Trừ kho từ SX (FIFO)
      try {
        await outStockFIFO(item.sx_product_type, item.sx_product_id, item.quantity, `POS: ${orderCode}`);
      } catch (err) {
        console.error('Stock out error:', err.message);
      }
    }

    // Trừ số dư từ pos_wallets (nếu có dùng số dư)
    if (actualBalanceAmount > 0 && phone) {
      // Cập nhật wallet
      const walletExists = await queryOne('SELECT id FROM pos_wallets WHERE phone = ?', [phone]);
      if (walletExists) {
        await run(`UPDATE pos_wallets SET balance = ?, total_spent = total_spent + ?, updated_at = ? WHERE phone = ?`,
          [balanceAfter, actualBalanceAmount, now, phone]);
      }

      // Ghi log giao dịch
      await run(`
        INSERT INTO pos_balance_transactions (
          customer_phone, customer_name, type, amount, 
          balance_before, balance_after, order_id,
          notes, created_by, created_at
        ) VALUES (?, ?, 'purchase', ?, ?, ?, ?, ?, ?, ?)
      `, [phone, customer_name || null, -actualBalanceAmount, balanceBefore, balanceAfter, orderId, 'Thanh toán đơn hàng ' + orderCode, req.user.username, now]);
    }

    // === Phase B: Tăng used_count của mã chiết khấu ===
    if (discountCodeId) {
      await run('UPDATE pos_discount_codes SET used_count = used_count + 1, updated_at = ? WHERE id = ?', [now, discountCodeId]);
    }

    // === Tạo registration cho khách mới ===
    if (is_new_customer && phone && customer_name) {
      try {
        // Kiểm tra xem đã có registration chưa (có thể khách mua lần 2 trước khi sync)
        const existingReg = await queryOne(
          'SELECT id, notes FROM pos_registrations WHERE phone = ? AND status = ?',
          [phone, 'pending']
        );
        
        if (existingReg) {
          // Đã có registration pending -> cập nhật notes thêm order code
          const newNotes = existingReg.notes 
            ? `${existingReg.notes}, ${orderCode}`
            : `Từ POS - Đơn hàng: ${orderCode}`;
          await run(
            'UPDATE pos_registrations SET notes = ? WHERE id = ?',
            [newNotes, existingReg.id]
          );
        } else {
          // Tạo registration mới
          await run(`
            INSERT INTO pos_registrations (phone, name, notes, status, created_by, created_at)
            VALUES (?, ?, ?, 'pending', ?, ?)
          `, [phone, customer_name, `Từ POS - Đơn hàng: ${orderCode}`, req.user.username, now]);
        }
      } catch (regErr) {
        // Log error nhưng không fail order
        console.error('Registration creation error:', regErr);
      }
    }

    res.json({ 
      success: true, 
      order: { 
        id: orderId, 
        code: orderCode, 
        subtotal,
        discount_type: finalDiscountType,
        discount_value: finalDiscountValue,
        discount_amount: finalDiscountAmount,
        discount_code: finalDiscountCode,
        shipping_fee: finalShippingFee,
        total,
        items: orderItems.length,
        balance_after: balanceAfter,
        debt_amount: finalDebtAmount,
        payment_status: finalPaymentStatus,
        created_by: req.user.display_name || req.user.username,
        created_at: now
      } 
    });

  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/orders/:id/pay-debt
 * Xác nhận thanh toán nợ cho đơn hàng
 * - Cập nhật debt_amount, cash_amount/transfer_amount
 * - Cập nhật payment_status thành 'paid' nếu hết nợ
 */
router.post('/:id/pay-debt', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method, amount } = req.body;

    // Validate payment_method
    if (!payment_method || !['cash', 'transfer'].includes(payment_method)) {
      return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ (cash hoặc transfer)' });
    }

    // Kiểm tra đơn hàng
    const order = await queryOne('SELECT * FROM pos_orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Đơn hàng đã bị hủy' });
    }

    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'Đơn hàng đã được thanh toán đầy đủ' });
    }

    if (!order.debt_amount || order.debt_amount <= 0) {
      return res.status(400).json({ error: 'Đơn hàng không có nợ' });
    }

    const now = getNow();
    const paidAmount = amount || order.debt_amount;

    // Validate số tiền thanh toán
    if (paidAmount <= 0) {
      return res.status(400).json({ error: 'Số tiền thanh toán phải lớn hơn 0' });
    }

    if (paidAmount > order.debt_amount) {
      return res.status(400).json({ error: `Số tiền thanh toán không được vượt quá nợ (${order.debt_amount.toLocaleString()}đ)` });
    }

    // Tính toán số nợ còn lại
    const remainingDebt = order.debt_amount - paidAmount;
    const newPaymentStatus = remainingDebt <= 0 ? 'paid' : 'partial';

    // Cập nhật đơn hàng
    if (payment_method === 'cash') {
      await run(`
        UPDATE pos_orders SET 
          cash_amount = COALESCE(cash_amount, 0) + ?,
          debt_amount = ?,
          payment_status = ?
        WHERE id = ?
      `, [paidAmount, remainingDebt, newPaymentStatus, id]);
    } else {
      await run(`
        UPDATE pos_orders SET 
          transfer_amount = COALESCE(transfer_amount, 0) + ?,
          debt_amount = ?,
          payment_status = ?
        WHERE id = ?
      `, [paidAmount, remainingDebt, newPaymentStatus, id]);
    }

    // Log giao dịch thanh toán nợ
    if (order.customer_phone) {
      await run(`
        INSERT INTO pos_balance_transactions (
          customer_phone, customer_name, type, amount,
          balance_before, balance_after, order_id,
          notes, created_by, created_at
        ) VALUES (?, ?, 'debt_payment', ?, 0, 0, ?, ?, ?, ?)
      `, [
        order.customer_phone,
        order.customer_name,
        paidAmount,
        id,
        `Thanh toán nợ đơn ${order.code} bằng ${payment_method === 'cash' ? 'tiền mặt' : 'chuyển khoản'}`,
        req.user.username,
        now
      ]);
    }

    res.json({ 
      success: true, 
      message: 'Đã xác nhận thanh toán thành công',
      data: {
        order_id: id,
        order_code: order.code,
        paid_amount: paidAmount,
        payment_method: payment_method,
        remaining_debt: remainingDebt,
        payment_status: newPaymentStatus
      }
    });
  } catch (err) {
    console.error('Pay debt error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/pos/orders/:id/cancel
 * Hủy đơn hàng - hoàn tiền vào pos_wallets + hoàn kho SX
 */
router.put('/:id/cancel', authenticate, checkPermission('cancel_order'), async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await queryOne('SELECT * FROM pos_orders WHERE id = ?', [req.params.id]);

    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }
    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Đơn hàng đã được hủy trước đó' });
    }

    const now = getNow();

    // Hoàn lại số dư vào pos_wallets nếu đã thanh toán bằng balance
    if (order.balance_amount > 0 && order.customer_phone) {
      const phone = order.customer_phone;
      const wallet = await queryOne('SELECT * FROM pos_wallets WHERE phone = ?', [phone]);

      if (wallet) {
        const balanceBefore = wallet.balance;
        const balanceAfter = wallet.balance + order.balance_amount;

        await run('UPDATE pos_wallets SET balance = ?, total_spent = total_spent - ?, updated_at = ? WHERE phone = ?',
          [balanceAfter, order.balance_amount, now, phone]);

        await run(`
          INSERT INTO pos_balance_transactions (
            customer_phone, customer_name, type, amount,
            balance_before, balance_after, order_id,
            notes, created_by, created_at
          ) VALUES (?, ?, 'refund', ?, ?, ?, ?, ?, ?, ?)
        `, [phone, order.customer_name, order.balance_amount, balanceBefore, balanceAfter, order.id, 'Hoàn tiền hủy đơn ' + order.code, req.user.username, now]);
      }
    }

    // Hoàn kho SX
    const orderItems = await query(`
      SELECT oi.*, p.sx_product_type, p.sx_product_id 
      FROM pos_order_items oi
      LEFT JOIN pos_products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [order.id]);
    for (const item of orderItems) {
      if (item.sx_product_type && item.quantity > 0) {
        await inStockReturn(item.sx_product_type, item.sx_product_id, item.quantity, order.code);
      }
    }

    // Cập nhật trạng thái
    await run(`
      UPDATE pos_orders 
      SET status = 'cancelled', cancelled_reason = ?, cancelled_by = ?, cancelled_at = ?
      WHERE id = ?
    `, [reason || 'Không có lý do', req.user.username, now, order.id]);

    res.json({ success: true, message: 'Đã hủy đơn hàng' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/pos/orders/:id
 * Xóa hẳn đơn hàng (chỉ owner) - hoàn tiền + hoàn kho
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Kiểm tra quyền owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Chỉ owner mới có quyền xóa đơn hàng' });
    }

    const order = await queryOne('SELECT * FROM pos_orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    const now = getNow();

    // Hoàn lại số dư nếu đã trừ (và đơn chưa bị hủy trước đó)
    if (order.balance_amount > 0 && order.customer_phone && order.status !== 'cancelled') {
      const phone = order.customer_phone;
      const wallet = await queryOne('SELECT * FROM pos_wallets WHERE phone = ?', [phone]);

      if (wallet) {
        const balanceBefore = wallet.balance;
        const balanceAfter = wallet.balance + order.balance_amount;

        await run('UPDATE pos_wallets SET balance = ?, total_spent = total_spent - ?, updated_at = ? WHERE phone = ?',
          [balanceAfter, order.balance_amount, now, phone]);

        await run(`
          INSERT INTO pos_balance_transactions (
            customer_phone, customer_name, type, amount,
            balance_before, balance_after, order_id,
            notes, created_by, created_at
          ) VALUES (?, ?, 'refund', ?, ?, ?, ?, ?, ?, ?)
        `, [phone, order.customer_name, order.balance_amount, balanceBefore, balanceAfter, order.id, 'Hoàn tiền xóa đơn ' + order.code, req.user.username, now]);
      }
    }

    // Hoàn kho SX (nếu đơn chưa bị hủy)
    if (order.status !== 'cancelled') {
      const orderItems = await query(`
        SELECT oi.*, p.sx_product_type, p.sx_product_id 
        FROM pos_order_items oi
        LEFT JOIN pos_products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
      for (const item of orderItems) {
        if (item.sx_product_type && item.quantity > 0) {
          await inStockReturn(item.sx_product_type, item.sx_product_id, item.quantity, order.code);
        }
      }
    }

    // Xóa order items trước
    await run('DELETE FROM pos_order_items WHERE order_id = ?', [order.id]);
    
    // Xóa order
    await run('DELETE FROM pos_orders WHERE id = ?', [order.id]);

    res.json({ success: true, message: 'Đã xóa đơn hàng' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
