# VI-ME-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (10.11.2026)
HEAD 7239819 · FETCH_HEAD 7239819 (bằng nhau, không kéo)
```
7239819 PHIEU: VI-ME-1
136d6b0 TIEN-DO: QUAY-UI-1, KH-THE-1 xong; bo P3b; NAP-2 -> KH-NAP-1; CAIDAT-BAO-1 -> BAO-1b; them VOUCHER-2, BAO-1a, BAO-1b, QC-APP-1, GIAO-MA-1, GIAO-DIEN-2; mo VI-ME-1, BAO-1a; quyet dinh 08-09.11 b; lich 09.11 — so v59
db2d71d Merge pull request #84 from pos-tuquyduong/viec/KH-THE-1
```

Stop hook báo `npm test` đỏ ở thu_BH2 G1: kho nông, thiếu commit cbbb809 (`git log` lỗi) — không phải lỗi code. `git fetch -q --unshallow origin viec/VI-ME-1` (chỉ tải lịch sử) → `npm test` PASS 108 · FAIL 0 · CẢNH BÁO 1.

## Bước 3 — kế hoạch
`ke_hoach.md`. Phiếu dặn lập kế hoạch rồi DỪNG chờ duyệt → dừng sau khi push.

## Câu hỏi
1. Duyệt kế hoạch (phương án A: một lời gọi `kiemTraMe` trong `taoDon`, phủ tạo đơn + giữ chỗ + chốt phiên).
2. Kiểm quan hệ mẹ–con đọc NGOÀI giao dịch ghi (đề xuất của mình — đủ an toàn, ít dòng). Bạn muốn kiểm lại cả TRONG giao dịch thì nói (thêm ~4 dòng).

3. Khách chỉ có ở danh sách đăng ký (`pos_registrations`, đã duyệt / từ chối, không có dòng khách — bước nâng cấp 022 chỉ chép đăng ký đang chờ) vẫn hiện "số dư mẹ" trên màn, nhưng theo nghiệm thu A sẽ bị từ chối 403. Đề xuất của mình: giữ đúng phiếu (chỉ tin `pos_customers`) — màn vẫn hiện số dư mẹ nhưng bấm thu sẽ báo "không phải tài khoản mẹ". Bạn xác nhận là được.

## Soát kế hoạch (agent phụ, 10.11)
Không ra ngoài Phạm vi; không có cách ngắn hơn. Đã thêm ca B5 (kiểm mẹ trước PIN), B6 (số dư mẹ báo màn), B7 (màn khách), B2 chốt hai cách; sửa số dòng nhả giữ chỗ 130-133; thêm Câu hỏi 3 và Phát hiện `/wallets/deduct`.

## Phát hiện
- `POST /wallets/deduct` (`wallets.js:181`) trừ ví SĐT bất kỳ — chỉ quyền `adjust_balance` (mặc định chủ quán). Không phải lối mẹ, không sửa.
- `balance_amount` (ví của chính khách) ở POST /orders cũng trừ theo SĐT màn gửi, không PIN khi cờ `thanh_toan_payos_bat_buoc` tắt (`orders.js:831-848`). Ngoài phiếu, không sửa.
- Người có quyền sửa khách có thể đặt `parent_phone` của một khách thành SĐT bất kỳ rồi trừ ví đó qua lối quầy cũ (không PIN). Lối phiên vẫn đòi PIN ví mẹ (`giuCho.js:56-60`). Ngoài phiếu.
