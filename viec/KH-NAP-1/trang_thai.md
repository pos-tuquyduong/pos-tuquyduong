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

## Câu hỏi
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
