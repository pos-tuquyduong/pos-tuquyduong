# KH-QUAY-2 — trạng thái

## Đối chiếu bản chụp (bước 1)
HEAD = FETCH_HEAD = 42b3ea5 (nhánh viec/KH-QUAY-2, cây sạch, đã đồng bộ origin).
```
42b3ea5 PHIEU: KH-QUAY-2
0b43549 TIEN-DO: KH-SP-1 (36db19b) xong; mo KH-QUAY-2, SAOLUU-2, them KHO-IN-1; quyet dinh 31.10 (...) — so v50
36db19b Merge pull request #56 from pos-tuquyduong/viec/KH-SP-1
```

## Cách chọn (xem ke_hoach.md)
- Phần B: **BỎ HẲN** A4 / A5 của hoá đơn khách (không ẩn): bảng khổ, nhánh header A5/A4 (~55 dòng chết), `isThermal ? x : y` (30 chỗ) trong InvoicePreview đều gọn về khổ nhiệt.
- Một hàm dùng chung `khoHoaDon(v)` ở `client/src/utils/inPhieu.js`; giá trị cũ ('a5', 'a4', rỗng, lạ) chỉ được ĐỌC thành 80mm, không sửa dữ liệu, không sửa máy chủ.
- Phần A: `MaAppSoMoi.jsx` + `chuanSdtQuay` (maApp.js) + prop `tuLay` của MaDangNhapApp.

## Bảng chỗ vá → đột biến (`python3 viec/KH-QUAY-2/dot_bien.py` → 32/32 BẮT, đối chứng XANH: q2 55 · p16 90 · q1 24)
| Chỗ vá | Đột biến |
|---|---|
| Customers.jsx gắn ô | BV-SO-MOI-GAN |
| MaAppSoMoi: giao MaDangNhapApp, chặn trước | BV-SO-MOI-THANH-PHAN · VS-SO-MOI-BO-CHAN · VS-SO-MOI-LUON-HIEN · VS-SO-MOI-TAO-KHACH · VS-SO-MOI-KHONG-BAO-LOI |
| MaDangNhapApp `tuLay` | BV-SO-MOI-TU-LAY |
| maApp.js chuanSdtQuay | VS-CHUAN-SDT-9-SO · VS-CHUAN-SDT-12-SO · VS-CHUAN-SDT-84 · VS-CHUAN-SDT-GIU-CHU |
| máy chủ không tạo khách (đối chứng, không đổi) | VS-CAP-MA-TAO-KHACH |
| inPhieu.js KHO_BILL / khoHoaDon / mặc định | BV-KHO-BILL-4-KHO · VS-KHO-GIU-A5 · VS-KHO-MAC-DINH-58 · VS-KHO-DOC-BO-IN-THO · VS-KHO-58-THANH-80 · BV-P16-MAC-DINH-A5 |
| InvoicePrint | BV-IP-BANG-A5 · BV-IP-KHONG-QUA-HAM · BV-IP-NHANH-IN-A4 |
| InvoiceSettings | BV-IS-OPTION-A5 · VS-IS-KHONG-QUA-HAM · BV-IS-MAC-DINH-A5 · BV-IS-XEM-TRUOC-A4 |
| InvoicePreview | BV-PV-CO-TO-A5 · BV-PV-KIEU-A5 · BV-PV-MAC-DINH-A5 |
| K5 vá quá tay | VS-QUA-TAY-KHO-PHIEU · VS-QUA-TAY-KHO-PHA-CHE · VS-QUA-TAY-NUT-MA-CU · VS-QUA-TAY-SEED-MAY-CHU |

## Kiểm
- `npm test`: PASS 89 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có từ trước). `npm test -- --day-du`: PASS 89 · FAIL 0 (dist khớp src, giả lập quầy xanh).
- thu_KHQUAY2: 55 đạt · 0 hỏng (gốc: 16 đạt · 39 hỏng). thu_P16: 90 đạt (C8, C24 sửa theo quyết định chủ quán 31.10 — đỏ trên gốc, xem bang_chung_do.txt).

## Phát hiện (không sửa — ngoài phạm vi)
- `server/database.js:1161` còn seed `invoice_default_size = 'a5'` và `server/routes/settings.js:268` mặc định `paper_size = 'a5'` (nhật ký in). Quầy đọc qua `khoHoaDon` nên ra 80mm; nên đổi hạt giống sang '80mm' ở một việc máy chủ riêng.
- Ba bản `normalizePhone` trùng nhau ở CustomerInput.jsx, CustomerSearch.jsx, ThanhKhach.jsx (không export); `chuanSdtQuay` là bản thứ tư vì bản nào cũng là hàm nội bộ. Gộp thành một hàm chung là việc dọn riêng.
- Còn chữ A4 / A5 ở vài nơi ngoài hoá đơn khách và đúng phạm vi cấm sửa: phiếu kho (Kho/XemPhieu.jsx, InPhieu.jsx KHO_GIAY) — GIỮ, thuộc KHO-IN-1.

## Câu hỏi
(không có)
