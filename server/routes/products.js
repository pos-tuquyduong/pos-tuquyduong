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
const crypto = require('crypto');
const { GIOI_HAN_ANH, DO_DAI_PHIEN_BAN, CACHE_ANH, duongAnh, docAnhMon, loaiAnh } = require('../utils/anhMon');   // ANH-MON-1
const { TOPPING_TOI_DA_PHAN, docDs, laTopping, docGhiChuNhanh } = require('../utils/topping');   // TOPPING-1

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
// NHOM-MON-1: nhóm món = pos_nhom_mon (mã = category). cho: 'quay' | 'app' → chỉ món của nhóm bật công tắc đó; KHÔNG truyền = mọi món (Cài đặt, Kho,
// quang-cao.js cần thấy hết). Món chưa thuộc nhóm nào (category '' / mã lạ) coi như hiện cả hai chỗ — giữ hành vi cũ.
const THU_TU_CHUA_NHOM = 9999;
async function layMenuQuay(category, cho) {
  const ds = await query(
    `SELECT p.*, g.ten AS nhom_ten, g.thu_tu AS nhom_thu_tu, COALESCE(g.hien_quay, 1) AS nhom_hien_quay, COALESCE(g.hien_app, 1) AS nhom_hien_app
     FROM pos_products p LEFT JOIN pos_nhom_mon g ON g.ma = p.category
     WHERE p.is_active = 1${category ? ' AND p.category = ?' : ''} ORDER BY p.sort_order, p.name`,
    category ? [category] : []
  );
  const kho = await tonMenu({ query, queryOne }, getNow());
  const anhMon = await docAnhMon({ query });   // ANH-MON-1: đường dẫn ảnh (null nếu chưa có / kho ảnh hỏng)
  // TOPPING-1: topping của món = id trong topping_cho_mon CÒN là topping đang bán (bỏ cờ / ngừng bán → tự rơi khỏi danh sách).
  const dsTopping = new Set((await query('SELECT id FROM pos_products WHERE is_active = 1 AND la_topping = 1')).map((r) => Number(r.id)));
  return ds.filter((p) => !cho || Number(cho === 'app' ? p.nhom_hien_app : p.nhom_hien_quay) === 1).map((p) => {
    const k = kho.get(p.id) || { stock_quantity: null, khong_quan_kho: false, chua_cong_thuc: true };
    return {
      ...p,
      unique_id: `${p.sx_product_type}_${p.sx_product_id}`,
      anh: anhMon.get(p.id) ?? null,
      // POS-TONCU-v1: thiếu giá thì null, không 0 (?? giữ giá 0 thật). KHO-3a: món chưa công thức không bán được (quầy hiện mờ, App không thấy).
      price: p.price ?? null,
      sellable: typeof p.price === 'number' && p.price > 0 && !k.chua_cong_thuc,
      is_special_group: !!p.is_special_group,
      nhom_ten: p.nhom_ten ?? p.category ?? '',
      nhom_thu_tu: p.nhom_thu_tu ?? THU_TU_CHUA_NHOM,
      nhom_hien_quay: Number(p.nhom_hien_quay),
      nhom_hien_app: Number(p.nhom_hien_app),
      ...docThongTin(p), // KH-SP-1: thông tin ngắn của món
      stock_quantity: k.stock_quantity,
      khong_quan_kho: k.khong_quan_kho,
      chua_cong_thuc: k.chua_cong_thuc,
      ton_cu: false,
      ton_luc: null,
      unit: p.unit || 'túi',
      is_active: 1,
      la_topping: laTopping(p), gia_ban_rieng: p.gia_ban_rieng ?? null, ghi_chu_nhanh: laTopping(p) ? [] : docDs(p.ghi_chu_nhanh),   // topping không ghi chú (cùng App)
      topping: laTopping(p) ? [] : docDs(p.topping_cho_mon).map(Number).filter((id) => dsTopping.has(id)), topping_cho_mon: undefined,
      topping_toi_da_phan: TOPPING_TOI_DA_PHAN,
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
      if (!(await coNhom(tx, chuNgan(b.category, 'juice')))) return { huy: true, nhomSai: true };
      const luc = getNow();
      const ins = await tx.run(`INSERT INTO pos_products (code, name, category, price, unit, is_active, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [`MOI-${luc}-${Math.random().toString(36).slice(2, 8)}`, ten, chuNgan(b.category, 'juice'), gia,
        chuNgan(b.unit, 'ly'), b.is_active === 0 || b.is_active === '0' ? 0 : 1, Number.isInteger(Number(b.sort_order)) ? Number(b.sort_order) : 0, luc, luc]);
      const id = Number(ins.lastInsertRowid);
      await tx.run('UPDATE pos_products SET code = ?, sx_product_type = ?, sx_product_id = ? WHERE id = ?', [`POS${id}`, LOAI_MON_POS, id, id]);
      return { id };
    });
    if (kq.nhomSai) return loiMon(res, 'NHOM_KHONG_CO', 'Nhóm không có trong danh sách');
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
  if (Object.values(doi).some((v) => v == null)) return loiMon(res, 'YEU_CAU_KHONG_HOP_LE', 'Thông tin món không hợp lệ');
  // TOPPING-1 (B1–B3): cờ topping, giá bán riêng (trống = không bán riêng), ghi chú nhanh, danh sách topping của món — cùng quyền sửa món.
  if ('la_topping' in b) {
    if (![0, 1, true, false].includes(b.la_topping)) return loiMon(res, 'YEU_CAU_KHONG_HOP_LE', 'Cờ topping chỉ nhận 0 / 1');
    doi.la_topping = Number(b.la_topping);
  }
  if ('gia_ban_rieng' in b) {
    if (b.gia_ban_rieng !== null && b.gia_ban_rieng !== '' && !(Number.isInteger(b.gia_ban_rieng) && b.gia_ban_rieng > 0)) {
      return loiMon(res, 'GIA_KHONG_HOP_LE', 'Giá bán riêng là số nguyên đồng > 0, để trống = không bán riêng');
    }
    doi.gia_ban_rieng = b.gia_ban_rieng === '' ? null : b.gia_ban_rieng;
  }
  if ('ghi_chu_nhanh' in b) {
    const g = docGhiChuNhanh(b.ghi_chu_nhanh);
    if (!g) return loiMon(res, 'GHI_CHU_KHONG_HOP_LE', 'Ghi chú nhanh: tối đa 12 nút, mỗi nút 1–30 ký tự, không trùng');
    doi.ghi_chu_nhanh = JSON.stringify(g);
  }
  const dsTp = 'topping_cho_mon' in b ? b.topping_cho_mon : undefined;
  if (dsTp !== undefined && !(Array.isArray(dsTp) && dsTp.length <= 30 && dsTp.every((x) => Number.isInteger(x) && x > 0) && new Set(dsTp).size === dsTp.length)) {
    return loiMon(res, 'TOPPING_KHONG_HOP_LE', 'Danh sách topping không hợp lệ');
  }
  if (dsTp !== undefined) doi.topping_cho_mon = JSON.stringify(dsTp);
  if (!Object.keys(doi).length) return loiMon(res, 'YEU_CAU_KHONG_HOP_LE', 'Thông tin món không hợp lệ');
  try {
    // Vị từ tenTrung dùng ở tạo món (POST) và sửa ở đây: đổi tên, HOẶC hiện lại món đang ẩn (soát vòng 2). Món đang bán chỉ đổi thứ tự / nhóm thì
    // không xét (dữ liệu cũ có thể đã trùng — K5). Đọc + kiểm + ghi CÙNG giao dịch như POST. Các đường cũ /price, /batch/prices, /thong-tin và
    // kho/nhapSx.js CHƯA qua vị từ này (Phát hiện KHO-3a).
    const id = Number(req.params.id);
    const kq = await trongGiaoDich(async (tx) => {
      const cu = await tx.queryOne('SELECT name, is_active, category, la_topping, topping_cho_mon FROM pos_products WHERE id = ?', [id]);
      if (!cu) return { huy: true, khongThay: true };
      const hienLai = doi.is_active === 1 && Number(cu.is_active) !== 1;
      if ((doi.name || hienLai) && await tenTrung(tx, doi.name || cu.name, id)) return { huy: true, trung: true };
      if (doi.category !== undefined && doi.category !== cu.category && !(await coNhom(tx, doi.category))) return { huy: true, nhomSai: true };
      // TOPPING-1: topping không có topping; mọi id trong danh sách phải là topping đang bán (không trỏ chính nó).
      // Soát vòng 1 (K5): chỉ kiểm khi thân GỬI danh sách, hoặc đổi món thành topping — danh sách cũ có topping đã ẩn không chặn các lần sửa khác.
      const tpMoi = dsTp !== undefined ? dsTp : doi.la_topping === 1 ? docDs(cu.topping_cho_mon) : [];
      if (tpMoi.length && ((doi.la_topping ?? Number(cu.la_topping)) === 1 || tpMoi.includes(id)
        || Number((await tx.queryOne(`SELECT COUNT(*) AS n FROM pos_products WHERE is_active = 1 AND la_topping = 1 AND id IN (${tpMoi.map(() => '?').join(', ')})`, tpMoi)).n) !== tpMoi.length)) {
        return { huy: true, saiTopping: true };
      }
      await tx.run(`UPDATE pos_products SET ${Object.keys(doi).map((c) => c + ' = ?').join(', ')}, updated_at = ? WHERE id = ?`, [...Object.values(doi), getNow(), id]);
      return {};
    });
    if (kq.khongThay) return res.status(404).json({ error: 'Không thấy món', code: 'KHONG_THAY' });
    if (kq.nhomSai) return loiMon(res, 'NHOM_KHONG_CO', 'Nhóm không có trong danh sách');
    if (kq.trung) return loiMon(res, 'TEN_TRUNG', 'Đã có món đang bán cùng tên');
    if (kq.saiTopping) return loiMon(res, 'TOPPING_KHONG_HOP_LE', 'Chỉ tick được topping đang bán cho món thường (topping không có topping)');
    res.json({ success: true, product: monDaLuu(await queryOne('SELECT * FROM pos_products WHERE id = ?', [id])) });
  } catch (err) { loiGhi(res, err); }
});

/** TOPPING-1: dòng món trả về màn cài đặt — hai cột JSON đọc thành mảng. */
const monDaLuu = (p) => p && { ...p, ghi_chu_nhanh: p.ghi_chu_nhanh == null ? null : docDs(p.ghi_chu_nhanh), topping_cho_mon: docDs(p.topping_cho_mon).map(Number) };

/** POST /api/pos/products/:id/chep-nhom — TOPPING-1 B3: chép topping + ghi chú nhanh của món này cho mọi món thường đang bán CÙNG nhóm (một giao dịch). */
router.post('/:id/chep-nhom', (req, res, next) => (/^\d+$/.test(req.params.id) ? next() : next('route')), authenticate, checkPermission('manage_settings'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const kq = await trongGiaoDich(async (tx) => {
      const p = await tx.queryOne('SELECT * FROM pos_products WHERE id = ? AND is_active = 1', [id]);
      if (!p || laTopping(p)) return { huy: true };
      const r = await tx.run(`UPDATE pos_products SET topping_cho_mon = ?, ghi_chu_nhanh = ?, updated_at = ? WHERE category = ? AND is_active = 1 AND id <> ?
        AND COALESCE(la_topping, 0) = 0`, [p.topping_cho_mon ?? null, p.ghi_chu_nhanh ?? null, getNow(), p.category, id]);
      return { so_mon: r.changes };
    });
    if (kq.huy) return res.status(404).json({ error: 'Không thấy món (hoặc là topping)', code: 'KHONG_THAY' });
    res.json({ success: true, so_mon: kq.so_mon });
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

// ── NHOM-MON-1: nhóm món (pos_nhom_mon) — MỘT danh sách cho quầy, App KH, Kho. Mã nhóm = pos_products.category, KHÔNG đổi được; chỉ tên, thứ tự, hai công tắc. ──
// Nhóm gốc: đường chép món từ SX (/price, /batch/prices, /thong-tin ở trên) gán đúng hai mã này → không xoá được (vẫn đổi tên được).
const MA_NHOM_GOC = ['juice', 'tea'];
const tenNhom = (v) => (typeof v === 'string' && v.trim() && [...v.trim()].length <= 40 ? v.trim().replace(/\s+/g, ' ') : null);
const loiNhom = (res, status, code, error) => res.status(status).json({ error, code });
/** Nhóm có thật? (dùng chung cho POST / PUT món — đọc trong CÙNG giao dịch với câu ghi món). */
const coNhom = async (csdl, ma) => !!(await csdl.queryOne('SELECT 1 AS co FROM pos_nhom_mon WHERE ma = ?', [ma]));
const nhomTheoMa = (csdl, ma) => csdl.queryOne('SELECT * FROM pos_nhom_mon WHERE ma = ?', [ma]);
const tenNhomTrung = async (csdl, ten, boMa = '') => !!(await csdl.queryOne('SELECT 1 AS co FROM pos_nhom_mon WHERE ten = ? AND ma <> ?', [ten, boMa]));

// Danh sách đúng thứ tự — mọi người đăng nhập đọc được (quầy vẽ tab, Kho vẽ ô chọn).
router.get('/nhom', authenticate, async (req, res) => {
  try {
    res.json({ success: true, data: await query('SELECT ma, ten, thu_tu, hien_quay, hien_app FROM pos_nhom_mon ORDER BY thu_tu, id') });
  } catch (err) { loiGhi(res, err); }
});

// Xem trước "khách thấy trên App": CÙNG hàm menuApp với /api/kh/menu và đơn App (không phép lọc thứ hai) — chỉ thêm chữ ngắn gọn để vẽ.
router.get('/nhom/xem-truoc', authenticate, async (req, res) => {
  try {
    const ds = (await menuApp()).filter((p) => p.sellable);
    res.json({ success: true, data: ds.map((p) => ({ ma: p.unique_id, ten: p.name, nhom: p.category, nhom_ten: p.nhom_ten, nhom_thu_tu: p.nhom_thu_tu })) });
  } catch (err) { loiGhi(res, err); }
});

router.post('/nhom', authenticate, checkPermission('manage_settings'), async (req, res) => {
  const ten = tenNhom((req.body || {}).ten);
  if (!ten) return loiNhom(res, 400, 'TEN_KHONG_HOP_LE', 'Tên nhóm từ 1 tới 40 ký tự');
  try {
    const kq = await trongGiaoDich(async (tx) => {
      if (await tenNhomTrung(tx, ten)) return { huy: true, trung: true };
      const ma = `nm_${Math.random().toString(36).slice(2, 8)}`;
      const max = await tx.queryOne('SELECT COALESCE(MAX(thu_tu), 0) AS m FROM pos_nhom_mon');
      await tx.run('INSERT INTO pos_nhom_mon (ma, ten, thu_tu, tao_luc) VALUES (?, ?, ?, ?)', [ma, ten, Number(max.m) + 1, getNow()]);
      return { nhom: await nhomTheoMa(tx, ma) };
    });
    if (kq.trung) return loiNhom(res, 400, 'TEN_TRUNG', 'Đã có nhóm cùng tên');
    res.json({ success: true, nhom: kq.nhom });
  } catch (err) { loiGhi(res, err); }
});

// Sắp xếp: gửi CẢ danh sách mã theo thứ tự mới; thiếu / thừa / trùng mã → 400, không đổi gì. TRƯỚC `/nhom/:ma` (khác đường, tránh nhầm).
router.put('/nhom-thu-tu', authenticate, checkPermission('manage_settings'), async (req, res) => {
  const ma = (req.body || {}).ma;
  if (!Array.isArray(ma) || ma.some((m) => typeof m !== 'string')) return loiNhom(res, 400, 'YEU_CAU_KHONG_HOP_LE', 'Danh sách mã nhóm không hợp lệ');
  try {
    const kq = await trongGiaoDich(async (tx) => {
      const co = (await tx.query('SELECT ma FROM pos_nhom_mon')).map((r) => r.ma);
      if (new Set(ma).size !== ma.length || ma.length !== co.length || !ma.every((m) => co.includes(m))) return { huy: true, sai: true };
      for (let i = 0; i < ma.length; i++) await tx.run('UPDATE pos_nhom_mon SET thu_tu = ? WHERE ma = ?', [i + 1, ma[i]]);
      return {};
    });
    if (kq.sai) return loiNhom(res, 400, 'YEU_CAU_KHONG_HOP_LE', 'Danh sách mã nhóm phải đủ, không trùng');
    res.json({ success: true });
  } catch (err) { loiGhi(res, err); }
});

// Sửa tên / công tắc. Mã KHÔNG đổi (body có `ma` cũng bỏ qua).
router.put('/nhom/:ma', authenticate, checkPermission('manage_settings'), async (req, res) => {
  const b = req.body || {};
  const doi = {};
  if ('ten' in b) { if (!tenNhom(b.ten)) return loiNhom(res, 400, 'TEN_KHONG_HOP_LE', 'Tên nhóm từ 1 tới 40 ký tự'); doi.ten = tenNhom(b.ten); }
  for (const c of ['hien_quay', 'hien_app']) if (c in b) doi[c] = [0, 1, '0', '1'].includes(b[c]) ? Number(b[c]) : null;
  if (!Object.keys(doi).length || Object.values(doi).some((v) => v == null)) return loiNhom(res, 400, 'YEU_CAU_KHONG_HOP_LE', 'Thông tin nhóm không hợp lệ');
  try {
    const kq = await trongGiaoDich(async (tx) => {
      if (!(await nhomTheoMa(tx, req.params.ma))) return { huy: true, khongCo: true };
      if (doi.ten && await tenNhomTrung(tx, doi.ten, req.params.ma)) return { huy: true, trung: true };
      await tx.run(`UPDATE pos_nhom_mon SET ${Object.keys(doi).map((c) => c + ' = ?').join(', ')} WHERE ma = ?`, [...Object.values(doi), req.params.ma]);
      return { nhom: await nhomTheoMa(tx, req.params.ma) };
    });
    if (kq.khongCo) return loiNhom(res, 404, 'NHOM_KHONG_CO', 'Không thấy nhóm này');
    if (kq.trung) return loiNhom(res, 400, 'TEN_TRUNG', 'Đã có nhóm cùng tên');
    res.json({ success: true, nhom: kq.nhom });
  } catch (err) { loiGhi(res, err); }
});

// Xoá: chỉ nhóm không phải gốc và KHÔNG còn món nào (kể cả món đang ẩn). Điều kiện "không còn món" nằm ngay trong câu xoá — đua với việc gán món vào nhóm.
router.delete('/nhom/:ma', authenticate, checkPermission('manage_settings'), async (req, res) => {
  try {
    const ma = req.params.ma;
    if (!(await nhomTheoMa({ queryOne }, ma))) return loiNhom(res, 404, 'NHOM_KHONG_CO', 'Không thấy nhóm này');
    if (MA_NHOM_GOC.includes(ma)) return loiNhom(res, 409, 'NHOM_GOC', 'Nhóm gốc không xoá được — chỉ đổi tên hoặc tắt hiện');
    const r = await run('DELETE FROM pos_nhom_mon WHERE ma = ? AND NOT EXISTS (SELECT 1 FROM pos_products WHERE category = ?)', [ma, ma]);
    if (!r.changes) return loiNhom(res, 409, 'NHOM_CON_MON', 'Nhóm còn món — chuyển món sang nhóm khác trước');
    res.json({ success: true });
  } catch (err) { loiGhi(res, err); }
});

// KHO-3a C1: SX đã ngắt — danh sách món chỉ quản lý trong POS.
router.post('/sync-from-sx', authenticate, (req, res) => res.status(410).json({ error: 'Đã ngắt kết nối SX — thêm / sửa món ở Kho › Sản phẩm', code: 'SX_DA_NGAT' }));

// ── ANH-MON-1: ảnh nhỏ của món. Một ảnh / món trong CSDL; đọc công khai (đường dẫn mang phiên bản = băm nội dung → nhớ lâu an toàn). ──
// Bộ đọc thân thô đứng SAU xác thực + quyền (không quyền thì không đọc byte nào); quá GIOI_HAN_ANH → 413 ANH_QUA_LON (MỘT chỗ chặn).
const docThanAnh = express.raw({ type: () => true, limit: GIOI_HAN_ANH });
const nhanAnh = (req, res, next) => docThanAnh(req, res, (e) => {
  if (!e) return next();
  if (e.type === 'entity.too.large') return res.status(413).json({ error: 'Ảnh quá lớn (tối đa 120 KB) — chọn ảnh khác', code: 'ANH_QUA_LON' });
  res.status(400).json({ error: 'Không đọc được ảnh', code: 'ANH_KHONG_HOP_LE' });
});

/** PUT /api/pos/products/:id/anh — thân = byte ảnh (JPEG / PNG / WebP thật). Tải lại = thay. */
router.put('/:id/anh', authenticate, checkPermission('manage_settings'), nhanAnh, async (req, res) => {
  const id = Number(req.params.id);
  const kieu = Buffer.isBuffer(req.body) ? loaiAnh(req.body) : null;   // kiểu THẬT theo byte đầu, bỏ qua Content-Type khách khai
  if (!kieu) return res.status(400).json({ error: 'Ảnh phải là JPEG, PNG hoặc WebP thật', code: 'ANH_KHONG_HOP_LE' });
  try {
    if (!(await queryOne('SELECT 1 AS co FROM pos_products WHERE id = ?', [id]))) return res.status(404).json({ error: 'Không thấy món', code: 'KHONG_THAY' });
    const phienBan = crypto.createHash('sha256').update(req.body).digest('hex').slice(0, DO_DAI_PHIEN_BAN);
    await run(`INSERT INTO pos_anh_mon (product_id, kieu, du_lieu, co, phien_ban, sua_luc) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(product_id) DO UPDATE SET kieu = excluded.kieu, du_lieu = excluded.du_lieu, co = excluded.co, phien_ban = excluded.phien_ban, sua_luc = excluded.sua_luc`,
    [id, kieu, req.body.toString('base64'), req.body.length, phienBan, getNow()]);
    res.json({ success: true, anh: duongAnh(id, phienBan), co: req.body.length });
  } catch (err) { loiGhi(res, err); }
});

/** DELETE /api/pos/products/:id/anh — xoá ảnh (chưa có ảnh cũng 200: lặp lại được). */
router.delete('/:id/anh', authenticate, checkPermission('manage_settings'), async (req, res) => {
  try {
    await run('DELETE FROM pos_anh_mon WHERE product_id = ?', [Number(req.params.id)]);
    res.json({ success: true });
  } catch (err) { loiGhi(res, err); }
});

/** GET /api/pos/products/anh/:id/:phienBan — CÔNG KHAI (quầy, App KH, màn khách), không lộ gì ngoài byte ảnh. Phiên bản không khớp bản hiện tại → 404. */
router.get('/anh/:id/:phienBan', async (req, res) => {
  const { id, phienBan } = req.params;
  const khongCo = () => res.status(404).json({ error: 'Không có ảnh', code: 'ANH_KHONG_CO' });
  if (!/^\d+$/.test(id) || !/^[0-9a-f]+$/.test(phienBan)) return khongCo();
  try {
    const a = await queryOne('SELECT kieu, du_lieu FROM pos_anh_mon WHERE product_id = ? AND phien_ban = ?', [Number(id), phienBan]);
    if (!a) return khongCo();
    res.set({ 'Content-Type': a.kieu, 'Cache-Control': CACHE_ANH, 'X-Content-Type-Options': 'nosniff' }).send(Buffer.from(a.du_lieu, 'base64'));
  } catch (err) {
    console.error('GET /products/anh:', err.message);
    res.status(500).json({ error: 'Lỗi máy chủ, thử lại sau', code: 'LOI_MAY_CHU' });
  }
});

module.exports = router;
module.exports.layMenuQuay = layMenuQuay; // KH-API-1: /api/kh/menu
const menuApp = () => layMenuQuay(undefined, 'app');
module.exports.menuApp = menuApp;   // NHOM-MON-1: món App thấy / đặt được = nhóm bật "hiện trên App" — MỘT chỗ lọc cho /menu và đơn App
module.exports.menuQuay = () => layMenuQuay(undefined, 'quay'); // NHOM-MON-1: món quầy thấy (màn khách)
