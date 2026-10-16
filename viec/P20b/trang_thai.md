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
- 3 câu của `ke_hoach.md` mục 7 (A1 phương án A; TOCTOU huỷ giữa chừng; chữ "ô mã giảm" ở A5) — chủ quán đã chốt 16.10 khi duyệt v2.

## Phát hiện (ngoài phạm vi, không sửa)
- `ke_hoach.md` mục 8: `/validate` (`discount-codes.js:72`) vẫn báo ✓ với voucher của đơn gốc đã huỷ; `increment-usage` không ai gọi; xoá đơn → 404 → 400.
- Soát độc lập: chủ quán XOÁ CỨNG voucher claim (`discount-codes.js:326`, chỉ khi used_count = 0) mà dòng signup vẫn giữ `claimed_at` → mã tay /
  voucher đổi điểm sinh đúng 6 chữ ấy sẽ bị cổng gắn vào đơn gốc cũ (~1/887 triệu, mã tay cần cố ý). Nếu muốn bịt: DELETE của discount-codes
  gỡ `claimed_at` như `/reset` — việc riêng.
- Soát độc lập: `UPPER(code) = UPPER(?)` trên `pos_signup_codes` không dùng `idx_signup_code` (`database.js:1247`) — cùng khuôn /claim, /nhan-diem
  đang chạy; mã bill luôn chữ hoa (`voucherCode.js:9`). Bảng nhỏ, chấp nhận.
- Đối soát (định hướng 5): một câu SQL cho đối soát ngày — voucher claim có `used_count > 0` mà đơn gốc không completed + paid:
  `SELECT s.code FROM pos_signup_codes s JOIN pos_discount_codes d ON UPPER(d.code) = UPPER(s.code) JOIN pos_orders o ON o.id = s.order_id
  WHERE s.claimed_at IS NOT NULL AND d.used_count > 0 AND NOT (o.status = 'completed' AND o.payment_status = 'paid')` — kỳ vọng 0 dòng mới từ
  sau khi vá (dòng có trước vá là dữ liệu cũ). Chưa có chỗ đặt trong bộ đối soát hiện có → việc riêng nếu chủ quán muốn.

## Bước 10 — nghiệm thu, đếm từng mục (code cuối ở commit 0c19685)
| Mục | Bằng chứng |
|---|---|
| A1 (phương án A thay tách file) | `signup-codes.js:499` xuất hàm; `/nhan-diem` `:174`, `/claim` `:339` không đổi; thu_P20 [A]–[F] 51 phép + thu_P21 xanh (npm test 2 lần) |
| A2 cổng sau `codeRecord` | `orders.js:507–519` (+ require `:32`); `.loi` → 400 `MA_DON_GOC_KHONG_HOP_LE`, `error` từ hàm (`:518`); không đơn / used_count 0: G1–G3 phép 2–3; mã tay như cũ: G5; không giao dịch mới: cổng trước `beginTransaction` `:856` |
| A3(a) đơn gốc huỷ | thu_P20 G1 (`:364–368`) — đỏ trên gốc (`bang_chung_do.txt`), xanh sau vá |
| A3(b) đơn gốc hoàn / payment_status ≠ paid | G2 (`/refunds` + approve, `:370–377`) và G3 (`:379–382`) — đỏ trên gốc, xanh sau vá |
| A3(c) K5 đơn gốc còn hợp lệ | G4 (`:384–386`): 200, discount_code = mã, total 22.500, used_count 1 |
| A3(d) K5 mã thường | G5 (`:388–390`); thêm G7 trùng chữ mã bill chưa claim (`:392–395`) |
| A4 npm test / --day-du | PASS 64 · FAIL 0 (hai lần: bước 6 và sau khi gọn bài thử); --day-du PASS 68 · FAIL 0 trên 709e68c và chạy lại trên code cuối (xem dòng HEAD ĐÃ KIỂM) |
| A4 đột biến | `dot_bien.py` 1 BV + 3 VS, đối chứng 75/0, 4/4 BẮT (hai lần); AUDIT-1 D1 8 BẮT + `!D1-E11-P20` LẠC y cũ; P26c 3/3 BẮT; không cần neo lại (không tách file) |
| A5 màn hình | không đụng `client/src`; lời 400 qua `Sales.jsx:761` → `api.js:141` → `Sales.jsx:830 setError` = thanh lỗi chung; thử tay 1 thao tác ở CHƯA KIỂM |

## Báo cáo 7 mục
```
VIỆC:        P20b — Voucher sinh từ mã in bill chỉ dùng được ở POST /orders khi đơn gốc còn completed + paid
ĐÃ SỬA:      server/routes/signup-codes.js:499 — module.exports.kiemDonCuaMa (phương án A, không tách file)
             server/routes/orders.js:32 — require; :507–519 — trong if (codeRecord): tra pos_signup_codes cùng mã ĐÃ claim → kiemDonCuaMa
             → .loi → 400 MA_DON_GOC_KHONG_HOP_LE trước giao dịch (không đơn, used_count không tăng); mã không dòng signup → như cũ
             cong_cu/thu_P20.js:322–395 — mục [G], 6 ca / 24 phép (G1–G5, G7)
BÀI THỬ:     chạy trên bản chưa vá → ĐỎ ở G1, G2, G3 (9 phép: HTTP 200, có đơn mới, used_count 1) — 66 đạt · 9 hỏng; sau khi vá → XANH
             75 đạt · 0 hỏng; đột biến viec/P20b/dot_bien.py 4/4 BẮT (đối chứng xanh)
ĐÃ RÀ K4:    grep "FROM pos_discount_codes" server/ → 13 chỗ; theo TÊN mã lúc dùng: orders.js:503 (vá), discount-codes.js:72 (/validate —
             phiếu chốt không chặn), tienDaTra.js:20 (chỉ đọc scope). grep "pos_signup_codes" theo mã: signup-codes.js:134, :310 (đã qua
             kiemDonCuaMa), orders.js:513 (mới), :1151 (tra trùng lúc phát). discount_code từ body: orders.js:167 duy nhất → xử lý hết.
CHƯA KIỂM:   (1) Màn hình — máy không bấm được. Thử tay 1 thao tác: bill tiền mặt → claim mã trên App → huỷ bill → quầy nhập mã, Áp dụng
             (✓ vì /validate không kiểm đơn gốc) → bấm In → thanh lỗi chung hiện "Đơn của mã này đã bị huỷ, mã không dùng được.", không đơn mới.
             (2) Cửa sổ huỷ đơn gốc giữa lúc kiểm (:513) và commit (:856+): vài ms, không chặn — chủ quán chấp nhận, cùng cách /claim.
             (3) Dữ liệu cũ trên Turso: voucher claim trước P20-v1 (25.09) từ bill chưa trả, hoặc của đơn đã XOÁ, nay bị chặn 400 — đúng mục
             tiêu phiếu nhưng là đổi hành vi với dữ liệu cũ; không đọc được production nên không biết có bao nhiêu mã như vậy.
             (4) Mã tay / voucher điểm trùng chữ với mã bill ĐÃ claim sau khi chủ quán xoá cứng voucher — không chặn (Phát hiện).
             (5) Hook pre-commit không cài được (người gác chặn bash) — thay bằng chạy tay npm test trước mỗi commit code, kết quả ghi bước 6.
GIT:         xem mục "## Git cuối" bên dưới (git log --oneline -2 sau commit cuối)
BÀI HỌC:     KHOÁ 0 · NGUYÊN TẮC 3 · BỎ 3 — chi tiết ở ## Bài học
```

## Bài học (bước 11)
Sự cố gom được: (a) phiếu A1 đụng 3 file Cấm — phải hỏi, chờ duyệt; (b) soát kế hoạch bắt 2 lỗi lập luận (đoán HTTP của ca chưa đọc phép
đối chiếu tiền; coi `code` duy nhất giữa 3 nguồn mã); (c) soát code bắt đếm tay 22 ≠ 24 phép; (d) người gác chặn 9 lệnh + 1 lệnh bị từ chối
quyền (B-BIMAT-CHU grep -r từ gốc; AWK-GHI; B-CHUONGTRINH bash; GIT-TUYCHON; B-TENCHU `$(date)`; B-PHANTICH; B-DICHCHU ×2 đích qua biến;
B-CD-VITRI; B-MANOI heredoc nhắc file bảo vệ; `rm -rf` + `ln -s` trong một lệnh) — nhật ký người gác 16.10; (e) AUDIT-1 báo KHO BẨN vì tôi sửa
file trong lúc nó chạy.

- **NGUYÊN TẮC (K4, đề xuất thêm vào gạch "Chặn (TU-CHAY-5)" — ngoài Phạm vi, chủ quán duyệt):** "Áp dụng cả khi LẬP PHIẾU: phiếu đòi tách /
  dời / đổi tên hàm phải grep tên hàm trong bộ kiểm tĩnh, `thu_gia_lap.js` và `viec/*/dot_bien.py` trước khi ghi Phạm vi — P20b A1 đòi tách
  `kiemDonCuaMa` ra utils trong khi E9 (:420), M2 (thu_gia_lap:123) và AUDIT-1 D1 (:109) đều neo vào `signup-codes.js`, ba file đều bị Cấm →
  phải hỏi lại, đổi phương án." (a)
- **NGUYÊN TẮC (K1, đề xuất thêm một gạch):** "Đoán kết quả HTTP của một ca = khẳng định về code: đọc HẾT các cổng giữa chỗ vá và lệnh ghi
  (P20b: phép đối chiếu tiền `orders.js:783–791` làm ca 'phải 200' ra 400 vì gửi 25.000 thay vì 22.500 — bài vẫn đỏ nhưng đỏ SAI LÝ DO)." (b1)
- **NGUYÊN TẮC (K5, đề xuất thêm một gạch):** "Gắn nguồn A với bảng B theo CHỮ mã → kiểm xem mỗi nguồn có kiểm trùng CHÉO bảng không; không
  thì kèm điều kiện trạng thái và kê đường xoá cứng làm điều kiện ấy rữa (P20b: mã bill / voucher điểm / mã tay cùng `generateVoucherCode`,
  mỗi nguồn chỉ tra bảng mình → cổng phải thêm `claimed_at IS NOT NULL`; xoá cứng voucher `discount-codes.js:326` làm nó rữa)." (b2)
- **BỎ** (c): E4 (CHECKLIST) đã dặn "ĐẾM, đừng ĐOÁN" và cổng A16 đã canh `SỐ CA` của cả bài; lỗi nằm ở một con số trong văn hồ sơ, viết trước
  khi chạy. Soát độc lập đề xuất KHOÁ (chép dòng tổng gốc + HEAD thay vì đếm tay) — chủ quán quyết; tôi xếp BỎ vì phép hiện có đủ bắt khi số
  đó vào `bang_chung_do.txt`.
- **BỎ** (d): mọi lệnh bị chặn đều có luật sẵn của người gác, làm lại được ngay bằng lệnh đơn giản hơn; không lệnh nào cần nới. Riêng
  `bash cai_git_hook.sh` → câu hỏi `tep_bash_them` ở ## Câu hỏi.
- **BỎ** (e): không sửa kho khi `viec/AUDIT-1/dot_bien.py` đang chạy (nó so `git status` trước / sau) — một lần, nhớ là đủ.
- Dọn: không thấy lời dặn nào trong `KHUON_LOI.md` / `CLAUDE.md` mà việc này cho thấy đã có phép máy làm thay.
- Bước 11 không đổi file ngoài `viec/P20b/` (3 đề xuất NGUYÊN TẮC chờ chủ quán duyệt, không tự sửa `KHUON_LOI.md`).

## Kiểm cuối (bước 11.4) — HEAD 591bcf0, code cuối 0c19685
- `npm test` (sau gọn bài thử, cây = 0c19685): PASS 64 · FAIL 0 · CẢNH BÁO 1 (có sẵn).
- `node kiem_tra_truoc_khi_giao.js --day-du` lần 2 trên code cuối: PASS 68 · FAIL 0 · thoát 0; giả lập 32,7 s, thu_gia_lap 46,1 s.
- `python3 viec/P20b/dot_bien.py` lần 2 (bài thử gọn): đối chứng 75/0, 4/4 BẮT.

## Git cuối
```
591bcf0 P20b trang thai: bao cao /ra-soat vong 1, AUDIT-1 D1 8 bat + 1 LAC y cu, P26c 3/3 bat, sua dem 24 phep
0c19685 P20b soat vong 1: gon bai thu [G] (bo require helpers, created_at mac dinh); chay lai goc 66/9, HEAD 75/0; dot bien 4/4
```
(commit cuối cùng chỉ ghi `trang_thai.md` — bước 10–11.)

HEAD ĐÃ KIỂM: 591bcf0
