# GIAO-3 — Ahamove sau lượt thử 16–18.11: Đối soát không kẹt, "Thực thu" đúng, phí Ahamove không về 0, lý do thất bại + hàng trả về quán, hộp lý do thay hộp thoại trình duyệt

<!-- Phiếu do chat POS soạn 18.11.2026 16:20 (bàn 40, main c8d0c7d0). Máy: Claude Code · OPUS (đụng số Đối soát + cửa tin báo công khai).
     Việc giao hàng / báo cáo chỉ đọc (không đổi tiền khách, ví, điểm, cách xác thực) → KHÔNG chờ duyệt kế hoạch (như GIAO-2: chủ quán cần
     chạy thử F1–F2); CÓ soát bảo mật (cửa tin báo công khai, chữ từ Ahamove hiện lên màn).
     Nguồn — Project `claude/BAO_CAO_THU_AHAMOVE.md` (chat THỬ AHAMOVE, cập nhật 18.11 12:30), bản thử Ahamove:
       - D4-GHICHU: HD0003 chuyến 26SOIRTE giao thất bại 12:22:31, lý do Ahamove "Người nhận đặt hàng sai địa chỉ" → POS đúng "Giao không thành công ·
         Giao lỗi", không tự hoàn tiền, nút "Đóng thẻ" (luật 02.11). THIẾU: không hiện lý do; 12:23:40 hàng về quán (RETURNED) → bấm "Tải lại" POS không đổi.
       - D-PHI-1: sau ACCEPTED, chi tiết đổi "phí Ahamove 16.000đ" → "0đ (quán dư 16.000đ)". Gặp ở HD0002 (chuyến -3, -4) và HD0003.
       - F-LOI-1: 17.11 ~14:58 tab "🧾 Đối soát" kẹt "Đang đối soát…" > 1 phút (cả ngày 16/11); tab "Hàng ngày" ra số ngay.
         18.11 16:05 thử lại: VẪN kẹt ~40 giây. ĐÍNH CHÍNH 17:10: lúc đó máy chủ VẪN chạy kho Tokyo — Render chỉ áp biến kho Virginia ở lần triển khai
         18.11 16:24 (17.11 chỉ Save + Resume). Kho xa làm chậm thêm, nhưng D vẫn bắt buộc: đo bằng độ trễ giả lập, không dựa vào vị trí kho.
       - F-LOI-2 (bổ sung 18.11 16:20, TIỀN — hiển thị): Quản lý › Báo cáo › "Hàng ngày" 18/11 (một đơn HD0003: món 30.000 + phí giao 16.000, tiền mặt 46.000):
         Doanh thu 46.000 · Tiền mặt 46.000 · Phí ship 16.000 · **Thực thu 62.000** (đúng phải 46.000). Kèm "Tổng nạp 3.000đ" trong ngày — chat POS kiểm riêng.
         Chat đọc: client/src/pages/Reports.jsx ~237 màn TỰ TÍNH `total_revenue − total_discount + total_shipping`; server/routes/reports.js ~35–40
         `total_revenue = SUM(total)` mà `total` đã trừ chiết khấu + cộng phí giao → phí giao cộng HAI lần, chiết khấu trừ HAI lần. Trái LUAT §2 "quy tắc
         tiền chỉ ở máy chủ". Hàm có sẵn: server/utils/doiSoat.js `soSach` ~153 trả `tien_vao` (tiền mặt ròng + chuyển khoản ròng).
       - D-WEBHOOK-0: 5 tin HTTP 0 (17.11 11:46:17, 14:52:03; 18.11 12:21:04, 12:22:31 tin COMPLETED, 12:23:40 RETURNED). Tin FAILED cùng giây 12:22:31 → 200.
         Nguyên nhân CHƯA rõ: cửa tin báo đã trả lời ngay (GIAO-2); mỗi yêu cầu đã có dòng log "giờ | POST /api/giao-hang/ahamove-bao" (server/index.js
         ~88). Chat đang xin chủ quán nhật ký Render các giờ đó. Việc này KHÔNG đoán nguyên nhân; chỉ làm cho tin lỡ không gây sai (đọc lại phủ cả hàng trả về, B).
       - E-GD-1 (GIAO-3 cũ): huỷ chuyến dùng window.prompt; lý do trống thì im lặng.
     Chat đọc main c8d0c7d0 (số dòng xấp xỉ, máy grep lại):
       - server/utils/ahamove.js tomChuyen ~98–105: `phi: so(o.total_price)`; không đọc `sub_status`, không đọc `path[1].fail_comment`.
       - server/utils/giaoHang.js trangThaiQuan ~371: COMPLETED + diem_giao FAILED → 'giao_loi'. capNhatTuAhamove ~375: chỉ áp cho thẻ
         tim_xe / doi_tai_xe / dang_giao; câu UPDATE ~408 `phi_that = COALESCE(?, phi_that)` — Ahamove trả 0 thì GHI ĐÈ 0 (D-PHI-1); `loi` = 'Giao không thành công'
         cố định (không lý do). nhanTinBao ~422: khoá chống lặp `phu = diem_giao|SĐT tài xế` → tin RETURNED (status vẫn COMPLETED, path FAILED, cùng tài xế)
         bị coi là "tin lặp". danhSach ~462: chỉ đọc lại tim_xe / doi_tai_xe / dang_giao.
       - Tài liệu Ahamove (developers.ahamove.com › Order Status Flow; mẫu chi tiết đơn): `status` COMPLETED có `sub_status` IN_RETURN (đang trả về) / RETURNED
         (đã trả về người gửi); `path[i].status` COMPLETED / FAILED; `path[i]` có `fail_comment`, `fail_time`, `return_time`. Phí: có `total_price`, tài liệu
         nhắc "total fee" trước khuyến mãi — tên trường phí sau khi nhận chuyến CHƯA kiểm trên dữ liệu thật.
       - client/src/components/DoiSoat.jsx ~33: `api.get('/reports/doi-soat…')` không có hạn chờ; server/utils/doiSoat.js chayDoiSoat ~341: chạy TUẦN TỰ mọi
         bất biến (await trong vòng for), nhiều phép quét toàn sổ.
       - client/src/pages/GiaoHang/index.jsx ~89, ~96, ~102: ba window.prompt (đóng thẻ, huỷ chuyến, huỷ / từ chối đơn giao).
     Song song: KHO-3a (Opus, chưa chạy) được sửa giaoHang.js phần HUỶ ĐƠN trả kho → việc này CẤM đụng các hàm huỷ (mục Cấm). BO-MAN-CU-1 (PR #100)
     không đụng file nào của việc này. Nâng cấp dữ liệu (nếu cần) lấy số kế tiếp trên main; ai gộp sau thì đổi số khi ghép main. -->

## Mục tiêu
**Ưu tiên 1 (đang chặn F1–F2 của chat thử):** tab Đối soát ra số trong vài giây, không bao giờ treo; ô "Thực thu" của báo cáo Hàng ngày là số tiền thật
quán nhận (một nguồn với Đối soát); phí Ahamove không tự về 0.
Nhân viên nhìn màn Giao hàng biết chuyện gì đã xảy ra với một chuyến giao lỗi: Ahamove nói lý do gì, hàng đang trên đường về hay đã về quán. Phí Ahamove
trên thẻ và ở Đối soát luôn là số quán thật sự trả, không tự về 0 sau khi tài xế nhận. Tab Đối soát không bao giờ treo mãi "Đang đối soát…". Nhập lý do
(đóng thẻ, huỷ chuyến, huỷ đơn giao) bằng hộp của POS, lý do trống thì báo rõ. Làm ngay: đang chặn chat thử Ahamove chạy F1–F2 trước khai trương.

## Nghiệm thu

### A. Lý do giao thất bại (D4-GHICHU phần 1)
- A1 Ahamove báo giao thất bại (COMPLETED + path[1] FAILED) có `fail_comment` → thẻ hiện "Giao không thành công: <lý do Ahamove>" ở thẻ và chi tiết.
  Không có lý do → "Giao không thành công" như cũ. Lý do cắt ≤ 200 ký tự, chỉ là chữ (React hiện chữ thường, không chèn HTML).
- A2 Lý do giữ nguyên sau Tải lại, sau khởi động lại máy chủ (lưu ở kho), và sau các lần đọc lại tiếp theo (không bị ghi đè thành câu cố định).
- A3 Thẻ "Huỷ khi tài xế đã lấy hàng" (CANCELLED khi dang_giao) giữ câu cũ; có `cancel_comment` thì nối vào sau dấu ":".

### B. Hàng trả về quán (D4-GHICHU phần 2)
- B1 Thẻ giao_loi: Ahamove `sub_status` IN_RETURN → thẻ thêm dòng "Đang trả hàng về quán"; RETURNED → "Hàng đã về quán" + giờ (`return_time` nếu có,
  không thì giờ POS biết). Trạng thái thẻ VẪN là giao_loi: nút "Đóng thẻ" như cũ, KHÔNG đụng tiền / đơn / kho (luật 02.11, Q6 06.11).
- B2 Tin báo RETURNED tới (cùng status COMPLETED, cùng điểm giao FAILED, cùng tài xế với tin FAILED trước) → được áp, KHÔNG bị chống lặp bỏ qua
  (khoá chống lặp phải phân biệt sub_status). Tin lặp thật (cùng sub_status) vẫn bỏ qua.
- B3 Tin RETURNED bị lỡ (HTTP 0, như 12:23:40) → màn Giao hàng tự đọc lại thẻ giao_loi CHƯA "đã về quán" (như đọc lại thẻ đang chạy: theo nhịp, nút
  Tải lại hỏi ngay) → lên "Hàng đã về quán". Thẻ đã về quán hoặc đã đóng → KHÔNG gọi Ahamove nữa (không tốn lượt gọi mãi).
- B4 Ca hợp lệ không đổi (K5): giao xong (COMPLETED + COMPLETED) vẫn 'xong', không thêm dòng trả hàng; thẻ xong / huỷ / đã đóng không bị đọc lại;
  đổi tài xế, tìm lại tài xế, huỷ chuyến giữ đúng hành vi GIAO-1 / GIAO-2 (thu_GIAO1, thu_GIAO2 xanh).

### C. Phí Ahamove không về 0 (D-PHI-1)
- C1 Chuyến đã có phí > 0 (lúc gọi xe) → đọc lại / tin báo trả phí 0, rỗng hoặc không phải số → `phi_that` và `chenh` GIỮ nguyên. Ca: 16.000đ, đọc
  lại ACCEPTED trả total_price 0 → thẻ vẫn "phí Ahamove 16.000đ", không "quán dư".
- C2 Ahamove trả phí MỚI > 0 khác số cũ (vd phụ phí) → cập nhật như cũ (`chenh` tính lại đúng).
- C3 Lấy phí theo MỘT hàm trong ahamove.js (tomChuyen) — một quy tắc một chỗ; kế hoạch ghi rõ thứ tự trường đọc (total_price, và trường phí khác nếu
  tài liệu / dữ liệu cho thấy). Ghi log MỘT dòng khi phí đọc về khác phí đang có: `[GIAO] phi <mã chuyến> <trường>=<số> …` (chỉ số tiền + tên trường,
  không SĐT / tên / địa chỉ) để chat thử đối chiếu trên bản thử.
- C4 Đối soát (doiSoatGiao) dùng `phi_that` đã giữ đúng → F2 ra phí thật. Đơn thử cũ (HD0002, HD0003) đã lưu 0: KHÔNG sửa dữ liệu cũ (đơn thử, dọn
  trước khai trương) — ghi một dòng Phát hiện.

### D. Đối soát không kẹt (F-LOI-1)
- D1 Đo: dựng kho giả lập có độ trễ mỗi câu (vd 40 ms và 150 ms, như Render ↔ Turso Virginia / Tokyo) với dữ liệu cỡ quầy chạy 30 ngày; ghi vào
  trang_thai.md số câu đọc và thời gian `chayDoiSoat` kiểu ngày / tuần / tháng TRƯỚC khi sửa.
- D2 Mục tiêu BẮT BUỘC: kiểu ngày ≤ 5 giây ở 40 ms / câu (thật 18.11 16:05 ở Virginia: > 40 giây). Kế hoạch / trang_thai ghi phép nào tốn nhiều câu
  nhất (đếm theo từng bất biến). Giảm (chạy song song các phép CHỈ ĐỌC độc lập, gộp câu lặp…) — kết quả trả về GIỐNG HỆT bản cũ (đối chứng: so
  JSON bản cũ / bản mới trên cùng dữ liệu, mọi kiểu, có đơn lệch thật để bảng đỏ không rỗng). Không đổi phép kiểm nào, không bỏ bất biến nào.
- D3 Màn Đối soát: hết hạn chờ (đặt hằng số có tên, vd 60 giây) → thôi "Đang đối soát…", hiện "Đối soát quá lâu — thử lại hoặc chọn kỳ ngắn hơn" +
  nút Đối soát bấm lại được. Lỗi mạng / 503 KHO_MAT_KET_NOI → câu báo của máy chủ, không treo. Hạn chờ đặt qua `utils/api.js` (không fetch trần).
- D4 Máy chủ ghi log một dòng thời gian mỗi lần đối soát (`[DOISOAT] ngay 2026-11-17 · 1234ms · n câu`) để đo trên Render thật.

### G. "Thực thu" đúng (F-LOI-2)
- G1 Báo cáo Hàng ngày: "Thực thu" do MÁY CHỦ trả (trường mới trong câu trả `/reports/daily` hoặc tương đương), tính bằng ĐÚNG hàm `soSach`
  (`tien_vao.tien_mat + tien_vao.chuyen_khoan` của ngày đó) — cùng số với Đối soát. Màn chỉ hiển thị, KHÔNG cộng / trừ tiền.
- G2 Ca (so SỐ TÍNH TAY): (a) đơn giao món 30.000 + phí giao 16.000, tiền mặt 46.000 → Thực thu 46.000 (gốc 62.000 → đỏ); (b) món 50.000 giảm mã 10.000,
  tiền mặt 40.000 → 40.000 (gốc trừ chiết khấu hai lần → 30.000); (c) đơn trả HẾT bằng tài khoản → 0 (tiền đã vào lúc nạp); (d) đơn huỷ trong ngày → không
  tính; (e) đơn nạp tiền mặt → có tính (giống soSach). Đột biến: đưa lại công thức cũ trên màn / bỏ trường máy chủ → BẮT.
- G3 Dưới ô ghi một dòng nhỏ "= tiền mặt + chuyển khoản thật nhận". Giữ nguyên các ô Doanh thu / Tiền mặt / Chuyển khoản / Chiết khấu / Phí ship.
- G4 K4: grep client/src mọi chỗ tự tính tiền từ `total_revenue` / `total_discount` / `total_shipping` / `total_shipping_fee` → trong Phạm vi thì sửa theo
  G1, ngoài Phạm vi ghi Phát hiện.

### E. Hộp lý do thay window.prompt (E-GD-1)
- E1 Đóng thẻ, huỷ chuyến Ahamove, huỷ / từ chối đơn giao: mở hộp nhập lý do của POS (giữ đúng câu hỏi hiện nay), nút Xác nhận / Thôi.
- E2 Lý do < 3 ký tự (máy chủ đã chặn LY_DO_BAT_BUOC) → hộp báo ngay dưới ô, không gửi; bấm Thôi → không gửi gì, không báo lỗi.
- E3 Lỗi máy chủ (409, 403…) hiện trong hộp / thanh lỗi như hiện nay — không im lặng.
- E4 grep `window.prompt|window.confirm|alert(` trong client/src/pages/GiaoHang → 0.

### F. Chung
- F1 thu_GIAO1, thu_GIAO2, thu_DOISOAT1 và mọi bài cũ xanh; bài mới `cong_cu/thu_GIAO3.js` đỏ trên gốc ở A1, B2, B3, C1, D3, E4, G2 (không miễn bài thử đỏ).
- F2 Ghi 1–3 thao tác cho chat thử / chủ quán trên điện thoại (Hàng ngày 18/11 Thực thu 46.000; Tải lại thẻ HD0003 → thấy lý do + "Hàng đã về quán"; tab Đối soát ra số; huỷ chuyến
  để trống lý do → hộp báo).

## Phạm vi
- viec/GIAO-3/**
- server/utils/ahamove.js
- server/utils/giaoHang.js
- server/routes/giao-hang.js
- server/utils/doiSoat.js
- server/routes/reports.js
- server/nang_cap/*_giao_tra_hang.js
- client/src/pages/GiaoHang/**
- client/src/components/DoiSoat.jsx
- client/src/pages/Reports.jsx
- client/src/utils/api.js
- client/dist/**
- cong_cu/thu_GIAO3.js
- cong_cu/thu_GIAO1.js
- cong_cu/thu_GIAO2.js
- cong_cu/thu_DOISOAT1.js
- kiem_tra_truoc_khi_giao.js

## Ngân sách
~170 dòng máy chủ + ~130 dòng giao diện + ~400 dòng thử. Vượt 1,5 lần phải giải thích.
**Phương án đơn giản nhất đã xét:** lý do + trạng thái trả hàng: thêm tối đa 2–3 cột vào `pos_giao_chuyen` (vd `ly_do_loi`, `tra_hang`, `tra_hang_luc`)
bằng một bước nâng cấp — không thêm trạng thái thẻ mới (giao_loi đang được đóng thẻ / chặn huỷ đơn kiểm ở nhiều chỗ, thêm trạng thái là phải sửa mọi chỗ đó).
Phí: một vế "chỉ nhận số > 0" ở tomChuyen / câu UPDATE. Đối soát: hạn chờ + log đo trước; chỉ tối ưu khi số đo vượt ngưỡng D2.

## Đổi cấu trúc DB
có — chỉ THÊM cột vào `pos_giao_chuyen` (lý do thất bại, trạng thái hàng trả về, giờ về quán) bằng một bước `server/nang_cap/NNN_giao_tra_hang.js`
(NNN = số kế tiếp trên main lúc làm). Không xoá / đổi tên cột. Sao lưu tự động (SAOLUU-2) phải phủ cột mới — thu_SAOLUU2 xanh.

## Thư viện mới
không

## Soát bảo mật
có — cửa tin báo Ahamove công khai (khoá chống lặp đổi), chữ từ Ahamove (fail_comment, cancel_comment) hiện lên màn quầy, log mới không được chứa
SĐT / tên / địa chỉ / khoá.

## Cấm
- Mặc định của mẫu phiếu (không sửa .claude/, không merge, không tạo PR, không đụng main, chỉ push `viec/GIAO-3`, không sửa sổ việc).
- KHÔNG sửa trong giaoHang.js các hàm vùng KHO-3a: `kiemHuyDonGiao`, `chotHuyGiao`, `xoaDonGiao`, `dongChuyenKhiHoan`, `ghiHangHong` và đường huỷ đơn
  trong orders.js — huỷ đơn / trả kho không thuộc việc này.
- KHÔNG đổi luật tiền giao lỗi: không tự hoàn tiền, không đụng đơn / ví / két khi Ahamove báo thất bại hay trả hàng (chủ quán 02.11, 06.11).
- KHÔNG đổi cách xác thực cửa tin báo (khoá `AHAMOVE_KHOA_BAO`, trả 200 ngay — GIAO-2).
- KHÔNG đổi phép kiểm / bất biến của Đối soát; chỉ đổi cách chạy (song song, gộp) với đối chứng giống hệt.
- KHÔNG đổi `soSach` / `tongHop` (cách tính tiền vào) — G chỉ GỌI hàm có sẵn.
- KHÔNG sửa biến môi trường Render, không gọi Ahamove thật.
