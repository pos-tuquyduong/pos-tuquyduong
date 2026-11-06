# KH-TOMTAT-1 — trạng thái

## Đối chiếu bản chụp (bước 1, 06.11.2026)
HEAD = FETCH_HEAD = `66220bf` (nhánh `viec/KH-TOMTAT-1` đã đủ commit của origin, không kéo).
```
66220bf GOP-KH-TOMTAT-1 dua main 5e93e3d vao nhanh truoc khi lam (chat 06.11)
5e93e3d TIEN-DO: HANG-1 (f464cea), CK-NOIDUNG-1 (f9fd8b5), SUA-SL-1 (e7d0dd4), TINGEE-1 (4855070) xong; quyet dinh 05-06.11 (Tingee VA, tien ve muon, goi nap chi chu quan, the QR Bon mua, giao hang quay) — so v55
4855070 Merge pull request #76 from pos-tuquyduong/viec/TINGEE-1
```
Có commit `0adf75d PHIEU: KH-TOMTAT-1` trong lịch sử.

## Tiến độ
- Bước 2 (đọc) xong. Bước 3: `ke_hoach.md` đã viết. **Dừng ở đây** vì có câu hỏi ngoài Phạm vi (dưới). Chưa viết bài thử, chưa sửa code.
- Chưa nhờ agent phụ soát kế hoạch: kế hoạch đổi theo câu trả lời nên soát SAU khi chủ quán trả lời.

## Câu hỏi
**1. (chặn việc) Cho thêm `server/routes/hoaDon.js` vào Phạm vi được không?**
Việc này là: App muốn hiện "đã trả bằng gì, giảm bao nhiêu" cho mỗi đơn, và phiếu dặn lấy CÙNG cách tính với tờ hoá đơn in ở quầy
(nghiệm thu B). Nhưng hai phép tính đó nằm trong `server/routes/hoaDon.js`, file này không có trong Phạm vi:
- cách trả: hàm `dungThanhToan` (dòng 32) — chưa export;
- khoản giảm: công thức hạng + Flash + mã nằm thẳng trong `dungHoaDon` (dòng 91-99), chưa có hàm riêng.

Mình đề xuất (phương án A): thêm file này vào Phạm vi, chỉ export `dungThanhToan` và tách `tinhGiam(o)`; khoảng 10 dòng,
hoá đơn quầy giữ nguyên (có bài thử so trước/sau). Cách khác là gọi nguyên `dungHoaDon` cho từng đơn trong danh sách (~140 truy vấn
mỗi lần mở Lịch sử đơn, chậm) hoặc chép công thức sang `donApp.js` (hai nơi tính một thứ, trái luật "một quy tắc một hàm").
Bạn chỉ cần xác nhận "A" (chat thêm dòng `- server/routes/hoaDon.js` vào Phạm vi phiếu).

**2. (không chặn, mình tự chọn nếu bạn không đổi ý) `cach_nhan` của đơn quầy.** Quầy không lưu cách nhận. Đề xuất: có phí giao
(`shipping_fee > 0`) → `giao`; còn lại → `tai_quan` (khách mua ngay tại quán); không dùng `tai_cho` vì quầy không phân biệt; `null`
chỉ khi không có dữ liệu đơn. Nếu bạn muốn đơn quầy không phí giao cũng là `null` thì nói.
