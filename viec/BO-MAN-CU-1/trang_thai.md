# BO-MAN-CU-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (17.11.2026)
- Nhánh: `viec/BO-MAN-CU-1` · cây sạch (không file đã theo dõi đang sửa).
- `git fetch origin viec/BO-MAN-CU-1` → HEAD `d52b9fb` · FETCH_HEAD `d52b9fb` (bằng nhau — không kéo).
- `git log --oneline -3`:
  ```
  d52b9fb PHIEU: BO-MAN-CU-1 bo man Ban hang cu, khoa duong tao don thang, tam ngung goi (chu quan 17.11 14:47)
  c8d0c7d Merge pull request #99 from pos-tuquyduong/viec/KET-NOI-1
  4e25e56 KET-NOI-1: HEAD DA KIEM ae778712 sau khi ghep main
  ```
- Kho mây là kho nông → `npm test` gốc FAIL 1 (`thu_BH2` G1 cần lịch sử git). Đã `git fetch -q --unshallow origin viec/BO-MAN-CU-1` → gốc
  PASS 121 · FAIL 0 · CẢNH BÁO 1.

## Bước 2–3 — đọc, kế hoạch (17.11.2026)
- Đã đọc phiếu, CLAUDE.md, KHUON_LOI.md, CHECKLIST P3/P4/G/H, sổ quyết định (11.11 bỏ màn cũ + PIN; "Không công nợ"), code vùng sửa (file:dòng trong `ke_hoach.md` mục 0–1).
- Hai agent chỉ đọc: (1) đếm 38 bài gọi thẳng `POST /orders` theo ba cách B4; (2) kiểm kê từng ca của 22 bài bị ảnh hưởng (≈ 65 L · 430 F · 40 E).
- Agent soát kế hoạch (4 câu) bắt: thiếu `thu_gia_lap.js` (file luật) trong Câu 1; A2 vướng `Layout.jsx:69` (Cấm) + sót `banHang.css:1`;
  KB4 (ví + nợ) không đi phiên được; C3/C4/C6 chưa có bằng chứng, C1/C5 thiếu ca; đường vòng chuyển khoản không QR qua `pay-debt`;
  `thu_VOUCHER2.js:1110` dùng prop cũ; số dòng `TRUONG_DON` sai. Đã sửa hết vào `ke_hoach.md` (mục 3, 4.1b, 4.2, 4.3, 7, 8).
- Phiếu dặn "Chờ duyệt kế hoạch" → DỪNG ở bước 3.

## Câu hỏi
Năm câu ở `ke_hoach.md` mục 7, mỗi câu có đề xuất:
1. Thêm ĐÚNG TÊN 7 file luật vào Phạm vi (`gia_lap/kich_ban.js`, `gia_lap/donCu.js` mới, `thu_P20/P21/P26a/P26b.js`, `thu_gia_lap.js`) — bắt buộc.
2. Cho thêm một dòng `chayBaiThat('cong_cu/thu_BOMANCU1.js')` vào bộ kiểm (ngoài hai việc D2 cho).
3. A2: thêm `InvoiceSettings.jsx` vào Phạm vi (sửa một chú thích); `Layout.jsx:69` để nguyên (Cấm, không nói về màn bán hàng).
4. Duyệt cách tách `taoDon` = cửa chặn + `taoDonGoc` (xuất cho bài thử dựng đơn cũ, có phép khoá) và bài thử ≈ 780 dòng (phiếu ~300).
5. Chặn luôn ghi nợ / chờ thu ở đường thẳng (đường vòng chuyển khoản không QR qua thu nợ) — đề xuất làm luôn.

## Bước 1 — làm tiếp sau duyệt (18.11.2026, "BO-MAN-CU-1 tiep")
- Hook mở phiên kéo nhánh `4386c365 → 28b6efeb`. `git fetch` → HEAD `28b6efeb` · FETCH_HEAD `28b6efeb` (bằng nhau). Kho không nông.
- `git log --oneline -3`:
  ```
  28b6efeb PHIEU: BO-MAN-CU-1 chu quan duyet ke hoach 'dong y ca 5' (17.11 19:04): Pham vi 7 file luat + InvoiceSettings, chayBaiThat, taoDonGoc, KHONG_GHI_NO
  4386c365 BO-MAN-CU-1: ke hoach sua theo soat (thu_gia_lap, A2 vuong Layout, C1-C7 bang chung, duong vong pay-debt) — cho chu quan duyet
  01941256 BO-MAN-CU-1: ke hoach day du (cua chan taoDon, donCu cho bai thu cu, 4 cau hoi) — cho soat
  ```
- Chủ quán duyệt "đồng ý cả 5" (phiếu mục B4b). Code gốc của việc = `28b6efeb` (chưa đổi code chạy thật).
