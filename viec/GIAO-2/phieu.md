# GIAO-2 — Tin báo Ahamove: trả lời NGAY (dưới 5 giây), xử lý sau; dự phòng đọc lại phải cập nhật được thẻ

<!-- Phiếu do chat soạn 16.11.2026 (bàn 38, main 1d66c61). Opus làn 2. Việc giao hàng (không đổi tiền, không đổi cách xác thực) → KHÔNG chờ duyệt
     kế hoạch (chủ quán cần chạy thử Ahamove tiếp); CÓ soát bảo mật (cửa công khai).
     Nguồn — chat THỬ AHAMOVE 16.11 (claude/BAO_CAO_THU_AHAMOVE.md, D-LOI-1), bản thử Ahamove: đơn ORD-20261116-HD0002, chuyến 26M7CRQ1.
       - Tin ASSIGNING 13:53:08 → POS 200 (đúng).
       - Tin ACCEPTED 14:04:28 → Ahamove ghi "503 · context deadline exceeded" sau 5,1 giây, gửi 2 lần (14:04:34.190 và .239, cách 49 ms) — cả hai hết giờ.
         Ahamove chờ tối đa 5 giây (Business Portal › Tích hợp › Webhook: "Timeout mặc định 5 giây, endpoint phải trả 2xx trước khi hết thời gian").
       - Sau đó thẻ POS vẫn ở "Đợi tài xế", tới lúc hiện nút "Tìm lại"; không có tên / SĐT tài xế — tức là CẢ dự phòng đọc lại (màn Giao hàng hỏi →
         đọc lại chuyến quá 60 giây) cũng không cập nhật được thẻ trong nhiều phút.
       - Cùng buổi: bấm "Đã nhận tiền" mất 10–12 giây mới xong (C-GHICHU); trưa có lỗi Turso "socket hang up" — máy chủ ↔ kho chậm / chập chờn (KET-NOI-1
         đang làm phần kho; vùng đặt máy Render / Turso chủ quán đang kiểm).
     Chat đọc main 1d66c61:
       - server/routes/giao-hang.js ~34–41: cửa webhook kiểm khoá rồi `await gh.nhanTinBao(req.body)` RỒI mới trả lời.
       - server/utils/giaoHang.js nhanTinBao ~405–418: đọc thẻ (Turso) → thẻ 'dang_goi' trả 409 → `await aha.docChuyen(ma)` (gọi lại Ahamove; lần đầu sau
         khởi động phải lấy token trước — thêm một lần gọi) → ghi pos_giao_tin (chống lặp) → capNhatTuAhamove (vài câu Turso) → trả 200.
       - server/utils/ahamove.js ~10: HAN_GOI_MS = 10000 (mỗi lần gọi Ahamove chờ tới 10 giây) — lớn hơn hạn 5 giây của tin báo.
       - Dự phòng: danhSach ~427–441 đọc lại chuyến quá DOC_LAI_GIAY (60) — tối đa DOC_LAI_TOI_DA chuyến mỗi lần hỏi, lỗi thì nuốt im lặng (catch rỗng ~438).
     Song song: KET-NOI-1 (Opus làn 1) sửa database.js / đường thu tiền — KHÔNG đụng giaoHang.js; việc này không sửa database.js. -->

## Mục tiêu
Tài xế nhận đơn, lấy hàng, giao xong… thì thẻ trên màn Giao hàng đổi ngay, kèm tên / SĐT tài xế. Tin báo của Ahamove luôn được POS trả lời trong vài
trăm mili-giây, dù Ahamove hay kho dữ liệu đang chậm; phần đọc lại chuyến và cập nhật thẻ chạy ngay SAU khi đã trả lời. Tin báo có hỏng thì màn
Giao hàng tự đọc lại và vẫn lên đúng trạng thái. Làm ngay — đang chặn việc thử Ahamove trước khai trương.

## Nghiệm thu

### A. Trả lời ngay
- A1 Cửa `POST /api/giao-hang/ahamove-bao`: kiểm khoá như cũ (khoá sai / thiếu → 401 / 503 như cũ) → trả **200 ngay**, KHÔNG chờ gọi Ahamove, KHÔNG chờ
  câu ghi kho nào. Ca thử: Ahamove giả chậm 8 giây + kho chậm → cửa vẫn trả 200 dưới 1 giây.
- A2 Phần xử lý (logic nhanTinBao hiện có: đọc lại chuyến THẬT, không tin thân tin; chống lặp pos_giao_tin; capNhatTuAhamove) chạy ngay sau khi trả lời,
  trong cùng tiến trình. Lỗi ở phần này: ghi log rõ (mã chuyến, bước hỏng — KHÔNG có khoá / token / dữ liệu khách), không làm sập máy chủ.
- A3 Hai tin cùng chuyến tới cách nhau vài chục mili-giây (như 14:04:34.190 / .239) → thẻ cập nhật đúng MỘT lần, kết quả như một tin.
- A4 Thẻ đang 'dang_goi' lúc tin tới: không còn trả 409 cho Ahamove (Ahamove coi là lỗi); trả 200 và để thẻ được đọc lại sau khi gọi xe xong
  (kế hoạch chọn cách đơn giản nhất — vd đánh dấu "cần đọc lại" hoặc dựa dự phòng — có ca thử).
- A5 Tin không phải chuyến của quán / chuyến cũ đã thay → 200, không làm gì (như cũ).

### B. Dự phòng đọc lại phải hoạt động
- B1 Tìm và sửa nguyên nhân thẻ HD0002 không lên trạng thái có tài xế trong nhiều phút dù dự phòng 60 giây đang bật: đối chiếu `docChuyen` / `tomChuyen`
  (server/utils/ahamove.js ~80–101) và `trangThaiQuan` / `capNhatTuAhamove` (giaoHang.js ~362–400) với tài liệu Ahamove (tin báo:
  https://developers.ahamove.com/docs/webhook — `_id`, `status`, `sub_status`, `path[]`, `supplier_id`, `supplier_name`; chi tiết đơn:
  https://developers.ahamove.com/docs/api-reference/order-apis/get-order-detail; Data Model ở cùng mục). Có ca thử tái hiện ĐỎ trên gốc.
  Không tìm ra lỗi mã → ghi rõ trong báo cáo các giả thuyết còn lại + thêm log đủ để lần thử sau nhìn ra (B3).
- B2 Hạn mỗi lần gọi Ahamove (HAN_GOI_MS 10 giây) xét lại: đường dự phòng (màn Giao hàng đang chờ) không được treo màn quá lâu; kế hoạch chọn số
  có lý do (hằng số có tên, một chỗ).
- B3 Log mỗi lần xử lý tin / đọc lại: `[GIAO] <mã chuyến> <trạng thái Ahamove> → <trạng thái thẻ> · <ms>` (không SĐT tài xế, không địa chỉ khách) —
  để chủ quán / chat đọc nhật ký Render khi thử lại. Lỗi đọc lại dự phòng KHÔNG còn bị nuốt im lặng (catch rỗng ~438 → log).

### C. Hồi quy (K5)
- C1 Mọi ca của `cong_cu/thu_GIAO1.js` còn xanh trừ ca CỐ Ý đổi (409 'dang_goi' → 200) — sửa bài theo LUAT_XAY_APP §6.8.
- C2 Gọi xe, tìm lại, huỷ chuyến, chuyến trùng, phí huỷ, tự tìm lại một lần khi tài xế huỷ — không đổi.

## Phạm vi
- viec/GIAO-2/**
- server/routes/giao-hang.js
- server/utils/giaoHang.js
- server/utils/ahamove.js
- cong_cu/thu_GIAO2.js
- cong_cu/thu_GIAO1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_GIAO2.js` ĐỎ trên gốc: Ahamove giả chậm → cửa tin báo trả lời sau > 5 giây; thẻ 'dang_goi' trả 409; (B1) ca tái hiện nguyên nhân thẻ
không cập nhật khi đọc lại.

## Ngân sách
~60 dòng máy chủ + ~250 dòng thử.
**Phương án đơn giản nhất đã xét:** giữ NGUYÊN logic xử lý tin (đọc lại chuyến thật, chống lặp, cập nhật thẻ) — chỉ đổi thứ tự: trả lời trước, xử lý
ngay sau trong cùng tiến trình. Không thêm hàng đợi, không bảng mới, không tin thân tin báo (giữ an toàn: khoá chỉ là chuỗi cố định, thân có thể giả).
Tin bị mất khi máy chủ khởi động lại giữa chừng → dự phòng đọc lại 60 giây lo (B).

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
có — cửa công khai nhận tin từ ngoài: khoá vẫn kiểm TRƯỚC khi trả 200 và trước mọi xử lý; không tin thân tin (luôn đọc lại chuyến thật); log không
lộ khoá / token / dữ liệu khách; xử lý nền không mở đường gây quá tải (vd mỗi tin chỉ một lần đọc lại).

## Cấm
- Không đổi cách xác thực tin báo (header `apikey` = AHAMOVE_KHOA_BAO, so timingSafeEqual). Không tin trạng thái trong thân tin.
- Không đụng tiền / phí giao / phí huỷ ngoài đúng logic đang có. Không đụng database.js, đường thu tiền, màn Bán hàng (KET-NOI-1 đang làm).
- Mặc định: không sửa .claude/, không merge, không tạo PR, không đụng main, chỉ push đúng `git push -u origin viec/GIAO-2`, không sửa sổ việc,
  không chạy patch_*.py. Đẩy nhánh sau mỗi bước lớn.
