# TIEN-KHOA-2 — kế hoạch (chờ chủ quán duyệt)

Viết 19.11.2026 trên `e911762` (PHIEU: TIEN-KHOA-2). Mọi số dòng dưới đây đọc trong lượt này.

## 0. Nói ngắn cho chủ quán

Việc này bịt 3 lối đổi tiền mà không qua PIN / QR. Mình đề xuất:
- **Ví:** bỏ hẳn lối "trừ tay" (không màn nào dùng); "Điều chỉnh số dư" phải gõ **PIN chủ quán** (ô PIN có sẵn như ở Cài đặt).
- **Đổi cách trả:** **chặn hẳn** tiền mặt → chuyển khoản; chiều ngược lại giữ như cũ.
- **Thu nợ đơn cũ:** chỉ còn tiền mặt; chọn chuyển khoản thì báo "Thu nợ chuyển khoản phải qua QR — tạm thu tiền mặt".

Cần bạn trả lời **5 câu ở mục 7** (chủ yếu xin thêm 2 file vào Phạm vi). Mỗi câu có đề xuất sẵn — chỉ cần xác nhận.

## 1. Code thật đã đọc

| Chỗ | File:dòng | Hiện trạng |
|---|---|---|
| Trừ tay | `server/routes/wallets.js:185-212` | `POST /deduct`, quyền `adjust_balance`, không PIN. `client/src` 0 chỗ gọi (chỉ `api.js:295` khai hàm). |
| Điều chỉnh | `wallets.js:220-251` | `POST /adjust`, quyền `adjust_balance` + lý do ≥ 3 ký tự. Trừ đã `khongAm` (số dư khả dụng không âm, `wallets.js:241`); ghi sổ `pos_balance_transactions` loại `adjust` có người / lý do / giờ qua `ghiVi` (`wallets.js:76-104`). **Chưa PIN.** |
| PIN chủ quán | `server/utils/pinChuQuan.js:51-63` `kiemPinChuQuan(pin)` | trả `{}` hoặc `{ loi: [status, code, lời] }`; giữ chỗ lượt thử bằng một câu ghi (đua 5 lượt), khoá 15 phút. Mẫu gọi: `membership.js:109-110`, `goi-nap.js:22`. **Không cần sửa file này.** |
| Đổi cách trả | `server/routes/don-mo-rong.js:112-162` | chặn trong ngày / một cách trả / lý do / ghi có điều kiện. `tu = 'cash'` → `sang = 'transfer'` chỉ cần lý do. **`client/src` 0 chỗ gọi `doi-cach-tra`** (grep `doi-cach` → chỉ hàm `doiCachTra` không liên quan ở `BanHangMoi.jsx:332`). Người gọi: `thu_DOISOAT1.js:194`, `thu_NAP1.js:743`, `gia_lap/kich_ban.js:70-74`. |
| Thu nợ | `server/routes/orders.js:1526-…` `pay-debt` | nhận `cash` / `transfer` (`:1532`), `409 DA_THU_ROI` khi hai lệnh chồng (UPDATE có điều kiện). `cotTien` theo cách trả. |
| Màn thu nợ | `client/src/pages/Orders.jsx:409-440` (fetch trần `:415`), nút Tiền mặt / Chuyển khoản `:1099-1140` | `api.js:425` có sẵn `ordersApi.payDebt`. |
| Màn ví | `client/src/components/ViKhach.jsx:42-58` gửi `walletsApi.adjust` | Ô PIN có sẵn: `client/src/components/HoiPin.jsx` (BAO-1b — dùng ở `GoiNap.jsx:94`, `QuangCao.jsx:192`). |
| Đối soát | `server/utils/doiSoat.js:334-339` `phepXacNhanTay` (khuôn CẦN XEM), `:366` danh sách phép | **Chưa** có dòng nào cho `adjust` hay nhật ký `doi`. File **NGOÀI Phạm vi** → câu hỏi 2. |

## 2. Phương án từng phần

### A1 — `/wallets/deduct`
- **A (chọn): xoá route + dòng `deduct` ở `api.js:295`.** −30 dòng. Gọi vào → 404 của Express. Không để code chết (LUAT §3).
- B: giữ route trả `410 DA_BO` có `code`. +3 dòng, giữ thân route chết. Lợi duy nhất: lời báo rõ hơn cho người gọi API tay — không có người gọi thật.
- Rủi ro A: bài thử cũ gọi deduct (`thu_P26b.js:445,485`, `thu_P3.js:480,487,509,545`, `thu_NAP1.js:379`, `thu_KHNAP1.js:520`,
  `gia_lap/kich_ban.js:357,368`) → đổi sang `adjust` âm có PIN (cùng đường `ghiVi … khongAm`, giữ nguyên ý ca: chặn tiêu vào phần đang giữ, kho bận, ngăn thưởng).

### A2 — `/wallets/adjust` có PIN chủ quán
- **A (chọn):** trong route, sau phần kiểm dữ liệu (SĐT, số, lý do) và TRƯỚC giao dịch: `const pin = await kiemPinChuQuan(req.body?.pin); if (pin.loi) return res.status(pin.loi[0]).json({ code: pin.loi[1], error: pin.loi[2] });` — khuôn `goi-nap.js:22`. +4 dòng.
  PIN kiểm NGOÀI `trongGiaoDich` vì `kiemPinChuQuan` ghi bằng `run` của kho (trong giao dịch độc quyền sẽ tự chờ chính mình).
  Âm: giữ `khongAm` sẵn có. Sổ: dòng `adjust` sẵn có (người = `req.user.username`, ghi chú = lý do, giờ `getNow`).
- B: bọc thành middleware `canPinChuQuan` dùng chung — chỉ một chỗ dùng → hàm dùng một lần, bỏ.
- Màn `ViKhach.jsx`: nút "Xác nhận điều chỉnh" mở `HoiPin` (`tieuDe="Điều chỉnh số dư — gõ PIN chủ quán"`), `chay(pin)` gọi `walletsApi.adjust({..., pin})`.
  PIN sai / khoá → báo dưới ô (HoiPin tự làm, `loiPin.js`); lỗi khác (`SO_DU_KHONG_DU`…) → `baoLoiTu`. ~+12 dòng. Không `window.prompt`.
- "Hiện ở màn Đối soát": cần `doiSoat.js` → **câu hỏi 2**. Đề xuất: thêm phép `DC` khuôn `phepXacNhanTay` — mỗi dòng sổ `adjust` trong kỳ là một
  dòng CẦN XEM "ví <SĐT>: điều chỉnh ±N bởi <người> — <lý do>" (+~10 dòng ở `doiSoat.js`, +1 khoá `AP_DUNG_TU`).

### A3 — đổi cách trả tiền mặt → chuyển khoản: so ba cách

| | (a) chặn hẳn | (b) gắn một khoản tiền về chưa khớp | (c) PIN chủ quán + lý do |
|---|---|---|---|
| Dòng | +3 (`don-mo-rong.js`) | ~+35: chọn dòng `pos_payos_su_kien` `chua_khop`/`khong_phien` đúng số, đổi `ket_qua`, trong MỘT giao dịch với UPDATE đơn; màn chọn khoản | +6 server, + màn (hiện **không có màn** gọi đường này) |
| Bịt lỗ "thu tiền mặt rồi ghi CK" | ✔ hết | ✔ hết (có tiền ngân hàng thật làm chứng) | còn lỗ cho người biết PIN |
| Rủi ro | sai bấm "tiền mặt" khi khách đã CK: không sửa được ở đây — két lệch, khoản CK về hiện ĐỎ ở Đối soát mục CK (`doiSoat.js:285`) để chủ quán xử | đụng `pos_payos_su_kien` mà `thanh-toan.js` (KHO-3a đang sửa) cũng ghi → dễ đụng nhau khi ghép | thấp |

**Đề xuất (a).** Lý do: ít dòng nhất, bịt hết; không màn nào gọi đường này nên quầy không mất thao tác nào; sổ quyết định (`QUYET_DINH_CHU_QUAN.md:89`)
"mọi chuyển khoản qua QR, máy chủ tự xác nhận" — tiền CK về muộn đã có lối riêng "xác nhận tay" có lý do (`:171`). (b) để thành việc riêng sau KHO-3a nếu cần.
Lỗi trả: `409 DOI_SANG_CK_PHAI_QUA_QR` "Không đổi tiền mặt sang chuyển khoản — chuyển khoản phải qua QR". Đặt cạnh các dòng kiểm đầu vào
(`don-mo-rong.js:116-119`): `sang === 'transfer'` → chặn luôn, không cần đọc đơn (đơn đang CK thì cũng không cần đổi). 1 dòng (soát kế hoạch).
- **Chuyển khoản → tiền mặt** giữ nguyên (đã ghi nhật ký `doi`). "Ghi đối soát": cùng phép ở câu hỏi 2 — mỗi dòng nhật ký `doi` trong kỳ là một dòng CẦN XEM.
- **A7.2 thử tay không làm được:** không có nút đổi cách trả trên màn nào → thay bằng ca máy (mục 4, A3a–c). Ghi ở CHƯA KIỂM.

### A4 — thu nợ chuyển khoản
- **A (chọn):** đầu route `pay-debt`, `payment_method === 'transfer'` → `400 THU_NO_CK_PHAI_QR` "Thu nợ chuyển khoản phải qua QR — tạm thu tiền mặt";
  giá trị lạ khác giữ `400 CACH_TRA_LA`. Kiểm TRƯỚC khi đọc đơn (không tốn đọc, không lộ trạng thái đơn). (Vòng sửa 1: ý "giữ `cotTien` vì neo đột biến M1/M6/M8" là SAI — đột biến M1 / M6 / M8 trong danh sách đột biến của `thu_gia_lap.js` không bám chuỗi đó (vòng sửa 2: bỏ số dòng — trôi sau ghép main); đã gọn `cotTien = "cash_amount"`.) ~+3 dòng.
- B: chặn sau khi đọc đơn (chỉ đơn `debt`, cho phép `cho_thu`…) — phiếu ghi rõ "khác tiền mặt → 400", không phân loại đơn. Bỏ.
- `Orders.jsx`: bỏ nút Chuyển khoản trong hộp thu nợ (`:1121-1140`), thay một dòng chữ xám "Thu nợ chuyển khoản phải qua QR — tạm thu tiền mặt";
  `handleConfirmPayDebt` gọi `ordersApi.payDebt(id, { payment_method: 'cash', amount })` thay fetch trần `:415` (−15 dòng); bỏ state `paymentMethod`
  nếu không còn chỗ dùng (grep trước khi bỏ). Phiếu A7.3 "chọn chuyển khoản → báo lỗi rõ": màn không còn nút chọn, lời báo nằm ngay trong hộp;
  máy chủ trả lời rõ nếu ai gửi tay.
- `kiem_tra_truoc_khi_giao.js`: hạ `NGUONG_FETCH` 22 → 21 (đã dọn thật) + thêm `chayBaiThat('cong_cu/thu_TIENKHOA2.js')`.

## 3. Ngân sách
| | dòng |
|---|---|
| `wallets.js` | −30 / +5 |
| `don-mo-rong.js` | +2 (cả sửa chú thích "không mở thêm khả năng nào") |
| `orders.js` (chỉ `pay-debt`) | +3 |
| `api.js` | −1 |
| `ViKhach.jsx` | +12 |
| `Orders.jsx` | −35 / +8 |
| `doiSoat.js` (nếu câu 2 được duyệt) | +12 |
| `kiem_tra_truoc_khi_giao.js` | +1, sửa 1 |
| **Code** | ≈ +50 / −70 — trong ngân sách |
| `cong_cu/thu_TIENKHOA2.js` mới | ~280 |
| Bài cũ sửa (deduct → adjust có PIN; CK → đổi sang tiền mặt / đổi kỳ vọng 400) | ~60 dòng trên 7 bài + `kich_ban.js` |

## 4. Bài thử `cong_cu/thu_TIENKHOA2.js` — ánh xạ 1-1 nghiệm thu

Khung như `thu_BOMANCU1.js` (máy chủ thật trên kho thử tạm, gọi HTTP, PIN chủ quán đặt thẳng vào `pos_pin_chu_quan` như `thu_NAP1.js:100`).

| Nghiệm thu | Ca | Phải ĐỎ trên gốc vì |
|---|---|---|
| A1 | A1 `POST /wallets/deduct` (chủ quán) → 404, số dư + số dòng sổ không đổi | gốc 200, trừ tiền |
| A1 | A1b `client/src/utils/api.js` không còn `wallets/deduct` (đọc file) | gốc còn |
| A2 | A2a thiếu PIN → 400 `PIN_CHU_QUAN_SAI`, ví + sổ không đổi | gốc 200 |
| A2 | A2b sai PIN → 400 `PIN_CHU_QUAN_SAI`, không ghi | gốc 200 |
| A2 | A2c chưa đặt PIN chủ quán → 400 `CHUA_CO_PIN_CHU_QUAN` | gốc 200 |
| A2 | A2d sai 5 lần → lần 6 PIN đúng ra 423 `PIN_CHU_QUAN_KHOA` (dùng chung luật khoá) | gốc 200 |
| A2 | A2e PIN đúng, trừ quá số KHẢ DỤNG (có phiên đang giữ) → 400 `SO_DU_KHONG_DU`, không ghi | (đã đúng trên gốc — ca giữ hồi quy, không tính là ca đỏ) |
| A2 | A2f PIN đúng cộng +N → 200, MỘT dòng sổ `adjust` đủ `created_by`, `notes` = lý do, `created_at` dạng giờ VN | gốc 200 khi KHÔNG gửi PIN → ca dựng sao cho đỏ: kiểm luôn rằng cùng lệnh không PIN bị từ chối |
| A2 | A2g lý do < 3 ký tự + PIN đúng → 400, KHÔNG tốn lượt PIN (`sai` không tăng) | gốc: không có PIN → ca thêm vế "lượt" chỉ có nghĩa sau vá; đỏ nhờ vế PIN |
| A2 | A2h hai người cùng bấm trừ âm hết số dư (PIN đúng cả hai) → đúng một 200 + một 400 `SO_DU_KHONG_DU`, số dư ≥ 0 | gốc: không PIN vẫn chạy — ca kèm vế "lệnh không PIN đồng thời → 400" |
| A2 | A2i ViKhach.jsx: dùng `HoiPin`, gửi `pin`, không `window.prompt` (đọc file + đột biến xoá nhánh vẽ HoiPin) | gốc không có |
| A2 | A2j Đối soát: sau A2f, `GET /reports/doi-soat` có dòng CẦN XEM khoá `DC` nhắc SĐT + lý do (chỉ khi câu 2 duyệt) | gốc không có |
| A3 | A3a đơn tiền mặt trong ngày đổi sang `transfer` → 409 `DOI_SANG_CK_PHAI_QUA_QR`, đơn không đổi, không nhật ký `doi` | gốc 200 |
| A3 | A3b đơn CK đổi sang `cash` → 200, nhật ký `doi` có lý do | (luồng hợp lệ — K5) |
| A3 | A3c Đối soát có dòng CẦN XEM cho lần đổi A3b (chỉ khi câu 2 duyệt) | gốc không có |
| A4 | A4a đơn nợ cũ `pay-debt` `transfer` → 400 `THU_NO_CK_PHAI_QR`, lời đúng câu phiếu; nợ / tiền / sổ `debt_payment` / nhật ký `thu` không đổi | gốc 200 |
| A4 | A4b bill `cho_thu` `pay-debt` `transfer` → 400 cùng mã | gốc 200 |
| A4 | A4c `payment_method: 'abc'` → 400 `CACH_TRA_LA` (giữ) | — |
| A4 | A4d hai người cùng bấm: `cash` + `cash` → một 200 + một 409 `DA_THU_ROI`; `cash` + `transfer` → 200 + 400 `THU_NO_CK_PHAI_QR`, tiền mặt cộng đúng một lần | gốc vế transfer 200/409 |
| A4 | A4e `Orders.jsx` không còn `fetch(` tới pay-debt, gọi `ordersApi.payDebt`, không còn nút `setPaymentMethod('transfer')` | gốc còn |
| A5 | xem mục 5 (đột biến) | |
| A6 | K5-1 chủ quán cộng tay PIN đúng → 200 (= A2f) · K5-2 CK → tiền mặt → 200 (= A3b) · K5-3 thu nợ tiền mặt đủ + một phần → 200, điểm cộng khi đủ · K5-4 bán qua phiên: `tai_khoan` + PIN khách và `ck_tay` + xác nhận tay → 200 · K5-5 `thu_HOPDONG_KH.js` xanh trong `npm test` | K5 phải xanh cả hai bên |
| A7 | ghi 3 thao tác thử tay vào `trang_thai.md` (A7.2 thay bằng ca máy — không có nút) | |

Bài cũ phải đổi theo (agent soát kế hoạch đếm thêm; LUAT §6.8 — hành vi đổi theo phiếu chủ quán duyệt → bài sửa thường, ghi `SỐ CA`):
- gọi `/wallets/deduct` (→ adjust âm có PIN): `thu_P26b.js:445,485` · `thu_P3.js:480,487,509,545` · `thu_NAP1.js:379` · `thu_KHNAP1.js:520` · `kich_ban.js:357,368`.
- gọi `/wallets/adjust` không PIN (→ đặt PIN chủ quán + gửi `pin`): `thu_P21.js:156` · `thu_P26b.js:446` · `thu_P3.js:481,529` · `thu_NAP1.js:381,383,506`
  · `thu_KHNAP1.js:521-522` · `kich_ban.js:359,369`.
- `pay-debt` `transfer` (→ `cash`, hoặc đổi kỳ vọng 400 khi ca nói về CK): `thu_P20.js:372` · `thu_P26c.js:1262` · `thu_DOISOAT1.js:611` ·
  `thu_DIEMTHAT1.js:217` · `kich_ban.js:153,158,230`.
- `doi-cach-tra` sang `transfer` (→ đổi kỳ vọng 409 hoặc đảo chiều CK → tiền mặt): `thu_DOISOAT1.js:194` · `thu_NAP1.js:743` · `kich_ban.js:632`.
- Bài kiểm tĩnh phải giữ xanh: `thu_BAO1a.js:37,48,72,77` (Orders.jsx ≥ 10 lời gọi `bao*` — viết lại `handleConfirmPayDebt` giữ `baoXong`/`baoLoiTu`/`baoLoi`;
  ViKhach ≥ 2 lời gọi `bao*` + `disabled={dang}`) · `thu_GIAODIEN1.js:137` (ViKhach còn `walletsApi.adjust`) · `kiem_tra_truoc_khi_giao.js:597`
  `NGUONG_DONG_CUNG` (chú thích mới không ghi số dòng cứng) · `thu_gia_lap.js` đột biến M1/M6/M8 bám KB3/KB10 — chạy lại xác nhận vẫn BẮT.
- QR tự xác nhận (A6 "bán qua phiên … QR"): không đụng `thanh-toan.js`; canh bằng các bài sẵn trong `npm test` (`thu_BH2.js`, `thu_SEPAY1.js`,
  `thu_TINGEE1.js`) — K5-4 của bài mới chỉ phủ `tai_khoan` + PIN khách và `ck_tay`.

Đường song song đã rà (K4):
- `grep -n "ghiVi(" server/routes/*.js` — mọi chỗ ghi ví: `topup` (nạp — Phát hiện 1), `deduct` (xoá), `adjust` (PIN), hoàn / huỷ / gói / hỏng / bán (có đơn, ngoài phiếu).
- `grep -rn "'transfer'" server/routes/*.js` cho các đường đánh dấu "đã chuyển khoản" không QR: `pay-debt` (A4), `doi-cach-tra` (A3), `POST /orders`
  (BO-MAN-CU-1 đã khoá), `wallets/topup` `payment_method` tự do (Phát hiện 1 — ngoài phiếu).
- `kiemPinChuQuan` gọi ngoài giao dịch ở mọi chỗ dùng (`membership.js:109`, `goi-nap.js:22`, `tiers.js:111`) — giữ cùng khuôn.

## 5. Đột biến `viec/TIEN-KHOA-2/dot_bien.py` (mỗi cái một dòng, có đối chứng chạy bản không đột biến xanh)

| Chỗ vá | Đột biến | Bài phải bắt |
|---|---|---|
| xoá deduct | `BV-DEDUCT` đưa route deduct trở lại | A1 |
| PIN adjust | `BV-PIN-ADJUST` gỡ dòng `kiemPinChuQuan` | A2a, A2b |
| | `VS-PIN-CHI-KHI-TRU` chỉ kiểm PIN khi `adjustAmount < 0` | A2f vế cộng không PIN |
| | `VS-PIN-BO-LOI` gọi `kiemPinChuQuan` mà bỏ qua `.loi` | A2b |
| | `VS-PIN-SAU-GHI` kiểm PIN SAU giao dịch ghi | A2b (sổ đã ghi) |
| âm | `VS-ADJUST-AM` `khongAm: false` | A2e, A2h |
| đổi cách trả | `BV-DOI-CK` gỡ chặn | A3a |
| | `VS-DOI-CHAN-CA-HAI` chặn cả chiều CK → tiền mặt | A3b (K5) |
| thu nợ | `BV-NO-CK` gỡ chặn | A4a, A4b |
| | `VS-NO-CK-CHI-KHI-CO-SO` chặn chỉ khi có `amount` (thay `VS-NO-CK-SAU-GHI` lúc viết đột biến) | A4b |
| | `VS-NO-CHAN-CA-TIEN-MAT` chặn mọi cách | K5-3 |
| màn | `BV-VIKHACH-PIN` `HoiPin` luôn trả null / gửi không pin | A2i |
| | `BV-ORDERS-FETCH` đưa fetch trần trở lại | A4e |
| đối soát (nếu duyệt) | `BV-DS-DC` bỏ phép DC | A2j, A3c |

## 6. Phải KHÔNG bị chặn (K5) — mỗi luồng một ca
chủ quán cộng tay có PIN (A2f) · trừ tay có PIN trong số khả dụng (A2h người thắng) · CK → tiền mặt (A3b) · thu nợ / bill chờ thu tiền mặt đủ và
một phần (K5-3, cùng các bài cũ `thu_P20/P24/HUY1/DIEMMON1` gọi `cash`) · bán qua phiên ví + PIN khách và CK (K5-4) · App KH (`thu_HOPDONG_KH.js`) ·
nạp tay (`/wallets/topup`) không đổi.

## 7. Câu hỏi cho chủ quán (gom một lần)

1. **Thêm `cong_cu/gia_lap/kich_ban.js` vào Phạm vi** (bắt buộc). Giả lập (`npm test` chạy) gọi đúng ba lối bị bịt: trừ tay `:357,368`, điều chỉnh
   không PIN `:359,369`, thu nợ CK `:153,158,230`, đổi tiền mặt → CK `:632`. Không sửa thì `npm test` đỏ. Sửa: trừ tay → điều chỉnh âm có PIN; thu nợ
   CK → tiền mặt (riêng KB10 `:230` "hai người cùng thu" giữ cách cũ bằng hai lệnh tiền mặt); KB28 đổi kỳ vọng thành 409.
   **Đề xuất: đồng ý.**
2. **Hiện ở màn Đối soát** (A2 "dòng sổ ví hiện ở màn Đối soát", A3 "ghi đối soát" chiều CK → tiền mặt): cần thêm `server/utils/doiSoat.js` vào
   Phạm vi — thêm MỘT phép CẦN XEM (vàng) khuôn "xác nhận tay chuyển khoản" đang có: mỗi lần điều chỉnh ví và mỗi lần đổi cách trả trong kỳ là một
   dòng (người, lý do, số tiền). Màn `DoiSoat.jsx` vẽ sẵn mọi dòng CẦN XEM nên không phải sửa màn.
   **Đề xuất: đồng ý thêm `doiSoat.js`.** (Nếu không: dòng sổ vẫn ghi đủ và xem ở "Lịch sử ví" của khách / nhật ký đơn, nhưng Đối soát không nhắc —
   khi đó hai vế "hiện ở Đối soát" của A2 / A3 KHÔNG đạt, phải sửa nghiệm thu của phiếu.)
3. **A3 chọn (a) chặn hẳn** tiền mặt → chuyển khoản (lý do mục 2). Bấm nhầm "tiền mặt" khi khách đã chuyển khoản: két sẽ lệch, khoản tiền về hiện
   đỏ ở Đối soát mục CK để bạn xử. **Đề xuất: đồng ý (a).**
4. **A7.2 thử tay "đổi cách trả" không làm được** — không màn nào có nút đổi cách trả (route chỉ bài thử gọi). Thay bằng ca máy A3a/A3b.
   **Đề xuất: đồng ý.**
5. **Hạ `NGUONG_FETCH` 22 → 21** trong `kiem_tra_truoc_khi_giao.js`: phiếu ghi "chỉ THÊM dòng `chayBaiThat`", còn CLAUDE.md §6 cho hạ ngưỡng sau khi
   dọn thật (bỏ fetch trần `Orders.jsx:415`). Không hạ thì bộ kiểm chỉ in cảnh báo "có thể hạ", không đỏ. **Đề xuất: cho hạ.**

## 8. Phát hiện (ngoài phiếu — không sửa)
1. `POST /wallets/topup` (`wallets.js:154-177`) nhận `payment_method` tự do từ máy khách (màn `ViKhach.jsx` gửi `'cash'`, chỉ owner thấy nút) — ai có quyền
   `topup_balance` gọi tay với `'transfer'` là "nạp chuyển khoản không qua QR", và đối soát két đếm theo cột này (`doiSoat.js:108-109`). Lối thứ 4 cùng
   khuôn; đề xuất việc sau: nạp tay chỉ nhận `cash`.
2. Kho mây là kho nông — `npm test` gốc có thể đỏ ở `thu_BH2` G1 (BO-MAN-CU-1 ghi lại); sẽ `--unshallow` trước khi chạy bộ kiểm.
