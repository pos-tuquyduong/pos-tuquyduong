# GIAO-3 — trạng thái

## Đối chiếu bản chụp (bước 1)
- HEAD lúc mở phiên e780d7b · FETCH_HEAD 4fd64c3 → HEAD là tổ tiên → `git pull --ff-only` → 4fd64c3
- `git log --oneline -3`:
  - 4fd64c3 PHIEU: GIAO-3 dinh chinh: 16:05 may chu con o kho Tokyo
  - e780d7b PHIEU: GIAO-3 them F-LOI-2 Thuc thu cong phi giao hai lan; F-LOI-1 van ket o Virginia (chat thu 18.11 16:05)
  - a5adb8f PHIEU: GIAO-3

## D1 — số đo trước khi sửa (`node viec/GIAO-3/do_doisoat.js --tre <ms>`, 1.800 đơn / 30 ngày)
| trễ / câu | ngày | tuần | tháng |
|---|---|---|---|
| 40 ms | 2.366 ms · 63 câu | 2.205 ms · 61 câu | 2.156 ms · 60 câu |
| 150 ms | 7.923 ms · 63 câu | 7.606 ms · 61 câu | 7.406 ms · 60 câu |

Câu theo bất biến (ngày): I8=7 I9=3 I14=3 I12=2 I13=2 I15=2, các bất biến khác 1 câu. D2 (≤ 5 s ở 40 ms) đạt ngay trên gốc → theo phiếu không tối ưu.

## Sự cố môi trường
- Kho mở phiên là kho nông → `npm test` đỏ ở thu_BH2 (`fatal: bad revision 'cbbb809..HEAD'`, không liên quan mã việc này). Đã chạy
  `git fetch -q --unshallow origin viec/GIAO-3` (chỉ tải lịch sử) → `--day-du` xanh.

## D2 — đối chứng giống hệt
`do_doisoat.js --tre 0 --ra` trên bản gốc (`git show 4fd64c3:server/utils/doiSoat.js`) và bản mới, cả ngày / tuần / tháng (đỏ 82 / 142 / 1.042 dòng):
`cmp` hai JSON → GIỐNG HẾT (76.840 byte). Việc này không đổi cách chạy bất biến (chỉ thêm log D4) — xem ke_hoach.md mục 2.

## Chỗ vá → đột biến (`python3 viec/GIAO-3/dot_bien.py`: ĐỐI CHỨNG XANH 40/40 · TỔNG 24 · BẮT 24 · SỐNG 0 · HỎNG 0 · LẠC 0)
| chỗ vá | đột biến |
|---|---|
| giaoHang.js loiGiao (A1) | BV-ly-do-giao-loi |
| ahamove.js chuAha cắt 200 (A1) | VS-ly-do-khong-cat |
| giaoHang.js CANCELLED dang_giao + cancel_comment (A3) | BV-ly-do-huy |
| giaoHang.js capNhatTuAhamove → capNhatTraHang (B1/B2) | BV-giao-loi-tra-hang |
| giaoHang.js phu chống lặp + sub_status (B2) | BV-chong-lap-sub-status |
| capNhatTraHang giờ return_time (B1) | BV-gio-return |
| capNhatTraHang chỉ ghi lý do khi có (A2) | VS-ly-do-ghi-de-rong |
| danhSach đọc lại giao_loi (B3) | BV-doc-lai-giao-loi, VS-doc-lai-ca-da-ve |
| danhSach trả tra_hang (B1) | BV-danh-sach-tra-hang |
| GiaoHang/index.jsx traHang (B1 màn) | BV-man-tra-hang |
| ahamove.js phiDuong ở tomChuyen (C1) | BV-phi-doc-chuyen, VS-phi-nhan-am |
| ahamove.js phiDuong ở taoChuyen (C, K4) | BV-phi-tao-chuyen |
| giaoHang.js logPhi (C3) | BV-log-phi |
| reports.js thuc_thu (G1/G2) | BV-thuc-thu-may-chu, VS-thuc-thu-cong-ship |
| Reports.jsx hiện thuc_thu (G2 màn) | BV-man-thuc-thu |
| DoiSoat.jsx han (D3) | BV-han-doi-soat |
| api.js QUA_HAN không gửi lại (D3) | VS-han-thanh-mat-mang |
| doiSoat.js log [DOISOAT] (D4) | BV-log-doi-soat |
| GiaoHang hộp lý do (E1/E4) | BV-hop-ly-do |
| HopLyDo kiểm ≥ 3 ký tự (E2) | VS-hop-khong-kiem-do-dai |
| HopLyDo Thôi không gửi (E2) | VS-thoi-gui-rong |

## Kiểm
- `node cong_cu/thu_GIAO3.js` 40 đạt · 0 hỏng; `node kiem_tra_truoc_khi_giao.js --day-du`: PASS 126 · FAIL 0 · CẢNH BÁO 1 (có sẵn từ trước, không phải bài này).

## Soát độc lập — vòng 1 (agent /ra-soat, nguyên văn phần kết luận)
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
1. cong_cu/thu_GIAO3.js:488-505, 512-517 — 4 ca bọc `if (o())` (E2 lý do 2 ký tự, E2 Thôi ở Đóng thẻ, E3 409, E1 lý do hợp lệ → gửi) KHÔNG chạy
   trên bản gốc → bang_chung_do "10 đạt · 26 hỏng" = 36 ca nhưng ghi SỐ CA 40; số ca phụ thuộc nội dung code (TU-CHAY-5) — K3.
2. server/utils/ahamove.js:69-71 baoPhi `so(d.total_price ?? d.total_fee)` cho 0 qua; giaoHang.js:322 `phi = t.phi ?? bp.phi` → tạo chuyến không trả phí
   + báo phí 0 → phi_that = 0 (khuôn D-PHI-1 sót) — K4.
3. server/utils/giaoHang.js:488 — thẻ giao_loi chưa da_ve đọc lại mỗi 60 s mãi; giao_loi do CANCELLED khi dang_giao (384-386) không bao giờ RETURNED
   → tốn lượt gọi Ahamove vô hạn — K4/K1.
4. trang_thai.md thiếu: Phát hiện (C4 HD0002/HD0003, chuyen_huy bỏ cancel_comment, 150 ms = 7,9 s, điểm 3), thao tác thử tay F2, kết quả
   `node tu_chay/cong.js chay`, kết quả grep G4 cả client/src — K1/K4.
5. ke_hoach.md:7-8 số dòng ahamove.js lệch (thật: tomChuyen 98-103, taoChuyen 76) — K1 nhẹ.
NGHI NGỜ: mô hình đo D (40 ms → 2,4 s) không tái hiện > 40 s thật; api.js hạn chờ theo TỪNG lần gửi (503 gửi lại 2 lần); dòng "= tiền mặt + chuyển
  khoản thật nhận" cạnh hai ô không gồm nạp / hoàn; logPhi một dòng mỗi 60 s khi Ahamove vẫn trả 0; TRA_HANG[o.sub_status] đọc thuộc tính prototype;
  /daily thêm ~13 câu (soSach); /daily?date=rác 200 → 400.
NGHIỆM THU: 22/25 · mục thiếu: C4 (dòng Phát hiện), G4 (ghi kết quả grep), F2 (thao tác thử tay).
BÀI HỌC: KHOÁ ca giao diện không bọc trong if (phần tử có mặt); KHOÁ ca phí 0 qua baoPhi → tạo chuyến; NGUYÊN TẮC mô hình đo phải tái hiện triệu
  chứng thật trước khi kết luận "đạt ngưỡng"; NGUYÊN TẮC lời hứa "ghi Phát hiện" của ke_hoach phải có trong trang_thai; đọc lại theo nhịp phải có
  điều kiện dừng phủ MỌI đường vào trạng thái.
```

### Vòng sửa 1
1. thu_GIAO3: bỏ mọi `if (o())` — ca luôn chạy (`go` / `bam` an toàn). Gốc nay 12 đạt · 30 hỏng = 42 = SỐ CA bản vá (bang_chung_do.txt).
2. giaoHang.js taoChuyenMoi: `phi = t.phi ?? (bp.phi > 0 ? bp.phi : null)` — không biết phí → trống. Ca mới "C3 (K4) báo phí lúc gọi xe 0 VÀ tạo
   chuyến không trả phí", đột biến BV-phi-bao-0. baoPhi (phí báo KHÁCH) giữ nguyên: đổi nó là đổi phí khách — ngoài việc này (Phát hiện).
3. danhSach chỉ đọc lại thẻ giao_loi CÓ xong_luc (giao thất bại COMPLETED + FAILED); giao_loi do huỷ khi đang giao không đọc lại. Ca mới "B3 thẻ
   giao_loi do Ahamove HUỶ …", đột biến VS-doc-lai-giao-loi-do-huy. Ca B3 cũ cô lập: đặt doc_luc = bây giờ cho mọi thẻ trước khi lùi thẻ cần thử.
4. Ghi mục dưới (Phát hiện, F2, G4, CHƯA KIỂM). 5. ke_hoach sửa số dòng.
- Nghi ngờ `TRA_HANG[...]` prototype: đã thử vá bằng Object.hasOwn rồi HOÀN LẠI — không dựng được ca đỏ có nghĩa (giá trị lạ làm câu ghi kho ném,
  không ghi sai dữ liệu); ghi Phát hiện.
- Nghi ngờ hạn chờ theo từng lần gửi: hết hạn ném QUA_HAN, KHÔNG gửi lại (ca D3 + đột biến VS-han-thanh-mat-mang); chỉ 503 / mất mạng (máy chủ trả
  lời nhanh) mới gửi lại 2 lần như mọi GET — không treo.

## G4 — grep client/src
`grep -rnE "total_revenue|total_discount|total_shipping" client/src` ngoài Reports.jsx → 1 chỗ: Orders.jsx:504 `formatPrice(stats.total_revenue)` —
chỉ HIỆN, không cộng / trừ → không phải lỗi. Reports.jsx: còn hiện từng ô (200, 218, 224, 299, 303, 340, 372, 373), ô Thực thu hiện `report.thuc_thu`.

## Phát hiện (ngoài việc / không sửa)
- C4: đơn thử cũ HD0002, HD0003 đã lưu phi_that = 0 trên bản thử — KHÔNG sửa dữ liệu (phiếu); Đối soát kỳ 16–18/11 vẫn ra "quán dư" cho hai đơn đó.
- giaoHang.js capNhatTuAhamove nhánh chuyen_huy ("Tài xế / Ahamove huỷ chuyến — gọi lại …", "Tài xế huỷ chuyến — máy đã tự tìm xe lại") không nối
  cancel_comment — phiếu A3 chỉ đòi nhánh khi tài xế đã lấy hàng.
- baoPhi (phí báo khách, ahamove.js) đọc `total_price ?? total_fee` và cho 0 qua — đổi là đổi phí khách trả, cần chủ quán quyết.
- F-LOI-1: số đo giả lập 40 ms = 2,4 s, 150 ms = 7,9 s (63 câu nối nhau) — không tái hiện > 40 s thật. Việc này không tối ưu (phiếu: chỉ khi vượt
  ngưỡng D2). Sau khi triển khai, đọc dòng `[DOISOAT] …ms · n câu` trên Render: ms / câu ≫ 40 → mở việc chạy song song các bất biến (đối chứng
  `viec/GIAO-3/do_doisoat.js --ra` sẵn có).
- Thẻ giao lỗi (giao thất bại) mà Ahamove không bao giờ báo RETURNED vẫn được đọc lại mỗi 60 s (tối đa 3 thẻ / lần, sau thẻ đang chạy) cho tới khi
  quản lý Đóng thẻ; mỗi lần Ahamove vẫn trả phí 0 thì log `[GIAO] phi` thêm một dòng.
- ahamove.js `TRA_HANG[o.sub_status]` đọc cả thuộc tính prototype ('constructor') → câu ghi kho ném lỗi, log rồi giữ thẻ cũ (nguồn: Ahamove đọc
  bằng token quán).
- Reports.jsx dòng "= tiền mặt + chuyển khoản thật nhận" (phiếu G3 chốt câu này) nằm cạnh hai ô Tiền mặt / Chuyển khoản KHÔNG gồm nạp / hoàn →
  ngày có nạp / hoàn, cộng hai ô không ra Thực thu. Báo chủ quán.
- /reports/daily nay gọi soSach (~13 câu, có câu quét toàn sổ ví `giu_ho` mà Thực thu không dùng); `date` sai dạng → 400 DOI_SOAT_KY_SAI (trước 200
  rỗng; màn luôn gửi YYYY-MM-DD).
- Bước nâng cấp đánh số 030 — không đọc được main từ máy (người gác chặn ls-tree); ai gộp sau đổi số nếu main đã có 030.

## F2 — thao tác cho chat thử / chủ quán (điện thoại)
1. Quản lý › Báo cáo › Hàng ngày, chọn 18/11 → ô "Thực thu" = 46.000đ, dưới ô có dòng "= tiền mặt + chuyển khoản thật nhận".
2. Giao hàng › bấm "Tải lại" → thẻ HD0003 hiện "Giao không thành công: Người nhận đặt hàng sai địa chỉ" và "📦 Hàng đã về quán lúc 12:23".
3. Báo cáo › tab 🧾 Đối soát → ra số (hoặc sau 60 s: "Đối soát quá lâu — thử lại hoặc chọn kỳ ngắn hơn", nút Đối soát bấm lại được); một thẻ
   đang tìm xe › Huỷ chuyến › để trống hoặc gõ "ab" › Xác nhận → hộp báo "Nhập lý do (ít nhất 3 ký tự)", không huỷ.

### Sau vòng sửa 1 — số đo lại
- Bài thử: gốc 11 đạt · 31 hỏng (42 ca); bản vá 42 đạt · 0 hỏng. SỐ CA 42 (bang_chung_do.txt).
- Ahamove giả: "tạo chuyến trả phí 0" nay trả đúng số 0 (lần sửa đầu vòng 1 làm nó thành "không có phí" → BV-phi-tao-chuyen SỐNG; đã sửa).
- Đột biến (`python3 viec/GIAO-3/dot_bien.py`): ĐỐI CHỨNG XANH 42/42 · TỔNG 26 · BẮT 26 · SỐNG 0 · HỎNG 0 · LẠC 0. Thêm vào bảng chỗ vá → đột biến:
  | giaoHang.js taoChuyenMoi phí báo 0 → trống (C, K4) | BV-phi-bao-0 |
  | danhSach chỉ giao_loi có xong_luc (B3) | VS-doc-lai-giao-loi-do-huy |
- Tên đột biến đầy đủ: BV-ly-do-giao-loi, VS-ly-do-khong-cat, BV-ly-do-huy, BV-giao-loi-tra-hang, BV-chong-lap-sub-status, BV-gio-return,
  VS-ly-do-ghi-de-rong, BV-doc-lai-giao-loi, VS-doc-lai-ca-da-ve, BV-danh-sach-tra-hang, BV-man-tra-hang, BV-phi-doc-chuyen, BV-phi-tao-chuyen,
  BV-phi-bao-0, VS-doc-lai-giao-loi-do-huy, VS-phi-nhan-am, BV-log-phi, BV-thuc-thu-may-chu, VS-thuc-thu-cong-ship, BV-man-thuc-thu, BV-han-doi-soat,
  VS-han-thanh-mat-mang, BV-log-doi-soat, BV-hop-ly-do, VS-hop-khong-kiem-do-dai, VS-thoi-gui-rong.
