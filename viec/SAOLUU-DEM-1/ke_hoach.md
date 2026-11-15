# SAOLUU-DEM-1 — kế hoạch (phiếu không đòi duyệt kế hoạch; chủ quán 15.11 dặn làm thẳng tới hết)

## Phương án (chọn ít dòng nhất đạt mọi ca nghiệm thu)
| Phần | A (chọn) | B | Lý do |
|---|---|---|---|
| Dựng tệp | tách `dungTepSaoLuu()` trong `backup.js`, `/export-all` + `/tu-dong` cùng gọi | chép vòng dựng sang cửa mới | B tạo hai bản dựng tệp — phiếu cấm (A1) |
| Khoá | `utils/khoaSaoLuuPos.js` (~70 dòng): 1 dòng `pos_settings` JSON `{ma_bam, tao_luc, tao_boi, lay_luc, lay_co}`, so băm bằng `timingSafeEqual`, trần 6/giờ/IP trong bộ nhớ | bảng riêng | phiếu: không thêm bảng |
| Giấu khoá khỏi Cài đặt | `settings.js`: `GET /` thêm `key != ?`, `GET /:key` → 404, `PUT /` → 403 `KHOA_RIENG` trước mọi lệnh ghi | lọc ở tầng `database.js` | chủ quán 15.11 đã chọn A |
| Xuất / khôi phục | `docBang()` bỏ dòng khoá ở `export-all` + `export/:table`; sau `lapKeHoach` (xem trước + khôi phục) bỏ dòng khoá khỏi kế hoạch, riêng khôi phục chèn lại dòng khoá HIỆN TẠI vào kế hoạch để cùng giao dịch DELETE+INSERT giữ nguyên khoá | sửa `khoiPhuc.js` | `khoiPhuc.js` ngoài Phạm vi; chèn vào kế hoạch thì nguyên tử, không có lúc khoá mất |
| Giao diện | `KhoaSaoLuuPos.jsx` (~70 dòng) + 3 dòng `Settings.jsx` + `api.js`? — `api.js` KHÔNG trong Phạm vi → thẻ dùng `api` có sẵn export? (xem dưới) | | |

`utils/api.js` không có trong Phạm vi: thẻ dùng hàm `api` mặc định đã export từ `utils/api.js` (cùng cách `ndKhoaApi`); không thêm export mới.

## Ca thử (cong_cu/thu_SAOLUUDEM1.js, máy chủ thật + kho tạm) ↔ nghiệm thu
- A1: một `XLSX.write(` trong backup.js; hai cửa gọi `dungTepSaoLuu(`; tệp cửa mới = tệp `/export-all` (cùng trang, cùng dòng); tên tệp như tải tay.
- B1: `posk_` + ≥ 43 ký tự; DB chỉ có băm; tạo mới → khoá cũ 401; trạng thái / Cài đặt không lộ băm.
- B2: không phải chủ quán → 403; thiếu / sai PIN → không tạo, không thu hồi; thu hồi có hiệu lực ngay.
- B3: `server/index.js` không đổi so với gốc (git diff).
- C1–C2: khoá đúng 200 xlsx; sai / thiếu / thu hồi / vé POS / khoá trong query → 401 `CHUA_DANG_NHAP` cùng một thân.
- C3: `posk_` ở export-all, orders, settings, auth/me, /api/nd/xuat → 401; `ndk_` ở cửa mới → 401.
- C4: 6 lần/giờ/IP (3 sai + 3 đúng) → lần 7 đúng và lần 8 sai → 429 `QUA_NHIEU_LAN`; IP khác không bị.
- C5: lần lấy gần nhất + cỡ tệp cập nhật; log có dòng `[sao-luu-tu-dong]` và KHÔNG chứa khoá (đúng lẫn sai).
- D: tĩnh — `KhoaSaoLuuPos.jsx` dùng `HoiPin`, chữ "Lần Google lấy gần nhất", "Chưa lấy lần nào", nút Chép, tên `KHOA_POS`; `Settings.jsx` gắn thẻ đúng một chỗ trong tab backup, chỉ chủ quán.
- Phát hiện: tệp xuất không có dòng khoá (export-all + export/pos_settings); khôi phục tệp có dòng khoá → khoá đang dùng nguyên, khoá cũ không sống lại, các dòng khác vẫn khôi phục; tệp chỉ có dòng khoá → bỏ qua trang, không xoá gì.
- K5 (luồng hợp lệ KHÔNG bị chặn): `/export-all` chủ quán vẫn 200 tên cũ; PUT `/settings` khoá thường vẫn 200; GET `/settings/<khoá thường>` vẫn 200; khôi phục tệp xuất bình thường vẫn chạy; `thu_SAOLUU2.js`, `thu_NDAPI1.js` xanh không sửa.

## Đường song song (K4)
Mọi cửa đọc / ghi `pos_settings` theo khoá tuỳ ý: settings.js GET /, GET /:key, PUT / (3 cửa, đã grep: các route khác ghi khoá cố định). Mọi cửa XUẤT bảng: `export-all`, `export/:table` (2); mọi cửa NẠP kế hoạch khôi phục: `preview-restore`, `restore` (2). `/info` đếm dòng `pos_settings` — chỉ hiển thị, ghi ở Phát hiện.
