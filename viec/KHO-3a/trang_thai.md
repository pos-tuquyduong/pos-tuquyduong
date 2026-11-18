# KHO-3a — trạng thái

## Bước 1 — đối chiếu bản chụp (18.11)
- Nhánh `viec/KHO-3a`; cây sạch; `git fetch origin viec/KHO-3a` → HEAD = FETCH_HEAD = `7fd9986` (không cần kéo, không có gì để gộp).
- `git log --oneline -3`:
  - 7fd9986 PHIEU: KHO-3a cap nhat du lieu that 18.11 sau khi nhap danh muc SX
  - 22281f8 PHIEU: KHO-3a A3b doi ten 4 mon nuoc ep theo SX (chu quan 18.11 12:56)
  - 6440c81 PHIEU: KHO-3a Pham vi them DonApp.jsx (canh bao B3c)
- Kế hoạch của phiên trước chưa từng được push (không có trong lịch sử origin) → mất cùng máy cũ; `ke_hoach.md` viết lại từ đầu trong phiên này.

## Bước 3 — kế hoạch
- `viec/KHO-3a/ke_hoach.md` — gồm A3b, dữ liệu thật 18.11, trả lời Câu 1 · 3 · 4 của chủ quán (mục 8).
- DỪNG chờ chat soát kế hoạch (phiếu: "Chờ duyệt kế hoạch").
- Soát kế hoạch bằng agent chỉ đọc: 4 lỗi đường song song + ca thiếu → đã sửa vào kế hoạch (mục 8b của `ke_hoach.md`).

## Bước 1 (lượt 2 — sau soát chat 18.11 18:50, chủ quán DUYỆT)
- Hook mở phiên kéo `4cb9feb5 → 7b8b1dbb` (chat ghép main bc16e140 BO-MAN-CU-1). `git log --oneline -3` lúc bắt đầu: 7b8b1dbb · 4cb9feb5 · bc16e140.
- Kế hoạch cập nhật theo soát chat: mục 10 của `ke_hoach.md` (số dòng orders.js sau ghép, K4 mọi chỗ đọc kho_phieu, Câu 2, A3b, dữ liệu 33 nguyên liệu, đo).

## Bước 4 — bài thử đỏ trước
- `cong_cu/thu_KHO3a.js` (MỚI). Trên server GỐC `7b8b1dbb` (bài HIỆN TẠI, `python3 viec/KHO-3a/dot_bien.py --goc 7b8b1dbb`): **30 đạt · 82 hỏng · 112 ca** → ĐỎ.
  Chép nguyên vào `bang_chung_do.txt`. Trên code đã vá (HEAD f8337191): **120 đạt · 0 hỏng · 120 ca**.
- `dot_bien.py`: 31 đột biến (VS-/BV-) — CHƯA CHẠY (chạy sau khi npm test xanh — đối chứng phải xanh).

## Bước 5 — đã sửa (commit 99034a0b · 11853a94 · 8ba65c04 · de713444 · 7bf5c86e)
- `server/kho/banHang.js` (mới, MỘT chỗ cho luật bán theo kho), bước `031_ban_theo_kho.js`, `032_ten_mon_sx.js` (đổi số 18.11 — GIAO-3 đã dùng 030); `duLieu.js` (themPhieu `donHangId`, phiếu bán không
  huỷ / sửa tay — Câu 4, danh sách phiếu ẩn phiếu bán), `duong.js` (`cho_ban_thieu`, `GET /mon-chua-san`).
- `orders.js` (bỏ checkStock / outStockFIFO / inStockReturn; `truKhoDon` trong thân `taoDonGoc`, trong giao dịch; huỷ / xoá `huyPhieuBan`) — KHÔNG thêm lời gọi
  `taoDon(`; `products.js` (menu từ pos_products, POST / PUT món, sync-from-sx 410); `giuCho.js` (kiểm đủ hàng trong giao dịch tạo phiên; ly_do nêu món);
  `thanh-toan.js` (lưới B3c phiên quầy); `donApp.js` (mã kho → HET_HANG / MON_KHONG_BAN kèm ma; câu "Món … vừa hết"); `manKhach.js` (bỏ bộ nhớ 20 s).
- Gỡ SX: xoá `stock.js`, `doi-chieu.js`, `sync.js`, `utils/doSoNo.js`; `index.js` 410 `SX_DA_NGAT`; `so-no.js` luôn 0; `registrations.js` xuất SX 410;
  `damages.js` return_stock 400 `HOAN_KHO_SX_DA_BO`; `backup.js` bỏ hàm SX (không ai gọi); `sxApi.js` chỉ còn hàm ném (bước 020 cần nạp); `ketNoiKho.js` bỏ `diaChiSX`.
- Giao diện: Kho › Sản phẩm (thông tin bán + thêm món + cho bán khi thiếu), tab "Chưa sẵn sàng bán", nhãn phiếu bán, Bán hàng món chưa công thức mờ,
  Đơn App dòng hoàn vì hết hàng tô đỏ. Build `client/dist`.
- `HOP_DONG_API_KH.md` v18 (không đổi trường); `kiem_tra_truoc_khi_giao.js`: K2 đổi sang "ketNoiKho không còn SX", thêm K4 (mẫu SX vắng mặt),
  `chayBaiThat('cong_cu/thu_KHO3a.js')`. Thư App KH: `TRA_LOI_POS_KHO3a.md`.

## Đo trước / sau (chat mục 6)
- Giả lập S4 trên GỐC 7b8b1dbb (chạy riêng, 3 lần): **46,4 · 46,2 · 46,1 s** — 33 kịch bản · 18 bất biến · ĐẠT.
  Trên HEAD (chạy riêng): **54,2 · 54,5 s** (trong `--day-du`: 54,1 · 54,7 s) — **33 kịch bản · 18 bất biến · ĐẠT** (không giảm số KB / bất biến;
  KB24 / KB25 / KB27 viết lại theo kho POS, I7 đổi sang phiếu bán). Chậm hơn ≈ +17,5 % (< 30 %): mỗi đơn thêm phiếu bán + đọc kho.
- "Đã nhận tiền" (taoPhien + chotPhien tiền mặt, 30 lần, kho file cục bộ, SX tắt ở gốc): GỐC trung vị **11 ms · 20 câu CSDL / lần**;
  HEAD trung vị **11–13 ms · 33 câu CSDL / lần**. Thời gian cục bộ không đổi, nhưng **số câu CSDL +65 % (> 30 %)**: trên Turso mỗi câu là một chuyến mạng
  (≈ +13 chuyến / lần thu). Đổi lại bỏ 2 lời gọi mạng sang SX mỗi món (checkStock + outStockFIFO, mỗi lời tới 8 s khi SX chậm). Đề xuất (nếu chủ quán
  muốn): gộp hai lượt đọc kho (lúc tạo phiên và lúc chốt) — việc tối ưu sau, không đổi luật. Chưa đo trên Turso thật (CHƯA KIỂM).
- Chủ quán 18.11 20:50 **CHẤP NHẬN** 20 → 33 câu CSDL / lần thu (Render + Turso cùng Virginia); chat đo lại trên Render sau gộp.

## Câu hỏi
- Câu 5 (Phạm vi thiếu tên file luật) — **chủ quán đồng ý 18.11 20:50**: chat thêm 9 tên file vào `## Phạm vi` (commit PHIEU d1d2f782);
  đổi số bước 030 → 031, 031 → 032 (GIAO-3 đã dùng 030). Không còn câu hỏi mở.

## Bước 5 (lượt 3 — sau Câu 5)
- `cong_cu/gia_lap/monThu.js` (mới): `dungMonThu(db)` — món đang bán chưa có dòng kho → làm sẵn + công thức "NL thử" + một phiếu nhập tự duyệt
  `so_phan` 100000 (đủ cho mọi bài cũ). Đúng Câu 1: mỗi bài cũ CHỈ thêm 1 dòng gọi hàm (46 bài); không cờ / đường nào tắt luật bán theo kho.
- Bài cũ phải sửa thêm theo E3 (hành vi chủ quán duyệt đổi — LUAT §6.8, bài sửa thường): GIAO1 J3, GIOVN1 (C11, A2i, E1), HUY1 G3, KH1 E5,
  KHMUA1 (móc bọc giuCho đặt SAU các móc CSDL), NDAPI1 (bỏ 24 dòng canh SX), MANKHACH1 C2, QUAYUI1 D1, P26b C2a, P3 B3, P26c (B3, C2, D1b, H1),
  KHO1, KHO2a J1, KHSP1. KHÔNG mục `## Bài thử cũ sửa` (mọi bài cũ đổi đều ĐỎ khi chạy bản gốc trên code mới — xem `bang_chung_do.txt` mục 2).
- Giả lập D4: `chay.js` bỏ SX giả + khoá SX, gọi `dungMonThu`; `bat_bien.js` I7 theo phiếu bán (mỗi đơn completed đúng 1 phiếu PS ban_hang
  da_duyet, đơn huỷ phiếu đã huỷ); `kich_ban.js` KB24 / KB25 / KB27 viết mới theo kho POS, KB20 đếm phiếu bán, KB31 `HOAN_KHO_SX_DA_BO`;
  `thu_gia_lap.js` khung I7 + 15 ca I7, M4 = huỷ không trả kho. Giả lập bắt được lỗi thật: xoá đơn `refunded` không trả kho → sửa `orders.js`
  (`status !== 'cancelled'`) + ca B5 refunded trong `thu_KHO3a.js`.

## Bước 6 — kiểm (HEAD 327166c3, chạy riêng — không chạy song song bài khác)
- `node kiem_tra_truoc_khi_giao.js --day-du`: **PASS 128 · FAIL 0 · CẢNH BÁO 1** (cảnh báo cũ `packages.js`, không thuộc việc này).
  Giả lập `chay.js` xanh 54,7 s; `thu_gia_lap.js` xanh 73,4 s; `thu_KHO3a.js` xanh; dist KHỚP src.
- Lần cổng đầu (`cong1.txt`) báo `thu_gia_lap.js` đỏ "data/ không đổi (pos_thu.db …)": do mình chạy giả lập SONG SONG lúc cổng chạy (cùng
  `data/pos_thu.db`). Chạy riêng → xanh (dòng trên). Không đổi code vì việc này.
- `thu_KHO3a.js`: **135 đạt · 0 hỏng · 135 ca**.

## Đột biến (`python3 viec/KHO-3a/dot_bien.py`) — chỗ vá → đột biến
DOT_BIEN_BANG

## Soát độc lập (/ra-soat)
### Vòng 1 (HEAD bfe23ff5) — nguyên văn
```
KHÔNG ĐẠT

Tóm tắt: phần lõi (trừ kho trong giao dịch đơn, giữ hàng theo phiên, trả kho khi huỷ/xoá, gỡ SX) đọc đúng và được khoá tốt. Mình chạy lại thì `thu_KHO3a.js` ra 121 đạt · 0 hỏng, và `dot_bien.py` ra 31/31 BẮT (đối chứng xanh). Nhưng lưới an toàn B3c ở QUẦY còn một lỗi làm quầy hiểu sai tiền, một đường "đã thu tiền" chưa được lưới bọc, và hồ sơ chưa khớp code cuối.

LỖI TÌM ĐƯỢC:
- `client/src/pages/BanHang/ManQr.jsx:33` + `BanHang/tinh.js:281-283` — B3c, phiên QR quầy hỏng vì hết hàng: máy chủ đánh phiên `loi` rồi đã cộng tiền vào ví khách, hoặc ghi "HOÀN TIỀN TAY" (`thanh-toan.js:211-214`). Nhưng màn QR coi `loi` là "nha" nên hiện "Đã huỷ chuyển khoản. Giỏ còn nguyên." Thu ngân tưởng khách chưa trả và có thể thu lần hai. Phiếu B3c đòi cảnh báo đỏ "Đơn … hết <món> — đã hoàn …". `tomPhien` (`giuCho.js:34-38`) không trả `ly_do` nên màn cũng không có gì để nói. ManQr.jsx nằm trong Phạm vi (BanHang/**) mà không được sửa. — K4 (đường song song của lưới) + K1.
- `server/routes/thanh-toan.js:210` — chú thích ghi "+ màn QR quầy báo lỗi của phiên", code không làm điều đó (xem lỗi trên). Ke_hoach 2.6 cũng hứa "màn QR quầy hiện lời đỏ của phiên loi". — K1.
- `server/routes/thanh-toan.js:83-97` + `giuCho.js:189-194` — xác nhận tay phiên `ck_tay`/`payos` TRONG hạn: tiền đã nằm trong tài khoản quán. Phiên này có giữ hàng (`taoPhien` kiểm cho mọi cách trả), mà vẫn có thể hỏng vì kho (lô hết hạn, phiếu phát sinh trừ mất). Khi hỏng, phiên chỉ thành `loi`: không vào ví, không có dòng `chua_khop` / CẦN XEM ở Đối soát. Riêng phiên `payos` thì sau đó webhook tới, rơi vào "phiên đang loi lúc tiền về" (chua_khop, không tự vào ví) — khác với trường hợp webhook tới trước. Phiếu B3c đòi "mọi đường mà tiền đã về / đã thu … xử lý như nhau". Kế hoạch 2.6 chỉ xét tiền mặt / trừ tài khoản. — K4.
- `viec/KHO-3a/bang_chung_do.txt:86` — ghi "SỐ CA … 120", nhưng commit bfe23ff5 đã thêm ca B5 "refunded" nên bài hiện là 121 ca (mình chạy ra 121). Bằng chứng đỏ (dòng 1-84) là của bản bài 112 ca, chưa chạy lại bằng `--goc` sau các lần đổi bài. — K4 (chạy lại bằng chứng → grep số cũ) / cổng A16.
- `viec/KHO-3a/trang_thai.md` — hồ sơ dừng ở commit 58940277, còn ghi: `npm test` đỏ 76/48, Câu 5 đang chờ, `dot_bien` CHƯA CHẠY, giả lập trên HEAD CHƯA ĐO. Thiếu kết quả đột biến, thiếu `cong.js chay`, thiếu báo cáo 7 mục, thiếu 1-3 thao tác thử tay (E4). Các bài cũ sửa theo E3 (GIOVN1, KH1, KHMUA1, KHO1, NDAPI1, P26c, HUY1, GIAO1…) không có dòng `SỐ CA` và không có bằng chứng đỏ trên gốc (LUAT §6.1, §6.8). — K1/K4.
- `cong_cu/thu_KHO3a.js:625` — ca tên "A5 (dist) màn Sản phẩm sửa giá ngay tại chỗ" thật ra chỉ kiểm chữ "đặt giá ở Cài đặt" vắng mặt và chuỗi `mon-chua-san` có mặt; không kiểm màn có gọi `PUT /products/price`. — K3 (tên ca nói một đằng, máy kiểm một nẻo).
- `kiem_tra_truoc_khi_giao.js:819-820` — chú thích của dòng `thu_KHO2b` bị dời, dính vào đuôi dòng `thu_KHO3a`. Không đổi phép kiểm nào, chỉ làm sai tài liệu. — K1 (nhẹ).
- `server/kho/banHang.js:92-93` — chú thích "phần thiếu không lô — chỉ có ở món bật cho_ban_thieu" không đúng hết. Tồn nguyên liệu (dòng 31-32) cộng cả lô HẾT HẠN và dòng không lô, còn bước chia lô (dòng 113) chỉ lấy lô còn hạn. Nên món TẮT vẫn có thể sinh dòng `lo_id NULL` khi nguyên liệu nằm trong lô hết hạn hoặc nhập không lô (giống `ghiKho` của KHO-2a). — K1 (nhẹ).

NGHI NGỜ:
- `banHang.js:141-143` với `:75-83` — hai vị từ lệch nhau (K4 "một vị từ"). Món pha tại chỗ có công thức chỉ gồm một sản phẩm con mà công thức con rỗng: `trienKhai` trả `[]`, menu hiện 0 ("hết"), nhưng `xetDu` cho qua và đơn trừ kho 0. Hiếm gặp, chưa có ca thử.
- `thanh-toan.js:212` — vào ví theo `moi.phone` của phiên QUẦY. `ghiVi` (`wallets.js:92-96`) tự tạo ví nếu SĐT chưa có. Nếu quầy nhập SĐT của người chưa là khách thì tiền vào một ví "mồ côi" (dính luật "không tạo khách ở quầy"). Chưa kiểm được quầy có chặn SĐT lạ hay không.
- `products.js:93-110` — `PUT /:id` không kiểm `TEN_TRUNG` như `POST`, nên đổi tên được thành trùng món đang bán. Cùng một luật nhưng hai chỗ kiểm khác nhau.
- `damages.js:28-31` — bỏ nhãn `return_stock` khỏi `DAMAGE_ACTIONS` (trả ra ở `:86`). Các dòng sự cố CŨ có action `return_stock` có thể hiện mã thô trên màn.
- Hiệu năng: `docKhaNang` chạy ở menu, lúc tạo phiên và lúc chốt; mỗi lần đọc toàn bộ phiên `cho` + bảng công thức. Hồ sơ tự đo: +65 % số câu CSDL mỗi lần thu, chưa đo trên Turso.
- `HOP_DONG_API_KH.md:4` — `NGAY` vẫn để 2026-11-15 dù đã lên v18.
- Kho chưa có quy tắc đối soát "mỗi đơn completed có đúng 1 phiếu bán" trên màn Đối soát; luật này mới chỉ nằm trong bất biến I7 của giả lập (LUAT §5).

NGHIỆM THU: 22/31 mục đủ bằng chứng · 5 mục có một phần · 4 mục thiếu: B3c, D4, E3, E4.
- A1 ✓ · A2 ✓ · A3 ✓ · A3b ✓ · A4 ✓ · A5 có một phần (ca dist yếu, xem K3 ở trên) · A7 ✓
- B1 ✓ · B2 ✓ · B3 ✓ · B3b ✓ (gồm ca đua 3 phiên song song)
- B3c ✗ — phía máy chủ và App có ca thử; cảnh báo ở quầy và đường xác nhận tay chưa có
- B4 ✓ · B5 ✓ (huỷ hai lần cùng lúc, bỏ đi, xoá đơn refunded)
- B6 có một phần — `thu_KHO3a` chưa có ca PIN / tài khoản, màn khách tạo đơn, đơn giao. Bài cũ của các lối này mình chạy lại đều xanh: MANKHACH1 53/0, GIAO1 137/0, P3 101/0, KHMUA1 122/0
- B7 ✓ · B8 ✓
- C1 ✓ (grep: `server/` chỉ còn `callSxApi` ném lỗi ngay, và bước 020) · C2 có một phần (không có ca riêng cho SX "rác" / "treo"; hết đọc biến SX nên ít rủi ro) · C3 có một phần (sao lưu lên Drive CHƯA KIỂM) · C4 ✓ · C5 ✓ · C6 ✓
- D1 có một phần (giống B6) · D2 ✓ · D3 ✓ (mình chạy KHO2a 86/0, KHO2b 78/0)
- D4 ✗ — giả lập trên HEAD chưa có số trong hồ sơ; số kịch bản / bất biến chưa ghi
- E1 ✓ · E2 ✓ (mình chạy: 31 đột biến · BẮT 31 · đối chứng 121/0) nhưng kết quả chưa ghi vào hồ sơ · E3 ✗ (thiếu `SỐ CA` + bằng chứng đỏ) · E4 ✗ (không thấy 3 thao tác thử tay trong hồ sơ)
- P1: `client/src` và `client/dist` đổi cùng commit de713444; sau đó không commit nào sửa `client/src`. `dist/index.html` trỏ `index-Blcvu2PS.js`, có chuỗi màn mới.

CHƯA SOÁT ĐƯỢC:
- `node kiem_tra_truoc_khi_giao.js --day-du` mình chạy nền nhưng chưa ra kết quả trước khi nộp. Cả `npm test` và `cong.js chay` mình chưa xác nhận xanh.
- Giả lập S4 trên HEAD: chưa chạy.
- Turso thật (khoá ghi giữa hai máy, độ trễ): chưa kiểm.
- Sao lưu Drive / Apps Script: chưa kiểm.
- Giao diện trên điện thoại: chưa thử.

BÀI HỌC:
- KHOÁ: mọi trạng thái phiên mà máy chủ coi là "đã có tiền" (`loi` vì lỗi kho) phải có câu riêng ở màn QR. Cần một phép thử bắt `hanhDongPhien('loi')` không được ra câu "Đã huỷ chuyển khoản".
- NGUYÊN TẮC: lưới "tiền đã về mà không giao được hàng" phải liệt kê ĐỦ các lối chốt có tiền thật (webhook, xác nhận tay, chốt muộn), không chỉ webhook.
- KHOÁ: dòng `SỐ CA` trong bang_chung_do phải khớp số ca của bài ở HEAD; đổi bài thì chạy lại `--goc` (cổng A16 nên bắt được việc này).
- NGUYÊN TẮC: số trên menu và phép chặn khi bán phải dùng chung một vị từ "thiếu / không có nguyên liệu" (`tonMenu` và `xetDu` đang lệch).
```
→ Vòng sửa 1: ManQr dùng `cauNhaPhien` + `tomPhien.het_hang`; xác nhận tay hỏng vì kho → `hoanTayHetHang` (vào ví / HOÀN TIỀN TAY); ca A5 dist
kiểm `/products/price`; một vị từ cho "pha tại chỗ con rỗng"; `PUT /products/:id` kiểm TEN_TRUNG; chú thích kiem_tra + banHang; NGAY hợp đồng;
ca PIN / tài khoản.

### Vòng 2 (HEAD 9ec6f770) — nguyên văn
```
KHÔNG ĐẠT

Vòng 2 sửa đúng các lỗi vòng 1 nêu, và mọi bài thử đều xanh. Còn một lỗ tiền: xác nhận tay và tiền về qua cổng tới gần như cùng lúc thì ví khách có thể được cộng hai lần. Vì đụng ví nên chưa thể cho đạt.

Những gì mình đã chạy, trên HEAD 9ec6f770 (commit này chỉ đổi ke_hoach.md):
- `node cong_cu/thu_KHO3a.js`: 131 đạt, 0 hỏng.
- `node kiem_tra_truoc_khi_giao.js --day-du`: PASS 128, FAIL 0, 1 cảnh báo cũ (packages.js:196, không thuộc việc này). Có dòng "dist đã commit KHỚP với src hiện tại", nên P1 đạt cho commit a0f31dc2.
- `python3 viec/KHO-3a/dot_bien.py`: đối chứng xanh, 37 đột biến, BẮT 37, SỐNG 0, LẠC 0.

LỖI TÌM ĐƯỢC:
1. server/routes/thanh-toan.js:16-32 (`hoanTayHetHang`) và :198-202 (`vaoVi`) — chặn cộng ví hai lần mới có MỘT chiều — K4 (đường song song), đụng tiền/ví.
   - Chiều đã chặn: `vaoVi` (tiền về qua cổng) thấy dòng `tay:<phiên>` thì không cộng nữa.
   - Chiều còn hở: `hoanTayHetHang` không xem phiên đã có dòng `vao_vi` của cổng (cùng `ma_payos`) hay chưa. Câu UPDATE phiên còn nhận cả trạng thái `'loi'`, và không kiểm `changes`.
   - Kịch bản: phiên QR có SĐT, hàng đã giữ thì bị mất. Quản lý bấm xác nhận tay đúng lúc webhook tới.
     - Hai giao dịch `taoDon` đều thấy phiên `'cho'` và đều hỏng HET_HANG (khoá ghi xếp hàng chúng, nhưng phiên chỉ chuyển `'loi'` SAU rollback, ở giuCho.js:194-197).
     - Nếu `vaoVi` của webhook ghi xong trước, `hoanTayHetHang` vẫn ghi dòng `tay:` mới và gọi `ghiVi` lần nữa → khách được cộng hai lần.
   - Lưới Đối soát cũng không bắt: utils/doiSoat.js:293-296 đếm dòng `tay:` như một lần báo payOS (khoá không bắt đầu bằng sepay/tingee), nên số lần ghi = 2 không vượt số lần báo = 2.
   - Ca đỏ TẤT ĐỊNH dựng được, không cần chạy đua: phiên `'cho'` còn hạn đã mất hàng, ghi sẵn một dòng `pos_payos_su_kien` `ket_qua='vao_vi'` cùng `ma_payos` (coi như webhook đã cộng xong), rồi gọi xác nhận tay → hiện ví sẽ +2 lần.
   - Cách sửa gọn: ngay đầu giao dịch của `hoanTayHetHang`, có dòng `vao_vi`/`khop` cùng `ma_payos` thì ghi dòng chua_khop để chủ quán xem, KHÔNG cộng ví. Hoặc gate theo `changes` của câu UPDATE phiên, chỉ nhận `'cho'`/`'huy'`.
   - Đột biến VS-TAY-HOAN-HAI-LAN bị bỏ (dot_bien.py:56) là chiều khác: hai lần xác nhận tay đua nhau, không phải tay đua với webhook.
2. server/routes/thanh-toan.js:185 — chú thích "Phiên QUẦY không vào đây." đã sai. Từ KHO-3a, phiên QUẦY hỏng vì kho đi vào `vaoVi` (dòng 240-242) — K1 (chú thích là khẳng định). Nhẹ.
3. server/routes/products.js:96-108 (PUT /:id) — vị từ "trùng tên món đang bán" chỉ chạy khi có `name`. Gửi riêng `is_active: 1` để hiện lại một món ẩn trùng tên món đang bán thì không bị chặn. Màn SanPham gửi kèm `name` nên không dính; gọi API thẳng thì lọt — K4 (một vị từ phải phủ mọi đường dẫn tới "đang bán"). Nhẹ.

NGHI NGỜ:
- Đối soát, đường xác nhận tay muộn (client/src/components/DoiSoat.jsx:67-80, nằm ngoài Phạm vi; utils/doiSoat.js:308-310):
  - Hỏng vì kho thì màn chỉ báo lỗi "Không đủ hàng…". Không nói đã hoàn vào ví hay phải hoàn tiền tay (`kq.body.hoan` bị bỏ qua).
  - Dòng đỏ cũ "tiền về sau khi QR hết hạn" vẫn đỏ (vì `p_tt` = 'loi' nên `choTay` false, `daTay` false), cạnh dòng `tay:` mới → chủ quán dễ hoàn tay lần hai.
  - Nên ghi Phát hiện cho GIAO-DIEN-2 / DOI-SOAT.
- `hetHangCua` (giuCho.js:36) báo `vao_vi: !!p.phone`. Khi `vaoVi` rơi vào nhánh "cổng kia đã báo" (thanh-toan.js:192-196, chỉ khi cấu hình hai cổng), màn QR quầy vẫn hiện "đã hoàn vào ví khách" dù máy KHÔNG cộng. Phiên tiền mặt / tài khoản hỏng vì kho cũng mang `het_hang.vao_vi=true` qua GET /phien (ManQr không dùng nên chưa lộ).
- Cấu hình SePay/Tingee: `congKiaDaBao` coi dòng `tay:` là "cổng kia" (`congCuaKhoa('tay:…')` = 'payos', congQr.js:20). Webhook sau khi đã hoàn tay sẽ ghi lý do "có thể hai cổng" thay vì "đã hoàn khi xác nhận tay". Không cộng thừa, chỉ sai lời. Với phiên ck_tay, dòng `tay:` có `ma_payos` NULL nên Đối soát hiện "payOS mã null".
- banHang.js:21-24 `timMon` so `String(sx_product_id)`, còn taoDonGoc (orders.js:413-416) so bằng SQL có ép kiểu. Item `sx_product_id: "05"` / `"5.0"` qua được taoDonGoc nhưng lọt khỏi `kiemDuHang` lúc tạo phiên (không giữ hàng); lúc chốt `truKhoDon` theo `product_id` nên vẫn đúng. Chú thích "CÙNG vị từ" vì vậy không hoàn toàn đúng. Chỉ client tự dựng mới gây ra.
- Nguyên liệu: `tonNL` (banHang.js:31-32) tính cả lô hết hạn và dòng không lô. Pha tại chỗ vẫn bán bằng tồn nằm trong lô NL đã hết hạn (ghi dòng `lo_id NULL`). Chú thích ở :95 nói là cùng luật `ghiKho` KHO-2a; phiếu chỉ cấm lô hết hạn cho làm sẵn → cần chủ quán xác nhận.
- Xác nhận tay MUỘN hỏng vì phiên KHÁC đang tạm giữ chai cuối giờ hoàn ví và đóng phiên ngay (trước: chốt muộn hỏng không khoá phiên). Đúng B3c, nhưng là đổi hành vi so với giuCho.js:191 — nên ghi vào báo cáo.
- Dư thừa: `timMon` và `SU_CO_BAN` export (banHang.js:162) nhưng không file nào ngoài banHang.js dùng. Biểu thức ca thử thu_KHO3a.js:477 `=== -1 + 1 - 1 + 1 || === 0` (thực chất là `=== 0`) khó đọc.
- Hiếm: `hoanTayHetHang` không kiểm phiên đã `da_thu` (webhook chốt được nếu hàng vừa được trả về đúng khe hở đó) — cùng chỗ sửa với lỗi 1.

NGHIỆM THU (đủ 33 mục — bằng chứng là ca thử / đột biến / code):
- A1 ✓ (products.js:37-64, ca A1, D2); A2 ✓ (tonMenu, ca A2 + VS-MENU-SO-PHAN-LAM-TRON-LEN); A3 ✓ (khoá giữ, unique_id); A3b ✓ (032, BV-032-CHI-TEN-TAM); A4 ✓ (POST/PUT, 403, không có DELETE; lỗi nhẹ 3); A5 ✓ (dist tĩnh + SanPham.jsx; bố cục để thử tay E4); A7 ✓ (monChuaSan, ChuaSan.jsx, BV-MON-CHUA-SAN-HET-LO).
- B1 ✓ (FEFO, ngưỡng ngay trên / ngay dưới, lô hết hạn); B2 ✓ (cả giỏ, lồng, BẬT ghi âm); B3 ✓; B3b ✓ (giuCho.js:116-119, ba phiên đua, App, màn khách, chốt muộn tôn trọng phần giữ); B3c ✓ có lỗ (lỗi 1, nghi ngờ Đối soát); B4 ✓ (phiếu PS `ban_hang`, khoá duy nhất); B5 ✓ (huỷ song song một lần, xoá, refunded, bỏ đi, đơn cũ); B6 ✓ (7 lối + tinh-thu 0 phiếu); B7 ✓; B8 ✓.
- C1 ✓ (grep tĩnh + nhóm K mới); C2 ✓ (0 fetch); C3 ✓; C4 ✓; C5 ✓; C6 ✓.
- D1 ✓; D2 ✓; D3 ✓ (giả lập KB24 qua phiếu xuất pha chế); D4 ✓ (nhóm S xanh, KB24/25/27 viết mới).
- E1 ✓ (131 ca); E2 ✓ (37/37 bắt); E3 ✓ (nhóm K chỉ đổi phép SX + thêm một phép, không nới phép nào khác); E4: thử tay, máy không kiểm.

CHƯA SOÁT ĐƯỢC:
- Chưa chạy đua thật tay ↔ webhook, chỉ suy từ code + một ca tất định có thể dựng (mục 1).
- Chưa thử trên Turso (khoá ghi của libsql từ xa); chưa thử tay giao diện trên điện thoại (E4, bố cục A5).
- Chưa tự chạy `node tu_chay/cong.js chay`; chưa chạy riêng thu_HOPDONG_KH (đã chạy gián tiếp qua bộ kiểm --day-du).
- Chưa đọc từng file trong 46 bài cũ đã thêm dòng `dungMonThu` (chỉ thấy chúng xanh trong --day-du).

BÀI HỌC:
- K4: khoá chống trùng giữa HAI đường cùng ghi tiền phải đặt ở CẢ HAI phía (hoặc một khoá chung). Vá theo chiều người soát kể (tay rồi webhook) dễ bỏ chiều ngược lại (webhook rồi tay).
- Lỗi đua nào cũng nên tìm một ca TẤT ĐỊNH bằng cách ghi sẵn trạng thái "bên kia đã ghi xong", thay vì chịu ghi CHƯA KIỂM.
- Lưới đối soát "số lần ghi ≤ số lần báo" mất tác dụng khi chính dòng ghi tay cũng được đếm là một lần báo.
```
→ Vòng sửa 3 (commit 327166c3 — vòng 2 của /ra-soat sau vòng sửa bảo mật): `hoanTayHetHang` đọc dòng `vao_vi` cùng `ma_payos` TRONG giao dịch →
chua_khop, không cộng (ca tất định ghi sẵn dòng cổng, ĐỎ trên bản trước: ví 18000; đối chứng K5 phiên chưa có dòng cổng vẫn hoàn); chú thích
"Phiên QUẦY không vào đây" sửa; PUT hiện lại món ẩn trùng tên → TEN_TRUNG (ĐỎ trên bản trước: HTTP 200), đối chứng K5 đổi thứ tự món đã trùng
sẵn → 200. 4 đột biến mới, BẮT 4/4 (+ BV-SUA-TEN-TRUNG neo lại, BẮT).

### Vòng 3
VONG3

## Soát bảo mật
### Lần 1 (HEAD trước 8e59d04b) — nguyên văn
```
# Soát bảo mật KHO-3a (diff 7b8b1dbb..HEAD), chỉ đọc

**Kết quả:** 2 lỗ hổng sau lọc, cả hai cùng một chỗ: `hoanTayHetHang` (`server/routes/thanh-toan.js`), lưới hoàn tiền B3c khi xác nhận tay. Cả hai đều là đường tiền làm khách được hoàn (vào ví hoặc nhận hàng) hai lần cho cùng một khoản chuyển.

Lời nhắc bảo tách thành sub-task (bước 1 tìm, bước 2 lọc song song). Mình không có công cụ Agent nên tự làm cả hai bước trong một lượt, rồi tự chấm điểm theo FALSE POSITIVE FILTERING.

---

# Vuln 1: Hoàn tiền hai lần (xác nhận tay + webhook payOS): `server/routes/thanh-toan.js:15-29` (hoanTayHetHang), `:117` (chỗ gọi), `:173` (congKiaDaBao), `server/utils/congQr.js:20` (congCuaKhoa)

* Severity: Medium
* Category: business_logic / double_credit (đường tiền)
* Confidence: 8/10
* Description: Khi xác nhận tay gặp lỗi kho, `hoanTayHetHang` ghi dòng `pos_payos_su_kien` với khoá `tay:<phiên>`, `ma_payos = p.ma_payos`, `ket_qua = 'vao_vi'`, rồi cộng `p.con_lai` vào ví khách. Khoá này chỉ chống trùng với chính đường xác nhận tay, không chống trùng với webhook.
  - Khi tiền thật về sau qua cổng payOS (cổng mặc định, `congQr.js` MAC_DINH = 'payos'), webhook đi vào `xuLyTienVe`.
  - Phiên App ở trạng thái `loi` thì đi nhánh `if (laApp && vaoViDuoc(p) && !muonChot) return vaoVi(p)`.
  - Lá chắn duy nhất là `congKiaDaBao`: nó chỉ tính dòng có `congCuaKhoa(khoa) !== t.nguon`.
  - `congCuaKhoa('tay:12')` trả `'payos'`, vì tiền tố nào không phải sepay hoặc tingee đều bị coi là payOS. Với webhook payOS, dòng `tay:` vì vậy bị coi là "cùng cổng" và không chặn.
  - Dòng vao_vi của webhook mang khoá khác (`<orderCode>:<reference>`), nên `ON CONFLICT` không chặn. Kết quả: ví khách được cộng lần hai.
  - Trước KHO-3a, xác nhận tay luôn tạo đơn. Webhook về sau rơi vào nhánh `PHIEN_DA_CHOT` → `sau.nguon === 'tay'` → chua_khop "KHÔNG hoàn". Đường hoàn tay mới bỏ qua cơ chế đó.
* Exploit Scenario:
  1. Khách đặt đơn App, trả bằng QR payOS.
  2. Hàng giữ cho phiên bị mất trước khi chốt (lô thành phẩm hết hạn trong 10 phút giữ, hoặc phiếu PS / kiểm kê trừ kho).
  3. Webhook về chậm (Render ngủ, payOS gửi lại sau). Khách đưa màn hình chuyển khoản, quản lý bấm "xác nhận tay" lúc phiên còn hạn (với phiên App, route chỉ chặn khi `muon`).
  4. `chotPhien` trả 400 HET_HANG, phiên chuyển `loi`, `hoanTayHetHang` cộng `con_lai` vào ví.
  5. Webhook payOS tới: `vaoVi(p)` cộng thêm `soTien` vào ví. Khách được hoàn gấp đôi số đã trả. Khách cố ý đổi lấy tiền ví cũng làm được nếu canh lúc món sắp hết.
  - Với SePay hoặc Tingee thì `congCuaKhoa('tay:…')='payos' ≠ t.nguon`, nên không cộng hai lần. Lỗ chỉ mở trên cổng mặc định payOS.
* Recommendation: Cho `congKiaDaBao` (hoặc riêng `vaoVi`) coi dòng có tiền tố `tay:` là "đã hoàn / đã xác nhận" bất kể cổng. Ví dụ `congCuaKhoa` trả `'tay'` cho tiền tố `tay`, hoặc thêm điều kiện `khoa LIKE 'tay:%'` → ghi chua_khop "đã hoàn tay trước, KHÔNG cộng". Thêm ca thử: xác nhận tay HET_HANG rồi webhook payOS cùng số tiền → ví chỉ +1 lần. Đột biến: bỏ vế `tay:` thì ca phải đỏ.

# Vuln 2: Hoàn vào ví rồi vẫn xác nhận tay lại được, ra đơn (khách được cả tiền lẫn hàng): `server/routes/thanh-toan.js:110-118` + `server/utils/giuCho.js:193-196`

* Severity: Medium
* Category: business_logic / double_credit (đường tiền)
* Confidence: 7/10
* Description: Với xác nhận tay kiểu muộn (`muon`: phiên quầy `huy`, hoặc `cho` đã hết hạn), `chotPhien` cố ý KHÔNG khoá phiên khi chốt hỏng (giuCho.js:193 `if (!muon && …)`), để "nạp thêm rồi xác nhận lại".
  - KHO-3a thêm `hoanTayHetHang` vào đúng nhánh hỏng này. Khi hỏng vì kho, khách đã được cộng `con_lai` vào ví, nhưng phiên vẫn ở `huy` / `cho` và vẫn chốt lại được.
  - Khoá `tay:<phiên>` chỉ chặn lần HOÀN thứ hai, không chặn lần CHỐT thành công sau đó.
  - Lần xác nhận tay sau, khi kho đã có hàng (nhập lô, sửa công thức), `vaoGiaoDich` đổi phiên sang `da_thu` và tạo đơn chuyển khoản. Nhưng tiền chuyển khoản đó đã được hoàn vào ví.
* Exploit Scenario:
  1. Phiên QR quầy có SĐT khách hết hạn, tiền về muộn.
  2. Quản lý xác nhận tay → HET_HANG → ví khách +X ("đã hoàn").
  3. Quản lý nhập thêm lô rồi bấm xác nhận tay lần nữa, tưởng là sẽ ra đơn → đơn được tạo, khách nhận hàng.
  4. Khách đã trả X một lần nhưng có cả hàng lẫn X trong ví (dùng được để mua tiếp).
* Recommendation: Khi `hoanTayHetHang` hoàn thành công (`vao_vi`, hoặc `hoan_tay` cho khách không ví), đóng phiên trong cùng giao dịch: `UPDATE … SET trang_thai='loi', ly_do='<mã kho>: <món>' WHERE id=? AND trang_thai IN ('cho','huy')` và kiểm `changes`. Hoặc cho `chotPhien` / `vaoGiaoDich` từ chối phiên đã có dòng `tay:<id>` trong `pos_payos_su_kien`. Thêm ca thử: hoàn tay HET_HANG → nhập lô → xác nhận tay lại → phải 409, không có đơn.

---

## Đã soát, KHÔNG báo (bị lọc hoặc không thấy lỗ)

- **`server/kho/banHang.js`**
  - `timMon` và `truKhoDon` dùng `product_id` đã được `taoDonGoc` tra (orders.js:416/421, cùng `is_active = 1`). Món ảo có `product_id` ≤ 0 (gói, thẻ, nạp) bị bỏ qua đúng.
  - Không tin số lượng hay giá từ client; mọi câu SQL đều dùng tham số.
- **`server/routes/orders.js`**
  - Trừ kho nằm trong giao dịch, thiếu hàng thì rollback.
  - `huyPhieuBan` đặt sau cổng trạng thái đơn và khoá bằng `trang_thai = 'da_duyet'`, nên chỉ trả kho một lần. Xoá đơn đã huỷ thì không trả lần hai.
  - `duLieu.huyPhieu` chặn huỷ hoặc sửa tay phiếu bán (409 PHIEU_BAN_HANG).
- **`server/utils/giuCho.js`**
  - Giữ hàng đọc trong giao dịch ghi. Ai cũng tạo phiên giữ hết hàng được, nhưng đó là DoS / giới hạn số lần, thuộc loại trừ.
- **`server/routes/thanh-toan.js`, nhánh `loiKho` trong `xuLyTienVe`**
  - Phiên quầy: chỉ cộng ví khi `soTien === con_lai` (vế lệch tiền đứng trước).
  - Hai báo cùng khoá: `ON CONFLICT` chặn. Hai cổng: báo sau gặp `PHIEN_DA_CHOT` hoặc `congKiaDaBao`.
  - Thứ tự webhook trước, xác nhận tay sau: phiên đã `loi` nên `chotPhien` trả 409, không hoàn tay.
- **`server/utils/donApp.js`:** chỉ đổi cách đặt tên lỗi (`body.ma` là mã món trên menu công khai). Không lộ gì.
- **`server/routes/products.js`**
  - `POST /` và `PUT /:id` có `authenticate` + `checkPermission('manage_settings')`. Câu UPDATE dựng từ danh sách cột cố định (không lấy tên cột từ yêu cầu). Giá kiểm là số nguyên ≥ 0.
  - `PUT /:id` có chặn `^\d+$`, nên không che `/price` và `/thong-tin`.
  - Menu trả `SELECT *` của `pos_products`: bảng không có giá vốn hay bí mật, và nhánh dự phòng cũ cũng trả y như vậy.
- **`server/kho/duong.js`**
  - `cho_ban_thieu` chỉ đổi qua route `CHU_QUAN`, chỉ nhận 0 / 1.
  - `mon-chua-san` là `QUAN_LY`, chỉ đọc.
- **`server/routes/damages.js`:** `return_stock` bị chặn trước mọi lệnh ghi; đường hoàn ví giữ nguyên.
- **`server/index.js`, `registrations.js`, `so-no.js`, `sync.js`, `stock.js`, `doi-chieu.js`, `doSoNo.js`, `sxApi.js`:** chỉ gỡ đường hoặc trả 410. Route 410 trong registrations / so-no có `authenticate`. Không mở thêm cửa nào.
- **Xác nhận tay hỏng vì kho tự hoàn vào ví:** người có quyền `xac_nhan_ck_tay` (owner / manager) "bịa" một khoản hoàn được. Đây là người được tin, phiếu B3c yêu cầu đúng hành vi này, và trước đây họ vốn đã tạo được đơn "đã thu" bằng tay. Lọc, điểm 4.
- **Tên món mới hiển thị ra đâu:** React tự thoát ký tự, các chỗ `innerHTML` để in chỉ lấy DOM React đã vẽ. Không có XSS.

## Chưa kiểm
Mình không chạy thử hai kịch bản trên (lời nhắc cấm chạy lệnh). Kết luận dựa trên đọc code: `thanh-toan.js` dòng 15-29, 110-118, 173-235; `giuCho.js` dòng 156-198; `congQr.js` dòng 7 và 20.
```
→ Vòng sửa bảo mật: `vaoVi` thấy dòng `tay:<phiên>` → chua_khop, không cộng (ca App tay rồi webhook); `hoanTayHetHang` đóng phiên `loi` cùng giao
dịch (ca muộn: hoàn rồi nhập hàng xác nhận lại → 409, không đơn). Đột biến BV-TIEN-VE-SAU-HOAN-TAY, BV-DONG-PHIEN-KHI-HOAN-TAY BẮT.

### Lần 2 (sau 8e59d04b) — nguyên văn
```
# Soát bảo mật KHO-3a, lần 2 (diff `7b8b1dbb..HEAD`, nhánh viec/KHO-3a)

## Kết luận
**Không còn lỗ hổng nào đạt ngưỡng tin cậy ≥ 0.8 sau khi lọc.** Bản sửa ở 8e59d04b đóng được cả hai lỗ của lần 1 khi các bước xảy ra lần lượt. Mình chưa thấy nó mở đường mới để cộng ví hai lần hay tạo đơn từ tiền đã hoàn.

Còn hai trường hợp đua (race) dưới ngưỡng, ghi ở cuối để chủ quán biết. Cả hai cần một lần bấm của nhân viên rơi đúng vào khoảng một lượt hỏi kho, nên không đạt điều kiện "concretely problematic" của bộ lọc.

## Kiểm bản sửa: đi từng kịch bản (đọc trong lượt này)

Các file đã đọc: `server/routes/thanh-toan.js` (toàn file), `server/utils/giuCho.js` (hàm `chotPhien`, dòng 154–199), `server/routes/orders.js` (dòng 1024–1133: thứ tự `vaoGiaoDich` → `sauGhiDon` → `truKhoDon`).

Điều quan trọng: `vaoGiaoDich` là câu ghi ĐẦU TIÊN trong giao dịch đơn, cụ thể là `UPDATE … WHERE trang_thai='cho' …` ở `orders.js:1033`. Vì vậy một yêu cầu đọc phiên lúc còn cũ, rồi chạy sau khi phiên đã thành `'loi'`, sẽ nhận 409 `PHIEN_DA_CHOT`, không phải lỗi kho. Nó không đi tới `hoanTayHetHang`.

1. **Xác nhận tay trước, webhook sau (lỗ 1 của lần 1).**
   - `hoanTayHetHang` ghi dòng `tay:<phiên>` rồi cộng ví, trong cùng một giao dịch.
   - Phiên App: webhook rơi vào `vaoVi`. Hàm này đọc dòng `tay:<id>` ngay trong giao dịch, thấy có thì ghi `chua_khop`, không cộng.
   - Phiên quầy: `chotPhien` trả `PHIEN_DA_CHOT` vì phiên đã là `'loi'`, nên `loiKho` = false và chỉ ghi `chua_khop "phiên đang loi"`.
   - Kết quả: **ĐÚNG**.
2. **Xác nhận tay muộn đã hoàn, rồi nhập hàng và xác nhận lại (lỗ 2 của lần 1).**
   - `hoanTayHetHang` chuyển phiên `cho/huy/loi` sang `'loi'` trong cùng giao dịch với lệnh hoàn tiền.
   - Lần xác nhận tay sau: `muon` = false vì phiên không còn `huy`, cũng không còn `cho` đã hết hạn. `chotPhien` không nhận phiên `'loi'` nên trả `PHIEN_DA_CHOT`, không ra đơn.
   - Kết quả: **ĐÚNG**.
3. **Thứ tự ngược: webhook trước, xác nhận tay sau.**
   - Webhook gặp lỗi kho: `chotPhien` (không muộn) đặt phiên `'loi'`, rồi `vaoVi` hoặc dòng `chua_khop "HOÀN TIỀN TAY"`. Xác nhận tay sau đó: `muon` = false, `PHIEN_DA_CHOT`, không hoàn.
   - Webhook tới sau khi QR hết hạn (phiên quầy): chỉ ghi `chua_khop`, không cộng ví. Xác nhận tay muộn sau đó hoàn đúng một lần.
   - Kết quả: **ĐÚNG**.
4. **Cổng SePay và Tingee.** Cả hai đi qua cùng `xuLyTienVe`, nên cùng nhận lớp kiểm `tay:` trong `vaoVi` và cùng bị chặn bởi trạng thái phiên. Tingee còn kiểm khoá trước khi xử lý. Chữ ký không đổi. Kết quả: **ĐÚNG**.
5. **Phiên App và phiên quầy.**
   - Phiên App muộn đã bị chặn xác nhận tay từ trước (`PHIEN_APP_KHONG_TAO_LAI`).
   - Phiên App chưa muộn: xử lý như mục 1.
   - Phiên quầy có SĐT: webhook vào `vaoVi` chỉ khi phiên đang `'loi'`.
   - Kết quả: **ĐÚNG**.
6. **Hai người cùng bấm.**
   - Khách có SĐT: dòng `tay:<phiên>` ghi bằng `ON CONFLICT DO NOTHING` và có kiểm `changes`, nên người sau nhận `da_hoan` và ví chỉ cộng một lần.
   - Khách không SĐT: chỉ một dòng `chua_khop` (cùng khoá).
   - Người đọc phiên cũ sau khi người kia đã đổi trạng thái: `PHIEN_DA_CHOT`.
   - Kết quả: **ĐÚNG**.

## Phần còn lại của diff: không có lỗ
- **`server/kho/banHang.js`:** mọi câu SQL đều dùng tham số. `truKhoDon` chạy trong giao dịch đơn, thiếu hàng thì rollback cả đơn. Món ngừng bán bị `taoDonGoc` chặn từ trước (`orders.js:411–428`).
- **`huyPhieuBan`:** cổng ghi là `trang_thai='da_duyet'`. Huỷ đơn gọi sau cổng `status='completed'`. Xoá đơn chỉ trả kho khi đơn chưa huỷ. Kho không được trả hai lần.
- **`server/kho/duLieu.js` `huyPhieu`:** chặn huỷ phiếu bán (`PHIEU_BAN_HANG`), nên không có đường thứ hai để trả kho.
- **`server/routes/products.js`:**
  - Tạo và sửa món cần `manage_settings`.
  - Câu `UPDATE` động chỉ lấy tên cột từ các khoá cố định trong `doi`, giá trị dùng tham số.
  - Giá vẫn do máy chủ tự tra theo khoá.
  - `layMenuQuay` trả mọi cột của `pos_products`, nhưng bảng này không có giá vốn, và `/api/kh/menu` lọc qua `monKhach`.
- **`server/kho/duong.js`:**
  - `/mon-chua-san` chỉ quản lý được xem (`QUAN_LY`), router có `authenticate` cho mọi đường.
  - `cho_ban_thieu` chỉ chủ quán sửa (`CHU_QUAN`) và chỉ nhận 0 hoặc 1.
- **`server/index.js`, `sync`, `stock`, `doi-chieu`, `so-no`, `registrations`, `backup`:** các đường cũ bị gỡ hoặc trả 410, không mở đường mới.
- **`server/routes/damages.js`:** `return_stock` bị chặn trước khi ghi gì.
- **`server/utils/giuCho.js` `kiemDuHang`:** đọc tồn ngay trong giao dịch ghi phiên.
- **`client/src`:** không có `dangerouslySetInnerHTML`, cũng không thêm `fetch` trần.

## Ghi chú dưới ngưỡng (đua, tin cậy khoảng 0.5, không xếp là lỗ)
- **Hai khoá không đối xứng.** `vaoVi` có kiểm dòng `tay:<phiên>`, nhưng `hoanTayHetHang` (`thanh-toan.js:16–33`) không kiểm xem cổng đã ghi dòng `vao_vi` cho phiên chưa. Nó cũng không kiểm `changes` của câu `UPDATE … SET trang_thai='loi'`.
  - Cách cộng hai lần: xác nhận tay và webhook đến gần như cùng lúc trên một phiên đang `'cho'`, và cả hai đều gặp lỗi kho. Webhook chạy `vaoGiaoDich` lọt vào khoảng giữa lúc giao dịch của bên tay rollback và lúc `chotPhien` của bên tay đặt `'loi'`. Sau đó `vaoVi` của webhook ghi xong trước khi `hoanTayHetHang` chạy. Ví bị cộng thêm `con_lai` một lần nữa.
  - Biến thể: nhân viên bấm huỷ phiên đúng vào khoảng đó. Phiên thành `'huy'`, webhook cộng ví, rồi xác nhận tay muộn hoàn tiếp hoặc tạo đơn.
  - Vì sao dưới ngưỡng: điều kiện kích hoạt hiếm. Phiên `'cho'` còn hạn đã giữ hàng, nên lỗi kho lúc chốt chỉ xảy ra khi lô hết hạn hoặc kho bị chỉnh tay. Khách cũng không điều khiển được thời điểm webhook. Commit 433b169d đã tự ghi CHƯA KIỂM cho đua này.
  - Cách bịt rẻ nếu muốn: trong `hoanTayHetHang`, kiểm `changes` của câu `UPDATE` (phiên phải đổi được sang `'loi'` từ trạng thái mong đợi). Thêm một câu đọc đầu giao dịch: đã có dòng `vao_vi` cùng `ma_payos` thì ghi `chua_khop`, không cộng. Như vậy hai đầu dùng cùng một vị từ.
- **`hoanTayHetHang` cộng `p.con_lai` vào ví chỉ dựa trên lời xác nhận của quản lý.** Đây là quyền `xac_nhan_ck_tay` theo thiết kế B3c, ngang với quyền tạo đơn không cần tiền về đã có từ trước. Vì là quyền được cấp nên mình không xếp là lỗ. Nhưng tiền vào ví dễ đem đi dùng hơn một đơn hàng, nên đáng để chủ quán biết.
```
→ Ghi chú dưới ngưỡng "hai khoá không đối xứng" đã bịt ở vòng sửa 3 (327166c3, ca tất định + 2 đột biến). Ghi chú "quản lý xác nhận tay cộng ví"
là quyền `xac_nhan_ck_tay` theo thiết kế B3c — ghi Phát hiện để chủ quán biết.

SOÁT BẢO MẬT: ĐẠT

## Phát hiện
1. CLAUDE.md §5.3 ("`checkStock` bọc try/catch chỉ log là chủ ý") hết đúng sau KHO-3a — đề nghị chat sửa câu.
2. Hợp đồng `/api/kh` không có đường POS nhờ App gửi đẩy khi hoàn tiền vì hết hàng — thư `TRA_LOI_POS_KHO3a.md`.
3. `orders.js` vẫn ghi `pos_registrations` cho `is_new_customer` — GIAO-DIEN-2 xét cùng luật "không tạo khách ở quầy".
4. `routes/backup.js` có hàm `getProductsWithSxNames` KHÔNG ai gọi (code chết sẵn) — đã xoá cùng import SX.
5. Bước 020 trên kho MỚI (kho thử) luôn log "⏸ NÂNG CẤP 020 HOÃN — SX không trả lời" mỗi lần khởi động (production đã chạy xong nên không log). Không sửa bước cũ.
6. Bảo đảm "trả kho MỘT lần" có hai lớp trùng nhau (cổng trạng thái đơn + `AND trang_thai = 'da_duyet'` của phiếu) — đột biến gỡ MỘT lớp sẽ SỐNG; không đưa vào dot_bien.
