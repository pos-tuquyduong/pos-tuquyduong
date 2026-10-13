# LUOI-2 — Vá lưới: bắt 5 đột biến NẶNG-lưới của AUDIT-2 + 1 của chat soát P26c (chỉ thêm bài thử, không sửa code quầy)

<!-- Phiếu do chat soạn 13.10.2026. Nền: main sau sổ việc v28 (cha 9a68ab6 = Merge PR #16 P26c).
     Nguồn: viec/AUDIT-2/bao_cao.md AU2-2 + a3_bang.md mục 2 (đọc NGUYÊN VĂN); chat soát cuối P26c (13.10) đặt hai đột biến
     trên server/utils/tienDaTra.js, cả hai SỐNG qua thu_P26c + giả lập: (m1) soTienHoan bỏ `− debt_amount` → huỷ đơn mua gói còn
     ghi nợ hoàn cả phần CHƯA trả; (m2) Math.floor → Math.ceil (1đ — KHÔNG cần bắt, chỉ ghi). P26c đã viết lại nhiều đoạn
     orders.js mà đột biến A3L-goi-* neo vào → neo phải kiểm lại trên HEAD trước. GOI-1 sửa orders.js / Sales.jsx SONG SONG —
     không chờ; neo nào rữa sau khi GOI-1 gộp thì AUDIT-3 (kiem_neo.py) bắt. -->

**Chờ duyệt kế hoạch:** viết `viec/LUOI-2/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Lưới bắt được 6 lỗi tiền / điểm / gói mà hiện nay code đang đúng nhưng nếu hỏng thì KHÔNG bài thử nào kêu — điều kiện để AUDIT-3
đạt điểm dừng. Chỉ thêm ca / bất biến / đột biến; KHÔNG sửa logic quầy. Đích: xong 14.10, song song GOI-1 (không chung file).

## Nghiệm thu
Mỗi đột biến dưới: SỐNG trên HEAD trước việc này (in bằng chứng) → BẮT sau, đỏ ĐÚNG ca / bất biến của nó (không phải sập, không
phải ca khác chặn hộ — so câu lỗi).
- N1 `A3L-redeem-thieu-1-diem` (`loyalty.js`, `balance < cost` → `< cost − 1`): đổi quà khi có ĐÚNG `cost − 1` điểm → 400.
- N2 `A3L-earn-flash-van-cong` (`orders.js`, bỏ `!flashApplied`): bán đơn flash có SĐT → 0 điểm (I8 hoặc ca tay).
- N3 `A3L-nhandiem-cong-doi` (`signup-codes.js`, `× heSo` thay `× (heSo − 1)`): bán có SĐT rồi nhận điểm mã bill → tổng điểm =
  điểm gốc × hệ số, không hơn.
- N4 `A3L-goi-bo-kiem-chu` (`orders.js`, bỏ so SĐT đơn với SĐT gói): lấy gói bằng SĐT khác → 400 `GOI_KHONG_DUNG_CHU`, gói không đổi.
- N5 `A3L-goi-huy-dem-ca-mon-tra-tien` (`orders.js`, huỷ đơn đếm cả món trả tiền vào lượt trả lại): huỷ đơn lấy 1 ly gói + 1 món
  lẻ → gói trả đúng 1 lượt.
- N6 (chat, m1) `server/utils/tienDaTra.js` `soTienHoan` bỏ `− debt_amount`: huỷ đơn mua gói còn ghi nợ (vd gói 300.000, trả
  100.000, nợ 200.000, chưa lấy) → ví nhận đúng 100.000, không 300.000. Nếu máy chủ không cho mua gói ghi nợ thì ghi rõ (dẫn
  dòng code + ca chứng minh bị chặn) thay vì dựng ca giả.
- N0 Trước khi viết ca: chạy lại 5 đột biến N1–N5 trên HEAD (`python3 viec/AUDIT-2/dot_bien.py <tên>`); neo nào rữa vì P26c viết
  lại → neo lại vào code HEAD (giữ đúng ý đột biến), ghi trước / sau vào `trang_thai.md`.
- N7 Đột biến cũ đang BẮT vẫn BẮT (`viec/P26c/dot_bien.py`, `viec/LUOI-1/dot_bien.py`, `viec/TACH-GL/dot_bien.py`); thêm KB → gán
  `LUOT`, mỗi lượt < 180 s (đo chạy RIÊNG); thêm bất biến → sửa CẢ T9c, `DONG_DAT` (`thu_gia_lap.js`) và `NGUONG_*`
  (`kiem_tra_truoc_khi_giao.js`, chỉ tăng). `npm test`, `--day-du` xanh, 0 CẢNH BÁO.

## Phạm vi
- viec/LUOI-2/**
- viec/AUDIT-2/dot_bien.py
- cong_cu/gia_lap/kich_ban.js
- cong_cu/gia_lap/bat_bien.js
- cong_cu/thu_gia_lap.js
- cong_cu/thu_P26c.js
- kiem_tra_truoc_khi_giao.js

## Ngân sách
~150–250 dòng thử (KB / ca / bất biến) + neo lại đột biến; 0 dòng code quầy.
**Phương án đơn giản nhất đã xét:** mỗi đột biến một ca nhỏ nhất bắt được nó, ưu tiên ca trong `cong_cu/thu_P26c.js` (đã đăng ký
trong bộ kiểm, nhanh) hơn kịch bản giả lập mới; KHÔNG thêm file bài thử mới (đăng ký file mới đụng cùng chỗ GOI-1 sửa trong
`kiem_tra_truoc_khi_giao.js`); chỉ thêm bất biến khi một bất biến bắt được nhiều đột biến cùng loại.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- KHÔNG sửa `server/`, `client/` — lộ code đang SAI thì DỪNG, ghi `## Câu hỏi`.
- Không sửa `server/routes/packages.js`, `Settings.jsx`, `Reports.jsx` (GOI-1 đang sửa song song).
- Không nới hạn (120 s bộ kiểm, 110 s giả lập con, 180 s mỗi lượt), không hạ ngưỡng, không giảm trễ 40 ms, không bớt ca / bất biến /
  `c.mong`; bánh cóc chỉ tăng.
- Không sửa `.claude/`, `.github/`, `tu_chay/`, `CLAUDE.md`, sổ việc.
- Chỉ push đúng `git push -u origin viec/LUOI-2`. Không đụng `main`, không merge, không tạo PR.
