# QUAY-UI-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
Nhánh `viec/QUAY-UI-1`; hai SHA đầu phiên: HEAD `b1fd5c0` = FETCH_HEAD `b1fd5c0` (bằng nhau, không kéo). Kho nông → đã `git fetch --unshallow` (chỉ tải lịch sử) để bài thu_BH2 G1 chạy được.
```
b1fd5c0 PHIEU: QUAY-UI-1
de66463 TIEN-DO: GIAO-DIEN-1, KH-TOMTAT-1, GIAO-1, NAP-1, KHACH-APP-1 xong; mo DIEM-MON-1, KH-THE-1, QUAY-UI-1 + xep hang 5 viec; quyet dinh 07-08.11 — so v58
801e99a Merge pull request #81 from pos-tuquyduong/viec/KHACH-APP-1
```

## Chỗ vá → đột biến (cổng A17, A18) — `python3 viec/QUAY-UI-1/dot_bien.py` → 52 đột biến · BẮT 52 · SỐNG 0 · HỎNG 0 · LẠC 0
| Chỗ vá | Đột biến |
|---|---|
| D `damages.js` — chặn đơn nạp | BV-DON-NAP-GO-CHAN · VS-DON-NAP-CHI-HOAN-TIEN · VS-DON-NAP-MA-CU · VS-DON-NAP-CAU-CU · VS-DON-NAP-CHAN-CA-THE · VS-DON-NAP-CHAN-DON-THUONG |
| E `registrations.js` — sửa khách theo đăng ký | BV-SUA-DK-GO-DIEU-KIEN · VS-SUA-DK-CHI-NGUOI-NHAP · VS-SUA-DK-CHI-GIO-TAO · VS-SUA-DK-CHAN-LUON |
| A `tinh.js` — thẻ | BV-THE-KHONG-GUI · VS-THE-CON-TRONG-ITEMS · VS-THE-GUI-GIA · BV-THE-KHOA · VS-THE-GIAM-HANG · VS-THE-GOI-GIA-0 · VS-THE-GOI-TAT · VS-THE-HANG-CAP-BAN · BV-THE-KHONG-CAN-KHACH · VS-THE-CHO-HANG-CAP · VS-THE-CHUNG-GIO-NAP · VS-THE-NHIEU-THE · VS-THE-CHAN-GIO-CO-MON · VS-THE-HANG-CAO-HET-HAN · VS-THE-HANG-CAO-CUNG-BAC · BV-THE-HANG-CAO-KHONG-CHAN · VS-CAP-SAI-GIA-TRI · BV-VITRI-THEO-CHI-SO · VS-VITRI-THE-DAU |
| B `tinh.js` — cách trả | VS-TRU-MAC-DINH · BV-TRU-KHONG-LY-DO-SO-DU · VS-TRU-BO-SO-DU-ME · VS-TRU-NAP · BV-TRU-CHUA-CHON-KHACH |
| A/B `BanHangMoi.jsx` | BV-BH-TAB-THE · BV-BH-KHONG-KIEM-THE · BV-BH-TRU-MAC-DINH · BV-BH-TU-TRU-LAI · BV-BH-KHONG-DUNG-VITRI · BV-BH-LAI-CON-LAI · BV-BH-DAT-LAI-MOT-CHO · BV-BH-DOI-KHACH-GIU-THE |
| B `ThuTien.jsx` | BV-TT-NUT-TRU · BV-TT-KHONG-LY-DO · BV-TT-NUT-BO-CU · BV-TT-LO-SO-DU-LUON · BV-TT-BO-PHAN-CON-LAI |
| C `Customers.jsx` | BV-CUS-KHONG-TRA · BV-CUS-NUT-LUU · VS-CUS-SO-CHUOI-CON · BV-CUS-KHONG-BAO |
| D `Orders.jsx` | BV-ORD-NUT-SU-CO |

## Soát độc lập `/ra-soat`
**Lần 1: KHÔNG ĐẠT** — 4 lỗi, đều đã sửa ở vòng sửa 1 (bài đỏ trước: commit b8fbb9b, 55/60; vá: a7a93c4):
1. `tinh.js` `hangChiCap` lọc `'cap'`, thật là `'chi_cap'` (tiers.js:23) — bài thử tự gõ giá trị sai nên xanh oan (K3/K1). Nay bài lấy giá trị từ `CACH_CO` của tiers.js (ca A1).
2. `BanHangMoi.jsx` khớp dòng giá máy chủ theo chỉ số, máy chủ đẩy thẻ cuối `items` (K4). Nay `viTriMayChu` (ca A8, A9).
3. `cachConLai` không đặt lại giữa các đơn (K4). Nay MỘT hàm `datLaiCach` (ca B4b).
4. Đổi khách giữ dòng thẻ (K5). Nay `chonKhach` bỏ thẻ khi đổi SĐT (ca B4c).
**Lần 2: ĐẠT** — 4 lỗi hết thật, không lỗi mới. NGHI NGỜ đã xử lý: khối "chỉ hiện khi bấm Trừ tài khoản" chưa có phép khoá → thêm ca B6 + đột biến BV-TT-LO-SO-DU-LUON, BV-TT-BO-PHAN-CON-LAI (commit c0ec70e). Còn lại là Phát hiện (bên dưới).

## Soát bảo mật
SOÁT BẢO MẬT chạy 1 lần (agent độc lập + lọc). Báo cáo (nguyên ý): **Không có lỗ hổng đạt ngưỡng** (độ tin cậy 0,85) — số lỗi trước lọc 0, sau lọc 0 (không cần bước lọc). Đã kiểm: bán thẻ giá do máy chủ tra (`orders.js:520-545`; chỉ nhận tier_id + so_thang; `giuCho.js:23`, `orders.js:256`, `:1344`); trừ tài khoản / PIN do máy chủ giữ như cũ, diff máy chủ không đổi; sửa đăng ký thu hẹp quyền (UPDATE thêm `created_by` + `created_at`, tham số `?`); chặn đơn nạp theo `order_id` trước mọi hành động nên không đi vòng bằng product_code; form tra SĐT dùng cửa tìm khách có sẵn. Chưa kiểm: từng dòng JSX, chạy thử app thật.

SOÁT BẢO MẬT: ĐẠT

## Nghiệm thu — đếm từng mục
- A tab Thẻ thành viên, gói đang bán, hạng chỉ cấp mờ, chọn khách trước, MỘT thẻ cùng giỏ món, `membership_buy` không giá, giỏ nạp ≠ thẻ: `thu_QUAYUI1.js` A1–A9 (A5 từng luồng). Lỗi máy chủ DA_CO_HANG_CAO_HON / GOI_HANG_KHONG_BAN / HANG_CHI_CAP hiện qua `e.message` ở `loiTinh` (BanHangMoi.jsx) — đọc code, KHÔNG có ca tự động riêng (xem CHƯA KIỂM).
- B ba nút, không tự trừ, khối chỉ hiện khi bấm Trừ TK, nút mờ có lý do, đơn nạp chỉ TM/CK: B1–B6.
- C tra SĐT, câu "Khách đã có", mờ nút Lưu: C1–C4.
- D ẩn nút + câu + mã `DON_NAP_KHONG_SU_CO` mọi hành động: D1–D4.
- E sửa đăng ký chỉ sửa khách do chính đăng ký tạo: E1–E5.
- K5 không đổi giá / luật bán thẻ / luật nạp / luật ví: không đổi orders.js; ca đối chứng xanh trên gốc (10 ca, bang_chung_do.txt).
Kết quả: 6/6 mục có bằng chứng.

## Phát hiện (ngoài Phạm vi, không sửa)
- `CustomerSearch.jsx:583/603` (màn bán hàng CŨ, Sales.jsx) có form "Thêm khách mới" chưa báo trùng ngay khi gõ; máy chủ vẫn chặn 409.
- Phiếu E ghi "cùng điều kiện với xoá": đã copy phần danh tính (`created_by`, `created_at >=`), KHÔNG copy phần "khách trắng" (ví 0, không đơn…) vì khách đã bán hàng vẫn phải sửa được tên (Q6a). Chủ quán xem có muốn chặt hơn không.
- `cachTraKhaDung` (tinh.js) giờ chỉ `thu_BH2.js` dùng — gần chết; chờ chủ quán duyệt xoá cùng nhóm "giữ vì thu_BH1 khoá".
- `damages.js:200` chú thích cũ "orders.js:376, :397" lệch dòng (có từ trước).
- Dòng thẻ tính vào "Giỏ · N ly / N món" — chỉ câu chữ.
- Khi `lamMoiSoDu` làm số dư về 0 lúc đang ở chế độ Trừ TK: hiện như Tiền mặt nhưng không nút nào tô sáng (chỉ hiển thị).

## Báo cáo 7 mục
```
VIỆC:        QUAY-UI-1 — Quầy: tab Thẻ thành viên, ba nút cách trả, Thêm khách báo trùng, đơn nạp không Xử lý sự cố, sửa đăng ký không đổi khách App
ĐÃ SỬA:      server/routes/damages.js (laDonNap → 400 DON_NAP_KHONG_SU_CO, đầu giao dịch) · server/routes/registrations.js (PUT: UPDATE khách thêm created_by + created_at >=) ·
             client/src/pages/BanHang/tinh.js (dsGoiThe, hangChiCap, dongThe, kiemTraThe, viTriMayChu, lyDoKhongTru, CACH_TRA_MAC_DINH; thanTinhThu/khoaTinh/tinhGio xử lý thẻ) ·
             BanHangMoi.jsx (tab Thẻ thành viên, cachTra/cachConLai, datLaiCach, viTriMayChu) · ThuTien.jsx (ba nút, khối Trừ tài khoản) ·
             Customers.jsx (tra SĐT, báo "Khách đã có", mờ Lưu) · Orders.jsx (ẩn Xử lý sự cố đơn nạp) · client/dist build lại
BÀI THỬ:     cong_cu/thu_QUAYUI1.js — chạy trên gốc b1fd5c0 → ĐỎ 32/43 ca hỏng (bang_chung_do.txt: A1 hàm thẻ, B1/B2/B4/B5, D1 câu+mã cũ, D4, E2–E4, C1–C4…); sau khi vá → XANH 63/63. Đột biến 52/52 BẮT.
ĐÃ RÀ K4:    grep "dungTK|setDungTK" trong BanHang/ → còn 1 biến dẫn xuất (dungTK = cachTra === 'tai_khoan'), 0 setDungTK · grep "UPDATE pos_customers" trong registrations.js → 1 chỗ (đã vá) ·
             grep "laDonNap|Xử lý sự cố" → damages.js 1 chỗ ghi, Orders.jsx 1 nút (đã xử lý) · soát độc lập lần 1 bắt thêm 4 chỗ cùng khuôn, đã xử lý hết
CHƯA KIỂM:   (1) giao diện thật trên điện thoại / máy tính bảng — chưa ai bấm thử: chỉ có hàm thuần chạy thật + ca đọc nguồn bằng regex (có đột biến) cho phần JSX; (2) lỗi máy chủ DA_CO_HANG_CAO_HON, GOI_HANG_KHONG_BAN, HANG_CHI_CAP hiện đúng câu: đọc code, chưa có ca tự động; (3) bước PIN + chia tiền khi bấm Trừ tài khoản chạy thật qua phiên thanh toán — đường máy chủ không đổi, nhưng chưa thử tay; (4) form Thêm khách ở màn bán hàng CŨ (Phát hiện)
GIT:         xem dòng HEAD ĐÃ KIỂM cuối file; git log --oneline -2 ghi trong câu trả lời cuối
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 1 · BỎ 1 — chi tiết ở ## Bài học
```
Thử tay (1–3 thao tác cho chủ quán, điện thoại): (1) chọn khách có số dư → vào tab "Thẻ thành viên" chạm "Vàng · 1 tháng" → thấy dòng thẻ trong giỏ, giá 100.000đ; (2) khối thu tiền: ba nút Tiền mặt / Chuyển khoản / Trừ tài khoản, KHÔNG tự trừ — bấm "Trừ tài khoản" mới hiện số dư và PIN; (3) màn Khách → Thêm khách, gõ SĐT khách đã có → hiện "Khách đã có: …", nút Lưu mờ.

## Bài học
- **KHOÁ 1 (đã làm, trong Phạm vi):** bài thử giao diện lấy giá trị enum (`cach_co`) từ NGUỒN thật (`CACH_CO` của tiers.js) thay vì tự gõ trong fixture — ca A1 + đột biến VS-CAP-SAI-GIA-TRI. Lý do: fixture tự đặt `'cap'` trùng mã sai nên xanh oan (K3).
- **KHOÁ 2 (đã làm):** ca giỏ `[thẻ, món]` — `viTriMayChu` khớp thứ tự máy chủ (A8) + đột biến BV-VITRI-THEO-CHI-SO / VS-VITRI-THE-DAU; khối Trừ tài khoản có ca B6 + 2 đột biến. Lý do: mỗi dòng nghiệm thu về giao diện cần một phép thuần hoặc đột biến xoá chính khối đó.
- **NGUYÊN TẮC 1 (đề xuất, ngoài Phạm vi — KHUON_LOI.md không nằm trong Phạm vi):** thêm vào K4: "state phụ cùng nhóm trạng thái đơn (cachTra, dungMe, cachConLai) phải nằm chung MỘT hàm đặt lại; thêm state mới → grep mọi chỗ đặt lại". Ví dụ: `cachConLai` rò sang đơn sau (lần soát 1). Chat soát duyệt, gom vào HOC-<n>.
- **BỎ 1:** kho nông làm thu_BH2 G1 báo `bad revision cbbb809..HEAD` — chỉ do môi trường (đã `--unshallow`), một lần.
- Dọn `KHUON_LOI.md`: không đề xuất xoá mục nào.

## Cổng chạy (bước 11.4)
`node tu_chay/cong.js chay . b1fd5c0^ HEAD viec/QUAY-UI-1` ở HEAD `84a2878`, cây sạch:
✓ CỔNG CHẠY ĐẠT
(Kèm một CẢNH BÁO A16: bài in 43 ca trên gốc ≠ 63 ca ở head — do các ca nằm trong khối `if (hamCo(...))` không chạy khi hàm chưa có trên gốc; không phải bài dừng sớm. Đã xem, bằng chứng đỏ là 32/43 hỏng.)

HEAD ĐÃ KIỂM: 84a2878
- Sự cố: người gác chặn nhiều lệnh ghép (`B-PHANTICH`) và file có cụm `JWT_SECRET` (`B-BIMAT-CHU`) → tách lệnh, commit file bài thử trước khi chạy (đúng luật skill).

Chat soát thay: nối dòng chayBaiThat(thu_QUAYUI1.js) vào kiem_tra_truoc_khi_giao.js; npm test xanh (PASS 107 · FAIL 0). Kho nông phải --unshallow mới chạy được thu_BH2 (git log cbbb809..HEAD).
HEAD ĐÃ KIỂM: 84a2878 + commit này
