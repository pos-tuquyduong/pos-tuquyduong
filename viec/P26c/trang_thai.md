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
