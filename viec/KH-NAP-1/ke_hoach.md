# KH-NAP-1 — kế hoạch (chờ chủ quán duyệt)

**Nói gọn:** khách nạp tiền trên App = thêm MỘT loại dòng "nạp" vào đơn App, đi đúng đường nạp ở quầy (không cửa `/nap` riêng). Thẻ hạng và nạp
chỉ trả tiền thật = MỘT hàm kiểm dùng ở đúng hai chỗ đang chặn nạp. Tiền về muộn của đơn chỉ thẻ / chỉ nạp = máy tự chốt đơn bằng CHÍNH hàm chốt
mà quầy dùng khi xác nhận tay. Lịch sử tài khoản = đọc thẳng sổ ví đang có.

Số dòng code đọc trong lượt này (main 6fe3f4f — sẽ đọc lại sau khi chat gộp VOUCHER-2):
`orders.js` 230–241 (chặn nạp), 528–577 (dòng thẻ / dòng nạp), 1058 (ghiVi topup) · `giuCho.js` 43–46 (chặn nạp lúc giữ), 99 (`muon`) ·
`donApp.js` 45–51 (CACH_TRA, GIU_MA), 59–63 (bamGio), 97–117 (docGio), 121 (gioCanPhaChe), 163–164 (thanDon), 189–191 (baoGia ghép), 265–267 (dongThan),
428–445 (dsQuay), 392–404 (chiTietDon) · `thanh-toan.js` 86–91 (PHIEN_APP_KHONG_TAO_LAI), 143–196 (xuLyTienVe; vị từ cũ ở 176) · `wallets.js` 78–101 (ghiVi), 284 ·
`viKhach.js` toàn file · `goi-nap.js` 37–44 · `kh/index.js` 136–183 (cửa không token, giuLuotMenu), 263–282.

## 1. Phần và phương án

### P1 · Vị từ "chỉ trả tiền thật" (B1–B3)
- **A (chọn)** — `viKhach.js` thêm `loiTienThat(don)`: đơn có `goi_nap_id` → `{ code: 'NAP_CHI_TIEN_MAT_QR', error: <lời NAP-1 cũ> }`; có `membership_buy` →
  `{ code: 'THE_KHONG_TRA_VI', error: 'Thẻ hội viên chỉ trả tiền mặt (ở quầy) hoặc chuyển khoản — không trừ số dư tài khoản' }`; còn lại null.
  Gọi ở ĐÚNG hai chỗ:
  - `giuCho.taoPhien` (thay khối 43–46): `tru_tai_khoan || tru_tai_khoan_me || cach === 'tai_khoan'` → lỗi của `loiTienThat(don)`.
  - `orders.js taoDon` (khối 230–241): tách điều kiện "trừ tài khoản" (`balance_amount > 0 || parent_balance_amount > 0 || payment_method === 'balance'`) ra
    dùng `loiTienThat`; phần riêng của nạp (nợ, mã, phí giao → `NAP_CHI_TIEN_MAT_QR`) giữ nguyên. Đặt NGAY SAU khối nạp, TRƯỚC cổng PIN / payOS
    (khỏi báo `VI_PHAI_QUA_PIN` thay cho mã đúng). Áp cả đơn (thẻ + đồ uống / gói cũng chặn — B2). Nạp + thẻ cùng đơn: `NAP_KHONG_GOP` vẫn đứng trước.
  - ~1 file mới 0 · sửa 3 file · ~+14 dòng. Rủi ro: chặn oan đơn không có thẻ → ca K5 (đồ uống / gói trả số dư, ví mẹ cho đồ uống).
- B — viết điều kiện thẻ ngay tại hai chỗ (không hàm): ~+10 dòng nhưng HAI biểu thức sẽ lệch nhau (K4 "một vị từ") → bỏ.

### P2 · Dòng nạp trong đơn App (A1–A5, A7, A8)
- **A (chọn)** — `donApp.js`:
  - `docGio`: nhận `{ loai: 'nap', ma_goi, so_luong? }` (khoá trắng `TRUONG_NAP = ['loai','ma_goi','so_luong']`, `ma_goi` nguyên ≥ 1, `so_luong` bỏ / 1; sai → 400
    `YEU_CAU_KHONG_HOP_LE`); hơn một dòng nạp → `NAP_KHONG_GOP`; trả thêm `nap` (dòng nạp | null). `mon` chỉ còn dòng món → `gioCanPhaChe` = không với giỏ
    chỉ nạp (A4, không viết luật giờ riêng).
  - `bamGio`: dòng nạp băm `['nap', ma_goi, so_luong ?? 1]` (dòng món / thẻ băm như cũ — khoá gửi đang sống không lệch).
  - `thanDon(..., nap)` (và `chiTinh` + hai lời gọi trong `baoGia` + lời gọi trong `datDon` truyền `nap` theo) thêm `goi_nap_id: nap.ma_goi` → báo giá + tạo phiên + chốt phiên đều qua `taoDon` (giá = `khach_tra` máy chủ tra, hai ngăn, 0 điểm,
    không mã bill — NAP-1 có sẵn). Nạp + món / thẻ → `taoDon` trả `NAP_KHONG_GOP` (không kiểm lại ở App).
  - `GIU_MA` thêm `NAP_KHONG_GOP`, `GOI_NAP_KHONG_CO`, `NAP_CHI_TIEN_MAT_QR`, `THE_KHONG_TRA_VI` (trả nguyên mã + lời quầy); `routes/kh/loi.js` thêm 4 mã
    đó để `thanLoi('NAP_KHONG_GOP')` của docGio dùng được.
  - `baoGia` ghép: dòng nạp ↔ dòng `product_id ≤ ID_NAP_TU` của `ct.items`; `monCt` lọc bỏ cả dòng nạp. Dòng báo giá
    `{ loai:'nap', ma_goi, ma:null, so_luong:1, don_gia, thanh_tien }` (A3). `ma_giam` gửi kèm → `taoDon` lỗi `NAP_CHI_TIEN_MAT_QR` → nhánh "tính lại không mã"
    có sẵn → `ma_giam_loi` (không thêm nhánh).
  - `datDon` `dongThan`: dòng nạp `ten` = `product_name` của dòng `ct.items` (chính chuỗi `taoDon` ghi: "💳 Nạp 100.000đ → vào tài khoản 105.000đ"),
    `ghi_chu` null, xếp SAU món như dòng thẻ → hình thân đơn chưa trả = đơn thật (A8).
  - `chiTietDon` (đơn thật): dòng `product_id ≤ ID_NAP_TU` → `loai: 'nap'`. `dsQuay`: thêm `co_nap` (tên dòng nạp), `mon` lọc mọi dòng có `loai`.
  - Tiền về đủ đúng hạn: đường webhook → `chotPhien` → `taoDon` có sẵn (A5, không đổi). Huỷ App chưa trả: `huyDon` có sẵn. Đơn nạp đã trả: route huỷ / xoá
    quầy đã chặn `laDonNap` (orders.js 1589, 1801) — đơn App huỷ qua route quầy (HUY-1, `oid`) đi đúng route đó (A7, chỉ thêm ca thử).
  - ~sửa 2 file · ~+30 dòng. Rủi ro: lệch ghép dòng báo giá (K4 — `monCt` phải bỏ dòng nạp), băm giỏ cũ đổi (ca thử khoá gửi cũ).
- B — cửa riêng `POST /nap` + `GET /nap/:ma` như hợp đồng v16 "Đã hẹn": thêm 2 route + khoá gửi + đọc lại riêng, ~+120 dòng, App phải làm màn riêng → bỏ
  (phiếu đã chốt hướng A).

### P3 · Tiền về muộn đủ quyền lợi (A6) — trả lời Q-A
- **A (chọn — bản soát kế hoạch đề xuất, ngắn hơn bản đầu và bịt một lỗ)** — `thanh-toan.js xuLyTienVe`: KHÔNG thêm lời gọi chotPhien thứ hai, dùng lại
  lời gọi sẵn có (dòng 180) bằng MỘT cờ:
  ```
  const chiTheNap = (x) => { const d = JSON.parse(x.than); return !d.items?.length && !d.package_buy && (!!d.membership_buy || d.goi_nap_id != null); };
  const muonChot = laApp && vaoViDuoc(p) && p.trang_thai !== 'loi' && chiTheNap(p) && t.soTien === p.con_lai
    && !(await congKiaDaBao({ query }, t));
  if (laApp && vaoViDuoc(p) && !muonChot) return vaoVi(p);                       // dòng 176 cũ thêm `&& !muonChot`
  const lyDo = t.soTien !== p.con_lai ? `lệch tiền: …` : luc > p.het_han && !muonChot ? 'tiền về sau khi QR hết hạn' : null;   // vế lệch tiền giữ nguyên
  const kq = await chotPhien(p, t.nguon, { muon: muonChot, maGd: t.maGd,
    suKien: (tx) => tx.run(CAU_GHI, thamSo('khop', muonChot ? 'tiền về muộn — máy tự chốt đơn chỉ thẻ / chỉ nạp' : null)) });
  ```
  Chốt hỏng đi ĐÚNG nhánh cũ có sẵn: đọc lại `moi` → `vaoVi(moi)` (dòng 184–185) hoặc nhánh `PHIEN_DA_CHOT` (186–193). Lệch tiền → cờ tắt → `vaoVi(p)` y như hiện nay
  (nếu để cờ bật khi lệch thì khoản đó thành `chua_khop`, không vào ví — lùi so với bây giờ; ca N6g khoá). Bản đầu của kế hoạch (khối `if` riêng) rơi xuống dòng 176 với `p` cũ →
  có thể `vaoVi(p)` SAU khi quầy vừa xác nhận tay → khách được hai lần; bản này không có đường đó.
  - **Báo rõ lý do khi không chốt được (A6 "báo rõ quầy + khách"):** chotPhien kiểu muộn không đánh dấu `loi` (giuCho.js:130 `!muon`), nên lý do bị mất. Thêm:
    trước `vaoVi(moi)` của nhánh này, ghi `UPDATE pos_phien_thanh_toan SET ly_do = <code> WHERE id = ? AND trang_thai IN ('cho','huy')` (không đổi trạng thái);
    `vaoVi` đưa lý do vào câu `dau` + ghi chú ví ("không chốt được đơn …"); `thongBaoTienVe` (donApp.js:81) dùng `lyDoNgan(p_ly_do)` khi có. ~+4 dòng.
  - **Nhật ký đơn:** đơn chốt muộn tự động KHÔNG có dòng nhật ký "xác nhận tay" (giuCho.js:122 chỉ ghi khi `nguon === 'tay'`) — cố ý; dấu vết là dòng báo 'khop'
    có `ly_do` "tiền về muộn — máy tự chốt…" + phiên `nguon` = cổng. Đối soát (doiSoat.js:276–285) không lệch: 'khop' chỉ vào lưới vượt, mỗi khoản một lần.
    Đối soát CHƯA có mục CẦN XEM cho đơn chốt muộn tự động (xác nhận tay muộn thì có) → `## Câu hỏi` 2.
  - **Khoá chống trùng:** câu ghi `trang_thai IN ('cho','huy') → 'da_thu'` của `vaoGiaoDich` (chotPhien kiểu muộn có sẵn) — báo lặp cùng khoá: lần 2 thấy phiên
    `da_thu` → không vào vị từ (cần `cho` / `huy`) → nhánh `chua_khop` cũ, `ON CONFLICT(khoa) DO NOTHING` → không ghi gì. Hai báo cùng lúc: một bên thắng câu
    ghi, bên thua nhận `PHIEN_DA_CHOT` → nhánh `PHIEN_DA_CHOT` cũ (chua_khop, không cộng ví).
  - **Hai cổng:** `congKiaDaBao` kiểm trước (đọc ngoài giao dịch); lọt đua thì câu ghi phiên chặn (như trên) → bên sau chua_khop "đã chốt bằng báo cổng kia".
  - **Phiên khách tự bấm huỷ:** `huy` nằm trong vị từ → vẫn chốt (đúng A6 "đơn đã huỷ"). Phiên `loi` (đơn hỏng lúc tiền về đúng hạn) → KHÔNG chốt, vaoVi như cũ.
  - **Đơn có đồ uống:** `chiTheNap` sai → nhánh cũ (vaoVi) — không đổi.
  - **Cần MỘT dòng ngoài khối chặn trong `giuCho.js chotPhien`:** `const muon = nguon === 'tay' && them.muon === true;` → `const muon = them.muon === true;`
    (chỉ hai nơi truyền `muon`: route xác nhận tay và chỗ mới này). Sửa cùng hai câu chú thích giuCho.js:9 và :97 (đang ghi "CHỈ route xác nhận tay" — K1). → `trang_thai.md ## Câu hỏi` 1, chủ quán duyệt cùng kế hoạch.
  - **Xác nhận tay phiên App muộn (`PHIEN_APP_KHONG_TAO_LAI`): GIỮ chặn** (đề xuất). Lý do: tiền về muộn của đơn chỉ thẻ / nạp nay máy tự chốt; khi máy KHÔNG
    chốt được thì tiền đã vào ví (vaoVi) — mở xác nhận tay lúc đó là tạo đơn lần hai cho cùng một khoản (khách được cả số dư lẫn thẻ / tiền nạp). Giữ chặn =
    0 dòng sửa.
  - ~sửa 3 file (thanh-toan, giuCho, donApp thongBaoTienVe) · ~+12 dòng. Rủi ro: chốt hai lần (ca báo trùng song song), cộng ví + chốt cùng lúc (ca "không chốt được → vaoVi đúng MỘT lần").
- B — gọi `chotPhien(p, 'tay', { muon: true, nguoi: t.nguon })` để khỏi sửa giuCho.js: phiên ghi `nguon = 'tay'` và nhật ký "Xác nhận tay" sai sự thật, Đối soát
  đếm nhầm vào xác nhận tay → bỏ.

### P4 · `GET /goi-nap` (C1) + `GET /vi` (D1–D4) — trả lời Q-D
- **A (chọn)** — `goi-nap.js` tách câu đọc gói đang bật thành `dsGoiBat()` (export; route quầy `GET /` gọi lại nó — MỘT câu, cùng thứ tự `thu_tu, khach_tra, id`).
  `kh/index.js` thêm `GET /goi-nap` cạnh `/chuong-trinh` (TRƯỚC `xacThucKhach`, `giuLuotMenu` chung trần /menu) → `data[] { ma: id, ten, tra: khach_tra,
  vao: vao_tk }`; thêm `GET /vi` sau `/voucher` (sau token). Phép đọc sổ ví ở file MỚI `server/utils/lichSuVi.js` (`lichSuVi(phone, trang)`) — không đụng
  file VOUCHER-2 / KET-NOI-1 sửa (donApp.js chỉ đụng chỗ dòng nạp).
  - Câu đọc: `pos_balance_transactions t LEFT JOIN pos_orders o ON o.id = t.order_id LEFT JOIN pos_phien_thanh_toan p ON p.order_id = o.id LEFT JOIN
    pos_don_app a ON a.phien_id = p.id WHERE t.customer_phone = ? AND t.type IN (LOAI_TINH_VAO_VI) ORDER BY t.created_at DESC, t.id DESC LIMIT 21 OFFSET ?`
    (`LOAI_TINH_VAO_VI` import từ wallets.js — không danh sách thứ hai). 20 dòng / trang, `con_nua` = có dòng 21.
  - ~1 file mới (~45 dòng) · sửa 2 file (~+20). Rủi ro: lộ dữ liệu khách khác / ghi chú tay (ca D4), dòng không đổi số dư lọt vào (ca `debt_payment`).
- B — viết thẳng trong `kh/index.js`: file đó đang 337 dòng, thêm ~60 dòng phép tính → trái luật "routes chỉ nhận yêu cầu" → bỏ.

#### Q-B · Bảng ánh xạ `type` → `loai` (grep `ghiVi(` + `INSERT INTO pos_balance_transactions`, đọc trong lượt này)
| Ai ghi (file:dòng) | `type` | Điều kiện | `loai` | `ghi_chu` (câu cố định POS) |
|---|---|---|---|---|
| orders.js:1059 bán gói nạp (quầy + App) | topup | có `order_id` | `nap` | "Nạp tiền vào tài khoản" |
| wallets.js:167 nạp tay | topup | không đơn, người ghi là nhân viên | `nap` | "Nạp tiền tại quầy" |
| thanh-toan.js:171 vaoVi (tiền về muộn / đơn App không tạo được) | topup | không đơn, `created_by IN ('payos','sepay','tingee')` | `nap` | "Tiền chuyển khoản của đơn App chưa tạo được — đã cộng vào tài khoản" |
| orders.js:981 trả đơn (khách) | purchase | có đơn, `o.customer_phone` = SĐT token | `tra_don` | "Thanh toán đơn" |
| orders.js:981 trả đơn bằng ví mẹ | purchase | có đơn, `o.customer_phone` ≠ SĐT token | `tra_don` | "Trả hộ đơn bằng tài khoản của bạn" (`ma_don` null, không tên / SĐT) |
| wallets.js:199 trừ tay | purchase | không đơn | `dieu_chinh` | "Quán điều chỉnh số dư" |
| wallets.js:114 / 119, refunds.js:174 / 178 hoàn (huỷ, xoá, duyệt hoàn, kết thúc gói) | refund | — | `hoan_don` | "Hoàn tiền đơn" (đơn người khác: "Hoàn tiền đơn trả hộ") |
| damages.js:213 đền bù | compensation | — | `hoan_don` | "Đền bù đơn" |
| wallets.js:238 điều chỉnh | adjust | ± | `dieu_chinh` | "Quán điều chỉnh số dư" |
| orders.js:1486 thu nợ | debt_payment | — | KHÔNG hiện (không trong `LOAI_TINH_VAO_VI`, không đổi số dư) | — |
- `so_tien` = `amount` (có dấu), `thuong` = cột `thuong` (có dấu; dòng trước NAP-1 = 0), `ngay` = `created_at` (giờ VN — ghiVi ghi `getNow`).
- **Ví mẹ trả đơn người khác:** nhận ra bằng `o.customer_phone <> t.customer_phone` (dòng ví mẹ ghi SĐT mẹ, đơn mang SĐT con). `ma_don` = `COALESCE(a.ma, o.code)`
  CHỈ khi `o.customer_phone = t.customer_phone` (mã mở được bằng `GET /don/:ma` của CHÍNH khách — CAU_DON nhận cả mã App lẫn mã bill), còn lại null.
  Đơn đã xoá (không còn `o`) → `ma_don` null. `notes` / `created_by` / `customer_name` KHÔNG trả ra (D4).
- `qua_chao_mung` / `qua_het_han`: để QUA-1 (Cấm).

## 2. Giao diện quầy (B5, E1)
- `tinh.js lyDoKhongTru({ khach, laNap, laThe })` thêm `if (laThe) return 'Thẻ hội viên chỉ trả tiền mặt hoặc chuyển khoản'` (đối số mới mặc định — lời gọi cũ
  không đổi). `BanHangMoi.jsx`: `const laThe = !!layThe(gio)`; `chiaTra` dùng `dungTK && !laNap && !laThe` (cả `dungMe`); `ThuTien` nhận `laThe`, khách xoá
  số dư y như giỏ nạp. Chỗ dùng `laNap` để ẩn mã giảm / giao KHÔNG đổi (thẻ vẫn có mã, giao như cũ). `ThuTien.jsx` chuyển `laThe` vào `lyDoKhongTru`.
  ~+6 dòng. Màn Bán hàng cũ `Sales.jsx`: không sửa (Cấm) — máy chủ chặn `THE_KHONG_TRA_VI`, màn hiện lời báo.
- `DonApp.jsx`: một dòng `{d.co_nap && <div …>{d.co_nap} — {da_huy ? 'đơn đã huỷ' : 'đã vào tài khoản, không pha'}</div>}` cạnh dòng `co_the`; đơn nạp không
  nút Đang làm / Xong vì `tien_trinh` = `xong` sẵn (như đơn chỉ thẻ). ~+2 dòng. Build `client/dist`.
- E2: báo cáo / Đối soát / in theo `sqlDonNap` — đơn nạp App là đơn có dòng `product_id ≤ ID_NAP_TU` như quầy, không cần sửa; chỉ ca thử.

## 3. Hợp đồng `/api/kh` v17 (F1) — `HOP_DONG_API_KH.md`
Bảng cửa: thêm `GET /goi-nap`, `GET /vi`; `POST /gio/bao-gia` / `POST /don` thêm dạng dòng `{ loai: "nap", ma_goi, so_luong? }`. "Ghi chú v17" đủ A–D (luật đơn
riêng, mã lỗi, `ma_giam_loi`, mọi giờ, tiền về muộn đủ quyền lợi, `/vi` bảng `loai`). "Ghi chú v13": thêm "dòng thẻ chỉ `cach_tra: "qr"`" + `THE_KHONG_TRA_VI`,
sửa câu tiền về muộn theo A6. "Đã hẹn": chuyển NAP-2 lên bảng, BỎ `POST /nap`, `GET /nap/:ma`. Khối máy đọc + mã lỗi mới; `PHIEN_BAN: 17`; nhật ký v17.
`cong_cu/thu_HOPDONG_KH.js` canh khớp code — chạy lại sau sửa. (Sau khi gộp VOUCHER-2 mang v15: đọc lại số đang có, vẫn lên v17.)

## 4. Ca thử — `cong_cu/thu_KHNAP1.js` (bài mới, ĐỎ trên gốc) ánh xạ 1-1 Nghiệm thu
| Nghiệm thu | Ca |
|---|---|
| A1 | N1 báo giá giỏ `[nap]` → 200, `tong` = `khach_tra`; N1c `so_luong: 1` tường minh → 200, băm = bỏ trống; N1b dòng nạp khoá lạ / `ma_goi` 0 / "1" / `so_luong` 2 → 400 `YEU_CAU_KHONG_HOP_LE` |
| A2 | N2 (trong giờ, món hợp lệ — ngoài giờ kiemGio chạy trước, ra `NGOAI_GIO`) nạp + món → 400 `NAP_KHONG_GOP`, không phiên / không dòng pos_don_app; N2b nạp + thẻ → `NAP_KHONG_GOP`; N2c hai dòng nạp → `NAP_KHONG_GOP`; N2d gói tắt / không có → `GOI_NAP_KHONG_CO`; N2e `cach_tra` `vi` và `vi_qr` → 400 `NAP_CHI_TIEN_MAT_QR` (nguyên mã, không `DON_KHONG_HOP_LE`), ví không đổi, không phiên giữ; N2f `ma_giam` → 200 + `ma_giam_loi`, đơn không mã |
| A3 | N3 `dong[0]` = đúng `{ loai, ma_goi, ma:null, so_luong:1, don_gia, thanh_tien }`, `giam` = [] |
| A4 | N4 quán đóng / quá giờ nhận đơn: báo giá + đặt giỏ chỉ nạp → 200; giỏ đồ uống cùng lúc → `NGOAI_GIO` (đối chứng) |
| A5 | N5 QR → webhook đúng số → `/toi.so_du_vi` tăng `vao_tk`, ví `thuong` tăng `vao_tk − khach_tra`, 0 điểm, `tien_trinh` `xong`; N5b báo trùng (lặp + hai báo song song) → một đơn, ví cộng một lần; N5c chưa thu → số dư không đổi |
| A6 | N6a nạp về muộn (QR hết hạn) đúng số → đơn nạp, cộng đủ `vao_tk` (cả thưởng), `GET /don/:ma` `xong`, không dòng `vao_vi`; N6b đơn nạp khách đã bấm huỷ rồi tiền về → như N6a; N6c thẻ về muộn → lên hạng, hạn tính từ lúc chốt; N6d về muộn báo trùng (lặp + song song) → chốt một lần, ví / sổ thẻ một dòng; N6e đồ uống về muộn → vẫn `vao_vi`, không đơn (K5); N6f gói nạp đã tắt / khách đã có hạng cao hơn rồi tiền về muộn → `vao_vi` đúng một lần + thông báo; N6g tiền lệch số về muộn → `vao_vi` đúng số đã về (như hiện nay), không đơn; N6h cổng kia đã báo → chua_khop, không chốt, không cộng; N6i phiên `loi` → vao_vi, không chốt; N6j xác nhận tay phiên App muộn (chỉ thẻ) → vẫn 409 `PHIEN_APP_KHONG_TAO_LAI`; N6k giá gói nạp đổi giữa lúc tạo QR và lúc tiền về muộn → vao_vi một lần, không đơn; N6l không chốt được → `thong_bao_tien_ve` (khách) và dòng `vao_vi` ở dsQuay (quầy) nêu lý do; N6m quầy xác nhận tay phiên App CÒN hạn rồi tiền về muộn → không cộng ví (chua_khop), một đơn |
| A7 | N7c đơn nạp App đã trả: yêu cầu hoàn (refunds.js:122) → `NAP_KHONG_HOAN`; báo sự cố (damages.js:180) → `DON_NAP_KHONG_SU_CO` · N7 App huỷ đơn nạp chưa trả → `da_huy`, tiền về sau đó → chốt muộn (= N6b); N7b đơn nạp App đã trả: quầy huỷ (route HUY-1 qua `oid`) / xoá → 400 `NAP_KHONG_HOAN`, ví không đổi |
| A8 | N8 `GET /don`, `GET /don/:ma` dòng nạp `loai:'nap'`, `ten` đúng chuỗi quầy, `ghi_chu` null, `so_mon` 1 — trước và sau khi trả bằng nhau; `hoa_don[]` khác rỗng; `kenh` `app`; `tra[]` = một dòng CK đúng số; `GET /don` (tóm tắt `so_mon`, `mon_dau`) trước = sau khi trả |
| B1–B2 quầy | T1 thẻ + `balance_amount` / `parent_balance_amount` / `payment_method:'balance'` (POST /orders thẳng) → 400 `THE_KHONG_TRA_VI`; T1b thẻ + đồ uống + ví, thẻ + gói trả trước + ví → `THE_KHONG_TRA_VI`, lời báo đúng câu phiếu; T1c bật `thanh_toan_payos_bat_buoc` → vẫn `THE_KHONG_TRA_VI` (không `VI_PHAI_QUA_PIN` — khoá thứ tự); T2 phiên `tru_tai_khoan` / `tru_tai_khoan_me` / `cach:'tai_khoan'` có thẻ → 400 `THE_KHONG_TRA_VI`, không phiên giữ |
| B2 App | T3 giỏ thẻ (và thẻ + đồ uống) `cach_tra` `vi` / `vi_qr` → 400 `THE_KHONG_TRA_VI` (nguyên mã), ví không đổi, không dòng pos_don_app |
| B3 | thu_NAP1.js B6–B9 xanh nguyên (không sửa) |
| B4 | T4 đơn thẻ cũ trả bằng số dư (chèn thẳng CSDL như dữ liệu trước việc) → huỷ quầy → ví hoàn, hạng thu hồi (luật cũ) |
| B5 | T5 `lyDoKhongTru({ khach có số dư, laThe: true })` → chuỗi; `laThe` bỏ → null (mặc định); BanHangMoi.jsx truyền `laThe` vào `chiaTra` / `ThuTien` (dò chuỗi + đột biến "luôn trả null") |
| C1 | G1 `GET /goi-nap` không token → gói bật đúng thứ tự, gói tắt không có, chỉ đúng 4 trường; G1b trần chung `/menu` (hết lượt → 429) |
| D1–D4 | V1 `/vi` không token → 401; V2 trang 20 dòng, `con_nua`, mới trước; V3 bảng `loai` mỗi `type` một ca (nạp gói, nạp tay, vaoVi, trả đơn, trừ tay, hoàn, đền, điều chỉnh ±); `debt_payment` không hiện; V4 `thuong` đúng dấu sau nạp gói + trả đơn; V4b `ngay` dạng `YYYY-MM-DDTHH:mm:ss` giờ VN, không hậu tố; V5 khách A không thấy dòng của B (403 / không có — chỉ SĐT token); V6 ví mẹ trả đơn con → `ma_don` null, không tên / SĐT con trong cả dòng; V7 `ghi_chu` không chứa ghi chú nhân viên gõ tay (nạp tay `notes: 'GHI-TAY-BI-MAT'` không lộ); V8 `ma_don` mở được `GET /don/:ma` của chính khách |
| E1 | Q1 `GET /api/pos/kh/don-app` (dsQuay, routes/kh/quay.js:26) đơn nạp: `co_nap` = tên dòng, `mon` rỗng, `tien_trinh` `xong`; bấm Đang làm → từ chối; DonApp.jsx có nhánh `co_nap` (dò + đột biến) |
| E2 | Q2 báo cáo doanh thu không tính đơn nạp App; Đối soát xếp vào nhóm nạp; không phiếu pha chế / tem ly (dsQuay mon rỗng); `hoa_don[]` đơn nạp App = tờ đơn nạp quầy cùng gói (in) |
| F1 | thu_HOPDONG_KH.js xanh với v17 (cửa mới + mã mới trong khối máy đọc) |
| G1 | `thu_KHNAP1.js` đỏ trên gốc (bang_chung_do.txt), nối `kiem_tra_truoc_khi_giao.js`, đột biến mục dưới đều BẮT |
| G2 | bảng Q-C mục 5 |
| K5 | K1 đồ uống trả số dư (ví / vi_qr) vẫn 200; K2 ví mẹ cho đồ uống ở quầy vẫn 200; K3 gói trả trước (package_buy) trả số dư vẫn 200; K4 thẻ + tiền mặt / CK quầy vẫn 200; K5 thẻ App trả QR vẫn 200 + hạng; K6 nạp ở quầy tiền mặt vẫn 200; K7 giỏ đồ uống cũ — `bamGio` không đổi (khoá gửi cũ gửi lại vẫn `trung: true`); các cửa `/api/kh` khác: bài cũ (KHMUA1, KHTOMTAT, HOPDONG_KH…) xanh nguyên |
| Hai người cùng bấm | N5b, N6d (hai báo song song), T6 hai `POST /don` nạp cùng khoá song song → một đơn |

Đường song song phải canh (K4): hai chỗ chặn (taoPhien lúc giữ · taoDon lúc trả thẳng + lúc chốt); mọi dạng trừ ví (`balance_amount`, `parent_balance_amount`,
`payment_method balance`, `tru_tai_khoan`, `tru_tai_khoan_me`, `cach tai_khoan`, App `vi` / `vi_qr`); ghép dòng báo giá (`monCt` bỏ cả thẻ lẫn nạp); hình
đơn chưa trả ↔ đã trả (`dongThan` ↔ `chiTietDon` ↔ `dsQuay`); nhánh tiền về: đúng hạn · muộn chốt được · muộn không chốt được · lặp · song song · hai cổng.

Đột biến (`viec/KH-NAP-1/dot_bien.py`, mỗi đột biến một dòng tên nguyên chuỗi): BV-the-quay (gỡ chặn thẻ ở taoDon) · BV-the-giu (gỡ ở taoPhien) ·
VS-the-chi-balance (chỉ kiểm `balance_amount`, quên ví mẹ) · VS-the-chi-payment (chỉ `payment_method`) · BV-nap-giu-ma (gỡ mã nạp khỏi GIU_MA) ·
VS-ghep-mon (monCt không bỏ dòng nạp) · BV-muon (gỡ khối chốt muộn) · VS-muon-moi-don (bỏ `chiTheNap` → đồ uống cũng chốt) · VS-muon-loi (cho cả phiên `loi`) ·
VS-muon-lech (lệch tiền vẫn chốt muộn) · VS-muon-p-cu (rơi về vaoVi(p) cũ sau chốt hỏng) · BV-muon-cong (gỡ `congKiaDaBao`) · VS-vi-loai (bỏ lọc LOAI_TINH_VAO_VI) · VS-vi-me (luôn trả `ma_don`) · VS-vi-ghi-chu (trả `notes`) ·
VS-vi-phone (lọc theo tham số `?phone`) · VS-goi-tat (bỏ `is_active`) · BV-ui-the (lyDoKhongTru bỏ nhánh `laThe`) · VS-ui-luon-null.

## 5. Q-C · Bài cũ phải sửa ca (G2) — ĐO THẬT
Bản sao nháp (ngoài kho), chèn chặn thẻ trả số dư ở `orders.js` + `giuCho.js` (4 dòng), chạy `npm test` + `node cong_cu/gia_lap/chay.js`:
| Bài | Ca đỏ | Sửa |
|---|---|---|
| `cong_cu/thu_P2223.js` | D5 (K5) "mua thẻ trả đủ bằng ví → 200" | đổi thành ca CHẶN: mong 400 `THE_KHONG_TRA_VI`; thêm ca cùng đơn trả tiền mặt → 200, 1 dòng mua thẻ |
| `cong_cu/thu_P24.js` | sập ở I1c (`membership_buy` + `payment_method:'balance'`) | đơn thẻ trả tiền mặt; ca I1c "huỷ đơn mua thẻ → dòng mua thẻ xoá, điểm 0" giữ, phần "ví hoàn đủ" thành "ví không đổi" (đơn không trừ ví) |
| `cong_cu/thu_HD1.js` | A19–A22 (đơn mua thẻ trả ví làm nền) | đơn nền mua thẻ trả tiền mặt; A22 "tài khoản 20.000 + tiền mặt" giữ ý (đơn đồ uống trả ví + tiền mặt — đơn SAU khi có hạng) |
| `cong_cu/thu_KHTHE1.js` | B9, B9b, B10, C1, C2, C3, D1, Q3 (ví), D3 (vi_qr), D6, E1, E2, E3, E5, G1b, H1, GIO3, K5a, K5b, S1 + Q3 màn quầy + D7 (sau A6) | helper `datVi` → QR + webhook (cùng đơn, cùng kiểm phía sau); D1 / D3 "trả ví / ví + QR" → ca CHẶN `THE_KHONG_TRA_VI`; D6 (song song) dùng QR; E3 (DON_CO_GOI) dùng đơn QR; H1 so điểm QR vs quầy CK; D7 → mong CÓ hạng (A6) + vẫn 409 `PHIEN_APP_KHONG_TAO_LAI` |
| `cong_cu/gia_lap/kich_ban.js` | KB22 sập (`payment_method:'balance'`) | đơn thẻ trả tiền mặt (`cash_amount`), số kịch bản không đổi (bánh cóc ≥ 32) |
Mọi ca sửa là luật đổi CÓ CHỦ Ý (chủ quán 14.11) → bài sửa ĐỎ trên gốc (KHÔNG ghi `## Bài thử cũ sửa`); từng ca ghi `trang_thai.md` + `SỐ CA`.
Sau khi làm A6 sẽ chạy lại cả bộ — bài về muộn khác (thu_KHMUA1, thu_CKNOIDUNG1 C4e, thu_SEPAY1, thu_TINGEE1) dùng đơn đồ uống / xác nhận tay → dự kiến
không đổi; đỏ vì lý do khác → DỪNG hỏi (G2).
`cong_cu/thu_BH2.js` G1 đỏ cả trên gốc trong kho nông (Phát hiện) — không thuộc việc này.

## 6. Luồng hợp lệ KHÔNG bị chặn (K5)
Nạp ở quầy tiền mặt / QR · đơn đồ uống trả ví / ví + QR / ví mẹ (quầy + App) · gói trả trước trả ví · thẻ + tiền mặt / CK / QR (quầy + App) · đơn chỉ thẻ trả QR
đúng hạn · đồ uống tiền về muộn (vẫn vao_vi) · giỏ đồ uống cũ gửi lại cùng khoá · các cửa `/api/kh` khác · màn Bán hàng mới giỏ đồ uống vẫn trừ tài khoản được.

## 7. Ngân sách
Máy chủ ~+95 dòng (viKhach 12 · orders 6 · giuCho 4 · donApp 30 · thanh-toan 14 · lichSuVi 45 mới · goi-nap 4 · kh/index 18 · loi 4) — dưới 230. Giao diện ~+8.
Bài mới ~450. Bài cũ: 5 file, chỉ các ca bảng Q-C. Không bảng / cột mới, không thư viện.

## 8. Thứ tự làm (sau khi duyệt + chat gộp main)
`git pull --ff-only` → đọc lại file chung trên code mới (VOUCHER-2) → bài thử ĐỎ (bang_chung_do.txt) → P1 → P2 → P3 → P4 → giao diện + build →
hợp đồng → bài cũ G2 → `npm test` + `--day-du` → đột biến → `/ra-soat` → `/soat-bao-mat` → cổng `cong.js chay` → báo cáo.
