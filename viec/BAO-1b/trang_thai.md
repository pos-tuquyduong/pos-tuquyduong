# BAO-1b — trạng thái

## Bước 1 · đối chiếu bản chụp
- Nhánh: `viec/BAO-1b`. Cây sạch lúc mở. Hai SHA: HEAD `225bbde` = FETCH_HEAD (hai phép `merge-base --is-ancestor` đều đúng → bằng nhau, không kéo).
- Kho mở dạng nông (`is-shallow: true`) → bộ kiểm BH2 G1 đỏ vì thiếu commit `cbbb809`; chạy `git fetch --unshallow origin viec/BAO-1b` (chỉ tải lịch sử, không đổi file) rồi bộ kiểm hết lỗi đó.
- `git log --oneline -3` lúc mở:
  ```
  225bbde PHIEU: BAO-1b
  53a71a2 TIEN-DO: DIEM-MON-1, VI-ME-1, BAO-1a xong; them QUET-1, BO-MAN-CU-1, MATKHAU-1 (truoc khai truong), DOI-DIEM-1, QUET-2 (cuoi danh sach); quyet dinh 11.11; KHUON_LOI bo sung; bo attached_assets/ khoi kho
  4d458c2 DON-DEP: xoa 18 patch_pos_*.py + 3 lui_*.sh + update.zip o goc kho (va tay thang 9-10 da ap dung, lich su con trong git; chu quan duyet 11.11)
  ```
- Không có thông báo đổi model giữa phiên.

## Đã làm
- Thành phần dùng chung (6 file `client/src/components/`): `thayDoiKho.js` (sổ thẻ nào còn thay đổi) · `useThayDoi.js` (so ảnh chụp lúc tải với giá trị đang gõ) ·
  `ThanhLuu.jsx` (thanh cố định cuối màn "Có thay đổi chưa lưu" + Bỏ / Lưu) · `HoiPin.jsx` + `loiPin.js` (ô nổi hỏi PIN; PIN sai báo dưới ô, giữ dữ liệu) · `LoiO.jsx` (chữ đỏ dưới ô).
- 9 thẻ `pages/CaiDat/*` + `CaiDatChuong.jsx`: bỏ `thongDiep`, báo bằng `baoXong` / `baoLoiTu`, lỗi dưới ô bằng `<LoiO`.
- `Settings.jsx`: bỏ `message` / dải chữ đầu trang / 66 lời gọi `setMessage`; thêm hỏi lại khi chuyển thẻ còn thay đổi; bảng giá có thêm thanh cố định; 3 nút ghi trước đây im lặng
  (bật/tắt gói, bật/tắt quà, ẩn quà) giờ báo xong / lỗi.
- `HangThe` + `GoiNap`: bỏ ô PIN cạnh nút; bấm Lưu / Xoá / Bật / Tắt → hỏi PIN bằng ô nổi.
- `cong_cu/thu_BAO1b.js` (108 ca sau vòng sửa 1) nối vào `kiem_tra_truoc_khi_giao.js`; `dot_bien.py` 61 đột biến.

## Bảng chỗ vá → đột biến (cổng A17 / A18) — 61/61 BẮT, đối chứng xanh (`python3 viec/BAO-1b/dot_bien.py`)
| Chỗ vá | Đột biến |
|---|---|
| thayDoiKho.js đặt / gỡ | BV-THAYDOI-KHONG-GO · VS-THAYDOI-GO-HET |
| ThanhLuu.jsx | BV-THANHLUU-KHONG-DANG-KY · VS-THANHLUU-KHONG-GO-KHI-DONG · VS-THANHLUU-LUON-HIEN · BV-THANHLUU-MO-NUT · BV-THANHLUU-NUT-BO-GOI-LUU |
| useThayDoi.js | BV-USETHAYDOI-CHUA-CHUP · VS-USETHAYDOI-SO-SAI |
| thẻ dùng thanh lưu | BV-GIOHD-BO-THANHLUU · BV-MANKHACH-BO-THAYDOI |
| Settings.doiThe | BV-SETTINGS-DOITHE-KHONG-HOI |
| CSS thanh lưu / lỗi ô | BV-CSS-THANHLUU-KHONG-CODINH · BV-CSS-LOIO-KHONG-DO |
| loiPin.js | VS-LOIPIN-CHI-SAI · VS-LOIPIN-NOI-LONG · VS-LOIPIN-KHONG-NEO-DAU |
| HoiPin.jsx | BV-HOIPIN-DONG-KHI-PIN-SAI · VS-HOIPIN-LOI-KHAC-O-LAI · BV-HOIPIN-BO-LOI-O · BV-HOIPIN-BO-THONGBAO · BV-HOIPIN-NUT-KHONG-KHOA · BV-HOIPIN-GIU-PIN-CU |
| HangThe / GoiNap qua HoiPin | VS-HANG-LUU-MO-VI-PIN · BV-HANG-BO-HOIPIN · BV-HANG-PIN-LUON-O-CANH-NUT · BV-HANG-PIN-KHONG-LOI-DUOI-O · BV-GOINAP-PIN-DAU-THE |
| luồng hợp lệ (Lưu không hỏi PIN) | VS-GIOHD-HOI-PIN |
| bỏ message / alert / thongDiep | BV-SETTINGS-MESSAGE-TRO-LAI · BV-SETTINGS-ALERT-TRO-LAI · BV-HANG-THONGDIEP-TRO-LAI · BV-CHUONG-THONGDIEP-TRO-LAI · BV-TICHDIEM-BO-NOI-THONGBAO |
| LoiO | BV-LOIO-LUON-TRA · BV-GOINAP-BO-LOI-O-TEN · BV-GIAOHANG-BO-LOI-O |
| lưu xong nạp lại | BV-HANG-BO-TAI-LAI · BV-GIOHD-BO-TAI-LAI · BV-MANKHACH-BO-TAI-LAI · BV-GIAOHANG-BO-TAI-LAI · BV-INPHIEU-BO-TAI-LAI |
| nút đang xử lý | BV-GIAOHANG-NUT-LUU-KHONG-KHOA · BV-INPHIEU-CHU-DANG-LUU · BV-TICHDIEM-MO-CONG-TAC |
| phép kiểm ô `kiemCaiDat.js` (vòng sửa 1) | BV-KIEM-HANG-KHONG-KIEM · VS-KIEM-PT-NOI-900 · VS-KIEM-PT-CHAN-89 · VS-KIEM-THANG-NOI-61 · VS-KIEM-THANG-CHAN-2 · BV-KIEM-GOI-TRUNG-THANG · VS-KIEM-GIAY-NOI-121 · VS-KIEM-GIAY-CHAN-4 · VS-KIEM-NGUNG-NOI-601 · VS-KIEM-SO-LE-QUA · BV-HANG-TU-VIET-LAI-NGUONG |
| vòng sửa 1 khác | BV-MANKHACH-LUU-KHONG-CHAN-TAILOI · VS-HOIPIN-GIU-PIN-SAU-KHI-XONG · BV-HOIPIN-TIEU-DE-CUNG · BV-GOINAP-SO-LE-QUA · BV-THANHLUU-CHE-NUT |
Lần chạy đầu: 41 BẮT · 4 SỐNG (D2c, A4, E2, E4 quá lỏng) → siết ca → 45/45 BẮT.

## Rà K4 (đường song song)
- `grep "setMessage\|thongDiep\|\bmessage\b"` trong `Settings.jsx`, `pages/CaiDat/`, `components/CaiDatChuong.jsx` → 0 chỗ còn.
- `grep "alert("` toàn `client/src` → 0 (bánh cóc BAO-1a giữ 0; không còn gì để hạ).
- Nút ghi im lặng trong Settings.jsx (K4: cùng khuôn "ghi mà không báo"): `togglePkg`, `toggleReward`, `deleteReward` — đã báo.

## Phát hiện (ngoài Phạm vi / chưa làm — không sửa)
- `CaiDatChuong` (chuông đơn App) nằm cùng tab Giờ hoạt động: KHÔNG gắn thanh "chưa lưu" (hai thanh cố định sẽ chồng nhau) — nút Lưu riêng vẫn ở dưới ô. Muốn có thì gộp hai thẻ thành một lần lưu (việc sau).
- `ChuongTrinh`: phần "khoảng tuổi" không có thanh "chưa lưu" (có nút Lưu riêng ngay dưới) — cùng lý do chồng thanh với form chương trình.
- Các tab trong `Settings.jsx` (Ưu đãi khách mới, Điểm thưởng, Flash sale, Nhân viên, Phân quyền…) chỉ chuyển sang thông báo chung, CHƯA có thanh "chưa lưu" (phiếu chỉ đòi thanh cho các thẻ có ô sửa nhiều; bảng giá đã có sẵn bộ đếm riêng).
- `window.confirm` (xoá gói, hoàn tác claim, thu hồi màn, khôi phục sao lưu) giữ nguyên — phiếu chỉ cấm `alert(`.

## Soát độc lập (/ra-soat) — lần 1: KHÔNG ĐẠT → vòng sửa 1
Lỗi soát nêu và cách xử lý: (1) K3 phép kiểm ô phía quầy không có ca thử/đột biến → rút ra `components/kiemCaiDat.js`, ca B4a–B4h ngay trên/dưới ngưỡng + 11 đột biến;
(2) K4 `ManKhach.luu` thiếu chốt `taiLoi` mà thanh chưa lưu gọi được → thêm; (4) PIN còn trong state sau khi xong → xoá; (5) tiêu đề thông báo PIN cứng → theo việc (`ten`);
(7) GoiNap số lẻ → bắt dưới ô; (8) gói trùng số tháng → bắt dưới ô; (9) thanh che nút cuối form → chừa chỗ `.thanh-luu-cho`.
Chưa sửa, ghi Phát hiện: (3) `tai()` sau xoá hạng / lưu địa chỉ nạp đè ô đang gõ ở chỗ khác của cùng thẻ; (6) GiaoHang kiểm quầy chỉ "là số" (km 1–50 một số lẻ, phút nguyên, SĐT, giờ nhận do máy chủ kiểm, lỗi hiện ở ô chung kèm tên khoá);
nghi ngờ `baoXong(data.message)` trống nếu route gói không trả `message`; lỗi tải (đọc) ở Settings.jsx vẫn chỉ `console.error`.
Lần soát 2 chưa chạy (xem Câu hỏi — chờ chủ quán/chat soát quyết cách tiếp).

## Soát bảo mật
Phiếu: `không`.

## Câu hỏi
(không có câu hỏi nghiệp vụ) Vòng sửa 1 xong; chưa chạy lại agent soát lần 2 — chat soát hoặc /ra-soat lần 2 quyết.

## Phát hiện bổ sung (từ soát lần 1, chưa sửa)
- HangThe.jsx (xoá hạng → `await tai()`) và GiaoHang.jsx (`datDiemLay` → `await tai()`) nạp đè phần đang gõ dở ở chỗ khác của thẻ; GoiNap / ChuongTrinh bấm "Sửa" khi form khác đang dở bỏ form cũ không hỏi.
- GiaoHang: phép kiểm số phía quầy lỏng hơn máy chủ (`server/utils/giaoHang.js`), chưa có `<LoiO>` riêng cho giờ nhận và SĐT.
