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

## Đối chiếu bản chụp — lượt "tiep" 05.11 (sau duyệt)
- Nhánh `viec/CK-NOIDUNG-1`; cây sạch; hook mở phiên đã kéo `4ec877f → 150e7db`; `git fetch` được.
- HEAD `150e7db` · FETCH_HEAD `150e7db` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  150e7db PHIEU: CK-NOIDUNG-1 chu quan tra loi Q1-Q3 (them hoaDon.js, dongHoaDon.js, wallets.js, thu_SEPAY1.js, thu_P26c.js vao Pham vi)
  a10a453 CK-NOIDUNG-1: ke hoach sua theo soat (payOS giu TQD<id>, khop SePay bang noi_dung, them ca, Q2/Q3 du file)
  69fc4d4 CK-NOIDUNG-1: ke hoach (cho duyet) + trang thai
  ```

## Tiến độ
- Bước 2 (đọc) xong. Bước 3: `ke_hoach.md` viết xong; agent phụ chỉ đọc đã soát theo 4 câu, kế hoạch đã sửa theo (mục cuối `ke_hoach.md`).
- Phiếu dặn **Chờ duyệt kế hoạch** → commit, push, DỪNG ở bước 3. Chưa viết bài thử, chưa sửa code.
- Người gác chặn một lệnh ghép (heredoc ghi script + chạy cùng lệnh, luật B-PHANTICH) → viết lại file kế hoạch bằng công cụ Write.

## Câu hỏi
(Q1–Q3 dưới đây ĐÃ được chủ quán trả lời 05.11 — phiếu 150e7db; kế hoạch mục "Sau duyệt".)
Xem `ke_hoach.md` mục "Câu hỏi cho chủ quán" (Q1–Q3). Tóm tắt:
- **Q1 (tiền):** hôm nay máy chủ KHÔNG cho xác nhận tay phiên đã hết hạn (`server/utils/giuCho.js:90` và điều kiện `het_han > ?` ở
  `giuCho.js:101`). Nghiệm thu C ("tiền về muộn, xác nhận tay → nhận lại số cũ") cần mở đường này — đổi đường tiền, cần chủ quán duyệt.
- **Q2 (Phạm vi):** in "Mã GD" lên bill cần `server/routes/hoaDon.js` (hàm `dungHoaDon`); lên hoá đơn App cần thêm `server/utils/dongHoaDon.js`.
- **Q3 (Phạm vi):** bài thử cũ khoá dạng cũ sẽ đỏ vì hành vi đã duyệt đổi: `cong_cu/thu_SEPAY1.js` (B1, E3), `cong_cu/thu_P26c.js` (C1, C2).
  Cần thêm hai file vào Phạm vi (bài sửa thường, LUAT_XAY_APP §6.8).

## Phát hiện
- Đơn App ghi ghi chú `Đơn App <mã ngẫu nhiên> · nhận tại quán` (`server/utils/donApp.js:222`) — mã ngẫu nhiên vẫn in ở dòng ghi chú bill.
  Kế hoạch giữ nguyên (không đổi ghi chú); muốn bỏ thì chủ quán nói.
- Ngày triển khai: đơn đã bán trong ngày mang mã cũ `ORD-YYYYMMDD-NNN`, dãy mới bắt đầu `HD0001` — hai dãy cùng ngày (bill `HD0001` đứng sau
  bill `030`). Nên triển khai ngoài giờ bán.
- payOS (dự phòng) giới hạn nội dung 9 ký tự → nội dung CK của payOS giữ `TQD<mã phiên>`, không mang số hoá đơn (bill vẫn in số).
