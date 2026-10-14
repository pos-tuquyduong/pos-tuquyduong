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
| 2 | 24 tiến trình | (điền khi xong) | |

Kết luận đến giờ:
1. **Phụ thuộc thời gian thấy được:** tổng thời gian. Máy bận gấp ~2,5 lần là vượt hạn 120 s của `chayBaiThat` → bộ kiểm ghi
   ✗ `spawnSync … ETIMEDOUT` → commit trượt. Không ca nào bên trong `thu_cong.js` đỏ ở tải 8.
2. **"Received null"** = `cong.js` sập khi `blob()` trả `null` rồi bị ghi vào `fs.writeFileSync` (`cong.js:268/325/327`). `blob()` trả
   `null` cả khi `spawnSync('git', …)` KHÔNG chạy được (`status` null — EAGAIN / ENOMEM / bị giết), không chỉ khi file không có. Trên máy
   này CHƯA tái hiện được ở tải CPU; giả thuyết: Replit bị hạn tiến trình / bộ nhớ khi bận → một lần sinh `git` hỏng → cổng sập. **Chưa
   chứng minh** — ghi CHƯA KIỂM.
3. **Sửa gốc gọn?** Cả hai chỗ nằm trong `tu_chay/` (thu_cong.js tự chạy ~67 s; cong.js bỏ qua `status === null`) — phiếu CẤM sửa
   `tu_chay/`. Đề xuất cho việc cài sau (ghi `## Phát hiện` của trang_thai): (a) `cong.js` coi `blob` hỏng vì không chạy được git là lỗi
   rõ ràng chứ không ghi `null`; (b) chia `thu_cong.js` thành lượt song song (khuôn TACH-GL, đã nêu ở AU2-10). Việc này chỉ làm A2.

## 2. A2 — chạy thu_cong.js khi và chỉ khi có thể cần

**Phương án A (chọn)** — 1 file (`kiem_tra_truoc_khi_giao.js`), ~16 dòng thay dòng `:553`:
```js
// TOC-DO-1: thu_cong.js (67 s riêng, 150–176 s khi máy bận > hạn 120 s) chỉ kiểm bộ khung cổng. Chạy khi --day-du, khi đổi
// tu_chay/ .claude/ .github/ so với gốc chung với origin/main (commit · vùng chờ · cây làm việc · file mới), hoặc không xác định được.
function lyDoChayThuCong() {
  if (DAY_DU) return '--day-du';
  const KHUNG = ['tu_chay', '.claude', '.github'];
  const g = (...a) => spawnSync('git', a, { cwd: GOC, encoding: 'utf8', timeout: 30000 });
  const mb = g('merge-base', 'HEAD', 'origin/main');
  if (mb.status !== 0) return 'không xác định được gốc chung với origin/main';
  const da = g('diff', '--name-only', mb.stdout.trim(), 'HEAD', '--', ...KHUNG);   // đã commit trên nhánh
  const dang = g('status', '--porcelain', '--', ...KHUNG);                         // vùng chờ + cây làm việc + file mới
  if (da.status !== 0 || dang.status !== 0) return 'git hỏng';
  return (da.stdout + dang.stdout).trim() ? 'đổi tu_chay/.claude/.github' : null;
}
if (lyDoChayThuCong()) chayBaiThat('tu_chay/thu_cong.js');
else dong.push('  – bỏ qua thu_cong.js — không đổi tu_chay/.claude/.github');
```
- `git status` dùng `GIT_INDEX_FILE` của môi trường → trong hook pre-commit (kể cả `git commit -a` / `git commit <file>` dùng index tạm)
  thấy đúng vùng chờ sắp commit.
- Dòng bỏ qua đi vào `dong` bằng dấu `–`, KHÔNG gọi `pass()` → không đếm PASS giả. PASS của bản nhanh giảm 1 khi bỏ qua (ghi rõ trong A5).
- Mọi lỗi (không git, không `origin/main`, kho nông, git quá 30 s) → trả lý do ≠ null → CHẠY.

**Phương án B (loại)** — ba lệnh `git diff <mb>` + `git diff --cached <mb>` + `git ls-files --others`: cùng kết quả, thêm 2 dòng.
**Phương án C (loại)** — chia `thu_cong.js` song song: sửa `tu_chay/`, ngoài phạm vi (Cấm).

## 3. Bài thử `cong_cu/thu_TOCDO1.js` (~90 dòng)
Khuôn `cong_cu/thu_gia_lap.js` C3: cắt khối THẬT từ `kiem_tra_truoc_khi_giao.js` — từ `function lyDoChayThuCong(` tới hết dòng
`chayBaiThat('tu_chay/thu_cong.js')` — chạy bằng `new Function('spawnSync','GOC','DAY_DU','chayBaiThat','dong', khối)`, `chayBaiThat`
giả ghi lại lời gọi. Bản gốc chưa có hàm → khối = đúng dòng gọi trần → luôn chạy → các ca "phải bỏ qua" ĐỎ đúng lý do (K3).
Đường dẫn bộ kiểm lấy từ `--kiem <file>` (mặc định file thật) để `dot_bien.py` chạy trên bản sao.
Mỗi ca dựng kho git tạm: remote trần `origin` có `main`, bản clone, rồi phá ĐÚNG một điều kiện.

| ca | dựng | mong | nghiệm thu |
|---|---|---|---|
| T1 | clone sạch, HEAD = origin/main | bỏ qua + có dòng "bỏ qua thu_cong.js — không đổi tu_chay/.claude/.github", không gọi | A2, A3 |
| T2 | commit đổi `server/a.js` + `viec/X/phieu.md` + `TIEN_DO_POS.json` | bỏ qua (K5: commit sổ/phiếu/code quầy) | A2, mục tiêu |
| T3 | commit đổi `tu_chay/a.js` | chạy | A2, A3 |
| T4 | chỉ vùng chờ: `git add tu_chay/a.js` rồi trả cây làm việc về như cũ | chạy | A3 (quên vùng chờ) |
| T5 | chỉ cây làm việc: sửa `tu_chay/a.js`, chưa add | chạy | A2 |
| T6 | file mới chưa theo dõi `tu_chay/moi.js` | chạy | A2 |
| T7 | commit đổi `.claude/settings.json` | chạy | A2 |
| T8 | commit đổi `.github/workflows/x.yml` | chạy | A3 (quên .github) |
| T9 | không đổi gì + `DAY_DU = true` | chạy | A3 |
| T10 | xoá remote `origin` (không có origin/main) | chạy | A3 |
| T11 | thư mục không phải kho git | chạy | A2 (mặc định an toàn) |
| T12 | origin/main đi trước có đổi `tu_chay/`, nhánh chưa gộp | bỏ qua (gốc chung; đổi đó không thuộc nhánh) | A2 K5 |
| T13 | `GIT_INDEX_FILE` = index tạm có `tu_chay/a.js` đổi (như `git commit <file>`), index chính sạch | chạy | A2 (vùng chờ trong hook) |
| T14 | file `tu_chay_ghi.md` ở gốc (tên gần giống) | bỏ qua | K5 (tiền tố) |
| T15 | khối cắt được có lời gọi `chayBaiThat('tu_chay/thu_cong.js')` đúng 1 lần trong file | — | chống "dời lời gọi ra ngoài khối" |

**Đột biến `viec/TOC-DO-1/dot_bien.py`** (khuôn GOI-1: chép bộ kiểm ra thư mục tạm, thay chuỗi khớp đúng số lần, chạy bài trên bản sao,
đạt = thoát ≠ 0 VÀ thấy dòng ✗ của ca phải bắt):
- `BV-TOCDO1-LUON-CHAY` (gỡ vá: hàm luôn trả lý do) → T1 · `VS-TOCDO1-LUON-BO-QUA` (luôn null) → T3
- `VS-TOCDO1-QUEN-VUNG-CHO` (`status --porcelain` → `diff --name-only` = chỉ cây làm việc) → T4
- `VS-TOCDO1-QUEN-GITHUB` (bỏ `'.github'` khỏi KHUNG) → T8 · `VS-TOCDO1-BO-DAYDU` (bỏ dòng DAY_DU) → T9
- `VS-TOCDO1-KHONG-ORIGIN-BO-QUA` (mb hỏng → null) → T10 · `VS-TOCDO1-QUEN-COMMIT` (bỏ `da`) → T3
- `VS-TOCDO1-GOI-TRAN` (lời gọi không còn điều kiện) → T1

## 4. A4 — cổng GitHub vẫn chạy thu_cong.js (chỉ đọc, không sửa)
`tu_chay/cau_hinh.json` `lenh_kiem_day_du = ["node kiem_tra_truoc_khi_giao.js --day-du"]`; `tu_chay/cong.js:287–290` chạy
`CH.lenh_bai_thu` + `CH.lenh_kiem_day_du` ở chế độ `chay`; `cong_github.yml:82` bước "Cổng chạy … npm test, --day-du". `--day-du` → T9
luôn chạy. Kho checkout trên GitHub có `origin/main` hay không: CHƯA đọc — không cần cho A4 vì `--day-du` đã đủ. Ghi bằng chứng vào trang_thai.

## 5. A5 — đo
`npm test` trên HEAD gốc và sau vá, CHẠY RIÊNG (không tải song song), mỗi bên 2 lần; `--day-du` sau vá xanh, 0 CẢNH BÁO.

## 6. Đường song song (K4) đã rà
- Lời gọi thu_cong.js: 1 chỗ (`:553`). `thu_nguoi_gac.js` (`:549`), `thu_cong_cu.js` (`:551`) cũng là bài `tu_chay/` chạy ở bản nhanh —
  phiếu chỉ nói thu_cong.js: KHÔNG đổi, đo thời gian ghi vào `## Phát hiện` để chủ quán quyết.
- `cong_cu/thu_gia_lap.js` C3 cắt `chayBaiThat` — hàm không đổi; C3f đếm lời gọi bật `canhGan` — không đổi.

## 7. Luồng hợp lệ phải KHÔNG bị chặn / bỏ sót (K5)
Commit sổ / phiếu / code quầy → bỏ qua (T2, T14). Commit việc bộ khung (`tu_chay/`, bản cài `.claude/`, workflow) dù đã commit, đang chờ,
đang sửa, file mới, index tạm → chạy (T3–T8, T13). Cổng GitHub (`--day-du`), máy không có remote → chạy (T9–T11). Main đi trước → không
kéo theo (T12).

## 8. Ngân sách
Code ~16 dòng (≤ 30–60) · thử ~90 dòng + dot_bien.py ~40 (≈ 80 dòng thử của phiếu, vượt nhẹ vì 15 ca + 8 đột biến).
