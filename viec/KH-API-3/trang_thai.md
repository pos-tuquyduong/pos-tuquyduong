# KH-API-3 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: `viec/KH-API-3`; cây sạch. HEAD `55a8f29` · FETCH_HEAD `55a8f29` (bằng nhau — không kéo).
- `git log --oneline -3`:
  - 55a8f29 PHIEU: KH-API-3
  - 7a3930f TIEN-DO: KH-API-2 (6f2c30b) xong; mo KH-API-3; them KHACH-CK-1; quyet dinh 29-30.10; luat noi de hieu + duyet 2 luot; tu-chay 1.8.1 (KHUNG-KEO-1) — so v47
  - 6f2c30b Merge pull request #51 from pos-tuquyduong/viec/KH-API-2
- Phiên tiếp (sau duyệt): HEAD `236b3dc` = FETCH_HEAD `236b3dc` — không kéo.

## Tiến độ
- Bước 3: kế hoạch duyệt 30.10 (chủ quán: câu 1 đồng ý thêm `thu_KHUI1.js`, `thu_P15QR.js` vào Phạm vi; câu 2 xưng hô bắt buộc với khách mới;
  câu 3 một địa chỉ chung quầy ↔ App).
- Bước 4–6: bài thử đỏ trên gốc (`bang_chung_do.txt`), code vá, `thu_KHAPI3.js` 58/58, `thu_KH1.js` 157/157, `thu_HOPDONG_KH.js` 67/67,
  đột biến 28/28 BẮT. `npm test` / `--day-du`: xanh trừ `cong_cu/thu_KHO1.js` (ngoài Phạm vi — Câu hỏi 1).

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
| `POST /gia-han` + trần | BV-GIA-HAN-TRAN, VS-GIA-HAN-UTC, VS-GIA-HAN-BANG-LAN-THU |
| hợp đồng v3 + bài thử hợp đồng | BV-HOPDONG-TUY-CHON, VS-HOPDONG-GIA-TRI-LA, BV-HOPDONG-GIA-HAN |

Mọi tên đột biến: BV-MENU-BAT-DANG-NHAP · VS-MENU-NUOT-MA-SAI · BV-MENU-GIOI-HAN · VS-MENU-TRAN-301 · VS-MENU-DEM-CA-CO-DANG-NHAP · VS-CUA-SO-LECH ·
VS-TRAN-LECH · BV-XUNG-HO-CAN-TEN · VS-XUNG-HO-LA · VS-XUNG-HO-THIEU-BAN · VS-DIA-CHI-300 · VS-DIA-CHI-KHONG-CAT · BV-INSERT-XUNG-HO · BV-GIA-HAN-MA ·
VS-GIA-HAN-11-PHUT · VS-GIA-HAN-MA-MAI · VS-KIEM-CA-KHACH-CU · VS-PUT-RONG · VS-PUT-DIA-CHI-KHONG-XOA · VS-PUT-XUNG-HO-RONG-XOA · BV-HOSO-XUNG-HO ·
BV-NANG-CAP-003 · BV-GIA-HAN-TRAN · VS-GIA-HAN-UTC · VS-GIA-HAN-BANG-LAN-THU · BV-HOPDONG-TUY-CHON · VS-HOPDONG-GIA-TRI-LA · BV-HOPDONG-GIA-HAN

Lần chạy đầu: 27/28 BẮT — VS-KIEM-CA-KHACH-CU SỐNG vì chính đột biến viết sai (vẫn giữ `if (sai) return sai;` trong khối khách mới → hành vi
không đổi). Sửa đột biến (83b28af) → BẮT. Không đổi bài thử.

## Câu hỏi (chờ chủ quán — người gác chặn sửa file ngoài Phạm vi và chặn sửa phiếu, `G5-NGOAIPV` / `G1-PHIEU`)
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
- Chưa soát vòng 2: bộ kiểm còn đỏ vì `thu_KHO1.js` (ngoài Phạm vi) và phiếu còn chờ sửa — soát lại khi `/lam-viec KH-API-3 tiep`.

## Cổng (`node tu_chay/cong.js chay . 55a8f29^ HEAD viec/KH-API-3`, HEAD 8be85de, cây sạch)
```
· CẢNH BÁO A16: `cong_cu/thu_KHAPI3.js` chạy trên gốc in 60 ca ≠ 62 ca ở head — (2 ca C4 chỉ chạy khi có bước 3 — đúng thiết kế)
✗ [A11] bài thử `cong_cu/thu_HOPDONG_KH.js` XANH trên code gốc — bài thử vô giá trị (K3), phải đỏ trước khi vá
✗ [A13] `npm test` đỏ:            (chỉ ✗ bài chạy thật cong_cu/thu_KHO1.js — B1, B2)
✗ [A13] `node kiem_tra_truoc_khi_giao.js --day-du` đỏ:   (cùng thu_KHO1.js; PASS 82 · FAIL 1)
✗ CỔNG ĐỎ (CHẠY) — 3 lý do
```
Cả ba chờ chủ quán sửa phiếu (mục Câu hỏi): A11 ← dòng `## Bài thử cũ sửa` cho `thu_HOPDONG_KH.js`; A13 ← `thu_KHO1.js` vào Phạm vi.

## Nghiệm thu — đếm từng mục
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

## Báo cáo 7 mục
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

## Bài học
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
