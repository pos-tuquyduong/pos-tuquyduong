# BAN-HANG-1 — kế hoạch (CHỜ DUYỆT — chưa viết bài thử, chưa sửa code)

Số dòng dưới đây đọc trong lượt này trên HEAD `328a4eb` (= main sau sổ v32 + phiếu). Bản 1.

## 0. Hiện trạng đọc được (K1 — file:dòng lượt này)

| Chỗ | Đang làm |
|---|---|
| `Sales.jsx:385–402` `handleClearCustomer` | reset khách / số dư / nợ / cách trả / `activePkgId` / `customerPkgs` / chiết khấu. **Không đụng `cart`** → dòng `is_pkg` (gói đang mua) ở lại giỏ. |
| `Sales.jsx:486–487` `addPkgToCart` | đòi `customer` trước; chỉ 1 gói trong giỏ. |
| `Sales.jsx:528–557` `updateQuantity` | gói về 0 → `removedPkg` → lọc luôn `fromPkg` + `category 'pkg'` → `'all'` (:556). |
| `Sales.jsx:559–567` `removeFromCart` | xoá `is_pkg` → lọc luôn `fromPkg` (:562) + `category` → `'all'` (:564). **Khuôn "gỡ gói" của file: gỡ gói = gỡ cả món 0đ lấy ngay từ gói đó.** |
| `Sales.jsx:360–367` `handleSelectCustomer` | đổi khách → lọc `fromPkg`, `setError('Đã bỏ N món lấy từ gói…')` — khuôn "một dòng báo". Giữ `is_pkg` (gói mua cho khách mới — không đụng). |
| `Sales.jsx:89, 929` | `pkgBuyInCart` = gói đang mua; đang mua gói thì không được lấy từ gói khác (:929) → khi giỏ có `is_pkg`, mọi `fromPkg` đều thuộc gói đó. |
| `Sales.jsx:745–751` | gửi `package_buy` từ `cart.find(is_pkg)` (SĐT lấy từ `customer` — bỏ chọn khách thì thiếu → máy chủ :199 → 400 "Mua gói cần chọn gói và khách hàng" — chính lỗi phiếu nêu); `membership_buy: membershipInCart ? { tier_id } : null`. |
| `orders.js:182` | cho `items: []` khi `package_buy` hoặc `membership_buy` truthy (`{}` truthy). |
| `orders.js:187–189` | cổng thẻ: `membership_buy && membership_buy.tier_id && !normalizePhone(customer_phone)` → 400 không `code`. **Thiếu `tier_id` thì không chạy.** |
| `orders.js:199–201` | cổng gói (khuôn): `package_buy && !(package_buy.package_id && normalizePhone(customer_phone))` → 400 `GOI_MUA_THIEU_THONG_TIN`. |
| `orders.js:432–435` | khối dòng thẻ chỉ khi `membership_buy && membership_buy.tier_id`; `:1068` ghi thẻ khi `membershipTier && phone`. → `membership_buy: {}` + 1 món: :182 qua, :187 bỏ, :433 bỏ → **200 đơn thường** (phiếu đúng); `membership_buy: {}` + `items: []`: :182 qua (`{}` truthy), vòng món không chạy, không có phép nào chặn `orderItems` rỗng sau đó (grep `orderItems.length` = 0 chỗ) → **dự đoán 200 đơn rỗng 0đ** — CHƯA CHẠY, chép đầu ra thật vào `bang_chung_do.txt`. |
| `auth.js:61–65` | `jwt.sign(…, { expiresIn: process.env.JWT_EXPIRES_IN \|\| '8h' })` — đọc `process.env` **lúc xử lý yêu cầu**, không cache → bài thử đổi / xoá biến giữa hai lần gọi được. `grep expiresIn server client/src` → chỉ 1 chỗ này (K4 sạch). |
| `auth.js:17–47` | login đòi `username`/`password`, so `bcrypt.compareSync`; `database.js:917–921` seed `admin`/`admin123` (owner) khi `initDatabase()` (:35) — kho tạm của `thu_P26c.js` có user này. |
| `thu_P26c.js:88–90` | mount 8 route, **không có `auth`** → thêm `'auth'` vào danh sách (1 từ). `:41` đặt khoá ký riêng; `:103` tự ký token 1h — không qua login. Không nạp `dotenv` → biến `JWT_EXPIRES_IN` chỉ có nếu shell cha đặt; ca T3a `delete` trước khi gọi nên không phụ thuộc. |
| `thu_P26c.js:805–819` S4b/S4c | S4b mua thẻ + 1 ly → 200; S4c SĐT `" "` → 400 (chưa so `code`). Trên gốc: **105 đạt · 0 hỏng** (chạy lượt này). |
| `viec/SO-LUONG-1/dot_bien.py:23, 54` | `VS-SOLUONG1-THE-SDT-THO` neo NGUYÊN dòng :187 → thay cổng là đột biến này "không áp được" (ngoài Phạm vi — Câu hỏi 2). `viec/P26c`, `GOI-1`, `GOI-2` không neo `membership_buy` / `auth.js`. |
| K5 người gọi `membership_buy` | `kich_ban.js:471` KB22, `:672` KB32 (đủ `tier_id` + SĐT, `items: []`); `Sales.jsx:751`; thu_P26c S4b/S4c. Không ai gửi thẻ thiếu `tier_id`. |

## 1. A1 — `client/src/pages/Sales.jsx` `handleClearCustomer` (+5 dòng)

**Phương án A (chọn):** đầu hàm (:386, trước `setCustomer(null)`), theo khuôn `removeFromCart` :562–564 + câu báo khuôn :367:
```js
if (cart.some(c => c.is_pkg)) {   // BAN-HANG-1: gói là của khách — bỏ chọn khách thì gỡ gói (và món 0đ lấy ngay từ gói đó) khỏi giỏ
  setCart(cart.filter(c => !c.is_pkg && !c.fromPkg));
  if (category === 'pkg') setCategory('all');
  setError('Đã gỡ gói khỏi giỏ vì bỏ chọn khách');
}
```
Món lẻ, số dư, nợ: các `set…` còn lại giữ nguyên. Không nút mới. Build `client/dist`.
Lọc cả `fromPkg` vì (a) khuôn có sẵn của file (:556, :562) và (b) khi giỏ có `is_pkg` thì mọi `fromPkg` đều là món 0đ của gói đó (:929) —
để lại là đơn 0đ không gói → máy chủ 400 → nhân viên gặp đúng lỗi khó hiểu mà phiếu muốn bỏ. Phiếu ghi "dòng `is_pkg`" — xin xác nhận (Câu hỏi 1).

**Phương án B (bỏ):** đúng chữ phiếu, chỉ `filter(c => !c.is_pkg)` (3 dòng, không reset `category`). Ít 2 dòng nhưng để món 0đ mồ côi.

Bài thử: **không có phép máy** cho A1 — phép tĩnh "có chuỗi `!c.is_pkg` trong thân hàm" là kiểm sự có mặt của bản vá (E13, cấm), và sự vắng
mặt mẫu nguy hiểm không diễn tả được. Thử tay 1 thao tác (ghi vào `trang_thai.md` theo A4): chọn khách → tab Gói → bấm 1 gói → bấm ✕ bỏ
chọn khách → giỏ không còn dòng gói, hiện dòng "Đã gỡ gói khỏi giỏ vì bỏ chọn khách". Ghi **CHƯA KIỂM** bằng máy.

## 2. A2 — `server/routes/orders.js` cổng thẻ :187–189 (thay 2 dòng + 1 chú thích)

**Phương án A (chọn):** thay :187–189 bằng cùng khuôn :199–201:
```js
// BAN-HANG-1: có `membership_buy` thì phải đủ hạng thẻ + SĐT đã chuẩn hoá (cùng khuôn cổng gói dưới) — `{}` lọt cổng cũ (chỉ chạy khi có tier_id)
if (membership_buy && !(membership_buy.tier_id && normalizePhone(customer_phone))) {
  return res.status(400).json({ error: "Mua thẻ cần chọn hạng thẻ và khách hàng", code: "THE_MUA_THIEU_THONG_TIN" });
}
```
Sau cổng, :433 `membership_buy && membership_buy.tier_id` và :1068 `membershipTier && phone` là tập con → **giữ nguyên** (không phải chỗ vá).

**Phương án B (bỏ):** thêm phép riêng `if (membership_buy && !membership_buy.tier_id)` dưới cổng cũ — +3 dòng, hai phép một việc, lệch khuôn gói.

## 3. A3 — `server/routes/auth.js:64` (đổi 1 chuỗi)

**Phương án A (chọn):** `'8h'` → `'30d'`. Biến môi trường vẫn ưu tiên. **Phương án B (bỏ):** đọc hạn từ `pos_settings` — thêm truy vấn mỗi lần đăng
nhập, thêm màn cài đặt; chủ quán đã chọn "chỉ 1 dòng mặc định".

## 4. Bài thử — `cong_cu/thu_P26c.js`: mount `auth` (1 từ ở :88), S4c thêm `code`, mục mới `[T]` trước `sv.close()` (~30 dòng, 6 ca mới + 1 sửa)

So `status` / `code` / số đếm / `order.total` / số giây của token — không dò chữ (E12). `cash_amount` gửi = số GỐC tự tính (:773 đòi khớp tổng).

| Nghiệm thu | Ca | Trên gốc |
|---|---|---|
| A2 chặn | T1a `membership_buy: {}` + `mon(0)` (25.000), `cash_amount: 25000` → 400 `THE_MUA_THIEU_THONG_TIN`, `COUNT(pos_orders)` không đổi | ĐỎ (gốc 200 đơn thường) |
| A2 chặn | T1b `membership_buy: {}` + `items: []`, `cash_amount: 0` → 400 `THE_MUA_THIEU_THONG_TIN`, không đơn | dự đoán ĐỎ (đơn rỗng 0đ) — chép đầu ra thật |
| A2 `{tier_id}` không SĐT | S4c (ca cũ, :815–818): thêm `mk.code === 'THE_MUA_THIEU_THONG_TIN'`, tên ca ghi mã | ĐỎ (gốc 400 không `code`) — là "đổi mã lỗi của S4c", phiếu cho phép |
| A2 K5 | T2a mua thẻ riêng `items: []` + `{ tier_id }` + SĐT, `cash_amount: card_price` → 200, `total = card_price` | xanh (hồi quy, khoá :182) |
| A2 K5 | T2b `membership_buy: null` + `mon(0)` → 200, `total = 25.000`; mua thẻ + món = S4b (cũ) | xanh |
| A3 mặc định | T3a `delete process.env.JWT_EXPIRES_IN` → `POST /auth/login {admin, admin123}` → 200; `jwt.decode(token)`: `exp − iat ≥ 29 × 86400` | ĐỎ (gốc 28.800 s) |
| A3 ưu tiên biến | T3b `process.env.JWT_EXPIRES_IN = '8h'` → login → `exp − iat === 28800`; `finally` xoá biến lại | xanh |
| A4 | `npm test`, `(cd client && npm run build)`, `node kiem_tra_truoc_khi_giao.js --day-du` xanh; `dot_bien.py` đủ VS/BV; thử tay A1 ghi `trang_thai.md` | — |

Ca hai người cùng bấm: cổng A2 chạy trước giao dịch, chỉ đọc body của chính yêu cầu → không tranh chấp; A3 không đụng tiền. Không thêm ca giả.
`bang_chung_do.txt`: đầu ra gốc (T1a, T1b, S4c, T3a đỏ) + `SỐ CA cong_cu/thu_P26c.js: 111` (105 + 6 — chép lại số THẬT sau khi chạy trên code đã vá).
Điều kiện DỪNG của A3 (không bỏ được biến): KHÔNG gặp — `auth.js:64` đọc `process.env` trong handler, bài chạy cùng tiến trình.

## 5. Đột biến `viec/BAN-HANG-1/dot_bien.py` (khuôn `viec/SO-LUONG-1/dot_bien.py`, chép `server/` ra thư mục tạm, runner `thu_P26c.js --may-chu`) — 8 đột biến

| Chỗ vá | Đột biến (tên NGUYÊN chuỗi) | Ca bắt |
|---|---|---|
| orders.js cổng thẻ | `BV-BANHANG1-THE-CONG` (`if (membership_buy && !(…)) {` → `if (false) {`) | T1a |
| | `VS-BANHANG1-THE-CONG-CU` (dựng lại cổng cũ `membership_buy && membership_buy.tier_id && !normalizePhone(customer_phone)`) | T1a |
| | `VS-BANHANG1-THE-CHI-HANG` (chỉ đòi `tier_id`, bỏ SĐT) | S4c |
| | `VS-BANHANG1-THE-SDT-THO` (`normalizePhone(customer_phone)` → `customer_phone` — cũng là `VS-SOLUONG1-THE-SDT-THO` dựng lại, Câu hỏi 2) | S4c |
| | K5 `VS-BANHANG1-THE-SIET-DOI-MON` (thêm `&& items.length` — mua thẻ riêng bị chặn oan) | T2a |
| | K5 `VS-BANHANG1-THE-NULL-CHAN` (`membership_buy &&` → `('membership_buy' in req.body) &&` — gửi `null` bị chặn) | T2b |
| auth.js :64 | `BV-BANHANG1-HAN-DN-8H` (`'30d'` → `'8h'`) | T3a |
| | `VS-BANHANG1-HAN-DN-BO-BIEN` (`process.env.JWT_EXPIRES_IN \|\| '30d'` → `'30d'` — bỏ ưu tiên biến) | T3b |
| Sales.jsx A1 | **không có** — bài chạy thật không chạy React; ghi CHƯA KIỂM. |

Đối chứng trước (bản sao chưa đột biến phải 0 hỏng). Chạy lại `viec/SO-LUONG-1/dot_bien.py`: dự kiến 1 "không áp được" (`VS-SOLUONG1-THE-SDT-THO`), 17 còn lại bị bắt; `viec/P26c`, `GOI-1`, `GOI-2` không đổi.

## 6. Đường song song (K4) và luồng hợp lệ (K5)

- K4 A1: ba chỗ gỡ gói trong `Sales.jsx` (:533–556, :562–564, chỗ mới) cùng lọc `fromPkg` + reset `category`. `handleSelectCustomer` :360 giữ `is_pkg` — chủ ý (gói mua cho khách mới), không đụng.
- K4 A2: `grep membership_buy orders.js` → :178, :182, :187, :433 — :182 và :433 là tập con sau cổng, giữ. `grep normalizePhone` cổng gói :199 — không đổi (cấm).
- K4 A3: `grep expiresIn server client/src` → 1 chỗ. `AuthContext.jsx` cấm.
- K5 phải KHÔNG bị chặn — mỗi luồng một ca + đột biến siết: mua thẻ + món (S4b), mua thẻ riêng `items: []` (T2a ← `SIET-DOI-MON`; kich_ban KB22/KB32), đơn không thẻ `null` (T2b ← `NULL-CHAN`) và không gửi khoá (S1g…), mua gói (S2e/S2f), lấy từ gói (A2b), đăng nhập có biến `8h` (T3b ← `BO-BIEN`). Dữ liệu cũ trên production: cổng chỉ xét body yêu cầu mới, không đọc DB.
- Màn hình: `Sales.jsx:751` gửi `null` khi không thẻ, `{ tier_id }` khi có; `addMembershipToCart` :509 đòi khách — bỏ chọn khách sau khi thêm thẻ → `membership_buy` có `tier_id` không SĐT → 400 (:187 cũ đã vậy, nay thêm `code`). Màn hình chưa gỡ thẻ khi bỏ chọn khách — ngoài phiếu → Phát hiện (không sửa).

## 7. Ngân sách

Code: `Sales.jsx` +5 · `orders.js` +3/−3 (1 dòng chú thích) · `auth.js` ±1 → ~9 dòng (phiếu 15–25). Thử: ~32 dòng, 6 ca mới + 1 sửa (phiếu ~50). `dot_bien.py` ~55 dòng, 8 đột biến.

## Câu hỏi (chờ chủ quán chốt trước khi làm)

1. **A1 lọc cả `fromPkg`** (món 0đ lấy ngay từ gói đang mua) cùng dòng `is_pkg`, theo khuôn `removeFromCart` :562 — phiếu chỉ ghi `is_pkg`. Đề xuất: có (lý do mục 1). Không thì làm phương án B.
2. **`viec/SO-LUONG-1/dot_bien.py:23` neo nguyên dòng :187** → sau A2 báo 1 "không áp được" (ngoài Phạm vi). Đề xuất (b) như tiền lệ SO-LUONG-1 Q1: không sửa file cũ, dựng lại thành `VS-BANHANG1-THE-SDT-THO`, ghi rõ trong `trang_thai.md`. (a) thêm file vào Phạm vi, sửa 1 neo.

## Phát hiện (ngoài Phạm vi — không sửa)

- `Sales.jsx:509` thẻ hội viên trong giỏ cũng ở lại khi bỏ chọn khách (cùng dạng lỗi phiếu, cho thẻ) → gửi lên 400 `THE_MUA_THIEU_THONG_TIN`. Cùng khuôn A1, +3 dòng — chủ quán duyệt thì gộp vào việc này hoặc việc sau.
- `orders.js` không có phép chặn `orderItems` rỗng sau các cổng đầu route (T1b lộ ra qua `membership_buy: {}`); sau A2 còn đường nào tới đơn rỗng không thì chưa rà — ghi để AUDIT-3 rà.
