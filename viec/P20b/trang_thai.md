# P20b — trạng thái

## Bước 1 — đối chiếu bản chụp (16.10.2026)
HEAD `568b044` · FETCH_HEAD `568b044` — bằng nhau, không kéo.
```
568b044 PHIEU: P20b
09ddeb0 TIEN-DO: AUDIT-3 (bf2201d), TU-CHAY-6 (024dab9), BAN-HANG-1 (5d2294c) xong; them LUOI-3 + AUDIT-4; mo P20b — so v33
024dab9 Merge pull request #24 from pos-tuquyduong/viec/TU-CHAY-6
```

## Bước 2–3 — đọc code, kế hoạch
Kế hoạch ở `ke_hoach.md`. Phiếu dặn chờ duyệt kế hoạch → dừng sau khi push.
Soát độc lập (agent chỉ đọc, 16.10) bắt 2 lỗi lập luận ở v1 → v2: (1) đoán HTTP của ca mà chưa đọc phép đối chiếu tiền `orders.js:783–791`
(tiền gửi phải bằng tổng sau giảm); (2) coi `code` là duy nhất giữa ba nguồn mã trong khi mỗi nguồn chỉ kiểm trùng trong bảng mình →
thêm `AND claimed_at IS NOT NULL` + ca G7. Ghi để xếp ngăn ở bước 11 (BÀI HỌC).

## Câu hỏi
- Người gác chặn `bash cai_git_hook.sh` (B-CHUONGTRINH: `bash` không trong danh sách) → hook pre-commit CHƯA cài ở máy mây này;
  bước 3 chỉ commit file trong `viec/P20b/`, bộ kiểm sẽ chạy ở bước 6. Chủ quán muốn cho phép thì thêm vào `tep_bash_them`.
Xem `ke_hoach.md` mục 7 (3 câu): A1 phương án A vì E9 / thu_gia_lap M2 / AUDIT-1 D1 đều neo vào `signup-codes.js` (file Cấm, ngoài Phạm vi);
TOCTOU huỷ giữa chừng; chữ "ô mã giảm" ở A5.

## Phát hiện
Xem `ke_hoach.md` mục 8.
