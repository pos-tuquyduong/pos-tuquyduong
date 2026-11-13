# ND-API-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: `viec/ND-API-1`; cây sạch; HEAD `bbf5eaf` = FETCH_HEAD `bbf5eaf` (bằng nhau — không kéo).
- `git log --oneline -3`:
  ```
  bbf5eaf PHIEU: ND-API-1
  4434ad5 TIEN-DO: HUY-1 xong (171109f); mo QC-APP-1 (Sonnet) + ND-API-1 (Opus lan 2) — so v64
  171109f Merge pull request #91 from pos-tuquyduong/viec/HUY-1
  ```

## Tiến độ
- 13.11 — bước 2 (đọc) xong; bước 3: `ke_hoach.md` viết xong, agent phụ soát. Phiếu: "CÓ kế hoạch chủ quán duyệt" → commit, push, DỪNG chờ duyệt.

## Câu hỏi
Xem `ke_hoach.md` mục "Cần chủ quán trả lời" (Q-A … Q-D của phiếu + Q-E, Q-F, Q-G máy thêm).

## Phát hiện
- `server/routes/auth.js` `POST /login`: không giới hạn số lần sai (đọc trong lượt này — không có bộ đếm nào trong file). Ngoài Phạm vi →
  đề xuất phiếu riêng (xem kế hoạch Q-A).
- `server/routes/auth.js` `POST /login`: tài khoản bị khoá trả câu riêng "Tài khoản đã bị vô hiệu hoá" TRƯỚC khi so mật khẩu → lộ tên đăng nhập
  có tồn tại và đang bị khoá. Ngoài Phạm vi; /api/nd sẽ không chép lỗ này (K4: chép cổng là chép lỗ).
