# SAOLUU-DEM-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (15.11.2026)
- Lần 1: nhánh `viec/SAOLUU-DEM-1`; cây sạch; HEAD = FETCH_HEAD = `2f40a7b` (không cần kéo). Kho nông (`is-shallow-repository` = true) → đã `git fetch --unshallow` (chỉ tải lịch sử) để phép G1 của `thu_BH2.js` tìm được commit `cbbb809` — không do code của việc này.
- Lần 2 (`tiep`, sau câu trả lời chủ quán): HEAD `4e8e5b9` là tổ tiên của FETCH_HEAD `8b18dea` → `git pull --ff-only` → `8b18dea`.
- `git log --oneline -3` lúc làm tiếp:
  - 8b18deab PHIEU: SAOLUU-DEM-1 tra loi cau hoi B1 (them settings.js vao Pham vi, khoa rieng khong xuat / khong khoi phuc) — chu quan 15.11
  - 4e8e5b90 SAOLUU-DEM-1: ghi Câu hỏi — B1 cần sửa settings.js (ngoài Phạm vi)
  - 2f40a7bf PHIEU: SAOLUU-DEM-1

## Câu hỏi (đã được chủ quán trả lời 15.11 — chép ở phiếu, `8b18dea`)
B1 cần sửa `server/routes/settings.js` (ngoài Phạm vi lúc đầu): chủ quán ĐỒNG Ý đề xuất, thêm file vào Phạm vi, và giao LÀM LUÔN phần phát hiện (xuất không chứa dòng khoá, khôi phục bỏ qua dòng khoá). Đã làm đúng như vậy.

## Kế hoạch
`viec/SAOLUU-DEM-1/ke_hoach.md` (phương án A chọn; phiếu không đòi duyệt kế hoạch).

## Bài thử đỏ
`bang_chung_do.txt`: bản chưa vá (git archive `8b18dea`) → `cong_cu/thu_SAOLUUDEM1.js` **3 đạt · 35 hỏng**; bản đã vá → **38 đạt · 0 hỏng**. SỐ CA = 38 ở cả hai.

## Bảng chỗ vá → đột biến (`viec/SAOLUU-DEM-1/dot_bien.py`, 55 đột biến, 55 BẮT · 0 SỐNG · 0 HỎNG · 0 LẠC; có ĐỐI CHỨNG xanh trước)
| Chỗ vá | Đột biến |
|---|---|
| A1 một hàm dựng tệp `dungTepSaoLuu` (backup.js) | VS-TEP-RIENG · VS-EXPORT-ALL-RIENG |
| C1–C2 so băm + câu 401 chung (khoaSaoLuuPos.js `khoaDung`, backup.js `/tu-dong`) | VS-KHONG-SO-BAM · VS-SO-BANG · VS-401-KHAC-CAU · VS-401-MA-KHAC · VS-KHOA-TRONG-QUERY · VS-VE-POS-QUA-CUA |
| B1 khoá `posk_` 32 byte, chỉ băm, một khoá | VS-KHOA-NGAN · VS-TIEN-TO-SAI · VS-LUU-KHOA-THO · VS-BAM-MD5 · VS-TAO-KHONG-THAY · BV-TRANG-THAI-LO-BAM |
| B2 chỉ chủ quán + PIN, thu hồi ngay | BV-CHI-CHU-QUAN · BV-PIN-TAO · BV-PIN-THU-HOI · BV-THU-HOI · VS-THU-HOI-LAN-HAI-200 |
| C4 trần 6 lần / giờ / IP (đúng lẫn sai) | BV-CHAN-LUOT · VS-TRAN-7 · VS-TRAN-5 · VS-LUOT-CHI-KHOA-SAI · VS-LUOT-THEO-KHOA |
| C5 lần lấy gần nhất + log không chứa khoá | BV-GHI-LAN-LAY · VS-LAN-LAY-CO-SAI · VS-LOG-KHOA · VS-LOG-BAM · BV-GHI-LAN-LAY-KHONG-BOC · VS-LOG-LOI-KHOA · BV-GHI-LAN-LAY-DIEU-KIEN |
| B1 / phát hiện: settings.js GET / · GET /:key · PUT / | BV-SETTINGS-GET-ALL · BV-SETTINGS-GET-MOT · BV-SETTINGS-PUT · VS-SETTINGS-PUT-CHI-KHOA-DAU · VS-SETTINGS-PUT-SAU-GHI |
| Phát hiện: xuất không có dòng khoá (docBang, 3 cửa xuất) | BV-XUAT-LOC · VS-XUAT-TUNG-BANG-KHONG-LOC · VS-XUAT-TAT-CA-KHONG-LOC |
| Phát hiện: khôi phục bỏ qua dòng khoá, giữ khoá đang dùng (lapKeHoachBoKhoa + chèn lại) | BV-KHOI-PHUC-LOC · BV-KHOI-PHUC-GIU-KHOA · VS-KHOI-PHUC-TRANG-TRONG · VS-XEM-TRUOC-KHONG-LOC · VS-KHOI-PHUC-KHONG-LOC · BV-KHOI-PHUC-THIEU-COT |
| Vòng sửa 1: cửa đếm dòng `/info` + xem trước (demDong) | BV-DEM-DONG-INFO · VS-DEM-DONG-XEM-TRUOC |
| B3 không đụng `server/index.js` | VS-SUA-INDEX |
| D giao diện (Settings.jsx + KhoaSaoLuuPos.jsx) | BV-UI-GAN-THE · VS-UI-AI-CUNG-THAY · VS-UI-BO-CAU-DAN · VS-UI-LUU-KHOA-TRINH-DUYET · VS-UI-FETCH-TRAN · VS-UI-BO-HOI-PIN |
| E1 nối bộ kiểm | BV-NOI-BO-KIEM |

## Soát độc lập (/ra-soat)
**Lần 1 — KHÔNG ĐẠT** (13/14 mục nghiệm thu có bằng chứng; thiếu: C5 đường lỗi). Lỗi: (1) `ghiLanLay` hỏng làm mất cả tệp (backup.js `/tu-dong`); (2) khôi phục đọc dòng khoá ngoài giao dịch (race); (3) khôi phục tệp thiếu cột `value` chèn khoá value NULL; (4) `/info` + `currentRows` đếm dòng khoá; (5) trang_thai.md lỗi thời; (6) ca giao diện chỉ dò chuỗi; lỗ đột biến: ghiLanLay điều kiện `ma_bam`, đường lỗi, `timingSafeEqual`.
**Vòng sửa 1** (commit `7e272e5`): (1) bọc try/catch + ca G1 (trigger ép lỗi) + 2 đột biến; (3) thêm đủ cột + ca R5 + đột biến; (4) `demDong` + ca I1 + 2 đột biến; ca S1 (timingSafeEqual + điều kiện json_extract) + 2 đột biến; sửa phép A1c bỏ `xuat_luc` (giờ xuất đổi theo giây — bài thử chập chờn do chính mình viết).
**Lần 2 — ĐẠT** (17/17 mục có bằng chứng, không lỗi NẶNG). Còn 4 lỗi NHẸ, ghi để chủ quán biết (xem `## Phát hiện`).

## Soát bảo mật
Số lỗi trước lọc: 0 · sau lọc: 0. Báo cáo (agent độc lập, chỉ đọc, nguyên văn tóm lại): **Không tìm thấy lỗ hổng đạt chuẩn.** Đã soát 7 hướng: (1) lộ khoá / băm qua `GET /settings`, `GET /settings/:key`, tệp xuất, `export/:table`, `/info`, xem trước khôi phục, câu trả lời cửa quản lý (không có `ma_bam`), giao diện chỉ giữ khoá trong state; (2) ghi khoá qua `PUT /settings` (403), khôi phục (lọc + chèn lại cùng giao dịch), tạo / thu hồi (owner + PIN, PIN khoá sau 5 lần sai); (3) khoá `posk_` chỉ được kiểm ở `/tu-dong`, không middleware dùng chung nào chấp nhận; (4) 256 bit ngẫu nhiên, băm SHA-256, `timingSafeEqual`, băm giả khi chưa có khoá, regex `^Bearer (\S+)$`; (5) log thành công + lỗi chỉ in tên tệp / số byte / IP / `err.message`; (6) SQL toàn tham số `?`; (7) không XSS ở giao diện. Ghi chú dưới ngưỡng: thiếu `Cache-Control: no-store` ở phản hồi tạo khoá (làm cứng thêm, không có đường khai thác).
SOÁT BẢO MẬT: ĐẠT

## Kết quả bộ kiểm
- `npm test` (sau vòng sửa 1): PASS 117 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có sẵn từ trước, không do việc này).
- `node kiem_tra_truoc_khi_giao.js --day-du` (trước vòng sửa 1): PASS 121 · FAIL 0 · CẢNH BÁO 1; chạy lại ở bước 11.
- `thu_SAOLUU2.js` 36/0 và `thu_NDAPI1.js` 89/0 (không sửa, agent soát chạy lại).

## Phát hiện (ngoài phạm vi / để chủ quán biết)
- **Race khôi phục (NHẸ, vài ms):** `routes/backup.js` đọc dòng khoá hiện tại (`dongHienTai`) NGOÀI giao dịch rồi `thucHien` mới mở giao dịch xoá + chèn `pos_settings`. Nếu chủ quán tạo / thu hồi khoá đúng khoảng giữa, khoá cũ có thể sống lại. Sửa đúng cần một hook trong giao dịch của `server/utils/khoiPhuc.js` (NGOÀI Phạm vi) → đề xuất việc `HOC-<n>`: cho `thucHien` nhận hàm `giuDong(tx)` đọc dòng cần giữ TRONG giao dịch, đột biến bỏ hook.
- Ca B1h `p3` (quản lý PUT khoá riêng → 403) có thể xanh vì quản lý thiếu quyền `manage_settings`, không phải nhờ phép `KHOA_RIENG`; phép thật vẫn được ca của chủ quán (`p1`, `p2`) phủ. Nên cho quản lý quyền đó rồi mới thử (NHẸ).
- Chưa có ca cho tệp sao lưu CŨ (`banCu = true`, `backup_date` thiếu / đuôi Z) có dòng khoá; đọc `chuanHoaGio.js` thì dòng khoá chèn lại mang `updated_at` giờ VN dạng T nên không bị đổi (NHẸ, chưa khoá bằng ca).
- Tệp chỉnh tay thiếu cột `updated_at`: vá gán `updated_at = NULL` cho dòng của tệp (trước đây mặc định `CURRENT_TIMESTAMP`) — tệp xuất thật luôn có cột này (NHẸ).
- Ca giao diện (D1/D2/D3) chỉ dò chuỗi nguồn — kho chưa có hạ tầng render React; chủ quán thử tay (xem CHƯA KIỂM).
- Phản hồi `/tu-dong` và `/export-all` không đặt `Cache-Control: no-store` (Cloudflare mặc định không cache đường có Authorization / không đuôi tệp) — làm cứng thêm, sau khai trương.
- `ipKhach` tin `cf-connecting-ip` khi không qua Cloudflare (Replit / chạy máy) → né được trần 6 lần / giờ; khoá 256 bit nên không dò được. Thuộc DANG-NHAP-2, không phải việc này.
- Đường 500 của `/tu-dong` (lỗi dựng tệp) chưa có ca riêng; G1 chỉ phủ nhánh ghi thống kê hỏng. Eviction `TRAN_MUC` (bộ nhớ) chưa có ca.

## Bài học
Sự cố gom được: (a) phải hỏi chủ quán vì `settings.js` ngoài Phạm vi; (b) kho nông làm `thu_BH2.js` G1 đỏ ở stop hook; (c) người gác chặn: `cd` không đứng đầu lệnh (`B-CD-VITRI`), `sed -i` (`SED-I`), `git worktree` (`GIT-LENH`), lệnh ghép chạy script (`B-PHANTICH`) — đều làm lại bằng Edit / lệnh đơn; (d) ca A1c của chính mình chập chờn vì `xuat_luc`; (e) lỗi agent soát bắt ở lần 1 (4 lỗi nhẹ + lỗ đột biến).
- **KHOÁ 4** (đã làm trong Phạm vi, có ca đỏ trước, `thu_SAOLUUDEM1.js`): G1 (lỗi phụ — thống kê — không phá đường chính, kể cả log không lộ khoá), I1 (cửa ĐẾM dòng cũng phải lọc), R5 (khôi phục tệp thiếu cột), S1 (so băm thời gian không đổi + điều kiện ghi đua).
- **NGUYÊN TẮC 3** (đề xuất cho `KHUON_LOI.md`, ngoài Phạm vi — chat soát duyệt): K4 — ẩn một dòng khỏi "mọi cửa" thì liệt kê cả cửa ĐẾM (`/info`, `currentRows`) và dùng MỘT hàm lọc chung; K3 — phép so hai lần xuất cùng một dữ liệu phải bỏ trường giờ xuất (`xuat_luc`) và ca "người bị chặn" phải dùng người CÓ quyền cơ bản (nếu không hai phép chặn che nhau); K5 — vá đường khôi phục luôn có một ca tệp CŨ (`banCu`).
- **BỎ 2**: lỗi `cd` / `sed -i` của người gác — chỉ một lần, đã làm lại; kho nông — môi trường, không phải mã.
- Dọn: không có lời dặn nào trong `KHUON_LOI.md` / `CLAUDE.md` đã có phép kiểm làm thay trong việc này.

## Đếm nghiệm thu (phiếu)
- A1 — `dungTepSaoLuu()` một hàm, `/export-all` + `/tu-dong` cùng gọi: ca A1a, A1b, A1c (tệp cửa mới = tệp `/export-all`, cùng trang + dòng), A1d (`/export-all` vẫn như cũ); đột biến VS-TEP-RIENG, VS-EXPORT-ALL-RIENG.
- B1 — một khoá `posk_` ≥ 32 byte, chỉ băm, trong `pos_settings`, băm không ra cửa Cài đặt: B1a–B1h, C… (B1g GET /settings, B1h PUT).
- B2 — chỉ chủ quán + PIN, hiện một lần, thu hồi ngay: B2a, B2b, B2c, B2d.
- B3 — không sửa `server/index.js`: ca B3 (git diff rỗng + quét chữ) + VS-SUA-INDEX.
- C1 — 200 + xlsx + tên tệp như tải tay: C1a.
- C2 — sai / thiếu / thu hồi / vé thường → 401 `CHUA_DANG_NHAP` cùng một thân, so băm thời gian không đổi: C2a + S1.
- C3 — `posk_` chỉ mở đúng cửa này, `ndk_` không mở cửa này và ngược lại: C3a, C3b.
- C4 — trần 6 lần / giờ / IP, đúng lẫn sai → 429: C4 (ngay trên + ngay dưới: 6 qua, lần 7 chặn; VS-TRAN-5/7).
- C5 — ghi lần lấy gần nhất + cỡ tệp; log không chứa khoá (kể cả khi lỗi): C5a, C5b, G1 (đường lỗi ghi thống kê); đường 500 chung CHƯA có ca riêng (xem CHƯA KIỂM).
- D1 — thẻ trong tab Sao lưu, component mới, `Settings.jsx` chỉ thêm dòng gắn: D1a, D1b (chỉ dò chuỗi).
- D2 — khoá hiện một lần + Chép + câu dán KHOA_POS, báo CAIDAT-BAO-1, chỉ chủ quán: D2, D3 (chỉ dò chuỗi) + `isAdmin` ở D1a.
- E1 — bài mới ĐỎ trên gốc (3 đạt · 35 hỏng), khoá A–D, nối bộ kiểm, đột biến bắt (55/55): `bang_chung_do.txt`, E1, `dot_bien.py`.
- E2 — `thu_SAOLUU2.js` 36/0, `thu_NDAPI1.js` 89/0 không sửa.
- K5 — tải tay, xuất từng bảng, khôi phục tệp thường, `ndk_`, đăng nhập: A1d, P1, R4, C3a, vé owner dùng xuyên bài.
- Chú thích chủ quán 15.11: (1) hằng tên khoá một chỗ B1a; (2) settings.js B1g/B1h; (3) xuất P1 + khôi phục R1–R5.

## Cổng chạy
✓ CỔNG CHẠY ĐẠT   (`node tu_chay/cong.js chay . 2f40a7bf^ HEAD viec/SAOLUU-DEM-1`, đứng ở `c1718bf`, cây sạch)

## Báo cáo 7 mục
```
VIỆC:        SAOLUU-DEM-1 — Cửa sao lưu tự động của POS: một khoá chỉ đọc lấy đúng tệp "Sao lưu toàn bộ" cho Google Apps Script mỗi đêm
ĐÃ SỬA:      server/routes/backup.js — tách dungTepSaoLuu() (một hàm dựng tệp, /export-all + /tu-dong gọi chung); cửa GET /tu-dong (Bearer posk_,
             401 chung, trần 6/giờ/IP, ghi lần lấy gần nhất bọc try/catch); cửa quản lý GET/POST /khoa-tu-dong + POST /khoa-tu-dong/thu-hoi (chủ quán + PIN);
             docBang (xuất bỏ dòng khoá, 2 cửa xuất), demDong (/info + xem trước), lapKeHoachBoKhoa (xem trước + khôi phục bỏ dòng khoá, chèn lại dòng khoá
             hiện tại cùng giao dịch, đủ cột)
             server/utils/khoaSaoLuuPos.js (MỚI, ~75 dòng) — một dòng pos_settings, chỉ băm SHA-256, timingSafeEqual, trần lượt trong bộ nhớ
             server/routes/settings.js — GET / bỏ dòng khoá, GET /:key → 404, PUT / → 403 KHOA_RIENG (theo câu trả lời chủ quán 15.11)
             client/src/pages/CaiDat/KhoaSaoLuuPos.jsx (MỚI) + Settings.jsx (2 dòng: import + {isAdmin && <KhoaSaoLuuPos />}) + client/dist (build lại)
             cong_cu/thu_SAOLUUDEM1.js (MỚI) + kiem_tra_truoc_khi_giao.js (1 dòng nối bài)
BÀI THỬ:     chạy trên bản chưa vá (8b18dea) → ĐỎ 3 đạt · 35 hỏng (cửa 404; PUT /settings ghi được khoá tự dựng; tệp xuất / khôi phục không lọc);
             sau khi vá → XANH 38 đạt · 0 hỏng. Đột biến 55/55 BẮT. npm test 117/0, --day-du 121/0, cổng chạy ĐẠT. thu_SAOLUU2 36/0, thu_NDAPI1 89/0 nguyên.
ĐÃ RÀ K4:    grep "pos_settings" trong server/ → mọi chỗ đọc theo khoá cố định, trừ settings.js GET / (đã lọc), GET /:key (404), PUT / (403);
             grep "readTablePaged\|COUNT(\*) as count FROM" trong backup.js → 2 cửa xuất (docBang), 2 chỗ đếm (demDong), 2 cửa nạp kế hoạch
             (lapKeHoachBoKhoa) — đã xử lý hết; grep "ghiLanLay" → 1 chỗ gọi, bọc try/catch.
CHƯA KIỂM:   • Giao diện thẻ chưa thử trên trình duyệt / điện thoại — ca D1–D3 chỉ dò chuỗi nguồn; nhánh vẽ (khoá hiện một lần, Đóng là mất, hỏi
               "Khoá cũ sẽ ngừng dùng") chưa có ca máy.
             • Chưa thử với Google Apps Script thật (UrlFetchApp giới hạn kích thước phản hồi; tệp lớn lên có thể vượt) và chưa chạy trên Render + Turso.
             • Race khôi phục vs tạo/thu hồi khoá (vài ms) — cần hook trong khoiPhuc.js, ngoài Phạm vi (xem Phát hiện).
             • Đường 500 chung của /tu-dong (lỗi dựng tệp) và eviction TRAN_MUC chưa có ca; ca p3 "quản lý bị chặn" có thể xanh nhờ thiếu quyền.
             • Tệp sao lưu cũ (banCu = true) có dòng khoá chưa có ca (đọc code thì đúng).
             • Trần 6 lần/giờ đếm trong bộ nhớ: Render khởi động lại là về 0; IP thật tin header Cloudflare (DANG-NHAP-2).
GIT:         c1718bf SAOLUU-DEM-1: trang_thai — soát độc lập 2 lần, soát bảo mật ĐẠT, bảng đột biến, nghiệm thu
             5f925dd SAOLUU-DEM-1: bằng chứng đỏ trên gốc sau vòng sửa 1 (SỐ CA 38)
BÀI HỌC:     KHOÁ 4 · NGUYÊN TẮC 3 (đề xuất, ngoài Phạm vi) · BỎ 2 — chi tiết ở ## Bài học
```

Chủ quán thử tay (điện thoại): (1) Cài đặt › Sao lưu › cuộn xuống thẻ "Sao lưu tự động lên Google Drive" → bấm "Tạo khoá mới" → gõ PIN → chép khoá, dán vào Apps Script (Thuộc tính tập lệnh, tên KHOA_POS); (2) chạy script một lần rồi mở lại thẻ: dòng "Lần Google lấy gần nhất" phải hiện giờ + cỡ tệp; (3) thử "Thu hồi khoá" rồi chạy script lại — phải báo lỗi 401.

HEAD ĐÃ KIỂM: c1718bf

## Chat gộp main (16.11, bàn 38)
- Gộp main 7cf48ee (VOUCHER-2 + KH-NAP-1) vào nhánh — commit 825c662c. Đụng 3 chỗ: Settings.jsx (giữ cả import KhoaSaoLuuPos và MauVoucher), client/dist
  (dựng lại từ src sau gộp), index-*.js cũ. Tự gộp, đã đọc: backup.js (main thêm bảng pos_mau_voucher vào BACKUP_TABLES — hàm dựng tệp chung đọc danh sách
  này, tệp tự động có luôn), settings.js (luật voucher_toi_da / signup_mau_voucher_id + chặn KHOA_RIENG cùng sống), kiem_tra_truoc_khi_giao.js (đủ 3 bài).
- Kiểm ở 825c662c: thu_SAOLUUDEM1 38/0 (trên gốc main 7cf48ee: 3 đạt · 35 hỏng — vẫn đỏ đúng); npm test 116 đạt · 1 hỏng = thu_NDAPI1 (multer khác bản trong máy
  chat — main cũng vậy, bài học 37 #4); cổng chạy GitHub sẽ chạy lại đủ.

HEAD ĐÃ KIỂM: 825c662c
