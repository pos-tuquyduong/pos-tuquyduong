# TU-CHAY-7 — kế hoạch (chờ chủ quán duyệt)

Nền: `6cb52fa PHIEU: TU-CHAY-7`. Số dòng dưới đây đọc trong lượt này ở gốc đó.
Số đo: `thu_cong.js` chạy riêng 89,5 s (75 % hạn 120 s) · `thu_TOCDO1.js` 1,7 s · máy mây 4 lõi.

## A1 — cảnh báo gần hạn cho thu_cong.js

Hiện trạng: `kiem_tra_truoc_khi_giao.js:616` gọi `chayBaiThat('tu_chay/thu_cong.js')` — không cờ; hàm ở `:478–490` đã có vế cảnh báo
(`:487` `han * 0.8`). `thu_TOCDO1.js` KHÔNG được bộ kiểm chạy qua `chayBaiThat` (chỉ nhắc ở chú thích `:529`, `:602`) và chạy 1,7 s
→ vế "cũng cho thu_TOCDO1.js nếu > 30 s" không áp dụng, ghi trong trang_thai.

- **A (chọn):** sửa đúng một dòng `:616` → `chayBaiThat('tu_chay/thu_cong.js', undefined, 120000, true)`. Hạn giữ 120 s (viết thẳng để C3f
  đọc được chữ `true`). 1 file code, ~1 dòng + chú thích `:476` ("chỉ giả lập + thu_gia_lap" → thêm thu_cong).
- **B (loại):** đổi mặc định `canhGan = true` cho mọi bài — phá C3d/C3h của `thu_gia_lap.js` và làm cảnh báo hiện cho bài không cần.

Bài thử phải sửa theo (cùng khuôn K4 — đổi chữ lời gọi thì mọi phép neo chữ đó rữa):
- `cong_cu/thu_TOCDO1.js:32` `GOI = "chayBaiThat('tu_chay/thu_cong.js')"` + regex dòng gọi trần `:28` → neo theo tiền tố
  `chayBaiThat('tu_chay/thu_cong.js'` (không đóng ngoặc). Bản gốc vẫn khớp (khối gốc dùng ở T1/T2/T10 không đổi nghĩa).
- `cong_cu/thu_gia_lap.js:233–234` C3f đòi `bat === giả lập + thu_gia_lap` → thêm `'tu_chay/thu_cong.js'`. Trên gốc: ĐỎ (gốc không bật).

Ca mới (đỏ trên gốc) — `cong_cu/thu_TOCDO1.js` mục C:
- C1 cắt `function chayBaiThat(` THẬT + khối `lyDoChayThuCong` THẬT; chạy khối với `DAY_DU = true`, `chayBaiThat` = vỏ ghi đối số rồi gọi hàm
  thật trên bài giả ngủ 1,7 s với hạn giả 2 s (85 %), cờ lấy từ lời gọi thật → **đúng 1 cảnh báo, có số giây**. Gốc: 0 cảnh báo → ĐỎ.
- C2 hạn ở lời gọi thật là 120000 hoặc bỏ trống (mặc định 120000) — không nới (khoá chữ "Không nới hạn" của phiếu).
- Dưới ngưỡng / bài đỏ / cờ tắt: đã có C3g, C3c, C3d trong `thu_gia_lap.js` (cùng hàm thật) — không lặp.

## A2 — dọn thư mục tạm khi bị ngắt

Hiện trạng: `tu_chay/thu_cong.js:24` tạo `TAM`, dọn DUY NHẤT ở `:723` (cuối luồng chạy hết). `cong_cu/thu_gia_lap.js:42` tạo `TAM`, dọn
ở `ket()` `:51–55` (gọi ở `:181`, `:563`, `:566`). SIGTERM / SIGINT mặc định của Node giết ngay → không hàm nào chạy → sót.

- **A (chọn):** khuôn `viec/AUDIT-4/don_rong.js:15–17`: `process.on('exit', dọn)` + `SIGINT`/`SIGTERM` → `process.exit(130)`.
  `thu_cong.js`: +3 dòng, bỏ `:723` (thừa) → +2 ròng. `thu_gia_lap.js`: +3 dòng, `ket()` bỏ dòng rmSync (thừa) → +2 ròng.
- **B (loại):** một module dọn chung cho cả hai — thêm file ngoài Phạm vi. **B2 (loại):** `try/finally` — không bắt tín hiệu.

Giới hạn đã biết (ghi CHƯA KIỂM, không vá): `thu_cong.js` toàn `spawnSync` → tín hiệu chỉ được xử lý khi lệnh con đang chạy trả về (≤ 30 s
hạn mỗi lệnh git) — dọn trễ, không mất. SIGKILL không bắt được. `thu_gia_lap.js` bị giết thì giả lập con đang chạy không được giết theo
(mồ côi tự sập khi TMPDIR mất) — ngoài nghiệm thu A2, ghi Phát hiện, không mở rộng.

Ca mới (đỏ trên gốc), mỗi bài tự thử chính nó qua tiến trình con, TMPDIR riêng để đếm (không lẫn thư mục của lần chạy khác):
- `thu_cong.js` hàm `baiDonTam` (bỏ qua khi env `THU_CONG_CON=1` — chặn đệ quy): `spawnSync` một trình lái `node -e` (hạn 60 s): sinh
  `thu_cong.js` con với `TMPDIR` riêng, chờ thấy `thu_cong_*` xuất hiện, SIGTERM, chờ đóng. Phép: (a) đối chứng — đã thấy thư mục TRƯỚC khi
  giết (ca có kích hoạt, K3); (b) con thoát 130; (c) 0 `thu_cong_*` sót. Thêm ~1–3 s vào thu_cong.
- `thu_gia_lap.js` ca mới (bỏ qua khi `THU_GL_CON=1`): sinh `thu_gia_lap.js` con, TMPDIR riêng, chờ thấy `thu_gl_*/may_chu_rong` (`:189–190`,
  tạo ngay trước C3 — con đang chạy worker), SIGTERM; phép (a)(b)(c) như trên. Chạy SAU C3 (C3 đo thời gian lúc máy rảnh), cùng đợt
  T3–T6 (`:274`).

## A3 — phép tĩnh chú thích số dòng cứng

- **A (chọn):** `kiem_tra_truoc_khi_giao.js` thêm hàm `quetDongCung(docFile, dsFile)` → danh sách `file:dòng` có chú thích (phần sau `//`,
  hoặc dòng mở `/*` / `*`) khớp `\(:\d+\)|:\d+[–-]\d+`; `NGUONG_DONG_CUNG = 4` (đếm ở gốc: `server/routes/orders.js:1633`,
  `cong_cu/thu_P26c.js` ×3). n > ngưỡng → CẢNH BÁO liệt kê; n < ngưỡng → CẢNH BÁO "hạ NGUONG_DONG_CUNG xuống n" (như `NGUONG_FETCH`
  `:223–238`, nhưng không FAIL). Phạm vi file: `server/**/*.js`, `client/src/**/*.{js,jsx}`, `cong_cu/thu_*.js`, `tu_chay/*.js`. ~18 dòng.
- **B (loại):** đếm mọi `file.js:NNN` (một số) — nền hàng trăm chỗ, cảnh báo thành tiếng ồn; phiếu chỉ định hai dạng trên.

Ghi: `thu_P26c.js` thuộc việc song song LUOI-4 — ai sửa 3 chú thích đó thì bộ kiểm nhắc hạ ngưỡng (cảnh báo, không chặn).

Ca mới (đỏ trên gốc) — `cong_cu/thu_TOCDO1.js` mục D, cắt hàm THẬT, chạy trên file giả (`docFile` giả như mục R):
- D1 ngưỡng 4, đúng 4 chỗ → 0 cảnh báo (ca ngay tại ngưỡng). D2 thêm 1 chú thích `(:1234)` → cảnh báo nêu đúng `file:dòng` (ngay trên).
- D3 dạng `:12–34` (gạch ngang dài) và `:12-34` đều đếm. D4 chữ trong chuỗi mã (không phải chú thích) `'(:12)'` → không đếm.
- D5 3 chỗ → cảnh báo "hạ" (ngay dưới). D6 bộ kiểm thật trên kho thật: đếm = `NGUONG_DONG_CUNG` (không kêu lúc bình thường, K8 chiều ngược).
Gốc: không có hàm → mọi ca D đỏ.

## A4 — KHUON_LOI.md ≤ 100 dòng (từ 116)

Cách làm: mỗi dòng bỏ / gộp ghi vào trang_thai (dòng cũ → dòng mới / phép máy thay + lệnh grep chứng minh phép đó có). Không đổi khổ dòng
để "ăn gian" số dòng (giữ ~120 ký tự / dòng như hiện tại). Ứng viên (kiểm lại bằng grep lúc làm, cái nào không có phép máy thì chỉ gộp):
- K1 `:17–20` (TU-CHAY-6: chú thích là khẳng định, số dòng trích) → một phần do phép A3 cưỡng chế → rút còn 1–2 dòng dẫn tên phép.
- K3 `:37–39` + `:40–42` "lần chạy lại trên HEAD", "N/N lần sạch", "chạy lặp ≥ 3" → gộp; "chạy lại trên HEAD" ← cổng A19.
- K3 `:46–48` đối chứng bộ đột biến → gộp với câu mới "bộ đột biến chạy được từng tên + đối chứng + luật sập rõ — không dò chuỗi".
- K6 `:80–83` "chạy bộ kiểm trước khi giao" ← hook pre-commit (tầng 3) + cổng chạy `npm test` → rút còn 2 dòng (giữ "đọc mục G").
- K7 `:85–92` "npm run kiem ở POS" trùng CLAUDE.md §3 → bỏ ví dụ; câu commit/push giữ ý, gộp.
- K5 `:76–79` bản sao symlink → rút gọn câu, giữ ví dụ HOC-2b.
Thêm (phiếu): K3 "ngưỡng về hằng số tất định thì so bằng, không so một chiều"; K4 "một vị từ cho cả 'có gì để làm' và 'làm'"; K3 câu bộ
đột biến ở trên. Ước: −22 dòng gộp/bỏ, +5 dòng thêm → ~99 dòng.
Kiểm: `tu_chay/thu_cong_cu.js` F3 (`khuon_loi_toi_da` 120) vẫn qua; `wc -l KHUON_LOI.md` ≤ 100 trong dot_bien (BV-).

## A5 — phiên bản + thiết kế

`tu_chay/PHIEN_BAN` → `tu-chay 1.7.0`. `tu_chay/THIET_KE.md` thêm mục ngắn (~8 dòng) A1–A3. `npm test` sẽ CẢNH BÁO T2 "khớp từng byte"
(`kiem_tra :619–640`) tới khi chủ quán chạy `bash tu_chay/cai_dat.sh` — đúng thiết kế (chốt 1b), không chép sang `.claude/`.

## A6 — kiểm + đột biến

`npm test`, `node kiem_tra_truoc_khi_giao.js --day-du` xanh (cảnh báo chỉ: T2/T3 khớp byte + cảnh báo có sẵn; nếu máy bận mà thu_cong
> 96 s thì cảnh báo A1 — đó là hành vi đúng, ghi số đo).
`viec/TU-CHAY-7/dot_bien.py` (bản sao trong thư mục tạm, kiểm `realpath`; chạy từng tên; ĐỐI CHỨNG bản chưa đột biến xanh trước; bài
sập / không in dòng tổng = SẬP, không đếm BẮT):

| chỗ vá | đột biến | bài bắt |
|---|---|---|
| A1 `:616` cờ | `BV-CANH-THUCONG` (bỏ cờ) · `VS-CANH-FALSE` (cờ `false`) · `VS-HAN-NOI` (hạn 150000) | thu_TOCDO1 C1 / C1 / C2 |
| A2 thu_cong | `BV-DON-THUCONG` (bỏ 3 dòng) · `VS-DON-THUCONG-SIGINT` (chỉ SIGINT) | thu_cong baiDonTam |
| A2 thu_gia_lap | `BV-DON-GL` · `VS-DON-GL-SIGINT` | thu_gia_lap ca dọn |
| A3 | `BV-DONG-CUNG` (bỏ cảnh báo mọc) · `VS-DONG-CUNG-GACH` (bỏ `–` khỏi lớp ký tự) · `VS-DONG-CUNG-NGUONG` (`>` → `>=`) | thu_TOCDO1 D2 / D3 / D1 |
| A4 chữ | `BV-KHUON-LOI` (bản gốc 116 dòng) | dot_bien: ≤ 100 dòng + 3 câu mới có mặt |
| A5 chữ | `BV-PHIEN-BAN` (1.6.0) | dot_bien: PHIEN_BAN = 1.7.0 |

Thời gian máy dot_bien ước: thu_cong ×2 (~90 s mỗi lần) + thu_gia_lap ×2 (~40 s) + thu_TOCDO1 ×6 (~4 s) ≈ 5–6 phút.

## Luồng hợp lệ phải KHÔNG bị chặn (K5)
- thu_cong xanh dưới 80 % → không cảnh báo (C3g cùng hàm); thu_cong đỏ → FAIL, không cảnh báo (C3c).
- Bộ kiểm không đổi tu_chay → vẫn bỏ qua thu_cong (T1/T2/T10 của thu_TOCDO1 giữ nguyên).
- Cả hai bài chạy hết bình thường → vẫn dọn TAM, mã thoát 0/1 như cũ (handler `exit` không đổi mã; ca đối chứng = lần chạy đầy đủ không sót).
- Các con tự-thử (env cờ) chạy đủ bài như thường — chỉ bỏ ca tự thử để không đệ quy.
- Chú thích số dòng trên kho thật = ngưỡng → không cảnh báo (D6). A3 không FAIL nên không chặn commit nào.

## Đường song song (K4)
- Mọi phép neo chữ lời gọi thu_cong: `thu_TOCDO1.js :28, :32`, `thu_gia_lap.js` C3f `:228–234`, chú thích `kiem_tra :476`, `:600–603` —
  grep `chayBaiThat('tu_chay/thu_cong` lại trước khi sửa.
- Mọi chỗ dọn TAM: `thu_cong.js :723`, `thu_gia_lap.js :52`; bài khác trong Phạm vi có TAM: `thu_TOCDO1.js :17` (`thu_tocdo1_`) — cùng khuôn
  (dọn ở cuối). Phiếu chỉ ghi hai bài → hỏi trong Câu hỏi nếu muốn gộp; mặc định KHÔNG sửa, ghi Phát hiện.
- Chỗ dùng `canhGan` khác: `:825`, `:829` (giữ).

## Ngân sách
Code bộ khung: kiem_tra ~20 dòng, thu_cong +2 ròng → ~22 (phiếu 50–90). Thử: thu_TOCDO1 ~45, thu_cong ~20, thu_gia_lap ~18 → ~83 (phiếu ~80).
KHUON_LOI −16 ròng trở lên. Thời gian máy: thu_cong +1–3 s, thu_TOCDO1 +~2 s, thu_gia_lap +0 wall (chạy song song đợt T).
