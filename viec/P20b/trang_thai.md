# P20b — trạng thái

## Bước 1 — đối chiếu bản chụp (16.10.2026)
HEAD `568b044` · FETCH_HEAD `568b044` — bằng nhau, không kéo.
```
568b044 PHIEU: P20b
09ddeb0 TIEN-DO: AUDIT-3 (bf2201d), TU-CHAY-6 (024dab9), BAN-HANG-1 (5d2294c) xong; them LUOI-3 + AUDIT-4; mo P20b — so v33
024dab9 Merge pull request #24 from pos-tuquyduong/viec/TU-CHAY-6
```

## Bước 1 (tiếp, 16.10) — đối chiếu lại
HEAD `f8d8bab` · FETCH_HEAD `f8d8bab` — bằng nhau, không kéo. Chủ quán duyệt kế hoạch v2: phương án A, cổng có `claimed_at IS NOT NULL`,
không chặn cửa sổ huỷ-giữa-chừng (CHƯA KIỂM), A5 = thanh lỗi chung; hook không cài được → tự chạy `node kiem_tra_truoc_khi_giao.js` trước mỗi commit code.
```
f8d8bab P20b ke hoach v2: them claimed_at IS NOT NULL (K5 trung chu ba nguon ma), sua tien ca thu theo doi chieu :783, ca G7, du danh sach AUDIT-1 D1
d82e968 P20b ke hoach v1: giu kiemDonCuaMa tai signup-codes.js (E9/M2/AUDIT-1 neo vao file Cam), cong tai POST /orders, 6 ca thu + 5 dot bien — cho duyet
568b044 PHIEU: P20b
```

## Bước 2–3 — đọc code, kế hoạch
Kế hoạch ở `ke_hoach.md`. Phiếu dặn chờ duyệt kế hoạch → dừng sau khi push.
Soát độc lập (agent chỉ đọc, 16.10) bắt 2 lỗi lập luận ở v1 → v2: (1) đoán HTTP của ca mà chưa đọc phép đối chiếu tiền `orders.js:783–791`
(tiền gửi phải bằng tổng sau giảm); (2) coi `code` là duy nhất giữa ba nguồn mã trong khi mỗi nguồn chỉ kiểm trùng trong bảng mình →
thêm `AND claimed_at IS NOT NULL` + ca G7. Ghi để xếp ngăn ở bước 11 (BÀI HỌC).

## Bước 4–5 — bài thử đỏ, vá, đột biến (16.10)
- `cong_cu/thu_P20.js` thêm mục [G] (6 ca: G1–G5, G7; 24 phép = 75 − 51 phép [A]–[F], đếm từ dòng tổng chạy thật — soát độc lập sửa số đếm tay 22). Trên gốc `f8d8bab`: **66 đạt · 9 hỏng** (G1–G3 đỏ, K5 G4/G5/G7 xanh) —
  `bang_chung_do.txt`. Sau vá: 75 đạt · 0 hỏng.
- Vá: `server/routes/signup-codes.js` +1 dòng `module.exports.kiemDonCuaMa`; `server/routes/orders.js` +1 require, +12 dòng cổng
  trong `if (codeRecord)` (4 dòng chú thích + 8 dòng code).
- Bản lưu trước vá: thư mục nháp của phiên (`orders.js.truoc_P20b`, `signup-codes.js.truoc_P20b`), không để trong kho.

### Chỗ vá → đột biến (`viec/P20b/dot_bien.py`, chạy `python3 viec/P20b/dot_bien.py` → đối chứng 75 đạt · 4/4 BẮT)
| Chỗ vá | Đột biến | Bắt ở |
|---|---|---|
| A2 `if (maBill)` | `BV-A2-bo-tra-signup` | ✗ G1 |
| A2 `kiemDonCuaMa(maBill)` | `VS-A2-chi-chan-don-huy` (danh sách đen `cancelled` tại chỗ) | ✗ G2 |
| A2 `if (maBill)` | `VS-A2-chan-ca-ma-tay` | ✗ G5 |
| A2 `AND claimed_at IS NOT NULL` | `VS-A2-tra-ca-ma-chua-claim` | ✗ G7 |
Tên đột biến: BV-A2-bo-tra-signup, VS-A2-chi-chan-don-huy, VS-A2-chan-ca-ma-tay, VS-A2-tra-ca-ma-chua-claim.

## Bước 6 — kiểm (16.10, HEAD 709e68c)
- `npm test`: PASS 64 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có sẵn: GET có lệnh ghi ở packages.js:194, products.js:57, sync.js:147 — không thuộc việc này).
  thu_P20 1,0 s · thu_P21 0,8 s · thu_P26a/b/c · thu_GOI1 xanh.
- `node kiem_tra_truoc_khi_giao.js --day-du`: PASS 68 · FAIL 0 · thoát 0; giả lập `chay.js` 33,2 s, `thu_gia_lap.js` 46,5 s (M2 neo signup-codes.js vẫn áp được).
- Không đụng `client/src/` → không build.

## Bước 6 (tiếp) — đột biến cũ vẫn BẮT (HEAD 5ecfb15 + bài thử gọn)
- `python3 viec/AUDIT-1/dot_bien.py D1-E-trangthai-dungma D1-E-danhsach-trang D1-E-claim-chiem D1-E-ndiem-chiem D1-E9-claim-kiem D1-E9-ndiem-kiem D1-E9-claim-dung D1-E9-ndiem-dung '!D1-E11-P20' -j 2`
  → **BẮT 8 · SỐNG 0 · HỎNG 0 · LẠC 1 · TREO 0** (184 s). LẠC = `!D1-E11-P20`, y tình trạng có sẵn từ AUDIT-1 (bị phép tĩnh E7 chặn trước —
  `viec/AUDIT-1/bao_cao.md:25, :77`). Neo không rữa (không tách file). Dòng "KHO BẨN, thoát 3" là do tôi sửa `thu_P20.js` + `trang_thai.md`
  trong lúc nó chạy, không phải lỗi đột biến.
- `python3 viec/P26c/dot_bien.py BV-C2-bo-xoa-ma-bill VS-C2-xoa-ca-ma-da-dung BV-D3-luu-ma-go` → **3 đột biến bị bắt · 0 KHÔNG bị bắt (trên 3)**, thoát 0 (BV-C2 ✗ C2a · VS-C2 ✗ C2c · BV-D3 ✗ D3) — neo orders.js không đổi.

## Bước 8 — soát độc lập (/ra-soat, agent general-purpose, 16.10) — chép nguyên
```
KHÔNG ĐẠT (tạm) — code không tìm thấy lỗi chặn; còn 4 vế nghiệm thu "chờ phiên chính" + 1 lỗi hồ sơ (đếm sai số phép) phải sửa trước khi giao.
LỖI TÌM ĐƯỢC:
- viec/P20b/trang_thai.md:27 — ghi mục [G] "22 phép"; đếm thật = 24 phép (G1 5 · G2 5 · G3 4 · G4 4 · G5 3 · G7 3); 75 − 51 = 24 — K1 / E4.
- cong_cu/thu_P20.js:326 — require(helpers.js) chỉ để lấy getNow() cho created_at ở maTay; gọn hơn: bỏ — định hướng "đơn giản"; không phải lỗi hành vi.
NGHI NGỜ:
- Trùng chữ với mã bill ĐÃ claim (chiều ngược G7): chỉ khi chủ quán xoá cứng voucher claim (discount-codes.js:326, used_count = 0) mà dòng signup
  vẫn giữ claimed_at, rồi mã tay / voucher đổi điểm sinh đúng 6 chữ ấy → cổng gắn nhầm đơn gốc cũ. ~1/887 triệu, mã tay cần cố ý — Phát hiện.
- Dữ liệu cũ production: voucher claim TRƯỚC P20-v1 (25.09) từ bill chờ thu chưa trả, hoặc từ đơn đã XOÁ (orders.js:1621 giữ dòng claim →
  kiemDonCuaMa 404 → 400) — nay bị chặn. Đúng mục tiêu phiếu nhưng là đổi hành vi với dữ liệu cũ → CHƯA KIỂM / báo chủ quán.
- Hiệu năng: UPPER(code) = UPPER(?) trên pos_signup_codes không dùng idx_signup_code — cùng khuôn /claim :310, /nhan-diem :134; chấp nhận được.
1. K3: CÓ giá trị — POST /orders thật, so status + code + COUNT + used_count, không soi mã tĩnh; đỏ 9 ✗ trên gốc; dot_bien 1 BV + 3 VS, đối chứng, 4/4 BẮT (tự chạy).
2. K4: 3/3 đường DÙNG mã qua kiemDonCuaMa; chỗ chưa xử lý duy nhất /validate (chủ ý theo phiếu); giữa cổng :512 và beginTransaction :856 không lệnh ghi.
3. K5: (a) mã tay G5 (b) voucher đổi điểm — không dòng signup, cùng nhánh G5 (c) voucher claim đơn gốc hợp lệ G4 (d) trùng chữ chưa claim G7
   (e) sau /reset → codeRecord null (f) dữ liệu cũ: NGHI NGỜ. Không luồng bị chặn oan.
4. K1: số dòng ke_hoach (trên 568b044) + 13 khớp HEAD; A5 "thanh lỗi chung" đúng Sales.jsx:761, :830, api.js:80–86. Sai duy nhất "22 phép".
5. Đường tiền: không trường tiền mới từ client; cổng chỉ đọc codeRecord.code (server tra DB). 6. P1: không đụng client.
7. NGHIỆM THU: 11/15 vế có bằng chứng · thiếu (chờ phiên chính): thu_P21 xanh y cũ, npm test, --day-du, AUDIT-1 D1 + P26c vẫn BẮT.
8. Đơn giản: đạt; thu_P20.js:326 (trên); chú thích orders.js:508–511 có thể rút còn 2 dòng (không bắt buộc). Không phải tính năng tiền mới;
   nếu muốn: 1 câu SQL đối soát "voucher claim mà đơn gốc không completed+paid và used_count > 0" (Phát hiện).
CHƯA SOÁT ĐƯỢC: npm test / --day-du / AUDIT-1 / P26c trên HEAD; hành vi màn hình (thử tay); TOCTOU (chủ quán chấp nhận → CHƯA KIỂM);
số voucher claim cũ trên Turso sẽ bị chặn sau vá.
BÀI HỌC: KHOÁ — số phép một mục phải lấy từ dòng tổng chạy thật (22 ≠ 24, E4). NGUYÊN TẮC (K5) — gắn nguồn A với bảng B theo CHỮ mã phải kèm
điều kiện trạng thái + liệt kê đường xoá cứng làm nó rữa. NGUYÊN TẮC (K5 dữ liệu cũ) — siết cổng theo trạng thái đơn gốc → kê dữ liệu cũ đổi hành vi vào CHƯA KIỂM.
```
Xử lý: sửa "22 phép" → 24; bỏ `require` helpers trong [G] (`maTay` bỏ `created_at`, cột có DEFAULT CURRENT_TIMESTAMP — `database.js:626`); chạy lại
bài thử trên bản gốc (66 đạt · 9 hỏng, y cũ) và HEAD (75 đạt · 0 hỏng); `bang_chung_do.txt` chép lại. 4 vế "chờ phiên chính": npm test, --day-du
(bước 6), AUDIT-1 (trên), P26c (dưới). Chú thích orders.js giữ 4 dòng (nêu đủ lý do `claimed_at`, không bắt buộc rút).

## Câu hỏi
- Người gác chặn `bash cai_git_hook.sh` (B-CHUONGTRINH: `bash` không trong danh sách) → hook pre-commit CHƯA cài ở máy mây này;
  bước 3 chỉ commit file trong `viec/P20b/`, bộ kiểm sẽ chạy ở bước 6. Chủ quán muốn cho phép thì thêm vào `tep_bash_them`.
Xem `ke_hoach.md` mục 7 (3 câu): A1 phương án A vì E9 / thu_gia_lap M2 / AUDIT-1 D1 đều neo vào `signup-codes.js` (file Cấm, ngoài Phạm vi);
TOCTOU huỷ giữa chừng; chữ "ô mã giảm" ở A5.

## Phát hiện
Xem `ke_hoach.md` mục 8.
