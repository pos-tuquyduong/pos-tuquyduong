# VOUCHER-2 — trạng thái

## Bước 1 — đối chiếu bản chụp (11.11.2026)
- Nhánh: `viec/VOUCHER-2`; cây sạch.
- HEAD `9f4eab2` · FETCH_HEAD `9f4eab2` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  9f4eab2 PHIEU: VOUCHER-2
  53a71a2 TIEN-DO: DIEM-MON-1, VI-ME-1, BAO-1a xong; them QUET-1, BO-MAN-CU-1, MATKHAU-1 (truoc khai truong), DOI-DIEM-1, QUET-2 (cuoi danh sach); quyet dinh 11.11; KHUON_LOI bo sung; bo attached_assets/ khoi kho
  4d458c2 DON-DEP: xoa 18 patch_pos_*.py + 3 lui_*.sh + update.zip o goc kho (va tay thang 9-10 da ap dung, lich su con trong git; chu quan duyet 11.11)
  ```
- Có commit `PHIEU: VOUCHER-2` (mốc = `9f4eab2`).

## Bước 2–3 — đọc code, lập kế hoạch
- Kế hoạch: `viec/VOUCHER-2/ke_hoach.md`. Phiếu dặn **Chờ duyệt kế hoạch** → commit, push, DỪNG ở bước 3.
- Người gác chặn 3 lệnh lúc đọc (đọc lại bằng công cụ Grep, không lách): `[B-BIMAT-CHU]` grep đệ quy ở gốc kho (đọc `.replit`);
  `[B-CHUONGTRINH]` `xargs`; `[B-CHUONGTRINH]` vòng `for` trong bash.

## Câu hỏi
Q1–Q6: chủ quán trả lời 11.11 (ghi trong phiếu) — kế hoạch sửa ở `ke_hoach.md` mục 11.

## Soát kế hoạch (agent phụ chỉ đọc, bước 3)
Bắt 2 lỗi NẶNG (traLuotMa thoát sớm khi đơn chỉ có voucher; 3 chỗ đọc shipping_fee) + 4 vừa — đã kiểm lại trên code, ghi vào
`ke_hoach.md` mục 10. DỪNG chờ chủ quán duyệt kế hoạch + trả lời Q1–Q6 (Q5 nay 7 file).

## Stop hook — npm test đỏ oan vì kho nông
`thu_BH2.js` G1 đỏ: `fatal: bad revision 'cbbb809..HEAD'` — phiên mở từ kho nông (`is-shallow-repository` = true). Đã chạy
`git fetch -q --unshallow origin viec/VOUCHER-2` (chỉ tải lịch sử, không đổi file) → `npm test`: PASS 111 · FAIL 0 · CẢNH BÁO 1.

## Phiên 12.11 — làm tiếp sau trả lời Q1–Q6
### Bước 1 — đối chiếu bản chụp
- Nhánh `viec/VOUCHER-2`, cây sạch. HEAD `0aae07e` · FETCH_HEAD `0aae07e` — bằng nhau, không kéo (hook mở phiên đã kéo `be76620 → 0aae07e`).
- `git log --oneline -3`:
  ```
  0aae07e PHIEU: VOUCHER-2 Pham vi them 9 file (Q5 + Q2), tra loi Q1-Q6 (Q1, Q2, Q4 chu quan sua) — chu quan 11.11
  be76620 VOUCHER-2: trang thai - npm test xanh sau unshallow
  9957880 VOUCHER-2: ke hoach (cho chu quan duyet) + trang thai buoc 1-3
  ```
### Bước 2–3 — sửa kế hoạch theo Q1 / Q2 / Q4
- `ke_hoach.md` mục 11: Q1 (hai loại voucher ở mẫu), Q4 (một voucher %), Q2 (mã bill → voucher theo mẫu cho khách đăng ký lần đầu),
  bảng từng file thêm (Q5), và một PHÁT HIỆN đường tiền mới (11.5).
- DỪNG trước bước 4: còn câu hỏi tiền / bài thử cũ / nghĩa nghiệp vụ dưới đây (luật: đụng tiền mà chưa chốt → hỏi, không đoán).

## Câu hỏi (12.11) — mình ghi đề xuất, bạn chỉ cần "đồng ý" hoặc sửa
- **Q7 — Tiền đã trả theo dòng khi hoàn / đền (đường tiền, `ke_hoach.md` 11.5).** Luật 10.11 làm mã chỉ giảm món; hàm chia "tiền đã trả" hiện chia
  đều cả lên gói / thẻ → đơn trộn sẽ đền món lố (tối đa 49.285 trong khi khách trả 45.000) và kết thúc gói hoàn thiếu. **Đề xuất:** đơn tạo từ
  VOUCHER-2 trở đi đánh dấu; với đơn đó dòng gói / thẻ tính đã trả đủ giá, giảm chỉ chia trên món; đơn cũ giữ cách cũ. Sửa ~8 dòng trong
  `server/utils/tienDaTra.js` (trong Phạm vi), không đổi tên / tham số hàm — HUY-1 chỉ cần biết, không phải sửa lời gọi.
- **Q8 — Bài cũ `thu_P26c` ca M4a** (2 gói + mã 10 %, `cong_cu/thu_P26c.js:866-875`): ca này CÓ giảm mới bắt được 3 đột biến N8–N10 (chia
  sai số gói trên một dòng). Theo luật 10.11 mã không giảm gói nữa → chỉ đổi số mong đợi thì ca hết bắt được lỗi = nới phép kiểm (bạn dặn
  không nới). **Đề xuất:** giữ ca M4a cho DỮ LIỆU CŨ (đơn trước VOUCHER-2 vẫn có gói được giảm trên production): bài tạo đơn qua máy rồi đặt cờ
  "đơn cũ" (Q7) + giảm như cũ bằng câu ghi thẳng vào kho thử — 3 đột biến vẫn bị bắt; THÊM ca M4c theo luật mới (mã không giảm gói, khách trả
  600.000). Không bỏ / nới ca nào.
- **Q9 — Nghĩa "chưa có tài khoản, đăng ký lần đầu" (Q2).** App tạo tài khoản lúc đăng nhập lần đầu rồi mới nhập mã, nên máy cần một mốc.
  **Đề xuất:** nhận được khi tài khoản của SĐT được tạo SAU lúc in bill (lúc mua chưa có tài khoản); chưa có tài khoản → "Tạo tài khoản trước rồi
  nhập mã"; tài khoản có trước bill → "Số điện thoại này đã có tài khoản — ưu đãi chỉ dành cho khách đăng ký lần đầu". Ở quầy: form "Thêm khách"
  có ô mã bill. Lên bản: máy tự tạo sẵn một mẫu voucher đúng cấu hình ưu đãi khách mới đang chạy (giảm cả đơn) để quầy không gián đoạn; nếu đang
  cài kiểu "giảm 1 món nhóm khách mới" thì bạn chọn mẫu trong Cài đặt → Voucher (máy không tự đổi nghĩa tiền).
- **Q10 — Voucher ship theo % có tính là "voucher giảm %" của Q4 không?** **Đề xuất:** KHÔNG — Q4 chỉ cho voucher giảm % trên món; voucher ship
  (số tiền hay %) chỉ giảm phí giao, đã kẹp không quá phí giao, vẫn tính vào N.

## Stop hook 12.11 — npm test đỏ oan vì kho nông (lần 2)
Phiên lại mở từ kho nông → `thu_BH2.js` G1 `fatal: bad revision 'cbbb809..HEAD'`. Chạy `git fetch -q --unshallow origin viec/VOUCHER-2`
(chỉ tải lịch sử, không đổi file) → `npm test`: PASS 111 · FAIL 0 · CẢNH BÁO 1. Không sửa code, không đụng bộ kiểm.

## Phiên 12.11 (lần 2) — làm tiếp sau trả lời Q7–Q10
### Bước 1 — đối chiếu bản chụp
- Nhánh `viec/VOUCHER-2`, cây sạch. HEAD `e3ef76a` · FETCH_HEAD `e3ef76a` — bằng nhau, không kéo (hook mở phiên đã kéo `c58ef77 → e3ef76a`).
- `git log --oneline -3`:
  ```
  e3ef76a PHIEU: VOUCHER-2 tra loi Q7-Q10 (dong y de xuat) — chu quan 12.11
  c58ef77 VOUCHER-2: trang thai - npm test xanh sau unshallow (phien 12.11)
  6dc4ec1 VOUCHER-2: ke hoach sua theo Q1/Q2/Q4 (muc 11) + cau hoi Q7-Q10 (duong tien da tra theo dong, bai cu P26c M4a)
  ```
### Bước 3 — kế hoạch cập nhật theo Q7–Q10: `ke_hoach.md` mục 12. Người gác chặn `[SED-I]` (sed -i) → sửa bằng Edit.

### Bước 4–5 (12.11, lần 2) — đã làm
- `cong_cu/thu_VOUCHER2.js` mới: đỏ trên gốc (4 đạt · 70 hỏng — 4 ca xanh là ca "không đổi"), xanh trên code vá (74 · 0) — `bang_chung_do.txt`.
- Máy chủ: mẫu voucher (`/rewards/mau`, bước 026), MỘT hàm phát `phatVoucher` (đổi điểm đi qua), nhiều voucher một đơn (`kiemVoucherDon` + `tinhUuDai`
  mở rộng), voucher ship, luật 10.11 (mã / voucher không áp thẻ / gói / nạp), Q7 (`tienDaTraTheoDong` cờ `giam_mon_thuong`), `traLuotMa` trả mọi voucher
  (giữ tên + tham số), App `vouchers[]` + hợp đồng v14, hoá đơn / báo cáo / màn khách / dọn đơn thử.
- Voucher gửi ở ô mã cũ (quầy / App trước VOUCHER-2): vẫn qua MỌI phép voucher mới (chính chủ, ship, phạm vi) nhưng đơn ghi `discount_code` và báo ra y như
  trước (K5 — P26c D1b / D3, UUDAI1 D1 giữ nguyên).
- Bài cũ trong Phạm vi đổi số theo luật đã duyệt (đỏ trên gốc, ghi `SỐ CA`): UUDAI1 G3d + K4b, KHTHE1 B12b, P26c M1b–c, M4a–c, N4a–c.
- `npm test`: PASS 110 · FAIL 1 — chỉ `thu_GOI1.js` (ngoài Phạm vi, xem Q12). Cổng `tinh`: chỉ A18 (đột biến — đang làm), A19 / A20 (chưa tới bước).
- Người gác chặn (đọc lý do, làm lại đúng dạng): `[SED-I]` sed -i → Edit; `[B-BIMAT-CHU]` chạy bài có cụm bí mật chưa commit → commit trước (và một
  lần vì chính ghi chú này có chữ đó); `[B-PHANTICH]` ×4 lệnh ghép `python … && node …` → tách lệnh; `[GIT-LENH]` ls-remote; `[B-CHUONGTRINH]` vòng for → Grep.

## Câu hỏi (12.11, lần 2) — mình ghi đề xuất, bạn chỉ cần "đồng ý" hoặc sửa
Việc này là gì: phần Q2 (mã in bill → voucher cho khách đăng ký lần đầu) và luật "mã không giảm gói" làm đổi kết quả của một số bài thử CŨ nằm NGOÀI
Phạm vi phiếu. Mình không được sửa file ngoài Phạm vi, nên dừng hỏi. Mọi phần khác làm trong Phạm vi (giao diện làm tiếp trong phiên này).
- **Q11 — Thêm 5 bài thử cũ vào Phạm vi cho Q2/Q9.** Đã đọc code: `cong_cu/thu_P20.js:106` tạo SĐT KHÔNG có hồ sơ khách rồi nhận mã (`:143`, `:155`, … ~30 chỗ
  `claim(…)`) và dùng thẳng mã bill làm mã giảm (`:357-368`, nhóm G "P20b"); `cong_cu/gia_lap/kich_ban.js:76` tạo "Khách quen" CÓ hồ sơ từ trước rồi
  nhận mã ở `:217`; `cong_cu/thu_KH1.js:534-577`, `cong_cu/thu_KHAPI2.js:392-443`, `cong_cu/thu_HD1.js:587` nhận mã qua `/kh/nhan-ma-bill` / `/claim`.
  Theo Q2 + Q9 các ca đó sẽ ra `CAN_TAO_TAI_KHOAN` / `KHACH_DA_CO_TAI_KHOAN` hoặc mã bill không còn gõ được ở ô mã. **Đề xuất:** thêm 5 file trên vào Phạm vi;
  chỉ sửa đúng các ca bị Q2 đổi: (a) ca nhận mã hợp lệ → tạo hồ sơ khách SAU lúc in bill trước khi nhận (không đổi điều đang kiểm); (b) ca dùng mã bill ở ô mã
  (P20b) → dùng mã voucher mới trả về ở `data.voucher_code` (cùng cổng đơn gốc); (c) ca "khách quen" của giả lập → đổi mong đợi thành
  `KHACH_DA_CO_TAI_KHOAN`. Mỗi ca đổi ghi lý do, là bài sửa thường (đỏ trên gốc); không bỏ / nới phép nào.
- **Q12 — `cong_cu/thu_GOI1.js` ca B3c (`:647-650`) — ngoài Phạm vi.** Ca mua gói 30 túi CÓ mã giảm 10 % (trả 1.215.000) rồi kiểm hoàn theo giá đã trả.
  Luật 10.11 làm mã không giảm gói → đơn thành 1.350.000 → bài sập (hiện là bài DUY NHẤT đỏ của `npm test`). **Đề xuất:** thêm file vào Phạm vi; giữ
  B3c cho ĐƠN CŨ (bán không mã rồi ghi thẳng giảm như đơn cũ + cờ "đơn cũ") để phép "hoàn theo giá đã trả" vẫn bị canh; THÊM ca luật mới (mã không giảm
  gói, hoàn theo 1.350.000) — đúng khuôn bạn đã duyệt ở Q8.
- **Q13 — xác nhận:** ngoài M4a (Q8), hai ca cùng khuôn trong `thu_P26c.js` cũng bị luật 10.11 / Q7 đổi số và mình ĐÃ làm theo đúng cách Q8: M1b (gói + ship
  + mã) giữ cho đơn cũ + thêm M1c; N4a (gói + món + mã 1 món — Q7 làm dòng gói đã trả đủ 300.000) giữ cho đơn cũ + thêm N4c. Không bỏ / nới ca nào.
  **Đề xuất:** đồng ý (muốn khác thì mình sửa lại).

### Bước 4–6 (12.11, lần 2, tiếp) — đột biến, giao diện Cài đặt, kiểm
- `viec/VOUCHER-2/dot_bien.py`: **40/40 bị bắt**, đối chứng xanh (thu_VOUCHER2 80 · 0, thu_KHTHE1 73 · 0). Một đột biến từng SỐNG (VS-V2-SHIP-LA-PHAN-TRAM)
  → ca E6 đổi thứ tự (voucher ship % gửi trước) → nay bị bắt. Thêm ca để MỖI vế chặn có ca riêng: G4b / G4c (hai điều kiện câu tiêu), G5 (trả đúng một lượt —
  `MAX(0)` từng che lỗi), H3c (ô mã cũ mềm ở POST), F6b, A2 (voucher tiền không in trần).
- Bảng chỗ vá → đột biến (tên = nguyên chuỗi đầu trong `dot_bien.py`):

| Chỗ vá | Đột biến |
|---|---|
| orders.js `kiemVoucherDon` chính chủ (Q1) | BV-V2-CHINH-CHU · VS-V2-CHINH-CHU-MOI-MA |
| tối đa N | VS-V2-N-NOI |
| voucher ship chỉ đơn giao (có báo phí) | BV-V2-SHIP-CAN-GIAO · VS-V2-SHIP-GO-TAY |
| giờ flash không voucher % | BV-V2-FLASH-PHAN-TRAM |
| một voucher % (Q4) / ship % không tính (Q10) | VS-V2-PHAN-TRAM-HAI · VS-V2-SHIP-LA-PHAN-TRAM |
| nhóm / món chọn (Q3) | BV-V2-NHOM-MON |
| tối thiểu voucher theo món thường | VS-V2-TOI-THIEU-SUBTOTAL |
| tinh-thu / báo giá mềm | BV-V2-TINH-THU-MEM |
| luật 10.11 (mã chung + voucher không áp thẻ / gói / nạp) | BV-V2-KHONG-GIAM-THE · VS-V2-MA-TREN-THE · VS-V2-MA-TOI-THIEU-SUBTOTAL · BV-V2-MA-KHONG-MON-THUONG · BV-V2-NAP-VOUCHER |
| tổng đơn / cột phí giao / chuyến | BV-V2-TONG-BO-VOUCHER · VS-V2-SHIP-COT-GOC · VS-V2-CHUYEN-PHI-GOC |
| cờ giam_mon_thuong (Q7) | BV-V2-CO-MON-THUONG · BV-V2-DA-TRA-CHIA-DEU |
| tiêu voucher trong giao dịch (G4) | BV-V2-TIEU-VI · BV-V2-TIEU-LUOT |
| ô mã cũ (K5) | BV-V2-K5-O-MA · BV-V2-O-MA-MEM |
| uuDai.js thứ tự / kẹp ship | VS-V2-PHAN-TRAM-TRUOC · VS-V2-SHIP-KHONG-KEP |
| tienDaTra.js traLuotMa | BV-V2-TRA-VOUCHER · VS-V2-TRA-HAI-LAN · BV-V2-THOAT-SOM |
| voucherCode.js phatVoucher / moTaVoucher | VS-V2-HAN-TU-MAU · VS-V2-CHUP-LUAT · VS-V2-MO-TA-TRAN |
| loyalty.js đổi điểm qua phatVoucher | BV-V2-PHAT-NGUON |
| rewards.js quyền mẫu | BV-V2-MAU-QUYEN |
| hoaDon.js dòng voucher / phí giao | BV-V2-HOA-DON-VOUCHER · VS-V2-HOA-DON-PHI-GOC |
| donApp.js vouchers[] / băm giỏ / sai dạng | BV-V2-APP-VOUCHER · VS-V2-APP-BAM-CU · BV-V2-APP-SAI-DANG |

- Giao diện: `client/src/pages/CaiDat/MauVoucher.jsx` (mới) + `Settings.jsx` 2 dòng (thẻ Điểm thưởng, dưới "Tích điểm"); `npm run build`, dist đã commit.
- Hoá đơn (`hoaDon.js`): giữ NGUYÊN nghĩa `giam_ma` (gồm voucher) và `phi_giao` (phần khách trả) để tờ in hiện tại cộng khớp tổng; chỉ THÊM `vouchers[]`,
  `giam_ship` (có khi đơn dùng voucher) — tách dòng trên tờ in chờ Q14.
- `npm test -- --day-du`: **PASS 115 · FAIL 1 · CẢNH BÁO 1** — FAIL duy nhất `thu_GOI1.js` (chờ Q12); cảnh báo "route GET có lệnh ghi" có từ trước. Giả lập quầy xanh.

## Câu hỏi (12.11, lần 2 — tiếp)
- **Q14 — Màn Bán hàng + tờ in là bản vẽ ĐÃ CHỐT (CLAUDE.md §9), bản mẫu `ban_mau_pos/` chưa có phần voucher, và `ban_mau_pos/` không nằm trong Phạm vi.**
  Nghiệm thu I cần: chọn / bỏ nhiều voucher của khách ở màn Bán hàng, giỏ / hoá đơn / tem hiện từng dòng giảm; Q9 cần ô "Mã trên bill" ở form Thêm khách.
  Luật §9: đổi thiết kế thì sửa bản mẫu TRƯỚC, sửa bản mẫu phải hỏi bạn. **Đề xuất (bạn chỉ cần "đồng ý"):** (1) thêm `ban_mau_pos/**` vào Phạm vi;
  (2) Bán hàng: khi chọn khách có voucher, ngay DƯỚI ô mã khuyến mãi hiện hàng chip "🎟 <câu mo_ta>" (bấm chọn / bấm lại bỏ; đủ N thì chip còn lại mờ; chip
  lỗi viền đỏ + lý do máy chủ); giỏ thêm từng dòng "Voucher <MÃ> −x" và "Giảm phí giao −x"; (3) tờ in / tem: thêm dòng "Voucher <MÃ> −x" dưới dòng ưu
  đãi, và "Phí giao <gốc>" + "Giảm phí giao −x" khi có voucher ship; (4) Thêm khách: ô "Mã trên bill (nếu có)" như Q9. Mình sửa bản mẫu trước, chạy
  `bash ban_mau_pos/chay_thu.sh` (số phép không giảm), rồi mới sửa mã thật.

## Phát hiện
- `server/utils/dongHoaDon.js` (hoá đơn App) chưa có dòng voucher — đơn App dùng voucher hiện giảm trong dòng "mã" (tổng vẫn khớp). Làm cùng Q14.
- `/discount-codes/validate` (chỉ màn Bán hàng CŨ, bỏ ở BO-MAN-CU-1) chưa biết luật 10.11 / voucher — chỉ xem trước, không ghi tiền; máy chủ tính lại ở taoDon.
- Đường dọn đơn thử (`donThu.js`) đã chụp thêm mã của voucher đơn — chưa có ca thử riêng (bài cũ thu_KHSDT1 xanh).

### Dừng (12.11) — chờ chủ quán trả lời Q11–Q14. Chưa chạy /ra-soat, /soat-bao-mat, cổng chạy: còn phần Q2 + giao diện Bán hàng / in.

## Phiên 13.11 — làm tiếp sau trả lời Q11–Q14 (chat đã gộp main 171109f có HUY-1)
### Bước 1 — đối chiếu bản chụp
- Nhánh `viec/VOUCHER-2`, cây sạch. HEAD `e94708f` · FETCH_HEAD `e94708f` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  e94708f PHIEU: VOUCHER-2 Pham vi them 5 bai cu (Q11), thu_GOI1 (Q12), ban mau (Q14); tra loi Q11-Q14 — chu quan 12.11
  c2fc201 GOP-VOUCHER-2 gop main 171109f (chat 13.11, truoc tiep Q11-Q14; hop dong phan voucher doi v15)
  171109f Merge pull request #91 from pos-tuquyduong/viec/HUY-1
  ```
- Kho nông → `git fetch -q --unshallow origin viec/VOUCHER-2` (chỉ tải lịch sử).
- `npm test` trên bản gộp: PASS 113 · FAIL 1 · CẢNH BÁO 1 — FAIL duy nhất `thu_GOI1.js` (B3c, Q12 — đúng như chat báo). Không thấy gì lạ do gộp.

### Bước 4–6 (13.11) — đã làm
- **Q2 máy chủ** (`server/routes/signup-codes.js`): `nhanMaUuDai` phát voucher qua `phatVoucher(tx, mau, phone, 'khach_moi', { nguon_id })` theo mẫu
  `signup_mau_voucher_id` (mẫu tắt / chưa chọn → 400 `UU_DAI_CHUA_CO_MAU`); `kiemKhachLanDau` — hồ sơ khách tạo SAU lúc in bill (≥, so sau khi đổi dấu
  cách → 'T'); chưa có → `CAN_TAO_TAI_KHOAN`, có trước → `KHACH_DA_CO_TAI_KHOAN` (báo TRƯỚC khi chiếm mã). Bỏ nhánh `MA_TRUNG` / chép cấu hình `signup_*`.
  Hoàn tác (`/:id/reset`) xoá voucher theo grant `khach_moi` + `nguon_id` (giữ nhánh dữ liệu cũ cùng chữ). `maBillCuaVoucher` (MỘT hàm, P20b): voucher
  mới qua grant, voucher cũ cùng chữ — `orders.js` (ô mã + `kiemVoucherDon`; ô mã giữ 400 cứng như trước), `discount-codes.js` `/validate`.
  K4 đã rà: `discount-codes.js` PUT đổi tên — voucher khách mới cũng chặn `MA_BILL_KHONG_DOI_TEN` (đổi tên làm đứt nối ví ↔ mã bill). `settings.js`: kiểm
  `signup_mau_voucher_id` (rỗng hoặc số nguyên).
- **Q11** bài cũ (mỗi ca đổi ghi lý do trong bài; đỏ trên gốc — `bang_chung_do.txt`): `thu_P20` (helper `claim` tạo hồ sơ khách ngay trước khi nhận; G/H
  dùng mã voucher mới; 5 ca hoàn tác của DỮ LIỆU CŨ đưa về dạng cũ bằng `veDangCu`; thêm ca "voucher là mã MỚI" ở G1–G12), `thu_KH1` (E6 tài khoản mới sau
  bill, E3 voucher trong ví `nguon khach_moi`, Q11 khách của bill tạo tài khoản sau bill, G lỗi nội bộ dùng tài khoản sau bill), `thu_KHAPI2` (mẫu + G2
  voucher mã mới), `thu_HD1` (A28d), `gia_lap/kich_ban.js` (hồ sơ khách đúng giây in bill; KB13 khách quen → `KHACH_DA_CO_TAI_KHOAN`, "dùng mã" qua nhận
  điểm cùng mã để I1 nhánh 'refunded' vẫn được phủ — đột biến tay tắt nhánh đó → KB13 → I1 lệch, đã trả lại).
- **Q12** `thu_GOI1`: B3c giữ cho đơn CŨ (mua không mã rồi ghi giảm + cờ `giam_mon_thuong = 0`) + **B3f** luật mới (hoàn 900.000). Cùng khuôn (dữ liệu trước
  P26c, gói + mã): **B3p**, **B3r** dựng đơn cũ y như vậy — không bỏ / nới phép nào (khuôn Q8 / Q12 chủ quán đã duyệt; ghi ở đây để chủ quán biết).
- **Q14 bản mẫu** (sửa bằng Edit / Write): `ban_mau_pos.html` ô "🏷 Mã khuyến mãi" + hàng chip voucher ngay dưới + dòng giảm trên giỏ / bill khách;
  `thu/thu_voucher.js` 24 phép (sập trên bản mẫu cũ); `DAC_TA.md` mục mới. `bash ban_mau_pos/chay_thu.sh`: **156 đạt · 0 hỏng** (trước 132).
- **Q14 mã thật**: `BanHang/ChipVoucher.jsx` (mới) + `BanHangMoi.jsx` (ví voucher `/loyalty/vouchers/:sdt`, chọn / bỏ, `voucher_loi` → bỏ chọn + viền đỏ,
  dòng "Voucher <MÃ>" + "Phí giao" gốc + "Giảm phí giao"; 496 dòng); `tinh.js` (`vouchers` vào khoá / thân tinh-thu / phiên — chỉ khi có chọn, thân cũ y
  nguyên; `boVoucherLoi`); `utils/hoaDon.js` (tờ quầy = hoá đơn App: dòng `voucher` dưới `giam_ma`, `phi_giao` gốc + `giam_ship`; đơn không voucher y cũ);
  `Customers.jsx` ô "Mã trên bill (nếu có)" (Q9 — lưu khách xong gọi `/signup-codes/claim`; mã lỗi chỉ báo, khách đã lưu); `MauVoucher.jsx` chọn "Mẫu cho
  ưu đãi khách mới". `npm run build` → dist đã commit. Tem cốc / phiếu pha chế KHÔNG đổi.
- **Hợp đồng `/api/kh` v15** (cùng đợt, chưa gộp main — không tăng thêm số): `nhan-ma-bill` (3 mã mới, `MA_TRUNG` không còn trả, `voucher_code` = mã mới,
  thêm `mo_ta`), `hoa_don[]` dòng `voucher` / `giam_ship`, nghĩa `giam`. `thu_HOPDONG_KH` 90 · 0.
- Bài thử: `thu_VOUCHER2` **105 · 0** (thêm [Q2] 15 ca, [Q14] 9 ca); P20 178 · KH1 157 · KHAPI2 101 · HD1 158 · GOI1 115 · HOPDONG_KH 90 · UUDAI1 88 ·
  KHTHE1 73 · P26c 161 — đều 0 hỏng. Giả lập quầy 33 kịch bản · 18 bất biến · ĐẠT.
- Đột biến `python3 viec/VOUCHER-2/dot_bien.py`: **57/57 bị bắt**, đối chứng xanh (thu_VOUCHER2 105 · 0, thu_KHTHE1 73 · 0).

Bảng chỗ vá → đột biến (thêm phiên 13.11; tên = nguyên chuỗi đầu trong `dot_bien.py`):

| Chỗ vá | Đột biến |
|---|---|
| signup-codes.js kiemKhachLanDau (Q9) | BV-V2-KHACH-CU · VS-V2-KHACH-CU-SO-NHAM · VS-V2-KHACH-CU-CHUOI-THO |
| signup-codes.js mẫu đang bật | BV-V2-MAU-TAT |
| signup-codes.js hoàn tác theo grant | BV-V2-RESET-GRANT |
| orders.js P20b voucher mới (kiemVoucherDon / ô mã cứng) | BV-V2-P20B-VOUCHER · VS-V2-P20B-O-MA-MEM |
| discount-codes.js /validate + chặn đổi tên | BV-V2-VALIDATE-P20B · BV-V2-DOI-TEN-VOUCHER |
| settings.js signup_mau_voucher_id | BV-V2-CAI-MAU-KM |
| Customers.jsx ô mã bill | BV-V2-THEM-KHACH-MA |
| utils/hoaDon.js tách dòng | VS-V2-HD-GOP-VOUCHER · VS-V2-HD-PHI-KHACH-TRA · BV-V2-HD-BO-DONG |
| tinh.js / ChipVoucher.jsx | BV-V2-TINH-GUI-VOUCHER · BV-V2-BO-LOI · VS-V2-CHIP-KHONG-MO |

Không có đột biến riêng (phòng thủ, ghi thẳng): vế `AND status = 'available'` khi hoàn tác xoá dòng ví — phép `used_count = 0` cùng giao dịch đã chặn trước
(tiêu voucher tăng lượt mã + đổi ví trong MỘT giao dịch — G4b / G4c), nên bỏ vế này đột biến vẫn SỐNG; giữ làm khoá thứ hai.

### Sự cố phiên 13.11
- Người gác chặn: `[B-PHANTICH]` ×6 (lệnh ghép `python … && node …`, `git commit && node`, `node … > file`) → tách lệnh / bỏ ghi file; `[B-BIMAT-CHU]` ×3
  (chạy bài có cụm bí mật chưa commit; một lần vì chính ghi chú này) → commit trước; `[GIT-LENH]` `git stash` → dựng bản gốc bằng
  `cong_cu/ban_sao_goc.py`; `[B-CD-VITRI]` / `[B-CD]` (mkdir + cd chung một lệnh) → tách.
- `DAC_TA.md` bản mẫu: Q14 dặn sửa bằng Edit / Write — mình lỡ sửa file này bằng script Python (nội dung đã soát diff, UTF-8 nguyên vẹn; `ban_mau_pos.html`
  + bài thử sửa đúng bằng Edit / Write).
- Bài thử đỏ bất ngờ: `thu_GOI1` B3p / B3r (gói + mã — cùng khuôn B3c, chưa nằm trong Q12) → làm đúng khuôn đơn cũ; tên ca mới B3e trùng → đổi B3f.

## Câu hỏi (13.11) — mình ghi đề xuất, bạn chỉ cần "đồng ý" hoặc sửa
Việc này là gì: phần Q2 (mã in bill → voucher theo mẫu) làm đỏ MỘT phép tĩnh của bộ kiểm tự động. Luật kho (CLAUDE.md §6): sửa bộ kiểm — ngoài thêm
phép / hạ ngưỡng — phải hỏi bạn, nên mình dừng ở đây. Mọi phần khác đã xong và xanh (xem trên).
- **Q15 — phép E9 trong `kiem_tra_truoc_khi_giao.js` (dòng ~453).** Phép này canh "chặn hai người nhận cùng mã": trong thân `/claim`, câu chặn
  `if (!chiem || chiem.changes !== 1) { rollback; return }` phải đứng TRƯỚC lệnh phát voucher — nó tìm lệnh phát bằng chữ `INSERT INTO pos_discount_codes`.
  Q2 chuyển việc phát sang hàm chung `phatVoucher(...)` (luật "một quy tắc — một hàm"; đổi điểm đã đi qua hàm này), nên chữ đó không còn trong `/claim`
  → phép báo đỏ dù câu chặn vẫn đứng trước lệnh phát (`server/routes/signup-codes.js`: câu chặn rồi mới tới `phatVoucher(tx, …)`). **Lỗ phép cảnh báo
  đã tìm (K8): không có** — chạy thật: `thu_P20` [E] đua hai người cùng mã → một 200 + một 409, đúng 1 voucher; `thu_VOUCHER2` Q2f cùng ca → 1 grant; giả
  lập KB11 xanh. **Đề xuất:** sửa ĐÚNG một dòng của E9 — chấp nhận lệnh phát là `INSERT INTO pos_discount_codes` HOẶC `phatVoucher(` (vẫn đòi câu chặn
  đứng trước lệnh phát, không nới gì khác):
  `const chenVoucher = m ? k.slice(sauUpdate).search(/INSERT INTO pos_discount_codes|phatVoucher\(/) : -1;`
  Bạn đồng ý thì phiên sau mình sửa dòng đó, chạy lại `npm test -- --day-du`, cổng `chay`, rồi soát độc lập + soát bảo mật và báo cáo 7 mục.

## Phát hiện (13.11)
- `client/src/components/CustomerSearch.jsx` (form "Thêm khách hàng mới" của màn Bán hàng CŨ `Sales.jsx` — không còn gắn đường trong `App.jsx`) chưa có ô
  mã trên bill. Không sửa (màn cũ, chờ BO-MAN-CU-1).
- `CLAUDE.md` §3 / §9 còn ghi "119 phép" của bản mẫu (thật đã là 132 trước việc này, nay 156) — máy không sửa CLAUDE.md.
- Tờ in quầy / hoá đơn App: dòng "Voucher <MÃ>" và "Giảm phí giao" dùng nhãn cố định (như dòng "Mã GD"), chưa có ô đổi chữ ở Cài đặt hoá đơn; ẩn
  dòng "giảm mã / quà" thì ẩn luôn dòng voucher, ẩn "phí giao" thì ẩn luôn "giảm phí giao" (để tờ cộng vẫn khớp).

### Kiểm (13.11, HEAD 05136650)
- `npm test -- --day-du`: **PASS 117 · FAIL 1 · CẢNH BÁO 1**. FAIL duy nhất = phép E9 `/claim: chiếm mã … TRƯỚC khi phát voucher` (Q15 — chờ chủ quán,
  KHÔNG tự sửa bộ kiểm, K8). Cảnh báo "route GET có lệnh ghi" có từ trước. dist khớp src, giả lập quầy xanh.
- `node tu_chay/cong.js tinh . 171109f HEAD viec/VOUCHER-2` (gốc = main đã gộp ở c2fc201): chỉ `✗ [A20]` (chưa tới soát bảo mật) và `✗ [A19]` (chưa tới
  bước 11.4) — Phạm vi / A17 / A18 qua.
- Chưa chạy: `/ra-soat`, `/soat-bao-mat`, `cong.js chay`, báo cáo 7 mục — để sau khi chủ quán trả lời Q15 (bộ kiểm phải xanh trước).

### Dừng (13.11) — chờ chủ quán trả lời Q15.

## Phiên 14.11 — lệnh "VOUCHER-2 tiep" (vòng sửa 1 + Q16–Q19)
### Bước 1 — đối chiếu bản chụp
- Nhánh `viec/VOUCHER-2`, cây sạch. HEAD `3c9af63` · FETCH_HEAD `3c9af63` — bằng nhau, không kéo (hook mở phiên đã kéo `e94708f → 3c9af63`).
- `git log --oneline -3`:
  ```
  3c9af63 VOUCHER-2: trang thai - ket qua kiem 13.11, dung cho Q15
  0513665 VOUCHER-2: bang chung do phien 13.11 (Q2, Q11, Q12, Q14), trang thai, cau hoi Q15 (phep E9 bo kiem)
  70498ac VOUCHER-2: dot bien Q2 + Q14 (17 moi)
  ```
- Kho có đúng một nhánh (`viec/VOUCHER-2` = `origin/viec/VOUCHER-2`), không commit nào ngoài `3c9af63`.

## Câu hỏi (14.11) — mình DỪNG, chưa sửa gì
Việc này là gì: lệnh bảo mình "đẩy 4 commit đang giữ" rồi làm "vòng sửa 1 (4 lỗi soát nêu)" + Q16–Q19. Nhưng máy này là máy MỚI (máy mây cũ bị thu hồi),
bốn commit đó KHÔNG có ở đây: nhánh trên GitHub và trong máy đều dừng ở `3c9af63` (13.11 — lúc còn chờ Q15). Vì vậy mình không có:
(1) bốn lỗi người soát nêu (lần soát chạy sau `3c9af63`, kết quả nằm trong bốn commit đó);
(2) chữ chủ quán đồng ý Q15 (sửa một dòng phép E9 của bộ kiểm — luật kho cấm máy tự sửa bộ kiểm khi chưa có chữ duyệt; phiếu và
`QUYET_DINH_CHU_QUAN.md` chưa ghi Q15);
(3) câu hỏi Q16–Q19 gốc (đề xuất kèm số dòng) mà câu trả lời 13.11 nhắc tới.
Đoán lại bốn lỗi bằng một lần soát mới sẽ ra bộ lỗi khác, và sửa lại từ đầu dễ chồng / lệch với bốn commit nếu chúng còn ở đâu đó — việc tiền, nên mình không đoán.
- **Q20 — Bạn chọn một (đề xuất: a):**
  - **(a)** Nếu phiên máy cũ (13.11) còn mở trong app: bảo phiên đó chạy `git push -u origin viec/VOUCHER-2` (đẩy bốn commit lên GitHub), rồi mở lại lệnh
    "VOUCHER-2 tiep" — mình kéo về và làm đúng vòng sửa 1 + Q16–Q19.
  - **(b)** Nếu bốn commit đã mất: dán cho mình (qua phiếu) bốn lỗi soát + ghi Q15 "đồng ý" vào phiếu; mình làm lại Q15, vòng sửa 1, Q16–Q19 từ `3c9af63`.
  - **(c)** Bốn lỗi không còn: cho phép mình làm lại từ `3c9af63` — sửa E9 theo Q15 (cần chữ "Q15 đồng ý"), chạy `/ra-soat` mới, sửa lỗi lần soát đó nêu
    (coi là vòng sửa 1), rồi Q16–Q19 theo câu trả lời 13.11.

### Stop hook 14.11 — npm test đỏ
- `thu_BH2.js` G1 `fatal: bad revision 'cbbb809..HEAD'` — kho nông (lần 3). `git fetch -q --unshallow origin viec/VOUCHER-2` (chỉ tải lịch sử) → hết đỏ.
- Còn đúng MỘT mục đỏ: phép E9 `/claim … TRƯỚC khi phát voucher` — chính là Q15 đang chờ chữ duyệt. Không tự sửa bộ kiểm (CLAUDE.md §6, K8).
- `npm test`: **PASS 113 · FAIL 1 · CẢNH BÁO 1** (FAIL = E9 / Q15; cảnh báo "route GET có lệnh ghi" có từ trước).

### Dừng (14.11) — chờ chủ quán trả lời Q20 (kèm Q15).

## Phiên 14.11 (lần 2) — Q20 (b): Q15 + vòng sửa 1 + Q16–Q19
### Bước 1 — đối chiếu bản chụp
- Nhánh `viec/VOUCHER-2`, cây sạch. HEAD `4c5c2455` · FETCH_HEAD `4c5c2455` — bằng nhau, không kéo (hook mở phiên đã kéo `f7425021 → 4c5c2455`).
- `git log --oneline -3`:
  ```
  4c5c2455 PHIEU: VOUCHER-2 tra loi Q15 + Q20(b): 4 loi soat, Q16-Q19 — chu quan 14.11
  f7425021 VOUCHER-2: trang thai - npm test sau unshallow, chi con E9 (Q15 cho duyet)
  f8d79690 VOUCHER-2: trang thai phien 14.11 - 4 commit dang giu khong co tren may moi, cau hoi Q20, dung
  ```
### Đã làm (kế hoạch: `ke_hoach.md` mục 13; bằng chứng: `bang_chung_do.txt` phiên 14.11)
- **Q15** — E9 nhận `phatVoucher(tx,` (một dòng + sửa chú thích cùng chỗ). `npm test`: 113 · 1 → 114 · 0. Đột biến `VS-V2-E9-PHAT-TRUOC` BẮT
  (bài `KIEM` mới trong `dot_bien.py`: chạy bộ kiểm trên bản chép cả kho, đối chứng = phép E9 xanh).
- **Vòng sửa 1 — 4 lỗi soát 13.11:**
  (1) `thu_VOUCHER2.js` có KHUNG CHẠY MÀN THẬT (esbuild sẵn có gói .jsx + `utils/api.js` thật → máy chủ thử; bộ chạy hook tối giản). Q14c (Bán hàng: chip dưới ô mã,
  chọn / mờ đủ N, viền đỏ lý do máy chủ, THU TIỀN qua phiên ghi đúng voucher), Q2k (Thêm khách → /registrations + /claim thật), Q2m, A4 (Mẫu voucher: xem
  trước câu máy chủ, lưu, tối đa N). Phá như người soát → đỏ: 10 đột biến màn (chip ẩn, ví rỗng, phiên bỏ voucher, lỗi không đỏ, mẫu không lưu / xem tự dựng /
  tối đa / chọn mẫu KM, ô mã không gọi máy chủ, chip không mờ).
  (2) chú thích `server/utils/diemKhach.js` (layMaKhachMoi = dữ liệu cũ) + `orders.js` P20b — grep "mã in bill" toàn `server/`.
  (3) mục [Q2] mỗi ca một `chay` → trên gốc d919c83e chạy HẾT, từng ca đỏ riêng (84 · 28); Q2n đòi voucher mã riêng (gốc: voucher = mã bill nên chặn đổi tên
  cũ đã xanh oan); Q2j đỏ trên gốc thật e3ef76a (d919c83e đã có bước 026 phần Q9) + đột biến `VS-V2-026-GIAM-MON`.
  (4) `/api/kh/nhan-ma-bill`: `scope` theo mẫu (`ship` · `item` · `order`) + `kieu`, `ap_dung` (`signup-codes.js`); ca Q2o; hợp đồng v15.
- **Q16** — phiên chờ chuyển khoản (`payos` · `ck_tay`) GIỮ voucher của thân phiên (`voucherCode.voucherDangGiu`, khuôn `wallets.dangGiu`: hết hạn / huỷ /
  chốt → tự nhả). Đọc lại trong giao dịch tạo phiên (`giuCho.taoPhien`) và trong giao dịch tiêu voucher (`orders.js`); chốt từ phiên xét hạn theo ngày tạo
  phiên. Ô mã cũ bị giữ → 400 rõ. Ca Q16a–e (đua cả hai chiều).
- **Q17** — MỘT hàm `voucherCode.xetVoucherConDung` cho `kiemVoucherDon` và ví (`diemKhach.layVoucherKhach`, quầy + App); trường trả ra giữ y cũ. Ca Q17a–b.
- **Q19** — `doiSoat.tongHop` → `voucher { da_giam, giam_phi_giao }`; `components/DoiSoat.jsx` hai dòng; số tính tay 18.800 · 8.000; dist dựng lại.
- Hợp đồng `/api/kh` v15 (chưa gộp main — không tăng số): `nhan-ma-bill` kiểu / scope; giữ voucher; ví = luật lúc bán; mã `VOUCHER_DANG_GIU` +
  `MA_DON_GOC_KHONG_HOP_LE` (mã này App nhận được từ trước mà danh sách thiếu — K4). `thu_HOPDONG_KH` 90 · 0.
- Bài: `thu_VOUCHER2` **125 · 0** (105 → 125). Đột biến **82/82 BẮT** (đối chứng xanh). `npm test -- --day-du`: **PASS 118 · FAIL 0 · CẢNH BÁO 1** (có từ trước).

Bảng chỗ vá → đột biến (thêm phiên 14.11; tên = nguyên chuỗi đầu trong `dot_bien.py`):

| Chỗ vá | Đột biến |
|---|---|
| kiem_tra_truoc_khi_giao.js E9 (Q15) | VS-V2-E9-PHAT-TRUOC |
| BanHangMoi.jsx chip / ví / phiên thu / lỗi | BV-V2-CHIP-AN · BV-V2-VI-VOUCHER · BV-V2-PHIEN-BO-VOUCHER · VS-V2-LOI-KHONG-DO |
| MauVoucher.jsx lưu / xem trước / tối đa / mẫu KM | BV-V2-MAU-KHONG-LUU · VS-V2-MAU-XEM-TU-DUNG · BV-V2-MAU-TOI-DA · BV-V2-CHON-MAU-KM |
| signup-codes.js scope theo mẫu | VS-V2-SCOPE-CUNG |
| 026_voucher.js mẫu KM (Q9) | VS-V2-026-GIAM-MON |
| orders.js giữ trong giao dịch / phiên chính nó / hạn theo phiên / ô mã cứng | BV-V2-GIU-TRONG-TX · VS-V2-GIU-CA-CHINH-NO · VS-V2-HAN-HOM-NAY · BV-V2-GIU-O-MA-MEM |
| giuCho.js giữ trong giao dịch tạo phiên | BV-V2-GIU-PHIEN-TX |
| voucherCode.js voucherDangGiu / xetVoucherConDung | VS-V2-GIU-KHONG-NHA-HUY · VS-V2-GIU-KHONG-NHA-HAN · BV-V2-GIU-O-MA · BV-V2-XET-GIU · VS-V2-XET-HAN-GRANT · BV-V2-CHINH-CHU · VS-V2-CHINH-CHU-MOI-MA · BV-V2-P20B-VOUCHER |
| diemKhach.js ví dùng hàm chung | BV-V2-VI-RIENG |
| doiSoat.js / DoiSoat.jsx | BV-V2-DS-VOUCHER · VS-V2-DS-TINH-SHIP · BV-V2-DS-MAN |

### Sự cố phiên 14.11 (lần 2)
- Người gác chặn: `[B-BIMAT-CHU]` ×3 (chạy bài / bộ kiểm có cụm bí mật chưa commit → commit trước); `[B-PHANTICH]` ×4 (lệnh ghép `node --check … && git …`,
  `$'…'`); `[B-MANOI]` (`node --check server/utils/doiSoat.js` — file được bảo vệ → chạy bài thay); `[B-CHUONGTRINH]` `until`; `[B-DUONGDAN]` gọi esbuild bằng đường dẫn.
- Bài đỏ bất ngờ (khung, không phải code): Q2k bấm nhầm form Tìm; Q16c dựng sai tình huống (voucher phát hôm nay mà phiên "hôm qua"); Q19 màn chờ nhầm kỳ.
- 3 đột biến HỎNG vì Q17 dời phép sang `voucherCode.js` (neo cũ ở orders.js) — sửa neo (K4 "dời code → grep neo đột biến").

## Câu hỏi (14.11, lần 2) — mình DỪNG trước soát; mọi phần khác đã xong và xanh
Việc này là gì: Q18 cần một mốc để phân biệt "hồ sơ khách tạo NGAY TRONG chính đơn in bill" với "hồ sơ có từ trước" — mốc đó là quyết định của bạn.
Đã đọc code: đơn KHÔNG tự tạo hồ sơ khách (`grep "INSERT INTO pos_customers" server/` → chỉ `utils/khachMoi.js` taoKhach + `routes/sync.js`). Hồ sơ của
khách mới ở quầy được tạo TRƯỚC khi lưu đơn — qua Thêm khách, hoặc khi ghi địa chỉ / ghi chú (`customers-v2.js` chacCoKhach, tên "Khách hàng"). Vì vậy giờ
tạo hồ sơ luôn SỚM hơn giờ in bill (`signup-codes.js` kiemKhachLanDau so `created_at ≥ issued_at`) → khách mới bị báo `KHACH_DA_CO_TAI_KHOAN` oan. Trong dữ
liệu không có gì nối "hồ sơ này tạo cho đơn kia".
- **Q21 (Q18) — Đề xuất (bạn chỉ cần "đồng ý" hoặc sửa số):** vẫn là khách mới khi ĐỦ ba điều:
  (1) đơn in bill là đơn của chính SĐT đó;
  (2) SĐT chưa có đơn nào trước đơn in bill;
  (3) hồ sơ tạo trong vòng **30 phút trước** giờ in bill (hằng số có tên trong `signup-codes.js`).
  Hồ sơ cũ hơn 30 phút, hoặc SĐT đã có đơn khác → vẫn `KHACH_DA_CO_TAI_KHOAN` như Q9. Hồ sơ tạo SAU bill → nhận được như cũ.
  Bạn đồng ý thì phiên sau mình làm Q18 (bài đỏ trước + đột biến), rồi `/ra-soat` mới → `/soat-bao-mat` → cổng → báo cáo 7 mục.
- Chưa chạy (đợi Q18 xong để soát một lần cho đủ): `/ra-soat`, `/soat-bao-mat`, `cong.js chay`, báo cáo 7 mục.

## Phát hiện (14.11)
- `CLAUDE.md` §3 / §9 vẫn ghi "119 phép" của bản mẫu (nay 156) — máy không sửa CLAUDE.md.
- `layMaKhachMoi` (ví "mã khách mới" DỮ LIỆU CŨ, `ma_khach_moi` của `/kh/voucher`) chưa lọc đơn gốc huỷ (P20b) — App có thể hiện mã cũ mà ô mã từ chối. Chỉ dữ liệu
  trước VOUCHER-2; không sửa trong lượt này (LUAT §6.6 — ghi Phát hiện).

### Dừng (14.11, lần 2) — chờ chủ quán trả lời Q21 (Q18).

## Phiên 14.11 (lần 3) — lệnh "VOUCHER-2 tiep": Q18 theo Q21 → soát → soát bảo mật → cổng → báo cáo
### Bước 1 — đối chiếu bản chụp
- Hook mở phiên báo "máy và origin lệch nhau". Nhánh `viec/VOUCHER-2`, cây sạch. HEAD `e94708f` · FETCH_HEAD `57b8f99`; kho nông → `git fetch -q --unshallow`
  → so lại: HEAD là tổ tiên (phiên nạp bản chụp cũ) → `git pull --no-rebase --ff-only origin viec/VOUCHER-2` → HEAD `57b8f992`.
- `git log --oneline -3`:
  ```
  57b8f992 PHIEU: VOUCHER-2 tra loi Q21 (Q18 moc 30 phut) + dong y 3 dieu tu quyet — chu quan 14.11
  500d6f9e VOUCHER-2: trang thai phien 14.11 lan 2 - Q15, vong sua 1, Q16/Q17/Q19 xong; cau hoi Q21 (Q18 moc thoi gian), dung truoc soat
  14a1f991 VOUCHER-2: bang chung Q16/Q17/Q19 (goc 43b76314 115/10, va 125/0, dot bien 82/82), SO CA 125
  ```
### Q18 — đã làm
- `server/routes/signup-codes.js` `kiemKhachLanDau(phone, dong)`: ngoài luật Q9 (hồ sơ tạo SAU bill), nhận thêm khi đủ CẢ BA — (1) `order_customer_phone` của
  bill = SĐT nhận (`laDonDauCuaKhach`); (2) không có `pos_orders` của SĐT với `id <` đơn in bill; (3) `created_at ≥ lúc in − PHUT_HO_SO_TRUOC_BILL` (30, hằng
  có tên; tính cả đúng mốc). Lời gọi duy nhất đổi tham số thành dòng mã bill. Hợp đồng `/api/kh` v15 ghi luật 30 phút (chưa gộp main — không tăng số).
- Bài `thu_VOUCHER2` Q18a–f (viết trước, commit 640952ae): gốc 128 · 3 (Q18a, b, f đỏ) → vá 131 · 0.
- Quyết định nhỏ theo đúng chữ Q21 (2): "đơn nào trước đơn in bill" đếm MỌI đơn của SĐT kể cả đơn đã huỷ (chặt hơn — an toàn tiền); đơn SAU bill không chặn (Q18f).

| Chỗ vá | Đột biến |
|---|---|
| signup-codes.js kiemKhachLanDau ngoại lệ 30 phút (Q18) | BV-V2-Q18-MOC · VS-V2-Q18-KHONG-TRAN · VS-V2-Q18-MOC-NGAT · VS-V2-Q18-MOC-PHUT |
| signup-codes.js laDonDauCuaKhach | BV-V2-Q18-DON-TRUOC · VS-V2-Q18-DON-KHAC · BV-V2-Q18-BILL-SDT |

### /ra-soat (14.11 lần 3 — một lần cho vòng sửa 1 + Q15–Q19 + Q18; agent độc lập, base 171109f) — báo cáo NGUYÊN VĂN
```
KHÔNG ĐẠT

Tóm tắt dễ hiểu: mình đọc phần máy chủ của nhánh (đường tiền, voucher, giữ chỗ, mã bill, đối soát) và chạy bộ kiểm `--day-du` (PASS 118 · FAIL 0 · CẢNH BÁO 1, bản dựng dist khớp src). Có 2 lỗi chặn: (1) đua HAI PHIÊN QR cùng một voucher không có bài thử. Mình đã phá thử dòng chặn đó trên bản chép và bài vẫn 131 đạt · 0 hỏng. (2) Điểm tích lũy của đơn trộn gói/thẻ + món có giảm vẫn chia theo luật cũ, lệch với luật Q7. File đó nằm ngoài Phạm vi, nên phải hỏi chủ quán.

LỖI TÌM ĐƯỢC:
- server/utils/giuCho.js:79-80 (giuKhac — phiên khác đang giữ, đọc lại TRONG giao dịch tạo phiên) — không bài nào phủ vế này. Mình chép server/ + client/src + cong_cu/gia_lap vào thư mục nháp, đổi dòng 80 thành `if (false && giuKhac.length)` rồi chạy `node cong_cu/thu_VOUCHER2.js --may-chu <nháp>/server`. Kết quả **131 đạt · 0 hỏng**, tức đột biến SỐNG. Q16a tạo phiên thứ hai TUẦN TỰ nên bị phép ngoài giao dịch (xetVoucherConDung, voucherCode.js:~118) bắt trước. Q16d chỉ đua theo hai hướng "phiên ↔ đơn quầy". BV-V2-GIU-PHIEN-TX (dot_bien.py:116) tắt cả khối nên chỉ bị "đua ngược" (daTieu) bắt. Hậu quả nếu dòng này hỏng: hai khách cùng chuyển khoản cho một voucher chia sẻ; người chốt sau lỗi VOUCHER_DA_DUNG trong khi tiền đã về. Cần ca: mocTruocTx = phienCk(A,[v]) chen vào lúc phienCk(B,[v]) mở giao dịch → B phải 400 VOUCHER_DANG_GIU, và một đột biến riêng cho dòng 80. — K3
- server/utils/diemThat.js:27-32 (tienHangDiem) — hàm này vẫn chia (total − phí giao) theo tỉ lệ giá MỌI dòng. Trong khi đó đơn có cờ giam_mon_thuong = 1 (orders.js:1060) đã đổi sang luật Q7: dòng gói / thẻ / nạp trả đủ giá, giảm chỉ nằm trên món thường (tienDaTra.js:19-30). Mình tính thử bằng `node -e`: gói 300.000 (tắt điểm) + món 50.000, mã 10% món, total 345.000 → tienHangDiem ra **49.285**, số đúng theo Q7 là 45.000 (cộng điểm dư). Chiều ngược lại (gói bật, món tắt) ra 295.714 thay vì 300.000 (thiếu điểm). orders.js:994 lưu số này vào tien_hang_diem, và mọi lối cộng / trừ điểm đọc nó. Chú thích diemThat.js:23-25 ghi "Cùng quy tắc chia theo dòng của tienDaTraTheoDong" nay đã sai (K1). diemThat.js không có trong Phạm vi → phải là Câu hỏi, không tự sửa. Việc này đụng điểm nên không thuộc diện "lỗi nhẹ" của LUAT §6.5. — K4 (đổi luật chia theo PHẦN mà chưa rà hết các hàm chia)
- server/routes/orders.js:1165-1169 — câu `UPDATE pos_voucher_grants … WHERE UPPER(code)=UPPER(finalDiscountCode)` nay là code chết. orders.js:640-644 đã tách mọi mã có grant sang voucher, nên finalDiscountCode không bao giờ còn là mã voucher. Chú thích "P26c (D4): voucher đổi điểm của mã này chuyển 'used'" cũng không còn đúng. — K1 / Đơn giản (LUAT §3 "không để code chết")
- server/utils/doiSoat.js:134-136 — chú thích ghi "Cùng nguồn với Báo cáo mã giảm (reports.js by_voucher / total_ship_discount)", nhưng hai bên định nghĩa khác nhau. Đối soát `da_giam` GỒM voucher gõ ở ô mã và BỎ voucher ship. reports.js:332-338 `by_voucher` thì BỎ voucher ô mã (`<> discount_code`) và GỒM voucher ship. Tổng hai màn sẽ không bằng nhau, trong khi nghiệm thu I ghi "Đối soát voucher khớp". — K1 / K4

NGHI NGỜ:
- signup-codes.js:118-121 laDonDauCuaKhach đếm MỌI đơn trước bill, kể cả đơn đã huỷ (trang_thai.md: "quyết định nhỏ… chặt hơn"). Luồng quầy hay gặp: bấm nhầm, huỷ đơn đầu rồi bấm lại cho đúng khách mới. Đơn bấm lại sẽ bị KHACH_DA_CO_TAI_KHOAN, còn mã bill của đơn huỷ thì đã DON_DA_HUY → khách mới mất ưu đãi. Đây là K5 chặn oan khả dĩ. Chủ quán chưa quyết điểm này (CLAUDE.md §9: không tự quyết thay) → nên hỏi.
- giuCho.js:76-77: trong giao dịch tạo phiên chỉ xét `g.status`, không xét `used_count/usage_limit` của mã. Ca G4c cho thấy hai cột có thể lệch, khi đó phiên giữ một voucher đã hết lượt và lúc chốt mới lỗi. Mức nhẹ.
- orders.js:784 + giuCho.js:122: phiên chốt muộn kiểu ép (`? = 1 AND trang_thai IN ('cho','huy')`) vẫn xét hạn theo ngày tạo phiên. Nếu voucher đã nhả và bị đơn khác dùng thì tiền đã về mà đơn 400. Khuôn này có từ trước (mã chung cũng vậy), nhưng chưa có ca nào cho voucher.
- Ba giới hạn số voucher lệch nhau: orders.js:635 (≤ 20), donApp.js:104 (≤ 10), settings.js:167 (1–10). MauVoucher.jsx:66 lưu voucher_toi_da qua PUT /settings (cần manage_settings), còn mẫu chỉ cần manage_promotions → người quản lý khuyến mãi lưu mẫu được nhưng lưu N thì bị 403.
- Tiền voucher mới chưa có bất biến đối soát theo từng đơn, kiểu Σ so_tien_giam (không ship) + mã + flash + hạng = discount, Σ ship = giam_ship. Q19 mới cộng tổng ngày. LUAT §5 đòi "quy tắc đối soát" cho tính năng tiền mới.

NGHIỆM THU: 14/16 mục có bằng chứng · mục thiếu: G ("hai đơn cùng lúc dùng một voucher → một đơn": hai ĐƠN có G4/G4b/G4c, hai PHIÊN thì không có ca, đột biến sống như trên) · Q16 (vế "voucher đang giữ không dùng được ở phiên khác" khi đua — cùng lỗ). Thêm một mục có bằng chứng nhưng định nghĩa lệch: I (Đối soát và Báo cáo dùng hai định nghĩa voucher khác nhau). Mục có bằng chứng (bang_chung_do.txt + thu_VOUCHER2.js): A (A1–A4, A4/Q2m màn thật) · B (B1–B3) · C (C1–C9) · D (D1–D2) · E (E1–E6) · F (F1–F7b) · H (H1–H5) · K5 (K1–K3, K5, C8b, Q16b) · Q14 (Q14a–e, chạy màn thật) · Q15 (E9 đỏ → xanh, VS-V2-E9-PHAT-TRUOC) · Q17 (Q17a–b) · Q18 (Q18a–f, gốc 128·3 → 131·0) · Q19 (máy chủ + màn, số tính tay 18.800 / 8.000) · vòng sửa 1 (Q2 chạy hết trên gốc 84·28, Q2o scope theo mẫu, chú thích diemKhach.js:66-71 đã sửa).
Đã kiểm thêm: P1 — `node kiem_tra_truoc_khi_giao.js --day-du` ra "✓ dist đã commit KHỚP với src hiện tại", PASS 118 · FAIL 0 · CẢNH BÁO 1. Đường tiền (P3/P4): không thấy trường tiền nào lấy từ client. Giá, phí giao (baoPhiGiao), voucher (tra pos_voucher_grants JOIN pos_discount_codes), N, chính chủ (khách lấy từ phone của đơn / token App) đều do máy chủ tra. Câu tiêu voucher orders.js:1180-1189 có điều kiện chặn đua ngay trong câu ghi và kiểm `changes`. traLuotMa (tienDaTra.js:65-73) trả mọi grant + lượt mã, không trả hai lần mã trùng ô mã. Nạp + voucher bị chặn ở orders.js:240.

CHƯA SOÁT ĐƯỢC: chưa chạy cả bộ đột biến `dot_bien.py` (đang có tiến trình nền) và `node tu_chay/cong.js chay`. Chưa chạy `bash ban_mau_pos/chay_thu.sh`. Chưa đọc hết thu_VOUCHER2.js (1.298 dòng — mới đọc khung, G4, Q16, Q17), MauVoucher.jsx, ban_mau_pos.html, các bài cũ sửa (P20, KH1, P26c, GOI1…) từng ca, và toàn bộ HOP_DONG_API_KH.md. Chưa kiểm tem cốc / phiếu pha chế có thật không đổi. Chưa đo đua thật trên Turso (bài dùng libsql file + móc mocTruocTx). Chưa soát bảo mật riêng (/soat-bao-mat). Ghi chú: trong bộ kiểm, thu_VOUCHER2 chạy xong trong 7,3 s, khác hẳn mức 2–4 phút khi chạy riêng — chưa rõ vì sao.

BÀI HỌC:
- KHOÁ: mỗi phép "đọc lại trong giao dịch" phải có MỘT ca đua tất định chen đúng vào giao dịch đó, kèm đột biến chỉ xoá đúng vế ấy (không tắt cả khối). Kiểu phép trước đây là "phiên ↔ phiên", còn bài mới phủ "phiên ↔ đơn". Có thể thành phép tĩnh cho dot_bien.py: mỗi `return … loi(` trong khối Q16 có một tên đột biến riêng.
- NGUYÊN TẮC (bổ sung K4 vào KHUON_LOI.md): đổi luật chia tiền theo dòng (tienDaTraTheoDong) → grep mọi hàm khác chia theo dòng (`tienHangDiem`, `tienHoanTinhDiem`, chú thích "cùng quy tắc chia"), kể cả file ngoài Phạm vi. Ngoài Phạm vi thì ghi Câu hỏi, không im lặng.
- NGUYÊN TẮC: chú thích "cùng nguồn với X" giữa hai màn số tiền phải có một ca so BẰNG hai số đó.
- BỎ: nhánh grant theo finalDiscountCode (orders.js:1165-1169) đã chết sau khi tách voucher khỏi ô mã.
```

### Vòng sửa 2 (lỗi lần soát trên) — đã làm
- (1) giuCho.js vế `giuKhac` — code đúng, thiếu bài: ca **Q16f** (phiên A chen vào lúc phiên B mở giao dịch tạo phiên → B 400 `VOUCHER_DANG_GIU`, đúng 1 phiên chờ).
  Gốc 43b76314: ✗ Q16f (HTTP 200 / HTTP 200 · phiên chờ 2). HEAD: thu_VOUCHER2 **132 · 0**. Đột biến mới `BV-V2-GIU-PHIEN-KHAC` (chỉ xoá đúng vế đó) → BẮT ở Q16f.
- (3) orders.js nhánh grant theo `finalDiscountCode`: đã kiểm — đúng là luôn 0 dòng (mọi mã có dòng ví tách sang danh sách voucher, orders.js ~640). KHÔNG xoá: câu
  này là neo đột biến `BV-D4-bo-voucher-used` của `viec/P26c/dot_bien.py` (file việc khác — xoá thì đột biến đó HỎNG). Sửa chú thích cho đúng (khoá phòng thủ, 0 dòng).
- (4) doiSoat.js chú thích "cùng nguồn" → ghi đúng: cùng cột nguồn, KHÁC cách chia với Báo cáo mã giảm (Báo cáo: voucher ô mã nằm ở by_code, ship gộp; Đối
  soát: gồm voucher ô mã, ship tách dòng riêng). Hai màn không so từng dòng; tổng mỗi màn tự khớp với đơn (Q19 số tính tay).
- (2) diemThat.js — ngoài Phạm vi, đụng ĐIỂM → câu hỏi Q22 dưới. Đã tự kiểm lại (K1): `diemThat.js:27-32` chia theo tỉ lệ giá MỌI dòng; lời gọi duy nhất
  `orders.js:994`. Tính tay gói 300.000 (tắt điểm) + món 50.000, mã 10 % món, total 345.000 → floor(50.000 × 345.000 / 350.000) = 49.285 (đúng Q7: 45.000).
- `npm test -- --day-du` (HEAD e16ac6e3): **PASS 118 · FAIL 0 · CẢNH BÁO 1**.

| Chỗ vá | Đột biến |
|---|---|
| giuCho.js vế phiên khác đang giữ (trong giao dịch) | BV-V2-GIU-PHIEN-KHAC |

## Câu hỏi (14.11, lần 3) — mình DỪNG trước soát bảo mật; mọi phần trong Phạm vi đã xong và xanh
Việc này là gì: người soát độc lập tìm ra một chỗ ĐIỂM tích luỹ tính lệch với luật Q7 bạn đã duyệt, nằm ở file ngoài Phạm vi; và một chỗ chặn khách mới có thể
oan ở Q18. Luật kho: đụng điểm / ngoài Phạm vi / chỗ bạn chưa chốt → hỏi, không tự sửa.
- **Q22 — điểm của đơn trộn (gói / thẻ / nạp + món có mã giảm). Đề xuất: đồng ý thêm `server/utils/diemThat.js` vào Phạm vi.**
  Hiện tại: từ VOUCHER-2, tiền "đã trả" của đơn trộn theo Q7 (gói trả đủ giá, mã chỉ giảm món), nhưng phần "tiền tính điểm" lưu lúc bán vẫn chia kiểu cũ
  (chia đều giảm cho mọi dòng). Ví dụ tính tay: gói 300.000 (không tích điểm) + món 50.000, mã 10 % món → khách trả 345.000; điểm đang tính trên **49.285**
  thay vì **45.000** (dư điểm); chiều ngược lại (gói tích điểm, món không) tính 295.714 thay vì 300.000 (thiếu điểm). Đơn không mã / không gói: y hệt trước.
  Sửa đề xuất: `tienHangDiem` thêm một tham số MẶC ĐỊNH (đơn có cờ mới) — dòng gói / thẻ / nạp tính đủ giá, phần giảm chỉ chia trên món thường; `orders.js:994`
  truyền cờ; đơn cũ không đổi (số đã lưu). Bài thử đỏ trước với đúng hai bộ số tính tay trên + đột biến; ~10 dòng code.
- **Q23 — Q18 điều (2) "SĐT chưa có đơn nào trước đơn in bill": có tính đơn ĐÃ HUỶ không? Đề xuất: KHÔNG tính đơn đã huỷ.**
  Lý do: quầy bấm nhầm → huỷ đơn đầu → bấm lại đơn đúng cho khách mới; nếu tính cả đơn huỷ thì khách mới bị báo "đã có tài khoản" oan (mã của đơn huỷ cũng
  không dùng được). Đơn huỷ không có tiền nên không ai lợi được. Hiện mình đang làm theo đúng chữ (tính cả đơn huỷ — chặt hơn). Đồng ý thì thêm ca thử
  "đơn trước đã huỷ → vẫn nhận" + đột biến (~1 dòng code).
Bạn trả lời Q22 + Q23 thì phiên sau mình làm hai chỗ đó (bài đỏ trước), rồi `/soat-bao-mat` → cổng → báo cáo 7 mục.

## Phát hiện (14.11, lần 3 — từ lần soát, không sửa trong lượt này)
- Giới hạn số voucher gửi lệch nhau: `orders.js` nhận ≤ 20 mã, `donApp.js` ≤ 10, Cài đặt N 1–10 — đều chặn trước khi tính nên không lố tiền (N thật vẫn chặn
  `VUOT_SO_VOUCHER`); chỉ khác lời báo. Nên gom một hằng sau.
- `MauVoucher.jsx` lưu N qua `PUT /settings` (quyền manage_settings) còn mẫu chỉ cần manage_promotions → quản lý khuyến mãi lưu được mẫu nhưng lưu N bị 403.
- Phiên chuyển khoản tạo trong giao dịch chỉ xét `status` của dòng ví, không xét `used_count` của mã (G4c: hai cột có thể lệch — câu tiêu lúc chốt vẫn chặn).
- Chưa có bất biến đối soát TỪNG ĐƠN cho voucher (Σ so_tien_giam không ship + mã + flash + hạng = discount; Σ ship = giam_ship) — Q19 mới có tổng ngày.

### Dừng (14.11, lần 3) — chờ chủ quán trả lời Q22 + Q23. Chưa chạy: `/soat-bao-mat`, `cong.js chay`, báo cáo 7 mục.

## Phiên 14.11 (lần 4) — lệnh "VOUCHER-2 tiep": Q22 + Q23 → soát lần 4 → soát bảo mật → cổng → báo cáo
### Bước 1 — đối chiếu bản chụp
- Hook mở phiên báo "máy và origin lệch nhau". Nhánh `viec/VOUCHER-2`, cây sạch. HEAD `e94708f` · FETCH_HEAD `9f20388`; kho nông → `git fetch -q --unshallow`
  → so lại: HEAD là tổ tiên (phiên nạp bản chụp cũ) → `git pull --no-rebase --ff-only origin viec/VOUCHER-2` → HEAD `9f20388c`.
- `git log --oneline -3`:
  ```
  9f20388c PHIEU: VOUCHER-2 Pham vi them diemThat.js, tra loi Q22 + Q23 — chu quan 14.11
  306cbe4e VOUCHER-2: ra-soat 14.11 lan 3 (KHONG DAT) nguyen van, vong sua 2, SO CA 132, cau hoi Q22 (diemThat ngoai pham vi) + Q23, dung
  e16ac6e3 VOUCHER-2: vong sua 2 - chu thich dung (orders.js nhanh voucher o ma, doiSoat.js khac cach chia voi bao cao)
  ```
### Q22 + Q23 — đã làm (bài đỏ trước: commit fb1e7a49; vá: 8216fad6)
- **Q22** `server/utils/diemThat.js` `tienHangDiem(dongDon, tienHang, giamMonThuong = false)`: có cờ → dòng gói / thẻ / nạp (product_id < 0) tính đủ giá, phần còn lại
  chia trên món thường (cùng luật Q7 với `tienDaTraTheoDong`); không có dòng nào như vậy hoặc không cờ → NGUYÊN công thức cũ. `orders.js` (lời gọi duy nhất) truyền
  `true` (mọi đơn mới ghi `giam_mon_thuong = 1`). Đơn cũ không đổi (số đã lưu trong `tien_hang_diem`). Chú thích "cùng quy tắc chia" sai (K1) sửa cùng chỗ.
  K4: `tienHoanTinhDiem` không chia theo giá dòng (đọc số tiền thật đã trả vào ví) → không cùng khuôn, không đổi.
- **Q23** `signup-codes.js` `laDonDauCuaKhach`: `AND status != 'cancelled'`. Chú thích + hợp đồng v15 (chưa gộp main — không tăng số) ghi cùng.
- Bài `thu_VOUCHER2`: gốc 134 · 3 (Q22a, Q22b, Q18g đỏ) → vá **137 · 0**. Ca Q22c / Q22d / Q18d là ca giữ hành vi (xanh trên gốc, khoá bằng đột biến).

| Chỗ vá | Đột biến |
|---|---|
| orders.js truyền cờ Q22 | BV-V2-Q22-CO |
| diemThat.js tienHangDiem mặc định / dòng đủ giá / chia trên món | VS-V2-Q22-MAC-DINH · VS-V2-Q22-BO-DU-BAT · VS-V2-Q22-CHIA-CA-DON |
| signup-codes.js laDonDauCuaKhach bỏ đơn huỷ (Q23) | BV-V2-Q23-HUY · VS-V2-Q23-BO-CA-DON-THAT |

- Neo hai đột biến Q18 cũ (`BV-V2-Q18-DON-TRUOC`, `VS-V2-Q18-DON-KHAC`) đổi theo câu SQL mới — vẫn BẮT Q18d / Q18f (K4 "đổi câu → grep neo đột biến").
- Người gác chặn: `[B-CHUONGTRINH]` vòng `for` khi `git add` → tách lệnh; `[B-PHANTICH]` heredoc python rồi chạy script cùng lệnh → sửa bằng Edit, chạy riêng.

### /ra-soat (14.11 lần 4 — phần Q22 + Q23 + mọi chỗ đổi từ 306cbe4e; agent độc lập) — báo cáo NGUYÊN VĂN
```
Phần sửa lần này chạy đúng: điểm của đơn có gói hoặc thẻ đi kèm mã giảm giờ được tính theo đúng luật Q7, và đơn trước đã huỷ không còn làm khách mất voucher khách mới nữa. Mình chạy thử lại đột biến BV-V2-Q23-HUY thì bài vẫn bắt được, và tự tính tay các bộ số thì ra khớp. Tuy vậy kết quả là KHÔNG ĐẠT, nhưng chỉ ở mức nhẹ: bài thử Q22 còn hở hai chỗ (không có bộ số lẻ phải làm tròn, không có ca thẻ hạng hay nạp tiền), cùng một dòng chú thích đầu file signup-codes.js chưa ghi Q23. Chỉ cần thêm ca thử và sửa chú thích, không phải sửa code tính tiền.

KHÔNG ĐẠT  (nhẹ: chỉ thiếu ca thử và một dòng chú thích; code tính điểm đúng khi mình tự tính tay)

LỖI TÌM ĐƯỢC:
1. cong_cu/thu_VOUCHER2.js:598-622 (ca Q22a–d) — nhánh MỚI của tienHangDiem (server/utils/diemThat.js:36-37) chưa bao giờ phải làm tròn số lẻ.
   Q22a: 50.000×45.000/50.000 = 45.000 chẵn. Q22b: phần món bật = 0. Q22c: chẵn. Q22d chỉ chạy nhánh cũ (49.285).
   → Đột biến đổi Math.floor thành Math.ceil hoặc Math.round ở dòng 37 sẽ sống sót.
   Trái luật KHUON_LOI "Bổ sung 11.11 · K3": tiền / điểm qua chia rồi làm tròn phải có bộ số đi qua phân số lẻ, so với số tính tay.
   Bộ số đề xuất (mình đã tính tay và chạy node): thẻ 100.000 bật + M1 33.333 ×3 (2 bật, 1 tắt) + mã 10.000 → tienHang 189.999,
   tien_hang_diem = 100.000 + floor(66.666×89.999/99.999) = 100.000 + floor(59.999,4) = 159.999. Hàm hiện trả đúng 159.999.
   — khuôn K3.
2. cùng chỗ (Q22a–d) — phiếu Q22 (phieu.md:183) hứa "dòng gói / thẻ / nạp tính đủ giá", nhưng mọi ca chỉ dùng gói (product_id = −goiId).
   Cột tien_hang_diem chỉ được đọc trong khối Q22 (grep thấy 4 lần trong thu_VOUCHER2.js, đều ở Q22), còn bat_bien.js:161-162 chỉ đọc lại số đã lưu.
   → Đột biến thu hẹp vị từ ở diemThat.js:31 về "chỉ gói" (product_id < 0 && > ID_THE_TU) sống sót.
   Cần một ca thẻ hạng + món + mã (gộp được với bộ số ở mục 1).
   — khuôn K4 (tài liệu hứa theo đối tượng thì phép phải phủ đủ đối tượng) / K3.
3. server/routes/signup-codes.js:9-10 — chú thích đầu file vẫn ghi "chưa có đơn trước (Q18)" mà không có "đơn đã huỷ không tính — Q23".
   Các chỗ :108, :120 và hợp đồng :80, :397 đã sửa, riêng câu cùng nghĩa này sót.
   — khuôn K4 (sửa một câu tài liệu thì grep cả file).
4. (giao nhận) Commit 3d455b5f (dot_bien.py, chỉ đổi khoảng trắng) chưa đẩy: `git log origin/viec/VOUCHER-2..HEAD` không rỗng.
   Có thể do việc đang làm dở; cần đẩy trước khi báo xong.
   — khuôn K7.

NGHI NGỜ:
- diemThat.js:26 + :35 ghi "cùng luật Q7 với tienDaTraTheoDong" / "như tienDaTraTheoDong". Luật chia thì cùng, nhưng cách làm tròn khác:
  tienHangDiem làm tròn tổng một lần, tienDaTra.js:30 làm tròn từng dòng. Ví dụ ở mục 1: 159.999 so với tổng da_tra các dòng bật 159.998, lệch 1đ.
  Hiện vô hại: truDiemHoan làm tròn LÊN qua diemTruKhiHoan (diemThat.js:64-69), nên hoàn hết vẫn trừ đủ điểm. Câu chú thích nên nói rõ chỗ khác này.
- signup-codes.js:120 `status != 'cancelled'`: đơn có status NULL cũng bị bỏ qua, vì trong SQL so sánh với NULL ra NULL.
  database.js:216 cho phép NULL (chỉ có mặc định 'completed'). Nếu dữ liệu cũ hay kho phục hồi có đơn status NULL thì đơn đó bị coi là "không có",
  tức là nới chứ không siết. Không có đường ghi nào sinh NULL (orders.js:1062 là INSERT duy nhất, luôn ghi 'completed').
  Viết `status IS NOT 'cancelled'` thì kín hơn.
- Đơn 'refunded' (refunds.js:166) và đơn dở dang vẫn tính là "đã có đơn". Đây là hướng an toàn (siết), đúng chữ Q23 "đơn đã huỷ".
  Đơn bị XOÁ (orders.js:1989 DELETE) tự nhiên không tính, như trước. Không cần hỏi, chỉ ghi lại để biết.
- Dòng gói nạp không có tich_diem (orders.js:568-579), nên batDiem = bật và phần nạp được tính đủ vào tien_hang_diem.
  Đơn nạp đã chặn điểm ở orders.js:1003 (diemTao = null), không phải lỗi mới; nhưng sau này đọc lại tien_hang_diem của đơn nạp sẽ thấy số cao.

NGHIỆM THU:    12/12 mục có bằng chứng · mục thiếu: không
  - A–I, K5: các khối muc('[A]'…'[K5]') có ở thu_VOUCHER2.js:301, 373, 398, 500, 512, 549, 625, 696, 739, 1320.
    Riêng G (vế đua phiên): Q16f có ở thu_VOUCHER2.js:1244-1251; BV-V2-GIU-PHIEN-KHAC có ở dot_bien.py:81.
  - Q22: Q22a/b đỏ trên gốc (bang_chung_do.txt:251-253), có 4 đột biến (dot_bien.py:91-95).
    Bằng chứng có, nhưng chất lượng chưa đủ — xem LỖI 1–2.
  - Q23: ca Q18g ở thu_VOUCHER2.js:1004-1013. Mình chạy lại `python3 viec/VOUCHER-2/dot_bien.py BV-V2-Q23-HUY` trong lượt này:
    ĐỐI CHỨNG 137 · 0, BẮT Q18g ("HTTP 400 · KHACH_DA_CO_TAI_KHOAN"). Q18d (đơn trước chưa huỷ vẫn bị chặn) được khoá bằng VS-V2-Q23-BO-CA-DON-THAT.

Kết quả từng mục soát:
  1. K3: Q22a, Q22b, Q18g đỏ trên gốc, đỏ đúng câu kết luận (bang_chung_do.txt:251-253). Ca so số đã lưu trong cơ sở dữ liệu, không dò marker.
     Hở hai chỗ như LỖI 1–2.
  2. K4: tienHangDiem chỉ có MỘT chỗ gọi (orders.js:994).
     - Cờ `true` khớp giam_mon_thuong = 1 viết cứng trong INSERT duy nhất (orders.js:1062; grep "INSERT INTO pos_orders" ra 1 chỗ).
     - Vị từ "đủ giá" ở diemThat.js:31 giống tienDaTra.js:19.
     - Các nơi đọc tien_hang_diem (tienTinhDiem diemThat.js:45-50, tienHoanTinhDiem :79-95, bat_bien.js:161-175) chỉ đọc số đã lưu, không chia theo dòng, nên không cần đổi.
     - laDonDauCuaKhach chỉ một chỗ (signup-codes.js:118, gọi ở :128).
     - Chỗ tài liệu sót: LỖI 3.
  3. K5:
     - Đơn không có dòng gói / thẻ / nạp → nhánh cũ nguyên (diemThat.js:34).
     - Gói + món không có mã: tienHang = tong nên kết quả bằng bat như cũ. Tương tự với giá hạng / flash, vì các giá đó đã nằm trong tong (orders.js:608, :832, trước :994).
     - Chỉ gói hoặc gói + lấy ngay (tongMon = 0) → batDu, như cũ (node: 300.000).
     - Q22c khoá trường hợp gói + món đều bật.
     - Q23 chỉ nới cho hồ sơ tạo trong 30 phút trước bill; lần nhận thứ hai bị chặn ở SDT_DA_NHAN (signup-codes.js:370), đơn bill bị huỷ bị chặn ở kiemDonCuaMa (:376).
     - Không thấy luồng hợp lệ nào bị chặn oan.
  4. K1: các câu trong trang_thai.md lần 4 mình đều kiểm lại được, trừ câu "cùng luật Q7" (xem NGHI NGỜ):
     - "lời gọi duy nhất" — grep.
     - "mọi đơn mới ghi = 1" — orders.js:1062.
     - "tienHoanTinhDiem không cùng khuôn" — diemThat.js:79-95.
     - "v15 chưa gộp main" — 171109f có PHIEN_BAN 14.
  5. Đường tiền: tienHang = total − phiKhachTra, đều do máy chủ tính. Giá dòng do máy chủ tra (orders.js:474, 515, 568). Không có trường nào lấy theo số máy khách gửi.
  6. P1: `git diff 306cbe4e HEAD -- client/` rỗng.
  8. Đơn giản:
     - orders.js:994 `true` và orders.js:1062 `1` là hai chữ viết cứng cho cùng một sự thật. Một hằng có tên (vd GIAM_MON_THUONG = 1) dùng ở cả hai chỗ thì không thể lệch nhau. Nhỏ.
     - Nhánh mặc định false (diemThat.js:29, :34) không có chỗ gọi nào trên production. Nhánh này giữ theo lệnh chủ quán, nên không tính là thừa.

CHƯA SOÁT ĐƯỢC:
- Không chạy lại toàn bộ thu_VOUCHER2 trên gốc và HEAD, cũng không chạy 7 đột biến còn lại, vì bộ đầy đủ đang chạy nền. Mình chỉ chạy lại BV-V2-Q23-HUY (bắt được).
- Chưa dựng thật hai đột biến làm tròn và "chỉ gói" để thấy chúng sống. Kết luận sống sót dựa vào đọc code: Q22 chỉ có số chẵn, và chỉ khối Q22 đọc tien_hang_diem.
- Chưa chạy npm test / --day-du / cong.js chay.
- Không kiểm được dữ liệu production: có đơn status NULL hay không.

BÀI HỌC:
- KHOÁ: đột biến nới làm tròn (floor → ceil) cho mọi hàm chia tiền / điểm mới, phải BẮT được — buộc bài thử có bộ số lẻ.
  Đây là luật K3 11.11 đã ghi bằng lời mà không có máy canh.
- KHOÁ: phép chia theo loại dòng (product_id < 0) phải có đột biến "thu hẹp về một loại" cho từng loại phiếu kể (gói / thẻ / nạp).
- NGUYÊN TẮC (K1): viết "cùng luật với hàm X" thì phải nói rõ cả cách làm tròn có giống X không (tổng một lần hay từng dòng).
- NGUYÊN TẮC (K4): thêm điều kiện "trạng thái != X" vào SQL thì xét cột cho phép NULL (dùng IS NOT), và liệt kê đủ các trạng thái còn lại (refunded, xoá hẳn).
```
(Mục 4 — commit 3d455b5f: đã đẩy ngay sau đó, `git log origin/viec/VOUCHER-2..HEAD` rỗng.)

### Vòng sửa 3 (lỗi soát lần 4 — đều nhẹ, không đổi cách tính tiền / điểm)
- (1)+(2) ca **Q22e**: THẺ HẠNG + M1 × 2 bật + M2 tắt + mã 10.000 → số tính tay 158.973 (qua phân số lẻ 58.973,71). Đỏ trên gốc 9f20388c (157.737).
  Đột biến `VS-V2-Q22-LAM-TRON` (floor → ceil → 158.974) và `VS-V2-Q22-CHI-GOI` (vị từ chỉ gói → 157.737) đều BẮT. Nạp: đơn nạp + mã / voucher bị chặn
  (`NAP_CHI_TIEN_MAT_QR`, ca F4) và đơn nạp không cộng điểm → không có bộ số nạp nào chạy tới nhánh này qua đường bán; vị từ chung `product_id < 0` phủ.
- (3) chú thích đầu `signup-codes.js` ghi Q23.
- Nghi ngờ status NULL → làm: `status IS NOT 'cancelled'` + ca **Q18h** (đỏ trên bản `!=` 8216fad6) + đột biến `VS-V2-Q23-NULL-LOT` BẮT.
- Nghi ngờ "cùng luật Q7" → chú thích `diemThat.js` nói rõ làm tròn MỘT lần trên tổng (khác tienDaTraTheoDong từng dòng), vô hại vì trừ điểm làm tròn lên.
- Không làm (ghi Phát hiện): hằng có tên chung cho `giam_mon_thuong` (orders.js `true` ở lời gọi + `1` trong INSERT) — nhỏ; `tien_hang_diem` đơn nạp tính đủ (đơn nạp 0 điểm).
- thu_VOUCHER2 **139 · 0**; `npm test -- --day-du`: PASS 118 · FAIL 0 · CẢNH BÁO 1. Đột biến đầy đủ trước vòng 3: 96/96; vòng 3: 7/7.
- Hết 3 vòng sửa: lần soát cuối chỉ lỗi NHẸ (ca thử + chú thích; code điểm đúng theo tính tay của người soát) → LUAT §6.5: không gọi soát nữa.
  SOÁT LẦN CUỐI: chat soát thay

| Chỗ vá | Đột biến |
|---|---|
| diemThat.js làm tròn / thẻ hạng là dòng đủ giá | VS-V2-Q22-LAM-TRON · VS-V2-Q22-CHI-GOI |
| signup-codes.js status NULL vẫn tính | VS-V2-Q23-NULL-LOT |
