# LUOI-5 — trạng thái

## Bước 1 — đối chiếu bản chụp (17.10.2026)
- nhánh `viec/LUOI-5`; `git status --short` sạch; `git fetch origin viec/LUOI-5` → HEAD `48ba548` = FETCH_HEAD `48ba548` (bằng nhau, không kéo).
- `git log --oneline -3`:
  ```
  48ba548 PHIEU: LUOI-5
  2b65db4 TIEN-DO: LUOI-4 (8ac79a7), MA-GIAM-1 (5a6fc0f), TU-CHAY-7 (49f9140) xong; mo LUOI-5 + TU-CHAY-8; them TU-CHAY-9, DONG-GOI-1, MA-GIAM-2 — so v36
  49f9140 Merge pull request #31 from pos-tuquyduong/viec/TU-CHAY-7
  ```

## Bước 1 — làm tiếp sau khi chủ quán duyệt kế hoạch (17.10.2026)
- nhánh `viec/LUOI-5`; cây sạch; `git fetch origin viec/LUOI-5` → HEAD `a27d20c` = FETCH_HEAD `a27d20c` (bằng nhau, không kéo).
- `git log --oneline -3`:
  ```
  a27d20c LUOI-5: trang thai — Phat hien customers-v2 loc han diem, ghi da soat ke hoach
  bc896a7 LUOI-5: ke hoach sua theo soat (X1 dot bien 400 khong khop tong, taoGoi du phong giu items/them, sx.che try/finally, N3 do moi bai)
  f2439e8 LUOI-5: ke hoach (cho duyet)
  ```

## Trạng thái
Chủ quán duyệt kế hoạch (a27d20c); Q1 → (b). Bước 4–7 xong: 7 ca `thu_P26c.js` + `A6j` + `taoGoi` không sập `thu_GOI1.js`; bằng chứng `bang_chung_do.txt`;
N0 → N3 đã đo (dưới). Còn: `npm test` một lần ở cuối, soát độc lập (tối đa 2 vòng), báo cáo 7 mục.

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
| A3L-goi-bo-kiem-con-lai | orders.js:248 → :248 | khớp | **SỐNG** | lớp sau chặn hộ — `## Câu hỏi
- **Q1 — ĐÃ TRẢ LỜI (chủ quán, khi duyệt kế hoạch a27d20c): (b)** — không thêm ca cho `A3L-goi-bo-kiem-con-lai` (orders.js:248 `if (conLai <= 0)`); ghi
  "lớp sau chặn hộ (:884, :940–949)"; AUDIT-5 xếp lại mức (máy không tự hạ mức). Lập luận đọc code: từ :248 tới `beginTransaction` (:856) không có câu
  ghi nào (grep `await run\(|tx\.run\(|ghiVi\(` trong orders.js: câu ghi đầu tiên là :870 trong giao dịch). **Số đo (bước 4, `bang_chung_do.txt` mục 3):**
  ép gói `active` mà `delivered_qty = total_qty`, lấy 1 từ gói; gỡ `if (conLai <= 0)` → vẫn **400 `GOI_HET_LUOT`** cho cả gói có danh sách loại lẫn gói không
  danh sách; giao 10 → 10, trạng thái `active` → `active`, đơn 1 → 1, sổ ví 0 → 0 (trên server nguyên vẹn: kết quả y hệt, cùng mã lỗi). Lớp chặn hộ trong dữ
  liệu này là câu trừ lượt có trần (:940–949, rollback); phép theo loại (:884) không tham gia vì đếm theo đơn thật chưa vượt loại. Nhãn của tên này trong
  `dot_bien.py` là SỐNG có chủ ý (`Q1`), `mong()` đòi đúng SỐNG — nếu một ngày có bài thử bắt nó thì bộ báo LỆCH để người đọc cập nhật bảng.

## Phát hiện
- `server/routes/customers.js:521` cũng ghi `discount_type` / `discount_value` của khách (đường song song của customers-v2-04), nhưng C2F
  (`viec/AUDIT-1/dot_bien.py` `C2_FILES`) không quét `customers.js` — câu ghi này chưa có đột biến nào. Ngoài phạm vi LUOI-5.
- `viec/LUOI-4/dot_bien.py:18–19` và `viec/AUDIT-4/boc.py` `DOI_CHUNG` ghi cứng số ca thu_P26c / thu_GOI1 → sau LUOI-5 thêm ca sẽ "lệch số ca"
  (thoát 4, đúng thiết kế đối chứng). N3 chạy LUOI-4 bằng số mới sửa TRONG BỘ NHỚ (không sửa file việc cũ).
- `server/routes/customers-v2.js:216–219` có bản sao điều kiện hạn điểm `expires_at IS NULL OR expires_at > ?` (danh sách khách — chỉ hiển thị,
  không hậu quả tiền), ngoài 18 tên; đường song song của `BALANCE_SQL` (`loyalty.js:28–32`). Soát kế hoạch tìm ra.
- `cong_cu/thu_GOI1.js`: các `throw` dựng còn lại ngoài `taoGoi` (`coGoi` mua gói `:148`, `nap`, `mua30`) vẫn ném khi route hỏng; chỉ `taoGoi` được đổi vì
  chỉ nó NỔ dưới `packages-01`. Đột biến khác làm hỏng `muaGoi` / nạp ví sẽ sập cả bài theo cùng khuôn — việc sau nếu AUDIT-5 gặp.
- Tên C2F sinh theo thứ tự câu ghi trong file nên TRÔI khi sửa route (MA-GIAM-1 đảo hai câu → `discount-codes` 03 ↔ 04). `viec/LUOI-5/dot_bien.py`
  chọn theo chữ ký câu SQL; các bộ AUDIT-* vẫn chọn theo tên + số thứ tự → AUDIT-5 nên đo lại bằng chữ ký (hoặc chạy `viec/LUOI-5/dot_bien.py`).

## N1 — mỗi tên còn SỐNG: ca nhỏ nhất bắt nó (số mong tự tính trên gốc VÀ trên đột biến; chạy thật ở `bang_chung_do.txt`)
Code quầy KHÔNG đổi (0 dòng `server/`, `client/`) → không có đột biến `VS-`/`BV-` của việc; đột biến là AU4-21 (đã có), đỏ chứng minh ở `bang_chung_do.txt` mục 1 → 2.

| tên | ca (bài) | dữ liệu → khẳng định (gốc) | trên đột biến (đo) |
|---|---|---|---|
| `C2F-damages-03` | B3e (P26c) | `sx.che='song'` quanh lệnh báo hỏng (`try/finally` trả 'loi'); hoàn kho 1 ly → 200, log `returned_to_stock` = 1; log của B3c (SX lỗi) = 0 | log 0 (d4 0) |
| `C2F-packages-01` | A1a (GOI1, có sẵn) + `taoGoi` không ném | thêm gói 5+5+5+5+5+6 → lưu 31; trước: bài SẬP ở `taoGoi` (`r.data.id`) | A1a ✗ "lưu 31"; `taoGoi` in `✗ dựng taoGoi` rồi INSERT gói đủ `items`+`them`, bài chạy hết (106 đạt · 47 hỏng, không sập) |
| `C2F-packages-03` | A6j (GOI1) | gói A6a (khách lấy đủ → completed, 0 khách đang dùng, có lịch sử) → DELETE 200, `is_active` 0; mua lại → 400, 0 đơn | `is_active` 1, mua 200 (110 đạt · 1 hỏng) |
| `C2F-rewards-02` | L9a (P26c) | quà 3 điểm, PUT `points_cost: 5` → khách 4 điểm đổi 400 (điểm vẫn 4); thêm 1 → đổi 200, điểm 0 | giá vẫn 3 → đổi 200, điểm 1 |
| `C2F-rewards-03` | L9b (P26c) | quà 3 điểm, DELETE 200 → khách 3 điểm đổi 404, điểm vẫn 3, 0 voucher | quà còn bật → đổi 200, điểm 0 |
| `C2F-customers-v2-05` | X1a (P26c; mount `/api/pos/v2/customers`) | khách chưa có hồ sơ (`COUNT=0`), PUT fixed 5.000 (nhánh INSERT) → đơn 25.000 → tổng 25.000 − 5.000 = **20.000** | không có dòng → 400 "Số tiền thanh toán (20.000đ) không khớp tổng" |
| `C2F-customers-v2-04` | X1b (P26c) | cùng khách, PUT percent 20 (nhánh UPDATE) → đơn 50.000 → 50.000 × 0,8 = **40.000** (20 %: 10 % ra 45.000 trùng 50.000 − 5.000, sẽ xanh oan) | vẫn fixed 5.000 → 400 "không khớp tổng đơn (45.000đ)" |
| `A3L-redeem-bo-han-diem` | L7a (P26c) | INSERT 5 điểm `expires_at '2020-01-01T00:00:00'` + 2 điểm còn hạn (**đường quầy không đi được**, khuôn B3p) → xem điểm = 2; đổi quà 3 điểm 400, 0 voucher | xem điểm 7, đổi 200 |
| `A3L-nhandiem-he-so-mac-dinh` | L8a (P26c) | XOÁ `nhandiem_he_so` (ca KHÔNG truyền hệ số; vòng `KHOA` khôi phục), bán 50.000 có SĐT → 5 điểm; nhận điểm mã bill → 5 + round(5 × (2 − 1)) = **10** | hệ số 3 → 5 + round(5 × 2) = 15 |
| `A3L-goi-bo-kiem-con-lai` | — (Q1 (b)) | lớp sau chặn hộ, số đo ở mục Câu hỏi | SỐNG có chủ ý |

N2: duy nhất L7a cần dữ liệu quầy không đi được (điểm hết hạn cần thời gian trôi) → dựng bằng INSERT. Không tên nào "không thể có hậu quả tiền" ngoài Q1 (đã hỏi, chủ quán chọn (b)).

## Bảng cuối 18 dòng — HEAD 48ba548 (trước) → sau LUOI-5 (`python3 viec/LUOI-5/dot_bien.py`, `bang_chung_do.txt`)
| # | tên | trước | sau | ca bắt (bài) |
|---|---|---|---|---|
| 1 | C2F-damages-03-update-quan-tri | SỐNG | **BẮT** | B3e (thu_P26c) |
| 2 | C2F-packages-01-insert-quan-tri | HỎNG-sập | **BẮT** | A1a (thu_GOI1) |
| 3 | C2F-packages-03-update-quan-tri | SỐNG | **BẮT** | A6j (thu_GOI1) |
| 4 | C2F-packages-04-delete-quan-tri | BẮT | BẮT | A6h (thu_GOI1) |
| 5 | C2F-packages-06-update-quay | BẮT | BẮT | A5c… (thu_GOI1) |
| 6 | C2F-discount-codes-02-update-quan-tri | BẮT | BẮT | G13, G14 (thu_P20) |
| 7 | C2F-discount-codes-03-update-quan-tri | BẮT | BẮT | M5… (thu_P26a) |
| 8 | C2F-discount-codes-04-delete-quan-tri | BẮT | BẮT | M2… (thu_P26a) |
| 9 | C2F-signup-codes-05-update-quan-tri | BẮT | BẮT | H3b… (thu_P20) |
| 10 | C2F-signup-codes-06-delete-quan-tri | BẮT | BẮT | H3 hoàn tác… (thu_P20) |
| 11 | C2F-rewards-02-update-quan-tri | SỐNG | **BẮT** | L9a (thu_P26c) |
| 12 | C2F-rewards-03-update-quan-tri | SỐNG | **BẮT** | L9b (thu_P26c) |
| 13 | C2F-customers-v2-04-update-quan-tri | SỐNG | **BẮT** | X1b (thu_P26c) |
| 14 | C2F-customers-v2-05-insert-quan-tri | SỐNG | **BẮT** | X1a (+X1b) (thu_P26c) |
| 15 | A3L-redeem-bo-han-diem | SỐNG | **BẮT** | L7a (thu_P26c) |
| 16 | A3L-nhandiem-he-so-mac-dinh | SỐNG | **BẮT** | L8a (thu_P26c) |
| 17 | A3L-goi-bo-kiem-con-lai | SỐNG | SỐNG (Q1 (b)) | — lớp sau chặn hộ |
| 18 | BK-KB16-duyet-bo-cong-don | BẮT | BẮT | A2a, A2b, M8 (thu_P26b) |

Tổng: trước BẮT 8 · SỐNG 9 · HỎNG-sập 1 → sau **BẮT 17 · SỐNG 1** · HỎNG 0 · LẠC 0 · TREO 0.

## N3 — đột biến cũ vẫn BẮT (đo nền trên bản sao `git archive` của HEAD a27d20c, rồi đo sau trên kho đã thêm ca; `chay_n3`: mỗi bộ chạy trọn)
| bộ | nền | sau | khớp |
|---|---|---|---|
| viec/P26c | 89 bắt · 4 không áp được (trên 93) | 89 · 4 | ✓ |
| viec/GOI-1 | 40 bắt · 9 không áp được (trên 49) | 40 · 9 | ✓ |
| viec/GOI-2 | 59/59 | 59/59 | ✓ |
| viec/SO-LUONG-1 | 16 bắt · 1 không áp được (trên 17) | 16 · 1 | ✓ |
| viec/BAN-HANG-1 | 7/7 | 7/7 | ✓ |
| LUOI-2 (`viec/AUDIT-2/dot_bien.py` 7 tên A3L trên `c2luoi`) | BẮT 7 | BẮT 7 | ✓ |
| viec/LUOI-3 | 10/10 | 10/10 | ✓ |
| viec/LUOI-4 (`dot_bien.py --n3`: số ca mới 128 / 111 trong bộ nhớ) | BẮT 7 | BẮT 7 | ✓ (dưới `LOAI-CHAN-BANG` thu_GOI1 đỏ thêm A6j: 19 → 20 hỏng, vẫn đỏ đúng A2b) |
| viec/P20b | 4/4 | 4/4 | ✓ |
| viec/P20c | 20 bắt · 1 không áp được (`BV-A3-bo-dieu-kien`, neo rữa vì MA-GIAM-1) | 20 · 1 | ✓ |
| viec/MA-GIAM-1 | 26/26 | 26/26 | ✓ |
"Không áp được" là đã biết từ nền, không tăng. P26c / GOI-1 / SO-LUONG-1 thoát 1 vì các neo đó, cũng như nền.

## Thời gian máy (đo riêng từng bài 3 lần nối tiếp, không chạy chung việc khác; hạn `chayBaiThat` 120 s → 80 % = 96 s)
| bài | 3 lần (s) | % hạn |
|---|---|---|
| gia_lap/chay.js | 33,2 · 33,6 · 33,6 | 28 % |
| thu_P26a | 0,9 · 0,9 · 0,8 | 1 % |
| thu_P26b | 1,6 · 1,7 · 1,8 | 2 % |
| thu_P26c (128 ca) | 3,5 · 3,6 · 3,6 | 3 % |
| thu_GOI1 (111 ca) | 2,9 · 2,8 · 3,3 | 3 % |
| thu_P20 | 2,2 · 2,1 · 2,0 | 2 % |
| thu_P21 | 0,8 · 0,9 · 1,0 | 1 % |
| thu_gia_lap | 47,5 · 47,2 · 47,7 | 40 % |

## Ngân sách
Phiếu ~150–250 dòng thử: ca thử +80 −4 (`thu_P26c.js` +66, `thu_GOI1.js` +14 −4); công cụ đo `dot_bien.py` 183 dòng (kế hoạch ước ~175). Tổng dòng thêm ≈ 263 (hơi quá
mốc 250 vì công cụ đo thêm bảng chữ ký + nhãn mong trước/sau + `--n3`). 0 dòng `server/`, `client/`, `viec/AUDIT-*/`.
