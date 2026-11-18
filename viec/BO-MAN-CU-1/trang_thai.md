# BO-MAN-CU-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (17.11.2026)
- Nhánh: `viec/BO-MAN-CU-1` · cây sạch (không file đã theo dõi đang sửa).
- `git fetch origin viec/BO-MAN-CU-1` → HEAD `d52b9fb` · FETCH_HEAD `d52b9fb` (bằng nhau — không kéo).
- `git log --oneline -3`:
  ```
  d52b9fb PHIEU: BO-MAN-CU-1 bo man Ban hang cu, khoa duong tao don thang, tam ngung goi (chu quan 17.11 14:47)
  c8d0c7d Merge pull request #99 from pos-tuquyduong/viec/KET-NOI-1
  4e25e56 KET-NOI-1: HEAD DA KIEM ae778712 sau khi ghep main
  ```
- Kho mây là kho nông → `npm test` gốc FAIL 1 (`thu_BH2` G1 cần lịch sử git). Đã `git fetch -q --unshallow origin viec/BO-MAN-CU-1` → gốc
  PASS 121 · FAIL 0 · CẢNH BÁO 1.

## Bước 2–3 — đọc, kế hoạch (17.11.2026)
- Đã đọc phiếu, CLAUDE.md, KHUON_LOI.md, CHECKLIST P3/P4/G/H, sổ quyết định (11.11 bỏ màn cũ + PIN; "Không công nợ"), code vùng sửa (file:dòng trong `ke_hoach.md` mục 0–1).
- Hai agent chỉ đọc: (1) đếm 38 bài gọi thẳng `POST /orders` theo ba cách B4; (2) kiểm kê từng ca của 22 bài bị ảnh hưởng (≈ 65 L · 430 F · 40 E).
- Agent soát kế hoạch (4 câu) bắt: thiếu `thu_gia_lap.js` (file luật) trong Câu 1; A2 vướng `Layout.jsx:69` (Cấm) + sót `banHang.css:1`;
  KB4 (ví + nợ) không đi phiên được; C3/C4/C6 chưa có bằng chứng, C1/C5 thiếu ca; đường vòng chuyển khoản không QR qua `pay-debt`;
  `thu_VOUCHER2.js:1110` dùng prop cũ; số dòng `TRUONG_DON` sai. Đã sửa hết vào `ke_hoach.md` (mục 3, 4.1b, 4.2, 4.3, 7, 8).
- Phiếu dặn "Chờ duyệt kế hoạch" → DỪNG ở bước 3.

## Câu hỏi
Năm câu ở `ke_hoach.md` mục 7, mỗi câu có đề xuất:
1. Thêm ĐÚNG TÊN 7 file luật vào Phạm vi (`gia_lap/kich_ban.js`, `gia_lap/donCu.js` mới, `thu_P20/P21/P26a/P26b.js`, `thu_gia_lap.js`) — bắt buộc.
2. Cho thêm một dòng `chayBaiThat('cong_cu/thu_BOMANCU1.js')` vào bộ kiểm (ngoài hai việc D2 cho).
3. A2: thêm `InvoiceSettings.jsx` vào Phạm vi (sửa một chú thích); `Layout.jsx:69` để nguyên (Cấm, không nói về màn bán hàng).
4. Duyệt cách tách `taoDon` = cửa chặn + `taoDonGoc` (xuất cho bài thử dựng đơn cũ, có phép khoá) và bài thử ≈ 780 dòng (phiếu ~300).
5. Chặn luôn ghi nợ / chờ thu ở đường thẳng (đường vòng chuyển khoản không QR qua thu nợ) — đề xuất làm luôn.

## Bước 1 — làm tiếp sau duyệt (18.11.2026, "BO-MAN-CU-1 tiep")
- Hook mở phiên kéo nhánh `4386c365 → 28b6efeb`. `git fetch` → HEAD `28b6efeb` · FETCH_HEAD `28b6efeb` (bằng nhau). Kho không nông.
- `git log --oneline -3`:
  ```
  28b6efeb PHIEU: BO-MAN-CU-1 chu quan duyet ke hoach 'dong y ca 5' (17.11 19:04): Pham vi 7 file luat + InvoiceSettings, chayBaiThat, taoDonGoc, KHONG_GHI_NO
  4386c365 BO-MAN-CU-1: ke hoach sua theo soat (thu_gia_lap, A2 vuong Layout, C1-C7 bang chung, duong vong pay-debt) — cho chu quan duyet
  01941256 BO-MAN-CU-1: ke hoach day du (cua chan taoDon, donCu cho bai thu cu, 4 cau hoi) — cho soat
  ```
- Chủ quán duyệt "đồng ý cả 5" (phiếu mục B4b). Code gốc của việc = `28b6efeb` (chưa đổi code chạy thật).

## Bước 4–7 — bài thử, sửa, kiểm (18.11.2026)
- Bài MỚI `cong_cu/thu_BOMANCU1.js` viết TRƯỚC (commit `6e6e1bdf`): trên code gốc 15 đạt · 33 hỏng (chỉ các ca luồng hợp lệ C1 xanh) —
  `bang_chung_do.txt`. Hai lần sửa bài vì chính bài viết sai (K2, truy nguyên trước — code đúng):
  - React giả: esbuild nạp module giả dạng CommonJS theo kiểu Node → `default` là cả module → đổi sang ESM;
  - C1k: máy chủ không cộng giảm hạng vào đơn có món Giờ vàng (`orders.js` `if (!flashApplied && phone)`) → tách C1k (hạng) / C1l (flash);
  - C5b / C5f chờ sai luật HUY-1 (huỷ hoàn TOÀN BỘ vào tài khoản — `thu_HUY1.js` D4; gói chưa lấy lượt bị bỏ — `orders.js` huỷ đơn mua gói)
    → sửa lời chờ, thêm C5h (gói đã lấy 1 lượt → cancelled).
- Hàm phụ `cong_cu/gia_lap/donCu.js`: `donCu` (thân `taoDonGoc`, res giả đi qua JSON như express) + `laDonCu` (thân cửa chặn từ chối ở đường thẳng).
- Máy chủ (`db3d5f60`): `server/routes/orders.js` — `taoDon` = cửa chặn (gói mọi lối → GOI_TAM_DUNG; `!phien`: ví / mẹ → VI_PHAI_QUA_PIN,
  CK → CK_PHAI_QUA_PAYOS, nợ / chờ thu → KHONG_GHI_NO; bỏ câu đọc cờ `thanh_toan_payos_bat_buoc`) rồi `return taoDonGoc(...)`; thêm
  `module.exports.taoDonGoc`. Thân cũ không đổi dòng nào ngoài việc dời cổng cờ ra cửa chặn.
- Giao diện (`49261091`): `BanHang/index.jsx` luôn `<BanHangMoi kieu onDoiKieu>`; `tinh.js` `docKieu` / `ghiKieu` thay `docCongTac` / `ghiCongTac`
  (bỏ `KHOA_CONG_TAC`); bảng ⚙ "Kiểu màn bán hàng (máy này)", bỏ nút về màn cũ; xoá `pages/Sales.jsx`, `components/CustomerSearch.jsx`
  (chỉ Sales dùng), `ordersApi.create`; chú thích nhắc Sales / màn cũ ở BanHangMoi, tinh.js, banHang.css, QrScanModal, InPhieu, InvoicePrint,
  InvoiceSettings:745 (câu 3). Xoá `cong_cu/do_chuathu.js` (công cụ chỉ soi Sales).
- A4 gói JS: trước `index-CCsMmDck.js` = 978.980 byte → sau `index-NCjirw6f.js` = 916.573 byte (−62.407).
- D2 `kiem_tra_truoc_khi_giao.js` (`a68fee1b`): `NGUONG_FETCH` 31 → 22 (đo: bộ kiểm in "fetch trần ngoài api.js = 22" sau khi xoá; Sales 7 +
  CustomerSearch 2); thêm `chayBaiThat('cong_cu/thu_BOMANCU1.js')` cạnh `thu_KETNOI1`. Không đụng phép nào khác.
- Sự cố commit: `68ae0d80` (tiêu đề "A2 dò chữ Sales…") gộp luôn 3 file đã `git rm` trước đó (Sales.jsx, CustomerSearch.jsx, do_chuathu.js) —
  `git rm` đưa vào chỗ chờ, `git add <bài>` + commit lấy cả. Nội dung đúng việc, chỉ tiêu đề thiếu; không sửa lịch sử (không amend).

### Bài cũ đổi (bài SỬA thường — hành vi chủ quán duyệt đổi, LUAT §6.8) — ca nào đổi
| Bài | Đổi |
|---|---|
| P20, P21, P26a, P24, KH1, P26b, P26c, GOI1, P2223, DIEMTHAT1, HD1, VIME1, HUY1, DOISOAT1, DIEMMON1, NAP1, KHNAP1, VOUCHER2, UUDAI1, GIAO1, GIAO2 | hàm gọi máy chủ (`goi` / `goiAi` / `taoDon` / `ban`): `POST /orders` thân kiểu cũ (`laDonCu`) → `donCu` (đơn cũ, thân `taoDonGoc`); đơn tiền mặt vẫn HTTP. Ca giữ nguyên. |
| P24 | I1d (thẻ trả ví → THE_KHONG_TRA_VI) đi `donCu` (luật nằm ở thân). |
| P26c | bỏ A6c (ô lượt gói của màn cũ); chú thích. |
| P26b | nhãn mục [MẸ] (chữ "Sales.jsx gửi" → "đơn cũ màn cũ gửi"). |
| P3 | F1 đơn trừ ví khi đang giữ → `donCu`; H1 (TRA_KET_HOP) → `donCu`; **H** CK trần đường thẳng → 400 CK_PHAI_QUA_PAYOS (trước 200); **I1–I6** tách: tiền mặt · thẻ · đơn nợ CŨ (donCu) thu ở pay-debt → 200; số dư 2 kiểu → VI_PHAI_QUA_PIN; mua / lấy gói → GOI_TAM_DUNG; **I7** giao từ gói khi cờ bật → GOI_TAM_DUNG. |
| VOUCHER2 | **F5** phiên có gói → 400 GOI_TAM_DUNG, không phiên (trước 200, tổng 345.000); Q14c prop `onDoiCaiDat` → `onDoiKieu`. |
| UUDAI1 | **K4a / K4b** tinh-thu có gói → 400 GOI_TAM_DUNG, đơn gói cũ (donCu) vẫn đúng tổng tính tay; K4c giữ; **[S]** S1–S7, S9, S10 chuyển từ Sales.jsx sang BanHangMoi.jsx + tinh.js (ordersApi.tinhThu, thanTinhThu = `don` của phiên, tổng từ mayChu, coSo chặn thu, cau_ghi, loiTinh, khoaTinh, ma_loi). |
| HANG1 | G2 / G2b soi BanHang/tinh.js + BanHangMoi.jsx (membership_buy {tier_id, so_thang}, khoá có so_thang, gói đang bán có giá, "Khách có hạng cao hơn"); thêm **G2c** không còn Sales.jsx. |
| BH1 | A1–A7 công tắc → `docKieu` / `ghiKieu`; thêm **A8** tinh.js không còn docCongTac / ghiCongTac / KHOA_CONG_TAC; bỏ I10 / I11 (so khoá orderData màn cũ); **S10** → không còn Sales.jsx; nhãn D11. |
| BHCKTAY1 | viết lại cho màn Bán hàng: [A] BanHang/ không ô / state / nhánh giảm tay, tổng từ máy chủ, **A6** không còn Sales.jsx; [B] chạy thật thanTinhThu / thanPhien (không trường giảm tay; có mã → discount_code; `don` phiên = thân tinh-thu); [C] phiên tiền mặt với thân màn dựng → tổng = tinh-thu, không mức giảm. |
| KHACHCK1 | D1c → không còn Sales.jsx; E1a bỏ vế Sales; F3a bỏ (máy chủ F3b / F3c giữ). |
| BAO1a | bỏ hai dòng MAN_DA_RA (Sales.jsx, CustomerSearch.jsx); C6 → BanHangMoi `setLoiTinh(loiTinhGia(e))`; thêm **C6b** không còn hai file. |
| gia_lap/kich_ban.js | `c.taoDon`: trả đủ tài khoản của chính khách → phiên `tai_khoan` + PIN (khách có hồ sơ); chỉ CK → phiên `ck_tay` + xác nhận tay; còn lại (gói, ví một phần, ví mẹ, nợ / chờ thu) và `c.goi` POST /orders → `donCu`; KB9 thêm cảnh "quầy bán / lấy gói → 400 GOI_TAM_DUNG, không ghi" (không thêm KB — SO_KB 33 giữ). |
| không sửa | `thu_BH2.js` S16 nhãn còn chữ "công tắc từng máy, mặc định TẮT" (regex vẫn đúng, bài xanh) — Phát hiện; `thu_gia_lap.js` không phải sửa. |

### Chỗ vá → đột biến (`viec/BO-MAN-CU-1/dot_bien.py`, mỗi đột biến một dòng)
| Chỗ vá | Đột biến |
|---|---|
| cửa chặn: vế tài khoản khách (`balance_amount`, nhãn `balance`) | BV-VI-THANG · BV-BALANCE-NHAN |
| cửa chặn: vế tài khoản mẹ | BV-VI-ME-THANG |
| cửa chặn: bỏ cờ `thanh_toan_payos_bat_buoc` | VS-CAI-DAT-CON |
| cửa chặn: vế chuyển khoản (`transfer_amount`, nhãn `transfer`; mọi giá trị khác rỗng / 0 — số âm, chuỗi chữ) | BV-CK-THANG · BV-CK-NHAN · VS-CK-CHI-DUONG · VS-CK-BO-NAN |
| cửa chặn: vế ghi nợ / chờ thu (câu 5) | BV-GHI-NO-THANG · VS-GHI-NO-CHI-SO |
| cửa chặn: gói (mua / mã gói / món từ gói), mọi lối | BV-GOI-MUA · BV-GOI-MA · BV-GOI-TU-GOI · VS-GOI-CHI-THANG |
| khoá: chỉ `taoDon` gọi `taoDonGoc` (K1); mọi lối tạo đơn đi qua `taoDon` — đúng 6 lời gọi (K2) | VS-GOI-THANG-LOI-GOC · VS-THEM-LOI-TAO-DON |
| index.jsx luôn màn mới (kho cũ "tắt", ?man=cu) | VS-MAN-THEO-KHO-CU · VS-MAN-CU-QUERY |
| tinh.js nhớ kiểu | BV-KIEU-KHONG-NHO |
| bảng ⚙ không nút về màn cũ | BV-NUT-TAT |
| api.js bỏ ordersApi.create | BV-API-CREATE |

Kết quả `python3 viec/BO-MAN-CU-1/dot_bien.py` — lần đầu (HEAD `a68fee1b`): 18 đột biến · BẮT 18, đối chứng 62 đạt. **Số hiện tại (sau vòng sửa 2,
HEAD `2f591a6a`): ĐỐI CHỨNG XANH · 67 đạt · 0 hỏng; TỔNG: 20 đột biến · BẮT 20 · SỐNG 0 · HỎNG 0 · LẠC 0** (thêm VS-CK-CHI-DUONG vòng 1, VS-CK-BO-NAN vòng 2).

### Kiểm
- `npm test -- --day-du`: lần đầu HEAD `a68fee1b` PASS 126 · FAIL 0 · CẢNH BÁO 1; **chạy lại sau vòng sửa 2 (HEAD `2f591a6a`): PASS 126 · FAIL 0 ·
  CẢNH BÁO 1** (cảnh báo có sẵn từ trước việc này).
- Giả lập một ngày (`node cong_cu/gia_lap/chay.js`): 33 kịch bản · 18 bất biến · ĐẠT; `thu_gia_lap.js` 180 đạt · 0 hỏng.
- Bằng chứng đỏ: `bang_chung_do.txt` — 28 bài thử đổi / mới đều ĐỎ trên cây gốc `28b6efeb` (lượt như cổng A11: 21 bài thiếu hàm phụ
  `donCu.js` — sập; lượt kèm hàm phụ: đỏ vì "orders.js chưa có taoDonGoc", màn cũ / công tắc cũ còn); 28 dòng `SỐ CA` chạy trên HEAD.
- `node tu_chay/cong.js tinh . d52b9fb^ HEAD viec/BO-MAN-CU-1` (HEAD `9913355a` sau commit bằng chứng): chỉ `✗ [A20]` (chưa soát bảo mật) và `✗ [A19]`
  (chưa ghi HEAD ĐÃ KIỂM) — đúng dự kiến ở bước này.

## Phát hiện (không sửa trong việc này)
- `client/src/index.css:664-700` còn khối CSS "SALES PAGE RESPONSIVE" (`.sales-layout`, giỏ thu gọn) chỉ màn cũ dùng — CSS chết, file ngoài Phạm vi.
- `client/src/pages/BanHang/tinh.js` `dungDonHang` (thân POST /orders đợt 1) không màn nào gọi nữa; đường thẳng nay chỉ tiền mặt — mã chết,
  còn bị `thu_BH1` I1–I9 và `thu_KHACHCK1` D2 khoá → đề xuất xoá cùng hai bài ở việc sau (chú thích đầu hàm đã ghi "chờ chủ quán duyệt xoá").
- Chú thích máy chủ còn nhắc `Sales.jsx`: `server/routes/orders.js:371` ("Man ban hang da kiem viec nay (Sales.jsx:77)"), `:784` ("Sales.jsx:29") (số dòng ở HEAD sau vòng sửa 2),
  `server/utils/goiKhach.js:21` ("như Sales.jsx") — `orders.js` ngoài vùng phiếu cho sửa, `goiKhach.js` ngoài Phạm vi (K1: chú thích là khẳng định).
- `cong_cu/thu_BH2.js:243` nhãn S16 còn "công tắc từng máy, mặc định TẮT" (phép vẫn đúng: App.jsx trỏ TrangChu) — không sửa để bài khỏi phải vào
  "Bài thử cũ sửa"; sửa nhãn khi chạm bài sau.
- Cài đặt `thanh_toan_payos_bat_buoc` thành thừa (gieo `server/database.js:1114`; không còn chỗ đọc) — bài thử cũ vẫn đặt `'0'`, vô hại.
- Trừ tài khoản KHÔNG PIN còn ở `POST /wallets/deduct`, `/wallets/adjust` (`server/routes/wallets.js`, quyền `adjust_balance`; `ViKhach.jsx` gọi
  adjust) — sổ quyết định 11.11 "trừ tiền tài khoản luôn cần PIN chủ tài khoản". Đề xuất việc sau.
- Chuyển khoản không qua QR còn: `POST /orders/:id/pay-debt` `transfer` cho ĐƠN NỢ CŨ (việc TIEN-KHOA-2 theo phiếu B4b câu 5) và
  `POST /orders/:id/doi-cach-tra` tiền mặt → chuyển khoản (`server/routes/don-mo-rong.js`, ngoài Phạm vi).
- `payment_method` của đơn là chữ tự do ghi nguyên (`combined`, `mixed`, `momo` có trong bài thử) — nay đường thẳng chỉ nhận đơn tiền mặt,
  nhãn lạ (không phải balance / transfer / debt / cho_thu) vẫn lọt vào cột; tiền đúng cột, chỉ nhãn lạ.
- Kho mây là kho nông → `thu_BH2` G1 đỏ oan cho tới khi `git fetch --unshallow` (K2). Máy đã tự tải thêm lịch sử ở bước 1.

## Soát độc lập — vòng 1 (agent độc lập, HEAD f0ec5fc7) — chép nguyên văn
```
KHÔNG ĐẠT

LỖI TÌM ĐƯỢC:
1. server/routes/orders.js:197 — [K4: cổng không cùng biểu thức với chỗ dùng · đường tiền]
   - Cửa chặn chuyển khoản dùng `Number(b.transfer_amount) > 0`.
   - Chỗ dùng cộng mọi số khác 0: orders.js:1002 `(Number(transfer_amount) || 0)`, rồi ghi nguyên vào đơn ở :1104.
     Cổng TRA_KET_HOP :250 cũng chỉ xét `> 0`.
   - Đã chạy thử bằng script nháp (gọi taoDon, phien = null): {cash_amount 35.000, transfer_amount −10.000, món 25.000} → 200.
     Đơn lưu payment_method cash, cash 35.000, transfer −10.000.
   - Như vậy đường thẳng "chỉ tiền mặt" (chú thích orders.js:184, phiếu B2) vẫn nhận một phần chuyển khoản âm.
     Sổ đối soát chuyển khoản và két sẽ sai.
   - Chưa thấy cách lấy tiền ra: mọi nguồn tiền dương khác đều đã bị chặn. Lỗ này có từ trước (cổng cũ cũng `> 0`),
     nhưng chính việc này hứa đóng nó.
   - Cách sửa gọn: `Number(b.transfer_amount) !== 0`, hoặc chặn mọi số tiền âm ở cửa chặn. Kèm ca B2d (CK âm → 400, không ghi gì)
     và một đột biến đưa lại `> 0`.
   - Số dư / ví mẹ / nợ âm thì vô hại: chỗ dùng :927, :949, :977 cũng là `> 0`.

2. cong_cu/thu_KHNAP1.js:443-449, :478 và cong_cu/thu_NAP1.js:262 — [K3: tên ca nói một đằng, máy kiểm một nẻo · K1]
   - Hàm gọi máy chủ của hai bài chuyển mọi thân bị chặn sang `donCu` (dòng `laDonCu`), nên các ca này không còn đi qua quầy thật.
   - Tên ca vẫn khẳng định quầy:
     - KHNAP1 B2 "quầy: thẻ + balance … → THE_KHONG_TRA_VI";
     - KHNAP1 B2 "cờ bật → vẫn THE_KHONG_TRA_VI (không VI_PHAI_QUA_PIN)";
     - KHNAP1 K5 "ví mẹ cho đồ uống ở quầy → 200; gói trả trước trả số dư → 200";
     - NAP1 B5 b5c "mua gói → NAP_KHONG_GOP".
   - Quầy thật (HTTP) hôm nay trả 400 VI_PHAI_QUA_PIN / GOI_TAM_DUNG. Ca xanh nhưng khẳng định ngược với hành vi trên quầy.
   - Kế hoạch đã duyệt (ke_hoach.md mục 4.3) ghi "KHNAP1 K5 và B2 t1[4] → mã mới; NAP1 K2 và B5 b5c → mã mới".
     Máy làm khác kế hoạch, và trang_thai.md bảng "Bài cũ đổi" ghi "Ca giữ nguyên", không nêu chỗ lệch.
   - Cách sửa: đổi lời chờ sang mã quầy thật qua HTTP, hoặc đổi tên ca thành "thân taoDonGoc (đơn cũ)".

3. viec/BO-MAN-CU-1/bang_chung_do.txt, đoạn mở đầu lượt 2 — [K1 · K3]
   - Câu "bài đỏ vì HÀNH VI gốc — orders.js chưa có taoDonGoc" sai với 21 bài dùng donCu (DIEMMON1 … VOUCHER2).
   - Lượt 1 đỏ vì "Cannot find module './gia_lap/donCu'". Lượt 2 đỏ vì donCu ném lỗi thiếu export. Cả hai là thiếu hàm phụ,
     không phải hành vi.
   - Ca đổi theo hành vi không bao giờ chạy tới trên gốc vì bài sập trước: P3 H, I1–I6, I7; VOUCHER2 F5; UUDAI1 K4a / K4b.
     Bản thân cửa chặn thì có bằng chứng đỏ thật ở thu_BOMANCU1 (đỏ trên gốc, 18/18 BẮT).

4. client/src/pages/BanHang/tinh.js:111 — [K1, chú thích là khẳng định]
   - Chú thích "giữ vì thu_BH1 I1–I11 khoá": việc này đã bỏ I10 / I11. File nằm trong Phạm vi → sửa cùng lượt.
   - Nhẹ, cùng loại: ThanhKhach.jsx:3 còn nhắc CustomerSearch (file đã xoá).

5. Kế hoạch mục 4.1 hứa ca chưa làm — [K3 · lệch kế hoạch]
   - (a) "C2 đơn giao qua phiên (một ca)" trong thu_BOMANCU1: không có. C2 chỉ có bằng chứng từ ca cũ GIAO1 D9 (thu_GIAO1.js:357-369).
   - (b) "Mọi lối gọi taoDon — so BẰNG danh sách 6 chỗ": ca K1 chỉ đếm chữ taoDonGoc, không đếm lối gọi taoDon.
     Thêm một lối tạo đơn mới đi vòng taoDon thì không phép nào bắt.

NGHI NGỜ:
- Khách có ví mà chưa có hồ sơ pos_customers (K5, dữ liệu cũ):
  - Lần sửa cong_cu/gia_lap/kich_ban.js trong commit 23030445 thêm `INSERT pos_customers` vì PIN không đặt được nếu khách
    chưa có hồ sơ (pinKhach.js:34 → KHACH_KHONG_TON_TAI).
  - /wallets/topup (wallets.js:154-177) không đòi hồ sơ. Sau việc này, khách nạp ví mà chưa có hồ sơ KHÔNG trả bằng tài khoản
    ở quầy được: đường thẳng bị chặn, phiên cần PIN, PIN cần hồ sơ. Màn cũ trước đây cho trả.
  - Giả lập gặp đúng chỗ này và máy vá cho giả lập xanh, nhưng không ghi Phát hiện. Chưa đo production có bao nhiêu ví như vậy.
- Phiên tạo trước lúc triển khai có gói, khách đã chuyển khoản, chốt muộn / xác nhận tay sau → GOI_TAM_DUNG, tiền đã về mà không có đơn.
  Phiên quầy không vào ví: thanh-toan.js:207-216 ghi chua_khop. Khả năng gần 0 (kế hoạch mục 6).
- BV-GOI-TU-GOI bị bắt chỉ vì mã khác: không có vế đó, thân tự trả TU_GOI_NHUNG_THIEU_GOI.
  Vế `from_package` của cửa chặn thực chất trùng với khoá có sẵn trong thân; giữ được để thống nhất mã.
- SX hay hệ khác gọi POST /orders với ví / chuyển khoản: CHƯA KIỂM (kho SX không có ở đây).

NGHIỆM THU: 20/20 mục có bằng chứng (A1–A4, B1–B4, B4b, B5, C1–C7, D1–D3).
  - A1 ← thu_BOMANCU1 A1a–g; A2 ← A2a, b; A3 ← A3a–c + bảng grep ke_hoach mục 3.
  - A4 ← 978.980 → 916.573 byte (đã đo lại); `--day-du`: "dist đã commit KHỚP với src hiện tại".
  - B1 ← B1a–e; B2 ← B2a–c (còn lỗ CK âm — lỗi 1); B3 ← G1–G12 + ke_hoach mục 1; B4 ← bảng ke_hoach mục 2.
  - B4b ← dòng chayBaiThat (kiem_tra:520), ca K1, N1–N4.
  - B5 ← dot_bien.py tự chạy lại: đối chứng xanh 62 đạt, 18 BẮT · 0 SỐNG · 0 LẠC; caChan đếm 11 bảng.
  - C1 ← C1a–l; C2 ← GIAO1 D9 (yếu, xem lỗi 5a); C3 ← HOPDONG_KH, KHMUA1 xanh, cửa /api/kh, khachAuth, donApp, hợp đồng không đổi.
  - C4 ← MANKHACH1; C5 ← C5a–h; C6 ← C6 + DOISOAT1; C7 ← gia_lap/chay.js + thu_gia_lap xanh.
  - D1 ← bảng trang_thai + 28 dòng SỐ CA; D2 ← "fetch trần = 22" + đúng 1 dòng thêm; D3 ← thu_BOMANCU1 62 ca.
  Mục thiếu: không có (E là chủ quán thử tay).

CHƯA SOÁT ĐƯỢC:
- Chưa chạy `cong.js chay` (bước 11) và chưa soát bảo mật (bước 8b) — chưa tới bước.
- Chưa có lượt chạy chứng minh donCu (thân taoDonGoc) cho kết quả y như đường POST cũ ở khoảng 430 ca F.
  Thân không đổi dòng nào ngoài việc dời cổng (đã đọc diff orders.js), nên khả năng lệch thấp.
- Production: số ví chưa có hồ sơ; phiên có gói đang mở. Kho SX.

BÀI HỌC:
- KHOÁ: cổng A11 (tu_chay/cong.js) hiện chỉ coi "Cannot find module" của thư viện ngoài là không hợp lệ. Bài đỏ trên gốc vì thiếu
  hàm phụ CÙNG KHO (đường dẫn './…', hay hàm phụ tự ném lỗi "chưa có X") đang được tính là đỏ hợp lệ → đề xuất coi là không hợp lệ.
  Ngoài Phạm vi, khung đóng băng → ghi đề xuất.
- KHOÁ (trong Phạm vi): thu_BOMANCU1 thêm
  - ca B2d chuyển khoản âm + đột biến;
  - ca đếm lối gọi taoDon so BẰNG 6 chỗ;
  - ca C2 đơn giao qua phiên.
- NGUYÊN TẮC (K3, KHUON_LOI): bài cũ đổi sang hàm phụ "đi vòng" (donCu) thì phải đổi luôn tên ca nói về đường đã bị vòng qua.
  Bằng chứng đỏ phải có một lượt chạy thử hàm phụ trên gốc để chứng minh hai đường như nhau (ca F xanh, ca đổi đỏ).
- NGUYÊN TẮC (K5): giả lập phải vá dữ liệu mới chạy được một luồng thật (thêm hồ sơ khách để đặt PIN) → đó là tín hiệu luồng thật
  có thể bị chặn. Ghi Phát hiện, đừng chỉ vá giả lập.
```

## Vòng sửa 1 (theo soát vòng 1)
| Lỗi soát | Sửa | Bài thử / đột biến |
|---|---|---|
| 1 CK âm lọt đường thẳng | `server/routes/orders.js` cửa chặn: `(Number(b.transfer_amount) \|\| 0) !== 0` — CÙNG biểu thức với chỗ cộng tiền ở thân | `thu_BOMANCU1` B2d (CK −10.000), B2e (chuỗi "-10000") — ĐỎ trước khi vá (HTTP 200, đơn ghi), XANH sau; đột biến mới **VS-CK-CHI-DUONG** (đưa lại `> 0`) BẮT |
| 2 KHNAP1 / NAP1 tên ca nói "quầy" mà đi vòng donCu | làm ĐÚNG kế hoạch 4.3: hàm `goi` có cờ `thang` (quầy thật HTTP). KHNAP1 B2 (quầy thật, cờ tắt / bật → VI_PHAI_QUA_PIN), K5 (thẻ + CK đường thẳng → CK_PHAI_QUA_PAYOS; thêm thẻ + CK qua phiên xác nhận tay → 200), K5 (ví mẹ ngoài phiên → VI_PHAI_QUA_PIN; gói → GOI_TAM_DUNG); NAP1 B5 b5c (quầy thật → GOI_TAM_DUNG), K2 (quầy thật → VI_PHAI_QUA_PIN) + K2b (đơn cũ). Ca còn đi donCu đổi tên "thân taoDonGoc (đơn kiểu cũ)" (KHNAP1 B2, NAP1 B6). Rà K4: mọi nhãn "quầy" khác ở 22 bài là đơn tiền mặt đi HTTP thật | đỏ trên gốc đúng ca (bang_chung_do.txt lượt 3) |
| 3 bằng chứng đỏ ghi sai lý do | (a) **khoá trong donCu**: trước khi dựng, đưa ĐÚNG thân qua cửa chặn `taoDon` (đường thẳng) — phải bị từ chối bằng một mã chặn, không thì ném lỗi; (b) `bang_chung_do.txt` viết lại: lượt A11, lượt tương đương (donCu = taoDon gốc, chưa khoá → 17 bài XANH trọn trên gốc: ca F như đường cũ), lượt hành vi (có khoá → mọi bài dùng donCu ĐỎ vì "đường thẳng KHÔNG chặn thân này"; ca đổi hành vi đỏ đúng ca) | — |
| 4 chú thích | `BanHang/tinh.js` (I1–I9 + KHACHCK1 D2), `BanHang/ThanhKhach.jsx:3` (bỏ nhắc CustomerSearch); build lại — `dist` không đổi (chú thích bị lược khi build) | `--day-du` khớp băm |
| 5a C2 chưa có ca | `thu_BOMANCU1` C2: đơn giao qua phiên tiền mặt (báo phí gieo đúng khuôn bảng) → 200, tổng = tinh-thu, chuyến ghi đúng báo phí | — |
| 5b chưa đếm lối gọi taoDon | `thu_BOMANCU1` K2: lời gọi `taoDon(` ở server/ so BẰNG 6 chỗ (orders 2, giuCho 2, donApp 1, manKhach 1) | VS-GOI-THANG-LOI-GOC vẫn BẮT (K1) |

Đính chính bảng "Bài cũ đổi" ở trên: KHNAP1, NAP1 KHÔNG còn "ca giữ nguyên" — xem dòng lỗi 2.

Phát hiện thêm (NGHI NGỜ của soát vòng 1 — dữ liệu cũ, LUAT §6.6: ghi, không dừng hỏi):
- Khách CÓ VÍ mà CHƯA có hồ sơ `pos_customers` (nạp qua `/wallets/topup` không đòi hồ sơ) KHÔNG trả bằng tài khoản ở quầy được nữa:
  đường thẳng chặn, phiên cần PIN, đặt PIN cần hồ sơ (`server/utils/pinKhach.js:34` → KHACH_KHONG_TON_TAI). Giả lập gặp đúng chỗ này
  (KB31 / KB32, commit `23030445` thêm hồ sơ trước khi đặt PIN). Chưa đo production có bao nhiêu ví như vậy. Đề xuất: chủ quán / chat
  kiểm `SELECT COUNT(*) FROM pos_wallets w LEFT JOIN pos_customers c ON c.phone = w.phone WHERE c.phone IS NULL AND w.balance > 0` trên quầy thật;
  có thì tạo hồ sơ cho các ví đó (việc sau) — màn mới vốn đã đòi PIN từ trước việc này.
- Phiên tạo TRƯỚC lúc triển khai có gói, khách đã chuyển khoản, chốt muộn / xác nhận tay → GOI_TAM_DUNG, tiền về không có đơn (phiên quầy
  ghi chua_khop, `server/routes/thanh-toan.js:207-216`). Khả năng gần 0 (phiên sống 10 phút; gói đã kết thúc hết). Triển khai lúc quầy vắng.

## Soát độc lập — vòng 2 (agent độc lập mới) — chép nguyên văn
```
KHÔNG ĐẠT

KIỂM LẠI 5 LỖI VÒNG 1
1. CK âm — vá ĐÚNG với số âm và chuỗi số. Có ca B2d, B2e; VS-CK-CHI-DUONG BẮT (đã chạy). Nhưng chưa đủ, xem lỗi 1 dưới.
2. KHNAP1 / NAP1 — đã sửa: cờ `thang` (thu_KHNAP1.js:129-134, thu_NAP1.js:102-105), ca quầy thật chờ đúng mã mới, ca còn đi donCu đã đổi
   tên "thân taoDonGoc", lượt 2 trong bằng chứng cho thấy các ca này đỏ trên gốc. Nhưng câu rà K4 trong trang_thai sai, xem lỗi 2.
3. Bằng chứng đỏ — đã viết lại ba lượt; khoá nằm ở donCu.js:28-34. Còn một câu không chính xác, xem lỗi 3.
4. Chú thích — tinh.js:111 nay đúng (thu_BH1.js:151 I1–I9, thu_KHACHCK1.js:268 D2). ThanhKhach.jsx:3 đã bỏ nhắc CustomerSearch.
5. C2 và K2 — đã có (thu_BOMANCU1 C2; K2 ở các dòng 163-170).

LỖI TÌM ĐƯỢC
1. NẶNG (tiền / đối soát) — server/routes/orders.js:197-198 — K4 (cổng không cùng biểu thức với MỌI chỗ dùng) + K1 (chú thích sai).
   - Cửa chặn `(Number(b.transfer_amount) || 0) !== 0` chỉ cùng biểu thức với chỗ CỘNG tiền (:1003). Chỗ GHI cột dùng `transfer_amount || 0` (:1105).
   - Đo (đường thẳng, cash_amount 25.000, món 25.000): `transfer_amount: "100000abc"` → 200, cột lưu TEXT "100000abc"; SUM(transfer_amount)
     (khuôn reports.js:37/130/145) = 100000; Đối soát kiểu doiSoat.js:158 (cash + ck) = 350.000 trong khi két thật 250.000. "abc", " " cũng lọt
     (lưu text, cộng ra 0).
   - Chú thích :197 "… chuỗi số cũng là CK" khẳng định đã đóng — không đúng với chỗ ghi. Có từ trước việc này, nhưng phiếu B2 hứa chặn.
   - Cách sửa: `Number(b.transfer_amount || 0) !== 0` (NaN cũng bị chặn). Ca B2f "100000abc" → 400 CK_PHAI_QUA_PAYOS, không ghi gì; đột biến
     đưa lại biểu thức vòng 1 → BẮT. Cùng khuôn ghi Phát hiện: `cash_amount || 0` ở :1105 so với `Number(cash) || 0` ở :1002 (chỉ lọt khi đơn 0đ).
2. NHẸ — tên ca nói "quầy" nhưng đi vòng donCu (K3 + K1): thu_GOI1.js:254 (A2d), :269 (A2d2), thu_P26c.js:226 (A2c). Câu trang_thai.md:218
   "Rà K4: mọi nhãn 'quầy' khác ở 22 bài là đơn tiền mặt đi HTTP thật" vì thế sai. Sửa: tên "thân taoDonGoc (gói cũ) — hai lệnh cùng lúc".
3. NHẸ — số liệu cũ sau vòng sửa (K1): trang_thai.md:95 "18 đột biến · 62 đạt" (nay 19 / 66); :99 PASS 126 trên HEAD a68fee1b, chưa chạy lại
   sau vòng sửa; bang_chung_do.txt:14 "(gốc nhận ví / CK / nợ / gói ở đường thẳng)" không đúng với 5 bài — gốc TỪ CHỐI bằng mã khác
   (THE_KHONG_TRA_VI, NAP_CHI_TIEN_MAT_QR, SO_DU_KHONG_DU, TRA_KET_HOP, KHONG_PHAI_TK_ME); bài vẫn đỏ đúng lý do, chỉ câu tóm tắt sai.
4. NHẸ — mã chết (đơn giản / LUAT §3): client/src/pages/BanHang/tinh.js:111-116 `dungDonHang` dựng thân POST /orders có CK / ví — máy chủ nay
   từ chối, không màn nào gọi; vẫn bị thu_BH1 I1–I9 và KHACHCK1 D2 khoá (I3, I5 khoá cả thân CK / ví). Gọn hơn: xoá hàm cùng các ca đó ngay.

NGHI NGỜ
- Huỷ / hoàn đơn có `transfer_amount` dạng text: hoanVi (orders.js:1687) `Number(order.transfer_amount || 0)` = NaN vào soTienHoan — chưa chạy được.
- K2 (thu_BOMANCU1.js:167): mẫu `(?<![\w.])taoDon\s*\(` bỏ qua `x.taoDon(` — lối mới `orders.taoDon(req, res, {…})` với phien khác null bỏ qua
  vế tiền mà K2 không đếm. Hôm nay không có (một INSERT pos_orders orders.js:1087; taoDonGoc bị K1 khoá).
- `vet()`: hàm `so` trả −1 khi câu đọc lỗi → "không ghi gì" có thể đúng suông (hôm nay 10 bảng đều có); `vet` chưa đếm kho (pos_stock_pending)
  trong khi B1 hứa "không ghi … kho".
- Lượt 2 (tương đương) không tái lập được bằng công cụ ở HEAD (donCu nay luôn có khoá). Lượt 3 đỏ chủ yếu dạng "bài sập" do khoá donCu ném —
  chấp nhận làm bằng chứng đỏ, không phải dạng BẮT.
- gia_lap/kich_ban.js `TRUONG_DON` chép danh sách trắng của giuCho → hai nguồn (chỉ phía bài thử).
- Khách có ví chưa có hồ sơ không trả bằng tài khoản ở quầy được (pinKhach.js:33); `/wallets/topup` vẫn tạo được ví như vậy → không chỉ dữ liệu cũ.
- `payment_method` lạ ("qr") vẫn lọt đường thẳng, ghi nguyên chữ (200, tiền đúng cột tiền mặt) — đã ghi Phát hiện.

K5: phiên giữ / chốt, webhook QR, xác nhận tay, đơn giao, thẻ hạng, nạp không bị chặn oan (C1a–l, C2; P3 101; KHNAP1 65; NAP1 90); donApp,
manKhach không gửi trường gói; màn mới gửi from_package false / package_buy null / customer_package_id null (falsy); transfer_amount null / ""
/ "0" / 0 → 200; đơn cũ huỷ / hoàn / thu nợ C5a–h, C6 xanh. Không thấy luồng hợp lệ bị chặn oan.
Đường tiền: ngoài lỗi 1, balance :194 ~ :912/:928, parent :194 ~ :950, debt :201 ~ :978; không tin payment_status máy khách.

NGHIỆM THU: 19/20 · thiếu B2 (lỗ chuyển khoản dạng chuỗi chữ, chưa có ca).
CHƯA SOÁT ĐƯỢC: chưa chạy hết 19 đột biến (chạy 3); chưa chạy cong.js chay; chưa chạy kịch bản huỷ đơn có cột CK text; production; kho SX.
BÀI HỌC:
- KHOÁ: ca B2f transfer_amount chuỗi chữ + đột biến đưa lại biểu thức vòng 1; thêm kho vào `vet`; `so()` trong `vet` ném thay vì −1.
- NGUYÊN TẮC (K4): "cổng cùng biểu thức với chỗ dùng" = MỌI chỗ dùng (cộng, GHI cột, hoàn); SQLite giữ chuỗi lạ, SUM đọc phần số đầu chuỗi —
  cổng tiền nên chuẩn hoá MỘT lần, thân dùng giá trị đã chuẩn hoá.
- NGUYÊN TẮC (K3 / K1): câu "đã rà K4" phải kèm lệnh grep + số chỗ; không có lệnh là câu đoán.
```

## Vòng sửa 2 (theo soát vòng 2)
| Lỗi soát | Sửa | Bài thử / đột biến |
|---|---|---|
| 1 NẶNG — CK chuỗi chữ "100000abc" lọt (cột ghi chữ, SUM báo cáo đọc 100.000) | cửa chặn `Number(b.transfer_amount \|\| 0) !== 0` (NaN cũng chặn; phủ cả chỗ cộng `Number(x) \|\| 0` lẫn chỗ ghi `x \|\| 0`); `laDonCu` cùng biểu thức | `thu_BOMANCU1` B2f — ĐỎ trước khi vá (HTTP 200, đơn ghi), XANH sau; đột biến **VS-CK-BO-NAN** (đưa lại biểu thức vòng 1) BẮT |
| 2 nhãn "quầy" đi vòng donCu | đổi tên: GOI1 A2d / A2d2, P26c A2c, NAP1 C10 → "thân taoDonGoc (gói cũ / đơn kiểu cũ) — hai lệnh". Rà K4 bằng lệnh: `grep -n "k(\`\?'[^']*quầy"` trên 22 bài dùng donCu → **49 nhãn**; xem thân từng nhãn: 45 nói về việc khác (cấp mã, PIN, huỷ, phiên, giao, hoá đơn, tiền mặt HTTP), 4 nhãn đã đổi trên; VIME1 C3 "hai quầy cùng giữ ví" đi PHIÊN thật (HTTP) — đúng | — |
| 3 số liệu cũ | cập nhật dòng đột biến (20 · BẮT 20, đối chứng 67) và dòng npm test (chạy lại sau vòng sửa 2); `bang_chung_do.txt` câu tóm tắt lượt 3 sửa đúng (gốc nhận HOẶC từ chối bằng mã khác của thân) | — |
| 4 mã chết `dungDonHang` | xoá khỏi `client/src/pages/BanHang/tinh.js`; `thu_BH1` phần I chuyển sang khoá `thanTinhThu` (thân màn thật gửi: không trường tiền, không gói / thẻ, không chiết khấu riêng, mã chữ hoa) + **I10** không còn dungDonHang; `thu_KHACHCK1` D2 khoá thanTinhThu. Build lại: gói JS không đổi (hàm không ai gọi vốn đã bị lược khi build) | BH1 69 · KHACHCK1 36 xanh |
| NGHI NGỜ `vet` / K2 | `vet` đếm thêm `pos_stock_pending` (kho chờ) và câu đọc hỏng thì NÉM (không −1); K2 mẫu `(?<!\w)taoDon\s*\(` đếm cả `x.taoDon(` | — |

Chưa làm (NHẸ / ngoài lời hứa phiếu, ghi Phát hiện):
- `cash_amount || 0` ở chỗ ghi cột (orders.js thân) so với `Number(cash) || 0` ở chỗ cộng — chuỗi lạ chỉ lọt khi đơn 0đ; tiền mặt là trường được phép;
  chuẩn hoá cột tiền MỘT lần ở thân là việc sau (ngoài vùng phiếu cho sửa). `transfer_amount: " "` (khoảng trắng) vẫn qua cửa (= 0) và ghi " " vào
  cột — cộng ra 0, không lệch tiền.
- `cong_cu/gia_lap/kich_ban.js` `TRUONG_DON` chép danh sách trắng của giuCho.js (chỉ phía bài thử) — lệch thì giả lập đỏ, không ảnh hưởng quầy.

Số hiện tại (HEAD `2f591a6a` + trang thái): `npm test -- --day-du` PASS 126 · FAIL 0 · CẢNH BÁO 1; đột biến 20 · BẮT 20 (đối chứng 67 đạt);
bằng chứng đỏ 28/28 bài (lượt A11 + lượt hành vi), 28 dòng SỐ CA mới (`bang_chung_do.txt`).

## Soát độc lập — vòng 3 (agent độc lập mới) — chép nguyên văn (rút gọn phần nghiệm thu đã khớp)
```
KHÔNG ĐẠT, nhưng chỉ còn lỗi NHẸ: không đụng tiền / điểm / ví / bảo mật, không có file nằm ngoài Phạm vi hoặc Cấm. Theo LUAT_XAY_APP §6.5,
việc này đủ điều kiện làm vòng sửa 4 ngay trong phiếu, không cần hỏi chủ quán.

KIỂM LẠI 4 LỖI VÒNG 2: 1 (CK chuỗi chữ) sửa đúng — orders.js:199 `Number(b.transfer_amount || 0) !== 0 || …`, B2f có, VS-CK-BO-NAN BẮT, laDonCu
cùng biểu thức; `transfer_amount: " "` = 0 qua cửa, ghi " " vô hại, đã ghi Phát hiện. 2 (nhãn "quầy") đã đổi, grep lại không còn nhãn nói sai đường.
3 (số liệu) khớp lần chạy lại (20 · BẮT 20 · đối chứng 67; PASS 126). 4 (dungDonHang) đã xoá, grep client/src 0 chỗ; BH1 phần I khoá thanTinhThu,
I10; KHACHCK1 D2 khoá thanTinhThu; gói JS 916.573 byte không đổi. NGHI NGỜ vòng 2: vet dùng soCh ném + đếm pos_stock_pending; K2 bắt x.taoDon(.

LỖI TÌM ĐƯỢC:
1. client/src/pages/BanHang/ThanhKhach.jsx:35 — chú thích còn "(như CustomerSearch)", file đã xoá (vòng sửa 1 chỉ sửa dòng 3). K4 + K1. NHẸ.
2. cong_cu/thu_BOMANCU1.js:309-314 (K2) — khoá "đúng 6 lời gọi taoDon" KHÔNG có đột biến trong dot_bien.py. K3. NHẸ. Thử tạm: thêm
   router.post("/x", … taoDon(req, res, {})) → BẮT (✗ K2); `const tdx = taoDon;` rồi gọi tdx(...) → SỐNG. Hôm nay không có lối như vậy; phien giả
   không có vaoGiaoDich ném ở orders.js:1050 → 500, không ghi đơn. Đề xuất: đột biến "thêm lối trực tiếp" + ghi giới hạn "không theo bí danh".
3. trang_thai.md mục Phát hiện — "orders.js:369 (Sales.jsx:77), :782 (Sales.jsx:29)" nay là :371 và :784. K1. NHẸ.
4. bang_chung_do.txt:11-12 — "vòng sửa 2 chỉ đổi NHÃN ca …" chưa đủ: vòng sửa 2 còn đổi vị từ laDonCu (donCu.js:16, 0bd127ee). Thân thử của
   17 bài không có CK chuỗi chữ → khả năng đổi kết quả thấp, nhưng câu không có lượt chạy lại làm căn cứ. K1. NHẸ.
5. cong_cu/thu_BH1.js:11 — đầu bài vẫn "từng khoá payload đơn (I1–I9)"; phần I nay I1, I2, I7–I10 và các tên DÙNG LẠI cho nghĩa mới. K1 / K3. NHẸ.
6. Đơn giản (gợi ý, NHẸ) — donCu.js:15-17 laDonCu là bản chép thứ hai của vị từ cửa chặn (orders.js:190-204); gọn hơn: hàm phụ gửi qua taoDon,
   trả mã trong MA_CHAN thì dựng bằng taoDonGoc → bỏ laDonCu. Cùng dạng: kich_ban.js:20 TRUONG_DON (đã ghi Phát hiện).

NGHI NGỜ: cash_amount ghi nguyên chuỗi (orders.js:1106) vs cộng Number (:1003) — chỉ lọt khi đơn 0đ; payment_method chữ tự do; cash_received /
change_amount ghi thô (chỉ in hoá đơn) — đều có từ trước, đã ghi Phát hiện. vet không đếm pos_registrations / pos_signup_codes / pos_hoan_tien_mat /
nhật ký đơn (cửa chặn đứng trước mọi đọc / ghi — rủi ro thấp). Khách có ví chưa có hồ sơ (pinKhach.js:34). client/src/utils/inPhieu.js:8 mô tả
câu trả "vừa tạo (POST /orders)" — chưa đọc kỹ.
NGHIỆM THU: 20/20 mục có bằng chứng (gồm B4b). Mục thiếu: không có.
CHƯA SOÁT ĐƯỢC: cong.js chay; lượt 2 (tương đương) với laDonCu mới; production; kho SX; đột biến bí danh K2 chỉ chạy tạm.
BÀI HỌC:
- KHOÁ: mọi phép quét tĩnh (K1, K2) phải có ít nhất một đột biến "thêm lối mới"; ghi cạnh phép giới hạn "không theo bí danh / gọi gián tiếp".
- KHOÁ (gợi ý): vị từ "thân nào cửa chặn từ chối" về MỘT nguồn — hàm phụ hỏi thẳng taoDon thay vì chép (laDonCu).
- NGUYÊN TẮC (K4): sửa chú thích người soát chỉ ở file X thì grep CẢ file X (ThanhKhach.jsx:3 sửa, :35 sót).
- NGUYÊN TẮC (K1): bằng chứng ở HEAD cũ mà ghi "vòng sau chỉ đổi Y" thì liệt kê theo `git diff --stat` giữa hai HEAD; bỏ ca thì không dùng lại tên.
```

## Vòng sửa 4 (theo soát vòng 3 — chỉ lỗi NHẸ, LUAT §6.5: máy làm luôn, không gọi agent soát nữa)
| Lỗi | Sửa |
|---|---|
| 1 ThanhKhach.jsx:35 "(như CustomerSearch)" | sửa chú thích (grep CẢ file: không còn chỗ nào nhắc CustomerSearch / Sales); build lại — `dist` không đổi |
| 2 K2 chưa có đột biến | ghi cạnh phép K2 giới hạn "quét chữ, không theo bí danh / gọi gián tiếp"; đột biến **VS-THEM-LOI-TAO-DON** (thêm `router.post("/x", … taoDon(req, res, {}))`) → BẮT ✗ K2 |
| 3 số dòng Phát hiện | orders.js `:369/:782` → `:371/:784` |
| 4 câu bằng chứng lượt 2 | ghi theo `git diff --stat 97af129f 2f591a6a -- cong_cu` (7 file — gồm donCu.js: khoá + laDonCu); lượt 2 không chạy lại với laDonCu mới → CHƯA KIỂM |
| 5 tên ca BH1 dùng lại | phần I đổi tên TM1–TM6 (không dùng lại I1–I11 cũ); đầu bài sửa |
| 6 gợi ý bỏ laDonCu (hỏi thẳng taoDon) | KHÔNG làm trong việc này: phải đổi hàm gọi máy chủ của 22 bài sang bất đồng bộ dò trước — rủi ro lớn hơn lợi; khoá trong donCu đã bắt mọi lệch giữa laDonCu và cửa chặn theo một chiều (thân laDonCu đưa vào donCu mà cửa không chặn → ném). Ghi Phát hiện / đề xuất việc sau |

Kiểm sau vòng sửa 4 (HEAD `bbe41245`): `npm test -- --day-du` PASS 126 · FAIL 0 · CẢNH BÁO 1; đột biến ĐỐI CHỨNG XANH 67 đạt · TỔNG 21 · BẮT 21 · SỐNG 0 ·
HỎNG 0 · LẠC 0; `thu_BH1` trên cây gốc 28b6efeb vẫn ĐỎ (thoát 1, "thiếu hàm docKieu"…), trên HEAD 69 đạt (SỐ CA không đổi); `thu_BOMANCU1` 67 (không đổi).
SOÁT LẦN CUỐI: chat soát thay

## Soát bảo mật
Lời nhắc /soat-bao-mat (bản Anthropic security-review + "Tiền lệ của kho này"), một subagent độc lập chỉ đọc, mốc d52b9fb^..HEAD (`bbe41245` + hồ sơ).
Số lỗ hổng trước lọc: 0 · sau lọc: 0 (không có gì để lọc — bước 3 không cần). Báo cáo nguyên văn:

```
Không tìm thấy lỗ hổng nào (không có phát hiện nào đạt ngưỡng tin cậy từ 7/10 trở lên).

Phạm vi đã đọc trong lượt này: `git diff d52b9fb^ HEAD` cho server/routes/orders.js, client/src/utils/api.js, client/src/pages/BanHang/{index.jsx,
tinh.js, BanHangMoi.jsx, ThanhKhach.jsx, banHang.css}, các file chỉ đổi chú thích (InPhieu.jsx, InvoicePrint.jsx, QrScanModal.jsx, InvoiceSettings.jsx)
và cong_cu/gia_lap/donCu.js. Bước này không chạy thử khai thác.

Lý do kết luận:
1. Máy chủ (server/routes/orders.js:182-207). Cửa chặn mới `taoDon` chỉ thêm việc chặn. Nó không mở thêm đường nào.
   - Gói (`package_buy`, `customer_package_id`, `items[].from_package`) bị trả 400 `GOI_TAM_DUNG` ở mọi lối gọi.
   - Riêng lối POST /orders gọi thẳng (`phien` null), các cách trả sau đều bị chặn vô điều kiện: trừ ví khách, trừ ví mẹ, `payment_method` "balance",
     chuyển khoản, ghi nợ, "cho_thu".
   - Bản cũ chỉ chặn ví và chuyển khoản khi cài đặt `thanh_toan_payos_bat_buoc` = '1'; bản gốc chạy cổng này ở các dòng 252-260 cũ. Bản mới chạy
     luôn, nên chặt hơn.
   - Các vị từ ở cửa chặn khớp với chỗ thân hàm dùng: `balance_amount > 0` ở dòng 929, `parent_balance_amount > 0` ở dòng 951,
     `payment_method === "balance"` ở dòng 913, `debt_amount > 0` ở dòng 979. Toán tử `>` của JS ép kiểu sang số giống `Number()`, nên chuỗi số hay
     mảng không lọt qua cửa mà lại trừ tiền ở thân.
   - Cổng chuyển khoản dùng `Number(x || 0) !== 0`, chặn được cả số âm lẫn chuỗi chữ.
2. Hàm `taoDonGoc` mới được xuất ra (orders.js:2075). Grep thấy trong `server/` không có route nào gọi nó. Route POST / (dòng 1461), tinh-thu
   (dòng 1517), giuCho.js, donApp.js và manKhach.js đều vẫn gọi `taoDon`, tức là vẫn đi qua cửa chặn. Chỉ có hàm phụ của bài thử
   (cong_cu/gia_lap/donCu.js) gọi thẳng `taoDonGoc`, chạy trong cùng tiến trình và không có đường HTTP nào tới được.
3. Quầy (client/src). Chủ yếu là xoá: bỏ Sales.jsx, CustomerSearch.jsx, `ordersApi.create` và `dungDonHang`, bỏ công tắc màn cũ/màn mới qua `?man=` và
   localStorage. Phần còn lại là đổi chú thích và đổi tên prop. Không có `dangerouslySetInnerHTML`, `innerHTML`, `eval`, cũng không thêm `fetch` trần.
   localStorage giờ chỉ lưu kiểu bố cục và chỉ nhận giá trị trong danh sách trắng `KIEU_MAN`.
4. Phần còn lại là bài thử trong cong_cu/** và hồ sơ trong viec/**, thuộc diện loại trừ: chỉ phục vụ chạy bài thử, hoặc là tài liệu.
```

SOÁT BẢO MẬT: ĐẠT

## Nghiệm thu — đếm từng mục (20 / 20 có bằng chứng; E là chủ quán thử tay)
| Mục | Bằng chứng |
|---|---|
| A1 | `thu_BOMANCU1` A1a–A1g (dựng thật `BanHang/index.jsx`: kho trống / "tắt" cũ / `?man=cu` / `?man=moi` / kho bị chặn / kiểu lạ / nhớ kiểu); đột biến VS-MAN-THEO-KHO-CU, VS-MAN-CU-QUERY, BV-KIEU-KHONG-NHO BẮT |
| A2 | A2a (chữ bảng ⚙), A2b (grep client/src: man=cu · man=moi · Sales · "màn cũ" · công tắc cũ = 0, trừ câu Layout.jsx đã duyệt); BV-NUT-TAT BẮT |
| A3 | A3a–A3c (xoá Sales.jsx + CustomerSearch.jsx, `ordersApi.create` mất, không ai import); BV-API-CREATE BẮT; kế hoạch mục 3 bảng grep |
| A4 | build: 978.980 → 916.573 byte; `--day-du` "dist đã commit KHỚP với src hiện tại" |
| B1 | B1a–B1e, B5 (hai quầy cùng bấm); BV-VI-THANG, BV-VI-ME-THANG, BV-BALANCE-NHAN, VS-CAI-DAT-CON BẮT |
| B2 | B2a–B2f (gồm CK âm, chuỗi số, chuỗi chữ); BV-CK-THANG, BV-CK-NHAN, VS-CK-CHI-DUONG, VS-CK-BO-NAN BẮT |
| B3 | G1–G12 (đường thẳng, tinh-thu, phiên tiền mặt / QR, chốt phiên cũ, `package_buy: {}`, gia hạn); BV-GOI-MUA, BV-GOI-MA, BV-GOI-TU-GOI, VS-GOI-CHI-THANG BẮT; kế hoạch mục 1 (7 lối vào) |
| B4 | kế hoạch mục 2 bảng (a) 22 · (b) 26 · (c) 38 bài → chọn (a) |
| B4b | câu 1 Phạm vi 7 file (sửa được, người gác cho); câu 2 dòng `chayBaiThat` (kiem_tra:520); câu 3 InvoiceSettings chỉ chú thích; câu 4 K1 + VS-GOI-THANG-LOI-GOC + K2 + VS-THEM-LOI-TAO-DON; câu 5 N1–N4 + BV-GHI-NO-THANG, VS-GHI-NO-CHI-SO |
| B5 | `dot_bien.py`: đối chứng XANH 67 · 21 đột biến · BẮT 21; mỗi ca chặn so `code` + dấu vết 12 bảng (`vet`, câu đọc hỏng thì ném) |
| C1 | C1a–C1l (tiền mặt, phiên tiền mặt / tài khoản + PIN / mẹ + PIN / tách / CK tay / QR webhook, thẻ hạng, nạp, mã, voucher, hạng, Giờ vàng) |
| C2 | C2 (đơn giao qua phiên) + `thu_GIAO1` / `thu_GIAO2` xanh |
| C3 | `thu_HOPDONG_KH`, `thu_KHMUA1`, `thu_KHAPI2`, `thu_KHNAP1`, `thu_KHTHE1` xanh trong `--day-du`; `git diff 28b6efeb HEAD -- server/routes/kh server/middleware/khachAuth.js HOP_DONG_API_KH.md HOP_DONG_API_ND.md` = 0 |
| C4 | `thu_MANKHACH1` xanh; `server/utils/manKhach.js` không đổi |
| C5 | C5a–C5h (đơn cũ ví một phần / mẹ / CK / lấy gói / mua gói / nợ: xem, huỷ, hoàn, thu nợ) + HUY1, P26b, P26c, GOI1, P20 xanh |
| C6 | C6 (kết thúc gói cũ → Báo cáo vẫn xem) + DOISOAT1 xanh |
| C7 | `gia_lap/chay.js` 33 kịch bản · 18 bất biến · ĐẠT; `thu_gia_lap` 180 đạt |
| D1 | bảng "Bài cũ đổi" + vòng sửa; 28 dòng `SỐ CA`; bằng chứng đỏ 28/28 (`bang_chung_do.txt`) |
| D2 | `NGUONG_FETCH` 31 → 22 (bộ kiểm đo "fetch trần = 22"); dòng `chayBaiThat`; không đụng phép khác |
| D3 | `thu_BOMANCU1` 67 ca phủ A1–A3, B1–B5 |

## Báo cáo 7 mục
```
VIỆC:        BO-MAN-CU-1 — Bỏ màn Bán hàng cũ, quầy chỉ còn màn mới · khoá đường tạo đơn thẳng · tạm ngưng gói
ĐÃ SỬA:      server/routes/orders.js:182-207 — `taoDon` thành cửa chặn: gói (mua / lấy / gia hạn) mọi lối → GOI_TAM_DUNG; đường thẳng (phien null)
               trừ ví khách / mẹ → VI_PHAI_QUA_PIN, chuyển khoản (mọi giá trị khác rỗng / 0) → CK_PHAI_QUA_PAYOS, ghi nợ / chờ thu → KHONG_GHI_NO;
               bỏ cờ thanh_toan_payos_bat_buoc; thân cũ → `taoDonGoc` (không đổi), export cuối file
             client/src/pages/BanHang/index.jsx — luôn BanHangMoi, chỉ nhớ kiểu; tinh.js docKieu/ghiKieu, xoá docCongTac/ghiCongTac/dungDonHang;
               BanHangMoi.jsx bảng ⚙ "Kiểu màn bán hàng (máy này)", bỏ nút về màn cũ; xoá pages/Sales.jsx, components/CustomerSearch.jsx;
               utils/api.js bỏ ordersApi.create; chú thích (ThanhKhach, banHang.css, QrScanModal, InPhieu, InvoicePrint, InvoiceSettings:745); dist build lại
             kiem_tra_truoc_khi_giao.js — NGUONG_FETCH 31 → 22; chayBaiThat thu_BOMANCU1
             cong_cu/thu_BOMANCU1.js (mới, 67 ca), cong_cu/gia_lap/donCu.js (mới), 27 bài cũ + gia_lap/kich_ban.js đổi; xoá cong_cu/do_chuathu.js
BÀI THỬ:     chạy trên bản chưa vá (cây 28b6efeb) → ĐỎ 28/28 bài (bang_chung_do.txt: lượt A11, lượt tương đương, lượt hành vi); thu_BOMANCU1 gốc
               15 đạt · 33 hỏng ở A1–A3, B1–B3, K; sau khi vá → XANH (npm test -- --day-du PASS 126 · FAIL 0 · CẢNH BÁO 1); đột biến 21 · BẮT 21
ĐÃ RÀ K4:    grep `taoDon(` ở server/ → 6 lời gọi (orders 2, giuCho 2, donApp 1, manKhach 1), tất cả qua cửa chặn (khoá K2); `taoDonGoc` → 3 dòng
               chỉ orders.js (khoá K1); grep `Sales|CustomerSearch|màn cũ|man=cu|man=moi|docCongTac|ghiCongTac|dungDonHang` ở client/src → 0
               (trừ Layout.jsx:69 đã duyệt); grep nhãn ca "quầy" ở 22 bài donCu → 49 nhãn, 5 đổi tên, còn lại đúng đường; vế tiền cửa chặn so với
               chỗ cộng / chỗ ghi ở thân: balance :929, parent :951, debt :979, transfer :1004/:1106 (đã khớp sau 2 vòng)
CHƯA KIỂM:   - quầy thật / điện thoại (E1–E3 là chủ quán thử tay); Render + Turso thật;
             - production: số ví có số dư mà chưa có hồ sơ pos_customers (không trả bằng tài khoản ở quầy được — Phát hiện); phiên có gói đang mở lúc triển khai;
             - kho SX / hệ khác gọi POST /orders với ví / CK (kho SX không có ở máy này);
             - lượt "tương đương" (donCu = taoDon gốc) chỉ chạy ở HEAD 97af129f — không chạy lại sau khi đổi laDonCu (vòng sửa 2);
             - huỷ / hoàn đơn CŨ có cột transfer_amount dạng chữ (nếu dữ liệu cũ có) — chưa dựng được ca;
             - K2 quét chữ, không theo bí danh (`const x = taoDon`).
GIT:         (dòng thật ở dưới, sau commit cuối)
BÀI HỌC:     KHOÁ 3 · NGUYÊN TẮC 4 · BỎ 2 — chi tiết ở ## Bài học
```

## Bài học
Sự cố của việc: soát độc lập 3 vòng (vòng 1: 5 lỗi gồm CK âm lọt; vòng 2: CK chuỗi chữ lọt — NẶNG; vòng 3: 5 lỗi nhẹ → vòng sửa 4); bài mới viết sai 3
lần (stub CJS, hạng + flash, chờ sai HUY-1) — truy nguyên trước; giả lập phải thêm hồ sơ khách để đặt PIN; commit 68ae0d80 gộp nhầm 3 file `git rm`;
người gác chặn lệnh nhiều lần (B-CHUONGTRINH: `for`/`until`; B-PHANTICH: lệnh chạy script ghép `&&` hoặc `$'…'`; B-CD-VITRI; B-BIMAT-CHU: chạy / grep
file có chữ khoá mà chưa commit) — đọc lý do và làm đúng dạng; kho nông làm thu_BH2 G1 đỏ oan (tự `--unshallow`).

KHOÁ (3):
1. (đã làm, trong Phạm vi) `donCu` có khoá: chỉ dựng đơn cũ cho thân mà cửa chặn đường thẳng từ chối bằng mã chặn → bài thử không bao giờ đi vòng
   một đơn quầy vẫn nhận; trên gốc mọi bài dùng donCu đỏ đúng lý do. Lý do: vòng 1 chỉ ra 21 bài đỏ trên gốc vì THIẾU FILE.
2. (đã làm) ca B2d / B2e / B2f + VS-CK-CHI-DUONG / VS-CK-BO-NAN; K2 + VS-THEM-LOI-TAO-DON. Lý do: hai vòng soát liên tiếp tìm lỗ CK.
3. (đề xuất, ngoài Phạm vi — khung đóng băng) `tu_chay/cong.js` A11: bài đỏ trên gốc vì "Cannot find module './…'" (hàm phụ CÙNG KHO mới thêm)
   KHÔNG tính là đỏ hợp lệ (hôm nay regex chỉ loại thư viện ngoài). Ca đỏ: chạy một thu_*.js chỉ `require('./gia_lap/x')` chưa có ở gốc → cổng phải báo A11.
NGUYÊN TẮC (4) — đề xuất thêm vào KHUON_LOI.md (ngoài Phạm vi việc này):
1. K4 · Đã gây: cửa chặn CK `> 0` (vòng 1) rồi `(Number(x) || 0) !== 0` (vòng 2) — khớp chỗ CỘNG nhưng chỗ GHI cột dùng `x || 0`, SQLite giữ chuỗi,
   SUM báo cáo đọc phần số. Dấu hiệu: cổng tiền viết lại biểu thức của một chỗ dùng. Chặn: cổng khớp MỌI chỗ dùng (cộng, ghi cột, hoàn) — liệt kê
   từng dòng; tốt nhất chuẩn hoá MỘT lần rồi thân dùng giá trị đã chuẩn hoá.
2. K3 · Đã gây: 21 bài cũ đổi sang hàm phụ đi vòng (donCu) đỏ trên gốc chỉ vì thiếu file; tên ca vẫn nói "quầy". Chặn: bài đổi sang hàm phụ thì đổi
   luôn tên ca nói về đường bị vòng qua; bằng chứng đỏ thêm lượt "tương đương" (hàm phụ = đường cũ trên gốc → ca F xanh, chỉ ca đổi hành vi đỏ).
3. K5 · Đã gây: giả lập phải tự thêm hồ sơ khách mới đặt được PIN → lộ ra khách có ví mà chưa có hồ sơ không trả bằng tài khoản ở quầy được.
   Chặn: giả lập / bài thử phải vá DỮ LIỆU mới chạy được một luồng thật = tín hiệu luồng thật có thể bị chặn → ghi Phát hiện ngay, không chỉ vá bài.
4. K7 · Đã gây: `git rm` đưa file vào chỗ chờ, commit kế tiếp (chỉ định add một file khác) gộp luôn — tiêu đề commit sai (68ae0d80). Chặn: commit
   NGAY sau `git rm` (cùng lệnh), hoặc `git status --short` trước mỗi commit.
BỎ (2): stub esbuild CJS (`default` = cả module khi platform node) — một lần, đã ghi chú trong bài; kho nông — bước 1.3 skill đã có luật `--unshallow`.
Dọn KHUON_LOI.md: không đề xuất xoá (không có lời dặn nào việc này đã biến thành phép máy).
