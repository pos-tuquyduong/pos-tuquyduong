# GIAO-3 — kế hoạch (máy, 18.11.2026)

Không chờ duyệt (phiếu: việc giao hàng / báo cáo chỉ đọc). Số dòng đã đọc lại trên `4fd64c3`.

## 0. Đã đọc (K1)
- `server/utils/ahamove.js:91-97` tomChuyen: `phi: so(o.total_price)` (0 là số → ghi đè); không đọc `sub_status`, `fail_comment`, `cancel_comment`.
  `taoChuyen:67` `so(j.order?.total_price ?? j.total_price)` — cùng khuôn phí (K4: tạo chuyến trả 0 → `t.phi ?? bp.phi` lấy 0).
- `server/utils/giaoHang.js:378` capNhatTuAhamove bỏ qua thẻ giao_loi; `:408` `phi_that = COALESCE(?, phi_that)`, `loi = 'Giao không thành công'` cố định;
  `:385` CANCELLED khi dang_giao câu cố định; `:308` nhận lại theo mã theo dõi cũng `COALESCE(co.phi, …)` (K4 — cùng nguồn tomChuyen).
  `:429` khoá chống lặp `phu = diem_giao|sdt`; `:468` danhSach chỉ đọc lại tim_xe/doi_tai_xe/dang_giao.
- `server/utils/doiSoat.js:356-373` chayDoiSoat chạy TUẦN TỰ 17 bất biến + 4 phép, rồi tongHop / soHoaDonNgay / soKet / sao kê.
- `server/routes/reports.js:25-97` /daily không có thực thu; `client/src/pages/Reports.jsx:237` màn tự tính `total_revenue − total_discount + total_shipping`.
- `client/src/components/DoiSoat.jsx:36` `api.get` không hạn; `client/src/utils/api.js:206` `get(endpoint)` không nhận tuỳ chọn, `goiFetch:90` coi mọi lỗi fetch là mất mạng.
- `client/src/pages/GiaoHang/index.jsx:89,96,102` ba `window.prompt`.

## 1. Đo D1 (trước khi sửa) — `viec/GIAO-3/do_doisoat.js`
Kho tạm 1.800 đơn / 30 ngày (60 đơn/ngày, 2 món, nhật ký, ví, điểm, nạp tay, 3 đơn lệch thật), bọc `db.query` thêm trễ + đếm câu.

| trễ / câu | ngày | tuần | tháng |
|---|---|---|---|
| 40 ms | 2.366 ms · 63 câu | 2.205 ms · 61 câu | 2.156 ms · 60 câu |
| 150 ms | 7.923 ms · 63 câu | 7.606 ms · 61 câu | 7.406 ms · 60 câu |

Câu theo bất biến (kiểu ngày): I8=7 I9=3 I14=3 I12=2 I13=2 I15=2, còn lại 1. Tốn nhất là tổng số câu NỐI NHAU (63), không phải một phép.
Thật 18.11 16:05 (kho Tokyo) > 40 s ⇒ ~0,6 s mỗi câu nối nhau; số câu tương đương ⇒ thời gian ≈ (số câu nối nhau) × trễ.
40 ms đã ≤ 5 s ngay trên gốc → theo phiếu KHÔNG tối ưu ở việc này; hạn chờ (D3) + log (D4) để đo trên Render thật.

## 2. Phương án

| Phần | A (chọn) | B | Lý do |
|---|---|---|---|
| A lý do | ghi thẳng vào cột `loi` sẵn có: "Giao không thành công: <lý do>" | cột mới `ly_do_loi` | A ít dòng, màn đã hiện `loi`; không cần cột |
| B trả hàng | 2 cột `tra_hang` ('dang_tra'/'da_ve'), `tra_hang_luc` (bước `030_giao_tra_hang.js`), capNhatTuAhamove nhận thẻ giao_loi chỉ để cập nhật 2 cột (+ lý do) | trạng thái thẻ mới | phiếu: không thêm trạng thái |
| B2 chống lặp | `phu = diem|sdt` + `|<sub_status>` CHỈ khi có sub_status | luôn thêm đuôi | A: khoá cũ trên production không đổi |
| B3 đọc lại | danhSach đọc thêm thẻ giao_loi chưa 'da_ve' — xếp SAU thẻ đang chạy trong trần mỗi lần | luồng riêng | dùng lại đường sẵn có |
| C phí | một hàm `phiDuong(x)` (số > 0, không thì null) dùng trong tomChuyen + taoChuyen; COALESCE sẵn có giữ số cũ | sửa câu UPDATE | một quy tắc một chỗ (C3) |
| C3 log | tomChuyen trả thêm `phi_tho` {total_price, total_fee} (chỉ số); capNhatTuAhamove log 1 dòng `[GIAO] phi <mã> total_price=… total_fee=… · thẻ <cũ> → <mới/giữ>` khi khác số thẻ | — | thứ tự đọc: total_price (> 0); total_fee chỉ ghi log để chat thử đối chiếu (chưa có dữ liệu thật — không đoán) |
| D | KHÔNG tối ưu: số đo 40 ms = 2,4 s ≤ 5 s (D2 đạt trên gốc) — phiếu Ngân sách "chỉ tối ưu khi số đo vượt ngưỡng D2" (soát kế hoạch câu 2). Ghi Phát hiện: 150 ms = 7,9 s; thật > 40 s ⇒ chờ log D4 trên Render rồi quyết chạy song song | `Promise.all` mọi bất biến | B thừa so với luật phiếu; giữ chayDoiSoat nguyên ⇒ D2 đối chứng giống hệt hiển nhiên |
| D3 | `api.get(url, { han })` → AbortController; hết hạn = lỗi `QUA_HAN` (không gửi lại); DoiSoat `HAN_DOI_SOAT_MS = 60000` | Promise.race ở màn | A đúng chỗ (fetch chỉ trong api.js), huỷ thật yêu cầu |
| D4 | log `[DOISOAT] <kiểu> <từ> · <ms>ms · <n> câu` trong chayDoiSoat (đếm câu chiDoc của lượt) | log ở route | hàm là chỗ chạy; đếm bằng biến đếm module (lượt chạy chồng nhau thì số câu cộng chung — ghi rõ) |
| G | /daily trả `thuc_thu = soSach(date,date).tien_vao.tien_mat + .chuyen_khoan`; màn chỉ hiện | tính lại ở route | phiếu G1 |
| E | `HopLyDo.jsx` trong `pages/GiaoHang/` (ô + lỗi dưới ô + Xác nhận / Thôi), `lam` chờ `hoiLyDo(câu)` | sửa từng chỗ | một thành phần cho 3 chỗ |

Ước lượng: máy chủ ~90 dòng, giao diện ~70, bài thử ~420.

## 3. Ca thử ↔ nghiệm thu (`cong_cu/thu_GIAO3.js`, Ahamove giả + máy chủ thật + màn thật qua esbuild)
- A1 COMPLETED+FAILED có fail_comment → `loi` "Giao không thành công: <lý do>" (danh sách + thẻ); không lý do → câu cũ; lý do 300 ký tự → cắt 200; chữ `<b>` giữ nguyên chữ.
- A2 sau Tải lại / đọc lại tiếp theo (RETURNED) vẫn giữ lý do; đọc kho thẳng (lưu ở kho).
- A3 CANCELLED khi dang_giao: có cancel_comment → "câu cũ: <comment>"; không → câu cũ.
- B1 IN_RETURN → `tra_hang` 'dang_tra'; RETURNED + return_time → 'da_ve' + giờ VN của return_time; RETURNED không giờ → giờ POS; trạng thái vẫn giao_loi; đơn / ví không đổi.
- B2 tin RETURNED sau tin FAILED cùng tài xế → áp; tin RETURNED lặp → "tin lặp".
- B3 tin RETURNED lỡ → GET ?doc_lai=1 đọc thẻ giao_loi → 'da_ve'; lần sau KHÔNG gọi Ahamove (đếm lượt đọc); thẻ da_dong không đọc.
- B4 COMPLETED+COMPLETED → xong, `tra_hang` NULL; thu_GIAO1 / thu_GIAO2 xanh.
- C1 phí 16.000 → đọc lại ACCEPTED total_price 0 / '' / 'abc' → phi_that 16.000, chenh giữ; log `[GIAO] phi` không SĐT / tên. C2 phí mới 21.000 → cập nhật, chenh tính lại.
  C (K4) taoChuyen trả total_price 0 → phi_that = phí báo.
- C4 doiSoatGiao dùng phi_that giữ đúng (ca C1 → Đối soát phi_that 16.000).
- D3 màn DoiSoat thật: máy chủ treo → sau hạn (bài thu ngắn setTimeout ≥ 30 s xuống 300 ms) hiện câu "Đối soát quá lâu…" và nút "Đối soát" bấm được; 503 KHO_MAT_KET_NOI → câu máy chủ.
- D2 đối chứng: `do_doisoat.js --ra` bản gốc / bản mới → so JSON giống hệt (ghi trang_thai). D4: dòng `[DOISOAT]` có trong log của lượt chạy.
- E1–E3 màn GiaoHang thật: Đóng thẻ / Huỷ chuyến / Từ chối mở hộp (câu hỏi cũ); "ab" → báo dưới ô, không gửi; Thôi → không gửi, không báo lỗi; hợp lệ → gửi; 409 → baoLoiTu. E4 grep = 0.
- G2 a–e (chèn đơn thẳng vào kho, mỗi ca một ngày) so số tính tay 46.000 · 40.000 · 0 · 0 · 100.000; G3 dòng chú thích; màn chỉ hiện `thuc_thu`.

## 4. Đường song song (K4) và luồng hợp lệ (K5)
- Phí: tomChuyen (tin, đọc lại, traTheoMa nhận lại, goiXe đọc chuyến cũ) + taoChuyen — cùng `phiDuong`. baoPhi giữ nguyên (báo phí 0 → đã ném AHAMOVE_TU_CHOI? không: `so(0)` = 0 hợp lệ — ngoài việc này, không đổi).
- Lý do: câu `loi` giao_loi ở UPDATE chính + nhánh CANCELLED dang_giao. dongThe ghi đè `loi` khi đóng — chủ ý (thẻ rời màn).
- Luồng không bị chặn: giao xong; đổi tài xế (phu không đổi khi không có sub_status); tìm lại; huỷ chuyến; thẻ giao_loi Đóng thẻ vẫn được (trạng thái không đổi).
- Không đụng: kiemHuyDonGiao, chotHuyGiao, xoaDonGiao, dongChuyenKhiHoan, ghiHangHong (Cấm).

## 5. Sau soát kế hoạch (agent phụ, 4 câu)
- Ngoài phạm vi / Cấm: không. ctx của bất biến chỉ đọc — không còn liên quan (không chạy song song).
- Ngắn hơn: bỏ phần song song D (đã nhận, xem bảng). 
- Ca thiếu: B1 trên màn (thêm ca màn GiaoHang "Đang trả hàng về quán" / "Hàng đã về quán" + danhSach trả tra_hang); C3 dạng log (đã có ca); G1 so soSach (đã có ca);
  G2 đột biến công thức cũ (dot_bien.py); G4 grep (ca trong bài); F1 thu_DOISOAT1 / thu_SAOLUU2 chạy qua npm test.
- Song song: hết hạn chờ phải KHÔNG bị gửi lại như MAT_KET_NOI (lỗi QUA_HAN riêng); `loi` chỉ đổi khi có lý do mới (không ghi đè bằng rỗng);
  giaoHang.js:393/396 (chuyen_huy) bỏ cancel_comment → Phát hiện; thẻ giao_loi không bao giờ RETURNED bị đọc lại mỗi 60 s tới khi Đóng thẻ → CHƯA KIỂM / Phát hiện.
