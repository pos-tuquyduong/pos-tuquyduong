# LUOI-4 — trạng thái

## Bước 1 — đối chiếu bản chụp (16.10.2026)
- Nhánh `viec/LUOI-4`; `git status --short` sạch; fetch được. HEAD `c9595f5` · FETCH_HEAD `c9595f5` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  c9595f5 PHIEU: LUOI-4
  8194c9c TIEN-DO: AUDIT-4 (ddc42d2), P20c (d47b81c) xong; AU4-16 = A; mo LUOI-4 + MA-GIAM-1 + TU-CHAY-7; them LUOI-5, AUDIT-5 — so v35
  ddc42d2 Merge pull request #28 from pos-tuquyduong/viec/AUDIT-4
  ```

## N0 — 7 tên trên HEAD `c9595f5` (trước mọi sửa)
`python3 viec/AUDIT-4/dot_bien.py VS-AU4-L3-DATRA-LAM-TRON-LEN VS-AU4-L3-HOAN-DA-DUNG-LAM-TRON-XUONG VS-AU4-L3-HOAN-GOI-LAM-TRON-LEN
VS-AU4-L3-CHAN-TREN-CA-HOAN VS-AU4-L3-LOAI-CHAN-BANG VS-AU4-L3-KHOA-LOAI-BO-KIEU BV-AU4-L3-B3P-BO-SAN-0` → thoát 1, "đúng mong 0/7".
Đối chứng: ✓ p26c 118 đạt · 0 hỏng · ✓ thu (GOI1) 105 đạt · 0 hỏng. Không neo nào rữa (0 HỎNG).

| tên | trên HEAD | bài |
|---|---|---|
| VS-AU4-L3-DATRA-LAM-TRON-LEN | SỐNG | p26c 118/0 · thu 105/0 |
| VS-AU4-L3-HOAN-DA-DUNG-LAM-TRON-XUONG | SỐNG | p26c 118/0 · thu 105/0 |
| VS-AU4-L3-HOAN-GOI-LAM-TRON-LEN | SỐNG | p26c 118/0 · thu 105/0 |
| VS-AU4-L3-CHAN-TREN-CA-HOAN | SỐNG | p26c 118/0 · thu 105/0 |
| VS-AU4-L3-LOAI-CHAN-BANG | HỎNG-sập | thu: ✗ A2b, A2c, A2d, A2d2 rồi `✖ Bài thử sập: Only finite numbers (not Infinity or NaN) can be passed as arguments` |
| VS-AU4-L3-KHOA-LOAI-BO-KIEU | SỐNG | thu 105/0 · p26c 118/0 |
| BV-AU4-L3-B3P-BO-SAN-0 | SỐNG | thu 105/0 · p26c 118/0 |

## Bước 3 — kế hoạch
`ke_hoach.md`; agent chỉ đọc soát 4 câu → 1 lỗi chặn (B3r làm B7j đỏ trên gốc) + 3 lỗi vừa, đã sửa (ke_hoach mục 7). Phiếu dặn "Chờ duyệt kế hoạch" → commit, push, DỪNG ở đây.

## Bước 1 (tiep) — 16.10.2026
- Chủ quán duyệt kế hoạch `095c3f1`. Nhánh `viec/LUOI-4`, cây sạch; HEAD `095c3f1` · FETCH_HEAD `095c3f1` — bằng nhau, không kéo.
- `git log --oneline -3`: `095c3f1 LUOI-4: ke hoach sua theo soat …` · `ce221f2 LUOI-4: ke hoach + trang thai N0 …` · `c9595f5 PHIEU: LUOI-4`.

## Nền N8 — bộ cũ trên HEAD `095c3f1` (TRƯỚC khi thêm ca; nối tiếp, không sửa file khi chạy) và SAU (`c9f9a3e`)
| bộ | nền: bắt / tổng · thời gian | sau | "không áp được" |
|---|---|---|---|
| `viec/P26c/dot_bien.py` | 89 / 93 · 350 s | 89 / 93 · 332 s | 4, cùng tên (VS-H2-khong-ghi-hoan-goi, VS-H2-hoan-goi-giam-total-spent, VS-me-hoan-gap-doi-huy, VS-me-hoan-gap-doi-xoa) |
| `viec/GOI-1/dot_bien.py` | 40 / 49 · 55 s | 40 / 49 · 49 s | 9, cùng tên (như LUOI-3 ghi) |
| `viec/GOI-2/dot_bien.py` | 59 / 59 · 87 s | 59 / 59 · 70 s | 0 |
| `viec/SO-LUONG-1/dot_bien.py` | 16 / 17 · 37 s | 16 / 17 · 33 s | 1 (VS-SOLUONG1-THE-SDT-THO) |
| `viec/BAN-HANG-1/dot_bien.py` | 7 / 7 · 18 s | 7 / 7 · 16 s | 0 |
| `viec/LUOI-3/dot_bien.py` | BẮT 10 / 10 · 27 s | BẮT 10 / 10 · 24 s | 0 |
| `viec/AUDIT-3/dot_bien.py` (26 tên, 10 AU3 NẶNG) | BẮT 15 · SỐNG 1 · HỎNG 5 · LẠC 5 · 43 s | y hệt · 41 s | 2 (D2-AU3-sai-chuoi theo hợp đồng, BV-AU3-SL-THE-BO-CONG) |
| LUOI-2 `viec/AUDIT-2/dot_bien.py <7 A3L> -j 4` | BẮT 7 / 7 · 144 s | BẮT 7 / 7 · 151 s | 0 |
Nhãn từng tên nền = sau ở mọi bộ (so bằng script nháp `so_n8.py`); LUOI-3 khác nền chỉ ở dòng ✗ in kèm (ca mới [N] cũng đỏ dưới
đột biến AU3 tiền) — nhãn BẮT 10/10 giữ nguyên. Nền P26c 350 s dài hơn LUOI-3 đo (231 s): lúc đó stop hook chạy `npm test` song song
(`thu_cong.js` hết giờ 120 s ETIMEDOUT); chạy lại `npm test` riêng → PASS 64 · FAIL 0.

## Bước 4–5 — ca thử + bằng chứng (`bang_chung_do.txt`)
- N4: đơn gói + mã giảm 1 món QUA cổng quầy (N4a `m4` 200, tổng 320.000) — không cần dựng bằng INSERT.
- Đổi tên helper `dung` → `dungGoi`: `thu_GOI1.js` đã có `const dung` trong khối A5 (`:404`) và B1 (`:536`) → lần chạy đầu sập
  "Cannot access 'dung' before initialization" (TDZ của const trong khối che hàm ngoài).

| tên | TRƯỚC (`--truoc`) | SAU | ca đỏ (đúng mẫu) | câu lỗi trên đột biến | số mong (gốc) ← phép tính · đột biến |
|---|---|---|---|---|---|
| VS-AU4-L3-DATRA-LAM-TRON-LEN | SỐNG | BẮT | N1a | đền 20.455 → HTTP 200 (mong 400 VUOT_GIA) | trần 20.454 = ⌊25.000 × 45.000 / 55.000⌋ · đb 20.455 |
| VS-AU4-L3-HOAN-DA-DUNG-LAM-TRON-XUONG | SỐNG | BẮT | N2a (+ N4a cùng hàm) | ví 257143 | 257.142 = 300.000 − ⌈42.857,14⌉ · đb 257.143 |
| VS-AU4-L3-HOAN-GOI-LAM-TRON-LEN | SỐNG | BẮT | B3q | `{"tong":257143…}` · HTTP 409 GOI_HOAN_DOI_SO | 257.142 = ⌊300.000 × 6 / 7⌋ · đb 257.143 |
| VS-AU4-L3-CHAN-TREN-CA-HOAN | SỐNG | BẮT | N4a | ví 290500 | 290.461 = 320.000 − ⌈⌊300.000 × 320.000 / 325.000⌋ / 10⌉ = 320.000 − ⌈29.538,4⌉ · đb 320.000 − 29.500 |
| VS-AU4-L3-KHOA-LOAI-BO-KIEU | SỐNG | BẮT | A2o + A2p (A2p2 xanh — SQLite xuất GROUP BY theo khoá, `juice` trước) | A2o HTTP 400 GOI_HET_LUOT_LOAI "CT1 chỉ còn 0"; A2p HTTP 200 · NE1 3 | A2o: còn 2 − 0 = 2 → 200 · đb 2 − 4 → 400; A2p: còn 2 − 2 = 0 → 400 · đb 2 − 1 = 1 → 200 |
| BV-AU4-L3-B3P-BO-SAN-0 | SỐNG | BẮT | B3r | hoan-du-kien / phản hồi −20000, ghi chú "hoàn -20000đ" | 0 = max(0, min(⌊300.000 × 30.000 / 350.000⌋ = 25.714, 30.000 − 50.000)) · đb −20.000 |
| VS-AU4-L3-LOAI-CHAN-BANG | HỎNG-sập (A2k) | BẮT (không sập, 95 đạt · 19 hỏng) | A2b (+ A2c, A2d, A2d2, A2k, A2m, A2o, A5d2, A6b, A6d, A6f, B1a, B1b, B3e2, B7h, `dựng …` × 4 — đúng thiết kế ghi trước ở kế hoạch) | A2b HTTP 400 "CT1 chỉ còn 2" | — |

Chỗ "vá" (ca) → đột biến (A17, A18 — mọi tên đột biến của `viec/LUOI-4/dot_bien.py`):
| ca thêm | đột biến bắt |
|---|---|
| `thu_P26c.js` N1a | VS-AU4-L3-DATRA-LAM-TRON-LEN |
| `thu_P26c.js` N2a | VS-AU4-L3-HOAN-DA-DUNG-LAM-TRON-XUONG |
| `thu_GOI1.js` B3q | VS-AU4-L3-HOAN-GOI-LAM-TRON-LEN |
| `thu_P26c.js` N4a | VS-AU4-L3-CHAN-TREN-CA-HOAN |
| `thu_GOI1.js` A2o, A2p, A2p2 | VS-AU4-L3-KHOA-LOAI-BO-KIEU |
| `thu_GOI1.js` [B8] B3r | BV-AU4-L3-B3P-BO-SAN-0 |
| `thu_GOI1.js` `so()` NaN + `dungGoi` (N7) | VS-AU4-L3-LOAI-CHAN-BANG |

## Bước 6 — kiểm
- `npm test` PASS 64 · FAIL 0 · CẢNH BÁO 1 (có sẵn trên nền); `node kiem_tra_truoc_khi_giao.js --day-du` PASS 68 · FAIL 0 · CẢNH BÁO 1.
- Đo riêng 3 lần (hạn 120 s, 80 % = 96 s): P26c 4,09 / 4,54 / 4,12 s · GOI1 3,70 / 3,57 / 3,59 s.
- Diff `c9595f5..HEAD` (`git diff --numstat`): thu_GOI1 +84 −9, thu_P26c +40, dot_bien.py +74 = 198 dòng thêm (soát vòng 1 sửa: bản đầu ghi "+93" lấy nhầm tổng dòng đổi) (ngân sách 120–200; kế hoạch ước 130 — GOI1 vượt ước
  vì helper dựng loại `tea` + INSERT "đã lấy" + chống id rỗng). 0 dòng `server/`, `client/`, `viec/AUDIT-4/`.

## Bước 8 — /ra-soat vòng 1 (agent độc lập, nguyên văn)
```
ĐẠT
LỖI TÌM ĐƯỢC:
- cong_cu/thu_GOI1.js:312–313 — NE1 viết cứng `sx_product_id: 1`; ca dựa vào việc CT1 (sp[0]) cũng có id SX = 1 mà KHÔNG khẳng định điều đó. Hạt giống đổi id CT1 thì A2o/A2p/A2p2 vẫn xanh trên gốc nhưng thôi canh khoá loại → xanh oan im lặng. Gọn: dùng `sp[0].sx_product_id` cho NE1 — K3 (đầu vào phải đủ điều kiện kích hoạt). Hiện đúng: đột biến làm A2o đỏ, tức id CT1 = 1.
- viec/LUOI-4/ke_hoach.md:39 (và :120 "chặn cả undefined") — ghi `so` trả NaN khi tham số `undefined / null`, code thu_GOI1.js:90–91 chỉ chặn `undefined` và số không hữu hạn. Code đúng (chặn null sẽ phá `soDong` :504–505, sdt mặc định null), nhưng hồ sơ lệch code và trang_thai không ghi chỗ đổi — K1.
- viec/LUOI-4/trang_thai.md mục Bước 6 — ghi "thu_GOI1 +93 −9"; `git diff --numstat c9595f5 HEAD` ra 84 thêm · 9 bớt (93 là tổng dòng đổi). Tổng 198 vẫn đúng (84+40+74) — K1 (số trích sai nhãn).
NGHI NGỜ:
- coGoi trả `donLay: null` khi dựng hỏng (thu_GOI1.js:152). `so` không chặn null, nên một ca sau này gọi `so(..., [g.donLay])` với COUNT/SUM sẽ ra 0 và có thể xanh oan. Hiện chưa có (donLay chỉ đi vào `huy` :225/:466/:874 và `db.run` :365/:545); bài vẫn đỏ nhờ dòng "✗ dựng".
- Đường sập còn lại cùng khuôn AU4-8: `ttGoi`/`mot` nhận NaN thì libsql ném; `(await ttGoi(x)).status` khi không có dòng thì TypeError (:458, :594, :853). Dưới 7 đột biến không bị kích hoạt (ngắn mạch `&&` hoặc cp lấy từ coGoi hợp lệ); dưới đột biến khác chưa rà.
- thu_P26c.js:155–165 `goiDaLay` còn ném — đã ghi Phát hiện, đúng phạm vi phiếu.
NGHIỆM THU:    9/9 mục có bằng chứng · mục thiếu: không
- N0: bảng trong trang_thai, tôi chạy lại TRƯỚC khớp.
- N1–N6: mỗi ca đỏ đúng mẫu dưới đột biến của nó. Số tự tính lại khớp: 20.454 / 257.142 / 257.142 / 290.461 / A2o 2→200, A2p 400 / sàn 0 (−20.000 trên đột biến).
- N7: BẮT, 95 đạt · 19 hỏng, không sập. Hai phần của bản sửa đã được chứng minh riêng.
- N8: 3/8 bộ chạy lại khớp, `npm test` xanh. Số thời gian và `--day-du` chỉ đọc từ trang_thai.
CHƯA SOÁT ĐƯỢC:
- Chưa chạy lại N8 các bộ GOI-2, SO-LUONG-1, BAN-HANG-1, AUDIT-3, LUOI-2 (AUDIT-2 -j 4).
- Chưa chạy `node kiem_tra_truoc_khi_giao.js --day-du`.
- Chưa đo lại thời gian 3 lần.
- Chưa thử các đột biến "nới phép" khác ngoài 7 tên + 3 phép tôi tự dựng (vd làm tròn Math.round: theo phép tính sẽ bị N1a/N2a/B3q bắt, nhưng chưa chạy).
- Mục 5 (đường tiền) và 6 (P1): `git diff --stat c9595f5^ HEAD -- server client viec/AUDIT-4 tu_chay kiem_tra_truoc_khi_giao.js KHUON_LOI.md` rỗng → 0 dòng code quầy, không đụng client/src, dist không cần build.
BÀI HỌC:
- KHOÁ (bài thử): ca phân biệt hai loại theo khoá ghép phải dựng đầu vào TỪ dữ liệu của loại kia (`sp[0].sx_product_id`), không viết cứng số trùng — hoặc khẳng định điều kiện trùng ngay trong ca.
- NGUYÊN TẮC (K3/N7): helper "ca hỏng không làm sập bài" phải được chứng minh RIÊNG từng phần — gỡ một phần, giữ phần kia, chạy dưới đột biến; ca "bảo hiểm" (A2p2) cần một đột biến tất định làm nó đỏ, không ghi "thừa về lý thuyết".
- NGUYÊN TẮC (K1): khi code đi lệch kế hoạch (null ra khỏi phép chặn của `so`), ghi chỗ lệch vào trang_thai cùng commit; số dòng diff lấy từ `--numstat`, không từ `--stat`.
```
Kèm (ngoài khung): đã tự chạy `--truoc` trên `git archive 0a03b24` (6 SỐNG + 1 HỎNG-sập — khớp), N8 P26c / GOI-1 / LUOI-3 (bằng nền); ba đột biến
tự dựng: chỉ trả `so` cũ → SẬP; chỉ trả `throw` coGoi → SẬP (cả hai phần N7 cần); khoaLoai bỏ kiểu + `daLayTheoLoai` ORDER BY kiểu DESC → A2o +
A2p2 ĐỎ, A2p xanh (A2p2 là bảo hiểm thật). Rườm rà (mục 8): `layP` / `daLayP` (thu_GOI1.js:322–325) gần trùng `lay` / `daLayLoai` (:136–140).

### Vòng sửa 1 (`381d9ae` + commit này)
- Lỗi 1: NE1 lấy `sp[0].sx_product_id` (thu_GOI1.js:311–314) → GOI1 110/0; `dot_bien.py` 7/7 BẮT (`bang_chung_do.txt` mục 3).
- Lỗi 2: `ke_hoach.md` Phần B + mục 7 ghi đúng `so` KHÔNG chặn `null` (lệch kế hoạch đổi ở bước 5 vì `soDong` truyền null hợp lệ).
- Lỗi 3: số dòng theo `--numstat` (mục Bước 6).
- Rườm rà `layP` / `daLayP`: KHÔNG gộp — gộp phải sửa `lay` / `daLayLoai` cũ mà hàng chục ca cũ dùng (rủi ro đổi nghĩa ca cũ lớn hơn 4 dòng
  trùng); để việc dọn sau (Phát hiện).
- Nghi ngờ `donLay: null` / `ttGoi` NaN: chưa ca nào bị kích hoạt dưới 7 đột biến; cùng khuôn AU4-8 rộng hơn N7 → Phát hiện (LUOI-5).

## Câu hỏi
(không có)

## Phát hiện
- (soát vòng 1) `thu_GOI1.js` còn đường sập cùng khuôn AU4-8 ngoài 7 đột biến: `ttGoi` / `mot` nhận NaN thì libsql ném; `(await ttGoi(x)).status`
  khi không có dòng → TypeError (:458, :594, :853); `coGoi` trả `donLay: null` — `so(..., [null])` ra 0 có thể xanh oan nếu ca sau dùng.
- (soát vòng 1) `layP` / `daLayP` (thu_GOI1.js:322–325) gần trùng `lay` / `daLayLoai` (:136–140) — dọn khi có việc sửa helper GOI1.
- `thu_P26c.js:155–164` `goiDaLay` ném khi lấy-từ-gói ở bước dựng — cùng khuôn AU4-8 (ca đỏ làm cả bài sập) nhưng ngoài N7 (phiếu chỉ
  nêu thu_GOI1 A2); để LUOI-5 / việc sau.
- `viec/AUDIT-4/boc.py` `DOI_CHUNG` và `viec/AUDIT-4/dot_bien.py` `BAI` là hằng số ca (118 / 105): sau LUOI-4 thêm ca, chạy thẳng hai file
  đó sẽ DỪNG thoát 4 "lệch số ca". Đúng thiết kế đối chứng; không sửa (Cấm) — việc sau nên đọc số ca từ dòng tổng của bài.
- AU4-6 (`VS-AU4-L3-KHOA-LOAI-BO-KIEU`) có mặt "gộp `xin` khác kiểu" ở đường mua + lấy ngay (`orders.js:417`, `daLay = []`) — LUOI-4 giết
  đột biến qua mặt `find` (A2o / A2p); mặt gộp `xin` chưa ca riêng (mua gói + lấy ngay CT1 2 + tea 2 khi CT1 cài 2) — việc sau.

## N8 sau vòng sửa 1 (HEAD `537442f`, các bộ chạy thu_GOI1)
GOI-1 40 / 49 · GOI-2 59 / 59 · SO-LUONG-1 16 / 17 · LUOI-3 BẮT 10 / 10 · AUDIT-3 BẮT 15 · SỐNG 1 · HỎNG 5 · LẠC 5 — bằng nền. `npm test` PASS 64 ·
FAIL 0 · CẢNH BÁO 1; `--day-du` PASS 68 · FAIL 0 · CẢNH BÁO 1 (cây = `537442f`).

## Đếm nghiệm thu (mỗi mục một dòng)
- N0 — 7 tên trên HEAD `c9595f5` kèm đối chứng: mục N0 (6 SỐNG + 1 HỎNG-sập), neo không rữa; bảng trước / sau ở Bước 4–5.
- N1 AU4-2 — `thu_P26c.js` N1a; `bang_chung_do.txt` mục 1 SỐNG → mục 2, 3 BẮT `✗ N1a` (đền 20.455 → HTTP 200); 20.454 = ⌊25.000 × 45.000 / 55.000⌋.
- N2 AU4-3 — `thu_P26c.js` N2a; SỐNG → BẮT `✗ N2a` (ví 257143); 257.142 = 300.000 − ⌈300.000 / 7⌉.
- N3 AU4-4 — `thu_GOI1.js` B3q (hoan-du-kien + kết thúc, cùng số); SỐNG → BẮT `✗ B3q` (tong 257143 · 409); 257.142 = ⌊300.000 × 6 / 7⌋.
- N4 AU4-5 — `thu_P26c.js` N4a; đơn gói + mã 1 món QUA cổng quầy (tổng 320.000 — không cần INSERT); SỐNG → BẮT `✗ N4a` (ví 290500); 290.461.
- N5 AU4-6 — `thu_GOI1.js` A2o (chặn oan), A2p + A2p2 (giao vượt, hai thứ tự), "đã lấy" bằng INSERT; SỐNG → BẮT `✗ A2o` + `✗ A2p`; soát vòng 1
  tự dựng ORDER BY DESC → A2p2 đỏ (bảo hiểm có đột biến tất định).
- N6 AU4-7 — `thu_GOI1.js` [B8] B3r (cuối bài, sau B7j): hoan 0, ghi chú "(hoàn 0đ)", sổ + ví không đổi, ca khẳng định đơn lệch I19; SỐNG → BẮT `✗ B3r` (tong −20000).
- N7 AU4-8 — `thu_GOI1.js` `so()` NaN + `dungGoi` (6 chỗ): `VS-AU4-L3-LOAI-CHAN-BANG` HỎNG-sập → BẮT (95 đạt · 19 hỏng, `✗ A2b`); soát vòng 1
  chứng minh cả hai phần đều cần.
- N8 — mục "Nền N8" + "N8 sau vòng sửa 1": 8 bộ bằng nền, "không áp được" không tăng (cùng tên); `npm test`, `--day-du` xanh; đo riêng 3 lần
  P26c ≤ 4,54 s, GOI1 ≤ 3,70 s (< 96 s).

## Bài học
Sự cố: (a) stop hook chạy `npm test` SONG SONG lúc nền N8 chạy → `thu_cong.js` ETIMEDOUT 120 s (đỏ oan), nền P26c 350 s thay vì ~230 s;
(b) helper `dung` trùng tên `const dung` trong hai khối → TDZ, bài sập lần chạy đầu; (c) soát kế hoạch bắt lỗi chặn: B3r (dữ liệu cố ý lệch I19)
đặt trong [B3] sẽ làm B7j đỏ trên gốc; (d) soát vòng 1: id SX viết cứng (xanh oan tiềm ẩn), hồ sơ lệch code (`null`), số dòng `--stat` vs
`--numstat`; (e) người gác chặn 10 lệnh của phiên chính (B-CHUONGTRINH `time` / `for`, B-CD-VITRI `cd` giữa lệnh, SED-I, B-MANOI heredoc nhắc
file bảo vệ) — đều do viết lệnh sai khuôn, làm lại bằng Python / Write / Edit. Không vượt ngân sách (198 / 200), không phải hỏi / dừng.

- KHOÁ (đã làm, trong Phạm vi): ca phân biệt khoá ghép dựng đầu vào TỪ dữ liệu của loại kia — `thu_GOI1.js:311–314` NE1 lấy `sp[0].sx_product_id`;
  ca đỏ = `VS-AU4-L3-KHOA-LOAI-BO-KIEU` BẮT (`bang_chung_do.txt` mục 3).
- KHOÁ (đề xuất, ngoài Phạm vi): `viec/AUDIT-4/dot_bien.py` `BAI` / `boc.py` `DOI_CHUNG` đọc số ca từ dòng tổng của bài thay vì hằng 118 / 105 —
  ca đỏ: chạy `python3 viec/AUDIT-4/dot_bien.py` trên HEAD LUOI-4 → thoát 4 "lệch số ca". Gom vào LUOI-5.
- KHOÁ (đề xuất, ngoài Phạm vi): hook kiểm trước khi dừng — khi bài chạy thật hết giờ, in kèm "máy đang chạy tiến trình khác?" thay vì chỉ
  ETIMEDOUT; ca đỏ: chạy `npm test` trong lúc `viec/P26c/dot_bien.py` chạy. KHÔNG nới hạn (K8). TU-CHAY-7 đang giữ vùng này — chủ quán quyết.
- NGUYÊN TẮC (đề xuất, gộp vào K3 — KHUON_LOI.md do TU-CHAY-7 giữ): "ca bảo hiểm" (A2p2) phải có một đột biến TẤT ĐỊNH làm nó đỏ; helper chống
  sập nhiều phần thì gỡ TỪNG phần dưới đột biến; dữ liệu cố ý vi phạm bất biến đặt SAU mọi phép bất biến của bài và ca tự khẳng định lệch.
  Ví dụ thật: LUOI-4 soát kế hoạch (B3r / B7j) + soát vòng 1.
- NGUYÊN TẮC (đề xuất, gộp vào K1): code đi lệch kế hoạch (vd `so` không chặn `null`) → sửa kế hoạch trong CÙNG commit; số dòng lấy cột thêm của
  `git diff --numstat`. Ví dụ thật: LUOI-4 ghi "+93" thay vì "+84".
- BỎ: TDZ `const dung` trùng tên — một lần, bài sập ngay lần chạy đầu nên tự lộ. Lệnh bị người gác chặn — người gác đã làm đúng việc.
- Dọn: không thấy lời dặn nào trong `KHUON_LOI.md` / `CLAUDE.md` vừa có phép kiểm làm thay trong việc này. `KHUON_LOI.md` 116 / 120 dòng —
  hai đề xuất NGUYÊN TẮC phải gộp vào dòng sẵn có của K1 / K3, không thêm mục.

## Báo cáo
```
VIỆC:        LUOI-4 — Vá lưới: bắt 6 đột biến NẶNG-lưới AU4-2…7 (+ AU4-8 thu_GOI1 A2 đi tiếp khi ca đỏ) — chỉ thêm bài thử
ĐÃ SỬA:      cong_cu/thu_P26c.js khối [N] (sau [M]) — N1a, N2a, N4a
             cong_cu/thu_GOI1.js:90–91 so() trả NaN khi id rỗng · :143 dungGoi + 6 chỗ dựng không ném · A2o/A2p/A2p2 (cuối [A2]) · B3q (cuối [B3]) · [B8] B3r (cuối bài)
             viec/LUOI-4/dot_bien.py — bộ chấm nạp viec/AUDIT-4/dot_bien.py chỉ đọc, mẫu đúng tên ca. 0 dòng server/, client/, viec/AUDIT-4/.
BÀI THỬ:     python3 viec/LUOI-4/dot_bien.py --truoc trên bài chưa có ca → 6 SỐNG + 1 HỎNG-sập (bang_chung_do.txt mục 1);
             sau khi thêm ca → 7/7 BẮT đúng ca, đối chứng 121 / 110 xanh (mục 2, 3). SỐ CA thu_P26c.js 121 · thu_GOI1.js 110.
ĐÃ RÀ K4:    mọi nơi gọi tienDaTraTheoDong / soTienHoan / soTienHoanGoi / vuotTheoLoai (ke_hoach mục 3); grep "throw new Error" thu_GOI1.js trên
             gốc → 12 chỗ: 6 lấy-từ-gói ở bước dựng đã đổi dungGoi; còn 6 (SX giả :66, thiếu SP mẫu :117, tạo gói :130, mua gói :148, nạp ví :511,
             mua gói 30 :517) không qua vuotTheoLoai khi dựng — giữ, đường sập khác ghi Phát hiện.
CHƯA KIỂM:   - A2p2 trên gốc chỉ đỏ khi SQLite đổi thứ tự GROUP BY — chứng minh bằng đột biến tự dựng của người soát (ORDER BY DESC), không có trong dot_bien.py;
             - đường sập khác cùng khuôn AU4-8 (ttGoi/mot nhận NaN, donLay null) chưa có đột biến kích hoạt; thu_P26c goiDaLay vẫn ném;
             - viec/AUDIT-4/dot_bien.py, boc.py chạy thẳng trên HEAD sẽ DỪNG thoát 4 (hằng 118 / 105) — không sửa (Cấm);
             - không chạy trên Turso / production: mọi số đo trên kho thử libsql cục bộ.
GIT:         537442f LUOI-4: ra-soat vong 1 (DAT) chep nguyen van + vong sua 1, bang chung muc 3
             381d9ae LUOI-4: soat vong 1 — NE1 lay id SX tu CT1 (khong viet cung 1)
BÀI HỌC:     KHOÁ 3 (1 đã làm, 2 đề xuất) · NGUYÊN TẮC 2 (đề xuất, gộp vào K1/K3) · BỎ 2 — chi tiết ở ## Bài học
```

HEAD ĐÃ KIỂM: 537442f
