# KHACH-CK-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: `viec/KHACH-CK-1`, cây sạch.
- HEAD `29db8d3` · FETCH_HEAD `29db8d3` — bằng nhau, không kéo.
- `git log --oneline -3`:
  - `29db8d3 PHIEU: KHACH-CK-1`
  - `a3192b7 TIEN-DO: BH-2 (23d2369), KHO-2a (c8edb66) xong; mo KHACH-CK-1; them GIOVANG-1, KH-SP-1, KH-MUA-2, KH-SP-2, KH-TN-1; quyet dinh 30.10 (dat don online truoc khai truong); lich moi — so v48`
  - `c8edb66 Merge pull request #53 from pos-tuquyduong/viec/KHO-2a`

## Tiến độ
- Bước 2 (đọc) xong. Bước 3 (kế hoạch) xong — `ke_hoach.md`. Phiếu dặn **Chờ duyệt kế hoạch** → DỪNG ở bước 3, chưa sửa code, chưa viết bài thử.

## Câu hỏi
Xem `ke_hoach.md` mục 5 (đề xuất sẵn):
1. Giữ hai cửa PUT `/discount`, chỉ chặn mức > 0 (cửa v2 là chỗ duy nhất sửa Ghi chú khách) — đề xuất đồng ý.
2. Thêm `## Bài thử cũ sửa` vào phiếu cho `cong_cu/thu_P20.js` (ca "có chiết khấu") và `cong_cu/thu_GOI1.js` (B3c, B3p): đổi cách dựng "đơn có
   giảm" từ chiết khấu hồ sơ sang mã giảm → vẫn xanh trên gốc → cổng A11 đòi mục này. Các bài cũ còn lại (UUDAI1 G5b, P26c X1, BH1 D13/D14/I8,
   BH2 coChietKhauRieng/S19) đỏ trên gốc vì hành vi đã duyệt đổi → LUAT §6.8, không cần mục đó.

## Phát hiện
- Ô "Chiết khấu" giảm tay ở màn Bán hàng cũ (`client/src/pages/Sales.jsx` ~1464–1490) không có tác dụng ở máy chủ từ POS-CONGDON-v1 (máy chủ bỏ
  qua `discount_type/value` của thân); tổng hiện theo tinh-thu nên chỉ lộ khi tinh-thu lỗi. Phiếu dặn giữ (F) — để việc sau dọn.
- Cửa `PUT /api/pos/customers/:id/discount` (`server/routes/customers.js` ~508) quầy không gọi; chỉ `cong_cu/thu_P3.js:448` khoá quyền. Dọn sau
  khai trương.
