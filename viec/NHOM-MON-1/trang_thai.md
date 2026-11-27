# NHOM-MON-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
SHA: HEAD 7238492 · FETCH_HEAD 7238492 (bằng nhau)
7238492 PHIEU: NHOM-MON-1
acc8892 Merge pull request #104 from pos-tuquyduong/viec/TIEN-KHOA-2
302560a TIEN-KHOA-2: trang thai ghep main 9a5defdf, HEAD DA KIEM 6f39911b — chat ban 41

## Tiến độ
- Bước 3 xong: `ke_hoach.md` đã soát bởi agent phụ (mục 5). Phiếu "Chờ duyệt kế hoạch" → DỪNG. Chưa viết code.
- Kho nông (shallow) làm `thu_BH2.js` G1 đỏ (`cbbb809` thiếu); đã `git fetch --unshallow` (chỉ tải lịch sử).

## Câu hỏi (chờ chủ quán)
- Q1: chặn xoá nhóm gốc juice/tea (409 NHOM_GOC)? Đề xuất: có.
- Q2: thêm `server/utils/donApp.js` vào Phạm vi (đổi 1–2 dòng để đơn App lọc nhóm qua cùng hàm)? Đề xuất: có.
- Q3: màn khách lọc theo "hiện ở quầy"? Đề xuất: có.

## Chủ quán duyệt kế hoạch (27.11)
Q1 có (409 NHOM_GOC, vẫn đổi tên được) · Q2 có (thêm `server/utils/donApp.js` vào Phạm vi) · Q3 có (màn khách theo "hiện ở quầy").
## Câu hỏi
- Người gác [G1-PHIEU] chặn máy sửa `phieu.md` → chủ quán tự thêm dòng `- server/utils/donApp.js` vào `## Phạm vi` (sau dòng `server/utils/manKhach.js`). Máy làm phần sửa `donApp.js` ở MỘT commit riêng, cuối cùng.
- Người gác [G5-NGOAIPV] chặn thêm 2 bài thử NGOÀI Phạm vi khoá danh sách trắng trường món (LUAT §6.7 cho sửa, nhưng cổng máy chặn): `cong_cu/thu_KH1.js:529` (E5, mảng KHOA) và `cong_cu/thu_KHSP1.js:45` (`COT_MOI`, C3). Cần thêm 2 trường `nhom_ten`, `nhom_thu_tu` vào đúng hai danh sách đó (vẫn so BẰNG). Chủ quán thêm hai file vào `## Phạm vi` cùng dòng `server/utils/donApp.js`; máy làm ở commit cuối.
- Ở thu_KHSP1.js: `COT_MOI` (không phải KHOA_MENU_CU) là chỗ thêm. Chưa sửa vì bị chặn.
- Giả lập quầy (`--day-du`, cong_cu/gia_lap/chay.js KB24 / thu_gia_lap.js) đỏ vì `cong_cu/gia_lap/kich_ban.js:585` và `:599` tạo món bằng `POST /products` với `category: 'khac'` — mã nhóm không có → máy chủ giờ trả 400 NHOM_KHONG_CO (đúng nghiệm thu A3). Cần sửa hai dòng này `'khac'` → `'juice'` (ngoài Phạm vi, bị chặn). Chủ quán thêm `cong_cu/gia_lap/kich_ban.js` vào Phạm vi.
- Bài cũ `thu_KHO3a.js` đã đổi category 'tra' → 'tea' (trong Phạm vi) nhưng vẫn XANH trên gốc → phiếu cần mục `## Bài thử cũ sửa` ghi `cong_cu/thu_KHO3a.js` (cổng A11). Máy không sửa được phiếu.
- Tóm lại chủ quán cần sửa `phieu.md` (người gác chặn máy): (1) thêm vào `## Phạm vi`: `server/utils/donApp.js`, `cong_cu/thu_KH1.js`, `cong_cu/thu_KHSP1.js`, `cong_cu/gia_lap/kich_ban.js`; (2) thêm mục `## Bài thử cũ sửa` với `cong_cu/thu_KHO3a.js`. Rồi chạy `/lam-viec NHOM-MON-1 tiep` — máy làm nốt 5 sửa nhỏ (đã có chỗ sửa cụ thể ở trên).

> LỊCH SỬ: các mục `## Câu hỏi` và `## Còn chờ chủ quán` bên dưới là của ngày 27.11 — ĐÃ XONG sau commit 7a016c34 (chủ quán thêm Phạm vi). Số liệu mới nhất ở mục `## Trạng thái cuối` cuối file.

## Chỗ vá → đột biến (dot_bien.py — lúc đó 19/19 BẮT; nay 22/22, xem Trạng thái cuối)
| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| products.js `layMenuQuay(..., cho)` lọc app theo hien_app | VS-loc-app-theo-quay · VS-hai-cong-tac-chung · VS-nhom-chua-co-bi-an | A5a · A5a · A5f |
| products.js `menuApp` | BV-bo-loc-app | A5c |
| products.js `menuQuay` (màn khách) | VS-man-khach-theo-app | Q3a |
| products.js PUT /nhom/:ma (mã không đổi) | VS-doi-ma-khi-sua-ten | A2f |
| products.js DELETE /nhom/:ma còn món / nhóm gốc | VS-xoa-nhom-con-mon · BV-bo-chan-nhom-goc | A2j · A2l |
| products.js PUT /nhom-thu-tu | VS-thu-tu-khong-doi · BV-bo-kiem-danh-sach-thu-tu | A2h · A2i |
| products.js POST / PUT món kiểm nhóm | VS-category-tu-do-lot · BV-bo-kiem-nhom-post · BV-bo-kiem-nhom-put | A3b · A3b · A3a |
| 035_nhom_mon.js INSERT OR IGNORE | VS-035-chen-khong-bo-qua | A1d |
| kh/index.js nhom_ten / nhom_thu_tu | VS-menu-bo-nhom-ten | A5b |
| donApp.js menuApp (đã sửa thật sau khi chủ quán thêm Phạm vi) | BV-don-app-khong-loc | A5i |
| BanHangMoi.jsx lọc nhóm tắt quầy / tên nhóm | BV-ui-bo-loc-quay · VS-ui-ten-cung | A4e · A4e |
| SanPham.jsx ô chọn nhóm | VS-san-pham-go-tay | A3e |

## Soát độc lập — vòng 1 (agent độc lập, báo cáo nguyên văn rút gọn các đoạn lặp)
KHÔNG ĐẠT — lý do chính: A5 chưa thoả (đơn App vẫn đặt được món nhóm tắt, A5i đỏ, đã biết) và `--day-du` còn 4 phép đỏ (đều thuộc mục chờ chủ quán).
Đã chạy lại: thu_NHOMMON1 46 đạt · 1 hỏng (A5i); dot_bien 19/19 BẮT (đối chứng chạy trên bản sao đã áp BAN_DON_APP); `--day-du` PASS 127 · FAIL 4 (thu_KH1 E5, thu_KHSP1 C3, gia_lap KB24/KB25, thu_gia_lap — đúng các mục đã biết); P1 dist KHỚP src.
LỖI TÌM ĐƯỢC:
1. HOP_DONG_API_KH.md (v19) + BAO_APPKH.md hứa "đặt đơn/báo giá món nhóm tắt → 400 MON_KHONG_BAN" nhưng donApp.js:26,154 chưa lọc — K1. Phải đi cùng PR với bản sửa donApp.
2. products.js PUT /:id + SanPham.jsx: máy chủ kiểm coNhom cả khi category không đổi; UI luôn gửi lại category → món có category lạ không sửa được giá/tên — K5 (nhẹ).
3. kho/nhapSx.js:183–184 `INSERT OR IGNORE INTO pos_products … category = m.loai` không qua coNhom → món mồ côi — K4 (ngoài Phạm vi).
4. trang_thai.md thiếu dòng "các dòng BanHangMoi.jsx đã đổi để TOPPING-1 giữ"; chưa có npm test / cong.js chay / 3 thao tác chủ quán thử tay.
NGHI NGỜ: 035 TRIM vs JOIN không trim; LEFT JOIN pos_nhom_mon nếu bước nâng cấp hỏng → menu 500; PUT /nhom/:ma `{hien_quay: null}` → 0; state `nhom` không reset khi nhóm đang chọn bị tắt; backup khôi phục chưa đọc khoiPhuc.js; món nhóm tắt quầy đã nằm trong giỏ vẫn thanh toán được (hợp lý, chưa có ca).
K3: A2l chưa rỗng thật; A5j/A5k thiếu status===200; A4e/A3e/A6/A7d chỉ regex nguồn; thiếu đột biến: NHOM_GOC trong 035, tenNhomTrung ở PUT, giới hạn 40 ký tự, 404 của PUT, checkPermission từng route, authenticate /nhom*.
NGHIỆM THU: 6/7 (thiếu A5 — đơn App).
CHƯA SOÁT ĐƯỢC: npm test, cong.js chay, chạy giao diện thật, utils/khoiPhuc.js, dữ liệu Turso thật.
BÀI HỌC (đề xuất của agent): KHOÁ — phép "mọi nơi ghi category đều qua coNhom"; ca K5 PUT món giữ category ngoài bảng. NGUYÊN TẮC — ca xanh kiểu "không phải lỗi X" phải kèm khẳng định dương; ca "RỖNG" dựng rỗng thật; không viết vào hợp đồng gửi chat khác hành vi chưa merge.

## Vòng sửa 1 (đã làm)
- Lỗi 2: `products.js` PUT /:id chỉ kiểm nhóm khi category ĐỔI (`doi.category !== cu.category`); ca mới A3f (đỏ khi bỏ vế đó: VS-put-kiem-ca-khi-khong-doi).
- NGHI NGỜ TRIM: `035_nhom_mon.js` gom theo `category` nguyên văn (không TRIM) để JOIN khớp; ca mới A1f + đột biến VS-035-trim-ma.
- K3: A2l dựng nhóm tea rỗng thật; A5j/A5k thêm `status === 200`. Số ca thu_NHOMMON1: 49 (HEAD thật 48 đạt · 1 hỏng A5i). Đột biến 21/21 BẮT.
- Lỗi 1: ĐÃ SỬA ở vòng sau — `server/utils/donApp.js` dùng `menuApp()` (commit 3a2e29ff); hợp đồng v19 nay đúng với code.
- Lỗi 4: dòng BanHangMoi.jsx đã đổi cho TOPPING-1 giữ: bỏ `TEN_NHOM` (cũ dòng 28); khối `spQuay` / `tenNhom` / `dsNhom` / `dsMon` (≈ 336–342); nhãn tab `tenNhom[n] || n` (≈ 352). `nhomTheoMa` dùng `sp` đầy đủ (giữ nguyên).

## Phát hiện (không sửa — ngoài Phạm vi)
- `server/kho/nhapSx.js:183`: chèn pos_products với `category = m.loai` không qua coNhom; nếu SX có loại khác juice / tea sẽ sinh món chưa có nhóm (vẫn hiện, chủ quán không quản được nhóm đó). Đề xuất: bước 035 đã tạo nhóm cho giá trị có sẵn; việc sau thêm `INSERT OR IGNORE pos_nhom_mon` vào nhapSx.js.
- `server/routes/quang-cao.js:104` giữ thấy mọi món (cố ý).
- LEFT JOIN `pos_nhom_mon` ở `layMenuQuay`: nếu nâng cấp 035 hỏng, menu quầy 500 (trước đây chỉ đường kho 503). Rủi ro thấp (035 chỉ CREATE + INSERT OR IGNORE); nếu muốn chặn hẳn, bọc try/catch — chưa làm (K: không đoán).
- Settings.jsx:1093 biểu tượng 🍵/🥤 vẫn theo mã `tea` (chỉ trang trí); tên nhóm đã theo `nhom_ten`.
- Thanh BanHangMoi: nhóm đang chọn bị tắt ở quầy giữa phiên → màn trống tới khi bấm "Tất cả" (danh sách tải một lần).

## Còn chờ chủ quán (không làm được từ máy)
1. Sửa `phieu.md`: Phạm vi thêm `server/utils/donApp.js`, `cong_cu/thu_KH1.js`, `cong_cu/thu_KHSP1.js`, `cong_cu/gia_lap/kich_ban.js`; thêm `## Bài thử cũ sửa` ghi `cong_cu/thu_KHO3a.js`.
2. Chạy lại `/lam-viec NHOM-MON-1 tiep`: máy làm 5 sửa nhỏ (donApp 2 dòng; thu_KH1 + thu_KHSP1 thêm 2 trường vào danh sách; kich_ban 2 dòng 'khac' → 'juice'), soát bảo mật (bước 8b), `cong.js chay`, `HEAD ĐÃ KIỂM`, báo cáo 7 mục.
3. 3 thao tác thử tay (sau khi xong): (a) Quản lý › Giá bán & nhóm món: đổi tên "Trà" → "Trà thảo mộc", mở màn Bán hàng thấy tab đổi; (b) tắt "Hiện trên App" của một nhóm → mở App KH thấy nhóm biến; (c) Kho › Sản phẩm: ô Nhóm là ô chọn.

## Soát bảo mật
Báo cáo (agent độc lập, nguyên văn; 0 lỗi trước lọc → 0 lỗi sau lọc, không cần bước lọc báo nhầm):
> Không tìm thấy lỗ hổng độ tin cậy cao trong các thay đổi của nhánh viec/NHOM-MON-1 (mốc 7238492d^ tới HEAD).
> Đã đọc: diff của server/nang_cap/035_nhom_mon.js, server/routes/products.js, server/routes/kh/index.js, server/utils/donApp.js, server/utils/manKhach.js, server/routes/backup.js, + danh sách route, phần đầu products.js, grep mọi chỗ gọi layMenuQuay / menuApp / menuQuay trong server/. Chưa đọc client/src, HOP_DONG_API_KH.md và các bài thử.
> - Quyền route /nhom*: GET /nhom và GET /nhom/xem-truoc dùng authenticate. POST /nhom, PUT /nhom-thu-tu, PUT /nhom/:ma, DELETE /nhom/:ma đều có checkPermission('manage_settings'). Không route nào bị mở.
> - SQL ghép chuỗi: `UPDATE pos_nhom_mon SET ${...}` lấy tên cột từ đối tượng `doi` chỉ gán các khóa cố định ten / hien_quay / hien_app; giá trị luôn qua `?`. `UPDATE pos_products SET ${...}` ở PUT món cũng whitelist (name, category, unit, sort_order, is_active). Không có đường tiêm SQL.
> - /api/kh/menu: chỉ thêm nhom_ten và nhom_thu_tu. Món nhóm tắt "hiện trên App" bị lọc bằng menuApp() trong layMenuQuay. Hai công tắc hien_quay / hien_app không được trả ra cửa khách. Không lộ giá vốn hay dữ liệu nội bộ.
> - Đơn App không đi vòng lọc nhóm: dungItems (donApp.js:154) tra món bằng menuApp(), cùng hàm với /menu; món nhóm đã tắt bị từ chối. Giá do server tự tra.
> - Màn khách dùng menuQuay() theo công tắc quầy; không mở thêm dữ liệu.
> - layMenuQuay() không lọc: GET /api/pos/products (authenticateServiceOrUser) và quang-cao.js (route nhân viên) — có xác thực, hành vi không đổi.
> - Lỗi trả { error, code } tiếng Việt, không lộ nội bộ. Đua: DELETE /nhom/:ma kiểm "không còn món" ngay trong câu xoá; PUT/POST món kiểm coNhom trong cùng giao dịch. Migration 035 chỉ tạo bảng + INSERT OR IGNORE, không có đầu vào người dùng. backup.js chỉ thêm tên bảng; dữ liệu là tên nhóm và hai công tắc, không nhạy cảm.

Sau soát: vòng soát độc lập 2 (agent khác) ĐẠT, rồi sửa nhẹ thêm 1 chỗ (PUT /nhom/:ma chỉ nhận 0 / 1 / "0" / "1" — ca A2g2, đột biến VS-cong-tac-nhan-null); sửa này không đụng cửa công khai và chỉ SIẾT kiểm đầu vào, soát bảo mật không cần lặp.
SOÁT BẢO MẬT: ĐẠT

## Trạng thái cuối (28.11)
- Chủ quán đã thêm Phạm vi (commit 7a016c34); máy đã làm nốt: donApp.js (menuApp), thu_KH1.js + thu_KHSP1.js (2 trường), kich_ban.js ('khac' → 'juice'), thu_KHO3a.js (đổi 'tra' → 'tea' + 1 ca đỏ trên gốc, KHÔNG ghi vào "Bài thử cũ sửa" theo LUAT §6.9).
- `npm test` / `--day-du`: PASS 131 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có sẵn từ trước, không thuộc việc này). thu_NHOMMON1.js 50 đạt · 0 hỏng (SỐ CA 50). dot_bien.py 22/22 BẮT, đối chứng xanh.
- Soát độc lập: vòng 1 KHÔNG ĐẠT → vòng sửa 1 → vòng 2 ĐẠT (lỗi nhẹ: trang_thai cũ — đã dọn; PUT /nhom/:ma nhận null — đã sửa).
- Dòng BanHangMoi.jsx đã đổi cho TOPPING-1 giữ: bỏ `TEN_NHOM` (cũ dòng 28); khối `spQuay` / `tenNhom` / `dsNhom` / `dsMon` (≈ 336–342); nhãn tab `tenNhom[n] || n` (≈ 352). `nhomTheoMa` vẫn dùng `sp` đầy đủ.

## Bài học
KHOÁ (đề xuất ngoài Phạm vi nếu không ghi "làm"):
1. Ca "POST /kh/don bị MON_KHONG_BAN khi nhóm tắt App" + đột biến gỡ menuApp khỏi dungItems — hiện chỉ có `/kh/gio/bao-gia` (chung `kiemVaBaoGia`). Đề xuất vào thu_NHOMMON1.js ở việc sau (cần luồng QR giả như thu_CKNOIDUNG1.js).
2. Phép kiểm trong kiem_tra_truoc_khi_giao.js: nhãn `label` của BACKUP_TABLES không chứa `: \ / ? * [ ]` (tên sheet Excel) — lỗi thật hôm nay: nhãn "Nhóm món (tab quầy / App)" làm sao lưu 500 (thu_KHO3a C3 đỏ). Đề xuất: ca đỏ = thêm nhãn có "/" vào bản sao backup.js.
3. Phép "mọi nơi ghi category đều qua coNhom" (agent soát vòng 1): quét `INSERT INTO pos_products` — bắt kho/nhapSx.js:183 (ngoài Phạm vi, ghi ## Phát hiện).
NGUYÊN TẮC:
- K4: thêm ràng buộc "giá trị phải nằm trong danh sách" cho một cột → grep MỌI bài thử / giả lập đang tạo dữ liệu với giá trị tự do ('khac', 'tra' — thu_KHO3a, kich_ban.js đã đỏ) và cả UI luôn gửi lại giá trị cũ (PUT chỉ kiểm khi giá trị ĐỔI).
- K5: ca "RỖNG" phải dựng rỗng thật (kể cả món ẩn); ca xanh kiểu "không phải lỗi X" phải kèm khẳng định dương `status === 200`.
- K7: nhãn / tên hiển thị đi vào định dạng ngoài (sheet Excel) phải qua ký tự cấm của định dạng đó; K1: lỗi phiếu chặn (người gác) → ghi Câu hỏi sớm, gom MỘT lần (lần này 3 lần).
BỎ: 035 TRIM so với JOIN (đã khoá bằng A1f); số dòng ngoài số liệu.
