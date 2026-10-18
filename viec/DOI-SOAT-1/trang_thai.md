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

- `ke_hoach.md` bản 1 (`a6a488d`) viết từ code thật: `bat_bien.js`, `reports.js`, `orders.js:1237–1320`, `database.js`, `helpers.js`, `signup-codes.js`, `thu_P26c.js`, `kiem_tra_truoc_khi_giao.js`.
- **Soát độc lập bằng agent phụ chỉ đọc** (4 câu của skill). Đã sửa thành **bản 2**:
  - sai của tôi: bản 1 ghi "phiếu cho sửa một dòng ở `kiem_tra`" — phiếu chỉ cho THÊM một dòng gọi bài, không cho sửa `:886`;
  - mâu thuẫn B/C: "toàn sổ" vừa không có ngày vừa có `AP_DUNG_TU` → chia 3 lớp (có khoá / toàn sổ có khoá / gộp không khoá → đỏ luôn);
  - `ctx.thuc` ở I9 bỏ sót `bat_bien.js:160` (`ctx.soQuay` undefined sẽ ném `TypeError`);
  - khoá→ngày: bảng riêng từng bất biến (không một regex chung — "mã" mang 3 nghĩa, "đơn mua gói/thẻ CODE" bắt nhầm; đơn đã xoá ở I9/I11 lấy ngày từ sổ ví / nhật ký);
  - H: chi phí không "tuyến tính" mà gần N × M (cột `order_id` không chỉ mục); ca H1 phải dựng điểm / ví / mã bill; bỏ ý cache vào `pos_doi_soat_ghi`;
  - D1: đếm cả hai cột như phiếu (không lọc theo cài đặt hiện tại); thêm ca `diem_nhan_phone` đỏ;
  - ca thiếu: B0 (XANH ba kỳ trên luồng thật), A2b (tiêm bất biến giả có UPDATE — đột biến bỏ chặn ghi mới bị bắt), băm nội dung thay đếm hàng, B5 mở rộng I2/I4/I13/I18, E3b/E4/F2/F3/G5, D2d, đột biến cho D1/F;
  - "đỏ oan đã biết" (so với cài đặt/danh mục HIỆN TẠI: I8, I12, I13; I14 tính đơn `refunded`) → thêm Câu hỏi 4;
  - số dòng lệch nhẹ đã sửa (I8 `:120–152`, `pay-debt` `:1305–1310`).
  - Điều tôi KHÔNG nhận từ agent soát: trích câu SUM thành hàm dùng chung cho `/daily` (sửa đường số tiền đang chạy thật) → giữ ca đối chứng E7; ghi lại ở `ke_hoach.md` 1.5 để chủ quán quyết.
- Phiếu dặn **"Chờ duyệt kế hoạch"** → commit, push, DỪNG ở bước 3. Chưa viết bài thử, chưa sửa code.

## Câu hỏi

Chi tiết và lập luận ở `ke_hoach.md` mục 9. Cần chủ quán trả lời trước khi làm:

1. **Tiền mặt theo sổ của ngày** (nghiệm thu E): (A) đúng con số báo cáo hiện có (`reports.js:34`: tiền mặt đơn completed theo ngày TẠO đơn) hay (B) cộng nạp ví tiền mặt (`wallets.js:123–136`) + thu nợ tiền mặt theo ngày thu (`orders.js:1305–1320` hiện cộng vào đơn gốc)? Số két đếm có gồm tiền để lại từ hôm trước không?
2. **Ngày áp dụng** (nghiệm thu C): bảng `ke_hoach.md` 1.3 đúng chưa; quy ước "ngày gộp + 1"; `I3, I6, I12, I15, I16` chưa có nguồn; ai chạy bất biến trên BẢN SAO dữ liệu thật (máy mây không có Turso).
3. **Vị trí lõi bất biến** (nghiệm thu A): chuyển sang `server/utils/batBien.js` làm hỏng 31 neo (11 file `viec/**/*.py`, ngoài Phạm vi); phiếu cũng không cho sửa `kiem_tra_truoc_khi_giao.js:886`. Kế hoạch chọn: để nguyên file, `doiSoat.js` nạp thẳng `cong_cu/gia_lap/bat_bien.js`. Duyệt, hay mở việc riêng để chuyển?
4. **Rút gọn / bỏ + đỏ oan đã biết**: I7 bỏ; I9, I13, I14 rút gọn; các dòng so với cài đặt hiện tại (I8, I12, I13, I14) hiện ĐỎ kèm nhãn "có thể oan"? Hay thêm nhóm "cần xem" (phiếu chỉ có đỏ / vàng)?
5. **D2**: giữ `điểm = floor(total / per)` như `I8`, hay "tiền thực trả" = `total − nợ`?
6. Chênh két `≠ 0` → ĐỎ ngay, không ngưỡng (đúng phiếu) — chắc chưa?
7. Ngân sách ~400 dòng code vượt ~300 của phiếu ~30 % — cắt (`ke_hoach.md` mục 7) hay chấp nhận?
8. Nếu đo thấy chậm: cho thêm index vào bảng cũ trong `database.js` (ngoài "chỉ thêm bảng" của phiếu)?

## Phát hiện (ngoài Phạm vi, không sửa)

- `client/src/pages/Reports.jsx:11` mặc định "hôm nay" bằng `new Date().toISOString()` (UTC): 0:00–7:00 sáng VN tab Ngày hiện hôm qua.
- Báo cáo ngày/tuần (`server/routes/reports.js:34, :127, :142`) tính thu nợ vào NGÀY TẠO đơn gốc (`orders.js:1305–1310`) → doanh thu tiền mặt ngày cũ đổi về sau; không có nạp ví tiền mặt.
- Nạp ví mặc định `payment_method = 'cash'` (`database.js:333`, `wallets.js:136`).
- Chú thích `cong_cu/gia_lap/bat_bien.js:217` ghi `orders.js:450` — dòng đó nay là `sx_product_id: null` (lệch số dòng).

## Bài học (tạm — điền khi làm xong)

Chưa làm tới. Ghi sớm một điều: bản 1 của kế hoạch có một câu sai về phiếu và một mâu thuẫn nội bộ (B/C) mà tôi không thấy; agent soát đọc độc lập bắt được cả hai — nên giữ bước soát kế hoạch cho việc tiền.
