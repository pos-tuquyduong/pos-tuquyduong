# KHACH-CK-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: `viec/KHACH-CK-1`, cây sạch.
- HEAD `29db8d3` · FETCH_HEAD `29db8d3` — bằng nhau, không kéo.
- `git log --oneline -3`:
  - `29db8d3 PHIEU: KHACH-CK-1`
  - `a3192b7 TIEN-DO: BH-2 (23d2369), KHO-2a (c8edb66) xong; mo KHACH-CK-1; them GIOVANG-1, KH-SP-1, KH-MUA-2, KH-SP-2, KH-TN-1; quyet dinh 30.10 (dat don online truoc khai truong); lich moi — so v48`
  - `c8edb66 Merge pull request #53 from pos-tuquyduong/viec/KHO-2a`
- Phiên làm tiếp (sau duyệt): HEAD `c4b0ce5` · FETCH_HEAD `c4b0ce5` — bằng nhau, không kéo.

## Duyệt kế hoạch (chủ quán, 30.10)
- Giữ hai cửa ghi, chỉ chặn mức > 0: đồng ý.
- Khôi phục sao lưu cũ đem mức giảm trở lại: chấp nhận, không sửa backup.js.
- Giờ vàng: khách từng có % riêng đi qua với giá Flash: đồng ý.
- Ô "Chiết khấu" giảm tay ở màn cũ: giữ nguyên.
- P20 / GOI1: KHÔNG thêm `## Bài thử cũ sửa`; bài sửa thường (LUAT §6.8) — đổi ca sang mã giảm + mỗi file thêm một ca đỏ trên gốc (hồ sơ
  cũ, không mã, trả đủ niêm yết → tổng không giảm); tự chạy bản gốc hai file trên code mới để chắc đỏ.

## Tiến độ
- Bước 4 (bài thử đỏ trước) xong — `bang_chung_do.txt` mục 1 (bài mới 8 đạt · 26 hỏng trên gốc) + mục 2 (bản gốc P20 / GOI1 / UUDAI1 /
  P26c / BH1 / BH2 đỏ trên code mới — P20 sập ở "20.000 ≠ 25.000", GOI1 sập ở "1.215.000 ≠ 1.350.000").
- Bước 5 (sửa) xong. Bước 6: `npm test -- --day-du` → PASS 86 · FAIL 0 · CẢNH BÁO 1 (cảnh báo cũ "route GET có lệnh ghi (3)" ở
  packages.js / products.js / sync.js — không thuộc việc này). Đã build `client/dist`.
- Bước 4 đợt 2: `node tu_chay/cong.js tinh . 29db8d3^ HEAD viec/KHACH-CK-1` → ĐỎ A6 (Phạm vi) — xem `## Câu hỏi`. **DỪNG ở đây** chờ chủ
  quán sửa phiếu; chưa chạy `/ra-soat`, chưa báo cáo 7 mục.

## Chỗ vá → đột biến (`python3 viec/KHACH-CK-1/dot_bien.py` → 34 đột biến · BẮT 34 · SỐNG 0 · HỎNG 0 · LẠC 0, đối chứng 7 bài xanh)
| Chỗ vá | Đột biến |
|---|---|
| `server/routes/orders.js` LO 2 — máy chủ thôi đọc chiết khấu hồ sơ | BV-LO2, BV-LO2-TINHTHU, BV-LO2-FLASH, BV-LO2-UUDAI1, BV-LO2-GOI1, BV-LO2-P20, VS-LO2-TIN-TO-KHAI |
| `server/routes/customers-v2.js` PUT `/:phone/discount` chặn > 0, ghi 0 | BV-CHAN-V2, BV-CHAN-V2-INSERT, BV-CHAN-V2-P26C, VS-CHAN-V2-CHI-PERCENT, VS-V2-GHI-MUC-THAN |
| `server/routes/customers.js` PUT `/:id/discount` chặn > 0, ghi 0 | BV-CHAN-V1, VS-CHAN-V1-CHI-FIXED, VS-V1-GHI-LOAI-THAN |
| `server/nang_cap/004_bo_chiet_khau_rieng.js` | BV-004-SAO-LUU, VS-004-SAO-LUU-SAU-UPDATE, VS-004-CHI-PERCENT, VS-004-CHI-DUONG, VS-004-LUON-SAO-LUU, BV-004-BANG-TRONG, VS-004-KHONG-LOG |
| `client/src/pages/BanHang/tinh.js` (tinhGio, dungDonHang, coChietKhauRieng) | BV-TINH-KHACHGIAM, BV-TINH-KHACHGIAM-BH1, BV-DUNG-DON-GUI-MUC, BV-TINH-COCHIETKHAURIENG |
| `client/src/pages/BanHang/BanHangMoi.jsx` bỏ khoá chanChietKhau | BV-CHAN-BANHANGMOI, BV-CHAN-BANHANGMOI-BH2 |
| `client/src/pages/Sales.jsx` bỏ điền mức khách khi chọn khách / chữ "KH:" | BV-SALES-CHON-KHACH |
| `client/src/components/CustomerInput.jsx` bỏ huy hiệu | BV-CUSTOMERINPUT-HUY-HIEU |
| `client/src/pages/Customers.jsx` bỏ lọc / cột / form; nhãn Ghi chú khách | BV-CUSTOMERS-LOC, VS-NHAN-GHI-CHU, VS-CUSTOMERS-GHI-CHU-KHI-CO-CK, VS-CUSTOMERS-MAT-GHI-CHU |

## Câu hỏi
1. **Thêm 6 bài thử cũ vào `## Phạm vi` của phiếu (đúng tên từng file).** Kế hoạch đã duyệt (mục 4) và lời duyệt của bạn yêu cầu sửa các bài
   này theo LUAT §6.8 — mình đã sửa, mỗi bài đỏ ở dạng gốc trên code mới và bản mới đỏ trên code gốc (`bang_chung_do.txt`). Nhưng cổng chỉ đọc
   Phạm vi từ phiếu, mà phiếu chỉ có commit `PHIEU: KHACH-CK-1` của bạn được sửa (A7) → máy không tự thêm được. Dòng cổng
   (`node tu_chay/cong.js tinh . 29db8d3^ HEAD viec/KHACH-CK-1`, HEAD `3775014`):
   ```
   ✗ [A6] file `cong_cu/thu_BH1.js` không có trong Phạm vi của phiếu
   ✗ [A6] file `cong_cu/thu_BH2.js` không có trong Phạm vi của phiếu
   ✗ [A6] file `cong_cu/thu_GOI1.js` không có trong Phạm vi của phiếu
   ✗ [A6] file luật `cong_cu/thu_P20.js` phải ghi ĐÚNG TÊN trong Phạm vi (glob chung không mở được file luật)
   ✗ [A6] file `cong_cu/thu_P26c.js` không có trong Phạm vi của phiếu
   ✗ [A6] file `cong_cu/thu_UUDAI1.js` không có trong Phạm vi của phiếu
   ```
   (cùng lần chạy còn `✗ [A17]` — tên đột biến chưa ghi vào file này, nay đã ghi ở bảng trên — và `✗ [A19]` chưa tới bước 11.4: bình thường.)
   Đề xuất: chat thêm 6 dòng sau vào `## Phạm vi` (commit `PHIEU: KHACH-CK-1 …`), rồi gõ `/lam-viec KHACH-CK-1 tiep`:
   `cong_cu/thu_BH1.js` · `cong_cu/thu_BH2.js` · `cong_cu/thu_GOI1.js` · `cong_cu/thu_P20.js` · `cong_cu/thu_P26c.js` · `cong_cu/thu_UUDAI1.js`.
   Ghi nhận thật: mình sửa các file này bằng lệnh Python (luật F8 với chuỗi tiếng Việt) — người gác không chặn, nhưng chúng ngoài Phạm vi
   phiếu; mình làm vì kế hoạch đã duyệt và lời duyệt nêu thẳng P20 / GOI1. Không muốn thêm thì báo, mình gỡ.

## Phát hiện
- `server/routes/backup.js` khôi phục `pos_customers` đủ cột, không khôi phục `pos_nang_cap` → bản sao lưu trước 004 đem lại mức chiết khấu
  riêng (chủ quán chấp nhận 30.10; tiền vẫn đúng vì máy chủ không áp).
- Đột biến cũ sẽ lạc neo sau việc này: `viec/BH-1/dot_bien.py:42`, `viec/BH-2/dot_bien.py:85-86`, `viec/LUOI-5/dot_bien.py:57-58`.
- Ô "Chiết khấu" giảm tay ở màn Bán hàng cũ (`client/src/pages/Sales.jsx`) không có tác dụng ở máy chủ từ POS-CONGDON-v1; tổng hiện theo
  tinh-thu nên chỉ lộ khi tinh-thu lỗi. Chủ quán dặn giữ.
- Cửa `PUT /api/pos/customers/:id/discount` quầy không gọi; chỉ `cong_cu/thu_P3.js:448` khoá quyền. Dọn sau khai trương.
- `thu_KHO2a.js` E6b chạy MỌI bước nâng cấp trên kho trống không có `pos_customers` — bước đổi dữ liệu phải tự kiểm cột có chưa (004 đã làm,
  ca C6). Bước sau chạm bảng cũ nhớ cùng điều này.
