# NHOM-MON-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
SHA: HEAD 7238492 · FETCH_HEAD 7238492 (bằng nhau)
7238492 PHIEU: NHOM-MON-1
acc8892 Merge pull request #104 from pos-tuquyduong/viec/TIEN-KHOA-2
302560a TIEN-KHOA-2: trang thai ghep main 9a5defdf, HEAD DA KIEM 6f39911b — chat ban 41

## Tiến độ
- Bước 3 xong: `ke_hoach.md` đã soát bởi agent phụ (mục 5). Phiếu "Chờ duyệt kế hoạch" → DỪNG. Chưa viết code.
- Kho nông (shallow) làm `thu_BH2.js` G1 đỏ (`cbbb809` thiếu); đã `git fetch --unshallow` (chỉ tải lịch sử).

## Câu hỏi (chờ chủ quán)
- Q1: chặn xoá nhóm gốc juice/tea (409 NHOM_GOC)? Đề xuất: có.
- Q2: thêm `server/utils/donApp.js` vào Phạm vi (đổi 1–2 dòng để đơn App lọc nhóm qua cùng hàm)? Đề xuất: có.
- Q3: màn khách lọc theo "hiện ở quầy"? Đề xuất: có.

## Chủ quán duyệt kế hoạch (27.11)
Q1 có (409 NHOM_GOC, vẫn đổi tên được) · Q2 có (thêm `server/utils/donApp.js` vào Phạm vi) · Q3 có (màn khách theo "hiện ở quầy").
## Câu hỏi
- Người gác [G1-PHIEU] chặn máy sửa `phieu.md` → chủ quán tự thêm dòng `- server/utils/donApp.js` vào `## Phạm vi` (sau dòng `server/utils/manKhach.js`). Máy làm phần sửa `donApp.js` ở MỘT commit riêng, cuối cùng.
- Người gác [G5-NGOAIPV] chặn thêm 2 bài thử NGOÀI Phạm vi khoá danh sách trắng trường món (LUAT §6.7 cho sửa, nhưng cổng máy chặn): `cong_cu/thu_KH1.js:529` (E5, mảng KHOA) và `cong_cu/thu_KHSP1.js:45` (`COT_MOI`, C3). Cần thêm 2 trường `nhom_ten`, `nhom_thu_tu` vào đúng hai danh sách đó (vẫn so BẰNG). Chủ quán thêm hai file vào `## Phạm vi` cùng dòng `server/utils/donApp.js`; máy làm ở commit cuối.
- Ở thu_KHSP1.js: `COT_MOI` (không phải KHOA_MENU_CU) là chỗ thêm. Chưa sửa vì bị chặn.
- Giả lập quầy (`--day-du`, cong_cu/gia_lap/chay.js KB24 / thu_gia_lap.js) đỏ vì `cong_cu/gia_lap/kich_ban.js:585` và `:599` tạo món bằng `POST /products` với `category: 'khac'` — mã nhóm không có → máy chủ giờ trả 400 NHOM_KHONG_CO (đúng nghiệm thu A3). Cần sửa hai dòng này `'khac'` → `'juice'` (ngoài Phạm vi, bị chặn). Chủ quán thêm `cong_cu/gia_lap/kich_ban.js` vào Phạm vi.
- Bài cũ `thu_KHO3a.js` đã đổi category 'tra' → 'tea' (trong Phạm vi) nhưng vẫn XANH trên gốc → phiếu cần mục `## Bài thử cũ sửa` ghi `cong_cu/thu_KHO3a.js` (cổng A11). Máy không sửa được phiếu.
- Tóm lại chủ quán cần sửa `phieu.md` (người gác chặn máy): (1) thêm vào `## Phạm vi`: `server/utils/donApp.js`, `cong_cu/thu_KH1.js`, `cong_cu/thu_KHSP1.js`, `cong_cu/gia_lap/kich_ban.js`; (2) thêm mục `## Bài thử cũ sửa` với `cong_cu/thu_KHO3a.js`. Rồi chạy `/lam-viec NHOM-MON-1 tiep` — máy làm nốt 5 sửa nhỏ (đã có chỗ sửa cụ thể ở trên).
