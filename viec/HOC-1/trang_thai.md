# HOC-1 — Trạng thái

## Bước 1 — đối chiếu bản chụp (02.10.2026)
Nhánh: `viec/HOC-1`
```
ecd44e2 PHIEU: HOC-1
c064f42 TIEN-DO: TU-CHAY-3 xong (03e1b48), kiem song cong DAT; them HOC-1, TIET-KIEM-1
03e1b48 Merge pull request #3 from pos-tuquyduong/viec/TU-CHAY-3
```
F1: hook mở phiên in "kéo nhánh: viec/HOC-1 đã có đủ commit của origin — không kéo" (lúc mở và lúc tiếp phiên).

## Bước 3 — kế hoạch
`ke_hoach.md`, agent phụ soát (5 điểm, đã sửa vào kế hoạch). Chủ quán duyệt 02.10.2026, phương án A mọi mục, thêm:
(1) bài thử đổi tên / bị PR xoá không được miễn — "dòng hỏng"; (2) chế độ `tinh` (A12) giữ nguyên; (3) bảng đột biến
ghi đúng lệnh chạy lại.

## Bước 4–6 — bài thử, sửa, kiểm
- Bài thử chạy trên code CHƯA vá → ĐỎ: `viec/HOC-1/bang_chung_do.txt` (`thu_cong` 21 chỗ, `thu_nguoi_gac` 4, `thu_cong_cu` 6).
- Sau vá (HEAD hiện tại, sau phép (d) và soát vòng 2): `thu_cong` 196 phép · 0 hỏng; `thu_nguoi_gac` 782/782 ca + 165 phép; `thu_cong_cu` 77 phép · 0 hỏng.
- `npm test` và `node kiem_tra_truoc_khi_giao.js --day-du`: PASS 54 · FAIL 0 · CẢNH BÁO 2 (T2, T3: bản cài `.claude/`
  lệch nguồn — chủ quán chạy `bash tu_chay/cai_dat.sh`). `thu_cong.js` 39,2 s trong giới hạn 120 s của `chayBaiThat`.
- Cổng TĨNH luật CŨ (bản `cong.js` của main lưu ở nháp) trên nhánh này, mốc `c064f42`: chỉ `[A8] bản cài lệch nguồn`
  (chờ chủ quán cài). Không A6 / A7 / A12.
- Chế độ `tinh` không đổi (duyệt 2): diff `cong.js` chỉ chèn trong nhánh `chay` (sau dòng 166; A12 tinh ở dòng 162 giữ nguyên) và hàm `mucBaiThuCu`.

### Ca đỏ trước, theo nhóm
| Nhóm | Ca | Đỏ trước bằng |
|---|---|---|
| A | A1, A1 backtick, A3, A4, A6 (thiếu lý do, `<lý do>`, khac.js, không có), xoá, đổi tên, A7, K5 thứ tự mục | code gốc (`bang_chung_do.txt`) + đột biến MA1–MA7, MX |
| B | B1, B2 (Edit + Bash), B4 | code gốc + đột biến MB, MB4 |
| C | C1, C2, C3 (thư mục con), symlink, symlink treo | code gốc + đột biến MC, MC2, MC3 |
| D | D1 (4 ca muc_gac), D2 (3 khoá) | xanh trên gốc (phép đã có) → đột biến M9, M10 |
| Câu hỏi 1 (d) | (d)(i) bài được miễn bị thay bằng bản luôn xanh + xoá `server/a.js` → ĐỎ; (d)(ii) chỉ thêm ca → ĐẠT; (d)(iii) bài trong mục ĐỎ trên gốc, bỏ ca gốc + xoá `server/a.js` → ĐỎ | code trước (d): (d)(i) ĐỎ 2 chỗ (cổng cho ĐẠT); code trước sửa vòng 2: (d)(iii) ĐỎ 3 chỗ; đột biến MD, MD2 |
| G | PHIEN_BAN 1.3.1 | code gốc |

### Bảng đột biến tay — chạy lại: `python3 viec/HOC-1/dot_bien.py [tên …]`
Script chép `tu_chay/`, `kiem_tra_truoc_khi_giao.js`, `CLAUDE.md`, `KHUON_LOI.md`, `.github/workflows/keep-alive.yml` vào
thư mục tạm, thay đúng MỘT chuỗi (ghi trong `DB` của script), chạy bài thử của bản chép. Ví dụ: `python3 viec/HOC-1/dot_bien.py M9 MA3`.
| Tên | Đột biến | Bài thử | Kết quả (02.10.2026) |
|---|---|---|---|
| M0-cong / M0-gac / M0-cc | không đột biến (đối chứng) | 3 bài | XANH cả ba (M0-cc lần đầu ĐỎ vì script chưa chép `KHUON_LOI.md` — lỗi script, đã sửa) |
| M9 | `cai_dat.js` bỏ `dung(...)` của phép muc_gac | thu_nguoi_gac | ĐỎ — 7 dòng muc_gac (ca "trỏ file khác" vẫn dừng nhờ phép khác, SAI câu → đỏ) |
| M10 | `cong.js` bỏ `throw` cấu hình thiếu khoá | thu_cong | ĐỎ — 3 ca D2 |
| MA1 | bỏ miễn | thu_cong | ĐỎ — HOC-1 A1 |
| MA3 | bỏ điều kiện "có ở mốc" | thu_cong | ĐỎ — HOC-1 A3 |
| MA4 | miễn bỏ luôn kiểm xanh trên PR | thu_cong | ĐỎ — HOC-1 A4 |
| MA6a / b / c | bỏ kiểm lý do / thu_*.js / "không có trong kho" | thu_cong | ĐỎ — HOC-1 A6 (MA6c chỉ đổi câu, không đổi kết quả miễn — xem NGHI NGỜ của soát) |
| MX | bỏ kiểm "bị PR xoá / đổi tên" | thu_cong | ĐỎ — duyệt (1) |
| MA7 | miễn tính là bài đỏ hợp lệ | thu_cong | ĐỎ — HOC-1 A7 |
| MB / MB4 | `cau_hinh.json` bỏ `package.json` | thu_nguoi_gac / thu_cong | ĐỎ — B2 / B4 |
| MC | T2 về bản cũ (đọc cả thư mục) | thu_cong_cu | ĐỎ — C1, C2, C3 |
| MC2 | T2 lọc `Dirent.isFile` | thu_cong_cu | ĐỎ — 2 ca symlink + treo |
| MC3 | T2 bỏ `try` quanh `statSync` | thu_cong_cu | ĐỎ — ca symlink treo (bộ kiểm sập ENOENT) |
| MD | bỏ phép (d): `for (const p of daMien)` → `for (const p of [])` | thu_cong | ĐỎ — HOC-1 (d)(i) |
| MD2 | (d) chỉ cho bài xanh trên gốc (lỗi soát vòng 2) | thu_cong | ĐỎ — HOC-1 (d)(iii) |
Lần chạy đủ cuối: 02.10.2026 trên `c8670cb`, `python3 viec/HOC-1/dot_bien.py` — 3 M0 XANH, 18 đột biến ĐỎ đúng chỗ.
(Lượt chạy giữa chừng sau (d) báo MA7 "LỖI — chuỗi tìm có 0 lần" vì (d) tách dòng miễn; sửa vòng 2 đưa dòng về một dòng, MA7 lại ĐỎ đúng chỗ.)
Agent soát chạy thêm 9 đột biến riêng (S1–S9, script ở nháp của phiên, không vào kho): bỏ từng điều kiện muc_gac
(`cai_dat.js:86-87`), từng khoá (`cong.js:19`), lọc `coSan` của T2, kiểm `st === 'D'` — cả 9 ĐỎ đúng chỗ.

## Bước 8 — /ra-soat
F2: agent soát kế hoạch và agent `/ra-soat` đều nộp qua `SubagentHandback`, người gác KHÔNG chặn
(`.tu_chay_nhat_ky.jsonl`: 3 dòng SubagentHandback, cả 3 `CHO`).

### Vòng 1 — báo cáo nguyên văn
```
KHÔNG ĐẠT. Phần code và bài thử đạt. Phiếu mục G và lưu ý (3) của chủ quán đòi bảng đột biến ghi trong
trang_thai.md, nhưng ở HEAD a5004e9 bảng đó chưa có. Ngoài ra có một chỗ lệch khuôn nhỏ ở T2.

Căn cứ đã đọc và chạy: cong.js 1–263 (bản PR), kiem_tra_truoc_khi_giao.js 477–487 và 518–615, cai_dat.js 80–97,
thu_nguoi_gac.js 754–766 và 916–940; diff ecd44e2^..HEAD 15 file; phiếu, kế hoạch, trang_thai.md, bang_chung_do.txt,
dot_bien.py. Chạy trên code PR: thu_cong 187 phép 0 hỏng · thu_nguoi_gac 782/782 + 165 · thu_cong_cu 74 phép 0 hỏng.
python3 viec/HOC-1/dot_bien.py: 3 bản M0 xanh, mọi đột biến còn lại đỏ đúng chỗ. Thêm 9 đột biến riêng S1–S9, cả 9
đỏ đúng chỗ (S3: chỉ phép "lý do có câu muc_gac" bắt được — trình cài vẫn dừng vì phép khác, đúng như kế hoạch đoán).

1. K3: đạt — ba file bài thử đỏ trên bản chưa vá; ca xanh trên gốc (D1, D2, A3, A6, A7) có đột biến tay; bài thử
   kiểm hành vi thật (cổng trên kho tạm, T2 chạy khối mã thật); cổng luật cũ của PR này qua được.
2. K4: 4 chỗ liệt kê tu_chay/ (cai_dat.js:97, cong.js:120, cong.js:45-52 cacFile, T2 kiem_tra:530) đều bỏ thư mục
   con nhưng chưa cùng khuôn với symlink (lỗi 1). T3, T4 không cùng khuôn lỗi. mucMien / mucBaiThuCu cùng cách tách
   dòng. A12 chế độ tinh (cong.js:162) không đổi — đúng lưu ý (2).
3. K5: các luồng hợp lệ đều có ca "phải KHÔNG bị chặn"; không thấy luồng bị chặn oan; dòng hỏng chỉ là ghi.
4. K1: xem lỗi 2 và lỗi 1.
5. Đường tiền: không đụng server/. 6. P1: không đụng client/src/.

LỖI TÌM ĐƯỢC:
1. kiem_tra_truoc_khi_giao.js:530 — T2 lọc Dirent.isFile() (false với symlink), cai_dat.js:97 lọc
   statSync().isFile() (true). Symlink trong tu_chay/ vẫn được cài nhưng T2 không so byte; symlink thừa trong
   .claude/tu_chay/ không bị báo — nới T2 ngoài phạm vi C (K4, nhẹ). Sửa: statSync + ca symlink trong baiT2.
2. viec/HOC-1/trang_thai.md — thiếu bảng ca đỏ A–D (G), bảng đột biến kèm lệnh (lưu ý 3), F2 của /ra-soat, kết quả
   npm test / --day-du; bang_chung_do.txt dẫn tới bảng chưa có (K7).

NGHI NGỜ:
- cong.js:224 — miễn không kiểm PR chỉ THÊM ca: bài thử cũ được miễn có thể bị bỏ bớt ca, thay bằng process.exit(0),
  vẫn xanh hai bên và qua. Phiếu không đòi; là lối lách khi miễn được ghi cho file luật như tu_chay/thu_nguoi_gac.js.
- cong.js:61-71 — chép nguyên khối mẫu ## Bài thử cũ sửa từ MAU_PHIEU vào phiếu sinh 3 "dòng hỏng" giả; gạch nối
  thường / gạch ngắn thay "—" bị coi là dòng hỏng. Chỉ làm rối thông tin, không đổi kết quả.
- kiem_tra_truoc_khi_giao.js:479 — chayBaiThat 120 s/bài; thu_cong.js nay 38,1 s; máy GitHub chậm hơn thu hẹp dư.
- MA6c — bỏ nhánh "không có trong kho" chỉ đổi câu thông báo, không đổi hành vi chặn.

CHƯA SOÁT ĐƯỢC: cổng thật trên GitHub (F3, A8 sau cai_dat.sh, thời gian chạy); không tự chạy npm test / --day-du
toàn bộ.

BÀI HỌC:
- KHOÁ: ca symlink trong baiT2, T2 cùng phép statSync với cai_dat.js:97.
- KHOÁ (đề xuất, chủ quán quyết): miễn A11 đòi file được miễn không có dòng xoá (git diff --numstat) hoặc số ca
  không giảm.
- NGUYÊN TẮC (K4): "cùng khuôn X" phải so cả symlink và loại file — Dirent.isFile() khác statSync().isFile().
- NGUYÊN TẮC (K7): hồ sơ dẫn tới bảng ở tệp khác thì tệp kia phải có bảng trong cùng commit.
```
(Báo cáo đã rút gọn xuống dòng cho vừa khổ; nội dung, số dòng, kết luận giữ nguyên.)

### Sửa sau vòng 1
- Lỗi 1: ca C2 symlink lệch, C3 symlink thừa thêm vào `thu_cong_cu.js` → ĐỎ trên T2 `Dirent.isFile` (2 chỗ hỏng), rồi
  T2 đổi sang `statSync` như `cai_dat.js:97` → XANH. Tự soát thêm: symlink TREO làm `statSync` ném → sập cả bộ kiểm
  (bản cũ không sập, báo "thừa") → bọc `try`, coi như file; ca C3 symlink treo + đột biến MC3 đỏ đúng chỗ.
- Lỗi 2: file này (bảng ca đỏ, bảng đột biến, F2, kết quả kiểm).
- NGHI NGỜ: ghi `## Câu hỏi` / `## Phát hiện` dưới — không tự làm (ngoài nghiệm thu của phiếu).
Vòng sửa: 1/3.

### Chủ quán chốt Câu hỏi 1 — phương án (d) (02.10.2026)
Với mỗi bài thử được miễn, cổng chạy BẢN GỐC (ở mốc) của file đó trên code PR, phải XANH; đỏ → A11 "bài thử cũ được miễn
nhưng bản gốc đỏ trên code PR". Làm: `tu_chay/cong.js:244-252` (ghi bản gốc tạm vào đúng đường dẫn trong cây PR, chạy, trả lại
bản head), ca (d)(i) đỏ trước / (d)(ii) K5 trong `thu_cong.js`, đột biến MD, câu thêm trong `MAU_PHIEU.md` và THIET_KE B15.

### Vòng 2 — báo cáo nguyên văn (rút gọn xuống dòng; nội dung, số dòng, kết luận giữ nguyên)
```
KHÔNG ĐẠT
Code (d) và hai chỗ sửa vòng 1 đúng theo chữ quyết định, nhưng phép (d) bị lách dễ ngay trên file ghi trong mục miễn
(dựng ca thật, cổng ĐẠT), và trang_thai.md chưa ghi gì về (d) — lặp lỗi 2 vòng 1.
Căn cứ: cong.js 1–276 (HEAD 8d3bfc9), cai_dat.js 85–97, kiem_tra 515–550; diff ecd44e2^..HEAD; git diff --stat bb5fdfb HEAD;
phiếu, trang_thai.md, dot_bien.py. Chạy: thu_cong 193 phép 0 hỏng; thu_cong_cu 77 phép 0 hỏng; dot_bien MD MC2 MC3 ĐỎ đúng chỗ;
4 ca dò PROBE trong bản chép tạm.
1. K3 đạt cho phần đã có ca: (d)(i) thu_cong.js:266 đỏ khi tắt (d) (MD); (d)(ii) :269 ca không bị chặn; THU_C_GOC (:51) là bài
   cũ thật. Thiếu: không ca nào kiểm (d) khi file trong mục ĐỎ trên gốc (lỗi 1).
2. K4: 4 chỗ liệt kê tu_chay/ (cai_dat.js:97, cong.js:49, cong.js:120, kiem_tra:530) nay cùng khuôn với symlink; lỗi 1 vòng 1
   sửa đúng; MC2, MC3 đỏ đúng chỗ. Một đường song song chưa xử lý (lỗi 1).
3. K5 qua (d) (cong.js:248–254): (a) chỉ thêm ca ĐẠT; (b) chỉ sửa chú thích ĐẠT; (c) PR đổi hành vi ca cũ khẳng định → chặn,
   đúng ý (d); (d) PR đổi tên/di chuyển module bài cũ require → bản gốc đỏ → chặn oan (ghi miễn thì chặn, không ghi thì qua) —
   NGHI NGỜ. Chế độ tinh: không hunk nào trong cong.js:103–164; PROBE4 xác nhận tinh như cũ.
4. K1: xem lỗi 2. 5. Đường tiền: không đụng server/. 6. P1: không đụng client/src/.
LỖI TÌM ĐƯỢC:
1. tu_chay/cong.js:225–228, 248 — (d) chỉ chạy cho file trong mục VỪA xanh trên gốc (daMien); file trong mục mà bản head ĐỎ
   trên gốc đi nhánh doHopLe++ (:232), không qua (d). K4 → K3. PROBE1: phiếu ghi thu_c.js, PR thay bằng ca đỏ trên gốc, bỏ ca
   gốc, xoá server/a.js → cổng chay ĐẠT. PROBE3: bài cũ chỉ require('../server/moi.js') — luồng tự nhiên. Mâu thuẫn
   MAU_PHIEU.md:39–40 (hứa cho "file đó") và chú thích cong.js:246–247. Sửa rẻ: chạy (d) cho MỌI p trong mienCu có trong baiThu.
   Đường không ghi mục miễn (PROBE2) có cùng lỗ, có từ trước HOC-1.
2. viec/HOC-1/trang_thai.md — không commit nào sau bb5fdfb: bảng ca đỏ / đột biến thiếu (d)(i), (d)(ii), MD; Câu hỏi 1 còn mở;
   dòng 137, 160 vẫn "không chặn BỚT ca"; số cũ (187 phép, GIT 28d7eb0/7d014b2, ĐÃ SỬA thiếu cong.js:246–254). K7, K1.
NGHI NGỜ:
- đổi tên module bài cũ require: ghi miễn thì bị chặn, không ghi thì qua — ngược chiều mong đợi.
- cong.js:250–252 writeFileSync đi theo symlink: bài được miễn là symlink thì cổng ghi bản gốc vào file đích rồi "trả lại" bằng
  chuỗi đường dẫn của link — hỏng file đích trong cây PR; bước cuối, không đổi kết quả; hiếm.
- (d) chạy bản gốc ngay sau bản head trên cùng cây (:242 rồi :248) — bài thử không kín có thể lệch. Chưa thấy ca thật.
- file có ở mốc mà PR không đụng ghi trong mục → cổng im lặng (:203–207); ca K5 đã ghim, chỉ thiếu một dòng thông tin.
CHƯA SOÁT ĐƯỢC: cổng thật GitHub (F3, A8 sau cai_dat.sh), thời gian máy GitHub; không chạy npm test / --day-du /
thu_nguoi_gac / toàn bộ dot_bien.py / chay trên kho thật; PROBE1–4 chỉ ở bản chép tạm.
BÀI HỌC:
- KHOÁ: ca PROBE1 trong thu_cong.js + đột biến "(d) chỉ cho daMien".
- NGUYÊN TẮC (K4): phép gắn theo một nhánh điều kiện phải liệt kê mọi nhánh khác cùng đối tượng đi qua; tài liệu hứa theo đối
  tượng thì code chặn theo đối tượng.
- NGUYÊN TẮC (K7) → nên KHOÁ: sau mỗi đợt sửa theo quyết định chủ quán, trang_thai.md cập nhật cùng loạt commit; vd phép kiểm:
  mỗi tên đột biến trong dot_bien.py phải có trong trang_thai.md.
```

### Sửa sau vòng 2
- Lỗi 1: ca (d)(iii) (= PROBE1) thêm vào `thu_cong.js` → ĐỎ trên code lúc đó (3 chỗ, cổng ĐẠT); `cong.js:225` đưa MỌI file ghi
  trong mục mà PR sửa vào (d), xanh hay đỏ trên gốc → XANH; đột biến MD2 (quay về "chỉ xanh") ĐỎ đúng chỗ. Theo chữ
  `MAU_PHIEU.md` ("BẢN GỐC của file") — đây là cách đọc rộng hơn "bài thử được miễn"; chủ quán thấy không đúng ý thì báo, lùi bằng
  một dòng (`cong.js:225`).
- Lỗi 2: file này — bảng ca đỏ, bảng đột biến (MD, MD2, lần chạy đủ cuối), Câu hỏi 1 đã chốt, báo cáo vòng 2, BÁO CÁO.
- NGHI NGỜ symlink + đổi tên module: ghi `## Phát hiện` 4, 5 — không tự làm.
Vòng sửa: 2/3.

## Câu hỏi
1. ~~Miễn A11 có nên đòi "chỉ thêm ca"?~~ — **ĐÃ CHỐT (02.10.2026): phương án (d)**, bản gốc chạy trên code PR phải xanh.
   Đã làm, xem "Chủ quán chốt Câu hỏi 1" ở trên.

## Phát hiện
1. Chép nguyên mẫu `## Bài thử cũ sửa` từ `MAU_PHIEU.md` vào phiếu sinh "dòng hỏng" giả (chỉ là dòng `·` thông tin).
   Gạch `-`/`–` thay `—` cũng là dòng hỏng — câu báo "thiếu đường dẫn hoặc lý do sau —" đã chỉ đúng chỗ.
2. `thu_cong.js` chạy ~37 s, giới hạn `chayBaiThat` 120 s (`kiem_tra_truoc_khi_giao.js:479`); chưa đo trên GitHub.
3. `package-lock.json` KHÔNG đưa vào `file_luat` (phiếu cấm). `npm ci` theo lockfile của PR; đổi lockfile không tắt
   được `npm test` như dòng `"test"`, nên chưa thấy cần — ghi để chủ quán biết.
4. (soát vòng 2) PR đổi tên / di chuyển module mà bài cũ được miễn `require` → bản gốc đỏ trên code PR → (d) chặn. Lối đi:
   không ghi file đó vào `## Bài thử cũ sửa` (bản head đỏ trên gốc vì thiếu module tương đối → tính đỏ hợp lệ như trước HOC-1).
   Phát hiện thêm từ soát: đường KHÔNG ghi mục miễn có sẵn lỗ "thay bài cũ bằng ca đỏ mới, bỏ ca gốc" từ trước HOC-1 — muốn bịt
   thì phiếu sau (vd chạy bản gốc của MỌI bài thử cũ bị sửa).
5. (soát vòng 2) `cong.js:248-250` dùng `writeFileSync` — bài được miễn mà là symlink thì bước (d) ghi vào file đích; bước cuối
   của cổng nên không đổi kết quả. Hiếm; chưa sửa.

## Bài học (bước 11)
| # | Sự cố | Ngăn | Ở đâu / lý do |
|---|---|---|---|
| a | T2 vá thư mục con bằng `Dirent.isFile` → nới với symlink, khác trình cài (soát vòng 1, lỗi 1) | KHOÁ | ca symlink + treo trong `thu_cong_cu.js`, đột biến MC2, MC3 đỏ trước |
| b | Cùng lỗi (a) nhìn từ cách nghĩ: "cùng khuôn" chỉ so ca vừa gặp | NGUYÊN TẮC | `KHUON_LOI.md` K4 thêm dòng (109/120 dòng) |
| c | Hồ sơ dẫn tới bảng chưa có (soát vòng 1, lỗi 2) | BỎ → gộp vào j | lặp lại ở vòng 2 nên không còn là "một lần" — xem j |
| d | Script đột biến thiếu `KHUON_LOI.md` → đối chứng M0 đỏ | KHOÁ (đã có) | M0 đối chứng trong script bắt ngay; K2 "truy nguyên trước" đã làm đúng |
| e | Người gác chặn 15 lệnh (B-CD-VITRI 5, B-MANOI 2, B-BIMAT-CHU 2, B-CHUONGTRINH 2, B-PHANTICH, B-DICHCHU, B-CD, GIT-LENH) — 6 của agent soát | BỎ | Người gác làm đúng việc; cách đúng (script Python trong nháp, `cd` đứng đầu) đã có |
| g | Gõ nhầm chạy lại script vá `KHUON_LOI.md` (không lũy đẳng) → chèn trùng dòng K4, chưa commit | BỎ | thấy ngay qua `wc -l` (111 ≠ 109), `git restore KHUON_LOI.md`; marker idempotent đã là `CHECKLIST_CODE.md` F2 (dòng 263) |
| f | Miễn A11 không kiểm "chỉ thêm ca" (soát vòng 1, nghi ngờ) | KHOÁ | Chủ quán chốt (d): `cong.js:244-252`, ca (d)(i)/(ii), đột biến MD |
| h | (d) gắn theo nhánh "xanh trên gốc" thay vì theo file ghi trong mục → lách bằng một ca đỏ (soát vòng 2, lỗi 1) | KHOÁ | ca (d)(iii), đột biến MD2 đỏ trước |
| i | Cùng lỗi (h) nhìn từ cách nghĩ | NGUYÊN TẮC | `KHUON_LOI.md` K4 thêm dòng "phép chặn theo đối tượng" (111/120 dòng) |
| j | `trang_thai.md` trôi khỏi HEAD sau đợt sửa theo quyết định chủ quán — lặp 2 vòng (soát vòng 1 lỗi 2, vòng 2 lỗi 2) | KHOÁ (đề xuất) | Ngoài Phạm vi: phép kiểm trong `tu_chay/thu_cong_cu.js` (hoặc `lenh_ra_soat.md`): mọi tên đột biến trong `viec/<MÃ>/dot_bien.py` phải có trong `viec/<MÃ>/trang_thai.md`; ca đỏ = trang_thai thiếu "MD2". Chat soát duyệt |

Dọn: không có lời dặn nào trong `KHUON_LOI.md` / `CLAUDE.md` vừa được phép kiểm làm thay trọn.
`CLAUDE.md` §2 ghi "36 phép lúc 24.09.2026" (bộ kiểm nay 54) — ngoài Phạm vi, đề xuất cập nhật ở việc sau.

## BÁO CÁO
```
VIỆC:        HOC-1 — miễn A11 cho bài thử cũ, package.json là file luật, T2 bỏ thư mục con
ĐÃ SỬA:      tu_chay/cong.js:61-71 — mucBaiThuCu đọc ## Bài thử cũ sửa
             tu_chay/cong.js:200-208 — chế độ chay: dòng hỏng (thiếu lý do, không thu_*.js, xoá/đổi tên, mới, không có)
             tu_chay/cong.js:225-226 — miễn A11 khi xanh trên gốc, không tính doHopLe (A12 giữ); file trong mục vào (d)
             tu_chay/cong.js:244-252 — (d): bản gốc của bài thử ghi trong mục chạy trên code PR, phải XANH
             chế độ tinh không đổi (A12 ở cong.js:162)
             tu_chay/cau_hinh.json:11 — file_luat thêm "package.json"
             kiem_tra_truoc_khi_giao.js:530-533 — T2 chỉ so file (statSync như cai_dat.js:97), symlink treo không sập
             tu_chay/PHIEN_BAN 1.3.1; MAU_PHIEU.md, skill_lam_viec.md, THIET_KE.md B15 (Phát hiện 5, (d)); KHUON_LOI.md K4 (+2 dòng)
BÀI THỬ:     chạy trên bản chưa vá → ĐỎ: thu_cong 21 chỗ, thu_nguoi_gac 4, thu_cong_cu 6 (bang_chung_do.txt);
             (d)(i) ĐỎ trước (d), (d)(iii) ĐỎ trước sửa vòng 2; ca xanh trên gốc đỏ bằng đột biến: 18/18 ĐỎ đúng chỗ,
             3 M0 XANH (python3 viec/HOC-1/dot_bien.py, lần đủ cuối trên c8670cb); sau vá: thu_cong 196 phép 0 hỏng,
             thu_nguoi_gac 782/782 + 165, thu_cong_cu 77 — npm test / --day-du PASS 54 FAIL 0 CẢNH BÁO 2 (bản cài)
ĐÃ RÀ K4:    4 chỗ liệt kê tu_chay/ (cai_dat.js:97, cong.js:49 cacFile, cong.js:120 ls-tree, T2 :530) cùng khuôn kể cả symlink;
             file_luat ở nguoi_gac.js:189 + cong.js:145 — một mục phủ cả hai; mucMien / mucBaiThuCu cùng cách tách dòng;
             (d) phủ MỌI file ghi trong mục mà PR sửa (xanh lẫn đỏ trên gốc — lỗi soát vòng 2 đã sửa)
CHƯA KIỂM:   cổng thật trên GitHub (F3) — cần chủ quán chạy bash tu_chay/cai_dat.sh trên viec/HOC-1 trước, không thì A8 đỏ;
             thời gian thu_cong.js trên máy GitHub (39 s ở đây, giới hạn 120 s); chế độ chay trên kho THẬT (npm ci + toàn
             bộ) chưa chạy — chỉ qua kho giả; (d) với bài thử không kín (ghi trạng thái vào cây) và bài là symlink
             (Phát hiện 5); đường KHÔNG ghi mục miễn vẫn để lọt "thay bài cũ bằng ca đỏ mới" (có từ trước, Phát hiện 4)
GIT:         xem dòng commit cuối của nhánh — mục này viết trước commit của chính nó; HEAD trước commit này: c8670cb
BÀI HỌC:     KHOÁ 4 (+1 đề xuất) · NGUYÊN TẮC 2 · BỎ 2 — chi tiết ở ## Bài học
```
