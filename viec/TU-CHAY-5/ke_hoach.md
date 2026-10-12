# TU-CHAY-5 — kế hoạch (chờ chủ quán duyệt)

Nền: `5ad35ea PHIEU: TU-CHAY-5` (cha `c18ee16` sổ v26 ← `befc6ad` Merge PR #13 TACH-GL), tu-chay 1.4.0. Máy mây 4 lõi
(`node -p "require('os').cpus().length"`).

**Phạm vi kế hoạch theo lời chốt chủ quán 11.10:** nhóm A (A1–A4), D5, D6 DỜI sang AUDIT-2. Kế hoạch này KHÔNG có mục nào cho
chúng, và mục F chỉ áp cho B, C, D1–D4, E. Ở các mục còn lại chỉ cắt phần trỏ tới mục đã dời:
- E1: B10 KHÔNG thêm `dot_bien_bb.py` (thuộc A1), vẫn thêm cách chia lượt.
- E3: `MAU_PHIEU.md` chỉ nhắc dòng `HEAD ĐÃ KIỂM` (C1), KHÔNG nhắc `dot_bien_bb.py` (A4).
- Không đụng các file chỉ nhóm đã dời cần: `tu_chay/lenh_ra_soat.md` (A4), `cong_cu/gia_lap/dot_bien_bb.py`,
  `cong_cu/gia_lap/bat_bien.js`, `viec/HOC-2b/kiem_neo.py`, `cong_cu/ban_sao_goc.py`.

Mọi số dòng dưới đây đọc trong lượt này (K1). Kế hoạch đã qua một agent phụ soát chỉ đọc. Agent nêu 13 điểm, đã sửa hết vào bản
này; bảng ở mục 10.

---

## 1. Số đo trên gốc 5ad35ea (11.10.2026, máy mây 4 lõi, chạy RIÊNG lần lượt)

Đo bằng `scratchpad/do.js`: `spawnSync`, không lệnh nào chạy song song, kết quả ở `scratchpad/do_thoi_gian.txt`.

| Lệnh | Thời gian | Kết quả |
|---|---|---|
| `node tu_chay/thu_nguoi_gac.js` | 7,3 s | 798/798 ca người gác · 173 phép khác · XANH |
| `node tu_chay/thu_cong.js` | 66,3 s | 260 phép · 0 chỗ hỏng |
| `node tu_chay/thu_cong_cu.js` | 4,1 s | 85 phép · 0 chỗ hỏng |
| `node cong_cu/thu_gia_lap.js` | 41,7 s | 126 đạt · 0 hỏng |
| `node kiem_tra_truoc_khi_giao.js --day-du` | 154,4 s | PASS 65 · FAIL 0 · CẢNH BÁO 0 |
| `python3 viec/TACH-GL/dot_bien.py -j 4` | 562 s | 29 · BẮT 29 · đúng mong đợi 29/29 |
| `python3 viec/LUOI-1/dot_bien.py -j 4` | chưa đo ở việc này (LUOI-1 `trang_thai.md:684` ghi 247 s) — đo ở bước 6 | |
| `node viec/LUOI-1/do_thoi_gian.js kb` | — | **ném lỗi** "neo đo không khớp: const tong = \`Giả lập:" → D4 đỏ trên gốc |

### Ước lượng thời gian máy (thời gian mỗi lần chạy là số ĐO ở trên; số lần là giả định của kế hoạch)

| Khâu | Phép tính | Phút |
|---|---|---|
| Bài thử đỏ trên gốc (4 bài) | 7,3 + 66,3 + 4,1 + 41,7 s = 119 s | 2 |
| Vòng sửa: chạy lại 4 bài + `--day-du` | giả định 6 vòng × (119 + 154) s | 27 |
| F: `thu_gia_lap` thêm 3 lần riêng | 3 × 41,7 s | 2 |
| F: đột biến cũ TACH-GL + LUOI-1 | 562 + 247 s | 13,5 |
| Đột biến của việc (mục 7, 15 cái) | 6 × 7,3 (gác) + 3 × 66,3 (cổng) + 5 × 41,7 (gl) + 1 × 4,1 s ≈ 450 s | 8 |
| `/ra-soat`: tối đa 3 vòng, mỗi vòng chạy lại 4 bài + `--day-du` | 3 × 273 s, chưa tính thời gian đọc của agent | 14 |
| D4 chạy thật (4 lượt tuần tự) | chưa đo được trên gốc (công cụ hỏng), ước theo thời gian bằng giả lập đủ, ~42 s | 2 |
| **Tổng** | | **~69** |

---

## 2. B — người gác (`tu_chay/nguoi_gac.js`, ca trong `tu_chay/thu_nguoi_gac.js`)

Code thật hôm nay:
- `LUAT_CON.git` (`nguoi_gac.js:579–635`): `push` → `xetPush` (`:521–548`); `restore` → `xetHoanTac` (`:559–572`); lệnh con
  khác phải có trong `GIT_CHO` (`:112–113`), không thì `GIT-LENH` (`:586`). `rm`, `fetch`, `pull` không có trong `GIT_CHO` nên
  hôm nay bị chặn.
- `TaskStop` không có trong `CONG_CU_DOC` (`:105–107`) nên bị `CC-LA` (`:934`).
- Ca cũ phải đổi mong đợi khi vá: `thu_nguoi_gac.js:132` (TaskStop đang trong danh sách CC-LA) → sang CHO; `:640–641` (phép
  khoá tập `CONG_CU_DOC`) → thêm `TaskStop`. `:194–195`: `git rm server/a.js` đang mong GIT-LENH; `server/a.js` nằm trong Phạm
  vi phiếu thử (`:57`) nên sau vá thành CHO — đổi ca thành file NGOÀI Phạm vi (giữ ý "rm bị chặn"). `git fetch origin`,
  `git pull origin viec/X` → mong `GIT-KEO`.

### B1 `git rm`
- **PA-A (chọn):** mở rộng `xetHoanTac` (`:559–572`) thành hàm chung với 3 tham số: tập cờ cho phép, mã luật, có được miễn
  `G-HOANTAC` không. `git rm` gọi với cờ = {`-q`} (chỉ đúng chữ phiếu cho, KHÔNG `--quiet`), mã `GIT-RM`, `coTuyChon` = true
  nhưng KHÔNG nhận `--`, và `ghiDuoc(…, hoanTac = false)` — để `G-HOANTAC` (`:183`) không mở đường xoá file ngoài Phạm vi.
  Phần tên file dùng lại `tenThang` (`:556`): không glob, không `:`, không `/` cuối, không thư mục. `ghiDuoc` (`:171`) giữ mọi
  luật đích: khung, file cấm, bí mật, `phieu.md`, file luật không ghi đúng tên, ngoài Phạm vi, ngoài kho, liên kết cứng.
  Thêm phép "không đứng trong kho git lồng" (xem B3: `khoLong`). ~8 dòng.
- "Mỗi file đang được theo dõi": git tự đảm bảo. Một pathspec không khớp file đã theo dõi thì `git rm` báo lỗi và không xoá gì
  của cả lệnh. Người gác không gọi git (cả file không có `spawn`), nên không thêm phép. Có ca git thật khoá điều này (mục 6).
- PA-B: hàm `xetRm` riêng ~18 dòng, gần như chép lại `xetHoanTac` → hai bản song song (K4). Loại.

### B2 `TaskStop`
**PA-A (chọn):** thêm `'TaskStop'` vào `CONG_CU_DOC` kèm chú thích một dòng; đổi hai ca cũ đã nêu ở trên. 2 dòng. PA-B (tập
riêng) dài hơn mà không được gì thêm. Loại.

### B3 `git fetch` / `git pull` đúng hai dạng
- **PA-A (chọn):** tách thân `xetPush` thành `xetDongBo(ma, lenh, coCho, coPhai, r, nc, cwd)`:
  - push gọi với (`GIT-PUSH`, `PUSH_CO`, []), giữ nguyên hành vi;
  - fetch gọi với (`GIT-KEO`, {`-q`}, []);
  - pull gọi với (`GIT-KEO`, {`-q`, `--no-rebase`, `--ff-only`}, [`--no-rebase`, `--ff-only`]) — cả hai cờ bắt buộc, thứ tự tự do.
  - Không `--quiet`: phiếu ghi "không tuỳ chọn khác ngoài `-q`".
  - Câu báo đổi theo lệnh: `phải đúng: git ${lệnh} … origin viec/<MÃ>`. Bài thử push chỉ so MÃ luật (`thu_nguoi_gac.js:99–103`),
    không so câu.
- Phần chung giữ thứ tự của `xetPush`:
  1. Đối số viết thẳng; mỗi cờ đúng nguyên chữ; positional đúng `origin viec/<MÃ đang đứng>`.
  2. Phải có `nc.ma` và `nc.phamVi`.
  3. `laCon(d, nc.goc)` đứng TRƯỚC, rồi mới tới vòng kho lồng. Vòng `for (x = d; x !== nc.goc; …)` (`:539`) chạy mãi nếu `d`
     ngoài kho.
  4. Vòng kho lồng tách thành `khoLong(d, nc)`, dùng cho push, rm, fetch, pull.
- `GIT-COMMIT-NHANH` (`:625`) KHÔNG đưa vào `khoLong`. Commit trong kho lồng không đụng kho này, và PR không mang theo nó. Cố ý,
  ghi chú thích.
- ~20 dòng thêm/đổi.
- Không mở `git merge`: lớp 1 deny `Bash(git merge *)` (`.claude/settings.json:36`) giữ nguyên. `-c`, `--git-dir` trước lệnh con
  đã bị `GIT-TUYCHON` (`:580–584`); biến `GIT_*` đã bị `B-GAN` (`BIEN_NGUY` `:117`). `git pull --no-rebase --ff-only` không khớp
  deny nào; `Bash(git *--no-v*)` không khớp `--no-rebase`.
- PA-B: hai hàm riêng chép phép kho → ba bản phép "trong kho / kho lồng" (K4). Loại.

### B4 skill bước 1 (`tu_chay/skill_lam_viec.md:24–28`)
Bước 1 mới:
1. `git branch --show-current` (sai nhánh / không có commit `PHIEU: $0` → dừng như cũ).
2. `git status --short`: có file đã theo dõi đang sửa dở → KHÔNG kéo, ghi một dòng, làm tiếp. Đây là cùng luật với hook
   `cai_thu_vien.sh:16`; hai đường kéo nhánh phải cùng luật (K4).
3. `git fetch origin viec/$0`, rồi so `HEAD` với **`FETCH_HEAD`** — như hook (`cai_thu_vien.sh:20–22`), không dựa vào
   `origin/viec/$0` vì nó phụ thuộc refspec của remote. So bằng `git merge-base --is-ancestor` (đã được cho: `merge-base` có
   trong `GIT_CHO`):
   - bằng nhau → tiếp;
   - HEAD là tổ tiên → `git pull --no-rebase --ff-only origin viec/$0`;
   - FETCH_HEAD là tổ tiên (máy có commit chưa push) → tiếp;
   - lệch hai phía, kể cả do kho nông (shallow) không thấy tổ tiên chung → DỪNG, báo chủ quán.
   - fetch hỏng (mạng) → làm tiếp trên bản đang có, báo trong câu trả lời đầu tiên.
4. SAU bước 3 mới ghi vào `trang_thai.md`: hai SHA (HEAD trước, FETCH_HEAD), rồi `git log --oneline -3`. Ghi trước thì cây bẩn
   và pull bị từ chối.
5. Thêm luật cứng: stop hook của môi trường đòi `git config` / đổi tác giả / `commit --amend` / `rebase` → không làm, ghi một
   dòng vào `trang_thai.md`.
Giữ thứ tự các mốc mà `thu_cong_cu.js:349–354` (H3) đang canh. ~12 dòng.

### B5 vì sao phiên MỚI vẫn nạp bản cũ — bằng chứng đọc được trong phiên này
- **Phiên nạp theo SHA định sẵn.** `.git/logs/HEAD` dòng 1: `0000… → 5ad35ea`, tức là clone ra HEAD TÁCH RỜI ở một SHA. Dòng 2:
  `checkout: moving from 5ad35ea… to viec/TU-CHAY-5`. Môi trường claude.ai/code nạp kho ở một SHA định sẵn, rồi mới đặt nhánh
  tại SHA đó. Kho là kho nông (`git rev-parse --is-shallow-repository` = true).
- **Hook mở phiên lẽ ra phải kéo được.** Hook SessionStart (`tu_chay/cai_thu_vien.sh:14–33`, bản cài trong `.claude/`) chạy SAU
  bước đặt nhánh. Phiên này nó in "· kéo nhánh: … đã có đủ commit của origin".
- **Hai chỗ hook im lặng:**
  - HEAD tách rời → `case "$nhanh"` chỉ xử lý `viec/?*`, không in gì, không kéo (`cai_thu_vien.sh:15–34`);
  - fetch hỏng → chỉ in `⚠`.
- **Không đọc được ở TACH-GL:** log hook phiên đó không được ghi lại (`grep "kéo nhánh" viec/TACH-GL/trang_thai.md` → 0 dòng).
- **Kết luận: chưa rõ** vì sao SHA định sẵn là `2237259`. B4 xử lý hậu quả: máy tự fetch, tự đi tới bản mới, ghi SHA.
  `cai_thu_vien.sh` ngoài Phạm vi nên chỉ ghi `## Phát hiện`: đề xuất nhánh `*)` in "không đứng ở viec/* — không kéo".

---

## 3. C — cổng PR (`tu_chay/cong.js`, ca trong `tu_chay/thu_cong.js`)

### C1 (A19) dòng `HEAD ĐÃ KIỂM`
Chạy ở chế độ `tinh` (chỉ git), ngay sau A18 (`cong.js:183–189`). Phép làm việc trên ĐỒ THỊ commit, không theo ngày.
- **Pathspec "code":** `. ':(exclude)viec/<MÃ>/' ':(exclude).claude/' ':(exclude).github/workflows/cong.yml'`. Loại `.claude/`
  và `cong.yml` vì chúng do `cai_dat.sh` của chủ quán sinh SAU lần kiểm của máy (K5 — không loại thì A19 chặn chính PR này và
  mọi PR `tu_chay/`).
- Áp khi `doi` có file khớp pathspec đó (`doi` ở `cong.js:105–107`).
- Đọc `trang_thai.md` ở head (`tt`, `:178`), lấy dòng CUỐI khớp `^HEAD ĐÃ KIỂM: ([0-9a-f]{7,40})( \+ commit này)?$`:
  - thiếu dòng → ĐỎ "thiếu dòng HEAD ĐÃ KIỂM";
  - SHA (tiền tố) phải khớp đúng MỘT commit trong `git rev-list moc..head`, không khớp hoặc mơ hồ → ĐỎ "SHA không thuộc PR".
- **Dạng thường:** `git rev-list <sha>..head -- <pathspec>` phải RỖNG (không commit đổi code nào sau SHA). Không rỗng → ĐỎ "cũ
  hơn commit <x7> đổi code". Commit merge từ main vào nhánh cũng đổi code nên cũng tính.
- **Dạng "chat soát thay"** `HEAD ĐÃ KIỂM: <SHA cha> + commit này` — commit vừa đổi code vừa ghi `trang_thai.md`, không ghi được
  SHA của chính nó. Danh sách trên phải có ĐÚNG MỘT commit C, `C^` = SHA ghi, và dòng đó XUẤT HIỆN ở C (có trong `trang_thai.md`
  ở C, không có ở `C^`). Sai bất kỳ điều nào → ĐỎ.
- ~25 dòng.
- PA-B (đòi SHA = head): ~12 dòng nhưng chặn luồng hợp lệ "commit hồ sơ sau lần kiểm" mà phiếu bắt phải qua. Loại.
- **Dựng ca trong `thu_cong.js`:** gần như mọi ca ĐẠT hiện có (vd `:126, :249, :314, :347, :348, :362`) đổi file ngoài `viec/X/`
  mà không có dòng `HEAD ĐÃ KIỂM`. Vòng đột biến `cong({ tat })` (`:395–422`) cũng tắt một mã rồi đòi ĐẠT. Cách giữ: `pr()`
  (`:89–100`) mặc định thêm một commit hồ sơ cuối ghi `HEAD ĐÃ KIỂM: <head trước đó>` — đúng như skill dặn. Ca A19 tắt mặc định
  này bằng tuỳ chọn và tự dựng `trang_thai.md`. Mỗi ca A19 chỉ phá đúng một vế (K3). Mọi ca cũ đi qua `pr()` nên giữ nguyên ý.
- Skill bước 10 (`skill_lam_viec.md:62–65`) thêm: "sau lần kiểm cuối, ghi `HEAD ĐÃ KIỂM: <git rev-parse --short HEAD>` vào
  `trang_thai.md` rồi mới commit hồ sơ". Chú thích mã luật đầu `cong.js` thêm A19.

### C2 (A16 thêm) số ca trên GỐC khác `SỐ CA` → CẢNH BÁO
- Trong vòng A11 trên gốc (`cong.js:240–260`): lưu `soCa(r.stdout + r.stderr)` (`:73–82`) cho từng bài.
- Trong khối A16 (`:276–290`): số trên gốc ≠ số khai → `ghi.push('CẢNH BÁO A16: … gốc in <n> ca, bằng chứng ghi <m> …')`. Chỉ
  cảnh báo, không `doLy`, nên không đỏ. Gốc không in dòng tổng (bài dừng sớm) → không cảnh báo. ~5 dòng.
- **Cảnh báo đã biết:** dòng tổng của `thu_nguoi_gac` đếm cả "phép khác" theo số luật (`thu_nguoi_gac.js:536–541`). PR thêm luật
  (như PR này) thì trên gốc ít phép hơn → cảnh báo luôn bật. Đúng với ý phiếu: cảnh báo, không đỏ, vì số trên gốc có thể khác.
  Hỏi chủ quán Q5.

### C3 A18 không chạy đột biến
Không đổi code. Ghi giới hạn này ở THIET_KE B15 (E1).

---

## 4. D1–D4 — công cụ

### D1 `chay.js`: `--kho` chỉ khi có IPC
Code thật: `cong_cu/gia_lap/chay.js:145–147` nhận `--kho` là thư mục `gia_lap_xxxxxx` ngay trong thư mục tạm. Cha sinh con có
`'ipc'` (`:98`).
- **PA-A (chọn):** thêm MỘT DÒNG RIÊNG trước `:146`:
  `if (KHO && !process.send) { viet('Giả lập: TỪ CHỐI chạy — --kho chỉ nhận từ tiến trình cha (kênh IPC)'); process.exit(3); }`.
  Không sửa dòng `:146`, vì `viec/TACH-GL/dot_bien.py` neo đúng chuỗi `'if (KHO && !(path.dirname'` (gãy neo → LẠC → F 29/29 đỏ).
- **Luồng hợp lệ KHÔNG bị chặn (K5):** cha sinh lượt (có IPC); `--luot k` KHÔNG có `--kho` (D4; `luotBien` ở
  `thu_gia_lap.js:279`).
- `thu_gia_lap.js`:
  - `chayGL` thêm tuỳ chọn `stdio`;
  - T7a/T7b (`:302–305`, gọi ở `:261–262`) sinh CÓ IPC, mỗi ca vẫn vi phạm đúng một vế;
  - **ca mới T7c:** không IPC + `--kho` hợp lệ → thoát 3, đúng câu IPC, kho còn nguyên. Kho đặt trong **TMPDIR riêng** của ca
    (như T8, `:255–256`). Không thế thì kho còn lại làm đỏ phép "không sót gia_lap_* trong TAM".
  - Trên gốc T7c ĐỎ: con nhận kho, chạy lượt, xoá kho lúc thoát.
  - ~12 dòng thử.
- PA-B: cha truyền bí mật cho con qua biến môi trường. Dài hơn, và biến môi trường bị `SACH` lọc. Loại.

### D2 lối "lượt con TỪ CHỐI → cha dừng mọi lượt, thoát 3"
Code: `chay.js:112` `if (ma === 3) dungHet(cuoiCon, 3);`. Cách gây con từ chối, **không cửa sau**:
- Cha đọc `--cau-hinh` đúng một lần ở A1 (`:35, 44`) và chuyển nguyên đối số xuống con (`:98`).
- Bài thử sinh cha với `--cau-hinh /dev/fd/3`, `stdio[3]` = fd của một file cấu hình hợp lệ → cha qua A1.
- Con được sinh với `stdio: […, 'ipc']` (`:98`), nên **fd 3 của con là socket IPC**. Đọc `/dev/fd/3` trên socket lỗi (ENXIO) →
  "không đọc được ten_mien_production" → thoát 3.
- Tất định, mọi lượt đều từ chối, không cần tiến trình ghi, 0 dòng `chay.js`. Agent soát đề xuất cách này thay cho FIFO (FIFO
  có khe: lần ghi 2 lọt vào cha chưa đóng fd → các con treo).
- Mong: cha thoát 3, dòng cuối là dòng TỪ CHỐI, mọi lượt đóng ≠ 0, không sót `gia_lap_*`.
- Đột biến `BV-D2-bo-dung-het-3` xoá dòng `:112`: con thoát 3 rơi vào nhánh `ma !== 0 && ma !== 1` → thoát 2 · SẬP → ca ĐỎ.
- ~12 dòng thử (`chayGL` nhận `stdio` — chung với D1).
- **Ca này XANH trên gốc** (lối đã có): đây là ca hồi quy. Bằng chứng là đột biến, ghi rõ trong `bang_chung_do.txt`.
- **Kiểm khả thi trước khi viết bài:** chạy thử một lần trong thư mục nháp. ENXIO không xảy ra → dừng, hỏi chủ quán.

### D3 `chayGL` đọc đầu ra con
- Code: `thu_gia_lap.js:59–66` `c.stdout.on('data', (d) => { ra += d; })` — Buffer cộng vào chuỗi từng khúc, nên ký tự nhiều byte
  bị cắt giữa hai khúc thành `�`.
- Cùng khuôn (K4, grep `ra += d`):
  - `thu_gia_lap.js:62, 63` (`chayGL`), `:81–83` (`chayTheoDoi`);
  - `tu_chay/thu_nguoi_gac.js:662` (`choTreo`), trong Phạm vi.
- Sửa cả ba chỗ bằng `setEncoding('utf8')`, như `chay.js:102–103` đã làm. ~5 dòng.
- **Ca:** con giả (file tạm, qua tham số `tep` sẵn có của `chayGL`; `chayTheoDoi` thêm tham số `tep`, +1 dòng) ghi 'Lượt' cắt
  giữa byte của `ượ` thành hai lần `write`, cách nhau 300 ms. Mong chuỗi nhận được = 'Lượt'.
- **Không đỏ trên gốc theo nghĩa cổng A11:** lỗi nằm trong chính `thu_gia_lap.js`, mà A11 chạy bài của head (đã vá) trên code
  gốc. Bằng chứng là đột biến `BV-D3-chayGL-bo-setEncoding`, `BV-D3-theodoi-bo-setEncoding`.
- **Không tất định tuyệt đối:** khe 300 ms gần như chắc chắn tách hai khúc. Khi khúc bị gộp, ca XANH oan, không đỏ oan. Đột biến
  chạy ≥ 3 lần, ghi kết quả từng lần. Hỏi Q3.

### D4 `viec/LUOI-1/do_thoi_gian.js kb`
- Code: neo `:41` `'  const tong = \`Giả lập:'` rữa, vì con nay in `Lượt …` (`chay.js:295`). Mốc vòng bất biến (`:43`) vẫn khớp
  (`chay.js:287–292`). Cha không chuyển dòng `DO KB` của con.
- **PA-A (chọn):**
  - neo thành `'  const tong = \`Lượt '`;
  - chạy bản sao với `--luot k`, k = 1…`LUOT.length` (đọc `LUOT` từ `kich_ban.js` của bản sao), KHÔNG `--kho` (con tự tạo kho,
    vẫn hợp lệ sau D1);
  - gom mọi dòng `DO KB`, sắp theo số KB;
  - neo rữa → ném lỗi rõ, thoát ≠ 0 (giữ như cũ).
  - ~12 dòng đổi.
- PA-B: sửa cha của bản sao cho nó chuyển dòng con. Nhiều neo hơn. Loại.
- **Ca:** `node viec/LUOI-1/do_thoi_gian.js kb` trên HEAD → đúng 29 dòng `DO KB` (trên gốc: ném lỗi). Công cụ nằm trong `viec/`,
  cổng không coi là code (`cong.js:39`). Bằng chứng là lệnh + đầu ra, ghi trong `bang_chung_do.txt`.

---

## 5. E — tài liệu

- **E1** `tu_chay/THIET_KE.md`:
  - `:386` → trỏ tới số đo có ngày ở `trang_thai.md` của việc gần nhất đổi giả lập (TU-CHAY-5: thu_gia_lap 41,7 s,
    11.10.2026);
  - `:388` → "Bánh cóc: `NGUONG_KICH_BAN` / `NGUONG_BAT_BIEN` của `kiem_tra_truoc_khi_giao.js` — chỉ được tăng";
  - B10 thêm đoạn chia lượt (`LUOT`, cha/con, `--luot`; `--kho` chỉ qua IPC — D1);
  - B15 thêm A19 (C1), cảnh báo A16 (C2), giới hạn C3;
  - B3 thêm `git rm` (B1), `TaskStop` (B2), `fetch`/`pull` (B3);
  - **sửa ba câu trái với bản vá:** `:534` "TaskStop … đều bị chặn"; `:647` (GIT-LENH); `:806` "người gác cấm `fetch`".
  - ~30 dòng.
- **E2** `KHUON_LOI.md` (92 dòng, trần 120): 5 bài học của phiếu, gộp vào khuôn sẵn. Grep trước để không trùng. ~8–10 dòng, mỗi
  dòng kèm "Đã gây: TACH-GL …".
  - K3 +3 gạch: đột biến đưa ĐÚNG lỗi cũ trở lại; ca TỪ CHỐI so đúng câu + dấu vết không xảy ra; ca tín hiệu/thời gian không chạy
    chung đợt nặng, nghi thì lặp ≥ 3.
  - K4 +1: cờ nội bộ cha→con → rà mọi đường argv.
  - K7 +1: dòng mới ở ĐỈNH file (ngoài try) → ném thì thoát mã gì.
- **E3** `tu_chay/PHIEN_BAN` → `tu-chay 1.5.0`; `tu_chay/MAU_PHIEU.md` thêm một dòng nhắc `HEAD ĐÃ KIỂM` (C1).

---

## 6. Ca thử ánh xạ 1-1 với Nghiệm thu (B, C, D1–D4, E)

| Mục | Bài / ca | Đỏ trên gốc vì |
|---|---|---|
| B1 cho | `thu_nguoi_gac`: `git rm viec/X/a.js` · `git rm -q a b` (2 file trong Phạm vi) → CHO | hôm nay GIT-LENH |
| B1 chặn (mỗi vế một ca) | `--quiet`, `-r`, `-f`, `--cached`, `-n`, `-rq`, `--`, `--pathspec-from-file=x`, thư mục, `viec/X/*.js`, `'a?.js'`, `:(glob)x`, file ngoài Phạm vi (G5), file luật không ghi đúng tên (G-LUAT), `phieu.md`, `.claude/x`, `.env`, `../ngoai`, đường tuyệt đối ngoài kho, cwd trong kho lồng, `$F`, không tên file | ca CHO đỏ trên gốc |
| B1 git thật | kho thử: `git rm <đã theo dõi> <chưa theo dõi>` → git thoát ≠ 0 và file đã theo dõi KHÔNG bị xoá | khoá giả định "git tự đảm bảo" |
| B2 | `TaskStop` → CHO; tập `CONG_CU_DOC` (`:640`) có `TaskStop` | hôm nay CC-LA |
| B3 cho | `git fetch origin viec/X`, `git fetch -q origin viec/X`, `git pull --no-rebase --ff-only origin viec/X`, `git pull --ff-only --no-rebase -q origin viec/X`, `Monitor` với fetch | hôm nay GIT-LENH |
| B3 chặn (mỗi vế một ca) | `viec/Y`, `main`, thiếu `--ff-only`, thiếu `--no-rebase`, `--rebase`, `--no-ff`, `--ff`, `-r`, `--quiet`, `--no-rebas` (viết tắt), refspec `viec/X:viec/X`, `+viec/X`, `:x`, chỉ `origin`, remote khác, URL, `--all`, `--prune`, `--depth=1`, `--unshallow`, `--force`, cwd nháp, cwd ngoài kho (không treo), kho lồng, HEAD tách rời, đứng `main`, viec/ không phiếu, `$B`, `git fetch origin viec/X && git merge FETCH_HEAD` | |
| B4 | `thu_cong_cu` H: bước 1 có `git fetch origin viec/`, `FETCH_HEAD`, `merge-base --is-ancestor`, `git pull --no-rebase --ff-only origin viec/`, "sửa dở" → không kéo, lệch hai phía → dừng, SHA ghi SAU khi kéo, luật stop hook (config/amend/rebase → không làm) | skill gốc thiếu |
| B4 nối B3 | `thu_nguoi_gac`: mọi lệnh git trong bước 1 của skill (trích bằng mẫu `` `git …` ``) → người gác CHO | gốc chặn fetch/pull |
| B5 | `ke_hoach.md` mục 2 | — |
| C1 | `thu_cong` (tĩnh), mỗi ca phá đúng một vế: thiếu dòng → ĐỎ · SHA cũ hơn commit code → ĐỎ · SHA không thuộc PR → ĐỎ · SHA = commit code cuối → ĐẠT · commit hồ sơ sau → ĐẠT · "+ commit này" đúng → ĐẠT · "+ commit này" ghi ở commit hồ sơ sau → ĐỎ · "+ commit này" cha sai → ĐỎ · PR chỉ hồ sơ → không áp · commit cài `.claude/` + `cong.yml` sau lần kiểm → ĐẠT · commit merge từ main sau lần kiểm → ĐỎ, SHA = commit merge → ĐẠT | gốc không có A19 |
| C1 đột biến | `cong({ tat: A19 })` → các ca ĐỎ thành ĐẠT (khuôn `thu_cong.js:404–408`) | |
| C2 | `thu_cong` (chạy): gốc in 2 ca, head 3, SỐ CA 3 → ĐẠT kèm CẢNH BÁO nêu 2 và 3 · khớp → không cảnh báo · gốc không in dòng tổng → không cảnh báo | gốc không cảnh báo |
| C3 | `thu_cong_cu`: THIET_KE B15 nêu "A18 không chạy đột biến" | |
| D1 | `thu_gia_lap` T7c mới · T7a/T7b có IPC · `luotBien` vẫn chạy | T7c đỏ trên gốc |
| D2 | `thu_gia_lap` ca `/dev/fd/3` + đột biến `BV-D2-bo-dung-het-3` | đột biến (ca hồi quy) |
| D3 | `thu_gia_lap` ca 'Lượt' cắt đôi qua `chayGL` và `chayTheoDoi` + 2 đột biến BV-D3 | đột biến |
| D4 | `node viec/LUOI-1/do_thoi_gian.js kb` → 29 dòng `DO KB` | gốc ném lỗi neo |
| E1 | `thu_cong_cu`: THIET_KE không còn "22 s" / "≥ 11" / "≥ 9", có `NGUONG_KICH_BAN`; B15 có A19 + giới hạn A18; B3 có `git rm`, `TaskStop`, `fetch`; không còn "TaskStop … bị chặn", "người gác cấm `fetch`" | gốc thiếu |
| E2 | `thu_cong_cu` `baiKhuonLoi` (`:324`): ≤ 120 dòng + có 5 câu khoá (vd "ĐÚNG lỗi cũ", "đường argv", "ĐỈNH file", "dấu vết", "lặp ≥ 3") | gốc thiếu |
| E3 | `thu_cong_cu`: PHIEN_BAN = 1.5.0; MAU_PHIEU và skill bước 10 có `HEAD ĐÃ KIỂM` | gốc thiếu |
| F | `npm test`; `--day-du` 0 CẢNH BÁO trừ "khớp từng byte"; 4 bài `thu_*` xanh; `thu_gia_lap` ×3 riêng; TACH-GL 29/29; LUOI-1 80/80 | — |

## 7. Đột biến (`viec/TU-CHAY-5/dot_bien.py`, mỗi đột biến một dòng `('<tên>', …)`)
Việc không đổi `server/` hay `client/src/` nên A18 không áp, nhưng mọi chỗ vá vẫn có VS-/BV-:
- B1: `BV-B1-bo-rm` · `VS-B1-rm-cho-moi-co` · `VS-B1-rm-mien-hoantac` (gọi `ghiDuoc` với hoanTac = true)
- B2: `BV-B2-bo-TaskStop`
- B3: `BV-B3-bo-keo` · `VS-B3-pull-thieu-ff-only` · `VS-B3-keo-moi-nhanh` · `VS-B3-keo-bo-khoLong`
- C1: `BV-C1-bo-A19` · `VS-C1-chi-so-head` · `VS-C1-commit-nay-moi-noi` · `VS-C1-khong-loai-claude`
- C2: `BV-C2-bo-canh-bao`
- D1: `BV-D1-bo-ipc`
- D2: `BV-D2-bo-dung-het-3`
- D3: `BV-D3-chayGL-bo-setEncoding` · `BV-D3-theodoi-bo-setEncoding`

Bỏ `VS-D1-ipc-sau-ten` của bản trước: nó sẽ SỐNG (không ca nào phân biệt thứ tự phép IPC và phép tên).
Đột biến chạy trên bản sao CHÉP THẬT trong thư mục nháp, có kiểm realpath (K5). Bài tương ứng phải ĐỎ.

## 8. Đường song song (K4) và luồng hợp lệ KHÔNG bị chặn (K5)
**Người gác:**
- push, rm, fetch, pull dùng chung `khoLong` + `laCon` trước.
- `GIT-COMMIT-NHANH` cố ý không đi qua `khoLong` (B3).
- `Monitor` đi qua `xetBash` (`:928`).
- Lệnh ghép đã do `dsLenh` tách.

**Hai đường kéo nhánh** (hook `cai_thu_vien.sh` và skill bước 1) cùng luật: sửa dở → không kéo; so với `FETCH_HEAD`;
`--ff-only`.

**Luồng hợp lệ phải KHÔNG bị chặn:**
- Người gác: mọi ca push cũ (`thu_nguoi_gac.js:199–260`); `git add` / `commit` / `checkout --`; `TaskOutput`; `git rm` file trong
  `viec/X/**`.
- Cổng C1: "chat soát thay"; PR chỉ hồ sơ; commit hồ sơ sau lần kiểm; commit cài `.claude/` + `cong.yml` của chủ quán.
- D1: cha sinh lượt; `--luot k` không `--kho`; T8 vẫn từ chối với câu cũ.
- D3: `do_thoi_gian.js` dùng `encoding: 'utf8'` (`:19`) — đúng sẵn.

## 9. Câu hỏi cho chủ quán (trước khi làm)
- **Q1 A8 trên PR này.** PR đổi `tu_chay/*` mà `.claude/tu_chay/*` (cấm sửa) còn bản cũ, nên cổng A8 đỏ và bộ kiểm cảnh báo
  "khớp từng byte" cho tới khi chủ quán chạy `bash tu_chay/cai_dat.sh` trên nhánh việc (`cong.js:18` CAI_LAI). C1 đã loại
  `.claude/` khỏi "code" để commit cài đó không làm A19 đỏ. Xử lý như các việc TU-CHAY trước — đúng không?
- **Q2 D2 dùng `--cau-hinh /dev/fd/3`** (fd 3 của con là kênh IPC), không thêm cửa sau vào `chay.js`. Đồng ý?
- **Q3 D3 ca không tất định tuyệt đối** (khe 300 ms). Bằng chứng là đột biến, chạy ≥ 3 lần. Chấp nhận, hay cho `chayGL` thêm
  tuỳ chọn ghi stdin để con chờ tín hiệu (tất định, +3 dòng)?
- **Q4 B1 "file đang được theo dõi"** do git tự đảm bảo, người gác không gọi git; có ca git thật khoá. Đồng ý?
- **Q5 C2 cảnh báo luôn bật với PR thêm luật người gác** (dòng tổng `thu_nguoi_gac` đếm cả phép theo số luật). Giữ đúng phiếu (so cả
  số), hay chỉ so phần "a/B ca"?
- **Q6 Thời gian máy:** ~69 phút (mục 1), dưới ngưỡng ~180 phút nên không đề xuất tách.
- **Q7 B5 / Phát hiện:** `tu_chay/cai_thu_vien.sh` (ngoài Phạm vi) im lặng khi HEAD tách rời. Chỉ ghi Phát hiện, không sửa.

## 10. Agent phụ soát kế hoạch (11.10.2026) — đã sửa vào bản này

| Điểm | Sửa |
|---|---|
| `--quiet` vượt chữ phiếu (B1, B3) | bỏ, thêm ca chặn `--quiet` |
| B1 chép `xetHoanTac` | dùng chung, tham số hoá, hoanTac = false |
| FIFO không tất định | `/dev/fd/3` |
| C1 `log -1` theo ngày | `rev-list <sha>..head -- <pathspec>` |
| Ca cũ người gác đỏ (`:132, :194–195, :640`) | ghi rõ ở mục 2 |
| A19 làm đỏ ca ĐẠT cũ của `thu_cong` | `pr()` mặc định thêm dòng HEAD ĐÃ KIỂM |
| Ca commit merge, commit cài `.claude/` | thêm vào mục 6; loại `.claude/` + `cong.yml` khỏi pathspec |
| D3 "gốc ra �" sai theo cổng | ghi rõ: bằng chứng là đột biến |
| `VS-D1-ipc-sau-ten` sẽ SỐNG | bỏ |
| E1/E2 thiếu ca | thêm phép trong `thu_cong_cu` |
| Thời gian còn ô trống / đoán | điền số đo; số vòng ghi là giả định |
| T7c sót kho trong TAM | TMPDIR riêng |
| Neo TACH-GL `:146` | phép IPC thành dòng riêng |
| `khoLong` vòng treo ngoài kho | `laCon` trước; ca cwd ngoài kho |
| `GIT-COMMIT-NHANH` | cố ý, ghi chú thích |
| `+= d` ở `thu_nguoi_gac.js:662` | sửa cùng D3 |
| THIET_KE `:534, :647, :806` | thêm vào E1 |
| so `origin/viec/$0` | so `FETCH_HEAD` như hook |
| ghi SHA trước pull | ghi sau |
| C2 cảnh báo oan với PR thêm luật | Q5 |
