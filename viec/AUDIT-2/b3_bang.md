# AUDIT-2 B3 — mọi ca chồng nhau trong `kich_ban.js` ↔ đột biến BỎ KHOÁ

Danh sách ĐỌC TAY đủ 29 KB (grep `c.chong(` / `moc.truocTx =` / `Promise.all([` chỉ là điểm bắt đầu; vòng `buoc(` :285 gói 6 ca,
vòng lặp :306 gói 2 ca). `c.chong(chen, lam)` (`kich_ban.js:53–57`) chạy TRỌN lệnh `chen` ngay trước khi `lam` mở giao dịch ⇒ ca chỉ đỏ
khi `lam` quyết định dựa trên thứ đọc NGOÀI / TRƯỚC giao dịch, hoặc thiếu điều kiện chiếm trong câu ghi. Mỗi đột biến chạy giả lập
tới đúng KB đó (`--den-kb n`, bản sao `server/`). Kết quả: lần chạy ngày 12.10 trên HEAD (lệnh ở cột cuối).

| KB:dòng | ca chồng | khoá ở máy chủ (HEAD) | đột biến bỏ khoá | kết quả | lệnh |
|---|---|---|---|---|---|
| KB10:169 | hai người cùng thu một bill (`Promise.all`) | pay-debt `WHERE … debt_amount = ? AND payment_status != 'paid'` `orders.js:1235` + `kqThu.changes !== 1` `:1238` | `BK-KB10-thu-bo-changes` (mới); `G3-da-biet` (AUDIT-1, nới WHERE) | BẮT · BẮT (A1) | `python3 viec/AUDIT-2/dot_bien.py <tên>` |
| KB11:182 | hai người /claim | `AND claimed_at IS NULL` `signup-codes.js:385` | `BK-KB11-claim-bo-chiem` (mới) | BẮT (người sau 500 UNIQUE pos_discount_codes.code — đỏ đúng câu, xem ghi chú 3) | `python3 viec/AUDIT-2/dot_bien.py <tên>` |
| KB11:189 | hai người /nhan-diem | `AND diem_nhan_luc IS NULL` `signup-codes.js:248` | `BK-KB11-nhandiem-bo-chiem` (mới) | BẮT | `python3 viec/AUDIT-2/dot_bien.py <tên>` |
| KB14:232 | xoá chồng lên huỷ | DELETE đọc đơn TRONG giao dịch, hoàn chỉ khi `completed` `orders.js:1493` | `xoa-doc-don-ngoai-tx` (P26b) | BẮT | `python3 viec/P26b/dot_bien.py <tên>` |
| KB15:240 | hai lệnh huỷ | `WHERE id = ? AND status = 'completed'` `orders.js:1319` + `doi.changes !== 1` `:1322` | `huy-kiem-ngoai-tx` (P26b) | BẮT | `python3 viec/P26b/dot_bien.py <tên>` |
| KB15:245 | hai lệnh tạo yêu cầu hoàn | `if (existing) return loi(400` trong giao dịch `refunds.js:119` | `yc-bo-kiem-trung`, `yc-kiem-trung-ngoai-tx` (P26b) | BẮT · BẮT | `python3 viec/P26b/dot_bien.py <tên>` |
| KB16:255 | hai lệnh duyệt | chiếm yêu cầu `AND status = 'pending'` `refunds.js:154–155` | `duyet-bo-chiem-yeu-cau` (P26b) | BẮT | `python3 viec/P26b/dot_bien.py <tên>` |
| KB16:262 | duyệt chồng lên huỷ | huỷ đơn chuyển yêu cầu sang `rejected` (`orders.js:1400`) ⇒ duyệt thua ở chiếm `refunds.js:154–155`; lớp 2: cộng-đồn `status = 'completed'` `:157–158` | `BK-KB16-duyet-bo-cong-don` (mới) · `duyet-bo-cong-don` (P26b, thu_P26b A2a) | **SỐNG** (lớp 1 chặn trước — xem ghi chú 1) · BẮT | `python3 viec/AUDIT-2/dot_bien.py <tên>` · `python3 viec/P26b/dot_bien.py <tên>` |
| KB16:269 | từ chối chồng lên duyệt | `AND status = 'pending'` `refunds.js:200` + `changes === 1` `:201` | `tu-choi-bo-dieu-kien`, `tu-choi-khong-kiem-changes` (P26b) | BẮT · BẮT | `python3 viec/P26b/dot_bien.py <tên>` |
| KB16:276 | duyệt chồng lên từ chối | chiếm `refunds.js:154–155` | `duyet-bo-chiem-yeu-cau` (P26b) — đỏ đúng ca này (dòng bằng chứng "duyệt chồng lên từ chối") | BẮT | `python3 viec/P26b/dot_bien.py <tên>` |
| KB17:291 | nạp chồng lên bán ví | ghiVi đọc + cộng TƯƠNG ĐỐI trong giao dịch `wallets.js:62–67` | `nap-ghi-tuyet-doi-tu-so-ngoai-tx`, `nap-so-truoc-doc-ngoai-tx` (P26b) | BẮT · BẮT | `python3 viec/P26b/dot_bien.py <tên>` |
| KB17:292 | trừ tay +… chồng lên nạp | như trên (route trừ tay không đọc gì ngoài giao dịch) | — không có khoá riêng của route để bỏ (ghi chú 2) | — | — |
| KB17:293 | điều chỉnh + chồng lên nạp | như trên | — (ghi chú 2) | — | — |
| KB17:295 | đối soát chồng lên bán ví | đối soát trong `trongGiaoDich` `wallets.js:245` | `doi-soat-bo-tx`, `doi-soat-doc-tong-ngoai-tx` (P26b) | LẠC-giống (`doi-soat-bo-tx` đỏ vì "móc không chạy", không vì tiền — ghi chú 4) · BẮT | `python3 viec/P26b/dot_bien.py <tên>` |
| KB17:298 | duyệt hoàn chồng lên nạp | như KB17:291 (ghiVi) | — (ghi chú 2) | — | — |
| KB17:300 | báo hỏng đền chồng lên nạp | như KB17:291 (ghiVi) | — (ghi chú 2) | — | — |
| KB17:306 (vòng, 2 ca) | trừ tay hết / điều chỉnh âm hết chồng lên bán ví | `khongAm` `wallets.js:65, 151, 191` | `ghiVi-bo-khongAm`, `tru-tay-chi-kiem-ngoai-tx`, `dieu-chinh-bo-khongAm` (P26b) | BẮT ×3 | `python3 viec/P26b/dot_bien.py <tên>` |
| KB17:322 | hai đơn trừ ví mẹ | `khongAm: true` `orders.js:814` | `me-bo-khongAm` (P26b) | BẮT (qua 500 UNIQUE — ghi chú 3) | `python3 viec/P26b/dot_bien.py <tên>` |
| KB17:339 | hai đơn ví vượt số dư | `khongAm: true` `orders.js:814` | `tao-don-chi-kiem-ngoai-tx` (P26b) | BẮT (qua 500 UNIQUE — ghi chú 3) | `python3 viec/P26b/dot_bien.py <tên>` |
| KB18:347 | báo hỏng chồng vượt số lượng | cộng dồn đã báo trong giao dịch `damages.js:154–159` | `hong-cong-don-ngoai-tx` (P26b) | BẮT | `python3 viec/P26b/dot_bien.py <tên>` |
| KB20:390 | hai đơn cùng mã dùng-một-lần | đọc lại `used_count` trong giao dịch `orders.js:883–893` | `BK-KB20-bo-kiem-lai-ma` (mới) | **SỐNG** — đã biết (ghi chú 5) | `python3 viec/AUDIT-2/dot_bien.py <tên>` |
| KB21:439 | hai nhân viên huỷ đơn mua gói | `orders.js:1319` + `:1322` | `BK-KB21-huy-goi-bo-changes` (mới) | BẮT | `python3 viec/AUDIT-2/dot_bien.py <tên>` |
| KB25:512 | hai người cùng đẩy sổ nợ kho | `dangChay` `server/utils/doSoNo.js:39` | `VS-SRV-bo-khoa-dangChay` (LUOI-1) | BẮT | `python3 viec/LUOI-1/dot_bien.py VS-SRV-bo-khoa-dangChay` |

**SỐNG / không có khoá riêng:**

1. **`BK-KB16-duyet-bo-cong-don` SỐNG — khoá hai lớp, không phải lỗ:** huỷ đơn đổi yêu cầu chờ duyệt sang `rejected` trong CÙNG giao dịch
   huỷ (`orders.js:1400`; P26b `huy-bo-tu-choi-yeu-cau`), nên lệnh duyệt chồng sau thua ngay ở bước chiếm yêu cầu (`refunds.js:154–155`). Khoá cộng-đồn
   `:157–158` là lớp 2 cho trường hợp đơn bị huỷ/hoàn bằng đường KHÁC — đã có ca riêng `thu_P26b` A2a (`duyet-bo-cong-don` BẮT). Không cần ca chồng mới.
2. **KB17:292, :293, :298, :300 — không có khoá riêng của route để bỏ:** các route này không đọc gì NGOÀI giao dịch; toàn bộ "khoá" là
   ghiVi đọc số dư + cộng tương đối trong giao dịch (`wallets.js:62–67`). Bỏ khoá = viết lại route cho đọc ngoài giao dịch — đúng dạng
   P26b đã làm cho route nạp (`nap-*`, BẮT). Ghi lý do, không thêm đột biến.
3. **BẮT qua lỗi UNIQUE 500** (`BK-KB11-claim-bo-chiem`, `me-bo-khongAm`, `tao-don-chi-kiem-ngoai-tx`): bỏ khoá thì lệnh sau đi tiếp và vấp
   UNIQUE (mã voucher / mã đơn sinh ngoài giao dịch — P26d) → 500, giao dịch rollback; câu `c.mong` vẫn đỏ đúng ca (mong 400/409), nhưng
   nếu P26d sửa mã đơn thì ba đột biến này phải chạy lại để chắc vẫn đỏ vì tiền (ví / mã) chứ không vì UNIQUE.
4. **`doi-soat-bo-tx` đỏ vì "móc không chạy":** bỏ giao dịch thì móc `truocTx` (chèn lệnh chồng) không bao giờ chạy → ca đỏ do thiếu chồng,
   không do tiền sai. `doi-soat-doc-tong-ngoai-tx` (cùng ca) đỏ đúng nghĩa (ví 125000 → 125000) nên ca vẫn có đột biến BẮT thật. → AU2-8 NHẸ.
5. **`BK-KB20-bo-kiem-lai-ma` SỐNG — đã biết:** `kich_ban.js:384–386` ghi "nhánh kiểm lại trong giao dịch CHƯA KIỂM": mã đơn sinh ngoài
   giao dịch nên đơn thua vấp UNIQUE `pos_orders.code` TRƯỚC phép kiểm lại mã (P26d mục 10). Khi P26d sửa, siết KB20 về đúng 200 + 400 →
   đột biến này phải chuyển BẮT. → AU2-9 (trúng P26d, không phải P26c).
