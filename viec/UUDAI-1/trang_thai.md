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

## Phát hiện (ngoài Phạm vi, không sửa)
- `discount-codes.js /validate` (`:145-157`) xem trước tiền giảm trên subtotal gốc — sẽ lệch số máy chủ mới với khách có hạng. Màn mới nên
  dùng `tinh-thu`.
- Chốt phiên payOS (`giuCho.js:97`) chạy lại `taoDon`: cài đặt / lượt mã / giá đổi giữa lúc tạo phiên và lúc tiền về → chốt 400, phiên
  'loi' sau khi khách đã trả (`giuCho.js:114-118`). Có từ trước (giá, Flash); việc này thêm một nguồn.
- `discount-codes.js /increment-usage` (`:355`) — đường tiêu mã thứ hai, không màn nào gọi.
- Giảm riêng của khách (`orders.js:610-627` → `:714`) không làm tròn đồng.
