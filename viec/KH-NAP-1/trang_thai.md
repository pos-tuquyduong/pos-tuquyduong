# KH-NAP-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (15.11.2026)
- Nhánh: `viec/KH-NAP-1`; cây sạch (không file đã theo dõi đang sửa).
- `git fetch origin viec/KH-NAP-1` → HEAD `6fe3f4f` · FETCH_HEAD `6fe3f4f` (bằng nhau — không kéo).
- `git log --oneline -3`:
  - 6fe3f4f PHIEU: KH-NAP-1
  - d8f0053 TIEN-DO: QC-APP-1 (5568725) + ND-API-1 (1a71424) xong; KH-NAP-1 gop luat the khong tra so du + nap App qua don, mo (Opus lan 2); them BAO-MAT-POS-1, VOUCHER-3; quyet dinh 12-14.11 (Q24, tien ve muon du quyen loi); lich 14.11; KHUON_LOI bo sung — so v66
  - 1a71424 Merge pull request #93 from pos-tuquyduong/viec/ND-API-1
- Có commit `PHIEU: KH-NAP-1`. Kho nông (`git rev-parse --is-shallow-repository` → true).

## Bước 2–3
- Đã đọc: phiếu, CLAUDE.md, KHUON_LOI.md, code thật donApp.js · giuCho.js · thanh-toan.js · orders.js (khối nạp / thẻ 220–290, 520–580,
  970–1060) · viKhach.js · wallets.js (ghiVi, LOAI_TINH_VAO_VI) · goi-nap.js · routes/kh/index.js · loi.js · DonApp.jsx · ThuTien.jsx · tinh.js.
- Đo thật bài cũ phải sửa (Q-C): bản sao nháp, chặn thử thẻ trả số dư ở orders.js + giuCho.js (4 dòng), chạy `npm test` và giả lập —
  kết quả ghi trong `ke_hoach.md` mục Q-C.
- Kế hoạch: `ke_hoach.md`. Phiếu "Chờ duyệt kế hoạch" → commit, push, DỪNG ở bước 3.

## Lượt 2 — làm theo kế hoạch đã duyệt (15.11.2026)
- Bước 1: `git pull --ff-only` (hook mở phiên đã kéo fccef122 → 6ca94f07). Nhánh `viec/KH-NAP-1`, HEAD = FETCH_HEAD `6ca94f07`.
  `git log --oneline -3`: 6ca94f07 PHIEU: KH-NAP-1 duyet ke hoach … · ab2a9d58 GOP-KH-NAP-1 gop main a7a09bc … · a7a09bc4 TIEN-DO: VOUCHER-2 (ba0d2c1) xong …
- Đọc lại file chung sau gộp VOUCHER-2 (orders.js khối nạp nay chặn cả `vouchers`; donApp.js có `vouchers` / `voucher_loi`; giuCho.js giữ voucher Q16;
  hợp đồng PHIEN_BAN 16 đã gồm v15 + v16). Lệch kế hoạch nhỏ, không đổi lớn — ghi dưới.
- **Chỉnh so với kế hoạch (nhỏ, không đổi hướng):**
  1. Điểm 4 phiếu (VOUCHER-2): đơn nạp + `ma_giam` / `vouchers` ở bước TÍNH THỬ (`phien.tinhThu` — báo giá App, `/tinh-thu`) đi luật VOUCHER-2 sẵn có
     (`MA_KHONG_AP_MON_THUONG` ở `ma_giam_loi` / `voucher_loi`); đơn ghi thật / tạo phiên vẫn chặn cứng `NAP_CHI_TIEN_MAT_QR` như NAP-1 (thu_NAP1 B8 xanh).
     donApp: `maDung = null` khi giỏ nạp → đặt đơn không mang mã, không giữ voucher.
  2. Tên dòng nạp: `chiTiet.items` của taoDon không mang `product_name` → thêm `tenDongNap(goi)` ở viKhach.js, dùng ở CẢ orders.js (khối dòng nạp) và
     donApp.js (thân đơn chưa trả) — một chỗ dựng chuỗi (K4).
  3. `muonChot` bỏ vế `p.trang_thai !== 'loi'`: chotPhien kiểu muộn chỉ nhận `cho` / `huy` → phiên `loi` trả PHIEN_DA_CHOT rồi vào ví như cũ (ca A6
     phiên "loi" xanh). Bớt một vế thừa.
  4. orders.js: điều kiện "trừ tài khoản" tách khỏi khối nạp thành `loiTienThat` (nạp → `NAP_CHI_TIEN_MAT_QR`, thẻ → `THE_KHONG_TRA_VI`), đặt TRƯỚC cổng PIN.
- Ngoài khối chặn ở giuCho.js: ĐÚNG một dòng `const muon = them.muon === true;` + hai chú thích (chủ quán duyệt 15.11). orders.js: khối chặn nạp / thẻ
  + dòng tên gói nạp (khối dòng nạp).

### Chỗ vá → đột biến (`viec/KH-NAP-1/dot_bien.py`, 39 đột biến · BẮT 39 — VS-muon-p-cu bắt sau khi siết ca A6 "mọi lần báo")
| Chỗ vá | Đột biến |
|---|---|
| orders.js `loiTienThat` trước cổng PIN | BV-the-quay · VS-the-chi-balance · VS-the-chi-payment · VS-the-sau-pin |
| viKhach.js `loiTienThat` | VS-tien-that-chi-nap |
| giuCho.js chặn lúc giữ | BV-the-giu |
| giuCho.js `muon` | BV-muon-chot-giu |
| donApp.js docGio dòng nạp | BV-nap-docgio · VS-nap-so-luong · VS-nap-nhieu · VS-nap-gio-mon |
| donApp.js GIU_MA | BV-nap-giu-ma |
| donApp.js baoGia ghép / maDung | VS-nap-ghep · VS-nap-ma-dung |
| orders.js tinhThu mã nạp mềm | VS-tinh-thu-cung |
| donApp.js bamGio | BV-bam-nap |
| tên dòng nạp (donApp thân + orders) | BV-than-ten-nap · VS-ten-quay-rieng |
| donApp.js chiTietDon / dsQuay | BV-chi-tiet-nap · BV-quay-co-nap · VS-quay-mon |
| thanh-toan.js `muonChot` | BV-muon · VS-muon-moi-don · VS-muon-lech · BV-muon-cong · VS-muon-p-cu |
| thanh-toan.js ly_do phiên + donApp thongBaoTienVe | BV-muon-ly-do · BV-muon-ly-do-khach |
| goi-nap.js / kh/index.js `/goi-nap` | VS-goi-tat · VS-goi-truong |
| lichSuVi.js / kh/index.js `/vi` | VS-vi-loai · VS-vi-me · VS-vi-ghi-chu · VS-vi-nhan-dong · VS-vi-tru-tay · VS-vi-phone |
| tinh.js / BanHangMoi.jsx / DonApp.jsx | BV-ui-the · BV-ui-ban-hang · BV-ui-don-app |

Tên đột biến (đủ): BV-the-quay, BV-the-giu, VS-the-chi-balance, VS-the-chi-payment, VS-tien-that-chi-nap, VS-the-sau-pin, BV-nap-docgio, VS-nap-so-luong,
VS-nap-nhieu, BV-nap-giu-ma, VS-nap-gio-mon, VS-nap-ghep, VS-nap-ma-dung, VS-tinh-thu-cung, BV-bam-nap, BV-than-ten-nap, VS-ten-quay-rieng, BV-chi-tiet-nap,
BV-quay-co-nap, VS-quay-mon, BV-muon, VS-muon-moi-don, VS-muon-lech, BV-muon-cong, BV-muon-ly-do, VS-muon-p-cu, BV-muon-chot-giu, BV-muon-ly-do-khach,
VS-goi-tat, VS-goi-truong, VS-vi-loai, VS-vi-me, VS-vi-ghi-chu, VS-vi-nhan-dong, VS-vi-tru-tay, VS-vi-phone, BV-ui-the, BV-ui-ban-hang, BV-ui-don-app.
Đối chứng (bản chưa đột biến) XANH 57/57.

### Bài cũ sửa (G2) — luật đổi có chủ ý (chủ quán 14.11), bài sửa thường: bản cũ đỏ trên code mới, bản mới đỏ trên gốc (bang_chung_do.txt)
- `cong_cu/thu_P2223.js` D5: "mua thẻ trả đủ bằng ví → 200" → ca CHẶN `THE_KHONG_TRA_VI` + ca K5 cùng đơn trả tiền mặt → 200, 1 dòng mua thẻ.
- `cong_cu/thu_P24.js` I1c: đơn thẻ nền trả tiền mặt (huỷ hoàn đủ vào tài khoản — HUY-1); thêm I1d "thẻ trả ví → `THE_KHONG_TRA_VI`" (đỏ trên gốc).
- `cong_cu/thu_HD1.js` A19: đơn mua thẻ nền trả tiền mặt (ví chỉ cho đơn đồ uống A22); thêm ca "thẻ trả đủ bằng tài khoản → `THE_KHONG_TRA_VI`" (khách riêng đủ số dư).
- `cong_cu/thu_KHTHE1.js`: helper `datVi` → `datTra` (QR + tiền về đúng hạn) cho các ca B9/B9b/B10 (khoá gửi QR + webhook), C1–C3, E1–E5, G1b, G3/Q3 quầy, H1,
  GIO3, K5a, K5b, S1, D9; D1 → ca CHẶN ví + ca "đã thu QR → có hạng ngay, xong"; D3 `vi_qr` → ca CHẶN (không giữ ví); D6 song song → QR + hai báo tiền;
  D7 → về muộn CÓ hạng (A6) + xác nhận tay vẫn 409; E3 → dữ liệu CŨ (đơn thẻ trả ví) cho ý "không hoàn qua yêu cầu"; E4 → huỷ rồi tiền về CÓ hạng (A6);
  K1 (băm giỏ đồ uống cũ) giữ `vi` (đồ uống vẫn trả ví — K5).
- `cong_cu/thu_HOPDONG_KH.js`: thêm dữ liệu mẫu (một gói nạp bật, một dòng sổ ví) để thử đủ trường hai cửa mới.
- `cong_cu/gia_lap/kich_ban.js` KB22: đơn thẻ trả tiền mặt (giữ nạp nền để có ví) + ca "thẻ bằng ví → `THE_KHONG_TRA_VI`" (đỏ trên gốc). Số kịch bản 33 không đổi.
- Không ghi vào `## Bài thử cũ sửa` (phiếu G2).

### Kiểm
- `npm test`: PASS 118 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có sẵn). `node kiem_tra_truoc_khi_giao.js --day-du`: PASS 122 · FAIL 0 · CẢNH BÁO 1. Giả lập 33 KB · 18 BB ĐẠT.
- `(cd client && npm run build)` → `client/dist` mới (index-BJfGU42M.js).

## Soát độc lập — vòng 1 (agent /ra-soat, chép nguyên văn)
```
KHÔNG ĐẠT

LỖI TÌM ĐƯỢC:
1. server/routes/thanh-toan.js:183 + :192–197 cùng server/utils/giuCho.js:113–131 và :144 — cộng tiền hai lần khi cổng gửi lại cùng một báo — K4 + K3.
   Lần báo đầu: chốt muộn đơn chỉ nạp / chỉ thẻ hỏng (gói tắt, giá đổi, hạng cao hơn) → ghi ly_do, phiên vẫn 'cho' / 'huy', vaoVi cộng tiền (dòng vao_vi khoá K).
   giuCho.js:144 chốt muộn hỏng CỐ Ý không khoá phiên (luật viết cho xác nhận tay). Chủ quán bật lại gói / trả giá cũ, payOS / SePay gửi lại ĐÚNG báo K (chỉ
   Tingee kiểm khoá trước, thanh-toan.js:254). muonChot lại đúng (congKiaDaBao chỉ nhìn cổng KHÁC), chotPhien thành công, suKien gặp ON CONFLICT không ghi gì
   nhưng vaoGiaoDich không kiểm changes (giuCho.js:131) → vẫn tạo đơn nạp / lên hạng. Khách được cả tiền ví lẫn quyền lợi. Đối soát (lưới "vượt") không thấy.
   Bài thử ca "gói tắt" bật lại gói SAU cả hai báo, hai báo khác reference → không phủ. Gốc không có lỗ này. Vá gọn: vế `&& !p.ly_do` vào muonChot, hoặc
   suKien trả changes. Kèm ca "gói tắt → vào ví → bật lại → gửi lại cùng reference → ví không đổi, 0 đơn" + đột biến. (Chưa chạy được ca — người gác chặn.)
2. server/utils/lichSuVi.js:17, :24, :26 — GET /vi dán nhãn sai cho đơn của chính khách đã bị xoá (xoá cứng pos_orders, orders.js:2007) → "Trả hộ đơn…",
   "Hoàn tiền đơn trả hộ". Không có ca thử. Vá: không còn o → câu chung.
3. HOP_DONG_API_KH.md:66–67 — hợp đồng hứa sai: "hai cổng cùng báo → vào tài khoản, thong_bao_tien_ve nêu lý do" — thật ra hai cổng → chua_khop, KHÔNG cộng;
   tiền lệch số → vaoVi với ly_do null → câu báo không có lý do.
4. cong_cu/thu_KHNAP1.js — ba chỗ bỏ trống: C1 trần chung /menu không có ca (gỡ giuLuotMenu sống); D1 20 dòng / con_nua không có ca ngưỡng (sổ ~11 dòng);
   D1 "mới trước" các dòng cùng giây — đổi ORDER BY ASC có thể vẫn xanh.
5. Chú thích cũ: thanh-toan.js:26 "App KHÔNG tạo lại đơn khi tiền về muộn"; :155–158 "KHÔNG tạo đơn" cho mọi phiên App về muộn; lời 409 :92 "tiền về muộn tự
   cộng vào tài khoản khách"; donApp.js:54 hai chú thích dính một dòng.

NGHI NGỜ: orders.js:242 quầy POST /tinh-thu giỏ nạp + mã / voucher nay 200 + ma_loi trong khi POST /orders 400 — lệch "số tinh-thu = số POST", ngoài phiếu
(điểm 4 chỉ nói báo giá App), không ca thử quầy. lichSuVi.js:24 dòng purchase cũ order_id NULL → "Quán điều chỉnh số dư". kh/index.js:276 ?trang rất lớn →
OFFSET tràn → có thể 500. Ca E2 tự viết SQL doanh thu (trọng tài chép công thức). Gốc: mục C sập ngay → A6 chỉ canh bằng đột biến. donApp.js:82 giá gói nạp đổi
→ lý do có thể "vì giá món đã đổi".

NGHIỆM THU: 23/27 · thiếu: A6 (ca báo lặp sau khi đã vào ví), C1 (trần chung), D1 (ngưỡng trang), E2 (một phần).
CHƯA SOÁT ĐƯỢC: ca lỗi 1 chưa chạy; 3/39 đột biến; chưa npm test / cong.js chay; chưa đọc từng ca sửa của bài cũ; CHECKLIST mục G; nhịp gửi lại thật của cổng.
Cấm: orders.js / giuCho.js chỉ đụng đúng chỗ cho phép.
BÀI HỌC: KHOÁ ca "lần đầu hỏng → vào ví → gỡ nguyên nhân → gửi lại CÙNG khoá → không ghi gì thêm" + đột biến; KHOÁ vaoGiaoDich / suKien kiểm changes khi dòng
báo là khoá chống trùng; KHOÁ cửa phân trang có ca ngưỡng ±1. NGUYÊN TẮC K4: dùng lại hàm có cờ nới luật cho đường gọi MỚI → rà mọi luật "không khoá / cho thử
lại" của hàm đó. NGUYÊN TẮC K1: sửa luật trong hợp đồng → liệt kê từng nhánh "không chốt được" theo code thật.
```

## Vòng sửa 1 (theo soát vòng 1)
- Lỗi 1 (tiền — cộng hai lần): tái hiện bằng ca mới "gói bật lại rồi cổng gửi lại ĐÚNG báo cũ" → ĐỎ trên code trước vá (ví 305.000 = 200.000 + đơn nạp 105.000).
  Vá: `muonChot` thêm vế "báo này chưa từng được ghi" (`pos_payos_su_kien.khoa` — khoá của chính cổng) — thanh-toan.js. Không đụng giuCho.js. Đột biến BV-muon-khoa BẮT.
  Chọn vế theo khoá thay vì `!p.ly_do` (agent đề xuất): khoá đúng NGUYÊN NHÂN (báo đã xử lý), còn khoản chuyển MỚI (khoá mới) sau khi gỡ nguyên nhân vẫn được chốt.
- Lỗi 2: `/vi` đơn của chính khách đã xoá → câu chung (`traHo` chỉ khi đơn CÒN và là của người khác) — lichSuVi.js. Ca D4 mới ĐỎ trước vá; VS-vi-don-xoa BẮT.
- Lỗi 3: hợp đồng v17 tách từng nhánh "không chốt được" (gói tắt / giá đổi / hạng cao hơn → vào ví có lý do; lệch số → vào ví câu chung; hai cổng → không
  cộng; cổng gửi lại → không ghi gì).
- Lỗi 4: thêm ca C1 trần chung `/goi-nap` với `/menu` (BV-goi-tran BẮT), D1 21 dòng / 20 dòng (ngưỡng trên + dưới, giờ khác nhau từng dòng — VS-vi-trang,
  VS-vi-thu-tu BẮT), ca K5 quầy tính thử nạp + mã (200 + MA_KHONG_AP_MON_THUONG) / ghi đơn nạp + mã (400 NAP_CHI_TIEN_MAT_QR).
- Lỗi 5: sửa chú thích thanh-toan.js (đầu file laPhienApp, xuLyTienVe Q1b), lời 409 PHIEN_APP_KHONG_TAO_LAI, tách chú thích GIU_MA donApp.js.
- Nghi ngờ "quầy /tinh-thu nạp + mã đổi hành vi": CÓ CHỦ Ý theo điểm 4 khối duyệt 15.11 (luật VOUCHER-2 cho dòng không giảm ở bước tính thử — báo giá App đi
  CHÍNH lời gọi tinh-thu); màn Bán hàng mới ẩn mã khi giỏ nạp; ghi đơn vẫn 400. Khoá bằng ca K5 quầy (mục G của bài).
- Thêm: `GET /vi` trần `trang` ≤ 100000 (OFFSET không tràn).
- Đột biến: 44 · BẮT 44 (sau khi sửa neo BV-nap-giu-ma, BV-muon-cong theo dòng mới). `--day-du` PASS 122 · FAIL 0.

## Soát độc lập — vòng 2 (agent /ra-soat, chép nguyên văn phần kết luận)
```
ĐẠT
(a) Lỗi vòng 1 đã vá đúng và đủ: lỗi 1 muonChot thêm vế khoá (payOS / SePay gửi lại → vaoVi ON CONFLICT changes 0; Tingee kiểm khoá trước trả '02';
SePay + payOS cùng giao dịch → congKiaDaBao; hai báo cùng khoá cùng lúc → câu UPDATE phiên chỉ cho một bên; khoá khác = giao dịch mới; phiên giữ ví cũ →
loiTienThat 400 → vào ví). Lỗi 2–5 đã vá.
LỖI TÌM ĐƯỢC: không có lỗi chắc chắn. NHẸ: 1. giuCho.js:139 chú thích "chốt muộn hỏng KHÔNG khoá phiên: khách nạp thêm rồi xác nhận lại được" chỉ còn đúng
cho xác nhận tay quầy — ngoài quyền sửa (Cấm) → Phát hiện. 2. thu_KHNAP1.js:301 tên ca "hai báo song song" nhưng helper webhook tăng reference → hai khoá khác.
3. Ca lỗi 1 chỉ payOS, chưa SePay. 4. trang_thai chưa ghi kết quả `node tu_chay/cong.js chay`.
NGHI NGỜ: 1. (TIỀN, khả năng rất thấp) thanh-toan.js:186–187 kiểm khoá NGOÀI giao dịch, vaoGiaoDich (giuCho.js:130) không kiểm changes của suKien → hai bản
cùng khoá gần như cùng lúc + chủ quán bật lại gói giữa chừng: A chốt hỏng → vào ví, B chốt được → suKien ON CONFLICT → vẫn tạo đơn → cộng hai lần. Đề nghị
suKien trả changes / vaoGiaoDich dừng khi 0 + đột biến. CHƯA KIỂM (không dựng được ca tất định). 2. quầy /tinh-thu nạp + mã 200 vs POST 400 — có chủ ý, có ca.
3. "vì giá món đã đổi" cho gói nạp — đã ghi Phát hiện.
NGHIỆM THU: 27/27 mục có bằng chứng · mục thiếu: không (báo trùng / gửi lại cùng khoá của A5 / A6 chỉ một phần — NHẸ 2, 3).
Cấm: orders.js chỉ import :28, khối chặn :239–251, tên gói nạp :577; giuCho.js chỉ import :18, khối chặn :46–48, dòng muon :113, hai chú thích.
CHƯA SOÁT ĐƯỢC: cuộc đua NGHI NGỜ 1; nhịp gửi lại thật của payOS / SePay; --goc; từng ca bài cũ ngoài KHTHE1 / KB22; thử tay giao diện.
BÀI HỌC: KHOÁ dòng báo chống trùng kiểm changes TRONG giao dịch ghi; KHOÁ helper bài thử tự sinh khoá → ca báo lặp truyền khoá cố định; NGUYÊN TẮC K4 nới cờ
cho đường gọi mới → grep mọi chú thích / luật "cho thử lại" của hàm.
```

## Vòng sửa 2 (nghi ngờ tiền của soát vòng 2 + nhẹ 2)
- Dựng được ca TẤT ĐỊNH cho cuộc đua: bài chạy máy chủ cùng tiến trình → móc `db.beginTransaction` chen một dòng báo cùng khoá đúng lúc giữa phép kiểm khoá
  (ngoài giao dịch) và giao dịch chốt. Trước vá ĐỎ: đơn nạp 105.000 vẫn tạo.
- Vá TRONG thanh-toan.js (không đụng giuCho.js — Cấm): `suKien` của chốt muộn kiểm `changes` của dòng báo; 0 → ném → taoDon rollback cả giao dịch (không đơn),
  cổng nhận 5xx gửi lại → lần sau phép kiểm khoá thấy → nhánh vaoVi (ON CONFLICT, không ghi thêm). Đột biến BV-muon-dua BẮT.
- Phép kiểm khoá trước (vòng 1) vẫn cần: không có nó thì lần gửi lại đi vào chốt rồi ném → 5xx mãi → ca "gửi lại báo cũ" nay đòi 200 (BV-muon-khoa BẮT).
- NHẸ 2: hai ca "hai báo song song" (A5, A6) nay dùng CÙNG reference (bản sao thật).
- NHẸ 3 (SePay gửi lại) không thêm ca: cùng một hàm xuLyTienVe + cùng cột khoá, khác cổng chỉ ở cách dựng khoá — ghi CHƯA KIỂM.
- Đột biến: 45 · BẮT 45 (đối chứng 64/64). `--day-du` PASS 122 · FAIL 0 · CẢNH BÁO 1.

## Soát độc lập — vòng 3 (agent /ra-soat, chép nguyên văn phần kết luận)
```
ĐẠT (có một nghi ngờ tiền, khả năng rất thấp)
LỖI TÌM ĐƯỢC: không có lỗi chắc chắn.
NGHI NGỜ: 1. thanh-toan.js:186 — TIỀN, khả năng rất thấp, K4: bản vá vòng 2 chỉ phủ cùng khoá; vế `!(await congKiaDaBao({ query }, t))` vẫn kiểm NGOÀI giao
dịch. Cổng C (SePay) và A (payOS) báo cùng khoản gần như cùng lúc: C chốt muộn hỏng (gói tắt) → vào ví; chủ quán bật lại gói; A đã qua phép kiểm trước khi
dòng của C ghi → chốt được, suKien ghi khoá của A changes 1 → có đơn nạp → cộng hai lần. Vá gọn: `if (muonChot && (r.changes !== 1 || await congKiaDaBao(tx, t)))
throw …` + ca chen dòng cổng kia + đột biến. 2. thu_KHNAP1.js:394–403 NHẸ K3: ca đua chỉ khoá lần đầu (500), không ca "gửi lại → 200". 3. trang_thai.md NHẸ:
chưa ghi `node tu_chay/cong.js chay`.
(a) Vòng sửa 2: lỗi ném huỷ CẢ giao dịch (orders.js:1278–1282 rollback; số hoá đơn, phiên da_thu, đơn / ví / thẻ cùng tx); 500 LOI_MAY_CHU câu trung tính, câu
"KH-NAP-1: …" chỉ vào console.error; chotPhien không đánh dấu 'loi'. Gửi lại sau đua → khoá thấy → vaoVi ON CONFLICT → 200. Tingee kiểm khoá trước. Không ném
oan (chốt muộn lần đầu changes 1; bản sau cùng khoá return false trước suKien; chốt đúng hạn giữ hành vi cũ). Ca tất định đo đúng cuộc đua. BV-muon-dua,
BV-muon-khoa BẮT.
NGHIỆM THU: 27/27. Cấm: đúng. P1 dist: --day-du PASS 122.
CHƯA SOÁT ĐƯỢC: 45 đột biến (chỉ 2); cong.js chay; cổng có gửi lại khi 5xx không; mục 1 chưa dựng ca.
BÀI HỌC: KHOÁ mọi phép kiểm "chặn chốt muộn" ngoài giao dịch phải kiểm lại TRONG suKien, mỗi vế một ca chen + đột biến; NGUYÊN TẮC K4 vá cuộc đua một vế →
rà mọi vế cùng vị từ đọc ngoài giao dịch; KHOÁ ca đua có bước "gửi lại → 200, không cộng".
```

## Vòng sửa 3 (nghi ngờ tiền của soát vòng 3 — vòng sửa CUỐI trong giới hạn 3)
- Ca TẤT ĐỊNH "cổng KIA báo xen giữa lúc chốt muộn" (móc beginTransaction chen dòng khoá `sepay:…`) → ĐỎ trước vá (đơn nạp 105.000 tạo, gửi lại 200).
- Vá trong thanh-toan.js `suKien`: `if (muonChot && (r.changes !== 1 || await congKiaDaBao(tx, t))) throw …` — mọi vế chặn của muonChot đọc ngoài giao dịch
  nay đọc lại trong giao dịch (vế trạng thái phiên do câu ghi phiên chotPhien khoá; `con_lai` / `than` không câu ghi nào đổi — soát cuối grep xác nhận).
- Ca đua cùng khoá thêm bước "gửi lại → 200, không đơn"; ca "cổng kia đã báo" đòi 200. Đột biến BV-muon-dua-cong BẮT; BV-muon-cong nay bắt bởi ca đòi 200.

## Soát cuối vòng sửa 3 (agent độc lập, chép nguyên văn phần kết luận)
```
ĐẠT — vòng sửa 3 đóng đúng lỗ đua "cổng kia". 65 đạt · 0 hỏng; BV-muon-dua, BV-muon-dua-cong, BV-muon-khoa BẮT (đối chứng 65/0).
1. congKiaDaBao(tx, t) đúng giao dịch (database.js:1599–1602; giuCho.js:131 sau câu ghi phiên); không tự đếm dòng 'khop' của chính cổng (congCuaKhoa theo tiền
tố, khoá payOS / sepay: / tingee:); không ném oan (chốt đúng hạn chặn bởi vế muonChot; một cổng; that_bai / khong_phien / tài khoản khác bị loại).
2. Sau khi ném: rollback trọn → 500 LOI_MAY_CHU; phiên không 'loi'; gửi lại → muonChot false → vaoVi → congKiaDaBao true → chua_khop + LY_DO_HAI_CONG,
không cộng, 200. Tingee không bị '02' oan.
3. Ca thử mới đo đúng; chenKhoa reset.
4. Vế khác: vaoViDuoc — câu ghi phiên khoá; con_lai — không câu UPDATE nào đổi (grep server/); than — không đổi. Hai khoá khác cùng cổng → câu ghi phiên một bên.
LỖI: không lỗi tiền / bảo mật. NHẸ: thanh-toan.js:135–136 chú thích congKiaDaBao "tx: câu đọc ĐẦU giao dịch ghi" cũ (K1); bang_chung_do.txt / trang_thai.md
chưa commit phần vòng sửa 3 (K7).
NGHI NGỜ: cổng nhận 5xx mà không gửi lại → báo của cổng này không để lại dòng (tiền vẫn có vết qua dòng cổng kia); ca chưa khoá dòng chua_khop + LY_DO_HAI_CONG
của lần gửi lại.
CHƯA SOÁT ĐƯỢC: song song thật trên Turso; gửi lại thật của cổng; npm test / --day-du / cong.js.
BÀI HỌC: NGUYÊN TẮC 1 — mọi vế chặn của một quyết định đọc ngoài giao dịch phải đọc lại trong giao dịch; vế nào không có câu ghi đổi được thì ghi rõ bằng grep.
```

## Vòng sửa 4 (LUAT_XAY_APP §6.5 — hết 3 vòng, lần soát cuối chỉ còn lỗi NHẸ; chat soát thay)
- Chú thích `congKiaDaBao` (thanh-toan.js) theo cách gọi mới (trong giao dịch ở vaoVi và ở chốt muộn; `{ query }` ngoài giao dịch chỉ là báo sớm).
- Ca "cổng KIA báo xen" thêm kiểm lần gửi lại ghi dòng `chua_khop` + "cùng một khoản báo qua hai cổng" (CẦN XEM); đột biến VS-hai-cong-khong-can-xem BẮT.
- Hồ sơ vòng sửa 3 (bang_chung_do.txt, trang_thai.md) commit cùng lượt này.
- Đột biến 47 · BẮT 47 (đối chứng 65/65). `--day-du` PASS 122 · FAIL 0 · CẢNH BÁO 1.
SOÁT LẦN CUỐI: chat soát thay

## Soát bảo mật
Lần 1 (15.11.2026, `/soat-bao-mat`, subagent độc lập chỉ đọc, diff `6ca94f07..HEAD` — phần gộp main ab2a9d58 không thuộc việc này). Số lỗi trước lọc: 0 ·
sau lọc: 0 (bước 2 không tìm được gì → không cần bước 3 lọc). Báo cáo nguyên văn:
```
Không tìm thấy lỗ hổng.
- GET /api/kh/vi (kh/index.js:275, lichSuVi.js): sau router.use(xacThucKhach) dòng 192; SĐT từ req.khach.phone; SQL tham số ?; trang ép số nguyên có trần;
  ma_don chỉ khi đơn của chính SĐT token; ghi_chu câu cố định. Không đọc được dữ liệu khách khác.
- GET /api/kh/goi-nap (kh/index.js:163): công khai, chỉ 4 trường (ma, ten, tra, vao) của gói đang bật.
- Dòng nạp trong đơn App (donApp.js docGio, thanDon): danh sách trắng TRUONG_NAP; giá máy chủ tự tra trong taoDon; gộp → NAP_KHONG_GOP; mã giảm bỏ ở datDon;
  nới mã / voucher chỉ ở bước tính thử (phien?.tinhThu là tham số nội bộ); đơn ghi thật chặn cứng.
- loiTienThat: gọi ở giuCho.taoPhien và orders.js taoDon trước cổng PIN / payOS; đầu vào là goi_nap_id / membership_buy của thân đơn — không né bằng cách_tra.
- Webhook tự chốt tiền về muộn (thanh-toan.js:186-204, giuCho.js:112-149): chữ ký kiểm ở cả ba cổng trước xuLyTienVe (221, 235, 255); chỉ chốt khi đúng con_lai,
  thân chỉ thẻ / chỉ nạp, cổng kia chưa báo; chống phát lại: khoá đã có thì không chốt, trong giao dịch suKien kiểm changes !== 1 rồi ném huỷ cả giao dịch; câu
  ghi phiên chỉ cho một bên. Cờ muon: grep chotPhien( chỉ hai chỗ đặt (route xác nhận tay có authenticate + checkPermission, webhook đã kiểm chữ ký).
  Phiên giữ chỗ không giữ ví. Khách chuyển hai lần cùng số cùng cổng: lần sau PHIEN_DA_CHOT → chua_khop, không tự cộng.
- Giao diện: chỉ hiển thị, không dangerouslySetInnerHTML; máy chủ tự chặn.
CHƯA KIỂM: chỉ đọc code; không đọc lại payos.kiemChuKy / sepay.kiemBao / tingee.kiemBao (có từ trước, nhánh không đổi); chưa đọc phép so tổng của taoDon
khi chốt muộn lúc giá gói đổi (bài thử thu_KHNAP1 ca "giá gói đổi" canh hành vi này).
```
SOÁT BẢO MẬT: ĐẠT

Lần 2 (15.11.2026, sau vòng sửa 3 và 4 — thanh-toan.js đổi sau lần 1; subagent độc lập chỉ đọc, diff `13223485..HEAD` + bối cảnh `6ca94f07..HEAD`). Số lỗi trước
lọc: 0 · sau lọc: 0 (không cần bước lọc). Báo cáo nguyên văn (rút phần kết luận):
```
Không tìm thấy lỗ hổng.
Thay đổi chỉ hai chỗ: một dòng trong suKien của xuLyTienVe (thanh-toan.js:199 — `if (muonChot && (r.changes !== 1 || await congKiaDaBao(tx, t))) throw …`) và
chú thích congKiaDaBao (:135–137). Không đầu vào mới, không route mới; truy vấn vẫn tham số; kiểm chữ ký payOS / SePay / Tingee giữ nguyên.
- Câu hỏi nằm trong giao dịch: suKien gọi trong vaoGiaoDich (giuCho.js:131) ngay sau câu UPDATE phiên → da_thu; dòng báo của chính cổng bị loại theo
  congCuaKhoa(d.khoa) !== t.nguon (thanh-toan.js:141).
- Ném lỗi thì huỷ sạch: catch (txErr) của taoDon rollback rồi ném tiếp (orders.js:1278–1282); loiGhi 5xx không lộ lời nội bộ; tra(res, kq) 5xx cho cổng; không
  đơn / ví / dòng báo; phiên không đổi, không bị 'loi' (giuCho.js:145).
- Cổng gửi lại: kiểm trước giao dịch thấy dòng cổng kia → muonChot sai → vaoVi → congKiaDaBao đầu giao dịch → chua_khop, không cộng (thanh-toan.js:163–167).
- Hai cổng cùng chốt muộn một phiên: bên sau gặp phiên da_thu → PHIEN_DA_CHOT → chua_khop "hai cổng, không hoàn" (thanh-toan.js:212–219).
- Không đường vòng: muonChot đòi laApp, t.soTien === p.con_lai (máy chủ tra), chiTheNap(p); báo phải qua chữ ký trước xuLyTienVe.
Đã soát: tiêm SQL, bỏ qua xác thực / chữ ký webhook, phát lại webhook, cộng ví / chốt đơn hai lần, lộ lỗi, phân quyền theo khách — không phát hiện ≥ 7/10.
CHƯA KIỂM: chỉ đọc code; cách ly giao dịch Turso / libsql suy theo khoá ghi SQLite; chưa mở thân loiGhi.
```
SOÁT BẢO MẬT: ĐẠT

## Câu hỏi
(Hai câu dưới ĐÃ được chủ quán trả lời 15.11 trong phiếu — khối "DUYỆT kế hoạch" điểm 1, 2 — giữ lại làm lịch sử. Không còn câu hỏi mở.)
1. **(Cấm — giuCho.js ngoài khối chặn nạp / thẻ)** A6 cần sửa MỘT dòng trong `chotPhien` (giuCho.js): `const muon = nguon === 'tay' && them.muon === true`
   → `const muon = them.muon === true` (+ câu chú thích), để webhook tiền về muộn dùng CÙNG chotPhien kiểu muộn mà quầy dùng khi xác nhận tay.
   Đây là chỗ ngoài "khối chặn nạp / thẻ" mà mục Cấm cho phép → xin chủ quán duyệt cùng kế hoạch (chi tiết ở `ke_hoach.md` Q-A). Không duyệt thì A6 không
   làm được mà không viết đường chốt thứ hai (phiếu cấm).

2. **Đối soát cho đơn chốt muộn tự động (A6):** xác nhận tay muộn đang có mục CẦN XEM ở Đối soát (doiSoat.js phepXacNhanTay); đơn App chỉ thẻ / chỉ nạp
   mà máy TỰ chốt khi tiền về muộn thì không vào mục nào (tiền đã khớp đúng số, đúng phiên). Đề xuất: KHÔNG thêm mục (tiền đúng số, đúng đơn — giống tiền
   về đúng hạn); quầy vẫn thấy đơn ở màn Đơn App hôm đó. Bạn chỉ cần xác nhận, hoặc dặn thêm mục.

## Soát kế hoạch (agent phụ, chỉ đọc)
- Bắt 1 lỗi thật: khối chốt muộn bản đầu rơi về `vaoVi(p)` với phiên cũ → có thể vừa có đơn (quầy xác nhận tay lúc còn hạn) vừa cộng ví. Đã đổi sang cách
  ngắn hơn (một cờ `muonChot` trên lời gọi chotPhien có sẵn) — hết đường đó, thêm đột biến VS-muon-p-cu.
- Đã thêm: báo rõ lý do khi không chốt được; ca A7 hoàn / sự cố; ca giá gói đổi; ca thứ tự lỗi (NGOAI_GIO trước NAP_KHONG_GOP); `chiTinh` truyền `nap`;
  sửa hai chú thích giuCho.js:9, :97; ca D3 giờ VN, B2 cờ payOS bắt buộc, A8 `tra[]` + `GET /don`; dòng G1/G2 trong bảng.

## Phát hiện
- giuCho.js:139 chú thích "Chốt muộn hỏng (ví thiếu, giá đổi) KHÔNG khoá phiên: khách nạp thêm rồi xác nhận lại được" nay chỉ đúng cho xác nhận tay quầy — phiên App gọi chốt muộn từ webhook không xác nhận lại tay được. Ngoài quyền sửa (Cấm) — đề xuất sửa chữ ở việc sau.
- `GET /api/kh/don` cùng khuôn `?trang` không trần (kh/index.js, có từ KH-MUA-1) — số trang khổng lồ có thể làm tràn OFFSET → 500. Không sửa (ngoài mục tiêu); `/vi` đã có trần.
- Tiền về muộn của đơn nạp mà giá gói đổi → lý do khách thấy là "vì giá món đã đổi" (LY_DO_NGAN khớp "không khớp tổng") — chữ "món" chưa sát với gói nạp; tiền vẫn đúng.
- Ca E2 (doanh thu không tính đơn nạp App) dò bằng câu SQL theo dải product_id, không gọi route báo cáo — dựa vào sqlDonNap đã có bài NAP-1 canh.
- `cong_cu/thu_BH2.js` ca G1 đỏ trong kho nông (máy mây): `git log cbbb809..HEAD` → `bad revision` vì `cbbb809` không có trong lịch sử nông
  (`git cat-file -t cbbb809` → fatal). Không do việc này. Đã chạy `git fetch -q --unshallow origin viec/KH-NAP-1` (chỉ tải lịch sử, không đổi file) → `cbbb809` có.

## Cổng
`node tu_chay/cong.js chay . 6fe3f4f09c6f4bd7baee6eb7ba35c9013c4bdaad^ HEAD viec/KH-NAP-1` (đứng ở HEAD, cây sạch):
- Lần 1 (HEAD c8f5c6e0): ✗ CỔNG ĐỎ (CHẠY) — 9 lý do, cùng một loại: `✗ [A16] viec/KH-NAP-1/bang_chung_do.txt thiếu dòng "SỐ CA cong_cu/thu_<bài>.js: <N>"` cho
  thu_DANGNHAP2, thu_GOI1, thu_KH1, thu_KHAPI2, thu_NDAPI1, thu_P20, thu_P26c, thu_UUDAI1, thu_VOUCHER2 — các bài do commit GỘP MAIN ab2a9d58 mang vào (mốc
  cổng nằm trước commit gộp). Đã ghi số ca thật đo trên head, có ghi chú nguồn gốc (không đổi bài, không nới cổng).
- Lần 2 (HEAD 6b1667c3): ✓ CỔNG CHẠY ĐẠT. Ba CẢNH BÁO A16 (gốc dừng sớm: thu_HD1 139 ≠ 159, thu_KHNAP1 34 ≠ 65, thu_VOUCHER2 144 ≠ 146).

## Bài học
Sự cố của việc: (1) soát vòng 1 bắt lỗ TIỀN "cổng gửi lại cùng báo sau lần chốt muộn hỏng → cộng hai lần" (chốt muộn hỏng không khoá phiên — luật viết cho
xác nhận tay); (2) soát vòng 2 / 3 bắt hai cuộc đua: phép chặn của `muonChot` đọc NGOÀI giao dịch (vế khoá, vế cổng kia); (3) đột biến VS-muon-p-cu sống tới khi
siết ca "mọi lần báo"; (4) bài cũ HD1 đỏ trên gốc sai lý do (thiếu số dư thay vì luật thẻ) — K3; (5) cổng A16 đỏ vì mốc cổng trước commit gộp main;
(6) người gác chặn: B-BIMAT-CHU 6 lần (chạy bài có cụm khoá bí mật trước khi commit; cụm mã lỗi token trong lệnh Python), B-CHUONGTRINH 4 (vòng `for`),
B-PHANTICH 2 (Python + node một lệnh), GIT-RM `--cached`, GIT-LENH `worktree`, B-DICHCHU (biến `$S` làm đích ghi) — mỗi lần làm theo hướng dẫn, không lách.
- **KHOÁ (đã làm, trong Phạm vi):** cong_cu/thu_KHNAP1.js — ca TẤT ĐỊNH cho cuộc đua (móc `db.beginTransaction` chen dòng báo cùng khoá / cổng kia đúng lúc giữa
  phép kiểm ngoài giao dịch và giao dịch chốt), ca "gửi lại cùng khoá → 200, không ghi thêm", ca ngưỡng trang 21 / 20; đột biến BV-muon-khoa, BV-muon-dua,
  BV-muon-dua-cong, VS-vi-trang, VS-vi-thu-tu đều BẮT. Lý do KHOÁ: lỗi tiền chỉ lộ khi có ca tất định, lời dặn không đủ.
- **KHOÁ (đề xuất, ngoài Phạm vi):** tu_chay/cong.js — khi mốc `<PHIEU>^` nằm trước một commit `GOP-<MÃ> …` của chat, A16 lấy mốc là commit gộp đó (hoặc bỏ
  các bài chỉ đổi trong commit gộp). Ca đỏ: nhánh có commit `GOP-X` đổi một bài thử, việc không đụng bài đó → cổng hiện đòi SỐ CA cho bài đó.
- **NGUYÊN TẮC (đề xuất thêm vào KHUON_LOI.md K4, ngoài Phạm vi):** "Dùng lại một hàm có cờ nới luật (`muon`) cho một đường gọi MỚI do MÁY tự gọi lại (webhook
  cổng gửi lại) → rà mọi luật 'không khoá / cho thử lại' của hàm (viết cho người bấm tay) và MỌI vế chặn đọc ngoài giao dịch: đọc lại trong giao dịch, vế nào
  không câu ghi nào đổi được thì ghi rõ bằng grep. Đã gây: KH-NAP-1 soát vòng 1–3 (cộng hai lần khi cổng gửi lại; hai cuộc đua). Dấu hiệu: cờ đặt bởi route
  tay nay đặt bởi webhook. Chặn: ca chen tất định cho từng vế."
- **NGUYÊN TẮC (đề xuất K3, ngoài Phạm vi):** "Helper bài thử tự sinh khoá mới mỗi lần gọi (reference tăng) → ca 'báo lặp / song song' phải truyền khoá CỐ ĐỊNH;
  tên ca nói 'trùng' mà khoá khác là xanh oan (KH-NAP-1 soát vòng 2)." Có thể gộp vào dòng "tên ca nói một đằng, máy kiểm một nẻo" sẵn có của K3.
- **BỎ:** HD1 trùng tên biến `sv` (một lần, bài sập là thấy ngay); KB22 ví chưa có đọc ra NaN (một lần, helper giả lập).
- **Dọn:** không thấy lời dặn nào trong KHUON_LOI.md / CLAUDE.md mà phép kiểm của việc này làm thay.

## Báo cáo 7 mục
```
VIỆC:        KH-NAP-1 — Khách tự nạp trên App (dòng nạp trong đơn App, GET /goi-nap, GET /vi) + thẻ hạng / nạp chỉ trả tiền thật + hợp đồng /api/kh v17
ĐÃ SỬA:      server/utils/viKhach.js — loiTienThat (một vị từ nạp / thẻ không trừ số dư) + tenDongNap (một chỗ dựng tên dòng nạp)
             server/routes/orders.js — khối chặn nạp / thẻ: loiTienThat trước cổng PIN; tính thử nạp + mã / voucher theo luật VOUCHER-2; tên dòng nạp
             server/utils/giuCho.js — chặn lúc giữ dùng loiTienThat; đúng một dòng `const muon = them.muon === true` + hai chú thích (chủ quán duyệt 15.11)
             server/utils/donApp.js — dòng nạp (docGio, bamGio, thanDon, chiTinh, baoGia ghép, thân đơn, chiTietDon, dsQuay co_nap), GIU_MA 4 mã, lý do tiền về muộn
             server/routes/thanh-toan.js — xuLyTienVe: muonChot (đơn App chỉ thẻ / chỉ nạp về muộn đúng số → chốt qua CHÍNH lời gọi chotPhien), chặn báo đã ghi,
               suKien kiểm khoá + cổng kia TRONG giao dịch, ghi lý do khi không chốt được; chú thích, lời 409
             server/utils/lichSuVi.js (mới) — GET /vi; server/routes/kh/index.js — GET /goi-nap, GET /vi; server/routes/kh/loi.js — 4 mã; server/routes/goi-nap.js — dsGoiBat
             client/src/pages/BanHang/{tinh.js, BanHangMoi.jsx, ThuTien.jsx} — giỏ có thẻ tắt "Trừ tài khoản"; client/src/pages/DonApp.jsx — nhãn đơn nạp; client/dist build
             HOP_DONG_API_KH.md — v17; kiem_tra_truoc_khi_giao.js — nối thu_KHNAP1.js
BÀI THỬ:     cong_cu/thu_KHNAP1.js (mới, 65 ca) chạy trên gốc 6ca94f07 → ĐỎ (6 đạt · 28 hỏng, sập mục B, C, E); sau khi vá → 65 đạt · 0 hỏng. Bài cũ sửa (G2):
             thu_P2223 / thu_P24 / thu_HD1 / thu_KHTHE1 / thu_HOPDONG_KH / giả lập KB22 — đỏ trên gốc đúng ca luật mới, xanh sau vá (bang_chung_do.txt).
             Đột biến 47 · BẮT 47 (đối chứng 65/65). npm test PASS 118 · --day-du PASS 122 · FAIL 0. Cổng: ✓ CỔNG CHẠY ĐẠT.
ĐÃ RÀ K4:    grep mọi dạng trừ ví (balance_amount, parent_balance_amount, payment_method balance, tru_tai_khoan, tru_tai_khoan_me, cach tai_khoan) trong orders.js /
             giuCho.js → hai chỗ chặn (taoDon, taoPhien), một vị từ phủ đủ; grep "laDongThe" trong donApp.js → 4 chỗ đọc dòng thẻ, mỗi chỗ thêm nhánh dòng nạp
             (baoGia ghép, thân đơn, chiTietDon, dsQuay); grep "ghiVi(" + "INSERT INTO pos_balance_transactions" trong server/ → 10 chỗ ghi sổ ví, ánh xạ đủ trong
             lichSuVi.js (debt_payment loại); xuLyTienVe: mọi vế chặn muonChot đọc ngoài giao dịch (khoá, cổng kia) đọc lại trong giao dịch, vế trạng thái do câu
             ghi phiên khoá, con_lai / than không câu ghi nào đổi (soát cuối grep).
CHƯA KIỂM:   - Cuộc đua thật trên Turso (hai giao dịch song song thật) — bài thử chỉ mô phỏng bằng chen dòng một lần; cách ly giao dịch libsql chưa đo.
             - Cổng payOS / SePay / Tingee thật có gửi lại khi nhận 5xx hay không, có giữ nguyên reference khi gửi lại không.
             - SePay gửi lại cùng `sepay:<id>` sau chốt muộn hỏng: chưa có ca riêng (cùng hàm, cùng cột khoá với payOS).
             - Chưa thử tay giao diện trên điện thoại. Thử tay (chủ quán): (1) Bán hàng → thêm thẻ hội viên vào giỏ, chọn khách có số dư → nút "Trừ tài khoản" mờ,
               dòng "Thẻ hội viên chỉ trả tiền mặt hoặc chuyển khoản"; (2) giỏ đồ uống cùng khách → "Trừ tài khoản" bấm được như cũ; (3) màn Đơn App: đơn nạp từ
               App hiện dòng "💳 Nạp … — đã vào tài khoản, không pha", không nút Đang làm.
             - Dữ liệu production: dòng sổ ví cũ (purchase không order_id, nếu có) sẽ hiện "Quán điều chỉnh số dư" — chưa đo trên Turso.
             - E2 (doanh thu không tính đơn nạp App) kiểm bằng dải product_id, không gọi route báo cáo thật.
GIT:         6b1667c3 KH-NAP-1: soat bao mat lan 2 DAT; SO CA bai do commit gop main mang vao
             c8f5c6e0 KH-NAP-1: ho so soat vong 3, vong sua 3-4
BÀI HỌC:     KHOÁ 2 (1 đã làm trong Phạm vi: ca chen tất định + đột biến; 1 đề xuất: cổng A16 lấy mốc commit GOP) · NGUYÊN TẮC 2 (đề xuất K4 cờ nới luật cho
             đường máy tự gọi lại + vế đọc ngoài giao dịch; K3 khoá cố định cho ca báo lặp) · BỎ 2 — chi tiết ở ## Bài học
```

HEAD ĐÃ KIỂM: 6b1667c3
