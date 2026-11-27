# ANH-MON-1 — trạng thái (27.11.2026)

## Đối chiếu bản chụp (bước 1)
Phiên 1: nhánh `viec/ANH-MON-1`; HEAD = FETCH_HEAD = `38fb4dd`. Ba dòng log lúc mở:
```
38fb4dd PHIEU: ANH-MON-1
acc8892 Merge pull request #104 from pos-tuquyduong/viec/TIEN-KHOA-2
302560a TIEN-KHOA-2: trang thai ghep main 9a5defdf, HEAD DA KIEM 6f39911b — chat ban 41
```
Phiên 2 (sau khi chủ quán duyệt): hook kéo nhánh `e4c2f885 → 3058c747` (chat đã ghép main `25adb0fa` = NHOM-MON-1 #107 + TOPPING-1 #108 vào `180c5b61`, thêm Phạm vi `3058c747`).
Kho mở dạng nông nên `thu_BH2` G1 báo `bad revision cbbb809..HEAD`; đã `git fetch --unshallow origin viec/ANH-MON-1` (chỉ tải lịch sử) → xanh.

## Đã làm
- Máy chủ: bước `037_anh_mon.js` (bảng `pos_anh_mon`, `product_id` khoá chính = mỗi món một ảnh); `PUT/DELETE /api/pos/products/:id/anh` (`manage_settings`, id chỉ chữ số); `GET /api/pos/products/anh/:id/:phienBan` (công khai, `immutable`, `nosniff`); `anh` trong `layMenuQuay` (quầy + `/api/kh/menu` + màn khách + đơn App), `monKhach`, `GET /api/pos/kho/san-pham`. Kiểm kiểu ảnh dùng lại `loaiAnh` của `server/nd/tinh.js` (KHO-GON-2 chưa gộp → không viết hàm thứ hai). Kho ảnh hỏng → menu vẫn trả, `anh` null.
- Quầy: `AnhMon.jsx` (ô vuông, ảnh lười, khung cố định, chữ viết tắt màu) ở thẻ món, dòng giỏ, **ô topping trong khung chọn món** (`KhungChonMon.jsx`) và danh sách topping ở Kho (`ToppingMon.jsx`); màn Sản phẩm: chọn/chụp → cắt vuông → 400×400 WebP 0,7 (JPEG nếu máy không ra WebP) → tải; hiện cỡ; nút Xoá ảnh. `client/dist` đã build.
- Sao lưu (chủ quán duyệt): `server/routes/backup.js` `BANG_KHONG_XUAT_EXCEL = ['pos_anh_mon']`; `cong_cu/thu_SAOLUU2.js` D2c miễn ĐÚNG danh sách đó, thêm D2e–D2h.
- Hợp đồng `HOP_DONG_API_KH.md` v21 (ghi chú + nhật ký + khối máy đọc) và `viec/ANH-MON-1/BAO_APPKH.md`.
- Bài thử `cong_cu/thu_ANHMON1.js` (đã nối vào `kiem_tra_truoc_khi_giao.js`): 77 ca. Đột biến `viec/ANH-MON-1/dot_bien.py`: 34/34 BẮT.

## Bảng chỗ vá → đột biến (cổng A17 / A18)
| Chỗ vá | Đột biến |
|---|---|
| products.js kiểm kiểu theo byte (`loaiAnh`) | VS-anh-tin-duoi · VS-anh-webp-chi-RIFF · VS-anh-jpeg-hai-byte |
| anhMon.js giới hạn 120 KB + products.js 413 | VS-anh-khong-gioi-han · VS-anh-gioi-han-thap-mot · VS-anh-413-xoa-anh-cu |
| products.js quyền + khoá id số | BV-bo-kiem-quyen-anh · BV-bo-kiem-quyen-xoa-anh · VS-anh-quyen-chi-xac-thuc · BV-anh-id-khong-khoa-so · BV-anh-xoa-id-khong-khoa-so |
| products.js / anhMon.js đường đọc công khai | VS-anh-doc-can-dang-nhap · VS-anh-cache-ngan · VS-anh-bo-nosniff |
| phiên bản đường dẫn / một ảnh mỗi món / xoá | VS-anh-ten-co-dinh · VS-anh-doc-khong-kiem-pb · VS-anh-them-hang-moi · VS-anh-xoa-khong-xoa |
| menu quầy / kh/index.js / kho/duong.js / kho ảnh hỏng | BV-anh-menu-null · BV-kh-anh-cung-null · VS-kho-san-pham-khong-anh · VS-anh-menu-chet-theo-anh |
| giao diện quầy + Kho | BV-the-mon-khong-anh · BV-dong-gio-khong-anh · VS-AnhMon-luon-chu · VS-AnhMon-khong-lazy · BV-SanPham-bo-xoa-anh · VS-SanPham-chat-luong-1 · BV-topping-khung-khong-anh · VS-topping-khung-anh-sai-truong · BV-topping-kho-khong-anh |
| backup.js danh sách miễn (bài SAOLUU-2) | BV-saoluu-bo-danh-sach-mien · VS-saoluu-mien-them-bang-khac · VS-saoluu-mien-chi-trong-chu-thich |

## Soát bảo mật
Số lỗi trước lọc: 0 · sau lọc: 0 (không cần bước lọc). Báo cáo của subagent (nguyên văn, rút gọn đúng ý):

> Không tìm thấy lỗ hổng độ tin cậy cao trong thay đổi ANH-MON-1. Đã đọc diff `server/`, `HOP_DONG_API_KH.md`, `client/src/`, cùng `server/nd/tinh.js` (`loaiAnh`) và `server/index.js`; chưa đọc `AnhMon.jsx`, `SanPham.jsx`, `auth.js`; không chạy lệnh thử khai thác. Đã kiểm, đều không phải lỗ hổng: (1) XSS qua kiểu ảnh — `Content-Type` lấy từ `loaiAnh` (chỉ png / jpeg / webp), SVG / HTML không qua, thêm `nosniff`; (2) ghi đè ảnh khi thiếu quyền — `authenticate` + `checkPermission('manage_settings')` đứng trước `nhanAnh`; (3) SQL — mọi câu dùng `?`, `id` qua `Number()` hoặc `^\d+$`, `phienBan` `^[0-9a-f]+$`; (4) thứ tự đọc thân — thân JSON ra object → 400, không bypass kiểm byte; (5) đường đọc công khai — chỉ byte ảnh, phải biết đúng 12 ký tự băm, lỗi chỉ `error` + `code`; (6) `GET /kho/san-pham` vẫn `QUAN_LY`; (7) không lộ khoá / token / PIN, không path traversal. Ghi chú dưới ngưỡng: `DELETE /:id/anh` không kiểm món tồn tại (chỉ DELETE có điều kiện, không tác động bảo mật).

SOÁT BẢO MẬT: ĐẠT

## Soát độc lập `/ra-soat` (vòng 1) — báo cáo đầy đủ
KHÔNG ĐẠT (nhẹ: không đụng tiền / điểm / ví / bảo mật). Lỗi tìm được và cách xử lý:
1. `HOP_DONG_API_KH.md:240` tiêu đề "Ghi chú v19" sai (ảnh món là v21) — K1/K4 → **đã sửa** (v21 ở tiêu đề, dòng 247–248, ô `anh` ở bảng cửa trỏ "Ghi chú v21").
2. `BAO_APPKH.md:3` "từ v19" → **đã sửa** v21.
3. Số v19 còn sót ở `thu_ANHMON1.js:4`, `kiem_tra_truoc_khi_giao.js:828`, `ke_hoach.md` → **đã sửa** (grep lại `v19` các file đó).
4. `trang_thai.md` cũ hoàn toàn (còn "DỪNG", "71 ca", "23/23") → **đã viết lại** (file này).
5. `products.js` PUT/DELETE `/:id/anh` dùng `Number(req.params.id)` không khoá `^\d+$` (K4 — cùng khuôn PUT `/:id` dòng 116 và GET ảnh) → **đã sửa** bằng `soMon`; ca **D8 / D9 ĐỎ trên code chưa khoá** (D9: xoá nhầm ảnh món khác, HTTP 200), xanh sau; đột biến BV-anh-id-khong-khoa-so / BV-anh-xoa-id-khong-khoa-so.
NGHI NGỜ (đã xử lý / ghi Phát hiện): đột biến thiếu cho đường đọc công khai, `CACHE_ANH`, `nosniff` → **đã thêm** VS-anh-doc-can-dang-nhap · VS-anh-cache-ngan · VS-anh-bo-nosniff; "400 × 400" ghi rõ do quầy thu nhỏ (máy chủ không ép cỡ) → **đã sửa** ở hợp đồng + BAO_APPKH; còn lại → mục Phát hiện.
NGHIỆM THU (người soát): 7/8 có bằng chứng; thiếu = canvas thu nhỏ chạy trong trình duyệt thật + hai cổng chưa chạy lúc soát → xem CHƯA KIỂM; cổng chạy xong bên dưới.
Theo `LUAT_XAY_APP.md` mục 6.5: lỗi vòng 1 đều NHẸ và đã sửa trong vòng 1; chưa dùng hết 3 vòng.

## Câu hỏi
Không còn. (Câu hỏi A5 ↔ SAOLUU-2 D2c đã được chủ quán duyệt: `BANG_KHONG_XUAT_EXCEL`.)

## Phát hiện (ngoài Phạm vi, không sửa)
- `ban_mau_pos/` (bản vẽ đã chốt, CLAUDE.md §9) chưa vẽ ảnh món / topping; chủ quán đã duyệt qua bản thử TOPPING-1 26.11 (artifact trong phiếu). Chat nên cập nhật `ban_mau_pos` + `chay_thu.sh` nếu muốn bản vẽ khớp mã.
- Đường đọc ảnh công khai đọc cả khối base64 (~160 KB) từ Turso mỗi lượt chưa có trong cache trình duyệt / Cloudflare (đường không đuôi file thường không được Cloudflare cache). Chưa đo; nếu tải Turso tăng thì thêm Cache Rule cho `/api/pos/products/anh/*` hoặc bộ nhớ đệm trong máy chủ.
- Ảnh chỉ nằm trong Turso — KHÔNG có sao lưu riêng (đã loại khỏi Excel có chủ ý). Mất bảng = tải lại ảnh. Nếu muốn an toàn hơn: việc riêng "sao lưu ảnh món".
- `BANG_KHONG_XUAT_EXCEL` chỉ được bài thử `thu_SAOLUU2.js` đọc (không dùng trong code chạy) — cố ý, ghi ở chú thích.
- `layMenuQuay` thêm một truy vấn nhỏ `pos_anh_mon` cho mọi nơi gọi (kể cả đường tạo đơn App `donApp.js`); lỗi bị nuốt → không đổi hành vi tiền, chỉ thêm một vòng Turso.
- KHO-GON-2 chưa gộp: khi gộp, kiểm lại có MỘT hàm kiểm kiểu ảnh (`nd/tinh.js loaiAnh`).
- `server/utils/manKhach.js:28,182` + `client/src/pages/CaiDat/ManKhach.jsx:13`: loại trang `anh` của màn khách (trang trí) nghĩa khác `anh` của món — dễ nhầm.
- `POST /products` và `PUT /products/:id` trả hàng thô, không có `anh` (màn Sản phẩm không dùng). Màn khách và đơn App chưa hiện ảnh món (phiếu không yêu cầu).
- Dòng giỏ con của topping (`BanHangMoi.jsx` `bh-dong-tp`) chưa có ảnh (phiếu: ô topping trong khung chọn món).

## Sự cố gom cho bước 11
- Người gác chặn (B-PHANTICH, SED-I, GIT-RM, B-BIMAT-CHU): lệnh ghép `&&` / `;` sau chạy script; `sed -i`; `git rm --cached`; script chứa cụm SECRET (thu_ANHMON1.js) phải commit trước khi chạy → đã làm theo hướng dẫn (tách lệnh, dùng Edit / python tách riêng, commit trước).
- Kho nông làm `thu_BH2` G1 đỏ oan (`bad revision`) → `git fetch --unshallow`.
- Phiếu A5 mâu thuẫn bài SAOLUU-2 D2c → ghi `## Câu hỏi`, chủ quán duyệt `BANG_KHONG_XUAT_EXCEL`.
- Cổng `chay` với mốc `38fb4dd^` kéo cả thay đổi của main đã ghép (19 dòng ✗ A16 oan: BAO1a, BH1…) → dùng mốc `25adb0fa` (chính main đã ghép): chỉ còn A20 + số ca.
- Bài thử xanh oan lần đầu (A8 / F5 / G3: `undefined === undefined`, lỗi bảng chưa có) và hai đột biến SỐNG (B11 chỉ 8 byte nên bị loại vì độ dài; H2 khớp chữ thường) → đã siết.
- `/ra-soat` bắt K4: PUT / DELETE ảnh thiếu khoá id số (D8 / D9 ĐỎ thật).
- Máy không báo đổi model giữa phiên.

## Báo cáo 7 mục
```
VIỆC:        ANH-MON-1 — Ảnh nhỏ cho món và topping (quầy + App KH), tự thu nhỏ khi tải lên
ĐÃ SỬA:      server/nang_cap/037_anh_mon.js — bảng pos_anh_mon · server/utils/anhMon.js — hằng số, đường dẫn, docAnhMon (nuốt lỗi) ·
             server/routes/products.js:39-60 (layMenuQuay có anh), cuối file (PUT/DELETE /:id/anh soMon + nhanAnh, GET /anh/:id/:phienBan) ·
             server/routes/kh/index.js:46 (anh: p.anh ?? null) · server/kho/duong.js (GET /san-pham kèm anh) · server/routes/backup.js (BANG_KHONG_XUAT_EXCEL) ·
             client/src/pages/BanHang/AnhMon.jsx (mới), BanHangMoi.jsx (thẻ món + dòng giỏ), KhungChonMon.jsx (ô topping), banHang.css ·
             client/src/pages/Kho/SanPham.jsx (thu nhỏ + tải + xoá), ToppingMon.jsx · HOP_DONG_API_KH.md v21 · client/dist build · kiem_tra_truoc_khi_giao.js (nối bài thử)
BÀI THỬ:     thu_ANHMON1.js trên cây 25adb0fa → ĐỎ 11 đạt · 32 hỏng (A1–A10, B–G, H1–H7, H11–H12, H14, bảng pos_anh_mon chưa có); sau vá XANH 77 đạt · 0 hỏng.
             thu_SAOLUU2.js (D2e–D2h thêm) trên 25adb0fa → ĐỎ 36 đạt · 4 hỏng; sau vá 40 đạt · 0 hỏng. Vòng sửa 1: D8/D9 ĐỎ (75 đạt · 2 hỏng) → 77 đạt.
             Đột biến 34/34 BẮT (python3 viec/ANH-MON-1/dot_bien.py). npm test -- --day-du: PASS 136 · FAIL 0 · CẢNH BÁO 1 (trước vòng sửa 1; chạy lại cuối — xem dòng cuối file).
ĐÃ RÀ K4:    grep "layMenuQuay" trong server/ → 5 nơi gọi (kh/index.js, quang-cao.js, donApp.js, manKhach.js, products.js) — chỉ monKhach liệt kê trường → đã xử lý;
             grep "ANH_KHONG_HOP_LE|loaiAnh" server/ → 1 hàm kiểm kiểu ảnh (nd/tinh.js), multer ở kho/duong.js là hoá đơn kho, không liên quan;
             grep "Number(req.params.id)" /:id/anh trong products.js → 2 chỗ (PUT, DELETE), đã khoá soMon cùng khuôn PUT /:id;
             grep "v19" trong 5 file hồ sơ / bài thử → đã đổi v21; grep "fetch(" mới trong client/src → 0 chỗ.
CHƯA KIỂM:   (1) canvas thu nhỏ — createImageBitmap / cắt vuông / toBlob WebP / JPEG dự phòng — chạy trong trình duyệt thật, ảnh HEIC iPhone, chụp bằng camera: máy không kiểm được;
             (2) ảnh lỗi → chữ viết tắt (onError): chỉ dò chuỗi, vẽ tĩnh không bắn được sự kiện; (3) tốc độ quầy / Turso với ảnh thật trên 4G; Cloudflare có cache đường ảnh không;
             (4) "không nhảy bố cục" chỉ kiểm khung viết sẵn trong HTML, chưa đo bằng trình duyệt; (5) App KH thật đọc đường dẫn ảnh (chat App KH làm theo BAO_APPKH.md).
GIT:         xem dòng "git log --oneline -2" ở cuối file.
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 2 · BỎ 1 — chi tiết ở ## Bài học bên dưới.
```
Thử tay trên điện thoại (1–3 thao tác): (1) Kho › Sản phẩm › mở một món › "Chọn / chụp ảnh" → thấy ảnh + dòng "Ảnh 400×400 · … KB"; bấm "Xoá ảnh" → mất. (2) Màn Bán hàng: thẻ món và dòng giỏ có ảnh, món không ảnh hiện chữ viết tắt; chạm món có topping → ô topping có ảnh. (3) Mở tab ẩn danh `…/api/kh/menu` xem `anh` của món vừa tải.

Nghiệm thu (đếm từng mục, có bằng chứng):
- A1 tải ảnh: SanPham.jsx (CO_ANH 400 · CHAT_LUONG_ANH 0.7 · Xoá ảnh · hiện cỡ) ← thu_ANHMON1 H1–H3; quyền sửa món ← D1–D4, D8–D9. Canvas thật: CHƯA KIỂM (trên).
- A2 máy chủ: byte đầu ← B1–B11; ≤120 KB / 413 ← C1–C5; một ảnh / món ← E1, G3; CSDL ← G1–G2; Cache-Control + phiên bản đường dẫn ← A3–A6, E2–E6.
- A3 quầy: thẻ món, dòng giỏ, ô topping ← H5, H7–H13; chỗ giữ chỗ cố định ← H4, H7; hoá đơn / tem không ảnh ← H6.
- A4 `/api/kh/menu` + hợp đồng + BAO_APPKH ← A7, F1–F2, I1–I4 (`thu_HOPDONG_KH.js` 101 xanh).
- A5 Excel ← G5, thu_SAOLUU2 D2c–D2h. Thử + 3 đột biến phiếu ← bảng trên. K5 ← F1–F7. `npm test`, `--day-du`, cổng chạy ← dòng cuối file.

## Bài học (bước 11)
- KHOÁ 1 (đã làm, trong Phạm vi): ca D8 / D9 + đột biến BV-anh-id-khong-khoa-so — id nhận từ đường dẫn phải khoá `^\d+$` (cùng khuôn PUT `/:id`); lý do: `Number('0x9')` trỏ sang món khác, DELETE xoá nhầm ảnh.
- KHOÁ 2 (đề xuất, ngoài Phạm vi): phép kiểm tự động đối chiếu nhãn phiên bản hợp đồng — mọi "Ghi chú vN" / "từ vN" trong `HOP_DONG_API_KH.md` phải khớp một dòng nhật ký `- vN ·` và việc ghi nhật ký (file `cong_cu/thu_HOPDONG_KH.js`); ca đỏ: đổi tiêu đề ghi chú sang số lệch nhật ký (đã xảy ra: "Ghi chú v19 — ảnh món" trong khi ảnh là v21).
- NGUYÊN TẮC 1 (đề xuất cho `KHUON_LOI.md`, K4): khi ghép main làm đổi số phiên bản / mã bước, grep lại MỌI chỗ ghi số cũ (hợp đồng, BAO_APPKH, kế hoạch, chú thích bài thử và cổng) — vụ ANH-MON-1: 5 file còn v19.
- NGUYÊN TẮC 2 (đề xuất, K1): `trang_thai.md` phải viết lại sau mỗi lần chủ quán duyệt / đổi hướng; chữ "DỪNG", số ca cũ lừa người đọc.
- BỎ 1: kho nông làm `thu_BH2` đỏ oan — lỗi môi trường một lần (`git fetch --unshallow`).
- Dọn: không đề xuất xoá lời dặn nào (không có phép kiểm mới thay được lời dặn trong KHUON_LOI.md).
