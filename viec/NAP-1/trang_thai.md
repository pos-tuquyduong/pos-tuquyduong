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

### Bảng chỗ vá → đột biến (`viec/NAP-1/dot_bien.py`, 68 đột biến · BẮT 68 · có đối chứng)
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
| 3 EXISTS lồng không chỉ mục | `sqlDonNap` và I8 dùng `id IN (SELECT order_id … )` (câu con chạy một lần) | (hiệu năng — CHƯA KIỂM bằng máy, xem dưới) |
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
