# AUDIT-3 — Audit đợt 3: chạy lại lưới trên code sau P26c · GOI-1 · LUOI-2 · GOI-2 · SO-LUONG-1, xem còn lỗ NẶNG không

<!-- Phiếu do chat soạn 15.10.2026. Nền: main sau sổ việc v31 (cha 31a5810 = Merge PR #21 SO-LUONG-1).
     CHỈ KIỂM + BÁO CÁO trong viec/AUDIT-3/, không sửa file nào khác. Nguồn: viec/AUDIT-2/ (phieu.md, bao_cao.md, công cụ),
     viec/AUDIT-1/phieu.md (định nghĩa), sổ việc mục AUDIT-3, viec/TOC-DO-1/trang_thai.md (phát hiện K3: bộ đột biến báo BẮT
     khi bài thử sập), viec/GOI-2 + viec/SO-LUONG-1/trang_thai.md (đột biến lạc đã ghi). -->

**Chờ duyệt kế hoạch:** viết `viec/AUDIT-3/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Kiểm ĐỘC LẬP lưới còn bắt lỗi tiền không trên code hiện tại. Đạt = không còn NẶNG. Điểm dừng chương trình audit: HAI đợt liên
tiếp không NẶNG (AUDIT-2 có NẶNG ⇒ cần AUDIT-3 sạch + AUDIT-4 sạch). Định nghĩa BẮT / SỐNG / HỎNG / LẠC / NẶNG / NHẸ: như
`viec/AUDIT-1/phieu.md`; thêm: đột biến làm bài thử SẬP (lỗi cú pháp, ném ngoài ca, mã thoát lạ) = HỎNG, KHÔNG BẮT.

## Nghiệm thu
- A1 ĐỐI CHỨNG trước tiên: mọi bộ đột biến chạy trong việc này phải có đối chứng (bản sao CHƯA đột biến chạy xanh, đếm số) và
  phân biệt "đỏ đúng ca" với "bài thử sập". Bộ nào chưa có (danh sách thật từ code, không đoán) → chạy qua một lớp bọc
  `viec/AUDIT-3/` (không sửa file bộ cũ). Mỗi bộ: một đột biến cố ý làm sập bài thử → phải ra HỎNG, không BẮT.
- A2 Chạy lại ĐỦ trên HEAD: `viec/AUDIT-1/dot_bien.py` (cả G3; kết luận SỐNG dùng `c2luoi` của `viec/AUDIT-2/dot_bien.py`, vì
  `c2full` không chạy `thu_P26c`), `viec/AUDIT-2/dot_bien.py` (A3L + B3), `viec/AUDIT-2/dot_bien_bb.py`, và bộ đột biến tiền
  của từng việc: P26b, P26c, GOI-1, GOI-2, SO-LUONG-1, LUOI-1, TACH-GL. Bảng BẮT/SỐNG/HỎNG/LẠC từng tên; khác AUDIT-2 → giải
  thích. LẠC đã ghi (GOI-1: 7 từ GOI-2 + 2 từ SO-LUONG-1; P26c: 4; tách `ghiHoan`: 3) → dẫn tên đột biến dựng lại ở việc sau,
  ghi "đã thay"; LẠC không có bản thay = phát hiện.
- A3 Đóng sổ AUDIT-2: AU2-1, AU2-2 (5 đột biến A3L), AU2-11 nay BẮT / đã xử lý chưa — dẫn ca, lệnh thấy lại.
- A4 Đột biến ĐỘC LẬP mới `viec/AUDIT-3/dot_bien.py` cho đường tiền thêm từ sau AUDIT-2 (P26c hoàn tiền, GOI-1 trần theo loại,
  GOI-2 "Kết thúc gói", SO-LUONG-1 cổng mua gói / thẻ): đọc code, chọn chỗ mà bộ của CHÍNH việc đó chưa đột biến (đối chiếu
  neo), mỗi việc ≥ 3 đột biến (VS- vá sai + BV- bỏ vá), có đối chứng. SỐNG ở chỗ đụng tiền / ví / điểm / gói / kho = NẶNG.
- A5 `viec/AUDIT-3/kiem_neo.py` (mở rộng từ bản AUDIT-2): rà neo mọi `viec/*/dot_bien*.py` và `viec/*/do_*.js`, gồm GOI-1, P26c,
  LUOI-2, AUDIT-2, GOI-2, TOC-DO-1, SO-LUONG-1. Bắt buộc chạy; kết quả vào `trang_thai.md`.
- A6 `viec/AUDIT-2/lach.js` chạy lại; mã người gác mới từ sau AUDIT-2 (nếu có) thêm ca lách TỐI THIỂU, chỉ dạng dữ liệu vào bản
  sao người gác (như AUDIT-2 A3).
- D1 `viec/AUDIT-3/bao_cao.md` (≤ 200 dòng): kết luận một dòng (đạt / chưa đạt điểm dừng) · bảng `AU3-<n>` · NẶNG/NHẸ ·
  file:dòng ở HEAD · lệnh thấy lại · đề xuất khoá (file, ca đỏ nào). Cuối: tỷ lệ BẮT/SỐNG/HỎNG/LẠC theo nhóm.
- D2 `bang_chung_do.txt`: công cụ không nói dối — cố ý sai chuỗi → HỎNG; đã biết → BẮT; vô hại → SỐNG; bài thử sập → HỎNG.
- D3 `npm test` + `node kiem_tra_truoc_khi_giao.js --day-du` xanh; `git status` sạch sau mỗi lần chạy công cụ (thư mục tạm xoá
  kể cả khi bị ngắt). Không đổi một byte ngoài `viec/AUDIT-3/`.

Làm theo A1 → A2 → A3 → A4 → A5 → A6 → D; mỗi nhóm xong thì commit + push, `trang_thai.md` ghi nhóm nào xong (hết hạn mức giữa
chừng thì `/lam-viec AUDIT-3 tiep`). Chạy nặng tuần tự, đo RIÊNG.

## Phạm vi
- viec/AUDIT-3/**

## Bài thử đỏ
không — việc chỉ kiểm + báo cáo, không đổi code; công cụ đo tự chứng minh bằng D2 (bang_chung_do.txt)

## Ngân sách
Lớp bọc đối chứng ~60–120 dòng; `dot_bien.py` (A4) ~100–200 dòng; `kiem_neo.py` ~+40 so bản AUDIT-2; `bao_cao.md` ≤ 200 dòng.
Kế hoạch ước lượng thời gian máy từng nhóm (đo, không đoán); tổng > 180 phút → nêu cách cắt hợp lý trong `## Câu hỏi`.
**Phương án đơn giản nhất đã xét:** dùng lại công cụ AUDIT-1 / AUDIT-2 và bộ đột biến của từng việc; chỉ viết mới lớp bọc đối
chứng (bộ cũ không có) và đột biến độc lập cho đường tiền mới. Không dựng khung đo mới, không sửa file bộ cũ.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa file nào ngoài `viec/AUDIT-3/` — kể cả lỗi thấy rõ hay neo rữa: ghi phát hiện + đề xuất. Không sửa `KHUON_LOI.md`;
  bài học ghi trong `trang_thai.md` dạng đề xuất.
- Đột biến chỉ trên bản sao trong thư mục tạm; không đụng `server/` thật, `data/`, `.claude/`, `.github/`, Turso, production.
- Lệnh "cố tình lách" chỉ là dữ liệu đưa vào bản sao người gác; không chạy thật, không thử lách người gác đang gác phiên này.
- Không gọi GitHub API; chỉ `git` với kho. Chỉ push đúng `git push -u origin viec/AUDIT-3`. Không đụng `main`, không merge,
  không tạo PR.
