# SAOLUU-2 — Khôi phục sao lưu an toàn: không mất cột · không mất dòng âm thầm · tất cả hoặc không · bảng mới không lọt sao lưu

<!-- Phiếu do chat soạn 31.10.2026. Việc [T] (dữ liệu) — Opus làn 2 (sau KHO-2b), lập kế hoạch, DỪNG chờ duyệt. Nền: main sau sổ v50.
     KHO-2b phát hiện 31.10 (viec/KHO-2b/trang_thai.md mục Phát hiện, đo bằng chạy): khôi phục vào kho TRỐNG làm mất dữ liệu. Chủ quán 28.10:
     nâng cấp / cập nhật dữ liệu phải thật an toàn, không trùng lặp, không bị cộng thêm hay lỗi. Cần xong TRƯỚC khai trương (khôi phục là
     đường cứu khi mất máy).
     Hiện trạng chat đọc 31.10 trên main 36db19b — server/routes/backup.js (425 dòng):
     - BACKUP_TABLES (~41–115, danh sách cứng, nhãn trang Excel = `label`); bangDangCo (~140) chỉ xuất bảng đang có.
     - BANG_KHONG_KHOI_PHUC (~120) + chanTrangTien (~129): trang dính tiền có dòng → 400 trước mọi lệnh ghi.
     - POST /restore (~336): kho_* chỉ khi kho trống, pos_nang_cap không bao giờ; mỗi trang: `sheet_to_json(ws)` (~378) → `DELETE FROM` bảng
       (~386) → cột = `Object.keys(rows[0])` (~389) → INSERT từng dòng, lỗi chỉ `console.error` rồi đi tiếp (~405). Hậu quả: (1) cột nào
       trống ở DÒNG ĐẦU trang thì mất ở MỌI dòng (sheet_to_json bỏ ô trống); (2) dòng vi phạm CHECK / khoá ngoại / cột lạ bị nuốt lỗi → mất
       mà báo "restored"; (3) đã DELETE rồi mới chèn, không giao dịch → hỏng giữa chừng là mất bảng.
     - POST /preview-restore (~281) đếm dòng theo cùng cách.
     - KH-MUA-1 (đang làm) thêm bảng `pos_don_app` (bước 006) — gắn với đơn / phiên thanh toán → phải SAO LƯU được nhưng KHÔNG khôi phục bằng
       file (như pos_orders, pos_phien_thanh_toan). Danh sách hiện chưa có tên này; bangDangCo lọc theo bảng đang có nên thêm tên trước là an toàn.
     Báo cáo cho chủ quán theo LUAT §8. -->

**Chờ duyệt kế hoạch:** viết `viec/SAOLUU-2/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Khôi phục một file sao lưu ra đúng dữ liệu đã sao lưu — hoặc không đổi gì và nói rõ vì sao. Mọi bảng của POS đều nằm trong sao lưu.

## Nghiệm thu
- A **Không mất cột:** cột của một trang = HỢP mọi dòng (hoặc đọc ô trống thành null), chỉ lấy cột đang có trong bảng hiện tại (PRAGMA
  table_info); cột lạ / đã bỏ → bỏ qua và liệt kê trong kết quả. Bài thử: dòng đầu trống ghi_chú / don_id / xung_ho / dia_chi → khôi phục
  vẫn đủ ở mọi dòng.
- B **Không mất dòng âm thầm:** dòng nào chèn hỏng → cả lần khôi phục KHÔNG đổi gì (một giao dịch cho toàn bộ lần khôi phục: xoá + chèn mọi
  bảng), trả lỗi có `code` + bảng + số dòng + lý do ngắn (vd vi phạm CHECK). Không còn `console.error` rồi đi tiếp.
- C **Xem trước khớp khôi phục:** /preview-restore đếm và báo cùng luật (cột bỏ qua, bảng bỏ qua, trang tiền bị chặn).
- D **Đủ bảng:** thêm `pos_don_app` vào BACKUP_TABLES và BANG_KHONG_KHOI_PHUC. Bài thử chốt: mọi bảng tạo bởi database.js + server/nang_cap/**
  phải có trong BACKUP_TABLES (trừ danh sách bỏ qua có lý do, vd `_sao_luu_`) — bảng mới quên thêm thì bộ kiểm đỏ.
- E **Giữ luật cũ:** trang tiền có dòng → 400 trước mọi lệnh ghi; kho_* chỉ khi kho trống; pos_nang_cap không bao giờ; chỉ owner. Xuất / tải
  sao lưu như cũ (định dạng file không đổi — file cũ khôi phục được).
- F **Vòng tròn:** sao lưu → khôi phục vào CSDL trống → sao lưu lại → hai file giống nhau từng ô ở mọi bảng được khôi phục.

## Phạm vi
- viec/SAOLUU-2/**
- server/routes/backup.js
- server/utils/khoiPhuc.js
- cong_cu/thu_SAOLUU2.js
- cong_cu/thu_KHO1.js
- cong_cu/thu_KHO2a.js
- cong_cu/thu_KHO2b.js
- cong_cu/thu_P26b.js
- cong_cu/thu_P3.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_SAOLUU2.js` ĐỎ trên code gốc: dòng đầu trống cột → sau khôi phục mất (gốc) / đủ (mới); một dòng vi phạm CHECK → gốc báo
restored + mất dòng, mới: lỗi có code, đếm mọi bảng trước = sau; cột lạ trong file → bỏ qua + liệt kê; vòng tròn F; bảng thiếu trong
BACKUP_TABLES → đỏ; trang tiền vẫn 400.

## Ngân sách
~150 dòng máy chủ + ~300 dòng thử.
**Phương án đơn giản nhất đã xét:** sửa trong backup.js (hoặc tách hàm khôi phục ra khoiPhuc.js để thử được): đọc ô trống thành null, lọc cột
theo PRAGMA, bọc toàn bộ trong một giao dịch; không đổi định dạng file.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- KHÔNG đổi định dạng / tên trang file sao lưu; KHÔNG mở khôi phục cho trang tiền; KHÔNG đổi luật kho_* / pos_nang_cap.
- KHÔNG sửa bảng / bước nâng cấp; KHÔNG đổi SAOLUU-DEM-1 (sao lưu đêm — sau khai trương).
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/SAOLUU-2`. Không đụng main, không merge,
  không tạo PR.
