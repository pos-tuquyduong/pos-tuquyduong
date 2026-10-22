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
