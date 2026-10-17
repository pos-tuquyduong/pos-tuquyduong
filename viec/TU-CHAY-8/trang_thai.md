# TU-CHAY-8 — trạng thái

## Bước 1 — đối chiếu bản chụp (17.10.2026)
- Nhánh: `viec/TU-CHAY-8`; cây sạch.
- HEAD `41ad9ab` · FETCH_HEAD `41ad9ab` (bằng nhau → không kéo).
- `git log --oneline -3`:
  ```
  41ad9ab PHIEU: TU-CHAY-8
  2b65db4 TIEN-DO: LUOI-4 (8ac79a7), MA-GIAM-1 (5a6fc0f), TU-CHAY-7 (49f9140) xong; mo LUOI-5 + TU-CHAY-8; them TU-CHAY-9, DONG-GOI-1, MA-GIAM-2 — so v36
  49f9140 Merge pull request #31 from pos-tuquyduong/viec/TU-CHAY-7
  ```
- Kho không có ref `origin/main` (`git branch -a` chỉ có `viec/TU-CHAY-8`) → mốc cổng = `41ad9ab^`.

## Bước 3 — kế hoạch
`viec/TU-CHAY-8/ke_hoach.md`. Phiếu dặn **chờ duyệt kế hoạch** → dừng ở đây.

- Soát kế hoạch bằng agent phụ: 4 câu, đã nhận vào cuối `ke_hoach.md`.
- Cổng chạy thử trên máy mây: `✓ CỔNG CHẠY ĐẠT` (~5 phút) — A2 không cần sửa code.

## Câu hỏi
Xem mục `## Câu hỏi` của `ke_hoach.md` (Q1–Q6) — gom một lần. **Chủ quán đã trả lời 17.10** (xem dưới).

## Làm tiếp (tiep) — 17.10.2026

### Bước 1 — đối chiếu bản chụp
- Nhánh `viec/TU-CHAY-8`; cây sạch. HEAD `372ee54` · FETCH_HEAD `372ee54` (bằng nhau → không kéo; hook mở phiên đã kéo 41ad9ab → 372ee54).
- `git log --oneline -3`:
  ```
  372ee54 PHIEU: TU-CHAY-8 Q1 mo thu_gia_lap.js + Q4 mien thu_cong.js (Bai thu cu sua)
  b765688 TU-CHAY-8 trang thai: sua dong Cau hoi bi lap
  6dd324f TU-CHAY-8 ke hoach: nhan soat agent phu (duong song song -r, dong tong cuoi, stub TOCDO1, Q6 banh coc)
  ```

### Chủ quán trả lời (17.10)
Q1 sửa bài giả thu_gia_lap + thêm ca "bài giả im lặng thoát 0 → FAIL" (đỏ trên gốc) · Q2 dạng tổng thứ 4 (giả lập) · Q3 điều phối
trong thu_cong.js, bộ kiểm tự đếm phần · Q4 thu_cong.js miễn, bản gốc chạy trên code PR phải xanh · Q5a chấp nhận · Q5b không làm
(Phát hiện) · Q6 thêm bánh cóc NGUONG_THU_CONG_DON_VI · thêm **A7**: người gác cho `git checkout viec/<MÃ>` khi HEAD tách rời trỏ đúng
commit của nhánh local có phiếu.

### Bước 4 — bài thử trước (đỏ trên gốc `372ee54`)
Bằng chứng: `bang_chung_do.txt`. Đỏ đúng chỗ, không đỏ vì sập:
- `cong_cu/thu_TOCDO1.js` — C3, C4a, C4c (×3), P0–P10 đỏ (bộ kiểm gốc không có `kiemPhanThuCong`, không đòi dòng tổng).
- `cong_cu/thu_gia_lap.js` — C3i đỏ (Q1: bài giả C3 nay in dòng tổng; thêm ca bài im lặng thoát 0; worker ghi thêm lý do FAIL để ca so
  đúng câu kết luận — K3).
- `tu_chay/thu_cong_cu.js` — 4 phép skill TU-CHAY-8 (A2 ×2, A3, A7) đỏ; phép PHIEN_BAN mới (không ghim) xanh trên gốc (1.7.0 có mục THIET_KE).
- `tu_chay/thu_nguoi_gac.js` — 21 ca A3 / A7 đỏ + biến thể tự sinh của `cd <nháp> && node s.js`.
- `tu_chay/thu_cong.js` — miễn (phiếu `## Bài thử cũ sửa`, Q4): không thêm ca; chia lượt bắt bằng `kiemPhanThuCong` của bộ kiểm
  (thu_TOCDO1 mục P) + đột biến `thu_cong_phan` trong `dot_bien.py`.

### Bước 5 — sửa
- `kiem_tra_truoc_khi_giao.js`: `chayBaiThat` đòi dòng tổng (A4, 4 dạng — Q2); `NGUONG_THU_CONG_DON_VI = 126` + `kiemPhanThuCong`, lời gọi
  thu_cong giữ nguyên chữ (C3f / E1) nhưng bọc trong `kiemPhanThuCong(…)`.
- `tu_chay/thu_cong.js`: `--phan i/n` (T = 126 đơn vị = 4 bài nhỏ + 4 khối riêng của baiCong + 118 lời gọi `ca()` lúc chạy, kể cả trong vòng lặp), điều phối 3 phần song song.
- `tu_chay/nguoi_gac.js`: `xetTep` (A3) ở node (script + `-r/--require/--import/--loader`), python3, bash/sh; `RE_BIMAT` một biểu thức; luật mới
  `GIT-CHECKOUT-TACH` (A7) + `veNhanhViec`; `gitGac` (bỏ GIT_*, GIT_CEILING_DIRECTORIES, hạn 10 s).
- `tu_chay/skill_lam_viec.md` (luật cứng A3, bước 1.1 A7, bước 4 + 11.4 A2), `PHIEN_BAN` 1.8.0, `THIET_KE.md` mục TU-CHAY-8.
- Sửa phép cũ `thu_nguoi_gac.js` TU-CHAY-5 B4 (đỏ khi code đúng — K2): nó chấm MỌI lệnh git bước 1 trong kho đang đứng trên nhánh; lệnh
  `git checkout viec/$0` mới chỉ chạy khi HEAD tách rời → chấm lệnh checkout trong `KHO_A7` (tách rời đúng commit). Kho git thật dời lên đầu bài.

### Đo A1 (máy mây 4 lõi, 17.10)
- Chạy liền `--phan 1/1`: 126/126 đơn vị · **337 phép** (= số phép trước khi chia) · 71,7 s.
- Điều phối 3 phần: 337 phép (42 + 42 + 42 đơn vị · 128 + 109 + 100 phép) — 25,7 / 24,2 / 24,2 s (3 lần).
- Từng phần chạy riêng (3 lần): 1/3 22,7 / 22,8 / 24,4 s · 2/3 24,9 / 24,1 / 24,6 s · 3/3 24,3 / 23,8 / 24,6 s — mọi phần < 60 s (50 % hạn 120 s).
- Trong `npm test`: thu_cong 25,3–26,4 s (trước: ~52–96 s).

### Đột biến (`python3 viec/TU-CHAY-8/dot_bien.py`) — bảng chỗ vá → đột biến
Đối chứng 7 bài xanh (thu_TOCDO1 chỉ đỏ đúng D6 đỏ sẵn — tha đúng dòng đó). Vòng 1: **34/35 bị bắt**; `VS-TUCHAY8-DONG-TONG-KHONG-NEO-SO`
SỐNG (chưa ca dòng "đạt · hỏng" không số) → thêm ca C4c (`2223a86`), chạy lại riêng: bị bắt → **35/35**.

| Chỗ vá | Đột biến (bài bắt) |
|---|---|
| kiem_tra `chayBaiThat` đòi dòng tổng (A4) | BV-TUCHAY8-DONG-TONG (thu_TOCDO1 C4a + thu_gia_lap C3i) · VS-TUCHAY8-DONG-TONG-BO-GIA-LAP (C4b) · VS-TUCHAY8-DONG-TONG-KHONG-NEO-SO (C4c) |
| kiem_tra `kiemPhanThuCong` + bánh cóc (A1, Q6) | BV-TUCHAY8-KIEM-PHAN (P2) · VS-TUCHAY8-KIEM-PHAN-CHI-DEM-SO-PHAN (P4) · VS-TUCHAY8-KIEM-PHAN-DEM-DONG (P3) · BV-TUCHAY8-BANH-COC (P7) · VS-TUCHAY8-BANH-COC-LECH-MOT (P7) |
| thu_cong.js chia lượt + điều phối (A1) | BV-TUCHAY8-PHAN-KHONG-CHIA · VS-TUCHAY8-PHAN-LECH-MOT · BV-TUCHAY8-CA-KHONG-LA-DON-VI · VS-TUCHAY8-DIEU-PHOI-BO-PHAN (thu_cong_phan: Σ 378 ≠ 126 / 84 ≠ 126 / 8 < 126 / phần 1,2) · BV-TUCHAY8-DB-THEO-PHAN (thu_cong: thiếu ca) · VS-TUCHAY8-HAN-PHAN-NOI (thu_TOCDO1 P10) |
| nguoi_gac.js `xetTep` (A3) | BV-TUCHAY8-SOI-TEP-NODE · VS-TUCHAY8-SOI-BO-PYTHON · VS-TUCHAY8-SOI-BO-BASH · VS-TUCHAY8-SOI-BO-NAP-KEM · VS-TUCHAY8-MIEN-FILE-SUA-DO · VS-TUCHAY8-MIEN-KHI-GIT-LOI · VS-TUCHAY8-TEP-TO-VAN-DOC · BV-TUCHAY8-SOI-FILE-BI-MAT (thu_nguoi_gac, đúng ca) |
| nguoi_gac.js `veNhanhViec` / GIT-CHECKOUT-TACH (A7) | BV-TUCHAY8-A7 · VS-TUCHAY8-A7-KHONG-SO-SHA · VS-TUCHAY8-A7-CA-KHI-DUNG-TREN-NHANH · VS-TUCHAY8-A7-KHONG-DOI-PHIEU · VS-TUCHAY8-A7-NHIEU-DOI-SO · VS-TUCHAY8-A7-NGOAI-KHO |
| skill (chữ) A2 / A3 / A7 | BV-TUCHAY8-SKILL-B11-CONG-CHAY · BV-TUCHAY8-SKILL-B4-TU-THU · BV-TUCHAY8-SKILL-EDIT · BV-TUCHAY8-SKILL-B1-TACH-ROI (thu_cong_cu) |
| PHIEN_BAN + THIET_KE (chữ, A5) | BV-TUCHAY8-PHIENBAN (thu_cong_cu + thu_nguoi_gac) · BV-TUCHAY8-THIETKE-TIEU-DE (thu_cong_cu + kiem_chu) · BV-TUCHAY8-THIETKE-A3 (kiem_chu) |

### Q4 — bản gốc thu_cong.js trên code PR
`git show 372ee54:tu_chay/thu_cong.js` chép vào cây HEAD giải nén trong nháp, chạy: `thu_cong: 337 phép · 0 chỗ hỏng` — XANH.

## Phát hiện
1. **D6 của `cong_cu/thu_TOCDO1.js` đỏ SẴN trên main** (không do việc này): chú thích trỏ số dòng cứng đếm được 5 > `NGUONG_DONG_CUNG = 4`
   (`kiem_tra_truoc_khi_giao.js:573`) — `server/routes/orders.js:1640`, `cong_cu/thu_P20.js:432`, `cong_cu/thu_P26c.js:12`, `:357`, `:886`
   (MA-GIAM-1 / LUOI-4 gộp sau TU-CHAY-7). Bộ kiểm chỉ CẢNH BÁO (đúng thiết kế E15) nên `npm test` xanh; nhưng thu_TOCDO1 là bài thử ĐỔI
   trong PR này → cổng `chay` chạy nó trên code PR → đỏ. Sửa nằm ngoài Phạm vi (`server/`, `cong_cu/thu_P*.js` — Cấm, LUOI-5). Xem Câu hỏi Q7.
2. Q5b (chủ quán: không làm): `node < f`, `… | node`, `python3 < f` vẫn chạy nội dung file mà người gác không soi.
3. `npm run <x>` / `npm test` chạy script của `package.json` — không soi (file luật, sửa phải ghi đúng tên trong Phạm vi). Ghi ở THIET_KE.
4. File do script `require`/`import` không soi (bắc cầu) — ghi ở THIET_KE "lỗ còn hở".
5. Hệ quả Q5a đã thấy ngay trong việc này: máy không chạy được lệnh `python3 - <<EOF` có chữ SECRET/TOKEN (B-BIMAT-CHU, luật cũ) → sửa
   bằng công cụ Edit — đúng câu skill mới. Bài thử / bộ kiểm đang sửa có cụm đó: dưới người gác mới phải commit trước hoặc chạy qua `npm test`.

## Câu hỏi
- **Q7 (D6 đỏ sẵn × cổng chạy):** CỔNG CHẠY của PR này sẽ có `✗ [A11]` "cong_cu/thu_TOCDO1.js ĐỎ trên code PR" chỉ vì D6 (Phát hiện 1).
  Chọn: (a) **[đề xuất]** việc sau (hoặc LUOI-5 đang giữ thu_P*.js) đổi 5 chú thích đó sang tên hàm / mẫu grep — PR này chờ nó gộp, rồi
  gộp main vào nhánh; (b) chủ quán duyệt nâng `NGUONG_DONG_CUNG` 4 → 5 trong PR này (nới bánh cóc — KHÔNG tự làm); (c) chấp nhận A11 đỏ
  vì lý do ngoài PR. Máy không sửa D6, không nới ngưỡng.
