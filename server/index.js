/**
 * POS System - Main Server
 * Hệ thống bán hàng cho Juice Delivery
 * 
 * THIẾT KẾ: phone làm định danh chính
 * - Số dư: pos_wallets + wallets.js
 * - Đã bỏ balance.js (route cũ dùng customer_id)
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const { initDatabase } = require('./database');

// Import routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const donMoRongRoutes = require('./routes/don-mo-rong'); // POS-NEN-v1 (P19)
const refundRoutes = require('./routes/refunds');
const syncRoutes = require('./routes/sync');
const stockRoutes = require('./routes/stock');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const backupRoutes = require('./routes/backup');
// === ROUTES MỚI (Phase 2) - phone làm key chính ===
const walletsRoutes = require('./routes/wallets');
const registrationsRoutes = require('./routes/registrations');
const customersV2Routes = require('./routes/customers-v2');
// === ROUTES MỚI (Phase A) - Hệ thống hóa đơn ===
const settingsRoutes = require('./routes/settings');
// === ROUTES MỚI (Phase B) - Chiết khấu + Shipping ===
const discountCodesRoutes = require('./routes/discount-codes');
const rewardsRoutes = require('./routes/rewards');
const loyaltyRoutes = require('./routes/loyalty');
const flashRoutes = require('./routes/flash');
const tiersRoutes = require('./routes/tiers');
const productGroupsRoutes = require('./routes/product-groups');
const signupCodesRoutes = require('./routes/signup-codes');
const membershipRoutes = require('./routes/membership');
// === ROUTES MỚI (Phase E) - Báo cáo sự cố hàng hỏng ===
const damagesRoutes = require('./routes/damages');
const packagesRoutes = require('./routes/packages');
// POS-DODNO-v1: nguoi di doi so no
const soNoRoutes = require('./routes/so-no');
const { doNeuDenLuc } = require('./utils/doSoNo');

const app = express();
const PORT = process.env.PORT || 3000;
// KH-API-1 (Q5): sau proxy của Render, req.ip phải là IP khách (giới hạn xin / nhận mã theo IP) — tin ĐÚNG một tầng proxy.
// Số tầng proxy của Render máy chưa kiểm: lên production thì xem cột ip của pos_kh_lan_thu (nhận mã bill từ 2 mạng khác nhau).
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// ═══ POS-DODNO-v1 · LOP 1: doi so no an theo hoat dong ═══════════════════
// PHAI dat TRUOC moi duong /api/pos. Dat sau thi khong bao gio chay: yeu cau
// khop duong nao thi duong do tra loi va KHONG goi next() di tiep.
// KHONG dung hen gio: Render Free ngu khi khong ai dung, cron se hong CAM ma
// van tuong dang chay. Lay chinh viec ban hang lam dong ho.
// KHONG await: nguoi dung khong phai cho viec nay.
app.use('/api/pos', (req, res, next) => {
  try { doNeuDenLuc(); } catch (e) { /* khong bao gio chan nguoi dung */ }
  next();
});

// API Routes
app.use('/api/pos/auth', authRoutes);
app.use('/api/pos/customers', customerRoutes);
app.use('/api/pos/products', productRoutes);
// POS-NEN-v1: gắn TRƯỚC orderRoutes — nếu sau, /orders/cho-thu bị /orders/:id hiểu là một mã đơn
app.use('/api/pos/orders', donMoRongRoutes);
app.use('/api/pos/orders', orderRoutes);
app.use('/api/pos/refunds', refundRoutes);
app.use('/api/pos/sync', syncRoutes);
app.use('/api/pos/stock', stockRoutes);
app.use('/api/pos/reports', reportRoutes);
app.use('/api/pos/users', userRoutes);
app.use('/api/pos/permissions', userRoutes);
app.use('/api/pos/backup', backupRoutes);
// === API MỚI (Phase 2) ===
app.use('/api/pos/wallets', walletsRoutes);
app.use('/api/pos/registrations', registrationsRoutes);
app.use('/api/pos/v2/customers', customersV2Routes);
// === API MỚI (Phase A) - Hệ thống hóa đơn ===
app.use('/api/pos/settings', settingsRoutes);
// === API MỚI (Phase B) - Chiết khấu + Shipping ===
app.use('/api/pos/discount-codes', discountCodesRoutes);
app.use('/api/pos/rewards', rewardsRoutes);
app.use('/api/pos/loyalty', loyaltyRoutes);
app.use('/api/pos/flash', flashRoutes);
app.use('/api/pos/tiers', tiersRoutes);
app.use('/api/pos/product-groups', productGroupsRoutes);
app.use('/api/pos/signup-codes', signupCodesRoutes);
app.use('/api/pos/membership', membershipRoutes);
// === API MỚI (Phase E) - Báo cáo sự cố hàng hỏng ===
app.use('/api/pos/damages', damagesRoutes);
app.use('/api/pos/packages', packagesRoutes);
app.use('/api/pos/so-no', soNoRoutes);   // POS-DODNO-v1
app.use('/api/pos/doi-chieu', require('./routes/doi-chieu'));   // POS-DOICHIEU-v1
app.use('/api/pos/kh', require('./routes/kh/quay'));   // KH-API-1: nhân viên cấp mã đăng nhập App cho khách
// KH-API-1: cổng App KH — MỌI route xác thực bằng token khách chỉ ở đây (LUAT_XAY_APP §3)
app.use('/api/kh', require('./routes/kh'));
app.use('/api/kh', require('./routes/kh/loi').loiTangKh);   // KH-API-1 (G): JSON hỏng / thân quá lớn của /api/kh → { error, code }

// Health check
app.get('/api/pos/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.2.0',
    service: 'POS System',
    design: 'phone-based identity',
    features: ['invoice-system', 'discount-shipping']
  });
});

// API info
app.get('/api/pos', (req, res) => {
  res.json({
    name: 'POS System API',
    version: '2.2.0',
    design: 'phone làm định danh chính',
    endpoints: {
      auth: '/api/pos/auth',
      customers: '/api/pos/customers',
      products: '/api/pos/products',
      orders: '/api/pos/orders',
      refunds: '/api/pos/refunds',
      wallets: '/api/pos/wallets',
      registrations: '/api/pos/registrations',
      'customers-v2': '/api/pos/v2/customers',
      settings: '/api/pos/settings',
      'discount-codes': '/api/pos/discount-codes',
      sync: '/api/pos/sync',
      stock: '/api/pos/stock',
      reports: '/api/pos/reports',
      users: '/api/pos/users'
    }
  });
});

// KH-UI-1: App KH cùng dịch vụ, phục vụ theo tên miền. Chỉ khi KH_HOST đặt VÀ Host khớp (bỏ cổng, không phân biệt hoa/thường)
// và đường không phải /api/ → app_kh/dist (file tĩnh, rồi index.html cho đường lạ). Còn lại đi tiếp xuống quầy như cũ.
// Đọc Host thô, không req.hostname (trust proxy sẽ tin X-Forwarded-Host).
const laYeuCauAppKh = (req) => {
  const hostKh = (process.env.KH_HOST || '').trim().toLowerCase();
  const host = String(req.headers.host || '').split(':')[0].toLowerCase();
  return !!hostKh && host === hostKh && !req.path.startsWith('/api/');
};
const phucVuAppKh = express.static(path.join(__dirname, '../app_kh/dist'));
app.use((req, res, next) => (laYeuCauAppKh(req) ? phucVuAppKh(req, res, next) : next()));
app.get('/{*splat}', (req, res, next) => (
  laYeuCauAppKh(req) ? res.sendFile(path.join(__dirname, '../app_kh/dist/index.html')) : next()
));

// Serve static files (for production)
app.use(express.static(path.join(__dirname, '../client/dist')));

// SPA fallback (Express 5 syntax)
app.get('/{*splat}', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
async function startServer() {
  try {
    const dbPath = process.env.DB_PATH || './data/pos.db';
    await initDatabase(dbPath);
    console.log('✅ Database initialized');

    app.listen(PORT, () => {
      console.log('══════════════════════════════════════════════════');
      console.log(`  🚀 POS System Server v2.2`);
      console.log(`  📍 http://localhost:${PORT}`);
      console.log(`  📊 API: http://localhost:${PORT}/api/pos`);
      console.log(`  🔑 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  📱 Design: phone-based identity`);
      console.log(`  🧾 Feature: Invoice System (Phase A)`);
      console.log(`  💰 Feature: Discount + Shipping (Phase B)`);
      console.log('══════════════════════════════════════════════════');
      console.log('');
      console.log('  Default login: admin / admin123');
      console.log('');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
