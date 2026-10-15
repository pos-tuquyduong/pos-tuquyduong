# TU-CHAY-6 — Bộ khung: cổng không sập khi git hỏng, phép tĩnh mới, luật K1/K3/K4, skill bước 4, bài bộ khung chạy có điều kiện

<!-- Phiếu do chat soạn 15.10.2026. Nền: main sau sổ việc v32 (cha 142d5e5 = sổ v31 trên 31a5810 Merge PR #21 SO-LUONG-1), bộ khung
     tu-chay 1.5.0. Song song AUDIT-3 (chỉ viec/AUDIT-3/) và BAN-HANG-1 (quầy) — không chung file. Nguồn: sổ việc mục TU-CHAY-6 (1)–(7);
     viec/TOC-DO-1/trang_thai.md (A1 blob() null, Phát hiện 1–3, kịch bản git giả `gitgia/git` + `a1_gitgia.js` trong nháp của việc đó —
     phải DỰNG LẠI trong viec/TU-CHAY-6/ vì nháp không còn); viec/GOI-2/trang_thai.md Phát hiện (route GET có lệnh ghi, catch không qua
     loiGhi — packages.js:194 nay đã qua loiGhi); viec/SO-LUONG-1/trang_thai.md Bài học (cổng kiểm giá trị thô, agent soát không nộp);
     viec/LUOI-2 (máy hỏi sửa phiếu 2 lần vì không chạy cong.js tinh trước). Sửa `tu_chay/` → sau gộp chủ quán cài bằng khuôn
     khuon_cai.py (bản cài `.claude/` chép khớp byte) — máy KHÔNG sửa `.claude/`, `.github/`. -->

**Chờ duyệt kế hoạch:** viết `viec/TU-CHAY-6/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Bộ khung bền hơn sau 7 việc chạy thật: cổng không sập vì git, bộ kiểm thêm hai phép tĩnh rẻ, luật ghi đúng cơ chế đã trả giá, skill bớt
hỏi chủ quán oan. Không đổi hành vi nào ngoài các mục dưới; không nới hạn giờ. Mỗi mục là một đổi nhỏ có ca đỏ trên gốc.

## Nghiệm thu
- A1 `tu_chay/cong.js` `blob()` phân biệt "file không có" (`git cat-file` thoát 1) với "git không chạy được" (`status` null / `error`):
  trường hợp sau ném lỗi rõ ("git cat-file hỏng: <stderr>"), cổng in MỘT dòng ✗ nêu lý do và thoát ≠ 0, không "Received null"; `:268`,
  `:325`, `:327` không ghi `null`. Ca đỏ trong `tu_chay/thu_cong.js`: git giả tự giết ở `cat-file` (dựng lại từ TOC-DO-1 A1, tất định,
  không phụ thuộc tốc độ máy) → gốc in "Received null", sau vá in đúng dòng lý do.
- A2 `kiem_tra_truoc_khi_giao.js` thêm phép tĩnh (đọc `server/routes/*.js`, không chạy): (a) route `GET` có `run(` với `UPDATE|INSERT|DELETE`
  → CẢNH BÁO kèm file:dòng, trừ dòng có chú thích miễn `// GET-ghi: <lý do>` (packages.js:194 là ca thật — máy thêm chú thích miễn ở đó
  chỉ nếu Phạm vi cho; không thì ghi Phát hiện và phép báo đúng 1 cảnh báo đã biết); (b) route có lệnh ghi mà `catch` không gọi `loiGhi(`
  → CẢNH BÁO. Ca đỏ: bản sao route cố ý vi phạm mỗi loại → phép bắt; `server/` thật hiện tại → 0 cảnh báo mới ngoài ca (a) đã biết.
- A3 `tu_chay/skill_lam_viec.md` bước 4: TRƯỚC khi xin chủ quán sửa phiếu (thiếu `## Bài thử đỏ` / `## Bài thử cũ sửa`, Phạm vi), máy
  chạy `node tu_chay/cong.js tinh` trên nhánh và dẫn đúng dòng ✗ của cổng trong câu hỏi — một lần hỏi đủ cả A11 + A12 (LUOI-2 hỏi 2 lần).
  `tu_chay/lenh_ra_soat.md`: `SubagentHandback` là hành động CUỐI, bắt buộc; không nộp = chưa soát (SO-LUONG-1 lần 1).
- A4 `KHUON_LOI.md` (≤ 120 dòng, `khuon_loi_toi_da`): K3 thêm "bộ đột biến phải có ĐỐI CHỨNG + loại dòng ném / sập, bài thử sập ≠ BẮT"
  (TOC-DO-1 Phát hiện 3); K1 thêm "chú thích trong code cũng là khẳng định — sai thì sửa cùng dòng"; K4 thêm "cổng 'bắt buộc có X' phải
  kiểm CÙNG biểu thức với chỗ dùng X (SĐT đã chuẩn hoá, không phải giá trị thô — `" "` lọt, SO-LUONG-1)"; K2/K5: "ca phép tính: chọn số
  để trần / làm tròn không che lỗi (vd 0,002 chứ không phải 0,5 khi có trần)"; "số thời gian trong code quầy dùng `getNow` (Render UTC)".
  Mỗi câu ≤ 2 dòng, dẫn việc gốc; không thêm mục mới ngoài K1–K8.
- A5 `tu_chay/thu_nguoi_gac.js`, `tu_chay/thu_cong_cu.js`: đo riêng 3 lần trên HEAD; nếu bài nào ≥ 30 s thì đưa vào CÙNG điều kiện với
  `thu_cong.js` (`lyDoChayThuCong`), ca đỏ trong `cong_cu/thu_TOCDO1.js` như A3 của TOC-DO-1; nếu < 30 s thì KHÔNG đổi, ghi số đo.
- A6 `tu_chay/PHIEN_BAN` → `tu-chay 1.6.0`; `tu_chay/THIET_KE.md` ghi đúng cơ chế mới (A1, A2, A3) ngắn gọn. Bộ kiểm sẽ CẢNH BÁO "khớp
  từng byte với tu_chay/…" tới khi chủ quán cài — ghi rõ trong `trang_thai.md`, không được tự chép sang `.claude/`.
- A7 `npm test`, `node kiem_tra_truoc_khi_giao.js --day-du` xanh (chỉ các CẢNH BÁO "khớp byte" nêu ở A6); đột biến
  `viec/TU-CHAY-6/dot_bien.py` mỗi chỗ vá ≥ 1 VS- + BV-, có đối chứng (đúng K3 mới).

## Phạm vi
- viec/TU-CHAY-6/**
- tu_chay/cong.js
- tu_chay/thu_cong.js
- tu_chay/thu_cong_cu.js
- tu_chay/thu_nguoi_gac.js
- tu_chay/skill_lam_viec.md
- tu_chay/lenh_ra_soat.md
- tu_chay/THIET_KE.md
- tu_chay/PHIEN_BAN
- kiem_tra_truoc_khi_giao.js
- cong_cu/thu_TOCDO1.js
- KHUON_LOI.md

## Ngân sách
~60–120 dòng code bộ khung + ~120 dòng thử + ~15 dòng luật/skill. Kế hoạch ước lượng thời gian máy (đo, không đoán).
**Phương án đơn giản nhất đã xét:** chỉ sửa đúng 7 mục đã chốt, mỗi mục một đổi nhỏ; không chia `thu_cong.js` thành lượt song song (AU2-10)
trong việc này — nếu A5 đo thấy cần thì ghi Phát hiện; không viết công cụ mới.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `.claude/`, `.github/`, `tu_chay/nguoi_gac.js`, `tu_chay/cai_dat.js`, `tu_chay/cau_hinh.json`, `tu_chay/MAU_PHIEU.md`,
  `server/`, `client/`, `cong_cu/gia_lap/**`, `cong_cu/thu_gia_lap.js`, sổ việc. `packages.js:194` cần chú thích miễn → ghi Phát hiện,
  phép A2 chấp nhận đúng 1 cảnh báo đã biết.
- Không nới hạn 120 s. Không bỏ bớt bài thử nào. Chỉ push đúng `git push -u origin viec/TU-CHAY-6`. Không đụng `main`, không merge, không tạo PR.
