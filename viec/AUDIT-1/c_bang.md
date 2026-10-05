# AUDIT-1 — Nhóm C · Giả lập (`cong_cu/gia_lap/`, `cong_cu/thu_gia_lap.js`)

HEAD b9759cf, đo 04.10.2026.

## C1 — mỗi bất biến I1–I11 có ≥1 đột biến BẮT

Bảng M1–M13 của `thu_gia_lap.js` (`:60-83`) + P26b + C2 phủ:

| bất biến | đột biến BẮT | nguồn |
|---|---|---|
| I1 (mã bill chỉ trên đơn đã thu, chưa huỷ) | M2 (bỏ điều kiện đã thanh toán, KB7), `I1-nhanh-refunded-false` (KB13) | thu_gia_lap, P26b |
| I2 (không mã mồ côi) | — không đột biến máy chủ; kiểm bằng kho dữ liệu TAY trong `thu_gia_lap.js:160-170` | thu_gia_lap |
| I3 (trạng thái tiền hợp lệ) | M8 (đảo paid/partial, KB3) | thu_gia_lap |
| I4 (số dư ví = tổng sổ trắng) | M3 (cộng debt_payment), M10 (loại dòng ngoài danh sách), nap/tru ngoài tx | thu_gia_lap, P26b |
| I5 (không loại dòng ví lạ) | M9 (loại 'tra_no' lạ, KB4) | thu_gia_lap |
| I6 (mỗi đơn thu đúng một lần) | M1 (pay-debt bỏ chặn, KB10), tao-don/nap/tru chồng | thu_gia_lap, P26b |
| I7 (vân tay kho đúng một lần) | M4 (vân tay trùng chiều, KB5) | thu_gia_lap |
| I8 (điểm đúng luật) | M5 (nhận điểm bỏ chiếm), **C2-orders-bo-diem-ban (KB1)**, **C2-sc-bo-diem-ma (KB11)** | thu_gia_lap, **AUDIT-1** |
| I9 (nhật ký đơn khớp) | M6 (pay-debt bỏ nhật ký, KB3), M7 (đổi cách trả bỏ nhật ký, KB2) | thu_gia_lap |
| I10 (hoàn ví ≤ đã trả, gộp ví) | M11/M12 (huỷ/xoá, KB13/14) · **xem AU-C1** về I10-bo | thu_gia_lap, P26b |
| I11 (hoàn ví ≤ đã trả, theo TỪNG ví) | M13 (hoàn ví mẹ vào ví con, KB17) | thu_gia_lap |

- **AU-C1 (NHẸ, đã biết trong kế hoạch):** I10 ⊂ I11 (I11 theo từng `order_id, customer_phone`; I10 gộp mọi ví cùng
  order_id). Một lệch I10 luôn làm I11 lệch (cùng order_id). Đột biến `I10-bo` của P26b định xoá RIÊNG I10 nhưng chuỗi
  `return ds.filter((r) => so(r.hoan) > so(r.tra) + 0.5)` giờ khớp **2 lần** (I10 và I11 cùng dòng) → **HỎNG**, không áp
  được (xem AU-E1). Đề xuất HOC-2: hoặc bỏ I10 (I11 bao trùm), hoặc sửa `I10-bo` dùng neo riêng (ví dụ WHERE của I10).
- C2-orders-bo-diem-ban + C2-sc-bo-diem-ma: hai câu ghi `pos_point_transactions` (lúc bán `orders.js:905`, lúc nhận mã
  bill `signup-codes.js:259`) KHÔNG có trong P26b → AUDIT-1 thêm, cả hai BẮT qua I8.

## C2 — phủ nhánh ghi đường tiền

**C2 ĐỦ (sửa ra-soat vòng 2):** mỗi câu INSERT/UPDATE/DELETE thật (bỏ ghi chú) ở đủ 11 file routes tiền + lời gọi ghiVi
= **86 đột biến bỏ-câu** (`dot_bien.py C2F`, cách `c2full`: tầng 1 giả lập + thu_P26a + thu_P26b, SỐNG thì tầng 2
thu_P20 + thu_P21). Kết quả **40 BẮT · 45 SỐNG · 1 LẠC · 0 HỎNG** — bảng đầy đủ + phân loại "ở quầy sai gì" ở
**`c2_day_du.md`**. (60 đột biến P26b là logic/VÁ SAI, KHÔNG thay được việc bỏ TỪNG câu một cách hệ thống.)

Phân loại route theo middleware ĐỌC TỪ CODE: `authenticate`/`authenticateServiceOrUser` = quầy/khách chạm;
`checkPermission('manage_*')` = quản trị. (Đã sửa xếp nhầm: `packages.js:177` deliver + `:188` cancel là `authenticate`
= quầy, không phải admin; `discount-codes.js` validate/increment-usage = quầy.)

- **Câu ví/điểm-tích/hoàn/debt LÕI → BẮT (40):** orders ghiVi/điểm-bán/huỷ/xoá/tạo, refunds tạo/duyệt/từ chối/ghiVi mẹ,
  wallets nạp/trừ/điều chỉnh/đối-soát, damages báo hỏng, signup-codes chiếm-mã/claim/điểm, loyalty voucher_grants
  (thu_P26a C8). Không câu LÕI nào SỐNG.
- **SỐNG đụng tiền (16) = phát hiện** AU-G1 (loyalty trừ điểm + đẻ mã), AU-G2 (voucher used_count khi bán → dùng lại),
  AU-G3 (gói & thẻ trả trước: customer_packages/membership/deliver), AU-G4 NHẸ (ví đối soát tạo-mới, link sổ hoàn, đổi
  cách trả, /increment-usage), **AU-G6 NẶNG kho** (orders-07/27/39 stock_pending — bán lúc SX trục trặc kho không bị trừ). Chi tiết + "ở quầy sai gì" ở `c2_day_du.md` và `bao_cao.md`.
- **SỐNG admin config THẬT (CHƯA KIỂM đúng — KB không chạm):**
  packages CRUD (`packages.js:41,80,104,107`), discount-codes CRUD (`:200,266,319,326`), rewards CRUD (`:44,75,87`),
  signup-codes huỷ-claim (`:478,484`), customers-v2 upsert (`:58,320,327,370,377`). Đường QUẢN TRỊ (tạo gói/mã/khách), không phải
  tiền khách chạm ở quầy. Đề xuất HOC-2: nếu P20b/P22–P24 đụng các bảng này thì thêm KB + bất biến phủ.

## C3 — thời gian giả lập vs ngưỡng

Đo 04.10.2026, nối tiếp, 3 lần (script `/tmp.../c3.py`, môi trường lọc sạch):
- `cong_cu/gia_lap/chay.js`: **[67.9, 67.9, 68.0] s** — ngưỡng kill 110 s (`thu_gia_lap.js:52`). Dư 1.62×.
- `cong_cu/thu_gia_lap.js`: **[70.2, 70.1, 70.4] s** — ngưỡng E11 của bộ kiểm 120 s (`kiem_tra_truoc_khi_giao.js:479`).
  Dư 1.70×.

- **AU-C3 (NHẸ):** ghi chú `kiem_tra_truoc_khi_giao.js:746` ("giả lập 22 s, thu_gia_lap 24 s") LỆCH thực tế (68/70 s) —
  đo khi viết TU-CHAY-4 so với bây giờ (thêm KB15–18, I10/I11). **Ở quầy sẽ sai gì:** không sai tiền trực tiếp, nhưng
  dư giờ chỉ ~1.6× — một máy CI chậm (GitHub ubuntu chia sẻ) có thể vượt 110/120 s → cổng `cong-chay` (--day-du) hoặc
  pre-commit ĐỎ vì HẾT GIỜ (báo động giả), hoặc dụ người sau nới ngưỡng che một lỗi thật. Đề xuất HOC-2: cập nhật ghi
  chú về số thật + cân nhắc nâng ngưỡng hoặc giảm số KB chạy ở pre-commit (giữ đủ ở cổng).
