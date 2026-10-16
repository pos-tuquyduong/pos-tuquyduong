# P20c — trạng thái

## Bước 1 — đối chiếu bản chụp (16.10.2026)
HEAD `2353fe9` · FETCH_HEAD `2353fe9` — bằng nhau, không kéo. Cây sạch.
```
2353fe9 PHIEU: P20c
783a1dd TIEN-DO: LUOI-3 (0ee7346), P20b (617d2ee) xong; mo AUDIT-4 + P20c; them P20d — so v34
0ee7346 Merge pull request #26 from pos-tuquyduong/viec/LUOI-3
```

## Bước 2–3 — đọc code, kế hoạch
Kế hoạch ở `ke_hoach.md`. Phiếu dặn chờ duyệt kế hoạch → dừng sau khi push.
Soát độc lập (agent chỉ đọc, 16.10): không ra ngoài Phạm vi; mọi mục A1–A6 có ca; H1/H2/H3 đỏ trên gốc nhờ móc `thu_P20.js:68–74`;
neo mục 0 còn khớp. Sửa theo soát: (1) A3 ngắn hơn — giữ `voucherRow` ngoài giao dịch, chặn bằng `voucherRow && xoa.changes === 0`;
(2) bốn số dòng sai trong bản nháp (regex `kiem_tra_truoc_khi_giao.js:446/463`, rollback `:452/466`, móc `:68–74`) — trích theo trí nhớ
lượt trước, không đọc lại (K1); (3) thêm 2 Phát hiện. Ghi để xếp ngăn ở bước 11.

## Câu hỏi
1. **A4 — /nhan-diem có đổi `MA_DA_NHAN_DIEM` 400 sang `MA_DA_DUNG` 409 không?** Phiếu ghi đổi, và ghi `:142` "không code" — đọc lại:
   `signup-codes.js:143` ĐÃ có `code: 'MA_DA_NHAN_DIEM'`, `:256` cũng vậy (hai chỗ trong /nhan-diem đã cùng một mã). Đổi thì đỏ
   `cong_cu/gia_lap/kich_ban.js:192` (Cấm — đòi `400 MA_DA_NHAN_DIEM`) và phải sửa ca [F] `thu_P20.js:243`. Đề xuất GIỮ: "mã đã đổi
   voucher" và "mã đã nhận điểm" là hai việc khác nhau cho tới P20d. Muốn đổi → thêm `cong_cu/gia_lap/kich_ban.js` vào Phạm vi.
2. Duyệt ba chỗ lệch chữ phiếu: (a) nối `NOT EXISTS` SAU chuỗi SQL cũ thay vì chèn vào giữa — 7 neo ở file Cấm / ngoài Phạm vi giữ nguyên
   (`ke_hoach.md` mục 0); (b) reset chặn theo `voucherRow && changes = 0` thay vì mọi `changes = 0` — không chặn nhầm dòng claimed mà không
   còn voucher (mục 3, ca H3c); (c) race dựng bằng móc tất định thay `Promise.all` (mục 5).

## Phát hiện (ngoài Phạm vi — không sửa)
1. `server/routes/discount-codes.js:315–326` — CÙNG KHUÔN lỗi A3: kiểm `used_count > 0` NGOÀI giao dịch rồi `DELETE … WHERE id = ?` không
   điều kiện. Đề xuất: `AND used_count = 0`, `changes = 0` → nhánh vô hiệu hoá.
2. `server/routes/orders.js:962–979` — `freshCode` null (voucher vừa bị xoá giữa lúc đọc `:502–505` và giao dịch) → vẫn giảm giá,
   `UPDATE used_count` 0 dòng. Cửa hẹp (chủ quán bấm hoàn tác / xoá mã đúng lúc khách dùng).
3. `signup-codes.js:218–224` (số dòng sau vá; trước vá :208–214) /nhan-diem đọc `daCong` ngoài giao dịch — lệch cộng bù nếu sau này điểm cộng ở pay-debt (P22) chạy song song.
4. `signup-codes.js:369–378` (số dòng sau vá; trước vá :358–367) /claim tra trùng `pos_discount_codes` ngoài giao dịch — race chỉ được UNIQUE đỡ, ra 500 thay vì 409.
5. GHI CHÚ [b] (phép tĩnh E9 bị lừa bởi chuỗi trong chuỗi / `--` SQL) — **đề xuất (A5, không sửa bộ kiểm):** THÊM một phép mới trong
   `kiem_tra_truoc_khi_giao.js` nhóm E9: lấy NGUYÊN đối số SQL của `tx.run(` chiếm mã (gồm mọi đoạn nối `' … ' + ' … '`), bỏ chú thích SQL
   `--…` / `/* */` rồi mới đòi `AND claimed_at IS NULL` + `NOT EXISTS (… claimed_phone = ? …)` (và cặp diem_nhan_*). Ca đỏ: bản sao có
   `… WHERE id = ? -- AND claimed_at IS NULL'` và bản sao nối `+ ' OR 1=1'` sau chuỗi neo (soát vòng 1: phép :446/:463 hiện chỉ neo TIỀN TỐ
   chuỗi, phần nối P20c không được canh tĩnh — chỉ bài động [E], [F], [H], KB11 canh). Không nới phép cũ.
6. (soát vòng 1) `/reset` không xoá voucher của dòng claim TRƯỚC 09.08.2026 — voucher đó mang mã KHÁC mã in bill (`signup-codes.js:9–12`), reset
   chỉ xoá theo `code = signupRow.code` → SĐT claim lại được trong khi voucher cũ (nếu còn hạn) vẫn dùng được. Hành vi có sẵn; valid_days mặc
   định 30 nên thực tế chắc đã hết hạn — chủ quán xét có cần câu đếm trên Turso không.
7. (soát vòng 1) Đối soát: chưa có câu đếm SĐT có ≥ 2 dòng `claimed_phone` / `diem_nhan_phone` (dấu vết đua cũ trước P20c) trên dữ liệu thật —
   đề xuất `SELECT claimed_phone, COUNT(*) FROM pos_signup_codes WHERE claimed_phone IS NOT NULL GROUP BY 1 HAVING COUNT(*) > 1` (và cặp
   diem_nhan_phone) vào DOI-SOAT-1 / bất biến giả lập.

## Bước 1 (tiếp, 16.10) — đối chiếu lại
HEAD `e6ec483` · FETCH_HEAD `e6ec483` — bằng nhau, không kéo. Chủ quán duyệt kế hoạch v1: Câu hỏi 1 → GIỮ `MA_DA_NHAN_DIEM` 400 ở
/nhan-diem; `MA_DA_DUNG` 409 chỉ /claim; `SDT_DA_NHAN` cả hai. Câu hỏi 2 → duyệt cả ba (nối chuỗi, reset `voucherRow && changes === 0`,
móc). Phát hiện → chỉ ghi. Hook pre-commit không cài trên máy mây → tự chạy `node kiem_tra_truoc_khi_giao.js` trước mỗi commit code.
```
e6ec483 P20c ke hoach v1: NOT EXISTS noi sau chuoi SQL cu (7 neo o file Cam), reset chan theo voucherRow && changes, 8 ca [H] + 8 dot bien — cho duyet
2353fe9 PHIEU: P20c
783a1dd TIEN-DO: LUOI-3 (0ee7346), P20b (617d2ee) xong; mo AUDIT-4 + P20c; them P20d — so v34
```

## Bước 4–5 — bài thử đỏ, vá, đột biến (16.10)
- `cong_cu/thu_P20.js` thêm mục [H] (8 ca H1, H2, H2b, H3, H3b, H3c, H4, H5 · 30 phép). Trên gốc `e6ec483`: **94 đạt · 11 hỏng**
  (H1 ×3, H2 ×3, H3 ×3, H4 ×2 — đúng dự kiến; ca K5 H2b/H3b/H3c/H5 xanh) — `bang_chung_do.txt`. Sau vá: **105 đạt · 0 hỏng**.
- Vá `server/routes/signup-codes.js`: hàm phụ `baoChiemHong` (đọc lại dòng sau rollback → `MA_DA_DUNG`/`MA_DA_NHAN_DIEM` hoặc `SDT_DA_NHAN`,
  không còn dòng → 404); /nhan-diem nối `AND (? = 0 OR NOT EXISTS …diem_nhan_phone…)` sau chuỗi neo, cờ = `ch.chiLanDau`; /claim nối
  `AND NOT EXISTS …claimed_phone…` sau chuỗi neo; /claim kiểm sớm: 409 `MA_DA_DUNG`, 400 `SDT_DA_NHAN`; /reset: `DELETE … AND used_count = 0`
  đầu giao dịch, `voucherRow && xoa.changes === 0` → rollback 400, rồi mới gỡ claimed; sửa chú thích đầu route reset (ghi "vô hiệu hoá" trong khi code XOÁ — K1).
- `node kiem_tra_truoc_khi_giao.js` trên cây đã vá: 64 phép · qua hết.

### Chỗ vá → đột biến (`viec/P20c/dot_bien.py`) — đối chứng 105 đạt · 0 hỏng; **9/9 BẮT**
| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| A1 /claim chặn SĐT trong UPDATE | `BV-A1-bo-chan-sdt` | ✗ H1 người đến sau |
| A1 | `VS-A1-id-bang` | ✗ H1 người đến sau |
| A1/A4 lời báo `baoChiemHong` | `VS-A1-mot-ma-loi` | ✗ H1 người đến sau (ra 409 MA_DA_DUNG) |
| A2 /nhan-diem chặn SĐT trong UPDATE | `BV-A2-bo-chan-sdt` | ✗ H2 người đến sau |
| A2 cờ chiLanDau | `VS-A2-bo-co` | ✗ H2b chiLanDau tắt |
| A3 /reset `AND used_count = 0` | `BV-A3-bo-dieu-kien` | ✗ H3 hoàn tác voucher vừa được dùng |
| A3 vế `voucherRow &&` | `VS-A3-changes-0-chan` | ✗ H3c hoàn tác khi không còn voucher |
| A4 /claim mã đã claim | `BV-A4-claim-bo-ma` | ✗ H4 /claim mã đã claim |
| A4 /claim SĐT đã claim | `BV-A4-claim-bo-ma-sdt` | ✗ H4 /claim bằng SĐT đã claim |

## Bước 6 — kiểm (16.10, trên HEAD `6fec386`)
- `node kiem_tra_truoc_khi_giao.js` (= `npm test`): 64 phép · qua hết.
- `node kiem_tra_truoc_khi_giao.js --day-du`: **PASS 68 · FAIL 0 · CẢNH BÁO 1** — cảnh báo "route GET có lệnh ghi (3) — packages.js:194,
  products.js:57, sync.js:147": ba file việc này không đụng, có từ trước. `thu_P20.js` xanh (1.7 s); `thu_gia_lap.js` xanh (53.4 s) — gồm M2, M5
  neo `signup-codes.js` vẫn áp được và bị bắt.
- Đột biến cũ chạy lại (phiếu A6) — không neo nào rữa, không cần neo lại:
  - `python3 viec/AUDIT-1/dot_bien.py <8 tên D1>`: **D1 BẮT 8 · SỐNG 0 · HỎNG 0 · LẠC 0** (D1-E-trangthai-dungma, D1-E-danhsach-trang,
    D1-E-claim-chiem, D1-E-ndiem-chiem, D1-E9-claim-kiem, D1-E9-ndiem-kiem, D1-E9-claim-dung, D1-E9-ndiem-dung); "kho thật không đổi".
  - `python3 viec/AUDIT-2/dot_bien.py BK-KB11-claim-bo-chiem BK-KB11-nhandiem-bo-chiem`: **B3 BẮT 2 · SỐNG 0**.
  - `python3 viec/P20b/dot_bien.py`: đối chứng 105 đạt · 0 hỏng; **4/4 BẮT** (BV-A2-bo-tra-signup, VS-A2-chi-chan-don-huy,
    VS-A2-chan-ca-ma-tay, VS-A2-tra-ca-ma-chua-claim).
- `node tu_chay/cong.js tinh . 2353fe9^ HEAD viec/P20c`: chỉ `✗ [A19]` (thiếu dòng HEAD ĐÃ KIỂM — bình thường trước bước 11.4).
- Tự rà: không code chết; `baoChiemHong` dùng ở 2 chỗ (không phải hàm dùng một lần); `signup-codes.js` +41 / −19 dòng (gồm ~17 dòng chú
  thích) — trong ngân sách 30–50; `thu_P20.js` +134 (phiếu ~80 — vượt vì 8 ca / 30 phép, mỗi ca đua cần móc + 3–4 phép bất biến).

## Bước 8 — soát độc lập `/ra-soat` vòng 1 (16.10, agent soát trên HEAD `c6ca9a3`) — chép nguyên báo cáo
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:  1. server/routes/signup-codes.js:476 + :503–506 — /reset VẪN mang đúng khuôn "kiểm ngoài giao dịch, ghi trong giao dịch
                  không điều kiện": phép kiểm `claimed_at` (:476) ngoài giao dịch, rồi `UPDATE … SET claimed_at = NULL … WHERE id = ?` (:503)
                  và `DELETE … WHERE code = ?` (:498) không gắn với lần claim đã đọc. Ca dò Z1 (tất định, móc): reset B qua phép kiểm sớm →
                  reset A xong → khách P2 claim lại cùng mã (200, có voucher) → reset B tiếp tục, trả 200, XOÁ voucher của P2 và gỡ claim
                  của P2. ĐỎ cả trên gốc lẫn HEAD (lỗi có sẵn, nhưng trong route phiếu giao "hoàn tác mã an toàn"). Không mất tiền quán
                  (voucher đã dùng used_count 1 vẫn được chặn) nhưng khách được báo có voucher rồi mất. Sửa gọn: `UPDATE … WHERE id = ? AND
                  claimed_at = ?` (signupRow.claimed_at) ĐẦU giao dịch, changes = 0 → rollback 409 — bịt luôn lỗi 2. — K4
               2. server/routes/signup-codes.js:499–501 — HỒI QUY do bản vá: hai lần reset chồng nhau (hai tab / hai máy — Settings.jsx:1806
                  chỉ khoá nút trong cùng tab), voucher chưa ai dùng → lần thứ hai nhận 400 "Voucher này vừa được dùng trong 1 đơn hàng — không
                  hoàn tác." trong khi voucher bị lần thứ nhất XOÁ, không ai dùng. Ca dò Z2: gốc XANH (200), HEAD ĐỎ. Dữ liệu không sai, lời
                  báo sai cho chủ quán. Sửa ở lỗi 1 chữa luôn. — K5 (lời báo)
               3. cong_cu/thu_P20.js [H] (:397–528) — không có ca "MỘT SĐT nhận điểm qua mã A rồi claim mã B" (hoặc ngược lại). Tôi cài đột
                  biến đổi hai câu NOT EXISTS thành `? IN (claimed_phone, diem_nhan_phone)` (chặn nhầm luồng hợp lệ đó) → thu_P20.js thoát 0
                  (SỐNG). Kèm K1: ke_hoach.md:118 ghi "một SĐT claim mã A rồi nhận điểm mã B → không chặn nhau (H4 có)" — H4 (:501–517) dùng P
                  chỉ để claim và Q chỉ để nhận điểm; [D] (:263–270) dùng SĐT mới mỗi lần gọi. — K5/K3
               4. server/routes/signup-codes.js:79 — nhánh `if (!d) return 404` của baoChiemHong không có ca phủ: xoá dòng này thu_P20.js vẫn
                  thoát 0 (SỐNG). Nhánh có thật (P26c xoá dòng mã orders.js:1621 chen giữa phép kiểm và giao dịch); bỏ nhánh → 500 thay 404. — K3
               5. viec/P20c/trang_thai.md:32–33 — Phát hiện 3 ghi `signup-codes.js:208–214` (nay :218–221), Phát hiện 4 ghi `:358–367` (nay
                  :369–378): bản vá dời code ~10 dòng, file đang sửa trong chính việc này. — K1 (TU-CHAY-6)
               6. ke_hoach.md mục 3 "voucher không thể XUẤT HIỆN sau :467 khi dòng signup đang claimed" — sai: Z1 cho thấy xuất hiện lại được
                  qua reset chồng nhau + claim lại; discount-codes.js:195–215 cũng tạo được mã tay trùng chữ. — K1
NGHI NGỜ:      - signup-codes.js:483 vs :498 — hai vế không đối xứng khi used_count NULL: vế ngoài `used_count > 0` cho NULL qua, vế trong
                 `used_count = 0` không xoá NULL → 400. Ca dò Z3: gốc 200, HEAD 400. Lược đồ DEFAULT 0 (database.js:620) và 3 chỗ INSERT không
                 để NULL — chưa chứng minh NULL tồn tại trên production; nhưng loyalty.js:95 có phòng `COALESCE(d.used_count, 0)`. Sửa 1 chữ:
                 `COALESCE(used_count, 0) = 0`.
               - signup-codes.js:495–497 chú thích "claim trước 09.08 mang mã khác → KHÔNG có voucher" — thật ra voucher VẪN CÓ, chỉ mang mã
                 khác; reset không xoá nó → SĐT claim lại được trong khi voucher cũ còn hạn (hành vi có sẵn; valid_days mặc định 30 nên thực tế
                 chắc đã hết hạn). H3c (:489) gọi đó là "dữ liệu trước 09.08" để biện minh — ca chỉ dựng xoá tay.
               - Mã trả về /claim mã đã claim 400 → 409 (:327): App KH ngoài kho, không xác minh được có rẽ theo 400 không.
               - Phép tĩnh kiem_tra_truoc_khi_giao.js:446/:463 neo theo TIỀN TỐ chuỗi; giờ có chuỗi nối sau dấu nháy → phép tĩnh không canh
                 phần nối (nối thêm `' OR 1=1'` vẫn qua phép tĩnh). Phần động ([E], [F], KB11) vẫn bắt. Cùng loại GHI CHÚ [b].
NGHIỆM THU:    5/6 mục có bằng chứng · mục thiếu: A5 (phần ghi): [c] có H5 :519–527; thiếu dòng CHƯA KIỂM kiemDonCuaMa ngoài giao dịch
               và đề xuất [b] — mới ở ke_hoach mục 7 / hẹn "bước 11"; trang_thai.md chưa có mục CHƯA KIỂM.
               A1 CÓ (H1 :411–424, chạy lại trên bản chưa vá: ĐỎ 3 phép) · A2 CÓ (H2 :426–439 đỏ gốc, H2b :441–454 K5) · A3 CÓ (H3 :456–474
               đỏ 3 phép gốc, H3b, H3c — nhưng xem lỗi 1, 2) · A4 CÓ (H4 :501–517 đỏ 2 phép gốc; client/src chỉ gọi GET + reset
               Settings.jsx:425, :432, không đọc `code`) · A6 CÓ (tự chạy lại trên HEAD: npm test PASS 64 · FAIL 0 · CẢNH BÁO 1 có sẵn;
               --day-du PASS 68 · FAIL 0, giả lập 34.2 s, thu_gia_lap 53.3 s, dist khớp src; P20c dot_bien đối chứng 105/0, 9/9 BẮT; P20b
               105/0, 4/4 BẮT; AUDIT-1 D1 8 tên BẮT — lần chạy cắt ở 590 s sau 47 BẮT, !D1-E11-P20 và !D1-E11-P26a LẠC đúng mốc
               viec/AUDIT-1/bao_cao.md:74, :77, không hồi quy; AUDIT-2 KB11 không tự chạy, chỉ có số ở trang_thai.md:76).
CHƯA SOÁT ĐƯỢC: Turso production (SĐT trùng, used_count NULL, voucher trước 09.08 còn hạn); App KH ngoài kho (phụ thuộc status 400?);
               đua thật qua mạng trên Turso (giao dịch "write" qua HTTP) — chỉ thử móc tất định trên file libsql; AUDIT-1 D1 bị cắt 590 s,
               AUDIT-2 không tự chạy.
BÀI HỌC:       KHOÁ: thêm vào thu_P20 [H] ca (a) cùng SĐT nhận điểm mã A rồi claim mã B → 200 (giết đột biến chéo cột); (b) hai reset
               chồng nhau có claim lại xen giữa (Z1, Z2); (c) dòng mã bị xoá giữa phép kiểm và giao dịch → 404 (giết đột biến bỏ :79).
               NGUYÊN TẮC (K4): đưa một phép kiểm vào giao dịch → rà MỌI câu ghi trong cùng giao dịch; UPDATE/DELETE theo `id`/`code` phải gắn
               ĐÚNG phiên bản dòng đã đọc ngoài giao dịch (`AND claimed_at = ?`). NGUYÊN TẮC (K5): hai vế cùng điều kiện, một ngoài một trong
               giao dịch, phải cùng biểu thức kể cả NULL (`> 0` vs `= 0` lệch ở NULL — COALESCE như loyalty.js:95). NGUYÊN TẮC (K1): "ca X phủ
               luồng Y" trong kế hoạch chỉ ghi khi đột biến xoá Y làm X ĐỎ (ke_hoach.md:118 "H4 có" mà không có). Đề xuất bộ kiểm: phép tĩnh
               neo tiền tố chuỗi SQL (:446/:463) cần thêm phép canh phần nối sau dấu nháy, hoặc ghi rõ giới hạn (cùng loại GHI CHÚ [b]).
               Bản sao + bài dò của agent: scratchpad/goc, scratchpad/head, scratchpad/probe_section.js (ngoài kho).
```

## Bước 5–6 (vòng sửa 1, 16.10) — sửa theo soát
- Lỗi 1 + 2 (Z1, Z2): `/reset` — UPDATE gỡ claim lên ĐẦU giao dịch, gắn đúng lần claim đã đọc `AND claimed_at = ? AND claimed_phone = ?`,
  0 dòng → rollback 409 "vừa được hoàn tác hoặc claim lại". Lần thử đầu chỉ `claimed_at = ?` → H3d VẪN ĐỎ: truy nguyên `helpers.js:135` —
  `getNow()` chỉ tới GIÂY, hoàn tác A + claim lại trong cùng giây ghi cùng `claimed_at` → thêm `claimed_phone`. (Cùng SĐT claim lại trong cùng
  giây vẫn lọt — trạng thái cuối nhất quán: không claim, không voucher; ghi CHƯA KIỂM.)
- Nghi ngờ NULL (Z3): DELETE `COALESCE(used_count, 0) = 0` — cùng nghĩa với phép kiểm ngoài `used_count > 0` (khuôn `loyalty.js:95`).
- Lỗi 3 (K5): ca H4b — một SĐT nhận điểm mã A rồi claim mã B, và ngược lại → 200/200. Lỗi 4 (K3): ca H6 — dòng mã bị xoá giữa phép kiểm và
  giao dịch → 404. Lỗi 5, 6 (K1): sửa số dòng Phát hiện 3, 4; gạch + sửa hai câu sai trong `ke_hoach.md` (mục 3, mục 5). Chú thích reset
  sửa "không có voucher" → "không có voucher CÙNG MÃ" (Phát hiện 6). A5: thêm CHƯA KIỂM (dưới) + đề xuất [b] (Phát hiện 5).
- Bài thử: trên code GỐC (2353fe9, bản sao ngoài kho) **103 đạt · 15 hỏng** (thêm H3d ×2, H3e, H6 đỏ; H3f, H4b xanh — K5); trên HEAD trước
  vòng sửa: 113 · 5 (H3d ×2, H3e, H3f ×2); sau vá: **118 đạt · 0 hỏng** — `bang_chung_do.txt` v2, `SỐ CA … 118`.
- `node kiem_tra_truoc_khi_giao.js`: 64 phép · qua hết (CẢNH BÁO 1 có sẵn). `viec/P20c/dot_bien.py`: đối chứng 118/0, **15/15 BẮT**.

### Chỗ vá → đột biến thêm ở vòng 1
| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| A3 DELETE COALESCE | `VS-A3-null-lech` | ✗ H3f hoàn tác voucher used_count NULL |
| A3 khoá đúng lần claim | `BV-A3-bo-khoa-claim` | ✗ H3d hoàn tác B |
| A3 khoá chỉ theo giờ | `VS-A3-khoa-chi-gio` | ✗ H3d hoàn tác B |
| A1 NOT EXISTS đúng cột | `VS-A1-cheo-cot` | ✗ H4b cùng SĐT: nhận điểm mã A |
| A2 NOT EXISTS đúng cột | `VS-A2-cheo-cot` | ✗ H4b cùng SĐT: claim mã A |
| baoChiemHong nhánh 404 | `BV-A1-bo-404` | ✗ H6 /claim khi dòng mã vừa bị xoá |
(`BV-A3-bo-dieu-kien` đổi neo theo chuỗi mới `AND COALESCE(used_count, 0) = 0`.)

## CHƯA KIỂM
- A5: `kiemDonCuaMa` vẫn chạy NGOÀI giao dịch (`signup-codes.js:184`, `:350`) — đơn bị huỷ / hoàn giữa lúc kiểm và UPDATE chiếm mã vẫn cho
  claim / nhận điểm. P20b đã chốt giữ nguyên; không có ca thử.
- Đua thật trên Turso (giao dịch "write" qua HTTP, hai máy): chỉ thử bằng móc tất định trên file libsql cục bộ.
- Dữ liệu production: SĐT đã trùng do đua cũ, `used_count` NULL, voucher trước 09.08 còn hạn — chưa đếm (Phát hiện 6, 7).
- App KH (người gọi `/claim` qua `X-Service-Key`) ngoài kho: chưa biết có rẽ nhánh theo status 400 cũ của "mã đã sử dụng" (nay 409) không.
- `/reset` khi CÙNG SĐT claim lại trong CÙNG GIÂY với lần hoàn tác chồng (getNow chỉ tới giây) — không dựng được ca tất định phân biệt.
