# Trạng thái BAO-1a

## Đối chiếu bản chụp (bước 1)
- Nhánh `viec/BAO-1a`; `git status` sạch lúc mở phiên; `git fetch origin viec/BAO-1a`: HEAD = FETCH_HEAD = `45fd10c` (không cần kéo).
- Kho từng nông (shallow) nên bài `thu_BH2.js` G1 báo "bad revision cbbb809" — đã `git fetch --unshallow origin viec/BAO-1a` (chỉ tải thêm lịch sử), sau đó xanh.
```
45fd10c PHIEU: BAO-1a
136d6b0 TIEN-DO: QUAY-UI-1, KH-THE-1 xong; bo P3b; NAP-2 -> KH-NAP-1; CAIDAT-BAO-1 -> BAO-1b; them VOUCHER-2, BAO-1a, BAO-1b, QC-APP-1, GIAO-MA-1, GIAO-DIEN-2; mo VI-ME-1, BAO-1a; quyet dinh 08-09.11 b; lich 09.11 — so v59
db2d71d Merge pull request #84 from pos-tuquyduong/viec/KH-THE-1
```

## Bảng màn · nút · trước · sau (nghiệm thu B)
"Trước" = cái người dùng thấy trước việc này; "Sau" = thông báo nổi góc trên phải (xanh tự ẩn 4 giây, đỏ ở lại tới khi bấm ×).

| Màn | Nút | Trước | Sau |
|---|---|---|---|
| Đơn hàng (Orders) | Hủy / Xóa đơn | `alert('Lỗi: …')`; thành công im lặng | xanh "Đã hủy/xóa đơn <mã>" · đỏ "Chưa hủy/xóa đơn được" + lý do |
| Orders | Gửi sự cố (hàng hỏng) | 3 chỗ `alert` | xanh (câu máy chủ hoặc "Đã ghi nhận hàng hỏng của đơn <mã>") · đỏ "Chưa ghi nhận hàng hỏng được" |
| Orders | Xác nhận thu nợ | `alert('✅ …')` / `alert('❌ Lỗi kết nối')` | xanh "Đã thu tiền đơn <mã>" · đỏ có lý do / "Không kết nối được máy chủ" |
| Orders | Tải danh sách đơn | lỗi chỉ ra console | đỏ "Chưa tải danh sách đơn được" |
| Hoàn tiền (Refunds) | Duyệt / Từ chối | `alert(err.message)`; xong im lặng | xanh "Đã duyệt/từ chối hoàn tiền đơn <mã>" · đỏ |
| In hóa đơn (InvoicePrint, dùng ở Orders + Bán hàng cũ) | In / In lại | `alert('Lỗi khi in …')`; xong im lặng | xanh "Đã in (lại) hóa đơn <mã>" · đỏ "Chưa in được (đơn đã lưu, không bị ảnh hưởng)" + từng loại hỏng |
| Bán hàng (cũ, Sales.jsx) | Thu tiền + mọi cảnh báo giỏ (hết hàng, chưa chọn khách, mã sai …) | dòng đỏ đầu trang (bị popup thanh toán che) + dòng trong popup | mọi `setError` → đỏ nổi; xanh "Đã thu tiền đơn <mã>" |
| Khách hàng (Customers) | Thêm khách · Lưu thay đổi · Đổi quà · Lưu ngày sinh · mở khách theo SĐT · tải DS | dòng đỏ/xanh đầu trang 3 giây + 2 dòng trong modal | xanh "Đã thêm khách <tên>…", "Đã cập nhật thông tin cho <tên>", "Đã đổi quà …", "Đã lưu ngày sinh của <tên>" · đỏ có lý do |
| Customers → ô Ví khách (ViKhach) | Nạp tay · Điều chỉnh | dòng xanh/đỏ trong khung | xanh "Đã nạp/điều chỉnh … Số dư mới …" · đỏ |
| Customers → CapHang | Cấp / Thu hồi hạng | dòng chữ cuối khối (cạnh ô PIN) | xanh "Đã cấp hạng <tên> cho khách <SĐT>" · đỏ (đúng chỗ chủ quán không thấy báo) |
| Customers → MaDangNhapApp | Lấy mã đăng nhập App | dòng đỏ trong khối | đỏ nổi (mã hiện ra là phần "xong") |
| Customers/Bán hàng cũ → CustomerSearch | Tạo nhanh khách | dòng đỏ trong khung | xanh "Đã thêm khách <tên>" · đỏ nổi; lỗi nhập thiếu (SĐT/tên) vẫn dòng cạnh ô |
| Thông tin món (ThongTinMon) | Lưu thông tin món | chữ "Đã lưu"/lỗi nhỏ cạnh nút | xanh "Đã lưu thông tin món <tên>" · đỏ |
| Đơn App (DonApp) | Đang làm · Xong · Thử chuông | dòng đỏ đầu card, xong im lặng | xanh "Đã nhận làm / Đã xong đơn App <số>" · đỏ (tải tự động 15 giây vẫn dòng cũ — không phải nút) |
| Dọn dữ liệu thử (DonThu) | Liệt kê · Tải DS · Tải sao lưu · Dọn | dòng đỏ giữa trang | xanh từng bước ("Đã liệt kê N dòng", "Đã tải sao lưu toàn bộ", "Đã dọn N dòng") · đỏ |
| Đăng ký (Registrations) | Tải CSV · Xác nhận · Hoàn tác · Hoàn tác lần xuất · Xóa · Sửa | dòng xanh/đỏ đầu trang (xa nút) | xanh "Đã xóa đăng ký <tên>"… · đỏ; nút khoá khi đang xử lý |
| Mã chiết khấu (DiscountCodes) | Tạo/Sửa · Bật/Tắt · Xóa | dòng đầu trang; Bật/Tắt im lặng | xanh "Đã tạo/cập nhật/tắt/bật/xóa mã <mã>" · đỏ; nút khoá khi đang xử lý |
| Cài đặt hóa đơn (InvoiceSettings) | Lưu · Reset · Mẫu · Tải/Xóa logo | khối `message` trên đầu trang | xanh/đỏ nổi (đây là màn riêng, không phải trang Cài đặt) |
| Báo cáo (Reports) | Kết thúc gói · tải 3 báo cáo | lỗi tải ra console; kết thúc gói im lặng | xanh "Đã kết thúc gói …" · đỏ "Chưa tải báo cáo … được"; nút khoá |
| Đối soát (DoiSoat, trong Báo cáo) | Ghi số két · Ghi sao kê · Xác nhận tay | dòng xanh/đỏ trên đầu khối | xanh "Đã ghi số két…" · đỏ |
| Giao hàng (GiaoHang) | Nhận · Gọi xe · In tem · Đóng thẻ · Huỷ chuyến · Huỷ/Từ chối đơn | dòng đỏ đầu trang; xong im lặng | xanh "Đã nhận đơn giao <mã>"… · đỏ "Chưa <việc> được"; tự in tem lỗi → đỏ |
| Menu (Layout) | Gửi lại việc kho (dải vàng) | lỗi nuốt im | xanh "Đã gửi lại việc kho…" · đỏ |
| Kho · Đặt hàng / Nhận hàng / Pha chế / Phát sinh | Gửi phiếu | dòng `kho-loi` cuối trang | xanh "Đã gửi/ghi phiếu …" · đỏ nổi |
| Kho · Định mức | Lưu món/nhóm/hạn mức/công tắc | dòng đầu trang | xanh "Đã lưu <tên>" · đỏ; nút khoá khi đang lưu |
| Kho · Nguyên liệu (+Nhóm / NCC) | Lưu · Xoá · Thêm | dòng `kho-loi` | xanh "Đã lưu/xoá nguyên liệu <tên>" · đỏ; nút khoá |
| Kho · Sản phẩm | Lưu công thức | dòng `kho-loi` | xanh "Đã lưu công thức <tên>" · đỏ; nút khoá |
| Kho · Nhập SX | Xem trước · Nhập | dòng `kho-loi` | xanh "Đã nhập danh mục…" · đỏ |
| Kho · Xem phiếu | Duyệt · Từ chối · Huỷ · Sửa · Lưu kết quả · In | dòng `kho-loi` cuối trang | xanh "Đã duyệt/từ chối/huỷ/sửa phiếu", "Đã lưu kết quả" · đỏ |

**Không đổi (và vì sao)** — xem mục `## Câu hỏi` / `## Phát hiện`.

## Bảng chỗ vá → đột biến (cổng A17, A18) — `python3 viec/BAO-1a/dot_bien.py` ⇒ 23/23 BẮT
| Chỗ vá | Đột biến |
|---|---|
| kho: đỏ không tự ẩn / xanh tự ẩn | VS-DO-TU-AN · BV-XANH-KHONG-AN |
| kho: tối đa 3 · thời gian ẩn · chống trùng · gộp báo | VS-TOI-DA-NAM · VS-TG-TU-AN-DAI · BV-GO-CHONG-TRUNG · VS-BAO-NGAY-KHONG-GOM |
| câu lỗi dễ hiểu | VS-LOI-KY-THUAT-LOT · VS-LOI-TRONG-HIEN-TRONG · VS-LOI-BO-CAU-MAY-CHU · VS-LOI-TU-TIEU-DE |
| Layout gắn đúng một lần | BV-LAYOUT-GO-THONGBAO · VS-LAYOUT-GAN-HAI-LAN |
| role / nút đóng / re-export | VS-ROLE-DAO-NGUOC · BV-NUT-DONG-GO-NHAN · VS-THONGBAO-RE-EXPORT |
| CSS nổi cố định / nút ≥ 44px / mờ khi khoá | VS-CSS-KHONG-NOI · VS-CSS-NUT-DONG-NHO · BV-CSS-KHONG-MO · VS-CSS-MO-GIA |
| bỏ `alert(` Orders / Refunds / nối ThongBao | BV-ORDERS-ALERT-TRO-LAI · BV-REFUNDS-ALERT-TRO-LAI · VS-ORDERS-BO-NOI-THONGBAO |
| nút khoá khi đang xử lý | BV-DISCOUNT-MO-NUT |

Tên đầy đủ (cổng A17): VS-DO-TU-AN, BV-XANH-KHONG-AN, VS-TOI-DA-NAM, VS-TG-TU-AN-DAI, BV-GO-CHONG-TRUNG, VS-BAO-NGAY-KHONG-GOM, VS-LOI-KY-THUAT-LOT, VS-LOI-TRONG-HIEN-TRONG, VS-LOI-BO-CAU-MAY-CHU, VS-LOI-TU-TIEU-DE, BV-LAYOUT-GO-THONGBAO, VS-LAYOUT-GAN-HAI-LAN, VS-ROLE-DAO-NGUOC, BV-NUT-DONG-GO-NHAN, VS-THONGBAO-RE-EXPORT, VS-CSS-NUT-DONG-NHO, VS-CSS-KHONG-NOI, BV-ORDERS-ALERT-TRO-LAI, BV-REFUNDS-ALERT-TRO-LAI, VS-ORDERS-BO-NOI-THONGBAO, BV-DISCOUNT-MO-NUT, BV-CSS-KHONG-MO, VS-CSS-MO-GIA, BV-REFUNDS-GO-LOI-GOI, BV-DINHMUC-MO-NUT-LUU-MON, VS-DAY-DO-CU-NHAT.

## Câu hỏi
(không chặn phần còn lại — việc đã làm xong; chờ chủ quán quyết)
1. **Màn Bán hàng mới (`pages/BanHang/**`) chưa đổi sang thông báo nổi.** Màn này đã có dải đỏ `bh-loi` ở ĐẦU màn bán (có nút Đóng), nằm cạnh giỏ, không bị popup che, và là bản vẽ ĐÃ CHỐT (`ban_mau_pos/`, CLAUDE.md mục 9: đổi thiết kế phải sửa bản mẫu trước và hỏi chủ quán). Các câu quan trọng ("Tiền đã nhận nhưng chưa thấy mã đơn…", "KHÔNG thu lại ngay…") cần nằm lại trên màn tới khi nhân viên đọc. Đề xuất của mình: giữ nguyên dải này; nếu bạn muốn thông báo nổi cho cả màn mới thì báo, mình làm việc riêng (sửa bản mẫu 119 phép trước).

## Phát hiện (không sửa, ngoài phạm vi / không phải nút ghi)
- `components/CaiDatChuong.jsx` (dùng trong Cài đặt) và mọi thứ của `Settings.jsx`, `pages/CaiDat/**` (kể cả ô PIN `HangThe.jsx`) → thuộc BAO-1b, chưa đụng.
- `pages/ManKhach/**` (màn quay về phía khách, ngoài Layout) và `Login.jsx` không có nút ghi của nhân viên; không gắn ThongBao ở đó.
- Lỗi TẢI (đọc) ở Kho (`kho-loi` trong PhatSinh/SanPham/XemPhieu/TonKho/DsPhieu…), DonApp tải tự động 15 giây, GiaoHang tải 15 giây: giữ dòng báo tại chỗ (không phải nút bấm; thông báo nổi sẽ lặp mỗi vòng).
- `kiem_tra_truoc_khi_giao.js` in "fetch trần = 31 — HẠ NGUONG_FETCH xuống 31" (hằng đang 32). Việc này không thêm/bớt `fetch(` nào (so từng file với HEAD: 0 chênh), nên MÌNH KHÔNG HẠ — chưa rõ nguyên nhân (nghi do bỏ khối chú thích JSX trong Sales làm phép bỏ-chú-thích đếm khác đi); chủ quán/việc sau xem.
- Kho còn 31 `fetch` trần ngoài `api.js` (Orders, Sales, InvoiceSettings, Customers, CustomerSearch…) — việc cũ, không phải việc này.
- `npm run lint`: còn các lỗi có sẵn (BanHangMoi `layThe`, ThuTien `tong`, ManKhach, DonAppNoi/InPhieu fast-refresh…); file mới `ThongBao.jsx` + `thongBaoKho.js` sạch.

## Báo cáo 7 mục
```
VIỆC:        BAO-1a — Mọi thao tác ngoài Cài đặt báo rõ, dễ hiểu, luôn nhìn thấy
ĐÃ SỬA:      client/src/components/thongBaoKho.js (mới, kho thông báo) · components/ThongBao.jsx (mới, vẽ) · components/Layout.jsx (gắn một lần, nút "gửi lại việc kho") · index.css (thông báo nổi + nút khoá mờ)
             28 màn/thành phần nối thông báo (bảng trên): Orders, Refunds, InvoicePrint, Sales, Customers, DonApp, DonThu, Registrations, DiscountCodes, InvoiceSettings, Reports, GiaoHang, ViKhach, CapHang, DoiSoat, ThongTinMon, MaDangNhapApp, CustomerSearch, 9 màn Kho
             cong_cu/thu_BAO1a.js (mới, 99 ca) · kiem_tra_truoc_khi_giao.js (nối bài vào bộ kiểm) · client/dist (build lại)
BÀI THỬ:     chạy trên bản chưa vá (45fd10c) → ĐỎ: 7 đạt · 74 hỏng (bản bài thử cuối); sau khi vá → XANH 99 đạt · 0 hỏng; đột biến 26/26 BẮT
ĐÃ RÀ K4:    grep "alert(" trong client/src → 11 chỗ (Orders 8 · Refunds 2 · InvoicePrint 1), đã xử lý hết, còn 0 · grep "setError|setSuccess|setLoi|setThongBao|setMsg" các màn trong phạm vi → xử lý theo bảng, phần còn lại ghi ở Phát hiện · {error} / {loi} còn vẽ: chỉ lỗi TẢI + lỗi nhập thiếu cạnh ô
CHƯA KIỂM:   (1) chưa mở trình duyệt thật: không chụp được thông báo nổi hiện trên điện thoại / có đè lên popup không (CSS z-index 10000; popup cao nhất tìm thấy bằng grep là 9999) · (2) chưa thử tay từng nút (bài thử khoá khung thành phần + mỗi màn đã nối + cờ khoá nút, KHÔNG gọi từng nút thật) · (3) "Đã in hóa đơn" dựa vào sự kiện đóng hộp in của trình duyệt · (4) lời gọi thông báo trong hàm cập nhật `setCart` của Sales chưa chạy thật ở StrictMode · (5) chưa hết lỗi lint có sẵn của kho
GIT:         ad82b074 bằng chứng đỏ · 8229fe92 vòng sửa 1 · 99abceec màn · 52e48854 thành phần (trên nền 45fd10c)
BÀI HỌC:     (xem mục Bài học)
```

## Bài học
- **KHOÁ 1** — `thu_BAO1a.js` D1 bánh cóc `alert(` ≤ 0 + D2 danh sách màn đã nối + D4 cờ khoá nút: làm luôn (file trong Phạm vi). Lý do: lỗi "báo ở chỗ khuất" tái phạm im lặng nếu không có phép đếm.
- **KHOÁ 2** — người gác chặn `git mv`, `sed -i`, hai lệnh `cd` trong một khối, `python3 … <<EOF` rồi `cd`: sửa file bằng Edit/Write, mỗi lệnh Bash chỉ một `cd` ở đầu. Không cần luật mới (người gác đã chặn đúng).
- **NGUYÊN TẮC 1** — đề xuất (ngoài Phạm vi, chat soát duyệt): thêm vào `KHUON_LOI.md` K4 một dòng "đổi cách báo lỗi của một màn → grep mọi chỗ vẽ biến lỗi cũ (`{error}`, `{loi}`) kể cả bên TRONG popup — Sales.jsx còn một khối `{error && …}` trong popup thanh toán, `no-undef` của lint mới bắt được".
- **NGUYÊN TẮC 2** — bài thử cũ khoá ĐÚNG chuỗi mã (thu_KHOIN1 B khoá `if (await ghi(() => api.post(.../in))) setKho(`): thêm tham số vào hàm dùng chung thì cho tham số MẶC ĐỊNH, đừng đổi dạng lời gọi cũ — đã gặp 1 lần (`ghi(lam, viec = 'in phiếu', tin)`).
- **BỎ** — kho git nông làm `thu_BH2.js` G1 đỏ "bad revision": một lần do máy mây, đã `--unshallow`.

## Soát độc lập — vòng 1 (agent `/ra-soat`, chép tóm lược; KHÔNG ĐẠT, lỗi nhẹ–vừa, không đụng tiền / máy chủ)
1. D2 xanh oan: chỉ dò import, gỡ lời gọi `baoXong` vẫn 69 đạt → **đã sửa**: D2 đếm lời gọi tối thiểu từng file (bảng `MAN_DA_RA`), đột biến `BV-REFUNDS-GO-LOI-GOI`.
2. D4 xanh oan: chỉ cần 1 chỗ `disabled` → **đã sửa**: đếm tối thiểu số nút từng file (`KHOA_NUT`), đột biến `BV-DINHMUC-MO-NUT-LUU-MON`.
3. Quá 3 thông báo bỏ cái cũ nhất kể cả đỏ chưa đọc → **đã sửa** `thongBaoKho.js`: bỏ xanh cũ nhất trước; ca A11, A12; đột biến `VS-DAY-DO-CU-NHAT`.
4. `Sales.setError` bỏ qua `lyDoLoi` → **đã sửa** (chữ kỹ thuật → câu chung). `setError('')` không còn xoá thông báo đỏ (đỏ ở lại tới khi bấm ×): chủ ý, ghi nhận.
5. "Đã in hóa đơn" hiện cả khi khách huỷ hộp in → **đã sửa** câu thành "Đã gửi lệnh in hóa đơn …" (trình duyệt không phân biệt in / huỷ).
Nghi ngờ ghi nhận, không sửa: GiaoHang tự in tem lỗi có thể hiện lại sau mỗi lần poll 15 giây khi đã bấm ×; BanHang/** chưa đổi (Câu hỏi 1).
Sau vòng sửa 1: thu_BAO1a 99 ca xanh (gốc 45fd10c: 7 đạt · 74 hỏng), đột biến 26/26 BẮT, `npm test -- --day-du` PASS 113 · FAIL 0. Chưa gọi soát vòng 2 (chat soát duyệt).

✓ CỔNG CHẠY ĐẠT  (node tu_chay/cong.js chay . 45fd10c^ HEAD viec/BAO-1a; kèm CẢNH BÁO A16: gốc in 81 ca ≠ 99 ca ở head — bài đỏ nhiều ca trên gốc nên không dừng sớm; chấp nhận)
HEAD ĐÃ KIỂM: 21a39eee
