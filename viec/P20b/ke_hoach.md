# P20b — kế hoạch (CHỜ DUYỆT — chưa viết bài thử, chưa sửa code)

Số dòng dưới đây đọc trong lượt này trên HEAD `568b044` (= main `09ddeb0` + phiếu `PHIEU: P20b`).

## 0. Phát hiện làm đổi phương án — A1 của phiếu đụng ba file bị Cấm

Phiếu A1: tách `kiemDonCuaMa` + `TRANG_THAI_DUNG_MA` ra `server/utils/maBill.js`, `signup-codes.js` require lại. Làm đúng như vậy thì:

| File (bị Cấm / ngoài Phạm vi) | Chỗ đọc `signup-codes.js` | Hậu quả khi hàm rời khỏi `signup-codes.js` |
|---|---|---|
| `kiem_tra_truoc_khi_giao.js:406` đọc `server/routes/signup-codes.js`; `:420` `src.indexOf('function kiemDonCuaMa')`; `:429–433` đòi thân hàm có đúng 1 `return { don }` + câu `if` danh sách trắng | phép E9 | `than = ''` → `traDon.length === 1` sai → ✗ "kiemDonCuaMa là DANH SÁCH TRẮNG" → `npm test` ĐỎ (A4 không đạt). Phép `:426` chỉ xanh "oan" nhờ vế `!/TRANG_THAI_DUNG_MA/.test('')`. |
| `cong_cu/thu_gia_lap.js:123–124` đột biến M2 neo `' && don.payment_status === TRANG_THAI_DUNG_MA.payment_status'` trong `routes/signup-codes.js`; `:156–157` khớp ≠ 1 lần → "đột biến không áp được" = HỎNG | `--day-du` | thu_gia_lap đỏ. |
| `viec/AUDIT-1/dot_bien.py:109–110, 121–122` (nhóm D1) neo `const TRANG_THAI_DUNG_MA = …`, `return { don };` trong `server/routes/signup-codes.js` | phiếu A4 "vẫn BẮT" | 2 đột biến HỎNG; "neo lại" = sửa `viec/AUDIT-1/` — ngoài Phạm vi (cổng A6 chặn). |

Cả ba không sửa được trong việc này (Cấm: LUOI-3 chạy song song; Phạm vi chỉ có `viec/P20b/**` + 4 file). Vì vậy đề xuất **Phương án A**
dưới đây, chờ chủ quán chốt (Câu hỏi 1). Mục tiêu nghiệp vụ (một quy tắc, một chỗ; chặn tại POST /orders) KHÔNG đổi.

## 1. Phần A1 — dùng chung hàm kiểm

| | **A: giữ hàm tại chỗ, xuất ra** | B: tách ra `server/utils/maBill.js` (đúng chữ phiếu) |
|---|---|---|
| sửa | `signup-codes.js:498` thêm `module.exports.kiemDonCuaMa = kiemDonCuaMa;` (1 dòng); `orders.js:27` vùng require thêm `const { kiemDonCuaMa } = require("./signup-codes");` (1 dòng) | file mới ~30 dòng (chép y nguyên :45–71), `signup-codes.js` bỏ 27 dòng + 1 require, orders.js 1 require |
| số file | 2 (đều trong Phạm vi) · 0 file mới | 3 + **3 file Cấm/ngoài Phạm vi phải sửa theo** (mục 0) |
| dòng | ~2 | ~5 ròng + sửa 3 file ngoài |
| tiền lệ trong kho | `wallets.js:318–322` `module.exports = router; module.exports.ghiVi = …` và `orders.js:27` đã `require("./wallets")` lấy hàm — đúng khuôn đang dùng | `tienDaTra.js` (P26c) — khuôn "utils" |
| rủi ro | route nạp route: `signup-codes.js` chỉ require `database`, `helpers`, `auth` (:21–23) — không vòng; thu_P20 nạp cả hai router (:78–79) nên không đổi cách chạy | `npm test` đỏ, `--day-du` đỏ, AUDIT-1 D1 hỏng → việc này KHÔNG giao được cho tới khi LUOI-3 xong và có phiếu sửa 3 file kia |

**Chọn A.** Phép E9, M2, AUDIT-1 D1 giữ nguyên neo → không cần "ghi trước / sau" — chỉ chạy lại để chứng minh vẫn BẮT (mục 5).
Nếu chủ quán vẫn muốn B: làm sau LUOI-3, trong phiếu khác có `kiem_tra_truoc_khi_giao.js` + `thu_gia_lap.js` + `viec/AUDIT-1/` trong Phạm vi.

## 2. Phần A2 — cổng tại POST /orders

Code hiện tại (đọc lượt này): `orders.js:500–536` tìm `codeRecord` (`:501–504`, `UPPER(code) = UPPER(?) AND is_active = 1`), kiểm hạn /
lượt / đơn tối thiểu (`:514–526`), KHÔNG hỏi đơn gốc. Giao dịch mở ở `:843`; giữa `:502` và `:843` không có lệnh ghi (grep
`beginTransaction(|await run(|INSERT INTO|UPDATE pos_|DELETE FROM` trong 500–900: chỉ `:843`, `:880`). `used_count` tăng trong giao dịch
`:964–966`. Mã in bill phát ở `:1138–1143` (`generateVoucherCode()`, chữ hoa), voucher /claim cùng `code` (`signup-codes.js:357, 396`).

Thêm, ngay trong `if (codeRecord) {` (`:506`), TRƯỚC `const today` (`:511`) — ~8 dòng:

```js
// P20b: voucher sinh từ mã in bill (cùng `code` với pos_signup_codes) chỉ dùng được khi đơn gốc còn completed + paid —
// cùng hàm kiểm với /claim, /nhan-diem. Mã chủ quán tạo tay không có dòng signup → như cũ.
const maBill = await queryOne("SELECT order_id FROM pos_signup_codes WHERE UPPER(code) = UPPER(?)", [codeRecord.code]);
if (maBill) {
  const kqDon = await kiemDonCuaMa(maBill);
  if (kqDon.loi) return res.status(400).json({ error: kqDon.loi.error, code: "MA_DON_GOC_KHONG_HOP_LE" });
}
```

- Tra bằng `codeRecord.code` (chuỗi đúng của voucher vừa khớp) — cùng biểu thức `UPPER(code)` như `/claim` (`:310`), `/nhan-diem` (`:134`).
- `SELECT order_id` đủ: `kiemDonCuaMa` chỉ đọc `dong.order_id` (`signup-codes.js:48`).
- Mọi `.loi` (kể cả `MA_KHONG_GAN_DON` 400, `KHONG_THAY_DON` 404) → 400 `MA_DON_GOC_KHONG_HOP_LE`, `error` chép từ hàm — đúng quyết định phiếu.
- Trả về TRƯỚC `:843` → không đơn, không tăng `used_count`, không giao dịch mới.

| | **A: khối trên, trước kiểm hạn** | B: gắn vào `codeValid = false` |
|---|---|---|
| dòng | ~8 | ~6 |
| hành vi | 400, đơn KHÔNG tạo | đơn vẫn tạo, chỉ không giảm (như mã hết hạn hiện nay `:514–527`) — TRÁI quyết định chủ quán |

Chọn A.

**Đường song song đã rà (K4):** `grep "FROM pos_discount_codes" server/` → 3 chỗ đọc mã theo tên: `orders.js:502` (vá), `discount-codes.js:72`
(`/validate` — phiếu: KHÔNG chặn ở đây; màn hình vẫn báo ✓ rồi tạo đơn mới bị 400 — chép vào CHƯA KIỂM/A5), `tienDaTra.js:20` (chỉ đọc
`discount_scope` khi hoàn — không áp mã). `orders.js:660` (max_discount), `:950` (used_count) đọc theo `id` sau khi đã qua cổng. Không có đường
tạo đơn thứ hai áp `discount_code` (`:166` là chỗ duy nhất đọc từ body).

## 3. Phần A3 — ca thử, ánh xạ 1-1 với Nghiệm thu

Thêm mục `[G] P20b` vào cuối `cong_cu/thu_P20.js` (trước `sv.close()` `:321`), dùng lại `taoDon`, `claim`, `goi`, `mon`, `napVi` có sẵn
(`:56–130`). Helper mới `dungMa(ma)` = `POST /orders` với `discount_code: ma`, tiền mặt 25.000 (`sp.price = 25000` `:100`; signup 10 %
`:93` → giảm 2.500). Mọi ca so `status` + `code` + số đếm DB, không dò chữ (E12).

| Nghiệm thu | Ca | Mong đợi (sau vá) | Trên gốc |
|---|---|---|---|
| A3(a) | G1: đơn gốc tiền mặt (paid) → claim 200 → `PUT /orders/:id/cancel` 200 → `dungMa` | 400 `MA_DON_GOC_KHONG_HOP_LE`; `COUNT(pos_orders)` không đổi; `used_count` = 0 | 200 + `discount_code` = mã → **ĐỎ** |
| A3(b) | G2: đơn gốc trả ví → claim → `POST /refunds` + `/approve` (như [B2] `:176–187`, status `refunded`, payment_status vẫn `paid`) → `dungMa` | 400 cùng mã lỗi; `used_count` 0 | 200 → ĐỎ |
| A3(b) "trạng thái lạ" | G3: đơn gốc paid → claim → `UPDATE pos_orders SET payment_status = 'pending'` trực tiếp (không có route nào đưa paid → chưa trả; đây là "trạng thái lạ" của phiếu) → `dungMa` | 400 cùng mã lỗi | 200 → ĐỎ |
| A3(c) K5 | G4: đơn gốc paid → claim → `dungMa` | 200; `pos_orders.discount_code` = mã; `total` = 22.500; `used_count` = 1 | xanh (canh không chặn nhầm) |
| A3(d) K5 | G5: INSERT tay `pos_discount_codes` (`P20BTAY`, percent 10, is_active 1, không dòng signup) → `dungMa` | 200; `used_count` = 1 | xanh |
| K5 thêm | G6: G4 lần 2 trên CÙNG mã (usage_limit 1 của voucher claim `:396`) | 200 nhưng KHÔNG giảm (luật cũ `:518–521`), `used_count` vẫn 1 — bảo đảm cổng mới không đổi hành vi mã hết lượt | xanh |
| A1 | thu_P20 mục [A]–[F], thu_P21: số ca y cũ (so dòng tổng trước / sau) | xanh | xanh |

Hai người cùng bấm (tiền): hai quầy dùng CÙNG voucher cùng lúc → đã có khoá `:949–961` (đọc lại `used_count` trong giao dịch), việc này không
đụng. Cửa sổ "huỷ đơn gốc giữa lúc kiểm (`:506`) và commit (`:843+`)" là TOCTOU vài ms, cùng cách `/claim` đang kiểm ngoài giao dịch
(`signup-codes.js:381–383` ghi rõ) — KHÔNG thêm ca, KHÔNG chặn trong việc này (Câu hỏi 2).

Đột biến (`viec/P20b/dot_bien.py`, khuôn `viec/P26c/dot_bien.py` nhưng bản sao kiểu `sv` của AUDIT-1 `:248–250`: chép `server/` + `cong_cu/`,
symlink `node_modules`, chạy `node cong_cu/thu_P20.js` TRONG bản sao vì thu_P20 không nhận `--may-chu`; đối chứng chạy trước):

| Chỗ vá | Đột biến | Phải bắt |
|---|---|---|
| A2 | `BV-A2-bo-tra-signup`: `if (maBill) {` → `if (false) {` | ✗ G1 |
| A2 | `VS-A2-chi-chan-don-huy`: thay `await kiemDonCuaMa(maBill)` bằng tra `status === 'cancelled'` tại chỗ (viết lại danh sách đen) | ✗ G2 |
| A2 | `VS-A2-chan-ca-ma-tay`: `if (maBill) {` → `if (!maBill) return res.status(400).json({ code: "MA_DON_GOC_KHONG_HOP_LE" }); {` | ✗ G5 |
| A2 | `VS-A2-bo-qua-ket-qua`: `if (kqDon.loi) return` → `if (false) return` | ✗ G1 |
| A1 | `BV-A1-bo-xuat-ham`: xoá dòng `module.exports.kiemDonCuaMa` | thu_P20 sập khi nạp (`kiemDonCuaMa is not a function` lúc dùng mã) → ✗ G1 (TypeError → 500) |

Neo ngắn, riêng (K3). Mỗi tên là nguyên chuỗi, không sinh bằng vòng lặp (A17).

## 4. Phần A5 — màn hình

Không sửa `client/src`. `Sales.jsx:761` `ordersApi.create` → `api.js:141` ném lỗi với `data.error` → `Sales.jsx:829–830` `setError(err.message)`
— cùng chỗ hiện mọi 400 khác của POST /orders (`GOI_HET_LUOT`, `DISCOUNT_CODE_LIMIT_REACHED`…). Lưu ý cho phiếu: lời KHÔNG hiện "ở ô mã
giảm" (ô đó hiện kết quả `/validate`, `:1402–1450`), mà ở thanh lỗi chung của màn Bán hàng — như các lỗi tạo đơn khác.
Thử tay 1 thao tác (ghi vào CHƯA KIỂM vì máy không bấm được): bill tiền mặt → claim mã trên App → huỷ bill → quầy nhập mã, Áp dụng (✓ vì
`/validate` không kiểm đơn gốc), bấm In → thanh lỗi hiện "Đơn của mã này đã bị huỷ, mã không dùng được.", không có đơn mới.

## 5. Bằng chứng "đột biến cũ vẫn BẮT" (A4)

Chạy trước và sau vá, chép dòng kết quả vào `trang_thai.md`:
- `python3 viec/AUDIT-1/dot_bien.py D1-E-trangthai-dungma D1-E-danhsach-trang D1-E9-claim-kiem D1-E9-ndiem-kiem`
- `python3 viec/P26c/dot_bien.py BV-C2-bo-xoa-ma-bill VS-C2-xoa-ca-ma-da-dung BV-D3-luu-ma-go`
Với phương án A, neo không đổi → kỳ vọng BẮT y cũ; không cần neo lại.

## 6. Ngân sách

Code chạy thật: ~10 dòng (`orders.js` 8 + require 1, `signup-codes.js` 1) — dưới ngân sách 25–40 của phiếu (phiếu tính cả tách hàm).
Thử: ~70 dòng trong `thu_P20.js`. `dot_bien.py` ~70 dòng (hồ sơ việc).

## 7. Câu hỏi cho chủ quán (chờ trước khi làm bước 4)

1. **A1:** chấp nhận phương án A (giữ hàm trong `signup-codes.js`, `module.exports.kiemDonCuaMa`, KHÔNG tạo `server/utils/maBill.js`) vì lý do
   mục 0? Nếu đồng ý, Nghiệm thu A1 đọc là "xuất hàm, hành vi /claim, /nhan-diem không đổi" và A4 bỏ vế "neo lại, ghi trước / sau".
2. **TOCTOU huỷ-giữa-chừng:** chấp nhận không chặn cửa sổ vài ms giữa kiểm và commit (cùng cách `/claim`)? Chặn cần thêm 1 SELECT + 1 kiểm trong
   giao dịch (~5 dòng) và một ca móc `mocTruocTx` như [E] — đề xuất: KHÔNG, giữ đúng phiếu "không thêm giao dịch mới".
3. **A5:** phiếu ghi "hiện ở ô mã giảm" — thực tế hiện ở thanh lỗi chung (mục 4). Chấp nhận, hay muốn sửa phiếu cho đúng chữ? (Không đổi code.)

## 8. Phát hiện (ngoài phạm vi, không sửa)

- `discount-codes.js:72` `/validate` vẫn báo ✓ với voucher của đơn gốc đã huỷ → nhân viên thấy ✓ rồi bị 400 lúc In. Phiếu đã chốt không chặn
  ở đây; nếu muốn báo sớm thì một việc riêng gọi cùng `kiemDonCuaMa` (3 dòng).
- `orders.js:1608` xoá đơn giữ dòng `pos_signup_codes` đã claim nhưng xoá `pos_orders` → `kiemDonCuaMa` trả 404 `KHONG_THAY_DON` → sau vá, voucher
  của đơn đã XOÁ cũng bị chặn (400 MA_DON_GOC_KHONG_HOP_LE) — đúng mục tiêu, ghi để biết; không thêm ca vì xoá đơn chỉ owner và cùng nhánh `.loi`.
