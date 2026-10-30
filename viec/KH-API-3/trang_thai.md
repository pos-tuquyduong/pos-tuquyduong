# KH-API-3 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: `viec/KH-API-3`; cây sạch. HEAD `55a8f29` · FETCH_HEAD `55a8f29` (bằng nhau — không kéo).
- `git log --oneline -3`:
  - 55a8f29 PHIEU: KH-API-3
  - 7a3930f TIEN-DO: KH-API-2 (6f2c30b) xong; mo KH-API-3; them KHACH-CK-1; quyet dinh 29-30.10; luat noi de hieu + duyet 2 luot; tu-chay 1.8.1 (KHUNG-KEO-1) — so v47
  - 6f2c30b Merge pull request #51 from pos-tuquyduong/viec/KH-API-2
- Phiên tiếp (sau duyệt): HEAD `236b3dc` = FETCH_HEAD `236b3dc` — không kéo.
- Phiên tiếp 30.10 (sau khi chat sửa phiếu): hook mở phiên kéo 55a8f29 → 628fce8; HEAD `628fce8` = FETCH_HEAD `628fce8`, cây sạch — không kéo.
  - 628fce8 PHIEU: KH-API-3 tra loi cau hoi 30.10 (Pham vi + Bai thu cu sua + 003 khi thieu bang)
  - 1930351 GOP-KH-API-3 gop main c8edb66 (chat 30.10, truoc khi may lam tiep)
  - c8edb66 Merge pull request #53 from pos-tuquyduong/viec/KHO-2a

## Tiến độ
- Bước 3: kế hoạch duyệt 30.10 (chủ quán: câu 1 đồng ý thêm `thu_KHUI1.js`, `thu_P15QR.js` vào Phạm vi; câu 2 xưng hô bắt buộc với khách mới;
  câu 3 một địa chỉ chung quầy ↔ App).
- Bước 4–6: bài thử đỏ trên gốc (`bang_chung_do.txt`), code vá, `thu_KHAPI3.js` 58/58, `thu_KH1.js` 157/157, `thu_HOPDONG_KH.js` 67/67,
  đột biến 28/28 BẮT. `npm test` / `--day-du`: xanh trừ `cong_cu/thu_KHO1.js` (ngoài Phạm vi — Câu hỏi 1).
- (Số trên là của lần đầu. HIỆN TẠI sau vòng sửa 2: `thu_KHAPI3.js` 67/67, `thu_KHUI1.js` 41/41, `thu_P15QR.js` 29/29, đột biến 38/38 BẮT,
  `npm test -- --day-du` PASS 86 · FAIL 0 — xem `## Vòng sửa 2` và báo cáo 7 mục CUỐI file.)

## Phiên tiếp 30.10 (phiếu đã sửa: Phạm vi + `## Bài thử cũ sửa` + 003 khi thiếu bảng)
- Sau gộp main: `npm test` đỏ đúng một chỗ — `thu_KHO2a.js` E6b (`003_xung_ho_khach: no such table: pos_customers`). `thu_KHO1.js` xanh (KHO-2a đã sửa).
- `cong_cu/thu_KHAPI3.js` thêm C4b (kho chỉ bảng kho → nâng cấp chạy hết, ghi đủ mọi bước theo DANH SÁCH FILE thật, không tự tạo bảng khách) —
  đỏ trên HEAD chưa vá và trên gốc; `server/nang_cap/003_xung_ho_khach.js` bỏ qua khi chưa có bảng (chú thích lý do trong file) → 63/63.
- `cong_cu/thu_KHUI1.js` H3 (menu không token → 200, /toi không token → 401) và `cong_cu/thu_P15QR.js` A6 (lưu đúng xung_ho): đỏ trên gốc, xanh
  trên HEAD (41/41, 29/29). Thêm `res.setEncoding('utf8')` trong `goi` của `thu_KHUI1.js`: H2f đỏ oan trên HEAD vì dist mới có chữ nhiều byte rơi
  đúng ranh giới mẩu (`than += d` cắt đôi ký tự) — K2, truy nguyên rồi mới sửa.
- Đột biến 34/34 BẮT, đối chứng XANH. `npm test -- --day-du`: PASS 86 · FAIL 0 · CẢNH BÁO 1 (`GET có lệnh ghi` packages.js / products.js /
  sync.js — có từ trước, ngoài Phạm vi).

## Chỗ vá → đột biến (`viec/KH-API-3/dot_bien.py`)
| Chỗ vá | Đột biến |
|---|---|
| `/menu` đứng trước xacThucKhach với `tuyChonKhach` | BV-MENU-BAT-DANG-NHAP, VS-MENU-NUOT-MA-SAI |
| giới hạn menu không token (`giuLuotMenu`, `giuLuotBoNho`) | BV-MENU-GIOI-HAN, VS-MENU-TRAN-301, VS-MENU-DEM-CA-CO-DANG-NHAP, VS-CUA-SO-LECH, VS-TRAN-LECH |
| CAN_TEN khi thiếu xưng hô | BV-XUNG-HO-CAN-TEN |
| `chuanXungHo` / `XUNG_HO` | VS-XUNG-HO-LA, VS-XUNG-HO-THIEU-BAN |
| `chuanDiaChi` | VS-DIA-CHI-300, VS-DIA-CHI-KHONG-CAT, VS-PUT-DIA-CHI-KHONG-XOA |
| INSERT khách lưu xưng hô + địa chỉ | BV-INSERT-XUNG-HO |
| mã sống thêm 10 phút một lần khi CAN_TEN | BV-GIA-HAN-MA, VS-GIA-HAN-11-PHUT, VS-GIA-HAN-MA-MAI |
| chỉ kiểm thông tin khi tạo khách mới | VS-KIEM-CA-KHACH-CU |
| `PUT /toi` ba trường | VS-PUT-RONG, VS-PUT-XUNG-HO-RONG-XOA |
| `hoSo` thêm trường | BV-HOSO-XUNG-HO |
| bước nâng cấp 003 | BV-NANG-CAP-003 |
| trần cứng bộ đếm (vòng sửa 1) | BV-BO-DEM-TRAN, VS-BO-DEM-XOA-SOM |
| `chuanDiaChi` sai kiểu / null (vòng sửa 1) | BV-DIA-CHI-KIEU, VS-DIA-CHI-NULL-KHONG-XOA |
| cửa sổ phút / giờ trong `GIOI_HAN`, hàm bọc nhận `luc` (vòng sửa 2) | VS-MENU-CUA-SO-GIO, VS-GIA-HAN-CUA-SO-PHUT |
| `tuyChonKhach`: tiêu đề rỗng = CÓ gửi (khoá hồi quy, vòng sửa 2) | VS-AUTH-RONG-LA-KHONG-TOKEN |
| `chuanDiaChi` chuẩn NFC (khoá hồi quy, vòng sửa 2) | VS-DIA-CHI-KHONG-NFC |
| 003 bỏ qua khi chưa có bảng `pos_customers` (thu_KHO2a E6b) | BV-003-KIEM-BANG, VS-003-SAI-TEN-BANG |
| `POST /gia-han` + trần | BV-GIA-HAN-TRAN, VS-GIA-HAN-UTC, VS-GIA-HAN-BANG-LAN-THU |
| hợp đồng v3 + bài thử hợp đồng | BV-HOPDONG-TUY-CHON, VS-HOPDONG-GIA-TRI-LA, BV-HOPDONG-GIA-HAN |

Mọi tên đột biến: BV-MENU-BAT-DANG-NHAP · VS-MENU-NUOT-MA-SAI · BV-MENU-GIOI-HAN · VS-MENU-TRAN-301 · VS-MENU-DEM-CA-CO-DANG-NHAP · VS-CUA-SO-LECH ·
VS-TRAN-LECH · VS-MENU-CUA-SO-GIO · VS-AUTH-RONG-LA-KHONG-TOKEN · BV-BO-DEM-TRAN · VS-BO-DEM-XOA-SOM · BV-DIA-CHI-KIEU · VS-DIA-CHI-NULL-KHONG-XOA ·
VS-DIA-CHI-KHONG-NFC · BV-XUNG-HO-CAN-TEN · VS-XUNG-HO-LA · VS-XUNG-HO-THIEU-BAN · VS-DIA-CHI-300 · VS-DIA-CHI-KHONG-CAT · BV-INSERT-XUNG-HO · BV-GIA-HAN-MA ·
VS-GIA-HAN-11-PHUT · VS-GIA-HAN-MA-MAI · VS-KIEM-CA-KHACH-CU · VS-PUT-RONG · VS-PUT-DIA-CHI-KHONG-XOA · VS-PUT-XUNG-HO-RONG-XOA · BV-HOSO-XUNG-HO ·
BV-NANG-CAP-003 · BV-003-KIEM-BANG · VS-003-SAI-TEN-BANG · VS-GIA-HAN-CUA-SO-PHUT · BV-GIA-HAN-TRAN · VS-GIA-HAN-UTC · VS-GIA-HAN-BANG-LAN-THU · BV-HOPDONG-TUY-CHON · VS-HOPDONG-GIA-TRI-LA · BV-HOPDONG-GIA-HAN

Lần chạy đầu: 27/28 BẮT — VS-KIEM-CA-KHACH-CU SỐNG vì chính đột biến viết sai (vẫn giữ `if (sai) return sai;` trong khối khách mới → hành vi
không đổi). Sửa đột biến (83b28af) → BẮT. Không đổi bài thử.

## Câu hỏi — ĐÃ TRẢ LỜI (chat sửa phiếu 628fce8, 30.10; `thu_KHO1.js` không cần sửa sau khi gộp KHO-2a). Giữ lại làm lịch sử.
Chủ quán đã duyệt thêm hai file vào Phạm vi nhưng phiếu chưa ghi, nên máy không sửa được. Nhờ chat sửa `viec/KH-API-3/phieu.md`:
1. Thêm vào `## Phạm vi`:
   - `cong_cu/thu_KHUI1.js` (đã duyệt — ca H3 "menu không token → 401" thành "/toi không token → 401" + "menu không token → 200")
   - `cong_cu/thu_P15QR.js` (đã duyệt — ca A6 tạo khách mới qua App gửi thêm `xung_ho`)
   - **`cong_cu/thu_KHO1.js` (MỚI phát hiện)** — ca B1 / B2 khoá ĐÚNG danh sách bước nâng cấp (`nc1.length === 1`, `dem('pos_nang_cap') === 1`,
     dòng 246, 248). Bước 003 của việc này làm hai ca đỏ, và bài này nằm trong `npm test` → bộ kiểm + cổng đỏ tới khi sửa. Sửa đúng hai dòng
     danh sách (LUAT §6 mục 7): bước 1 = `001_kho` VÀ có bước 3 = `003_xung_ho_khach`, số dòng = 2 (vẫn so BẰNG). KHO-2a (bước 002) sẽ gặp
     đúng chỗ này.
2. Thêm mục:
   ```
   ## Bài thử cũ sửa
   - cong_cu/thu_HOPDONG_KH.js — hiểu token "tuy_chon" + xác minh gửi xung_ho; xanh trên gốc vì hợp đồng v2 không có cửa tuy_chon
   - cong_cu/thu_KHUI1.js — ca H3 đổi theo hành vi /menu mới (chủ quán duyệt 30.10)
   - cong_cu/thu_P15QR.js — khách mới qua App gửi thêm xung_ho (chủ quán duyệt 30.10)
   ```
   (`thu_HOPDONG_KH.js` chạy trên gốc 64 đạt · 0 hỏng — cổng A11 cần dòng này.)
Sửa phiếu xong → `/lam-viec KH-API-3 tiep`: máy sửa ba bài, ghi `SỐ CA`, chạy lại bộ kiểm + cổng.

## Phát hiện
- `cong_cu/thu_KHUI1.js`, `cong_cu/thu_P15QR.js` không nằm trong danh sách chạy `kiem_tra_truoc_khi_giao.js:495`.
- `/api/kh/hang`, `/gio-vang`, `/gio-hoat-dong` mở không token, không giới hạn lượt (`server/routes/kh/index.js`) — phiếu không giao.
- Số tầng proxy Render chưa kiểm (`server/index.js:55`) — giới hạn theo IP của `/menu` phụ thuộc điều này.
- `cong_cu/thu_KHO1.js:246,248` khoá cứng "chỉ có bước 1" — mọi bước nâng cấp mới (KHO-2a 002, việc này 003) đều làm nó đỏ.
- Phiếu mục F ghi "App bản đang dùng (v2) không vỡ" — lệch quyết định 2 của chủ quán (30.10: xưng hô bắt buộc → App v2 không tạo được khách
  MỚI). Code làm theo quyết định; nhờ chat ghi lại phiếu / sổ quyết định cho khớp.
- `kiem_tra_truoc_khi_giao.js:495` thiếu dấu cách trước `'cong_cu/thu_P3.js'` (có từ trước, chỉ là hình thức — không sửa).

## Soát độc lập (/ra-soat) — vòng 1, báo cáo nguyên văn
```
KHÔNG ĐẠT (chỉ có lỗi NHẸ: không đụng tiền, điểm, ví, không lộ dữ liệu. Phải sửa 3 chỗ dưới và cho bộ kiểm xanh mới giao được.)

LỖI TÌM ĐƯỢC:
- server/utils/maKhach.js:61 và HOP_DONG_API_KH.md (Ghi chú v3, "dia_chi … không phải chuỗi → 400 YEU_CAU_KHONG_HOP_LE") — nhánh
  typeof v !== 'string' không có ca thử, không có đột biến. Gỡ dòng 61 thì v.normalize ném lỗi, cửa trả 500 thay vì 400, mà thu_KHAPI3.js
  vẫn xanh. Hợp đồng hứa một hành vi không có khoá — K3.
- HOP_DONG_API_KH.md (Ghi chú v3, "dia_chi: "" hoặc null → xoá địa chỉ") — chỉ ca "" được thử. Ca null chưa có — K3/K4.
- server/utils/maKhach.js:73 — khi boDem.size > 5000 mà mọi khoá còn trong cửa sổ thì MỖI lượt gọi duyệt cả Map, không xoá được gì; Map
  không có trần cứng. Dội nhiều IP làm Map phình, mỗi lượt /menu O(n). Nhánh dọn không có ca thử, không có đột biến — K3, K7.
NGHI NGỜ:
- index.js:128 + server/index.js:56 (trust proxy 1) — giới hạn IP của /menu tuỳ số tầng proxy Render / Cloudflare; 2 tầng → mọi khách chung
  một IP, 429 oan giờ cao điểm. Kế hoạch đã ghi CHƯA KIỂM.
- /menu có token thì không đếm lượt — đúng chữ phiếu A, chỉ là nhận xét.
- maKhach.js:182 (INSERT có xung_ho), index.js:174 (PUT /toi có xung_ho) nêu thẳng tên cột: bước nâng cấp trước hỏng → 003 không chạy →
  MỌI đăng ký khách mới qua App trả 500. Nên đưa vào CHƯA KIỂM.
- Chú thích maKhach.js:68 "Render chạy một máy" — không có căn cứ (K1 nhẹ).
8 mục: K3 đạt (đỏ trên gốc 14/42, không dò marker, có ca ngay trên / ngay dưới mọi ngưỡng) trừ 3 nhánh ở LỖI · K4: 1 nơi gọi xacMinhMa,
3 nơi hoSo, req.khach vào signup-codes chỉ xét truthy — đã xử lý, chưa có ca 2 giá trị chuanDiaChi · K5: F1, B8, C3, A2, C1 không bị chặn;
App v2 tạo khách mới gặp CAN_TEN là chủ ý đã duyệt · K1: còn "Render chạy một máy" · tiền: không đụng · P1: không đụng client/ ·
đơn giản: hanTokenKhach chép cách định dạng getNow (việc sau mở helpers.js); nhánh dọn maKhach.js:73; index.js:4 dòng chú thích quá dài;
kiem_tra_truoc_khi_giao.js:495 thiếu dấu cách (hình thức).
NGHIỆM THU: 6/6 mục có bằng chứng (A1–A5 + I2 tuy_chon · B1–B8 · C1–C4 · D1–D4 · E hợp đồng v3 + thu_HOPDONG_KH 67/0 + 3 đột biến HD ·
F1, F2, F4, B8 + thu_KH1 / thu_KHAPI2 xanh). Chưa giao được vì: (a) npm test ĐỎ ở thu_KHO1.js:246,248 → cổng chưa ĐẠT; (b) E và F cần
phiếu thêm "Bài thử cũ sửa" + thêm thu_KHUI1.js, thu_P15QR.js, thu_KHO1.js vào Phạm vi; (c) phiếu F lệch quyết định 2.
CHƯA SOÁT ĐƯỢC: số tầng proxy thật; bước 003 trên Turso production (thời gian chép bảng sao lưu, dữ liệu khách nằm thêm trong
_sao_luu_003_pos_customers); thu_KHUI1.js, thu_P15QR.js; App KH bản thật xử lý 401 trên /menu và ô xưng hô.
BÀI HỌC: KHOÁ — mỗi câu hợp đồng mô tả mã lỗi / hành vi giá trị phải trỏ tới MỘT ca thử. NGUYÊN TẮC — bộ đếm trong bộ nhớ chống quá tải
phải có trần cứng, O(1) mỗi lượt; nhánh dọn là hành vi, có ca + đột biến. NGUYÊN TẮC — bước nâng cấp mà đường khách phụ thuộc thì báo cáo
nêu "bước trước hỏng → cửa này 500" ở CHƯA KIỂM.
```

## Vòng sửa 1 (đúng ba lỗi soát nêu + hai điểm chữ)
- `server/utils/maKhach.js` `giuLuotBoNho`: trần cứng `GIOI_HAN.BO_DEM_TOI_DA` = 10 000 khoá; chạm trần → `boDem.clear()` (O(1) mỗi lượt,
  không duyệt Map); bỏ câu "Render chạy một máy" → "đếm theo TIẾN TRÌNH: khởi động lại về 0, nhiều tiến trình đếm riêng".
- `cong_cu/thu_KHAPI3.js`: A4c (thêm 10 khoá vẫn chặn; dội đủ trần → xoá sạch), B3 `dia_chi: 5` → 400 `YEU_CAU_KHONG_HOP_LE`, C2 `dia_chi: [1]`
  → 400 + CSDL không đổi, C2 `dia_chi: null` → xoá. Chạy lại trên gốc: 14 đạt · 46 hỏng; trên code vá: 62 đạt · 0 hỏng (`bang_chung_do.txt`).
- `dot_bien.py`: thêm BV-BO-DEM-TRAN, VS-BO-DEM-XOA-SOM, BV-DIA-CHI-KIEU, VS-DIA-CHI-NULL-KHONG-XOA → **32/32 BẮT**, đối chứng XANH.
- `server/routes/kh/index.js:4` tách dòng chú thích dài. `hanTokenKhach` giữ (mở `helpers.js` là việc sau — ngoài Phạm vi).
- (Lúc đó) chưa soát vòng 2 vì bộ kiểm còn đỏ — đã soát ở phiên tiếp 30.10, xem `## Soát độc lập — vòng 2`.

## Cổng — LẦN CŨ ở HEAD 8be85de (hết hiệu lực; lần mới ở cuối file)
```
· CẢNH BÁO A16: `cong_cu/thu_KHAPI3.js` chạy trên gốc in 60 ca ≠ 62 ca ở head — (2 ca C4 chỉ chạy khi có bước 3 — đúng thiết kế)
✗ [A11] bài thử `cong_cu/thu_HOPDONG_KH.js` XANH trên code gốc — bài thử vô giá trị (K3), phải đỏ trước khi vá
✗ [A13] `npm test` đỏ:            (chỉ ✗ bài chạy thật cong_cu/thu_KHO1.js — B1, B2)
✗ [A13] `node kiem_tra_truoc_khi_giao.js --day-du` đỏ:   (cùng thu_KHO1.js; PASS 82 · FAIL 1)
✗ CỔNG ĐỎ (CHẠY) — 3 lý do
```
Cả ba chờ chủ quán sửa phiếu (mục Câu hỏi): A11 ← dòng `## Bài thử cũ sửa` cho `thu_HOPDONG_KH.js`; A13 ← `thu_KHO1.js` vào Phạm vi.

## Nghiệm thu — đếm từng mục (bản CŨ ở 8be85de; bản hiện tại ở cuối file)
- A `/menu` không bắt buộc token: A1 (không token = có token, cả gia_hang), A2, A3 (sai / hết hạn / `Bearer null` / Basic → 401), A4 (300 → 200,
  301 → 429, IP khác 200, có token không đếm), A4b (cửa sổ 59 999 / 60 000 ms), A4c (trần bộ đếm), A5 (không hạng tắt) — `thu_KHAPI3.js` [A];
  không thêm trường món: A1 so BẰNG nguyên `data` với lượt có token + `thu_KH1.js` E5 danh sách trắng món. ✓
- B Đăng ký 3 bước: B1, B2 (sai + đủ 7 giá trị, không tốn lượt), B3 (300 / 301, sai kiểu), B4 (CSDL đủ 3 trường, câu trả lời), B4b (cùng giao
  dịch), B5 (10 phút: 590 / 610 giây, cả mã App lẫn mã quầy), B6 (một lần; mã sai không gia hạn), B7 (đua), B8 (khách cũ bỏ qua). ✓
- C Hồ sơ: C1, C2 (đổi / xoá `""` + `null` / 301 / sai kiểu / xưng hô sai + rỗng), C3 (`{}` / `ten: ""` / `{ ten }`), C4 (bước 003, sao lưu,
  chạy lại). Màn quầy không đổi: diff không đụng `client/`. ✓
- D Tự gia hạn: D1 (30 ngày, `het_han` giờ VN với TZ=UTC), D2 (hết hạn / sai / không token → 401), D3 (10 → 200, 11 → 429, khách khác 200),
  D4 (token cũ còn dùng — quyết định ghi ở `ke_hoach.md` Phần 4). ✓
- E Hợp đồng v3: `HOP_DONG_API_KH.md` PHIEN_BAN 3 + nhật ký v3; `thu_HOPDONG_KH.js` 67 đạt · 0 hỏng (hiểu `tuy_chon`: có / không / sai token);
  đột biến BV-HOPDONG-TUY-CHON, VS-HOPDONG-GIA-TRI-LA, BV-HOPDONG-GIA-HAN. ✓ code — cổng A11 chờ dòng `## Bài thử cũ sửa`.
- F K5: F1 (khách cũ `{ sdt, ma }`), C3/F2 (`PUT { ten }`), A2 (menu có token), B8, F4 (gia hạn không ăn trần nhận mã bill); quầy / nhận điểm /
  PIN: `thu_KH1.js` 157/157, `thu_KHAPI2.js` xanh trong `npm test`. ✓ — trừ "App v2 tạo khách MỚI" (chủ quán quyết đổi, 30.10).

## Báo cáo 7 mục — bản CŨ ở 8be85de (bản hiện tại ở cuối file)
```
VIỆC:        KH-API-3 — Cửa App KH: menu không cần đăng nhập · đăng ký 3 bước (xưng hô, địa chỉ) · tự gia hạn đăng nhập · hợp đồng v3
ĐÃ SỬA:      server/routes/kh/index.js — /menu dời lên trước xacThucKhach với tuyChonKhach + giuLuotMenu; hoSo thêm xung_ho, dia_chi;
               xác minh truyền { ten, xungHo, diaChi }, đọc SELECT *; PUT /toi sửa ten / xung_ho / dia_chi; POST /gia-han
             server/utils/maKhach.js — XUNG_HO, chuanXungHo, chuanDiaChi, giuLuotBoNho (trần cứng) + giuLuotMenu / giuLuotGiaHan;
               xacMinhMa: kiểm thông tin chỉ khi tạo khách mới, CAN_TEN khi thiếu tên / xưng hô + mã sống thêm 10 phút một lần;
               INSERT khách lưu xung_ho + address
             server/middleware/khachAuth.js — SELECT * trong xacThucKhach, tuyChonKhach, hanTokenKhach
             server/routes/kh/loi.js — XUNG_HO_SAI, DIA_CHI_QUA_DAI; lời CAN_TEN
             server/nang_cap/003_xung_ho_khach.js — themCot pos_customers.xung_ho
             HOP_DONG_API_KH.md — v3 · cong_cu/thu_HOPDONG_KH.js — token "tuy_chon" · cong_cu/thu_KH1.js — xacMinh gửi xung_ho, /toi 8 trường
             kiem_tra_truoc_khi_giao.js:495 — thêm thu_KHAPI3.js (chỉ THÊM)
BÀI THỬ:     thu_KHAPI3.js trên gốc 55a8f29 → ĐỎ 14 đạt · 46 hỏng (A1, A4, A4b, A4c, A5, B1–B8, C1–C4, D1–D4, F4); sau vá → XANH 62/62.
             thu_KH1.js gốc ĐỎ ở E1 (156/1) → 157/157. thu_HOPDONG_KH.js gốc XANH 64/0 (cần ## Bài thử cũ sửa) → 67/67.
             Đột biến 32/32 BẮT, đối chứng XANH.
ĐÃ RÀ K4:    grep "xacMinhMa\|hoSo(\|CAN_TEN\|kyTokenKhach\|pos_kh_lan_thu" trong server/ → 1 nơi gọi xacMinhMa, 3 nơi hoSo, CAN_TEN chỉ
             maKhach.js + loi.js, ký token chỉ kyTokenKhach (xác minh + gia hạn), pos_kh_lan_thu chỉ giuLuotNhanMa (gia hạn KHÔNG ghi — F4);
             tạo khách từ App chỉ maKhach.js INSERT; bài thử khẳng định hành vi cũ: thu_KH1 (sửa), thu_HOPDONG_KH (sửa), thu_KHUI1 + thu_P15QR
             + thu_KHO1 (ngoài Phạm vi — Câu hỏi). Đã xử lý hết trong Phạm vi.
CHƯA KIỂM:   - npm test / --day-du / cổng ĐỎ vì cong_cu/thu_KHO1.js (ngoài Phạm vi) — chờ phiếu; thu_KHUI1.js, thu_P15QR.js chưa sửa (đỏ khi chạy tay).
             - Số tầng proxy Render / Cloudflare: sai thì mọi khách chung một IP → giới hạn 300 / phút của /menu có thể chặn oan giờ đông.
             - Bộ đếm trong bộ nhớ đếm theo tiến trình: khởi động lại / nhiều tiến trình → đếm lại / đếm riêng (trần gia hạn cũng vậy).
             - Bước nâng cấp trước hỏng (vd 002 KHO-2a) → 003 không chạy → mọi ĐĂNG KÝ khách mới qua App và PUT /toi có xung_ho trả 500
               (các cửa đọc không hỏng nhờ SELECT *). Chưa thử trên Turso thật: thời gian chép _sao_luu_003_pos_customers (bảng sao lưu
               chứa bản chép dữ liệu khách).
             - App KH bản thật: chưa có ô xưng hô (khách mới không đăng ký được tới khi App lên bản mới); App phải bỏ token khi /menu trả 401.
             - Soát vòng 2 chưa chạy (sau vòng sửa 1). Không có giao diện → không có thao tác thử tay trên điện thoại.
GIT:         8be85de KH-API-3: bang chung vong sua 1 (SO CA 62)
             e92ae58 KH-API-3: vong sua 1 — dot bien moi
BÀI HỌC:     KHOÁ 1 · NGUYÊN TẮC 3 · BỎ 2 — chi tiết ở ## Bài học
```

## Bài học — vòng 1 (bản cuối ở cuối file)
Sự cố của việc: (1) kế hoạch sót `thu_KHO1.js` khoá cứng danh sách bước nâng cấp → bộ kiểm đỏ, phải dừng hỏi; (2) agent soát kế hoạch bắt
`thu_KH1.js` sẽ đỏ hàng loạt + câu `strftime(tao_luc,'+5 minutes')` thiếu định dạng; (3) đột biến VS-KIEM-CA-KHACH-CU SỐNG vì chính đột
biến không đổi hành vi; (4) soát vòng 1: hai lời hợp đồng không có ca, bộ đếm không trần; (5) người gác chặn: B-BIMAT-CHU (chữ `KH_TOKEN_SAI`
trong lệnh bash — dùng Edit), B-PHANTICH (chuyển hướng ra file), B-CD-VITRI, GIT-TUYCHON (`git -C`), G5-NGOAIPV (`thu_KHUI1.js`).
- **KHOÁ** (ngoài Phạm vi — đề xuất): `cong_cu/thu_KHO1.js` B1 / B2 so `pos_nang_cap` với danh sách file `NNN_*.js` THẬT trong
  `server/nang_cap/` (so BẰNG, đủ tên) thay vì cứng "1 dòng" — bước mới không làm đỏ bài kho; ca đỏ: xoá một dòng `pos_nang_cap` hoặc thêm file
  bước giả không chạy → ĐỎ. (KHO-2a sẽ vấp đúng chỗ này.)
- **NGUYÊN TẮC** (đề xuất `KHUON_LOI.md` K4): "Đổi cấu trúc DB (bước nâng cấp, cột mới) → grep `cong_cu/` tìm bài khoá ĐÚNG danh sách
  (`pos_nang_cap`, `table_info`, `Object.keys(...).sort()`) TRƯỚC khi lập kế hoạch, đưa vào Phạm vi." Đã gây: KH-API-3 `thu_KHO1.js:246`.
- **NGUYÊN TẮC** (đề xuất `KHUON_LOI.md` K3): "Đột biến SỐNG → đọc lại chính đột biến trước: nó có đổi hành vi không? (KH-API-3
  VS-KIEM-CA-KHACH-CU dời phép kiểm nhưng giữ `if` trong khối — no-op.) Mỗi lời hợp đồng về mã lỗi / giá trị (`null` → xoá, sai kiểu → 400)
  trỏ tới một ca thử." Đã gây: soát vòng 1 lỗi 1–2.
- **NGUYÊN TẮC** (đề xuất `KHUON_LOI.md` K7): "Bộ đếm / bộ nhớ đệm trong tiến trình phải có trần cứng, chi phí mỗi lượt O(1); nhánh dọn là
  hành vi — có ca + đột biến." Đã gây: soát vòng 1 lỗi 3 (`maKhach.js` dọn > 5000 duyệt cả Map mỗi lượt).
- **BỎ**: người gác chặn chữ in hoa trong lệnh bash — skill đã dặn dùng Edit / chạy qua `npm test` (luật có sẵn, lần này chỉ quên).
- **BỎ**: `strftime` thiếu chuỗi định dạng — bắt ở bước soát kế hoạch, chưa vào code.

HEAD ĐÃ KIỂM: 8be85de

## Thêm việc (chủ quán duyệt 30.10) — chỉ chữ trong HOP_DONG_API_KH.md, không đổi code
- Địa chỉ → `https://www.pos-tuquyduong.io.vn/api/kh` (bản không www tự chuyển hướng, trình duyệt chặn).
- Giờ vàng: `bat_dau` / `ket_thuc` dạng `YYYY-MM-DDTHH:mm:ss` giờ VN; khung qua nửa đêm thì `ket_thuc` là ngày hôm sau — khớp code
  `server/utils/gioHoatDong.js:82` (`khungGio`: `${ngay}T${mo}:00`, `dong > mo ? ngay : congNgay(ngay, 1)`) và `:86–88` (`khungHangNgay`).
- Commit 23c75a4. `thu_HOPDONG_KH.js` 67 đạt · 0 hỏng (SỐ CA không đổi). Cổng chạy lại ở 23c75a4: y nguyên 3 dòng ✗ cũ (A11 thu_HOPDONG_KH,
  A13 npm test, A13 --day-du — đều do thu_KHO1.js / phiếu chờ sửa) + CẢNH BÁO A16 60 ≠ 62 như trên. Không thêm lỗi mới.

HEAD ĐÃ KIỂM: 23c75a4

## Soát độc lập (/ra-soat) — vòng 2 (HEAD 0157f1a), báo cáo nguyên văn
Tóm tắt của người soát: vòng sửa 1 đã vá đúng cả 3 lỗi của vòng 1. Bước 003, ca C4b, H3 và A6 đúng và đỏ trên gốc. `npm test` xanh (PASS 82 · FAIL 0 · CẢNH BÁO 1). `thu_KHUI1.js` chạy tay 41/0, `thu_P15QR.js` 29/0. Sáu đột biến mới và của vòng 1 đều BẮT, đối chứng xanh. Nhưng tôi dựng thêm 5 đột biến (bản sao tạm, khuôn `dot_bien.py`, không sửa kho) và cả 5 đều SỐNG. Trong đó hai cái là lời hợp đồng chưa có ca nào khoá, đúng bài học vòng 1 → KHÔNG ĐẠT, chỉ lỗi NHẸ (không đụng tiền, điểm, ví, không lộ dữ liệu).

```
KHÔNG ĐẠT

LỖI TÌM ĐƯỢC:
- server/utils/maKhach.js:83 — cửa sổ "mỗi PHÚT" của giới hạn /menu không có ca khoá. Đột biến `60 * 1000` → `3600 * 1000`
  (giới hạn thành 300 lần / GIỜ mỗi IP) cho thu_KHAPI3.js xanh trọn 63/0 (SỐNG). A4 chỉ dội 301 lượt trong cùng một giây, còn A4b
  gọi thẳng giuLuotBoNho với ms tự truyền, không qua giuLuotMenu. Phiếu A và HOP_DONG_API_KH.md (bảng cửa + nhật ký v3) hứa
  "≤ 300 lần / phút / IP". Vì sao đáng lo: nhiều khách dùng chung một IP (wifi quán, mạng di động) thì 300 lần / giờ có thể chặn oan.
  — K3 (lời hợp đồng không trỏ tới ca nào — lặp lại đúng bài học vòng 1)
- server/utils/maKhach.js:84 — cửa sổ "mỗi GIỜ" của /gia-han cũng không có ca khoá. Đột biến `3600 * 1000` → `60 * 1000`
  (10 lần / phút) SỐNG; D3 gọi 11 lần liền nhau. Hợp đồng ghi "chặn > 10 lần / giờ mỗi khách". — K3
- server/utils/maKhach.js:83-84 — hai độ dài cửa sổ là số viết thẳng trong hàm bọc, không nằm trong GIOI_HAN (LUAT §3: hằng số cấu
  hình đặt một chỗ có tên). Cách gọn: thêm MENU_CUA_SO_MS / GIA_HAN_CUA_SO_MS vào GIOI_HAN; hai hàm bọc nhận thêm `luc`; ca A4b /
  D3 gọi giuLuotMenu(ip, t0 + 59 999 / 60 000) và giuLuotGiaHan(id, t0 + 3 599 999 / 3 600 000); thêm đột biến cho từng cửa sổ. — K3 + LUAT §3
- server/utils/maKhach.js:78 — `boDem.set(khoa, { bat_dau, dem: 1, ms })`: trường `ms` không chỗ nào đọc (grep `\.ms\b` → 0).
  Code chết sót từ bản dọn của vòng 1. Bỏ `ms`. — LUAT §3 (không để code chết)
- viec/KH-API-3/trang_thai.md:123,125,165,167,172,179 — "Báo cáo 7 mục" và "Vòng sửa 1" còn ghi số cũ: 62/62, 32/32, "npm test đỏ vì
  thu_KHO1", "thu_KHUI1 / thu_P15QR chưa sửa", "Soát vòng 2 chưa chạy". Mục "## Câu hỏi" đã được trả lời mà còn để nguyên. Bảng
  "Chỗ vá → đột biến" và dòng "Mọi tên đột biến" (30 tên) thiếu 4 đột biến vòng 1 (BV-BO-DEM-TRAN, VS-BO-DEM-XOA-SOM,
  BV-DIA-CHI-KIEU, VS-DIA-CHI-NULL-KHONG-XOA); 4 tên này chỉ có ở dòng 123. Hiện tại: 63 ca, 34/34 đột biến BẮT. Không có kết quả
  cổng `node tu_chay/cong.js chay` nào sau 628fce8 (LUAT §6.3). — K4 (sửa một câu tài liệu → grep cả file) / K1

NGHI NGỜ:
- server/nang_cap/003_xung_ho_khach.js:9 — thiếu bảng thì `return`, nhưng bộ chạy (server/nang_cap/chay.js:32 INSERT pos_nang_cap
  trước khi chạy bước) vẫn ghi bước 3 là ĐÃ CHẠY. Hệ quả: kho nào từng chạy nâng cấp khi chưa có bảng khách, sau đó mới tạo bảng, sẽ
  không bao giờ có cột xung_ho, và mọi đăng ký App trả 500 mà không báo gì. Máy thật không gặp: đã đọc database.js:35 createTables
  chạy trước database.js:38 chayNangCap, và pos_customers được tạo ở database.js:83. Chat đã chỉ định cách này nên tôi không xếp là
  lỗi; nên ghi vào CHƯA KIỂM.
- server/utils/maKhach.js:74-76 — /menu và /gia-han dùng CHUNG một Map. Dội /menu từ ≥ 10 000 IP (một dải IPv6 là đủ) thì Map bị
  `clear()`, kéo theo cả bộ đếm gia hạn của mọi khách. Tác động thấp (gia hạn chỉ là chống gọi dồn, không đụng tiền), nhưng hồ sơ
  chưa nêu.
- server/middleware/khachAuth.js:50 — đột biến `=== undefined` → `!req.headers.authorization` (coi tiêu đề Authorization rỗng là
  "không token") SỐNG. Hợp đồng ghi "CÓ gửi mà sai → 401"; ca tiêu đề rỗng chưa có. Nhẹ.
- server/utils/maKhach.js:63 — đột biến bỏ `.normalize('NFC')` trong chuanDiaChi SỐNG. Địa chỉ gõ dạng NFD (dấu tách rời) dài gần 300
  ký tự có thể bị đếm thành > 300 → 400 oan. Nhẹ.
- server/utils/maKhach.js:167 — bỏ `dung_luc IS NULL` trong câu UPDATE gia hạn mã: đột biến SỐNG, nhưng câu SELECT ở :151 đã lọc mã
  đã dùng nên chỉ còn cửa đua. Vô hại, chỉ ghi lại.
- cong_cu/thu_KHAPI3.js:286 C4b lấy kết quả mong đợi từ danh sách file thật trong server/nang_cap. Một bước 004 sau này đụng bảng
  không phải kho sẽ làm thu_KHAPI3 đỏ dù không liên quan việc này (dính chùm). Gọn hơn: chỉ kiểm bước 3 được ghi + `hong === null` +
  không tạo pos_customers.

8 MỤC:
1. K3: C4b đỏ trên gốc và trên 628fce8 (bang_chung_do.txt:72-77). H3 / A6 đỏ trên gốc (:80-91). Không có ca nào chỉ dò marker. Đã
   chạy lại BV-003-KIEM-BANG, VS-003-SAI-TEN-BANG và 4 đột biến vòng 1: 6/6 BẮT, đối chứng XANH 63/0 · 67/0. Lỗ: hai cửa sổ thời gian
   (LỖI 1–2), NFC, tiêu đề rỗng.
2. K4: grep `FROM pos_customers` trong kh/, maKhach.js, khachAuth.js → 5 chỗ. Đường cần xung_ho dùng `SELECT *` (index.js:82,
   khachAuth.js:38); 3 chỗ còn lại chỉ đọc id / qr_code — không thiếu. grep `giuLuotBoNho` → 2 hàm bọc, cả hai thiếu ca khoá cửa sổ.
   Tài liệu trang_thai.md còn 6 câu cũ.
3. K5: luồng hợp lệ qua chỗ mới thêm — production (có bảng → thêm cột), kho thử Replit (createTables trước), thu_KHO2a E6b (chỉ bảng
   kho, xanh trong npm test), menu có token (A2, A4), khách cũ { sdt, ma } (F1), PUT { ten } App v2 (C3/F2), quầy và nhận điểm
   (thu_KH1 xanh). Không thấy luồng nào bị chặn oan. App v2 không tạo được khách MỚI là quyết định của chủ quán ngày 30.10.
4. K1: chú thích 003 đúng (database.js:35,38,83). Chú thích maKhach.js:69-72 khớp code (đã bỏ câu "Render một máy"). Lời giải thích
   H2f trong thu_KHUI1.js:63 khớp với :133 (so bằng nguyên văn file dist). trang_thai còn câu cũ (đã nêu ở LỖI).
5. Đường tiền: không đụng tiền, ví, điểm. Server không nhận trường tiền nào từ client. req.khach giờ là cả hàng khách (có pin_code đã
   băm) nhưng chỉ đi ra ngoài qua danh sách trắng hoSo (index.js:31). signup-codes.js:138,276,430 chỉ xét req.khach có / không.
6. P1: `git diff 1930351 HEAD -- client app_kh` rỗng. Mọi commit của việc chỉ chạm file trong Phạm vi.
7. Nghiệm thu: xem dòng dưới.
8. Đơn giản: số cửa sổ viết thẳng (:83-84), trường `ms` chết (:78), C4b dính chùm với danh sách bước (:286), trang_thai chồng nhiều
   bản cũ.

NGHIỆM THU:    5/6 mục đủ bằng chứng · mục thiếu: A — phần "/ phút" của giới hạn 300 lượt chưa có ca khoá (đột biến cửa sổ SỐNG).
               Mục D có ghi "(vd > 10 lần / giờ)" nên tính là đạt, nhưng cửa sổ giờ cũng chưa khoá.
               Đã có: B (B1–B8, B4b), C (C1–C4, C4b), D (D1–D4), E (thu_HOPDONG_KH 67/0 + 3 đột biến HD),
               F (F1, F2, F4, B8, thu_KH1 / thu_KHAPI2 xanh trong npm test; App v2 tạo khách mới là quyết định 30.10).

CHƯA SOÁT ĐƯỢC: chưa chạy `--day-du` và cổng `tu_chay/cong.js` (trang_thai cũng chưa có kết quả cổng tại HEAD 0157f1a); chưa chạy
               đủ 34 đột biến (chỉ 6 + 5 đột biến của tôi); số tầng proxy thật trên Render; bước 003 trên Turso production (thời gian
               chép bảng sao lưu); App KH bản thật.

BÀI HỌC:       KHOÁ — mỗi hàm bọc của bộ đếm (giuLuotMenu, giuLuotGiaHan) cần ca ngay dưới / ngay trên cửa sổ, gọi qua CHÍNH hàm bọc,
               kèm đột biến đổi cửa sổ; độ dài cửa sổ đặt trong GIOI_HAN. NGUYÊN TẮC (K3) — "ngưỡng N / ĐƠN VỊ THỜI GIAN" là HAI phép:
               ca dội N+1 lượt chỉ khoá N, phải có thêm ca khoá đơn vị thời gian. Bài học vòng 1 ("mỗi lời hợp đồng trỏ tới một ca")
               đã được áp cho mã lỗi và giá trị nhưng sót con số thời gian → nên ghi câu này thẳng vào KHUON_LOI.md K3. NGUYÊN TẮC (K4) —
               sau mỗi vòng sửa, grep trang_thai.md tìm mọi câu trích số ca / số đột biến / trạng thái cũ, và bảng chỗ vá → đột biến
               phải có đủ tên trong dot_bien.py.
```

## Vòng sửa 2 (đúng các lỗi soát vòng 2 nêu + hai điểm nghi ngờ rẻ)
- `server/utils/maKhach.js`: `GIOI_HAN.MENU_CUA_SO_MS` (1 phút), `GIOI_HAN.GIA_HAN_CUA_SO_MS` (1 giờ) thay số viết thẳng; `giuLuotMenu(ip, luc)`,
  `giuLuotGiaHan(khachId, luc)` nhận `luc` (route không truyền → mặc định `Date.now()` của `giuLuotBoNho`); bỏ trường `ms` chết trong `boDem.set`.
- `cong_cu/thu_KHAPI3.js`: A4d (300 lượt qua; lượt 301 ở 59 999 ms chặn; 60 000 ms qua lại — gọi qua CHÍNH `giuLuotMenu`), D3b (10 / 3 599 999 /
  3 600 000 ms qua CHÍNH `giuLuotGiaHan`) — đỏ trên HEAD trước vá; A3 thêm tiêu đề Authorization rỗng → 401; C2 địa chỉ 300 ký tự dạng NFD → 200 +
  lưu NFC (hai ca khoá hồi quy, có đột biến); C4b chỉ kiểm "ghi bước 3" — không còn dính danh sách bước (nghi ngờ 6 của soát).
- `dot_bien.py`: VS-MENU-CUA-SO-GIO, VS-GIA-HAN-CUA-SO-PHUT, VS-DIA-CHI-KHONG-NFC, đột biến tiêu đề rỗng (tên trong bảng trên).
- `trang_thai.md`: đánh dấu mục cũ (Câu hỏi đã trả lời, cổng / nghiệm thu / báo cáo cũ ở 8be85de), bảng chỗ vá → đột biến đủ tên.
- Cổng lần đầu sau vòng sửa 2 (HEAD 315c803) đỏ 4 lý do: A16 × 3 thiếu `SỐ CA` của `thu_BH2.js`, `thu_KHO1.js`, `thu_KHO2a.js` (bài việc KHÁC,
  vào qua commit gộp 1930351 — cổng so từ 55a8f29^) → ghi số ca thật ở HEAD, khớp bằng chứng của chính KHO-2a / BH-2; A11 `thu_HOPDONG_KH.js` —
  xem Câu hỏi vòng 2. Thêm ca thật cho `thu_HOPDONG_KH.js` (xác minh khách mẫu trả đúng xung_ho / dia_chi) — đỏ trên gốc 64/1, xanh 68/68,
  đột biến BV-HOPDONG-INSERT-DIA-CHI. Tổng đột biến **39/39 BẮT**, đối chứng XANH.
- Các điểm nghi ngờ còn lại của soát vòng 2 (không sửa): 003 thiếu bảng vẫn ghi đã chạy → CHƯA KIỂM; /menu và /gia-han chung một Map → Phát hiện;
  bỏ `dung_luc IS NULL` trong UPDATE gia hạn mã — soát xếp vô hại.

## Câu hỏi vòng 2 (chờ chat sửa phiếu — máy không sửa được phiếu, `G1-PHIEU`)
Cổng chỉ còn ĐỎ một lý do:
```
✗ [A11] bài thử cũ được miễn nhưng bản gốc đỏ trên code PR: `cong_cu/thu_HOPDONG_KH.js` (thoát 1):
  … 28 đạt · 2 hỏng
```
Truy nguyên (chạy tay bản 55a8f29 của bài trên code HEAD): 2 ca đỏ là `POST /dang-nhap/xac-minh → 200` (trả `CAN_TEN` vì bản cũ không gửi
`xung_ho`) và "khách mẫu đăng nhập được". Đây là hành vi chủ quán ĐÃ DUYỆT đổi (30.10: xưng hô bắt buộc với khách mới) → theo LUAT §6 mục 8,
bài này là bài SỬA bình thường, KHÔNG thuộc `## Bài thử cũ sửa` (mục đó chỉ cho bài cũ đổi mà bản gốc vẫn xanh trên code mới — ở đây không bao
giờ xanh được).
**Đề xuất (chỉ cần xác nhận):** chat xoá dòng `- cong_cu/thu_HOPDONG_KH.js — …` khỏi `## Bài thử cũ sửa` của `viec/KH-API-3/phieu.md`
(mục còn rỗng thì xoá cả tiêu đề). Máy đã chuẩn bị sẵn: bài nay ĐỎ trên gốc (ca "xác minh khách mẫu mới: khach.xung_ho / khach.dia_chi = đúng
giá trị gửi", 64 đạt · 1 hỏng), xanh trên HEAD 68/68, `SỐ CA` 68 đã ghi. Sửa phiếu xong → `/lam-viec KH-API-3 tiep`: chạy lại cổng, soát vòng 3.

## Cổng (`node tu_chay/cong.js chay . 55a8f29^ HEAD viec/KH-API-3`, HEAD 4ee6a7c, cây sạch)
```
· CẢNH BÁO A16: `cong_cu/thu_BH2.js` chạy trên gốc in 76 ca ≠ 100 ca ở head — (bài của BH-2, vào qua gộp main)
· CẢNH BÁO A16: `cong_cu/thu_HOPDONG_KH.js` chạy trên gốc in 65 ca ≠ 68 ca ở head — (hợp đồng v2 của gốc ít cửa hơn — đúng thiết kế)
· CẢNH BÁO A16: `cong_cu/thu_KHAPI3.js` chạy trên gốc in 65 ca ≠ 67 ca ở head — (2 ca C4 chỉ chạy khi có bước 3 — đúng thiết kế)
✗ [A11] bài thử cũ được miễn nhưng bản gốc đỏ trên code PR: `cong_cu/thu_HOPDONG_KH.js` (thoát 1):
✗ CỔNG ĐỎ (CHẠY) — 1 lý do
```
`npm test -- --day-du`: PASS 86 · FAIL 0 · CẢNH BÁO 1 (`GET có lệnh ghi` packages.js / products.js / sync.js — có từ trước, ngoài Phạm vi).

## Phát hiện (thêm, phiên 30.10)
- `server/utils/maKhach.js` `boDem`: /menu và /gia-han dùng chung một Map; dội /menu từ ≥ 10 000 IP thì `clear()` xoá cả bộ đếm gia hạn (chống
  gọi dồn, không đụng tiền). Tách hai Map là việc nhỏ nếu chủ quán muốn.
- Cổng `tu_chay/cong.js chay` lấy mốc trước commit gộp main → bài của việc khác (thu_BH2, thu_KHO1, thu_KHO2a) bị coi là "PR đổi" (A16). Khung
  đóng băng tới khai trương — ghi lại để làm sau.

## Nghiệm thu — đếm từng mục (HEAD 4ee6a7c)
- A `/menu` không bắt buộc token: A1, A2, A3 (sai / hết hạn / `Bearer null` / Basic / tiêu đề rỗng → 401), A4 (300 → 200, 301 → 429, IP khác,
  có token không đếm), A4b, A4c (trần bộ đếm), **A4d (cửa sổ một PHÚT qua `giuLuotMenu`)**, A5 — `thu_KHAPI3.js`; không thêm trường món: A1 so
  BẰNG + `thu_KH1.js` E5. `thu_KHUI1.js` H3 (menu không token 200 ở cả hai Host). ✓
- B Đăng ký 3 bước: B1–B8, B4b — `thu_KHAPI3.js`; `thu_P15QR.js` A6 (khách mới qua App lưu xung_ho). ✓
- C Hồ sơ: C1, C2 (đổi / xoá `""` + `null` / 301 / sai kiểu / NFD / xưng hô sai + rỗng), C3, C4 (bước 003, sao lưu, chạy lại), C4b (kho không
  bảng khách). Màn quầy không đổi: không commit nào đụng `client/`. ✓
- D Tự gia hạn: D1 (30 ngày, giờ VN với TZ=UTC), D2, D3 (10 → 200, 11 → 429, khách khác 200), **D3b (cửa sổ một GIỜ qua `giuLuotGiaHan`)**, D4
  (token cũ còn dùng tới hạn cũ — `ke_hoach.md` Phần 4). ✓
- E Hợp đồng v3: PHIEN_BAN 3 + nhật ký; `thu_HOPDONG_KH.js` 68/68 (tuy_chon có / không / sai token; khách mẫu trả đúng xung_ho / dia_chi);
  đột biến BV-HOPDONG-TUY-CHON, VS-HOPDONG-GIA-TRI-LA, BV-HOPDONG-GIA-HAN, BV-HOPDONG-INSERT-DIA-CHI. ✓ code — cổng A11 chờ phiếu (Câu hỏi vòng 2).
- F K5: F1 (khách cũ `{ sdt, ma }`), C3/F2 (`PUT { ten }`), A2, B8, F4; quầy / nhận điểm / PIN: `thu_KH1.js` 157/157, `thu_KHAPI2.js` xanh trong
  `npm test`. ✓ — "App v2 tạo khách MỚI" đổi theo quyết định chủ quán 30.10.

## Báo cáo 7 mục (HEAD 4ee6a7c)
```
VIỆC:        KH-API-3 — Cửa App KH: menu không cần đăng nhập · đăng ký 3 bước (xưng hô, địa chỉ) · tự gia hạn đăng nhập · hợp đồng v3
ĐÃ SỬA:      server/routes/kh/index.js — /menu trước xacThucKhach với tuyChonKhach + giuLuotMenu; hoSo + xung_ho, dia_chi; xác minh nhận
               { ten, xungHo, diaChi }; PUT /toi ba trường; POST /gia-han
             server/utils/maKhach.js — XUNG_HO, chuanXungHo, chuanDiaChi; giuLuotBoNho (trần cứng) + giuLuotMenu / giuLuotGiaHan (cửa sổ
               trong GIOI_HAN, nhận luc); xacMinhMa: CAN_TEN khi thiếu tên / xưng hô + mã sống thêm 10 phút một lần; INSERT lưu xung_ho + address
             server/middleware/khachAuth.js — SELECT *, tuyChonKhach, hanTokenKhach · server/routes/kh/loi.js — XUNG_HO_SAI, DIA_CHI_QUA_DAI
             server/nang_cap/003_xung_ho_khach.js — themCot pos_customers.xung_ho; bỏ qua khi chưa có bảng (thu_KHO2a E6b)
             HOP_DONG_API_KH.md — v3 · kiem_tra_truoc_khi_giao.js — thêm thu_KHAPI3.js vào danh sách chạy
             Bài thử: thu_KHAPI3.js (mới), thu_KH1.js, thu_HOPDONG_KH.js, thu_KHUI1.js (H3 + setEncoding), thu_P15QR.js (A6)
BÀI THỬ:     thu_KHAPI3.js gốc 55a8f29 → ĐỎ 15 đạt · 50 hỏng; sau vá → XANH 67/67. thu_KH1.js gốc 156/1 → 157/157.
             thu_HOPDONG_KH.js gốc 64/1 → 68/68. thu_KHUI1.js gốc 39/2 (H3) → 41/41. thu_P15QR.js gốc 28/1 (A6) → 29/29.
             Đột biến 39/39 BẮT, đối chứng XANH. npm test -- --day-du: PASS 86 · FAIL 0.
ĐÃ RÀ K4:    grep "xacMinhMa\|hoSo(\|CAN_TEN\|kyTokenKhach\|pos_kh_lan_thu\|giuLuotBoNho" trong server/ → 1 nơi gọi xacMinhMa, 3 nơi hoSo,
             CAN_TEN chỉ maKhach.js + loi.js, 2 hàm bọc giuLuotBoNho (cả hai có ca cửa sổ), pos_kh_lan_thu chỉ giuLuotNhanMa; grep
             "FROM pos_customers" trong kh/ + maKhach.js + khachAuth.js → 5 chỗ, đường cần xung_ho dùng SELECT *. Bài khẳng định hành vi
             cũ: thu_KH1, thu_HOPDONG_KH, thu_KHUI1, thu_P15QR đã sửa; thu_KHO1 xanh sau gộp KHO-2a. Đã xử lý hết trong Phạm vi.
CHƯA KIỂM:   - Cổng ĐỎ A11 tới khi chat bỏ thu_HOPDONG_KH.js khỏi "## Bài thử cũ sửa" của phiếu (Câu hỏi vòng 2). Soát vòng 3 chưa chạy.
             - Số tầng proxy Render / Cloudflare: sai thì mọi khách chung một IP → giới hạn 300 / phút của /menu có thể chặn oan giờ đông.
             - Bộ đếm trong bộ nhớ đếm theo tiến trình (khởi động lại về 0, nhiều tiến trình đếm riêng); /menu và /gia-han chung một Map.
             - Bước 003 gặp kho chưa có bảng pos_customers thì vẫn ghi "đã chạy" — kho đó tạo bảng sau sẽ không bao giờ có cột xung_ho. Máy
               thật không gặp (database.js:35 createTables trước database.js:38 chayNangCap) — chỉ đọc code, chưa thử trên Turso.
             - Bước nâng cấp trước hỏng → 003 không chạy → mọi ĐĂNG KÝ khách mới qua App và PUT /toi có xung_ho trả 500. Chưa thử trên
               Turso thật: thời gian chép _sao_luu_003_pos_customers (bảng sao lưu chứa bản chép dữ liệu khách).
             - App KH bản thật: chưa có ô xưng hô (khách mới không đăng ký được tới khi App lên bản mới); App phải bỏ token khi /menu trả 401.
             - Không có giao diện → không có thao tác thử tay trên điện thoại.
GIT:         4ee6a7c KH-API-3: bang chung thu_HOPDONG_KH (SO CA 68) + so ca bai vao qua gop main
             d5d735b KH-API-3: dot bien BV-HOPDONG-INSERT-DIA-CHI
BÀI HỌC:     KHOÁ 1 · NGUYÊN TẮC 3 · BỎ 1 — chi tiết ở ## Bài học — phiên 30.10
```

## Bài học — phiên 30.10 (gom cả vòng 1)
Sự cố phiên này: (1) bước 003 làm thu_KHO2a đỏ sau gộp — bài kho chạy cả thư mục nang_cap trên kho chỉ bảng kho; (2) thu_KHUI1 H2f đỏ oan do
ghép mẩu UTF-8 bằng `than += d`; (3) soát vòng 2: hai cửa sổ thời gian không có ca (đột biến 1 phút ↔ 1 giờ SỐNG), số viết thẳng, trường chết,
trang_thai còn câu cũ; (4) cổng A11: phiếu xếp thu_HOPDONG_KH vào "Bài thử cũ sửa" dù hành vi đã duyệt đổi (LUAT §6.8) — phải hỏi lại;
(5) người gác chặn B-BIMAT-CHU 5 lần (chữ in hoa trong lệnh / file chạy) — dùng Edit, commit trước rồi chạy; B-PHANTICH, TAR-X (biến shell).
- **KHOÁ** (trong Phạm vi — ĐÃ LÀM): A4d / D3b gọi qua CHÍNH hàm bọc + đột biến đổi cửa sổ; C4b khoá 003 trên kho không bảng khách.
- **KHOÁ** (ngoài Phạm vi — đề xuất, `tu_chay/cong.js` đóng băng): phép A11 kiểm thêm — mục "Bài thử cũ sửa" mà bản gốc ĐỎ trên code PR thì báo
  "đây là bài sửa theo LUAT §6.8, bỏ khỏi Bài thử cũ sửa" ngay trong dòng ✗ (ca đỏ: phiếu KH-API-3 628fce8). Và mốc A16 bỏ qua file chỉ đổi ở
  commit gộp main (ca đỏ: thu_BH2 / thu_KHO1 / thu_KHO2a ở nhánh này).
- **NGUYÊN TẮC** (đề xuất `KHUON_LOI.md` K3, ngoài Phạm vi): "Ngưỡng N / ĐƠN VỊ THỜI GIAN là HAI phép: ca dội N+1 lượt chỉ khoá N; phải có ca
  ngay dưới / ngay trên cửa sổ gọi qua CHÍNH hàm dùng thật. Đã gây: KH-API-3 soát vòng 2 — đổi 1 phút thành 1 giờ vẫn 63/63 xanh."
- **NGUYÊN TẮC** (đề xuất `KHUON_LOI.md` K4): "Sau mỗi vòng sửa, grep trang_thai.md tìm mọi câu trích số ca / số đột biến / trạng thái cũ; bảng
  chỗ vá → đột biến đủ tên trong dot_bien.py. Đã gây: KH-API-3 soát vòng 2 lỗi 5."
- **NGUYÊN TẮC** (đề xuất `KHUON_LOI.md` K5 hoặc K2): "Bài thử đọc HTTP thì `res.setEncoding('utf8')` — ghép Buffer bằng `+=` cắt đôi chữ
  nhiều byte, đỏ oan khi dữ liệu đổi. Đã gây: thu_KHUI1 H2f sau khi dist đổi."
- **BỎ**: người gác chặn chữ in hoa trong lệnh — skill đã dặn (Edit / commit trước); lần này chỉ quên.

HEAD ĐÃ KIỂM: 4ee6a7c
