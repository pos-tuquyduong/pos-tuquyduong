# KH-UI-1 — kế hoạch

Việc thường [Th], phiếu không dặn chờ duyệt → chạy thẳng.

## Phương án
| Phần | A (chọn) | B | Lý do |
|---|---|---|---|
| Phục vụ theo tên miền | một khối ≤ 25 dòng trong `server/index.js` trước "Serve static files": middleware chỉ chạy khi `KH_HOST` đặt và Host khớp, `express.static(app_kh/dist)` + trả `index.html` cho đường không phải `/api/` | file `server/utils/…` riêng | B ngoài Phạm vi |
| Điều hướng App | trạng thái `tab` trong `App.jsx`, 5 tab đáy: Menu · Điểm · Voucher · Đơn · Tôi (chi tiết đơn là trạng thái con của tab Đơn) | thêm router | phiếu cấm router |
| Nhận mã | một ô + hai nút ("Nhận ưu đãi khách mới" → `/nhan-ma-bill`, "Cộng điểm" → `/nhan-diem`), đặt trong tab Điểm; người chọn, máy không tự gọi cả hai | một nút tự đoán | phiếu: "không tự gọi cả hai" |
| Hàm thuần | `src/giaoDien/…` giữ màu/chữ/khoảng cách; `src/dinhDang.js` (giá, ngày, lời báo theo `code`) để bài thử nạp được | rải trong màn | (5) của bài thử |
| Bài thử | `cong_cu/thu_KHUI1.js` mở `node server/index.js` làm tiến trình con (index.js luôn `startServer()`, không `require` được) với `REPL_ID` → kho thử `data/pos_thu.db` (gitignore), cổng ngẫu nhiên | dựng Express giả | B không thử đúng khối thật |

Ước lượng: app ~650 dòng, `index.js` ~16 dòng, thử ~130 dòng.

## Ca thử ↔ nghiệm thu
- H1 `KH_HOST` chưa đặt → `/` = `client/dist/index.html` (G, H1)
- H2 đặt `KH_HOST`, Host đúng → `app_kh/dist/index.html`; Host khác → `client/dist` (G, H2)
- H2b Host đúng + đường lạ không phải file (`/diem`) → `index.html` App KH (SPA); Host đúng + `/api/pos/health` vẫn JSON của máy chủ (G: `/api/*` dùng chung)
- H2c Host khác `KH_HOST` nhưng chứa `KH_HOST` làm hậu tố / tiền tố (`xkh.test`, `kh.test.evil`) → `client/dist` (ca ngay trên/dưới ngưỡng, K3); Host có cổng (`kh.test:1234`) vẫn đúng
- H3 `/api/kh/menu` không token → 401 `KH_TOKEN_SAI` ở cả hai Host (B/C)
- H4 `app_kh/dist/index.html` trỏ tới file có thật (A)
- H5 hàm thuần: `dinhDangGia`, `loiTheoCode`, `dinhDangNgay`
- Luồng hợp lệ KHÔNG bị chặn (K5): quầy `client/dist/assets/*` vẫn tải ở Host quầy; `/api/pos/health` ở cả hai Host.
- A, B–F (màn hình) không có bài tự động trong phiếu: kiểm bằng `npm run build` + đọc code + J (thử tay). Ghi ở CHƯA KIỂM.

## Đường song song cần canh (K4)
Mọi `fetch` trong `app_kh/src/` nằm đúng `api.js` (grep `fetch(`); không chuỗi `/api/pos` trong `app_kh/src/`.

## Câu hỏi soát cho agent phụ
Tự soát (không gọi agent phụ riêng; `/ra-soat` ở bước 8 là soát độc lập): ngoài Phạm vi? không. Có cách ngắn hơn? đã chọn ít dòng nhất.
