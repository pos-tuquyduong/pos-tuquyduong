// =====================================================
// SỬA FILE: pos-system/server/routes/products.js
// 
// VẤN ĐỀ: Giá bị link nhầm vì id trùng (juice id=1, tea id=1)
// GIẢI PHÁP: Dùng composite key: sx_product_type + sx_product_id
// =====================================================

const express = require('express');
const { query, queryOne, run } = require('../database');
const { authenticate, authenticateServiceOrUser, checkPermission } = require('../middleware/auth');
const { isSxConfigured, callSxApi } = require('../utils/sxApi');

const router = express.Router();

/**
 * GET /api/pos/products
 * Lấy danh sách sản phẩm từ SX với giá từ POS
 */
// POS-1: endpoint này cho phép CẢ người dùng (JWT) LẪN worker web (X-Service-Key, chỉ đọc).
router.get('/', authenticateServiceOrUser, async (req, res) => {
  try {
    const { category } = req.query;
    let products = [];

    // Gọi API từ SX
    if (isSxConfigured()) {
      try {
        products = await callSxApi('/api/pos/products-with-stock');

        // POS-TONCU-v1: goi duoc SX thi NHO LAI so ton va gio biet.
        // Lan sau SX chet, POS con cai that de tra ve thay vi bia 999.
        // Chi nho mon CO QUAN KHO va ton la so that (nhom "pha khi khach
        // goi" tra null — nho null vao la bien no thanh "chua ro ton").
        // Loi o day KHONG duoc lam hong man ban hang: chi ghi log.
        try {
          // ton_luc la GIO VIET NAM (de hien "luc 14:03" cho nguoi nhin).
          // Cac cot khac cua POS dung datetime('now') = gio UTC — DUNG so sanh
          // truc tiep ton_luc voi created_at, lech 7 tieng.
          const nowVn = new Date(Date.now() + 7 * 3600 * 1000)
            .toISOString().slice(0, 19).replace('T', ' ');

          // Chi GHI KHI TON THAY DOI. Man ban hang tai lai danh sach rat nhieu
          // lan moi ca; ghi mu quang la 10 luot ghi Turso moi lan tai, phan lon
          // la ghi lai dung con so cu. Doc 1 luot roi so re hon nhieu.
          const daNho = await query(
            'SELECT sx_product_type, sx_product_id, ton_gan_nhat FROM pos_products',
          );
          for (const p of products) {
            if (p.khong_quan_kho) continue;
            if (typeof p.stock_quantity !== 'number') continue;
            const cu = daNho.find(
              (x) => x.sx_product_type === p.sx_product_type &&
                     String(x.sx_product_id) === String(p.sx_product_id),
            );
            if (cu && cu.ton_gan_nhat === p.stock_quantity) continue;
            await run(
              `UPDATE pos_products SET ton_gan_nhat = ?, ton_luc = ?
                WHERE sx_product_type = ? AND sx_product_id = ?`,
              [p.stock_quantity, nowVn, p.sx_product_type, p.sx_product_id],
            );
          }
        } catch (e) {
          console.error('Khong ghi duoc ton gan nhat:', e.message);
        }

        if (category) {
          products = products.filter(p => p.category === category);
        }

        console.log(`✅ Loaded ${products.length} products from SX`);

      } catch (err) {
        console.error('❌ Error loading from SX:', err.message);
        products = await getFallbackProducts(category);
      }
    } else {
      products = await getFallbackProducts(category);
    }

    // Merge giá + TIER-2 (SP đặc biệt) từ POS database - SỬA: dùng composite key
    const prices = await query('SELECT sx_product_type, sx_product_id, price, is_special_group FROM pos_products');

    products = products.map(p => {
      // TÌM GIÁ BẰNG COMPOSITE KEY (type + id)
      const priceInfo = prices.find(pr => 
        pr.sx_product_type === p.sx_product_type && 
        String(pr.sx_product_id) === String(p.sx_product_id)
      );

      return {
        ...p,
        // Tạo unique_id để frontend phân biệt
        unique_id: `${p.sx_product_type}_${p.sx_product_id}`,
        // POS-TONCU-v1: thieu gia thi tra null, KHONG tra 0.
        // Dung ?? chu khong || — gia 0 that (hang tang) la hop le.
        // Man ban hang da chan them vao gio khi gia khong hop le; co sellable
        // de App KH sau nay khong phai tu doan.
        price: priceInfo?.price ?? null,
        sellable: typeof priceInfo?.price === 'number' && priceInfo.price > 0,
        is_special_group: !!priceInfo?.is_special_group,
        unit: p.category === 'tea' ? 'gói' : 'túi',
        is_active: 1
      };
    });

    res.json(products);
  } catch (err) {
    console.error('Error in GET /products:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Fallback khi không kết nối được SX
 */
async function getFallbackProducts(category) {
  console.log('⚠️  Using fallback products');

  let products = await query(
    `SELECT * FROM pos_products WHERE is_active = 1${category ? ' AND category = ?' : ''} ORDER BY sort_order, name`,
    category ? [category] : []
  );

  // POS-TONCU-v1: TUYET DOI khong tra 999. Tra so that cuoi cung biet duoc
  // kem gio biet; chua tung biet thi tra null. So gia nguy hiem hon khong co so:
  // 999 trong nhu binh thuong nen khong ai kiem tra (su co 25.08 keo 1 tieng).
  return products.map(p => ({
    ...p,
    unique_id: `${p.sx_product_type}_${p.sx_product_id}`,
    stock_quantity: typeof p.ton_gan_nhat === 'number' ? p.ton_gan_nhat : null,
    ton_cu: true,
    ton_luc: p.ton_luc || null,
    stock_status: typeof p.ton_gan_nhat === 'number' ? 'ton_cu' : 'chua_ro'
  }));
}

/**
 * PUT /api/pos/products/price
 * Cập nhật giá bán - SỬA: dùng composite key
 */
router.put('/price', authenticate, checkPermission('manage_settings'), async (req, res) => {
  try {
    const { sx_product_type, sx_product_id, price } = req.body;

    if (!sx_product_type || sx_product_id === undefined || price === undefined || price < 0) {
      return res.status(400).json({ error: 'Thiếu thông tin hoặc giá không hợp lệ' });
    }

    // Kiểm tra sản phẩm đã tồn tại chưa
    const existing = await queryOne(
      'SELECT id FROM pos_products WHERE sx_product_type = ? AND sx_product_id = ?',
      [sx_product_type, sx_product_id]
    );

    if (existing) {
      // Update
      await run(
        'UPDATE pos_products SET price = ?, updated_at = datetime("now") WHERE sx_product_type = ? AND sx_product_id = ?',
        [price, sx_product_type, sx_product_id]
      );
    } else {
      // Insert mới
      await run(
        `INSERT INTO pos_products (code, name, category, sx_product_type, sx_product_id, price, unit, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime("now"), datetime("now"))`,
        [
          `${sx_product_type === 'tea' ? 'TEA' : 'CT'}${sx_product_id}`,
          'Từ SX',
          sx_product_type === 'tea' ? 'tea' : 'juice',
          sx_product_type,
          sx_product_id,
          price,
          sx_product_type === 'tea' ? 'gói' : 'túi'
        ]
      );
    }

    res.json({ success: true, price, sx_product_type, sx_product_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/pos/products/batch/prices
 * Cập nhật giá hàng loạt
 */
router.put('/batch/prices', authenticate, checkPermission('manage_settings'), async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Invalid products data' });
    }

    let updated = 0;
    for (const p of products) {
      if (p.sx_product_type && p.sx_product_id !== undefined && p.price !== undefined) {
        const existing = await queryOne(
          'SELECT id FROM pos_products WHERE sx_product_type = ? AND sx_product_id = ?',
          [p.sx_product_type, p.sx_product_id]
        );

        if (existing) {
          await run(
            'UPDATE pos_products SET price = ?, is_special_group = ?, updated_at = datetime("now") WHERE sx_product_type = ? AND sx_product_id = ?',
            [p.price, p.is_special_group ? 1 : 0, p.sx_product_type, p.sx_product_id]
          );
        } else {
          await run(
            `INSERT INTO pos_products (code, name, category, sx_product_type, sx_product_id, price, unit, is_active, is_special_group)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
            [
              p.code || `${p.sx_product_type === 'tea' ? 'TEA' : 'CT'}${p.sx_product_id}`,
              p.name || 'Từ SX',
              p.sx_product_type === 'tea' ? 'tea' : 'juice',
              p.sx_product_type,
              p.sx_product_id,
              p.price,
              p.sx_product_type === 'tea' ? 'gói' : 'túi',
              p.is_special_group ? 1 : 0
            ]
          );
        }
        updated++;
      }
    }

    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/products/sync-from-sx
 * Đồng bộ danh sách sản phẩm từ SX
 */
router.post('/sync-from-sx', authenticate, checkPermission('manage_settings'), async (req, res) => {
  try {
    if (!isSxConfigured()) {
      return res.status(400).json({ error: 'Chưa cấu hình kết nối SX' });
    }

    const sxProducts = await callSxApi('/api/pos/products-with-stock');
    let synced = 0;

    for (const p of sxProducts) {
      const existing = await queryOne(
        'SELECT id, price FROM pos_products WHERE sx_product_type = ? AND sx_product_id = ?',
        [p.sx_product_type, p.sx_product_id]
      );

      if (existing) {
        // Update tên, giữ nguyên giá
        await run(
          'UPDATE pos_products SET code = ?, name = ?, updated_at = datetime("now") WHERE id = ?',
          [p.code, p.name, existing.id]
        );
      } else {
        // Insert mới với giá = 0
        await run(
          `INSERT INTO pos_products (code, name, category, sx_product_type, sx_product_id, price, unit, is_active)
           VALUES (?, ?, ?, ?, ?, 0, ?, 1)`,
          [p.code, p.name, p.category, p.sx_product_type, p.sx_product_id, p.category === 'tea' ? 'gói' : 'túi']
        );
      }
      synced++;
    }

    res.json({ success: true, synced, message: `Đã đồng bộ ${synced} sản phẩm từ SX` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
