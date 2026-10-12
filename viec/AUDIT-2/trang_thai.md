# AUDIT-2 — trạng thái

## Bước 1 — đối chiếu bản chụp (12.10.2026)
- nhánh: `viec/AUDIT-2`; `git status --short` sạch → kéo được.
- `git fetch origin viec/AUDIT-2` → HEAD `4d175bc` · FETCH_HEAD `4d175bc` (bằng nhau → không kéo).
- `git log --oneline -3`:
  ```
  4d175bc PHIEU: AUDIT-2
  43c793e TIEN-DO + LUAT: TU-CHAY-5 xong (6c281f5), mo P26c + AUDIT-2, them DOI-SOAT-1, dinh huong chu quan — so v27
  6c281f5 Merge pull request #14 from pos-tuquyduong/viec/TU-CHAY-5
  ```

## Tiến độ
- [x] Bước 1–2: đối chiếu, đọc phiếu + nguồn (AUDIT-1, HOC-2b D5, LUOI-1 C2, TU-CHAY-5 A/D5/D6/Phát hiện).
- [x] Bước 3: `ke_hoach.md` — **chờ chủ quán duyệt** (phiếu dặn dừng ở bước 3).
- [ ] Nhóm A · [ ] Nhóm B · [ ] Nhóm C · [ ] Nhóm D

## Số đo lúc lập kế hoạch
Xem `ke_hoach.md` mục 0 (đo riêng trong lượt này, máy mây 4 lõi).

## Câu hỏi
Xem `ke_hoach.md` mục 7 (chờ lời duyệt).

## Sự cố trong lượt lập kế hoạch (đầu vào bước 11)
- Đo mẫu AUDIT-1 in "✗ KHO BẨN": truy nguyên → chỉ do `viec/AUDIT-2/ke_hoach.md`, `trang_thai.md` tôi tạo TRONG lúc đo
  (khung lọc `viec/AUDIT-1/`); không sót thư mục tạm. → kế hoạch: bọc lọc thêm `viec/AUDIT-2/`, không ghi file khi đo.
- Người gác chặn (đúng luật): `nproc`, `until` (B-CHUONGTRINH); số học `$(( ))`, chuỗi `$'…'` (B-PHANTICH); `cd` giữa lệnh
  (B-CD-VITRI); script python có từ tiếng Anh chỉ "thẻ khoá" viết hoa (B-BIMAT-CHU). Đã viết lại lệnh đơn giản hơn.
- Agent soát kế hoạch bắt: D4 bundle tìm `sessionExpiredHandled` chứ không phải `POS-ERRHANDLING-v1` (tôi suy từ TÊN phép — K1).

## Phát hiện
(chưa có — việc chưa chạy đo)
