# LUOI-5 — trạng thái

## Bước 1 — đối chiếu bản chụp (17.10.2026)
- nhánh `viec/LUOI-5`; `git status --short` sạch; `git fetch origin viec/LUOI-5` → HEAD `48ba548` = FETCH_HEAD `48ba548` (bằng nhau, không kéo).
- `git log --oneline -3`:
  ```
  48ba548 PHIEU: LUOI-5
  2b65db4 TIEN-DO: LUOI-4 (8ac79a7), MA-GIAM-1 (5a6fc0f), TU-CHAY-7 (49f9140) xong; mo LUOI-5 + TU-CHAY-8; them TU-CHAY-9, DONG-GOI-1, MA-GIAM-2 — so v36
  49f9140 Merge pull request #31 from pos-tuquyduong/viec/TU-CHAY-7
  ```

## Trạng thái
Bước 3 xong — kế hoạch `ke_hoach.md` CHỜ DUYỆT (phiếu dặn dừng ở bước 3), đã soát (agent chỉ đọc, 3 lỗi đã sửa — `ke_hoach.md` mục 7). N0 đã đo (dưới).

## N0 — 18 tên đo lại trên HEAD `48ba548` dưới LƯỚI ĐỦ
Lệnh: `python3 viec/LUOI-5/dot_bien.py -j 4` (đầu ra nguyên văn: `n0_do.txt`). Lưới = chay.js (giả lập, nạp `server/index.js` — mọi route) +
thu_P26a / P26b / P26c / GOI1 / P20 / P21 + thu_gia_lap; mọi bài chạy hết, không dừng ở bài đỏ đầu. Đối chứng (bản sao không đột biến):
giả lập 32 KB · 18 bất biến · ĐẠT; P26a 16 · P26b 66 · P26c 121 · GOI1 110 · P20 169 · P21 14 · thu_gia_lap 148 — đều `0 hỏng`, đúng số
ghi sẵn. Lần đầu thu_gia_lap đỏ đối chứng (8 ca C3: bản sao 'sv' thiếu `kiem_tra_truoc_khi_giao.js`) → chép thêm file đó vào bản sao, đo lại.

Neo: C2F sinh lại trên HEAD rồi chọn theo CHỮ KÝ câu ghi (không theo số trong tên). MA-GIAM-1 đảo thứ tự hai câu ghi của DELETE
`discount-codes.js` (giờ xoá trước, tắt sau) → HEAD sinh tên 03 = xoá, 04 = tắt; bảng giữ tên AUDIT-4 (03 = tắt, 04 = xoá), neo cùng ý.

| tên (AUDIT-4) | dòng AUDIT-4 → HEAD | neo | dưới lưới đủ | bài bắt / ghi chú |
|---|---|---|---|---|
| C2F-damages-03-update-quan-tri | damages.js:218 → :218 | khớp | **SỐNG** | — |
| C2F-packages-01-insert-quan-tri | packages.js:61 → :61 | khớp | **HỎNG-sập** | thu_GOI1 ✗ A1a đúng rồi sập ("Cannot read properties of null (reading 'id')" — `taoGoi`) |
| C2F-packages-03-update-quan-tri | packages.js:136 → :136 | khớp | **SỐNG** | — |
| C2F-packages-04-delete-quan-tri | packages.js:139 → :139 | khớp | BẮT | thu_GOI1 ✗ A6h |
| C2F-packages-06-update-quay | packages.js:262 → :262 | khớp | BẮT | thu_GOI1 ✗ A5c, A5d, B3a2, B4a… (21 ca) |
| C2F-discount-codes-02-update-quan-tri | discount-codes.js:265 → :282 | khớp | BẮT | thu_P20 ✗ G13, G14 |
| C2F-discount-codes-03-update-quan-tri | discount-codes.js:319 → :332 | dựng lại cùng ý (HEAD sinh tên `-04-update-`) | BẮT | thu_P26a ✗ M1, M4, M5 |
| C2F-discount-codes-04-delete-quan-tri | discount-codes.js:326 → :330 | dựng lại cùng ý (HEAD sinh tên `-03-delete-`) | BẮT | thu_P26a ✗ M1, M2… (6 ca) |
| C2F-signup-codes-05-update-quan-tri | signup-codes.js:477 → :497 | dựng lại (MA-GIAM-1 đổi câu) | BẮT | thu_P20 ✗ H3b… (16 ca) |
| C2F-signup-codes-06-delete-quan-tri | signup-codes.js:484 → :514 | dựng lại (xoá theo id) | BẮT | thu_P20 ✗ H3… (13 ca) |
| C2F-rewards-02-update-quan-tri | rewards.js:74 → :74 | khớp | **SỐNG** | — |
| C2F-rewards-03-update-quan-tri | rewards.js:87 → :87 | khớp | **SỐNG** | — |
| C2F-customers-v2-04-update-quan-tri | customers-v2.js:369 → :369 | khớp | **SỐNG** | — |
| C2F-customers-v2-05-insert-quan-tri | customers-v2.js:376 → :376 | khớp | **SỐNG** | — |
| A3L-redeem-bo-han-diem | loyalty.js:31 → :31 | khớp | **SỐNG** | — |
| A3L-nhandiem-he-so-mac-dinh | signup-codes.js:108 → :118 | khớp | **SỐNG** | — |
| A3L-goi-bo-kiem-con-lai | orders.js:248 → :248 | khớp | **SỐNG** | lớp sau chặn hộ — `## Câu hỏi` Q1 |
| BK-KB16-duyet-bo-cong-don | refunds.js:158 → :158 | khớp | BẮT | thu_P26b ✗ A2a, A2b, M8 (AUDIT-2/4 chỉ chạy `kb16`) |

Tổng: BẮT 8 · SỐNG 9 · HỎNG-sập 1 · HỎNG 0 · LẠC 0 · TREO 0. Còn phải làm: 9 SỐNG + 1 HỎNG-sập = 10 tên (1 trong đó hỏi — Q1).

## Câu hỏi
- **Q1 — `A3L-goi-bo-kiem-con-lai` (orders.js:248 `if (conLai <= 0)`) không thể có hậu quả tiền?** Lập luận (đọc lượt này): gỡ phép này thì
  đơn lấy từ gói hết lượt (dữ liệu lệch: `active` mà `delivered_qty >= total_qty`) vẫn bị chặn ở hai lớp sau, đều TRƯỚC / TRONG giao dịch:
  `vuotTheoLoai` (orders.js:884, gói có danh sách loại → 400 `GOI_HET_LUOT_LOAI`) và câu trừ lượt có trần `delivered_qty + ? <= total_qty`
  (orders.js:940–949 → rollback, 400 `GOI_HET_LUOT`). Từ :248 tới `beginTransaction` (:856) không có câu ghi nào (grep `await run\(|tx\.run\(|ghiVi\(`
  trong orders.js: câu ghi đầu tiên là :870 trong giao dịch). Khác biệt duy nhất: câu báo lỗi ("Goi cua khach da giao het luot." → "Gói của
  khách không còn đủ lượt cho đơn này" / lỗi theo loại). Sẽ đo xác nhận ở bước 4 (đột biến + ca dữ liệu lệch: lấy 400, ví / gói / sổ không đổi).
  Chủ quán chọn: (a) thêm ca khoá CÂU BÁO lớp 1 (đỏ dưới đột biến, ~6 dòng thu_GOI1); (b) không thêm ca — ghi "lớp sau chặn hộ, không hậu quả
  tiền", AUDIT-5 xếp lại mức (máy không tự hạ mức).

## Phát hiện
- `server/routes/customers.js:521` cũng ghi `discount_type` / `discount_value` của khách (đường song song của customers-v2-04), nhưng C2F
  (`viec/AUDIT-1/dot_bien.py` `C2_FILES`) không quét `customers.js` — câu ghi này chưa có đột biến nào. Ngoài phạm vi LUOI-5.
- `viec/LUOI-4/dot_bien.py:18–19` và `viec/AUDIT-4/boc.py` `DOI_CHUNG` ghi cứng số ca thu_P26c / thu_GOI1 → sau LUOI-5 thêm ca sẽ "lệch số ca"
  (thoát 4, đúng thiết kế đối chứng). N3 chạy LUOI-4 bằng số mới sửa TRONG BỘ NHỚ (không sửa file việc cũ).
- `server/routes/customers-v2.js:216–219` có bản sao điều kiện hạn điểm `expires_at IS NULL OR expires_at > ?` (danh sách khách — chỉ hiển thị,
  không hậu quả tiền), ngoài 18 tên; đường song song của `BALANCE_SQL` (`loyalty.js:28–32`). Soát kế hoạch tìm ra.
