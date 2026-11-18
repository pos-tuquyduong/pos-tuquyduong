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
| cửa chặn: vế chuyển khoản (`transfer_amount`, nhãn `transfer`) | BV-CK-THANG · BV-CK-NHAN |
| cửa chặn: vế ghi nợ / chờ thu (câu 5) | BV-GHI-NO-THANG · VS-GHI-NO-CHI-SO |
| cửa chặn: gói (mua / mã gói / món từ gói), mọi lối | BV-GOI-MUA · BV-GOI-MA · BV-GOI-TU-GOI · VS-GOI-CHI-THANG |
| khoá: chỉ `taoDon` gọi `taoDonGoc` | VS-GOI-THANG-LOI-GOC |
| index.jsx luôn màn mới (kho cũ "tắt", ?man=cu) | VS-MAN-THEO-KHO-CU · VS-MAN-CU-QUERY |
| tinh.js nhớ kiểu | BV-KIEU-KHONG-NHO |
| bảng ⚙ không nút về màn cũ | BV-NUT-TAT |
| api.js bỏ ordersApi.create | BV-API-CREATE |

Kết quả `python3 viec/BO-MAN-CU-1/dot_bien.py` (HEAD `a68fee1b` + dot_bien.py): ĐỐI CHỨNG XANH · 62 đạt · 0 hỏng; TỔNG: 18 đột biến · BẮT 18 · SỐNG 0 ·
HỎNG 0 · LẠC 0.

### Kiểm
- `npm test -- --day-du` (cây làm việc = HEAD `a68fee1b`): PASS 126 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có sẵn từ trước việc này).
- Giả lập một ngày (`node cong_cu/gia_lap/chay.js`): 33 kịch bản · 18 bất biến · ĐẠT; `thu_gia_lap.js` 180 đạt · 0 hỏng.
- Bằng chứng đỏ: `bang_chung_do.txt` — 28 bài thử đổi / mới đều ĐỎ trên cây gốc `28b6efeb` (lượt như cổng A11: 21 bài thiếu hàm phụ
  `donCu.js` — sập; lượt kèm hàm phụ: đỏ vì "orders.js chưa có taoDonGoc", màn cũ / công tắc cũ còn); 28 dòng `SỐ CA` chạy trên HEAD.
- `node tu_chay/cong.js tinh . d52b9fb^ HEAD viec/BO-MAN-CU-1` (HEAD `9913355a` sau commit bằng chứng): chỉ `✗ [A20]` (chưa soát bảo mật) và `✗ [A19]`
  (chưa ghi HEAD ĐÃ KIỂM) — đúng dự kiến ở bước này.

## Phát hiện (không sửa trong việc này)
- `client/src/index.css:664-700` còn khối CSS "SALES PAGE RESPONSIVE" (`.sales-layout`, giỏ thu gọn) chỉ màn cũ dùng — CSS chết, file ngoài Phạm vi.
- `client/src/pages/BanHang/tinh.js` `dungDonHang` (thân POST /orders đợt 1) không màn nào gọi nữa; đường thẳng nay chỉ tiền mặt — mã chết,
  còn bị `thu_BH1` I1–I9 và `thu_KHACHCK1` D2 khoá → đề xuất xoá cùng hai bài ở việc sau (chú thích đầu hàm đã ghi "chờ chủ quán duyệt xoá").
- Chú thích máy chủ còn nhắc `Sales.jsx`: `server/routes/orders.js:369` ("Man ban hang da kiem viec nay (Sales.jsx:77)"), `:782` ("Sales.jsx:29"),
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
