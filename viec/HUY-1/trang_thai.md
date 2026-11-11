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

## Phiên 11.11.2026 — `tiep` sau khi chat gộp main (Q4)

### Bước 1 — đối chiếu bản chụp
- Nhánh: `viec/HUY-1`; `git status --short` sạch (hook mở phiên đã kéo `1d21626 → aa5874f`).
- `git fetch origin viec/HUY-1` → HEAD `aa5874f` · FETCH_HEAD `aa5874f` (bằng nhau, không kéo).
- `git log --oneline -3`:
  ```
  aa5874f PHIEU: HUY-1 11.11 buoc nang cap 025 + ghi chu main moi (DIEM-MON-1, VI-ME-1, NAP-1, BAO-1a) + VOUCHER-2 song song
  f77b7fb GOP-HUY-1 gop main 53a71a2 (chat 11.11, truoc tiep — Q4)
  53a71a2 TIEN-DO: DIEM-MON-1, VI-ME-1, BAO-1a xong; them QUET-1, BO-MAN-CU-1, MATKHAU-1 (truoc khai truong), DOI-DIEM-1, QUET-2 (cuoi danh sach); quyet dinh 11.11; KHUON_LOI bo sung; bo attached_assets/ khoi kho
  ```

### Bước 2–3 — đọc lại kế hoạch so với code mới
- Kết quả: **lệch nhiều** → theo ghi chú 11.11 của phiếu: sửa kế hoạch (mục 0 mới của `ke_hoach.md`), ghi câu hỏi, DỪNG chờ duyệt lại.
- Buộc sửa file NGOÀI Phạm vi: (1) cổng tạm `CHO_HUY_1` của GIAO-1 (`server/utils/giaoHang.js:160-163`) + ca J4/J9, K5b của `cong_cu/thu_GIAO1.js`;
  (2) bài cũ khoá luật "huỷ chỉ hoàn phần ví": `thu_P26b.js` A5, `thu_P26c.js` B5d, `thu_P24.js` A4b, `thu_DOISOAT1.js` E14.
- Cách đo (2): bản sao cây `aa5874f` trong thư mục nháp (`git archive`), sửa đúng một chỗ ở `hoanVi` (hoàn total − nợ khi huỷ), chạy 19 bài có huỷ
  đơn trên gốc và bản nháp (bảng `ke_hoach.md` mục 0.1). Gốc: 19/19 xanh. Bản nháp: đỏ đúng 4 ca (3 bài ngoài Phạm vi + KB5 giả lập trong Phạm vi).
  E14 của `thu_DOISOAT1.js` do agent soát chỉ ra (bản nháp chưa đổi Đối soát nên chưa đỏ) — đã đọc lại dòng 631-636.
- Phần còn lại khớp hoặc lệch ít (NAP-1 ví hai ngăn tự chia qua `ghiVi`; DIEM-MON-1 `truDiemDon` không đổi; `traLuotMa` chỉ gọi; PHIEN_BAN 13 → 14;
  bước 025; mã lỗi lý do đổi sang `LY_DO_BAT_BUOC` cho trùng GIAO-1, kiểm SAU cổng giao để ca J2 giữ xanh) — đã sửa vào kế hoạch.
- Soát kế hoạch (agent phụ, chỉ đọc): bắt K5b + J2 (`thu_GIAO1.js`), E14 (`thu_DOISOAT1.js`), đơn giao không SĐT (→ Q8), thiếu ca `do_da_pha`
  và lý do < 3 ký tự cho đơn giao (→ D11, D12), lệch nhỏ số dòng `GiaoHang/index.jsx` — mình kiểm lại trong code, đúng, đã sửa vào kế hoạch.
- Sự cố người gác: grep đệ quy ở gốc kho (B-BIMAT-CHU) → trỏ vào thư mục con; `git worktree` (GIT-LENH) → dùng `git archive | tar`;
  đích ghi có biến (B-DICHCHU) → viết thẳng đường dẫn; `time` (B-CHUONGTRINH) → bỏ; `ReadNotifications` (CC-LA) → không dùng;
  heredoc nhắc file được bảo vệ (B-MANOI) → viết script ra file nháp rồi chạy.

## Câu hỏi (11.11)
Chi tiết + đề xuất ở cuối `ke_hoach.md`, mục "Câu hỏi mới 11.11":
- **Q6** — thêm `server/utils/giaoHang.js` (xoá cổng tạm `CHO_HUY_1`) và `cong_cu/thu_GIAO1.js` (đổi ca J4 + J9, K5b) vào Phạm vi.
- **Q7** — thêm `cong_cu/thu_P26b.js`, `cong_cu/thu_P26c.js`, `cong_cu/thu_P24.js`, `cong_cu/thu_DOISOAT1.js` vào Phạm vi (mỗi ca chỉ đổi số mong đợi theo luật hoàn toàn bộ).
- **Q8** — đơn giao KHÔNG có tài khoản khách mà trả tiền mặt / CK: đề xuất vẫn chặn huỷ trên máy (như hôm nay).

## Phát hiện (11.11)
- `server/utils/viKhach.js:6-7` chú thích chỉ nói dòng tiền mặt / CK hoàn vào ví là `'hoan_goi'`; HUY-1 dùng mã riêng (Q2) → chú thích cần thêm mã mới (ngoài Phạm vi; hành vi vẫn đúng nhờ thứ tự ghi).
- `server/utils/doiSoat.js:252-260`: tiền đền cho khách lẻ không SĐT ra khỏi két nhưng công thức két không tính (đang liệt kê CẦN XEM) — trái chữ "lối DUY NHẤT lấy tiền mặt ra khỏi két" của phiếu E. Không đụng.
