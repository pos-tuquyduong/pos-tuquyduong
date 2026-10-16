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
`ke_hoach.md`. Phiếu dặn "Chờ duyệt kế hoạch" → commit, push, DỪNG ở đây.

## Câu hỏi
(không có — chờ chủ quán duyệt kế hoạch)

## Phát hiện
- `thu_P26c.js:155–164` `goiDaLay` ném khi lấy-từ-gói ở bước dựng — cùng khuôn AU4-8 (ca đỏ làm cả bài sập) nhưng ngoài N7 (phiếu chỉ
  nêu thu_GOI1 A2); để LUOI-5 / việc sau.
- `viec/AUDIT-4/boc.py` `DOI_CHUNG` và `viec/AUDIT-4/dot_bien.py` `BAI` là hằng số ca (118 / 105): sau LUOI-4 thêm ca, chạy thẳng hai file
  đó sẽ DỪNG thoát 4 "lệch số ca". Đúng thiết kế đối chứng; không sửa (Cấm) — việc sau nên đọc số ca từ dòng tổng của bài.
