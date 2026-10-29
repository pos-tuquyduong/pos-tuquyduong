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
- **DỪNG chờ chủ quán** (Câu hỏi Q4).

## Câu hỏi
Q1–Q3 đã trả lời ở phiếu (`ab51a8a`). Không còn câu hỏi mở.

**Q4 — thêm `cong_cu/thu_KH1.js` vào `## Phạm vi` (bài cũ phải sửa 2 ca).** `thu_KH1.js` khoá cứng danh sách TRẮNG trường của App KH
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
