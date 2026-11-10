# VI-ME-1 — Kế hoạch (chờ chủ quán duyệt)

## 1. Mọi lối đụng tiền mẹ (grep `parent_phone`, `parent_balance`, `tai_khoan_me`, `tru_tai_khoan_me`, `giu_vi_me` — đọc 10.11)

| # | Lối | File:dòng | Đụng tiền mẹ thế nào | Sửa? |
|---|---|---|---|---|
| 1 | POST /orders (quầy cũ, khi tắt cờ `thanh_toan_payos_bat_buoc`) | `server/routes/orders.js:201-202` nhận `parent_phone`, `parent_balance_amount` từ thân; `:686` chuẩn hoá; `:853-875` đọc ví + `dangGiu`; `:962-978` `ghiVi` TRỪ ví mẹ | trừ ví SĐT màn gửi, KHÔNG đối chiếu `pos_customers` | **SỬA** — gọi `kiemTraMe` ngay sau `:686` |
| 2 | Tạo phiên giữ chỗ POST /thanh-toan/phien | `server/utils/giuCho.js:47-50` lấy `goc.parent_phone` khi `tru_tai_khoan_me`; `:52` gọi `taoDon(..., {chiTinh:true})` với `don.parent_phone`; `:56-60` kiểm PIN ví mẹ; `:64-65` GIỮ ví mẹ (`giu_vi_me`) | giữ tiền ví SĐT màn gửi | **qua lối 1** — `taoDon` chế độ chỉ tính chạy TRƯỚC PIN và TRƯỚC giao dịch ghi phiên; điều kiện gọi kiểm là "có `parent_phone`" (không đòi `parent_balance_amount > 0`) nên nhánh này kiểm được. Không thêm dòng ở giuCho.js |
| 3 | Chốt phiên (tiền mặt / tài khoản / QR / tay / webhook) | `giuCho.js:105` thân = `phien.than` (có `parent_phone`) + `parent_balance_amount: giu_vi_me` → `taoDon` | trừ ví mẹ thật | **qua lối 1** — kiểm lại lúc chốt (quan hệ đổi giữa giữ và chốt → 403, phiên chuyển `loi`, nhả giữ chỗ theo luật có sẵn `giuCho.js:130-133`) |
| 4 | POST /orders/tinh-thu | `orders.js:1344` `TRUONG_TINH_THU` KHÔNG có `parent_phone` / `parent_balance_amount` | không đụng | không sửa — lọc danh sách trắng đã chặn |
| 5 | Số dư mẹ báo cho màn thu tiền | `server/utils/docKhach.js:24-28` `parent_balance` đọc theo `parent_phone` CỦA KHÁCH trong CSDL | chỉ đọc, đúng quan hệ | không sửa |
| 6 | GET /wallets/:phone | `server/routes/wallets.js:40-50` | đọc ví một SĐT (nhân viên đăng nhập), không gắn với "mẹ" | không sửa (ghi Phát hiện nếu cần) |
| 7 | Màn khách xem phiên | `server/utils/manKhach.js:127` dựng lại đơn bằng `taoDon` chiTinh từ `phien.than`; `:161` hiện `giu_vi + giu_vi_me` | chỉ hiển thị | không sửa — đi qua lối 1, lỗi thì `dungHien` trả bản rút gọn (đã có) |
| 8 | App KH tạo đơn | `server/utils/donApp.js:281` `taoPhien({ cach, don, tru_tai_khoan: tra.vi, pin })` — KHÔNG có `tru_tai_khoan_me`; `:163-164` `thanDon` không có `parent_phone`; `giuCho.js:27` `TRUONG_DON` không có `parent_phone` | **App KHÔNG có lối trừ tiền mẹ** (nghiệm thu E) | không sửa; có ca thử khoá điều đó |
| 9 | `server/routes/kh/index.js` | grep `parent` → 0 dòng | không đụng | không sửa |
| 10 | Hoàn / huỷ / xoá đơn, duyệt hoàn, đền | `orders.js:1513-1519` `hoanVi`, `wallets.js:105-117` `ghiHoan` (`order.parent_phone`), `refunds.js:173-178`, `tienDaTra.js:50,86-88` | đọc từ ĐƠN đã ghi | không sửa (nghiệm thu D) |
| 11 | Đối soát / điểm / hoá đơn | `doiSoat.js:124`, `diemThat.js:12`, `hoaDon.js:35`, `donThu.js` | đọc từ đơn | không sửa |

## 2. Phương án

**A (chọn).** Một hàm `kiemTraMe(q, phoneKhach, sdtMe)` ở `server/utils/viMe.js` (mới, ~15 dòng): đọc `SELECT parent_phone FROM pos_customers WHERE phone = ?`
theo SĐT khách đã chuẩn hoá; trả `null` khi khách tồn tại VÀ `normalizePhone(parent_phone) === normalizePhone(sdtMe)`, ngược lại trả
`{ status: 403, body: { error: 'Tài khoản này không phải tài khoản mẹ của khách', code: 'KHONG_PHAI_TK_ME' } }`.
Gọi MỘT chỗ trong `taoDon` (`orders.js`, ngay sau dòng chuẩn hoá `normalizedParentPhone` ~686), điều kiện
`parent_phone || Number(parent_balance_amount) > 0` (đúng câu nghiệm thu A — gửi `parent_balance_amount` mà không SĐT mẹ cũng 403).
Vì lối 2, 3, 7 đều đi qua `taoDon` (và trước lời gọi này `taoDon` chưa ghi gì — `sed -n 178,890p orders.js | grep "run(\|INSERT\|UPDATE "` → 0 dòng),
một lời gọi phủ cả tạo đơn, giữ chỗ, chốt phiên. Ước lượng: viMe.js ~15 dòng + orders.js ~4 dòng + kiem_tra 1 dòng. **~20 dòng máy chủ**.

**B.** Gọi `kiemTraMe` ở hai chỗ: `orders.js:853` (khối trừ mẹ) và `giuCho.js:47` (tạo phiên). ~25 dòng, hai chỗ gọi → K4 (lệch nhau về sau),
và khối `:853` chỉ chạy khi `parent_balance_amount > 0` → phải thêm nhánh cho "gửi `parent_phone` không tiền". Bỏ.

**Hàm riêng hay viết thẳng?** Phiếu dặn `viMe.js` + nghiệm thu B "dùng CHUNG một hàm" → giữ hàm riêng dù hôm nay chỉ một chỗ gọi (sau này lối mới
gọi lại; bộ kiểm có thể canh tên hàm).

**Chuẩn hoá:** `normalizePhone` (`helpers.js:153`) — cùng hàm với `:686` và `giuCho.js:47`. Khách: dùng `phone` đã chuẩn hoá của `taoDon` (`:675`).

**Khoá đua (luật §5):** kiểm đọc NGOÀI giao dịch ghi. Đua chỉ xảy ra khi người có quyền sửa khách đổi `parent_phone` đúng trong vài mili-giây giữa
kiểm và ghi — không phải lối tấn công (người đó đã sửa được quan hệ thì sửa thẳng). Không đưa vào giao dịch (thêm tham số `tx` vào luồng ghi ví = nhiều
dòng hơn). Ghi vào CHƯA KIỂM. **Chủ quán muốn kiểm lại TRONG giao dịch thì nói — thêm ~4 dòng.**

## 3. Bài thử `cong_cu/thu_VIME1.js` (đỏ trên gốc) — ánh xạ nghiệm thu

Khung: máy chủ thật trên kho tạm (khuôn `thu_P3.js` / `thu_KHACHAPP1.js`). Dữ liệu: khách A (mẹ M), khách B không mẹ, M và X (người lạ) có ví 500.000.

| Ca | Nghiệm thu | Nội dung | Gốc |
|---|---|---|---|
| A1 | A | POST /orders A gửi `parent_phone`=X, `parent_balance_amount` → 403 `KHONG_PHAI_TK_ME` + đúng câu; ví X không đổi; không thêm đơn; không dòng sổ ví / điểm | ĐỎ |
| A2 | A | B (không mẹ) gửi `parent_phone`=M → 403 | ĐỎ |
| A3 | A | không khách (`customer_phone` rỗng) và SĐT không có trong `pos_customers` gửi `parent_*` → 403 | ĐỎ |
| A4 | A | `parent_balance_amount > 0`, không `parent_phone` → 403 | ĐỎ (gốc trả 400 lệch tổng) |
| A5 | A·K5 | A gửi M dạng `+84…` / có dấu cách → qua (chuẩn hoá hai vế) | xanh |
| B1 | B | POST /thanh-toan/phien `tru_tai_khoan_me`, `parent_phone`=X → 403; không thêm dòng `pos_phien_thanh_toan`; `dangGiu(X)` = 0 | ĐỎ |
| B2 | B | phiên đúng mẹ đã giữ → đổi `parent_phone` của A trong CSDL → chốt bằng `tai_khoan` và bằng xác nhận tay → 403, ví M không đổi, không đơn, phiên `loi` | ĐỎ |
| B3 | B·K5 | tinh-thu có `parent_phone`=X trong thân → 200, số như không gửi | xanh (khoá) |
| B4 | B | tĩnh: `orders.js` gọi `kiemTraMe(` đúng 1 lần, trước `if (phien?.chiTinh)`; `giuCho.js` không tự đọc `pos_customers` | ĐỎ (chưa có hàm) |
| B5 | B·K5 | B1 gửi kèm PIN mẹ SAI → vẫn 403 `KHONG_PHAI_TK_ME` (kiểm mẹ chạy trước PIN, không lộ ví người lạ có PIN hay không) | ĐỎ |
| B6 | B | số dư mẹ báo cho màn (GET /v2/customers hồ sơ A) = số dư ví M (đọc theo `parent_phone` trong CSDL) | xanh (khoá) |
| B7 | B | màn khách xem phiên (`manKhach.js:127`) của phiên đúng mẹ dựng đủ món như cũ | xanh (khoá) |
| C1 | C | A đúng mẹ qua POST /orders → 200, ví M giảm đúng số, đơn ghi `parent_phone`=M | xanh (khoá K5) |
| C2 | C | A đúng mẹ qua phiên `tai_khoan` → giữ đúng, chốt → ví M giảm đúng | xanh |
| C3 | C | hai quầy cùng giữ ví M cho A (hai phiên song song) → tổng giữ ≤ số dư (luật cũ không đổi) | xanh |
| D1 | D | đơn C1 → xoá quan hệ mẹ của A → huỷ đơn (PUT …/cancel hoặc DELETE owner) → ví M được hoàn đúng | xanh (khoá) |
| E1 | E | App POST đơn kèm `parent_phone`/`tru_tai_khoan_me` thừa → ví M không đổi (thân App lọc) + tĩnh `donApp.js` không có `tru_tai_khoan_me` | xanh (khoá) |
| K5 | K5 | `npm test` đủ bài cũ (thu_P3, thu_P26b, thu_KHMUA1…) xanh | — |

Đường song song canh (K4): lối 1-3 qua một lời gọi; tinh-thu lọc trắng; App không có trường mẹ; hoàn/huỷ đọc đơn.
Luồng hợp lệ KHÔNG bị chặn (K5): đúng mẹ quầy cũ (C1), đúng mẹ qua phiên (C2), SĐT mẹ khác dạng viết (A5), đơn không dùng mẹ (mọi bài cũ), huỷ đơn cũ có mẹ (D1),
khách chỉ có trong `pos_registrations` (không dòng `pos_customers`, `docKhach.js:15` vẫn hiện số dư mẹ) → theo nghiệm thu A BỊ chặn — hỏi chủ quán (Câu hỏi 3); khách mới đăng ký (registrations.js:275 tạo luôn dòng `pos_customers` qua `taoKhach` — có mẹ thì ghi `parent_phone`; sẽ đọc lại khi viết bài).

## 4. Đột biến (`viec/VI-ME-1/dot_bien.py`)
- `BV-1-bo-goi` — xoá lời gọi `kiemTraMe` trong `orders.js` → A1, A2, B1, B2 ĐỎ.
- `VS-1-chi-khi-co-tien` — điều kiện chỉ `parent_balance_amount > 0` → B1 ĐỎ (tạo phiên không gửi tiền mẹ).
- `VS-2-khong-chuan-hoa` — so `parent_phone` thô → A5 ĐỎ (chặn oan).
- `VS-3-chi-kiem-ton-tai` — chỉ kiểm khách có mẹ, không so bằng → A1 ĐỎ.
- `VS-4-sau-chi-tinh` — dời lời gọi xuống sau `if (phien?.chiTinh)` → B1 ĐỎ.

## 5. Ngân sách
~20 dòng máy chủ (ngân sách phiếu ~40) + ~200 dòng thử. `kiem_tra_truoc_khi_giao.js`: thêm 1 dòng `chayBaiThat('cong_cu/thu_VIME1.js')`.
Không đụng `wallets.js`, `kh/index.js`, `giuCho.js`, `donApp.js` (trong Phạm vi nhưng không cần).
