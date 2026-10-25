# DIEM-THAT-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (25.10.2026)
- Nhánh: `viec/DIEM-THAT-1`; cây sạch; HEAD `611b043` · FETCH_HEAD `611b043` (bằng nhau → không kéo).
- `git log --oneline -3`:
  ```
  611b043 PHIEU: DIEM-THAT-1
  5bee3b2 TIEN-DO: QUAY-AN-1 (cfb3f02), P24 (5cb2a03) xong; P3 duyet (tach P3b); mo DIEM-THAT-1 + BH-1; them P3b, BH-2; lich — so v40
  5cb2a03 Merge pull request #43 from pos-tuquyduong/viec/P24
  ```

## Bước 2–3 — đọc + kế hoạch
- Kế hoạch: `ke_hoach.md`. Phiếu dặn **chờ duyệt kế hoạch** → dừng sau khi push kế hoạch.
- Thăm dò (đã hoàn lại, không commit): vá tạm đúng phương án A rồi chạy bài cũ → biết trước bài cũ nào vỡ (ke_hoach.md mục 5).

## Câu hỏi
1. **`cong_cu/thu_P20.js` ngoài Phạm vi nhưng vỡ theo luật mới.** Ca `trả bằng ví: /nhan-diem → 200` (thu_P20.js:292) — đơn trả
   trọn bằng tài khoản nay 0 điểm gốc → /nhan-diem trả 400 `DON_KHONG_DU_DIEM`. Xin thêm `cong_cu/thu_P20.js` vào `## Phạm vi`
   (sửa ca đó: ví 10.000 + tiền mặt 15.000 → 200; thêm ca ví trọn → 400 `DON_KHONG_DU_DIEM`). Bài sửa ĐỎ trên gốc → không cần
   `## Bài thử cũ sửa`.
2. **Bill vẫn hứa "gấp k điểm" cho đơn 0 điểm thật** (orders.js:1207 `batDiem = nhandiem_enabled && !flashApplied`). Sau việc này,
   đơn trả trọn bằng tài khoản in mã nhận điểm + lời hứa, khách nhập thì bị 400 `DON_KHONG_DU_DIEM`. (Đã có từ trước với đơn
   < 1 điểm, nhưng nay gặp thường hơn.) Dòng 1207 nằm NGOÀI vùng sửa phiếu cho `orders.js`. Chủ quán chọn: (a) để nguyên, sửa ở
   HD-1 / P15; (b) cho phép sửa dòng 1207 trong việc này: `&& Math.floor(tienTinhDiem(...) / per) > 0` (thêm ~3 dòng + 1 ca thử).
   Máy đề xuất (a) — đúng vùng sửa, tránh đụng P3.

## Phát hiện
- `server/utils/doiSoat.js:257` chú thích "chủ quán chốt giữ floor(total/per)" cho D2 sẽ cũ sau việc này (I8 tính theo tiền thật).
  `server/utils/**` bị cấm → không sửa; việc sau sửa chú thích.
