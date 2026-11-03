# CT-1a — trạng thái

Mở phiên (03.11.2026): nhánh `viec/CT-1a`, HEAD = FETCH_HEAD = `0cd852f`.
```
0cd852f PHIEU: CT-1a
afc2000 HOP-DONG: v7 da hen them cach_tra / giu_vi / con_lai cua /don (HD-KH-1) + cach App hien so du vi (QUA-1) — App KH 02.11 c, d
2c81b0f TIEN-DO: MANKHACH-1 (ae27536), TU-CHAY-10 (4891879), KHO-IN-1 (d1b57b8) xong; dot quyet dinh 01-02.11 + thiet_ke dot 2 + hop dong v7 (da hen) + lich theo lan; mo GIO-VN-1, HANG-1, NAP-1 — so v53
```

## Câu hỏi
**CẦN CHỦ QUÁN QUYẾT (chặn `npm test` xanh):** `cong_cu/thu_KH1.js` dòng ca E1 khoá ĐÚNG 8 trường của `GET /api/kh/toi.khach`
(`dia_chi · hang · ngay_tao · qr · sdt · so_du_vi · ten · xung_ho`). Việc này thêm `ngay_sinh` (phiếu nghiệm thu C) nên ca E1 đỏ:
`✗ E1 … HTTP 200 · dia_chi,hang,ngay_sinh,ngay_tao,qr,sdt,so_du_vi,ten,xung_ho`. Theo `LUAT_XAY_APP.md` §6.7 máy được sửa đúng dòng danh sách đó
(8 → 9 trường, vẫn so BẰNG) mà không hỏi, nhưng người gác chặn vì `thu_KH1.js` không nằm trong `## Phạm vi` (`[G5-NGOAIPV]`) — máy KHÔNG lách.
Đề xuất: thêm `cong_cu/thu_KH1.js` vào Phạm vi (hoặc chat soát sửa một dòng này): thêm `'ngay_sinh'` vào danh sách và đổi chữ "8 trường" → "9 trường";
bản mới đỏ trên gốc `0cd852f` (gốc chỉ có 8) và xanh trên code mới; ghi `SỐ CA cong_cu/thu_KH1.js`. Không còn phép đỏ nào khác trong `npm test`.

## Phát hiện (ngoài Phạm vi, không sửa)
- `server/routes/kh/loi.js` là chỗ tự nhiên cho hai mã `NGAY_SINH_SAI` / `NGAY_SINH_DA_CO`; ngoài Phạm vi nên để bảng `LOI_NGAY_SINH` trong `routes/chuong-trinh.js`
  (dùng chung quầy + App, bài hợp đồng quét thêm file này). Gộp về `loi.js` ở việc sau.
- `server/routes/users.js` (danh sách nhãn quyền ở màn Phân quyền) chưa có nhãn cho `sua_ngay_sinh` (cùng tình trạng `xoa_pin_khach`): chủ quán luôn qua; muốn cấp cho quản lý
  qua giao diện phải thêm nhãn. Hiện cấp bằng cách sửa bảng phân quyền.
- Quy tắc ngày/tuổi nằm ở `routes/chuong-trinh.js` (không có `utils/` trong Phạm vi); CT-1b nên tách `utils/chuongTrinh.js` khi cần dùng chung với `orders.js`.

## Bảng chỗ vá → đột biến (`viec/CT-1a/dot_bien.py`, 75 đột biến; chạy `--liet-ke` để xem đủ tên)
- Ngày thật / dạng ngày: BV-NGAY-KHONG-KIEM-LICH · VS-DANG-NGAY-LONG-LEO
- Tuổi: BV-TUOI-TOI-THIEU · VS-TUOI-TOI-THIEU-LECH · BV-TUOI-TOI-DA · VS-TUOI-TOI-DA-LECH · VS-TUOI-BO-QUA-SINH-NHAT · VS-TUOI-LAY-TUYET-DOI
- Khoảng tuổi cài đặt: BV-KHOANG-TUOI-CAI-DAT · VS-KHOANG-TUOI-MIN-LON-MAX · BV-KHOANG-TUOI-KIEM-MIN-MAX · VS-KHOANG-TUOI-TRAN-151
- datNgaySinh (một lần · lý do · sổ): BV-CHAN-DA-CO · BV-BAT-LY-DO · VS-LY-DO-KHONG-CAT · VS-LY-DO-QUA-DAI-LOT · VS-LY-DO-DAI-SIET · BV-GHI-SO-NGAY-SINH · VS-SO-GHI-NHAM-GIA-TRI-CU · VS-SO-GHI-LY-DO-LAN-DAU · BV-KHACH-KHONG-CO
- Kiểm chương trình: BV-UU-DAI-TOI-THIEU-MOT · VS-GIAM-CA-DON-TRAN-101 · VS-GIAM-CON-LAI-TRAN-101 · VS-SO-NHAN-CHUOI · BV-NGAY-KET-TRUOC-BAT-DAU · VS-NGAY-BANG-NHAU-BI-CHAN · BV-NGAY-CT-PHAI-THAT · VS-TEN-DAI-NOI · VS-TEN-DAI-SIET · VS-MO-TA-DAI-NOI · BV-LOAI-PHAI-TRONG-DANH-SACH · BV-KY-PHAI-TRONG-DANH-SACH · VS-SO-LAN-CHO-0 · VS-SO-LAN-TRAN-100 · VS-MIEN-MON-TRAN-21 · VS-GIA-MIEN-CHO-0 · BV-CO-PHAI-LA-BOOL
- Quyền / sửa từng phần: BV-QUYEN-QUAN-LY-KHUYEN-MAI · BV-DANG-NHAP-CHUONG-TRINH · VS-SUA-MAT-TRUONG-KHONG-GUI
- GET /chuong-trinh: BV-LOC-DANG-BAT · BV-LOC-NGAY-BAT-DAU · BV-LOC-NGAY-KET-THUC · VS-LOC-BAT-DAU-LECH · VS-LOC-KET-THUC-LECH · VS-LOC-SAI-THU-TU · VS-CONG-KHAI-LO-UU-DAI · BV-CONG-KHAI-KHONG-TRAN-LUOT · VS-CONG-KHAI-DOI-TOKEN
- App PUT /toi, hồ sơ: BV-HOSO-NGAY-SINH · BV-PUT-TOI-NHAN-NGAY-SINH · VS-PUT-TOI-APP-SUA-DUOC · VS-PUT-TOI-BO-QUA-LOI-NGAY-SINH
- Quầy: BV-QUYEN-SUA-NGAY-SINH · VS-QUYEN-SUA-NHAM-QUYEN-KHAC · VS-NHAP-LAN-DAU-CUNG-CAN-QUYEN · BV-QUAY-KHACH-KHONG-CO · BV-QUAY-SDT-HONG · BV-QUAY-NGAY-SINH-KHONG-DANG-NHAP · BV-DANH-SACH-KHACH-NGAY-SINH
- Bước 017: VS-017-QUYEN-NHAN-VIEN · VS-017-QUYEN-QUAN-LY · BV-017-COT-NGAY-SINH · BV-017-BANG-SO · VS-017-MAU-BAT-SAN · VS-017-MAU-HOC-SINH-GIOI-KY · VS-017-MAU-SINH-NHAT-DOI-CHO
- Sao lưu / gắn route / giao diện: BV-SAO-LUU-CHUONG-TRINH · BV-SAO-LUU-SO-NGAY-SINH · BV-SO-NGAY-SINH-KHOI-PHUC-DUOC · BV-GAN-ROUTE-CHUONG-TRINH · BV-THE-CHUONG-TRINH-TRONG-NHOM · VS-CUSTOMERS-SUA-KHONG-HOI-QUYEN · BV-API-NGAY-SINH

## Kiểm
- `node cong_cu/thu_CT1a.js` → 75 đạt · 0 hỏng. `node cong_cu/thu_HOPDONG_KH.js` → 85 đạt · 0 hỏng.
- `npm test` → chỉ còn ✗ thu_KH1.js E1 (xem `## Câu hỏi`). `(cd client && npm run build)` đã chạy, `client/dist` đã commit.
- CHƯA chạy: `node kiem_tra_truoc_khi_giao.js --day-du`, `node tu_chay/cong.js chay`, `/ra-soat`, `/soat-bao-mat` (phiếu có `## Soát bảo mật: có`) — dừng chờ chủ quán quyết câu hỏi trên trước, để soát một lần trên bản cuối.

## Báo cáo 7 mục (tạm — chưa xong vì còn câu hỏi)
VIỆC:        CT-1a — Thẻ Cài đặt "Chương trình" + ngày sinh khách + cửa App `/chuong-trinh`, `PUT /toi.ngay_sinh`
ĐÃ SỬA:      server/nang_cap/017_chuong_trinh.js (bảng, cột, quyền, 2 mẫu) · server/routes/chuong-trinh.js (quầy + datNgaySinh + dsCongKhai) · server/routes/kh/index.js (hoSo, GET /chuong-trinh, PUT /toi) · server/routes/customers-v2.js (PUT /:phone/ngay-sinh, list có ngay_sinh) · backup.js · server/index.js · client (ChuongTrinh.jsx, Settings.jsx, Customers.jsx, api.js, dist) · HOP_DONG_API_KH.md v6 · thu_HOPDONG_KH.js
BÀI THỬ:     thu_CT1a.js trên gốc 0cd852f → ĐỎ (4 đạt · 69 hỏng); sau vá → XANH 75/75; đột biến 75/75 BẮT
ĐÃ RÀ K4:    grep `UPDATE pos_customers` / `ngay_sinh` toàn server → chỉ datNgaySinh ghi cột ngay_sinh (App + quầy gọi chung); `hoSo()` dùng chung /toi, PUT /toi, xác minh; bước 017 gặp bài kho thử thiếu bảng khách (thu_KHO2a, thu_KHAPI3) → thêm khuôn chặn như bước 003
CHƯA KIỂM:   thu_KH1.js E1 (ngoài Phạm vi, đang đỏ) · `--day-du`, cổng `tu_chay/cong.js chay`, `/ra-soat`, `/soat-bao-mat` · điều kiện `ngay_sinh IS <cũ>` + kiểm `changes` trong datNgaySinh là lớp phòng thủ thứ hai (giao dịch ghi đã tuần tự hoá) nên không có đột biến bắt được · race "trống lúc kiểm quyền, có lúc ghi" của quầy không dựng tất định được · giao diện chưa thử tay trên điện thoại · Turso thật chưa thử bước 017
GIT:         xem `git log --oneline -2`
BÀI HỌC:     (chưa viết — làm ở bước 11 sau khi có quyết định) gợi ý: KHOÁ — bước nâng cấp mới phải chịu kho thử thiếu bảng (thu_KHO2a/KHAPI3 bắt); NGUYÊN TẮC — bài thử đếm "trước/sau" phải chụp ngay trước lời gọi (B6)

Thử tay trên điện thoại (khi xong): (1) Cài đặt → Khách hàng → Chương trình: thêm một chương trình, bật, xem App `/chuong-trinh`; (2) Khách hàng → mở một khách → Ngày sinh: nhập, rồi thử sửa bằng tài khoản nhân viên (phải bị chặn).
