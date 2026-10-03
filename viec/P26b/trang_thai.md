# P26b — Trạng thái

## Bản chụp lúc bắt đầu (03.10.2026)

```
$ git branch --show-current
viec/P26b
$ git log --oneline -3
6efcc3b PHIEU: P26b
9b0ba61 TIEN-DO: P26a xong (aa34031), them AUDIT-1, mo P26b — so v18
aa34031 Merge pull request #7 from pos-tuquyduong/viec/P26a
```

## Tiến độ

- [x] Bước 1 đối chiếu bản chụp (trên).
- [x] Bước 2 đọc phiếu, CLAUDE.md, KHUON_LOI.md, code thật 5 route + giả lập + bộ kiểm; thử thật libsql giao dịch chồng nhau.
- [x] Bước 3 kế hoạch `ke_hoach.md` (e912cde) + soát kế hoạch bằng agent phụ chỉ đọc → **KHÔNG ĐẠT**: KB16 xanh oan
      (gốc ví +1 nhưng sổ 2 dòng), A4b không bắt "từ chối ngoài tx", F2 tìm dấu `//` mà `boGhiChu` xoá mất, M10 sẽ gãy,
      thiếu ca khongAm trừ tay/điều chỉnh và báo hỏng chồng nạp, sót backup.js + 3 phát hiện, 3 luồng K5. Đã sửa hết vào
      `ke_hoach.md` (thêm Q6–Q8, Phát hiện 7–9); bằng chứng kho bận chép vào `thu_kho_ban.js`.
- [x] Chủ quán duyệt aff6fde (Q1–Q8, ghi ở `ke_hoach.md` mục 12, a3ca5b8) — làm tiếp không dừng.
- [x] Bước 4 bài thử ĐỎ trên gốc → `bang_chung_do.txt`: thu_P26b 10 đạt / 31 hỏng (10 ca xanh đều là ca K5 / "giữ"),
      giả lập KB13–KB18 31 lệch (KB1–KB12 sạch), thu_P26a C4 ✗, bộ kiểm nhanh 5 FAIL (2 bài thật + 3 phép E12).
- [x] Bước 5 vá 5 route. Bản lưu trước khi vá: thư mục nháp `truoc_P26b/` (ngoài kho).
      Giả lập bắt thêm một lỗ khi vá: tạo đơn kiểm số dư SAU khi ghi đơn → hai đơn chồng nhau trùng `pos_orders.code`
      → 500 thay vì 400. Sửa: trừ ví (cổng khongAm) TRƯỚC câu INSERT đơn, gắn order_id cho dòng sổ ngay sau.
- [x] Bước 6 thu_P26b 42/42, thu_P20 51/51, thu_P21 14/14, thu_P26a 8/8, giả lập 18 · 10 ĐẠT, thu_gia_lap 33/33.
      Bộ kiểm: phép E12 (đối soát) do chính việc này viết đỏ oan lúc đầu — đòi `beginTransaction(` trong thân
      reconcileWallet trong khi mã gọi `trongGiaoDich(` (hàm mở giao dịch). Truy nguyên trước, rồi sửa phép (K2).


## Câu hỏi

Q1–Q8 đã trả lời (ke_hoach.md mục 12). Chưa có câu hỏi mới.

## Phát hiện

Xem `ke_hoach.md` mục 10 (1–9) — ngoài phạm vi, KHÔNG sửa (3 đã xử lý theo Q6). Thêm:

10. Mã đơn `pos_orders.code` sinh NGOÀI giao dịch (`orders.js`, trước `beginTransaction`) → hai đơn tạo chồng nhau (không
    cần trả ví) trùng mã → đơn sau 500 `SQLITE_CONSTRAINT_UNIQUE`. Giả lập KB17 lộ ra; việc này chỉ né cho đường ví thua
    (400 trước INSERT). Hai đơn tiền mặt bấm cùng lúc vẫn có thể 500 — chưa dựng ca, CHƯA KIỂM.
11. Giả lập 18 KB chạy ~60 s (12 KB: 22 s); `thu_gia_lap` ~64 s — còn dưới hạn 110 s / 120 s nhưng biên hẹp dần.
