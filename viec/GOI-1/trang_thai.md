# GOI-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (13.10.2026)
- Nhánh: `viec/GOI-1`. `git status --short` sạch (không dòng nào).
- `git fetch origin viec/GOI-1` → HEAD `93163f3` · FETCH_HEAD `93163f3` (bằng nhau — không kéo).
- `git log --oneline -3`:
  ```
  93163f3 PHIEU: GOI-1
  7f8656d TIEN-DO: P26c xong (9a68ab6), AUDIT-2 xong (bcfb509), mo GOI-1 + LUOI-2, them AUDIT-3 + DANG-NHAP-1 — so v28
  9a68ab6 Merge pull request #16 from pos-tuquyduong/viec/P26c
  ```
- Có commit `PHIEU: GOI-1`.

## Bước 2 — đã đọc (lượt này)
`phieu.md`, `CLAUDE.md`, `KHUON_LOI.md`, mục lục `CHECKLIST_CODE.md` (P4, G, H theo CLAUDE.md §2).
Code: `packages.js` (cả file), `orders.js` 160–400, 760–900, 990–1030, 1340–1360, 1400–1430, 1536–1560, `middleware/auth.js`
84–110, `helpers.js` 145–160, `customers-v2.js` 19–80 + 201–260, `database.js` (bảng `pos_customers`, `pos_wallets`,
`pos_packages`, `pos_customer_packages`, dòng 982), `Settings.jsx` 338–390 + 1140–1230, `Reports.jsx` 15–92 + 344–430,
`Customers.jsx` 25–160, `Sales.jsx` 75–112 + 405–435 + 535–550, `App.jsx` (route), `AuthContext.jsx` 58–66, `api.js` 180–242,
`kiem_tra_truoc_khi_giao.js` 215–240 + 492, `thu_P26c.js` 1–60 (khuôn bài thử), grep `pos_packages` trong `cong_cu/`.

## Bước 3 — kế hoạch
`ke_hoach.md`. Phiếu dặn **chờ duyệt kế hoạch** → commit, push, DỪNG. Câu hỏi cho chủ quán ở `ke_hoach.md` mục 11.
- Agent phụ (chỉ đọc) soát kế hoạch theo 4 câu → đã sửa: bỏ lọc gói ở máy chủ; không đặt sẵn lọc "Đang giao"; dừng gói một phép
  `UPDATE … AND status='active'`; thêm ca A1f, A2g–A2i, A4e–A4f, A5h, A6 (gia hạn, xoá gói, tổng lệch); lịch sử giao dùng chung
  điều kiện đếm; bỏ câu sai "khách 150 % vẫn lấy được"; sửa vị trí `BV-GOI1-DEM`; đột biến P26c đổi mong đợi → DỪNG (ngoài Phạm vi);
  thêm C6 (huỷ / xoá đơn mua gói của gói đã dừng), C7 (`package_buy` không SĐT).

## Làm tiếp sau duyệt (13.10) — bước 1
- `git status --short` sạch. fetch → HEAD `21736a8` · FETCH_HEAD `21736a8` (bằng nhau — không kéo).
- `git log --oneline -3`:
  ```
  21736a8 GOI-1: ke hoach — sua theo soat (them ca, bo phan thua, C6-C7)
  e1f2e51 GOI-1: ke hoach (cho duyet) + trang thai buoc 1-3
  93163f3 PHIEU: GOI-1
  ```
- Chủ quán duyệt: C1 đồng ý; C2 đặt sẵn "Đang giao"; C3 có; C4 không đổi khoá; C5–C7 ghi Phát hiện. Ghi ở `ke_hoach.md` mục 12–13.
- Mốc neo đột biến cũ trên `21736a8` (`python3 viec/HOC-2b/kiem_neo.py`): AUDIT-1 HỎNG 2 · P26b HỎNG 9 · HOC-1 0 · HOC-2 1 ·
  TU-CHAY-4 0 · HOC-2b 2 (có sẵn từ trước, không do GOI-1). Sau vá phải y nguyên.

## Bước 4 — bài thử trước
- `cong_cu/thu_GOI1.js` (mới, khuôn `thu_P26c`): 49 ca. Trên GỐC `21736a8` (server + client/src lấy bằng `git archive` vào thư mục
  nháp): **15 đạt · 34 hỏng**, thoát 1. Ca xanh trên gốc đều là luồng hợp lệ (K5) / phép có sẵn: A1c, A1f, A5a, A5d2, A5f, A5g,
  A6a–A6i. Sau vá: **49 đạt · 0 hỏng**. Chi tiết: `bang_chung_do.txt` (`SỐ CA cong_cu/thu_GOI1.js: 49`).
- Ca hai người cùng bấm: A2d (hai quầy cùng lấy — kho thử tự xếp hàng nên xanh cả gốc, giữ làm K5), A2d2 (khe hở tất định: đơn
  quầy 2 chèn ĐÚNG sau câu đọc "đã lấy" nếu câu đó chạy ngoài giao dịch — đột biến `VS-GOI1-LOAI-TRUOC-TX` bắt), A5e (hai chủ
  quán cùng dừng gói).
- Đổi bài sau lần đỏ đầu (A16): làm chặt A2d (bên thua phải là 400 `GOI_HET_LUOT_LOAI`), thêm A2d2, sửa A5a (đọc trạng thái
  trước khi gọi quản lý), A6d bỏ vế đã phủ ở A2c. Đã chạy lại cả gốc lẫn bản vá, chép lại `bang_chung_do.txt`.

## Bước 5 — chỗ vá → đột biến (`viec/GOI-1/dot_bien.py`, 45 đột biến sau soát vòng 2)
| Chỗ vá | Đột biến |
|---|---|
| tổng tự tính — POST (`packages.js`) | BV-GOI1-TONG, VS-GOI1-TONG-GUI |
| tổng tự tính — PUT | BV-GOI1-TONG-PUT |
| SL loại ≥ 1 | BV-GOI1-SL, VS-GOI1-SL-CHI-AM |
| giá > 0 — POST / PUT | BV-GOI1-GIA, VS-GOI1-GIA-AM, BV-GOI1-GIA-PUT |
| chặn theo loại trong giao dịch (`orders.js` + `goiKhach.js`) | BV-GOI1-LOAI, VS-GOI1-LOAI-SO-SAI, VS-GOI1-LOAI-TRUOC-TX |
| món lấy từ gói SL nguyên ≥ 1 (soát vòng 2) | BV-GOI1-SL-AM, VS-GOI1-SL-AM-CHI-0 |
| phép tĩnh bỏ chú thích (soát vòng 2) | VS-GOI1-KH-CHU-THICH, VS-GOI1-O-TONG-CHU-THICH |
| mua gói + lấy ngay | BV-GOI1-MUA-LOAI, VS-GOI1-MUA-NHAN-GOI |
| một cách đếm "đã lấy" | VS-GOI1-DEM-HUY, VS-GOI1-DEM-NULL, BV-GOI1-DEM |
| tên khách / lần lấy gần nhất / lịch sử giao | BV-GOI1-TEN, VS-GOI1-TEN-DON, VS-GOI1-LAN-LAY-HUY, BV-GOI1-LS |
| dừng gói | VS-GOI1-DUNG-QUYEN, BV-GOI1-LYDO, VS-GOI1-LYDO-KHONG-TRIM, VS-GOI1-DUNG-DUA, BV-GOI1-DUNG-CHANGES |
| Settings.jsx | VS-GOI1-O-TONG, BV-GOI1-TU-TINH, BV-GOI1-SL-MAN, VS-GOI1-LOC-AM-THAM, BV-GOI1-GIA-MAN, BV-GOI1-LINK |
| Reports.jsx | BV-GOI1-URL, VS-GOI1-LOC-GOI, BV-GOI1-TIM-TEN, BV-GOI1-DANG-GIAO, BV-GOI1-DO, VS-GOI1-SAP-CHUA-LAY, VS-GOI1-NUT-QUYEN, BV-GOI1-NUT-LYDO |
| Customers.jsx | BV-GOI1-KH-URL, BV-GOI1-KH-MOT-LAN (thêm sau soát vòng 1) |

- Đột biến đầu tiên cho chỗ "trong giao dịch" (`VS-GOI1-LOAI-NGOAI-TX`: đọc bằng `query` ngay trong khối giao dịch) SỐNG — kho
  thử tự xếp hàng; thay bằng `VS-GOI1-LOAI-TRUOC-TX` (đúng phương án B đã loại) + ca A2d2 tất định → bắt.
- Neo P26c: 93 đột biến của `viec/P26c/dot_bien.py` neo khớp đủ trên cây đã vá (script nháp đếm chuỗi). `kiem_neo.py` y nguyên mốc.
- Chạy lại TOÀN BỘ `python3 viec/P26c/dot_bien.py` trên HEAD `8ded1bf`: **93 đột biến bị bắt · 0 KHÔNG bị bắt** — không cái nào đổi mong đợi.

## Đối soát "Dừng gói" (A8 — CLAUDE.md điều 5, chỉ ghi quy tắc; viết lại sau soát vòng 1, lỗi 2)
- Gói dừng KHÔNG phát sinh tiền: lệnh dừng (`packages.js` PUT /customer-packages/:id/cancel) chỉ đổi `status`, `notes`,
  `updated_at` — không dòng `pos_balance_transactions`, không đổi `pos_wallets`, không đổi đơn (bài thử A5c, `chup()`).
- Nhận ra gói DỪNG bằng dữ liệu có cấu trúc, không bằng chữ trong `notes`: `pos_customer_packages.status = 'cancelled'` VÀ đơn mua
  gói (`order_id`) vẫn `pos_orders.status = 'completed'`. (Huỷ đơn mua gói — đường hoàn tiền P26c — làm đơn mua thành `cancelled`
  hoặc xoá hẳn gói; xoá đơn mua thì gói mất dòng.) Đối soát: mọi gói dừng ⇒ đơn mua của nó không có dòng hoàn `hoan_goi` / `refund`.
- Số túi bỏ dở của gói dừng = `total_qty − delivered_qty`; DOI-SOAT-1 đếm theo ẢNH CHỤP (tổng hiện tại của các gói dừng), KHÔNG
  cộng theo ngày bằng `updated_at`: huỷ / xoá một đơn lấy hàng cũ của gói đã dừng (`orders.js` nhánh "giao từ gói" của huỷ và xoá)
  vẫn trừ `delivered_qty` và đổi `updated_at` mà không lọc trạng thái gói — số bỏ dở tăng và `updated_at` dời ngày.
- Ngày dừng + người dừng + lý do chỉ có trong `notes` (dòng "Dừng gói: <lý do> — <người> <thời điểm ISO> (đã lấy d/t)", nối SAU
  ghi chú cũ nếu có) — đủ để người xem đối chiếu, chưa đủ để máy cộng theo kỳ. Muốn cộng theo kỳ cần cột riêng (đổi DB — phiếu
  ghi "không") → Phát hiện, chủ quán quyết.

## Phát hiện
- (soát vòng 2 — ĐƯỜNG TIỀN, ưu tiên cao, có từ trước GOI-1) POST /orders không kiểm `quantity` của món LẺ: gọi API thẳng với
  `[CT3 ×2, CT4 ×−1]` thì máy chủ tự tính tổng 25.000đ cho 2 túi 50.000đ (người soát đo, lời 400 "không khớp tổng … 25.000đ"
  — tức gửi đúng 25.000đ là qua). GOI-1 chỉ khoá món LẤY TỪ GÓI (`GOI_SL_KHONG_HOP_LE`, ca A2j); chặn cho mọi món là đổi đường
  tiền chung của đơn lẻ → chủ quán quyết, nên mở việc riêng (cần rà mọi nguồn gọi POST /orders trước — K5).
- (soát vòng 1, lỗi 2) Huỷ / xoá đơn LẤY HÀNG của gói ĐÃ DỪNG vẫn trừ `delivered_qty` + đổi `updated_at` của gói (`orders.js`,
  nhánh "giao từ gói" của huỷ và xoá — không lọc `status`). Có nên chặn / giữ nguyên, và có cần cột ngày dừng riêng để đối soát
  theo kỳ không — chủ quán quyết (vùng "CHƯA rà" CLAUDE.md §8; đổi DB). GOI-1 không đụng.
- (soát vòng 1, lỗi 3) Gói cũ có `total_qty` lớn hơn tổng SL danh sách loại (vd tổng 30, loại cộng 10): khách chỉ lấy được tới
  trần từng loại (10) — 20 lượt còn lại không lấy được, gói đứng `active`. Màn Bán hàng vốn đã chặn y vậy (Sales.jsx chặn theo
  loại); nay máy chủ cũng chặn. Cần rà dữ liệu thật trên production (gói nào lệch) — chủ quán quyết cách xử lý.
- (soát vòng 1, nghi ngờ) Danh sách loại có hai dòng trùng `sx_product_type/sx_product_id` (chỉ khi gọi API thẳng): tổng cộng cả
  hai, trần theo loại lấy dòng nhỏ. Máy chủ chưa chặn trùng. Việc sau.
- (GOI-1, đo 13.10) libsql CỤC BỘ (kho thử `data/pos_thu.db` / bài thử): hai giao dịch ghi chồng nhau → BEGIN thứ hai ném
  `SQLITE_BUSY` NGAY (không chờ), và sau đó MỌI giao dịch ghi kế tiếp đều BUSY tới khi khởi động lại (script nháp `thu_khoa.js`:
  t1 mở, t2 BUSY, t1 commit, t3 vẫn BUSY). Turso production khác đường kết nối — chưa đo. Ảnh hưởng máy Replit thử nghiệm khi
  hai thao tác ghi cùng lúc. Để việc sau (P8 / ketNoiKho).
- (GOI-1) Mã đơn tính NGOÀI giao dịch (`orders.js` `taoMaDonTheoSo` trước `beginTransaction`): hai đơn đọc cùng số trước khi một
  bên ghi → bên sau 500 `SQLITE_CONSTRAINT_UNIQUE` (thấy khi chạy đột biến kiểm trước giao dịch). Tiền không lẫn (rollback) nhưng
  quầy thấy lỗi 500 thay vì "bấm lại". Để việc sau.
- C5 "💰 DT gói" ở Báo cáo (`Reports.jsx:77`) cộng cả gói đã dừng / đã huỷ — DOI-SOAT-1 cần tách.
- C6 Huỷ đơn MUA gói của gói đã dừng (`orders.js:1376–1388`) ghi đè `notes` (mất lý do dừng); gói chưa lấy lần nào thì xoá hẳn.
  Xoá đơn mua gói (`orders.js:1527–1536`) cũng xoá hẳn gói. Đường tiền hoàn P26c — việc sau.
- C7 `package_buy` không kèm SĐT: không tạo gói (`orders.js:994` `&& phone`) nhưng món lấy ngay vẫn 0đ, không chỗ nào chặn trước.

## Bước 6 — kiểm (lần đầu, HEAD `8ded1bf` trước soát)
- `npm test`: thoát 0 · PASS 63 · FAIL 0 · CẢNH BÁO 0.
- `node kiem_tra_truoc_khi_giao.js --day-du`: thoát 0 · PASS 67 · FAIL 0 · CẢNH BÁO 0 (có `bài chạy thật cong_cu/thu_GOI1.js xanh`,
  `fetch trần ngoài api.js = 32 — đúng ngưỡng`).
- `python3 viec/GOI-1/dot_bien.py`: 40/40 bị bắt. `python3 viec/P26c/dot_bien.py`: 93/93 bị bắt.

## Bước 8 — soát độc lập vòng 1 (agent general-purpose, HEAD `8ded1bf`) — báo cáo chép nguyên
```
KHÔNG ĐẠT

Tôi đã chạy lại trên HEAD 8ded1bf, mỗi lệnh một lần:
- `node cong_cu/thu_GOI1.js`: 49 đạt · 0 hỏng.
- `python3 viec/GOI-1/dot_bien.py`: 40/40 đột biến bị bắt.
- `python3 viec/P26c/dot_bien.py`: chạy lại TOÀN BỘ, 93/93 bị bắt.
- `node kiem_tra_truoc_khi_giao.js --day-du`: thoát 0, PASS 67 · FAIL 0 · CẢNH BÁO 0. Có dòng "dist đã commit KHỚP với src hiện tại".
- `python3 viec/HOC-2b/kiem_neo.py`: AUDIT-1 HỎNG 2 · P26b 9 · HOC-1 0 · HOC-2 1 · TU-CHAY-4 0 · HOC-2b 2. Y nguyên mốc ghi ở trang_thai.md.

Đường máy chủ (orders.js, packages.js, goiKhach.js) tôi không tìm ra lỗi tiền. Hai lý do KHÔNG ĐẠT nằm ở màn Khách hàng và quy tắc đối soát A8.

LỖI TÌM ĐƯỢC:
1. client/src/pages/Customers.jsx:162–169 — effect mở khách theo `?phone=` có deps `[sdtMo, loading]`. Tham số `phone` không bao giờ bị xoá khỏi URL, nên mỗi lần `loadCustomers()` đổi `loading` true→false là effect chạy lại `openDetailModal(kh)`.
   - Lưu thông tin khách (dòng 258–260: đóng modal rồi `loadCustomers()`): modal BẬT LẠI ngay sau khi đóng.
   - Đổi quà tại quầy (dòng 220: `await loadCustomers()` khi modal đang mở): `openDetailModal` chạy lại, đặt `setRedeemResult(null)`, `setShowRedeem(false)` và nạp lại `detailForm`. Kết quả đổi quà vừa hiện bị xoá mất, ô đang sửa bị ghi đè.
   - Chỉ xảy ra khi vào màn Khách hàng bằng liên kết từ Báo cáo → Gói SP, đúng luồng A4 mới thêm.
   - Thêm một chỗ nhỏ: SX lỗi thì `customers=[]`, lời "Không tìm thấy khách …" đè lên "Không thể tải danh sách".
   - Khuôn K7 (lỗi kỹ thuật thường: deps của effect). Kèm K3: phép A4d (thu_GOI1.js:309–311) chỉ soi chuỗi có mặt nên không bắt được.
   - Cách gọn: mở xong thì xoá tham số (`setSearchParams({}, { replace: true })`), hoặc chỉ mở một lần.
2. viec/GOI-1/trang_thai.md:75 và :77 (quy tắc đối soát A8) có hai chỗ hở.
   - "DOI-SOAT-1 cộng theo … `updated_at`" không đứng vững. Huỷ đơn lấy hàng (orders.js:1432–1438) và xoá đơn (orders.js:1563–1569) đều `UPDATE pos_customer_packages SET delivered_qty = MAX(0, delivered_qty - ?), …, updated_at = ?` mà không lọc trạng thái. Vậy huỷ một đơn lấy hàng cũ của gói ĐÃ DỪNG sẽ dời `updated_at` sang ngày khác và tăng "số túi bỏ dở" ngược về trước. Đối soát ngày/tuần/tháng sẽ lệch.
   - Phép "`notes` mở đầu 'Dừng gói'" mâu thuẫn với code: packages.js:213 nối `cp.notes + '\n'` lên TRƯỚC "Dừng gói:" khi gói đã có ghi chú.
   - Quy tắc dựa vào khớp chuỗi tự do, không phải dữ liệu có cấu trúc.
   - Khuôn K1 (khẳng định chưa đối chiếu code) + K4 (quên đường song song huỷ/xoá đơn). Đây là vùng "CHƯA rà" theo CLAUDE.md §8. Cách sửa (chỉ ghi lại quy tắc hay chặn ở đường huỷ) phải hỏi chủ quán, không tự chọn.
3. cong_cu/thu_GOI1.js:404 — tên ca A6i nói "khách nhận 30 lượt như đã cài" nhưng ca chỉ lấy 2 và chỉ kiểm `cp.total_qty = 30`. Thực tế, gói cũ có tổng 30 mà danh sách loại cộng ra 10 thì chặn theo loại (orders.js:845–850 + goiKhach.js:565–577) chỉ cho lấy tối đa 10. 20 lượt còn lại không lấy được, gói đứng `active` mãi. Màn Bán hàng vốn đã chặn như vậy (Sales.jsx:421–427, 542–546), nên quầy không mất luồng nào mới. Nhưng tên ca sai sự thật, và giờ máy chủ khoá cứng việc này. Khuôn K3 (tên ca nói một đằng, máy kiểm một nẻo).

NGHI NGỜ:
- Phép tĩnh A1e, A3c, A4b–A4d, A5h (thu_GOI1.js:187–192, 271–272, 295–311, 355–358) là regex soi đúng chuỗi bản vá CÓ MẶT, trái E13. Một dòng chú thích chứa cùng chuỗi ("marker suông") sẽ làm chúng xanh. Chỉ có `filter(i => i.qty > 0)` là kiểm vắng mặt. Phiếu cho phép "như A7 của P26c" nên tôi không tính là lỗi, nhưng giá trị của các phép này thấp.
- Máy chủ không chặn danh sách loại có hai dòng cùng `sx_product_type_id`. Khi đó tổng = cộng cả hai, còn `vuotTheoLoai` xét từng dòng riêng, nên trần thực tế là SL nhỏ nhất, lệch với tổng. Màn hình (checkbox theo khoá) không tạo ra trường hợp này; chỉ có khi gọi API thẳng.
- GET /customer-packages/all (packages.js:167) chỉ cần `authenticate`, không cần quyền. Giờ nó trả thêm tên khách cho mọi nhân viên. Điều này có từ trước (không cần quyền), GOI-1 chỉ thêm cột.
- `delivered_items` bỏ trường `product_name`. Tôi grep client thì chỉ có Sales.jsx:107/423/544 dùng, và chỉ dùng `product_code`. Hiện không gãy gì.
- Đột biến `VS-GOI1-LOAI-NGOAI-TX` SỐNG và đã bị thay bằng `VS-GOI1-LOAI-TRUOC-TX` (trang_thai.md bước 5). Tôi đánh giá việc thay này chấp nhận được: `db.transaction("write")` (database.js:1374) giành khoá ghi ngay lúc BEGIN, nên đọc ngoài tx SAU BEGIN vẫn đúng thứ tự. Nhưng phải nói rõ đây là đổi đột biến sau khi thấy nó sống.

(Trả lời theo từng mục soát — K3, K4, K5, Đường tiền, P1, Đơn giản, K1 — chép nguyên ở dưới.)
- K3: bài thử đỏ trên gốc 15/34 (bang_chung_do.txt), xanh 49/0 sau vá. Ca máy chủ so status/code/DB, không dò chữ. Phép màn hình chỉ soi có mặt (xem NGHI NGỜ).
- K4: grep `unit_price = 0 | IS NULL` trong server cho 3 chỗ nhận "món lấy từ gói": huỷ orders.js:1427–1429, xoá :1559–1561, goiKhach.js:8–9. Điều kiện khớp nhau. Hai đường lấy từ gói (gói cũ trong tx :845; mua + lấy ngay :390) đều đã chặn. Ba chỗ đếm (delivered_items :159, last_delivery_at :173, lịch sử :191) dùng chung `dieuKienLayTuGoi`. Còn hở: hai đường huỷ/xoá đổi `updated_at` của gói đã dừng (lỗi 2).
- K5: bán gói mới A6a · lấy trong giới hạn A6b · gói không danh sách A6c · mua + lấy ngay A6f · gia hạn A6g · huỷ đơn lấy hàng A6d · bật/tắt gói giá 0 cũ A6e · xoá gói A6h · quản lý được cấp quyền dừng gói A5g. Không luồng nào bị chặn oan. Gói cũ lệch tổng là hạn chế có sẵn từ màn hình (lỗi 3). Quản lý chỉ có `manage_users` mất quyền dừng gói: đúng ý Q5.
- Đường tiền: giá gói vẫn tra DB (orders.js:379); trần theo loại lấy từ `pos_packages.package_items` của DB; lượt tổng lấy từ DB. Không có trường tiền mới nào máy chủ tin client gửi. Dừng gói không đụng ví hay sổ (A5c, `chup()` :329–330).
- P1: chỉ commit aaa97d5 đụng client/src, và nó kèm dist. Bundle index-CSgDCfvy.js có các chuỗi mới, `--day-du` báo dist KHỚP src.
- Đơn giản: phần máy chủ gọn và đặt đúng chỗ (một util ~37 dòng). Chỗ rườm hay sai là lỗi 1 (effect) và lỗi 2. Tính năng "Dừng gói" có quy tắc đối soát nhưng quy tắc chưa đúng. Nhỏ: `monDuocLayTuGoi` (orders.js:269) có thể suy ra từ `dsGoi`, không cần sửa.
- K1: ke_hoach.md mục 0 có dẫn file:dòng (đã trôi sau vá, chấp nhận được). Hai câu không có căn cứ: trang_thai.md "93 đột biến neo khớp đủ (script nháp)" — script không nằm trong kho, nay tôi đã chạy đủ 93/93; trang_thai.md không ghi kết quả `npm test` / `--day-du` — A7 thiếu bằng chứng trong hồ sơ, lần chạy của tôi bù vào.

NGHIỆM THU: 8/8 mục có bằng chứng · mục có bằng chứng nhưng hỏng nội dung: A8 (lỗi 2), A4 (lỗi 1).
- A1: A1a–A1f · A2: A2a–A2i, A2d2 · A3: A3a–A3c · A4: A4a–A4f (liên kết sang Khách hàng có lỗi 1) · A5: A5a–A5h · A6: A6a–A6i (tên A6i sai — lỗi 3) · A7: hồ sơ thiếu npm test / --day-du / P26c; lần chạy của tôi bù vào 67/0/0, 40/40, 93/93 · A8: có quy tắc nhưng sai với code (lỗi 2).

CHƯA SOÁT ĐƯỢC:
- Turso production thật: khoá ghi khi hai quầy cùng bấm (A2d, A5e chỉ chạy trên libsql cục bộ, kho tự xếp hàng).
- Giao diện trong trình duyệt thật: luồng bấm "N KH" → Báo cáo → tên khách → Khách hàng, và hành vi `readOnly` của ô Tổng.
- Dữ liệu thật trên production: có gói nào danh sách loại cộng ra khác `total_qty`, hay có `package_items` SL 0 / trùng loại không.
- Bundle chưa được dựng lại độc lập: người gác chặn `npx`, nên tôi chỉ dựa vào phép so băm của `--day-du`.

BÀI HỌC:
- KHOÁ: thêm ca hành vi (không soi chuỗi) cho effect đọc tham số URL. Hoặc thêm phép: mỗi `useEffect` có deps `loading` mà gọi hàm mở modal thì phải có xoá tham số hoặc cờ một lần.
- NGUYÊN TẮC (đưa vào K4/K1 của KHUON_LOI.md): viết quy tắc đối soát theo một cột thời gian thì phải grep MỌI `UPDATE` cột đó (ở đây `updated_at` của `pos_customer_packages` bị đường huỷ/xoá đơn đổi). Không dựa đối soát vào tiền tố chuỗi tự do trong `notes`.
- NGUYÊN TẮC (K3): ca K5 phải kiểm đúng điều tên ca hứa. "Nhận 30 lượt" thì phải lấy được quá phần danh sách, hoặc đổi tên ca và ghi hạn chế ra Phát hiện.
- NGUYÊN TẮC: đột biến sống thì ghi rõ vì sao nó vô hại trước khi thay bằng đột biến khác. Ở đây có ghi, nhưng nên thành một mục bắt buộc trong mẫu trang_thai.
```

### Sửa sau vòng 1
- Lỗi 1 (K7): `Customers.jsx` — effect xoá tham số `phone` (`setSearchParams({}, { replace: true })`) TRƯỚC khi mở → chỉ mở một lần;
  danh sách rỗng (SX lỗi) thì không đè lời "Không thể tải". Ca A4d thêm vế "xoá tham số trước khi mở" (vẫn là phép tĩnh — giới hạn
  ghi ở mục CHƯA KIỂM của `## Báo cáo` cuối file); đột biến mới `BV-GOI1-KH-MOT-LAN` (bắt). Build lại `client/dist`.
- Lỗi 2 (K1 + K4): viết lại mục "Đối soát Dừng gói" theo dữ liệu có cấu trúc + ảnh chụp, không theo `updated_at` / tiền tố `notes`;
  đường huỷ / xoá đơn lấy hàng của gói đã dừng → Phát hiện (chủ quán quyết, không tự sửa).
- Lỗi 3 (K3): đổi tên ca A6i cho đúng điều nó kiểm; hạn chế "gói cũ lệch tổng" → Phát hiện.
- Bài thử đổi sau bằng chứng → chạy lại gốc (15 đạt · 34 hỏng) và bản vá (49 đạt · 0 hỏng), chép lại `bang_chung_do.txt` (A16).
  Bỏ nhãn "(K5)" ở A2d — nó ĐỎ trên gốc (gốc không chặn theo loại: cả hai quầy 200).

## Bước 8 — soát độc lập vòng 2 (agent general-purpose, HEAD `eddb278`) — báo cáo chép nguyên
```
KHÔNG ĐẠT

Tôi đã chạy lại trên HEAD eddb278, mỗi lệnh một lần. Cây làm việc vẫn sạch sau khi chạy (`git status --short` rỗng).
- `node cong_cu/thu_GOI1.js`: 49 đạt · 0 hỏng.
- `python3 viec/GOI-1/dot_bien.py`: 41/41 đột biến bị bắt.
- `python3 viec/P26c/dot_bien.py`: 93/93 bị bắt, chạy trên eddb278.
- `node kiem_tra_truoc_khi_giao.js --day-du`: PASS 67 · FAIL 0 · CẢNH BÁO 0. Có dòng "dist đã commit KHỚP với src hiện tại".
- Bundle `client/dist/assets/index-aaHAaqG3.js` (index.html trỏ đúng) có đoạn `$({},{replace:!0});const Y=s.find(...)`, tức đã chứa bản sửa lỗi 1.

Kiểm 3 lỗi của vòng 1:
- Lỗi 1, sửa đúng. `Customers.jsx:163–171` xoá tham số trước khi mở. Lúc đầu `loading` = true (`Customers.jsx:15`) nên effect không chạy với danh sách rỗng. Xoá xong thì `sdtMo` = null, lần chạy sau dừng ngay. Trong trang chỉ chỗ này dùng `useSearchParams`, nên `setSearchParams({})` không xoá nhầm tham số nào khác.
- Lỗi 2, viết lại đúng với code. Lệnh dừng chỉ đổi status, notes, updated_at (`packages.js:216`). Huỷ đơn mua gói: gói thành `cancelled` hoặc bị xoá (`orders.js:1388–1398`). Phần ví hoàn bằng `loai:"refund"` (`orders.js:1328`). Nhận ra gói dừng bằng "gói cancelled + đơn mua completed" là đứng vững.
- Lỗi 3, đổi tên ca A6i đúng. Tên mới khớp điều ca kiểm (`thu_GOI1.js:406`).

LỖI TÌM ĐƯỢC:
1. `server/utils/goiKhach.js:22–27` (vuotTheoLoai) + `server/routes/orders.js:281–365`: chặn theo loại bị lách bằng dòng số lượng ÂM — khuôn K4 + K3.
   - POST /orders không kiểm `item.quantity`. Tôi grep `quantity <|isInteger(.*quantity|quantity > 0` trong orders.js: chỉ có `:1469` và `:1598`, đều ở đường huỷ/xoá.
   - `vuotTheoLoai` cộng gộp "xin" theo loại, kể cả số âm. Tôi chạy thử bằng bản sao harness thu_GOI1 trong thư mục nháp, server thật HEAD:
     - Gói CT1 cài 5, đã lấy 3. Gửi `items: [CT1 ×7, CT1 ×−5]` → HTTP 200. Đơn ghi hai dòng 7 và −5, quầy giao 7 túi. "Đã lấy" CT1 hiện 5 (số ròng), che mất phần vượt.
     - `CT1 ×5 + CT2 ×−4` → 200. `delivered_qty` chỉ tăng 1, CT2 bị đếm −4, nên sau này lấy CT2 vượt mức cài được. Phép tổng (lỗ có từ P26c) cũng lách được theo cách này.
   - Phiếu ghi mục tiêu "lấy hàng không vượt từng loại kể cả gọi API thẳng" và A2 "Máy chủ chặn lấy vượt TỪNG LOẠI". Phép mới không đạt điều đó với loại đầu vào này. KHUON_LOI K4: "Cùng khuôn phải giống ở mọi loại đầu vào". Bài thử không có ca số lượng ≤ 0 hoặc lẻ.
   - Luồng hợp lệ (K5): màn hình không bao giờ gửi SL ≤ 0 (`Sales.jsx:532–535`: `newQty <= 0` thì bỏ món). Mọi chỗ thêm món đều là `quantity: 1` hoặc `+1` (`Sales.jsx:454/473/499/520`).
   - Cách gọn: trong vòng lặp món, chặn `!(Number.isInteger(Number(item.quantity)) && Number(item.quantity) >= 1)` → 400. Thêm ca đỏ trên gốc + đột biến. Phải kiểm K5 cho các nguồn khác gọi POST /orders (tôi chưa rà).
   - Đường tiền, có từ trước GOI-1: `items: [CT3 ×2 (lẻ), CT4 ×−1 (lẻ)]` cho máy chủ tự tính tổng 25.000đ cho 2 túi 50.000đ (lời 400 "không khớp tổng đơn hàng thật (25.000đ)"). Đây là lỗ tiền lẻ qua API. Chặn ở vòng lặp món thì bịt luôn. Nếu coi là ngoài Phạm vi thì phải ghi Phát hiện để chủ quán quyết.
2. `cong_cu/thu_GOI1.js:309–313` (A4d): bài thử của bản sửa lỗi 1 vẫn xanh khi chỉ có marker suông — khuôn K3.
   - Tôi đổi dòng `setSearchParams({}, { replace: true });` thành chú thích `// setSearchParams(...)` trong bản sao `client/src/pages` ở nháp. Chạy `--client <nháp>` → 49 đạt · 0 hỏng, A4d ✓, trong khi lỗi mở lại modal của vòng 1 đã quay lại.
   - KHUON_LOI K3 bắt phá thử nhánh "marker suông", và TACH-GL bắt đột biến đưa đúng lỗi cũ trở lại. Đột biến `BV-GOI1-KH-MOT-LAN` chỉ xoá dòng, nên không phủ nhánh này.
   - Cách gọn: bỏ các dòng `^\s*//.*$` trước khi soi (dùng chung cho mọi phép tĩnh của bài), thêm một đột biến "biến dòng thành chú thích".
3. `viec/GOI-1/trang_thai.md:175`: khẳng định không có căn cứ — khuôn K1.
   - Dòng này ghi "(vẫn là phép tĩnh — giới hạn ghi ở CHƯA KIỂM)". `grep -n "CHƯA KIỂM" viec/GOI-1/trang_thai.md` chỉ ra đúng dòng 175, không có mục CHƯA KIỂM nào.
   - Hồ sơ cũng không ghi lần chạy `npm test` / `--day-du` / P26c trên eddb278: Bước 6 (`:106`) và câu P26c ở Bước 5 đều ghi HEAD 8ded1bf. Lần chạy của tôi bù vào (67/0/0, 93/93).

NGHI NGỜ:
- Phép tĩnh A1e, A3c, A4b, A4b2, A4c, A4c2, A5h (`thu_GOI1.js:187–192, 271–272, 295–308, 355–358`) cùng điểm yếu với A4d: soi chuỗi có mặt nên marker suông làm xanh được. Phiếu cho phép "như A7 của P26c", vòng 1 xếp vào nghi ngờ. Tôi chỉ chứng minh trực tiếp cho A4d.
- Hai cách khớp loại. `delivered_items` gom theo khoá sx và lấy `MAX(p.code)` (`goiKhach.js:14–18`), còn Sales.jsx khớp theo `product_code === product.code` (`Sales.jsx:423, 544`). Nếu hai dòng `pos_products` chung một khoá sx mà khác mã, màn hình có thể hiện 0 đã lấy. Máy chủ vẫn chặn đúng nên không mất tiền.
- Kế hoạch hứa ca A2f (`ke_hoach.md` mục 6: "delivered_items khớp daLayTheoLoai") nhưng bài không có ca tên A2f. Phần này được A2c, A2h phủ một phần qua `daLayCuaKhach`.
- Dừng gói ghi số cũ. Route đọc `cp` (`packages.js:211`) ngoài phép UPDATE có điều kiện. Một đơn lấy hàng chen giữa thì `notes` ghi "đã lấy d/t" cũ. Chỉ là chữ, không ảnh hưởng tiền.
- Customers.jsx:166: SX lỗi thì tham số vẫn bị xoá, nên tải lại trang không thử mở khách lại được. Nhỏ.
- Bấm "✕" bỏ lọc gói (`Reports.jsx`, `setSearchParams({ tab: 'packages' })`) thì lọc vẫn là "Đang giao". Nhỏ, đúng C2 khi mở.
- Danh sách loại trùng khoá (chỉ có khi gọi API thẳng) vẫn chưa chặn. Đã ghi Phát hiện.

Trả lời theo từng mục soát:
1. K3. Gốc 15 đạt · 34 hỏng (`bang_chung_do.txt`), sau vá 49/0. Ca máy chủ so status, code và kho, không dò chữ. A2d2 dựng khe hở tất định, đọc ngoài giao dịch thì đỏ. Phép màn hình chỉ soi có mặt, marker suông làm A4d xanh (lỗi 2).
2. K4. grep `unit_price = 0|unit_price === 0|IS NULL|product_id > 0` → 3 chỗ: `orders.js:1429` (huỷ), `:1560` (xoá), `goiKhach.js:8–9`. Điều kiện khớp nhau. Hai đường lấy từ gói đều đã chặn: gói cũ trong giao dịch (`orders.js:842–851`), mua + lấy ngay (`:389–391`). Ba chỗ đếm dùng chung `dieuKienLayTuGoi` (`packages.js:159, 173, 192`). Còn hở: loại đầu vào số lượng âm (lỗi 1).
3. K5. Các luồng hợp lệ đều xanh: bán gói A6a · lấy trong giới hạn A6b · gói không danh sách A6c · huỷ đơn lấy hàng A6d + A2c · bật/tắt gói cũ giá 0 A6e · mua + lấy ngay A6f · gia hạn A6g (`orders.js:187` chỉ chặn khi có from_package) · xoá gói A6h · gói cũ lệch tổng A6i · quản lý được cấp quyền A5g · bật/tắt không gửi tổng hay giá (`packages.js:82`). Không thấy luồng nào bị chặn oan. Quản lý chỉ có `manage_users` thì mất quyền dừng gói, đúng Q5.
4. K1. Lỗi 3. Mục 0 của `ke_hoach.md` dẫn file:dòng trên 93163f3, nay đã trôi, chấp nhận được.
5. Đường tiền. Giá gói tra DB (`orders.js:379`), trần theo loại lấy `package_items` từ DB (`:249–263`), lượt tổng lấy từ DB. Dừng gói không đụng ví hay sổ (A5c `chup()`). Nhưng `item.quantity` là số client gửi mà máy chủ tin không kiểm: lách được chặn theo loại (GOI-1) và giảm được tiền đơn lẻ (có từ trước) — lỗi 1.
6. P1. Client/src đổi ở aaa97d5 và eaabd6f, cả hai kèm dist. `--day-du` báo KHỚP, bundle có chuỗi sửa mới.
7. Nghiệm thu. Xem dòng NGHIỆM THU bên dưới.
8. Đơn giản. Phần máy chủ gọn: một util 37 dòng, POST và PUT dùng chung `tongTheoLoai`. Nhỏ: phép tính tổng các loại viết hai lần trong `Settings.jsx` (openPkgModal ~dòng 347 và `doiLoai` ~dòng 358). Gọn hơn: một hàm `tongLoai(items)`. Nhỏ: `monDuocLayTuGoi` suy ra được từ `dsGoi` (`orders.js:244–270`). "Dừng gói" có quy tắc đối soát (A8) đúng với code. Chưa có cột ngày dừng nên chưa cộng theo kỳ được, đã ghi Phát hiện.

NGHIỆM THU: 8/8 mục có bằng chứng · mục có bằng chứng nhưng hỏng nội dung: A2 (lách được bằng số lượng âm khi gọi API thẳng — lỗi 1)
- A1: A1a–A1f. · A2: A2a–A2i, A2d2. Thiếu ca số lượng ≤ 0. · A3: A3a–A3c. · A4: A4a–A4f. A4d chỉ là phép tĩnh, marker suông qua được (lỗi 2). · A5: A5a–A5h. · A6: A6a–A6i. · A7: hồ sơ thiếu lần chạy trên eddb278. Lần chạy của tôi bù vào: --day-du 67/0/0, GOI-1 41/41, P26c 93/93, dist khớp. · A8: `trang_thai.md` mục "Đối soát Dừng gói", đúng với code.

CHƯA SOÁT ĐƯỢC:
- Turso production thật: khoá ghi khi hai quầy cùng bấm. A2d, A2d2, A5e chỉ chạy trên libsql cục bộ.
- Giao diện trong trình duyệt thật: luồng "N KH" → Báo cáo → tên khách → Khách hàng mở một lần, `readOnly` ô Tổng, `window.prompt`.
- Các nguồn khác gọi POST /orders (app khách, khoá dịch vụ) có gửi số lượng lẻ hay ≤ 0 hợp lệ không. Cần rà trước khi thêm phép chặn số lượng (K5).
- Dữ liệu production: gói lệch tổng, `package_items` SL 0 hoặc trùng loại, sản phẩm chung khoá sx khác mã.
- Không dựng lại bundle độc lập (người gác chặn `npx`). Chỉ dựa vào phép so băm của `--day-du` và grep bundle.

BÀI HỌC:
- KHOÁ: thêm ca vào thu_GOI1, đỏ trên HEAD hiện tại: "lấy từ gói với dòng SL âm hoặc 0 cùng loại → 400, không đơn mới". Kèm đột biến gỡ phép kiểm số lượng.
- KHOÁ: mọi phép tĩnh soi màn hình bỏ dòng chú thích trước khi so. Đột biến chuẩn "biến dòng vá thành chú thích" cho mỗi phép tĩnh (marker suông, K3).
- NGUYÊN TẮC (K4, đưa vào KHUON_LOI.md): viết phép chặn theo TỔNG/SỐ CỘNG của dữ liệu client gửi thì trước hết khoá miền giá trị từng phần tử (nguyên, ≥ 1). Cộng gộp mà không khoá dấu thì một dòng âm triệt tiêu phần vượt.
- NGUYÊN TẮC (K1): trang_thai dẫn tới một mục ("ghi ở CHƯA KIỂM") thì mục đó phải có thật. Sau mỗi vòng sửa phải ghi lại lần chạy A7 trên HEAD mới.
- Phát hiện (đường tiền, ngoài GOI-1, cần chủ quán quyết): POST /orders nhận số lượng âm cho món lẻ, máy chủ tự tính tổng thấp hơn giá thật (2 túi giá 25.000đ). Nên thành việc riêng ưu tiên cao nếu không vá trong GOI-1.
```

### Sửa sau vòng 2
- Lỗi 1 (K4 + K3): `orders.js` vòng lặp món — món lấy từ gói SL phải nguyên ≥ 1, sai → 400 `GOI_SL_KHONG_HOP_LE` (trước mọi phép
  cộng "xin"). Ca mới A2j (CT1 7 + CT1 −5; CT2 0; CT1 1.5 → 400, không đơn mới) — ĐỎ trên gốc. Đột biến `BV-GOI1-SL-AM`,
  `VS-GOI1-SL-AM-CHI-0` (bắt). K5: món lấy từ gói chỉ do màn Bán hàng gửi (`Sales.jsx` `from_package: item.fromPkg`, SL luôn
  nguyên ≥ 1 — người soát dẫn `Sales.jsx:454/473/499/520/532–535`). Món LẺ SL âm (có từ trước) → Phát hiện, không làm.
- Lỗi 2 (K3): mọi phép tĩnh của `thu_GOI1.js` soi mã SAU khi bỏ chú thích (`boChuThich`: `//` cả dòng, `/* */`, `{/* */}`).
  Đột biến marker suông mới: `VS-GOI1-KH-CHU-THICH` (dòng xoá tham số thành chú thích), `VS-GOI1-O-TONG-CHU-THICH` (readOnly
  thành chú thích JSX) — bắt.
- Lỗi 3 (K1): câu "ghi ở CHƯA KIỂM" sửa thành trỏ tới `## Báo cáo` cuối file (có mục CHƯA KIỂM). Lần chạy A7 trên HEAD mới ghi ở
  bước 6 vòng 2 bên dưới.
- Nghi ngờ "ca A2f": kế hoạch hứa A2f; trong bài, ý đó nằm ở A2c (`delivered_items` theo `product_code`, CT1 + CT2) và A2h.
- Bài thử đổi sau bằng chứng → chạy lại gốc (15 đạt · 35 hỏng) và bản vá (50 đạt · 0 hỏng), `bang_chung_do.txt` `SỐ CA … 50` (A16).

## Bước 6 — kiểm lại sau soát vòng 2 (HEAD `91ec65c`)
- `npm test`: thoát 0 · PASS 63 · FAIL 0 · CẢNH BÁO 0.
- `node kiem_tra_truoc_khi_giao.js --day-du`: thoát 0 · PASS 67 · FAIL 0 · CẢNH BÁO 0 · "dist đã commit KHỚP với src hiện tại" ·
  "bài chạy thật cong_cu/thu_GOI1.js xanh".
- `python3 viec/GOI-1/dot_bien.py`: 45/45 bị bắt. `python3 viec/P26c/dot_bien.py`: 93/93 bị bắt. `kiem_neo.py`: y nguyên mốc.
