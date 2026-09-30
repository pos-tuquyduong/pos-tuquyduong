# TU-CHAY-2 — Giao việc trên máy mây

## Mục tiêu
Máy mây (claude.ai/code) tự làm trọn một việc: đọc phiếu, làm, thử, commit và
**đẩy đúng nhánh việc của mình**. Replit chỉ còn là phòng xem thử.

Phần A (push nhánh việc) và lớp 1 của D (bỏ deny push chung, thêm deny hẹp) ĐÃ XONG
ở commit TU-CHAY-2a: chat viết và chạy thử, chủ quán cài bằng `cai_dat.sh`, rồi kiểm
sống trên máy mây (push nhánh việc được, push `main` bị chặn).

Phần còn lại làm trên máy mây (claude.ai/code). Máy tự push nhánh việc bằng
`git push -u origin viec/TU-CHAY-2`. Không chạy Claude Code trên Replit.
Luật mới trong `tu_chay/` chỉ có hiệu lực sau khi chủ quán chạy
`bash tu_chay/cai_dat.sh` và commit `.claude/`.

Gồm 6 phần:
1. Người gác: push nhánh việc (A) — ĐÃ XONG ở 2a (luật GIT-PUSH); hoàn tác file (B) — CÒN LÀM.
2. `cai_dat.js`: bỏ deny push chung + thêm deny hẹp — ĐÃ XONG ở 2a; cài skill
   (và hook SessionStart nếu mục E chọn cách đó) — CÒN LÀM.
3. `CLAUDE.md` (G).
4. Mẫu phiếu và skill `/lam-viec` (H).
5. `tu_chay/cai_thu_vien.sh`: cài thư viện trên máy mây (E).
6. `tu_chay/xem_thu.sh <MÃ>`: chủ quán chạy ở Replit (F).

### Chủ quán đã chốt (trả lời kế hoạch lần 1, 30.09)
Phiên trước viết kế hoạch trên commit cũ nên không push được; các câu hỏi của nó đã trả lời ở đây:
1. Thêm `client/package-lock.json` vào Phạm vi để vá P6: sửa ĐÚNG MỘT dòng `resolved` của `jsqr`
   (`http://package-firewall.replit.local/npm/jsqr/-/jsqr-1.4.0.tgz` →
   `https://registry.npmjs.org/jsqr/-/jsqr-1.4.0.tgz`), giữ nguyên `integrity`.
2. Mục E dùng hook SessionStart (không dùng Setup script).
3. Hook gọi bản ĐÃ CÀI `.claude/tu_chay/cai_thu_vien.sh` (nguồn vẫn là `tu_chay/cai_thu_vien.sh`).
4. Hoàn tác file luật không có trong Phạm vi: CHO QUA (trả về bản commit là an toàn).
   File khung (`.claude/`, `.git/`), file cấm và phiếu vẫn CHẶN.
5. Hoàn tác file đã bị xoá khỏi đĩa: CHO QUA (cũng là hoàn tác; git tự báo lỗi nếu kho không có file đó).
6. Máy push nhánh việc: được, chỉ `git push -u origin viec/TU-CHAY-2` (xem mục Cấm).
7. Luật deny `*main*`, `*-d*`, `*-f*` có thể chặn oan mã việc chứa các chữ đó: mẫu phiếu dặn mã việc
   không chứa `main` và không có `-d`/`-f` (chữ thường, cả dạng hoa nếu Claude Code so không phân biệt hoa thường).

## Nghiệm thu

### A. Người gác — push (đang ở nhánh `viec/TU-CHAY-2`, có phiếu) — ĐÃ XONG ở 2a
Các ca dưới đây đã có trong `tu_chay/thu_nguoi_gac.js` (bằng chứng: `viec/TU-CHAY-2/bang_chung_do_2a.txt`).
Không làm lại, không nới; chỉ giữ xanh.

Cho qua:
- `git push origin viec/TU-CHAY-2`
- `git push -u origin viec/TU-CHAY-2`

Chặn:
- `git push`, `git push origin` (không ghi nhánh)
- `git push origin main`, `git push origin HEAD:main`, `git push origin viec/TU-CHAY-2:main`, `git push origin refs/heads/main`
- `git push origin viec/TU-CHAY-9` (khác nhánh đang đứng), `git push origin HEAD`, `git push origin +viec/TU-CHAY-2`, mọi refspec có `:`
- remote khác `origin`, hoặc URL viết thẳng
- `--force`, `-f`, `--force-with-lease`, `--force-if-includes`, `--delete`, `-d`, `--mirror`, `--all`, `--tags`, `--follow-tags`, `--no-verify`, `--repo`, `--receive-pack`, `--exec`, `-o`, `--push-option`, kể cả dạng viết tắt (`--forc`, `--del`)
- đứng ở `main` hoặc HEAD tách rời: mọi push bị chặn
- nhánh `viec/X` chưa có phiếu, hoặc phiếu thiếu `## Phạm vi`: chặn

### B. Người gác — hoàn tác file đã sửa nhầm (phạm vi KHÔNG có `server/index.js`)
Cho qua:
- `git checkout -- server/index.js`
- `git restore server/index.js`
- `git restore --staged server/index.js`
- file luật không có trong Phạm vi (vd `git restore CHECKLIST_CODE.md`)
- file đã bị xoá khỏi đĩa (vd `git restore server/index.js` khi file không còn)

Chặn:
- `git checkout main -- server/index.js`, `git checkout HEAD~1 -- server/index.js`
- `git restore --source=main server/index.js`, `git restore -s HEAD~1 server/index.js`
- `git restore .`, `git restore server/`, `git restore server/*.js`, `--pathspec-from-file`, `-p`
- file khung, file cấm, phiếu: `git restore .claude/settings.json`, `git restore TIEN_DO_POS.json`, `git checkout -- viec/TU-CHAY-2/phieu.md`

### C. Chung cho người gác
- Mọi ca mới ở B nằm trong `tu_chay/thu_nguoi_gac.js` và ĐỎ trên người gác
  hiện tại TRƯỚC khi sửa. Bằng chứng: `viec/TU-CHAY-2/bang_chung_do.txt`.
- Ca cũ vẫn xanh. Ca cũ nào đổi kết quả (vd "push nhánh việc bị chặn") thì ghi
  trong `ke_hoach.md` là ca nào và vì sao.
- Mã luật mới có trong `LUAT`; tắt từng mã thì bài thử đỏ.
- `(cd client && npm run build)` vẫn qua (đã có ca thử), không làm hỏng.

### D. Trình cài (kho tạm + remote bare tạm, như TU-CHAY-1)
- ĐÃ XONG ở 2a: deny không còn `Bash(git push *)` và `Bash(git push:*)`; có deny hẹp
  (DENY_MOI, DENY_BO trong `cai_dat.js`). Giữ nguyên, không nới.
- Skill cài vào `.claude/skills/lam-viec/SKILL.md`.
- Lần 2 không đổi gì. Các ca từ chối của TU-CHAY-1 vẫn đạt.
- `.git/hooks/pre-push` giữ nguyên, không đổi PRE_PUSH.
- Sau khi cài, nhóm T2 của bộ kiểm vẫn xanh.

### E. Cài thư viện trên máy mây
- Kế hoạch so hai cách: Setup script của môi trường, hoặc hook SessionStart chỉ
  chạy khi `CLAUDE_CODE_REMOTE=true` (hook thì do `cai_dat.js` ghép vào settings).
  Tra code.claude.com/docs/en/claude-code-on-the-web, ghi nguồn, ghi rõ chọn cách nào.
- Đã chốt: hook SessionStart (do `cai_dat.js` ghép vào settings), chỉ chạy khi `CLAUDE_CODE_REMOTE=true`,
  gọi `bash .claude/tu_chay/cai_thu_vien.sh`: chạy `npm ci` rồi `(cd client && npm ci)`. Lỗi thì báo rõ,
  không im lặng, không làm hỏng phiên.
- `client/package-lock.json`: chỉ đổi đúng dòng `resolved` của `jsqr` (xem "Chủ quán đã chốt" 1);
  `git diff` của file này đúng 1 dòng; `(cd client && npm ci)` chạy được trên máy mây;
  `node kiem_tra_truoc_khi_giao.js --day-du` xanh, `client/dist/` không đổi byte nào.
- Kiểm thật trên máy mây: sau khi cài, phiên mới chạy `npm test` không còn cảnh báo
  thiếu `client/node_modules`. Phần nào chỉ kiểm được sau khi chủ quán cài thì ghi vào
  mục CHƯA KIỂM của báo cáo.

### F. `xem_thu.sh` (thử trên kho tạm có remote bare)
- `bash tu_chay/xem_thu.sh TU-CHAY-9`: fetch, sang `viec/TU-CHAY-9` mới nhất,
  build client, chạy `node kiem_tra_truoc_khi_giao.js --day-du`, in "✓ … bấm Run".
- `bash tu_chay/xem_thu.sh main`: quay về `main` mới nhất.
- Từ chối, không đổi gì, khi:
  - có file đã theo dõi đang bị sửa (trừ `client/dist/`: trả về bản commit và báo);
  - nhánh không có trên origin;
  - nhánh ở máy lệch, không fast-forward được;
  - chạy trong Claude Code (có `CLAUDECODE`).
- File `??` chưa theo dõi (Replit đang có 8 file kế hoạch cũ) không cản và không bị đụng.
- Chỉ chạy `npm ci` khi lockfile đổi.
- Build xong mà `client/dist/` khác bản commit: báo "dist trong nhánh không khớp src",
  trả dist về bản commit, KHÔNG in "bấm Run".
- Không tự hỏng khi chính `xem_thu.sh` khác nhau giữa hai nhánh.
- Không push, không đụng `.env` và `.replit`, không gọi production.
- Bài thử nằm ở `tu_chay/thu_cong_cu.js` và được `npm test` chạy.

### G. `CLAUDE.md` (chỉ sửa đúng các chỗ này)
- §3: `(cd client && npm run build)` thay cho `cd client && npm run build && cd ..` (dạng cũ bị người gác chặn).
- §4 bước 5: bản lưu `.truoc_*` để trong thư mục nháp, không để trong kho.
- §4 bước 7: bỏ `ghi_tien_do`. Sổ việc do chủ quán ghi sau khi quầy chạy ổn (người gác đã chặn PY-SO).
- §4 bước 8: commit xong thì `git push -u origin viec/<MÃ>`.
- §6: "không git push" đổi thành "chỉ push nhánh việc của mình (`git push -u origin viec/<MÃ>`); không push nhánh khác, không đụng `main`".

### H. Mẫu phiếu và skill
- `tu_chay/MAU_PHIEU.md`: đủ mục của B5; dặn rằng file luật và file mới trong `tu_chay/` phải ghi ĐÚNG TÊN ở Phạm vi.
- `tu_chay/skill_lam_viec.md` (để phẳng, vì T2 đọc mọi mục trong `tu_chay/`, thư mục con sẽ báo lệch).
  Frontmatter đúng tài liệu skills (tra, ghi nguồn). Quy trình B6 viết cho máy mây:
  đọc phiếu → `ke_hoach.md` so A/B → bài thử đỏ trước → sửa → `npm test` →
  build nếu đụng `client/src/` → commit từng file → `/ra-soat` → push nhánh việc →
  báo cáo 6 mục trong `trang_thai.md`. Câu hỏi nghiệp vụ: ghi rồi dừng. Tối đa 3 vòng sửa.
  Không ghi sổ việc.

### I. Chung
- `npm test` xanh (có nhóm T và `thu_cong_cu.js`); `node kiem_tra_truoc_khi_giao.js --day-du` xanh.
- `tu_chay/THIET_KE.md`: thêm mục B14 ghi luật GIT-PUSH (2a) và luật hoàn tác, thay đổi lớp 1, cách cài
  thư viện đã chọn, và lỗ còn hở (lớp 1 không còn chặn push chung; `main` dựa vào
  người gác và luật bảo vệ trên GitHub).
- `tu_chay/PHIEN_BAN` = `tu-chay 1.2.0` (sửa luôn phép kiểm PHIEN_BAN trong `thu_nguoi_gac.js`).

### Kiểm sống sau khi chủ quán cài (máy KHÔNG làm, ghi để biết)
- Máy mây: `npm test` không còn cảnh báo thiếu `client/node_modules`.
- `git checkout -- server/index.js` được.
- (Push nhánh việc được / push `main` bị chặn: đã kiểm sống ở 2a.)

## Phạm vi
- tu_chay/nguoi_gac.js
- tu_chay/thu_nguoi_gac.js
- tu_chay/cai_dat.js
- tu_chay/THIET_KE.md
- tu_chay/PHIEN_BAN
- tu_chay/MAU_PHIEU.md
- tu_chay/skill_lam_viec.md
- tu_chay/cai_thu_vien.sh
- tu_chay/xem_thu.sh
- tu_chay/thu_cong_cu.js
- kiem_tra_truoc_khi_giao.js
- CLAUDE.md
- .gitignore
- client/package-lock.json
- viec/TU-CHAY-2/**

## Ngân sách
Khoảng 190 dòng code (chưa tính phần 2a đã xong):
- nguoi_gac.js +~40 (hoàn tác; push đã có ở 2a);
- cai_dat.js +~25 (skill, hook nếu chọn);
- xem_thu.sh ~80, cai_thu_vien.sh ~15;
- kiem_tra +~10.

Khoảng 210 dòng thử: thu_nguoi_gac.js +~80, thu_cong_cu.js ~130.

Tài liệu khoảng 200 dòng: skill ~90, mẫu phiếu ~40, CLAUDE.md ±10, THIET_KE +~50.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `.claude/`. Không chạy `cai_dat.sh`, `xem_thu.sh` trên kho thật (chỉ trên kho tạm trong nháp).
- Chỉ push đúng nhánh việc: `git push -u origin viec/TU-CHAY-2`. Không push nhánh khác, không đụng `main`, không merge, không tạo PR.
- Không đổi `.git/hooks/pre-push` và nội dung PRE_PUSH.
- Không nới luật nào khác của người gác ngoài B. Không nới GIT-PUSH. Không rút gọn người gác (D4, để sau).
- `client/package-lock.json`: chỉ sửa đúng một dòng `resolved` của `jsqr`, không sinh lại lockfile.
- Không chạy `patch_*.py`. Không sửa sổ việc.
