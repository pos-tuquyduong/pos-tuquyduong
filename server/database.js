/**
 * POS System - Database Module
 * Sử dụng sql.js (SQLite in JavaScript)
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
  
  // Đảm bảo thư mục data tồn tại
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Load database nếu đã tồn tại, hoặc tạo mới
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('✅ Đã load database từ file:', dbPath);
  } else {
    db = new SQL.Database();
    console.log('✅ Tạo database mới:', dbPath);
  }
  
  // Tạo các bảng
  createTables();
  
  // Tạo dữ liệu mặc định
  seedDefaultData();
  
  // Lưu database
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
  // BẢNG 3: KHÁCH HÀNG
  // ═══════════════════════════════════════════════════════════════════════════
  db.run(`
    CREATE TABLE IF NOT EXISTS pos_customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      notes TEXT,
      parent_phone TEXT,
      relationship TEXT,
      balance REAL DEFAULT 0,
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
  // ═══════════════════════════════════════════════════════════════════════════
  db.run(`
    CREATE TABLE IF NOT EXISTS pos_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      customer_id INTEGER,
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
      FOREIGN KEY (customer_id) REFERENCES pos_customers(id),
      FOREIGN KEY (promotion_id) REFERENCES pos_promotions(id)
    )
  `);

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
  // BẢNG 7: GIAO DỊCH SỐ DƯ
  // ═══════════════════════════════════════════════════════════════════════════
  db.run(`
    CREATE TABLE IF NOT EXISTS pos_balance_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      customer_phone TEXT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      balance_before REAL,
      balance_after REAL,
      reference_type TEXT,
      reference_id INTEGER,
      payment_method TEXT,
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES pos_customers(id)
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 8: KHUYẾN MÃI
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
  // BẢNG 9: LOG SỬ DỤNG KHUYẾN MÃI
  // ═══════════════════════════════════════════════════════════════════════════
  db.run(`
    CREATE TABLE IF NOT EXISTS pos_promotion_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      promotion_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      customer_id INTEGER,
      discount_amount REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (promotion_id) REFERENCES pos_promotions(id),
      FOREIGN KEY (order_id) REFERENCES pos_orders(id)
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 10: YÊU CẦU HOÀN TIỀN
  // ═══════════════════════════════════════════════════════════════════════════
  db.run(`
    CREATE TABLE IF NOT EXISTS pos_refund_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
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
      FOREIGN KEY (order_id) REFERENCES pos_orders(id),
      FOREIGN KEY (customer_id) REFERENCES pos_customers(id)
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // BẢNG 11: LOG ĐỒNG BỘ
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
  // INDEXES
  // ═══════════════════════════════════════════════════════════════════════════
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_phone ON pos_customers(phone)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_parent ON pos_customers(parent_phone)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_sync ON pos_customers(sync_status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_type ON pos_customers(customer_type)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_order_date ON pos_orders(created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_order_customer ON pos_orders(customer_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_order_status ON pos_orders(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_balance_customer ON pos_balance_transactions(customer_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_balance_type ON pos_balance_transactions(type)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_product_category ON pos_products(category)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_product_active ON pos_products(is_active)`);

  console.log('✅ Đã tạo tất cả các bảng');
}

/**
 * Tạo dữ liệu mặc định
 */
function seedDefaultData() {
  const bcrypt = require('bcryptjs');
  
  // Kiểm tra đã có admin chưa
  const adminExists = db.exec("SELECT COUNT(*) as count FROM pos_users WHERE username = 'admin'");
  if (adminExists[0]?.values[0][0] === 0) {
    // Tạo admin mặc định
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.run(`
      INSERT INTO pos_users (username, password, display_name, role, is_active)
      VALUES ('admin', '${hashedPassword}', 'Quản trị viên', 'admin', 1)
    `);
    console.log('✅ Đã tạo tài khoản admin mặc định (admin/admin123)');
  }

  // Tạo phân quyền mặc định
  const permissionsExist = db.exec("SELECT COUNT(*) as count FROM pos_permissions");
  if (permissionsExist[0]?.values[0][0] === 0) {
    const permissions = [
      // Admin có tất cả
      ['admin', 'view_customer_balance', 1],
      ['admin', 'topup_balance', 1],
      ['admin', 'adjust_balance', 1],
      ['admin', 'view_reports', 1],
      ['admin', 'manage_products', 1],
      ['admin', 'manage_users', 1],
      ['admin', 'approve_refund', 1],
      ['admin', 'export_data', 1],
      ['admin', 'import_data', 1],
      ['admin', 'cancel_order', 1],
      ['admin', 'view_all_orders', 1],
      ['admin', 'manage_promotions', 1],
      ['admin', 'manage_permissions', 1],
      // Staff mặc định
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
    ];

    permissions.forEach(([role, permission, allowed]) => {
      db.run(`
        INSERT OR IGNORE INTO pos_permissions (role, permission, allowed)
        VALUES ('${role}', '${permission}', ${allowed})
      `);
    });
    console.log('✅ Đã tạo phân quyền mặc định');
  }

  // Tạo sản phẩm mẫu (nước ép CT1-CT8 + trà)
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
    
    // Lưu database sau mỗi thay đổi
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
