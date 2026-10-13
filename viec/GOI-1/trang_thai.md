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

## Bước 5 — chỗ vá → đột biến (`viec/GOI-1/dot_bien.py`, 41 đột biến sau soát vòng 1)
| Chỗ vá | Đột biến |
|---|---|
| tổng tự tính — POST (`packages.js`) | BV-GOI1-TONG, VS-GOI1-TONG-GUI |
| tổng tự tính — PUT | BV-GOI1-TONG-PUT |
| SL loại ≥ 1 | BV-GOI1-SL, VS-GOI1-SL-CHI-AM |
| giá > 0 — POST / PUT | BV-GOI1-GIA, VS-GOI1-GIA-AM, BV-GOI1-GIA-PUT |
| chặn theo loại trong giao dịch (`orders.js` + `goiKhach.js`) | BV-GOI1-LOAI, VS-GOI1-LOAI-SO-SAI, VS-GOI1-LOAI-TRUOC-TX |
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
  ghi ở CHƯA KIỂM); đột biến mới `BV-GOI1-KH-MOT-LAN` (bắt). Build lại `client/dist`.
- Lỗi 2 (K1 + K4): viết lại mục "Đối soát Dừng gói" theo dữ liệu có cấu trúc + ảnh chụp, không theo `updated_at` / tiền tố `notes`;
  đường huỷ / xoá đơn lấy hàng của gói đã dừng → Phát hiện (chủ quán quyết, không tự sửa).
- Lỗi 3 (K3): đổi tên ca A6i cho đúng điều nó kiểm; hạn chế "gói cũ lệch tổng" → Phát hiện.
- Bài thử đổi sau bằng chứng → chạy lại gốc (15 đạt · 34 hỏng) và bản vá (49 đạt · 0 hỏng), chép lại `bang_chung_do.txt` (A16).
  Bỏ nhãn "(K5)" ở A2d — nó ĐỎ trên gốc (gốc không chặn theo loại: cả hai quầy 200).
