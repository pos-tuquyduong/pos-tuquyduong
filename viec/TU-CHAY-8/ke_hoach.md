# TU-CHAY-8 — kế hoạch (chờ chủ quán duyệt)

Nền: `41ad9ab` (PHIEU) trên `2b65db4`. Mọi số dòng dưới đây đọc trong lượt này.

## 0. Số đo và ràng buộc tìm ra khi đọc code

| # | Sự thật | Nguồn | Hệ quả cho kế hoạch |
|---|---|---|---|
| 0.1 | `thu_cong.js` chạy liền ở máy mây này: **51,6 s**, 337 phép. Đo từng khối: `baiCong` 50,2 s · `baiYml` 0,02 s · `baiNapCauHinh` 0,14 s · `baiKhoaCauHinh` 0,003 s · `baiDonTam` 0,09 s | đo trên bản sao trong nháp | Chỉ `baiCong` đáng chia. Chia theo **từng lần gọi `ca()`** (~115 lời gọi, `grep -c "^  ca(\|^  C2("` = 115) + vài khối `{ … }` riêng |
| 0.2 | `cong_cu/thu_gia_lap.js:239-247` (C3f, **file Cấm**) khoá: lời gọi `chayBaiThat('tu_chay/thu_cong.js', …, true)` phải có đúng nguyên chữ, chữ ký `function chayBaiThat(…canhGan = false)` không thêm tham số | đọc | Không đưa được việc chạy song song vào `kiem_tra_truoc_khi_giao.js` qua `chayBaiThat` (sync `spawnSync`, `:480`). → điều phối song song nằm **trong `thu_cong.js`** (Q3) |
| 0.3 | `cong_cu/thu_gia_lap.js:213-216` (C3, Cấm) chạy `chayBaiThat` thật với bài giả `ngu.js` / `ngu70.js` **im lặng, thoát 0** và đòi `chac` = `true` | đọc | A4 làm C3a/C3b/C3d/C3g/C3h ĐỎ → `--day-du` đỏ. **Q1** |
| 0.4 | `cong_cu/gia_lap/chay.js` (Cấm) in dòng tổng dạng `Giả lập: N kịch bản · M bất biến` — không thuộc 3 dạng `soCa` (`tu_chay/cong.js:84-95`) | `grep` | A4 đúng 3 dạng thì `--day-du` đỏ ở giả lập. **Q2** |
| 0.5 | `cong_cu/thu_TOCDO1.js:24-33` cắt khối từ `function lyDoChayThuCong(` tới dòng "bỏ qua thu_cong.js", chạy bằng `new Function('spawnSync','GOC','DAY_DU','chayBaiThat','dong', khoi)`; E1 đòi đúng MỘT chuỗi `chayBaiThat('tu_chay/thu_cong.js'` trong file; mục C (`:190-210`) dùng bài giả `ngu85.js` im lặng | đọc | Sửa khối thì sửa luôn tham số `new Function` (T-ca + T11 hook) và `ngu85.js` in dòng tổng — file trong Phạm vi |
| 0.6 | Hầu hết script chạy thật trong kho chứa cụm của B-BIMAT-CHU (`TOKEN\|SECRET\|API_KEY\|environ`): `kiem_tra_truoc_khi_giao.js`, `cong_cu/thu_P20/21/26a/26b/26c.js`, `thu_GOI1.js`, `thu_gia_lap.js`, `gia_lap/chay.js`, `tu_chay/thu_nguoi_gac.js`, `nguoi_gac.js` (Grep, 25 file trong cong_cu/tu_chay/viec) | Grep | A3 soi MỌI file → chặn cả `node kiem_tra_truoc_khi_giao.js --day-du` (CLAUDE.md §3 bắt buộc). Phải có miễn trừ. **Q5** |
| 0.7 | `tu_chay/nguoi_gac.js` không dùng `child_process` (chỉ đọc `.git/HEAD`, `:874-884`) | grep | A3 miễn trừ "đã commit, không sửa" cần gọi `git status` — thêm `spawnSync` vào người gác |
| 0.8 | `bash`/`sh` chạy được file `.claude/tu_chay/*.sh`, `cong_cu/**/*.sh` (B-BASHFILE) và `tep_bash_them` (`nguoi_gac.js:421-425`) | đọc | Đường song song thứ 3 của "chạy file script" (ngoài node, python3) |
| 0.9 | `node tu_chay/cong.js chay . 41ad9ab^ HEAD viec/TU-CHAY-8` chạy ĐƯỢC ở máy mây này: `✓ CỔNG CHẠY ĐẠT`, thoát 0, ~5 phút (04:30→04:35, gồm npm ci hai thư mục + `npm test` + `--day-du`); người gác cho qua | chạy thật | TU-CHAY-7 chưa thử chế độ chay (hồ sơ chỉ ghi "không chạy ở đây", không có lỗi nào). Không cần sửa code cho A2 — chỉ thêm bước vào skill |

## A1 — chia lượt `tu_chay/thu_cong.js`

**PA-A (chọn).** `thu_cong.js --phan i/n` chạy phần i; gọi không đối số = **điều phối**: sinh n = 3 tiến trình con
`--phan 1/3 … 3/3` cùng lúc (`spawn`, mỗi con `timeout` 120 000 ms như cũ), chép nguyên đầu ra từng con, in dòng tổng chung
`thu_cong: P phép · H chỗ hỏng` (giữ dạng `soCa` cũ), thoát 1 nếu con nào đỏ / quá giờ / không in dòng phần.
- Chia: bộ đếm `donVi` tăng ở mỗi lời gọi `ca()`, mỗi khối `{ … }` đứng riêng trong `baiCong`, khối phép tĩnh cuối `baiCong`, và
  mỗi bài nhỏ (`baiYml`, `baiNapCauHinh`, `baiKhoaCauHinh`, `baiDonTam`). Đơn vị k thuộc phần `(k mod n) + 1`. Đột biến tắt kiểm
  (`DB`, `:510-545`) chạy ở phần đã chạy ca của nó (ca thuộc phần khác → bỏ qua; ca của mình mà thiếu PR → vẫn "thiếu ca" như cũ).
  Mỗi phần tự `dungKho()` (kho tạm riêng, TAM riêng theo pid — dọn như cũ).
- Mỗi phần in `thu_cong phần i/n: a/T đơn vị · p phép · h chỗ hỏng` (T = tổng đơn vị, mọi phần đếm như nhau vì đi qua cả danh sách).
- `kiem_tra_truoc_khi_giao.js`: lời gọi giữ NGUYÊN chữ (`chayBaiThat('tu_chay/thu_cong.js', undefined, 120000, true)`, C3f + E1),
  bọc bằng hàm mới `kiemPhanThuCong(ra)` đặt TRONG khối cắt của thu_TOCDO1: đủ phần 1..n, cùng n, cùng T, Σa = T, không trùng
  phần → không thì FAIL `thu_cong.js thiếu phép: …`. Bộ kiểm không tin điều phối: tự đếm từ dòng của từng phần.
- "Tổng phép = số phép khi chạy liền": Σa = T bảo đảm mọi đơn vị chạy đúng một lần; số phép mỗi đơn vị không phụ thuộc phần → Σp
  = số phép chạy liền. Đo một lần: `--phan 1/1` vs Σp ba phần, ghi vào `bang_chung_do.txt` (không chạy liền trong `npm test` — tốn 52 s).
- Ước lượng: mỗi phần ~18–22 s ở máy mây này (≥ 3 lõi) → < 50 % hạn. Đo 3 lần, ghi số. Trên máy 1 lõi (Replit) chạy song song
  không nhanh hơn — ghi CHƯA KIỂM, không nới hạn.
- Dòng: `thu_cong.js` ~+30, `kiem_tra` ~+12.

**PA-B (loại).** Điều phối trong `kiem_tra_truoc_khi_giao.js` (driver `node -e` qua `spawnSync`, gọi n phần): ~+30 dòng ở bộ kiểm,
phải đổi lời gọi `chayBaiThat('tu_chay/thu_cong.js', …)` → C3f của `thu_gia_lap.js` (Cấm) đỏ; E1/C1/C2 của thu_TOCDO1 viết lại.

## A2 — cổng chạy trên máy mây + skill

- Thử thật (0.9): ĐẠT, ~5 phút. Lý do TU-CHAY-7 ghi "chỉ cổng tĩnh": không có lệnh hỏng nào trong hồ sơ — chưa từng chạy. Lưu ý
  sau A3: `cong.js` đã commit + sạch → miễn soi; ở việc sửa `cong.js` thì commit trước khi chạy (cổng vốn chạy trên HEAD đã commit).
- Skill `tu_chay/skill_lam_viec.md`:
  - bước 11.4: trước dòng `HEAD ĐÃ KIỂM`, chạy `node tu_chay/cong.js chay . <mốc>^ HEAD viec/<MÃ>` (cây sạch, đứng ở HEAD) và
    chép vào `trang_thai.md` dòng `✓ CỔNG CHẠY ĐẠT` hoặc NGUYÊN từng dòng `✗`; `✗ [A8]` chờ cài thì ghi rõ.
  - bước 4: việc đổi bài thử của chính bộ khung (bài tự thử mình — `thu_cong.js`…, xanh trên gốc) → ghi TRƯỚC vào câu hỏi xin
    `## Bài thử cũ sửa`, hoặc có `SỐ CA` cho MỌI bài thử đổi (PR #31 đỏ cả A11 lẫn A16 vì thiếu hai thứ này).
- Ca `thu_cong_cu.js`: hai phép đọc skill (bước 11 có `cong.js chay` + `✓ CỔNG CHẠY ĐẠT` đứng TRƯỚC `HEAD ĐÃ KIỂM`; bước 4 có câu
  "tự thử chính nó" + `## Bài thử cũ sửa` + `SỐ CA`). Gốc: đỏ.
- Dòng: skill ~+3, thử ~+6.

## A3 — người gác soi file script được chạy

**PA-A (chọn).** Hàm `xetTep(t, nc, cwd)` trong `nguoi_gac.js`, gọi ở MỌI đường "chạy nội dung file":
`node <f>`, `python3 <f>` (script từ `maNoi`, `:488`), `bash|sh <f>` (nhánh `:421-425`, trước khi cho qua), và chuyển hướng vào
`node < f` / `python3 < f`.
- Soi khi file nằm trong kho hoặc nháp. **Miễn**: file đã commit và không sửa (`git status --porcelain --ignored
  --untracked-files=all -- <f>` rỗng, chạy ở gốc kho). Git lỗi → soi (đóng an toàn). File không đọc được → cho qua (node tự báo lỗi).
  Nháp luôn soi.
- Luật áp lên nội dung — dùng lại đúng hàm có sẵn, không viết luật mới: regex B-BIMAT-CHU (`:357`) + `loMoiTruong` (`:517`) →
  B-BIMAT-CHU; `laBiMat` (`:375`) trên từng từ của file → B-BIMAT-FILE; `reManoi` (`:457`) → B-MANOI.
- File > 200 KB cần soi → chặn `B-PHANTICH` ("script quá 200 KB, người gác không đọc"). Đường dẫn script không viết thẳng → B-DICHCHU.
- `… | node` / `… | python3` không script, không `-e/-c` (mã đọc từ ống) → chặn B-PHANTICH (đường song song "đổ file vào stdin"). **Q5c**
- Skill (luật cứng): "sửa file có cụm bí mật của bài thử thì dùng công cụ Edit/Write, không dùng lệnh bash".
- `node cong_cu/thu_P20.js`: file đã commit, sạch → **qua** (miễn trừ). `npm test` không qua nhánh này (người gác chỉ xét lệnh của
  máy; `npm test` → NPM-LENH cho qua) → không hỏng.
- Dòng: ~+30 người gác, ~+45 ca thử.

**PA-B (loại).** Soi mọi file, không miễn trừ: ít hơn ~5 dòng nhưng chặn `node kiem_tra_truoc_khi_giao.js --day-du`, mọi bài
`thu_P*.js`, `dong_tien_do.py`? (0.6) — K5.

## A4 — bộ kiểm đòi dòng tổng

`chayBaiThat` (`kiem_tra_truoc_khi_giao.js:478-490`): bài thoát 0 mà không có dòng tổng → cùng phép đó FAIL, lý do
`bài không in dòng tổng`. Regex viết trong thân hàm (thân hàm bị cắt chạy riêng ở thu_gia_lap C3 và thu_TOCDO1 C — không gọi được
hàm ngoài): 3 dạng của `soCa` (`cong.js:89-92`, bỏ mã màu) — **+ dạng giả lập** nếu Q2 duyệt. ~+4 dòng.
- Ca `thu_TOCDO1.js` (mục C mở rộng): bài giả thoát 0 im lặng → FAIL "dòng tổng" (gốc: ✓); mỗi dạng (đạt·hỏng có mã màu, phép·chỗ
  hỏng, người gác, giả lập) → xanh; thoát 1 có dòng tổng → FAIL lý do cũ (không đổi). `ngu85.js` in dòng tổng (C1 giữ nghĩa).
- Mọi bài thật đang gọi qua `chayBaiThat` đã in dòng tổng (grep): thu_P20/21/26a/26b/26c, GOI1, thu_gia_lap (`đạt · hỏng`),
  thu_cong_cu (`phép · chỗ hỏng`), thu_nguoi_gac (`ca người gác`), thu_cong (điều phối, `phép · chỗ hỏng`), giả lập (Q2).

## A5 — bỏ ghim phiên bản

- `tu_chay/PHIEN_BAN` → `tu-chay 1.8.0`.
- `thu_cong_cu.js:459`, `thu_nguoi_gac.js:707-709`: thay "đúng chữ 1.7.0" bằng: PHIEN_BAN khớp `^tu-chay \d+\.\d+\.\d+$` VÀ
  `THIET_KE.md` có dòng tiêu đề `### … (…, <phiên bản>)` mang đúng chuỗi đó (đổi phiên bản mà quên ghi THIET_KE → đỏ). Lần sau chỉ
  sửa PHIEN_BAN + mục THIET_KE — không đụng bài thử (gốc của lỗi A16 ở PR #31).
- `THIET_KE.md`: mục `### TU-CHAY-8 (17.10.2026, tu-chay 1.8.0)` ghi A1–A5 ngắn.
- Dòng: ~+2 mỗi bài thử, THIET_KE ~+8.

## Ca thử ↔ Nghiệm thu

| Nghiệm thu | Bài thử / ca | Gốc |
|---|---|---|
| A1 phần chạy được, song song, hạn 120 s | đo: `node tu_chay/thu_cong.js --phan i/3` ×3 lần mỗi phần + điều phối; số ghi `trang_thai.md` | — |
| A1 tổng không giảm; ca đỏ bỏ một phần | thu_TOCDO1 mục P: `kiemPhanThuCong` thật (cắt từ khối) với đầu ra giả: đủ 3 phần → pass · thiếu phần 3 → FAIL "thiếu" · trùng phần · Σa ≠ T · T lệch · không dòng phần (bản cũ chạy liền) → FAIL | đỏ (không có hàm) |
| A1 lời gọi thật vẫn qua kiemPhanThuCong | thu_TOCDO1 E1 mở rộng: khối có `kiemPhanThuCong(chayBaiThat('tu_chay/thu_cong.js'` | đỏ |
| A2 skill hai câu | thu_cong_cu.js 2 phép mới | đỏ |
| A2 cổng chạy cục bộ | chạy thật, chép kết quả vào `trang_thai.md` | — |
| A3 script nháp có JWT_SECRET → chặn | thu_nguoi_gac: `node <nháp>/s.js`, `python3 <nháp>/s.py`, `bash cong_cu/x.sh` (chưa commit) → B-BIMAT-CHU | qua → đỏ |
| A3 nháp vô hại → qua | thu_nguoi_gac (K5) | qua |
| A3 luật khác trên nội dung | process.env → B-BIMAT-CHU · `.claude/x` → B-MANOI · `.env` → B-BIMAT-FILE · > 200 KB → B-PHANTICH · `node < f` · `cat f \| node` | qua → đỏ |
| A3 thu_P20 thật | kho git tạm: file đã commit sạch chứa JWT_SECRET → qua (K5); cùng file sửa dở → chặn; chưa theo dõi → chặn; `bash ban_mau_pos/chay_thu.sh` đã commit → qua (K5) | — |
| A4 bài im lặng → FAIL | thu_TOCDO1 mục C mở rộng | ✓ → đỏ |
| A5 không ghim | thu_cong_cu + thu_nguoi_gac: PHIEN_BAN giả `tu-chay 9.9.9` không có trong THIET_KE → đỏ (chạy với bản sao) — gom vào đột biến `BV-…`/`VS-…` | — |
| A6 | `npm test`, `--day-du`, cổng chạy, `dot_bien.py`, `bang_chung_do.txt` | — |

**Luồng hợp lệ phải KHÔNG bị chặn (K5):** `node kiem_tra_truoc_khi_giao.js [--day-du]` · `node cong_cu/thu_*.js` đã commit ·
`python3 dong_tien_do.py` · `bash ban_mau_pos/chay_thu.sh` · `node tu_chay/cong.js …` · `python3 viec/<MÃ>/dot_bien.py` vô hại
(chưa commit — có soi, nội dung không cụm cấm) · `npm test` · `node -e` / heredoc như cũ (luật cũ không đổi) · điều phối
thu_cong khi hook pre-commit chạy (GIT_INDEX_FILE: con kế thừa env đã lọc như cũ).

**Đường song song cần canh (K4):** A1 — mỗi lời gọi `ca`/khối/bài nhỏ là một đơn vị (sót một chỗ = chạy ở mọi phần → Σa > T?
không: chỗ sót không đếm → chạy n lần, Σp lệch — bắt bằng đo Σp = liền); A3 — node · python3 · bash/sh · chuyển hướng `<` · ống;
A4 — mọi lời gọi `chayBaiThat` (11 chỗ: `kiem_tra:492` ×6, `:621`, `:623`, `:641`, `:850`, `:854`) dùng chung một hàm → một chỗ vá; A5 — hai bài thử ghim.

**Đột biến dự kiến (`dot_bien.py`):** BV-TUCHAY8-PHAN-KHONG-CHIA (mọi đơn vị chạy ở mọi phần), VS-TUCHAY8-PHAN-LECH-MOT (k mod n
lệch một), BV-TUCHAY8-KIEM-PHAN (bỏ kiemPhanThuCong), VS-TUCHAY8-KIEM-PHAN-CHI-DEM-SO-PHAN (chỉ đếm số dòng phần, không so Σa = T),
BV-TUCHAY8-SOI-TEP (bỏ xetTep), VS-TUCHAY8-SOI-CHI-NODE (bỏ python3/bash), VS-TUCHAY8-MIEN-MOI-FILE-THEO-DOI (miễn cả file sửa dở),
BV-TUCHAY8-DONG-TONG, VS-TUCHAY8-DONG-TONG-CA-KHI-DO (chỉ đòi khi thoát ≠ 0), BV-TUCHAY8-PHIENBAN-THIETKE, BV-TUCHAY8-SKILL-B11,
BV-TUCHAY8-SKILL-B4. Có đối chứng (bản không đột biến xanh).

## Ngân sách
Code khung ~+85 (thu_cong 30 · kiem_tra 16 · nguoi_gac 30 · skill 4 · PHIEN_BAN 1 · THIET_KE 8 — tài liệu không tính) — trong
80–140. Thử ~+110 (thu_TOCDO1 45 · thu_nguoi_gac 45 · thu_cong_cu 10 · ghim 4 · thu_gia_lap 3 nếu Q1a) — dưới 150.
Thời gian máy: `npm test` khi đổi tu_chay/: thu_cong từ ~52 s → ~20 s (máy ≥ 3 lõi); `--day-du` không đổi đáng kể.

## Câu hỏi (gom một lần)

- **Q1 (A4 × file Cấm):** `cong_cu/thu_gia_lap.js:213-216` dùng bài giả im lặng thoát 0; A4 làm C3a/b/d/g/h đỏ → `--day-du` đỏ.
  (a) **[đề xuất]** thêm `cong_cu/thu_gia_lap.js` vào Phạm vi, chỉ sửa 3 bài giả cho in một dòng `1 đạt · 0 hỏng` (+ mục
  `## Bài thử cũ sửa` — xanh trên gốc); LUOI-5 không đụng file này. (b) bỏ A4 khỏi `chayBaiThat`, viết phép riêng sau từng lời gọi
  (11 chỗ — K4, nhiều dòng hơn).
- **Q2 (A4 dạng thứ 4):** giả lập (`gia_lap/chay.js`, Cấm) in `Giả lập: N kịch bản · M bất biến`. Cho `chayBaiThat` nhận thêm dạng này
  (bộ kiểm đã đòi đúng dòng đó ở `kiem_tra:851`) — **[đề xuất]**; hay phải sửa giả lập (Cấm)?
- **Q3 (A1 nơi điều phối):** phiếu ghi "kiem_tra chạy các phần SONG SONG". Vì C3f của `thu_gia_lap.js` (Cấm) khoá nguyên lời gọi,
  đề xuất điều phối nằm trong `thu_cong.js` (gọi không đối số), còn bộ kiểm tự đếm dòng từng phần (`kiemPhanThuCong`) — duyệt?
- **Q4 (cổng A11 cho chính việc này):** `tu_chay/thu_cong.js` sửa mà XANH trên gốc (bài tự thử chính mình — đúng chỗ PR #31 đỏ).
  Xin thêm vào phiếu: `## Bài thử cũ sửa` với `- tu_chay/thu_cong.js — chia lượt --phan; bài tự thử bộ khung cổng, không đỏ được trên gốc`
  (và `cong_cu/thu_gia_lap.js` nếu Q1a). Các bài đổi khác đỏ trên gốc (thu_TOCDO1, thu_nguoi_gac, thu_cong_cu) → có `SỐ CA`.
- **Q5 (A3 miễn trừ):** (a) miễn file đã commit + không sửa (đề xuất) — hệ quả: chạy THẲNG một bài thử đang sửa có cụm bí mật /
  `.claude` (vd `node tu_chay/thu_nguoi_gac.js` khi đang sửa nó) bị chặn → commit trước rồi chạy, hoặc chạy qua `npm test`;
  (b) đường soi thêm `node < f` (chặn theo nội dung) và `… | node` không script (chặn luôn) — duyệt thêm hai đường siết này?

## Soát kế hoạch (agent phụ, chỉ đọc) — đã nhận vào kế hoạch

1. Ngoài Phạm vi: không; `thu_gia_lap.js` chỉ ở Q1a. ✓
2. Ngắn hơn: bỏ hai đường siết `node < f` / `| node` → để chủ quán chọn ở Q5b. Phép THIET_KE của A5 GIỮ (phiếu đòi "THIET_KE.md ghi
   A1–A5", ~1 dòng, và là thứ duy nhất làm "quên đổi phiên bản" lộ ra khi bỏ ghim). [Soát vòng 1: câu này sai — phép chỉ bắt "nâng
   PHIEN_BAN mà quên ghi THIET_KE"; sửa tu_chay/ mà quên nâng PHIEN_BAN thì mục cũ vẫn khớp, phép vẫn xanh.]
3. Ca còn thiếu → thêm:
   - A3 câu skill "dùng Edit/Write, không bash" → phép đọc skill trong `thu_cong_cu.js` + đột biến `BV-TUCHAY8-SKILL-EDIT`.
   - A1 hạn 120 s mỗi phần → phép tĩnh trong `thu_TOCDO1` mục P: điều phối sinh con với `timeout: 120000` (đọc mã nguồn thu_cong.js).
   - A5 "đúng 1.8.0" → `PHIEN_BAN` là chữ (BV-); THIET_KE có tiêu đề mang `tu-chay 1.8.0` → ca bản sao `tu-chay 9.9.9` đỏ.
   - A1 "tổng phép KHÔNG giảm": Σa = T chỉ bảo đảm các phần = chạy liền **của cùng phiên bản**; bớt hẳn một ca thì T giảm theo.
     Cấm của phiếu ("không bớt phép") nay chỉ canh bằng soát diff. **Q6.**
4. Đường song song → thêm vào A3/A1:
   - `node -r/--require/--import/--loader <file>`: maNoi bỏ qua giá trị cờ (`nguoi_gac.js:491,499`) → soi cả file đó.
   - File do script `require`/`import`: KHÔNG soi (bắc cầu nặng, phải phân tích mã) → ghi CHƯA KIỂM / lỗ còn hở THIET_KE.
   - Miễn "đã commit, không sửa": máy commit script chứa cụm cấm rồi chạy là lọt (`git commit` được phép, `:116`). Lỗ có dấu
     vết (commit nằm trong PR, soát + cổng thấy), khác đường nháp không dấu vết hiện nay → ghi rõ trong Q5a + THIET_KE "lỗ còn hở".
   - `npm run`/`npm test` chạy script của `package.json` — file luật, phải ghi đúng tên trong Phạm vi → ngoài A3, ghi lỗ còn hở.
   - Chế độ con `--con-het`/`--con-nem` (`thu_cong.js:36-37`, `baiDonTam` `:742`) đọc `argv[2]` trước; `--phan` đọc sau, không đụng.
   - Dòng tổng của điều phối in **SAU CÙNG** (dòng phần cũng khớp `phép · chỗ hỏng`; `soCa` lấy dòng khớp cuối, `cong.js:84-95`).
   - thu_TOCDO1 mục C: `ngu85.js` in đủ 3 dòng phần + dòng tổng (không thì C1 đỏ vì kiemPhanThuCong); hai stub (`goi` trả
     undefined `:38`, hook T11 trả số `:104`) → `kiemPhanThuCong` nhận mọi kiểu (`String(ra || '')`), `chac` của stub là no-op.

- **Q6 (A1 tổng phép):** thêm bánh cóc `NGUONG_THU_CONG_DON_VI = <T hiện tại>` vào bộ kiểm (T < ngưỡng → FAIL; chỉ được HẠ khi chủ
  quán duyệt, như `NGUONG_FETCH`)? Đề xuất: **có** (+2 dòng) — đó là phép duy nhất làm "không bớt phép" thành khoá.
