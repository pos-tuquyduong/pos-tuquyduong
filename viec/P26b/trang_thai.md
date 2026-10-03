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
      thu_P26a C4 ✗, bộ kiểm nhanh 5 FAIL. **Ghi lại lần 3 sau soát vòng 3** (bài 62 ca, thêm ví mẹ): thu_P26b
      14 đạt / 48 hỏng (14 xanh = 10 ca K5 cũ + M1–M4 là ca K5 ví mẹ; M5, M6 đỏ trên gốc — **SỬA SAU SOÁT VÒNG 4: KHÔNG phải
      "gốc hoàn ví mẹ lần hai"**. Gốc hoàn ví MẸ đúng MỘT lần (lúc huỷ / xoá); khoản hoàn hai lần là của ví CON (duyệt +
      huỷ). [CŨ — trước Q9; M5/M6 đã viết lại ở vòng Q9, M6 tự đứng.] M5/M6 đang khoá việc ví mẹ KHÔNG được hoàn — xem Câu hỏi Q9. M6 đỏ nhờ trạng thái M5 để lại (ca gộp, K3).
      M7 đỏ chỉ vì thiếu `code`), giả lập 33 lệch (thêm "hai đơn trừ ví mẹ chồng nhau" — đỏ trên gốc chỉ vì thiếu `code`).
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
- [x] **Vòng Q9** (chủ quán chốt Q9 = (a), cho thêm ĐÚNG 1 vòng sửa + 1 vòng soát chỉ cho Q9): bài thử trước — M5 viết lại
      (duyệt hoàn → ví mẹ +20.000 đúng một dòng, ví con +5.000, yêu cầu vẫn 5.000), M6 tự đứng (đơn đã duyệt hoàn → huỷ
      400, xoá 200, ví mẹ không thêm), M8 mới (đơn có ví mẹ đã huỷ → duyệt 400, ví mẹ không đổi), KB17 thêm đơn con + mẹ
      → duyệt, bất biến I11 (theo TỪNG ví), M13 thu_gia_lap (phần mẹ vào ví con → KB17 → I11), NGUONG_BAT_BIEN 11.
      Đỏ RIÊNG của Q9: M5 (trước Q9 62/1 và trên gốc), KB17-Q9 (trước Q9, 1 lệch), M13 (thu_gia_lap). Trên gốc 6efcc3b
      M6, M8, KB17-Q9 và I11 cũng đỏ nhưng vì lỗi KHÁC (huỷ 200; duyệt đơn huỷ 200; KB17-Q9 404 vì ví con đã cạn — kịch bản
      không kiểm đơn tạo được; I11 chỉ ở dòng hoàn ví con hai lần) — soát vòng Q9 bắt câu tóm tắt cũ gộp chung.
      Vá `refunds.js` duyệt: sau cổng đơn, cùng giao dịch, đọc `parent_phone` / `parent_balance_amount` trong giao dịch,
      ghiVi refund có order_id cho ví mẹ (bỏ qua khi 0 / không có mẹ). Đột biến Q9 4/4 bị bắt (bỏ vá; vào ví con; ngoài
      giao dịch; giao dịch riêng không qua cổng đơn). Sau vá: thu_P26b 63/0, giả lập 18 · 11 ĐẠT.
- [x] `/ra-soat` vòng Q9 **ĐẠT** (báo cáo dưới) — 3 lỗi nhỏ ở bài thử / hồ sơ, không ở mã. Hồ sơ đã sửa (câu cũ M5/M6,
      câu tóm tắt đỏ trên gốc). M6 `<= 1` → `=== 1` KHÔNG sửa (chủ quán chỉ cho ĐÚNG 1 vòng sửa Q9, đã soát) → đề xuất KHOÁ.
      Câu hỏi mới Q10 (dữ liệu production cũ). Bước 9–11 xong. **DỪNG** — không merge, không PR.
- [x] `/ra-soat` vòng 4 **KHÔNG ĐẠT** (báo cáo dưới) — mã đạt, mọi phép kiểm xanh (thu_P26b 62/0, gốc 14/48 trùng từng
      dòng bằng chứng, giả lập gốc 33 lệch trùng từng dòng, 56/56 đột biến, npm test 61/0, --day-du 65/0), NHƯNG lời giải
      thích M5/M6 sai và che một thay đổi về tiền: đơn ví con + ví mẹ đã duyệt hoàn → phần ví mẹ hết đường lấy lại.
      **Đã hết 3 vòng sửa** (`so_vong_sua_toi_da`) → sửa câu sai, ghi Câu hỏi Q9, Phát hiện 21–22, rồi **DỪNG**.
- [x] `/ra-soat` vòng 3 **KHÔNG ĐẠT** (báo cáo dưới): ba chỗ ghi ví MẸ (`orders.js:810`, `:1337`, `:1499`) viết lại mà
      không ca thử / kịch bản / đột biến nào chạm — đột biến "không trừ ví mẹ + hoàn gấp đôi" qua hết. Vòng sửa 3/3 (CUỐI):
      thu_P26b thêm M1–M7, KB17 thêm hai đơn trừ ví mẹ chồng nhau, 4 đột biến `me-*` (4/4 bị bắt; `me-bo-khongAm` bị bắt
      qua 500 trùng mã đơn — Phát hiện 10, như `tao-don-chi-kiem-ngoai-tx`), ghi lại bằng chứng, Phát hiện 15 bổ sung, 18–20.
      Không đổi dòng mã nào trong `server/`. Sau sửa: thu_P26b 62/62, giả lập 18 · 10 ĐẠT.
      Bộ kiểm: phép E12 (đối soát) do chính việc này viết đỏ oan lúc đầu — đòi `beginTransaction(` trong thân
      reconcileWallet trong khi mã gọi `trongGiaoDich(` (hàm mở giao dịch). Truy nguyên trước, rồi sửa phép (K2).


## Đột biến F3 — `python3 viec/P26b/dot_bien.py [tên…]` (mỗi đột biến chạy trên BẢN SAO, phải ra đúng dòng lệch)

48 đột biến viết tay + 12 đột biến `K1-bo-409-<route>` sinh tự động (bỏ ánh xạ 409 ở TỪNG route):
`huy-bo-cong` · `huy-khong-kiem-changes` · `huy-kiem-ngoai-tx` · `huy-bo-tu-choi-yeu-cau` · `huy-tu-choi-ngoai-tx` · `xoa-hoan-bat-ke-trang-thai` · `xoa-doc-don-ngoai-tx` · `tao-don-chi-kiem-ngoai-tx` · `me-tao-don-khong-tru` · `me-huy-hoan-gap-doi` · `me-xoa-hoan-gap-doi` · `me-bo-khongAm` · `Q9-bo-hoan-me` · `Q9-hoan-me-vao-vi-con` · `Q9-hoan-me-ngoai-tx` · `Q9-hoan-me-khong-qua-cong-don` · `yc-bo-kiem-trung` · `yc-kiem-trung-ngoai-tx` · `duyet-bo-chiem-yeu-cau` · `duyet-khong-kiem-changes` · `duyet-bo-cong-don` · `duyet-cong-don-khong-kiem-changes` · `tu-choi-bo-dieu-kien` · `tu-choi-khong-kiem-changes` · `Q8-bo-chan-goi` · `Q8-chi-chan-luc-tao` · `nap-ghi-tuyet-doi-tu-so-ngoai-tx` · `nap-so-truoc-doc-ngoai-tx` · `ghiVi-bo-khongAm` · `tru-tay-chi-kiem-ngoai-tx` · `dieu-chinh-bo-khongAm` · `doi-soat-bo-tx` · `doi-soat-doc-tong-ngoai-tx` · `hong-bo-tran` · `hong-tran-theo-man-hinh` · `hong-lay-dong-dau` · `hong-bo-tran-cong-don` · `hong-bo-cong-don-so-luong` · `hong-cong-don-ngoai-tx` · `hong-bo-chan-don-huy` · `hong-quen-refunded` · `hong-log-ngoai-tx` · `hong-bo-order-id-so` · `huy-catch-doc-order-code` · `xoa-catch-doc-order-code` · `packages-buy-dung-lai` · `I1-nhanh-refunded-false` · `I10-bo`

## Câu hỏi

Q1–Q8 đã trả lời (ke_hoach.md mục 12).

**Q10 — dữ liệu production CŨ (soát vòng Q9; chờ chủ quán, KHÔNG tự làm).** Đơn đã `refunded` TRƯỚC khi P26b lên, có
`parent_balance_amount > 0`, phần ví mẹ chưa hoàn: trên gốc còn lấy lại được bằng Xoá đơn (gốc `orders.js:1607`); sau P26b
huỷ 400 (`orders.js:1316-1329`), xoá không hoàn (`orders.js:1493`), duyệt không chạy lại được (yêu cầu đã `approved`) →
phần mẹ mất hẳn, chỉ còn Điều chỉnh tay. Câu tra (chỉ đọc) để chủ quán chạy TRƯỚC khi lên production:
`SELECT o.id, o.code, o.parent_phone, o.parent_balance_amount FROM pos_orders o WHERE o.status = 'refunded' AND
o.parent_balance_amount > 0 AND NOT EXISTS (SELECT 1 FROM pos_balance_transactions t WHERE t.order_id = o.id AND
t.type = 'refund' AND t.customer_phone = o.parent_phone)`. Có dòng nào thì quyết: điều chỉnh tay từng ví mẹ, hay một việc
sau làm đường hoàn bù có kiểm.

**Q9 — ĐÃ TRẢ LỜI: (a)** — duyệt hoàn trả cả phần ví mẹ, cùng giao dịch, sau cổng đơn; refund_amount giữ phần ví con;
huỷ / xoá không đổi. (Nội dung câu hỏi giữ nguyên dưới đây làm hồ sơ.)

**Q9 — ví MẸ của đơn đã duyệt hoàn (soát vòng 4).**
- Sự thật (đọc trong lượt này): yêu cầu hoàn chỉ hoàn phần ví CON — `refunds.js:125` ghi `refund_amount = balance_amount`.
  Gốc (`git show 6efcc3b:server/routes/orders.js`): huỷ đơn hoàn ví mẹ không xét trạng thái (`:1400-1401`); xoá đơn hoàn
  ví mẹ khi `status !== 'cancelled'` (`:1607`) → đơn `refunded` vẫn được trả ví mẹ ĐÚNG MỘT lần.
- Sau P26b (A1, A3 đúng chữ phiếu): huỷ đơn `refunded` → 400 (`orders.js:1316-1329`); xoá chỉ hoàn khi `completed`
  (`orders.js:1493`); Q8 không đổi phần này. ⇒ **Đơn trả ví con + ví mẹ, đã duyệt hoàn → phần ví mẹ MẤT, không còn
  đường nào trả lại.** Ca M5/M6 của thu_P26b đang khoá đúng hành vi đó. (Trong thực tế quy tắc tạm ở quầy "đơn đã hoàn
  không huỷ" đã gây đúng hậu quả này từ trước P26b; P26b bỏ nốt đường xoá.)
- Phương án (chủ quán chọn): (a) duyệt hoàn hoàn CẢ phần ví mẹ (refund_amount = con + mẹ, dòng sổ cho từng ví); (b) huỷ /
  xoá đơn `refunded` hoàn phần ví mẹ MỘT lần (cổng theo từng ví, không theo đơn); (c) giữ như bản vá — chặn yêu cầu hoàn
  cho đơn có ví mẹ (như Q8: dùng Huỷ đơn). Chọn xong thì sửa M5/M6 + thêm bất biến "mỗi VÍ được hoàn ≤ phần ví đó đã trả
  cho đơn" (I10 hiện gộp mọi ví nên không thấy ví nào thiếu).

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
    `reconcile-all` cũng vậy: BUSY ở ví thứ k sau khi k−1 ví đã commit → 409 "chưa ghi gì" sai lời (chạy lại được). — vòng 3.
16. Báo hỏng `return_stock` trên đơn đã huỷ vẫn gọi SX hoàn kho lần hai (huỷ đã hoàn kho) — C3 chỉ chặn `refund`. Có từ
    trước. — soát vòng 2.
17. Ví có `balance` NULL (dữ liệu cũ / khôi phục sao lưu): `ghiVi` ghi `balance = balance + ?` giữ NULL, dòng sổ ghi
    `sau = 0 + soTien`. Schema có `DEFAULT 0` nên khả năng thấp. — soát vòng 2.
18. `ghiVi` tạo ví lúc hoàn (huỷ / xoá) khi ví đã mất (xoá tay, khôi phục thiếu): INSERT với `total_spent = -số_tiền`
    (tổng chi âm). Việc tạo ví đã nêu ở ke_hoach.md mục 1; cột tổng âm thì chưa. — soát vòng 3.
19. `loiGhi` (`wallets.js`) chỉ khớp đúng mã `SQLITE_BUSY`; tranh chấp trên Turso có thể mang mã khác (vd `SQLITE_BUSY_*`,
    `TRANSACTION_TIMEOUT`, `STREAM_EXPIRED`) → vẫn 500. CHƯA KIỂM (không có Turso). — soát vòng 3.
20. Báo hỏng hoàn tiền trên đơn CHƯA THU (`payment_status` nợ, `status` completed) vẫn cộng ví (`damages.js`, C3 chỉ xét
    `status`). Có từ trước. — soát vòng 3.

21. **[ĐÃ XỬ LÝ theo Q9 = (a)]** Ví mẹ của đơn đã duyệt hoàn mất vĩnh viễn — chi tiết ở Câu hỏi Q9 (bổ sung Phát hiện 2 của ke_hoach.md:
    "yêu cầu hoàn bỏ phần ví mẹ" — sau P26b phần đó không còn lấy lại được qua huỷ / xoá). — soát vòng 4.
22. Cột `total_spent` / `total_topup` (tham số `cot`/`soCot` của `ghiVi`, 9 chỗ gọi) không có ca thử / kịch bản / đột biến
    nào canh: đột biến đổi dấu `soCot` khi huỷ hoàn ví mẹ LỌT (62/0). Hai cột chỉ dùng hiển thị / báo cáo
    (`reports.js:215-228`, `customers-v2.js:443`), không phải số dư. **CHƯA KIỂM.** — soát vòng 4.

23. Màn duyệt hoàn (`Refunds.jsx:55`) và thông báo trả về (`refunds.js:175`, `new_balance` là ví con) chỉ hiện phần ví
    con: duyệt "5.000" nhưng thực tế cộng 25.000 (con 5.000 + mẹ 20.000). Đúng chữ Q9 ("refund_amount giữ phần ví con");
    chủ quán cần biết. `client/` ngoài phạm vi. — soát vòng Q9.
24. Duyệt hoàn ví mẹ không giảm `total_spent` của ví mẹ (huỷ / xoá có giảm) — như duyệt ví con trước nay (Phát hiện 1, 22).
    Đơn CHỈ trả ví mẹ (`balance_amount = 0`) vẫn không tạo được yêu cầu hoàn (`refunds.js:117`) — lấy lại qua huỷ / xoá,
    không mất tiền. — soát vòng Q9.

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

## Soát độc lập — vòng 3 (chép nguyên báo cáo)

```
KHÔNG ĐẠT

Kết luận: lần sửa của vòng 1 và vòng 2 đều đúng. Mã ví khách, huỷ đơn, duyệt hoàn, báo hỏng đều đúng khi đọc lại, và mọi
bài thử của nhánh đều xanh. Còn một lỗ K3 trên đường tiền đang chạy thật: cả ba chỗ trừ và hoàn ví mẹ đã viết lại, nhưng
không bài thử, kịch bản giả lập hay đột biến nào chạm tới. Tôi đã dựng một đột biến "tạo đơn không trừ ví mẹ + huỷ/xoá
hoàn ví mẹ gấp đôi": nó qua hết.

Đã chạy (HEAD 0c2233b): thu_P26b 55 · 0; --may-chu gốc 10 · 45; bang_chung_do.txt mục 1, 2 trùng từng dòng với lần chạy
mới, mục 3 khớp, mục 4 (bộ kiểm nhanh, cây HEAD + server gốc) PASS 55 · FAIL 5 · CẢNH BÁO 1 (thiếu client/node_modules
trong bản sao) — 5 FAIL đúng như file; không có thay đổi mã sau aebb663 → lỗi vòng 2 đã sửa đúng. dot_bien.py 52 · 0;
giả lập 18 · 10 ĐẠT; npm test 61 · 0; --day-du 65 · 0 (thu_gia_lap 64.1 s).

LỖI TÌM ĐƯỢC:
1. server/routes/orders.js:810 (tạo đơn, trừ ví mẹ), :1337 (huỷ, hoàn ví mẹ), :1499 (xoá, hoàn ví mẹ) — không có ca thử,
   kịch bản hay đột biến nào — K3 + K4. Phiếu nêu "orders.js tạo đơn (ví khách + ví mẹ)", A5 "(khách + mẹ)", F3 "đột
   biến cho MỖI chỗ vá"; ke_hoach.md:15,17,19 liệt kê W2, W4, W6. grep parent trong thu_P26b.js, kich_ban.js ra 0 dòng.
   Đột biến dựng trên bản sao: soTien: actualParentBalanceAmount * 0 (không trừ ví mẹ); soTien: order.parent_balance_amount
   * 2 (2 chỗ, hoàn gấp đôi) → thu_P26b 55 · 0, giả lập 18 · 10 ĐẠT. Đường thật: Sales.jsx:738-739 gửi parent_phone,
   parent_balance_amount. Đọc mã thì hành vi hiện tại đúng — nhưng là khẳng định bằng mắt, không có khoá.
   Sửa: ca "đơn trả ví mẹ → huỷ → ví mẹ +đúng một lần; huỷ đơn đã hoàn không cộng ví mẹ" (A1/A3) vào thu_P26b; hai đơn trả
   ví mẹ chồng nhau (B5) vào KB17; 2 đột biến (bỏ vá / vá sai) cho ví mẹ.

NGHI NGỜ:
- ghiVi tạo ví lúc hoàn (wallets.js:67-71): ví chưa có thì INSERT với total_spent = soCot = -số_tiền (tổng chi âm).
- reconcile-all: BUSY ở ví thứ k sau khi k-1 ví đã commit → 409 "chưa ghi gì" sai lời; Phát hiện 15 chỉ ghi phần huỷ đơn.
- loiGhi (wallets.js:81) chỉ khớp đúng SQLITE_BUSY; Turso có thể mang mã khác → vẫn 500. Không dựng được.
- Báo hỏng hoàn tiền trên đơn chưa thu (payment_status nợ, status completed) vẫn cộng ví (damages.js:163-172). Có từ trước.

Sáu mục: 1 K3 đạt cho ví khách, chưa đạt cho ví mẹ · 2 K4 đạt (ghi pos_wallets 4 dòng trong ghiVi / reconcileWallet; đổi
trạng thái đơn orders.js:1318, refunds.js:157 có điều kiện + changes) · 3 K5 đạt · 4 K1 đạt (kiểm lại dẫn chứng Phát hiện
12, 14, 15 và hrana.js:53-89) · 5 Đường tiền đạt · 6 P1 không áp dụng.

CHƯA SOÁT ĐƯỢC: BUSY thật trên Turso; hai đơn tiền mặt cùng lúc trùng mã; bấm chồng thật trên production; máy / app ngoài kho
gọi POST /packages/buy; thu_P20 / thu_P21 không nhận --may-chu.

BÀI HỌC:
- KHOÁ: ca thử và kịch bản ví mẹ + 2 đột biến; dot_bien.py nên có danh sách "chỗ vá → đột biến" khớp từng dòng W1–W12 của
  kế hoạch, để chỗ vá nào chưa có đột biến hiện ra ngay.
- NGUYÊN TẮC (K3/K4): gom nhiều chỗ ghi về một hàm chung (ghiVi) thì từng CHỖ GỌI vẫn là một chỗ vá riêng — tham số sai ở
  một chỗ gọi chỉ bài thử đi qua đúng chỗ đó mới bắt được. Đối chiếu bảng chỗ vá của kế hoạch với danh sách đột biến trước
  khi báo xong.
```

Xử lý (vòng sửa 3/3 — CUỐI): lỗi 1 — M1–M7 + KB17 ví mẹ + 4 đột biến `me-*`; nghi ngờ → Phát hiện 15 (bổ sung), 18, 19, 20.
Đối chiếu W1–W12 (ke_hoach.md mục 0) với đột biến: W1 `tao-don-chi-kiem-ngoai-tx` · W2 `me-tao-don-khong-tru`, `me-bo-khongAm`
· W3 `huy-*` · W4 `me-huy-hoan-gap-doi` · W5 `xoa-*` · W6 `me-xoa-hoan-gap-doi` · W7 `duyet-*` · W8 `nap-*` · W9
`tru-tay-*`, `ghiVi-bo-khongAm` · W10 `dieu-chinh-bo-khongAm` · W11 `doi-soat-*` · W12 `hong-*` — mỗi chỗ có ít nhất một.

## Soát độc lập — vòng 4 (chép nguyên báo cáo)

```
KHÔNG ĐẠT. Mã đạt, hồ sơ chưa đạt, và có một hậu quả về tiền chủ quán chưa được báo.

Mã và các phép kiểm đều đúng. Vòng sửa 3 làm đúng phần mã và bài thử, nhưng lời giải thích ca M5/M6 viết sai về đường tiền
của ví mẹ. Lời sai đó che đi một thay đổi hành vi mà chủ quán cần biết.

Đã chạy (HEAD 041649d; gốc từ git archive 6efcc3b server): thu_P26b bản vá 62 · 0; --may-chu gốc 14 · 48, trùng TỪNG DÒNG
bang_chung_do.txt mục 1 (diff rỗng); giả lập gốc 33 lệch, trùng từng dòng mục 2; dot_bien.py 56/56 (4 me-* bắt đúng M1, M2,
M3, KB17 ví mẹ); npm test 61 · 0; --day-du 65 · 0 (thu_gia_lap 66.5 s); KHUON_LOI.md 119 dòng; client/ không đổi.

LỖI TÌM ĐƯỢC:
1. viec/P26b/trang_thai.md:27 "M5, M6 đỏ thật — gốc hoàn ví mẹ lần hai" SAI — K1, và K3 ở phần giải thích bằng chứng.
   - Gốc chỉ hoàn ví mẹ MỘT lần. Sổ đơn d5 (#1025) trên gốc: con −5.000, mẹ −20.000; duyệt hoàn: con +5.000
     (refunds.js:159 chỉ hoàn refund_amount = balance_amount, refunds.js:125); huỷ: con +5.000, mẹ +20.000. Khoản hoàn hai
     lần là của CON; mẹ được trả 20.000 lần ĐẦU và DUY NHẤT.
   - Bản vá bỏ mất đường trả lại ví mẹ: sổ #1025 trên bản vá chỉ còn con +5.000; mẹ mất 20.000, không còn đường nào: huỷ 400
     (orders.js:1316-1329); xoá chỉ hoàn khi completed (orders.js:1493); yêu cầu hoàn bỏ phần ví mẹ (refunds.js:116/125).
   - Trước bản vá, xoá đơn đã hoàn có trả lại ví mẹ: gốc orders.js:1608 dùng cổng status !== "cancelled".
   - M5/M6 đang khoá cứng việc mẹ mất tiền, trong khi hồ sơ gọi là "chặn hoàn lần hai".
   - M6 đỏ trên gốc là nhờ trạng thái M5 để lại (v5 đo trước lệnh huỷ ở M5) — ca gộp, trái K3.
   - Mã làm đúng chữ phiếu A1/A3, nhưng phiếu và chủ quán chốt A3 với tiền đề "hoàn hai lần" — với ví mẹ tiền đề không đúng.
   - Thiếu Phát hiện: Phát hiện 2 (ke_hoach.md:264) chỉ nói "yêu cầu hoàn bỏ phần ví mẹ", không nói sau P26b phần đó không
     còn lấy lại được qua huỷ / xoá.
   - Sửa chỉ ở hồ sơ: sửa câu trang_thai.md:27; thêm Phát hiện "đơn ví con + ví mẹ đã duyệt hoàn → phần ví mẹ mất vĩnh viễn
     (gốc: xoá trả lại một lần)"; đưa chủ quán quyết: hoàn phần mẹ khi duyệt, hay cho xoá / huỷ hoàn phần mẹ một lần.

NGHI NGỜ:
- total_spent / total_topup không có ca thử, kịch bản hay đột biến nào canh (grep thu_P26b.js, gia_lap/*.js: 0 dòng); ghi
  qua cot/soCot ở 9 chỗ gọi (orders.js:814, 1335, 1340, 1497, 1502; wallets.js:118, 151, 190). Đột biến đổi dấu soCot khi
  huỷ hoàn ví mẹ: LỌT, 62/0. Hai cột chỉ hiển thị / báo cáo (reports.js:215-228, customers-v2.js:443).
- me-bo-khongAm và tao-don-chi-kiem-ngoai-tx bị bắt qua 500 SQLITE_CONSTRAINT_UNIQUE (Phát hiện 10), không qua số dư —
  hồ sơ đã nói thẳng. Sửa Phát hiện 10 thì theo suy luận vẫn bị bắt — chưa chạy thử.
- Rà K4: ghi pos_wallets chỉ ở wallets.js:67, :70 (ghiVi), :254, :257 (reconcileWallet); ghiVi gọi 11 chỗ đều truyền tx;
  debt_payment ở orders.js:1253 ngoài danh sách tính vào ví (wallets.js:236).
- Đường tiền đạt: tổng thanh toán so total máy chủ (orders.js:739-750, có phần ví mẹ); tiền đền theo giá trong kho
  (damages.js:150-166).

CHƯA SOÁT ĐƯỢC: BUSY thật trên Turso và mã lỗi khác (Phát hiện 19); hai đơn tiền mặt cùng lúc trùng mã; bấm chồng thật trên
production (chỉ móc truocTx); máy / app ngoài kho gọi POST /packages/buy; thu_P20 / thu_P21 không nhận --may-chu; chưa chạy
lại mục 3, 4 của bang_chung_do.txt (vòng này không đổi hai mục đó).

BÀI HỌC:
- KHOÁ (việc sau, chủ quán quyết hướng trước): ca "đơn ví con + ví mẹ → duyệt hoàn → tổng hoàn cho mẹ = phần mẹ đã trả,
  theo quyết định của chủ quán". Thêm bất biến: mỗi ví được hoàn ≤ phần ví đó đã trả cho đơn (A5/I10 gộp mọi ví).
- KHOÁ: thêm đột biến cho soCot (total_spent), hoặc ghi rõ CHƯA KIỂM.
- NGUYÊN TẮC (K1/K3): trước khi viết "gốc làm X hai lần", in sổ theo TỪNG ví và từng order_id trên gốc. Khoản "dư" ở cấp
  đơn có thể là của ví khác, và vá theo cấp đơn có thể làm một ví mất tiền.
- NGUYÊN TẮC (K3): ca đỏ trên gốc phải tự đỏ, không nhờ trạng thái ca trước để lại (M6 dựa vào M5).
```

Xử lý: đã hết 3 vòng sửa → KHÔNG sửa mã / bài thử nữa. Sửa câu sai ở bước 4, ghi Câu hỏi Q9, Phát hiện 21, 22. **DỪNG.**

## Bài học

Sự cố của việc này (bước 11.1): 4 vòng soát KHÔNG ĐẠT (vòng 1: K1 xanh oan cho Turso + catch đọc `order.code` → 500;
vòng 2 và 3: bằng chứng cũ, sót Phát hiện gói, ví mẹ không ca nào chạm; vòng 4: hiểu sai "hoàn hai lần" của ví mẹ);
4 đột biến lọt ở lượt đầu (2 do `run()` trong giao dịch làm kẹt kho file, 2 do hai cổng chồng nhau) + 1 khớp oan (giả lập
con TỪ CHỐI vì bản sao sai chỗ); giả lập lộ lỗi trùng mã đơn khi vá; phép E12 tự viết đỏ oan lúc đầu (truy nguyên, K2);
người gác chặn 25 lần (`.tu_chay_nhat_ky.jsonl`): `B-CD-VITRI` 7, `B-CHUONGTRINH` (for / until / env) 7, `B-DICHCHU` 3,
`GIT-TUYCHON` 2, `G5-NGOAIPV` 2, `B-PHANTICH`, `SED-I`, `B-TENCHU`, `B-MANOI`, `B-BIMAT-CHU` 1 — phần lớn khi PHIÊN CHÍNH
và AGENT SOÁT dựng bản sao server gốc; chuỗi tiếng Việt dạng tổ hợp (NFD) trong chú thích gốc làm Python `replace` khớp 0
lần; vượt ngân sách giả lập (~260 dòng / ~200) và thời gian giả lập (62 s / ước 30 s).

**KHOÁ** (đã làm, trong Phạm vi — mỗi cái có ca đỏ trước):
- K1b "kho bận ở câu ĐẦU trong giao dịch" (Turso BEGIN lười) cho 12 route + đột biến `*-catch-doc-order-code` — `thu_P26b.js`.
- Bộ bọc `thu_P26b`: `run()` ngoài giao dịch lúc giao dịch đang mở → ném lỗi (không để kho file kẹt) + `camNgoai`.
- E12 không phân biệt hoa thường, bắt REPLACE / INSERT OR / tên bảng trong ngoặc — đỏ với `update pos_wallets` chữ thường.
- Ví mẹ M1–M7 + KB17 ví mẹ + 4 đột biến `me-*`; A2d + KB16d cho cổng chiếm yêu cầu (hai cổng chồng nhau).
**KHOÁ — đề xuất NGOÀI Phạm vi (máy không tự làm):**
- `tu_chay/` hoặc bộ kiểm: `viec/<MÃ>/bang_chung_do.txt` phải ghi "N đạt · M hỏng" với N+M = số ca bài thử hiện tại (lặp 3
  vòng soát). Ca đỏ: sửa bài thêm 1 ca, giữ bằng chứng cũ → đỏ.
- `cong_cu/ban_sao_goc.py <commit> <đích>`: dựng bản sao `server/` của commit gốc + symlink node_modules (lệnh người gác cho
  qua) — 3 agent soát + phiên chính bị chặn ~15 lần cùng một việc này. Ca đỏ: chưa có file → `dot_bien.py`/soát tự dựng.
- Việc sau (sau Q9): bất biến "mỗi VÍ được hoàn ≤ phần ví đó trả cho đơn"; ca "huỷ rồi xoá đơn giao từ gói → delivered_qty
  hoàn một lần" (Phát hiện 14); đột biến `soCot` (Phát hiện 22).
- `dot_bien.py` có bảng "chỗ vá W1–W12 → đột biến" để chỗ vá chưa có đột biến hiện ra ngay (đã đối chiếu tay ở vòng sửa 3).
**NGUYÊN TẮC** (đã gộp vào `KHUON_LOI.md`, 120/120 dòng — gộp, không nới trần):
- K1: thêm ca sau khi ghi bằng chứng → chạy lại, chép lại (gộp vào K3 "Đỏ trên gốc").
- K3: hai CỔNG chồng nhau → bỏ một vẫn xanh; lỗi hạ tầng giả lập theo đường Turso (BEGIN lười).
- K4: dời câu đọc vào `try` → rà `catch`/`finally`; gắn cổng cho một khoản hoàn → grep mọi khoản hoàn khác (gói, thẻ, kho);
  gom về hàm chung → mỗi CHỖ GỌI là chỗ vá riêng; "hoàn hai lần" phải in sổ theo TỪNG ví trước khi kết luận.
**BỎ** (một lần, một dòng lý do):
- Dòng ghi công dính tiêu đề commit (thiếu dòng trống trong biến shell) — lỗi gõ lệnh, các commit sau dùng `-F -`.
- Chuỗi NFD không khớp — F8 đã có trong CHECKLIST; mốc ASCII là đủ.
- Phép E12 đỏ oan do chính mình viết — K2 đã có, đã truy nguyên trước khi sửa.
- Trùng mã đơn lộ khi vá — lỗi có sẵn, đã thành Phát hiện 10.
**Dọn (đề xuất, không tự làm):** dòng "LUẬT CỨNG" của K3 đã có bộ kiểm + `dot_bien` + cổng làm thay một phần — giữ, vì đây
là lời dặn gốc; không thấy lời dặn nào đã có phép kiểm làm thay HOÀN TOÀN để xoá.

**Vòng Q9 (bổ sung bước 11):**
- KHOÁ (đã làm): M5 / M8 / KB17-Q9 / I11 / M13 + 4 đột biến `Q9-*` — mỗi cái có ca đỏ trước (M5, KB17 trên HEAD trước Q9).
- KHOÁ — đề xuất (KHÔNG làm: hết vòng sửa Q9): M6 `<= 1` → `=== 1`; ca "đơn có mẹ, phần mẹ 0đ → duyệt 200, 0 dòng hoàn mẹ"
  (bắt đột biến `> 0` → `>= 0`); ca "yêu cầu cũ trên đơn có mẹ → duyệt hoàn mẹ"; KB17-Q9 kiểm đơn tạo được trước khi đo.
- NGUYÊN TẮC (gộp, KHUON_LOI vẫn 120/120): K3 "tên ca nói đúng điều máy kiểm"; K5 "luồng hợp lệ gồm cả DỮ LIỆU CŨ trên
  production" (Q10). "Dòng tóm tắt đỏ trên gốc phải tách lỗi đang vá khỏi lỗi khác của gốc" — đã có ở K3 ("Đỏ trên gốc chỉ
  có giá trị kèm…"), không thêm dòng.
- BỎ: `\n` trong chuỗi `'''` của script sửa thành xuống dòng thật làm gãy `dot_bien.py` — một lần, đã trả về bản commit;
  "5000" trong thông báo M5 là do `cut -c1-220` cắt cụt — truy nguyên bằng bản gỡ lỗi trong thư mục nháp trước khi sửa (K2).

## Báo cáo 7 mục (CLAUDE.md §7)

```
VIỆC:        P26b — Vá lỗ tiền: hoàn ví hai lần, bấm trùng ghi đè ví, báo hỏng tin số màn hình gửi (+ Q9 = (a) ví mẹ)
             Soát: vòng 1–4 KHÔNG ĐẠT (đã sửa 3 vòng), vòng Q9 ĐẠT. Câu hỏi mới Q10 chờ chủ quán. KHÔNG merge, KHÔNG PR.
ĐÃ SỬA:      server/routes/wallets.js:55-97 — ghiVi (chỗ DUY NHẤT ghi ví: đọc trong giao dịch, cộng tương đối, khongAm,
               cột tổng), loiGhi (SQLITE_BUSY → 409 KHO_BAN), trongGiaoDich; nạp / trừ tay / điều chỉnh qua ghiVi;
               reconcileWallet đọc tổng sổ + ghi trong MỘT giao dịch
             server/routes/orders.js — tạo đơn trừ ví khách / mẹ qua ghiVi TRƯỚC khi ghi đơn (SO_DU_KHONG_DU); huỷ: đọc
               đơn trong giao dịch, cổng `AND status = 'completed'` + changes, từ chối yêu cầu hoàn pending cùng giao dịch,
               catch chịu `order` chưa có; xoá: đọc đơn + món trong giao dịch, hoàn ví CHỈ khi completed
             server/routes/refunds.js — tạo / duyệt / từ chối trong giao dịch, UPDATE có điều kiện + changes, DON_CO_GOI,
               DON_KHONG_CON_HOAN_DUOC, YEU_CAU_DA_XU_LY; Q9: duyệt trả cả phần ví mẹ (:162-168), cùng giao dịch, sau cổng đơn
             server/routes/damages.js:140-200 — máy chủ quyết tiền đền (mọi dòng cùng mã), cộng dồn số lượng + tiền, chặn
               đơn huỷ / hoàn, ví + sổ (order_id) + log cùng giao dịch
             server/routes/packages.js — bỏ POST /buy
BÀI THỬ:     bản chưa vá (git archive 6efcc3b server) → ĐỎ: thu_P26b 14 đạt · 49 hỏng (14 xanh = ca K5), giả lập 40 lệch,
             thu_P26a C4 ✗, bộ kiểm nhanh 5 FAIL; Q9 riêng trên HEAD trước Q9 → ĐỎ: thu_P26b ✗ M5 (62/1), giả lập ✗ KB17
             sau vá → XANH: thu_P26b 63/0, thu_P20 51/0, thu_P21 14/0, thu_P26a 8/0, giả lập 18 KB · 11 bất biến ĐẠT,
             thu_gia_lap 34/0, npm test 61/0, --day-du 65/0; dot_bien.py 56/56 (soát vòng 4) + 4/4 đột biến Q9
ĐÃ RÀ K4:    grep -rniE "(update|insert( or \w+)? into|replace into)\s+pos_wallets" server → 18 lệnh ghi ở 12 chỗ trước vá,
             nay 4 dòng, tất cả trong ghiVi / reconcileWallet; ghiVi gọi 12 chỗ đều truyền tx (thêm refunds.js duyệt ví mẹ);
             chỗ đổi trạng thái đơn / yêu cầu hoàn: đều có điều kiện + changes hoặc đọc trong giao dịch; catch đọc biến gán
             trong try: 2 chỗ (đã sửa); 3 chỗ hoàn ví mẹ (duyệt / huỷ / xoá) — huỷ / xoá có cổng nên không hoàn lần hai.
             Sót, đã ghi Phát hiện: hoàn gói hai lần khi xoá đơn đã huỷ (14)
CHƯA KIỂM:   BUSY thật trên Turso (BEGIN lười chỉ đọc từ mã client; mã lỗi khác SQLITE_BUSY — Phát hiện 19); kết nối libsql
             hỏng sau BUSY trên kho file (Phát hiện 5); hai đơn tiền mặt cùng lúc trùng mã → 500 (Phát hiện 10); bấm chồng
             thật trên production (chỉ dựng bằng móc truocTx); total_spent / total_topup không có phép canh (Phát hiện 22);
             dữ liệu production cũ — đơn đã hoàn trước khi lên, phần ví mẹ chưa hoàn (Q10, có câu tra); duyệt đơn có mẹ
             phần mẹ 0đ, yêu cầu cũ trên đơn có mẹ, duyệt chồng huỷ / xoá trên đơn có mẹ — chưa có ca; M6 kiểm `<= 1`
             (M5 đang che); máy / app ngoài kho gọi POST /packages/buy; thu_P20 / thu_P21 không nhận --may-chu; giả lập
             67 s / thu_gia_lap 71 s — gần hạn 110 / 120 s (Phát hiện 11)
GIT:         (git log --oneline -2 ở câu trả lời)
BÀI HỌC:     KHOÁ 5 (+9 đề xuất) · NGUYÊN TẮC 6 (gộp vào K3 / K4 / K5, KHUON_LOI 120/120) · BỎ 6 — chi tiết ở ## Bài học
```

## Soát độc lập — vòng Q9 (chép nguyên báo cáo)

```
ĐẠT (cho vòng Q9). Mã làm đúng nguyên văn quyết định Q9 = (a). Mọi bài thử, đột biến và hồ sơ số đều khớp kết quả tôi
chạy lại. Còn 3 lỗi nhỏ ở bài thử và hồ sơ, không ở mã. Không lỗi nào gây xanh oan trên đường tiền.

Đã chạy lại: thu_P26b HEAD 63 · 0; trước Q9 (4da2cd2) 62 · 1 (chỉ M5: "ví mẹ 80000 → 80000 (0 dòng)"); gốc (6efcc3b)
14 · 49, M5, M6, M8, M7 trùng bang_chung_do.txt; giả lập HEAD "18 kịch bản · 11 bất biến · ĐẠT"; trước Q9 1 lệch (KB17,
"ví mẹ 5000 → 5000"); gốc 40 lệch, trùng bằng chứng; dot_bien.py 4 đột biến Q9 đều bị bắt; thu_gia_lap 34/0 (M13 → KB17 →
I11); npm test 61/0.

Sáu mục:
1. K3: M5 (thu_P26b.js:339-345) đỏ trên bản trước Q9 lẫn gốc, đúng lý do (ví mẹ không đổi, 0 dòng); kiểm số dư thật + đếm
   dòng sổ, marker suông không làm xanh được. M8 là ca khoá luồng hợp lệ: xanh trước Q9, đỏ khi phần hoàn mẹ đi vòng qua
   cổng đơn (đột biến Q9-hoan-me-khong-qua-cong-don).
2. K4: grep "ghiVi(" trong server/ ra 3 chỗ hoàn ví mẹ: refunds.js:166 (mới), orders.js:1338 (huỷ), :1500 (xoá) — huỷ / xoá
   có cổng trạng thái nên đơn đã duyệt hoàn không được hoàn mẹ lần nữa (M6). Lệch duy nhất: huỷ / xoá truyền
   cot:"total_spent", duyệt thì không — chủ ý cũ (wallets.js:58, phieu.md:71).
3. K5: đơn chỉ ví con → parent_phone NULL → bỏ qua (refunds.js:165), các ca duyệt cũ vẫn xanh; đơn có mẹ nhưng
   parent_balance_amount = 0 → `>0` sai → bỏ qua — đúng khi đọc mã, KHÔNG có ca thử; yêu cầu cũ còn chờ → mẹ đọc từ
   pos_orders lúc duyệt, đúng; đơn có gói → chặn trước, rollback; đơn đã huỷ (M8) → 400, ví mẹ không đổi; I11 với đơn đã
   xoá → dòng sổ còn, ghép (order_id, customer_phone), đúng; I11 với đền bù → 'compensation' không tính, không báo oan.
4. K1: số trong trang_thai.md và bang_chung_do.txt khớp từng dòng; hai câu sai / cũ ở mục lỗi.
5. Đường tiền: số hoàn mẹ đọc từ pos_orders trong giao dịch (refunds.js:164), ghi lúc tạo đơn là actualParentBalanceAmount
   sau khi đã trừ được ví mẹ (orders.js:719, 845). Không dùng số client gửi lúc duyệt.
6. P1: không đụng client/.

LỖI TÌM ĐƯỢC:
- cong_cu/thu_P26b.js:351-352 — tên M6 "(tổng hoàn mẹ = 1 lần)" nhưng điều kiện dongHoanVi(d6, me) <= 1 → 0 dòng cũng qua;
  M6 XANH trên bản trước Q9. Hiện M5 che được nên không xanh oan; M5 bị sửa / bỏ thì không còn ca nào bắt "duyệt không hoàn
  mẹ". Sửa: === 1. K3.
- viec/P26b/trang_thai.md:48 — "Đỏ trên gốc 6efcc3b: M5, M6, M8, KB17, I11" không nói M6, M8, KB17-Q9 đỏ trên gốc vì lý do
  KHÁC Q9 (M6: huỷ 200; M8: duyệt đơn đã huỷ 200; KB17-Q9: "HTTP 404 · Không tìm thấy yêu cầu hoàn tiền · ví con 0 → 0" —
  đơn không tạo được vì ví con đã cạn, kich_ban.js:325 lấy .order?.id mà không kiểm; I11 trên gốc chỉ ở dòng hoàn ví con hai
  lần — I10 đã bắt). Đỏ riêng Q9 chỉ là M5 (gốc + trước Q9), KB17 (trước Q9), M13. bang_chung_do.txt in nguyên văn nên
  trung thực, chỉ dòng tóm tắt gây hiểu nhầm. K3/K1.
- viec/P26b/trang_thai.md:27-29 — còn câu cũ "M5/M6 đang khoá việc ví mẹ KHÔNG được hoàn … M6 đỏ nhờ trạng thái M5 để lại";
  từ Q9 câu này sai. Phủ định một câu mà không grep cả file tìm câu cùng nghĩa. K4 (tài liệu).

NGHI NGỜ:
- Dữ liệu production có sẵn: đơn đã refunded trên gốc, parent_balance_amount > 0, phần mẹ chưa hoàn — trên gốc lấy lại được
  bằng Xoá đơn (gốc orders.js:1607); sau P26b+Q9: huỷ 400 (orders.js:1316-1329), xoá không hoàn (orders.js:1493), duyệt
  không chạy lại được → tiền mẹ mất hẳn, chỉ còn điều chỉnh tay. Nên hỏi chủ quán, kèm câu tra: pos_orders status='refunded'
  AND parent_balance_amount>0 AND không có dòng refund cho order_id đó với customer_phone = parent_phone.
- Người duyệt không thấy phần mẹ: Refunds.jsx:55 chỉ hiện refund_amount; thông báo refunds.js:175 "Đã hoàn ${refund_amount}đ",
  new_balance là ví con. Duyệt 5.000 nhưng thực tế cộng 25.000.
- Duyệt hoàn mẹ không giảm total_spent của ví mẹ (khác huỷ / xoá) — lệch đã biết, nay thêm cho ví mẹ.
- Đơn chỉ trả bằng ví mẹ (balance_amount = 0) vẫn không tạo được yêu cầu hoàn (refunds.js:117); lấy lại qua huỷ / xoá.

CHƯA SOÁT ĐƯỢC: duyệt đơn có parent_phone mà parent_balance_amount = 0 (đột biến > 0 → >= 0 không bị bắt); duyệt yêu cầu cũ
(ycCu) trên đơn có ví mẹ; duyệt chồng lên huỷ / xoá trên đơn CÓ ví mẹ (KB16 chỉ phủ ví con); Turso thật; dữ liệu production;
chưa chạy --day-du (giả lập và thu_gia_lap đã chạy riêng).

BÀI HỌC:
- KHOÁ: M6 dùng === 1. Ca K5 "đơn có mẹ, phần mẹ 0đ → duyệt 200, 0 dòng hoàn mẹ"; ca "yêu cầu cũ (ycCu) trên đơn có mẹ →
  duyệt hoàn mẹ". Kịch bản giả lập kiểm đơn tạo được (200) trước khi đo (KB17:325).
- NGUYÊN TẮC (K3): dòng tóm tắt "đỏ trên gốc" tách ca đỏ vì đúng lỗi đang vá khỏi ca đỏ vì lỗi khác của gốc; tên ca nói đúng
  điều kiện máy kiểm.
- NGUYÊN TẮC (K4, dữ liệu): đổi luật hoàn / cổng trạng thái thì hỏi "dữ liệu đã có trên production rơi vào trạng thái cũ thì
  sao", không chỉ hỏi luồng mới.
```

Xử lý: lỗi 2, 3 (hồ sơ) đã sửa; lỗi 1 (M6 `=== 1`) KHÔNG sửa — hết vòng sửa Q9 → KHOÁ đề xuất. Nghi ngờ 1 → Câu hỏi Q10;
2 → Phát hiện 23; 3, 4 → Phát hiện 24. `--day-du` phiên chính đã chạy sau vá Q9: PASS 65 · FAIL 0 (thu_gia_lap 71 s).
