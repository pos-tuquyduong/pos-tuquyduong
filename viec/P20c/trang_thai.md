# P20c — trạng thái

## Bước 1 — đối chiếu bản chụp (16.10.2026)
HEAD `2353fe9` · FETCH_HEAD `2353fe9` — bằng nhau, không kéo. Cây sạch.
```
2353fe9 PHIEU: P20c
783a1dd TIEN-DO: LUOI-3 (0ee7346), P20b (617d2ee) xong; mo AUDIT-4 + P20c; them P20d — so v34
0ee7346 Merge pull request #26 from pos-tuquyduong/viec/LUOI-3
```

## Bước 2–3 — đọc code, kế hoạch
Kế hoạch ở `ke_hoach.md`. Phiếu dặn chờ duyệt kế hoạch → dừng sau khi push.
Soát độc lập (agent chỉ đọc, 16.10): không ra ngoài Phạm vi; mọi mục A1–A6 có ca; H1/H2/H3 đỏ trên gốc nhờ móc `thu_P20.js:68–74`;
neo mục 0 còn khớp. Sửa theo soát: (1) A3 ngắn hơn — giữ `voucherRow` ngoài giao dịch, chặn bằng `voucherRow && xoa.changes === 0`;
(2) bốn số dòng sai trong bản nháp (regex `kiem_tra_truoc_khi_giao.js:446/463`, rollback `:452/466`, móc `:68–74`) — trích theo trí nhớ
lượt trước, không đọc lại (K1); (3) thêm 2 Phát hiện. Ghi để xếp ngăn ở bước 11.

## Câu hỏi
1. **A4 — /nhan-diem có đổi `MA_DA_NHAN_DIEM` 400 sang `MA_DA_DUNG` 409 không?** Phiếu ghi đổi, và ghi `:142` "không code" — đọc lại:
   `signup-codes.js:143` ĐÃ có `code: 'MA_DA_NHAN_DIEM'`, `:256` cũng vậy (hai chỗ trong /nhan-diem đã cùng một mã). Đổi thì đỏ
   `cong_cu/gia_lap/kich_ban.js:192` (Cấm — đòi `400 MA_DA_NHAN_DIEM`) và phải sửa ca [F] `thu_P20.js:243`. Đề xuất GIỮ: "mã đã đổi
   voucher" và "mã đã nhận điểm" là hai việc khác nhau cho tới P20d. Muốn đổi → thêm `cong_cu/gia_lap/kich_ban.js` vào Phạm vi.
2. Duyệt ba chỗ lệch chữ phiếu: (a) nối `NOT EXISTS` SAU chuỗi SQL cũ thay vì chèn vào giữa — 7 neo ở file Cấm / ngoài Phạm vi giữ nguyên
   (`ke_hoach.md` mục 0); (b) reset chặn theo `voucherRow && changes = 0` thay vì mọi `changes = 0` — không chặn nhầm dòng claimed mà không
   còn voucher (mục 3, ca H3c); (c) race dựng bằng móc tất định thay `Promise.all` (mục 5).

## Phát hiện (ngoài Phạm vi — không sửa)
1. `server/routes/discount-codes.js:315–326` — CÙNG KHUÔN lỗi A3: kiểm `used_count > 0` NGOÀI giao dịch rồi `DELETE … WHERE id = ?` không
   điều kiện. Đề xuất: `AND used_count = 0`, `changes = 0` → nhánh vô hiệu hoá.
2. `server/routes/orders.js:962–979` — `freshCode` null (voucher vừa bị xoá giữa lúc đọc `:502–505` và giao dịch) → vẫn giảm giá,
   `UPDATE used_count` 0 dòng. Cửa hẹp (chủ quán bấm hoàn tác / xoá mã đúng lúc khách dùng).
3. `signup-codes.js:208–214` /nhan-diem đọc `daCong` ngoài giao dịch — lệch cộng bù nếu sau này điểm cộng ở pay-debt (P22) chạy song song.
4. `signup-codes.js:358–367` /claim tra trùng `pos_discount_codes` ngoài giao dịch — race chỉ được UNIQUE đỡ, ra 500 thay vì 409.
5. GHI CHÚ [b] (phép tĩnh E9 bị lừa bởi chuỗi trong chuỗi / `--` SQL) — đề xuất cụ thể ghi ở bước 11, không sửa bộ kiểm.

## Bước 1 (tiếp, 16.10) — đối chiếu lại
HEAD `e6ec483` · FETCH_HEAD `e6ec483` — bằng nhau, không kéo. Chủ quán duyệt kế hoạch v1: Câu hỏi 1 → GIỮ `MA_DA_NHAN_DIEM` 400 ở
/nhan-diem; `MA_DA_DUNG` 409 chỉ /claim; `SDT_DA_NHAN` cả hai. Câu hỏi 2 → duyệt cả ba (nối chuỗi, reset `voucherRow && changes === 0`,
móc). Phát hiện → chỉ ghi. Hook pre-commit không cài trên máy mây → tự chạy `node kiem_tra_truoc_khi_giao.js` trước mỗi commit code.
```
e6ec483 P20c ke hoach v1: NOT EXISTS noi sau chuoi SQL cu (7 neo o file Cam), reset chan theo voucherRow && changes, 8 ca [H] + 8 dot bien — cho duyet
2353fe9 PHIEU: P20c
783a1dd TIEN-DO: LUOI-3 (0ee7346), P20b (617d2ee) xong; mo AUDIT-4 + P20c; them P20d — so v34
```

## Bước 4–5 — bài thử đỏ, vá, đột biến (16.10)
- `cong_cu/thu_P20.js` thêm mục [H] (8 ca H1, H2, H2b, H3, H3b, H3c, H4, H5 · 30 phép). Trên gốc `e6ec483`: **94 đạt · 11 hỏng**
  (H1 ×3, H2 ×3, H3 ×3, H4 ×2 — đúng dự kiến; ca K5 H2b/H3b/H3c/H5 xanh) — `bang_chung_do.txt`. Sau vá: **105 đạt · 0 hỏng**.
- Vá `server/routes/signup-codes.js`: hàm phụ `baoChiemHong` (đọc lại dòng sau rollback → `MA_DA_DUNG`/`MA_DA_NHAN_DIEM` hoặc `SDT_DA_NHAN`,
  không còn dòng → 404); /nhan-diem nối `AND (? = 0 OR NOT EXISTS …diem_nhan_phone…)` sau chuỗi neo, cờ = `ch.chiLanDau`; /claim nối
  `AND NOT EXISTS …claimed_phone…` sau chuỗi neo; /claim kiểm sớm: 409 `MA_DA_DUNG`, 400 `SDT_DA_NHAN`; /reset: `DELETE … AND used_count = 0`
  đầu giao dịch, `voucherRow && xoa.changes === 0` → rollback 400, rồi mới gỡ claimed; sửa chú thích đầu route reset (ghi "vô hiệu hoá" trong khi code XOÁ — K1).
- `node kiem_tra_truoc_khi_giao.js` trên cây đã vá: 64 phép · qua hết.

### Chỗ vá → đột biến (`viec/P20c/dot_bien.py`) — đối chứng 105 đạt · 0 hỏng; **9/9 BẮT**
| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| A1 /claim chặn SĐT trong UPDATE | `BV-A1-bo-chan-sdt` | ✗ H1 người đến sau |
| A1 | `VS-A1-id-bang` | ✗ H1 người đến sau |
| A1/A4 lời báo `baoChiemHong` | `VS-A1-mot-ma-loi` | ✗ H1 người đến sau (ra 409 MA_DA_DUNG) |
| A2 /nhan-diem chặn SĐT trong UPDATE | `BV-A2-bo-chan-sdt` | ✗ H2 người đến sau |
| A2 cờ chiLanDau | `VS-A2-bo-co` | ✗ H2b chiLanDau tắt |
| A3 /reset `AND used_count = 0` | `BV-A3-bo-dieu-kien` | ✗ H3 hoàn tác voucher vừa được dùng |
| A3 vế `voucherRow &&` | `VS-A3-changes-0-chan` | ✗ H3c hoàn tác khi không còn voucher |
| A4 /claim mã đã claim | `BV-A4-claim-bo-ma` | ✗ H4 /claim mã đã claim |
| A4 /claim SĐT đã claim | `BV-A4-claim-bo-ma-sdt` | ✗ H4 /claim bằng SĐT đã claim |
