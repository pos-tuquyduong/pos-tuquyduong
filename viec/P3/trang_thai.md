# P3 — trạng thái

## Bước 1 — đối chiếu bản chụp (24.10.2026)
- Nhánh: `viec/P3` · `git status --short` sạch (không dòng nào).
- `git fetch origin viec/P3` → HEAD `98f30df` · FETCH_HEAD `98f30df` (bằng nhau, không kéo).
- `git log --oneline -3`:
  ```
  98f30df PHIEU: P3
  99f5894 TIEN-DO: P22-23 (c4fabcd), KH-QUAY-1 (168b481), P15-QR (423624b), KH-UI-1 (bd9b920) xong; DAC_TA_BAN_HANG_2410 + demo; mo QUAY-AN-1 + P24 + P3; them DIEM-THAT-1, UUDAI-1, TOPPING-1, BH-1, HD-1, KH-MUA-1, KH-UI-2; P13a-e + P14 gop; DON-DEP-v1 -> DONDEP-v1; lich — so v39
  bd9b920 Merge pull request #41 from pos-tuquyduong/viec/KH-UI-1
  ```

## Bước 2–3 — đọc + kế hoạch
- Đã đọc: phiếu, CLAUDE.md, KHUON_LOI.md, CHECKLIST B4–B7, P3, P4, G, H; `DAC_TA_BAN_HANG_2410.md` mục 1–2;
  code `orders.js` POST / (167–1240), `wallets.js` (ghiVi 60–80, deduct/adjust 159–230), `loyalty.js` /redeem (80–170),
  `diemKhach.js`, `customers.js` (mọi chỗ trả `SELECT *`), `customers-v2.js` (getLocalCachedCustomers), `kh/index.js`, `kh/loi.js`,
  `index.js` (mount 64–121), `database.js` (pos_customers 78–100, quyền 982–1040), `backup.js` BACKUP_TABLES, `doiSoat.js`,
  `kiem_tra_truoc_khi_giao.js` (E8 388–398, mảng bài chạy thật 495), `env.example`, giả lập `kich_ban.js` (KB2, /loyalty/redeem).
- payOS: `payos.vn` KHÔNG phân giải được từ máy mây (WebFetch ENOTFOUND; curl bị người gác chặn — CURL-HOST, đúng luật).
  Đã đối chiếu mã nguồn SDK CHÍNH THỨC `github.com/payOSHQ/payos-lib-node` (nhánh main) — chi tiết ở `ke_hoach.md` mục 2.
- Kế hoạch: `viec/P3/ke_hoach.md`. Phiếu dặn **chờ duyệt kế hoạch** → commit, push, DỪNG ở bước 3.

## Câu hỏi
Xem `ke_hoach.md` mục 0 (Q1–Q7) — cần chủ quán trả lời trước khi viết bài thử / code.

## Phiên tiếp (25.10.2026) — bước 1 đối chiếu bản chụp
- Nhánh `viec/P3`, cây sạch. `git fetch origin viec/P3` → HEAD `0a9fb6c` · FETCH_HEAD `0a9fb6c` (bằng nhau, không kéo;
  hook mở phiên đã kéo `98f30df → 0a9fb6c`).
- `git log --oneline -3`:
  ```
  0a9fb6c PHIEU: P3 duyet ke hoach 24.10 (tach P3b, co payOS mac dinh tat, backup.js, noi dung CK <= 9 ky tu, Q4-Q7)
  7d1cc3c P3: ke hoach — nhan ket qua soat doc lap (chi tinh truoc doi chieu, su kien cung giao dich, phien loi, dangGiu o wallets)
  041dae2 P3: ke hoach (cho chu quan duyet) + trang thai buoc 1-3
  ```
- Kế hoạch đã duyệt (phiếu mục "Đã duyệt" 1–11) → làm tiếp từ bước 4.

## Bước 4 — bài thử trước (25.10)
- `cong_cu/thu_P3.js` (mới, khuôn `thu_KH1.js`: database.js + libsql thật trên kho tạm, payOS GIẢ trên 127.0.0.1, khoá thử sinh ngẫu
  nhiên, webhook ký bằng công thức viết RIÊNG trong bài). Bản cuối `88bc75b`.
- Chạy trên cây gốc `0a9fb6c` → **4 đạt · 39 hỏng** (4 ca đạt = ca K5 luồng cũ); chi tiết + cách dựng ở `bang_chung_do.txt`.
  Bằng chứng ghi với bản `7272331`; bản `88bc75b` chỉ THÊM một ca (E3 hạn khoá 15 phút) → chạy lại trên gốc, chép lại ở bước 11.
- Sửa bài trong lúc vá (K2 — truy nguyên trước): E3/E4 giỏ 1 món = số dư → `CACH_KHONG_KHOP` là ĐÚNG luật (đổi sang 3 món);
  phép tĩnh cắt chú thích của bộ kiểm nuốt mất dòng gọi (`'server/**'` mở `/*` giả) → so đúng dòng `for (const bai of [...])`;
  E6 đếm `=== 200` bỏ sót 201 của hai đường tạo. Thêm ca TẤT ĐỊNH B9b (móc trước giao dịch: xác nhận tay chốt XONG giữa phép kiểm và
  giao dịch của webhook) — B5/B9 đua thật là thất thường, không đủ làm bằng chứng cho cổng (K3).

## Bước 5–6 — vá + kiểm (25.10)
- Code: commit `35895c4` (12 file server + env.example + kiem_tra). `thu_P3.js` **85 đạt · 0 hỏng** (bản `88bc75b`: 86).
- `npm test`: PASS 70 · FAIL 0 · CẢNH BÁO 1 (cảnh báo "route GET có lệnh ghi" ở packages.js / products.js / sync.js — có sẵn trên gốc).
- `npm test -- --day-du`: PASS 74 · FAIL 0 · CẢNH BÁO 1 — giả lập quầy `cong_cu/gia_lap/chay.js` xanh 35,8 s, `thu_gia_lap.js` xanh
  58,4 s, KHÔNG sửa dòng nào của `cong_cu/gia_lap/**` / `thu_gia_lap.js` (nghiệm thu I).
- Không đụng `client/src/` → không build.
- Trước khi commit `35895c4`: bỏ câu đọc trước `khoa` trong webhook (trùng với `ON CONFLICT(khoa) DO NOTHING`; đột biến gỡ nó sẽ SỐNG).

## Phát hiện (ngoài Phạm vi / ngoài vùng sửa — KHÔNG sửa)
- `customers.js` GET `/:id` luôn 500: đọc `pos_balance_transactions.customer_id` và `pos_orders.customer_id` — hai cột không có
  (sổ theo SĐT). Có sẵn trên gốc; vùng sửa của customers.js chỉ cho bỏ `password` / `pin_code`.
- `customers.js` POST `/:id/children` không gửi SĐT → 500 (`pos_customers.phone NOT NULL`, code chèn `null`). Có sẵn.
- `backup.js` xuất bảng `pos_customers` nguyên dòng → file sao lưu có băm PIN (chỉ owner xuất). Khôi phục `pos_customers` ghi đè PIN —
  chủ quán đã ghi việc sau (phiếu "Đã duyệt" 3).
- Bộ kiểm E14 (route ghi không qua `loiGhi`) đếm 50 < ngưỡng 51 và nhắc HẠ ngưỡng — người soát đo bằng chính `quetRouteGhi` trên GỐC
  `98f30df^` cũng ra 50 (danh sách giống hệt HEAD): có sẵn trước P3, không do việc này. Máy không hạ (ngoài Phạm vi của bánh cóc này).
- `pay-debt` (P24) và `doi-cach-tra` (`don-mo-rong.js`) vẫn nhận chuyển khoản tay khi cờ `thanh_toan_payos_bat_buoc` bật (phiếu: ghi
  Phát hiện, không sửa). `/loyalty/redeem` chưa đòi PIN — việc P3b.
- Đơn Flash: giờ flash kết thúc giữa lúc tạo phiên và tiền về → tổng đổi → chốt hỏng, tiền về thành `chua_khop` (ĐỎ). Đúng luật, có thể
  gặp lúc chuyển giờ flash.

## Bước 8 — soát độc lập vòng 1 (/ra-soat, agent general-purpose, 25.10) — nguyên báo cáo
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
1. server/utils/pinKhach.js:45 và :50-52 — chặn sai PIN bị vượt khi gửi nhiều lượt cùng lúc. Phép xem "đang khoá" là câu ĐỌC trước
   bcrypt.compare; câu cộng đếm + đặt khoá là câu GHI riêng, chạy sau. Dựng lại: khách đã sai 2 lần, 30 PIN sai cùng lúc → 25 lượt được
   so (PIN_SAI), chỉ 5 lượt 423 (đúng luật chỉ được 3). Ca E8 chỉ kiểm "đếm 2". Sửa: giữ chỗ lượt thử bằng MỘT câu ghi có điều kiện
   trước khi so, kiểm changes. — K4 + K3.
2. server/routes/orders.js:211 (vế parent_balance_amount của cờ thanh_toan_payos_bat_buoc) — không ca nào khoá; đột biến xoá vế SỐNG. — K3.
3. server/routes/thanh-toan.js:124 / ca B6 — chỉ có ca trả THIẾU 1.000đ, thiếu ca trả DƯ; đột biến `Number(d.amount) < p.con_lai`
   SỐNG. — K3 (ngưỡng phải có ca ngay trên và ngay dưới).
4. viec/P3/bang_chung_do.txt:1,8 — bằng chứng ghi cho bản 7272331 (SỐ CA 85) nhưng bài đã đổi ở 88bc75b, 01f7bd1; HEAD 86 ca. Mục B, C, D
   sập ngay trên gốc → giá trị phân biệt dựa vào bộ đột biến, mà kết quả đột biến (46/46) và `node tu_chay/cong.js chay` chưa ghi
   vào trang_thai.md. — K3 / A16.
5. viec/P3/trang_thai.md mục Phát hiện, câu về E14 — SAI: chạy quetRouteGhi trên gốc 98f30df^ và HEAD đều ra 50, danh sách giống hệt.
   Số 50 có từ trước P3, không do taoDon. — K1.
6. Lời báo còn đọc số dư THÔ: orders.js:906 (`Hiện có: ${r.truoc}`), wallets.js:193 (`balance: kq.truoc`), wallets.js:233 ("Số dư
   hiện tại"). Mục "Đã duyệt" 10 mới sửa ở bước kiểm trước (orders.js:767, 783, 804). — K4.
NGHI NGỜ:
- ma_payos = id phiên (giuCho.js:66): kho thử Replit dùng chung khoá payOS với Render → mã đơn trùng giữa hai kho, webhook production có
  thể khớp nhầm phiên cùng id + cùng tiền. Chưa đọc được cấu hình môi trường.
- giuCho.js:74: expiredAt tính SAU câu ghi het_han → QR payOS sống lâu hơn phiên POS vài phần giây–vài giây.
- wallets.js:93: mọi lệnh adjust (kể cả CỘNG) đặt khongAm: true → số dư thấp hơn phần đang giữ thì điều chỉnh cộng cũng bị chặn.
- Xác nhận tay chốt hỏng 4xx → phiên loi, không ghi sự kiện nào; payOS không báo về thì khoản tiền không hiện ở Đối soát.
- Dòng chua_khop không có cách đánh dấu "đã xử lý" → ngày đó ĐỎ mãi.
- PUT /api/kh/pin đổi PIN không cần PIN cũ, xoá luôn khoá sai PIN (phiếu Q6 cho phép).
NGHIỆM THU: 10/10 mục có ca thử, nhưng E (khoá vượt bằng gửi cùng lúc) và B (thiếu ca trả dư) hỏng / phủ thiếu; bằng chứng đỏ cho bài
  ở HEAD còn thiếu.
CHƯA SOÁT ĐƯỢC: npm test -- --day-du; node tu_chay/cong.js chay; định dạng payOS thật; pin_code cũ trên Turso; doi-cach-tra đổi được đơn
  payOS (ngoài phạm vi). Rườm rà nhỏ: thanh-toan.js:125 vế trang_thai thừa; orders.js:767 phien?.id trong nhánh !phien; GIO chép hai nơi;
  ba hàm loi khác dạng. Đối soát còn thiếu phép so sự kiện khop với transfer_amount của đơn.
BÀI HỌC:
- KHOÁ: ca "N PIN sai CÙNG LÚC → số lượt PIN_SAI ≤ 5 − đã sai" + đột biến đưa lại câu đọc rời; ca I7 parent_balance_amount; ca B6 trả DƯ.
- KHOÁ: SỐ CA trong bang_chung_do.txt phải bằng số ca của bài ở HEAD.
- NGUYÊN TẮC (K4): cổng đếm / khoá giữ chỗ lượt thử bằng MỘT câu ghi có điều kiện, kiểm changes, TRƯỚC thao tác chậm.
- NGUYÊN TẮC (K1): câu giải thích một con số của bộ kiểm phải kèm số đo trên GỐC.
```
