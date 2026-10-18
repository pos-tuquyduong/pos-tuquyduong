# LUOI-5 — Vá lưới: 18 đột biến SỐNG cũ xếp NẶNG theo Q5 (AU4-21) — đo lại dưới LƯỚI ĐỦ trước, chỉ thêm ca cho cái còn SỐNG

<!-- Phiếu do chat soạn 17.10.2026. Nền: main sau sổ việc v36 (cha 49f9140 = Merge PR #31 TU-CHAY-7; MA-GIAM-1 #29, LUOI-4 #30). Nguồn
     ĐỌC NGUYÊN VĂN: viec/AUDIT-4/bao_cao.md mục AU4-21 (dưới bảng) — 19 tên, đường thật, số dòng lúc đó; KB20 (`BK-KB20-bo-kiem-lai-ma`)
     đi cùng P26d, KHÔNG làm ở đây → 18 tên. Công cụ: viec/AUDIT-4/boc.py (`--c2luoi <tên>`, `--audit2 <tên>`), viec/AUDIT-1/dot_bien.py,
     viec/AUDIT-2/dot_bien.py. LƯU Ý: AUDIT-4 đo dưới `c2luoi` = c2full + thu_P26c — các bài khác (thu_P20, thu_P26a, thu_GOI1…) CHƯA chạy
     với 14 C2F; MA-GIAM-1 vừa thêm ca discount-codes / signup-codes → nhiều tên có thể ĐÃ BẮT. Song song TU-CHAY-8 (tu_chay/,
     kiem_tra_truoc_khi_giao.js, thu_TOCDO1.js) — KHÔNG chung file. -->

**Chờ duyệt kế hoạch:** viết `viec/LUOI-5/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Mọi lệnh ghi đụng tiền / ví / điểm / gói / kho / mã giảm / chiết khấu mà nếu bị gỡ thì ít nhất một bài thử kêu — để AUDIT-5 đạt điểm
dừng. Chỉ thêm ca; KHÔNG sửa code quầy. Lộ code đang SAI → DỪNG, ghi `## Câu hỏi`.

## Nghiệm thu
- N0 Đo lại 18 tên trên HEAD dưới LƯỚI ĐỦ (mọi bài `cong_cu/thu_*.js` mà `npm test` + `--day-du` chạy, không chỉ c2luoi), kèm đối chứng: bảng
  tên · neo còn khớp? · BẮT/SỐNG dưới lưới đủ · bài bắt. Neo rữa vì MA-GIAM-1 (discount-codes-03/04, signup-codes-05/06) → dựng lại đột biến
  CÙNG Ý trong `viec/LUOI-5/dot_bien.py` trên code mới, ghi trước / sau. KHÔNG sửa `viec/AUDIT-*/`.
- N1 Mỗi tên còn SỐNG sau N0: một ca nhỏ nhất bắt nó, đỏ ĐÚNG ca (so câu lỗi, không phải sập). Số mong tự tính trên gốc VÀ trên đột biến,
  ghi phép tính. Gợi ý theo nhóm (máy chọn bài theo route đã mount): kho `damages-03` → thu_GOI1 / thu_P26c; gói `packages-01/03/04/06` →
  thu_GOI1 (ngưng gói thì quầy không bán được; kết thúc gói có hoàn thì gói hết `active`, lấy hàng 400); mã giảm / voucher → thu_P26a /
  thu_P20; điểm `rewards-02/03`, `redeem-bo-han-diem` (chế độ `quarter`), `nhandiem-he-so-mac-dinh` → thu_P26a / thu_P20; chiết khấu khách
  `customers-v2-04/05` → bài nào mount được `customers-v2` (thêm mount trong bài, không file mới); `goi-bo-kiem-con-lai` → thu_GOI1;
  `BK-KB16-duyet-bo-cong-don` (lớp 2 khoá hai lớp refunds.js) → thu_P26c: ca dựng sẵn trạng thái lớp 1 đã qua để chỉ lớp 2 chặn.
- N2 Tên nào chỉ bắt được bằng dữ liệu không đi được ở quầy: dựng bằng INSERT trực tiếp (khuôn B3p LUOI-3), ghi "đường quầy không đi được".
  Tên nào KHÔNG thể có hậu quả tiền (đo được, có lập luận) → `## Câu hỏi`, không tự hạ mức.
- N3 Đột biến cũ đang BẮT vẫn BẮT (P26c, GOI-1, GOI-2, SO-LUONG-1, BAN-HANG-1, LUOI-2, LUOI-3, LUOI-4, P20b, P20c, MA-GIAM-1; "không áp
  được" đã biết không tăng). `npm test`, `--day-du` xanh; mỗi bài < 80 % hạn (đo riêng 3 lần). Bảng cuối 18 dòng trong `trang_thai.md`.

## Bài thử đỏ
không — LUOI-5 chỉ thêm ca hồi quy cho code ĐANG ĐÚNG (0 dòng code quầy); đỏ chứng minh bằng đột biến AU4-21 (bang_chung_do.txt)

## Bài thử cũ sửa
- cong_cu/thu_P26c.js — LUOI-5 chỉ thêm ca hồi quy cho code ĐANG ĐÚNG nên xanh trên gốc; đỏ chứng minh bằng đột biến AU4-21
- cong_cu/thu_GOI1.js — LUOI-5 chỉ thêm ca hồi quy cho code ĐANG ĐÚNG nên xanh trên gốc; đỏ chứng minh bằng đột biến AU4-21
- cong_cu/thu_P26a.js — LUOI-5 chỉ thêm ca hồi quy cho code ĐANG ĐÚNG nên xanh trên gốc; đỏ chứng minh bằng đột biến AU4-21
- cong_cu/thu_P20.js — LUOI-5 chỉ thêm ca hồi quy cho code ĐANG ĐÚNG nên xanh trên gốc; đỏ chứng minh bằng đột biến AU4-21
- cong_cu/thu_P21.js — LUOI-5 chỉ thêm ca hồi quy cho code ĐANG ĐÚNG nên xanh trên gốc; đỏ chứng minh bằng đột biến AU4-21

## Phạm vi
- viec/LUOI-5/**
- cong_cu/thu_P26c.js
- cong_cu/thu_GOI1.js
- cong_cu/thu_P26a.js
- cong_cu/thu_P20.js
- cong_cu/thu_P21.js

## Ngân sách
~150–250 dòng thử (ít hơn nếu N0 thấy nhiều tên đã BẮT); 0 dòng code quầy. Kế hoạch ước lượng thời gian máy (đo).
**Phương án đơn giản nhất đã xét:** đo dưới lưới đủ TRƯỚC (có thể không phải viết gì cho nhiều tên); gom ca chung khi cùng route; không
bài thử mới, không bất biến mới, không sửa `viec/AUDIT-*/`.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- KHÔNG sửa `server/`, `client/` — lộ code SAI thì DỪNG, ghi `## Câu hỏi`. KB20 không làm (P26d).
- KHÔNG sửa `tu_chay/`, `kiem_tra_truoc_khi_giao.js`, `cong_cu/thu_TOCDO1.js`, `cong_cu/thu_gia_lap.js` (TU-CHAY-8 song song), `cong_cu/gia_lap/**`,
  `viec/AUDIT-*/**`, `.claude/`, `.github/`, sổ việc.
- Không nới hạn, không hạ ngưỡng, không bớt ca / `c.mong`. Chỉ push đúng `git push -u origin viec/LUOI-5`. Không đụng `main`, không merge, không tạo PR.
