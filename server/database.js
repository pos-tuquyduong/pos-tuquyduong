/**
 * POS System - Database Module
 * Sử dụng sql.js (SQLite in JavaScript)
 * 
 * THIẾT KẾ: phone làm định danh chính
 * - pos_wallets: quản lý số dư theo phone
 * - pos_balance_transactions: lịch sử giao dịch theo phone
 * - pos_customers: chỉ lưu thông tin khách (không có balance)
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db = null;

/**
 * Khởi tạo database
 */
async function initDatabase(dbPath = './data/pos.db') {
  const SQL = await initSqlJs();

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('✅ Đã load database từ file:', dbPath);
  } else {
    db = new SQL.Database();
    console.log('✅ Tạo database mới:', dbPath);
  }

  createTables();
  seedDefaultData();
  saveDatabase(dbPath);

  return db;
}

/**
 * Tạo tất cả các bảng
 */
function createTables() {
  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 1: NHÂN VIÊN
  // ═══════════════════════════════════════════════════════════════════════════
  db.run(`
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
  db.run(`
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
  db.run(`
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

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 4: SẢN PHẨM
  // ═══════════════════════════════════════════════════════════════════════════
  db.run(`
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 5: ĐƠN HÀNG
  // Dùng customer_phone làm key chính, customer_id chỉ để tham chiếu
  // ═══════════════════════════════════════════════════════════════════════════
  db.run(`
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
    db.run(`ALTER TABLE pos_orders ADD COLUMN invoice_number TEXT`);
    console.log('✅ Đã thêm cột invoice_number vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại, bỏ qua
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // MIGRATION V3: Hỗ trợ công nợ + thanh toán linh hoạt
  // ═══════════════════════════════════════════════════════════════════════════

  // Thêm cột payment_status vào pos_orders
  try {
    db.run(`ALTER TABLE pos_orders ADD COLUMN payment_status TEXT DEFAULT 'paid'`);
    console.log('✅ Đã thêm cột payment_status vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại
  }

  // Thêm cột debt_amount vào pos_orders (số tiền còn nợ)
  try {
    db.run(`ALTER TABLE pos_orders ADD COLUMN debt_amount REAL DEFAULT 0`);
    console.log('✅ Đã thêm cột debt_amount vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại
  }

  // Thêm cột due_date vào pos_orders (hạn thanh toán)
  try {
    db.run(`ALTER TABLE pos_orders ADD COLUMN due_date DATETIME`);
    console.log('✅ Đã thêm cột due_date vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại
  }

  // Thêm cột cash_amount vào pos_orders
  try {
    db.run(`ALTER TABLE pos_orders ADD COLUMN cash_amount REAL DEFAULT 0`);
    console.log('✅ Đã thêm cột cash_amount vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại
  }

  // Thêm cột transfer_amount vào pos_orders
  try {
    db.run(`ALTER TABLE pos_orders ADD COLUMN transfer_amount REAL DEFAULT 0`);
    console.log('✅ Đã thêm cột transfer_amount vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 6: CHI TIẾT ĐƠN HÀNG
  // ═══════════════════════════════════════════════════════════════════════════
  db.run(`
    CREATE TABLE IF NOT EXISTS pos_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_code TEXT,
      product_name TEXT,
      quantity INTEGER DEFAULT 1,
      unit_price REAL,
      total_price REAL,
      notes TEXT,
      sx_finished_product_id INTEGER,
      FOREIGN KEY (order_id) REFERENCES pos_orders(id),
      FOREIGN KEY (product_id) REFERENCES pos_products(id)
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 7: SỐ DƯ KHÁCH HÀNG (phone là key chính)
  // ═══════════════════════════════════════════════════════════════════════════
  db.run(`
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
  db.run(`
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
  // BẢNG 9: KHUYẾN MÃI
  // ═══════════════════════════════════════════════════════════════════════════
  db.run(`
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
  db.run(`
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
  db.run(`
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
  db.run(`
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
  db.run(`
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
  db.run(`
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
  db.run(`
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
  db.run(`
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
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_phone ON pos_customers(phone)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_parent ON pos_customers(parent_phone)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_sync ON pos_customers(sync_status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_type ON pos_customers(customer_type)`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_order_date ON pos_orders(created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_order_phone ON pos_orders(customer_phone)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_order_status ON pos_orders(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_order_invoice ON pos_orders(invoice_number)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_order_payment_status ON pos_orders(payment_status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_order_debt ON pos_orders(debt_amount)`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_wallet_phone ON pos_wallets(phone)`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_balance_phone ON pos_balance_transactions(customer_phone)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_balance_type ON pos_balance_transactions(type)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_balance_date ON pos_balance_transactions(created_at)`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_product_category ON pos_products(category)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_product_active ON pos_products(is_active)`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_registration_phone ON pos_registrations(phone)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_registration_status ON pos_registrations(status)`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_refund_phone ON pos_refund_requests(customer_phone)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_refund_status ON pos_refund_requests(status)`);

  // Index mới cho invoice_logs
  db.run(`CREATE INDEX IF NOT EXISTS idx_invoice_logs_order ON pos_invoice_logs(order_code)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_invoice_logs_date ON pos_invoice_logs(printed_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_invoice_logs_number ON pos_invoice_logs(invoice_number)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 17: MÃ CHIẾT KHẤU (MỚI)
  // ═══════════════════════════════════════════════════════════════════════════
  db.run(`
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

  // Index cho discount_codes
  db.run(`CREATE INDEX IF NOT EXISTS idx_discount_code ON pos_discount_codes(code)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_discount_active ON pos_discount_codes(is_active)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // MIGRATION: Thêm trường chiết khấu vào pos_customers
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    db.run(`ALTER TABLE pos_customers ADD COLUMN discount_type TEXT DEFAULT 'percent'`);
    console.log('✅ Đã thêm cột discount_type vào pos_customers');
  } catch (e) {
    // Cột đã tồn tại
  }

  try {
    db.run(`ALTER TABLE pos_customers ADD COLUMN discount_value REAL DEFAULT 0`);
    console.log('✅ Đã thêm cột discount_value vào pos_customers');
  } catch (e) {
    // Cột đã tồn tại
  }

  try {
    db.run(`ALTER TABLE pos_customers ADD COLUMN discount_note TEXT`);
    console.log('✅ Đã thêm cột discount_note vào pos_customers');
  } catch (e) {
    // Cột đã tồn tại
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MIGRATION: Thêm trường chiết khấu + shipping vào pos_orders
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    db.run(`ALTER TABLE pos_orders ADD COLUMN discount_type TEXT`);
    console.log('✅ Đã thêm cột discount_type vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại
  }

  try {
    db.run(`ALTER TABLE pos_orders ADD COLUMN discount_value REAL DEFAULT 0`);
    console.log('✅ Đã thêm cột discount_value vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại
  }

  try {
    db.run(`ALTER TABLE pos_orders ADD COLUMN discount_amount REAL DEFAULT 0`);
    console.log('✅ Đã thêm cột discount_amount vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại
  }

  try {
    db.run(`ALTER TABLE pos_orders ADD COLUMN discount_code TEXT`);
    console.log('✅ Đã thêm cột discount_code vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại
  }

  try {
    db.run(`ALTER TABLE pos_orders ADD COLUMN shipping_fee REAL DEFAULT 0`);
    console.log('✅ Đã thêm cột shipping_fee vào pos_orders');
  } catch (e) {
    // Cột đã tồn tại
  }

  console.log('✅ Đã tạo tất cả các bảng');
}

/**
 * Tạo dữ liệu mặc định
 */
function seedDefaultData() {
  const bcrypt = require('bcryptjs');

  // Tạo admin mặc định
  const adminExists = db.exec("SELECT COUNT(*) as count FROM pos_users WHERE username = 'admin'");
  if (adminExists[0]?.values[0][0] === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.run(`
      INSERT INTO pos_users (username, password, display_name, role, is_active)
      VALUES ('admin', '${hashedPassword}', 'Owner', 'owner', 1)
    `);
    console.log('✅ Đã tạo tài khoản admin mặc định (admin/admin123)');
  }

  // Tạo phân quyền mặc định
  const permissionsExist = db.exec("SELECT COUNT(*) as count FROM pos_permissions");
  if (permissionsExist[0]?.values[0][0] === 0) {
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

    permissions.forEach(([role, permission, allowed]) => {
      db.run(`
        INSERT OR IGNORE INTO pos_permissions (role, permission, allowed)
        VALUES ('${role}', '${permission}', ${allowed})
      `);
    });
    console.log('✅ Đã tạo phân quyền mặc định');
  }

  // Tạo sản phẩm mẫu
  const productsExist = db.exec("SELECT COUNT(*) as count FROM pos_products");
  if (productsExist[0]?.values[0][0] === 0) {
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

    products.forEach(([code, name, category, price, unit, sx_type, sx_id]) => {
      db.run(`
        INSERT INTO pos_products (code, name, category, price, unit, sx_product_type, sx_product_id, sort_order)
        VALUES ('${code}', '${name}', '${category}', ${price}, '${unit}', '${sx_type}', ${sx_id}, ${sx_id})
      `);
    });
    console.log('✅ Đã tạo sản phẩm mẫu (giá = 0, cần cập nhật sau)');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SEED DỮ LIỆU MẶC ĐỊNH CHO pos_settings (MỚI - Phase A)
  // ═══════════════════════════════════════════════════════════════════════════
  const settingsExist = db.exec("SELECT COUNT(*) as count FROM pos_settings");
  if (settingsExist[0]?.values[0][0] === 0) {
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

    defaultSettings.forEach(([key, value]) => {
      db.run(`
        INSERT OR IGNORE INTO pos_settings (key, value, updated_at)
        VALUES ('${key}', '${value}', datetime('now', '+7 hours'))
      `);
    });
    console.log('✅ Đã tạo cài đặt mặc định cho hóa đơn');
  }
}

/**
 * Lưu database xuống file
 */
function saveDatabase(dbPath = './data/pos.db') {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

/**
 * Lấy instance database
 */
function getDb() {
  return db;
}

/**
 * Query helper - SELECT
 */
function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (err) {
    console.error('Query error:', err.message);
    throw err;
  }
}

/**
 * Query helper - SELECT một dòng
 */
function queryOne(sql, params = []) {
  const results = query(sql, params);
  return results[0] || null;
}

/**
 * Run helper - INSERT/UPDATE/DELETE
 */
function run(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    stmt.step();
    stmt.free();

    saveDatabase(process.env.DB_PATH || './data/pos.db');

    return {
      lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0][0],
      changes: db.getRowsModified()
    };
  } catch (err) {
    console.error('Run error:', err.message);
    throw err;
  }
}

module.exports = {
  initDatabase,
  getDb,
  query,
  queryOne,
  run,
  saveDatabase
};
