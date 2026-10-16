# P20b — trạng thái

## Bước 1 — đối chiếu bản chụp (16.10.2026)
HEAD `568b044` · FETCH_HEAD `568b044` — bằng nhau, không kéo.
```
568b044 PHIEU: P20b
09ddeb0 TIEN-DO: AUDIT-3 (bf2201d), TU-CHAY-6 (024dab9), BAN-HANG-1 (5d2294c) xong; them LUOI-3 + AUDIT-4; mo P20b — so v33
024dab9 Merge pull request #24 from pos-tuquyduong/viec/TU-CHAY-6
```

## Bước 1 (tiếp, 16.10) — đối chiếu lại
HEAD `f8d8bab` · FETCH_HEAD `f8d8bab` — bằng nhau, không kéo. Chủ quán duyệt kế hoạch v2: phương án A, cổng có `claimed_at IS NOT NULL`,
không chặn cửa sổ huỷ-giữa-chừng (CHƯA KIỂM), A5 = thanh lỗi chung; hook không cài được → tự chạy `node kiem_tra_truoc_khi_giao.js` trước mỗi commit code.
```
f8d8bab P20b ke hoach v2: them claimed_at IS NOT NULL (K5 trung chu ba nguon ma), sua tien ca thu theo doi chieu :783, ca G7, du danh sach AUDIT-1 D1
d82e968 P20b ke hoach v1: giu kiemDonCuaMa tai signup-codes.js (E9/M2/AUDIT-1 neo vao file Cam), cong tai POST /orders, 6 ca thu + 5 dot bien — cho duyet
568b044 PHIEU: P20b
```

## Bước 2–3 — đọc code, kế hoạch
Kế hoạch ở `ke_hoach.md`. Phiếu dặn chờ duyệt kế hoạch → dừng sau khi push.
Soát độc lập (agent chỉ đọc, 16.10) bắt 2 lỗi lập luận ở v1 → v2: (1) đoán HTTP của ca mà chưa đọc phép đối chiếu tiền `orders.js:783–791`
(tiền gửi phải bằng tổng sau giảm); (2) coi `code` là duy nhất giữa ba nguồn mã trong khi mỗi nguồn chỉ kiểm trùng trong bảng mình →
thêm `AND claimed_at IS NOT NULL` + ca G7. Ghi để xếp ngăn ở bước 11 (BÀI HỌC).

## Bước 4–5 — bài thử đỏ, vá, đột biến (16.10)
- `cong_cu/thu_P20.js` thêm mục [G] (7 ca: G1–G5, G7; 22 phép). Trên gốc `f8d8bab`: **66 đạt · 9 hỏng** (G1–G3 đỏ, K5 G4/G5/G7 xanh) —
  `bang_chung_do.txt`. Sau vá: 75 đạt · 0 hỏng.
- Vá: `server/routes/signup-codes.js` +1 dòng `module.exports.kiemDonCuaMa`; `server/routes/orders.js` +1 require, +12 dòng cổng
  trong `if (codeRecord)` (4 dòng chú thích + 8 dòng code).
- Bản lưu trước vá: thư mục nháp của phiên (`orders.js.truoc_P20b`, `signup-codes.js.truoc_P20b`), không để trong kho.

### Chỗ vá → đột biến (`viec/P20b/dot_bien.py`, chạy `python3 viec/P20b/dot_bien.py` → đối chứng 75 đạt · 4/4 BẮT)
| Chỗ vá | Đột biến | Bắt ở |
|---|---|---|
| A2 `if (maBill)` | `BV-A2-bo-tra-signup` | ✗ G1 |
| A2 `kiemDonCuaMa(maBill)` | `VS-A2-chi-chan-don-huy` (danh sách đen `cancelled` tại chỗ) | ✗ G2 |
| A2 `if (maBill)` | `VS-A2-chan-ca-ma-tay` | ✗ G5 |
| A2 `AND claimed_at IS NOT NULL` | `VS-A2-tra-ca-ma-chua-claim` | ✗ G7 |
Tên đột biến: BV-A2-bo-tra-signup, VS-A2-chi-chan-don-huy, VS-A2-chan-ca-ma-tay, VS-A2-tra-ca-ma-chua-claim.

## Câu hỏi
- Người gác chặn `bash cai_git_hook.sh` (B-CHUONGTRINH: `bash` không trong danh sách) → hook pre-commit CHƯA cài ở máy mây này;
  bước 3 chỉ commit file trong `viec/P20b/`, bộ kiểm sẽ chạy ở bước 6. Chủ quán muốn cho phép thì thêm vào `tep_bash_them`.
Xem `ke_hoach.md` mục 7 (3 câu): A1 phương án A vì E9 / thu_gia_lap M2 / AUDIT-1 D1 đều neo vào `signup-codes.js` (file Cấm, ngoài Phạm vi);
TOCTOU huỷ giữa chừng; chữ "ô mã giảm" ở A5.

## Phát hiện
Xem `ke_hoach.md` mục 8.
