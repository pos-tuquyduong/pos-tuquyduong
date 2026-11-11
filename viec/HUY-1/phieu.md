# HUY-1 — Huỷ đơn ở POS từ lúc nhận đơn: hoàn TOÀN BỘ tiền đã trả vào tài khoản khách (khách lẻ: trả tiền mặt), lý do bắt buộc, quản lý / chủ quán

<!-- Phiếu do chat soạn 05.11.2026 (sổ v54). Việc [T] (tiền) — Opus, lập kế hoạch rồi DỪNG chờ duyệt. LÀM sau khi CK-NOIDUNG-1 gộp (cùng sửa
     orders.js, donApp.js, doiSoat.js); lập kế hoạch được ngay.
     Chủ quán chốt 05.11 (chat claude.ai, bàn 32): (1) huỷ được ngay từ lúc nhận đơn, trước thao tác "xong" (đơn App vừa về, đơn đang pha, đơn
     đã xong); (2) quản lý + chủ quán huỷ đơn TRONG NGÀY, đơn ngày trước chỉ chủ quán; (3) khách có tài khoản: toàn bộ tiền đã trả (ví + tiền mặt +
     chuyển khoản) hoàn vào tài khoản khách — không chuyển tiền thật; khách lẻ (không SĐT) đến quán mua mà huỷ: TRẢ TIỀN MẶT (rất hiếm — ngoại
     lệ DUY NHẤT của luật "két không chi tiền mặt"); (4) huỷ là huỷ CẢ đơn, khách muốn thì đặt lại.
     Hiện trạng chat đọc 05.11 trên main 4723a3b: PUT /orders/:id/cancel (quyền cancel_order — đang BẬT cả staff, database.js ~1073) chỉ huỷ đơn
     'completed', hoàn PHẦN VÍ qua hoanVi (soTienHoan), trừ lại điểm (truDiemDon, P24), hoàn kho SX, từ chối yêu cầu hoàn đang chờ; phần tiền mặt /
     chuyển khoản KHÔNG được ghi gì. Nút "Xoá/Huỷ" ở client/src/pages/Orders.jsx chỉ hiện với owner. Đơn App: pos_don_app + phiên
     (server/utils/donApp.js, tiến trình 'da_huy'). Luật P26c (QUYET_DINH_CHU_QUAN.md) về gói / thẻ / mã / quà giữ nguyên. -->

<!-- Chat 11.11.2026 (bàn 35, sổ v61): main đã có CK-NOIDUNG-1, NAP-1 (ví hai ngăn), KH-THE-1, DIEM-MON-1 (điểm theo phần — truDiemDon /
     diemThat.js đổi), VI-ME-1 (viMe.js, taoDon kiểm mẹ–con), BAO-1a (thông báo chung ThongBao / baoXong / baoLoi — giao diện huỷ đơn dùng cái này).
     Theo Q4, CHAT đã gộp main vào nhánh này. Máy: đọc lại ke_hoach.md so với code MỚI (nhất là trừ điểm khi huỷ theo DIEM-MON-1, ngăn ví
     của NAP-1, đường gọi traLuotMa). Lệch ít → sửa kế hoạch rồi làm tiếp; lệch nhiều (đổi cách làm / thêm file ngoài Phạm vi) → sửa kế hoạch,
     ghi câu hỏi, DỪNG cho duyệt lại. Bước nâng cấp đổi 020 → 025 (020 đã dùng). SONG SONG: VOUCHER-2 (Opus làn 1) là việc DUY NHẤT đổi thân
     traLuotMa (trả nhiều voucher) — HUY-1 chỉ GỌI traLuotMa, giữ nguyên tên + tham số. -->

**Chờ duyệt kế hoạch:** viết `viec/HUY-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Trục trặc lúc bán (pha nhầm, bấm nhầm, hết nguyên liệu, khách đổi ý) thì quản lý huỷ được đơn ngay, khách không mất tiền, két và sổ sách vẫn khớp.

## Nghiệm thu
- A **Huỷ ở mọi bước:** đơn quầy và đơn App huỷ được từ lúc đơn vào (chưa pha / đang pha / đã xong / đã giao cho khách), một nút "Huỷ đơn" ở chi
  tiết đơn và ở màn Đơn App. Huỷ là CẢ đơn (không huỷ từng món).
- B **Quyền:** manager + owner huỷ đơn trong ngày (giờ VN); đơn của ngày trước chỉ owner. Staff không huỷ (quyền `cancel_order` của staff = 0,
  bước nâng cấp 025; seed kho mới cũng 0). Máy chủ kiểm, không chỉ giấu nút.
- C **Lý do bắt buộc:** chọn một lý do có sẵn (pha nhầm món · bấm nhầm · hết nguyên liệu · khách đổi ý · khác) + ô ghi thêm (bắt buộc khi "khác").
  Lưu ai huỷ, lúc nào, lý do.
- D **Hoàn tiền — khách có tài khoản:** TOÀN BỘ số khách đã trả (phần ví + phần tiền mặt + phần chuyển khoản) cộng vào ví khách, mỗi phần một dòng
  sổ ví ghi rõ nguồn; ví mẹ (ví gia đình) trả về đúng ví đã trừ như hiện nay. Không có lối trả tiền thật / chuyển khoản ra ngoài.
- E **Hoàn tiền — khách lẻ:** phần tiền mặt + chuyển khoản trả bằng TIỀN MẶT từ két; máy ghi thành khoản "Hoàn tiền mặt khách lẻ" (số tiền, đơn,
  người làm, lý do). Đây là lối DUY NHẤT lấy tiền mặt ra khỏi két.
- F **Đối soát:** ngày huỷ có dòng "Huỷ đơn — hoàn vào tài khoản khách: X" và "Hoàn tiền mặt khách lẻ: Y"; két tiền mặt cuối ngày tính trừ Y; tiền
  chuyển khoản đã về vẫn khớp sao kê (đã về, sau đó hoàn vào ví). Ví khách tăng đúng X (bất biến ví khớp sổ ví).
- G **Đi kèm (luật cũ giữ):** trừ lại điểm (P24), trả lại mã / voucher / quà đã dùng (P26c), hoàn kho, đơn mua gói / thẻ theo luật P26c (chỉ chủ
  quán…); đơn đã huỷ không huỷ lần hai, không duyệt hoàn được nữa; hai người bấm cùng lúc chỉ một lần có hiệu lực.
- H **App:** đơn App bị huỷ → App thấy `da_huy` + số đã hoàn vào tài khoản + lý do ngắn (kế hoạch nêu trường; đổi hợp đồng thì tăng PHIEN_BAN, chat
  chỉnh số lúc gộp). Đơn App chưa thu tiền (phiên còn chờ) → huỷ phiên, không hoàn gì.
- K5 **Không đổi:** cách tính tiền đơn, hoàn tiền "báo sự cố" (refunds.js) đang có, xoá đơn của owner.

## Phạm vi
- viec/HUY-1/**
- server/routes/orders.js
- server/routes/refunds.js
- server/routes/don-mo-rong.js
- server/routes/kh/index.js
- server/routes/kh/quay.js
- server/routes/wallets.js
- server/routes/reports.js
- server/routes/backup.js
- server/utils/donApp.js
- server/utils/doiSoat.js
- server/utils/donThu.js
- server/utils/tienDaTra.js
- server/utils/nhatKyDon.js
- server/database.js
- server/nang_cap/025_huy_don.js
- server/nang_cap/chay.js
- client/src/**
- client/dist/**
- cong_cu/thu_HUY1.js
- cong_cu/gia_lap/kich_ban.js
- cong_cu/gia_lap/bat_bien.js
- ban_mau_pos/**
- cong_cu/thu_HOPDONG_KH.js
- HOP_DONG_API_KH.md
- kiem_tra_truoc_khi_giao.js

<!-- Chủ quán 05.11 (Q1–Q5 kế hoạch 83c832f):
     Q1 CÓ — phiếu thắng bản vẽ: sửa ban_mau_pos trước (nút Huỷ đơn ở chi tiết Lịch sử đơn + màn Đơn App, 5 lý do của phiếu, KHÔNG hoàn tác 5 giây).
     Q2 KHÔNG dùng lại 'hoan_goi' — khách xem lịch sử tài khoản (App /vi) sẽ thấy sai tên. Dùng mã riêng cho phần hoàn tiền mặt / chuyển khoản khi
        huỷ đơn (tên máy chốt), sửa bất biến trong cong_cu/gia_lap/bat_bien.js cho khớp (bài sửa thường).
     Q3 CÓ — không thêm lối quầy huỷ phiên App chưa trả (khách tự huỷ / QR hết hạn).
     Q4 — KHÔNG tự dựng lại nhánh: khi CK-NOIDUNG-1 (và NAP-1, chủ quán đưa lên trước HUY-1) đã gộp, CHAT gộp main vào viec/HUY-1 bằng script rồi
        chủ quán mới gửi "tiep". Tiền thật khách trả khi huỷ đơn vào ĐÚNG ngăn ví của NAP-1 (tiền nạp, không phải thưởng).
     Q5 CÓ — thêm server/utils/donThu.js, cong_cu/gia_lap/kich_ban.js (đổi 4 chỗ huỷ bằng nhân viên sang quản lý). -->
## Bài thử đỏ
Có — `cong_cu/thu_HUY1.js` ĐỎ trên code gốc: huỷ đơn có tài khoản trả tiền mặt / chuyển khoản / ví / trộn → ví tăng đúng toàn bộ, sổ ví đủ dòng;
khách lẻ → ghi khoản hoàn tiền mặt, két trừ đúng; staff → 403; manager huỷ đơn hôm qua → 403, owner được; lý do trống → 400; đơn đang pha / đơn
App vừa về huỷ được; huỷ hai lần / song song chỉ một lần có hiệu lực; Đối soát ra đúng hai dòng; điểm trừ lại, mã trả lại, kho hoàn.

## Ngân sách
~300 dòng máy chủ + ~200 dòng giao diện + ~500 dòng thử.
**Phương án đơn giản nhất đã xét:** mở rộng PUT /orders/:id/cancel sẵn có (một giao dịch): thêm bước hoàn phần tiền mặt / chuyển khoản vào ví (hoặc ghi
khoản hoàn tiền mặt khi khách lẻ), thay vì làm lối huỷ mới.

## Đổi cấu trúc DB
có — chỉ THÊM (bước 025 — số 020 đã dùng cho 020_chep_khach_sx.js): cột / bảng khoản hoàn tiền mặt khách lẻ, lý do huỷ có mã; đổi dữ liệu quyền cancel_order của staff. Bảng mới vào
BACKUP_TABLES.

## Thư viện mới
không

## Soát bảo mật
có — tiền / ví / két, quyền huỷ theo ngày, chống huỷ hai lần.

## Cấm
Không làm gói nạp / ví hai ngăn (NAP-1 — NAP-1 sau này dùng lại đường hoàn vào ví của việc này), không đổi nội dung chuyển khoản (CK-NOIDUNG-1).
