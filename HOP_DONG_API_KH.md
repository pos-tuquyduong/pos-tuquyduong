# Hợp đồng cổng `/api/kh` — POS ↔ App KH

PHIEN_BAN: 16
NGAY: 2026-11-13
DOC_TU_CODE: POS main (KH-SP-1 + KH-MUA-1 + CT-1a + HANG-1 + CK-NOIDUNG-1 + KH-TOMTAT-1 + KH-THE-1) + HUY-1 + QC-APP-1 (routes/quang-cao.js, nang_cap/028_quang_cao.js, routes/chuong-trinh.js, routes/tiers.js, server/routes/kh/index.js, loi.js, middleware/khachAuth.js, utils/pinKhach.js, utils/maKhach.js,
  routes/wallets.js loiGhi, routes/signup-codes.js, utils/giaHang.js, utils/gioHoatDong.js, utils/donApp.js, utils/dongHoaDon.js, utils/giuCho.js, utils/membershipStatus.js, nang_cap/003_xung_ho_khach.js,
  nang_cap/005_thong_tin_mon.js, utils/thongTinMon.js, nang_cap/006_don_app.js, nang_cap/013_hang.js, nang_cap/023_quyen_loi_hang.js) — bài thử cong_cu/thu_HOPDONG_KH.js canh khớp code

<!-- Nguồn DUY NHẤT về cổng /api/kh. Chủ: POS. Đổi cổng → đổi file này cùng PR, tăng PHIEN_BAN, ghi nhật ký (luật L2).
     Khối HOP_DONG_MAY_DOC là phần máy đọc: bài thử hợp đồng của POS và bộ kiểm của App KH cùng dựa vào nó. -->

## Chung
- Địa chỉ: `https://www.pos-tuquyduong.io.vn/api/kh` (CÓ `www` — bản không `www` tự chuyển hướng, trình duyệt chặn yêu cầu bị chuyển
  hướng từ App). Mọi câu trả lời thành công có `success: true`.
- Đăng nhập xong nhận `token`; các cửa "token: có" gửi `Authorization: Bearer <token>`. Thiếu / sai / hết hạn → 401 `KH_TOKEN_SAI`.
  Cửa "token: không bắt buộc" (`/menu`, từ v3): KHÔNG gửi tiêu đề `Authorization` thì vẫn 200; CÓ gửi mà sai / hết hạn (kể cả `Bearer null`)
  → 401 `KH_TOKEN_SAI` — chưa đăng nhập / đã đăng xuất thì App KHÔNG gửi tiêu đề này.
- Lỗi luôn `{ error: '<lời tiếng Việt>', code: 'MA_IN_HOA' }` — App hiện nguyên `error`.
- SĐT khách luôn lấy từ token, không bao giờ từ thân yêu cầu. Đơn / dữ liệu của khách khác → 404 như không có.
- **Giờ:** mọi trường giờ (`ngay`, `ngay_tao`, `ton_luc`…) là **giờ Việt Nam**, dạng `YYYY-MM-DDTHH:mm:ss`, KHÔNG có hậu tố múi giờ. App KHÔNG
  đưa thẳng vào `new Date(...)` (trình duyệt sẽ hiểu là giờ máy khách) — đọc như giờ `Asia/Ho_Chi_Minh`. "Bây giờ" lấy từ máy chủ (cửa giờ
  hoạt động, từ v2), không lấy đồng hồ điện thoại.

## Các cửa (phiên bản 6)
| Cửa | Token | Gửi | Trả (ngoài `success`) |
|---|---|---|---|
| `POST /dang-nhap/xin-ma` | không | `{ sdt }` | `lay_ma_tai_quay` (true = khách hỏi mã ở quầy) |
| `POST /dang-nhap/xac-minh` | không | `{ sdt, ma, ten?, xung_ho?, dia_chi? }` (mã 6 số; khách MỚI thiếu `ten` hoặc `xung_ho` → `CAN_TEN`; khách cũ: ba trường bị bỏ qua) — xem "Đăng ký 3 bước" | `token`, `khach { sdt, ten, ngay_tao, xung_ho, dia_chi, ngay_sinh }` |
| `GET /hang` | không | — | `data[] { id, ten, phan_tram, phan_tram_nhom_dac_biet, chi_cap, goi[] { so_thang, gia }, thu_bac, gia_the, thu_tu, quyen_loi[] }` — hạng đang bật, xếp theo `thu_bac` (v10 — xem "Ghi chú v10"; `quyen_loi` v13) |
| `GET /gio-vang` | không | — | `dang_chay, bat_dau, ket_thuc, phan_tram, mon[]` (mã món = `ma` của `/menu`) — xem "Giờ vàng". **Không có suất** (POS không đếm suất) |
| `GET /gio-hoat-dong` | không | — | `bay_gio, dang_mo, nhan_don, hom_nay { mo, dong } \| null, mo_lai_luc \| null, thong_bao, lich_tuan[] { thu, mo, dong, nghi }, ngay_nghi[] { ngay, ly_do }` — xem "Giờ hoạt động" |
| `GET /chuong-trinh` | không | — (không token: dùng chung trần ≤ 300 lần / phút mỗi IP với `/menu`, vượt → 429 `QUA_NHIEU_LAN`) | `data[] { ma, ten, mo_ta, loai, dang_bat }` — chương trình đặc biệt đang bật và trong thời gian chạy; xem "Ghi chú v9" |
| `GET /quang-cao` | không | — (không token: dùng chung trần ≤ 300 lần / phút mỗi IP với `/menu`, vượt → 429 `QUA_NHIEU_LAN`) | `bay_gio, data[] { id, chu_dai, tieu_de, phu, chu_nut, dich, ma_mon, tu_gio, den_gio, uu_tien }` — dải quảng cáo + banner Trang chủ hôm nay; xem "Ghi chú v16" |
| `GET /toi` | có | — | `khach { sdt, ten, ngay_tao, xung_ho, dia_chi, ngay_sinh, qr, hang, so_du_vi }` — `hang { id, ten, phan_tram, phan_tram_nhom_dac_biet, het_han } \| null` (hạng CAO NHẤT còn hạn; `het_han` null = không thời hạn — v10); `so_du_vi` xem dưới |
| `PUT /toi` | có | `{ ten?, xung_ho?, dia_chi?, ngay_sinh? }` — ít nhất một khoá; xem "Hồ sơ" và "Ghi chú v9" | `khach { sdt, ten, ngay_tao, xung_ho, dia_chi, ngay_sinh }` |
| `POST /gia-han` | có | — | `token`, `het_han` — xem "Tự gia hạn" |
| `GET /menu` | không bắt buộc | — (không token: ≤ 300 lần / phút mỗi IP, vượt → 429 `QUA_NHIEU_LAN`) | `data[] { ma, ten, nhom, gia, con_hang, ton_cu, ton_luc, gia_hang[] { hang_id, gia }, nhu_cau[], the_chat[], mo_ta, cong_dung, thanh_phan, anh }` — `con_hang` có thể `null`; trường mới (v4) xem "Ghi chú v4" |
| `GET /diem` | có | — | `points`, `history` |
| `GET /voucher` | có | `?all=1` lấy cả mã đã dùng / hết hạn | `data[]`, `ma_khach_moi` |
| `GET /don` | có | `?trang=N` (20 đơn / trang) | `trang`, `con_nua`, `data[] { ma, so_hd, ngay, tong, da_tra, trang_thai, thanh_toan, tien_trinh, qr, tien_ve_cho_doi_soat, tien_ve_da_cong_vi, thong_bao_tien_ve, hoan_vao_tai_khoan, ly_do_huy, cach_tra, giu_vi, con_lai, kenh, cach_nhan, tra[] { cach, so_tien }, so_mon, mon_dau, giam }` — gồm cả đơn App chưa trả (v5); `kenh` … `giam` (v12): xem "Ghi chú v12"; `cach_tra` / `giu_vi` / `con_lai` (v6): xem "Ghi chú v6"; `so_hd`, `tien_ve_da_cong_vi`, `thong_bao_tien_ve` (v10): xem "Ghi chú v10"; `hoan_vao_tai_khoan`, `ly_do_huy` (v14): xem "Ghi chú v14" |
| `GET /don/:ma` | có | — (`ma` = mã đơn App hoặc mã bill) | `don { ma, so_hd, ngay, tong, da_tra, trang_thai, thanh_toan, tien_trinh, qr, tien_ve_cho_doi_soat, tien_ve_da_cong_vi, thong_bao_tien_ve, hoan_vao_tai_khoan, ly_do_huy, mon[] { ma, ten, so_luong, don_gia, thanh_tien, ghi_chu, loai? }, cach_tra, giu_vi, con_lai, kenh, cach_nhan, tra[] { cach, so_tien }, so_mon, mon_dau, giam, hoa_don[] { loai, trai, phai, dam, gach, ghi_chu } }` — trường v6: xem "Ghi chú v6"; v10: "Ghi chú v10"; v12: "Ghi chú v12"; dòng thẻ (v13): "Ghi chú v13"; `hoan_vao_tai_khoan`, `ly_do_huy` (v14): "Ghi chú v14" |
| `POST /gio/bao-gia` | có | `{ mon[] { ma, so_luong, ghi_chu? } \| { loai: "the", hang_id, so_thang, so_luong? }, ma_giam?, cach_nhan: "tai_quan" }` — xem "Đặt đơn", dòng thẻ: "Ghi chú v13" | `dong[] { ma, so_luong, don_gia, thanh_tien }` (dòng thẻ thêm `loai, hang_id, so_thang`, `ma` null), `tam_tinh, giam[] { loai, so_tien }, phi_giao, tong, ma_giam_loi` |
| `POST /don` | có | thân báo giá + `cach_tra`, `pin?`, `khoa_gui`, `tong_da_xem` — xem "Đặt đơn" | `ma_don, so_hd, tong, giu_vi, con_lai, tien_trinh, qr { chuoi, het_han } \| null, trung` |
| `POST /don/:ma/huy` | có | — (`ma` = mã đơn App) | `ma_don, tien_trinh` |
| `POST /nhan-ma-bill` | có | `{ ma }` | kết quả nhận ưu đãi khách mới |
| `POST /nhan-diem` | có | `{ ma }` | kết quả nhân điểm theo mã trên bill |
| `PUT /pin` | có | `{ pin, pin_lai }` (4 số) | — |

### Ghi chú v16 — dải quảng cáo + banner Trang chủ (QC-APP-1, thư POS 09.11)
**`GET /quang-cao`** (không token): `bay_gio` = giờ VN của máy chủ (`YYYY-MM-DDTHH:mm:ss`); `data[]` xếp theo `uu_tien` tăng dần (nhỏ = trước), `[]` khi không có dòng.
Chủ quán gõ ở POS (Cài đặt → "Quảng cáo trên App"); App KHÔNG tự thêm chữ.
- `id`: số (dòng chủ quán gõ) hoặc chuỗi `"gio_vang"` (dòng tự động, xem dưới). `chu_dai`: chữ chạy trên dải, ≤ 32 ký tự nhìn thấy (emoji = 1), App cắt "…" nếu dài.
  `tieu_de` (≤ 40) · `phu` (≤ 80) · `chu_nut` (≤ 20): chữ banner Trang chủ, chuỗi rỗng `""` = quán không điền (App chỉ hiện banner khi có `tieu_de`).
- `dich` ∈ `"menu"` · `"mon"` · `"uudai"` · `"tracnghiem"` · `""` (không mở gì). `ma_mon` = `ma` của `/menu`, CHỈ khi `dich = "mon"`, còn lại `null`.
  Món đã tắt / hết giá / bị xoá lúc App đọc → máy chủ trả `dich: "menu"`, `ma_mon: null` (App không phải tự xử lý).
- `tu_gio` / `den_gio`: `HH:mm` (giờ VN, không vắt qua nửa đêm), cả hai `null` = cả ngày. Máy chủ chỉ lọc theo NGÀY hôm nay (dòng đang bật VÀ hợp ngày: hằng ngày,
  hoặc đúng thứ trong tuần, hoặc trong khoảng ngày gồm cả hai đầu); **App tự so khung giờ với `bay_gio`** (không dùng đồng hồ điện thoại). Dòng đang tắt, dòng chưa tới / đã qua
  ngày, ngày / thứ / ghi chú nội bộ KHÔNG bao giờ trả ra.
- **Giờ vàng tự động:** nếu quán bật công tắc "Khi Giờ vàng đang chạy thì dải hiện Giờ vàng" VÀ Giờ vàng đang chạy (cùng điều kiện `dang_chay` của `/gio-vang`), `data[0]` là dòng
  `{ id: "gio_vang", uu_tien: 0, tu_gio: null, den_gio: "<giờ kết thúc>", dich: "menu", ma_mon: null, tieu_de/phu/chu_nut: "", chu_dai: "⏰ Giờ vàng: giảm 20% đến 16:00" }`
  (chữ do máy chủ dựng, ≤ 32 ký tự). Không có công tắc hoặc Giờ vàng không chạy → không có dòng này.
- Không có mã lỗi mới: quá trần lượt → 429 `QUA_NHIEU_LAN`; lỗi máy → 500 `LOI_MAY_CHU`. Không xoá / đổi tên trường cũ nào của cửa khác.

### Ghi chú v14 — đơn bị quán huỷ (HUY-1, chủ quán chốt 05.11)
`GET /don` (mỗi đơn) và `GET /don/:ma` thêm hai trường:
- `hoan_vao_tai_khoan` (số nguyên đồng | `null`): khi `tien_trinh` = `da_huy` — tổng tiền đã hoàn vào tài khoản của CHÍNH khách cho đơn này (quán huỷ
  đơn thì hoàn TOÀN BỘ số khách đã trả — tài khoản + chuyển khoản + tiền mặt — vào tài khoản khách; phần trả bằng tài khoản mẹ về tài khoản mẹ, không
  tính ở đây). Đơn `da_huy` chưa trả gì (QR hết hạn / khách tự huỷ) → `0`. Đơn chưa huỷ → `null`. App hiện: "Đã hoàn <số> vào tài khoản".
- `ly_do_huy` (chuỗi | `null`): nhãn ngắn lý do quán huỷ — một trong `Pha nhầm món` · `Bấm nhầm` · `Hết nguyên liệu` · `Khách đổi ý` · `Khác`
  (chỉ nhãn, KHÔNG có ghi chú nội bộ của nhân viên). `null` khi đơn chưa huỷ, hoặc đơn huỷ trước bản này / khách tự huỷ.
Không xoá / đổi tên trường cũ — App v13 bỏ qua trường lạ là chạy nguyên.

### Ghi chú v13 — mua thẻ hạng trên App (KH-THE-1, chủ quán duyệt 08–09.11)
- **Dòng thẻ** trong `mon[]` của `POST /gio/bao-gia` và `POST /don`: `{ loai: "the", hang_id, so_thang, so_luong? }` — `hang_id` = `id` của `/hang`,
  `so_thang` = `goi[].so_thang` của hạng đó (số nguyên ≥ 1), `so_luong` bỏ hoặc 1; KHÔNG kèm `ma` / `ghi_chu` / giá (khoá lạ → 400
  `YEU_CAU_KHONG_HOP_LE`); dòng MÓN không gửi khoá `loai` (có `loai` = dòng thẻ). Tối đa MỘT dòng thẻ mỗi đơn (hai dòng → 400 `NHIEU_THE`). Giỏ chỉ có thẻ được. Đứng đâu trong giỏ cũng được — `dong[]`
  giữ đúng thứ tự gửi. Cùng `khoa_gui`, `tong_da_xem`, `cach_tra` (`qr` · `vi` · `vi_qr`), luật 4xx / 5xx như đơn đồ uống.
- **Giá** = giá gói máy chủ tra (cùng đường bán thẻ của quầy). Dòng thẻ trong `dong[]`: `{ loai: "the", hang_id, so_thang, ma: null, so_luong: 1,
  don_gia, thanh_tien }`; dòng món giữ đúng 4 trường cũ. Không giảm hạng / Giờ vàng cho dòng thẻ. Mã giảm (`ma_giam`) áp ĐÚNG như ở quầy: mã % và mã tiền
  tính trên tạm tính GỒM giá thẻ (giỏ chỉ thẻ Vàng 250.000 + mã 10% → `tong` 225.000); App hiện đúng `giam[]` / `tong` máy chủ trả, không tự tính. Đồ uống CÙNG đơn tính theo hạng khách ĐANG CÓ lúc
  báo giá / đặt (không theo thẻ đang mua); hạng mới áp từ đơn sau.
- **Chặn** (400, cùng mã quầy): `HANG_CHI_CAP` (hạng chỉ chủ quán cấp — App hiện hạng, nút Mua mờ) · `GOI_HANG_KHONG_BAN` (gói chưa có giá / đang tắt)
  · `DA_CO_HANG_CAO_HON` (khách đang có hạng cao hơn còn hạn; cùng hạng thì được — hạn cộng nối) · hạng không có / đã xoá → `DON_KHONG_HOP_LE`.
- **Hạng lên** NGAY trong cùng giao dịch ghi "đã thu": `vi` lúc `POST /don`; `qr` / `vi_qr` lúc tiền QR về đủ. Chưa thu → chưa có hạng. `/toi.hang`
  đổi ngay sau đó. Báo tiền trùng → một đơn, một lần lên hạng. Tiền QR về SAU khi đơn đã `da_huy` / hết hạn → cộng vào tài khoản như mọi đơn App
  (`thong_bao_tien_ve`), KHÔNG có hạng — khách mua lại (chủ quán 09.11). Hạng không còn mua được lúc tiền về (vd vừa được cấp hạng cao hơn) → tiền vào
  tài khoản, `thong_bao_tien_ve` "Không tạo được đơn vì thẻ hạng không còn mua được — …".
- **Giờ** (chủ quán 09.11): giỏ KHÔNG có đồ uống (chỉ thẻ hạng; sau này gói nạp / gói trả trước) đặt / báo giá được MỌI giờ — không `NGOAI_GIO` /
  `QUA_GIO_NHAN_DON`. Giỏ có đồ uống vẫn theo giờ như cũ (cả khi kèm thẻ).
- **Tiến trình:** giỏ không có đồ uống → đã thu là `tien_trinh: "xong"` ngay (quầy không pha; đơn vẫn hiện ở màn Đơn App của quầy với nhãn "đã lên hạng").
  Giỏ có đồ uống → `da_tra` → `dang_lam` → `xong` như cũ.
- **Xem đơn:** `GET /don/:ma` `mon[]` dòng thẻ có thêm `loai: "the"`, `ten` "🎟️ Thẻ hội viên <hạng> · <n> tháng", `ghi_chu` `null`; dòng món không có
  `loai`. `mon[]` theo thứ tự của đơn (món trước, dòng thẻ cuối — có thể khác thứ tự giỏ gửi lên); thứ tự, `ten`, `so_luong`, `ghi_chu`, `loai` và
  `mon_dau` giống nhau trước và sau khi trả. `don_gia` như từ v5: đơn chưa trả là giá gốc một ly, đơn đã trả là giá đã giảm hạng / Giờ vàng của dòng đó. `hoa_don[]` dòng thẻ `loai: "the"` (cùng `trai` / `phai` như dòng món), `ghi_chu` "Hạn mới: dd/mm/yyyy" (đơn bị huỷ: rỗng).
  `so_mon` đếm dòng thẻ là 1. Hạn mới không thời hạn → "Hạn mới: không thời hạn".
- **Huỷ / hoàn:** quầy huỷ / xoá đơn có thẻ → thẻ của đơn bị thu hồi, hạng tính lại (hạn cộng nối lùi về). Đơn có thẻ không hoàn qua yêu cầu
  hoàn tiền (như quầy). App chỉ huỷ được đơn chưa trả (chưa có hạng).
- **Điểm:** đơn có thẻ cộng điểm theo đúng luật điểm của quầy (cùng hàm). `GET /hang` thêm `quyen_loi[]` (chữ chủ quán nhập ở Cài đặt → Hạng thành
  viên, mỗi phần tử một dòng, tối đa 10 dòng × 120 ký tự; chưa nhập → `[]`).
- **Phần NAP-1 ghi bù** (hành vi đã chạy từ NAP-1, chưa ghi ở bản trước): đơn trả bằng tài khoản (ví) VẪN có điểm như tiền mặt; đơn nạp tiền (mua gói
  nạp ở quầy) hiện trong `GET /don` như đơn quầy thường và có 0 điểm (điểm tính khi tiêu tiền trong tài khoản).

### Ghi chú v12 — tóm tắt từng đơn ở Lịch sử đơn (KH-TOMTAT-1)
Thêm vào MỖI đơn của `GET /don` và vào `don` của `GET /don/:ma` (chỉ đơn thuộc SĐT trong token). Không đổi trường cũ.
- `kenh`: `app` (đặt từ App) · `quay` (tạo ở quầy); sau này thêm kênh nền tảng (KENH-1) — App bỏ qua giá trị lạ, hiện nguyên.
- `cach_nhan`: `tai_quan` · `giao` (đơn quầy có phí giao > 0) · `null` (đơn cũ không ghi phí giao). Quầy không phân biệt "tại chỗ", nên chưa có `tai_cho`.
  Đơn App chưa có đơn thật luôn `tai_quan`; đơn App đã trả tính theo phí giao như đơn quầy.
- `tra[] { cach, so_tien }`: các cách khách ĐÃ trả, đúng các dòng thanh toán của hoá đơn quầy (bỏ dòng ghi nợ), cùng thứ tự: `tai_khoan` (ví) ·
  `tai_khoan_me` (ví mẹ) · `chuyen_khoan` (QR / chuyển khoản) · `tien_mat`. Đơn trả ví + QR → hai dòng. Tổng `so_tien` = `da_tra`. Đơn App chưa trả /
  huỷ trước khi trả → `[]`; đơn cũ thiếu tiền → `null`.
- `so_mon` (tổng số ly / món, số nguyên) và `mon_dau` (tên món đầu): `null` khi đơn thật không còn dòng món.
- `giam`: tổng tiền đã giảm = giảm hạng + Flash + mã / quà (số dương, đúng tổng các dòng `giam_hang` `giam_flash` `giam_ma` in trên `hoa_don[]`);
  `0` khi không giảm; `null` khi đơn cũ thiếu tổng. Phí giao KHÔNG tính là giảm.

### Ghi chú v11 — số hoá đơn và tiền về muộn (CK-NOIDUNG-1)
- `so_hd` (`GET /don`, `GET /don/:ma`, `POST /don`): số hoá đơn POS của đơn — ĐÚNG chuỗi in to trên bill và trong nội dung chuyển khoản: `APP0016` (đơn App),
  `HD0016` (đơn quầy), đơn cũ trước v11 `012`. Đơn App được cấp số NGAY lúc tạo (cả khi chưa trả); `null` khi đơn App chưa có số (tạo trước v11).
  App hiện `so_hd` cho khách thay mã App. `ma` / `ma_don` (mã App `A…`) GIỮ NGUYÊN — vẫn là mã để gọi `GET /don/:ma`, `POST /don/:ma/huy`.
- Nội dung chuyển khoản trong `qr.chuoi`: `TQD<THÁNG 3 chữ tiếng Anh><NGÀY 2 số> APP<4 số>` (vd `TQDNOV05 APP0016`, giờ VN) — App không cần đọc.
- `tien_ve_da_cong_vi` (số nguyên đồng, 0 khi không có): tiền QR về mà máy chủ KHÔNG tạo được đơn — đơn App đã `da_huy` (khách huỷ / QR hết hạn),
  HOẶC tiền về đúng hạn nhưng đơn hỏng (vd món hết hàng đúng lúc đó) → máy chủ tự cộng số tiền thật đã về vào tài khoản (ví) của khách, một lần
  mỗi giao dịch ngân hàng — báo lặp chỉ cộng một lần (chủ quán 05.11). Khi CẢ HAI cổng QR cùng báo tiền cho một đơn: từ lúc cổng thứ hai báo, mọi
  báo sau (của cả hai cổng) KHÔNG tự cộng — quán đối chiếu sao kê rồi cộng tay (chủ quán 06.11), nên số này có thể nhỏ hơn tiền đã chuyển. Đơn hiện `da_huy`,
  `tien_ve_cho_doi_soat: true`.
- `thong_bao_tien_ve` (chuỗi | `null`): câu App HIỆN NGUYÊN cho khách khi `tien_ve_da_cong_vi` > 0 — đơn hỏng: `Không tạo được đơn <lý do ngắn> — đã cộng
  <số tiền> vào tài khoản của bạn` (vd `Không tạo được đơn vì món đã hết hàng — đã cộng 25.000đ vào tài khoản của bạn`); đơn huỷ / hết hạn: `Tiền về sau
  khi đơn đã huỷ / hết hạn — đã cộng <số tiền> vào tài khoản của bạn`. `null` khi không có tiền nào được cộng. App không tự ghép câu.

### Ghi chú v6 — hoá đơn và cách trả của đơn App (`/don`, `/don/:ma`)
- `cach_tra` = `qr` (chỉ quét QR) · `vi` (trả đủ bằng ví) · `vi_qr` (giữ ví một phần, quét QR phần còn lại); `giu_vi` = số đã giữ / trừ từ ví,
  `con_lai` = số còn phải quét QR — cùng số `POST /don` đã trả, đọc lại được khi tải lại / đổi máy. Đơn quầy: cả ba `null`. `vi_qr` suy ra từ số ví
  THỰC giữ (> 0): khách chọn ví + QR nhưng ví hết tiền thì đọc ra `qr`.
- `hoa_don[]` (chỉ ở `GET /don/:ma`): các dòng của tờ GIAO KHÁCH, dựng sẵn bằng CÙNG hàm của hoá đơn in ở quầy (`client/src/utils/hoaDon.js`) trên
  cùng dữ liệu + cùng chữ ở Cài đặt hoá đơn; App chỉ vẽ theo thứ tự, không tự tính / xếp. Mỗi dòng đủ 6 trường: `loai` (xem dưới), `trai`, `phai`
  (chữ, có thể rỗng), `dam` (true = in đậm cả dòng), `gach` (chữ gạch ngang — giá gốc của món có giá hạng, còn lại rỗng), `ghi_chu` (ghi chú của món).
  `loai`: `canh_bao` (đơn huỷ / hoàn) · `ten_quan` · `dia_chi` · `so_bill` (trai = chữ "SỐ BILL", phai = số bill) · `nhan` · `gio` (trai = giờ, phai = nhân viên — RỖNG với đơn App, chủ quán 03.11)
  · `khach` (trai = nhãn, phai = tên) · `mon` (trai = "SL x tên", phai = thành tiền) · dòng tiền `gia_goc` `giam_hang` `giam_flash` `giam_ma` `phi_giao` `tong`
  · `tieu_de` (đầu mục THANH TOÁN / ĐIỂM THƯỞNG) · dòng trả `tu_tk` `tu_tk_me` `ck` `tm` `ghi_no` `dua_tra` `ma_gd` (v11: trai = "Mã GD", phai = mã giao dịch ngân hàng) · dòng điểm `diem_truoc` `diem_doi` `diem_cong`
  `diem_co` · `chan` (lời cảm ơn, chính sách, ghi chú). App bỏ qua `loai` lạ nhưng vẫn vẽ `trai` / `phai`. KHÔNG có QR, mã nhận điểm, SĐT. Đơn App chưa
  có đơn thật (đang chờ trả, hoặc huỷ TRƯỚC khi trả) hoặc máy chủ không dựng được tờ → `[]` (App tự vẽ từ `mon[]`).

### Ghi chú v9 — ngày sinh + chương trình đặc biệt (CT-1a)
- `khach.ngay_sinh` (của `/toi`, `PUT /toi`, xác minh): `YYYY-MM-DD` hoặc `null` khi chưa nhập. Là NGÀY LỊCH, không có giờ / múi giờ.
- **`PUT /toi` nhận `ngay_sinh` MỘT lần:** chỉ khi đang `null`. Đã có → 409 `NGAY_SINH_DA_CO` (kể cả gửi lại cùng giá trị); không phải chuỗi `YYYY-MM-DD`
  đúng lịch (kể cả `null`, rỗng), ở tương lai, hoặc tuổi hôm nay ngoài khoảng quán đặt (mặc định 5–100, quán đổi được) → 400 `NGAY_SINH_SAI`. Từ chối thì
  KHÔNG trường nào trong cùng thân được sửa. Sau khi nhập, App không sửa được nữa — khách đưa căn cước cho nhân viên, chỉ quán sửa ở POS. POS không lưu số căn cước.
- **`GET /chuong-trinh`** (không token): `data[] { ma, ten, mo_ta, loai, dang_bat }` theo thứ tự tạo; `loai` ∈ `sinh_nhat` · `hoc_sinh_gioi` · `khac`;
  `dang_bat` luôn `true` (chỉ trả chương trình đang bật VÀ trong thời gian chạy — ngày bắt đầu / kết thúc tính cả ngày đó, giờ VN). Chỉ HIỂN THỊ ("áp dụng tại
  quán"): mức ưu đãi và điều kiện KHÔNG trả ra; App KHÔNG áp chương trình lên đơn App.

### Ghi chú v4 — thông tin ngắn của món (`/menu`)
- Mỗi món thêm: `nhu_cau[]`, `the_chat[]` (mảng MÃ; chưa nhập → `[]`), `mo_ta`, `cong_dung`, `thanh_phan` (chữ; chưa nhập → `null`), `anh` (luôn
  `null` — ảnh món làm sau, KH-SP-2; App giữ ô ảnh chờ). Quầy nhập ở Cài đặt → Sản phẩm; không trường nào khác của `/menu` đổi.
- Mã `nhu_cau` ∈ `ngu_ngon` (Ngủ ngon) · `dep_da` (Đẹp da) · `am_bung` (Ấm bụng) · `tinh_tao` (Tỉnh táo) · `bo_khi` (Bổ khí) · `giai_nhiet` (Giải nhiệt).
  Mã `the_chat` ∈ `binh_hoa` (Bình hoà) · `khi_hu` (Khí hư) · `duong_hu` (Dương hư) · `am_hu` (Âm hư) · `dam_thap` (Đàm thấp) · `thap_nhiet`
  (Thấp nhiệt) · `huyet_u` (Huyết ứ) · `khi_uat` (Khí uất) · `dac_bam` (Đặc bẩm). Nguồn mã: `server/utils/thongTinMon.js`; mã mới thì thêm vào
  đó, tăng PHIEN_BAN, App hiện nguyên mã lạ (đừng báo lỗi). Độ dài tối đa: `mo_ta` 160 · `cong_dung` 160 · `thanh_phan` 200 ký tự.
- Cửa ghi nằm ở quầy (`PUT /api/pos/products/thong-tin`, quyền cài đặt) — KHÔNG thuộc `/api/kh`; App KH chỉ đọc.

### Đặt đơn (v5 — KH-MUA-1, nhận tại quán)
- **Giờ:** (giỏ có đồ uống — giỏ không có đồ uống bán mọi giờ, v13) đặt / báo giá khi quán đóng → 400 `NGOAI_GIO`; quán mở nhưng đã ngừng nhận đơn App (`nhan_don: false` của `/gio-hoat-dong`) → 400
  `QUA_GIO_NHAN_DON`. Máy chủ xét theo giờ của máy chủ.
- **Giỏ:** `mon` 1–50 dòng; `ma` = `ma` của `/menu`; `so_luong` số nguyên 1–99; `ghi_chu` chuỗi ≤ 200 ký tự hoặc bỏ. Cùng một món được nhiều dòng (ghi
  chú khác nhau). Món không có / giá không hợp lệ → 400 `MON_KHONG_BAN` kèm `ma`; `con_hang: false` hoặc tổng SL vượt tồn đã biết → 400 `HET_HANG`
  kèm `ma` (tồn chưa rõ — `con_hang: null` — không chặn). `cach_nhan` chỉ `tai_quan`; `giao` → 400 `CHUA_GIAO` (KH-MUA-2); khác → `YEU_CAU_KHONG_HOP_LE`.
- **Báo giá** (`POST /gio/bao-gia`, không ghi gì): máy chủ tính bằng CÙNG hàm của quầy. `dong[].don_gia` = giá gốc một ly, `thanh_tien` = `don_gia ×
  so_luong`; `tam_tinh` = Σ `thanh_tien`; `giam[]` chỉ dòng > 0, `loai` ∈ `ma_giam` · `hang` · `gio_vang`; `phi_giao` = 0 (nhận tại quán);
  `tong` = `tam_tinh` − Σ `giam` + `phi_giao`. Giờ vàng có món trong giỏ thì không giảm hạng (luật quầy). `ma_giam_loi` = `null` hoặc `{ code, error }`
  khi mã gửi kèm KHÔNG được áp: `MA_KHONG_TON_TAI` · `MA_KHONG_AP_DUNG` (hết hạn / hết lượt / chưa đủ tối thiểu / mã % lúc Giờ vàng) ·
  `MA_KHONG_CO_MON` (mã giảm một món mà giỏ không có món đó) · `MA_KHONG_LOI_HON` (giá hạng lợi hơn mã — `error` nói rõ). Mã không áp thì đơn đặt
  theo đúng số báo giá KHÔNG mã — App hiện `error` cho khách.
- **Đặt** (`POST /don`): `cach_tra` = `qr` (QR payOS cả đơn) · `vi` (ví + `pin`, ví phải đủ cả đơn — thiếu → 400 `VI_KHONG_DU`) · `vi_qr` (giữ hết ví +
  QR phần còn lại; ví đủ cả đơn → 400 `CACH_KHONG_KHOP`; ví 0đ → như `qr`). `pin` 4 số của chính khách (sai → 400 `PIN_SAI`, sai 5 lần liền → 423
  `PIN_DANG_KHOA` 15 phút, chưa đặt → 400 `CHUA_CO_PIN`). Máy chủ KHÔNG đọc số tiền / giá App gửi.
  - `tong_da_xem` (BẮT BUỘC, số nguyên ≥ 0) = `tong` của báo giá khách vừa thấy. Chỉ dùng để SO: máy chủ tính lại, khác → 409 `GIA_DA_DOI` dạng
    `{ error, code: "GIA_DA_DOI", bao_gia: { …đúng dạng trả lời /gio/bao-gia, không có success… } }`, không tạo gì — App hiện báo giá mới cho khách
    bấm lại. Thiếu / sai dạng (chuỗi, số lẻ, âm) → 400 `YEU_CAU_KHONG_HOP_LE`.
  - `vi` → chốt ngay: đơn thật, `tien_trinh: da_tra`, `qr: null`. `qr` / `vi_qr` → `tien_trinh: cho_tra`, `qr { chuoi, het_han }` (chuỗi VietQR để vẽ
    mã; hết hạn sau 10 phút — `het_han` giờ VN). Đơn CHỈ thành đơn thật (về quầy, kêu chuông) khi tiền về đủ.
  - Mỗi khách ≤ 10 lần / 10 phút (đếm trong bộ nhớ máy chủ) → 429 `QUA_NHIEU_LAN` kèm `thu_lai_sau_giay`. Gửi lại cùng `khoa_gui` mà nhận đơn cũ
    (200 `trung`), 409 `KHOA_GUI_DA_DUNG` hay 503 `DANG_XU_LY` thì không tính lượt; sau một trả lời 4xx khoá được xử lý như lần đầu nên CÓ tính lượt.
- **Luật 4xx:** trả lời 4xx của `POST /don` = chưa tạo đơn, chưa giữ / trừ ví. Trả lời 4xx của POST /don không giữ khoá gửi — gửi lại cùng khoa_gui được xử lý như lần đầu. TRỪ ba trường hợp (v10 sửa chữ cho khớp code, hành vi không đổi): 401 (token hỏng / hết hạn — đăng nhập lại), 409 `KHO_BAN` (chưa rõ — gửi lại CÙNG khoá), 409 `KHOA_GUI_DA_DUNG` (khoá đã dùng — có thể đã có đơn: mời khách xem Lịch sử đơn).
- **`khoa_gui`** (BẮT BUỘC): 16–64 ký tự `A-Z a-z 0-9 -`; mỗi lần khách bấm Đặt một khoá mới, gửi lại (mạng chập chờn, 5xx) dùng ĐÚNG khoá đó.
  Sai / thiếu → 400 `KHOA_GUI_SAI`. Cùng khoá + cùng giỏ (món, SL, ghi chú, mã, cách nhận, cách trả — `pin`, `tong_da_xem` không tính) trong 24 giờ
  → 200 đơn cũ, `trung: true` (không giữ ví lần hai); cùng khoá mà giỏ khác, hoặc quá 24 giờ → 409 `KHOA_GUI_DA_DUNG` (khoá nhớ theo khách).
  Hai yêu cầu cùng khoá đến cùng lúc, hoặc gửi lại khi lần đầu chưa xong (kể cả `vi` đang chốt) → một đơn; yêu cầu kia nhận 503 `DANG_XU_LY` — gửi lại cùng khoá sau 2 giây (lần đầu xong thì nhận
  đúng đơn đó). Vẫn `DANG_XU_LY` sau khoảng 1 phút → App mở `GET /don` xem đơn đã có chưa (đơn hiện ở đó khi đã trả, hoặc khi lần đặt đầu đã xong)
  rồi mới cho khách bấm Đặt lại (khoá mới) — máy chủ KHÔNG tự bỏ khoá đang xử lý. Lưới thứ hai: khoá KHÁC nhưng
  cùng giỏ, đơn trước còn `cho_tra`, trong 10 giây → trả đơn trước `trung: true`.
- **`tien_trinh`:** `cho_tra` (chờ tiền) · `da_tra` (đã trả, quán chưa làm) · `dang_lam` · `xong` · `da_huy` (khách huỷ, QR hết hạn chưa trả, hoặc đơn
  bị huỷ / hoàn). Đơn quầy: `xong` / `da_huy`. KH-MUA-2 thêm bước giao. `qr` chỉ có khi `cho_tra` (cùng mã lúc tạo), khác → `null`. QR hết hạn → `da_huy`,
  tiền ví đang giữ tự trả lại. Đơn App chưa có đơn thật: `trang_thai`, `thanh_toan` = `null`, `da_tra` = 0.
- **Huỷ** (`POST /don/:ma/huy`): chỉ đơn `cho_tra` → `da_huy`, nhả ví; đơn đã `da_huy` → 200 `da_huy`; đã trả → 400 `DA_TRA_GOI_QUAN` (khách gọi quán).
- **Tiền về muộn / lệch:** tiền QR về khi đơn đã `da_huy` (hoặc về đúng hạn mà đơn hỏng, vd hết hàng) → máy chủ KHÔNG tạo đơn, tự cộng số tiền đã về
  vào tài khoản khách (v11: `tien_ve_da_cong_vi` > 0, App hiện `thong_bao_tien_ve`); đơn hiện `da_huy` + `tien_ve_cho_doi_soat: true`. Tiền lệch số khi đơn còn `cho_tra` → không tạo đơn, `tien_ve_da_cong_vi`
  = 0 — App báo "Quán đã nhận tiền, nhân viên sẽ liên hệ" (quán xử lý qua Đối soát). Không có tiền về → `false`.
- Lỗi máy bất ngờ → 500 `LOI_MAY_CHU`; cổng QR (SePay / payOS) chưa cài → 503 `PAYOS_CHUA_CAU_HINH`; cổng QR lỗi → 502 `PAYOS_LOI` (gửi lại cùng khoá); kho bận → 409
  `KHO_BAN` (gửi lại cùng khoá). Lỗi khác của đơn → 400 `DON_KHONG_HOP_LE` (App hiện nguyên `error`).

### Ghi chú v3
- **Đăng ký 3 bước:** SĐT → mã → `ten` + `xung_ho` (BẮT BUỘC với khách mới) + `dia_chi` (tuỳ chọn). `xung_ho` ∈ `anh · chi · co · chu · bac · em ·
  ban` (sai → 400 `XUNG_HO_SAI`); `dia_chi` ≤ 300 ký tự sau khi cắt khoảng trắng (dài quá → 400 `DIA_CHI_QUA_DAI`; không phải chuỗi → 400
  `YEU_CAU_KHONG_HOP_LE`). Mã đúng mà còn thiếu thông tin → `CAN_TEN` và mã sống thêm 10 phút tính từ lúc đó (một lần) để khách điền.
  Các lỗi này chỉ trả khi mã đúng và SĐT chưa là khách; không tốn lượt thử mã. Khách đã có: `ten` / `xung_ho` / `dia_chi` gửi kèm bị bỏ qua.
- **Hồ sơ:** `xung_ho` / `dia_chi` = `null` khi chưa có. `dia_chi` là MỘT địa chỉ dùng chung với quầy (in trên hoá đơn) — sửa / xoá trên App thì
  quầy thấy theo. `PUT /toi`: trường nào có khoá trong thân thì sửa; thân không có khoá nào → 400 `YEU_CAU_KHONG_HOP_LE`; `ten` rỗng →
  `TEN_KHONG_HOP_LE`; `xung_ho` rỗng / sai → `XUNG_HO_SAI` (không xoá được xưng hô); `dia_chi: ""` hoặc `null` → xoá địa chỉ.
- **Tự gia hạn:** `POST /gia-han` cần token CÒN HẠN → token mới 30 ngày; `het_han` là giờ VN. App gọi khi mở app, tối đa 1 lần / ngày; máy chủ
  chặn > 10 lần / giờ mỗi khách (429 `QUA_NHIEU_LAN`). Token cũ KHÔNG bị thu hồi — vẫn dùng được tới hạn cũ (App thay bằng token mới). Không
  mở app 30 ngày → token hết hạn (401) → khách nhận mã lại.
- Giới hạn của `/menu` (không token) và `/gia-han` đếm trong bộ nhớ máy chủ: máy chủ khởi động lại thì đếm lại từ 0.

### Ghi chú v10 (HANG-1 — hạng thẻ có thứ bậc, gói, hạng chỉ cấp)
- `thu_bac`: số nguyên, lớn = cao. `/hang` xếp `thu_bac` tăng dần. `thu_tu` = `thu_bac` (giữ cho App cũ).
- `chi_cap`: `true` = hạng chỉ chủ quán cấp (không bán) — `goi` luôn `[]`, `gia_the` `null`.
- `goi[] { so_thang, gia }`: gói ĐANG BÁN ở quầy (bật + đã đặt giá; giá số đồng nguyên > 0), xếp theo `so_thang`. Gói chưa đặt giá / đang tắt không hiện.
  Mua thẻ trên App: v13 (xem "Ghi chú v13").
- `gia_the` (giữ MỘT đợt cho App cũ): giá gói ngắn nhất; `null` khi `chi_cap` hoặc chưa gói nào đang bán. App mới đọc `goi`.
- `/toi.khach.hang`: hạng có `thu_bac` CAO NHẤT còn hạn (hạng trên hết hạn mà hạng dưới còn → hạng dưới). `het_han` = `null` khi không thời hạn.
  `/menu` `gia_hang` theo cùng luật.

### Ghi chú các trường mới (v2)
- `hang` (của `/toi`): hạng khách ĐANG dùng được (còn hạn, kể cả sắp hết); hết hạn / chưa mua → `null`. `phan_tram` cho món thường,
  `phan_tram_nhom_dac_biet` cho món nhóm đặc biệt (đã kẹp 0–90). `het_han` là giờ VN.
- `so_du_vi`: số đồng KHẢ DỤNG của ví riêng khách = số dư − tiền đang giữ cho phiên thanh toán chưa xong (đúng số quầy hiện). Không cộng ví
  gia đình. Không có ví → 0.
- `gia_hang` (của `/menu`): giá MỘT ly theo từng hạng đang bật (`hang_id` = `id` của `/hang`) + hạng của chính khách nếu hạng đó đã tắt mà thẻ còn hạn (quầy vẫn giảm), máy chủ tính CÙNG hàm với quầy. Hạng 0 % →
  `gia` = giá gốc. Giá món không phải số > 0 → `[]`. Đơn có món đang giờ vàng thì quầy KHÔNG giảm hạng cho cả đơn — App hiện giá giờ vàng.
- **Giờ vàng:** `dang_chay` = đang trong khung VÀ có % VÀ có món (cùng điều kiện quầy giảm giá). Bật mà ngoài khung → `dang_chay: false`
  nhưng `bat_dau / ket_thuc` là khung hôm nay (khung qua nửa đêm đang chạy sau 00:00 thì `bat_dau` là hôm qua). `bat_dau`, `ket_thuc` là giờ
  Việt Nam dạng đầy đủ `YYYY-MM-DDTHH:mm:ss` (không hậu tố); khung qua nửa đêm (giờ kết thúc ≤ giờ bắt đầu, vd 22:00–02:00) thì `ket_thuc` là
  ngày HÔM SAU của `bat_dau`. Tắt / % = 0 / không có món → `bat_dau`,
  `ket_thuc` `null`, `phan_tram` 0, `mon` `[]`.
- **Giờ hoạt động:** `bay_gio` = giờ VN của máy chủ (App lấy "bây giờ" ở đây). `dang_mo` = quán đang mở THẬT theo lịch; `nhan_don` = còn nhận
  đơn App (đã trừ "ngừng nhận đơn trước giờ đóng N phút"; ca sau mở đúng lúc / trước khi ca này đóng VÀ đóng muộn hơn — vd chưa cài lịch — thì tính theo giờ đóng của cả chuỗi) — KH-MUA-1 chặn theo `nhan_don`. `hom_nay` = ca đang mở, không thì ca bắt đầu
  hôm nay; `dong` là giờ đóng thật (qua nửa đêm thì là ngày hôm sau; ca sau nối liền / chồng lên thì là giờ đóng của cả chuỗi — cùng mốc `nhan_don` dùng); chưa cài lịch / nghỉ → `null`. `mo_lai_luc` chỉ có khi `dang_mo:
  false`. `thong_bao` = câu ngoài giờ đã điền giờ mở lại (không tìm được giờ mở lại → điền `(chưa có lịch)`); đang mở → `''`. `thu` 2–7 = Thứ Hai–Thứ Bảy, 8 = Chủ nhật; `mo / dong` dạng
  `HH:mm`, `null` khi nghỉ hoặc chưa cài lịch. `ngay_nghi` chỉ gồm ngày từ hôm nay trở đi. Chưa cài gì → mở cả ngày, `thong_bao` rỗng.
  Quầy KHÔNG bị chặn theo giờ hoạt động.

## Mã lỗi
`KH_CHUA_CAU_HINH` 503 · `KH_TOKEN_SAI` 401 · `SDT_KHONG_HOP_LE` 400 · `QUA_NHIEU_LAN` 429 · `MA_SAI` 400 · `MA_HET_HAN` 400 · `CAN_TEN` 400 ·
`TEN_KHONG_HOP_LE` 400 · `XUNG_HO_SAI` 400 · `DIA_CHI_QUA_DAI` 400 · `KHONG_THAY_DON` 404 · `KHONG_TIM_THAY` 404 · `YEU_CAU_KHONG_HOP_LE` 400 · `LOI_MAY_CHU` 500 · `KHO_BAN` 409 ·
Ngày sinh (v9): `NGAY_SINH_SAI` 400 · `NGAY_SINH_DA_CO` 409.
`PUT /pin`: `PIN_KHONG_HOP_LE` 400 · `PIN_KHONG_KHOP` 400 · `PIN_DA_CO` 409 · `KHACH_KHONG_TON_TAI` 404.
Đặt đơn (v5): `CHUA_GIAO` 400 · `NGOAI_GIO` 400 · `QUA_GIO_NHAN_DON` 400 · `HET_HANG` 400 · `MON_KHONG_BAN` 400 · `KHOA_GUI_SAI` 400 ·
`KHOA_GUI_DA_DUNG` 409 · `DANG_XU_LY` 503 · `GIA_DA_DOI` 409 · `VI_KHONG_DU` 400 · `CACH_KHONG_KHOP` 400 · `CHUA_CO_PIN` 400 · `PIN_SAI` 400 ·
`PIN_DANG_KHOA` 423 · `DA_TRA_GOI_QUAN` 400 · `DON_KHONG_HOP_LE` 400 · `PAYOS_CHUA_CAU_HINH` 503 · `PAYOS_LOI` 502 · `QUA_NHIEU_LAN` 429 · `KHO_BAN` 409.
Mua thẻ (v13): `NHIEU_THE` 400 · `HANG_CHI_CAP` 400 · `GOI_HANG_KHONG_BAN` 400 · `DA_CO_HANG_CAO_HON` 400.
Trong `ma_giam_loi.code` của báo giá: `MA_KHONG_TON_TAI` · `MA_KHONG_AP_DUNG` · `MA_KHONG_CO_MON` · `MA_KHONG_LOI_HON`.
`nhan-ma-bill` / `nhan-diem` dùng hàm quầy, thêm các mã: `THIEU_MA` 400 · `MA_KHONG_TON_TAI` 404 · `MA_DA_DUNG` 409 · `UU_DAI_DANG_TAT` 400 ·
`SDT_DA_NHAN` 400 · `DON_FLASH_KHONG_DIEM` 400 · `CAU_HINH_DIEM_SAI` 400 · `CHUA_CAU_HINH_NHOM` 500 · `MA_KHONG_GAN_DON` 400 · `KHONG_THAY_DON` 404 ·
`DON_DA_HUY` 400 · `DON_DA_HOAN` 400 · `DON_KHONG_HOP_LE` 400 · `BILL_CHUA_THANH_TOAN` 400 · `BILL_SDT_KHAC` 400 · `NHANDIEM_DANG_TAT` 400 ·
`MA_DA_NHAN_DIEM` 400 · `TICH_DIEM_DANG_TAT` 400 · `DON_KHONG_DU_DIEM` 400 · `KHONG_THEM_DIEM` 400 · `MA_TRUNG` 409 (cùng `MA_HET_HAN`,
`SDT_KHONG_HOP_LE` ở trên). `MA_HET_HAN` của `nhan-ma-bill` ghi đúng số giờ của cài đặt hạn mã (bằng số giờ in trên bill).
Lỗi máy bất ngờ ở hai cửa này → 500 `LOI_MAY_CHU` như mọi cửa (không lộ lời máy). App hiện nguyên `error`.

## Đã hẹn (chưa có — ghi vào khi xong, tăng PHIEN_BAN)
- **v7 — ĐÃ HẸN, chủ quán chốt 02.11 (làm TRƯỚC khai trương). Tên dưới đây là tên CHỐT: máy POS làm ĐÚNG tên này; App KH được làm trước
  theo mục này. Mỗi việc POS xong thì chuyển phần của nó lên bảng cửa, tăng PHIEN_BAN, ghi nhật ký. Thiết kế: thiet_ke/THIET_KE_DOT2.md.**
  - QUA-1 — `/toi.khach` thêm `qua_chao_mung: { so_tien, het_han } | null` (chỉ khi còn hạn và còn tiền; đếm ngược theo `bay_gio` của
    `/gio-hoat-dong`). `so_du_vi` = số dư (tiền nạp + thưởng nạp) + quà chào mừng còn hạn — dùng được HẾT cho mọi đơn, không có đơn tối thiểu.
    Khi trả bằng tài khoản: trừ quà chào mừng TRƯỚC. "Thưởng nạp" KHÔNG có hạn và KHÔNG tách dòng trên App.
    App hiện ô "Số dư ví" = `so_du_vi`, dưới là dòng nhỏ "Trong đó Quà chào mừng … — còn …" khi `qua_chao_mung` khác `null` (chủ quán 02.11);
    KHÔNG có trường `so_du_nap` (App 02.11d bỏ đề nghị).
  - NAP-2 — `GET /goi-nap` (không token): `data[] { ma, tra, vao }` (gói đang bật). `POST /nap` (token): `{ ma_goi, khoa_gui }` → `phien { ma,
    qr { chuoi, het_han }, tien_trinh }`; luật 4xx / 5xx và khoá gửi y như `POST /don` (4xx = chưa tạo gì). `GET /nap/:ma` (token): đọc lại
    phiên (`tien_trinh`: `cho_tra` | `da_nap` | `het_han` | `huy`). Nạp xong → `so_du_vi` tăng. Mã lỗi: `GOI_NAP_KHONG_CO` 404,
    `QUA_NHIEU_LAN` 429, `PAYOS_CHUA_CAU_HINH` 503 (giữ tên).
  - NAP-2 — `GET /vi` (token): `?trang=N` (20 dòng / trang) → `trang, con_nua, data[] { ngay, loai, so_tien, thuong, ma_don, ghi_chu }`; `loai`:
    `nap` (`thuong` = phần thưởng nạp) · `tra_don` · `hoan_don` · `qua_chao_mung` · `qua_het_han` · `dieu_chinh`. `so_tien` có dấu (+ vào, − ra).
  - TOPPING-1 — `GET /ghi-chu-nhanh` (không token): `data[] { ma, chu }`; dòng giỏ của `POST /gio/bao-gia` và `POST /don` nhận `ghi_chu`
    (≤ 120 ký tự) — in lên phiếu pha chế, tem, hoá đơn.
- TOPPING-1: `/menu` thêm topping theo món + giá.
- Đánh giá Google: `loi-moi-danh-gia`, `su-kien`, cờ trên `/don` (tên cuối do POS chốt).

## Phần máy đọc
<!-- HOP_DONG_MAY_DOC -->
```json
{
  "phien_ban": 16,
  "goc": "/api/kh",
  "cua": [
    { "pt": "POST", "duong": "/dang-nhap/xin-ma", "token": false, "tra": ["lay_ma_tai_quay"] },
    { "pt": "POST", "duong": "/dang-nhap/xac-minh", "token": false, "tra": ["token", "khach.sdt", "khach.ten", "khach.ngay_tao", "khach.xung_ho", "khach.dia_chi", "khach.ngay_sinh"] },
    { "pt": "GET", "duong": "/hang", "token": false, "tra": ["data[].id", "data[].ten", "data[].phan_tram", "data[].phan_tram_nhom_dac_biet", "data[].chi_cap", "data[].goi[].so_thang", "data[].goi[].gia", "data[].thu_bac", "data[].gia_the", "data[].thu_tu", "data[].quyen_loi"] },
    { "pt": "GET", "duong": "/gio-vang", "token": false, "tra": ["dang_chay", "bat_dau", "ket_thuc", "phan_tram", "mon"] },
    { "pt": "GET", "duong": "/gio-hoat-dong", "token": false, "tra": ["bay_gio", "dang_mo", "nhan_don", "hom_nay", "mo_lai_luc", "thong_bao", "lich_tuan[].thu", "lich_tuan[].mo", "lich_tuan[].dong", "lich_tuan[].nghi", "ngay_nghi"] },
    { "pt": "GET", "duong": "/chuong-trinh", "token": false, "tra": ["data[].ma", "data[].ten", "data[].mo_ta", "data[].loai", "data[].dang_bat"] },
    { "pt": "GET", "duong": "/quang-cao", "token": false, "tra": ["bay_gio", "data[].id", "data[].chu_dai", "data[].tieu_de", "data[].phu", "data[].chu_nut", "data[].dich", "data[].ma_mon", "data[].tu_gio", "data[].den_gio", "data[].uu_tien"] },
    { "pt": "GET", "duong": "/toi", "token": true, "tra": ["khach.sdt", "khach.ten", "khach.ngay_tao", "khach.xung_ho", "khach.dia_chi", "khach.ngay_sinh", "khach.qr", "khach.hang.id", "khach.hang.ten", "khach.hang.phan_tram", "khach.hang.phan_tram_nhom_dac_biet", "khach.hang.het_han", "khach.so_du_vi"] },
    { "pt": "PUT", "duong": "/toi", "token": true, "tra": ["khach.sdt", "khach.ten", "khach.ngay_tao", "khach.xung_ho", "khach.dia_chi", "khach.ngay_sinh"] },
    { "pt": "POST", "duong": "/gia-han", "token": true, "tra": ["token", "het_han"] },
    { "pt": "GET", "duong": "/menu", "token": "tuy_chon", "tra": ["data[].ma", "data[].ten", "data[].nhom", "data[].gia", "data[].con_hang", "data[].ton_cu", "data[].ton_luc", "data[].gia_hang[].hang_id", "data[].gia_hang[].gia", "data[].nhu_cau", "data[].the_chat", "data[].mo_ta", "data[].cong_dung", "data[].thanh_phan", "data[].anh"] },
    { "pt": "GET", "duong": "/diem", "token": true, "tra": ["points", "history"] },
    { "pt": "GET", "duong": "/voucher", "token": true, "tra": ["data", "ma_khach_moi"] },
    { "pt": "GET", "duong": "/don", "token": true, "tra": ["trang", "con_nua", "data[].ma", "data[].so_hd", "data[].ngay", "data[].tong", "data[].da_tra", "data[].trang_thai", "data[].thanh_toan", "data[].tien_trinh", "data[].qr", "data[].tien_ve_cho_doi_soat", "data[].tien_ve_da_cong_vi", "data[].thong_bao_tien_ve", "data[].hoan_vao_tai_khoan", "data[].ly_do_huy", "data[].cach_tra", "data[].giu_vi", "data[].con_lai", "data[].kenh", "data[].cach_nhan", "data[].tra", "data[].so_mon", "data[].mon_dau", "data[].giam"] },
    { "pt": "GET", "duong": "/don/:ma", "token": true, "tra": ["don.ma", "don.so_hd", "don.ngay", "don.tong", "don.da_tra", "don.trang_thai", "don.thanh_toan", "don.tien_trinh", "don.qr", "don.tien_ve_cho_doi_soat", "don.tien_ve_da_cong_vi", "don.thong_bao_tien_ve", "don.hoan_vao_tai_khoan", "don.ly_do_huy", "don.mon[].ma", "don.mon[].ten", "don.mon[].so_luong", "don.mon[].don_gia", "don.mon[].thanh_tien", "don.mon[].ghi_chu", "don.cach_tra", "don.giu_vi", "don.con_lai", "don.kenh", "don.cach_nhan", "don.tra", "don.so_mon", "don.mon_dau", "don.giam", "don.hoa_don[].loai", "don.hoa_don[].trai", "don.hoa_don[].phai", "don.hoa_don[].dam", "don.hoa_don[].gach", "don.hoa_don[].ghi_chu"] },
    { "pt": "POST", "duong": "/nhan-ma-bill", "token": true, "tra": [] },
    { "pt": "POST", "duong": "/nhan-diem", "token": true, "tra": [] },
    { "pt": "PUT", "duong": "/pin", "token": true, "tra": [] },
    { "pt": "POST", "duong": "/gio/bao-gia", "token": true, "tra": ["dong[].ma", "dong[].so_luong", "dong[].don_gia", "dong[].thanh_tien", "tam_tinh", "giam[].loai", "giam[].so_tien", "phi_giao", "tong", "ma_giam_loi"] },
    { "pt": "POST", "duong": "/don", "token": true, "tra": ["ma_don", "so_hd", "tong", "giu_vi", "con_lai", "tien_trinh", "qr.chuoi", "qr.het_han", "trung"] },
    { "pt": "POST", "duong": "/don/:ma/huy", "token": true, "tra": ["ma_don", "tien_trinh"] }
  ],
  "ma_loi": ["KH_CHUA_CAU_HINH", "KH_TOKEN_SAI", "SDT_KHONG_HOP_LE", "QUA_NHIEU_LAN", "MA_SAI", "MA_HET_HAN", "CAN_TEN", "TEN_KHONG_HOP_LE", "XUNG_HO_SAI", "DIA_CHI_QUA_DAI",
    "KHONG_THAY_DON", "KHONG_TIM_THAY", "YEU_CAU_KHONG_HOP_LE", "LOI_MAY_CHU", "KHO_BAN",
    "PIN_KHONG_HOP_LE", "PIN_KHONG_KHOP", "PIN_DA_CO", "KHACH_KHONG_TON_TAI",
    "THIEU_MA", "MA_KHONG_TON_TAI", "MA_DA_DUNG", "UU_DAI_DANG_TAT", "SDT_DA_NHAN", "DON_FLASH_KHONG_DIEM", "CAU_HINH_DIEM_SAI", "CHUA_CAU_HINH_NHOM",
    "MA_KHONG_GAN_DON", "DON_DA_HUY", "DON_DA_HOAN", "DON_KHONG_HOP_LE", "BILL_CHUA_THANH_TOAN", "BILL_SDT_KHAC", "NHANDIEM_DANG_TAT", "MA_DA_NHAN_DIEM",
    "TICH_DIEM_DANG_TAT", "DON_KHONG_DU_DIEM", "KHONG_THEM_DIEM", "MA_TRUNG",
    "CHUA_GIAO", "NGOAI_GIO", "QUA_GIO_NHAN_DON", "HET_HANG", "MON_KHONG_BAN", "KHOA_GUI_SAI", "KHOA_GUI_DA_DUNG", "DANG_XU_LY", "GIA_DA_DOI",
    "VI_KHONG_DU", "CACH_KHONG_KHOP", "CHUA_CO_PIN", "PIN_SAI", "PIN_DANG_KHOA", "DA_TRA_GOI_QUAN", "PAYOS_CHUA_CAU_HINH", "PAYOS_LOI",
    "MA_KHONG_AP_DUNG", "MA_KHONG_CO_MON", "MA_KHONG_LOI_HON", "NGAY_SINH_SAI", "NGAY_SINH_DA_CO",
    "NHIEU_THE", "HANG_CHI_CAP", "GOI_HANG_KHONG_BAN", "DA_CO_HANG_CAO_HON"]
}
```
<!-- HET HOP_DONG_MAY_DOC -->

## Nhật ký
- v1 · 28.10.2026 · Bản đầu, ghi đúng code POS b1f8299 (chat App KH soạn, chat POS đặt vào kho). Chat POS đối chiếu code trước khi đặt:
  thêm 8 mã lỗi có thật của `nhan-ma-bill` / `nhan-diem` và dòng "Lỗi đã biết" (500 không `code`).
- v2 · 29.10.2026 · KH-API-2: thêm `GET /hang`, `GET /gio-vang`, `GET /gio-hoat-dong` (không cần token); `/toi` thêm `hang`, `so_du_vi`;
  `/menu` thêm `gia_hang`; thêm 12 mã lỗi có thật của `nhan-ma-bill` / `nhan-diem`; hạn `nhan-ma-bill` theo cài đặt hạn mã; bỏ dòng "Lỗi đã
  biết" (code đã trả `LOI_MAY_CHU`). Không đổi / xoá trường cũ — App v1 chạy nguyên. Bài thử `cong_cu/thu_HOPDONG_KH.js` canh từ bản này.
- v3 · 30.10.2026 · KH-API-3: `GET /menu` token KHÔNG bắt buộc (khối máy đọc `"token": "tuy_chon"`; không token ≤ 300 lần / phút / IP); xác minh
  nhận `xung_ho` (BẮT BUỘC với khách mới) + `dia_chi`, mã đúng + `CAN_TEN` sống thêm 10 phút một lần; `/toi`, `PUT /toi`, xác minh trả thêm
  `xung_ho`, `dia_chi`; `PUT /toi` sửa được `ten` / `xung_ho` / `dia_chi`; thêm `POST /gia-han`; mã lỗi `XUNG_HO_SAI`, `DIA_CHI_QUA_DAI`. Không
  xoá / đổi tên trường cũ. **Báo App KH:** App bản cũ (chỉ có ô Tên) KHÔNG tạo được khách MỚI nữa (luôn `CAN_TEN`) — App cần ô Cách xưng hô
  trước khai trương (chủ quán chốt 30.10); khách cũ trên App bản cũ vẫn đăng nhập, xem, sửa tên như trước. Chữ (chủ quán duyệt 30.10, không
  đổi code): Địa chỉ đổi sang `https://www.pos-tuquyduong.io.vn/api/kh`; mục Giờ vàng ghi rõ dạng giờ `bat_dau` / `ket_thuc` và khung qua nửa đêm.
- v4 · 31.10.2026 · KH-SP-1: `GET /menu` mỗi món thêm `nhu_cau[]`, `the_chat[]`, `mo_ta`, `cong_dung`, `thanh_phan`, `anh` (luôn `null`); danh sách mã nhu
  cầu / thể chất và giới hạn ký tự ghi ở "Ghi chú v4". Không xoá / đổi tên trường cũ — App v3 bỏ qua trường lạ là chạy nguyên.
- v5 · 31.10.2026 · KH-MUA-1: đặt đơn App nhận tại quán — thêm `POST /gio/bao-gia`, `POST /don`, `POST /don/:ma/huy`; `GET /don` thêm `tien_trinh`,
  `qr`, `tien_ve_cho_doi_soat` và gồm cả đơn App chưa trả; `GET /don/:ma` nhận mã đơn App, thêm `tien_trinh`, `qr`, `tien_ve_cho_doi_soat`, `mon[].ma`.
  Mã lỗi mới của đặt đơn (thay tên đã hẹn `NGOAI_GIO_HOAT_DONG` bằng `NGOAI_GIO` + `QUA_GIO_NHAN_DON`, đã báo App ở TRA_LOI_POS_31102026). Chủ quán
  duyệt 31.10: `tong_da_xem` + 409 `GIA_DA_DOI` kèm `bao_gia`; "Trả lời 4xx của POST /don không giữ khoá gửi — gửi lại cùng khoa_gui được xử lý như
  lần đầu." Không xoá / đổi tên trường cũ.
- v6 · 02.11.2026 · GIO-VN-1: giờ CŨ lưu theo giờ quốc tế / có dấu cách đã đổi sang giờ Việt Nam `YYYY-MM-DDTHH:mm:ss` (bước nâng cấp 012) và mọi
  chỗ ghi giờ của POS đều qua `getNow` — bỏ câu "Lỗi đã biết" ở mục Chung · Giờ. Không đổi cửa, không đổi trường.
- v7 · 03.11.2026 · HD-KH-1: `GET /don/:ma` thêm `hoa_don[]` (dòng tờ giao khách dựng bằng cùng hàm hoá đơn quầy; dòng `gio` của đơn App có `phai` rỗng — không lộ tên nhân viên); `GET /don/:ma` và mỗi đơn của `GET /don`
  thêm `cach_tra`, `giu_vi`, `con_lai` (đơn App; đơn quầy `null`). Không xoá / đổi tên trường cũ. Chuyển dòng HD-KH-1 từ "Đã hẹn" lên bảng cửa.
- v8 · 04.11.2026 · SEPAY-1: QR chuyển khoản đi qua SePay (POS tự dựng VietQR; `qr.chuoi` là chuỗi VietQR chuẩn NAPAS, vẽ như cũ), payOS giữ làm
  dự phòng bằng công tắc ở máy chủ. KHÔNG đổi trường, mã lỗi, HTTP: `PAYOS_CHUA_CAU_HINH` / `PAYOS_LOI` giữ tên, chỉ đổi câu `error` (bỏ chữ
  "payOS"). Với SePay gần như không còn 502 (tạo QR không gọi mạng). App không phải sửa gì.
- v9 · 04.11.2026 · CT-1a: `GET /chuong-trinh` (không token, thêm vào bảng cửa); `khach.ngay_sinh` ở `/toi`, `PUT /toi`, xác minh; `PUT /toi` nhận thêm `ngay_sinh`
  (MỘT lần). Mã lỗi mới `NGAY_SINH_SAI` 400, `NGAY_SINH_DA_CO` 409. Không xoá / đổi tên trường cũ — App v8 bỏ qua trường lạ là chạy nguyên. Hai dòng CT-1a
  đã chuyển khỏi "Đã hẹn".
- v10 · 05.11.2026 · HANG-1 (phần HANG-1 của "Đã hẹn — v7", đúng tên đã hẹn): `GET /hang` mỗi hạng thêm `chi_cap`, `goi[] { so_thang, gia }`, `thu_bac`;
  `gia_the` đổi nghĩa = giá gói ngắn nhất, `null` khi chỉ cấp / chưa gói nào bán (giữ một đợt); xếp theo `thu_bac`. `/toi.khach.hang` = hạng CAO NHẤT
  còn hạn, `het_han` `null` khi không thời hạn. Không xoá / đổi tên trường cũ. (Viết là v7 trên nhánh; chat gộp 05.11 đổi thành v10 sau v7 HD-KH-1 · v8 SEPAY-1 · v9 CT-1a.)
- v11 · 05.11.2026 · CK-NOIDUNG-1 (máy viết v10; chat gộp 05.11 đổi thành v11 sau v10 HANG-1): `GET /don`, `GET /don/:ma`, `POST /don` thêm
  `so_hd` (số hoá đơn POS `APP0016` / `HD0016` / mã cũ `012`, `null` khi đơn App chưa được cấp số) — `ma` / `ma_don` giữ nguyên; `GET /don`, `GET /don/:ma`
  thêm `tien_ve_da_cong_vi` (tiền về sau khi đơn App đã huỷ / hết hạn, hoặc đúng hạn mà đơn hỏng, được tự cộng vào tài khoản khách — chủ quán 05.11)
  và `thong_bao_tien_ve` (câu App hiện nguyên cho khách); câu "Luật 4xx" của `POST /don`
  sửa chữ cho khớp code (ngoại lệ 401, 409 `KHO_BAN`, 409 `KHOA_GUI_DA_DUNG` — yêu cầu App KH 05.11 mục 3), câu "Tiền về muộn" viết lại theo hành vi mới.
  Hoá đơn (`hoa_don[]`) đơn trả chuyển khoản có thêm dòng `loai: "ma_gd"` (mã giao dịch ngân hàng). Không xoá / đổi tên trường cũ — App v10 bỏ qua trường lạ là chạy nguyên.
- v12 · 07.11.2026 · KH-TOMTAT-1: `GET /don` (mỗi đơn) và `GET /don/:ma` thêm `kenh`, `cach_nhan`, `tra[] { cach, so_tien }`, `so_mon`, `mon_dau`, `giam` —
  tóm tắt đơn tính bằng CÙNG hàm với hoá đơn quầy (`dungThanhToan`, `tinhGiam` ở routes/hoaDon.js). Không xoá / đổi tên trường cũ — App v11 bỏ qua trường lạ là chạy nguyên.
- v13 · 09.11.2026 · KH-THE-1: mua thẻ hạng trên App — dòng `{ loai: "the", hang_id, so_thang }` trong `mon[]` của `POST /gio/bao-gia` / `POST /don`
  (chung giỏ với đồ uống, trả một lần); hạng lên ngay lúc đơn được ghi đã thu; `dong[]` / `mon[]` / `hoa_don[]` dòng thẻ có `loai: "the"`; giỏ không có đồ
  uống bán mọi giờ và đã thu là `xong`; `GET /hang` thêm `quyen_loi[]`; mã lỗi mới `NHIEU_THE`, `HANG_CHI_CAP`, `GOI_HANG_KHONG_BAN`, `DA_CO_HANG_CAO_HON`
  (mã quầy). Ghi bù phần NAP-1: đơn trả bằng ví vẫn có điểm; đơn nạp hiện trong `GET /don`, 0 điểm. Không xoá / đổi tên trường cũ — App v12 bỏ qua
  trường lạ là chạy nguyên (giỏ chỉ đồ uống băm khoá gửi y như cũ).
- v14 · 12.11.2026 · HUY-1 (máy viết v14; chat chỉnh số lúc gộp nếu có bản khác chen trước): `GET /don` (mỗi đơn) và `GET /don/:ma` thêm
  `hoan_vao_tai_khoan` (đơn `da_huy`: tiền đã hoàn vào tài khoản chính khách — quán huỷ đơn thì hoàn TOÀN BỘ số đã trả vào tài khoản) và `ly_do_huy`
  (nhãn ngắn lý do quán huỷ, không có ghi chú nội bộ). Không xoá / đổi tên trường cũ — App v13 bỏ qua trường lạ là chạy nguyên.
- v16 · 13.11.2026 · QC-APP-1 (máy viết v16 — v15 đã dành cho VOUCHER-2; chat chỉnh số lúc gộp nếu có bản khác chen trước): cửa mới `GET /quang-cao` (không token, chung trần
  lượt với `/menu`) — dải quảng cáo + banner Trang chủ do chủ quán gõ ở POS, lọc theo NGÀY hôm nay (giờ VN), khung giờ App tự so với `bay_gio`; dòng Giờ vàng tự động
  `id: "gio_vang"` khi quán bật công tắc; món đã tắt → `dich: "menu"`. Không có mã lỗi mới, không xoá / đổi tên trường cũ — App v14 không gọi cửa này là chạy nguyên.
