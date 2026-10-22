# KH-UI-1 — trạng thái

## Bước 1 — đối chiếu bản chụp
- Lượt 1 (22.10.2026): nhánh `viec/KH-UI-1`, cây sạch. HEAD `1feac67` = FETCH_HEAD `1feac67` (`merge-base --is-ancestor` hai chiều đều 0) → không kéo.
  ```
  1feac67 PHIEU: KH-UI-1
  4ee92fe TIEN-DO: KH-API-1 (e7f79bf), P16 (4fa657a), P26d (f1dbd7c), DOI-SOAT-1 (fabe583) xong; mo P22-23, P15-QR, KH-UI-1, KH-QUAY-1; them GIAO-1, DOI-SOAT-2, P26e; TAM_NHIN + NHIP_NGAY vao kho; lich — so v38
  fabe583 Merge pull request #37 from pos-tuquyduong/viec/DOI-SOAT-1
  ```
- Lời chủ quán đầu phiên: "Demo chưa có; làm theo danh sách màn trong phiếu." → khung gọn, mọi màu/chữ/khoảng cách ở `app_kh/src/giaoDien/giaoDien.css`.

## Câu hỏi
(không còn) Q1 xong: chủ quán đã chạy npm install + build, nhánh có `app_kh/package-lock.json` và `app_kh/dist` dựng bằng npm (778c407). Q2 xong: chủ quán chốt giữ hai nút đợt 1.

## Phát hiện (ngoài Phạm vi / chưa sửa)
- `env.example` chưa có `KH_HOST`, `KH_JWT_SECRET` (ngoài Phạm vi).
- `KH_HOST` không được kèm cổng (`host:3000` không bao giờ khớp: máy chủ cắt cổng ở phía Host, không cắt phía `KH_HOST`); `KH_HOST=localhost` làm quầy biến mất ở `localhost` — dùng tên miền con thật khi thử.
- `tu_chay/xem_thu.sh` chỉ dựng `client/`, chưa biết `app_kh/` (ngoài Phạm vi).
- DangNhap không có `<form>` (Enter không gửi) và không có nút "gửi lại mã" khi `MA_HET_HAN` — chờ bản demo của chủ quán.
- Diem: nếu tải lại sau khi nhận mã lỗi mạng thì cả màn thay bằng lỗi (điểm đã cộng ở máy chủ). Hiếm, chưa sửa.
- Don: nhãn "Còn nợ" áp cho mọi đơn chưa `paid` và chưa `cancelled`; chưa đọc hết các giá trị `status` khác (hoàn…).
- `res.sendFile` ở `server/index.js` không có callback lỗi: thiếu `app_kh/dist/index.html` thì ra 500 chung.

## Nghiệm thu — đếm từng mục
| Mục | Bằng chứng |
|---|---|
| A khung | `app_kh/{package.json,vite.config.js,index.html,src/…}`; `api.js` là chỗ duy nhất có `fetch(` (bài thử "mọi fetch( … nằm trong api.js"); KHÔNG router/thư viện UI. `package-lock.json` đã có (778c407) |
| B đăng nhập | `pages/DangNhap.jsx` (xin-ma → hiện "Hỏi nhân viên quầy…" khi `lay_ma_tai_quay`; xác minh; `CAN_TEN` hiện ô tên); `api.js` token localStorage bọc try/catch, 401 → `khiHetPhien`; lời lỗi `dinhDang.js loiTheoCode` (ca H5). Chưa chạy trên trình duyệt |
| C menu | `pages/Menu.jsx` — nhóm, tên, giá, còn hàng, `ton_cu` → "theo số lúc …"; không giá vốn (`monKhach` server kh/index.js) |
| D điểm / voucher / đơn | `Diem.jsx`, `Voucher.jsx` (+`ma_khach_moi`), `Don.jsx` (phân trang `con_nua`, chi tiết `/don/:ma`, lỗi "Không tìm thấy đơn" từ server) |
| E nhận mã | `components/NhanMa.jsx`, hai nút, hiện đúng `error` máy chủ; chủ quán chốt giữ hai nút |
| F hồ sơ | `Toi.jsx` (`GET/PUT /toi`), khung "Mã QR thành viên — Sắp có", đăng xuất |
| G phục vụ | `server/index.js` khối `laYeuCauAppKh` (15 dòng, ≤ 25), trước "Serve static files"; ca H1/H2/H2b–f |
| H bài thử | `node cong_cu/thu_KHUI1.js` → 39 đạt · 0 hỏng; ca (1)(2)(3)(4)(5) đủ |
| I | `npm test` 68 PASS · 0 FAIL · 1 CẢNH BÁO (cảnh báo có từ trước: GET có lệnh ghi packages.js/products.js/sync.js); `--day-du` 72 PASS · 0 FAIL; `client/dist` không đổi (`git diff --stat 1feac67 HEAD -- client` rỗng). `package-lock.json` + `app_kh/dist` do chủ quán dựng bằng npm (778c407); lượt 22.10 trên 778c407: `npm test` 68/0/1, `--day-du` 72/0/1 |
| J thử tay | bên dưới |

## J — chủ quán thử tay (≤ 3 thao tác, điện thoại)
Cần trước: biến `KH_JWT_SECRET` (khác `JWT_SECRET`) và `KH_HOST=<tên miền con App KH>` trên máy chủ, DNS trỏ về dịch vụ.
1. Mở `https://<KH_HOST>` → nhập SĐT → ở quầy (đăng nhập nhân viên) lấy mã: `POST /api/pos/kh/cap-ma { "sdt": "…" }` với token nhân viên (nút của KH-QUAY-1 chưa gộp) → gõ mã (khách mới thì gõ thêm tên).
2. Xem tab Menu (giá + còn hàng) và tab Điểm.
3. In một bill có mã → tab Điểm → dán mã → bấm "Cộng điểm cho đơn này" (hoặc "Nhận ưu đãi khách mới" nếu là khách mới).

## Bảng chỗ vá → đột biến (viec/KH-UI-1/dot_bien.py; 11/11 bị bắt, đối chứng 39/0)
- Chọn thư mục tĩnh: `BV-G-bo-file-tinh`, `BV-G-bo-index-cho-duong-la`, `BV-G-bo-kiem-api`, `VS-G-moi-host-deu-app-kh`
- So khớp Host: `VS-G-host-chua-chuoi`, `VS-G-host-khong-bo-cong`, `VS-G-host-phan-biet-hoa`, `VS-G-tin-forwarded-host`
- Chuẩn hoá `KH_HOST`: `VS-G-kh-host-khong-chu-thuong`, `VS-G-kh-host-khong-trim`
- KH_HOST chưa đặt: `VS-G-host-rong-khop-rong`

## Soát độc lập (vòng 1) — báo cáo agent
KHÔNG ĐẠT vì thiếu ghi sổ J/I và 2 lỗi code. Đã sửa: (a) hở K3 phía `KH_HOST` (thêm ca KH_HOST chữ hoa + khoảng trắng và 2 đột biến); (b) máy chủ con không được dọn khi bài thoát bằng lỗi (`process.on('exit')`); (c) `Don.jsx` key trùng khi phân trang OFFSET (lọc đơn đã có); (d) ghi J, I, Câu hỏi vào file này. Các nghi ngờ còn lại đã chuyển vào `## Phát hiện`. Vòng 1/3. Bài học agent: K3 chuẩn hoá hai vế phải thử cả hai vế · K7 bài spawn con phải tự dọn mọi đường thoát · chỉ báo xong khi bằng chứng nằm trong file này.

## Cổng
`node tu_chay/cong.js chay . 1feac67^ HEAD viec/KH-UI-1` → `✓ CỔNG CHẠY ĐẠT` (miễn bài thử đỏ theo phiếu).

## Báo cáo
```
VIỆC:        KH-UI-1 — App KH đợt 1 (menu · đăng nhập · nhận mã · điểm · voucher · đơn · hồ sơ)
ĐÃ SỬA:      server/index.js (khối laYeuCauAppKh, 15 dòng, trước "Serve static files"); app_kh/** mới (package.json, vite.config.js,
             index.html, src/ 15 file, dist/); cong_cu/thu_KHUI1.js; viec/KH-UI-1/**
BÀI THỬ:     trên gốc 1feac67 → ĐỎ 14 đạt · 9 hỏng (H2, H2b, H2c, H2e, H4, H5, fetch, /api/pos); sau vá → XANH 39 đạt · 0 hỏng;
             đột biến 11/11 bị bắt; npm test 68/0, --day-du 72/0; cong.js chay ĐẠT
ĐÃ RÀ K4:    grep "fetch(" trong app_kh/src → 1 chỗ (api.js); "/api/pos" → 0; "localStorage" → chỉ api.js, bọc try/catch
CHƯA KIỂM:   máy chưa tự chạy lại npm ci && npm run build ở app_kh (lockfile + dist do chủ quán dựng); giao diện chưa mở trên trình duyệt/điện thoại (bố cục CSS, cảnh báo React); luồng B–F chỉ đọc code,
             không có bài tự động; thử tay J chưa ai làm; các giá trị status/payment_status ngoài paid/pending/partial/cancelled
GIT:         xem dòng log cuối khi push
BÀI HỌC:     KHOÁ 2 (ca KH_HOST hoa+trim và đột biến VS-G-kh-host-*; dọn máy chủ con bằng process.on('exit') — cả hai trong Phạm vi, đã làm)
             · NGUYÊN TẮC 1 (đề xuất, ngoài Phạm vi: K3 thêm "phép so có chuẩn hoá hai vế thì đột biến và ca thử phủ cả hai vế") · BỎ 1
             (script nháp dựng thử dùng alias — chỉ vì chưa có lockfile)
```

## Bài học
- KHOÁ: ca thử `KH_HOST` chữ hoa + khoảng trắng và đột biến `VS-G-kh-host-khong-chu-thuong` / `VS-G-kh-host-khong-trim` (đã có, cong_cu/thu_KHUI1.js, dot_bien.py). `process.on('exit')` dọn máy chủ con (đã có).
- NGUYÊN TẮC (đề xuất, ngoài Phạm vi `KHUON_LOI.md`): K3 — "phép so chuẩn hoá hai vế (Host và biến môi trường) phải có ca và đột biến cho CẢ HAI vế; đã gây: soát vòng 1 KH-UI-1 tìm ra đột biến bỏ `.toLowerCase()` phía `KH_HOST` vẫn xanh 39/39".
- BỎ: dựng thử `dist` bằng alias — chỉ vì thiếu lockfile (nay đã có).

HEAD ĐÃ KIỂM: 2a58cf8
HEAD ĐÃ KIỂM: 1396c09

Chat soát 22.10: gộp thử đủ 4 nhánh M3 trên main 4ee92fe — npm test 67/0, --day-du 73/0, bài thử 4 việc xanh; commit eaf37a4 (gộp main / đổi mốc I8) qua hook pre-commit + cổng chạy GitHub.
HEAD ĐÃ KIỂM: eaf37a4
