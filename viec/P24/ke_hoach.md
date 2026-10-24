# P24 — Kế hoạch: huỷ đơn trừ lại điểm (cho phép âm) · sửa I8

Việc tiền — **chờ chủ quán duyệt** trước khi viết bài thử / sửa code. Mọi số dòng dưới đây đọc ở HEAD `4c6e0ce` trong lượt này.

## 1. Code đọc được (K1)

| Chỗ | Đang làm gì |
|---|---|
| `server/routes/orders.js:1414` `PUT /:id/cancel` | Một giao dịch. Cổng duy nhất: `UPDATE … WHERE id = ? AND status = 'completed'` (`:1447`) + `changes !== 1` → 400 `DON_KHONG_HUY_DUOC`. Sau cổng: `goiDaKetThuc` (`:1460`, rollback), `hoanVi` + `traLuotMa` (`:1466`), gói, thẻ, yêu cầu hoàn, đọc món. **Không đụng `pos_point_transactions`.** |
| `orders.js:1059` (`POST /`) | Ghi `earn` trong giao dịch tạo đơn (bọc try/catch), có `expires_at = diemTao.han`. |
| `orders.js:1337` (`pay-debt`) | Ghi `earn` bằng `INSERT … SELECT … WHERE NOT EXISTS` trong giao dịch thu; cổng thu có `AND status = 'completed'` → huỷ và thu nối tiếp nhau, không chồng. |
| `signup-codes.js:197` `nhanDiemMaBill` | `kiemDonCuaMa` (`:48`, đọc NGOÀI giao dịch) chặn đơn đã huỷ (`:63` → 400 `DON_DA_HUY`). Trong giao dịch chỉ chiếm mã (`:278`) rồi ghi `earn` (gắn `order_id`, SĐT = người nhận, hạn theo `loyalty_expiry_mode`) — **không kiểm lại trạng thái đơn**. |
| `orders.js:1587` `DELETE /:id` | Chỉ owner. Đơn `completed` → `hoanVi` + `traLuotMa` (`:1618–1624`); xoá đơn + món + mã bill chưa dùng (`:1666`). **Không đụng điểm** → dòng `earn` mồ côi (đơn mất, điểm còn). |
| `server/utils/diemKhach.js` `BALANCE_SQL` | Số dư = `SUM(points)` dòng còn hạn — không cắt về 0. Quầy (`customers-v2.js:217`, `Customers.jsx:495/706`) và App KH (`kh/index.js:99` → `Diem.jsx:20`) in nguyên số. |
| `loyalty.js:95, :118` `/redeem` | `cost ≥ 1` và `balance < cost` → 400, đọc số dư TRONG giao dịch. ⇒ số dư ≤ 0 đã bị chặn đổi quà, **không cần sửa**. |
| `refunds.js:158` duyệt hoàn | Đổi đơn sang `refunded`, **không đụng điểm** (giữ `earn`). Báo hỏng hoàn tiền (`damages.js`) cũng không đụng điểm. Huỷ đơn `refunded` bị cổng `:1447` chặn. → để việc sau (I). |
| `database.js:374` | Loại dòng điểm đã khai: `earn \| redeem \| expire \| bonus \| adjust`; code hiện chỉ ghi `earn`, `redeem`. Không ràng buộc CHECK. |
| `cong_cu/gia_lap/bat_bien.js:126` I8 | Đơn đã huỷ được tính như đơn thường (giữ điểm theo trạng thái tiền). `:166` coi mọi loại ≠ `earn`/`redeem` là "loại dòng điểm lạ". |
| `cong_cu/thu_P2223.js:401` F3 | Khoá luật CŨ: "đơn đã thu huỷ giữ 25 điểm" → phải đổi thành "huỷ → 0". |

## 2. Thay đổi

### 2.1 `orders.js` — dòng trừ điểm trong giao dịch huỷ (A, C, E, F)

- **A (chọn):** một câu `INSERT … SELECT` ngay sau `traLuotMa` (`:1466`), KHÔNG bọc try/catch (lỗi → rollback cả lệnh huỷ, không để đơn đã huỷ mà còn điểm):
  ```sql
  INSERT INTO pos_point_transactions (customer_phone, type, points, order_id, expires_at, reason, created_by, created_at)
  SELECT customer_phone, 'adjust', -SUM(points), order_id, expires_at, ?, ?, ?
  FROM pos_point_transactions
  WHERE order_id = ? AND type = 'earn'
    AND NOT EXISTS (SELECT 1 FROM pos_point_transactions WHERE order_id = ? AND type = 'adjust')
  GROUP BY customer_phone, expires_at
  ```
  (Bản đầu có `HAVING SUM(points) <> 0` — bỏ sau soát vòng 1: mọi chỗ ghi `earn` đều ghi số > 0, vế đó là code chết.)
  `reason` = `Huỷ đơn <mã> — trừ lại điểm`. Gom theo (SĐT, hạn): thường đúng MỘT dòng = tổng `earn`; đơn có `earn` của HAI SĐT (bán cho
  SĐT A rồi khách lẻ… — thực tế `billSdtKhac` chặn) hoặc hai hạn khác nhau (điểm lúc bán + bù mã bill ghi ở hai quý) thì mỗi cặp một
  dòng — đúng SĐT, đúng hạn (E). Đơn không `earn` → `GROUP BY` trên tập rỗng ra 0 dòng (C; bỏ `GROUP BY` thì SUM trần ra một
  dòng NULL). Thêm ~12 dòng.
- **A' (soát gợi ý, không chọn):** chép từng dòng `earn` (`-points`, không GROUP BY) — ngắn hơn 2 dòng nhưng đơn có điểm lúc bán + bù mã
  bill (hai dòng `earn` cùng SĐT, cùng hạn) ra HAI dòng trừ, trái câu chữ NT-A "một dòng trừ đúng bằng tổng".
- **B:** đọc tổng `earn` bằng JS rồi `tx.run` INSERT từng dòng. Nhiều dòng hơn, cùng hành vi → bỏ.
- **Loại dòng:** dùng `adjust` (đã khai ở `database.js:374`, chưa nơi nào ghi) — phiếu dặn ưu tiên loại sẵn có. App KH hiện `reason`
  trước nhãn loại (`app_kh/src/pages/Diem.jsx:29`) → khách thấy "Huỷ đơn … — trừ lại điểm".
- **Chặn đua (F):** tầng 1 = cổng `:1447` (hai lệnh huỷ: lệnh thua 400 trước khi tới câu ghi); tầng 2 = `NOT EXISTS … type = 'adjust'`
  trong câu ghi (khuôn `pay-debt :1339`).

### 2.2 `DELETE /:id` (G) — chờ chủ quán (Câu hỏi G)
- **G-a (đề xuất):** đơn `completed` → trừ điểm y như huỷ. Tách câu ở 2.1 thành hàm `truDiemDon(tx, order, nguoi, now)` trong
  `orders.js` NGAY TRƯỚC `router.delete` (khe `:1580–1587`, trong vùng sửa — KHÔNG đặt cạnh `hoanVi :1399` vì đó nằm giữa
  `pay-debt` và huỷ), gọi ở cả hai chỗ (`:1466`, `:1624`). +~6 dòng. Đơn đã huỷ rồi mới xoá: không trừ lần hai (cổng
  `order.status === 'completed'` + `NOT EXISTS`).
- **G-b:** chặn xoá đơn `completed` có `earn` → 400 `DON_CO_DIEM` "Huỷ đơn trước rồi mới xoá". +~5 dòng, thêm một bước cho chủ.

### 2.3 Mã nhận điểm chưa dùng (D)
Hiện tại: mã đã bị chặn sau khi đơn huỷ (`signup-codes.js:63`, 400 `DON_DA_HUY`) — **không cần sửa cho luồng nối tiếp**. Lỗ còn lại:
`kiemDonCuaMa` đọc NGOÀI giao dịch, giao dịch ghi `earn` không kiểm lại trạng thái đơn → huỷ chen giữa (huỷ xong rồi nhận mới ghi)
thì đơn đã huỷ có `earn` mà không có dòng trừ. Vá cần sửa `signup-codes.js` (phiếu cấm trừ khi D cần) → **Câu hỏi D**. Đề xuất: nối
vào câu chiếm mã `:278` vế `AND EXISTS (SELECT 1 FROM pos_orders WHERE id = ? AND status = 'completed' AND payment_status = 'paid')`
(LÀM: chỉ `status = 'completed'` — bỏ vế `payment_status`, vì chỉ pay-debt đổi nó và chỉ theo chiều sang 'paid'; giữ nguyên chuỗi neo `WHERE id = ? AND diem_nhan_luc IS NULL` của `kiem_tra_truoc_khi_giao.js:463–469`). Câu chiếm hỏng hiện đi qua
`baoChiemHong` (`signup-codes.js:282–285`, chỉ biết "mã đã dùng" / `SDT_DA_NHAN`) → phải sửa cả chỗ đó để trả `DON_DA_HUY` (~+6
dòng). Cần chủ quán thêm `server/routes/signup-codes.js` vào Phạm vi. Không vá D thì lỗ đua còn đó, và `NOT EXISTS` của dòng trừ
cũng không cứu được (dòng `adjust` đã có trước `earn` đến muộn) — ghi CHƯA KIỂM.

### 2.4 Hạn điểm (E)
Dòng trừ chép đúng `expires_at` của `earn`. `earn` đã hết hạn lúc huỷ → dòng trừ cũng đã hết hạn → số dư không đổi (điểm đó vốn đã
không còn tính). Đề xuất **E-a** giữ như vậy (sổ đơn vẫn cân = 0, không phạt khách hai lần). **E-b:** dòng trừ không hạn (`NULL`) →
trừ cả điểm đã hết hạn = khách mất điểm hai lần. → Câu hỏi E.

### 2.5 Bất biến I8 (H) — `bat_bien.js`
- Hằng `HUY_TRU_DIEM_TU = '2026-10-25'` (ghi tạm, khuôn `DIEM_KHI_THU_TU`; chat sửa lúc duyệt PR), export cạnh `DIEM_KHI_THU_TU`.
- SELECT thêm `o.status, o.cancelled_at`. Đơn `cancelled` → đúng luật = 0. Ngoại lệ: `ctx.thuc` + (`cancelled_at` NULL hoặc
  `< HUY_TRU_DIEM_TU`) → nhận CẢ luật cũ "giữ điểm" (`diemDung`, kể cả luật trước `DIEM_KHI_THU_TU`) LẪN tổng 0 (ngày gộp lẫn hai luật —
  sửa sau soát vòng 1; vòng 2 thêm ca đơn ghi nợ để luật cũ ≠ luật mới).
- Phép "loại lạ" (`:166`): cho `adjust` CÓ `order_id`; `adjust` không gắn đơn vẫn là lạ.
- Sửa ghi chú đầu file (`:8–12`): "đơn đã huỷ: tổng điểm của đơn = 0 (P24), trừ đơn huỷ trước mốc ở Đối soát thật".
- +~10 dòng.

### 2.6 Kịch bản giả lập — `kich_ban.js`
KB5a "huỷ đơn" (`:118`, khách quen trả ví → đã thu đủ → có `earn`): thêm `c.mong` "huỷ đơn có điểm → điểm của đơn = 0, đúng một dòng
`adjust`". Thêm một bước nhận điểm bằng mã bill trên đơn khách lẻ rồi huỷ (KB5b đã có `d2` khách lẻ: `c.nhanDiem(d2.ma)` trước huỷ) →
tổng điểm đơn = 0 (dùng SĐT mới `sdtMoi()` mặc định của `c.nhanDiem` — tránh `SDT_DA_NHAN` khi bật "chỉ lần đầu"). +~6 dòng. I8 chạy
trên toàn bộ kịch bản sẽ bắt mọi đơn huỷ còn điểm. Ca kiểm: H3 trong bảng 3.

### 2.7 Bài thử cũ phải đổi
- `thu_P2223.js:401` F3 → "đơn đã thu huỷ → 0 điểm (25 − 25)". Bản đổi ĐỎ trên gốc (gốc giữ 25) → không cần `## Bài thử cũ sửa`.
- `thu_gia_lap.js` (LUOI-1, kho dữ liệu tay I8): thêm ca: đơn huỷ còn điểm → lệch; đơn huỷ có `adjust` cân → sạch; Đối soát thật
  huỷ trước mốc giữ điểm → sạch / đúng mốc → lệch; `adjust` không gắn đơn → loại lạ. Khung `DON_I8` cần thêm cột `status`,
  `cancelled_at`.
- `thu_DOISOAT1.js`: chỉ chạy lại; đổi khi I8 mới làm ca có sẵn lệch (đọc lại lúc làm).
- `kiem_tra_truoc_khi_giao.js:495`: thêm `'cong_cu/thu_P24.js'` vào CUỐI mảng.

## 3. Ca thử ↔ nghiệm thu (`cong_cu/thu_P24.js`, khuôn `thu_P2223.js`: máy chủ thật, kho tạm, `co.mocTruocTx`, `co.nemGhi`)

| NT | Ca | Đỏ trên gốc vì |
|---|---|---|
| A1 | đơn SĐT trả tiền mặt (earn lúc tạo) → huỷ → đúng 1 dòng `adjust` = −earn, cùng SĐT, cùng `order_id`; dòng `earn` còn nguyên (id, points) | gốc 0 dòng trừ |
| A2 | đơn ghi nợ → thu đủ (earn lúc thu) → huỷ → như A1 | như trên |
| A3 | khách lẻ nhận điểm bằng mã bill (SĐT người nhận) → huỷ → dòng trừ cho SĐT người nhận | như trên |
| A4 | cùng giao dịch: `co.nemGhi` làm câu ghi điểm ném → huỷ trả lỗi, đơn vẫn `completed`, ví không đổi | gốc huỷ 200 |
| B1 | earn 25 → đổi quà 20 → huỷ → số dư = −20 (qua `/loyalty/points/:sdt`; `/api/kh/diem` dùng CÙNG hàm `layDiemKhach` — kh/index.js:99, không gọi thẳng) | gốc +5 |
| B2 | số dư −20 → `/loyalty/redeem` → 400, không thêm dòng `redeem` | gốc số dư +5 → đổi được (đỏ) |
| C1 | khách lẻ chưa nhận mã → huỷ → 0 dòng điểm | xanh cả gốc (ca "phải KHÔNG X") |
| C2 | đơn Flash có SĐT → huỷ → 0 dòng | xanh cả gốc |
| C3 | đơn ghi nợ chưa thu / thu một phần → huỷ → 0 dòng | xanh cả gốc |
| D1 | huỷ rồi `/nhan-diem` mã chưa dùng → 400 `DON_DA_HUY`, 0 `earn` | xanh cả gốc (hành vi hiện có) |
| D2 | (nếu chủ chọn vá D) `co.mocTruocTx`: huỷ chen trước giao dịch nhận điểm → nhận 400, tổng điểm đơn 0 | gốc ghi earn sau huỷ |
| E1 | earn có hạn → dòng trừ cùng `expires_at` | gốc 0 dòng |
| E2 | earn đã hết hạn (sửa `expires_at` về quá khứ) → huỷ → số dư không đổi (theo E-a) | — |
| F1 | hai lệnh huỷ chồng nhau (`co.mocTruocTx`) → 200 + 400, đúng 1 dòng `adjust` | gốc 0 dòng |
| F2 | đột biến tầng 2: dòng `adjust` đã có (chèn tay) + huỷ → không thêm dòng thứ hai | gốc 0 dòng |
| G1 | (theo lựa chọn G) xoá đơn completed có earn → G-a: có dòng trừ / G-b: 400 `DON_CO_DIEM` | gốc 200 không trừ |
| G2 | huỷ rồi xoá → đúng 1 dòng trừ | |
| H1 | I8 trên mọi đơn của bài → 0 lệch; chèn `earn` vào đơn đã huỷ (không trừ) → I8 lệch "đơn X: n điểm, đúng luật là 0" | gốc I8 không lệch |
| H2 | `ctx.thuc`: đơn huỷ 1 giây trước `HUY_TRU_DIEM_TU` còn điểm → sạch; đúng mốc → lệch; giả lập (không thuc) → lệch | gốc không có mốc |
| I1 | huỷ đơn trả ví / dùng mã / mua gói / mua thẻ / giao từ gói → ví, lượt mã, gói, thẻ như cũ (so đúng số) | xanh cả gốc (K5) |
| I2 | duyệt hoàn (`refunds.js`) đơn có điểm → điểm GIỮ nguyên (ghi rõ: việc sau) | xanh cả gốc |
| I3 | hoàn MỘT PHẦN = báo hỏng hoàn tiền (`damages.js`, đường KB6) trên đơn có điểm → điểm GIỮ nguyên (việc sau) | xanh cả gốc |
| H3 (giả lập) | `thu_gia_lap.js` chạy kịch bản → KB5 có `mong` "điểm đơn huỷ = 0" xanh, I8 0 lệch. Bằng chứng gốc: chạy đủ `thu_gia_lap.js` với 3 file code của gốc → KB5 đỏ (`bang_chung_do.txt` 2b). `dot_bien.py` KHÔNG có đột biến chạy giả lập (quá nặng) — ca `H3` trong `thu_P24.js` là ca khác ("adjust không gắn đơn") | gốc: mong mới đỏ |

Đột biến (`viec/P24/dot_bien.py`): `VS-bo-not-exists` (bỏ tầng 2) → F2 bắt; `VS-duong` (ghi `+SUM`) → A1/B1 bắt; `VS-bo-han` (ghi
`NULL` thay `expires_at`) → E1 bắt; `VS-try-catch` (bọc nuốt lỗi) → A4 bắt; `BV-xoa-cau-tru` (gỡ câu INSERT) → A1…H1 bắt;
`BV-i8-huy` (gỡ nhánh `cancelled` ở I8) → H1 bắt; đối chứng: bản chưa đột biến xanh.

## 4. Đường song song (K4)
**Gửi cùng lúc:** Đối soát thật (`doiSoat.js:15,227`) chạy I8 với `ctx.thuc` → sửa `orders.js` mà chưa sửa I8 thì mọi dòng `adjust` báo
"loại dòng điểm lạ" (`bat_bien.js:166`). Hai sửa nằm chung một nhánh, một PR.
**Neo đột biến có sẵn — không đổi chữ:** `thu_gia_lap.js:152` (chuỗi cổng huỷ `WHERE id = ? AND status = 'completed'\`,\n [reason ||`),
`:154` (`if (order.status === "completed") {` của DELETE) → chèn câu trừ SAU `traLuotMa`, không chen giữa các chuỗi neo.
**Phát hiện (ngoài phạm vi, không sửa):** `doiSoat.js:118` `tongHop` cộng mọi dòng âm vào "điểm trừ" → dòng trừ do huỷ lẫn với đổi quà
trong tổng Đối soát. Quầy (`Customers.jsx:494,705`) tô số âm màu xám, không cắt số — chỉ thẩm mỹ.

Mọi chỗ ghi `earn`: `orders.js:1059`, `:1337`, `signup-codes.js:288` — cả ba gắn `order_id` → một câu theo `order_id` phủ cả ba.
Mọi chỗ đưa đơn khỏi `completed`: huỷ (vá), xoá (G), duyệt hoàn `refunds.js:158` (giữ — I), `pay-debt` không đổi trạng thái.
`loyalty.js:125` `redeem` không gắn đơn → không bị dòng trừ đụng tới.

## 5. Luồng hợp lệ phải KHÔNG bị chặn (K5)
Huỷ đơn không SĐT; huỷ đơn Flash; huỷ đơn ghi nợ; huỷ đơn mua gói (quyền refund_package) / mua thẻ / giao từ gói; huỷ đơn đã dùng
mã giảm; huỷ đơn khách đã tiêu hết điểm (số dư âm KHÔNG chặn huỷ); nhận điểm mã bill trên đơn còn hiệu lực; đổi quà khi số dư đủ;
xoá đơn đã huỷ. Ca trong bảng 3: C1–C3, I1, B2, D1, D3, G2. "Huỷ đơn đã dùng mã giảm" KHÔNG có ca trong `thu_P24.js` — phủ bởi bài cũ
(`kich_ban.js` KB5b dùng mã rồi huỷ; `thu_P26*`); `truDiemDon` không đụng mã giảm.

## 6. Ngân sách
Thực tế: `orders.js` +17 (hàm `truDiemDon` 15 gồm 3 dòng chú thích + 1 dòng trống, 2 chỗ gọi; bỏ `HAVING` sau soát vòng 1 vì earn luôn > 0) · `signup-codes.js` +9/−4 ·
`thu_P24.js` 410 dòng — vượt ~200 của phiếu vì 33 ca phủ đủ A–I kèm K5 (gói, thẻ, hoàn tiền) và ba công tắc chen / ném / đọc trong giao dịch.
Ước lượng ban đầu:
`orders.js` ~12 (+~6 nếu G-a) · `bat_bien.js` ~10 · `kich_ban.js` ~6 · `thu_P24.js` ~220 · `thu_P2223.js` ~2 · `thu_gia_lap.js` ~10
· `kiem_tra_truoc_khi_giao.js` 1 · (`signup-codes.js` ~8 nếu duyệt D). Trong ngân sách phiếu.

## 7. Câu hỏi cho chủ quán (chép ở `trang_thai.md`)
- **G** `DELETE` đơn có điểm: (a) trừ điểm như huỷ — đề xuất; (b) chặn xoá, bắt huỷ trước.
- **E** `earn` đã hết hạn lúc huỷ: (a) dòng trừ cùng hạn → không đổi số dư — đề xuất; (b) dòng trừ không hạn → trừ cả điểm đã hết hạn.
- **D** thêm `signup-codes.js` vào Phạm vi (~8 dòng: câu chiếm mã + `baoChiemHong`) để đóng lỗ huỷ chen giữa lúc nhận điểm? Đề xuất: có.
- **Lỗi ghi điểm khi huỷ:** rollback cả lệnh huỷ (đề xuất, giữ sổ cân) hay bọc try/catch như lúc cộng điểm (đơn huỷ được, điểm lệch I8)?
