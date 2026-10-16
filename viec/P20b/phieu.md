# P20b — Voucher sinh từ mã in bill chỉ dùng được ở POST /orders khi đơn gốc còn completed + paid

<!-- Phiếu do chat soạn 16.10.2026. Nền: main sau sổ việc v33 (cha 024dab9 = Merge PR #24 TU-CHAY-6). LUOI-3 chạy SONG SONG
     (thu_P26c.js, thu_GOI1.js, giả lập) — KHÔNG chung file. Code đã đọc: /claim (signup-codes.js:359–484) phát voucher THẬT vào
     pos_discount_codes với CÙNG `code` của pos_signup_codes (có `order_id` = đơn gốc); kiemDonCuaMa(dong) (signup-codes.js:47–61,
     TRANG_THAI_DUNG_MA completed + paid) dùng ở /claim và /nhan-diem; POST /orders (orders.js:500–520) kiểm mã chỉ theo is_active,
     valid_from/to, usage_limit — KHÔNG hỏi đơn gốc → đơn gốc huỷ / hoàn sau khi claim thì voucher vẫn dùng được (P20 sổ việc). -->

**Chờ duyệt kế hoạch:** viết `viec/P20b/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Đơn gốc không còn completed + paid (huỷ, hoàn, trạng thái lạ) → voucher sinh từ mã bill của đơn đó KHÔNG giảm được đơn mới. Mã
thường do chủ quán tạo tay (không có dòng pos_signup_codes) không đổi hành vi.

## Quyết định chủ quán (chép đúng)
- Voucher gắn đơn gốc "hỏng" → 400, mã lỗi riêng, lời báo nói rõ lý do (đơn gốc đã huỷ / hoàn), đơn mới KHÔNG tạo.
- Dùng CÙNG hàm kiểm với /claim và /nhan-diem (một quy tắc, một chỗ), không viết lại danh sách trắng.

## Nghiệm thu
- A1 Tách `kiemDonCuaMa` + `TRANG_THAI_DUNG_MA` ra `server/utils/maBill.js` (y nguyên), `signup-codes.js` require lại — hành vi
  /claim, /nhan-diem không đổi (thu_P20.js, thu_P21.js xanh y cũ).
- A2 `orders.js` ngay sau khi tìm `codeRecord` (:502): tra `pos_signup_codes WHERE UPPER(code) = UPPER(?)`; có dòng → `kiemDonCuaMa`;
  `.loi` → 400 `MA_DON_GOC_KHONG_HOP_LE` kèm `error` từ hàm, KHÔNG tạo đơn, `used_count` không tăng. Không có dòng (mã tay) → như cũ.
  Kiểm lúc DÙNG, trong luồng tạo đơn hiện có (không thêm giao dịch mới).
- A3 Ca đỏ trong `cong_cu/thu_P20.js` (mục mới, không file mới): (a) đơn gốc paid → claim → đơn gốc huỷ → dùng voucher → 400, đơn mới
  không có, `used_count` 0 (gốc: 200 + giảm); (b) đơn gốc hoàn (payment_status đổi khỏi paid) → 400; (c) K5: đơn gốc còn
  completed + paid → voucher giảm đúng như trước, `used_count` +1; (d) K5: mã thường (không dòng signup) → giảm như cũ.
- A4 `npm test`, `--day-du` xanh; `viec/P20b/dot_bien.py` ≥ 1 VS- + BV- cho A2 (bỏ tra signup, so sai trạng thái), có đối chứng;
  đột biến cũ `viec/AUDIT-1/dot_bien.py` nhóm P20 và `viec/P26c` vẫn BẮT (neo rữa vì tách hàm → neo lại, ghi trước / sau).
- A5 Màn hình không đổi: lời 400 hiện ở ô mã giảm như các mã lỗi 400 khác (ghi cách thử tay 1 thao tác).

## Phạm vi
- viec/P20b/**
- server/routes/orders.js
- server/routes/signup-codes.js
- server/utils/maBill.js
- cong_cu/thu_P20.js

## Ngân sách
~25–40 dòng code (tách hàm + 1 khối kiểm) + ~60 dòng thử.
**Phương án đơn giản nhất đã xét:** không đổi cấu trúc DB (liên kết đã có qua `code`); không thêm cột `source_order_id`; không chặn
ở /validate hay màn hình — chặn tại chỗ tiền chạy (POST /orders).

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `cong_cu/thu_P26c.js`, `thu_GOI1.js`, `cong_cu/gia_lap/**`, `thu_gia_lap.js`, `kiem_tra_truoc_khi_giao.js` (LUOI-3 đang
  chạy song song), `server/database.js`, `.claude/`, `.github/`, `tu_chay/`, sổ việc. Không sửa P20c (nhận ưu đãi một lần) trong việc này.
- Không nới hạn, không hạ ngưỡng. Chỉ push đúng `git push -u origin viec/P20b`. Không đụng `main`, không merge, không tạo PR.
