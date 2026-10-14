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
