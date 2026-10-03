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
- [x] Bước 4 bài thử ĐỎ trên gốc → `bang_chung_do.txt` (chạy lại sau soát vòng 2 bằng bài ở commit aebb663 trên
      `git archive 6efcc3b server`): thu_P26b 10 đạt / 45 hỏng (10 ca xanh đều là ca K5 / "giữ"; 12 ca K1b đỏ;
      A2d đỏ trên gốc CHỈ vì thiếu `code` — gốc đã chặn ngoài giao dịch), giả lập KB13–KB18 32 lệch (KB1–KB12 sạch),
      thu_P26a C4 ✗, bộ kiểm nhanh 5 FAIL.
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
- [x] `/ra-soat` vòng 2 **KHÔNG ĐẠT** — chỉ hồ sơ (báo cáo dưới): bằng chứng đỏ cũ (43 ca) dù tự ghi "bản cuối"; thiếu
      Phát hiện "huỷ rồi xoá đơn giao từ gói hoàn gói hai lần". Vòng sửa 2/3: chạy lại bằng chứng (55 ca: 10/45), thêm
      Phát hiện 14–17, bổ sung 13. Không đổi dòng mã nào.
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
    định C1 — chủ quán biết để quyết. — soát vòng 1. Giảm giá cấp đơn (mã chiết khấu, giảm tay — `pos_orders.discount`)
    cũng làm số đền có thể vượt số khách thực trả. — soát vòng 2.
14. **Hoàn GÓI hai lần**: xoá đơn "giao từ gói" (`orders.js:1518-1531`) trừ `delivered_qty` KHÔNG xét `order.status`; huỷ
    đơn (`:1376-1393`) đã trừ rồi. Màn hình chỉ cho xoá đơn đã huỷ (`Orders.jsx:242`) → luồng thường ngày "huỷ rồi xoá"
    trừ gói hai lần (agent soát chạy thật: giao 5 → huỷ 2 ly còn 3 → xoá còn 1). Có từ trước P26b; cùng khuôn A3 nhưng
    là gói, không phải ví — ngoài nghiệm thu, KHÔNG sửa. Đề xuất việc sau: ca "huỷ rồi xoá đơn giao từ gói → delivered_qty
    chỉ hoàn một lần" (đỏ trên gốc) + cổng trạng thái như A3. — soát vòng 2.
15. Huỷ đơn: câu `query(...)` lấy món để hoàn kho SX (`orders.js:1414-1420`) nằm SAU commit, ngoài try con. Nó ném
    SQLITE_BUSY thì `loiGhi` trả 409 "bấm lại" dù đơn ĐÃ huỷ, kho SX không được hoàn, không có dòng `pos_stock_pending`.
    Trước P26b đường này trả 500 (cũng sai) — không phải lỗi mới nhưng trái lời hứa của `loiGhi`. — soát vòng 2.
16. Báo hỏng `return_stock` trên đơn đã huỷ vẫn gọi SX hoàn kho lần hai (huỷ đã hoàn kho) — C3 chỉ chặn `refund`. Có từ
    trước. — soát vòng 2.
17. Ví có `balance` NULL (dữ liệu cũ / khôi phục sao lưu): `ghiVi` ghi `balance = balance + ?` giữ NULL, dòng sổ ghi
    `sau = 0 + soTien`. Schema có `DEFAULT 0` nên khả năng thấp. — soát vòng 2.

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

## Soát độc lập — vòng 2 (chép nguyên báo cáo)

```
KHÔNG ĐẠT — mã đúng, hồ sơ chưa đạt

Mã của bản vá đúng: mọi bài thử, đột biến và cổng tôi tự chạy lại đều xanh. Còn hai chỗ chưa đạt, đều nằm ở hồ sơ, không
cần sửa dòng mã nào trong phạm vi: Lỗi 1 file bằng chứng đỏ đã cũ nhưng vẫn tự ghi là chạy bằng bài thử cuối; Lỗi 2 có một
lỗ hoàn gói hai lần đã có từ trước, nằm ngay trong route xoá đơn mà bản vá vừa đụng vào, nhưng chưa được ghi vào Phát hiện.

Đã chạy: thu_P26b trên bản vá 55 đạt · 0 hỏng; --may-chu bản sao gốc 10 đạt · 45 hỏng (10 ca xanh đều là K5; cả 12 ca K1b
đỏ trên gốc); dot_bien.py đủ bộ 52 bị bắt · 0 lọt (gồm huy-/xoa-catch-doc-order-code ra đúng "HTTP 500 · Cannot read
properties of undefined (reading 'code')"); giả lập "18 kịch bản · 10 bất biến · ĐẠT"; npm test PASS 61 · FAIL 0;
--day-du PASS 65 · FAIL 0 (thu_P20, thu_P21, thu_P26a, thu_P26b xanh; thu_gia_lap 64.3 s).

Cách vòng 1 đã được xử lý: lỗi 1 sửa đúng (orders.js:1410, :1546 dùng order?.code || '#' + req.params.id; rà K4 catch
đọc biến gán trong try: chỉ 2 chỗ này); lỗi 2 sửa đúng (tên 52 đột biến); lỗi 3 mới sửa một phần (lỗi 1 dưới).

LỖI TÌM ĐƯỢC:
1. viec/P26b/bang_chung_do.txt:1-2 và :70 — dòng đầu ghi "bản CUỐI của nhánh này" nhưng nội dung là bản chạy trước K1b
   (43 ca, "10 đạt · 33 hỏng", nhãn K1 kiểu cũ). Bài cuối có 55 ca; chạy trên gốc ra 10 đạt · 45 hỏng. File ghi ở bc15c2f,
   K1b vào sau ở 5bdbd62. trang_thai.md bước 4 chỉ khẳng định suông "đỏ trên gốc theo cùng lẽ K1". K1 + K7, lặp lỗi 3 vòng 1.
2. server/routes/orders.js:1518-1531 (xoá đơn, nhánh "giao từ gói") so với :1376-1393 (huỷ đơn, cùng nhánh) — gói bị hoàn
   hai lần. Xoá trừ delivered_qty KHÔNG xét order.status; màn hình chỉ cho xoá đơn đã huỷ (Orders.jsx:242) nên "huỷ rồi
   xoá" trừ gói hai lần. Chạy thật (scratchpad/soat_goi.js): giao 5 → huỷ 2 ly còn 3 → xoá còn 1 (đúng ra 3). Có từ trước
   (gốc y hệt 5 → 3 → 1). Đúng khuôn "hoàn hai lần" của phiếu, trong chính hàm đã gắn cổng completed cho ví (A3) nhưng không
   cho gói. Chưa có trong Phát hiện. K4. Không tự sửa vì ngoài phạm vi — chỉ ghi Phát hiện.

NGHI NGỜ:
- Huỷ đơn, đọc sau commit (orders.js:1414-1420): query lấy món để hoàn kho nằm ngoài try con; ném SQLITE_BUSY sau commit thì
  loiGhi trả 409 "chưa ghi gì" dù đơn đã huỷ, kho SX không được hoàn, không có pos_stock_pending. Trước đây 500 — không
  mới, nhưng trái lời hứa của loiGhi (wallets.js:79). reconcile-all tương tự (chạy lại được).
- E12 chỉ là phép tĩnh theo mẫu chữ: không bắt UPDATE main.pos_wallets, nối chuỗi, tên bảng là biến (Phát hiện 7), DELETE
  FROM pos_wallets; chỉ quét server/routes/*.js. Đúng chữ F2 nhưng có thể lách.
- Trần đền bù C1 theo unit_price: giảm giá cấp đơn (pos_orders.discount) cũng làm số đền vượt số khách trả — bổ sung Phát hiện 13.
- Ví balance NULL: ghiVi giữ NULL, sổ ghi sau = 0 + soTien. Schema DEFAULT 0 nên khả năng thấp.
- Báo hỏng return_stock / return_to_stock trên đơn đã huỷ vẫn hoàn kho SX lần hai. Có từ trước; chuyện kho.
- Đột biến tao-don-chi-kiem-ngoai-tx hiện bị KB17 bắt qua 500 trùng mã đơn (Phát hiện 10), không qua số dư. Sửa Phát hiện
  10 thì theo suy luận vẫn bị bắt (ví lệch), chưa chạy thử.

Sáu mục: 1 K3 đạt (45 ca đỏ trên gốc, 52/52 đột biến, camNgoai + chặn run() khi giao dịch mở thu_P26b.js:79-84) · 2 K4 ghi
ví đạt (4 chỗ trong ghiVi / reconcileWallet; ghiVi gọi 11 chỗ đều truyền tx; đổi trạng thái đơn orders.js:1317,
refunds.js:157; yêu cầu hoàn orders.js:1400, refunds.js:153, :192 — đều có điều kiện + changes), chưa đủ ở gói (lỗi 2) ·
3 K5 đạt · 4 K1 chưa đạt (lỗi 1) · 5 Đường tiền đạt · 6 P1 không áp dụng.

CHƯA SOÁT ĐƯỢC: BUSY thật trên Turso (BEGIN lười có thật không, BUSY ngay hay chờ); kết nối libsql sau BUSY; hai đơn tiền mặt
cùng lúc trùng mã; bấm chồng thật trên production (chỉ dựng bằng móc truocTx).

BÀI HỌC:
- KHOÁ: ca "huỷ rồi xoá đơn giao từ gói → delivered_qty chỉ hoàn một lần" (đỏ trên gốc) — việc sau, ngoài phạm vi P26b.
- KHOÁ: bang_chung_do.txt phải ghi số ca bằng đúng số ca của bài thử hiện tại (so "N đạt · M hỏng"); lặp hai vòng soát.
- NGUYÊN TẮC (K4): đã gắn cổng trạng thái cho một khoản hoàn (ví) thì grep mọi khoản hoàn khác trong cùng hàm (gói, thẻ,
  kho, điểm) và gắn cùng cổng, hoặc ghi Phát hiện.
- NGUYÊN TẮC (K1): thêm ca thử sau khi đã ghi bằng chứng đỏ thì phải chạy lại và chép lại bằng chứng.
```

Xử lý (vòng sửa 2/3): lỗi 1 — chạy lại bằng chứng bằng bài ở aebb663 (10 đạt · 45 hỏng, 12 ca K1b đỏ), ghi rõ commit trong
đầu file; lỗi 2 — Phát hiện 14 (không sửa: gói, ngoài nghiệm thu). Nghi ngờ → Phát hiện 13 (bổ sung), 15, 16, 17; E12 lách
được bằng nối chuỗi / tên biến — giữ, đã có bài thử hành vi + giả lập canh (ghi ở mục Bài học).
