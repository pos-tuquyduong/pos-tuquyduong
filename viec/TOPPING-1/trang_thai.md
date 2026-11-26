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
Xem `ke_hoach.md` mục **8** và **10** (Q1 xin thêm Phạm vi — 8 file; Q2–Q7 xác nhận đề xuất tiền / điểm / hiển thị). Kế hoạch chờ chat duyệt.
Agent phụ soát kế hoạch (4 câu) — đã nhận hết vào mục 10.

## Sự cố
- Stop hook báo `npm test` đỏ: `thu_BH2.js` G1 `fatal: bad revision 'cbbb809..HEAD'` — kho mở từ bản chụp NÔNG (`--is-shallow-repository` = true),
  không phải lỗi code. Đã `git fetch -q --unshallow origin viec/TOPPING-1` (chỉ tải lịch sử, không đổi file) → `cbbb809` có mặt; chạy lại `npm test`.

## Phát hiện
- Người gác không cho `git fetch origin main` (luật GIT-KEO: chỉ kéo nhánh việc) → máy KHÔNG biết NHOM-MON-1 đã gộp chưa. Nhánh này dựng trên
  main `acc8892`; ở `acc8892` NHOM-MON-1 chưa có (BanHangMoi.jsx:337 nhóm theo `p.category`, kh/index.js:44 `nhom: p.category`). Nếu NHOM-MON-1
  gộp trước, chat cho máy biết để gộp nhánh việc từ main (máy không tự `git merge`).
