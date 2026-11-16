# GIAO-2 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: viec/GIAO-2 · cây sạch
- HEAD 0c84944 · FETCH_HEAD 0c84944 (bằng nhau — không kéo)
```
0c84944 PHIEU: GIAO-2 bo sung B4 Tai lai hoi Ahamove ngay, B5 phan da co (chu quan 16.11 14:28)
4c52117 PHIEU: GIAO-2
1d66c61 Merge pull request #97 from pos-tuquyduong/viec/SAOLUU-DEM-1
```

## Kế hoạch / soát kế hoạch (bước 3)
- `ke_hoach.md`. Agent phụ soát kế hoạch (chỉ đọc) — đã nhận: (1) sổ chống lặp ghi TRƯỚC khi cập nhật thẻ → kho hỏng giữa chừng thì tin lặp bị bỏ mãi
  (thêm ca A2d + vá gỡ dòng); (2) A3 phải chạy khi cả hai tin cùng đang xử lý + đếm câu cập nhật; (3) A4 không gửi tin thứ hai (Ahamove đã nhận 200
  thì không gửi lại) — phục hồi bằng "Tải lại"; (4) A5 thêm ca "chuyến cũ đã thay"; (5) `.then(tai)` ở in tem sẽ truyền đối số lạ → sửa `() => tai()`;
  (6) `baoVe` của thu_GIAO1 phải gom cả nhật ký phần nền (quét khoá A3); (7) bỏ gỡ `{data}` (đoán), chỉ gỡ mảng / `{order}`.
- Không nhận: hàm chờ `choTinBao` (giữ — bài thử cần chờ phần nền, một Set nhỏ); `docLaiPhiHuy` (đường phí huỷ — Cấm "không đụng tiền") → Phát hiện.

## Chỗ vá → đột biến (viec/GIAO-2/dot_bien.py)
| Chỗ vá | Đột biến |
|---|---|
| routes/giao-hang.js cửa tin báo: trả 200 rồi mới xử lý | BV-tra-loi-ngay · VS-200-truoc-khoa |
| giaoHang.js nhanTinBaoNen: lỗi nền chỉ ghi log | VS-nen-khong-bat-loi |
| giaoHang.js nhanTinBao: thẻ dang_goi bỏ qua, không 409 | BV-tin-dang-goi · VS-tin-dang-goi-409 |
| giaoHang.js nhanTinBao: gỡ dòng chống lặp khi cập nhật thẻ hỏng | BV-go-chong-lap · VS-go-chong-lap-moi-trang-thai |
| ahamove.js motChuyen (gỡ mảng / {order}) | BV-mot-chuyen · VS-mot-chuyen-chi-mang |
| hạn đọc lại 4 s (HAN_DOC_LAI_MS, goiTho `han`) | BV-han-doc-lai · BV-han-goi-tho |
| danhSach: log lỗi đọc lại (hết `catch {}`) | BV-log-loi-doc-lai |
| danhSach: "Tải lại" đọc ngay (5 s), trần 8, hẹn 15 s giữ 60 s | BV-doc-lai-ngay · VS-tai-lai-khong-chan-don · VS-tai-lai-ca-hen-gio · VS-tran-tai-lai · BV-cua-doc-lai |
| logGiao: dòng [GIAO] không SĐT | BV-log-giao · VS-log-sdt-tai-xe |
| màn Giao hàng / api.js: nút Tải lại gửi cờ | BV-nut-tai-lai · VS-in-tem-truyen-doi-so · BV-api-doc-lai |
