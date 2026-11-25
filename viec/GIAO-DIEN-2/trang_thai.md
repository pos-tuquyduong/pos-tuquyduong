# GIAO-DIEN-2 — trạng thái

## Đối chiếu bản chụp (bước 1)
HEAD = FETCH_HEAD = `7021e39` (nhánh `viec/GIAO-DIEN-2`, cây sạch lúc mở phiên, hook mở phiên báo "đã có đủ commit của origin").
```
7021e39 PHIEU: GIAO-DIEN-2 tinh gon Quan ly / Cai dat / Khach hang theo mau chu quan duyet, go chu va nut SX — chat ban 41
7da9ba9 Merge pull request #102 from pos-tuquyduong/viec/KHO-3a
0335fee KHO-3a: cong chay DAT, HEAD DA KIEM fab40374
```

## Câu hỏi
1. **`client/src/components/ThanhLuu.jsx` bị sửa NHẦM (ngoài Phạm vi), CHƯA commit.** Mình thêm ba tham số có giá trị mặc định (`chu`, `nutBo`, `nutLuu`) bằng một
   script, rồi mới thấy file này không nằm trong Phạm vi. Người gác chặn cả Edit lẫn `git checkout` để hoàn tác, nên mình KHÔNG lách: file đó còn dirty trong cây
   làm việc, KHÔNG được `git add`. Mã thật không dùng nó (thanh dính đáy của thẻ Hạng nằm trong `HangThe.jsx`, cùng sổ `datChuaLuu`).
   → Chủ quán chọn một: (a) hoàn tác: `git checkout -- client/src/components/ThanhLuu.jsx` rồi build lại `client/dist` (phiếu đã dặn chat build lại dist lúc gộp); hoặc
   (b) thêm `client/src/components/ThanhLuu.jsx` vào Phạm vi. Đề xuất: (a).
   Hệ quả cần biết: bản `client/dist` mình build được tạo từ cây có file này bị sửa — **phải build lại dist sau khi hoàn tác** thì `--day-du` mới khớp trên cây sạch.
2. Câu "Không còn mục nào của SX." ở dòng chú thích cuối mẫu M1 mâu thuẫn với C4 (grep "SX" chỉ còn chú thích). Mình ưu tiên C4: bỏ vế "Không còn mục nào của SX." khỏi màn hình, giữ "Mỗi nút mở thẳng đúng màn. Một món chỉ sửa ở MỘT chỗ."

## Phát hiện (không sửa)
- KHO-3b: dời tick "nhóm đặc biệt" + "món tặng khách mới" về Kho rồi bỏ nút tạm "Giá bán & nhóm món" (B2).
- Gói kiểu mới: thẻ `packages` (đang tạm ngưng) còn mở được bằng `?the=packages`, không có nút.
- D4: nút "Bán cho khách này" làm ở TOPPING-1 / màn bán hàng mới.
- `CongQr` (trạng thái cổng QR) chỉ hiện ở `/settings` trần; chế độ thẻ riêng (`?the=`) ẩn nó.
- `QuanLy/locKhach.js` đặt trong QuanLy/ vì Phạm vi không cho tạo file mới ở `utils/`; nên dời sang `utils/`.
- Orders.jsx `return_to_stock: damageForm.action === 'return_stock'` giờ luôn false (phiếu cấm đụng thêm dòng khác).
- `Customers.jsx` vẫn ~740 dòng (Phạm vi không cho tạo file mới ở `components/` để tách chi tiết khách).
- `syncApi` trong `utils/api.js` (export / import khách SX) không còn ai gọi — code chết, ngoài C5.
- Form "Thêm khách" còn ô "Sản phẩm / Số chu kỳ" (gốc từ đăng ký SX) — phiếu không nói bỏ, giữ nguyên.
