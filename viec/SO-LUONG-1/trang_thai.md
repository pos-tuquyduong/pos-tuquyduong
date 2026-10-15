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
- (soát vòng 2, có sẵn từ TIER-1c, cùng khuôn lỗ S2g) `membership_buy: {}` + `items: []`: :178 cho items rỗng (`{}` truthy), cổng thẻ :187 bỏ qua
  (`tier_id` falsy), :433 bỏ qua → đơn 0đ rỗng. Không mất tiền. Đề xuất: cổng thẻ cùng dạng cổng gói `membership_buy && !(membership_buy.tier_id &&
  normalizePhone(customer_phone))` + 1 ca đỏ — việc sau.
- (soát vòng 2, có sẵn) SĐT chữ (`"abc"`) qua `normalizePhone` vẫn truthy → gói / thẻ ghi SĐT rác; orders.js không dùng `isValidPhone`. Việc sau.
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

### Báo cáo soát vòng 2 (chép nguyên văn, agent general-purpose, sau vòng sửa 1)
```
ĐẠT (có điều kiện: `--day-du` tôi KHÔNG chạy — hồ sơ khai 67/0/0; chạy lại trước khi giao). Không tìm thấy lỗi chặn giao trong phần vòng sửa 1.

LỖI TÌM ĐƯỢC: không có lỗi NẶNG. Ghi nhận nhẹ:
- viec/SO-LUONG-1/trang_thai.md:112 & ke_hoach.md "Chốt" — ghi `:1033` (tạo gói) / `:1067` (`membershipTier && phone`); trên HEAD là orders.js:1034 / :1068 (vòng sửa 1 thêm 1 dòng chú thích :196 làm trôi). Lệch 1 dòng, bản chất đúng — K1.
- viec/SO-LUONG-1/dot_bien.py:92 phép bắt "Bài thử sập": chuỗi khớp cong_cu/thu_P26c.js:829 và thu_GOI1.js:817 (số :819 trong lệnh soát đã trôi). Phép này CHƯA từng được chứng kiến nổ (mẫu SIET `items.length` làm bài sập đã bị thay) → phép tự-kiểm chưa có ca đỏ — K3 (nhẹ; cách gọn: ghi CHƯA KIỂM trong trang_thai, không cần thêm đột biến).

NGHI NGỜ (đọc code, chưa chạy — đề nghị ghi Phát hiện, KHÔNG do SO-LUONG-1):
- orders.js:178 + :187 + :433 — `membership_buy: {}` + `items: []`: :178 cho items rỗng (`{}` truthy), :187 bỏ qua (`tier_id` falsy), :433 bỏ qua → `orderItems` rỗng, không guard nào khác (grep `orderItems.length` chỉ :208) → đơn 0đ rỗng. CÙNG KHUÔN lỗ S2g (`package_buy: {}`) đã vá cho gói; cổng thẻ (có từ TIER-1c) không che. Không mất tiền; Sales.jsx:751 gửi `{tier_id}` hoặc null. K4 chiều rộng — ngoài phiếu.
- orders.js:187/:199 ↔ :538: SĐT chữ (`"abc"`) → `normalizePhone` trả "abc" truthy → cổng và chỗ tiêu thụ ĐỒNG NHẤT (không thu tiền mà thiếu gói), nhưng gói ghi SĐT rác; orders.js không dùng `isValidPhone` (grep 0). Có từ trước.
- SĐT kiểu số: helpers.js:154 `phone.replace` ném tại :187/:199 → catch :1209 → wallets.js:101 → 500. Trước vòng 1 cũng 500 (ném ở :538). Không đổi hành vi; Sales.jsx:708 `customer?.phone || null`, cột `pos_customers.phone TEXT` (database.js:81), bài thử `sdtMoi()` chuỗi (thu_P26c.js:127) → không luồng hợp lệ nào gửi số. Đã ghi Phát hiện — đồng ý.
- S4c (thu_P26c.js:816–818) chỉ so `status === 400` + COUNT đơn, không so `code` (cổng thẻ không có `code`) — yếu hơn S2i; cổng :187 chỉ có 1 VS-, không có đột biến "siết quá tay" (S4b là ca K5 duy nhất). Chấp nhận được vì cổng này có sẵn, vòng 1 chỉ đổi biến.
- `pkg_qty: ""` → 400 (chốt Q3) không có ca riêng (S2a chỉ `0`; `Number("")` = 0 cùng nhánh) — nhẹ.

KIỂM TRA ĐÃ TỰ CHẠY (K3 / K4 / K5):
- Gốc b823f72 (orders.js qua `git show` vào bản sao server/ trong scratchpad, --may-chu): **91 đạt · 14 hỏng** — S2i ✗ "HTTP 200", S4c ✗ "HTTP 200" (đúng khớp bang_chung_do.txt từng dòng). HEAD: **105 đạt · 0 hỏng**. S2i gửi đủ package_id + total_qty + pkg_qty 1, chỉ SĐT " " → vi phạm đúng một phép; S4c gửi items [mon(0)] + tier hợp lệ + cash khớp → đúng một phép.
- `python3 viec/SO-LUONG-1/dot_bien.py` toàn bộ: đối chứng 105/0 + 101/0, **17/17 bị bắt**; `VS-SOLUONG1-GOI-THIEU-SDT-THO` → ✗ S2i, `VS-SOLUONG1-THE-SDT-THO` → ✗ S4c (đúng ca, không "ném").
- `npm test`: PASS 63 · FAIL 0 · CẢNH BÁO 0.
- K4: `normalizePhone(customer_phone)` ở :187/:199 là CÙNG biểu thức với :538 `const phone = normalizePhone(customer_phone)` → `null`/`""`/`" "`/`"-"` đều falsy ở cả hai; :1034 `package_buy && package_buy.package_id && phone` ⊆ cổng :199; :1068 `membershipTier && phone` — `membershipTier` chỉ null khi 400 ở :435 → ⊆ cổng :187. grep `customer_phone` orders.js (14 chỗ): :75–77 chuẩn hoá, :228–229 chuẩn hoá, còn lại là cột SQL / `order.customer_phone` từ DB → không còn cổng thô nào.
- Neo đột biến cũ: grep `customer_phone|membership_buy|tier_id &&|package_buy && !` trong viec/P26c, GOI-2, GOI-1/dot_bien.py → KHÔNG neo nào chứa chuỗi của :187/:199 (3 dòng khớp `customer_phone` đều là ghiVi / packages.js / Reports.jsx) → kết quả scratchpad db_p26c 89/93 · db_goi2 59/59 · db_goi1 40/49 (chạy trước vòng sửa 1) còn giá trị.
- K1 hồ sơ: `git diff --numstat b823f72^ HEAD` = orders.js 22/8, thu_P26c.js 73/0 — khớp trang_thai "Vòng sửa 1" và ke_hoach "Thực tế bước 4–8". "gốc 14 ✗", "105 ca", "17/17" — khớp kết quả tôi chạy.
- git status sạch; không sửa file kho.

NGHIỆM THU: 12/15 mục có bằng chứng tự chạy / đọc · mục thiếu: (1) A5 `--day-du` — chưa chạy; (2) A5 "đột biến P26c / GOI-2 / GOI-1 vẫn BẮT" — không chạy lại, chỉ xác nhận neo không đụng + kết quả cũ (GOI-1 9 "không áp được": 2 do SO-LUONG-1 đã dựng lại THU-GOI1 bắt A2j — tôi chạy ✓); (3) A5 "mỗi chỗ vá ≥ 1 VS- + BV-" — hàm `soNguyenDuong`, 2 dòng xoá đã khai CHƯA KIỂM; cổng :187 chỉ VS-.
Có bằng chứng: A1 (S1a–h gốc đỏ/HEAD xanh), A2 (S2a–f), A3 (một hàm, :203 + :325, mã GOI-1 giữ, thu_GOI1 101/0), A4 (BV-SOLUONG1-MON → ✗ S1c), A5 luồng hợp lệ (S1g/h, S2e/f, S4a/b + 5 đột biến siết), npm test, dot_bien 17/17 có đối chứng, chốt (b) GOI-1, chốt không trần (code không có), chốt pkg_qty 0 → 400 (S2a), chốt GOI_MUA_THIEU_THONG_TIN (S2g/h/i + 4 đột biến), vòng 1 hai cổng chuẩn hoá (S2i/S4c + 2 đột biến).

CHƯA SOÁT ĐƯỢC: `node kiem_tra_truoc_khi_giao.js --day-du` (giả lập kich_ban.js); chạy lại 201 đột biến P26c/GOI-2/GOI-1 trên HEAD; chạy thật ca `membership_buy: {}` + `items: []`; dữ liệu/hành vi trên Turso production.

BÀI HỌC: NGUYÊN TẮC (K4 bổ sung, xác nhận): cổng "bắt buộc có X" phải là CÙNG biểu thức với chỗ tiêu thụ — vòng 1 làm đúng. KHOÁ đề nghị cho việc sau: cổng `membership_buy` nên cùng dạng với cổng `package_buy` (`membership_buy && !(membership_buy.tier_id && normalizePhone(customer_phone))`) để `{}` không lọt — ghi Phát hiện, không mở rộng việc này.
```
- Điều kiện của người soát: `--day-du` đã chạy SAU vòng sửa 1 trên cây = `597184b`: PASS 67 · FAIL 0 · CẢNH BÁO 0 → ĐẠT. Hai ghi nhận nhẹ:
  số dòng `:1033`/`:1067` trong hồ sơ viết trước vòng sửa 1 nay là `:1034`/`:1068` (trôi 1 vì thêm 1 dòng chú thích :196) — giữ nguyên chữ cũ, ghi
  chú ở đây; phép bắt "Bài thử sập" chưa có ca đỏ chứng kiến → CHƯA KIỂM. Nghi ngờ 1, 2 → Phát hiện (đã ghi).

## Báo cáo 7 mục (CLAUDE.md §7)
```
VIỆC:        SO-LUONG-1 — Máy chủ chỉ nhận số lượng nguyên ≥ 1 (món lẻ, số gói mua); mua gói / thẻ phải đủ mã + SĐT đã chuẩn hoá
ĐÃ SỬA:      server/routes/orders.js:35–37 — hàm `soNguyenDuong` (một quy tắc) · :187 — cổng thẻ kiểm `normalizePhone(customer_phone)` ·
             :195–205 — cổng `GOI_MUA_THIEU_THONG_TIN` (mã gói + SĐT chuẩn hoá) và `pkgQty = Number(pkg_qty ?? 1)` + `SL_KHONG_HOP_LE`, một biến ·
             :321–328 — phép SL cho MỌI món, mã GOI-1 giữ cho món từ gói · xoá 2 dòng `package_buy.pkg_qty || 1` (cũ :400, :1020).
             cong_cu/thu_P26c.js — mục [S1] [S2] [S3 + S4], 21 ca (84 → 105). viec/SO-LUONG-1/dot_bien.py — 17 đột biến + đối chứng + bắt "bài thử sập".
BÀI THỬ:     chạy trên bản chưa vá (orders.js b823f72 qua --may-chu) → ĐỎ 14 ca: S1a–f (SL 0/−1/0,5/1,5/"2a"/"" — gốc tạo đơn 50.000 / 25.000 /
             62.500 / 87.500 đ, "2a" → 500), S2a–d (pkg_qty 0/0,002/−1/1,5 — gốc 300.000 / 600 / 0 / 450.000 đ), S2g ({} + món từ gói → 0đ),
             S2h (không SĐT), S2i (SĐT " "), S4c (thẻ SĐT " "); sau khi vá → XANH 105 đạt · 0 hỏng. 17/17 đột biến bị bắt (đối chứng 105/0 + 101/0).
ĐÃ RÀ K4:    grep "pkg_qty" orders.js → 2 chỗ (:400, :1020) → gom 1 biến, 0 chỗ còn đọc thô · grep "quantity" → chỗ đọc thô sau phép kiểm chỉ
             checkStock + lời báo (:335, :339, vô hại) · grep "customer_phone" cổng thô → :187 (thẻ) cùng khuôn :199 → vá cả hai; 14 chỗ còn lại
             là chuẩn hoá / cột SQL · neo đột biến cũ đụng dòng sửa: 2 của GOI-1 (chủ quán chốt (b), dựng lại), 0 của P26c / GOI-2.
CHƯA KIỂM:   (1) 2 dòng xoá `pkg_qty || 1` và hàm `soNguyenDuong` không có BV- riêng (dựng lại dòng xoá cho cùng kết quả; bỏ hàm = bỏ cả hai phép —
             trùng BV-MON + BV-GOI). (2) Phép bắt "Bài thử sập" trong dot_bien.py chưa có ca đỏ chứng kiến. (3) Dữ liệu thật Turso: chưa đọc có
             món đơn vị cân / SL lẻ hay SĐT rác không — chỉ đọc code (products.js:101 `gói`/`túi`). (4) `pkg_qty: ""` cùng nhánh `Number("") = 0`
             với S2a, không ca riêng. (5) Màn hình bỏ chọn khách sau khi thêm gói nay gặp 400 — chưa thử trên trình duyệt. (6) GOI-1 dot_bien còn 7
             "không áp được" có từ GOI-2 (packages.js / Reports.jsx) — không do việc này, không chạy lại trên HEAD sau vòng sửa 1 (neo không đụng).
GIT:         52a8208 SO-LUONG-1: hồ sơ — báo cáo soát lần 2 nguyên văn, vòng sửa 1, số dòng từ numstat, phát hiện
             597184b SO-LUONG-1: vòng sửa 1 — cổng mua gói / mua thẻ kiểm SĐT đã chuẩn hoá (" " lọt), ca S2i S4c, 2 đột biến, dot_bien bắt 'bài thử sập'
BÀI HỌC:     KHOÁ 1 (làm) + 2 (đề xuất) · NGUYÊN TẮC 1 (đề xuất) · BỎ 4 — chi tiết ở ## Bài học
```

### Đếm nghiệm thu (phiếu + chốt thêm) — mỗi mục một dòng
- A1 chặn 0 / −1 / 0,5 / "2a" / "" → 400, không đơn, kho không đổi: S1a, S1b, S1c, S1e, S1f (+ S1d 1,5) — đỏ gốc, xanh HEAD ✓
- A1 `2` và `"2"` → 200: S1g, S1h ✓
- A2 pkg_qty 0 / 0,002 / −1 / 1,5 → 400: S2a–d ✓ · thiếu → 1: S2e ✓ · 2 → 2 gói, 600.000: S2f ✓
- A3 một hàm cho món từ gói và món lẻ, ca cũ xanh: orders.js:37 dùng ở :203 và :325; thu_GOI1 101/0 (A2j giữ mã, A2k " 5" qua); S3 ✓
- A4 đột biến bỏ kiểm → S1c bắt: `BV-SOLUONG1-MON` ✓
- A5 luồng hợp lệ: 1–10 ly (S4a, S1g), mua 1–2 gói (S2e, S2f), lấy từ gói (S3 helper + P26c A2b/A2e, thu_GOI1), mua thẻ (S4b) ✓
- A5 `npm test` 63/0/0 ✓ · `--day-du` 67/0/0 (chạy lại sau vòng sửa 1) ✓ · 0 CẢNH BÁO ✓
- A5 mỗi chỗ vá ≥ 1 VS- + BV-: phép món ✓ (2 BV, 4 VS), phép số gói ✓ (1 BV, 4 VS), cổng đủ thông tin ✓ (1 BV, 3 VS), cổng thẻ (1 VS — cổng có
  sẵn, chỉ đổi biến), hàm + 2 dòng xoá → CHƯA KIỂM (khai trên) — một phần
- A5 đối chứng 0 lỗi: thu_P26c 105/0, thu_GOI1 101/0 ✓
- A5 đột biến P26c / GOI-1 / GOI-2 vẫn BẮT: GOI-2 59/59 ✓; P26c 89/93 (4 lạc từ GOI-2, có trước) ✓; GOI-1 40/49 (7 lạc có trước + 2 do việc này,
  chủ quán chốt (b), dựng lại THU-GOI1 bắt A2j) — đúng chốt
- Chốt (i) `package_buy: {}` + món từ gói → 400 không đơn không giảm kho: S2g ✓ · (ii) có package_id thiếu SĐT → 400: S2h ✓ · 1 BV + 1 VS + 1 siết:
  `BV-SOLUONG1-GOI-THIEU`, `VS-SOLUONG1-GOI-THIEU-CHI-MA`, `VS-SOLUONG1-GOI-THIEU-SIET` ✓ · K5 trước khi sửa: mọi bài / gia_lap gửi đủ SĐT ✓
- Chốt 1 (b): không sửa viec/GOI-1 (diff --stat), 2 "không áp được" ghi rõ ✓ · Chốt 2 không trần ✓ · Chốt 3 pkg_qty 0 → 400: S2a ✓ ("" cùng nhánh)

## Bài học (bước 11)
Sự cố gom được: (a) soát vòng 1 bắt cổng kiểm `customer_phone` thô ≠ biến chỗ tiêu thụ (`phone` chuẩn hoá) — lỗ thật, đường tiền; (b) mẫu đột biến siết
đầu làm bài thử SẬP ở helper trước khi tới ca → regex không khớp mới lộ; (c) kế hoạch bản 1 lệch 5 số dòng + đoán hành vi gốc ("2a" → 200, thật 500;
−1 → 400 lệch tổng) — soát kế hoạch bắt; (d) hồ sơ đếm tay số dòng vá (+14/−3) ≠ numstat (+20/−7); (e) agent soát lần 1 kết thúc không gọi
`SubagentHandback`, `SendMessage` nhắc bị chặn (CC-LA) → chạy lại; (f) 9 lần người gác chặn: `time`, nhóm `{ }`, biến làm đích ghi (B-DICHCHU ×2),
`for`, heredoc nhắc file bảo vệ (B-MANOI), `ReadNotifications`/`SendMessage` (CC-LA), `grep -noE`, `B-BIMAT-CHU` (của agent soát).
- **KHOÁ (đã làm, trong Phạm vi):** `viec/SO-LUONG-1/dot_bien.py` bắt tường minh dòng "Bài thử sập" → đột biến làm bài ném KHÔNG tính bắt (từ b).
  Ca đỏ: chưa chứng kiến trên mẫu hiện tại (mẫu gây sập đã thay) — khai CHƯA KIỂM.
- **KHOÁ (đề xuất, ngoài Phạm vi):** (1) cổng thẻ `orders.js:187` cùng dạng cổng gói (`membership_buy && !(membership_buy.tier_id && normalizePhone(…))`),
  ca đỏ: `membership_buy: {}` + `items: []` → gốc 200 đơn 0đ rỗng. (2) `client/src/pages/Sales.jsx` `handleClearCustomer` gỡ gói khỏi giỏ; ca đỏ: bản
  mẫu / bài tĩnh soi `setCart(cart.filter(c => !c.is_pkg))`. (3) `tu_chay/lenh_ra_soat.md`: dặn agent "hành động cuối PHẢI là SubagentHandback, báo
  cáo ≤ 60 dòng, quá N lượt thì nộp phần có" (từ e — lần 1 mất 31 lượt không nộp).
- **NGUYÊN TẮC (đề xuất, `KHUON_LOI.md` K4 — ngoài Phạm vi):** "Cổng 'bắt buộc có X' phải kiểm CÙNG biểu thức mà chỗ tiêu thụ dùng (giá trị đã chuẩn
  hoá), không kiểm giá trị thô; chép cổng có sẵn thì chép luôn lỗ của nó. Đã gây: SO-LUONG-1 cổng gói kiểm `customer_phone` thô, khối tạo gói đòi
  `normalizePhone(customer_phone)` → SĐT `" "` thu tiền không tạo gói (soát độc lập bắt)." Gộp vào K4 hiện có, không mở K9; `KHUON_LOI.md` không
  vượt 120 dòng (hiện ~105) — chat soát duyệt.
- **BỎ:** (c) K1 đã có luật "chưa chạy thì ghi CHƯA KIỂM" — lần này soát kế hoạch bắt đúng quy trình; (d) K1 — ghi "số từ numstat" đã đủ, không
  thêm luật; (f) thói quen gõ lệnh, người gác đã bịt bằng KHOÁ; (e) phần `SendMessage` bị chặn — đúng luật CC-LA, không nới.
- **Dọn:** không thấy lời dặn nào trong `KHUON_LOI.md` / `CLAUDE.md` đã có phép máy làm thay trong việc này → không đề xuất xoá.

HEAD ĐÃ KIỂM: 52a8208
