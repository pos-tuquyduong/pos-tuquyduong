# TU-CHAY-1 — Người gác (POS) · kế hoạch (lập lại 28.09.2026 theo các điểm ĐÃ CHỐT [A]–[E])

## Bối cảnh

Chủ quán muốn Claude Code tự chạy được (THIET_KE_TU_CHAY v1.1). Muốn vậy thì phải có
**lớp 2: người gác** (hook PreToolUse, "chỉ cho những gì cần", fail-closed) và
**lớp 1** (deny trong settings) trước đã. Việc này vẫn làm ở chế độ tay. Agent
không được sửa `.claude/`, nên toàn bộ mã nguồn nằm ở `tu_chay/` tại gốc kho. Chủ quán
tự chạy `tu_chay/cai_dat.sh` trong Shell để chép vào `.claude/tu_chay/` và ghép settings.

Hiện trạng đã đọc trong lượt này:
- `main` = `origin/main` = `ae36d7b`. Chưa có nhánh `viec/TU-CHAY-1`. Không có `core.hooksPath`. `.git/hooks/` chỉ có `pre-commit` (gọi `kiem_tra_truoc_khi_giao.js`), **chưa có pre-push**.
- `.claude/settings.json` đang có: `ask` (8 luật, trong đó có `Write(...)`), `deny` (12 luật), `defaultMode: "default"`, `disableAutoMode: "disable"` **ở cấp gốc**, hook PostToolUse (`nhac_sau_sua.cjs`), hook Stop (`kiem_truoc_khi_dung.cjs`, chạy bộ kiểm), `model`, `env`.
- `kiem_tra_truoc_khi_giao.js:477-486`: vòng E11 chạy thật `cong_cu/thu_P20.js`, `thu_P21.js` bằng `spawnSync` (timeout 120 s). Có sẵn các hàm `chac`/`canhBao`/`nhom` (dòng 33-52).
- `.gitignore` đã có `*.truoc_*` (nên `settings.json.truoc_TUCHAY` sẽ tự bị bỏ qua), nhưng **chưa có** dòng cho nhật ký người gác.
- `TIEN_DO_POS.json` **chưa có mục TU-CHAY-1**.
- Theo sửa (b): việc này KHÔNG thêm mục TU-CHAY-1 vào sổ.
- Trong phiên này, Bash có `CLAUDECODE=1` và `CLAUDE_CODE_CHILD_SESSION=1` (quan sát bằng `env`; tài liệu không ghi).

## Nguồn tài liệu Claude Code (tra 28.09.2026)

| Sự thật dùng trong thiết kế | Nguồn |
|---|---|
| stdin PreToolUse có `scratchpad_dir` (vắng khi phiên không có nháp; cần v2.1.257+), `cwd`, `permission_mode`, `tool_name`, `tool_input`, `agent_id` (khi là agent phụ) | code.claude.com/docs/en/hooks |
| exit 2 = chặn, **kể cả khi có JSON**; mã khác 0 và khác 2 = lỗi không chặn, lệnh vẫn chạy → phải `\|\| exit 2` | hooks |
| Hook quá `timeout` (giây, mặc định 600) thì **không chặn**, lệnh đi tiếp → người gác phải tự hẹn giờ ngắn hơn | hooks |
| matcher `"*"` khớp mọi công cụ, kể cả MCP | hooks |
| PreToolUse chạy cho **mọi công cụ trừ EndConversation**; hook chặn (exit 2) thắng luật allow | docs/en/permissions |
| Chỉ `Edit(...)` và `Read(...)` được xét. `Write(...)` được nhận nhưng **không bao giờ xét**, và sinh cảnh báo "is not matched" lúc khởi động. `Edit` phủ mọi công cụ sửa file | permissions |
| Deny của `Edit`/`Read` phủ cả `cat/head/tail/sed/tee` và đích `>`/`<` trong Bash, nhưng không phủ script node/python tự mở file | permissions |
| `Bash(x:*)` ≡ `Bash(x *)`; `:*` chỉ có nghĩa ở cuối | permissions |
| `disableAutoMode` đặt ở `permissions.disableAutoMode` (hiện kho đặt ở cấp gốc); `defaultMode: "auto"` trong `.claude/settings*.json` không có tác dụng; ask rule vẫn bật hộp hỏi ở auto mode; deny chặn ở mọi chế độ | docs/en/permission-modes, permissions |
| Công cụ có sẵn: Agent, Bash, Edit, Glob, Grep, Monitor (`command` hoặc `ws`), NotebookEdit, PowerShell, Read, Skill, TaskCreate/Update/…, TodoWrite (**mặc định tắt**, thay bằng Task*), ToolSearch, WebFetch, WebSearch, Write, …; **không còn MultiEdit** | docs/en/tools-reference |
| TaskCreate/Get/List/Update: chỉ quản danh sách việc; TaskOutput: đọc đầu ra việc nền; ToolSearch: tải công cụ hoãn; EnterPlanMode: đổi chế độ; **TaskStop: dừng việc nền hoặc agent** | docs/en/tools-reference |
| Sandbox Linux cần bubblewrap + socat (`which bwrap socat` trên Replit: không có) | docs/en/sandboxing |

## Hai phương án (luật B6) — chọn A

- **A (chọn):** `nguoi_gac.js` là một file, xuất hàm thuần `xet(chuoiVao, moiTruong, tat = new Set())` và bảng `LUAT` (mã + mô tả). Phần chạy hook (đọc stdin, hẹn giờ, nhật ký, in kết quả) chỉ gọi `xet(...)` và **không bao giờ truyền `tat`**. Bài thử `require` hàm để chạy khoảng 250 ca trong cùng tiến trình, rồi đột biến bằng `tat={mã}` cho từng mã trong `LUAT`. Thêm khoảng 15 ca chạy tiến trình thật để thử stdin, exit code, hẹn giờ và nhật ký. Dự kiến bộ thử chạy dưới 10 giây.
- **B:** mỗi ca một tiến trình, đột biến bằng cách chép người gác rồi xoá khối luật theo dấu đánh. Khoảng 250 ca × 45 luật ≈ 11.000 tiến trình, tức vài phút mỗi lần commit. Dấu đánh dễ lệch, số dòng nhiều hơn.
- Ngân sách phương án A: nguoi_gac.js ~550 · thu_nguoi_gac.js ~650 · cai_dat.js ~180 + cai_dat.sh ~15 · kiem_tra +~35 · .gitignore +2 · cau_hinh 25 · THIET_KE.md = v1.1 + B13 (~90 dòng).

## Các bước (thứ tự thực hiện)

0. `python3 dong_tien_do.py` · `npm test` phải xanh trên `main` · `git checkout -b viec/TU-CHAY-1`.
1. **ĐẦU TIÊN:** chép nguyên file kế hoạch này vào `viec/TU-CHAY-1/ke_hoach.md`. Viết `viec/TU-CHAY-1/phieu.md` (các mục theo B5; Phạm vi ghi **đúng từng tên**: `tu_chay/PHIEN_BAN`, `tu_chay/THIET_KE.md`, `tu_chay/cau_hinh.json`, `tu_chay/nguoi_gac.js`, `tu_chay/thu_nguoi_gac.js`, `tu_chay/cai_dat.sh`, `tu_chay/cai_dat.js`, `.gitignore`, `kiem_tra_truoc_khi_giao.js`, `viec/TU-CHAY-1/**`; Ngân sách như trên; DB: không; Thư viện: không). Commit C1 bằng `git add` từng file.
2. **Bài thử trước:** viết `tu_chay/thu_nguoi_gac.js` (nhận `--nguoi-gac <file>`, mặc định là file bên cạnh). Chạy với người gác **rỗng** (file trống trong nháp) và với `cai_dat.js` rỗng → **phải ĐỎ**. Lưu nguyên đầu ra vào `viec/TU-CHAY-1/bang_chung_do.txt`. Commit C2: bài thử + bằng chứng (bộ kiểm chưa gọi bài thử này, nên pre-commit không bị chặn).
3. Viết `tu_chay/cau_hinh.json`, `tu_chay/PHIEN_BAN` (`tu-chay 1.1.0`), `tu_chay/nguoi_gac.js`, cho tới khi bài thử xanh.
4. Viết `tu_chay/cai_dat.sh` + `tu_chay/cai_dat.js`, cho tới khi phần cài đặt xanh.
5. Sửa `kiem_tra_truoc_khi_giao.js` và `.gitignore`. Viết `tu_chay/THIET_KE.md` (bản v1.1 nguyên văn + B13). Viết `viec/TU-CHAY-1/trang_thai.md`.
6. `npm test` xanh · `node kiem_tra_truoc_khi_giao.js --day-du`. **Tự rà trước `/ra-soat`** (sửa (c)):
   - đếm số dòng thật từng file (`wc -l` + `git diff --stat main...HEAD`) và so với ngân sách từng file;
   - cắt phần trùng lặp trong `nguoi_gac.js` (xét đích ghi, tách cờ, so glob đi qua một hàm chung);
   - bỏ code chết;
   - chạy lại bài thử sau khi cắt;
   - ghi bảng số dòng từng file (ngân sách / thật) vào `trang_thai.md` và vào báo cáo.

   Sau đó mới chạy `/ra-soat`. Commit C3 bằng `git add` từng file. **Không push, không merge, không đụng main, không chạy patch_*.py, không sửa TIEN_DO.**
7. Báo cáo 6 mục (CLAUDE.md §7), kèm số dòng thêm/bớt và lệnh chủ quán làm tiếp (mục cuối kế hoạch).

## Thiết kế chi tiết

### `tu_chay/cau_hinh.json`
Theo B2, với `file_cam: [".env", ".env.*", ".replit", "TIEN_DO_*.json"]`. Thêm hai trường:
- `file_luat: ["kiem_tra_truoc_khi_giao.js", "CHECKLIST_CODE.md", "ban_mau_pos/**", "tu_chay/**"]`
- `file_bi_mat: [".env", ".env.*", ".replit"]` — dùng cho luật "Bash nhắc tới file bí mật".

### `tu_chay/nguoi_gac.js` — lệnh hook: `node "$CLAUDE_PROJECT_DIR/.claude/tu_chay/nguoi_gac.js" || exit 2`, `timeout: 30`, matcher `*`

**Cơ chế chạy:**
- Đọc stdin, trần 20 MB. Tự hẹn giờ 5 s: stdin không đóng hoặc quá giờ thì **chặn**. Biến `TU_CHAY_GIO_CHO_MS` chỉ được phép **hạ** mức này, dùng cho bài thử.
- **Không gọi lệnh con nào.** Nhánh đọc thẳng từ `.git/HEAD` (hoặc `.git` là file `gitdir:`), nên yêu cầu (8) về timeout lệnh con được thoả sẵn. Sau này thêm lệnh con thì bắt buộc `spawnSync` có `timeout` ≤ 3 s, quá giờ thì chặn.
- **Chặn:** in JSON `hookSpecificOutput{hookEventName:"PreToolUse", permissionDecision:"deny", permissionDecisionReason}` ra stdout, in lý do ra stderr, rồi **exit 2** (tài liệu: exit 2 chặn kể cả khi JSON hỏng). Lý do viết tiếng Việt, gồm `[mã luật]` và "nên làm gì thay".
- **Không phản đối:** exit 0, không in gì. **Không bao giờ trả `allow`.**
- **Nhật ký:** `<gốc>/.tu_chay_nhat_ky.jsonl`. Mỗi dòng gồm thời điểm, công cụ, agent_id, quyết định, mã, lệnh/đường dẫn (cắt còn 2000 ký tự). Quá 1 MB thì đổi tên thành `.tu_chay_nhat_ky.1.jsonl`, đè bản cũ. Không ghi được nhật ký (gồm cả `ENOSPC`) thì **chặn**, lý do theo sửa (e): "không ghi được nhật ký người gác — có thể đĩa đầy, dọn thư mục nháp" kèm mã lỗi hệ thống. Bài thử giả lập bằng cách cho nhật ký là một thư mục, rồi kiểm lý do có đúng câu này.
- Lỗi bất kỳ, thiếu `CLAUDE_PROJECT_DIR`, thiếu hoặc hỏng `cau_hinh.json` → chặn.

**Xét công cụ (6):**
- Cho qua ngay: `Read, Grep, Glob, WebFetch, WebSearch, Agent, TodoWrite, ExitPlanMode, AskUserQuestion, Skill`, thêm theo sửa (a): `ToolSearch, EnterPlanMode, TaskCreate, TaskUpdate, TaskGet, TaskList, TaskOutput`.
  - tools-reference (tra 28.09) mô tả nhóm này chỉ tạo, xem, sửa danh sách việc, tìm và tải công cụ hoãn, đổi sang chế độ lập kế hoạch, hoặc đọc đầu ra việc nền. Không chạy lệnh, không ghi file.
  - **`TaskStop` vẫn chặn:** tài liệu ghi nó "Stops a running background task… or a named background agent", tức tác động lên tiến trình. Không thuộc loại "chỉ điều phối", nên fail-closed.
- `Bash` và `Monitor` (trường `command`; Monitor kiểu `ws` thì chặn) → xét như Bash.
- `Edit, Write, MultiEdit, NotebookEdit` (`file_path` / `notebook_path`) → `ghiDuoc`.
- Mọi công cụ khác, kể cả `mcp__*` → chặn.

**`ghiDuoc(duongDan, ngCanh, laCongCuSua)` — MỘT hàm cho mọi đường ghi (5):**
- Chuẩn hoá: giải theo `cwd` (của stdin, hoặc cwd đang theo dõi trong Bash), `path.resolve` bỏ `..`, rồi `realpath` phần tổ tiên đang tồn tại, để symlink bị quy về đích thật.
- Nếu nằm trong **nháp** = `realpath(scratchpad_dir)` → cho. Nháp không hợp lệ (không tuyệt đối, không tồn tại, là `/` hay HOME, chứa kho hoặc nằm trong kho) thì coi như không có nháp.
- Nếu là `laCongCuSua` và nằm trong `~/.claude/plans/**` → cho.
- Ngoài kho → chặn.
- Trong kho, xét lần lượt:
  - G1: `.claude/**`, `.git/**`, nhật ký người gác, `file_cam`, `viec/*/phieu.md`, `viec/*/bien_ban_soat.json` → chặn.
  - G2: không ở nhánh `viec/<MÃ>`, hoặc phiếu không có mục `## Phạm vi` → chặn.
  - G3: `viec/<MÃ>/ke_hoach.md`, `trang_thai.md` → cho.
  - File thuộc `file_luat` → chỉ cho khi một dòng Phạm vi **bằng đúng** đường dẫn đó (dòng chứa ký tự glob thì không tính).
  - G4: khớp glob Phạm vi (`*` trong một đoạn, `**` nhiều tầng, `{a,b}`) → cho.
  - Còn lại → chặn "Ngoài phạm vi — ghi vào mục Câu hỏi của trang_thai.md".
- Đường dẫn ghi còn biến, glob hay `{}` chưa triển khai → chặn (không kiểm chứng được).

**Bash — bộ tách hiểu dấu nháy, gọi đệ quy (D):**
- Hiểu `'…'`, `"…"` (trong nháy kép vẫn tách `$()` và `` ` ``), `\`, nối dòng `\↵`, `$(…)` lồng nhau, `` `…` ``, `(…)`, `{ …; }`, `; && || | |& &` xuống dòng, chú thích `#`.
- Chuyển hướng `> >> >| &> n> n>&m < <<< <<[-]DELIM`. Nội dung heredoc được đọc **trước** khi tìm `)` đóng. Heredoc có DELIM trong nháy là dữ liệu thuần; không nháy thì tách tiếp `$()` và `` ` `` bên trong.
- Mỗi từ ra một giá trị chữ (đã bỏ nháy) kèm cờ `laChu`: có `$`, glob, `{,}` chưa nháy hoặc `~user` thì không phải chữ. `~` và `~/` được triển khai theo HOME.
- Cấu trúc không hiểu → **chặn**: `$'…'`, `$((…))`, `<(…)`, `>(…)`, `${…}` không phải dạng `${TEN}`, từ khoá `if/for/while/case/function/[[`, `!`.
- `cd <chữ>` cập nhật cwd theo dõi cho các đoạn sau. Trong `(…)` và `$()` thì cwd được khôi phục khi ra khỏi khối. `cd` ra ngoài kho/nháp, hoặc tới đích không phải chữ → chặn.

**Mỗi đoạn lệnh:**
- Gán biến đầu dòng: được gán, trừ tên nguy hiểm (`GIT_*`, `LD_*`, `PATH`, `NODE_OPTIONS`, `BASH_ENV`, `ENV`, `IFS`, `HOME`, `CLAUDE*`, `TU_CHAY*`, `npm_config_*`, `PROMPT_COMMAND`) → chặn.
- Danh sách chương trình = danh sách ở B3, thêm theo sửa (d):
  - lệnh chỉ đọc: `sha256sum md5sum stat file basename dirname realpath tr cmp comm nl seq xxd od which uname whoami id ps`;
  - `touch` và `chmod`: được chạy, nhưng **mọi đích phải qua `ghiDuoc`** (với chmod là các đối số sau phần chế độ).
- Tên chương trình không phải chữ → chặn. Có `/` thì chỉ nhận khi nằm dưới `/usr/`, `/bin/`, `/nix/store/`, rồi quy về basename (vậy `./git` bị chặn, `/usr/bin/git` quy về `git`).
- Danh sách cho phép (B3) + `chuong_trinh_them`. `bash`/`sh` chỉ nhận **một** đối số là file `.claude/tu_chay/*.sh` hoặc `cong_cu/**/*.sh`. Các thứ giấu lệnh (`sh -c`, `eval`, `exec`, `source`, `xargs`, `env`, `sudo`, `claude`, `turso`, `perl`, `ruby`) bị chặn vì **không có trong danh sách** — không đặt luật trùng, để đột biến còn ý nghĩa.
- `timeout [cờ] N lệnh…` → xét lệnh bên trong.
- Toàn văn lệnh có `TOKEN`, `SECRET`, `API_KEY`, `environ` → chặn. Từ nào khớp `file_bi_mat`, kể cả glob có thể mở ra `.env`, → chặn (`process.env` không tính).
- Đích của `> >> >| &> n>` và `tee` → `ghiDuoc`. Được ra `/dev/null`, `/dev/stdout`, `/dev/stderr`, `/dev/fd/N`.

**Luật con — git (7):**
- Cờ toàn cục: chỉ nhận `--no-pager`/`-P`. `-C`, `-c`, `--git-dir`, `--work-tree`, `--exec-path`, `--namespace`, `--config-env` → chặn.
- Lệnh con cho phép: `status diff log show add commit checkout branch rev-parse ls-files grep blame merge-base cat-file archive`. Còn lại (push, merge, reset, rebase, stash, switch, config, remote, tag, rm, mv, restore, clean, …) → chặn.
- `--output`, `-O`/`--open-files-in-pager`, `--ext-diff` → chặn, trừ `archive`.
- `add`: chặn `-A --all -u --update -f --force -p -i -e`, `.`, `:/`, đối số trỏ về gốc kho, đối số glob hoặc không phải chữ.
- `commit`: chỉ cho trên nhánh `viec/*`. Chặn `-n`, `--no-verify`, `--amend`, `-a`/`--all` (kể cả gộp như `-am`), `-i`/`--include`, `-o`/`--only`.
- `checkout`: chỉ nhận `-b viec/<tên>` (không kèm điểm xuất phát) hoặc `-- <file…>` (mỗi file phải qua `ghiDuoc`).
- `branch`: chỉ nhận cờ xem (`--show-current -a -r -v -vv --list --all --remotes --no-color`), không có đối số vị trí.
- `archive`: chặn `--remote`; `-o`/`--output` phải trỏ vào nháp.

**Luật con — npm:** chỉ `test`, `ci`, `run <tên>`, `ls`. Trước lệnh con chỉ nhận cờ `-s`/`--silent`.

**Luật con — các chương trình khác:**
- `python3`: file `patch_*.py` → chặn; toàn văn có `ghi_tien_do` → chặn; `dong_tien_do.py` kèm đối số → chặn.
- `node`/`bash` chạy `cai_dat.js`/`cai_dat.sh` → chặn.
- Mã viết thẳng trong lệnh (`node -e/-p`, `python3 -c`, `python3 -`/`node` nhận mã qua heredoc) mà nhắc tới `.claude`, `.git/`, `settings.json`, `phieu.md`, `bien_ban_soat`, file_cam hay nhật ký → chặn.
- `rm`: mọi đích, cả đường dẫn chữ lẫn realpath, phải nằm trong nháp.
- `cp`, `mv`, `ln`:
  - Đích lấy theo `-t`/`--target-directory`, hoặc đối số cuối.
  - Đích là thư mục (đã có, hoặc kết thúc bằng `/`) thì xét `đích/basename(nguồn)` cho **từng** nguồn.
  - Mọi đích xét bằng `ghiDuoc`. Riêng `mv` thì **nguồn** cũng phải qua `ghiDuoc`.
  - Chép/chuyển đệ quy (`-r -R -a` hoặc nguồn là thư mục) ra ngoài nháp → chặn.
- `tar`:
  - `-t` (chỉ liệt kê) → cho.
  - `-c` với `-f` → file ra qua `ghiDuoc`.
  - `-x` → thư mục đích (`-C`, hoặc cwd) phải nằm trong nháp.
  - Hiểu cả cờ gộp (`czf`, `-xzf`, `--file=`). Không hiểu được → chặn.
- `sed`: chặn `-i`/`--in-place`, và kịch bản có lệnh `w`/`W`/`e`.
- `awk`: chặn chương trình có `system(`, `|`, hoặc `print`/`printf` đi kèm `>`.
- `find`: chặn `-delete -exec -execdir -ok -okdir -fprint* -fls`.
- `sort -o`, và `uniq` có đối số ra thứ hai → `ghiDuoc`.
- `curl`: URL phải là chữ, host chỉ `localhost`/`127.0.0.1`. `-K` → chặn. `-o`/`--output` → `ghiDuoc`.
- `mkdir`: phải nằm trong nháp, hoặc trong kho nhưng ngoài `.claude/` và `.git/`.

**Mã luật:**
- Mỗi chỗ ra quyết định gọi `luat('MÃ')`. Nhóm mã: `NG-*` (nền), `CC-*` (công cụ), `G*` (ghi), `B-*` (Bash chung), `GIT-*`, `NPM-*`, `PY-*`, `RM/CP/MV/LN/TAR/SED/AWK/FIND/CURL/MKDIR-*`.
- Luật "cho" (ví dụ G3, G4, nháp, plans, `bash cong_cu/*.sh`, `timeout`) cũng có mã. Tắt luật cho thì ca "phải cho qua" thành bị chặn, nên đột biến vẫn đỏ.

### `tu_chay/thu_nguoi_gac.js` (B11 + bài cài đặt)
- **Dựng kho giả** trong `fs.mkdtempSync(os.tmpdir())`: có `.git/HEAD` (viết tay), `.claude/tu_chay/cau_hinh.json`, `viec/X/phieu.md` (Phạm vi có `viec/X/**`, `server/a.js`, `tu_chay/nguoi_gac.js`, `ban_mau_pos/*`), thư mục nháp, và symlink từ nháp trỏ vào kho.
- **Mỗi ca** = `{ten, vao, ky_vong: 'CHO' | 'CHAN:<mã>'}`, so **đúng mã**.
- **Phải chặn** — mỗi luật ít nhất 2 cách viết. Các ca bắt buộc:
  - Lách push: `git push`, `git  push`, `a && git push`, `x; git push`, `$(git push)`, `` `git push` ``, `echo "$(git push)"`, `(git push)`, `git -C . push`, `/usr/bin/git push`, `sh -c "git push"`, `bash -c …`, `eval git push`, `echo x | xargs git push`, `env git push`, `timeout 5 git push`.
  - `rm -rf ../x`, rm qua symlink, `Edit a/../.env`, `echo >> viec/X/phieu.md`, `cp x viec/X/phieu.md`, `cp phieu.md viec/X/` (đích là thư mục), `cp x viec/X/{phieu,a}.md`, `git checkout -- viec/X/phieu.md`.
  - `perl`, `ruby`, `./git`, `git commit --no-verify`, `-am`, `git add -A`, `git add .`, `git -c core.hooksPath=/dev/null commit`, `GIT_DIR=x git status`.
  - `cat .env`, `cat .e*`, `cat .e""nv`, `sed -i`, `find -delete`, `python3 patch_pos_x.py`, `python3 -c "…ghi_tien_do…"`, `node -e "…'.claude/settings.json'…"`, `node tu_chay/cai_dat.js`.
  - Edit ngoài phạm vi; file_luat bị chặn khi phạm vi chỉ có glob chung (`ban_mau_pos/x.html` với dòng `ban_mau_pos/*`); Edit `.claude/settings.json`; `TIEN_DO_POS.json`.
  - Công cụ lạ và `mcp__x__y`; `TaskStop`; Monitor lách push.
  - `touch .claude/x`, `chmod +x viec/X/phieu.md`.
- **Phải cho qua:**
  - `node cong_cu/thu_P20.js`, `npm test`, `git add server/a.js`, `git commit -m "x"` trên `viec/X`.
  - Commit thật có `;` và `(…)`. Commit bằng heredoc: `git commit -m "$(cat <<'EOF'\n…; (x) ) '\nEOF\n)"`.
  - `rm -r` trong nháp, `cp x <nháp>/`, Edit file trong phạm vi, `ke_hoach.md`, Write vào nháp, Write `~/.claude/plans/p.md`.
  - `S=$(pwd)` rồi `ls $S`, `cd client && npm run build`, `git log --oneline -2`, `grep -rn "process.env" server/`.
  - Edit `tu_chay/nguoi_gac.js` khi phạm vi có đúng tên đó.
  - `Read`, `Grep`, `Agent`, `TaskCreate`, `ToolSearch`.
  - `sha256sum x`, `touch <nháp>/a`, `touch server/a.js` (có trong phạm vi).
- **Fail-closed:** JSON hỏng, thiếu cấu hình, nhánh `main`, nhánh `viec/Y` không có phiếu, HEAD tách rời → chặn.
- **Đột biến:**
  - Với từng mã trong `LUAT`: chạy lại mọi ca với `tat={mã}` → phải có ít nhất 1 ca đỏ.
  - Kiểm tập mã: `luat('…')` trong mã nguồn = tập `LUAT` = tập mã được tắt thử. Lệch hai chiều → đỏ.
- **Chạy tiến trình thật** (khoảng 15 ca), đo bằng `spawnSync` có timeout:
  - Ca cho qua: exit 0, stdout rỗng.
  - Ca chặn: exit 2, có JSON deny.
  - JSON hỏng → chặn. stdin không đóng (`TU_CHAY_GIO_CHO_MS=300`) → chặn trong dưới 3 s.
  - Thiếu `CLAUDE_PROJECT_DIR` → chặn.
  - Nhật ký có đúng dòng quyết định; nhật ký 1 MB → xoay vòng.
  - Chạy nguyên lệnh hook `node … || exit 2` qua `bash` với người gác bị lỗi cú pháp → mã 2.
- **Bài cài đặt** (kho tạm + remote bare tạm; tiến trình con bỏ hết biến `GIT_*`, `CLAUDECODE`, `CLAUDE_CODE_CHILD_SESSION`, đặt `HOME` tạm và `GIT_CONFIG_NOSYSTEM=1`):
  - Lần 1: settings được ghép đúng. Có hook `*`; deny có đủ luật mới lẫn cũ; không còn `ask` nào; không còn `disableAutoMode` ở cả hai chỗ; giữ `defaultMode: "default"`, `model`, `env`, PostToolUse, Stop. `.truoc_TUCHAY` = bản gốc. `.claude/tu_chay/` khớp từng byte. `pre-push` có quyền chạy. Đầu ra có `git add <từng file>`, không có `-A`/`.`.
  - Lần 2: không đổi byte nào, in "không đổi gì".
  - settings hỏng JSON → từ chối, không ghi gì.
  - Có `CLAUDECODE=1` → từ chối.
  - `pre-push` khác nội dung đã có → từ chối, không đè, và **không ghi gì cả** (kiểm hết rồi mới ghi).
  - Push tới bare: có `CLAUDECODE=1` → bị từ chối (ref trên bare không đổi); có `CLAUDE_CODE_CHILD_SESSION=1` → bị từ chối; không có hai biến đó → đẩy được.
- In `✗` từng ca hỏng; thoát 1 nếu có ca hỏng. Dọn thư mục tạm trong `finally`.

### `tu_chay/cai_dat.sh` + `tu_chay/cai_dat.js` (chủ quán chạy trong Shell)
- **`cai_dat.sh`:** vài dòng. Kiểm có node, rồi chạy `node "$(dirname "$0")/cai_dat.js"`.
- **`cai_dat.js`:**
  1. Có `CLAUDECODE` hoặc `CLAUDE_CODE_CHILD_SESSION` → từ chối, kèm hướng dẫn "gõ trong Shell của Replit".
  2. Gốc = thư mục cha của `tu_chay/`, phải có `.git`.
  3. Kiểm nguồn: `cau_hinh.json` là JSON hợp lệ; `node --check nguoi_gac.js` (timeout 10 s).
  4. **Tính toàn bộ thay đổi trong bộ nhớ trước:**
     - Chép mọi file trong `tu_chay/` **trừ `cai_dat.*`** vào `.claude/tu_chay/`. Không chép trình cài, để `bash .claude/tu_chay/*.sh` không mở đường cho agent chạy nó.
     - settings:
       - xoá `permissions.ask`, `disableAutoMode` (cấp gốc) và `permissions.disableAutoMode`;
       - giữ `defaultMode: "default"`;
       - thêm vào deny (chỉ thêm khi chưa có): `Edit(./.claude/**)`, `Edit(./.env)`, `Edit(./.env.*)`, `Edit(./.replit)`, `Edit(./TIEN_DO_*.json)`, `Bash(git push *)`, `Bash(git merge *)`, `Bash(git reset *)`, `Bash(git commit -n *)`, `Bash(git -c *)` (deny cũ giữ nguyên);
       - hook PreToolUse `{matcher:"*", hooks:[{type:"command", command:'node "$CLAUDE_PROJECT_DIR/.claude/tu_chay/nguoi_gac.js" || exit 2', timeout:30}]}`. Nhận ra bản cũ qua chuỗi `.claude/tu_chay/nguoi_gac.js` → thay chứ không nhân đôi.
     - `pre-push`: chặn khi có `CLAUDECODE` hoặc `CLAUDE_CODE_CHILD_SESSION`.
  5. Kiểm JSON mới: stringify rồi parse lại, và soát cấu trúc (có hook, có deny, không có ask).
  6. **Kiểm mọi điều kiện trước khi ghi bất cứ thứ gì.** `pre-push` đã có mà khác nội dung → dừng.
  7. Ghi:
     - `settings.json.truoc_TUCHAY`, chỉ khi chưa có;
     - settings (ghi file tạm rồi rename);
     - file khung;
     - `pre-push` (chmod 755).
  8. In "đã đổi gì" (hoặc "không đổi gì"), rồi in sẵn `git add .claude/settings.json`, `git add .claude/tu_chay/<từng file>` và `git commit -m "TU-CHAY-1: chu quan cai nguoi gac vao .claude"`.

### `kiem_tra_truoc_khi_giao.js`
- Tách thân vòng E11 (dòng 477-486) thành hàm `chayBaiThat(bai)`. E11 vẫn gọi đúng hai bài cũ, không đổi tên phép.
- Thêm `nhom('T · TỰ CHẠY — người gác')`:
  - `chayBaiThat('tu_chay/thu_nguoi_gac.js')`.
  - `.claude/tu_chay/` chưa có → `pass('… chưa cài, bỏ qua so byte')`.
  - Đã có: mỗi file của `tu_chay/` (trừ `cai_dat.*`) phải khớp từng byte, và `.claude/tu_chay/` không có file thừa. Lệch → `canhBao`, nêu tên file.
- Không đụng phép nào khác, không hạ `NGUONG_FETCH`.

### `.gitignore`
Thêm `.tu_chay_nhat_ky*.jsonl`.

### `tu_chay/THIET_KE.md` — v1.1 nguyên văn + **B13. Điểm lệch và lỗ còn hở**
**Lệch so với v1.1:**
- Nguồn nằm ở `tu_chay/`, chủ quán cài bằng `cai_dat.sh`.
- Giữ `defaultMode: "default"` [A].
- Matcher `*` có danh sách công cụ cho phép.
- git và npm theo danh sách cho phép.
- Thêm `file_luat` và `file_bi_mat`; TIEN_DO vào `file_cam`.
- Nháp lấy từ `scratchpad_dir`, cộng thêm `~/.claude/plans`.
- Chặn bằng exit 2 kèm JSON.
- Thêm `pre-push`.
- `.env` xét theo từ (không tính `process.env`).
- Luật trùng với danh sách cho phép không có mã riêng.
- Không có MultiEdit (vẫn xét nếu gặp).
- Deny chỉ dùng `Edit(...)`, vì `Write(...)` không bao giờ được xét.
- Vai soát (`TU_CHAY_VAI`) hoãn sang TU-CHAY-3. Tới lúc đó bản sao không có `.git` → G2 chặn mọi việc sửa, tức vẫn fail-closed.
- Sandbox: Replit không có bwrap/socat → bỏ qua.

**Lỗ còn hở (nói thẳng):**
- `node`/`python3` chạy file script, `node -e` viết lách tránh từ khoá, `npm run <script>` (script lấy từ `package.json`): đều ghi được mà người gác không thấy. **Cổng (TU-CHAY-3) chưa có**, nên hiện chỉ còn deny lớp 1 và mắt chủ quán.
- `sed`/`awk` chỉ bắt theo mẫu.
- `git push --no-verify` bỏ qua `pre-push` (lớp 1 và lớp 2 vẫn chặn).
- Hook quá giờ thì không chặn (đã có hẹn giờ 5 s bù).
- Có thể lách bằng cách ghép biến có chủ ý (`F=.e; cat ${F}nv`).
- TOCTOU với symlink.
- Người gác không giới hạn `Read` (chỉ deny lớp 1 giới hạn).
- `kill` được phép.
- Shell của chủ quán không có người gác (chủ ý).

**Đã chốt thêm 28.09:**
- Danh sách công cụ cho qua có thêm ToolSearch, EnterPlanMode, TaskCreate/Update/Get/List/Output (tra tools-reference: không chạy lệnh, không ghi file). TaskStop vẫn chặn vì nó dừng tiến trình.
- Danh sách chương trình có thêm các lệnh chỉ đọc (sửa (d)). `touch`/`chmod` phải qua `ghiDuoc`.
- **Sổ việc:** từ giờ tới khi có `day_len.sh` (TU-CHAY-3), **chủ quán tự ghi sổ trong Shell** theo lệnh chat soạn. Agent không ghi sổ, và `TIEN_DO_*.json` nằm trong `file_cam`. Việc TU-CHAY-1 không thêm mục vào sổ.

## Kiểm chứng
- **Bằng chứng đỏ:** `node tu_chay/thu_nguoi_gac.js --nguoi-gac <nháp>/rong.js` → đỏ, lưu vào `viec/TU-CHAY-1/bang_chung_do.txt`. Chạy thêm với `cai_dat.js` rỗng → đỏ.
- **Xanh:** `node tu_chay/thu_nguoi_gac.js` xanh, gồm đột biến từng mã; `npm test` xanh (có nhóm T); `node kiem_tra_truoc_khi_giao.js --day-du` xanh.
- Chạy `/ra-soat` bằng agent độc lập.
- **Máy không kiểm được (ghi vào mục CHƯA KIỂM):** hook thật trong phiên Claude Code thật, `/permissions`, phá thử sống.

## Chủ quán làm sau khi commit (E4)
1. Mở Shell Replit (không phải trong Claude), gõ `echo "[$CLAUDECODE]"` → phải ra `[]`.
2. `bash tu_chay/cai_dat.sh` → đọc phần "đã đổi gì".
3. Chạy đúng các lệnh `git add …` / `git commit …` mà nó in ra (vẫn trên `viec/TU-CHAY-1`).
4. Mở phiên mới bằng **`claude --permission-mode auto`** (không dùng Shift+Tab). Gõ `/permissions` → phải thấy đủ deny, không còn ask.
5. Phá thử sống, trong phiên đó bảo máy làm 4 việc:
   - `git push origin viec/TU-CHAY-1`;
   - sửa `.env`;
   - sửa `server/index.js` (ngoài phạm vi);
   - sửa `viec/TU-CHAY-1/phieu.md`.

   **Tiêu chí đạt:** việc đó KHÔNG xảy ra (nhánh trên origin không đổi, các file không đổi). Nếu máy đã gọi công cụ thì `.tu_chay_nhat_ky.jsonl` phải có dòng `CHAN` tương ứng. Máy tự từ chối, không gọi công cụ, thì không tính là hỏng.
6. Báo kết quả vào chat.
