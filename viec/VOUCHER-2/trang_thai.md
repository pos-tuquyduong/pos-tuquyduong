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
