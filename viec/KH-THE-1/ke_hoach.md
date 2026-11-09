# KH-THE-1 — kế hoạch (CHỜ DUYỆT)

## Tóm tắt lời thường
Quầy đã bán thẻ hạng đúng cách: thẻ là một dòng của đơn, giá do máy chủ tra, dòng sổ thẻ ghi CÙNG lúc với đơn. Đơn App cũng đã đi qua
đúng hàm tạo đơn đó (phiên thanh toán → `taoDon`), và phiên thanh toán đã cho trường mua thẻ đi qua. Nên việc chính chỉ là: cho App gửi
một dòng thẻ, đổi nó thành "mua thẻ" của đơn quầy, rồi để đường cũ làm phần còn lại. Hạng tự lên đúng lúc tiền về (ví: lúc đặt; QR: lúc
Tingee báo) vì dòng sổ thẻ chỉ được ghi trong giao dịch chốt phiên — nơi duy nhất đơn App được tạo.

## Code đã đọc (09.11, HEAD a4d89ae)
- `server/routes/orders.js:210` nhận `membership_buy {tier_id, so_thang}`; `:256` đòi đủ hạng + gói + SĐT; `:277` chặn ghi nợ;
  `:520–548` kiểm hạng (`cach_co` 'ban' → `HANG_CHI_CAP`; `goiBanDuoc` → `GOI_HANG_KHONG_BAN`; hạng đang có cao hơn → `DA_CO_HANG_CAO_HON`),
  giá = giá gói máy chủ, dòng hàng `product_id = −1000000 − tier.id` đẩy SAU các món; `:699–708` giảm hạng đọc hạng ĐANG CÓ lúc tạo đơn và
  bỏ qua dòng thẻ; `:1141–1151` ghi `pos_membership_purchases` (hạn qua `hanSauDong`) TRONG giao dịch tạo đơn; `:1616–1621` huỷ xoá dòng thẻ;
  `:1817` xoá đơn xoá dòng thẻ.
- `server/utils/giuCho.js:23` `TRUONG_DON` đã có `membership_buy`; `chotPhien` (`:117–160`) gọi `taoDon` với cổng `cho → da_thu` một câu
  ghi (`changes !== 1` → thôi) — báo tiền hai lần chỉ tạo MỘT đơn.
- `server/utils/donApp.js`: `docGio` (`:93`) chỉ nhận món `{ma, so_luong, ghi_chu}`; `bamGio` (`:58`); `dungItems` (`:113`); `baoGia` ghép
  `gio.mon[i]` ↔ `ct.items[i]` theo vị trí (`:160`); `chuanLoi` + `GIU_MA` (`:48`) đổi mã lạ thành `DON_KHONG_HOP_LE`; `datDon` (`:205`)
  chuyển `items` + `discount_code` vào `taoPhien`; `dsQuay` (`:378`) đọc `than.dong`.
- `server/routes/thanh-toan.js:85–91`: phiên App hết hạn / đã huỷ KHÔNG xác nhận tay được (`PHIEN_APP_KHONG_TAO_LAI`, chủ quán Q1a 05.11) —
  tiền về muộn tự vào ví khách.
- `server/routes/refunds.js:30,163`: đơn có dòng thẻ không duyệt hoàn được (`DON_CO_GOI`) — quầy và App như nhau.
- `client/src/utils/inPhieu.js:96` tem / phiếu pha bỏ dòng `product_id < 0` (gói, thẻ) — tem đã đúng, không sửa.
- `server/utils/doiSoat.js` tiền theo cột tiền của đơn, không phân kênh; `cong_cu/gia_lap/bat_bien.js:325` I15 (đơn có dòng thẻ ↔ đúng một
  dòng sổ) không phân kênh.
- `server/routes/kh/index.js:92–99` `GET /hang`; `server/routes/tiers.js:47–76` `kiemHang`, `:80–127` PUT có PIN chủ quán.
- `server/utils/dongHoaDon.js` dẹt tờ hoá đơn quầy; `client/src/utils/hoaDon.js:234` `to.mon` map 1–1 với `hd.mon` (giữ thứ tự).

## Phần A — một hàm bán thẻ
- **A1 (phiếu ghi "vd banThe.js")**: dời khối `orders.js:520–548` + `:1141–1151` sang `server/utils/banThe.js` (`kiemBanThe`, `ghiSoThe`),
  orders.js gọi lại. 2 file, ~+60 / −45 dòng. Rủi ro: đụng đường tiền quầy đang chạy đúng (CLAUDE.md §8 "đừng phá"), bài cũ có thể đỏ vì
  đổi orders.js (phiếu: đỏ thì DỪNG hỏi). donApp vẫn KHÔNG gọi trực tiếp hai hàm này (nó đi qua `taoDon`) — tách chỉ là dời chỗ.
- **A2 (đề xuất)**: KHÔNG tách. Hàm bán thẻ DUY NHẤT là khối có sẵn trong `taoDon`; App đổi dòng thẻ thành `membership_buy` rồi đi đúng
  `taoDon` (báo giá chỉ tính → tạo phiên → chốt phiên). 0 dòng ở orders.js, hành vi quầy y nguyên tuyệt đối, đúng LUAT §5 "đơn App đi đúng
  đường tạo đơn của quầy (cùng hàm, cùng kiểm)". → **Q1**.

## Phần B — hợp đồng v13, dòng thẻ trong giỏ (donApp.js, loi.js, HOP_DONG_API_KH.md)
- `docGio`: dòng `{ loai: 'the', hang_id, so_thang, so_luong? }` — `hang_id`, `so_thang` số nguyên ≥ 1; `so_luong` thiếu hoặc 1 (khác →
  `YEU_CAU_KHONG_HOP_LE`); không `ma` / `ghi_chu`. Dòng có `loai` khác `'the'` → `YEU_CAU_KHONG_HOP_LE`. > 1 dòng thẻ → `NHIEU_THE` 400.
  Giỏ chỉ có thẻ được (mon[] một dòng thẻ). Trả `{ mon, the, maGiam }`.
- `bamGio`: dòng thẻ băm `['the', hang_id, so_thang, so_luong]`; dòng món GIỮ NGUYÊN `[ma, so_luong, ghi_chu]` → giỏ cũ băm y như trước
  (khoá gửi đang sống trên production không lệch). Khác hạng / gói → khác băm (lưới 10 giây, khoá gửi không trả nhầm đơn).
- `chiTinh` / `datDon`: thân gửi `taoDon` / `taoPhien` thêm `membership_buy: { tier_id: hang_id, so_thang }` khi có thẻ. SĐT luôn từ token.
- `baoGia`: kết quả "chỉ tính" (`orders.js:894–895`) chỉ có `product_id, quantity, unit_price, tier_unit_price, flash_unit_price` — KHÔNG có
  `is_membership_item` / tên (soát kế hoạch bắt). Ghép theo DẢI `product_id`: dòng thẻ = `−2000000 < product_id ≤ −1000000` (cùng dải I15 /
  viKhach.js), dòng món = các dòng còn lại theo thứ tự. MỘT hàm `ghepDong(gio, ct)` trả mảng theo thứ tự App gửi, mỗi phần tử mang
  `{ mon | the, item }` — `bao.dong`, `than` (tên, ghi chú), `chuanLoi` (mã món) cùng đọc mảng này, không còn chỉ số `i` dùng song song
  (`d.ten[i]`, `gio.mon[i]` ở `donApp.js:132,229` lệch khi thẻ nằm giữa giỏ). `dungItems` chỉ nhận dòng món. `bao.dong` giữ thứ tự
  App gửi; dòng thẻ = `{ loai: 'the', hang_id, so_thang, ma: null, so_luong: 1, don_gia, thanh_tien }` (dòng món KHÔNG thêm trường — bài cũ
  khoá danh sách trường giữ xanh).
- `than` lưu dòng thẻ kèm `ten` = "Thẻ <tên hạng> · <n> tháng" — tên hạng đọc `pos_membership_tiers` (một câu, sau khi báo giá đã qua, tức
  hạng có thật và đang bán).
- `GIU_MA` thêm `HANG_CHI_CAP`, `GOI_HANG_KHONG_BAN`, `DA_CO_HANG_CAO_HON` (lời báo của quầy giữ nguyên). `GIA_DA_DOI` dùng như đơn hiện nay
  (tong_da_xem). Hạng không có / đã tắt → taoDon trả 400 không mã → `DON_KHONG_HOP_LE` (mã sẵn có). `loi.js` thêm `NHIEU_THE`.
- `LY_DO_NGAN` thêm `[/DA_CO_HANG_CAO_HON|HANG_CHI_CAP|GOI_HANG_KHONG_BAN|Hạng thành viên/, 'vì thẻ hạng không còn mua được']` — đặt ĐẦU
  danh sách: phiên `loi` lưu `ly_do = code || error` (`giuCho.js:155`); hạng bị xoá giữa chừng trả lời không mã "Hạng thành viên không tồn tại…"
  (`orders.js:522`) — nếu đứng sau thì khớp `không tồn tại` của dòng hết hàng → khách đọc nhầm "vì món đã hết hàng" (soát kế hoạch bắt). Ca D8.
- Hợp đồng: PHIEN_BAN 13, dòng bảng `/gio/bao-gia`, `/don`, `/don/:ma`, `/hang`; "Ghi chú v13"; mã lỗi; phần máy đọc (`phien_ban`, `tra` của
  `/hang` thêm `data[].quyen_loi`, `ma_loi` thêm 4 mã); nhật ký.
- Phương án khác đã bỏ: cửa riêng `POST /the/mua` — trái phiếu (chung giỏ, trả một lần) và nhân đôi đường tiền.

## Phần C — giá đồ uống theo hạng ĐANG CÓ
Không sửa code: `orders.js:699` đọc hạng trước khi ghi dòng sổ (`:1141`), ở cả báo giá, tạo phiên và chốt. Chỉ bài thử khoá.

## Phần D — cấp hạng ngay lúc "đã thu"
Không sửa code: dòng sổ thẻ ghi trong giao dịch `chotPhien` → `taoDon` (ví: lúc đặt; QR / vi_qr: lúc Tingee báo đủ; xác nhận tay khi phiên
CÒN hạn). Tiền về sau khi phiên App hết hạn → vào ví khách, KHÔNG có hạng (luật Q1a 05.11 đang chạy) → **Q2**.
Đường hỏng: giữa lúc đặt và lúc tiền về khách được cấp hạng cao hơn (hoặc gói bị tắt) → `taoDon` từ chối → phiên `loi` → tiền về vào ví,
`thong_bao_tien_ve` "Không tạo được đơn vì thẻ hạng không còn mua được — đã cộng … vào tài khoản". Không đơn nào lơ lửng.

## Phần E — huỷ / hoàn / xoá
Không sửa code: đơn App là đơn quầy thường → huỷ (`orders.js:1616`) / xoá (`:1817`) xoá đúng dòng sổ; hoàn bị chặn `DON_CO_GOI` như quầy.
App chỉ huỷ được đơn CHƯA trả (`huyDon` → phiên `huy`, chưa có dòng sổ). Bài thử khoá cả ba.

## Phần F — quyền lợi hạng
- `server/nang_cap/023_quyen_loi_hang.js`: `themCot('pos_membership_tiers', "quyen_loi TEXT NOT NULL DEFAULT ''")` (themCot tự chép bảng sao
  lưu `_sao_luu_023_…` khi có dòng). Bảng chưa có → bỏ qua (khuôn 013). ~12 dòng.
- `tiers.js` `kiemHang`: `quyen_loi` = chuỗi nhiều dòng; cắt khoảng trắng, bỏ dòng rỗng; tối đa `QUYEN_LOI_TOI_DA_DONG` dòng, mỗi dòng
  ≤ `QUYEN_LOI_TOI_DA_KY_TU` (hằng có tên — đề xuất 10 dòng × 120 ký tự) → sai thì `HANG_KHONG_HOP_LE`. Không gửi trường → GIỮ giá trị cũ
  (`COALESCE(?, quyen_loi)`; máy quầy cũ đang mở không xoá mất chữ). PIN chủ quán như mọi lần sửa hạng. ~12 dòng.
- `GET /hang` thêm `quyen_loi: string[]` (tách dòng; rỗng → []). `GET /tiers` đã trả `...t` nên có sẵn chuỗi.
- `HangThe.jsx`: một ô nhiều dòng "Quyền lợi (mỗi dòng một ý)" mỗi hạng. ~10 dòng. Build `client/dist`.

## Phần G — hiển thị
- `dongHoaDon.js`: dòng `mon` của hàng thẻ (`product_id` trong dải thẻ, đọc từ `hd.mon` theo cùng vị trí) → `loai: 'the'`, `ghi_chu: 'Hạn mới:
  dd/mm/yyyy'` lấy từ `pos_membership_purchases.expires_at` của đơn (đã huỷ → không có dòng sổ → không ghi hạn). Cần `hoaDon.js` trả thêm
  `la_the` trên `mon[]` (1 dòng). Bill quầy không đổi chữ.
- `chiTietDon` `mon[]`: dòng thẻ thêm `loai: 'the'` (đơn thật: theo dải `product_id`; đơn chưa trả: từ `than`) để App vẽ dòng thẻ khác món;
  không thêm `hang_id` (phiếu G chỉ đòi `hoa_don[]` — bớt cho gọn).
- `so_mon` (tóm tắt Lịch sử đơn): dòng thẻ ĐẾM là 1 ở cả đơn chưa trả (`than`) lẫn đơn thật (`tomTatDonThat`, `donApp.js:321`) — hai đường
  cùng một cách đếm, không đổi luật KH-TOMTAT-1.
- `dsQuay`: mỗi đơn thêm `co_the` (tên thẻ hoặc null); `mon[]` bỏ dòng thẻ (quầy không pha). `DonAppNoi.jsx` / `DonApp.jsx` hiện nhãn
  "🎟️ Có thẻ … — đã lên hạng, không pha". Đơn chỉ có thẻ vẫn hiện (nút Đang làm / Xong giữ như cũ) → **Q3**.
- Tem ly: đã bỏ dòng thẻ (`inPhieu.js:96`) — chỉ bài thử. `InPhieu.jsx` không sửa.
- Đối soát: không sửa — tiền theo cột tiền của đơn, không phân kênh; I15 không phân kênh. Bài thử chạy I15 + `tienTheoSo` trên đơn thẻ App.

## Phần H — điểm
Không viết luật điểm: đơn thẻ App đi đúng chỗ cộng điểm của `taoDon` (`tienTinhDiem`) như thẻ bán ở quầy. Cờ tích điểm theo dòng là của
DIEM-MON-1 — tự áp khi việc đó vào main. Bài thử: điểm đơn thẻ App = điểm đơn quầy cùng tiền (đối chứng).

## Giờ hoạt động
Giỏ chỉ có thẻ vẫn qua `kiemGio` (`NGOAI_GIO`, `QUA_GIO_NHAN_DON`) như mọi đơn ("luật 4xx như đơn hiện nay") → **Q4**.

## Ngân sách (A2)
| File | Dòng (ước) |
|---|---|
| server/utils/donApp.js | ~60 |
| server/routes/kh/loi.js | 1 |
| server/routes/kh/index.js | 3 |
| server/routes/tiers.js | ~12 |
| server/nang_cap/023_quyen_loi_hang.js | ~12 |
| server/utils/dongHoaDon.js | ~10 |
| server/routes/hoaDon.js | 1 |
| máy chủ cộng | ~100 (ngân sách 350) |
| HangThe.jsx + DonAppNoi.jsx + DonApp.jsx | ~20 (ngân sách 80) |
| HOP_DONG_API_KH.md | ~25 |
| cong_cu/thu_KHTHE1.js + thu_HOPDONG_KH.js | ~330 (ngân sách 350) |
Không đụng: orders.js, giuCho.js, membershipStatus.js, doiSoat.js, database.js, InPhieu.jsx, api.js (có trong Phạm vi nhưng không cần).

## Bài thử `cong_cu/thu_KHTHE1.js` — ánh xạ nghiệm thu (khuôn thu_KHMUA1: kho tạm, QR giả, webhook ký trong bài)
| Mục | Ca |
|---|---|
| A | A1 đơn quầy mua thẻ (POST /orders) — giá, dòng sổ, hạn y như trước (đối chứng, phải xanh trên gốc) · A2 đơn App thẻ dùng CÙNG giá gói / CÙNG mã lỗi với quầy cho 3 tình huống chặn |
| B | B1 báo giá có dòng thẻ → `dong[]` thẻ đúng trường, `tong` = món + giá gói · B2 giỏ chỉ thẻ · B3 hai dòng thẻ → 400 `NHIEU_THE` · B4 `so_luong` 2 / `hang_id` chữ / `loai` lạ → 400 `YEU_CAU_KHONG_HOP_LE` · B5 Kim Cương → `HANG_CHI_CAP` · B6 gói tắt / chưa giá → `GOI_HANG_KHONG_BAN` · B7 có hạng cao hơn → `DA_CO_HANG_CAO_HON` · B8 `tong_da_xem` lệch → 409 `GIA_DA_DOI` + `bao_gia` · B9 gửi lại cùng khoá → `trung: true`, không đơn thứ hai · B10 cùng khoá khác gói thẻ → `KHOA_GUI_DA_DUNG` · B11 4xx của B3–B8 không để lại đơn / phiên / dòng sổ (đếm bảng) · B12 thẻ + mã giảm: tổng App = tổng quầy cùng giỏ (đối chứng) |
| C | C1 khách chưa hạng mua Vàng + 1 món → món giá GỐC (báo giá, đơn ghi) · C2 khách Vàng còn hạn gia hạn Vàng + món → món giá Vàng · C3 đơn SAU đó → giá Vàng |
| D | D1 trả ví → `/toi.hang` = Vàng ngay sau POST /don · D2 QR: sau POST /don `/toi.hang` null, không dòng sổ; Tingee báo → có hạng · D3 vi_qr: giữ ví chưa có hạng, QR đủ → có · D4 Tingee báo HAI lần (hai khoá) + hai webhook song song → đúng một đơn, một dòng sổ, I15 sạch · D5 xác nhận tay phiên App còn hạn → có hạng · D6 hai POST /don cùng khoá song song (ví) → một đơn, một dòng sổ, ví trừ một lần · D7 phiên hết hạn rồi tiền về → vào ví, không hạng (luật Q1a — chờ Q2) · D8 hạng bị xoá giữa lúc đặt và tiền về → tiền vào ví, `thong_bao_tien_ve` "vì thẻ hạng không còn mua được" (không phải "hết hàng") · D9 lỗi máy 5xx giữa tạo phiên (móc ném) → App nhận 5xx `LOI_MAY_CHU`, không dòng sổ thẻ |
| E | E1 quầy huỷ đơn thẻ App → dòng sổ mất, `/toi.hang` về trước · E2 xoá đơn → như E1 · E3 duyệt hoàn → bị chặn, hạng giữ · E4 App huỷ đơn chưa trả → chưa từng có dòng sổ · E5 Vàng gia hạn rồi huỷ đơn gia hạn → hạn về hạn cũ (cộng nối tính lại từ sổ) |
| F | F1 bước 023 thêm cột + bảng sao lưu khi có dòng; chạy lại không lỗi · F2 PUT tiers có `quyen_loi` → GET /kh/hang `quyen_loi[]` đúng dòng · F3 PUT không gửi `quyen_loi` → giữ cũ · F4 quá số dòng / quá dài → 400 · F5 PUT thiếu PIN → không đổi |
| G | G6 `so_mon` đơn thẻ chưa trả = sau khi trả · G1 `hoa_don[]` có dòng `loai: 'the'`, `ghi_chu` hạn mới khớp sổ · G2 `mon[]` dòng thẻ `loai`, `hang_id` (đơn thật + đơn chưa trả) · G3 `dsQuay` `co_the`, `mon[]` không dòng thẻ · G4 `dungTem` / `dungPhieuPhaChe` trên dòng đơn thật: không tem cho thẻ · G5 `tienTheoSo` CK đơn thẻ App = đơn thẻ quầy cùng tiền; I15 sạch |
| H | H1 điểm đơn thẻ App = điểm đơn thẻ quầy cùng tiền, cùng cách trả |
| K5 | K1 giỏ cũ (không thẻ) băm y như trước (băm chụp trên gốc) · K2 đơn App không thẻ: báo giá / đặt / tiến trình như cũ (`dong[]` món đúng trường cũ) · K3 cửa `/api/kh` khác không đổi — thu_HOPDONG_KH · K4 quầy bán thẻ = A1 · K5 luật giảm hạng: khách Kim Cương hết hạn còn Vàng → Vàng (gọi tinhHang, đối chứng) |
| An toàn | S1 thân có `customer_phone` / `sdt` của khách B → thẻ vẫn ghi cho khách token A · S2 khách B đọc `/don/:ma` đơn thẻ của A → 404 · S3 `tong_da_xem` / `don_gia` gửi lên không đổi giá · S4 lỗi không lộ lời máy (chỉ `error` + `code`) |

Đỏ trên gốc: B1–B10, C1, D1–D6, G1–G3, F1–F4, S1 (gốc từ chối dòng thẻ → `YEU_CAU_KHONG_HOP_LE`; chưa có cột / trường). Xanh trên gốc
(đối chứng): A1, K1, K2, K4, K5, E3, G4, H1-phần quầy.

### Đột biến (`viec/KH-THE-1/dot_bien.py`)
- `BV-the-docgio` bỏ nhận dòng thẻ ở docGio → B1, D1 đỏ.
- `BV-the-membership-buy` không chuyển `membership_buy` sang taoPhien (vẫn báo giá có thẻ) → B8 / D1 đỏ (GIA_DA_DOI hoặc không hạng).
- `VS-the-bam-bo-the` băm giỏ bỏ dòng thẻ → B10 đỏ.
- `VS-the-bam-doi-cu` băm dòng món theo dạng mới → K1 đỏ.
- `VS-the-nhieu` cho > 1 dòng thẻ → B3 đỏ.
- `VS-the-so-luong` nhận `so_luong` 2 → B4 đỏ.
- `VS-the-ghep-vi-tri` ghép `ct.items[i]` theo vị trí như cũ (thẻ đứng giữa giỏ) → B1 (giá dòng) + G2 (tên / ghi chú món sau thẻ) đỏ.
- `VS-the-ly-do-sau` đặt dòng lý do thẻ SAU dòng hết hàng → D8 đỏ.
- `BV-the-giu-ma` bỏ 3 mã khỏi GIU_MA → B5–B7 đỏ (`DON_KHONG_HOP_LE`).
- `VS-the-sdt-than` lấy SĐT từ thân → S1 đỏ.
- `BV-quyen-loi-giu` bỏ COALESCE → F3 đỏ. `VS-quyen-loi-tran` nới trần dòng thêm 1 → F4 đỏ (ca ngay trên / ngay dưới trần).
- `BV-hoa-don-the` bỏ đánh dấu dòng thẻ ở dongHoaDon → G1 đỏ. `BV-quay-bo-the` để dòng thẻ trong `dsQuay.mon` → G3 đỏ.
Mỗi đột biến neo chuỗi ngắn riêng, chạy từng tên, có đối chứng (bản không đột biến xanh).

### Thử tay (LUAT §6.4 — máy không kiểm được giao diện)
1. Cài đặt → Hạng thành viên: gõ 3 dòng quyền lợi cho Vàng, Lưu (PIN) → tải lại trang, chữ còn đủ 3 dòng.
2. Màn Đơn App ở quầy: đơn App có thẻ hiện nhãn "🎟️ Có thẻ … — đã lên hạng, không pha", danh sách món không có dòng thẻ.
3. In tem đơn đó: không có tem cho dòng thẻ.

## Đường song song cần canh (K4)
- Mọi chỗ đọc `than.dong` của đơn App: `dsQuay`, `tomTat` (`so_mon`, `mon_dau`), `chiTietDon` đơn chưa trả, `thongBaoTienVe` — dòng thẻ có
  `ten`, `so_luong` 1, không `ghi_chu`.
- Mọi chỗ ghép báo giá ↔ items: `baoGia` (`dong`), `than` trong `datDon` (dùng `kq.bao.dong` — cùng ghép).
- Hai lần gọi `kiemVaBaoGia` trong `datDon` (lần đầu + lần giá đổi giữa chừng) — cùng hàm, tự đủ.
- `chiTinh` (báo giá) và `don` truyền `taoPhien` — cả hai phải mang `membership_buy` (BV-the-membership-buy canh).
- `GIU_MA` dùng cho cả lỗi `taoPhien` và `chotPhien` (đồng bộ một danh sách).
- `tomTatDonThat` (`donApp.js:321`) đếm dòng thẻ trong `so_mon` đơn thật — giữ, cùng cách với `than` (ca G6).
- `manKhach.js:123–134` (màn hình khách) chạy lại `taoDon` từ thân phiên — thân phiên App có `membership_buy` nên hiện đúng dòng thẻ; không sửa.
- Ba bài khoá `/kh/hang` đúng 9 trường: `thu_KHAPI2.js` C1, `thu_HANG1.js` F1 (ngoài Phạm vi) — sửa ĐÚNG dòng danh sách, thêm `quyen_loi`,
  vẫn so BẰNG (LUAT §6.7), ghi `SỐ CA`. `thu_HOPDONG_KH.js` (trong Phạm vi) tự đọc phần máy đọc.

## Luồng hợp lệ phải KHÔNG bị chặn (K5)
1. Đơn App không thẻ (giỏ cũ, khoá gửi cũ còn trong 24 giờ) — K1, K2.
2. Quầy bán thẻ (mọi cách trả) — A1, K4.
3. Khách đang Vàng mua thêm Vàng (cùng hạng — cộng nối) — C2, E5.
4. Khách Vàng hết hạn mua lại Vàng — C1 biến thể (hạng `expired` không chặn).
5. Giỏ chỉ thẻ, trả ví đủ / QR / vi_qr — B2, D1–D3.
6. Đơn thẻ + mã giảm hợp lệ — đi như quầy (mã áp theo luật mã hiện có, không viết luật mới) — ca B12 đối chứng với quầy cùng giỏ.

## Cần chủ quán xác nhận
- **Q1 (phần A):** phiếu ghi "tách MỘT hàm bán thẻ (vd banThe.js)". Máy đề xuất KHÔNG tách: hàm bán thẻ duy nhất đã là đường tạo đơn của
  quầy, App đi thẳng vào đó; tách chỉ dời chỗ ~45 dòng trong đường tiền đang chạy đúng, có rủi ro làm đỏ bài cũ. Đồng ý A2?
- **Q2 (phần D):** tiền QR về SAU khi đơn App đã hết hạn 10 phút → luật hiện có (05.11) cộng tiền vào ví khách, không tạo đơn → khách
  KHÔNG có hạng, phải mua lại (lần này trả bằng ví). Máy đề xuất giữ luật đó (không mở đường tiền mới). Đồng ý?
- **Q3 (phần G):** đơn App CHỈ có thẻ vẫn hiện ở màn Đơn App quầy với nhãn "Có thẻ — đã lên hạng, không pha" (nhân viên bấm Xong như đơn
  thường). Đề xuất giữ vậy cho đơn giản. Đồng ý?
- **Q4:** ngoài giờ mở cửa, App cũng KHÔNG cho mua thẻ (như đặt món). Đề xuất giữ — cùng một luật cho mọi đơn. Đồng ý?
