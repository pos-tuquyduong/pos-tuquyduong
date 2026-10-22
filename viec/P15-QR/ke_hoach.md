# P15-QR — Kế hoạch (CHỜ DUYỆT)

Soạn 22.10.2026 trên `61e713c` (`PHIEU: P15-QR`). Mọi trích dẫn file:dòng đọc trong lượt này.
Bốn chỗ cần chủ quán quyết TRƯỚC khi viết code: `trang_thai.md` → `## Câu hỏi` (Q1, Q4 chặn việc; Q2, Q3 xin xác nhận).
Đã sửa theo soát độc lập (agent chỉ đọc) — mục 10.

## 0. Hiện trạng (đọc 22.10)

| Chỗ | Bằng chứng | Ghi chú |
|---|---|---|
| Hàm sinh QR | `server/utils/helpers.js:47-49` `return \`QR-${phone}\`` | ai biết SĐT là giả được |
| Nơi gọi trong Phạm vi | `customers.js:345` (POST /), `:379` (người nhận trong POST /), `:611` (POST /:id/children) | người nhận KHÔNG có SĐT → `qr_code` NULL |
| Nơi gọi NGOÀI Phạm vi | `utils/maKhach.js:135` (khách mới từ App KH), `routes/sync.js:297` (nhập CSV từ SX) | đổi thân hàm ở `helpers.js` là hai chỗ này tự đổi theo — không sửa file |
| Đường tạo khách KHÔNG có QR | `customers-v2.js:57-66` chép khách SX vào `pos_customers` không ghi `qr_code` | nguồn chính của khách "có SĐT mà NULL" — B3 phủ |
| Tra QR | `customers.js:276-296` `GET /qr/:code` — `authenticate`, `SELECT * … WHERE qr_code = ?`, 404 không có `code` | nhận cả dạng cũ |
| Hồ sơ khách App | `kh/index.js:21` `hoSo` = `sdt · ten · ngay_tao`; dùng ở `:58` (xác minh), `:67` (GET /toi), `:74` (PUT /toi) | `req.khach` chỉ có `id, phone, name, created_at` (`middleware/khachAuth.js:36`) |
| Nơi in / lưu dạng cũ | bill: `InvoicePreview.jsx:226-236` ô "QR" là ô trống giữ chỗ, không đọc `qr_code`; CSV sang SX: `sync.js:121-140` KHÔNG có cột QR; sao lưu `backup.js` chép nguyên bảng (sao lưu đúng giá trị đang có — không phải nơi "dùng") | **không nơi nào đang dùng dạng cũ** → không có câu hỏi về `sync.js` / `backup.js` |
| Nhật ký máy chủ | `server/index.js:68-71` ghi `${req.method} ${req.path}` cho MỌI yêu cầu → `GET /customers/qr/<mã>` đưa mã vào log | xem Q4 |
| Quầy | `Sales.jsx:287-293` `handleQrScanResult` → ô mã giảm + `validateDiscountCode`; nút quét ở ô mã giảm `Sales.jsx:1382-1387`; `QrScanModal.jsx:58-62` đọc được → `onResult(text)`, cha tự đóng | `CustomerInput.jsx` KHÔNG được màn nào dùng (`grep -rn CustomerInput client/src` chỉ ra chính nó) → không sửa |
| Tìm khách ở quầy | `CustomerSearch.jsx:87` gọi `/v2/customers/search/:q` = SX + `pos_registrations` (`customers-v2.js:109-190`); SX vắng / chưa cấu hình khoá SX thì nhánh dự phòng đọc `pos_customers` `sx_status='active' OR NULL` (`customers-v2.js:25, 74-91`) | xem Q3 |
| Bản vẽ đã chốt | `ban_mau_pos/DAC_TA.md:63` "Quét thẻ: từ chối mã kiểu cũ `QR-<SĐT>` kèm câu giải thích"; `ban_mau_pos.html:472` nút **📷 Quét thẻ** cạnh ô tìm khách; `:237-241` cũ → câu giải thích, không khớp → "Không phải thẻ thành viên của quán."; `:714` lỗi hiện TRONG hộp quét, hộp không đóng | mã mẫu `TQD-XXXXXXXX` |
| Bài thử cũ đụng tới | `cong_cu/thu_KH1.js:269-271` (A4 đòi `qr_code === 'QR-' + sđt`), `:429` (E1 đòi `/toi` ĐÚNG 3 trường); bài này chạy trong `npm test` (`kiem_tra_truoc_khi_giao.js:495`) | xem Q1 |

## 1. Phần A — mã QR mới

- **A (chọn).** `helpers.js`: hằng `QR_TIEN_TO = 'TQD-'` (theo bản mẫu) + `generateQRCode()` = tiền tố + 12 ký tự lấy từ `crypto.randomBytes(12)`,
  mỗi byte `% 32` trên bảng 32 chữ-số không nhầm (`A-Z` bỏ `I O`, `2-9`) — 256 chia hết 32 nên không lệch, ≈ 60 bit. Ngay dưới:
  `async sinhQrKhongTrung(queryOne)` — tối đa `QR_THU_TOI_DA = 5` lần: sinh, `SELECT 1 … WHERE qr_code = ?`, chưa có thì trả; hết lượt thì ném.
  Nhận `queryOne` làm đối số → `helpers.js` không nạp `database.js`. Thêm `sinhQrKhongTrung`, `QR_TIEN_TO` vào `module.exports` (`helpers.js:214-217`).
  Ba chỗ gọi ở `customers.js` đổi thành `await sinhQrKhongTrung(queryOne)` (người nhận không SĐT vẫn NULL như cũ — họ không đăng nhập App được).
  ~25 dòng. Rủi ro: kiểm-rồi-ghi không nguyên tử — trùng trong khe hở cần hai lần rút 60 bit trùng nhau đúng lúc; khi đó UNIQUE chặn, ghi lỗi
  500, không hỏng dữ liệu. Ghi CHƯA KIỂM.
- **B.** Không kiểm trước; bọc từng câu INSERT/UPDATE bằng vòng thử lại khi bắt lỗi UNIQUE trên `qr_code`. 4 chỗ × ~8 dòng ≈ 35 dòng, phải tách
  lỗi UNIQUE của `phone` khỏi lỗi của `qr_code`. Dài hơn, nhiều nhánh hơn → không chọn.
- `maKhach.js:135`, `sync.js:297` vẫn gọi `generateQRCode(sdt)` — đối số bị bỏ qua, ra mã thật; không có vòng sinh lại (ngoài Phạm vi) → `## Phát hiện`.

## 2. Phần B — khách đang có `QR-<SĐT>`

- **A (chọn) — đổi khi khách xin QR lần đầu, cũ bị chặn NGAY.** `GET /qr/:code` từ chối mọi mã không mở đầu `QR_TIEN_TO` → 404 `QR_KHONG_CO`
  (một mã, một nhánh; câu giải thích "mã kiểu cũ" do quầy tự nhận tiền tố `QR-` như bản vẽ `docQR` `:239`, không gọi máy chủ).
  `GET /api/kh/toi`: đọc `qr_code`; chưa mở đầu tiền tố (NULL hoặc cũ) → `sinhQrKhongTrung` rồi
  `UPDATE … SET qr_code = ? WHERE id = ? AND (qr_code IS NULL OR qr_code NOT LIKE ?)` (điều kiện chặn đua viết ngay trong câu ghi — LUAT §5),
  rồi đọc lại `qr_code` trả ra. Hai lượt `/toi` cùng lúc → lượt sau `changes = 0`, đọc lại ra mã của lượt trước — một khách một mã. ~20 dòng.
  Không ai đang cầm mã cũ (mục 0: không nơi nào in / hiện) nên chặn ngay không làm khổ ai.
- **B.** Một lệnh đổi hết một lần trên Turso. Phải chạy tay trên production, thêm script, thêm bước giao nhận; khách chưa bao giờ mở App
  cũng được mã mà không ai dùng. Không chọn.

## 3. Phần C — quầy quét thẻ (xem Q2, Q3)

- **A (chọn).** Theo bản vẽ `ban_mau_pos.html:472`: thêm nút **📷 Quét thẻ** cạnh ô tìm trong `CustomerSearch.jsx` (chỉ hiện khi chưa chọn khách),
  mở lại `QrScanModal`. Chuỗi đọc được `trim()` trước (jsQR có thể trả kèm xuống dòng); mở đầu `QR-` → báo "mã kiểu cũ" như bản vẽ; có ký tự
  ngoài `[A-Za-z0-9-]` → "Không phải thẻ thành viên" — cả hai không gọi máy chủ. Còn lại → `customersApi.getByQR` (`api.js:318`, không thêm
  `fetch`) → lấy SĐT → `customersV2Api.search(SĐT)` (`api.js:303` — CÙNG nguồn ô tìm đang dùng) → chọn dòng trùng đúng SĐT → `handleSelect` sẵn
  có → `Sales.jsx` nhận qua `onSelect` như khi gõ tìm.
  `getByQR` KHÔNG `encodeURIComponent` và `api.js` ngoài Phạm vi → bộ lọc `[A-Za-z0-9-]` ở quầy là BẮT BUỘC (CHƯA KIỂM bằng máy).
  `QrScanModal.jsx`: thêm `tieuDe` (mặc định "Quét mã QR" như cũ) và `await onResult(text)`; kết quả là chuỗi lỗi → hiện ở state RIÊNG `loiQuet`
  (không dùng `error` sẵn có vì nó thay chỗ video `:128-150`), đặt lại `doneRef` (`:15`, `:60`) cho camera chạy tiếp, bỏ qua đúng chuỗi vừa lỗi
  (không gọi lặp mỗi khung hình). `onResult` giữ qua `useRef` để effect camera (`deps [onResult]`, `:78`) không chạy lại mỗi lần cha render.
  `onResult` trả `undefined` (đường mã giảm của `Sales.jsx`) → hành vi y như cũ.
  **`Sales.jsx` KHÔNG sửa** — mã khuyến mãi đi đúng đường cũ, luồng thu tiền không đụng. Client ~85 dòng.
- **B.** Dùng chung nút quét ở ô mã giảm, `handleQrScanResult` phân nhánh theo tiền tố. Nút đó ẩn khi đã áp mã (`Sales.jsx:1382`), nằm xa ô
  khách, lệch bản vẽ (bản vẽ: mã giảm quét trong hộp "Quét thẻ" → báo "Không phải thẻ"), và phải sửa `Sales.jsx`. Không chọn.

## 4. Phần D — khách xem QR

`kh/index.js`: dòng nạp `helpers` (`:13`) thêm `sinhQrKhongTrung, QR_TIEN_TO`; `hoSo` KHÔNG đổi (để `qr` không lọt sang xác minh / PUT /toi).
Chỉ `GET /toi` trả `{ ...hoSo(req.khach), qr }`, khách lấy từ token (`req.khach.id`), không đọc tham số. Lỗi → `loiMayChu` sẵn có.
Không `console.log` mã. Đường `/api/kh/toi` không có mã trong path nên bộ ghi `index.js:68-71` không lộ gì.

## 5. Phần E — `/api/pos/customers/qr/:code`

Giữ `authenticate` (token quầy; token khách bị `authenticate` từ chối — đo bằng ca E1). Trả 404 `QR_KHONG_CO`. Mã nằm trong path → lộ vào log
(Q4). **Không thêm giới hạn dò** — lý do: 60 bit ngẫu nhiên (dò 1 mã đúng trong 10⁶ khách cần ~10¹² lần gọi); route đòi token nhân viên; và
nhân viên đã đọc được `qr_code` của mọi khách qua `GET /api/pos/customers` (`customers.js:21`, `SELECT *`) — giới hạn ở đây không che thêm gì.
Trả lời giữ nguyên dạng cũ (`SELECT *` + `children` của chính khách đó, như `GET /:id` `customers.js:187`) — không lộ khách ngoài gia đình đó (E2).

## 6. Ngân sách

Server ~45 dòng (helpers ~25, customers ~8, kh ~12) · client ~85 (thêm phần sửa camera do soát bắt) · thử ~230 (`thu_P15QR.js`) + ~15
(`thu_KH1.js`, xem Q1). **Bài thử VƯỢT ngân sách phiếu (~200) khoảng 20%** — do thêm A7, A8, E2, E3, D4 sau soát. Server, client trong ngân sách.

## 7. Ca thử ↔ Nghiệm thu (`cong_cu/thu_P15QR.js`, khuôn `thu_KH1.js`: `database.js` + libsql thật trên kho TẠM, Express mount như `index.js`)

| Nghiệm thu | Ca | Đỏ trên gốc? |
|---|---|---|
| A | A1 `POST /customers` → `qr_code` khớp `^TQD-[A-Z2-9]{12}$`, không chứa SĐT, hai khách khác mã | ĐỎ (`QR-<sđt>`) |
| A | A2 POST / kèm 2 người nhận (1 có SĐT, 1 không) → người có SĐT mã riêng ≠ mẹ; người không SĐT NULL | ĐỎ |
| A | A3 `POST /:id/children` có SĐT → mã thật | ĐỎ |
| A | A4 2000 lần `generateQRCode('0901234567')` → đúng dạng, không trùng, không chứa SĐT | ĐỎ |
| A | A5 `sinhQrKhongTrung` với `queryOne` giả: báo trùng 2 lần → lần 3 trả mã mới (đếm đúng 3 lần hỏi); luôn trùng → ném sau ĐÚNG 5 lần (so bằng, K3) | ĐỎ (chưa có hàm) |
| A | A6 khách mới qua App (`xac-minh`) → mã thật (đường song song `maKhach.js`) | ĐỎ |
| A | A7 `crypto.randomBytes` bị thay trong bài để lần rút ĐẦU ra đúng mã một khách có sẵn: POST /, người nhận trong POST /, POST /:id/children, `/kh/toi` → vẫn thành công, mã ≠ mã có sẵn (mỗi CHỖ GỌI là chỗ vá riêng — K4) | ĐỎ |
| A | A8 nhập CSV từ SX (`POST /sync/import`) khách mới → mã thật (đường `sync.js` chỉ đổi qua `helpers.js`) | ĐỎ |
| B | B1 khách có `QR-<sđt>` trong kho: `/qr/QR-<sđt>` → 404 `QR_KHONG_CO` | ĐỎ (200) |
| B | B2 khách đó `GET /kh/toi` → `qr` dạng mới = cột trong kho; `/qr/<mới>` → 200 đúng khách; `/qr/<cũ>` → 404 | ĐỎ |
| B | B3 khách `qr_code` NULL (chép từ SX `customers-v2.js:57-66`, người nhận có SĐT cũ) → `/toi` sinh mã | ĐỎ |
| B | B4 hai `GET /toi` đồng thời trên khách cũ → cùng một `qr`, kho có đúng mã đó | ĐỎ |
| B/F | F2 khách đã có mã mới gọi `/toi` 2 lần → mã KHÔNG đổi | ĐỎ (chưa có `qr`) |
| D | D1 cặp A/B: `/toi` của A ra mã A, của B ra mã B; A gọi `/toi?sdt=<B>&id=<B>` vẫn ra mã A, không chứa mã B | ĐỎ |
| D | D2 `qr` (khoá lẫn giá trị) KHÔNG có trong trả lời `xac-minh`, PUT `/toi`, `/diem`, `/voucher`, `/don`, `/don/:ma`, `/menu` | XANH trên gốc — ca canh, đột biến VS-D2 bắt |
| D | D3 nhật ký máy chủ trong cả bài không chứa giá trị mã nào | XANH trên gốc — ca canh |
| D | D4 (theo Q4) yêu cầu tra QR trong bài đi qua ĐÚNG bộ ghi nhật ký của `index.js` → nhật ký không chứa mã (bài rút gọn không gắn bộ ghi thì D3 xanh giả) | ĐỎ trên gốc |
| E | E1 `/qr/:code` không token → 401; token KHÁCH → 401; token quầy + mã TQD- bịa → 404 `QR_KHONG_CO`; mã đúng → 200 khách + `children` | ĐỎ (404 không `code`) |
| E | E2 mã của khách X → `id` = X, `children` đúng những người có `parent_phone` = X | XANH trên gốc — ca canh |
| E | E3 mã méo (`%E0%A4%A`, `TQD-x%2Fy`) → không 200, không trả dữ liệu khách | XANH trên gốc — ca canh |
| F | F1 tìm `v2/customers/search` theo tên / SĐT vẫn 200 ra khách (bài không có SX → chạy nhánh dự phòng `pos_customers`; nhánh SX thật CHƯA KIỂM); `POST /customers` vẫn 201; mã của người nhận tra ra ĐÚNG người nhận | XANH trên gốc — ca K5 |
| C, G | build `client` thành công; `--day-du` xanh; `bash ban_mau_pos/chay_thu.sh` 119/0; thao tác tay (dưới) | — |

`thu_KH1.js` (Q1): A4 đổi sang dạng mới; E1 đổi thành 4 trường có `qr`; thêm ca E1b cặp A/B (`qr` của A ≠ của B, tham số `sdt` bị bỏ qua).

**Thao tác tay cho chủ quán (điện thoại / máy quầy):** (1) mở App KH bằng khách thật → lấy mã ở `/toi`; ở Bán hàng bấm 📷 Quét thẻ, đưa mã → chọn
đúng khách, điểm / ví hiện như khi gõ SĐT. (2) quét một mã khuyến mãi bằng nút ở ô mã giảm → áp mã như cũ. (3) in một QR `QR-0912345678`, quét
bằng 📷 Quét thẻ → hộp báo mã kiểu cũ, camera vẫn chạy, đưa thẻ thật vào → chọn đúng khách.

## 8. Đột biến (`viec/P15-QR/dot_bien.py`)

| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| `generateQRCode` | `BV-A-qr-sdt` (trả lại `QR-${phone}`) · `VS-A-ngan-8` (8 ký tự) | A1 A4 |
| `sinhQrKhongTrung` | `BV-A5-khong-kiem-trung` (trả mã đầu, không hỏi) · `VS-A5-thu-6-lan` | A5 |
| chỗ gọi người nhận / children | `VS-A2-con-qr-sdt` · `VS-A3-children-qr-sdt` | A2 · A3 |
| chỗ gọi dùng vòng sinh lại | `VS-A7-post-goi-generate` · `VS-A7-children-goi-generate` · `VS-A7-toi-goi-generate` | A7 |
| `/qr/:code` chặn cũ | `BV-B1-nhan-qr-cu` | B1 |
| `/toi` đổi mã | `BV-B2-toi-khong-doi` · `VS-F2-toi-luon-sinh-moi` · `VS-B4-update-khong-dieu-kien` | B2 · F2 · B4 |
| `/toi` trả `qr` | `BV-D1-toi-khong-qr` · `VS-D1-qr-theo-tham-so` · `VS-D2-qr-vao-hoSo` | D1 · D1 · D2 |
| quyền `/qr/:code` | `BV-E1-bo-authenticate` | E1 |
| log (theo Q4) | `BV-D4-log-ghi-ma` | D4 |

`VS-B4` phụ thuộc thứ tự hai lượt đồng thời — chỉ đếm là phép nếu cho thấy đỏ TẤT ĐỊNH (vd. dựng bằng cách đổi cột giữa lần đọc và lần ghi); không
được thì ghi CHƯA KIỂM (K3). Client (`QrScanModal`, `CustomerSearch`) không có bài máy → CHƯA KIỂM, thay bằng 3 thao tác tay.

## 9. Đường song song (K4) và luồng hợp lệ (K5)

- Song song phải canh: 3 chỗ gọi `customers.js` + `/kh/toi` (A7) + `maKhach.js` (A6) + `sync.js` (A8, chỉ đổi theo `helpers.js`, ghi Phát hiện);
  `customers-v2.js:57-66` (NULL → B3); `hoSo` dùng 3 chỗ — `qr` chỉ vào `/toi` (D2); `/qr/:code` là route DUY NHẤT tra theo `qr_code`
  (`grep -rn "qr_code" server/` mục 0); bộ ghi `index.js:68-71` (D4, Q4).
- Luồng phải KHÔNG bị chặn: tìm tên / SĐT (F1); tạo khách ở POST / (A1, F1); người nhận có / không SĐT (A2, F1); khách đã có mã mới — mã không đổi
  (F2); đơn và tiền không đụng (`orders.js`, `Sales.jsx` không sửa); quét mã khuyến mãi ở ô mã giảm (thao tác tay 2 — `Sales.jsx` không đổi);
  quét lỗi rồi quét thẻ thật trong cùng hộp (thao tác tay 3).

## 10. Sửa theo soát độc lập (22.10)

Agent chỉ đọc soát 4 câu; đã kiểm lại từng điểm bằng code trước khi nhận:
- Vượt vùng sửa: `module.exports` của `helpers.js` và dòng nạp `kh/index.js:13` phải đổi — ghi rõ ở mục 1, 4 (vẫn trong hai file Phạm vi).
- Ngân sách bài thử vượt — mục 6 sửa lời "trong ngân sách" thành con số thật.
- **Log lộ mã** (`server/index.js:68-71`) — file ngoài Phạm vi → Q4. Bài thử dựng Express rút gọn không có bộ ghi này nên ca "không vào log"
  xanh giả → thêm D4 đi qua đúng bộ ghi của `index.js`.
- Q3 sai một nửa (ô tìm CÓ đọc `pos_customers` khi SX vắng) — đã sửa lời.
- Hộp quét: kẹt camera (`doneRef` không đặt lại, effect chạy lại theo `onResult`), lỗi che video, `onResult` là Promise, chưa `trim` — mục 3.
- Thêm ca A7 (mọi chỗ gọi đi qua vòng sinh lại — trước chỉ kiểm dạng mã), A8 (`sync.js`), E2, E3; đường `customers-v2.js:57-66` vào mục 0.
- Bỏ mã `QR_KIEU_CU` ở máy chủ (một mã `QR_KHONG_CO`); câu "mã kiểu cũ" do quầy tự nhận tiền tố — ít nhánh hơn, vẫn đúng bản vẽ.
- Không nhận đề xuất "đóng hộp khi lỗi": bản vẽ đã chốt (`ban_mau_pos.html:714`) giữ hộp mở, hiện lỗi trong hộp.
