# TOC-DO-1 — kế hoạch (chờ chủ quán duyệt)

## 0. Đã đọc trong lượt này
- `kiem_tra_truoc_khi_giao.js:28` `DAY_DU`; `:478–490` `chayBaiThat` (hạn mặc định 120 s; quá hạn → `r.error` ETIMEDOUT);
  `:553` lời gọi DUY NHẤT `chayBaiThat('tu_chay/thu_cong.js')` (Grep `thu_cong\.js` trên `*.js,*.cjs,*.sh,*.yml,*.json`: chỉ chỗ này
  gọi; còn lại là chú thích / bản cài `.claude/tu_chay/`).
- `tu_chay/thu_cong.js`: chỉ chép `tu_chay/` (`:59–61`) vào kho git tạm, chạy `tu_chay/cong.js`; các hạn bên trong: git 30 s (`:35`),
  `cai_dat.js` 60 s (`:85`), cổng 300 s (`:110`), nạp cấu hình 30 s (`:683`). `tu_chay/cai_dat.js:76,93` hạn 10 s (git config, node --check).
- `tu_chay/cong.js:30–33` `blob()` trả `null` khi `git cat-file` không thoát 0; `:268, :325, :327` ghi thẳng `blob(...)` vào
  `fs.writeFileSync` → `null` thì TypeError "…Received null" → `:344` "[CONG] cổng gặp lỗi bất ngờ — ĐỎ: …Received null".
  (Cùng dấu AUDIT-2 ghi ở `viec/AUDIT-2/bao_cao.md:25`, AU2-5.)

## 1. A1 — nguyên nhân (số đo trên bản sao `git archive HEAD` ở thư mục nháp, máy mây 4 lõi)
| lần | tải song song | thời gian | kết quả |
|---|---|---|---|
| 1 | không | 67,1 s | 318 phép · 0 hỏng |
| 3 | 8 tiến trình `for(;;){}` | 168,2 / 176,3 / 153,6 s | 318 phép · 0 hỏng (cả 3) |
| 1 | 24 tiến trình | 325,7 s | 318 phép · 0 hỏng |

Kết luận (đã sửa sau vòng soát kế hoạch):
1. **Sự cố thật KHÔNG phải do quá hạn.** Khi quá hạn, `chayBaiThat` chỉ ghi `r.error.message` = "spawnSync … ETIMEDOUT"
   (`kiem_tra_truoc_khi_giao.js:484–486`; thử `spawnSync(..., {timeout:300})` → `null SIGTERM … ETIMEDOUT`). Phiếu ghi sự cố có dòng ✗
   ghép từ đầu ra + "Received null", nghĩa là `thu_cong.js` tự thoát ≠ 0 vì một phép bên trong hỏng.
2. **"Received null" là `cong.js` sập:** `blob()` (`tu_chay/cong.js:30–33`) trả `null` mỗi khi `git cat-file` không thoát 0. Điều này
   xảy ra cả khi KHÔNG sinh được tiến trình git (`status` null: EAGAIN / ENOMEM / bị giết), không chỉ khi file không có. `:268, :325, :327`
   ghi thẳng kết quả vào `fs.writeFileSync` → TypeError "…Received null" → `:344` "[CONG] cổng gặp lỗi bất ngờ". Chỉ tải CPU thì KHÔNG
   tái hiện được (4 lần ở trên, đến 325 s, đều 0 hỏng), nên phụ thuộc "máy bận" không đơn thuần là chậm. Giả thuyết: Replit bận thì
   chạm giới hạn tiến trình / bộ nhớ, và một lần sinh `git` hỏng. Người gác chặn `ulimit`, nên KHÔNG dựng được giới hạn tiến trình →
   **CHƯA KIỂM** trên Replit. Bước làm (sau duyệt): dựng TẤT ĐỊNH trên bản sao nháp — đặt `git` giả ở đầu PATH, tự giết mình ở `cat-file`
   → cổng ra đúng "Received null". Cách này chứng minh CƠ CHẾ, không chứng minh tần suất trên Replit.
3. **Phụ: tổng thời gian.** Máy bận khoảng 2,5 lần là vượt hạn 120 s → đỏ dạng ETIMEDOUT (AU2-10 đã gặp). A2 cũng gỡ đường này cho
   commit thường.
4. **Có cách sửa gốc gọn, nhưng nằm trong `tu_chay/`** (CẤM): `blob()` phân biệt "không có file" với "git không chạy được" và ném lỗi
   rõ; thêm ca thử "git hỏng giữa chừng". Phần này ghi vào `## Câu hỏi` của trang_thai để chủ quán mở việc cài. Việc này chỉ làm A2.

## 2. A2 — chạy thu_cong.js khi và chỉ khi có thể cần

**Phương án A (chọn)** — 1 file (`kiem_tra_truoc_khi_giao.js`), ~17 dòng thay dòng `:553`:
```js
// TOC-DO-1: thu_cong.js (67 s riêng, 150–325 s khi máy bận) chỉ kiểm bộ khung cổng. Chạy khi --day-du, khi đổi tu_chay/ .claude/
// .github/ so với gốc chung với origin/main (commit · vùng chờ · cây làm việc · file mới), hoặc khi không xác định được.
function lyDoChayThuCong() {
  if (DAY_DU) return '--day-du';
  const KHUNG = ['tu_chay', '.claude', '.github'];
  const g = (...a) => spawnSync('git', ['--no-optional-locks', ...a], { cwd: GOC, encoding: 'utf8', timeout: 30000 });
  const mb = g('merge-base', 'HEAD', 'origin/main');
  if (mb.status !== 0) return 'không xác định được gốc chung với origin/main';
  const da = g('diff', '--name-only', mb.stdout.trim(), 'HEAD', '--', ...KHUNG);                  // đã commit trên nhánh
  const dang = g('status', '--porcelain', '--untracked-files=all', '--', ...KHUNG);              // vùng chờ + cây làm việc + file mới
  if (da.status !== 0 || dang.status !== 0) return 'git hỏng';
  const f = (da.stdout + dang.stdout).trim().split('\n')[0];
  return f ? 'đổi ' + f : null;
}
const lyDoThuCong = lyDoChayThuCong();
if (lyDoThuCong) { dong.push(`  – chạy thu_cong.js: ${lyDoThuCong}`); chayBaiThat('tu_chay/thu_cong.js'); }
else dong.push('  – bỏ qua thu_cong.js — không đổi tu_chay/.claude/.github');
```
- `git status` dùng `GIT_INDEX_FILE` của môi trường, nên trong hook pre-commit (cả `git commit -a` / `git commit <file>` dùng index tạm)
  thấy đúng vùng chờ sắp commit. `--untracked-files=all` đè cấu hình `status.showUntrackedFiles=no`. `--no-optional-locks`: không ghi
  lại index trong lúc hook chạy.
- File bị `.gitignore` che (`.claude/settings.local.json`) không tính. File CHƯA theo dõi khác trong `.claude/` (vd. `.claude/worktrees/`)
  → chạy (chạy thừa là hướng an toàn). Dòng "chạy thu_cong.js: đổi <file>" cho chủ quán thấy ngay vì sao chạy.
- `assume-unchanged` / `skip-worktree` / fsmonitor che thay đổi ở cây làm việc: ca biên, không thử — ghi CHƯA KIỂM.
- Dòng `–` không gọi `pass()` → không đếm PASS giả. Khi bỏ qua, PASS của bản nhanh giảm 1 (ghi ở A5).
- Mọi lỗi (không có git, không có `origin/main`, kho nông không có tổ tiên chung, git quá 30 s) → lý do ≠ null → CHẠY.

**Phương án B (loại)** — ba lệnh `git diff <mb>` + `git diff --cached <mb>` + `git ls-files --others`: cùng kết quả, thêm 2 dòng.
**Phương án C (loại)** — chia `thu_cong.js` song song / sửa `blob()`: phải sửa `tu_chay/`, ngoài phạm vi (Cấm) → `## Câu hỏi`.

## 3. Bài thử `cong_cu/thu_TOCDO1.js` (~80 dòng)
- **Khuôn:** như `cong_cu/thu_gia_lap.js` C3, cắt khối THẬT từ bộ kiểm — từ `function lyDoChayThuCong(` tới hết dòng chứa `bỏ qua thu_cong.js`.
- **Trên bản gốc** (chưa có hàm): khối = đúng dòng gọi trần `chayBaiThat('tu_chay/thu_cong.js');`. Tìm dòng này rõ ràng; không thấy thì
  bài ĐỎ "không thấy lời gọi". Khối gốc luôn chạy, nên các ca "phải bỏ qua" ĐỎ đúng lý do (K3).
- **Cách chạy khối:** `new Function('spawnSync','GOC','DAY_DU','chayBaiThat','dong', khối)`, với `chayBaiThat` giả ghi lại lời gọi.
- **Môi trường:** mọi lệnh git của bài (cả trong khối) chạy với môi trường đã bỏ `GIT_*` (như `envSach` của `tu_chay/thu_cong.js`). Nhờ vậy
  khi bài chạy trong hook pre-commit thật, index của kho thật không rò vào kho tạm. Riêng T11 đặt `GIT_INDEX_FILE` qua hook thật.
- **Bản sao:** đường dẫn bộ kiểm lấy từ `--kiem <file>` (mặc định là file thật) để `dot_bien.py` chạy trên bản sao.
- **Kho tạm:** remote trần `origin` có `main`, cộng một bản clone; mỗi ca phá ĐÚNG một điều kiện.

| ca | dựng | mong | nghiệm thu |
|---|---|---|---|
| T1 | clone sạch, HEAD = origin/main | bỏ qua, có dòng "bỏ qua thu_cong.js — không đổi tu_chay/.claude/.github", không gọi | A2, A3 |
| T2 | commit đổi `server/a.js` + `viec/X/phieu.md` + `TIEN_DO_X.json` + `tu_chay_ghi.md` (tên gần giống) | bỏ qua | K5 commit thường |
| T3a/b/c | commit đổi một file trong `tu_chay/` · `.claude/` · `.github/` | chạy | A2, A3 (quên .github) |
| T4 | chỉ vùng chờ: `git add tu_chay/a.js` rồi trả cây làm việc về như cũ | chạy | A3 (quên vùng chờ) |
| T5 | chỉ cây làm việc: sửa `tu_chay/a.js`, chưa add | chạy | A2 |
| T6 | file mới chưa theo dõi `tu_chay/moi.js` + `git config status.showUntrackedFiles no` | chạy | A2 |
| T7 | không đổi gì + `DAY_DU = true` | chạy | A3 |
| T8 | xoá remote `origin` (không có origin/main) | chạy | A3 |
| T9 | thư mục không phải kho git | chạy | A2 mặc định an toàn |
| T10 | origin/main đi trước có đổi `tu_chay/`, nhánh chưa gộp | bỏ qua | K5 (main không kéo theo) |
| T11a/b | hook pre-commit THẬT trong kho tạm chạy khối: `git commit tu_chay/a.js` (index tạm) · `git commit -a` | hook in "chạy" | A2 vùng chờ trong hook |

**Bằng chứng đỏ:** `viec/TOC-DO-1/bang_chung_do.txt` ghi đầu ra của bài trên bộ kiểm gốc (ĐỎ ở T1, T2, T10) và dòng
`SỐ CA cong_cu/thu_TOCDO1.js: <N>` (cổng A16).

**Đột biến `viec/TOC-DO-1/dot_bien.py`** theo khuôn GOI-1: chép bộ kiểm ra thư mục tạm, thay chuỗi khớp đúng số lần, chạy bài trên bản sao.
Đạt = thoát ≠ 0 VÀ thấy dòng ✗ của đúng ca phải bắt.

| đột biến | làm gì | ca phải bắt |
|---|---|---|
| `BV-TOCDO1-LUON-CHAY` | gỡ vá: hàm luôn trả lý do | T1 |
| `VS-TOCDO1-LUON-BO-QUA` | hàm luôn trả null | T3a |
| `VS-TOCDO1-QUEN-VUNG-CHO` | `status --porcelain …` → `diff --name-only` (chỉ còn cây làm việc) | T4 |
| `VS-TOCDO1-QUEN-GITHUB` | bỏ `'.github'` khỏi KHUNG | T3c |
| `VS-TOCDO1-BO-DAYDU` | bỏ dòng DAY_DU | T7 |
| `VS-TOCDO1-KHONG-ORIGIN-BO-QUA` | merge-base hỏng → trả null | T8 |
| `VS-TOCDO1-THEO-CAU-HINH` | bỏ `--untracked-files=all` | T6 |

## 4. A4 — cổng GitHub vẫn chạy thu_cong.js (chỉ đọc, không sửa)
- `tu_chay/cau_hinh.json`: `lenh_kiem_day_du = ["node kiem_tra_truoc_khi_giao.js --day-du"]`.
- `tu_chay/cong.js:287–290` chạy `CH.lenh_bai_thu` + `CH.lenh_kiem_day_du` ở chế độ `chay`.
- `cong_github.yml:82`: bước "Cổng chạy … npm test, --day-du".
- Có `--day-du` thì luôn chạy (T7).
- `npm test` trần trên GitHub: checkout có `origin/main` / tổ tiên chung hay không thì CHƯA đọc. Không có → như T8, vẫn chạy; có → chạy theo
  file đổi. A4 đứng được nhờ `--day-du`.
- Ghi các bằng chứng này vào trang_thai.

## 5. A5 — đo
`npm test` trên HEAD gốc và sau vá, CHẠY RIÊNG (không tải song song), mỗi bên 2 lần; `--day-du` sau vá xanh, 0 CẢNH BÁO.

## 6. Đường song song (K4) đã rà
- Lời gọi thu_cong.js: 1 chỗ (`:553`).
- `thu_nguoi_gac.js` (`:549`) và `thu_cong_cu.js` (`:551`) cũng là bài `tu_chay/` chạy ở bản nhanh. Phiếu chỉ nói thu_cong.js nên KHÔNG đổi;
  đo thời gian, ghi vào `## Phát hiện` để chủ quán quyết.
- Sửa gốc trong `tu_chay/` (blob null, chia lượt) → `## Câu hỏi` (theo phiếu: chủ quán mở việc cài).
- `cong_cu/thu_gia_lap.js` C3 cắt `chayBaiThat` — hàm này không đổi. C3f đếm lời gọi bật `canhGan` — không đổi (lời gọi mới vẫn 1 đối số).

## 7. Luồng hợp lệ phải KHÔNG bị chặn / bỏ sót (K5)
- Commit sổ / phiếu / code quầy → bỏ qua (T2).
- Commit việc bộ khung (`tu_chay/`, bản cài `.claude/`, workflow) → chạy, dù thay đổi đã commit, đang ở vùng chờ, đang sửa, là file mới,
  bị cấu hình ẩn file mới, hay nằm ở index tạm của hook (T3–T6, T11).
- Cổng GitHub (`--day-du`), máy không có remote, thư mục không có git → chạy (T7–T9).
- Main đi trước → không kéo theo (T10).

## 8. Ngân sách
- Code ~17 dòng (≤ 30–60).
- Thử ~80 dòng (12 ca + 2 ca hook thật) + dot_bien.py ~35 dòng.
- Vòng soát kế hoạch đề nghị cắt còn 8 ca. Tôi giữ 14 ca vì mỗi ca thêm chỉ 1–3 dòng và khoá một đường mà mã mẫu đã có (vd. T6 cấu hình,
  T10 main đi trước).
