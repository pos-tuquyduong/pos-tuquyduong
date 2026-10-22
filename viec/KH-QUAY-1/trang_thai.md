# KH-QUAY-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh `viec/KH-QUAY-1`; HEAD = FETCH_HEAD = `6a5f612` (không kéo, đã bằng origin).
```
6a5f612 PHIEU: KH-QUAY-1
4ee92fe TIEN-DO: KH-API-1 (e7f79bf), P16 (4fa657a), P26d (f1dbd7c), DOI-SOAT-1 (fabe583) xong; mo P22-23, P15-QR, KH-UI-1, KH-QUAY-1; them GIAO-1, DOI-SOAT-2, P26e; TAM_NHIN + NHIP_NGAY vao kho; lich — so v38
fabe583 Merge pull request #37 from pos-tuquyduong/viec/DOI-SOAT-1
```

## Tiến độ
- Kế hoạch: `ke_hoach.md` (phương án A: thành phần mới + 2 dòng ở Customers.jsx).
- Bài thử `cong_cu/thu_KHQUAY1.js`: trên bản chưa vá (chưa có `maApp.js`) → ĐỎ "bài thử sập — Cannot find module .../maApp.js", `0 đạt · 1 hỏng`; sau khi vá → `21 đạt · 0 hỏng`.
- `npm test`: PASS 68 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có sẵn).

## Thử tay cho chủ quán (đúng 3 thao tác)
1. Mở Khách hàng → bấm một khách.
2. Bấm "🔑 Mã đăng nhập App" → thấy mã 6 số to + "Còn 5:00" đếm ngược.
3. Chờ hết giờ (5 phút) → mã mờ, ghi "Hết hạn" + nút "🔑 Lấy mã mới".

## Soát độc lập `/ra-soat` (vòng 1)
Kết luận của người soát: **KHÔNG ĐẠT (nhẹ)** — không có lỗi đụng tiền hay chặn luồng hợp lệ. Lỗi và xử lý:
- Chớp "Hết hạn" ở khung đầu sau khi lấy mã (`MaDangNhapApp.jsx`: `giay` khởi tạo 0, chỉ set trong effect) — K5, luồng hợp lệ hiển thị sai một khung. **ĐÃ SỬA** ở `810b616`: `setGiay` chạy cùng lượt với `setMa` trong `layMa`; dist dựng lại.
- Hồ sơ K1: `ke_hoach.md` ghi "2 dòng ở Customers.jsx", "~110 dòng"; thật là +3 dòng (import, dòng trống, dòng gắn có `key={selectedCustomer.phone}`), thành phần 69 dòng. **Đính chính tại đây** (không sửa `ke_hoach.md`).
- Bài thử có lỗ: thiếu ca giờ hiện tại hỏng (`giayConLai(mốc, NaN)`). **ĐÃ THÊM** ca G7 → `22 đạt · 0 hỏng`. Ca "chỉ có `code` KH_CHUA_CAU_HINH, không status" chưa thêm (nhánh dư, không đổi hành vi).
- 503 theo `status` quá rộng: chủ quán đã chốt khoá theo `code` `KH_CHUA_CAU_HINH` — **ĐÃ SỬA** ở `c857fa1` (xem mục "Làm tiếp 503" dưới). Mục này đã bỏ khỏi Câu hỏi.
- Nghi ngờ nhẹ, để nguyên: lấy mã khác thất bại thì mã cũ còn hạn biến mất (`:45`); `setInterval` vẫn chạy sau hết hạn; cờ `conSong` có thể bỏ (~8 dòng).
- Đột biến thử tay của người soát: 9 đột biến BỊ BẮT; 2 SỐNG (đã xử lý một, một nhánh dư như trên).

## Kiểm sau vá (810b616)
- `node cong_cu/thu_KHQUAY1.js` → `22 đạt · 0 hỏng`
- `(cd client && npm run build)` → thành công; dist `index-Cm4eKUHR.js`
- `npm test` → PASS 68 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có sẵn)
- `node kiem_tra_truoc_khi_giao.js --day-du` → chạy ĐÚNG MỘT lần, ở `75512d2` (trước bản vá chớp): PASS 72 · FAIL 0 · CẢNH BÁO 1. Chưa chạy lại ở `810b616` theo dặn "đúng một lần".
- `node tu_chay/cong.js chay . 6a5f612^ HEAD viec/KH-QUAY-1` → ✓ CỔNG CHẠY ĐẠT

## Làm tiếp 503 (chủ quán chốt: khoá theo mã, không theo mọi 503)
- Kiểm máy chủ: `server/middleware/khachAuth.js:20` trả 503 kèm `code: 'KH_CHUA_CAU_HINH'`; `server/routes/kh/quay.js:13` gắn `canCauHinhKhach` vào `/cap-ma`; `client/src/utils/api.js:85` đặt `err.code` → không cần sửa máy chủ.
- Sửa `client/src/utils/maApp.js:21-22`: `code === 'KH_CHUA_CAU_HINH'` → "App khách chưa bật — báo quản lý"; 503 khác → "Máy chủ chưa sẵn sàng, thử lại sau".
- Bài thử (`8aa8a56`): L2 (503 không code → lời chung), L2b (chỉ có code, status 500 → "chưa bật"), L2c (503 code khác → lời chung). Trên bản chưa sửa: ĐỎ ở L2 và L2c, `22 đạt · 2 hỏng`; sau sửa: `24 đạt · 0 hỏng`. L2b xanh cả hai bên (khoá nhánh có sẵn, không phải ca đỏ).
- `(cd client && npm run build)` → dist `index-DpXEg7NI.js`, commit `76b6337`.
- `npm test` → PASS 68 · FAIL 0 · CẢNH BÁO 1. `--day-du` chạy đúng MỘT lần ở `76b6337` → PASS 72 · FAIL 0 · CẢNH BÁO 1.
- `node tu_chay/cong.js chay . 6a5f612^ HEAD viec/KH-QUAY-1` ở `76b6337` → ✓ CỔNG CHẠY ĐẠT (miễn bài thử đỏ theo phiếu).

## Nghiệm thu (đếm)
- A: `MaDangNhapApp.jsx` + `Customers.jsx` (gắn trong khung chi tiết) + D1–D9, G1–G7; grep 0 localStorage/fetch ở thành phần mới.
- B: `maApp.js` `loiMaApp` + L1–L6.
- C: `MaDangNhapApp.jsx` — `useRef dangBay` + `disabled` (đọc code; máy KHÔNG kiểm).
- D: `git diff` `Customers.jsx` chỉ +3 dòng.
- E: `thu_KHQUAY1.js` 22 đạt · 0 hỏng.
- F: build ✓, `npm test` ✓, `--day-du` ✓ (ở `75512d2`), cổng chạy ✓.
- G: 3 thao tác ở mục "Thử tay" trên — chủ quán chưa thử.

## Báo cáo 7 mục
VIỆC:        KH-QUAY-1 — Nút "Mã đăng nhập App" ở trang Khách hàng
ĐÃ SỬA:      `client/src/components/MaDangNhapApp.jsx` (mới, hộp mã + đồng hồ, khoá bấm đôi); `client/src/utils/maApp.js` (mới, hàm thuần); `client/src/pages/Customers.jsx` (+3 dòng: import, dòng trống, gắn thành phần); `cong_cu/thu_KHQUAY1.js` (mới); `client/dist/**` dựng lại
BÀI THỬ:     phiếu miễn "bài thử đỏ" (giao diện, không đổi máy chủ/tiền). Bài `thu_KHQUAY1.js`: trên bản chưa có `maApp.js` → ĐỎ "Cannot find module", 0 đạt · 1 hỏng; sau vá → 22 đạt · 0 hỏng. Người soát chạy 9 đột biến tay, bị bắt cả 9
ĐÃ RÀ K4:    grep `fetch(`/`localStorage` trong `Customers.jsx` → 3 + 3 chỗ có sẵn từ trước, ngoài diff, không đụng; thành phần mới 0/0
CHƯA KIỂM:   (1) hành vi trên trình duyệt thật: đồng hồ, nút khoá khi bấm nhanh, hết giờ → "Hết hạn" + "Lấy mã mới", hết chớp khung đầu — chủ quán thử tay; (2) lời "Máy chủ chưa sẵn sàng" khi Render thật sự ngủ: bài thử chỉ dựng lỗi giả, chưa thấy 503 thật của proxy; (3) khách có `phone` dạng lạ trong dữ liệu thật
GIT:         xem `git log --oneline -2` dưới
BÀI HỌC:     KHOÁ 1 (ca G7) · NGUYÊN TẮC 1 · BỎ 1

## Bài học
- KHOÁ: giờ hiện tại hỏng làm `giay` thành NaN thì mã không bao giờ hết hạn → ca G7 (đã thêm, trong Phạm vi). Hai đối số `Number.isFinite` cần hai ca riêng.
- NGUYÊN TẮC (đề xuất, ngoài Phạm vi, máy không tự làm): state suy ra từ state khác (giây từ mốc hết hạn) phải tính trong lúc render hoặc set cùng lượt, không để effect đuổi theo — chớp một khung sai (K5, luồng hợp lệ). Và số dòng trong kế hoạch phải lấy từ `git diff --stat`, không ước (K1).
- BỎ: chặn 503 theo `status` quá rộng — phiếu ghi đúng chữ, chủ quán đã chốt khoá theo `code`, đã sửa; chỉ một lần.

HEAD ĐÃ KIỂM: 810b616
HEAD ĐÃ KIỂM: 76b6337
