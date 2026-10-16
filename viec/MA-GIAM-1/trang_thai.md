# MA-GIAM-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (16.10.2026)
- Nhánh: `viec/MA-GIAM-1`. `git status --short`: sạch.
- HEAD `16d8899` · FETCH_HEAD `16d8899` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  16d8899 PHIEU: MA-GIAM-1
  8194c9c TIEN-DO: AUDIT-4 (ddc42d2), P20c (d47b81c) xong; AU4-16 = A; mo LUOI-4 + MA-GIAM-1 + TU-CHAY-7; them LUOI-5, AUDIT-5 — so v35
  ddc42d2 Merge pull request #28 from pos-tuquyduong/viec/AUDIT-4
  ```
- `python3 dong_tien_do.py`: `[ ] MA-GIAM-1` còn mở.

## Bước 2–3 — đọc, kế hoạch
Kế hoạch ở `ke_hoach.md` (soát bằng agent phụ, sửa theo soát ở `0960b19`). Phiếu dặn chờ duyệt → dừng sau bước 3.

## Làm tiếp (tiep) — bước 1 lần 2
- Nhánh `viec/MA-GIAM-1`, cây sạch. HEAD `0960b19` · FETCH_HEAD `0960b19` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  0960b19 MA-GIAM-1: ke hoach sau soat (A3 gon hon, ca het luot, phat hien PUT/traLuotMa/AUDIT-4 ghim 75)
  60a7ab1 MA-GIAM-1: ke hoach (cho duyet) + trang thai buoc 1
  16d8899 PHIEU: MA-GIAM-1
  ```
- Chủ quán duyệt (lời nhắn lượt `tiep`): (1) A1 không mở giao dịch; (2) A2 chép câu tra mã bill, dùng chung `kiemDonCuaMa`; (3) THÊM A8 —
  PUT /discount-codes/:id không đổi `code` khi có dòng `pos_signup_codes` cùng chữ (UPPER) → 400 `MA_BILL_KHONG_DOI_TEN`, trường khác như cũ,
  bật lại `is_active` giữ nguyên; (4) `traLuotMa` và ghim 75 của AUDIT-4 chỉ ghi Phát hiện.

## Bước 4–5 — bài thử, vá
Bằng chứng đỏ: `bang_chung_do.txt` (thu_P20 gốc 152/17, thu_P26a gốc 14/2; đã vá 169/0, 16/0).

### Chỗ vá → đột biến (`viec/MA-GIAM-1/dot_bien.py` — 26/26 BẮT, đối chứng p20 169/0 · p26a 16/0)
| Chỗ vá | Đột biến |
|---|---|
| A1 `discount-codes.js` DELETE /:id — xoá có điều kiện, `changes` → vô hiệu / 404 | BV-A1-bo-dieu-kien · VS-A1-null-lech · VS-A1-khong-vo-hieu · VS-A1-mat-404 |
| A2 `discount-codes.js` /validate — cổng đơn gốc | BV-A2-bo-cong-validate · VS-A2-tra-ca-chua-claim · VS-A2-tra-chu-go · VS-A2-doi-ma-loi |
| A3 `orders.js` freshCode `AND is_active = 1` + `!freshCode` → 400 | BV-A3-bo-kiem-null · VS-A3-bo-is-active · VS-A3-doi-ma-loi · BV-KB20-bo-kiem-lai-luot · VS-A3-gop-ma-loi |
| A4 `orders.js` cổng P20b tra `codeRecord.code` (giữ) | VS-A4-tra-ma-tho |
| A5 `signup-codes.js` /reset — UPPER, xoá theo id, nhánh null, lời báo | BV-A5-xoa-theo-code · VS-A5-null-van-xoa · VS-A5-phan-biet-hoa · BV-A5-loi-bao-null · BV-A5-loi-bao-voucher · BV-P20C-A3-bo-dieu-kien |
| A6 `discount-codes.js` /:id/increment-usage — `manage_promotions` | BV-A6-bo-quyen · VS-A6-sai-quyen |
| A8 `discount-codes.js` PUT /:id — không đổi tên voucher mã bill | BV-A8-bo-chan-doi-ten · VS-A8-tra-ma-moi · VS-A8-chan-ca-ma-tay · VS-A8-chan-moi-put |

### Đột biến cũ chạy lại trên code đã vá (A7)
- `python3 viec/P20b/dot_bien.py` → 4/4 BẮT (đối chứng 169/0).
- `python3 viec/P20c/dot_bien.py` → 20/21: `BV-A3-bo-dieu-kien` HỎNG (neo `WHERE code = ? AND COALESCE(used_count, 0) = 0'` rữa — câu xoá đổi
  `code` → `id`, đã khai ở kế hoạch). Neo lại: `BV-P20C-A3-bo-dieu-kien` trong bộ này (neo `WHERE id = ? AND COALESCE(used_count, 0) = 0'`) → BẮT
  `✗ H3 hoàn tác voucher vừa được dùng`.
- `python3 viec/AUDIT-1/dot_bien.py 'C2F-discount-codes*' 'C2F-signup-codes*' D1 -j 4` → C2F 11/11 BẮT; D1 55 BẮT + 2 LẠC (`!D1-E11-P20`,
  `!D1-E11-P26a`). Hai LẠC đã có từ trước: AU-G5 `viec/AUDIT-1/bao_cao.md:25, :77–78`. Chạy lại riêng `-j 1` vẫn LẠC. Áp thẳng hai đột
  biến lên bài trong bản sao → thu_P20 169/0, thu_P26a 16/0: không liên quan việc này.
- Tên C2F đổi (A1 đổi thứ tự câu ghi, A6 đổi loại quyền): gốc `C2F-discount-codes-03-update-quan-tri`, `-04-delete-quan-tri`, `-05-update-quay`
  → vá `C2F-discount-codes-03-delete-quan-tri`, `-04-update-quan-tri`, `-05-update-quan-tri` (49 tên ba file, trước = sau về số lượng).
- `python3 viec/AUDIT-2/dot_bien.py BK-KB20-bo-kiem-lai-ma -j 1` → SỐNG dưới giả lập KB20 (đã biết: AU2-9). Cùng neo ở bộ này
  (`BV-KB20-bo-kiem-lai-luot`) → BẮT bởi G11.
- AUDIT-4 P20B: đối chứng `p20` của AUDIT-4 ghim 75 ca (đã lệch từ gốc: 132) → không chạy được bằng công cụ AUDIT-4. `VS-AU4-P20B-TRA-MA-THO`
  chạy bằng bản sao `VS-A4-tra-ma-tho` ở bộ này → BẮT.

### Bộ kiểm
- `npm test` (máy rảnh): PASS 64 · FAIL 0 · CẢNH BÁO 1 (route GET có lệnh ghi — packages/products/sync, có từ trước).
- Một lần stop hook báo `✗ tu_chay/thu_cong.js ETIMEDOUT (120.1 s)` — lúc AUDIT-1 đang chạy 4 luồng. Chạy lại lúc rảnh: xanh **110.7 s** (sát hạn
  120 s — báo chủ quán, không nới; K8).

## Phát hiện (ngoài phạm vi — không sửa)
1. `server/utils/tienDaTra.js:58–62` `traLuotMa` trả lượt theo `UPPER(code)` + loại + trị giá, không theo id — cùng khuôn A5 (chủ quán: chỉ ghi).
2. `viec/AUDIT-4/dot_bien.py:24` ghim `thu_P20.js` 75 ca; gốc 132, nay 169 — đối chứng p20 của AUDIT-4 hỏng (chủ quán: chỉ ghi).
3. `orders.js:672–675` đọc lại `max_discount` theo id ngoài giao dịch — mã mất giữa chừng thì bỏ trần; sau A3 rollback nên vô hại.
4. `tu_chay/thu_cong.js` chạy 110.7 s / hạn 120 s khi máy rảnh — chạy song song việc khác là quá hạn.
5. `discount-codes.js` chú thích `/increment-usage` "gọi khi tạo đơn hàng thành công" — không màn hình nào gọi (chỉ giả lập KB20).
6. AU4-15 (cổng P20b ngoài giao dịch) — CHƯA KIỂM, như phiếu.

## Câu hỏi
(không)
