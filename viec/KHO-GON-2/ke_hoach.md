# KHO-GON-2 — kế hoạch (chờ chủ quán duyệt)

Máy: Claude Code · 28.11.2026 · đọc trên HEAD `0641161` (main `aa9785f5` đã có KHO-GON-1 #110, ANH-MON-1 #109).

## 0. Nói gọn cho chủ quán

Việc này làm 4 thứ: (1) màn **Pha chế** bấm − / + , thấy "tối đa theo kho", món đun nồi chọn theo **số nồi**; (2) **Nhận hàng** gọn, chụp
được **ảnh hoá đơn**; (3) **thẻ nguyên liệu** (chạm một nguyên liệu → xem tồn, lô, lịch sử, ba nút nhận / xuất / chỉnh); (4) **luật duyệt
mới**: ai nhận hàng cũng cộng kho ngay.

Khi đọc code thật mình thấy **3 chỗ phiếu nghĩ khác với code đang chạy** (mục 1). Bốn chỗ cần bạn quyết (Q1, Q2, Q3, Q5) vì đụng số tồn — mình đã ghi đề
xuất ở mục 9, bạn chỉ cần trả lời "đồng ý" hoặc chọn phương án khác.

## 1. Code thật lệch với phiếu (đọc trong lượt này — K1)

| # | Phiếu nói | Code thật | Hệ quả cho kế hoạch |
|---|---|---|---|
| L1 | E2: thêm công tắc mới "Nhân viên xuất kho không cần duyệt", chỉ chủ quán đổi, mặc định TẮT | ĐÃ CÓ từ KHO-2a: khoá `kho_px_nv_can_duyet` (`server/kho/duLieu.js:94,105` — chỉ `'0'` là tắt duyệt, thiếu dòng = cần duyệt); áp cho PX (`duong.js:256–258`) và PS (`phatSinh.js` `tuDuyet = ep \|\| (!vuot && (quanLy \|\| !nvCanDuyet))`); chỉ chủ quán đổi (`server/routes/settings.js:130–133`, 403 `CHI_CHU_QUAN`); nút đang ở màn **Định mức** (`client/src/pages/Kho/DinhMuc.jsx:37,43`) | Máy chủ KHÔNG đổi. Chỉ dời nút sang **Cài đặt kho**, đổi nhãn thành "Nhân viên xuất kho không cần duyệt" (bật = ghi `'0'`). Bài thử E4 vẫn viết đủ (khoá hành vi đang có). |
| L2 | A3: "Máy chủ VẪN chặn như cũ" + Thử: "tổng nhiều món vượt → máy chủ chặn" | Máy chủ **KHÔNG chặn** phiếu xuất pha chế thiếu nguyên liệu: `tinh.js:84` "Hết lô → phần thiếu lo_id null (tồn âm, không chặn)"; đúng chốt KHO-2a (`viec/KHO-2a/phieu.md:41–42` "thiếu thì vẫn ghi, tồn âm, báo đỏ — KHÔNG chặn") | Chặn mới là **đổi luật** → **Câu hỏi Q1** (mục 9). |
| L3 | A4: món đun nồi "ĐÃ biểu diễn được" bằng thành phần = gói | `tinh.trienKhai` (`tinh.js:33–51`) **triển khai thành phần xuống nguyên liệu gốc** — làm trà từ gói sẽ trừ lại thảo dược của gói, **không trừ lô gói**. Gói trà từ SX là món `lam_san` có công thức riêng (`nhapSx.js:184` đơn vị 'gói') | "trừ 2 gói" và "gói hết → 0" của phiếu KHÔNG đạt được nếu giữ nguyên → **Câu hỏi Q2**. |
| L4 | D5: số "4.1999999 g" | Chỗ hiện số thô là **ô sửa công thức** `SanPham.jsx:191` (`so: d.luong_hien`) và ô sửa phiếu `XemPhieu.jsx:217` (`String(d.luong_hien)`); chỗ chỉ đọc đã làm tròn qua `so()` (`chung.js:3`; `SanPham.jsx:13` chép lại một bản) | Một hàm `soGon` ở `chung.js` cho cả ô sửa; `SanPham.jsx` bỏ bản `so` chép, dùng của `chung.js`. |
| L5 | B4: xem ảnh ở chi tiết phiếu | `<img src>` không gửi được khoá đăng nhập; `client/src/utils/api.js` (ngoài Phạm vi) không có hàm đọc blob | Đường đọc ảnh trả JSON `{ kieu, du_lieu (base64) }` qua `api.get` → `<img src="data:…">`. Không sửa `api.js`, không đường ảnh công khai. |

## 2. Phần A — Pha chế

**Máy chủ**
- `tinh.js` thêm MỘT hàm thuần `toiDa(motPhan, ton)`: `motPhan` = [{ khoa, luong }] cho 1 đơn vị (từ `trienKhai(…, 1)`), `ton` = Map khoa → số;
  trả `floor(min(ton / luong) + SAI_SO)`, không âm; tồn ≤ 0 → 0. Dùng cho Pha chế (A2), thẻ nguyên liệu (D1 "đủ khoảng bao nhiêu phần") và
  phép chặn Q1 (nếu duyệt) — MỘT hàm, không chép (LUAT §2).
- `duLieu.docPhaChe` (`duLieu.js:124`) trả thêm mỗi món: `mot_phan` (nguyên liệu cho 1 đơn vị, đơn vị lưu), `toi_da`, `me_ra`, `me_ghi`, và
  một bảng `nguyen_lieu` (id, tên, đơn vị hiện, hệ số, tồn) cho các nguyên liệu xuất hiện — màn tự cộng chân "Thiếu: …" khi bấm − / +
  (chỉ để HIỆN; máy chủ vẫn là nơi quyết định). Tồn = cùng số của màn Tồn kho (`docTon`).
- Món đun nồi (A4): phương án **gửi số nồi** — `monHopLe` (`duong.js:190`) nhận mỗi món ĐÚNG MỘT trong hai: `so_phan` (như cũ — máy chưa
  tải lại vẫn chạy, K5) hoặc `so_noi` (chỉ món có `me_ra`; máy chủ tự nhân `so_phan = so_noi × me_ra`). Lưu số nồi vào cột mới
  `kho_phieu_dong.so_noi` (dòng thành phẩm) để phiếu in lại sau khi đổi "Mỗi mẻ ra" vẫn đúng → **Câu hỏi Q4** (thêm 1 cột ngoài danh sách
  phiếu ghi).
- `PUT /san-pham/:id` (`duong.js:116`) nhận `me_ra` (số > 0 hoặc trống = không theo mẻ; không gửi = giữ — cùng khuôn `han_ngay`) và `me_ghi`
  (chữ ≤ 60 ký tự); `luuSanPham` ghi hai cột.
- Phương án B đã xét (bỏ): màn tự nhân rồi gửi `so_phan` — ít dòng hơn ~6 dòng nhưng "máy chủ tự nhân" là điều phiếu ghi, và phiếu in
  không biết số nồi.

**Màn** `PhaChe.jsx` (viết lại theo bản thử, ~130 dòng): lọc nhóm (chỉ nhóm có món; 1 nhóm thì ẩn hàng nút) · mỗi dòng tick · tên (chạm mở
định lượng) · "Có x · tối đa n" · − [số] + (≥ 40 px) · dòng đỏ "Vượt — kho chỉ đủ n" · chân dính đáy "Thiếu: … (cần x, có y)" + nút
"Xem phiếu & in" khoá khi thiếu · dòng nhắc D4. Tick sẵn: `can_lam > 0`, số = `ceil(can_lam / me_ra)` nồi hoặc `can_lam` đơn vị (A1).
"Xem phiếu & in" = gửi phiếu như nút cũ rồi mở XemPhieu (giữ đúng đường đang chạy — không thêm bước xem trước riêng: bản in A5 đã là phiếu
xem). `XemPhieu.jsx` thêm "× n nồi" và dòng "1 nồi = … → ra n ly" ở phần theo món (A5).

## 3. Phần B — Nhận hàng + ảnh hoá đơn

**Bảng** (bước `034_kho_me_anh.js`, chỉ THÊM): `kho_san_pham.me_ra REAL`, `kho_san_pham.me_ghi TEXT`, `kho_phieu_dong.so_noi REAL` (Q4), bảng
`kho_anh_phieu (id, phieu_id, kieu, du_lieu TEXT base64, co INTEGER, nguoi, tao_luc)` + chỉ mục `phieu_id`. Base64 trong CSDL như
`pos_anh_mon` (bước 037) — không ghi đĩa Render.

**Máy chủ** — file mới `server/kho/anhPhieu.js` (~45 dòng, đọc / ghi ảnh; `duLieu.js` đã 471 dòng):
- `POST /kho/phieu/:id/anh` — thân = byte ảnh (cùng khuôn `products.js:445`): kiểm quyền TRƯỚC khi đọc thân; đọc thân thô giới hạn
  `GIOI_HAN_ANH_PHIEU = 400 * 1024` (hằng số có tên ở `server/utils/anhMon.js`) → quá thì 413 `ANH_QUA_LON`; kiểu theo byte đầu `loaiAnh`
  (dùng lại, không chép) → không phải JPEG / PNG / WebP thì 400 `ANH_KHONG_HOP_LE`; chỉ phiếu **PN chưa huỷ**, người gắn = người tạo phiếu
  hoặc chủ / quản lý (Q5); tối đa `SO_ANH_PHIEU_TOI_DA = 3` — điều kiện đếm viết NGAY trong câu `INSERT … SELECT … WHERE (SELECT COUNT(*) …) < 3`,
  kiểm `changes` (hai người gửi cùng lúc không lọt ảnh thứ 4) → 400 `QUA_SO_ANH`.
- `GET /kho/phieu/:id/anh/:anhId` — CÙNG quyền với `GET /phieu/:id` (`NHAN_VIEN`, `duong.js:279`); câu đọc `WHERE id = ? AND phieu_id = ?`
  (không đọc ảnh phiếu khác bằng cách đổi số); trả `{ kieu, du_lieu }`.
- `GET /phieu/:id` kèm `anh: [{ id, kieu, co }]` (không kèm byte). Danh sách phiếu không kèm ảnh.
- Sửa phiếu nhận (`duong.js` nhánh sửa DH/PN/PS) → chép dòng ảnh của phiếu cũ sang phiếu mới trong CÙNG giao dịch (đường song song K4: không
  thì sửa xong ảnh "mất" khỏi phiếu đang dùng).
- Gửi ảnh SAU khi lưu phiếu (một lần gửi một ảnh): lưu phiếu trước, ảnh hỏng thì phiếu vẫn còn (ảnh không bắt buộc), XemPhieu có nút
  "＋ Ảnh hoá đơn" để gửi lại. Phương án B (ảnh base64 trong cùng thân JSON tạo phiếu) bỏ: thân 3 × 400 KB × 4/3 ≈ 1,6 MB, lỗi ảnh làm hỏng
  cả lần lưu phiếu, và phải viết bộ kiểm cỡ thứ hai.

**Màn**: `NhanHang.jsx` — mỗi nguyên liệu một dòng (tick · tên · "Có x" / đỏ "thấp" khi dưới `ton_toi_thieu` · ô số khi tick), ô tìm, giữ
"hay mua" / theo đơn như cũ; nút "📷 Chụp hoá đơn" (`accept="image/*" capture="environment"`), hiện "≈ KB (gốc MB)", tối đa 3. Hàm thu nhỏ
gom ra `client/src/pages/Kho/anh.js` (`thuNhoAnh(tep, { canh, vuong, chatLuong, kieu })`): Sản phẩm giữ đúng 400 × 400 vuông WebP→JPEG 0,7;
hoá đơn cạnh dài ≤ 1280, JPEG 0,6 — hằng số có tên một chỗ. `cong_cu/thu_ANHMON1.js` H1/H2 đang dò hằng số trong `SanPham.jsx` → sửa đúng
các dòng đó cho đọc `anh.js` (LUAT §6.7–6.8). `XemPhieu.jsx` hiện ảnh thu nhỏ, chạm phóng to.

**B5 sao lưu**: `kho_anh_phieu` vào `BANG_KHONG_XUAT_EXCEL` (`server/routes/backup.js:166`) kèm lý do cạnh dòng (ô Excel tối đa 32.767 ký tự —
cùng lý do chủ quán duyệt cho `pos_anh_mon` 27.11); ảnh chỉ nằm trong Turso, ghi Phát hiện "sao lưu ảnh riêng" (gộp với Phát hiện ANH-MON-1).
`cong_cu/thu_SAOLUU2.js` D2e/D2f/D2g đang so ĐÚNG chuỗi `["pos_anh_mon"]` → sửa đúng các dòng đó thành `["pos_anh_mon","kho_anh_phieu"]`, vẫn
so BẰNG (LUAT §6.7) — **Câu hỏi Q3** xác nhận.

## 4. Phần D — Thẻ nguyên liệu

**Máy chủ** — file mới `server/kho/theNguyenLieu.js` (~45 dòng), đường `GET /kho/nguyen-lieu/:id/the` (`NHAN_VIEN`, nhân viên bị bỏ giá qua
`tinh.boGia` như mọi đường đọc): tồn + nhãn (đủ / dưới ngưỡng / hết), dòng của phiếu **chờ duyệt** chạm nguyên liệu, "dùng cho món" (món có
nguyên liệu trong `trienKhai(…, 1)` + `toiDa` theo đúng nguyên liệu này), lô còn hàng (`conLaiTheoLo`: nhận, còn, hạn), 30 dòng lịch sử gần
nhất (số phiếu, loại, lượng, người, ghi chú, trạng thái). Chỉ ĐỌC.

**Màn** — `TheNguyenLieu.jsx` mới (~150 dòng): ba nút đi **đúng đường có sẵn**: "＋ Nhận hàng" → `POST /kho/phieu-nhan` một dòng (D2, cùng đường
tab Nhận hàng); "− Xuất / hao hụt" → `POST /kho/phieu-phat-sinh` (lý do như Phát sinh); "Chỉnh tồn" → `POST /kho/chinh-tay` (chỉ hiện khi
`duoc_chinh_tay` của `GET /ton`, máy chủ vẫn kiểm `duong.js` `duocChinhTay`). Không đường ghi kho mới.
**Điều hướng (D3)** ở `index.jsx`: một ngăn xếp màn `[{ man, ten }]`; nút "← <màn trước>" + dòng "Nguyên liệu › Cà phê › Nhận hàng"; lưu xong
về đúng thẻ; danh sách bên dưới **không tháo ra** (ẩn bằng `display: none`) nên giữ bộ lọc, ô tìm, vị trí cuộn; mở từ dải "dưới ngưỡng" của
Việc hôm nay thì "←" về Việc hôm nay. Mở thẻ từ Tồn kho và Nguyên liệu (chạm dòng; nút "Sửa" của Nguyên liệu giữ cho chủ / quản lý).
**D4**: một dòng nhắc ở Pha chế. **D5**: `soGon` (mục 1 L4).

## 5. Phần E — Luật duyệt

- **E1**: `nhapHang.taoPhieuNhan` (`nhapHang.js:57,62`) `tuDuyet: ep` → `tuDuyet: true`, luôn `ghiKhoNhan` trong CÙNG giao dịch → mọi vai trò
  nhận là cộng kho ngay; phiếu ghi người nhận (`nguoi_tao` = `nguoi_duyet`); Diễn biến đã ghi qua `viec.sauTaoPhieu` (`viec.js:118–133`) cho mọi
  PN tạo mới — không thêm gì. Sửa chú thích đầu `nhapHang.js`, `duong.js` (dòng "duyệt / từ chối quản lý (người KHÁC người tạo)") và lời nút
  "— chờ người khác duyệt" ở `NhanHang.jsx` (K1: chú thích là khẳng định).
- **Q13 / Q14 (KHO-GON-1)**: luật khoá kết quả pha chế theo MÓN + giờ (`duLieu.chotCham` / `monDaChot`) không đụng; PN tự duyệt giống PX của
  quản lý đã tự duyệt từ trước — kiểm kê `kiemMoc` đã xử lý phiếu duyệt ngay sau mốc. Dòng cam "phiếu chờ bị từ chối sau lần chốt"
  (`viec.canhBaoSauChot`): **GIỮ** — vẫn cần cho phiếu PX / PS chờ của nhân viên và cho PN cũ còn chờ (E3); PN mới không còn chờ nên không
  bao giờ chạm nhánh này.
- **E2**: máy chủ không đổi (L1). Dời nút sang Cài đặt kho (chỉ hiện cho chủ quán), bỏ ở Định mức.
- **E3**: không bước nâng cấp nào đụng `kho_phieu`. PN cũ đang chờ giữ nguyên `cho_duyet`; `duyetPhieu` (`duLieu.js:244`) không đổi → duyệt như
  cũ (người khác người tạo), lúc duyệt mới cộng kho.
- Đặt hàng (DH) giữ luật cũ.

## 6. Ca thử — ánh xạ 1-1 với `## Nghiệm thu`

Bài mới `cong_cu/thu_KHOGON2.js` (giả lập máy chủ thật + CSDL thử, cùng khung `thu_KHOGON1.js`) — trừ C1 và phần giao diện là phép dò mã nguồn.

| Mục | Ca (phải ĐỎ trên `0641161`) |
|---|---|
| A1 | `GET /pha-che` có `toi_da`, `mot_phan`, `me_ra`; món dưới định mức theo nồi → màn tính `ceil` (phép dò `PhaChe.jsx` + `tinh` thuần) |
| A2 | `toiDa`: 1 nguyên liệu (10 / 3 → 3), 2 nguyên liệu (lấy min), đúng biên (9 / 3 = 3 — ca ngay trên + ngay dưới), món dùng gói, gói hết → 0, tồn âm → 0, công thức rỗng |
| A3 | hai món cùng dùng Cam, mỗi món ≤ tối đa nhưng tổng vượt → **nếu Q1 duyệt**: 409 `THIEU_NGUYEN_LIEU`, tồn không đổi; một món vượt → cùng 409. Nếu Q1 = giữ không chặn → ca khoá "tồn âm vẫn ghi" (đã có ở thu_KHO2a) + phép dò nút khoá ở màn |
| A4 | cài `me_ra` 25, `me_ghi` "+ 5 L nước"; gửi `so_noi: 2` → lô 50 ly, **trừ 2 gói** (Q2), dòng `so_noi = 2`; món không cài mẻ gửi `so_noi` → 400; `me_ra` 0 / âm / chữ → 400; không gửi `me_ra` = giữ |
| A5 | `GET /phieu/:id` của phiếu nồi có `so_noi` + `me_ra` ở theo món; phép dò `XemPhieu.jsx` có dòng nồi |
| B1 | phép dò `NhanHang.jsx`: ô tìm, nhãn "thấp" theo `duoi_toi_thieu`, gợi ý nhập giữ |
| B2 | phép dò `anh.js`: 1280 · 0,6 · `image/jpeg` một chỗ; `capture="environment"` ở NhanHang |
| B3 | JPEG thật 200 KB → 200; PDF đổi đuôi .jpg (Content-Type image/jpeg) → 400 `ANH_KHONG_HOP_LE`; 401 KB → 413 `ANH_QUA_LON`; 409 600 byte (đúng 400 KB) → 200; ảnh thứ 4 → 400 `QUA_SO_ANH`; hai lần gửi đồng thời khi đang có 2 ảnh → đúng 1 lọt; gắn ảnh phiếu PX → 400; nhân viên B gắn ảnh phiếu của nhân viên A → 403 |
| B4 | `GET /phieu/:id` có danh sách ảnh; đọc ảnh đúng byte; `anhId` của phiếu khác → 404; vai trò ngoài owner / manager / staff → 403 cả phiếu lẫn ảnh; chưa đăng nhập → 401 |
| B5 | `thu_SAOLUU2` D2e/D2f/D2g (sửa); file Excel xuất không có trang `kho_anh_phieu` |
| D1 | `GET /nguyen-lieu/:id/the`: tồn, nhãn 3 trường hợp, phiếu chờ, dùng cho món + `du_phan`, lô, lịch sử; nhân viên không thấy khoá giá |
| D2 | phép dò `TheNguyenLieu.jsx` gọi đúng 3 đường có sẵn, không đường mới; chỉnh tồn qua thẻ = cùng kết quả `/chinh-tay` |
| D3 | phép dò: danh sách ẩn bằng `display` (không tháo), có dòng đường dẫn, "←" |
| D4 | phép dò dòng nhắc ở PhaChe |
| D5 | `soGon(4.1999999) === '4.2'`; ô sửa SanPham / XemPhieu dùng `soGon` |
| E1 | nhân viên / quản lý / chủ quán nhận → `da_duyet`, tồn cộng ngay, có lô, Diễn biến "Nhận hàng" ghi người nhận |
| E2 | nhân viên xuất (PX, PS) → chờ khi tắt / ngay khi bật; quản lý xuất → ngay; nhân viên / quản lý đổi công tắc → 403 |
| E3 | PN chờ (chèn thẳng CSDL — giả lập dữ liệu cũ) → quản lý khác duyệt được, lúc đó mới cộng; người tạo tự duyệt → 403 `TU_DUYET` |
| E4 | `thu_KHOGON1.js` chạy xanh (kiểm kê / bàn giao không đổi) + các ca E1–E3 |
| C1 | phép dò `kho.css`: nút − / + ≥ 40 px, thanh nút dính đáy, `@media (max-width: 420px)` không tràn ngang; 3 thao tác thử tay ghi ở báo cáo |

**Ai cùng bấm (tiền / tồn):** hai lần gửi ảnh cùng lúc (B3); hai người duyệt cùng một PN cũ (E3 — câu khoá có sẵn `duyetPhieu`, khoá lại bằng ca);
PN gửi hai lần cùng `ma_gui` → một phiếu, tồn cộng một lần (E1 — lô không đôi).

**Phải KHÔNG bị chặn (K5)** — mỗi luồng một ca: món làm sẵn không có mẻ (gửi `so_phan`) · phiếu xuất từ máy chưa tải lại (thân cũ chỉ
`so_phan`, món CÓ mẻ) · Nhận hàng không ảnh · ảnh PNG từ máy tính · nhận theo đơn (DH đã duyệt) · chủ quán sửa phiếu PN / PX cũ · kiểm kê Q8
giảm phiếu chờ · quản lý gửi ảnh phiếu của nhân viên.

**Bài thử cũ phải đổi vì hành vi ĐÃ ĐƯỢC CHỦ QUÁN DUYỆT đổi (E1, LUAT §6.8 — bài sửa thường, không phải `## Bài thử cũ sửa`):**
`thu_KHO2b.js` B1, B4b, B8/C1, E4d… (PN "chờ duyệt" → "đã duyệt ngay"; ca "PN chờ" chuyển sang chèn thẳng CSDL) và các chỗ `thu_KHOGON1.js`
tạo PN bằng nhân viên rồi cho quản lý duyệt (118, 245, 539, 749). `thu_ANHMON1.js` H1/H2, `thu_SAOLUU2.js` D2e–g (mục 3). Trước khi ghi: chạy
bản GỐC từng bài trên code mới (LUAT §6.9) — đỏ thì là bài sửa thường. `thu_KHO2a.js`, `thu_KHO3a.js` chỉ sửa nếu đỏ (Q1 / Q2).

## 7. Đột biến (`viec/KHO-GON-2/dot_bien.py`, mỗi tên một dòng, có đối chứng)

Của phiếu: `VS-toi-da-bo-1-nguyen-lieu` · `VS-noi-khong-nhan` · `VS-anh-tin-duoi-file` · `VS-anh-khong-gioi-han` · `BV-bo-kiem-quyen-xem-anh` ·
`VS-nhan-van-cho-duyet` · `VS-cong-tac-bo-qua` · `VS-nv-doi-cong-tac` · `BV-xuat-nv-khong-duyet-khi-tat`.
Thêm: `VS-anh-dem-ngoai-cau-ghi` (đếm 3 ảnh bằng câu đọc riêng — đua lọt ảnh 4) · `VS-anh-doc-khong-theo-phieu` (bỏ `AND phieu_id = ?`) ·
`BV-sua-pn-mat-anh` · `VS-toi-da-lam-tron-sai` (floor không `SAI_SO` — 3 / 0.1 ra 29) · `VS-goi-trien-khai` (Q2: gói lại triển khai xuống thảo
dược) · `BV-chan-thieu` (Q1, nếu duyệt) · `VS-pn-cu-tu-cong` (E3: PN cũ chờ tự cộng) · `VS-the-lo-gia` (thẻ trả giá cho nhân viên).

## 8. Đường song song đã rà (K4)

- Mọi đường tạo PN: `POST /phieu-nhan`, sửa phiếu (`ep`), nút "Nhận hàng" của thẻ (cùng đường) → một hàm `taoPhieuNhan`.
- Mọi đường ghi PX: tạo, duyệt phiếu chờ, chủ quán sửa (`suaPhieu` → `taoPhieuXuat` → `ghiKho`) — trừ lô gói (Q2) và chặn thiếu (Q1) đặt trong
  `lapPhieuXuat` / `ghiKho` (một chỗ) để ba đường cùng luật; Q1 đề xuất KHÔNG chặn ở đường chủ quán sửa.
- Bán hàng (`banHang.js`) dùng `trienKhai` — **KHÔNG đổi** (Cấm). Trừ lô gói chỉ áp cho phiếu xuất pha chế.
- Đọc ảnh: chỉ `GET /phieu/:id/anh/:anhId`; danh sách phiếu, `docPhieu`, thẻ nguyên liệu, xuất Excel, `/api/kh` không kèm byte ảnh.
- Đường ghi `me_ra`: chỉ `PUT /san-pham/:id` (chủ quán); nhập SX không ghi cột này.

## 9. Câu hỏi cho chủ quán (đề xuất sẵn — bạn chỉ cần trả lời "đồng ý Q1–Q5" hoặc chọn khác)

- **Q1 — Có chặn phiếu xuất pha chế khi kho không đủ nguyên liệu không?** Hiện tại (chốt KHO-2a 29.10) máy chủ vẫn ghi, tồn âm, báo đỏ — KHÔNG
  chặn. Phiếu mới muốn màn khoá nút khi thiếu. **Đề xuất:** màn khoá nút như phiếu (A3), VÀ máy chủ chặn lúc tạo / duyệt phiếu xuất của mọi
  người (409 `THIEU_NGUYEN_LIEU` — cùng mã với bán hàng, LUAT §2), riêng **chủ quán sửa phiếu cũ không chặn** (để còn sửa sổ khi tồn đã âm). Lý
  do: chỉ khoá ở màn thì máy cũ / bấm từ máy khác vẫn ghi được, nhưng chỗ chủ quán sửa phải còn đường. Nếu bạn muốn giữ "không chặn" thì máy
  chủ để nguyên, chỉ màn khoá nút.
- **Q2 — Làm trà từ gói định lượng thì trừ gì?** Hiện tại máy trừ lại thảo dược của gói (như chưa có gói), lô gói trong kho không giảm. **Đề
  xuất:** trong phiếu xuất pha chế, thành phần là món **làm sẵn** (gói) thì trừ **lô gói** (gói hạn gần trước), không đủ gói → 409
  `KHONG_DU_TON` (cùng luật thành phẩm của Phát sinh). Bán hàng không đổi.
- **Q3 — Bảng ảnh hoá đơn không vào file Excel sao lưu hằng ngày** (cùng lý do ảnh món 27.11 — ô Excel tối đa 32.767 ký tự). Ảnh chỉ nằm trong
  Turso; sao lưu ảnh riêng ghi Phát hiện, làm sau. **Đề xuất:** đồng ý.
- ~~Q4~~ — bỏ sau soát kế hoạch (mục 11 S1): không thêm cột `so_noi`.
- **Q5 — Ai được gắn ảnh vào phiếu nhận?** **Đề xuất:** người nhận (người tạo phiếu) và chủ / quản lý; phiếu đã huỷ không gắn; không giới hạn giờ
  (gắn bù khi lúc nhận mạng yếu). Ai xem được phiếu thì xem được ảnh.

## 10. Ngân sách

| | Dòng ước | Phiếu |
|---|---|---|
| Máy chủ | ~190 (tinh 20 · duLieu/pha chế + gói 45 · duong 55 · anhPhieu 45 · theNguyenLieu 45 · nhapHang 3 · 034 20 · backup 2) | |
| Màn | ~330 (PhaChe 130 · NhanHang +40 · TheNguyenLieu 150 · index +30 · XemPhieu +30 · CaiDatKho/DinhMuc ±6 · anh.js 20 · css 25) | |
| Cộng code | **~520** | ~450 → **vượt ~15 %**: thẻ nguyên liệu (D, thêm 27.11) là màn mới trọn vẹn; trừ lô gói (Q2) chưa có trong ước lượng của phiếu. Q2 = không thì ~490. |
| Bài thử | ~480 (thu_KHOGON2 mới + sửa thu_KHO2b / KHOGON1 / ANHMON1 / SAOLUU2) | ~450 |

Thứ tự làm sau khi duyệt: E (nhỏ, sửa bài thử cũ) → B máy chủ + 034 → A máy chủ → D máy chủ → màn (A, B, D) → build → bài thử → soát → soát bảo mật.

## 11. Sau soát kế hoạch (agent chỉ đọc, 28.11) — các mục này THẮNG mục 2–8 nếu khác

Agent xác nhận L1–L4 đúng; L5 đúng một nửa (`api.js` có đọc blob nhưng chỉ để tải file — kết luận base64 JSON giữ nguyên). Đã sửa:

- **S1 — bỏ cột `so_noi` và đổi `monHopLe` (phương án ngắn hơn, phiếu A4 cho phép).** Màn gửi `so_phan` = nồi × `me_ra` (đường phiếu xuất KHÔNG đổi
  thân); phiếu xem / in hiện "n nồi" = `so_phan / me_ra` (máy chủ tính ở `docPhieu`, chỉ khi chia hết trong `SAI_SO`, không thì chỉ hiện số ly).
  Lý do thêm: cột `so_noi` sẽ cũ sau chủ quán sửa phiếu (`duong.js:343`) và kiểm kê Q8 giảm phiếu chờ (`kiemKe.js:130–145`) — hai đường song song
  phải vá. Bước 034 chỉ còn `me_ra`, `me_ghi`, bảng ảnh (đúng danh sách phiếu). Đột biến `VS-noi-khong-nhan` → canh màn nhân số nồi
  (`PhaChe.jsx` gửi `nồi × me_ra`) + máy chủ trả `so_noi` đúng ở phiếu đọc.
- **S2 — Q2 chỉ áp cho phiếu xuất pha chế.** Không sửa `trienKhai` (bán hàng `banHang.js:48,63,147` gọi thẳng — Cấm). `lapPhieuXuat` thêm tham số
  có MẶC ĐỊNH = hành vi cũ (KHUON_LOI bổ sung 11.11); chỉ `taoPhieuXuat` truyền "trừ lô món làm sẵn". Đặt hàng (`nhapHang.js:22`), phát sinh nội
  bộ (`phatSinh.js:56`), gợi ý nhập (`nhapHang.js:84`), `phatSinh.goiY` (`:37`), `/san-pham/:id/trien-khai` (`duong.js:110`) giữ nguyên — ghi
  Phát hiện: các đường đó vẫn tính gói theo thảo dược. `toiDa` của món dùng gói tính trên lô gói còn hạn.
- **S3 — E4 dùng lại** ca công tắc đã có ở `thu_KHO2a.js:316–330`; `thu_KHOGON2` chỉ thêm phần thiếu (PS nhân viên ngay khi bật + Diễn biến; DH
  không đổi; nút ở CaiDatKho, không còn ở DinhMuc).
- **S4 — ca thử bổ sung:** A1 lọc nhóm / ẩn hàng nút khi 1 nhóm (phép dò) · A3 dòng đỏ "Vượt — kho chỉ đủ" + chân "Thiếu:" (phép dò nhánh vẽ +
  đột biến "luôn ẩn") · A4 dòng "1 nồi = …" ở PhaChe, `me_ghi` > 60 ký tự → 400 · A5 chỗ ký Người pha / Quản lý (phép dò) · B2 "≈ KB (gốc MB)" ·
  B3 gắn ảnh phiếu PN đã huỷ → 409 · D2 nhân viên không thấy / không gọi được Chỉnh tồn (403 có sẵn) · D3 lưu xong về thẻ, giữ cuộn, "←" về Việc
  hôm nay · E2 DH không đổi · đăng ký `cong_cu/thu_KHOGON2.js` vào `kiem_tra_truoc_khi_giao.js` (danh sách bài chạy thật) · `npm test`,
  `--day-du`, `node tu_chay/cong.js chay`.
- **S5 — đường song song bổ sung:** `ViecHomNay.jsx:62–65` chạm dải "dưới ngưỡng" hiện đang giao việc "gọi thêm" → giữ nút giao việc, chạm TÊN
  nguyên liệu mới mở thẻ; "Hàng về → nhận" (`:80`) là lối thứ hai vào Nhận hàng — giữ. `TonKho.jsx:34,48` đã có Chỉnh tồn tay → thẻ dùng CHUNG
  khối chỉnh tay đó (tách thành component nhỏ, lấy `moc` / `moc_luc` / `duoc_chinh_tay` từ `GET /ton` như hiện nay — `kiemMoc` `kiemKe.js:227`),
  không viết khối thứ hai. `index.jsx:93–106` đang tháo tab khi mở phiếu → cách "ẩn bằng display, không tháo" áp cho CẢ XemPhieu và thẻ.
- **Q1** giữ là câu hỏi (phiếu mục Thử ghi "máy chủ chặn", trái chốt KHO-2a): chủ quán chọn "chặn ở máy chủ" (đề xuất) hoặc "chỉ khoá ở màn".
- **Ngân sách** sau S1: code ~500 dòng (bỏ ~20 dòng `so_noi`, thêm ~10 dòng khối chỉnh tay dùng chung).
