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

## Nghiệm thu — đếm từng mục (bằng chứng = ca của `cong_cu/thu_BAO1b.js`, 108 ca xanh)
- A dùng thông báo chung: A1, A1b–A1e (Settings.jsx), A2 (CaiDatChuong), A3 + A4 ×9 thẻ · bánh cóc `alert(` = 0 (thu_BAO1a D1)
- B báo tại chỗ: B1–B3 (LoiO + 9 thẻ), B4a–B4h (phép kiểm ô chạy thật, ngay trên/dưới ngưỡng), B5, B6 — hạn chế: GiaoHang chỉ kiểm "là số" (Phát hiện)
- C chưa lưu: C1a–e (thayDoiKho chạy thật), C2a–d, C3, C4a, C4 ×7 thẻ, C5 (Settings.doiThe), C6
- D PIN: D1a–b (laLoiPin chạy thật), D2a–e, D3a–g, D4
- E sau khi lưu: E1 ×7, E1b, E2 ×8, E3 ×6, E4
- F bộ kiểm: F1 · `--day-du` PASS 116 · FAIL 0 · CẢNH BÁO 1 (cảnh báo cũ: route GET có lệnh ghi)
- K5 không đổi máy chủ: `git diff 225bbde HEAD --stat -- server` rỗng; bài HANG-1 / KHO-IN-1 / NAP-1 / CT-1a / DIEM-MON-1 / MAN-KHACH-1 / GIAO-1 xanh trong `npm test`; D3g khoá luồng "Lưu không hỏi PIN"

## BÁO CÁO
```
VIỆC:        BAO-1b — Màn Cài đặt báo rõ mọi thao tác (gồm CAIDAT-BAO-1)
ĐÃ SỬA:      client/src/components/{ThanhLuu.jsx,HoiPin.jsx,LoiO.jsx,useThayDoi.js,thayDoiKho.js,loiPin.js,kiemCaiDat.js} (mới) · pages/CaiDat/*.jsx (9 thẻ) ·
             components/CaiDatChuong.jsx · pages/Settings.jsx (bỏ message/66 setMessage; Settings.doiThe hỏi lại; 3 nút ghi im lặng nay có báo) · index.css · client/dist
BÀI THỬ:     cong_cu/thu_BAO1b.js trên gốc 225bbde → ĐỎ 76 ca (A1 còn 66 setMessage …); sau khi vá → XANH 108/108; đột biến 61/61 BẮT (lần đầu 41 BẮT + 4 SỐNG → siết)
ĐÃ RÀ K4:    grep "setMessage|thongDiep|alert(|'Lỗi: ' +" trong Settings.jsx, pages/CaiDat, components → 0 chỗ còn; nút ghi im lặng trong Settings.jsx: 3 chỗ, đã xử lý
CHƯA KIỂM:   chưa mở giao diện thật bằng trình duyệt (vị trí thanh cố định, hộp PIN, hai thông báo cùng lúc) — chủ quán thử tay 3 thao tác dưới đây; HoiPin/ThanhLuu/useThayDoi
             chỉ khoá bằng dò mã nguồn + đột biến, không có phép chạy React thật; lần soát độc lập thứ 2 chưa chạy; baoXong(data.message) có thể trống nếu route gói không trả message
GIT:         xem git log --oneline -2 ở cuối
BÀI HỌC:     KHOÁ 3 · NGUYÊN TẮC 1 · BỎ 1
```
Thử tay trên điện thoại (chủ quán): (1) Cài đặt → Hạng thành viên: sửa % giảm rồi bấm Lưu → hộp hỏi PIN hiện; gõ sai PIN → chữ đỏ dưới ô PIN và dữ liệu còn nguyên; gõ đúng → thông báo xanh "Đã lưu … hạng".
(2) Sửa một ô ở Giờ hoạt động rồi bấm sang thẻ khác → máy hỏi "Còn thay đổi chưa lưu"; thanh vàng cuối màn có Bỏ / Lưu. (3) Ở Gói nạp bỏ trống Tên rồi Lưu → chữ đỏ ngay dưới ô Tên.

## Bài học
- KHOÁ 1 (đã làm): phép kiểm ô rút ra `kiemCaiDat.js` chạy thật, ca ngay trên/dưới ngưỡng + đột biến nới/siết (soát bắt: bài chỉ dò chuỗi, nới 90 → 900 vẫn xanh). Lý do: K3.
- KHOÁ 2 (đã làm): ca B5 cấm viết lại số ngưỡng trong thẻ; K4a khoá chốt `taiLoi` của nút phụ. Lý do: K4.
- KHOÁ 3 (đã làm): bốn ca quá lỏng (D2c, A4, E2, E4) lộ qua đột biến SỐNG → siết; đề xuất ngoài Phạm vi: không.
- NGUYÊN TẮC 1 (đề xuất, KHUON_LOI.md ngoài Phạm vi): K4 — thêm nút/đường ghi phụ (thanh chưa lưu) thì mọi chốt chặn của nút chính (taiLoi, dangLuu) phải áp luôn cho nút phụ; và `tai()` sau một thao tác ghi cục bộ nạp đè phần đang gõ ở chỗ khác (BAO-1b ManKhach.luu, HangThe xoá hạng).
- BỎ 1: git kho nông làm BH2 G1 đỏ lúc đầu (môi trường, một lần) — đã `--unshallow`.
- Dọn KHUON_LOI/CLAUDE: không đề xuất xoá.

✓ CỔNG CHẠY ĐẠT (A16 cảnh báo: gốc in 93 ca vì C0/D0 không nạp được module chưa có — bình thường)

HEAD ĐÃ KIỂM: f8d3e500

## Vòng sửa 2 + 3 và soát lần 2 (chat soát 11.11, chạy 12.11)
Vòng sửa 2 (commit 60f5a18): (1) `tai({ giu })` ở HangThe (xoá hạng) và GiaoHang (lưu điểm lấy hàng) không nạp đè phần đang gõ — hàm thuần `ghepSauTai`
(`kiemCaiDat.js`), ảnh chụp vẫn là số máy chủ giữ; (2) `baoXong` không bao giờ trống (`thongBaoKho.js`: dự phòng "Đã xong"; Settings.jsx lưu gói / hoàn tác claim có
câu riêng); (3) lỗi tải Settings.jsx (`loadData`, `loadBackupInfo`) báo bằng `baoLoiTu`, hết `console.error`. Bài thử: nhóm G (G0–G6c) đỏ 11 ca trên mã cũ → xanh; 17 đột biến mới.
Soát độc lập lần 2 (agent riêng, báo cáo chép nguyên): ĐẠT, còn lỗi nhẹ.
```
ĐẠT (còn vài lỗi nhẹ, không đụng tiền, không lộ thông tin, không chặn oan luồng hợp lệ)
LỖI 1  Settings.jsx:370 `.catch(() => {})` nuốt lỗi tải danh sách sản phẩm của popup gói — K4  → ĐÃ SỬA vòng 3 (G6d + BV-SETTINGS-GOI-NUOT-LOI)
LỖI 2  HangThe.jsx:42-46 / kiemCaiDat.js:9-12: khi giu, hạng chỉ có ở máy chủ nối CUỐI ds còn ảnh chụp xếp theo sort_order → thanh "chưa lưu" hiện oan (hiếm: thiết bị khác thêm hạng đúng lúc đang xoá) — K3/K4 → CHƯA SỬA, ghi Phát hiện
LỖI 3  `onBo={tai}` truyền event vào `tai({ giu } = {})` — event.giu undefined nên đúng ý; rất nhẹ → CHƯA SỬA, ghi Phát hiện
CHƯA SOÁT: --day-du quá giờ lúc soát (phiên chính đã chạy lại: PASS 116 · FAIL 0), không chạy dot_bien, không thử tay.
BÀI HỌC (soát): K4 — sửa mẫu "lỗi chỉ ghi log" thì grep luôn `.catch(() => {})`; K3 — hàm ghép danh sách cần ca thứ tự.
```
Vòng sửa 3 (commit b188799): lỗi 1 — bài G6d đỏ trên code vòng 2 (125 đạt · 1 hỏng) → vá → 126 đạt · 0 hỏng; đột biến 79/79 BẮT (thêm BV-SETTINGS-GOI-NUOT-LOI).
Luật 6.5: lỗi còn lại (2, 3) đều NHẸ, không đụng tiền / ví / điểm / lộ thông tin / ngoài Phạm vi — không hỏi chủ quán, ghi Phát hiện. Đây là vòng sửa 3 (≤ 3), không cần vòng 4.
Phát hiện thêm (chưa sửa): lỗi 2 và 3 ở trên. Cách gọn khi làm sau: `ghepSauTai` trả kết quả sắp theo `sort_order` giảm dần; đổi `onBo={() => tai()}`.
Bảng đột biến mới (vòng 2–3): ghepSauTai · VS-GHEP-LUON-LAY-MAYCHU · BV-GHEP-GIU-HANG-DA-XOA · BV-GHEP-BO-HANG-MOI-MAYCHU · BV-GHEP-MAT-HANG-CHUA-LUU; HangThe · BV-HANG-XOA-NAP-DE · BV-HANG-GIU-KHONG-GHEP · BV-HANG-GIU-DE-LAMTRON · VS-HANG-LUU-CUNG-GIU; GiaoHang · BV-GIAOHANG-DIEMLAY-NAP-DE · BV-GIAOHANG-GIU-DE-O · VS-GIAOHANG-GIU-BO-CHUP; baoXong · BV-BAOXONG-CAU-TRONG · VS-BAOXONG-LUON-DA-XONG; Settings · BV-SETTINGS-GOI-MESSAGE-TRAN · BV-SETTINGS-HOANTAC-MESSAGE-TRAN · BV-SETTINGS-TAI-CONSOLE · BV-SETTINGS-BACKUP-CONSOLE · BV-SETTINGS-GOI-NUOT-LOI.

## Nghiệm thu (cập nhật sau vòng 3 — bằng chứng = ca `cong_cu/thu_BAO1b.js`, 126 ca xanh)
A (A1–A4) · B (B1–B6, B4a–h) · C (C1–C6) · D (D1–D4) · E (E1–E4) · F (F1; `--day-du` PASS 116 · FAIL 0 · CẢNH BÁO 1 cũ) · K5 (server không đổi) — đủ 7/7 mục, chi tiết ở bảng nghiệm thu phía trên; vòng 2–3 thêm nhóm G (G0–G6d).

## BÁO CÁO (bản cuối, thay bản trên)
```
VIỆC:        BAO-1b — Màn Cài đặt báo rõ mọi thao tác (gồm CAIDAT-BAO-1)
ĐÃ SỬA:      vòng 2–3: client/src/components/{kiemCaiDat.js (ghepSauTai),thongBaoKho.js (baoXong không trống)} · pages/CaiDat/{HangThe,GiaoHang}.jsx (tai({ giu })) ·
             pages/Settings.jsx (2 chỗ baoXong có câu dự phòng, 3 chỗ lỗi tải → baoLoiTu) · client/dist · cong_cu/thu_BAO1b.js (nhóm G) · viec/BAO-1b/dot_bien.py
BÀI THỬ:     thu_BAO1b.js nhóm G trên mã trước vòng 2 → ĐỎ 11 ca; G6d trên mã vòng 2 → ĐỎ 1 ca; sau vá → XANH 126/126; đột biến 79/79 BẮT
ĐÃ RÀ K4:    grep "tai()" sau thao tác ghi cục bộ trong pages/CaiDat + CaiDatChuong → HangThe xoá hạng, GiaoHang lưu điểm: đã xử lý; còn lại chỉ nạp danh sách riêng.
             grep "console.error|\.catch\(\(\) => \{\}\)|baoXong\(<biến>.message\)" Settings.jsx → 0 chỗ còn
CHƯA KIỂM:   chưa mở giao diện thật bằng trình duyệt; phần nạp lại chỉ khoá bằng hàm thuần + dò mã + đột biến, không chạy React thật; lỗi nhẹ 2 (thứ tự ds so với ảnh chụp
             khi thiết bị khác thêm hạng) và 3 (onBo={tai}) chưa sửa; Render/Turso thật chưa thử
GIT:         b188799 BAO-1b: vòng sửa 3 … · 60f5a18 BAO-1b: vòng sửa 2 …
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 1 · BỎ 0
```

## Bài học (vòng 2–3)
- KHOÁ 1 (đã làm): G6c/G6d khoá "hết console.error và hết .catch(() => {})" ở Settings.jsx; G1 chạy thật ghepSauTai; G4 chạy thật baoXong. Lý do: K4 — soát nêu chỗ cùng khuôn mà phép trước chỉ canh một dạng.
- KHOÁ 2 (đề xuất, chưa làm — việc sau): ca thứ tự cho `ghepSauTai` (kết quả phải cùng thứ tự với ảnh chụp). Lý do: K3.
- NGUYÊN TẮC 1 (đề xuất, KHUON_LOI.md ngoài Phạm vi): K4 — sửa mẫu "lỗi chỉ ghi log" thì grep cả `.catch(() => {})`; hàm ghép danh sách sau nạp lại phải giữ cùng thứ tự với ảnh chụp dùng để so "có thay đổi".
- BỎ: kho nông làm BH2 G1 đỏ lần nữa (môi trường) — đã `--unshallow`.

✓ CỔNG CHẠY ĐẠT (A16 cảnh báo: gốc in 106 ca, head 126 — bài dừng sớm trên gốc vì chưa có module, bình thường)

HEAD ĐÃ KIỂM: b1887991
