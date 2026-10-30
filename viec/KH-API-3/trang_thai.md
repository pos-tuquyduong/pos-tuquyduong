# KH-API-3 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: `viec/KH-API-3`; cây sạch. HEAD `55a8f29` · FETCH_HEAD `55a8f29` (bằng nhau — không kéo).
- `git log --oneline -3`:
  - 55a8f29 PHIEU: KH-API-3
  - 7a3930f TIEN-DO: KH-API-2 (6f2c30b) xong; mo KH-API-3; them KHACH-CK-1; quyet dinh 29-30.10; luat noi de hieu + duyet 2 luot; tu-chay 1.8.1 (KHUNG-KEO-1) — so v47
  - 6f2c30b Merge pull request #51 from pos-tuquyduong/viec/KH-API-2

## Tiến độ
- Bước 2 (đọc) xong. Bước 3: `ke_hoach.md` đã viết + agent phụ soát. Phiếu dặn "Chờ duyệt kế hoạch" → DỪNG ở bước 3, chưa viết bài thử / code.

## Câu hỏi (chờ chủ quán — chi tiết + đề xuất ở cuối ke_hoach.md)
1. Thêm `cong_cu/thu_KHUI1.js` vào Phạm vi + `## Bài thử cũ sửa` (ca H3 khẳng định "/api/kh/menu không token → 401", việc này đổi ngược lại)?
   Đề xuất: có.
2. App v2 + khách MỚI sẽ gặp `CAN_TEN` vì xưng hô bắt buộc (sổ quyết định 29.10). Đề xuất: làm đúng sổ quyết định.
3. Thêm `server/utils/helpers.js` vào Phạm vi để `getNow` nhận tham số (đổi hạn token sang giờ VN bằng một hàm)? Đề xuất: có.

## Phát hiện
- `cong_cu/thu_KHUI1.js:140` không nằm trong `npm test` (`kiem_tra_truoc_khi_giao.js:495` không liệt kê) — bài khẳng định hành vi App KH cũ.
