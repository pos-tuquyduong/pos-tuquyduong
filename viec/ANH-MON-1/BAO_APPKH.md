# Báo chat App KH — ANH-MON-1 (POS, hợp đồng `/api/kh` v21 — sau v19 nhóm món, v20 topping)

**Việc là gì:** quán đã có ảnh nhỏ cho món. `GET /api/kh/menu` — trường `anh` của mỗi món trước đây luôn `null`, từ v19 là **đường dẫn ảnh** hoặc `null` (món chưa có ảnh).

**App KH cần làm**
1. Món có `anh` (chuỗi): hiện `<img src="<địa chỉ máy chủ POS><anh>">`, ví dụ `…/api/pos/products/anh/12/3fa9c1d2e4b7`. **Không** tự ghép đường dẫn — luôn lấy từ `/menu`.
2. `anh` là `null`, hoặc ảnh tải lỗi (404 / mạng): hiện chữ viết tắt trên nền màu như màn quầy (2 chữ cái đầu của 2 từ đầu tên món).
3. Đặt sẵn khung vuông cố định + `loading="lazy"` để ảnh tải chậm không làm nhảy bố cục.

**Cần biết**
- Đọc ảnh KHÔNG cần token (không gửi `Authorization`). Ảnh vuông 400 × 400, JPEG / PNG / WebP, ≤ 120 KB.
- Đường dẫn có phiên bản theo nội dung: quán đổi ảnh → `/menu` trả đường dẫn khác; ảnh trả `Cache-Control: public, max-age=31536000, immutable`, nhớ lâu thoải mái. Đường dẫn cũ sau khi đổi / xoá → 404 `ANH_KHONG_CO`.
- Không đổi gì khác: không trường mới, không cửa mới dưới `/api/kh`, không mã lỗi mới. App bản cũ đọc `anh` null vẫn chạy; gặp chuỗi mà chưa biết hiện thì bỏ qua cũng không hỏng.
- Ảnh nằm trong CSDL của POS, **không** nằm trong sao lưu Excel hằng ngày.
