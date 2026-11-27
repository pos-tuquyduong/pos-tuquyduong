# GIAO-4 — Ahamove báo phí 0đ (hoặc âm) thì CHẶN, quầy bấm Tính phí lại — lỗi Ahamove không biến thành khách được miễn phí giao

<!-- Phiếu do chat POS soạn 25.11.2026 (bàn 41, main 7da9ba9a). Máy: Claude Code · OPUS.
     Việc TIỀN (phí giao khách trả) nhưng nhỏ → giữ "Chờ duyệt kế hoạch" theo LUAT §7; chat soát kế hoạch trong ngày.
     Chủ quán 19.11 (hộp hỏi, câu GIAO-3 a): "Đồng ý chặn" — Ahamove báo phí 0đ → chặn, quầy báo phí lại.

     CHAT ĐÃ ĐỌC (main 7da9ba9a):
       - server/utils/ahamove.js baoPhi (~67–77): phi = so(d.total_price ?? d.total_fee); chỉ ném AHAMOVE_TU_CHOI khi phi == null → phi = 0 LỌT QUA.
       - server/utils/giaoHang.js taoBaoPhi (~113–129): ghi pos_giao_bao_phi.phi = bp.phi rồi trả { phi } cho quầy → khách trả phí giao 0đ.
       - giaoHang.js gọi xe (~324–326): đã xử lý phi 0 khi gọi xe ("không biết phí → để trống, không ghi 0" — GIAO-3 C) → KHÔNG đổi.
       - grep "baoPhi" còn ở server/utils/manKhach.js, server/routes/man-khach.js, server/routes/orders.js — kế hoạch đọc từng chỗ (K4), nói chỗ nào đi
         qua taoBaoPhi / aha.baoPhi và chỗ nào không. -->

**Chờ duyệt kế hoạch:** viết `viec/GIAO-4/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Ahamove trả phí 0đ / âm / không phải số (lỗi bên Ahamove) thì quầy KHÔNG được dùng số đó làm phí giao của khách: báo rõ "Ahamove báo phí 0đ — bấm Tính phí lại",
không lưu báo phí, đơn giao không tạo được bằng phí 0. Không đổi gì khi Ahamove báo phí bình thường.

## Nghiệm thu
- A1 MỘT chỗ chặn cho mọi đường lấy phí báo cho khách (kế hoạch chọn: trong `aha.baoPhi` hay `taoBaoPhi` — một vị từ `phiHopLe(phi)` = số nguyên > 0):
  phi ≤ 0 → lỗi `{ code: 'AHAMOVE_PHI_0' }` lời "Ahamove báo phí 0đ — bấm Tính phí lại (nếu lặp lại, gọi Ahamove kiểm tra)", HTTP 502 như các lỗi Ahamove khác
  (theo `loiAhamove` sẵn có). KHÔNG ghi dòng pos_giao_bao_phi.
- A2 Log một dòng `[GIAO] phi_0 total_price=… total_fee=…` (chỉ số, không địa chỉ / SĐT) để đối chiếu với Ahamove.
- A3 Màn quầy (KhungGiao / nơi đang hiện lỗi Tính phí) hiện đúng lời máy chủ, nút Tính phí bấm lại được. Không sửa màn nếu lời lỗi máy chủ đã hiện sẵn
  (kế hoạch kiểm, ghi dòng).
- A4 Mọi đường đi qua (quầy, màn khách, App KH nếu có) đều nhận lỗi A1 — kế hoạch liệt kê.
- K5 phải KHÔNG bị chặn: phí 1đ, phí 15.000đ bình thường, `total_price` thiếu nhưng `total_fee` > 0 (đường cũ), báo phí cũ đã lưu > 0 vẫn dùng được, gọi xe
  (đường ~324) không đổi, đơn giao cũ trên dữ liệu thật không đổi.
- Bài thử `cong_cu/thu_GIAO4.js`: Ahamove giả trả 0 / -5000 / "0" / null-total_price-và-total_fee-0 → 502 AHAMOVE_PHI_0, không dòng báo phí; 1 / 15000 / chỉ total_fee 20000
  → 200 như cũ. ĐỎ trên main 7da9ba9a. Đột biến: VS-phi-0-lot (đổi > 0 thành >= 0), VS-phi-am-lot, BV-bo-chan-phi-0; đối chứng xanh.
- `--day-du` xanh, `node tu_chay/cong.js chay` ĐẠT.

## Phạm vi
- viec/GIAO-4/**
- server/utils/ahamove.js
- server/utils/giaoHang.js
- server/routes/giao-hang.js
- client/src/pages/BanHang/KhungGiao.jsx
- client/dist/**
- cong_cu/thu_GIAO4.js
- cong_cu/thu_GIAO1.js
- cong_cu/thu_GIAO2.js
- cong_cu/thu_GIAO3.js
- kiem_tra_truoc_khi_giao.js

## Ngân sách
~20 dòng code + ~150 dòng thử.
**Phương án đơn giản nhất đã xét:** một vị từ ở đúng chỗ Ahamove trả phí; không thêm cài đặt, không đổi màn nếu lời lỗi đã hiện.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
không — không đổi xác thực / quyền, chỉ thêm một điều kiện chặn trên số Ahamove trả.

## Cấm
- KHÔNG đổi đường gọi xe / phí thật / chênh (giaoHang.js ~315–335) ngoài việc dùng chung vị từ nếu kế hoạch chọn.
- KHÔNG sửa BanHangMoi.jsx (TOPPING-1 sắp làm lại màn bán hàng).
