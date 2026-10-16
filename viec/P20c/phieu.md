# P20c — Mã bill: SĐT chỉ nhận ưu đãi một lần kiểm TRONG giao dịch; hoàn tác mã an toàn; mã lỗi thống nhất

<!-- Phiếu do chat soạn 17.10.2026. Nền: main sau sổ việc v34 (cha 0ee7346 = Merge PR #26 LUOI-3; P20b PR #25 đã gộp — kiemDonCuaMa
     đã xuất ra cho orders.js). AUDIT-4 chạy SONG SONG (chỉ viec/AUDIT-4/) — không chung file. Nguồn: sổ việc mục P20c (GHI CHÚ, [a], [b],
     [c]); code đã đọc: /claim chặn SĐT đã claim NGOÀI giao dịch (signup-codes.js:329–335) rồi mới UPDATE … claimed_at IS NULL (:384–389);
     /nhan-diem chiLanDau chặn SĐT NGOÀI giao dịch (:159–171) rồi UPDATE … diem_nhan_luc IS NULL (:246–252); /:id/reset kiểm used_count
     NGOÀI giao dịch (:467–473) rồi DELETE pos_discount_codes không có AND used_count = 0 (:484); mã lỗi "mã đã dùng" ba chỗ khác nhau
     (:142 không code, :390 MA_DA_DUNG, /claim còn chỗ khác). GHI CHÚ [d] (mỗi mã chỉ MỘT khuyến mãi, loại gán LÚC IN) đổi cấu trúc DB +
     luồng in → KHÔNG làm ở đây, tách P20d. -->

**Chờ duyệt kế hoạch:** viết `viec/P20c/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Hai yêu cầu cùng lúc của một SĐT (hai máy, hai lần bấm) không thể cùng nhận ưu đãi khách mới / điểm nhân; hoàn tác mã không xoá voucher
đang dùng dở; lời báo "mã đã dùng" một mã lỗi. Hành vi màn hình không đổi ngoài lời báo.

## Quyết định chủ quán (chép đúng)
- Một SĐT: một lần claim trong đời, một lần nhận điểm nhân (khi cài `chiLanDau`) — kiểm NGAY trong câu UPDATE chiếm mã, cùng giao dịch.
- Hoàn tác mã: `DELETE pos_discount_codes … AND used_count = 0` trong giao dịch; voucher đã dùng → 400, không đổi gì.
- [d] loại ưu đãi gán lúc in → việc riêng P20d, không làm ở đây.

## Nghiệm thu
- A1 `/claim`: câu UPDATE chiếm mã thêm `AND NOT EXISTS (SELECT 1 FROM pos_signup_codes WHERE claimed_phone = ? AND id <> ?)` (cùng
  điều kiện với phép kiểm :329 — giữ phép kiểm sớm để lời báo đẹp, nhưng chốt bằng UPDATE); `changes = 0` → rollback, 409 một mã lỗi
  (xem A4). Ca đỏ `thu_P20.js`: hai claim cùng SĐT, hai mã khác nhau, gửi SONG SONG (`Promise.all`) → đúng 1 thành công, 1 voucher,
  1 dòng claimed (gốc: cả hai có thể cùng qua — ca phải tái hiện được; nếu kho tạm không tái hiện được đua thật thì ca gọi thẳng câu
  UPDATE hai lần với dữ liệu đã claim để chứng minh `changes = 0`, ghi rõ).
- A2 `/nhan-diem` khi `chiLanDau`: UPDATE chiếm mã thêm `AND NOT EXISTS (SELECT 1 FROM pos_signup_codes WHERE diem_nhan_phone = ? AND id <> ?)`;
  `changes = 0` → rollback, 409 cùng mã lỗi. Ca đỏ: hai mã, cùng SĐT, song song → đúng 1 lần cộng điểm, điểm khách = một lần.
  `chiLanDau` tắt → hai lần cộng như cũ (K5).
- A3 `/:id/reset`: đưa kiểm `used_count` vào giao dịch; `DELETE FROM pos_discount_codes WHERE code = ? AND used_count = 0`, `changes = 0`
  → rollback, 400, dòng signup KHÔNG bị xoá claimed. Ca đỏ: voucher `used_count = 1` → reset → 400, voucher còn, claimed còn (gốc:
  :467 chặn trước nên ca này xanh trên gốc — ca đỏ thật là: cập nhật `used_count = 1` GIỮA kiểm và DELETE không tái hiện được →
  thì ca gọi thẳng câu DELETE mới với `used_count = 1` → `changes = 0`; ghi rõ cách chứng minh).
- A4 Mã lỗi: ba chỗ "mã đã dùng / mã vừa dùng" (/claim, /nhan-diem :142, :390 và chỗ mới) dùng chung `MA_DA_DUNG` 409; SĐT đã nhận:
  `SDT_DA_NHAN` 400 (đã có ở /nhan-diem :168) dùng cả /claim. Ca: so `code` từng lời báo. Màn hình (nếu có đọc `code`) không đổi hành vi.
- A5 `kiemDonCuaMa` vẫn ngoài giao dịch (như P20b chốt) — ghi CHƯA KIỂM, không sửa. GHI CHÚ [b] (phép tĩnh bị lừa) và [c] (ca mã trỏ đơn
  đã xoá → 404 KHONG_THAY_DON) → [c] thêm 1 ca K5 trong `thu_P20.js`; [b] ghi đề xuất, không sửa bộ kiểm.
- A6 `npm test`, `--day-du` xanh; `viec/P20c/dot_bien.py` ≥ 1 VS- + BV- mỗi chỗ vá (A1, A2, A3), có đối chứng; đột biến cũ AUDIT-1 nhóm D1,
  P20b 4 tên vẫn BẮT (neo rữa → neo lại, ghi trước / sau).

## Phạm vi
- viec/P20c/**
- server/routes/signup-codes.js
- cong_cu/thu_P20.js

## Ngân sách
~30–50 dòng code + ~80 dòng thử.
**Phương án đơn giản nhất đã xét:** không thêm bảng / cột / khoá duy nhất (UNIQUE trên claimed_phone sẽ chặn cả dữ liệu cũ đã trùng nếu có);
chốt bằng `NOT EXISTS` trong UPDATE đang có, cùng khuôn `AND claimed_at IS NULL` + `changes`.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `server/routes/orders.js`, `kiem_tra_truoc_khi_giao.js`, `cong_cu/gia_lap/**`, `thu_gia_lap.js`, `thu_P26c.js`, `client/`,
  `server/database.js`, `viec/AUDIT-4/**`, `.claude/`, `.github/`, `tu_chay/`, sổ việc. Không làm [d] (P20d).
- Không nới hạn, không hạ ngưỡng. Chỉ push đúng `git push -u origin viec/P20c`. Không đụng `main`, không merge, không tạo PR.
