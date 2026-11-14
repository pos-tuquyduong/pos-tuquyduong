# KH-NAP-1 — Khách tự nạp tiền trên App (dòng nạp trong đơn App, `GET /goi-nap`, `GET /vi`) + thẻ hạng / nạp CHỈ trả bằng tiền thật ở quầy và App; hợp đồng `/api/kh` v17

<!-- Phiếu do chat soạn 14.11.2026 (bàn 37, sổ v66, main 1a71424). Việc [T] (tiền + ví + cửa /api/kh) — Opus làn 2, CÓ kế hoạch chủ quán duyệt, CÓ soát bảo mật.
     Nguồn — chủ quán: 02.11 khách tự nạp trên App bằng QR + lịch sử ví, TRƯỚC khai trương · 09.11 gộp NAP-2 vào đây; giỏ không pha chế bán mọi giờ
     (gioCanPhaChe của KH-THE-1); đơn chỉ nạp tự "xong" khi tiền về · 10.11 nạp chỉ mua bằng tiền thật (không trừ tài khoản, không mã) · 14.11 thẻ hạng
     KHÔNG trả bằng số dư tài khoản — cả tiền nạp, thưởng nạp, ví mẹ — ở quầy và App, "tránh gian lận vì nạp tiền được cộng tiền thưởng" (thư App KH
     YEU_CAU_APPKH_GUI_POS_14112026.md; App làm KH-THE-2: thẻ mua riêng, chỉ QR). Gộp hai luật vào MỘT việc vì cùng một chỗ chặn · 14.11 (chủ quán,
     sau khi chat hỏi): mua trên App chỉ thẻ / chỉ nạp mà tiền về MUỘN vẫn phải ĐỦ quyền lợi như tiền về đúng hạn — đổi luật KH-THE-1 09.11.
     Chat đọc main 1a71424:
       - Nạp ở quầy (NAP-1) = taoDon với `goi_nap_id`: orders.js ~226–240 chặn (đơn riêng NAP_KHONG_GOP; không trừ tài khoản / mã / nợ / phí giao
         NAP_CHI_TIEN_MAT_QR), ~559–577 dòng hàng product_id ≤ ID_NAP_TU, ~955 0 điểm, ~1058 ghiVi topup hai ngăn, ~1589 / ~1801 không huỷ / xoá;
         giuCho.taoPhien ~44 chặn nạp trừ tài khoản ngay lúc giữ. Báo cáo, Đối soát, hoàn, sự cố đã theo sqlDonNap / laDonNap (viKhach.js).
       - Đơn App (donApp.js) đi CÙNG taoDon qua phiên: dòng thẻ `{ loai: 'the' }` → membership_buy (KH-THE-1). CHƯA có dòng nạp. GIU_MA (~49) chưa có mã
         nạp → mã quầy bị đổi thành DON_KHONG_HOP_LE.
       - Thẻ hạng: KHÔNG có chặn trừ tài khoản ở đâu (orders.js membership_buy, giuCho.taoPhien, donApp CACH_TRA nhận vi / vi_qr cho đơn có thẻ).
       - Tiền QR về muộn của phiên App (đã huỷ / hết hạn): thanh-toan.js xuLyTienVe → vaoVi (chỉ cộng đúng số tiền vào tài khoản, không đơn,
         không hạng, không thưởng); xác nhận tay phiên App muộn bị chặn PHIEN_APP_KHONG_TAO_LAI (~88). Quầy xác nhận tay muộn thì chotPhien
         kiểu muộn tạo đơn đủ quyền lợi.
       - Hợp đồng v16 mục "Đã hẹn" NAP-2 có GET /goi-nap, POST /nap, GET /nap/:ma, GET /vi. App CHƯA làm phần này (chat kiểm kho APP-KH ea0281e, 14.11)
         → đổi sang dòng nạp trong POST /don (gọn hơn, App dùng lại màn Thanh toán / Theo dõi đơn như KH-THE-2), chat báo App bằng thư 14.11.
     VOUCHER-2 (Opus làn 1) sắp gộp, cùng sửa orders.js / donApp.js / giuCho.js / HOP_DONG_API_KH.md (mang v15) → xem "Gộp trước khi viết code".
     KET-NOI-1 (Opus làn 1, sau VOUCHER-2) có thể chạy song song, cùng đường tạo đơn → xem Cấm. -->

**Chờ duyệt kế hoạch:** viết `viec/KH-NAP-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

**Gộp trước khi viết code:** lúc duyệt kế hoạch, chat gộp main (đã có VOUCHER-2) vào nhánh này cùng lượt ghi phiếu duyệt (commit `GOP-KH-NAP-1 …`).
Nhận lệnh tiếp thì máy `git pull --no-rebase --ff-only origin viec/KH-NAP-1`, đọc lại các file chung trên code mới, chỉnh kế hoạch nếu lệch (ghi
`trang_thai.md`; đổi lớn → câu hỏi, DỪNG) rồi mới viết code. Máy KHÔNG tự gộp main.

## Mục tiêu
Khách nạp tiền vào tài khoản ngay trên App bằng QR (chọn gói → quét → tiền về là số dư tăng, có thưởng nạp như ở quầy) và xem lịch sử tài khoản.
Cùng lúc khoá chặt luật "chỉ trả bằng tiền thật" cho thẻ hạng và nạp tiền ở MỌI chỗ (quầy + App): không ai dùng tiền thưởng nạp để mua thẻ hay nạp vòng.
Khách chuyển tiền muộn (QR đã hết hạn) cho đơn chỉ thẻ / chỉ nạp vẫn được đủ quyền lợi như chuyển đúng hạn.
Không làm đường tiền mới: nạp trên App đi đúng đường nạp của quầy (NAP-1) qua phiên QR sẵn có của đơn App.

## Nghiệm thu

### A. Nạp trên App = một dòng của đơn App (không có cửa `/nap` riêng)
- A1 `POST /gio/bao-gia` và `POST /don` nhận dòng `{ loai: "nap", ma_goi, so_luong? }` trong `mon[]` (`ma_goi` = `ma` của `GET /goi-nap`, số nguyên ≥ 1;
  `so_luong` bỏ hoặc 1; khoá lạ → 400 `YEU_CAU_KHONG_HOP_LE`). Dòng nạp → `goi_nap_id` của CHÍNH đường quầy (`thanDon` → taoDon): giá = `khach_tra` máy chủ
  tra, tiền vào hai ngăn, 0 điểm, không mã bill — KHÔNG viết hàm nạp thứ hai.
- A2 Đơn có dòng nạp chỉ có ĐÚNG một dòng nạp: thêm món / thẻ / dòng nạp thứ hai → 400 `NAP_KHONG_GOP`; gói không có / đang tắt → 400 `GOI_NAP_KHONG_CO`;
  `cach_tra` `vi` / `vi_qr` → 400 `NAP_CHI_TIEN_MAT_QR` (mã quầy giữ tên; nay trả NGUYÊN mã cho App — thêm vào GIU_MA + `routes/kh/loi.js` — thay vì
  `DON_KHONG_HOP_LE`). `ma_giam` gửi kèm → bỏ mã, `ma_giam_loi` (đúng luật báo giá sẵn có, không thêm nhánh). Mọi 4xx = chưa tạo gì (luật 4xx hiện có).
- A3 Báo giá `dong[]` dòng nạp: `{ loai: "nap", ma_goi, ma: null, so_luong: 1, don_gia, thanh_tien }`; `giam[]` rỗng; `tong` = `khach_tra`.
- A4 Giỏ chỉ có nạp: đặt / báo giá MỌI giờ (gioCanPhaChe = không); tiền về đủ → `tien_trinh: "xong"` ngay (như đơn chỉ thẻ).
- A5 Tiền QR về đủ → trong CÙNG giao dịch chốt phiên: đơn nạp + ghiVi topup hai ngăn đúng như quầy; `/toi.so_du_vi` tăng ngay. Báo tiền trùng → một đơn,
  cộng ví một lần. Chưa thu → chưa có tiền.
- A6 **Tiền về muộn vẫn ĐỦ quyền lợi** (chủ quán 14.11 — thay luật KH-THE-1 09.11 "thẻ về muộn chỉ vào tài khoản, khách mua lại"): đơn App CHỈ có dòng nạp
  hoặc CHỈ có dòng thẻ, tiền QR về ĐÚNG số sau khi QR hết hạn hoặc đơn đã huỷ → máy TỰ chốt đơn y như tiền về đúng hạn (cùng chotPhien kiểu muộn mà quầy
  dùng khi xác nhận tay; giá / gói theo thân phiên lúc tạo QR): nạp → cộng đủ tiền nạp + thưởng nạp; thẻ → lên hạng (hạn cộng nối tính từ lúc chốt).
  `GET /don/:ma` của đơn đó thành `xong` như đơn đúng hạn. Không chốt được (gói đã tắt, khách đã có hạng cao hơn, tiền lệch số, hai cổng cùng báo…) →
  như hiện nay: vaoVi / chua_khop, báo rõ quầy + khách. Đơn có đồ uống: KHÔNG đổi (tiền về muộn vẫn vào tài khoản). MỘT vị từ trong xuLyTienVe, không
  đường chốt thứ hai; báo trùng → chốt đúng một lần.
- A7 Huỷ: App huỷ được đơn nạp CHƯA trả (như mọi đơn App). Đơn nạp đã trả: quầy không huỷ / xoá / hoàn (`NAP_KHONG_HOAN` — kể cả đường huỷ đơn App của HUY-1).
- A8 Xem đơn: `GET /don`, `GET /don/:ma` dòng nạp có `loai: "nap"`, `ten` = tên dòng hàng quầy ("💳 Nạp 100.000đ → vào tài khoản 105.000đ"), `ghi_chu` null,
  giống nhau trước và sau khi trả (khuôn KH-THE-1); `so_mon` đếm 1; `hoa_don[]` như đơn nạp ở quầy; `tra[]`, `kenh` như mọi đơn App.

### B. Chỉ trả bằng tiền thật — thẻ hạng (chủ quán 14.11) + nạp (10.11), ở quầy và App
- B1 MỘT vị từ "đơn chỉ trả tiền thật" (đơn có dòng thẻ `membership_buy` HOẶC dòng nạp `goi_nap_id`), dùng ở ĐÚNG hai chỗ đang chặn nạp: `giuCho.taoPhien`
  (lúc giữ — không để phiên giữ ví) và taoDon trong `orders.js` (quầy trả thẳng + lúc chốt phiên). Không thêm chỗ chặn thứ ba.
- B2 Đơn có dòng thẻ mà trừ tài khoản dưới MỌI dạng (`balance_amount` > 0, `parent_balance_amount` > 0, `payment_method` `balance`; phiên `tru_tai_khoan`,
  `tru_tai_khoan_me`, cách `tai_khoan`; App `cach_tra` `vi` / `vi_qr`) → 400 `THE_KHONG_TRA_VI` (tên App đề xuất), lời "Thẻ hội viên chỉ trả tiền mặt (ở quầy)
  hoặc chuyển khoản — không trừ số dư tài khoản". Áp CẢ ĐƠN (kể cả đơn có thêm đồ uống / gói). App nhận nguyên mã (GIU_MA + `routes/kh/loi.js`).
- B3 Nạp: luật NAP-1 ở quầy giữ nguyên, mã `NAP_CHI_TIEN_MAT_QR` giữ nguyên (bài NAP-1 đang canh).
- B4 Đơn thẻ đã trả bằng số dư TRƯỚC việc này: giữ nguyên dữ liệu; huỷ / hoàn đơn cũ đó theo luật cũ.
- B5 Màn Bán hàng mới (`BanHangMoi.jsx`, `tinh.js` `lyDoKhongTru`): giỏ có thẻ → tắt "Trừ tài khoản" (cả của mẹ) y như giỏ nạp, câu ngắn "Thẻ hội viên chỉ
  trả tiền mặt hoặc chuyển khoản". Màn Bán hàng cũ: KHÔNG sửa (BO-MAN-CU-1 sẽ bỏ) — máy chủ chặn, màn hiện lời báo.

### C. `GET /goi-nap` (không token)
- C1 `data[] { ma, ten, tra, vao }` — gói đang bật, cùng thứ tự quầy (thu_tu, khach_tra, id); gói tắt không hiện. Dùng chung trần ≤ 300 lần / phút mỗi IP
  với `/menu`.

### D. `GET /vi` — lịch sử tài khoản (token)
- D1 `?trang=N` (20 dòng / trang, mới trước) → `trang, con_nua, data[] { ngay, loai, so_tien, thuong, ma_don, ghi_chu }` — chỉ ví của CHÍNH SĐT trong token;
  CHỈ các dòng làm đổi số dư (dùng danh sách trắng `LOAI_TINH_VAO_VI` của wallets.js — không lập danh sách thứ hai).
- D2 `loai`: `nap` (nạp gói ở quầy / App, nạp tay; `thuong` = phần thưởng nạp) · `tra_don` · `hoan_don` (hoàn / đền) · `dieu_chinh` (điều chỉnh / trừ tay).
  Kế hoạch liệt kê MỌI `type` đang ghi vào `pos_balance_transactions` (grep ghiVi) và ánh xạ từng cái (Q-B). `qua_chao_mung` / `qua_het_han` để QUA-1 thêm.
- D3 `so_tien` có dấu (+ vào, − ra); `thuong` có dấu (phần thuộc ngăn thưởng); `ngay` giờ VN như mọi trường giờ.
- D4 Không lộ dữ liệu người khác / nội bộ: `ma_don` = mã mở được bằng `GET /don/:ma` của CHÍNH khách (mã đơn App hoặc mã bill); dòng ví mẹ trả đơn của người
  khác → `ma_don` null, không tên / SĐT người đó; `ghi_chu` là câu cố định POS dựng theo `loai` — KHÔNG đưa ghi chú nhân viên gõ tay.

### E. Quầy
- E1 Màn Đơn App: đơn nạp hiện nhãn (vd "💳 Nạp … — đã vào tài khoản, không pha"), không nút Đang làm / Xong — như đơn chỉ thẻ.
- E2 Báo cáo / Đối soát / in: đơn nạp App theo đúng luật đơn nạp hiện có (sqlDonNap: không là doanh thu, nhóm nạp ở Đối soát); không phiếu pha chế, không tem ly.

### F. Hợp đồng `/api/kh` v17
- F1 Bảng cửa thêm `GET /goi-nap`, `GET /vi`; dòng nạp trong `POST /gio/bao-gia` / `POST /don`; "Ghi chú v17" ghi đủ A–D; "Ghi chú v13" thêm câu "dòng thẻ
  chỉ `cach_tra: "qr"`" + mã `THE_KHONG_TRA_VI`, sửa câu "tiền về sau khi huỷ / hết hạn → không hạng" theo A6; mục "Đã hẹn": chuyển phần NAP-2 lên bảng, BỎ `POST /nap` / `GET /nap/:ma` (thay bằng dòng nạp). Khối máy đọc
  + mã lỗi mới (`THE_KHONG_TRA_VI`, `NAP_KHONG_GOP`, `NAP_CHI_TIEN_MAT_QR`, `GOI_NAP_KHONG_CO`); nhật ký v17. Số v17: v15 là VOUCHER-2, v16 là QC-APP-1.

### G. Kiểm
- G1 Bài MỚI `cong_cu/thu_KHNAP1.js` ĐỎ trên gốc, khoá A–F, ít nhất: nạp QR → tiền về → số dư tăng đúng hai ngăn, 0 điểm; báo tiền trùng → cộng một lần;
  nạp `vi` / `vi_qr` → `NAP_CHI_TIEN_MAT_QR`; nạp + món → `NAP_KHONG_GOP`; thẻ + `vi` / `vi_qr` ở App → `THE_KHONG_TRA_VI`; thẻ + trừ tài khoản / ví mẹ / phiên
  PIN ở quầy → `THE_KHONG_TRA_VI`; thẻ + tiền mặt / CK vẫn bán được; đồ uống trả số dư vẫn được; nạp đặt được ngoài giờ; nạp về muộn → đơn nạp đủ thưởng;
  thẻ về muộn → lên hạng; đồ uống về muộn → vẫn chỉ vào tài khoản; về muộn báo trùng → một lần; `/vi` không lộ ví mẹ / ghi chú tay; `/goi-nap` không có gói tắt. Nối vào `kiem_tra_truoc_khi_giao.js`; đột biến có bắt.
- G2 Bài cũ có ca bán thẻ bằng số dư hoặc ca "thẻ App về muộn → không hạng" (chat đã thấy: thu_KHTHE1.js đường `vi` / `vi_qr` + tiền về sau khi
  huỷ, thu_P2223.js D5, thu_P24.js I1c, thu_HD1.js A19, gia_lap/kich_ban.js KB22 — máy grep đủ): luật đổi CÓ CHỦ Ý (chủ quán 14.11) → sửa ĐÚNG ca đó:
  phần trả thẻ bằng số dư thành ca CHẶN (mong `THE_KHONG_TRA_VI`), ca về muộn mong CÓ hạng; phần còn lại của ca (huỷ, hoàn, hạng, hoá đơn…) chạy tiếp với
  đơn trả tiền mặt / CK — bài sửa vì thế ĐỎ trên gốc (A11). Mỗi ca sửa ghi `trang_thai.md`. KHÔNG ghi vào
  `## Bài thử cũ sửa`. Ca đỏ vì lý do khác → DỪNG hỏi.
- K5 Không đổi: nạp ở quầy, đặt đồ uống trên App, đơn chỉ thẻ trả QR, trả số dư cho đồ uống / gói trả trước, ví mẹ cho đồ uống, các cửa `/api/kh` khác.

## Câu hỏi kế hoạch (trả lời trong ke_hoach.md, chủ quán duyệt)
- Q-A **Tiền về muộn (A6):** chỗ đặt vị từ "đơn App chỉ thẻ / chỉ nạp" trong xuLyTienVe + cách gọi chotPhien kiểu muộn (khoá chống trùng, hai cổng, phiên
  đã huỷ do khách bấm huỷ); xác nhận tay phiên App muộn (PHIEN_APP_KHONG_TAO_LAI ~88) giữ chặn hay mở cho đơn chỉ thẻ / nạp — đề xuất cách ít dòng nhất.
- Q-B **Bảng ánh xạ `type` → `loai` của `/vi` (D2)** + câu `ghi_chu` từng loại + cách nhận ra dòng ví mẹ trả đơn của người khác.
- Q-C **Danh sách bài cũ phải sửa ca (G2)** — file + tên ca, trước khi sửa.
- Q-D **Chỗ đặt `GET /vi`** (file mới `server/utils/lichSuVi.js` hay trong routes/kh/index.js) — chọn chỗ ít đụng file VOUCHER-2 / KET-NOI-1 nhất.

## Phạm vi
- viec/KH-NAP-1/**
- server/utils/donApp.js
- server/utils/giuCho.js
- server/utils/viKhach.js
- server/utils/lichSuVi.js
- server/routes/kh/index.js
- server/routes/kh/loi.js
- server/routes/orders.js
- server/routes/goi-nap.js
- server/routes/wallets.js
- server/routes/thanh-toan.js
- client/src/pages/BanHang/BanHangMoi.jsx
- client/src/pages/BanHang/ThuTien.jsx
- client/src/pages/BanHang/tinh.js
- client/src/pages/DonApp.jsx
- client/dist/**
- HOP_DONG_API_KH.md
- cong_cu/thu_KHNAP1.js
- cong_cu/thu_*.js
- cong_cu/gia_lap/kich_ban.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_KHNAP1.js` ĐỎ trên gốc: chưa có dòng nạp trong đơn App, `GET /goi-nap`, `GET /vi`; thẻ hạng vẫn trả được bằng số dư ở quầy và App.

## Ngân sách
~230 dòng máy chủ + ~20 dòng giao diện quầy + ~450 dòng thử (bài mới) + sửa ca bài cũ (G2).
**Phương án đơn giản nhất đã xét:** nạp = MỘT dạng dòng mới của đơn App (như dòng thẻ) đi đúng đường `goi_nap_id` của taoDon qua phiên QR sẵn có — giá, hai
ngăn, 0 điểm, không hoàn, báo cáo, Đối soát đã có từ NAP-1; không cửa `/nap` riêng, không bảng mới; App dùng lại Thanh toán / Theo dõi đơn. "Chỉ trả tiền thật"
= MỘT vị từ cho dòng thẻ + dòng nạp, đặt đúng hai chỗ đang chặn nạp. Lịch sử ví đọc thẳng sổ ví đang có.

## Đổi cấu trúc DB
không
<Cần thêm bảng / cột thì DỪNG hỏi — số bước 029 giữ cho việc này (026 VOUCHER-2, 027 ND-API-1, 028 QC-APP-1); KET-NOI-1 lấy số sau.>

## Thư viện mới
không

## Soát bảo mật
có — tiền + ví (chặn trừ tài khoản, cộng ví khi tiền về); cửa `/api/kh` khách gọi (`GET /vi` là dữ liệu ví của khách).

## Cấm
- Không làm quà chào mừng (QUA-1), thẻ quà (QUA-TANG-1), đổi điểm, giao hàng. Không đổi luật nạp ở quầy ngoài việc dùng chung vị từ; không đổi tên mã cũ.
- Không sửa màn Bán hàng cũ (`Sales.jsx`).
- `orders.js`, `giuCho.js`: chỉ đụng khối chặn nạp / thẻ (KET-NOI-1 làn Opus 1 có thể chạy song song trên đường tạo đơn) — cần sửa chỗ khác → câu hỏi, DỪNG.
- Không tự gộp main (chat gộp lúc duyệt kế hoạch). Mặc định: không sửa .claude/, không merge, không tạo PR, không đụng main, chỉ push đúng
  `git push -u origin viec/KH-NAP-1`, không sửa sổ việc, không chạy patch_*.py. Đẩy nhánh sau mỗi bước lớn (máy mây có thể bị thu hồi).
