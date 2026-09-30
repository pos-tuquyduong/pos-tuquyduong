# TU-CHAY-2 — trạng thái
Kiểm sống 2a: máy mây push nhánh việc.

## 30.09 — kế hoạch bản 3 (máy mây)
- Commit trên cùng lúc bắt đầu: `2989d48 PHIEU: TU-CHAY-2 (ban 3, chot 6 cau hoi)` — đúng.
- Đã viết `ke_hoach.md`: so A/B cho 8 phần, danh sách ca thử ánh xạ 1-1 với Nghiệm thu A–I.
- **CHƯA sửa code.** Đang DỪNG chờ chủ quán duyệt kế hoạch (2 điểm cần gật đầu ở cuối ke_hoach.md).

## 30.09 — chủ quán duyệt kế hoạch 0956768 (+ 4 yêu cầu a–d)
- Bước 1 XONG: ca B, D2/D2b, I3 vào `tu_chay/thu_nguoi_gac.js`; viết `tu_chay/thu_cong_cu.js` (F, E, H; mỗi ca tự đặt/xoá
  CLAUDE_CODE_REMOTE, CLAUDECODE). Chạy trên bản CHƯA vá → cả hai ĐỎ (`bang_chung_do.txt`: 53 + 23 chỗ hỏng).
  `npm test` ĐỎ ở T1 tới hết bước 2–4 — chủ ý (bài thử đi trước mã).
- Bước 2 XONG: `nguoi_gac.js` thêm `xetHoanTac` + mã `GIT-HOANTAC`, `G-HOANTAC`. `thu_nguoi_gac.js`: 728/728 ca đúng mã,
  đột biến hai mã mới đều đỏ khi tắt. Còn đỏ 5 phép của bước 3 (trình cài) và bước 6 (PHIEN_BAN).
- Bước 3 XONG: `cai_dat.js` (skill + SessionStart), `cai_thu_vien.sh`, `skill_lam_viec.md` (bước đầu: git log --oneline -3,
  ghi trang_thai, in trong câu trả lời đầu tiên), `MAU_PHIEU.md`. Bài cài đặt, E2–E5, H1–H3 xanh.
- Bước 4 XONG: `xem_thu.sh` (F1–F11 xanh); `kiem_tra` thêm T1b (`thu_cong_cu.js`) và T3 (so byte skill).
  Đột biến trong nháp: 7/8 đột biến xem_thu.sh và 5/5 của cai_thu_vien.sh làm bài thử đỏ. Hai ca F3, F3b đã làm chặt
  sau khi đột biến lộ ra chúng xanh oan. Đột biến "bỏ bọc hàm" vẫn xanh: git thay file bằng inode mới nên bash
  đọc bản cũ qua fd — không dựng được ca hỏng thật (ghi CHƯA KIỂM).
- Bước 5 XONG: `client/package-lock.json` đổi đúng 1 dòng `resolved` của jsqr (`git diff --numstat` = 1 1, integrity giữ).
  Trước vá: `npm ci` với lockfile cũ (chép vào nháp) → E405 GET package-firewall.replit.local…jsqr. Sau vá: `(cd client && npm ci)`
  thoát 0 trên máy mây; `(cd client && npm run build)` → `client/dist/` không đổi byte nào; `--day-du`: "dist đã commit KHỚP
  với src", hết cảnh báo thiếu client/node_modules. Còn đỏ đúng một phép: PHIEN_BAN (bước 6).
- Bước 6 XONG: CLAUDE.md (5 chỗ mục G), THIET_KE.md B14, PHIEN_BAN = tu-chay 1.2.0. `npm test` và `--day-du` xanh.
- /ra-soat (agent độc lập, lần 3 mới nhận được báo cáo — xem Phát hiện 1): KHÔNG ĐẠT, 1 lỗ thật + 1 câu sai.
  Lỗ: git coi `\` là ký tự glob → `git restore '\.claude/settings.json'` (và `\.git/config`, `phie\u.md`, `\.env`)
  lọt người gác, ra CHO. Đã thêm 7 ca → ĐỎ trên 2714b7c (`bang_chung_do.txt`) → vá `nguoi_gac.js` (chặn `\`) → 735/735.
  Câu sai B14 (glob, "bản commit" thay vì index) đã sửa. Vòng sửa: 1/3.

## Phát hiện (ngoài phạm vi, KHÔNG sửa)
1. **Người gác chặn cách agent phụ nộp báo cáo.** Agent soát của /ra-soat chạy xong nhưng báo cáo không về được
   (công cụ nộp báo cáo không có trong danh sách CC-DOC; `SendMessage` bị CC-LA). Lần 3 phải dặn agent ghi báo cáo
   ra file nháp. Muốn /ra-soat chạy trơn thì cần chủ quán quyết thêm công cụ nộp báo cáo vào danh sách cho qua.
2. **`git add` cũng nhận pathspec glob / `\`** (GIT-ADD không soi `* ? [ ] \`): `git add '\.claude/x'` stage được thay
   đổi CHƯA commit trên đĩa của file khung. Máy không sửa được đĩa `.claude/`, nên chỉ lộ khi chủ quán sửa dở mà chưa
   commit. Có từ TU-CHAY-1, không thuộc mục B → ghi để việc sau xét.
3. `cai_dat.js` bỏ NGUYÊN mục SessionStart nào chứa `cai_thu_vien.sh`; nếu chủ quán gộp hook khác vào cùng mục đó thì
   hook kia mất theo (ca thử chỉ có hook khác ở mục riêng).

## BÁO CÁO
VIỆC:        TU-CHAY-2 — Giao việc trên máy mây (phần B, D, E, F, G, H, I; A và lớp 1 của D đã xong ở 2a)
ĐÃ SỬA:      tu_chay/nguoi_gac.js:541-570 — xetHoanTac (git checkout -- / git restore), mã GIT-HOANTAC, G-HOANTAC;
               :168,181 — ghiDuoc(…, hoanTac) cho qua sau khung/cấm/phiếu/G2; :578 restore; :620 checkout --
             tu_chay/cai_dat.js — skill .claude/skills/lam-viec/SKILL.md + hook SessionStart startup|resume, timeout 600
             tu_chay/cai_thu_vien.sh (mới), tu_chay/xem_thu.sh (mới), tu_chay/skill_lam_viec.md (mới), tu_chay/MAU_PHIEU.md (mới)
             kiem_tra_truoc_khi_giao.js — T1b chạy thu_cong_cu.js, T3 so byte skill (chỉ THÊM)
             client/package-lock.json:2498 — jsqr resolved → registry.npmjs.org (1 dòng)
             CLAUDE.md:48,58,60,61,83-84 · tu_chay/THIET_KE.md B14 · tu_chay/PHIEN_BAN 1.2.0
BÀI THỬ:     chưa vá → ĐỎ: thu_nguoi_gac.js 53 chỗ, thu_cong_cu.js 23 chỗ; ca `\` 7 chỗ (bang_chung_do.txt);
             npm ci lockfile cũ → E405. Sau vá → XANH: thu_nguoi_gac 735/735 ca + đột biến (có GIT-HOANTAC, G-HOANTAC);
             thu_cong_cu 35/35; npm test PASS 51 FAIL 0; --day-du PASS 52 FAIL 0 (1 cảnh báo T2 — chờ cài).
             Đột biến trong nháp: xem_thu.sh 7/8 đỏ, cai_thu_vien.sh 5/5 đỏ.
ĐÃ RÀ K4:    grep "checkout|restore" trong nguoi_gac.js → 2 lối vào (:578 restore, :620 checkout --), cùng đi qua
             xetHoanTac (3 chỗ tên hàm). Ký tự pathspec: `* ? [ ] \` và `:` đầu — `\` do soát độc lập bắt, đã vá.
             cai_dat.js: mọi dung() trước khi ghi; skill vào điều kiện "không đổi gì" và in git add.
             Còn `git add` với `\`/glob (Phát hiện 2) — ngoài mục B, chưa xử lý.
CHƯA KIỂM:   - Hook SessionStart thật trên máy mây và "phiên mới npm test hết cảnh báo client/node_modules" (E9):
               chỉ kiểm được sau khi chủ quán chạy `bash tu_chay/cai_dat.sh`, commit .claude/, mở phiên MỚI.
             - `git checkout -- server/index.js` sống: người gác đang chạy là bản CŨ trong .claude/tu_chay/ (T2 lệch).
             - xem_thu.sh chỉ chạy trên kho tạm với npm GIẢ; chưa chạy trên Replit thật (npm ci / vite build thật).
             - F10 (xem_thu.sh không tự hỏng khi chính nó đổi): đột biến "bỏ bọc hàm" vẫn xanh — git thay file bằng
               inode mới nên không dựng được ca hỏng thật; bọc hàm là lớp phòng thêm.
             - Không soát độc lập vòng 2 sau bản vá `\` (chỉ chạy lại bài thử).
             - Ngân sách: thu_cong_cu.js 257 dòng (phiếu ~130, vượt ~2 lần — 12 kịch bản F cần dựng remote bare,
               nhánh, lockfile, dist; thêm E/H); xem_thu.sh 92 (~80); cai_thu_vien.sh 23 (~15). Code chính trong ngân sách.
GIT:         (xem dòng commit cuối trong câu trả lời)
