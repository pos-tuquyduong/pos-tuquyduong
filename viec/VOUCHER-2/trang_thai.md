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
Xem `ke_hoach.md` mục 9 (Q1–Q6) — cần chủ quán trả lời cùng lúc duyệt kế hoạch.

## Soát kế hoạch (agent phụ chỉ đọc, bước 3)
Bắt 2 lỗi NẶNG (traLuotMa thoát sớm khi đơn chỉ có voucher; 3 chỗ đọc shipping_fee) + 4 vừa — đã kiểm lại trên code, ghi vào
`ke_hoach.md` mục 10. DỪNG chờ chủ quán duyệt kế hoạch + trả lời Q1–Q6 (Q5 nay 7 file).
