# BO-MAN-CU-1 — Bỏ màn Bán hàng cũ, quầy chỉ còn màn mới · khoá đường tạo đơn thẳng

**Chờ duyệt kế hoạch:** viết `viec/BO-MAN-CU-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Quầy chỉ còn MỘT màn Bán hàng: màn mới (`client/src/pages/BanHang/`). Hiện hai màn chạy song song: công tắc theo từng máy, mặc định ra màn cũ
`Sales.jsx` (`BanHang/index.jsx`). Nhân viên và chat đã nhầm hai màn. Phần chống thu trùng của KET-NOI-1 và PIN khi trừ tài khoản chỉ có ở màn mới.
Chủ quán chốt 11.11 (`QUYET_DINH_CHU_QUAN.md`: bỏ hẳn màn cũ; máy chủ khoá, trừ tiền tài khoản của khách hay của mẹ luôn cần PIN chủ tài khoản) và
17.11 (chat POS bàn 39):
- **Gói:** chủ quán đã KẾT THÚC mọi gói khách đang dùng (14 gói thử, "Kết thúc gói… / không hoàn", 17.11 14:47).
  - Màn mới KHÔNG làm bán gói, KHÔNG làm lấy món từ gói.
  - Gói kiểu mới (nếu còn bán) là việc riêng sau khai trương. Tới lúc đó quầy không bán gói, không lấy món từ gói.
- **Không thiết kế lại màn bán hàng.** Bản vẽ đã chốt (`ban_mau_pos/`). Việc này chỉ xoá, khoá, dọn.
- **Dọn giao diện Cài đặt / Khách / Quản lý / menu là GIAO-DIEN-2** (làn Sonnet), không làm ở đây.

## Nghiệm thu

### A. Một màn duy nhất (giao diện)
- A1 Trang `/` LUÔN dựng màn mới. Các trường hợp sau đều ra màn mới:
  - máy chưa từng bật;
  - `localStorage` cũ đang ghi "tắt";
  - địa chỉ `/?man=cu`;
  - địa chỉ `/?man=moi`.
  Kiểu bố cục đang chọn của máy (`kieu`) vẫn được nhớ như cũ.
- A2 Bảng ⚙ "Màn bán hàng" không còn nút "Tắt — về màn cũ" và không còn chữ "Màn bán hàng mới (máy này)". Đổi thành "Kiểu màn bán hàng (máy này)" hoặc chữ tương đương,
  không nhắc màn cũ. Không còn chữ, nút hay đường dẫn nào ở `client/src/` trỏ về màn cũ (grep `man=cu`, `man=moi`, `Sales`, `màn cũ`).
- A3 Xoá `client/src/pages/Sales.jsx`.
  - Xoá cả mọi file ở `client/src/` mà CHỈ `Sales.jsx` import: kế hoạch liệt kê từng file kèm lệnh grep chứng minh không nơi nào khác dùng.
  - File còn nơi khác dùng thì GIỮ.
  - Hàm trong `utils/api.js` chỉ `Sales.jsx` gọi thì xoá. Ví dụ `ordersApi.create`, nếu grep cho thấy chỉ còn ở đó.
- A4 `cd client && npm run build`; `--day-du` xanh. Ghi kích thước gói JS trước và sau vào `trang_thai.md`.

### B. Máy chủ: khoá đường tạo đơn THẲNG
Đường này là `POST /api/pos/orders` → `taoDon(req, res)` với `phien = null`, ở `server/routes/orders.js`, dòng `router.post("/", …)`.
Sau việc này màn hình quầy không còn gọi đường này. Mọi đơn quầy đi qua phiên thu tiền (`/api/pos/thanh-toan/phien`, `utils/giuCho.js`).
- B1 Đường thẳng trừ tài khoản khách hoặc tài khoản mẹ (số dư ví) → bị chặn: lỗi có `code` IN HOA, không ghi gì (đơn, ví, điểm, kho, voucher, lượt mã).
  Trừ tài khoản chỉ còn qua phiên có PIN.
- B2 Đường thẳng có chuyển khoản → bị chặn như B1. Chuyển khoản chỉ còn qua phiên QR.
- B3 Gói, mọi đường của QUẦY:
  - Mua gói mới (`package_buy`) → bị chặn.
  - Lấy món từ gói (`customer_package_id` / `from_package`) → bị chặn.
  - Cả hai chặn trên đường thẳng LẪN đường phiên, `code` riêng (vd `GOI_TAM_DUNG`), lời "Quầy tạm ngưng gói".
  - Kế hoạch liệt kê mọi lối vào `taoDon` (route thẳng, phiên `giuCho`, App KH `donApp`, màn khách `manKhach`, chốt muộn webhook…) và chỉ ra lối nào đang có thể mang gói.
- B4 **Phương án khoá hẹp nhất.** Kế hoạch so ba cách:
  - (a) chặn đúng các vế B1–B3 ở đường thẳng;
  - (b) đường thẳng chỉ nhận đơn tiền mặt thuần;
  - (c) đóng hẳn đường thẳng (410).
  Với mỗi cách, đếm số bài thử `cong_cu/` và giả lập quầy (`cong_cu/gia_lap/`) phải sửa (hiện ~35 bài gọi `POST /orders`). Chọn cách ÍT sửa nhất mà vẫn đạt B1–B3. Ghi lý do.
- B4b **Chủ quán duyệt kế hoạch 17.11 19:04 — "đồng ý cả 5"** (`ke_hoach.md` 4386c365 mục 7):
  - Câu 1: Phạm vi thêm đúng tên 7 file luật (đã ghi dưới).
  - Câu 2: được THÊM đúng một dòng `chayBaiThat('cong_cu/thu_BOMANCU1.js')` vào `kiem_tra_truoc_khi_giao.js` (cạnh `thu_KETNOI1`).
  - Câu 3: `client/src/pages/InvoiceSettings.jsx` vào Phạm vi, CHỈ sửa chữ chú thích dòng nhắc "Orders/Sales". `Layout.jsx` để nguyên.
  - Câu 4: tách `taoDon` thành cửa chặn + thân `taoDonGoc`. Được thêm dòng `module.exports.taoDonGoc` cuối `orders.js`, có phép khoá chữ `taoDonGoc` đúng 3 chỗ.
    Hàm phụ bài thử `cong_cu/gia_lap/donCu.js`. Ngân sách bài thử ≈ 780 dòng (+40 cho câu 5) được duyệt.
  - Câu 5: cửa chặn thêm vế "đường thẳng không nhận ghi nợ / chờ thu" (`debt_amount > 0` hoặc `payment_method` `debt` / `cho_thu`) → 400 `KHONG_GHI_NO`, có đột biến `BV-GHI-NO-THANG`.
    `pay-debt` cho đơn nợ CŨ giữ nguyên trong việc này. Thu nợ chuyển khoản phải qua QR là việc TIEN-KHOA-2.
- B5 Đột biến:
  - VS-/BV- cho TỪNG vế chặn (tài khoản khách, tài khoản mẹ, chuyển khoản, mua gói, lấy từ gói), mỗi vế ít nhất một đột biến, có đối chứng.
  - Ca "chặn" so đúng `code` của vế đang thử VÀ dấu vết không ghi (đếm dòng đơn / ví / điểm trước và sau).

### C. Luồng hợp lệ phải KHÔNG bị chặn (K5) — mỗi luồng một ca
- C1 Màn mới thu: tiền mặt; QR; trả bằng tài khoản có PIN; tài khoản mẹ có PIN; tách tiền mặt + tài khoản; mua hạng thẻ; nạp tiền; mã giảm, voucher, hạng, flash.
- C2 Đơn giao hàng (GIAO-1/2) đi qua phiên.
- C3 Đơn App KH (`/api/kh`, `donApp`): đặt, trả, chốt muộn. Hợp đồng `/api/kh` KHÔNG đổi (giữ PHIEN_BAN 17); `cong_cu/thu_HOPDONG_KH.js` xanh.
- C4 Màn khách (`manKhach`) không đổi.
- C5 Lịch sử đơn, huỷ đơn (HUY-1) và hoàn của đơn ĐÃ CÓ chạy như cũ. Gồm cả đơn cũ từng tạo bằng màn cũ: đơn trừ ví, đơn chuyển khoản, đơn bán gói hoặc lấy từ gói.
- C6 Báo cáo vẫn xem được gói đã kết thúc (lịch sử). Đối soát ngày / tuần / tháng không đổi số trên cùng dữ liệu.
- C7 Giả lập một ngày bán hàng (`kiem_tra_truoc_khi_giao.js` nhóm S, `cong_cu/gia_lap/`) XANH.

### D. Bài thử, bộ kiểm
- D1 Bài thử cũ đang đọc `Sales.jsx` sẽ hỏng khi xoá file:
  - Danh sách lúc chat đọc: `thu_HANG1`, `thu_BH1`, `thu_BH2`, `thu_UUDAI1`, `thu_P26b`, `thu_P26c`, `thu_BHCKTAY1`, `thu_BAO1a`, `thu_KHACHCK1`, `cong_cu/do_chuathu.js`, `cong_cu/gia_lap/kich_ban.js`. Máy grep lại.
  - Mỗi bài: ca canh hành vi CÒN ở màn mới thì chuyển sang soi file màn mới. Ca chỉ của màn cũ thì bỏ. Ghi rõ từng ca trong kế hoạch.
  - Đây là bài SỬA thường vì hành vi chủ quán đã duyệt đổi (LUAT_XAY_APP §6.8): đỏ trên gốc, xanh trên HEAD, có dòng `SỐ CA`.
- D2 `kiem_tra_truoc_khi_giao.js`: CHỈ được làm ba việc (việc thứ ba: dòng `chayBaiThat` ở B4b câu 2).
  - Hạ `NGUONG_FETCH` đúng bằng số `fetch` trần mất theo `Sales.jsx`. Đo trước và sau, ghi số.
  - Đổi phép đang soi `Sales.jsx` (nếu có) sang file màn mới tương ứng.
  - KHÔNG nới hay bỏ phép nào khác (K8).
- D3 Bài thử MỚI `cong_cu/thu_BOMANCU1.js` phủ A1–A3 và B1–B5. Ca A1 khoá cả bốn trường hợp đầu vào.

### E. Chủ quán thử tay (≤ 3 thao tác, trên điện thoại quầy, sau Merge)
- E1 Mở `pos-tuquyduong.io.vn/?man=cu` → vẫn ra màn mới.
- E2 Bán 1 món tiền mặt: "Đã nhận tiền" → In → đơn có trong Lịch sử đơn.
- E3 Khách có tài khoản: trả bằng tài khoản → hỏi PIN → đúng PIN thì trừ đúng.

## Phạm vi
- viec/BO-MAN-CU-1/**
- client/src/pages/Sales.jsx
- client/src/pages/BanHang/**
- client/src/App.jsx
- client/src/utils/api.js
- client/src/components/**
- client/dist/**
- server/routes/orders.js
- server/utils/giuCho.js
- kiem_tra_truoc_khi_giao.js
- cong_cu/thu_BOMANCU1.js
- cong_cu/thu_*.js
- cong_cu/do_chuathu.js
- cong_cu/gia_lap/**
- cong_cu/gia_lap/kich_ban.js
- cong_cu/gia_lap/donCu.js
- cong_cu/thu_P20.js
- cong_cu/thu_P21.js
- cong_cu/thu_P26a.js
- cong_cu/thu_P26b.js
- cong_cu/thu_gia_lap.js
- client/src/pages/InvoiceSettings.jsx
- README.md

## Ngân sách
Khoảng −2.300 dòng (xoá `Sales.jsx` và phần chỉ nó dùng), ~60–100 dòng code máy chủ và màn mới, ~300 dòng thử. Sửa bài thử cũ tuỳ cách B4 chọn.
**Phương án đơn giản nhất đã xét:**
- Giữ nguyên đường tạo đơn thẳng cho bài thử. Chỉ chặn đúng các vế có tiền ngoài tiền mặt và gói (B4a hoặc b).
- Màn: `BanHang/index.jsx` trả thẳng `BanHangMoi`, xoá `Sales.jsx`.
- Không viết lại luồng tiền, không đổi DB, không đổi hợp đồng App.
- Đóng hẳn đường thẳng (B4c) chỉ chọn khi số bài phải sửa không nhiều hơn.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
có — đụng đường ghi tiền (ví khách, ví mẹ, chuyển khoản, gói) và cổng phân quyền tạo đơn

## Cấm
- KHÔNG sửa `server/routes/kh/**`, `server/middleware/khachAuth.js`, `HOP_DONG_API_KH.md`, `HOP_DONG_API_ND.md`. App KH không đổi.
- KHÔNG sửa `ban_mau_pos/**` (bản vẽ đã chốt). KHÔNG thiết kế lại màn bán hàng.
- KHÔNG sửa `client/src/pages/Settings.jsx`, `Customers.jsx`, `Reports.jsx`, `components/Layout.jsx` (làn GIAO-DIEN-2), `client/src/pages/GiaoHang/**`.
- KHÔNG sửa phần trừ kho / sản phẩm trong `orders.js` (làn KHO-3). Chỉ sửa vùng cổng đầu `taoDon`, `router.post("/")`, và dòng export `taoDonGoc` cuối file (B4b câu 4).
- KHÔNG xoá dữ liệu, KHÔNG sửa bảng gói. Gói đã kết thúc giữ nguyên làm lịch sử.
- Mặc định: không sửa `.claude/`, không merge, không tạo PR, không đụng main, chỉ `git push -u origin viec/BO-MAN-CU-1`, không sửa sổ việc, không chạy `patch_*.py`.
