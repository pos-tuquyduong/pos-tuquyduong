# CK-NOIDUNG-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: `viec/CK-NOIDUNG-1`; cây sạch; `git fetch origin viec/CK-NOIDUNG-1` được.
- HEAD `4ec877f` · FETCH_HEAD `4ec877f` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  4ec877f PHIEU: CK-NOIDUNG-1
  7f9693f TIEN-DO: KH-SDT-1, GIO-VN-1, KH-NHANH-POS-1, HD-KH-1, SEPAY-1, CT-1a, SUA-E2-1, SUA-C9-1 xong; quyet dinh 04-05.11; mo GIAO-DIEN-1, CK-NOIDUNG-1, HUY-1, KH-TOMTAT-1 — so v54
  4723a3b Merge pull request #72 from pos-tuquyduong/viec/SUA-C9-1
  ```

## Tiến độ
- Bước 2 (đọc) xong. Bước 3: `ke_hoach.md` viết xong, soát bằng agent phụ chỉ đọc, ghi kết quả soát vào cuối kế hoạch.
- Phiếu dặn **Chờ duyệt kế hoạch** → commit, push, DỪNG ở bước 3. Chưa viết bài thử, chưa sửa code.

## Câu hỏi
Xem `ke_hoach.md` mục "Câu hỏi cho chủ quán" (Q1–Q3). Tóm tắt:
- **Q1 (tiền):** hôm nay máy chủ KHÔNG cho xác nhận tay phiên đã hết hạn (`server/utils/giuCho.js:90` và điều kiện `het_han > ?` ở
  `giuCho.js:101`). Nghiệm thu C ("tiền về muộn, xác nhận tay → nhận lại số cũ") cần mở đường này — đổi đường tiền, cần chủ quán duyệt.
- **Q2 (Phạm vi):** in "Mã GD" lên bill cần `server/routes/hoaDon.js` (hàm `dungHoaDon`), không có trong Phạm vi.
- **Q3 (Phạm vi):** hai bài thử cũ khoá dạng nội dung cũ `TQD<mã phiên>` sẽ đỏ vì hành vi đã duyệt đổi: `cong_cu/thu_SEPAY1.js` (B1, E3),
  `cong_cu/thu_P3.js` (A1, A5). Cần thêm hai file vào Phạm vi (bài sửa thường, LUAT_XAY_APP §6.8).

## Phát hiện
- Đơn App ghi ghi chú `Đơn App <mã ngẫu nhiên> · nhận tại quán` (`server/utils/donApp.js:222`) — mã ngẫu nhiên vẫn in ở dòng ghi chú bill.
  Kế hoạch giữ nguyên (không đổi ghi chú); muốn bỏ thì chủ quán nói.
- Ngày triển khai: đơn đã bán trong ngày mang mã cũ `ORD-YYYYMMDD-NNN`, dãy mới bắt đầu `HD0001` — hai dãy cùng ngày. Nên triển khai ngoài giờ bán.
