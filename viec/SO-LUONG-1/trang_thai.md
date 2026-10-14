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
- **Sửa code** `server/routes/orders.js` (+14/−3, trong đó 6 dòng chú thích): hàm `soNguyenDuong` (:35–37); phép đầu route (:195–204):
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
