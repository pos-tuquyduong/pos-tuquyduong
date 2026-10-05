# HOC-2 — Kế hoạch (bước 3 — ĐÃ DUYỆT 05.10, phạm vi sau khi tách ở mục đầu)

Đọc trong lượt này: `viec/HOC-2/phieu.md`; `tu_chay/cong.js` (274 dòng, cả file); `tu_chay/nguoi_gac.js` 1–130, 484–500,
645–665, 893–905, 986; `tu_chay/cau_hinh.json`; `tu_chay/cai_dat.js` 20–30, 78–92; `tu_chay/thu_cong.js` 1–120, 305–513;
`tu_chay/thu_nguoi_gac.js` 1–60, 120–140, 485–520, 590–625; `tu_chay/thu_cong_cu.js` 316–445; `tu_chay/MAU_PHIEU.md`;
`tu_chay/lenh_ra_soat.md`; `kiem_tra_truoc_khi_giao.js` 477–488, 551–650, 730–783; `cong_cu/gia_lap/bat_bien.js` 120–157;
`cong_cu/gia_lap/chay.js` 25–45; `cong_cu/gia_lap/kich_ban.js` 310–340; `cong_cu/thu_gia_lap.js` 28–174;
`cong_cu/thu_P26b.js` 300–433; `cong_cu/thu_P20.js` 1–40 + mọi dòng `k(`; `server/routes/signup-codes.js` 47–70;
`server/routes/refunds.js` 164–166; ba `dot_bien.py` cũ (HOC-1, P26b, TU-CHAY-4 — cả file); `viec/AUDIT-1/bao_cao.md`,
`viec/AUDIT-1/trang_thai.md` 60–154, `viec/P26b/trang_thai.md` 370–516; `ban_mau_pos/chay_thu.sh`; `CLAUDE.md` 20–30, 100–120.
Số đo thật lúc lập kế hoạch (máy mây, HEAD `ba72a3f`): `--day-du` PASS 65 · FAIL 0; giả lập **68,0 s**, `thu_gia_lap`
**73,3 s**, `thu_cong` 48,1 s (hạn `chayBaiThat` 120 s, `kiem_tra_truoc_khi_giao.js:479`).


## Phạm vi sau khi tách (chủ quán chốt Q1–Q4, commit `61d037a PHIEU: HOC-2 sua`)
- **Làm ở HOC-2** (chỉ bộ khung `tu_chay/` + hai file ngoài đã ghi trong Phạm vi): A1–A7, B1–B2, D1, E3, F1–F2, G.
  - Q1: phiếu mới không còn mục `## Bài thử cũ sửa` → `thu_cong.js`, `thu_nguoi_gac.js`, `thu_cong_cu.js` mỗi bài phải có
    ca hành vi mới ĐỎ trên gốc (đã có: A2/A16–A18; A7/B1/B2/PHIEN_BAN; E3).
  - Q3: xoá `vuot_ngan_sach_canh_bao` (cùng các khoá không ai đọc ở bảng A2).
  - Q4: A18 (VÁ SAI) không áp khi phiếu có miễn `## Bài thử đỏ` — có ca riêng.
  - G: đột biến chạy lại chỉ gồm AUDIT-1 nhóm `G3`, `A3`, `B1` + `!D1-T1-nguoi-gac`, `!D1-T1b-cong-cu`, `!D1-T1c-cong`;
    cả bộ HOC-1; cả bộ HOC-2.
- **Sang HOC-2b** (không đụng ở đây): C1–C5, D2–D5, E1–E2; số đo "22 s" trong `THIET_KE.md`.
- **Ước thời gian mới:** A ~60 ph · B ~20 · D1 ~10 · E3 ~25 · G + `/ra-soat` 1–3 vòng ~45 → ~2,5–3 giờ.

---

## Câu hỏi cho chủ quán (cần trả lời khi duyệt)

**Q1 — CHẶN cổng của chính PR này nếu giữ nguyên phiếu.** `## Bài thử cũ sửa` ghi `tu_chay/thu_nguoi_gac.js`. Cổng main
(`cong.js:225` + `:246–251`, HOC-1 (d)) sẽ chạy **bản GỐC** của file đó trên code PR. Bản gốc khoá cứng
`PHIEN_BAN = tu-chay 1.3.2` (`thu_nguoi_gac.js:617`); E3 bắt nâng lên `tu-chay 1.4.0` → bản gốc ĐỎ chắc chắn → cổng
A11 đỏ. Bản MỚI của `thu_nguoi_gac.js` đã đỏ trên gốc nhờ ca hành vi mới (A7: `cong_cu/thu_P26b.js` thành file luật;
PHIEN_BAN 1.4.0) nên KHÔNG cần miễn — đúng câu "file nào vừa có ca hành vi mới đỏ trên gốc thì KHÔNG cần miễn" của phiếu.
→ Đề nghị chủ quán commit `PHIEU: HOC-2` bỏ dòng `tu_chay/thu_nguoi_gac.js` khỏi `## Bài thử cũ sửa`.
(Phương án khác: không nâng PHIEN_BAN — trái E3, không đề nghị.) Hai dòng còn lại (`thu_P26b.js`, `thu_P20.js`): bản gốc
chạy trên code PR vẫn xanh vì `server/` không đổi — sẽ chạy kiểm thật ở bước 6 (A6).

**Q2 — Thời gian máy ước ~4,5–5 giờ (> 150 phút) → đề xuất tách** (chủ quán chọn, máy KHÔNG tự cắt mục):
- **HOC-2a** (mọi thứ trong `tu_chay/`, chủ quán chạy `cai_dat.sh` MỘT lần): A1–A7, B1–B2, E3. ~2,5 giờ.
- **HOC-2b** (bộ kiểm, giả lập, đột biến cũ, tài liệu; không đụng `tu_chay/`): C1–C5, D1–D5, E1–E2. ~2,5 giờ.
  Làm SAU khi HOC-2a gộp: D5 mong `B1-A14-bo-dang-nhanh` và `A3-CCLA-them-la` đã BẮT (cần A1, B1).
- Hoặc làm một lần trên nhánh này theo đúng thứ tự A → B → C → D → E (kế hoạch dưới viết cho cả hai cách).
Ước lượng: A ~60 ph · B ~20 · C ~55 (mỗi lần giả lập ~70 s) · D ~50 (D5: 165 + 60 + 19 + 10 đột biến) · E ~40 ·
kiểm + `/ra-soat` 1–3 vòng ~45–60.

**Q3 — `vuot_ngan_sach_canh_bao`: đề xuất XOÁ.** Lý do: mục `## Ngân sách` là văn xuôi tự do ("Code ~200 dòng: `cong.js`
+~90 …", MAU_PHIEU "~80 dòng code + ~150 dòng thử") — cổng phải đoán con số, đoán sai thì cảnh báo mỗi PR = báo oan dạy
người bỏ qua (K8). Việc so ngân sách đã có người làm: skill bước 6 "so số dòng với ngân sách", agent soát. Phương án B
(cổng đọc dòng đầu dạng `Code ~N` ở `## Ngân sách`, chỉ `ghi` cảnh báo) ~+12 dòng `cong.js` + ~20 dòng thử + quy ước
mới trong MAU_PHIEU. Chọn B thì báo khi duyệt.

**Q4 — A5 (VÁ SAI bắt buộc) khi phiếu có `## Bài thử đỏ` "không — …".** Phiếu chỉ nói "PR không đổi code chạy thật →
không áp". Đề xuất: **cũng không áp khi phiếu có miễn** — PR được miễn bài thử đỏ (đổi chú thích, đổi tên biến…) không có
chỗ vá nào để "vá sai"; mục miễn nằm trong phiếu (chỉ commit `PHIEU:` sửa được, cổng A7) nên máy không tự lách được.
Không đồng ý thì A5 áp mọi PR đổi `server/` / `client/src/`.

---

## A. Cổng PR — `tu_chay/cong.js`, `tu_chay/cau_hinh.json`; ca thử trong `tu_chay/thu_cong.js`

Mã lý do mới của cổng (nối dãy A6–A15 có sẵn; số mục nghiệm thu A1–A7 của phiếu KHÁC mã cổng):
**A16** bằng chứng khớp số ca (A3) · **A17** tên đột biến có trong trang_thai (A4) · **A18** VÁ SAI bắt buộc (A5).
Mỗi mã có `tat` riêng → thêm vào bảng đột biến `DB` (`thu_cong.js:336`) như A6–A14 ("tắt kiểm → ca chặn thành ĐẠT").

### A1 (AU-B1) — ca riêng cho A14 dạng-nhánh — chỉ `thu_cong.js`
Gốc rễ: đột biến bỏ cổng dạng-nhánh (`cong.js:82`) vẫn ĐỎ nhờ cổng thứ hai `:89` (`viec//phieu.md` không có) — hai cổng
chồng nhau (K3), ca hiện có (`thu_cong.js:247`) không soi câu kết luận.
**Phương án A (chọn, ~3 dòng):** ca `A14 nhánh dạng gần đúng viec/X/con (phiếu viec/X hợp lệ)` với
`chua: ['không có dạng viec/<MÃ>']`, và thêm cùng `chua` vào ca `:247`. Đột biến `B1-A14-bo-dang-nhanh` → câu đó biến mất
→ ĐỎ = BẮT. Không đổi `cong.js`.
**Phương án B (bỏ):** gộp hai cổng A14 trong `cong.js` — đổi luật cổng, phiếu cấm "đổi luật khác".

### A2 (AU-B2) — mỗi khoá cấu hình có người đọc
Bảng khoá (grep `cau_hinh` + tên khoá trong `tu_chay/`, `cong_cu/`, `kiem_tra_truoc_khi_giao.js`, skill/lệnh đã cài):

| khoá | ai đọc (file:dòng) | quyết |
|---|---|---|
| `app` | không ai (chỉ mẫu ở `THIET_KE.md:187`) | XOÁ |
| `nhanh_chinh` | không ai (`cong_github.yml` ghi cứng `branches: [main]`, khoá bằng `thu_cong.js` kiemYml) | XOÁ |
| `lenh_bai_thu`, `lenh_kiem_day_du` | `cong.js:234` | code |
| `lenh_gia_lap` | không ai (`THIET_KE.md:204` nói rõ cổng không đọc) | XOÁ (phiếu) |
| `thu_muc_bai_thu` | `cong.js:19, 37` | code |
| `so_viec` | không ai (sổ việc được giữ bằng `file_cam` `TIEN_DO_*.json`) | XOÁ |
| `cong_cu_so_viec` | không ai (`PY-SO` ghi cứng `dong_tien_do.py`, `nguoi_gac.js:655`) | XOÁ |
| `file_cam` | `nguoi_gac.js:179, 454`; `cong.js:155` | code |
| `file_luat` | `nguoi_gac.js:189` (`xetPhamVi`, cổng dùng lại) | code |
| `file_bi_mat` | `nguoi_gac.js:375, 688` | code |
| `chuong_trinh_them`, `tep_bash_them` | `nguoi_gac.js:422`, `:420` | code |
| `ten_mien_production` | `cong_cu/gia_lap/chay.js:39` | code |
| `so_vong_sua_toi_da` | `skill_lam_viec.md:51` (máy đọc bằng mắt, bước 8) | TÀI LIỆU |
| `vuot_ngan_sach_canh_bao` | không ai (`THIET_KE.md:347` mô tả) | XOÁ (Q3) |
| `khuon_loi_toi_da` | `tu_chay/thu_cong_cu.js:328` (phép F3) | code |
| `muc_gac` | `cai_dat.js:83`; `cong.js:128` | code |
| `ban_cai` | `cai_dat.js:83`; `cong.js:126`; `kiem_tra_truoc_khi_giao.js:591` (T4) | code |
| `kiem_sau_day_len` | không ai (`THIET_KE.md:361`, công cụ "lên production" chưa có) | XOÁ |

Kiểm trước khi xoá (K5): `nguoi_gac.js:896` chỉ đòi 5 mảng; `cong.js:19` đòi `ban_cai/muc_gac/thu_muc_bai_thu`;
`cai_dat.js:83` đọc `ban_cai/muc_gac`; `chay.js:39` đọc `ten_mien_production`; `thu_nguoi_gac.js:598–617` (bản gốc lẫn
mới) không đòi khoá bị xoá. Không khoá bị xoá nào có người đọc.

**Phương án A (chọn, soát kế hoạch: ngắn hơn bản đầu):** KHÔNG thêm khoá cấu hình. Danh sách khai rõ nằm ngay trong
`thu_cong.js` (hàm thuần `kiemKhoa(ch, doc)` ~18 dòng): bảng cố định `NGUOI_DOC = { khoá: [file đọc] }` (code) và
`TAI_LIEU = { so_vong_sua_toi_da: 'tu_chay/skill_lam_viec.md' }` (khoá chỉ-tài-liệu). Mỗi khoá của cấu hình phải có ở một
trong hai bảng VÀ file ghi kèm (bỏ dòng chú thích `//` với file .js) phải chứa tên khoá (từ nguyên). Ca: cấu hình thật →
0 lỗi; thêm `khoa_la` → lỗi nêu `khoa_la`; khoá trong `NGUOI_DOC` mà file đọc không còn nhắc → lỗi.
Đỏ trên gốc: `cau_hinh.json` gốc còn `lenh_gia_lap`, `app`… → lỗi.
**Phương án B (bỏ):** quét mọi file tìm tên khoá (không bảng) — bài thử/tài liệu nhắc tên cũng tính là "đọc" → xanh oan.

### A3 — `bang_chung_do.txt` khớp số ca bài thử ở head — `cong.js` chế độ `chay` (A16, ~20 dòng)
**Định dạng chốt (một dạng):** mỗi bài thử đỏ một dòng riêng `SỐ CA <đường dẫn thu_*.js>: <N>` trong
`viec/<MÃ>/bang_chung_do.txt`, N = tổng số ca bài thử ở head.
**Số ca ở head** = cổng đọc dòng tổng của chính bài thử khi chạy trên code PR (`cong.js:240–243`, đã chạy sẵn), lấy dòng
CUỐI khớp một trong ba dạng đang có: `A đạt · B hỏng` → A+B (`cong_cu/thu_*.js`, `thu_gia_lap`); `N phép · M chỗ hỏng` → N
(`thu_cong`, `thu_cong_cu`); `a/B ca người gác … · C phép khác` → B+C (`thu_nguoi_gac`).
**Áp khi:** phiếu KHÔNG có miễn `## Bài thử đỏ`; cho MỖI bài thử được tính đỏ hợp lệ trên gốc (`doHopLe++`, `cong.js:230`).
Bằng chứng đọc bằng `blob` ở head TRƯỚC khi chạy code PR (đúng nguyên tắc `cong.js:6–8`). Lỗi (mỗi loại một câu, nêu file
+ hai con số): thiếu `bang_chung_do.txt`; thiếu dòng `SỐ CA` của bài; N ≠ số ca head; bài không in được dòng tổng.
Bài thử cũ được miễn (`## Bài thử cũ sửa`) không bắt buộc dòng (không có bằng chứng đỏ).
**Phương án B (bỏ):** chỉ soát dòng `SỐ CA` nào có mặt — bỏ dòng là lách; đúng khuôn K4 "phép gắn theo nhánh kết quả".
Dòng tổng đọc sau khi bỏ mã màu ANSI (`thu_P20.js:322`, `thu_P21.js` in kèm mã màu). A16 viết thành KHỐI RIÊNG sau vòng
`cong.js:240–243` (dùng lại kết quả đã lưu), KHÔNG sửa các chuỗi neo mà đột biến AUDIT-1 dùng (`cong.js:82`, `:162`,
`:234`, `:240–241`, `:225`…) — D5 mong 0 HỎNG.

**Giữ mọi ca cũ của `thu_cong.js` (K5 — soát kế hoạch đếm: A18 làm đỏ ca ĐẠT 119, 130, 132, 211, 216, 229, 257, 259,
261, 263, 273, 286, 288, 290, 304, phép "tách chế độ" 316–320, và 127/298 nếu không duyệt Q4; A17 làm đỏ 120, 243 vì ghi
đè `trang_thai.md` = `x`; A16/A18 giữ ĐỎ các ca bảng `DB` 336–346 khi tắt mã — A9 154, A10 157, A12 244, A8 222/231/233
(A18), A11 163/169, A8 177, A13 245 (A16)):** dữ liệu sẵn trong commit gốc `dungKho()` (`thu_cong.js:53–75`):
`viec/X/dot_bien.py` có `('VS-x', …)`, `viec/X/trang_thai.md` có `VS-x`, `viec/X/bang_chung_do.txt` có dòng `SỐ CA` cho
`cong_cu/thu_a.js` và `cong_cu/thu_c.js`; `THU_HOP_LE`, `THU_C_GOC` (`:46, :51`) in `N đạt · M hỏng`; hai ca 120, 243 ghi
`trang_thai.md` giữ dòng `VS-x`. ~8 dòng. Sau khi viết: chạy lại cả `thu_cong` — mọi ca ĐẠT cũ còn ĐẠT, mọi đột biến tắt mã
cũ còn thành ĐẠT; ca mới A16–A18 tự dựng dữ liệu sai riêng (mỗi ca chỉ vi phạm đúng một luật, K3).

### A4 — tên đột biến có trong trang_thai — `cong.js` chế độ `tinh` (A17, ~10 dòng)
Đọc `viec/<MÃ>/dot_bien.py` và `trang_thai.md` ở head (blob). Tên = mỗi dòng mở đầu `('<tên>',` (regex
`^\s*\(\s*'([^'\n]+)'\s*,` — khớp cả ba dạng đang có: HOC-1 `('M9 cai_dat …',`, AUDIT-1 `('A3-CCLA-them-la',`,
P26b `('huy-bo-cong',`). Tên phải xuất hiện trong `trang_thai.md` với ranh giới không phải chữ/số/gạch (`M1` không khớp nhờ
`M10`). Thiếu → đỏ, in danh sách tên thiếu. Không có `dot_bien.py` → không áp. Quy ước ghi vào MAU_PHIEU + skill: đột biến
khai một dòng một tuple, không sinh tên bằng vòng lặp (tên sinh ra cổng không đọc được — P26b `K1-bo-409-*` là dạng đó;
việc cũ không bị soát lại).
Phương án B (chạy `python3 dot_bien.py --ten`): chạy code PR ở chế độ tĩnh — trái `cong.js:5`. Bỏ.

### A5 — VÁ SAI bắt buộc — `cong.js` chế độ `tinh` (A18, ~8 dòng)
PR có file đổi (kể cả xoá) dưới `server/` hoặc `client/src/` → `viec/<MÃ>/dot_bien.py` phải có ở head và có ≥ 1 tên mở đầu
**`VS-`** (quy ước chốt; đột biến "bỏ vá" khuyên đặt `BV-`, cổng không đòi). Không áp: PR không đụng hai thư mục đó (K5);
phiếu có miễn `## Bài thử đỏ` (nếu chủ quán duyệt Q4). Ca đỏ: đổi `server/a.js` không có `dot_bien.py`; có file nhưng chỉ
tên `BV-x`. Ca qua: có `('VS-x', …)` và tên có trong trang_thai; PR chỉ đổi `cong_cu/` hoặc tài liệu.

### A6 — hồ sơ HOC-2 tự đạt A3–A5
`viec/HOC-2/dot_bien.py` (đột biến của chính việc này, mục "Ca đỏ" dưới) — mọi tên ghi trong `trang_thai.md`;
`bang_chung_do.txt` có dòng `SỐ CA` cho từng bài đỏ trên gốc. HOC-2 không đổi `server/`/`client/src/` → A18 không áp.
Chạy `cong.js` MỚI: `tinh` trên kho thật (mốc = `cb5d9fd`, cha của `PHIEU: HOC-2`); `chay` trên BẢN SAO kho trong thư mục
nháp (`cp -r` cả kho + `.git` vào nháp — `chay` chạy `npm ci` và ghi cây làm việc, không làm ở kho thật). Chép kết quả vào
`trang_thai.md`.

### A7 — `ban_mau_pos/thu/` và `file_luat`
- **`ban_mau_pos/thu/` KHÔNG thêm vào `thu_muc_bai_thu`.** Đọc: `laBaiThu` (`cong.js:36`) nhận `thu_*.js` → 6 file
  `ban_mau_pos/thu/thu_*.js` sẽ thành bài thử của cổng; nhưng không file nào gọi `process.exit` (grep: 0 chỗ) — chúng in
  `N đạt · M hỏng` và LUÔN thoát 0; `chay_thu.sh` mới là nơi đếm dòng đó. Thêm vào thì A11 (`cong.js:227`) thấy mọi bài bản
  mẫu "XANH trên code gốc" → chặn OAN mọi PR sửa bài thử bản mẫu (việc giao diện P7, P13–P18) — K5. Ghi `## Phát hiện`:
  muốn thêm thì trước hết `ban_mau_pos/thu/*.js` phải thoát ≠ 0 khi có ca hỏng (file luật bản mẫu, ngoài Phạm vi, phải
  hỏi chủ quán). Ghi lý do này vào `THIET_KE.md` cạnh chỗ tả `thu_muc_bai_thu`.
- `file_luat` thêm đúng tên `cong_cu/thu_P20.js`, `cong_cu/thu_P21.js`, `cong_cu/thu_P26a.js`, `cong_cu/thu_P26b.js`.
  Ca (`thu_nguoi_gac.js`, dùng `cau_hinh.json` thật như khối `:491–506`): phiếu chỉ `- cong_cu/**` → Edit
  `cong_cu/thu_P26b.js` bị `G-LUAT` (và Bash `echo x > …`); phiếu ghi đúng tên → `CHO`; `cong_cu/thu_khac.js` với
  `cong_cu/**` → `CHO` (K5: glob vẫn mở file không phải luật). Ca cấu hình thật `:600` thêm 4 tên.
- Không đổi luật nào khác, không đổi `cong_github.yml`.

## B. Người gác — ca thử trong `tu_chay/thu_nguoi_gac.js`

### B1 (AU-A1) — khoá tập CONG_CU_DOC / CONG_CU_SUA
**Phương án A (chọn, ~10 dòng, KHÔNG sửa `nguoi_gac.js`):** đọc mã nguồn người gác đang thử (`GAC`, đã hỗ trợ
`--nguoi-gac`, `thu_nguoi_gac.js:21`), cắt literal `const CONG_CU_DOC = new Set([...])` và `CONG_CU_SUA`, lấy các tên
`'…'`, so khớp ĐÚNG tập cố định trong bài (18 tên DOC, 4 tên SUA hiện có ở `nguoi_gac.js:105–108`). Không cắt được → đỏ. Lỗi đẩy vào `hong` dưới dạng `ca khoá tập …` (dòng ra `✗ ca …`) để mẫu
`✗ (ca |tự sinh)` của `A3-CCLA-them-la` (`viec/AUDIT-1/dot_bien.py:58`) khớp → BẮT, không LẠC.
Ca hành vi có sẵn (`:129–136`) giữ nguyên. Đột biến `A3-CCLA-them-la` (thêm `'Bash2'`) → tập lệch → BẮT.
**Phương án B (bỏ):** `module.exports` thêm hai tập — phải sửa `nguoi_gac.js` (phiếu: chỉ sửa khi B2 cần).

### B2 — `cong_cu/ban_sao_goc.py <commit> <thư mục đích>` (~45 dòng Python)
- `git rev-parse --verify <commit>^{commit}` (không có → thoát 1); đích: `realpath`, phải nằm dưới
  `tempfile.gettempdir()` (realpath; thư mục nháp của Claude cũng nằm dưới đó) và KHÔNG nằm trong kho; đích có sẵn mà
  không rỗng → từ chối (không đè gì).
- `git archive <commit> server` (chỉ đọc git, không ghi ref/index) → `tar -x -C <đích>`; symlink `<đích>/node_modules` →
  `node_modules` của kho. In đường dẫn `--may-chu <đích>/server` để dùng thẳng với `thu_P26b.js` / `gia_lap/chay.js`.
- **Người gác: KHÔNG sửa.** Đọc `nguoi_gac.js:649–657`: `python3 <script>` chỉ bị chặn khi `-m`, tên `patch_*.py`, ghi
  sổ việc, mã viết thẳng nhắc file bảo vệ — lệnh `python3 cong_cu/ban_sao_goc.py abc123 /tmp/x` đi qua. Ca `CHO` trong
  `thu_nguoi_gac.js` khoá việc đó (xanh trên gốc — khoá, không phải bằng chứng đỏ).
- Ca chạy thật công cụ (trong `thu_nguoi_gac.js`, kho git tạm): đích trong kho → thoát ≠ 0, không tạo gì; đích ngoài thư mục
  tạm (vd `$HOME/x` của HOME giả) → từ chối; đích hợp lệ → có `server/` đúng byte commit + `node_modules` là symlink, `git
  status` kho tạm không đổi. Đỏ trên gốc: công cụ chưa có → ba ca đỏ.

## C. Bộ kiểm + giả lập

### C1 — T2, T3, T4, F2 giữ cảnh báo, thêm một dòng lý do (`kiem_tra_truoc_khi_giao.js:551, 576, 589, 619`)
Chỉ thêm chú thích: T2–T4 "máy sửa `tu_chay/` trên nhánh thì bản cài chắc chắn lệch tới khi chủ quán chạy `cai_dat.sh`;
cổng A8 chặn cứng (`cong.js:146–152`, `:186`) — nâng thành FAIL là chặn commit của chính việc đang sửa tu_chay/";
F2 "người gác chặn tạo `.js` ở gốc trong phiên việc; file lạc cũ không làm hỏng quầy". Không đổi hành vi (so `npm test`
trước/sau: cùng PASS/CẢNH BÁO).

### C2 — bỏ I10 (`bat_bien.js:137–145`), `NGUONG_BAT_BIEN` 11 → 10 (`kiem_tra…js:745`)
Xoá hàm I10 + chú thích I11 bỏ câu so I10; dòng đầu `bat_bien.js:2` "11" → "10"; `kiem_tra…js:745` = 10 kèm chú thích
"I10 ⊂ I11, không giảm độ phủ (HOC-2, chủ quán chốt 2a)" và sửa câu "chỉ được TĂNG" (`:742`) thêm "trừ lần hạ có chủ quán
chốt"; `thu_gia_lap.js:31` `DONG_DAT` → `· 10 bất biến ·`; M11, M12 (`:80, :82`) mong `I11`.
Lẽ bao trùm (ghi kèm): số tiền là số nguyên; Σ_ví(hoàn − trả) ≥ 1 ⇒ có ví với (hoàn − trả) ≥ 1 > 0,5 ⇒ mọi dòng I10 lệch
thì I11 lệch cùng đơn. **Chứng minh bằng chạy** (bảng tên → bất biến bắt, ghi `trang_thai.md`): `thu_gia_lap` M11, M12 →
`KB13/KB14 → I11`; `viec/P26b/dot_bien.py` `huy-kiem-ngoai-tx` (`:28`), `xoa-doc-don-ngoai-tx` (`:37`) đổi mẫu `|I10` →
`|I11` và vẫn BẮT. Đột biến nào chuyển SỐNG → DỪNG, ghi `## Câu hỏi`.

### C3 — thời gian giả lập
- Chú thích `kiem_tra…js:746` sửa theo số đo thật: máy mây 05.10.2026 giả lập 68,0 s, `thu_gia_lap` 73,3 s; thêm số đo
  job `cong-chay` trên GitHub (đọc log PR gần nhất bằng công cụ GitHub khi làm — chưa đọc, ghi vào trang_thai).
- `chayBaiThat(bai, env, han = 120000, ganHan = false)` (`:477`): CHỈ hai lời gọi giả lập + `thu_gia_lap` (`:749, :753`)
  bật `ganHan` (đúng phạm vi phiếu; `thu_cong` và thu_P2x không bị cảnh báo); bài xanh mà chạy > `han × 0,75` (= **90 s**)
  → `canhBao` "chạy X s, gần hạn Y s" (không FAIL). Đo lại `thu_cong` sau khi thêm ca A (hiện 48 s, hạn 120 s): > 90 s thì
  báo chủ quán, không tự nới. Ngưỡng 90 s: lúc bình thường 68–73 s (máy mây) không bật; chốt lại sau khi có số GitHub — số
  GitHub thật > 80 s thì báo chủ quán, KHÔNG tự nâng hạn (Cấm: không nới hạn).
- Ca thử trong `cong_cu/thu_gia_lap.js` (ngân sách phiếu ±~15 ghi C3 ở đây; không đụng `tu_chay/`): cắt khối hàm
  `chayBaiThat` thật từ `kiem_tra…js` (khuôn `thu_cong_cu.js:401–407` baiT2), chạy bằng `new Function` với GOC = thư mục
  tạm chứa `ngu.js` ngủ ~300 ms: `han` giả 350 ms → có cảnh báo; `han` thật 120000 → KHÔNG cảnh báo; bài thoát 1 → FAIL,
  không cảnh báo. Cắt không được → ca ĐỎ. Đỏ trên gốc: `chayBaiThat` gốc không cảnh báo.

### C4 — `cong_cu/thu_P26b.js` (+~35) và KB17-Q9 (`kich_ban.js:323–326`)
- M6 (`thu_P26b.js:351–352`) `<= 1` → `=== 1`.
- M9 "đơn có ví mẹ, phần mẹ 0đ (con trả đủ 25.000 bằng ví) → duyệt 200, 0 dòng hoàn mẹ, ví mẹ không đổi".
- M10 "yêu cầu cũ (`ycCu`, `:143`) trên đơn có ví mẹ → duyệt 200, ví mẹ +phần mẹ đúng 1 dòng".
- KB17-Q9: `c.mong('đơn ví con 5.000 + ví mẹ 20.000 tạo được (200)', …)` trước khi đo, dùng mã đơn đã kiểm.
- KHÔNG sửa `server/`. Ca nào đỏ trên code HEAD (lộ code đang sai) → DỪNG, ghi `## Câu hỏi`.
- Bằng chứng đỏ (server không đổi nên xanh trên gốc — file có trong `## Bài thử cũ sửa`) = đột biến trong
  `viec/HOC-2/dot_bien.py` chạy `thu_P26b --may-chu <bản sao>` / giả lập `--may-chu`: `VS-q9-me-lon-hon-bang-0`
  (`refunds.js:165` `> 0` → `>= 0`) → M9 ĐỎ; `BV-q9-bo-hoan-me` (`:165` → `if (false)`) → M5, M6, M10 ĐỎ (M6 nhờ `=== 1`);
  `KB17-khong-nap-me` (bỏ `await c.nap(ME, 20000)` ở bản sao giả lập) → dòng mới "tạo được (200)" ĐỎ.

### C5 (AU-G5) — `thu_P20.js` còn sống
Đột biến phá đúng thứ `thu_P20` canh mà phép tĩnh không soi: phép tĩnh E9 (`kiem_tra…js:403–445`) chỉ soi
`kiemDonCuaMa` là danh sách trắng + được gọi + kết quả được dùng; KHÔNG soi mã lỗi từng nhánh. Ứng viên theo thứ tự:
(1) `signup-codes.js:63` `code: 'DON_DA_HUY'` → `'DON_DA_HOAN'` (đơn huỷ báo sai lý do) → mong `✗ /claim với đơn đã huỷ →
400 DON_DA_HUY`; (2) `pay-debt` không đặt `payment_status` về `paid` (chuỗi cụ thể tìm khi làm) → mong `✗ … /claim → 200`.
Chạy `node kiem_tra_truoc_khi_giao.js` (bản nhanh: E9 tĩnh + `thu_P20` chạy thật đều có, `:405–445`, `:488`) trên bản sao kho: phải ĐỎ ĐÚNG dòng "bài chạy thật cong_cu/thu_P20.js"
VÀ không phép tĩnh nào khác đỏ. Ghi vào `viec/HOC-2/dot_bien.py` (`!C5-P20-…`). Không dựng được → ghi rõ vì sao.
`thu_P20` xanh với mọi ứng viên → DỪNG, ghi `## Câu hỏi`. Không sửa `thu_P20.js` trừ khi cần (phiếu cho thêm ca).

## D. Đột biến cũ và công cụ cũ

- **D1** `viec/HOC-1/dot_bien.py:30–31` `MB`, `MB4`: tìm `'"package.json"'` → thay `'"package.jsonX"'` (neo NGẮN, riêng:
  `cau_hinh.json` chỉ có 1 chỗ; đứng ở đâu trong mảng cũng khớp). Chạy `MB`, `MB4` → BẮT.
- **D2** `viec/P26b/dot_bien.py:138–139` bỏ `I10-bo`, để một dòng chú thích "bỏ ở HOC-2: I10 xoá (I10 ⊂ I11)"; `:28`,
  `:37` mẫu `|I10` → `|I11` (C2). Cả bộ chạy: 0 HỎNG.
- **D3** `viec/TU-CHAY-4/dot_bien.py:55–66` kiểu `tai_cho` → `ban_sao`: chép kho sang thư mục tạm (`shutil.copytree`,
  bỏ `.git`, `node_modules`, `client/node_modules`, `data/` — nối symlink `node_modules` hai chỗ), thay chuỗi trong bản
  sao, chạy `kiem_tra_truoc_khi_giao.js` của bản sao. In `git status --porcelain` + chụp `data/` trước/sau, khác → báo
  "KHO BẨN", thoát ≠ 0. F2, S3 → BẮT. (Bộ kiểm F2 cần `--day-du` → bản sao phải có `client/` đủ để so băm `dist`; nếu
  phép dist đỏ vì bản sao thiếu gì thì thêm vào danh sách chép — không đổi bộ kiểm.)
- **D4** `git rm cong_cu/thu_p1.js` (xoá file, phiếu 3a). `grep thu_p1` còn: `patch_pos_khothu_v2.py`, `lui_KHOTHU_v2.sh`
  (script vá cũ ở gốc, KHÔNG sửa) + `CHECKLIST_CODE.md:384` (file luật ngoài Phạm vi) → ghi `## Phát hiện` cho DON-DEP-v1.
- **D5** chạy LẠI CẢ BỘ trên head cuối: `viec/AUDIT-1/dot_bien.py` (mọi nhóm, 165 tên), `viec/P26b/dot_bien.py`,
  `viec/HOC-1/dot_bien.py`, `viec/TU-CHAY-4/dot_bien.py`, `viec/HOC-2/dot_bien.py`. Bảng BẮT/SỐNG/HỎNG/LẠC từng bộ, ĐẾM đủ.
  Mong: 0 HỎNG; `B1-A14-bo-dang-nhanh`, `A3-CCLA-them-la` thành BẮT; SỐNG còn lại chỉ là C2F của AU-G1/G2/G3/G4/G6
  (liệt kê tên). Chú ý: AUDIT-1 `!D1-E11-P20` vẫn có thể LẠC (phép tĩnh bắt trước) — liveness thu_P20 chứng minh ở C5.
  Code mới viết KHÔNG đổi chuỗi neo của AUDIT-1 (xem A3) → không đột biến AUDIT-1 nào HỎNG vì HOC-2; nếu vẫn HỎNG (neo
  rữa do việc khác) → ghi rõ, KHÔNG sửa `viec/AUDIT-1/` (ngoài Phạm vi) → `## Phát hiện`.

## E. Tài liệu
- **E1** `KHUON_LOI.md` 120 → ≤ 100 dòng: mỗi khuôn giữ "Dấu hiệu" + "Chặn"; "Đã gây" còn 1–2 ví dụ; bỏ lời dặn đã có
  phép làm thay (vd K3 "ca đỏ khớp câu kết luận" ← `thu_cong.js` ca() đòi "CỔNG ĐỎ"; K7 "commit không thành mà push" ←
  skill/K7 giữ; "bài thử phải đỏ trên gốc" ← cổng A11/A12; "đổi bài sau khi ghi bằng chứng" ← cổng A16 mới; tên đột biến
  ← A17). Gộp 4 ý mới (K8 báo oan; K3 con số "đạt" chạy lại trên HEAD + neo ngắn; K1/K5 đường tiền theo cái khách chạm +
  middleware + khoá trong thân hàm; nhánh hỏng đụng kho/tiền là NẶNG). `trang_thai.md` có bảng "dòng/ý bỏ → lý do".
  `khuon_loi_toi_da` giữ 120 (phép F3 + ca `thu_nguoi_gac.js:606`).
- **E2** `CLAUDE.md:112–114` sửa: nhóm E chỉ canh `from_package` (`kiem_tra…js:373` "chỉ canh được `from_package`"),
  `discount_*` không có phép tĩnh; `:26` bỏ "(36 phép lúc 24.09.2026)".
- **E3** `skill_lam_viec.md`: (a) bước 4–5 đổi code chạy thật → bắt buộc đột biến `VS-` + `BV-` trong `dot_bien.py`, bảng
  "chỗ vá → đột biến" trong `trang_thai.md`, mọi tên đột biến ghi vào trang_thai, `bang_chung_do.txt` có dòng `SỐ CA`;
  (b) bước 6 ĐẾM từng mục nghiệm thu có bằng chứng, không lấy mẫu; (c) thấy thông báo đổi model giữa phiên → ghi giờ +
  bước. Giữ thứ tự mốc H3 (`thu_cong_cu.js:349–355`). `lenh_ra_soat.md`: agent soát đối chiếu ĐỦ từng mục nghiệm thu bằng
  đếm, liệt kê mục thiếu. `MAU_PHIEU.md` + `THIET_KE.md` (B15 + mẫu cấu hình `:185–205`, `:337–347`): luật A16–A18, bảng
  khoá mới, `ban_mau_pos/thu/` không là bài thử cổng. `PHIEN_BAN` → `tu-chay 1.4.0`.
  Ca soi chữ thêm vào `thu_cong_cu.js` baiTaiLieu (khuôn có sẵn): skill có `VS-`, `SỐ CA`, "đổi model"; ra-soat có
  "từng mục nghiệm thu"; MAU_PHIEU có `SỐ CA`, `VS-`; `thu_nguoi_gac.js:617` PHIEN_BAN = 1.4.0. Đỏ trên gốc: chữ chưa có.

## Cổng của chính PR này (luật CŨ của main) — file `thu_*.js` bị đụng

| file | ca ĐỎ trên code gốc | dòng miễn |
|---|---|---|
| `tu_chay/thu_cong.js` | A2 (cấu hình gốc còn khoá không ai đọc), A16/A17/A18 (cổng gốc chưa có luật) | không |
| `tu_chay/thu_nguoi_gac.js` | A7 (`cong_cu/thu_P26b.js` chưa là file luật), PHIEN_BAN 1.4.0, B2 (công cụ chưa có) | **phải bỏ khỏi mục — Q1** |
| `tu_chay/thu_cong_cu.js` | E3 (chữ mới trong skill/ra-soat/MAU_PHIEU) | không |
| `cong_cu/thu_gia_lap.js` | `DONG_DAT` 10 bất biến (gốc 11), C3 cảnh báo gần hạn | không (cố ý đổi, phiếu) |
| `cong_cu/thu_P26b.js` | xanh trên gốc (server không đổi) | có — bản gốc chạy trên code PR phải xanh (server không đổi) |
| `cong_cu/thu_P20.js` | chỉ đụng nếu C5 cần; xanh trên gốc | có |
A12: có ≥ 1 bài đỏ hợp lệ (thu_cong…). A13: `npm test` + `--day-du` của main trên code PR. A8: đổi `tu_chay/` →
**chủ quán chạy `bash tu_chay/cai_dat.sh` trên nhánh `viec/HOC-2`** rồi mới mở PR (F2).

## Danh sách ca thử ↔ Nghiệm thu

| NT | ca (file) | đỏ trước bằng |
|---|---|---|
| A1 | `thu_cong`: ca `viec/X/con` + `chua` câu dạng-nhánh; ca `:247` thêm `chua` | AUDIT-1 `B1-A14-bo-dang-nhanh` → BẮT |
| A2 | `thu_cong`: `kiemKhoa` cấu hình thật = 0 lỗi; `+khoa_la` → lỗi; file đọc mất tên → lỗi | cấu hình gốc → lỗi |
| A3 | `thu_cong`: thêm 1 ca vào bài, giữ `SỐ CA …: 1` → ĐỎ A16 nêu file + "1" và "2"; thiếu file / thiếu dòng / bài không in tổng → ĐỎ; miễn `## Bài thử đỏ` → ĐẠT; khớp → ĐẠT; tắt A16 → ca đỏ thành ĐẠT | cổng gốc → các ca ĐỎ thành ĐẠT |
| A4 | `thu_cong`: `dot_bien.py` có `('M2',` mà trang_thai chỉ có `M20` → ĐỎ A17 in `M2`; đủ tên → ĐẠT; không có file → ĐẠT; tắt A17 | cổng gốc |
| A5 | `thu_cong`: đổi `server/a.js` không `dot_bien.py` → ĐỎ A18; có file chỉ `BV-` → ĐỎ; có `VS-x` → ĐẠT; đổi `client/src/x.jsx` → áp; chỉ đổi `cong_cu/` → không áp; (Q4) có miễn → không áp; tắt A18 | cổng gốc |
| A6 | chạy `cong.js` mới `tinh` + `chay` (bản sao) trên nhánh, chép vào trang_thai | — |
| A7 | `thu_nguoi_gac`: `cong_cu/**` + `thu_P26b.js` → G-LUAT; đúng tên → CHO; `cong_cu/thu_khac.js` → CHO; ca `:600` 4 tên | cấu hình gốc → CHO (đỏ) |
| B1 | `thu_nguoi_gac`: tập DOC/SUA đúng tập cố định | AUDIT-1 `A3-CCLA-them-la` → BẮT |
| B2 | `thu_nguoi_gac`: lệnh `python3 cong_cu/ban_sao_goc.py …` → CHO; công cụ: đích trong kho / ngoài tạm / không rỗng → từ chối; đích hợp lệ → đúng byte, git sạch | công cụ chưa có → đỏ |
| C1 | `npm test` trước/sau cùng số PASS/CẢNH BÁO | (chú thích, không hành vi) |
| C2 | `thu_gia_lap` DONG_DAT 10, M11/M12 → I11; P26b `:28/:37` | gốc 11 bất biến → đỏ |
| C3 | `thu_gia_lap`: cắt `chayBaiThat`, hạn giả → cảnh báo; hạn thật → không; bài đỏ → FAIL | gốc không cảnh báo → đỏ |
| C4 | `thu_P26b` M6 `===1`, M9, M10; KB17 kiểm tạo đơn | `VS-q9-me-lon-hon-bang-0`, `BV-q9-bo-hoan-me`, `KB17-khong-nap-me` |
| C5 | `--day-du` trên bản sao đột biến `!C5-P20-…` | đỏ đúng dòng thu_P20 |
| D1–D3 | chạy từng bộ, BẮT; D3 so `git status` trước/sau | trước sửa: HỎNG (MB, MB4, I10-bo) |
| D4 | `grep thu_p1` sau xoá | — |
| D5 | bảng đếm 5 bộ | — |
| E1 | `wc -l KHUON_LOI.md` ≤ 100; F3 xanh; bảng bỏ/gộp trong trang_thai | — |
| E2 | ca soi chữ `thu_cong_cu` (khuôn F2 `:375`): CLAUDE.md không còn "36 phép", câu nhóm E có `from_package` và không gán `discount` cho nhóm E | chữ cũ → đỏ |
| E3 | ca soi chữ `thu_cong_cu`: skill (`VS-`, `SỐ CA`, "đổi model", đếm nghiệm thu), ra-soat ("từng mục nghiệm thu"), MAU_PHIEU (`SỐ CA`, `VS-`), THIET_KE (A16, A17, A18; không còn `lenh_gia_lap`, `vuot_ngan_sach_canh_bao`, `kiem_sau_day_len`, `nhanh_chinh`, `so_viec`, "22 s"); PHIEN_BAN 1.4.0 | chữ chưa có → đỏ |
| F1 | đã làm lúc mở phiên: `git log --oneline -3` in trong câu trả lời đầu + `trang_thai.md` | — |
| F2 | chủ quán chạy `cai_dat.sh` trên nhánh, PR có `cong` + `cong-chay` xanh — máy không làm được, ghi CHƯA KIỂM | — |
| G | `npm test`, `--day-du`, 6 bài chạy riêng | — |

Đường tiền: việc này KHÔNG đổi `server/` → không có ca "hai người cùng bấm" mới; C4 chỉ thêm ca trên đường hoàn ví mẹ đã có.

## Luồng hợp lệ phải KHÔNG bị chặn (K5)
1. PR chỉ tài liệu / `viec/` (A16–A18 không áp) — ca cũ `A2 chỉ *.md` giữ ĐẠT.
2. PR có miễn `## Bài thử đỏ` → A16 không áp; (Q4) A18 không áp.
3. Bài thử cũ được miễn (`## Bài thử cũ sửa`, xanh gốc) → không cần dòng `SỐ CA`.
4. Bài đỏ trên gốc vì SẬP giữa chừng (không in tổng trên gốc) nhưng in tổng ở head → A16 đọc số ở head, qua.
5. `dot_bien.py` không có / PR không đổi `server/`, `client/src/` → A17/A18 không áp; PR đổi `cong_cu/thu_*.js` hay
   `tu_chay/` không bị đòi `VS-`.
6. Tên đột biến có dấu cách (HOC-1 `'M9 cai_dat bỏ …'`) vẫn đọc được.
7. Phiếu ghi `cong_cu/**` vẫn sửa được `cong_cu/thu_khac.js`, `cong_cu/do_chuathu.js` (không phải file luật).
8. Việc sửa bài thử bản mẫu `ban_mau_pos/thu/` không bị A11 chặn (vì không thêm vào `thu_muc_bai_thu`).
9. Cấu hình bỏ khoá: người gác nạp được (5 mảng còn đủ), `cai_dat.js` cài được, cổng nạp được, giả lập đọc
   `ten_mien_production` — chạy `thu_nguoi_gac`, `thu_cong` (D2 nạp cấu hình), `thu_gia_lap` E3.
10. `ban_sao_goc.py` với đích trong thư mục nháp của Claude (dưới `/tmp`) → cho.
11. Bộ kiểm lúc thường (68–73 s) không cảnh báo gần hạn.

## Đường song song cần canh (K4)
- Hai chế độ cổng: A17/A18 ở `tinh` (đọc blob), A16 ở `chay` — `chay` đọc bằng chứng trước khi chạy code PR.
- A12 có hai nơi (`cong.js:162` tinh, `:232` chay) — A16 gắn với `doHopLe` (chay), không đổi A12.
- Ba dạng dòng tổng bài thử (`đạt · hỏng`, `phép · chỗ hỏng`, `ca người gác … phép khác`) — đủ cả ba.
- `file_luat` dùng ở `nguoi_gac.js:189` và `cong.js:155` (qua `xetPhamVi`) — một chỗ cấu hình phủ cả hai.
- Bỏ I10: `bat_bien.js`, `kiem_tra…js:745`, `thu_gia_lap.js:31, 80, 82`, `viec/P26b/dot_bien.py:28, 37, 139`, dòng đầu
  `bat_bien.js:2` — grep `I10` / `11 bất biến` sau sửa phải chỉ còn ở hồ sơ cũ.
- Neo `"package.json"`: `MB` và `MB4` cùng sửa.
- Tài liệu (K4 tài liệu): mỗi câu đổi ở CLAUDE.md/THIET_KE/MAU_PHIEU/skill → grep cả file tìm câu cùng nghĩa
  ("36 phép", "11 bất biến", "22 s", "lenh_gia_lap", "vuot_ngan_sach", "kiem_sau_day_len", "nhanh_chinh", "so_viec",
  "app", "chiết khấu … nhóm E").

## Ngân sách dự kiến (so phiếu)
Code ~185: `cong.js` +~40 (phiếu ~90), `cau_hinh.json` −~6, `kiem_tra…js` ±~15, `bat_bien.js` −~12, `ban_sao_goc.py`
+~45, ba `dot_bien.py` cũ ±~30, `viec/HOC-2/dot_bien.py` +~60 (hồ sơ). Thử ~210: `thu_cong.js` +~110, `thu_nguoi_gac.js`
+~45, `thu_P26b.js` +~35, `thu_gia_lap.js` ±~20, `thu_cong_cu.js` +~10. Tài liệu như phiếu. `nguoi_gac.js`,
`gia_lap/chay.js`, `thu_P20.js`: 0 (chỉ sửa nếu bước làm thấy cần).

## Soát kế hoạch (agent phụ, chỉ đọc) — CẦN SỬA → đã sửa vào bản này
Ngoài Phạm vi / trái Cấm: không. Q1 đúng với code (`cong.js:225`, `:246–251`, `thu_nguoi_gac.js:617`). Đã sửa:
1. A16–A18 làm đỏ ca ĐẠT cũ + bảng `DB` của `thu_cong.js` → dữ liệu sẵn trong `dungKho`, bài giả in dòng tổng (mục A3).
2. B1 in `✗ ca …` để `A3-CCLA-them-la` BẮT, không LẠC.
3. Thêm F1, F2, bằng chứng E2 (CLAUDE.md), soi chữ THIET_KE ở E3, thêm tên khoá vào danh sách grep K4.
4. Chốt không đổi chuỗi neo AUDIT-1 trong `cong.js`; A16 là khối riêng.
5. C3 chỉ cảnh báo cho giả lập + `thu_gia_lap`; đo lại `thu_cong` sau khi thêm ca.
6. A16 bỏ mã màu ANSI trước khi đọc dòng tổng.
7. Sửa số dòng (`HOC-1/dot_bien.py:30–31` và 6 chỗ lệch nhẹ).
8. Nhận gợi ý ngắn hơn: bỏ khoá `khoa_tai_lieu` (A2); C5 chạy bộ kiểm bản nhanh.
