# DIEM-MON-1 — trạng thái

## Bước 1 — đối chiếu bản chụp
- Nhánh: viec/DIEM-MON-1 · cây sạch · HEAD 997bf52 = FETCH_HEAD 997bf52 (bằng nhau, không kéo)
- git log --oneline -3:
  - 997bf52 PHIEU: DIEM-MON-1
  - de66463 TIEN-DO: GIAO-DIEN-1, KH-TOMTAT-1, GIAO-1, NAP-1, KHACH-APP-1 xong; mo DIEM-MON-1, KH-THE-1, QUAY-UI-1 + xep hang 5 viec; quyet dinh 07-08.11 — so v58
  - 801e99a Merge pull request #81 from pos-tuquyduong/viec/KHACH-APP-1

## Bước 3 — kế hoạch
- Đã viết `ke_hoach.md`. Phiếu là việc [T] (điểm = tiền) — "lập kế hoạch rồi DỪNG chờ duyệt": DỪNG sau bước 3.

## Bước 1 (phiên 09.11 — làm tiếp sau duyệt)
- Nhánh viec/DIEM-MON-1 · cây sạch · HEAD ce46ce0 = FETCH_HEAD ce46ce0 (bằng nhau, không kéo)
- git log --oneline -3:
  - ce46ce0 DIEM-MON-1: ke hoach (cho duyet) + trang thai buoc 1-3
  - 997bf52 PHIEU: DIEM-MON-1
  - de66463 TIEN-DO: GIAO-DIEN-1, KH-TOMTAT-1, GIAO-1, NAP-1, KHACH-APP-1 xong; mo DIEM-MON-1, KH-THE-1, QUAY-UI-1 + xep hang 5 viec; quyet dinh 07-08.11 — so v58
- Chủ quán duyệt kế hoạch, Q1 = CÁCH 2 (trừ điểm theo dòng). Đã ghi luật vào `ke_hoach.md` mục 6. DỪNG ở bước 2 vì hai chỗ ngoài Phạm vi (Q2, Q3 dưới).

## Bước 1 (phiên 09.11 lần 2 — sau khi chủ quán thêm Q2, Q3 vào Phạm vi)
- Nhánh viec/DIEM-MON-1 · cây sạch · HEAD e90d42a = FETCH_HEAD e90d42a (bằng nhau, không kéo — hook mở phiên đã kéo 5eb8ede → e90d42a)
- git log --oneline -3:
  - e90d42a PHIEU: DIEM-MON-1 Pham vi them damages.js + gia_lap/bat_bien.js (Q2, Q3 chu quan duyet 09.11)
  - 5eb8ede DIEM-MON-1: ghi luat CACH 2 vao ke hoach; hoi them damages.js + bat_bien.js (I8) vao Pham vi
  - ce46ce0 DIEM-MON-1: ke hoach (cho duyet) + trang thai buoc 1-3
- Q2, Q3 ĐÃ TRẢ LỜI (phiếu e90d42a thêm hai file vào Phạm vi). Làm tiếp từ bước 4.

## Câu hỏi
- Q1 (đã đề xuất trong ke_hoach.md mục 5): khi hoàn / đền / kết thúc gói, trừ điểm theo tỷ lệ trên TOÀN tiền đơn (đề xuất) hay chỉ khi phần hoàn
  thuộc dòng bật điểm? Chủ quán xác nhận lúc duyệt kế hoạch.
- Agent soát kế hoạch (chỉ đọc): không ra ngoài Phạm vi. Đã sửa theo soát: dùng cùng quy tắc chia tiền theo dòng của `tienDaTra.js`
  (mã 1 món giảm MỘT đơn vị); chặn chia cho 0 khi đơn chỉ lấy từ gói; bỏ cờ cho dòng nạp (đơn nạp vốn 0 điểm); thêm ca duyệt hoàn, nhận mã sau
  đền, mã 1 món; T13 đền hai lần theo trần từng dòng; T18 dùng đơn không SĐT; ghi rõ số kỳ vọng T6/T10/T11/T14.
- Kho nông thiếu commit cbbb809 → `thu_BH2.js` (bộ kiểm) đỏ "bad revision"; đã `git fetch --unshallow` (chỉ tải lịch sử).

- **Q1 — ĐÃ TRẢ LỜI 09.11:** CÁCH 2.
- **Q2 (09.11) — xin thêm `server/routes/damages.js` vào Phạm vi.** Đền theo món cần biết lần đền thuộc món nào; lúc trừ điểm (damages.js:208) dòng
  nhật ký sự cố của lần đó chưa ghi (ghi ở :211). Đề xuất: dời đúng một dòng `ghiHangHong` lên trước — không đổi tiền, không đổi trả lời. Không
  thêm thì phải đọc mã món từ chữ ghi chú sổ ví (dễ vỡ) — mình không đề xuất.
- **Q3 (09.11) — xin thêm `cong_cu/gia_lap/bat_bien.js` vào Phạm vi (chặn nghiệm thu E).** Màn Đối soát chạy phép I8 trên dữ liệu thật
  (doiSoat.js:18,39,203); I8 tự tính lại điểm theo tiền CẢ đơn (bat_bien.js:146-190) → tắt điểm một món là mọi đơn có món đó hiện "lệch". Đề xuất:
  I8 áp cùng luật mới (tỷ lệ món bật + CÁCH 2), đơn cũ giữ y hệt; bài thử T18 khoá. Kế hoạch cũ ghi "đối soát không tính lại" là sai — mình chưa
  đọc I8 lúc lập kế hoạch.
- **Đề xuất cho chủ quán:** đồng ý cả Q2 và Q3 (sửa phiếu `## Phạm vi` thêm hai dòng), rồi gõ lại `/lam-viec DIEM-MON-1 tiep`.

## Phát hiện
- `server/utils/tienDaTra.js` (ngoài Phạm vi): quy tắc chia tiền theo dòng nằm trong hàm bất đồng bộ đọc kho; tách phần thuần ra thì
  DIEM-MON-1 gọi lại được thay vì chép cùng công thức — đề xuất cho việc sau.
