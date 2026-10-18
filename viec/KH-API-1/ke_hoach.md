# KH-API-1 — Kế hoạch (ĐÃ DUYỆT 18.10 — chủ quán trả lời Q1–Q7, phiếu sửa ở `6fe38d8`)

Soạn 18.10.2026 trên `27e1ac1` (`PHIEU: KH-API-1`). Mọi trích dẫn file:dòng đọc trong lượt này.

**Chủ quán chốt (đè lên các đề xuất bên dưới nếu khác):** Q1 làm CẢ HAI qua token — `/api/kh/nhan-ma-bill` (voucher, hàm `/claim`) VÀ
`/api/kh/nhan-diem` (điểm, hàm `/nhan-diem`) → lỗ F3 phần điểm đóng; E3 thêm `ma_khach_moi` (mã giảm phát qua `/claim`, nối bằng
`pos_signup_codes.claimed_phone`). Q2 đồng ý (hàm dưới route trong `signup-codes.js`, không tạo `nhanMaBill.js`). Q3 đồng ý (`products.js`
vào Phạm vi). Q4 BỎ màn quầy (P9) khỏi việc này — không sửa `client/`, không build `dist` → KH-QUAY-1; giữ API `cap-ma`. Q5 `trust proxy 1`,
ghi CHƯA KIỂM. Q6 `retail`. Q7 chỉ mã App xin bị đếm / chặn; mã quầy luôn dùng được.

**Khác kế hoạch khi làm (ghi rõ, không lan):** thêm `server/routes/kh/loi.js` (trong `server/routes/kh/**`) — bảng mã lỗi + trả lỗi dùng
chung cho `kh/index.js` và `kh/quay.js`; đột biến `VS-P6-loyalty-lich-su-20`, `BV-Q3-kh-tu-doc-bang`, `VS-A3-het-han-bang` BỎ (hàm dùng
chung nên so sâu hai đường không phân biệt được; SX tắt trong bài nên `/menu` đọc bảng hay qua `layMenuQuay` ra như nhau — ghi CHƯA KIỂM).

## 0. Bảy chỗ cần chủ quán quyết TRƯỚC khi viết code

Chi tiết + phương án đề xuất ở `trang_thai.md` → `## Câu hỏi` (Q1–Q7). Tóm tắt:

| # | Chỗ vướng | Bằng chứng | Đề xuất |
|---|---|---|---|
| Q1 | E6 nói đi qua `/claim` (đổi **voucher**), H nói "nhận mã bill → **điểm tăng**" — điểm là đường `/nhan-diem`, khác hẳn | `signup-codes.js` `/claim` chỉ `INSERT INTO pos_discount_codes`; `/nhan-diem` mới `INSERT INTO pos_point_transactions` | E6 = `/claim` đúng chữ phiếu; H đọc là "voucher phát ra giống hệt đường cũ" |
| Q2 | Tách `/claim` ra `utils/nhanMaBill.js` làm ĐỎ phép E9 — E9 soi khối `router.post('/claim'` TRONG `signup-codes.js` (`kiem_tra_truoc_khi_giao.js:406–455`); phiếu cấm sửa bộ kiểm ngoài mảng bài | xem dòng trên | Phương án A: giữ thân trong `signup-codes.js`, đổi thành hàm có tên đặt NGAY sau dòng route (vẫn nằm trong khối E9 soi) — **không tạo `nhanMaBill.js`**, không đụng E9 |
| Q3 | E5 "lấy như quầy đang lấy" — toàn bộ logic menu nằm TRONG thân `GET /` của `server/routes/products.js:20–111`, file này KHÔNG có trong Phạm vi | — | Thêm `server/routes/products.js` vào Phạm vi để tách thân thành hàm `layMenuQuay(category)` (khuôn `module.exports.kiemDonCuaMa` cuối `signup-codes.js`) |
| Q4 | D sửa `Customers.jsx` → phải build `client/dist` (CLAUDE.md §8, P1), mà `client/dist/**` KHÔNG có trong Phạm vi → cổng A6 đỏ | các phiếu BAN-HANG-1, GOI-1, GOI-2, P26c đều ghi `client/dist/**` | Thêm `client/dist/**` vào Phạm vi |
| Q5 | Giới hạn theo IP (B1): `index.js` chưa đặt `trust proxy` (grep `trust proxy\|req\.ip` trong `server/` → 0 chỗ). Trên Render, `req.ip` sẽ là IP proxy → MỌI khách chung một IP → 20 lần/giờ cho CẢ QUÁN (chặn oan, K5) | — | Đặt `app.set('trust proxy', 1)` trong `index.js`; chủ quán thử trên Render (mục CHƯA KIỂM) |
| Q6 | Khách tạo từ App: `customer_type` nào? `customers.js:348` — `'retail'` → `sync_status 'retail_only'` (không xuất sang SX), mặc định `'subscription'` → `'new'` (vào hàng xuất SX) | — | `'retail'` (khách lẻ, không xuất SX) |
| Q7 | Giới hạn B2 "≤ 10 lần sai / SĐT / giờ" chặn cả mã QUẦY cấp → kẻ xấu biết SĐT chỉ cần 2 lần `xin-ma` + 10 lần gõ sai là khoá khách thật 1 giờ, thu ngân cũng không cứu được (soát kế hoạch bắt) | — | Trần theo SĐT chỉ đếm và chỉ chặn mã lối App (`nguon 'gui'`); mã quầy vẫn giữ trần 5 lần / mã |

Kế hoạch dưới đây viết theo các đề xuất trên. Chủ quán chọn khác thì sửa đúng phần đó.

## 1. Code thật đã đọc (K1)

- SĐT: `normalizePhone` (`helpers.js:152`) KHÔNG kiểm dạng (`normalizePhone('abc')` → `'abc'`), `isValidPhone` (`helpers.js:141`) kiểm `^(0|\+84)[0-9]{9,10}$`. Đường quầy tạo khách dùng cả hai (`customers.js:324–330`). → A1 dùng đúng cặp đó; bọc `String()` vì `normalizePhone` gọi `.replace` (số / object sẽ ném).
- Tạo khách: chỉ có MỘT câu chèn đầy đủ ở quầy, `customers.js:352–370` (`qr_code = generateQRCode(phone)` = `QR-<sđt>` `helpers.js:68`; `sync_status` theo `customer_type`; `created_by`, `created_at = getNow()`). Không có hàm dùng chung; `customers.js` ngoài Phạm vi → chép ĐÚNG bộ cột đó (một câu) vào `maKhach.js`, `created_by = 'app_kh'`. `pos_customers.phone` và `qr_code` UNIQUE (`database.js:81,86`).
- Token nhân viên: `jwt.sign({ userId, role }, JWT_SECRET)` (`routes/auth.js:61–64`); `authenticate` (`middleware/auth.js:25–79`) `jwt.verify(token, JWT_SECRET)` rồi tra `pos_users` theo `decoded.userId`. Token khách ký bằng khoá khác → verify ném `JsonWebTokenError` → 401 `INVALID_TOKEN` ở MỌI route `/api/pos/*` có `authenticate` — F2 chiều này đạt mà KHÔNG sửa `auth.js`.
- Điểm: `BALANCE_SQL` + câu lịch sử `LIMIT 50` nằm TRONG `loyalty.js:28–32, 54–72`; voucher `loyalty.js:77–119`; `/redeem` dùng lại `BALANCE_SQL` trong giao dịch (`loyalty.js:161`).
- `/claim`: `signup-codes.js` route `router.post('/claim'` — SĐT lấy từ `req.body.phone`; chiếm mã `UPDATE … AND claimed_at IS NULL` + `changes !== 1` trong giao dịch; 409 `MA_DA_DUNG`; `kiemDonCuaMa` (completed + paid). Voucher phát ra CHỈ vào `pos_discount_codes`, KHÔNG vào `pos_voucher_grants` → không hiện ở `/loyalty/vouchers/:phone` (Phát hiện F1).
- Đơn: `pos_orders` (`database.js:166–196` + ALTER: `payment_status`, `debt_amount`, `discount_*`, `shipping_fee`…); "đã trả" = `total − debt_amount` (cùng công thức `tienDaTra.js:45`). Món: `pos_order_items` (`database.js:273–289`).
- Menu: `products.js:20–111` — SX bật: `callSxApi('/api/pos/products-with-stock')` + nhớ tồn; SX lỗi/tắt: `getFallbackProducts` (`products.js:116–134`, `ton_cu`, `ton_luc`, không bao giờ 999); trộn giá `pos_products` theo khoá ghép, `sellable = price > 0`. Quầy coi "hết" khi `!khong_quan_kho && stock_quantity === 0`, `null` = chưa rõ (`Sales.jsx:455, 862–867`).
- Gắn route: `index.js:82–114`, `express.static` ở `index.js:154`; log mỗi yêu cầu chỉ in `method + req.path` (`index.js:64–68`) — không in thân / header → không lộ mã hay token. CORS cho `Authorization`, có `PUT` (`index.js:56–60`).
- Phép kiểm tĩnh liên quan: E9 (`kiem_tra…:400–470`) soi khối `/claim` + `/nhan-diem` trong `signup-codes.js`; E14 (`kiem_tra…:526–561`) đếm route ghi không qua `loiGhi` — CHỈ quét `server/routes/*.js` cấp 1 (`readdirSync` lọc `.js`), KHÔNG vào `server/routes/kh/`.
- Mảng bài chạy thật: `kiem_tra_truoc_khi_giao.js:495`.

## 2. Phương án từng phần

### P1 — Bảng mã đăng nhập (`database.js`, ngay sau khối `pos_customers`)
- **A (chọn):** MỘT bảng `pos_kh_ma_dang_nhap` (`sdt, ma_bam, nguon 'quay'|'gui', cap_boi, ip, tao_luc, het_han, so_lan_thu, dung_luc, huy_luc`) + 2 chỉ mục `(sdt, tao_luc)`, `(ip, tao_luc)`. Mọi giới hạn B đếm trên chính bảng này. ~18 dòng.
- B: thêm bảng đếm IP riêng. +12 dòng, không cần — IP đã là cột của bảng mã.
- `so_lan_thu` (phiếu gọi "số lần sai"): đếm MỌI lần thử có so mã, kể cả lần đúng cuối — để giữ chỗ thử bằng MỘT câu có điều kiện (`… SET so_lan_thu = so_lan_thu + 1 WHERE id = ? AND so_lan_thu < 5`), chặn đua 100 yêu cầu đoán song song. Hệ quả đúng như phiếu: sai 5 lần → mã chết; sai 4 + đúng 1 → vào được.
- Giờ: cột ghi bằng `getNow()`; mốc "trước 60 giây / 1 giờ", "hạn +5 phút" tính TRONG câu SQL `strftime('%Y-%m-%dT%H:%M:%S', ?, '-1 hour')` với `? = getNow()` — cùng định dạng chuỗi, không viết công thức giờ thứ hai (LUAT §2 Thời gian).

### P2 — `server/utils/maKhach.js` (sinh / xin / xác minh mã, tạo khách) ~95 dòng
- Hằng `GIOI_HAN = { HAN_MA_PHUT: 5, CACH_GIAY: 60, SDT_GIO: 5, IP_GIO: 20, THU_MOI_MA: 5, SAI_SDT_GIO: 10, TOKEN_NGAY: 30, TEN_TOI_DA: 50 }` — một chỗ có tên (B3).
- `sinhMa()` = `crypto.randomInt(0, 1e6)` đệm 6 chữ số. `bamMa(sdt, ma)` = HMAC-SHA256 khoá `KH_JWT_SECRET` (lộ bảng cũng không dò ngược 10⁶ mã được nếu không có khoá); so bằng `timingSafeEqual`.
- `capMaQuay(sdt, nguoiCap)` — D: chèn dòng `nguon 'quay'`, không giới hạn (nhân viên đã đăng nhập), trả `{ ma, het_han_giay: 300 }`.
- `xinMaGui(sdt, ip)` — B1 bằng MỘT câu `INSERT … SELECT … WHERE NOT EXISTS(<dòng gui của SĐT có tao_luc > now−60 giây>) AND (<đếm dòng gui của SĐT, tao_luc > now−1 giờ>) < 5 AND (<đếm dòng gui của IP, tao_luc > now−1 giờ>) < 20` rồi kiểm `changes` → 0 = 429. CẢ BA truy vấn con lọc `nguon = 'gui'` — mã quầy cấp không ăn vào lượt App và máy quầy không ăn vào lượt IP của khách cùng wifi. So nghiêm `>` → đúng 60 giây là được. Một câu = không đua; lần bị từ chối không chèn dòng nên không tự tính thêm. Chế độ không gửi (`coKenhGui()` = false) → `huy_luc` ghi sẵn NGAY trong câu chèn (không chèn rồi mới huỷ — khe giữa hai câu cho lần xác minh mã quầy chọn nhầm dòng chưa huỷ); có kênh → `guiMaKhach(sdt, ma)` sau khi chèn.
- `now` lấy MỘT lần `getNow()` cho mỗi yêu cầu và kiểm dạng `^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$` trước khi đưa vào `strftime` (dạng lạ → `strftime` ra NULL → các phép giới hạn thành MỞ); sai dạng → ném lỗi → 500.
- Biến môi trường (`KH_JWT_SECRET`, `GUI_MA_KHACH`) đọc LÚC GỌI HÀM, không lúc nạp module — đổi giữa chừng có hiệu lực ngay (bài thử F1, C dựa vào đó).
- `xacMinhMa(sdt, ma, ten)` — thứ tự (mỗi bước một lý do):
  1. lấy mã MỚI NHẤT còn hiệu lực (`dung_luc IS NULL AND huy_luc IS NULL AND het_han > now AND so_lan_thu < 5`); không có → 400 `MA_HET_HAN`;
  2. mã đó là `nguon 'gui'` (Q7) → đếm lượt sai theo SĐT trên các dòng `gui` có `tao_luc > now−1 giờ` (`SUM(so_lan_thu) − số dòng đã dùng`) ≥ 10 → 429 `QUA_NHIEU_LAN`. Cửa sổ tính theo lúc TẠO mã (mã chỉ sống 5 phút → lệch tối đa 5 phút, chấp nhận);
  3. so băm; ĐÚNG mà SĐT chưa là khách và `ten` không hợp lệ → 400 `CAN_TEN`, KHÔNG ghi gì (A4: mã không bị tiêu, không mất lượt; chỉ người đã cầm mã đúng mới thấy `CAN_TEN` → không lộ ai là khách);
  4. giữ một lượt thử (câu có điều kiện ở P1) — `changes` 0 → `MA_HET_HAN`; sai → 400 `MA_SAI`;
  5. giao dịch: `UPDATE … SET dung_luc = ? WHERE id = ? AND dung_luc IS NULL AND huy_luc IS NULL` + kiểm `changes === 1` (A2) → chèn khách nếu chưa có (`INSERT … ON CONFLICT(phone) DO NOTHING`, rồi đọc lại id) → commit.
- Phương án B (bỏ): huỷ mọi mã cũ mỗi khi cấp mã mới. Thêm 1 câu ghi mỗi lần, và App bấm "xin mã" sẽ huỷ luôn mã quầy vừa cấp. "Mới nhất còn hiệu lực" cho cùng kết quả không cần câu ghi đó.

### P3 — `server/utils/guiMaKhach.js` ~22 dòng
- `coKenhGui()` → chế độ hiện tại có gửi mã đi không; `guiMaKhach(sdt, ma)` gửi theo chế độ. `GUI_MA_KHACH`: `quay` (mặc định, không gửi), `gia` (giữ `{ sdt, ma }` cuối trong bộ nhớ — bài thử đọc qua `layMaGiaCuoi()`, không có đường HTTP nào tới hàm này), lạ → `quay` + `console.warn` in TÊN chế độ (không in mã). KH-OTP-1 chỉ thêm nhánh `zns` ở file này.

### P4 — `server/middleware/khachAuth.js` ~40 dòng
- `canCauHinhKhach`: thiếu `KH_JWT_SECRET`, HOẶC trùng `JWT_SECRET` → 503 `KH_CHUA_CAU_HINH` (đóng, không mở). Vế "trùng khoá" thêm 1 điều kiện để F2 không phụ thuộc chủ quán đặt khoá khác.
- `kyTokenKhach(khach)` → `jwt.sign({ loai: 'kh', id }, KH_JWT_SECRET, { expiresIn: '30d' })`.
- `xacThucKhach`: Bearer → `jwt.verify(…, KH_JWT_SECRET)` → `loai === 'kh'` → tra `pos_customers` theo `id` → `req.khach = { id, phone, name, created_at }`. Mọi lỗi → 401 `KH_TOKEN_SAI` (một mã, không nói vì sao). SĐT LUÔN từ hàng CSDL, không từ token / thân / tham số.

### P5 — `server/routes/kh/index.js` (mount `/api/kh`) ~150 dòng + `server/routes/kh/quay.js` (mount `/api/pos/kh`) ~25 dòng
- `router.use(canCauHinhKhach)` ở ĐẦU router → mọi `/api/kh/*` kể cả đăng nhập (F1).
- `POST /dang-nhap/xin-ma` · `POST /dang-nhap/xac-minh` (không cần token); mọi route khác `xacThucKhach`.
- A5: `xin-ma` trả CÙNG thân `{ success: true, lay_ma_tai_quay }` cho SĐT có / chưa có — `lay_ma_tai_quay` chỉ phụ thuộc chế độ gửi, không phụ thuộc SĐT; route KHÔNG đọc `pos_customers`.
- E1 `GET /toi` → `{ sdt, ten, ngay_tao }`; `PUT /toi {ten}` → trim 1–50, sai → 400 `TEN_KHONG_HOP_LE`; chỉ `UPDATE pos_customers SET name, updated_at WHERE id = req.khach.id`.
- E2 / E3 → hàm chung P6, tham số = `req.khach.phone`.
- E4 `GET /don?trang=n` (20 đơn / trang, `ORDER BY id DESC`, trả `con_nua`) · `GET /don/:ma` → `WHERE customer_phone = ? AND code = ?`; không thấy → 404 `KHONG_THAY_DON` (không phân biệt "không có" với "của người khác"). Trường trả: `ma, ngay, tong, da_tra (= total − debt_amount), trang_thai, thanh_toan` + món `ten, so_luong, don_gia (flash/tier/unit như `tienDaTra.js:16`), thanh_tien, ghi_chu`.
- E5 `GET /menu` → `layMenuQuay()` (Q3) rồi lọc `sellable` và CHỈ chép `{ ma: unique_id, ten, nhom: category, gia, con_hang, ton_cu, ton_luc }` (`ton_cu` + `ton_luc` không phải số nội bộ: CLAUDE.md §5.8 bắt hiện "giá trị cuối biết được + giờ" khi mất SX — không có hai trường này App sẽ nói "còn hàng" chắc nịch bằng số cũ; số tồn thật KHÔNG trả); `con_hang` = `khong_quan_kho ? true : typeof stock_quantity === 'number' ? stock_quantity > 0 : null` (cùng quy ước `Sales.jsx:455`). Không `...p`.
- E6 `POST /nhan-ma-bill {ma}` → hàm `/claim` (Q2-A) với SĐT `req.khach.phone`; trả nguyên `status` + `code` của `/claim`.
- `quay.js`: `POST /cap-ma {sdt}` — `authenticate` (cùng mức quyền `GET /customers/search`, `PUT /customers/:id` — `customers.js:136, 434` chỉ có `authenticate`; nhân viên thu ngân phải bấm được) + `canCauHinhKhach` (cần khoá để băm) → `capMaQuay(sdt, req.user.username)`.
- Lỗi 500 ở cả hai file: `SQLITE_BUSY` → `loiGhi(res, err)` của `wallets.js` (xuất ở cuối file) → 409 `KHO_BAN`; còn lại → `{ error: 'Lỗi máy chủ…', code: 'LOI_MAY_CHU' }`, log `err.message` (không in thân yêu cầu). Không gọi thẳng `loiGhi` cho mọi lỗi: nhánh còn lại của nó trả `err.message` (`wallets.js:101`) — lộ lỗi nội bộ (G).
- A (chọn) hai file: route khách và route NHÂN VIÊN khác loại xác thực — tách file để không ai gắn nhầm middleware. `quay.js` là route nhân viên (`authenticate`), gắn dưới `/api/pos` như mọi route quầy; luật "route khách mount một chỗ tại `/api/kh`" vẫn giữ — mọi route xác thực bằng token KHÁCH chỉ ở `/api/kh`. B một file hai router: −5 dòng, dễ nhầm.

### P6 — `server/utils/diemKhach.js` ~55 dòng — CHỈ TÁCH, không đổi hành vi
- Chuyển NGUYÊN `BALANCE_SQL`, câu lịch sử, câu voucher + bước `rows.map` từ `loyalty.js` sang `layDiemKhach(phone)` / `layVoucherKhach(phone, tatCa)`. `loyalty.js` GET gọi lại hai hàm (giữ `normalizePhone`, 400, 500 như cũ); `/redeem` `require` `BALANCE_SQL` từ file mới (không đổi câu). Đo lại: `thu_P26c.js` (xem / đổi điểm), giả lập KB đổi điểm (`--day-du`).
- B (bỏ): xuất hàm từ `loyalty.js` (khuôn `kiemDonCuaMa`). Ít dòng hơn ~6 nhưng phiếu ghi rõ `utils/`, LUAT §3.

### P7 — `signup-codes.js` (Q2 — phương án A, ~+8 / −3 dòng)
- `router.post('/claim', authenticateServiceOrUser, nhanMaUuDai);` rồi NGAY dưới: `async function nhanMaUuDai(req, res) { …thân cũ Y NGUYÊN, kể cả `const phone = normalizePhone(req.body.phone)` TRONG `try`… }` (hàm được kéo lên — hoisting). Đọc SĐT phải ở trong `try`: Express 5 (`package.json:24`) để `req.body` `undefined` khi không có thân JSON, và `normalizePhone` gọi `.replace` (`helpers.js:154`) → ném ngoài `try` thì rơi vào bộ lỗi chung `index.js` (`{ error: 'Internal server error' }`) — đổi hành vi route cũ (soát kế hoạch bắt).
- E9 cắt khối từ `router.post('/claim'` tới `router.` kế tiếp (`kiem_tra…:407–409`) → vẫn chứa trọn thân (thân không có chữ `router.`). E14 dò dòng đóng từ dòng SAU `router.post(` (`kiem_tra…:550`), `}` đóng hàm ở cột 0 không khớp `^\}?\);` → vẫn đếm `/claim` như cũ (ngưỡng 51 không đổi). Neo `AUDIT-1` `if (kqDon.loi) {` vẫn khớp 2 lần, đúng thứ tự.
- Một chỗ đổi trong thân: `catch` → `res.status(500).json({ success: false, error: req.khach ? 'Lỗi máy chủ, thử lại sau' : err.message })` — route cũ không có `req.khach` → y như cũ; khách không thấy lỗi nội bộ (G).
- `/api/kh/nhan-ma-bill` gọi `nhanMaUuDai({ body: { code: req.body.ma, phone: req.khach.phone }, khach: req.khach }, res)` — thân dựng MỚI, chỉ hai khoá; SĐT từ hàng CSDL của token.
- `/nhan-diem` (nhân điểm từ mã bill) KHÔNG được gắn vào `/api/kh` ở phương án Q1-(a) → App vẫn phải gọi đường `X-Service-Key` với SĐT trong thân → lỗ F3 còn ở phần điểm cho tới khi chủ quán chọn (b)/(c) hoặc AUDIT-KH đóng đường cũ.
- B: chuyển thân sang `utils/nhanMaBill.js` — đúng LUAT §3 hơn nhưng E9 + đột biến `AUDIT-1 D1-E-*` mất neo → phải sửa bộ kiểm (cần chủ quán cho phép, CLAUDE.md §6). ~cùng số dòng.

### P8 — `index.js` ~+4 · `env.example` ~+8 · `kiem_tra_truoc_khi_giao.js` +1 tên · `products.js` (Q3) ~+5 / −3
- `app.set('trust proxy', 1)` (Q5); `app.use('/api/pos/kh', require('./routes/kh/quay'))` cạnh các route `/api/pos`; `app.use('/api/kh', require('./routes/kh'))` TRƯỚC `express.static` / SPA fallback.
- `env.example`: `KH_JWT_SECRET=` (chuỗi ngẫu nhiên dài, KHÁC `JWT_SECRET`; trống = App KH đóng 503) và `GUI_MA_KHACH=quay`.
- `products.js` (Q3): CÙNG khuôn P7 — `router.get('/', authenticateServiceOrUser, xuLyMenu);` rồi NGAY dưới là hàm (thân cũ y nguyên) và `layMenuQuay(category)` mà nó gọi, TRƯỚC `getFallbackProducts`/`router.put('/price'`. Lệnh ghi nhớ tồn `run(UPDATE pos_products…)` (`products.js:56–60`) vì thế VẪN nằm trong khối E14 quét cho `GET /` → cảnh báo "GET có ghi" và số đếm 51 giữ nguyên, không giấu lệnh ghi vào hàm phụ ngoài khối (KHUON_LOI K4 TU-CHAY-6), không đòi hạ ngưỡng (soát kế hoạch bắt). `module.exports.layMenuQuay`.

### P9 — `client/src/pages/Customers.jsx` ~+45 dòng (+ build `client/dist`, Q4)
- MỘT nút "📱 Mã đăng nhập App" ở đầu trang (cạnh nút thêm khách) → hộp có ô SĐT (mở từ chi tiết khách thì điền sẵn SĐT) + nút "Cấp mã" → hiện mã chữ lớn + đếm ngược 5:00 tính từ `het_han_giay` (không đọc giờ máy chủ → không lệch múi giờ). Gọi qua `api.post('/kh/cap-ma', { sdt })` (`utils/api.js:179`) — không thêm `fetch` trần.
- Vì sao nút ở đầu trang chứ không chỉ trong chi tiết khách: khách MỚI (chưa có trong danh sách) cũng cần lấy mã tại quầy để tự tạo tài khoản (A4) — quầy không tạo khách (DAC_TA luật 6).
- B: chỉ nút trong hộp chi tiết khách — ít hơn ~8 dòng nhưng khách mới không lấy được mã khi `GUI_MA_KHACH=quay` (đang là mặc định).

### Ngân sách
Code mới ~380 dòng (bảng 18 · maKhach 95 · guiMaKhach 22 · khachAuth 40 · kh/index 150 · kh/quay 25 · index 4 · env 8 · Customers 45 — trừ trùng ~25) + TÁCH không đổi hành vi ~65 dòng dời chỗ (diemKhach ↔ loyalty, products, signup-codes). Bài thử ~380 dòng. Nằm ở mép trên ngân sách phiếu; vượt sẽ ghi rõ ở báo cáo.

## 3. Bài thử `cong_cu/thu_KH1.js` — ca ↔ mục Nghiệm thu (1-1)

Khuôn `thu_P20.js`: `database.js` thật trên kho tạm (thay `ketNoiKho`), SX tắt, express riêng mount ĐÚNG đường: `/api/kh`, `/api/pos/kh`, `/api/pos/orders`, `/api/pos/signup-codes`, `/api/pos/loyalty`, `/api/pos/customers`, `/api/pos/products`. `GUI_MA_KHACH=gia`. Móc `beginTransaction` (gắn TRƯỚC khi nạp route) để dựng đua tất định. Thời gian trôi dựng bằng cách lùi `tao_luc` / `het_han` trong kho tạm — không ngủ. So status + `code`, không dò chữ (E12).

| Mục | Ca |
|---|---|
| A1 | `xin-ma` SĐT `'+84912345678'` → dòng mã lưu `0912345678`; `'abc'`, `'0912'`, số `912345678` (không phải chuỗi), thiếu → 400 `SDT_KHONG_HOP_LE` |
| A2 | dòng mã: `ma_bam` ≠ mã, không chứa mã, dài 64; mã đúng 6 chữ số; `het_han − tao_luc` = ĐÚNG 300 giây (so bằng, K3); ĐUA: móc `beginTransaction` cho lần xác minh thứ hai chạy trọn trước → đúng MỘT 200, lần kia 400 `MA_HET_HAN` |
| A3 | đúng → 200, token giải bằng `KH_JWT_SECRET` có `loai 'kh'`, `id` khách, `exp − iat` = 30 ngày; sai → 400 `MA_SAI`; `het_han` lùi 1 giây → `MA_HET_HAN`, còn 1 giây → 200 (cặp trên/dưới); dùng lại mã đã dùng → `MA_HET_HAN`; sai 4 lần rồi đúng → 200; sai 5 lần rồi đúng → `MA_HET_HAN` |
| A4 | SĐT đã là khách + `ten` khác → 200, tên KHÔNG đổi, số dòng `pos_customers` của SĐT = 1; SĐT mới không `ten` → 400 `CAN_TEN`, rồi CÙNG mã + `ten` → 200 (mã không bị tiêu); khách mới có `created_by 'app_kh'`, `qr_code 'QR-<sđt>'`, `customer_type` + `sync_status` theo Q6 (`retail` / `retail_only`); `ten` toàn khoảng trắng / 51 ký tự → `CAN_TEN`, 50 ký tự → 200 |
| A5 | `xin-ma` cho SĐT là khách và SĐT chưa là khách → status + thân y hệt (so sâu) |
| B1 | dòng `gui` trước cách 59 giây → 429 `QUA_NHIEU_LAN`, cách ĐÚNG 60 giây → 200 (phiếu "≥ 60 giây"); ca 59 giây tự kiểm `getNow()` trước / sau yêu cầu cùng một giây — khác giây thì chạy lại ca (≤ 3 lần), vẫn khác → hỏng chứ không đếm đạt (K3 thất thường); đã 4 lần / giờ → 200, 5 lần → 429; dòng 59 phút trước VẪN tính, 61 phút KHÔNG tính; IP: 19 lần → 200, 20 → 429 (dòng mẫu chèn với đúng `ip` máy thử, SĐT khác nhau); `cap-ma` quầy KHÔNG bị giới hạn (6 lần liền → 6 lần 200); `xin-ma` NGAY sau `cap-ma` cùng SĐT → 200; 20 dòng `quay` cùng IP → `xin-ma` vẫn 200 |
| B2 | 5 sai / mã (như A3); SĐT đã 10 lượt sai trên mã `gui` trong giờ (2 mã × 5) → mã `gui` thứ 3 đúng vẫn 429; 9 lượt → 200; Q7: cùng 10 lượt sai đó, mã QUẦY cấp sau → 200 |
| B3 | phép đọc nguồn: `maKhach.js` có `GIOI_HAN` và MỖI khoá của nó được dùng ít nhất một lần trong file (không dò chữ số trần — `1e6`, `padStart(6…)` tự nhiên có, sẽ đỏ oan K2) |
| C | KHÔNG đặt `GUI_MA_KHACH` → như `quay` (mặc định là hành vi — K3); `gia` → `layMaGiaCuoi()` = mã vừa xin; `quay` → `lay_ma_tai_quay: true`, dòng mới có `huy_luc` ngay khi chèn, mã quầy cấp TRƯỚC đó vẫn xác minh được; `GUI_MA_KHACH='xyz'` → như `quay` + đúng 1 dòng cảnh báo (không chứa mã) |
| D | `cap-ma` không token → 401; token khách → 401; nhân viên `staff` → 200 + `{ ma, het_han_giay: 300 }`, dòng `nguon 'quay'`, `cap_boi` = username; mã đó xác minh được. Màn quầy (nút, hộp, đồng hồ) KHÔNG có bài máy — CHƯA KIỂM, 3 thao tác thử tay ghi ở báo cáo |
| E1 | `GET /toi` đúng 3 trường; `PUT /toi` đổi tên; `ten` rỗng / 51 ký tự → 400; `PUT` kèm `sdt` / `phone` → SĐT không đổi |
| E2 | `GET /api/kh/diem` so sâu = `GET /loyalty/points/:phone` (nhân viên) cho cùng khách, kể cả có 1 dòng điểm HẾT HẠN (không tính vào số dư) |
| E3 | `GET /api/kh/voucher` so sâu = `/loyalty/vouchers/:phone` (có voucher còn / đã dùng) |
| E4 | đơn qua `POST /orders` THẬT cho A và B; A `GET /don` chỉ thấy đơn A, mới nhất trước, trang 2 đúng; `GET /don/<mã đơn A>` có món: tên, số lượng, đơn giá, thành tiền khớp `pos_order_items`; `GET /don/<mã đơn B>` → 404; `da_tra` của bill chờ thu = `total − debt_amount` |
| E5 | `GET /menu` (SX tắt → nhánh tồn cũ): mỗi món có ĐÚNG bộ khoá danh sách trắng (so tập khoá); món giá 0 / null không có; `con_hang` = true khi `ton_gan_nhat` 3, false khi 0, null khi chưa rõ; hồi quy `products.js`: `GET /api/pos/products` (JWT và `X-Service-Key`) so sâu với bản chụp lấy ở ĐẦU bài cho cùng kho — giá, `sellable`, `stock_status` không đổi |
| E6 | đơn `POST /orders` có SĐT, đã thu → mã bill → `nhan-ma-bill` → 200, voucher có trong `pos_discount_codes`, `claimed_phone` = SĐT token; lần 2 → 409 `MA_DA_DUNG`; SĐT đã nhận qua mã bill KHÁC → 400 `SDT_DA_NHAN` (một SĐT một lần); bill chưa thu → `BILL_CHUA_THANH_TOAN`; ĐUA hai khách cùng mã (móc `beginTransaction`) → đúng một 200 |
| F1 | xoá `KH_JWT_SECRET` → `xin-ma`, `xac-minh`, `/toi`, `cap-ma` → 503 `KH_CHUA_CAU_HINH`; đặt `KH_JWT_SECRET = JWT_SECRET` → 503 |
| F2 | token khách gọi `/api/pos/orders`, `/api/pos/customers`, `/api/pos/loyalty/points/<sđt>` → 401; token nhân viên gọi `/api/kh/toi`, `/diem`, `/don` → 401 `KH_TOKEN_SAI`; token ký `KH_JWT_SECRET` nhưng KHÔNG có `loai 'kh'` → 401; token khách của khách đã bị xoá → 401 |
| F3 | A gửi `?sdt=<B>`, `?phone=<B>`, thân `{ sdt, phone, customer_phone: <B> }` vào `/toi`, `/diem`, `/voucher`, `/don`, `/nhan-ma-bill` → vẫn dữ liệu / ghi nhận của A; A đọc `/don/<mã đơn B>` → 404 (phiếu cho 404 thay 403 — không lộ đơn tồn tại) |
| G | mọi thân lỗi của `/api/kh/*` chỉ có khoá thuộc `{ error, code, success }`; không thân nào chứa `ma_bam`, token khác, `JWT_SECRET`; gom `console.*` trong lúc chạy cả bài → không dòng nào chứa mã thô hay token đã cấp |
| H | khách đăng nhập → `/diem` → `nhan-ma-bill` hợp lệ → voucher phát ra so từng cột = voucher phát qua `/signup-codes/claim` (X-Service-Key) cho một khách đối chứng cùng cấu hình (Q1); qua `X-Service-Key`: `/claim` vẫn 200 / 409, `/loyalty/points/:phone` + `/loyalty/vouchers/:phone` + `/products` vẫn 200 cùng thân như qua JWT; `/claim` không thân JSON → vẫn `{ success: false, … }` của route (không rơi vào bộ lỗi chung); `thu_P20.js` + mọi bài cũ xanh (`npm test`) |
| (tĩnh) | `index.js` có `app.use('/api/kh'` TRƯỚC `express.static` và `trust proxy` (Q5) — bài không nạp được `index.js` (nó tự `listen`) |

## 4. Đột biến (`viec/KH-API-1/dot_bien.py`) — mỗi chỗ vá ít nhất một VS- và một BV-

| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| F2 kiểm loại token | `BV-F2-bo-kiem-loai` · `VS-F2-loai-sai-chieu` (`loai !== 'nv'`) | F2 token không `loai` |
| F1 đóng khi thiếu khoá | `BV-F1-bo-chan-thieu-khoa` · `VS-F1-khoa-du-phong-jwt` (`|| JWT_SECRET`) | F1 |
| F3 SĐT từ token | `VS-F3-sdt-tu-than` (nhan-ma-bill lấy `req.body.phone \|\| …`) · `VS-F3-diem-tu-query` · `BV-F3-khach-tu-token-sdt` | F3 |
| A2 câu "chưa dùng" | `BV-A2-bo-chua-dung` · `VS-A2-kiem-changes-lon-hon-0` (`changes > 1`) · `VS-A2-luu-ma-tho` | A2 đua · A2 băm |
| A2/A3 hạn | `VS-A3-han-50-phut` · `BV-A3-bo-loc-het-han` (bỏ `het_han > ?` khỏi câu chọn mã) | A2 300 giây · A3 lùi 1 giây. (Bỏ `VS-A3-het-han-bang` `>=`/`>`: chỉ khác nhau khi `het_han` = ĐÚNG giây hiện tại, ca ±1 giây không bắt được và không dựng tất định được — soát kế hoạch bắt) |
| A3 5 lần thử | `BV-B2-bo-gioi-han-moi-ma` · `VS-B2-thu-6-lan` | A3 / B2 |
| B2 theo SĐT | `BV-B2-bo-gioi-han-sdt` · `VS-B2-sdt-11` · `VS-B2-chan-ca-ma-quay` (Q7) | B2 |
| B1 60 giây / SĐT giờ / IP | `BV-B1-bo-60-giay` · `VS-B1-61-giay` · `VS-B1-so-bang` (`>=` → 60 giây bị chặn) · `BV-B1-bo-sdt-gio` · `VS-B1-sdt-6` · `BV-B1-bo-ip` · `VS-B1-ip-21` · `VS-B1-tinh-ca-quay` (bỏ `nguon = 'gui'`) | B1 |
| Q3 tách menu | `VS-Q3-route-cu-bo-gia` (route cũ không trộn giá) · `BV-Q3-kh-tu-doc-bang` (`/menu` đọc thẳng `pos_products`, bỏ `layMenuQuay`) | E5 hồi quy · E5 |
| A4 không tiêu mã khi thiếu tên | `VS-A4-tieu-ma-truoc-khi-hoi-ten` · `BV-A4-bo-can-ten` · `VS-A4-tao-trung` (bỏ `ON CONFLICT`) | A4 |
| A5 không lộ khách | `VS-A5-bao-khach-moi` | A5 |
| C chế độ | `VS-C-mac-dinh-gia` · `BV-C-quay-khong-huy` · `VS-C-doc-luc-nap` (đọc `GUI_MA_KHACH` một lần khi nạp module) | C (ca không đặt biến) |
| P7 SĐT trong `try` | `VS-P7-sdt-ngoai-try` | H (không thân JSON) |
| D quầy | `BV-D-bo-authenticate` · `VS-D-gioi-han-quay` | D |
| E1 chỉ sửa tên | `VS-E1-sua-ca-sdt` | E1 / F3 |
| E2 / E3 cùng hàm | `VS-E2-kh-tu-tinh-bo-han` · `VS-E3-kh-tu-loc` | E2 / E3 |
| E4 lọc SĐT | `BV-E4-bo-loc-sdt` · `VS-E4-chi-tiet-bo-loc` | E4 / F3 |
| E5 danh sách trắng | `VS-E5-tra-them-gia-von` · `BV-E5-tra-nguyen-mon` (`...p`) | E5 |
| E6 | `VS-E6-sdt-tu-than` · `BV-E6-bo-claim-chung` (KH tự chèn voucher) | E6 / H |
| G | `VS-G-500-lo-loi` · `VS-G-log-ma` | G |
| P6 tách hàm (hồi quy) | `VS-P6-loyalty-lich-su-20` | E2 so sâu |

Chạy được TỪNG TÊN, có ĐỐI CHỨNG (bản không đột biến xanh), bài sập ≠ BẮT (K3). Neo chuỗi ngắn, riêng; mỗi neo khớp đúng 1 lần — `dot_bien.py` tự kiểm số lần khớp trước khi chạy.

## 5. Đường song song (K4) — phải canh

- `/signup-codes/claim` (X-Service-Key / JWT) và `/api/kh/nhan-ma-bill` — CÙNG một hàm; `thu_P20.js` canh đường cũ, H canh hai đường cho cùng kết quả.
- `/loyalty/points|vouchers/:phone` và `/api/kh/diem|voucher` — cùng hàm; `/redeem` vẫn dùng `BALANCE_SQL` (giờ `require` từ `diemKhach.js`).
- Hai lối cấp mã: `cap-ma` (quầy) và `xin-ma` (App) — cùng `bamMa`, cùng bảng, cùng `xacMinhMa`. Giới hạn B1 CHỈ áp lối App (nguon `'gui'`).
- Hai lối vào `xacMinhMa`: khách đã có / khách mới — cùng câu chiếm mã trong cùng giao dịch.
- Mọi route đọc của `/api/kh` lấy SĐT từ `req.khach.phone` — rà grep `req.body.*phone\|req.query.*phone\|req.params.*phone\|sdt` trong `server/routes/kh/` → chỉ được phép ở `dang-nhap/*`.
- 500 trả lỗi nội bộ: rà mọi `catch` trong `routes/kh/*` + nhánh `req.khach` của `nhanMaUuDai`.
- `products.js` `GET /` và `/api/kh/menu` — cùng `layMenuQuay`; lệnh ghi nhớ tồn vẫn trong khối E14 quét (P8).
- Hai cách tách thân route ra hàm (P7 `/claim`, P8 `GET /products`) — cùng khuôn "dòng route + hàm NGAY dưới", cùng lý do (phép tĩnh cắt khối theo `router.`).
- `/nhan-diem` — đường mã bill thứ hai, KHÔNG có trong `/api/kh` theo Q1-(a); ghi rõ ở Q1.

## 6. Luồng hợp lệ phải KHÔNG bị chặn (K5) — mỗi luồng một ca

1. Quầy bán, in, thu, huỷ như cũ — `npm test` (thu_P20 / P21 / P26a–c / GOI1) xanh.
2. App KH backend cũ gọi `/claim`, `/nhan-diem`, `/loyalty/*`, `/products` bằng `X-Service-Key` — ca H.
3. Nhân viên mở trang Khách hàng, đổi quà (LOY-2) — đi qua `/loyalty/*` cũ: ca E2/E3 so sâu với route cũ.
4. Khách CŨ (có từ trước, cả khách tạo trước khi có cột `created_by`) đăng nhập → không cần tên — ca A4.
5. Khách mới tự tạo tài khoản trên App bằng mã quầy cấp khi `GUI_MA_KHACH=quay` (mặc định production) — ca C + D.
6. Khách xin mã lần 2 sau 60 giây (mã đầu không tới) — ca B1 61 giây.
7. Khách gõ sai 1–4 lần rồi đúng — ca A3.
8. Nhân viên cấp mã nhiều lần cho cùng khách (khách gõ chậm) — ca B1 quầy 6 lần + mã mới nhất xác minh được.
9. Nhiều khách khác nhau đăng nhập từ CÙNG wifi quán (cùng IP) — giới hạn IP 20 / giờ chỉ tính lối `xin-ma`; mã quầy cấp không tính (ca B1 "20 dòng quay cùng IP").
11. Khách bị kẻ xấu gõ sai làm khoá lối App (B2 theo SĐT) — vẫn đăng nhập được bằng mã quầy cấp (ca B2 Q7). Ở production ngưỡng IP phụ thuộc Q5 — CHƯA KIỂM được bằng máy.
10. Bill có SĐT mà khách chưa có tài khoản → đăng nhập → nhận mã bill — ca E6.

## 7. Ngoài phạm vi — chỉ ghi Phát hiện

- F1: voucher phát qua `/claim` không vào `pos_voucher_grants` → `GET /api/kh/voucher` (và `/loyalty/vouchers/:phone`) không hiện voucher khách mới vừa nhận; App phải hiện mã từ phản hồi `nhan-ma-bill`. Đổi là đổi hành vi `/claim` → việc sau.
- F2: khách chỉ có bên SX (danh sách trang Khách hàng ghép SX + POS) mà chưa có dòng `pos_customers` → lần đầu đăng nhập App bị hỏi tên.
- F3: `Customers.jsx` còn 2 `fetch` trần cũ (`loadMembershipStatus`, `loyaltyApi`) — không đụng (LUAT §3: chuyển dần khi chạm tới; việc này chỉ thêm nút).
