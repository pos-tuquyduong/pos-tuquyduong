# HANG-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (02.11.2026)
- Nhánh: `viec/HANG-1`; `git status --short` sạch.
- `git fetch origin viec/HANG-1` xong. HEAD = `c26b4e0`, FETCH_HEAD = `c26b4e0` → bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  c26b4e0 PHIEU: HANG-1
  2c81b0f TIEN-DO: MANKHACH-1 (ae27536), TU-CHAY-10 (4891879), KHO-IN-1 (d1b57b8) xong; dot quyet dinh 01-02.11 + thiet_ke dot 2 + hop dong v7 (da hen) + lich theo lan; mo GIO-VN-1, HANG-1, NAP-1 — so v53
  d1b57b8 Merge pull request #64 from pos-tuquyduong/viec/KHO-IN-1
  ```
- Có commit `PHIEU: HANG-1` (`c26b4e0`).

## Bước 3 — kế hoạch
- `viec/HANG-1/ke_hoach.md` đã viết, agent phụ chỉ đọc đã soát theo 4 câu (kết quả ghi cuối `ke_hoach.md`).
- Phiếu dặn **Chờ duyệt kế hoạch** → commit, push, DỪNG.

### Câu hỏi 02.11 — ĐÃ TRẢ LỜI 03.11 (Q1-a PIN riêng · Q2 sửa 8 bài + I15 · Q3 làm trên main mới, bước 013)
1. **PIN chủ quán chưa có trong hệ thống** (grep `pin` khắp `server/` chỉ thấy PIN KHÁCH `server/utils/pinKhach.js`). Cần chỗ lưu + chỗ đặt.
   Đề xuất Q1-a: PIN 4–6 số của quán, lưu BĂM trong `pos_settings`, đặt / đổi ở Cài đặt → Hạng (chỉ tài khoản chủ quán, nhập mật khẩu
   đăng nhập), sai 5 lần khoá 15 phút; một file chung `server/utils/pinChuQuan.js` (DONVI-1 dùng lại sau) → **thêm file đó vào Phạm vi**.
2. **Bài thử cũ phải sửa vì luật mua thẻ đổi** (đã được chủ quán duyệt đổi — LUAT §6.8, bài sửa thường): 8 bài đang mua thẻ bằng
   `membership_buy: { tier_id }` + giá `card_price` hoặc khoá `gia_the = card_price`, và bất biến Đối soát I15 (dòng CẤP không có đơn) →
   xin thêm vào Phạm vi: `cong_cu/thu_DOISOAT1.js`, `cong_cu/thu_HD1.js`, `cong_cu/thu_P2223.js`, `cong_cu/thu_P24.js`, `cong_cu/thu_P26c.js`,
   `cong_cu/thu_KHAPI2.js`, `cong_cu/thu_UUDAI1.js`, `cong_cu/thu_P3.js`, `cong_cu/gia_lap/kich_ban.js`, `cong_cu/gia_lap/bat_bien.js`.
3. **Phiếu ghi "mở SAU KHI KH-SDT-1 gộp"** — sổ `TIEN_DO_POS.json` vẫn ghi KH-SDT-1 `dang_mo`, `git log` chưa có commit gộp. Kế hoạch
   không phụ thuộc KH-SDT-1 về luật, chỉ có thể đụng nhau ở `customers-v2.js`, `kh/index.js`, số bước nâng cấp, `PHIEN_BAN`. Làm tiếp
   ngay hay chờ?

## Phát hiện (ngoài phạm vi, không sửa)
- Quyền `cap_hang` (mới) sẽ chưa có nhãn ở màn phân quyền (`server/routes/users.js:156-171`) — cùng khuôn `refund_package`, `xoa_pin_khach`.
- Phiên QR payOS chạy lại toàn bộ cổng lúc chốt: đổi giá / tắt gói (hạng hoặc gói sản phẩm) giữa lúc mở phiên và lúc chốt → đơn 400 sau khi
  khách đã chuyển. Có sẵn với gói sản phẩm; HANG-1 không mở đường riêng.
- `CHECKLIST_CODE.md` mục H.6 vẫn ghi "Hai hạng thẻ: Vàng và Bạch Kim. Không có Kim Cương" — lệch CLAUDE.md §5.6 (sổ v53).
- `server/database.js:1325-1328` (seed kho TRỐNG) vẫn tạo `Bạch Kim` — kho mới sẽ có Bạch Kim (bán, không gói → không bán được).
- Màn Bán hàng MỚI (`client/src/pages/BanHang/`) chưa bán thẻ (`tinh.js:150` luôn `membership_buy: null`) — chỉ màn cũ `Sales.jsx` bán.
- `orders.js` ghi hạn thẻ bằng `addMonthsSafe(new Date(now))` + `toISOString()` — chỉ đúng khi máy chủ chạy UTC (K7). Kế hoạch thay bằng
  phép cộng tháng trên chuỗi giờ VN (không phụ thuộc múi giờ máy) ngay trong `membershipStatus.js`.

## Bước 1 — đối chiếu bản chụp, làm tiếp (03.11.2026 — chủ quán duyệt kế hoạch: Q1-a, Q2, Q3)
- Nhánh `viec/HANG-1`, cây sạch. `git fetch origin viec/HANG-1`: HEAD = `2a12443`, FETCH_HEAD = `2a12443` → bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  2a12443 PHIEU: HANG-1 them Pham vi Q1 pinChuQuan + Q2 bai cu (chu quan 03.11)
  0d8266d GOP-HANG-1 gop main c4513ac (chat 03.11, truoc khi may lam tiep)
  c4513ac Merge pull request #66 from pos-tuquyduong/viec/GIO-VN-1
  ```
- Có commit `PHIEU: HANG-1` (`c26b4e0`, `2a12443`). Bước nâng cấp dùng số 013 (thư mục có tới 012). `PHIEN_BAN` hợp đồng trên main = 6 → HANG-1 ghi 7.

## Bước 4–5 — bài thử trước, rồi vá (03.11)
- `cong_cu/thu_HANG1.js` viết TRƯỚC, chạy trên code chưa vá → **ĐỎ** (bản cuối: 8 đạt · 98 hỏng trên gốc `2a12443`); sau vá → **115 đạt · 0 hỏng**.
  Bằng chứng + `SỐ CA` mọi bài đổi: `viec/HANG-1/bang_chung_do.txt` (dựng cây gốc như cổng A11).
- Bài thử phải sửa giữa chừng (ghi để rút kinh nghiệm): token ký một lần hết hạn khi đồng hồ giả nhảy sang 2027 → ký lúc gọi; ca đơn 1 ly
  trả 25.000 trong khi đơn được giảm hạng → hỏi `/tinh-thu` rồi trả đúng tổng; phần G đổi tên file theo bố trí thật (`pages/CaiDat/HangThe.jsx`).
- Đã vá theo kế hoạch đã duyệt; **chỗ làm khác kế hoạch** (đều trong Phạm vi, nêu lý do):
  1. **PIN chủ quán lưu ở bảng riêng `pos_pin_chu_quan`** (bước 013), KHÔNG ở `pos_settings` như đề xuất Q1-a: đọc `server/routes/settings.js:57-60`
     — `GET /api/pos/settings` trả MỌI khoá cho mọi nhân viên đăng nhập (lộ băm → dò hết 10⁶ PIN), và `PUT /settings` (`:107`) cho quản lý ghi đè
     khoá bất kỳ (tự đặt PIN của mình). Bảng mới vào `BACKUP_TABLES` (SAOLUU-2; xuất chỉ owner như `pos_users`) và `BANG_KHONG_KHOI_PHUC`
     (file cũ không đặt lại PIN / gỡ khoá sai). Ca `C0f` canh "không có PIN trong pos_settings".
  2. Bất biến I15 lọc `m.order_id IS NOT NULL` (dòng bán luôn có đơn, dòng cấp / thu hồi luôn NULL) thay vì `loai = 'ban'`: `cong_cu/thu_gia_lap.js`
     (ngoài Phạm vi) dựng bảng thẻ tối giản `(id, order_id)` không có cột `loai` → I15 sập. Hai vị từ như nhau trên dữ liệu đúng.
  3. `thu_UUDAI1.js` S8 khoanh vùng bằng neo `const deleteTier` (hàm đã dời cùng bảng hạng cũ sang `HangThe.jsx`) → đổi neo cuối sang
     `// Permissions functions` (dòng kế tiếp thật). Không phải "phần dựng dữ liệu" của Q2 nhưng là cùng phép, cùng vùng — ghi để chat soát.
  4. Bước 013 bỏ qua bảng chưa có (khuôn bước 003) — `thu_KHO2a` E6b / `thu_KHAPI3` C4b chạy cả thư mục nâng cấp trên kho thiếu bảng.
  5. ▲▼ ở thẻ Hạng: danh sách xếp thứ bậc CAO ở trên, ▲ = lên bậc (demo xếp thấp ở trên mà nút ghi "Lên bậc" lại đưa xuống bậc — chọn cách
     khớp nhãn "Lên bậc" + câu "thứ bậc càng lớn càng cao").
  6. Cộng tháng dùng lại `addMonthsSafe` (phép UTC trên giờ VN — GIO-VN-1) trong `membershipStatus.js`, không viết hàm mới.

### Bảng chỗ vá → đột biến (`viec/HANG-1/dot_bien.py` — 43 đột biến: 43 BẮT · 0 SỐNG, đối chứng xanh 115 đạt)
| Chỗ vá | Đột biến |
|---|---|
| `membershipStatus.js` hạng cao nhất còn hạn / vô hạn / cộng nối / cấp đặt lại / thu hồi | VS-hang-moi-nhat · VS-vo-han-het · VS-khong-cong-noi · VS-cap-cong-noi · BV-thu-hoi |
| `membershipStatus.js` goiBanDuoc (một vị từ quầy + App) | VS-goi-chua-gia-ban · VS-goi-tat-ban |
| `customers-v2.js` danh sách khách qua hàm chung | BV-customers-v2 |
| `orders.js` giá gói máy chủ tra, chặn chi_cap, chặn hạng cao hơn, thiếu so_thang | VS-gia-may-khach · BV-chi-cap · BV-cao-hon · VS-chieu-cao-hon · VS-cao-hon-bang · VS-cao-hon-het-han · BV-thieu-thang |
| `membership.js` cấp / thu hồi: quyền, PIN, hạng chi_cap, số tháng | VS-cap-quyen-chung · VS-thu-hoi-quyen-chung · VS-cap-khong-pin · VS-thu-hoi-khong-pin · BV-cap-chi-cap · VS-cap-thang-chuoi · VS-cap-thieu-thang-vo-han |
| `pinChuQuan.js` khoá sai 5 lần, chỉ owner, mật khẩu | BV-pin-khoa · VS-pin-khoa-bo-dem · BV-pin-chi-chu · BV-pin-mat-khau |
| `tiers.js` kiểm hạng / gói, thứ bậc trùng, chi_cap gói rỗng, xoá hạng còn khách | VS-thang-61 · BV-bac-trung · BV-chi-cap-goi-rong · BV-xoa-hang · VS-xoa-hang-ca-het-han |
| `013_hang.js` dữ liệu Vàng / Kim Cương, không đè, thứ bậc, quyền | BV-013-vang · VS-013-ten-gan-dung · VS-013-de-goi · BV-013-bac · BV-013-quyen |
| `kh/index.js` /hang v7, het_han null | BV-hang-kh · VS-het-han-chuoi |
| `bat_bien.js` I15 | VS-I15-cap |
| giao diện Sales / HangThe / Customers | VS-khoa-gio-thieu-thang · BV-ban-khoa-cao-hon · VS-xoa-hop-thoai · BV-cap-quyen-giao-dien |

## Bước 6 — kiểm (03.11)
- `node cong_cu/thu_HANG1.js` → 115 đạt · 0 hỏng. `python3 viec/HANG-1/dot_bien.py` → TỔNG 43 · BẮT 43.
- Bài cũ trong Phạm vi đã sửa phần dựng dữ liệu (Q2): DOISOAT1 134 · HD1 157 · KHAPI2 101 · P2223 44 · P24 33 · P26c 157 · P3 100 · UUDAI1 88 ·
  HOPDONG_KH 81 — tất cả xanh. Bản GỐC của chúng chạy trên code mới đều ĐỎ (lần `npm test` đầu sau vá: THE_MUA_THIEU_THONG_TIN / C1 6 trường
  / bước 013 trên kho thiếu bảng) → bài SỬA thường (LUAT §6.8–6.9), không thuộc `## Bài thử cũ sửa`.
- `npm test -- --day-du` → **PASS 97 · FAIL 1 · CẢNH BÁO 1**. FAIL duy nhất: `cong_cu/thu_GIOVN1.js` C5a/C5b/C5c — NGOÀI Phạm vi, xem `## Câu hỏi`.
  CẢNH BÁO có sẵn từ trước (route GET có lệnh ghi: packages.js, products.js, sync.js — không phải file của việc này). `dist` khớp `src` (build lại).
- `node tu_chay/cong.js tinh . c4513ac HEAD viec/HANG-1` (so với main — mốc `c26b4e0^` nằm trước lần gộp main nên A6 liệt kê cả file của
  GIO-VN-1 / KH-SDT-1): không còn lỗi Phạm vi; còn A17 (đã sửa dòng đột biến nhiều dòng), A19, A20 — đúng bước.

## Câu hỏi (03.11 — chờ chủ quán; phần còn lại đã làm xong)
1. **`cong_cu/thu_GIOVN1.js` (vào kho qua GIO-VN-1, SAU lần lập kế hoạch) mua thẻ kiểu cũ và KHÔNG có trong Phạm vi.** Ca C5a/C5b/C5c
   (`thu_GIOVN1.js:344-359`) gửi `membership_buy: { tier_id }` không `so_thang`, trả `card_price`, đặt `tier_card_valid_months` — sau HANG-1 máy chủ
   trả 400 `THE_MUA_THIEU_THONG_TIN` nên bài đỏ, `npm test` FAIL 1. Điều bài canh (cộng 3 tháng theo giờ VN, không lệch múi giờ) vẫn đúng ở code mới
   (B5, C5 của thu_HANG1 so chuỗi hạn). **Đề xuất:** bạn thêm `- cong_cu/thu_GIOVN1.js` vào `## Phạm vi` (cùng loại Q2 — chỉ phần dựng dữ liệu);
   mình sửa đúng 2 dòng: đặt gói 3 tháng giá = `card_price` cho hạng (`UPDATE … SET goi = json_array(json_object('so_thang', 3, 'gia', …))`, thay dòng
   `datCai('tier_card_valid_months', '3')`) và gửi `membership_buy: { tier_id: hang.id, so_thang: 3 }`.

## Phát hiện (03.11 — ngoài phạm vi, không sửa)
- `GET /api/pos/settings` trả MỌI khoá `pos_settings` cho mọi nhân viên đăng nhập (`server/routes/settings.js:57-60`) — hôm nay chưa có bí mật ở
  đó (PIN chủ quán đã để bảng riêng), nhưng ai thêm khoá bí mật vào `pos_settings` sau này sẽ lộ. Đề xuất: danh sách trắng / đen khoá ở GET.
- Danh sách khách `customers-v2.js` gom hạng của MỌI khách mỗi lần tải (đọc cả sổ thẻ) — trước khai trương sổ rỗng; sổ lớn thì tính lại theo trang.
- `server/database.js` seed kho trống vẫn có `card_price` (500.000 / 2.000.000) + `tier_card_valid_months` — nay không ai đọc; dọn khi chạm tới.
- Bước 013 đánh lại thứ bậc theo thứ tự đang hiện: kho thật nếu có Kim Cương thêm tay đứng dưới Vàng → Kim Cương thứ bậc thấp hơn Vàng; chủ quán
  bấm ▲ ở Cài đặt → Hạng (không tự đoán thay).
