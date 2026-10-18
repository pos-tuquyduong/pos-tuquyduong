# DOI-SOAT-1 — trạng thái

## Bước 1 · đối chiếu bản chụp (18.10.2026)

- Nhánh: `viec/DOI-SOAT-1`. Cây sạch (không dòng nào ngoài `??`).
- `git fetch origin viec/DOI-SOAT-1`: HEAD = FETCH_HEAD = `2123b69` → không kéo.
- `git log --oneline -3`:
  ```
  2123b69 PHIEU: DOI-SOAT-1
  0bffc03 TIEN-DO: LUOI-5 (c8c20b3), TU-CHAY-8 (8259a59) xong; mo KH-API-1 + P26d + DOI-SOAT-1 + P16; them KH-OTP-1, DONG-CUNG-1; lich KH-OTP-1 — so v37
  8259a59 Merge pull request #33 from pos-tuquyduong/viec/TU-CHAY-8
  ```
- Kho NÔNG (`git rev-parse --is-shallow-repository` = true): commit của bản vá trong sổ (`9a68ab6`, `28638d0`, `c3d5816`…) không có → không đối chiếu được ngày gộp bằng git.

## Bước 2–3 · kế hoạch

- `ke_hoach.md` viết xong (đọc code thật: `bat_bien.js`, `reports.js`, `orders.js:1237–1320`, `database.js`, `helpers.js`, `signup-codes.js`, `thu_P26c.js`, `kiem_tra_truoc_khi_giao.js`).
- Phiếu dặn **"Chờ duyệt kế hoạch"** → commit, push, DỪNG ở bước 3. Chưa viết bài thử, chưa sửa code.

## Câu hỏi

Chi tiết và lập luận ở `ke_hoach.md` mục 9. Tóm tắt, cần chủ quán trả lời trước khi làm:

1. **Tiền mặt theo sổ của ngày** (nghiệm thu E): (A) đúng con số báo cáo hiện có (`reports.js:34`: tiền mặt của đơn completed theo ngày TẠO đơn) hay (B) cộng nạp ví tiền mặt (`wallets.js:123–136`) + thu nợ tiền mặt theo ngày thu (`orders.js:1305–1320` hiện cộng vào đơn gốc)? Số két đếm có gồm tiền để lại từ hôm trước không?
2. **Ngày áp dụng** (nghiệm thu C): bảng ở `ke_hoach.md` 1.3 đúng chưa; quy ước "ngày gộp + 1"; `I3, I6, I12, I15, I16` chưa có nguồn ngày; ai chạy bất biến trên BẢN SAO dữ liệu thật (sổ yêu cầu) — máy mây không có Turso.
3. **Vị trí lõi bất biến** (nghiệm thu A): chuyển sang `server/utils/batBien.js` làm hỏng 31 neo trong 11 file `viec/**/*.py` (ngoài Phạm vi) và `kiem_tra_truoc_khi_giao.js:886`. Kế hoạch chọn: để nguyên file, `server/utils/doiSoat.js` nạp thẳng `cong_cu/gia_lap/bat_bien.js`. Duyệt, hay mở việc riêng để chuyển?
4. `I7` cần dữ liệu SX giả lập → bỏ trên dữ liệu thật; `I9`, `I13`, `I14` dùng số quầy giả lập tự đếm → rút gọn (nhãn hiện trên màn). Chấp nhận?
5. **D2**: giữ `điểm = floor(total / per)` như `I8` (không viết phép mới), hay "tiền thực trả" = `total − nợ`?
6. Chênh lệch két `≠ 0` → ĐỎ ngay, không ngưỡng (đúng phiếu) — chắc chưa?
7. Ngân sách ~380 dòng code, vượt ~300 của phiếu ~25 % — cắt hay chấp nhận?

## Phát hiện (ngoài Phạm vi, không sửa)

- `client/src/pages/Reports.jsx:11` mặc định "hôm nay" bằng `new Date().toISOString()` (UTC): 0:00–7:00 sáng VN tab Ngày hiện hôm qua.
- Báo cáo ngày/tuần (`server/routes/reports.js:34, :127, :142`) tính tiền thu nợ vào NGÀY TẠO đơn gốc (`orders.js:1305–1309`) → doanh thu tiền mặt của ngày cũ đổi về sau; và không có nạp ví tiền mặt.
- Nạp ví mặc định `payment_method = 'cash'` (`database.js:333`, `wallets.js:136`): không có chỗ phân biệt tiền mặt/CK ở số dư tổng.

## Bài học (tạm — điền khi làm xong)

Chưa làm tới.
