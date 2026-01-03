# POS System - Hệ thống bán hàng

## Tổng quan

Hệ thống POS (Point of Sale) cho Juice Delivery, kết nối với hệ thống Sản xuất.

## Cấu trúc

```
pos-system/
├── server/                 # Backend (Express.js)
│   ├── index.js           # Server chính
│   ├── database.js        # SQLite database
│   ├── middleware/        # Auth middleware
│   ├── routes/            # API routes
│   └── utils/             # Helpers, SX API client
├── client/                # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/        # Các trang
│   │   ├── components/   # Components
│   │   ├── contexts/     # Auth context
│   │   └── utils/        # API client
│   └── dist/             # Build output
├── data/
│   └── pos.db            # SQLite database
└── .env                   # Cấu hình
```

## Cài đặt

```bash
# Backend
npm install

# Frontend
cd client && npm install
```

## Chạy ứng dụng

```bash
# Terminal 1: Backend (port 3001)
npm start

# Terminal 2: Frontend dev (port 5173)
cd client && npm run dev

# Hoặc build frontend rồi chạy cùng backend
cd client && npm run build
npm start  # Serve cả frontend
```

## Đăng nhập mặc định

- Username: `admin`
- Password: `admin123`

## Tính năng

### ✅ Đã hoàn thành

1. **Bán hàng**
   - Tìm khách hàng theo SĐT
   - Chọn sản phẩm từ grid
   - Hiển thị tồn kho realtime từ SX
   - Thanh toán: Tiền mặt, Chuyển khoản, Số dư
   - Tự động trừ số dư, xuất kho

2. **Khách hàng**
   - Danh sách với filter theo trạng thái sync
   - Thêm khách mới (subscription/mua lẻ)
   - Hỗ trợ 1 người mua cho nhiều người

3. **Số dư**
   - Nạp tiền (tiền mặt/chuyển khoản)
   - Xem lịch sử giao dịch
   - Điều chỉnh số dư (admin)

4. **Đơn hàng**
   - Danh sách đơn hàng theo ngày
   - Hủy đơn với yêu cầu hoàn tiền

5. **Đồng bộ**
   - Export khách mới ra CSV
   - Import CSV từ SX
   - Log lịch sử đồng bộ

6. **Hoàn tiền**
   - Danh sách yêu cầu chờ duyệt
   - Phê duyệt/Từ chối (admin)

7. **Báo cáo**
   - Báo cáo ngày
   - Doanh thu theo phương thức thanh toán
   - Sản phẩm bán chạy

8. **Cài đặt**
   - Quản lý giá bán sản phẩm
   - Quản lý nhân viên
   - Phân quyền linh hoạt

## API Endpoints

### Auth
- `POST /api/pos/auth/login`
- `POST /api/pos/auth/logout`
- `GET /api/pos/auth/me`

### Customers
- `GET /api/pos/customers`
- `GET /api/pos/customers/:id`
- `GET /api/pos/customers/phone/:phone`
- `POST /api/pos/customers`

### Balance
- `GET /api/pos/customers/:id/balance`
- `POST /api/pos/customers/:id/balance/topup`
- `POST /api/pos/customers/:id/balance/adjust`

### Products
- `GET /api/pos/products`
- `PUT /api/pos/products/:id/price`
- `PUT /api/pos/products/prices/batch`

### Orders
- `GET /api/pos/orders`
- `POST /api/pos/orders`
- `POST /api/pos/orders/:id/cancel`

### Sync
- `GET /api/pos/sync/status`
- `GET /api/pos/sync/export`
- `POST /api/pos/sync/import`

### Stock (từ SX)
- `GET /api/pos/stock`
- `GET /api/pos/stock/check`

## Kết nối với Sản xuất (SX)

### Biến môi trường

```env
SX_API_URL=http://localhost:3000
SX_API_KEY=your-api-key
```

### API SX cần có

1. `GET /api/finished-products` - Danh sách tồn kho
2. `GET /api/finished-products/check-stock` - Kiểm tra đủ hàng
3. `POST /api/finished-products/:id/out` - Xuất kho (đã có reference_type, reference_id)

## Database

SQLite với 11 bảng:
- pos_users
- pos_permissions
- pos_customers
- pos_products
- pos_orders
- pos_order_items
- pos_balance_transactions
- pos_promotions (để sẵn)
- pos_promotion_usage (để sẵn)
- pos_refund_requests
- pos_sync_logs

## Triển khai Railway

1. Push code lên GitHub
2. Tạo project mới trên Railway
3. Thêm biến môi trường
4. Deploy

---

Phiên bản: 1.0.0
Ngày tạo: 03/01/2025
