# DIEM-MON-1 — trạng thái

## Bước 1 — đối chiếu bản chụp
- Nhánh: viec/DIEM-MON-1 · cây sạch · HEAD 997bf52 = FETCH_HEAD 997bf52 (bằng nhau, không kéo)
- git log --oneline -3:
  - 997bf52 PHIEU: DIEM-MON-1
  - de66463 TIEN-DO: GIAO-DIEN-1, KH-TOMTAT-1, GIAO-1, NAP-1, KHACH-APP-1 xong; mo DIEM-MON-1, KH-THE-1, QUAY-UI-1 + xep hang 5 viec; quyet dinh 07-08.11 — so v58
  - 801e99a Merge pull request #81 from pos-tuquyduong/viec/KHACH-APP-1

## Bước 3 — kế hoạch
- Đã viết `ke_hoach.md`. Phiếu là việc [T] (điểm = tiền) — "lập kế hoạch rồi DỪNG chờ duyệt": DỪNG sau bước 3.

## Câu hỏi
- Q1 (đã đề xuất trong ke_hoach.md mục 5): khi hoàn / đền / kết thúc gói, trừ điểm theo tỷ lệ trên TOÀN tiền đơn (đề xuất) hay chỉ khi phần hoàn
  thuộc dòng bật điểm? Chủ quán xác nhận lúc duyệt kế hoạch.
- Agent soát kế hoạch (chỉ đọc): không ra ngoài Phạm vi. Đã sửa theo soát: dùng cùng quy tắc chia tiền theo dòng của `tienDaTra.js`
  (mã 1 món giảm MỘT đơn vị); chặn chia cho 0 khi đơn chỉ lấy từ gói; bỏ cờ cho dòng nạp (đơn nạp vốn 0 điểm); thêm ca duyệt hoàn, nhận mã sau
  đền, mã 1 món; T13 đền hai lần theo trần từng dòng; T18 dùng đơn không SĐT; ghi rõ số kỳ vọng T6/T10/T11/T14.
- Kho nông thiếu commit cbbb809 → `thu_BH2.js` (bộ kiểm) đỏ "bad revision"; đã `git fetch --unshallow` (chỉ tải lịch sử).

## Phát hiện
- `server/utils/tienDaTra.js` (ngoài Phạm vi): quy tắc chia tiền theo dòng nằm trong hàm bất đồng bộ đọc kho; tách phần thuần ra thì
  DIEM-MON-1 gọi lại được thay vì chép cùng công thức — đề xuất cho việc sau.
