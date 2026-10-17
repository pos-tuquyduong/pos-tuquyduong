# TU-CHAY-7 — Bộ khung: cảnh báo sớm bài chạy sát hạn, dọn thư mục tạm khi bị giết, phép tĩnh chú thích số dòng cứng, rút gọn KHUON_LOI

<!-- Phiếu do chat soạn 16.10.2026. Nền: main sau sổ việc v35 (cha ddc42d2 = Merge PR #28 AUDIT-4), bộ khung tu-chay 1.6.0. Nguồn:
     viec/AUDIT-4/bao_cao.md AU4-12 (kiem_tra:616 chạy thu_cong không truyền canhGan; A5 máy bận 103 s = 86 % hạn), AU4-13 (thu_cong.js:24 TAM
     chỉ dọn ở :723; thu_gia_lap.js SIGTERM sót /tmp/thu_gl_*), AU4-17…19 (luật sập boc.py — KHÔNG đưa boc.py vào khung; bài học: mã thoát
     2 = sập → việc sau TU-CHAY-8 vì đụng mọi thu_*.js); viec/BAN-HANG-1/trang_thai.md đề xuất (phép tĩnh chú thích `(:NNNN)`; K3 ngưỡng
     tất định so bằng; K4 một vị từ cho kiểm và làm); viec/TU-CHAY-6 Q5 (chia lượt thu_cong — chưa làm, ghi). KHUON_LOI.md 116/120 dòng.
     Song song: LUOI-4 (thu_P26c, thu_GOI1) và MA-GIAM-1 (routes, thu_P26a, thu_P20) — KHÔNG chung file. Sửa `tu_chay/` → chủ quán cài
     bằng khuôn khuon_cai.py sau; máy KHÔNG sửa `.claude/`, `.github/`. -->

**Chờ duyệt kế hoạch:** viết `viec/TU-CHAY-7/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Bộ kiểm báo trước khi một bài sắp vượt hạn (thay vì đỏ bất ngờ trên Replit lúc máy bận); không để lại thư mục tạm khi bị ngắt; chú thích
số dòng cứng bị phát hiện; KHUON_LOI gọn lại còn chỗ ghi bài học mới. Mỗi mục một đổi nhỏ có ca đỏ trên gốc. Không nới hạn.

## Nghiệm thu
- A1 `kiem_tra_truoc_khi_giao.js:616` gọi `chayBaiThat('tu_chay/thu_cong.js', …, canhGan = true)` (cũng cho `thu_TOCDO1.js` nếu > 30 s) → xanh mà
  > 80 % hạn → CẢNH BÁO nêu số giây. Ca đỏ `cong_cu/thu_TOCDO1.js`: bài giả chạy 85 % hạn → có dòng cảnh báo (gốc: không).
- A2 `tu_chay/thu_cong.js` và `cong_cu/thu_gia_lap.js`: dọn thư mục tạm ở `process.on('exit')` + bắt SIGINT / SIGTERM (khuôn
  `viec/AUDIT-4/don_rong.js`). Ca đỏ `tu_chay/thu_cong.js` (tự thử chính nó qua tiến trình con) + `thu_gia_lap`: SIGTERM giữa bài → 0 thư
  mục `/tmp/thu_cong_*` / `/tmp/thu_gl_*` sót (gốc: sót).
- A3 `kiem_tra_truoc_khi_giao.js` phép tĩnh mới: chú thích trong `server/**`, `client/src/**`, `cong_cu/thu_*.js`, `tu_chay/*.js` có dạng
  `(:NNNN)` / `:NNNN–NNNN` trỏ số dòng cứng → CẢNH BÁO liệt kê file:dòng, bánh cóc ngưỡng = số hiện có (chỉ kêu khi mọc; `kiem_tra` nhắc hạ khi
  giảm). Ca đỏ: bản sao có thêm 1 chú thích `(:1234)` → kêu. Không FAIL.
- A4 `KHUON_LOI.md` ≤ 100 dòng (từ 116): gộp câu trùng / lời dặn mà người gác hoặc bộ kiểm ĐÃ cưỡng chế bằng máy (dẫn tên phép / mã chặn
  khi bỏ), KHÔNG mất nghĩa nào; thêm vào K3: "ngưỡng về hằng số tất định thì so bằng, không so một chiều"; K4: "một vị từ cho cả 'có gì để
  làm' và 'làm'"; K3: "bộ đột biến phải chạy được từng tên + đối chứng + luật sập rõ (bài sập ≠ BẮT) — không dò chuỗi". Ca: `kiem_tra`
  `khuon_loi_toi_da` vẫn qua; trang_thai.md liệt kê từng dòng bỏ và lý do.
- A5 `tu_chay/PHIEN_BAN` → `tu-chay 1.7.0`; `THIET_KE.md` ghi A1–A3 ngắn. Bộ kiểm sẽ CẢNH BÁO "khớp byte" tới khi chủ quán cài — ghi rõ,
  không tự chép sang `.claude/`.
- A6 `npm test`, `--day-du` xanh (chỉ cảnh báo "khớp byte" nêu ở A5 + cảnh báo có sẵn); `viec/TU-CHAY-7/dot_bien.py` mỗi chỗ vá ≥ 1 VS- +
  BV- (chỗ là chữ: chỉ BV-), có đối chứng.

## Bài thử cũ sửa
- tu_chay/thu_cong.js — ca DON tự thử chính thu_cong.js qua tiến trình con nên XANH cả trên code gốc; đỏ chứng minh bằng viec/TU-CHAY-7/dot_bien.py (chủ quán miễn 17.10)

## Phạm vi
- viec/TU-CHAY-7/**
- tu_chay/thu_cong.js
- tu_chay/THIET_KE.md
- tu_chay/PHIEN_BAN
- tu_chay/thu_cong_cu.js
- tu_chay/thu_nguoi_gac.js
- kiem_tra_truoc_khi_giao.js
- cong_cu/thu_TOCDO1.js
- cong_cu/thu_gia_lap.js
- KHUON_LOI.md

## Ngân sách
~50–90 dòng code bộ khung + ~80 dòng thử; KHUON_LOI −16 dòng ròng. Kế hoạch ước lượng thời gian máy (đo).
**Phương án đơn giản nhất đã xét:** đúng 5 mục; KHÔNG đổi quy ước mã thoát (TU-CHAY-8, đụng mọi thu_*), KHÔNG chia lượt thu_cong
(ghi phát hiện nếu A1 đo thấy cần), KHÔNG đưa boc.py vào khung.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `.claude/`, `.github/`, `tu_chay/nguoi_gac.js`, `tu_chay/cong.js`, `tu_chay/cai_dat.js`, `tu_chay/cau_hinh.json`,
  `tu_chay/skill_lam_viec.md`, `tu_chay/lenh_ra_soat.md`, `tu_chay/MAU_PHIEU.md`, `server/`, `client/`, `cong_cu/gia_lap/**`,
  `cong_cu/thu_P26c.js`, `thu_GOI1.js`, `thu_P26a.js`, `thu_P20.js`, `viec/AUDIT-4/**`, sổ việc.
- `tu_chay/thu_cong_cu.js`, `tu_chay/thu_nguoi_gac.js`: CHỈ sửa dòng ghim PHIEN_BAN `tu-chay 1.6.0` → `1.7.0` (chủ quán mở Phạm vi 16.10,
  Câu hỏi 1 — thu_cong_cu.js:459, thu_nguoi_gac.js:709); không đổi gì khác trong hai file này.
- Không nới hạn 120 s / 110 s. Không bỏ bài thử nào. Chỉ push đúng `git push -u origin viec/TU-CHAY-7`. Không đụng `main`, không merge, không tạo PR.
