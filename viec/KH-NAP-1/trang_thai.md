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
- `cong_cu/thu_BH2.js` ca G1 đỏ trong kho nông (máy mây): `git log cbbb809..HEAD` → `bad revision` vì `cbbb809` không có trong lịch sử nông
  (`git cat-file -t cbbb809` → fatal). Không do việc này. Đã chạy `git fetch -q --unshallow origin viec/KH-NAP-1` (chỉ tải lịch sử, không đổi file) → `cbbb809` có.
