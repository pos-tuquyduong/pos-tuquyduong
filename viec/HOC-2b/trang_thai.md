# HOC-2b — Trạng thái

## Bản chụp lúc mở việc (07.10.2026) — F1
`git branch --show-current` → `viec/HOC-2b`. `git log --oneline -3`:
```
4a51723 PHIEU: HOC-2b
9ad7f99 TIEN-DO: HOC-2 xong (b681ede), HOC-2b mo phieu — so v23
b681ede Merge pull request #10 from pos-tuquyduong/viec/HOC-2
```
Có commit `PHIEU: HOC-2b`, cha là commit sổ v23 (`9ad7f99`). Đã in ba dòng này trong câu trả lời đầu tiên để chủ quán
đối chiếu GitHub.

## Tiến độ
- Bước 1–3: đọc phiếu + code, đo thời gian thật (bộ kiểm `--day-du`, AUDIT-1 và bốn bộ đột biến trên HEAD gốc), viết
  `ke_hoach.md`, agent phụ soát (CẦN SỬA 6 điểm → đã sửa vào kế hoạch). Phiếu dặn **chờ duyệt kế hoạch** → commit, push,
  DỪNG ở bước 3. Chưa viết bài thử, chưa sửa code.
- Người gác chặn trong phiên (đọc lý do, không lách): `nproc` (B-CHUONGTRINH → dùng `/proc/cpuinfo`), `until` (B-CHUONGTRINH
  → vòng chờ bằng python), `ps -o … args` (B-BIMAT-CHU), `git -C` (GIT-TUYCHON), `cd` giữa lệnh (B-CD-VITRI),
  `mcp__github__actions_list` (CC-LA → số đo GitHub ghi CHƯA KIỂM).
- Không thấy thông báo đổi model trong phiên.

## Câu hỏi
Xem `ke_hoach.md` mục "Câu hỏi cho chủ quán" (Q1 ngưỡng 75 %, Q2 thời gian D5) — trả lời khi duyệt.

## Phát hiện
- P1 `tu_chay/thu_cong.js` chạy **91,3 s** trong bộ kiểm (hạn `chayBaiThat` 120 s = 76 %; HOC-2 lúc lập kế hoạch đo 48 s).
  Ngoài Phạm vi (`tu_chay/`) và ngoài C3 (phiếu chỉ cho hai lời gọi cảnh báo) → đề xuất việc sau: đo lại / làm nhanh / cân nhắc
  cảnh báo gần hạn cho mọi bài. Không nới hạn.
- P2 `tu_chay/THIET_KE.md:386` còn "giả lập 22 s, thu_gia_lap 24 s"; `:388` "số bất biến ≥ 9 — chỉ được tăng" (lệch với
  bánh cóc thật và với lần hạ 11 → 10 chủ quán chốt). Ngoài Phạm vi.
- P3 AUDIT-1 kiểu `thugl` dựng bản sao `sv` không có `kiem_tra_truoc_khi_giao.js` (`viec/AUDIT-1/dot_bien.py:246–249`) → sau C3,
  ca C3e của `thu_gia_lap` sẽ đỏ oan nếu có đột biến dùng `thugl`. Hiện không đột biến nào dùng (chỉ dòng khai báo `:216`).
- P4 AUDIT-1 chạy không tham số bỏ nhóm G3 (`chon_db`, `:372`) → D5 phải gọi thêm `G3` riêng. AUDIT-1 so cả nhật ký người
  gác → mọi lệnh khác của phiên trong lúc chạy làm "KHO BẨN" oan (gặp ở lần đo 07.10).
- (sẽ ghi ở bước làm: D4 danh sách file còn nhắc `thu_p1`.)
