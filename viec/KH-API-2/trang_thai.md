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
- `PUT /api/pos/settings` ghi `updated_at = new Date().toISOString()` (giờ UTC, `server/routes/settings.js:109`) — trái luật giờ VN; thuộc GIO-VN-1.
- Hợp đồng v1 ghi "Lỗi đã biết: 500 không `code`" ở `nhan-ma-bill` / `nhan-diem` — code hiện tại ĐÃ trả `LOI_MAY_CHU` khi gọi từ App
  (`server/routes/signup-codes.js:318` và `:470`: `if (req.khach) return loiMayChu(...)`; `quaToken` ở `server/routes/kh/index.js:154`
  truyền `khach`). Dòng hợp đồng đã cũ; KH-API-2 chỉ khoá bằng ca thử + bỏ dòng.
- Hợp đồng v1 THIẾU 12 mã lỗi mà hai cửa trên trả thật (đếm `grep -o "code: '[A-Z_]*'" server/routes/signup-codes.js`):
  `NHANDIEM_DANG_TAT`, `MA_DA_NHAN_DIEM`, `BILL_CHUA_THANH_TOAN`, `BILL_SDT_KHAC`, `DON_DA_HUY`, `DON_DA_HOAN`, `DON_KHONG_DU_DIEM`,
  `DON_KHONG_HOP_LE`, `KHONG_THEM_DIEM`, `MA_KHONG_GAN_DON`, `TICH_DIEM_DANG_TAT`, `MA_TRUNG` (dòng 51–94 `kiemDonCuaMa` / `baoChiemHong` / `LOI_BILL_SDT_KHAC`, 156–252 `nhanDiemMaBill`, 404 `nhanMaUuDai`). Thêm vào v2 (H).
- Ba biểu thức "đang giờ vàng" khác nhau: `orders.js:511`, `Sales.jsx:147` (không xét `product_keys`), `/gio-vang` mới — Sales.jsx trong Cấm.
- Số giờ hạn mã trên bill `Number(c.nhandiem_han_gio) || 24` (`orders.js:1257`) khác `docCauHinhNhanDiem` (`signup-codes.js:127-131`) với giá trị âm (chỉ dữ liệu nhập tay).
