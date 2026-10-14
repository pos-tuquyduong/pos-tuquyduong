# TOC-DO-1 — trạng thái

## Bước 1 · đối chiếu bản chụp (14.10.2026)
- Nhánh: `viec/TOC-DO-1`; cây sạch.
- `git fetch origin viec/TOC-DO-1` → HEAD `d22ca91` · FETCH_HEAD `d22ca91` (bằng nhau) → không kéo.
- `git log --oneline -3`:
  ```
  d22ca91 PHIEU: TOC-DO-1
  65206b6 TIEN-DO: GOI-1 xong (28f65d1), LUOI-2 xong (c591b9e), mo GOI-2 + TOC-DO-1, them SO-LUONG-1 — so v29
  c591b9e Merge pull request #18 from pos-tuquyduong/viec/LUOI-2
  ```

## A1 — nguyên nhân (chi tiết + số đo: `ke_hoach.md` mục 1)
- `thu_cong.js` chạy riêng 67,1 s. Dưới tải CPU (8 tiến trình đốt / 4 lõi ×3 lần, 24 tiến trình ×1 lần): 153–326 s, cả 4 lần
  **318 phép · 0 hỏng**. Tải CPU một mình KHÔNG làm ca nào bên trong đỏ, chỉ làm tổng thời gian vượt hạn 120 s → đỏ dạng ETIMEDOUT
  (khác dấu sự cố).
- Dấu sự cố ("dòng ✗ … Received null") khớp đúng `tu_chay/cong.js` sập: `blob()` (`:30–33`) trả `null` khi `git cat-file` không thoát 0 —
  kể cả khi không sinh được tiến trình git — rồi `:268/:325/:327` ghi `null` vào `fs.writeFileSync`. Giả thuyết Replit chạm giới hạn
  tiến trình / bộ nhớ: **CHƯA KIỂM** (người gác chặn `ulimit` → không dựng được giới hạn trên máy này).
- Cách sửa gốc nằm trong `tu_chay/` → Câu hỏi 1.

## Câu hỏi
1. **Sửa gốc trong `tu_chay/` (phiếu CẤM việc này sửa):** `tu_chay/cong.js` `blob()` phân biệt "file không có" (`status` 1) với "git không
   chạy được" (`status` null / `error`) và ném lỗi rõ thay vì trả `null`; thêm ca "git giả tự giết ở cat-file" vào `thu_cong.js`. Kèm (đã
   nêu ở AU2-10): chia `thu_cong.js` thành lượt song song. Chủ quán có mở việc cài cho phần này không?

## Phát hiện
- `tu_chay/thu_nguoi_gac.js` (`kiem_tra_truoc_khi_giao.js:549`) và `tu_chay/thu_cong_cu.js` (`:551`) cũng là bài bộ khung, chạy ở bản nhanh
  mỗi commit. Phiếu không nhắc → không đổi. Sẽ đo thời gian ở bước làm để chủ quán quyết có áp cùng điều kiện không.
- Bản sao máy mây này KHÔNG có `.git/hooks/pre-commit` (chỉ file mẫu), giống AUDIT-2 đã ghi → commit ở đây không qua tầng 3. Bước 6 sẽ
  chạy `npm test` bằng tay trước mỗi commit đổi code.

## Bước 1 lần 2 · làm tiếp (14.10.2026 04:52 UTC)
- Chủ quán duyệt kế hoạch `e2a357a` (giữ 14 ca). Câu hỏi 1 → trả lời: CÓ, nhưng thành việc cài riêng SAU AUDIT-3 → chuyển xuống Phát hiện.
- Đổi model giữa phiên: 04:52 UTC, trước bước 4 (chưa viết bài thử). Kết quả đo trước (A1) do tay cũ; mọi số đo A5 sẽ do tay mới.
- Nhánh `viec/TOC-DO-1`; cây sạch; HEAD `e2a357a` = FETCH_HEAD `e2a357a` → không kéo.
- `git log --oneline -3`:
  ```
  e2a357a TOC-DO-1: ke hoach sau vong soat + A1 so do (cho duyet)
  df8f090 TOC-DO-1: ke hoach (nhap, cho so do tai 24 + soat)
  d22ca91 PHIEU: TOC-DO-1
  ```

## Bước 4–5 · bài thử, đột biến, vá (14.10.2026)
- `cong_cu/thu_TOCDO1.js` (15 ca: E0 + T1–T11b): trên gốc **12 đạt · 3 hỏng** (T1, T2, T10 — ba ca "phải bỏ qua"); trên bản vá
  **15 đạt · 0 hỏng**. Bằng chứng: `bang_chung_do.txt` (ghi lại lần 2 vì bài thử đổi bộ cắt sau lần 1 — A16).
- Chỗ vá: `kiem_tra_truoc_khi_giao.js` dòng 553 cũ → hàm `lyDoChayThuCong()` + lời gọi có điều kiện (~17 dòng code, 3 dòng chú thích).
- Đổi code chạy thật? KHÔNG (`server/`, `client/src/` không đụng) — vẫn có `dot_bien.py` vì phiếu A3 đòi.

### Chỗ vá → đột biến (`viec/TOC-DO-1/dot_bien.py`, 9 đột biến, 9/9 bị bắt, đối chứng xanh)
| chỗ vá | đột biến | ca bắt |
|---|---|---|
| lời gọi có điều kiện `const lyDoThuCong = lyDoChayThuCong();` | `BV-TOCDO1-LUON-CHAY` (bỏ vá: luôn có lý do) | T1 |
| — | `VS-TOCDO1-LUON-BO-QUA` (luôn null) | T3a |
| `g('status', '--porcelain', '--untracked-files=all', …)` | `VS-TOCDO1-QUEN-VUNG-CHO` (→ `diff --name-only`: chỉ cây làm việc) | T4 |
| — | `VS-TOCDO1-QUEN-CAY-LAM-VIEC` (→ `diff --cached`: chỉ vùng chờ) | T5 |
| — | `VS-TOCDO1-THEO-CAU-HINH` (bỏ `--untracked-files=all`) | T6 |
| `const KHUNG = ['tu_chay', '.claude', '.github']` | `VS-TOCDO1-QUEN-GITHUB` | T3c |
| `if (DAY_DU) return '--day-du';` | `VS-TOCDO1-BO-DAYDU` | T7 |
| `if (mb.status !== 0) return '…'` | `VS-TOCDO1-KHONG-ORIGIN-BO-QUA` (→ null) | T8 |
| `g('diff', '--name-only', mb.stdout.trim(), 'HEAD', …)` | `VS-TOCDO1-SO-THANG-ORIGIN` (so thẳng `origin/main`) | T10 |

Mọi tên đột biến: BV-TOCDO1-LUON-CHAY · VS-TOCDO1-LUON-BO-QUA · VS-TOCDO1-QUEN-VUNG-CHO · VS-TOCDO1-QUEN-CAY-LAM-VIEC ·
VS-TOCDO1-THEO-CAU-HINH · VS-TOCDO1-QUEN-GITHUB · VS-TOCDO1-BO-DAYDU · VS-TOCDO1-KHONG-ORIGIN-BO-QUA · VS-TOCDO1-SO-THANG-ORIGIN.
(Kế hoạch ghi 7; thêm 2 khi viết ca: QUEN-CAY-LAM-VIEC, SO-THANG-ORIGIN — mỗi cái một dòng, bắt một đường mã đã có.)

### Sự cố trong bước 4–5 (đầu vào bước 11)
1. **Đỏ oan (K2):** bộ cắt `indexOf('function lyDoChayThuCong(')` bắt trúng CHÚ THÍCH tôi viết ngay trên hàm (chú thích nhắc tên hàm)
   → khối = mẩu chú thích → 14 ca ném "Unexpected identifier 'dòng'". Sửa: neo đầu dòng `^function …` (regex m).
2. **Xanh oan (K3) — nặng:** cùng lúc đó `dot_bien.py` (khuôn GOI-1) báo **9/9 đột biến bị bắt** vì tiêu chí "thoát ≠ 0 + có dòng ✗ Tn"
   được thoả bởi bài thử đang SẬP. Khoá ngay (trong phạm vi): đối chứng bản sao chưa đột biến phải xanh, và dòng ✗ khớp không được là
   dòng ném. Tái hiện tất định ở thư mục nháp (bộ cắt cũ + bộ kiểm đã vá) → bản mới in "✗ đối chứng … 1 đạt · 14 hỏng — DỪNG", thoát 1.
   Khuôn `viec/GOI-1/dot_bien.py` (và P26c, TACH-GL cùng khuôn) KHÔNG có đối chứng này → ngoài phạm vi, đề xuất ở Bài học.
3. Người gác chặn: `nproc`, `until` (B-CHUONGTRINH); `ulimit` (B-CHUONGTRINH — vì thế không dựng được giới hạn tiến trình cho A1);
   `$S/…` (B-DICHCHU); `git --version` (GIT-TUYCHON); heredoc python nhắc file bảo vệ (B-MANOI); `cd` giữa lệnh (B-CD-VITRI).
   Tất cả đều có cách làm khác (script trong thư mục nháp, đường dẫn viết thẳng) — không lách.

## A5 · đo `npm test` CHẠY RIÊNG (máy mây 4 lõi, không tải song song), tay mới
| | lần 1 | lần 2 | thu_cong.js | PASS · FAIL · CẢNH BÁO |
|---|---|---|---|---|
| TRƯỚC vá (e2a357a) | 90,3 s | 83,9 s | 67,8 / 65,4 s | 63 · 0 · 0 |
| SAU vá — máy này KHÔNG có `origin/main` → đường an toàn "không xác định được gốc chung" → VẪN chạy thu_cong.js | 69,4 s | 70,4 s | 54,1 / 55,1 s | 63 · 0 · 0 |

- Dòng in thật ở bản sau vá: `– chạy thu_cong.js: không xác định được gốc chung với origin/main`.
- **Đường "bỏ qua" (Replit có `origin/main`, commit thường) KHÔNG đo được trên máy này:** kho thật không có ref `origin/main`; người gác chặn
  `git fetch origin main` (GIT-KEO — đúng luật, không lách); lệnh dựng bản sao cây làm việc trong thư mục nháp bị từ chối. Ước lượng
  (KHÔNG phải số đo): `npm test` ≈ 69,4 − 54,1 ≈ 15 s. Chủ quán đo thật trên Replit: `npm test` phải in dòng
  `– bỏ qua thu_cong.js — không đổi tu_chay/.claude/.github` và PASS 62 (giảm 1 vì phép "bài chạy thật thu_cong.js" không chạy).
- `node kiem_tra_truoc_khi_giao.js --day-du` SAU vá (chạy riêng): **154,4 s · thoát 0 · PASS 67 · FAIL 0 · CẢNH BÁO 0**, in
  `– chạy thu_cong.js: --day-du` (thu_cong.js 55,6 s) — A4/A5.
- PASS bản nhanh khi bỏ qua = 62, khi chạy = 63 — dòng `–` không đếm là PASS (xem `kiem_tra_truoc_khi_giao.js`, `dong.push` không qua `pass()`).

## A4 · cổng GitHub vẫn chạy thu_cong.js với PR đổi `tu_chay/` (chỉ đọc, không sửa)
- `tu_chay/cong_github.yml:72–76`: checkout code PR vào `pr` với `ref: head.sha`, **`fetch-depth: 0`** (lấy đủ refs/heads → có
  `origin/main`); `:82–87`: `node goc/tu_chay/cong.js chay pr "$BASE" "$HEAD_SHA" "$NHANH"`.
- `tu_chay/cong.js:287–289`: chạy `CH.lenh_bai_thu` (`npm test`) + `CH.lenh_kiem_day_du` (`node kiem_tra_truoc_khi_giao.js --day-du`,
  `tu_chay/cau_hinh.json:3`) với `cwd: thuMuc` = `pr`.
- Hai đường đều CHẠY thu_cong.js: `--day-du` → ca T7; `npm test` trên `pr` có `origin/main`, HEAD tách = head.sha, gốc chung = base →
  `git diff` liệt kê file `tu_chay/` của PR → ca T3a. Chưa xem log run thật trên GitHub — CHƯA KIỂM phần đó.

## Bước 8 · soát độc lập (`/ra-soat`, agent general-purpose, lần 2 — lần 1 mất vì máy mây khởi động lại) — chép nguyên
```
KHÔNG ĐẠT (lỗi nhỏ, sửa ≤ 5 dòng — nhưng là lỗ K3 trong khoá và hồ sơ thiếu 2 bằng chứng phiếu đòi)

LỖI TÌM ĐƯỢC:
1. cong_cu/thu_TOCDO1.js:23–25 — bộ cắt chỉ lấy khối `function lyDoChayThuCong(` … dòng "bỏ qua thu_cong.js"; lời gọi trần
   `chayBaiThat('tu_chay/thu_cong.js');` còn sót NGOÀI khối (trước hàm hoặc sau dòng else) thì bộ kiểm thật LUÔN chạy thu_cong.js mà bài
   thử vẫn 15 đạt · 0 hỏng. Đã chạy thật: --kiem m1_goi_tran_sau.js → thoát 0, 15 đạt; m2_goi_tran_truoc.js → thoát 0, 15 đạt. Đây là
   đúng dạng hồi quy khi giải xung đột merge quanh dòng 553 cũ. dot_bien.py không có đột biến này. Sửa gọn: thêm 1 phép sau E0 + 1 đột
   biến `BV-TOCDO1-GOI-TRAN-NGOAI-KHOI`. — K3 (xanh oan) · E13.
2. cong_cu/thu_TOCDO1.js:24–26 — có hàm nhưng thiếu dòng "bỏ qua thu_cong.js" sau nó (m3_khong_else.js) → indexOf −1 → khối rỗng → E0 đỏ
   với câu "không thấy function lyDoChayThuCong( lẫn dòng gọi trần" (sai chẩn đoán). — K2. Sửa: tách E0 "thấy đầu" / "thấy cuối".
3. viec/TOC-DO-1/trang_thai.md (A1) — ke_hoach.md:29 hứa "dựng TẤT ĐỊNH … git giả tự giết ở cat-file → Received null"; trang_thai không
   ghi đã làm, cũng không ghi đã bỏ. Kết luận "Received null là blob() sập" vẫn là GIẢ THUYẾT đọc code (đúng theo cong.js:30–33, :268,
   :325, :327, :344) chưa tái hiện. — K1.
4. viec/TOC-DO-1/trang_thai.md — A4 không có mục riêng; ke_hoach §4 ghi "checkout có origin/main hay không CHƯA đọc" — đã đọc:
   cong_github.yml:70–76 fetch-depth 0 → có origin/main → CHẠY; cong.js:287–288 cwd = pr. — K1/hồ sơ.

NGHI NGỜ:
- kiem_tra_truoc_khi_giao.js:563 nhánh `dang.status !== 0` không có ca (m5 bỏ vế dang → 15 đạt). Chấp nhận CHƯA KIỂM.
- :560 nhiều merge-base (criss-cross) → nhiều dòng → git diff lỗi → 'git hỏng' → CHẠY. Chiều an toàn, chưa thử.
- `.claude/worktrees/` hoặc file chưa theo dõi khác trong `.claude/` trên Replit → luôn CHẠY (mất mục tiêu, không mất an toàn).
- `git --no-optional-locks` cần git ≥ 2.15; Replit git cũ → lỗi → CHẠY. Chưa biết phiên bản.
- Replit: remote có đúng tên `origin`, có ref `origin/main` không — chưa biết. Không có → hành vi cũ (luôn chạy).

NGHIỆM THU: 3/5 mục có bằng chứng đủ · mục thiếu: A1, A4 (A2, A3, A5 ĐỦ — A5 đường bỏ qua CHƯA KIỂM chấp nhận được vì không giả số)
Đường tiền / P1: 7 file đổi, không có server/, client/, tu_chay/, .claude/, .github/. Cây sạch.
K4 đã rà: chayBaiThat( :492, :549, :551, :569 (duy nhất, 1 đối số), :778/:782 (cờ true); thu_gia_lap C3/C3f không lệch; thu_cong_cu.js:467
cắt T2 không đụng; Tổng phép kiểm = PASS+FAIL (:802) không đếm dòng `–`.
K5 luồng đã liệt kê: đủ (T1–T11, cổng GitHub). Xoá/đổi tên trong tu_chay/: diff/status in D/R → chạy (đọc code, chưa có ca).
Đơn giản: code vá 15 dòng + 3 chú thích — trong ngân sách. Bài thử 112 + dot_bien 83 = 195 dòng so với ~80 — vượt ~2,4×; chủ quán đã
duyệt giữ 14 ca. T11 (17 dòng) có thể gọn hơn — không bắt buộc.
CHƯA SOÁT ĐƯỢC: hành vi thật trên Replit; log run cổng GitHub; npm test / --day-du (không chạy lại theo dặn); nhánh dang.status; criss-cross.
BÀI HỌC:
- KHOÁ: bài thử cắt-khối phải kèm phép "mẫu nguy hiểm VẮNG MẶT ngoài khối" + đột biến "gọi trần ngoài khối" — E13 áp cho mọi bài
  kiểu thu_gia_lap C3 / thu_TOCDO1 / thu_cong_cu HOC-1 C.
- NGUYÊN TẮC (K3): bộ cắt khối chỉ kiểm được thứ nằm TRONG khối — mỗi bài cắt khối phải có một ca phá ở NGOÀI khối.
- NGUYÊN TẮC (K1/hồ sơ): mỗi bước kế hoạch ghi "sẽ làm sau duyệt" phải có dòng tương ứng trong trang_thai: đã làm / bỏ + lý do.
- KHOÁ (K2): phép E0 tách "thấy neo đầu" và "thấy neo cuối".
```

### Sửa sau soát (vòng sửa 1/3)
- Lỗi 1 → `thu_TOCDO1.js` thêm E1 (toàn file đúng 1 lời gọi, nằm trong khối) + `dot_bien.py` thêm `BV-TOCDO1-GOI-TRAN-NGOAI-KHOI`.
- Lỗi 2 → E0 tách E0a / E0b. 15 → 17 ca; `bang_chung_do.txt` ghi lại lần 3 (gốc 14 đạt · 3 hỏng T1/T2/T10; vá 17 · 0; đột biến 10/10).
- Lỗi 4 → mục A4 ở trên. Lỗi 3 → mục A1 tái hiện dưới đây.

## A1 · tái hiện TẤT ĐỊNH cơ chế "Received null" (sau soát, làm đúng điều ke_hoach.md mục 1.2 hứa)
- Dựng: thư mục nháp `gitgia/git` = script node đứng ĐẦU PATH; lệnh `git cat-file blob <sha>:<…thu_*.js>` → tự `SIGKILL` (giả lập máy
  không sinh / không giữ được tiến trình git lúc bận); mọi lệnh git khác chuyển nguyên cho `/usr/bin/git`. Chạy `node tu_chay/thu_cong.js`
  THẬT (kho thật, chỉ đọc) với PATH đó — script `a1_gitgia.js` trong thư mục nháp, không để trong kho.
- Kết quả: `thu_cong: 291 phép · 117 chỗ hỏng`, thoát 1, **89 dòng chứa "Received null", 91 dòng "[CONG] cổng gặp lỗi bất ngờ"**.
  Ví dụ nguyên văn: `✗ [CONG] cổng gặp lỗi bất ngờ — ĐỎ: The "data" argument must be of type string or an instance of Buffer, TypedArray,
  or DataView. Received null` — trùng chữ ký sự cố phiếu ghi ("dòng ✗ ghép từ đầu ra, có Received null").
- Kết luận A1: cơ chế = `tu_chay/cong.js` `blob()` (`:30–33`) trả `null` khi tiến trình `git cat-file` không thoát 0 (kể cả khi không
  chạy được), rồi `:268` (và `:325`, `:327`) ghi `null` vào `fs.writeFileSync` → TypeError → `:344` gói thành "cổng gặp lỗi bất ngờ".
  Một lần sinh git hỏng là đủ đỏ cả ca. **Đã chứng minh cơ chế; CHƯA KIỂM: vì sao Replit lúc bận không sinh được git** (giới hạn tiến
  trình / bộ nhớ — không dựng được ở đây, `ulimit` bị chặn). Sửa gốc nằm trong `tu_chay/` → chủ quán đã chốt: việc cài riêng sau AUDIT-3.

## Phát hiện (ngoài phạm vi — không sửa)
1. **Sửa gốc `tu_chay/cong.js` `blob()` + cân nhắc chia `thu_cong.js` song song** — chủ quán chốt: việc cài riêng SAU AUDIT-3. Nội dung:
   `blob()` (`:30–33`) phân biệt "file không có" (`status` 1) với "git không chạy được" (`status` null / `error`) và ném lỗi rõ; `:268`,
   `:325`, `:327` không ghi `null`; thêm ca "git giả tự giết ở cat-file" vào `thu_cong.js` (kịch bản `gitgia/git` + `a1_gitgia.js` ở thư
   mục nháp của việc này, chép được). Cùng việc: `thu_cong.js` 67 s riêng / 150–325 s khi bận — chia lượt song song (khuôn TACH-GL, AU2-10).
2. `tu_chay/thu_nguoi_gac.js` (`kiem_tra_truoc_khi_giao.js:549`) và `tu_chay/thu_cong_cu.js` (`:551`) cũng là bài bộ khung chạy ở bản nhanh
   mỗi commit. Phiếu không nhắc → không đổi, cũng CHƯA đo riêng thời gian hai bài này (bộ lọc đo của tôi chỉ in dòng thu_cong.js). Chủ quán quyết có áp cùng điều kiện `lyDoChayThuCong()` cho hai bài này không (một dòng đổi mỗi bài, cùng khuôn).
3. Khuôn `viec/GOI-1/dot_bien.py` (P26c, TACH-GL cùng khuôn) KHÔNG có đối chứng "bản chưa đột biến phải xanh" → bài thử sập thì báo
   N/N bị bắt oan (đã xảy ra thật ở việc này, mục Sự cố 2). Đề xuất: thêm `doi_chung()` như `viec/TOC-DO-1/dot_bien.py` vào khuôn chung
   (một hàm ~10 dòng) hoặc đưa vào `MAU_PHIEU.md` / skill bước 4 — ngoài phạm vi, chủ quán quyết.
4. Bản sao máy mây này KHÔNG có `.git/hooks/pre-commit` (chỉ file mẫu) → commit ở đây không qua tầng 3; đã chạy `npm test` tay trước
   commit đổi code. Máy mây cũng không có ref `origin/main` (clone một nhánh) → `lyDoChayThuCong()` đi đường an toàn, luôn chạy thu_cong.js.

## Bước 11 · Bài học
### 1. Sự cố gom được
a. Bài thử đỏ oan lần 1: bộ cắt `indexOf('function …')` bắt trúng chú thích nhắc tên hàm → 14 ca ném (K2).
b. `dot_bien.py` báo 9/9 bị bắt trong khi bài thử đang sập (K3 xanh oan — nặng).
c. Agent soát bắt: lời gọi trần sót NGOÀI khối cắt mà bài vẫn xanh (K3); E0 đổ lỗi nhầm (K2); A1 hứa tái hiện mà chưa làm, A4 hứa ghi
   mà chưa ghi (K1/hồ sơ).
d. Người gác chặn 12 lần (B-CHUONGTRINH ×3: `nproc`, `until`, `ulimit`, `for`; B-CD-VITRI ×2; GIT-TUYCHON ×2: `git --version`; B-BIMAT-CHU:
   grep đệ quy đọc .replit; B-DICHCHU: `$S/…`; B-MANOI: heredoc nhắc file bảo vệ; GIT-KEO: `git fetch origin main`; GIT-LENH: của agent
   soát). Đều có đường khác, không lách; GIT-KEO + lệnh dựng bản sao bị từ chối → đường "bỏ qua" không đo được (CHƯA KIỂM).
e. Vượt ngân sách thử (~195 dòng so với ~80) — chủ quán duyệt giữ 14 ca trước khi làm.
f. Máy mây khởi động lại giữa lúc soát → mất agent soát lần 1, phải chạy lại (mất ~7 phút).
g. Kế hoạch lần 1 kết luận A1 sai hướng (đổ cho hạn 120 s) — agent soát kế hoạch bắt trước khi duyệt (K1).

### 2. Xếp ngăn
- **KHOÁ (đã làm, trong phạm vi):**
  - (b) `viec/TOC-DO-1/dot_bien.py` `doi_chung()` + loại dòng "ném": ca đỏ trước = tái hiện tất định ở thư mục nháp (bộ cắt cũ → "✗ đối
    chứng … 1 đạt · 14 hỏng — DỪNG", thoát 1) — trước đó cùng trạng thái in 9/9 bị bắt.
  - (c) `cong_cu/thu_TOCDO1.js` E1 + đột biến `BV-TOCDO1-GOI-TRAN-NGOAI-KHOI`: ca đỏ trước = m1/m2 của agent soát (15 đạt trên bản phá) →
    giờ ✗ E1. E0a/E0b: m3 → ✗ E0b đúng chẩn đoán.
- **KHOÁ (đề xuất, ngoài phạm vi — chủ quán gom vào việc sau):**
  - (b) khuôn `dot_bien.py` chung (GOI-1, P26c, TACH-GL): thêm đối chứng — Phát hiện 3. Ca đỏ: chép bài thử bị hỏng cú pháp → phải DỪNG.
  - (c) mọi bài cắt-khối (`thu_gia_lap.js` C3 cắt `chayBaiThat`, `thu_cong_cu.js` HOC-1 C): thêm phép "mẫu nguy hiểm vắng mặt NGOÀI khối"
    + một đột biến phá ngoài khối. Ca đỏ: thêm lời gọi trần ngoài khối → bài phải đỏ.
- **NGUYÊN TẮC (đề xuất vào `KHUON_LOI.md` — ngoài phạm vi, chưa sửa; file hiện 104/120 dòng):**
  - K3, thêm một gạch "Chặn": *bộ cắt khối chỉ kiểm được thứ nằm TRONG khối — mỗi bài cắt khối phải có (1) một ca phá ở NGOÀI khối và
    (2) neo đầu khối ở ĐẦU DÒNG, vì chú thích ngay trên hàm thường nhắc tên hàm* (TOC-DO-1: `indexOf` cắt trúng chú thích; lời gọi trần
    ngoài khối xanh oan). Và: *người chạy đột biến phải có đối chứng xanh trên bản chưa đột biến — bài thử sập thì "N/N bị bắt" là xanh oan.*
  - K1, thêm: *mỗi bước kế hoạch ghi "sẽ làm sau duyệt" phải có dòng tương ứng trong trang_thai — đã làm / bỏ + lý do* (TOC-DO-1 A1, A4).
- **BỎ:** (d) người gác chặn — đều đúng luật, có đường khác; (e) vượt ngân sách — đã duyệt trước; (f) máy khởi động lại — một lần, ngoài tầm;
  (g) sai hướng A1 ở kế hoạch — vòng soát kế hoạch đã làm đúng việc của nó, không cần thêm phép.

### 3. Dọn
Không đề xuất xoá lời dặn nào: hai khoá mới (đối chứng, ngoài khối) chỉ nằm trong file của việc này, chưa thay được lời dặn chung.

### 4. Đổi file ngoài `viec/TOC-DO-1/` ở bước 11? KHÔNG (đề xuất KHUON_LOI.md chờ chủ quán duyệt).

## Báo cáo 7 mục (CLAUDE.md §7)

```
VIỆC:        TOC-DO-1 — Commit trên Replit không còn trượt ngẫu nhiên vì bài thử cổng chạy chậm
ĐÃ SỬA:      kiem_tra_truoc_khi_giao.js:553–570 — thay lời gọi trần chayBaiThat('tu_chay/thu_cong.js') bằng hàm lyDoChayThuCong()
             (--day-du · đổi tu_chay/.claude/.github so với gốc chung origin/main: commit + vùng chờ + cây + file mới · không xác
             định được → chạy) + lời gọi có điều kiện, in một dòng "– chạy …: <lý do>" / "– bỏ qua thu_cong.js — không đổi …" (không PASS giả).
             cong_cu/thu_TOCDO1.js (mới, 17 ca) · viec/TOC-DO-1/{dot_bien.py (10 đột biến + đối chứng), bang_chung_do.txt, ke_hoach.md, trang_thai.md}
BÀI THỬ:     chạy trên bản chưa vá (e2a357a, qua --kiem) → ĐỎ ở T1, T2, T10 (ba ca "phải bỏ qua": 14 đạt · 3 hỏng); sau khi vá → XANH
             17 đạt · 0 hỏng. dot_bien.py: đối chứng xanh, 10/10 bị bắt đúng ca. Bằng chứng: bang_chung_do.txt (lần 3, SỐ CA 17).
ĐÃ RÀ K4:    grep "chayBaiThat(" trong kiem_tra_truoc_khi_giao.js → :492 (6 bài cong_cu), :549 thu_nguoi_gac, :551 thu_cong_cu, :569
             thu_cong (DUY NHẤT, 1 đối số — E1 khoá), :778/:782 giả lập (cờ true); thu_gia_lap.js C3/C3f, thu_cong_cu.js:467 không lệch;
             "Tổng phép kiểm" = PASS+FAIL (:802), dòng "–" không đếm. Lời gọi thu_cong.js ở nơi khác: Grep toàn kho → không có.
CHƯA KIỂM:   (1) đường "bỏ qua" chưa đo được trên máy này — kho không có origin/main, không được fetch main, bản sao bị từ chối; ước
             lượng ≈15 s KHÔNG phải số đo; chủ quán đo trên Replit, kỳ vọng dòng "– bỏ qua thu_cong.js…" và PASS 62. (2) Vì sao Replit
             lúc bận không sinh được git (giới hạn tiến trình / bộ nhớ) — chỉ chứng minh được CƠ CHẾ bằng git giả, không chứng minh tần
             suất. (3) Replit: remote tên gì, có ref origin/main không, git ≥ 2.15 (--no-optional-locks) không, có file lạ chưa theo dõi
             trong .claude/ không — mỗi thứ thiếu đều rơi về CHẠY (an toàn nhưng không đạt mục tiêu). (4) Nhánh `dang.status !== 0`
             (git status hỏng riêng) và nhiều merge-base không có ca. (5) Log run cổng GitHub thật chưa xem — A4 suy từ yml + cong.js.
             (6) assume-unchanged / skip-worktree / fsmonitor che thay đổi cây làm việc — không thử.
GIT:         git log --oneline -2 → (xem dưới sau commit cuối) — nhánh viec/TOC-DO-1, HEAD đã kiểm 05cbe6b
BÀI HỌC:     KHOÁ 2 (đối chứng trong dot_bien.py · E1/E0a/E0b ngoài khối — đã làm) + 2 đề xuất ngoài phạm vi · NGUYÊN TẮC 2 đề xuất
             (K3 cắt khối + đối chứng; K1 kế hoạch hứa → trang_thai ghi) · BỎ 4 — chi tiết ở ## Bước 11 · Bài học
```

### Đếm nghiệm thu của phiếu — mỗi mục một dòng, kèm bằng chứng
- **A1** nguyên nhân thật: số đo tải CPU (4 lần, 0 hỏng, 153–325 s) + tái hiện TẤT ĐỊNH git giả → 89 dòng "Received null" (mục A1 tái
  hiện); cơ chế `cong.js:30–33/:268/:344`; sửa gốc trong `tu_chay/` → Cấm → chủ quán chốt việc cài riêng (Phát hiện 1). ĐỦ (tần suất
  Replit: CHƯA KIỂM, ghi rõ).
- **A2** chạy khi và chỉ khi: `kiem_tra_truoc_khi_giao.js:556–570`; ca T1–T11b; dòng bỏ qua đúng chữ phiếu; không PASS giả (`dong.push`
  không qua `pass()`). ĐỦ.
- **A3** ca thử đỏ trên gốc (T1/T2/T10 — `bang_chung_do.txt`); không đổi → bỏ qua (T1); đổi tu_chay kể cả chỉ vùng chờ → chạy (T3a, T4);
  --day-du → chạy (T7); không origin/main → chạy (T8). Đột biến luôn bỏ qua / quên vùng chờ / quên .github → BẮT (VS-…-LUON-BO-QUA,
  QUEN-VUNG-CHO, QUEN-GITHUB) + 7 đột biến khác, 10/10. ĐỦ.
- **A4** cổng GitHub: mục A4 (yml:72–76 fetch-depth 0, :82–87; cong.js:287–289; cau_hinh.json:3) — không sửa. ĐỦ (log run thật: CHƯA KIỂM).
- **A5** npm test xanh (63 · 0 · 0, 4 lần sau vá), --day-du xanh (67 · 0 · 0), 0 CẢNH BÁO; đo trước 90,3/83,9 s, sau 69,4/70,4 s (máy
  này luôn chạy thu_cong.js), cuối 86,9 s trên 05cbe6b. ĐỦ phần đo được; đường bỏ qua CHƯA KIỂM (ghi rõ, không giả số).

HEAD ĐÃ KIỂM: 05cbe6b
