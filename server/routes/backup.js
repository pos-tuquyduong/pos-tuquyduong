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
const { getNow, getToday } = require('../utils/helpers');
const { docTrang, lapKeHoach, thucHien } = require('../utils/khoiPhuc');
const { loiGhi } = require('./wallets');   // kho bận → 409 KHO_BAN, lỗi khác → 500 không lộ câu nội bộ
const { isSxConfigured, callSxApi } = require('../utils/sxApi');
const { chiaPhan } = require('../utils/donThu');
const { xuat: xuatNoiDungApp } = require('../nd/duLieu');   // ND-API-1: chỗ DUY NHẤT POS gọi vào nd — bê nd đi thì xoá ở đây

const upload = multer({ storage: multer.memoryStorage() });

// Đọc bảng theo trang nhỏ để tránh phản hồi Turso quá lớn gây treo
// (một số bảng như pos_customers có cột base64 nặng: qr_code...).
const BACKUP_PAGE_SIZE = parseInt(process.env.BACKUP_PAGE_SIZE || '5', 10);

/**
 * Đọc TOÀN BỘ một bảng nhưng chia thành nhiều trang nhỏ,
 * ghép lại — tránh việc kéo cả bảng đầy đủ cột một phát làm nghẽn kết nối.
 */
async function readTablePaged(tableName, orderKey, boCot = []) {
  const all = [];
  let offset = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const page = await query(
      `SELECT * FROM ${tableName} ORDER BY "${orderKey}" LIMIT ${BACKUP_PAGE_SIZE} OFFSET ${offset}`
    );
    for (const row of page) { for (const c of boCot) delete row[c]; all.push(row); }
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
  { name: 'pos_goi_nap', label: 'Gói nạp tiền', key: 'id' },   // NAP-1: danh mục gói — xuất được, KHÔNG khôi phục (chỉ sửa có PIN chủ quán)
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
  { name: 'pos_pin_chu_quan', label: 'PIN chủ quán', key: 'id', boCot: ['pin_bam'] },   // HANG-1 (câu 4): KHÔNG xuất băm PIN — bảng không khôi phục được

  // Sổ nợ kho — việc chưa gửi được sang SX. Mất là mất luôn dấu vết hàng
  // đã bán mà kho chưa trừ.
  { name: 'pos_stock_pending', label: 'Sổ nợ kho', key: 'id' },
  { name: 'pos_order_log', label: 'Nhật ký đơn', key: 'id' },   // POS-NEN-v1 (P19)
  { name: 'pos_doi_soat_ghi', label: 'Sổ đối soát (két, sao kê)', key: 'id' },
  { name: 'pos_phien_thanh_toan', label: 'Phiên thanh toán', key: 'id' },   // P3
  { name: 'pos_payos_su_kien', label: 'Báo tiền về payOS', key: 'id' },     // P3
  { name: 'pos_nhat_ky_pin', label: 'Nhật ký PIN khách', key: 'id' },       // P3
  { name: 'pos_don_app', label: 'Đơn từ App KH', key: 'id' },               // SAOLUU-2: bảng của KH-MUA-1 (bước 006) — chưa có thì bangDangCo bỏ qua
  { name: 'pos_so_hoa_don', label: 'Sổ số hoá đơn', key: 'id' },            // CK-NOIDUNG-1 (bước 019): số hoá đơn đã cấp theo ngày
  { name: 'pos_man_khach_quay', label: 'Màn khách - Máy quầy', key: 'id' },     // MANKHACH-1 (bước 009): mã ghép + phiên QR đang hiện
  { name: 'pos_man_khach_may', label: 'Màn khách - Máy đã ghép', key: 'id' },   // MANKHACH-1 (bước 009): khoá băm + thu hồi
  { name: 'pos_chuong_trinh', label: 'Chương trình đặc biệt', key: 'id' },   // CT-1a (bước 017): cấu hình chương trình
  { name: 'pos_ngay_sinh_sua', label: 'Sổ sửa ngày sinh', key: 'id' },   // CT-1a (bước 017): sổ chỉ-thêm — không khôi phục bằng file
  { name: 'pos_giao_bao_phi', label: 'Giao hàng - Báo phí', key: 'id' },   // GIAO-1 (bước 021) — không chứa khoá Ahamove
  { name: 'pos_giao_chuyen', label: 'Giao hàng - Chuyến', key: 'id' },
  { name: 'pos_giao_tin', label: 'Giao hàng - Tin Ahamove báo về', key: 'id' },

  // Sự cố và lịch sử — ảnh hưởng tiền nên phải giữ
  { name: 'pos_damage_logs', label: 'Hàng hỏng', key: 'id' },
  { name: 'pos_hoan_tien_mat', label: 'Hoàn tiền mặt khách lẻ', key: 'id' },   // HUY-1 (bước 025): tiền mặt ra két khi huỷ đơn khách lẻ
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
  { name: 'kho_phieu_dong', label: 'Kho - Dòng phiếu', key: 'id' },

  // ND-API-1 (Q-B, chủ quán 13.11): kho nội dung App KH (bước 027). `nd: true` — export-all KHÔNG ghi trang thô (ảnh / bản 1 MB vượt ô Excel
  // 32.767 ký tự) mà ghi MỘT trang TRANG_ND = tệp Xuất của /api/nd cắt nhỏ; khôi phục Excel bỏ qua (BANG_KHOI_PHUC) — dựng lại ở /admin › Nhập toàn bộ.
  { name: 'nd_ban', label: 'Nội dung App - Bản', key: 'so_ban', nd: true },
  { name: 'nd_nhap', label: 'Nội dung App - Nháp', key: 'khoa', nd: true },
  { name: 'nd_anh', label: 'Nội dung App - Ảnh', key: 'ma', nd: true },
  { name: 'nd_nhat_ky', label: 'Nội dung App - Nhật ký', key: 'id', nd: true },
  { name: 'nd_khoa_sao_luu', label: 'Nội dung App - Khoá sao lưu', key: 'id', nd: true },   // chỉ băm khoá — không ra file
  { name: 'nd_lan_sai', label: 'Nội dung App - Lần sai', key: 'khoa', nd: true }
];
const TRANG_ND = 'Nội dung App (JSON)';
const BANG_KHOI_PHUC = BACKUP_TABLES.filter((t) => !t.nd);   // một chỗ lọc cho xem trước + khôi phục: trang mang nhãn bảng nd_* cũng không vào nd_*

// P26d (Q3, chủ quán mở rộng 18.10 + Q7a 19.10): bảng dính tiền — xuất / sao lưu được, KHÔNG khôi phục bằng file (chặn 400):
// ví, đơn, chi tiết đơn, sổ ví, yêu cầu hoàn · điểm, gói khách, thẻ, voucher, đền bù (hàng hỏng), lượt mã giảm · mã ưu đãi khách mới
// (cổng chống nhận điểm / voucher hai lần), nhật ký đơn (sổ thu tiền), lượt dùng khuyến mãi.
const BANG_KHONG_KHOI_PHUC = ['pos_wallets', 'pos_orders', 'pos_order_items', 'pos_balance_transactions', 'pos_refund_requests',
  'pos_point_transactions', 'pos_customer_packages', 'pos_membership_purchases', 'pos_voucher_grants', 'pos_damage_logs',
  'pos_discount_codes', 'pos_signup_codes', 'pos_order_log', 'pos_promotion_usage',
  'pos_phien_thanh_toan', 'pos_payos_su_kien', 'pos_nhat_ky_pin',   // P3: phần giữ tài khoản, tiền về payOS, dấu vết xoá PIN
  'pos_don_app',   // SAOLUU-2: đơn từ App KH gắn với đơn / phiên thanh toán
  'pos_so_hoa_don',   // CK-NOIDUNG-1: khôi phục sổ số cũ sẽ cấp lại số đã dùng
  'pos_doi_soat_ghi',   // chủ quán 01.11: sổ két / sao kê là sổ tiền — không ghi đè bằng file cũ
  'pos_man_khach_quay', 'pos_man_khach_may',   // MANKHACH-1: ghép máy — khôi phục file cũ làm sống lại màn khách đã thu hồi
  'pos_ngay_sinh_sua',   // CT-1a: sổ sửa ngày sinh chỉ-thêm — ghi đè bằng file cũ làm mất dấu ai đã sửa
  'pos_giao_bao_phi', 'pos_giao_chuyen', 'pos_giao_tin',   // GIAO-1: phí ship / phí Ahamove / chống xử lý tin lặp — sổ tiền
  'pos_pin_chu_quan',   // HANG-1: file cũ không được đặt lại PIN chủ quán / gỡ khoá sai PIN — quên PIN: chủ quán nhờ chat soạn cách xoá PIN (không có nút)
  'pos_membership_tiers',   // HANG-1 câu 4a (chủ quán 05.11): % giảm, gói, cách có hạng chỉ sửa ở Cài đặt có PIN chủ quán — file không vượt PIN
  'pos_hoan_tien_mat',   // HUY-1: tiền mặt ra két — sổ tiền, file cũ không ghi đè
  'pos_goi_nap'];   // NAP-1 (chủ quán 06.11): gói nạp chỉ chủ quán + PIN sửa — file cũ không vượt PIN (gói "trả ít → vào nhiều" là lối tạo tiền ví)

/** Trang _Metadata của mọi file sao lưu — backup_date giờ VN dạng T: khôi phục nhận ra file MỚI (GIO-VN-1), không đổi giờ. */
function themTrangMeta(wb, bang) {
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ backup_date: getNow(), system: 'POS Tứ Quý Đường', version: '1.0', tables: bang }]), '_Metadata');
}

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

    const co = await bangDangCo();
    for (const t of co.filter((x) => !x.nd)) {
      // Đọc phân trang để không bị treo khi bảng có cột nặng.
      const rows = await readTablePaged(t.name, t.key, t.boCot);
      console.log(`[export-all] ${t.name}: ${rows.length} dong (${Date.now() - t0}ms)`);
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, t.label.substring(0, 31));
    }
    if (co.some((x) => x.nd)) {   // ND-API-1: một trang = tệp Xuất nội dung App, mỗi ô ≤ 30.000 ký tự (chiaPhan của dọn thử)
      const phan = chiaPhan(JSON.stringify(await xuatNoiDungApp()));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(phan.map((du_lieu, i) => ({ phan: i + 1, du_lieu }))), TRANG_ND);
    }

    themTrangMeta(wb, BACKUP_TABLES.map(t => t.name).join(', '));

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `POS-backup-${getToday()}.xlsx`;

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
    if (tableDef.nd) {
      return res.status(400).json({ error: `Nội dung App sao lưu trong bản toàn bộ (trang "${TRANG_ND}")`, code: 'ND_TRONG_BAN_TOAN_BO' });
    }

    // Đọc phân trang để tránh treo khi bảng có cột nặng.
    const rows = await readTablePaged(tableDef.name, tableDef.key, tableDef.boCot);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), tableDef.label.substring(0, 31));
    themTrangMeta(wb, tableDef.name);

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `POS-${tableDef.name}-${getToday()}.xlsx`;

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
    for (const { dong, viTri, cot, ...m } of await lapKeHoach(wb, BANG_KHOI_PHUC)) {
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
    const keHoach = await lapKeHoach(wb, BANG_KHOI_PHUC);
    // GIO-VN-1: file ghi từ GIO-VN-1 (themTrangMeta) mang backup_date giờ VN `YYYY-MM-DDTHH:mm:ss`; file cũ (toISOString đuôi Z, hoặc xuất một
    // bảng trước đây không có _Metadata) → đổi giờ cũ như bước 012.
    const ngaySao = wb.Sheets._Metadata ? String(docTrang(wb.Sheets._Metadata)[0]?.backup_date ?? '') : '';
    try {
      await thucHien(keHoach, { banCu: !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/.test(ngaySao) });
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
