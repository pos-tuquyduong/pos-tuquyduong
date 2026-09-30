# TU-CHAY-2 — kế hoạch (bản 3, sau khi chủ quán chốt 7 câu)

Viết trên commit `2989d48 PHIEU: TU-CHAY-2 (ban 3, chot 6 cau hoi)`, nhánh `viec/TU-CHAY-2`.
Phần A và lớp 1 của D đã xong ở 2a — không đụng lại. **Chưa sửa dòng code nào; chờ chủ quán duyệt.**

## 0. Đã đọc trong lượt này (K1)

| Chỗ | Điều thấy |
|---|---|
| `tu_chay/nguoi_gac.js:107-108` | `GIT_CHO` KHÔNG có `restore` → mọi `git restore` hiện ra `GIT-LENH` |
| `tu_chay/nguoi_gac.js:587-591` | `checkout`: chỉ cho `-b viec/*` và `-- <file>`; file đi qua `ghiHet` → `ghiDuoc` (như sửa file) → ngoài Phạm vi ra `G5-NGOAIPV`, file luật ra `G-LUAT` |
| `tu_chay/nguoi_gac.js:166-184` | `ghiDuoc` — một hàm cho mọi đường ghi; thứ tự G-LIENKET → nháp → G0 → G1-KHUNG → G1-CAM → G1-PHIEU → G2 → G3 → G-LUAT → G4 → G5 |
| `tu_chay/nguoi_gac.js:125` | `thuc()` realpath phần tổ tiên đang có → file đã xoá vẫn tính được đường dẫn |
| `tu_chay/nguoi_gac.js` (grep `spawn`) | người gác **không** gọi tiến trình con nào |
| `tu_chay/cai_dat.js:63,83-86,122-126` | chép MỌI file `tu_chay/` trừ `cai_dat.*` sang `.claude/tu_chay/`; ghép hook PreToolUse; chưa có skill, chưa có SessionStart |
| `tu_chay/thu_nguoi_gac.js:190` | ca cũ `git restore server/a.js` → `GIT-LENH` |
| `tu_chay/thu_nguoi_gac.js:316` | ca cũ `git checkout -- server/b.js` → `G5-NGOAIPV` |
| `tu_chay/thu_nguoi_gac.js:309,345` | `git checkout -- viec/X/phieu.md` → `G1-PHIEU`; `git checkout HEAD -- server/a.js` → `GIT-CHECKOUT` |
| `tu_chay/thu_nguoi_gac.js:528` | phép `PHIEN_BAN = tu-chay 1.1.0` |
| `tu_chay/thu_nguoi_gac.js:434-453` | đột biến: tắt từng mã trong `LUAT` phải có ca đỏ |
| `kiem_tra_truoc_khi_giao.js:477-487,515,517-537` | `chayBaiThat()`; T1 chạy `thu_nguoi_gac.js`; T2 so byte `tu_chay/` ↔ `.claude/tu_chay/` |
| `kiem_tra_truoc_khi_giao.js:123,296` | thiếu `client/node_modules` → CẢNH BÁO bỏ qua cú pháp client + so bản dựng |
| `client/package-lock.json:2498` | dòng duy nhất trỏ `package-firewall.replit.local` (grep: 1 chỗ ở client, 0 ở gốc) |
| `CLAUDE.md:48,58,60,61,83` | 5 chỗ mục G phải sửa |
| `.claude/settings.json` | đã cài bản 2a: hook PreToolUse `*`, deny hẹp; chưa có SessionStart |
| máy mây hiện tại | `CLAUDE_CODE_REMOTE=true`; chưa có `node_modules` lẫn `client/node_modules` |

## 0b. Nguồn tài liệu đã tra (30.09.2026)

- **code.claude.com/docs/en/cloud-environments** — mục "Setup scripts vs. SessionStart hooks":
  setup script chạy *trước* Claude Code, bỏ qua khi có bản cache, chỉ ở máy mây, cấu hình trong
  hộp thoại môi trường (không nằm trong git). SessionStart: cấu hình trong `.claude/settings.json`,
  chạy mỗi lần startup/resume, cả máy mây lẫn máy nhà → "exit early unless `CLAUDE_CODE_REMOTE` is `true`".
  Ví dụ chính thức: matcher `startup|resume`, `bash "$CLAUDE_PROJECT_DIR"/scripts/install_pkgs.sh`.
  Mạng Trusted cho `registry.npmjs.org`. Hook SessionStart tự huỷ sau 600 s nếu không đặt `timeout`.
  Khuyên: "Keep install scripts fast by checking whether dependencies are already present".
- **code.claude.com/docs/en/hooks** (SessionStart): exit 0 → stdout vào ngữ cảnh Claude; exit 2 → stderr
  chỉ hiện cho người dùng; mã khác → như exit 0. "SessionStart hooks cannot block the session."
- **code.claude.com/docs/en/skills** (Frontmatter reference): skill dự án ở `.claude/skills/<tên>/SKILL.md`;
  trường `name`, `description` (nên có), `argument-hint`, `disable-model-invocation` (true = chỉ gọi tay
  bằng `/tên`), `allowed-tools`; đối số vào `$ARGUMENTS` (hoặc `$0`, `$1`).

---

## Phần 1 — Người gác: hoàn tác file (B)

### Phương án A — hàm `xetHoanTac` riêng, xét bằng chuỗi + hệ tệp (KHÔNG gọi git)
- Thêm `restore` vào nhánh riêng như `push` (không thêm vào `GIT_CHO`). `checkout -- …` và `restore …`
  cùng đi vào **một** hàm `xetHoanTac(lenh, r, nc, cwd)`:
  1. Tuỳ chọn: `checkout` chỉ dạng `-- <file…>` (giữ như cũ). `restore` chỉ nhận đúng nguyên chữ
     `--staged -S --worktree -W -q --quiet --` (danh sách CHO PHÉP, như `PUSH_CO`). Mọi tuỳ chọn khác —
     `--source/-s`, `-p/--patch`, `--pathspec-from-file`, `--ours/--theirs/-m`, `--overlay`, viết tắt, gộp
     (`-SW`) — ra **`GIT-HOANTAC`**. `checkout <nhánh/commit> -- f` vẫn `GIT-CHECKOUT` như cũ.
  2. Mỗi đường dẫn: phải viết thẳng (không biến, không glob, không bắt đầu `:`), không phải `.`/gốc kho,
     không kết thúc `/`, không phải thư mục đang có → `GIT-HOANTAC`. Thiếu đường dẫn → `GIT-HOANTAC`.
  3. Rồi gọi `ghiDuoc(p, nc, cwd, false, /*hoanTac*/ true)`: vẫn qua G-LIENKET, G0, G1-KHUNG, G1-CAM,
     G1-PHIEU, G2-VIEC, G2-PHIEU; tới chỗ G-LUAT thì **`G-HOANTAC`** cho qua (trả về bản commit là an
     toàn — chốt 4, 5). Tắt `G-HOANTAC` → rơi xuống G-LUAT/G5 → ca "cho qua" đỏ ⇒ đột biến bắt được.
- Mã mới trong `LUAT`: `GIT-HOANTAC` (dạng lệnh sai), `G-HOANTAC` (cho file ngoài phạm vi / file luật /
  file đã xoá). Giữ `GIT-CHECKOUT-FILE` (cổng "xét từng file", tắt thì phiếu lọt → đỏ).
- **Số file:** 1 (`nguoi_gac.js`) + bài thử. **Dòng:** ~35.
- **Rủi ro:** thư mục ĐÃ XOÁ khỏi đĩa (`git restore server/cu` khi `server/cu/` không còn) không phân biệt
  được với file đã xoá → git trả cả thư mục về bản commit. Hậu quả: file trong kho về đúng bản commit —
  loại B (hiện trong `git diff`, lùi được) và cùng tính chất "trả về bản commit là an toàn" của chốt 4.
  Nếu thư mục đó là `.claude`/`.git`/`viec/*/` thì đã bị G1 chặn theo tên từ trước.

### Phương án B — hỏi git: `git ls-files -z -- <p>` phải ra ĐÚNG một mục bằng `<p>`
- Bịt luôn lỗ thư mục đã xoá và file chưa theo dõi.
- **Nhưng:** người gác phải gọi tiến trình con lần đầu (thêm độ trễ mỗi lệnh, phải lọc biến `GIT_*` như bài
  cài đặt), và **mọi ca B trong `thu_nguoi_gac.js` phải dựng kho git THẬT có chỉ mục** — kho giả hiện chỉ
  có `.git/HEAD`. **Dòng:** ~45 người gác + ~40 dựng kho thử. Thêm một chỗ fail-closed mới (git lỗi → chặn).

### Chọn: **A** — ít dòng hơn, không đổi mô hình "người gác không chạy tiến trình", lỗ còn lại là loại B và đúng tinh thần chốt 4–5. Ghi lỗ vào B14.

### Ca cũ đổi kết quả (mục C)
| Ca | Cũ | Mới | Vì sao |
|---|---|---|---|
| `git checkout -- server/b.js` (b.js ngoài Phạm vi) | `G5-NGOAIPV` | `CHO` | mục B: hoàn tác file ngoài phạm vi được cho |
| `git restore server/a.js` | `GIT-LENH` | `CHO` | mục B: `git restore <file>` được cho |
| `PHIEN_BAN = tu-chay 1.1.0` | đạt | đổi thành `1.2.0` | mục I |
Mọi ca cũ khác giữ nguyên kết quả.

---

## Phần 2 — Trình cài: skill + hook SessionStart (D, E)

### Phương án A — ghép thẳng vào `cai_dat.js` hiện có
- Tính trong bộ nhớ như settings: `.claude/skills/lam-viec/SKILL.md` = byte của `tu_chay/skill_lam_viec.md`
  (đổi thì ghi, trùng thì thôi → lần 2 không đổi gì).
- `s.hooks.SessionStart`: lọc bỏ mục cũ chứa `.claude/tu_chay/cai_thu_vien.sh`, thêm đúng một mục
  `{ matcher: "startup|resume", hooks: [{ type: "command", command: 'bash "$CLAUDE_PROJECT_DIR/.claude/tu_chay/cai_thu_vien.sh"', timeout: 600 }] }`.
  Thêm vào phép kiểm cấu trúc trước khi ghi. In thêm `git add .claude/skills/lam-viec/SKILL.md`.
- Không đổi `DENY_MOI`, `DENY_BO`, `PRE_PUSH`.
- **Dòng:** ~20. **Rủi ro:** thấp; hook trỏ bản ĐÃ CÀI (chốt 3) nên máy mây không chạy được bản nguồn chưa duyệt.

### Phương án B — trình cài thứ hai `cai_skill.js`
- Tách riêng, nhưng phải lặp lại kiểm CLAUDECODE, kiểm `.git`, ghi an toàn, in lệnh add; ngoài Phạm vi
  (không có trong phiếu). **Loại.**

### Chọn: **A**.

---

## Phần 3 — `tu_chay/cai_thu_vien.sh` + vá lockfile (E)

### Phương án A — luôn `npm ci` cả hai chỗ mỗi lần hook chạy
- ~8 dòng. Nhưng mỗi lần resume cũng cài lại (chậm, tài liệu khuyên kiểm trước).

### Phương án B — chỉ cài khi thiếu hoặc lockfile đổi (dấu băm)
- `[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0`. Với từng thư mục (`.` rồi `client`):
  băm `package-lock.json`; nếu `node_modules/.tu_chay_lock` trùng băm → bỏ qua; không thì `npm ci`
  (`npm ci` xoá `node_modules` nên dấu cũ tự mất), đạt thì ghi dấu. Lỗi: in `✗ npm ci ở <thư mục> hỏng —
  <10 dòng cuối log>; npm test sẽ cảnh báo thiếu node_modules` ra **stdout** (vào ngữ cảnh Claude) và
  **stderr**; luôn `exit 0` (hook SessionStart không chặn được phiên; không để phiên hỏng).
- ~15 dòng. **Chọn: B** — đúng ngân sách, đúng khuyên của tài liệu.

### Lockfile (chốt 1)
- Sửa đúng dòng `client/package-lock.json:2498` `http://package-firewall.replit.local/npm/jsqr/-/jsqr-1.4.0.tgz`
  → `https://registry.npmjs.org/jsqr/-/jsqr-1.4.0.tgz`; giữ `integrity`. Dùng Python `replace` có kiểm
  "đúng 1 lần" (F8). Kiểm: `git diff --numstat client/package-lock.json` = `1 1`.
- Rồi trên máy mây này: `(cd client && npm ci)` và `npm ci` chạy thật; `(cd client && npm run build)` rồi
  `git status --porcelain client/dist` phải rỗng; `node kiem_tra_truoc_khi_giao.js --day-du` xanh.

---

## Phần 4 — `tu_chay/xem_thu.sh <MÃ>` (F)

### Phương án A — bash thuần, toàn bộ thân nằm trong hàm `chinh() { … }; chinh "$@"; exit $?`
- bash đọc xong CẢ hàm trước khi chạy → `git checkout` đổi chính file `xem_thu.sh` giữa chừng không làm hỏng
  (yêu cầu "không tự hỏng khi xem_thu.sh khác nhau giữa hai nhánh").
- Trình tự — **mọi phép từ chối chạy TRƯỚC mọi thay đổi**:
  1. Có `CLAUDECODE` (hoặc `CLAUDE_CODE_CHILD_SESSION`) → từ chối.
  2. MÃ phải khớp `^[A-Za-z0-9._-]+$`; `main` → nhánh `main`, còn lại → `viec/<MÃ>`.
  3. `git status --porcelain --untracked-files=no`: có dòng ngoài `client/dist/` → từ chối (liệt kê file).
     File `??` không xét, không đụng.
  4. `git fetch origin <nhánh>` hỏng → "nhánh không có trên origin", từ chối (fetch chỉ đổi ref từ xa).
  5. Nhánh đã có ở máy mà không phải tổ tiên của `origin/<nhánh>` (`git merge-base --is-ancestor`) → "lệch,
     không fast-forward được", từ chối.
  6. Lúc này mới đổi: `client/dist/` đang bị sửa → `git checkout -- client/dist` + xoá file chưa theo dõi
     trong `client/dist/` (`git clean -fdq -- client/dist`), báo ra.
  7. Băm hai lockfile; `git checkout <nhánh>` (hoặc `-b <nhánh> origin/<nhánh>` nếu chưa có);
     `git merge --ff-only origin/<nhánh>`.
  8. Lockfile đổi (hoặc chưa có `node_modules` tương ứng) → `npm ci` đúng chỗ đó.
  9. `(cd client && npm run build)`; `client/dist/` khác bản commit → in "dist trong nhánh không khớp src",
     trả dist về bản commit (bước 6), thoát 1, KHÔNG in "bấm Run".
  10. `node kiem_tra_truoc_khi_giao.js --day-du`; đỏ → thoát 1. Xanh → `✓ <nhánh> @ <commit> — bấm Run`.
- Không push, không đọc/ghi `.env`, `.replit`, không `curl`.
- ~80 dòng. **Rủi ro:** `git clean` chỉ trong `client/dist/` (thư mục sinh ra); ghi rõ trong lời báo.

### Phương án B — tự chép mình ra `/tmp` rồi `exec` bản chép
- Cũng bịt "tự hỏng", nhưng thêm file tạm + dọn tạm (~+8 dòng), và bản chép vẫn phải bash. **Loại** — A ngắn hơn.
- (Loại luôn cách `git reset --hard origin/<nhánh>`: xoá sửa đổi của chủ quán, trái yêu cầu "từ chối, không đổi gì".)

### Chọn: **A**.

---

## Phần 5 — `tu_chay/thu_cong_cu.js` (bài thử F + E)

### Phương án A — kho tạm thật + remote bare thật, `npm` GIẢ qua PATH
- `npm` giả (script bash trong thư mục tạm, đặt đầu PATH) ghi mỗi lần gọi vào nhật ký; `run build` chép
  `client/src/*` sang `client/dist/` (để dựng ca "dist không khớp" bằng cách sửa src không kèm dist).
  `kiem_tra_truoc_khi_giao.js` giả trong kho tạm: in `✓`, thoát 0 (hoặc 1 cho ca đỏ).
- Môi trường con: bỏ `CLAUDECODE`, `CLAUDE_CODE_*`, mọi `GIT_*` (pre-commit đặt `GIT_INDEX_FILE`).
- Chạy nhanh (không mạng, không npm thật), chạy được trong `npm test`. ~130 dòng.

### Phương án B — npm thật với package.json rỗng
- Chậm hơn, phụ thuộc mạng/npm cache; không đếm được "npm ci có chạy hay không" gọn bằng nhật ký. **Loại.**

### Chọn: **A**. `kiem_tra_truoc_khi_giao.js`: thêm `chayBaiThat('tu_chay/thu_cong_cu.js')` vào nhóm T,
và **T3** (CẢNH BÁO như T2): `.claude/skills/lam-viec/SKILL.md` khớp byte `tu_chay/skill_lam_viec.md` khi đã
cài. Chỉ THÊM phép kiểm, không sửa phép nào có sẵn (K8, CLAUDE.md §6).

---

## Phần 6 — `CLAUDE.md` (G)

Chỉ một phương án hợp lệ (phiếu đã ghi đúng chữ): sửa đúng 5 chỗ bằng Python `replace`, mỗi chỗ kiểm
"xuất hiện đúng 1 lần" (F8):
- `CLAUDE.md:48` → `(cd client && npm run build)            # BẮT BUỘC …`
- `CLAUDE.md:58` bước 5 → bản lưu `.truoc_*` để trong thư mục nháp, không để trong kho.
- `CLAUDE.md:60` bước 7 → bỏ `ghi_tien_do`; sổ việc do chủ quán ghi sau khi quầy chạy ổn.
- `CLAUDE.md:61` bước 8 → commit xong thì `git push -u origin viec/<MÃ>`.
- `CLAUDE.md:83` §6 → "chỉ push nhánh việc của mình (`git push -u origin viec/<MÃ>`); không push nhánh khác, không đụng `main`".
(Phương án "viết lại cả §3–§6" bị loại: phiếu ghi "chỉ sửa đúng các chỗ này".)

---

## Phần 7 — Mẫu phiếu + skill (H)

### Phương án A — skill tự đủ (~90 dòng), mẫu phiếu ~40 dòng
- `tu_chay/skill_lam_viec.md` — frontmatter:
  `name: lam-viec`, `description: …`, `argument-hint: "<MÃ> [tiep]"`, `disable-model-invocation: true`
  (chỉ chủ quán gọi `/lam-viec`, máy không tự nạp). Không đặt `allowed-tools` (auto mode + người gác lo).
  Thân: B6 viết cho máy mây — kiểm nhánh `viec/$0` + commit `PHIEU:` → đọc phiếu, CLAUDE.md, code →
  `ke_hoach.md` so A/B + ca thử 1-1 → (agent phụ soát 4 câu) → bài thử đỏ trước (lưu bằng chứng) → sửa →
  `npm test` → build nếu đụng `client/src/` → commit từng file → `/ra-soat` → `git push -u origin viec/<MÃ>`
  → báo cáo 6 mục vào `trang_thai.md`. Câu hỏi nghiệp vụ: ghi `## Câu hỏi` rồi dừng. Tối đa 3 vòng sửa
  (`so_vong_sua_toi_da`). Không ghi sổ việc. `tiep`: đọc `trang_thai.md` làm tiếp.
- `tu_chay/MAU_PHIEU.md`: đủ 7 mục B5; dặn file luật và file mới trong `tu_chay/` ghi ĐÚNG TÊN ở Phạm vi;
  dặn mã việc không chứa `main`, `-d`, `-f` (cả hoa/thường — chốt 7).

### Phương án B — skill ngắn, trỏ sang `THIET_KE.md` B6
- Ít dòng hơn (~30) nhưng B6 viết cho Replit (`soat.sh`, `cong.js`, "không đẩy") — sai với máy mây và
  chưa tồn tại. **Loại.**

### Chọn: **A**.

---

## Phần 8 — Tài liệu + phiên bản (I)
- `tu_chay/THIET_KE.md`: thêm **B14** — luật GIT-PUSH (2a); luật hoàn tác (`GIT-HOANTAC`, `G-HOANTAC`,
  lỗ thư mục đã xoá); lớp 1 đổi (bỏ deny push chung, deny hẹp); cài thư viện bằng SessionStart (nguồn ở
  0b); skill; lỗ còn hở (lớp 1 không còn chặn push chung; `main` dựa vào người gác + luật bảo vệ GitHub;
  deny `*-d*`/`*-f*`/`*main*` có thể chặn oan mã việc).
- `tu_chay/PHIEN_BAN` = `tu-chay 1.2.0`; sửa phép `thu_nguoi_gac.js:528` theo.

---

## Ngân sách ước lượng (so phiếu)
| Phần | Ước | Phiếu |
|---|---|---|
| nguoi_gac.js | ~35 | ~40 |
| cai_dat.js | ~20 | ~25 |
| cai_thu_vien.sh / xem_thu.sh | ~15 / ~80 | 15 / 80 |
| kiem_tra | ~10 | ~10 |
| thu_nguoi_gac.js / thu_cong_cu.js | ~70 / ~130 | 80 / 130 |
| tài liệu | ~200 | ~200 |

---

## Danh sách ca thử — ánh xạ 1-1 với mục Nghiệm thu

Ký hiệu: **TNG** = `tu_chay/thu_nguoi_gac.js` (kho giả, phiếu X: Phạm vi có `server/a.js`, KHÔNG có
`server/b.js` → `server/b.js` đóng vai `server/index.js` của phiếu), **TCC** = `tu_chay/thu_cong_cu.js`,
**TAY** = chạy tay trên máy mây, ghi kết quả vào `trang_thai.md`.

### A. Push — đã xong ở 2a
| Nghiệm thu | Ca |
|---|---|
| A (mọi dòng) | ca 2a trong TNG giữ nguyên, phải còn xanh; không thêm, không nới |

### B. Hoàn tác (TNG, kho `KHO`, nhánh `viec/X`)
| # | Nghiệm thu | Ca thử | Mong |
|---|---|---|---|
| B1 | `git checkout -- server/index.js` | `git checkout -- server/b.js` | CHO (cũ: G5-NGOAIPV) |
| B2 | `git restore server/index.js` | `git restore server/b.js` | CHO |
| B3 | `git restore --staged server/index.js` | `git restore --staged server/b.js` | CHO |
| B4 | file luật ngoài Phạm vi | `git restore CHECKLIST_CODE.md` | CHO (không có G-HOANTAC thì G-LUAT) |
| B5 | file đã xoá khỏi đĩa | `git restore server/xoa.js` (file không có trên đĩa) | CHO |
| B6 | `git checkout main -- …` | `git checkout main -- server/b.js` | GIT-CHECKOUT |
| B7 | `git checkout HEAD~1 -- …` | `git checkout HEAD~1 -- server/b.js` | GIT-CHECKOUT |
| B8 | `--source=main` | `git restore --source=main server/b.js` | GIT-HOANTAC |
| B9 | `-s HEAD~1` | `git restore -s HEAD~1 server/b.js` | GIT-HOANTAC |
| B10 | `git restore .` | `git restore .` | GIT-HOANTAC |
| B11 | `git restore server/` | `git restore server/` và `git restore server` (thư mục có thật) | GIT-HOANTAC |
| B12 | `git restore server/*.js` | `git restore server/*.js` | GIT-HOANTAC |
| B13 | `--pathspec-from-file` | `git restore --pathspec-from-file=x` | GIT-HOANTAC |
| B14 | `-p` | `git restore -p server/b.js` | GIT-HOANTAC |
| B15 | file khung | `git restore .claude/settings.json` | G1-KHUNG |
| B16 | file cấm | `git restore TIEN_DO_POS.json` | G1-CAM |
| B17 | phiếu | `git checkout -- viec/X/phieu.md` (ca cũ, giữ) | G1-PHIEU |
| B-song song (K4) | các dạng cùng khuôn | `git restore --stag server/b.js`, `git restore -SW server/b.js`, `git restore --ours server/b.js`, `git restore --overlay server/b.js`, `git restore` (trống), `git restore -- .`, `git restore ':!x'`, `git restore $F` | GIT-HOANTAC |
| B-song song | đường dẫn lách | `git restore server/ln_claude/settings.json` (symlink → .claude) | G1-KHUNG |
| B-song song | đứng ở main / HEAD tách rời | `git restore server/b.js` ở `KHO_MAIN`, `KHO_TACH` | G2-VIEC |
| B-song song | nhánh chưa có phiếu | `git restore server/b.js` ở `KHO_Y` | G2-PHIEU |
| B-song song | ngoài kho | `git restore ../ngoai/x` | G0-NGOAI |
| B-luồng hợp lệ (K5) | các dạng đúng phải KHÔNG bị chặn | `git restore -W server/b.js`, `git restore -q -- server/b.js`, `git checkout -- server/a.js server/b.js`, `cd server && git restore b.js` | CHO |

### C. Chung cho người gác
| # | Nghiệm thu | Cách kiểm |
|---|---|---|
| C1 | ca mới ở B ĐỎ trên người gác cũ | `node tu_chay/thu_nguoi_gac.js --nguoi-gac <bản 2989d48>/nguoi_gac.js --cai-dat <bản 2989d48>/cai_dat.js` → exit 1, lưu `viec/TU-CHAY-2/bang_chung_do.txt` (bản cũ chép vào nháp bằng `git show`) |
| C2 | ca cũ vẫn xanh; ca đổi kết quả ghi rõ | bảng "Ca cũ đổi kết quả" ở Phần 1 (2 ca + PHIEN_BAN) |
| C3 | mã mới có trong `LUAT`, tắt từng mã thì đỏ | phép đột biến có sẵn (`thu_nguoi_gac.js:452`) tự phủ `GIT-HOANTAC`, `G-HOANTAC` |
| C4 | `(cd client && npm run build)` qua | ca cũ TNG giữ CHO + TAY build thật (Phần 3) |

### D. Trình cài (TNG phần cài đặt, kho tạm + remote bare)
| # | Nghiệm thu | Ca thử |
|---|---|---|
| D1 | deny push đã xong ở 2a, không nới | ca 2a (DENY_BO vắng, DENY_MOI đủ) giữ xanh |
| D2 | skill cài vào `.claude/skills/lam-viec/SKILL.md` | sau cài lần 1: file tồn tại, khớp byte `tu_chay/skill_lam_viec.md`; lệnh in ra có `git add .claude/skills/lam-viec/SKILL.md` |
| D2b | hook SessionStart (E) | settings có đúng MỘT mục SessionStart `startup|resume`, lệnh đúng, `timeout` 600; giữ PostToolUse/Stop/PreToolUse |
| D3 | lần 2 không đổi gì; ca từ chối TU-CHAY-1 vẫn đạt | ca có sẵn "cài đặt lần 2 … không đổi byte nào" (ảnh chụp kho có thêm skill) + 4 ca `tuChoi` có sẵn |
| D4 | pre-push giữ nguyên | ca có sẵn pre-push + so `PRE_PUSH` không đổi (grep diff `cai_dat.js`) |
| D5 | sau cài, T2 xanh | TCC hoặc TNG: chạy phép so byte T2 trên kho tạm sau cài → khớp (kể cả file mới `cai_thu_vien.sh`, `xem_thu.sh`, `MAU_PHIEU.md`, `skill_lam_viec.md`, `thu_cong_cu.js`) |

### E. Cài thư viện
| # | Nghiệm thu | Ca thử |
|---|---|---|
| E1 | so hai cách, ghi nguồn, chọn SessionStart | mục 0b + Phần 3 của kế hoạch này; B14 |
| E2 | `CLAUDE_CODE_REMOTE` khác `true` → không làm gì | TCC: chạy `cai_thu_vien.sh` không có biến → exit 0, nhật ký npm giả rỗng |
| E3 | `true` → `npm ci` rồi `(cd client && npm ci)` | TCC: nhật ký npm giả có đúng 2 lần `ci`, đúng thứ tự, đúng thư mục |
| E4 | chạy lại khi đã cài, lockfile không đổi → bỏ qua | TCC: lần 2 nhật ký không thêm dòng |
| E5 | lỗi → báo rõ, không im lặng, không hỏng phiên | TCC: npm giả thoát 1 → exit 0, stdout có `✗ npm ci` + thư mục |
| E6 | lockfile đúng 1 dòng | TAY: `git diff --numstat client/package-lock.json` = `1	1`; dòng mới đúng URL registry, `integrity` giữ |
| E7 | `(cd client && npm ci)` chạy được trên máy mây | TAY trên phiên này |
| E8 | `--day-du` xanh, `client/dist/` không đổi byte | TAY: build rồi `git status --porcelain client/dist` rỗng; `node kiem_tra_truoc_khi_giao.js --day-du` |
| E9 | phiên mới `npm test` không cảnh báo thiếu `client/node_modules` | **CHƯA KIỂM được** — cần chủ quán cài rồi mở phiên mới (ghi vào báo cáo) |

### F. `xem_thu.sh` (TCC, kho tạm + remote bare, npm giả)
| # | Nghiệm thu | Ca thử |
|---|---|---|
| F1 | `xem_thu.sh TU-CHAY-9`: fetch, sang nhánh mới nhất, build, `--day-du`, in bấm Run | đẩy 2 commit lên `viec/TU-CHAY-9` ở remote; chạy → HEAD = `origin/viec/TU-CHAY-9`, nhật ký npm có `run build`, kiểm giả được gọi với `--day-du`, stdout có `bấm Run` |
| F2 | `xem_thu.sh main` quay về main mới nhất | sau F1, remote main có commit mới → chạy `main` → HEAD = `origin/main` |
| F3 | từ chối khi file theo dõi bị sửa | sửa `server/a.js` → exit ≠ 0, HEAD + nội dung không đổi (so ảnh chụp) |
| F3b | `client/dist/` bị sửa thì trả về bản commit và báo | sửa `client/dist/index.html` → chạy tiếp, file về bản commit, stdout nhắc dist |
| F4 | nhánh không có trên origin | `xem_thu.sh KHONG-CO` → exit ≠ 0, không đổi gì |
| F5 | nhánh ở máy lệch, không ff được | commit riêng lên `viec/TU-CHAY-9` ở máy → exit ≠ 0, không đổi gì |
| F6 | chạy trong Claude Code | env có `CLAUDECODE=1` → exit ≠ 0, không đổi gì, không gọi git fetch |
| F7 | file `??` không cản, không bị đụng | tạo 8 file `ke_hoach_cu_*.md` chưa theo dõi → F1 vẫn đạt, 8 file còn nguyên byte |
| F8 | chỉ `npm ci` khi lockfile đổi | chạy F1 hai lần không đổi lockfile → lần 2 không có `ci`; nhánh đổi `client/package-lock.json` → có `ci` trong `client` |
| F9 | dist không khớp src → báo, trả dist, không in bấm Run | nhánh sửa `client/src/x` không kèm dist → exit ≠ 0, stdout có "dist trong nhánh không khớp src", không có "bấm Run", `git status --porcelain client/dist` rỗng |
| F10 | không tự hỏng khi `xem_thu.sh` khác giữa hai nhánh | nhánh đích có `xem_thu.sh` khác hẳn (in `SAI`) và dài hơn/ngắn hơn → chạy bản của kho vẫn đạt, không in `SAI` |
| F11 | không push, không `.env`/`.replit`, không production | TCC grep nguồn `xem_thu.sh`: không có `push`, `.env`, `.replit`, `curl`, tên miền production; remote bare không đổi ref sau mọi ca |
| F12 | bài thử nằm ở `thu_cong_cu.js`, `npm test` chạy | `kiem_tra_truoc_khi_giao.js` có `chayBaiThat('tu_chay/thu_cong_cu.js')`; `npm test` in dòng đó |
| F-K3 | bài thử đỏ trước | chạy TCC khi CHƯA có `xem_thu.sh`/`cai_thu_vien.sh` → đỏ; lưu vào `bang_chung_do.txt` |

### G. `CLAUDE.md`
| # | Nghiệm thu | Cách kiểm |
|---|---|---|
| G1–G5 | 5 chỗ sửa | TAY: `git diff CLAUDE.md` đúng 5 hunk tại dòng 48, 58, 60, 61, 83; `grep -n "cd client && npm run build && cd .." CLAUDE.md` rỗng; `grep -n ghi_tien_do CLAUDE.md` rỗng |

### H. Mẫu phiếu và skill (TCC)
| # | Nghiệm thu | Ca thử |
|---|---|---|
| H1 | `MAU_PHIEU.md` đủ mục B5 + dặn ĐÚNG TÊN | TCC: có đủ 7 tiêu đề `## Mục tiêu … ## Cấm`; có chữ "ĐÚNG TÊN"; có dặn mã việc không chứa `main`/`-d`/`-f` |
| H2 | skill phẳng, frontmatter đúng tài liệu | TCC: `skill_lam_viec.md` mở bằng `---`, có `name: lam-viec`, `description:`, `argument-hint:`, `disable-model-invocation: true`; T2 không báo lệch |
| H3 | quy trình B6 cho máy mây | TCC: thân có theo thứ tự các mốc `ke_hoach.md`, `đỏ`, `npm test`, `npm run build`, `/ra-soat`, `git push -u origin viec/`, `trang_thai.md`; có "tối đa 3"; KHÔNG có `ghi_tien_do`, `git add -A`, `--no-verify` |

### I. Chung
| # | Nghiệm thu | Cách kiểm |
|---|---|---|
| I1 | `npm test` xanh (có T + `thu_cong_cu.js`), `--day-du` xanh | TAY, dán kết quả vào `trang_thai.md` |
| I2 | B14 trong THIET_KE.md | TAY: `grep -n "## B14" tu_chay/THIET_KE.md`; đủ 5 ý (GIT-PUSH, hoàn tác, lớp 1, cài thư viện, lỗ hở) |
| I3 | `PHIEN_BAN` = `tu-chay 1.2.0` | TNG: phép PHIEN_BAN sửa thành 1.2.0 (đỏ trước khi đổi file PHIEN_BAN) |

### Kiểm sống sau khi chủ quán cài — máy KHÔNG làm
- Phiên mới trên máy mây: `npm test` không còn cảnh báo thiếu `client/node_modules` (E9).
- `git checkout -- server/index.js` được (người gác đã cài là bản mới).

## Thứ tự làm (sau khi duyệt)
1. Viết ca B + D2/D2b + I3 vào TNG, TCC khung → chạy trên bản cũ → ĐỎ → lưu `bang_chung_do.txt`, commit.
2. `nguoi_gac.js` (Phần 1) → TNG xanh. Commit.
3. `cai_dat.js`, `cai_thu_vien.sh`, `skill_lam_viec.md`, `MAU_PHIEU.md` → TNG/TCC xanh. Commit từng file.
4. `xem_thu.sh` → TCC xanh; `kiem_tra` thêm T1b/T3. Commit.
5. Lockfile + `npm ci` thật + build + `--day-du`. Commit.
6. `CLAUDE.md`, `THIET_KE.md` B14, `PHIEN_BAN`. `npm test` xanh. `/ra-soat`. Push nhánh việc. Báo cáo 6 mục.

## Câu hỏi còn mở cho chủ quán
Không có câu hỏi nghiệp vụ mới. Hai lựa chọn cần chủ quán gật đầu khi duyệt:
1. Phần 1 chọn **A**: lỗ "thư mục đã xoá khỏi đĩa được trả về cả thư mục" chấp nhận là loại B (ghi B14).
2. Phần 4: `xem_thu.sh` dùng `git clean -fdq -- client/dist` để bỏ file sinh ra khi dist không khớp
   (chỉ trong `client/dist/`).
