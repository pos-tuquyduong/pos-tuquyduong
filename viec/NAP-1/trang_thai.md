# NAP-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (05.11.2026)
- `git branch --show-current` → `viec/NAP-1`; `git status --short` → sạch.
- Hai SHA: HEAD `0406870` · FETCH_HEAD `0406870` (bằng nhau — không kéo).
- `git log --oneline -3`:
  ```
  0406870 PHIEU: NAP-1
  2c81b0f TIEN-DO: MANKHACH-1 (ae27536), TU-CHAY-10 (4891879), KHO-IN-1 (d1b57b8) xong; dot quyet dinh 01-02.11 + thiet_ke dot 2 + hop dong v7 (da hen) + lich theo lan; mo GIO-VN-1, HANG-1, NAP-1 — so v53
  d1b57b8 Merge pull request #64 from pos-tuquyduong/viec/KHO-IN-1
  ```

## Bước dở (05.11)
Bước 3 xong (kế hoạch `ke_hoach.md`). Phiếu dặn **chờ duyệt kế hoạch** → DỪNG. Chưa viết bài thử, chưa sửa code.

## Thử dò (không commit)
Để câu hỏi Phạm vi có danh sách đúng, máy sửa TẠM `server/utils/diemThat.js` theo luật E (tính cả phần ví), chạy `npm test`, rồi trả
file về nguyên bản (`git status --short` sạch sau đó). Kết quả: PASS 85 · FAIL 7 — đỏ đúng các bài khoá luật điểm cũ:
`thu_P20.js`, `thu_P2223.js`, `thu_P24.js`, `thu_DIEMTHAT1.js`, `thu_P3.js`, `thu_KHMUA1.js`, `thu_DOISOAT1.js` (bài cuối đỏ qua bất biến I8
của `cong_cu/gia_lap/bat_bien.js`, chép luật điểm cũ).

## Câu hỏi đã trả lời (chủ quán 05.11 — phiếu `e4dd0bf`: 1 CÓ · 2 (a) · 3 chia theo tỷ lệ)
1. **Phạm vi thiếu file cho mục E (điểm khi tiêu ví) và đối soát hai ngăn.** Luật điểm nằm ở `server/utils/diemThat.js` (một hàm cho POST /orders,
   pay-debt, nhận điểm mã bill); trọng tài đối soát chép riêng luật này ở `cong_cu/gia_lap/bat_bien.js` (I8). Cả hai ngoài Phạm vi. Bất biến
   "thưởng ví = tổng phần thưởng của sổ, 0 ≤ thưởng ≤ số dư" (mục C) cũng phải nằm ở `bat_bien.js` (Đối soát chỉ chạy một bản bất biến).
   Bảy bài thử cũ đỏ vì đổi luật E đã được chủ quán duyệt (LUAT_XAY_APP §6.8 — bài sửa thường, không phải "Bài thử cũ sửa").
   **Đề xuất:** thêm vào `## Phạm vi`:
   `server/utils/diemThat.js` · `cong_cu/gia_lap/bat_bien.js` · `cong_cu/thu_P20.js` · `cong_cu/thu_P2223.js` · `cong_cu/thu_P24.js` ·
   `cong_cu/thu_DIEMTHAT1.js` · `cong_cu/thu_P3.js` · `cong_cu/thu_KHMUA1.js` · `cong_cu/thu_DOISOAT1.js`.
2. **Nhóm "Nạp tiền" ở màn Bán hàng nào?** Có hai màn: màn mới (`BanHang/BanHangMoi.jsx`, thu tiền qua phiên + QR) và màn cũ (`Sales.jsx`,
   mặc định của máy chưa bật). Bản vẽ đã chốt `ban_mau_pos/` chưa có nhóm Nạp tiền (CLAUDE.md §9: đổi thiết kế phải sửa bản mẫu trước, có
   chủ quán duyệt). **Đề xuất:** chỉ làm ở MÀN MỚI (một nút nhóm "Nạp tiền" cạnh các nhóm món, giỏ chỉ chứa một gói, ẩn dòng trừ tài
   khoản và ô mã) — coi mục M4 của `THIET_KE_DOT2.md` là bản vẽ đã duyệt, không sửa `ban_mau_pos/`. Màn cũ không bán gói nạp (nạp tay
   `/topup` ở màn Số dư vẫn chạy như cũ). Bạn chọn: (a) như đề xuất · (b) cả hai màn · (c) sửa bản mẫu `ban_mau_pos/` trước.
3. **Hoàn MỘT PHẦN một đơn đã trả bằng ví (đền bù sự cố):** phiếu nói "trả về đúng ngăn đã trừ" — với hoàn trọn thì mọi cách đều ra đúng.
   Với hoàn một phần, máy đề xuất **chia theo tỷ lệ phần ví của đơn** (đơn trả ví 50.000 trong đó thưởng 10.000, đền 20.000 → 4.000 về
   thưởng, 16.000 về tiền nạp; tổng thưởng trả về của một đơn không bao giờ vượt phần thưởng đã trừ). Xác nhận hoặc chọn "trả thưởng trước".

## Phát hiện
- HANG-1 chưa gộp (sổ việc `[ ]`, phiếu dặn NAP-1 làm SAU HANG-1). Kế hoạch viết trên `0406870`; HANG-1 đổi `orders.js` (mua thẻ) và dùng
  bước nâng cấp 013 → khi duyệt, nhánh `viec/NAP-1` cần đi từ `main` đã có HANG-1 (máy không tự `merge`). Số dòng trích trong kế hoạch sẽ trôi.
- Két (`server/utils/doiSoat.js` `tienTheoSo`) cộng cả tiền mặt của ĐƠN lẫn dòng sổ ví `topup` theo cách trả — đơn nạp ghi cả hai sẽ bị đếm
  đôi nếu không chặn (kế hoạch mục 5 xử lý: két chỉ đếm dòng `topup` không gắn đơn).

## Phiên 06.11 — `tiep` (chủ quán DUYỆT kế hoạch d5ddc8f + 3 câu trả lời)
Bước 1: `git branch --show-current` → `viec/NAP-1`; `git status --short` → sạch. Hai SHA: HEAD `ae19926` · FETCH_HEAD `ae19926` (bằng nhau — không kéo;
hook mở phiên đã kéo `0406870 → ae19926`). `git log --oneline -3`:
```
ae19926 GOP-NAP-1 dua main f464cea vao nhanh truoc khi lam (chat 05.11)
e4dd0bf PHIEU: NAP-1 chu quan tra loi cau hoi 05.11 (them file vao Pham vi)
f464cea Merge pull request #74 from pos-tuquyduong/viec/HANG-1
```
Kế hoạch đọc lại trên code mới: `ke_hoach.md` mục 13 (lệch: bất biến thưởng gộp vào I4 thay I20; vị từ đơn nạp theo dòng hàng; hợp đồng không sửa
vì ngoài Phạm vi). Không lệch nào đổi đường tiền / ví so với kế hoạch đã duyệt → làm luôn.

### Bảng chỗ vá → đột biến (`viec/NAP-1/dot_bien.py`, nay 73 đột biến · BẮT 73 · có đối chứng — 68 ban đầu + 5 của vòng sửa 1–2: BV-hoan-tra-not ·
VS-hoan-tra-not-tinh-ca-hoan-goi · BV-products-nap · VS-tra-not-nguong-noi-1 · BV-yeu-cau-hoan-nap)
| Chỗ vá | Đột biến |
|---|---|
| `server/nang_cap/014_nap.js` bảng + cột thưởng | BV-014-cot-vi |
| `server/routes/backup.js` pos_goi_nap trong BACKUP_TABLES | BV-sao-luu-goi-nap |
| `server/routes/goi-nap.js` kiểm gói, quyền, quầy chỉ thấy gói bật, sửa cũng kiểm | BV-goi-khach-tra-duong · VS-goi-so-chuoi · BV-goi-vao-tk-it-hon · VS-goi-nguong-bang · BV-goi-quyen-them · BV-goi-quyen-sua · BV-quay-thay-goi-tat · VS-sua-khong-kiem |
| `orders.js` tra gói đang bật, giá máy chủ, cộng ví đúng hai ngăn trong giao dịch | BV-ban-goi-tat · VS-nap-gia-may-khach · VS-nap-vao-bang-tra · VS-nap-thuong-tien-nap · VS-nap-ghi-ngoai-giao-dich |
| `orders.js` cổng nạp: SĐT chuẩn hoá, không gộp, không ví / ví mẹ / mã / nợ / phí giao | VS-nap-sdt-tho · BV-nap-chan-gop · VS-nap-chan-gop-chi-mon · BV-nap-chan-vi · VS-nap-chan-vi-me · BV-nap-chan-ma · BV-nap-chan-no · BV-nap-chan-phi-giao · K5-chan-moi-don-khong-sdt |
| `orders.js` dòng nạp không giảm hạng, tinh-thu nhận goi_nap_id | BV-nap-giam-hang · BV-nap-tinh-thu |
| `giuCho.js` phiên: nhận goi_nap_id, chặn trừ tài khoản | BV-nap-phien-truong · BV-nap-chan-vi-phien · VS-nap-chan-phien-chi-khach |
| `viKhach.js` thuongKhiTru (tỷ lệ, trừ hết = hết thưởng) | VS-tru-thuong-truoc · VS-tru-lam-tron-xuong · BV-tru-het-so-du |
| `viKhach.js` thuongKhiHoan (tỷ lệ phần đã trừ, trần, theo từng ví) | BV-hoan-tran · VS-hoan-tra-het-thuong · VS-hoan-moi-vi |
| `wallets.js` ghiVi chia ngăn trừ / hoàn, cột thưởng; đối soát ví sửa ngăn | BV-ghi-vi-chia-tru · BV-ghi-vi-chia-hoan · VS-hoan-chi-refund · BV-ghi-vi-cot-thuong · BV-reconcile-thuong · K5-nap-tay-co-thuong |
| `orders.js` đơn nạp không huỷ / xoá | BV-nap-khong-huy · BV-nap-khong-xoa |
| `orders.js` đơn nạp 0 điểm, không mã bill | BV-nap-diem · BV-nap-ma-bill |
| `diemThat.js` luật E (ví + ví mẹ có điểm, trần tổng) | BV-diem-vi · VS-diem-vi-me · VS-diem-bo-tran |
| `bat_bien.js` I8 (đơn nạp 0, luật mới), I4 (ngăn thưởng), I15 (dải nạp) | BV-I8-nap · VS-I8-luat-cu · BV-I4-thuong · VS-I4-thuong-vuot · BV-I15-dai-nap |
| `doiSoat.js` két không đếm đôi, sổ sách | VS-ket-dem-doi · VS-so-sach-trong-do-nap · VS-thuong-da-dung-khong-hoan · BV-doanh-thu-that · VS-giu-ho-khong-tach |
| `reports.js` + `orders.js` danh sách: doanh thu bỏ đơn nạp; quyền sổ sách | BV-doanh-thu-daily · BV-doanh-thu-sales-ky · BV-doanh-thu-sales-tong · BV-doanh-thu-staff · BV-doanh-thu-ds-don · BV-so-sach-quyen |
| `client/src/pages/BanHang/tinh.js` thân nạp, cần khách, đơn riêng, không giá hạng | BV-man-than-nap · BV-man-nap-can-khach · BV-man-nap-don-rieng · BV-man-nap-gia-hang |

### Đổi so với kế hoạch khi làm (ghi để soát)
- `thuongKhiTru` bỏ hai cái kẹp: với số nguyên, tỷ lệ làm tròn luôn nằm trong [thưởng − (số dư − khoản trừ), thưởng] (chứng minh ở chú thích hàm) — code chết.
- Ngăn thưởng của ví đọc bằng câu riêng trong giao dịch (`SELECT thuong …`) — giữ nguyên câu `SELECT balance FROM pos_wallets` mà phép E12 khoá.
- Đơn nạp 0 điểm đặt bằng `if (goiNap) diemTao = null;` sau khối chuẩn bị điểm — giữ nguyên dòng neo đột biến M15 của `thu_gia_lap.js`.
- I8 chỉ soi dòng hàng nạp khi kho có bảng `pos_order_items` (kho dữ liệu tay của `thu_gia_lap.js` không có bảng → không thể có đơn nạp).
- Khoá hỏi giá của giỏ (`khoaTinh`) không thêm trường: mã gói đã nằm trong `product_id` của dòng giỏ.

### Hợp đồng `/api/kh` — đoạn soạn sẵn cho chat dán lúc gộp (`HOP_DONG_API_KH.md` ngoài Phạm vi, máy KHÔNG sửa)
NAP-1 không đổi cửa / trường / mã lỗi nào của `/api/kh`. Hành vi App thấy khác (đề xuất ghi nhật ký, tăng `PHIEN_BAN` 11 nếu chat thấy cần):
- v11 · 06.11.2026 · NAP-1: không đổi cửa, không đổi trường. Đơn trả bằng ví (`cach_tra` `vi` / `vi_qr`) nay CÓ điểm như tiền mặt (chủ quán 01.11 —
  bỏ luật "phần trừ ví không sinh điểm"); `/nhan-diem` đơn trả trọn bằng ví không còn `DON_KHONG_DU_DIEM`. Đơn NẠP TIỀN bán ở quầy hiện trong
  `GET /don` của khách như đơn quầy (một dòng "Nạp … → vào tài khoản …"), không có mã nhận điểm, 0 điểm. `so_du_vi` = số dư (tiền nạp + thưởng nạp) như cũ.

## Phát hiện
- `server/utils/donThu.js` (dọn dữ liệu thử, ngoài Phạm vi) tính két theo dòng sổ `topup` cả khi gắn đơn (dòng 79) — với đơn nạp ở quầy, tiền mặt
  đếm hai lần trong phép "két từ ngày X không được đổi" → giữ lại NHIỀU hơn cần (an toàn, không mất dữ liệu). Sửa khi chạm tới: `AND order_id IS NULL`.
- `HOP_DONG_API_KH.md`: xem đoạn v11 soạn sẵn ở trên.
- Báo cáo `/reports/daily` `balance_stats.total_topup` cộng cả "vào tài khoản" của đơn nạp (gồm thưởng) — đúng nghĩa "nạp vào ví", không phải tiền
  thu; tiền thu đúng nằm ở thẻ Sổ sách. Không sửa (không thuộc nghiệm thu).

## Soát độc lập vòng 1 (/ra-soat, 06.11, mốc f464cea → bf8ddd1) — chép nguyên báo cáo
```
KHÔNG ĐẠT

LỖI TÌM ĐƯỢC:
1. cong_cu/thu_NAP1.js (dòng 63–66, mount route: thiếu packages) — nghiệm thu C ("mọi lối cộng lại trả về ĐÚNG ngăn") không có ca nào cho
   kết thúc gói có hoàn (packages.js:267 → ghiHoan → wallets.js:111 loại 'refund', cách 'hoan_goi'). Kế hoạch §2 và §9 liệt kê lối này. Bài thử
   không gắn route packages, dot_bien.py không có đột biến cho nó. Đọc code: tienDaTra.js:86-89 hoàn phần ví trước, tiền mặt sau, nên tỷ lệ thưởng
   hiện đúng. Nhưng phần thưởng của dòng 'hoan_goi' chỉ bằng 0 nhờ thứ tự đó + trần `con` ở viKhach.js:40; không phép nào khoá điều này. — K3 / K4.
2. server/utils/viKhach.js:40 — làm tròn từng lần hoàn một phần, cộng dồn không về đúng phần thưởng đã trừ. Ví dụ: đơn trả ví 21.000 (thưởng
   1.000), đền 3 lần × 7.000 → mỗi lần round(333,3) = 333 → trả 999. Mất 1 đồng thưởng, đồng đó thành tiền nạp. Ca C7 (thu_NAP1.js:350) chọn
   42.000 / 2.000 / 10.500 / 21.000 — chia hết, che đúng lỗi này (K3). Cách vá: khi tổng đã hoàn trên ví đó = viTru thì trả trọn `con`; thêm ca số lẻ. — K3.
3. server/utils/viKhach.js:46 (sqlDonNap), dùng ở orders.js:122, reports.js:43/134/148/270, doiSoat.js:139/142 — EXISTS lồng theo từng đơn vào
   pos_order_items, mà bảng này không có chỉ mục order_id. Đo trên libsql thật: 30.000 đơn / 90.000 dòng, không lọc ngày: 53 s; 5.000 đơn: 1,4 s;
   lọc một ngày: 28 ms. Cách gọn hơn: `${bi}.id IN (SELECT order_id FROM pos_order_items WHERE product_id <= ID_NAP_TU)` (không lồng). — K4, tối ưu.
4. server/routes/reports.js:167-200 GET /reports/products — không loại dòng nạp, "Nạp 100.000đ →…" hiện như sản phẩm bán chạy. Phiếu F: "Nạp không
   phải doanh thu". Ca F2 không soi route này. Nhẹ: client không gọi route này. — K4.
5. viec/NAP-1/trang_thai.md — chưa ghi kết quả `node tu_chay/cong.js chay` (LUAT §6.3), chưa ghi 1–3 thao tác thử tay (LUAT §6.4) cho thẻ Cài
   đặt Gói nạp, nhóm "Nạp tiền" và thẻ Sổ sách. Phần JSX (BanHangMoi.jsx) không bài máy nào phủ. — K6.
6. server/utils/viKhach.js:7-8 (chú thích "Một vị từ … cho huỷ, xoá, báo cáo, két, bất biến") và ke_hoach.md §13.4 — sai: két dùng `order_id IS NULL`
   trên dòng topup, bat_bien.js tự chép NAP_TU. — K1.
7. cong_cu/thu_P20.js (ca "trả trọn bằng ví … /nhan-diem → 200") — chỉ kiểm status 200, không kiểm số điểm nhận. — K3 (nhẹ).

NGHI NGỜ:
- /nhan-diem áp luật mới cho đơn CŨ trả ví còn trong hạn nhận điểm (LUAT §6.6). Chưa ghi Phát hiện.
- Bán nhầm gói nạp: đơn nạp không huỷ / xoá được, chủ quán chỉ trừ ví bằng /adjust, nhưng tiền mặt đơn vẫn trong két → két lệch ngày đó. Nên hỏi chủ quán.
- Thưởng nạp trừ qua /deduct, /adjust âm (không gắn đơn) không vào "Thưởng nạp đã dùng" nhưng rời ô "giữ hộ" — sổ sách không khép; chưa có quy tắc
  đối soát ba ô (LUAT §5).
- soSach `napTay` cộng mọi payment_method, két chỉ đếm cash / transfer — cùng vị từ nên dùng cùng biểu thức (K4).
- DoiSoat.jsx:163 "Ví: nạp" nay gồm cả thưởng; trường `thuong_nap` mới (doiSoat.js:126) không màn nào đọc: code chết.
- Tắt / sửa giá gói khi đang có phiên QR chưa chốt → tiền về nhưng chotPhien chuyển phiên 'loi' (cùng khuôn đổi giá món, có từ trước).

NGHIỆM THU: 42/45 ý có bằng chứng · thiếu: C (kết thúc gói có hoàn), B (nhóm "Nạp tiền" trên màn — JSX chưa có thao tác thử tay), F (/reports/products)

CHƯA SOÁT ĐƯỢC: không chạy dot_bien.py và tu_chay/cong.js; không chạy giao diện thật; không đo trên Turso thật; không đọc HOP_DONG_API_KH.md.

BÀI HỌC:
- KHOÁ: ca kết thúc gói có hoàn (đơn mua gói trả ví có thưởng + tiền mặt) + đột biến; ca đền ba lần số lẻ (21.000 / 7.000).
- KHOÁ: phép tĩnh cấm EXISTS lồng vào pos_order_items theo o.id khi không có chỉ mục (hoặc thêm chỉ mục order_id).
- NGUYÊN TẮC (K4): "vị từ nhận loại đơn mới" phải grep MỌI route đọc pos_order_items hoặc tính doanh thu (gồm /reports/products).
- NGUYÊN TẮC (K3): ca chia theo tỷ lệ phải có ít nhất một bộ số KHÔNG chia hết — đã có trong K3, vẫn bị bỏ qua → nên thành phép máy.
```

## Vòng sửa 1 (sau soát vòng 1)
| Lỗi soát | Sửa | Ca / đột biến |
|---|---|---|
| 1 kết thúc gói có hoàn chưa có ca | bài gắn route packages | C13 · VS-hoan-tra-not-tinh-ca-hoan-goi |
| 2 làm tròn cộng dồn rơi đồng thưởng | `viKhach.js` thuongKhiHoan: lần cộng làm đủ phần ví đã trừ → trả NỐT phần thưởng còn lại | C0b (số lẻ), C7c · BV-hoan-tra-not |
| 3 EXISTS lồng (vòng 2: BÁO OAN — kho thật có chỉ mục idx_ds_order_items_order; đo IN 6 ms · EXISTS 17 ms) | `sqlDonNap` và I8 dùng `id IN (SELECT order_id … )` — giữ vì gọn và nhanh hơn | (hiệu năng — người soát vòng 2 đo, máy không có phép canh) |
| 4 /reports/products có dòng nạp | `reports.js` `AND oi.product_id > ID_NAP_TU` | F7 · BV-products-nap |
| 5 cổng chạy + thao tác thử tay | ghi ở báo cáo cuối | — |
| 6 chú thích sai | `viKhach.js` đầu file, `ke_hoach.md` §13.4 | — |
| 7 P20 không đếm điểm | ca kiểm tổng điểm đơn > 0 | (đỏ trên gốc) |
Thêm (từ NGHI NGỜ): sổ sách `napTay` cùng vị từ két (chỉ cash / transfer); bỏ trường `tongHop.vi.thuong_nap` không màn nào đọc.

## Phát hiện (thêm sau soát vòng 1 — không sửa, ghi cho chủ quán / việc sau)
- **Đơn CŨ trả ví còn trong hạn nhận điểm** (LUAT §6.6): sau khi gộp, `/nhan-diem` của đơn trả ví tạo TRƯỚC giờ gộp sẽ cộng điểm theo luật mới (hạn
  nhận ngắn — cài đặt `nhandiem_han_gio`, mặc định 24 giờ). Đối soát (I8) đã tha đơn trước mốc `DIEM_VI_TU` theo luật cũ; số điểm mới vẫn đúng luật mới
  → I8 không đỏ. Ảnh hưởng chỉ trong một ngày sau gộp, chiều có lợi cho khách. Không sửa.
- **Bán nhầm gói nạp:** đơn nạp không huỷ / xoá được (phiếu D). Sửa sai = chủ quán điều chỉnh âm số dư (ghi lý do) + trả lại tiền mặt; tiền mặt đơn vẫn
  nằm trong két ngày đó → két ghi chênh đúng số trả lại. Đề xuất việc sau (chủ quán quyết): dòng "trả lại tiền nạp nhầm" có quyền chủ quán + PIN, ghi
  ra két, trong ngày bán.
- **Thưởng nạp trừ qua /deduct, /adjust âm** (không gắn đơn) không vào ô "Thưởng nạp đã dùng" nhưng rời ô "giữ hộ" — đúng nghĩa (không phải bán hàng),
  nhưng ba ô sổ sách chưa có phép khép (đầu kỳ + nạp − đã dùng − điều chỉnh = cuối kỳ). Đề xuất thêm phép khép ở Đối soát (việc sau).
- **Tắt / sửa giá gói nạp khi đang có phiên QR chưa chốt:** tiền về mà phiên chuyển 'loi' (cùng khuôn đổi giá món, có từ trước — giuCho.js chotPhien).
  Quầy thấy ở màn Đối soát (tiền về chưa khớp). Không sửa.
- Màn Đối soát dòng "Ví: nạp" nay gồm cả phần thưởng của gói nạp (là số vào ví, không phải tiền thu) — tiền thu đúng ở thẻ Sổ sách.

## Soát độc lập vòng 2 (/ra-soat, 06.11, mốc f464cea → 8df9626) — chép nguyên báo cáo
```
KHÔNG ĐẠT (chỉ lỗi NHẸ)

LỖI TÌM ĐƯỢC:
1. server/utils/viKhach.js:39 — chú thích "EXISTS lồng ... quét cả pos_order_items (không chỉ mục order_id)" sai. server/database.js:962-963 tạo
   idx_ds_order_items_order ON pos_order_items(order_id). Đo bằng libsql, 30.000 đơn / 90.000 dòng: EXISTS KHÔNG chỉ mục 53.330 ms (số vòng 1 báo —
   vòng 1 đo trên kho thiếu chỉ mục); EXISTS CÓ chỉ mục 17 ms; IN 6 ms. Lỗi 3 vòng 1 là báo oan với kho thật. Bản vá IN vẫn đúng và nhanh hơn, giữ
   được, nhưng chú thích trong code và dòng "3 EXISTS lồng không chỉ mục" trong trang_thai.md (bảng Vòng sửa 1) ghi sai sự thật; "xem dưới" không trỏ
   tới đâu. — K1 — NHẸ.
2. cong_cu/thu_NAP1.js C0b + C7c — ngưỡng "trả nốt" `vi_hoan + soTien >= viTru` (viKhach.js:34) chỉ có ca bằng đúng ngưỡng, không có ca ngay dưới.
   Đột biến nới `>= viTru - 1` trên bộ ca C0b và C7c: SỐNG. Cần ca ngay dưới ngưỡng số lẻ (vd [63000, 2032, 1354, 41999, 21000]) + đột biến. — K3 — NHẸ.
3. cong_cu/thu_P20.js:299-300 — bản vá lỗi 7 kiểm `SUM(points) > 0`, nhưng đơn có SĐT đã có 25 điểm lúc tạo: /nhan-diem 200 mà cộng 0 điểm vẫn xanh.
   Đã khoá ở thu_DIEMTHAT1.js:245 (D3), nên chỉ là P20 yếu. — K3 — NHẸ.
4. server/routes/refunds.js:115-118 và server/routes/damages.js:176-178 — đơn nạp bị chặn hoàn / đền nhờ hai cổng KHÁC chứ không theo laDonNap
   (yêu cầu hoàn: "đơn không trả bằng số dư"; đền: GOI_THE_KHONG_DEN). Mã lỗi khác NAP_KHONG_HOAN cho cùng tình huống (LUAT §2); cổng hoàn dựa vào
   cổng "nạp không trả ví" (hai vị từ, K4). Ca D3/D4 chỉ so status 400. — K4 — NHẸ (hôm nay không lối nào hoàn được tiền nạp).

NGHI NGỜ:
- doiSoat.js:142-145 sổ sách: tong_ban lọc theo trạng thái hiện tại của đơn tạo trong kỳ, thuong_nap_da_dung lọc theo ngày dòng sổ → huỷ sang kỳ sau
  thì doanh_thu_that lệch giữa hai kỳ (cộng hai kỳ thì đúng). Chưa có ca F huỷ khác ngày.
- LUAT §5: chưa có bất biến "mỗi đơn nạp có đúng một dòng topup gắn đơn, amount − thuong = total" → đề xuất việc sau.
- doiSoat.js:314: dòng I8 của đơn nạp (nếu lỡ có điểm) bị gắn nhãn D2 — nhãn sai.
- Đổi cách trả đơn nạp: dòng sổ topup giữ cách cũ (két / sổ sách đúng; chỉ lịch sử ví hiện cách cũ).
- product_name gói nạp có emoji "💳" — chưa rõ máy in nhiệt in được không.
- Thao tác thử tay và kết quả cổng chạy chưa ghi (sẽ ghi ở báo cáo cuối).
- DIEM_VI_TU = '2026-11-08' ghi tạm — chat sửa đúng ngày gộp + 1.

NGHIỆM THU: 37/38 ý có bằng chứng · thiếu: B "nhóm Nạp tiền trên màn Bán hàng" — JSX (BanHangMoi.jsx) chưa bài máy nào phủ, cần thao tác thử tay.

CHƯA SOÁT ĐƯỢC: chưa chạy đủ 71 đột biến (chỉ 5: BẮT 5/5); chưa chạy tu_chay/cong.js; chưa chạy giao diện / in thật; chưa đo trên Turso; chưa đọc
HOP_DONG_API_KH.md; chưa chạy ban_mau_pos/chay_thu.sh.

BÀI HỌC:
- NGUYÊN TẮC (K1): lỗi hiệu năng người soát báo phải kiểm lại trên lược đồ THẬT (database.js tạo chỉ mục lúc khởi động) trước khi vá và trước khi
  chép lý do vào chú thích.
- KHOÁ (K3): mỗi ngưỡng mới phải có ca ngay trên + ngay dưới và đột biến "nới 1".
- KHOÁ (K4): cổng "loại đơn không hoàn" gắn theo ĐỐI TƯỢNG (laDonNap) ở mọi route hoàn / đền, cùng một code lỗi; ca chặn so cả code.
```

## Vòng sửa 2 (sau soát vòng 2 — chỉ lỗi nhẹ)
| Lỗi soát | Sửa | Ca / đột biến |
|---|---|---|
| 1 chú thích hiệu năng sai | `viKhach.js` chú thích ghi số đo thật; bảng Vòng sửa 1 dòng 3 sửa | — |
| 2 ngưỡng "trả nốt" thiếu ca ngay dưới | C0b thêm [63000, 2032, 1354, 41999, 21000] → 677 | VS-tra-not-nguong-noi-1 |
| 3 P20 không khoá điểm bù | ca so điểm sau /nhan-diem > điểm lúc bán (> 0) | (đỏ trên gốc) |
| 4 cổng hoàn không theo đối tượng | `refunds.js` POST yêu cầu hoàn: `laDonNap` → 400 NAP_KHONG_HOAN; D3 so cả code | BV-yeu-cau-hoan-nap |
Phát hiện: `server/routes/damages.js` (ngoài Phạm vi) chặn đền đơn nạp bằng GOI_THE_KHONG_DEN (`product_id < 0`) — chặn đúng, mã khác; khi chạm tới thì
đổi sang `laDonNap` + NAP_KHONG_HOAN. Các NGHI NGỜ vòng 2 (sổ sách huỷ khác kỳ, bất biến "đơn nạp ↔ một dòng topup", nhãn D2, emoji in nhiệt) ghi
làm đề xuất việc sau — không thuộc nghiệm thu, không đổi tiền.

## Soát độc lập vòng 3 (/ra-soat, 06.11, mốc f464cea → 275c22f) — chép nguyên báo cáo
```
KHÔNG ĐẠT (chỉ còn lỗi NHẸ: 1 chỗ code ở trường hợp biên khó xảy ra, 3 chỗ hồ sơ / chú thích ghi cũ. Không lỗi nào làm sai số dư, điểm, tiền vào két
hay lộ thông tin.)

Bốn lỗi vòng 2 đã sửa đúng (cài lại từng lỗi cũ thì bài thử đều bắt): VS-tra-not-nguong-noi-1 BẮT ở C0b; P20 với /nhan-diem cộng 0 điểm bù → ĐỎ
171 · 1; BV-yeu-cau-hoan-nap BẮT ở D3; chỉ mục có thật (database.js:962-963), viKhach.js:39 nay ghi đúng.
Đã chạy: thu_NAP1 69 · 0; dot_bien.py 73 · BẮT 73 (đối chứng XANH 69 · 0); --day-du PASS 103 · FAIL 0 · CẢNH BÁO 2 (file ngoài việc này); dist khớp src;
git status sạch, origin/viec/NAP-1..HEAD rỗng, mọi file đổi trong Phạm vi.

LỖI TÌM ĐƯỢC:
1. server/utils/viKhach.js:34 — nhánh "trả nốt" `return con` không chặn trần bằng `soTien`. Phần thưởng của một lần cộng lại có thể lớn hơn chính số
   tiền cộng: ví nhận thêm soTien nhưng ngăn thưởng nhận con > soTien, nên tiền nạp bị trừ đi; tiền nạp đang 0 thì thành âm, I4 báo "thưởng > số dư".
   Ví dụ: [đã trừ 7, thưởng đã trừ 3, đã trả 0, đã cộng lại 6, lần này 1] → trả 3 cho khoản cộng 1 đồng (6 lần cộng một phần, mỗi lần làm tròn xuống 0).
   Đi tới được qua đền bù (tiền đền tuỳ ý > 0) nhưng cần nhiều lần đền nhỏ rồi một lần rất nhỏ — gần như không xảy ra. Số dư tổng vẫn đúng, chỉ lệch
   1–2 đồng giữa hai ngăn. Cách vá: `return Math.min(con, soTien)`, thêm ca [7,3,0,6,1] → 1, đột biến bỏ cái min. — K3 — NHẸ (nếu chủ quán coi mọi
   lệch ngăn ví là NẶNG thì nâng lên NẶNG).
2. viec/NAP-1/ke_hoach.md §12 mục 8 và §13 mục 8 ("refunds.js không sửa") — trái code (vòng sửa 2 thêm cổng ở refunds.js:118); viKhach.js:7 thiếu
   "yêu cầu hoàn" trong danh sách chỗ dùng laDonNap. — K1/K4 — NHẸ.
3. viec/NAP-1/trang_thai.md:56 — tiêu đề bảng còn "68 đột biến · BẮT 68", thực tế 73; bảng thiếu 5 đột biến vòng sửa. — K4 — NHẸ.
4. server/utils/viKhach.js:6 (chú thích "hoan_goi → tiền nạp") — ghiVi vẫn tính thuongKhiHoan cho dòng hoan_goi, ra 0 chỉ nhờ thứ tự hoàn phần ví trước
   (C13 + VS-hoan-tra-not-tinh-ca-hoan-goi đã khoá) — chú thích nói như luật của hàm. — K1 — NHẸ.

NGHI NGỜ:
- goi-nap.js:19-23 — không có trần tỷ lệ thưởng. Ai có quyền manage_products (mặc định cả manager — database.js:1082) tạo được gói "trả 1.000 → vào
  10.000.000" rồi bán cho một SĐT. Đúng phiếu A nhưng là lối tạo tiền trong ví. Đề xuất chủ quán quyết: trần % thưởng, hoặc chỉ owner tạo / sửa gói.
- orders.js:892-903 — phép kiểm tổng cho lệch ±1đ (có từ trước): đơn nạp trả 99.999 vẫn cộng đủ 105.000.
- Duyệt hoàn (refunds.js:167) không tự kiểm laDonNap — an toàn vì yêu cầu hoàn đơn nạp không tạo được.
- Đền bù đơn nạp chặn bằng GOI_THE_KHONG_DEN (damages.js:178, ngoài Phạm vi) — đã ghi Phát hiện.
- Nghi ngờ vòng 2 còn (sổ sách huỷ khác kỳ; bất biến "đơn nạp ↔ một dòng topup"; DIEM_VI_TU tạm '2026-11-08').

NGHIỆM THU: 37/38 ý có bằng chứng máy · thiếu: B "nhóm Nạp tiền trên màn Bán hàng" (BanHangMoi.jsx — chờ thao tác thử tay).

CHƯA SOÁT ĐƯỢC: tu_chay/cong.js chay; giao diện / in thật (emoji 💳 trên máy in nhiệt); Turso thật; HOP_DONG_API_KH.md; ban_mau_pos/chay_thu.sh;
chotPhien chưa đọc kỹ (dựa vào B2 / B10 / B12).

BÀI HỌC:
- KHOÁ (K3): mọi hàm chia ngăn trả phần thưởng của một khoản phải có ca "phần thưởng ≤ khoản đó" ở MỌI nhánh, kể cả nhánh "trả nốt", và đột biến bỏ trần.
- NGUYÊN TẮC (K4): vòng sửa thêm / đổi một chỗ vá thì grep ke_hoach.md và trang_thai.md tìm "file X không sửa", số đột biến cũ, danh sách chỗ dùng.
```
Máy đã sửa ngay lỗi hồ sơ 2, 3, 4 (chỉ chú thích / hồ sơ). Lỗi 1 CHƯA sửa — xem `## Câu hỏi` dưới.

## Câu hỏi (06.11, sau 3 vòng soát — dừng theo LUAT_XAY_APP §6.5: còn lỗi ở đường VÍ)
1. **Lỗi 1 vòng 3 (ngăn thưởng, trường hợp biên):** khi một đơn trả ví được đền bù nhiều lần nhỏ, lần đền cuối có thể đưa vào ngăn thưởng nhiều hơn
   chính số tiền đền (lệch 1–2 đồng giữa tiền nạp và thưởng; tổng số dư khách vẫn đúng). Máy đã có cách sửa một dòng (`server/utils/viKhach.js`: phần
   thưởng của lần "trả nốt" không vượt số tiền cộng — `Math.min(con, soTien)`) + một ca thử + một đột biến. **Đề xuất:** bạn cho máy làm vòng sửa 4
   đúng lỗi này (chat soát thay), không đổi gì khác. Bạn chỉ cần trả lời "làm vòng 4".
2. **Ai được tạo / sửa gói nạp** (soát vòng 3 nghi ngờ, đụng tiền): hiện theo phiếu là quyền "quản lý sản phẩm" — mặc định cả **quản lý (manager)**
   cũng có. Một gói "trả ít → vào tài khoản nhiều" là cách tạo tiền trong ví. **Đề xuất:** để nguyên như phiếu (bạn tự tắt quyền này của manager ở
   Cài đặt → Phân quyền nếu muốn), không thêm trần % — vì bạn đã chốt quyền ở phiếu. Nếu bạn muốn chặn cứng (chỉ chủ quán, hoặc trần % thưởng) thì
   ghi vào phiếu, máy làm trong vòng 4.

Bước dở: bước 8 xong 3 vòng (KHÔNG ĐẠT vòng 3, chờ câu 1). Chưa làm: soát bảo mật (8b), báo cáo 7 mục (10), rút kinh nghiệm (11), cổng `chay`.

## Phiên 06.11 (2) — `tiep` sau câu trả lời của chủ quán (phiếu `ec4cc94`)
Bước 1: `git branch --show-current` → `viec/NAP-1`; `git status --short` → sạch. Hai SHA: HEAD `ec4cc94` · FETCH_HEAD `ec4cc94` (bằng nhau — không kéo;
hook mở phiên đã kéo `0406870 → ec4cc94`). `git log --oneline -3`:
```
ec4cc94 PHIEU: NAP-1 chu quan tra loi cau hoi 05.11 (them file vao Pham vi)
14243de NAP-1 soat vong 3 (KHONG DAT, loi nhe o duong vi) + sua chu thich / ho so + Cau hoi cho chu quan
275c22f NAP-1 bang chung vong sua 2
```
Câu trả lời (phiếu, khối "Chủ quán 06.11"): 1 — đồng ý vòng sửa 4 đúng lỗi 1 soát vòng 3; 2 — tạo / sửa / bật / tắt gói nạp CHỈ chủ quán + PIN chủ quán
(gọi `server/utils/pinChuQuan.js`, không sửa), máy chủ chặn; quản lý / nhân viên vẫn bán gói; không trần %.

## Vòng sửa 4 (chủ quán 06.11 — chat soát thay)
| Việc | Sửa | Ca / đột biến |
|---|---|---|
| Câu 1: lần "trả nốt" ghi ngăn thưởng > khoản cộng | `server/utils/viKhach.js` thuongKhiHoan: `return Math.min(con, soTien)` | C0c ([7,3,0,6,1] → 1 · [7,3,0,5,2] → 2 · [100,99,0,99,1] → 1 + mọi ca C0b: thưởng ≤ khoản) · BV-tra-not-tran |
| Câu 2: chỉ chủ quán | `server/routes/goi-nap.js` POST / PUT: `chiChuQuan` (403 CHI_CHU_QUAN — cùng code settings.js / don-thu.js) thay `checkPermission('manage_products')` | A5 (nhân viên + QUẢN LÝ có manage_products, gửi đúng PIN → 403, gói giữ nguyên) · BV-goi-quyen-them · BV-goi-quyen-sua · VS-goi-quyen-quan-ly |
| Câu 2: PIN chủ quán | `goi-nap.js` `quaPin` gọi `kiemPinChuQuan` SAU kiểm dữ liệu (gõ sai số tiền không tốn lượt PIN), lỗi trả nguyên `{ error, code }` của pinChuQuan.js | A8 (thiếu / sai / PIN 3 số: thêm, tắt, sửa → 400 PIN_CHU_QUAN_SAI, không ghi) · BV-goi-pin-them · BV-goi-pin-sua · VS-goi-pin-chi-khi-gui |
| Câu 2 K5: quản lý / nhân viên vẫn bán | GET `/goi-nap` giữ `authenticate` (không đổi); bán qua `orders.js` không đổi | A9 (nhân viên + quản lý thấy gói, bán gói tiền mặt → 200) · K5-quay-chi-chu-quan |
| Câu 2 K4: đường song song — khôi phục file sao lưu ghi đè gói không qua PIN | `server/routes/backup.js` thêm `pos_goi_nap` vào BANG_KHONG_KHOI_PHUC (khuôn `pos_membership_tiers` của HANG-1); vẫn trong BACKUP_TABLES (xuất được) | M4 · BV-khoi-phuc-goi-nap |
| Giao diện | `client/src/pages/CaiDat/GoiNap.jsx`: ô PIN chủ quán, nút Thêm / Sửa / Bật / Tắt chỉ hiện với chủ quán; `client/dist` build lại | (máy chủ chặn — bài A5 / A8; giao diện thử tay) |
Đột biến nay **80** (73 + 7 mới: BV-tra-not-tran · VS-goi-quyen-quan-ly · BV-goi-pin-them · BV-goi-pin-sua · VS-goi-pin-chi-khi-gui · K5-quay-chi-chu-quan ·
BV-khoi-phuc-goi-nap); neo đổi theo code: BV-goi-quyen-them · BV-goi-quyen-sua · VS-sua-khong-kiem · BV-hoan-tra-not · VS-tra-not-nguong-noi-1.
Kết quả: ĐỐI CHỨNG XANH 73 · 0 — BẮT 80 · SỐNG 0 · HỎNG 0 · LẠC 0. `npm test -- --day-du`: PASS 103 · FAIL 0 · CẢNH BÁO 2.
K4 đã rà: `grep -rn pos_goi_nap server` → chỉ goi-nap.js (ghi), orders.js:542 (đọc gói bật để bán), backup.js (xuất / nay chặn khôi phục), 014_nap.js (tạo bảng).
`grep -n "return con" server/utils/viKhach.js` → không còn nhánh nào trả `con` trần (nhánh tỷ lệ đã `Math.min(con, round(…))`, và round(soTien × thưởng / ví) ≤ soTien vì thưởng ≤ ví).

## Soát độc lập LẠI sau vòng sửa 4 (/ra-soat, 06.11, vòng 4: 14243de → d920ef0; nhánh 0406870^ → d920ef0) — chép nguyên báo cáo
```
ĐẠT (chỉ còn lỗi NHẸ: một chú thích sai, một bài thử chỉ soi chữ, một chỗ chưa có bài thử. Không có lỗi làm sai tiền, điểm, ví hay bảo mật.)

Kết quả ngắn: phần sửa của vòng 4 đúng. Lần hoàn cuối không còn ghi phần thưởng lớn hơn chính khoản hoàn. Chỉ chủ quán mới thêm / sửa / bật / tắt gói nạp, và phải gõ PIN — máy chủ chặn chứ không chỉ giấu nút. Nhân viên và quản lý vẫn bán gói. Khôi phục bằng file sao lưu không còn ghi đè được gói nạp. Mình đã tự chạy lại: `node cong_cu/thu_NAP1.js` → 73 đạt · 0 hỏng. Bảy đột biến mới → đối chứng xanh 73 · BẮT 7/7 · SỐNG 0. `--day-du` → PASS 103 · FAIL 0 · CẢNH BÁO 2, dist khớp src.

LỖI TÌM ĐƯỢC:
- server/utils/viKhach.js:34 — chú thích nói "làm tròn từng lần không làm rơi đồng nào sang tiền nạp". Từ khi thêm trần `Math.min(con, soTien)` ở dòng 36, câu này sai. Chính ca C0c `[7,3,0,6,1] → 1` (cong_cu/thu_NAP1.js, khối C0c) cho thấy thưởng đã trừ là 3 mà chỉ trả lại 1, còn 2 đồng thưởng chuyển sang ngăn tiền nạp. Dòng 35 ngay dưới cũng tự mô tả chuyện này. Tổng ví không đổi và bất biến bat_bien.js:78 vẫn giữ, chỉ có lời chú thích sai. Cần sửa câu dòng 34 (ví dụ: "trả nốt nhưng không quá khoản cộng; vài đồng làm tròn có thể sang tiền nạp"). — K1 — NHẸ (chú thích; đồng tiền chỉ lệch ở chuỗi hoàn rất nhỏ).
- cong_cu/thu_NAP1.js, ca M4 — chỉ dò chữ `'pos_goi_nap'` trong đoạn mã nguồn từ `const BANG_KHONG_KHOI_PHUC` đến `];`, không thử hành vi. Nếu ai đó để `'pos_goi_nap'` trong một chú thích nằm trong danh sách, hoặc gỡ lệnh `chanTrangTien` ở backup.js:342 (/restore), M4 vẫn xanh. Nên có một ca gửi file xlsx có trang "Gói nạp tiền" lên /backup/preview-restore và /restore, đòi 400 KHOI_PHUC_TRANG_TIEN_BI_CHAN và bảng gói giữ nguyên. — K3 — NHẸ.
- cong_cu/thu_NAP1.js, ca A9 — luồng hợp lệ "nhân viên / quản lý bán gói" chỉ được thử qua POST /orders. Luồng phiên thanh toán (/thanh-toan/phien ở dòng 233 và 277) chỉ chạy bằng thẻ chủ quán. Đọc code thì không có chặn: thanh-toan.js:25 `/phien` chỉ có `authenticate`; giuCho.js không kiểm role (grep checkPermission/role → 0). Nhưng chưa có ca và đột biến nào khoá điều này. — K5 — NHẸ.

NGHI NGỜ:
- server/utils/viKhach.js:37 tính thưởng của từng lần hoàn riêng rẽ (`round(soTien*thuongTru/viTru)`), không cộng dồn. Vì vậy sai số làm tròn tích lại, và lần hoàn cuối, nay bị trần ở dòng 36, không bù được nữa. Số tiền thực tế ở quầy (hàng nghìn đồng) thì lệch không đáng kể, nhưng thiết kế "trả về ĐÚNG ngăn" (phiếu mục C) không còn chính xác tuyệt đối. Cách gọn hơn ở mục ĐƠN GIẢN.
- client/src/pages/CaiDat/GoiNap.jsx: bấm Tắt / Lưu khi ô PIN còn trống vẫn gửi `pin: ''`. Máy chủ (goi-nap.js:21-26 → pinChuQuan.js:61-64) tính đó là một lần sai PIN. Bấm như vậy 5 lần là khoá PIN chủ quán 15 phút, khoá luôn cả màn Hạng. Màn HangThe.jsx:163-166 làm y hệt nên đây là khuôn có sẵn, không phải lỗi mới. Đột biến VS-goi-pin-chi-khi-gui lại ép máy chủ phải kiểm cả PIN rỗng, nên chỗ nên gọn là giao diện: tắt nút khi ô PIN trống.
- GoiNap.jsx không xoá PIN khỏi state sau khi lưu xong. HangThe.jsx:53 thì xoá `setPinSua('')` sau khi xoá hạng. Hai màn không nhất quán, việc nhỏ.

NGHIỆM THU: 9/9 mục có bằng chứng · mục thiếu: không
- A — có: A1–A4, A6, A6b, A7 trong thu_NAP1.js; quyền theo câu 2 xem dòng chủ quán 06.11 câu 2.
- B — có: B1–B15. Có phiên ck_tay ở dòng 233–238; chặn trả gói bằng ví / ví mẹ ở dòng 265–267 và giuCho.js:40.
- C — có: C0–C13, K9 (bất biến I4…I19). Bất biến ngăn thưởng ở bat_bien.js:67-79.
- D — có: D1–D5 (dòng 482–487).
- E — có: E1–E6 (dòng 494–511).
- F — có: F1–F7, K8 (dòng 531–567).
- K5 — có: K2, K6, A9, cùng các bài cũ xanh trong `--day-du` (PASS 103). Thiếu một ca: phiên thanh toán do nhân viên / quản lý bán gói (đã ghi ở LỖI).
- Chủ quán 06.11 câu 1 — có: C0c + BV-tra-not-tran (BẮT); viKhach.js:36.
- Chủ quán 06.11 câu 2 — có: chỉ chủ quán (A5 + VS-goi-quyen-quan-ly / BV-goi-quyen-them / BV-goi-quyen-sua; goi-nap.js:18-19, 55, 71); PIN chủ quán (A8 + BV-goi-pin-them / BV-goi-pin-sua / VS-goi-pin-chi-khi-gui; goi-nap.js:21-26, 61, 79; `git diff 14243de HEAD -- server/utils/pinChuQuan.js` rỗng); nhân viên / quản lý vẫn bán (A9 + K5-quay-chi-chu-quan); không trần % (kiemGoi goi-nap.js:29-35); khôi phục file sao lưu (M4 + BV-khoi-phuc-goi-nap; backup.js:140).

(Tám mục soát 1–8, CHƯA SOÁT ĐƯỢC, BÀI HỌC — nguyên văn:)
1. K3: C0c, A5, A8, A9 đỏ trên bản chưa vá (bang_chung_do.txt, khối vòng 4: 36 đạt · 36 hỏng). M4 đỏ trên bản chưa vá backup.js (72 · 1). C0c kiểm hành vi: thưởng ≤ khoản cộng ở mọi ca C0b, thêm các ca ngay trên / ngay dưới ngưỡng con = soTien `[7,3,0,4,3]`, con > soTien `[7,3,0,6,1]` và con < soTien `[7,3,0,0,7]`. A5 / A8 kiểm cả việc dòng gói KHÔNG đổi, không chỉ mã lỗi. M4 chỉ soi chữ (đã ghi ở LỖI). Bảy đột biến mới mình tự chạy lại: BẮT 7/7, mỗi cái bị đúng ca của nó bắt.
2. K4: `grep -rn "pos_goi_nap\|goi_nap" server` → chỉ goi-nap.js ghi (dòng 63, 81). orders.js:542 chỉ đọc. backup.js:61 xuất, :140 chặn khôi phục. 014_nap.js tạo bảng. Các chỗ ghi theo tên bảng động (khoiPhuc.js:69-72 đã chặn qua backup.js:342; kho/duong.js; donThu.js:298; chuanHoaGio.js) đều không đụng pos_goi_nap. Có 10 chỗ gọi ghiVi; chỉ refund / compensation đi qua thuongKhiHoan (wallets.js:87). Cả hai nhánh (dòng 36, 37) nay đều ≤ soTien. Nhánh 37 đúng vì thưởng đã trừ ≤ ví đã trừ (thuongKhiTru viKhach.js:18-22). Chỗ duy nhất truyền `thuong` thẳng vào ghiVi là orders.js:1022 (đơn nạp: vao_tk − khach_tra ≤ vao_tk). Không còn chỗ nào chưa xử lý.
3. K5: chủ quán sửa gói → A6, A6b, A1. Quầy xem gói → GET / chỉ có authenticate (goi-nap.js:37), ca A6, A9. Nhân viên / quản lý bán qua orders.js → A9. Bán qua phiên thanh toán → không chặn theo thanh-toan.js:25, nhưng chưa có ca (ghi ở LỖI). Sao lưu xuất file → pos_goi_nap vẫn nằm trong BACKUP_TABLES (backup.js:61), ca M3. Khôi phục các bảng khác → chanTrangTien chặn cả file nếu có trang gói có dòng (backup.js:150-157): đây là khuôn đã có (ví / đơn cũng làm vậy), trang trống thì bỏ qua (khoiPhuc.js:47). Không thấy luồng nào bị chặn oan. Một lưu ý: chủ quán chưa đặt PIN thì không tạo được gói (400 CHUA_CO_PIN_CHU_QUAN, pinChuQuan.js:58). Đó là đúng câu 2.
4. K1: chú thích viKhach.js:34 sai (đã ghi ở LỖI). Các khẳng định trong trang_thai.md vòng 4 mình đã kiểm và đều đúng.
5. Đường tiền: máy chủ tự tra gói (orders.js:542, có `is_active = 1`) và tự tính thưởng (orders.js:1022). Không thấy chỗ nào tin trường tiền client gửi.
6. P1: `--day-du` báo "dist đã commit KHỚP với src hiện tại".
8. Đơn giản: viKhach.js:34-37 có thể gộp hai nhánh thành một công thức cộng dồn `x = round((vi_hoan + soTien) × thuongTru / viTru) − thuong_tra`, kẹp `[0, min(con, soTien)]`; goi-nap.js:18-19 `chiChuQuan` chép lại middleware của don-thu.js:11-12; quy tắc đối soát đã có (bat_bien.js:67-79; F1–F5).
CHƯA SOÁT ĐƯỢC: màn GoiNap.jsx trên điện thoại thật; khôi phục bằng file xlsx thật có trang "Gói nạp tiền"; production đã đặt PIN chưa; chỉ chạy 7 đột biến mới; không chạy cổng `node tu_chay/cong.js chay`.
BÀI HỌC:
- NGUYÊN TẮC (K1): thêm trần hoặc kẹp vào một nhánh thì đọc lại chú thích hứa "không rơi đồng nào" hay "đúng tuyệt đối" ngay trên nhánh đó.
- KHOÁ (K3): ca "bảng X không khôi phục bằng file" phải là ca hành vi (gửi xlsx lên preview-restore / restore → 400, bảng không đổi), không soi chữ trong mã nguồn.
- NGUYÊN TẮC (K5): luồng "vẫn bán được" phải có ca cho MỌI cửa bán (POST /orders và phiên thanh toán), với mọi vai trò được phép.
```
Xử lý sau soát (chủ quán dặn "soát lại một lần" — ĐẠT, không mở vòng 5): sửa chú thích `viKhach.js` (lỗi 1, không đổi hành vi). Lỗi 2 (M4 soi chữ) và
lỗi 3 (ca phiên thanh toán của nhân viên) → đề xuất KHOÁ ở Bài học; nghi ngờ PIN rỗng tốn lượt → Phát hiện (khuôn có sẵn ở HangThe.jsx).

## Phát hiện (sau soát lại vòng 4)
- **Ô PIN trống vẫn gửi** (GoiNap.jsx, cùng khuôn HangThe.jsx): bấm Lưu / Tắt khi chưa gõ PIN tính là một lần sai PIN; 5 lần → khoá PIN chủ quán 15 phút
  (khoá cả màn Hạng). Đề xuất việc sau: tắt nút khi ô PIN trống ở CẢ hai màn (một chỗ sửa theo khuôn).
- **Làm tròn phần thưởng khi đền nhiều lần nhỏ:** sau trần vòng 4, vài đồng thưởng có thể sang ngăn tiền nạp (tổng ví đúng, bất biến I4 giữ). Gọn hơn: công
  thức cộng dồn (báo cáo soát mục 8) — đề xuất việc sau, không đổi tiền khách.
- **Chủ quán phải đặt PIN chủ quán trước** (Cài đặt → Hạng thành viên) thì mới thêm / sửa gói nạp được (400 CHUA_CO_PIN_CHU_QUAN).

## Soát bảo mật
Lần 1 (06.11, `/soat-bao-mat`, mốc 0406870^ → b49c45a; người tìm đọc phần riêng NAP-1 `git diff f464cea HEAD`). Trước lọc: **1** lỗ hổng · sau lọc
(một agent lọc riêng, điểm 8/10 — GIỮ): **1**. Báo cáo sau lọc, nguyên văn:

# Vuln 1: Logic tiền / điểm — duyệt hoàn trả lại đủ tiền ví nhưng không trừ điểm, mà NAP-1 nay cộng điểm cho phần trả bằng ví: `server/routes/refunds.js:160-166` (nguyên nhân mới ở `server/utils/diemThat.js:10-14`)

* Severity: Medium
* Category: business_logic / privilege abuse (tiền ↔ điểm)
* Confidence: 7/10 (người tìm) · 8/10 (người lọc — GIỮ)
* Description: NAP-1 đổi `tienTinhDiem` (diemThat.js:10-14). Phần trả bằng ví (`balance_amount`) và ví mẹ (`parent_balance_amount`) nay được tính điểm như tiền mặt. orders.js:923 cộng điểm 'earn' theo hàm này khi đơn thu đủ. Lối huỷ / xoá đơn có trừ lại điểm qua `truDiemDon` (orders.js:1683, luật P24). Lối duyệt hoàn ở `POST /api/pos/refunds/:id/approve` thì không:
  - nó đặt đơn sang `status = 'refunded'` (refunds.js:160);
  - rồi trả lại vào ví toàn bộ phần ví + ví mẹ đã trừ (refunds.js:162-169, qua `ghiVi` loại 'refund');
  - và không gọi `truDiemDon`. `grep -n point server/routes/refunds.js` không ra dòng nào.

  Trước NAP-1, yêu cầu hoàn chỉ nhận đơn có `balance_amount > 0` (refunds.js:119), và phần ví khi đó 0 điểm, nên không có điểm nào để giữ lại. Sau NAP-1, đơn trả 100% bằng ví được cộng đủ điểm, hoàn xong tiền về ví mà điểm vẫn còn.
* Exploit Scenario:
  1. Khách (hoặc nhân viên thông đồng) trả đơn 500.000đ hoàn toàn bằng tài khoản. Máy chủ cộng điểm 'earn' cho 500.000đ (orders.js:923, diemThat.js:11-13).
  2. Nhân viên bất kỳ tạo yêu cầu hoàn bằng `POST /api/pos/refunds`. Route này chỉ cần `authenticate`.
  3. Người có quyền `approve_refund` duyệt. 500.000đ trở lại ví, điểm 'earn' không bị trừ.
  4. Lặp lại: mỗi vòng sinh điểm mà không tốn tiền. Điểm đổi được ra voucher / mã giảm, tức là tiền thật.

  Cùng lỗ đó áp cho phần ví mẹ: điểm cộng cho khách con, tiền hoàn về ví mẹ.
* Recommendation: Trong giao dịch duyệt hoàn, ngay sau khi đổi đơn sang 'refunded' (refunds.js:160), gọi đúng hàm `truDiemDon(tx, don, nguoi, now, 'Hoàn')` của orders.js. Hàm này nên đưa sang `server/utils/` để dùng chung, theo luật "một quy tắc — một hàm". Thêm ca thử: đơn trả bằng ví → duyệt hoàn → tổng điểm của đơn về 0. Theo K4 cần rà mọi lối đưa đơn rời 'completed' có trả tiền ví: huỷ, xoá, duyệt hoàn. Hai lối đầu đã trừ điểm, chỉ lối duyệt hoàn còn thiếu.

Người lọc thêm (nguyên ý): lỗ do NAP-1 mới tạo (luật cũ `git show f464cea:server/utils/diemThat.js` cho phần ví 0 điểm; yêu cầu hoàn chỉ hoàn phần ví). Bất biến
I8 (`cong_cu/gia_lap/bat_bien.js` khoảng 160–180) đòi đơn 'refunded' ĐỦ điểm (tính cả ví) → không bắt lỗ này và phải sửa cùng lúc. `truDiemDon` trừ TOÀN BỘ
điểm earn của đơn → với đơn ví + tiền mặt sẽ mất cả điểm phần tiền mặt — chỗ chủ quán phải quyết.
Người tìm cũng ghi "đã soát, không thấy lỗ": giá gói máy chủ tra (orders.js:542, 899); chặn vòng nạp bằng ví (orders.js:225-232, giuCho.js:40); quyền gói nạp
(goi-nap.js chiChuQuan + kiemPinChuQuan); khôi phục sao lưu (backup.js:140); đơn nạp không huỷ / xoá / hoàn / đền; ví hai ngăn chỉ chia sổ; client không có
`dangerouslySetInnerHTML` / `fetch` trần mới.

Vòng sửa CHƯA làm — lỗi đụng ĐIỂM, cách vá cần chủ quán chọn luật (xem `## Câu hỏi` 06.11 (2)).
SOÁT BẢO MẬT: KHÔNG ĐẠT — 1

## Câu hỏi 06.11 (2) — soát bảo mật lần 1 tìm 1 lỗi ĐIỂM (dừng theo LUAT_XAY_APP §6.5 / §8.3)
**Chuyện gì:** từ NAP-1, đơn trả bằng tài khoản được tích điểm (bạn chốt 01.11). Nhưng khi đơn đó được **duyệt hoàn tiền** (Yêu cầu hoàn → Duyệt), tiền về lại
tài khoản mà **điểm vẫn giữ nguyên**. Huỷ đơn / xoá đơn thì đã trừ lại điểm, riêng duyệt hoàn thì chưa. Lặp lại "trả bằng tài khoản → xin hoàn → duyệt" sẽ
sinh điểm không tốn tiền (điểm đổi được quà). Trước NAP-1 không có lỗ này vì phần tài khoản không có điểm.

**Cần bạn chọn cách trừ điểm khi duyệt hoàn** (duyệt hoàn chỉ trả lại phần tài khoản; phần tiền mặt / chuyển khoản của đơn KHÔNG được hoàn):
- **(a) Đề xuất — trừ theo phần được hoàn:** chỉ trừ điểm của phần tài khoản (và tài khoản mẹ) vừa trả lại, giữ điểm của phần tiền mặt / CK khách vẫn trả thật.
  Đơn trả trọn bằng tài khoản → trừ hết điểm của đơn. Làm tròn số điểm trừ LÊN (thà trừ đủ, như luật "thà thiếu điểm hơn cộng sai"). Khách đã tiêu điểm
  thì số dư điểm được âm như khi huỷ đơn (P24).
- **(b) Trừ hết điểm của đơn** như huỷ đơn — dùng lại đúng hàm huỷ, đơn giản nhất, nhưng khách mất cả điểm phần tiền mặt chưa được hoàn.
Máy sẽ sửa `server/routes/refunds.js` (duyệt hoàn) + bất biến I8 (`cong_cu/gia_lap/bat_bien.js`, đơn đã hoàn) + ca thử đỏ / xanh + đột biến, rồi soát bảo mật lần 2.
Cả hai file đã trong Phạm vi. Bạn chỉ cần trả lời "(a)" hoặc "(b)".

Bước dở: 8b (soát bảo mật lần 1 KHÔNG ĐẠT — chờ câu trả lời). Chưa làm: vòng sửa điểm, soát bảo mật lần 2, cổng `chay`, báo cáo 7 mục, Bài học.

## Phiên 06.11 (3) — `tiep (a)`: vòng sửa lỗi soát bảo mật lần 1
Bước 1: nhánh `viec/NAP-1`, cây sạch; HEAD `5a695e6` · FETCH_HEAD `5a695e6` (bằng nhau — không kéo). `git log --oneline -3`:
```
5a695e6 NAP-1 soat bao mat lan 1 (KHONG DAT, 1 loi diem khi duyet hoan) + Cau hoi cho chu quan
b49c45a NAP-1 soat lai sau vong 4 (DAT, loi nhe) + sua chu thich viKhach
d920ef0 NAP-1 vong sua 4: dot bien + bang chung + trang thai
```
Chủ quán chọn **(a)**: duyệt hoàn trừ điểm theo phần tài khoản được hoàn, làm tròn LÊN, giữ điểm phần tiền mặt / CK.

| Chỗ vá | Sửa | Ca / đột biến |
|---|---|---|
| `server/utils/diemThat.js` | hàm thuần `diemTruKhiHoan(diem, tienHoan, tienDiem)` = min(diem, ceil(diem × tienHoan / tienDiem)) | E8 · VS-hoan-tru-diem-lam-tron · VS-hoan-tru-diem-khong-tran |
| `server/routes/refunds.js` duyệt hoàn | `truDiemHoan` trong CÙNG giao dịch, tiền hoàn = con + mẹ, chỉ dòng earn cộng TỪ lúc chạy bước nâng cấp 014 (`pos_nang_cap.luc` — luật tiêu ví có điểm; đơn tích theo luật cũ "ví 0 điểm" không trừ, LUAT §6.6), dòng 'adjust' gắn đơn như huỷ (P24) | E7 · BV-hoan-tru-diem · VS-hoan-tru-diem-bo-me · VS-hoan-tru-diem-ca-luat-cu |
| `cong_cu/gia_lap/bat_bien.js` I8 | đơn 'refunded': điểm đúng = điểm bán − ceil(điểm × tiền hoàn (sổ 'refund' của đơn, trừ hoan_goi) / tiền tính điểm); kho không có sổ ví → hoàn 0 | E7 (I8 = 0 lệch) · BV-I8-hoan |
| `cong_cu/thu_P24.js` I2 | ca cũ khoá "duyệt hoàn GIỮ điểm (việc sau)" → nay trừ 10 / giữ 15 (LUAT §6.8 — hành vi đã duyệt đổi, đỏ trên gốc) | I2 |
Đột biến nay **86** (80 + 6: BV-hoan-tru-diem · VS-hoan-tru-diem-bo-me · VS-hoan-tru-diem-lam-tron · VS-hoan-tru-diem-khong-tran ·
VS-hoan-tru-diem-ca-luat-cu · BV-I8-hoan). ĐỐI CHỨNG XANH 75 · 0 — BẮT 86 · SỐNG 0 · HỎNG 0 · LẠC 0. `npm test -- --day-du`: PASS 103 · FAIL 0.
K4: lối đưa đơn trả ví rời 'completed': huỷ (truDiemDon, orders.js), xoá (truDiemDon), duyệt hoàn (nay truDiemHoan) — đủ ba. Đơn 'refunded' không huỷ được
(UPDATE … WHERE status = 'completed'). Đền bù (damages.js, ngoài Phạm vi) trả tiền về ví KHÔNG trừ điểm — có từ trước (đền là bồi thường sự cố, khách giữ
điểm); ghi Phát hiện. K5: đơn tiền mặt / CK không hoàn được qua yêu cầu (cổng balance_amount > 0); phần tiền mặt giữ điểm (E7 ví + tiền mặt).

## Soát bảo mật — lần 2 (06.11, mốc 0406870^ → aef69d4; phần riêng NAP-1 `git diff f464cea HEAD`, phần mới `git diff 5a695e6 HEAD`)
Trước lọc: **0** lỗ hổng · sau lọc: **0** (không có gì để lọc — bước 3 bỏ qua). Báo cáo nguyên văn:

Không tìm thấy lỗ hổng mới nào đạt mức tin cậy ≥ 8/10 (lỗi thật, khai thác được) trong toàn bộ thay đổi riêng của NAP-1 (`git diff f464cea HEAD`), kể cả phần mới từ lần soát 1 (`git diff 5a695e6 HEAD`). Tôi chỉ đọc code, không chạy thử.

### Bản vá lần 1 (hoàn tiền ví mà không trừ điểm): đúng
- `server/routes/refunds.js`, đường duyệt hoàn `/:id/approve`: dòng 376 gọi `truDiemHoan(tx, don, con + me, ...)`. Lời gọi nằm trong cùng giao dịch, sau bước chuyển đơn sang `refunded` bằng câu ghi có điều kiện và kiểm `changes`, nên không chạy hai lần.
- Hàm `truDiemHoan` (dòng 22–36): chỉ trừ trên các dòng `earn` ghi từ lúc chạy bước nâng cấp 014 (mốc ở `pos_nang_cap`, `so = 14`); số trừ theo tỷ lệ tiền hoàn / `tienTinhDiem(don)` (đã gồm phần ví), làm tròn lên, trần là số điểm đã cộng; ghi dòng `adjust` gắn mã đơn, nhờ vậy `truDiemDon` ở huỷ / xoá đơn (`orders.js` 1683–1689, `NOT EXISTS ... type='adjust'`) không trừ lần hai.
- `server/utils/diemThat.js` `diemTruKhiHoan`: có kẹp `Math.min(diem, ceil(...))` và trả 0 khi bất kỳ đầu vào nào ≤ 0.

### Các trọng tâm phiếu đã soát, không thấy lỗ
1. Giá gói máy chủ tự tra: `orders.js` 540–556 đọc `pos_goi_nap WHERE id=? AND is_active=1`; giảm hạng bỏ qua món nạp; mã giảm bị chặn; chiết khấu tay đã tắt sẵn (LO 2); tổng tiền khách trả so với tổng máy chủ (dòng ~890).
2. Chặn vòng nạp bằng ví: `orders.js` 206–210 (trừ tài khoản, ví mẹ, `payment_method=balance`, nợ, mã, phí giao), dòng 203 (không gộp); `giuCho.js` 39–42 lúc tạo phiên, `taoDon` kiểm lại lúc chốt; App khách (`donApp.js`) không truyền được `goi_nap_id`.
3. Quyền gói: `goi-nap.js` `chiChuQuan` (role owner từ JWT / CSDL) rồi `kiemPinChuQuan`; PIN khoá sau 5 lần sai (`pinChuQuan.js` 61–72), lời báo không lộ PIN; ngoài `goi-nap.js` không chỗ nào ghi `pos_goi_nap`.
4. Khôi phục sao lưu: `backup.js` 140 — `pos_goi_nap` trong danh sách không khôi phục; `chanTrangTien` chặn ở `/preview-restore` (311) và `/restore` (343).
5. Ví hai ngăn: tham số `thuong` của `ghiVi` chỉ đơn nạp truyền (`orders.js` 1022), không từ thân yêu cầu; huỷ / xoá / yêu cầu hoàn đơn nạp → `NAP_KHONG_HOAN`; đền đơn nạp chặn ở `damages.js` (`GOI_THE_KHONG_DEN`); không giả được dòng nạp.
6. Đường mới khác: `GET /goi-nap` chỉ tên + giá; `/tat-ca` cần `manage_products`, `/reports/so-sach` cần `view_reports`; SQL có tham số; giao diện không `dangerouslySetInnerHTML`.

### Ghi chú (không phải lỗ hổng)
- Đền bù không trừ điểm phần được đền, và khoản đền bị trừ khỏi số hoàn khi duyệt hoàn sau này — có từ trước với đơn tiền mặt, nay áp thêm phần ví; đền có trần theo món, chỉ quản lý / chủ quán làm. Tin cậy là lỗ hổng: 3/10.
- Phép so tổng cho lệch ±1đ → đơn nạp có thể thu thiếu 1đ mà ví vào đủ; hành vi chung mọi đơn. Tin cậy: 2/10.

### Chưa kiểm
- Người soát không chạy code, không dựng bài thử; kết luận từ đọc file.

SOÁT BẢO MẬT: ĐẠT

## Soát độc lập vá điểm khi duyệt hoàn (/ra-soat, 06.11, 5a695e6 → aef69d4) — chép nguyên báo cáo
```
KHÔNG ĐẠT

Tóm tắt: phần vá trong refunds.js đúng với lựa chọn (a) của chủ quán. E7, E8 và I2 đỏ trên bản gốc, xanh trên bản đã vá. Mình chạy lại 6 đột biến mới, cả 6 đều bị bắt. Có hai chỗ chưa ổn:
- (1) Hai lối song song vẫn trả tiền ví về mà giữ nguyên điểm: đền bù và kết thúc gói. Hồ sơ ghi "đủ ba lối", ghi vậy là sai. Lỗi này dính tới điểm và nằm ngoài Phạm vi, nên cần chủ quán quyết.
- (2) Phép chia ở máy chủ chưa có bài thử nào khoá. Mình cài thử một đột biến trong thư mục nháp và nó SỐNG.

LỖI TÌM ĐƯỢC:
- server/routes/damages.js:184-187 (đền bù) và server/routes/packages.js:265-268 → wallets.js:109-117 (kết thúc gói, `hoan: true`). Cả hai trả tiền về ví của một đơn có điểm (đền ghi `ghiVi` loại 'compensation'; kết thúc gói ghi 'refund' qua ghiHoan) mà không trừ điểm nào — khuôn K4 — NẶNG (điểm, ngoài Phạm vi, cần chủ quán quyết).
  - Lỗ này mới có từ NAP-1. Trước đây phần trả bằng ví được 0 điểm. Nay đơn mua gói và đơn món trả ví đều tích điểm (orders.js:923; chỉ đơn nạp bị loại ở :928).
  - Ví dụ một vòng: trả 21.000 bằng ví được 21 điểm. Quản lý đền 21.000, tiền về ví, điểm còn nguyên (damages.js:126-130, chỉ cần manager/owner). Nếu sau đó duyệt hoàn thì phần hoàn đã trừ số đền (tienDaTra.js:47-49), nên con + mẹ = 0 và truDiemHoan trừ 0 điểm. Lặp lại được, cùng dạng lỗ mà lần soát bảo mật 1 đã báo.
  - Ngoài ra, đơn trả tiền mặt được đền vào ví thì tiền đó nay tiêu lại được tích điểm lần hai.
  - Kết thúc gói cần quyền refund_package (mặc định chỉ owner), mức nhẹ hơn, nhưng cùng khuôn.
  - trang_thai.md:413-416 ghi "đủ ba (huỷ, xoá, duyệt hoàn)" và đền bù "có từ trước". Câu đó sai, vì phần điểm của ví là mới. Kết thúc gói thì không được nhắc tới.
- cong_cu/thu_NAP1.js:521-538 (E7) và thu_P24.js:387-392 (I2): không ca nào có phí giao hay total khác tiền tính điểm — khuôn K3 — NHẸ (đụng điểm).
  - Mình đổi mẫu số ở refunds.js:27 từ `tienTinhDiem(don)` thành `Number(don.total)` trong bản nháp scratchpad/soat_mau, rồi chạy `node cong_cu/thu_NAP1.js --may-chu …/soat_mau/server`. Kết quả: ✓ E7 vẫn xanh, tức đột biến SỐNG.
  - E8 chỉ khoá hàm thuần, không khoá chỗ gọi. Theo luật K4, mỗi chỗ gọi là một chỗ vá riêng.
  - Theo suy luận (chưa chạy): vòng nhiều nhóm hạn ở refunds.js:28-33 (`conTru -=`, `ORDER BY`) cũng không có ca nào. Mọi ca chỉ có 1 nhóm, nên gỡ `conTru -= tru` hay đổi DESC thành ASC đều sẽ SỐNG.
- Chú thích sai hoặc đã cũ — khuôn K1 — NHẸ:
  - refunds.js:22 ghi "trừ nhóm hạn dùng xa nhất trước". Nhưng SQLite xếp NULL (không hạn, tức xa nhất) xuống CUỐI khi `ORDER BY expires_at DESC` (:27).
  - bat_bien.js:10 ghi dòng 'adjust' gắn đơn "dành RIÊNG cho việc này (huỷ/xoá), việc sau đừng dùng lẫn". Nay duyệt hoàn cũng dùng loại dòng này. Câu này còn ở :208 ("trừ điểm do huỷ / xoá") và orders.js:1680.
  - Đầu file bat_bien.js:8-15 chưa ghi luật đơn 'refunded'.
  - hoaDon.js:46 ghi "huỷ / hoàn … cộng ròng = 0". Nay đơn đã hoàn còn giữ phần tiền mặt (file này ngoài Phạm vi).

NGHI NGỜ:
- Mốc `pos_nang_cap so = 14` (refunds.js:24). Bộ nâng cấp ghi `luc = getNow()` ngay câu đầu giao dịch của bước 014, chạy khi máy chủ khởi động (chay.js:36, database.js:39), cùng định dạng với `created_at` của dòng earn. Nên nghĩa "từ lúc luật mới chạy" là đúng, với hai lỗ:
  - (a) Render triển khai không ngắt quãng: máy mới chạy 014 trong khi máy cũ (luật ví 0 điểm) vẫn bán thêm vài chục giây. Dòng earn luật cũ có `created_at ≥ mốc`, nên khi duyệt hoàn sẽ bị trừ oan phần tiền mặt (K5; hiếm, I8 sẽ báo lệch).
  - (b) Mốc gắn vào SỐ bước (14), không gắn tên `014_nap`. Nếu nhánh khác trùng số 014 thì mốc sai, kiểm bằng `ten` thì chắc hơn.
- Hai định nghĩa "luật mới" khác nhau: máy chủ dùng mốc 014 trong dữ liệu, I8 dùng hằng `DIEM_VI_TU = '2026-11-08'` (bat_bien.js:27). Nếu ngày gộp không phải 07.11, I8 sẽ báo oan hoặc tha sai cho đơn nằm giữa hai mốc. Đơn cũ có điểm lúc bán trước mốc, rồi nhận thêm qua mã bill sau mốc: máy chủ chỉ trừ theo phần mã bill, I8 tính theo cả đơn, nên có thể lệch.
- Ca "khách đã tiêu điểm → số dư âm" chưa có bài thử. Chỉ đọc code thấy nó INSERT vô điều kiện (refunds.js:31-32), nên đúng ý chủ quán.
- Xoá đơn đã hoàn (orders.js:1738, chỉ chạy truDiemDon khi status = 'completed') giữ phần điểm tiền mặt. Trong khi đó, xoá đơn còn 'completed' thì trừ hết. Không phải lỗ mới, chỉ là không nhất quán.

NGHIỆM THU: 8/9 · thiếu: ca "đã tiêu điểm → số dư âm" (chỉ có bằng chứng đọc code).
- Đủ bằng chứng: tỷ lệ phần hoàn (E7b/c) · gồm cả ví mẹ (E7c + VS-bo-me) · làm tròn LÊN (E7b, E8 + VS-lam-tron) · giữ điểm tiền mặt / CK (E7b/c) · trọn ví về 0 (E7a) · không quá số điểm (E8 + VS-khong-tran) · luật cũ không trừ (E7d) · I8 và I2 cập nhật (E7 lechI8 + BV-I8-hoan; I2 đỏ / xanh).
- Mẫu số tiền tính điểm ở máy chủ chưa có ca khoá (xem LỖI 2).

CHƯA SOÁT ĐƯỢC: hành vi thật trên Render/Turso lúc triển khai (thời điểm 014 chạy, hai máy chồng nhau); chưa chạy `npm test --day-du` và `cong.js chay`; chưa chạy đột biến cho vòng nhiều nhóm hạn (mới suy luận); chưa đọc toàn bộ 86 đột biến cũ.

BÀI HỌC:
- KHOÁ: mỗi chỗ GỌI hàm tỷ lệ phải có một ca tích hợp mà mẫu số khác total (có phí giao), kèm đột biến đổi mẫu số.
- NGUYÊN TẮC (K4): khi đổi luật "cái gì sinh điểm", phải liệt kê theo TIỀN chảy về ví (`grep "ghiVi(\|ghiHoan("`: damages.js:185, packages.js:267, wallets.js:111/116, refunds.js:186/190, orders.js:1498), không liệt kê theo "lối đổi trạng thái đơn". Mốc luật nên gắn vào tên bước nâng cấp, không gắn vào số.
```

### Đã sửa ngay (lỗi NHẸ trong Phạm vi)
| Lỗi | Sửa | Ca / đột biến |
|---|---|---|
| 2 mẫu số ở chỗ gọi chưa khoá; nhiều nhóm hạn chưa ca | E9 (phí giao 3.000: 21 → trừ 10 → 11; hai nhóm hạn) | VS-hoan-mau-so-total · VS-hoan-nhom-khong-tru-dan · VS-hoan-nhom-thu-tu |
| K1 refunds.js "xa nhất trước" sai thứ tự (NULL xuống cuối) | `ORDER BY expires_at IS NULL DESC, expires_at DESC` (E9 ĐỎ trên bản trước) | VS-hoan-nhom-thu-tu |
| K1 chú thích 'adjust' chỉ huỷ / xoá | `bat_bien.js` đầu file + dòng loại điểm lạ; `orders.js` chú thích truDiemDon | — |
| Nghi ngờ (b) mốc theo số bước | `pos_nang_cap WHERE ten = '014_nap'` | (cùng E7d) |
Kết quả: thu_NAP1 76 · 0; đột biến 89 · BẮT 89; `npm test -- --day-du` PASS 103 · FAIL 0. Câu "đủ ba lối" trong mục Phiên 06.11 (3) là SAI (xem lỗi 1) — giữ nguyên
dòng cũ để lịch sử đúng, sửa ở đây: lối trả tiền ví về cho đơn có điểm gồm huỷ · xoá · duyệt hoàn (đã trừ điểm) và **đền bù · kết thúc gói (CHƯA trừ — câu hỏi dưới)**.

## Phát hiện (thêm)
- `server/utils/hoaDon.js:46` (ngoài Phạm vi) ghi "huỷ / hoàn … cộng ròng = 0" — nay đơn đã hoàn giữ điểm phần tiền mặt; sửa chú thích khi chạm tới.
- Mốc luật điểm hai nơi: máy chủ dùng thời điểm chạy bước 014 (dữ liệu), I8 dùng hằng `DIEM_VI_TU` (tạm '2026-11-08') — chat đặt hằng đúng ngày gộp.
  Triển khai không ngắt quãng trên Render: vài chục giây máy cũ còn bán theo luật cũ sau mốc → nếu đơn đó được duyệt hoàn sẽ trừ cả phần tiền mặt (hiếm; I8 báo).
- Xoá đơn ĐÃ HOÀN giữ điểm phần tiền mặt, xoá đơn còn hoàn tất thì trừ hết — không nhất quán, có từ trước (P24), không đổi tiền.

## Câu hỏi 06.11 (3) — soát độc lập tìm lỗi ĐIỂM ngoài Phạm vi (dừng theo LUAT_XAY_APP §6.5)
**Chuyện gì:** từ NAP-1 phần trả bằng tài khoản có điểm. Ngoài "duyệt hoàn" (đã sửa theo (a)), còn **hai** lối trả tiền về tài khoản mà điểm vẫn giữ:
1. **Đền bù sự cố** (Lịch sử đơn → Đền, quản lý / chủ quán): đơn trả 21.000 bằng tài khoản được 21 điểm; đền 21.000 vào tài khoản → điểm còn 21. Lặp lại được
   (cùng dạng lỗ đã sửa). Thêm: tiền đền vào tài khoản tiêu lại cũng được tích điểm lần nữa.
2. **Kết thúc gói có hoàn** (Báo cáo → Gói SP, chỉ chủ quán mặc định): phần tài khoản hoàn lại, điểm giữ.
Hai file này (`server/routes/damages.js`, `server/routes/packages.js`) **ngoài Phạm vi** — máy không tự sửa.

**Đề xuất:** (a) — làm như duyệt hoàn: trừ điểm theo phần **tài khoản** được trả lại (tỷ lệ, làm tròn lên); tiền mặt đền vào tài khoản thì không trừ (khách
không được điểm từ phần đó lúc mua). Máy dùng lại đúng hàm vừa viết. Nếu đồng ý, bạn thêm `server/routes/damages.js` và `server/routes/packages.js` vào
`## Phạm vi` của phiếu (hoặc chọn **(b)**: để làm việc sau, ghi vào sổ — NAP-1 đi tiếp tới báo cáo cuối với lỗ này ghi rõ ở CHƯA KIỂM).
Bạn trả lời "(a) + thêm hai file" hoặc "(b)".

Bước dở: 8 (soát độc lập vá điểm — KHÔNG ĐẠT: lỗi nhẹ đã sửa, lỗi nặng ngoài Phạm vi chờ câu trả lời). Soát bảo mật lần 2 ĐẠT (dòng `SOÁT BẢO MẬT: ĐẠT` ở trên —
nếu chọn (a) thì sau khi sửa phải soát bảo mật lại theo bước 8b). Chưa làm: cổng `chay`, báo cáo 7 mục, Bài học.
