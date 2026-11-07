# NAP-1 — Gói nạp tiền (quầy), thưởng nạp không hạn, ví hai ngăn, tích điểm khi tiêu ví, sổ sách tiền nạp

<!-- Phiếu do chat soạn 02.11.2026 (sổ v53). Việc [T] (tiền / ví) — Opus làn 2 SAU HANG-1, lập kế hoạch, DỪNG chờ duyệt.
     Thiết kế đã duyệt: thiet_ke/THIET_KE_DOT2.md mục M4. Tách 3 việc nối tiếp (chat soát lịch 02.11): NAP-1 (việc này: gói nạp ở quầy + ví
     hai ngăn tiền nạp / thưởng nạp + sổ sách), NAP-2 (App tự nạp bằng QR + cửa lịch sử ví), QUA-1 (quà chào mừng có hạn + đếm ngược). NAP-1
     dựng ngăn ví sao cho QUA-1 chỉ THÊM ngăn thứ ba (thứ tự trừ: quà chào mừng trước).
     Hiện trạng chat đọc 02.11 trên main d1b57b8: pos_wallets (phone, balance, total_topup, total_spent); sổ pos_balance_transactions (type,
     amount, balance_before/after, order_id, payment_method); routes/wallets.js POST /topup (nạp tay, quyền topup_balance), /deduct, /adjust;
     trả đơn bằng ví + ví mẹ trong orders.js / giuCho.js (P3, BH-2); điểm hiện KHÔNG tính phần trả bằng ví (luật 24.10 — ĐỔI ở việc này). -->

**Chờ duyệt kế hoạch:** viết `viec/NAP-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Quầy bán gói nạp ("trả 100.000 vào 105.000") như bán hàng; số dư tăng ngay; máy biết rõ phần nào là tiền khách trả, phần nào là thưởng — báo cáo
doanh thu thật không bị đội.

## Nghiệm thu
- A **Gói nạp** (Cài đặt sản phẩm, quyền quản lý sản phẩm): thêm / sửa / bật / tắt; mỗi gói "khách trả" > 0 và "vào tài khoản" ≥ "khách trả";
  sai → 400.
- B **Bán gói ở quầy:** nhóm "Nạp tiền" trên màn Bán hàng; bắt buộc chọn khách (SĐT); máy chủ tự tra gói; trả tiền mặt / QR (cổng QR đang chọn);
  KHÔNG trả bằng ví, KHÔNG mã giảm, KHÔNG giảm hạng, KHÔNG ghi nợ, KHÔNG gộp chung đơn có món (kế hoạch chọn: chặn gộp hay tách dòng — nêu lý do);
  thu đủ → số dư tăng NGAY trong cùng giao dịch, sổ ví ghi rõ phần nạp + phần thưởng. Huỷ trước khi thu đủ → không cộng gì.
- C **Ví hai ngăn:** số dư = tiền nạp + thưởng nạp (thưởng KHÔNG hạn). Mọi lối trừ ví (trả đơn, ví mẹ, trừ tay) trừ hai ngăn theo TỶ LỆ đang có;
  mọi lối cộng lại (hoàn đơn, huỷ đơn trả ví) trả về ĐÚNG ngăn đã trừ. Tổng hai ngăn LUÔN = balance (bất biến, có kiểm tra đối soát ví).
  Ví cũ (trước việc này) = toàn bộ là tiền nạp.
- D **Tiền nạp không hoàn:** không có lối hoàn tiền nạp; điều chỉnh tay (quyền adjust_balance) ghi lý do như hiện nay.
- E **Điểm:** lúc nạp KHÔNG tích điểm; trả đơn bằng ví (cả hai ngăn) CÓ tích điểm như tiền mặt (đổi luật 24.10 — chủ quán 01.11).
- F **Sổ sách:** Đối soát / báo cáo: tiền nạp vào két / QR đúng ngày (khớp két, sao kê); doanh thu bán hàng tách dòng "Thưởng nạp đã dùng" (khoản
  giảm); báo cáo "Quán đang giữ hộ khách" = tổng số dư cuối kỳ tách tiền nạp / thưởng nạp. Nạp không phải doanh thu.
- K5 **Không đổi:** nạp tay cũ (/topup) vẫn chạy (ghi toàn bộ là tiền nạp); trả ví, ví mẹ, ví + QR, P22-23 (điểm khi thu đủ), P24, hoàn; bài thử cũ xanh
  trừ phần CỐ Ý đổi ở E (ghi rõ trong kế hoạch).

## Phạm vi
- viec/NAP-1/**
- server/routes/wallets.js
- server/routes/orders.js
- server/routes/refunds.js
- server/routes/products.js
- server/routes/reports.js
- server/routes/loyalty.js
- server/utils/giuCho.js
- server/utils/doiSoat.js
- server/utils/diemThat.js
- cong_cu/gia_lap/bat_bien.js
- server/utils/viKhach.js
- server/routes/goi-nap.js
- server/index.js
- server/routes/backup.js
- server/nang_cap/014_nap.js
- server/nang_cap/chay.js
- client/src/**
- client/dist/**
- cong_cu/thu_NAP1.js
- cong_cu/thu_P20.js
- cong_cu/thu_P2223.js
- cong_cu/thu_P24.js
- cong_cu/thu_DIEMTHAT1.js
- cong_cu/thu_P3.js
- cong_cu/thu_KHMUA1.js
- cong_cu/thu_DOISOAT1.js
- kiem_tra_truoc_khi_giao.js
- server/routes/damages.js
- server/routes/packages.js

<!-- Chủ quán 05.11 (3 câu kế hoạch d5ddc8f):
     1 CÓ — thêm diemThat.js, cong_cu/gia_lap/bat_bien.js và 7 bài cũ (thu_P20, thu_P2223, thu_P24, thu_DIEMTHAT1, thu_P3, thu_KHMUA1, thu_DOISOAT1):
       chỉ sửa đúng các ca khoá luật điểm cũ, bài sửa thường (đỏ trên gốc, xanh sau vá, ghi SỐ CA).
     2 (a) — nhóm "Nạp tiền" chỉ ở màn Bán hàng mới (thiết kế M4 đã duyệt là bản vẽ); màn cũ giữ nạp tay (chỉ chủ quán — GIAO-DIEN-1). Khu Ví trong
       hồ sơ khách (GIAO-DIEN-1) sau này chỉ có nút dẫn sang Bán hàng với khách đó.
     3 — đền bù một phần đơn trả bằng tài khoản: chia THEO TỶ LỆ thưởng / tiền nạp của phần đã trừ.
     Nền: CHAT gộp main (đã có HANG-1, CT-1a, CK-NOIDUNG-1 khi gộp xong) vào viec/NAP-1 bằng script TRƯỚC khi chủ quán gửi "tiep"; máy không tự gộp. -->
<!-- Chủ quán 06.11 (câu hỏi sau soát vòng 3, nhánh 14243de):
     1 — ĐỒNG Ý VÒNG SỬA 4 (lỗi ví: lần đền cuối ghi ngăn thưởng lớn hơn chính khoản đền) — sửa đúng lỗi đó + ca thử đỏ/xanh + đột biến,
       soát lại một lần rồi đi tiếp (soát bảo mật, cổng chạy, báo cáo 7 mục, Bài học).
     2 — Tạo / sửa / bật / tắt GÓI NẠP chỉ CHỦ QUÁN (owner) và phải gõ PIN CHỦ QUÁN (dùng lại khoá PIN của HANG-1 — server/utils/pinChuQuan.js,
       chỉ gọi, không sửa), máy chủ chặn — không chỉ giấu nút. Quản lý / nhân viên vẫn BÁN gói ở quầy như phiếu. Không đặt trần % thưởng. -->

<!-- Chủ quán 06.11 (câu hỏi 06.11 (3), nhánh 90a2181): (a) + thêm hai file — đền bù trả vào tài khoản (damages.js) và kết thúc gói có hoàn tiền
     vào tài khoản (packages.js) TRỪ ĐIỂM giống duyệt hoàn: theo phần tiền trả vào tài khoản, chia tỷ lệ, làm tròn lên, cho âm như P24; dùng lại
     ĐÚNG hàm vừa viết (một quy tắc — một hàm). Ca thử đỏ / xanh + đột biến cho từng lối; soát bảo mật lại một lần; rồi đi tiếp (cổng chạy, báo cáo
     7 mục, Bài học). GIAO-1 cũng sửa damages.js — chỉ sửa đúng chỗ cần, chat lo phần đụng nhau khi gộp. -->
## Bài thử đỏ
Có — `cong_cu/thu_NAP1.js` ĐỎ trên code gốc: tạo gói + giá trị sai 400; bán gói tiền mặt / QR → số dư tăng đúng hai ngăn; chặn trả gói bằng ví / mã;
trả đơn bằng ví trừ đúng tỷ lệ; hoàn trả đúng ngăn; bất biến hai ngăn = balance qua chuỗi nạp → trả → hoàn → ví mẹ; điểm cộng khi trả ví, không
cộng khi nạp; báo cáo tách thưởng nạp đã dùng.

## Ngân sách
~320 dòng máy chủ + ~200 dòng giao diện + ~500 dòng thử.
**Phương án đơn giản nhất đã xét:** thêm MỘT cột "phần thưởng còn lại" cho ví + cột phần thưởng cho mỗi dòng sổ ví; một hàm trừ / cộng ví dùng
chung mọi lối (không rải phép tính tỷ lệ khắp nơi).

## Đổi cấu trúc DB
có — chỉ THÊM (bước 014): bảng gói nạp; cột ngăn thưởng của ví; cột phần thưởng của dòng sổ ví. Bảng mới vào BACKUP_TABLES; bảng ví / sổ ví vẫn
chặn khôi phục như hiện nay.

## Thư viện mới
không

## Soát bảo mật
có — tiền / ví: giá gói máy chủ tra, chặn vòng nạp bằng ví, quyền tạo gói.

## Cấm
Không làm App nạp (NAP-2), quà chào mừng (QUA-1). Không đổi cách tính giá hạng.
