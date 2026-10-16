# AUDIT-4 — Audit đợt 4: chạy lại toàn bộ lưới trên code sau LUOI-3 · P20b · BAN-HANG-1 · TU-CHAY-6 — điểm dừng chương trình audit

<!-- Phiếu do chat soạn 17.10.2026. Nền: main sau sổ việc v34 (cha 0ee7346 = Merge PR #26 LUOI-3; P20b PR #25). CHỈ KIỂM + BÁO CÁO
     trong viec/AUDIT-4/, không sửa file nào khác. Nguồn ĐỌC NGUYÊN VĂN: viec/AUDIT-3/ (phieu.md, bao_cao.md: AU3-8…17 NẶNG-lưới → LUOI-3
     đã khoá; AU3-22…24 lỗi công cụ boc.py + cột "cách vá"; mục "Đề xuất"), viec/AUDIT-3/boc.py, dot_bien.py, kiem_neo.py, bb_neo.json;
     viec/LUOI-3/trang_thai.md (bảng 10 SỐNG→BẮT, nền N11); viec/P20b/, viec/BAN-HANG-1/trang_thai.md (đề xuất, "đơn rỗng tổng 0");
     viec/TU-CHAY-6/trang_thai.md (Q5 thu_cong sát hạn; cài lần 1 trên Replit hook hỏng 1 phép "Received null", lần 2 qua).
     AUDIT-3: 0 NẶNG-code, 10 NẶNG-lưới. Điểm dừng = HAI đợt liên tiếp không NẶNG → AUDIT-4 sạch là đạt. P20c chạy SONG SONG
     (signup-codes.js, thu_P20.js) — không chung file; AUDIT-4 đo trên HEAD lúc mở phiên, ghi SHA. -->

**Chờ duyệt kế hoạch:** viết `viec/AUDIT-4/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Kiểm ĐỘC LẬP: sau LUOI-3, 10 lỗ lưới đã khoá thật chưa; đường tiền mới (P20b, cổng thẻ BAN-HANG-1) có lưới chưa; công cụ đo không nói
dối. Đạt = 0 NẶNG (code lẫn lưới) → chương trình audit đạt điểm dừng. Định nghĩa BẮT / SỐNG / HỎNG / LẠC / NẶNG / NHẸ như
`viec/AUDIT-1/phieu.md`; luật sập (a) như AUDIT-3 chốt: bộ kiểm chạy hết nhưng báo bài con sập = HỎNG-sập, không BẮT.

## Nghiệm thu
- A1 Công cụ trước: chép `viec/AUDIT-3/boc.py` → `viec/AUDIT-4/boc.py`, vá AU3-22, AU3-23, AU3-24 đúng cột "cách vá" của bao_cao.md,
  mỗi vá một ca đỏ trong `viec/AUDIT-4/bang_chung_do.txt` (đột biến cố ý sập ra HỎNG-sập, không BẮT; NEM- vào `xau`; thu_gia_lap
  thoát 0 không dòng tổng = HỎNG-sập). Không sửa `viec/AUDIT-3/`.
- A2 Chạy lại ĐỦ trên HEAD qua bọc đối chứng: `viec/AUDIT-3/dot_bien.py` (21 + 5 D2) → 10 tên AU3-8…17 phải BẮT, đỏ đúng ca LUOI-3 (so câu
  lỗi với `viec/LUOI-3/bang_chung_do.txt`); `viec/AUDIT-1/dot_bien.py` (cả G3, c2luoi), `viec/AUDIT-2/dot_bien.py` (A3L + B3),
  `dot_bien_bb.py` (ảnh neo `viec/AUDIT-3/bb_neo.json`); bộ từng việc: P26b, P26c, GOI-1, GOI-2, SO-LUONG-1, BAN-HANG-1, LUOI-2, LUOI-3,
  P20b, LUOI-1, TACH-GL. Bảng BẮT/SỐNG/HỎNG/LẠC từng tên; khác AUDIT-3 / nền N11 của LUOI-3 → giải thích; LẠC không bản thay = phát hiện.
- A3 Đột biến ĐỘC LẬP mới `viec/AUDIT-4/dot_bien.py` cho đường tiền thêm sau AUDIT-3: P20b (cổng voucher đơn gốc: bỏ `claimed_at IS NOT
  NULL`, đổi mã lỗi, chặn sau giao dịch), BAN-HANG-1 (cổng thẻ, mặc định hạn 30d), LUOI-3 ca [M] / B3p (chọn chỗ bộ của chính việc chưa
  đột biến, đối chiếu neo) — mỗi việc ≥ 3, có đối chứng. SỐNG ở chỗ tiền / ví / gói / kho = NẶNG.
- A4 `viec/AUDIT-4/kiem_neo.py` (từ bản AUDIT-3): rà neo mọi `viec/*/dot_bien*.py`, `viec/*/do_*.js`, kể cả LUOI-3, P20b, BAN-HANG-1,
  AUDIT-3; bắt buộc chạy, kết quả vào `trang_thai.md`. `viec/AUDIT-2/lach.js` chạy lại; mã người gác mới (nếu có) thêm ca lách tối thiểu.
- A5 Phép nhấp nháy: `node tu_chay/thu_cong.js` 5 lần liên tiếp + 3 lần khi máy bận (chạy song song `node cong_cu/thu_gia_lap.js`), ghi
  đạt/hỏng từng lần và thời gian; đỏ thì chép nguyên văn phép hỏng. Đọc `thu_cong.js` tìm chỗ phụ thuộc thời gian / thư mục tạm dùng chung
  → ghi phát hiện kèm neo. Không sửa `tu_chay/`.
- A6 Đơn rỗng: gọi `POST /orders` với `items: []` / tổng 0 / chỉ `membership_buy` (bản sao máy chủ, kho tạm) → có tạo đơn không, đơn đó
  đi vào báo cáo / điểm / ví không. Mất tiền hay sai báo cáo = NẶNG-code; chỉ rác = NHẸ.
- D1 `viec/AUDIT-4/bao_cao.md` (≤ 200 dòng): kết luận một dòng (đạt / chưa đạt điểm dừng) · bảng `AU4-<n>` · NẶNG/NHẸ · file:dòng ở HEAD ·
  lệnh thấy lại · đề xuất khoá. Cuối: tỷ lệ BẮT/SỐNG/HỎNG/LẠC theo nhóm, so AUDIT-3. Đề xuất BAN-HANG-1 (phép tĩnh `:NNNN`, K3/K4) và
  TU-CHAY-6 Q5 (chia lượt thu_cong) → mục "Đề xuất bộ khung", không làm.
- D2 `bang_chung_do.txt`: công cụ không nói dối — cố ý sai chuỗi → HỎNG; đã biết → BẮT; vô hại → SỐNG; bài thử sập → HỎNG-sập (A1).
- D3 `npm test` + `--day-du` xanh; `git status` sạch sau mỗi công cụ (thư mục tạm xoá — kể cả khi bị ngắt; máy mây không `rm` được ngoài
  nháp thì ghi lệnh dọn). Không đổi một byte ngoài `viec/AUDIT-4/`.

Làm A1 → A2 → A3 → A4 → A5 → A6 → D; mỗi nhóm xong commit + push, `trang_thai.md` ghi nhóm nào xong. Chạy nặng tuần tự, đo RIÊNG.

## Phạm vi
- viec/AUDIT-4/**

## Bài thử đỏ
không — việc chỉ kiểm + báo cáo, không đổi code; công cụ đo tự chứng minh bằng D2 (bang_chung_do.txt)

## Ngân sách
`boc.py` vá ~30 dòng; `dot_bien.py` ~80–150 dòng; `kiem_neo.py` ~+20; `bao_cao.md` ≤ 200 dòng. Kế hoạch ước lượng thời gian máy từng
nhóm (đo); tổng > 180 phút → nêu cách cắt trong `## Câu hỏi`.
**Phương án đơn giản nhất đã xét:** dùng lại công cụ AUDIT-3 (vá 3 lỗi đã có cách vá), không dựng khung mới; đột biến mới chỉ cho đường
tiền thêm sau AUDIT-3.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa file nào ngoài `viec/AUDIT-4/` — kể cả lỗi thấy rõ hay neo rữa: ghi phát hiện + đề xuất. Không sửa `KHUON_LOI.md`, `viec/AUDIT-3/`.
- Đột biến chỉ trên bản sao trong thư mục tạm; không đụng `server/` thật, `data/`, `.claude/`, `.github/`, Turso, production.
- Lệnh "cố tình lách" chỉ là dữ liệu đưa vào bản sao người gác; không chạy thật.
- Không gọi GitHub API; chỉ `git` với kho. Chỉ push đúng `git push -u origin viec/AUDIT-4`. Không đụng `main`, không merge, không tạo PR.
