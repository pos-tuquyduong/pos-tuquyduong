# MANKHACH-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: viec/MANKHACH-1 · HEAD = FETCH_HEAD = 10b1abc (không kéo thêm)
```
10b1abc PHIEU: MANKHACH-1
18ee394 TIEN-DO: KHO-2b, BH-CKTAY-1, KH-QUAY-2, KH-MUA-1 xong; mo SEPAY-1, MANKHACH-1, KHO-IN-1, KH-SDT-1, them KHO-2c; quyet dinh 31.10 ...
596c346 Merge pull request #60 from pos-tuquyduong/viec/KH-MUA-1
```

## Câu hỏi
- **Sao lưu bảng mới (phiếu "Đổi cấu trúc DB"):** SAOLUU-2 CHƯA gộp (`server/routes/backup.js` BACKUP_TABLES không có `pos_don_app`; grep 31.10).
  `backup.js` nằm NGOÀI Phạm vi nên việc này KHÔNG sửa nó. Hai bảng mới `pos_man_khach_quay`, `pos_man_khach_may` do bước 009 tạo (không
  ở `database.js` nên phép E8 không bắt). Đề xuất: SAOLUU-2 (hoặc việc sau) thêm hai tên bảng vào sao lưu — bảng ghép máy là dữ liệu
  tạm (mất thì ghép lại 1 phút), khoá lưu dạng băm, cân nhắc đưa vào BANG_KHONG_KHOI_PHUC. Không chặn việc này.
