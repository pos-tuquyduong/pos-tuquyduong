# P15-QR — QR thành viên thật (mã riêng, không đoán được) · quầy tìm khách / quét QR khách

<!-- Phiếu do chat soạn 22.10.2026. Việc bảo mật [T] — máy lập kế hoạch, dừng chờ chủ quán duyệt. Nền: main `fabe583`.
     Code hiện tại (đọc 22.10): `generateQRCode(phone)` ở server/utils/helpers.js trả `QR-<SĐT>` → ai biết SĐT là giả được QR của khách;
     cột `pos_customers.qr_code` (UNIQUE) đã có; `GET /api/pos/customers/qr/:code` (customers.js ~276) tìm khách theo qr_code; quầy có
     `QrScanModal.jsx` (quét mã khuyến mãi, Sales.jsx gọi) và `CustomerSearch.jsx` (tìm tên / SĐT). App KH (KH-UI-1) hiện QR của chính
     khách — cần `qr` trong hồ sơ `/api/kh/toi`. Chủ quán chốt: khách mới / khách không thông tin không tạo tài khoản ở quầy (đã làm),
     quầy nhận diện khách hiện hữu qua tìm tên/SĐT hoặc quét QR. Song song M3: KH-QUAY-1 (Customers.jsx), P22-23 (orders.js),
     KH-UI-1 (app_kh/). Cùng dựng client/dist với KH-QUAY-1 → chat xếp thứ tự gộp. -->

**Chờ duyệt kế hoạch:** viết `viec/P15-QR/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

**Đã duyệt (chủ quán 22.10, sau khi soát kế hoạch `ke_hoach.md` đầu nhánh `f954eb6`):** kế hoạch được duyệt kèm các điểm sau; máy làm tiếp từ
bước 4 (`/lam-viec P15-QR tiep`) tới hết, không dừng hỏi lại các điểm này:
1. `cong_cu/thu_KH1.js` (đã trong Phạm vi) được SỬA ca A4 (`qr_code` khớp `^TQD-[A-Z2-9]{12}$`, không chứa SĐT) và ca E1 (`/toi` đúng 4 trường
   `ngay_tao · qr · sdt · ten`), thêm ca E1b cặp A/B. Đây là việc CỐ Ý đổi hành vi bài đang canh → KHÔNG ghi vào mục `## Bài thử cũ sửa`
   (MAU_PHIEU); mỗi ca sửa phải ĐỎ trên code gốc.
2. Thêm `server/index.js` vào Phạm vi — CHỈ bộ ghi nhật ký yêu cầu (khối "Request logging" ~dòng 68-71): thay phần sau `/customers/qr/` bằng `***`
   (~2 dòng), giữ route GET như phiếu. Ca D4: chạy `server/index.js` thật trên kho tạm (tiến trình con), quét một mã, stdout không chứa mã; đỏ trên gốc.
3. Quầy: thêm nút "📷 Quét thẻ" trong `CustomerSearch.jsx` đúng bản vẽ (`ban_mau_pos.html:472`); giữ nguyên nút quét mã giảm; `Sales.jsx` không sửa.
   Quét mã khuyến mãi bằng nút Quét thẻ → báo "Không phải thẻ thành viên" (như bản vẽ), không tự áp mã.
4. Quét ra khách mà ô tìm không thấy (khách chỉ có ở `pos_customers`, SX đang chạy) → báo "Khách chưa có trong danh sách quầy — tìm theo SĐT"; KHÔNG
   tự dựng đối tượng khách. Khoảng trống "khách App không tìm được ở quầy khi SX chạy" ghi `## Phát hiện`.
5. Tiền tố `TQD-` + 12 ký tự ngẫu nhiên; `helpers.js` thêm `QR_TIEN_TO`, `QR_THU_TOI_DA` và `sinhQrKhongTrung` ngay dưới `generateQRCode` (đưa vào
   `module.exports`); không thêm giới hạn dò cho `/qr/:code`; bài thử tới ~245 dòng được chấp nhận.
6. `maKhach.js` và `sync.js` (gọi `generateQRCode` chưa có vòng sinh lại): ngoài Phạm vi, ghi Phát hiện, không sửa.

## Mục tiêu
Mỗi khách có một QR riêng không đoán được. Khách mở App KH hiện QR của mình; thu ngân quét bằng camera (hoặc tìm tên / SĐT) để chọn đúng
khách trong màn Bán hàng, cộng điểm / dùng ví đúng người. Không còn QR suy ra từ SĐT.

## Nghiệm thu
- A Mã QR mới: sinh bằng `crypto.randomBytes` (hoặc tương đương), ≥ 12 ký tự chữ-số, có tiền tố cố định để quầy phân biệt với mã khuyến
  mãi, KHÔNG chứa SĐT, không đoán được; trùng UNIQUE → sinh lại (giới hạn số lần). Mọi chỗ tạo khách (customers.js ~344, ~379, ~611) dùng
  hàm mới; `generateQRCode` đổi một chỗ (helpers.js), không rải.
- B Khách đang có `QR-<SĐT>` (dạng cũ): đổi sang mã thật theo cách ĐƠN GIẢN nhất kế hoạch chọn (một lần khi cần, hoặc lần đầu khách xin
  QR trong App) — nêu rõ trong kế hoạch. Dạng cũ SAU khi đổi bị từ chối ở `/qr/:code`. Máy tìm nơi nào đang in / lưu dạng cũ (bill, tem,
  xuất CSV sang SX `sync.js`, sao lưu); có nơi đang dùng → `## Câu hỏi` (câu chọn), không tự đổi `sync.js` / `backup.js`.
- C Quầy: trong màn Bán hàng, ô tìm khách có nút "📷 Quét thẻ" (đúng bản vẽ đã chốt, `CustomerSearch.jsx`) mở `QrScanModal` có sẵn; quét ra mã có
  tiền tố khách → SĐT → tìm đúng SĐT bằng CHÍNH API của ô tìm → chọn khách. Mã khuyến mãi vẫn đi đường cũ ở nút quét mã giảm (không phá A5); quét
  mã khuyến mãi bằng nút Quét thẻ → "Không phải thẻ thành viên". Khách không có trong danh sách quầy → báo, không tự dựng. Tìm tên / SĐT như cũ.
- D Khách xem QR của mình: `GET /api/kh/toi` thêm trường `qr` (lấy theo token khách, KHÔNG theo tham số). Khách A không thấy QR khách B
  (bài thử cặp A/B → 403 / không có trường); `qr` không xuất hiện ở bất kỳ route khách nào khác, không vào log, không vào bill.
- E `/api/pos/customers/qr/:code`: chỉ nhân viên (token quầy); mã sai / dạng cũ → 404 có `code`; không lộ khách khác; có giới hạn dò
  (mỗi nhân viên / IP) nếu kế hoạch thấy cần — nêu lý do.
- F Luồng hợp lệ KHÔNG bị chặn (K5): tìm khách bằng tên / SĐT; tạo khách mới; khách có người nhận (parent_phone) — QR gắn đúng người.
- G Bản dựng client thành công; màn Bán hàng thao tác như cũ khi không quét.

## Phạm vi
- viec/P15-QR/**
- server/utils/helpers.js
- server/index.js
- server/routes/customers.js
- server/routes/kh/index.js
- client/src/components/QrScanModal.jsx
- client/src/components/CustomerSearch.jsx
- client/src/components/CustomerInput.jsx
- client/src/pages/Sales.jsx
- client/dist/**
- cong_cu/thu_P15QR.js
- cong_cu/thu_KH1.js

## Bài thử đỏ
Có — bài mới `cong_cu/thu_P15QR.js` (máy chủ thật trên kho tạm) phải ĐỎ trên code gốc (QR đoán được từ SĐT).

## Ngân sách
Server ~80 dòng + client ~120 dòng + thử ~200 dòng.
**Vùng sửa của file chung / việc song song (checklist 22.10):**
- `helpers.js`: CHỈ hàm `generateQRCode` và (nếu cần) một hàm sinh mã ngay dưới nó.
- `routes/kh/index.js`: CHỈ hàm `hoSo` (thêm `qr`) và route `GET /toi`; không sửa route khác.
- `Sales.jsx`: CHỈ khối chọn khách + `handleQrScanResult` (~dòng 287) + nút quét (~1385); không đổi luồng thu tiền.
- `cong_cu/thu_KH1.js`: sửa ca A4, E1 và thêm E1b theo luật QR mới (đã duyệt 22.10); không bớt ca canh việc khác.
- `server/index.js`: CHỈ bộ ghi nhật ký yêu cầu (che mã sau `/customers/qr/`); không đụng CORS, thứ tự mount, khối phục vụ App KH (KH-UI-1 sửa file này ở vùng khác).
- KHÔNG sửa `client/src/pages/Customers.jsx` (KH-QUAY-1 đang sửa), `server/routes/orders.js` (P22-23). Cần sửa → `## Câu hỏi`.
- KHÔNG ghép bài mới vào `kiem_tra_truoc_khi_giao.js` (tránh đụng việc P22-23); ghi lệnh chạy + kết quả vào `trang_thai.md`, chat ghép sau.
- Phải dựng lại `client/dist` (`cd client && npm run build`), sau KH-QUAY-1 hoặc trước đều được — chat xếp thứ tự gộp.

## Đổi cấu trúc DB
không (dùng cột `qr_code` UNIQUE có sẵn; không thêm bảng)

## Thư viện mới
không (`jsqr` đã có để quét; hiển thị QR trong App là việc của KH-UI-1)

## Cấm
- KHÔNG sửa `server/database.js`, `server/routes/orders.js`, `sync.js`, `backup.js`, `Customers.jsx`, `App.jsx`, `app_kh/**`.
- Không sửa `tu_chay/`, `.claude/`, `.github/`, sổ việc, `LUAT_XAY_APP.md`. Chỉ push `git push -u origin viec/P15-QR`. Không đụng `main`, không merge, không tạo PR.
