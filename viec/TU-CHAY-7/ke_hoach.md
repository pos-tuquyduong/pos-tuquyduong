# TU-CHAY-7 — kế hoạch (chờ chủ quán duyệt + trả lời Câu hỏi Q1–Q2 trong trang_thai.md)

Nền: `6cb52fa PHIEU: TU-CHAY-7`. Số dòng đọc trong lượt này ở gốc đó; bản 1 của kế hoạch có 9 số dòng / khẳng định sai — agent soát chỉ đọc
bắt, đã sửa ở bản này (danh sách ở trang_thai "Soát kế hoạch").
Số đo: `thu_cong.js` chạy riêng 89,5 s (75 % hạn 120 s) · `thu_TOCDO1.js` 1,7 s · máy mây 4 lõi.

## A1 — cảnh báo gần hạn cho thu_cong.js

Hiện trạng: `kiem_tra_truoc_khi_giao.js:616` gọi `chayBaiThat('tu_chay/thu_cong.js')` — không cờ; hàm `:478–490` đã có vế cảnh báo (`:487`
`han * 0.8`). `thu_TOCDO1.js` KHÔNG được bộ kiểm chạy qua `chayBaiThat` (chỉ nhắc ở chú thích `:529`, `:602`), chạy 1,7 s → vế "cũng cho
thu_TOCDO1.js nếu > 30 s" không áp dụng.

- **A (chọn):** sửa một dòng `:616` → `chayBaiThat('tu_chay/thu_cong.js', undefined, 120000, true)`. Hạn giữ 120 s. Chú thích `:476` sửa chữ
  "chỉ giả lập + thu_gia_lap" — KHÔNG viết nguyên chữ lời gọi vào chú thích (E1 `thu_TOCDO1.js:33` đếm cả chú thích).
- **B (loại):** đổi mặc định `canhGan = true` — phá C3d/C3h (`thu_gia_lap.js`), cảnh báo cả bài không cần.

Phép neo chữ lời gọi phải sửa cùng (K4):
- `cong_cu/thu_TOCDO1.js:32` `GOI` (dùng ở E1 `:33`) → tiền tố `chayBaiThat('tu_chay/thu_cong.js'` (không đóng ngoặc); `:27` regex dòng gọi
  trần (chỉ dùng cho bản trước TOC-DO-1) → cùng tiền tố.
- `cong_cu/thu_gia_lap.js` C3f `:228–236` thêm `'tu_chay/thu_cong.js'` vào tập bật cờ; chữ "giả lập + thu_gia_lap / bài này" ở `:25`, `:215`,
  tên ca `:233` sửa cùng. Trên gốc: ĐỎ.
- Hồ sơ cũ neo chữ cũ: `viec/HOC-2b/dot_bien.py:61`, `viec/TOC-DO-1/dot_bien.py:31` — hồ sơ việc đã đóng, ngoài Phạm vi: chạy
  `python3 viec/HOC-2b/kiem_neo.py` trên gốc + HEAD, ghi kết quả vào trang_thai (Phát hiện), không sửa.

Ca mới (đỏ trên gốc) — `cong_cu/thu_TOCDO1.js` mục C:
- C1 cắt `function chayBaiThat(` THẬT + khối `lyDoChayThuCong` THẬT; chạy khối với `DAY_DU = true`, `chayBaiThat` = vỏ ghi đối số rồi gọi hàm
  thật trên bài giả ngủ 4,25 s, hạn giả 5 s (85 %, dư 0,75 s tới hạn — cùng cỡ C3 `thu_gia_lap.js:200–201`), cờ lấy từ lời gọi thật → **đúng 1
  cảnh báo, có số giây**. Gốc: 0 cảnh báo → ĐỎ. Bài ngủ cố định ≥ 4,25 s nên không thể rơi dưới 80 % (không đỏ oan khi máy bận).
- C2 hạn ở lời gọi thật = 120000 hoặc bỏ trống (không nới).
- Dưới ngưỡng / bài đỏ / cờ tắt: đã có C3g, C3c, C3d (`thu_gia_lap.js:208–214`, cùng hàm thật) — không lặp.

## A2 — dọn thư mục tạm khi bị ngắt

Hiện trạng: `tu_chay/thu_cong.js:24` tạo `TAM`, dọn DUY NHẤT ở `:723`. `cong_cu/thu_gia_lap.js:42` tạo `TAM`, dọn ở `ket()` `:51–55`.

**thu_gia_lap.js** (bất đồng bộ: spawn / Worker → hàm nghe tín hiệu chạy kịp):
- **A (chọn):** khuôn `viec/AUDIT-4/don_rong.js:14–16`: `process.on('exit', dọn)` + `SIGINT`/`SIGTERM` → `process.exit(130)`; `ket()` bỏ dòng
  rmSync thừa. +2 dòng ròng. **B (loại):** module dọn chung — file mới ngoài Phạm vi.
- Ca mới (bỏ qua khi env `THU_GL_CON=1` — chặn đệ quy), TMPDIR riêng: sinh `thu_gia_lap.js` con, chờ thấy giả lập con đang chạy (thư mục
  `gia_lap_*` trong `thu_gl_*` — đúng tình huống hạn 120 s giết bài giữa E2/T), gửi tín hiệu, chờ đóng. Phép: (a) đối chứng — đã thấy thư mục
  trước khi giết; (b) thoát 130; (c) 0 `thu_gl_*` sót sau 2 s chờ (giả lập con đang ghi có thể đua với rmSync — chờ để bắt đúng ca đó).
  Hai ca: SIGTERM và SIGINT (đột biến "chỉ bắt một tín hiệu" phải chết). Chạy SAU đợt T3–T6, KHÔNG cùng đợt (`:271–272`, KHUON_LOI K3).
  Ca chạy hết: lần chạy đầy đủ của bộ kiểm (`--day-du`) + đếm `thu_gl_*` trong TMPDIR riêng của ca con = 0 — vế `exit` khi thoát bình thường
  khoá bằng ca riêng: con chạy với `--chi-du-lieu-tay` (đường thoát `ket()` ngắn, `:183`) → 0 sót.
- Giả lập con mồ côi khi bài bị giết: ngoài nghiệm thu, ghi Phát hiện.

**thu_cong.js** — CHẶN, xem Câu hỏi Q2: bài chạy đồng bộ liền một mạch (`:720–731` kết thúc bằng `process.exit`), không nhả vòng sự kiện →
hàm nghe SIGTERM/SIGINT không bao giờ chạy trước khi bài xong; tệ hơn, cài hàm nghe là GỠ hành vi chết ngay mặc định → `spawnSync` hạn 120 s
của `chayBaiThat` (`kiem_tra:480`) gửi SIGTERM rồi chờ con chạy hết = NỚI HẠN (Cấm) và Ctrl-C không dừng được. Bản 1 kế hoạch nói "dọn trễ
≤ 30 s, +1–3 s" là SAI. Đề xuất (chờ chốt): `process.on('exit')` (bắt đường ném) + đầu bài dọn các `thu_cong_<pid>_*` có pid đã chết (TAM đặt
tên kèm pid). Ca đỏ: tạo thư mục giả `thu_cong_<pid chết>_x` trong TMPDIR riêng → chạy con ngắn → thư mục biến mất; thư mục của pid CÒN
sống (chính tiến trình thử) → giữ nguyên (K5: hai lần chạy cùng lúc không xoá của nhau). Không cài hàm nghe tín hiệu.

## A3 — phép tĩnh chú thích số dòng cứng

- **A (chọn):** `kiem_tra_truoc_khi_giao.js` thêm hàm `quetDongCung(docFile, dsFile)` → danh sách `file:dòng` (đếm theo DÒNG, không theo số lần
  khớp) có chú thích (phần sau `//`, hoặc dòng mở `/*` / `*`) khớp `\(:\d+\)|:\d+[–-]\d+`. Đếm ở gốc: 3 dòng (`server/routes/orders.js:1633`,
  `cong_cu/thu_P26c.js` 3 lần khớp trên 2–3 dòng — đếm lại khi làm). `NGUONG_DONG_CUNG` = số dòng đó. n > ngưỡng → CẢNH BÁO liệt kê; n < ngưỡng →
  CẢNH BÁO "hạ xuống n". Không FAIL. Hàm đặt SAU khối `xetBanhCoc`/`quetRouteGhi` (mục R `thu_TOCDO1.js:119–122` cắt từ `function xetBanhCoc(`
  tới `\n}\n` thứ hai; R0b `:125–126` đếm `xetBanhCoc(` = 2 → KHÔNG dùng lại `xetBanhCoc`). ~18 dòng.
- **B (loại):** đếm mọi `file.js:NNN` một số — nền hàng trăm chỗ, thành tiếng ồn.
- Bài thử của chính việc này không được thêm dòng khớp: chuỗi mẫu trong thu_TOCDO1 dựng bằng ghép chuỗi (`'(' + ':1234)'`), chú thích mới không
  viết dạng `(:N)` / `:N–M`.

Ca mới (đỏ trên gốc) — `cong_cu/thu_TOCDO1.js` mục D, cắt hàm THẬT, file giả qua `docFile` giả:
- D1 đúng ngưỡng → 0 cảnh báo · D2 thêm 1 → cảnh báo nêu đúng `file:dòng` · D5 bớt 1 → cảnh báo "hạ" (ngay trên / tại / dưới).
- D3 `:12–34` và `:12-34` đều đếm · D4 chữ trong chuỗi mã (không phải chú thích) → không đếm · D7 hai lần khớp trên MỘT dòng → đếm 1.
- D8 danh sách file quét: hàm nhận đúng bốn vùng — một file giả mỗi vùng (`server/a/b.js`, `client/src/x.jsx`, `cong_cu/thu_x.js`,
  `tu_chay/x.js`) đều được đếm; `cong_cu/khac.js`, `client/dist/y.js` không đếm.
- D6 kho thật: đếm ≤ `NGUONG_DONG_CUNG` (≤, không ==: LUOI-4 sửa thu_P26c.js không làm đỏ bài này).
- D9 "không FAIL": chạy bộ kiểm cắt khối gọi (hàm + chỗ gọi) với kho giả vượt ngưỡng → `canhBao` được gọi, `fail` không.

## A4 — KHUON_LOI.md ≤ 100 dòng (từ 116)

**Ràng buộc mới tìm ra:** `tu_chay/thu_cong_cu.js:457–458`, `:467–468` neo nguyên chữ trong KHUON_LOI ('ĐÚNG lỗi cũ', 'argv', 'dấu vết',
'≥ 3 lần', 'ĐỈNH file', 'Chú thích trong code cũng là khẳng định', 'ĐỐI CHỨNG', 'sập ≠ BẮT', 'không che lỗi', 'GOI-2 B3c', 'CÙNG biểu
thức', 'getNow'). Gộp / rút phải GIỮ nguyên các cụm này (file đó ngoài Phạm vi). Mỗi dòng bỏ / gộp ghi vào trang_thai (cũ → mới / phép máy
thay + grep chứng minh). Không đổi khổ dòng (~120 ký tự) để ăn gian số dòng. Ứng viên (kiểm lại khi làm):
- K3 `:37–42` "chạy lại trên HEAD" (← cổng A19), "N/N lần sạch", "chạy lặp ≥ 3 lần" → gộp, giữ cụm neo.
- K3 `:46–48` đối chứng bộ đột biến → gộp với câu mới (phiếu) "bộ đột biến chạy được từng tên + đối chứng + luật sập rõ — không dò chuỗi".
- K6 `:80–83` "chạy bộ kiểm trước khi giao" ← hook pre-commit (tầng 3) + cổng → rút còn 2 dòng (giữ "đọc mục G").
- K7 `:85–92` ví dụ "npm run kiem ở POS" trùng CLAUDE.md §3 → bỏ; gộp câu commit/push.
- K5 `:76–78` bản sao symlink → rút gọn, giữ ví dụ HOC-2b.
- K1 `:17–19` chỉ GỘP câu (A3 không cưỡng chế phần hồ sơ / phiếu — bản 1 nói sai), giữ cụm neo.
Thêm (phiếu): K3 "ngưỡng về hằng số tất định thì so bằng, không so một chiều"; K4 "một vị từ cho cả 'có gì để làm' và 'làm'"; K3 câu bộ đột
biến. Ước: −21 gộp/bỏ, +5 thêm → ≤ 100. Kiểm: F3 (`khuon_loi_toi_da`) + E2 + A4 của `thu_cong_cu.js` vẫn xanh.

## A5 — phiên bản + thiết kế — CHẶN, xem Câu hỏi Q1

`tu_chay/PHIEN_BAN` → `tu-chay 1.7.0` làm ĐỎ `tu_chay/thu_cong_cu.js:459` và `tu_chay/thu_nguoi_gac.js:709` (đòi đúng chữ `tu-chay 1.6.0`),
cả hai chạy trong `npm test` (`kiem_tra :596`, `:598`) → A6 hỏng. Hai file ngoài Phạm vi. `THIET_KE.md` thêm mục ngắn A1–A3 (~8 dòng).
Cảnh báo khớp byte chờ chủ quán cài: T2 (`kiem_tra :619–640`) — T3 (skill) không kêu vì không sửa `skill_lam_viec.md`.

## A6 — kiểm + đột biến

`npm test`, `--day-du` xanh (cảnh báo: T2 khớp byte + có sẵn; máy bận mà thu_cong > 96 s → cảnh báo A1 — đúng hành vi, ghi số đo).
`viec/TU-CHAY-7/dot_bien.py`: bản sao trong thư mục tạm (kiểm `realpath`), chạy từng tên, ĐỐI CHỨNG xanh trước, bài sập / không dòng tổng =
SẬP (không đếm BẮT):

| chỗ vá | đột biến | bài bắt |
|---|---|---|
| A1 `:616` | `BV-CANH-THUCONG` (bỏ cờ) · `VS-CANH-FALSE` (cờ false) · `VS-HAN-NOI` (hạn 150000) | thu_TOCDO1 C1 / C1 / C2 |
| A2 thu_gia_lap | `BV-DON-GL` (bỏ 3 dòng) · `VS-DON-GL-SIGINT` (chỉ SIGINT) · `VS-DON-GL-EXIT` (bỏ `exit`, giữ tín hiệu gọi rmSync rồi thoát — đường `ket` bỏ rmSync) | ca dọn SIGTERM / SIGTERM / `--chi-du-lieu-tay` |
| A2 thu_cong (nếu Q2 = đề xuất) | `BV-DON-THUCONG` · `VS-DON-THUCONG-SONG` (dọn cả pid còn sống) | ca dọn pid chết / pid sống |
| A3 | `BV-DONG-CUNG` · `VS-DONG-CUNG-GACH` (bỏ `–`) · `VS-DONG-CUNG-NGUONG` (`>` → `>=`) · `VS-DONG-CUNG-LAN` (đếm lần khớp) · `VS-DONG-CUNG-FAIL` (cảnh báo → fail) | D2 / D3 / D1 / D7 / D9 |
| A4 chữ | `BV-KHUON-LOI` (bản gốc) | dot_bien: ≤ 100 dòng + 3 câu mới |
| A5 chữ | `BV-PHIEN-BAN` (1.6.0) | thu_cong_cu E3 + thu_nguoi_gac (sau khi Q1 sửa neo) |

Thời gian dot_bien ước: thu_gia_lap ×3 (~40 s) + thu_TOCDO1 ×8 (~7 s) + thu_cong ×2 (~90 s) + thu_cong_cu/thu_nguoi_gac ≈ 6 phút.

## Luồng hợp lệ phải KHÔNG bị chặn (K5)
- thu_cong xanh dưới 80 % → không cảnh báo (C3g); thu_cong đỏ → FAIL, không cảnh báo (C3c).
- Không đổi tu_chay → vẫn bỏ qua thu_cong (T1/T2/T10 của thu_TOCDO1).
- thu_gia_lap chạy hết → vẫn dọn, mã thoát 0/1 như cũ; con tự-thử (env cờ) chạy đủ bài, chỉ bỏ ca tự thử.
- Hai thu_cong chạy cùng lúc không xoá TAM của nhau (nếu Q2 = đề xuất) — ca pid sống.
- Chú thích số dòng trên kho thật ≤ ngưỡng → không cảnh báo; A3 không FAIL.

## Đường song song (K4)
- Neo chữ lời gọi thu_cong: `thu_TOCDO1.js :27, :32–33`, `thu_gia_lap.js :25, :215, :228–236`, chú thích `kiem_tra :476, :600–603`, hồ sơ
  `viec/HOC-2b/dot_bien.py:61`, `viec/TOC-DO-1/dot_bien.py:31` (không sửa, chạy kiem_neo).
- Neo PHIEN_BAN: `thu_cong_cu.js:459`, `thu_nguoi_gac.js:709` (Q1). Neo KHUON_LOI: `thu_cong_cu.js:457–458, :467–468`.
- Chỗ dọn TAM cùng khuôn (chỉ dọn ở cuối): `thu_TOCDO1.js:17/:189`, `tu_chay/thu_nguoi_gac.js:1126` — ngoài nghiệm thu, ghi Phát hiện.
- `canhGan` khác: `:825`, `:829` (giữ).

## Ngân sách
Code bộ khung: kiem_tra ~20, thu_cong +2–8 (theo Q2) → ~28 (phiếu 50–90). Thử: thu_TOCDO1 ~60, thu_gia_lap ~25, thu_cong ~15 → ~100 (phiếu
~80; vượt vì thêm ca SIGINT, D7–D9 theo soát). KHUON_LOI −16 ròng trở lên. Thời gian máy: thu_TOCDO1 +~5 s, thu_gia_lap +~5 s wall (ca dọn
chạy sau đợt T), thu_cong +~1 s.
