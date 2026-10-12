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
1. **`## Bài thử cũ sửa` cho `cong_cu/thu_P26b.js`** — bài đã có, sửa 3 ca (thêm `refund_amount`, mục trên) và vẫn XANH trên code
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
