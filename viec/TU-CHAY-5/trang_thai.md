# TU-CHAY-5 — trạng thái

## Bước 1 — đối chiếu bản chụp (11.10.2026)

Nhánh: `viec/TU-CHAY-5`. `git log --oneline -3`:

```
5ad35ea PHIEU: TU-CHAY-5
c18ee16 TIEN-DO: TACH-GL xong (befc6ad), TU-CHAY-5 mo phieu — so v26
befc6ad Merge pull request #13 from pos-tuquyduong/viec/TACH-GL
```

`git branch -vv`: `viec/TU-CHAY-5 5ad35ea [origin/viec/TU-CHAY-5]` — HEAD = origin (hook SessionStart in
"· kéo nhánh: viec/TU-CHAY-5 đã có đủ commit của origin — không kéo").

## Lời chốt của chủ quán (11.10.2026, trong phiên)

> Nhóm A (A1–A4), D5, D6 DỜI sang AUDIT-2 — không làm, không lập kế hoạch cho các mục đó; mục F chỉ áp cho B, C, D1–D4, E.
> Lập kế hoạch rồi dừng chờ duyệt như phiếu.

## Lời duyệt kế hoạch (chủ quán, 11.10.2026)

> Duyệt kế hoạch a456f3d. Q1 đúng: A8 đỏ tới khi chủ quán chạy script cài của chat trên nhánh sau soát cuối — máy không chạy
> cai_dat.sh. Q2 đồng ý /dev/fd/3 (chat đã thử: cha đọc được, con ENXIO), vẫn chạy thử khả thi trước như kế hoạch. Q3 chấp nhận
> khe 300 ms, đột biến D3 chạy ≥ 3 lần và ghi từng lần, không sửa chayGL thêm. Q4 đồng ý. Q5 chỉ so phần SỐ CA, không so số
> phép; bài nào không tách được số ca thì bỏ so cho bài đó và ghi lý do. Q6 đồng ý, ghi Phát hiện kèm đề xuất sửa cai_thu_vien.sh.

## Chỗ vá → đột biến (`python3 viec/TU-CHAY-5/dot_bien.py -j 2`)

| Chỗ vá | Bài bắt | Đột biến |
|---|---|---|
| B1 nhánh `git rm` (`nguoi_gac.js` LUAT_CON.git) | `thu_nguoi_gac` | `BV-B1-bo-rm` |
| B1 lọc cờ rm (chỉ `-q`) | `thu_nguoi_gac` | `VS-B1-rm-cho-moi-co` |
| B1 rm xét như SỬA file (không miễn hoàn tác) | `thu_nguoi_gac` | `VS-B1-rm-mien-hoantac` |
| B1 rm không trong kho lồng | `thu_nguoi_gac` | `VS-B1-rm-bo-khoLong` |
| `khoLong` dừng khi ra ngoài kho | `thu_nguoi_gac` (tiến trình thật, hạn 10 s) | `VS-B1-khoLong-bo-dung-ngoai-kho` |
| B2 `TaskStop` trong `CONG_CU_DOC` | `thu_nguoi_gac` | `BV-B2-bo-TaskStop` |
| B3 nhánh fetch/pull | `thu_nguoi_gac` | `BV-B3-bo-keo` |
| B3 pull bắt buộc `--ff-only` | `thu_nguoi_gac` | `VS-B3-pull-thieu-ff-only` |
| B3 đúng nhánh đang đứng | `thu_nguoi_gac` | `VS-B3-keo-moi-nhanh` |
| B3 không kho lồng | `thu_nguoi_gac` | `VS-B3-keo-bo-khoLong` |
| C1 A19 | `thu_cong` | `BV-C1-bo-A19` |
| C1 chỉ commit đổi CODE sau SHA mới tính | `thu_cong` | `VS-C1-tinh-ca-commit-ho-so` |
| C1 "+ commit này" phải do chính commit đó thêm | `thu_cong` | `VS-C1-commit-nay-moi-noi` |
| C1 loại `.claude/` (chủ quán cài sau kiểm) | `thu_cong` | `VS-C1-khong-loai-claude` |
| C1 skill ghi HEAD ĐÃ KIỂM ở bước 11.4, không ở bước 10 (soát vòng 1) | `thu_cong_cu` | `VS-C1-skill-ghi-o-buoc-10` |
| C1 cổng đọc dòng CUỐI (soát vòng 2) | `thu_cong` | `VS-C1-doc-dong-dau` |
| C1 loại `cong.yml` (soát vòng 2) | `thu_cong` | `VS-C1-khong-loai-cong-yml` |
| C1 thông báo A19 trỏ đúng bước skill (soát vòng 2) | `thu_cong_cu` | `VS-C1-thong-bao-buoc-10` |
| C2 cảnh báo A16 | `thu_cong` | `BV-C2-bo-canh-bao` |
| C2 chỉ so số CA (Q5) | `thu_cong` | `VS-C2-so-ca-phep` |
| D1 `--kho` chỉ qua IPC (`chay.js`) | `thu_gia_lap` T7c | `BV-D1-bo-ipc` |
| D2 lượt TỪ CHỐI → cha dừng hết, thoát 3 | `thu_gia_lap` D2 | `BV-D2-bo-dung-het-3` |
| D3 `chayGL` setEncoding | `thu_gia_lap` D3 | `BV-D3-chayGL-bo-setEncoding` |
| D3 `chayTheoDoi` setEncoding (K4) | `thu_gia_lap` D3 | `BV-D3-theodoi-bo-setEncoding` |
| D4 neo `Lượt ` | `do_thoi_gian.js kb` | `BV-D4-neo-cu` |
| D4 lượt sập → thoát ≠ 0 (soát vòng 3) | `do_thoi_gian.js kb` | `VS-D4-luot-sap` |
| D4 lượt thoát ≠ 0 sau khi in đủ DO KB (bước 11) | `do_thoi_gian.js kb` | `VS-D4-luot-thoat-1` |
| D4 đếm DO KB = số KB của LUOT (lượt thoát 0 mà sót KB — bước 11) | `do_thoi_gian.js kb` | `VS-D4-luot-bo-kb` |
| Phép quét "bước 10" mọi file tu_chay/ (bước 11) | `thu_cong_cu` | `VS-C1-chu-thich-thu-cong-buoc-10` |
| Skill 11.4 LUÔN + hình thức dòng; 1.2 loại "??" (bước 11) | `thu_cong_cu` | `VS-SK-11-dieu-kien`, `VS-SK-12-bo-loai-hoi` |
| C2 một hàm `soCa(…, chiCa)`: bỏ màu · dòng CUỐI · phép → null (soát vòng 3) | `thu_cong` | `VS-C2-bo-mau`, `VS-C2-dong-dau`, `VS-C2-phep-khong-null` |

## Soát độc lập — vòng 2 (`/ra-soat`, agent độc lập mới, nguyên văn rút gọn dấu đầu dòng)

```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
- tu_chay/cong.js:213 và tu_chay/THIET_KE.md:873 — vòng sửa 1 dời HEAD ĐÃ KIỂM sang skill bước 11.4, nhưng thông báo ĐỎ của
  A19 vẫn bảo "(skill bước 10)" và THIET_KE B15 vẫn ghi "Skill bước 10 ghi dòng này" → máy làm theo thông báo thì lỗi vòng 1
  quay lại. Phép thu_cong_cu B15 không bắt câu sai. Lỗi do chính vòng sửa — K4.
- tu_chay/cong.js:209 — A19 hứa đọc dòng CUỐI (.pop()) nhưng không ca nào có hai dòng; đột biến .pop()→[0] SỐNG. Luồng thật
  (kiểm lại sau soát, thêm dòng mới) bị đe doạ — K3 + K5.
- tu_chay/cong.js:206 — vế ':(exclude).github/workflows/cong.yml' không được khoá; đột biến bỏ vế SỐNG; ke_hoach §8 khẳng định
  đã canh luồng "cài .claude/ + cong.yml" mà không có ca — K3 + K1.
NGHI NGỜ:
- cong.js:217–218 vế !coDong(khop[0]) gần như không tới được (cha chứa sẵn dòng ghi SHA của chính nó) — code chết, đột biến SỐNG.
- dot_bien.py VS-B1-khoLong-bo-dung-ngoai-kho mong TREO, không mẫu — bắt vì treo, không vì câu kết luận (K3).
- Skill 11.4 chỉ bảo chạy lại bước 6; KHOÁ là bài thu_*.js mới/sửa thì còn cần đỏ trên gốc + SỐ CA (A11/A16).
- Skill 1.2: cây bẩn nhảy sang 4 — "hai SHA" chưa có, chưa nói ghi gì.
- Lỗ có từ trước (Phát hiện 3): checkout -b viec/Y && git pull … được CHO.
- ke_hoach.md:153, :276 vẫn nói "skill bước 10" (hồ sơ lịch sử).
- Bảng "Chỗ vá → đột biến" thiếu VS-C1-skill-ghi-o-buoc-10.
NGHIỆM THU: 16/16 mục có bằng chứng (C1, E1 còn lỗi nội dung 1–3). Mục thiếu: không có.
CHƯA SOÁT ĐƯỢC: chưa chạy lại --day-du, dot_bien.py 22, TACH-GL 29, LUOI-1 80, D3 ×3; chưa fetch/pull thật qua proxy, skill
bước 1 trên phiên nạp bản cũ thật; lớp 1 chỉ thử merge-base; cổng thật trên GitHub (PR chấm bằng luật main 1.4.0).
BÀI HỌC:
- KHOÁ: thu_cong_cu — mọi chỗ ngoài skill nhắc HEAD ĐÃ KIỂM (cong.js, THIET_KE, MAU_PHIEU) không trỏ "bước 10".
- KHOÁ: ca thu_cong "hai dòng, dòng cuối đúng → ĐẠT" và "chủ quán cài đổi cong.yml sau lần kiểm → ĐẠT" + đột biến pop→[0], bỏ
  exclude cong.yml.
- NGUYÊN TẮC (K4): dời một bước quy trình → grep số bước đó trong thông báo lỗi, tài liệu, mẫu phiếu.
- NGUYÊN TẮC (K3/K5/K1): mỗi luồng hợp lệ kế hoạch liệt kê "không bị chặn" phải trỏ tới một ca + đột biến gỡ đúng vế ra BẮT.
```

### Đã sửa ở vòng 2

| Lỗi / nghi ngờ | Sửa |
|---|---|
| Thông báo A19 + THIET_KE B15 trỏ "bước 10" | Trỏ "bước 11.4"; phép `thu_cong_cu` "TU-CHAY-5 C1: cong.js / THIET_KE / MAU_PHIEU … không trỏ bước 10"; đột biến `VS-C1-thong-bao-buoc-10` |
| `.pop()` không có ca | Ca `thu_cong` "hai dòng HEAD ĐÃ KIỂM: dòng đầu cũ, dòng cuối đúng → ĐẠT"; đột biến `VS-C1-doc-dong-dau` |
| exclude `cong.yml` không có ca | Ca `thu_cong` "chủ quán cài đổi cả cong.yml sau lần kiểm → ĐẠT"; đột biến `VS-C1-khong-loai-cong-yml` |
| Vế `!coDong(khop[0])` chết | Bỏ vế, chú thích lý do (`cong.js`), THIET_KE nói đúng điều cổng kiểm |
| Đột biến mong TREO | Ca in-process đổi thành ca TIẾN TRÌNH THẬT (hạn 10 s) "git rm với cwd ngoài kho → [G0-NGOAI]"; đột biến khớp câu kết luận |
| Skill 11.4 thiếu bước 4 cho bài thử mới | Thêm "KHOÁ là bài thu_*.js mới / sửa thì làm cả bước 4" |
| Skill 1.2 cây bẩn | Thêm: ghi "không kéo: cây sửa dở" + SHA HEAD thay hai SHA |
| ke_hoach "bước 10" | Giữ — hồ sơ kế hoạch đã duyệt (lịch sử); bản sống là skill 11.4 |
| Bảng chỗ vá thiếu tên | Thêm 4 dòng (vòng 1 + vòng 2) |

## Soát độc lập — vòng 3 (`/ra-soat`, agent độc lập mới, nguyên văn rút gọn dấu đầu dòng)

```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
- tu_chay/cong.js:85–94 (soCaRieng, C2) — ba vế không ca nào giết (K3): X1 bỏ lọc mã màu → SỐNG; X2 đọc dòng ĐẦU (.reverse())
  → SỐNG; X3 bỏ "phép · chỗ hỏng → null" → SỐNG. Sáu ca C2 đều một dòng, không mã màu.
- viec/HOC-2/dot_bien.py:21, :23, :49 và viec/AUDIT-1/dot_bien.py:58 — PR làm rữa neo đột biến cũ đang BẮT, hồ sơ không ghi
  (K4). kiem_neo.py: gốc HOC-2 26/26, AUDIT-1 173/174 → HEAD 23/26, 172/174. VS-A16-dong-dau / VS-A16-bo-mau: soCaRieng chép
  nguyên dòng lọc màu → khớp 2 lần; A3-CCLA-them-la: neo "'SubagentHandback']);" gãy vì thêm TaskStop; VS-E3-phien-ban-cu: đổi
  1.5.0 (đương nhiên). Phiếu F đòi ghi rõ đột biến nào đổi mong đợi và vì sao.
- tu_chay/thu_cong.js:90 — chú thích còn "như skill bước 10 dặn"; phép "không trỏ bước 10" chỉ quét cong.js, THIET_KE, MAU_PHIEU (K4).
NGHI NGỜ:
- cong.js:215 khop.length !== 1 → === 0 SỐNG (SHA viết tắt mơ hồ — phòng thủ, không có ca).
- skill 11.4 viết theo điều kiện: bước 11 không đổi file ngoài viec/ thì không rõ có ghi HEAD ĐÃ KIỂM không (K5).
- git rm symlink đã theo dõi: ghiDuoc xét đích realpath, không xét đường link — lỗ lý thuyết (kho có 0 symlink được theo dõi).
- Skill 1.2 git status --short (hiện cả ??) lệch câu chữ với hook (git diff --quiet HEAD).
- trang_thai.md "cùng 925 ca (xem bằng chứng vòng 1)" — bằng chứng đã bị ghi đè, nay 924.
- C2 so số ca gốc với số ở head (không với dòng SỐ CA) — tương đương nhờ A16.
- do_thoi_gian.js kb không kiểm mã thoát từng lượt / số 29 — lượt sập thì in thiếu mà thoát 0.
NGHIỆM THU: 15/16 · thiếu F (đột biến cũ HOC-2 ×3, AUDIT-1 ×1 rữa neo không ghi); C2 còn lỗi nội dung.
CHƯA SOÁT ĐƯỢC: không chạy lại --day-du, npm test, dot_bien 25, TACH-GL 29, LUOI-1 80, D3 ×3, do_thoi_gian kb; không fetch/pull
thật (người gác đã cài là bản 1.4.0, chặn fetch); cổng thật trên GitHub; A19 + gộp main chờ chủ quán.
BÀI HỌC:
- KHOÁ: ca C2 mã màu / hai dòng tổng / "đạt·hỏng" rồi "phép·chỗ hỏng" + đột biến X1–X3; gộp soCaRieng vào soCa.
- KHOÁ: kiem_neo.py trên gốc và HEAD là bước bắt buộc của F khi sửa tu_chay/ hoặc cong_cu/; neo HỎNG mới → ghi trang_thai.
- NGUYÊN TẮC (K4): chép một khối code đã có đột biến neo → neo cũ khớp 2 lần và chết im lặng; grep viec/*/dot_bien.py trước khi chép.
- NGUYÊN TẮC (K4): phép tự quét "không còn câu cũ" phải quét mọi file trong Phạm vi, không chỉ danh sách đã biết.
```

### Đã sửa ở vòng 3 (vòng sửa cuối được phép — commit 92dcdb1)

| Lỗi / nghi ngờ | Sửa |
|---|---|
| `soCaRieng` 3 vế không ca giết + chép dòng lọc màu | Gộp vào MỘT hàm `soCa(ra, chiCa)`; 3 ca C2 mới (mã màu, hai dòng tổng, "đạt·hỏng" rồi "phép·chỗ hỏng"); đột biến `VS-C2-bo-mau`, `VS-C2-dong-dau`, `VS-C2-phep-khong-null` |
| Neo HOC-2 VS-A16 ×2 khớp 2 lần | Hết bản chép → khớp 1 lần (kiem_neo HOC-2 25/26); chạy lại hai đột biến (mục Số đo) |
| Neo AUDIT-1 A3-CCLA-them-la gãy | `TaskStop` đứng trước `SubagentHandback` → neo khớp lại (AUDIT-1 173/174 = như gốc); chạy lại đột biến |
| HOC-2 `VS-E3-phien-ban-cu` | Rữa TẤT YẾU (phiếu E3 đổi `tu-chay 1.4.0` → `1.5.0`; neo đọc đúng chuỗi phiên bản cũ) — đổi mong đợi: HỎNG neo, không chạy được; đề xuất việc sau đổi neo sang `tu-chay 1.5.0` (viec/HOC-2 ngoài Phạm vi) |
| AUDIT-1 `G3-sai-chuoi` | Rữa CÓ TỪ GỐC 5ad35ea (cố ý, phiếu D5 nêu) — không do PR |
| Chú thích `thu_cong.js` "bước 10"; phép chỉ quét 3 file | Sửa chú thích; phép quét MỌI file trực tiếp trong `tu_chay/` (trừ chính `thu_cong_cu.js`) |
| Skill 11.4 viết theo điều kiện | "LUÔN — đổi hay không — SAU lần kiểm cuối mới ghi" |
| Skill 1.2 "file đã theo dõi" | "có dòng KHÔNG mở đầu `??`", nêu hook `git diff --quiet HEAD` |
| `do_thoi_gian.js` lượt sập vẫn thoát 0 | Đếm dòng `DO KB` = số KB trong `LUOT`, thiếu → ném lỗi; đột biến `VS-D4-luot-sap` (bản sao `chay.js` cho lượt 2 thoát 2) |
| trang_thai "925 (xem bằng chứng vòng 1)" | Ghi rõ: vòng 1 925 = 925, sau vòng 2 924 = 924 (bằng chứng hiện tại) |
| `khop.length !== 1` không có ca | Giữ — phòng thủ (SHA 7 ký tự va chạm trong một PR); ghi CHƯA KIỂM |
| `git rm` symlink đã theo dõi | Ghi Phát hiện 5 (lỗ lý thuyết, kho 0 symlink theo dõi) |
| C2 so với số ở head | Tương đương nhờ A16 (SỐ CA = số ở head) — ghi rõ ở THIET_KE B15 đã nêu "số CA khác số ở head" |

## Soát độc lập — vòng 4 (`/ra-soat`, agent độc lập mới, HEAD 23814a0) — ĐẠT

```
ĐẠT
LỖI TÌM ĐƯỢC:  không có
NGHI NGỜ:
- viec/LUOI-1/do_thoi_gian.js:50–51 — chỉ đếm dòng DO KB, không xét mã thoát từng lượt; vòng 3 sửa một nửa ghi chú
  "mã thoát / số 29" (K4). Đột biến tự dựng: lượt 4 thoát 1 sau khi đã in DO KB → công cụ vẫn thoát 0.
- tu_chay/skill_lam_viec.md:87 ("LUÔN — đổi hay không") và :30 ("dòng KHÔNG mở đầu ??") — sửa bằng LỜI, không KHOÁ (C16);
  đột biến trả câu cũ → thu_cong_cu vẫn XANH (K3).
- Phép quét "bước 10" mở rộng sang mọi file tu_chay/ không có đột biến có tên trong dot_bien.py (thử tay: bắt được).
- tu_chay/cong.js:200 — A19 chỉ nhận dòng đúng dạng ^HEAD ĐÃ KIỂM: <sha>$; skill 11.4 không nói hình thức dòng (riêng dòng, không
  gạch đầu dòng / backtick, thêm ở CUỐI khi kiểm lại). Máy ghi lệch thì A19 đỏ — tự sửa được (K5 chữ nghĩa).
- trang_thai.md:277–283 — Phát hiện 5, 6 nằm dưới "### Đã sửa ở vòng 1", không trong "## Phát hiện".
- Giữ từ vòng 3: cong.js khop.length !== 1 không có ca (phòng thủ); git rm symlink (Phát hiện 5, 0 symlink theo dõi).
NGHIỆM THU: 16/16 (B1–B5, C1–C3, D1–D4, E1–E3, F) · mục thiếu: không. 14 ca A19, 9 ca C2, E1–E3 trong thu_cong_cu.
CHƯA SOÁT ĐƯỢC: chưa chạy lại đủ dot_bien.py 29 (chỉ 7 đột biến đổi ở vòng 3: 7/7 BẮT); TACH-GL, LUOI-1, D3 ×3 chưa chạy lại
(23814a0 chỉ đổi viec/TU-CHAY-5/); chưa fetch/pull thật, chưa chạy skill bước 1 trên phiên nạp bản cũ (người gác đang cài 1.4.0);
cổng thật trên GitHub; A19 trên PR thật sau khi chủ quán cài 1.5.0; mẫu nhận kết quả của các bộ đột biến (D5 dời AUDIT-2).
BÀI HỌC:
- KHOÁ: thu_cong_cu — skill 11.4 "LUÔN"/không điều kiện; skill 1.2 loại "??"; kèm đột biến trả câu cũ (C16).
- KHOÁ: đột biến có tên cho mỗi lần MỞ RỘNG phép tự quét, ghi vào bảng chỗ vá.
- NGUYÊN TẮC (K4): nghi ngờ có hai vế → bảng "Đã sửa" ghi từng vế: sửa hoặc lý do bỏ.
- NGUYÊN TẮC (K5): cổng đọc dòng theo mẫu chặt (^…$) → skill phải nói đúng hình thức dòng.
- BỎ: Phát hiện 5–6 lạc mục — lỗi trình bày một lần.
```

### Bước 11 — KHOÁ làm luôn (file trong Phạm vi) sau vòng 4

| Nghi ngờ vòng 4 | KHOÁ |
|---|---|
| do_thoi_gian chưa xét mã thoát từng lượt | `chay()` gom lượt thoát ≠ 0 → ném "lượt đo thoát ≠ 0"; đột biến `VS-D4-luot-thoat-1` (lượt 4 thoát 1 sau khi in đủ DO KB) |
| Skill 11.4 "LUÔN", 1.2 "??" chỉ là lời | Phép `thu_cong_cu` "TU-CHAY-5 C1 skill 11.4: … LUÔN … dòng riêng ở CUỐI file …" + "TU-CHAY-5 B4 skill 1.2"; đột biến `VS-SK-11-dieu-kien`, `VS-SK-12-bo-loai-hoi` |
| Phép quét "bước 10" mở rộng không có đột biến có tên | `VS-C1-chu-thich-thu-cong-buoc-10` |
| Skill không nói hình thức dòng HEAD ĐÃ KIỂM | Skill 11.4: "một dòng riêng ở CUỐI file, đúng nguyên dạng (không gạch đầu dòng, không backtick); kiểm lại thì thêm dòng mới" — có trong phép trên |
| Phát hiện 5, 6 lạc mục | Dời về `## Phát hiện` |

## Số đo lần kiểm CUỐI — nội dung 7beb982 (sau soát vòng 4 ĐẠT + KHOÁ / NGUYÊN TẮC bước 11; 11.10.2026, máy mây 4 lõi, RIÊNG)

`KHUON_LOI.md` (7beb982) ghi vào cây TRƯỚC khi đợt này tới `thu_cong_cu` / `npm test` / `--day-du`; sau 7beb982 chỉ đổi `viec/TU-CHAY-5/`.

| Lệnh | Thời gian | Kết quả |
|---|---|---|
| `node tu_chay/thu_nguoi_gac.js` | 8,6 s | 924/924 ca người gác · 179 phép khác · XANH |
| `node tu_chay/thu_cong.js` | 94,8 s | 318 phép · 0 chỗ hỏng |
| `node tu_chay/thu_cong_cu.js` | 4,6 s | 101 phép · 0 chỗ hỏng |
| `node cong_cu/thu_gia_lap.js` ×3 (lần 1 trong đợt đo, lần 2, 3 riêng) | 39,5 s (lần 1) | 130 đạt · 0 hỏng · cả 3 lần |
| `npm test` | — | PASS 59 · FAIL 0 · CẢNH BÁO 2 |
| `node kiem_tra_truoc_khi_giao.js --day-du` | 181,6 s | PASS 63 · FAIL 0 · CẢNH BÁO 2 |
| `node viec/LUOI-1/do_thoi_gian.js kb` | lượt 1–4: 22,5 · 21,8 · 22,9 · 24,1 s | thoát 0 · 29 dòng `DO KB` (công cụ tự kiểm mã thoát từng lượt + đếm 29) |
| `python3 viec/TU-CHAY-5/dot_bien.py -j 2` | 823 s | 33 · BẮT 32 · LẠC 1 (`VS-D4-luot-sap`: công cụ thoát ≠ 0 nhưng do phép MỚI "lượt thoát ≠ 0" bắt trước, mẫu cũ "chỉ n/29" không khớp — K2; sửa mẫu, thêm `VS-D4-luot-bo-kb` cho phép đếm) |
| `python3 viec/TU-CHAY-5/dot_bien.py VS-D4-luot-sap VS-D4-luot-bo-kb` | 181 s | BẮT 2/2 → cả bộ 34/34 đúng mong đợi |
| D3 (Q3) | — | `BV-D3` ×2 BẮT trong đợt 33 trên đây; 3 lần riêng trên 92dcdb1 (đều BẮT 2/2) — `thu_gia_lap.js` không đổi từ 92dcdb1 |
| `python3 viec/HOC-2b/kiem_neo.py` | vài giây | AUDIT-1 173/174 (HỎNG `G3-sai-chuoi` có từ gốc), HOC-2 25/26 (HỎNG `VS-E3-phien-ban-cu` tất yếu — Phát hiện 6), P26b 59/59, HOC-1 20/20, TU-CHAY-4 10/10, HOC-2b 26/26 |
| HOC-2 `VS-A16-dong-dau`, `VS-A16-bo-mau`; AUDIT-1 `A3-CCLA-them-la` | — | BẮT (chạy trên 92dcdb1; `cong.js`, `nguoi_gac.js` không đổi từ đó) |
| `python3 viec/TACH-GL/dot_bien.py -j 4` | 560 s | 29 · BẮT 29 · đúng mong đợi 29/29 |
| `python3 viec/LUOI-1/dot_bien.py -j 4` | 89 s | 80 · BẮT 79 · LẠC 1 (mong LẠC) · đúng mong đợi 80/80 |
| `python3 viec/TU-CHAY-5/chay_goc.py` (gốc 5ad35ea) | — | 4/4 bài ĐỎ: gác 799/924 · cổng 29 hỏng · công cụ 15 hỏng · giả lập 1 hỏng (T7c) |

Hai CẢNH BÁO của `npm test` / `--day-du` — đúng loại phiếu F miễn (bản cài `.claude/` lệch nguồn `tu_chay/`, chủ quán cài sau soát cuối):
- `.claude/tu_chay/ khớp từng byte với tu_chay/` — lệch: MAU_PHIEU.md, PHIEN_BAN, THIET_KE.md, cong.js, nguoi_gac.js,
  skill_lam_viec.md, thu_cong.js, thu_cong_cu.js, thu_nguoi_gac.js;
- `.claude/skills/lam-viec/SKILL.md khớp từng byte với tu_chay/skill_lam_viec.md` — lệch.

## Nghiệm thu — đếm (B, C, D1–D4, E, F; A1–A4, D5, D6 dời AUDIT-2)

| Mục | Bằng chứng |
|---|---|
| B1 | `thu_nguoi_gac` khối "TU-CHAY-5 B1" (ca CHO / GIT-RM / ghiDuoc từng vế) + ca git thật; đột biến BV-B1-bo-rm, VS-B1-rm-cho-moi-co, VS-B1-rm-mien-hoantac, VS-B1-rm-bo-khoLong, VS-B1-khoLong-bo-dung-ngoai-kho |
| B2 | `thu_nguoi_gac` "công cụ cho qua TaskStop" + khoá tập CONG_CU_DOC; BV-B2-bo-TaskStop |
| B3 | `thu_nguoi_gac` khối "TU-CHAY-5 B3" (CHO / GIT-KEO từng vế, nhánh, kho lồng, nháp, ngoài kho, HEAD tách rời, main, không phiếu); BV-B3-bo-keo, VS-B3-pull-thieu-ff-only, VS-B3-keo-moi-nhanh, VS-B3-keo-bo-khoLong |
| B4 | `thu_cong_cu` "TU-CHAY-5 B4 skill bước 1" ×3 + luật stop hook; `thu_nguoi_gac` "TU-CHAY-5 B4: mọi lệnh git ở bước 1 của skill → CHO" |
| B5 | `ke_hoach.md` mục 2 B5 + Phát hiện 1 |
| C1 | `thu_cong` 14 ca "TU-CHAY-5 A19" + vòng tắt A19 (6 ca); `thu_cong_cu` "TU-CHAY-5 C1 skill" + "TU-CHAY-5 C1: cong.js / THIET_KE / MAU_PHIEU"; BV-C1-bo-A19, VS-C1-tinh-ca-commit-ho-so, VS-C1-commit-nay-moi-noi, VS-C1-khong-loai-claude, VS-C1-skill-ghi-o-buoc-10, VS-C1-doc-dong-dau, VS-C1-khong-loai-cong-yml, VS-C1-thong-bao-buoc-10 |
| C2 | `thu_cong` 9 ca "TU-CHAY-5 C2"; BV-C2-bo-canh-bao, VS-C2-so-ca-phep, VS-C2-bo-mau, VS-C2-dong-dau, VS-C2-phep-khong-null |
| C3 | `thu_cong_cu` "TU-CHAY-5 C3/E1 THIET_KE B15" (A18 không chạy đột biến) |
| D1 | `thu_gia_lap` T7c (đỏ trên gốc) + T7a/T7b có IPC; BV-D1-bo-ipc |
| D2 | `thu_gia_lap` D2 (`/dev/fd/3`); BV-D2-bo-dung-het-3 |
| D3 | `thu_gia_lap` D3 chayGL + chayTheoDoi; BV-D3 ×2 BẮT 3/3 lần |
| D4 | `node viec/LUOI-1/do_thoi_gian.js kb` → 29 dòng DO KB (gốc ném lỗi neo); BV-D4-neo-cu, VS-D4-luot-sap |
| E1 | `thu_cong_cu` "TU-CHAY-5 E1" ×4 |
| E2 | `thu_cong_cu` "TU-CHAY-5 E2 KHUON_LOI" + F3 ≤ 120 dòng (KHUON_LOI.md 98 dòng) |
| E3 | `thu_cong_cu` "TU-CHAY-5 E3" ×2; `thu_nguoi_gac` "PHIEN_BAN = tu-chay 1.5.0" |
| F | mục Số đo trên HEAD (trên) + `bang_chung_do.txt`; đột biến cũ: TACH-GL 29/29, LUOI-1 80/80, HOC-2 VS-A16 ×2 và AUDIT-1 A3-CCLA chạy lại BẮT; đổi mong đợi: HOC-2 `VS-E3-phien-ban-cu` (neo `tu-chay 1.4.0` hết khớp vì E3 — Phát hiện 6) |

16/16 mục có bằng chứng. Ca đỏ trước của nhóm B, C, D: `bang_chung_do.txt`, chạy lại bằng `python3 viec/TU-CHAY-5/chay_goc.py`.

## Đang ở

XONG — dừng. Không merge, không tạo PR. Chủ quán: chạy script cài trên nhánh (Q1), rồi soát cuối.

## Phát hiện

1. **`tu_chay/cai_thu_vien.sh` im lặng khi HEAD tách rời** (ngoài Phạm vi — chủ quán duyệt Q6: chỉ ghi, kèm đề xuất).
   `cai_thu_vien.sh:15–34`: `case "$nhanh" in viec/?*) … ;; esac` — HEAD tách rời (hoặc nhánh khác) thì không có nhánh `*)`,
   hook không in gì, không kéo. Bằng chứng phiên này: `.git/logs/HEAD` dòng 1 clone ra HEAD tách rời ở `5ad35ea`, dòng 2
   `checkout: moving from 5ad35ea… to viec/TU-CHAY-5` — môi trường đặt nhánh SAU khi nạp; nếu hook chạy trước bước đặt nhánh thì
   máy không biết phiên nạp bản cũ (một giả thuyết cho TACH-GL `2237259`, chưa kiểm được). Fetch hỏng chỉ in `⚠`.
   **Đề xuất sửa** (việc sau, ghi đúng tên `tu_chay/cai_thu_vien.sh` + `tu_chay/thu_cong_cu.js` trong Phạm vi):
   - thêm nhánh `*) echo "⚠ kéo nhánh: không đứng ở viec/* (${nhanh:-HEAD tách rời}) — KHÔNG kéo, máy tự kéo ở bước 1 của /lam-viec" ;;`;
   - ca thử trong `baiKeoNhanh` (`thu_cong_cu.js:227`): kho máy đứng HEAD tách rời → dòng ⚠ có mặt (đỏ trên gốc: không in gì).
   Skill bước 1 mới (B4) đã xử lý hậu quả: máy tự fetch + đi-trước-nhanh, ghi hai SHA.

2. **`viec/TACH-GL/do_chia.js:44–45`, `viec/TACH-GL/do_chia_e2.js:48–49`** (ngoài Phạm vi) cộng Buffer đầu ra con
   (`ra += d`) không `setEncoding` — cùng khuôn D3 (K4). Đề xuất: thêm `setEncoding('utf8')` khi việc sau đụng hai công cụ này.
3. **Người gác đọc nhánh TRƯỚC lệnh ghép** (khuôn có từ trước với push): `git checkout -b viec/Y && git pull --no-rebase
   --ff-only origin viec/TU-CHAY-5` được CHO (nhánh đọc lúc xét là viec/TU-CHAY-5) → pull vào nhánh mới viec/Y. Hậu quả nhỏ
   (Y vừa tách từ X, `--ff-only`). Đề xuất (việc sau): `checkout -b` trong cùng lệnh ghép với push/fetch/pull → chặn.
4. **A19 và "Update branch" / gộp main** (thiết kế có chủ ý, `ke_hoach.md` mục C1, có ca thử): mọi lần gộp main vào nhánh
   SAU lần kiểm làm A19 đỏ tới khi máy kiểm lại và ghi lại dòng `HEAD ĐÃ KIỂM`. Main có commit TIEN-DO thường xuyên — chủ quán
   cân nhắc: gộp main TRƯỚC khi máy kiểm cuối, hoặc chấp nhận một lượt kiểm lại sau mỗi lần gộp.
5. **`git rm` một symlink đã theo dõi** (soát vòng 3): `ghiDuoc` xét đích sau realpath (`nguoi_gac.js` `thuc`), không xét chính
   đường link — link NGOÀI Phạm vi trỏ vào file TRONG Phạm vi sẽ được CHO xoá. Hiện kho có 0 symlink được theo dõi
   (`git ls-files -s`, chế độ 120000) và máy không tạo được link ngoài Phạm vi → lỗ lý thuyết. Đề xuất (việc sau): rm xét
   `lstat` — đường là symlink thì xét chính đường link.
6. **HOC-2 `VS-E3-phien-ban-cu`** neo `tu-chay 1.4.0` rữa tất yếu vì E3 đổi phiên bản — việc sau đổi neo sang `tu-chay 1.5.0`
   (viec/HOC-2/dot_bien.py ngoài Phạm vi).

## Soát độc lập — vòng 1 (`/ra-soat`, agent độc lập, nguyên văn)

```
KHÔNG ĐẠT

LỖI TÌM ĐƯỢC:
- Skill tự làm A19 đỏ — K5 + K4. tu_chay/skill_lam_viec.md:72–74 (bước 10) ghi HEAD ĐÃ KIỂM; bước 11 (:80–87) bảo làm
  KHOÁ / NGUYÊN TẮC (KHUON_LOI.md) rồi commit, push → file ngoài viec/<MÃ>/ đổi sau SHA → cổng ĐỎ "[A19] … cũ hơn commit …"
  (cong.js:206, 213–214). Chưa có phép trong thu_cong_cu canh thứ tự này. Sửa: chuyển dòng ra sau bước 11 (hoặc chạy lại
  bước 6 rồi ghi lại), kèm phép thu_cong_cu.
- C2 tự báo oan trên chính số liệu việc này — K8 chiều ngược / K3. thu_nguoi_gac.js:265–272 sinh ca B4 theo nội dung bước 1
  của skill (gốc 2 lệnh, head 8) → gốc 927 ca, head 933 → "CẢNH BÁO A16 … 927 ≠ 933" dù bài không dừng sớm.
  ke_hoach.md Q5 cho rằng nhiễu chỉ ở "phép khác" — sai.
- K1 — THIET_KE.md:395–397 nói số đo ở trang_thai.md nhưng trang_thai.md không có số đo; "41,7 s" đo trên GỐC (126 đạt);
  "từng lượt 22–24 s" không có trong hồ sơ; vừa nói "không chép số" vừa chép số.
- Nghiệm thu F chưa có bằng chứng trong hồ sơ: npm test / --day-du + hai cảnh báo "khớp từng byte"; thu_gia_lap ×3;
  TACH-GL 29/29, LUOI-1 80/80 trên HEAD; kết quả dot_bien.py của việc; D3 ×3 từng lần (Q3); ca đỏ trước + lệnh chạy lại.

NGHI NGỜ:
- Tên ca D2 (thu_gia_lap.js:352–354) "mọi lượt dừng" nói nhiều hơn máy kiểm — lượt nào cũng tự từ chối; vòng SIGTERM của
  dungHet chưa được thử ở ca này.
- `git checkout -b viec/Y && git pull … origin viec/TU-CHAY-5` được CHO (nhánh đọc trước lệnh ghép) — khuôn có từ trước với push.
- A19 + "Update branch": mọi lần gộp main sau lần kiểm → cổng đỏ (có chủ ý, chưa hỏi chủ quán).
- K4 ngoài Phạm vi: viec/TACH-GL/do_chia.js:44–45, do_chia_e2.js:48–49 cộng Buffer, chưa ghi Phát hiện.
- thu_nguoi_gac.js:739 thêm setEncoding nhưng không ca / đột biến nào bắt nếu gỡ.
- KHUON_LOI.md:35–37 gạch TACH-GL chen giữa gạch "con số đạt…" và câu nối tiếp "Lỗi thất thường…".

NGHIỆM THU: 15/16 mục có bằng chứng · thiếu: F (D3 thiếu ghi từng lần theo Q3).
CHƯA SOÁT ĐƯỢC: chưa chạy lại TACH-GL 29 / LUOI-1 80, thu_gia_lap ×3; chưa thử fetch/pull thật qua proxy, skill bước 1 trên
phiên nạp bản cũ thật; cổng thật trên GitHub (PR này chấm bằng cổng main). server/, client/, package.json, .claude/ không đổi.
BÀI HỌC:
- KHOÁ: phép thu_cong_cu canh thứ tự bước 10/11 của skill (mọi bước ghi file ngoài viec/<MÃ>/ phải TRƯỚC HEAD ĐÃ KIỂM).
- KHOÁ: số ca bài thử không phụ thuộc nội dung file dữ liệu (gộp vòng B4 thành một chac).
- NGUYÊN TẮC (K3): so số ca gốc/head chỉ có nghĩa khi số ca không sinh từ dữ liệu PR sửa; đối chiếu số gốc với SỐ CA trước khi ghi.
- NGUYÊN TẮC (K1/K4): tài liệu trỏ "số đo ở trang_thai.md" thì phải ghi số đó vào trang_thai.md, đo trên HEAD.
```

### Đã sửa ở vòng 1 (commit 455b169)

| Lỗi / nghi ngờ | Sửa |
|---|---|
| Skill bước 10 ghi HEAD ĐÃ KIỂM trước bước 11 | Dòng chuyển vào bước 11.4, sau KHOÁ / NGUYÊN TẮC và "chạy lại bước 6"; phép mới trong `thu_cong_cu` (bước 10 không có dòng, bước 11 có sau KHOÁ/NGUYÊN TẮC); đột biến `VS-C1-skill-ghi-o-buoc-10` |
| Số ca `thu_nguoi_gac` theo nội dung skill (927 ≠ 933) | Vòng B4 gộp thành MỘT phép `chac`; gốc / head cùng số ca (vòng 1: 925 = 925; sau vòng 2: 924 = 924 — `bang_chung_do.txt`) |
| THIET_KE chép số | Bỏ số; trỏ `trang_thai.md` của TU-CHAY-5 (mục "Số đo trên HEAD" dưới) |
| F thiếu hồ sơ | Mục "Nghiệm thu — đếm" + "Số đo trên HEAD" dưới |
| Tên ca D2 | "mọi lượt đóng ≠ 0" + chú thích: vòng SIGTERM do T3/T4/T6 canh |
| KHUON_LOI thứ tự gạch | Gạch TACH-GL đặt sau câu "Lỗi thất thường…" |
| Phát hiện K4 / nhánh / A19 + gộp main | Phát hiện 2–4 |
| `thu_nguoi_gac.js` setEncoding ở `choTreo` không có ca | Ghi CHƯA KIỂM (đầu ra người gác là JSON ngắn; không dựng được ca cắt khúc tất định) |

## Câu hỏi

(Q1–Q7 của `ke_hoach.md` mục 9 đã được trả lời ở lời duyệt.)

## Bài học

Sự cố của việc (bước 11.1):
- Soát độc lập: 4 vòng — vòng 1–3 KHÔNG ĐẠT, vòng 4 ĐẠT (dùng đủ 3 vòng sửa). Hai lỗi do CHÍNH vòng sửa gây ra (vòng 2: thông báo
  A19 còn "bước 10"; vòng 3 phát hiện vòng 2 chép khối lọc màu làm rữa neo HOC-2). Mẫu đột biến của chính việc LẠC/HỎNG 3 lần
  sau khi đổi tên phép / bỏ vế / thêm phép chặn trước (`VS-C1-commit-nay-moi-noi`, `VS-C1-thong-bao-buoc-10`, `VS-D4-luot-sap`).
- Người gác chặn 34 lệnh trong phiên (kể cả agent phụ): B-CHUONGTRINH 10 (`until`, `while`, `nproc`, `ps`), B-BIMAT-CHU 6
  (`ps e`…), B-PHANTICH 5 (`$(( ))`, `$'…'`, `:(glob)` không nháy), GIT-LENH 3 (`git remote`, `git reflog`, `git fetch` — bản
  1.4.0 đang cài), B-CD-VITRI 3, B-MANOI 3 (heredoc / `node -e` nhắc file bảo vệ → chuyển sang script trong nháp), B-DICHCHU 2,
  SED-I 1, CC-LA 1. Không lệnh nào lách; mọi chỗ làm theo lý do người gác.
- Kế hoạch: agent soát kế hoạch bắt 13 điểm (FIFO không tất định → `/dev/fd/3`; A19 chặn commit cài `.claude/`…).

| Bài | Ngăn | Lý do / chỗ |
|---|---|---|
| Skill ghi HEAD ĐÃ KIỂM trước bước 11 (vòng 1) | **KHOÁ** (đã làm) | `thu_cong_cu` "C1 skill … bước 10 không ghi" + đột biến `VS-C1-skill-ghi-o-buoc-10` |
| Số ca bài thử sinh từ nội dung skill (vòng 1) | **KHOÁ** (đã làm) + **NGUYÊN TẮC** | B4 gộp một phép; `KHUON_LOI.md` K3 "(TU-CHAY-5) số ca không SINH từ file PR sửa" |
| Thông báo cổng / tài liệu / chú thích còn "bước 10" (vòng 2, 3) | **KHOÁ** (đã làm) + **NGUYÊN TẮC** | `thu_cong_cu` quét MỌI file `tu_chay/`; `VS-C1-thong-bao-buoc-10`, `VS-C1-chu-thich-thu-cong-buoc-10`; K4 "(TU-CHAY-5) grep khắp nơi" |
| Vế phép mới không có ca giết (`.pop()`, `cong.yml`, 3 vế C2, mã thoát D4) | **KHOÁ** (đã làm) + **NGUYÊN TẮC** | ca + đột biến có tên cho từng vế; K3 "(TU-CHAY-5) mỗi luồng 'không bị chặn' trỏ tới một ca + đột biến" |
| Chép khối code làm rữa neo đột biến cũ (vòng 3) | **NGUYÊN TẮC** (đã ghi) + đề xuất KHOÁ ngoài Phạm vi | K4 "(TU-CHAY-5) … `kiem_neo.py` trên gốc và HEAD". Đề xuất (AUDIT-2, cùng D5): `tu_chay/lenh_ra_soat.md` + skill bước 6 đòi chạy `python3 viec/HOC-2b/kiem_neo.py` và ghi neo HỎNG mới; ca đỏ: PR có neo khớp 2 lần |
| Sửa câu skill bằng LỜI (vòng 4) | **KHOÁ** (đã làm) | `thu_cong_cu` "skill 11.4 LUÔN …", "skill 1.2 …"; `VS-SK-11-dieu-kien`, `VS-SK-12-bo-loai-hoi` |
| Mẫu đột biến của chính việc lạc sau khi đổi phép | **NGUYÊN TẮC** (gộp vào K4 TU-CHAY-5: "đổi tên một phép → grep … mẫu + neo `viec/*/dot_bien.py`") | 3 lần trong việc này |
| Hình thức dòng HEAD ĐÃ KIỂM (cổng đọc `^…$`) | **KHOÁ** (đã làm) | skill 11.4 + phép `thu_cong_cu` "dòng riêng ở CUỐI file" |
| Phát hiện lạc mục trong trang_thai | **BỎ** | lỗi trình bày một lần |
| Lệnh bị người gác chặn (`until`, `ps`, heredoc nhắc file bảo vệ) | **BỎ** | luật đúng ý; đã có đường thay (script trong nháp, Monitor/notification); không lách |

Dọn (bước 11.3): lời dặn K3 "con số 'đạt' phải kèm lần chạy lại trên HEAD" nay có cổng A16 + A19 làm thay một phần (số ca, SHA đã
kiểm) — ĐỀ XUẤT rút gọn câu đó ở việc sau (không tự xoá). `KHUON_LOI.md` 104 dòng ≤ 120.

## Báo cáo 7 mục

```
VIỆC:        TU-CHAY-5 — siết lưới bất biến, vá lỗ người gác / cổng / công cụ, máy tự nhận nhánh có commit mới
             (nhóm A, D5, D6 DỜI sang AUDIT-2 theo lời chốt chủ quán 11.10)
ĐÃ SỬA:      tu_chay/nguoi_gac.js — B1 git rm [-q] <file…> (GIT-RM, xetHoanTac dùng chung, ghiDuoc như SỬA file, khoLong);
               B2 TaskStop cho qua; B3 git fetch [-q] / git pull --no-rebase --ff-only [-q] origin viec/<MÃ> (GIT-KEO, xetDongBo
               chung với push; khoLong dừng ngoài kho)
             tu_chay/cong.js — C1 A19 HEAD ĐÃ KIỂM (rev-list theo đồ thị; loại .claude/ + cong.yml; dạng "+ commit này");
               C2 CẢNH BÁO A16 số CA gốc ≠ head (soCa một hàm, chiCa)
             tu_chay/skill_lam_viec.md — B4 bước 1 fetch → so FETCH_HEAD → pull --ff-only, hai SHA; luật stop hook; C1 11.4
             cong_cu/gia_lap/chay.js — D1 --kho chỉ qua IPC (dòng riêng)
             cong_cu/thu_gia_lap.js — D1 T7c, D2 /dev/fd/3, D3 setEncoding (chayGL, chayTheoDoi) + ca
             viec/LUOI-1/do_thoi_gian.js — D4 chạy từng lượt, neo "Lượt ", kiểm mã thoát + đếm 29 DO KB
             tu_chay/thu_nguoi_gac.js, thu_cong.js, thu_cong_cu.js — ca B/C/E; tu_chay/THIET_KE.md, MAU_PHIEU.md, PHIEN_BAN 1.5.0,
               KHUON_LOI.md — E1–E3
BÀI THỬ:     chạy trên gốc 5ad35ea (chay_goc.py, như cổng A11) → ĐỎ: gác 799/924 · cổng 29 hỏng · công cụ 15 hỏng · giả lập T7c;
             sau khi vá → XANH: 924/924 + 179 · 318 · 101 · 130. D2, D3 ca hồi quy (xanh trên gốc) — bằng chứng là đột biến.
             Đột biến của việc 34/34 đúng mong đợi; D3 BẮT 3/3 lần (Q3).
ĐÃ RÀ K4:    grep "ra += d" trong thu_gia_lap.js, thu_nguoi_gac.js → 3 chỗ (chayGL, chayTheoDoi, choTreo), đã xử lý; ngoài Phạm vi
             viec/TACH-GL/do_chia*.js → Phát hiện 2. grep "khoLong|laCon(d, nc.goc)" → push/fetch/pull/rm chung một hàm;
             GIT-COMMIT-NHANH cố ý không. grep "HEAD ĐÃ KIỂM.*bước 10" mọi file tu_chay/ → 0 (phép thu_cong_cu canh).
             kiem_neo.py → neo cũ về như gốc trừ VS-E3-phien-ban-cu (tất yếu, Phát hiện 6).
CHƯA KIỂM:   - git fetch / git pull THẬT qua proxy máy mây, và skill bước 1 trên một phiên nạp bản cũ thật — người gác đang cài
               là 1.4.0 (chặn fetch); chỉ kiểm bằng xet() + git merge-base thật.
             - Cổng A19 / C2 trên PR thật GitHub: PR này chấm bằng luật main 1.4.0; A8 đỏ tới khi chủ quán cài trên nhánh (Q1).
             - cong.js khop.length !== 1 (SHA viết tắt mơ hồ) — phòng thủ, không có ca.
             - setEncoding ở choTreo (thu_nguoi_gac.js) — không dựng được ca cắt khúc tất định (đầu ra JSON ngắn).
             - D3 dựa trên khe 300 ms (Q3) — không tất định tuyệt đối; khúc gộp thì ca xanh oan, không đỏ oan.
             - git rm một symlink đã theo dõi (Phát hiện 5) — lỗ lý thuyết, kho 0 symlink theo dõi.
             - Vì sao phiên TACH-GL nạp 2237259: chưa rõ (B5) — B4 xử lý hậu quả.
GIT:         commit cuối đổi file ngoài viec/TU-CHAY-5/: 7beb982; commit hồ sơ này ở trên nó (git log --oneline -2 in trong
             câu trả lời). Không merge, không PR.
BÀI HỌC:     KHOÁ 6 · NGUYÊN TẮC 3 · BỎ 2 — chi tiết ở ## Bài học
```

HEAD ĐÃ KIỂM: 7beb982
