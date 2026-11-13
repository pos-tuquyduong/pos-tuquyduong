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
Xem `ke_hoach.md` mục "Cần chủ quán trả lời" (Q-A … Q-D của phiếu + Q-E, Q-F, Q-G, Q-H máy thêm).

## Phát hiện
- `server/routes/auth.js` `POST /login`: không giới hạn số lần sai (đọc trong lượt này — không có bộ đếm nào trong file). Ngoài Phạm vi →
  đề xuất phiếu riêng (xem kế hoạch Q-A).
- `server/routes/auth.js` `POST /login`: tài khoản bị khoá trả câu riêng "Tài khoản đã bị vô hiệu hoá" TRƯỚC khi so mật khẩu → lộ tên đăng nhập
  có tồn tại và đang bị khoá. Ngoài Phạm vi; /api/nd sẽ không chép lỗ này (K4: chép cổng là chép lỗ).

## Bộ kiểm (13.11, sau commit kế hoạch)
- Lần đầu Stop hook báo đỏ `thu_BH2.js` G1: `fatal: bad revision 'cbbb809..HEAD'` — kho mở ở dạng NÔNG (`is-shallow-repository` = true), thiếu
  commit cũ bài cần; không do thay đổi của việc này (chỉ đổi viec/ND-API-1/). Đã `git fetch --unshallow origin viec/ND-API-1` (chỉ tải lịch sử).
- `npm test` lại: PASS 113 · FAIL 0 · CẢNH BÁO 1 (route GET có lệnh ghi: packages.js, products.js, sync.js — có từ trước, ngoài Phạm vi).
