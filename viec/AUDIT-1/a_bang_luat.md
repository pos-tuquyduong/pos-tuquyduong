# AUDIT-1 — Nhóm A · Người gác (`tu_chay/nguoi_gac.js`)

Bản chụp HEAD b9759cf, đo 04.10.2026. 74 mã trong `LUAT` (đọc từ code: `require('./tu_chay/nguoi_gac.js').LUAT.length`),
thêm 4 mã cơ chế chỉ tới được qua lối hook stdin (`MO_TA`, không trong `LUAT`): NG-LOI, NG-GIO, NG-TRAN, NG-NHATKY.

## A1 — mỗi mã có ca chặn đúng mã + ca hợp lệ gần nhất

`tu_chay/thu_nguoi_gac.js` là nguồn của bảng này: 786 ca, mỗi ca so ĐÚNG MÃ (`mong CHAN:<mã>` hoặc `CHO`). Chạy trên
HEAD → **786/786 đúng mã**. Phần "tự sinh" (biến thể `;`/`&&`/`|`, tiền tố tuỳ chọn dài, cờ ngắn gộp) + "đối chiếu bash
thật" (21 lệnh `cd … && touch`, so nơi file thật rơi với quyết định người gác) là các ca HỢP LỆ phải KHÔNG bị chặn sai —
đều đạt. Vì thu_nguoi_gac đã khoá A1 theo đúng khuôn (chặn đúng mã + luồng hợp lệ cho qua), AUDIT-1 KHÔNG chép lại 74
dòng tay mà dẫn nguồn + bổ sung hai tầng đối kháng A3/A4 dưới đây.

## A2 — tắt từng mã → bài thử đỏ

`thu_nguoi_gac.js` tự chạy vòng "đột biến: tắt <mã> → phải có ca đỏ" cho **cả 74 mã** (`tu_chay/thu_nguoi_gac.js:529-531`),
và kiểm `luat(...)` trong mã nguồn ↔ bảng LUAT khớp hai chiều (:534-540). Chạy HEAD → xanh ⇒ mỗi mã có ≥1 ca đỏ khi tắt,
không mã nào thừa/thiếu. 4 mã lối hook kiểm bằng tiến trình thật (stdin treo → NG-GIO; 20 MB → NG-TRAN; nhật ký hỏng →
NG-NHATKY; lỗi bất ngờ → NG-LOI) — đều đạt.

## A3 — VÁ SAI (mỗi nhóm luật ≥1), chạy `python3 viec/AUDIT-1/dot_bien.py A3`

16 đột biến "vá sai" trên BẢN SAO `nguoi_gac.js` (mở một lỗ cho lệnh nguy hiểm lọt), chạy `thu_nguoi_gac.js` của bản sao.
Kết quả: **15 BẮT · 1 SỐNG · 0 HỎNG/LẠC**. Mỗi nhóm luật có ≥1 BẮT: GIT-ADD, GIT-COMMIT, GIT-PUSH, SED, RM, CURL, LN,
G1-CAM, FIND, NPM, MKDIR, TAR, FILE, B-GAN, G1-KHUNG.

- **SỐNG → AU-A1 (NHẸ):** `A3-CCLA-them-la` thêm tên công cụ lạ (`'Bash2'`) vào tập `CONG_CU_DOC` → công cụ tên đó được
  coi là chỉ-đọc (CHO) mà `thu_nguoi_gac` không bắt. `thu` không khoá NỘI DUNG tập `CONG_CU_DOC`/`CONG_CU_SUA`. Lỗ thật
  chỉ mở nếu Claude Code có công cụ tên đó, và cổng A8 bắt mọi sửa `nguoi_gac.js` lệch nguồn → NHẸ. Đề xuất HOC-2: thêm
  phép trong `thu_nguoi_gac` so `CONG_CU_DOC`/`CONG_CU_SUA` với tập cố định (ca đỏ: thêm một tên vào set).

## A4 — cố tình lách, chạy `node viec/AUDIT-1/lach.js`

52 lệnh lách (chỉ truyền CHUỖI vào `gac.xet()` của bản sao, KHÔNG thực thi) phủ mọi nhóm mã: vỏ `sh -c`/`eval`, biến
`NODE_OPTIONS`, `$()`/`$(( ))`, chuyển hướng `>`/`tee`, `ln` cứng, `cp -r` vào `.claude`, `tar --use-compress-program`,
`sed -i`, `awk print >`, `find -delete`, `curl` ra ngoài, `git -C`, `git add -A`, `git push` main/nhánh khác/refspec,
`npm install`, `patch_*.py`, `cai_dat.js`, `cd .git`, đọc `.env`/`$TOKEN`… → **52/52 CHẶN · 0 LỌT**.
(Ca "commit trên main" phải dựng kho nhánh `main` riêng mới khoá được — trên nhánh `viec/X` commit là luồng HỢP LỆ, CHO
đúng; đã sửa bài lách để không chấm nhầm.)

## Đường song song đã canh (K4)
- Hai lối vào người gác: `xet()` trong tiến trình (A3/A4) và hook thật qua stdin — thu_nguoi_gac phủ lối stdin bằng
  `tienTrinh()` (7 ca tiến trình thật + treo). A3 phủ lối `xet()`.
- `cong.js` dùng lại `xetPhamVi`/`khop`/`phamViTuChu` của `nguoi_gac.js` (không tự viết `globRe`) — xem nhóm B.
