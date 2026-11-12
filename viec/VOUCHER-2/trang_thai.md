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
