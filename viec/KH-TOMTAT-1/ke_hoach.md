# Kế hoạch KH-TOMTAT-1 (máy soạn 06.11.2026)

Mọi dòng dưới đây đã đọc trong lượt này: `server/utils/donApp.js:271-324`, `server/utils/dongHoaDon.js:1-51`,
`server/routes/hoaDon.js:28-127`, `client/src/utils/hoaDon.js:163-203`, `server/utils/donApp.js:87-89,240`.

## Hiện trạng
- `tomDon` (`donApp.js:294`) và `CAU_DON` (`donApp.js:276`) chưa có `kenh`, `cach_nhan`, `tra[]`, `so_mon`, `mon_dau`, `giam`.
- Hoá đơn in tính tiền ở `routes/hoaDon.js`: `dungThanhToan(o)` (dòng 32, KHÔNG export) cho các dòng cách trả; khoản giảm
  (`tier_discount` + `flash_discount` + `giamMa` suy từ tổng, dòng 91-99) tính THẲNG trong thân `dungHoaDon(o)` (dòng 85) — không có hàm riêng.
  Chỉ `dungHoaDon` được export (dòng 143).
- Chưa có cột "cách nhận" / "kênh" trong `pos_orders`. App chỉ nhận `tai_quan` (`donApp.js:87-89`), đơn quầy giao có `shipping_fee > 0`.
- D: `hoa_don[]` đã dẹt từ CÙNG tờ in (`dongHoaDon.js:26-41`): có `tu_tk / tu_tk_me / ck / tm / ghi_no`, `giam_hang / giam_flash / giam_ma`,
  `phi_giao`, dòng điểm. Tờ in KHÔNG có dòng "cách nhận" riêng (chỉ có `phi_giao` khi giao) → D chốt bằng bài thử so với tờ in, không thêm dòng.

## Chỗ vướng (xem `## Câu hỏi` ở trang_thai.md)
Nghiệm thu B đòi `tra[]` và `giam` tính bằng CÙNG hàm với hoá đơn, mà hai thứ đó nằm trong `server/routes/hoaDon.js` — **file này không có trong Phạm vi**.

## Phương án cho `tra[]` và `giam`
| | Số file | ~Dòng | Rủi ro |
|---|---|---|---|
| **A (đề xuất)** thêm `server/routes/hoaDon.js` vào Phạm vi: export `dungThanhToan`, tách `tinhGiam(o)` (hạng + Flash + mã) khỏi `dungHoaDon` để hoá đơn và tóm tắt cùng gọi | +1 file | ~10 ở hoaDon.js | đụng hoá đơn quầy → bài thử `thu_HDKH1.js`/`thu_HD1.js` phải vẫn xanh; K5: hoá đơn quầy không đổi |
| B ở trong Phạm vi, gọi nguyên `dungHoaDon(o)` cho MỖI đơn trong `dsDon` rồi lấy `thanh_toan` / `tien` | 0 | ~0 | mỗi đơn ~7 truy vấn (cài đặt, món, nhật ký in, 3 truy vấn điểm…) × 20 đơn / trang = ~140 truy vấn tới Turso mỗi lần mở Lịch sử đơn → chậm, vi phạm tiêu chí 3 |
| C chép công thức vào `donApp.js` | 0 | ~25 | VI PHẠM "một quy tắc — một hàm" và nghiệm thu B; loại |

Chọn **A** (ít chi phí chạy nhất, đúng nghiệm thu B). Chờ chủ quán cho thêm file vào Phạm vi.

## Các phần còn lại (trong Phạm vi, không phụ thuộc câu hỏi)
1. `CAU_DON` thêm cột `o.shipping_fee`, `o.subtotal`, `o.tier_discount`, `o.flash_discount`, `o.cash_amount`, `o.transfer_amount`,
   `o.balance_amount`, `o.parent_balance_amount`, `o.payment_method`, `o.discount_code`… (nhánh đơn App chưa có đơn thật: `NULL`).
   Cách ít dòng nhất: nhánh đầu lấy thêm `o.*` qua một cột `dong_don`? — không, `SELECT *` của UNION bắt hai nhánh cùng số cột; giữ liệt kê cột tường minh.
2. `so_mon` / `mon_dau`: đơn thật → `SUM(quantity)` và tên dòng `MIN(id)` của `pos_order_items`; đơn App chưa có đơn thật → từ `than.dong`
   (đã parse sẵn ở `chiTietDon`). Một truy vấn gộp cho cả trang (`WHERE order_id IN (…)`), không N+1.
3. `kenh` = `ma_app ? 'app' : 'quay'`. `cach_nhan`: App → `tai_quan`; quầy → `giao` nếu `shipping_fee > 0`, còn lại theo câu trả lời chủ quán (câu hỏi 2).
4. `tra[]` = `dungThanhToan(o)` đổi `loai→cach`; đơn App chưa trả / đã huỷ trước khi trả (không có `o`) → `[]`; đơn cũ thiếu cột → `null`.
5. `giam` = `tinhGiam(o)`; đơn App chưa có đơn thật → `0`.
6. `HOP_DONG_API_KH.md`: bảng cửa + ghi chú + nhật ký + tăng `PHIEN_BAN`; `thu_HOPDONG_KH.js` xanh. `kiem_tra_truoc_khi_giao.js`: chỉ THÊM phép nếu cần.

## Ca thử (`cong_cu/thu_KHTOMTAT1.js`) ↔ Nghiệm thu
- A: đơn quầy tiền mặt · QR/chuyển khoản · ví · ví+QR (hai dòng `tra[]`) · có giảm hạng+mã; đơn App lấy tại quầy; đơn quầy giao (`shipping_fee > 0`) → đủ trường đúng giá trị, ở CẢ `GET /don` và `GET /don/:ma`.
- B: tổng `tra[]` = `da_tra`; `giam` = tổng các dòng giảm in trên `hoa_don[]`; tên `cach` trùng khoá hoá đơn.
- C: đơn cũ thiếu cột → `null`; đơn App chưa trả / huỷ → `tra` rỗng.
- D: `hoa_don[]` có dòng cách trả + `giam_hang`/`giam_ma` + `phi_giao` như tờ in.
- E: khách B không đọc được đơn khách A (404 như không có); trường mới chỉ ở đơn thuộc SĐT trong token.
- K5 (luồng hợp lệ KHÔNG đổi): trường cũ của hai cửa giữ nguyên giá trị; hoá đơn quầy `GET /api/pos/hoa-don/:id` byte-y-nguyên trước/sau tách hàm; đơn App nhiều trang vẫn phân trang đúng.
- Đột biến: `VS-` (tính `giam` lại kiểu khác; `tra` lấy `payment_method` thay cột), `BV-` (bỏ `tra`, bỏ lọc SĐT).

## Đường song song cần canh (K4)
`GET /don` (`dsDon`) và `GET /don/:ma` (`chiTietDon`) cùng đi qua `tomDon` → thêm trường ở MỘT chỗ. `POST /don` trả `traDon` (`donApp.js:259`) — phiếu
không yêu cầu, không đổi. Còn `app_kh/` cũ: cấm sửa.
