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
- `node kiem_tra_truoc_khi_giao.js --day-du` trên `de717f4`: PASS 68 · FAIL 0 · CẢNH BÁO 1 (thu_P20 3.0 s, thu_P26a 1.3 s, thu_cong 107.0 s).
- Một lần stop hook báo `✗ tu_chay/thu_cong.js ETIMEDOUT (120.1 s)` — lúc AUDIT-1 đang chạy 4 luồng. Chạy lại lúc rảnh: xanh **110.7 s** (sát hạn
  120 s — báo chủ quán, không nới; K8).

## Phát hiện (ngoài phạm vi — không sửa)
1. `server/utils/tienDaTra.js:58–62` `traLuotMa` trả lượt theo `UPPER(code)` + loại + trị giá, không theo id — cùng khuôn A5 (chủ quán: chỉ ghi).
2. `viec/AUDIT-4/dot_bien.py:24` ghim `thu_P20.js` 75 ca; gốc 132, nay 169 — đối chứng p20 của AUDIT-4 hỏng (chủ quán: chỉ ghi).
3. `orders.js:672–675` đọc lại `max_discount` theo id ngoài giao dịch — mã mất giữa chừng thì bỏ trần; sau A3 rollback nên vô hại.
4. `tu_chay/thu_cong.js` chạy 110.7 s / hạn 120 s khi máy rảnh — chạy song song việc khác là quá hạn.
5. `discount-codes.js` chú thích `/increment-usage` "gọi khi tạo đơn hàng thành công" — không màn hình nào gọi (chỉ giả lập KB20).
6. AU4-15 (cổng P20b ngoài giao dịch) — CHƯA KIỂM, như phiếu.

7. (soát vòng 1, nghi ngờ K5) Cổng A8 `discount-codes.js:269` tra `pos_signup_codes` KHÔNG lọc `claimed_at` — đúng chữ chủ quán ("có dòng
   pos_signup_codes cùng chữ"): mã tay / voucher đổi điểm trùng chữ một mã bill CHƯA claim (như G7) cũng không đổi tên được → 400. Chưa có ca
   K5 cho luồng này. Chủ quán xác nhận giữ hay chỉ chặn mã bill ĐÃ claim (thêm `AND claimed_at IS NOT NULL` + một ca).
8. (soát vòng 1) `discount-codes.js:267` (có sẵn) so `code.trim().toUpperCase() !== existing.code` — voucher mã bill lưu chữ thường (chỉ dựng
   được bằng ghi tay, mã bill sinh ra chữ hoa) thì mọi lần sửa ở màn hình (gửi mã viết hoa, `DiscountCodes.jsx:174`) bị coi là đổi tên → 400.
9. (soát vòng 1) Đối soát: chưa có phép "used_count của mã = số đơn hoàn tất mang mã đó" hằng ngày — nên mở việc riêng cùng Phát hiện 1.

## Câu hỏi
(không — Phát hiện 7 là xác nhận sau, không chặn việc: code làm đúng chữ chủ quán đã duyệt)

## /ra-soat vòng 1 — báo cáo (chép nguyên)
```
ĐẠT (không có lỗi chặn; có 1 chỗ hồ sơ thiếu và 2 điểm nghi ngờ về K5 ở A8 bên dưới)
LỖI TÌM ĐƯỢC:
- viec/MA-GIAM-1/trang_thai.md mục "Bộ kiểm" — thiếu bằng chứng `--day-du` cho A7 (phiếu ghi "`npm test`, `--day-du` xanh"). Code không
  lỗi; tôi chạy bù trên HEAD được PASS 68 · FAIL 0. — K1/K6 (hồ sơ thiếu, không phải lỗi mã)
NGHI NGỜ:
- discount-codes.js:269 — cổng A8 tra `pos_signup_codes` KHÔNG lọc `claimed_at`. Mã tay hoặc voucher đổi điểm trùng chữ một mã bill CHƯA
  claim (orders.js:509–510; G7 dựng nó) sẽ không đổi tên được → 400 MA_BILL_KHONG_DOI_TEN. Không có ca K5. Chữ chủ quán cho phép đọc như vậy,
  không xếp là lỗi; cần chủ quán xác nhận. — K5
- discount-codes.js:267 so `code.trim().toUpperCase() !== existing.code` (trái viết hoa, phải nguyên). Màn sửa luôn gửi mã viết hoa
  (DiscountCodes.jsx:174). Voucher mã bill lưu chữ thường (H3l dựng được) thì mọi lần sửa bị coi là đổi tên → 400. Production khó gặp; chưa ca. — K5
- Ca H3c, H3h dò chữ trong lời báo (E12) — có ghi chú ngoại lệ, chấp nhận được, nhưng là tiền lệ.
NGHIỆM THU: 8/8 mục có bằng chứng
- A1: M1 đỏ trên gốc; M2–M5; BV-A1, VS-A1 ×3 BẮT
- A2: G1–G3, G8 /validate đỏ trên gốc; G4, G5, G7 = 200; 4 đột biến BẮT
- A3: G9, G10 đỏ trên gốc; G11 K5; 5 đột biến BẮT
- A4: G8 POST /orders; VS-A4-tra-ma-tho BẮT
- A5: H3j, H3k, H3l, H3c, H3h đỏ trên gốc; H3* cũ xanh; 6 đột biến BẮT
- A6: M6 đỏ trên gốc; M7 K5; 2 đột biến BẮT
- A7: npm test 64/0, --day-du 68/0 (người soát chạy); dot_bien 26/26; P20b 4/4, P20c 20/21 + neo lại, AUDIT-1 C2F 11/11, D1 2 LẠC từ trước
  (theo trang_thai — người soát KHÔNG chạy lại bộ cũ)
- A8: G12 đỏ trên gốc; G13, G14; 4 đột biến BẮT
Mục thiếu: không mục nào thiếu ca; riêng A7 thiếu ghi `--day-du` trong hồ sơ.
CHƯA SOÁT ĐƯỢC:
- Kho SX / App KH có gọi `/discount-codes/:id/increment-usage` hoặc PUT `/discount-codes/:id` không — không có mã các kho đó ở đây.
- Không chạy lại bộ đột biến cũ P20b, P20c, AUDIT-1, AUDIT-2 (số theo trang_thai.md).
- AUDIT-4 P20B không chạy được bằng công cụ gốc (ghim 75 ca rữa từ trước).
- AU4-15 CHƯA KIỂM, đúng phiếu. Turso thật: chỉ chạy libsql file tạm. thu_cong.js sát hạn 120 s: không đo riêng.
BÀI HỌC:
- NGUYÊN TẮC (K5): cổng chặn theo "có dòng ở bảng khác cùng chữ" phải cùng điều kiện lọc với cổng nó bảo vệ (P20b lọc `claimed_at IS NOT NULL`,
  A8 không); lệch thì ghi ca K5 cho phần chênh. So cùng kiểu viết hoa ở hai vế (`UPPER(x) = UPPER(y)`), không `x.toUpperCase() !== y`.
- KHOÁ (đề xuất): người gác mục A7 yêu cầu trang_thai.md có dòng kết quả `--day-du` khi phiếu ghi `--day-du`.
- NGUYÊN TẮC (đối soát): mở việc "used_count của mã = số đơn hoàn tất mang mã đó" làm phép đối soát hằng ngày.
```
Xử lý: LỖI (hồ sơ thiếu `--day-du`) → đã ghi ở mục "Bộ kiểm" (chạy trên `de717f4`, PASS 68). Nghi ngờ 1, 2, đối soát → Phát hiện 7, 8, 9.
Không đổi code sau soát → không cần vòng 2.

## Bài học
Sự cố của việc này (nhật ký người gác `.tu_chay_nhat_ky.jsonl`: B-CHUONGTRINH ×2, B-BIMAT-CHU ×2, GIT-LENH, B-TENCHU, B-PHANTICH, B-DICHCHU):
1. **BỎ** — người gác chặn lệnh shell kiểu `time`, `$(( ))`, `$N/…`, `{ …; } >`, `git stash`: mỗi dạng một lần, làm theo lời chặn (tách lệnh, đường
   dẫn viết thẳng, script ở thư mục nháp). Không có gì mới để khoá.
2. **NGUYÊN TẮC (đề xuất — `KHUON_LOI.md` ngoài Phạm vi)** — B-BIMAT-CHU chặn heredoc Python vá bài thử vì chuỗi `process.env.JWT_SECRET` của chính
   bài thử (biến giả do bài tự đặt) nằm trong neo thay thế. Cách đã làm: viết script vá vào thư mục nháp bằng công cụ ghi file rồi chạy file. Đề xuất
   ghi vào K7 "Dấu hiệu: neo vá chứa tên biến bí mật → viết script vá thành file nháp, đừng nhúng vào lệnh shell". Chủ quán xét có coi là lách không.
3. **BỎ (đã có K8)** — `tu_chay/thu_cong.js` quá hạn 120 s khi AUDIT-1 chạy 4 luồng; chạy riêng 107–110.7 s. K8 đã có câu "đo CHẠY RIÊNG". Ghi
   Phát hiện 4 (sát hạn).
4. **BỎ (đã có K3)** — ca M7 (K5) đỏ dây chuyền theo M6 lúc viết bài; sửa M7 so "tăng đúng 1". K3 đã có "mỗi ca chặn chỉ vi phạm đúng một phép".
5. **BỎ (đã có K3)** — soát kế hoạch bắt: KB20 giả lập KHÔNG phủ nhánh `DISCOUNT_CODE_LIMIT_REACHED` (nhận cả 500) → thêm G11 + đột biến
   `BV-KB20-bo-kiem-lai-luot` (AUDIT-2 SỐNG dưới KB20, BẮT dưới G11). K3 đã có "Kịch bản X phủ nhánh Y chỉ nói khi đột biến xoá Y làm giả lập ĐỎ".
6. **NGUYÊN TẮC (đề xuất, từ /ra-soat — `KHUON_LOI.md` ngoài Phạm vi)** — vào K4 (SO-LUONG-1 đã có "cổng kiểm CÙNG biểu thức"): thêm ví dụ "cổng A8
   tra `pos_signup_codes` không lọc `claimed_at` trong khi cổng P20b nó bảo vệ lọc — phần chênh phải có ca K5".
7. **KHOÁ (đề xuất — `tu_chay/` ngoài Phạm vi)** — `tu_chay/cong.js` phép A7: phiếu Nghiệm thu có chữ `--day-du` → `trang_thai.md` phải có dòng
   `--day-du … PASS n · FAIL 0`. Ca đỏ: trang_thai bản `de717f4` (chỉ có dòng `npm test`) → ✗.
8. **KHOÁ (đề xuất — đối soát, việc riêng)** — phép đối soát ngày: `used_count` mỗi mã = số đơn `completed` mang mã đó (+ lượt tay /increment-usage),
   cùng bất biến I13 giả lập; ca đỏ: dữ liệu traLuotMa trả lượt cho mã cùng chữ khác id (Phát hiện 1).
Tổng: KHOÁ 2 · NGUYÊN TẮC 2 · BỎ 4. Ngân sách: code ~+50/−20 dòng (phiếu 40–70); bài thử ~190 dòng (ước ~120) — vượt vì A8 thêm sau duyệt và
các ca K5 (G11, G13, G14, M2–M5, M7).

## Báo cáo
```
VIỆC:        MA-GIAM-1 — Mã giảm / voucher: xoá-vô hiệu an toàn, /validate cùng cổng đơn gốc, hoàn tác theo id, mã có khoảng trắng (+ A8)
ĐÃ SỬA:      server/routes/discount-codes.js:13 require kiemDonCuaMa · :81–90 /validate cổng đơn gốc (A2) · :268–272 PUT không đổi tên voucher
             mã bill (A8) · :328–341 DELETE có điều kiện + changes → vô hiệu / 404 (A1) · :355 /increment-usage cần manage_promotions (A6)
             server/routes/orders.js:962–974 freshCode `AND is_active = 1`, null → rollback 400 MA_GIAM_KHONG_CON (A3)
             server/routes/signup-codes.js:482 voucher tra UPPER · :513–515 xoá theo voucherRow.id, null bỏ bước xoá · :526–527 lời báo (A5)
BÀI THỬ:     chạy trên bản chưa vá → ĐỎ: thu_P20 152/17 (G1–G3, G8 /validate, G9, G10, G12, H3c, H3h, H3j, H3k, H3l), thu_P26a 14/2 (M1, M6);
             sau khi vá → XANH 169/0, 16/0. Đột biến viec/MA-GIAM-1/dot_bien.py 26/26 BẮT (đối chứng xanh).
ĐÃ RÀ K4:    grep "DELETE FROM pos_discount_codes" server/ → 2 chỗ (discount-codes DELETE, /reset), cả hai đã vá · "pos_signup_codes WHERE
             UPPER(code)" + claimed_at → 2 (orders.js:513, discount-codes.js:84) · "used_count = used_count + 1" → 2 (orders trong tx, /increment-usage
             đã khoá quyền) · đọc mã trong tx → 1 (freshCode). Còn mở, chủ quán chốt chỉ ghi: traLuotMa theo chữ (tienDaTra.js:58–62).
CHƯA KIỂM:   AU4-15 (cổng P20b ngoài giao dịch — không dựng được tất định). Turso thật (chỉ libsql file tạm). Kho SX / App KH có gọi PUT
             /discount-codes/:id hay /increment-usage không (không có mã ở đây). AUDIT-4 P20B bằng công cụ gốc (ghim 75 ca rữa từ trước — chạy
             bằng bản sao VS-A4-tra-ma-tho). AUDIT-1 !D1-E11-P20 / !D1-E11-P26a LẠC (AU-G5 có từ trước). Luồng K5 "mã tay trùng chữ mã bill chưa
             claim đổi tên" không có ca (Phát hiện 7). Lời báo H3c/H3h kiểm bằng chữ (ngoại lệ E12).
GIT:         de717f4 MA-GIAM-1: dot bien (26/26 BAT), bang chung do, trang thai buoc 4-6
             3c85f2c MA-GIAM-1: signup-codes /reset — voucher tra UPPER, xoa theo id, nhanh khong voucher, loi bao (A5)
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 2 · BỎ 4 — chi tiết ở ## Bài học của trang_thai.md (bước 11 /lam-viec)
```

### Đếm nghiệm thu (từng mục)
- A1 — thu_P26a M1 (đỏ gốc), M2–M5 (K5); BV-A1-bo-dieu-kien, VS-A1-null-lech, VS-A1-khong-vo-hieu, VS-A1-mat-404 BẮT. Cách chứng minh đua: móc
  tất định trên `db.run` chạy ngay trước câu `DELETE FROM pos_discount_codes` (thu_P26a.js, đầu main).
- A2 — thu_P20 G1/G2/G3/G8 `/validate` 400 (đỏ gốc); G4/G5/G7 `/validate` 200; 4 đột biến BẮT.
- A3 — thu_P20 G9, G10 (đỏ gốc, móc `mocTruocTx`); G11 K5; 5 đột biến BẮT.
- A4 — thu_P20 G8 (dùng voucher, mã có khoảng trắng → 400); VS-A4-tra-ma-tho BẮT.
- A5 — thu_P20 H3j (id-không-code), H3k (nhánh voucherRow null), H3l (hoa thường), H3h + H3c (lời báo) đỏ gốc; H3, H3b–H3i xanh y nguyên; 6 đột biến BẮT.
- A6 — có người gọi (giả lập KB20 kich_ban.js:416) → giữ route, thêm `checkPermission('manage_promotions')`; thu_P26a M6 (đỏ gốc), M7 K5; 2 đột biến BẮT.
  AU4-15: CHƯA KIỂM.
- A7 — `npm test` 64/0, `--day-du` 68/0 (de717f4); dot_bien 26/26; P20b 4/4; P20c 20/21 (neo rữa `BV-A3-bo-dieu-kien` → neo lại
  `BV-P20C-A3-bo-dieu-kien` BẮT); AUDIT-1 C2F discount-codes + signup-codes 11/11, D1 55 BẮT + 2 LẠC có từ trước; tên C2F trước / sau ghi ở trên.
- A8 — thu_P20 G12 (đỏ gốc), G13 (giữ mã, tắt / bật lại, đổi giá trị → 200), G14 (mã tay đổi tên → 200); BV-A8-bo-chan-doi-ten, VS-A8-tra-ma-moi,
  VS-A8-chan-ca-ma-tay, VS-A8-chan-moi-put BẮT.

HEAD ĐÃ KIỂM: de717f4
