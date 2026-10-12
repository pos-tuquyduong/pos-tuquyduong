# P26c — trạng thái

## Bước 1 — đối chiếu bản chụp (12.10.2026)
- Nhánh: `viec/P26c`. `git status --short` sạch (không dòng nào).
- `git fetch origin viec/P26c` → HEAD `35f76b4` · FETCH_HEAD `35f76b4` (bằng nhau — không kéo).
- `git log --oneline -3`:
  ```
  35f76b4 PHIEU: P26c
  43c793e TIEN-DO + LUAT: TU-CHAY-5 xong (6c281f5), mo P26c + AUDIT-2, them DOI-SOAT-1, dinh huong chu quan — so v27
  6c281f5 Merge pull request #14 from pos-tuquyduong/viec/TU-CHAY-5
  ```
- Có commit `PHIEU: P26c`.

## Bước 2 — đã đọc (lượt này)
`phieu.md`, `CLAUDE.md`, `KHUON_LOI.md`, `CHECKLIST_CODE.md` (P4, G, H); nguồn phiếu: `viec/P26b/trang_thai.md` ## Phát hiện,
`viec/P26b/ke_hoach.md` ## 10, `viec/LUOI-1/trang_thai.md` ## Phát hiện, `viec/TACH-GL/trang_thai.md` ## Phát hiện.
Code: `damages.js` (cả file), `orders.js` 185–390, 440–660, 760–1060, 1165–1590, `refunds.js` 95–214, `packages.js` 165–201,
`rewards.js` 20–94, `loyalty.js` 75–220, `wallets.js` 58–98 + 240–262, `doSoNo.js`, `middleware/auth.js` 80–117,
`database.js` 62–72, 915–985, 1135–1155, 1233–1245, `users.js` 139–212 (grep), `bat_bien.js` 1–120 + 209–264,
`kich_ban.js` 420–598, `Settings.jsx` 555–585, `Orders.jsx` (grep sự cố / xoá), `Sales.jsx` 480–502 + 738–756, `Refunds.jsx` 40–76.

## Bước 3 — kế hoạch
`ke_hoach.md`. Phiếu dặn **chờ duyệt kế hoạch** → commit, push, DỪNG. Câu hỏi cho chủ quán ở `ke_hoach.md` mục 9.

## Người gác chặn (lượt này)
- `B-DICHCHU`: ghi ra `$S/...` (đích có biến) → viết thẳng đường dẫn.
- `B-CHUONGTRINH`: `time`, vòng `for` của shell → đo bằng script node trong thư mục nháp.

## Làm tiếp sau duyệt (12.10) — bước 1
- `git status --short` sạch. fetch → HEAD `b9b3928` · FETCH_HEAD `b9b3928` (bằng nhau; hook mở phiên đã kéo 8a025fa → b9b3928).
- `git log --oneline -3`:
  ```
  b9b3928 PHIEU: P26c
  8a025fa P26c: ke hoach — sua so dong orders.js:349
  db5f101 P26c: ke hoach (cho duyet) + trang thai buoc 1-3
  ```
- Đọc phiếu mục "Chủ quán trả lời kế hoạch" (H1–H9, 6A). Ca có số tiền bổ sung: `ke_hoach.md` mục 13.

## Bước 4 — bài thử trước
- `cong_cu/thu_P26c.js` (mới, khuôn `thu_P26b`): 65 ca. Trên GỐC (server + client của `b9b3928`): **18 đạt · 47 hỏng**, thoát 1 —
  18 ca xanh đều là ca K5 / kho bận (canh hồi quy, phải xanh cả trên gốc); D2c xanh trên gốc vì gốc không bao giờ đánh dấu
  voucher `used` (ca có nghĩa sau D4). Bằng chứng: `bang_chung_do.txt`.
- Giả lập (KB30–32 mới, KB17/21/23/26/27 đổi mong đợi, I18–I19 mới) trên server GỐC: **KHÔNG ĐẠT (31 lệch)** — `bang_chung_do.txt`.
- `thu_gia_lap.js` (sửa: 32 KB / 18 bất biến, neo M1/M13, ca tay I2/I7/I11/I13/I18/I19) — đỏ trên cây gốc (xem `bang_chung_do.txt`).

## Bước 5 — sửa (chỗ vá → đột biến; mọi tên ở `dot_bien.py`)

| Chỗ vá | File | Đột biến |
|---|---|---|
| B3 chặn hoàn kho đơn đã huỷ | damages.js | BV-B3-bo-chan-hoan-kho · VS-B3-chan-ca-don-da-hoan |
| B4 (H3) chặn đền đơn chưa thu | damages.js | BV-B4-bo-chan-chua-thu · VS-B4-chan-theo-cach-tra-no |
| B2 (Q3) hoàn tiền phải > 0 | damages.js | BV-B2-bo-chan-so-0 · VS-B2-chi-chan-so-am |
| B1 (Q2) trần theo số đã trả | damages.js + tienDaTra.js | BV-B1-tran-gia-goc · VS-B1-tran-theo-dong-dau · VS-B1-chia-bo-giam-don |
| Q4 / H2 giá trị gói còn lại, toàn bộ vào ví | tienDaTra.js + orders.js | BV-Q4-hoan-tron · VS-Q4-luot-con-lai-dao · VS-H2-chi-phan-vi · VS-H2-me-khong-nhan-truoc · VS-H2-khong-ghi-hoan-goi |
| H4 trừ tiền đã đền | tienDaTra.js | BV-H4-bo-tru-den · VS-H4-chi-tru-o-don-goi |
| Q4 quyền refund_package (huỷ) | orders.js | BV-Q4-bo-quyen · VS-Q4-quyen-cancel_order · VS-Q4-chan-ca-don-lay-tu-goi |
| Q4 quyền trên kho đang chạy | database.js | BV-Q4-quyen-chi-kho-moi · VS-Q4-quyen-de-quyen-da-chinh |
| A1 xoá sau huỷ không hoàn gói lần hai | orders.js | BV-A1-xoa-bo-cong-trang-thai · VS-A1-chan-ca-don-da-hoan |
| A2 trừ lượt trong giao dịch, có trần | orders.js | BV-A2-bo-tran · VS-A2-bo-kiem-changes |
| A2 lấy ngay ≤ số lượt | orders.js | BV-A2-lay-ngay-bo-tran · VS-A2-lay-ngay-so-man-hinh |
| A3 chặn vừa mua vừa lấy | orders.js | BV-A3-bo-chan · VS-A3-so-nham-ma-goi |
| A4 bỏ /deliver | packages.js | BV-A4-deliver-song-lai |
| A6 số lượt theo gói đã cài | orders.js + Sales.jsx | BV-A6-so-man-hinh · VS-A6-chi-sua-ten-dong · BV-A6-o-nhap-so-luot |
| C1 thu nợ chỉ đơn completed | orders.js | BV-C1-cong-cancelled · VS-C1-chi-sua-cong-update |
| C2 mã bill chưa dùng | orders.js | BV-C2-bo-xoa-ma-bill · VS-C2-xoa-ca-ma-da-dung |
| C2 nợ kho của đơn xoá | orders.js | BV-C2-bo-huy-no-out · VS-C2-huy-ca-no-in-da-toi-sx · VS-C2-khong-huy-no-in-cung-mon · VS-C2-van-gui-in |
| C3 duyệt hoàn giảm total_spent | refunds.js | BV-C3-bo-cot-con · VS-C3-dau-soCot · VS-C3-dau-soCot-gia-lap |
| C4 tổng hoàn | refunds.js | BV-C4-bo-tong-hoan |
| C5 xoá đơn mua thẻ | orders.js | BV-C5-bo-go-the |
| D1 ô Giảm tối đa | Settings.jsx | BV-D1-bo-gui-max |
| D2 (H7) trả lượt mã | orders.js + refunds.js + tienDaTra.js | BV-D2-bo-tra-luot-huy · BV-D2-bo-tra-luot-xoa · BV-D2-bo-tra-luot-duyet · VS-D2-tra-ca-don-cu · VS-D2-khong-tra-voucher |
| D3 chỉ lưu mã khi áp | orders.js | BV-D3-luu-ma-go |
| D4 voucher used | orders.js | BV-D4-bo-voucher-used |
| D5 bỏ Kim cương | database.js | BV-D5-co-kim-cuong |
| I18 / I19 / I11 / I2 / I13 / I7 | bat_bien.js | BV-I18-bo · VS-I18-chi-so-nap · BV-I19-bo · VS-I19-bo-qua-no · VS-I11-bo-moi-dong-hoan · BV-I11-tinh-ca-hoan-goi · VS-I2-tinh-ca-ma-da-dung · VS-I13-dem-moi-trang-thai · VS-I7-nhan-moi-van-tay-la |

### Đột biến cũ đổi (E3) — `viec/P26b/dot_bien.py` ngoài Phạm vi, chuyển sang `viec/P26c/dot_bien.py`
P26b chạy lại trên HEAD: 48 / 59 BẮT. 11 không bắt — đều vì code P26c CỐ Ý viết lại đoạn chúng neo (Q2, Q4, H2, H4, C3):
| Đột biến P26b | Vì sao | Thay bằng (P26c, cùng ca bắt) |
|---|---|---|
| me-huy-hoan-gap-doi | hoàn mẹ khi huỷ nay qua `hoanVi` | VS-me-hoan-gap-doi-huy (✗ M2) |
| me-xoa-hoan-gap-doi | như trên, khi xoá | VS-me-hoan-gap-doi-xoa (✗ M3) |
| Q9-bo-hoan-me | duyệt hoàn nay tính `me` qua soTienHoan | BV-Q9-bo-hoan-me (✗ M5) |
| Q9-hoan-me-vao-vi-con | neo `me.parent_phone` → `don.parent_phone` | VS-Q9-hoan-me-vao-vi-con (✗ M5) |
| Q9-hoan-me-ngoai-tx | như trên | VS-Q9-hoan-me-ngoai-tx (✗ M5) |
| Q9-hoan-me-khong-qua-cong-don | như trên | VS-Q9-hoan-me-khong-qua-cong-don (✗ M8) |
| duyet-cong-don-khong-kiem-changes | biến `don` đổi tên `doi` (tên `don` dùng cho đơn) | BV-duyet-cong-don-khong-kiem-changes (✗ A2a) |
| hong-bo-tran | trần đền viết lại (Q2) | BV-hong-bo-tran (✗ C1a) |
| hong-bo-tran-cong-don | như trên | BV-hong-bo-tran-cong-don (✗ C6b) |
| hong-tran-theo-man-hinh | `dong.gia` nay chỉ cho thống kê, không vào trần | VS-hong-tran-theo-man-hinh (✗ C1b) |
| hong-lay-dong-dau | câu `dong` nay chỉ cho thống kê | VS-B1-tran-theo-dong-dau (✗ C6a, thu_P26b) |

### Bài thử cũ sửa theo hành vi mới (mong đợi CỐ Ý đổi)
- `cong_cu/thu_P26b.js` C2a, C4b, C6b: gửi "Hoàn tiền" KHÔNG kèm số (dựa vào "gõ 0 = đền đủ" — Q3 bỏ) → thêm `refund_amount`
  (25.000 / 20.000 / 25.000 — đúng số máy chủ trước đây tự điền). Khẳng định không đổi. Bài này XANH trên gốc → xem Câu hỏi 1.
- Giả lập: KB17 (báo hỏng kèm số), KB21 (gói tự cài 3 lượt — A6; nhân viên huỷ đơn mua gói 403, chủ huỷ chồng → hoàn 1/3 giá,
  gói chưa giao hoàn trọn), KB23 (thêm khẳng định 240.000 vào ví, cách `hoan_goi`), KB26 (`/deliver` → 404), KB27 (1 dòng nợ
  `huy`, không nợ in; bỏ ràng buộc "kịch bản cuối lượt"). Không bớt `c.mong` nào (KB21 thêm 1).
- Bất biến đổi theo quyết định: I2 (H5 — mã đã dùng không tính mồ côi), I7 (H6 — vân tay của đơn đã xoá hợp lệ khi qua đúng một
  dòng nợ ĐÃ xong), I11 (H2 — dòng `hoan_goi` không tính, I19 canh theo đơn), I13 (H7 — chỉ đếm đơn `completed`). Mỗi đổi có ca tay
  sạch + ca lệch + đột biến (bảng trên).

### Bộ đột biến chạy trên HEAD (vòng cuối, H8)
- `python3 viec/P26c/dot_bien.py` → **80 bị bắt · 0 không (trên 80)** (64 riêng P26c + 16 chuyển từ bộ cũ).
- `viec/LUOI-1/dot_bien.py` → **đúng mong đợi 80/80** (BẮT 79 · LẠC 1 mong LẠC).
- `viec/TACH-GL/dot_bien.py` → 25/29 đúng mong đợi; 4 lệch đều do neo `LUOT` / dòng "29 kịch bản · 16 bất biến" (P26c thêm KB30–32,
  I18–I19) → chuyển sang P26c: VS-kb-hai-luot, VS-luot-trung-thieu, BV-cha-kiem-mot-lan, VS-luot-thieu-bat-bien (đều BẮT).
- `viec/P26b/dot_bien.py` → 48/59; 11 chuyển (bảng trên).
- `viec/HOC-2b/kiem_neo.py` gốc vs HEAD: neo rữa DO P26c = P26b 9 + AUDIT-1 `G3-da-biet` + HOC-2b `VS-q9-me-lon-hon-bang-0`,
  `BV-q9-bo-hoan-me` → chuyển: BV-G3-da-biet-thu-no, VS-q9-me-lon-hon-bang-0 (BV-q9 = BV-Q9-bo-hoan-me). `G3-sai-chuoi` (AUDIT-1)
  và `VS-E3-phien-ban-cu` (HOC-2) HỎNG cả trên gốc — có từ trước, không phải việc này.

## Câu hỏi
1. **[ĐÃ TRẢ LỜI 12.10 — chủ quán: KHÔNG thêm mục miễn; thêm ca Q3 vào thu_P26b — xem "Xử lý vòng 1"]** `## Bài thử cũ sửa` cho `cong_cu/thu_P26b.js` — bài đã có, sửa 3 ca (thêm `refund_amount`, mục trên) và vẫn XANH trên code
   gốc (chạy cây `b9b3928` + bài head: 65 đạt · 0 hỏng) → cổng A11 sẽ đỏ nếu phiếu không miễn. Đề nghị chủ quán thêm vào phiếu:
   `## Bài thử cũ sửa` / `- cong_cu/thu_P26b.js — Q3 bỏ "gõ 0 = đền đủ": 3 ca báo hỏng hoàn tiền phải gửi kèm số tiền`.
   Máy KHÔNG tự sửa phiếu.

## Phát hiện (ngoài nghiệm thu — KHÔNG sửa)
1. (ke_hoach 10.2) Tạo gói / ghi mua thẻ chạy SAU commit, lỗi chỉ log → khách trả tiền mà không có gói / thẻ.
2. (ke_hoach 10.3) `PUT /customer-packages/:id/cancel` huỷ gói không hoàn, không xét quyền Q4 (chỉ `manage_users`).
3. (ke_hoach 10.4) `pay-debt` kho bận vẫn 500 (không qua `loiGhi`).
4. (ke_hoach 10.5) I18 trên dữ liệu production trước P26c sẽ lệch (duyệt hoàn cũ không giảm `total_spent`) — DOI-SOAT-1 cần mốc ngày.
5. (ke_hoach 12.6) "Hoàn kho SX" trên món mà nợ `out` còn chờ → SX được cộng hàng chưa từng ra.
6. **Đơn MUA gói đã XOÁ: dòng hoàn `hoan_goi` không còn gì để đối chiếu** (đơn, gói, món đều bị xoá) — I11 bỏ qua dòng này, I19 chỉ
   canh đơn còn. Trần đúng (≤ khách đã trả) chỉ được bảo đảm bởi code (`soTienHoan`) + thu_P26c A5h, không bởi bất biến chạy trên dữ
   liệu thật. Đề xuất cho DOI-SOAT-1: ghi số "đã trả" vào dòng sổ (vd cột ghi chú có cấu trúc) hoặc không xoá dòng đơn mua gói.
7. Hai đơn bấm cùng lúc trùng mã đơn (P26b Phát hiện 10, việc P26d) — giả lập không dựng được "hai quầy lấy lượt cuối" (KB30 dùng
   lấy 2 / lấy 1 tuần tự); chồng thật nằm ở thu_P26c A2c (Promise.all).
8. `Sales.jsx:489` `setBuyQty(String(pkg.total_qty || 30))` — gói cài 0 lượt hiện "30" trên màn hình; máy chủ từ chối 400
   `GOI_CHUA_CAI_LUOT` nên không sai tiền, chỉ lời hiển thị sai.
9. Đơn có gói mua kèm phí ship: `tienDaTraTheoDong` trừ phí ship khỏi số chia cho dòng, nhưng `soTienHoan` hoàn
   `total − nợ − giá trị gói đã dùng` (gồm cả phí ship) — huỷ đơn mua gói có ship thì hoàn cả phí ship. Theo đúng chữ H2 ("tổng
   khách đã trả cho đơn"); chủ quán biết để quyết.

## Soát độc lập — vòng 1 (chép nguyên báo cáo)

```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
1. server/routes/orders.js:1524-1534 (C2) — Xoá đơn đánh `huy` MỌI nợ `out` còn chờ mà KHÔNG xét chiều `in` ĐÃ tới SX chưa. Đường:
   bán lúc SX lỗi (nợ out POS:id:out:0 pending) → SX sống lại → nhân viên huỷ: orders.js:1446-1457 gửi inStockReturn thẳng, THÀNH
   CÔNG, không có dòng nợ `in` → chủ xoá: out→huy. SX được cộng 1 mà không bao giờ bị trừ. Chạy thật (scratchpad/soat_c2.js, SX
   giả bật/tắt): HEAD `sxNhan [["in",1,"POS:1:in:0"]]`, nợ out → `huy`, SX ròng +1; server gốc 35f76b4: out vẫn `pending`, SX ròng 0.
   Hồi quy do P26c — khuôn K4 (đường huỷ-rồi-xoá khi SX đã sống); thu_P26c tắt SX hoàn toàn (thu_P26c.js:10) nên không thể dựng ca
   này; C2b/C2d/C2e + VS-C2-* không phủ. Sửa đúng + đơn giản: với đơn `cancelled`, chỉ huỷ `out` khi dòng `in` cùng món CÒN chờ;
   không có thì để nguyên `out`.
2. server/routes/damages.js:153-183 (Q4/K4) — "Hoàn tiền" sự cố trên DÒNG GÓI của đơn mua gói (dòng gói có product_code = mã gói,
   unit_price = giá gói) → hoàn trọn giá gói trong khi gói VẪN dùng được, không cần quyền `refund_package`, trần theo giá đã trả chứ
   không theo giá trị còn lại. Chạy (scratchpad/soat_them.js ca 1): mua gói 300.000 tiền mặt → đền 300.000 → 200, ví 0 → 300.000,
   rồi lấy 10 ly → 200. Mặc định chỉ owner (manage_orders không có trong danh sách quyền mặc định database.js:935-965); nếu chủ
   cấp manage_orders cho quản lý thì quản lý lách được cổng Q4. Cùng khuôn lỗ Q4 vừa vá ở huỷ/xoá, chưa có trong Phát hiện.
3. server/utils/tienDaTra.js:10-17 + orders.js:871-878 (Q2/B1) — giảm mã giảm-1-món (`discount_scope='item'`, orders.js:609-623)
   chỉ nằm trong tổng giảm đơn, `signup_unit_price` không ghi xuống DB → `tienDaTraTheoDong` chia đều phần giảm cho mọi dòng. Ví dụ:
   A 100.000 (mã giảm A 50.000) + B 100.000, khách trả 150.000 → trần đền A = 75.000 nhưng khách chỉ trả 50.000 cho A (đền quá
   25.000); trần B = 75.000 nhưng khách trả 100.000 (chặn oan). Suy từ code, chưa chạy. K4/K5.
4. server/routes/orders.js:1306-1309 (H2) — đơn mua gói hoàn cả phần tiền mặt vào ví nhưng ghi `cot: total_spent, soCot: -con`.
   Chạy (ca 2): gói 300.000 tiền mặt, owner huỷ → ví `{"balance":300000,"total_topup":0,"total_spent":-300000}`. total_spent âm hiện
   ở customers-v2.js:443 và kéo lệch `all_time_spent` (reports.js:228). I18 (bat_bien.js:293-305) định nghĩa total_spent = mua −
   hoàn nên coi số âm là đúng — quy tắc đối soát chưa đúng nghĩa (điều 5).
5. server/routes/damages.js:158 (B3/K4) — chỉ chặn thứ tự "huỷ trước, Hoàn kho SX sau". Thứ tự ngược: "Hoàn kho SX" trước
   (damages.js:204-213 gọi `/api/pos/stock/return` KHÔNG vân tay) rồi huỷ (orders.js:1446) / xoá (orders.js:1588) → SX nhận hàng về
   hai lần. Chưa có trong Phát hiện.
6. cong_cu/thu_P26c.js:492-498 (D1/K3) — phép tĩnh chỉ kiểm có chuỗi `max_discount:` trong thân lệnh gửi = kiểm marker. Đã thử
   marker suông `max_discount: 0,` trong bản sao client → `✓ D1 … 65 đạt · 0 hỏng`. Ca số tiền của phiếu (quà 50 % trần 50.000, đơn
   500.000 → giảm 50.000) không có bài nào chạy đúng số đó (kich_ban.js:586-589 dùng trần 7.000 và chỉ phía máy chủ — có từ trước).
7. server/routes/orders.js:186-189 (A3/K5) — chặn `customer_package_id && package_buy` không xét có món lấy từ gói cũ. Sales.jsx:744
   gửi `activePkgId` mỗi khi nhân viên đã bật gói cũ; addPkgToCart (Sales.jsx:485-493) không tắt gói cũ → luồng "bật gói cũ, không
   lấy gì, mua gói mới" (khách gia hạn) nay 400. Không có ca "phải KHÔNG bị chặn" cho luồng này. Gọn hơn: chỉ chặn khi
   `layTuGoi > 0`.

NGHI NGỜ:
- orders.js:381-382 (K5, dữ liệu cũ): `pos_packages.total_qty` DEFAULT 0 (database.js:828), packages.js:44 lưu `total_qty || 0`. Gói
  cài 0 lượt trước đây vẫn bán được nhờ màn hình gửi 30 (Sales.jsx:489, 746); nay 400 GOI_CHUA_CAI_LUOT — quầy không bán được gói đó.
  trang_thai Phát hiện 8 coi là "chỉ lời hiển thị sai", không nêu thành câu hỏi cho chủ quán. Cần chạy trên production
  `SELECT code FROM pos_packages WHERE is_active=1 AND COALESCE(total_qty,0)<=0`.
- doSoNo.js:79-81 `SET status='resolved' WHERE id=?` không điều kiện trạng thái: sổ nợ đang đẩy đúng dòng out mà lệnh xoá chuyển
  `huy` và bỏ gửi in → SX bị trừ không được cộng lại. Chạy đua, chưa dựng được.
- refunds.js:165-168: đã đền đủ phần ví → `con` = 0 nhưng vẫn ghi dòng sổ `refund 0` và báo "Đã hoàn 0đ". Chạy (ca 3): sổ
  `[purchase -20000, compensation 20000, refund 0]`. Không sai tiền, dòng sổ rác.
- Đơn mua gói đã XOÁ: dòng `hoan_goi` không còn gì đối chiếu (I11 bỏ qua, I19 chỉ đơn còn). Tính năng tiền mới chưa có quy tắc đối
  soát — hồ sơ ghi nhận ở Phát hiện 6 nhưng vẫn là lỗ của điều 5.

NGHIỆM THU: 24/26 mục có bằng chứng · mục thiếu: D1, C2
- A1 ✓ (A1a-c) · A2 ✓ (A2a-e) · A3 ✓ · A4 ✓ · A5 ✓ (A5a-k) · A6 ✓ (A6a-c)
- B1 ✓ (B1a-d đúng số phiếu) · B2 ✓ · B3 ✓ · B4 ✓ · B5 ✓ (B5a-d)
- C1 ✓ · C2 ✗ (có ca C2a-e nhưng sai ở nhánh huỷ-khi-SX-sống-rồi-xoá, lỗi 1) · C3 ✓ (C3 + VS-C3-dau-soCot) · C4 ✓ · C5 ✓ (C5 + KB32)
- D1 ✗ (lỗi 6) · D2 ✓ · D3 ✓ · D4 ✓ · D5 ✓
- E1 ✓ · E2 ✓ (bánh cóc 32/18; chay.js 33,5 s; không ghi số đo từng lượt sau vá trong hồ sơ) · E3 ✓ (theo hồ sơ; tôi chạy lại 4/4 BẮT)
- G ✓ (đối chiếu ke_hoach.md:133) · H ✓ (`--day-du` PASS 66 · FAIL 0 · CẢNH BÁO 0, gồm thu_P26c, thu_P26b, thu_gia_lap; dist khớp src)
K3: thu_P26c trên server gốc 35f76b4 (client HEAD) 20 đạt · 45 hỏng, thoát 1 — cộng 2 phép tĩnh client thì khớp 18/47 hồ sơ. Ca động
kiểm số tiền / trạng thái thật, không marker; điểm yếu duy nhất D1. P1: không lỗi. Đường tiền: không trường tiền nào tin client. K1: các
câu kiểm lại trong trang_thai khớp code.

CHƯA SOÁT ĐƯỢC: chưa chạy lại toàn bộ đột biến cũ và dot_bien.py đủ 80 (chỉ 4); chưa chạy `npm test` riêng (đã `--day-du`); chưa xem
dữ liệu production (gói 0 lượt, đơn trạng thái khác completed, mã giảm-1-món đang dùng); không dựng được chạy đua doSoNo/xoá; lỗi 3
chưa chạy thật.

Đơn giản (mục 8): database.js:969-972 thêm refund_package vào danh sách mặc định trong khi vòng INSERT OR IGNORE :983-986 đã đủ — bỏ 3
dòng. orders.js:1343-1351 chép logic checkPermission (auth.js:83-112) — auth.js ngoài Phạm vi → Phát hiện. Ghi ví mẹ/con hai nơi:
hoanVi (orders.js:1303-1315) và refunds.js:164-172 — có thể đặt hoanVi ở tienDaTra.js dùng chung. C2 dựng vân tay bằng
replace(':out:', ':in:') + boQuaKho — dễ gãy, chính là chỗ sinh lỗi 1.

BÀI HỌC:
- KHOÁ: bài thử C2 phải có SX giả bật/tắt được (bán lúc lỗi → SX sống → huỷ → xoá, SX ròng = 0); thêm đột biến "huỷ out không xét in".
- KHOÁ: ca báo sự cố "Hoàn tiền" trên dòng gói phải 400 (hoặc theo Q4); ca "Hoàn kho SX rồi huỷ/xoá → SX nhận đúng một lần".
- KHOÁ: D1 cần ca động — POST /rewards qua đúng thân lệnh màn hình gửi rồi đơn 500.000 giảm 50.000 — hoặc phép tĩnh kiểm giá trị gửi
  lấy từ `rewardForm.max_discount`.
- NGUYÊN TẮC (K3/K4): đường hai chiều (out/in, đền/huỷ) mà huỷ/gỡ một vế → liệt kê mọi tổ hợp "vế kia đã tới đích chưa", mỗi tổ hợp
  một ca; bài thử tắt hẳn bên ngoài (SX tắt) chỉ phủ nhánh "chưa tới".
- NGUYÊN TẮC (K5): điều kiện chặn xét đúng hành vi nguy hiểm (có lấy lượt), không xét sự có mặt của trường; dữ liệu cũ có giá trị mặc
  định 0 → câu hỏi cho chủ quán, không để thành Phát hiện "chỉ hiển thị".
```

## Xử lý soát vòng 1 (vòng sửa 1/3)
| Lỗi | Xử lý | Bằng chứng |
|---|---|---|
| 1 C2 huỷ-khi-SX-sống-rồi-xoá: out → huy, SX ròng +1 (HỒI QUY) | `orders.js` xoá: đơn `cancelled` mà `in` cùng món KHÔNG còn nợ (đã tới SX) → giữ nguyên nợ `out` để đẩy; chỉ huỷ cặp out+in khi `in` còn nợ. thu_P26c thay SX tắt hẳn bằng SX GIẢ bật/tắt | thu_P26c C2f (SX ròng = 0, nợ out còn chờ); đột biến VS-C2-huy-out-khong-xet-in BẮT |
| 2 đền sự cố trên DÒNG GÓI lách cổng Q4 | `damages.js`: "Hoàn tiền" trên dòng `product_id < 0` (gói / thẻ, orders.js:376, :397) → 400 `GOI_THE_KHONG_DEN` — theo Q4 (hoàn gói chỉ qua huỷ / xoá có quyền); "Chỉ ghi nhận" vẫn được | thu_P26c B1e; BV-B1-den-dong-goi BẮT |
| 3 mã giảm-1-món chia đều | KHÔNG sửa — nghiệp vụ chưa chốt, không phải hồi quy (trước P26c trần theo giá gốc, đền quá NHIỀU hơn) → Câu hỏi 2 | — |
| 4 total_spent âm khi hoàn gói trả tiền mặt | `hoanVi`: phần ≤ số khách trả bằng ví ghi dòng `cash` có giảm total_spent; phần vượt (tiền mặt / CK, H2) ghi dòng riêng `hoan_goi`, KHÔNG đụng total_spent. I18 không tính dòng `hoan_goi`; I11 nay canh lại được phần ví của đơn mua gói | thu_P26c A5c2 (sổ 100.000 cash + 80.000 hoan_goi, total_spent 0), A5d (total_spent không đổi); thu_gia_lap ca tay I18 hoan_goi; VS-H2-hoan-goi-giam-total-spent, VS-H2-mot-dong-hoan-goi BẮT |
| 5 Hoàn kho SX trước rồi huỷ / xoá → SX nhận về hai lần | KHÔNG sửa — có từ trước, ngoài B3 (phiếu: "trên đơn đã huỷ") → Phát hiện 10 | — |
| 6 D1 phép tĩnh = marker | phép tĩnh nay đòi giá trị gửi LẤY TỪ `rewardForm.max_discount` (D1a); thêm ca động đúng số phiếu: quà 50 % trần 50.000 (thân lệnh GÕ TAY theo các trường màn hình gửi — sửa câu ở vòng 2, lỗi 3) → đổi điểm → đơn 500.000 giảm 50.000 (D1b) | VS-D1-marker-suong (`max_discount: 0`) BẮT |
| 7 A3 chặn oan gia hạn | chặn chỉ khi đơn CÓ món lấy từ gói (`items.some(from_package)`) | thu_P26c A3b (K5 gia hạn → 200); VS-A3-chan-ca-gia-han BẮT |
| Đơn giản: quyền mặc định trùng | bỏ 3 dòng `refund_package` khỏi danh sách mặc định — vòng INSERT OR IGNORE chạy mọi lần khởi động đã đủ | Q4a, Q4b xanh |
| Nghi ngờ: gói cài 0 lượt | → Câu hỏi 3 (dữ liệu cũ, K5) | — |
| Nghi ngờ: chạy đua doSoNo / xoá; dòng sổ `refund 0` | → Phát hiện 11, 12 | — |
| Đơn giản: hoanVi dùng chung với duyệt hoàn | KHÔNG gộp — duyệt hoàn cần ghi lại `refund_amount` + gắn `balance_transaction_id` (I17), khác huỷ / xoá; gộp thêm nhánh | — |

Trả lời Câu hỏi 1 (chủ quán 12.10): thêm `thu_P26b` C1e — đơn RIÊNG, "Hoàn tiền" gửi 0 / không gửi số → 400, không dòng sổ ví nào.
Cây gốc + bài head: 65 đạt · 1 hỏng (chỉ C1e), thoát 1 → A11 hợp lệ; head 66 đạt. Đột biến BV-B2-bo-chan-so-0-thu-P26b BẮT.
(Lần đầu đặt C1e chung đơn C1 → trên gốc C1c, C4a đỏ lây — tách đơn riêng, K3.)

## Câu hỏi (mới, vòng 1)
2. **[ĐÃ TRẢ LỜI 12.10 — đồng ý đề xuất tạm; làm ở vòng 2]** **Mã giảm-1-món + báo sự cố** (soát vòng 1 lỗi 3): giảm của mã 1 món không ghi xuống dòng (`signup_unit_price` chỉ hiển thị),
   nên `tienDaTraTheoDong` chia đều phần giảm cho mọi dòng. Ví dụ A 100.000 (mã giảm A 50.000) + B 100.000, trả 150.000 → trần đền A
   75.000 (khách trả 50.000), B 75.000 (khách trả 100.000). Đề xuất đơn giản: tạm thời coi mọi dòng của đơn có mã 1-món là "đã trả =
   giá dòng − toàn bộ giảm" (không bao giờ đền quá, có thể chặn oan B — quản lý dùng "Chỉ ghi nhận"); làm đúng cần thêm cột giảm theo
   dòng (đổi cấu trúc DB — phiếu cấm nếu chưa duyệt). Chủ quán chọn; hiện để nguyên chia đều.
3. **[ĐÃ TRẢ LỜI 12.10 — chủ quán tự kiểm gói đang bật trên màn Cài đặt trước khi gộp; thêm chặn gốc ở vòng 2]** **Gói cài 0 lượt (dữ liệu cũ, K5)**: `pos_packages.total_qty` DEFAULT 0 (database.js:828), màn quản lý gói lưu `total_qty || 0`.
   Trước P26c gói 0 lượt vẫn bán được (màn hình gửi số mặc định 30); nay A6 → 400 `GOI_CHUA_CAI_LUOT`, quầy không bán được gói đó tới
   khi sửa gói. Trước khi gộp cần chạy trên production: `SELECT code, name FROM pos_packages WHERE is_active = 1 AND COALESCE(total_qty, 0) <= 0;`
   — có dòng nào thì cài số lượt cho gói đó trước, hoặc chủ quán chọn cho bán với số khác.

## Phát hiện (thêm, vòng 1)
10. "Hoàn kho SX" (báo sự cố, `damages.js` gọi `/api/pos/stock/return` không vân tay) RỒI huỷ / xoá đơn → SX nhận hàng về hai lần.
    Có từ trước; B3 chỉ chặn chiều ngược (huỷ rồi hoàn kho). Đề xuất: huỷ / xoá trừ số đã hoàn kho qua báo sự cố khỏi lệnh `in`.
11. `doSoNo.js:79-81` `SET status = 'resolved' WHERE id = ?` không điều kiện trạng thái — sổ nợ đang đẩy đúng dòng out mà lệnh xoá
    chuyển `huy` + bỏ gửi in → SX trừ không cộng lại. Chạy đua, chưa dựng được ca (CHƯA KIỂM).
12. Duyệt hoàn khi tiền đã đền ≥ phần ví → ghi dòng sổ `refund 0` (I17 cần dòng gắn yêu cầu) và báo "Đã hoàn 0đ". Không sai tiền.
13. `orders.js` (cổng Q4 trong huỷ đơn) chép logic `checkPermission` (`middleware/auth.js:83-112`, ngoài Phạm vi) — đề xuất việc sau
    xuất một hàm `coQuyen(role, quyen)` dùng chung.

## Làm tiếp — vòng 2 (chủ quán trả lời Câu hỏi 2, 3 — 12.10)
- Bước 1: HEAD `2ff8437` · FETCH_HEAD `2ff8437` (bằng nhau). `git log --oneline -3`:
  ```
  2ff8437 P26c soat v1: xu ly vong 1, Cau hoi 2-3, Phat hien 10-13
  e3688eb P26c soat v1: bang chung do ban cuoi (thu_P26c 70, thu_gia_lap 145, thu_P26b 66)
  d3fbc0b P26c soat v1: dot bien 87/87
  ```
- Câu hỏi 2 → `tienDaTra.js` `tienDaTraTheoDong(tx, order, chanTren)`: chỉ trần đền (`damages.js`) gọi `chanTren = true`; đơn có mã
  `discount_scope = 'item'` → mọi dòng "đã trả = giá dòng − toàn bộ giảm của mã". Hoàn huỷ / xoá (soTienHoan) giữ chia tỉ lệ — xem
  Phát hiện 14. Ca: thu_P26c B1f (A 50.000 giảm 25.000 qua mã nhóm + B 30.000, trả 55.000 → đền A 25.001 400, 25.000 200).
- Câu hỏi 3 → `packages.js` POST: Tổng SL SP phải là số nguyên ≥ 1 (400 `GOI_LUOT_KHONG_HOP_LE`, lời rõ); PUT: chỉ xét khi có
  gửi số lượt (bật / tắt gói không gửi — K5 dữ liệu cũ); `Settings.jsx` savePkg chặn < 1 trước khi gửi, ô `min="1"`. Ca: A7a, A7b
  (gồm K5 bật/tắt gói cũ 0 lượt → 200), A7c.
- Bằng chứng đỏ: thu_P26c trên server + client `2ff8437` → 70 đạt · 4 hỏng (đúng A7a, A7b, A7c, B1f); trên gốc `b9b3928` → 20 đạt
  · 54 hỏng; head 74 đạt. Đột biến mới (đều BẮT): BV-B1f-bo-chan-tren · VS-B1f-chia-deu · BV-A7-bo-chan-post · BV-A7-bo-chan-put ·
  VS-A7-chan-ca-bat-tat · VS-A7-cho-luot-0 · BV-A7c-man-hinh.

## Phát hiện (thêm, vòng 2)
14. **Giảm theo dòng → P26d** (chủ quán chốt Câu hỏi 2): mã giảm 1 món không ghi phần giảm xuống dòng (`signup_unit_price` chỉ hiển
    thị). Trần đền nay dùng cận an toàn (không đền quá, có thể chặn oan dòng không được giảm). Hoàn huỷ / xoá ĐƠN MUA GÓI có mã 1 món
    vẫn chia tỉ lệ: giá trị gói đã dùng có thể lệch vài nghìn. Làm đúng cần cột giảm theo dòng (đổi cấu trúc DB) → P26d.
15. PUT gói chỉ bật / tắt (không gửi số lượt) vẫn cho BẬT gói cũ 0 lượt — gói đó bật lên vẫn không bán được (400 `GOI_CHUA_CAI_LUOT`).
    Đúng câu trả lời Câu hỏi 3 (chủ quán tự kiểm gói đang bật); ghi để biết.

## Soát độc lập — vòng 2 (chép nguyên báo cáo)

```
KHÔNG ĐẠT
Tóm tắt: bộ kiểm đầy đủ xanh, nhưng còn 2 lỗi thật. Lỗi 1 đã chạy và thấy ĐỎ trên HEAD: xoá đơn làm SX thiếu hàng vĩnh viễn khi SX
hết giờ chờ (timeout). Lỗi 2 đã thử đột biến: bài thử D1 vẫn để lọt màn hình gửi sai, và hồ sơ ghi sai về cách làm ca D1b.

Đã chạy trên HEAD 7b1a88f: thu_P26c 74 đạt · 0 hỏng. Trên cây 2ff8437 (bản sau vòng 1): 70 đạt · 4 hỏng, đúng A7a, A7b, A7c, B1f
như hồ sơ ghi. thu_P26b 66 đạt · 0 hỏng. --day-du PASS 66 · FAIL 0 · CẢNH BÁO 0 (gồm thu_P26c 2,5 s, chay.js 33,4 s, thu_gia_lap
48,7 s, dist khớp src). Giả lập đo chạy riêng từng lượt: lượt 1 33,4 s · lượt 2 29,2 s · lượt 3 23,9 s · lượt 4 24,6 s — đều dưới
180 s. 8 đột biến của vòng 2 (gồm BV-B1f, VS-B1f, VS-A7-chan-ca-bat-tat, BV-A7c, BV-B1-den-dong-goi, VS-D1-marker-suong,
VS-C2-huy-out-khong-xet-in, VS-H2-hoan-goi-giam-total-spent): bắt 8/8.

LỖI TÌM ĐƯỢC:
1. server/routes/orders.js:1531-1544 + :1604 (C2) — xoá đơn đánh `huy` nợ `out` và bỏ gửi `in`, dựa trên giả định "nợ out còn
   pending = hàng chưa tới SX". Giả định này sai.
   - Theo server/utils/sxApi.js:41-61, SX không trả lời trong 8 s thì POS báo lỗi, dù SX có thể đã trừ kho rồi. Lúc đó đơn bán
     (orders.js:976-985) vẫn ghi một dòng nợ `pending`.
   - Cách làm có từ trước dựa vào vân tay: sxApi.js:155-157 ghi rõ "gửi lại bao nhiêu lần cũng vô hại".
   - Đã chạy (scratchpad/s2/t.js, SX giả "đã làm rồi mới báo lỗi"): bán → xoá đơn completed. HEAD: SX nhận [out POS:1060:out:0],
     không in, không còn nợ chờ → SX thiếu 1 vĩnh viễn. Server gốc 35f76b4: SX nhận out + in, còn 1 nợ out (đẩy lại bị SX bỏ qua vì
     trùng vân tay) → ròng 0.
   - Cùng dạng ở nhánh mới vá vòng này: đơn đã huỷ, nợ `in` thật sự lỗi nhưng nợ `out` đã tới SX mà POS báo hết giờ → hai dòng nợ đều
     `huy` → SX −1.
   - Đây là hồi quy do P26c. Khuôn K1 (tiền đề "pending = chưa tới" không đọc từ code) và K4 (đường hai chiều: chỉ dựng nhánh "lỗi =
     chưa làm").
   - Cách đơn giản mà đúng: xoá đơn giữ cách cũ — đẩy cả out lẫn in, SX tự bỏ lệnh trùng vân tay. Như vậy bỏ được boQuaKho,
     replace(':out:', ':in:') và câu tra thêm. Nhưng làm vậy trái chữ C2 / H6 trong phiếu ("không còn tự đẩy") → cần đưa thành câu
     hỏi cho chủ quán, không tự chọn.
2. cong_cu/thu_P26c.js:564-578 (D1, K3) — lỗi 6 của vòng 1 mới vá một nửa.
   - Đã thử đột biến đảo nhánh ở client/src/pages/Settings.jsx:572: `max_discount: discount_type === 'percent' ? 0 :
     (parseInt(rewardForm.max_discount) || 0)`. Kết quả D1a ✓, D1b ✓, 74 đạt · 0 hỏng.
   - Màn hình gửi trần 0 cho quà loại % — đúng trường hợp duy nhất cần trần — mà bài vẫn xanh.
   - Lý do: regex D1a (`max_discount\s*:[^,]*rewardForm\.max_discount`) chỉ đòi tên ô có mặt. D1b gõ tay thân lệnh gửi, không lấy từ
     màn hình, và D1b vốn xanh cả trên gốc (bang_chung_do.txt:13).
   - Gọn hơn: gửi luôn `max_discount: parseInt(rewardForm.max_discount) || 0` (ô chỉ hiện khi chọn %; server lưu số), rồi phép tĩnh
     khớp đúng biểu thức đó. Hoặc D1b dựng thân lệnh gửi từ chính chuỗi trong Settings.jsx.
3. cong_cu/thu_P26c.js:570 và viec/P26c/trang_thai.md:223 (K1) — ghi "quà … tạo bằng ĐÚNG thân màn hình gửi". Sai: thân lệnh ở
   thu_P26c.js:572 là gõ tay.

NGHI NGỜ:
- thu_P26c.js:341 (A7c): phép tĩnh chỉ đòi có chuỗi `parseInt(pkgForm.total_qty) >= 1` trong savePkg. Một dòng suông không `return`
  vẫn xanh. Nhẹ, vì server đã chặn (A7a/A7b).
- bat_bien.js:188 (I11) và :303 (I18) bỏ qua MỌI dòng hoan_goi, không chỉ của đơn mua gói. Nếu sau này hoan_goi bị ghi nhầm trên đơn
  thường thì chỉ I19 bắt được, và chỉ khi đơn còn. Đơn mua gói đã xoá thì dòng hoan_goi không có quy tắc đối soát nào (Phát hiện 6) —
  điều 5 trong định hướng chủ quán vẫn còn lỗ.
- server/utils/tienDaTra.js:527-531: trần đền mã giảm-1-món tra discount_scope theo mã HIỆN TẠI. Nếu chủ đổi phạm vi mã (PUT
  discount-codes.js:232) sau khi bán, trần quay về chia đều (lỗi 3 vòng 1 trở lại). Chưa đọc PUT xem có cho đổi discount_scope không.
- Thẻ hội viên ở GOI_THE_KHONG_DEN (damages.js:77) không có ca thử riêng — B1e chỉ thử dòng gói.

Kiểm từng lỗi vòng 1:
- Lỗi 1: đã xử lý cho nhánh SX báo lỗi thật — C2f ở thu_P26c.js:522-532 đỏ dưới VS-C2. Nhưng sinh lỗi mới (Lỗi 1 ở trên).
- Lỗi 2: đúng — damages.js:77-79. Đơn mua gói có món thường thì vẫn đền được: ca tự dựng SOAT2b → 200, SOAT2c tổng nhận ≤ 120.000.
- Lỗi 4: đúng — orders.js:1301-1315 tách dòng hoan_goi không đụng total_spent. A5c2 kiểm sổ; I18 bỏ dòng hoan_goi.
- Lỗi 6: chưa đủ (Lỗi 2 ở trên).
- Lỗi 7: đúng — orders.js:186, có A3b.
- Lỗi 3 và 5: giữ là Câu hỏi 2 / Phát hiện 10. Câu hỏi 2 đã làm theo lời chủ quán (tienDaTra.js:521-532, B1f).
- Câu hỏi 3: packages.js:400-418, có A7a-c. Bật/tắt gói cũ 0 lượt vẫn 200.

K4: grep pos_stock_pending trong orders.js → 9 chỗ (bán :980, huỷ :1465, xoá :1532/:1539/:1542/:1614). Đường bán và huỷ ghi nợ khi có
bất kỳ lỗi nào, còn xoá thì hiểu nợ là "chưa tới" — chưa ai rà chỗ này. Grep hoan_goi → 1 chỗ ghi (orders.js:1309), 2 chỗ trong bất
biến (I11, I18).

K5: các luồng hợp lệ đã thử và vẫn qua: gia hạn gói (A3b); mua gói lấy ngay (A2e); đền món thường trong đơn mua gói (SOAT2b); bật/tắt
gói cũ 0 lượt (A7b); "Chỉ ghi nhận" (B2b, B3b, B4b); quản lý có quyền huỷ đơn mua gói (A5i). Không thấy chặn oan mới. Có một chỗ chủ
quán đã chấp nhận: dòng không được giảm trong đơn có mã giảm-1-món bị trần thấp.

Đường tiền (P3/P4): không có trường tiền nào server tin client. soTienHoan đọc đơn trong giao dịch (tienDaTra.js:543-560); số lượt
gói lấy từ pos_packages (orders.js:380).

P1: dist khớp src (--day-du); client/dist/index.html trỏ tới index-CC9JuO1w.js.

NGHIỆM THU: 25/26 mục có bằng chứng · mục thiếu: D1
- A1 ✓ A1a-c · A2 ✓ A2a-e · A3 ✓ A3, A3b · A4 ✓ · A5 ✓ A5a-k · A6 ✓ A6a-c
- B1 ✓ B1a-f · B2 ✓ (+ thu_P26b C1e) · B3 ✓ · B4 ✓ · B5 ✓ B5a-d
- C1 ✓ · C2 có ca C2a-f, nhưng hành vi sai ở nhánh hết giờ (Lỗi 1) · C3 ✓ · C4 ✓ · C5 ✓ (+ KB32)
- D1 ✗: bài không bắt được màn hình gửi sai (Lỗi 2) · D2 ✓ · D3 ✓ · D4 ✓ · D5 ✓
- E1 ✓ I18/I19 + c.mong · E2 ✓ ngưỡng 32/18, mỗi lượt ≤ 33,4 s (tôi đo; hồ sơ không ghi số đo sau vá) · E3 ✓ (tôi chạy 8 đột biến
  vòng 2; hồ sơ ghi 87/87 + 7)
- G ✓ A1a, B3a/b, C5, A5c, A3 · H ✓ --day-du 66/0/0, thu_P26b 66, thu_gia_lap xanh

CHƯA SOÁT ĐƯỢC: Không chạy lại đủ viec/P26c/dot_bien.py (khoảng 94 đột biến) và các bộ đột biến cũ (LUOI-1, TACH-GL, P26b) — chỉ chạy 8.
Không xem dữ liệu production: gói 0 lượt đang bật, mã giảm-1-món đang dùng, nợ kho đang pending. Không có SX thật để xác nhận SX bỏ
lệnh trùng vân tay — dựa vào chú thích ở sxApi.js:155-157. thu_P20, thu_P26a chỉ chạy qua --day-du.

BÀI HỌC:
- KHOÁ: ca C2 "SX đã làm nhưng báo hết giờ" — SX giả ghi nhận rồi mới ném lỗi. Bán → xoá, và bán → huỷ → xoá: SX ròng = 0 khi tính cả
  việc SX bỏ lệnh trùng vân tay. Thêm đột biến bắt việc đánh huy nợ out ở đơn completed.
- KHOÁ: D1 — phép tĩnh khớp đúng biểu thức gửi, hoặc ca động lấy thân lệnh từ Settings.jsx. Thêm đột biến đảo nhánh
  `percent ? 0 : …` và phải bắt được.
- NGUYÊN TẮC (K1/K4): "lỗi gọi ra ngoài" không có nghĩa là "bên kia chưa làm". Hết giờ là trạng thái chưa biết. Mọi quyết định huỷ /
  bỏ một vế dựa trên dòng nợ phải xét cả "đã làm mà báo lỗi". Khi gửi lại vốn vô hại (có vân tay), đừng thay nó bằng huỷ.
- NGUYÊN TẮC (K1): hồ sơ ghi ca "theo đúng thân màn hình gửi" thì bài phải ĐỌC thân đó từ mã nguồn — gõ tay là khẳng định không có
  căn cứ.
```

## Xử lý soát vòng 2 (vòng sửa 2/3)
| Lỗi | Xử lý | Bằng chứng |
|---|---|---|
| 1 C2 khi SX "đã làm mà báo hết giờ" → xoá đơn làm SX thiếu vĩnh viễn (HỒI QUY P26c) | KHÔNG tự sửa — cách đúng + đơn giản nhất trái chữ C2 / H6 của phiếu → **Câu hỏi 4** | — |
| 2 D1 phép tĩnh để lọt đảo nhánh `percent ? 0 : …` | `Settings.jsx` gửi `max_discount: parseInt(rewardForm.max_discount) \|\| 0` (ô chỉ hiện khi %; máy chủ chỉ áp trần cho mã %, orders.js:614–624); D1a khớp ĐÚNG biểu thức đó | VS-D1-marker-suong, VS-D1-dao-nhanh-percent, BV-D1-bo-gui-max BẮT |
| 3 K1 "tạo bằng ĐÚNG thân màn hình gửi" | sửa câu ở `thu_P26c.js` (D1b) và dòng bảng vòng 1: thân lệnh GÕ TAY, giá trị màn hình gửi do D1a khoá; D1b xanh cả trên gốc | — |
| Nghi ngờ A7c dòng suông | phép tĩnh đòi `if (!(…>= 1)) { … return; }` | VS-A7c-khong-return BẮT |
| Nghi ngờ I11 / I18 bỏ qua mọi `hoan_goi`; đơn mua gói đã xoá | giữ — Phát hiện 6 (đề xuất DOI-SOAT-1) | — |
| Nghi ngờ trần mã 1 món theo `discount_scope` HIỆN TẠI | Phát hiện 16 | — |
| Nghi ngờ thẻ ở `GOI_THE_KHONG_DEN` không ca riêng | Phát hiện 17 (cùng điều kiện `product_id < 0`, ca gói B1e + đột biến BV-B1-den-dong-goi phủ điều kiện) | — |
thu_P26c head 74 đạt · 0 hỏng; trên gốc `b9b3928` 20 đạt · 54 hỏng (bang_chung_do.txt).

## Câu hỏi (vòng 2)
4. **[ĐÃ TRẢ LỜI 12.10 — chủ quán chọn (a); làm ở vòng sửa 3]** **C2 — xoá đơn và nợ kho SX khi SX "đã làm mà báo lỗi / hết giờ"** (soát vòng 2 lỗi 1, HỒI QUY do P26c). POS coi SX lỗi khi quá 8 s
   không trả lời (`sxApi.js:41-61`) dù SX có thể ĐÃ trừ kho; dòng nợ `out` vẫn `pending`. Bản P26c hiện nay hiểu "nợ out pending =
   hàng chưa tới SX" → xoá đơn đánh `huy` nợ out và KHÔNG gửi in → nếu SX thật ra đã trừ thì SX thiếu 1 vĩnh viễn (agent soát chạy
   thật, SX giả "làm rồi mới báo lỗi": HEAD SX ròng −1, gốc 0). Ba cách:
   - **(a) Đề xuất — giữ cách cũ của xoá đơn**: xoá vẫn gửi `in` và để sổ nợ đẩy cả out lẫn in; SX bỏ lệnh trùng vân tay
     (`sxApi.js:155-157`) nên ròng luôn = 0 dù SX đã làm hay chưa. Đơn giản nhất (bỏ `boQuaKho`, `replace(':out:', ':in:')`, câu tra
     thêm). Đổi lại: nợ kho của đơn đã xoá VẪN tự đẩy (trái chữ C2 "KHÔNG còn bị tự đẩy"); I7 đã chấp nhận vân tay của đơn đã xoá khi
     qua đúng một dòng nợ đã xong (H6).
   - (b) Giữ `huy` nhưng chỉ khi chắc SX chưa làm — POS không biết được (cần SX trả lời tra vân tay — ngoài phạm vi, việc SX).
   - (c) Xoá đơn có nợ kho chưa xong → chặn (400 "đẩy sổ nợ trước rồi xoá") — chặn luồng hợp lệ khi SX đang lỗi.
   Máy KHÔNG tự chọn. Chọn (a) thì C2 phần nợ kho của phiếu đổi thành "xoá đơn không làm SX lệch (ròng 0), kể cả khi SX báo lỗi".

## Phát hiện (thêm, vòng 2)
16. Trần đền mã giảm 1 món tra `discount_scope` theo mã HIỆN TẠI (`tienDaTra.js`) — chủ đổi phạm vi mã sau khi bán thì trần về chia
    đều. Làm đúng cùng P26d (ghi giảm theo dòng lúc bán). Chưa đọc PUT `discount-codes.js` xem có cho đổi phạm vi.
17. Báo sự cố trên dòng THẺ hội viên (`product_id ≤ −1000000`) bị chặn cùng điều kiện `product_id < 0` với dòng gói; chỉ có ca thử
    cho dòng gói (B1e).

## Làm tiếp — vòng sửa 3/3 (chủ quán trả lời Câu hỏi 4 = (a), 12.10)
- Bước 1: HEAD `38eb298` · FETCH_HEAD `38eb298` (bằng nhau). `git log --oneline -3`:
  ```
  38eb298 P26c: chep bao cao soat vong 2, xu ly vong 2, Cau hoi 4 (C2 no kho khi SX bao het gio), Phat hien 16-17
  1131cbf P26c soat v2: bang chung do thu_P26c chay lai
  c5192d4 P26c soat v2: dot bien D1 dao nhanh, A7c khong return
  ```
- **Cách hiểu C2 / H6 (chủ quán chốt):** mục tiêu là **kho SX ròng đúng trong MỌI trường hợp**, KHÔNG phải "nợ kho của đơn đã xoá
  không được đẩy". Xoá đơn giữ cách cũ: vẫn gửi `in`, sổ nợ đẩy cả `out` lẫn `in`; SX bỏ lệnh trùng vân tay (`sxApi.js:155-157`)
  nên ròng = 0 dù SX đã làm hay chưa, đã báo lỗi hay hết giờ. Phần mã bill của C2 (xoá mã chưa dùng, H5) giữ nguyên.
- **Sửa:** `orders.js` xoá đơn — gỡ khối huỷ nợ `out` + `boQuaKho` (−21 dòng), thêm 2 dòng chú thích lý do ở chỗ gửi `in`.
- **Bài thử:** `thu_P26c` SX giả 3 chế độ (`loi` / `song` / `het_gio` = làm rồi mới báo lỗi) + bỏ trùng vân tay; ca C2b, C2e, C2f,
  C2g, C2h, C2i đo SX RÒNG của đơn = 0 sau khi đẩy sổ nợ tới hết (`doSoNo`). Trên HEAD `38eb298` (trước vòng 3): **74 đạt · 2 hỏng —
  đúng C2g (bán hết giờ → xoá) và C2h (bán hết giờ → huỷ lỗi → xoá), SX ròng −1**; sau sửa 76 / 76. Trên gốc `b9b3928` các ca C2 ròng
  XANH (gốc gửi đủ out + in — đúng như cách (a) giữ lại) → canh hồi quy. Ca C2d cũ (kiểm "nợ in VẪN chờ đẩy" bằng dữ liệu tay) thay bằng
  các ca ròng (đo kết quả, không đo cách làm).
- **Giả lập:** KB27 về mong đợi cũ — xoá đơn bán lúc SX lỗi → 2 dòng nợ chờ đẩy (out lúc bán + in lúc xoá); I7 chấp nhận vân tay của
  đơn đã xoá khi qua đúng một dòng nợ ĐÃ xong (giữ thay đổi ở I7). 32 KB · 18 bất biến · ĐẠT.
- **Đột biến C2:** bỏ BV-C2-bo-huy-no-out, VS-C2-huy-out-khong-xet-in, VS-C2-huy-ca-no-in-da-toi-sx, VS-C2-khong-huy-no-in-cung-mon,
  VS-C2-van-gui-in (neo vào khối đã gỡ — chủ quán chốt bỏ cách làm đó). Thêm **VS-C2-xoa-huy-no-out** (đưa ĐÚNG lỗi vòng 2 trở lại:
  xoá đánh huy nợ out + bỏ gửi in → ✗ C2g) và **BV-C2-xoa-khong-gui-in** (xoá không gửi in → ✗ C2b). Đều BẮT.
