# P15-QR — trạng thái

## Bước 1 — đối chiếu bản chụp
- Lượt 1 (22.10.2026): nhánh `viec/P15-QR`, cây sạch. HEAD `61e713c` = FETCH_HEAD `61e713c` → không kéo.
  ```
  61e713c PHIEU: P15-QR
  4ee92fe TIEN-DO: KH-API-1 (e7f79bf), P16 (4fa657a), P26d (f1dbd7c), DOI-SOAT-1 (fabe583) xong; mo P22-23, P15-QR, KH-UI-1, KH-QUAY-1; them GIAO-1, DOI-SOAT-2, P26e; TAM_NHIN + NHIP_NGAY vao kho; lich — so v38
  fabe583 Merge pull request #37 from pos-tuquyduong/viec/DOI-SOAT-1
  ```

## Bước 2 — đã đọc
`phieu.md`, `CLAUDE.md`, `LUAT_XAY_APP.md`, `KHUON_LOI.md`, `ban_mau_pos/DAC_TA.md` (mục Khách P15), `ban_mau_pos/ban_mau_pos.html` (ô khách,
hộp quét thẻ); code: `helpers.js` (`generateQRCode`), `customers.js` (`/qr/:code`, POST /, POST /:id/children), `customers-v2.js` (`/search`,
dự phòng `pos_customers`, chép khách SX), `kh/index.js`, `kh/loi.js`, `middleware/khachAuth.js`, `maKhach.js`, `sync.js` (nhập / xuất CSV),
`backup.js`, `server/index.js` (bộ ghi nhật ký), `Sales.jsx` (ô khách, quét mã giảm), `QrScanModal.jsx`, `CustomerSearch.jsx`, `CustomerInput.jsx`,
`InvoicePreview.jsx`, `utils/api.js`, `cong_cu/thu_KH1.js`. Trích dẫn ở `ke_hoach.md` mục 0.

## Bước 3 — kế hoạch
`ke_hoach.md`. Soát độc lập (agent chỉ đọc, 4 câu) bắt: log lộ mã (`index.js:68-71`), Q3 nói sai một nửa, kẹt camera sau lần quét lỗi, thiếu ca
cho "mọi chỗ gọi dùng vòng sinh lại" và `sync.js`, ngân sách thử ghi sai — đã sửa, chi tiết `ke_hoach.md` mục 10.
`npm test` trên `61e713c`: 68 phép, qua hết. Phiếu dặn chờ duyệt → DỪNG ở đây.

## Câu hỏi

**Q1 (chặn việc) — `thu_KH1.js` sẽ ĐỎ trên code PR, phiếu lại dặn "CHỈ thêm ca; bản gốc chạy trên code PR phải xanh".**
Hai ca cũ khoá đúng hành vi phiếu này phải đổi:
- `cong_cu/thu_KH1.js:269-271` A4 đòi khách mới từ App có `qr_code === 'QR-' + sđt` (chính dạng phiếu bỏ);
- `cong_cu/thu_KH1.js:429` E1 đòi `GET /toi` có ĐÚNG 3 trường `sdt · ten · ngay_tao` (phiếu D thêm `qr`).
Bài này chạy trong `npm test` (`kiem_tra_truoc_khi_giao.js:495`) → không sửa thì bộ kiểm đỏ, không commit được.
Đề xuất: chủ quán thêm mục `## Bài thử cũ sửa` vào phiếu cho `cong_cu/thu_KH1.js`: A4 → `qr_code` khớp `^TQD-[A-Z2-9]{12}$` và không chứa SĐT;
E1 → đúng 4 trường `ngay_tao · qr · sdt · ten`; thêm ca E1b cặp A/B. (Cổng A11 sẽ thấy bài cũ sửa — đúng loại mục này.)
Phương án khác (không đề xuất): để `qr` ở route riêng `/toi/qr` giữ được E1 — nhưng trái chữ phiếu D và A4 vẫn đỏ.

**Q2 (xác nhận) — nút quét chọn khách.** Phiếu C: "Không thêm nút thừa". Bản vẽ đã chốt (`ban_mau_pos.html:472`) có nút **📷 Quét thẻ** ngay cạnh
ô tìm khách; nút quét hiện có nằm ở ô mã giảm và ẩn khi đã áp mã (`Sales.jsx:1382`). Kế hoạch: thêm đúng nút của bản vẽ trong
`CustomerSearch.jsx`, giữ nguyên nút mã giảm, `Sales.jsx` không sửa. Quét mã khuyến mãi bằng nút Quét thẻ → báo "Không phải thẻ thành viên"
(như bản vẽ `:241`), không tự áp mã. Đồng ý?

**Q3 (xác nhận) — QR và ô tìm phải ra cùng một khách.** Ô tìm khách ở quầy đọc SX + `pos_registrations` (`customers-v2.js:109-190`); chỉ khi SX
vắng / chưa cấu hình thì đọc dự phòng `pos_customers` (`customers-v2.js:25, 74-91`). Khách tự tạo trong App (`maKhach.js:134`) chỉ nằm ở
`pos_customers` → lúc SX chạy thì ô tìm KHÔNG thấy, lúc SX vắng thì thấy. Kế hoạch: quét → SĐT → tìm đúng SĐT bằng CHÍNH API ô tìm → chọn dòng
trùng; không có thì báo "Khách chưa có trong danh sách quầy — tìm theo SĐT" (QR và gõ SĐT luôn ra cùng một kết quả — K4 "một vị từ"). Không tự
dựng đối tượng khách thiếu ví / chiết khấu cho `Sales.jsx`. Khoảng trống "khách App không tìm được ở quầy khi SX chạy" ghi Phát hiện (có thể
thuộc KH-QUAY-1). Đồng ý?

**Q4 (chặn việc) — mã QR lọt vào nhật ký máy chủ.** `server/index.js:68-71` ghi `${req.method} ${req.path}` cho MỌI yêu cầu → mỗi lần quét,
`GET /api/pos/customers/qr/TQD-…` ghi mã khách vào log Render (mã cũ `QR-<SĐT>` thì ghi SĐT). Phiếu D: "không vào log". `index.js` ngoài Phạm vi.
Chọn một:
- **(a) — đề xuất.** Thêm `server/index.js` vào Phạm vi, CHỈ bộ ghi nhật ký: thay phần sau `/customers/qr/` bằng `***` (~2 dòng). Giữ đúng route
  GET phiếu ghi. Ca D4 chạy `server/index.js` thật trên kho tạm (tiến trình con), quét một mã, soi stdout không chứa mã; ĐỎ trên gốc.
- (b) Đổi tra QR sang `POST /api/pos/customers/qr` thân `{ ma }` — mã không nằm trong path, không đụng `index.js`. Nhưng trái tên route trong
  phiếu E, `getByQR` ở `api.js:318` (ngoài Phạm vi) thành code chết, quầy gọi `api.post` thẳng.
- (c) Chấp nhận (log Render chỉ chủ quán xem) — trái chữ phiếu D; ghi CHƯA KIỂM.

**Ghi để duyệt (không hỏi):** tiền tố `TQD-` lấy theo bản vẽ, 12 ký tự ngẫu nhiên (≈ 60 bit); `helpers.js` thêm hằng `QR_TIEN_TO`, `QR_THU_TOI_DA`
cạnh `generateQRCode`, đúng một hàm `sinhQrKhongTrung` ngay dưới, và hai tên này vào `module.exports`. Không thêm giới hạn dò cho `/qr/:code` —
lý do ở `ke_hoach.md` mục 5. Bài thử dự kiến ~230 + 15 dòng, vượt "thử ~200" của phiếu khoảng 20% (thêm ca sau soát).

## Phát hiện
- `server/utils/maKhach.js:134-135` và `server/routes/sync.js:290-297` vẫn gọi `generateQRCode(sdt)` (đối số bị bỏ qua sau vá, ra mã thật) nhưng
  KHÔNG có vòng sinh lại khi trùng; `maKhach.js` còn `ON CONFLICT DO NOTHING` → trùng `qr_code` (xác suất ~2⁻⁶⁰) thành 500 "không tạo được khách".
  Ngoài Phạm vi — đề xuất: đổi hai chỗ sang `await sinhQrKhongTrung(...)` ở việc chạm tới hai file đó.
- `server/routes/customers-v2.js:57-66` chép khách SX vào `pos_customers` không ghi `qr_code` (NULL) — kế hoạch phủ bằng đổi mã lúc `/kh/toi`.
- Ô tìm khách ở quầy không thấy khách chỉ có trong `pos_customers` khi SX đang chạy (xem Q3).
- `client/src/utils/api.js:318` `getByQR` không `encodeURIComponent` (khác `search` ở `:303`).
