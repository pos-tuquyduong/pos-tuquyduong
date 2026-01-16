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

const app = express();
const PORT = process.env.PORT || 3000;

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

// API Routes
app.use('/api/pos/auth', authRoutes);
app.use('/api/pos/customers', customerRoutes);
app.use('/api/pos/products', productRoutes);
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

// Health check
app.get('/api/pos/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.1.0',
    service: 'POS System',
    design: 'phone-based identity',
    features: ['invoice-system']
  });
});

// API info
app.get('/api/pos', (req, res) => {
  res.json({
    name: 'POS System API',
    version: '2.1.0',
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
      sync: '/api/pos/sync',
      stock: '/api/pos/stock',
      reports: '/api/pos/reports',
      users: '/api/pos/users'
    }
  });
});

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
      console.log(`  🚀 POS System Server v2.1`);
      console.log(`  📍 http://localhost:${PORT}`);
      console.log(`  📊 API: http://localhost:${PORT}/api/pos`);
      console.log(`  🔑 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  📱 Design: phone-based identity`);
      console.log(`  🧾 Feature: Invoice System (Phase A)`);
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
