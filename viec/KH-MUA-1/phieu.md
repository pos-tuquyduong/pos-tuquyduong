# KH-MUA-1 — App KH đặt đơn nhận tại quán: báo giá giỏ · tạo đơn trả QR payOS / ví + PIN / ví + QR · đơn về quầy kèm chuông · tiến trình · huỷ đơn chưa trả

<!-- Phiếu do chat soạn 31.10.2026. Việc [T] (tiền + đơn) — Opus làn 1, lập kế hoạch, DỪNG chờ duyệt. Nền: main sau sổ v49 (KH-API-3 #54,
     KHACH-CK-1 #55 đã gộp). Chủ quán chốt 30.10 (QUYET_DINH_CHU_QUAN.md mục App KH): đặt đơn online TỪ KHAI TRƯƠNG; máy chủ tính lại toàn bộ
     tiền bằng CÙNG hàm quầy; đơn chỉ về quầy khi đã trả đủ; âm thanh báo đơn: mọi máy đăng nhập thấy đơn, công tắc "Máy ở quán" từng máy quyết
     kêu chuông + cài đặt bật/tắt, tiếng, âm lượng. Đã hứa App KH (TRA_LOI_POS_31102026.md mục 3, TRA_LOI_POS_31102026_b.md mục 2–5) — tên
     cửa / trường dưới đây là bản ĐÃ BÁO; đổi tên phải có lý do, ghi `## Câu hỏi`.
     Hiện trạng chat đọc 31.10 trên main 4b52370:
     - Tính tiền: orders.js `taoDon(req, res, { chiTinh, tinhThu })` (~171); POST /orders/tinh-thu (~1265, TRUONG_TINH_THU) đi đúng taoDon
       chế độ chỉ tính, trả chiTiet { subtotal, flash_discount, tier_discount, discount_amount, ... } + `maLoi` khi mã không áp (~550).
     - Phiên thanh toán: utils/giuCho.js `taoPhien(b, nguoi)` (~32: cach payos | ck_tay | tien_mat | tai_khoan; tru_tai_khoan giữ
       min(khả dụng, tổng) ~56; CACH_KHONG_KHOP / SO_DU_KHONG_DU ~59–60; PIN kiểm ngoài giao dịch; HAN_PHUT 10; QR payOS hết hạn cùng
       het_han), `chotPhien` (~87) — MỌI lối chốt đi qua đây, gọi taoDon tạo đơn thật. Webhook payOS: thanh-toan.js ~128 (`suKien(tx)` ghi
       trong giao dịch chốt). Bảng pos_phien_thanh_toan (database.js ~970).
     - Cửa App: server/routes/kh/index.js — /gio-hoat-dong (utils/gioHoatDong.js: dang_mo, nhan_don), /menu (layMenuQuay + monKhach,
       con_hang ~40), GET /don + /don/:ma (~212–235, chỉ pos_orders theo customer_phone + code; mon[] chưa có `ma`), lỗi ở kh/loi.js.
       Hợp đồng HOP_DONG_API_KH.md v3 (KH-SP-1 đang làm v4 — việc này là **v5**; nếu KH-SP-1 chưa gộp khi việc này xong, ghi `## Câu hỏi`,
       chat gộp main / sắp số).
     - Bước nâng cấp: main có 001–004; KH-SP-1 giữ 005 → bước của việc này là **006** (KHO-2b giữ 007).
     - Màn quầy đang bán thật là màn Bán hàng CŨ (Sales.jsx); màn mới (BanHang/**) đang TẮT ở mọi máy. Báo cáo cho chủ quán theo LUAT §8. -->

**Chờ duyệt kế hoạch:** viết `viec/KH-MUA-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Khách App đặt món nhận tại quán và trả trước (QR payOS, ví + PIN, hoặc ví một phần + QR phần còn lại). Máy chủ tính lại toàn bộ tiền bằng
đúng hàm quầy. Đơn chỉ thành đơn thật (về quầy, kêu chuông) khi đã trả đủ. Khách xem tiến trình; huỷ được đơn chưa trả.

## Nghiệm thu
- A **Báo giá** `POST /gio/bao-gia` (token): thân `{ mon[] { ma, so_luong, ghi_chu }, ma_giam?, cach_nhan: "tai_quan" }` → không ghi gì;
  trả `dong[] { ma, so_luong, don_gia, thanh_tien }, tam_tinh, giam[] { loai, so_tien }, phi_giao (0), tong` — đi ĐÚNG đường tinh-thu /
  taoDon chế độ chỉ tính (một hàm, không công thức thứ hai). `giam[].loai` đúng ba giá trị `ma_giam` · `hang` · `gio_vang`, dòng 0 không
  có; mã không áp → không có dòng `ma_giam` + `ma_giam_loi { code, error }`. `cach_nhan: "giao"` → 400 `CHUA_GIAO` (KH-MUA-2).
- B **Chặn đặt:** ngoài giờ → 400 `NGOAI_GIO`; quán mở nhưng đã ngừng nhận đơn → 400 `QUA_GIO_NHAN_DON` (cùng hàm gioHoatDong, giờ máy
  chủ); món `con_hang === false` → 400 `HET_HANG` (kèm `ma` món); món không bán / không có → 400 `MON_KHONG_BAN`. Áp cho cả báo giá và tạo đơn.
- C **Tạo đơn** `POST /don` (token): cùng thân + `cach_tra: "qr" | "vi" | "vi_qr"`, `pin` (vi, vi_qr), `khoa_gui` (bắt buộc) → dựng phiên
  thanh toán qua `taoPhien` (qr → payos; vi → tai_khoan; vi_qr → payos + tru_tai_khoan). Trả `{ ma_don, tong, giu_vi, con_lai,
  tien_trinh, qr { chuoi, het_han } | null }`. Ví đủ mà chọn vi_qr → `CACH_KHONG_KHOP`; ví thiếu mà chọn vi → `VI_KHONG_DU`; PIN sai →
  `PIN_SAI` (đếm sai như quầy). Trả ví đủ → chốt ngay (đơn thật, `da_tra`). Số tiền App gửi (nếu có) bị bỏ qua.
- D **Luật 4xx (hợp đồng):** MỌI trả lời 4xx của `POST /don` = chưa tạo đơn, chưa giữ / trừ ví — bài thử đếm bảng đơn / phiên / giữ ví
  trước–sau cho TỪNG mã lỗi (kể cả 429 có `thu_lai_sau_giay`).
- E **Chống trùng:** `khoa_gui` 16–64 ký tự `[A-Za-z0-9-]`, nhớ theo khách 24 giờ, duy nhất trong CSDL: cùng khoá + cùng thân → 200 đơn
  cũ `trung: true` (không giữ ví lần hai); cùng khoá thân khác → 409 `KHOA_GUI_DA_DUNG`; thiếu / sai dạng → 400 `KHOA_GUI_SAI`. Lưới
  thứ hai: cùng khách, cùng giỏ (món + SL + ghi chú + mã + cách nhận + cách trả), đơn trước còn `cho_tra`, trong 10 giây → trả đơn đó
  `trung: true`. Hai yêu cầu cùng lúc cùng khoá → đúng một đơn.
- F **Tiến trình** `GET /don/:ma` + `GET /don`: thấy cả đơn App chưa trả; `tien_trinh` `cho_tra` · `da_tra` · `dang_lam` · `xong` ·
  `da_huy` (KH-MUA-2 thêm giao); `mon[]` có `ma`; `cho_tra` → `qr { chuoi, het_han }` (cùng mã lúc tạo), khác → `qr: null`; giờ dạng
  `YYYY-MM-DDTHH:mm:ss` giờ VN. Đơn của khách khác → 404 như không có. QR hết hạn chưa trả → `da_huy`, tiền ví đang giữ trả lại.
- G **Huỷ** `POST /don/:ma/huy` (token): chỉ `cho_tra` → huỷ phiên, nhả giữ ví; đơn đã trả → 400 `DA_TRA_GOI_QUAN`.
- H **Về quầy kèm chuông:** đơn App đã trả hiện ở MỌI máy nhân viên đang đăng nhập (một chỗ nhìn thấy từ mọi màn — huy hiệu số đơn mới +
  danh sách đơn App: mã, giờ, món + ghi chú, tên khách, đã trả bao nhiêu bằng gì); nhân viên bấm "Đang làm" → "Xong" (đổi `tien_trinh`,
  ghi người + giờ). Chuông chỉ kêu ở máy bật công tắc "Máy ở quán" (lưu riêng từng máy, mặc định tắt) + Cài đặt âm thanh: bật / tắt,
  chọn tiếng, âm lượng; kêu một lần mỗi đơn mới, không kêu lại khi tải lại trang. Đơn chưa trả KHÔNG hiện ở quầy.
- I **Tiền về muộn / lệch:** webhook payOS báo tiền về cho phiên đã hết hạn / đã huỷ → đi đúng luồng đối soát hiện có (không tạo đơn
  ngầm, không mất dấu); kế hoạch nêu rõ đơn App hiện gì cho khách lúc đó.
- J **Hợp đồng v5** cùng PR: HOP_DONG_API_KH.md (bảng cửa, khối JSON, mã lỗi, luật 4xx, khoa_gui, tien_trinh) + thu_HOPDONG_KH.js xanh.
- K **K5:** quầy bán / hoàn / ví / điểm / hạng / mã / Giờ vàng / phiên thanh toán quầy / đối soát chạy y như cũ (so số trước–sau);
  App chỉ đặt được khi có token; bộ đếm lượt POST /don theo khách.

## Phạm vi
- viec/KH-MUA-1/**
- server/routes/kh/**
- server/utils/donApp.js
- server/utils/giuCho.js
- server/routes/thanh-toan.js
- server/routes/orders.js
- server/routes/settings.js
- server/nang_cap/**
- HOP_DONG_API_KH.md
- client/src/components/**
- client/src/pages/DonApp.jsx
- client/src/pages/Settings.jsx
- client/src/App.jsx
- client/dist/**
- cong_cu/thu_KHMUA1.js
- cong_cu/thu_HOPDONG_KH.js
- cong_cu/thu_KH1.js
- cong_cu/thu_KHAPI3.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_KHMUA1.js` ĐỎ trên code gốc: bao-gia trả số = tinh-thu cho cùng giỏ (có hạng, mã, Giờ vàng); ngoài giờ / ngừng nhận /
hết hàng → đúng mã, bảng không đổi; POST /don qr → phiên payos + `cho_tra` + qr; vi đủ → đơn thật `da_tra`; vi_qr → giữ ví + QR phần
còn lại; mỗi mã 4xx → đếm bảng trước = sau; khoa_gui gửi lại → cùng đơn, ví giữ một lần; khoá trùng thân khác → 409; hai yêu cầu song
song → một đơn; webhook chốt → đơn thật + hiện ở danh sách quầy; huỷ cho_tra nhả ví; đơn đã trả không huỷ được; GET /don/:ma của
khách khác → 404.

## Ngân sách
~350 dòng máy chủ + ~200 dòng giao diện quầy + ~450 dòng thử.
**Phương án đơn giản nhất đã xét:** đơn App = một dòng bảng mới (bước 006) nối phiên thanh toán sẵn có (taoPhien / chotPhien) — KHÔNG
viết luồng tiền thứ hai; quầy hỏi danh sách đơn App theo nhịp (không thêm websocket / thư viện).

## Đổi cấu trúc DB
có — bước nâng cấp 006: bảng đơn App (mã, khách, phiên, đơn thật, khoa_gui duy nhất theo khách, tiến trình, người / giờ đổi tiến trình).
Chỉ THÊM, chịu được kho thử thiếu bảng (LUAT bài học thu_KHO2a E6b).

## Thư viện mới
không (chuông: tệp âm thanh nhỏ trong client hoặc Web Audio).

## Cấm
- KHÔNG đổi cách tính tiền / hạng / mã / Giờ vàng / ví / điểm / hoàn; KHÔNG viết hàm tính tiền thứ hai cho App.
- KHÔNG làm giao Ahamove (KH-MUA-2), topping / combo (TOPPING-1, COMBO-1a), đổi điểm (P3b) — chỉ để chỗ trống trong hợp đồng.
- KHÔNG tin số tiền / giá App gửi; KHÔNG lưu / log PIN.
- KHÔNG sửa Sales.jsx, client/src/pages/BanHang/** (danh sách đơn App là thành phần riêng); KHÔNG sửa app_kh/**.
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/KH-MUA-1`. Không đụng main, không merge,
  không tạo PR.
