# GOI-2 — trạng thái

## Bước 1 — đối chiếu bản chụp
- Lượt 1 (14.10.2026): nhánh `viec/GOI-2`, cây sạch. HEAD `be1a404` = FETCH_HEAD `be1a404` → không kéo.
  ```
  be1a404 PHIEU: GOI-2
  65206b6 TIEN-DO: GOI-1 xong (28f65d1), LUOI-2 xong (c591b9e), mo GOI-2 + TOC-DO-1, them SO-LUONG-1 — so v29
  c591b9e Merge pull request #18 from pos-tuquyduong/viec/LUOI-2
  ```
- Lượt 2 (`tiep`, 14.10.2026 04:52 UTC): HEAD `b313af9` = FETCH_HEAD `b313af9` → không kéo.
  ```
  b313af9 GOI-2: ke hoach sua theo soat (so dong, duong bam 4 them ngay, ca bo sung, Q-F neo P26c)
  9bcab1c GOI-2: ke hoach (cho duyet) + trang thai, cau hoi Q-A..Q-E
  be1a404 PHIEU: GOI-2
  ```
- **Đổi model giữa phiên:** 14.10.2026 04:52 UTC, đầu bước 2 của lượt `tiep` (sau khi kế hoạch đã duyệt, trước khi viết bài thử) — máy
  chuyển từ Opus 5.5 sang Fable 5.1. Toàn bộ bài thử, code, đột biến của lượt này do bản sau viết.

## Bước 3 — kế hoạch: `ke_hoach.md` — ĐÃ DUYỆT (chủ quán 14.10)
Chủ quán chốt 6 câu hỏi: **Q-A** ví mẹ trước (tối đa phần mẹ đã trả), còn lại vào ví khách, trần cộng dồn theo đơn · **Q-B** đơn còn nợ
→ chặn "Hoàn phần còn lại", "Không hoàn" vẫn được · **Q-C** cho huỷ / xoá đơn lấy hàng nhưng KHÔNG cộng túi về gói đã kết thúc (làm
trong GOI-2, có ca thử) · **Q-D** khớp demo · **Q-E** hằng số có tên trên máy chủ · **Q-F** dựng lại 3 (thực tế 4) đột biến P26c trong bộ GOI-2.

### Khác kế hoạch đã duyệt (ghi rõ, không lan)
- Tìm tên / SĐT làm **tại màn** trên danh sách máy chủ đã lọc (kế hoạch ghi `q=` ở máy chủ): tránh gọi Render mỗi phím gõ; A1 "tìm theo
  tên lẫn SĐT" khoá bằng phép tĩnh soi đúng biểu thức lọc (B1g) — cùng cách GOI-1 A4b đã làm.
- Dòng khách có thêm `so_dang_dung` (số gói đang dùng) bên cạnh `so_goi` (tổng) — dòng "Gói đang dùng: N gói" ở Khách hàng cần N = đang dùng.
- Thẻ thống kê tab Gói SP đổi theo dòng khách: Khách · Gói · Còn lại (túi) · Lâu chưa lấy; bỏ thanh tiến độ và "DT gói" (tính theo gói,
  không còn hợp với bảng theo khách). Chủ quán xem màn thật — không đúng ý thì nói, sửa nhỏ.

## Bước 4 — bài thử trước (K3)
- Thêm mục B1–B7 (46 ca) vào `cong_cu/thu_GOI1.js`; đổi có chủ ý 4 phép tĩnh GOI-1 vì màn đổi theo Q1/Q2/Q4 (không phải ca hồi quy
  thêm vào bài xanh — mỗi ca đổi ĐỎ trên gốc, XANH sau vá):
  - A4b: lọc gói nay gửi `goi` lên máy chủ (`qs.set('goi', goiLoc)` thay `package_id) === goiLoc`); Link tên khách dùng `kh.customer_phone`.
  - A4b2: lần lấy gần nhất của KHÁCH là `kh.moc_lay` (máy chủ) thay nút sắp "Lâu chưa lấy" `(p.last_delivery_at || p.created_at)`.
  - A4c2: mặc định luôn `'dang_dung'` (Q2) thay `goiLoc ? 'active' : 'all'`.
  - A5h: nút kết thúc + hộp xác nhận thay `window.prompt` / "Dừng gói".
- `bang_chung_do.txt`: chạy trên bản GỐC (server/ + client/src của `b313af9`, bản sao ở thư mục nháp): **55 đạt · 46 hỏng**, thoát 1.
  Sau vá: **101 đạt · 0 hỏng** → `SỐ CA cong_cu/thu_GOI1.js: 101`. Bài thử đổi 2 lần sau lần ghi đầu (B3c lấy 10/30, thêm B3e2, B3o, soDong
  theo ví, B1f dựng gói riêng) → chạy lại cả gốc lẫn vá, chép lại cả hai (A16).
- Ca xanh cả gốc lẫn vá (đúng chủ ý, K5): B3g (403 / 400 có sẵn), B3j (chưa có dòng hoàn), B7a–B7e, B7h, B7j.
- Đột biến P26c dựng lại trong bộ GOI-2 chạy bằng `thu_P26c.js` (A5c2) và `thu_P26b.js` (M2, M3) — ca cũ, không thêm.

## Bước 5 — sửa code (file:dòng đọc sau khi vá)
| File | Sửa |
|---|---|
| `server/utils/goiKhach.js:40–72` | `NGAY_LAU_CHUA_LAY = 30` (Q-E); `gomTheoKhach` (một khách một dòng: `so_goi`, `so_dang_dung`, `con_lai`, `moc_lay`, `ngay_chua_lay`, `lau`, `goi[]`); `LOC_KHACH` (dang_dung · lau · xong); `goiDaKetThuc` + `LOI_GOI_DA_KET_THUC` (A4) |
| `server/utils/tienDaTra.js:66–91` | `soTienHoanGoi(tx, cp)`: giá đã trả ÷ số gói trên dòng × túi còn ÷ tổng, làm tròn xuống; đơn không `completed` → `GOI_KHONG_CO_DON_MUA`; nợ → `DON_CON_NO` (Q-B); trần cộng dồn theo đơn (I19); mẹ trước có trần, ví khách có trần, còn lại tiền mặt (Q-A) |
| `server/routes/wallets.js:79–95, 322` | `ghiHoan` — MỘT hàm ghi khoản hoàn (dòng `cash` + total_spent · dòng `hoan_goi` · ví mẹ) cho cả huỷ / xoá đơn lẫn kết thúc gói |
| `server/routes/orders.js:27, 29, 1334–1335` | `hoanVi` chỉ còn tính rồi gọi `ghiHoan` (chuỗi ghi chú giữ nguyên) |
| `server/routes/orders.js:1388–1392, 1545–1548` | A4: huỷ (sau cổng `status='completed'`) và xoá (trong nhánh `completed`) đơn mua có gói `cancelled` → 400 `GOI_DA_KET_THUC` |
| `server/routes/orders.js:1442, 1577` | Q-C: hai UPDATE trả túi thêm `AND status != 'cancelled'` |
| `server/routes/packages.js:9–11, 168–177` | import; `SQL_GOI_KHACH` + `SAP_GOI_KHACH` dùng chung cho `/all` và `/theo-khach`; thêm `ob.code AS order_code` |
| `server/routes/packages.js:189–204` | `GET /customer-packages/theo-khach`: nắn Q3 (`WHERE status='active' AND delivered_qty >= total_qty`), lọc `loc`/`goi`/`phone`, gom |
| `server/routes/packages.js:206–215` | `GET /customer-packages/:id/hoan-du-kien` (quyền `refund_package`) — số hiện TRƯỚC khi xác nhận, cùng `soTienHoanGoi` |
| `server/routes/packages.js:237–276` | `PUT …/cancel` thành Kết thúc gói: `hoan` (mặc định không hoàn = GOI-1), MỘT giao dịch (`trongGiaoDich`), đối chiếu `so_tien` → 409 `GOI_HOAN_DOI_SO`, cổng `status='active' AND delivered_qty < total_qty`, `ghiHoan` kèm `#<cp.id>` + mã đơn, notes `Kết thúc gói (hoàn <n>đ \| không hoàn): …` |
| `client/src/pages/Reports.jsx` | tab Gói SP: gọi `theo-khach` (loc + goi + phone), 3 nút lọc, tìm tại màn, bảng mỗi khách một dòng → mở gói → mở lịch sử giao; nút "Kết thúc gói…" trong phần mở của gói active còn túi + hộp 2 lựa chọn + lý do + lỗi tại chỗ; Link đơn mua / lần giao `?code=&ngay=`; `TRANG_THAI` Đã xong / Đã kết thúc |
| `client/src/pages/Customers.jsx:8–9, 144–150, 715–722` | `goiDangDung` từ `theo-khach?phone=`; dòng "📦 Gói đang dùng: N gói · còn X túi →" → `/reports?tab=packages&phone=` (chỉ khi N > 0) |
| `client/src/pages/Orders.jsx:13, 25–31, 50` | `useSearchParams`: `?code=` → ô tìm; `?ngay=` → `dateFrom = dateTo` (preset `custom`) |
| `client/src/pages/Settings.jsx:1154` | tên gói là `Link` → `/reports?tab=packages&goi=<id>` (thuộc tính `style` trước `to` để không trùng neo GOI-1 "🔒 N KH") |
| `client/dist/**` | build lại (P1) — `--day-du` báo dist KHỚP src |

Số dòng (`git diff --numstat`): máy chủ +180 / −41 (gồm chú thích), màn hình +146 / −99, bài thử +375 / −12. Ngân sách phiếu ~200–300 code
+ ~250 thử: code sát mép trên vì chú thích đầu hàm dài (soTienHoanGoi, ghiHoan, route), bài thử vượt ~120 dòng do 46 ca có số cụ thể.

## Bước 6 — kiểm
- `node cong_cu/thu_GOI1.js`: 101 đạt · 0 hỏng. `thu_P26c.js` 84/0, `thu_P26b.js` 66/0 (chạy riêng).
- `(cd client && npm run build)` rồi `node kiem_tra_truoc_khi_giao.js --day-du`: **PASS 67 · FAIL 0 · CẢNH BÁO 0**, dist KHỚP src.
- `python3 viec/GOI-2/dot_bien.py`: **59 đột biến bị bắt · 0 KHÔNG bị bắt** (chạy đủ sau lần sửa cuối).
- Tự rà: không còn `dungGoi`, `pkgSort`, `window.prompt` trong Reports.jsx; `/all` vẫn dùng chung câu SELECT (không ai khác gọi ngoài
  Reports trước đây — grep `client/src`); `ghiVi` vẫn dùng ở `orders.js:840` (trừ số dư); `hoan_du_kien` không có `don` khi trả ra.

## Chỗ vá → đột biến (A17, A18) — mỗi chỗ ≥ 1 VS + 1 BV
| Chỗ vá | VS (vá sai) | BV (bỏ vá) |
|---|---|---|
| gom theo khách, còn lại | VS-GOI2-CON-LAI-GOM-KET-THUC | BV-GOI2-GOM |
| lâu chưa lấy (ngưỡng, mốc) | VS-GOI2-LAU-GE · VS-GOI2-MOC-CHI-NGAY-MUA | BV-GOI2-LAU |
| 3 lọc máy chủ | VS-GOI2-LOC-XONG-CHI-KHACH-HET | BV-GOI2-LOC · BV-GOI2-LOC-GOI · BV-GOI2-LOC-PHONE |
| mã đơn mua trong dòng gói | — | BV-GOI2-ORDER-CODE |
| nắn Q3 | VS-GOI2-NAN-GT | BV-GOI2-NAN · BV-GOI2-CONG-DU |
| tính hoàn (giá đã trả, chia số gói) | VS-GOI2-HOAN-GIA-NIEM-YET · VS-GOI2-HOAN-KHONG-CHIA-SO-GOI | BV-GOI2-HOAN |
| chia ví mẹ / ví / tiền mặt (Q-A) | VS-GOI2-ME-KHONG-TRU-DA-HOAN · VS-GOI2-VI-KHONG-TRU-DA-HOAN · VS-GOI2-VI-TRUOC-ME · VS-GOI2-TIEN-MAT-GIAM-TOTAL-SPENT | BV-GOI2-ME |
| nợ (Q-B), đơn mua hiệu lực | — | BV-GOI2-NO · BV-GOI2-DON-MUA |
| đối chiếu `so_tien` | VS-GOI2-TIN-SO-TIEN-CLIENT | BV-GOI2-409 |
| quyền | VS-GOI2-DU-KIEN-KHONG-QUYEN · VS-GOI2-KET-THUC-QUYEN | — |
| cổng một lần | — | BV-GOI2-CONG · BV-GOI2-CONG-CHANGES |
| notes / ghi chú đối soát | VS-GOI2-NOTES-KHONG-SO · VS-GOI2-GHI-CHU-KHONG-MA-GOI | — |
| A4 chặn huỷ / xoá | VS-GOI2-CHAN-QUEN-XOA (K4) · VS-GOI2-CHAN-MOI-GOI (K5) · VS-GOI2-CHAN-XOA-MOI-TRANG-THAI (K5) | BV-GOI2-CHAN-HUY |
| Q-C không trả túi | VS-GOI2-TRA-TUI-CHI-ACTIVE (K5) | BV-GOI2-TRA-TUI-HUY · BV-GOI2-TRA-TUI-XOA |
| P26c dựng lại (Q-F) | VS-H2-khong-ghi-hoan-goi · VS-H2-hoan-goi-giam-total-spent · VS-me-hoan-gap-doi-huy · VS-me-hoan-gap-doi-xoa | — |
| Reports.jsx | VS-GOI2-LOC-MAC-DINH · VS-GOI2-TRANG-THAI-CU · VS-GOI2-NUT-KHONG-QUYEN · VS-GOI2-NUT-GOI-DU · VS-GOI2-HOP-KHONG-BAT-CHON · VS-GOI2-HOP-KHONG-LY-DO | BV-GOI2-URL-PHONE · BV-GOI2-LOC-THEM-TAT-CA · BV-GOI2-TIM-TEN · BV-GOI2-SO-TIEN-KHONG-GUI · BV-GOI2-LOI-KHONG-HIEN · BV-GOI2-LINK-DON-MUA |
| Settings / Customers / Orders | VS-GOI2-KH-HIEN-CA-0-GOI · VS-GOI2-ORDERS-KHONG-DOC-NGAY | BV-GOI2-LINK-TEN-GOI · BV-GOI2-KH-DONG-GOI · BV-GOI2-ORDERS-KHONG-DOC-CODE |

Tổng 59 tên, tất cả BẮT. Đột biến đã viết rồi BỎ: `VS-GOI2-GHI-NGOAI-GD-TRUOC-CONG` (ghi ví ngoài giao dịch trước cổng) — trên libsql
cục bộ nó làm bài thử SẬP ngay ca mua gói (409 KHO_BAN) chứ không tới B3i; không đo được → ghi CHƯA KIỂM, không đếm.

### Neo đột biến cũ lạc vì GOI-2 (cố ý đổi hành vi — không sửa `viec/GOI-1/`, `viec/P26c/`)
- GOI-1 (7): `VS-GOI1-DUNG-QUYEN` → GOI-2 `VS-GOI2-KET-THUC-QUYEN` · `VS-GOI1-DUNG-DUA` → `BV-GOI2-CONG` · `VS-GOI1-LOC-GOI` → `BV-GOI2-LOC-GOI`
  · `BV-GOI1-TIM-TEN` → `BV-GOI2-TIM-TEN` · `BV-GOI1-DANG-GIAO` → `VS-GOI2-LOC-MAC-DINH` · `VS-GOI1-SAP-CHUA-LAY` → `VS-GOI2-MOC-CHI-NGAY-MUA`
  · `BV-GOI1-NUT-LYDO` → `VS-GOI2-HOP-KHONG-LY-DO`. 42 đột biến GOI-1 còn lại neo vẫn khớp (so bằng script nháp trên gốc và bản vá).
- P26c (4, Q-F): `VS-H2-khong-ghi-hoan-goi`, `VS-H2-hoan-goi-giam-total-spent`, `VS-me-hoan-gap-doi-huy`, `VS-me-hoan-gap-doi-xoa` — dựng lại
  cùng tên trong `viec/GOI-2/dot_bien.py` trên `wallets.js`, bắt bằng chính `thu_P26c.js` / `thu_P26b.js`.

## Quy tắc đối soát "Kết thúc gói có hoàn" (A9 — chỉ ghi, DOI-SOAT-1 làm màn)
- Mỗi ngày: Σ `amount` các dòng `pos_balance_transactions` loại `refund` có ghi chú bắt đầu `Hoàn kết thúc gói KH #` (+ dòng mẹ
  `Hoàn tiền mẹ kết thúc gói KH #`) trong ngày = Σ số `<n>` trong notes `Kết thúc gói (hoàn <n>đ): …` của các gói `cancelled` có
  `updated_at` trong ngày.
- Mỗi gói đã kết thúc có hoàn: Σ dòng ví ghi `#<cp.id>` = `<n>` trong notes của gói đó, đúng một lần (cổng `status = 'active'`).
- Mỗi đơn mua gói: I19 (hoàn + đền ≤ total − nợ) và I11 (mỗi ví: hoàn trừ `hoan_goi` ≤ ví đó đã trả) — bài thử B3j / B7j chạy hai bất biến
  này trên kho thử sau mọi ca hoàn.
- Tuần / tháng: cộng các ngày; lệch → xem từng gói theo `#<cp.id>`.

## Câu hỏi
(đã chốt hết ở lượt 1 — không còn câu hỏi mở)

## Phát hiện (ngoài phạm vi — không sửa)
- `viec/HOC-2b/kiem_neo.py` chỉ phủ AUDIT-1, P26b, HOC-1, HOC-2, TU-CHAY-4, HOC-2b — KHÔNG phủ GOI-1, P26c, LUOI-2, AUDIT-2. Neo lạc của
  GOI-1 / P26c do GOI-2 chỉ thấy nhờ script nháp. Đề xuất: thêm 4 bộ đó vào `kiem_neo.py` (file ngoài Phạm vi).
- P26b có 9 neo lạc TỪ TRƯỚC (gốc `b313af9` cũng hỏng: `me-huy-hoan-gap-doi`, `me-xoa-hoan-gap-doi`, 5 neo `refunds.js`, 2 neo `damages.js`);
  HOC-2b 2 neo `refunds.js`; HOC-2 1 neo `tu_chay/PHIEN_BAN` — `kiem_neo.py` đang báo, không phải do GOI-2.
- `orders.js` huỷ / xoá đơn lấy từ gói vẫn `console.log` "hoàn lại −N SP" cả khi UPDATE không đổi dòng (gói đã kết thúc, Q-C) — chỉ là log.
- Sales.jsx:376 đọc `/packages/customer/:phone` bằng `fetch` trần (có từ trước, bánh cóc đang đếm) — sau nắn Q3 thấy gói đủ là `completed`
  (đúng: không lấy thêm được).

## Bước 8 — soát độc lập (`/ra-soat`, agent general-purpose, HEAD `b2a9696`) — chép nguyên
```
ĐẠT (có điều kiện: 0 lỗi tiền; 6 nghi ngờ / chỗ gọn hơn dưới đây nên ghi vào Phát hiện hoặc hỏi chủ quán — không chặn giao)

Đã tự chạy trên HEAD b2a9696 (cây sạch): `node cong_cu/thu_GOI1.js` → 101 đạt · 0 hỏng; `node kiem_tra_truoc_khi_giao.js --day-du` → PASS 67 · FAIL 0 · CẢNH BÁO 0, "dist đã commit KHỚP với src"; `node cong_cu/thu_P26c.js` → 84/0; `python3 viec/GOI-2/dot_bien.py VS-GOI2-TIN-SO-TIEN-CLIENT BV-GOI2-CONG BV-GOI2-CHAN-HUY VS-GOI2-CHAN-XOA-MOI-TRANG-THAI BV-GOI2-ME` → 5/5 BẮT; `python3 viec/HOC-2b/kiem_neo.py` → đúng như trang_thai (P26b 9, HOC-2 1, HOC-2b 2 lạc từ trước; AUDIT-1 2 HỎNG là neo tự-kiểm cố ý `CHUOI_KHONG_CO_TRONG_FILE_AUDIT1`, viec/AUDIT-1/dot_bien.py:36–38, không do GOI-2).

LỖI TÌM ĐƯỢC:  (không có lỗi tiền / chặn nhầm xác nhận được)
- server/utils/goiKhach.js:52–56 — `new Date(moc)` trên chuỗi `created_at` dạng getNow() (helpers.js:134–136: giờ VN, không có `Z`) → Node trên Render (TZ UTC) hiểu là UTC → mốc trễ 7 giờ thật → `ngay_chua_lay` có thể THIẾU 1 ngày quanh ngưỡng 30 (gói đúng 31 ngày hiện 30 trong 7 giờ đầu ngày). Bài B1c (thu_GOI1.js:495–505) tạo mốc bằng `toISOString()` cùng quy ước với máy thử nên không lộ. — K7 (định dạng thời gian theo trí nhớ) / K3 (ca ngay trên-ngay dưới đo trên máy TZ khớp). Nhỏ, không đụng tiền.
- server/routes/packages.js:194 — GET `theo-khach` chạy `run(UPDATE …)` NGOÀI giao dịch, trong route chỉ `authenticate`: (a) GET có tác dụng phụ ghi, gọi cả khi mở chi tiết khách (Customers.jsx:147); (b) kho bận (SQLITE_BUSY lúc quầy đang ghi) → catch trả 500 `err.message` (dòng 204) thay `loiGhi` 409 KHO_BAN, Reports.jsx:67 chỉ `console.error` → bảng im lặng không đổi. — K6/K7. Cách gọn: bọc `loiGhi(res, err)` như route cancel; hoặc chạy nắn Q3 một lần (kế hoạch đã duyệt phương án này nên chỉ ghi nhận).
- viec/GOI-2/ke_hoach.md:77,131 ghi "thu_P26c.js 93/93" — thực tế file không đổi và chạy ra 84 ca (trang_thai ghi đúng 84). Ca "B7f mua gói + lấy ngay 200" trong kế hoạch KHÔNG có trong bài (grep B7f = 0) — được A6f GOI-1 phủ, nhưng trang_thai không nói rõ ca bị gộp. — K1 nhỏ.

NGHI NGỜ:
- K5 dữ liệu cũ (không kiểm được từ đây): gói đã "Dừng" bằng GOI-1 trên production (status cancelled, không hoàn) nay bị A4 chặn huỷ/xoá đơn mua (orders.js:1389, 1545) và không "Kết thúc có hoàn" được (cổng `status='active'`, packages.js:262–263) → KHÔNG còn đường hoàn tiền nào qua máy. Phiếu A4 chốt "cả (a) lẫn (b)" nên đúng phiếu, nhưng chủ quán cần biết gói Dừng từ 13.10 (nếu có) là vĩnh viễn. Tương tự: chọn "Không hoàn" là khoá vĩnh viễn (UI đã ghi "không mở lại được", Reports.jsx:433).
- Gói mà đơn mua không có dòng `product_id = -package_id` (dữ liệu trước quy ước, nếu có) → `GOI_KHONG_CO_DON_MUA` (tienDaTra.js:77–78) → chỉ "Không hoàn" → rồi bị A4 chặn huỷ. Không rõ production có gói kiểu này không.
- packages.js:245 `hoan = req.body.hoan === true` — client gửi `"true"` (chuỗi) sẽ ÂM THẦM kết thúc không hoàn; client hiện gửi boolean (Reports.jsx:97) nên không lộ; chặt hơn: 400 khi `hoan` không phải boolean.
- Lọc `goi=` làm `so_goi`/`con_lai` của dòng khách chỉ tính gói đó (gomTheoKhach chạy trên danh sách đã WHERE, packages.js:201–203; B1f kiểm `so_goi === 1`) — đúng ý "như 🔒 N KH" nhưng dòng khách đọc như "khách có 1 gói" dù thật có 3.

K3 (bài thử): bang_chung_do.txt chạy trên gốc b313af9 ra 55 đạt · 46 hỏng, mỗi ca đỏ kèm giá trị thật (vd B3a HTTP 404, B4a "HTTP 200 · ví 900000", B3i hai 200); HEAD 101/0 — bài có giá trị. Phép tĩnh B1g/B2c/B5b/B5c/B6a–e (thu_GOI1.js:529–535, 553–555, 726–737, 742–756) soi ĐÚNG biểu thức (`qs.set('goi', goiLoc)`, `useState('dang_dung')`, mảng nút lọc đếm = 3, `checked={ketThuc.hoan === true}`, thứ tự `kt.hoan === null` TRƯỚC `api.put`) và kiểm VẮNG MẶT mẫu cũ (`!/k: 'all'|k: 'near'/`, `!/window\.prompt|Dừng gói/`) → marker suông không qua được. Ca tên và máy kiểm khớp (B1c có ngay trên 31 / ngay dưới 30; B3h 409 kèm `hoan_du_kien.tong`; B3i/B4d Promise.all đo "đúng một 200" + ví). B4a/B4b so nguyên câu thông báo (E12) — phiếu A4 yêu cầu đúng lời nên chấp nhận. Đột biến VS-GOI2-TIN-SO-TIEN-CLIENT thực sự đưa lỗi "tin client" vào (packages.js tienMat = so_tien − me − vi) và B3h bắt — không phải chỉ gỡ phép.

K4 (đường song song, grep lượt này): hoàn ví → orders.js:1334 hoanVi→ghiHoan, packages.js:267 ghiHoan, refunds.js:165–169 ghiVi trực tiếp (đường riêng, đơn có gói đã chặn DON_CO_GOI :118/:157 — không cần sửa), damages.js:184 compensation (tính vào trần `nhan`, tienDaTra.js:83) — 4 chỗ, đủ. Đổi status gói → orders.js:911, 1036 (completed khi lấy đủ), 1403 (huỷ → cancelled), 1408/1562 (xoá), packages.js:194 (nắn Q3), 262 (kết thúc) — 7 chỗ, nhất quán. Trả túi → orders.js:1438–1444, 1573–1579: cả 2 có `AND status != 'cancelled'`. Đọc danh sách gói → packages.js:147 `/customer/:phone` (Sales; KHÔNG nắn, nhưng orders.js:228–234 chặn GOI_HET_LUOT nên vô hại), :179 `/all` (không còn ai gọi trong client/src), :191 theo-khach, :15 countActiveUsers, :26 active_users (dựa nắn Q3 — chỉ chạy sau khi ai đó mở Báo cáo / chi tiết khách).

K5 (luồng hợp lệ qua điều kiện mới — đã đọc code + ca): goiDaKetThuc chỉ khi `cancelBuyPkgs.length` (huỷ) / `status==='completed'` (xoá) → huỷ/xoá đơn mua chưa kết thúc (B7a,b), xoá đơn đã huỷ (B7c), huỷ lần hai lời cũ (B7d), đơn không gói không bị đụng ✓. `status != 'cancelled'` ở trả túi → gói completed về active (B7h) ✓. Cổng `delivered_qty < total_qty` → gói đủ không kết thúc được (đúng Q3), gói tổng 0 (nếu có dữ liệu cũ) cũng không — GOI-1 A1c đã cấm tổng 0 nên chỉ dữ liệu rất cũ. DON_CON_NO / GOI_KHONG_CO_DON_MUA chỉ chặn nhánh `hoan: true`, "Không hoàn" vẫn 200 (B3n, B3o) ✓. 409 so_tien chỉ khi client gửi `so_tien` ✓. Nắn Q3 `>=` giữ 4/5 active (B2a) ✓. Mua gói + lấy ngay: A6f ✓.

Đường tiền: `so_tien` chỉ ĐỐI CHIẾU (packages.js:255–259), số ghi là `tien.*` từ soTienHoanGoi (tienDaTra.js:75–91) — không tin client ✓. Trần: `tong = min(goc, total − Σ(refund+compensation của đơn))` (:82–86, = I19); mẹ ≤ parent_balance_amount − đã hoàn mẹ; ví ≤ balance_amount − đã hoàn ví (trừ hoan_goi) (= I11); ca B3l (2 gói cùng đơn) + B3m (đền sau kết thúc) + B3j/B7j chạy BAT_BIEN I11/I19 thật (bat_bien.js:179–191, 310–316). Hai người cùng bấm: một giao dịch ghi `db.transaction("write")` (database.js:1373–1374), cổng UPDATE `changes !== 1` → rollback (B3i, B4d) ✓. Không tìm ra lỗ.

NGHIỆM THU:    9/9 mục có bằng chứng · mục thiếu: không
- A1: B1a–B1h (máy chủ, số cụ thể) + B1g (tĩnh, đúng phần tử) · A2: B2a, B2b, B2c · A3: B3a, B3a2, B3k, B3b, B3c (giảm giá), B3d (2 gói/dòng), B3e/B3e2 (ví mẹ trước), B3l (trần cộng dồn), B3m, B3g, B3h, B3n, B3o, B3i, B3j; ghiHoan dùng chung wallets.js:84–94 gọi từ orders.js:1334 và packages.js:267 · A4: B4a–B4d · A5: B5a (tiền không đổi, chụp sổ ví trước/sau), B5b, B5c · A6: B6a–B6e + B1f (máy chủ lọc goi/phone) · A7: B7a–B7h, P26c 84/0, GOI-1 A1–A6 xanh (A4b/A4b2/A4c2/A5h đổi có chủ ý, đỏ trên gốc) · A8: dist khớp, --day-du 67/0/0, dot_bien 59/59 (tôi chạy lại 5) · A9: trang_thai.md mục "Quy tắc đối soát" (ngày: Σ dòng ví ghi chú `Hoàn kết thúc gói KH #` = Σ `<n>` trong notes; theo gói `#<cp.id>`; I11/I19 theo đơn).

CHƯA SOÁT ĐƯỢC: hành vi màn hình thật (hộp Kết thúc, 4 đường bấm, `?code=&ngay=` mở đúng đơn) — chỉ phép tĩnh; dữ liệu production (gói Dừng GOI-1, gói không có dòng −package_id, total_qty 0); Turso thật khi `run` nắn Q3 đụng giao dịch ghi; 54/59 đột biến không tự chạy lại (tin trang_thai); lệch múi giờ ở ngưỡng 30 ngày không có ca.

BÀI HỌC:
- KHOÁ: thêm ca "ngay trên / ngay dưới" cho ngưỡng THỜI GIAN phải dựng mốc bằng ĐÚNG hàm sinh thời gian của máy chủ (getNow) và chạy với TZ khác UTC — ca B1c hiện khớp quy ước máy thử, không khớp Render (K3 mở rộng: giá trị biên phụ thuộc môi trường).
- KHOÁ (người gác / bộ kiểm): route GET có `run(UPDATE|INSERT|DELETE` → cảnh báo; route ghi mà catch không qua `loiGhi` → cảnh báo (packages.js:194/204 là ca thật).
- NGUYÊN TẮC (K1): con số trong kế hoạch ("P26c 93/93") phải là số vừa chạy, không nhớ từ phiếu trước; ca ghi trong kế hoạch bị gộp/bỏ (B7f, B3f, B4e, B6f–h) phải có dòng "ca X gộp vào Y" trong trang_thai.
- NGUYÊN TẮC (K5 dữ liệu cũ): phép chặn mới theo TRẠNG THÁI (cancelled) phải liệt kê mọi NGUỒN sinh ra trạng thái đó trước đây (Dừng gói GOI-1, huỷ đơn) và nói rõ với chủ quán cái nào trở thành vĩnh viễn.
```

### Sửa sau soát (commit `9e9f2eb`, 3 dòng, không soát vòng 2 — bài thử 101/0, `--day-du` 67/0/0, đột biến 59/59 chạy lại trên HEAD này)
- `server/utils/goiKhach.js:41, 47` — `bayGio` mặc định `new Date(getNow()).getTime()`: cùng quy ước giờ VN không hậu tố với `created_at` của
  đơn / gói → Render (TZ UTC) không còn lệch 7 giờ ở ngưỡng 30 ngày. Ca B1c/B1c2 vẫn xanh (máy thử TZ UTC: mốc UTC, bây giờ VN → chênh +7 h,
  31 d → 31, 30 d → 30). Chưa có ca chạy với TZ khác → CHƯA KIỂM.
- `server/routes/packages.js:204` — `catch (err) { loiGhi(res, err); }`: kho bận lúc nắn Q3 → 409 KHO_BAN (bấm lại), không 500.
- `viec/GOI-2/ke_hoach.md` — "P26c 93/93" → 84/84 (số chạy trên máy này).
- Ca kế hoạch GỘP (không có tên riêng trong bài): B3f → B3e (dòng cash + hoan_goi) · B4e → B4a/B4b (so nguyên câu) · B6f–h → B1g, B6c, B6e ·
  B7f → A6f của GOI-1. Nghi ngờ `hoan` không phải boolean: client gửi boolean (Reports.jsx), ghi Phát hiện. Hai nghi ngờ dữ liệu cũ → mục
  "Lưu ý cho chủ quán" dưới.

### Lưu ý cho chủ quán (dữ liệu thật — máy không kiểm được)
- Gói đã "Dừng gói" bằng GOI-1 (13.10, nếu có) nay là `cancelled` → đơn mua của nó bị chặn huỷ / xoá (A4 "cả (a) lẫn (b)"), và không "Kết
  thúc có hoàn" được nữa → **không còn đường hoàn tiền qua máy** cho gói đó. Muốn hoàn thì chủ quán nạp ví tay + ghi chú.
- Chọn "Không hoàn tiền" cũng là vĩnh viễn như trên (hộp đã ghi "không mở lại được").
- Lọc theo gói (`?goi=` từ Cài đặt): số gói / còn lại trên dòng khách CHỈ tính gói đang lọc (đúng nghĩa "N KH của gói này").

## Bước 10 — báo cáo 7 mục
```
VIỆC:        GOI-2 — Báo cáo gói: mỗi khách một dòng, "Kết thúc gói" (hoàn / không hoàn phần còn lại), 4 đường bấm giữa các màn
ĐÃ SỬA:      server/utils/goiKhach.js:40–74 gomTheoKhach + LOC_KHACH + goiDaKetThuc (NGAY_LAU_CHUA_LAY = 30, bayGio theo getNow)
             server/utils/tienDaTra.js:66–91 soTienHoanGoi (giá đã trả ÷ số gói × túi còn ÷ tổng; nợ → DON_CON_NO; trần cộng dồn; mẹ → ví → tiền mặt)
             server/routes/wallets.js:79–95 ghiHoan (một hàm ghi khoản hoàn cho huỷ / xoá đơn và kết thúc gói)
             server/routes/orders.js:1334 hoanVi gọi ghiHoan · :1388–1392, 1545–1548 chặn GOI_DA_KET_THUC · :1442, 1577 không trả túi về gói cancelled
             server/routes/packages.js:168–177 SQL dùng chung + order_code · :189–204 GET theo-khach (nắn Q3, lọc) · :206–215 GET hoan-du-kien · :237–276 PUT cancel = Kết thúc gói (hoan, 409, một giao dịch)
             client/src/pages/Reports.jsx (tab Gói SP viết lại: dòng khách → gói → lịch sử; hộp Kết thúc gói) · Customers.jsx:8–9, 144–150, 715–722 · Orders.jsx:13, 25–31, 50 · Settings.jsx:1154 · client/dist build lại
BÀI THỬ:     cong_cu/thu_GOI1.js mục B1–B7 (46 ca) + đổi A4b, A4b2, A4c2, A5h. Gốc b313af9 → ĐỎ 46 ca (55 đạt · 46 hỏng; bang_chung_do.txt); sau vá → XANH 101 đạt · 0 hỏng.
             Đột biến viec/GOI-2/dot_bien.py: 59/59 BẮT (gồm 4 đột biến P26c dựng lại — Q-F).
ĐÃ RÀ K4:    grep "ghiVi(" server/routes → hoàn ví 4 chỗ: orders.js hoanVi (→ ghiHoan), packages.js kết thúc (→ ghiHoan), refunds.js duyệt (đơn có gói đã chặn DON_CO_GOI :118/:157), damages.js đền (tính vào trần) — xử lý hết.
             grep "SET status = 'cancelled'\|SET delivered_qty" server/routes/orders.js → chặn A4 ở cả huỷ (:1388) lẫn xoá (:1545); trả túi 2 chỗ (:1442, :1577) đều có AND status != 'cancelled'.
             grep "customer-packages" client/src → chỉ Reports.jsx gọi /all trước đây; nay Reports + Customers gọi theo-khach; Sales.jsx đọc /customer/:phone (không đổi).
CHƯA KIỂM:   - Màn thật trên trình duyệt: hộp Kết thúc gói (radio, lỗi tại chỗ, 409 hiện số mới), 4 đường bấm, ?code=&ngay= mở đúng đơn — chỉ phép tĩnh.
             - Turso production: hai quầy cùng bấm (B3i, B4d chạy trên libsql cục bộ); lệnh nắn Q3 chạy ngoài giao dịch khi quầy đang ghi (có loiGhi → 409).
             - Ngưỡng 30 ngày với TZ khác UTC: đã sửa theo getNow nhưng không có ca chạy TZ=Asia/Ho_Chi_Minh.
             - Cổng "một lần" trong giao dịch: không có đột biến tất định phân biệt cổng trong / ngoài giao dịch (đột biến ghi ngoài giao dịch làm sập libsql cục bộ, đã bỏ); chỉ có BV-GOI2-CONG (bỏ điều kiện) bị A5d bắt.
             - Dữ liệu production: gói Dừng GOI-1, gói mua không có dòng −package_id, total_qty 0 — xem "Lưu ý cho chủ quán".
             - Trần cộng dồn theo đơn (tong ≤ total − đã nhận) là lưới an toàn: không có ca nào làm nó cắn (các khoản hợp lệ cộng lại không vượt total), không có đột biến riêng.
GIT:         9e9f2eb GOI-2: sau soat — moc 'lau chua lay' cung quy uoc gio getNow (Render TZ UTC), theo-khach catch qua loiGhi (409 KHO_BAN), sua so P26c trong ke hoach
             b2a9696 GOI-2: dot bien (59 BAT) + trang thai buoc 4-6
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 2 · BỎ 4 — chi tiết ở ## Bài học
```

### Nghiệm thu — đếm từng mục (bằng chứng = ca trong cong_cu/thu_GOI1.js, chạy trên HEAD 9e9f2eb: 101/0)
- A1: B1a (một dòng, so_goi 3, con_lai 50), B1b (cancelled không cộng), B1c/B1c2 (31 → lau, 30 → không; theo lần lấy), B1d/B1d2/B1d3 (3 lọc, mặc định), B1f (goi / phone), B1h (order_code), B1g (phép tĩnh đúng phần tử: 3 nút, tìm tên + SĐT).
- A2: B2a (5/5 → completed, 4/5 giữ, không mất dòng), B2b (gói đủ chưa nắn → 400), B2c (chữ Đã xong / Đã kết thúc).
- A3: B3a/B3a2 (900.000; notes; dòng hoan_goi; total_spent), B3k (#cp + mã đơn), B3b (chưa lấy → đủ), B3c (giảm giá → 810.000), B3d (2 gói → một nửa), B3e/B3e2 (ví mẹ trước, dòng cash/hoan_goi), B3l (cộng dồn 2 gói), B3m (đền sau), B3g (403, thiếu lý do), B3h (409), B3n (nợ), B3o (đơn mua mất hiệu lực), B3i (hai người), B3j (I11 + I19). Hàm dùng chung: wallets.js ghiHoan gọi từ orders.js:1334 và packages.js:267.
- A4: B4a (huỷ → 400 đúng câu, ví không đổi), B4b (xoá), B4c (không hoàn rồi huỷ / xoá), B4d (cùng lúc → một khoản).
- A5: B5a (không hoàn: sổ ví / ví không đổi), B5b (nút trong phần mở, hộp 2 lựa chọn, "không mở lại được", hết window.prompt), B5c (chưa chọn / chưa lý do → lỗi tại chỗ trước api.put).
- A6: B6a (Settings tên gói), B6b (Reports tên khách), B6c (Customers dòng gói → ?phone=), B6d (ngày mua / lần giao → /orders?code=&ngay=), B6e (Orders đọc code + ngay), B1f (máy chủ lọc đúng).
- A7: B7a–B7e, B7h (K5), B7g/B7g2 (Q-C); thu_P26c 84/0, thu_P26b 66/0, GOI-1 A1–A6 xanh (4 phép tĩnh đổi có chủ ý).
- A8: dist KHỚP; --day-du PASS 67 · FAIL 0 · CẢNH BÁO 0; dot_bien 59/59; GOI-1 neo lạc 7 + P26c lạc 4 ghi rõ ở trên (đổi mong đợi).
- A9: mục "Quy tắc đối soát" ở trên.

## Bài học (bước 11)
Sự cố của việc này: (1) 2 ca bài thử xanh oan với đột biến — B3c bị trần `total − đã nhận` che (giá niêm yết 1.350.000 bị kéo về 1.215.000),
B3l không phân biệt được "ví trước mẹ" vì tiền đủ cho cả hai; (2) đột biến ghi ngoài giao dịch làm bài SẬP (KHO_BAN) chứ không đỏ đúng ca;
(3) neo `BV-GOI1-LINK` trùng chuỗi khi thêm Link cùng đích; (4) người soát bắt: `Date.now()` vs chuỗi getNow (TZ), catch 500 thay loiGhi ở
route GET có lệnh ghi, số "93/93" nhớ từ việc trước; (5) 5 lệnh bị người gác chặn (B-PHANTICH ×2 do `"^$"` / heredoc, B-BIMAT-CHU grep -r
từ `.`, B-DICHCHU biến trong đích ghi, GIT-LENH `stash`); (6) `kiem_neo.py` không phủ GOI-1 / P26c nên phải viết script nháp so neo.

- **KHOÁ 1 (ngoài Phạm vi — đề xuất, không tự làm):** `kiem_tra_truoc_khi_giao.js` thêm phép tĩnh "route `router.get(` mà thân có `run(`
  với `UPDATE|INSERT|DELETE` → cảnh báo; route có `run(`/`tx.run(` mà `catch` không gọi `loiGhi` → cảnh báo". Ca đỏ: `packages.js:194/204`
  trước commit `9e9f2eb`. Người soát nêu.
- **KHOÁ 2 (ngoài Phạm vi — đề xuất):** `viec/HOC-2b/kiem_neo.py` thêm GOI-1, P26c, LUOI-2, AUDIT-2 vào danh sách bộ; ca đỏ: HEAD này
  (GOI-1 7 neo lạc, P26c 4 neo lạc — đều cố ý nhưng phải HIỆN ra, không phải nhờ script nháp).
- **NGUYÊN TẮC 1 (K3 — đề xuất thêm vào mục "Chặn" của K3 trong KHUON_LOI.md, ngoài Phạm vi):** ca thử một PHÉP TÍNH phải chọn số sao cho mọi
  trần / lưới an toàn phía sau KHÔNG cắn — nếu không, vá sai công thức vẫn ra đúng số nhờ trần (GOI-2: B3c giá niêm yết bị trần
  `total − đã nhận` kéo về đúng 1.215.000; B3l đủ tiền cho cả mẹ lẫn ví nên "ví trước mẹ" ra cùng kết quả). Dấu hiệu: đột biến VS trên công
  thức sống trong khi ca về công thức xanh. Chặn: với mỗi `min(...)` / trần trong hàm tiền, một ca mà vế công thức NHỎ HƠN trần (trần không
  cắn) và một ca tiền KHÔNG đủ cho mọi vế (thứ tự ưu tiên lộ ra).
- **NGUYÊN TẮC 2 (K7 — đề xuất ghi thêm ví dụ vào K7):** so hai mốc thời gian lấy từ hai nguồn (chuỗi `getNow()` giờ VN không hậu tố vs
  `Date.now()`) → lệch 7 giờ trên Render; bài thử trên máy TZ=UTC không lộ. Chặn: mọi so sánh thời gian với dữ liệu kho dùng CÙNG hàm sinh
  (`getNow`), ca ngưỡng thời gian dựng mốc bằng chính hàm đó.
- **BỎ:** đột biến ghi ngoài giao dịch làm sập libsql cục bộ (đặc thù máy thử, đã ghi CHƯA KIỂM) · neo `BV-GOI1-LINK` trùng (đổi thứ tự thuộc
  tính, một lần) · 5 lệnh bị người gác chặn (đều là lệnh tiện ích một lần; cách tránh đã có trong lời chặn: viết script Python vào thư mục
  nháp rồi chạy) · con số "93/93" trong kế hoạch (K1, một lần — đã sửa; nguyên tắc chung "số phải vừa chạy" đã có ở K3 "con số đạt phải kèm lần
  chạy lại trên HEAD").
- **Dọn:** không thấy lời dặn nào trong KHUON_LOI.md / CLAUDE.md đã có phép kiểm làm thay trong việc này. KHUON_LOI.md 104 / 120 dòng —
  NGUYÊN TẮC 1, 2 ở trên là đề xuất (file ngoài Phạm vi), chat soát duyệt rồi ghi, mỗi cái 2–3 dòng, không vượt hạn.

Bước 11 không đổi file ngoài `viec/GOI-2/` → không chạy lại bước 6 (lần kiểm cuối trên `9e9f2eb`: thu_GOI1 101/0 · --day-du 67/0/0 · dot_bien 59/59).

HEAD ĐÃ KIỂM: 9e9f2eb
