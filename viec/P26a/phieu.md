# P26a — Vá lỗi "ghi xong rồi báo 500" (BigInt) tại gốc + kịch bản 12 cho giả lập

<!-- Phiếu do chat soạn 02.10.2026. Nền: main 3b1b9bc (sổ việc v17, tu-chay 1.3.2). Nguồn: TU-CHAY-4 Phát hiện 4. -->

**Chờ duyệt kế hoạch:** viết `viec/P26a/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Kho trả mã dòng vừa thêm (`lastInsertRowid`) ở dạng BigInt; route nào đưa thẳng nó vào `res.json` thì máy chủ
GHI XONG rồi mới báo 500. Màn hình thật đang dính: tạo mã chiết khấu (nhân viên thấy lỗi dù mã đã tạo → dễ tạo trùng),
log in hoá đơn (lỗi bị nuốt). `POST /refunds` cũng dính (màn quầy chưa dùng, `thu_P20.js` đang lách).

Vá MỘT chỗ gốc thay vì từng route: `server/database.js` — `run()` (~dòng 1352) và `run()` trong `beginTransaction()`
(~dòng 1379) trả `lastInsertRowid` đã đổi sang `Number` (giữ `null`/`undefined` nếu kho không trả). Mọi route hiện có
và về sau đều hết lỗi này (K4 — đường song song).

## Nghiệm thu
- A1 `cong_cu/thu_P26a.js` (bài thử mới, PHẢI ĐỎ trên gốc): máy chủ thật trên kho tạm (cách dựng như
  `cong_cu/thu_P20.js`), gọi đủ 4 route đang dính — `POST /refunds`, `POST /discount-codes`,
  `POST /settings/invoice/log`, `POST /packages/buy` — mỗi route: HTTP 200, `id` trả về là SỐ (`typeof === 'number'`),
  và đúng bằng `id` của dòng vừa ghi trong kho. Thêm 1 ca đi qua `beginTransaction().run` (đường trong giao dịch).
- A2 Không route nào còn trả 500 kiểu "Do not know how to serialize a BigInt": ca thử gọi lại cả các route đã tự bọc
  `Number()` (`loyalty.js`, `tiers.js`) → vẫn đúng (K5, không hỏng đường cũ).
- A3 Giả lập thêm **KB12**: khách quen trả bằng ví → `POST /refunds` → `POST /refunds/:id/approve` (dùng `refund_id`
  server trả về, KHÔNG tra kho) → ví cộng lại, I4 kiểm. Bánh cóc nâng `NGUONG_KICH_BAN` 11 → 12;
  `thu_gia_lap.js` đổi dòng tổng mong đợi thành `Giả lập: 12 kịch bản · 9 bất biến · ĐẠT`.
- A4 `cong_cu/thu_P20.js`: bỏ đoạn lách (~dòng 180, tra `pos_refund_requests` khi không có id) — dùng thẳng
  `refund_id` server trả về; phải đỏ trên gốc (500) và xanh sau vá.
- A5 Đột biến: bỏ `Number(` ở `run()` thường → `thu_P26a` đỏ; bỏ ở `run()` giao dịch → ca A1 giao dịch đỏ;
  giả lập KB12 đỏ (500). Ghi lệnh chạy lại được trong `trang_thai.md`.
- A6 Bộ kiểm chạy `cong_cu/thu_P26a.js` như bài chạy thật (cạnh `thu_P20`, `thu_P21`, bản nhanh) để lỗi không quay lại.
- A7 `npm test`, `--day-du` (có giả lập 12 kịch bản) xanh; `thu_P20`, `thu_P21`, `thu_gia_lap` xanh.

Cổng của PR này chấm bằng luật main 1.3.2: `thu_P26a.js` (mới) đỏ trên gốc; `thu_P20.js`, `thu_gia_lap.js` (sửa) đỏ
trên gốc nhờ A4 và dòng tổng 12 kịch bản. Kế hoạch ghi rõ ca nào đỏ trên gốc ở từng file.

## Phạm vi
- viec/P26a/**
- server/database.js
- cong_cu/thu_P26a.js
- cong_cu/thu_P20.js
- cong_cu/gia_lap/kich_ban.js
- cong_cu/thu_gia_lap.js
- kiem_tra_truoc_khi_giao.js
- KHUON_LOI.md

## Ngân sách
Code ~4 dòng (`database.js`). Thử: `thu_P26a.js` ~90, KB12 ~25, `thu_P20.js` −3, `thu_gia_lap.js` ±2, bộ kiểm ±4.
Nếu thấy cần sửa route riêng lẻ hay file khác: KHÔNG tự làm — ghi `## Câu hỏi`.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `server/routes/**`, `client/**`, `.claude/`, `.github/`, `tu_chay/`. Không đụng Turso hay production.
- Chỉ push đúng nhánh việc: `git push -u origin viec/P26a`. Không đụng `main`, không merge, không tạo PR.
- Không nới bộ kiểm, cổng, người gác; không bỏ kịch bản/bất biến cũ của giả lập. Không sửa sổ việc.
