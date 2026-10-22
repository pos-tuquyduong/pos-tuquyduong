# KH-UI-1 — App KH đợt 1: menu · đăng nhập (mã lấy tại quầy) · nhận mã bill / nhân điểm · điểm · voucher · lịch sử đơn · hồ sơ · chỗ QR thành viên

<!-- Phiếu do chat soạn 22.10.2026. Việc thường [Th] — chạy thẳng tới hết. Nền: main `fabe583` (cổng `/api/kh` KH-API-1 đã gộp #34).
     Bản demo của chủ quán CHƯA xong (chủ quán dựng, 22.10): làm theo danh sách màn dưới đây + LUAT_XAY_APP §3 (di động trước, tiếng Việt
     có dấu); toàn bộ màu / chữ / khoảng cách đặt ở `app_kh/src/giaoDien/` để khi có demo chỉ đổi một chỗ — chat sẽ gửi phiếu bổ sung "theo
     demo". Đừng tự bịa kiểu riêng ngoài việc dựng khung gọn gàng. Chủ quán thích ít nút, ít thao tác.
     Cách phục vụ (chủ quán chốt hướng đơn giản nhất): máy chủ POS phục vụ luôn App KH theo tên miền (cùng một dịch vụ Render, không CORS,
     không dịch vụ thứ hai): biến môi trường `KH_HOST` (tên miền con App KH; chưa đặt → hành vi cũ y nguyên). Chủ quán đặt `KH_JWT_SECRET`
     và `KH_HOST` trên Render + trỏ DNS sau — chat hướng dẫn từng bước. -->

## Mục tiêu
Khách mở App trên điện thoại: xem menu (giá + còn hàng), đăng nhập bằng SĐT + mã (chưa cắm Zalo thì lấy mã ở quầy), nhận mã bill / nhân
điểm, xem điểm, voucher (gồm mã khách mới), lịch sử đơn của mình, sửa tên. Chưa có giỏ / đặt đơn (KH-UI-2, KH-DON-1).

## Nghiệm thu
- A Khung `app_kh/` (cùng kho POS) theo luật mục 3: `src/pages/` (mỗi màn một file), `src/components/`, `src/api.js` (CHỖ DUY NHẤT gọi
  `/api/kh`, gắn token khách, bắt `{ error, code }`), `src/giaoDien/` (màu, chữ, khoảng cách). Vite + React cùng bản với `client/`
  (react, react-dom, vite, @vitejs/plugin-react — KHÔNG thêm router / thư viện UI: thanh tab dưới đáy dùng trạng thái). Bản dựng ra
  `app_kh/dist/` và COMMIT (Render không dựng — như `client/dist`). `app_kh/package.json` + `package-lock.json`; `node_modules` đã trong `.gitignore`.
- B Đăng nhập: nhập SĐT → `POST /api/kh/dang-nhap/xin-ma` → nếu `lay_ma_tai_quay` true hiện "Hỏi nhân viên quầy để lấy mã đăng nhập"; nhập
  mã (+ tên nếu khách mới, lỗi `CAN_TEN`) → `POST /dang-nhap/xac-minh` → lưu token (localStorage, bọc try/catch) → vào App. Mã lỗi
  (`SDT_KHONG_HOP_LE`, `QUA_NHIEU_LAN`, `MA_SAI`, `MA_HET_HAN`, `CAN_TEN`, 503 chưa cấu hình) đều hiện lời tiếng Việt, không trắng màn. Token
  hết hạn / 401 → về màn đăng nhập. Đăng xuất xoá token.
- C Menu (`GET /menu`, cần token khách — máy chủ không đổi): nhóm + tên + giá + còn hàng; món `ton_cu` hiện "theo số lúc …" (không hiện tồn
  thật, không giá vốn). Menu hiện sau đăng nhập.
- D Điểm (`GET /diem`): số điểm + lịch sử; Voucher (`GET /voucher`, kèm `ma_khach_moi` nếu có); Lịch sử đơn (`GET /don`, phân trang `trang` /
  `con_nua`; chạm đơn → `GET /don/:ma` chi tiết món, đơn không có → "Không tìm thấy đơn").
- E Nhận mã bill / nhân điểm: ô nhập mã (hoặc dán) → `POST /nhan-ma-bill` (ưu đãi khách mới) hoặc `POST /nhan-diem` (nhân điểm) theo mã
  in trên bill; hiện kết quả + điểm sau khi nhận; mọi lỗi (mã đã dùng, mã lạ…) hiện đúng `error` máy chủ trả về, không tự đoán `code`. Khách bị chặn do bill ghi SĐT khác (quy
  tắc đã chốt) → hiện đúng `error` đó. Không tự gọi cả hai.
- F Hồ sơ (`GET /toi`, `PUT /toi` đổi tên). QR thành viên: để KHUNG chỗ ("Sắp có") — P15-QR thêm `qr` vào `/toi`; KH-UI-1 KHÔNG vẽ mã QR.
- G Phục vụ: `server/index.js` — khi có biến môi trường `KH_HOST`, yêu cầu có Host = `KH_HOST` (và không bắt đầu `/api/`) phục vụ
  `app_kh/dist` + trang vào (index.html) cho đường không phải file; mọi Host khác / `KH_HOST` chưa đặt → `client/dist` như cũ; `/api/*` dùng chung
  một máy chủ. Khối này đặt NGAY TRƯỚC dòng "Serve static files (for production)" (~160), ≤ 25 dòng.
- H Bài thử `cong_cu/thu_KHUI1.js` (chạy `node cong_cu/thu_KHUI1.js`, in "n đạt · 0 hỏng"): (1) `KH_HOST` chưa đặt → `/` trả `client/dist/index.html`;
  (2) đặt `KH_HOST` + Host đúng → `app_kh/dist/index.html`, Host khác → `client/dist`; (3) `/api/kh/menu` không token → 401 ở cả hai Host;
  (4) `app_kh/dist/index.html` trỏ tới file có thật trong `app_kh/dist/`; (5) hàm thuần trong `app_kh/src/` (định dạng giá, lời báo theo `code`) nếu có.
  KHÔNG ghép vào `kiem_tra_truoc_khi_giao.js` (chat ghép sau). Bộ kiểm hiện quét `client/` và `server/`: nếu phép kiểm nào đỏ vì `app_kh/`, ghi
  `## Câu hỏi` — không sửa bộ kiểm.
- I `npm test` và `--day-du` xanh; `client/dist` KHÔNG đổi (không sửa `client/`); `(cd app_kh && npm ci && npm run build)` thành công.
- J Chủ quán thử tay (ghi vào trang_thai.md, ≤ 3 thao tác, trên điện thoại): chạy `xem_thu.sh` / dùng `KH_HOST=localhost` theo hướng dẫn máy ghi; (1)
  vào đăng nhập → lấy mã ở quầy (nút của KH-QUAY-1, hoặc ghi cách lấy mã tạm bằng `cap-ma` nếu việc đó chưa gộp); (2) xem menu + điểm; (3) nhận một mã bill.

## Phạm vi
- viec/KH-UI-1/**
- app_kh/**
- server/index.js
- cong_cu/thu_KHUI1.js

## Bài thử đỏ
không — App giao diện mới; phần máy chủ chỉ chọn thư mục tĩnh theo tên miền (không tiền, không dữ liệu), có bài `cong_cu/thu_KHUI1.js` chạy riêng

## Ngân sách
~700 dòng app (7 màn gọn + `api.js` + giao diện dùng chung) + ~25 dòng `server/index.js` + ~120 dòng thử.
**Vùng sửa của file chung (checklist 22.10):** `server/index.js` CHỈ khối phục vụ App KH theo `KH_HOST` (trước dòng ~160) — không đổi CORS,
thứ tự mount `/api/*`, SPA fallback của quầy. Không việc song song nào sửa `index.js` đợt này.
**Phương án đơn giản nhất đã xét:** một dịch vụ, một chỗ phục vụ theo tên miền; không CORS; không router; không thư viện UI.

## Đổi cấu trúc DB
không

## Thư viện mới
chỉ trong `app_kh/package.json` (react, react-dom, vite, @vitejs/plugin-react — cùng bản với `client/package.json`); không thêm ở gốc kho

## Cấm
- KHÔNG sửa `client/**`, `server/` ngoài `index.js` (đúng vùng trên), `LUAT_XAY_APP.md`, `kiem_tra_truoc_khi_giao.js`.
- KHÔNG đưa giá vốn / token / dữ liệu khách khác ra giao diện; không `fetch('/api/pos/…')` (quầy) trong App — chỉ `/api/kh/*` qua `src/api.js`.
- Không bí mật trong code / `.replit` / log. Không sửa `tu_chay/`, `.claude/`, `.github/`, sổ việc. Chỉ push `git push -u origin viec/KH-UI-1`. Không đụng `main`, không merge, không tạo PR.
