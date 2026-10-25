# P24 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: `viec/P24` · cây sạch · `git fetch origin viec/P24` xong.
- HEAD `4c6e0ce` · FETCH_HEAD `4c6e0ce` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  4c6e0ce PHIEU: P24
  99f5894 TIEN-DO: P22-23 (c4fabcd), KH-QUAY-1 (168b481), P15-QR (423624b), KH-UI-1 (bd9b920) xong; DAC_TA_BAN_HANG_2410 + demo; mo QUAY-AN-1 + P24 + P3; them DIEM-THAT-1, UUDAI-1, TOPPING-1, BH-1, HD-1, KH-MUA-1, KH-UI-2; P13a-e + P14 gop; DON-DEP-v1 -> DONDEP-v1; lich — so v39
  bd9b920 Merge pull request #41 from pos-tuquyduong/viec/KH-UI-1
  ```

## Tiến độ
- Bước 2 (đọc) xong · Bước 3 kế hoạch `ke_hoach.md` xong, agent phụ đã soát (4 câu) và đã đưa vào kế hoạch.
- Dừng chờ duyệt kế hoạch → chủ quán duyệt 24.10 (`bdc530a`, phiếu mục "Đã duyệt": G-a, E-a, D có + signup-codes.js, rollback).

## Làm tiếp (`/lam-viec P24 tiep`)
- Đối chiếu: nhánh `viec/P24`, cây sạch; HEAD `bdc530a` · FETCH_HEAD `bdc530a` (hook mở phiên đã kéo `4bf6b9f → bdc530a`).
  ```
  bdc530a PHIEU: P24 duyet ke hoach 24.10 (G-a, E-a, D co + signup-codes.js, rollback khi loi ghi)
  4bf6b9f P24: ke hoach + trang thai — cho chu quan duyet
  4c6e0ce PHIEU: P24
  ```
- Bước 4: `cong_cu/thu_P24.js` đỏ trên gốc (11 đạt · 22 hỏng) — `bang_chung_do.txt`.
- Bước 5: vá `orders.js` (`truDiemDon` + 2 chỗ gọi), `signup-codes.js` (câu chiếm mã + `baoChiemHong`), `bat_bien.js` (I8),
  `kich_ban.js` (KB5), bài cũ `thu_P2223.js` F3, `thu_gia_lap.js` (+8 ca I8), `thu_DOISOAT1.js` F3/F3c, `kiem_tra_truoc_khi_giao.js`.
- Bước 6: `npm test` PASS 70 · `--day-du` PASS 74 · FAIL 0 (cảnh báo GET-ghi có sẵn).

## Chỗ vá → đột biến (`viec/P24/dot_bien.py`, 23/23 BẮT sau vòng 3, đối chứng xanh)
| Chỗ vá | Đột biến |
|---|---|
| `orders.js` gọi `truDiemDon` trong huỷ | BV-xoa-cau-tru-huy · VS-try-catch · VS-tru-sau-commit |
| `orders.js` gọi `truDiemDon` trong xoá | BV-xoa-cau-tru-xoa |
| `orders.js` câu `INSERT … SELECT` của `truDiemDon` | VS-tru-duong · VS-tru-sdt-cua-don · VS-bo-not-exists · VS-bo-han · VS-gom-theo-sdt · VS-gom-tung-dong |
| `signup-codes.js` câu chiếm mã `AND EXISTS … 'completed'` | BV-nhan-diem-bo-exists |
| `signup-codes.js` `baoChiemHong(…, dong)` | VS-bao-chiem-hong-cu |
| `bat_bien.js` I8 đơn huỷ = 0 | BV-I8-huy |
| `bat_bien.js` mốc `HUY_TRU_DIEM_TU` | VS-I8-moc-ca-gia-lap · VS-I8-moc-nguoc · VS-I8-tha-don-huy-tao-truoc-moc |
| `bat_bien.js` `adjust` gắn đơn không "lạ" | BV-I8-adjust-la · VS-I8-adjust-moi-dong |
| (vòng 1) `orders.js` gọi `truDiemDon` trong xoá — bọc nuốt lỗi | VS-try-catch-xoa |
| (vòng 1) `bat_bien.js` ngày gộp nhận tổng 0 · NULL cancelled_at | VS-I8-ngay-gop-chi-luat-cu · VS-I8-huy-null-sau-moc |
| (vòng 2) `bat_bien.js` vế `huyCu ||` tha luật cũ cho đơn huỷ trước mốc | VS-I8-bo-huycu-luat-cu |
| (vòng 3) `bat_bien.js` vế `r.status === 'cancelled'` của `huyCu` | VS-I8-huycu-bo-status |

## Câu hỏi
**Đã trả lời — vượt số vòng sửa (`so_vong_sua_toi_da` = 3), máy dừng ở bước 8 (HEAD `906c6b6`):** ba vòng `/ra-soat` đều KHÔNG ĐẠT, mỗi
vòng bắt một VẾ của nhánh I8 đơn huỷ chưa có ca giữ; cả ba đã vá + ca + đột biến (23/23 BẮT). Phương án hỏi: (a) vòng `/ra-soat` thứ 4;
(b) chat tự soát rồi duyệt; (c) gom I8 thành tập giá trị chấp nhận. **Chủ quán chọn (b) (24.10): chat soát thay vòng 4 — ĐẠT** (mục "Soát
vòng 4" cuối file). Không sửa code nữa; ca "duyệt hoàn tiền chen lúc nhận điểm" để việc sau.

Đã chốt (chủ quán 24.10, `bdc530a`, phiếu mục "Đã duyệt"): G-a (xoá trừ như huỷ, hàm chung `truDiemDon`) · E-a (dòng trừ chép hạn) · D có
(thêm `signup-codes.js` vào Phạm vi) · lỗi ghi dòng trừ → rollback cả lệnh · mốc `HUY_TRU_DIEM_TU = '2026-10-25'` tạm, chat sửa lúc duyệt PR.
Không còn câu hỏi mở.

## Phát hiện (ngoài phạm vi, không sửa)
- `server/utils/doiSoat.js:118` `tongHop`: "điểm trừ" cộng mọi dòng âm → dòng trừ do huỷ đơn lẫn với đổi quà trong tổng Đối soát.
- Hoàn tiền trọn (`refunds.js:158`) và hoàn một phần (báo hỏng, `damages.js`) đều GIỮ điểm của đơn — để việc sau (NT-I).
  Bài thử khoá hành vi hiện tại: `thu_P24.js` I2, I3. `thu_DOISOAT1.js` F3/F3c đổi số mong đợi theo hành vi `tongHop` hiện có
  (điểm trừ tháng = 300 do huỷ đơn mua gói + đổi quà) — khi việc sau tách loại trừ thì sửa lại hai ca này.
- Ca "duyệt hoàn tiền (refunds.js) chen ĐÚNG lúc nhận điểm mã bill" chưa có bài thử: câu chiếm mã (`signup-codes.js:284`) đòi
  `status = 'completed'` nên chặn cả đơn vừa chuyển 'refunded', nhưng đột biến `status <> 'cancelled'` sống (người soát vòng 2–3).
  Chủ quán: để việc sau. Kèm: `'completed'` viết cứng thay vì `TRANG_THAI_DUNG_MA.status` (`signup-codes.js:46`).
- Dữ liệu Turso thật có đơn huỷ `cancelled_at` NULL không: máy không xem được; I8 coi NULL là huỷ cũ (trước mốc) ở Đối soát thật.
- Neo đột biến của việc cũ (K4 TU-CHAY-5, so cây gốc fe433ff với HEAD bằng script nháp đếm neo mọi `viec/*/dot_bien.py` trên các file P24
  sửa): P24 làm rữa MỘT neo — `viec/P22-23/dot_bien.py` `VS-I8-moc-ca-gia-lap` (chuỗi `if (ctx.thuc && String(r.created_at) <
  DIEM_KHI_THU_TU` nay là `if (ctx.thuc && (huyCu || r.status !== 'cancelled') && String…`). `viec/P22-23/` ngoài Phạm vi → không sửa;
  đề xuất: việc sau đổi neo đó. P20c `BV-A3-bo-dieu-kien`, `BV-A1-bo-404` đã rữa SẴN ở gốc (không do P24). `kiem_neo.py` (HOC-2b): 3 neo
  hỏng sẵn (refunds.js, PHIEN_BAN, thu_cong) — không liên quan P24.

## Soát độc lập `/ra-soat` — vòng 1 (HEAD `1b46bfe`)
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
- cong_cu/gia_lap/bat_bien.js:149–152 — Đối soát thật báo lệch oan cho đơn huỷ TRONG ngày gộp (trước mốc HUY_TRU_DIEM_TU nhưng đã chạy
  bản vá → tổng điểm 0): nhánh huyCu chỉ nhận luật cũ "giữ điểm". Khuôn DIEM_KHI_THU_TU nhận cả hai luật trước mốc. Thử bằng node -e:
  đơn huỷ '2026-10-24T20:00:00', điểm 0, {thuc:true} → ["đơn X1: 0 điểm, đúng luật là 25"]. — K3 (thiếu ca dưới mốc) / K5 (chặn nhầm dữ liệu thật).
- viec/P24/trang_thai.md — thiếu kết quả `node tu_chay/cong.js chay` (LUAT_XAY_APP 6.3). — K6
- viec/P24/trang_thai.md "## Câu hỏi" — còn ghi 5 câu dạng "đề xuất" dù chủ quán đã chốt ở bdc530a. — K1
- ke_hoach.md 2.3 — đề xuất `AND status='completed' AND payment_status='paid'`, code (signup-codes.js:284) bỏ payment_status, không ghi lại
  (không gây lỗi: chỉ pay-debt đổi payment_status, theo chiều sang 'paid'). — K1 nhẹ
- ke_hoach.md bảng 3 B2 ghi "xanh cả gốc" nhưng bang_chung_do.txt ghi B2 ĐỎ trên gốc. — K1 nhẹ
NGHI NGỜ:
- Đơn huỷ cancelled_at NULL (dữ liệu cũ): String(null)='null' > mốc → bị coi là huỷ SAU mốc → Đối soát thật báo lệch. Code hiện luôn ghi
  cancelled_at (orders.js:1446); không kiểm được dữ liệu Turso.
- HAVING SUM(points) <> 0 (orders.js:1594) gần như code chết — earn luôn > 0; không đột biến nào chạm.
- VS-tru-sdt-cua-don bị bắt nhờ sập (NOT NULL → 500), không nhờ so SĐT.
- DELETE thiếu đột biến VS-try-catch (chỉ BV-xoa-cau-tru-xoa); LUAT 6.2 đòi VS- + BV- mỗi chỗ vá.
- NT-B phía quầy chỉ có căn cứ đọc code (customers-v2.js:217, Customers.jsx:494–495); B1 chỉ gọi /loyalty/points, /api/kh/diem dùng chung
  layDiemKhach (kh/index.js:99) nhưng không gọi thẳng.
- Ngân sách: thu_P24.js 410 dòng, phiếu ~200, không ghi giải thích.
K3: --goc fe433ff → thu_P24 11·22 (thoát 1), thu_gia_lap 94·6; HEAD 33·0; đột biến 18/18 BẮT, 0 LẠC. Bài kiểm hành vi thật, marker suông không xanh được.
K4: ghi earn 3 chỗ (orders.js:1061, :1338, signup-codes.js:295) — truDiemDon phủ cả ba; rời 'completed' 3 chỗ — huỷ, xoá (đã vá), refunds.js:158
  (để lại theo phiếu); đọc pos_point_transactions 9 chỗ — ổn với số âm; chưa xử lý: doiSoat.js:118 (phiếu ghi việc sau) + lỗi I8 trên.
K5: EXISTS … 'completed' ở câu chiếm mã chỉ tác dụng khi có lệnh chen (kiemDonCuaMa đã đòi completed + paid); D3 khoá luồng hợp lệ. Huỷ/xoá
  chỉ ném khi DB lỗi; C1–C3, G3, B1, I1a–c, G2 phủ. Chặn oan duy nhất: Đối soát (lỗi 1).
Đường tiền: không tin client — truDiemDon lấy số, SĐT, hạn từ DB; nguoi từ token. P1: không đụng client/ app_kh/.
NGHIỆM THU: 9/9 mục có ca thử; H có lỗi (thiếu ca "huỷ trước mốc đã trừ → sạch") nên chưa đạt.
CHƯA SOÁT ĐƯỢC: dữ liệu Turso thật; --day-du và cong.js; thử tay giao diện số âm; không chạy lại toàn bộ thu_gia_lap / thu_DOISOAT1.
BÀI HỌC: KHOÁ — mốc chuyển luật trong bất biến phải có ca "trước mốc, dữ liệu theo luật MỚI → sạch" cạnh ca "trước mốc, luật cũ → sạch",
  kèm đột biến bỏ vế tha luật mới. NGUYÊN TẮC (K3/K5) — mốc "ngày gộp + 1": dữ liệu trước mốc có thể theo một trong hai luật, phép tha
  phải nhận cả hai. KHOÁ nhẹ — bước báo xong đòi dòng cong.js trong trang_thai.md và đổi "## Câu hỏi" thành "đã chốt" sau khi duyệt.
```

### Sửa sau vòng 1
- `bat_bien.js` I8: nhánh huỷ trước mốc nhận CẢ "giữ điểm" lẫn tổng 0; `cancelled_at` NULL = huỷ cũ (7b8c91d).
- `thu_gia_lap.js` +3 ca: ngày gộp đã trừ → sạch; NULL cancelled_at → sạch; trước mốc trừ thiếu −4 → lệch (a476f29).
- `orders.js` bỏ `HAVING` (earn luôn > 0, code chết) (2d4268a).
- `dot_bien.py` +3: VS-try-catch-xoa, VS-I8-ngay-gop-chi-luat-cu, VS-I8-huy-null-sau-moc → 21/21 BẮT (f3b913b).
- `ke_hoach.md`: ghi rõ bỏ vế payment_status (2.3), sửa dòng B2, ngân sách thực tế + lý do thu_P24 dài. `## Câu hỏi` → đã chốt.
- Không sửa: VS-tru-sdt-cua-don (vẫn BẮT đúng ca A3 — đơn khách lẻ là đúng chỗ so SĐT phải khác SĐT đơn); NT-B phía quầy / App KH: cùng
  hàm `layDiemKhach`, ghi ở CHƯA KIỂM.

## Soát độc lập `/ra-soat` — vòng 2 (HEAD `b084bf8`)
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
- cong_cu/gia_lap/bat_bien.js:153 — vế `huyCu ||` (tha đơn huỷ trước mốc HUY_TRU_DIEM_TU còn giữ điểm theo luật cũ P22-23: đơn ghi nợ chưa
  thu tạo trước DIEM_KHI_THU_TU, hoặc Flash có điểm cũ) KHÔNG có ca thử giữ. Đột biến bỏ `huyCu ||` SỐNG ở cả thu_gia_lap --chi-du-lieu-tay
  (103·0) lẫn thu_P24 (33·0). Mọi ca HUY_I8 là đơn 'paid' không Flash → diemDung(true) = diemDung(false), vế không bao giờ được thử. — K3 (chạm K5)
- viec/P24/ke_hoach.md — chưa cập nhật theo code sau vòng 1: dòng 33 còn HAVING; dòng 72 "so như cũ" (code nhận thêm tổng 0 + NULL);
  dòng 99 B1 ghi gọi cả /api/kh/diem (bài chỉ gọi /loyalty/points); dòng 117 H3 hứa đột biến BV-xoa-cau-tru làm KB5 + I8 giả lập đỏ
  (dot_bien.py không có đột biến chạy giả lập; H3 trong thu_P24.js là ca khác); mục 5 "mỗi luồng có ca" nhưng "huỷ đơn đã dùng mã giảm"
  không có ca trong thu_P24.js; "truDiemDon 13 dòng" thật là 15. — K1 nhẹ
NGHI NGỜ:
- Tự chạy giả lập với orders.js gốc + bat_bien/signup-codes HEAD: I8 báo 12 lệch (KB5, 15, 16, 18, 21, 22, 30, 31) → lời hứa ke_hoach 2.6
  ĐÚNG, nhưng không nằm trong bộ đột biến của nhánh.
- bat_bien.js:152–154: đơn huỷ trước mốc lệch cả hai luật vẫn báo "đúng luật là <diemDung>" dù 0 cũng hợp lệ — lời báo hơi lệch, kết luận đúng.
- VS-tru-sdt-cua-don BẮT nhờ A3 sập 500 (NOT NULL); billSdtKhac làm biến thể COALESCE tương đương → chấp nhận.
- signup-codes.js:284 chỉ đòi status='completed'; đột biến `status <> 'cancelled'` sẽ sống (không ca duyệt hoàn chen lúc nhận điểm) — ngoài lõi phiếu (D chỉ nói huỷ).
K3: --goc fe433ff p24 11·22, gl 95·8; thu_gia_lap đủ trên gốc 161·9 khớp bằng chứng; bdc530a ≡ fe433ff ở server/ + gia_lap; 21/21 BẮT, đối
  chứng xanh. Mốc HUY_TRU_DIEM_TU có ca trên/dưới/ngày gộp/thiếu/NULL/giả lập. Hở duy nhất: lỗi 1.
K4: earn 3 chỗ (orders.js:1059, :1337, signup-codes.js:293) — truDiemDon phủ; rời 'completed' 3 chỗ (huỷ :1467, xoá :1641 vá; refunds.js:158
  để việc sau); 9 chỗ đọc điểm không cắt số âm; doiSoat.js:118 còn mở theo phiếu; pos_orders AUTOINCREMENT (database.js:198) → id đơn xoá không bị dùng lại.
K5: beginTransaction transaction("write") (database.js:1466) — nối tiếp; EXISTS chỉ tác dụng khi chen; D3 khoá luồng hợp lệ; baoChiemHong vẫn
  SDT_DA_NHAN khi đơn còn completed+paid; huỷ/xoá chỉ ném khi DB lỗi (A4, G4).
Đường tiền: không tin client. P1: không đụng client/, app_kh/, kh, database.js, refunds.js.
npm test PASS 70 · --day-du PASS 74 · thu_gia_lap HEAD 170·0.
Đơn giản: bat_bien.js:150–153 hai if chồng điều kiện khó đọc (chính vì vậy vế huyCu lọt kiểm) — gọn hơn: tập giá trị chấp nhận
  `chap` rồi `chap.includes(...)`. thu_P24.js 410 dòng, đã ghi lý do.
NGHIỆM THU: 9/9 có bằng chứng · H có chỗ hở K3 (lỗi 1).
CHƯA SOÁT ĐƯỢC: Turso thật (đơn huỷ ghi nợ mang điểm luật cũ, cancelled_at NULL); cong.js chay (bước 11); thử tay số âm trên điện thoại;
  ngày mốc thật HUY_TRU_DIEM_TU.
BÀI HỌC: KHOÁ — bất biến có HAI mốc chuyển luật chồng nhau (DIEM_KHI_THU_TU × HUY_TRU_DIEM_TU) thì mỗi ô bảng chéo phải có một ca + một
  đột biến gỡ đúng vế đó; dữ liệu thử chọn để các luật cho số KHÁC nhau (đơn pending / Flash, không phải paid). NGUYÊN TẮC — sửa xong lỗi
  người soát báo thì grep lại ke_hoach.md tìm mọi câu tả hành vi cũ (K4 tài liệu song song). NGUYÊN TẮC — "kịch bản X phủ Y" phải trỏ tới
  một đột biến chạy được giả lập, không có thì ghi bằng chứng thay thế.
```

### Sửa sau vòng 2
- `thu_gia_lap.js` +2 ca, đơn GHI NỢ (luật cũ 5 ≠ luật mới 0): tạo trước mốc thu đủ + huỷ trước mốc huỷ + còn điểm luật cũ → sạch;
  cùng đơn 7 điểm (sai cả hai luật) → lệch (f806f37). `dot_bien.py` +VS-I8-bo-huycu-luat-cu → 22/22 BẮT (7a935f7).
- `ke_hoach.md`: HAVING đã bỏ, mô tả I8 trước mốc nhận hai luật + NULL, B1 chỉ `/loyalty/points` (App KH cùng hàm), H3 giả lập ghi bằng
  chứng thay thế (chạy đủ thu_gia_lap trên gốc), luồng "huỷ đơn đã dùng mã giảm" do bài cũ phủ, số dòng truDiemDon = 15 (c2139b6).
- Không làm: gom I8 thành tập `chap` (đề xuất "đơn giản" của người soát) — đổi chữ thêm làm rữa thêm neo đột biến việc cũ; hai vế
  hiện đã có ca + đột biến riêng. Lời báo "đúng luật là <diemDung>" giữ như khuôn DIEM_KHI_THU_TU.
- Neo đột biến việc cũ: xem `## Phát hiện`.

## Soát độc lập `/ra-soat` — vòng 3 (HEAD `769d613`)
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
- cong_cu/gia_lap/bat_bien.js:150 — vế `r.status === 'cancelled'` trong `huyCu` không có ca nào giữ (K3). Đột biến tay
  `const huyCu = ctx.thuc && (cancelled_at == null || …)` SỐNG ở thu_P24 (33·0), thu_gia_lap --chi-du-lieu-tay, thu_DOISOAT1 (134·0).
  Hậu quả: đơn CHƯA huỷ có cancelled_at NULL → ở Đối soát thật huyCu đúng với MỌI đơn → vế `(huyCu && so(r.diem) === 0)` tha mọi đơn 0
  điểm. Probe: đơn paid, completed, 50.000đ, 0 điểm, {thuc:true}: HEAD ["đơn X: 0 điểm, đúng luật là 5"], đột biến [] — Đối soát thật im
  lặng trước đơn thu đủ thiếu điểm. Mọi ca thuc ở thu_gia_lap.js:540–561 là đơn ghi nợ hoặc đơn huỷ. Sửa: ca DON_I8() bỏ earn P1, {thuc},
  mong /^đơn P1: 0 điểm, đúng luật là 5$/ + đột biến VS-I8-huycu-bo-status.
- viec/P24/ke_hoach.md:120–122 — tên đột biến theo bản cũ (VS-duong, BV-xoa-cau-tru, BV-i8-huy) sai với dot_bien.py. — K1 / K4 tài liệu
- viec/P24/ke_hoach.md:110 F2 ghi "đỏ trên gốc" nhưng xanh trên gốc; :115 I1 "xanh cả gốc" nhưng I1b, I1c ĐỎ; :115 nói I1 phủ "dùng mã"
  trái với :139; :139 nhắc D3 mà bảng không có D3. — K1 nhẹ
NGHI NGỜ:
- signup-codes.js:284 đột biến `status <> 'cancelled'` SỐNG (không ca duyệt hoàn chen lúc nhận điểm) — phiếu D chỉ nói huỷ, không tính lỗi.
- orders.js:1591 bỏ `AND type = 'earn'` SỐNG — tương đương hiện tại (chỉ adjust gắn đơn, NOT EXISTS chặn; redeem order_id NULL loyalty.js:125).
- bat_bien.js:150 `<` → `<=` mốc SỐNG — tương đương (cancelled_at luôn có giờ, helpers.js:129 getNow).
- signup-codes.js:284 viết cứng 'completed' thay vì TRANG_THAI_DUNG_MA.status (:46) — có thể lệch về sau (K4 nhẹ).
K3: --goc fe433ff p24 11·22, gl 97·8; 22/22 BẮT, 0 LẠC; hở duy nhất: lỗi 1. K4: earn 3 chỗ phủ; 'cancelled' 1 chỗ (orders.js:1446), DELETE 1
  chỗ (:1684) — đã vá; refunds.js:158 để việc sau; đọc số dư không cắt âm; doiSoat.js:118 mở theo phiếu. K5: không thấy chặn oan.
  K1: lỗi 2, 3; số ca 33/44/172/134, 22 tên đột biến khớp trang_thai. Đường tiền: không tin client. P1: client/ app_kh/ không đổi.
Đơn giản: bat_bien.js:150–153 ba biểu thức chồng nhau — chính vì vậy vế status lọt hai vòng; giữ cấu trúc thì cần ca + đột biến từng vế.
NGHIỆM THU: 9/9 mục có bằng chứng · thiếu: không. H hở K3 (lỗi 1).
CHƯA SOÁT ĐƯỢC: Turso thật (cancelled_at NULL, đơn ghi nợ mang điểm luật cũ); cong.js chay; thử tay số âm; /api/kh/diem không gọi thẳng; ngày mốc thật.
BÀI HỌC: KHOÁ — điều kiện gộp `X && (cột == null || cột < MỐC)` mà cột NULL ở mọi dòng ngoài X: vế X phải có ca "dòng ngoài X, cột NULL,
  sai luật → lệch" + đột biến gỡ X. NGUYÊN TẮC (K3) — đột biến cho nhánh bất biến phải bao từng VẾ của biểu thức trung gian, không chỉ chỗ
  dùng. NGUYÊN TẮC (K4 tài liệu) — sau mỗi vòng sửa, grep ke_hoach.md tìm mọi tên đột biến, đối chiếu `dot_bien.py --liet-ke`.
```

### Sửa sau vòng 3 (vòng sửa thứ 3 — cuối cùng được phép)
- `thu_gia_lap.js` +1 ca: đơn thu đủ CHƯA huỷ thiếu điểm ở Đối soát thật → lệch (ed3404c). `dot_bien.py` +VS-I8-huycu-bo-status → 23/23 BẮT (8677e97).
- `ke_hoach.md`: tên đột biến thật + trỏ `--liet-ke`; F2 xanh trên gốc (giữ để bắt VS-bo-not-exists); I1 tách I1a/b/c đúng đỏ/xanh, bỏ "dùng
  mã"; thêm dòng D3 (e71f36b).
- Chạy lại: thu_gia_lap HEAD 173·0, gốc 164·9; --goc p24 11·22, gl 98·8; `npm test -- --day-du` PASS 74 · FAIL 0.
- Không làm (để chủ quán chọn ở `## Câu hỏi`): nghi ngờ `status <> 'cancelled'` (duyệt hoàn chen lúc nhận điểm — ngoài phiếu D), dùng
  `TRANG_THAI_DUNG_MA.status` thay `'completed'` viết cứng.

## Soát vòng 4 — chat soát thay vòng 4 — ĐẠT (HEAD `906c6b6`, 24.10)
Chủ quán chọn (b). Chat đã soát HEAD `906c6b6` ngày 24.10: đọc diff `orders.js`, `signup-codes.js`, `bat_bien.js`; chạy lại thu_P24 33/0,
thu_P2223 44/0, thu_DOISOAT1 134/0, thu_P26c 157/0, thu_gia_lap 173/0, npm test 68/0 — ĐẠT, không có lỗi tiền / điểm. Ba vòng soát chỉ
thiếu ca thử ở các vế I8, đều đã khoá bằng ca + đột biến. Không sửa code nữa. Ca "duyệt hoàn tiền chen lúc nhận điểm" để việc sau.
(Máy chép nguyên lời chat. Lần chạy của máy ở cùng HEAD: `npm test` PASS 70 · `--day-du` PASS 74 · FAIL 0 — khác số 68 chat ghi; máy
không biết chat chạy ở chế độ nào.)

## Nghiệm thu — đếm từng mục
- A — `thu_P24.js` A1 (earn lúc tạo), A2 (earn lúc thu nợ), A3 (khách lẻ mã bill, SĐT người nhận), A4 (lỗi ghi → rollback), A4b (dòng trừ
  TRONG giao dịch), A5 (hai earn → một dòng trừ); dòng cũ giữ nguyên (A1 so lại dòng earn). Đỏ trên gốc.
- B — B1 số dư −20 qua `/loyalty/points` (`layDiemKhach`, cùng hàm `/api/kh/diem` — `kh/index.js:99`); B2 đổi quà 400. Đỏ trên gốc.
- C — C1 khách lẻ chưa nhận mã, C2 Flash, C3 ghi nợ chưa thu / thu một phần → 0 dòng điểm.
- D — D1 huỷ rồi nhận → 400 `DON_DA_HUY` (hành vi sẵn có `signup-codes.js:63`); D2 huỷ chen lúc nhận (đỏ trên gốc); D3 luồng hợp lệ.
- E — E1 cùng hạn, E2 earn đã hết hạn → số dư không đổi (E-a), E3 hai hạn → hai dòng.
- F — F1 hai lệnh huỷ chồng → 200 + 400, 1 dòng trừ; F1b; F2 chặn trong câu ghi (đột biến VS-bo-not-exists).
- G — G1 xoá đơn có earn → trừ (G-a); G2 huỷ rồi xoá → 1 dòng; G3 K5; G4 lỗi ghi khi xoá → rollback.
- H — I8 `bat_bien.js:8–13, 20, 149–153, 171–172`; `thu_P24.js` H1, H1b, H2, H3; 14 ca I8 dữ liệu tay `thu_gia_lap.js`; KB5
  `kich_ban.js` (đỏ trên gốc, giả lập I8 0 lệch trên HEAD); 12 đột biến I8 BẮT.
- I — I1a giao từ gói, I1b mua gói, I1c mua thẻ (ví / gói / thẻ như cũ); I2 duyệt hoàn giữ điểm, I3 báo hỏng hoàn một phần giữ điểm (việc sau).
9/9 mục có bằng chứng.

## Báo cáo
```
VIỆC:        P24 — Huỷ đơn trừ lại điểm đã cộng (cho phép điểm âm) · sửa bất biến I8
ĐÃ SỬA:      server/routes/orders.js:1583–1599 — hàm truDiemDon: INSERT … SELECT dòng 'adjust' = −SUM(earn) theo (SĐT, hạn), NOT EXISTS
               chặn trừ lần hai; gọi trong giao dịch huỷ :1467 và xoá :1641 (đơn 'completed'), không bọc try/catch (lỗi → rollback)
             server/routes/signup-codes.js:284 — câu chiếm mã /nhan-diem thêm AND EXISTS đơn còn 'completed' (huỷ chen giữa không ghi earn);
               :79–84 baoChiemHong nhận dongDon → trả DON_DA_HUY / DON_DA_HOAN qua kiemDonCuaMa
             cong_cu/gia_lap/bat_bien.js:8–13, 20, 141, 149–153, 171–172, 345 — I8: đơn huỷ tổng điểm = 0; mốc HUY_TRU_DIEM_TU (tạm
               '2026-10-25'); Đối soát thật: huỷ trước mốc / cancelled_at NULL nhận cả luật cũ lẫn tổng 0; 'adjust' gắn đơn không "lạ"
             cong_cu/gia_lap/kich_ban.js KB5 — huỷ đơn có điểm + nhận điểm mã bill rồi huỷ → điểm đơn 0, 1 dòng trừ
             cong_cu/thu_P24.js (mới, 33 ca) · thu_P2223.js F3 · thu_gia_lap.js +14 ca I8 · thu_DOISOAT1.js F3/F3c ·
               kiem_tra_truoc_khi_giao.js:495 thêm thu_P24.js cuối mảng bài chạy thật
BÀI THỬ:     chạy trên bản chưa vá (fe433ff) → ĐỎ: thu_P24 11·22 (A1–A5, B1–B2, D2, E1–E3, F1, G1/G2/G4, H1/H1b/H2, I1b/I1c),
               thu_P2223 43·1 (F3), thu_gia_lap 164·9 (KB5 ×2 + 7 ca I8), thu_DOISOAT1 132·2 (F3, F3c); sau khi vá → XANH 33 / 44 / 173 / 134;
               đột biến 23/23 BẮT, đối chứng xanh; npm test -- --day-du PASS 74 · FAIL 0. Chi tiết: bang_chung_do.txt
ĐÃ RÀ K4:    grep "INSERT INTO pos_point_transactions" server → 4 chỗ: earn orders.js:1059, :1337, signup-codes.js:293 (cả ba gắn
               order_id → truDiemDon phủ), redeem loyalty.js:125 (không gắn đơn) — đã xử lý hết; chỗ đưa đơn rời 'completed' → 3: huỷ, xoá
               (đã vá), refunds.js:158 (để việc sau theo phiếu); 9 chỗ đọc pos_point_transactions — không chỗ nào cắt số âm; neo đột biến
               việc cũ: 1 neo P22-23 rữa (Phát hiện)
CHƯA KIỂM:   dữ liệu Turso thật (đơn huỷ cancelled_at NULL, đơn ghi nợ mang điểm luật cũ) — I8 coi NULL là huỷ cũ; thử tay số âm trên quầy
               (Khách hàng) và App KH (màn Điểm) — chưa mở trên điện thoại; /api/kh/diem không gọi thẳng (cùng hàm layDiemKhach);
               ca "duyệt hoàn tiền chen lúc nhận điểm" (để việc sau); ngày mốc thật HUY_TRU_DIEM_TU (chat sửa lúc duyệt PR);
               đột biến không chạy giả lập (KB5 chỉ có bằng chứng chạy đủ thu_gia_lap trên gốc); bản vá vòng 3 do chat soát thay
               (không phải agent /ra-soat)
GIT:         xem dòng "git log --oneline -2" ngay dưới khối này
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 2 · BỎ 3 — chi tiết ở ## Bài học
```
Thử tay cho chủ quán (sau khi gộp, trên điện thoại): (1) bán 1 ly có SĐT trả tiền mặt → Khách hàng thấy điểm cộng; (2) Lịch sử đơn →
Huỷ đơn đó → điểm khách về như trước (khách đã đổi quà thì hiện số âm); (3) App KH → Điểm: thấy dòng "Huỷ đơn … — trừ lại điểm".

## Bài học
Sự cố gom từ việc này: 3 vòng `/ra-soat` KHÔNG ĐẠT (đều một khuôn: vế điều kiện I8 không có ca giữ) → vượt số vòng sửa, phải hỏi;
`thu_DOISOAT1` F3 đỏ bất ngờ sau vá (Đối soát gộp dòng trừ với đổi quà); người gác chặn: B-BIMAT-CHU ×3 (grep -r ở gốc kho; chạy bài
chưa commit có cụm bí mật; heredoc ghi hồ sơ có chữ đó), B-PHANTICH ×3 (chuyển hướng ra file, lệnh ghép `cp … && node`, `$'…'`),
GIT-CHECKOUT ×1 (`git checkout <sha> -- file` lấy bản gốc), B-CD-VITRI ×1, B-MANOI ×1 (heredoc ghi hồ sơ nhắc file được bảo vệ → dùng
Edit); vượt ngân sách bài thử (410 / ~200).

1. **KHOÁ** — mỗi VẾ của điều kiện mới trong bất biến có một ca + một đột biến gỡ đúng vế đó; dữ liệu thử chọn để các luật cho số KHÁC
   nhau (đơn ghi nợ / Flash, không chỉ đơn 'paid'); với khuôn `X && (cột == null || cột < MỐC)` phải có ca "dòng ngoài X, cột NULL, sai
   luật → lệch". Lý do: ba vòng soát liên tiếp, mỗi vòng một vế. Ngoài Phạm vi (bộ khung tự chạy) → đề xuất: phép kiểm của cổng đọc
   `viec/<MÃ>/dot_bien.py`: mỗi dòng điều kiện đổi trong `cong_cu/gia_lap/bat_bien.js` (theo diff) phải có ≥ 1 đột biến neo vào dòng đó;
   ca đỏ: P24 HEAD `769d613` (vế `r.status === 'cancelled'` không đột biến nào neo).
2. **KHOÁ** — mốc chuyển luật trong bất biến (`*_TU`) có ca "trước mốc, dữ liệu theo luật MỚI → sạch" cạnh "trước mốc, luật cũ → sạch"
   (ngày gộp lẫn hai luật). Đã làm trong Phạm vi cho P24 (`thu_gia_lap.js` ca ngày gộp, ca đỏ trên gốc + đột biến
   VS-I8-ngay-gop-chi-luat-cu). Đề xuất chung: mẫu ca này cho mọi mốc sau (DIEM-THAT-1).
3. **NGUYÊN TẮC** — K3, thêm dòng "Chặn (P24)": biểu thức trung gian gộp nhiều vế (`huyCu`) — đột biến từng vế của nó, không chỉ chỗ
   dùng; mốc "ngày gộp + 1" nghĩa dữ liệu trước mốc theo MỘT TRONG HAI luật — phép tha nhận cả hai. Đã gây: P24 vòng 1–3. Ngoài Phạm vi
   (`KHUON_LOI.md`) → đề xuất.
4. **NGUYÊN TẮC** — K4 (tài liệu song song): sau mỗi vòng sửa, grep `ke_hoach.md` tìm mọi tên đột biến / câu tả hành vi cũ, đối chiếu
   `dot_bien.py --liet-ke` (vòng 2 và 3 đều bắt `ke_hoach.md` lệch code). Ngoài Phạm vi → đề xuất gộp vào dòng "Chặn (TU-CHAY-5)" của K4.
5. **BỎ** — `thu_DOISOAT1` F3 đỏ sau vá: đúng hành vi, do Đối soát gộp loại trừ (đã ghi Phát hiện, việc sau tách) — một lần.
6. **BỎ** — người gác chặn (B-PHANTICH / GIT-CHECKOUT / B-CD-VITRI / B-BIMAT-CHU / B-MANOI): luật đã có và đúng, máy làm theo hướng dẫn
   (chép bản gốc từ nháp, commit trước khi chạy bài có cụm bí mật, ghi hồ sơ bằng Edit) — không cần khoá mới.
7. **BỎ** — vượt ngân sách `thu_P24.js`: đã ghi lý do ở `ke_hoach.md` mục 6 (33 ca phủ A–I + K5) — riêng việc này.
Dọn: không đề xuất xoá lời dặn nào (chưa có phép kiểm thay). `KHUON_LOI.md` không đổi trong việc này.

## Cổng (bước 11.4)
`node tu_chay/cong.js chay . 4c6e0ce^ HEAD viec/P24` ở HEAD `2221b95`, cây sạch:
✓ CỔNG CHẠY ĐẠT

GIT (`git log --oneline -2` lúc kiểm):
```
2221b95 P24: chat soat thay vong 4 — DAT; nghiem thu, bao cao 7 muc, bai hoc
906c6b6 P24: soat vong 3 — bao cao + sua; vuot so vong sua, dung hoi chu quan
```

HEAD ĐÃ KIỂM: 2221b95

Chat soát 24.10: gộp thử QUAY-AN-1 + P24 trên main 99f5894 không đụng nhau; P24 chat soát thay vòng 4 — ĐẠT; commit ed2516e (gộp main / đổi mốc I8) qua hook pre-commit + cổng chạy GitHub.
HEAD ĐÃ KIỂM: ed2516e
