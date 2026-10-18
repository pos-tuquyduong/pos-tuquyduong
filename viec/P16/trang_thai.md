# P16 — trạng thái

## Mở phiên (bước 1)
- Nhánh: viec/P16 · không kéo (HEAD = FETCH_HEAD)
- HEAD `4d6295a` · FETCH_HEAD `4d6295a`
```
4d6295a PHIEU: P16
0bffc03 TIEN-DO: LUOI-5 (c8c20b3), TU-CHAY-8 (8259a59) xong; mo KH-API-1 + P26d + DOI-SOAT-1 + P16; them KH-OTP-1, DONG-CUNG-1; lich KH-OTP-1 — so v37
8259a59 Merge pull request #33 from pos-tuquyduong/viec/TU-CHAY-8
```

## Câu hỏi
(không chặn việc — chủ quán quyết sau)
1. Tem cốc: phiếu cho "dùng trường nhóm/loại sẵn có". Đơn lưu KHÔNG mang nhóm món (`pos_order_items` không có cột category — database.js:273-288),
   nên tem lọc theo `category` (juice / tea) tra từ `GET /products` bằng `product_code`. Mặc định BẬT cho mọi món thường (trừ gói, thẻ);
   chủ quán tắt nhóm không phải đồ uống pha ở Cài đặt hoá đơn. Sales.jsx:862 còn có cờ `khong_quan_kho` ("Pha khi khách gọi") — có thể
   là tín hiệu chính xác hơn, nhưng chưa biết dữ liệu thật có gán đúng không → chưa dùng. Cần chủ quán chốt.
2. DAC_TA luật 4 ghi tờ in lại có "IN LẠI · LẦN n"; phiếu P16 chỉ yêu cầu "IN LẠI". Làm "IN LẠI" (chưa đếm lần).

## Phát hiện (ngoài phạm vi, không sửa)
