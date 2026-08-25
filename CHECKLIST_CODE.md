# DANH MỤC LỖI & CHECKLIST — **POS Tứ Quý Đường**

**Mục đích:** mọi lỗi dưới đây đều đã XẢY RA THẬT trong dự án này, không phải
lý thuyết. File này để không mắc lại lần hai.

**Cách dùng:** file nằm ở gốc repo POS nên tự có mặt mỗi lần gửi zip, không
phải nhớ đính kèm. Phát hiện lỗi mới thì cập nhật ngay trong cùng patch.

**Quan hệ với bản SX:** nhóm A–C, E–G là phần **dùng chung**, giữ đồng bộ với
`SX/CHECKLIST_CODE.md`. Nhóm **P** là phần **riêng của POS**. Ràng buộc vĩnh
viễn của SX (WAL, `legacy_id`, 4 VIEW, `product_types.code`) **không áp dụng
cho repo này** — POS chạy Turso cloud, không có file DB local.

Cập nhật lần cuối: **24.08.2026** · rút từ checklist SX v62 + đợt POS-ERRHANDLING-v1

Tầng 2 của bộ khung này: `kiem_tra_truoc_khi_giao.js` (26 phép kiểm tự động).

---

## ⚠️ QUY TẮC SỐ 0 — TRƯỚC KHI VIẾT DÒNG CODE NÀO

**ĐỌC CODE THẬT. KHÔNG TIN HỒ SƠ.**

Ngày 23.08.2026 đối chiếu hồ sơ tích hợp với code POS: **6/8 mục lệch thực tế**,
và lệch **cả hai chiều** —

- Hồ sơ ghi "2 chỗ `fetch` không kiểm `res.ok`" → thực tế **34 chỗ**, ước tính
  sai 17 lần.
- Hồ sơ ghi POS-5 (khoá qua query string) và POS-6 (lệch hạn phiên) là việc cần
  làm → thực tế **cả hai đều là việc rỗng**, grep ra 0 kết quả.
- Hồ sơ ghi 2 lỗi "còn mở" (race `used_count`, treo `/v2/customers`) → thực tế
  **cả hai đã vá xong** từ trước.

Chiều thứ hai nguy hiểm không kém chiều thứ nhất: nó làm hao thời gian rà lại
thứ đã đúng, và làm giảm niềm tin vào chính danh sách.

→ **Mỗi mục đóng phải kèm LỆNH KIỂM chạy được**, không chỉ ghi nhãn `✓ CHỐT`:
```
POS-5 · khoá qua query string · ĐÓNG 23.08.2026
  grep -rn "req.query.api_key" server/   → phải = 0
```

---

## A. GIAO DIỆN — chống trắng màn hình

### A1. Thẻ `<a href>` KHÔNG gắn được token
Endpoint bật xác thực mà giao diện tải bằng `<a href>` hoặc `window.open` là
chết ngay. Ở SX lỗi này xuất hiện **2 lần** (nút tải backup · nút Export CSV).
```bash
# BẮT BUỘC chạy trước khi khoá BẤT KỲ route nào
grep -rn 'href="/api/\|window.open("/api/' client/src/
```
POS hiện **0 chỗ** — dùng `api.download()` đúng cách. Giữ nguyên như vậy.

### A2. `fetch` không kiểm `res.ok` → trắng toàn bộ app
API trả lỗi → object `{error:"..."}` bị nhét vào state → `.map()` ném
`TypeError` → trắng màn hình. Xảy ra thật ở SX ngày 20.08 (`users.map()`).

POS còn **34 chỗ** `fetch` trần ngoài `utils/api.js` (Sales 7 · Settings 6 ·
Orders 6 · InvoiceSettings 4 · Customers 3 · Reports 2 · InvoicePrint 2 ·
CustomerSearch 2 · logoCache 1 · CustomerInput 1). Có **bánh cóc** canh ngưỡng
trong `kiem_tra_truoc_khi_giao.js` — dọn xong file nào thì hạ `NGUONG_FETCH`.

Chỗ tệ nhất: `Settings.jsx:158` — `fetch(url,opts).then(r => r.json())` không
kiểm `res.ok`, đúng mẫu đã gây sự cố ở SX.

### A3. ErrorBoundary là lưới CUỐI, không thay được kiểm `res.ok`
POS có **2 tầng** từ 24.08: `main.jsx` bọc `<App/>`, `Layout.jsx` bọc
`<Outlet/>`. Tầng trong dùng `key={location.pathname}` — **thiếu `key` thì vỡ
một lần là kẹt màn báo lỗi mãi mãi** dù đã chuyển tab.

⚠️ React CHỈ bắt lỗi lúc VẼ và trong vòng đời component. **KHÔNG** bắt lỗi
trong `onClick`, `async/await`, `setTimeout`, hay Promise bị bỏ rơi. Điều này
đã được kiểm bằng phép kiểm riêng, không phải câu chữ suông.

### A4. Lệch hạn phiên client/server
SX: token 8h nhưng client giữ phiên 24h → cửa sổ 8–24h gây trắng màn hình.
**POS KHÔNG mắc lỗi này** — không giữ `loginTime` phía client, chỉ giữ
`pos_token`. Kiểm: `grep -rn "loginTime" client/src/` → phải = 0.

---

## B. XÁC THỰC & BẢO MẬT

### B1. Phân loại 401 phải theo `code`, KHÔNG theo URL
Ba loại 401 khác hẳn nhau: **hết phiên** (đăng xuất) · **sai mật khẩu** (ĐỂ
YÊN) · **server thiếu cấu hình** (báo lỗi, KHÔNG đăng xuất — nếu không sẽ thành
vòng lặp vô tận).

Dùng **DANH SÁCH CHO PHÉP**, không dùng danh sách cấm. 401 lạ hoặc không kèm
`code` thì KHÔNG đăng xuất. Nhầm về phía "để yên" chỉ tốn một lần bấm lại; nhầm
về phía "đăng xuất" đẻ ra vòng lặp không lối thoát.

Bản đồ đầy đủ 10 chỗ POS trả 401 (rà 23.08.2026):
- `middleware/auth.js` — phiên chết: `NO_TOKEN` `INVALID_TOKEN` `TOKEN_EXPIRED`
  `USER_NOT_FOUND` `USER_INACTIVE`
- `middleware/auth.js` — cấu hình máy-gọi-máy, **để ngoài danh sách**:
  `SERVICE_AUTH_NOT_CONFIGURED` `INVALID_SERVICE_KEY`
- `routes/auth.js` — **3 chỗ trong `POST /auth/login`, KHÔNG kèm code**: sai tài
  khoản / sai mật khẩu / bị vô hiệu hoá. **PHẢI ĐỂ YÊN.**

⚠️ POS **KHÔNG có** mã `AUTH_NOT_CONFIGURED`. Thiếu `JWT_SECRET` thì
`jwt.verify` ném `JsonWebTokenError` → trả `INVALID_TOKEN` — lỗi cấu hình đội
lốt token hỏng. **Chưa vá.**

### B2. Đọc body MỘT LẦN, chịu được body không phải JSON
`response.json()` trần ném `SyntaxError` khi gặp trang HTML 502 của proxy
(Render/Cloudflare) — status thật bị che mất, không còn gì để phân loại. POS
dùng `readBody()` đọc `text()` rồi tự parse: đọc một lần nên không cần
`res.clone()`, và chịu được cả body rỗng.

### B3. Cần cờ chặn cho request song song
Màn Bán hàng bắn nhiều lời gọi cùng lúc — hết phiên là tất cả cùng trả 401.
Không có cờ thì có bao nhiêu request là bấy nhiêu lần điều hướng.

Thêm một chốt POS: **không đá đi khi đang ở sẵn `/login`** — thiếu chốt này thì
trang tự tải lại liên tục.

### B4. Khoá/token CHỈ nhận qua header
Khoá trong URL lọt vào log server, lịch sử trình duyệt, header `Referer`.
**POS KHÔNG mắc lỗi này.** Kiểm:
```bash
grep -rn "req.query.\(api_key\|apikey\|token\|key\|service_key\)" server/  # = 0
```

### B5. Cấu hình rỗng KHÔNG được coi là khớp
`if (khoaPos && khoaGui === khoaPos)` — thiếu vế đầu thì khoá rỗng khớp khoá
rỗng, cửa mở toang. POS có 3 chỗ dùng mẫu `process.env.X || ''`
(`middleware/auth.js:148`, `utils/sxApi.js:7`, `routes/customers-v2.js:17`) —
rà lại mỗi khi đụng tới.

### B6. Trước khi khoá route, kiểm HỆ THỐNG KHÁC có gọi vào không
POS gọi thẳng SX ở 10 endpoint, trong đó `/api/recipes` và `/api/tea-products`
là hai bảng mà cờ Đợt D chuyển nguồn đọc. Khoá bằng `authenticate` thuần là
**quầy bán hàng gãy**.

### B7. Middleware phải khai báo TRƯỚC chỗ dùng
`const` khai báo sau chỗ dùng → `ReferenceError`, server KHÔNG khởi động được.
Dùng `function` khai báo sớm, đọc `process.env` lúc CHẠY.

---

## C. DỮ LIỆU & GIAO DỊCH

### C1. KHÔNG cắm số cứng
Production khác dev. Giá, hạng thẻ, số tháng hiệu lực đều nằm ở dữ liệu.

⚠️ **Hai hạng thẻ duy nhất: Vàng và Bạch Kim.** Hồ sơ cũ còn ghi
"Gold/Platinum/Diamond" — sai. Tên hạng nằm trong Turso, **không có trong mã
nguồn**, nên không grep ra được. Muốn chốt phải export từ Turso.

### C2. Chép một lần ≠ đồng bộ
`client/dist/` **được commit và Express serve thẳng nó**. Sửa `client/src/`
**không có tác dụng gì** cho tới khi build lại và commit `dist`. Quên build =
lỗi ÂM THẦM, không có thông báo nào. Xem P1.

### C9. ĐỌC theo cờ mà GHI vẫn vào bảng cũ = thảm hoạ
Đổi hình dạng dữ liệu ở nguồn thì **phải rà hết chỗ đọc rải rác**, không chỉ
sửa endpoint.

Ví dụ thật: từng định đổi `products.js` trả `price: null` thay cho `price: 0`.
Rà ra **3 chỗ đọc sẽ vỡ** — `Settings.jsx:1673,1677` và `InvoicePrint.jsx:73`
gọi `.toLocaleString()` không guard → `TypeError`. **Đã huỷ việc đó** vì đường
ghi đã khoá sẵn (xem P4), sửa chỉ tạo thêm chỗ vỡ.

### C13. MỘT nguồn sự thật tại mọi thời điểm
**Server là nguồn sự thật duy nhất cho mọi tính toán tài chính.** Client-side
chỉ để xem trước, phải mirror chính xác logic server.

### C15. Tách hàm dùng chung, ĐỪNG chép logic sang chỗ khác
Hai bản sao thì một bên sửa, hai nơi hiểu khác nhau, không ai phát hiện. Ví dụ
đúng trong POS: `raiseForStatus()` dùng chung cho `request()`, `upload()`,
`download()`.

### C16. Bịt bằng KHOÁ, không bằng LỜI DẶN
Đây là nguyên tắc gốc của cả file này. Lời dặn phụ thuộc trí nhớ và sự tỉnh
táo — mà F10 đã ghi: *sự cố suýt hỏng không do thiếu kiến thức, do mệt*.

Vá 34 chỗ `fetch` xong thì không có gì ngăn chỗ thứ 35 ra đời tuần sau. Bánh
cóc trong `kiem_tra_truoc_khi_giao.js` mới là thứ ngăn được.

---

## E. BÀI KIỂM — lỗi của chính bài kiểm

Trong đợt POS-ERRHANDLING-v1: **bài kiểm sai 3 lần, code sai 0 lần.**

### E2. Bỏ dòng ghi chú trước khi soi code
Đã báo động giả nhiều lần: chuỗi `bFo` khớp nhầm `subForm`; ghi chú "KHÔNG nhận
`req.query.api_key`" bị bắt thành "có nhận". Dùng `boGhiChu()` trong
`kiem_tra_truoc_khi_giao.js`.

### E4. ĐẾM số phép kiểm, đừng ĐOÁN
Script tự đếm và in `PASS/FAIL/Tổng`.

### E6. Nói rõ điều CHƯA kiểm được
Ví dụ thật trong đợt này: không có trình duyệt nên không kiểm được
`window.location.href` có thật sự điều hướng; tầng DB là stub vì Turso không
dựng được trong sandbox; **cờ chặn request song song không dựng lại được bằng
tay** vì `checkAuth()` chạy trước và đá về login ngay.

### E9. Kịch bản test phải kích hoạt ĐÚNG lớp cần kiểm
Hướng dẫn test tay từng bảo: đổi `localStorage` rồi bấm sang tab khác. **Không
ăn.** Vì `getToken()` trả `this.token` trước, mà `this.token` chỉ đọc
localStorage **một lần lúc dựng**. Phải **F5 tải lại trang** thì token rác mới
thật sự đi ra server.

### E11. Kịch bản test bị BỎ QUA cũng nguy hiểm như test SAI
Phép kiểm luôn xanh thì vô dụng. Thêm phép kiểm mới xong, **cố tình phá code
rồi chạy lại** — phải thấy nó đỏ đúng chỗ. Đã làm với 3 phép kiểm quan trọng
nhất của POS (chốt `pathname`, danh sách mã 401, bánh cóc `fetch`).

### E12. ⭐ ĐỪNG dò chữ trong thông báo do CHÍNH MÌNH viết ra
**Dạng lỗi mới, phát hiện 23–24.08.2026, đã tái diễn 3 lần trong một đợt.**

1. Phép kiểm dò `/JSON|Unexpected token/i` trong `err.message` để chắc không có
   `SyntaxError` → khớp nhầm chính thông báo tiếng Việt
   `"HTTP 502 (phản hồi không phải JSON)"` mà mình vừa viết.
2. Chốt an toàn của script sửa hồ sơ đếm số lần chuỗi `"Đợt D"` để chứng minh
   không đụng phần SX → khớp nhầm đoạn bàn giao mình vừa thêm vào.
3. (E9 ở trên — cùng gốc: giả định thay vì kiểm.)

→ **Kiểm KIỂU LỖI hoặc CẤU TRÚC, đừng kiểm CÂU CHỮ.** `e instanceof SyntaxError`
chứ không phải `/JSON/.test(e.message)`.

→ Với script sửa file, thay phép đếm chuỗi bằng **PHÉP KIỂM QUAY NGƯỢC**: đảo
ngược hết các phép thay rồi so với file gốc, phải khớp **từng byte**. Mạnh hơn
hẳn và không có báo động giả.

### E13. ⭐ Kiểm SỰ VẮNG MẶT CỦA MẪU NGUY HIỂM, đừng kiểm sự có mặt của bản vá
**Lần thứ tư của cùng một gốc, 24.08.2026.** Viết phép kiểm "cổng phân quyền
`POST /orders` đã đóng chưa" — hỏng **hai lần liên tiếp**:

1. Bản đầu khớp **tên hàm** `/vaiTroNhanVien|laNhanVien|isStaff/`. Hạng mục 4
   đặt tên khác là phép kiểm im lặng báo sai mãi mãi.
2. Bản hai đòi "có so sánh `req.user.role` ở đâu đó trong file" — tưởng là kiểm
   cấu trúc nên an toàn. Nhưng `orders.js:1356` **đã có sẵn**
   `req.user.role !== "owner"` cho một route **khác**. Chỉ cần thêm marker là
   xanh, dù cổng chưa hề đóng.

Chỉ phát hiện được vì đã **phá thử nhánh "marker suông"** (E11). Test đường
xanh không bao giờ lộ ra chuyện này.

→ Bản đúng kiểm **mẫu thô nguy hiểm phải BIẾN MẤT**:
`item.from_package ? 0 : ...` — cờ thô từ `req.body` quyết định thẳng giá 0.
Sau khi vá, giá trị phải đi qua cổng trước nên mẫu này không còn. Phép kiểm
vắng mặt **không phụ thuộc cách đặt tên gì cả**, và chỉ xanh khi code thật đổi.

→ Quy tắc chung: **bản vá có vô số cách viết, mẫu nguy hiểm chỉ có một.** Kiểm
cái sau.

→ Bốn nhánh đều phải phá thử: chưa vá · marker suông · vá rồi quên marker · đủ
cả hai.

---

## F. QUY TRÌNH & CÔNG CỤ

### F1. Script patch phải kiểm HẾT mỏ neo trước khi sửa BẤT KỲ file nào
Sai một mỏ neo → dừng, **không sửa file nào cả**.

### F2. Marker phải ĐẶC TRƯNG và idempotent
`POS-TENDOT-v1`, kiểm ở đầu script. Chạy lần 2 in "đã có sẵn, bỏ qua". Patch
nhiều file → phát hiện "áp một nửa" và dừng.

⚠️ **Mỏ neo phải bao trọn cặp thẻ.** Đã gặp: mỏ neo kết thúc ngay trước `</div>`
đóng khối `.top`, phần mới thừa một `</div>` → lệch cấu trúc HTML. Luôn kiểm số
thẻ mở/đóng cân nhau sau khi sửa.

### F3. Agent Replit TỰ COMMIT — xảy ra 4 LẦN dù mỗi lần đều dặn
Hành vi tự động, không phải cố tình. **Chưa bao giờ tự push.**
```bash
git log --oneline -2
git reset --soft HEAD~1     # gỡ, KHÔNG xoá file nào trên đĩa
git reset
git add <đúng file cần>
git status --short          # kiểm lại TRƯỚC khi commit
```
`.gitignore` phải có `attached_assets/`. **KHÔNG dùng `git add -A`.**

### F4. `ss -ltnp` KHÔNG đáng tin trong container Replit
Nó không thấy tiến trình của workflow. Kiểm bằng `curl` mới chắc. Mã `000`
nghĩa là chưa tới được server — khác hẳn `500` là lỗi ứng dụng.

### F5. Preview nhúng Replit kẹt ≠ app hỏng
Dùng hẳn link ngoài. Và **Console trình duyệt chỉ mở được ở tab ngoài**.

### F8. Chuỗi tiếng Việt hỏng mã
```bash
node kiem_tra_truoc_khi_giao.js     # phép kiểm A1 lo việc này
```
`str_replace` hay hỏng với ký tự tiếng Việt → dùng Python `content.replace()`.

### F9. Chẻ nhỏ patch lớn
Mỗi patch phải tự đứng được và test riêng. POS-3 (34 chỗ `fetch`) **bắt buộc**
chẻ theo file, không làm một cục.

### F10. Chạy thật trên production để BUỔI SÁNG
Sự cố "suýt hỏng" trước đây không do thiếu kiến thức, do mệt.

### F11. Gửi bản SỬA thì phải ĐỔI TÊN FILE
Đã gây lỗi 2 lần. Hai thẻ file cùng tên thì người nhận không biết thẻ nào mới.

### F13. File tải về 0 byte — kiểm DUNG LƯỢNG trước khi thả
Checksum `e3b0c442...` là chữ ký của file trống. Tải hỏng, không phải bản sai.

---

## P. RIÊNG CỦA POS

### P1. ⭐ `client/dist/` NẰM TRONG GIT — quên build là lỗi ÂM THẦM
`.gitignore` **không** chặn `dist`, và `server/index.js` serve thẳng nó bằng
`express.static`. Sửa `src` mà không build thì quầy vẫn chạy mã cũ, **không có
thông báo lỗi nào cả**.

Quy trình bắt buộc sau mọi thay đổi `client/src/`:
```bash
cd client && npm run build && cd ..
node kiem_tra_truoc_khi_giao.js --day-du   # so tên băm dist với src
git add client/src/... client/dist
```

### P2. ⭐ `.replit` đặt `NODE_ENV=development` → bundle ra BẢN DEV của React
Chạy âm thầm từ 10.08 đến 24.08.2026. Bundle phình **1.143 kB** thay vì **673
kB** — khách tải dư ~76 kB (gzip) mỗi lần mở quầy, không ai biết.

Kiểm chứng thực nghiệm: cùng một `src`, `NODE_ENV=development` → 1.137 kB +
chuỗi `"Download the React DevTools"`; `NODE_ENV=production` → 677 kB + 0.

**Đã bịt bằng khoá:** `client/package.json` →
`"build": "NODE_ENV=production vite build"`. Phép kiểm D1/D2 canh không tái phát.

### P3. ⭐ `POST /orders` — 3 trường đặc quyền client gửi mà server KHÔNG kiểm
**CHẶN App KH. Chưa vá.**

| Trường | Server làm gì |
|---|---|
| `discount_type` + `discount_value` | Dùng thẳng từ body → gửi `percent`+`100` là giảm 100% |
| `from_package` | Dùng thẳng từ body → `unitPrice = 0` |
| `customer_package_id` | Không kiểm gói thuộc khách nào, không chặn vượt `total_qty` |

**Gốc rễ — một, không phải ba:** cả 3 đều là **đặc quyền hợp lệ của nhân viên**.
Cái sai là **cách phân quyền**: POS phân quyền bằng *giả định* — "ai có token
gọi được endpoint này thì là nhân viên đứng quầy". `req.user.role` có tồn tại
nhưng **chỉ dùng để ghi tên người tạo đơn**.

Giả định đó **đúng cho tới hôm nay** và **sai kể từ ngày App KH lên**. Đây
không phải lỗ hổng đang bị khai thác — là **khoảng cách sẵn sàng**.

Vi phạm nguyên tắc đã chốt: *không bundle permission — cấp quyền gì chỉ được
quyền đó, không kèm quyền phụ ngầm định.*

### P4. Đường tiền ĐÃ khoá đúng ở 6/9 trường — ĐỪNG PHÁ
Rà 23.08.2026. Những chỗ này đã đúng, sửa vào là hỏng:
- `unit_price` client gửi bị **bỏ qua**, server tra `pos_products` từ DB
- `product.price <= 0` → 400 "chưa có giá bán"
- `package_buy.package_id` / `membership_buy.tier_id` → tra DB lấy giá
- `discount_code` → tra DB, kiểm hạn + lượt dùng
- Flash sale → server tự đọc, ghi rõ "không tin client"
- `parent_balance_amount` → đọc số dư thật, chặn nếu không đủ

⚠️ **Phạm vi đã rà: chỉ đường TẠO ĐƠN** (`POST /orders`, dòng 136–1020).
**CHƯA rà:** huỷ đơn/hoàn tiền (1158–1500) · `POST /:id/pay-debt` · ví & điểm ·
các route ghi khác.

### P5. Turso cloud — KHÔNG có file DB local
File `.db` trong máy là bản cũ, **đừng tin**. Số thật nằm ở Turso. Không có
chuyện ghi đè file DB như SX, nên các ràng buộc WAL/restore của SX **không áp
dụng**.

### P6. `client/package-lock.json` trỏ về `package-firewall.replit.local`
`npm ci` ngoài Replit sẽ gãy. Chưa ảnh hưởng vì `dist` được commit và Render
không build client. Nhưng nếu sau này chuyển sang để Render build thì **phải
sinh lại lockfile trước**.

### P7. `.replit` nằm trong git và chứa `JWT_SECRET`
Đã kiểm 24.08: chuỗi trong `.replit` **KHÁC** biến trên Render → chỉ là rác cấu
hình dev, không phải lỗ hổng. Ghi lại vì lần sau nhìn thấy dễ hoảng.

---

## G. CHECKLIST TRƯỚC KHI GIAO CODE

Chạy `node kiem_tra_truoc_khi_giao.js` lo được 26 mục. Phần dưới đây **máy
không kiểm được**, phải tự đọc:

```
□ Đã đọc code THẬT (không tin hồ sơ)? Verify bằng grep/COUNT?
□ Tên hàm/route mới có trùng gì có sẵn không? (grep, phải = 0)
□ Middleware khai báo TRƯỚC chỗ dùng?
□ Nếu khoá route: hệ thống khác (SX, App KH) có gọi vào không?
□ Nếu đổi hình dạng dữ liệu: đã rà HẾT chỗ đọc rải rác chưa? (C9)
□ Có cắm số cứng nào không? (production khác dev)
□ Cấu hình rỗng có bị coi là khớp không? (B5)
□ Trường tiền mới: server có TỰ TRA không, hay tin client gửi? (P3/P4)
□ Script kiểm HẾT mỏ neo trước khi sửa file nào? (F1)
□ Marker đặc trưng + idempotent + phát hiện áp nửa chừng? (F2)
□ Chạy patch 3 lần → lần 2, 3 không sửa gì?
□ Mỏ neo có bao trọn cặp thẻ không? Số thẻ mở/đóng có cân không? (F2)
□ diff: dòng bị XOÁ có đúng như dự tính không?
□ Bài kiểm có dò chữ trong thông báo do MÌNH viết không? (E12 — KHÔNG ĐƯỢC)
□ Đã cố tình phá code để xem phép kiểm có đỏ không? (E11)
□ ĐẾM số phép kiểm, không đoán (E4)
□ Đã nói rõ điều CHƯA kiểm được? (E6)
□ Đã chạy npm run build và commit CẢ dist chưa? (P1 — LỖI ÂM THẦM)
□ Đường lui: lệnh khôi phục kèm sẵn trong hướng dẫn?
□ Bắt agent báo git log --oneline -2 ở cuối? (F3)
□ Gửi bản sửa: đã ĐỔI TÊN FILE chưa? (F11)
```

---

## H. RÀNG BUỘC VĨNH VIỄN — POS

1. **Server TỰ TRA GIÁ.** Tuyệt đối không tính tiền theo `unit_price` client
   gửi. Đang đúng, đừng phá.
2. **Print failures KHÔNG BAO GIỜ rollback order.** Máy in lỗi là việc của máy
   in, đơn đã tạo là đã tạo.
3. **Lỗi downstream KHÔNG được cascade.** SX lỗi → POS degraded nhưng vẫn chạy.
   `checkStock` bọc `try/catch` chỉ log — đó là **chủ ý**, không phải thiếu sót.
4. **Append-only ledger** cho mọi giao dịch có giá trị tài chính.
5. **KHÔNG bỏ `dist` khỏi git** cho tới khi lockfile được sinh lại và CI/Render
   build xanh (P6).
6. **Hai hạng thẻ: Vàng và Bạch Kim.** Không có Kim Cương.
