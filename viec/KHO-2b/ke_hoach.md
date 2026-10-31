# KHO-2b — kế hoạch (chờ chủ quán duyệt)

Nền: `617f4e4 PHIEU: KHO-2b` (= origin/viec/KHO-2b). Mọi số dòng dưới đây đọc trong lượt lập kế hoạch 31.10.

## 0. Hiện trạng đã đọc (K1)

| Điều | Chỗ đọc |
|---|---|
| `kho_phieu.loai` CHECK có sẵn `DH, PX, PN, PS, KK`; `trang_thai` CHECK `nhap, cho_duyet, da_duyet, huy`; có `nha_cung_cap_id`, `thay_cho_id`, `ly_do`, `ghi_chu` (`ghi_chu` chưa ai dùng) | `server/nang_cap/001_kho.js:73-86` |
| `kho_phieu_dong` KHÔNG có cột hạn; `kho_lo` có `han_dung`, `gia_von`, `phieu_id` | `001_kho.js:88-110` |
| `loai` dòng không CHECK; `ma_gui` chỉ mục duy nhất | `002_kho_pha_che.js:15,19` |
| Tồn nguyên liệu = Σ MỌI dòng có `nguyen_lieu_id` của phiếu `da_duyet` — **không lọc loại phiếu** → dòng DH sẽ bị cộng vào tồn nếu không chặn | `server/kho/duLieu.js:92,108` |
| "Còn lại theo lô" dùng cùng hằng `DA_DUYET` | `duLieu.js:103-105` |
| Duyệt / từ chối / huỷ / "vì sao không đổi" đều khoá `loai = 'PX'` | `duLieu.js:202,210,218,225` |
| Số phiếu: tiền tố `soPhieuKe('PX', …)` viết ngay trong `taoPhieuXuat` | `duLieu.js:149-152`, `tinh.js:104` |
| `boGia` chỉ bỏ khoá `gia_nhap, don_gia, gia_von` — khoá tiền MỚI phải thêm vào danh sách | `tinh.js:57,155` |
| Đường ghi phiếu dùng chung `ghiPhieu(lam, khiTrung)` + `maGuiCua` | `duong.js:190-202,233-237` |
| Khoá `kho_*` chỉ chủ quán đổi; kiểm giá trị chỉ cho `kho_px_nv_can_duyet` (0/1) | `server/routes/settings.js:103-121` |
| Huy hiệu chờ duyệt đã hỏi `trang_thai=cho_duyet` KHÔNG lọc loại → DH/PN/PS tự vào huy hiệu; nhưng dòng tóm tắt `mon` chỉ đếm dòng `thanh_pham` | `client/src/pages/Kho/index.jsx:41`, `duLieu.js:301-306` |
| `GET /san-pham` chỉ quản lý → nhân viên đặt hàng theo công thức cần đường đọc riêng | `duong.js:89` |
| Sao lưu Excel lấy `SELECT *` theo danh sách bảng CỨNG; khôi phục `kho_*` chỉ khi kho trống | `server/routes/backup.js:31,103-114,357-370` (ngoài Phạm vi) |
| Đã có `GET /san-pham/:id/trien-khai` (quản lý, không giá) — số phần → lượng từng nguyên liệu | `duong.js:91-99` |
| Không có khái niệm "ca" trong máy chủ (grep `shift\|ca_lam` = 0 file) | lệnh grep lượt này |

## 1. Thiết kế dữ liệu

**Không bảng mới.** Bước `server/nang_cap/007_kho_nhap_hang.js` (~12 dòng), chỉ `themCot`:
- `kho_phieu.don_id INTEGER` — phiếu nhận PN trỏ đơn DH (mua lẻ = NULL). Cần để tính "còn mở phần thiếu".
- `kho_phieu.su_co TEXT` — loại chuyện của PS (`hong · do_vo · het_han · noi_bo · khac`). Không dùng `ly_do` vì huỷ / từ chối ghi đè `ly_do` (`duLieu.js:218,225`).
- `kho_phieu_dong.han_dung TEXT` — hạn lô ghi lúc TẠO phiếu nhận; lô chỉ sinh lúc duyệt (nghiệm thu B "khi duyệt mới tạo lô").
- chỉ mục `idx_kho_phieu_don ON kho_phieu(don_id)`.
Kho thử thiếu bảng: `themCot` đọc `PRAGMA table_info` — bước 001 tạo bảng trước, bước hỏng thì `chay.js` dừng và đường kho trả 503 như cũ.

Loại dòng mới (chỉ trong code): `dat` (DH, +lượng, `don_gia` = giá nhập lúc đặt, KHÔNG vào tồn) · `nhap` (PN, +lượng, `don_gia` thật, `han_dung`, `lo_id` gán lúc duyệt) · `phat_sinh` (PS, −lượng, `lo_id` gán lúc duyệt; PS hết hạn gán lô ngay lúc tạo).

**Dòng DH không được vào tồn** — hai phương án:
- A: sửa hằng `DA_DUYET` thành `p.trang_thai = 'da_duyet' AND p.loai <> 'DH'` (1 dòng, một chỗ cho cả tồn và còn-lại-theo-lô).
- B: lưu DH với `so_luong = 0` và lượng ở cột khác → cần thêm cột, mọi chỗ đọc phải biết.
→ **Chọn A.** Rà K4: `DA_DUYET` dùng ở `duLieu.js:104,108` (hết); `backup.js` không cộng sổ.

## 2. Máy chủ — phương án theo phần

Bố trí (LUAT §3, file < ~500 dòng): `duLieu.js` (336) giữ phần chung đã có + tổng quát hoá duyệt/huỷ; **mới** `server/kho/nhapHang.js` (DH + PN), `server/kho/phatSinh.js` (PS); phép tính thuần thêm vào `tinh.js`; đường thêm vào `duong.js`.

### 2.1 Số phiếu (E)
A: tách `soPhieuMoi(tx, loai, luc)` từ `duLieu.js:149-150`, `taoPhieuXuat` gọi nó (hành vi PX y nguyên — `thu_KHO2a` canh). B: chép 2 dòng sang mỗi loại. → **A** (một quy tắc một hàm; −2 dòng so với B).

### 2.2 Đặt hàng DH (A)
- `POST /kho/phieu-dat` (NHAN_VIEN): thân `{ mon: [{san_pham_id, so_phan}], nguyen_lieu: [{nguyen_lieu_id, luong}], nha_cung_cap_id, ghi_chu, ma_gui, xem_thu }`.
  Máy chủ triển khai công thức bằng `tinh.trienKhai` có sẵn, gộp với dòng nguyên liệu lẻ (hàm thuần `gopDong` trong `tinh.js`), đơn giá = `gia_nhap` hiện tại,
  tổng ước tính = Σ lượng × giá (thiếu giá → `tong_uoc_tinh = null`). `xem_thu = 1` → trả bảng dòng, KHÔNG ghi (màn hình dùng cho "lượng nhảy theo"
  và xem trước) — MỘT hàm cho xem thử và ghi (K4 BAN-HANG-1).
- Tự duyệt khi: chủ quán; hoặc quản lý và tổng ≤ hạn mức. Còn lại `cho_duyet`. Tổng không tính được (nguyên liệu chưa có giá) = coi như TRÊN hạn mức (an toàn).
- Hạn mức: `kho_han_muc_dat_hang`, thiếu dòng → hằng `HAN_MUC_DAT_HANG_MAC_DINH = 500000` (tinh.js); giá trị lạ → 0 (cùng khuôn "giá trị lạ = chặt hơn" của `nvCanDuyet`, `duLieu.js:99-100`).
- Duyệt DH: quản lý chỉ khi tổng (tính lại từ `don_gia` đã ghi) ≤ hạn mức ĐANG cài; trên → 403 `CAN_CHU_QUAN`. Không ai tự duyệt phiếu mình tạo (khoá có sẵn).
- Đơn KHÔNG đổi tồn (mục 1-A). In: `POST /phieu/:id/in` có sẵn (DH đã duyệt).
- A ~70 dòng / B (đường riêng cho "xem thử" + đường ghi) ~90 dòng và hai biểu thức → **A**.

### 2.3 Nhận hàng PN (B, C)
- `POST /kho/phieu-nhan` (NHAN_VIEN): `{ don_id?, dong: [{nguyen_lieu_id, luong, don_gia, han_dung}], nha_cung_cap_id, ghi_chu, ma_gui }`. Luôn `cho_duyet` (kể cả chủ quán).
  `don_id` phải là DH `da_duyet` còn mở; `han_dung` trống mà nguyên liệu có `han_ngay` → máy chủ điền `hanLo(luc, han_ngay)` (hàm có sẵn `duLieu.js:97`).
  Nhân viên gửi giá từ hoá đơn được, nhưng phản hồi vẫn qua `boGia` (không thấy giá).
- Duyệt (QUAN_LY, người ≠ người tạo — câu khoá có sẵn): mỗi dòng `nhap` sinh một `kho_lo` (`so_luong`, `han_dung`, `gia_von = don_gia`) + gán `lo_id`, CÙNG giao dịch với câu khoá trạng thái.
- "Còn lại" của đơn = Σ dòng `dat` − Σ dòng `nhap` của PN cùng `don_id` đang `cho_duyet | da_duyet`, theo nguyên liệu (hàm thuần `conLaiDon`). Đơn đóng khi mọi dòng còn lại ≤ 0
  — TÍNH, không ghi cột (không thêm trạng thái, không đổi CHECK). PN bị từ chối / huỷ → phần đó tự mở lại.
- Phương án B (lưu trạng thái "đã đóng" vào DH, cập nhật khi duyệt PN) thêm một câu ghi + đường song song khi huỷ / từ chối PN → **chọn A (tính)**.

### 2.4 Phát sinh PS (D)
- `GET /kho/phat-sinh/goi-y?su_co=…` (NHAN_VIEN): "Món nào?" chỉ thứ liên quan — `het_han`: lô (nguyên liệu + thành phẩm) còn hàng, hạn ≤ bây giờ + `SAP_HET_HAN_NGAY`;
  `noi_bo`: thành phẩm làm sẵn còn hàng + món pha tại chỗ có công thức; còn lại: nguyên liệu + thành phẩm còn hàng. Không giá cho nhân viên.
- `POST /kho/phieu-phat-sinh` (NHAN_VIEN): `{ su_co, ghi_chu, muc: [{nguyen_lieu_id | san_pham_id | lo_id, luong}], ma_gui, xem_thu }`.
  Món pha tại chỗ → triển khai công thức ra dòng nguyên liệu (`cho_mon_id`); lô hết hạn → dòng gắn `lo_id` ngay; còn lại gán lô lúc duyệt theo FEFO
  (`chiaTheoLo` có sẵn, lô xếp `han_dung` tăng dần, KỂ CẢ lô quá hạn — khác PX vì đây là bỏ hàng hỏng).
- Duyệt: `noi_bo` vượt hạn mức → luôn `cho_duyet`; còn lại: quản lý / chủ tự duyệt, nhân viên theo công tắc `kho_px_nv_can_duyet` có sẵn.
  Hạn mức nội bộ: `kho_han_muc_noi_bo` (đồng / người / NGÀY giờ VN — xem Câu hỏi 2), giá trị = Σ lượng × giá (nguyên liệu `gia_nhap`, thành phẩm `gia_von` của lô), cộng các PS `noi_bo` `cho_duyet | da_duyet` của cùng người trong ngày; đo TRONG giao dịch ghi.
- Log người / giờ / lý do: `nguoi_tao`, `tao_luc`, `su_co`, `ghi_chu` (bắt buộc khi `su_co = khac`).

### 2.5 Duyệt / từ chối / huỷ / sửa chung (E, F)
- Bỏ `AND loai = 'PX'` ở `duyetPhieu`, `tuChoiPhieu`, `huyPhieu`, `viSaoKhongDoi` (`duLieu.js:202,210,218,225`); `duyetPhieu` gọi `ghiKhoTheoLoai` (PX → `ghiKho` có sẵn · PN → tạo lô · PS → FEFO · DH → không gì). `ghiKetQua` GIỮ khoá PX.
  Phương án B (bốn bộ duyệt riêng) chép bốn lần câu khoá → K4 → **A**.
- Sửa (chủ quán, có lý do): `POST /phieu/:id/sua` rẽ theo `loai`: huỷ phiếu cũ + gọi đúng hàm tạo của loại đó với `thayCho`, tự duyệt (khuôn PX `duLieu.js:231-236`). Xem Câu hỏi 3.
- Sửa / huỷ phiếu đã duyệt chỉ chủ quán (route `CHU_QUAN` có sẵn).

### 2.6 Cài đặt (A, D)
`settings.js`: `kho_han_muc_dat_hang`, `kho_han_muc_noi_bo` chỉ nhận số nguyên ≥ 0 (thêm vào phép `khoaSai`, ~4 dòng); quyền chủ quán đã có (`settings.js:104`).

### 2.7 Đọc
- `GET /kho/goi-y-nhap` (NHAN_VIEN): nguyên liệu đang dùng (tồn, nhóm, cờ dưới tối thiểu, "hay mua" = top `HAY_MUA_SO = 8` nguyên liệu nhiều dòng PN nhất `HAY_MUA_NGAY = 30` ngày),
  món có công thức (cho DH theo công thức), nhà cung cấp, DH đã duyệt còn mở + phần còn lại. Không giá cho nhân viên.
- `docPhieu` thêm `dong` (tên, đơn vị hiện, lượng, giá, hạn, lô) cho DH/PN/PS; DH thêm `con_lai`; PN theo đơn thêm lượng đặt để tô vàng dòng lệch; DH thêm `can_chu_quan`.
- `dsPhieu` dòng tóm tắt: PX giữ như cũ; loại khác tóm tắt từ dòng nguyên liệu / thành phẩm.
- Khoá tiền MỚI (`tong_uoc_tinh`, `gia_tri`) thêm vào `KHOA_GIA` (`tinh.js:57`) — K4: mọi khoá tiền trả ra phải nằm trong danh sách.

**Ước lượng máy chủ:** tinh.js +55 · duLieu.js +35 · nhapHang.js ~150 · phatSinh.js ~110 · duong.js +80 · 007 ~12 · settings.js +4 ≈ **~445 dòng** (ngân sách ~400, vượt ~10% vì
phần "gợi ý" của PS và "hay mua"; nếu chủ quán bỏ "hay mua" thì về ~420).

## 3. Giao diện (G)

| File | Việc | Dòng |
|---|---|---|
| `Kho/ChonNguyenLieu.jsx` (mới) | khung "Đã chọn" trên cùng + ô chạm; tab "Sắp hết & hay mua" · tab nhóm · ô gõ tên lọc (không dấu, `boDau` có sẵn); KHÔNG danh sách dài. Dùng cho DH, mua lẻ, PS | ~70 |
| `Kho/NhanHang.jsx` (mới) | chọn "Theo đơn" (thẻ các đơn còn mở) / "Mua lẻ"; bảng tick từng dòng, nút "Nhận đủ tất cả", sửa số thực nhận (lệch → `kho-vang` có sẵn), thêm dòng ngoài đơn, hạn từng lô, giá; gửi → mở XemPhieu | ~140 |
| `Kho/DatHang.jsx` (mới) | thêm theo công thức (món + số phần) hoặc từng nguyên liệu; bảng gộp lấy từ `xem_thu` của máy chủ; nhà cung cấp; gửi | ~100 |
| `Kho/PhatSinh.jsx` (mới) | 4 bước: Chuyện gì xảy ra? → Món nào? (gợi ý máy chủ) → Bao nhiêu? → Xem phiếu (`xem_thu`) → Gửi | ~110 |
| `Kho/XemPhieu.jsx` | nhánh DH/PN/PS: bảng dòng (tô vàng lệch đơn, còn lại của đơn), nút duyệt ẩn khi `can_chu_quan` mà không phải chủ quán, sửa (chủ quán) mở lại màn tạo đã điền sẵn | +45 |
| `Kho/index.jsx` | thứ tự tab: Pha chế · **Nhận hàng · Phát sinh** · Tồn kho · Phiếu · Nguyên liệu · Sản phẩm & công thức · Định mức · **Đặt hàng** · Nhập từ SX; huy hiệu giữ MỘT vòng 30 s | +8 |
| `Kho/kho.css` | ô chạm, khung Đã chọn, bước; 360–430 px không tràn | +15 |
| `Settings.jsx` | hai ô hạn mức, chỉ chủ quán thấy | +20 |
≈ **~510 dòng** (ngân sách ~450). Phương án B: gộp DatHang vào NhanHang chung một màn "chọn nguyên liệu + bảng dòng" (−40 dòng) nhưng một màn hai việc khó đọc với nhân viên → giữ A,
đổi lại `ChonNguyenLieu` dùng chung cho ba màn (thay vì ba bộ chọn ~200 dòng).
Sau sửa: `(cd client && npm run build)`, commit cả `client/dist/`.

## 4. Bài thử `cong_cu/thu_KHO2b.js` — ánh xạ nghiệm thu (khuôn `thu_KHO2a.js`: database.js thật + libsql kho tạm, route thật, JWT theo vai trò, đồng hồ giả)

| Nghiệm thu | Ca (mỗi ca một vi phạm) |
|---|---|
| A | A1 DH 2 món chung nguyên liệu × số phần → dòng gộp đúng lượng (so BẰNG); A2 DH công thức + nguyên liệu lẻ trùng → gộp; A3 `xem_thu` không ghi phiếu nào (đếm `kho_phieu` trước–sau); A4 quản lý tạo tổng = hạn mức → `da_duyet`, = hạn mức + 1 → `cho_duyet` (ngay trên / ngay dưới); A5 quản lý duyệt DH > hạn mức → 403 `CAN_CHU_QUAN`, chủ quán → 200; A6 nhân viên tạo → `cho_duyet`; A7 thiếu Cài đặt → mặc định 500.000 (ca KHÔNG truyền); A8 nguyên liệu chưa giá → coi như trên hạn mức; A9 DH đã duyệt: tồn không đổi; A10 quản lý đổi `kho_han_muc_dat_hang` → 403, giá trị âm / chữ → 400 |
| B | B1 PN theo đơn: người tạo tự duyệt → 403 `TU_DUYET`, tồn không đổi; B2 người khác duyệt → lô có `han_dung` + `gia_von`, tồn +lượng; B3 từ chối có lý do → tồn không đổi, thiếu lý do → 400; B4 nhận thiếu → `con_lai` đúng phần thiếu, PN thứ hai nhận nốt → đơn đóng; B5 PN bị từ chối → phần đó mở lại; B6 dòng ngoài đơn cộng kho, không đụng `con_lai`; B7 hạn trống + nguyên liệu có `han_ngay` → máy chủ điền hạn; B8 chủ quán tạo PN cũng `cho_duyet` |
| C | C1 mua lẻ (không `don_id`) cùng luật người khác duyệt; C2 `goi-y-nhap` có cờ sắp hết + danh sách hay mua đúng thứ tự, nhân viên không có khoá giá |
| D | D1 `het_han` gợi ý chỉ lô quá / sắp hết hạn (lô còn xa hạn KHÔNG có); D2 PS hỏng trừ FEFO: lô hạn gần trước, kể cả lô đã quá hạn; D3 `noi_bo` gợi ý chỉ thành phẩm + món pha tại chỗ; D4 `noi_bo` tổng trong ngày = hạn mức → theo công tắc, +1 đồng → `cho_duyet` (cộng dồn phiếu trước cùng người cùng ngày; người khác không cộng); D5 món pha tại chỗ nội bộ → trừ nguyên liệu theo công thức; D6 phiếu có `nguoi_tao`, `tao_luc`, `su_co`; `khac` thiếu ghi chú → 400; D7 `xem_thu` không ghi |
| E | E1 bấm hai lần cùng `ma_gui` → một phiếu, cho từng loại DH / PN / PS; E2 số phiếu `DH-`, `PN-`, `PS-YYMMDD-NNN` liên tiếp; E3 nhân viên: quét SÂU mọi phản hồi DH/PN/PS/gợi ý không có khoá trong `KHOA_GIA` lẫn số tiền; E4 quản lý sửa / huỷ → 403; chủ quán sửa PN → phiếu cũ `huy` + phiếu mới `thay_cho_id`, tồn theo phiếu mới |
| F | F1 bảng tồn trước–sau cho DH, PN (tạo / duyệt / từ chối / huỷ / sửa), PS (tạo / duyệt / huỷ); F2 hai quản lý duyệt cùng PN song song → đúng MỘT lô, tồn cộng một lần; F3 hai PS nội bộ cùng người song song quanh ngưỡng → không lọt cả hai dưới hạn mức |
| G | G1 (tĩnh, đọc dist) tab thứ tự đúng; G2 vòng hỏi 30 s vẫn một `setInterval` — huy hiệu đếm cả DH/PN/PS (máy chủ: `?trang_thai=cho_duyet` trả cả ba loại). Tràn 360–430 px: **thử tay** (mục CHƯA KIỂM) |
| H | H1 chạy lại `thu_KHO1.js`, `thu_KHO2a.js` nguyên vẹn (pha chế, PX, tồn, nguyên liệu, công thức, nhập SX, sao lưu / khôi phục); H2 PX sau khi có lô nguyên liệu từ PN: trừ đúng lô còn hạn (đường song song mới mở ra: trước đây chưa có lô nguyên liệu nào); H3 lô nguyên liệu quá hạn từ PN KHÔNG bị PX trừ (quyết định 29.10) |

**Luồng hợp lệ phải KHÔNG bị chặn (K5):** chủ quán đặt hàng trên hạn mức (tự duyệt) · quản lý đặt đúng bằng hạn mức · nhận hàng không có đơn · nhận dư so với đơn · nhận dòng ngoài đơn · PN hai lần cho một đơn ·
PS nhân viên khi công tắc tắt (tự duyệt) · PS hết hạn khi lô đã âm phần · PX của KHO-2a (mọi ca cũ) · phiếu PX cũ trên production (không `don_id`, `su_co`) đọc / in / huỷ như cũ.

**Đường song song cần canh (K4):** bỏ khoá `loai = 'PX'` ở 4 hàm → `ghiKetQua` vẫn PX (đột biến gỡ); `DA_DUYET` ở 2 câu; khoá giá mới ở `boGia`; `maGuiCua/khiTrung` cho 3 đường mới; `soPhieuMoi` gọi ở 4 chỗ tạo; hạn mức đo ở cả tạo lẫn duyệt DH.

**Đột biến dự kiến** (`viec/KHO-2b/dot_bien.py`, tên đầy đủ, chạy từng tên, có đối chứng): `BV-DH-VAO-TON` (bỏ `loai <> 'DH'`) · `VS-HAN-MUC-LON-HON-BANG` (`<=` → `<`) ·
`BV-CAN-CHU-QUAN` · `VS-THIEU-GIA-DUOI-HAN-MUC` (null coi như 0) · `BV-PN-NGUOI-KHAC` · `VS-PN-CONG-LUC-TAO` · `BV-CON-LAI-TRU-PN-CHO` · `VS-FEFO-BO-LO-QUA-HAN` ·
`BV-HAN-MUC-NOI-BO` · `VS-NOI-BO-KHONG-CONG-DON` · `BV-MA-GUI-PN` · `BV-BOGIA-TONG-UOC-TINH` · `BV-KET-QUA-GIU-PX` · `VS-SUA-PN-KHONG-HUY-CU`.

**Ước lượng thử:** thu_KHO2b.js ~520 dòng (ngân sách ~500).

## 5. Phạm vi — đối chiếu
Mọi file trên nằm trong `## Phạm vi`: `server/kho/**` (gồm 2 file mới), `server/nang_cap/**`, `server/routes/settings.js`, `client/src/pages/Kho/**`, `client/src/pages/Settings.jsx`,
`client/dist/**`, `cong_cu/thu_KHO2b.js`, `kiem_tra_truoc_khi_giao.js` (thêm MỘT dòng `chayBaiThat('cong_cu/thu_KHO2b.js')` cạnh `:791`). KHÔNG đụng `backup.js`, `orders.js`, luồng PX
(chỉ dời 2 dòng số phiếu ra hàm chung và bỏ khoá loại ở hàm duyệt chung — `thu_KHO2a` canh hành vi PX y nguyên).

## 6. Câu hỏi cho chủ quán (bản cuối ở mục 7 — mục 7 THẮNG các mục trên khi lệch) — xem `trang_thai.md` mục `## Câu hỏi` (4 câu, mỗi câu kèm đề xuất).

## 7. Sau soát kế hoạch (agent chỉ đọc, 4 câu) — điều chỉnh

**Rút gọn (câu 2):**
- BỎ `xem_thu` (không khớp `ghiPhieu` luôn cần `id`, `duong.js:195-196`). "Lượng nhảy theo" và bước 4 "Xem phiếu" của PS dựng ở màn hình từ
  `GET /san-pham/:id/trien-khai` có sẵn — mở cho NHAN_VIEN (đường này không trả giá, `duong.js:97`). Máy chủ vẫn tự triển khai + gộp lúc GHI (màn hình chỉ hiển thị).
- Triển khai công thức cho DH và PS nội bộ dùng `lapPhieuXuat` (`tinh.js:78`, có sẵn `cho_mon_id`); gộp dùng lại `gop` của `bangPhieu` (tách ra thành hàm, `tinh.js:132`) — không viết `gopDong` mới.
  Dòng `dat` của DH KHÔNG ghi `cho_mon_id` (phiếu cuối chỉ ghi lượng).
- Hai ô hạn mức đặt cạnh công tắc có sẵn ở `Kho/DinhMuc.jsx:40-42` (chủ quán), bỏ phần `Settings.jsx` (−20 dòng).
- Bỏ "Sửa mở lại màn tạo điền sẵn": sửa DH/PN/PS dùng khung sửa số lượng từng dòng ngay trong XemPhieu (như PX `XemPhieu.jsx:132-142`).
- Câu hỏi 4 đổi đề xuất thành **KHÔNG cập nhật giá nhập** trong việc này: đổi `gia_nhap` làm đổi giá vốn thành phẩm của PX (`duLieu.js:174,178`) — trái mục Cấm "không đổi luồng PX".

**Đường song song bổ sung (câu 4):**
- `/phieu/:id/sua`: rẽ theo `loai` TRƯỚC phép `monHopLe` (`duong.js:281-284`); thân sai loại → 400. Ca: gửi `mon` vào sửa PN → không huỷ PN, không tạo PX.
- `docPhieu` đọc lô theo `phieu_id` (`duLieu.js:278`) → thêm đọc theo `lo_id` của dòng (PS trừ lô của phiếu khác).
- `bangPhieu` chỉ đọc `xuat`/`thanh_pham` → nhánh DH/PN/PS trả `dong` riêng, khoá giá tên `don_gia` (đã trong `KHOA_GIA`); số tiền hạn mức trả ra (`tong_uoc_tinh`, `da_dung`, `han_muc`) thêm vào `KHOA_GIA`.
- PS thành phẩm không còn lô → `lo_id` null sẽ không trừ được tồn thành phẩm (tồn thành phẩm = Σ lô, `duLieu.js:317,327`) → lúc duyệt thiếu lô thành phẩm → 409 `KHONG_DU_TON`
  (nguyên liệu vẫn cho âm như PX).
- Huỷ PN đã duyệt mà lô đã bị PX/PS trừ: tồn nguyên liệu vẫn = Σ dòng (có thể âm, báo đỏ như cũ); lô âm tự ẩn (`con > 1e-9`). Có ca thử.
- Huy hiệu: `dsPhieu` trả cờ `can_chu_quan` cho DH; quản lý không đếm DH họ không duyệt được (`index.jsx:40-41`).
- `ma_gui` + `khiTrung` cho cả 3 đường tạo mới (`duong.js:237` tra mọi loại — dùng lại).

**Ca thử bổ sung (câu 3)** — thêm vào bảng mục 4:
- A11 DH dòng `dat` không có `cho_mon_id`, lượng = công thức × số phần; A12 `don_gia` DH = `gia_nhap` lúc đặt, tổng ước tính đúng; A13 DH đã duyệt in được (`/in` → `so_lan_in` 1, 2).
- C3 (tĩnh, đọc nguồn + dist) màn chọn có khung "Đã chọn", tab "Sắp hết & hay mua", tab nhóm, ô lọc; không render toàn bộ danh sách khi chưa chọn tab/lọc — ghi rõ là phép tĩnh, phần dùng thật là thử tay.
- D8 `kho_han_muc_noi_bo`: quản lý đổi → 403, âm / chữ → 400; D9 PS vượt hạn mức: chính người tạo duyệt → 403, quản lý khác → 200 trừ kho; D10 `do_vo` cùng đường `hong`.
- E5 huỷ / sửa DH và PS (chủ quán) + thiếu lý do → 400 cho từng loại mới.
- F4 hai người duyệt cùng DH và cùng PS song song → đúng một lần (PS: FEFO chạy một lần); F5 F1 thêm DH huỷ / từ chối, PS từ chối / sửa; F6 huỷ PN đã bị PX trừ lô.
- G3 (tĩnh) lớp `kho-vang` gắn theo cờ lệch máy chủ trả (`lech: true` khi thực nhận ≠ đặt) — máy chủ có ca kiểm cờ `lech`.
- H4 khôi phục sao lưu với cột mới của 007 (kho trống → nhận cột mới; kho có dữ liệu → không chép đè) — chạy cùng khuôn ca J của `thu_KHO1.js`; bán hàng: `thu_KHO1/2a` đã chạy đường `/orders`? — CHƯA đọc; nếu không, thêm một ca tạo đơn bán sau khi có PN/PS: đơn tạo được, tồn kho không đổi (KHO-3 chưa trừ kho).

**Ước lượng sau điều chỉnh:** máy chủ ~420 · giao diện ~470 · thử ~600 (vượt ~20% vì thêm ~20 ca soát yêu cầu).

**Câu hỏi:** giữ 4 câu ở `trang_thai.md`, câu 4 đổi đề xuất thành "không".
