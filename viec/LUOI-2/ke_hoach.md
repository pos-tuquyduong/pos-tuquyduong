# LUOI-2 — kế hoạch (chờ duyệt)

Nền: HEAD `fd919fd`. Chỉ thêm ca thử + đột biến; 0 dòng `server/`, `client/`. Số dòng dưới đọc trong lượt này.

## 0. Sự thật đã đo (N0)
- 5 đột biến A3L áp được trên HEAD (neo khớp, không HỎNG) và SỐNG qua `c2full` — `trang_thai.md` mục N0. **Không cần neo lại.**
- `c2full` (`viec/AUDIT-1/dot_bien.py:222–223`) chạy giả lập + `thu_P26a` + `thu_P26b` (+ `thu_P20`, `thu_P21`), **không** chạy
  `thu_P26c.js`. Đo nháp: N1–N6 trên bản sao `server/` → `thu_P26c.js` vẫn `76 đạt · 0 hỏng` → cả sáu SỐNG qua mọi bài hiện có.
- `thu_P26c.js` chạy 3 s (76 ca), đã đăng ký trong bộ kiểm (`kiem_tra_truoc_khi_giao.js:492`) → thêm ca ở đây KHÔNG đụng bộ kiểm.
- N6 dựng được: `POST /orders` không chặn mua gói ghi nợ (`orders.js:735–745` chỉ đặt `payment_status`; đối chiếu tổng
  `:752–763` cộng cả `finalDebtAmount`); huỷ chỉ cần `status = 'completed'` (`:1355–1366`). Ca sẽ chứng minh bằng HTTP 200.

## 1. Phương án

### Phần A — ca thử
| | A (chọn) | B |
|---|---|---|
| chỗ | `cong_cu/thu_P26c.js`: một khối `[L]` trước `[K1b]` (6 ca bắt + 2 ca K5) + gắn route `signup-codes` vào danh sách `:88` | `cong_cu/gia_lap/kich_ban.js`: thêm ca vào KB15 / KB11 / KB19 / KB21 + KB mới cho flash và gói nợ |
| số file / dòng | 1 file · ~60–75 dòng | 1–3 file (KB mới → `LUOT`, `NGUONG_KICH_BAN`, T9c, `DONG_DAT`) · ~90–140 dòng |
| tốc độ | +~1 s trên 3 s | mỗi đột biến chạy giả lập ~35 s; KB mới phải đo lượt < 180 s |
| rủi ro | đụng cài đặt chung (loyalty / flash / nhân điểm) của kho thử → đặt trong khối, trả về như cũ cuối khối (khuôn A5i `:292–297`) | thêm KB làm giả lập dài thêm, gần hạn 110 s con; đụng cùng chỗ GOI-1 không — nhưng nhiều file hơn |

Chọn A: ít dòng nhất, phiếu ưu tiên `thu_P26c.js`, không thêm bất biến (không bất biến nào bắt được ≥ 2 đột biến cùng loại mà I8 /
I14 hiện chưa có — các đột biến sống vì THIẾU DỮ LIỆU, không vì thiếu bất biến) → `bat_bien.js`, `thu_gia_lap.js`, `kich_ban.js`,
`kiem_tra_truoc_khi_giao.js` **không đổi**; N7 phần "thêm KB / bất biến" không phát sinh.

### Phần B — bộ đột biến `viec/AUDIT-2/dot_bien.py`
| | A (chọn) | B |
|---|---|---|
| cách | thêm `K.LENH['c2luoi']` NGAY TRONG `viec/AUDIT-2/dot_bien.py` (khuôn dòng 22; KHÔNG sửa `viec/AUDIT-1/` — ngoài Phạm vi) = tầng 1 của `c2full` + `node cong_cu/thu_P26c.js --client <GOC>/client`, GIỮ tầng 2 (`thu_P20`, `thu_P21`); 5 đột biến N1–N5 đổi `c2full` → `c2luoi` và mẫu `✗ ` → `✗ L<n>` (đúng ca); thêm 2 dòng: N6 `A3L-hoan-goi-bo-tru-no`, K4 `A3L-goi-xoa-dem-ca-mon-tra-tien` | cách chạy chỉ `thu_P26c` (3 s) |
| dòng | ~10 | ~10 |
| lý do | vẫn đo cả giả lập + P26a/b như AUDIT-2 (SỐNG trước là SỐNG qua MỌI bài), mẫu riêng chứng minh "đỏ ĐÚNG ca, không ca khác chặn hộ" | nhanh hơn nhưng bằng chứng SỐNG trước hẹp hơn |

`--client` tuyệt đối: bản sao `sv` không có `client/` (`viec/AUDIT-1/dot_bien.py:246–248`), mà `thu_P26c.js` đọc
`client/src/pages/*.jsx` (A6c, A7c, D1a) → thiếu cờ thì sập. Chỉ đọc. `kiem_sach` (chạy bản sạch 3 lần) chứng minh.
Không đổi `c2full` (các A3L khác dùng nó — giữ nguyên kết quả cũ).

## 2. Ca thử ↔ nghiệm thu (1-1)
Cài đặt trong khối: `nhandiem_enabled=1`, `nhandiem_he_so=2`; tích điểm dùng mặc định của kho (`database.js:1085–1086`: bật, 10.000đ =
1 điểm — soát vòng 1 bỏ đặt lại thừa; L2b canh nó đang bật). Flash 20 %
cho `sp[0]`, khung giờ = giờ VN hiện tại → +2 giờ, CHỈ bật quanh L2a và tắt ngay sau L2a (soát kế hoạch: bật suốt khối thì món
`sp[0]` của L5a lệch tổng → 400 `orders.js:756–763`, sập). Cài đặt nhân điểm + flash trả về như cũ sau L3a. Thứ tự: L1 → L2 → L3 → L4 → L5 → L6.

| NT | đột biến | ca | khẳng định (đỏ khi đột biến) |
|---|---|---|---|
| N1 | `A3L-redeem-thieu-1-diem` | **L1a** quà 3 điểm, khách có ĐÚNG 2 → `/loyalty/redeem` 400; điểm vẫn 2, 0 voucher | đột biến: 200, điểm −1 |
|  | (K5) | **L1b** thêm 1 điểm (= 3) → 200, điểm 0 — chứng minh L1a không đỏ vì quà hỏng | |
| N2 | `A3L-earn-flash-van-cong` | **L2a** đơn có SĐT, món flash → 200, `flash_discount > 0`, 0 dòng `earn` của đơn | đột biến: có dòng earn |
|  | (K5) | **L2b** cùng cài đặt, món KHÔNG flash (`sp[1]` 20.000) → 2 điểm — chứng minh tích điểm đang bật (không có ca này thì L2a xanh oan, K3) | |
| N3 | `A3L-nhandiem-cong-doi` | **L3a** bán `sp[2]` 50.000 có SĐT → KHẲNG ĐỊNH đơn có dòng `earn` 5 điểm (không có thì `daCong = null`, gốc và đột biến cùng cộng `diemGoc × heSo` — xanh oan, `signup-codes.js:208–214`) → `/signup-codes/nhan-diem` mã bill của đơn, cùng SĐT → 200; tổng điểm của đơn = 5 × 2 = 10 | đột biến: 15 |
| N4 | `A3L-goi-bo-kiem-chu` | **L4a** gói của khách A, đơn SĐT B gửi `customer_package_id` gói A → 400 `GOI_KHONG_DUNG_CHU`, `delivered_qty` không đổi | đột biến: 200, gói A bị trừ |
| N5 | `A3L-goi-huy-dem-ca-mon-tra-tien` | **L5a** gói đã giao 2; đơn 1 ly gói + 1 món lẻ `sp[1]` (20.000 tiền mặt — sửa theo soát vòng 1: bản đầu ghi 25.000, code dùng `mon(1)`) → giao 3; huỷ → giao 2 | đột biến: 1 |
| N6 | `A3L-hoan-goi-bo-tru-no` (mới, `server/utils/tienDaTra.js:45`) | **L6a** gói 300.000 / 10 lượt, tiền mặt 100.000 + nợ 200.000, chưa lấy → mua 200; owner huỷ 200; ví +100.000, tổng hoàn của đơn 100.000 | đột biến: +300.000 |
| N0 | 5 A3L | chạy lại trên HEAD — đã làm, `trang_thai.md` | |
| N7 | | `python3 viec/P26c/dot_bien.py`, `viec/LUOI-1/dot_bien.py`, `viec/TACH-GL/dot_bien.py` đủ: số BẮT không giảm; `npm test`, `--day-du` xanh 0 CẢNH BÁO; `python3 viec/AUDIT-2/kiem_neo.py` 0 HỎNG mới | |

Bằng chứng: chạy `python3 viec/AUDIT-2/dot_bien.py <6 tên> A3L-goi-xoa-dem-ca-mon-tra-tien` ở commit có cách chạy `c2luoi` +
dòng N6 nhưng CHƯA có khối `[L]` → SỐNG ×6 (A1c đã bắt lần xoá — xem K4); sau khối `[L]` → BẮT ×7, câu khớp đúng `✗ L<n>` / `✗ A1c`.
Chép cả hai vào `bang_chung_do.txt`. m2 (`Math.floor → Math.ceil`, 1 đ) — chỉ ghi, không bắt (phiếu).

## 3. Đường song song (K4)
- N5: cùng bộ lọc ở đường XOÁ `orders.js:1543` (lần khớp 1). A1c (`thu_P26c.js` A1c: 1 ly gói + 1 món, duyệt hoàn rồi xoá → 4 → 3)
  đã phủ → thêm đột biến `A3L-goi-xoa-dem-ca-mon-tra-tien` (lần 1) để CHỨNG MINH (dự kiến BẮT `✗ A1c` ngay, không cần ca mới).
- N6: `soTienHoan` có 3 nơi gọi — huỷ (`orders.js:1305` qua `hoanVi`), xoá (cùng `hoanVi`), duyệt hoàn (`refunds.js:164`). Đột biến
  nằm trong hàm chung → một ca bắt cho cả ba; đường duyệt hoàn đơn gói CÒN NỢ không thêm ca (bản thân duyệt hoàn đơn nợ là luồng
  riêng — ghi Phát hiện nếu đọc thấy lỗ, không mở rộng).
- N2: `!flashApplied` còn ở giảm hạng `orders.js:545` — luật khác (không giảm hạng khi flash), ngoài 6 đột biến → chỉ ghi Phát hiện
  nếu chưa có ca.
- N4: lấy gói chỉ còn một cổng (`/deliver` đã bỏ — A4). N1: đổi điểm chỉ một chỗ so `balance < cost`. N3: nhánh `daCong = null`
  (đơn không SĐT) không bị đột biến chạm — không thêm ca.

- Soát kế hoạch (agent phụ) thấy: `/nhan-diem` tính `diemGoc` từ `don.total` không xét flash (`signup-codes.js:197`) → đơn flash có
  SĐT (lúc bán 0 điểm) vẫn được nhân điểm qua mã bill. Code quầy, câu hỏi nghiệp vụ → ghi `## Phát hiện`, không sửa.

## 4. Luồng hợp lệ phải KHÔNG bị chặn (K5)
Việc không đổi code quầy → không phép chặn mới. Ca K5 có giá trị chống xanh oan: L1b (đủ điểm thì đổi được), L2b (đơn không flash
vẫn cộng điểm). Lấy gói đúng chủ: đã có A1a / A2b. Cài đặt chung trả lại sau L3a để ca sau ([K1b] — ca duy nhất sau khối) chạy như cũ — `npm test`
toàn bộ xanh chứng minh.

## 5. Câu hỏi cần chủ quán (CHẶN bước 4)
Cổng A11 (`tu_chay/cong.js:261–280`): bài thử bị sửa phải ĐỎ trên code gốc, trừ khi phiếu có mục `## Bài thử cũ sửa`
(`tu_chay/cong.js:61–63, 252–259, 279`). Ca của việc này là ca HỒI QUY — code quầy đang đúng nên `thu_P26c.js` XANH trên gốc;
"đỏ" chỉ có qua đột biến. Theo skill bước 4: không tự sửa phiếu, không dựng ca đỏ giả → **xin chủ quán thêm vào phiếu:**
```
## Bài thử cũ sửa
- cong_cu/thu_P26c.js — LUOI-2 thêm ca hồi quy cho code ĐÚNG; đỏ chứng minh bằng đột biến (bang_chung_do.txt)
```

## 6. Ngân sách
~60–75 dòng `thu_P26c.js` + ~10 dòng `viec/AUDIT-2/dot_bien.py` — trong 150–250. 0 dòng code quầy.
