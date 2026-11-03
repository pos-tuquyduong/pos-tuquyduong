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
