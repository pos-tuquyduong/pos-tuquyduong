// =====================================================
// SỬA FILE: pos-system/server/routes/products.js
// 
// VẤN ĐỀ: Giá bị link nhầm vì id trùng (juice id=1, tea id=1)
// GIẢI PHÁP: Dùng composite key: sx_product_type + sx_product_id
// =====================================================

const express = require('express');
const { query, queryOne, run } = require('../database');
const { authenticate, authenticateServiceOrUser, checkPermission } = require('../middleware/auth');
const { getNow } = require('../utils/helpers');
const { COT_THONG_TIN, chuanThongTin, docThongTin } = require('../utils/thongTinMon');
const { trongGiaoDich, loiGhi } = require('./wallets');
const { tonMenu } = require('../kho/banHang');

const router = express.Router();
const LOAI_MON_POS = 'pos';   // KHO-3a A4: món tạo ở POS — khoá (LOAI_MON_POS, id) thay khoá SX, mọi chỗ khoá theo (sx_product_type, sx_product_id) chạy nguyên

/**
 * GET /api/pos/products
 * KHO-3a: danh sách món từ pos_products (POS chủ động hoàn toàn — không gọi SX), số trên menu từ kho POS.
 */
// POS-1: endpoint này cho phép CẢ người dùng (JWT) LẪN worker web (X-Service-Key, chỉ đọc).
router.get('/', authenticateServiceOrUser, xuLyMenu);
async function xuLyMenu(req, res) {
  try {
    res.json(await layMenuQuay(req.query.category));
  } catch (err) {
    console.error('Error in GET /products:', err);
    res.status(500).json({ error: err.message });
  }
}

// KH-API-1: danh sách món ĐÚNG như quầy thấy — /api/kh/menu, màn khách, đơn App gọi CÙNG hàm. KHO-3a: nguồn DUY NHẤT pos_products đang bán
// (thứ tự sort_order, giá POS); số từ kho POS (kho/banHang.js tonMenu — đã trừ phần đang giữ cho phiên chờ trả). Không bịa số: chưa công thức → null.
// ton_cu / ton_luc giữ trường (hợp đồng /api/kh) nhưng không còn "tồn gần nhất của SX": false / null. Cột ton_gan_nhat / ton_luc giữ trong CSDL.
async function layMenuQuay(category) {
  const ds = await query(
    `SELECT * FROM pos_products WHERE is_active = 1${category ? ' AND category = ?' : ''} ORDER BY sort_order, name`,
    category ? [category] : []
  );
  const kho = await tonMenu({ query, queryOne }, getNow());
  return ds.map((p) => {
    const k = kho.get(p.id) || { stock_quantity: null, khong_quan_kho: false, chua_cong_thuc: true };
    return {
      ...p,
      unique_id: `${p.sx_product_type}_${p.sx_product_id}`,
      // POS-TONCU-v1: thiếu giá thì null, không 0 (?? giữ giá 0 thật). KHO-3a: món chưa công thức không bán được (quầy hiện mờ, App không thấy).
      price: p.price ?? null,
      sellable: typeof p.price === 'number' && p.price > 0 && !k.chua_cong_thuc,
      is_special_group: !!p.is_special_group,
      ...docThongTin(p), // KH-SP-1: thông tin ngắn của món
      stock_quantity: k.stock_quantity,
      khong_quan_kho: k.khong_quan_kho,
      chua_cong_thuc: k.chua_cong_thuc,
      ton_cu: false,
      ton_luc: null,
      unit: p.unit || 'túi',
      is_active: 1,
    };
  });
}

// ── KHO-3a A4: quản lý món trong POS (tên, nhóm, đơn vị, thứ tự, ẩn / hiện). Giá: PUT /price. Kiểu, công thức: Kho › Sản phẩm (chủ quán). ──
const tenMon = (v) => (typeof v === 'string' && v.trim() && [...v.trim()].length <= 100 ? v.trim().replace(/\s+/g, ' ') : null);
const chuNgan = (v, macDinh) => (typeof v === 'string' && v.trim() && v.trim().length <= 30 ? v.trim() : macDinh);
const loiMon = (res, code, error) => res.status(400).json({ error, code });
/** MỘT vị từ "trùng tên món đang bán" cho tạo và sửa (boId: món đang sửa). */
const tenTrung = async (csdl, ten, boId = 0) => !!(await csdl.queryOne('SELECT 1 AS co FROM pos_products WHERE is_active = 1 AND name = ? AND id <> ?', [ten, boId]));

/** POST /api/pos/products — món MỚI, không cần khoá SX: khoá (LOAI_MON_POS, id), mã POS<id>, cùng giao dịch. */
router.post('/', authenticate, checkPermission('manage_settings'), async (req, res) => {
  const b = req.body || {};
  const ten = tenMon(b.name);
  if (!ten) return loiMon(res, 'TEN_KHONG_HOP_LE', 'Tên món từ 1 tới 100 ký tự');
  const gia = b.price == null || b.price === '' ? 0 : Number(b.price);
  if (!Number.isInteger(gia) || gia < 0) return loiMon(res, 'GIA_KHONG_HOP_LE', 'Giá là số nguyên đồng ≥ 0');
  try {
    const kq = await trongGiaoDich(async (tx) => {
      if (await tenTrung(tx, ten)) return { huy: true, trung: true };
      const luc = getNow();
      const ins = await tx.run(`INSERT INTO pos_products (code, name, category, price, unit, is_active, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [`MOI-${luc}-${Math.random().toString(36).slice(2, 8)}`, ten, chuNgan(b.category, 'juice'), gia,
        chuNgan(b.unit, 'ly'), b.is_active === 0 || b.is_active === '0' ? 0 : 1, Number.isInteger(Number(b.sort_order)) ? Number(b.sort_order) : 0, luc, luc]);
      const id = Number(ins.lastInsertRowid);
      await tx.run('UPDATE pos_products SET code = ?, sx_product_type = ?, sx_product_id = ? WHERE id = ?', [`POS${id}`, LOAI_MON_POS, id, id]);
      return { id };
    });
    if (kq.trung) return loiMon(res, 'TEN_TRUNG', 'Đã có món đang bán cùng tên');
    res.json({ success: true, product: await queryOne('SELECT * FROM pos_products WHERE id = ?', [kq.id]) });
  } catch (err) { loiGhi(res, err); }
});

/** PUT /api/pos/products/:id — sửa tên, nhóm, đơn vị, thứ tự, đang bán (ẩn / hiện). Không có đường xoá cứng (món đã có đơn giữ lịch sử). */
router.put('/:id', (req, res, next) => (/^\d+$/.test(req.params.id) ? next() : next('route')), authenticate, checkPermission('manage_settings'), async (req, res) => {
  const b = req.body || {};
  const doi = {};
  if ('name' in b) { if (!tenMon(b.name)) return loiMon(res, 'TEN_KHONG_HOP_LE', 'Tên món từ 1 tới 100 ký tự'); doi.name = tenMon(b.name); }
  if ('category' in b) doi.category = chuNgan(b.category, null);
  if ('unit' in b) doi.unit = chuNgan(b.unit, null);
  if ('sort_order' in b) doi.sort_order = Number.isInteger(Number(b.sort_order)) ? Number(b.sort_order) : null;
  if ('is_active' in b) doi.is_active = [0, 1].includes(Number(b.is_active)) ? Number(b.is_active) : null;
  if (!Object.keys(doi).length || Object.values(doi).some((v) => v == null)) return loiMon(res, 'YEU_CAU_KHONG_HOP_LE', 'Thông tin món không hợp lệ');
  try {
    // Vị từ tenTrung dùng ở tạo món (POST) và sửa ở đây: đổi tên, HOẶC hiện lại món đang ẩn (soát vòng 2). Món đang bán chỉ đổi thứ tự / nhóm thì
    // không xét (dữ liệu cũ có thể đã trùng — K5). Đọc + kiểm + ghi CÙNG giao dịch như POST. Các đường cũ /price, /batch/prices, /thong-tin và
    // kho/nhapSx.js CHƯA qua vị từ này (Phát hiện KHO-3a).
    const id = Number(req.params.id);
    const kq = await trongGiaoDich(async (tx) => {
      const cu = await tx.queryOne('SELECT name, is_active FROM pos_products WHERE id = ?', [id]);
      if (!cu) return { huy: true, khongThay: true };
      const hienLai = doi.is_active === 1 && Number(cu.is_active) !== 1;
      if ((doi.name || hienLai) && await tenTrung(tx, doi.name || cu.name, id)) return { huy: true, trung: true };
      await tx.run(`UPDATE pos_products SET ${Object.keys(doi).map((c) => c + ' = ?').join(', ')}, updated_at = ? WHERE id = ?`, [...Object.values(doi), getNow(), id]);
      return {};
    });
    if (kq.khongThay) return res.status(404).json({ error: 'Không thấy món', code: 'KHONG_THAY' });
    if (kq.trung) return loiMon(res, 'TEN_TRUNG', 'Đã có món đang bán cùng tên');
    res.json({ success: true, product: await queryOne('SELECT * FROM pos_products WHERE id = ?', [id]) });
  } catch (err) { loiGhi(res, err); }
});

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
        'UPDATE pos_products SET price = ?, updated_at = ? WHERE sx_product_type = ? AND sx_product_id = ?',
        [price, getNow(), sx_product_type, sx_product_id]
      );
    } else {
      // Insert mới
      await run(
        `INSERT INTO pos_products (code, name, category, sx_product_type, sx_product_id, price, unit, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          `${sx_product_type === 'tea' ? 'TEA' : 'CT'}${sx_product_id}`,
          'Từ SX',
          sx_product_type === 'tea' ? 'tea' : 'juice',
          sx_product_type,
          sx_product_id,
          price,
          sx_product_type === 'tea' ? 'gói' : 'túi',
          getNow(), getNow()
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
            'UPDATE pos_products SET price = ?, is_special_group = ?, updated_at = ? WHERE sx_product_type = ? AND sx_product_id = ?',
            [p.price, p.is_special_group ? 1 : 0, getNow(), p.sx_product_type, p.sx_product_id]
          );
        } else {
          await run(
            `INSERT INTO pos_products (code, name, category, sx_product_type, sx_product_id, price, unit, is_active, is_special_group, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
            [
              p.code || `${p.sx_product_type === 'tea' ? 'TEA' : 'CT'}${p.sx_product_id}`,
              p.name || 'Từ SX',
              p.sx_product_type === 'tea' ? 'tea' : 'juice',
              p.sx_product_type,
              p.sx_product_id,
              p.price,
              p.sx_product_type === 'tea' ? 'gói' : 'túi',
              p.is_special_group ? 1 : 0,
              getNow()
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

// Tên / mã món do giao diện gửi kèm (lấy từ SX) — chỉ dùng khi PHẢI tạo hàng mới, để hoá đơn không in "Từ SX".
const tenHopLe = (v) => (typeof v === 'string' && v.trim() && [...v.trim()].length <= 100 ? v.trim() : null);

const LOI_THONG_TIN = {
  MA_KHONG_HOP_LE: 'Nhu cầu hoặc thể chất có mã không hợp lệ',
  QUA_DAI: 'Mô tả, công dụng hoặc thành phần dài quá giới hạn',
  YEU_CAU_KHONG_HOP_LE: 'Thông tin món không hợp lệ',
};

/**
 * PUT /api/pos/products/thong-tin  (KH-SP-1)
 * Ghi thông tin ngắn của món: nhu_cau[], the_chat[], mo_ta, cong_dung, thanh_phan — trường nào có khoá thì ghi, rỗng = xoá.
 * Món chưa có hàng trong pos_products (chưa đặt giá) vẫn nhập được: tạo hàng giá 0 (chưa bán được, như đồng bộ SX), mang `name` / `code` gửi kèm.
 */
router.put('/thong-tin', authenticate, checkPermission('manage_settings'), async (req, res) => {
  try {
    const b = req.body || {};
    const { sx_product_type: loai, sx_product_id: ma } = b;
    if (!loai || typeof loai !== 'string' || ma === undefined || ma === null || ma === '') {
      return res.status(400).json({ error: 'Thiếu thông tin món', code: 'YEU_CAU_KHONG_HOP_LE' });
    }
    const kq = chuanThongTin(b);
    if (kq.loi) return res.status(400).json({ error: LOI_THONG_TIN[kq.loi], code: kq.loi });
    const cot = Object.keys(kq.doi);
    if (!cot.length) return res.status(400).json({ error: LOI_THONG_TIN.YEU_CAU_KHONG_HOP_LE, code: 'YEU_CAU_KHONG_HOP_LE' });

    const bayGio = getNow();
    const gia = [...cot.map((c) => kq.doi[c]), bayGio];
    const sua = await run(
      `UPDATE pos_products SET ${cot.map((c) => `${c} = ?`).join(', ')}, updated_at = ? WHERE sx_product_type = ? AND sx_product_id = ?`,
      [...gia, loai, ma],
    );
    if (!sua.changes) {
      await run(
        `INSERT INTO pos_products (code, name, category, sx_product_type, sx_product_id, price, unit, is_active, created_at, updated_at, ${cot.join(', ')})
         VALUES (?, ?, ?, ?, ?, 0, ?, 1, ?, ?, ${cot.map(() => '?').join(', ')})`,
        [tenHopLe(b.code) || `${loai === 'tea' ? 'TEA' : 'CT'}${ma}`, tenHopLe(b.name) || 'Từ SX', loai === 'tea' ? 'tea' : 'juice', loai, ma, loai === 'tea' ? 'gói' : 'túi',
          bayGio, bayGio, ...cot.map((c) => kq.doi[c])],
      );
    }
    const hang = await queryOne('SELECT * FROM pos_products WHERE sx_product_type = ? AND sx_product_id = ?', [loai, ma]);
    res.json({ success: true, sx_product_type: loai, sx_product_id: ma, ...docThongTin(hang) });
  } catch (err) {
    console.error('PUT /products/thong-tin:', err.message);
    res.status(500).json({ error: 'Lỗi máy chủ, thử lại sau', code: 'LOI_MAY_CHU' });
  }
});

// KHO-3a C1: SX đã ngắt — danh sách món chỉ quản lý trong POS.
router.post('/sync-from-sx', authenticate, (req, res) => res.status(410).json({ error: 'Đã ngắt kết nối SX — thêm / sửa món ở Kho › Sản phẩm', code: 'SX_DA_NGAT' }));

module.exports = router;
module.exports.layMenuQuay = layMenuQuay; // KH-API-1: /api/kh/menu
