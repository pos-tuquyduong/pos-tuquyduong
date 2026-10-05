# HOC-2 — Trạng thái

## Bản chụp lúc mở việc (05.10.2026) — F1
`git branch --show-current` → `viec/HOC-2`. `git log --oneline -3`:
```
ba72a3f PHIEU: HOC-2
cb5d9fd TIEN-DO: HOC-2 chot 1b 2a 3a 4a, AU-G4 sang LUOI-1 — so v21
9d5327b TIEN-DO: AUDIT-1 xong (41fc639), them LUOI-1 + AUDIT-2, HOC-2 nhan phat hien NHE
```
Có commit `PHIEU: HOC-2`. Đã in ba dòng này trong câu trả lời đầu tiên để chủ quán đối chiếu GitHub.

## Tiến độ
- Bước 1–3 xong: đọc phiếu + code thật, viết `ke_hoach.md`, agent phụ soát kế hoạch (kết quả cuối `ke_hoach.md`).
- Phiếu dặn **chờ duyệt kế hoạch** → DỪNG ở bước 3. Chưa viết bài thử, chưa sửa code.

## Số đo lúc lập kế hoạch
`node kiem_tra_truoc_khi_giao.js --day-du` (máy mây, 05.10.2026, HEAD ba72a3f): PASS 65 · FAIL 0 · CẢNH BÁO 0;
`cong_cu/gia_lap/chay.js` 68,0 s; `cong_cu/thu_gia_lap.js` 73,3 s; `tu_chay/thu_cong.js` 48,1 s (hạn chayBaiThat 120 s).

## Câu hỏi
Xem `ke_hoach.md` mục "Câu hỏi cho chủ quán" (Q1 chặn cổng của chính PR này nếu không sửa phiếu; Q2–Q4 chọn phương án).
