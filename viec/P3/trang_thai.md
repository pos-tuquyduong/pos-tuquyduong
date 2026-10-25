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

## Sửa theo soát vòng 1 (25.10) — commit a830070, 9e3c4dd
| Lỗi người soát | Sửa | Ca khoá |
|---|---|---|
| 1 PIN cùng lúc vượt khoá | `pinKhach.js` kiemPin: MỘT câu ghi giữ chỗ lượt thử (đếm + đặt khoá, điều kiện "chưa khoá", kiểm `changes`) TRƯỚC bcrypt | E10 (30 PIN sai cùng lúc → đúng 3 so, 27 khoá) + VS-pin-doc-roi đưa ĐÚNG lỗi cũ trở lại → bắt 3/3 lần (25 so · 5 khoá, khớp số người soát) |
| 2 vế ví mẹ của cờ không ca | thêm `j3b` vào I7 | VS-co-bo-vi-me |
| 3 thiếu ca trả DƯ | thêm B6 trả dư 1.000đ | VS-so-tien-du |
| 4 bằng chứng cũ | dựng lại trên gốc với bản a830070: 4 đạt · 40 hỏng, SỐ CA 88 | bang_chung_do.txt |
| 5 câu E14 sai | sửa câu Phát hiện (gốc cũng 50) | — |
| 6 lời báo số dư thô | ghiVi trả `khaDung` khi thiếu; orders.js "Khả dụng", wallets deduct trả `kha_dung`, adjust "Số dư khả dụng" | (lời báo — không so chữ, E12) |
| nghi ngờ: adjust CỘNG bị chặn | `khongAm: adjustAmount < 0` | (vòng 2: câu cũ "F1 nạp phủ" SAI — F1 gọi /topup; ca F8 thêm ở vòng 2) |
| nghi ngờ: expiredAt trễ | `hetGiay` lấy cùng lúc `now` trước giao dịch | VS-han-15-phut |
| rườm rà | bỏ vế `trang_thai !== 'cho'` ở webhook (chotPhien báo sớm 409 → chua_khop); bỏ `phien?.id` trong nhánh `!phien` | B8 vẫn xanh |

## Bước 4 (đột biến) — chỗ vá → đột biến (viec/P3/dot_bien.py, 50 đột biến, đối chứng 88 đạt · 0 hỏng)
| Chỗ vá | Đột biến |
|---|---|
| cổng chốt MỘT lần (giuCho vaoGiaoDich + orders.js) | BV-cong-phien, VS-cong-changes, BV-cong-orders (bắt ở B9b tất định) |
| gắn đơn vào phiên / chế độ chỉ tính / phiên loi / sự kiện trong giao dịch / UNIQUE khoa | BV-sau-ghi-don, BV-chi-tinh, BV-loi-phien, BV-su-kien-tx, BV-khoa-unique |
| chữ ký payOS | BV-chu-ky, VS-khoa-rong |
| khớp tiền / về muộn / thất bại | VS-so-tien, VS-so-tien-du, BV-ve-muon-payos, VS-that-bai |
| tạo phiên: tiền máy chủ, chưa cấu hình, nội dung ≤ 9, hạn 10′, trạng thái hết hạn | VS-tien-client, BV-chua-cau-hinh, VS-noi-dung-10, VS-han-15-phut, VS-tom-het-han |
| không tự chốt CK, xác nhận tay (quyền, lý do, nhật ký, seed) | VS-chot-ca-payos, BV-quyen-tay, BV-ly-do-tay, BV-nhat-ky-tay, VS-quyen-seed-staff |
| PIN (băm, lần đầu, 2 lần gõ, Q7, đếm, giữ chỗ, ngưỡng 5 hai phía, 15′, mẹ Q4, xoá, App KH) | VS-pin-luu-tho, BV-pin-lan-dau, BV-pin-khop, VS-pin-tho, BV-pin-dem, VS-pin-doc-roi, BV-pin-giu-cho, VS-pin-nguong-6, VS-pin-nguong-4, VS-pin-khoa-30, BV-pin-me-cua-con, BV-xoa-pin-quyen, VS-kh-pin-sdt-than |
| bỏ password / pin_code | BV-bo-mat |
| giữ tài khoản (ghiVi, hết hạn, mẹ, phiên tự chặn) | BV-giu-ghivi, VS-giu-het-han, VS-giu-me, VS-kha-dung-tu-chan |
| H / cờ payOS | BV-ket-hop, VS-co-bo-vi-me, BV-co-payos, VS-co-chan-phien |
| Đối soát / sao lưu | BV-ds-ck, VS-ds-ck-vang, BV-ds-xnt, BV-backup-khong-kp |

Kết quả (chạy đủ ở a830070 + chạy lại 2 tên neo lại ở 9e3c4dd): **50/50 bị bắt** — 48 ở lượt đủ; BV-giu-ghivi (neo chuỗi cũ → HỎNG,
neo lại) và VS-pin-doc-roi (bản đầu không đưa đúng lỗi cũ → SỐNG, viết lại) bắt ở lượt chạy riêng. Đã thử và BỎ: VS-pin-dem-tuyet-doi
(E8 đua thật, không tất định — K3), VS-giu-ngoai-tai-khoan (không ca nào thử CACH_KHONG_KHOP — tiền vẫn an toàn nhờ đối chiếu tổng của taoDon).

Tên đột biến: BV-cong-phien VS-cong-changes BV-cong-orders BV-sau-ghi-don BV-chi-tinh BV-loi-phien BV-su-kien-tx BV-khoa-unique BV-chu-ky
VS-khoa-rong VS-so-tien BV-ve-muon-payos VS-that-bai VS-tien-client BV-chua-cau-hinh VS-noi-dung-10 VS-han-15-phut VS-tom-het-han
VS-chot-ca-payos BV-quyen-tay BV-ly-do-tay BV-nhat-ky-tay VS-quyen-seed-staff VS-pin-luu-tho BV-pin-lan-dau BV-pin-khop VS-pin-tho BV-pin-dem
VS-pin-doc-roi BV-pin-giu-cho VS-pin-nguong-6 VS-pin-nguong-4 VS-pin-khoa-30 BV-pin-me-cua-con BV-xoa-pin-quyen BV-bo-mat VS-kh-pin-sdt-than
BV-giu-ghivi VS-giu-het-han VS-giu-me VS-kha-dung-tu-chan BV-ket-hop VS-co-bo-vi-me VS-so-tien-du BV-co-payos VS-co-chan-phien BV-ds-ck
VS-ds-ck-vang BV-ds-xnt BV-backup-khong-kp

## Bước 6 (sau vòng 1) — HEAD a830070/9e3c4dd
- `thu_P3.js` 88 đạt · 0 hỏng. `npm test -- --day-du`: PASS 74 · FAIL 0 · CẢNH BÁO 1 (có sẵn); thu_P3 9,0 s, giả lập 36,5 s, thu_gia_lap 58,3 s.

## Bước 8 — soát độc lập vòng 2 (25.10) — nguyên báo cáo (rút gọn dòng, giữ nội dung)
```
KHÔNG ĐẠT — sáu lỗi vòng 1 đã sửa đúng (PIN giữ chỗ pinKhach.js; j3b + VS-co-bo-vi-me; B6 dư + VS-so-tien-du; SỐ CA 88 khớp, gốc 4 · 40;
câu E14; lời báo khả dụng orders.js:905, wallets.js:194, 234). Chạy lại: dot_bien.py 50/50, đối chứng 88 · 0; npm test 70 · 0 · 1.
LỖI TÌM ĐƯỢC:
1. giuCho.js:53-56 — giữ hai lần trên cùng một ví khi parent_phone = SĐT khách + bật cả hai: khaDung(phoneMe) không trừ phần giu vừa tính
   (ví 50.000, đơn 100.000 → giữ 80.000). Chốt: ghiVi lần hai thiếu → 400 → phiên loi; payOS thì khách đã chuyển mà không có đơn. (suy từ code)
2. giuCho.js:52-56 + F4 — "quầy sau thấy phần đã giữ" chưa khoá tất định: đột biến đọc số dư + đang giữ NGOÀI giao dịch SỐNG. Chú thích
   giuCho.js:4 khẳng định điều bài không chứng minh. — K3 + K1.
3. giuCho.js:77-80 — nhánh payOS từ chối (502 PAYOS_LOI, phiên loi nhả phần giữ) không có ca; đột biến xoá câu nhả SỐNG. Phản hồi payOS
   sai chữ ký (payos.js:46) không có ca. — K3.
4. thanh-toan.js:325, giuCho.js:114 — nhánh KHO_BAN (webhook trả lỗi để payOS báo lại; phiên không loi) không ca; hai đột biến SỐNG. — K3.
5. giuCho.js:100 — vế het_han > ? trong cổng chốt không ca riêng (phép báo sớm giuCho.js:89 che); cần ca mocTruocTx lùi het_han. — K3.
6. wallets.js:230 + trang_thai.md "adjust CỘNG … F1 nạp K5 phủ" — sai: F1 gọi /topup (không khongAm); đặt lại khongAm: true cho adjust SỐNG. — K1 + K3.
7. Ngưỡng thiếu ca: PIN ^\d{4}$ (3 / 5 số); lý do ≥ 3 ký tự (chỉ có ca rỗng; số viết cứng, LUAT §3); PHIEN_KHONG_PHAI_CK không ca. — K3.
8. trang_thai.md thiếu: kết quả node tu_chay/cong.js chay; mục CHƯA KIỂM; trả lời các nghi ngờ vòng 1 (ma_payos chung khoá hai kho; xác nhận
   tay chốt hỏng không để dấu; chua_khop không có "đã xử lý"). — K1 / A16.
NGHI NGỜ: thanh-toan.js:326 — xác nhận tay trước, payOS báo sau → dòng CK ĐỎ lý do mơ hồ, có thể hoàn nhầm (K8); ma_payos = id phiên hai kho;
  nhân viên đặt PIN lần đầu cho khách chưa có PIN → vòng qua cờ VI_PHAI_QUA_PIN (đúng Q6, nên ghi Phát hiện); quầy Sales.jsx:628 đọc số dư thô
  customers-v2.js:146 (Phát hiện BH-1); kiemPin chạy hai lần khi SĐT mẹ = SĐT khách.
NGHIỆM THU: 10/10 có bằng chứng, thiếu một phần: A (payOS lỗi), B (KHO_BAN, hạn trong giao dịch), E (ngưỡng 4 số), F (F4 không tất định).
CHƯA SOÁT ĐƯỢC: --day-du; cong.js chay; payOS thật; pin_code cũ Turso; đột biến nháp M1–M35 chạy một lần; lỗi 1 chưa dựng ca.
Phát hiện ngoài phạm vi: reconcileWallet ghi tuyệt đối không trừ đang giữ; utils/giuCho require routes (đã duyệt 8.4); GIO hai nơi, ba hàm loi.
BÀI HỌC: KHOÁ — mỗi nhánh hỏng đụng tiền có ca TẤT ĐỊNH qua móc sẵn có; đua thật chỉ là bằng chứng khi đột biến đọc-ngoài-giao-dịch làm nó ĐỎ;
  ca SĐT mẹ = SĐT khách. NGUYÊN TẮC — phép báo sớm trước cổng thật → cổng thật cần ca riêng vượt phép báo sớm; "ca X phủ Y" chỉ ghi khi đột biến xoá Y làm X ĐỎ.
```

## Sửa theo soát vòng 2 (25.10) — commit 84c202d, 1c… (neo đột biến)
| Lỗi vòng 2 | Sửa | Ca khoá / đột biến |
|---|---|---|
| 1 giữ hai lần khi SĐT mẹ = SĐT khách | `giuCho.js` từ chối `ME_TRUNG_KHACH` trước PIN / giao dịch | F9 · BV-me-trung |
| 2 F4 không tất định | ca F4b: móc `mocTruocTx` cho phiên B tạo XONG giữa phép kiểm và giao dịch của A | F4b · VS-giu-truoc-tx (đọc số dư + đang giữ NGOÀI giao dịch) |
| 3 payOS từ chối / vỏ sai chữ ký | payOS giả có chế độ hỏng | A6 ×2 · BV-payos-nha, BV-payos-ky-vo |
| 4 KHO_BAN | móc ném lỗi bận ở câu cổng chốt | B14 ×2 · VS-webhook-ban, VS-loi-ca-ban |
| 5 vế hạn trong cổng | móc lùi het_han giữa phép báo sớm và giao dịch | F10 · VS-cong-bo-han |
| 6 câu "F1 nạp phủ adjust cộng" SAI | sửa câu; thêm ca số dư < đang giữ → điều chỉnh CỘNG qua | F8 · VS-adjust-khong-am |
| 7 ngưỡng | PIN 3 / 5 số; lý do 2 / đúng 3 ký tự (hằng `LY_DO_TOI_THIEU`); xác nhận tay phiên tiền mặt | E2b, D2b/D2c, D6 · VS-pin-5-so, VS-pin-3-so, VS-ly-do-2, VS-ly-do-4, BV-phien-khong-phai-ck |
| 8 hồ sơ | mục CHƯA KIỂM + trả lời nghi ngờ (dưới); cong.js chay ở bước 11 | — |
| nghi ngờ: xác nhận tay trước rồi payOS báo → ĐỎ lý do mơ hồ | lý do ghi rõ "đã xác nhận tay trước (người, đơn #) — tiền về đúng số: đối chiếu, KHÔNG hoàn". Vẫn ĐỎ (kế hoạch B9 đã duyệt kết quả chua_khop) | B9b |
| nghi ngờ: ma_payos trùng giữa hai kho | env.example dặn kho thử dùng kênh payOS riêng hoặc để trống | (cấu hình — CHƯA KIỂM) |

Đột biến thêm vòng 2: BV-me-trung VS-giu-truoc-tx BV-payos-nha BV-payos-ky-vo VS-webhook-ban VS-loi-ca-ban VS-cong-bo-han VS-adjust-khong-am
VS-pin-5-so VS-pin-3-so VS-ly-do-2 VS-ly-do-4 BV-phien-khong-phai-ck.
Kết quả: `python3 viec/P3/dot_bien.py` (đủ, HEAD 84c202d): đối chứng 100 đạt · 0 hỏng; 62/63 bị bắt — BV-ly-do-tay HỎNG (neo lời báo cũ, nay
là template) → neo lại → chạy riêng: bị bắt. **63/63.**
`thu_P3.js` 100 đạt · 0 hỏng. `npm test -- --day-du`: PASS 74 · FAIL 0 · CẢNH BÁO 1 (có sẵn); thu_P3 10,8 s, giả lập 35,9 s, thu_gia_lap 57,4 s.
Bằng chứng gốc dựng lại với bản 84c202d: 4 đạt · 43 hỏng, SỐ CA 100.

## Trả lời các nghi ngờ của người soát (vòng 1–2) — để nguyên, có lý do
- Xác nhận tay chốt hỏng 4xx → phiên `loi`, không sự kiện: quản lý thấy lỗi NGAY ở quầy (câu trả 4xx) và xử tại chỗ; phiên payOS mà tiền về
  sau đó vẫn thành dòng `chua_khop` ĐỎ (webhook ghi). Phiên `ck_tay` (QR tĩnh) không có báo nào từ ngân hàng — chỉ sao kê.
- Dòng `chua_khop` không có cách đánh dấu "đã xử lý" → ngày đó ĐỎ mãi: là quy tắc Đối soát (chủ quán quyết) → ghi Phát hiện, không tự làm.
- `PUT /api/kh/pin` không cần PIN cũ: đúng Q6 (đăng nhập App đã qua mã một lần). Nhân viên đặt PIN lần đầu cho khách chưa có PIN → vòng qua cờ
  `VI_PHAI_QUA_PIN` với khách đó: đúng Q6 (quầy đặt khi khách CHƯA có, khách gõ 2 lần) → ghi Phát hiện.
- `GIO` chép hai nơi / ba hàm `loi` khác dạng: mỗi file một dạng lỗi của tầng mình (route `res`, util `{status, body}`, PIN `{loi}`); gộp phải
  sửa `kh/loi.js` (ngoài Phạm vi). Để nguyên.

## CHƯA KIỂM (máy không kiểm được — nói thẳng)
- Định dạng payOS THẬT: đơn vị `expiredAt` (giây — chat đối chiếu tài liệu 24.10), chữ ký vỏ trả, dạng `transactionDateTime` (máy hiểu là giờ VN
  "YYYY-MM-DD HH:MM:SS"), payOS có gửi lại webhook khi máy chủ trả 409 / Render đang ngủ không. Bài thử dùng payOS GIẢ viết theo SDK.
- Khoá payOS thật trên Render, URL webhook đã khai ở payOS — chủ quán cài.
- Dữ liệu `pin_code` cũ trên Turso (Q7 xử: không băm = chưa có PIN).
- E8 / E10 là đua thật trong một tiến trình Node: E10 có đột biến tất định-về-kết-quả (VS-pin-doc-roi bắt 3/3 lần ở vòng 1; người soát vòng 2
  thấy 23 so · 7 khoá — số đổi giữa các lần, kết luận "> 3" không đổi). Turso (HTTP) độ trễ khác — chưa thử.
- `customers.js` GET `/:id` luôn 500 (có sẵn) → đường này chưa từng trả hồ sơ trong bài nên E6 không chứng minh được nó KHÔNG lộ (middleware
  bọc mọi `res.json` của router — cùng một hàm với 9 đường còn lại).
- Màn quầy / App KH chưa gọi các API này (BH-1, KH-MUA-1) — chưa thử tay.

## Phát hiện (thêm ở vòng 2)
- Quầy `Sales.jsx` đọc số dư thô từ `customers-v2.js` (Đã duyệt 11: không sửa) → có phần đang giữ thì quầy đề nghị số không tiêu được; BH-1 dùng
  `GET /wallets/:phone` (`kha_dung`).
- `reconcileWallet` ghi tuyệt đối, không biết phần đang giữ (đối soát thủ công — chủ quán bấm).
- Dòng `chua_khop` cần cách "đã xử lý" ở màn Đối soát (chủ quán quyết luật).
