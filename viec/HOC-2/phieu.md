# HOC-2 — Khoá hồ sơ + cổng + bộ kiểm (bài học P26b, TU-CHAY-4, phát hiện NHẸ của AUDIT-1)

<!-- Phiếu do chat soạn 05.10.2026. Nền: main sau sổ việc v21 (cha 9d5327b). Chủ quán chốt 05.10: (1b) T2–T4/F2 giữ
     cảnh báo + ghi lý do; (2a) bỏ I10, bánh cóc bất biến 11 → 10; (3a) xoá cong_cu/thu_p1.js; (4a) rút KHUON_LOI.md
     ≤ 100 dòng, giữ trần 120. Đầu vào: viec/AUDIT-1/bao_cao.md, viec/AUDIT-1/trang_thai.md (Bài học),
     viec/P26b/trang_thai.md (Bài học, vòng Q9). 4 lỗ NẶNG AU-G1/G2/G3/G6 và AU-G4 thuộc LUOI-1 — KHÔNG làm ở đây. -->

**Chờ duyệt kế hoạch:** viết `viec/HOC-2/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.
Chưa viết bài thử, chưa sửa code cho tới khi chủ quán gửi lời duyệt.

## Mục tiêu
Biến các bài học đã trả giá (P26b, TU-CHAY-4, AUDIT-1) thành KHOÁ, để các việc tiền sắp tới (LUOI-1, P26c, P20b…) không
lặp lại: bằng chứng đỏ cũ không khớp bài thử, đột biến cũ hỏng âm thầm trên HEAD, bất biến trùng, khoá cấu hình không ai
đọc, công cụ cũ có thể ghi kho thật, sổ tay khuôn lỗi đầy. Việc này KHÔNG đổi `server/`, `client/`.
KHÔNG làm (đề xuất cũ trong sổ việc): cổng kiểm "file:dòng trong báo cáo trỏ đúng dòng ở HEAD" — máy chỉ kiểm được
file có tồn tại, không kiểm được dòng đó đúng ý; dễ báo oan (K8). Thay bằng A3–A4 (bằng chứng và đột biến khớp HEAD).

### Lưu ý quan trọng — cổng của chính PR này chạy LUẬT CŨ
Cổng trên GitHub dùng `tu_chay/cong.js` + `tu_chay/cau_hinh.json` của `main`. Vì vậy:
- luật mới ở nhóm A (A2–A5) KHÔNG áp cho chính PR này, nhưng hồ sơ của HOC-2 vẫn phải tự tuân theo (A6);
- mỗi `thu_*.js` mới hoặc bị sửa phải ĐỎ trên code gốc, TRỪ file ghi ở `## Bài thử cũ sửa` (chỉ thêm ca hồi quy);
  file nào vừa có ca hành vi mới đỏ trên gốc thì KHÔNG cần miễn;
- `cong_cu/thu_gia_lap.js` CỐ Ý đổi (11 → 10 bất biến) nên đỏ trên gốc — KHÔNG ghi vào `## Bài thử cũ sửa`.
Kế hoạch phải có bảng: file bài thử nào bị đụng → ca nào đỏ trên gốc, hoặc dòng miễn nào.
Bản GỐC (ở main) của file ghi trong `## Bài thử cũ sửa` chạy trên code PR cũng phải xanh — đỏ thì DỪNG, ghi
`## Câu hỏi` (chủ quán sửa phiếu bằng commit `PHIEU: HOC-2` mới), không tự lách.

## Nghiệm thu

### A. Cổng PR (`tu_chay/cong.js`, `tu_chay/cau_hinh.json`) — ca thử trong `tu_chay/thu_cong.js`
- A1 (AU-B1) Cổng A14 "nhánh không dạng `viec/<MÃ>`" có ca RIÊNG: phiếu hợp lệ ở `viec/<MÃ>` nhưng nhánh tên khác →
  đỏ đúng dòng A14 dạng-nhánh. Đột biến bỏ cổng đó (`B1-A14-bo-dang-nhanh` của `viec/AUDIT-1/dot_bien.py`) → BẮT.
- A2 (AU-B2) Mỗi khoá trong `tu_chay/cau_hinh.json` hoặc có code đọc, hoặc nằm trong một danh sách khoá-chỉ-tài-liệu
  khai rõ; khoá không ai đọc thì xoá (kể cả `lenh_gia_lap` rỗng). Có phép kiểm: thêm một khoá lạ → đỏ. Kế hoạch liệt kê
  từng khoá: ai đọc (file:dòng) / tài liệu / xoá. `vuot_ngan_sach_canh_bao`: hoặc cổng dùng nó (chỉ CẢNH BÁO khi số dòng
  code đổi vượt ngân sách phiếu × hệ số), hoặc xoá — kế hoạch chọn, nêu lý do.
- A3 (P26b) `viec/<MÃ>/bang_chung_do.txt` phải khớp bài thử hiện tại: số ca ghi trong bằng chứng = số ca bài thử ở
  head. Ca đỏ: thêm 1 ca vào bài thử, giữ bằng chứng cũ → cổng đỏ, nói rõ file + hai con số. Việc không có bài thử
  đỏ (mục `## Bài thử đỏ` ghi "không") → không áp. Kế hoạch chốt định dạng dòng đếm (một dạng, máy đọc được).
- A4 (HOC-1 Phát hiện 6–7) Mọi tên đột biến trong `viec/<MÃ>/dot_bien.py` phải có trong `viec/<MÃ>/trang_thai.md`.
  Ca đỏ: thêm một đột biến, không ghi tên → cổng đỏ, in tên thiếu.
- A5 (VÁ SAI bắt buộc, chốt 02.10) PR đổi `server/` hoặc `client/src/` phải có `viec/<MÃ>/dot_bien.py` với ít nhất một
  đột biến dạng "vá sai" (quy ước tên do kế hoạch chốt, ví dụ tiền tố `VS-`). Ca đỏ: PR đổi `server/` không có
  `dot_bien.py` → đỏ; có file nhưng không có đột biến vá sai → đỏ. PR không đổi code chạy thật → không áp (K5).
- A6 Hồ sơ của chính HOC-2 tự đạt A3–A5 (chạy `cong.js` MỚI trên nhánh này, ghi kết quả vào `trang_thai.md`).
- A7 (AU-B3b) `ban_mau_pos/thu/` vào `thu_muc_bai_thu` HOẶC ghi rõ vì sao không (kế hoạch đọc `laBaiThu` + A11/A12 xem
  thêm vào thì PR nào bị ảnh hưởng). (AU-B3c) `cong_cu/thu_P20.js`, `cong_cu/thu_P21.js`, `cong_cu/thu_P26a.js`,
  `cong_cu/thu_P26b.js` vào `file_luat`. Ca: phiếu chỉ ghi `cong_cu/**` mà sửa `cong_cu/thu_P26b.js` → người gác chặn
  `G-LUAT`; ghi đúng tên → cho qua (K5).
- Không đổi luật nào khác của cổng. Không đổi `tu_chay/cong_github.yml`.

### B. Người gác (`tu_chay/nguoi_gac.js`) — ca thử trong `tu_chay/thu_nguoi_gac.js`
- B1 (AU-A1) Phép khoá `CONG_CU_DOC` và `CONG_CU_SUA` bằng tập cố định trong bài thử. Đột biến `A3-CCLA-them-la`
  (`viec/AUDIT-1/dot_bien.py`) → BẮT.
- B2 (P26b: người gác chặn ~25 lần khi dựng bản sao server gốc) Công cụ mới `cong_cu/ban_sao_goc.py <commit> <thư mục
  đích>`: dựng bản sao `server/` của một commit + liên kết `node_modules`, đích chỉ trong thư mục nháp/tạm (không trong
  kho, không đè `server/` thật), không ghi gì lên git. Lệnh `python3 cong_cu/ban_sao_goc.py …` được người gác cho qua
  ở phiên việc. Ca: đích nằm trong kho → công cụ từ chối; đích ngoài nháp/tạm → từ chối. Chỉ sửa `nguoi_gac.js` nếu
  thật cần để lệnh này qua — và chỉ cho đúng lệnh này, không nới luật khác. Kế hoạch nói rõ có sửa hay không.

### C. Bộ kiểm + giả lập
- C1 (chốt 1b, AU-D1/D2) T2, T3, T4, F2 GIỮ cảnh báo. Mỗi chỗ thêm một dòng chú thích lý do (vd T2–T4: máy sửa
  `tu_chay/` trên nhánh thì bản cài chắc chắn lệch tới khi chủ quán chạy `cai_dat.sh`; cổng A8 đã chặn cứng). Không
  đổi hành vi.
- C2 (chốt 2a, AU-C1/E1) Bỏ bất biến I10 ở `cong_cu/gia_lap/bat_bien.js`; `NGUONG_BAT_BIEN` 11 → 10 kèm chú thích
  "I10 ⊂ I11, không giảm độ phủ"; dòng tổng giả lập và `cong_cu/thu_gia_lap.js` khớp 10. Chứng minh bao trùm bằng
  CHẠY: các đột biến trước đây I10 bắt (`thu_gia_lap` M11, M12; `viec/P26b/dot_bien.py` các dòng chờ `I10`) nay vẫn đỏ
  — nhờ I11 hoặc bất biến khác (ghi từng tên → bất biến bắt). Một đột biến nào chuyển SỐNG → DỪNG, ghi `## Câu hỏi`.
- C3 (AU-C3) Ghi chú thời gian ở `kiem_tra_truoc_khi_giao.js` (dòng ghi 22 s / 24 s) sửa theo số đo thật lúc làm. Thêm
  CẢNH BÁO (không chặn) khi giả lập hoặc `thu_gia_lap` chạy gần hạn (110/120 s). Ngưỡng chọn theo số đo thật (máy mây
  + log `cong-chay` trên GitHub) sao cho lúc bình thường KHÔNG bật — cảnh báo bật mỗi lần là báo oan (K8). Ca: hạ hạn
  giả trong bài thử → thấy cảnh báo; hạn thật → không cảnh báo.
- C4 (P26b vòng Q9) `cong_cu/thu_P26b.js`: M6 `<= 1` → `=== 1`; thêm ca "đơn có ví mẹ, phần mẹ 0đ → duyệt 200, 0 dòng
  hoàn mẹ" (đột biến `> 0` → `>= 0` phải BẮT); ca "yêu cầu cũ trên đơn có mẹ → duyệt hoàn mẹ"; KB17-Q9 trong
  `cong_cu/gia_lap/kich_ban.js` kiểm đơn tạo được trước khi đo. Chỉ thêm/siết ca — KHÔNG sửa `server/`; ca nào lộ code
  đang sai → DỪNG, ghi `## Câu hỏi`.
- C5 (AU-G5) `thu_P20.js` còn sống: một đột biến phá đúng thứ `thu_P20` canh (mã bill claim / nhận điểm) mà KHÔNG phép
  tĩnh nào bắt trước → `thu_P20` in dòng đỏ của chính nó. Không dựng được → ghi rõ vì sao. `thu_P20` luôn xanh dù phá
  → DỪNG, ghi `## Câu hỏi` (không tự viết lại bài).

### D. Đột biến cũ và công cụ cũ (AU-E1/E2/E3, chốt 3a)
- D1 (AU-E2) `viec/HOC-1/dot_bien.py` `MB`, `MB4` neo theo `"package.json"` ngắn/riêng → chạy được, BẮT trên HEAD.
- D2 (AU-E1) `viec/P26b/dot_bien.py` `I10-bo`: bỏ (I10 không còn) và ghi một dòng lý do trong file; cả bộ chạy không
  còn HỎNG.
- D3 (AU-E3) `viec/TU-CHAY-4/dot_bien.py` kiểu `tai_cho` đổi sang bản sao trong thư mục tạm — không ghi file thật nào
  (so `git status` trước/sau). F2, S3 vẫn BẮT.
- D4 (chốt 3a, AU-B3) Xoá `cong_cu/thu_p1.js`. `grep` không còn chỗ nào gọi nó ngoài các script vá cũ ở gốc (không
  sửa các script đó; ghi tên vào `## Phát hiện` cho DON-DEP-v1).
- D5 Chạy LẠI CẢ BỘ trên head cuối: `viec/AUDIT-1/dot_bien.py` (mọi nhóm), `viec/P26b/dot_bien.py`,
  `viec/HOC-1/dot_bien.py`, `viec/TU-CHAY-4/dot_bien.py`. Ghi bảng BẮT/SỐNG/HỎNG/LẠC từng bộ vào `trang_thai.md`,
  ĐẾM đủ — không lấy mẫu. Mong: 0 HỎNG; các SỐNG còn lại chỉ là C2F của AU-G1/G2/G3/G4/G6 (thuộc LUOI-1) — liệt kê tên.

### E. Tài liệu
- E1 (chốt 4a) `KHUON_LOI.md` ≤ 100 dòng, trần `khuon_loi_toi_da` giữ 120. Mỗi khuôn giữ nguyên "Dấu hiệu" và "Chặn";
  "Đã gây" rút còn 1–2 ví dụ; bỏ lời dặn đã có phép kiểm làm thay (ghi tên phép). Gộp thêm, vẫn trong ≤ 100 dòng:
  (K8) phép tự-kiểm báo oan dạy người bỏ qua nó; (K3) con số "đạt" phải kèm lần chạy lại trên HEAD, đột biến neo
  NGẮN/RIÊNG vì neo dài rữa theo thời gian; (K1/K5) xếp "đường tiền" theo cái khách chạm ở quầy + middleware + khoá
  trong thân hàm, không theo nhãn "admin/hiếm" hay "chưa có trong kịch bản"; nhánh hỏng (SX lỗi, mạng) đụng kho/tiền
  là NẶNG. `trang_thai.md` có bảng: dòng/ý bị bỏ → lý do (đã có phép X / gộp vào Kn).
- E2 (AU-F1/F2) `CLAUDE.md`: câu ở dòng ~113 sửa đúng phạm vi nhóm E (chỉ `from_package`, không `discount_*`); dòng ~26
  bỏ số phép đếm cứng.
- E3 `tu_chay/skill_lam_viec.md`: (a) bước 4–5 — việc đổi code chạy thật bắt buộc đột biến VÁ SAI + bỏ vá, kèm bảng
  "chỗ vá → đột biến" trong `trang_thai.md` (khớp A4, A5); (b) bước 6 — trước khi báo xong, ĐẾM từng mục nghiệm thu
  có bằng chứng, không lấy mẫu; (c) thấy thông báo đổi model giữa phiên → ghi giờ + bước vào `trang_thai.md`.
  `tu_chay/lenh_ra_soat.md`: agent soát đối chiếu ĐỦ từng mục nghiệm thu bằng đếm, liệt kê mục thiếu.
  `tu_chay/MAU_PHIEU.md` + `tu_chay/THIET_KE.md`: ghi luật A2–A5 mới. `tu_chay/PHIEN_BAN` lên `tu-chay 1.4.0`.

### F. Kiểm sống (ghi vào `viec/HOC-2/trang_thai.md`)
- F1 Lúc mở phiên: in `git log --oneline -3`, khớp GitHub.
- F2 Chủ quán chạy `bash tu_chay/cai_dat.sh` trên nhánh việc trước khi mở PR; PR có 2 check `cong` + `cong-chay` xanh.

### G. Toàn bộ
`npm test` và `node kiem_tra_truoc_khi_giao.js --day-du` xanh; `thu_nguoi_gac`, `thu_cong`, `thu_cong_cu`,
`thu_gia_lap`, `thu_P20`, `thu_P26b` xanh. Mỗi nhóm A–D có ca đỏ trước (chạy trên gốc hoặc đột biến) ghi trong
`bang_chung_do.txt` / `trang_thai.md`. Kế hoạch ghi ước lượng thời gian máy: quá ~150 phút thì đề xuất cách tách
(HOC-2a / HOC-2b) để chủ quán chọn — KHÔNG tự cắt mục.

## Phạm vi
- viec/HOC-2/**
- tu_chay/cong.js
- tu_chay/cau_hinh.json
- tu_chay/nguoi_gac.js
- tu_chay/thu_cong.js
- tu_chay/thu_cong_cu.js
- tu_chay/thu_nguoi_gac.js
- tu_chay/skill_lam_viec.md
- tu_chay/lenh_ra_soat.md
- tu_chay/MAU_PHIEU.md
- tu_chay/THIET_KE.md
- tu_chay/PHIEN_BAN
- kiem_tra_truoc_khi_giao.js
- cong_cu/gia_lap/bat_bien.js
- cong_cu/gia_lap/kich_ban.js
- cong_cu/gia_lap/chay.js
- cong_cu/thu_gia_lap.js
- cong_cu/thu_P20.js
- cong_cu/thu_P26b.js
- cong_cu/thu_p1.js
- cong_cu/ban_sao_goc.py
- viec/P26b/dot_bien.py
- viec/HOC-1/dot_bien.py
- viec/TU-CHAY-4/dot_bien.py
- KHUON_LOI.md
- CLAUDE.md

## Bài thử cũ sửa
- cong_cu/thu_P26b.js — siết M6 (=== 1) và thêm ca ví mẹ vòng Q9; server không đổi nên xanh trên gốc
- cong_cu/thu_P20.js — chỉ thêm ca/khả năng chứng minh còn sống (AU-G5) nếu cần; server không đổi
- tu_chay/thu_nguoi_gac.js — thêm ca khoá tập CONG_CU_DOC/CONG_CU_SUA (AU-A1), hành vi người gác đã có

## Ngân sách
Code ~200 dòng: `cong.js` +~90 (A2–A5), `nguoi_gac.js` ±~10 (chỉ nếu B2 cần), `cau_hinh.json` ±~10,
`kiem_tra_truoc_khi_giao.js` ±~20 (C1, C2, C3), `bat_bien.js` −~10, `ban_sao_goc.py` +~50, ba `dot_bien.py` cũ ±~40.
Thử ~250 dòng: `thu_cong.js` +~150 (A1–A5, A7), `thu_nguoi_gac.js` +~30 (B1, B2, A7), `thu_P26b.js` +~40 (C4),
`thu_gia_lap.js` ±~15 (C2, C3), `thu_P20.js` +~20 (C5 nếu cần).
Tài liệu: `KHUON_LOI.md` giảm còn ≤ 100 dòng; `CLAUDE.md` ±~5; skill + lệnh soát +~20; `MAU_PHIEU.md` + `THIET_KE.md` +~40.
Ghi chú phạm vi: `tu_chay/nguoi_gac.js`, `cong_cu/gia_lap/chay.js`, `cong_cu/thu_P20.js` chỉ sửa khi mục tương ứng cần.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `server/`, `client/`, `.claude/`, `.github/`, `package.json`, sổ việc. Không chạy `cai_dat.sh` trên kho
  thật; đổi `tu_chay/` xong thì chủ quán tự cài trên nhánh việc.
- Không làm gì cho AU-G1/G2/G3/G4/G6 ngoài việc liệt kê chúng ở D5 (thuộc LUOI-1).
- Không viết lệnh thử vượt người gác hàng loạt; ca người gác chỉ ở mức B1, B2, A7.
- Không nới luật nào của cổng hay người gác ngoài đúng các mục trên. Không hạ trần `khuon_loi_toi_da`, không nới hạn
  thời gian giả lập.
- Chỉ push đúng `git push -u origin viec/HOC-2`. Không đụng `main`, không merge, không tạo PR. Không chạy `patch_*.py`.
