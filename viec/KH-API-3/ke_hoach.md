# KH-API-3 — kế hoạch (chờ chủ quán duyệt)

## Nói ngắn (lời thường)
Việc này mở cửa Menu cho khách chưa đăng nhập, thêm bước "Tên + Cách xưng hô + Địa chỉ" khi đăng ký, và cho App tự gia hạn đăng nhập
30 ngày mỗi lần mở. Mình đã đọc code thật (dòng trích bên dưới, đọc ở commit `55a8f29`) và nhờ một agent độc lập soát kế hoạch (vòng 1 —
đã sửa theo, xem cuối file). Bạn cần: đọc mục **"Bạn cần quyết"** (3 câu, mỗi câu có đề xuất) rồi trả lời "duyệt" hoặc sửa câu nào.

## Hiện trạng đã đọc (K1)
- `server/routes/kh/index.js:124` `router.use(xacThucKhach)` — mọi cửa sau dòng này bắt token; `/menu` ở `:203`, gọi `theCuaKhach(req.khach.phone)`
  (`:205`) nên không token thì hỏng. `/hang`, `/gio-vang`, `/gio-hoat-dong` (`:88–121`) đã mở không token và KHÔNG có giới hạn lượt.
- `index.js:29` `hoSo` = `{ sdt, ten, ngay_tao }`, dùng ở xác minh (`:81`, đọc khách ở `:80`), `GET /toi` (`:141`), `PUT /toi` (`:152`).
  `PUT /toi` chỉ nhận `ten` (`:149–151`).
- `server/middleware/khachAuth.js:11` `HAN_TOKEN = '30d'`; `:36` `xacThucKhach` đọc `id, phone, name, created_at`.
- `server/utils/maKhach.js:121` `if (dung && !khach && !tenMoi) return { loi: 'CAN_TEN' }` — chưa ghi gì (chú thích `:102` nói vậy); `:134` INSERT
  khách mới. Mã sống 5 phút: `:15`, `hanMa()` `:54`; hằng `GIO` `:27`. Cả mã quầy (`:59–60`) lẫn mã App (`:71–76`) đặt `tao_luc = now`,
  `het_han = GIO(now, hanMa())`.
- `maKhach.js:86–96` `giuLuotNhanMa` đếm **mọi** dòng `pos_kh_lan_thu` theo SĐT / IP, KHÔNG lọc `loai` → ghi lượt gia hạn vào bảng này sẽ ăn
  mất trần nhận mã bill / nhận điểm (K4). Vì vậy KHÔNG dùng bảng này cho gia hạn.
- `server/nang_cap/chay.js:18` `themCot` (sao lưu bảng có dòng trước ALTER); bước hỏng thì DỪNG, bước sau không chạy (`:42–44`).
- `server/index.js:55–56` `trust proxy 1`, chú thích ghi số tầng proxy của Render CHƯA kiểm.
- `pos_customers.address` có sẵn (`server/database.js:710–713`), quầy cũng sửa cột này (`customers-v2.js`, dùng in hoá đơn).
- Bài thử cũ đụng tới: `cong_cu/thu_KH1.js:165` hàm `xacMinh` chỉ gửi `ten` (dùng cho mọi lượt tạo khách trong bài, vd `:266–279`) và `:430`
  khoá ĐÚNG 6 trường `/toi`; `thu_HOPDONG_KH.js:201` chỉ hiểu `token` true/false, `THAN` xác minh chỉ gửi `ten`. NGOÀI Phạm vi:
  `cong_cu/thu_KHUI1.js:140` khoá "/api/kh/menu không token → 401"; `cong_cu/thu_P15QR.js:147` tạo khách mới qua App chỉ có `ten` → chờ 200.
  Hai bài này KHÔNG nằm trong danh sách chạy của `kiem_tra_truoc_khi_giao.js:495` (xem câu hỏi 1).

## Phần 1 — `GET /menu` không bắt buộc token (Nghiệm thu A)
- **A (chọn):** `khachAuth.js` thêm `tuyChonKhach`: không có tiêu đề `Authorization` → `req.khach = null`, đi tiếp; CÓ tiêu đề → gọi nguyên
  `xacThucKhach` (sai / hết hạn / `Bearer null` → 401 `KH_TOKEN_SAI` như cũ — hợp đồng ghi rõ: chưa đăng nhập thì App KHÔNG gửi tiêu đề này).
  Dời route `/menu` lên khối "không cần token" (trước `:124`): `router.get('/menu', tuyChonKhach, …)`; `theCuaKhach` chỉ gọi khi có khách.
  Không token → giữ lượt theo IP trước khi đọc. ~15 dòng, 2 file. Trường món giữ nguyên `monKhach`. Không token thì `gia_hang` = các hạng đang
  bật (khách có token còn thêm hạng đã tắt của chính mình như cũ, `:207`).
- **B:** route riêng `/menu-chung`. Loại: hai đường làm một việc (K4), đổi hợp đồng nhiều hơn.
- **Chống quá tải:**
  - **A (chọn):** bộ đếm TRONG BỘ NHỚ, cửa sổ CỐ ĐỊNH: `giuLuotBoNho(khoa, tran, giay, luc = Date.now())` ở `maKhach.js` — `Map(khoa → { bat_dau, dem })`,
    ~10 dòng; tham số `luc` để bài thử thử được lúc hết cửa sổ (không ngủ). Trần ở `GIOI_HAN`: `MENU_IP_PHUT: 300`, `GIA_HAN_KHACH_GIO: 10`.
    Map > 5000 khoá thì chỉ xoá khoá ĐÃ HẾT cửa sổ (không xoá khoá đang đếm — đổi IP liên tục không tự xoá lượt của mình được).
    Lý do chọn: xem menu là đọc nhiều, ghi một dòng CSDL mỗi lượt xem là phí lượt ghi Turso; Render chạy một máy. Giới hạn đã biết (ghi vào
    hợp đồng + CHƯA KIỂM): khởi động lại / máy ngủ → đếm về 0; cửa sổ cố định cho phép tối đa 2 × trần quanh mốc đổi cửa sổ — chấp nhận vì đây là
    chống quá tải, không phải khoá tiền. `Date.now()` chỉ đo khoảng trong bộ nhớ, không lưu, không so với giờ đã lưu (LUAT §2 không áp).
  - **B:** bảng CSDL. Loại: mỗi lượt xem menu là một lượt ghi; dùng chung `pos_kh_lan_thu` thì đụng trần nhận mã (K4).
  - `/hang`, `/gio-vang`, `/gio-hoat-dong` không thêm giới hạn: phiếu chỉ giao `/menu` (ghi Phát hiện, không mở rộng).

## Phần 2 — Đăng ký 3 bước (Nghiệm thu B)
- Hàm kiểm chung ở `maKhach.js`, MỘT nghĩa cho cả xác minh lẫn `PUT /toi` (K4):
  - `XUNG_HO = ['anh','chi','co','chu','bac','em','ban']` (hằng có tên). `chuanXungHo(v)`: không gửi / `null` / `''` → `null` (= "không có");
    đúng danh sách → giá trị; còn lại → `{ loi: 'XUNG_HO_SAI' }`.
  - `chuanDiaChi(v)`: không gửi / `null` / chuỗi toàn khoảng trắng → `null`; chuỗi → cắt khoảng trắng (NFC), > 300 ký tự → `DIA_CHI_QUA_DAI`;
    kiểu khác (số, mảng…) → `YEU_CAU_KHONG_HOP_LE`. `GIOI_HAN.DIA_CHI_TOI_DA: 300`.
- `xacMinhMa(sdt, ma, { ten, xungHo, diaChi })` — chỉ kiểm thông tin khi SẮP TẠO khách mới (`dung && !khach`), ngay chỗ `:121`:
  sai dạng `xung_ho` / `dia_chi` → `XUNG_HO_SAI` / `DIA_CHI_QUA_DAI` (không tốn lượt thử, chỉ người cầm mã đúng thấy); thiếu tên HOẶC xưng hô →
  `CAN_TEN`. **Khách CŨ** đăng nhập: `xung_ho` / `dia_chi` gửi kèm bị bỏ qua hoàn toàn (không kiểm, không ghi — như `ten` hôm nay), nên khách cũ
  không bao giờ bị chặn đăng nhập vì hai trường này. Cách kiểm mã không đổi (phiếu Cấm).
- Trước khi trả `CAN_TEN` (mã đã đúng): MỘT câu
  `UPDATE pos_kh_ma_dang_nhap SET het_han = ${GIO} WHERE id = ? AND dung_luc IS NULL AND het_han = ${GIO}` với tham số
  `(now, '+10 minutes', id, tao_luc, hanMa())` — dùng lại `GIO` + `hanMa()`, không viết chữ cứng. "Một lần" = điều kiện `het_han` còn bằng
  hạn gốc; lần sau `changes = 0`, hạn giữ nguyên. Không thêm cột. Đúng cho cả mã quầy lẫn mã App (cùng cách đặt hạn). Hàng đặt `het_han`
  tay (bài thử cũ) hoặc mã tạo trước khi đổi `HAN_MA_PHUT` → không được gia hạn (an toàn: chỉ mất phần "thêm 10 phút").
  Hằng `GIOI_HAN.THEM_PHUT_CAN_TEN: 10`. Sửa chú thích `:102` ("KHÔNG ghi gì" → "chỉ gia hạn mã một lần").
- INSERT khách mới (`:134`) thêm `xung_ho, address` — trong CÙNG giao dịch có sẵn (`:128–139`).
- B (loại): thêm cột `gia_han_luc` để đánh dấu "một lần" — đổi cấu trúc ngoài phiếu.
- ~35 dòng.

## Phần 3 — Hồ sơ (Nghiệm thu C)
- Bước nâng cấp `server/nang_cap/003_xung_ho_khach.js`: `themCot('pos_customers', 'xung_ho TEXT')` (~5 dòng), tự sao lưu
  `_sao_luu_003_pos_customers`. Dữ liệu cũ không đổi (cột mới `NULL`).
- `xacThucKhach` (`khachAuth.js:36`) và câu đọc khách của xác minh (`index.js:80`) đổi sang `SELECT *` (không nêu tên cột mới) → `req.khach`
  có đủ cột; `hoSo` thêm `xung_ho: kh.xung_ho ?? null, dia_chi: kh.address ?? null` (vẫn là danh sách TRẮNG — không lộ PIN / cột khác).
  - Vì sao không nêu tên cột `xung_ho` trong câu SELECT: bước nâng cấp hỏng (vd bước 002 KHO-2a hỏng → 003 KHÔNG chạy, `chay.js:42–44`) thì
    câu nêu tên cột sẽ 500 MỌI cửa cần token. `SELECT *` + `?? null` → thiếu cột chỉ ra `null` (CLAUDE.md §5.3). Còn lại khi thiếu cột: tạo
    khách mới / sửa xưng hô báo 500 — ghi ở CHƯA KIỂM.
  - `req.khach` đi vào `quaToken` (`index.js:216`) của nhận mã bill / nhận điểm — hai hàm đó chỉ đọc `phone` từ thân (đã đọc `:216`), cột
    thêm không ra ngoài. Sẽ grep `req.khach` / `khach.` trong `signup-codes.js` để chắc trước khi sửa.
- `PUT /toi`: nhận `ten`, `xung_ho`, `dia_chi`; "có gửi" = khoá có trong thân. Không khoá nào → 400 `YEU_CAU_KHONG_HOP_LE`; `ten` gửi mà rỗng /
  quá dài → `TEN_KHONG_HOP_LE` (như cũ); `xung_ho` gửi mà `chuanXungHo` ra lỗi HOẶC ra `null` → `XUNG_HO_SAI` (gửi khoá thì phải có giá trị —
  cùng cách `ten`, không cho xoá xưng hô); `dia_chi` lỗi → mã lỗi của `chuanDiaChi`, ra `null` → xoá. MỘT câu UPDATE chỉ các cột được gửi,
  trả `hoSo({ ...req.khach, ...đổi })`. App v2 gửi `{ ten }` → y như cũ.
- `dia_chi` chính là cột `address` quầy dùng in hoá đơn — MỘT địa chỉ cho một khách (một nguồn sự thật): khách xoá trên App thì quầy cũng
  thấy rỗng. Xem câu hỏi 3.
- ~30 dòng.

## Phần 4 — Tự gia hạn (Nghiệm thu D)
- `POST /gia-han` sau `xacThucKhach` (token phải CÒN HẠN — `jwt.verify` kiểm `exp`; hết hạn / sai → 401 `KH_TOKEN_SAI`). Giữ lượt
  `giuLuotBoNho('gh:' + id, 10, 3600_000)` → hết lượt 429 `QUA_NHIEU_LAN`. Trả `{ success, token, het_han }`.
- `het_han`: `khachAuth.js` thêm `hanTokenKhach(token)` — đọc `exp` của token vừa ký, đổi ra giờ VN `YYYY-MM-DDTHH:mm:ss` đúng cách `getNow`
  làm (`toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })`), 3 dòng, nằm trong Phạm vi (không cần mở `helpers.js`).
- **Token cũ còn dùng được tới hạn cũ** (không thu hồi). Lý do: token là JWT không lưu ở máy chủ — thu hồi cần sổ phiên, là việc KH-TACH-1
  (phiếu Cấm). Không làm yếu đi: token cũ cùng khách, cùng quyền, hạn cũ ≤ hạn mới; người cầm token cũ vốn dùng được tới hạn đó, và gia hạn chỉ
  cấp cho người đang cầm token còn hạn. "30 ngày không mở app → hết hạn" vẫn đúng (mỗi token tự hết 30 ngày sau lúc cấp).
- ~20 dòng.

## Phần 5 — Hợp đồng v3 (Nghiệm thu E)
- `HOP_DONG_API_KH.md`: `PHIEN_BAN: 3`, NGAY, DOC_TU_CODE; mục Chung dòng 13 ("Thiếu / sai / hết hạn → 401") thêm ngoại lệ cửa "không bắt
  buộc"; bảng: `/menu` token "không bắt buộc" (khối máy đọc `"token": "tuy_chon"`; chưa đăng nhập thì KHÔNG gửi `Authorization`), thân mới xác
  minh `{ sdt, ma, ten?, xung_ho?, dia_chi? }` (khách mới phải có `ten` + `xung_ho`; khách cũ bỏ qua), `/toi`, `PUT /toi`, xác minh trả thêm
  `xung_ho`, `dia_chi`; thân mới `PUT /toi`; cửa `POST /gia-han`; mã lỗi `XUNG_HO_SAI`, `DIA_CHI_QUA_DAI`; ghi chú giới hạn (menu không token
  300 / phút / IP; gia hạn 10 / giờ / khách; đếm trong bộ nhớ; token cũ còn dùng tới hạn cũ; mã đúng + `CAN_TEN` sống thêm 10 phút một lần);
  nhật ký v3 (gồm: App bản cũ không có ô xưng hô thì khách MỚI không tạo được tài khoản). Không xoá / đổi tên trường nào.
- `cong_cu/thu_HOPDONG_KH.js`: `token` `true` / `false` như cũ; `"tuy_chon"` → gọi CÓ token, KHÔNG token (cả hai 200 + đủ trường) và token
  SAI (401 `KH_TOKEN_SAI`); giá trị khác → ĐỎ. `THAN` xác minh thêm `xung_ho`, `dia_chi`; `POST /gia-han` không thân. Sửa chú thích đầu bài.
- `kiem_tra_truoc_khi_giao.js:495`: THÊM `cong_cu/thu_KHAPI3.js` vào danh sách bài chạy thật (K8 cho phép thêm).
- ~45 dòng hợp đồng + ~15 dòng bài thử hợp đồng.

## Tổng ngân sách
Máy chủ ~105 dòng (dưới ~220) · `thu_KHAPI3.js` ~350 dòng · `thu_HOPDONG_KH.js` ~15 · `thu_KH1.js` 2 dòng: hàm `xacMinh` (`:165`) gửi
thêm `xung_ho: 'anh'` khi có `ten` (giữ mọi ca cũ đúng nghĩa — ca "không ten → CAN_TEN" vẫn không gửi gì) + danh sách trắng `/toi` (`:430`)
thêm đúng `dia_chi`, `xung_ho` (vẫn so BẰNG — LUAT §6 mục 7). Ghi chú Ngân sách của phiếu chỉ nói danh sách trắng; dòng `:165` là bài cũ phải
đổi vì hành vi đã được duyệt đổi (xưng hô bắt buộc) — LUAT §6 mục 8: bài SỬA bình thường (đỏ trên gốc, xanh trên mới, `SỐ CA`).
Không thư viện mới. File đổi (đều trong Phạm vi): `server/routes/kh/index.js`, `server/routes/kh/loi.js`, `server/middleware/khachAuth.js`,
`server/utils/maKhach.js`, `server/nang_cap/003_xung_ho_khach.js` (mới), `HOP_DONG_API_KH.md`, `cong_cu/thu_KHAPI3.js` (mới),
`cong_cu/thu_HOPDONG_KH.js`, `cong_cu/thu_KH1.js`, `kiem_tra_truoc_khi_giao.js`, `viec/KH-API-3/*`.

## Bài thử `cong_cu/thu_KHAPI3.js` — ca ↔ Nghiệm thu
Khuôn `thu_KH1.js`: database.js thật, kho tạm, chỉ thay ketNoiKho; `process.env.TZ = 'UTC'` ở ĐẦU bài trước mọi `Date`; app thử `trust proxy 1`
như index.js, đổi IP bằng `X-Forwarded-For`; thời gian trôi của mã = lùi `tao_luc` và `het_han` CÙNG một khoảng; cửa sổ bộ đếm thử bằng gọi
thẳng `giuLuotBoNho(…, luc)`.
| Nghiệm thu | Ca | Trên gốc |
|---|---|---|
| A | A1 không token → 200, mỗi món ĐÚNG bộ khoá như có token, có `gia_hang` (đối chiếu từng món với lượt có token) | ĐỎ (401) |
| A | A2 token hợp lệ → 200; A3 token sai / hết hạn (ký `exp` quá khứ) / `Bearer null` / `Basic x` → 401 `KH_TOKEN_SAI` | xanh (hồi quy) |
| A | A4 cùng IP: lượt 300 → 200, lượt 301 → 429 `QUA_NHIEU_LAN`; IP khác → 200; có token (IP đã hết lượt) → 200 | ĐỎ |
| A | A4b `giuLuotBoNho` thẳng: hết lượt ở `luc`, gọi lại ở `luc + 60 000` → qua; ở `luc + 59 999` → vẫn chặn | ĐỎ (hàm chưa có) |
| A | A5 không token: `gia_hang` KHÔNG có hạng đã tắt | ĐỎ |
| B | B1 khách mới có tên thiếu xưng hô → `CAN_TEN`; có xưng hô thiếu tên → `CAN_TEN` | ĐỎ (ca 1) |
| B | B2 `xung_ho: 'ong'` → 400 `XUNG_HO_SAI`, `so_lan_thu` không tăng; ĐỦ 7 giá trị `anh · chi · co · chu · bac · em · ban` → tạo được (7 SĐT) | ĐỎ |
| B | B3 `dia_chi` 301 ký tự → 400 `DIA_CHI_QUA_DAI`; đúng 300 ký tự → 200 | ĐỎ |
| B | B4 tạo khách: CSDL `name`, `xung_ho`, `address` đúng (địa chỉ đã cắt khoảng trắng); không gửi địa chỉ → `address` NULL; câu trả lời xác minh có `xung_ho`, `dia_chi` | ĐỎ |
| B | B4b giao dịch: móc làm INSERT khách ném lỗi → 500, mã KHÔNG bị tiêu (`dung_luc` NULL), không có dòng khách | xanh (hồi quy) |
| B | B5 mã App: `CAN_TEN` lúc mã 4 phút tuổi → hạn = lúc đó + 10 phút: lùi 9 phút 59 giây → đăng nhập được; mã khác lùi 10 phút 1 giây → `MA_HET_HAN`. Lặp y hệt với mã QUẦY (`/api/pos/kh/cap-ma`) | ĐỎ |
| B | B6 "một lần": `CAN_TEN` lần hai → `het_han` KHÔNG đổi; mã SAI không gia hạn (`MA_SAI`, `het_han` giữ nguyên); không `CAN_TEN` → mã hết đúng 5 phút như cũ | ĐỎ / xanh |
| B | B7 hai yêu cầu song song cùng một mã sau `CAN_TEN`, đủ thông tin → đúng MỘT 200, một khách | xanh (hồi quy) |
| B | B8 khách CŨ đăng nhập kèm `xung_ho: 'ong'` + `dia_chi` 400 ký tự → 200, CSDL không đổi | xanh (khoá K5) |
| C | C1 `GET /toi` có `xung_ho`, `dia_chi` (khách quầy cũ → cả hai `null`) | ĐỎ |
| C | C2 `PUT /toi`: đổi `dia_chi` → CSDL đổi, câu trả lời có trường mới; `dia_chi: ''` → `address` NULL; `dia_chi` 301 ký tự → `DIA_CHI_QUA_DAI`; đổi `xung_ho`; `xung_ho` sai / `''` → `XUNG_HO_SAI`, CSDL không đổi | ĐỎ |
| C | C3 `PUT /toi {}` → 400 `YEU_CAU_KHONG_HOP_LE`; `{ ten: '' }` → `TEN_KHONG_HOP_LE`; `{ ten }` (App v2) → 200 như cũ | ĐỎ (ca 1) |
| C | C4 bước nâng cấp: `pos_nang_cap` có dòng 3, cột `xung_ho` có, `_sao_luu_003_pos_customers` có (bảng có dòng); chạy `chayNangCap` lần hai không lỗi | ĐỎ |
| D | D1 `POST /gia-han` → 200, token mới gọi `/toi` được; `het_han` = `exp` đổi tay +7 giờ (TZ=UTC), dạng không hậu tố, cách giờ VN hiện tại 30 ngày ± 1 phút | ĐỎ |
| D | D2 token hết hạn / sai / không token → 401; D3 lượt 10 → 200, lượt 11 → 429; khách khác không ảnh hưởng | ĐỎ |
| D | D4 token CŨ vẫn gọi `/toi` được sau gia hạn (quyết định "không thu hồi") | ĐỎ (cửa chưa có) |
| E | `thu_HOPDONG_KH.js` xanh với v3 (`/menu` có / không / sai token, `/gia-han`, trường mới) | ĐỎ |
| F | F1 khách CŨ đăng nhập `{ sdt, ma }` → 200; F2 `PUT /toi { ten }` → 200; F3 nhận điểm / PIN / quầy cấp mã — `thu_KH1.js`, `thu_KHAPI2.js` (npm test) | xanh (hồi quy) |
| F | F4 sau 11 lần gia hạn, nhận mã bill vẫn còn lượt (gia hạn không ăn trần `pos_kh_lan_thu`) | xanh (khoá K4) |

## Đột biến (`viec/KH-API-3/dot_bien.py`, mỗi chỗ vá ≥ 1, có đối chứng)
- BV-MENU-TOKEN (dời `/menu` về sau `xacThucKhach`) → A1 · VS-MENU-BO-QUA-TOKEN-SAI (`tuyChonKhach` nuốt token sai) → A3
- BV-MENU-GIOI-HAN → A4 · VS-MENU-TRAN-301 → A4 · VS-MENU-DEM-CA-TOKEN → A4 · VS-CUA-SO-SAI (`>` thành `>=` ở mốc hết cửa sổ) → A4b
- BV-XUNG-HO-CAN-TEN (bỏ `|| !xungHo`) → B1 · VS-XUNG-HO-LA (bỏ kiểm danh sách) → B2 · VS-XUNG-HO-THIEU-BAN (bỏ `ban`) → B2 · VS-DIA-CHI-300 (`>= 300`) → B3
- BV-INSERT-XUNG-HO → B4 · BV-GIA-HAN-MA → B5 · VS-GIA-HAN-11-PHUT → B5 · VS-GIA-HAN-MA-MAI (bỏ điều kiện "một lần") → B6
- VS-KIEM-CA-KHACH-CU (kiểm xưng hô / địa chỉ trước khi biết khách cũ) → B8
- VS-PUT-RONG → C3 · VS-PUT-DIA-CHI-KHONG-XOA → C2 · BV-HOSO-XUNG-HO → C1 · BV-NANG-CAP-003 → C4
- BV-GIA-HAN-TRAN → D3 · VS-GIA-HAN-UTC → D1 · VS-GIA-HAN-BANG-LAN-THU (ghi lượt vào `pos_kh_lan_thu`) → F4

## Đường song song phải canh (K4)
- Trả hồ sơ khách: xác minh `index.js:80–81`, `GET /toi` `:141`, `PUT /toi` `:152` → cùng `hoSo`.
- `CAN_TEN`: chỉ `maKhach.js:121` (+ lời ở `loi.js`). Tạo khách từ App: chỉ `maKhach.js:134` (quầy tạo khách ở `customers*.js`, `sync.js` — cột mới `NULL`).
- Ký token khách: chỉ `kyTokenKhach` (xác minh + gia hạn), cùng `HAN_TOKEN`.
- Đếm `pos_kh_lan_thu`: chỉ `maKhach.js:86–96`; gia hạn không ghi vào đây (F4).
- Kiểm `xung_ho` / `dia_chi`: xác minh + `PUT /toi` cùng `chuanXungHo` / `chuanDiaChi`.
- Bài thử khẳng định hành vi cũ: `thu_KH1.js:165` (sửa), `thu_HOPDONG_KH.js` (sửa), `thu_KHUI1.js:140` + `thu_P15QR.js:147` (ngoài Phạm vi — câu hỏi 1).
- Chú thích sai sau vá: `maKhach.js:102`, `HOP_DONG_API_KH.md:13`, chú thích đầu `index.js:4` ("Ngoài hai đường đăng nhập, mọi đường cần token").

## Luồng hợp lệ phải KHÔNG bị chặn (K5)
1. App v2: khách cũ đăng nhập `{ sdt, ma }` → 200 (F1); kèm trường lạ vẫn 200 (B8). 2. App v2: `PUT /toi { ten }` → 200 (C3).
3. App v2: `/menu` có token → 200 (A2). 4. Khách thật xem menu không chạm 300 / phút (A4 ngay dưới trần). 5. Nhiều khách CÙNG wifi quán (cùng
IP) chia chung 300 / phút — đủ cho quán nhỏ; số tầng proxy Render chưa kiểm (nếu sai thì mọi khách chung một IP) → CHƯA KIỂM. 6. Mở app nhiều
lần / ngày: ≤ 10 lần gia hạn / giờ (App gọi 1 lần / ngày). 7. Khách quầy cũ không có xưng hô / địa chỉ → `/toi` trả `null` (C1). 8. Quầy, nhận
điểm, PIN, cấp mã — `thu_KH1.js`, `thu_KHAPI2.js` xanh. 9. Mã đăng nhập đang sống lúc lên bản mới vẫn dùng được (điều kiện gia hạn chỉ thêm).

## Bạn cần quyết (mỗi câu có đề xuất — chỉ cần trả "duyệt")
1. **Hai bài thử cũ ngoài Phạm vi sẽ báo đỏ khi chạy tay** (không nằm trong `npm test`): `cong_cu/thu_KHUI1.js:140` (khẳng định "menu không
   token → 401") và `cong_cu/thu_P15QR.js:147` (tạo khách mới chỉ có tên). **Đề xuất:** thêm cả hai vào Phạm vi + mục `## Bài thử cũ sửa`;
   mình đổi KHUI1 ca H3 sang `/api/kh/toi` (vẫn cần token) và P15QR gửi thêm `xung_ho`. Không duyệt: mình ghi Phát hiện, để nguyên.
2. **App bản đang dùng (v2) + khách MỚI:** sổ quyết định 29.10 chốt xưng hô BẮT BUỘC, nên App v2 (form chỉ có Tên) gặp `CAN_TEN` mãi khi khách
   mới đăng ký — trái câu "App v2 không vỡ" của phiếu mục F. Khách CŨ trên App v2 không bị gì. **Đề xuất:** làm đúng sổ quyết định (bắt buộc),
   vì App KH mới chưa mở cho khách; App KH lên bản có ô xưng hô trước khai trương (ghi nhật ký hợp đồng v3).
3. **Một địa chỉ chung quầy ↔ App:** `dia_chi` của App chính là địa chỉ quầy in trên hoá đơn. Khách sửa / xoá trên App thì quầy thấy theo.
   **Đề xuất:** dùng chung (một khách một địa chỉ, một nguồn sự thật).

## Soát kế hoạch (agent phụ, vòng 1) — đã sửa
Agent chỉ đọc nêu: (1) không ra ngoài Phạm vi; trích sai dòng `khachAuth.js` / `chay.js` (đã sửa); kiểm xưng hô / địa chỉ trước khi biết
khách cũ mâu thuẫn "bỏ qua với khách cũ" (đã chuyển vào chỗ tạo khách + ca B8). (2) ngắn hơn: `SELECT *` ở `xacThucKhach` thay `docKhach`; cửa sổ
cố định; dùng `GIO` + `hanMa()`; bỏ xin `helpers.js` (đã theo cả bốn). (3) thiếu ca: `PUT` địa chỉ 301, trường mới trong câu trả lời, đủ 7 xưng
hô, mốc sát ± của 10 phút cho cả mã quầy / App, cửa sổ bộ đếm, giao dịch hỏng (đã thêm A4b, B2, B4, B4b, B5, C2). (4) sót: `thu_KH1.js:165`
(hàm `xacMinh` — sẽ đỏ hàng loạt nếu không sửa), `thu_P15QR.js:147`, chú thích `maKhach.js:102`, `HOP_DONG_API_KH.md:13`, cột `address` dùng
chung với quầy, `Bearer null`, hai nghĩa của `null` xưng hô (đã ghi / sửa hết). Lỗi logic: câu `strftime(tao_luc,'+5 minutes')` thiếu chuỗi
định dạng → không bao giờ khớp (đã đổi sang `GIO`).
