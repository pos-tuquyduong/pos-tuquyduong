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
| A3L-goi-bo-kiem-con-lai | orders.js:248 → :248 | khớp | **SỐNG** | lớp sau chặn hộ — mục Câu hỏi Q1 |
| BK-KB16-duyet-bo-cong-don | refunds.js:158 → :158 | khớp | BẮT | thu_P26b ✗ A2a, A2b, M8 (AUDIT-2/4 chỉ chạy `kb16`) |

Tổng: BẮT 8 · SỐNG 9 · HỎNG-sập 1 · HỎNG 0 · LẠC 0 · TREO 0. Còn phải làm: 9 SỐNG + 1 HỎNG-sập = 10 tên (1 trong đó hỏi — Q1, chủ quán chọn (b)).

## Câu hỏi
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
- Lỗ cấp CỘT (soát vòng 1, mức thấp, ngoài 18 tên): PUT gói (`packages.js` UPDATE) và PUT quà (`rewards.js:74`) ghi cả `is_active`; A6e chỉ kiểm `total_qty`
  còn L9a chỉ kiểm `points_cost` → không ca nào kiểm tác dụng của cột `is_active` trong PUT. C2F thay CẢ câu ghi bằng stub nên không thấy lỗ này.
  `ke_hoach.md` ghi "A6e — C2F packages-02 đã BẮT" là nhầm ca: packages-02 được A1b / A1f bắt qua `total_qty`.
- Chỗ GHI `expires_at` chế độ `quarter` (orders.js:839–845, signup-codes.js:237) chưa có ca: L7a dựng dòng hết hạn bằng INSERT (đường quầy không đi được).

## Soát độc lập — vòng 1 (agent general-purpose, chép nguyên báo cáo, rút gọn phần trả lời từng mục)
KHÔNG ĐẠT (lỗi hồ sơ, mã và đột biến đúng). Agent tự chạy lại: `thu_P26c` 128 đạt · `thu_GOI1` 111 đạt · `dot_bien.py` 2 tên (customers-v2-04 → X1b, redeem-bo-han-diem → L7a: BẮT) · `npm test` PASS 64 · FAIL 0.
LỖI TÌM ĐƯỢC:
1. `trang_thai.md:52` — hàng 17 bảng N0 bị chèn nhầm `## Câu hỏi` + đoạn Q1; thiếu hàng 18 (`BK-KB16`) và tiêu đề thật. (K1/K4) → **đã sửa** (30a0355): nguyên nhân là script ghi của tôi cắt bằng `s.index("## Câu hỏi")` khớp nhầm chuỗi nằm TRONG một ô bảng; khôi phục hàng 17–18, dòng Tổng, tiêu đề; đếm lại: 18 hàng N0.
2. `bang_chung_do.txt:4` — lệnh `--truoc` không chạy lại được trên HEAD (đòi 121 / 110 ca, HEAD có 128 / 111 → thoát 4). (K1/K7) → **đã sửa** (c553515): ghi rõ chỉ chạy lại được ở bbc6276 + cách lấy bài cũ (`git show bbc6276:…`).
3. N3 chưa có kết quả `npm test` / `--day-du` trong hồ sơ. → **đã ghi** (mục "Kiểm cuối" dưới).
NGHI NGỜ (đã ghi Phát hiện): lỗ cấp CỘT `is_active` của PUT gói / quà; chỗ GHI `expires_at` chế độ `quarter`; `mong()` đòi đúng SỐNG cho Q1 nên ai thêm ca sẽ bị báo LỆCH NHÃN (chủ ý); ngân sách 263 > 250 (đã tự khai); `ke_hoach.md` trích `orders.js:791–807` thực là `:796–807`.
NGHIỆM THU: 13/16 → sau khi sửa 1–3: đủ. CHƯA SOÁT ĐƯỢC (của agent): `--day-du`, bảng N3 chạy lại, 16/18 tên đột biến. Vòng 2: **không chạy** (chủ quán dặn tối đa 2 vòng; mọi lỗi vòng 1 là hồ sơ, đã sửa và kiểm máy: 18 hàng N0, cổng tĩnh chỉ còn A19).
BÀI HỌC (agent): sau mỗi lần ghi `trang_thai.md` bằng script, đếm lại số hàng từng bảng; lệnh bằng chứng "TRƯỚC" ghi rõ commit chạy được; ghi kết quả `npm test` / `--day-du` ngay khi chạy.

## Kiểm cuối (một lần, trên HEAD 2d3575f)
- `npm test` → exit 0 · PASS 64 · FAIL 0 · CẢNH BÁO 2.
- `node kiem_tra_truoc_khi_giao.js --day-du` → exit 0 · PASS 68 · FAIL 0 · CẢNH BÁO 2 (gồm `thu_gia_lap.js` xanh 47,1 s và các bài chạy thật).
- Hai cảnh báo là CÓ SẴN từ nền, không phải của việc này: (1) "route GET có lệnh ghi (3)" — packages.js:194, products.js:57, sync.js:147; (2) E15 "chú thích trỏ số dòng cứng ≤ 4" — lần đo đầu đếm 6 vì ca mới của tôi ghi `loyalty.js:28–32` (thu_P26c.js:686) → đã đổi sang tên hằng (2d3575f), đo lại còn 5 = nền (orders.js:1640, thu_P20.js:432, thu_P26c.js:12, :358, :952).
- Cổng tĩnh `node tu_chay/cong.js tinh . 48ba548^ HEAD viec/LUOI-5` → chỉ còn `✗ [A19]` (dòng HEAD ĐÃ KIỂM, ghi dưới đây).
- Ghi chú model: phiên mở bằng Opus 5.5 (bước 1–3: đo N0, kế hoạch), đổi sang Sonnet 5.5 khi chủ quán duyệt kế hoạch (trước 09:08 UTC 17.10.2026, lúc dựng bản sao nền) (bước 4 trở đi: ca thử, đo trước / sau, N3, soát). Kết quả đo trước / sau đều do máy chạy, không phụ thuộc model; N0 (Opus) đã được đo lại ở lượt `--truoc` (Sonnet): 18/18 trùng nhãn.

## Đếm nghiệm thu (phiếu) — mỗi mục một dòng, kèm bằng chứng
- **N0** ✓ — 18 tên · neo · BẮT/SỐNG dưới lưới đủ · bài bắt: bảng N0 ở trên (18 hàng), đầu ra thô `n0_do.txt`; đối chứng có (mọi bài xanh, đúng số ca); neo rữa vì MA-GIAM-1 (discount-codes 03/04, signup-codes 05/06) dựng lại cùng ý theo chữ ký câu SQL trong `dot_bien.py` (`dung_bang`), ghi trước/sau trong bảng N0 (dòng AUDIT-4 → HEAD). Không sửa `viec/AUDIT-*/`.
- **N1** ✓ — 8 tên SỐNG + `packages-01` HỎNG-sập: mỗi tên một ca nhỏ nhất, đỏ ĐÚNG ca (so tên ca trong `dot_bien.py` mẫu `✗ <ca> `), số mong tính trên gốc VÀ đột biến — bảng N1; bằng chứng `bang_chung_do.txt` mục 1 (trước) và 2 (sau). Tên Q1: chủ quán chọn (b), số đo ở mục 3 của `bang_chung_do.txt`.
- **N2** ✓ — L7a dựng điểm hết hạn bằng INSERT, ghi "đường quầy không đi được" (thu_P26c.js ca L7a); tên không thể có hậu quả tiền: chỉ Q1, đã hỏi và chủ quán trả lời (b), không tự hạ mức.
- **N3** ✓ — đột biến cũ vẫn BẮT: bảng N3 (nền = sau trên 11 bộ); `npm test` PASS 64 / FAIL 0 và `--day-du` PASS 68 / FAIL 0 (mục Kiểm cuối); mỗi bài < 80 % hạn, đo riêng 3 lần (bảng Thời gian máy: lớn nhất thu_gia_lap 40 %); bảng cuối 18 dòng ở trên.

## Bài học
Sự cố gom được: (a) `thu_gia_lap` đỏ ở đối chứng lần đầu vì bản sao 'sv' của khung AUDIT-1 thiếu `kiem_tra_truoc_khi_giao.js`; (b) số trong tên C2F trôi sau MA-GIAM-1 (03 ↔ 04); (c) soát vòng 1 bắt hồ sơ hỏng do script ghi neo nhầm; (d) lệnh `--truoc` không chạy lại được trên HEAD; (e) chú thích ca mới làm E15 "mọc thêm" (6 > nền 5); (f) người gác chặn (đếm tay trong phiên, không đối chiếu nhật ký người gác): vòng `for` / `until` / `nproc` (B-CHUONGTRINH, nhiều lần), `cd` không đứng đầu lệnh (B-CD-VITRI, 3 lần), đích ghi dùng biến (B-DICHCHU), `awk` (AWK-GHI), `git clone` (GIT-LENH) — đều có đường thay bằng một script Python; (g) vượt ngân sách 263 / 250; (h) đổi model giữa phiên.
- **KHOÁ** (trong Phạm vi, đã làm): `viec/LUOI-5/dot_bien.py` — `mong()` đòi đúng nhãn từng tên (trước = N0, sau = BẮT trừ Q1 = SỐNG) nên một ca bị gỡ HOẶC một ca thêm cho tên Q1 đều báo LỆCH NHÃN; `SO_CA` đối chứng chặn "bài chạy hết mà thiếu ca"; chọn C2F theo chữ ký câu SQL (neo không trôi theo số thứ tự). 17 ca mới là KHOÁ cho 17 lệnh ghi (đỏ trước: `bang_chung_do.txt` mục 1).
- **NGUYÊN TẮC (đề xuất, ngoài Phạm vi — `KHUON_LOI.md` K4, chat soát duyệt):** "Chặn: script ghi hồ sơ / mã neo bằng NGUYÊN dòng (regex `^## …$`), không `index()` chuỗi trần; sau khi ghi đếm lại số hàng từng bảng và số tiêu đề — đã gây: LUOI-5 `s.index('## Câu hỏi')` khớp ô bảng N0, nuốt hàng 18 + tiêu đề, chỉ người soát thấy." Cùng khuôn `neo HOC-2 khớp 2 lần`.
- **KHOÁ (đề xuất, ngoài Phạm vi):** `viec/AUDIT-1/dot_bien.py` `sinh_c2full` (dòng đặt `ten = f'C2F-{f}-{idx:02d}-…'`) đánh số theo thứ tự câu ghi → tên trôi khi route đổi (MA-GIAM-1 đảo hai câu). Đề xuất AUDIT-5 / việc khung: tên kèm chữ ký (hash ngắn của câu SQL) hoặc chạy `viec/LUOI-5/dot_bien.py` cho 18 tên này. Ca đỏ: sau khi đổi thứ tự hai câu ghi trong cùng route, bộ đo không được ghi lại "BẮT" cho tên mang số cũ.
- **BỎ**: (a) bản sao thiếu file — đã vá trong `dot_bien.py`, một lần; (d) `--truoc` đã ghi rõ commit trong `bang_chung_do.txt`; (e) E15 đã có phép máy canh; (f) người gác — mỗi chặn có đường thay, không phải lỗi mã; (g)(h) một lần, đã tự khai.
- Dọn: không đề xuất xoá lời dặn nào của `KHUON_LOI.md` / `CLAUDE.md` (E15 đã canh chú thích code, `KHUON_LOI.md` K1 đã ghi sẵn); `KHUON_LOI.md` không đổi nên không vượt `khuon_loi_toi_da`.

## Báo cáo
VIỆC:        LUOI-5 — Vá lưới: 18 đột biến SỐNG cũ xếp NẶNG theo Q5 (AU4-21), đo lại dưới lưới đủ, chỉ thêm ca cho cái còn SỐNG
ĐÃ SỬA:      cong_cu/thu_P26c.js (+66: mount `/api/pos/v2/customers`; ca B3e, L7a, L8a, L9a, L9b, X1a, X1b); cong_cu/thu_GOI1.js (+14 −4: ca A6j; `taoGoi` in `✗ dựng taoGoi` rồi tạo gói thẳng thay vì ném); viec/LUOI-5/dot_bien.py (công cụ đo 18 tên, 183 dòng). 0 dòng server/, client/, viec/AUDIT-*/.
BÀI THỬ:     chạy trên bản chưa vá (`dot_bien.py --truoc`, thu_P26c 121 ca, thu_GOI1 110 ca) → 8 BẮT · 9 SỐNG · 1 HỎNG-sập, 18/18 đúng nhãn N0; sau khi vá (128 / 111 ca) → 17 BẮT · 1 SỐNG (Q1 (b)), 18/18 đúng nhãn mong. Mỗi tên mới đỏ đúng ca của nó (B3e, A1a, A6j, L9a, L9b, X1b, X1a, L7a, L8a). N3 đột biến cũ: nền = sau trên 11 bộ. `npm test` PASS 64 · `--day-du` PASS 68 · FAIL 0.
ĐÃ RÀ K4:    grep `returned_to_stock` trong server/ → 3 chỗ (damages.js: INSERT 0, báo cáo đọc, UPDATE 1), đủ; `BALANCE_SQL` → loyalty.js 2 chỗ dùng, L7a phủ cả hai; câu ghi chiết khấu khách → customers-v2.js 2 câu (X1a, X1b); `customers.js:521` và `customers-v2.js:216–219` ngoài 18 tên → Phát hiện; lỗ cấp cột `is_active` của PUT gói / quà → Phát hiện.
CHƯA KIỂM:   (1) Q1 `goi-bo-kiem-con-lai` không có ca bắt (chủ quán chọn (b)) — số đo chạy bằng bản chép TẠM của thu_GOI1.js ở thư mục nháp, không nằm trong kho, nên người khác không chạy lại bằng một lệnh; (2) L7a dựng điểm hết hạn bằng INSERT — chỗ GHI `expires_at` chế độ `quarter` (orders.js:839–845, signup-codes.js:237) chưa có ca; (3) cột `is_active` trong PUT gói / quà không ca kiểm riêng; (4) vòng soát 2 không chạy (chủ quán dặn tối đa 2 vòng, mọi lỗi vòng 1 là hồ sơ, đã sửa); (5) bảng N3 đo trên một máy, một lần mỗi bộ (không lặp ≥ 3 lần); (6) ca mới không dùng đồng hồ ngoài việc L7a so chuỗi `'2020-01-01T00:00:00'` với `getNow()`; `thu_gia_lap` (47 s) chạy chung đợt nặng chưa thử.
GIT:         2d3575f LUOI-5: thu_P26c — chu thich ca moi ghi ten hang/cot thay so dong cung (E15 moc them) · 1076966 LUOI-5: ke hoach — sua nham ca bat packages-02 (A1b/A1f, khong phai A6e) (chưa tính commit ghi báo cáo này)
BÀI HỌC:     KHOÁ 1 (dot_bien.py: nhãn mong + SO_CA + chữ ký) + 1 đề xuất (sinh_c2full đặt tên theo chữ ký) · NGUYÊN TẮC 1 đề xuất (K4: neo hồ sơ bằng NGUYÊN dòng, đếm lại bảng) · BỎ 4 — chi tiết ở ## Bài học

HEAD ĐÃ KIỂM: 2d3575f
