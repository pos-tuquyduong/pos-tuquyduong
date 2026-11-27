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
- (ĐÃ ĐÓNG 27.11) Xin chat ghi 8 file vào Phạm vi — người gác [G1-PHIEU] chặn máy sửa phiếu, [G5-NGOAIPV] chặn sửa file ngoài Phạm vi. Chat ghi
  ở commit 80f4fe87; máy làm tiếp phần cần 8 file ở `/lam-viec TOPPING-1 tiep`.
- Kế hoạch: Q1–Q7 chat duyệt 27.11 (mục dưới). Agent phụ soát kế hoạch (4 câu) — đã nhận vào `ke_hoach.md` mục 10.

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
- Sau khi chat mở Phạm vi (tiep): `routes/damages.js` (Q7 báo theo ly, trần gồm topping, TOPPING_BAO_THEO_LY), `routes/hoaDon.js` (topping_cua,
  so_phan; % hạng theo dòng ly), `utils/dongHoaDon.js`, `client/src/utils/hoaDon.js`, `InvoicePreview.jsx`, `InvoicePrint.jsx`, `utils/inPhieu.js` (tem +
  phiếu pha chế gom topping, đọc cả đơn vừa tạo lẫn đơn in lại), `DonApp.jsx`, `Orders.jsx`; `thu_TOPPING1.js` gắn vào `kiem_tra_truoc_khi_giao.js`;
  bỏ cờ `--bo` (bài thử + dot_bien.py). `BAO_APPKH.md` (thư lời thường cho App KH).
- Vòng sửa 1 (sau `/ra-soat` KHÔNG ĐẠT): `utils/tienDaTra.js` trần đền đơn mã "giảm 1 món" trừ một lần trên cả ly + topping (T28g); `routes/products.js`
  chỉ kiểm danh sách topping khi thân gửi (T05d/T05e); topping không có ghi chú nhanh ở quầy (T48c); `KhungChonMon.jsx` không hiện topping chưa bán được.

### Chỗ vá → đột biến (`viec/TOPPING-1/dot_bien.py`, đủ mọi mục, không còn `--bo`)
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
| `routes/damages.js` trần ly gồm topping | VS-den-bo-topping |
| `routes/damages.js` chỉ báo theo ly | BV-bao-theo-ly |
| `utils/diemThat.js` điểm chia phần ly / topping | VS-diem-den-theo-co-ly |
| `routes/hoaDon.js` topping_cua | BV-hoa-don-topping-cua |
| `routes/hoaDon.js` % hạng theo dòng ly | VS-hoa-don-mat-phan-tram |
| `client/src/utils/hoaDon.js` dòng "+ topping" | BV-to-hoa-don-topping |
| `client/src/utils/inPhieu.js` tem gom topping | BV-tem-gom-topping |
| `client/src/utils/inPhieu.js` đọc dong_cha_id (in lại) | VS-tem-chi-don-moi |
| `client/src/utils/inPhieu.js` phiếu pha chế khác topping | VS-pha-che-gop-khac-topping |
| `utils/tienDaTra.js` mã giảm 1 món trừ một lần (vòng 1) | VS-den-ma-mot-mon-tru-hai-lan |
| `routes/products.js` chỉ kiểm khi gửi (vòng 1) | VS-sua-mon-kiem-danh-sach-cu |
| `routes/products.js` topping không ghi chú (vòng 1) | VS-topping-co-ghi-chu-o-quay |
Tên đột biến: VS-tin-gia-topping-cua-man · BV-dong-cha-id · VS-topping-ngoai-danh-sach-lot · VS-qua-3-phan-lot · VS-ban-rieng-khi-khong-gia ·
VS-bo-giam-hang-topping · VS-voucher-bo-topping · VS-voucher-nhom-bo-topping · VS-kho-dem-tung-dong · BV-kho-mo-topping · VS-huy-khong-tra-topping ·
BV-kiem-topping-cho-mon · BV-036-chep-ghi-chu · BV-bo-kiem-topping-app · VS-bao-gia-app-lech-dong · VS-bam-gio-bo-topping · BV-menu-app-topping ·
BV-man-khach-loc-topping · VS-so-mon-giao-dem-topping · VS-den-bo-topping · BV-bao-theo-ly · VS-diem-den-theo-co-ly · BV-hoa-don-topping-cua ·
VS-hoa-don-mat-phan-tram · BV-to-hoa-don-topping · BV-tem-gom-topping · VS-tem-chi-don-moi · VS-pha-che-gop-khac-topping ·
VS-den-ma-mot-mon-tru-hai-lan · VS-sua-mon-kiem-danh-sach-cu · VS-topping-co-ghi-chu-o-quay.

### 3 thao tác cho chủ quán thử tay (máy tính bảng + điện thoại)
1. Kho › Sản phẩm: mở một topping → tick "Đây là topping", nhập giá bán riêng → Lưu; mở một món trà → tick topping đó + thêm nút "Ít đá" → Lưu.
2. Bán hàng: chạm món trà → khung hiện topping + "Ít đá"; chạm topping 2 lần (thấy số 2), chọn 2 ly → "Thêm vào giỏ"; giỏ có dòng "+ topping ×2".
   Chạm món không cài gì → vào giỏ ngay. Tab "Topping" → chạm là vào giỏ.
3. Thu tiền → hoá đơn có dòng "+ <topping> x2" dưới món; tem mỗi ly có dòng topping; Lịch sử đơn mở đơn đó → dòng topping thụt dưới ly.

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

## Soát độc lập (/ra-soat)
### Vòng 1 (27.11, HEAD 1caaf314) — KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
1. server/utils/tienDaTra.js:25-27 + server/routes/damages.js:206-207 — lỗi TIỀN: đơn có mã "giảm 1 món" trừ khoản giảm vào TỪNG dòng; tách topping
   thành dòng rồi gộp lại vào ly → trừ hai lần (trà 45.000 + nếp 20.000, mã 50 % = 22.500 → trần 22.500 thay vì 42.500). Chỉ hụt trần. K4 + K3 (không ca).
2. server/routes/products.js:333-337 — chặn nhầm: thân không gửi `topping_cho_mon` vẫn kiểm danh sách cũ → món có topping đã ẩn bị 400 mọi lần sửa
   (đổi tên / nhóm / thứ tự / ẩn món); chép nhóm lan lỗi. K5.
3. viec/TOPPING-1/bang_chung_do.txt:31 — SỐ CA 86 trong khi HEAD 88; dòng cũ "76 đạt · 10 hỏng", "--bo 19/19" — A16 sẽ đỏ. K1/K7.
4. viec/TOPPING-1/trang_thai.md — nhiều câu cũ (chayBaiThat "chưa thêm", "--bo", "chưa có đột biến diemThat", "Bước 8–11 chưa chạy"); chưa ghi npm test /
   --day-du / cong.js / 3 thao tác thử tay. K1.
5. Ghi chú nhanh hiện ở topping — quầy không giấu như App (products.js:288, tinh.js:83) → tab Topping mở khung. Nhẹ. K4.
6. client/src/pages/BanHang/KhungChonMon.jsx:31 — không lọc topping chưa bán được (App lọc `sellable`). Nhẹ. K4.
NGHI NGỜ: không ca / đột biến cho orders.js:86 item_count, donApp.js tomTatDonThat / chiTietDon nhánh ĐÃ trả, dsQuay, manKhach "+ ", giaoHang "+ ",
  dongHoaDon.js (T45), InvoicePrint.jsx; T43 có thể xanh khi gỡ lọc `cha == null` ở orders.js:817; kế hoạch hứa T40, T41, T45, T39 (duyệt hoàn) chưa có;
  "ly từ gói + topping" CHƯA KIỂM; topping riêng gửi from_package bỏ qua giaBanRieng (cổng gói cũ chưa rà); sổ hàng hỏng chỉ ghi giá ly; số cứng 30 ở ToppingMon.jsx.
NGHIỆM THU: 13/17 — thiếu: D5 BAO_APPKH.md; kết quả đột biến ở HEAD; npm test / --day-du / cong.js chay; 3 thao tác thử tay.
CHƯA SOÁT ĐƯỢC: đột biến, npm test đầy đủ, cong.js (chỉ đọc); giao diện thật; Turso thật + dữ liệu production cho bước 036; bài tiền cũ khác; đối soát (T41 thiếu).
BÀI HỌC: KHOÁ — ca "đền ly có topping trên đơn mã giảm 1 món" + ca "sửa món có topping đã ẩn → 200"; người gác: đổi thu_<MÃ>.js sau commit bằng chứng
  → chạy lại SỐ CA (A16 bắt ở cổng; nên bắt sớm ở pre-commit). NGUYÊN TẮC K4: tách một khoản thành nhiều dòng con rồi gộp lại → rà mọi nhánh hàm chia
  tiền theo dòng, nhất là nhánh trừ khoản cố định mỗi dòng. NGUYÊN TẮC K5: phép kiểm toàn vẹn ở route sửa đa năng chỉ kiểm ĐÚNG trường thân gửi.
  ĐƠN GIẢN: luật "gom dòng con vào cha" viết ở 6 chỗ — có thể giữ một hàm ở client/src/utils rồi máy chủ import() như dongHoaDon.js.

Vòng sửa 1 (27.11): lỗi 1 → tienDaTra.js trừ giảm MỘT lần trên nhóm ly + topping (T28g, VS-den-ma-mot-mon-tru-hai-lan); lỗi 2 → products.js chỉ kiểm
khi thân gửi danh sách hoặc đổi thành topping (T05d/T05e, VS-sua-mon-kiem-danh-sach-cu); lỗi 3, 4 → sửa hồ sơ; lỗi 5 → menu quầy topping
ghi_chu_nhanh [] (T48c, VS-topping-co-ghi-chu-o-quay); lỗi 6 → KhungChonMon lọc `sellable` (giao diện — chưa ca, thử tay); thiếu D5 → BAO_APPKH.md.
Nghi ngờ chưa xử lý (ghi Phát hiện, không chặn): ca riêng cho item_count / nhánh đơn đã trả của App / dsQuay / InvoicePrint / dongHoaDon; T40, T41;
đột biến lọc `cha == null` của mã giảm 1 món (topping cần thuộc nhóm của mã và đắt hơn ly mới lộ — ghi CHƯA KIỂM); hàm gom chung (để sau, không đổi hành vi).

### Vòng 2 (27.11, HEAD 54014161) — KHÔNG ĐẠT
Ba lỗi vòng 1 đã sửa đúng (thu_TOPPING1 92/0; 3 đột biến mới BẮT, đối chứng 92/0; chay_thu 186/0; dist có thay đổi vòng sửa). Không thấy lỗi tiền mới.
LỖI TÌM ĐƯỢC:
1. cong_cu/thu_TOPPING1.js:491 — T30b tên "topping hết → con_hang: false" nhưng chỉ kiểm `true`; không ca nào kiểm nhánh false; đổi kh/index.js:57 thành
   `con_hang: true` vẫn xanh. K3.
2. 7 chỗ vá không có ca đỏ khi gỡ: donApp.js:408 so_mon đơn ĐÃ trả; donApp.js:444-451 chiTietDon đơn đã trả; dongHoaDon.js:49 hoá đơn App (T45);
   orders.js:817 lọc `cha == null` mã giảm 1 món (dựng được đột biến chắc chắn đỏ — không được ghi CHƯA KIỂM); orders.js:86 item_count;
   manKhach.js:131, donApp.js:493 (hiển thị). T37 / T40 / T41 / T45 kế hoạch hứa chưa có; T39 đi qua /cancel không qua refunds.js. K3/K4.
NGHI NGỜ: topping riêng gửi `from_package` 0đ khi gói không có danh sách món (lỗ cũ, gói đang tạm ngưng); chú thích đầu tienDaTra lệch; KhungChonMon sửa dòng có
  topping vừa thành không bán được; bước 036 trên Turso bảng lớn chưa đo.
NGHIỆM THU: 16/17 — thiếu "topping hết con_hang: false".
ĐƠN GIẢN: luật gom dòng con vào ly ở 7 chỗ → một hàm / vị từ chung; kh/index.js:48 `p.la_topping ? []` thừa; T41 đối soát chưa có ca.
CHƯA SOÁT ĐƯỢC: cong.js chay; npm test đầy đủ (dựa máy chính); 28 đột biến còn lại (chạy 3); giao diện thật; Turso; production; refunds.js duyệt hoàn có topping.
BÀI HỌC: KHOÁ — người gác: tên ca chứa "→ false" / "→ 400" mà biểu thức chỉ `=== true` / 200 thì báo; tối thiểu mỗi giá trị phiếu ghi rõ có ca so BẰNG +
  đột biến hằng số. NGUYÊN TẮC K3 — nghi ngờ vòng trước về chỗ vá chưa có ca, dựng được đột biến chắc chắn đỏ thì phải dựng, không hạ thành CHƯA KIỂM.
  NGUYÊN TẮC K4 — tách cha / con thì MỘT vị từ "con của" dùng chung.

Vòng sửa 2 (27.11): lỗi 1 → T30d (bán phần Long nhãn cuối → con_hang false) + BV-con-hang-topping; lỗi 2 → T43b (topping thuộc nhóm của mã, đắt hơn ly)
+ VS-mot-mon-chon-topping; T35b + VS-so-mon-app-da-tra; T35c + BV-chi-tiet-da-tra-gom; T45 + VS-hoa-don-app-sl; T47b + VS-item-count; T39 đổi tên cho đúng
(/cancel). Chú thích tienDaTra.js sửa; kh/index.js bỏ vế thừa. Không làm (ghi lý do): manKhach dungHien / donApp dsQuay — chỉ hiển thị, cần ghép màn
khách / đơn App đã trả qua payOS, CHƯA KIỂM; T37 ly từ gói + topping — quầy tạm ngưng gói (GOI_TAM_DUNG) nên không có luồng, CHƯA KIỂM; T40 đổi cách trả
(không đụng dòng đơn) và T41 đối soát (doiSoat.js:143,385 lọc product_id < 0, dòng topping > 0) — không có code topping để canh, CHƯA KIỂM bằng ca;
refunds.js duyệt hoàn đi soTienHoan theo tổng đơn — CHƯA KIỂM bằng ca; hàm gom chung 7 chỗ — đề xuất việc sau (không đổi hành vi).
