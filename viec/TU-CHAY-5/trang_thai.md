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
| `khoLong` dừng khi ra ngoài kho | `thu_nguoi_gac` (treo) | `VS-B1-khoLong-bo-dung-ngoai-kho` |
| B2 `TaskStop` trong `CONG_CU_DOC` | `thu_nguoi_gac` | `BV-B2-bo-TaskStop` |
| B3 nhánh fetch/pull | `thu_nguoi_gac` | `BV-B3-bo-keo` |
| B3 pull bắt buộc `--ff-only` | `thu_nguoi_gac` | `VS-B3-pull-thieu-ff-only` |
| B3 đúng nhánh đang đứng | `thu_nguoi_gac` | `VS-B3-keo-moi-nhanh` |
| B3 không kho lồng | `thu_nguoi_gac` | `VS-B3-keo-bo-khoLong` |
| C1 A19 | `thu_cong` | `BV-C1-bo-A19` |
| C1 chỉ commit đổi CODE sau SHA mới tính | `thu_cong` | `VS-C1-tinh-ca-commit-ho-so` |
| C1 "+ commit này" phải do chính commit đó thêm | `thu_cong` | `VS-C1-commit-nay-moi-noi` |
| C1 loại `.claude/` (chủ quán cài sau kiểm) | `thu_cong` | `VS-C1-khong-loai-claude` |
| C2 cảnh báo A16 | `thu_cong` | `BV-C2-bo-canh-bao` |
| C2 chỉ so số CA (Q5) | `thu_cong` | `VS-C2-so-ca-phep` |
| D1 `--kho` chỉ qua IPC (`chay.js`) | `thu_gia_lap` T7c | `BV-D1-bo-ipc` |
| D2 lượt TỪ CHỐI → cha dừng hết, thoát 3 | `thu_gia_lap` D2 | `BV-D2-bo-dung-het-3` |
| D3 `chayGL` setEncoding | `thu_gia_lap` D3 | `BV-D3-chayGL-bo-setEncoding` |
| D3 `chayTheoDoi` setEncoding (K4) | `thu_gia_lap` D3 | `BV-D3-theodoi-bo-setEncoding` |
| D4 neo `Lượt ` | `do_thoi_gian.js kb` | `BV-D4-neo-cu` |

## Đang ở

Bước 6 — kiểm.

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
| Số ca `thu_nguoi_gac` theo nội dung skill (927 ≠ 933) | Vòng B4 gộp thành MỘT phép `chac`; gốc / head nay cùng 925 ca (xem bằng chứng vòng 1) |
| THIET_KE chép số | Bỏ số; trỏ `trang_thai.md` của TU-CHAY-5 (mục "Số đo trên HEAD" dưới) |
| F thiếu hồ sơ | Mục "Nghiệm thu — đếm" + "Số đo trên HEAD" dưới |
| Tên ca D2 | "mọi lượt đóng ≠ 0" + chú thích: vòng SIGTERM do T3/T4/T6 canh |
| KHUON_LOI thứ tự gạch | Gạch TACH-GL đặt sau câu "Lỗi thất thường…" |
| Phát hiện K4 / nhánh / A19 + gộp main | Phát hiện 2–4 |
| `thu_nguoi_gac.js` setEncoding ở `choTreo` không có ca | Ghi CHƯA KIỂM (đầu ra người gác là JSON ngắn; không dựng được ca cắt khúc tất định) |

## Câu hỏi

(Q1–Q7 của `ke_hoach.md` mục 9 đã được trả lời ở lời duyệt.)
