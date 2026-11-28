# KHO-GON-1 — kế hoạch (CHỜ DUYỆT)

Viết 26.11 trên HEAD `5cbfc26` (= main acc88921 + phiếu). Mọi số dòng dưới đây đọc trong lượt này.

## 0. Lời thường cho chủ quán
Mở Kho sẽ thấy tab đầu **Việc hôm nay**: danh sách việc cài sẵn + việc phát sinh, dải cam nguyên liệu dưới ngưỡng. Tối **Chốt kiểm kê**,
sáng **Nhận bàn giao** so với số tối qua chốt. Chủ quán / quản lý có khung **Diễn biến hôm nay** và **Cần chú ý**. Chủ quán (và quản lý nếu
được bật) **chỉnh tồn tay** ở Tồn kho. Mọi chỗ đổi số tồn đều đi bằng **phiếu KK** (đã có sẵn trong CSDL), không thêm cách đổi tồn nào khác.
Bạn cần: đọc mục 9 (3 câu hỏi), trả lời / xác nhận → máy làm tiếp.

## 1. Code đã đọc (khẳng định nào cũng trỏ về đây)
- `server/kho/duong.js` 24–27 vai trò (QUAN_LY / CHU_QUAN / NHAN_VIEN) · 199–211 `ghiPhieu` (giao dịch + `khiTrung` cho ma_gui) · 244–261 tạo
  PX / DH / PN / PS · 257 `TAO` không có KK · 314–318 sửa phiếu loại lạ → 400 KHONG_SUA_DUOC (KK sẽ rơi vào đây — đúng ý: KK không sửa,
  chủ quán huỷ được qua 302) · 327 `/mon-chua-san` · 329 `/ton` · 332 đường lạ 403.
- `server/kho/duLieu.js` (445 dòng — sát ngưỡng 500, KHÔNG thêm hàm vào đây) 95 `DA_DUYET` · 105 `nvCanDuyet` (khuôn đọc công tắc phòng thủ)
  · 112 `conLaiTheoLo` · 117 `COT_TON_NL` · 160 `themPhieu` (dùng cho KK) · 267 `huyPhieu` · 394–409 `dsPhieu` (cột `hang` chỉ lấy dòng
  `dat/nhap/phat_sinh`) · 419 `docTon` (nguyên liệu `duoi_toi_thieu`, thành phẩm = Σ lô còn hàng KỂ CẢ lô quá hạn).
- `server/kho/phatSinh.js` 14 `LO_FEFO`, 113–140 chia lô FEFO kể cả lô quá hạn (khuôn trừ của KK).
- `server/kho/nhapHang.js` 67–74 `ghiKhoNhan` (khuôn cộng lô mới) · 60 hạn = `duLieu.hanLo(luc, han_ngay)` (`duLieu.js` 102).
- `server/kho/banHang.js` 151 `monChuaSan` (B6 gọi lại, chỉ đọc) · 99 `truKhoDon`: bán = phiếu PS MỚI da_duyet (nguồn "bán xen giữa" ở C5).
- `server/kho/tinh.js` 84–101 `chiaTheoLo` · 56 `SAI_SO`.
- `server/nang_cap/001_kho.js` 75 CHECK loai có 'KK' · 37 `ton_toi_thieu` · `002` 5: `kho_phieu_dong.loai` không CHECK · `chay.js` 20–28 `themCot`.
- `server/routes/settings.js` 130–133: khoá `kho_*` chỉ chủ quán ghi qua PUT /settings (không kiểm giá trị khoá mới) .
- `server/routes/backup.js` 134–145 danh sách bảng kho (cha trước con) · `server/utils/khoiPhuc.js` 29–42 `kho_*` chỉ khôi phục khi kho trống.
- `server/utils/chuanHoaGio.js` 26–45: chỉ đổi giờ CŨ dạng dấu cách theo danh sách cột; luật 1 (đuôi Z) tự quét MỌI bảng → bảng mới ghi
  `getNow` không cần thêm gì. **Không sửa file này** (phiếu cho phép "nếu có cột giờ" — có, nhưng không cần).
- `client/src/pages/Kho/index.jsx` 27 `HOI_CHO_DUYET_MS`, 33–45 tab, 52–63 MỘT vòng hỏi 30 s · `TonKho.jsx` · `XemPhieu.jsx` 18 `TEN_LOAI`
  thiếu KK · `DsPhieu.jsx` 9 đã có nhãn KK.
- Bài cũ: `thu_KHO2a.js` 619–620 khoá "tab đầu là Pha chế" (`tabs = [ { ma: 'pc'`) → phải đổi (E2 chủ quán đã duyệt đổi) · `thu_KHO1.js`
  318–320 / 538 / 648 đếm bảng kho bằng `>=` / danh sách có — không vỡ khi thêm bảng.
- `QUYET_DINH_CHU_QUAN.md` mục Kho 26.10, Bảo vệ dữ liệu 28.10 — xem Q1.

## 2. Cấu trúc dữ liệu — bước `server/nang_cap/033_viec_kho.js` (chỉ THÊM)
| Bảng / cột | Cột chính | Khoá chống đôi |
|---|---|---|
| `kho_viec_mau` | id, ten, giao (`nv/sang/toi/ql/tat_ca`), gio_han `HH:mm` NULL, loai (`thuong/bangiao/phache/kiemke`), thu_tu, sua_luc | `UNIQUE(loai) WHERE loai <> 'thuong'` — mỗi việc đặc biệt đúng 1 |
| `kho_viec` | id, ngay, mau_id NULL, ten, giao, gio_han, loai, thu_tu, nguyen_lieu_id NULL, nguoi_tao NULL, tao_luc, nguoi_xong, xong_luc | `UNIQUE(ngay, mau_id) WHERE mau_id IS NOT NULL`; `UNIQUE(ngay, nguyen_lieu_id) WHERE nguyen_lieu_id IS NOT NULL AND xong_luc IS NULL` |
| `kho_dien_bien` | id, ngay, luc, loai, viec, chi_tiet, nguoi, chu_y (0/1 = tô cam), phieu_id | — |
| `kho_dien_bien_xem` | nguoi PK, den_id | khoá chính theo người |
| `kho_chot` | id, che_do (`kiemke/bangiao`), ngay, luc, nguoi, phieu_id NULL, ghi_chu_chung, anh (JSON từng thứ: khoá, tên, may, thuc, chot, ghi_chu), ma_gui | `UNIQUE(ma_gui)` |
| `kho_nguyen_lieu.kiem_hang_ngay` | `INTEGER NOT NULL DEFAULT 0` qua `themCot` (tự sao lưu bảng) | — |

- Bước 033 chèn 3 mẫu mặc định khi bảng mẫu trống (A1). Cài đặt `kho_so_ca`, `kho_ql_chinh_tay` ở `pos_settings`, đọc phòng thủ như
  `nvCanDuyet`: chỉ `'2'` là hai ca, chỉ `'1'` là quản lý được chỉnh tay — giá trị lạ = 1 ca / TẮT.
- **Ảnh chốt = một dòng `kho_chot`, cột JSON** (gọn nhất: một câu đọc "lần chốt kiểm kê gần nhất"; không bảng con).
- **Sinh việc một lần / ngày (A3):** MỘT câu `INSERT INTO kho_viec … SELECT … FROM kho_viec_mau WHERE NOT EXISTS (SELECT 1 FROM kho_viec
  WHERE ngay = ? AND mau_id IS NOT NULL)` + UNIQUE(ngay, mau_id) đỡ lưng. Mẫu đặc biệt không xoá được → ngày đã sinh luôn có dòng → thêm
  mẫu giữa ngày KHÔNG chen vào hôm nay (A3 "áp dụng từ ngày sau"). Không cần bảng đánh dấu ngày.
- `backup.js`: thêm 5 bảng sau `kho_phieu_dong` (mẫu trước việc). `chay.js`: không cần sửa (phiếu cho phép, ghi lý do: bộ chạy tự nhận
  file `033_*.js`).

## 3. Máy chủ — phương án
**Phần 1 — đặt code ở đâu**
- A (chọn): 2 file mới theo việc `server/kho/viec.js` (mẫu, sinh, đọc, xong / mở lại, phát sinh, diễn biến, đã xem ≈ 140 dòng) +
  `server/kho/kiemKe.js` (danh sách kiểm, MỘT hàm `luuDieuChinh` cho kiểm kê · bàn giao · chỉnh tay, ảnh chốt ≈ 120 dòng); vị từ thuần vào
  `tinh.js` (`quaGio`, `viecHienCho`, `lechCua` ≈ 20 dòng); đường nối vào `duong.js` (≈ 70 dòng, trước dòng 332 "đường lạ").
- B: dồn vào `duLieu.js` — vượt 500 dòng (LUAT §3), loại.

**Phần 2 — C5 (tồn đổi giữa lúc mở và lúc lưu) — CHỌN: tính theo số MÀN ĐÃ THẤY, nhưng số đó do MÁY CHỦ tính lại**
- Lúc mở (danh sách kiểm / Tồn kho), máy chủ trả mỗi thứ `may` (tồn lúc đọc) + một `moc` = id phiếu kho lớn nhất lúc đọc.
- Lúc lưu, màn gửi lại `moc` và mỗi dòng `thuc` + `may_thay` (số đã hiện). Máy chủ TỰ tính **gốc** = tồn hiện tại − Σ dòng của phiếu
  da_duyet có id > `moc` cho đúng thứ đó (= tồn lúc màn mở, không tin số màn gửi). `may_thay` ≠ gốc → 409 `KHO_TON_DOI` "Tồn vừa đổi — tải
  lại" (bắt cả huỷ đơn / duyệt phiếu cũ xen giữa: chúng đổi tồn mà không có phiếu id > `moc`). Điều chỉnh = `thuc − gốc`, cộng vào tồn hiện tại.
  Ví dụ: thấy 10, đếm 10, bán 1 → hiện 9, gốc 10, điều chỉnh 0 (so với số hiện tại sẽ ra +1 giả). Thấy 10, đếm 8, bán 1 → 9 − 2 = 7 = thực tế.
- Vì sao không so với tồn hiện tại: ly bán xen giữa tạo lệch giả (cấm ở C5). Vì sao không theo giờ: getNow chỉ tới giây — bán cùng giây với lúc
  đọc thì lệch ±1 không tất định; id phiếu tăng dần nên tất định.
- Lối "giấu hao hụt" (soát kế hoạch bắt): nếu tin `may_thay` của màn, nhân viên gửi `may_thay = thuc = 8` khi máy ghi 10 → điều chỉnh 0, không
  ghi chú, hao hụt biến mất. Gốc do máy chủ tính thì lối này 409. Còn lại: sửa tay `moc` cũ hơn → gốc là một số tồn THẬT trong quá khứ; lệch
  vẫn phải ghi chú + tô cam, và `moc` phải ≥ id phiếu KK cuối (dưới). `moc` thiếu / không phải số nguyên ≥ 0 / lớn hơn id lớn nhất → 400 `KHO_MOC_SAI`.
- Dòng lệch (`thuc − gốc ≠ 0`, và ở bàn giao thêm `thuc − chot ≠ 0`) BẮT BUỘC ghi chú (400 `KHO_THIEU_GHI_CHU`) và tô cam.
- Tồn sau điều chỉnh < 0 không xảy ra khi `thuc ≥ 0` (tồn mới = thuc + phần đổi sau mốc; phần đổi âm vượt thuc → 409 `KHO_TON_DOI`).
- **Hai người cùng chốt (ca đua):** có phiếu KK id > `moc` → 409 `KHO_DA_KIEM` "Vừa có người kiểm — tải lại" (không thì hai lần cùng thấy 10 /
  đếm 8 trừ 2 lần, còn 6). Tính CHUNG mọi thứ: chủ quán chỉnh tay một thứ bất kỳ thì người đang kiểm kê cũng phải tải lại — chủ ý, đơn giản,
  hiếm. Bấm hai lần cùng `ma_gui` → trả lần đã ghi (khuôn `khiTrung`).

**Phần 3 — ghi phiếu KK (MỘT hàm cho C2 · C3 · D1)**
- Có dòng điều chỉnh ≠ 0 → một phiếu `KK` qua `duLieu.themPhieu` (`tuDuyet: true`, `ma_gui`, `ly_do` khi chỉnh tay); dòng `loai = 'kiem_ke'`,
  `ghi_chu` = ghi chú người đếm. Cộng → lô mới (nguyên liệu: hạn `hanLo(luc, han_ngay)`, giá vốn = giá nhập; thành phẩm: hạn theo hạn món,
  giá vốn = lô gần nhất của món, không có thì NULL). Trừ → chia lô FEFO KỂ CẢ lô quá hạn (khuôn `phatSinh.js` 113–140); nguyên liệu phần
  thiếu không lô (tồn = Σ dòng, như hiện nay); thành phẩm không bao giờ thiếu lô vì đã chặn tồn mới < 0.
- **Không lệch dòng nào → KHÔNG tạo phiếu** (K5 phiếu cho kế hoạch chọn: phiếu rỗng làm rối danh sách Phiếu); vẫn lưu `kho_chot` + việc xong.
- Dòng gửi lên phải là thứ ĐƯỢC KIỂM (vị từ chung với danh sách: nguyên liệu `kiem_hang_ngay = 1`, thành phẩm `kieu = 'lam_san'`) → khác
  thì 400 `KHO_DONG_LA` — nhân viên không dùng được đường kiểm kê để chỉnh tùy ý thứ khác (đó là quyền chỉnh tay của chủ quán).
- Chỉnh tay: chủ quán luôn; quản lý chỉ khi `kho_ql_chinh_tay = '1'`; nhân viên 403 (`checkRole` + đọc công tắc TRONG giao dịch);
  `ly_do` trống → 400 `THIEU_LY_DO`; `thuc < 0` hoặc không phải số → 400 `KHO_SO_AM`. Thứ chỉnh tay: mọi nguyên liệu / thành phẩm có lô.
- Kiểm kê: dòng + ghi chú chung → `kho_chot` (che_do kiemke, ảnh = **tồn sau chốt** = tồn hiện tại + điều chỉnh của từng thứ — không phải số gõ:
  bán xen giữa thì hai số khác nhau, sáng ra sẽ lệch giả) → việc `kiemke` hôm nay tự xong → diễn biến
  "Chốt kiểm kê" (cam nếu lệch). Bàn giao: cột "Chốt" lấy từ `kho_chot` kiemke gần nhất (chưa có → số máy, trả cờ `chua_co_chot`), "Ca trước
  dặn" = ghi chú chung của lần đó; lưu `kho_chot` che_do bangiao; việc `bangiao` tự xong; diễn biến "Nhận ca" (cam nếu lệch).
- Lưu `kho_chot` khi máy in hỏng: in ở máy khách SAU khi ghi, lỗi in không đụng sổ (CLAUDE §5.2).

- Đường: `GET /kho/kiem-ke?che_do=kiemke|bangiao` (mọi vai trò: dòng, `may`, `chot`, `chua_co_chot`, `ca_truoc_dan`, `moc`) ·
  `POST /kho/kiem-ke` (mọi vai trò) · `POST /kho/chinh-tay` (owner / manager + công tắc) — cả ba qua `ghiPhieu`-kiểu giao dịch + `loiGhi`.
- Bàn giao không lệch → không phiếu, việc `bangiao` vẫn xong (ca thử riêng).

**Phần 4 — việc & diễn biến**
- `POST /kho/viec/hom-nay` (mọi vai trò, `?ca=sang|toi`): sinh nếu chưa (câu ghi → dùng POST, không để GET ghi) + trả `ngay`, `bay_gio`,
  `so_ca`, `viec` (đã lọc theo `tinh.viecHienCho`, cờ `qua_gio`), `duoi_nguong` (từ `docTon`: `dang_dung && duoi_toi_thieu`, cờ `da_giao`).
- `tinh.quaGio(gioHan, bayGio)` = chưa xong && có giờ && `bayGio.slice(11,16) > gioHan` (19:59, 20:00 → chưa; 20:01 → quá). Giờ VN máy chủ.
- `tinh.viecHienCho(viec, { vai, soCa, ca })`: chủ / quản lý → tất cả; nhân viên 1 ca → mọi việc trừ `ql`; 2 ca → `nv`, `tat_ca`, đúng ca.
  MỘT vị từ cho danh sách VÀ cho nút Xong (nhân viên không đánh dấu việc không giao cho mình → 403 `VIEC_KHONG_CUA_BAN`).
- `POST /kho/viec` thêm phát sinh (mọi vai trò; `giao` trong 5 giá trị, mặc định `nv`; `nguyen_lieu_id` → việc "Gọi thêm …" giao `ql`;
  đụng UNIQUE → trả việc đã có). `POST /kho/viec/:id/xong` (chỉ `thuong`, chỉ hôm nay, câu ghi `AND xong_luc IS NULL` → 409 `VIEC_DA_XONG`).
  `POST /kho/viec/:id/mo-lai` CHU_QUAN, ghi diễn biến (B4).
- Tự xong (E1): sau `taoPhieuXuat` thành công ở `POST /phieu-xuat` → việc `phache` hôm nay xong + diễn biến "Pha chế"; sau `POST /phieu-nhan`
  → việc gọi hàng có `nguyen_lieu_id` thuộc dòng phiếu xong + diễn biến "Nhận hàng"; sau `POST /phieu-phat-sinh` → diễn biến "Phát sinh"
  (cam). Gọi TRONG cùng giao dịch, trong hàm `lam` của `ghiPhieu` — bấm hai lần (ma_gui) thì lần sau rollback, không ghi đôi.
  KHÔNG gắn vào `banHang.js` (Cấm). Sửa phiếu (`/phieu/:id/sua`, chủ quán), duyệt, kết quả pha chế (`/ket-qua`) KHÔNG ghi diễn biến /
  không tự xong việc — phiếu chỉ đòi lúc LƯU phiếu xuất / nhận; ghi chủ ý ở đây để soát khỏi coi là sót. Lưu ý: phiếu nhận còn CHỜ người khác
  duyệt mà việc "gọi thêm" đã xong — đúng chữ B3 ("Lưu phiếu Nhận hàng có thứ đó → việc tự xong"); hàng chưa vào tồn thì dải cam vẫn hiện thứ
  đó (nút "Giao việc" hiện lại) cho tới khi duyệt.
- `GET /kho/dien-bien` (QUAN_LY): dòng hôm nay + `chua_xem` (id > `den_id` của CHÍNH người hỏi, hôm nay) + `can_chu_y` (dòng `chu_y = 1`
  chưa xem, mọi ngày, tối đa 50 + `banHang.monChuaSan`). `GET /kho/dien-bien/so` (QUAN_LY) chỉ số chưa xem — vòng 30 s đang có gọi thêm.
  `POST /kho/dien-bien/da-xem {den_id}` → `den_id = MIN(gửi, id lớn nhất)` cho người đó (dòng tới sau lúc bấm vẫn là "chưa xem").
- Mẫu việc (QUAN_LY): `GET/POST /kho/viec-mau`, `PUT /kho/viec-mau/:id` (tên / giao / giờ; loại không đổi), `POST /kho/viec-mau/:id/len|xuong`
  (đổi thu_tu với hàng xóm trong giao dịch), `DELETE` chỉ `thuong` → khác 409 `VIEC_KHONG_XOA`. Giờ phải `HH:mm` hợp lệ hoặc trống.
- Cài đặt: `GET /kho/cai-dat-viec` (QUAN_LY), `PUT` (CHU_QUAN — giữ luật 29.10 "khoá kho_* chỉ chủ quán", xem Q2) kiểm `so_ca ∈ {1,2}`,
  `ql_chinh_tay ∈ {0,1}`. `PUT /kho/nguong` (QUAN_LY): chỉ `ton_toi_thieu` + `kiem_hang_ngay` của nhiều nguyên liệu — KHÔNG đi qua
  `cotNguyenLieu` (PUT /nguyen-lieu ghi đè cả dòng → màn Nguyên liệu không gửi cờ mới sẽ xoá cờ về 0; K4).
- `GET /ton` thêm `duoc_chinh_tay` + `moc`; `dsPhieu` cột `hang` thêm `'kiem_ke'`; `XemPhieu` `TEN_LOAI` thêm KK.

## 4. Màn hình (`client/src/pages/Kho/`) — chép HÀNH VI bản thử, không chép mã
- A (chọn): `ViecHomNay.jsx` (danh sách, Xong, + Việc phát sinh 4 gợi ý, dải cam, chọn ca nhớ theo ngày trên máy (localStorage bọc try),
  khung Diễn biến + Cần chú ý cho chủ / QL, nút Làm → mở tab tương ứng) · `KiemKe.jsx` (một màn hai chế độ, thẻ gọn 390 px, nút Chốt / Nhận ca
  dính đáy, in bảng chốt có chỗ ký bằng `inPhieuKho.css`) · `CaiDatKho.jsx` (mẫu việc, số ca, cho QL chỉnh tay, Ngưỡng & kiểm hằng ngày) ·
  `TonKho.jsx` thêm "Chỉnh tồn tay" · `index.jsx` thứ tự tab E2 + huy hiệu chưa xem (cùng vòng 30 s) · `kho.css` vài lớp.
- B: dồn vào một file — > 400 dòng, khó sửa; loại.
- Gọi máy chủ chỉ qua `utils/api.js` (bánh cóc fetch không đổi). Sau sửa: `(cd client && npm run build)` + `--day-du`.

## 5. Ngân sách
Ước: máy chủ ≈ 360 (viec 140 · kiemKe 120 · duong 70 · tinh 20 · 033 45 · backup 6 · duLieu 1) · màn ≈ 330 (ViecHomNay 120 · KiemKe 100 ·
CaiDatKho 80 · TonKho 25 · index 15 · XemPhieu 1 · css 10) → ≈ 690 dòng code, ≈ **1,53 lần** 450. Lý do vượt: phiếu ước màn 200 dòng
cho 4 khu (việc, kiểm kê / bàn giao, cài đặt việc / ca / ngưỡng, chỉnh tay); bản thử đã chốt từng khu. Đã cắt: không bảng đánh dấu ngày, ảnh
chốt một cột JSON, một hàm ghi cho ba đường điều chỉnh, không phiếu KK rỗng. Thử ≈ 480 dòng (`thu_KHOGON1.js`) + 1 dòng `thu_KHO2a.js` + 1 dòng `chayBaiThat('cong_cu/thu_KHOGON1.js')` trong `kiem_tra_truoc_khi_giao.js`
(cạnh dòng 820–826) để `npm test` chạy bài mới.

## 6. Ca thử `cong_cu/thu_KHOGON1.js` (khuôn `thu_KHO2b.js`: database.js thật + libsql kho TẠM, route thật, JWT theo vai, TZ=UTC, `datGio`)
| Nghiệm thu | Ca |
|---|---|
| A1 | mẫu mặc định 3 dòng đúng loại / giờ, `kiemke` cuối; sửa tên / giờ việc đặc biệt 200; thêm · sửa · lên / xuống · xoá `thuong` 200; xoá loại đặc biệt 409; giờ "25:00" 400; nhân viên 403 |
| A2 | 1 ca: NV thấy mọi việc trừ `ql`; 2 ca: ca tối KHÔNG thấy việc `sang`, thấy `nv`/`tat_ca`/`toi`; chủ / QL thấy hết; NV bấm Xong việc ngoài phần mình 403 |
| A3 | hai lần `hom-nay` song song → đúng 1 bộ; sửa mẫu sau khi sinh → hôm nay giữ, ngày sau đổi; thêm mẫu giữa ngày không chen vào hôm nay |
| B1 | quá giờ: 19:59 / 20:00 không, 20:01 có (hạn "20:00"); việc đã xong không "quá giờ"; việc đặc biệt `POST xong` → 409 |
| B2 | NV thêm phát sinh 200, `giao` lạ 400, việc phát sinh chỉ có trong ngày (sang ngày sau không thấy) |
| B3 | dưới ngưỡng có trong `duoi_nguong`; `ton_toi_thieu` NULL / ngừng dùng không có; giao việc gọi hàng 2 lần → 1 việc, `da_giao`; lưu phiếu Nhận hàng có thứ đó → việc xong |
| B4 | Xong ghi người + giờ; bấm Xong lần 2 → 409; NV / QL mở lại 403; chủ mở lại 200 + dòng diễn biến |
| B5 | mỗi loại diễn biến có dòng (xong việc, nhận ca, chốt, pha chế, nhận hàng, phát sinh, thêm việc, chỉnh tay); dòng lệch / phát sinh / chỉnh tay `chu_y = 1`; chủ "Đã xem" → số chưa xem của chủ 0, của QL giữ nguyên; dòng tới sau `den_id` vẫn chưa xem; NV 403 |
| B6 | `can_chu_y` có món chưa sẵn sàng (đúng danh sách `/mon-chua-san`) + lệch chưa xem; xem rồi thì mất |
| C1 | danh sách = lam_san có lô còn + nguyên liệu tick; nguyên liệu không tick không có |
| C2 | lệch − (FEFO, trừ lô hạn gần trước), lệch + (lô mới, hạn đúng, ghi_chu), không lệch (không phiếu, vẫn `kho_chot` + việc xong); phiếu KK da_duyet; ảnh chốt đúng số |
| C3 | bàn giao không lệch → không phiếu, việc `bangiao` xong, dòng "Nhận ca"; bàn giao so đúng ảnh chốt tối qua (máy ≠ chốt vẫn lấy chốt); chưa có chốt → số máy + cờ; "Ca trước dặn" đúng ghi chú chung; lệch → phiếu KK về số thực tế |
| C4 | dòng lệch không ghi chú → 400 `KHO_THIEU_GHI_CHU`, không ghi gì; dòng không lệch có ghi chú → ghi chú lưu trong ảnh |
| C5 | bán 1 ly (đơn thật qua `truKhoDon`) giữa lúc mở và lưu, đếm đúng → KHÔNG phiếu KK, tồn = số sau bán; đếm thiếu 2 + bán 1 → tồn = đúng thực tế; bán hết giữa chừng → 409 `KHO_TON_DOI` |
| C6 | NV lưu kiểm kê / bàn giao 200, phiếu da_duyet ngay; NV gửi dòng nguyên liệu không tick → 400 `KHO_DONG_LA` |
| D1 | chỉnh tay: chủ 200; QL 403 khi tắt / 200 khi bật; NV 403; thiếu lý do 400; phiếu KK một dòng, `ly_do`, diễn biến cam, có trong `can_chu_y` |
| D2 | số mới −1 → 400 `KHO_SO_AM` (chỉnh tay và kiểm kê) |
| E1 | lưu PX → việc phache xong + diễn biến; ma_gui bấm hai lần → 1 diễn biến; bài cũ KHO-1/2a/2b/3a xanh (bánh cóc chạy chung `npm test`) |
| E2 | `index.jsx` tab đầu `viec`, thứ hai `pc`, tab `caidat` chỉ chủ / QL (nhân viên không thấy); `setInterval` trong `index.jsx` vẫn đúng 1 (B5 không thêm vòng hỏi), vòng đó gọi `/kho/dien-bien/so`; `thu_KHO2a.js` K2 đổi theo (bài sửa thường: bản mới ĐỎ trên gốc) |
| Ngày VN | 23:59 VN (16:59 UTC) và 00:00 VN (17:00 UTC) → hai `ngay` khác nhau, sinh hai bộ |
| Hai người cùng bấm | hai NV chốt kiểm kê cùng lúc (cùng `moc`) → 1 phiếu KK, người sau 409 `KHO_DA_KIEM`; cùng `ma_gui` → trả lần đã ghi; hai người cùng Xong một việc → 1 lần ghi |
| C5 lối giấu | `may_thay = thuc` khác gốc máy chủ → 409 `KHO_TON_DOI`, không phiếu; `moc` thiếu / lớn hơn id lớn nhất → 400 `KHO_MOC_SAI`; huỷ đơn xen giữa → 409; ảnh chốt = tồn sau chốt khi bán xen giữa |
| Sao lưu | 5 bảng mới có trong `BACKUP_TABLES`, mẫu trước việc |

**Đột biến** (`viec/KHO-GON-1/dot_bien.py`, mỗi tên một dòng, chạy từng tên, có đối chứng xanh):
VS-sinh-viec-2-lan (bỏ `NOT EXISTS`) · VS-tin-may-thay-cua-man · VS-anh-chot-la-so-go · VS-ca-toi-thay-viec-sang · VS-qua-gio-lech-1 (`>` → `>=`) · VS-lech-khong-ghi-chu-lot ·
VS-ql-chinh-tay-khi-tat · VS-so-voi-may-thay-chot (bàn giao lấy máy làm "chốt") · VS-lech-gia-khi-vua-ban (điều chỉnh theo tồn hiện tại) ·
BV-bo-kiem-quyen-chinh-tay · VS-nv-kiem-ke-ngoai-danh-sach · VS-chua-xem-chung-nguoi · BV-bo-chan-hai-nguoi-chot · BV-bo-tu-xong-pha-che.

## 7. Luồng hợp lệ phải KHÔNG bị chặn (K5) — mỗi luồng một ca
1. Kiểm kê không lệch dòng nào → 200, việc kiemke xong, không phiếu.
2. Quán 1 ca: CÙNG một nhân viên làm bàn giao sáng và kiểm kê tối → cả hai 200 (không luật "người khác").
3. Dữ liệu thật hôm nay: kho chưa có mẫu tự thêm, chưa có ảnh chốt, `ton_toi_thieu` NULL, chưa có nguyên liệu tick → mở Việc hôm nay /
   kiểm kê / bàn giao không lỗi (kho thử dựng như production: có phiếu PN / PX cũ).
4. Pha chế / Nhận hàng / Phát sinh / duyệt / bán trừ kho chạy như cũ: bài KHO-1/2a/2b/3a xanh không đổi (trừ dòng K2 tab đầu).
5. Chủ quán in bảng chốt hai lần / máy in lỗi → không ghi gì thêm.
6. Quản lý khi công tắc bật chỉnh tay 200; chủ quán chỉnh tay khi công tắc tắt 200.
7. Bấm "Đã xem" khi chưa có dòng nào → 200.

## 8. Đường song song phải canh (K4)
- Mọi đường đổi tồn KK (kiểm kê, bàn giao, chỉnh tay) đi qua MỘT hàm → cùng kiểm âm, ghi chú, gốc máy chủ, `moc`.
- `docTon` (Tồn kho, Phát sinh gợi ý, Nhận hàng gợi ý) đọc tồn qua `DA_DUYET` → phiếu KK da_duyet tự vào mọi màn; `banHang.docKhaNang` cũng
  dùng `DA_DUYET` + `conLaiTheoLo` → lô KK cộng thêm bán được ngay (đúng ý). Không câu tồn nào lọc theo `loai IN (…)` bỏ sót KK — đã grep
  `loai IN` trong `server/kho/` (chỉ `dsPhieu` cột hiển thị `hang`, sẽ thêm `kiem_ke`).
- Huỷ phiếu KK: `huyPhieu` chặn khi lô thành phẩm KK đã bị trừ (dòng 263) — giữ nguyên. Sửa KK: 400 `KHONG_SUA_DUOC` (dòng 318) — giữ.
- Khôi phục sao lưu: bảng mới tên `kho_*` → tự theo luật "kho trống mới khôi phục" (`khoiPhuc.js` 42).
- Công tắc mới đọc ở MỘT hàm (như `nvCanDuyet`); `PUT /settings` vẫn ghi được khoá `kho_*` của chủ quán không kiểm giá trị → hàm đọc phòng thủ.

## 9. Câu hỏi cho chủ quán (cần trả lời khi duyệt)
- **Q1 (tiền / kho — phải trả lời):** Sổ quyết định 26.10 ghi "kiểm kê **đếm mù**, quản lý **duyệt** chênh lệch có lý do" (và 28.10 "sai số kho
  sửa bằng phiếu kiểm kê **có duyệt**"). Phiếu này (bản thử bạn duyệt 26.11) lại cho màn hiện "Máy ghi …" và nhân viên lưu kiểm kê **có hiệu lực
  ngay**, quản lý chỉ xem ở Diễn biến / Cần chú ý. **Đề xuất:** làm theo phiếu 26.11 (mới hơn, bạn đã duyệt bản thử) và chat ghi vào sổ là
  quyết định 26.10 được thay cho kiểm kê hằng ngày. Bạn xác nhận "theo phiếu" hay muốn giữ "đếm mù + chờ duyệt"?
- **Q2:** Ai đổi "Số ca" và "Cho quản lý chỉnh tồn tay"? **Đề xuất:** chỉ chủ quán (cùng luật 29.10 "cài đặt kho chỉ chủ quán"); quản lý
  vẫn sửa danh sách việc cố định và ngưỡng / kiểm hằng ngày. Xác nhận?
- **Q3:** Bán sau lúc chốt tối (vd 22:05 bán thêm 1 ly) → sáng nhận bàn giao sẽ thấy lệch 1 so với "Chốt" và phải ghi chú. **Đề xuất:** giữ
  vậy (bán sau giờ chốt là chuyện chủ quán nên biết). Xác nhận?

## 10. Soát kế hoạch (agent phụ chỉ đọc, 26.11) — đã sửa
- Thiếu dòng `chayBaiThat` cho bài mới → thêm (mục 5). Số dòng `nhapHang.js` / `banHang.js` trích sai → sửa (mục 1).
- C5: tin `may_thay` của màn để lộ lối giấu hao hụt; ảnh chốt ghi số gõ thay vì tồn sau chốt; `moc_kk` không kiểm → đổi sang gốc do máy chủ tính
  từ `moc` + 409 / 400 (mục 3 phần 2), thêm 2 đột biến + ca "C5 lối giấu".
- Ca thiếu: bàn giao không lệch, sửa việc đặc biệt / kiemke cuối, chỉnh tay trong Cần chú ý, NV không thấy tab Cài đặt, một vòng hỏi → thêm (mục 6).
- Sửa phiếu / kết quả / duyệt không ghi diễn biến; phiếu nhận chờ duyệt đã tự xong việc → ghi rõ là chủ ý theo chữ phiếu (mục 3 phần 4).
- Đề xuất cắt bảng `kho_dien_bien_xem` sang `pos_settings`: KHÔNG theo — khoá `kho_*` ở `pos_settings` chủ quán ghi được qua PUT /settings
  (settings.js 130) nên đặt "đã xem" ở đó trộn dữ liệu người dùng vào cài đặt; bảng riêng 3 dòng code.
- Phần chỉ có ở màn hình (nút Làm, 4 gợi ý, nhớ ca, in có chỗ ký, 390 px): không có ca máy — sẽ ghi CHƯA KIỂM + 3 thao tác thử tay.
