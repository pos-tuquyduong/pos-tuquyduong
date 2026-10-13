# LUOI-2 — trạng thái

## Bước 1 — đối chiếu bản chụp (13.10.2026)
- nhánh: `viec/LUOI-2`; `git status --short` sạch
- HEAD `fd919fd` · FETCH_HEAD `fd919fd` — bằng nhau, không kéo
- `git log --oneline -3`:
  ```
  fd919fd PHIEU: LUOI-2
  7f8656d TIEN-DO: P26c xong (9a68ab6), AUDIT-2 xong (bcfb509), mo GOI-1 + LUOI-2, them AUDIT-3 + DANG-NHAP-1 — so v28
  9a68ab6 Merge pull request #16 from pos-tuquyduong/viec/P26c
  ```

## N0 — 5 đột biến A3L chạy lại trên HEAD `fd919fd` (trước mọi sửa)
`python3 viec/AUDIT-2/dot_bien.py A3L-redeem-thieu-1-diem A3L-earn-flash-van-cong A3L-nhandiem-cong-doi A3L-goi-bo-kiem-chu A3L-goi-huy-dem-ca-mon-tra-tien -j 3`
```
SỐNG  A3L A3L-redeem-thieu-1-diem  (41 s) · mọi lệnh thoát 0
SỐNG  A3L A3L-earn-flash-van-cong  (41 s) · mọi lệnh thoát 0
SỐNG  A3L A3L-nhandiem-cong-doi  (41 s) · mọi lệnh thoát 0
SỐNG  A3L A3L-goi-bo-kiem-chu  (39 s) · mọi lệnh thoát 0
SỐNG  A3L A3L-goi-huy-dem-ca-mon-tra-tien  (39 s) · mọi lệnh thoát 0
  tổng 5 · thời gian 124 s
  A3L BẮT 0 · SỐNG 5 · HỎNG 0 · LẠC 0 · TREO 0
  ✓ kho thật không đổi
```
- Neo: cả 5 áp được (không HỎNG) → **không neo lại**; neo trước = neo sau. Vị trí trên HEAD: `loyalty.js:163`, `orders.js:783`
  (AUDIT-2 ghi 770), `signup-codes.js:213`, `orders.js:214` (ghi 208), `orders.js:1412` (lần khớp 0 / 2 = huỷ; lần 1 = xoá `:1543`).
- Cách chạy `c2full` (`viec/AUDIT-1/dot_bien.py:222`) KHÔNG chạy `cong_cu/thu_P26c.js`. Đo thêm bằng công cụ nháp (bản sao `server/`
  + `node cong_cu/thu_P26c.js --may-chu <bản sao>`): N1–N6 (gồm N6 `tienDaTra.js` bỏ `− debt_amount`) đều `76 đạt · 0 hỏng` → SỐNG.

## Câu hỏi
1. (CHẶN bước 4) Phiếu cần mục `## Bài thử cũ sửa` cho `cong_cu/thu_P26c.js` — cổng A11 (`tu_chay/cong.js:261–280`) đòi bài
   thử bị sửa phải ĐỎ trên gốc; ca của LUOI-2 là ca hồi quy, code đang đúng nên xanh trên gốc, đỏ chỉ qua đột biến. Chi tiết
   `ke_hoach.md` mục 5. Máy không tự sửa phiếu.

## Phát hiện
1. `server/routes/signup-codes.js:197` — `/nhan-diem` tính `diemGoc = floor(don.total / per)` không xét đơn có flash; luật F2
   (`orders.js:782–783`) không cộng điểm cho đơn flash lúc bán, nhưng mã bill của đơn đó vẫn nhân `diemGoc × heSo`. Chưa chạy;
   cố ý hay không là câu hỏi nghiệp vụ. Không sửa (phiếu cấm `server/`).

## Soát kế hoạch (agent phụ, chỉ đọc)
Không ngoài Phạm vi; không có cách ngắn hơn đáng kể. Đã sửa theo soát: `c2luoi` khai trong `viec/AUDIT-2/dot_bien.py`, giữ tầng 2;
L3a khẳng định có dòng earn trước khi nhận điểm (chống xanh oan); flash chỉ bật quanh L2a (chống sập L5a). Thêm Phát hiện 1.
Tên đột biến mới sẽ dùng: `A3L-hoan-goi-bo-tru-no`, `A3L-goi-xoa-dem-ca-mon-tra-tien`.

## Làm tiếp (13.10, chủ quán duyệt kế hoạch 5897b49; Câu hỏi 1 đã trả lời: phiếu có ## Bài thử cũ sửa)
- bước 1: HEAD `5897b49` · FETCH_HEAD `0ee508e` — HEAD là tổ tiên → `git pull --ff-only`. `git log --oneline -3`:
  ```
  0ee508e PHIEU: LUOI-2
  5897b49 LUOI-2: ke hoach sua theo soat (L3a chong xanh oan, flash chi quanh L2a, c2luoi o AUDIT-2) + Cau hoi 1 + Phat hien 1
  c96236d LUOI-2: ke hoach (cho duyet) + trang thai N0
  ```
- Phát hiện 1: chủ quán dặn ghi lại, không sửa ở việc này.

## Dừng (lượt trước)
Phiếu dặn "chờ duyệt kế hoạch" → dừng ở bước 3, chờ chủ quán duyệt + trả lời Câu hỏi 1.

## Bước 4–5 — ca hồi quy + đột biến (không sửa code quầy)
Chỗ canh → đột biến (`viec/AUDIT-2/dot_bien.py`, cách chạy `c2luoi` = c2full + `thu_P26c.js --client <kho>/client`):

| NT | chỗ code (đọc HEAD) | đột biến | ca bắt | trước | sau |
|---|---|---|---|---|---|
| N1 | `loyalty.js:163` | `A3L-redeem-thieu-1-diem` | L1a | SỐNG | BẮT `✗ L1a` |
| N2 | `orders.js:783` | `A3L-earn-flash-van-cong` | L2a | SỐNG | BẮT `✗ L2a` |
| N3 | `signup-codes.js:213` | `A3L-nhandiem-cong-doi` | L3a | SỐNG | BẮT `✗ L3a` |
| N4 | `orders.js:214` | `A3L-goi-bo-kiem-chu` | L4a | SỐNG | BẮT `✗ L4a` |
| N5 | `orders.js:1412` (huỷ) | `A3L-goi-huy-dem-ca-mon-tra-tien` | L5a | SỐNG | BẮT `✗ L5a` |
| K4 | `orders.js:1543` (xoá) | `A3L-goi-xoa-dem-ca-mon-tra-tien` (mới) | A1c (sẵn có) | BẮT | BẮT `✗ A1c` |
| N6 | `tienDaTra.js:45` | `A3L-hoan-goi-bo-tru-no` (mới) | L6a | SỐNG | BẮT `✗ L6a` |

Đầy đủ: `bang_chung_do.txt` (trước: 6 SỐNG · 1 BẮT; sau: BẮT 7 · SỐNG 0 · HỎNG 0 · LẠC 0). Công cụ nháp (bản sao server/ + thu_P26c)
cũng cho từng đột biến đỏ ĐÚNG ca, đúng lý do (N1: điểm −1, voucher 1 · N2: điểm 2 · N3: tổng 15 · N4: 200, giao 2 · N5: còn 1 ·
N6: ví 300.000). N1 làm đỏ thêm L1b (điểm đã âm) — hệ quả, không phải ca chặn hộ: L1a đỏ trước.
m2 (`Math.floor → Math.ceil` trong `tienDaTraTheoDong`, 1 đ) — theo phiếu chỉ ghi, không bắt.
Phát hiện 1 (mã bill trên đơn flash) — chủ quán dặn ghi lại, không sửa ở việc này.

## Bước 6 — kiểm
- `node cong_cu/thu_P26c.js` → 84 đạt · 0 hỏng (76 + 8), ~4 s.
- `npm test` → PASS 62 · FAIL 0 · CẢNH BÁO 0. `node kiem_tra_truoc_khi_giao.js --day-du` → PASS 66 · FAIL 0 · CẢNH BÁO 0.
- N7 `python3 viec/P26c/dot_bien.py` → 93 đột biến bị bắt · 0 KHÔNG (trên 93) — bằng bản ghi P26c (`viec/P26c/trang_thai.md:545`).
- N7 `viec/LUOI-1/dot_bien.py` và `viec/AUDIT-2/kiem_neo.py` KHÔNG CHẠY ĐƯỢC ở máy này: kho nông thiếu commit `9521cec`
  (`viec/LUOI-1/dot_bien.py:24` `git show 9521cec:...` → 128); người gác chặn `git fetch --deepen` (GIT-KEO). → CHƯA KIỂM.
- Hook pre-commit (tầng 3) không cài ở máy mây này (chỉ `*.sample`) — đã tự chạy `npm test` trước commit.
