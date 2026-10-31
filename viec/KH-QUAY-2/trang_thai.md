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

## Soát độc lập (/ra-soat, vòng 1)
Kết quả: **ĐẠT**, nghiệm thu 4/4 có bằng chứng (A: thu_KHQUAY2 [A1][A2][A3] + đột biến SO-MOI/CHUAN-SDT · B: [B1][B2] + thu_P16 C8/C24 · C: [C1]–[C5] + VS-QUA-TAY-* · D: dòng thu_KHSP1 trong kiem_tra_truoc_khi_giao.js, npm test chạy nó).
Lỗi nhẹ đã sửa ở 16a7033: hàm thừa `conA4A5` trong bài thử; `minHeight: styles.minHeight` mồ côi ở InvoicePreview.jsx (đã build lại dist).
Không sửa (ghi nhận): phép tĩnh A2/B2 dò chuỗi trong nguồn chưa bỏ comment — bù bằng 32/32 đột biến BẮT; chuanSdtQuay bỏ mọi ký tự không phải số (máy chủ chặn ở bước sau, không thiệt hại); bấm "Cấp mã" lần hai cùng số không đổi mã (dùng nút "Lấy mã mới" bên trong); chưa có ca 403 `canCauHinhKhach` ở thu_KHQUAY2 (đã có ở thu_KH1 mục F, thành phần giao diện hiện `err.message`).
Phát hiện thêm: ô "Khổ mặc định" của InvoiceSettings lưu `config.default_size`, còn in thật đọc `settings.invoice_default_size` — grep không thấy chỗ ghi; có từ trước, nghi ô này không tác động in. Cần việc riêng.

## Bài học
- NGUYÊN TẮC (đề xuất, ngoài Phạm vi): phép tĩnh dò chuỗi trong nguồn nên bỏ comment trước khi so, cùng một hàm đọc cho mọi phép (K3 marker suông).
- NGUYÊN TẮC: bỏ một nhánh điều kiện thì quét thuộc tính mồ côi và comment của nhánh đó (minHeight sót lại).
- BỎ: `conA4A5` thừa — chỉ một lần.
- KHOÁ: 0 mới (bài thu_KHQUAY2 + 32 đột biến chính là khoá của việc này).

## Báo cáo
```
VIỆC:        KH-QUAY-2 — Quầy: cấp mã đăng nhập App cho SĐT mới · hoá đơn khách chỉ còn khổ nhiệt
ĐÃ SỬA:      client/src/components/MaAppSoMoi.jsx (mới) · utils/maApp.js chuanSdtQuay · MaDangNhapApp.jsx prop tuLay · pages/Customers.jsx gắn ô ·
             utils/inPhieu.js khoHoaDon + KHO_BILL 58/80 · InvoicePrint.jsx · InvoicePreview.jsx · pages/InvoiceSettings.jsx (bỏ A4/A5 hoá đơn khách) ·
             cong_cu/thu_P16.js C8,C24 · kiem_tra_truoc_khi_giao.js (+thu_KHSP1, +thu_KHQUAY2) · client/dist build lại
BÀI THỬ:     thu_KHQUAY2 trên gốc 42b3ea5 → ĐỎ 39/55 (hàm chuanSdtQuay, khoHoaDon, MaAppSoMoi, bảng khổ chưa có…); sau vá 55/55 XANH; thu_P16 C8,C24 đỏ trên gốc → 90/90;
             đột biến 32/32 BẮT; npm test + --day-du PASS 89 FAIL 0; cổng tu_chay/cong.js chay ĐẠT
ĐÃ RÀ K4:    grep a5|a4 trong client/src → còn lại chỉ phiếu kho/pha chế (giữ đúng) và comment; isThermal 0 chỗ; 3 bản normalizePhone ghi Phát hiện
CHƯA KIỂM:   chưa bấm thử trên điện thoại/trình duyệt thật (ô số mới, in 58mm/80mm, HD-1, tem); chưa có ca 403 trong thu_KHQUAY2; ô "Khổ mặc định" có tác động in hay không chưa rõ
GIT:         git log --oneline -2 → 16a7033 build client/dist · (trước đó) dọn code dư sau soát
BÀI HỌC:     KHOÁ 0 · NGUYÊN TẮC 2 (đề xuất) · BỎ 1
```

Cổng chạy ở 16a7033: ✓ CỔNG CHẠY ĐẠT

HEAD ĐÃ KIỂM: 16a7033


Chat soát (31.10): soát độc lập ĐẠT (4/4), code dư đã dọn. Hai phát hiện (máy chủ còn mặc định a5; ô "Khổ mặc định" ở Cài đặt hoá đơn lưu config.default_size mà lệnh in đọc invoice_default_size) → việc KHO-IN-1. Chat gộp main (đụng kiem_tra_truoc_khi_giao.js — giữ cả 3 dòng bài), dist dựng lại.
HEAD ĐÃ KIỂM: 11ca2a2
