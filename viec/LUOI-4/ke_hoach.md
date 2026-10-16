# LUOI-4 — kế hoạch (CHỜ DUYỆT — đã sửa theo soát kế hoạch, mục 7)

Nền: HEAD `c9595f5` (PHIEU: LUOI-4). Chỉ thêm ca hồi quy + bộ chấm đột biến của việc; 0 dòng `server/`, `client/`, 0 dòng `viec/AUDIT-4/`.
Số dòng dưới đây đọc trong lượt này.

## 0. Sự thật đã đo (N0)
- `python3 viec/AUDIT-4/dot_bien.py <7 tên>` trên HEAD: đối chứng xanh (P26c 118/118, GOI1 105/105); **6 SỐNG + 1 HỎNG-sập**, không neo nào
  rữa (không HỎNG) — `trang_thai.md` mục N0. Không neo lại, không đụng `viec/AUDIT-4/`.
- Vì sao từng cái sống (để chọn ĐÚNG dữ liệu — số tự tính trên gốc VÀ trên đột biến):
  - AU4-2 `tienDaTra.js:25` `Math.floor((gia[i] * tra) / tong)`: mọi ca hiện có chia hết. Cần đơn ≥ 2 dòng, giảm CẤP ĐƠN, tổng không chia hết.
    Mã cấp đơn → `damages.js:173` gọi `chanTren = true` nhưng `discount_scope` không phải `item` → rơi xuống `:25`.
  - AU4-3 `:45` `- Math.ceil(daDung)`: các gói thử đều 10 lượt, 300.000 / 10 chia hết. Cần số lượt không chia hết giá (7).
  - AU4-4 `:81` `const goc = Math.floor(`: cùng lý do (kết thúc gói, `packages.js:212` hoan-du-kien và `:253` cancel cùng gọi).
  - AU4-5 `:19` `chanTren && order.discount_code`: chưa ca nào huỷ đơn GÓI có mã 1 MÓN. Bỏ `chanTren` → `soTienHoan` (`:39`) cũng trừ
    thẳng toàn bộ giảm vào dòng gói thay vì chia tỉ lệ.
  - AU4-6 `goiKhach.js:11` khoá loại: hạt giống chỉ có kiểu `juice` (`database.js:989–996`); chưa ca nào có hai kiểu trùng `sx_product_id`.
    Kiểu thật: `juice`, `tea` (grep `server/`).
  - AU4-7 `:87` `Math.max(0, …)`: chỉ âm khi "đã nhận" > total — dữ liệu đền CŨ (trước P26c, như B3p) + giảm lớn. `packages.js:265`
    `tien.tong > 0` chặn `ghiHoan` → sổ không đổi; cái sai lộ ra ở phản hồi `hoan` (`:271`, `:273`), ghi chú gói (`:261`) và hoan-du-kien.
  - AU4-8: dưới `VS-AU4-L3-LOAI-CHAN-BANG`, A2b/A2c/A2d/A2d2 đỏ đúng rồi bài **sập** ở A2k: mua + lấy ngay 5/5 bị 400 → `mc.order` rỗng →
    `goiCua(undefined)` = NaN (`thu_GOI1.js:90` `so`) → `daGiao(NaN)` → libsql ném "Only finite numbers". Dưới `>=` mọi lần xin ĐÚNG số
    còn bị 400; chỗ sập tiếp theo (soát kế hoạch): A6f `:444–446` (mua + lấy ngay 5/5 → `daGiao(goiCua(undefined))`, cùng khuôn A2k);
    `:150–151` coGoi (`coGoi(5, …)` ở A5d2 `:395`, B7h `:830`; `:151` `l.order.id` không `?.`); `:497` B1 lấy 5/5; `:626` B3e2 lấy 15/15.

## 1. Phương án

### Phần A — ca thử (`thu_P26c.js` + `thu_GOI1.js`)
| | A (chọn) | B |
|---|---|---|
| chỗ | `thu_P26c.js` khối mới `[N] LUOI-4` sau `[M]`, trước `[K1b]` (N1, N2, N4); `thu_GOI1.js` 3 ca cuối `[A2]` (N5) + 2 ca cuối `[B3]` (N3, N6) | dồn N2 + N3 vào một file (thu_GOI1 có `huy`) cho "chung dữ liệu" |
| số dòng | ~35 + ~50 | như A ± 5 |
| rủi ro | dữ liệu riêng (SĐT mới, mã / nhóm riêng, sản phẩm `tea` mã riêng) → ca cũ không đổi; dựng "đã lấy" bằng INSERT (không ném) | thu_GOI1 không có `vi0` / `nap` theo khuôn huỷ; không ngắn hơn |

Chọn A — đúng chỗ `bao_cao.md` AUDIT-4 đề xuất; N2 + N3 cùng DỮ LIỆU (300.000 / 7, lấy 1) ở hai bài.

### Phần B — N7 (AU4-8: bài không sập khi một ca lấy-từ-gói đỏ)
| | A (chọn) | B |
|---|---|---|
| cách | (1) `so` (`thu_GOI1.js:90`) trả `NaN` khi có tham số `undefined` / `null` hoặc số không hữu hạn (1 dòng) — A2k, A6f và mọi ca đọc theo id rỗng đi tiếp, ca vẫn ✗ vì `NaN !== x`; (2) helper `dung(r, ten)`: lấy-từ-gói ở bước dựng hỏng → in `✗ dựng <ten>` (đếm hỏng) rồi đi tiếp, thay 6 `throw` CÙNG KHUÔN (K4): `:150` coGoi (kèm `:151` chỉ gán `donLay` khi 200), `:497` B1, `:626` B3e2 — ba chỗ NỔ dưới đột biến; `:493`, `:576`, `:599` (lấy 10/15, không chạm biên) đổi cho đồng khuôn, ngoài phần bắt buộc | bọc từng khối A2 bằng `try/catch` → không cứu B1 / B3e2 (khối khác), ~20 dòng |
| số dòng | ~8 | ~20 |
| số ca | KHÔNG đổi khi xanh (`dung` chỉ in khi hỏng) | như A |

`throw` còn lại (`:116` thiếu sản phẩm mẫu, `:129` tạo gói mẫu, `:145` mua gói, `:477` nạp, `:483` mua gói 30) không qua `vuotTheoLoai`
khi dựng (mua không kèm món) → ngoài khuôn AU4-8, giữ nguyên, ghi Phát hiện. Lặp: chạy `VS-AU4-L3-LOAI-CHAN-BANG` sau khi sửa; còn sập ở
đâu thì xử lý đúng khuôn đó, ghi vào `trang_thai.md`.

### Phần C — bộ chấm `viec/LUOI-4/dot_bien.py` (~45 dòng)
Nạp `viec/AUDIT-4/dot_bien.py` CHỈ ĐỌC (`sys.dont_write_bytecode = True` trước khi nạp — không đẻ `__pycache__` trong `viec/AUDIT-4/` bị
Cấm), dùng NGUYÊN cặp thay chuỗi + `ban_sao` / `ap` / `chay_bai` / `sap_cua` (một nguồn neo). Riêng: (a) số ca đối chứng mới (P26c 121,
GOI1 110 — `BAI` của AUDIT-4 là hằng 118 / 105, sửa TRONG BỘ NHỚ, không sửa file); (b) mẫu = TÊN CA của LUOI-4, BẮT khi thoát ≠ 0 + không
sập + MỖI mẫu khớp một dòng ✗; (c) in MỌI dòng ✗ (thấy ca nào khác cùng đỏ). Tên = nguyên chuỗi đầu dòng (A17): 6 `VS-…` + 1 `BV-…`.
B (chép cặp thay chuỗi sang file mới): ~80 dòng, hai nguồn neo dễ lệch — loại.

## 2. Ca thử ↔ nghiệm thu (1-1)
Phép tính: ⌊x⌋ làm tròn xuống, ⌈x⌉ lên. "đb" = trên đột biến.

| NT | đột biến | ca | dữ liệu + khẳng định (gốc) | đb |
|---|---|---|---|---|
| N1 | `VS-AU4-L3-DATRA-LAM-TRON-LEN` | **N1a** (P26c) | mã `GIAM10K_LUOI4` fixed 10.000 cấp đơn; món 25.000 (`sp[0]`) + 30.000 (`sp[3]`) → total 45.000 (khẳng định trước). Trần dòng 25.000 = ⌊25.000 × 45.000 / 55.000⌋ = ⌊20.454,5⌋ = **20.454**: đền 20.455 → 400 `VUOT_GIA`, 20.454 → 200, ví +20.454 | ⌈20.454,5⌉ = 20.455 → 20.455 qua 200 |
| N2 | `VS-AU4-L3-HOAN-DA-DUNG-LAM-TRON-XUONG` | **N2a** (P26c) | gói 300.000 / 7 lượt, trả tiền mặt 300.000, lấy 1, owner huỷ → ví +300.000 − ⌈300.000 × 1 / (1 × 7)⌉ = 300.000 − ⌈42.857,14⌉ = 300.000 − 42.858 = **257.142** | 300.000 − 42.857 = 257.143 |
| N3 | `VS-AU4-L3-HOAN-GOI-LAM-TRON-LEN` | **B3q** (GOI1) | gói CT1 4 + CT2 3 (= 7), 300.000 (mua bằng `muaGoi` sẵn có — máy chủ lấy lượt theo gói đã cài, `orders.js:405–410`), lấy 1 CT1; hoan-du-kien `tong` = ⌊(300.000 / 1) × 6 / 7⌋ = ⌊257.142,86⌋ = **257.142**; kết thúc có hoàn `so_tien` 257.142 → 200, ví +257.142 | 257.143 → hoan-du-kien lệch + 409 `GOI_HOAN_DOI_SO` |
| N4 | `VS-AU4-L3-CHAN-TREN-CA-HOAN` | **N4a** (P26c) | nhóm riêng (`sp[0]`) + mã `GIAM5K_1MON_LUOI4` fixed 5.000 scope `item`; mua gói 300.000 / 10 + món 25.000 → total **320.000** (khẳng định trước — xác nhận cổng nhận đơn gói + mã 1 món); lấy 1, owner huỷ → dòng gói đã trả ⌊300.000 × 320.000 / 325.000⌋ = ⌊295.384,6⌋ = 295.384; đã dùng ⌈295.384 / 10⌉ = ⌈29.538,4⌉ = 29.539; ví +320.000 − 29.539 = **290.461** | dòng gói = 300.000 − 5.000 = 295.000 → 29.500 → 290.500 |
| N5 | `VS-AU4-L3-KHOA-LOAI-BO-KIEU` | **A2o** (GOI1) chiều chặn oan | sản phẩm `NE1_LUOI4` kiểu `tea` id 1 (INSERT `pos_products`); gói CT1 (`juice` 1) 2 + NE1 5; "đã lấy 4 NE1" INSERT đơn giao từ gói (khuôn A2d2 / B3p); lấy 2 CT1 → 200, CT1 đã lấy 2 | khoá `1` gộp: "đã lấy" CT1 đọc dòng NE1 = 4 → còn −2 → 400 |
|  |  | **A2p**, **A2p2** (GOI1) chiều giao vượt, HAI thứ tự | A2p: `tea` cài 2 + CT1 cài 5, đã lấy CT1 1 + tea 2 (INSERT, dòng loại KIA chèn TRƯỚC), lấy 1 tea → 400 `GOI_HET_LUOT_LOAI`, tea vẫn 2. A2p2: đảo vai (CT1 cài 2 + tea cài 5, đã lấy tea 1 + CT1 2 — loại KIA chèn trước, lấy 1 CT1 → 400) | `find` lấy dòng ĐẦU của `daLayTheoLoai` (`goiKhach.js:27`; `:18` GROUP BY không ORDER BY). SQLite xuất GROUP BY theo khoá (`juice` < `tea`) → thực tế A2p đỏ (dòng đầu CT1 đã lấy 1 → còn 1 → 200, giao 3/2), A2p2 là bảo hiểm khi thứ tự đổi; xếp theo lần chèn thì cả hai có dòng KIA đứng đầu → vẫn có ca đỏ. Mẫu: A2o VÀ (A2p HOẶC A2p2) |
| N6 | `BV-AU4-L3-B3P-BO-SAN-0` | **B3r** (GOI1, đặt CUỐI bài sau B7j — xem dưới) | mã `GIAM320K_LUOI4` fixed 320.000 cấp đơn; gói 300.000 (CT1 5 + CT2 5) + 2 CT3 25.000 → total **30.000**; đền CŨ 2 × 25.000 = 50.000 (INSERT `pos_damage_logs` + `ghiVi` compensation, khuôn B3p, `created_at` trước 12.10). Dòng gói đã trả ⌊300.000 × 30.000 / 350.000⌋ = 25.714 → gốc ⌊25.714 × 10 / 10⌋ = 25.714; total − nhận = 30.000 − 50.000 = −20.000 → max(0, min(25.714, −20.000)) = **0**: hoan-du-kien `tong` 0; kết thúc có hoàn (không gửi `so_tien`) → 200, phản hồi `hoan` 0, ghi chú gói chứa "hoàn 0đ", số dòng sổ của đơn + ví không đổi | `tong` −20.000; `hoan` −20.000; ghi chú "hoàn -20000đ" (sổ vẫn không đổi — `packages.js:265`) |
| N7 | `VS-AU4-L3-LOAI-CHAN-BANG` | A2b (+ A2c, A2d, A2d2, A2k, A2m, A2o, A6b, A6d, A6f, A5d2, B7h, `✗ dựng …` — đỏ thêm là ĐÚNG thiết kế: mọi ca xin đúng số còn) | Phần B: bài chạy HẾT (có dòng `n đạt · m hỏng`), không dấu sập → nhãn BẮT, mẫu `✗ A2b ` | trước: HỎNG-sập ở A2k |
| N0 | 7 tên | — | đã chạy trên HEAD (mục 0) | |
| N8 | — | — | chạy lại `viec/P26c`, `GOI-1`, `GOI-2`, `SO-LUONG-1`, `BAN-HANG-1`, `LUOI-3` `dot_bien.py`, `viec/AUDIT-3/dot_bien.py` (10 tên), LUOI-2 (`viec/AUDIT-2/dot_bien.py A3L-… -j 4`) — **nền đo trên HEAD TRƯỚC khi sửa** (bước 4), sau khi sửa số BẮT / "không áp được" BẰNG nền. `npm test`, `--day-du` xanh; mỗi bài đo riêng 3 lần < 96 s | |

Mẫu `viec/LUOI-4/dot_bien.py`: N1 `✗ N1a ` · N2 `✗ N2a ` · N3 `✗ B3q ` · N4 `✗ N4a ` · N5 `✗ A2o ` VÀ `✗ A2p2? ` · N6 `✗ B3r ` · N7 `✗ A2b `.
**B3r đặt cuối bài (sau B7j, trước khi đóng máy chủ):** dữ liệu của nó CỐ Ý vi phạm I19 (đã nhận 50.000 > total 30.000 — chính điều kiện để
sàn 0 có tác dụng; dữ liệu cũ trước P26c), mà `batBien()` chạy ở B3j (`thu_GOI1.js:693`) và B7j (`:835`) → đặt trong [B3] làm B7j đỏ trên
gốc (soát kế hoạch, lỗi 1). Không xoá dòng sổ sau ca (sổ append-only, xoá là che). Ca B3r tự khẳng định I19 của CHÍNH đơn đó bị vi phạm
trước khi kết thúc (dựng đúng dữ liệu cũ).
Mỗi ca khẳng định tổng đơn / dữ liệu dựng TRƯỚC (dựng hỏng → ca đỏ có lý do, không xanh oan). Dựng bằng `goi` / INSERT, không ném.

Bằng chứng (`bang_chung_do.txt`): commit 1 = `viec/LUOI-4/dot_bien.py` (chưa có ca) → chạy trên gốc → SỐNG × 6 + HỎNG-sập × 1; commit sau =
ca mới → BẮT × 7 đúng mẫu; `SỐ CA thu_P26c.js: 121`, `SỐ CA thu_GOI1.js: 110` (đếm lại trên HEAD sau vá). Bảng tên · SỐNG trước · BẮT sau ·
ca đỏ · câu lỗi · số mong + phép tính vào `trang_thai.md`.

## 3. Đường song song (K4)
- AU4-2 (`:25`) nằm trong `tienDaTraTheoDong` — đền (`damages.js:173`), huỷ / xoá đơn có gói (`soTienHoan :39`), kết thúc gói (`:77`).
  Đột biến ở hàm chung → N1a (đường đền, đường duy nhất phiếu nêu) bắt cho cả ba; không thêm ca.
- AU4-3 (`:45`) chỉ ở `soTienHoan` — huỷ và xoá cùng qua `hoanVi` (`orders.js:1359`); duyệt hoàn chặn đơn có gói. Một ca huỷ.
- AU4-4, AU4-7 (`:81`, `:87`) chỉ ở `soTienHoanGoi` — hoan-du-kien (`packages.js:212`) + cancel (`:253`): B3q, B3r khẳng định CẢ HAI.
- AU4-5 (`:19`): `soTienHoan` và `soTienHoanGoi` cùng gọi `tienDaTraTheoDong` không `chanTren` → đột biến lộ ở cả huỷ lẫn kết thúc gói;
  N4a (huỷ, đúng phiếu) bắt. Đền (`chanTren = true`) không đổi dưới đột biến — B1f / M3a đã canh.
- AU4-6: `khoaLoai` chỉ dùng trong `goiKhach.js` (`vuotTheoLoai`); hàm gọi ở mua + lấy ngay và lấy từ gói (`orders.js`). Đột biến trong
  thân hàm → ca ở đường lấy từ gói bắt cả hai. `daLayTheoLoai` (SQL GROUP BY kiểu + id) không đổi. Đột biến có HAI mặt: gộp `xin` khác
  kiểu (lộ ở mua + lấy ngay, `orders.js:417`, `daLay = []`) và `find` trên `daLay` (lấy từ gói). A2o / A2p bắt mặt `find` — đủ giết đột biến;
  mặt gộp `xin` chưa có ca riêng → Phát hiện.
- AU4-8: mọi `throw` khi lấy-từ-gói ở bước dựng của `thu_GOI1.js` (6 chỗ, Phần B) + mọi chỗ dùng id rỗng sau mua + lấy ngay (A2k, A6f —
  phủ bằng `so` trả NaN) + `:151` `l.order.id`. `thu_P26c.js` cùng khuôn (`goiDaLay :162` ném) —
  ngoài N7 (phiếu chỉ nêu GOI1 A2), ghi Phát hiện; ca MỚI của P26c không dùng `goiDaLay` (dựng không ném).

## 4. Luồng hợp lệ phải KHÔNG bị chặn (K5)
Không đổi code quầy → không phép chặn mới. Ca 200 ở đúng biên (chống xanh oan): N1a đền 20.454 → 200; A2o lấy đúng 2 CT1 còn → 200 (dưới
đột biến khoá loại); B3r kết thúc hoàn 0 → 200; N2a, N4a, B3q huỷ / kết thúc → 200. Ca mới dùng SĐT / mã / nhóm / sản phẩm riêng, không đổi
cài đặt chung (trừ B3r cố ý lệch I19 — đặt cuối bài, sau mọi `batBien()`) → `[K1b]`, `[S*]`, `[T*]`, `[B4]…[B7]` chạy như cũ (`npm test` toàn bộ chứng minh). Sản phẩm `NE1_LUOI4` thêm SAU khi bài đọc
`sp` (`thu_GOI1.js:115` lọc `code LIKE 'CT%'`) → không lọt vào `sp`.

## 5. Ngân sách + thời gian máy (đo)
- ~35 dòng `thu_P26c.js` + ~50 `thu_GOI1.js` (A2o/p/p2 ~22, B3q ~8, B3r ~12, N7 ~8) + ~45 `viec/LUOI-4/dot_bien.py` ≈ 130 dòng (khung 120–200).
  0 dòng code quầy.
- Đo trên HEAD (riêng, 3 lần): P26c 4,52 / 4,38 / 4,67 s · GOI1 3,36 / 3,51 / 3,92 s — xa 96 s (80 % của 120 s). Thêm 3 + 5 ca dự kiến < +1 s.
- 7 đột biến (`dot_bien.py`, 4 luồng): ~45 s (AUDIT-4 đo 41 s cho 19). Nền N8: ~6 phút (LUOI-3 đo P26c 231 s là bộ dài nhất).

## 6. Chưa chạy / rủi ro đã biết
- N4: cổng `orders.js` nhận đơn gói + mã 1 món — đọc `itemScopeDiscount.js:27–33` (dòng gói không có `sx_product_type` → bị bỏ qua, món
  25.000 trong nhóm được chọn) nên dự kiến qua; CHƯA chạy. Bước 4 chạy trước tiên; 400 → `## Câu hỏi`, không ép (phiếu N4).
- Sau LUOI-4, `viec/AUDIT-4/boc.py` / `dot_bien.py` đối chứng hằng `118` / `105` sẽ báo "lệch số ca" (thoát 4) — đúng thiết kế đối chứng,
  không sửa (Cấm); ghi Phát hiện để việc sau (LUOI-5) đọc số từ bài.

## 7. Soát kế hoạch (agent chỉ đọc, 4 câu) — đã sửa
1. Ngoài Phạm vi: không.
2. Ngắn hơn: B3q dùng `muaGoi` sẵn có (máy chủ bỏ `package_buy.total_qty`, `orders.js:405–410`) — đã sửa. Trong 6 `throw` chỉ 3 chỗ NỔ dưới
   đột biến (`:150`, `:497`, `:626`); `:493`, `:576`, `:599` giữ đổi cho đồng khuôn K4, ghi rõ ngoài phần bắt buộc. A2p2 thừa về lý thuyết
   (SQLite GROUP BY theo khoá) — giữ làm bảo hiểm.
3. Số học: N1–N6 tự tính lại khớp. Lỗi chặn: B3r làm B7j (I19) đỏ trên gốc → dời B3r ra cuối bài. N5: chèn dòng loại KIA trước ở cả hai
   ca; lập luận theo thứ tự khoá. N7: thêm A6f, A5d2, B7h, `:151`; `so` chặn cả `undefined`; ghi trước các ca đỏ thêm đúng thiết kế.
4. Song song: A6f (AU4-8); mặt gộp `xin` của AU4-6 → Phát hiện.
