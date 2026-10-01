# TU-CHAY-3 — Cổng GitHub cho mỗi PR, tự kéo nhánh khi mở phiên, rút kinh nghiệm

<!-- Phiếu do chat soạn 01.10.2026, chủ quán đã chốt 1A + 2A. Nền: main 38840c9. -->

**Chờ duyệt kế hoạch:** viết `viec/TU-CHAY-3/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của
`/lam-viec`. Chưa viết bài thử, chưa sửa code cho tới khi chủ quán gửi lời duyệt.

## Mục tiêu
Sau việc này, mỗi PR vào `main` phải qua một **cổng kiểm tự động** trên GitHub. Cổng đỏ thì nút
Merge bị khoá. Cổng kiểm năm điều: bài thử xanh, mọi file đổi nằm trong phạm vi phiếu, phiếu và
`.claude/` không bị sửa lén, bài thử mới đỏ trên code cũ, và bản dựng giao diện khớp mã nguồn.
Kèm theo bốn việc nhỏ:
- máy mây tự kéo nhánh việc mới nhất khi mở phiên (hết lỗi "bản chụp cũ");
- agent soát `/ra-soat` nộp được báo cáo, và soát cả nhánh thay vì chỉ phần chưa commit;
- chặn `git add` dùng ký tự đại diện;
- bước 11 "rút kinh nghiệm" trong skill `/lam-viec`.

Vì sao làm bây giờ: tới nay chỉ có người gác (bên trong máy) và chat soát tay. Cổng là lớp thứ ba,
chạy **ngoài** máy và không phụ thuộc trí nhớ của ai. Phải có nó trước khi giao việc tiền
(P20b trở đi) cho máy tự chạy.

### Chủ quán đã chốt (01.10)
1. **1A — Agent soát nộp báo cáo qua công cụ của nó.** Người gác cho qua ĐÚNG TÊN công cụ mà agent
   phụ dùng để gửi báo cáo về phiên chính, và không cho thêm gì khác. Công cụ lạ khác vẫn bị CC-LA chặn.
2. **2A — Máy KHÔNG sửa `.github/`.** Máy viết nguồn cổng trong `tu_chay/`. `cai_dat.js` chép nó
   sang `.github/workflows/cong.yml`, và chủ quán cài bằng `bash tu_chay/cai_dat.sh` như mọi lần. Mã push
   của chủ quán đã có quyền Workflows. Thêm `.github/**` vào `file_cam` trong `cau_hinh.json`.
3. Luật cứng chỉ dành cho rủi ro không lùi được (main, tiền khách, bí mật, production). Còn lại là
   nguyên tắc kèm ví dụ — "đúng mà không cứng ngắc". Mỗi thứ thêm vào phải qua 3 câu: có cách ít dòng
   hơn không? khoá bằng phép kiểm được không? thay được thứ cũ để xoá không?

## Nghiệm thu

### A. Cổng — `tu_chay/cong.js` (thử trên kho tạm + remote bare, giả lập PR bằng base SHA, head SHA, tên nhánh)
Cổng là một script Node, không dùng thư viện ngoài, chỉ dùng `git` và `node`. Nhận vào: thư mục kho
của PR, SHA gốc (base), SHA đầu (head), tên nhánh. Thoát 0 = ĐẠT. Thoát khác 0 = ĐỎ, kèm danh sách lý do
viết bằng tiếng Việt dễ hiểu (vd. "file `server/index.js` không có trong Phạm vi của phiếu").

Cho qua:
- A1 PR đúng phạm vi, có bài thử mới: bài thử đỏ trên code gốc, xanh trên code PR; `npm test` và
  `node kiem_tra_truoc_khi_giao.js --day-du` xanh.
- A2 PR chỉ đổi `*.md` và `viec/<MÃ>/**`, không có bài thử mới.
- A3 PR có `.claude/**` và `.github/workflows/cong.yml` khớp từng byte với kết quả `cai_dat.js`
  (chạy trên `.claude/` của gốc cộng `tu_chay/` của PR). Đây là trường hợp chủ quán đã chạy `cai_dat.sh` trên nhánh việc.
- A4 Phiếu bị đổi, nhưng chỉ ở các commit có tiêu đề bắt đầu bằng `PHIEU: <MÃ>` (chủ quán sửa phiếu).
- A5 Phiếu có mục `## Bài thử đỏ` ghi `không — <lý do>`: PR đổi code mà không có bài thử mới vẫn ĐẠT,
  và cổng in lý do ra.

Phải chặn:
- A6 Có file đổi không nằm trong `## Phạm vi`; file luật trong phạm vi chỉ ghi bằng glob chung
  (cùng quy tắc với người gác).
- A7 Phiếu đổi ở một commit không có tiêu đề `PHIEU: <MÃ>`.
- A8 `.claude/**` khác kết quả `cai_dat.js`. Gồm cả trường hợp `tu_chay/` đã đổi mà chủ quán chưa chạy
  `cai_dat.sh` — báo đúng câu "chủ quán chạy bash tu_chay/cai_dat.sh trên nhánh việc".
- A9 `.github/**` đổi ở bất cứ chỗ nào khác `.github/workflows/cong.yml` đúng bản cài. Gồm cả
  `keep-alive.yml` và một workflow mới lạ.
- A10 Đổi file cấm: `TIEN_DO_*.json`, `.env*`, `.replit`.
- A11 Có bài thử mới hoặc bài thử bị sửa mà xanh trên code gốc (bài thử vô giá trị, K3).
- A12 Đổi code (không phải `*.md`, không phải `viec/**`, không phải file do trình cài sinh ra) mà
  không có bài thử nào đỏ trên code gốc, và phiếu không có mục miễn ở A5.
- A13 `npm test` đỏ; `--day-du` đỏ (gồm `client/dist/` không khớp `client/src/`).
- A14 Nhánh không có dạng `viec/<MÃ>`; không có `viec/<MÃ>/phieu.md`; phiếu thiếu `## Phạm vi`.
- A15 PR mở từ kho fork: ĐỎ. Không được "bỏ qua" (một job bị bỏ qua thì GitHub coi như đạt).

Chung cho A:
- "Bài thử" = file khớp `thu_muc_bai_thu` trong `cau_hinh.json` hoặc `tu_chay/thu_*.js`. Cách chạy bài thử
  mới trên code gốc (worktree tạm từ base, đặt bài thử mới vào, chạy bằng `node`): kế hoạch tự chọn và ghi rõ.
- Kiểm phạm vi phải **dùng lại** hàm khớp phạm vi của người gác, không viết lại lần hai (K4: hai chỗ
  cùng làm một việc thì sẽ lệch nhau).
- Tắt từng kiểm A6–A15 (đột biến) thì bài thử phải đỏ.

### B. File cổng — nguồn `tu_chay/cong_github.yml`, cài thành `.github/workflows/cong.yml`
- B1 Kích hoạt bằng `pull_request_target` vào `main`, các loại `opened`, `synchronize`, `reopened`.
  Cách này dùng **bản workflow trên `main`**, nên PR không tự sửa được cổng của chính nó. Kế hoạch tra
  docs.github.com, ghi nguồn, và xác nhận ba điều: check-run gắn vào commit đầu của PR; ruleset
  "Require status checks to pass" nhận được nó; job bị bỏ qua thì bị tính là gì.
- B2 Lấy **`cong.js` từ bản gốc** (`main`) để chạy trên code của PR, checkout đúng head SHA của PR.
  Không chạy `cong.js` lấy từ PR.
- B3 Quyền hẹp: `permissions: contents: read`; không có `secrets.` nào; `persist-credentials: false`;
  không dùng cache; mọi action ghim bằng SHA đầy đủ 40 ký tự, chỉ dùng action chính chủ (`actions/*`).
- B4 Một job tên `cong` luôn chạy và luôn báo kết quả. PR từ fork thì bước đầu thoát đỏ (A15).
- B5 `keep-alive.yml` không đổi một byte.
- B6 Có phép kiểm tĩnh trong bài thử: đọc `tu_chay/cong_github.yml` và kiểm B1–B4 (trigger, quyền,
  không secrets, checkout ref = head SHA, script lấy từ thư mục của base, action ghim SHA).
  Mỗi phép kiểm phải đỏ khi đột biến tương ứng.
- B7 Ghi vào `THIET_KE.md`: vì sao chọn `pull_request_target`, rủi ro còn lại (code PR chạy `npm ci`
  và `npm test` trên máy GitHub với quyền chỉ đọc, không có bí mật) và vì sao chấp nhận được.

### C. Mở phiên tự kéo nhánh (hook SessionStart)
- C1 Chỉ chạy khi `CLAUDE_CODE_REMOTE=true`. Replit và máy nhà: thoát ngay, không làm gì.
- C2 Chỉ khi nhánh đang đứng có dạng `viec/*`. Đứng ở `main`, HEAD tách rời, hay nhánh khác: không làm gì.
- C3 Chỉ chạy `git fetch origin <nhánh đang đứng>` rồi `git merge --ff-only`. Không lệnh git nào khác
  có ghi. Chạy **trước** `npm ci` (lockfile có thể vừa đổi).
- C4 Cây làm việc có file đã theo dõi đang sửa dở: không kéo. In cảnh báo rõ, cây giữ nguyên.
- C5 Không fast-forward được (hai bên lệch nhau): in cảnh báo rõ, có câu "máy DỪNG, báo chủ quán".
  Không đổi gì. Không merge thường, không reset.
- C6 Mất mạng hoặc fetch hỏng: cảnh báo, thoát 0. Hook không được làm hỏng phiên.
- C7 Kéo được: in commit trước → commit sau, để bước 1 của `/lam-viec` thấy.
- C8 Trình cài: bộ khung có đúng MỘT mục SessionStart của nó. Hook khác của chủ quán vẫn còn, **kể cả
  khi nằm chung một mục** với hook của bộ khung (sửa Phát hiện 3 của TU-CHAY-2). Chạy cài lần hai không đổi gì.
- C9 Thử trên kho tạm + remote bare: C1–C7 mỗi ca một bài, đỏ trước.
- Kế hoạch so hai cách: (a) thêm bước kéo vào đầu `cai_thu_vien.sh`; (b) script mới `tu_chay/mo_phien.sh`
  kéo rồi gọi `cai_thu_vien.sh`. Chọn cách ít dòng hơn mà vẫn đạt C1–C8.

### D. Người gác
- D1 (1A) Thêm vào danh sách cho qua ĐÚNG TÊN công cụ agent phụ dùng để nộp báo cáo. Kế hoạch tra
  tài liệu Claude Code (subagents, hooks) và ghi nguồn. Thêm nữa: chạy một `/ra-soat` thật trên một thay
  đổi nhỏ để xem người gác chặn tên gì (lý do CC-LA in tên công cụ). Chỉ cho qua tên tìm được, không
  cho qua theo mẫu chung.
- D2 Ca thử: tên đó qua được; một tên công cụ lạ vẫn bị CC-LA chặn; tắt luật thì bài thử đỏ.
- D3 GIT-ADD chặn ký tự đại diện của git trong tên file, kể cả trong nháy: `* ? [ ] \`.
  - Chặn: `git add '\.claude/x'`, `git add 'server/*.js'`, `git add 'a[b].js'`, `git add 'x?.js'`.
  - Cho qua: `git add server/index.js`, `git add "cong_cu/thu_P20.js"`, tên file có dấu tiếng Việt.
  - Ca đỏ trước trên người gác hiện tại.
- D4 `.github/**` vào `file_cam`. Hệ quả: `Edit .github/workflows/cong.yml` bị chặn, và
  `git restore .github/workflows/keep-alive.yml` bị chặn. Ca thử cho cả hai.
- D5 Ca cũ vẫn xanh. Ca cũ nào đổi kết quả thì ghi trong `ke_hoach.md`: ca nào, vì sao.

### E. `/ra-soat` thuộc bộ khung
- E1 Nguồn mới `tu_chay/lenh_ra_soat.md`. `cai_dat.js` cài nó thành `.claude/commands/ra-soat.md`.
  Bộ kiểm so từng byte bản cài với nguồn, giống T3.
- E2 Soát **cả nhánh**: `git diff main...HEAD` và danh sách file đổi. Bản hiện tại chỉ đưa "thay đổi chưa
  commit", trong khi skill commit ở bước 7, trước khi soát ở bước 8. Như vậy diff đưa cho người soát rỗng.
- E3 Dặn agent nộp báo cáo bằng công cụ ở D1. Mẫu báo cáo thêm dòng `BÀI HỌC:` để làm đầu vào cho bước 11.
- E4 Giữ nguyên 6 mục soát (K3, K4, K5, K1, đường tiền, P1) và câu "không được kết luận ĐẠT nếu còn
  mục nào chưa đọc được code thật".

### F. Bước 11 "rút kinh nghiệm" (`tu_chay/skill_lam_viec.md`, `CLAUDE.md` §7, `KHUON_LOI.md`)
- F1 Skill thêm **bước 11**, chạy sau bước 10:
  1. Gom sự cố của việc vừa làm: bài thử đỏ bất ngờ; lệnh bị người gác chặn (mã luật + vì sao);
     lỗi agent soát bắt; vượt ngân sách; phải hỏi/dừng; lệnh phải làm lại.
  2. Xếp mỗi bài học vào **đúng một** ngăn:
     - **KHOÁ** — thành bài thử, phép kiểm hoặc luật người gác, có ca đỏ trước. Nếu file nằm trong phạm vi
       thì làm luôn. Nếu ngoài phạm vi thì ghi đề xuất cụ thể: file nào, phép kiểm gì, ca đỏ nào.
     - **NGUYÊN TẮC** — một mục trong `KHUON_LOI.md` theo khuôn có sẵn ("Đã gây / Dấu hiệu / Chặn"),
       kèm ví dụ thật. Ngoài phạm vi thì ghi đề xuất.
     - **BỎ** — chỉ xảy ra một lần. Ghi một dòng lý do.
  3. Dọn: lời dặn nào trong `KHUON_LOI.md` hoặc `CLAUDE.md` đã có phép kiểm làm thay thì đề xuất xoá.
  4. Ghi vào mục `## Bài học` của `trang_thai.md` rồi in trong câu trả lời. Đề xuất ngoài phạm vi máy
     KHÔNG tự làm. Chat soát duyệt từng đề xuất, rồi gom vào việc kế tiếp có sửa `tu_chay/` hoặc một
     phiếu nhỏ `HOC-<n>`.
- F2 `CLAUDE.md` §7: báo cáo thành **7 mục**, thêm mục `BÀI HỌC:` (đếm theo ngăn KHOÁ / NGUYÊN TẮC / BỎ).
  Sửa cả tiêu đề "6 mục" và câu "bắt buộc đủ 6 mục". `grep` mọi chỗ khác còn ghi "6 mục"
  (skill, mẫu phiếu, `/ra-soat`) và sửa cho khớp (K4).
- F3 Ngân sách dòng `KHUON_LOI.md`: thêm khoá `khuon_loi_toi_da: 120` vào `cau_hinh.json`. Bộ kiểm đỏ khi
  `KHUON_LOI.md` vượt số dòng này (ca đỏ trước bằng file giả dài hơn). Vượt thì phải gộp hoặc xoá, không nới số.
- F4 **Mẫu đầu tiên:** chính việc này chạy bước 11 cho các bài học 28.09–01.10 dưới đây. Mỗi bài xếp
  một ngăn, có lý do. Bài nào được khoá ngay trong việc này thì ghi rõ khoá ở đâu.
  1. Máy mây mở phiên từ bản chụp cũ, không thấy commit mới (30.09, gặp 3 lần). Dự kiến: KHOÁ ở C.
  2. Git coi `\` là ký tự đại diện: `git restore '\.claude/x'` lọt người gác (30.09). Dự kiến: KHOÁ ở D3
     (cho `git add`; `restore` đã khoá ở TU-CHAY-2).
  3. Agent soát chạy xong mà báo cáo không về (TU-CHAY-2, lần 3 mới nhận). Dự kiến: KHOÁ ở D1/E3.
  4. `/ra-soat` đưa "thay đổi chưa commit" trong khi skill commit trước khi soát. Dự kiến: KHOÁ ở E2.
  5. Khoá không tự mở được từ bên trong: bản vá mở đường push (2a) phải do chat viết, chủ quán cài.
  6. Sau `git commit` phải thấy dòng `[<nhánh> <mã>]`. Thiếu thì push báo "Everything up-to-date" mà không đẩy gì.
  7. Bài thử TU-CHAY-2 vượt ngân sách khoảng 2 lần (`thu_cong_cu.js` 257 dòng, phiếu ước ~130).
  8. Đột biến "bỏ bọc hàm" trong `xem_thu.sh` không dựng được ca hỏng thật.
  9. Bài học phía chủ quán / chat: dán đoạn dài làm treo Shell Replit; GitHub treo "Checking for the
     ability to merge" (F5); `.git/index.lock` sót; đổi mã GitHub (tạo mã mới và thử trước, xoá mã cũ sau).
     Những bài này đã ghi ở Sổ Autonomous. Máy xét có bài nào thuộc về máy không; nếu không thì BỎ khỏi kho.
- F5 Mục mới trong `KHUON_LOI.md` dùng đúng khuôn có sẵn. Nếu không vào khuôn K1–K8 nào thì mở K9 trở đi.
  Phần "NĂM CÂU TỰ HỎI" chỉ sửa khi cần.

### G. Mẫu phiếu `tu_chay/MAU_PHIEU.md`
- G1 Thêm dòng mẫu "**Chờ duyệt kế hoạch:** …", giống đầu phiếu này. Ghi chú: bỏ dòng đó khi chủ quán
  muốn máy làm thẳng.
- G2 Thêm mục tuỳ chọn `## Bài thử đỏ`: chỉ ghi khi phiếu cho miễn bài thử đỏ, dạng `không — <lý do>` (A5).
- G3 Nhắc: file trong `.github/` máy không sửa được. Cổng do `cai_dat.sh` cài.

### H. Chung
- H1 `npm test` xanh (có bài thử mới của cổng). `node kiem_tra_truoc_khi_giao.js --day-du` xanh.
- H2 `tu_chay/THIET_KE.md` thêm mục B15: cổng (A, B, cách chọn trigger, rủi ro còn lại), hook kéo nhánh (C),
  1A, `.github/**` thành file cấm, bước 11, và **lỗ còn hở**:
  - chính PR của TU-CHAY-3 chưa được cổng soát, vì workflow chỉ có hiệu lực sau khi lên `main`;
  - chủ quán là admin, đi tắt được ruleset.
- H3 `tu_chay/PHIEN_BAN` = `tu-chay 1.3.0`. Sửa phép kiểm PHIEN_BAN trong bài thử cho khớp.
- H4 Trình cài: thêm `.github/workflows/cong.yml` và `.claude/commands/ra-soat.md` vào danh sách
  `git add` nó in ra. Chạy lần hai không đổi gì. Các ca từ chối của TU-CHAY-1 và TU-CHAY-2 vẫn đạt.
  `.git/hooks/pre-push` giữ nguyên.

### Kiểm sống sau khi chủ quán cài và gộp (máy KHÔNG làm, ghi để biết)
1. Chủ quán sửa ruleset `khoa-main`: tích **Require status checks to pass** → chọn check `cong`
   (nguồn GitHub Actions). Chat hướng dẫn từng bước.
2. PR thử `viec/THU-CONG`: có một file ngoài phạm vi → cổng ĐỎ, nút Merge bị khoá. Đóng PR, không gộp.
3. Hook kéo nhánh: chủ quán push một commit lên nhánh việc từ Replit, rồi mở phiên mới **không** sửa ô
   Setup script → phiên thấy commit mới.
4. `/ra-soat` trên máy mây nhận được báo cáo ngay lần đầu.

## Phạm vi
- tu_chay/cong.js
- tu_chay/cong_github.yml
- tu_chay/thu_cong.js
- tu_chay/lenh_ra_soat.md
- tu_chay/mo_phien.sh
- tu_chay/cai_thu_vien.sh
- tu_chay/nguoi_gac.js
- tu_chay/thu_nguoi_gac.js
- tu_chay/cai_dat.js
- tu_chay/thu_cong_cu.js
- tu_chay/skill_lam_viec.md
- tu_chay/MAU_PHIEU.md
- tu_chay/cau_hinh.json
- tu_chay/THIET_KE.md
- tu_chay/PHIEN_BAN
- kiem_tra_truoc_khi_giao.js
- CLAUDE.md
- KHUON_LOI.md
- viec/TU-CHAY-3/**

## Ngân sách
Khoảng 320 dòng code:
- `cong.js` ~150;
- `cong_github.yml` ~45;
- hook kéo nhánh ~30;
- `cai_dat.js` +~35;
- `nguoi_gac.js` +~10;
- `kiem_tra` +~20;
- `cau_hinh.json` +2.

Khoảng 400 dòng thử: `thu_cong.js` ~280, `thu_nguoi_gac.js` +~40, `thu_cong_cu.js` +~80.

Tài liệu khoảng 200 dòng: `lenh_ra_soat.md` ~70, skill +~35, `KHUON_LOI.md` ≤ 120 tổng, `CLAUDE.md` ±10,
`MAU_PHIEU.md` +~10, `THIET_KE.md` B15 ~60.

## Đổi cấu trúc DB
không

## Thư viện mới
không (cổng chỉ dùng Node có sẵn và git; trên GitHub chỉ dùng action chính chủ `actions/*`, ghim SHA)

## Cấm
- Không sửa `.claude/` và `.github/`. Không chạy `cai_dat.sh`, `xem_thu.sh` trên kho thật (chỉ trên kho tạm trong nháp).
- Chỉ push đúng nhánh việc: `git push -u origin viec/TU-CHAY-3`. Không push nhánh khác, không đụng `main`,
  không merge, không tạo PR.
- Không đổi `.git/hooks/pre-push` và nội dung PRE_PUSH. Không đổi `keep-alive.yml`.
- Không nới luật nào khác của người gác ngoài D1 (đúng tên công cụ nộp báo cáo). Không rút gọn người gác (D4 của Sổ, để sau).
- Hook kéo nhánh không được chạy lệnh git nào có ghi ngoài `fetch` + `merge --ff-only`.
- Không chạy `patch_*.py`. Không sửa sổ việc.
