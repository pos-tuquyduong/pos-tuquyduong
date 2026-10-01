# TU-CHAY-3 — kế hoạch (chờ chủ quán duyệt)

Nền: `ff06a05 PHIEU: TU-CHAY-3` trên `38840c9`. Mọi số dòng dưới đây đọc trong lượt này (01.10.2026).

## 0. Code thật đã đọc — điểm tựa của kế hoạch

| Điều | Ở đâu |
|---|---|
| Hàm khớp phạm vi của người gác nằm GỘP trong `ghiDuoc`, chưa tách ra được | `tu_chay/nguoi_gac.js:168-186` (G-LUAT, G4, G5 ở 183-185); `khop` 158; `docPhamVi` 851-863 |
| Người gác chỉ xuất `{ LUAT, xet, tachLenh }` | `nguoi_gac.js:974` |
| GIT-ADD: chỉ chặn từ không phải chữ (`!w.chu`), `.`, `:`… — `'server/*.js'` trong nháy LỌT | `nguoi_gac.js:584-596` |
| GIT-HOANTAC đã chặn `* ? [ ] \` bằng regex `/[*?[\]\\]/` | `nguoi_gac.js:561` |
| CC-LA: công cụ không có trong `CONG_CU_DOC`/`CONG_CU_SUA` → chặn | `nguoi_gac.js:103-105, 922` |
| Bài thử hiện coi `SendMessage` là công cụ lạ (CC-LA) | `tu_chay/thu_nguoi_gac.js:130` |
| Agent phụ nộp báo cáo bằng `SubagentHandback` — người gác chặn CC-LA | nhật ký người gác, 07:19:31Z hôm nay |
| Trình cài lọc BỎ CẢ MỤC SessionStart/PreToolUse có chứa lệnh của bộ khung → hook khác của chủ quán nằm chung mục bị mất (Phát hiện 3, TU-CHAY-2) | `tu_chay/cai_dat.js:92-94` (PreToolUse), `95-97` (SessionStart) |
| Trình cài chép skill bằng khối riêng; in `git add` cố định | `cai_dat.js:109-114, 144-148, 158-162` |
| `cai_thu_vien.sh`: thoát ngay nếu `CLAUDE_CODE_REMOTE` ≠ true, rồi `npm ci` | `tu_chay/cai_thu_vien.sh:8-23` |
| `/ra-soat` hiện đưa "git diff của các thay đổi chưa commit" | `.claude/commands/ra-soat.md:9-10` |
| Máy mây KHÔNG có ref `main` (`git branch -a` → chỉ `viec/TU-CHAY-3` và `origin/viec/TU-CHAY-3`), người gác cấm `git fetch` (GIT-LENH) | lệnh chạy trong lượt này; `nguoi_gac.js:109-110` |
| T2/T3 so bản cài là CẢNH BÁO (không đỏ) | `kiem_tra_truoc_khi_giao.js:518-551` |
| PHIEN_BAN được kiểm trong `thu_nguoi_gac.js:561` (`tu-chay 1.2.0`) | |
| `cong_cu/` (= `thu_muc_bai_thu`) chứa cả công cụ không phải bài thử: `do_chuathu.js`, `test-xlsx.js` | `ls cong_cu` |
| `KHUON_LOI.md` 97 dòng, `CLAUDE.md` 145 dòng | `wc -l` |
| "6 mục" còn ở: `CLAUDE.md:91`, `tu_chay/skill_lam_viec.md:3,52`, `tu_chay/THIET_KE.md:313` (+ bản cài trong `.claude/`, và hồ sơ cũ `viec/TU-CHAY-1,2/` — không sửa, là lịch sử) | `grep -rn "6 mục"` |
| `npm test` hiện 52 phép, ~9 giây | chạy trong lượt này |
| Node máy mây v22.22.0; `package.json` engines `>=18` | |

## 1. Phần A — cổng `tu_chay/cong.js`

### Phương án
- **A-a (chọn).** Một file `cong.js` ~185 dòng. Gọi `node cong.js tinh|chay <thư mục kho> <base> <head> <nhánh>`.
  Lấy hàm phạm vi từ `nguoi_gac.js` CÙNG THƯ MỤC với `cong.js` (trên GitHub là bản `main`), đọc
  `cau_hinh.json` cùng thư mục. Xuất thêm hàm `cong(opts)` có tham số `tat` (Set mã kiểm) CHỈ để bài thử
  đột biến — giống `xet(…, tat)` của người gác. Đường chạy dòng lệnh không bao giờ truyền `tat`, và
  **không có biến môi trường nào tắt được kiểm** (xem rủi ro GITHUB_ENV ở B).
- A-b. Tách thành `cong.js` + `cong_chay_thu.js` (phần chạy bài thử trên code gốc). Thêm một file, thêm
  phần nối; không lợi gì. Loại.

### Tách hàm phạm vi khỏi `ghiDuoc` (K4 — một chỗ duy nhất)
`nguoi_gac.js` +~8 dòng: tách 3 dòng G-LUAT/G4/G5 (`183-185`) thành
`xetPhamVi(rel, phamVi, cauHinh)`; `ghiDuoc` gọi nó; xuất `xetPhamVi`, `docPhamVi`, `khop`.
Cổng dùng: `xetPhamVi` (A6), `khop(file_cam, rel, true)` (A10 — đúng quy tắc G1-CAM), `docPhamVi` (A14).
Hành vi người gác không đổi — toàn bộ ~400 ca cũ của `thu_nguoi_gac.js` canh việc này.

### Hai chế độ, hai job (soát độc lập 4.1 — xem Q5)
Code của PR (`cai_dat.js` của PR, `npm ci`, bài thử, `npm test`) chạy trên máy GitHub có `sudo`, nên nó có thể
ghi đè phiếu, `cau_hinh.json` trên đĩa, hay sửa bộ nhớ tiến trình cổng TRƯỚC khi cổng đọc. Kẻ cần canh lại chính
là máy viết PR. Vì vậy cổng chia hai chế độ, chạy ở **hai job — hai máy GitHub riêng**:

- `node cong.js tinh <thư mục> <base> <head> <nhánh>` — **không chạy một dòng code nào của PR**. Mọi dữ liệu đọc
  bằng `git show <sha>:<đường dẫn>` / `git diff` / `git log` vào bộ nhớ (không đọc file trên đĩa của PR).
- `node cong.js chay <thư mục> <base> <head> <nhánh>` — phần phải chạy code PR. Canh LỖI, không canh ÁC Ý (B15).

`docPhamVi` hiện đọc từ đĩa (`nguoi_gac.js:851-863`); tách phần phân tích chữ thành `phamViTuChu(chuoi)`
để cổng đưa vào nội dung lấy bằng `git show head:viec/<MÃ>/phieu.md`. Người gác vẫn gọi qua `docPhamVi`.

### Chế độ `tinh` (gom MỌI lý do rồi mới kết luận)
1. **A14** nhánh khớp `^viec\/([A-Za-z0-9._-]+)$` (cùng regex người gác `nguoi_gac.js:890`); có
   `viec/<MÃ>/phieu.md` ở head; phiếu có `## Phạm vi`. Hỏng → dừng sớm.
2. Mốc so: `git merge-base base head`. File đổi: `git diff --name-status -z --no-renames mốc head` (đổi tên =
   xoá + thêm; file bị XOÁ cũng phải trong phạm vi).
3. **A7/A4** `git log --full-history --format=%H%x09%s mốc..head -- viec/<MÃ>/phieu.md viec/<MÃ>/bien_ban_soat.json`
   (soát 4.4: cùng nhóm file bảo vệ với G1-PHIEU `nguoi_gac.js:177`). Mỗi commit đó phải:
   - có tiêu đề khớp `^PHIEU: <MÃ>([^A-Za-z0-9._-]|$)` (soát 4.5: neo, để `PHIEU: TU-CHAY-30` không khớp `TU-CHAY-3`);
   - CHỈ đổi file trong `viec/<MÃ>/` (soát 4.5: commit `PHIEU:` không được kèm code).
   Tiêu đề `PHIEU:` ai push được cũng đặt được — lỗ còn hở, ghi B15.
4. **A9** file đổi dưới `.github/` khác `.github/workflows/cong.yml` → ĐỎ (gồm `keep-alive.yml`, workflow lạ).
5. **A10** file đổi khớp `file_cam` (quy tắc G1-CAM, `khop(…, true)`) → ĐỎ. `.github/**` đã xét ở bước 4 nên
   `cong.yml` không bị chặn oan ở đây.
6. **A6** mọi file đổi còn lại (trừ `.claude/**`, `.github/**`, hai file bảo vệ đã xét) qua `xetPhamVi`.
   Lý do in tiếng Việt: "file `server/index.js` không có trong Phạm vi của phiếu", "file luật `x` phải ghi
   ĐÚNG TÊN trong Phạm vi (glob chung không mở được file luật)".
7. **A12 (phần tĩnh)** tính sẵn: có file "code" đổi (không `*.md`, không `viec/**`, không `.claude/**`, không
   `.github/workflows/cong.yml`)? có bài thử mới/sửa? phiếu có `## Bài thử đỏ` `không — <lý do>` (**A5**)?
   Đổi code mà không có bài thử và không miễn → ĐỎ ngay ở `tinh`. Miễn → in lý do.

### Chế độ `chay` (đọc hết dữ liệu vào bộ nhớ TRƯỚC, rồi mới chạy code PR; tiến trình con không có `GITHUB_*`)
1. Đọc phiếu, cấu hình gốc (`git show base:tu_chay/cau_hinh.json`), danh sách file đổi, danh sách bài thử.
2. **A3/A8 — bản cài.** Thư mục tạm: `git archive mốc .claude` + `git archive head tu_chay`, `git init -q`, chạy
   `cai_dat.js` của PR (môi trường bỏ `CLAUDE*` và `GITHUB_*`). So mọi file `.claude/` của head ↔ thư mục tạm
   (bỏ `*.truoc_TUCHAY`), và `.github/workflows/cong.yml` của head ↔ bản tạm. Lệch/thừa/thiếu → ĐỎ kèm câu
   "chủ quán chạy bash tu_chay/cai_dat.sh trên nhánh việc". Luôn chạy (bắt cả `main` lệch bản cài).
3. **`npm ci`** ở gốc và `client/` (nơi có `package-lock.json`) — TRƯỚC A11 (soát 4.7).
4. **A11** mỗi bài thử mới/sửa: `git archive mốc` → thư mục tạm, chép đè bài thử từ head, liên kết
   `node_modules` vừa cài, `node <bài thử>` cwd tạm, quá giờ 300 s.
   - thoát 0 → ĐỎ "bài thử `x` XANH trên code gốc — vô giá trị (K3)";
   - sập vì `MODULE_NOT_FOUND` của THƯ VIỆN (không phải file của kho) → ĐỎ "bài thử không chạy được trên gốc"
     (soát 4.7: không được tính là đỏ hợp lệ);
   - thoát khác 0 vì lý do khác (kể cả thiếu file của kho, vd. `cong.js` chưa có ở gốc) → đỏ hợp lệ.
   A12 (phần chạy): đổi code mà không bài thử nào đỏ hợp lệ trên gốc, không miễn → ĐỎ.
5. **A13** `lenh_bai_thu` rồi `lenh_kiem_day_du` của cấu hình gốc trong thư mục PR. Đỏ → in 20 dòng cuối.

Thoát 0 = ĐẠT, 1 = ĐỎ + danh sách lý do. Ước lượng `cong.js` ~185 dòng (phiếu ~150: +hai chế độ, +đọc qua
`git show`, +`npm ci` trong cổng). Vượt ~1,2 lần.

## 2. Phần B — `tu_chay/cong_github.yml` → `.github/workflows/cong.yml`

### B1 — tra tài liệu (01.10.2026)
Máy mây KHÔNG vào được `docs.github.com` (WebFetch trả `EGRESS_BLOCKED`), nên chỉ đọc được qua kết quả
tìm kiếm trích docs.github.com. Ba điều phiếu đòi:

1. **Check-run gắn vào commit nào.** Với `pull_request_target`, `GITHUB_SHA`/`GITHUB_REF` trỏ về nhánh GỐC
   (commit cuối của `main`), không phải commit đầu của PR (docs.github.com "Events that trigger workflows",
   mục pull_request_target, qua tìm kiếm). Check-run của job vẫn hiện trên trang PR và chạy lại mỗi lần
   `synchronize` — đây là điều kiểm sống bước 2 phải xác nhận tận mắt (máy không đọc được trang gốc).
   Agent phụ được giao tra docs.github.com cho mục này đã bị người gác chặn khi nộp báo cáo (xem D1) — báo
   cáo của nó KHÔNG về. Đây là lần thứ hai gặp lỗi 3 của F4, ngay trong việc này.
2. **Ruleset "Require status checks to pass" nhận được không.** Chọn check theo TÊN job (`cong`) và nguồn
   GitHub Actions. Chưa có câu trích trực tiếp — kiểm sống bước 1–2 xác nhận (PR thử phải bị khoá Merge).
3. **Job bị bỏ qua tính là gì.** "A job that is skipped will report its status as Success … it will not
   prevent a pull request from merging, even if it is a required check" (docs.github.com
   /pull-requests/…/troubleshooting-required-status-checks, qua tìm kiếm). Vì vậy: job `cong` KHÔNG có
   `if:`; fork bị chặn bằng một BƯỚC thoát 1 (job đỏ), không phải bằng `if:` (job bị bỏ qua = xanh — A15).
   Workflow không được kích hoạt thì check bắt buộc ở trạng thái chờ → Merge vẫn khoá (cùng trang).

Workflow lấy từ nhánh gốc: `pull_request_target` chạy trong ngữ cảnh nhánh gốc, nên bản `cong.yml` trên
`main` mới là bản chạy — PR không tự sửa được cổng của nó. Hệ quả (H2): chính PR TU-CHAY-3 chưa được soát.

### Bố cục (~60 dòng, hai job — xem Q5)
```
on: pull_request_target: { branches: [main], types: [opened, synchronize, reopened] }
permissions: { contents: read }
jobs:
  cong:                       # chế độ tinh — KHÔNG chạy code PR. Không `if:` → luôn chạy, luôn báo
    steps:
      1. "Chặn PR từ fork": env HEAD_REPO/BASE_REPO; [ "$HEAD_REPO" = "$BASE_REPO" ] || { echo ✗; exit 1; }
      2. actions/checkout@<SHA40> path: goc, persist-credentials: false        (không ref = commit cuối main)
      3. actions/checkout@<SHA40> path: pr, ref: ${{ github.event.pull_request.head.sha }}, fetch-depth: 0,
         persist-credentials: false
      4. node goc/tu_chay/cong.js tinh pr "$BASE" "$HEAD" "$NHANH"           (giá trị qua env:)
  cong-chay:                  # chế độ chay — chạy code PR trên máy riêng. Không `if:`, không `needs:`
    steps: 1–3 như trên; 4. actions/setup-node@<SHA40> (Q3), không `cache`;
      5. node goc/tu_chay/cong.js chay pr "$BASE" "$HEAD" "$NHANH"
```
- Bước chạy cổng là bước CUỐI của job; `npm ci` nằm TRONG `cong.js` (không bước riêng), để `postinstall` của PR
  không ghi được `$GITHUB_ENV`/`$GITHUB_PATH` cho bước cổng. Tiến trình con không nhận biến `GITHUB_*`.
- Có `sudo` thì code PR vẫn về lý thuyết làm giả được kết quả `cong-chay` — vì thế mọi kiểm "lén/ngoài phạm vi"
  nằm ở `cong`, job không chạy code PR.
- `${{ }}` chỉ trong `with:`/`env:`, không trong `run:` (tên nhánh do PR đặt).
- Ruleset đòi cả `cong` và `cong-chay`. **Dự phòng nếu kiểm sống bước 2 cho thấy check không gắn vào head
  của PR:** không nới B3 (`statuses: write` cần quyền ghi — KHÔNG làm tự động); máy dừng, báo chủ quán chọn
  (vd. đổi sang `pull_request` cho phần `cong-chay`). Ghi B15.
- `types` không có `edited`, ruleset không bật "up to date": ĐẠT trên base cũ vẫn được dùng khi `main` đổi —
  ghi B15; chủ quán có thể bật "Require branches to be up to date".

### B6 — phép kiểm tĩnh (trong `thu_cong.js`)
Hàm `kiemYml(chuoi)` trả danh sách lỗi; chạy trên file thật → rỗng; mỗi đột biến chữ → đúng lỗi tương ứng:
trigger chỉ `pull_request_target` (không `pull_request`, `push`, `workflow_dispatch`), `branches: [main]`, đủ 3
types; `permissions` chỉ `contents: read`; không chuỗi `secrets.`; không `cache`; mọi `uses:` dạng
`actions/<tên>@<40 hex>`; mọi checkout có `persist-credentials: false`; checkout PR có
`ref: ${{ github.event.pull_request.head.sha }}`; checkout gốc không có `ref:`/`repository:`; lệnh chạy
`node goc/tu_chay/cong.js` (thư mục của checkout gốc); job tên `cong`, không `if:`; bước đầu là chặn fork;
không `${{` trong `run:`. Thêm: **chạy thật** đoạn `run:` của bước chặn fork bằng `bash` với
HEAD_REPO≠BASE_REPO → thoát ≠ 0; bằng nhau → 0 (A15 có ca chạy thật, không chỉ soi chữ).

### B7 — ghi vào `THIET_KE.md` B15
Vì sao `pull_request_target` (bản workflow trên `main`, PR không sửa được cổng); vì sao hai job; rủi ro còn lại:
code PR chạy ở `cong-chay` với token chỉ đọc, không bí mật, không lưu credential, nhưng có `sudo` → `cong-chay`
canh lỗi chứ không canh ác ý; `cong` không chạy code PR nên phạm vi / file cấm / `.github/` / phiếu không làm giả
được từ PR. Câu "code PR không đổi được tiến trình cha" ở bản kế hoạch trước là SAI (soát 4.1) — đã bỏ.

## 3. Phần C — hook mở phiên tự kéo nhánh

### Phương án
- **C-a (chọn): thêm ~22 dòng vào đầu `cai_thu_vien.sh`**, sau dòng kiểm `CLAUDE_CODE_REMOTE`
  (dùng lại luôn C1 và `cd` có sẵn), trước vòng `npm ci` (C3: kéo trước, lockfile mới thì `npm ci` ăn ngay).
  Không đổi mục SessionStart, không thêm file.
- C-b: `mo_phien.sh` mới (kéo rồi `exec` `cai_thu_vien.sh`): +1 file, +~8 dòng khung, trình cài phải đổi
  lệnh SessionStart và gỡ mục cũ. Nhiều dòng hơn. Loại. (`tu_chay/mo_phien.sh` trong Phạm vi sẽ không tạo.)

### Nội dung
```
nhanh=$(git symbolic-ref --short -q HEAD)          # C2: HEAD tách rời → rỗng
case "$nhanh" in viec/?*) ;; *) bỏ qua kéo ;; esac
git diff --quiet HEAD -- || { ⚠ "có file đang sửa dở — KHÔNG kéo"; bỏ qua kéo; }      # C4
timeout 60 git fetch -q origin "$nhanh" || { ⚠ "không kéo được (mạng?)"; bỏ qua kéo; } # C6
truoc=$(git rev-parse --short HEAD)
git merge-base --is-ancestor FETCH_HEAD HEAD && { · "máy đã có đủ (hoặc mới hơn) origin — không kéo"; bỏ qua kéo; }
git merge-base --is-ancestor HEAD FETCH_HEAD || { ✗ "nhánh ở máy và origin lệch nhau — máy DỪNG, báo chủ quán"; bỏ qua kéo; }  # C5
git merge --ff-only -q FETCH_HEAD || { ⚠ …; bỏ qua kéo; }
echo "✓ kéo nhánh $nhanh: $truoc → $(git rev-parse --short HEAD)"                       # C7
```
Lệnh git có ghi: chỉ `fetch` và `merge --ff-only`. Mọi nhánh lỗi vẫn đi tiếp tới `npm ci` và thoát 0.
Không bọc hàm: git thay file bằng inode mới nên bash vẫn đọc bản cũ qua fd đang mở (đã ghi ở
`THIET_KE.md` B14, lỗ cuối) — thêm bọc là thêm dòng không có ca đỏ thật.

### C8 — trình cài ghép hook không làm mất hook của chủ quán
Một hàm `ghepHook(ds, muc, dau)` dùng cho CẢ PreToolUse lẫn SessionStart (K4 — cùng khuôn lỗi ở
`cai_dat.js:95-100`): gỡ đúng hook của bộ khung khỏi từng mục, bỏ mục chỉ khi `hooks` rỗng; nếu đã có
đúng một mục bằng hệt `muc` thì giữ nguyên chỗ, không thì thêm vào cuối. Lần hai không đổi gì.

## 4. Phần D — người gác

- **D1 — tên công cụ: `SubagentHandback`.** Bằng chứng thật trong lượt này: agent phụ tra tài liệu của chính
  việc này chạy xong, gọi công cụ nộp báo cáo, người gác chặn — dòng nhật ký người gác lúc
  `2026-10-01T07:19:31Z`: `"cong_cu":"SubagentHandback"`, `"quyet":"CHAN"`, `"ma":"CC-LA"`, có `agent_id` của agent phụ.
  Khớp Phát hiện 1 của TU-CHAY-2 (`viec/TU-CHAY-2/trang_thai.md:32-34`): báo cáo không về, và tên đó KHÔNG
  phải `SendMessage`. Tài liệu Claude Code: chưa tra được (agent tra tài liệu là chính agent bị chặn khi nộp); căn cứ duy nhất là nhật ký người gác — tên lấy đúng từ trường `tool_name` mà Claude Code gửi cho hook, đúng điều phiếu D1 đòi ("chỉ cho qua tên tìm được"). Kiểm sống bước 4 xác nhận lại.
  Bằng chứng thứ hai: thông báo kết thúc agent của Claude Code ghi nguyên văn "The subagent ended without
  delivering a report through SubagentHandback, so no report was delivered" (agent bị chặn 2 lần, 07:19:31Z
  và 07:20:44Z).
  Sửa: thêm đúng chuỗi `'SubagentHandback'` vào `CONG_CU_DOC` (`nguoi_gac.js:103`). Không mẫu chung,
  `SendMessage` vẫn CC-LA. Ca: `SubagentHandback` → CHO; `SubagentHandbackX`, `subagenthandback`,
  `SendMessage` → CC-LA; tắt CC-DOC → ca CHO đỏ.

- **D3** tách vị từ "tên file viết thẳng" ở GIT-HOANTAC (`nguoi_gac.js:561-562`: không phải chữ, `* ? [ ] \`,
  `:`, kết thúc `/`, là thư mục) thành MỘT hàm; GIT-ADD và GIT-HOANTAC cùng dùng (K4, soát 2.4/4.2). Hệ quả thêm:
  `git add server` (thư mục) bị chặn — đúng luật "add từng file". Chặn thêm `--pathspec-from-file` ở `git add`.
  Ca chặn: 4 ca của phiếu + `git add server` + `git add --pathspec-from-file=x`. Ca cho: 3 ca của phiếu +
  `git add viec/TU-CHAY-3/trang_thai.md`.
- **K4 — `git commit` có pathspec:** `git commit -m x 'server/*.js'`, `git commit --pathspec-from-file=x`
  commit hàng loạt không qua `git add` từng file. Đề xuất dùng cùng hàm trên (+3 dòng, có ca đỏ trước) — **Q2**.
- **D4** `tu_chay/cau_hinh.json`: `file_cam` thêm `".github/**"`; lớp 1 song song: `DENY_MOI` (`cai_dat.js:24`)
  thêm `Edit(./.github/**)` (soát 4.3), có ca `DENY_MOI.every` sẵn. Mô tả G1-CAM (`nguoi_gac.js:29`) nhắc `.github`. G1-CAM chặn `Edit .github/workflows/cong.yml`;
  `git restore .github/workflows/keep-alive.yml` đi qua `ghiDuoc(…, hoanTac)` và G1-CAM đứng TRƯỚC
  G-HOANTAC (`nguoi_gac.js:176` trước `181`) → cũng bị chặn. Mỗi ca một bài.

## 5. Phần E — `/ra-soat` thuộc bộ khung
- Nguồn `tu_chay/lenh_ra_soat.md` (~70 dòng). `cai_dat.js` cài thành `.claude/commands/ra-soat.md`. Gộp ba
  bản cài (skill, ra-soat, cong.yml) vào MỘT bảng `[nguồn, đích]` trong `cai_dat.js` thay khối skill riêng
  (`113-118`) — ít dòng hơn ba khối. Bộ kiểm T4 so từng byte, giống T3 (CẢNH BÁO).
- **E2 — lệch phiếu có lý do:** phiếu ghi `git diff main...HEAD`, nhưng máy mây KHÔNG có ref `main` và người
  gác cấm `fetch` (mục 0). Dùng mốc là commit `PHIEU: <MÃ>` ĐẦU TIÊN:
  `git log --reverse -E --format=%H --grep="^PHIEU: <MÃ>([^A-Za-z0-9._-]|$)" | head -n 1` → `git diff <mốc>^ HEAD` và
  `git diff --name-only <mốc>^ HEAD`. Có ref `main` (máy nhà) thì vẫn ra cùng kết quả khi nhánh chưa gộp main.
  Chủ quán gộp `main` vào nhánh việc giữa chừng thì diff lẫn thay đổi của main — ghi ở CHƯA KIỂM.
- E3 dặn agent nộp báo cáo bằng công cụ ở D1; mẫu báo cáo thêm dòng `BÀI HỌC:`.
- E4 giữ nguyên 6 mục soát và câu "không được kết luận ĐẠT…"; bài thử kiểm chữ.

## 6. Phần F — bước 11 + 7 mục + ngân sách `KHUON_LOI.md`
- Skill thêm bước 11 (~30 dòng) đúng 4 ý F1. Bước 10 đổi "6 mục" → "7 mục"; description frontmatter cũng vậy.
- `CLAUDE.md` §7: tiêu đề, câu "bắt buộc đủ 7 mục", thêm dòng `BÀI HỌC:  KHOÁ n · NGUYÊN TẮC n · BỎ n`.
  `THIET_KE.md:313` "6 mục" → "7 mục". Hồ sơ cũ `viec/TU-CHAY-1,2/` là lịch sử, ngoài phạm vi — để nguyên.
- **F3** `cau_hinh.json` thêm `"khuon_loi_toi_da": 120`. Phép kiểm trong `thu_cong_cu.js` (thuộc `npm test` qua T1b)
  là hàm thuần `kiemKhuonLoi(chuoi, toiDa)`: gọi với chuỗi giả 121 dòng → phải trả lỗi; với file thật → không
  lỗi; thiếu khoá cấu hình → lỗi (soát 2.2: không cần tham số dòng lệnh). Đặt trong
  `kiem_tra_truoc_khi_giao.js` thì muốn thử với file giả phải chạy lồng bộ kiểm → vòng lặp; loại.
- **F4 — xếp ngăn 9 bài học 28.09–01.10:**

| # | Bài | Ngăn | Khoá ở đâu / lý do |
|---|---|---|---|
| 1 | Mở phiên từ bản chụp cũ | KHOÁ | C — `cai_thu_vien.sh` kéo nhánh; ca C1–C7 trong `thu_cong_cu.js` |
| 2 | `\` là ký tự đại diện, `git add` lọt | KHOÁ | D3 — hằng chung với GIT-HOANTAC; ca đỏ trước |
| 3 | Báo cáo agent soát không về | KHOÁ | D1 + E3 (tên công cụ cho qua, có ca thử) |
| 4 | `/ra-soat` đưa diff chưa commit | KHOÁ | E2 — diff từ mốc PHIEU; bài thử kiểm chữ lệnh trong `lenh_ra_soat.md` |
| 5 | Khoá không tự mở được từ bên trong | KHOÁ (đã có) | G1-KHUNG + deny `Edit(./.claude/**)` + D4 `.github/**`. Không thêm lời dặn |
| 6 | `git commit` không ra dòng `[nhánh mã]` → push "Everything up-to-date" | NGUYÊN TẮC | 2 dòng vào K7 (lỗi giao nhận): "Chặn: sau commit phải thấy `[viec/<MÃ> <mã>]`; push xong `git log origin/viec/<MÃ>..HEAD` phải rỗng" |
| 7 | Bài thử TU-CHAY-2 vượt ngân sách ~2 lần | BỎ | Luật "vượt 1,5 lần phải giải thích" đã có (`MAU_PHIEU.md`, `cau_hinh.json`); mới một lần |
| 8 | Đột biến "bỏ bọc hàm" không dựng được ca hỏng thật | NGUYÊN TẮC | 1–2 dòng vào K3: đột biến không dựng được ca hỏng thật thì ghi CHƯA KIỂM, không đếm là phép |
| 9 | Bài phía chủ quán/chat (Shell treo, GitHub treo, `index.lock`, đổi mã GitHub) | BỎ | Thao tác của chủ quán, đã ghi ở Sổ Autonomous; máy không gặp được (`index.lock`: máy không có lệnh xoá trong `.git`, người gác chặn) |

  Dọn (F1.3): đề xuất xoá trong `KHUON_LOI.md` K7 cụm "bảo chạy `npm run kiem` ở POS" — `CLAUDE.md` §3 đã ghi
  và chỉ là ví dụ, không có phép kiểm thay → GIỮ (không đề xuất xoá gì nếu chưa có phép kiểm làm thay).
  `KHUON_LOI.md` sau sửa ≈ 101 dòng ≤ 120.

## 7. Phần G — `MAU_PHIEU.md` (+~10 dòng)
G1 dòng "**Chờ duyệt kế hoạch:** …" kèm ghi chú bỏ khi muốn làm thẳng; G2 mục tuỳ chọn `## Bài thử đỏ`
`không — <lý do>`; G3 nhắc `.github/` máy không sửa, cổng do `cai_dat.sh` cài.

## 8. Phần H
- H2 `THIET_KE.md` B15 (~60 dòng): A, B, nguồn docs, rủi ro còn lại, C, 1A, `.github/**`, bước 11, lỗ còn hở
  (PR TU-CHAY-3 chưa được cổng soát; chủ quán admin đi tắt ruleset; GitHub `sudo`; mốc PHIEU khi gộp main).
- H3 `PHIEN_BAN` = `tu-chay 1.3.0`, sửa phép `thu_nguoi_gac.js:558-559`.
- H4 trình cài in `git add .github/workflows/cong.yml`, `git add .claude/commands/ra-soat.md`; pre-push không đổi.

## 9. Ca thử ánh xạ 1-1 với Nghiệm thu

Kho tạm + remote bare, giả lập PR bằng (base SHA, head SHA, tên nhánh). `npm test`/`--day-du` của kho tạm là
`package.json` giả (`node -e` thoát 0 hoặc 1) — đúng lệnh trong `cau_hinh.json` thật.

| Ca | Bài | File | Phải |
|---|---|---|---|
| A1 | PR đúng phạm vi, bài thử mới đỏ trên gốc/xanh trên PR, test xanh | thu_cong.js | ĐẠT |
| A2 | chỉ `*.md` + `viec/X/**`, không bài thử | thu_cong.js | ĐẠT |
| A3 | `.claude/**` + `cong.yml` = kết quả `cai_dat.js` thật | thu_cong.js | ĐẠT |
| A4 | phiếu đổi ở commit `PHIEU: X` | thu_cong.js | ĐẠT |
| A5 | đổi code, không bài thử, phiếu `## Bài thử đỏ` `không — lý do` | thu_cong.js | ĐẠT + in lý do |
| A6 | `server/b.js` ngoài phạm vi; file luật chỉ có `tu_chay/**` | thu_cong.js | ĐỎ, đúng câu |
| A7 | phiếu đổi ở commit thường; `PHIEU: X0` với mã X; commit `PHIEU: X` kèm `server/a.js`; `bien_ban_soat.json` đổi ở commit thường | thu_cong.js | ĐỎ |
| A8 | `.claude/x` lệch; `tu_chay/` đổi mà chưa cài | thu_cong.js | ĐỎ + "chủ quán chạy bash tu_chay/cai_dat.sh trên nhánh việc" |
| A9 | `keep-alive.yml` đổi; `.github/workflows/la.yml` mới; `cong.yml` lệch bản cài | thu_cong.js | ĐỎ |
| A10 | `TIEN_DO_X.json`, `.env.local`, `.replit` | thu_cong.js | ĐỎ |
| A11 | bài thử mới xanh trên gốc; bài thử sửa xanh trên gốc; bài thử `require` thư viện chưa cài → "không chạy được trên gốc" | thu_cong.js | ĐỎ |
| A12 | đổi `server/a.js`, không bài thử, không miễn | thu_cong.js | ĐỎ |
| A13 | `npm test` đỏ; `--day-du` đỏ | thu_cong.js | ĐỎ |
| A14 | nhánh `tinh-nang/x`; không phiếu; phiếu thiếu `## Phạm vi`; HEAD ≠ head | thu_cong.js | ĐỎ |
| A15 | chạy thật bước chặn fork của CẢ HAI job (HEAD_REPO≠BASE_REPO) + kiểm tĩnh. Đột biến A15 nằm ở B6 (xoá bước chặn), không ở `cong({tat})` — chặn fork ở yml, trước checkout | thu_cong.js | ĐỎ |
| tách chế độ | `tinh` không gọi `npm`/`node` bài thử/`cai_dat.js` (PATH có `npm`, `node` giả ghi nhật ký → rỗng); dữ liệu đọc qua `git show` (sửa phiếu trên đĩa mà không commit → cổng không thấy) | thu_cong.js | |
| A6–A14 đột biến | `cong({…, tat: {Ax}})` → ca chặn tương ứng ĐẠT oan → bài báo ĐỎ | thu_cong.js | mỗi mã một ca |
| A dùng lại | `cong.js` không tự định nghĩa `globRe`/khớp phạm vi; `require('./nguoi_gac')` | thu_cong.js | soi chữ |
| B1–B4, B6 | `kiemYml` trên file thật = []; ~14 đột biến chữ, mỗi cái đúng một lỗi | thu_cong.js | |
| B5 | băm sha256 của `.github/workflows/keep-alive.yml` = băm hôm nay (ghi trong bài thử). Bản cũ `git diff ff06a05 HEAD -- .github` BỎ: sẽ đỏ vĩnh viễn khi chủ quán cài `cong.yml` (soát 4.6) | thu_cong.js | |
| C1 | không REMOTE, remote đi trước → HEAD không đổi. Trên bản chưa vá XANH oan (bản cũ không kéo gì) — đỏ trước nhờ ca đối chứng C7 cùng kho: C7 đỏ trên bản cũ chứng tỏ bài thử phân biệt được (soát 3) | thu_cong_cu.js | |
| C2 | đứng `main`; HEAD tách rời; nhánh `khac` → không đổi, không fetch. Như C1: xanh trên bản cũ, ghi ở CHƯA KIỂM; đối chứng C7 | thu_cong_cu.js | |
| C3 | `git` giả ghi nhật ký: lệnh ghi chỉ `fetch`, `merge --ff-only`; kéo xong lockfile mới → `npm ci` chạy SAU kéo | thu_cong_cu.js | |
| C4 | file theo dõi đang sửa → không kéo, cảnh báo, cây giữ nguyên | thu_cong_cu.js | |
| C5b | máy đi TRƯỚC origin (commit chưa push) → "không kéo", không có chữ DỪNG (soát 4.8) | thu_cong_cu.js | |
| C5 | hai bên lệch → "máy DỪNG, báo chủ quán", HEAD giữ nguyên | thu_cong_cu.js | |
| C6 | remote hỏng → cảnh báo, thoát 0, `npm ci` vẫn chạy | thu_cong_cu.js | |
| C7 | kéo được → in `cũ → mới`, HEAD = origin | thu_cong_cu.js | |
| C8 | settings có mục SessionStart chung hook chủ quán + hook bộ khung → giữ hook chủ quán; cùng ca cho PreToolUse; cài lần hai không đổi | thu_nguoi_gac.js (baiCaiDat) | |
| D1/D2 | `SubagentHandback` → CHO; `SubagentHandbackX`, `SendMessage` → CC-LA; tên lạ → CC-LA; tắt CC-DOC → bài đỏ | thu_nguoi_gac.js | |
| D3 | 4 ca chặn + 3 ca cho của phiếu; + `git commit -m x 'server/*.js'` nếu Q2 = có | thu_nguoi_gac.js | |
| D4 | `Edit .github/workflows/cong.yml` → G1-CAM; `git restore .github/workflows/keep-alive.yml` → G1-CAM; settings sau cài có `Edit(./.github/**)` | thu_nguoi_gac.js | |
| D5 | ~400 ca cũ xanh; ca đổi kết quả ghi ở mục 10 | thu_nguoi_gac.js | |
| E1 | T4 trong bộ kiểm; trình cài chép đúng byte (baiCaiDat) | kiem_tra + thu_nguoi_gac.js | |
| E2–E4 | `lenh_ra_soat.md` có lệnh diff từ mốc PHIEU, không còn "chưa commit", có tên công cụ D1, `BÀI HỌC:`, đủ 6 mục soát + câu cấm ĐẠT | thu_cong_cu.js (baiTaiLieu) | |
| F1, F2 | skill có bước 11 với 3 ngăn KHOÁ/NGUYÊN TẮC/BỎ sau bước 10; không còn "6 mục" (báo cáo) trong skill, CLAUDE.md, THIET_KE, MAU_PHIEU, lenh_ra_soat (lenh_ra_soat có "6 mục soát" — kiểm cụm "báo cáo … 6 mục") | thu_cong_cu.js | |
| F3 | `--khuon-loi` file giả 121 dòng → ĐỎ; thật → XANH; thiếu khoá → ĐỎ | thu_cong_cu.js | |
| F4, F5 | bảng mục 6 ghi vào `trang_thai.md` `## Bài học`; mục mới trong `KHUON_LOI.md` đúng khuôn | đọc tay + F3 | |
| G1–G3 | `MAU_PHIEU.md` có 3 ý mới | thu_cong_cu.js | |
| H1 | `npm test` và `node kiem_tra_truoc_khi_giao.js --day-du` xanh, có T1c chạy `thu_cong.js` | chạy tay, ghi `trang_thai.md` | |
| H2, B7 | `THIET_KE.md` có mục `## B15`, nhắc `pull_request_target`, hai job, `sudo`, "chưa được cổng soát", "admin" | thu_cong_cu.js (soi chữ) | |
| H3 | PHIEN_BAN `tu-chay 1.3.0` | thu_nguoi_gac.js | |
| H4 | in 2 lệnh `git add` mới; lần hai không đổi; ca từ chối cũ; pre-push giữ | thu_nguoi_gac.js | |

`kiem_tra_truoc_khi_giao.js`: thêm `chayBaiThat('tu_chay/thu_cong.js')` (T1c) và T4. Bài thử chạy trên bản
CHƯA vá trước (lưu `bang_chung_do.txt`).

## 10. Luồng hợp lệ phải KHÔNG bị chặn (K5) và ca cũ đổi kết quả

- Cổng: PR của chính bộ khung sau khi chủ quán chạy `cai_dat.sh` (A3); PR chỉ tài liệu (A2); PR sửa phiếu
  bằng commit `PHIEU:` (A4); PR xoá một file trong phạm vi; PR đổi tên file trong phạm vi.
- Hook kéo: phiên mới đứng đúng nhánh, không có gì mới → không in lỗi, không đổi; máy có commit chưa push → không báo DỪNG oan; file chưa theo dõi (`??`)
  không cản kéo (C4 chỉ xét file đã theo dõi).
- Người gác: `git add server/index.js`, `git add "cong_cu/thu_P20.js"`, `git add viec/X/trang_thai.md`, tên
  file có dấu; `git restore server/a.js` vẫn CHO; Edit `tu_chay/*` trong phạm vi vẫn CHO.
- Trình cài: hook PostToolUse, Stop, SessionStart khác của chủ quán giữ nguyên.
- **Bị chặn có chủ ý (theo chữ phiếu A8):** chủ quán sửa tay một file trong `.claude/` (vd. `.claude/hooks/nhac_sau_sua.cjs`)
  mà không qua `tu_chay/` + `cai_dat.sh` → cổng ĐỎ. Chủ quán biết trước; muốn sửa hook riêng thì qua bộ khung.
- **Ca cũ đổi kết quả (D5):** `thu_nguoi_gac.js:130` coi `SendMessage` là công cụ lạ → GIỮ NGUYÊN (D1 là `SubagentHandback`, không phải `SendMessage`). Ca cũ đổi: PHIEN_BAN (`thu_nguoi_gac.js:561`, 1.2.0 → 1.3.0, H3). Hành vi đổi theo D4: B-MANOI (`nguoi_gac.js:448`) sẽ chặn `node -e`/`python3 -c`/heredoc nhắc `.github/` — đúng ý (file cấm), ghi THIET_KE. D3: `git add <thư mục>` từ CHO thành GIT-ADD.
  `cai_dat.js` hành vi lọc mục chung (ca `thu_nguoi_gac.js:795-806`) — vẫn ĐẠT (mục chỉ chứa hook bộ khung
  thì bị bỏ như cũ).

## 11. Ngân sách so với phiếu

| Phần | Phiếu | Kế hoạch |
|---|---|---|
| `cong.js` | ~150 | ~185 (hai chế độ, đọc qua `git show`, `npm ci` trong cổng) |
| `cong_github.yml` | ~45 | ~60 (hai job) |
| hook kéo | ~30 | ~22 (C-a) |
| `cai_dat.js` | +35 | +~30 (bảng bản cài + `ghepHook`, bớt khối skill) |
| `nguoi_gac.js` | +10 | +~18 (tách `xetPhamVi`, `phamViTuChu`, hàm tên file, D1, D3, Q2) |
| `kiem_tra` | +20 | +~12 (T1c, T4) |
| `cau_hinh.json` | +2 | +2 |
| thử | ~400 | `thu_cong.js` ~290, `thu_nguoi_gac.js` +~45, `thu_cong_cu.js` +~85 |
| tài liệu | ~200 | như phiếu |

## Câu hỏi cho chủ quán

- **Q1 — định nghĩa "bài thử".** `thu_muc_bai_thu` = `cong_cu/` có cả `do_chuathu.js`, `test-xlsx.js`
  (công cụ, không phải bài thử). Theo đúng chữ phiếu, sửa chúng thì cổng sẽ chạy chúng trên code gốc và
  đòi chúng ĐỎ. Đề xuất: bài thử = file `thu_*.js` trong `thu_muc_bai_thu` hoặc `tu_chay/thu_*.js`.
  Chủ quán chọn: (a) theo đề xuất, (b) đúng chữ phiếu.
- **Q2 — K4 `git commit <pathspec>` có ký tự đại diện.** Chặn luôn trong việc này (+3 dòng, +2 ca), hay
  ghi Phát hiện để sau?
- **Q3 — `actions/setup-node`.** Máy GitHub `ubuntu-latest` có sẵn Node; bỏ `setup-node` thì bớt một
  action và ~3 dòng, nhưng phiên bản Node theo ảnh máy của GitHub. Đề xuất GIỮ `setup-node` ghim SHA,
  `node-version: 20`. Đồng ý?
- **Q4 — E2 lệch chữ phiếu** (`main...HEAD` → mốc commit `PHIEU:` đầu tiên), lý do ở mục 5. Đồng ý?
- **Q5 — hai job thay vì một** (phiếu B4 ghi "một job tên `cong`"). Lý do: soát độc lập (4.1) chỉ ra code PR
  chạy trên máy có `sudo` làm giả được mọi thứ cổng đọc sau đó. Job `cong` không chạy code PR → phạm vi, file cấm,
  `.github/`, phiếu chắc chắn. Job `cong-chay` chạy bài thử/`npm test`. Ruleset tích cả hai. Đồng ý? (Không đồng ý:
  một job, đọc hết vào bộ nhớ trước, code PR chạy cuối — vẫn giả được nếu PR dùng `sudo`.)

## Soát độc lập kế hoạch (bước 3)
Agent phụ chỉ đọc, 4 câu. Báo cáo không nộp được bằng công cụ thường (SubagentHandback bị CC-LA — lần thứ ba
hôm nay), phải ghi ra file nháp. Kết luận của người soát: "ĐẠT về phạm vi, CHƯA ĐẠT để duyệt". Đã sửa theo:
4.1 hai chế độ/hai job + đọc qua `git show`; 4.2 hàm tên file chung, chặn thư mục + `--pathspec-from-file`;
4.3 `Edit(./.github/**)` vào DENY_MOI; 4.4 `bien_ban_soat.json`; 4.5 neo regex `PHIEU:`, commit `PHIEU:` chỉ đổi
`viec/<MÃ>/`; 4.6 bỏ ca B5 cũ; 4.7 `npm ci` trước A11, thiếu thư viện = ĐỎ; 4.8 máy đi trước origin; 4.9 dự phòng
check-run + `edited`/up-to-date vào B15; 4.10 liệt kê ở mục 10; bảng mục 9 thêm H1, H2/B7, ghi chú A15, C1/C2, F2;
sửa số dòng (mục 0). Không sửa: Q3 (người soát nghiêng về BỎ `setup-node`) — để chủ quán chọn.
E2 cũng phải neo: `--grep="^PHIEU: <MÃ>([^A-Za-z0-9._-]|$)" -E` (soát 4.5).
