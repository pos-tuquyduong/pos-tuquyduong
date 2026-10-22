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
3. Bài cũ `thu_P26c.js` L6a (hoàn đơn mua gói còn nợ): giữ ca bằng cách dựng dữ liệu cũ qua `UPDATE` sau khi tạo đơn trả đủ.

## E(3) — đã đọc, không hỏi
`/nhan-diem` đã chặn bill chưa thu đủ: `kiemDonCuaMa` (signup-codes.js:44-70) gọi trước mọi lệnh ghi (signup-codes.js:196-199) → 400
`BILL_CHUA_THANH_TOAN`. Không đổi.

## Câu hỏi
(chưa có)

## Phát hiện
Xem `ke_hoach.md` mục 8.
