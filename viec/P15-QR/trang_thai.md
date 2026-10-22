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

## Lượt 2 (22.10.2026, `/lam-viec P15-QR tiep`) — bước 1
Nhánh `viec/P15-QR`, cây sạch. HEAD `a5ec1f2` = FETCH_HEAD `a5ec1f2` → không kéo.
```
a5ec1f2 PHIEU: P15-QR duyet ke hoach 22.10 (them index.js log, sua thu_KH1 A4/E1, nut Quet the)
f954eb6 P15-QR: ke hoach (cho duyet) + trang thai, cau hoi Q1-Q4
61e713c PHIEU: P15-QR
```
Q1–Q4 đã được chủ quán trả lời trong mục "Đã duyệt" của phiếu (`a5ec1f2`) — làm theo, không hỏi lại.

## Bước 4 — bài thử đỏ trước
- `cong_cu/thu_P15QR.js` (mới, 286 dòng): gốc **8 đạt · 20 hỏng**, bản vá **29 đạt · 0 hỏng**.
- `cong_cu/thu_KH1.js` (sửa A4, E1, thêm E1b — đã duyệt): gốc **154 đạt · 3 hỏng** (đúng 3 ca vừa sửa), bản vá **157 đạt · 0 hỏng**.
- Chi tiết + dòng `SỐ CA`: `bang_chung_do.txt`. Gốc chạy bằng cách đặt lại bốn file `server/` về `a5ec1f2` (`git checkout -- <file>`), bài bản cuối.
- Sự cố khi viết bài: (1) `sv.close()` đặt trước D4 → D4 "fetch failed" (lỗi bài, sửa `794c0d6`); (2) ca A2 cũ đòi "người nhận không SĐT →
  qr NULL" — truy ra `pos_customers.phone TEXT UNIQUE NOT NULL` (`server/database.js:81`): người nhận không SĐT KHÔNG BAO GIỜ ghi được, trên gốc
  cũng vậy → kế hoạch mục 0 / mục 7 A2 nói sai (K1); bỏ vế đó khỏi A2 (`2936ed7`), ghi Phát hiện; (3) thêm ca D4 đường viết hoa
  `/Customers/QR/<mã>` (Express khớp route không phân biệt hoa thường — bộ che phải có cờ `i`).

## Bước 5 — sửa
| Chỗ vá | File | Đột biến |
|---|---|---|
| `generateQRCode` ngẫu nhiên `TQD-`+12 | `server/utils/helpers.js` | `BV-A-qr-sdt` · `VS-A-ngan-8` |
| `sinhQrKhongTrung` (≤ `QR_THU_TOI_DA` = 5) | `server/utils/helpers.js` | `BV-A5-khong-kiem-trung` · `VS-A5-thu-6-lan` |
| người nhận trong POST / | `server/routes/customers.js` | `VS-A2-con-qr-sdt` · `VS-A7-con-goi-generate` |
| POST /:id/children | `server/routes/customers.js` | `VS-A3-children-qr-sdt` · `VS-A7-children-goi-generate` |
| POST / | `server/routes/customers.js` | `VS-A7-post-goi-generate` |
| `/qr/:code` từ chối mã cũ, 404 `QR_KHONG_CO`, giữ `authenticate` | `server/routes/customers.js` | `BV-B1-nhan-qr-cu` · `BV-E1-bo-code` · `BV-E1-bo-authenticate` |
| `GET /kh/toi` đổi mã cũ / NULL một lần, chặn đua trong câu ghi | `server/routes/kh/index.js` | `BV-B2-toi-khong-doi` · `VS-F2-toi-luon-sinh-moi` · `VS-A7-toi-goi-generate` |
| `GET /kh/toi` trả `qr` theo token, không vào `hoSo` | `server/routes/kh/index.js` | `BV-D1-toi-khong-qr` · `VS-D1-qr-theo-tham-so` · `VS-D2-qr-vao-hoSo` |
| bộ ghi nhật ký che mã sau `/customers/qr/` (cờ `i`) | `server/index.js` | `BV-D4-log-ghi-ma` · `VS-D4-log-phan-biet-hoa` |

`python3 viec/P15-QR/dot_bien.py`: ĐỐI-CHỨNG 29 đạt · 0 hỏng; **20 đột biến bị bắt · 0 KHÔNG bị bắt (trên 20)**.
`VS-B4-update-khong-dieu-kien` (kế hoạch mục 8) KHÔNG dựng: hai `/toi` đồng thời phụ thuộc thứ tự — không đỏ tất định → CHƯA KIỂM (K3).
Quầy: `QrScanModal.jsx` (`tieuDe`, lỗi hiện trong hộp, camera quét tiếp, bỏ qua đúng mã vừa lỗi, `onResult` qua ref);
`CustomerSearch.jsx` (nút 📷 Quét thẻ cạnh ô tìm; `QR-` → câu mã kiểu cũ; ký tự ngoài `[A-Za-z0-9-]` → "Không phải thẻ…"; còn lại
`customersApi.getByQR` → `customersV2Api.search(SĐT)` → dòng trùng SĐT → `handleSelect`; không có → "Khách chưa có trong danh sách quầy —
tìm theo SĐT."; 404 → "Không phải thẻ thành viên của quán."). `Sales.jsx` không sửa. `GET /toi` ghi chú `// GET-ghi:` theo quy ước bộ kiểm.

## Bước 6 — kiểm
- `npm test`: PASS 68 · FAIL 0 · CẢNH BÁO 1 (`route GET có lệnh ghi (3)` — packages.js, products.js, sync.js — có sẵn trên gốc, không phải file việc này).
- `(cd client && npm run build)` thành công. `bash ban_mau_pos/chay_thu.sh`: 119 đạt · 0 hỏng.
- `--day-du`: chủ quán dặn chạy ĐÚNG MỘT lần ở cuối — chạy qua `node tu_chay/cong.js chay` (A13 chạy `lenh_kiem_day_du`, `tu_chay/cau_hinh.json:3`).
- Ngân sách: server 50 dòng thêm / 16 bớt (phiếu ~80) · client +66 / −7 (~120) · thử 286 + 9 (đã duyệt ~245 — vượt ~40 dòng: thêm D4 viết hoa,
  dò nhật ký tiến trình con, A7 ghi / phát lại lần rút ngẫu nhiên).

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
- **Người nhận KHÔNG SĐT không tạo được** (có từ trước P15-QR): `pos_customers.phone TEXT UNIQUE NOT NULL` (`server/database.js:81`) mà
  `customers.js` POST / (người nhận) và POST /:id/children chèn `phone = NULL` → lỗi ràng buộc → 500; ở POST / khách chính và người nhận trước đó
  ĐÃ ghi rồi mới 500 (không giao dịch). Ngoài Phạm vi (đổi DB bị cấm) — đề xuất việc riêng: chặn 400 khi người nhận thiếu SĐT, hoặc bọc giao dịch.
- `server/utils/maKhach.js:134-135` và `server/routes/sync.js:290-297` vẫn gọi `generateQRCode(sdt)` (đối số bị bỏ qua sau vá, ra mã thật) nhưng
  KHÔNG có vòng sinh lại khi trùng; `maKhach.js` còn `ON CONFLICT DO NOTHING` → trùng `qr_code` (xác suất ~2⁻⁶⁰) thành 500 "không tạo được khách".
  Ngoài Phạm vi — đề xuất: đổi hai chỗ sang `await sinhQrKhongTrung(...)` ở việc chạm tới hai file đó.
- `server/routes/customers-v2.js:57-66` chép khách SX vào `pos_customers` không ghi `qr_code` (NULL) — kế hoạch phủ bằng đổi mã lúc `/kh/toi`.
- Ô tìm khách ở quầy không thấy khách chỉ có trong `pos_customers` khi SX đang chạy (xem Q3).
- `client/src/utils/api.js:318` `getByQR` không `encodeURIComponent` (khác `search` ở `:303`).
