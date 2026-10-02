# HOC-1 — Bài học từ TU-CHAY-3: miễn A11 cho bài thử cũ, package.json là file luật, T2 bỏ thư mục con

<!-- Phiếu do chat soạn 02.10.2026. Chủ quán đồng ý cả ba đề xuất của máy ở TU-CHAY-3 (trang_thai.md,
     Phát hiện 3, 4, 5 và dòng đột biến M9, M10). Nền: main c064f42 (sổ việc v15). -->

**Chờ duyệt kế hoạch:** viết `viec/HOC-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của
`/lam-viec`. Chưa viết bài thử, chưa sửa code cho tới khi chủ quán gửi lời duyệt.

## Mục tiêu
Vá ba chỗ vướng mà TU-CHAY-3 tìm ra, để các việc tiền sau này (P20b trở đi) không bị cổng chặn oan
và không có lối lách:
- thêm bài thử hồi quy vào một file bài thử ĐÃ CÓ (vd thêm ca vào `thu_P20.js`) đang bị cổng chặn
  oan, vì file đó vẫn xanh trên code gốc → cho miễn, nhưng phải khai trong phiếu kèm lý do;
- `npm test` của cổng chạy theo `package.json` của PR → một PR đổi dòng `"test"` là tắt được bộ kiểm.
  Đưa `package.json` vào file luật;
- phép T2 của bộ kiểm cảnh báo oan khi `tu_chay/` có thư mục con.
Kèm theo: ca thử cho hai đột biến M9, M10 còn sống, và ghi lại Phát hiện 5.

Đây cũng là việc ĐẦU TIÊN chạy qua cổng thật: PR phải được 2 check `cong` + `cong-chay` xanh.

### Lưu ý quan trọng — cổng của chính PR này chạy LUẬT CŨ
Cổng trên GitHub luôn dùng `tu_chay/cong.js` và `cau_hinh.json` của `main`. Vì vậy với PR này:
- mỗi file `thu_*.js` mới HOẶC bị sửa phải có ít nhất một ca của hành vi MỚI, để cả file đỏ trên
  code gốc và xanh trên code PR (A11 bản cũ, không có miễn);
- mục `## Bài thử cũ sửa` (nhóm A) CHƯA có hiệu lực cho PR này — không dựa vào nó.
Kế hoạch phải ghi rõ: file bài thử nào bị đụng, ca nào của file đó đỏ trên gốc.

## Nghiệm thu

### A. Miễn A11 cho bài thử ĐÃ CÓ bị sửa (`tu_chay/cong.js`, chế độ `chay`)
Phiếu có mục tuỳ chọn mới `## Bài thử cũ sửa`, mỗi dòng: `- <đường dẫn thu_*.js> — <lý do>`.

Cho qua:
- A1 PR sửa `cong_cu/thu_P20.js` (đã có ở mốc), phiếu ghi `- cong_cu/thu_P20.js — thêm ca hồi quy`;
  bài thử xanh trên gốc, xanh trên PR → không có lý do A11; cổng in dòng "miễn A11 (bài thử cũ sửa):
  cong_cu/thu_P20.js — thêm ca hồi quy".
- A2 Luồng cũ không đổi (K5): bài thử mới đỏ trên gốc + xanh trên PR → ĐẠT như trước.

Phải chặn:
- A3 Bài thử MỚI (không có ở mốc) có ghi trong mục → miễn KHÔNG áp dụng, vẫn phải đỏ trên gốc; cổng
  nói rõ "bài thử mới không được miễn".
- A4 Bài thử cũ được miễn nhưng ĐỎ trên code PR → vẫn A11 (miễn chỉ bỏ điều kiện "đỏ trên gốc").
- A5 Bài thử cũ bị sửa, xanh trên gốc, KHÔNG ghi trong mục → A11 như cũ.
- A6 Dòng hỏng: thiếu lý do sau `—`, không phải `thu_*.js`, đường dẫn không có trong kho → không miễn,
  cổng báo dòng hỏng.
- A7 Miễn A11 KHÔNG thay A12: PR đổi code mà chỉ có bài thử cũ được miễn (không bài nào đỏ hợp lệ),
  phiếu không có `## Bài thử đỏ` → vẫn A12.
- A8 Mục miễn chỉ đọc từ phiếu (file mà máy không sửa được, đổi phiếu ngoài commit `PHIEU:` là A7 cũ).

Tài liệu: `tu_chay/MAU_PHIEU.md` thêm mục `## Bài thử cũ sửa` (tuỳ chọn, cách ghi, giới hạn A3/A7);
`tu_chay/skill_lam_viec.md` nhắc máy: muốn sửa bài thử cũ mà nó vẫn xanh trên gốc thì báo chủ quán thêm
mục vào phiếu, không tự lách.

### B. `package.json` là file luật (`tu_chay/cau_hinh.json`)
- B1 `file_luat` có thêm `"package.json"`; bốn mục cũ giữ nguyên.
- B2 Phiếu chỉ ghi glob chung (vd `*.json`) mà máy sửa `package.json` → người gác chặn `G-LUAT`.
- B3 Phiếu ghi đúng tên `package.json` → người gác cho qua (K5).
- B4 Kiểm cổng bằng ca thử (với cấu hình đã thêm): PR đổi `package.json` mà phiếu chỉ có glob chung →
  A6 "file luật phải ghi ĐÚNG TÊN"; ghi đúng tên → không có A6.
- Không đưa `package-lock.json` vào (ngoài phạm vi); nếu thấy cần thì ghi đề xuất.

### C. T2 bỏ thư mục con (`kiem_tra_truoc_khi_giao.js`)
- C1 `tu_chay/` có một thư mục con, mọi file khớp bản cài → T2 PASS, không cảnh báo.
- C2 Một file trong `tu_chay/` lệch bản cài → vẫn CẢNH BÁO "lệch" như cũ.
- C3 `.claude/tu_chay/` có FILE thừa → vẫn CẢNH BÁO "thừa"; THƯ MỤC con trong `.claude/tu_chay/`
  không tính là thừa (khớp cách `cai_dat.js` và cổng bỏ thư mục con).
- Bài thử chạy T2 trên kho tạm, không đụng kho thật.

### D. Ca cho hai đột biến còn sống
- D1 M9 — phép kiểm `muc_gac` khi nạp `tu_chay/cai_dat.js` (matcher khác `*`, thiếu `|| exit 2`, lệnh
  không trỏ `.claude/tu_chay/nguoi_gac.js`, nhiều hơn một hook): mỗi kiểu sai một ca, trình cài phải dừng,
  không ghi gì. Đột biến tắt phép kiểm → ít nhất một ca đỏ.
- D2 M10 — phép kiểm cấu hình lúc nạp `tu_chay/cong.js` (thiếu `ban_cai`, `muc_gac` hoặc
  `thu_muc_bai_thu`): cổng phải dừng với thông báo rõ. Đột biến tắt phép kiểm → ít nhất một ca đỏ.

### E. Ghi nhận Phát hiện 5 (chỉ tài liệu)
`tu_chay/THIET_KE.md` (B15 hoặc chỗ hướng dẫn chủ quán) thêm một đoạn: mọi thay đổi trong `.claude/`
phải đi qua nguồn `tu_chay/` rồi `bash tu_chay/cai_dat.sh`; sửa tay `.claude/hooks/*.cjs` hay file
`.claude/` khác sẽ bị cổng chặn A8. Không đổi code cho mục này.

### F. Kiểm sống (máy ghi vào `viec/HOC-1/trang_thai.md`)
- F1 Lúc mở phiên: hook đã kéo nhánh `viec/HOC-1` (bước 1 của `/lam-viec` in `git log --oneline -3`,
  khớp GitHub).
- F2 `/ra-soat` nộp báo cáo qua `SubagentHandback` mà người gác KHÔNG chặn. Bị chặn thì ghi rõ giờ,
  mã luật, rồi nộp bằng file nháp như TU-CHAY-3.
- F3 (chủ quán kiểm trên GitHub) PR của việc này có 2 check xanh.

### G. Toàn bộ
`npm test` và `node kiem_tra_truoc_khi_giao.js --day-du` xanh; người gác, `thu_cong`, `thu_cong_cu` xanh.
Mỗi nhóm A–D có ca đỏ trước (đột biến hoặc chạy trên code gốc) ghi trong `trang_thai.md`.
`tu_chay/PHIEN_BAN` lên `tu-chay 1.3.1`.

## Phạm vi
- viec/HOC-1/**
- tu_chay/cong.js
- tu_chay/cau_hinh.json
- tu_chay/cai_dat.js
- tu_chay/thu_cong.js
- tu_chay/thu_cong_cu.js
- tu_chay/thu_nguoi_gac.js
- tu_chay/MAU_PHIEU.md
- tu_chay/skill_lam_viec.md
- tu_chay/THIET_KE.md
- tu_chay/PHIEN_BAN
- kiem_tra_truoc_khi_giao.js
- cong_cu/thu_HOC1.js
- KHUON_LOI.md

## Ngân sách
Ghi chú phạm vi: `tu_chay/cai_dat.js` chỉ sửa nếu cần để phép kiểm `muc_gac` thử được (D1), không đổi
hành vi cài; `cong_cu/thu_HOC1.js` chỉ tạo nếu ca C không đặt hợp lý được trong bài thử có sẵn.

Khoảng 60 dòng code: `cong.js` +~35, `kiem_tra_truoc_khi_giao.js` ±~6, `cau_hinh.json` +1,
`cai_dat.js` ±~10 (nếu cần).
Khoảng 200 dòng thử: `thu_cong.js` +~120 (A, B4, D2), `thu_cong_cu.js` hoặc `thu_HOC1.js` +~50 (C, D1),
`thu_nguoi_gac.js` +~20 (B1–B3).
Tài liệu khoảng 40 dòng: `MAU_PHIEU.md` +~10, skill +~5, `THIET_KE.md` +~10, `KHUON_LOI.md` ≤ 120 tổng.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `.claude/` và `.github/`. Không chạy `cai_dat.sh`, `xem_thu.sh` trên kho thật (chỉ trên kho
  tạm trong nháp). Đổi `tu_chay/` xong thì chủ quán tự cài trên nhánh việc.
- Chỉ push đúng nhánh việc: `git push -u origin viec/HOC-1`. Không push nhánh khác, không đụng `main`,
  không merge, không tạo PR.
- Không nới luật nào khác của cổng hay người gác ngoài miễn A11 ở nhóm A. Không bỏ, không làm yếu A11
  cho bài thử MỚI. Không đổi `tu_chay/cong_github.yml`.
- Không đổi `package.json` (chỉ đưa nó vào `file_luat`).
- Không chạy `patch_*.py`. Không sửa sổ việc.
