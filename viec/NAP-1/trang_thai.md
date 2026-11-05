# NAP-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (05.11.2026)
- `git branch --show-current` → `viec/NAP-1`; `git status --short` → sạch.
- Hai SHA: HEAD `0406870` · FETCH_HEAD `0406870` (bằng nhau — không kéo).
- `git log --oneline -3`:
  ```
  0406870 PHIEU: NAP-1
  2c81b0f TIEN-DO: MANKHACH-1 (ae27536), TU-CHAY-10 (4891879), KHO-IN-1 (d1b57b8) xong; dot quyet dinh 01-02.11 + thiet_ke dot 2 + hop dong v7 (da hen) + lich theo lan; mo GIO-VN-1, HANG-1, NAP-1 — so v53
  d1b57b8 Merge pull request #64 from pos-tuquyduong/viec/KHO-IN-1
  ```

## Bước dở
Bước 3 xong (kế hoạch `ke_hoach.md`). Phiếu dặn **chờ duyệt kế hoạch** → DỪNG. Chưa viết bài thử, chưa sửa code.

## Thử dò (không commit)
Để câu hỏi Phạm vi có danh sách đúng, máy sửa TẠM `server/utils/diemThat.js` theo luật E (tính cả phần ví), chạy `npm test`, rồi trả
file về nguyên bản (`git status --short` sạch sau đó). Kết quả: PASS 85 · FAIL 7 — đỏ đúng các bài khoá luật điểm cũ:
`thu_P20.js`, `thu_P2223.js`, `thu_P24.js`, `thu_DIEMTHAT1.js`, `thu_P3.js`, `thu_KHMUA1.js`, `thu_DOISOAT1.js` (bài cuối đỏ qua bất biến I8
của `cong_cu/gia_lap/bat_bien.js`, chép luật điểm cũ).

## Câu hỏi
1. **Phạm vi thiếu file cho mục E (điểm khi tiêu ví) và đối soát hai ngăn.** Luật điểm nằm ở `server/utils/diemThat.js` (một hàm cho POST /orders,
   pay-debt, nhận điểm mã bill); trọng tài đối soát chép riêng luật này ở `cong_cu/gia_lap/bat_bien.js` (I8). Cả hai ngoài Phạm vi. Bất biến
   "thưởng ví = tổng phần thưởng của sổ, 0 ≤ thưởng ≤ số dư" (mục C) cũng phải nằm ở `bat_bien.js` (Đối soát chỉ chạy một bản bất biến).
   Bảy bài thử cũ đỏ vì đổi luật E đã được chủ quán duyệt (LUAT_XAY_APP §6.8 — bài sửa thường, không phải "Bài thử cũ sửa").
   **Đề xuất:** thêm vào `## Phạm vi`:
   `server/utils/diemThat.js` · `cong_cu/gia_lap/bat_bien.js` · `cong_cu/thu_P20.js` · `cong_cu/thu_P2223.js` · `cong_cu/thu_P24.js` ·
   `cong_cu/thu_DIEMTHAT1.js` · `cong_cu/thu_P3.js` · `cong_cu/thu_KHMUA1.js` · `cong_cu/thu_DOISOAT1.js`.
2. **Nhóm "Nạp tiền" ở màn Bán hàng nào?** Có hai màn: màn mới (`BanHang/BanHangMoi.jsx`, thu tiền qua phiên + QR) và màn cũ (`Sales.jsx`,
   mặc định của máy chưa bật). Bản vẽ đã chốt `ban_mau_pos/` chưa có nhóm Nạp tiền (CLAUDE.md §9: đổi thiết kế phải sửa bản mẫu trước, có
   chủ quán duyệt). **Đề xuất:** chỉ làm ở MÀN MỚI (một nút nhóm "Nạp tiền" cạnh các nhóm món, giỏ chỉ chứa một gói, ẩn dòng trừ tài
   khoản và ô mã) — coi mục M4 của `THIET_KE_DOT2.md` là bản vẽ đã duyệt, không sửa `ban_mau_pos/`. Màn cũ không bán gói nạp (nạp tay
   `/topup` ở màn Số dư vẫn chạy như cũ). Bạn chọn: (a) như đề xuất · (b) cả hai màn · (c) sửa bản mẫu `ban_mau_pos/` trước.
3. **Hoàn MỘT PHẦN một đơn đã trả bằng ví (đền bù sự cố):** phiếu nói "trả về đúng ngăn đã trừ" — với hoàn trọn thì mọi cách đều ra đúng.
   Với hoàn một phần, máy đề xuất **chia theo tỷ lệ phần ví của đơn** (đơn trả ví 50.000 trong đó thưởng 10.000, đền 20.000 → 4.000 về
   thưởng, 16.000 về tiền nạp; tổng thưởng trả về của một đơn không bao giờ vượt phần thưởng đã trừ). Xác nhận hoặc chọn "trả thưởng trước".

## Phát hiện
- HANG-1 chưa gộp (sổ việc `[ ]`, phiếu dặn NAP-1 làm SAU HANG-1). Kế hoạch viết trên `0406870`; HANG-1 đổi `orders.js` (mua thẻ) và dùng
  bước nâng cấp 013 → khi duyệt, nhánh `viec/NAP-1` cần đi từ `main` đã có HANG-1 (máy không tự `merge`). Số dòng trích trong kế hoạch sẽ trôi.
- Két (`server/utils/doiSoat.js` `tienTheoSo`) cộng cả tiền mặt của ĐƠN lẫn dòng sổ ví `topup` theo cách trả — đơn nạp ghi cả hai sẽ bị đếm
  đôi nếu không chặn (kế hoạch mục 5 xử lý: két chỉ đếm dòng `topup` không gắn đơn).
