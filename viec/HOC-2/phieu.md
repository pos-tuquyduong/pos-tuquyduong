# HOC-2 — Khoá hồ sơ + cổng + người gác (phần BỘ KHUNG; phần còn lại tách sang HOC-2b)

<!-- Phiếu do chat soạn 05.10.2026 — BẢN SỬA (commit PHIEU thứ hai). Thay bản đầu (vân tay 2b23594f4120, commit ba72a3f).
     Chủ quán chốt khi duyệt kế hoạch (ke_hoach.md, mục Câu hỏi): Q1 bỏ tu_chay/thu_nguoi_gac.js khỏi mục miễn (bản gốc
     khoá PHIEN_BAN 1.3.2); Q2 TÁCH — việc này chỉ làm phần tu_chay/; C1–C5, D2–D5, E1–E2 của bản đầu thành việc HOC-2b
     (làm sau khi HOC-2 gộp); Q3 xoá vuot_ngan_sach_canh_bao; Q4 luật VÁ SAI không áp khi phiếu có miễn ## Bài thử đỏ.
     Số mục giữ như bản đầu để khớp ke_hoach.md. Nền: main cb5d9fd (sổ v21). -->

**Kế hoạch ĐÃ DUYỆT (chủ quán, 05.10, qua chat soát code thật):** dùng `viec/HOC-2/ke_hoach.md` đã có. Thêm vào đó một mục
ngắn "Phạm vi sau khi tách" (mục nào làm, mục nào sang HOC-2b, ước thời gian mới), commit, push rồi LÀM LUÔN từ bước 4 —
không dừng lại xin duyệt nữa. Giữ nguyên các lựa chọn đã chốt trong kế hoạch: bảng khoá nằm trong `thu_cong.js`; dòng `SỐ CA`;
A16–A18 là khối riêng, không đổi chuỗi neo của đột biến AUDIT-1; không sửa `nguoi_gac.js`; không thêm `ban_mau_pos/thu/`.

## Mục tiêu
Biến các bài học đã trả giá (P26b, TU-CHAY-4, AUDIT-1) thành KHOÁ ở bộ khung `tu_chay/` (cổng PR, người gác, skill,
lệnh soát), để các việc tiền sắp tới (HOC-2b, LUOI-1, P26c…) bị chặn khi: bằng chứng đỏ không khớp bài thử, đột biến không
ghi hồ sơ, đổi code chạy thật mà không có đột biến vá sai, khoá cấu hình không ai đọc. Việc này KHÔNG đổi `server/`,
`client/`, bộ kiểm, giả lập.
KHÔNG làm ở đây (sang HOC-2b): bỏ I10 + bánh cóc 10, cảnh báo gần hạn giả lập, chú thích T2–T4/F2, `thu_P26b` M6 + ca Q9,
KB17, `thu_P20` còn sống, đột biến cũ P26b / TU-CHAY-4, xoá `cong_cu/thu_p1.js`, `KHUON_LOI.md` ≤ 100, `CLAUDE.md`.
KHÔNG làm (đề xuất cũ): cổng kiểm "file:dòng trong báo cáo trỏ đúng HEAD" — chỉ kiểm được file tồn tại, dễ báo oan (K8).

### Lưu ý quan trọng — cổng của chính PR này chạy LUẬT CŨ
Cổng trên GitHub dùng `tu_chay/cong.js` + `tu_chay/cau_hinh.json` của `main`. Vì vậy:
- luật mới (A2–A5) KHÔNG áp cho chính PR này, nhưng hồ sơ của HOC-2 vẫn phải tự tuân theo (A6);
- mỗi `thu_*.js` mới hoặc bị sửa phải ĐỎ trên code gốc. Phiếu này KHÔNG có mục `## Bài thử cũ sửa`: mọi bài thử bị đụng
  (`thu_cong.js`, `thu_nguoi_gac.js`, `thu_cong_cu.js`) đều có ca hành vi mới đỏ trên gốc. Bài nào chỉ còn ca hồi quy
  (xanh trên gốc) → DỪNG, ghi `## Câu hỏi`, không tự lách.

## Nghiệm thu

### A. Cổng PR (`tu_chay/cong.js`, `tu_chay/cau_hinh.json`) — ca thử trong `tu_chay/thu_cong.js`
- A1 (AU-B1) Cổng A14 "nhánh không dạng `viec/<MÃ>`" có ca RIÊNG soi đúng câu kết luận của cổng dạng-nhánh. Đột biến
  `B1-A14-bo-dang-nhanh` (`viec/AUDIT-1/dot_bien.py`) → BẮT.
- A2 (AU-B2, Q3) Mỗi khoá trong `tu_chay/cau_hinh.json` hoặc có code đọc, hoặc nằm trong danh sách khoá-chỉ-tài-liệu khai
  rõ; khoá không ai đọc thì xoá — gồm `vuot_ngan_sach_canh_bao` (chủ quán chốt Q3) và `lenh_gia_lap`. Có phép kiểm: thêm
  một khoá lạ → đỏ; khoá ghi "có code đọc" mà file đọc không còn nhắc → đỏ. Trước khi xoá: chứng minh không còn ai đọc
  (người gác, `cai_dat.js`, cổng, giả lập, bộ kiểm nạp được cấu hình mới).
- A3 (P26b) `viec/<MÃ>/bang_chung_do.txt` phải khớp bài thử hiện tại: số ca ghi trong bằng chứng = số ca bài thử ở head.
  Ca đỏ: thêm 1 ca vào bài thử, giữ bằng chứng cũ → cổng đỏ, nêu file + hai con số. Phiếu có miễn `## Bài thử đỏ` → không
  áp. Định dạng dòng đếm: một dạng, máy đọc được, ghi vào MAU_PHIEU + skill.
- A4 (HOC-1 Phát hiện 6–7) Mọi tên đột biến trong `viec/<MÃ>/dot_bien.py` phải có trong `viec/<MÃ>/trang_thai.md`.
  Ca đỏ: thêm một đột biến, không ghi tên → cổng đỏ, in tên thiếu.
- A5 (VÁ SAI bắt buộc, chốt 02.10; Q4) PR đổi `server/` hoặc `client/src/` phải có `viec/<MÃ>/dot_bien.py` với ít nhất
  một đột biến "vá sai" (tiền tố `VS-`). Ca đỏ: PR đổi `server/` không có `dot_bien.py` → đỏ; có file nhưng không có `VS-`
  → đỏ. KHÔNG áp (K5): PR không đổi hai thư mục đó; phiếu có miễn `## Bài thử đỏ` (chủ quán chốt Q4) — mỗi trường hợp một ca.
- A6 Hồ sơ của chính HOC-2 tự đạt A3–A5: chạy `cong.js` MỚI (`tinh` trên kho, `chay` trên bản sao kho trong thư mục
  nháp), ghi kết quả vào `trang_thai.md`.
- A7 (AU-B3b) `ban_mau_pos/thu/` KHÔNG vào `thu_muc_bai_thu` — ghi lý do vào `THIET_KE.md` + `## Phát hiện` (bài thử bản
  mẫu luôn thoát 0). (AU-B3c) `cong_cu/thu_P20.js`, `cong_cu/thu_P21.js`, `cong_cu/thu_P26a.js`, `cong_cu/thu_P26b.js`
  vào `file_luat`. Ca: phiếu chỉ ghi `cong_cu/**` mà sửa `cong_cu/thu_P26b.js` → người gác chặn `G-LUAT`; ghi đúng tên →
  cho qua; `cong_cu/**` sửa file không phải luật → cho qua (K5).
- Không đổi luật nào khác của cổng. Không đổi `tu_chay/cong_github.yml`. Không đổi các chuỗi mà đột biến AUDIT-1 neo vào.

### B. Người gác — ca thử trong `tu_chay/thu_nguoi_gac.js` (KHÔNG sửa `tu_chay/nguoi_gac.js`)
- B1 (AU-A1) Phép khoá `CONG_CU_DOC` và `CONG_CU_SUA` bằng tập cố định. Đột biến `A3-CCLA-them-la` → BẮT.
- B2 (P26b) Công cụ mới `cong_cu/ban_sao_goc.py <commit> <thư mục đích>`: dựng bản sao `server/` của một commit + liên
  kết `node_modules`; đích chỉ dưới thư mục tạm, không trong kho, không đè thư mục có sẵn; không ghi gì lên git. Ca: lệnh
  được người gác cho qua; đích trong kho → từ chối; đích ngoài thư mục tạm → từ chối; đích hợp lệ → đúng byte commit,
  `git status` không đổi.

### D1 (AU-E2) Đột biến cũ của bộ khung
`viec/HOC-1/dot_bien.py` `MB`, `MB4` neo NGẮN/RIÊNG theo `"package.json"` → chạy được, BẮT trên HEAD.

### E3. Tài liệu bộ khung
`tu_chay/skill_lam_viec.md`: (a) đổi code chạy thật → bắt buộc đột biến `VS-` (vá sai) + `BV-` (bỏ vá), bảng "chỗ vá →
đột biến" trong `trang_thai.md`, mọi tên đột biến ghi vào `trang_thai.md`, dòng đếm ca trong `bang_chung_do.txt` (khớp
A3–A5); (b) trước khi báo xong, ĐẾM từng mục nghiệm thu có bằng chứng, không lấy mẫu; (c) thấy thông báo đổi model giữa
phiên → ghi giờ + bước vào `trang_thai.md`. `tu_chay/lenh_ra_soat.md`: agent soát đối chiếu ĐỦ từng mục nghiệm thu bằng
đếm, liệt kê mục thiếu. `tu_chay/MAU_PHIEU.md` + `tu_chay/THIET_KE.md`: luật mới, bảng khoá cấu hình, lý do A7.
`tu_chay/PHIEN_BAN` lên `tu-chay 1.4.0` (kèm ca trong bài thử). Ca soi chữ trong `tu_chay/thu_cong_cu.js`.
Số đo thời gian giả lập trong `THIET_KE.md` ("22 s") để HOC-2b sửa cùng chú thích bộ kiểm — ca soi chữ ở đây không đòi.

### F. Kiểm sống (ghi vào `viec/HOC-2/trang_thai.md`)
- F1 Lúc mở phiên: in `git log --oneline -3`, khớp GitHub (phải thấy commit PHIEU thứ hai).
- F2 Chủ quán chạy `bash tu_chay/cai_dat.sh` trên nhánh việc trước khi mở PR; PR có 2 check `cong` + `cong-chay` xanh.

### G. Toàn bộ
`npm test` và `node kiem_tra_truoc_khi_giao.js --day-du` xanh; `thu_nguoi_gac`, `thu_cong`, `thu_cong_cu` xanh; đo thời
gian `thu_cong` sau khi thêm ca (hạn 120 s — quá 90 s thì báo, không nới). Chạy LẠI, đếm đủ, ghi bảng BẮT/SỐNG/HỎNG/LẠC
vào `trang_thai.md`: `viec/AUDIT-1/dot_bien.py` nhóm `G3`, `A3`, `B1` và `!D1-T1-nguoi-gac`, `!D1-T1b-cong-cu`,
`!D1-T1c-cong`; cả bộ `viec/HOC-1/dot_bien.py`; cả bộ `viec/HOC-2/dot_bien.py`. Mong: 0 HỎNG; `B1-A14-bo-dang-nhanh`,
`A3-CCLA-them-la` BẮT. Mỗi mục A, B, D1, E3 có ca đỏ trước (chạy trên gốc hoặc đột biến).

## Phạm vi
- viec/HOC-2/**
- tu_chay/cong.js
- tu_chay/cau_hinh.json
- tu_chay/thu_cong.js
- tu_chay/thu_cong_cu.js
- tu_chay/thu_nguoi_gac.js
- tu_chay/skill_lam_viec.md
- tu_chay/lenh_ra_soat.md
- tu_chay/MAU_PHIEU.md
- tu_chay/THIET_KE.md
- tu_chay/PHIEN_BAN
- cong_cu/ban_sao_goc.py
- viec/HOC-1/dot_bien.py

## Ngân sách
Code ~100 dòng: `cong.js` +~40, `cau_hinh.json` −~6, `ban_sao_goc.py` +~45, `viec/HOC-1/dot_bien.py` ±~4,
`viec/HOC-2/dot_bien.py` (hồ sơ) +~40. Thử ~170 dòng: `thu_cong.js` +~110, `thu_nguoi_gac.js` +~45, `thu_cong_cu.js` +~15.
Tài liệu ~60 dòng: skill + lệnh soát +~20, `MAU_PHIEU.md` + `THIET_KE.md` +~40.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `server/`, `client/`, `.claude/`, `.github/`, `package.json`, `tu_chay/nguoi_gac.js`, `tu_chay/cai_dat.js`,
  bộ kiểm, giả lập, sổ việc. Không làm phần đã tách sang HOC-2b. Không chạy `cai_dat.sh` trên kho thật; đổi `tu_chay/`
  xong thì chủ quán tự cài trên nhánh việc.
- Không viết lệnh thử vượt người gác hàng loạt; ca người gác chỉ ở mức B1, B2, A7.
- Không nới luật nào của cổng hay người gác ngoài đúng các mục trên.
- Chỉ push đúng `git push -u origin viec/HOC-2`. Không đụng `main`, không merge, không tạo PR. Không chạy `patch_*.py`.
