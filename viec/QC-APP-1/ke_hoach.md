# QC-APP-1 — kế hoạch (13.11.2026, nhánh `viec/QC-APP-1`, gốc `d121491`)

Lời thường: chủ quán sẽ có thêm một thẻ trong Cài đặt để tự gõ chữ chạy trên dải quảng cáo của App (và chữ banner Trang chủ), chọn hôm nay /
khung giờ nào hiện. App đọc qua một cửa công khai mới `GET /api/kh/quang-cao`. Không đụng tiền, đơn, điểm. Lưu cần PIN chủ quán.

## 0. Đã đọc (lượt này) — file:dòng
- Khuôn thẻ có PIN + thanh lưu: `pages/CaiDat/HangThe.jsx` (useThayDoi, HoiPin, ThanhLuu, baoXong/baoLoi, LoiO); route khuôn: `routes/tiers.js:100-115` (kiểm HẾT → `kiemPinChuQuan` → ghi MỘT giao dịch).
- Cửa /api/kh: `routes/kh/index.js:108-121` (`/gio-vang`, vị từ `bat`), `:151-160` (`/chuong-trinh`: không token, dùng chung `giuLuotMenu`).
- Món đang bán: `routes/products.js:34` `layMenuQuay` + `sellable` (cùng hàm `/api/kh/menu` dùng, `kh/index.js:~135`).
- Bước nâng cấp: `nang_cap/chay.js` (MAU_BUOC `NNN_ten.js`, chỉ cần đúng định dạng; 026/027 do việc khác).
- Sao lưu: `routes/backup.js:85-110` BACKUP_TABLES (cấu hình như `pos_chuong_trinh` nằm ở đây, KHÔNG ở BANG_KHONG_KHOI_PHUC).
- Dọn dữ liệu thử: `utils/donThu.js` chỉ xoá bảng liệt kê ở `THU_TU_XOA`; bài D14 của `thu_KHSDT1.js:552` chỉ buộc bảng CÓ cột SĐT / order_id phải có chủ → `pos_quang_cao` không có hai cột đó nên KHÔNG đổi `donThu.js`; khoá bằng ca bài thử (chạy dọn thật, dòng quảng cáo còn nguyên).
- Hợp đồng: `HOP_DONG_API_KH.md` (PHIEN_BAN 14 trên nhánh; phiếu dặn ghi v16), bài `thu_HOPDONG_KH.js` đòi mỗi cửa `data[].x` có ≥ 1 dòng → bài đó phải gieo một dòng quảng cáo.

## 1. Phương án
**Máy chủ.**
- A (chọn): MỘT file `routes/quang-cao.js` (~170 dòng) = route quầy `GET/PUT /api/pos/quang-cao` + hàm thuần dùng chung (`kiemDong`, `homNayHop`, `demKyTu`) xuất ra cho `kh/index.js`; thêm vào `kh/index.js` ~30 dòng (cửa mới + tách `docGioVang()` dùng chung cho `/gio-vang` và dòng Giờ vàng — MỘT vị từ `bat`, kết quả `/gio-vang` không đổi). 1 bảng `pos_quang_cao` + khoá `pos_settings.quang_cao_gio_vang`. Lưu = gửi CẢ danh sách một lần (như hạng), thứ tự mảng = `uu_tien` 1..n, dòng có id mà không còn trong danh sách bị xoá — trong MỘT giao dịch.
- B: thêm `server/utils/quangCao.js` tách phép tính. Nhiều hơn 1 file, phiếu không cho (Phạm vi) → bỏ.
**Giao diện.**
- A (chọn): `pages/CaiDat/QuangCao.jsx` (~250 dòng) + `pages/CaiDat/quangCao.js` (hàm thuần: đếm ký tự, kiểm ô, ~40 dòng, có bài thử chạy thật) + `quangCaoApi` ở `api.js` + ~10 dòng ở `Settings.jsx` (quyền, nhóm Khách hàng, nút, nhánh vẽ).
- B: gom hết vào một .jsx → kiểm ô không chạy thử được → bỏ.

## 2. Quyết định tôi tự chốt (phiếu không nói — chủ quán sửa được)
1. Giới hạn chữ (ký tự nhìn thấy, emoji = 1, đếm bằng `Intl.Segmenter`): chữ dải **32** (phiếu) · tiêu đề **40** · dòng phụ **80** · chữ nút **20** · tối đa **20** dòng quảng cáo. Hằng số một chỗ ở đầu `quang-cao.js`, bản sao ở `quangCao.js` phía quầy; bài thử so hai bên bằng nhau.
2. "Khi nào hiện" = đúng MỘT trong: hằng ngày · các thứ (T2=1…CN=7) · từ ngày – đến ngày (gồm cả hai đầu) — rồi cộng khung giờ. Máy chủ lọc theo NGÀY (giờ VN, `getNow`), còn khung giờ trả nguyên `tu_gio`/`den_gio` cho App (đúng thư 09.11: "hợp NGÀY HÔM NAY").
3. Công tắc Giờ vàng mặc định **TẮT** (chủ quán bật ở thẻ). Dòng Giờ vàng: `tu_gio: null`, `den_gio` = giờ kết thúc (HH:mm), `dich: 'menu'`, `tieu_de/phu/chu_nut: ''`.
4. `id` dòng quán gõ = số; dòng tự động = chuỗi `'gio_vang'`. Không có ghi chú nội bộ trong bảng (phiếu không có ô nào như vậy) → không có gì để lộ.
5. Cửa công khai dùng chung trần `giuLuotMenu` (≤ 300 lần / phút / IP) như `/chuong-trinh`; chỉ gọi `layMenuQuay` (có thể chạm SX) khi hôm nay có dòng `dich = 'mon'`.
6. Lỗi lưu: `400 { error, code: 'QUANG_CAO_KHONG_HOP_LE', loi_o: { dong: <số thứ tự từ 0>, truong } }`; mã MỚI này chỉ ở cửa quầy (không thuộc /api/kh, không vào `ma_loi` hợp đồng). Cổng /api/kh không trả mã lỗi mới.
7. Xem trước dải: một dòng `nowrap + overflow hidden + text-overflow ellipsis` rộng 280px (như màn điện thoại) — "…" do trình duyệt cắt, không có con số cứng.

## 3. Ánh xạ nghiệm thu → ca thử (`cong_cu/thu_QCAPP1.js`, mỗi mục ≥ 1 ca; số ca cuối ghi ở `bang_chung_do.txt`)
- A thẻ + quyền + PIN + thanh lưu → nhóm **H** (tĩnh + chạy thật `quangCao.js`) và **A** (quầy: 401 / 403 nhân viên không manage_settings / PIN).
- B1 32 vs 33 ký tự, emoji = 1, đếm ngược → **B**, **H**; B2 độ dài tiêu đề… → **B**; B3 dich + chọn món → **B**/**C**; B4 ngày–thứ–giờ → **B**, **C**; B5 ưu tiên + công tắc → **A**/**C**; B6 xem trước → **H**; B7 câu nhắc NGUYÊN VĂN → **H**.
- C Giờ vàng tự động (có / không: tắt công tắc · bật + đang chạy · bật + chưa chạy · flash bật nhưng không món) → **D**.
- D cửa công khai: không token, đúng trường (so BẰNG danh sách trắng), lọc ngày (sát nửa đêm 23:59:59 / 00:00:00, hai đầu khoảng, thứ T2 / CN), dòng tắt không lộ, món tắt → `menu`, thứ tự, rỗng → `[]`, trần lượt → **C**.
- E máy chủ tự kiểm (không tin màn): từng luật một ca 400, kèm "không ghi gì" → **B**.
- F bảng qua bước 028 (chỉ tạo, chạy lại không lỗi, không UPDATE/DELETE/ALTER), có trong sao lưu, dọn dữ liệu thử không xoá → **F**.
- G hợp đồng v16 → ca mới trong `thu_HOPDONG_KH.js` (khối máy đọc có `/quang-cao` + trường; mục "Ghi chú v16"; dòng nhật ký v16) + gieo 1 dòng cho bài gọi thật.
- H nối vào `kiem_tra_truoc_khi_giao.js` → ca **I**.
- K5 luồng hợp lệ PHẢI không bị chặn: (1) lưu danh sách rỗng (xoá hết) → 200 `data: []`; (2) dòng đúng 32 ký tự / giờ `00:00–23:59` / khung ngày một ngày (`tu = den`) → 200; (3) quản lý có `manage_settings` + PIN đúng → 200; (4) dòng cũ đã lưu khi món sau đó bị tắt — lưu lại danh sách đó vẫn 200 nếu không đổi món? **KHÔNG**: lưu luôn kiểm món "đang bán" → món đã tắt bị 400 (chủ quán chọn lại). Ca ghi rõ; (5) `/gio-vang` giữ nguyên kết quả (so bằng trước/sau trên cùng dữ liệu); (6) các thẻ Cài đặt khác vẫn render (bài thu_BAO1b cũ xanh).
- Đua tranh: hai lần PUT cùng lúc → mỗi lần là một giao dịch; kết quả cuối là MỘT trong hai danh sách nguyên vẹn (ca ghép hai PUT song song, kiểm không lẫn dòng). Không đụng tiền nên không cần ca "hai người bấm" kiểu thu tiền.

## 4. Đường song song (K4) đã/ sẽ rà
`grep` mọi chỗ dựng "giờ vàng đang chạy" (`bat`/`is_flash_now`) → chỉ `/gio-vang` ở kh/index.js (một chỗ) → gom vào `docGioVang()`; mọi chỗ đọc `pos_settings` kiểu khoá `key LIKE` ; mọi mount `/api/kh/*` công khai (3 cửa cùng khuôn `giuLuotMenu`); danh sách `BACKUP_TABLES`; 4 chỗ Settings.jsx liệt kê thẻ (TAB_PERMISSION, NHOM_THE, nút, nhánh vẽ).

## 5. Đột biến (viec/QC-APP-1/dot_bien.py) — chỗ vá → tên
Mỗi luật kiểm một VS- (nới / sai) và một BV- (bỏ): PIN (BV-PIN-BO, VS-PIN-SAU-GHI), độ dài 32 (VS-DAI-33, BV-DAI-BO, VS-DEM-BYTE), dich, món, ngày, giờ, lọc ngày (VS-NGAY-DAU/CUOI, VS-THU-LECH), món tắt (BV-MON-TAT), lộ dòng tắt, Giờ vàng, trần lượt, giao diện (BV-UI-*) — bảng đầy đủ ghi vào `trang_thai.md` khi làm.

## 6. Ngân sách
~180 dòng máy chủ + ~290 giao diện + ~330 thử (phiếu 180/280/300) — chênh nhẹ vì kiểm 12 luật; nếu vượt > 15% sẽ cắt ca trùng.

## 7. Chỉnh sau khi agent phụ soát (13.11)
- Thêm vào việc: mount `app.use('/api/pos/quang-cao', …)` ở `server/index.js` (trong Phạm vi, kế hoạch quên nhắc).
- K5(4) ở mục 3 viết rối → sửa: lúc LƯU máy chủ chỉ kiểm món **tồn tại** (có dòng `pos_products` đúng `ma`), KHÔNG đòi đang bán → dòng cũ có món sau đó bị tắt vẫn lưu lại được (ca "phải 200"); lúc ĐỌC (cửa App) món không còn bán được → `dich: 'menu'`, `ma_mon: null`. Ô chọn món ở thẻ chỉ liệt kê món đang bán; món đã tắt hiện "(món đã tắt)".
- §4 sai: "giờ vàng đang chạy" còn dựng ở `utils/manKhach.js:200` và `routes/orders.js:587`. Phiếu cấm đổi luật Giờ vàng → chỉ DÙNG LẠI vị từ `bat` của `/gio-vang` (gom `docGioVang()`), không sửa hai chỗ kia; ghi Phát hiện.
- `bay_gio` = `getNow()`; bảng 028 không dùng `DEFAULT CURRENT_TIMESTAMP` (thu_GIOVN1 M1/M5); `pos_quang_cao` phải có trong `BACKUP_TABLES` (thu_SAOLUU2 D2) và KHÔNG vào `BANG_KHONG_KHOI_PHUC`.
- Thêm ca: PUT rồi GET khớp (lưu xong tải lại), xoá dòng vắng mặt, giờ 23:00–01:00 → 400, giờ bằng nhau → 400, nút ▲▼ và `loi_o` → ô (nhóm H), QuangCao.jsx phải có `await tai()` sau lệnh lưu (mẫu thu_BAO1b), không `fetch` trần (NGUONG_FETCH).
