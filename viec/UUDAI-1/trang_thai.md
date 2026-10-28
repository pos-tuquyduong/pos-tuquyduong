# UUDAI-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (26.10.2026)
- Nhánh: `viec/UUDAI-1`; cây sạch; HEAD `8b436c0` · FETCH_HEAD `8b436c0` (bằng nhau → không kéo).
- `git log --oneline -3`:
  ```
  8b436c0 PHIEU: UUDAI-1
  40e07ce TIEN-DO: P3 (56e090d), BH-1 (9fd32af), DIEM-THAT-1 xong; mo UUDAI-1; them COMBO-1a, COMBO-1b + 4 viec nho; lich — so v41
  66605d1 Merge pull request #46 from pos-tuquyduong/viec/DIEM-THAT-1
  ```

## Bước 2–3 — đọc + kế hoạch
- Kế hoạch: `ke_hoach.md` (agent phụ chỉ đọc đã soát theo 4 câu — mục 8 của kế hoạch). Phiếu dặn **chờ duyệt kế hoạch** → DỪNG ở đây.
- Chưa sửa code, chưa viết bài thử.

## Câu hỏi
- (đã trả lời 27.10 — phiếu mục "Đã duyệt": Q1 = (a), Q2/Q3/min_order/làm tròn đồng ý.) Câu cũ giữ dưới để đối chiếu.
- **Q1 (CHẶN, đã trả lời):** màn Bán hàng đang chạy (`client/src/pages/Sales.jsx:586-610`, màn trang chủ mặc định — `BanHang/index.jsx:34`) tự tính
  tổng: giảm mã của `/discount-codes/validate` (trên subtotal GỐC) cộng giảm hạng. Máy chủ đổi công thức (mã % sau hạng; chế độ tắt chỉ
  lấy một) → tiền gửi lệch tổng → `orders.js:850` trả 400 "không khớp tổng". Ví dụ ở mặc định '1': Vàng 10% + mã 10%, 2 × 50.000 → màn
  gửi 80.000, máy chủ 81.000 → quầy không bán được. `Sales.jsx` ngoài Phạm vi. Chọn: **Q1-a** thêm `client/src/pages/Sales.jsx` vào Phạm vi
  (có mã → hỏi `POST /orders/tinh-thu` qua client `api` có sẵn, ~20 dòng; không mã → không đổi) — đề xuất; **Q1-b** chờ BH-2 thay màn cũ rồi
  mới gộp; **Q1-c** sửa nghiệm thu B. Chi tiết: `ke_hoach.md` mục 1.
- Q2–Q3 và mốc `min_order`, làm tròn: đã chọn phương án trong `ke_hoach.md` mục 2 (không chặn) — chủ quán sửa nếu khác ý.

## Làm tiếp (`tiep`, 27.10)
- Hook mở phiên đã kéo `e3cb1ce → f7165ea`. HEAD `f7165ea` · FETCH_HEAD `f7165ea` (bằng nhau). `git log --oneline -3`:
  ```
  f7165ea PHIEU: UUDAI-1 duyet ke hoach 27.10 (Q1-a Sales.jsx vao Pham vi goi tinh-thu khi co ma; Q2 Q3 dong y)
  e3cb1ce UUDAI-1: ke hoach (cho duyet) + trang thai; cau hoi chan Q1 Sales.jsx tinh tong theo cong thuc cu
  8b436c0 PHIEU: UUDAI-1
  ```

## Bước 4–6 — bài thử, vá, kiểm
- Bài thử `cong_cu/thu_UUDAI1.js` commit TRƯỚC khi vá (`0ef5967`); đỏ trên gốc — `bang_chung_do.txt` (gốc `f7165ea`: 21 đạt · 50 hỏng).
- Đổi bài sau lần đỏ đầu (đều chạy lại gốc ở `bang_chung_do.txt`): siết C2b / C5a / F2 (xanh suông khi đơn không tạo được — K3);
  A3 khoá đúng công thức mã (giảm riêng của khách giữ công thức cũ theo Q3 — K2); C5b đơn trả bằng ví (duyệt hoàn chỉ nhận đơn ví);
  S2 theo dạng thật của Sales.jsx; thêm A6 (làm tròn mã %), C8 (mã 1 món kiểu tiền theo khoá 1 món) để đột biến không sống.
- `ma_loi`: hai câu ("Mã không tồn tại hoặc đã tắt" / "Mã hết hạn, hết lượt hoặc đơn chưa đủ tối thiểu"). **Đính chính vòng sửa 4:** lần đầu bỏ
  `ma_loi_code`; vòng sửa 2 đã thêm lại đúng kế hoạch — tinh-thu nay trả `ma_loi` + `ma_loi_code` (`MA_KHONG_TON_TAI` / `MA_KHONG_AP_DUNG`),
  ca F6 / K2b khoá.
- `Sales.jsx`: `orderData` ghi rõ từng khoá lấy từ `don = donGuiMayChu()` (không spread) — để `thu_BH1.js` I10/I11 (đọc khoá orderData từ
  nguồn) giữ nguyên, không phải sửa bài cũ.
- `kiem_tra_truoc_khi_giao.js`: thêm MỘT dòng `chayBaiThat('cong_cu/thu_UUDAI1.js')` riêng — `thu_P3.js` đòi dòng danh sách kết thúc
  bằng `'cong_cu/thu_P3.js']`.
- `npm test`: PASS 73 · FAIL 0 · CẢNH BÁO 1 (route GET có lệnh ghi — packages.js / products.js / sync.js, có từ trước, không thuộc việc này).
  `npm test -- --day-du`: PASS 78 · FAIL 0 · CẢNH BÁO 1 (dist khớp src, giả lập quầy xanh).
- Ngân sách: máy chủ +138 / −38 dòng (uuDai.js 61, orders.js +67 −38, settings.js 6, database.js 4) — trong ~150. Giao diện 95 dòng
  (Settings.jsx 42, Sales.jsx +53 −24) — VƯỢT ~40 (+20 Sales) chừng 35 dòng: Sales.jsx phải chuyển thân đơn sang hàm chung
  `donGuiMayChu` (bỏ 24 dòng cũ) để tinh-thu và tạo đơn không hai bản. Thử ~450 dòng — VƯỢT ~300: 71 ca phủ đủ A–K5 + hai quầy + S.

### Chỗ vá → đột biến (`viec/UUDAI-1/dot_bien.py`, kết quả: TỔNG 23 · BẮT 23 · SỐNG 0 · HỎNG 0 · LẠC 0; đối chứng 71 đạt · 0 hỏng)
| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| `uuDai.js` mã tính trên phần còn lại sau hạng | `VS-MA-TREN-GOC` | B1 |
| `uuDai.js` bằng nhau giữ hạng | `VS-BANG-CHON-MA` | C3a |
| `uuDai.js` mã 1 món trên giá đã giảm hạng | `VS-MOT-MON-GIA-GOC` | B5 |
| `uuDai.js` chọn mã → không giá hạng từng món | `VS-CHON-MA-GIU-GIA-HANG` | C1b |
| `uuDai.js` không dùng chung → so hai cách | `VS-LUON-CA-HAI` | C1a |
| `uuDai.js` làm tròn mã % | `VS-MA-KHONG-LAM-TRON` | A6 |
| `orders.js` đọc cài đặt theo loại | `BV-CAI-DAT-DOC` · `VS-LOAI-MOT-MON-THEO-KIEU` | C1a · C8 |
| `orders.js` quà đổi điểm luôn dùng chung | `VS-QUA-THEO-CAI-DAT` | D1a |
| `orders.js` chọn hạng → không tiêu / không ghi mã / không giá mã trên bill | `VS-CHON-HANG-VAN-TIEU-MA` · `VS-CHON-HANG-VAN-GHI-MA` · `VS-CHON-HANG-GIU-GIA-MA-BILL` | C2b · C2a · C7b |
| `orders.js` tinh-thu: chỉ tính, không SX, lọc thân, báo mã sai | `BV-TINHTHU-CHI-TINH` · `VS-TINHTHU-GOI-SX` · `VS-TINHTHU-NHAN-TIEN` · `VS-MA-LOI-IM` | F1 · F3 · F1b · F6 |
| `settings.js` chỉ '0' / '1' | `BV-CAI-DAT-KIEM` · `VS-CAI-DAT-NHAN-TRUE` | E3 · E3 "true" |
| `database.js` seed | `BV-SEED` | E1 |
| `Settings.jsx` khối cài đặt | `BV-SETTINGS-QUA` | E5 |
| `Sales.jsx` số máy chủ / chặn thu / một thân | `BV-SALES-TONG` · `VS-SALES-THU-KHI-CHUA-TINH` · `VS-SALES-HAI-THAN` | S3 · S4 · S2 |

Tên đột biến (đủ 23): VS-MA-TREN-GOC, VS-BANG-CHON-MA, VS-MOT-MON-GIA-GOC, VS-CHON-MA-GIU-GIA-HANG, VS-LUON-CA-HAI, VS-MA-KHONG-LAM-TRON,
BV-CAI-DAT-DOC, VS-QUA-THEO-CAI-DAT, VS-LOAI-MOT-MON-THEO-KIEU, VS-CHON-HANG-VAN-TIEU-MA, VS-CHON-HANG-VAN-GHI-MA,
VS-CHON-HANG-GIU-GIA-MA-BILL, VS-TINHTHU-GOI-SX, BV-TINHTHU-CHI-TINH, VS-TINHTHU-NHAN-TIEN, VS-MA-LOI-IM, BV-CAI-DAT-KIEM,
VS-CAI-DAT-NHAN-TRUE, BV-SEED, BV-SETTINGS-QUA, BV-SALES-TONG, VS-SALES-THU-KHI-CHUA-TINH, VS-SALES-HAI-THAN.

## Câu hỏi vòng soát 3 (27.10) — ĐÃ TRẢ LỜI (phiếu mục 5–6: Q5 = (a) giữ như máy làm; Q4 không làm ở việc này — việc sau khai trương)
- **Q5 (đã trả lời (a) — không còn chặn) — `cach` khi mã gõ vào KHÔNG hợp lệ, khách có hạng.** Kế hoạch đã duyệt viết hai vế tự mâu thuẫn với khách Vàng:
  `ke_hoach.md:44-45` "KHÔNG bao giờ trả `cach: 'hang'` vì mã sai — mã sai → `cach` tính như không có mã, kèm `ma_loi`", và bảng ca thử
  `ke_hoach.md:111` "F6 mã sai → `ma_loi`, không `cach 'hang'`". Tính như không có mã thì khách Vàng tất yếu ra `cach 'hang'`
  (`server/utils/uuDai.js:40`). Máy đang làm và bài thử F6 (`cong_cu/thu_UUDAI1.js`, ca F6) khoá: **`cach: 'hang'` + `ma_loi` + `ma_loi_code`,
  `cau_ghi` rỗng** — giỏ phân biệt "mã sai" bằng `ma_loi`. Vòng 2 máy tự giải nghĩa câu này mà không hỏi — sai luật; nay hỏi lại. Chủ quán chọn:
  (a) giữ như máy đang làm (BH-2 đọc `ma_loi` trước `cach`); (b) thêm giá trị `cach` riêng cho mã sai (vd `'ma_sai'`) — đổi `uuDai.js` /
  `orders.js` + F6, ~5 dòng.
- **Q4 (cập nhật vòng 3) — đối soát "máy chọn hạng thay mã".** I13 của màn Đối soát (dữ liệu thật) KHÔNG bắt được mã bị tiêu mà đơn không ghi
  mã (chỉ giả lập bắt — KB33). Muốn màn Đối soát bắt cả chiều này cần một trong hai: (a) đổi I13 ở chế độ thật thành so bằng — đổi
  `bat_bien.js` / màn Đối soát, có rủi ro báo oan với dữ liệu cũ (lần tăng tay `/increment-usage` không có sổ); (b) lưu `cach` + mã đã gõ
  trên đơn (đổi DB — phiếu cấm). Cả hai ngoài Phạm vi / đổi quyết định tiền → chủ quán quyết, có thể làm việc sau.

## Câu hỏi (không chặn — vòng soát 1)
- **Q4 — đối soát (LUAT_XAY_APP §5):** máy chọn giá hạng thì mã khách gõ bị bỏ, đơn không lưu "máy đã chọn cách nào" (`cach`). Chủ quán
  muốn đối soát "máy chọn hạng thay mã" / "khách đưa mã mà không được dùng" thì cần chỗ lưu — phiếu ghi "Đổi cấu trúc DB: không" và
  màn Đối soát ngoài Phạm vi, nên việc này KHÔNG tự làm. Đề xuất: việc sau thêm cột `uu_dai_cach` (+ mã đã gõ) vào `pos_orders` và một dòng
  trong màn Đối soát. Hôm nay suy được một phần: đơn có `customer_tier` + `tier_discount > 0` + `discount_code` NULL mà nhật ký giỏ có mã.

## Soát độc lập — vòng 1 (agent, 27.10) — báo cáo nguyên văn
```
KHÔNG ĐẠT

Chưa đạt vì hai việc: mục G còn thiếu bằng chứng cho dòng gói, và màn Sales.jsx giữ số tinh-thu cũ (lỗi 2 dưới đây). Đường tiền ở máy chủ thì đúng: vẫn một hàm, không tin số màn gửi, và tinh-thu không ghi gì.

Lệnh đã chạy trong lượt này:
- `node cong_cu/thu_UUDAI1.js` → 71 đạt · 0 hỏng
- `python3 viec/UUDAI-1/dot_bien.py` → đối chứng XANH 71/0; 23 đột biến, BẮT 23 · SỐNG 0 · HỎNG 0 · LẠC 0
- `python3 viec/UUDAI-1/dot_bien.py --goc f7165ea` → 21 đạt · 50 hỏng, thoát 1
- `node kiem_tra_truoc_khi_giao.js --day-du` → PASS 78 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có từ trước), có dòng "✓ dist đã commit KHỚP với src hiện tại"

LỖI TÌM ĐƯỢC:
1. `client/src/pages/Sales.jsx:671-674` cùng `:105-111` — mất lý do lỗi thật, khuôn K5 (quầy kẹt, không chặn sai tiền). Tinh-thu trả 400 (ví dụ Flash + mã %, mã 1 món mà giỏ không có món hợp lệ) → effect gọi `setError(lý do thật)`, `tinhThu` vẫn null. Bấm thu thì câu lỗi bị ghi đè bằng "Đang tính tiền với mã giảm — thử lại sau giây lát". Nhân viên chờ mãi, không biết phải bỏ mã. Trước đây POST trả đúng câu lỗi.
2. `client/src/pages/Sales.jsx:112` — kẹt số cũ, khuôn K5/K4. Mảng phụ thuộc chỉ có `[cart, customer?.phone, discountCodeValid, shippingFee, activePkgId, buyQty]`, không có `flashState`, `membershipInfo` hay cài đặt.
   - Flash được nạp lại mỗi 60 s (`:137`) và ngay khi bấm thu (`:676`), nhưng tinh-thu không được hỏi lại.
   - Flash bật/tắt, hạng hết hạn hoặc chủ đổi cài đặt (đúng kịch bản H3) khi giỏ đang có mã → `total` vẫn là số cũ → POST trả 400 "không khớp tổng" lần này qua lần khác. Chỉ thoát được khi sửa giỏ hoặc gõ lại mã.
   - Bắt lỗi ở `:805-806` không xoá hay hỏi lại `tinhThu`. Dòng Flash trên màn (tính tại chỗ) và tổng (số máy chủ cũ) cũng lệch nhau.
3. `client/src/pages/Settings.jsx` — `loadUuDaiChung` / `saveUuDaiChung` (diff +690-710) — khuôn K6. Code MỚI gọi máy chủ qua `pkgApi` (bọc `fetch` trần, `Settings.jsx:180-185`, không kiểm `res.ok`, bỏ qua cách xử lý 401 của `api.js`). `LUAT_XAY_APP.md` §3 ghi "code MỚI gọi máy chủ qua `utils/api.js`". Bánh cóc không bắt vì không có chữ `fetch(` mới. Kế hoạch đã ghi "như saveNhanDiemCfg", nhưng luật nói khác.
4. `viec/UUDAI-1/trang_thai.md`, mục Phát hiện "Giảm riêng của khách (`orders.js:610-627` → `:714`)" — khuôn K1. Ở HEAD là `orders.js:609-633` và `:739`. Câu này không ghi số dòng đọc ở commit nào.
5. Chưa có quy tắc đối soát cho tính năng tiền mới (`LUAT_XAY_APP.md` §5). Đơn không lưu cách máy đã chọn (`cach`), và khi máy chọn hạng thì mã khách đã gõ bị bỏ hẳn, không lưu ở đâu (`orders.js:728-735`). Chủ quán không đối soát được "máy chọn hạng thay mã" hay "khách đưa mã mà không được dùng". Phiếu không nhắc tới; cần ghi rõ.

NGHI NGỜ:
- Ca Sales.jsx ở mục "Đã duyệt" chỉ được phủ gián tiếp. F4 (`thu_UUDAI1.js:308-322`) gửi thân viết tay lên máy chủ, không phải thân `donGuiMayChu()` của Sales, và không qua phần chia tiền mặt / ví của Sales. S1–S5 (`:426-435`) chỉ soi chuỗi (mẫu "có mặt"). Đột biến BV-SALES-TONG, VS-SALES-THU-KHI-CHUA-TINH, VS-SALES-HAI-THAN có bắt được, nhưng một bản sửa hành vi sai mà vẫn giữ nguyên chuỗi sẽ lọt.
- `uuDai.js:9`: `toLocaleString('vi-VN')` phụ thuộc ICU của Node; bản dựng small-icu sẽ in "81,000". Chỉ ảnh hưởng chữ `cau_ghi`, không ảnh hưởng tiền.
- Sales.jsx không hiện `ma_loi`. Nếu `/validate` nhận mã mà máy chủ bỏ (đua lượt), giỏ lặng lẽ thu không mã. Không sai tiền, nhưng ngược tinh thần Q2 "không lặng lẽ bỏ" (BH-2 sẽ dùng `ma_loi`).
- Luồng K5 ở kế hoạch §6 ("mua gói / thẻ + mã", "lấy từ gói + mã" qua tinh-thu) không có ca nào. Đây là đúng loại luồng từng làm quầy mất khả năng bán.

NGHIỆM THU: 8/9 mục có bằng chứng · mục thiếu: G một phần
- A có: A1–A6 (`thu_UUDAI1.js:155-170`). Grep cho thấy `tinhUuDai(` chỉ có một chỗ gọi, ở `orders.js:719`; K3a dùng đường payOS.
- B có: B1–B5 (gồm B3a/B3b đúng ngưỡng ngay trên/dưới).
- C có: C1a–C8, C5a/C5b.
- D có: D1a, D1b.
- E có: E1–E5, và `--day-du` cho thấy dist khớp src.
- F có: F1–F7, F1b.
- G một phần: thiếu "gói không giảm hạng". G3 chỉ thử mua THẺ (`thu_UUDAI1.js:352`). Không bài nào trong `cong_cu/` thử `package_buy` với khách có hạng; grep `package_buy` + hạng/tier → 0 kết quả.
- K5 có: K1 (bật và tắt), K2a, K2b.
- Ca Sales.jsx: có, nhưng gián tiếp (xem NGHI NGỜ).

(Trả lời từng câu soát 1–8, CHƯA SOÁT ĐƯỢC, BÀI HỌC: như bản agent nộp — các ý chính đã chép ở trên và ở mục "Xử lý vòng 1" dưới;
 CHƯA SOÁT ĐƯỢC: Sales.jsx chưa chạy trong trình duyệt; chưa chạy trên Turso production; chưa thử tay giá gạch / cau_ghi trên điện thoại;
 chưa kiểm ICU của Node trên Render.
 BÀI HỌC: KHOÁ ca S lỗi tinh-thu giữ lý do; KHOÁ ca Flash/cài đặt đổi → hỏi lại tinh-thu; KHOÁ ca G mua gói + Vàng; NGUYÊN TẮC số tạm của
 máy chủ phụ thuộc mọi đầu vào máy chủ đọc; NGUYÊN TẮC K6 tính cả hàm bọc fetch sẵn có (pkgApi); NGUYÊN TẮC việc tiền máy tự chọn phải
 lưu phương án đã chọn để đối soát.)
```

### Xử lý vòng 1 (vòng sửa 1/3)
- Lỗi 1 → `Sales.jsx`: lỗi tinh-thu giữ ở `tinhThuLoi`, bấm thu hiện đúng lý do (`setError(tinhThuLoi || …)`). Ca S6, đột biến `VS-SALES-GHI-DE-LOI`.
- Lỗi 2 → `Sales.jsx`: phụ thuộc thêm `flashState`, `membershipInfo` (khối dời xuống sau khai báo `flashState`); đơn có mã hỏi lại tinh-thu
  NGAY trước khi ghi — lệch tổng thì cập nhật số + báo, không gửi số cũ (phủ cả chủ đổi cài đặt, H3). Ca S7, đột biến `VS-SALES-KHONG-HOI-LAI`.
- Lỗi 3 → `Settings.jsx`: khối mới dùng `api.get / api.put` của `utils/api.js`. Ca S8, đột biến `VS-SETTINGS-PKGAPI`.
- Lỗi 4 → sửa số dòng ở mục Phát hiện (ghi kèm commit đọc).
- Lỗi 5 → Câu hỏi Q4 (quyết định tiền + đổi DB + màn Đối soát ngoài Phạm vi — không tự làm).
- G thiếu gói → ca G3b (gói + món, Vàng: 345.000), G3c (dòng gói không giá hạng), G3d (gói + món + mã 10 % dùng chung: 310.500).
- Nghi ngờ "mua gói / thẻ + mã qua tinh-thu": F4 dùng giỏ món; G3d phủ POST mua gói + mã. Tinh-thu đi đúng taoDon nên cùng nhánh gói.
- Nghi ngờ S chỉ soi chuỗi: đúng — Sales.jsx không chạy được trong bài Node; ghi CHƯA KIỂM, thao tác thử tay ở báo cáo.
- Gọn: `uuDai.js` đổi `dong` (hàm in) → `inTien`, bỏ đổi tên `ds`; `Sales.jsx` dùng `pkgBuyInCart` sẵn có. GIỮ `orderData` ghi rõ khoá
  (spread thì phải sửa `thu_BH1.js` I10/I11 — bài cũ xanh trên gốc, phải xin `## Bài thử cũ sửa`; không đáng cho việc này).
- Sau vòng 1: `thu_UUDAI1.js` 77 đạt · 0 hỏng; gốc 23 · 54; đột biến TỔNG 26 · BẮT 26 · SỐNG 0 · HỎNG 0 · LẠC 0;
  `npm test -- --day-du` PASS 78 · FAIL 0 · CẢNH BÁO 1 (có từ trước), dist khớp src.
- Tên đột biến thêm: VS-SALES-GHI-DE-LOI, VS-SALES-KHONG-HOI-LAI, VS-SETTINGS-PKGAPI (bảng chỗ vá → đột biến: Sales.jsx giữ lý do lỗi → S6;
  Sales.jsx hỏi lại → S7; Settings.jsx qua api.js → S8).

## Soát độc lập — vòng 2 (agent, 27.10) — báo cáo nguyên văn (rút gọn phần trả lời từng mục, giữ đủ kết luận / lỗi / nghi ngờ / nghiệm thu)
```
KHÔNG ĐẠT

Đường tiền ở máy chủ đúng. Còn một lỗi ở màn Bán hàng (Sales.jsx): màn hiện con số mà máy chủ sẽ không nhận. Thêm hai chỗ lệch kế hoạch đã duyệt, và việc đối soát xử lý chưa đúng luật §5.

Lệnh đã chạy: thu_UUDAI1 77/0 · dot_bien TỔNG 26 · BẮT 26 · --goc f7165ea 23 đạt · 54 hỏng · --day-du PASS 78 · FAIL 0 · CẢNH BÁO 1.

LỖI TÌM ĐƯỢC:
1. client/src/pages/Sales.jsx:158-167 cùng :679-680 và :126/:137/:346 — K4 → K5. Effect đặt setTinhThu(null) mỗi khi flashState / membershipInfo
   đổi ĐỐI TƯỢNG; loadFlashState (hẹn giờ 60 s) và loadMembershipInfo luôn tạo đối tượng mới; openPaymentModal gọi cả hai. Vừa mở popup thu tiền
   (và mỗi 60 s) tinhThu về null → total / giảm hạng / giảm mã rơi về công thức CŨ (Vàng + mã 10 %: popup hiện 80.000, máy chủ 81.000). Tiền
   không mất (bước hỏi lại chặn) nhưng trái Q1-a và quầy bấm thu hai lần. Sửa: không xoá tinhThu khi tính lại, hoặc khoá theo nội dung.
2. server/routes/orders.js:546-603, 849-852 — K1: kế hoạch mục 2 (đã duyệt) hứa ma_loi + ma_loi_code; bản làm tự bỏ ma_loi_code "cho gọn".
   Trái LUAT_XAY_APP §2 (lỗi MỚI phải có code).
3. server/utils/uuDai.js:40 cùng orders.js:718-722 — K3: kế hoạch Q2 ghi "KHÔNG bao giờ trả cach 'hang' vì mã sai"; mã sai → ma = null → khách
   Vàng ra cach 'hang'. F6 không kiểm cach. Sửa kế hoạch cho khớp code hoặc đổi code + thêm ca.
4. trang_thai.md mục Q4 — K1, §5 chưa đủ: bỏ sót đối soát ĐÃ CÓ (màn Đối soát reports.js:365 → utils/doiSoat.js, bất biến I13
   bat_bien.js:247-262: used_count = số đơn completed đã áp mã) canh đúng phần tiền của tính năng. Kế hoạch §4 định thêm kịch bản giả lập
   "khách hạng + mã chế độ tắt" — không làm, không ghi lý do → I13 chưa chạy qua nhánh chọn hạng.
5. cong_cu/thu_UUDAI1.js:308-319 (F4) — K3: ba ca "tắt" đều ra máy chọn HẠNG; nhánh cach 'ma' chưa bao giờ được so tinh-thu = POST trong F4.

NGHI NGỜ: ca S1–S8 chỉ soi chuỗi (marker suông xanh được — nên ghi CHƯA KIỂM); Sales.jsx không hiện ma_loi; TRUONG_TINH_THU có
customer_name thừa (vô hại); đổi 3 khoá không để dấu vết; gia_hang chỉ trả khi giam_hang > 0 (giỏ toàn món từ gói giá 0 của khách Vàng: trước
tier_unit_price = 0, nay NULL — chỉ hiển thị); signup_unit_price trên giá hạng không có ca kiểm giá trị (chỉ bill).

NGHIỆM THU: 8/9 · thiếu: ca Sales.jsx (mục Đã duyệt 1) chỉ bằng chứng gián tiếp.
CHƯA SOÁT ĐƯỢC: Sales.jsx / Settings.jsx chưa chạy trình duyệt; Turso production; ICU Node trên Render; không chạy tu_chay/cong.js chay.
BÀI HỌC: KHOÁ ca kiểm cach trong F6, F4 "tắt" phải ra cach 'ma' thật; KHOÁ kịch bản giả lập khách hạng + mã chế độ tắt; NGUYÊN TẮC số tạm của
máy chủ không đặt về null khi tính lại, mọi chỗ làm mới đầu vào là đường song song của effect; NGUYÊN TẮC bỏ bớt thứ trong kế hoạch ĐÃ DUYỆT phải
hỏi chủ quán; NGUYÊN TẮC luật §5 trước hết tìm bất biến đã có rồi ghi rõ; NGUYÊN TẮC soi chuỗi trên mã giao diện ghi CHƯA KIỂM.
```

### Xử lý vòng 2 (vòng sửa 2/3)
- Lỗi 1 → `Sales.jsx`: phụ thuộc theo KHOÁ CHUỖI nội dung (`khoaFlash` = đang flash | % | danh sách món; `khoaHang` = dùng được | % | % đặc biệt)
  thay vì đối tượng — làm mới 60 s / lúc mở thu tiền mà không đổi nội dung thì effect không chạy, không xoá số máy chủ. Ca S7 (mẫu khoá chuỗi),
  đột biến `VS-SALES-XOA-KHI-LAM-MOI` (đưa lại phụ thuộc đối tượng) bị bắt. Khi nội dung đổi thật, số được tính lại; bước hỏi lại trước khi ghi
  (vòng 1) vẫn giữ.
- Lỗi 2 → `orders.js`: tinh-thu trả `ma_loi` + `ma_loi_code` (`MA_KHONG_TON_TAI` / `MA_KHONG_AP_DUNG`) đúng kế hoạch đã duyệt. Ca F6, K2b;
  đột biến `VS-MA-LOI-KHONG-CODE`.
- Lỗi 3 → giữ code (mã sai = tính NHƯ KHÔNG MÃ — vế sau của chính câu kế hoạch Q2: "mã sai → `cach` tính như không có mã, kèm `ma_loi`");
  câu "không bao giờ trả `cach: 'hang'` vì mã sai" nghĩa là máy không coi mã sai là "chọn hạng thay mã": giỏ phân biệt bằng `ma_loi` (có) và
  `cau_ghi` (rỗng). Ca F6 nay khoá `cach === 'hang'` + `ma_loi_code` + giảm mã 0 cho khách Vàng gõ mã không có.
- Lỗi 4 → **Quy tắc đối soát (LUAT §5) của tính năng này = bất biến I13 đã có** (`cong_cu/gia_lap/bat_bien.js:247-262`, màn Đối soát qua
  `server/routes/reports.js` → `server/utils/doiSoat.js`): lượt dùng của mỗi mã = số đơn completed đã ghi mã đó. Máy chọn hạng → đơn KHÔNG ghi
  mã và mã KHÔNG tiêu, nên I13 vẫn đúng; tiêu mà không ghi (lỗi) thì I13 lệch — **ĐÍNH CHÍNH vòng 3:** "lệch" chỉ đúng ở GIẢ LẬP (so `!==`).
  Màn Đối soát chạy `ctx = { thuc: true }` (`server/utils/doiSoat.js:245`), khi đó I13 chỉ báo `used_count < số đơn` hoặc vượt `usage_limit`
  (`bat_bien.js:261`) — lỗi "chọn hạng mà vẫn tiêu mã" (`used_count > số đơn`) KHÔNG hiện trên màn Đối soát với dữ liệu thật. Xem Q4. Thêm kịch bản giả lập **KB33** (`kich_ban.js`, lượt 1) — khách
  mua thẻ Vàng, tắt 3 khoá, mã 1đ → máy chọn hạng, đơn không ghi mã, mã không tiêu; trả cài đặt về '1' ở `finally`. `thu_gia_lap.js` SO_KB
  32 → 33 (bài cũ sửa, ĐỎ trên gốc — `bang_chung_do.txt`). Đột biến `VS-CHON-HANG-VAN-TIEU-MA-GL` (bài `cong_cu/gia_lap/chay.js`) bị bắt ở
  `✗ KB33 → HTTP: …` (phép của chính KB33; dòng I13 riêng chưa chứng minh tách — ghi CHƯA KIỂM). Phần "lưu `cach` + mã đã gõ trên đơn" vẫn là Q4.
- Lỗi 5 → F4 thành 8 ca, mỗi cấu hình tắt có ca máy chọn MÃ (% 20, tiền 20.000, 1 món 20.000) và ca chọn HẠNG (% 10 = hạng, tiền 5.000); mỗi ca
  khoá `cach` + tổng đúng số tính tay.
- Nghi ngờ "Sales không hiện ma_loi" → hiện dòng "Mã không áp: …" (ca S9, đột biến `BV-SALES-MA-LOI`).
- Nghi ngờ "S chỉ soi chuỗi" → đúng: ghi ở CHƯA KIỂM của báo cáo (hành vi Sales.jsx chỉ thử tay được), các ca S vẫn đếm vì mỗi ca có đột biến
  bắt tất định (không phải phép thất thường).
- Gọn: `LOAI_MA_CHUNG` ra ngoài component (`Settings.jsx`). `customer_name` trong `TRUONG_TINH_THU` giữ (vô hại, cùng thân với Sales).
- Sau vòng 2: `thu_UUDAI1.js` 80 đạt · 0 hỏng (gốc 23 · 57); `thu_gia_lap.js` 180 · 0 (gốc 178 · 2); đột biến TỔNG 30 · BẮT 30 · SỐNG 0 ·
  HỎNG 0 · LẠC 0 (đối chứng 80/0 + giả lập 33 KB ĐẠT); `npm test -- --day-du` PASS 78 · FAIL 0 · CẢNH BÁO 1 (có từ trước).
- Tên đột biến thêm vòng 2: VS-CHON-HANG-VAN-TIEU-MA-GL, VS-SALES-XOA-KHI-LAM-MOI, BV-SALES-MA-LOI, VS-MA-LOI-KHONG-CODE (bảng chỗ vá → đột
  biến: KB33 giả lập → KB33; Sales khoá chuỗi → S7; Sales hiện ma_loi → S9; orders.js ma_loi_code → F6).

## Soát độc lập — vòng 3 (agent, 27.10) — báo cáo nguyên văn (rút gọn phần trả lời từng mục)
```
KHÔNG ĐẠT

Đường tiền ở máy chủ vẫn đúng: một hàm tinhUuDai, máy chủ không tin số màn hình gửi, tinh-thu không ghi gì. Hai lỗi cũ vòng 2 đã sửa thật
(ma_loi_code đã có; F4 có ca máy chọn MÃ). Còn 4 lỗi phải sửa trước khi giao.

Lệnh đã chạy: dot_bien 30 · BẮT 30 (đối chứng 80/0 + giả lập 33 KB ĐẠT) · --goc 23 · 57 · thu_UUDAI1 80/0 (khớp SỐ CA 80) · thu_gia_lap
180/0 (khớp SỐ CA 180) · --day-du PASS 78 · FAIL 0 · CẢNH BÁO 1 · một đột biến tự dựng ở scratchpad (lỗi 2).

LỖI TÌM ĐƯỢC:
1. viec/UUDAI-1/trang_thai.md:189 cùng cong_cu/gia_lap/bat_bien.js:261 và server/utils/doiSoat.js:245 — K1, §5 chưa thật sự đạt: màn Đối soát
   chạy ctx = { thuc: true }, khi đó I13 chỉ báo used_count < so_don hoặc vượt usage_limit; lỗi "chọn hạng mà mã vẫn tiêu" (used_count > so_don)
   KHÔNG hiện trên màn Đối soát với dữ liệu thật — chỉ giả lập (so !==) bắt. Ghi đúng giới hạn vào trang_thai / Q4, hoặc thêm quy tắc riêng (hỏi).
2. server/routes/orders.js:1288 (TRUONG_TINH_THU) — K3/K5: bỏ customer_package_id / package_buy / membership_buy khỏi danh sách trắng trên bản
   chép → thu_UUDAI1 vẫn 80/0 → đột biến SỐNG. Không lời gọi tinhThu( nào có gói / thẻ / from_package. Cần ca "phải KHÔNG bị chặn" qua tinh-thu:
   lấy từ gói + mã, mua gói + mã, mua thẻ + mã (tinh-thu = POST) + đột biến gỡ từng trường.
3. cong_cu/thu_UUDAI1.js:331-333 (F6) đối chiếu ke_hoach.md:45 và :111 — K1, đổi kế hoạch đã duyệt mà không hỏi: kế hoạch ghi "F6 mã sai →
   ma_loi, không cach 'hang'", bài thử khoá chiều ngược lại. Câu Q2 tự mâu thuẫn với khách Vàng → cần Câu hỏi cho chủ quán chốt.
4. client/src/pages/Sales.jsx:162, :170 cùng :604-605, :1258 — K4, cùng dạng lỗi 1 vòng 2, sửa nửa vời: khoá chuỗi chỉ cho Flash / hạng;
   cart vẫn so theo đối tượng, mà cart chứa note. Ô ghi chú gọi updateItemNote mỗi phím → effect setTinhThu(null) → mỗi phím một lần tinh-thu,
   tổng nháy về công thức cũ, bấm thu ngay sau khi gõ bị chặn "Đang tính tiền…". Tiền không sai (hỏi lại :723 vẫn chặn).

Gợi ý tuỳ chọn: chú thích hợp đồng phien (orders.js:169-171) chưa có chiTiet / tinhThu; chú thích F4 (thu_UUDAI1.js:309) sai với mã 1 món;
lỗi 400 "chưa có món nào được áp mã này" (orders.js:704) chưa có code; bánh cóc giả lập "≥ 32 kịch bản" có thể nâng 33; KB33 đổi cài đặt chung
an toàn hôm nay (kho riêng mỗi lượt, tuần tự, finally trả '1') — nên ghi chú ở dòng LUOT.

NGHI NGỜ: KB33 chưa từng chạy trên máy chủ gốc (đỏ của thu_gia_lap chỉ là phép đếm); ca S1–S9 chỉ soi chuỗi; gia_hang chỉ trả khi giảm hạng > 0;
inTien phụ thuộc ICU của Node.
NGHIỆM THU: 8/9 · thiếu: ca Sales.jsx của mục Đã duyệt chỉ gián tiếp; K5 (gói / thẻ qua tinh-thu) thủng một phần (lỗi 2).
CHƯA SOÁT ĐƯỢC: Sales.jsx / Settings.jsx trình duyệt; Turso production; ICU trên Render; tu_chay/cong.js chay; đo lại chia lượt sau KB33.
BÀI HỌC: KHOÁ mỗi trường danh sách trắng của route mới một ca "phải KHÔNG bị chặn" + đột biến gỡ trường; KHOÁ quy tắc đối soát phải chứng minh ở
chế độ dữ liệu thật (thuc: true); NGUYÊN TẮC khoá phụ thuộc theo nội dung tính tiền cho MỌI đầu vào effect, kể cả giỏ; NGUYÊN TẮC ca thử đảo
nghĩa dòng kế hoạch đã duyệt → Câu hỏi, không tự giải nghĩa.
```

### Xử lý vòng 3 (vòng sửa 3/3 — tối đa, `so_vong_sua_toi_da`)
- Lỗi 1 → đính chính câu I13 ở "Xử lý vòng 2"; Q4 cập nhật (hai cách, đều ngoài Phạm vi / quyết định tiền).
- Lỗi 2 → ca K4a (lấy từ gói + mã: 65.200), K4b (mua gói + mã 10 %: 310.500), K4c (mua thẻ + mã: 140.000) qua tinh-thu = POST; đột biến
  `BV-TINHTHU-LAY-GOI`, `BV-TINHTHU-MUA-GOI`, `BV-TINHTHU-MUA-THE` (gỡ từng trường) đều bị bắt.
- Lỗi 3 → Câu hỏi Q5 (chặn báo xong). Code + F6 giữ nguyên chờ chủ quán.
- Lỗi 4 → `Sales.jsx`: `khoaGio` = món, số lượng, lấy từ gói, gói, thẻ (không ghi chú); phụ thuộc effect dùng `khoaGio` thay `cart`. Ca S10,
  đột biến `VS-SALES-KHOA-GIO-THEO-DOI-TUONG`.
- Gợi ý đã làm: chú thích hợp đồng `phien` (`orders.js`), chú thích F4, `code: "MA_KHONG_CO_MON"` cho lỗi 400 mã 1 món (khối vừa sửa — LUAT §2),
  ghi chú KB33 ở dòng `LUOT`. Không làm: nâng bánh cóc giả lập (sửa `kiem_tra_truoc_khi_giao.js` ngoài việc THÊM phép — để chủ quán).
- Sửa neo `BV-TINHTHU-CHI-TINH` (chú thích mới chứa cùng chuỗi → HỎNG "khớp 2 lần") → neo riêng dòng gọi.
- Sau vòng 3: `thu_UUDAI1.js` 84 đạt · 0 hỏng (gốc 23 · 61); `thu_gia_lap.js` 180 · 0; đột biến TỔNG 34 (33 BẮT ở lượt chạy đủ + `BV-TINHTHU-CHI-TINH`
  BẮT sau sửa neo, chạy riêng cùng 4 đột biến mới: 5 · BẮT 5); `npm test -- --day-du` PASS 78 · FAIL 0 · CẢNH BÁO 1 (có từ trước); dist khớp src.
- Tên đột biến thêm vòng 3: BV-TINHTHU-LAY-GOI, BV-TINHTHU-MUA-GOI, BV-TINHTHU-MUA-THE, VS-SALES-KHOA-GIO-THEO-DOI-TUONG (bảng chỗ vá → đột
  biến: danh sách trắng tinh-thu → K4a / K4b / K4c; Sales khoá giỏ → S10).
- Đã dùng hết 3 vòng sửa. Còn Q5 (chặn) + Q4 → DỪNG, chờ chủ quán. Chưa chạy vòng soát 4, chưa ghi báo cáo 7 mục cuối / HEAD ĐÃ KIỂM.

## Phát hiện (ngoài Phạm vi, không sửa)
- `discount-codes.js /validate` (`:145-157`) xem trước tiền giảm trên subtotal gốc — sẽ lệch số máy chủ mới với khách có hạng. Màn mới nên
  dùng `tinh-thu`.
- Chốt phiên payOS (`giuCho.js:97`) chạy lại `taoDon`: cài đặt / lượt mã / giá đổi giữa lúc tạo phiên và lúc tiền về → chốt 400, phiên
  'loi' sau khi khách đã trả (`giuCho.js:114-118`). Có từ trước (giá, Flash); việc này thêm một nguồn.
- `discount-codes.js /increment-usage` (`:355`) — đường tiêu mã thứ hai, không màn nào gọi.
- Giảm riêng của khách (đọc ở `orders.js:620`, tính ở `:741`, đọc lại tại HEAD `e6d9629` — vòng sửa 4; số dòng trôi theo các patch) không
  làm tròn đồng.

## Làm tiếp (`tiep`, 28.10) — soát lần 4 theo trả lời Q5 / Q4
- Bước 1: nhánh `viec/UUDAI-1`, cây sạch; HEAD `0d9749d` · FETCH_HEAD `0d9749d` (bằng nhau → không kéo). `git log --oneline -3`:
  ```
  0d9749d PHIEU: UUDAI-1 tra loi Q5 (a) + Q4 sau khai truong
  4de9e72 UUDAI-1: soat vong 3 (KHONG DAT) + xu ly; cau hoi Q5 (cach khi ma sai) + Q4 cap nhat — dung cho chu quan
  dc8368f UUDAI-1: dot_bien neo BV-TINHTHU-CHI-TINH rieng dong goi
  ```
- Q5 = (a), Q4 không làm ở việc này — đã trả lời (phiếu). Mục "Câu hỏi — CHỜ CHỦ QUÁN" phía trên là bản cũ, giữ để đối chiếu.
- `npm ci` lúc mở phiên hỏng mạng; cài lại tay xong. `npm test`: PASS 74 · FAIL 0 · CẢNH BÁO 1 (có từ trước).
- Soát độc lập lần 4 (agent, 28.10): **KHÔNG ĐẠT** → theo phiếu mục 7: KHÔNG sửa thêm, ghi nguyên văn, push, DỪNG — chat soát thay và quyết.
  Chưa chạy `tu_chay/cong.js chay`, chưa ghi báo cáo 7 mục / HEAD ĐÃ KIỂM (chỉ làm khi soát ĐẠT).

## Soát độc lập — vòng 4 (agent, 28.10) — báo cáo nguyên văn
```
KHÔNG ĐẠT

Đường tiền ở máy chủ đúng. Mọi tính toán đi qua một hàm `tinhUuDai`, máy chủ không tin số màn hình gửi, `tinh-thu` không ghi gì. Ba lỗi vòng 3 đã sửa thật (chi tiết ở mục 2 dưới). Đã kiểm lại Q5 và Q4: code và F6 đúng như chủ quán trả lời, nên không báo lại.

Vẫn KHÔNG ĐẠT vì nghiệm thu F còn một vế không có bằng chứng, và chính dòng vá của vế đó không có bài nào bắt (lỗi 1).

LỆNH ĐÃ CHẠY (lượt này, HEAD 0d9749d)
- `node cong_cu/thu_UUDAI1.js` → 84 đạt · 0 hỏng (khớp `SỐ CA 84`, `bang_chung_do.txt:87`)
- `python3 viec/UUDAI-1/dot_bien.py` → đối chứng XANH (84/0, giả lập 33 KB ĐẠT); TỔNG 34 · BẮT 34 · SỐNG 0 · HỎNG 0 · LẠC 0
- `python3 viec/UUDAI-1/dot_bien.py --goc f7165ea` → 23 đạt · 61 hỏng, thoát 1. Dòng ✗ có ở A1–A6, B, C, E, F, H, K2b, K3, K4, S.
- `node kiem_tra_truoc_khi_giao.js --day-du` → PASS 78 · FAIL 0 · CẢNH BÁO 1 (có từ trước). Có dòng "✓ dist đã commit KHỚP với src hiện tại". `thu_UUDAI1` xanh trong bộ kiểm.
- Đột biến tự dựng, để ngoài kho (scratchpad `dot_bien_soat4.py`). Chạy 13 đột biến: 6 BẮT, 7 SỐNG (liệt kê ở lỗi 1–3 và NGHI NGỜ).
- scratchpad `dot_bien_rong.py`: chạy đột biến "bỏ ghi `tier_unit_price`" qua mọi bài nhận `--may-chu`. Kết quả XANH ở `thu_GOI1` (112/0), `thu_P26a` (16/0), `thu_P26b`, `thu_P26c` và giả lập (33 KB ĐẠT). Bốn bài `thu_DIEMTHAT1`, `thu_P2223`, `thu_P24`, `thu_DOISOAT1` sập ngay trong khung của tôi (thoát 2), nên chưa kết luận được cho bốn bài này.

LỖI TÌM ĐƯỢC
1. `server/routes/orders.js:729` — khuôn K3: dòng vá không có bài nào bắt, và đây là vế nghiệm thu F.
   - Dòng này (`orderItems.forEach(... it.tier_unit_price = uuDai.gia_hang[i])`) do việc này viết lại: khối cũ ở `orders.js:665-667` gốc được dời sang `uuDai.gia_hang`.
   - Xoá dòng đi: `thu_UUDAI1` vẫn 84/0, và cả các bài kể ở trên vẫn xanh.
   - Lý do không bắt: F1 (`thu_UUDAI1.js:300`) chỉ kiểm có khoá `'tier_unit_price' in t.items[0]`, mà ở ca đó (`cach 'ma'`) giá trị đúng là `null`. C1b và G3c chỉ kiểm phía "KHÔNG có giá hạng". Không ca nào kiểm giá hạng ĐÚNG cho một món (ví dụ Vàng 50.000 → 45.000), dù ở tinh-thu hay ở `pos_order_items`.
   - Hệ quả: vế F "giá đơn vị theo hạng của từng món (để màn hiện giá gạch)" và vế G "không đổi" của giá hạng trên dòng đơn đều không có bằng chứng.
   - Đây là cột dính tới tiền: `server/utils/tienDaTra.js:16` dùng `tier_unit_price` để chia tiền đã trả theo dòng (đền bù `damages.js`, phần gói đã dùng trong `soTienHoan` `:37-41`). Code hôm nay đúng, nhưng nếu dòng này hỏng thì không ai biết.
2. `server/routes/orders.js:718` (`?.value !== "0"`) — khuôn K3: hành vi mặc định khi THIẾU khoá cài đặt chưa có ca khoá.
   - Đổi thành `=== "1"` thì vẫn 84/0 (đột biến SỐNG).
   - Tình huống có thật: khôi phục bản sao lưu làm trước UUDAI-1 xoá sạch bảng (`server/routes/backup.js:357` `DELETE FROM pos_settings`), nên ba khoá vắng cho tới lần khởi động sau.
   - Hôm nay code coi khoá vắng là "dùng chung" (đúng mặc định phiếu E). Thiếu ca "không có dòng cài đặt → `ca_hai`".
3. `server/routes/orders.js:753` — khuôn K3 (giao diện hoá đơn): giá mã 1 món trên giá đã giảm hạng (`tier_unit_price ?? unit_price`) không có ca kiểm giá trị.
   - Đổi về `unit_price` thì vẫn 84/0.
   - Vòng 2 đã nêu ở NGHI NGỜ nhưng chưa xử lý. Nếu hỏng thì bill in giá 1 món sai (ví dụ B5: in 40.000 thay vì 36.000). Không lệch tổng tiền.
4. `viec/UUDAI-1/trang_thai.md` — khuôn K1/K4 (hồ sơ):
   - `:39-40` còn ghi "không thêm `ma_loi_code`", ngược code hiện tại (`orders.js:591`, `:602`, `:855`).
   - Mục Phát hiện `:277` trích `orders.js:617` / `:739` "tại `47a0612`". Ở HEAD hai số đó đã trôi: `:617` là `if (!discountCodeId)`, phép tính giảm riêng nằm ở `:741`.
   - Mục "Câu hỏi — CHỜ CHỦ QUÁN" `:74-85` vẫn ghi Q5 là CHẶN, chưa ghi câu trả lời 27.10 của phiếu.
   - Cần sửa khi ghi báo cáo cuối.

NGHI NGỜ
- `client/src/pages/Sales.jsx:1439`: dòng xanh "✓ {discountCodeValid.message}" lấy từ `/validate`, tính trên giá gốc (`discount-codes.js:118-128` với mã 1 món). Khi máy chọn hạng, dòng này vẫn hiện "✓ Giảm …" cạnh câu `cau_ghi` "không dùng mã". Với mã 1 món dùng chung, nó hiện "Giảm 10.000đ (1 món)" trong khi số máy chủ là 9.000. Chỉ là hiển thị, tổng tiền vẫn đúng. Nhưng đây là đường song song chưa chuyển sang số máy chủ theo Q1-a.
- Các dòng hiển thị khác bỏ đi mà bài thử vẫn xanh (đột biến SỐNG):
  - `Sales.jsx:178` (`if (tinhThu && !tinhThu.tier_discount) return null;`): nếu mất, giỏ hiện giá gạch hạng khi máy đã chọn mã.
  - `uuDai.js:52`: `cau_ghi` của `ca_hai` không ca nào kiểm.
  - `orders.js:853`: `customer_tier` trả về ở tinh-thu không ca nào kiểm.
- `uuDai.js:25`: bỏ `truTruoc` khỏi `conLai` thì vẫn 84/0. Hôm nay không gây hại vì `orders.js:747-750` kẹp lại lần nữa. Nhưng hàm "dùng lại cho COMBO-1a" chưa có ca thuần cho Flash + mã tiền lớn hơn phần còn lại.
- `Settings.jsx:696-702`: nạp cài đặt lỗi thì ô tích giữ mặc định `'1'`. Bấm Lưu sẽ đè `'0'` chủ quán đã đặt (có hiện "Lỗi:…" trước đó).
- Ca Sales.jsx của mục "Đã duyệt" 1 vẫn chỉ có bằng chứng gián tiếp: F4 / K4 gửi thân cùng dạng với `donGuiMayChu`; S1–S10 chỉ soi chuỗi trong nguồn, có đột biến bắt. Hành vi thật của màn chưa chạy.
- Tinh-thu cho khách lẻ (không SĐT) + mã chưa có ca riêng; G2b chỉ đi qua POST.

TRẢ LỜI 8 MỤC
1. K3 — bài có giá trị một phần. Có chạy trên gốc và đỏ thật: 61 hỏng. Đa số ca kiểm hành vi bằng HTTP + DB (tổng tiền, lượt mã, dòng đơn), không chỉ marker. Riêng S1–S10 và E5 là soi chuỗi; marker suông có thể làm chúng xanh, nhưng đột biến của từng ca đều bắt. Lỗ: lỗi 1–3 ở trên.
2. K4 — ba lỗi vòng 3 đã sửa thật: danh sách trắng tinh-thu (K4a/K4b/K4c cùng `BV-TINHTHU-LAY-GOI/-MUA-GOI/-MUA-THE` đều BẮT); `khoaGio` (`Sales.jsx:162`) không còn ghi chú, S10 cùng `VS-SALES-KHOA-GIO-THEO-DOI-TUONG` BẮT; ghi chú KB33 ở `kich_ban.js:720`. Grep `pos_settings` ở các đường ghi: `settings.js:114` có kiểm; `tiers.js:73-83` không đụng khoá `uudai_`; `backup.js:357` khôi phục không kiểm giá trị, nhưng phía đọc `!== "0"` vẫn an toàn. Grep `discountCodeValid` trong `Sales.jsx`: 13 chỗ; còn `:1208-1209` và `:1439` hiển thị số của `/validate` (xem NGHI NGỜ). Grep `tinhUuDai(` trong `orders.js`: 1 chỗ gọi (`:719`).
3. K5 — không thấy luồng nào bị chặn oan: kiểm '0'/'1' chỉ áp khoá có tiền tố (E4); tinh-thu đi đủ đường gói / thẻ / lấy gói / phí giao (K4a-c, F4); `Sales.jsx:680` chặn thu khi chưa có số máy chủ, lỗi thật hiện đúng lý do (S6); hỏi lại trước khi ghi (`:723-732`) lệch tổng thì báo, không chặn vĩnh viễn; chọn hạng bỏ mã → giảm riêng không bật lại (đúng Q3); khách không hạng + mã (K1), mã hết hạn (K2a), payOS (K3a/b) đều qua.
4. K1 — có câu không còn đúng ở HEAD: lỗi 4.
5. Đường tiền — đúng: `orders.js:1291-1294` lọc thân; tiền mã và hạng tự tra DB (`:552`, `:648`, `:715-718`); `total` do máy chủ tính (`:761-764`); đối chiếu tiền ở `:860+` vẫn chạy cho POST /; lượt mã chỉ tiêu khi `discountCodeId` (`:1006-1044`); chọn hạng thì xoá `discountCodeId` (`:730-736`).
6. P1 — dist khớp src (`--day-du`).
7. Nghiệm thu — xem dòng NGHIỆM THU.
8. Đơn giản — gọn được vài chỗ nhỏ: `orders.js:717` luôn truy vấn `pos_voucher_grants` kể cả khi khoá là '1' (có thể đọc cài đặt trước); `orders.js:1290` `customer_name` trong danh sách trắng là thừa; `uuDai.js:9`, `:51-57` hàm tiền thuần tự dựng câu chữ giao diện (chấp nhận được vì phiếu đòi `cau_ghi`). Không thấy phần lan man ngoài phiếu. Đối soát: theo trả lời Q4 chỉ cần ghi giới hạn — I13 ở chế độ thật (`doiSoat.js:245`, `bat_bien.js:261`) không bắt được "chọn hạng mà vẫn tiêu mã", chỉ giả lập KB33 bắt.

NGHIỆM THU: 7/9 mục có bằng chứng đủ · mục thiếu:
- F (thiếu một phần): vế "giá đơn vị theo hạng của từng món" không có ca kiểm giá trị (lỗi 1).
- Ca Sales.jsx của mục "Đã duyệt" 1: chỉ có bằng chứng gián tiếp.
Từng mục: A có (A1–A6 `thu_UUDAI1.js:155-177`, K3a/K3b payOS) · B có (B1–B5 `:183-200`) · C có (C1a–C8, C5a/C5b `:205-251`) · D có (D1a, D1b `:255-263`) · E có (E1–E5 `:151`, `:267-286`, `--day-du`) · F một phần (F1–F7, F1b, F4 × 8 `:290-337`; thiếu vế giá hạng từng món) · G có (G1–G7, G3b–G3d `:341-381`; riêng giá hạng trên dòng đơn chưa khoá — lỗi 1) · K5 có (K1, K2a, K2b, K4a–c `:385-434`) · Ca Sales.jsx: gián tiếp — F4 + S1–S10, không chạy màn thật.

CHƯA SOÁT ĐƯỢC
- `node tu_chay/cong.js chay`: người gác chặn `git clone` vào thư mục nháp; chạy trên kho thật thì ghi đè file, nên không chạy.
- Sales.jsx và Settings.jsx trong trình duyệt.
- Turso production; ICU của Node trên Render (`toLocaleString('vi-VN')`).
- Bốn bài `thu_DIEMTHAT1`, `thu_P2223`, `thu_P24`, `thu_DOISOAT1` với đột biến của lỗi 1 (sập trong khung của tôi).

BÀI HỌC
- KHOÁ: mỗi trường trả về mà nghiệm thu gọi tên phải có MỘT ca kiểm GIÁ TRỊ ĐÚNG khác rỗng, không chỉ kiểm có khoá. Ở đây: ca Vàng 50.000 → `tier_unit_price` 45.000 ở tinh-thu và ở `pos_order_items`, kèm đột biến xoá `orders.js:729`.
- KHOÁ: ca "không có dòng cài đặt → mặc định dùng chung" (xoá dòng `pos_settings` rồi tạo đơn), kèm đột biến `!== "0"` → `=== "1"`.
- KHOÁ: ca kiểm giá trị `signup_unit_price` của mã 1 món khi dùng chung với hạng.
- NGUYÊN TẮC (K3): dời một khối tính tiền sang hàm mới thì MỌI đầu ra của khối cũ (cả cột "chỉ hiển thị" mà nơi khác đọc để hoàn / đền) phải có ca giữ giá trị. "Không đổi" phải được khoá bằng giá trị, không chỉ bằng tổng.
- NGUYÊN TẮC (K4): chuyển màn sang "số máy chủ" thì grep MỌI chỗ hiện số của nguồn cũ (`discountCodeValid.message`, `discount_amount`), không chỉ dòng tổng.
- NGUYÊN TẮC (K1): sửa một quyết định trong vòng soát thì grep cả `trang_thai.md` tìm câu cũ trái nghĩa (`ma_loi_code`, Q5).
```

### Sau vòng 4 — máy DỪNG (phiếu mục 7: hết 3 vòng sửa, soát lần 4 KHÔNG ĐẠT → không sửa thêm)
- Không sửa code / bài thử. Ghi nhận của máy (không phải quyết định): lỗi 1–3 là lỗ BÀI THỬ (code hôm nay đúng theo người soát), mỗi lỗi ~1 ca +
  1 đột biến trong `cong_cu/thu_UUDAI1.js` / `viec/UUDAI-1/dot_bien.py` (đều trong Phạm vi); lỗi 4 là hồ sơ (`trang_thai.md`). Chat soát quyết có cho
  vòng sửa thứ 4 không.

## Làm tiếp (`tiep`, 28.10) — VÒNG SỬA 4 (chat soát thay, phiếu mục 8–10: chỉ thêm bài thử + hồ sơ)
- Bước 1: nhánh `viec/UUDAI-1`, cây sạch; hook mở phiên kéo `0d9749d → 71f69fc`; HEAD `71f69fc` · FETCH_HEAD `71f69fc` (bằng nhau → không kéo).
  `git log --oneline -3`:
  ```
  71f69fc PHIEU: UUDAI-1 chat soat thay - vong sua 4 chi them bai thu + ho so
  2388d11 UUDAI-1: soat vong 4 (KHONG DAT) — ghi nguyen van, dung cho chat soat (phieu muc 7)
  0d9749d PHIEU: UUDAI-1 tra loi Q5 (a) + Q4 sau khai truong
  ```
- KHÔNG đổi code chạy (`server/`, `client/src/`). Chỉ đổi `cong_cu/thu_UUDAI1.js`, `viec/UUDAI-1/dot_bien.py`, `bang_chung_do.txt`, `trang_thai.md`.
- (1) **F8**: khách Vàng, món 50.000 → `tier_unit_price` 45.000 ở tinh-thu VÀ ở `pos_order_items`. Đột biến `BV-GIA-HANG-TUNG-MON` (xoá dòng
  `orderItems.forEach(... it.tier_unit_price = uuDai.gia_hang[i])`, `orders.js:729`) → BẮT ở ✗ F8 (tinh-thu null).
- (2) **E6 / E6b**: xoá 3 khoá khỏi `pos_settings` → Vàng + mã 10 % ra 81.000, tinh-thu `ca_hai` (mặc định dùng chung). Đột biến
  `VS-MAC-DINH-THIEU-KHOA` (`?.value !== "0"` → `=== "1"`, `orders.js:718`) → BẮT ở ✗ E6 (400 lệch tổng).
- (3) **B5b**: bill mã 1 món dùng chung với hạng: `signup_unit_price` = 45.000 − 9.000 = 36.000. Đột biến `VS-GIA-MA-MOT-MON-GOC`
  (`tier_unit_price ?? unit_price` → `unit_price`, `orders.js:753`) → BẮT ở ✗ B5b ([41000]).
- (4) Hồ sơ: đính chính câu "không thêm `ma_loi_code`" (mục Bước 4–6); mục Q5 đổi tiêu đề "ĐÃ TRẢ LỜI"; Phát hiện "giảm riêng" số dòng đọc lại
  ở HEAD `e6d9629` (`:620` / `:741`). Các số dòng trong báo cáo soát vòng 1–4 là NGUYÊN VĂN của người soát tại commit lúc đó — không sửa.
- Không ca mới nào bắt lỗi THẬT: trên HEAD cả 4 ca mới xanh ngay (code đúng như người soát kết luận) — phiếu mục 9 không kích hoạt.
- Kết quả: `thu_UUDAI1.js` 88 đạt · 0 hỏng (gốc `f7165ea`: 23 · 65, `bang_chung_do.txt`); đột biến TỔNG 37 · BẮT 37 · SỐNG 0 · HỎNG 0 · LẠC 0
  (đối chứng 88/0 + giả lập 33 KB ĐẠT); `npm test -- --day-du` PASS 78 · FAIL 0 · CẢNH BÁO 1 (route GET có lệnh ghi — có từ trước); dist khớp src.
- Tên đột biến thêm vòng sửa 4: BV-GIA-HANG-TUNG-MON, VS-MAC-DINH-THIEU-KHOA, VS-GIA-MA-MOT-MON-GOC (bảng chỗ vá → đột biến:
  `orders.js` gắn giá hạng từng món → F8; `orders.js` mặc định khi thiếu khoá → E6; `orders.js` giá mã 1 món trên giá hạng → B5b).
- SOÁT LẦN 5: chat soát thay (phiếu mục 10) — không gọi agent soát độc lập.
