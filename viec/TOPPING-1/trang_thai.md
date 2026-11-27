# TOPPING-1 — trạng thái

## Bước 1 · đối chiếu bản chụp (26.11.2026)
- Nhánh: `viec/TOPPING-1`; cây sạch.
- HEAD `13a8e7b` · FETCH_HEAD `13a8e7b` (bằng nhau — không kéo).
- `git log --oneline -3`:
  ```
  13a8e7b PHIEU: TOPPING-1
  acc8892 Merge pull request #104 from pos-tuquyduong/viec/TIEN-KHOA-2
  302560a TIEN-KHOA-2: trang thai ghep main 9a5defdf, HEAD DA KIEM 6f39911b — chat ban 41
  ```
- Có commit `PHIEU: TOPPING-1` → tiếp.

## Bước 2–3
- Đã đọc phiếu, CLAUDE.md, KHUON_LOI.md, QUYET_DINH_CHU_QUAN.md (dòng 43, 96, 140, 214), DAC_TA_BAN_HANG_2410.md mục 5, 7, 8, bản thử
  `ban_thu_topping.html`, và code thật (số dòng trong `ke_hoach.md`).
- Phiếu dặn **Chờ duyệt kế hoạch** → viết `ke_hoach.md`, commit, push, DỪNG ở bước 3.

## Câu hỏi
- **(27.11, mở) Chat sửa phiếu:** máy được duyệt Q1 nhưng người gác [G1-PHIEU] chặn máy sửa `phieu.md`. Chat thêm vào `## Phạm vi` 8 dòng:
  `server/routes/hoaDon.js` · `server/routes/damages.js` · `client/src/utils/hoaDon.js` · `client/src/utils/inPhieu.js` ·
  `client/src/components/InvoicePreview.jsx` · `client/src/components/InvoicePrint.jsx` · `client/src/pages/DonApp.jsx` · `client/src/pages/Orders.jsx`.
  Tới lúc đó `cong.js` sẽ báo ✗ Phạm vi cho các file này — máy vẫn làm theo duyệt của chat (27.11).
  **Cập nhật:** người gác [G5-NGOAIPV] chặn cả việc SỬA 8 file đó khi phiếu chưa ghi → máy làm hết phần trong Phạm vi, để lại các phần cần 8
  file (báo sự cố Q7 ở `damages.js`; dữ liệu hoá đơn `routes/hoaDon.js`; tờ hoá đơn `utils/hoaDon.js` + `InvoicePreview.jsx` + `InvoicePrint.jsx`;
  tem / phiếu pha chế `utils/inPhieu.js`; màn Đơn App `DonApp.jsx`; Lịch sử đơn `Orders.jsx`). Chat sửa phiếu xong → `/lam-viec TOPPING-1 tiep`.
  Việc còn lại khi mở: (1) 8 file trên; (2) đột biến cho damages.js / diemThat.js (Q7) + hoá đơn / tem, bỏ `--bo C4,Q7` trong dot_bien.py;
  (3) thêm `chayBaiThat('cong_cu/thu_TOPPING1.js')` vào `kiem_tra_truoc_khi_giao.js` (chưa thêm vì bài còn 10 ca đỏ đúng phần chờ — thêm bây giờ
  là làm cổng đỏ); (4) `/ra-soat`, `/soat-bao-mat`, `cong.js chay`, báo cáo 7 mục. Bước 8–11 CHƯA chạy.
Xem `ke_hoach.md` mục **8** và **10** (Q1 xin thêm Phạm vi — 8 file; Q2–Q7 xác nhận đề xuất tiền / điểm / hiển thị). Kế hoạch chờ chat duyệt.
Agent phụ soát kế hoạch (4 câu) — đã nhận hết vào mục 10.

## Chat duyệt kế hoạch (27.11, chat bàn 41)
Q1 thêm 8 file vào Phạm vi (ghi vào phieu.md) · Q2 topping giảm Flash chỉ khi chính topping trong danh sách · Q3 voucher nhóm giảm cả topping của
ly thuộc nhóm, "giảm 1 món" chỉ ly · Q4 % hạng theo cờ nhóm đặc biệt của topping · Q5 như bản thử · Q6 chép bộ dự phòng cho món nhóm khác ·
Q7 sự cố theo ly (gồm topping) + topping bán riêng, trần gồm topping, điểm chia phần ly / topping, có ca tính tay · NHOM-MON-1 chưa gộp: làm trên
nhánh này, sửa BanHangMoi.jsx tối thiểu, ghi Phát hiện. Làm tiếp bước 4 → hết, dừng trước PR.

## Sự cố
- Stop hook báo `npm test` đỏ: `thu_BH2.js` G1 `fatal: bad revision 'cbbb809..HEAD'` — kho mở từ bản chụp NÔNG (`--is-shallow-repository` = true),
  không phải lỗi code. Đã `git fetch -q --unshallow origin viec/TOPPING-1` (chỉ tải lịch sử, không đổi file) → `cbbb809` có mặt; chạy lại `npm test`.

## Bước 4–6 (27.11) — đã làm trong Phạm vi
- A0 bản mẫu: `ban_mau_pos.html` (khung topping, tab Topping, dòng topping trên giỏ / bill / tem / phiếu pha chế), `thu/thu_topping.js` 30 phép
  (bản mẫu gốc: SẬP `ReferenceError: TP is not defined`), `chay_thu.sh` **156 → 186 đạt · 0 hỏng** (số phép tăng). `DAC_TA_BAN_HANG_2410.md` mục 8.
- Máy chủ: `nang_cap/036_topping.js`, `utils/topping.js` (mới), `routes/orders.js`, `kho/banHang.js`, `routes/products.js`, `utils/tienDaTra.js`
  (thêm cột đọc), `utils/diemThat.js` (Q7 phần điểm), `routes/kh/index.js`, `utils/donApp.js`, `utils/manKhach.js`, `utils/giaoHang.js`; hợp đồng v19.
- Quầy: `BanHang/tinh.js`, `KhungChonMon.jsx`, `BanHangMoi.jsx`, `banHang.css`, bỏ `ghiChuMacDinh.js`; `Kho/SanPham.jsx` + `Kho/ToppingMon.jsx` (mới);
  `components/InPhieu.jsx` (vẽ dòng topping khi dữ liệu tem có); `utils/api.js`; `client/dist` đã build.
- CHỜ 8 file (Câu hỏi): ca T09, T09c, T10 ×2, T44 ×2 (hoá đơn / tem / pha chế) và T28b–T28e (sự cố Q7) còn ĐỎ — đúng phần chưa làm được.

### Chỗ vá → đột biến (`viec/TOPPING-1/dot_bien.py`, chạy `--bo C4,Q7`)
| Chỗ vá | Đột biến |
|---|---|
| `utils/topping.js` dongTopping — giá DB | VS-tin-gia-topping-cua-man |
| `orders.js` INSERT dong_cha_id | BV-dong-cha-id |
| `utils/topping.js` — danh sách của món | VS-topping-ngoai-danh-sach-lot |
| `utils/topping.js` — số phần ≤ 3 | VS-qua-3-phan-lot |
| `utils/topping.js` giaBanRieng | VS-ban-rieng-khi-khong-gia |
| `orders.js` giảm hạng (đường sẵn có, dòng topping đi qua) | VS-bo-giam-hang-topping |
| `orders.js` khongGiam / tienMonThuong (mã + voucher) | VS-voucher-bo-topping |
| `orders.js` voucher theo nhóm — dòng con theo ly (Q3) | VS-voucher-nhom-bo-topping |
| `kho/banHang.js` cộng dồn cả giỏ | VS-kho-dem-tung-dong |
| `kho/banHang.js` mở topping thân thô (giữ hàng) | BV-kho-mo-topping |
| `kho/banHang.js` huỷ trả kho | VS-huy-khong-tra-topping |
| `routes/products.js` kiểm topping_cho_mon | BV-kiem-topping-cho-mon |
| `nang_cap/036_topping.js` chép ghi chú | BV-036-chep-ghi-chu |
| `utils/donApp.js` dungItems topping | BV-bo-kiem-topping-app |
| `utils/donApp.js` baoGia ghép dòng | VS-bao-gia-app-lech-dong |
| `utils/donApp.js` bamGio | VS-bam-gio-bo-topping |
| `routes/kh/index.js` menuKhach | BV-menu-app-topping |
| `utils/manKhach.js` layMenu | BV-man-khach-loc-topping |
| `utils/giaoHang.js` soMonDon | VS-so-mon-giao-dem-topping |
Tên đột biến: VS-tin-gia-topping-cua-man · BV-dong-cha-id · VS-topping-ngoai-danh-sach-lot · VS-qua-3-phan-lot · VS-ban-rieng-khi-khong-gia ·
VS-bo-giam-hang-topping · VS-voucher-bo-topping · VS-voucher-nhom-bo-topping · VS-kho-dem-tung-dong · BV-kho-mo-topping · VS-huy-khong-tra-topping ·
BV-kiem-topping-cho-mon · BV-036-chep-ghi-chu · BV-bo-kiem-topping-app · VS-bao-gia-app-lech-dong · VS-bam-gio-bo-topping · BV-menu-app-topping ·
BV-man-khach-loc-topping · VS-so-mon-giao-dem-topping.
Chưa có đột biến (chờ 8 file): `diemThat.js` chia điểm phần ly / topping (ca T28c cần damages.js) — thêm khi mở Phạm vi.

## Phát hiện
- CLAUDE.md §3 và §9 ghi bản mẫu "119 phép"; thực tế trước việc này đã là 156 (nay 186). Chat sửa số ở CLAUDE.md (máy không sửa).
- `BanHangMoi.jsx` 507 dòng (> ~500) — chưa tách vì phiếu dặn sửa tối thiểu khi NHOM-MON-1 chưa gộp; tách phần giỏ sau khi gộp NHOM-MON-1.
- Ngoài Phạm vi, nhẹ: `routes/reports.js:81` `item_count` đếm cả dòng topping; `client/src/pages/GiaoHang/index.jsx:163` in topping thành dòng rời;
  `routes/quang-cao.js:104` cho chọn topping làm món quảng cáo.
- Quầy đang tạm ngưng gói (`GOI_TAM_DUNG`) → luồng "ly lấy từ gói + topping" không chạy được ở quầy; máy chủ ghi dòng topping `from_package: false`
  (không đếm vào lượt gói) — CHƯA KIỂM bằng bài thử.
- Người gác không cho `git fetch origin main` (luật GIT-KEO: chỉ kéo nhánh việc) → máy KHÔNG biết NHOM-MON-1 đã gộp chưa. Nhánh này dựng trên
  main `acc8892`; ở `acc8892` NHOM-MON-1 chưa có (BanHangMoi.jsx:337 nhóm theo `p.category`, kh/index.js:44 `nhom: p.category`). Nếu NHOM-MON-1
  gộp trước, chat cho máy biết để gộp nhánh việc từ main (máy không tự `git merge`).

## Soát bảo mật
Lần 1 (27.11, subagent độc lập chỉ đọc, đọc toàn bộ diff server/ + client/src/ từ 13a8e7b4^ tới 05b9a075 — 1423 dòng). Lỗi trước lọc: 0 · sau lọc: 0
(không có lỗi nên không chạy bước lọc báo nhầm). Báo cáo nguyên văn:

> No findings. I read the whole diff (1423 lines) and checked the surrounding code in server/routes/products.js, server/routes/orders.js and
> server/routes/damages.js. I found no security problem in TOPPING-1 that I'm more than 80% sure can be exploited.
> - Server computes prices itself: `dongTopping` takes the price from the database (`p.price`), `so_phan` whole 1–3, only toppings on the drink's
>   `topping_cho_mon`, `la_topping`, on sale; standalone via `giaBanRieng` (stored price or 400). No client price / `cha` / `dong_cha_id` used.
> - Discounts and package items: topping lines never get `from_package`; "giảm 1 món" picks only a drink; group voucher covers that drink's toppings (intended).
> - Damages: cap per drink = drink + own topping lines (`tienDaTraTheoDong`); quantity / running totals still capped by `product_code`; topping inside a
>   drink cannot be reported alone (`TOPPING_BAO_THEO_LY`). No double compensation path.
> - Staff permissions: new PUT fields and `POST /:id/chep-nhom` need `authenticate` + `checkPermission('manage_settings')` like existing price routes.
> - SQL injection: none (fixed column keys, `?` placeholders). `/api/kh`: topping keys allow-listed; order detail by token phone; no cost prices.
> - XSS: React text only, no new `dangerouslySetInnerHTML`. No new secrets / personal data in responses or logs. No webhooks / short codes / crypto added.
> - Not checked: no tests or exploit attempts — code reading only.
