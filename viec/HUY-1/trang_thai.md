# HUY-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (05.11.2026)
- Nhánh: `viec/HUY-1`; `git status --short` sạch.
- `git fetch origin viec/HUY-1` → HEAD `1d21626` · FETCH_HEAD `1d21626` (bằng nhau, không kéo).
- `git log --oneline -3`:
  ```
  1d21626 PHIEU: HUY-1
  7f9693f TIEN-DO: KH-SDT-1, GIO-VN-1, KH-NHANH-POS-1, HD-KH-1, SEPAY-1, CT-1a, SUA-E2-1, SUA-C9-1 xong; quyet dinh 04-05.11; mo GIAO-DIEN-1, CK-NOIDUNG-1, HUY-1, KH-TOMTAT-1 — so v54
  4723a3b Merge pull request #72 from pos-tuquyduong/viec/SUA-C9-1
  ```
- Sổ việc: HUY-1 còn mở; CK-NOIDUNG-1 còn mở (phiếu dặn LÀM sau khi CK-NOIDUNG-1 gộp — kế hoạch lập được ngay).

## Bước 3 — kế hoạch
- `viec/HUY-1/ke_hoach.md` đã viết. Phiếu có "Chờ duyệt kế hoạch" → commit, push, DỪNG.
- Câu hỏi cho chủ quán: ở cuối `ke_hoach.md` (mục "Câu hỏi cần chủ quán chốt") và chép dưới đây.

## Câu hỏi
Xem `ke_hoach.md` mục 9 — Q1 (bản mẫu giao diện), Q2 (mã nguồn dòng sổ ví), Q3 (đơn App chưa trả ở quầy), Q4 (CK-NOIDUNG-1 gộp trước), Q5 (thêm `server/utils/donThu.js` + `cong_cu/gia_lap/kich_ban.js` vào Phạm vi).

## Soát kế hoạch (agent phụ, chỉ đọc)
Bắt: sót đường song song `donThu.js:71-79` (bản chép công thức két) và `packages.js:267` (cùng `ghiHoan`); kịch bản giả lập huỷ bằng nhân viên
(`kich_ban.js:440,482,518,627`); có cách ngắn hơn (dùng lại `soTienHoan` + cờ thay vì hàm mới); thiếu ca thẻ hội viên, dòng hoàn tiền mặt đủ
trường, bài hợp đồng App, giao diện; trích nhầm I11 / I18. Mình kiểm lại từng điểm trong code → đúng, đã sửa hết vào kế hoạch.
Sự cố: một lệnh có `sed -i` bị người gác chặn (luật SED-I) → viết lại file bằng Write.
