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
- `ma_loi`: hai câu ("Mã không tồn tại hoặc đã tắt" / "Mã hết hạn, hết lượt hoặc đơn chưa đủ tối thiểu"), không thêm `ma_loi_code`
  (kế hoạch mục 2 ghi "+ code" — bỏ cho gọn; tinh-thu mới, chưa ai đọc mã này).
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

## Phát hiện (ngoài Phạm vi, không sửa)
- `discount-codes.js /validate` (`:145-157`) xem trước tiền giảm trên subtotal gốc — sẽ lệch số máy chủ mới với khách có hạng. Màn mới nên
  dùng `tinh-thu`.
- Chốt phiên payOS (`giuCho.js:97`) chạy lại `taoDon`: cài đặt / lượt mã / giá đổi giữa lúc tạo phiên và lúc tiền về → chốt 400, phiên
  'loi' sau khi khách đã trả (`giuCho.js:114-118`). Có từ trước (giá, Flash); việc này thêm một nguồn.
- `discount-codes.js /increment-usage` (`:355`) — đường tiêu mã thứ hai, không màn nào gọi.
- Giảm riêng của khách (đọc ở `orders.js:617`, tính ở `:739`, đọc tại HEAD `47a0612`) không làm tròn đồng.
