# KHO-2a — trạng thái

## Bước 1 — đối chiếu bản chụp (29.10.2026)
- Nhánh: `viec/KHO-2a`; cây sạch; `git fetch origin viec/KHO-2a` → HEAD `8f88885` = FETCH_HEAD `8f88885` (không kéo).
- `git log --oneline -3`:
  ```
  8f88885 PHIEU: KHO-2a
  988aee7 TIEN-DO: mo KH-API-2 + KHO-2a; KHO-2 tach KHO-2a / KHO-2b; lich xep lai theo tien do 29.10 — so v45
  feda0b0 TIEN-DO: UUDAI-1 (0a543cf), KHO-1 (65eb00d) xong; luat vong sua 4 + du lieu cu; quyet dinh khong co bill chua tra; HD-1 vong 4 — so v44
  ```

## Bước 2–3
- Đã đọc: phiếu, CLAUDE.md, KHUON_LOI.md, QUYET_DINH_CHU_QUAN.md mục Kho, viec/KHO-1/ke_hoach.md, `server/kho/*`, `server/nang_cap/*`,
  `server/routes/settings.js` (PUT /), `server/database.js` (beginTransaction, layNangCapHong), `server/middleware/auth.js` (checkRole),
  `client/src/pages/Kho/index.jsx`, `Layout.jsx` (navItems, vòng hỏi 60 s), `cong_cu/thu_KHO1.js` (B1/B2 đếm cứng 1 bước).
- Kế hoạch: `viec/KHO-2a/ke_hoach.md`. Phiếu dặn **Chờ duyệt kế hoạch** → commit, push, DỪNG ở bước 3.

## Soát kế hoạch (agent phụ chỉ đọc, 4 câu)
- Phạm vi / Cấm: không file nào ngoài Phạm vi. Sửa theo soát: huy hiệu rời `Layout.jsx` về màn Kho (phiếu: Layout chỉ route) + Q7.
- Ngắn hơn: bỏ cột "% chuẩn" tới khi Q1 trả lời; bỏ đường đếm riêng (dùng `GET /phieu?trang_thai=cho_duyet`); hạn món vào `PUT /san-pham/:id`
  có sẵn; lệch theo nhóm vào vòng thêm / sửa chung; `hanLo` dùng lại `addDaysToDateString`; một câu `conLaiTheoLo` dùng chung.
- Ca thiếu đã thêm: I2 → 403 (phiếu ghi "đường lạ → 403"), C7 bấm hai lần (khoá `ma_gui`), C8 đơn vị hiện, D11 từ chối song song duyệt,
  D12 tự từ chối, E8 một giao dịch, F3 hai nhóm khác ngưỡng + món không nhóm, H7 huỷ phiếu chờ duyệt, G3 ẩn giá cả phản hồi đường ghi.
- Đường song song đã vá trong kế hoạch: từ chối cùng điều kiện khoá với duyệt; sửa phiếu giữ giờ làm cũ cho hạn lô, không mở lại kết quả;
  công tắc chỉ '0' là tắt (khôi phục sao lưu ghi `pos_settings` không qua kiểm).
- Nền sai đã sửa: `nhapSx.js:64` đọc `sx_products` bằng cột tường minh (không có `days_use`); ca đua chấp nhận `KHO_BAN`.

## Câu hỏi
Xem mục "Câu hỏi cho chủ quán" cuối `ke_hoach.md` (Q1–Q7) — trả lời cùng lúc duyệt kế hoạch.
