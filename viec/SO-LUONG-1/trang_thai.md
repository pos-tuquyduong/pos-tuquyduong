# SO-LUONG-1 — trạng thái

## Bản chụp (bước 1, 14.10.2026)
- HEAD: b823f72 · FETCH_HEAD (origin/viec/SO-LUONG-1): b823f72 — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  b823f72 PHIEU: SO-LUONG-1
  551319d TIEN-DO: GOI-2 xong (83872a4), TOC-DO-1 xong (6a2ec76), mo SO-LUONG-1, them TU-CHAY-6 — so v30
  83872a4 Merge pull request #19 from pos-tuquyduong/viec/GOI-2
  ```

## Bước 3 — kế hoạch (14.10.2026)
- Phiếu ghi "Chờ duyệt kế hoạch" → viết `ke_hoach.md`, commit, push, DỪNG ở bước 3. Chưa viết bài thử, chưa sửa code.
- Đo trên gốc lượt này: `node cong_cu/thu_P26c.js` → 84 đạt · 0 hỏng (3 s).
- Soát độc lập (agent chỉ đọc, 4 câu của skill) đã gọi, kết quả ghi ở mục dưới khi có.

## Câu hỏi
Xem mục "## Câu hỏi" cuối `ke_hoach.md` (3 câu: đột biến GOI-1 lạc · trần `pkg_qty` · `pkg_qty` 0/"" đổi hành vi).

## Soát độc lập kế hoạch (agent chỉ đọc, 14.10.2026) — đã sửa vào `ke_hoach.md` bản 2
- K1 (5 số dòng lệch, tự kiểm lại bằng `sed -n`, đúng): router :33 (không :31); `let soLuotGoi` :388, điều kiện mua gói :389
  (không :399); `membership_buy` Sales.jsx:751; `items: []` cho phép ở :178. Khẳng định `"2a"` → tổng NaN chưa chạy → ghi CHƯA KIỂM.
- Phạm vi: phương án (a) Câu hỏi 1 sửa `viec/GOI-1/dot_bien.py` là ngoài Phạm vi; phiếu tự mâu thuẫn A3 ↔ A5 → máy không chọn,
  đưa chủ quán chốt (bỏ chữ "máy nghiêng (a)").
- Ngắn hơn: kiểm `pkg_qty` MỘT lần ở đầu route, xoá cả :400 và :1020 (bớt `let`, kiểm sớm) — nhận. Bỏ `VS-MON-CHI-AM` (trùng).
- Thiếu bài thử: vế `--day-du` xanh 0 CẢNH BÁO (A5) chưa nhắc → thêm; thiếu 1.5 cho món lẻ (phiếu đòi NGUYÊN) → S1d; S2a–S2d thiếu
  `cash_amount` khớp số gốc tính (ca trộn lỗi, K3) → thêm; thiếu đột biến K5 "siết quá tay" cho S1h / S2e / S2f → 3 đột biến mới.
- K4 / K5: không sót chỗ đọc `pkg_qty`; không bài thử nào gửi số ngoài nguyên ≥ 1 (thu_P20/P21/P26a/P26b/GOI1/kich_ban) → không đỏ oan.

## Phát hiện (ngoài phiếu, chỉ đọc code, KHÔNG sửa trong việc này)
- (soát lần 2, có sẵn) `customer_phone` kiểu SỐ → `helpers.js:154` `phone.replace` ném → 500; `items` không phải mảng kèm `package_buy` → `orders.js:191`
  `items.some` / `:296` `for…of` ném → 500. Không mất tiền, chỉ lỗi thô qua API.
- (K5, Sales.jsx:385–396) `handleClearCustomer` không gỡ gói khỏi giỏ → bỏ chọn khách sau khi thêm gói thì gửi `package_buy` không SĐT, nay 400
  "Mua gói cần chọn gói và khách hàng" (trước: thu tiền không tạo gói). Nên gỡ gói khỏi giỏ khi bỏ chọn khách — `client/`, việc sau.
- (ĐƯỜNG TIỀN, người soát đọc — tự đối chiếu :338) `package_buy: {}` (không `package_id`) kèm món `from_package: true`: :338 `!package_buy`
  sai vì `{}` truthy → không chặn; :256 không có danh sách → :350 không kiểm; :389 bỏ qua vì không `package_id`; món tính 0đ và
  :909 không trừ lượt vì không `customer_package_id`. Lỗ lấy hàng 0đ qua API (màn hình không gửi dạng này). Đề xuất: :338 đổi
  thành `!(package_buy && package_buy.package_id)` — việc riêng.
- Mua gói không gửi `customer_phone`: :1019 đòi `phone` → thu tiền gói mà không tạo gói khách. Có từ trước, cần chủ quán xem (có
  nên 400 "cần chọn khách" như mua thẻ :183).

## Bước 4–6 (14.10.2026, sau duyệt bản 2 — chốt ghi ở cuối `ke_hoach.md`)
- Bước 1 lượt này: HEAD `6d72cd8` = FETCH_HEAD `6d72cd8`, không kéo; log 3 dòng: `6d72cd8 SO-LUONG-1: kế hoạch bản 2…` ·
  `03057a4 SO-LUONG-1: kế hoạch chờ duyệt…` · `b823f72 PHIEU: SO-LUONG-1`.
- **Bài thử trước (K3):** `cong_cu/thu_P26c.js` thêm mục `[S1]` `[S2]` `[S3 + S4]` — 19 ca. Trên gốc: 91 đạt · **12 hỏng** (S1a–f, S2a–d,
  S2g, S2h đỏ; S1g–h, S2e–f, S3, S4a–b xanh = hồi quy / K5). Bằng chứng: `bang_chung_do.txt` (chạy lần cuối qua `--may-chu` bản sao
  server/ với orders.js gốc, sau khi đổi S2e). Sau vá: **103 đạt · 0 hỏng** → `SỐ CA cong_cu/thu_P26c.js: 103`.
  Gốc lộ thêm: `"2a"` → HTTP 500 (NaN vào libsql), không phải 200 như kế hoạch đoán; `pkg_qty −1` + `cash_amount 0` → gốc 200 **tổng 0đ**
  (gói bán 0 đồng). Đều ghi vào tên ca.
- **Sửa code** `server/routes/orders.js` (số cuối sau vòng sửa 1, từ `git diff --numstat`: +22/−8, trong đó chú thích +9/−3): hàm `soNguyenDuong` (:35–37); phép đầu route (:195–204):
  `GOI_MUA_THIEU_THONG_TIN` rồi `pkgQty = Number(package_buy?.pkg_qty ?? 1)` + `SL_KHONG_HOP_LE`; phép món (:321–328) một phép cho mọi
  món, mã GOI-1 giữ cho món từ gói; xoá 2 dòng `const pkgQty = package_buy.pkg_qty || 1;` (cũ :400, :1020). Bản lưu trước vá ở thư mục nháp.
- **Chỗ vá → đột biến** (`viec/SO-LUONG-1/dot_bien.py`, 15 đột biến, đối chứng thu_P26c 103/0 + thu_GOI1 101/0, **15 bị bắt · 0 không**):

  | Chỗ vá | BV- | VS- | K5 siết quá tay |
  |---|---|---|---|
  | hàm `soNguyenDuong` | — | `VS-SOLUONG1-BO-NGUYEN` (S1d) | — |
  | phép món :325 | `BV-SOLUONG1-MON` (S1c) · `BV-SOLUONG1-MON-THU-GOI1` (thu_GOI1 A2j) | `VS-SOLUONG1-MON-CHI-TU-GOI` (S1c) · `VS-SOLUONG1-MON-MOT-MA` (S3) · `VS-SOLUONG1-MON-CHI-0-THU-GOI1` (A2j) | `VS-SOLUONG1-MON-SO-THO` (S1h) |
  | phép số gói :201–204 | `BV-SOLUONG1-GOI` (S2b) | `VS-SOLUONG1-GOI-HOAC-1` (S2a) · `VS-SOLUONG1-GOI-LAM-TRON` (S2d) | `VS-SOLUONG1-GOI-THIEU-0` (S2e) · `VS-SOLUONG1-GOI-CHI-1` (S2f) |
  | phép đủ thông tin :198–200 | `BV-SOLUONG1-GOI-THIEU` (S2g) | `VS-SOLUONG1-GOI-THIEU-CHI-MA` (S2h) | `VS-SOLUONG1-GOI-THIEU-SIET` (S2e) |
  | xoá 2 dòng `pkg_qty \|\| 1` | không đột biến được: dựng lại dòng đó chỉ che biến đã kiểm bằng cùng giá trị → CHƯA KIỂM bằng đột biến, khoá bằng S2f | | |

  Mọi tên: VS-SOLUONG1-BO-NGUYEN, BV-SOLUONG1-MON, VS-SOLUONG1-MON-CHI-TU-GOI, VS-SOLUONG1-MON-MOT-MA, VS-SOLUONG1-MON-SO-THO,
  BV-SOLUONG1-MON-THU-GOI1, VS-SOLUONG1-MON-CHI-0-THU-GOI1, BV-SOLUONG1-GOI, VS-SOLUONG1-GOI-HOAC-1, VS-SOLUONG1-GOI-LAM-TRON,
  VS-SOLUONG1-GOI-THIEU-0, VS-SOLUONG1-GOI-CHI-1, BV-SOLUONG1-GOI-THIEU, VS-SOLUONG1-GOI-THIEU-CHI-MA, VS-SOLUONG1-GOI-THIEU-SIET.
  Sự cố: mẫu siết đầu (`items.length`) làm helper mua gói của bài sập ở [A1] → "ném", không tính bắt → đổi sang đòi `total_qty` và S2e bỏ `total_qty`.
- `npm test`: PASS 63 · FAIL 0 · CẢNH BÁO 0 (trên code đã vá).
- `node kiem_tra_truoc_khi_giao.js --day-du`: PASS 67 · FAIL 0 · CẢNH BÁO 0 (gồm giả lập quầy `kich_ban.js`).
- Đột biến cũ trên code đã vá: **GOI-2** 59/59 bắt. **P26c** 89/93 — 4 "không áp được" (`VS-H2-khong-ghi-hoan-goi`, `VS-H2-hoan-goi-giam-total-spent`,
  `VS-me-hoan-gap-doi-huy`, `VS-me-hoan-gap-doi-xoa`) là 4 đột biến lạc từ GOI-2 (Q-F, đã dựng lại trong `viec/GOI-2/dot_bien.py`), neo vào
  thân `hoanVi` đã dời sang `wallets.js` — có từ trước SO-LUONG-1. **GOI-1** 40/49 — 9 "không áp được": **2 do SO-LUONG-1** (`BV-GOI1-SL-AM`,
  `VS-GOI1-SL-AM-CHI-0` — neo dòng `if (item.from_package && !(Number.isInteger(sl) && sl >= 1)) {` đã gom về một phép; chủ quán chốt
  Câu hỏi 1 = (b): dựng lại là `BV-SOLUONG1-MON-THU-GOI1`, `VS-SOLUONG1-MON-CHI-0-THU-GOI1`, đều BẮT qua thu_GOI1 A2j) và 7 có từ trước
  (`VS-GOI1-DUNG-QUYEN`, `VS-GOI1-DUNG-DUA` neo `packages.js`; `VS-GOI1-LOC-GOI`, `BV-GOI1-TIM-TEN`, `BV-GOI1-DANG-GIAO`, `VS-GOI1-SAP-CHUA-LAY`,
  `BV-GOI1-NUT-LYDO` neo `Reports.jsx` — hai file SO-LUONG-1 không đụng; GOI-2 đã ghi nhận là lạc và dựng lại một phần).

## Soát độc lập `/ra-soat` (bước 8)
- Lần 1 (agent general-purpose, 31 lượt công cụ, ~9 phút): kết thúc mà KHÔNG gọi `SubagentHandback` → **báo cáo không về**. Nhắc nộp bằng
  `SendMessage` bị người gác chặn (CC-LA — công cụ ngoài danh sách). Khởi chạy lần 2 với dặn "hành động cuối PHẢI là SubagentHandback,
  báo cáo ≤ 60 dòng, quá 25 lượt thì nộp phần đã có".

### Báo cáo soát lần 2 (chép nguyên văn, agent general-purpose, 25 lượt công cụ)
```
KHÔNG ĐẠT (nhẹ — 1 lỗ còn hở ở chính phép chủ quán chốt thêm; vá ~1 dòng + 1 ca rồi mới giao)

LỖI TÌM ĐƯỢC:
- server/routes/orders.js:198 — cổng `GOI_MUA_THIEU_THONG_TIN` kiểm `customer_phone` THÔ truthy, nhưng khối tạo gói :1033 đòi `phone` = `normalizePhone(customer_phone)` (:537; helpers.js:152–158 xoá khoảng trắng / `-` / `.`). Gửi `customer_phone: " "` hoặc `"-"` (API, tài khoản đã đăng nhập) → qua cổng :198, `phone` = "" → :1033 bỏ qua → THU TIỀN GÓI MÀ KHÔNG TẠO GÓI — đúng lỗ S2h định bịt, chỉ hẹp hơn. Màn hình không gửi dạng này (Sales.jsx:708 `customer?.phone || null`). Cùng khuôn có sẵn ở :187 (mua thẻ) — cổng mới chép theo nên chép luôn lỗ. Cách gọn: cổng :198 kiểm `normalizePhone(customer_phone)` (hoặc cổng thẻ + gói dùng chung một biến đã chuẩn hoá); thêm ca S2i `customer_phone: " "` → 400. Chưa chạy — kết luận từ đọc 3 dòng trên. — K4 (cổng kiểm biến khác biến tiêu thụ) / K5 chiều ngược.
- viec/SO-LUONG-1/trang_thai.md "Bước 4–6" & ke_hoach.md "Thực tế bước 4–5": "vá +14/−3 dòng code (kể cả 6 dòng chú thích)" — `git diff --numstat b823f72^ HEAD -- server/routes/orders.js` = **+20/−7** (8 dòng chú thích thêm, 3 bỏ). Hồ sơ lệch số. — K1.

NGHI NGỜ:
- Hàm `soNguyenDuong` (:37) chỉ có VS- (`BO-NGUYEN`), không BV- riêng; "xoá 2 dòng pkg_qty||1" không đột biến — trang_thai đã khai; vế A5 "mỗi chỗ vá ≥ 1 VS- + BV-" không đúng theo nghĩa đen cho 2 chỗ này (BV hàm trùng BV-MON + BV-GOI nên chấp nhận được, nhưng ghi rõ).
- `VS-SOLUONG1-GOI-LAM-TRON` bị bắt vì S2d trả 400 "Số tiền không khớp" (mã khác), không phải vì lọt tiền — hợp lệ vì ca so `code`, nhưng là bắt gián tiếp.
- Luồng hợp lệ "lấy từ gói" (A5) chỉ qua helper `goiDaLay` (ném nếu ≠200, thu_P26c.js:155–165) + ca cũ P26c/GOI1, không ca [S] riêng — chấp nhận được.
- Có sẵn, KHÔNG do SO-LUONG-1 (ghi Phát hiện): `customer_phone` kiểu số → helpers.js:154 `phone.replace` ném → 500; `items` không mảng + `package_buy` → :191 `items.some` / :296 `for…of` ném → 500. `package_buy` là chuỗi/số → :198 `.package_id` undefined → 400 sạch, không 500 (đọc code).

NGHIỆM THU: 14/16 mục có bằng chứng · mục thiếu: (1) "mỗi chỗ vá ≥ 1 VS- + BV-" cho hàm `soNguyenDuong` và 2 dòng xoá (đã khai CHƯA KIỂM trong trang_thai); (2) "đột biến P26c / GOI-2 vẫn BẮT" — tôi KHÔNG tự chạy lại (201 đột biến), chỉ đọc file máy để lại scratchpad/db_p26c.txt 89/93 · db_goi2.txt 59/59 · db_goi1.txt 40/49 (08:59–09:00, sau khi vá code 08:49).
Bằng chứng tự chạy lượt này:
- A1/A2/chốt (i)(ii): `node cong_cu/thu_P26c.js --may-chu <bản sao server/ với orders.js b823f72>` → 91 đạt · 12 hỏng, đúng 12 ca S1a–f, S2a–d, S2g, S2h (khớp bang_chung_do.txt từng dòng); HEAD → 103 · 0. Mỗi ca chặn gửi `cash_amount` = số gốc tự tính (S1a 50.000, S2b 600, S2c 0…) → vi phạm đúng một phép; S1e gốc 500 NaN (ghi trong tên ca). Ca kiểm status+code+COUNT đơn/kho/gói, không marker.
- A3: một hàm :37 dùng ở :202 và :325; mã GOI-1 giữ :327; thu_GOI1 đối chứng 101/0 (kể cả A2k gửi `' 5'`, `' 7'` chuỗi có khoảng trắng → vẫn qua).
- A4: `BV-SOLUONG1-MON` → ✗ S1c (0,5 → 62.500) bị bắt.
- A5: `python3 viec/SO-LUONG-1/dot_bien.py` → đối chứng P26c 103/0 + GOI1 101/0, **15/15 bị bắt**, mỗi dòng bắt là ✗ đúng ca (không ca nào "ném"); `npm test` PASS 63 · FAIL 0 · CẢNH BÁO 0; `--day-du` PASS 67 · FAIL 0 · CẢNH BÁO 0; `python3 viec/GOI-1/dot_bien.py BV-GOI1-SL-AM VS-GOI1-SL-AM-CHI-0` → 2 "không áp được" đúng như khai, đã dựng lại `…-THU-GOI1` bắt qua A2j.
- K5: grep `package_buy`/`pkg_qty`/`quantity:` trong cong_cu/*.js, gia_lap/kich_ban.js — mọi lời mua gói đủ `package_id` + SĐT, pkg_qty 1–2, quantity nguyên hoặc `' 5'`; Sales.jsx:748 `pkg_qty: quantity || 1`, :486 đòi khách, :385–400 bỏ khách không gỡ gói → nay 400 lời rõ (đã ghi Phát hiện). Không trần pkg_qty (code không có) ✓; không sửa viec/GOI-1 (diff --stat) ✓.
- P1: diff --stat không có client/src → không cần build ✓. Đường tiền: tiền vẫn server tự tra (`pkg.price * pkgQty` :415, `unitPrice * sl` :382; `cash_amount` chỉ đối chiếu :775–786) — không phá P4.
- Đơn giản: code gọn, đúng chỗ; hai khối chú thích 3 dòng (:195–197, :321–323) hơi dài nhưng chấp nhận. Không tính năng tiền mới → không cần quy tắc đối soát mới.

CHƯA SOÁT ĐƯỢC: chạy thật ca `customer_phone: " "` (chỉ đọc code); chạy lại toàn bộ đột biến P26c/GOI-2; hành vi trên Turso/production.

BÀI HỌC: KHOÁ — thêm ca `customer_phone` chỉ khoảng trắng cho cả cổng gói :198 và cổng thẻ :187. NGUYÊN TẮC (K4 bổ sung): cổng "bắt buộc có X" phải kiểm ĐÚNG biến mà chỗ tiêu thụ dùng (giá trị đã chuẩn hoá), không kiểm giá trị thô — chép cổng có sẵn thì chép luôn lỗ của nó. K1: con số dòng vá trong hồ sơ phải lấy từ `git diff --numstat`, không đếm tay.
```

### Vòng sửa 1 (sau soát lần 2) — 1/3 vòng tối đa
- Lỗi 1 (K4/K5, ĐƯỜNG TIỀN): tự đối chiếu `helpers.js:152–158` (`normalizePhone(" ")` → `""`), `orders.js:1067` `membershipTier && phone` cùng khuôn với :1033. Vá CẢ HAI
  cổng (:187 thẻ, :199 gói) kiểm `normalizePhone(customer_phone)` — một biểu thức, không thêm biến (`phone` khai ở :538 là `const`, dời lên 350 dòng
  không đáng). Ca mới S2i (gói, SĐT `" "`: gốc 200 thu 300.000 không tạo gói → 400), S4c (thẻ, SĐT `" "`: gốc 200 thu 525.000 không ghi thẻ → 400).
  Đột biến `VS-SOLUONG1-GOI-THIEU-SDT-THO` (S2i), `VS-SOLUONG1-THE-SDT-THO` (S4c) — cùng mẫu siết `GOI-THIEU-SIET` đổi neo theo.
  Chạy lại trên gốc (orders.js `b823f72` qua `git show`, --may-chu): 91 đạt · **14 hỏng** (12 cũ + S2i, S4c); HEAD **105 đạt · 0 hỏng** →
  `SỐ CA cong_cu/thu_P26c.js: 105` (`bang_chung_do.txt` viết lại). `dot_bien.py` **17/17 bị bắt** (đối chứng 105/0 + 101/0). `npm test` 63/0/0.
- Lỗi 2 (K1): số dòng ghi lại từ `git diff --numstat`: `orders.js` +22/−8 (chú thích +9/−3), `thu_P26c.js` +73.
- KHOÁ theo BÀI HỌC của người soát: `dot_bien.py` thêm phép bắt tường minh dòng "Bài thử sập" → đột biến làm bài ném KHÔNG tính là bắt (sự cố mẫu SIET
  đầu, trước đây chỉ lộ nhờ regex `bat` không khớp).
- Nghi ngờ 1 ghi nhận: hàm `soNguyenDuong` không có BV- riêng (bỏ hàm = bỏ cả hai phép → trùng `BV-SOLUONG1-MON` + `BV-SOLUONG1-GOI`); 2 dòng xoá
  `pkg_qty || 1` không đột biến được (đã khai). Nghi ngờ 4 → Phát hiện.
- Tên đột biến thêm: VS-SOLUONG1-GOI-THIEU-SDT-THO, VS-SOLUONG1-THE-SDT-THO (bảng chỗ vá bổ sung hàng "cổng SĐT :187 / :199").
