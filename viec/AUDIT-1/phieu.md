# AUDIT-1 — Soát toàn bộ phần tự chạy: luật nào thật sự chặn, phép nào thật sự đỏ, tài liệu nào nói đúng

**Chờ duyệt kế hoạch:** viết `viec/AUDIT-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Từ TU-CHAY-1 tới P26b, mọi lớp an toàn của quầy (người gác, cổng PR, giả lập, bộ kiểm, hồ sơ) được xây dần qua 8 việc.
Chưa lần nào soát cả hệ cùng lúc: luật nào khai là chặn nhưng thật ra lọt, phép nào luôn xanh, tài liệu nào nói sai cơ chế.
Ví dụ đã lộ ở P26b: đột biến `I10-bo` không áp được mà hồ sơ vẫn ghi "đạt"; bằng chứng đỏ lệch số ca suốt 3 vòng soát.
Việc này CHỈ ĐỌC + ĐO + BÁO CÁO, không sửa gì ngoài `viec/AUDIT-1/`. Kết quả là đầu vào duy nhất của HOC-2 (vá).
Làm bây giờ vì sắp vào chuỗi việc tiền (P26c, P20b, P22–P24): phải biết lưới đang thủng ở đâu trước khi dựa vào nó.

Định nghĩa dùng trong cả phiếu:
- **BẮT** = đột biến áp đúng số chỗ VÀ đầu ra có dòng lệch khớp mẫu ghi sẵn (đúng ca/đúng mã), không chỉ mã thoát ≠ 0.
- **SỐNG** = đột biến áp đúng mà mọi bài thử/giả lập/bộ kiểm vẫn xanh → một phát hiện.
- **HỎNG** = đột biến không áp được (chuỗi không khớp đúng số lần ghi sẵn) → không bao giờ đếm là BẮT (K3).
- **NẶNG** = có thể làm sai tiền/ví/điểm/gói/kho ở quầy, hoặc để lọt việc mà luật/cổng/tài liệu nói là chặn
  (người/máy tin là an toàn trong khi không). **NHẸ** = thừa, chồng, chậm, khó đọc, tài liệu lệch mà không ai tin nhầm.

## Nghiệm thu
A — Người gác (`tu_chay/nguoi_gac.js`, bài thử `tu_chay/thu_nguoi_gac.js`):
- A1 Bảng MỌI mã trong `LUAT` (đếm từ code, không chép số): mỗi mã có ≥1 ca phải chặn ĐÚNG mã và ≥1 ca hợp lệ gần nhất phải
  cho qua (K5); thiếu ca nào → phát hiện. Ghi tên ca (hoặc dòng) trong `thu_nguoi_gac.js`.
- A2 Tắt từng mã → `thu_nguoi_gac.js` đỏ (chạy lại cơ chế có sẵn, ghi số mã bị bắt / tổng).
- A3 VÁ SAI: mỗi nhóm luật (NG, CC, G, B, GIT, NPM, PY, NODE, RM/CP/MV/LN, TAR, SED/AWK, FIND, CURL, MKDIR, FILE) ≥1 đột biến
  "vá sai" (vd đảo điều kiện khớp, nới glob, bỏ chuẩn hoá đường dẫn, so khớp phân biệt hoa thường) trên BẢN SAO người gác.
- A4 Cố tình lách (loại lỗi 3): mỗi mã ≥1 lệnh lách thử đưa vào bản sao người gác dưới dạng JSON đầu vào của hook
  (KHÔNG thực thi lệnh đó trong phiên). Lọt = phát hiện, ghi nguyên lệnh lách.

B — Cổng PR (`tu_chay/cong.js`, bài thử `tu_chay/thu_cong.js`, `tu_chay/thu_cong_cu.js`):
- B1 Bảng mọi mã A* trong `cong.js`: ca đỏ trong `thu_cong.js`, đột biến tắt (`tat`) bị bắt, ≥1 VÁ SAI mỗi mã bị bắt.
- B2 Mỗi khoá của `tu_chay/cau_hinh.json`: code nào đọc (file:dòng) hay chỉ tài liệu nhắc. Khoá khai mà không code nào đọc
  → phát hiện (đã biết: `lenh_gia_lap`; máy tự kiểm mọi khoá còn lại).
- B3 `thu_muc_bai_thu`, `file_luat`, `file_cam`, `ban_cai` khớp thực tế: liệt kê mọi `thu_*.js` trong kho, cái nào cổng coi là
  bài thử (A11 áp), cái nào không mà đáng ra phải có (vd `ban_mau_pos/thu/`, `viec/*/thu_*.js`); file luật nào chưa trong
  `file_luat`.
- B4 Chạy `node tu_chay/cong.js tinh` của main trên chính nhánh này (sau khi có báo cáo) → ĐẠT; ghi đầu ra.

C — Giả lập (`cong_cu/gia_lap/`, `cong_cu/thu_gia_lap.js`):
- C1 Mỗi bất biến I1–I11 có ≥1 đột biến BẮT (đối chiếu bảng M1–M13 của `thu_gia_lap.js`; bất biến không có đột biến → tự
  thêm trong `viec/AUDIT-1/`). Bất biến bị bất biến khác bao trùm hoàn toàn (đã biết: I10 ⊂ I11) → phát hiện NHẸ + đề xuất.
- C2 Phủ nhánh ghi: MỌI câu `INSERT`/`UPDATE`/`DELETE` trong `server/routes/` đụng tiền/ví/điểm/gói/thẻ/kho/mã ưu đãi
  (ít nhất: `orders.js`, `refunds.js`, `wallets.js`, `damages.js`, `packages.js`, `signup-codes.js`, `discount-codes.js`,
  `rewards.js`, `loyalty.js`, `don-mo-rong.js`, `customers-v2.js`, và mọi chỗ gọi `ghiVi`) → bỏ câu đó trên bản sao →
  giả lập hoặc một bài thử phải BẮT. SỐNG ở câu đụng tiền/ví/điểm/kho = NẶNG. Các file routes còn lại: ghi số câu, đánh
  CHƯA KIỂM (không bắt buộc chạy).
- C3 Đo thời gian giả lập và `thu_gia_lap.js` 3 lần, so hạn trong cổng/bài thử (110/120 s) → ghi số đo.

D — Bộ kiểm (`kiem_tra_truoc_khi_giao.js`):
- D1 Mỗi phép (đếm từ code, cả bản nhanh lẫn `--day-du`) có ≥1 đột biến làm nó ĐỎ thật (trên bản sao code hoặc bản sao bộ
  kiểm). Phép không làm đỏ được = SỐNG = phát hiện. Ghi tên phép → đột biến → dòng lệch.

E — Hồ sơ các việc đã gộp (HOC-1, TU-CHAY-4, P26a, P26b; cũ hơn nếu có):
- E1 Chạy lại mọi `viec/*/dot_bien.py` trên main hôm nay: bảng BẮT/SỐNG/HỎNG từng tên. HỎNG = phát hiện (đã biết: `I10-bo`).
- E2 `bang_chung_do.txt` của từng việc khớp số ca của bài thử hiện tại không; tên đột biến trong `dot_bien.py` có trong
  `trang_thai.md` không.

F — Tài liệu (`CLAUDE.md`, `KHUON_LOI.md`, `tu_chay/THIET_KE.md`, `tu_chay/MAU_PHIEU.md`, `tu_chay/skill_lam_viec.md`,
`tu_chay/lenh_ra_soat.md`):
- F1 Mỗi câu khẳng định CƠ CHẾ (chặn, cấm, bắt buộc, phải đỏ, tự kiểm, cổng bắt…) → dẫn phép kiểm (file:dòng hoặc tên ca)
  hoặc ghi CHƯA KIỂM. Khẳng định SAI cơ chế (thử thật thấy không chặn/không kiểm) = phát hiện NẶNG.
- F2 Lời dặn nào đã có phép kiểm làm thay → đề xuất xoá (đầu vào rút gọn `KHUON_LOI.md` 120/120 trong HOC-2).

G — Sản phẩm (tất cả trong `viec/AUDIT-1/`):
- G1 `bao_cao.md`: bảng phát hiện, mỗi dòng: mã `AU-<n>` · nhóm A–F · NẶNG/NHẸ · file:dòng ở HEAD · lệnh chạy lại để thấy ·
  đề xuất khoá cho HOC-2 (file nào, phép kiểm/ca đỏ nào). Cuối bảng: tỷ lệ BẮT/SỐNG/HỎNG theo nhóm A, B, C, D, E và tổng.
- G2 `dot_bien.py` (chạy ở gốc kho: `python3 viec/AUDIT-1/dot_bien.py [nhóm|tên…]`): mọi đột biến của A–E; mỗi đột biến khai
  (tên, file, chuỗi gốc, chuỗi thay, số lần khớp, lệnh chạy, mẫu phải thấy); chỉ sửa BẢN SAO trong thư mục tạm; chạy song
  song có giới hạn; in BẮT/SỐNG/HỎNG từng tên + tổng. Không đặt tên file `thu_*.js` trong `viec/AUDIT-1/`.
- G3 Chứng minh công cụ đo không nói dối (thay bước 4 "bài thử đỏ"): một đột biến cố ý sai chuỗi → in HỎNG; một đột biến đã
  biết bị bắt → in BẮT; một đột biến vô hại đã biết → in SỐNG. Lưu vào `bang_chung_do.txt`.
- G4 Hai bên soát độc lập: `/ra-soat` tự chạy lại ≥10 đột biến chọn ngẫu nhiên + kiểm lại ≥5 phát hiện + tìm ≥1 lỗ chưa
  có trong báo cáo (không tìm được thì ghi rõ đã thử gì). Chat soát cuối chạy lại toàn bộ `dot_bien.py`.
- G5 Mỗi tên đột biến trong `dot_bien.py` có trong `trang_thai.md` (bài học HOC-2). `npm test` và
  `node kiem_tra_truoc_khi_giao.js --day-du` vẫn xanh (không file nào ngoài `viec/AUDIT-1/` đổi).

Luồng hợp lệ phải KHÔNG bị ảnh hưởng (K5): không đổi một byte nào ngoài `viec/AUDIT-1/`; `git status` sạch sau mỗi lần chạy
`dot_bien.py` (thư mục tạm xoá khi xong, kể cả khi bị ngắt).

Cổng của PR này chấm bằng luật main (tu-chay 1.3.2). Việc không đổi code chạy thật, không có `thu_*.js` mới → A11/A12 không
áp; vẫn phải qua A6–A10, A13, A14.

## Phạm vi
- viec/AUDIT-1/**

## Bài thử đỏ
không — việc chỉ đọc + báo cáo, không đổi code; công cụ đo tự chứng minh bằng G3 (bang_chung_do.txt)

## Ngân sách
`dot_bien.py` ~500–900 dòng (phần lớn là bảng đột biến); `bao_cao.md` ≤ 300 dòng (chi tiết dài để file phụ trong
`viec/AUDIT-1/`). Thời gian máy chạy đột biến: kế hoạch ước lượng từng nhóm; tổng > 90 phút thì nêu cách cắt (chạy song
song, chọn mẫu có lý do) và hỏi trong lời duyệt.
Làm theo nhóm, mỗi nhóm xong thì commit + push (`trang_thai.md` ghi nhóm nào xong) để hết hạn mức giữa chừng thì
`/lam-viec AUDIT-1 tiep` làm tiếp được.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa bất kỳ file nào ngoài `viec/AUDIT-1/` — kể cả lỗi thấy rõ, sửa một dòng: ghi phát hiện + đề xuất, để HOC-2 vá.
  Không sửa `KHUON_LOI.md` (đã 120/120): bài học ghi trong `trang_thai.md` dạng đề xuất.
- Lệnh "cố tình lách" chỉ đưa vào bản sao người gác dưới dạng dữ liệu; KHÔNG chạy thật lệnh lách, không thử lách người gác
  đang gác phiên này.
- Đột biến chỉ trên bản sao trong thư mục tạm; không đụng `server/` thật, `data/`, `.claude/`, `.github/`, Turso, production.
- Không gọi GitHub API (hay bị giới hạn lượt); chỉ `git` với kho.
- Chỉ push đúng nhánh việc: `git push -u origin viec/AUDIT-1`. Không đụng `main`, không merge, không tạo PR, không sửa sổ việc.
