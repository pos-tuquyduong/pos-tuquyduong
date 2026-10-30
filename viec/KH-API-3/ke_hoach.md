# KH-API-3 — kế hoạch (chờ chủ quán duyệt)

## Nói ngắn (lời thường)
Việc này mở cửa Menu cho khách chưa đăng nhập, thêm bước "Tên + Cách xưng hô + Địa chỉ" khi đăng ký, và cho App tự gia hạn đăng nhập
30 ngày mỗi lần mở. Mình đã đọc code thật (dòng trích bên dưới, đọc ở commit `55a8f29`). Bạn cần: đọc mục **"Bạn cần quyết"** cuối
file (3 câu, mỗi câu đã có đề xuất) rồi trả lời "duyệt" hoặc sửa câu nào.

## Hiện trạng đã đọc (K1)
- `server/routes/kh/index.js:124` `router.use(xacThucKhach)` — mọi cửa sau dòng này bắt token; `/menu` ở `:203`, gọi `theCuaKhach(req.khach.phone)`
  (`:205`) nên không token thì hỏng.
- `index.js:29` `hoSo` = `{ sdt, ten, ngay_tao }`, dùng ở xác minh (`:81`), `GET /toi` (`:141`), `PUT /toi` (`:152`). `PUT /toi` chỉ nhận `ten` (`:149–151`).
- `server/middleware/khachAuth.js:295` `HAN_TOKEN = '30d'`; `:320` `xacThucKhach` đọc `id, phone, name, created_at` (không `SELECT *`).
- `server/utils/maKhach.js:121` `if (dung && !khach && !tenMoi) return { loi: 'CAN_TEN' }` — chưa ghi gì; `:134` INSERT khách mới (phone, name, qr…).
  Mã sống 5 phút: `:15`, `:54`. `het_han` = `strftime(now, '+5 minutes')` cùng `tao_luc = now` (`:59–60`, `:71–72`).
- `maKhach.js:86–96` `giuLuotNhanMa` đếm **mọi** dòng `pos_kh_lan_thu` theo SĐT / IP, KHÔNG lọc `loai` → nếu ghi lượt gia hạn vào bảng này
  thì gia hạn ăn mất trần nhận mã bill / nhận điểm (đường song song — K4). Vì vậy KHÔNG dùng bảng này cho gia hạn.
- `server/nang_cap/chay.js:165` `themCot` (sao lưu bảng có dòng trước ALTER); bước chạy theo số, bước hỏng thì DỪNG, bước sau không chạy (`:189–191`).
- `server/index.js:56` `trust proxy 1` → `req.ip` là IP khách.
- `pos_customers.address` có sẵn (`server/database.js:710–713`).
- Bài thử cũ đụng tới: `cong_cu/thu_KH1.js:430` khoá ĐÚNG 6 trường `/toi`; `thu_HOPDONG_KH.js:201` chỉ hiểu `token` true/false và
  `THAN` xác minh (`:172`) chỉ gửi `ten`; **`cong_cu/thu_KHUI1.js:140` khoá "/api/kh/menu không token → 401"** (ngoài Phạm vi — xem câu hỏi 1).

## Phần 1 — `GET /menu` không bắt buộc token (Nghiệm thu A)
- **A (chọn):** thêm `tuyChonKhach` ở `khachAuth.js`: không có tiêu đề `Authorization` → `req.khach = null`, đi tiếp; CÓ tiêu đề → gọi
  nguyên `xacThucKhach` (sai / hết hạn → 401 `KH_TOKEN_SAI` y như cũ). Dời route `/menu` lên khối "không cần token" (trước `:124`),
  `router.get('/menu', tuyChonKhach, …)`; `theCuaKhach` chỉ gọi khi có khách. Không token → giữ lượt chống quá tải theo IP rồi mới đọc.
  ~15 dòng, 2 file. Trường món giữ nguyên `monKhach` (không thêm trường). Không token thì `gia_hang` = các hạng đang bật (khách có token
  còn thêm hạng đã tắt của chính mình như cũ, `:207`).
- **B:** route riêng `/menu-chung`. Loại: đổi hợp đồng nhiều hơn, hai đường làm một việc (K4).
- **Chống quá tải (A, B đều cần):**
  - **A (chọn):** bộ đếm TRONG BỘ NHỚ, cửa sổ trượt: `giuLuotBoNho(khoa, tran, giay)` ở `maKhach.js` (~15 dòng), trần ở `GIOI_HAN`
    (`MENU_IP_PHUT: 300`, `GIA_HAN_KHACH_GIO: 10`). Lý do: xem menu là đọc nhiều, ghi một dòng CSDL mỗi lần xem là phí (Turso tính lượt ghi);
    Render chạy MỘT máy nên đếm trong bộ nhớ đủ; máy ngủ / khởi động lại thì đếm về 0 — chấp nhận được vì đây là chống quá tải, không phải
    khoá tiền. Dọn khoá cũ khi bộ đếm > 5000 khoá để bộ nhớ không phình.
  - **B:** bảng CSDL như `pos_kh_lan_thu`. Loại: mỗi lượt xem menu là một lượt ghi; dùng chung bảng cũ thì đụng trần nhận mã (K4 ở trên).
  - Giờ: bộ đếm dùng đồng hồ máy (`Date.now()`) chỉ để đo khoảng 60 giây / 1 giờ trong bộ nhớ — không lưu, không so với giờ đã lưu (LUAT §2 không
    áp); ghi rõ ở chú thích.

## Phần 2 — Đăng ký 3 bước (Nghiệm thu B)
- Hàm kiểm chung ở `maKhach.js` (dùng cho cả xác minh lẫn `PUT /toi` — MỘT vị từ, K4):
  - `XUNG_HO = ['anh','chi','co','chu','bac','em','ban']` (hằng có tên); `chuanXungHo(v)` → giá trị | `{ loi: 'XUNG_HO_SAI' }`
    (không gửi / `null` / `''` = không có).
  - `chuanDiaChi(v)` → chuỗi đã cắt khoảng trắng (NFC), `''` / `null` / không gửi → `null`; > 300 ký tự → `DIA_CHI_QUA_DAI`; kiểu khác
    (số, mảng…) → `YEU_CAU_KHONG_HOP_LE`. `GIOI_HAN.DIA_CHI_TOI_DA: 300`.
- Route xác minh: kiểm dạng `xung_ho` / `dia_chi` TRƯỚC khi gọi `xacMinhMa` (sai dạng → 400, không tốn lượt thử mã, không lộ SĐT có là khách
  hay không vì phép kiểm không đọc CSDL). Truyền `{ ten, xungHo, diaChi }` vào `xacMinhMa`.
- `xacMinhMa` (`:121`): `dung && !khach && (!tenMoi || !xungHo)` → `CAN_TEN`. Trước khi trả `CAN_TEN`: MỘT câu
  `UPDATE … SET het_han = strftime(now,'+10 minutes') WHERE id = ? AND dung_luc IS NULL AND het_han = strftime(tao_luc,'+5 minutes')`.
  "Một lần" giữ bằng chính điều kiện `het_han` còn bằng hạn gốc — không thêm cột. Mã đã gia hạn rồi thì câu thứ hai `changes = 0`, hạn giữ nguyên.
- INSERT khách mới (`:134`) thêm `xung_ho, address` — cùng giao dịch đang có (`:128–139`). Khách CŨ đăng nhập: `xung_ho` / `dia_chi` gửi kèm bị bỏ
  qua (như `ten` hôm nay), không ghi gì.
- B (loại): thêm cột `gia_han_luc` để đánh dấu "một lần" — thêm đổi cấu trúc ngoài phiếu.
- Ước lượng: ~35 dòng.

## Phần 3 — Hồ sơ (Nghiệm thu C)
- Bước nâng cấp `server/nang_cap/003_xung_ho_khach.js`: `themCot('pos_customers', 'xung_ho TEXT')` (~5 dòng). Bảng có dòng → tự sao lưu
  `_sao_luu_003_pos_customers` (khung có sẵn). Dữ liệu cũ không đổi (cột mới `NULL`).
- `hoSo` thêm `xung_ho: kh.xung_ho ?? null, dia_chi: kh.address ?? null`. Cả xác minh, `GET /toi`, `PUT /toi` đọc hồ sơ bằng `SELECT *` của
  đúng dòng khách (hàm `docKhach(id)` một chỗ) rồi qua `hoSo` (danh sách TRẮNG — không lộ PIN / cột khác).
  - **Vì sao không thêm `xung_ho` vào câu SELECT của `xacThucKhach`:** bước nâng cấp hỏng (vd bước 002 của KHO-2a hỏng thì 003 KHÔNG chạy,
    `chay.js:189–191`) → câu SELECT nêu tên cột sẽ 500 MỌI cửa cần token. Đọc `SELECT *` + `?? null` thì thiếu cột chỉ ra `null`
    (CLAUDE.md §5.3 — lỗi không lan). Còn lại khi cột thiếu: tạo khách mới / sửa xưng hô báo 500 — ghi ở CHƯA KIỂM.
- `PUT /toi`: nhận `ten`, `xung_ho`, `dia_chi`, mỗi trường tuỳ chọn; "có gửi" = khoá có trong thân. Không khoá nào → 400 `YEU_CAU_KHONG_HOP_LE`;
  `ten` gửi mà rỗng / quá dài → `TEN_KHONG_HOP_LE` (như cũ); `xung_ho` sai (kể cả `''` / `null` — không cho xoá xưng hô) → `XUNG_HO_SAI`;
  `dia_chi: ''` hoặc `null` → xoá. MỘT câu UPDATE chỉ các cột được gửi. App v2 gửi `{ ten }` → y như cũ.
- Ước lượng: ~30 dòng.

## Phần 4 — Tự gia hạn (Nghiệm thu D)
- `POST /gia-han` sau `xacThucKhach` (token phải CÒN HẠN — `jwt.verify` kiểm `exp`; hết hạn / sai → 401 `KH_TOKEN_SAI`). Giữ lượt
  `giuLuotBoNho('gh:' + id, 10, 3600)` → hết lượt 429 `QUA_NHIEU_LAN`. Trả `{ success, token, het_han }`, `het_han` = giờ hết hạn của token
  mới đổi ra giờ VN dạng `YYYY-MM-DDTHH:mm:ss`.
- **Token cũ còn dùng được tới hạn cũ** (không thu hồi). Lý do: token là JWT không lưu ở máy chủ — thu hồi cần sổ phiên, mà sổ phiên là việc
  KH-TACH-1 (phiếu Cấm). Không làm yếu đi: token cũ cùng khách, cùng quyền, hạn cũ ≤ hạn mới; kẻ cầm token cũ vốn đã dùng được tới hạn đó, và gia
  hạn chỉ cấp cho người đang cầm token còn hạn. Hệ quả: "30 ngày không mở app → hết hạn" vẫn đúng (mỗi token tự hết sau 30 ngày kể từ lúc cấp).
- Đổi giờ: phương án **A** — `khachAuth.js` thêm `hanTokenKhach(token)` (đọc `exp`, đổi sang giờ VN bằng đúng cách `getNow` làm: `toLocaleString('sv-SE',
  { timeZone: 'Asia/Ho_Chi_Minh' })`) — 3 dòng, lặp lại cách định dạng của `getNow`. **B** — `getNow(ngay = new Date())` thêm một tham số ở
  `server/utils/helpers.js` (1 dòng, giữ mọi chỗ gọi cũ) rồi gọi `getNow(new Date(exp*1000))` — đúng "một quy tắc một hàm" nhưng `helpers.js`
  NGOÀI Phạm vi. Xem câu hỏi 3.
- Ước lượng: ~20 dòng.

## Phần 5 — Hợp đồng v3 (Nghiệm thu E)
- `HOP_DONG_API_KH.md`: `PHIEN_BAN: 3`, NGAY, DOC_TU_CODE; bảng: `/menu` token "không bắt buộc" (khối máy đọc `"token": "tuy_chon"`), thân
  mới của xác minh `{ sdt, ma, ten?, xung_ho?, dia_chi? }` (khách mới phải có `ten` + `xung_ho`), `/toi` + `PUT /toi` + xác minh trả thêm
  `xung_ho`, `dia_chi`; cửa `POST /gia-han`; mã lỗi `XUNG_HO_SAI`, `DIA_CHI_QUA_DAI`; ghi chú giới hạn (menu không token 300 / phút / IP; gia
  hạn 10 / giờ / khách; token cũ còn dùng tới hạn cũ); dòng nhật ký v3. Không xoá / đổi tên trường nào.
- `cong_cu/thu_HOPDONG_KH.js`: hiểu ba giá trị `token`: `true` (như cũ), `false` (như cũ), `"tuy_chon"` → gọi CÓ token (200 + đủ trường),
  KHÔNG token (200 + đủ trường) và token SAI (401 `KH_TOKEN_SAI`); giá trị khác → ĐỎ. `THAN` xác minh gửi thêm `xung_ho`, `dia_chi` (khách mẫu là
  khách mới); thêm `THAN` cho `POST /gia-han` (không thân). Sửa chú thích đầu bài (dòng 10–11) theo ba giá trị.
- `kiem_tra_truoc_khi_giao.js:495`: thêm `cong_cu/thu_KHAPI3.js` vào danh sách bài chạy thật (chỉ THÊM — K8 cho phép).
- Ước lượng: ~40 dòng hợp đồng + ~15 dòng bài thử hợp đồng.

## Tổng ngân sách
Máy chủ ~105 dòng (dưới ~220 của phiếu) · bài thử mới `thu_KHAPI3.js` ~330 dòng + sửa `thu_HOPDONG_KH.js` ~15 + `thu_KH1.js` 1 dòng.
Không thư viện mới. File đổi (đều trong Phạm vi): `server/routes/kh/index.js`, `server/routes/kh/loi.js`, `server/middleware/khachAuth.js`,
`server/utils/maKhach.js`, `server/nang_cap/003_xung_ho_khach.js` (mới), `HOP_DONG_API_KH.md`, `cong_cu/thu_KHAPI3.js` (mới),
`cong_cu/thu_HOPDONG_KH.js`, `cong_cu/thu_KH1.js`, `kiem_tra_truoc_khi_giao.js`, `viec/KH-API-3/*`.

## Bài thử `cong_cu/thu_KHAPI3.js` — ca ↔ Nghiệm thu (khuôn `thu_KH1.js`: database.js thật, kho tạm, chỉ thay ketNoiKho; `process.env.TZ='UTC'`
đặt ở ĐẦU bài trước mọi `Date`; app thử `trust proxy 1` như index.js, đổi IP bằng `X-Forwarded-For`; thời gian trôi = lùi cột giờ trong kho tạm)
| Nghiệm thu | Ca | Trên gốc |
|---|---|---|
| A | A1 không token → 200, mỗi món ĐÚNG bộ khoá như có token, có `gia_hang` (đối chiếu từng món với lượt có token cùng lúc) | ĐỎ (401) |
| A | A2 token hợp lệ → 200 như cũ; A3 token sai / token hết hạn (ký `exp` quá khứ) / `Authorization: Basic x` → 401 `KH_TOKEN_SAI` | xanh (hồi quy) |
| A | A4 cùng IP 300 lần → lần 300 vẫn 200; lần 301 → 429 `QUA_NHIEU_LAN`; IP khác cùng lúc → 200; có token (cùng IP đã hết lượt) → 200 | ĐỎ |
| A | A5 không token: KHÔNG có hạng đã tắt trong `gia_hang` (chỉ hạng đang bật) | ĐỎ |
| B | B1 khách mới có tên, thiếu xưng hô → `CAN_TEN`; có xưng hô thiếu tên → `CAN_TEN`; B2 `xung_ho: 'ong'` → 400 `XUNG_HO_SAI`, mã KHÔNG tốn lượt | ĐỎ |
| B | B3 `dia_chi` 301 ký tự → 400 `DIA_CHI_QUA_DAI`; 300 ký tự → qua (ca ngay dưới / ngay trên) | ĐỎ |
| B | B4 tạo khách: đọc thẳng CSDL `name`, `xung_ho`, `address` đúng (địa chỉ đã cắt khoảng trắng); không gửi địa chỉ → `address` NULL | ĐỎ |
| B | B5 mã đúng + `CAN_TEN` lúc mã đã 4 phút → (lùi 8 phút = 12 phút từ lúc tạo) vẫn đăng nhập được; mã khác lùi 12 phút sau `CAN_TEN` (16 phút) → `MA_HET_HAN` | ĐỎ |
| B | B6 "một lần": `CAN_TEN` lần hai sau khi đã gia hạn → `het_han` KHÔNG đổi; mã SAI không bao giờ được gia hạn (`MA_SAI`, `het_han` giữ nguyên) | ĐỎ / xanh |
| B | B7 hai phiên cùng dùng một mã sau `CAN_TEN` (gửi song song đủ thông tin) → đúng MỘT 200, một khách | xanh (hồi quy) |
| C | C1 `GET /toi` có `xung_ho`, `dia_chi` (khách quầy cũ → cả hai `null`) | ĐỎ |
| C | C2 `PUT /toi` đổi `dia_chi` → CSDL đổi; `dia_chi: ''` → `address` NULL; đổi `xung_ho`; `xung_ho` sai → 400 `XUNG_HO_SAI`, CSDL không đổi | ĐỎ |
| C | C3 `PUT /toi {}` → 400 `YEU_CAU_KHONG_HOP_LE`; `{ ten: '' }` → `TEN_KHONG_HOP_LE`; `{ ten }` (App v2) → 200 như cũ | ĐỎ (C3a) |
| C | C4 bước nâng cấp: kho tạm có `pos_nang_cap` dòng 3, cột `xung_ho` có; chạy lại `chayNangCap` lần hai không lỗi; bảng `_sao_luu_003_pos_customers` có khi bảng có dòng | ĐỎ |
| D | D1 `POST /gia-han` → 200, `token` mới gọi `/toi` được; `het_han` = giờ VN (so `exp` đổi tay +7 giờ, TZ=UTC) cách bây giờ 30 ngày ± 1 phút, đúng dạng không hậu tố | ĐỎ |
| D | D2 token hết hạn / sai / không token → 401; D3 lần 10 → 200, lần 11 → 429 `QUA_NHIEU_LAN`; khách khác không bị ảnh hưởng | ĐỎ |
| D | D4 token CŨ vẫn gọi `/toi` được sau khi gia hạn (đúng quyết định "không thu hồi") | ĐỎ (cửa chưa có) |
| E | `thu_HOPDONG_KH.js` xanh với v3 (gọi `/menu` có / không / sai token, `/gia-han`, trường mới) | ĐỎ (cửa `/gia-han` chưa có route) |
| F | F1 khách CŨ đăng nhập chỉ `{ sdt, ma }` (App v2) → 200; F2 `PUT /toi { ten }` → 200; F3 `nhan-diem` / `PUT /pin` / quầy cấp mã vẫn chạy — phủ bởi `thu_KH1.js` + `thu_KHAPI2.js` (npm test) | xanh (hồi quy) |
| F | F4 nhận mã bill sau 11 lần gia hạn vẫn còn lượt (gia hạn KHÔNG ăn trần `pos_kh_lan_thu` — K4) | xanh (hồi quy, có đột biến) |

`thu_KH1.js:430`: mở danh sách trắng `/toi` thêm đúng `dia_chi`, `xung_ho` (vẫn so BẰNG — LUAT §6 mục 7), `SỐ CA` ghi lại.

## Đột biến (`viec/KH-API-3/dot_bien.py`, mỗi chỗ vá ≥ 1, có đối chứng)
- BV-MENU-TOKEN (dời `/menu` về sau `xacThucKhach`) → A1 ĐỎ · VS-MENU-BO-QUA-TOKEN-SAI (`tuyChonKhach` nuốt token sai thành khách rỗng) → A3 ĐỎ
- BV-MENU-GIOI-HAN (bỏ giữ lượt) → A4 ĐỎ · VS-MENU-TRAN-301 (trần 301) → A4 ĐỎ · VS-MENU-DEM-CA-TOKEN (đếm cả lượt có token) → A4 ĐỎ
- BV-XUNG-HO-CAN-TEN (bỏ `|| !xungHo`) → B1 ĐỎ · VS-XUNG-HO-LA (bỏ kiểm danh sách) → B2 ĐỎ · VS-DIA-CHI-300 (`>= 300`) → B3 ĐỎ
- BV-INSERT-XUNG-HO (INSERT không lưu xưng hô) → B4 ĐỎ · BV-GIA-HAN-MA (bỏ UPDATE hạn) → B5 ĐỎ · VS-GIA-HAN-MA-MAI (bỏ điều kiện "một lần") → B6 ĐỎ
- VS-PUT-RONG (thân rỗng → 200) → C3 ĐỎ · VS-PUT-DIA-CHI-KHONG-XOA (`''` giữ chuỗi rỗng) → C2 ĐỎ · BV-HOSO-XUNG-HO → C1 ĐỎ
- BV-GIA-HAN-TRAN (bỏ giữ lượt gia hạn) → D3 ĐỎ · VS-GIA-HAN-UTC (`het_han` theo UTC) → D1 ĐỎ · VS-GIA-HAN-BANG-LAN-THU (ghi lượt gia hạn vào
  `pos_kh_lan_thu`) → F4 ĐỎ · BV-NANG-CAP-003 (xoá bước) → C4 ĐỎ

## Đường song song phải canh (K4)
- Mọi chỗ trả hồ sơ khách: xác minh `:81`, `GET /toi` `:141`, `PUT /toi` `:152` → cùng `hoSo` + `docKhach`.
- Mọi chỗ trả `CAN_TEN`: chỉ `maKhach.js:121` (grep `CAN_TEN` trong `server/`: loi.js + maKhach.js).
- Mọi chỗ tạo khách từ App: chỉ `maKhach.js:134`. Quầy tạo khách (`customers*.js`) không đụng — cột mới cho `NULL`.
- Mọi chỗ ký token khách: `kyTokenKhach` (xác minh + gia hạn) — cùng `HAN_TOKEN`.
- Mọi chỗ đếm `pos_kh_lan_thu`: gia hạn KHÔNG ghi vào đây (F4 khoá).
- Mọi chỗ kiểm `xung_ho` / `dia_chi`: xác minh + `PUT /toi` dùng cùng `chuanXungHo` / `chuanDiaChi`.

## Luồng hợp lệ phải KHÔNG bị chặn (K5)
1. App v2: khách cũ đăng nhập `{ sdt, ma }` → 200 (F1). 2. App v2: `PUT /toi { ten }` → 200 (F2/C3). 3. App v2: `/menu` có token → 200 (A2).
4. Khách thật xem menu bình thường (vài chục lượt / phút) không chạm 300 (A4 ngay dưới trần). 5. Nhiều khách sau CÙNG một wifi quán (cùng IP) xem
menu: 300 / phút chia chung — đủ cho quán nhỏ; ghi CHƯA KIỂM số đo thật. 6. Khách mở app nhiều lần / ngày: ≤ 10 lần gia hạn / giờ (App gọi 1 lần / ngày).
7. Khách quầy cũ không có xưng hô / địa chỉ → `/toi` trả `null`, không lỗi (C1). 8. Quầy, nhận điểm, PIN, cấp mã — `thu_KH1.js`, `thu_KHAPI2.js` xanh.
9. Dữ liệu cũ: mã đăng nhập đang sống lúc lên bản mới vẫn dùng được (điều kiện gia hạn chỉ thêm, không chặn).

## Bạn cần quyết (mỗi câu có đề xuất — chỉ cần trả "duyệt")
1. **Bài thử cũ `cong_cu/thu_KHUI1.js:140`** (của việc KH-UI-1, App KH cũ) đang khẳng định "menu không token → 401". Việc này làm đúng điều ngược
   lại, nên bài đó sẽ báo đỏ khi chạy tay. Nó KHÔNG nằm trong `npm test` (chỉ `kiem_tra_truoc_khi_giao.js:495` liệt kê bài chạy — không có KHUI1)
   và NGOÀI Phạm vi. **Đề xuất:** thêm `cong_cu/thu_KHUI1.js` vào Phạm vi + mục `## Bài thử cũ sửa`, mình đổi ca H3 sang `/api/kh/toi` (vẫn cần
   token). Nếu không duyệt: mình ghi Phát hiện, để nguyên.
2. **App bản đang dùng (v2) + khách MỚI:** sổ quyết định 29.10 chốt xưng hô BẮT BUỘC, nên App v2 (form chỉ có Tên) gặp `CAN_TEN` mãi khi khách mới
   đăng ký. Khách CŨ trên App v2 không bị gì. **Đề xuất:** làm đúng sổ quyết định (bắt buộc), vì App KH mới chưa mở cho khách; App KH cần lên
   bản có ô xưng hô trước khai trương (mình ghi vào nhật ký hợp đồng v3).
3. **Đổi giờ hết hạn token sang giờ VN:** **Đề xuất B** — thêm `server/utils/helpers.js` vào Phạm vi để `getNow` nhận một tham số tuỳ chọn
   (1 dòng, mọi chỗ gọi cũ giữ nguyên), đúng luật "một quy tắc một hàm". Không duyệt thì làm A (3 dòng chép cách định dạng trong `khachAuth.js`).
