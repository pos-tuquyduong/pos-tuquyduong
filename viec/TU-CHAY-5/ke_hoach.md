# TU-CHAY-5 — kế hoạch (chờ chủ quán duyệt)

Nền: `5ad35ea PHIEU: TU-CHAY-5` (cha `c18ee16` sổ v26 ← `befc6ad` Merge PR #13 TACH-GL), tu-chay 1.4.0. Máy mây 4 lõi
(`node -p "require('os').cpus().length"`).

**Phạm vi kế hoạch theo lời chốt chủ quán 11.10:** nhóm A (A1–A4), D5, D6 DỜI sang AUDIT-2 — kế hoạch này KHÔNG có mục nào cho
chúng. Mục F chỉ áp cho B, C, D1–D4, E. Hệ quả cho các mục còn lại (chỉ cắt phần trỏ tới mục đã dời, không cắt gì khác):
- E1: B10 KHÔNG thêm `dot_bien_bb.py` (thuộc A1); vẫn thêm cách chia lượt.
- E3: `MAU_PHIEU.md` chỉ nhắc dòng `HEAD ĐÃ KIỂM` (C1); KHÔNG nhắc `dot_bien_bb.py` (A4).
- `tu_chay/lenh_ra_soat.md` (chỉ A4 cần) → không sửa. `cong_cu/gia_lap/dot_bien_bb.py`, `cong_cu/gia_lap/bat_bien.js`,
  `viec/HOC-2b/kiem_neo.py`, `cong_cu/ban_sao_goc.py` → không đụng.

Mọi số dòng dưới đây đọc trong lượt này (K1).

---

## 1. Số đo trên gốc 5ad35ea (11.10.2026, máy mây 4 lõi, chạy RIÊNG lần lượt — `scratchpad/do.js`)

| Lệnh | Thời gian | Kết quả |
|---|---|---|
| `node tu_chay/thu_nguoi_gac.js` | 7,3 s | 798/798 ca người gác · 173 phép khác · XANH |
| `node tu_chay/thu_cong.js` | 66,3 s | 260 phép · 0 chỗ hỏng |
| `node tu_chay/thu_cong_cu.js` | 4,1 s | 85 phép · 0 chỗ hỏng |
| `node cong_cu/thu_gia_lap.js` | SO_THUGL | SO_THUGL_KQ |
| `node kiem_tra_truoc_khi_giao.js --day-du` | SO_DAYDU | SO_DAYDU_KQ |
| `python3 viec/TACH-GL/dot_bien.py -j 4` | SO_DB_TACH | SO_DB_TACH_KQ |
| `python3 viec/LUOI-1/dot_bien.py -j 4` | (LUOI-1 trang_thai:684 ghi 247 s; đo lại ở bước 6) | |
| `node viec/LUOI-1/do_thoi_gian.js kb` | — | **ném lỗi** "neo đo không khớp: const tong = \`Giả lập:" (D4 đỏ trên gốc) |

### Ước lượng thời gian máy cho cả việc (từ số đo trên, không đoán)

| Khâu | Số lần × thời gian | Phút |
|---|---|---|
| Bài thử đỏ trên gốc: thu_nguoi_gac + thu_cong + thu_cong_cu + thu_gia_lap | 1 × (7 + 66 + 4 + THUGL) s | ~TONG_DO |
| Vòng sửa (mỗi vòng chạy lại bài đổi + npm test) | ~6 vòng × (~2,5 phút) | ~15 |
| Kiểm cuối: `npm test`, `--day-du` | 1 × DAYDU | ~DAYDU_P |
| F: ca tín hiệu/thời gian ×3 (thu_gia_lap đủ ×3, chạy riêng) | 3 × THUGL | ~THUGL3 |
| F: đột biến cũ TACH-GL 29 + LUOI-1 80 | DB_TACH + ~4 phút | ~DB_P |
| Đột biến của việc (`viec/TU-CHAY-5/dot_bien.py`, mục 7) ~12 đột biến | thu_nguoi_gac/thu_cong/thu_gia_lap theo từng cái | ~DB_VIEC |
| `/ra-soat` × tối đa 3 vòng (mỗi vòng chạy lại bộ đổi) | | ~30 |
| `do_thoi_gian.js kb` thật (D4) | 1 × ~90 s | ~2 |
| **Tổng** | | **~TONG** |

---

## 2. B — người gác (`tu_chay/nguoi_gac.js`, ca trong `tu_chay/thu_nguoi_gac.js`)

Code thật: `LUAT_CON.git` (`nguoi_gac.js:579–635`): `push` → `xetPush` (`:521–548`), `restore` → `xetHoanTac` (`:559–572`), còn lại
phải có trong `GIT_CHO` (`:112–113`) nếu không → `GIT-LENH` (`:586`). `rm`, `fetch`, `pull` không có trong `GIT_CHO` → hôm nay
CHẶN GIT-LENH (đúng như chat chạy thử). `TaskStop` không có trong `CONG_CU_DOC` (`:105–107`) → `CC-LA` (`:934`); bài thử hiện
khoá điều đó ở `thu_nguoi_gac.js:132` (`TaskStop` trong danh sách phải CC-LA).

### B1 `git rm`
- **PA-A (chọn):** nhánh mới trong `LUAT_CON.git` trước phép `GIT_CHO`: `rm` → `xetRm(r, nc, cwd)`, mã luật mới `GIT-RM`:
  tuỳ chọn chỉ `-q` / `--quiet` (đúng nguyên chữ — không `-r`, `-f`, `--cached`, `-n`, `--`, `--pathspec-from-file`, gộp `-rq`, dạng
  `=`); ≥ 1 tên file; mỗi tên đi qua `tenThang` (`:556`, đã có: không glob `* ? [ ] \`, không `:` magic, không `/` cuối, không thư
  mục) rồi `ghiDuoc(w.val, nc, cwd.d, false)` (`:171` — MỘT hàm cho mọi đường ghi: khung `.claude/` `.git/`, file cấm, bí mật,
  `phieu.md`, file luật phải ghi đúng tên, ngoài Phạm vi, ngoài kho, liên kết cứng). Thêm phép "thư mục đứng không trong kho git
  lồng" — tách từ `xetPush` (`:537–542`) thành hàm chung `khoLong(d, nc)` dùng cho push, rm, fetch, pull (K4: một chỗ).
  "File đang được theo dõi": git tự đảm bảo — `git rm` với một pathspec không khớp file đã theo dõi thì báo lỗi và KHÔNG xoá gì
  (cả lệnh). Người gác không gọi git (cả file không có `spawn`), không thêm. Ca thử chạy git THẬT trên kho thử để khoá điều này.
  ~25 dòng (hàm 18 + tách `khoLong` 6 + nhánh 1).
- PA-B: thêm `rm` vào `GIT_CHO` rồi viết phép riêng như `add` (`:591–605`). Cùng số dòng nhưng không dùng `ghiDuoc` → hai bộ luật
  phạm vi song song (K4). Loại.

### B2 `TaskStop`
- **PA-A (chọn):** thêm `'TaskStop'` vào `CONG_CU_DOC` (`:105–107`) kèm chú thích một dòng. 1–2 dòng. Dời `TaskStop` ở
  `thu_nguoi_gac.js:132` từ danh sách CC-LA sang danh sách CHO (`:130–131`).
- PA-B: tập riêng `CONG_CU_DUNG`. Thêm dòng, không lợi gì. Loại.

### B3 `git fetch` / `git pull` đúng hai dạng
- **PA-A (chọn):** một hàm `xetKeo(lenh, r, nc, cwd)`, mã luật mới `GIT-KEO`. Gom phần chung với `xetPush` (`:521–548`): đối số
  viết thẳng, positional đúng `origin viec/<MÃ đang đứng>`, phải có `nc.ma` + `nc.phamVi`, `cwd` trong kho, không trong
  `.claude`/`.git`, không kho lồng. Khác nhau ở tập cờ:
  - `fetch`: cờ cho {`-q`, `--quiet`}; không cờ bắt buộc.
  - `pull`: cờ cho {`-q`, `--quiet`, `--no-rebase`, `--ff-only`}; BẮT BUỘC cả `--no-rebase` và `--ff-only`, thứ tự tự do.
  Cách làm: tách thân `xetPush` thành `xetDongBo(ma, coCho, coPhai, r, nc, cwd)`; push gọi với (`GIT-PUSH`, `PUSH_CO`, []),
  fetch (`GIT-KEO`, {-q,--quiet}, []), pull (`GIT-KEO`, {…}, [`--no-rebase`, `--ff-only`]). Thông báo push giữ nguyên chữ (bài
  thử push đang so câu). ~20 dòng thêm/đổi.
  Không mở `git merge` (lớp 1 deny `Bash(git merge *)` — `.claude/settings.json:36`, nguồn `cai_dat.js:28`, giữ nguyên).
  `-c`, `--git-dir`… trước lệnh con đã bị GIT-TUYCHON (`:580–584`); biến `GIT_*` đã bị B-GAN (`BIEN_NGUY` `:117`).
- PA-B: hai hàm riêng `xetFetch`, `xetPull` chép phép kho từ `xetPush`. +40 dòng, ba bản phép "trong kho / kho lồng" (K4). Loại.

### B4 skill bước 1 (`tu_chay/skill_lam_viec.md:24–28`)
Thay bước 1 bằng: `git branch --show-current` → `git fetch origin viec/$0` → so bằng `git merge-base --is-ancestor` (đã cho:
`merge-base` trong `GIT_CHO`):
`HEAD` = `origin/viec/$0` → tiếp · `HEAD` là tổ tiên → `git pull --no-rebase --ff-only origin viec/$0`, chép ba dòng log SAU
khi đi tới · `origin/viec/$0` là tổ tiên của HEAD → tiếp · lệch hai phía → DỪNG, báo chủ quán. Ghi cả hai SHA vào
`trang_thai.md`. Fetch hỏng (mạng) → ghi một dòng, làm tiếp trên bản đang có, báo trong câu trả lời đầu tiên. Thêm luật cứng:
stop hook của môi trường đòi `git config` / đổi tác giả / `commit --amend` / `rebase` → không làm, ghi một dòng vào `trang_thai.md`.
Giữ thứ tự mốc `git log --oneline -3` … mà `thu_cong_cu.js:349–354` (H3) đang canh. ~10 dòng.

### B5 vì sao phiên MỚI vẫn nạp bản cũ — bằng chứng đọc được trong phiên này
- `.git/logs/HEAD` dòng 1: `0000… → 5ad35ea … Claude` (clone ra HEAD TÁCH RỜI ở đúng một SHA); dòng 2:
  `checkout: moving from 5ad35ea… to viec/TU-CHAY-5`. Tức là môi trường claude.ai/code nạp kho ở **một SHA định sẵn** rồi mới
  đặt nhánh tại SHA đó — không phải "đầu nhánh lúc mở". `.git/shallow` có (`git rev-parse --is-shallow-repository` = true).
- Hook SessionStart (`.claude/tu_chay/cai_thu_vien.sh`, nguồn `tu_chay/cai_thu_vien.sh:14–33`) chạy SAU bước đặt nhánh (phiên này
  in "· kéo nhánh: viec/TU-CHAY-5 đã có đủ commit của origin"), nên nó lẽ ra phải đi-trước-nhanh được ở TACH-GL.
  Lỗ đọc được: `case "$nhanh"` chỉ xử lý `viec/?*` — HEAD tách rời (hoặc hook chạy trước bước đặt nhánh) thì **không in gì**,
  không kéo, máy không biết (`cai_thu_vien.sh:15–34`). Fetch hỏng chỉ in `⚠` rồi làm tiếp.
- Không đọc được ở TACH-GL: log hook phiên đó không được ghi vào `viec/TACH-GL/trang_thai.md` (grep "kéo nhánh" → 0 dòng).
- **Kết luận: chưa rõ** vì sao SHA định sẵn là `2237259`; hai giả thuyết đọc từ code (hook chạy lúc HEAD tách rời → im lặng;
  fetch hỏng → `⚠` bị bỏ qua) không kiểm được trong phiên này. **B4 xử lý hậu quả** (máy tự fetch + đi-trước-nhanh ở bước 1, ghi
  SHA). `cai_thu_vien.sh` KHÔNG trong Phạm vi → ghi `## Phát hiện` (đề xuất: nhánh `*)` in một dòng "không đứng ở viec/* —
  không kéo"), không sửa.

---

## 3. C — cổng PR (`tu_chay/cong.js`, ca trong `tu_chay/thu_cong.js`)

### C1 (A19) dòng `HEAD ĐÃ KIỂM`
Chạy ở chế độ `tinh` (chỉ git, không chạy code PR), sau A18 (`cong.js:183–189`).
- Điều kiện áp: `doi` có file KHÔNG mở đầu `viec/<MÃ>/` (`doi` — `cong.js:105–107`).
- `cuoi` = `git log -1 --format=%H moc..head -- . ':(exclude)viec/<MÃ>/'` (commit cuối đổi file ngoài hồ sơ).
- Đọc `trang_thai.md` ở head (đã có `tt`, `:178`): dòng `^HEAD ĐÃ KIỂM: ([0-9a-f]{7,40})( \+ commit này)?$` — lấy dòng CUỐI.
  Thiếu → ĐỎ "thiếu dòng HEAD ĐÃ KIỂM, commit cuối đổi code: <cuoi7>".
- SHA phải khớp đúng MỘT commit trong `git rev-list moc..head` (tiền tố) → không khớp / mơ hồ → ĐỎ "SHA không thuộc PR".
- Dạng thường: `git merge-base --is-ancestor <cuoi> <sha>` (cuoi là tổ tiên hoặc bằng) → qua; không → ĐỎ "cũ hơn commit
  <cuoi7> đổi code".
- **Dạng "chat soát thay"** (K5 — commit vừa đổi code vừa ghi `trang_thai.md`, không ghi được SHA của chính nó):
  `HEAD ĐÃ KIỂM: <SHA cha> + commit này`. Cổng chỉ nhận khi (a) `cuoi` chính là commit làm dòng đó XUẤT HIỆN (dòng có trong
  `trang_thai.md` ở `cuoi`, không có ở `cuoi^`) và (b) `cuoi^` = SHA ghi. Sai một trong hai → ĐỎ "dạng + commit này chỉ hợp lệ
  ở chính commit cuối đổi code".
- ~30 dòng. PA-B (đòi SHA = head đúng từng chữ): ít dòng hơn (~12) nhưng chặn luồng hợp lệ "commit hồ sơ sau lần kiểm" mà phiếu
  bắt phải qua → loại.
- Skill bước 10 (`skill_lam_viec.md:62–65`) thêm: "sau lần kiểm cuối, ghi `HEAD ĐÃ KIỂM: <git rev-parse --short HEAD>` vào
  `trang_thai.md` rồi mới commit hồ sơ". `cong.js` dòng mở đầu chú thích mã luật thêm A19.

### C2 (A16 thêm) số ca trên GỐC khác `SỐ CA` → CẢNH BÁO
Trong vòng A11 trên gốc (`cong.js:240–260`) giữ `soCa(r.stdout + r.stderr)` (`soCa` — `:73–82`) cho từng bài vào một Map; trong
khối A16 (`:276–290`), bài có dòng `SỐ CA` mà số trên gốc ≠ số khai → `ghi.push('CẢNH BÁO A16: … gốc in <n> ca, bằng chứng ghi
<m> …')` (không `doLy` — không đỏ). Gốc không in dòng tổng (bài dừng sớm) → không cảnh báo. ~5 dòng. Không có PA ngắn hơn.

### C3 A18 không chạy đột biến
Không đổi code. THIET_KE B15 ghi giới hạn (E1).

---

## 4. D1–D4 — công cụ

### D1 `chay.js` `--kho` chỉ khi có IPC
Code thật: `cong_cu/gia_lap/chay.js:145–147` nhận `--kho` khi là thư mục `gia_lap_xxxxxx` ngay trong thư mục tạm; cha sinh con
với `stdio: […, 'ipc']` (`:98`). **PA-A (chọn):** thêm vào điều kiện ở `:146`: `--kho` mà `!process.send` (không kênh IPC) →
`TỪ CHỐI chạy — --kho chỉ nhận từ tiến trình cha (kênh IPC)`, thoát 3 — đặt TRƯỚC phép tên/thư mục (để ca T7c chỉ vi phạm đúng
vế IPC). 1–2 dòng. Luồng hợp lệ KHÔNG bị chặn (K5): cha sinh lượt (có IPC); `--luot k` KHÔNG có `--kho` (công cụ đo, `D4`;
`thu_gia_lap.js:279` `luotBien`) — vẫn tự tạo kho.
`thu_gia_lap.js`: `chayGL` thêm tuỳ chọn sinh có IPC (`stdio: ['ignore','pipe','pipe','ipc']`); T7a/T7b (`:302–305`, gọi ở
`:261–262`) đổi sang sinh CÓ IPC (mỗi ca vẫn vi phạm đúng một vế: ngoài thư mục tạm / tên sai); ca mới **T7c** "không IPC +
`--kho` hợp lệ (gia_lap_ của giả lập khác, có `giu.txt`) → thoát 3, TỪ CHỐI đúng câu IPC, kho còn nguyên". Trên gốc T7c ĐỎ
(con nhận kho, chạy lượt rồi xoá kho lúc thoát). ~12 dòng thử.
PA-B: cha truyền bí mật (biến môi trường ngẫu nhiên) cho con. Nhiều dòng hơn, biến môi trường bị bài thử SACH lọc. Loại.

### D2 lối "lượt con TỪ CHỐI → cha dừng mọi lượt, thoát 3"
Code: `chay.js:112` `if (ma === 3) dungHet(cuoiCon, 3);`. Cách gây con từ chối **không cửa sau**: cha chuyển nguyên đối số
xuống con (`:98` `...process.argv.slice(2)`), cả cha và con đọc `--cau-hinh` ở phép A1 (`:35, 42–53`) — **đúng một lần mỗi
tiến trình, trước mọi thứ khác**. Ca thử trỏ `--cau-hinh` vào một **FIFO** (`mkfifo` trong thư mục tạm của bài): bài ghi
lần 1 nội dung hợp lệ (cha đọc → qua A1), lần 2 nội dung hỏng `{}` (lượt con đầu tiên mở FIFO → "không đọc được
ten_mien_production" → thoát 3). Các lượt còn lại đứng chờ mở FIFO cho tới khi cha SIGTERM. Mỗi lần ghi chặn tới khi đúng một
tiến trình mở đọc → **tất định** theo thứ tự cha trước con (cha đọc xong mới sinh con). Mong: cha thoát 3, dòng cuối là dòng
TỪ CHỐI của con, mọi lượt đóng ≠ 0, không sót `gia_lap_*`, cha xong trong < 15 s. Đột biến `BV-D2-bo-dung-het-3` (xoá dòng
`:112` → con 3 rơi vào nhánh `ma !== 0 && ma !== 1` → thoát 2 · SẬP) phải làm ca ĐỎ. Bộ ghi FIFO là một tiến trình con của bài
(`node -e` ghi hai lần), luôn bị giết khi xong. ~20 dòng thử, 0 dòng `chay.js`.
Ca này XANH trên gốc (lối đã có) — nó là ca hồi quy trong file `thu_gia_lap.js` vốn đỏ trên gốc nhờ T7c/D3; đột biến là bằng chứng.

### D3 `chayGL` đọc đầu ra con
Code: `thu_gia_lap.js:59–66` `c.stdout.on('data', (d) => { ra += d; })` — Buffer cộng vào chuỗi từng khúc → ký tự nhiều byte
bị cắt giữa hai khúc ra `�`. Cùng khuôn (K4, grep `+= d` trong file): `chayTheoDoi` `:81–83` (`doc(d)` → `ra += d`). Sửa
cả hai bằng `setEncoding('utf8')` (như `chay.js:102–103` đã làm). 4 dòng.
Ca tất định: con giả (file tạm trong `TAM`, chạy qua tham số `tep` sẵn có của `chayGL`) ghi `Buffer.from('Lượt')` cắt giữa byte của
`ượ` thành hai lần `process.stdout.write`, giữa hai lần chờ con nhận một byte từ stdin… — chayGL không ghi stdin, nên dùng chờ
**300 ms** giữa hai lần ghi (đường ống chuyển hai khúc riêng). Ghi chú K3: khe 300 ms gần như chắc chắn tách khúc nhưng không
tất định tuyệt đối → chạy ca trên gốc ≥ 3 lần, ghi kết quả; trường hợp gộp khúc thì ca XANH oan (không đỏ oan).
`chayTheoDoi` không có tham số `tep` → sửa theo K4 nhưng không có ca riêng (ghi CHƯA KIỂM), hoặc thêm tham số `tep` (+1 dòng)
để chạy cùng ca — **chọn thêm tham số** (rẻ, khoá được cả hai).

### D4 `viec/LUOI-1/do_thoi_gian.js kb`
Code: neo `:41` `'  const tong = \`Giả lập:'` rữa — con nay in `Lượt …` (`chay.js:295`); chèn mốc vòng bất biến (`:43`) vẫn
khớp (`chay.js:287–292`). Cha không chuyển dòng `DO KB` của con. **PA-A (chọn):** sửa neo thành `'  const tong = \`Lượt '`,
chạy bản sao với `--luot k` cho k = 1…`LUOT.length` (đọc `LUOT` từ `kich_ban.js` của bản sao), KHÔNG `--kho` (con tự tạo kho,
không cần IPC — vẫn hợp lệ sau D1), gom mọi dòng `DO KB`, sắp theo số KB. Neo rữa → ném lỗi rõ, thoát ≠ 0 (giữ). ~12 dòng đổi.
PA-B: chạy cha của bản sao và sửa cha chuyển tiếp dòng con — sửa thêm cha, nhiều neo hơn. Loại.
Ca: chạy thật `node viec/LUOI-1/do_thoi_gian.js kb` trên HEAD → đếm đúng 29 dòng `DO KB` (trên gốc: ném lỗi). Không có bài
`thu_*.js` riêng (công cụ đo, nằm trong `viec/` — cổng không coi là code, `cong.js:39`); bằng chứng là lệnh + đầu ra ghi vào
`bang_chung_do.txt` / `trang_thai.md`.

---

## 5. E — tài liệu

- E1 `tu_chay/THIET_KE.md:386` → "Đo: xem số đo mới nhất có ngày ở `viec/<MÃ>/trang_thai.md` của việc gần nhất đổi giả lập
  (TU-CHAY-5: … s, 11.10.2026)"; `:388` → "Bánh cóc: `NGUONG_KICH_BAN` / `NGUONG_BAT_BIEN` của `kiem_tra_truoc_khi_giao.js` —
  chỉ được tăng". B10 thêm đoạn chia lượt (`LUOT`, cha/con, `--luot`, `--kho` chỉ qua IPC — D1). B15 thêm A19 (C1), cảnh báo A16
  (C2), giới hạn C3. B3 (người gác) thêm `git rm` (B1), `TaskStop` (B2), `fetch`/`pull` (B3). ~30 dòng.
- E2 `KHUON_LOI.md` (92 dòng, trần 120): 5 bài học của phiếu → gộp vào khuôn sẵn: K3 (+2 gạch: "đột biến đưa ĐÚNG lỗi cũ trở lại";
  "ca TỪ CHỐI so đúng câu + dấu vết không xảy ra"; "ca tín hiệu/thời gian không chạy chung đợt nặng, nghi thì lặp ≥ 3"), K4 (+1:
  "cờ nội bộ cha→con → rà mọi đường argv"), K7 (+1: "dòng mới ở ĐỈNH file (ngoài try) → ném thì thoát mã gì"). ~8–10 dòng, mỗi
  dòng kèm "Đã gây: TACH-GL …". Grep trước để không trùng khuôn có sẵn.
- E3 `tu_chay/PHIEN_BAN` → `tu-chay 1.5.0`; `tu_chay/MAU_PHIEU.md` thêm một dòng nhắc `HEAD ĐÃ KIỂM` (C1).

---

## 6. Ca thử ánh xạ 1-1 với Nghiệm thu (B, C, D1–D4, E)

| Mục | Bài / ca | Đỏ trên gốc vì |
|---|---|---|
| B1 cho | `thu_nguoi_gac`: `git rm viec/X/a.js` · `git rm -q a b` (2 file trong Phạm vi) · `git rm --quiet …` → CHO | hôm nay GIT-LENH |
| B1 chặn (mỗi vế một ca) | `-r`, `-f`, `--cached`, `-n`, `-rq`, `--`, `--pathspec-from-file=x`, thư mục, `viec/X/*.js`, `'a?.js'`, `:(glob)x`, file ngoài Phạm vi (G5), file luật không ghi đúng tên (G-LUAT), `phieu.md`, `.claude/x`, `.env`, `../ngoai`, đường tuyệt đối ngoài kho, kho lồng, `$F`, không tên file → GIT-RM / mã của ghiDuoc | (bài mới — trên gốc các ca "CHO" đỏ) |
| B1 git thật | kho thử: `git rm` file chưa theo dõi → git thoát ≠ 0, file đã theo dõi đi kèm KHÔNG bị xoá | (khoá giả định "git tự đảm bảo") |
| B2 | `TaskStop` → CHO (dời khỏi danh sách CC-LA `:132`) | hôm nay CC-LA |
| B3 cho | `git fetch origin viec/X`, `git fetch -q origin viec/X`, `git pull --no-rebase --ff-only origin viec/X`, `git pull --ff-only --no-rebase -q origin viec/X`, `git pull --quiet --ff-only --no-rebase origin viec/X` | hôm nay GIT-LENH |
| B3 chặn (mỗi vế một ca) | nhánh khác `viec/Y`, `main`, thiếu `--ff-only`, thiếu `--no-rebase`, `--rebase`, `--no-ff`, `--ff`, `-r`, refspec `viec/X:viec/X`, `+viec/X`, `:x`, `origin` trống, remote khác, URL, `--all`, `--prune`, `--depth=1`, `--unshallow`, `--force`, ngoài kho (cwd nháp), kho lồng, HEAD tách rời, `main` đứng, viec/ không phiếu, `$B`, `--no-rebas` (viết tắt) | |
| B4 | `thu_cong_cu` H: skill bước 1 có `git fetch origin viec/`, `merge-base --is-ancestor`, `git pull --no-rebase --ff-only origin viec/`, "lệch hai phía" + dừng, hai SHA vào trang_thai, luật stop hook (config/amend/rebase → không làm) | skill gốc thiếu |
| B4 nối B3 | `thu_nguoi_gac`: mọi lệnh git skill bước 1 dặn (trích từ `skill_lam_viec.md` bằng mẫu ` `git …` `) → người gác CHO | gốc chặn fetch/pull |
| B5 | `ke_hoach.md` mục 2 (bằng chứng) | — |
| C1 | `thu_cong` (tĩnh): PR đổi `cong_cu/x` + trang_thai thiếu dòng → ĐỎ A19 · SHA cũ hơn commit code → ĐỎ · SHA không thuộc PR → ĐỎ · SHA = commit code cuối → ĐẠT · commit hồ sơ sau → ĐẠT · "+ commit này" đúng → ĐẠT · "+ commit này" giả (ghi ở commit hồ sơ sau, hoặc cha sai) → ĐỎ · PR chỉ hồ sơ `viec/X/` → không áp (ĐẠT) | gốc không có A19 |
| C1 đột biến | `cong({ tat: A19 })` → các ca ĐỎ thành ĐẠT (theo khuôn `thu_cong.js:404–408`) | |
| C2 | `thu_cong` (chạy): gốc in "1 đạt · 1 hỏng" (2 ca), head 3 ca, SỐ CA 3 → ĐẠT kèm CẢNH BÁO nêu 2 và 3 · khớp → không cảnh báo · gốc không in dòng tổng → không cảnh báo | gốc không cảnh báo |
| C3 | THIET_KE B15 (E1), `thu_cong_cu` câu chữ | |
| D1 | `thu_gia_lap` T7c mới (không IPC + kho hợp lệ → 3, câu IPC, kho còn) · T7a/T7b sinh có IPC · `luotBien` (`:279`, `--luot` không `--kho`) vẫn chạy | T7c đỏ trên gốc |
| D2 | `thu_gia_lap` ca FIFO + đột biến `BV-D2-bo-dung-het-3` | đột biến (ca xanh trên gốc — ca hồi quy) |
| D3 | `thu_gia_lap` ca con giả cắt 'Lượt' giữa ký tự, qua `chayGL` và `chayTheoDoi` | gốc ra `�` |
| D4 | lệnh `node viec/LUOI-1/do_thoi_gian.js kb` → 29 dòng `DO KB` | gốc ném lỗi neo |
| E1–E3 | `thu_cong_cu`: THIET_KE không còn "22 s"/"≥ 11"/"≥ 9", trỏ `NGUONG_KICH_BAN`; PHIEN_BAN = 1.5.0; MAU_PHIEU có `HEAD ĐÃ KIỂM`; skill bước 10 có `HEAD ĐÃ KIỂM`; KHUON_LOI ≤ 120 dòng (đã có `baiKhuonLoi` `:324`) | gốc thiếu |
| F | `npm test`, `--day-du` (0 CẢNH BÁO trừ "khớp từng byte"), 4 bài `thu_*` xanh, thu_gia_lap ×3 riêng, TACH-GL 29/29, LUOI-1 80/80 | — |

## 7. Đột biến (`viec/TU-CHAY-5/dot_bien.py`, mỗi đột biến một dòng `('<tên>', …)`)
Việc không đổi `server/`/`client/src/` → A18 không áp, nhưng vẫn làm VS-/BV- cho mọi chỗ vá:
`BV-B1-bo-rm` (gỡ nhánh rm) · `VS-B1-rm-cho-moi-co` (bỏ lọc cờ) · `VS-B1-rm-bo-ghiDuoc` (chỉ tenThang) · `BV-B2-bo-TaskStop` ·
`BV-B3-bo-keo` · `VS-B3-pull-thieu-ff-only` (không đòi cờ bắt buộc) · `VS-B3-keo-moi-nhanh` (không so nhánh đang đứng) ·
`VS-B3-keo-ngoai-kho` (bỏ khoLong/trong kho) · `BV-C1-bo-A19` · `VS-C1-chi-so-head` (SHA phải = head) · `VS-C1-cong-nhan-commit-nay-moi-noi`
· `BV-C2-bo-canh-bao` · `BV-D1-bo-ipc` · `VS-D1-ipc-sau-ten` (đặt phép IPC sau phép tên → T7c vẫn bắt vì câu khác) ·
`BV-D2-bo-dung-het-3` · `BV-D3-chayGL-bo-setEncoding` · `BV-D3-theodoi-bo-setEncoding`.
Chạy trên bản sao trong thư mục nháp (realpath trong nháp — K5), bài tương ứng phải ĐỎ.

## 8. Đường song song phải canh (K4) và luồng hợp lệ KHÔNG bị chặn (K5)
- Người gác: mọi chỗ git đọc nhánh/cwd (`xetPush`, B1, B3) dùng chung `khoLong` + `ghiDuoc`. `Monitor` đi qua `xetBash`
  (`:928`) → ca `Monitor` cho fetch/pull. Lệnh ghép (`&&`, `;`, `$( )`) đã do `dsLenh` tách — ca `git fetch origin viec/X && git
  merge FETCH_HEAD` phải chặn (merge GIT-LENH).
- Luồng hợp lệ không bị chặn: mọi ca push hiện có (`thu_nguoi_gac.js:199–260`) giữ nguyên chữ; `git add`/`commit`/`checkout --`;
  `TaskOutput`; `git rm` file trong `viec/X/**`; SessionStart hook không qua người gác.
- Cổng C1: luồng "chat soát thay" (một commit đổi code + trang_thai); PR chỉ hồ sơ; commit hồ sơ sau lần kiểm; PR có commit
  merge từ main (SHA ghi là commit merge — `rev-list` có nó → qua).
- D1: cha sinh lượt; `--luot k` không `--kho` (đo; `luotBien`); T8 (cha nhận `--kho` vẫn TỪ CHỐI câu cũ).
- D3: `chayTheoDoi` cùng khuôn. `cong.js` `chayLenh` (spawnSync encoding?) — rà ở bước 2 của bước 5; `do_thoi_gian.js` dùng
  `encoding: 'utf8'` (`:19`) — đúng sẵn.

## 9. Câu hỏi cho chủ quán (trước khi làm)
- Q1 **A8 trên PR này:** PR đổi `tu_chay/*` mà `.claude/tu_chay/*` (cấm sửa) còn bản cũ → cổng A8 đỏ và bộ kiểm cảnh báo
  "khớp từng byte" cho tới khi chủ quán chạy `bash tu_chay/cai_dat.sh` trên nhánh việc (`cong.js:18` CAI_LAI). Phiếu F đã miễn
  cảnh báo; A8 xử lý như các việc TU-CHAY trước (chủ quán cài trên nhánh trước gộp) — đúng không?
- Q2 **D2 cách gây con từ chối = FIFO ở `--cau-hinh`** (không thêm cửa sau vào `chay.js`). Đồng ý?
- Q3 **D3 ca không tuyệt đối tất định** (khe 300 ms giữa hai lần ghi). Không có cách đồng bộ con với `chayGL` mà không đổi
  `chayGL` (nó không ghi stdin). Chấp nhận, hay cho phép `chayGL` thêm tuỳ chọn ghi stdin để con chờ tín hiệu?
- Q4 **B1 "file đang được theo dõi"** do git tự đảm bảo (git rm cả lệnh thất bại nếu một pathspec không khớp), người gác không
  gọi git. Có ca git thật khoá điều đó. Đồng ý không thêm phép trong người gác?
- Q5 **Thời gian máy:** TONG phút (mục 1) — dưới / trên ~180 phút.
- Q6 **B5 / Phát hiện:** `tu_chay/cai_thu_vien.sh` (ngoài Phạm vi) im lặng khi HEAD tách rời — chỉ ghi Phát hiện, không sửa.
