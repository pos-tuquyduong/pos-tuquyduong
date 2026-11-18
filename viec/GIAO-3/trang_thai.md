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

## Chỗ vá → đột biến (`python3 viec/GIAO-3/dot_bien.py`: bảng gốc trước soát; số cuối ở mục "Số cuối")
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
- Số trước soát (đã thay — xem mục "Số cuối"). CẢNH BÁO 1 của bộ kiểm: `route GET có lệnh ghi (3) — packages.js:196, products.js:66, sync.js:148` (có sẵn, không thuộc việc này).

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
1. thu_GIAO3: bỏ mọi `if (o())` — ca luôn chạy (`go` / `bam` an toàn). Số ca gốc = số ca bản vá (số cuối ở mục "Số cuối").
2. giaoHang.js taoChuyenMoi: `phi = t.phi ?? (bp.phi > 0 ? bp.phi : null)` — không biết phí → trống. Ca mới "C3 (K4) báo phí lúc gọi xe 0 VÀ tạo
   chuyến không trả phí", đột biến BV-phi-bao-0. baoPhi (phí báo KHÁCH) giữ nguyên: đổi nó là đổi phí khách — ngoài việc này (Phát hiện).
3. danhSach chỉ đọc lại thẻ giao_loi CÓ xong_luc (giao thất bại COMPLETED + FAILED); giao_loi do huỷ khi đang giao không đọc lại. Ca mới "B3 thẻ
   giao_loi do Ahamove HUỶ …", đột biến VS-doc-lai-giao-loi-do-huy. Ca B3 cũ cô lập: đặt doc_luc = bây giờ cho mọi thẻ trước khi lùi thẻ cần thử.
4. Ghi mục dưới (Phát hiện, F2, G4; CHƯA KIỂM ở báo cáo 7 mục cuối file). 5. ke_hoach sửa số dòng.
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
1. Quản lý › Báo cáo › Hàng ngày, chọn 18/11 → ô "Thực thu" = 46.000đ + khoản nạp tiền mặt / chuyển khoản trong ngày nếu có (phiếu ghi "Tổng nạp
   3.000đ": nạp bằng tiền mặt / CK → 49.000đ; nạp bằng cách khác → 46.000đ — cùng số tab Đối soát / Sổ sách ngày đó), dưới ô có dòng
   "= tiền mặt + chuyển khoản thật nhận".
2. Giao hàng › bấm "Tải lại" → thẻ HD0003 hiện "Giao không thành công: Người nhận đặt hàng sai địa chỉ" và "📦 Hàng đã về quán lúc 12:23".
3. Báo cáo › tab 🧾 Đối soát → ra số (hoặc sau 60 s: "Đối soát quá lâu — thử lại hoặc chọn kỳ ngắn hơn", nút Đối soát bấm lại được); một thẻ
   đang tìm xe › Huỷ chuyến › để trống hoặc gõ "ab" › Xác nhận → hộp báo "Nhập lý do (ít nhất 3 ký tự)", không huỷ.

### Sau vòng sửa 1 — số đo lại
- (số giữa vòng — đã thay bởi mục "Số cuối")
- Ahamove giả: "tạo chuyến trả phí 0" nay trả đúng số 0 (lần sửa đầu vòng 1 làm nó thành "không có phí" → BV-phi-tao-chuyen SỐNG; đã sửa).
- Đột biến (`python3 viec/GIAO-3/dot_bien.py`): (số giữa vòng — xem "Số cuối"). Thêm vào bảng chỗ vá → đột biến:
  | giaoHang.js taoChuyenMoi phí báo 0 → trống (C, K4) | BV-phi-bao-0 |
  | danhSach chỉ giao_loi có xong_luc (B3) | VS-doc-lai-giao-loi-do-huy |
- Tên đột biến đầy đủ: BV-ly-do-giao-loi, VS-ly-do-khong-cat, BV-ly-do-huy, BV-giao-loi-tra-hang, BV-chong-lap-sub-status, BV-gio-return,
  VS-ly-do-ghi-de-rong, BV-doc-lai-giao-loi, VS-doc-lai-ca-da-ve, BV-danh-sach-tra-hang, BV-man-tra-hang, BV-phi-doc-chuyen, BV-phi-tao-chuyen,
  BV-phi-bao-0, VS-doc-lai-giao-loi-do-huy, VS-phi-nhan-am, BV-log-phi, BV-thuc-thu-may-chu, VS-thuc-thu-cong-ship, BV-man-thuc-thu, BV-han-doi-soat,
  VS-han-thanh-mat-mang, BV-log-doi-soat, BV-hop-ly-do, VS-hop-khong-kiem-do-dai, VS-thoi-gui-rong.

## Soát độc lập — vòng 2 (agent /ra-soat, kết luận nguyên văn rút gọn dòng)
```
KHÔNG ĐẠT (mọi lỗi NHẸ: không đụng tiền / điểm / ví, không lộ thông tin, không ngoài Phạm vi)
LỖI TÌM ĐƯỢC:
1. NHẸ K3 — giaoHang.js capNhatTraHang khoá một chiều `AND COALESCE(tra_hang,'') <> 'da_ve'` không có ca / đột biến (tin IN_RETURN trễ kéo lùi).
2. NHẸ K3/K4 — đường UPDATE chính ghi tra_hang (dang_giao đọc thẳng COMPLETED+FAILED+RETURNED) không có ca.
3. NHẸ K3 — HopLyDo ngưỡng 3: thiếu ca đúng 3 ký tự và ca khoảng trắng hai đầu.
4. NHẸ K1 — trang_thai còn số cũ (12·30 / 40/40 · 24 / 40 đạt · PASS 126).
5. NHẸ K1/K4 — hứa mục CHƯA KIỂM mà không có; chưa có kết quả cong.js chay.
6. NHẸ K1 — câu "không dựng được ca đỏ" cho TRA_HANG prototype là sai: sub_status 'constructor' → tham số là hàm → câu ghi ném, thẻ kẹt.
NGHI NGỜ: F2 "46.000" bỏ qua khoản nạp 3.000 cùng ngày; try/catch gộp ca khi màn sập; demCau đếm lẫn câu của /reports/daily (soSach);
  gioAha return_time ngoài miền → "Invalid Date"; phí 0 + 0 → phi_that NULL, Đối soát không cảnh báo "phí chưa rõ"; bấm lại sau QUA_HAN chạy chồng;
  regex G4 cần ")" trước +/−; thẻ giao_loi do huỷ không đọc lại nếu Ahamove vẫn trả hàng.
NGHIỆM THU: 24/25 · thiếu F1 (bằng chứng npm test / --day-du / cong.js trên HEAD sau vòng sửa).
BÀI HỌC: KHOÁ ca "tin lùi tới trễ" + đột biến gỡ vế WHERE cho mọi câu ghi một chiều; KHOÁ ô có ngưỡng ký tự: ca đúng ngưỡng + khoảng trắng;
  NGUYÊN TẮC hai đường ghi cùng trạng thái → mỗi đường một ca; "không dựng được ca đỏ" phải kèm lệnh đã thử; F2 con số tiền đối chiếu mọi khoản cùng ngày.
```

### Vòng sửa 2 (lỗi NHẸ — LUAT §6.5)
1. Ca "B1 một chiều: thẻ đã về quán, tin IN_RETURN tới trễ → VẪN đã về quán" + đột biến BV-mot-chieu-da-ve.
2. Ca "B1 (đường UPDATE chính) tin FAILED + RETURNED cùng lỡ" + đột biến BV-tra-hang-update-chinh.
3. E2 thêm ca "  ab  " (đột biến VS-khong-trim); E3 gửi đúng "abc" (đột biến VS-nguong-4).
4–5. Sửa số cũ (dẫn tới mục "Số cuối"); CHƯA KIỂM ở báo cáo 7 mục.
6. Vá lại `Object.hasOwn(TRA_HANG, …)` (ahamove.js) kèm ca "B4 sub_status lạ ('constructor') → giao_loi, không dòng trả hàng". Đã thử đột biến bỏ vá
   thẳng (`TRA_HANG[o.sub_status] || null`): `python3 viec/GIAO-3/dot_bien.py BV-sub-status-prototype` → bài SẬP do libsql PANIC (Rust) khi tham số là
   hàm — tức trên bản chưa vá, một sub_status lạ từ Ahamove làm SẬP tiến trình máy chủ. Bài sập không đếm là BẮT → thay bằng đột biến vá sai
   VS-sub-status-chuoi (BẮT). Câu cũ "câu ghi kho ném, không ghi sai" là sai — thay bằng câu này.
- Nghi ngờ F2 nạp 3.000: sửa thao tác F2 bước 1 (kèm điều kiện khoản nạp). Các nghi ngờ khác → Phát hiện dưới.

### Phát hiện thêm (vòng 2)
- doiSoat.js `demCau` là biến chung: /reports/daily (soSach) chạy cùng lúc thì dòng `[DOISOAT] … n câu` cộng lẫn — đọc số câu trên Render kèm điều này.
- ahamove.js gioAha: return_time ngoài miền Date → chuỗi "Invalid Date" ghi vào tra_hang_luc (chỉ hiển thị sai giờ); dạng thật (giây / mili-giây) chưa đối chiếu.
- Báo phí 0 + tạo chuyến 0 → phi_that NULL; Đối soát tính 0 mà không có dòng "phí chưa rõ".
- Hết hạn chờ Đối soát: máy chủ vẫn chạy lượt cũ; bấm lại → hai lượt chồng nhau (không chặn).
- Thẻ giao_loi do huỷ khi đang giao (không xong_luc) không được đọc lại kể cả khi Ahamove có trả hàng — tài liệu chưa nói trường hợp này.

## Soát bảo mật (/soat-bao-mat — lần 1, HEAD 4417b2e7 trước vòng sửa 2)
Bước 2 (agent tìm lỗ hổng) báo nguyên văn:
```
No vulnerabilities found.
- Ahamove text (fail_comment, cancel_comment): không lấy từ thân tin báo công khai — nhanTinBao chỉ lấy mã chuyến, đọc lại bằng khoá quán; qua chuAha
  (bỏ ký tự điều khiển, cắt 200), lưu `loi` bằng SQL tham số, màn hiện chữ React ({c.loi}, {ct.loi}); không dangerouslySetInnerHTML; tem in qua thoat().
- sub_status qua danh sách trắng TRA_HANG; return_time qua gioAha (chỉ số); capNhatTraHang tham số hoá, không đụng tiền / đơn / kho; khoá chống lặp
  chỉ thêm giá trị danh sách trắng.
- Phí: phiDuong chỉ nhận > 0; 0 / không rõ → COALESCE giữ.
- Log mới: [GIAO] phi chỉ mã chuyến (≤ 40) + số; [DOISOAT] kiểu, ngày, ms, số câu — không SĐT / tên / địa chỉ / khoá.
- /reports/daily giữ authenticate + checkPermission('view_reports'); thuc_thu tính ở máy chủ (soSach kiểm ngày); lỗi mới chỉ trả 400 + code.
- 030 chỉ thêm 2 cột tên cố định; hạn chờ api.js và HopLyDo chỉ phía màn, máy chủ vẫn kiểm độ dài lý do.
```
Số lỗi trước lọc: 0 · sau lọc: 0 (bước 3 không cần).
