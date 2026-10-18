# TU-CHAY-8 — Bộ khung 1.8.0: chia lượt thu_cong, máy tự chạy được cổng PR, người gác soi script được chạy, bộ kiểm đòi dòng tổng, bỏ ghim cứng phiên bản

<!-- Phiếu do chat soạn 17.10.2026. Nền: main sau sổ việc v36 (cha 49f9140 = Merge PR #31 TU-CHAY-7), bộ khung tu-chay 1.7.0. Nguồn:
     viec/TU-CHAY-7/trang_thai.md (thu_cong 77,9–96 s = 65–80 % hạn; máy mây không có hook pre-commit; cổng PR chế độ chạy CHƯA KIỂM;
     đề xuất "bộ kiểm đòi dòng tổng"); PR #31: cong-chay ĐỎ THẬT ([A11] thu_cong.js tự thử chính nó → xanh trên gốc; [A16] thiếu "SỐ CA" cho
     thu_cong_cu.js / thu_nguoi_gac.js vì đổi dòng ghim `tu-chay 1.6.0`) — chủ quán vá bằng 2 commit hồ sơ; viec/MA-GIAM-1/trang_thai.md (bị
     B-BIMAT-CHU chặn lệnh có `process.env.JWT_SECRET` của bài thử → máy viết script vào nháp rồi chạy file đó: kẽ hở); viec/LUOI-4 (hook chạy
     song song nền đột biến → thu_cong ETIMEDOUT oan). KHÔNG làm: mã thoát 2 = sập (đụng mọi thu_*.js, LUOI-5 đang giữ) → TU-CHAY-9.
     Song song LUOI-5 (cong_cu/thu_P*.js, thu_GOI1.js) — KHÔNG chung file. Sửa `tu_chay/` → chủ quán cài bằng khuôn cai_TUCHAY*.py. -->

**Chờ duyệt kế hoạch:** viết `viec/TU-CHAY-8/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Hook Replit và cổng PR không đỏ oan vì thu_cong sát hạn; máy tự phát hiện mọi lý do cổng PR đỏ TRƯỚC khi chủ quán tạo PR; người gác không
lách được bằng "viết ra file rồi chạy"; đổi phiên bản bộ khung không còn phải sửa tay hai bài thử. Không nới hạn nào.

## Nghiệm thu
- A1 Chia lượt `tu_chay/thu_cong.js`: chạy được theo phần (`--phan i/n` hoặc tương đương), `kiem_tra_truoc_khi_giao.js` chạy các phần SONG
  SONG, mỗi phần hạn 120 s như cũ; mỗi phần < 50 % hạn khi máy rảnh (đo 3 lần, ghi số); tổng phép KHÔNG giảm (bộ kiểm so tổng các phần = số
  phép khi chạy liền). Ca đỏ: bỏ một phần khỏi lời gọi → bộ kiểm kêu thiếu phép.
- A2 Máy chạy được `node tu_chay/cong.js chay` trên máy mây (tìm vì sao TU-CHAY-7 ghi "chỉ chạy được cổng tĩnh": npm ci, mạng, người gác…;
  sửa trong Phạm vi hoặc ghi `## Câu hỏi`). `tu_chay/skill_lam_viec.md` bước 11: ghi kết quả CỔNG CHẠY (dòng `✓ CỔNG CHẠY ĐẠT` hoặc từng ✗) trước
  `HEAD ĐÃ KIỂM`; bước 4: việc đổi bài thử của bộ khung tự thử chính nó → ghi trước vào `## Bài thử cũ sửa` hoặc bằng chứng SỐ CA cho MỌI bài
  đổi. Ca: thu_cong_cu.js có phép đọc skill thấy hai câu đó.
- A3 `tu_chay/nguoi_gac.js`: lệnh chạy một file script (`python3|node|bash|sh <file>`, file trong kho hoặc thư mục nháp, ≤ 200 KB) → đọc file
  đó và áp CÙNG các luật nội dung như lệnh viết thẳng (B-BIMAT-CHU, B-BIMAT-FILE, B-MANOI…). Không nới luật nào. Skill: sửa file có cụm bí mật
  của bài thử thì dùng công cụ Edit/Write, không dùng lệnh bash. Ca `thu_nguoi_gac.js`: script nháp chứa `JWT_SECRET` → chặn (gốc: qua);
  script nháp vô hại → qua; `node cong_cu/thu_P20.js` (bài thử thật trong kho có cụm đó) → xử lý theo kế hoạch, ghi rõ (không được làm hỏng
  `npm test`).
- A4 `kiem_tra_truoc_khi_giao.js` `chayBaiThat`: thoát 0 mà KHÔNG in dòng tổng (cùng 3 dạng `soCa` của cong.js) → FAIL "bài không in dòng tổng".
  Ca đỏ `thu_TOCDO1.js`: bài giả thoát 0 im lặng → FAIL (gốc: ✓).
- A5 Bỏ ghim cứng phiên bản: `tu_chay/thu_cong_cu.js`, `tu_chay/thu_nguoi_gac.js` đọc `tu_chay/PHIEN_BAN` thay vì chữ `tu-chay 1.x.0`; `PHIEN_BAN` →
  `tu-chay 1.8.0`; `THIET_KE.md` ghi A1–A5 ngắn. Lần đổi phiên bản sau chỉ sửa PHIEN_BAN.
- A6 `npm test`, `--day-du` xanh; CỔNG CHẠY cục bộ ĐẠT (A2) — nếu chỉ còn cảnh báo "khớp byte" chờ cài thì ghi rõ; `viec/TU-CHAY-8/dot_bien.py`
  mỗi chỗ vá ≥ 1 VS- + BV- (chỗ là chữ: chỉ BV-), có đối chứng; `bang_chung_do.txt` có SỐ CA cho MỌI bài thử đổi.

## Bài thử cũ sửa
- tu_chay/thu_cong.js — ca chia lượt / tự đếm phần thử chính thu_cong.js qua tiến trình con nên XANH cả trên code gốc; đỏ chứng minh bằng viec/TU-CHAY-8/dot_bien.py (chủ quán miễn 17.10, Q4)

## Phạm vi
- viec/TU-CHAY-8/**
- tu_chay/thu_cong.js
- tu_chay/thu_cong_cu.js
- tu_chay/thu_nguoi_gac.js
- tu_chay/nguoi_gac.js
- tu_chay/skill_lam_viec.md
- tu_chay/THIET_KE.md
- tu_chay/PHIEN_BAN
- kiem_tra_truoc_khi_giao.js
- cong_cu/thu_TOCDO1.js
- cong_cu/thu_gia_lap.js

## Ngân sách
~80–140 dòng code bộ khung + ~150 dòng thử. Kế hoạch ước lượng thời gian máy (đo).
**Phương án đơn giản nhất đã xét:** A1 chia theo khối có sẵn của thu_cong (không viết lại); A3 dùng lại hàm xét nội dung có sẵn của người gác cho
nội dung file; A5 một hàm đọc PHIEN_BAN. Không đổi mã thoát chung (TU-CHAY-9), không đưa boc.py vào khung.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `.claude/`, `.github/`, `tu_chay/cong.js`, `tu_chay/cai_dat.js`, `tu_chay/cau_hinh.json`, `tu_chay/lenh_ra_soat.md`, `tu_chay/MAU_PHIEU.md`,
  `server/`, `client/`, `cong_cu/thu_P*.js`, `cong_cu/thu_GOI1.js` (LUOI-5), `cong_cu/gia_lap/**`, `KHUON_LOI.md`, sổ việc.
- `cong_cu/thu_gia_lap.js` (chủ quán mở 17.10, Q1): CHỈ sửa các bài giả cho in dòng tổng + thêm ca "bài giả im lặng thoát 0 → FAIL"
  (ĐỎ trên code gốc, ghi SỐ CA); không đổi ca / neo nào khác.
- A3 KHÔNG được nới luật chặn nào của người gác, chỉ thêm chỗ soi. Không nới hạn 120 s / 110 s. Không bỏ bài thử, không bớt phép.
- Chỉ push đúng `git push -u origin viec/TU-CHAY-8`. Không đụng `main`, không merge, không tạo PR.
