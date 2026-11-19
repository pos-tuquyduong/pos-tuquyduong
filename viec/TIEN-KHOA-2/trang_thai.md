# TIEN-KHOA-2 — trạng thái

## Bước 1 — đối chiếu bản chụp (19.11.2026)
- Nhánh: `viec/TIEN-KHOA-2` · cây sạch.
- `git fetch origin viec/TIEN-KHOA-2` → HEAD `e911762` · FETCH_HEAD `e911762` (bằng nhau — không kéo).
- `git log --oneline -3`:
  ```
  e911762 PHIEU: TIEN-KHOA-2 bit 3 loi doi tien khong qua PIN / QR (thu no chi tien mat, tranh vung KHO-3a)
  bc16e14 Merge pull request #100 from pos-tuquyduong/viec/BO-MAN-CU-1
  9cb1dbb BO-MAN-CU-1: cong chay DAT, HEAD DA KIEM 57cc4091
  ```
- Kho mây là kho nông → `npm test` đỏ ở `thu_BH2` G1 (thiếu commit `cbbb809`). Đã `git fetch -q --unshallow origin viec/TIEN-KHOA-2` →
  PASS 122 · FAIL 0 · CẢNH BÁO 1.

## Bước 2–3 — đọc, kế hoạch (19.11.2026)
- Đã đọc phiếu, CLAUDE.md, KHUON_LOI.md, sổ quyết định (`:89` mọi CK qua QR; `:171` xác nhận tay tiền về muộn), code vùng sửa (file:dòng ở
  `ke_hoach.md` mục 1).
- Agent chỉ đọc soát kế hoạch (4 câu) bắt: sót 9 chỗ bài cũ gọi `adjust` không PIN và 4 chỗ `pay-debt` CK (`thu_P21/P26c/DOISOAT1/DIEMTHAT1`);
  bài tĩnh `thu_BAO1a` / `thu_GIAODIEN1` phải giữ xanh; A3 chặn được ngay ở phần kiểm đầu vào (ngắn hơn); A4 giữ `cotTien` để không trôi neo đột biến
  `thu_gia_lap.js`; hạ `NGUONG_FETCH` lệch chữ phiếu; vế Đối soát không đạt nếu câu 2 bị từ chối. Đã sửa hết vào `ke_hoach.md` (mục 2, 3, 4, 7).
- Phiếu dặn "Chờ duyệt kế hoạch" → DỪNG ở bước 3.

## Câu hỏi
Năm câu ở `ke_hoach.md` mục 7, mỗi câu có đề xuất:
1. Thêm `cong_cu/gia_lap/kich_ban.js` vào Phạm vi (giả lập gọi đúng ba lối bị bịt — không sửa thì `npm test` đỏ) — bắt buộc.
2. Thêm `server/utils/doiSoat.js` vào Phạm vi để điều chỉnh ví và đổi cách trả hiện ở màn Đối soát (dòng CẦN XEM) — đề xuất đồng ý.
3. A3 chọn (a): chặn hẳn tiền mặt → chuyển khoản — đề xuất đồng ý.
4. A7.2 không thử tay được (không màn nào có nút đổi cách trả) → thay bằng ca máy — đề xuất đồng ý.
5. Cho hạ `NGUONG_FETCH` 22 → 21 sau khi bỏ fetch trần `Orders.jsx` — đề xuất đồng ý.

## Phát hiện
1. `POST /wallets/topup` nhận `payment_method` tự do → "nạp chuyển khoản không qua QR" bằng gọi API tay (chi tiết `ke_hoach.md` mục 8).
