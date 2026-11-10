# Kế hoạch QUAY-UI-1 (ghi bổ sung — việc thường, chạy thẳng, phiếu không chờ duyệt kế hoạch)

Ghi chú trung thực: file này viết SAU khi đã đọc code và dựng bài thử, không trước. Nội dung là phương án đã chọn.

## Phương án A / B cho từng phần
| Phần | A (chọn) | B | Lý do |
|---|---|---|---|
| A tab thẻ | hàm thuần mới trong `BanHang/tinh.js` (dsGoiThe, dongThe, kiemTraThe, viTriMayChu) + một tab trong `BanHangMoi.jsx`; thẻ đi bằng `membership_buy` | tách file `BanHang/TheThanhVien.jsx` | A ít dòng; dùng lại tinh-thu / phiên sẵn có, không đụng orders.js |
| B ba nút | nâng `cachTra` lên `BanHangMoi.jsx`, `ThuTien.jsx` dựng ba nút; máy chủ không đổi | thêm cờ máy chủ "không tự trừ" | máy chủ vốn đã chỉ trừ khi gửi `tru_tai_khoan` → chỉ đổi mặc định ở quầy |
| C tra SĐT | `useEffect` trong `Customers.jsx` gọi cửa tìm khách sẵn có | cửa máy chủ mới "kiểm SĐT" | A không thêm cửa mới; 409 máy chủ vẫn là chốt |
| D đơn nạp | một dòng `laDonNap` (hàm sẵn của `utils/viKhach.js`) ở đầu giao dịch damages + ẩn nút ở `Orders.jsx` | kiểm theo product_code | kiểm theo đơn, không đi vòng được |
| E sửa đăng ký | thêm `created_by` + `created_at >=` vào câu UPDATE khách (cùng khuôn xoá) | gọi chung `CAU_XOA_KHACH_TRANG` | A một dòng, không dính điều kiện "khách trắng" (khách đã bán hàng vẫn phải sửa được tên — Q6a) |

## Ca thử ↔ Nghiệm thu (cong_cu/thu_QUAYUI1.js, 63 ca)
- A: A1–A9 · B: B1–B6 · C: C1–C4 · D: D1–D4 · E: E1–E5 · K5: các ca đối chứng (A2 giỏ không thẻ, A5 giỏ có món / gia hạn / hạng hết hạn, D2, D3, E1, E5).

## Đường song song & luồng hợp lệ (K4, K5)
Đơn 0đ · khách có mẹ · giỏ thẻ + món · trả đủ bằng tài khoản · đơn giao · gia hạn cùng hạng · khách hạng hết hạn · đăng ký do chính nó tạo khách · đăng ký đã xuất — đều có ca "phải KHÔNG bị chặn".
