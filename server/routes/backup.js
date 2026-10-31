/**
 * POS System - Backup Routes (Excel)
 * Xuất/Nhập data qua Excel thay vì copy file DB
 * Tương thích Turso cloud database
 */

const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const multer = require('multer');
const { authenticate, checkPermission } = require('../middleware/auth');
const { query } = require('../database');
const { docTrang, lapKeHoach, thucHien } = require('../utils/khoiPhuc');
const { loiGhi } = require('./wallets');   // kho bận → 409 KHO_BAN, lỗi khác → 500 không lộ câu nội bộ
const { isSxConfigured, callSxApi } = require('../utils/sxApi');

const upload = multer({ storage: multer.memoryStorage() });

// Đọc bảng theo trang nhỏ để tránh phản hồi Turso quá lớn gây treo
// (một số bảng như pos_customers có cột base64 nặng: qr_code...).
const BACKUP_PAGE_SIZE = parseInt(process.env.BACKUP_PAGE_SIZE || '5', 10);

/**
 * Đọc TOÀN BỘ một bảng nhưng chia thành nhiều trang nhỏ,
 * ghép lại — tránh việc kéo cả bảng đầy đủ cột một phát làm nghẽn kết nối.
 */
async function readTablePaged(tableName, orderKey) {
  const all = [];
  let offset = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const page = await query(
      `SELECT * FROM ${tableName} ORDER BY "${orderKey}" LIMIT ${BACKUP_PAGE_SIZE} OFFSET ${offset}`
    );
    for (const row of page) all.push(row);
    if (page.length < BACKUP_PAGE_SIZE) break;
    offset += BACKUP_PAGE_SIZE;
  }
  return all;
}

// Các bảng cần backup (thứ tự quan trọng cho restore - parent trước child)
const BACKUP_TABLES = [
  { name: 'pos_customers', label: 'Khách hàng', key: 'phone' },
  { name: 'pos_kh_ma_dang_nhap', label: 'Mã đăng nhập App KH', key: 'id' },
  { name: 'pos_kh_lan_thu', label: 'Lần thử App KH', key: 'id' },
  { name: 'pos_products', label: 'Sản phẩm', key: 'id' },
  { name: 'pos_wallets', label: 'Số dư', key: 'phone' },
  { name: 'pos_orders', label: 'Đơn hàng', key: 'id' },
  { name: 'pos_order_items', label: 'Chi tiết đơn', key: 'id' },
  { name: 'pos_balance_transactions', label: 'Giao dịch số dư', key: 'id' },
  { name: 'pos_registrations', label: 'Đăng ký mới', key: 'id' },
  { name: 'pos_refund_requests', label: 'Yêu cầu hoàn tiền', key: 'id' },
  { name: 'pos_promotions', label: 'Khuyến mãi', key: 'id' },
  { name: 'pos_settings', label: 'Cài đặt', key: 'key' },
  // Thêm 09.08.2026 — 4 bảng của tính năng "Ưu đãi khách mới" (Bước 1-4), trước đây
  // chưa có trong backup nên toàn bộ dữ liệu SĐT đã claim KHÔNG được sao lưu.
  { name: 'pos_signup_codes', label: 'Mã ưu đãi khách mới', key: 'id' },
  { name: 'pos_discount_codes', label: 'Mã chiết khấu', key: 'id' },
  { name: 'pos_product_groups', label: 'Nhóm sản phẩm', key: 'id' },
  { name: 'pos_product_group_members', label: 'Thành viên nhóm SP', key: 'id' },

  // ═══ POS-ANTOAN-v1 (18.09.2026) — 15 bảng TRƯỚC ĐÂY KHÔNG ĐƯỢC SAO LƯU ═══
  // Rà soát toàn bộ 29 bảng của database thì chỉ 14 bảng có trong danh sách này.
  // Khôi phục từ bản sao lưu cũ = MẤT sạch điểm thưởng của khách, mất gói đã
  // bán, mất thẻ thành viên, mất cả tài khoản nhân viên.
  // Thứ tự dưới đây là CHA TRƯỚC CON SAU — restore chèn theo đúng thứ tự này.

  // Tài khoản và quyền (phải có trước, mọi thứ khác tham chiếu created_by)
  { name: 'pos_users', label: 'Tài khoản nhân viên', key: 'id' },
  { name: 'pos_permissions', label: 'Phân quyền', key: 'id' },

  // Điểm thưởng — MẤT LÀ MẤT HẾT, không dựng lại được từ đơn hàng vì
  // điểm còn phụ thuộc cấu hình tại thời điểm bán và các lần đổi quà.
  { name: 'pos_point_transactions', label: 'Giao dịch điểm thưởng', key: 'id' },
  { name: 'pos_reward_catalog', label: 'Kho quà', key: 'id' },
  { name: 'pos_voucher_grants', label: 'Voucher đã phát', key: 'id' },

  // Gói: danh mục trước, gói của khách sau
  { name: 'pos_packages', label: 'Danh mục gói', key: 'id' },
  { name: 'pos_customer_packages', label: 'Gói của khách', key: 'id' },

  // Thẻ thành viên: hạng trước, lịch sử mua sau
  { name: 'pos_membership_tiers', label: 'Hạng thành viên', key: 'id' },
  { name: 'pos_membership_purchases', label: 'Lịch sử mua thẻ', key: 'id' },

  // Sổ nợ kho — việc chưa gửi được sang SX. Mất là mất luôn dấu vết hàng
  // đã bán mà kho chưa trừ.
  { name: 'pos_stock_pending', label: 'Sổ nợ kho', key: 'id' },
  { name: 'pos_order_log', label: 'Nhật ký đơn', key: 'id' },   // POS-NEN-v1 (P19)
  { name: 'pos_doi_soat_ghi', label: 'Sổ đối soát (két, sao kê)', key: 'id' },
  { name: 'pos_phien_thanh_toan', label: 'Phiên thanh toán', key: 'id' },   // P3
  { name: 'pos_payos_su_kien', label: 'Báo tiền về payOS', key: 'id' },     // P3
  { name: 'pos_nhat_ky_pin', label: 'Nhật ký PIN khách', key: 'id' },       // P3
  { name: 'pos_don_app', label: 'Đơn từ App KH', key: 'id' },               // SAOLUU-2: bảng của KH-MUA-1 (bước 006) — chưa có thì bangDangCo bỏ qua

  // Sự cố và lịch sử — ảnh hưởng tiền nên phải giữ
  { name: 'pos_damage_logs', label: 'Hàng hỏng', key: 'id' },
  { name: 'pos_promotion_usage', label: 'Lịch sử dùng khuyến mãi', key: 'id' },
  { name: 'pos_invoice_logs', label: 'Nhật ký hoá đơn', key: 'id' },

  // Nhật ký kỹ thuật — giữ để truy nguyên sự cố
  { name: 'pos_sync_logs', label: 'Nhật ký đồng bộ', key: 'id' },
  { name: 'pos_export_logs', label: 'Nhật ký xuất dữ liệu', key: 'id' },

  // KHO-1: nâng cấp dữ liệu + kho (cha trước con). Khôi phục: kho_* chỉ khi kho trống, pos_nang_cap không bao giờ (POST /restore).
  { name: 'pos_nang_cap', label: 'Nâng cấp dữ liệu', key: 'so' },
  { name: 'kho_nhom_nguyen_lieu', label: 'Kho - Nhóm nguyên liệu', key: 'id' },
  { name: 'kho_nha_cung_cap', label: 'Kho - Nhà cung cấp', key: 'id' },
  { name: 'kho_nguyen_lieu', label: 'Kho - Nguyên liệu', key: 'id' },
  { name: 'kho_nhom_cong_thuc', label: 'Kho - Nhóm công thức', key: 'id' },
  { name: 'kho_san_pham', label: 'Kho - Sản phẩm', key: 'pos_product_id' },
  { name: 'kho_cong_thuc', label: 'Kho - Công thức', key: 'id' },
  { name: 'kho_dinh_muc', label: 'Kho - Định mức', key: 'id' },
  { name: 'kho_phieu', label: 'Kho - Phiếu', key: 'id' },
  { name: 'kho_lo', label: 'Kho - Lô', key: 'id' },
  { name: 'kho_phieu_dong', label: 'Kho - Dòng phiếu', key: 'id' }
];

// P26d (Q3, chủ quán mở rộng 18.10 + Q7a 19.10): bảng dính tiền — xuất / sao lưu được, KHÔNG khôi phục bằng file (chặn 400):
// ví, đơn, chi tiết đơn, sổ ví, yêu cầu hoàn · điểm, gói khách, thẻ, voucher, đền bù (hàng hỏng), lượt mã giảm · mã ưu đãi khách mới
// (cổng chống nhận điểm / voucher hai lần), nhật ký đơn (sổ thu tiền), lượt dùng khuyến mãi.
const BANG_KHONG_KHOI_PHUC = ['pos_wallets', 'pos_orders', 'pos_order_items', 'pos_balance_transactions', 'pos_refund_requests',
  'pos_point_transactions', 'pos_customer_packages', 'pos_membership_purchases', 'pos_voucher_grants', 'pos_damage_logs',
  'pos_discount_codes', 'pos_signup_codes', 'pos_order_log', 'pos_promotion_usage',
  'pos_phien_thanh_toan', 'pos_payos_su_kien', 'pos_nhat_ky_pin',   // P3: phần giữ tài khoản, tiền về payOS, dấu vết xoá PIN
  'pos_don_app'];   // SAOLUU-2: đơn từ App KH gắn với đơn / phiên thanh toán

/**
 * P26d — MỘT vị từ cho xem trước và khôi phục (Q7d): file có trang tiền có dòng → trả 400, chỗ gọi dừng TRƯỚC mọi lệnh xoá / chèn.
 * Màn Cài đặt hiện `error` ngay ở bước xem trước. Trả true khi đã trả lời 400.
 */
function chanTrangTien(res, wb) {
  const bang = wb.SheetNames.filter((s) => BANG_KHONG_KHOI_PHUC.includes(BACKUP_TABLES.find((t) => t.label === s)?.name)
    && docTrang(wb.Sheets[s]).length > 0);
  if (!bang.length) return false;
  res.status(400).json({ code: 'KHOI_PHUC_TRANG_TIEN_BI_CHAN', bang,
    error: `File có trang dính tiền (${bang.join(', ')}) — trang tiền không khôi phục bằng file. `
      + 'Xoá các trang đó khỏi file rồi khôi phục lại phần còn lại' });
  return true;
}

/** KHO-1: chỉ các bảng ĐANG CÓ — bước nâng cấp hỏng (thiếu bảng kho_*) không được kéo sập sao lưu, lúc cần sao lưu nhất. */
async function bangDangCo() {
  const co = new Set((await query("SELECT name FROM sqlite_master WHERE type = 'table'")).map((r) => r.name));
  return BACKUP_TABLES.filter((t) => co.has(t.name));
}

/**
 * Helper: Lấy pos_products với tên mới nhất từ SX
 */
async function getProductsWithSxNames() {
  const products = await query('SELECT * FROM pos_products');
  
  // Nếu SX online → merge tên từ SX
  if (isSxConfigured()) {
    try {
      const sxProducts = await callSxApi('/api/pos/products-with-stock');
      
      return products.map(p => {
        const sx = sxProducts.find(s => 
          s.sx_product_type === p.sx_product_type && 
          String(s.sx_product_id) === String(p.sx_product_id)
        );
        return sx ? { ...p, name: sx.name, code: sx.code } : p;
      });
    } catch (err) {
      console.log('⚠️ SX offline, dùng tên trong POS:', err.message);
    }
  }
  
  return products;
}

/**
 * GET /api/pos/backup/info
 * Thông tin database + thống kê số dòng từng bảng
 */
router.get('/info', authenticate, checkPermission('export_data'), async (req, res) => {
  try {
    const tables = [];
    for (const t of await bangDangCo()) {
      const result = await query(`SELECT COUNT(*) as count FROM ${t.name}`);
      tables.push({
        name: t.name,
        label: t.label,
        count: result[0]?.count || 0
      });
    }

    const totalRows = tables.reduce((sum, t) => sum + t.count, 0);

    res.json({
      type: 'turso_cloud',
      status: 'connected',
      tables,
      totalRows,
      message: 'Backup qua Excel - xuất/nhập từng bảng hoặc tất cả'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/backup/export-all
 * Xuất tất cả data thành 1 file Excel (nhiều sheet)
 */
router.get('/export-all', authenticate, async (req, res) => {
  console.log('[export-all] BUILD=paged-v3 bat dau xuat...');
  const t0 = Date.now();
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Chỉ owner mới có quyền backup' });
    }

    const wb = XLSX.utils.book_new();

    for (const t of await bangDangCo()) {
      // Đọc phân trang để không bị treo khi bảng có cột nặng.
      const rows = await readTablePaged(t.name, t.key);
      console.log(`[export-all] ${t.name}: ${rows.length} dong (${Date.now() - t0}ms)`);
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, t.label.substring(0, 31));
    }

    // Sheet metadata
    const meta = [{
      backup_date: new Date().toISOString(),
      system: 'POS Tứ Quý Đường',
      version: '1.0',
      tables: BACKUP_TABLES.map(t => t.name).join(', ')
    }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(meta), '_Metadata');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `POS-backup-${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    console.log(`[export-all] xong sau ${Date.now() - t0}ms, gui file ${filename}`);
    res.send(buffer);
  } catch (err) {
    console.error('[export-all] LOI:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/backup/export/:table
 * Xuất 1 bảng thành file Excel
 */
router.get('/export/:table', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Chỉ owner mới có quyền backup' });
    }

    const tableDef = BACKUP_TABLES.find(t => t.name === req.params.table);
    if (!tableDef) {
      return res.status(400).json({ error: 'Bảng không hợp lệ' });
    }

    // Đọc phân trang để tránh treo khi bảng có cột nặng.
    const rows = await readTablePaged(tableDef.name, tableDef.key);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), tableDef.label.substring(0, 31));

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `POS-${tableDef.name}-${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('Export table error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/backup/preview-restore
 * Preview file Excel trước khi restore
 */
router.post('/preview-restore', authenticate, upload.single('file'), async (req, res) => {
  try {
    // Đồng bộ với /restore ngay sau đây trong cùng luồng — không có lý do để 1 nhân viên
    // xem trước nội dung file backup (bao gồm số dòng mỗi bảng) nếu không phải người sẽ
    // thực hiện restore, việc mà đã khoá cứng owner-only từ trước.
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Chỉ owner mới có quyền xem trước file khôi phục' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Không có file upload' });
    }

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    if (chanTrangTien(res, wb)) return;
    // SAOLUU-2 (C): cùng kế hoạch với /restore — cột bỏ qua, trang bỏ qua (mã + lý do), số dòng đọc cùng một cách.
    const preview = [];
    for (const { dong, viTri, cot, ...m } of await lapKeHoach(wb, BACKUP_TABLES)) {
      const dem = m.recognized ? await query(`SELECT COUNT(*) as count FROM ${m.table}`).catch(() => [{ count: 0 }]) : [{ count: 0 }];   // KHO-1: bảng chưa có
      preview.push({ ...m, currentRows: dem[0]?.count || 0 });
    }

    res.json({ success: true, preview });
  } catch (err) {
    loiGhi(res, err);   // SAOLUU-2: cùng khuôn /restore — có code, không lộ câu nội bộ
  }
});

/**
 * POST /api/pos/backup/restore
 * Khôi phục data từ file Excel backup
 */
router.post('/restore', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Chỉ owner mới có quyền khôi phục' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Không có file upload' });
    }

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });

    // P26d (7), chủ quán chốt Q3: trang tiền không khôi phục bằng file (ví chỉ ghi qua ghiVi, đơn qua đường bán) — chặn TRƯỚC
    // mọi lệnh xoá / chèn. Vẫn SAO LƯU được (BACKUP_TABLES giữ đủ).
    if (chanTrangTien(res, wb)) return;
    // SAOLUU-2: kế hoạch (kho_* chỉ khi kho trống, pos_nang_cap không bao giờ, cột ∩ bảng) rồi MỘT giao dịch — dòng hỏng → không đổi gì.
    const keHoach = await lapKeHoach(wb, BACKUP_TABLES);
    try {
      await thucHien(keHoach);
    } catch (err) {
      if (!err.loiDong) return loiGhi(res, err);
      const { bang, trang, dong, ly_do } = err.loiDong;
      return res.status(400).json({ code: 'KHOI_PHUC_DONG_HONG', bang, trang, dong, ly_do,
        error: `Trang "${trang}"${dong ? ` dòng ${dong}` : ''}: ${ly_do} — chưa khôi phục gì, dữ liệu giữ nguyên` });
    }
    const results = keHoach.map(({ sheet, table, status, code, reason, fileRows, cot_bo_qua }) => (status === 'skipped'
      ? { sheet, table, status, code, reason } : { sheet, table, status: 'restored', rows: fileRows, total: fileRows, cot_bo_qua }));

    res.json({ success: true, message: 'Khôi phục hoàn tất', results });
  } catch (err) {
    loiGhi(res, err);   // SAOLUU-2: có code, không lộ câu nội bộ (LUAT §2, §4)
  }
});

module.exports = router;
