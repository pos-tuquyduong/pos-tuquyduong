# P26b — Trạng thái

## Bản chụp lúc bắt đầu (03.10.2026)

```
$ git branch --show-current
viec/P26b
$ git log --oneline -3
6efcc3b PHIEU: P26b
9b0ba61 TIEN-DO: P26a xong (aa34031), them AUDIT-1, mo P26b — so v18
aa34031 Merge pull request #7 from pos-tuquyduong/viec/P26a
```

## Tiến độ

- [x] Bước 1 đối chiếu bản chụp (trên).
- [x] Bước 2 đọc phiếu, CLAUDE.md, KHUON_LOI.md, code thật 5 route + giả lập + bộ kiểm; thử thật libsql giao dịch chồng nhau.
- [x] Bước 3 kế hoạch `ke_hoach.md` (e912cde) + soát kế hoạch bằng agent phụ chỉ đọc → **KHÔNG ĐẠT**: KB16 xanh oan
      (gốc ví +1 nhưng sổ 2 dòng), A4b không bắt "từ chối ngoài tx", F2 tìm dấu `//` mà `boGhiChu` xoá mất, M10 sẽ gãy,
      thiếu ca khongAm trừ tay/điều chỉnh và báo hỏng chồng nạp, sót backup.js + 3 phát hiện, 3 luồng K5. Đã sửa hết vào
      `ke_hoach.md` (thêm Q6–Q8, Phát hiện 7–9); bằng chứng kho bận chép vào `thu_kho_ban.js`.
- [x] Chủ quán duyệt aff6fde (Q1–Q8, ghi ở `ke_hoach.md` mục 12, a3ca5b8) — làm tiếp không dừng.
- [x] Bước 4 bài thử ĐỎ trên gốc → `bang_chung_do.txt` (chạy lại bằng bài CUỐI trên `git archive 6efcc3b server`):
      thu_P26b 10 đạt / 33 hỏng (10 ca xanh đều là ca K5 / "giữ"; A2d đỏ trên gốc CHỈ vì thiếu `code` — gốc đã chặn
      ngoài giao dịch), giả lập KB13–KB18 32 lệch (KB1–KB12 sạch), thu_P26a C4 ✗, bộ kiểm nhanh 5 FAIL.
      Ca K1b (thêm ở vòng sửa 1, sau bản ghi bằng chứng) đỏ trên gốc theo cùng lẽ K1 (gốc 500 / không có giao dịch).
- [x] Bước 5 vá 5 route. Bản lưu trước khi vá: thư mục nháp `truoc_P26b/` (ngoài kho).
      Giả lập bắt thêm một lỗ khi vá: tạo đơn kiểm số dư SAU khi ghi đơn → hai đơn chồng nhau trùng `pos_orders.code`
      → 500 thay vì 400. Sửa: trừ ví (cổng khongAm) TRƯỚC câu INSERT đơn, gắn order_id cho dòng sổ ngay sau.
- [x] Bước 6 thu_P26b 43/43, thu_P20 51/51, thu_P21 14/14, thu_P26a 8/8, giả lập 18 · 10 ĐẠT, thu_gia_lap 33/33,
      `npm test` 61/0, `--day-du` 65/0 (giả lập 62 s, thu_gia_lap 65 s). Đột biến F3: 50/50 bị bắt (lượt 2).
- [x] Bước 7 commit từng file. Commit ca28d80…9f2d478: dòng ghi công dính vào tiêu đề (thiếu dòng trống) — hình thức,
      không viết lại lịch sử đã push.
- [x] Bước 8 `/ra-soat` vòng 1 **KHÔNG ĐẠT** (báo cáo dưới). Vòng sửa 1/3: K1b + `order?.code` ở catch huỷ/xoá
      (orders.js), regex E12 không phân biệt hoa thường + REPLACE / INSERT OR / ngoặc kép, 2 đột biến mới, sửa số liệu
      và thêm tên đột biến vào file này. Sau sửa: thu_P26b 55/55, đột biến mới 2/2 bị bắt.
      Bộ kiểm: phép E12 (đối soát) do chính việc này viết đỏ oan lúc đầu — đòi `beginTransaction(` trong thân
      reconcileWallet trong khi mã gọi `trongGiaoDich(` (hàm mở giao dịch). Truy nguyên trước, rồi sửa phép (K2).


## Đột biến F3 — `python3 viec/P26b/dot_bien.py [tên…]` (mỗi đột biến chạy trên BẢN SAO, phải ra đúng dòng lệch)

40 đột biến viết tay + 12 đột biến `K1-bo-409-<route>` sinh tự động (bỏ ánh xạ 409 ở TỪNG route):
`huy-bo-cong` · `huy-khong-kiem-changes` · `huy-kiem-ngoai-tx` · `huy-bo-tu-choi-yeu-cau` · `huy-tu-choi-ngoai-tx` · `xoa-hoan-bat-ke-trang-thai` · `xoa-doc-don-ngoai-tx` · `tao-don-chi-kiem-ngoai-tx` · `yc-bo-kiem-trung` · `yc-kiem-trung-ngoai-tx` · `duyet-bo-chiem-yeu-cau` · `duyet-khong-kiem-changes` · `duyet-bo-cong-don` · `duyet-cong-don-khong-kiem-changes` · `tu-choi-bo-dieu-kien` · `tu-choi-khong-kiem-changes` · `Q8-bo-chan-goi` · `Q8-chi-chan-luc-tao` · `nap-ghi-tuyet-doi-tu-so-ngoai-tx` · `nap-so-truoc-doc-ngoai-tx` · `ghiVi-bo-khongAm` · `tru-tay-chi-kiem-ngoai-tx` · `dieu-chinh-bo-khongAm` · `doi-soat-bo-tx` · `doi-soat-doc-tong-ngoai-tx` · `hong-bo-tran` · `hong-tran-theo-man-hinh` · `hong-lay-dong-dau` · `hong-bo-tran-cong-don` · `hong-bo-cong-don-so-luong` · `hong-cong-don-ngoai-tx` · `hong-bo-chan-don-huy` · `hong-quen-refunded` · `hong-log-ngoai-tx` · `hong-bo-order-id-so` · `huy-catch-doc-order-code` · `xoa-catch-doc-order-code` · `packages-buy-dung-lai` · `I1-nhanh-refunded-false` · `I10-bo`

## Câu hỏi

Q1–Q8 đã trả lời (ke_hoach.md mục 12). Chưa có câu hỏi mới.

## Phát hiện

Xem `ke_hoach.md` mục 10 (1–9) — ngoài phạm vi, KHÔNG sửa (3 đã xử lý theo Q6). Thêm:

10. Mã đơn `pos_orders.code` sinh NGOÀI giao dịch (`orders.js`, trước `beginTransaction`) → hai đơn tạo chồng nhau (không
    cần trả ví) trùng mã → đơn sau 500 `SQLITE_CONSTRAINT_UNIQUE`. Giả lập KB17 lộ ra; việc này chỉ né cho đường ví thua
    (400 trước INSERT). Hai đơn tiền mặt bấm cùng lúc vẫn có thể 500 — chưa dựng ca, CHƯA KIỂM.
11. Giả lập 18 KB chạy ~60 s (12 KB: 22 s); `thu_gia_lap` ~64 s — còn dưới hạn 110 s / 120 s nhưng biên hẹp dần.
12. `POST /:id/pay-debt` (`orders.js`, cổng `status != 'cancelled'`) vẫn cho thu nợ đơn `refunded`, và kho bận vẫn 500
    (route ngoài phạm vi P26b). — soát vòng 1.
13. Trần đền bù (C1) tính theo `unit_price` gốc; đơn có giảm flash / hạng thì khách trả ít hơn (`flash_unit_price`,
    `tier_unit_price` trong `pos_order_items`) → đền đủ `unit_price` là đền nhiều hơn số khách trả. Đúng chữ quyết
    định C1 — chủ quán biết để quyết. — soát vòng 1.

## Soát độc lập — vòng 1 (chép nguyên báo cáo)

```
KHÔNG ĐẠT
Bài thử, đột biến và đường tiền đều tốt. Còn một lỗi thật trên đường production làm hỏng cam kết Q1 "kho bận → 409,
KHÔNG 500" ở huỷ đơn và xoá đơn, cùng hai chỗ hồ sơ chưa đủ theo phiếu.

Những gì tôi đã chạy trong lượt này:
- node cong_cu/thu_P26b.js trên bản vá: 43 đạt · 0 hỏng.
- node cong_cu/thu_P26b.js --may-chu <git archive 6efcc3b server>: 10 đạt · 33 hỏng, khớp bang_chung_do.txt mục 1.
- python3 viec/P26b/dot_bien.py (đủ cả bộ): 50/50 đột biến bị bắt, 0 lọt.
- npm test: PASS 61 · FAIL 0.

LỖI TÌM ĐƯỢC:
1. server/routes/orders.js:1409 (huỷ) và :1548 (xoá) — trả 500 thay vì 409 khi lỗi xảy ra ở câu đầu trong giao dịch — K3 + K4.
   - Vì sao: bản vá dời SELECT đơn vào trong try, nên order có thể còn undefined khi tới khối catch. Khối catch lại in
     order.code. Câu SELECT đầu ném lỗi thì khối catch ném TypeError, lỗi gốc bị nuốt, loiGhi trả 500.
   - Vì sao xảy ra trên Turso: client Turso (node_modules/@libsql/client/lib-cjs/hrana.js:53-89) gửi BEGIN lười, gộp vào
     câu lệnh đầu tiên. Vì vậy SQLITE_BUSY (hay lỗi mạng) lộ ra ở tx.queryOne đầu, không phải ở beginTransaction().
   - Vì sao bài thử không bắt được: ca K1 trong cong_cu/thu_P26b.js chỉ ném BUSY lúc mở giao dịch, tức kiểu chạy kho
     file của Replit. Ca đó xanh oan cho đường Render + Turso.
   - Đã dựng lại tất định: chép thu_P26b.js ra thư mục nháp, đổi công tắc thành "câu lệnh đầu trong giao dịch ném
     SQLITE_BUSY". Kết quả: ✗ K1 huỷ đơn — HTTP 500 · Cannot read properties of undefined (reading 'code') và ✗ K1 xoá
     đơn y hệt; 10 route còn lại vẫn 409.
   - Hướng sửa: dùng order?.code ở hai dòng trên (hoặc chuyển hai route sang trongGiaoDich), và thêm biến thể "BUSY ở
     câu đầu" vào K1.
2. viec/P26b/trang_thai.md — thiếu tên đột biến, phiếu F3 đòi bắt buộc — K7.
3. viec/P26b/trang_thai.md — số liệu cũ, lệch kết quả thật — K1 (bước 4 ghi 10/31 và 31 lệch, thật 10/33 và 32 lệch;
   bước 6 ghi 42/42, thật 43/43). Ngoài lề: commit ca28d80…9f2d478 có dòng ghi công dính vào dòng tiêu đề.

NGHI NGỜ:
- Phép E12: regex (?:UPDATE|INSERT\s+INTO)\s+pos_wallets phân biệt hoa thường, bỏ qua update chữ thường,
  INSERT OR REPLACE INTO, REPLACE INTO và "pos_wallets" có ngoặc kép. Hiện trong server/routes không có lệnh dạng này.
- damages.js — gửi refund_amount: 0 thì được đền đủ giá (có từ trước P26b; Orders.jsx:1384 cho gõ 0).
- Trần đền bù tính theo unit_price: có thể cao hơn giá khách thật trả khi có flash / giảm theo hạng.
- ghiVi tự tạo ví khi chưa có ví ở huỷ / xoá đơn: đổi hành vi (không chặn oan luồng nào).
- pay-debt (orders.js:1234) vẫn cho thu nợ đơn refunded và vẫn 500 khi kho bận — ngoài phạm vi, chưa có trong Phát hiện.

Sáu mục soát: 1 K3 đạt (riêng K1 bị lỗi 1) · 2 K4 đạt (ghi ví 4 chỗ, tất cả trong ghiVi / reconcileWallet) · 3 K5 đạt ·
4 K1 còn lỗi 3 · 5 Đường tiền: không thấy trường tiền nào lấy từ client mà không tra · 6 P1 không áp dụng.

CHƯA SOÁT ĐƯỢC: --day-du, thu_gia_lap, thu_P20/P21, giả lập 18 KB trên bản vá (KB13–18 chạy gián tiếp qua đột biến);
hành vi BUSY thật trên Turso; kết nối libsql sau BUSY (Phát hiện 5).

BÀI HỌC:
- KHOÁ: K1 thêm biến thể "BUSY ở câu lệnh đầu tiên trong giao dịch" (BEGIN lười của Turso), kèm đột biến "khối catch
  đọc biến được gán trong try".
- KHOÁ: regex E12 không phân biệt hoa thường, bắt cả REPLACE, INSERT OR … và tên bảng trong ngoặc kép.
- NGUYÊN TẮC (K3/K4): dời câu đọc vào trong try của giao dịch thì phải rà catch / finally xem có đụng biến đó không.
  Bài thử lỗi hạ tầng phải giả lập theo đúng đường production (Turso), không chỉ đường kho file.
```

Xử lý: lỗi 1, 2, 3 và nghi ngờ E12 đã sửa (vòng sửa 1/3). Nghi ngờ "refund_amount 0" = Phát hiện 6; "unit_price" =
Phát hiện 13; "tự tạo ví" đã nêu ở ke_hoach.md mục 1 (Đổi hành vi nêu rõ); "pay-debt" = Phát hiện 12.
