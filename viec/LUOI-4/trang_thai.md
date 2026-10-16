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
- Diff `c9595f5..HEAD`: thu_GOI1 +93 −9, thu_P26c +40, dot_bien.py +74 = 198 dòng (ngân sách 120–200; kế hoạch ước 130 — GOI1 vượt ước
  vì helper dựng loại `tea` + INSERT "đã lấy" + chống id rỗng). 0 dòng `server/`, `client/`, `viec/AUDIT-4/`.

## Câu hỏi
(không có)

## Phát hiện
- `thu_P26c.js:155–164` `goiDaLay` ném khi lấy-từ-gói ở bước dựng — cùng khuôn AU4-8 (ca đỏ làm cả bài sập) nhưng ngoài N7 (phiếu chỉ
  nêu thu_GOI1 A2); để LUOI-5 / việc sau.
- `viec/AUDIT-4/boc.py` `DOI_CHUNG` và `viec/AUDIT-4/dot_bien.py` `BAI` là hằng số ca (118 / 105): sau LUOI-4 thêm ca, chạy thẳng hai file
  đó sẽ DỪNG thoát 4 "lệch số ca". Đúng thiết kế đối chứng; không sửa (Cấm) — việc sau nên đọc số ca từ dòng tổng của bài.
- AU4-6 (`VS-AU4-L3-KHOA-LOAI-BO-KIEU`) có mặt "gộp `xin` khác kiểu" ở đường mua + lấy ngay (`orders.js:417`, `daLay = []`) — LUOI-4 giết
  đột biến qua mặt `find` (A2o / A2p); mặt gộp `xin` chưa ca riêng (mua gói + lấy ngay CT1 2 + tea 2 khi CT1 cài 2) — việc sau.
