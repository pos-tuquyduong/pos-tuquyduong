# LUOI-4 — Vá lưới: bắt 6 đột biến NẶNG-lưới AU4-2…7 của AUDIT-4 (+ AU4-8 thu_GOI1 A2 đi tiếp khi ca đỏ) — chỉ thêm bài thử

<!-- Phiếu do chat soạn 16.10.2026. Nền: main sau sổ việc v35 (cha ddc42d2 = Merge PR #28 AUDIT-4; P20c PR #27). Nguồn ĐỌC NGUYÊN
     VĂN: viec/AUDIT-4/bao_cao.md bảng AU4-2…AU4-8 (cột "ca đề xuất" có SỐ ĐÃ TÍNH trên gốc và trên đột biến — máy tính lại, không chép),
     viec/AUDIT-4/dot_bien.py (chạy được từng tên, có đối chứng), viec/LUOI-3/ (khuôn: bảng SỐNG trước / BẮT sau). AU4-1 (mã có khoảng
     trắng, thu_P20.js) → MA-GIAM-1, KHÔNG làm ở đây. AU4-21 (19 SỐNG cũ) → LUOI-5 sau. Song song: MA-GIAM-1 (discount-codes.js,
     signup-codes.js, orders.js, thu_P26a.js, thu_P20.js) và TU-CHAY-7 (tu_chay/, kiem_tra, thu_gia_lap.js, KHUON_LOI.md) — KHÔNG chung file. -->

**Chờ duyệt kế hoạch:** viết `viec/LUOI-4/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Lưới bắt được 6 lỗi tiền / gói mà code ĐANG ĐÚNG nhưng chưa ca nào canh: 3 chỗ làm tròn lệch 1đ, trần mã một món áp nhầm sang huỷ / kết
thúc gói, khoá loại gói bỏ kiểu SX, sàn 0 khi kết thúc gói. Chỉ thêm ca; KHÔNG sửa code quầy. Lộ code đang SAI → DỪNG, ghi `## Câu hỏi`.

## Nghiệm thu
Mỗi tên (đúng trong `viec/AUDIT-4/dot_bien.py`): SỐNG trên HEAD trước (in bằng chứng) → BẮT sau, đỏ ĐÚNG ca của nó (so câu lỗi, không
phải sập, không phải ca khác chặn hộ). Số tiền mong của mỗi ca TỰ TÍNH trên gốc VÀ trên đột biến, ghi phép tính (bài học LUOI-3).
- N1 AU4-2 `VS-AU4-L3-DATRA-LAM-TRON-LEN`: đơn 2 món có mã giảm cấp đơn, tổng không chia hết → trần dòng làm tròn XUỐNG (20.454 chứ không 20.455).
- N2 AU4-3 `VS-AU4-L3-HOAN-DA-DUNG-LAM-TRON-XUONG`: gói 300.000 / 7 lượt, lấy 1, huỷ → hoàn 257.142 (đã dùng làm tròn LÊN).
- N3 AU4-4 `VS-AU4-L3-HOAN-GOI-LAM-TRON-LEN`: cùng dữ liệu, "Kết thúc gói" có hoàn → 257.142, `hoan-du-kien` cùng số.
- N4 AU4-5 `VS-AU4-L3-CHAN-TREN-CA-HOAN`: đơn gói + món có mã giảm 1 món, lấy 1, huỷ → trần mã-1-món KHÔNG áp sang gói (290.461). Trước khi
  viết: xác nhận đơn gói + mã 1 món qua được cổng hiện tại (bao_cao ghi CHƯA chạy); không qua → ghi `## Câu hỏi`, không ép.
- N5 AU4-6 `VS-AU4-L3-KHOA-LOAI-BO-KIEU`: hai kiểu SX trùng `sx_product_id` → khoá loại phân biệt kiểu, cả hai chiều (chặn oan / giao vượt)
  theo cột ca đề xuất; dựng "đã lấy" bằng INSERT trực tiếp như B3p.
- N6 AU4-7 `BV-AU4-L3-B3P-BO-SAN-0`: đền cũ theo giá gốc + giảm lớn → kết thúc gói: phản hồi `hoan` = 0, ghi chú gói "hoàn 0đ", sổ không đổi.
- N7 AU4-8 `thu_GOI1.js` khối A2: ca sau không phụ thuộc dữ liệu ca trước (ca đỏ không làm cả bài sập) — ca: `VS-AU4-L3-LOAI-CHAN-BANG`
  phải ra BẮT (đỏ đúng ca) thay vì HỎNG-sập.
- N0 Trước khi viết ca: chạy lại 7 tên trên HEAD kèm đối chứng (`viec/AUDIT-4/boc.py` / `dot_bien.py`); neo rữa → `## Câu hỏi`, KHÔNG sửa
  `viec/AUDIT-4/`. Bảng trước / sau vào `trang_thai.md` (tên · SỐNG trước · BẮT sau · ca đỏ · câu lỗi · số mong + phép tính).
- N8 Đột biến cũ đang BẮT vẫn BẮT (P26c, GOI-1, GOI-2, SO-LUONG-1, BAN-HANG-1, LUOI-2, LUOI-3, AUDIT-3 10 tên; "không áp được" đã biết không
  tăng). `npm test`, `--day-du` xanh; mỗi bài < 80 % hạn (đo riêng 3 lần, ghi số).

## Bài thử đỏ
không — LUOI-4 chỉ thêm ca hồi quy cho code ĐANG ĐÚNG (0 dòng code quầy); đỏ chứng minh bằng 7 đột biến AUDIT-4 (bang_chung_do.txt)

## Bài thử cũ sửa
- cong_cu/thu_P26c.js — LUOI-4 chỉ thêm ca hồi quy cho code ĐANG ĐÚNG nên xanh trên gốc; đỏ chứng minh bằng đột biến AU4-2, 3, 5
- cong_cu/thu_GOI1.js — LUOI-4 chỉ thêm ca hồi quy cho code ĐANG ĐÚNG nên xanh trên gốc; đỏ chứng minh bằng đột biến AU4-4, 6, 7, 8

## Phạm vi
- viec/LUOI-4/**
- cong_cu/thu_P26c.js
- cong_cu/thu_GOI1.js

## Ngân sách
~120–200 dòng thử; 0 dòng code quầy. Kế hoạch ước lượng thời gian máy (đo).
**Phương án đơn giản nhất đã xét:** mỗi đột biến một ca nhỏ nhất; N2 + N3 chung dữ liệu; không bất biến mới; không file bài thử mới;
không sửa `viec/AUDIT-4/`.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- KHÔNG sửa `server/`, `client/` — lộ code SAI thì DỪNG, ghi `## Câu hỏi`.
- KHÔNG sửa `cong_cu/thu_P20.js`, `thu_P26a.js`, `server/**` (MA-GIAM-1 song song), `tu_chay/`, `kiem_tra_truoc_khi_giao.js`, `cong_cu/thu_gia_lap.js`,
  `KHUON_LOI.md` (TU-CHAY-7 song song), `cong_cu/gia_lap/**`, `viec/AUDIT-4/**`, `.claude/`, `.github/`, sổ việc.
- Không nới hạn, không hạ ngưỡng, không bớt ca / `c.mong`. Chỉ push đúng `git push -u origin viec/LUOI-4`. Không đụng `main`, không merge, không tạo PR.
