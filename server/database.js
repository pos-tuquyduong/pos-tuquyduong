/**
 * POS System - Database Module
 * Sử dụng Turso (@libsql/client) - Cloud SQLite
 * 
 * THIẾT KẾ: phone làm định danh chính
 * - pos_wallets: quản lý số dư theo phone
 * - pos_balance_transactions: lịch sử giao dịch theo phone
 * - pos_customers: chỉ lưu thông tin khách (không có balance)
 * 
 * MIGRATION từ sql.js sang Turso:
 * - Tất cả functions (query, queryOne, run) giờ là async
 * - Các routes cần thêm await khi gọi
 */

const { createClient } = require('@libsql/client');
const { cauHinhTurso, diaChiSX } = require('./ketNoiKho'); // POS-KHOTHU-v2

let db = null;
let nangCapHong = null;   // KHO-1: '<NNN_ten>: <lỗi>' khi một bước nâng cấp hỏng — đường kho trả 503, quầy vẫn mở

/**
 * Khởi tạo database - Kết nối Turso
 */
async function initDatabase() {
  // POS-KHOTHU-v2 — nối vào đâu do server/ketNoiKho.js quyết định.
  // KHÔNG tự đọc biến môi trường ở đây.
  const kn = cauHinhTurso();
  db = createClient(kn.cauHinh);

  console.log(kn.laMayThu
    ? `⚠️  KHO THỬ cục bộ: ${kn.cauHinh.url} · SX: ${diaChiSX() || 'TẮT'} — KHÔNG phải dữ liệu thật`
    : '✅ Đã kết nối Turso database (PRODUCTION)');

  // Tạo bảng và seed data
  await createTables();
  await seedDefaultData();
  // KHO-1: nâng cấp dữ liệu đánh số (server/nang_cap/) — sau phần tạo bảng / seed cũ
  nangCapHong = (await require('./nang_cap/chay').chayNangCap({ beginTransaction, query })).hong;
  if (nangCapHong) console.error('❌ NÂNG CẤP DỮ LIỆU HỎNG — ' + nangCapHong);

  return db;
}

/**
 * Tạo tất cả các bảng
 */
async function createTables() {
  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 1: NHÂN VIÊN
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT,
      role TEXT DEFAULT 'staff',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 2: PHÂN QUYỀN
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      permission TEXT NOT NULL,
      allowed INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(role, permission)
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 3: KHÁCH HÀNG (chỉ thông tin, KHÔNG có balance)
  // Số dư quản lý riêng trong pos_wallets theo phone
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      notes TEXT,
      parent_phone TEXT,
      relationship TEXT,
      qr_code TEXT UNIQUE,
      pin_code TEXT,
      email TEXT,
      password TEXT,
      sx_group_name TEXT,
      sx_product TEXT,
      sx_start_date TEXT,
      sx_end_date TEXT,
      sx_status TEXT,
      sync_status TEXT DEFAULT 'new',
      exported_at DATETIME,
      exported_by TEXT,
      synced_at DATETIME,
      customer_type TEXT DEFAULT 'subscription',
      requested_product TEXT,
      requested_cycles INTEGER,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    )
  `);

  // KH-API-1: mã đăng nhập App KH — dùng MỘT lần, hạn ngắn, lưu BĂM (không lưu mã thô). nguon 'quay' (nhân viên cấp) | 'gui' (App
  // xin). Giới hạn thử đăng nhập (utils/maKhach.js GIOI_HAN) đếm trên chính bảng này. Cột giờ ghi bằng getNow().
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_kh_ma_dang_nhap (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sdt TEXT NOT NULL,
      ma_bam TEXT NOT NULL,
      nguon TEXT NOT NULL,
      cap_boi TEXT,
      ip TEXT,
      tao_luc TEXT NOT NULL,
      het_han TEXT NOT NULL,
      so_lan_thu INTEGER NOT NULL DEFAULT 0,
      dung_luc TEXT
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_kh_ma_sdt ON pos_kh_ma_dang_nhap(sdt, tao_luc)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_kh_ma_ip ON pos_kh_ma_dang_nhap(ip, tao_luc)`);
  // KH-API-1 (Q9): mỗi lần App KH gọi nhận mã bill / nhận điểm là một dòng (loai 'nhan_ma_bill' | 'nhan_diem') — trần theo SĐT + IP.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_kh_lan_thu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loai TEXT NOT NULL,
      sdt TEXT NOT NULL,
      ip TEXT,
      tao_luc TEXT NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_kh_lan_thu_sdt ON pos_kh_lan_thu(sdt, tao_luc)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_kh_lan_thu_ip ON pos_kh_lan_thu(ip, tao_luc)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 4: SẢN PHẨM
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL DEFAULT 0,
      unit TEXT DEFAULT 'túi',
      description TEXT,
      image_url TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      sx_product_type TEXT,
      sx_product_id INTEGER,
      is_special_group INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    )
  `);
  // TIER-2 (06.08.2026): cột đánh dấu "SP đặc biệt/phễu" (vd cà phê) — nhận % giảm hạng RIÊNG,
  // khác với % giảm hạng thường. Bảng cũ (đã tồn tại) chưa có cột này → thêm bằng ALTER.
  try {
    await db.execute(`ALTER TABLE pos_products ADD COLUMN is_special_group INTEGER DEFAULT 0`);
  } catch (e) {
    // Cột đã tồn tại (bảng mới tạo đã có, hoặc đã ALTER trước đó) — bỏ qua
  }

  // POS-VANTAY-v1: luu van tay vao so no de buoc TU DO HANG DOI sau nay gui
  // lai dung van tay cu. Khong co cot nay thi khong dung lai duoc van tay,
  // va gui lai se tru kho LAN NUA.
  try {
    await db.execute(`ALTER TABLE pos_stock_pending ADD COLUMN van_tay TEXT`);
  } catch (e) {
    // Cột đã tồn tại — bỏ qua
  }

  // POS-TONCU-v1: nho SO TON CUOI CUNG BIET DUOC va GIO biet.
  // Mat ket noi SX thi tra dung so nay kem gio, thay cho so 999 bia ra.
  // Chi ghi cho mon CO QUAN KHO va khi SX tra ve mot con so that.
  try {
    await db.execute(`ALTER TABLE pos_products ADD COLUMN ton_gan_nhat INTEGER`);
  } catch (e) {
    // Cot da ton tai — bo qua
  }
  try {
    await db.execute(`ALTER TABLE pos_products ADD COLUMN ton_luc TEXT`);
  } catch (e) {
    // Cot da ton tai — bo qua
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 5: ĐƠN HÀNG
  // Dùng customer_phone làm key chính, customer_id chỉ để tham chiếu
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      customer_phone TEXT,
      customer_name TEXT,
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      discount_reason TEXT,
      promotion_id INTEGER,
      total REAL DEFAULT 0,
      payment_method TEXT NOT NULL,
      cash_amount REAL DEFAULT 0,
      transfer_amount REAL DEFAULT 0,
      balance_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'completed',
      cancelled_at DATETIME,
      cancelled_by TEXT,
      cancelled_reason TEXT,
      refund_requested_at DATETIME,
      refund_requested_by TEXT,
      refund_amount REAL,
      refund_approved_at DATETIME,
      refund_approved_by TEXT,
      refund_rejected_at DATETIME,
      refund_rejected_by TEXT,
      refund_rejected_reason TEXT,
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (promotion_id) REFERENCES pos_promotions(id)
    )
  `);

  // Thêm cột invoice_number vào pos_orders nếu chưa có
  try {
    await db.execute(`ALTER TABLE pos_orders ADD COLUMN invoice_number TEXT`);
    console.log('✅ Đã thêm cột invoice_number vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại, bỏ qua
  }
  try {
    await db.execute(`ALTER TABLE pos_orders ADD COLUMN flash_discount REAL DEFAULT 0`);
    console.log('✅ Đã thêm cột flash_discount vào pos_orders (F2)');
  } catch (e) {
    // Cột đã tồn tại, bỏ qua
  }
  // TIER-2 (07.08.2026): lưu lại giảm hạng + tên hạng lúc mua — để IN LẠI đơn cũ (reprint)
  // vẫn hiện đúng, không lệch với lúc mới tạo (giống hệt cách flash_discount đã làm).
  try {
    await db.execute(`ALTER TABLE pos_orders ADD COLUMN tier_discount REAL DEFAULT 0`);
    console.log('✅ Đã thêm cột tier_discount vào pos_orders (TIER-2)');
  } catch (e) {
    // Cột đã tồn tại, bỏ qua
  }
  try {
    await db.execute(`ALTER TABLE pos_orders ADD COLUMN customer_tier TEXT`);
    console.log('✅ Đã thêm cột customer_tier vào pos_orders (TIER-2)');
  } catch (e) {
    // Cột đã tồn tại, bỏ qua
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // MIGRATION V3: Hỗ trợ công nợ + thanh toán linh hoạt
  // ═══════════════════════════════════════════════════════════════════════════

  // Thêm cột payment_status vào pos_orders
  try {
    await db.execute(`ALTER TABLE pos_orders ADD COLUMN payment_status TEXT DEFAULT 'paid'`);
    console.log('✅ Đã thêm cột payment_status vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại
  }

  // Thêm cột debt_amount vào pos_orders (số tiền còn nợ)
  try {
    await db.execute(`ALTER TABLE pos_orders ADD COLUMN debt_amount REAL DEFAULT 0`);
    console.log('✅ Đã thêm cột debt_amount vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại
  }

  // Thêm cột due_date vào pos_orders (hạn thanh toán)
  try {
    await db.execute(`ALTER TABLE pos_orders ADD COLUMN due_date DATETIME`);
    console.log('✅ Đã thêm cột due_date vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại
  }

  // Thêm cột cash_amount vào pos_orders
  try {
    await db.execute(`ALTER TABLE pos_orders ADD COLUMN cash_amount REAL DEFAULT 0`);
    console.log('✅ Đã thêm cột cash_amount vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại
  }

  // Thêm cột transfer_amount vào pos_orders
  try {
    await db.execute(`ALTER TABLE pos_orders ADD COLUMN transfer_amount REAL DEFAULT 0`);
    console.log('✅ Đã thêm cột transfer_amount vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 6: CHI TIẾT ĐƠN HÀNG
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_code TEXT,
      product_name TEXT,
      quantity INTEGER DEFAULT 1,
      unit_price REAL,
      total_price REAL,
      notes TEXT,
      unit TEXT DEFAULT 'túi',
      sx_finished_product_id INTEGER,
      flash_unit_price REAL,
      tier_unit_price REAL,
      FOREIGN KEY (order_id) REFERENCES pos_orders(id)
    )
  `);
  // Hóa đơn (04.08.2026): cột hiển thị giá đã giảm Flash cho TỪNG món — CHỈ để in hóa đơn,
  // không ảnh hưởng cách tính subtotal/total thật (vẫn giữ nguyên logic cũ, giảm theo tổng).
  try {
    await db.execute(`ALTER TABLE pos_order_items ADD COLUMN flash_unit_price REAL`);
  } catch (e) {
    // Cột đã tồn tại (bảng mới tạo đã có, hoặc đã chạy ALTER trước đó) — bỏ qua
  }
  // TIER-2 (06.08.2026): tương tự flash_unit_price — giá đã giảm theo HẠNG cho TỪNG món,
  // chỉ để in hóa đơn đúng, không ảnh hưởng cách tính total thật.
  try {
    await db.execute(`ALTER TABLE pos_order_items ADD COLUMN tier_unit_price REAL`);
  } catch (e) {
    // Cột đã tồn tại — bỏ qua
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 7: SỐ DƯ KHÁCH HÀNG (phone là key chính)
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      balance REAL DEFAULT 0,
      total_topup REAL DEFAULT 0,
      total_spent REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 8: LỊCH SỬ GIAO DỊCH SỐ DƯ (phone là key chính)
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_balance_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_phone TEXT NOT NULL,
      customer_name TEXT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      balance_before REAL DEFAULT 0,
      balance_after REAL DEFAULT 0,
      order_id INTEGER,
      payment_method TEXT DEFAULT 'cash',
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 8b: SỔ ĐIỂM THƯỞNG (LOY-1)
  // Append-only. Số dư = SUM(points) các dòng CÒN HẠN. KHÔNG lưu số dư rời.
  // type: earn | redeem | expire | bonus | adjust
  // points: dương = cộng, âm = trừ. expires_at: NULL = không hết hạn.
  // LƯU Ý: app luôn ghi created_at/expires_at bằng getNow() ('YYYY-MM-DDTHH:mm:ss', giờ +7).
  //        So hạn điểm là so chuỗi (lexical) → PHẢI cùng định dạng, đừng dùng CURRENT_TIMESTAMP.
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_point_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_phone TEXT NOT NULL,
      type TEXT NOT NULL,
      points INTEGER NOT NULL,
      order_id INTEGER,
      expires_at TEXT,
      reason TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // 1 index ghép đủ cho cả tính số dư (phone + expires_at) lẫn tra lịch sử theo phone (tiền tố trái).
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_point_tx_phone_exp ON pos_point_transactions(customer_phone, expires_at)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 8c: KHO QUÀ ĐỔI ĐIỂM (LOY-2a) — danh mục phần thưởng, admin quản.
  // Đổi điểm thật (trừ điểm + đẻ voucher) là LOY-2b; bảng này inert.
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_reward_catalog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      points_cost INTEGER NOT NULL,
      discount_type TEXT NOT NULL DEFAULT 'fixed',
      discount_value REAL NOT NULL,
      max_discount REAL DEFAULT 0,
      valid_days INTEGER NOT NULL DEFAULT 30,
      is_active INTEGER DEFAULT 1,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 8d: VÍ VOUCHER CỦA KHÁCH (LOY-2a) — voucher đã đổi, gắn theo SĐT.
  // status: available | used | expired. code = mã trong pos_discount_codes.
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_voucher_grants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      reward_id INTEGER,
      status TEXT NOT NULL DEFAULT 'available',
      point_tx_id INTEGER,
      granted_at TEXT,
      expires_at TEXT,
      used_order_id INTEGER,
      used_at TEXT
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_voucher_grant_phone ON pos_voucher_grants(customer_phone, status)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_voucher_grant_code ON pos_voucher_grants(code)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 9: KHUYẾN MÃI
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      value REAL,
      min_order_amount REAL DEFAULT 0,
      max_discount REAL,
      applicable_products TEXT,
      applicable_customers TEXT,
      usage_limit INTEGER,
      usage_count INTEGER DEFAULT 0,
      per_customer_limit INTEGER DEFAULT 1,
      start_date TEXT,
      end_date TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 10: LOG SỬ DỤNG KHUYẾN MÃI
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_promotion_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      promotion_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      customer_phone TEXT,
      discount_amount REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (promotion_id) REFERENCES pos_promotions(id),
      FOREIGN KEY (order_id) REFERENCES pos_orders(id)
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 11: YÊU CẦU HOÀN TIỀN
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_refund_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      customer_phone TEXT NOT NULL,
      order_total REAL,
      balance_paid REAL,
      refund_amount REAL,
      status TEXT DEFAULT 'pending',
      requested_by TEXT,
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reason TEXT,
      processed_by TEXT,
      processed_at DATETIME,
      rejection_reason TEXT,
      balance_transaction_id INTEGER,
      FOREIGN KEY (order_id) REFERENCES pos_orders(id)
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 12: LOG ĐỒNG BỘ
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      file_name TEXT,
      record_count INTEGER,
      details TEXT,
      status TEXT DEFAULT 'success',
      error_message TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 13: ĐĂNG KÝ MỚI
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      notes TEXT,
      parent_phone TEXT,
      relationship TEXT,
      requested_product TEXT,
      requested_cycles INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending',
      exported_at DATETIME,
      exported_by TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 14: LOG EXPORT
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_export_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exported_at TEXT NOT NULL,
      exported_by TEXT NOT NULL,
      registration_ids TEXT NOT NULL,
      customer_count INTEGER NOT NULL,
      file_name TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 15: CÀI ĐẶT HỆ THỐNG (MỚI - Phase A)
  // Lưu cấu hình cửa hàng, hóa đơn, Zalo, Email...
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 16: LOG IN HÓA ĐƠN (MỚI - Phase A)
  // Lưu lịch sử in hóa đơn
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_invoice_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      order_code TEXT NOT NULL,
      invoice_number TEXT NOT NULL,
      paper_size TEXT DEFAULT 'a5',
      printed_by INTEGER,
      printed_by_name TEXT,
      printed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      print_type TEXT DEFAULT 'print',
      sent_zalo INTEGER DEFAULT 0,
      sent_email INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      deleted_at TEXT,
      deleted_by INTEGER,
      FOREIGN KEY (order_id) REFERENCES pos_orders(id)
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // INDEXES - Tối ưu cho phone làm key chính
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_customer_phone ON pos_customers(phone)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_customer_parent ON pos_customers(parent_phone)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_customer_sync ON pos_customers(sync_status)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_customer_type ON pos_customers(customer_type)`);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_order_date ON pos_orders(created_at)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_order_phone ON pos_orders(customer_phone)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_order_status ON pos_orders(status)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_order_invoice ON pos_orders(invoice_number)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_order_payment_status ON pos_orders(payment_status)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_order_debt ON pos_orders(debt_amount)`);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_wallet_phone ON pos_wallets(phone)`);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_balance_phone ON pos_balance_transactions(customer_phone)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_balance_type ON pos_balance_transactions(type)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_balance_date ON pos_balance_transactions(created_at)`);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_product_category ON pos_products(category)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_product_active ON pos_products(is_active)`);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_registration_phone ON pos_registrations(phone)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_registration_status ON pos_registrations(status)`);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_refund_phone ON pos_refund_requests(customer_phone)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_refund_status ON pos_refund_requests(status)`);

  // Index mới cho invoice_logs
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_invoice_logs_order ON pos_invoice_logs(order_code)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_invoice_logs_date ON pos_invoice_logs(printed_at)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_invoice_logs_number ON pos_invoice_logs(invoice_number)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 17: MÃ CHIẾT KHẤU (MỚI)
  //
  // ⚠️ QUY ƯỚC BẮT BUỘC (09.08.2026, ghi lại sau khi tự vá lỗi do quên đúng quy ước này):
  // `valid_from`/`valid_to` PHẢI luôn là NGÀY THUẦN dạng "YYYY-MM-DD" (10 ký tự, KHÔNG có
  // giờ/phút/giây) — vì hệ thống so sánh hạn bằng SO SÁNH CHUỖI thô (`today < valid_from`),
  // không phải so sánh ngày thật. Nếu 1 nơi lỡ lưu dạng "YYYY-MM-DDTHH:MM:SS" trong khi so
  // sánh dùng "YYYY-MM-DD" → so sánh chuỗi coi ngày ngắn hơn "nhỏ hơn" ngày dài hơn (vì là
  // tiền tố của nhau) → chặn nhầm mã hợp lệ (hoặc bỏ sót mã đã hết hạn cùng ngày).
  // Đã xảy ra thật ở signup-codes.js (Bước 4) — sinh mã claim để `valid_from`/`valid_to` là
  // ngày+giờ đầy đủ, khiến mọi voucher vừa claim bị báo "chưa có hiệu lực". Mọi chỗ MỚI ghi
  // vào 2 cột này (kể cả code AI viết sau này) PHẢI dùng `.slice(0, 10)` hoặc để `null` —
  // không bao giờ lưu nguyên `getNow()`/`new Date().toISOString()` chưa cắt.
  //
  // Tương tự: "hôm nay" để so sánh PHẢI tính theo GIỜ VIỆT NAM (`getNow().slice(0,10)`),
  // KHÔNG dùng `new Date().toISOString().slice(0,10)` (giờ UTC, lệch 7 tiếng) — nếu không,
  // khung 0h-7h sáng giờ VN mỗi ngày sẽ tính sai "hôm nay" thành "hôm qua".
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_discount_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL DEFAULT 'percent',
      discount_value REAL NOT NULL DEFAULT 0,
      min_order REAL DEFAULT 0,
      max_discount REAL DEFAULT 0,
      usage_limit INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      valid_from TEXT,
      valid_to TEXT,
      is_active INTEGER DEFAULT 1,
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    )
  `);

  // Bước 2 (08.08.2026) — chuẩn bị cho voucher "khách mới" giảm-1-món:
  // discount_scope: 'order' (mặc định, y hệt hành vi hiện tại — giảm cả đơn) | 'item' (giảm 1 món).
  // applicable_group_id: chỉ có ý nghĩa khi scope='item' — trỏ vào pos_product_groups (Bước 1).
  // CHỈ THÊM CỘT, CHƯA CÓ GÌ ĐỌC 2 CỘT NÀY Ở orders.js — mọi voucher đang chạy (mã thường,
  // đổi điểm) không đổi hành vi, vì giá trị mặc định 'order' khớp đúng cách chúng đang hoạt động.
  try {
    await db.execute(`ALTER TABLE pos_discount_codes ADD COLUMN discount_scope TEXT DEFAULT 'order'`);
  } catch (e) {
    // Cột đã tồn tại — bỏ qua
  }
  try {
    await db.execute(`ALTER TABLE pos_discount_codes ADD COLUMN applicable_group_id INTEGER`);
  } catch (e) {
    // Cột đã tồn tại — bỏ qua
  }

  // Index cho discount_codes
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_discount_code ON pos_discount_codes(code)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_discount_active ON pos_discount_codes(is_active)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // MIGRATION: Thêm trường chiết khấu vào pos_customers
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    await db.execute(`ALTER TABLE pos_customers ADD COLUMN discount_type TEXT DEFAULT 'percent'`);
    console.log('✅ Đã thêm cột discount_type vào pos_customers');
  } catch (e) {
    // Cột đã tồn tại
  }

  try {
    await db.execute(`ALTER TABLE pos_customers ADD COLUMN discount_value REAL DEFAULT 0`);
    console.log('✅ Đã thêm cột discount_value vào pos_customers');
  } catch (e) {
    // Cột đã tồn tại
  }

  try {
    await db.execute(`ALTER TABLE pos_customers ADD COLUMN discount_note TEXT`);
    console.log('✅ Đã thêm cột discount_note vào pos_customers');
  } catch (e) {
    // Cột đã tồn tại
  }

  // MIGRATION: Thêm cột address vào pos_customers (cho hóa đơn)
  try {
    await db.execute(`ALTER TABLE pos_customers ADD COLUMN address TEXT`);
    console.log('✅ Đã thêm cột address vào pos_customers');
  } catch (e) {
    // Cột đã tồn tại
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MIGRATION: Thêm trường chiết khấu + shipping vào pos_orders
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    await db.execute(`ALTER TABLE pos_orders ADD COLUMN discount_type TEXT`);
    console.log('✅ Đã thêm cột discount_type vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại
  }

  try {
    await db.execute(`ALTER TABLE pos_orders ADD COLUMN discount_value REAL DEFAULT 0`);
    console.log('✅ Đã thêm cột discount_value vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại
  }

  try {
    await db.execute(`ALTER TABLE pos_orders ADD COLUMN discount_amount REAL DEFAULT 0`);
    console.log('✅ Đã thêm cột discount_amount vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại
  }

  try {
    await db.execute(`ALTER TABLE pos_orders ADD COLUMN discount_code TEXT`);
    console.log('✅ Đã thêm cột discount_code vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại
  }

  try {
    await db.execute(`ALTER TABLE pos_orders ADD COLUMN shipping_fee REAL DEFAULT 0`);
    console.log('✅ Đã thêm cột shipping_fee vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại
  }

  // Migration: Thêm cột parent cho hoàn tiền mẹ khi hủy đơn
  try {
    await db.execute(`ALTER TABLE pos_orders ADD COLUMN parent_phone TEXT`);
    console.log('✅ Đã thêm cột parent_phone vào pos_orders');
  } catch (e) {}
  try {
    await db.execute(`ALTER TABLE pos_orders ADD COLUMN parent_balance_amount REAL DEFAULT 0`);
    console.log('✅ Đã thêm cột parent_balance_amount vào pos_orders');
  } catch (e) {}

  // MIGRATION: Tiền khách đưa + tiền thối (để in lại hóa đơn)
  try {
    await db.execute(`ALTER TABLE pos_orders ADD COLUMN cash_received REAL DEFAULT 0`);
    console.log('✅ Đã thêm cột cash_received vào pos_orders');
  } catch (e) {}
  try {
    await db.execute(`ALTER TABLE pos_orders ADD COLUMN change_amount REAL DEFAULT 0`);
    console.log('✅ Đã thêm cột change_amount vào pos_orders');
  } catch (e) {}

  // MIGRATION: Đơn vị tính cho order items (để in hóa đơn)
  try {
    await db.execute(`ALTER TABLE pos_order_items ADD COLUMN unit TEXT DEFAULT 'túi'`);
    console.log('✅ Đã thêm cột unit vào pos_order_items');
  } catch (e) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 17: LOG SỰ CỐ HÀNG HỎNG (đơn giản - chỉ ghi log)
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_damage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      order_code TEXT,
      customer_phone TEXT,
      customer_name TEXT,
      product_code TEXT NOT NULL,
      product_name TEXT,
      quantity INTEGER NOT NULL,
      unit_price INTEGER DEFAULT 0,
      damage_value INTEGER DEFAULT 0,
      reason TEXT NOT NULL,
      reason_note TEXT,
      action TEXT NOT NULL,
      refund_amount INTEGER DEFAULT 0,
      returned_to_stock INTEGER DEFAULT 0,
      processed_by INTEGER,
      processed_by_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES pos_orders(id)
    )
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_damage_log_order ON pos_damage_logs(order_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_damage_log_date ON pos_damage_logs(created_at)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG: STOCK PENDING - Lưu trừ kho SX thất bại để retry
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_stock_pending (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_code TEXT NOT NULL,
      order_id INTEGER,
      sx_product_type TEXT NOT NULL,
      sx_product_id INTEGER NOT NULL,
      product_name TEXT,
      quantity INTEGER NOT NULL,
      direction TEXT NOT NULL DEFAULT 'out',
      status TEXT DEFAULT 'pending',
      retry_count INTEGER DEFAULT 0,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      van_tay TEXT
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // POS-NEN-v1 (P19): NHẬT KÝ ĐƠN — chỉ ghi việc CHƯA có chỗ lưu (thu tiền sau,
  // đổi cách trả, sau này in lại). Giờ tạo / huỷ đã nằm trong pos_orders.
  // Nhớ: bảng mới nào cũng phải vào BACKUP_TABLES — bộ kiểm có luật chặn.
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_order_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      loai TEXT NOT NULL,
      noi_dung TEXT,
      chi_tiet TEXT,
      nguoi TEXT,
      luc TEXT NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_order_log_order ON pos_order_log(order_id)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG: GÓI SẢN PHẨM - Template (POS-only, quản lý trong Settings)
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL DEFAULT 0,
      unit TEXT DEFAULT 'túi',
      total_qty INTEGER DEFAULT 0,
      package_items TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG: GÓI KHÁCH HÀNG - Khi khách MUA gói (tracking giao hàng)
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_customer_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_phone TEXT NOT NULL,
      package_id INTEGER NOT NULL,
      order_id INTEGER,
      total_qty INTEGER NOT NULL,
      delivered_qty INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (package_id) REFERENCES pos_packages(id)
    )
  `);

  // Migration: pos_orders thêm cột customer_package_id
  try {
    await db.execute(`ALTER TABLE pos_orders ADD COLUMN customer_package_id INTEGER`);
  } catch (e) { /* column already exists */ }

  // Migration: pos_packages thêm package_items + total_qty
  try { await db.execute(`ALTER TABLE pos_packages ADD COLUMN total_qty INTEGER DEFAULT 0`); } catch (e) {}
  try { await db.execute(`ALTER TABLE pos_packages ADD COLUMN package_items TEXT`); } catch (e) {}

  // Migration: Bỏ FK constraint trên pos_order_items.product_id (cho phép gói ảo)
  try {
    const hasFK = await queryOne("SELECT sql FROM sqlite_master WHERE type='table' AND name='pos_order_items'");
    if (hasFK?.sql?.includes('FOREIGN KEY (product_id)')) {
      console.log('🔄 Migrating pos_order_items: removing FK constraint on product_id...');
      await db.execute('BEGIN TRANSACTION');
      try {
        await db.execute(`CREATE TABLE pos_order_items_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          product_id INTEGER,
          product_code TEXT,
          product_name TEXT,
          quantity INTEGER DEFAULT 1,
          unit_price REAL,
          total_price REAL,
          notes TEXT,
          unit TEXT DEFAULT 'túi',
          sx_finished_product_id INTEGER,
          FOREIGN KEY (order_id) REFERENCES pos_orders(id)
        )`);
        await db.execute(`INSERT INTO pos_order_items_new SELECT id, order_id, product_id, product_code, product_name, quantity, unit_price, total_price, notes, unit, sx_finished_product_id FROM pos_order_items`);
        await db.execute(`DROP TABLE pos_order_items`);
        await db.execute(`ALTER TABLE pos_order_items_new RENAME TO pos_order_items`);
        await db.execute('COMMIT');
        console.log('✅ Migration complete: pos_order_items FK removed');
      } catch (migErr) {
        await db.execute('ROLLBACK');
        console.error('❌ Migration rolled back:', migErr.message);
      }
    }
  } catch (e) { console.error('Migration check error:', e.message); }

  // Indexes cho pos_customer_packages
  try {
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_cp_phone ON pos_customer_packages(customer_phone)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_cp_status ON pos_customer_packages(status)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_orders_cpid ON pos_orders(customer_package_id)`);
  } catch (e) { /* already exists */ }

  // ═══════════════════════════════════════════════════════════════════════════
  // DOI-SOAT-1: sổ ghi của màn Đối soát — số két đếm cuối ngày ('ket') và đánh dấu đã so sao kê tuần ('sao_ke').
  // CHỈ THÊM DÒNG (không UPDATE / DELETE): dòng mới nhất theo id là giá trị hiện hành, dòng cũ là lịch sử.
  // ky: ngày YYYY-MM-DD (két) hoặc ngày THỨ 2 của tuần (sao kê). so_tien = đếm cuối ngày, de_lai = để lại cho mai (đồng, nguyên).
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_doi_soat_ghi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loai TEXT NOT NULL,
      ky TEXT NOT NULL,
      so_tien INTEGER,
      de_lai INTEGER,
      da_so INTEGER,
      ghi_chu TEXT,
      nguoi TEXT,
      luc TEXT NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_doi_soat_ghi ON pos_doi_soat_ghi(loai, ky, id)`);
  // Đối soát chạy bất biến trên CẢ sổ: các câu lồng theo order_id không chỉ mục thì chi phí ~ số đơn × số dòng (đo: 20.000 đơn → 35 s).
  // Chỉ những bảng tạo TRONG createTables (pos_signup_codes, pos_membership_purchases tạo sau, ở seedDefaultData).
  for (const bang of ['pos_order_items', 'pos_balance_transactions', 'pos_point_transactions', 'pos_refund_requests', 'pos_customer_packages']) {
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_ds_${bang.slice(4)}_order ON ${bang}(order_id)`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // P3: phiên thanh toán — giỏ đã tính + phần GIỮ tài khoản (khách / mẹ) + trạng thái. "Đang giữ" = trang_thai 'cho' và het_han chưa
  // qua (không hẹn giờ nhả — Render ngủ). Chốt = MỘT câu cho → da_thu trong giao dịch tạo đơn (utils/giuCho.js). ma_payos = mã phiên.
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_phien_thanh_toan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      than TEXT NOT NULL,
      tong INTEGER NOT NULL,
      phone TEXT,
      giu_vi INTEGER NOT NULL DEFAULT 0,
      phone_me TEXT,
      giu_vi_me INTEGER NOT NULL DEFAULT 0,
      con_lai INTEGER NOT NULL,
      cach TEXT NOT NULL,
      ma_payos INTEGER UNIQUE,
      noi_dung TEXT,
      qr TEXT,
      checkout_url TEXT,
      trang_thai TEXT NOT NULL DEFAULT 'cho',
      het_han TEXT NOT NULL,
      order_id INTEGER,
      nguon TEXT,
      ly_do TEXT,
      nguoi_xac_nhan TEXT,
      luc_chot TEXT,
      nguoi_tao TEXT NOT NULL,
      tao_luc TEXT NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_phien_giu ON pos_phien_thanh_toan(trang_thai, het_han)`);
  // P3: mỗi báo payOS (đã đúng chữ ký) một dòng, CHỈ THÊM. khoa = orderCode:reference — báo lặp dừng ở UNIQUE.
  // ket_qua: khop (đã tạo đơn) · chua_khop (tiền về mà không tạo đơn → Đối soát ĐỎ) · khong_phien (vàng) · that_bai (payOS báo không thành).
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_payos_su_kien (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      khoa TEXT UNIQUE NOT NULL,
      ma_payos INTEGER,
      so_tien INTEGER,
      ket_qua TEXT NOT NULL,
      ly_do TEXT,
      du_lieu TEXT,
      luc TEXT NOT NULL
    )
  `);
  // P3: nhật ký đặt / xoá PIN khách (CHỈ THÊM) — viec: dat_quay · dat_app · xoa.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_nhat_ky_pin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      viec TEXT NOT NULL,
      ly_do TEXT,
      nguoi TEXT,
      luc TEXT NOT NULL
    )
  `);
  // P3: đếm PIN sai + khoá đến lúc nào (pin_code đã có từ đầu, nay lưu BĂM bcrypt).
  for (const cot of ['pin_sai INTEGER NOT NULL DEFAULT 0', 'pin_khoa_den TEXT']) {
    try { await db.execute(`ALTER TABLE pos_customers ADD COLUMN ${cot}`); } catch (e) { /* cột đã có */ }
  }

  console.log('✅ Đã tạo tất cả các bảng');
}

/**
 * Tạo dữ liệu mặc định
 */
async function seedDefaultData() {
  const bcrypt = require('bcryptjs');

  // Tạo admin mặc định
  const adminExists = await query("SELECT COUNT(*) as count FROM pos_users WHERE username = 'admin'");
  if (adminExists[0]?.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    await run(`
      INSERT INTO pos_users (username, password, display_name, role, is_active)
      VALUES (?, ?, ?, ?, ?)
    `, ['admin', hashedPassword, 'Owner', 'owner', 1]);
    console.log('✅ Đã tạo tài khoản admin mặc định (admin/admin123)');
  }

  // Tạo phân quyền mặc định
  const permissionsExist = await query("SELECT COUNT(*) as count FROM pos_permissions");
  if (permissionsExist[0]?.count === 0) {
    const permissions = [
      ['owner', 'view_customer_balance', 1],
      ['owner', 'topup_balance', 1],
      ['owner', 'adjust_balance', 1],
      ['owner', 'view_reports', 1],
      ['owner', 'manage_products', 1],
      ['owner', 'manage_users', 1],
      ['owner', 'approve_refund', 1],
      ['owner', 'export_data', 1],
      ['owner', 'import_data', 1],
      ['owner', 'cancel_order', 1],
      ['owner', 'view_all_orders', 1],
      ['owner', 'manage_promotions', 1],
      ['owner', 'manage_permissions', 1],
      ['staff', 'view_customer_balance', 1],
      ['staff', 'topup_balance', 1],
      ['staff', 'adjust_balance', 0],
      ['staff', 'view_reports', 0],
      ['staff', 'manage_products', 0],
      ['staff', 'manage_users', 0],
      ['staff', 'approve_refund', 0],
      ['staff', 'export_data', 0],
      ['staff', 'import_data', 0],
      ['staff', 'cancel_order', 1],
      ['staff', 'view_all_orders', 0],
      ['staff', 'manage_promotions', 0],
      ['staff', 'manage_permissions', 0],
      // Manager permissions
      ['manager', 'view_customer_balance', 1],
      ['manager', 'topup_balance', 1],
      ['manager', 'adjust_balance', 0],
      ['manager', 'view_reports', 1],
      ['manager', 'manage_products', 1],
      ['manager', 'manage_users', 0],
      ['manager', 'approve_refund', 1],
      ['manager', 'export_data', 1],
      ['manager', 'import_data', 1],
      ['manager', 'cancel_order', 1],
      ['manager', 'view_all_orders', 1],
      ['manager', 'manage_promotions', 1],
      ['manager', 'manage_permissions', 0],
    ];

    for (const [role, permission, allowed] of permissions) {
      await run(`
        INSERT OR IGNORE INTO pos_permissions (role, permission, allowed)
        VALUES (?, ?, ?)
      `, [role, permission, allowed]);
    }
    console.log('✅ Đã tạo phân quyền mặc định');
  }
  // P26c (Q4): quyền hoàn gói trả trước (huỷ / xoá đơn mua gói) — mặc định chỉ owner (H9). Chạy MỌI lần khởi động: kho mới và kho
  // ĐANG CHẠY (bảng quyền đã có dữ liệu) đều có; INSERT OR IGNORE không đè quyền chủ quán đã chỉnh.
  for (const [role, allowed] of [['owner', 1], ['staff', 0], ['manager', 0]]) {
    await run(`INSERT OR IGNORE INTO pos_permissions (role, permission, allowed) VALUES (?, 'refund_package', ?)`, [role, allowed]);
  }
  // P3: xác nhận tay chuyển khoản + xoá PIN khách — owner / manager 1, staff 0. Chạy mọi lần khởi động như refund_package.
  for (const quyen of ['xac_nhan_ck_tay', 'xoa_pin_khach']) {
    for (const [role, allowed] of [['owner', 1], ['manager', 1], ['staff', 0]]) {
      await run(`INSERT OR IGNORE INTO pos_permissions (role, permission, allowed) VALUES (?, ?, ?)`, [role, quyen, allowed]);
    }
  }
  // P3: cờ "chuyển khoản / trừ tài khoản chỉ qua phiên" — mặc định 0 (đường cũ như cũ), chủ quán bật khi BH-1 lên quầy.
  await run(`INSERT OR IGNORE INTO pos_settings (key, value) VALUES ('thanh_toan_payos_bat_buoc', '0')`);
  // UUDAI-1: mã giảm "dùng chung với giá hạng" theo loại — mặc định '1' (cộng, như cách đang chạy). Quà đổi điểm luôn dùng chung.
  for (const khoa of ['uudai_chung_hang_percent', 'uudai_chung_hang_fixed', 'uudai_chung_hang_item']) {
    await run(`INSERT OR IGNORE INTO pos_settings (key, value) VALUES (?, '1')`, [khoa]);
  }

  // Tạo sản phẩm mẫu
  const productsExist = await query("SELECT COUNT(*) as count FROM pos_products");
  if (productsExist[0]?.count === 0) {
    const products = [
      ['CT1', 'Hồng Tân Sinh', 'juice', 0, 'túi', 'juice', 1],
      ['CT2', 'Lục Tân Khí', 'juice', 0, 'túi', 'juice', 2],
      ['CT3', 'Cam Tân Dưỡng', 'juice', 0, 'túi', 'juice', 3],
      ['CT4', 'Công thức 4', 'juice', 0, 'túi', 'juice', 4],
      ['CT5', 'Công thức 5', 'juice', 0, 'túi', 'juice', 5],
      ['CT6', 'Công thức 6', 'juice', 0, 'túi', 'juice', 6],
      ['CT7', 'Công thức 7', 'juice', 0, 'túi', 'juice', 7],
      ['CT8', 'Công thức 8', 'juice', 0, 'túi', 'juice', 8],
    ];

    for (const [code, name, category, price, unit, sx_type, sx_id] of products) {
      await run(`
        INSERT INTO pos_products (code, name, category, price, unit, sx_product_type, sx_product_id, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [code, name, category, price, unit, sx_type, sx_id, sx_id]);
    }
    console.log('✅ Đã tạo sản phẩm mẫu (giá = 0, cần cập nhật sau)');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SEED DỮ LIỆU MẶC ĐỊNH CHO pos_settings (MỚI - Phase A)
  // ═══════════════════════════════════════════════════════════════════════════
  const settingsExist = await query("SELECT COUNT(*) as count FROM pos_settings");
  if (settingsExist[0]?.count === 0) {
    const defaultSettings = [
      // Thông tin cửa hàng
      ['store_name', 'TÚ QUÝ ĐƯỜNG'],
      ['store_address', 'LK4 - 129 Trương Định, Tương Mai, Hà Nội'],
      ['store_phone', '024 2245 5565'],
      ['store_slogan', ''],
      ['store_tax_id', ''],
      ['store_logo', ''],

      // Cài đặt in
      ['invoice_default_size', 'a5'],
      ['invoice_quick_size', '80mm'],
      ['invoice_copies', '1'],
      ['invoice_auto_print', 'false'],

      // Nội dung hiển thị
      ['invoice_show_logo', 'true'],
      ['invoice_show_store_name', 'true'],
      ['invoice_show_address', 'true'],
      ['invoice_show_phone', 'true'],
      ['invoice_show_slogan', 'false'],
      ['invoice_show_invoice_number', 'true'],
      ['invoice_show_order_code', 'true'],
      ['invoice_show_datetime', 'true'],
      ['invoice_show_staff', 'true'],
      ['invoice_show_customer_name', 'true'],
      ['invoice_show_customer_phone', 'false'],
      ['invoice_show_products', 'true'],
      ['invoice_show_subtotal', 'true'],
      ['invoice_show_discount', 'true'],
      ['invoice_show_total', 'true'],
      ['invoice_show_cash_received', 'true'],
      ['invoice_show_change', 'true'],
      ['invoice_show_payment_method', 'true'],
      ['invoice_show_qr_lookup', 'true'],
      ['invoice_show_qr_zalo', 'false'],
      ['invoice_show_vat', 'false'],

      // Lời nhắn
      ['invoice_thank_you', 'Cảm ơn quý khách đã mua hàng!'],
      ['invoice_policy', 'Đổi trả trong 24h với hóa đơn'],
      ['invoice_note', ''],

      // HD-1: chữ hoá đơn + tem (mỗi chữ một khoá; mục ẩn = invoice_an_<khoá>; ten_quan / dia_chi theo store_*) — mặc định khớp utils/hoaDon.js CHU_MAC_DINH
      ['invoice_so_to', '2'],
      ['invoice_kh_url', ''],
      ['invoice_chu_so_bill', 'SỐ BILL'],
      ['invoice_chu_lien_khach', 'GIAO KHÁCH'],
      ['invoice_chu_lien_luu', 'LƯU QUẦY'],
      ['invoice_chu_chu_qr', 'Quét để đăng ký tài khoản — mã điểm điền sẵn'],
      ['invoice_chu_gia_goc', 'Giá gốc'],
      ['invoice_chu_giam_hang', 'Giảm hạng {hang} {phan_tram}%'],
      ['invoice_chu_giam_flash', 'Giảm Flash sale'],
      ['invoice_chu_giam_ma', 'Giảm mã / quà'],
      ['invoice_chu_phi_giao', 'Phí giao Ahamove'],
      ['invoice_chu_tong', 'TỔNG HÓA ĐƠN'],
      ['invoice_chu_tieu_de_tt', 'THANH TOÁN'],
      ['invoice_chu_tu_tk', 'Từ tài khoản'],
      ['invoice_chu_tu_tk_me', 'Từ tài khoản mẹ'],
      ['invoice_chu_ck', 'Chuyển khoản (payOS)'],
      ['invoice_chu_tm', 'Tiền mặt'],
      ['invoice_chu_ghi_no', 'Ghi nợ'],
      ['invoice_chu_dua_tra', 'Khách đưa / Trả lại'],
      ['invoice_chu_tieu_de_diem', 'ĐIỂM THƯỞNG'],
      ['invoice_chu_diem_truoc', 'Điểm trước đơn'],
      ['invoice_chu_diem_doi', 'Đổi quà'],
      ['invoice_chu_diem_cong', 'Cộng đơn này'],
      ['invoice_chu_diem_co', 'Điểm hiện có'],
      ['invoice_chu_ma_diem', 'MÃ NHẬN ĐIỂM · +{diem} điểm (nhập trong {gio} giờ)'],
      ['invoice_chu_ma_uu_dai', 'MÃ ƯU ĐÃI KHÁCH MỚI (nhập trong {gio} giờ)'],
      ['invoice_chu_cam_on', 'Cảm ơn {ten_khach}!'],
      ['invoice_chu_chinh_sach', 'Ly có vấn đề? Báo quầy trong ngày để đổi.'],
      ['invoice_chu_ghi_chu', ''],
      ['invoice_chu_da_huy', 'ĐƠN ĐÃ HUỶ'],
      ['invoice_chu_da_hoan', 'ĐƠN ĐÃ HOÀN TIỀN'],
      ['invoice_chu_in_lai', 'IN LẠI · LẦN {lan}'],
      ['invoice_chu_nhan_khach', 'Khách'],
      ['invoice_chu_nhan_nv', 'NV'],
      ['invoice_chu_tem_in_lai', 'IN LẠI'],
      ['invoice_chu_tem_dau', ''],
      ['invoice_chu_tem_chan', ''],

      // Zalo (chuẩn bị sẵn)
      ['zalo_enabled', 'false'],
      ['zalo_oa_id', ''],
      ['zalo_template_id', ''],
      ['zalo_access_token', ''],

      // Email (chuẩn bị sẵn)
      ['email_enabled', 'false'],
      ['email_smtp_host', ''],
      ['email_smtp_port', ''],
      ['email_smtp_user', ''],
      ['email_smtp_pass', ''],
      ['email_from', ''],
      ['email_template', ''],
    ];

    for (const [key, value] of defaultSettings) {
      await run(`
        INSERT OR IGNORE INTO pos_settings (key, value, updated_at)
        VALUES (?, ?, datetime('now', '+7 hours'))
      `, [key, value]);
    }
    console.log('✅ Đã tạo cài đặt mặc định cho hóa đơn');
  }

  // ─── LOY-1: cấu hình điểm thưởng (idempotent — INSERT OR IGNORE, chạy cả trên DB đã có) ───
  // Chỉ seed 3 key v1 THỰC ĐỌC. Các key để dành (therapy_multiplier, earn_base, tiers_enabled)
  // seed sau, đúng lúc GĐ3/LOY-4 nối tới — tránh cấu hình chưa ai đọc.
  const loyaltyDefaults = [
    ['loyalty_enabled', 'true'],              // bật/tắt cả hệ điểm
    ['loyalty_earn_per_amount', '10000'],     // mỗi 10.000đ = 1 điểm
    ['loyalty_expiry_mode', 'none'],          // 'none' = không hết hạn (mặc định v1) | 'quarter' = cuốn chiếu theo quý
  ];
  for (const [key, value] of loyaltyDefaults) {
    await run(`
      INSERT OR IGNORE INTO pos_settings (key, value, updated_at)
      VALUES (?, ?, datetime('now', '+7 hours'))
    `, [key, value]);
  }
  console.log('✅ Đã đảm bảo cấu hình điểm thưởng (LOY-1)');

  // ─── FLASH SALE (F1): cấu hình giảm giá theo khung giờ (giờ VN), chọn món theo (type,id) ───
  const flashDefaults = [
    ['flash_enabled', 'false'],       // mặc định TẮT — bật khi owner sẵn sàng
    ['flash_start', '19:00'],         // giờ bắt đầu (HH:mm, giờ Việt Nam)
    ['flash_end', '20:00'],           // giờ kết thúc
    ['flash_percent', '50'],          // % giảm
    ['flash_product_keys', '[]'],     // JSON mảng unique_id "type_id" các món được sale
  ];
  for (const [key, value] of flashDefaults) {
    await run(`
      INSERT OR IGNORE INTO pos_settings (key, value, updated_at)
      VALUES (?, ?, datetime('now', '+7 hours'))
    `, [key, value]);
  }
  console.log('✅ Đã đảm bảo cấu hình flash sale (F1)');

  // ─── TIER-1a: hạng thành viên (giảm % theo hạng, lên hạng theo tổng tiền mua tích lũy) ───
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_membership_tiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      card_price REAL NOT NULL DEFAULT 0,
      discount_percent REAL NOT NULL DEFAULT 0,
      special_discount_percent REAL NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT
    )
  `);
  // TIER-2 (06.08.2026): % giảm RIÊNG cho nhóm SP đặc biệt (vd cà phê) — khác % giảm thường.
  // Bảng cũ (đã tồn tại) chưa có cột này → thêm bằng ALTER.
  try {
    await db.execute(`ALTER TABLE pos_membership_tiers ADD COLUMN special_discount_percent REAL NOT NULL DEFAULT 0`);
  } catch (e) {
    // Cột đã tồn tại — bỏ qua
  }
  // TIER-1a-v2 (01.08.2026): đổi ý nghĩa cột — không còn là "ngưỡng tích lũy" mà là
  // "giá bán thẻ hội viên" (owner quyết định: mua thẻ mới lên hạng, mua hàng thường chỉ tích điểm).
  // Bảng cũ (nếu đã tồn tại từ TIER-1a) còn cột min_spend → đổi tên, giữ nguyên giá trị owner đã chỉnh.
  try {
    await db.execute(`ALTER TABLE pos_membership_tiers RENAME COLUMN min_spend TO card_price`);
    console.log('✅ TIER-1a-v2: đã đổi tên cột min_spend → card_price');
  } catch (e) {
    // Bảng mới tạo đã có sẵn card_price, hoặc đã đổi tên trước đó — bỏ qua
  }
  // Seed 3 hạng mặc định CHỈ khi bảng rỗng (owner sửa tên/giá/% sau)
  const tierCnt = await db.execute('SELECT COUNT(*) AS c FROM pos_membership_tiers');
  if (Number(tierCnt.rows[0].c) === 0) {
    const tierDefaults = [
      ['Vàng', 500000, 5, 1],
      ['Bạch Kim', 2000000, 8, 2],   // P26c (D5): chỉ hai hạng — CLAUDE.md §5.6
    ];
    for (const [name, price, pct, so] of tierDefaults) {
      await run(`
        INSERT INTO pos_membership_tiers (name, card_price, discount_percent, sort_order, is_active, updated_at)
        VALUES (?, ?, ?, ?, 1, datetime('now', '+7 hours'))
      `, [name, price, pct, so]);
    }
  }
  // Cấu hình làm tròn giá hạng (dùng ở TIER-2) + số tháng hiệu lực thẻ (chung mọi hạng, TIER-1a-v2).
  // Mặc định: tròn GẦN NHẤT tới 500đ · thẻ có hạn 3 tháng.
  const tierSettings = [
    ['tier_round_to', '500'],
    ['tier_round_mode', 'nearest'],
    ['tier_card_valid_months', '3'],
  ];
  for (const [key, value] of tierSettings) {
    await run(`
      INSERT OR IGNORE INTO pos_settings (key, value, updated_at)
      VALUES (?, ?, datetime('now', '+7 hours'))
    `, [key, value]);
  }
  console.log('✅ Đã đảm bảo cấu hình hạng thành viên (TIER-1a-v2)');

  // ─── TIER-1c (05.08.2026): sổ ghi mua thẻ hội viên — CHỈ THÊM DÒNG, không sửa/xóa.
  // Mua thẻ đi qua ĐÚNG luồng bán hàng thường (giỏ hàng → thanh toán tiền mặt/CK như 1 sản phẩm,
  // giống hệt cách "mua gói" đã có) — nên không cần lưu payment_method riêng, chỉ cần liên kết
  // về đơn hàng thật (order_id) để xem chi tiết thanh toán khi cần.
  // Hạng hiện tại của khách = dòng MỚI NHẤT còn hạn (expires_at > hiện tại) trong bảng này.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_membership_purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_phone TEXT NOT NULL,
      tier_id INTEGER NOT NULL,
      tier_name TEXT NOT NULL,
      price_paid REAL NOT NULL DEFAULT 0,
      order_id INTEGER,
      purchased_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_by TEXT
    )
  `);
  console.log('✅ Đã đảm bảo bảng mua thẻ hội viên (TIER-1c)');

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG: NHÓM SẢN PHẨM (dùng chung, tách khỏi is_special_group của TIER)
  // Mục đích: 1 sản phẩm có thể vừa thuộc nhóm giá TIER, vừa thuộc nhóm khác
  // (vd nhóm áp voucher khách-mới) — độc lập nhau, không lẫn ý nghĩa.
  // Khoá theo (sx_product_type, sx_product_id) — đúng khoá bất biến toàn hệ,
  // không theo `code`/tên (code có thể đổi, id SX thì không).
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_product_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_product_group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL REFERENCES pos_product_groups(id),
      sx_product_type TEXT NOT NULL,
      sx_product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(group_id, sx_product_type, sx_product_id)
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_group_members_group ON pos_product_group_members(group_id)`);

  // Seed đúng 1 nhóm cần dùng ngay bây giờ (voucher khách-mới) — không dựng UI
  // tạo/xoá nhóm tuỳ ý vì hiện chỉ có 1 nhu cầu thật; owner chỉ tick sản phẩm
  // vào/ra nhóm có sẵn này. Khi có nhu cầu thứ 2 thật sự mới đáng thêm UI quản lý nhóm.
  await db.execute(`
    INSERT INTO pos_product_groups (code, name)
    SELECT 'khach_moi', 'Ưu đãi khách mới'
    WHERE NOT EXISTS (SELECT 1 FROM pos_product_groups WHERE code = 'khach_moi')
  `);
  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG: MÃ ƯU ĐÃI KHÁCH MỚI (Bước 3, 08.08.2026) — in trên bill, đổi lấy tài khoản App KH
  // 2 tầng hạn TÁCH BIỆT, đừng gộp chung 1 cột:
  //   - issued_at/CODE_EXPIRE_HOURS (hằng số 24h, xem signup-codes.js): cửa sổ để claim
  //   - claimed_at + voucher sinh ra sau claim có hạn riêng (30 ngày, tính ở bước claim)
  // is_signup_code KHÔNG cần cột riêng — INERT hoàn toàn với đơn hàng/tiền: chỉ đọc
  // customer_phone của đơn để quyết định có in mã hay không, không ghi ngược lại đơn hàng.
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_signup_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      order_id INTEGER,
      order_customer_phone TEXT,
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      claimed_at DATETIME,
      claimed_phone TEXT
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_signup_code ON pos_signup_codes(code)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_signup_claimed_phone ON pos_signup_codes(claimed_phone)`);
  console.log('✅ Đã đảm bảo bảng mã ưu đãi khách mới (pos_signup_codes)');

  // POS-NHANDIEM-v1: đánh dấu mã đã dùng để NHÂN ĐIỂM (khác với claimed_at
  // là đã dùng để đổi voucher — hai việc độc lập, bật/tắt riêng).
  try {
    await db.execute(`ALTER TABLE pos_signup_codes ADD COLUMN diem_nhan_luc DATETIME`);
  } catch (e) { /* cột đã tồn tại */ }
  try {
    await db.execute(`ALTER TABLE pos_signup_codes ADD COLUMN diem_nhan_phone TEXT`);
  } catch (e) { /* cột đã tồn tại */ }

  // Cấu hình mặc định — chỉ chèn khi CHƯA có, không đè cấu hình owner đã đặt.
  // Mặc định TẮT vì App KH chưa có; bật lúc nào là việc của chủ quán.
  for (const [k, v] of [
    ['nhandiem_enabled', '0'],
    ['nhandiem_he_so', '2'],
    ['nhandiem_han_gio', '24'],
    ['nhandiem_chi_lan_dau', '1'],
  ]) {
    try {
      await db.execute({
        sql: `INSERT INTO pos_settings (key, value) VALUES (?, ?)
                ON CONFLICT(key) DO NOTHING`,
        args: [k, v],
      });
    } catch (e) { /* đã có hoặc bảng chưa sẵn — bỏ qua */ }
  }
  console.log('✅ Đã đảm bảo cấu hình nhân điểm từ mã bill (POS-NHANDIEM-v1)');
}

/**
 * Lưu database - Turso tự động lưu, giữ function này để tương thích
 */
function saveDatabase() {
  // Turso tự động lưu, không cần làm gì
}

/**
 * Lấy instance database
 */
function getDb() {
  return db;
}

/**
 * Chuẩn hóa tham số trước khi gắn vào câu lệnh SQL.
 * @libsql/client (Turso) chỉ chấp nhận: null, number, bigint, string, Uint8Array.
 * - undefined  -> null  (vd: PUT chỉ gửi 1 trường, các trường khác là undefined)
 * - true/false -> 1/0   (libsql không chấp nhận kiểu boolean)
 * Nhờ đó tránh lỗi "Unsupported type of value".
 * @param {Array} params
 * @returns {Array}
 */
function sanitizeArgs(params = []) {
  if (!Array.isArray(params)) return params;
  return params.map(v => {
    if (v === undefined) return null;
    if (typeof v === 'boolean') return v ? 1 : 0;
    return v;
  });
}

/**
 * Query helper - SELECT (ASYNC)
 * @param {string} sql - SQL query
 * @param {Array} params - Parameters
 * @returns {Promise<Array>} - Array of rows
 */
async function query(sql, params = []) {
  try {
    const result = await db.execute({
      sql: sql,
      args: sanitizeArgs(params)
    });
    // Chuyển đổi rows thành array of objects
    return result.rows.map(row => ({ ...row }));
  } catch (err) {
    console.error('Query error:', err.message);
    thayKetNoiNeuBan(err);
    throw err;
  }
}

/**
 * Query helper - SELECT một dòng (ASYNC)
 * @param {string} sql - SQL query
 * @param {Array} params - Parameters
 * @returns {Promise<Object|null>} - Single row or null
 */
async function queryOne(sql, params = []) {
  const results = await query(sql, params);
  return results[0] || null;
}

// P26a — kho trả lastInsertRowid dạng BigInt; res.json không chuyển được → route ghi xong rồi báo 500. Đổi ở gốc.
const soDong = (v) => (v == null ? v : Number(v));

/**
 * Run helper - INSERT/UPDATE/DELETE (ASYNC)
 * @param {string} sql - SQL statement
 * @param {Array} params - Parameters
 * @returns {Promise<Object>} - { lastInsertRowid, changes }
 */
async function run(sql, params = []) {
  try {
    const result = await db.execute({
      sql: sql,
      args: sanitizeArgs(params)
    });

    return {
      lastInsertRowid: soDong(result.lastInsertRowid),
      changes: result.rowsAffected
    };
  } catch (err) {
    console.error('Run error:', err.message);
    thayKetNoiNeuBan(err);
    throw err;
  }
}

/**
 * P26d — lỗi "kho bận" (chưa ghi gì, bấm lại được). MỘT chỗ nhận dạng, dùng cho thử lại BEGIN và loiGhi (wallets.js → 409 KHO_BAN).
 * Kho file: LibsqlError code 'SQLITE_BUSY' (rawCode 5). Turso: @libsql/client chuyển NGUYÊN mã máy chủ; chủ quán chốt khớp thêm
 * SQLITE_BUSY_* và TRANSACTION_BUSY (CHƯA KIỂM: chưa thử Turso thật). Mã khác (TRANSACTION_CLOSED, TRANSACTION_TIMEOUT…) KHÔNG phải bận.
 */
const MA_BAN = /^(SQLITE_BUSY|TRANSACTION_BUSY)(_|$)/;
function laLoiBan(err) {
  return MA_BAN.test(String((err && err.code) || ''));
}

// P26d — BEGIN gặp bận: chờ tăng dần rồi mở lại; hết lượt thì ném lỗi bận (route trả 409 KHO_BAN). Tổng 1,55 s.
const CHO_BEGIN_MS = [50, 100, 200, 400, 800];
const cho = (ms) => new Promise((xong) => setTimeout(xong, ms));

// P26d — kho FILE: câu bị bận không được reset, kết nối dùng chung hỏng (lệnh ghi sau báo xong mà MẤT, COMMIT sau lỗi
// "SQL statements in progress"). Thay client mới; giao dịch đang mở giữ kết nối riêng nên không ảnh hưởng. Gọi ở run(), query()
// (SELECT bận cũng làm hỏng kết nối, lộ ở giao dịch THỨ HAI — Q8a, ca D10) và vòng BEGIN. Turso (HTTP) không
// đụng — đóng client sẽ huỷ các yêu cầu đang bay của người khác.
function thayKetNoiNeuBan(err) {
  if (!laLoiBan(err) || db.protocol !== 'file') return;
  try { db.close(); } catch (e) { /* đã đóng */ }
  db = createClient(cauHinhTurso().cauHinh);
}

/**
 * Transaction helper - Bọc nhiều SQL trong 1 giao dịch atomic (BEGIN IMMEDIATE = khoá ghi độc quyền)
 * Nếu bất kỳ bước nào lỗi → rollback tất cả
 * P26d — mở LƯỜI: giao dịch thật mở ở câu ĐẦU (Turso vốn gửi BEGIN gộp với câu đầu; kho file BEGIN lúc db.transaction()).
 * MỘT khối thử lại bọc "mở + câu đầu": lỗi bận → đóng giao dịch hỏng, thay kết nối (kho file), chờ, mở lại, chạy lại câu đầu
 * (câu đầu CHƯA chạy vì BEGIN hỏng). Lỗi khác → ném ngay. Từ câu thứ hai không thử lại. Chưa có câu nào thì commit / rollback
 * không làm gì. Trả object literal, hàm dùng closure (bài thử trải `{ ...tx }`).
 * @returns {Object} - { query, queryOne, run, commit, rollback }
 */
async function beginTransaction() {
  let tx = null;
  const chay = async (sql, params) => {
    const cau = { sql, args: sanitizeArgs(params) };
    if (tx) return tx.execute(cau);
    for (let lan = 0; ; lan++) {
      try {
        tx = await db.transaction("write");
        return await tx.execute(cau);
      } catch (err) {
        if (!laLoiBan(err)) throw err;
        if (tx) { try { tx.close(); } catch (e) { /* đã đóng */ } tx = null; }
        thayKetNoiNeuBan(err);
        if (lan >= CHO_BEGIN_MS.length) throw err;
        await cho(CHO_BEGIN_MS[lan]);
      }
    }
  };
  return {
    async query(sql, params = []) {
      const result = await chay(sql, params);
      return result.rows.map(row => ({ ...row }));
    },
    async queryOne(sql, params = []) {
      const result = await chay(sql, params);
      return result.rows[0] ? { ...result.rows[0] } : null;
    },
    async run(sql, params = []) {
      const result = await chay(sql, params);
      return { lastInsertRowid: soDong(result.lastInsertRowid), changes: result.rowsAffected };
    },
    async commit() { if (tx) await tx.commit(); },
    async rollback() { try { if (tx) await tx.rollback(); } catch(e) {} }
  };
}

module.exports = {
  initDatabase,
  getDb,
  query,
  queryOne,
  run,
  beginTransaction,
  saveDatabase,
  laLoiBan,
  CHO_BEGIN_MS,
  layNangCapHong: () => nangCapHong
};
