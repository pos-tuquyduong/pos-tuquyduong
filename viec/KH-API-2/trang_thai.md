# KH-API-2 — trạng thái

## Bước 1 — đối chiếu bản chụp (29.10.2026)
- Nhánh: `viec/KH-API-2`; cây sạch.
- HEAD `68cbe9d` · FETCH_HEAD `68cbe9d` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  68cbe9d PHIEU: KH-API-2
  988aee7 TIEN-DO: mo KH-API-2 + KHO-2a; KHO-2 tach KHO-2a / KHO-2b; lich xep lai theo tien do 29.10 — so v45
  feda0b0 TIEN-DO: UUDAI-1 (0a543cf), KHO-1 (65eb00d) xong; luat vong sua 4 + du lieu cu; quyet dinh khong co bill chua tra; HD-1 vong 4 — so v44
  ```

## Bước 1 (làm tiếp, 29.10.2026)
- Nhánh `viec/KH-API-2`; cây sạch. HEAD `ab51a8a` · FETCH_HEAD `ab51a8a` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  ab51a8a PHIEU: KH-API-2 duyet ke hoach 29.10 (Q1 a, Q2 so du kha dung, Q3 them nhan_don)
  9da2e9e KH-API-2: ke hoach (cho duyet) + trang thai buoc 1-3
  68cbe9d PHIEU: KH-API-2
  ```

## Tiến độ
- Bước 2 (đọc) xong. Bước 3: `ke_hoach.md` viết xong, đã soát bằng agent phụ — dừng chờ duyệt.
- 29.10: chủ quán duyệt (phiếu `ab51a8a`: Q1 (a), Q2 đồng ý, Q3 thêm `nhan_don`). Làm tiếp từ bước 4.
- Bước 4: `cong_cu/thu_KHAPI2.js` (8e5ebd7) + `cong_cu/thu_HOPDONG_KH.js` (676820d → 1803088) commit TRƯỚC khi vá, chạy trên gốc → ĐỎ
  (41 hỏng / 3 hỏng) — `bang_chung_do.txt`.
- Bước 5: vá máy chủ `c8e42ce`, hợp đồng v2 + bộ kiểm `85ed323`, giao diện + dist `69d2ce5`. Hai bài mới XANH (84 / 48 ca).
- Bước 6: `npm test -- --day-du` → PASS 79 · FAIL 1: `thu_KH1.js` E1 + E5 (bài CŨ, khoá cứng bộ trường `/toi` và `/menu`) — xem Câu hỏi.
  `node tu_chay/cong.js tinh . 68cbe9d^ HEAD viec/KH-API-2` → chỉ `✗ [A18]` (chưa có dot_bien.py — làm sau khi có trả lời) và `✗ [A19]`
  (bình thường ở bước này). Phạm vi sạch.
- **DỪNG chờ chủ quán** (Câu hỏi Q4). → Q4 ĐỒNG Ý (phiếu `b812b41`).

## Bước 1 (làm tiếp lần 2, 29.10.2026 — sau Q4)
- Nhánh `viec/KH-API-2`; cây sạch. HEAD `b812b41` · FETCH_HEAD `b812b41` — bằng nhau, không kéo (hook mở phiên đã kéo `68cbe9d → b812b41`).
- `git log --oneline -3`:
  ```
  b812b41 PHIEU: KH-API-2 Q4 dong y them thu_KH1.js vao Pham vi (chu quan 29.10)
  3acd603 KH-API-2: bang chung do + trang thai; cau hoi Q4 (them thu_KH1.js vao Pham vi)
  69d2ce5 KH-API-2: Cai dat — the Gio hoat dong (CaiDat/GioHoatDong.jsx) + build dist
  ```

## Tiến độ (sau Q4)
- Q4: sửa ĐÚNG 2 dòng `cong_cu/thu_KH1.js` (E1 `/toi` 6 trường, E5 `/menu` 8 khoá, vẫn so BẰNG) — `0091a2c`. Gốc ab51a8a: 155 đạt · 2 hỏng
  (E1, E5); đã vá: 157 · 0. Dòng số ca của `thu_KH1.js` (157) ghi trong `bang_chung_do.txt`.
- Bước 4 (đột biến): `viec/KH-API-2/dot_bien.py` (`80f3717`) — 30 đột biến, đối chứng XANH (api 84 · hd 48). Lần đầu: 29 BẮT · 1 SỐNG
  (`VS-HD-MA-LOI-NGOAI`: phép quét mã lỗi của `kh/index.js` chỉ đọc `bao(res, '…')`, bỏ sót mã viết trần `code: '…'` — K3). Siết bài
  `thu_HOPDONG_KH.js` (`a86f449`: quét cả `code: '…'`), chạy lại trên gốc → vẫn 39 đạt · 3 hỏng, đã vá 48 · 0 (A16, ghi `bang_chung_do.txt`).
  Lần hai: **TỔNG 30 · BẮT 30 · SỐNG 0 · HỎNG 0 · LẠC 0**.
- Bước 6: `npm test -- --day-du` lần đầu → PASS 80 · FAIL 0 · CẢNH BÁO 2 — một cảnh báo MỌC THÊM do chính việc này: E15 "chú thích trỏ số
  dòng cứng" bắt `server/utils/gioHoatDong.js:8` (`18:00–02:00` khớp dạng `:N–M`). Không nới phép (K8) — viết lại chú thích (`6b6ce93`).
  Lần hai → **PASS 81 · FAIL 0 · CẢNH BÁO 1** (còn `route GET có lệnh ghi` ở packages.js / products.js / sync.js — có từ trước, không phải file
  của việc này).

### Chỗ vá → đột biến (A17, A18)
| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| `giaHang.js` tiLeHangMon kẹp 0–90 | BV-GIAHANG-KEP | A1 95 → 90 |
| `giaHang.js` tiLeHangMon chọn % theo nhóm | VS-GIAHANG-NHOM-NGUOC | A1 thường |
| `giaHang.js` giaHangMon gọi tinhUuDai (không chép phép làm tròn) | VS-GIAHANG-TU-TINH-FLOOR | A2 |
| `giaHang.js` giaHangMon 0 % → giá gốc | VS-GIAHANG-KHONG-VE-GIA-GOC | A2 (45000, 0) |
| `giaHang.js` giaCacHang giá 0 / null → [] | BV-GIACACHANG-GIA-0 | E5 |
| `orders.js` gọi tiLeHangMon | BV-ORDERS-GIAHANG · VS-ORDERS-BO-NHOM | A5 · A3 tinh-thu |
| `kh/index.js` /toi hang | BV-TOI-HANG · VS-TOI-HANG-KHONG-XET-HET-HAN | B1 · B3 |
| `kh/index.js` /toi so_du_vi trừ tiền đang giữ | VS-TOI-SO-DU-KHONG-TRU-GIU | B5 |
| `kh/index.js` /hang (hạng đang bật, không cần đăng nhập) | VS-HANG-CA-HANG-TAT · VS-HANG-CAN-TOKEN | C1 |
| `kh/index.js` /gio-vang | VS-GIOVANG-BO-PERCENT · BV-GIOVANG-TAT | D4 · D3 |
| `kh/index.js` /menu gia_hang | BV-MENU-GIA-HANG · VS-MENU-BO-NHOM | A3 /menu |
| `kh/index.js` /gio-hoat-dong theo getNow | VS-GIOHD-GIO-MAY | F8 |
| `gioHoatDong.js` dangMo (qua nửa đêm, ngừng trước N phút, ngày nghỉ, chưa cài) | VS-GIOHD-QUA-NUA-DEM · VS-GIOHD-NGUNG-LE · BV-GIOHD-NGAY-NGHI · VS-GIOHD-CHUA-CAI-DONG | F2 · F5 · F3 · F6 |
| `gioHoatDong.js` kiemCaiDat + `settings.js` PUT chặn | BV-GIOHD-KIEM-PUT · VS-GIOHD-KIEM-N-AM · VS-GIOHD-KIEM-NGAY-SAI | F10 |
| `signup-codes.js` hạn mã theo cài đặt + lời báo | BV-HANMA-24 · VS-HANMA-LOI-CUNG | G2 |
| `HOP_DONG_API_KH.md` v2 + khớp code | VS-HD-ROUTE-NGOAI-HOP-DONG · VS-HD-MA-LOI-NGOAI · VS-HD-TOI-THIEU-TRUONG · BV-HD-PHIEN-BAN | I |

Tên đột biến (đủ 30): BV-GIAHANG-KEP, VS-GIAHANG-NHOM-NGUOC, VS-GIAHANG-TU-TINH-FLOOR, VS-GIAHANG-KHONG-VE-GIA-GOC, BV-GIACACHANG-GIA-0,
BV-ORDERS-GIAHANG, VS-ORDERS-BO-NHOM, BV-TOI-HANG, VS-TOI-HANG-KHONG-XET-HET-HAN, VS-TOI-SO-DU-KHONG-TRU-GIU, VS-HANG-CA-HANG-TAT,
VS-HANG-CAN-TOKEN, VS-GIOVANG-BO-PERCENT, BV-GIOVANG-TAT, BV-MENU-GIA-HANG, VS-MENU-BO-NHOM, VS-GIOHD-GIO-MAY, VS-GIOHD-QUA-NUA-DEM,
VS-GIOHD-NGUNG-LE, BV-GIOHD-NGAY-NGHI, VS-GIOHD-CHUA-CAI-DONG, BV-GIOHD-KIEM-PUT, VS-GIOHD-KIEM-N-AM, VS-GIOHD-KIEM-NGAY-SAI, BV-HANMA-24,
VS-HANMA-LOI-CUNG, VS-HD-ROUTE-NGOAI-HOP-DONG, VS-HD-MA-LOI-NGOAI, VS-HD-TOI-THIEU-TRUONG, BV-HD-PHIEN-BAN.

## Câu hỏi
Q1–Q3 đã trả lời ở phiếu (`ab51a8a`); Q4 ở phiếu `b812b41`. Không còn câu hỏi mở.

**Q4 (ĐÃ TRẢ LỜI: đồng ý) — thêm `cong_cu/thu_KH1.js` vào `## Phạm vi` (bài cũ phải sửa 2 ca).** `thu_KH1.js` khoá cứng danh sách TRẮNG trường của App KH
(chống lộ giá vốn / tồn thật): `cong_cu/thu_KH1.js:430` E1 `/toi` "đúng 4 trường ngay_tao · qr · sdt · ten" và `:516-517` E5 `/menu`
`KHOA = ['con_hang', 'gia', 'ma', 'nhom', 'ten', 'ton_cu', 'ton_luc']`. Phiếu B và E BẮT thêm `hang`, `so_du_vi` (/toi) và `gia_hang` (/menu)
→ hai ca này đỏ ngay khi làm đúng phiếu (K8: phép kiểm đúng — danh sách trắng phải được MỞ có chủ ý cho trường mới, không nới):
```
✗ bài chạy thật cong_cu/thu_KH1.js xanh (2.9 s)  → ✗ E1 GET /toi → 200, đúng 4 trường ngay_tao · qr · sdt · ten (P15-QR)  — HTTP 200 · hang,ngay_tao,qr,sdt,so_du_vi,ten | ✗ E5 mỗi món ĐÚNG bộ khoá danh sách trắng  — ma,ten,nhom,gia,con_hang,ton_cu,ton_luc,gia_hang
```
Đề xuất sửa (chỉ 2 dòng, vẫn là danh sách trắng ĐÚNG bằng — không đổi sang "có ít nhất"):
- `:430` → `'E1 GET /toi → 200, đúng 6 trường hang · ngay_tao · qr · sdt · so_du_vi · ten (P15-QR, KH-API-2)'`, so với
  `['hang', 'ngay_tao', 'qr', 'sdt', 'so_du_vi', 'ten']`;
- `:516` → `KHOA` thêm `'gia_hang'` (8 khoá).
Bài sửa ĐỎ trên gốc (gốc trả 4 / 7 khoá) → theo A11 KHÔNG cần mục `## Bài thử cũ sửa`; chỉ cần thêm dòng `- cong_cu/thu_KH1.js` vào
`## Phạm vi` của phiếu. Máy sẽ ghi `SỐ CA cong_cu/thu_KH1.js` vào `bang_chung_do.txt` (A16). Cổng `tinh` hiện chưa có ✗ Phạm vi nào (chưa
đụng file đó). Trả lời xong: `/lam-viec KH-API-2 tiep` — máy sửa 2 dòng, làm `dot_bien.py`, soát, báo cáo.

## Phát hiện
- Cài đặt làm tròn giá hạng (`tier_round_to`, `tier_round_mode` — `server/routes/tiers.js:27-34`, màn Cài đặt) được lưu nhưng KHÔNG nơi
  nào áp: `grep -rln "round_to\|tier_round" client/src server` chỉ ra Settings.jsx, database.js, tiers.js. Quầy tính giá hạng bằng
  `Math.round` tới đồng (`server/utils/uuDai.js:21`). Chủ quán chỉnh "làm tròn 500đ" sẽ không thấy gì đổi. Ngoài phạm vi — không sửa.
- `PUT /api/pos/settings` ghi `updated_at = new Date().toISOString()` (giờ UTC, `server/routes/settings.js:112`, HEAD sau vòng sửa 1) — trái
  luật giờ VN; thuộc GIO-VN-1.
- Hợp đồng v1 ghi "Lỗi đã biết: 500 không `code`" ở `nhan-ma-bill` / `nhan-diem` — code ĐÃ trả `LOI_MAY_CHU` khi gọi từ App
  (`server/routes/signup-codes.js:317` và `:471`: `if (req.khach) return loiMayChu(...)`; hàm chuyển yêu cầu ở `server/routes/kh/index.js:216`
  truyền `khach`). Dòng hợp đồng đã cũ; KH-API-2 chỉ khoá bằng ca thử + bỏ dòng. (Số dòng đọc lại ở HEAD vòng sửa 1 — soát lỗi 7.)
- Hợp đồng v1 THIẾU 12 mã lỗi mà hai cửa trên trả thật (đếm `grep -o "code: '[A-Z_]*'" server/routes/signup-codes.js`):
  `NHANDIEM_DANG_TAT`, `MA_DA_NHAN_DIEM`, `BILL_CHUA_THANH_TOAN`, `BILL_SDT_KHAC`, `DON_DA_HUY`, `DON_DA_HOAN`, `DON_KHONG_DU_DIEM`,
  `DON_KHONG_HOP_LE`, `KHONG_THEM_DIEM`, `MA_KHONG_GAN_DON`, `TICH_DIEM_DANG_TAT`, `MA_TRUNG` (dòng 51–94 `kiemDonCuaMa` / `baoChiemHong` / `LOI_BILL_SDT_KHAC`, 156–252 `nhanDiemMaBill`, 404 `nhanMaUuDai`). Thêm vào v2 (H).
- Ba biểu thức "đang giờ vàng" khác nhau: `orders.js:512`, `Sales.jsx:147` (không xét `product_keys`), `/gio-vang` (vòng sửa 1 đã khớp
  orders.js: có % VÀ có món) — Sales.jsx trong Cấm.
- Số giờ hạn mã trên bill `Number(c.nhandiem_han_gio) || 24` (`orders.js:1252`) khác `docCauHinhNhanDiem` (`signup-codes.js:119`) với giá trị
  âm (chỉ dữ liệu nhập tay).
- (vòng sửa 1) Câu báo ngoài giờ khi KHÔNG tìm được giờ mở lại (nghỉ cả tuần / nghỉ quá 400 ngày): máy điền `(chưa có lịch)` vào
  `{gio_mo_lai}` (`server/utils/gioHoatDong.js` hằng `CHUA_CO_LICH`) thay vì để câu cụt — chữ này chủ quán đổi được ở hằng số nếu muốn câu khác.
- (soát vòng 1, NGHI NGỜ) Lịch tuần không đặt được "mở 24 giờ" cho MỘT ngày (`mo === dong` bị chặn ở `loiNgayLich`); cách hiện có: bỏ chọn
  "Dùng lịch tuần" (mở cả ngày mọi ngày). Chủ quán cần thì mở việc sau.
- (soát vòng 1, NGHI NGỜ) `/toi` `hang.het_han` sẽ là chuỗi `"null"` nếu `pos_membership_purchases.expires_at` NULL — chưa có dữ liệu như vậy
  (chỗ ghi duy nhất `orders.js` luôn có hạn). Không sửa.
- `HOP_DONG_API_KH.md` dòng `DOC_TU_CODE` ghi nhánh, chưa có SHA: SHA chỉ chốt được khi gộp vào main — chat ghi khi gộp.
- Ngân sách bài thử: `thu_KHAPI2.js` 443 + `thu_HOPDONG_KH.js` 220 + `thu_KH1.js` 4 dòng đổi ≈ 667 dòng (phiếu ~450, chủ quán chấp nhận ~500)
  — vượt do vòng sửa 1 thêm ca soát yêu cầu (D6, D7, E6, F9, F12, G2 ngưỡng, J5, quét route). Máy chủ + giao diện 389 dòng thêm (ngân sách
  ~550).

## Soát vòng 1 (/ra-soat, agent độc lập, HEAD a585fec) — chép nguyên báo cáo
```
KHÔNG ĐẠT. Không thấy lỗi NẶNG nào: không lỗi đụng tiền, điểm hay ví, không lộ thông tin, không file ngoài Phạm vi. Còn 4 lỗi hành vi mức
NHẸ và vài chỗ bài thử còn hở, nên theo LUAT_XAY_APP §6.5 làm được trong một vòng sửa, không cần hỏi chủ quán.

Đã chạy lại (HEAD a585fec): thu_KHAPI2 84 đạt · 0 hỏng; --day-du PASS 81 · FAIL 0 · CẢNH BÁO 1 (có từ trước), "dist đã commit KHỚP với
src"; dot_bien.py TỔNG 30 · BẮT 30 · SỐNG 0, đối chứng xanh; cong.js tinh chỉ đỏ A19.

LỖI TÌM ĐƯỢC:
1. client/src/pages/CaiDat/GioHoatDong.jsx:34 và :46-51 — Mất cài đặt khi tải lỗi: tai() lỗi thì form vẫn để mặc định; bấm Lưu gửi đủ 4
   khoá gio_hd_* và xoá lịch, ngày nghỉ, câu báo đã lưu. InvoiceSettings.jsx:364 có cách chặn ("boIn null = chưa nạp được → KHÔNG gửi
   khoá này"). K4/K5 — NHẸ.
2. server/utils/gioHoatDong.js:74 với :100 — Chưa cài lịch: ca 00:00 → 00:00 hôm sau; N > 0 thì mỗi tối nhan_don false từ 23:(60−N) tới
   24:00 trong khi dang_mo true, hợp đồng hứa "mở cả ngày". KH-MUA-1 sẽ chặn oan. Lịch mở 00:00 nối tiếp ca đóng 00:00 hôm trước cũng bị
   cắt sai. Không ca thử "chưa cài lịch + N > 0". K5/K3 — NHẸ.
3. server/routes/kh/index.js:43 (/menu hangDangBat chỉ is_active = 1) lệch :46-49 (/toi không lọc is_active, giống orders.js:651). Hạng
   xoá mềm (tiers.js:100) mà khách còn thẻ: quầy vẫn giảm, /toi trả hang.id, /menu không có gia_hang cho hạng đó. Hai vị từ "hạng" (K4,
   BAN-HANG-1) — NHẸ.
4. server/routes/kh/index.js:101 với :106 — /gio-vang hai vị từ: bat không xét product_keys, dang_chay có. Bật, có %, món rỗng → phan_tram
   20, có giờ, mon [], dang_chay false mãi. K4 — NHẸ.
5. server/utils/gioHoatDong.js:103 — mo_lai_luc null → câu mặc định cụt "Quán đang nghỉ — mở lại lúc ". J5 dựng đúng tình huống mà không
   kiểm câu. NHẸ.
6. Bài thử còn hở (K3) — NHẸ: /gio-vang nhánh qua nửa đêm (kh/index.js:104) chỉ chạy khi bài chạy 00:00–00:59, không ca tất định, không
   đột biến; G2 (thu_KHAPI2.js:343-352) chỉ 30 giờ và 49 giờ, thiếu ca ngay trên / ngay dưới 48 giờ; phép quét route thu_HOPDONG_KH.js:93
   chỉ bắt router.(get|post|put|delete|patch)('…' nháy đơn, bỏ sót router.all / router.route / router.use('/x') / nháy kép / backtick, đầu
   file không ghi giới hạn (K4 TU-CHAY-6).
7. K1 — NHẸ: Phát hiện trong trang_thai.md ghi số dòng gốc đã trôi (orders.js:1257 → 1252; signup-codes.js:318/:470 → 317/471;
   kh/index.js:154 → 213; signup-codes.js:127-131 → 126-130); HOP_DONG_API_KH.md:6 DOC_TU_CODE không có SHA như v1; GioHoatDong.jsx ghi
   "chỉ đặt đơn trong giờ" — hứa trước điều KH-MUA-1 mới làm.
8. Chưa gọn — NHẸ: kh/index.js:204 `const [mon, dsHang] = [await …, await …]` trông song song mà chạy lần lượt; gioHoatDong.js:24 congPhut
   thật ra TRỪ phút → truPhut; kh/index.js:54 Math.round thừa (wallets.js:48 không làm tròn); ngân sách bài thử 624 dòng vượt ~500.

K3: hai bài mới ĐỎ trên gốc; phần lớn kiểm hành vi thật; A5 là soi chữ nhưng VS-ORDERS-BO-NHOM bị A3 bắt bằng hành vi; G1/G3 xanh trên gốc
có chủ ý. K4: % hạng chỉ quyết ở orders.js:658 (tinh-thu, payOS qua taoDon); hạn mã 3 chỗ (signup-codes.js:177, :361 docCauHinhNhanDiem;
orders.js:1252 `|| 24` phiếu cho để lại); 16 route khớp hợp đồng; chưa xử lý lỗi 3, 4. K5: kiemCaiDat chỉ xét gio_hd_*; F11 khoá; J5 quầy
không bị chặn; hạn mặc định 24 giờ khoá ở thu_KH1.js:764; luồng sẽ bị chặn oan: lỗi 2. Đường tiền: không trường tiền từ client; gia_hang
= tinhUuDai(...).gia_hang[0] ?? gia (A3 so đơn thật); so_du_vi = balance − dangGiu = kha_dung wallets.js:48; SĐT từ req.khach.phone, B6;
/hang không giá vốn. P1: dist KHỚP. Đơn giản: máy chủ ~230 (350), giao diện 134 (200), orders.js 9 dòng (≤ 15).

NGHI NGỜ: kh/index.js:49 expires_at NULL → het_han "null" (chưa thấy dữ liệu, orders.js:1088 luôn có hạn); lịch tuần không đặt được "mở
24 giờ" một ngày (mo === dong bị chặn gioHoatDong.js:33); thu_HOPDONG_KH.js:156 dựng dữ liệu bằng datetime('now', '+7 hours', …) (chỉ bài
thử); InvoicePreview.jsx:716 câu dự phòng viết cứng "24h".

NGHIỆM THU: 10/10 mục có bằng chứng (A: A1–A5 + thu_UUDAI1/thu_P26c/thu_gia_lap; B: B1–B7; C: C1; D: D1–D5 (qua nửa đêm chưa tất định);
E: E1–E5; F: F1–F11 TZ=UTC, giao diện chỉ build + so băm; G: G1–G3 (ngưỡng lỏng); H: thu_HOPDONG_KH + BV-HD-PHIEN-BAN; I: 48 ca, ghép
kiem_tra_truoc_khi_giao.js:495; J: J2, J3, J5, J6, thu_KH1 157 ca, thu_UUDAI1).

CHƯA SOÁT ĐƯỢC: giao diện trên điện thoại thật; seed INSERT OR IGNORE trên Turso; cong.js chay chưa chạy; trang_thai.md thiếu CHƯA KIỂM,
1–3 thao tác thử tay, HEAD ĐÃ KIỂM (bước 11).

BÀI HỌC: KHOÁ (bài thử): ca "chưa cài lịch + N > 0 → nhan_don true lúc 23:59"; ca giờ vàng qua nửa đêm giờ cố định; ca ngưỡng hạn mã
hanGio ± 1 phút; ca hạng is_active = 0 mà khách còn hạn → /menu vẫn có giá hạng đó. KHOÁ (người gác): phép quét route thu_HOPDONG_KH bắt
thêm router.all / router.route / router.use('/…' và mọi kiểu nháy. NGUYÊN TẮC (K5): màn Cài đặt gửi một nhóm khoá phải chặn Lưu khi chưa
nạp được (khuôn boIn null của InvoiceSettings). NGUYÊN TẮC (K4): một khái niệm chỉ MỘT vị từ trong cùng file — so cả bộ lọc (is_active,
product_keys). NGUYÊN TẮC (K3): ca có nhánh phụ thuộc giờ phải dựng giờ cố định.
```

## Vòng sửa 1 (theo soát vòng 1 — mọi lỗi NHẸ)
Bài thử thêm ca TRƯỚC (`81372a1`, `7b9b819`), chạy trên code chưa sửa → 8 ca đỏ (ghi `bang_chung_do.txt`), rồi sửa:
| Lỗi soát | Sửa | Ca | Đột biến |
|---|---|---|---|
| 1 Lưu khi tải lỗi xoá cài đặt | `GioHoatDong.jsx`: `taiLoi` → nút Lưu tắt + `luu` thoát sớm (khuôn `boIn null` InvoiceSettings) | — (giao diện, CHƯA KIỂM bằng máy) | — |
| 2 nhan_don cắt oan mỗi nửa đêm | `gioHoatDong.js` `dongThat`: nối ca hôm sau mở đúng lúc ca này đóng; `nhan_don` theo giờ đóng thật | F12 ×4 | BV-GIOHD-DONG-THAT · VS-GIOHD-DONG-THAT-CHI-KHI-CHUA-CAI · VS-GIOHD-NGUNG-LE (neo mới) |
| 3 /menu thiếu hạng đã tắt của khách | `kh/index.js` `theCuaKhach` dùng chung /toi và /menu; /menu thêm hạng của khách nếu đã tắt | E6 (so với tier_unit_price quầy) | BV-MENU-HANG-TAT |
| 4 /gio-vang hai vị từ | MỘT `bat` (có % VÀ có món, như orders.js F2); `dang_chay = bat && is_flash_now` | D6 | BV-GIOVANG-KHONG-MON · VS-GIOVANG-BO-PERCENT (neo mới) |
| 5 câu báo cụt | `CHUA_CO_LICH` điền khi không có giờ mở lại | F9, J5 | BV-GIOHD-CHUA-CO-LICH |
| 6 bài hở | khung giờ vàng → hàm thuần `khungHangNgay` + ca giờ cố định; G2 47:59 / 48:01; quét route mọi `router.<x>(`, mọi nháy, đường biến → ĐỎ, ghi giới hạn đầu file | D7 ×2, G2 ngưỡng, I4 | VS-GIOVANG-KHUNG-QUA-DEM · BV-GIOVANG-KHUNG-ROUTE · VS-HANMA-LECH-1-GIO · VS-HD-ROUTE-ALL-NHAY-KEP · VS-HD-ROUTE-DUONG-BIEN |
| 7 K1 | Phát hiện ghi lại số dòng ở HEAD; bỏ câu "chỉ đặt đơn trong giờ"; DOC_TU_CODE → Phát hiện | — | — |
| 8 chưa gọn | `Promise.all` ở /menu; `congPhut` → `truPhut`; bỏ `Math.round` ở soDuVi; bỏ export `congNgay`, `khungGio` không ai dùng; ngân sách → Phát hiện | (B5 vẫn kiểm số nguyên) | — |
Hợp đồng: ghi rõ `gia_hang` có hạng đã tắt của chính khách, giờ vàng "không có món" như tắt, `nhan_don` theo chuỗi ca nối, `(chưa có lịch)`.
Kết quả: `thu_KHAPI2.js` 95 · 0; `thu_HOPDONG_KH.js` 49 · 0; `dot_bien.py` **TỔNG 40 · BẮT 40 · SỐNG 0 · HỎNG 0 · LẠC 0** (đối chứng xanh);
`npm test -- --day-du` PASS 81 · FAIL 0 · CẢNH BÁO 1 (có từ trước), "dist đã commit KHỚP với src hiện tại".
Tên đột biến thêm ở vòng sửa 1 (đủ 10): BV-GIOVANG-KHONG-MON, VS-GIOVANG-KHUNG-QUA-DEM, BV-GIOVANG-KHUNG-ROUTE, BV-MENU-HANG-TAT, BV-GIOHD-DONG-THAT,
VS-GIOHD-DONG-THAT-CHI-KHI-CHUA-CAI, BV-GIOHD-CHUA-CO-LICH, VS-HANMA-LECH-1-GIO, VS-HD-ROUTE-ALL-NHAY-KEP, VS-HD-ROUTE-DUONG-BIEN.
