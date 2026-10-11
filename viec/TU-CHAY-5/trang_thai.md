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

## Số đo trên HEAD 92dcdb1 (sau soát vòng 3 — vòng sửa cuối; 11.10.2026, máy mây 4 lõi, chạy RIÊNG lần lượt)

| Lệnh | Thời gian | Kết quả |
|---|---|---|
| `node tu_chay/thu_nguoi_gac.js` | 8,0 s | 924/924 ca người gác · 179 phép khác · XANH |
| `node tu_chay/thu_cong.js` | 94,3 s | 318 phép · 0 chỗ hỏng |
| `node tu_chay/thu_cong_cu.js` | 4,3 s | 99 phép · 0 chỗ hỏng |
| `node cong_cu/thu_gia_lap.js` ×3 (lần 1 trong đợt đo, lần 2, 3 riêng) | 39,9 s (lần 1) | 130 đạt · 0 hỏng · cả 3 lần |
| `npm test` | — | PASS 59 · FAIL 0 · CẢNH BÁO 2 |
| `node kiem_tra_truoc_khi_giao.js --day-du` | 178,6 s | PASS 63 · FAIL 0 · CẢNH BÁO 2 |
| `node viec/LUOI-1/do_thoi_gian.js kb` | lượt 1–4: 22,7 · 21,7 · 22,6 · 23,9 s | thoát 0 · 29 dòng `DO KB` (công cụ nay tự đếm 29) |
| `python3 viec/TU-CHAY-5/dot_bien.py -j 2` | 795 s | 29 · BẮT 28 · LẠC 1 (`VS-C1-thong-bao-buoc-10`: bài ĐỎ đúng phép, nhưng mẫu còn tìm TÊN CŨ của phép đã đổi ở vòng 3 — K2; sửa mẫu) |
| `python3 viec/TU-CHAY-5/dot_bien.py VS-C1-thong-bao-buoc-10 VS-C1-skill-ghi-o-buoc-10` (mẫu mới) | 8 s | BẮT 2/2 → cả bộ 29/29 đúng mong đợi |
| `python3 viec/TU-CHAY-5/dot_bien.py 'BV-D3*'` lần 2, lần 3 (Q3) | 87 s, 91 s | lần 1 (trong đợt 29): BẮT 2/2 · lần 2: BẮT 2/2 · lần 3: BẮT 2/2 |
| `python3 viec/HOC-2/dot_bien.py VS-A16-dong-dau VS-A16-bo-mau` | 18 s | cả hai ĐỎ đúng chỗ (neo khôi phục ở vòng 3) |
| `python3 viec/AUDIT-1/dot_bien.py A3-CCLA-them-la` | — | BẮT 1 (neo khôi phục ở vòng 3) |
| `python3 viec/HOC-2b/kiem_neo.py` | vài giây | HEAD: AUDIT-1 173/174 (HỎNG `G3-sai-chuoi` — có từ gốc), HOC-2 25/26 (HỎNG `VS-E3-phien-ban-cu` — tất yếu, E3 đổi phiên bản; Phát hiện 6), P26b 59/59, HOC-1 20/20, TU-CHAY-4 10/10, HOC-2b 26/26. Gốc 5ad35ea (soát vòng 3 đo): AUDIT-1 173/174, HOC-2 26/26 |
| `python3 viec/TACH-GL/dot_bien.py -j 4` | 556 s | 29 · BẮT 29 · đúng mong đợi 29/29 |
| `python3 viec/LUOI-1/dot_bien.py -j 4` | 91 s | 80 · BẮT 79 · LẠC 1 (mong LẠC) · đúng mong đợi 80/80 |
| `python3 viec/TU-CHAY-5/chay_goc.py` (gốc 5ad35ea) | — | 4/4 bài ĐỎ: gác 799/924 · cổng 29 hỏng · công cụ 13 hỏng · giả lập 1 hỏng (T7c) |

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

Bước 8 — soát độc lập vòng 4 (sau vòng sửa 3 — vòng sửa cuối được phép; KHÔNG ĐẠT nữa thì ghi Câu hỏi và dừng).

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

5. **`git rm` một symlink đã theo dõi** (soát vòng 3): `ghiDuoc` xét đích sau realpath (`nguoi_gac.js` `thuc`), không xét chính
   đường link — link NGOÀI Phạm vi trỏ vào file TRONG Phạm vi sẽ được CHO xoá. Hiện kho có 0 symlink được theo dõi
   (`git ls-files -s`, chế độ 120000) và máy không tạo được link ngoài Phạm vi → lỗ lý thuyết. Đề xuất (việc sau): rm xét
   `lstat` — đường là symlink thì xét chính đường link.
6. **HOC-2 `VS-E3-phien-ban-cu`** neo `tu-chay 1.4.0` rữa tất yếu vì E3 đổi phiên bản — việc sau đổi neo sang `tu-chay 1.5.0`
   (viec/HOC-2/dot_bien.py ngoài Phạm vi).

## Câu hỏi

(Q1–Q7 của `ke_hoach.md` mục 9 đã được trả lời ở lời duyệt.)
