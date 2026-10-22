# P22-23 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: `viec/P22-23`; cây sạch; `git fetch origin viec/P22-23` → HEAD `97324a8` = FETCH_HEAD `97324a8` (bằng nhau, không kéo).
- `git log --oneline -3`:
  ```
  97324a8 PHIEU: P22-23
  4ee92fe TIEN-DO: KH-API-1 (e7f79bf), P16 (4fa657a), P26d (f1dbd7c), DOI-SOAT-1 (fabe583) xong; mo P22-23, P15-QR, KH-UI-1, KH-QUAY-1; them GIAO-1, DOI-SOAT-2, P26e; TAM_NHIN + NHIP_NGAY vao kho; lich — so v38
  fabe583 Merge pull request #37 from pos-tuquyduong/viec/DOI-SOAT-1
  ```

## Bước hiện tại
Bước 3 — kế hoạch `ke_hoach.md` xong, **dừng chờ chủ quán duyệt** (phiếu: "Chờ duyệt kế hoạch"). Chưa sửa code, chưa viết bài thử.

## Cần chủ quán duyệt cùng kế hoạch
1. Mốc dữ liệu cũ của I8 (`ke_hoach.md` P5): hằng `DIEM_KHI_THU_TU` = ngày gộp + 1, chỉ áp cho Đối soát dữ liệu thật; đơn trước mốc đạt
   nếu khớp luật mới HOẶC luật cũ. Máy ghi tạm `'2026-10-24'`, sửa đúng ngày lúc duyệt PR.
2. Mã lỗi mới: `GOI_THE_CHUA_THU_DU` (mua gói / thẻ chưa thu đủ), `DON_FLASH_KHONG_DIEM` (nhận điểm mã bill trên đơn Flash — trả 400, KHÔNG
   tiêu mã).
3. Hàm `tinhDiemDon` đặt ở tầng module orders.js (ngoài ba vùng sửa — hai route cùng dùng).
4. Bài cũ `thu_P26c.js` L6a (hoàn đơn mua gói còn nợ): giữ ca bằng cách dựng dữ liệu cũ qua `UPDATE` sau khi tạo đơn trả đủ.

## E(3) — đã đọc, không hỏi
`/nhan-diem` đã chặn bill chưa thu đủ: `kiemDonCuaMa` (signup-codes.js:44-70) gọi trước mọi lệnh ghi (signup-codes.js:196-199) → 400
`BILL_CHUA_THANH_TOAN`. Không đổi.

## Câu hỏi
1. **Xin thêm `cong_cu/thu_GOI1.js` vào Phạm vi.** Ca B3n (thu_GOI1.js:713) mua gói GHI NỢ để thử `DON_CON_NO` khi kết thúc gói; sau cổng D
   yêu cầu đó trả 400 và bài sập (`mua30` ném lỗi khi không 200, :525-528). Bài này nằm trong mảng bài chạy thật của bộ kiểm → `npm test` đỏ.
   Đề xuất: mua gói trả đủ rồi `UPDATE pos_orders` về dạng nợ cũ (dữ liệu cũ trên production vẫn có thể có) — giữ nguyên ca canh
   `DON_CON_NO`, như cách sửa thu_P26c L6a. Chọn: **(a) thêm vào Phạm vi, sửa như đề xuất** / (b) cách khác.
2. **Gia hạn gói kèm ghi nợ.** Chú thích code (orders.js:194) gọi "gia hạn" là đơn có `customer_package_id` + `package_buy` (MUA gói mới, không
   lấy món). Phiếu ghi luồng gia hạn phải KHÔNG bị chặn nhưng mô tả nó là `customer_package_id` + món `from_package`. Đơn dạng của code mà
   ghi nợ / chờ thu thì: **(a) chặn 400 như mọi đơn mua gói** (theo luật "đơn mua gói phải thu đủ") / (b) cho qua.

## Phát hiện
Xem `ke_hoach.md` mục 8.
