# KH-API-2 — trạng thái

## Bước 1 — đối chiếu bản chụp (29.10.2026)
- Nhánh: `viec/KH-API-2`; cây sạch.
- HEAD `68cbe9d` · FETCH_HEAD `68cbe9d` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  68cbe9d PHIEU: KH-API-2
  988aee7 TIEN-DO: mo KH-API-2 + KHO-2a; KHO-2 tach KHO-2a / KHO-2b; lich xep lai theo tien do 29.10 — so v45
  feda0b0 TIEN-DO: UUDAI-1 (0a543cf), KHO-1 (65eb00d) xong; luat vong sua 4 + du lieu cu; quyet dinh khong co bill chua tra; HD-1 vong 4 — so v44
  ```

## Tiến độ
- Bước 2 (đọc) xong. Bước 3: `ke_hoach.md` viết xong, đã soát bằng agent phụ — **DỪNG chờ chủ quán duyệt** (phiếu: "Chờ duyệt kế hoạch").

## Câu hỏi
Xem mục `## Câu hỏi cho chủ quán` trong `ke_hoach.md` (Q1–Q3) — trả lời cùng lúc duyệt kế hoạch.

## Phát hiện
- Cài đặt làm tròn giá hạng (`tier_round_to`, `tier_round_mode` — `server/routes/tiers.js:27-34`, màn Cài đặt) được lưu nhưng KHÔNG nơi
  nào áp: `grep -rln "round_to\|tier_round" client/src server` chỉ ra Settings.jsx, database.js, tiers.js. Quầy tính giá hạng bằng
  `Math.round` tới đồng (`server/utils/uuDai.js:21`). Chủ quán chỉnh "làm tròn 500đ" sẽ không thấy gì đổi. Ngoài phạm vi — không sửa.
- `PUT /api/pos/settings` ghi `updated_at = new Date().toISOString()` (giờ UTC, `server/routes/settings.js:109`) — trái luật giờ VN; thuộc GIO-VN-1.
- Hợp đồng v1 ghi "Lỗi đã biết: 500 không `code`" ở `nhan-ma-bill` / `nhan-diem` — code hiện tại ĐÃ trả `LOI_MAY_CHU` khi gọi từ App
  (`server/routes/signup-codes.js:318` và `:470`: `if (req.khach) return loiMayChu(...)`; `quaToken` ở `server/routes/kh/index.js:154`
  truyền `khach`). Dòng hợp đồng đã cũ; KH-API-2 chỉ khoá bằng ca thử + bỏ dòng.
- Hợp đồng v1 THIẾU 12 mã lỗi mà hai cửa trên trả thật (đếm `grep -o "code: '[A-Z_]*'" server/routes/signup-codes.js`):
  `NHANDIEM_DANG_TAT`, `MA_DA_NHAN_DIEM`, `BILL_CHUA_THANH_TOAN`, `BILL_SDT_KHAC`, `DON_DA_HUY`, `DON_DA_HOAN`, `DON_KHONG_DU_DIEM`,
  `DON_KHONG_HOP_LE`, `KHONG_THEM_DIEM`, `MA_KHONG_GAN_DON`, `TICH_DIEM_DANG_TAT`, `MA_TRUNG` (dòng 51–94 `kiemDonCuaMa` / `baoChiemHong` / `LOI_BILL_SDT_KHAC`, 156–252 `nhanDiemMaBill`, 404 `nhanMaUuDai`). Thêm vào v2 (H).
- Ba biểu thức "đang giờ vàng" khác nhau: `orders.js:511`, `Sales.jsx:147` (không xét `product_keys`), `/gio-vang` mới — Sales.jsx trong Cấm.
- Số giờ hạn mã trên bill `Number(c.nhandiem_han_gio) || 24` (`orders.js:1257`) khác `docCauHinhNhanDiem` (`signup-codes.js:127-131`) với giá trị âm (chỉ dữ liệu nhập tay).
