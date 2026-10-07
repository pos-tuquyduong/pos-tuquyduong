# HOC-2b — Phần còn lại của HOC-2: bộ kiểm, giả lập, đột biến cũ, KHUON_LOI.md, CLAUDE.md

<!-- Phiếu do chat soạn 07.10.2026. Nền: main sau sổ việc v23 (cha b681ede = Merge PR #10 HOC-2, bộ khung tu-chay 1.4.0).
     Nguồn: phiếu HOC-2 bản đầu (git show ba72a3f:viec/HOC-2/phieu.md) mục C1–C5, D2–D5, E1–E2; viec/HOC-2/ke_hoach.md
     cùng mục (đã qua soát của chat 05.10); viec/HOC-2/trang_thai.md mục Bài học. Chủ quán chốt 05.10: (1b) T2–T4/F2 giữ
     cảnh báo + ghi lý do; (2a) bỏ I10, bánh cóc 11 → 10; (3a) xoá cong_cu/thu_p1.js; (4a) KHUON_LOI.md ≤ 100 dòng, giữ
     trần 120. Chat đã chạy thử 07.10 trên b681ede: bỏ I10 rồi cài M11, M12 của thu_gia_lap → I11 vẫn bắt (KB13, KB14). -->

**Chờ duyệt kế hoạch:** viết `viec/HOC-2b/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.
Chưa viết bài thử, chưa sửa code cho tới khi chủ quán gửi lời duyệt.

## Mục tiêu
Làm nốt các khoá của HOC-2 nằm NGOÀI bộ khung, trước LUOI-1 (LUOI-1 sẽ thêm kịch bản giả lập — cần cảnh báo gần hạn và
bất biến gọn trước): bỏ bất biến trùng I10, cảnh báo khi giả lập chạy gần hạn giờ (không báo oan), siết bài thử ví mẹ của
P26b, chứng minh `thu_P20` còn sống, sửa đột biến cũ đã rữa và công cụ cũ ghi file thật, xoá công cụ cũ nối kho thật, rút
gọn `KHUON_LOI.md` để còn chỗ ghi bài học mới, sửa hai câu `CLAUDE.md` nói quá. Việc này KHÔNG đổi `server/`, `client/`,
`tu_chay/`.
KHÔNG làm ở đây (bộ khung `tu_chay/`, việc sau): các Phát hiện 2–5 của HOC-2 (A16 so thêm số ca trên gốc, A18 chạy đột
biến, tên ngắn ở hồ sơ HOC-1, `ban_sao_goc.py` chế độ cả kho); số đo "22 s" ở `tu_chay/THIET_KE.md` — ghi vào `## Phát hiện`.

### Lưu ý — cổng của chính PR này
Cổng chấm bằng `tu_chay/cong.js` + `tu_chay/cau_hinh.json` của `main` (tu-chay 1.4.0 — cũng là luật mới nhất, vì việc này
không đổi `tu_chay/`). Vì vậy:
- A16: `viec/HOC-2b/bang_chung_do.txt` có dòng `SỐ CA <bài>: <N>` cho MỖI bài thử đỏ trên gốc, N = số ca bài in khi chạy
  trên code đã vá (head). Đổi bài sau khi ghi → chạy lại, chép lại.
- A17: MỌI tên đột biến (nguyên chuỗi đầu tuple) trong `viec/HOC-2b/dot_bien.py` ghi NGUYÊN VĂN trong
  `viec/HOC-2b/trang_thai.md`.
- A18 không áp (không đổi `server/`, `client/src/`).
- Mỗi `thu_*.js` mới hoặc bị sửa phải ĐỎ trên code gốc, TRỪ file ghi ở `## Bài thử cũ sửa`. `cong_cu/thu_gia_lap.js` CỐ Ý
  đổi (11 → 10 bất biến, ca C3) nên đỏ trên gốc — KHÔNG miễn, có dòng `SỐ CA`. Bài thử bị xoá (`cong_cu/thu_p1.js`) không
  phải bài thử của cổng.
- Bản GỐC (ở main) của file trong `## Bài thử cũ sửa` chạy trên code PR phải XANH. Chat đã đối chiếu: `thu_P26b.js`,
  `thu_P20.js` chỉ nạp `server/` + `node_modules` (không đọc I10, `NGUONG_BAT_BIEN`, `PHIEN_BAN`) → xanh vì `server/` không
  đổi. Kế hoạch KIỂM LẠI bằng chạy; đỏ thì DỪNG, ghi `## Câu hỏi` (chủ quán sửa phiếu bằng commit `PHIEU: HOC-2b` mới).
Kế hoạch có bảng: file bài thử nào bị đụng → ca nào đỏ trên gốc, hoặc dòng miễn nào.

## Nghiệm thu

### C. Bộ kiểm + giả lập
- C1 (chốt 1b, AU-D1/D2) T2, T3, T4, F2 trong `kiem_tra_truoc_khi_giao.js` GIỮ cảnh báo. Mỗi chỗ thêm chú thích lý do
  (T2–T4: máy sửa `tu_chay/` trên nhánh thì bản cài chắc chắn lệch tới khi chủ quán chạy `cai_dat.sh`, cổng A8 chặn cứng —
  nâng thành FAIL là chặn commit của chính việc đang sửa; F2: người gác chặn tạo `.js` ở gốc trong phiên việc). Không đổi
  hành vi: `npm test` trước/sau cùng số PASS · FAIL · CẢNH BÁO.
- C2 (chốt 2a, AU-C1/E1) Bỏ I10 ở `cong_cu/gia_lap/bat_bien.js` (cả câu so I10 trong chú thích I11, dòng đầu "11 bất
  biến"); `NGUONG_BAT_BIEN` 11 → 10 kèm chú thích "I10 ⊂ I11, không giảm độ phủ (HOC-2b, chủ quán chốt 2a)"; câu "chỉ được
  TĂNG" thêm "trừ lần hạ có chủ quán chốt". `cong_cu/thu_gia_lap.js`: `DONG_DAT` 10 bất biến; M11, M12 mong `I11`. Chứng
  minh bao trùm bằng CHẠY, ghi bảng "tên đột biến → bất biến bắt" vào `trang_thai.md`: M11, M12 của `thu_gia_lap`;
  `viec/P26b/dot_bien.py` các mẫu chờ `I10` (đổi sang `I11`). Đột biến nào chuyển SỐNG → DỪNG, ghi `## Câu hỏi`.
  Sau sửa: grep `I10` / `11 bất biến` trong code + bài thử chỉ còn ở hồ sơ cũ (`viec/`).
- C3 (AU-C3) Chú thích thời gian `kiem_tra_truoc_khi_giao.js` (dòng ghi "22 s / 24 s") sửa theo số đo THẬT lúc làm. Thêm
  CẢNH BÁO (không chặn) khi giả lập hoặc `thu_gia_lap` chạy xanh mà gần hạn. CHỈ hai lời gọi đó bật cảnh báo (bài thử khác
  không). Ngưỡng chọn theo số đo thật sao cho lúc bình thường KHÔNG bật (cảnh báo bật mỗi lần là báo oan — K8): đo ở máy
  mây; đọc thêm thời gian bước `cong-chay` của PR gần nhất trên GitHub nếu công cụ trong phiên đọc được — không đọc được thì
  ghi CHƯA KIỂM (chat đo khi soát cuối). Số đo bình thường đã sát ngưỡng → báo chủ quán ở `## Câu hỏi`, KHÔNG nới hạn.
  Ca thử trong `cong_cu/thu_gia_lap.js` (không đụng `tu_chay/`): chạy hàm `chayBaiThat` THẬT cắt từ
  `kiem_tra_truoc_khi_giao.js` với bài ngủ ngắn: hạn giả nhỏ → có cảnh báo; hạn thật → KHÔNG cảnh báo; bài thoát 1 → FAIL,
  không cảnh báo; cắt hàm không được → ca ĐỎ.
- C4 (P26b vòng Q9) `cong_cu/thu_P26b.js`: M6 `<= 1` → `=== 1` (tên ca nói đúng điều kiểm); thêm ca "đơn có ví mẹ, phần mẹ
  0đ → duyệt 200, 0 dòng hoàn mẹ, ví mẹ không đổi"; ca "yêu cầu cũ (dữ liệu trước bản vá) trên đơn có ví mẹ → duyệt hoàn
  mẹ đúng 1 dòng". KB17-Q9 trong `cong_cu/gia_lap/kich_ban.js` kiểm đơn tạo được (200) TRƯỚC khi đo. Đỏ trước bằng đột biến
  trong `viec/HOC-2b/dot_bien.py` (bản sao, không sửa `server/` thật): `refunds.js` phép phần mẹ `> 0` → `>= 0` → ca phần
  mẹ 0đ ĐỎ; bỏ hoàn mẹ → M6 (nhờ `=== 1`) và ca yêu cầu cũ ĐỎ; giả lập bỏ nạp ví mẹ → dòng "tạo được (200)" ĐỎ. Chỉ thêm/siết
  ca — KHÔNG sửa `server/`; ca nào ĐỎ trên code hiện tại (lộ code đang sai) → DỪNG, ghi `## Câu hỏi`.
- C5 (AU-G5) `thu_P20` còn sống: một đột biến phá đúng thứ `thu_P20` canh (mã bill claim / nhận điểm) mà KHÔNG phép tĩnh
  nào bắt trước → `node kiem_tra_truoc_khi_giao.js` trên bản sao ĐỎ đúng dòng "bài chạy thật cong_cu/thu_P20.js" và không
  phép nào khác đỏ. Ghi vào `viec/HOC-2b/dot_bien.py`. Không dựng được → ghi rõ vì sao. `thu_P20` xanh với mọi ứng viên →
  DỪNG, ghi `## Câu hỏi` (không tự viết lại bài). Chỉ sửa `thu_P20.js` nếu cần, và chỉ thêm ca.

### D. Đột biến cũ và công cụ cũ (AU-E1/E3, chốt 3a)
- D2 (AU-E1) `viec/P26b/dot_bien.py`: bỏ `I10-bo` + một dòng chú thích lý do; mẫu chờ `I10` → `I11` (C2). Cả bộ chạy:
  0 HỎNG.
- D3 (AU-E3) `viec/TU-CHAY-4/dot_bien.py` kiểu `tai_cho` → chạy trên BẢN SAO trong thư mục tạm, không ghi file thật nào:
  so `git status --porcelain` + `data/` trước/sau, khác → báo "KHO BẨN", thoát ≠ 0. F2, S3 vẫn BẮT.
- D4 (chốt 3a, AU-B3) Xoá `cong_cu/thu_p1.js`. `grep thu_p1` chỉ còn ở script vá cũ ở gốc, `CHECKLIST_CODE.md`, sổ việc,
  `viec/` (không sửa) → ghi tên vào `## Phát hiện` cho DON-DEP-v1.
- D5 Chạy LẠI CẢ BỘ trên head cuối: `viec/AUDIT-1/dot_bien.py` (mọi nhóm, kể cả C2F), `viec/P26b/dot_bien.py`,
  `viec/HOC-1/dot_bien.py`, `viec/TU-CHAY-4/dot_bien.py`, `viec/HOC-2/dot_bien.py`, `viec/HOC-2b/dot_bien.py`. Bảng
  BẮT / SỐNG / HỎNG / LẠC từng bộ, ĐẾM đủ — không lấy mẫu. Mong: 0 HỎNG (trừ đột biến cố ý hỏng của chính công cụ đo,
  `G3-sai-chuoi`); SỐNG còn lại chỉ là C2F của AU-G1/G2/G3/G4/G6 (thuộc LUOI-1) — liệt kê tên; C2F đã BẮT ở
  `viec/AUDIT-1/c2_day_du.md` vẫn BẮT sau khi bỏ I10. Đột biến AUDIT-1 nào HỎNG vì neo rữa → ghi rõ, KHÔNG sửa
  `viec/AUDIT-1/` (ngoài Phạm vi) → `## Phát hiện`.
  Kế hoạch ĐO thời gian D5 thật (số lõi máy mây, `-j`). Tổng việc quá ~150 phút → đề xuất trong `## Câu hỏi` hai cách để
  chủ quán chọn khi duyệt: tách việc; hoặc D5 thu hẹp (mọi đột biến kiểm "chuỗi gốc khớp đúng số lần" trên head mà không
  chạy lệnh đo; chạy thật mọi đột biến có chuỗi gốc trong file việc này sửa, hoặc đo bằng bài/giả lập việc này sửa VÀ trước
  đây BẮT; phần còn lại ghi sang AUDIT-2 kèm danh sách). KHÔNG tự cắt.

### E. Tài liệu
- E1 (chốt 4a) `KHUON_LOI.md` ≤ 100 dòng; trần `khuon_loi_toi_da` giữ 120. Giữ số hiệu và tên K1–K8, mục "Năm câu tự hỏi".
  Mỗi khuôn giữ "Dấu hiệu" và "Chặn"; "Đã gây" rút còn 1–2 ví dụ; bỏ lời dặn đã có phép làm thay (ghi tên phép: bài thử đỏ
  trên gốc ← cổng A11/A12; đổi bài sau khi ghi bằng chứng ← A16; tên đột biến trong hồ sơ ← A17; vá sai ← A18). Gộp, vẫn
  trong ≤ 100 dòng: (K8) phép tự-kiểm báo oan dạy người bỏ qua nó; (K3) con số "đạt" phải kèm lần chạy lại trên HEAD,
  đột biến neo NGẮN/RIÊNG vì neo dài rữa; (K3) phép so bằng cần ca lệch CẢ HAI chiều, phép tiền tố cần ca chuỗi nằm GIỮA —
  luôn cài đột biến "nới phép"; (K1/K5) xếp đường tiền theo cái khách chạm ở quầy + middleware + khoá trong thân hàm, không
  theo nhãn "admin/hiếm" hay "chưa có trong kịch bản"; nhánh hỏng (SX lỗi, mạng) đụng kho/tiền là NẶNG; (K4) chạy lại bằng
  chứng → grep hồ sơ tìm mọi câu trích con số cũ; (K5) bài thử mới phải chạy được trong mọi bản sao đột biến đang dùng
  (bản sao chỉ có `tu_chay/`). `trang_thai.md` có bảng: dòng/ý bị bỏ → lý do (đã có phép X / gộp vào Kn).
- E2 (AU-F1/F2) `CLAUDE.md`: câu nhóm E (dòng ~112–114) sửa đúng phạm vi (bộ kiểm nhóm E chỉ canh `from_package`, không
  canh `discount_*` — đọc lại `kiem_tra_truoc_khi_giao.js` để viết đúng); dòng ~26 bỏ số phép đếm cứng. Giữ nguyên các chữ
  `tu_chay/thu_cong_cu.js` F2 đang soi ("bắt buộc đủ 7 mục", dòng mở đầu `BÀI HỌC:`). Grep cả file tìm câu cùng nghĩa (K4).

### F. Kiểm sống (ghi vào `viec/HOC-2b/trang_thai.md`)
- F1 Lúc mở phiên: in `git log --oneline -3`, khớp GitHub (có commit `PHIEU: HOC-2b`, cha là commit sổ v23).
- F2 PR có 2 check `cong` + `cong-chay` xanh (máy không làm được — ghi CHƯA KIỂM). Việc này không đổi `tu_chay/` nên
  KHÔNG cần chạy `cai_dat.sh`.

### G. Toàn bộ
`npm test` và `node kiem_tra_truoc_khi_giao.js --day-du` xanh, 0 CẢNH BÁO lúc bình thường; `thu_gia_lap`, `thu_P20`,
`thu_P26b` xanh. Mỗi nhóm C, D có ca đỏ trước (trên gốc hoặc đột biến) ghi trong `bang_chung_do.txt` / `trang_thai.md`.
`viec/HOC-2b/dot_bien.py` có bảng "chỗ đổi → đột biến" trong `trang_thai.md` (tên nguyên văn). Kế hoạch ghi ước lượng thời
gian máy (đo, không đoán); quá ~150 phút → xem D5, KHÔNG tự cắt mục. Thấy thông báo đổi model giữa phiên → ghi giờ + bước.

## Phạm vi
- viec/HOC-2b/**
- kiem_tra_truoc_khi_giao.js
- cong_cu/gia_lap/bat_bien.js
- cong_cu/gia_lap/kich_ban.js
- cong_cu/gia_lap/chay.js
- cong_cu/thu_gia_lap.js
- cong_cu/thu_P20.js
- cong_cu/thu_P26b.js
- cong_cu/thu_p1.js
- viec/P26b/dot_bien.py
- viec/TU-CHAY-4/dot_bien.py
- KHUON_LOI.md
- CLAUDE.md

## Bài thử cũ sửa
- cong_cu/thu_P26b.js — siết M6 (=== 1) và thêm ca ví mẹ vòng Q9; server không đổi nên xanh trên gốc
- cong_cu/thu_P20.js — chỉ thêm ca nếu C5 cần; server không đổi nên xanh trên gốc

## Ngân sách
Code ~80 dòng: `kiem_tra_truoc_khi_giao.js` ±~25 (C1 chú thích, C2, C3), `bat_bien.js` −~12, `kich_ban.js` +~3,
`cong_cu/gia_lap/chay.js` 0 (chỉ nếu C2 cần), `viec/P26b/dot_bien.py` + `viec/TU-CHAY-4/dot_bien.py` ±~40,
`cong_cu/thu_p1.js` −106 (xoá). Thử ~100 dòng: `thu_gia_lap.js` ±~40 (C2, C3), `thu_P26b.js` +~40 (C4), `thu_P20.js`
0–20 (C5). Hồ sơ: `viec/HOC-2b/dot_bien.py` ~60. Tài liệu: `KHUON_LOI.md` 120 → ≤ 100; `CLAUDE.md` ±~5.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `server/`, `client/`, `tu_chay/`, `.claude/`, `.github/`, `package.json`, `CHECKLIST_CODE.md`, `viec/AUDIT-1/`,
  `viec/HOC-1/`, `viec/HOC-2/`, sổ việc. Không chạy `cai_dat.sh`.
- Không làm gì cho AU-G1/G2/G3/G4/G6 ngoài liệt kê ở D5 (thuộc LUOI-1).
- Không viết lệnh thử vượt người gác; việc này không cần ca người gác nào.
- Không hạ trần `khuon_loi_toi_da`, không nới hạn thời gian giả lập / `thu_gia_lap` / bộ kiểm, không giảm số kịch bản.
  Bánh cóc bất biến chỉ hạ đúng 11 → 10 cho I10 (chủ quán chốt 2a).
- Chỉ push đúng `git push -u origin viec/HOC-2b`. Không đụng `main`, không merge, không tạo PR. Không chạy `patch_*.py`.
