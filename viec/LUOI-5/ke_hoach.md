# LUOI-5 — kế hoạch (CHỜ DUYỆT)

Nền: HEAD `48ba548` (PHIEU: LUOI-5). Chỉ thêm ca hồi quy + công cụ đo của việc; 0 dòng `server/`, `client/`, `viec/AUDIT-*/`.
Số dòng dưới đây đọc trong lượt này.

## 0. Sự thật đã đo (N0 — `trang_thai.md` mục N0, đầu ra `n0_do.txt`)
`python3 viec/LUOI-5/dot_bien.py -j 4` trên HEAD, lưới đủ 8 bài, đối chứng xanh đủ số ca: **BẮT 8 · SỐNG 9 · HỎNG-sập 1**. Tám tên đã BẮT
khi có thu_GOI1 / thu_P26b trong lưới (packages-04/06, discount-codes-02/03/04, signup-codes-05/06, KB16) — không viết gì cho chúng.
Còn 10 tên: 9 SỐNG + `packages-01` (thu_GOI1 đỏ đúng A1a rồi SẬP ở `taoGoi`). Một trong 9 (`goi-bo-kiem-con-lai`) hỏi chủ quán (Q1).

Công cụ đo `viec/LUOI-5/dot_bien.py` (đã viết, ~150 dòng): nạp CHỈ ĐỌC khung AUDIT-1 (bản sao 'sv', `ap`, `chay_lenh`), bảng AUDIT-2 (neo
A3L / BK) và luật sập AUDIT-4 (`sap_cua`). C2F sinh lại trên HEAD, chọn theo chữ ký câu ghi (số trong tên đã trôi — discount-codes 03 ↔ 04).
Mọi bài chạy hết → thấy mọi bài bắt. Đối chứng: bản sao không đột biến phải xanh, đúng `SO_CA` từng bài.

## 1. Phương án

### Phần A — ca cho 9 tên (8 SỐNG + packages-01)
| | A (chọn) | B |
|---|---|---|
| chỗ | thu_P26c: 7 ca (đã mount damages / rewards / loyalty / signup-codes, có SX giả bật được `sx.che = 'song'`; thêm mount `customers-v2`). thu_GOI1: 1 ca A6j + sửa `taoGoi` không ném | rải theo gợi ý phiếu: điểm vào thu_P26a (16 ca, chưa có helper điểm / đổi quà), kho vào thu_GOI1 (SX giả của GOI1 luôn ném — `callSxApi: loiSX` `thu_GOI1.js:67–68` → không tới được `damages.js:218`) |
| số dòng | ~40 P26c + ~12 GOI1 | ~70 (dựng lại helper điểm, đổi SX giả GOI1 làm đổi ca cũ) |
| rủi ro | ca mới dùng SĐT / quà / cài đặt riêng, trả cài đặt như khối [L] đang làm (`KHOA` + `cu`) | đụng SX giả dùng chung của GOI1 |

Chọn A: khối `[L]` thu_P26c đã có `diem`, `themDiem`, `ban`, `datCaiDat`, quà + đổi điểm, nhân điểm mã bill (`thu_P26c.js:653–695`); `[B3]` đã có
`baoHong` hoàn kho (`:420–438`). Không bài thử mới.

### Phần B — `packages-01` sập (thu_GOI1 `taoGoi` `:126–131`)
Dưới đột biến, POST /packages trả 200 mà không có dòng (`data` null) → `r.data.id` ném TypeError → cả bài sập, A1a đúng mà không đếm.
| | A (chọn) | B |
|---|---|---|
| cách | `taoGoi`: tạo qua route như cũ; không được id (≠ 200 hoặc `data` rỗng) → `k('dựng taoGoi …', false)` rồi INSERT thẳng gói mẫu (khuôn LUOI-4 `dungGoi`: dựng hỏng → một dòng ✗ rồi đi tiếp) — ca sau chạy trên dữ liệu đúng | dừng bài có kiểm soát sau A1a (in dòng tổng) — mất mọi ca sau, che lỗi khác cùng lúc |
| số dòng | ~5 | ~4 |
| số ca khi xanh | KHÔNG đổi (dòng `dựng` chỉ in khi hỏng) | như A |

Lặp như LUOI-4: chạy lại `C2F-packages-01-insert-quan-tri`; còn sập chỗ khác (POST /packages trực tiếp ở `:277`, `:347`, `:460` dùng `?.`
nhưng có thể ném ở bước sau) thì xử lý đúng khuôn đó, ghi vào `trang_thai.md`.

### Phần C — công cụ (`viec/LUOI-5/dot_bien.py`)
Thêm: (a) mẫu = TÊN CA LUOI-5 cho 9 tên (8 tên đã BẮT giữ mẫu `✗ ` + ghi bài bắt ở N0); (b) `--truoc` → `SO_CA` cũ (P26c 121, GOI1 110),
mặc định số mới (P26c 128, GOI1 111); (c) cờ `--n3`: chạy `viec/LUOI-4/dot_bien.py` với số ca mới sửa TRONG BỘ NHỚ (file LUOI-4 ghi cứng
121 / 110 — Phát hiện), không sửa file việc cũ. ~25 dòng thêm.

## 2. Ca thử ↔ nghiệm thu (1-1)
"đb" = trên đột biến. Số tự tính trên gốc VÀ đột biến; xác nhận bằng chạy ở bước 4.

| NT | tên | ca (bài) | dữ liệu + khẳng định (gốc) | đb |
|---|---|---|---|---|
| N1 | `C2F-damages-03-update-quan-tri` | **B3e** (P26c `[B3]`) | `sx.che = 'song'`, đơn 1 × `sp[1]` 20.000, hoàn kho SX 1 → 200, log `returned_to_stock = 1`; đơn B3c (SX lỗi) log vẫn 0 (ngay dưới); trả `sx.che = 'loi'` | log 0 (báo cáo "đã trả kho" `damages.js:86` thiếu) |
| N1 | `C2F-packages-01-insert-quan-tri` | **A1a** có sẵn (GOI1) + Phần B | gói 5+5+5+5+5+6 → 200, lưu 31 | A1a ✗ "lưu 31" (không có dòng); bài chạy hết, không sập |
| N1 | `C2F-packages-03-update-quan-tri` | **A6j** (GOI1 `[A6]`, sau A6h) | gói `goiId` của A6a/A6b (khách đã lấy đủ → completed, 0 khách active, có lịch sử) → DELETE 200 "chuyển ngừng bán", `is_active = 0`; mua lại gói đó cho SĐT mới → 400 "Gói sản phẩm không tồn tại" (`orders.js:409–410`), không đơn | `is_active` 1, mua 200 |
| N1 | `C2F-rewards-02-update-quan-tri` | **L9a** (P26c `[L]`) | quà mới 3 điểm → PUT `points_cost: 5` → 200; khách 4 điểm đổi → 400 "có 4, cần 5", điểm vẫn 4, 0 voucher | giá vẫn 3 → đổi 200, điểm 1 |
| N1 | `C2F-rewards-03-update-quan-tri` | **L9b** (P26c `[L]`) | quà mới 3 điểm → DELETE 200; khách 3 điểm đổi → 404 "Quà không tồn tại hoặc đã tắt" (`loyalty.js:133–137`), điểm vẫn 3 | quà còn bật → 200, điểm 0 |
| N1 | `C2F-customers-v2-05-insert-quan-tri` | **X1a** (P26c, khối mới `[X]`) | SĐT mới (chưa có `pos_customers`) → PUT `/customers-v2/:sdt/discount` fixed 5.000 → 200 (nhánh INSERT `:376`); đơn 1 × `sp[0]` 25.000 → total 25.000 − 5.000 = **20.000** (`orders.js:562–576` máy chủ tự đọc chiết khấu khách) | không có dòng → total 25.000 |
| N1 | `C2F-customers-v2-04-update-quan-tri` | **X1b** (P26c `[X]`) | cùng SĐT → PUT percent 20 → 200 (nhánh UPDATE `:369`); đơn 1 × `sp[2]` 50.000 → 50.000 × 0,8 = **40.000** | vẫn fixed 5.000 → 45.000 (chọn 20 % vì 10 % = 45.000 trùng số đb) |
| N1 + N2 | `A3L-redeem-bo-han-diem` | **L7a** (P26c `[L]`) | SĐT mới: INSERT dòng `earn` 5 điểm `expires_at '2020-01-01 00:00:00'` (điểm hết hạn của chế độ `quarter` — **đường quầy không đi được** trong thời gian bài chạy: cần thời gian trôi; khuôn B3p) + `themDiem` 2 → GET `/loyalty/points` = 2; đổi quà 3 điểm (`q` của L1) → 400 "có 2, cần 3", 0 voucher | số dư 7 → đổi 200 |
| N1 | `A3L-nhandiem-he-so-mac-dinh` | **L8a** (P26c `[L]`, trước vòng trả cài đặt) | `nhandiem_enabled` 1, XOÁ `nhandiem_he_so` (ca KHÔNG truyền — K3 mặc định là hành vi); bán 50.000 có SĐT → 5 điểm lúc bán; nhận điểm mã bill 200 → tổng 5 + round(5 × (2 − 1)) = **10** | hệ số 3 → 5 + 10 = 15 |
| N2 | `A3L-goi-bo-kiem-con-lai` | — | `## Câu hỏi` Q1 (lớp sau chặn hộ, không hậu quả tiền — lập luận `trang_thai.md`); bước 4 đo xác nhận bằng dữ liệu lệch dựng INSERT | — |
| N0 | 18 tên | — | đã đo (mục 0); sau khi sửa đo lại cả 18: 17 BẮT (+ Q1 theo chủ quán chọn) | |
| N3 | — | — | nền đo trên HEAD TRƯỚC khi sửa (bước 4): `viec/P26c`, `GOI-1`, `GOI-2`, `SO-LUONG-1`, `BAN-HANG-1`, `LUOI-3`, `P20b`, `P20c`, `MA-GIAM-1` `dot_bien.py`, LUOI-2 (`viec/AUDIT-2/dot_bien.py A3L-… -j 4`), LUOI-4 (`--n3`); sau khi sửa số BẮT / "không áp được" BẰNG nền. `npm test`, `--day-du` xanh; P26c / GOI1 đo riêng 3 lần < 96 s (80 % của 120 s). Bảng cuối 18 dòng vào `trang_thai.md` | |

Mẫu `dot_bien.py`: damages-03 `✗ B3e ` · packages-01 `✗ A1a ` · packages-03 `✗ A6j ` · rewards-02 `✗ L9a ` · rewards-03 `✗ L9b ` · customers-v2-05
`✗ X1a ` · customers-v2-04 `✗ X1b ` · redeem-bo-han-diem `✗ L7a ` · nhandiem-he-so-mac-dinh `✗ L8a `. Ca khẳng định dữ liệu dựng TRƯỚC (quà tạo
200, PUT 200, điểm lúc bán 5) → dựng hỏng thì ca đỏ có lý do, không xanh oan. Dựng bằng route / INSERT, không ném.

Bằng chứng (`bang_chung_do.txt`): commit 1 = `dot_bien.py` có mẫu (chưa có ca) → chạy `--truoc` trên gốc → 8 SỐNG + 1 HỎNG-sập (đúng tên,
đúng nhãn N0); commit sau = ca mới → 9 BẮT đúng mẫu; `SỐ CA thu_P26c.js: 128`, `SỐ CA thu_GOI1.js: 111` (đếm lại trên HEAD sau vá).

## 3. Đường song song (K4)
- `BALANCE_SQL` (`loyalty.js:28–32`) dùng ở GET `/points` (:60) và đổi quà (:161): đột biến ở hằng → L7a khẳng định CẢ HAI.
- Chiết khấu khách: customers-v2 có 2 câu ghi (UPDATE / INSERT) → X1a + X1b mỗi nhánh một ca. `customers.js:521` cùng ghi chiết khấu nhưng
  ngoài 18 tên và ngoài `C2_FILES` → Phát hiện.
- Ngưng gói: DELETE có lịch sử (`packages.js:136`) và PUT `is_active: 0` (A6e — C2F packages-02, đã BẮT) cùng làm "ngưng"; cổng bán là một chỗ
  (`orders.js:409`). A6j đi đúng đường DELETE.
- Quà: PUT (`rewards.js:74`) và DELETE (`:87`) → L9a, L9b; cổng đổi quà đọc `is_active = 1` + `points_cost` (`loyalty.js:133–140`).
- Hoàn kho: `returned_to_stock = 1` chỉ ở `damages.js:218` (grep `returned_to_stock` trong `server/`: :86 đọc, :193 INSERT 0, :218 ghi 1).
- `taoGoi` ném: cùng khuôn với `coGoi` (`:148`), `nap` (`:511`), `mua30` (`:517`) — chỉ sửa chỗ nào NỔ dưới `packages-01` (lặp, ghi lại).
- Hệ số nhân điểm: `docCauHinhNhanDiem` có mặc định `hanGio` 24 (`signup-codes.js:119`) cùng khuôn — không có trong 18 tên → Phát hiện nếu
  AUDIT-5 cần.

## 4. Luồng hợp lệ phải KHÔNG bị chặn (K5)
Không đổi code quầy → không phép chặn mới. Ca 200 ở đúng biên (chống xanh oan): B3e hoàn kho 200; X1a / X1b PUT 200 + đơn 200 đúng total;
L9a PUT 200; L8a nhận điểm 200; A6j DELETE 200. Ca mới dùng SĐT / quà riêng; cài đặt nhân điểm trả lại bằng vòng `KHOA` có sẵn; `sx.che` trả
'loi' ngay sau B3e → `[B4]…`, `[K1b]`, `[S*]`, `[T*]` chạy như cũ (`npm test` chứng minh). A6j xoá gói `goiId` chỉ dùng trong khối `[A6]`.
Mount `customers-v2` (không timer, chỉ route — grep `setInterval|setTimeout` rỗng) vào thu_P26c không đổi route khác.

## 5. Ngân sách + thời gian máy
- ~40 dòng thu_P26c + ~12 thu_GOI1 + ~25 thêm `dot_bien.py` (đã có ~150 dòng công cụ đo) ≈ 230 dòng (khung 150–250). 0 dòng code quầy.
- N0 18 tên × 8 bài, 4 luồng: ~6 phút (đo lượt này). P26c / GOI1 thêm 7 + 1 ca < +1 s (LUOI-4 đo P26c 4,4–4,7 s, GOI1 3,4–3,9 s). N3: ~10 phút.

## 6. Chưa chạy / rủi ro
- X1a / X1b: phân hạng thành viên (`orders.js:589`) không áp cho SĐT mới không thẻ — dự kiến; CHƯA chạy.
- `packages-01`: số chỗ sập sau `taoGoi` chưa biết — lặp ở bước 5.
- Q1 chờ chủ quán; các phần khác không phụ thuộc Q1.
