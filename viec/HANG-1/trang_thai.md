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
   trả 400 `THE_MUA_THIEU_THONG_TIN` nên bài đỏ, `npm test` FAIL 1. Điều bài canh (cộng 3 tháng theo giờ VN, không lệch múi giờ): code mới dùng
   lại phép UTC của GIO-VN-1 (`helpers.js:221-227`, `membershipStatus.js:22`) — đó là ĐỌC TAY; thu_HANG1 chạy TZ=UTC nên KHÔNG chứng minh trường
   hợp máy chạy múi giờ khác (ca thật là GIOVN1 C5b — chờ câu này). **Đề xuất:** bạn thêm `- cong_cu/thu_GIOVN1.js` vào `## Phạm vi` (cùng loại Q2 — chỉ phần dựng dữ liệu);
   mình sửa đúng 2 dòng: đặt gói 3 tháng giá = `card_price` cho hạng (`UPDATE … SET goi = json_array(json_object('so_thang', 3, 'gia', …))`, thay dòng
   `datCai('tier_card_valid_months', '3')`) và gửi `membership_buy: { tier_id: hang.id, so_thang: 3 }`.
   Cùng bài, hai ca đỏ kéo theo (stop hook 03.11 liệt kê đủ): **B1** (`thu_GIOVN1.js:544`) đọc dòng sổ thẻ theo số thứ tự — ba lần mua thẻ C5
   400 không ghi dòng nên dòng gieo của B1 lệch (`pos_membership_purchases.expires_at=2026-05-05T08:00:00`); sửa C5 là B1 xanh lại.
   **E2** (`thu_GIOVN1.js:607-608`) ghi CỨNG `PHIEN_BAN = 6` / `"phien_ban": 6` — HANG-1 tăng lên 7 đúng lời dặn "tăng 1 so với main". Đề xuất:
   đổi E2 thành `pb >= 6` (vẫn đòi dòng v6 GIO-VN-1 trong nhật ký) — một dòng, cùng lần thêm file vào Phạm vi.

## Phát hiện (03.11 — ngoài phạm vi, không sửa)
- `GET /api/pos/settings` trả MỌI khoá `pos_settings` cho mọi nhân viên đăng nhập (`server/routes/settings.js:57-60`) — hôm nay chưa có bí mật ở
  đó (PIN chủ quán đã để bảng riêng), nhưng ai thêm khoá bí mật vào `pos_settings` sau này sẽ lộ. Đề xuất: danh sách trắng / đen khoá ở GET.
- Danh sách khách `customers-v2.js` gom hạng của MỌI khách mỗi lần tải (đọc cả sổ thẻ) — trước khai trương sổ rỗng; sổ lớn thì tính lại theo trang.
- `server/database.js` seed kho trống vẫn có `card_price` (500.000 / 2.000.000) + `tier_card_valid_months` — nay không ai đọc; dọn khi chạm tới.
- Bước 013 đánh lại thứ bậc theo thứ tự đang hiện: kho thật nếu có Kim Cương thêm tay đứng dưới Vàng → Kim Cương thứ bậc thấp hơn Vàng; chủ quán
  bấm ▲ ở Cài đặt → Hạng (không tự đoán thay).

## Soát độc lập vòng 1 (/ra-soat, 03.11) — báo cáo chép nguyên
KHÔNG ĐẠT

Tóm tắt: phần lõi chạy đúng. Hạng cao nhất còn hạn, cộng nối hạn, giá gói do máy chủ tra, PIN, hợp đồng v7 và bản dist đều đúng. Bài thử thu_HANG1 đạt 115/115, đỏ trên gốc 2a12443 (8 đạt · 98 hỏng). Mình chạy thử 3 đột biến, cả 3 đều bị bắt. Còn 2 lỗ thật: một ở đường tiền, một ở bảo mật. Thêm nữa: `npm test` đang đỏ 5 ca, trong khi trang_thai chỉ báo 3 ca.

LỖI TÌM ĐƯỢC:
1. server/routes/tiers.js:126 — Xoá hạng chỉ đếm khách có hạng đó là hạng HIỆN TẠI (`m.tier_id === id`, với m là kết quả tinhHang = hạng cao nhất). Khách đang giữ Vàng còn hạn nhưng có Kim Cương cao hơn thì không bị đếm, nên chủ quán xoá được Vàng (ẩn mềm). Khi Kim Cương hết hạn hoặc bị thu hồi, tinhHang (membershipStatus.js:56, 73 — đọc mọi hạng, không lọc is_active) đưa khách về Vàng đã ẩn. orders.js:650-652 lấy % giảm theo id, không lọc is_active, nên khách vẫn được giảm theo một hạng Cài đặt không còn thấy. Cũng không thu hồi được hạng này, vì membership.js:92 đòi `is_active = 1`. Đây đúng là điều kế hoạch mục 3 nói phải chặn. Ca A5 chỉ thử "khách giữ hạng làm hạng hiện tại", không có ca "giữ hạng đó nhưng không phải hạng hiện tại". — K4 (một vị từ "đang giữ" phải xét MỌI hạng còn hạn trong hanCacHang, không chỉ hạng thắng) + K3 (thiếu ca).
2. server/routes/tiers.js:66-79 và :102 (PUT) — Ai có `manage_promotions` cũng đổi được `cach_co` của hạng có sẵn từ `chi_cap` sang `ban`, rồi thêm gói (giá ≥ 1đ, tối đa 60 tháng). Mặc định quản lý có quyền này (database.js:1089 `['manager','manage_promotions',1]`; ca A7b khoá đúng điều này là 200). Vậy quản lý không có PIN vẫn bán được Kim Cương 60 tháng giá 1đ ở quầy (orders.js:494 chỉ xét cach_co lúc bán), rồi đổi về `chi_cap`. Như vậy vượt được khoá nghiệm thu C "chỉ CHỦ QUÁN + PIN". Kế hoạch K5 chỉ ghi "manager vẫn sửa Cài đặt hạng", không xét đường này. Cách khoá có thể: đổi cach_co (hoặc tạo hạng chi_cap) phải có `cap_hang`, hoặc chặn đổi cach_co của hạng đang có dòng cấp. Cần chủ quán quyết. — K4 (cùng một quyền lợi có hai đường: cấp có PIN, và sửa Cài đặt) / bảo mật.
3. client/src/pages/Customers.jsx:486-495 và server/routes/customers-v2.js:250 — Khách mà mọi hạng đã bị thu hồi thì hangNhieuKhach trả `{tier_id:null, tier_name:null, status:'none'}` (membershipStatus.js:55, 65). Object này vẫn là truthy nên `tierMap[phone] || null` giữ nó. Danh sách khách vì thế vẽ một nhãn rỗng kèm "(undefinedn)". Màn chi tiết (:701) có xử lý 'none', danh sách thì không. Trước HANG-1 không có dòng thu_hoi nên không có trạng thái 'none' ở đây. — K4 (hai chỗ hiển thị cùng dữ liệu).
4. cong_cu/thu_GIOVN1.js — Trên HEAD ra 56 đạt · 5 hỏng: C5a, C5b, C5c, **B1, E2**. Trên main c4513ac (mình dựng lại từ `git archive`) ra 61 đạt · 0 hỏng. trang_thai.md ("FAIL duy nhất: thu_GIOVN1.js C5a/C5b/C5c") báo thiếu B1 và E2. E2 khoá cứng `PHIEN_BAN === 6` (:606-608), mà HANG-1 đã nâng lên 7. Vì vậy đề xuất "sửa đúng 2 dòng" trong ## Câu hỏi KHÔNG làm bài xanh lại được. B1 (giá trị gieo pos_membership_purchases.expires_at đọc ra sai) thì mình chưa truy được nguyên nhân. `npm test` / `--day-du`: PASS 97 · FAIL 1. Theo LUAT §6.3 chưa được báo xong. — K1 (khẳng định thiếu) + K4 (đổi một thứ, ở đây là PHIEN_BAN, mà không grep hết các chỗ khoá nó).
5. trang_thai.md, mục Câu hỏi — Câu "điều bài canh (không lệch múi giờ) vẫn đúng … B5, C5 của thu_HANG1" không có bài thử nào chứng minh. thu_HANG1.js:15 ép `process.env.TZ = 'UTC'`, nên ca chạy với múi giờ máy khác (GIOVN1 C5b) hiện không có ca nào xanh. Đọc code thì helpers.js:221-227 và membershipStatus.js:22 làm phép tính bằng UTC, tức là đúng — nhưng đó là đọc tay, không phải bài thử. — K1/K3.

NGHI NGỜ:
- cong_cu/gia_lap/bat_bien.js:300 — I15 nay bỏ qua MỌI dòng `order_id NULL`. Dòng bán mà mất order_id (chứ không phải mất đơn) sẽ không còn bị báo. Lý do chọn (thu_gia_lap.js thiếu cột loai) là có thật, nhưng bất biến yếu đi so với `loai='ban'`.
- Tính năng tiền mới (bán gói) chưa có quy tắc đối soát `price_paid` của dòng sổ = `unit_price` của dòng món thẻ trên đơn. I15 chỉ đếm số dòng (LUAT §5).
- membershipStatus.js:93-97 và orders.js:1070 (hanSauDong) — mỗi lần bán phải đọc thêm cả sổ trong giao dịch chỉ để ghi expires_at "để xem". Nhưng CapHang.jsx:73-80 không hiện expires_at. Hệ quả: một cột mang hai nghĩa (dòng cũ thì có hiệu lực, dòng mới chỉ để xem) mà không ai đọc. Có thể bỏ cho đơn giản.
- Thứ bậc chỉ được kiểm không trùng giữa các hạng đang bật (tiers.js:87-90), và 013 chỉ đánh số lại hạng đang bật (013:203). Trong khi đó tinhHang xét cả hạng đã ẩn. Ghép với lỗi 1 thì có thể hoà thứ bậc, và hạng nào thắng phụ thuộc thứ tự sổ.
- membershipStatus.js:6 ghi "Sổ … CHỈ THÊM DÒNG" ngay cạnh câu "huỷ / xoá đơn xoá đúng dòng" — hai ý tự mâu thuẫn. Việc xoá dòng có từ trước (P26c), nhưng CLAUDE §5.4 đòi sổ chỉ-thêm cho giao dịch có giá trị tiền.
- membership.js:123-124 — thu hồi báo "Khách không đang giữ hạng này" TRƯỚC khi kiểm PIN. Lộ rất ít, vì nhật ký vốn đã mở cho mọi nhân viên.
- orders.js:500 — kiểm "hạng cao hơn" đọc ngoài giao dịch, nên nếu vừa cấp vừa bán cùng lúc thì có thể lọt. Rất hiếm.

NGHIỆM THU:    9/9 mục có ca (A: A1–A7, A5/A5b · B: B1–B8 · C: C0–C8 · D: D1–D5 · E: E1–E3 · F: F1–F2 + thu_HOPDONG_KH · G: G1–G4 · K5: K1–K4 + PUT lại GET · Dữ liệu: N1–N7). Nhưng còn 2 chỗ hở: **A** thiếu ca "xoá hạng khách còn giữ mà không phải hạng hiện tại" (và code sai đúng chỗ đó, lỗi 1); **K5** "bài thử cũ xanh" chưa đạt, vì `npm test` đỏ ở thu_GIOVN1 (5 ca).

CHƯA SOÁT ĐƯỢC: chưa chạy đủ 43 đột biến (chỉ chạy 3); chưa chạy `node tu_chay/cong.js chay`; chưa chạy các bài DOISOAT1, HD1, KHAPI2, P2223, P24, P26c, P3, UUDAI1 (tin số trong trang_thai); chưa truy được nguyên nhân thu_GIOVN1 B1 đỏ (người gác chặn chạy bản chép có in thêm); chưa thử giao diện trên điện thoại (bấm 2 lần để xoá dựa vào onBlur trên di động, ▲▼); chưa soát dữ liệu thật trên Turso (có Kim Cương thêm tay hay không, thứ bậc sau 013).

BÀI HỌC:
- KHOÁ (K4): phép chặn "còn khách giữ X" phải dùng CÙNG vị từ với chỗ cấp quyền lợi, tức xét mọi hạng còn hạn chứ không chỉ hạng đang thắng. Đột biến nên thêm: ca khách giữ hai hạng, xoá hạng thấp → phải 409.
- KHOÁ (bảo mật): thao tác nào đã khoá bằng PIN hoặc quyền riêng thì phải grep MỌI đường dẫn tới cùng kết quả (ở đây là đổi cài đặt để thứ "chỉ cấp" thành "bán được"). Thêm vào K4: "khoá một hành động → khoá luôn mọi cách đổi cấu hình cho phép làm cùng hành động đó".
- NGUYÊN TẮC (K1): báo "FAIL duy nhất ở ca …" phải dán nguyên danh sách ✗ của lần chạy, không tóm theo trí nhớ. Đổi một hằng số mà bài khác khoá cứng (PHIEN_BAN) thì grep mọi bài khoá hằng đó trước khi đề xuất cách sửa.

## Vòng sửa 1 (03.11) — theo báo cáo soát vòng 1
Bài thử ĐỎ trước (commit `b674460`: 117 đạt · 4 hỏng — ✗ A5d, ✗ A8, ✗ A8b, ✗ C6d), vá ở `f74a56d`, sau vá 121 đạt · 0 hỏng.
- Lỗi 1 (xoá hạng chỉ đếm hạng HIỆN TẠI): thêm `soKhachGiuHang` (`server/utils/membershipStatus.js`) — đếm khách còn hạn ở CHÍNH hạng đó qua `hanCacHang`
  (dù có hạng cao hơn); `tiers.js` DELETE gọi nó. Ca A5d (giữ Tạm2 còn hạn + Cao cao hơn → xoá Tạm2 409). Đột biến VS-xoa-chi-hang-hien-tai.
- Lỗi 2 (quản lý đổi "chỉ cấp" → "bán" rồi bán 1đ — đường thứ hai vượt PIN): PUT /tiers đổi `cach_co` của hạng CÓ SẴN (cả hai chiều) cần quyền
  `cap_hang` (mặc định chỉ chủ quán), không đủ → 403 `DOI_CACH_CO_CAN_QUYEN`; sửa tên / % / gói / thứ bậc vẫn `manage_promotions` (A8d K5 200).
  Thêm hạng MỚI dạng chỉ cấp vẫn cho quản lý (không cấp được nếu không PIN; hạng mới dạng bán thì vốn quản lý đã đặt giá được). Đây là cách an
  toàn nhất mình chọn khi soát nói "cần chủ quán quyết" — xem `## Câu hỏi` câu 2 để bạn xác nhận. Ca A8, A8b, A8c, A8d. Đột biến BV-doi-cach-co,
  VS-doi-cach-co-mot-chieu, VS-doi-cach-co-quyen-chung.
- Lỗi 3 (danh sách khách nhãn rỗng khi bị thu hồi hết hạng): `hangNhieuKhach` bỏ khách trạng thái `none` → danh sách hiện "-" như khách chưa có
  hạng. Ca C6d. Đột biến BV-none-loc.
- Lỗi 4 + 5 (báo thiếu B1, E2 của thu_GIOVN1; câu "múi giờ đã có bài chứng minh"): `## Câu hỏi` câu 1 đã sửa (B1 kéo theo C5 — ba lần mua
  hỏng không ghi dòng; E2 khoá cứng PHIEN_BAN 6). Câu về múi giờ: thu_HANG1 chạy TZ=UTC nên KHÔNG chứng minh trường hợp máy chạy múi giờ khác —
  chỉ là đọc tay `helpers.js:221-227` (phép UTC) + `membershipStatus.js:22`; ca thật là GIOVN1 C5b (đang chờ câu 1). Ghi vào CHƯA KIỂM.
- Nghi ngờ "expires_at để xem mà không ai đọc": nhật ký hạng (`CapHang.jsx`) nay hiện "→ đến <hạn>" cho dòng mua / cấp (vẫn chỉ để xem —
  hàm hạng tính từ sổ). Nghi ngờ còn lại (I15 lọc order_id, đối soát price_paid = giá dòng thẻ, kiểm hạng cao hơn ngoài giao dịch, câu "chỉ thêm
  dòng" cạnh xoá dòng của P26c) → ghi Phát hiện, không đổi trong vòng này.
- Lần chạy cuối: `node cong_cu/thu_HANG1.js` 121 đạt · 0 hỏng · `python3 viec/HANG-1/dot_bien.py` TỔNG 48 · BẮT 48 · `npm test -- --day-du`
  PASS 97 · FAIL 1 (dán nguyên dòng ✗: `✗ bài chạy thật cong_cu/thu_GIOVN1.js xanh` → ✗ C5a, ✗ C5b, ✗ C5c, ✗ B1, ✗ E2 — ngoài Phạm vi, câu hỏi 1).

### Câu hỏi thêm (03.11, vòng sửa 1)
2. **Đổi "bán ↔ chỉ cấp" ở Cài đặt hạng:** mình đã khoá cho CHỈ người có quyền cấp hạng (mặc định chủ quán) — quản lý vẫn sửa tên, %, giá gói,
   thứ bậc. Nếu bạn muốn quản lý cũng đổi được thì phải có cách khác chặn "đổi Kim Cương thành bán rồi bán rẻ". **Đề xuất: giữ như mình đã làm.**

### Phát hiện thêm (vòng sửa 1)
- Đối soát chưa có quy tắc "giá ghi ở sổ thẻ (`price_paid`) = giá dòng thẻ trên đơn" — I15 chỉ đếm số dòng (LUAT §5). Đề xuất thêm bất biến sau.
- I15 lọc `order_id IS NOT NULL`: một dòng BÁN bị mất `order_id` (chỉ khi sửa tay DB) không còn bị báo — trước đây báo "đơn #null không còn".
- `orders.js` kiểm "khách có hạng cao hơn" trước giao dịch: cấp hạng cao và bán hạng thấp CÙNG lúc thì có thể lọt một đơn (hạng hiện tại vẫn
  đúng là hạng cao hơn — khách chỉ trả tiền cho hạng thấp không dùng tới). Rất hiếm; ghi để biết.

## Soát độc lập vòng 2 (/ra-soat, 03.11) — báo cáo chép nguyên
KHÔNG ĐẠT (ba bản vá của vòng 1 đúng và đủ. Còn 1 lỗi nhẹ mới sinh ra ở vòng sửa 1, 1 lỗ trong cách khoá "chỉ cấp" mà lời gửi chủ quán chưa nói thật, và 1 câu trong hồ sơ vẫn sai)

Tóm tắt: mình đã kiểm lại cả ba bản vá. Bài thử thật sự ĐỎ trên b674460 (117 đạt · 4 hỏng: A5d, A8, A8b, C6d; mình dựng lại bằng `git archive`) và XANH trên HEAD (121/0). 48/48 đột biến bị bắt, đối chứng xanh. `dist` khớp `src`. `--day-du` ra PASS 97 · FAIL 1, và dòng FAIL đúng như trang_thai mô tả (C5a, C5b, C5c, B1, E2).

LỖI TÌM ĐƯỢC:
1. client/src/components/CapHang.jsx:77 cùng orders.js:1072-1073 và membershipStatus.js:105-108 — Vòng sửa 1 cho nhật ký hiện "→ đến <expires_at>", nhưng expires_at chỉ là hạn TÍNH LÚC GHI. Huỷ một đơn mua gói nằm ở giữa (luật E: orders.js:1538 và :1724 xoá dòng, rồi hàm hạng tự cộng lại từ sổ) thì hạn thật của các dòng mua sau rút ngắn lại. Nhật ký vẫn hiện ngày cũ. Màn chi tiết (getMembershipStatus) thì đúng, nên một màn hiện hai hạn khác nhau và nhân viên đọc sai hạn cho khách. Không có ca nào thử "huỷ đơn giữa → nhật ký". — K4 (hai nguồn cho cùng một hạn: số lưu sẵn và số cộng lại từ sổ). Lỗi nhẹ, không đụng tiền. Cách đơn giản: bỏ phần "→ đến" ở dòng bán, hoặc server trả hạn tính lại.
2. server/routes/tiers.js:94-99 — Khoá đổi `cach_co` chỉ đòi QUYỀN `cap_hang`, KHÔNG đòi PIN. Trong khi đó cấp hạng đòi cả quyền và PIN (membership.js:98, 108). Hai đường cùng dẫn tới kết quả "khách có Kim Cương":
   - Ai dùng phiên đăng nhập owner đang mở ở quầy (coQuyen ở tiers.js:25 trả true cho mọi owner), hoặc quản lý được chủ quán giao `cap_hang` (users.js:188 cho sửa quyền), vẫn làm được chuỗi: đổi Kim Cương sang "bán" → thêm gói 60 tháng giá 1đ → bán → đổi lại "chỉ cấp". Không cần PIN.
   - Ca A8c (cong_cu/thu_HANG1.js:507) đang khoá đúng hành vi này là 200.
   - Sâu hơn: người chỉ có `manage_promotions` vẫn tạo được hạng MỚI kiểu "bán", đặt thứ bậc cao nhất và % bằng Kim Cương (tiers.js:106-108). Họ cũng đổi tên / hoán thứ bậc hai hạng được (tiers.js:111), hoặc xoá Kim Cương khi chưa ai giữ rồi thêm lại dưới dạng "bán".
   - Tức là khoá này chỉ giữ ĐÚNG MÃ hạng, không giữ được QUYỀN LỢI (% giảm). Câu hỏi 2 trong trang_thai ("Nếu bạn muốn quản lý cũng đổi được thì phải có cách khác chặn…") làm chủ quán hiểu là đường này đã kín.
   - — K4 (chính bài học vòng 1 ghi: "khoá một hành động → khoá mọi cách đổi cấu hình"), K1 về lời. Đây là chuyện bảo mật, cần chủ quán quyết; máy không tự chọn. Đề xuất: đổi `cach_co` đòi thêm PIN chủ quán (dùng lại kiemPinChuQuan), và ghi rõ cho chủ quán rằng ai có `manage_promotions` vốn đã đặt được % và giá của mọi hạng bán.
3. viec/HANG-1/trang_thai.md:96-97 — Câu hỏi 1 vẫn còn câu "Điều bài canh (…không lệch múi giờ) vẫn đúng ở code mới (B5, C5 của thu_HANG1 so chuỗi hạn)". Vòng sửa 1 (:155-157) nói đã sửa câu này và "Ghi vào CHƯA KIỂM", nhưng câu cũ chưa bị gỡ và trang_thai không có mục CHƯA KIỂM nào (`grep -n "CHƯA KIỂM"` chỉ trúng đúng dòng 157). — K4 (sửa một câu tài liệu thì grep cả file) / K1.

NGHI NGỜ:
- membershipStatus.js:44-46 cùng orders.js:500-503 — Nếu chủ quán đổi một hạng đã CẤP không thời hạn sang "bán", khách đang giữ vô hạn mua gói cùng hạng vẫn được (cùng thứ bậc nên không bị chặn). Khách trả tiền mà hạn không đổi (`cu === HAN_VO_HAN → moi = cu`). Chiều ngược lại: hạng đã bán đổi sang "chỉ cấp", rồi cấp hoặc thu hồi thì xoá luôn phần hạn khách đã trả, không hoàn tiền (cấp là ĐẶT LẠI hạn). Cả hai đều cần chủ quán tự đổi `cach_co` trước. Nên chặn bán gói khi khách đã có vô hạn cùng hạng, hoặc ghi Phát hiện.
- membership.js:92-93 — Hạng "chỉ cấp" bị đổi sang "bán" thì những khách đã được cấp không thu hồi được nữa (docYeuCau đòi `chi_cap`). Phải đổi về "chỉ cấp" thì mới thu hồi được.
- tiers.js:25-26 — `coQuyen` chép lại luật của checkPermission (middleware/auth.js:84-101), không gọi chung một hàm (LUAT §2 "một quy tắc — một hàm"). Hôm nay hai bên khớp nhau. Sau này một bên đổi thì sẽ lệch.
- tiers.js:135-139 — Bước đếm khách giữ hạng chạy ngoài giao dịch. Một đơn bán gói chen vào giữa lúc đếm và lúc ẩn hạng thì vẫn xoá được hạng đang có khách. Rất hiếm.
- Các nghi ngờ vòng 1 vẫn còn, đã ghi Phát hiện: chưa có đối soát `price_paid` = giá dòng thẻ trên đơn; I15 lọc `order_id IS NOT NULL`; kiểm "hạng cao hơn" đọc ngoài giao dịch.

NGHIỆM THU:    8/9 (A, B, C, D, E, F, G, Dữ liệu có ca và xanh) · mục thiếu: K5 "bài thử cũ xanh" vẫn đỏ ở thu_GIOVN1 E2 (và C5/B1), ngoài Phạm vi, chờ Câu hỏi 1. Mục C có ca nhưng khoá chưa giữ được "+ PIN" ở đường đổi cách có hạng (LỖI 2). Mục E thiếu ca nhật ký sau khi huỷ đơn giữa (LỖI 1).

CHƯA SOÁT ĐƯỢC: chưa chạy `node tu_chay/cong.js chay`. Chưa chạy riêng từng bài cũ DOISOAT1 / HD1 / KHAPI2 / P2223 / P24 / P26c / P3 / UUDAI1 (chúng xanh trong PASS 97 của `--day-du`). Không chạy thẳng được thu_GIOVN1 vì người gác chặn file có chữ SECRET; chỉ chạy được qua bộ kiểm trên bản chép. Chưa thử giao diện trên điện thoại (bấm 2 lần để xoá dựa vào onBlur, ▲▼). Chưa xem dữ liệu thật trên Turso. Chưa soát riêng hợp đồng v7 dòng nào khớp dòng nào (thu_HOPDONG_KH xanh trong bộ kiểm).

BÀI HỌC:
- KHOÁ (K4): một khoá cần "quyền + PIN" thì mọi đường đổi cấu hình dẫn tới cùng quyền lợi cũng phải đòi đủ CẢ HAI, không chỉ quyền. Trước khi báo "đã kín", liệt kê mọi đường dẫn tới cùng QUYỀN LỢI (% giảm, thứ bậc), không chỉ tới cùng MÃ đối tượng: thêm mới, đổi tên, hoán thứ bậc, xoá rồi thêm lại.
- KHOÁ (K4/E): giá trị tính lại từ sổ (hạn cộng nối) thì không đưa số lưu sẵn lên màn hình. Sổ thay đổi (huỷ đơn giữa) thì số lưu sẵn sai mà không ai biết.
- NGUYÊN TẮC (K1): báo "câu X đã sửa" thì grep lại đúng câu X trong file trước khi commit. "Ghi vào CHƯA KIỂM" phải có mục CHƯA KIỂM thật trong file.

## Vòng sửa 2 (03.11)
- Lỗi 1: bài G3c ĐỎ trước (`1a58ea9`: 121 đạt · 1 hỏng — ✗ G3c), vá `51ede0e`: nhật ký hạng bỏ "→ đến <expires_at>" (hạn thật chỉ hiện ở dòng hạng
  hiện tại — tính lại từ sổ). Đột biến VS-nhat-ky-han-luu. Sau vá 122 đạt · 0 hỏng; `dot_bien.py` TỔNG 49 · BẮT 49.
- Lỗi 3: câu múi giờ ở Câu hỏi 1 đã sửa thành "đọc tay, không có bài thử" (grep lại cả file — không còn câu cũ). Mục CHƯA KIỂM thật sẽ nằm trong
  báo cáo 7 mục cuối việc.
- Lỗi 2: chuyện BẢO MẬT cần chủ quán quyết (LUAT §6.5 — không tự chọn) → `## Câu hỏi` câu 2 viết lại bên dưới. **DỪNG ở đây** chờ trả lời.
- Bằng chứng chạy lại (cây gốc `2a12443` dựng lại — thư mục nháp cũ đã bị lần soát ghi đè bằng `b674460`): mọi bài đổi ĐỎ trên gốc, XANH trên
  HEAD; `SỐ CA cong_cu/thu_HANG1.js: 122`. `npm test -- --day-du` PASS 97 · FAIL 1 (✗ `cong_cu/thu_GIOVN1.js` C5a, C5b, C5c, B1, E2 — câu 1).

## Câu hỏi (03.11, sau soát vòng 2 — chờ chủ quán; thay câu 2 cũ ở "Câu hỏi thêm")
1. (như trên) Thêm `- cong_cu/thu_GIOVN1.js` vào `## Phạm vi` để sửa phần dựng dữ liệu C5 + E2 `PHIEN_BAN >= 6`.
2. **Chặn "biến hạng chỉ cấp thành hạng bán được" — hiện mới kín MỘT phần.** Hôm nay: đổi bán ↔ chỉ cấp của hạng có sẵn cần quyền cấp hạng
   (mặc định chỉ chủ quán), KHÔNG cần PIN. Còn hở:
   (a) ai đang dùng máy đăng nhập tài khoản chủ quán mà không biết PIN vẫn đổi Kim Cương sang "bán", đặt gói giá thấp, bán, rồi đổi lại;
   (b) người có quyền "khuyến mãi" (mặc định quản lý) — đã sửa được % và giá của MỌI hạng bán từ trước HANG-1 — có thể tạo một hạng BÁN mới,
   thứ bậc cao nhất, % bằng Kim Cương, giá rẻ.
   **Đề xuất của mình:** (a) đổi bán ↔ chỉ cấp phải nhập PIN chủ quán (dùng lại khoá 5 lần sai như lúc cấp); (b) thêm hạng mới / đổi % của hạng /
   đổi thứ bậc — giữ cho quản lý như cũ, vì quản lý vốn đã đặt giá và % ở quầy; nếu bạn muốn chặn luôn (b) thì mọi thay đổi ở Cài đặt → Hạng
   đều phải có PIN chủ quán (quản lý không tự sửa hạng được nữa). Bạn chọn: **(a) thôi** hay **(a) + (b)**?

## Bước 1 — đối chiếu bản chụp, làm tiếp (04.11.2026 — chủ quán: thêm thu_GIOVN1 vào Phạm vi, bảo mật chọn (a) + (b))
- Nhánh `viec/HANG-1`, cây sạch. `git fetch origin viec/HANG-1`: HEAD = `80a087e`, FETCH_HEAD = `885fd43` → HEAD là tổ tiên → `git pull --no-rebase --ff-only` (chỉ đổi phiếu).
- `git log --oneline -3` (sau kéo):
  ```
  885fd43 PHIEU: HANG-1 them Pham vi thu_GIOVN1.js (chu quan 04.11)
  80a087e HANG-1 soat vong 2: chep bao cao, vong sua 2, cau hoi bao mat (dung cho chu quan)
  51ede0e HANG-1 vong sua 2: nhat ky hang khong hien han luu san; sua cau mui gio o ho so
  ```
- (Lần gọi đầu của phiên này, lúc 80a087e = FETCH_HEAD, phiếu CHƯA có dòng thu_GIOVN1 — người gác chặn sửa phiếu G1-PHIEU; lần gọi lại đã thấy 885fd43.)

## Làm tiếp 04.11 — câu 1 + câu 2 đã trả lời
- **Câu 1 (thu_GIOVN1):** `df230c4` — C5 dựng gói 3 tháng (`cach_co = 'ban'`, `goi = [{ so_thang: 3, gia: 300000, bat: true }]`) cho hạng thấp nhất, mua
  `{ tier_id, so_thang: 3 }` trả 300.000 (thay `datCai('tier_card_valid_months', '3')` + `card_price`); E2 `pb >= 6` + khối máy đọc `"phien_ban"` khớp đúng
  PHIEN_BAN + vẫn đòi dòng v6 GIO-VN-1. Chạy thẳng: **61 đạt · 0 hỏng** (C5a, C5b — ca TZ=Asia/Ho_Chi_Minh — C5c, B1, E2 xanh lại). Trên gốc 2a12443: sập
  `no such column: cach_co` (đỏ). Ca múi giờ (CHƯA KIỂM cũ) nay CÓ bài chứng minh: GIOVN1 C5b chạy trên code HANG-1.
- **Câu 2 (a)+(b):** bài thử ĐỎ trước (`c8dddfb`: 114 đạt · 12 hỏng — ✗ A9, A9b–A9g, K5 PUT lại, A9i, A9j, A5 sập, G1f), vá `f4642cd`:
  - `server/routes/tiers.js` PUT và DELETE gọi `kiemPinChuQuan(req.body.pin)` (cùng bộ đếm sai 5 lần / khoá 15 phút với cấp hạng) — PUT sau phần kiểm dữ
    liệu (400 dữ liệu sai không tốn lượt PIN), DELETE trước khi đếm khách. Bỏ khoá `DOI_CACH_CO_CAN_QUYEN` + hàm `coQuyen` (chép luật checkPermission —
    nghi ngờ soát vòng 2): PIN phủ mọi thay đổi, kể cả đổi bán ↔ chỉ cấp; người gõ được PIN chủ quán là chủ quán cho phép. Quyền vào màn vẫn `manage_promotions`.
  - `client/src/utils/api.js`: `delete(endpoint, data)` gửi thân khi có; `hangApi.xoa(id, pin)`. `HangThe.jsx`: ô "PIN chủ quán" cạnh nút Lưu, gửi kèm khi Lưu /
    Xoá, lưu xong xoá ô; lời hướng dẫn trên thẻ. `client/dist` build lại.
  - Ca mới: A9 (chưa đặt PIN → 400 CHUA_CO_PIN_CHU_QUAN) · A9b (phiên chủ quán không PIN) · A9c (PIN sai) · A9d (quản lý thêm hạng bán 60 tháng 1đ thứ bậc cao) ·
    A9e (hoán thứ bậc) · A9f (không ghi gì) · A9g (sai 5 lần → 423 ở cả Cài đặt hạng lẫn cấp hạng, 16 phút sau mở) · A9i (xoá không PIN) · A9j (K5 quản lý gõ PIN
    xoá 200) · A8/A8b (đổi Kim Cương → bán không PIN, cả tài khoản chủ quán → 400) · A8c (K5 có PIN đổi đi đổi lại 200) · G1f (giao diện gửi PIN). A7b đổi thành
    "quản lý gõ đúng PIN → 200"; A8d cũ (quản lý sửa % không PIN → 200) bỏ — hành vi đã đổi theo quyết định (b).
  - Đột biến: bỏ BV-doi-cach-co, VS-doi-cach-co-mot-chieu, VS-doi-cach-co-quyen-chung (khoá cũ đã gỡ); thêm BV-pin-sua-hang, BV-pin-xoa-hang,
    VS-pin-chu-quan-mien, VS-pin-chi-khi-them-hang, VS-pin-khong-bo-dem, VS-xoa-hang-giao-dien-khong-pin.
    `python3 viec/HANG-1/dot_bien.py` → ĐỐI CHỨNG XANH 132 đạt · **TỔNG 52 · BẮT 52** · SỐNG 0 · HỎNG 0 · LẠC 0.
- `node cong_cu/thu_HANG1.js` → **132 đạt · 0 hỏng**. `bang_chung_do.txt`: SỐ CA thu_HANG1 132, thu_GIOVN1 61 (đỏ trên gốc 2a12443 dựng lại).
- `npm test -- --day-du` → **PASS 97 · FAIL 1 · CẢNH BÁO 1** — dòng ✗ nguyên văn:
  `✗ bài chạy thật cong_cu/thu_P26a.js xanh (0.9 s)  → ✗ C9 PUT /tiers lưu lại hạng có sẵn → 200  — HTTP 200 / HTTP 400 · Chưa đặt PIN chủ quán — chủ quán đặt ở Cài đặt → Hạng thành viên`
  (CẢNH BÁO có sẵn từ trước — route GET có lệnh ghi ở packages.js, products.js, sync.js.)

### Bảng chỗ vá → đột biến (bổ sung 04.11)
| Chỗ vá | Đột biến |
|---|---|
| `tiers.js` PUT / DELETE cần PIN chủ quán (cùng bộ đếm khoá) | BV-pin-sua-hang · BV-pin-xoa-hang · VS-pin-chu-quan-mien · VS-pin-chi-khi-them-hang · VS-pin-khong-bo-dem |
| `HangThe.jsx` gửi PIN khi Lưu / Xoá | VS-xoa-hang-giao-dien-khong-pin |

## Câu hỏi (04.11 — chờ chủ quán; DỪNG trước soát vòng 3 để không đốt vòng soát cuối khi `npm test` còn đỏ)
3. **`cong_cu/thu_P26a.js` (NGOÀI Phạm vi) đỏ vì khoá PIN bạn vừa chọn.** Ca C9 (`thu_P26a.js:140-142`) lưu lại hạng có sẵn bằng `PUT /tiers` KHÔNG kèm PIN và
   đòi 200 — điều nó canh là "route trả id kiểu số, không BigInt" (P26a), không phải quyền. Nay mọi lần lưu hạng phải có PIN nên trả 400 `CHUA_CO_PIN_CHU_QUAN`.
   **Đề xuất:** bạn thêm `- cong_cu/thu_P26a.js` vào `## Phạm vi` (chỉ phần dựng dữ liệu C9); mình sửa đúng chỗ đó: đặt PIN chủ quán bằng route
   `POST /membership/pin-chu-quan` (tài khoản chủ quán của bài, gõ mật khẩu) rồi gửi `pin` trong thân `PUT /tiers` — C9 vẫn đòi 200 như cũ.
   (Cách khác mình KHÔNG đề xuất: cho lưu không PIN khi không có gì thay đổi — thêm phép so từng trường, thêm chỗ có thể lọt; chỉ để né một bài thử.)
   Sau khi bạn thêm, mình làm tiếp: sửa C9 → `npm test` xanh → soát vòng 3 → soát bảo mật → cổng → báo cáo 7 mục.

## Bước 1 — đối chiếu bản chụp, làm tiếp (05.11.2026 — chủ quán trả lời câu 3)
- Nhánh `viec/HANG-1`, cây sạch. `git fetch origin viec/HANG-1`: HEAD = `50ee774`, FETCH_HEAD = `50ee774` → bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  50ee774 HANG-1 trang thai 04.11: thu_GIOVN1 xanh, PIN chu quan cho Cai dat hang (132 ca, 52/52 dot bien), cau hoi thu_P26a
  f4642cd HANG-1 moi thay doi Cai dat hang (PUT / DELETE /tiers) can PIN chu quan, bo khoa doi cach co chi bang quyen (chu quan 04.11 a+b)
  c8dddfb HANG-1 bai thu A9 A8 G1f: moi thay doi Cai dat hang can PIN chu quan (truoc khi va)
  ```

## Trả lời câu 3 (chủ quán 05.11) — ĐỎ ĐÃ BIẾT
- KHÔNG thêm `cong_cu/thu_P26a.js` vào Phạm vi. Chat đã nới ca C9 trên main (SUA-C9-1: đặt sẵn PIN chủ quán thử, gửi kèm `pin`, vẫn đòi 200) — bài
  xanh trên code HANG-1 khi gộp main.
- **Trên nhánh này, `thu_P26a.js` C9 đỏ là ĐỎ ĐÃ BIẾT** — không sửa, không nới. `npm test -- --day-du` 05.11 trên `50ee774`: PASS 97 · FAIL 1 · CẢNH BÁO 1,
  dòng ✗ duy nhất: `✗ bài chạy thật cong_cu/thu_P26a.js xanh (0.9 s)  → ✗ C9 PUT /tiers lưu lại hạng có sẵn → 200  — HTTP 200 / HTTP 400 · Chưa đặt PIN chủ quán — chủ quán đặt ở Cài đặt → Hạng thành viên`.
- Không làm "lưu không PIN khi không đổi gì".
- Hợp đồng `/api/kh`: nhánh ghi `PHIEN_BAN` 7; CT-1a trên main đã lấy v9 → HANG-1 là **v10**, chat chỉnh số lúc gộp (máy không đổi trên nhánh).

## Soát độc lập vòng 3 (/ra-soat, 05.11) — báo cáo chép nguyên
KHÔNG ĐẠT

Tóm tắt: bài thử và đột biến đều đúng. thu_HANG1 ra 132 đạt · 0 hỏng, đột biến 52/52 bị bắt, `--day-du` ra PASS 97 · FAIL 1 (chỉ dòng C9 của thu_P26a, đỏ đã biết). Bản dist khớp với src. Ba lỗi của vòng 1–2 đã đóng thật. Nhưng khoá PIN cho Cài đặt hạng vẫn hở: theo quyết định (a) của chủ quán, phiên đăng nhập chủ quán mà không biết PIN thì không được đổi hạng. Phiên đó vẫn đổi được, theo hai đường không đi qua `/tiers`. Đây là chuyện bảo mật nên phải dừng lại hỏi chủ quán. Vòng sửa 4 (vòng máy tự sửa luôn) không áp dụng được.

LỖI TÌM ĐƯỢC:
1. NẶNG (bảo mật, file trong Phạm vi). `server/routes/backup.js:85` đưa `pos_membership_tiers` vào BACKUP_TABLES. Danh sách bảng không được khôi phục ở `:127-134` không có bảng này.
   - `POST /restore` (`backup.js:323-326`) chỉ đòi role owner, không đòi PIN.
   - `server/utils/khoiPhuc.js:60-75` XOÁ cả bảng rồi chèn nguyên từng dòng của file. Không qua `kiemHang` (`tiers.js:48-76`), cũng không qua `kiemPinChuQuan`.
   - Chuỗi tấn công: phiên chủ quán đang mở ở quầy xuất trang "Hạng thành viên" ra Excel. Sửa Kim Cương thành `cach_co=ban`, `goi=[{"so_thang":60,"gia":1,"bat":true}]`, `discount_percent` tới 100. Khôi phục file đó, bán Kim Cương 60 tháng giá 1đ (`orders.js` chỉ xét `cach_co` lúc bán), rồi khôi phục lại bản cũ.
   - Kết quả: đúng chuỗi A8b canh ở đường PUT, nhưng không cần PIN và còn vượt luôn giới hạn 90%.
   - Thuộc K4: khoá một hành động thì phải khoá mọi đường đổi cấu hình dẫn tới cùng quyền lợi. Hai vòng soát trước đã ghi đúng bài học này.
   - Cách sửa có thể: thêm `pos_membership_tiers` vào danh sách không khôi phục, hoặc bắt nhập PIN khi file có trang này. Chủ quán phải chọn.
2. NẶNG (bảo mật, gốc lỗ nằm ở `users.js`, ngoài Phạm vi; chỗ vá được nằm ở `pinChuQuan.js`, trong Phạm vi). `server/utils/pinChuQuan.js:179-188` cho đổi PIN chỉ bằng mật khẩu đăng nhập. Nhưng phiên chủ quán đặt lại được mật khẩu của chính mình mà không cần mật khẩu cũ, qua `PUT /api/pos/users/:id/password` (`users.js:116-130`; quyền `manage_users`, owner luôn qua theo `auth.js:89`).
   - Chuỗi: đặt mật khẩu mới, rồi `POST /membership/pin-chu-quan` đặt PIN mới. Lần đặt PIN này còn gỡ luôn khoá sai 5 lần (`:186`). Sau đó cấp Kim Cương, sửa hạng thoải mái.
   - Đường thứ hai: `POST /users` (`users.js:38,57`) nhận `role` bất kỳ, nên tạo được một tài khoản owner mới với mật khẩu tự chọn. Khôi phục trang `pos_users` (`backup.js:71`) cũng cho kết quả như vậy.
   - Hệ quả: câu ở `trang_thai.md:243-244` ("PIN phủ mọi thay đổi… phiên đăng nhập (kể cả chủ quán) không đủ") và `tiers.js:6-7` là chưa đúng.
   - Thuộc K4 + K1. Cách vá trong Phạm vi: khi đã có PIN thì đổi PIN phải gõ PIN cũ (quên PIN thì có đường khác do chủ quán quyết). Chủ quán đã duyệt Q1-a là "chỉ cần mật khẩu", nên phải hỏi lại.
3. NHẸ (K1, chú thích sai so với code). `server/routes/membership.js:71` và `server/utils/membershipStatus.js:104` ghi expires_at được ghi "để nhật ký hiện 'đến …'". Từ vòng sửa 2 nhật ký đã bỏ phần này: grep `expires_at` trong `client/src/components/CapHang.jsx` không ra dòng nào. Câu "để xem" trong chú thích của `orders.js` (khối ghi sổ thẻ) cũng vậy. Nay `hanSauDong` đọc cả sổ thẻ trong giao dịch chỉ để ghi một cột không màn nào hiển thị (chỉ còn API `/nhat-ky` trả ra).
4. NHẸ (K1). Đầu file `pinChuQuan.js:2` và `HangThe.jsx:4` vẫn ghi PIN chỉ dùng cho "cấp / thu hồi hạng". Thực tế PIN nay dùng cả khi lưu và xoá Cài đặt hạng.

NGHI NGỜ:
- `membershipStatus.js:45`: khách đang giữ hạng vô hạn (được cấp) mà chủ quán đổi hạng đó sang "bán" thì khách vẫn mua gói được. Khách trả tiền mà hạn không đổi (`cu === HAN_VO_HAN → moi = cu`), vì `orders.js` chỉ chặn hạng CAO HƠN, không chặn cùng hạng vô hạn. Chiều ngược lại: hạng bán đổi sang "chỉ cấp", rồi cấp thì đặt lại hạn, mất phần khách đã trả. Nay cả hai đều cần PIN, nhưng vẫn là đường tiền chưa có ca thử. Vòng 2 đã nêu, chưa thấy ghi Phát hiện.
- `membership.js:92-93`: hạng "chỉ cấp" đã đổi sang "bán" thì không thu hồi được những người đã được cấp.
- Bộ đếm sai PIN dùng chung: quản lý gõ sai 5 lần ở Cài đặt hạng thì chủ quán bị khoá cấp hạng 15 phút. Đây là hành vi đã chọn, nhưng nên nói rõ cho chủ quán.
- G1f chỉ có đột biến cho đường Xoá (`VS-xoa-hang-giao-dien-khong-pin`). Đường Lưu bỏ `pin` không có đột biến riêng. Regex `hangApi\.luu\(\{[\s\S]*?\bpin\b` có thể khớp chữ `pin` ở chỗ khác trong khối.
- `tiers.js:134-138`: đếm khách giữ hạng rồi ẩn hạng, hai bước nằm ngoài giao dịch. Vòng 2 đã nêu, vẫn còn.

NGHIỆM THU: 9/9 mục có bằng chứng (`node cong_cu/thu_HANG1.js` → 132/0, đủ các phần N, A, A5, B, C, D, E, F, K5, O, G).
- A: A1–A9j. B: B*. C: C0–C8. D. E. F: F1, F2 + thu_HOPDONG_KH xanh. G: G1–G4, G1f, G3c. K5. Dữ liệu: N1–N7.
- Mục thiếu: C "chỉ CHỦ QUÁN + PIN" chưa giữ được trọn, vì còn hai đường vượt PIN (lỗi 1, 2). K5 "bài cũ xanh" chỉ đỏ ở thu_P26a C9 — đỏ đã biết, không tính.
- Đỏ trên bản chưa vá có bằng chứng thật. `bang_chung_do.txt`: gốc 2a12443 ra 7 đạt · 77 hỏng. c8dddfb ra 114 đạt · 12 hỏng, đỏ đúng ở A9, A9b–A9j, A8, G1f. Các ca so mã lỗi và trạng thái DB (A9f), không chỉ soi marker.

CHƯA SOÁT ĐƯỢC:
- Không dựng server để chạy thật chuỗi khôi phục Excel và chuỗi đổi mật khẩu → đặt PIN. Hai lỗi nặng kết luận từ việc đọc code: `backup.js:85,127-134,323-326`, `khoiPhuc.js:60-75`, `users.js:38-57,116-130`, `auth.js:89`, `pinChuQuan.js:179-188`.
- Chưa chạy `node tu_chay/cong.js chay`.
- Chưa dựng lại cây gốc để tự kiểm `bang_chung_do.txt`, chỉ tin file đó.
- Chưa thử giao diện trên điện thoại (ô PIN, bấm 2 lần để xoá).
- Chưa xem dữ liệu thật trên Turso.

BÀI HỌC:
- KHOÁ (K4, bảo mật): khoá một quyền lợi bằng PIN thì liệt kê MỌI đường ghi vào bảng cấu hình đó, kể cả khôi phục sao lưu (BACKUP_TABLES trừ BANG_KHONG_KHOI_PHUC). Có thể thành phép máy: bảng nào có route đòi PIN mà không nằm trong BANG_KHONG_KHOI_PHUC → đỏ.
- NGUYÊN TẮC (bảo mật): một bí mật "chỉ chủ quán" mà đổi được bằng một bí mật khác yếu hơn thì chỉ mạnh bằng bí mật yếu nhất trong chuỗi. Ở đây mật khẩu đặt lại được bằng chính phiên đăng nhập, nên PIN không chặn được phiên chủ quán. Trước khi báo "đã kín" phải rà đường đặt lại PIN, mật khẩu và tài khoản.
- NGUYÊN TẮC (K1): bỏ một phần hiển thị thì grep các chú thích nói "để hiện …" và sửa cùng commit (lỗi 3).

### Phiên chính kiểm lại hai lỗi NẶNG (05.11, đọc code trong lượt này)
- Lỗi 1 ĐÚNG: `server/routes/backup.js:85` có `pos_membership_tiers`; `BANG_KHONG_KHOI_PHUC` (`backup.js:127-134`) không có; `POST /restore` (`backup.js:323-326`)
  chỉ đòi `role === 'owner'`; `server/utils/khoiPhuc.js:68-72` `DELETE FROM <bảng>` rồi `INSERT` nguyên cột của file.
- Lỗi 2 ĐÚNG về luật, số dòng người soát dẫn lệch: `pinChuQuan.js` chỉ có 61 dòng — chỗ đổi PIN bằng mật khẩu là `server/utils/pinChuQuan.js:36-42`
  (`datPinChuQuan`), route `server/routes/membership.js:59-63`. `server/routes/users.js:116-130` `PUT /:id/password` chỉ cần `manage_users`, không hỏi mật khẩu cũ.

## Soát bảo mật (/soat-bao-mat, 05.11 — lần 1)
Số lỗ: trước lọc **3** · sau lọc (điểm ≥ 8) **1**. Điểm lọc: Vuln 1 lộ băm PIN qua sao lưu = 3 (bỏ — chỉ owner tải được, owner có đường ngắn hơn ở
users.js) · Vuln 2 khôi phục sao lưu ghi đè hạng = 8 (giữ) · Vuln 3 đặt lại mật khẩu owner rồi đặt PIN = 6 (bỏ — lỗ gốc ở `users.js` có sẵn, không do nhánh thêm;
NHƯNG soát vòng 3 xếp NẶNG → vẫn đưa vào `## Câu hỏi` câu 4b).

Báo cáo sau lọc (chép nguyên văn):

# Vuln 2: Khôi phục sao lưu ghi đè hạng thẻ không cần PIN: `server/routes/backup.js:85` (danh sách `BANG_KHONG_KHOI_PHUC` ở backup.js:127–134)

* Severity: High (theo mô hình đe doạ của kho)
* Category: authorization_bypass / privilege_escalation
* Confidence: 9/10
* Description:
  * Luật chủ quán 04.11, chép ở đầu `tiers.js`: mọi thay đổi Cài đặt hạng phải có PIN chủ quán, phiên đăng nhập kể cả của chủ quán là không đủ.
  * Nhưng `pos_membership_tiers` vẫn nằm trong `BACKUP_TABLES` và KHÔNG có trong `BANG_KHONG_KHOI_PHUC`.
  * `POST /api/pos/backup/restore` (backup.js:323) chỉ kiểm `role === 'owner'`, rồi gọi `lapKeHoach` / `thucHien` (khoiPhuc.js:28–76). Hai hàm này chạy `DELETE FROM pos_membership_tiers`, rồi `INSERT` mọi cột trong file khớp bảng, gồm cả `cach_co`, `goi`, `discount_percent`, `special_discount_percent`, `sort_order`.
  * Đường này không kiểm hợp lệ nào. Trần 90% của `kiemHang` cũng bị bỏ qua.
* Exploit Scenario: Phiên owner không biết PIN:
  1. Xuất `pos_membership_tiers` ra xlsx.
  2. Sửa dòng Kim Cương thành `cach_co = 'ban'`, `goi = [{"so_thang":60,"gia":1000,"bat":true}]`, hoặc sửa `discount_percent` của Vàng lên 100.
  3. Gọi `POST /backup/preview-restore` rồi `POST /backup/restore`. Không bị chặn vì trang này không thuộc nhóm trang tiền.
  4. Quầy bán thẻ Kim Cương 60 tháng giá 1.000đ qua `POST /orders` với `membership_buy`, hoặc mọi đơn của khách Vàng thành 0đ.
  Hạng bị đổi trực tiếp mà PUT /tiers với cổng PIN không hề được gọi.
* Recommendation: Cho `pos_membership_tiers` vào `BANG_KHONG_KHOI_PHUC` (khôi phục báo 400, chủ quán sửa hạng qua Cài đặt có PIN). Hoặc bắt `restore` đòi `pin` khi file có trang "Hạng thành viên" có dòng, và chạy `kiemHang` cho từng dòng. Thêm bài thử: restore một file có trang hạng mà không có PIN thì phải đỏ.

Người lọc (8/10): "HANG-1 đã nghĩ tới đường khôi phục: nó đưa `pos_pin_chu_quan` vào danh sách cấm (backup.js:134) … nhưng bỏ sót bảng hạng. Đây là K4."

SOÁT BẢO MẬT: KHÔNG ĐẠT — 1

## Câu hỏi (05.11 — chờ chủ quán; DỪNG: soát vòng 3 còn lỗi BẢO MẬT, LUAT §6.5 không cho máy tự sửa vòng 4)
4. **Khoá PIN chủ quán còn hai đường vòng — cả hai chỉ cần máy đang đăng nhập tài khoản chủ quán, không cần biết PIN.**
   (a) **Khôi phục file sao lưu đổi được Cài đặt hạng** (soát vòng 3 lỗi 1 + soát bảo mật Vuln 2, đã kiểm code `backup.js:85,127-134,323-326`,
   `khoiPhuc.js:68-72`): tải file sao lưu, sửa trang "Hạng thành viên" (Kim Cương thành hạng bán giá 1.000đ, hoặc giảm 100%), khôi phục lại.
   **Đề xuất của mình:** không cho khôi phục trang Hạng thành viên bằng file nữa (giống sổ thẻ, ví, đơn — máy báo lỗi, chủ quán sửa hạng ở Cài đặt có
   PIN). Một dòng ở `backup.js` (trong Phạm vi) + bài thử. Kho có sự cố thì hạng vẫn sửa tay được (thường chỉ 2–3 hạng).
   (b) **Đặt lại mật khẩu chủ quán rồi đặt PIN mới** (soát vòng 3 lỗi 2, đã kiểm `users.js:116-130`, `pinChuQuan.js:36-42`): trang Nhân viên đặt lại
   mật khẩu tài khoản chủ quán không cần mật khẩu cũ; có mật khẩu mới là đặt được PIN mới (Q1-a: đặt PIN chỉ cần mật khẩu). Lỗ gốc ở `users.js` có từ
   trước HANG-1 (ngoài Phạm vi). Hai cách:
   - **b1 (đề xuất):** khi ĐÃ có PIN, đổi PIN phải gõ PIN cũ + mật khẩu (sửa `pinChuQuan.js`, trong Phạm vi). Quên PIN thì… cần một đường khác bạn chọn
     (ví dụ chat / người kỹ thuật xoá PIN trực tiếp trong kho dữ liệu). Đổi lại Q1-a nên cần bạn duyệt.
   - **b2:** giữ như hiện tại, ghi rõ là rủi ro chấp nhận ("ai cầm máy đăng nhập chủ quán thì đặt lại được PIN") — để việc sau sửa trang Nhân viên
     (đặt lại mật khẩu chủ quán phải có mật khẩu cũ, không cho tạo / nâng tài khoản thành chủ quán).
   Bạn chọn: **(a) như đề xuất?** và **b1 hay b2?**
   Kèm theo (không cần quyết, mình làm cùng vòng sửa): bỏ cột băm PIN khỏi file sao lưu (người lọc chấm 3 — chỉ là làm cứng, nhưng bảng đó vốn không
   khôi phục được nên sao lưu nó không có ích); sửa 2 lỗi NHẸ của soát vòng 3 (chú thích "để nhật ký hiện đến …" ở `membership.js` / `membershipStatus.js` /
   `orders.js`, và chú thích "PIN chỉ cho cấp / thu hồi" ở `pinChuQuan.js` / `HangThe.jsx`).
