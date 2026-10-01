# TU-CHAY-3 — trạng thái

## Đối chiếu bản chụp (bước 1, 01.10.2026)

```
$ git branch --show-current
viec/TU-CHAY-3
$ git log --oneline -3
ff06a05 PHIEU: TU-CHAY-3
38840c9 TIEN-DO: TU-CHAY-2 xong (8e6a402); TU-CHAY-3 them 4 y
8e6a402 Merge pull request #2 from pos-tuquyduong/viec/TU-CHAY-2
```

Có commit `PHIEU: TU-CHAY-3` (ff06a05). Nền đúng `38840c9` như phiếu ghi.

## Bước hiện tại

XONG bước 1–11. Chủ quán duyệt kế hoạch 01.10.2026 (Q1–Q5 + 2 ý thêm, ghi cuối `ke_hoach.md`).
Bài thử đỏ trước: `bang_chung_do.txt` (lần đầu + vòng sửa 1, 2, 3). `/ra-soat` 3 vòng, đều KHÔNG ĐẠT, mỗi vòng
đã sửa hết LỖI có ca đỏ trước; đã dùng hết `so_vong_sua_toi_da` = 3 — vòng sửa 3 CHƯA được soát độc lập lại.

### /ra-soat (báo cáo về bằng file nháp — `SubagentHandback` bị người gác đang chạy chặn, xem Phát hiện 1)
- Vòng 1 (2c366c7): KHÔNG ĐẠT — bài thử `thu_*.js` luôn đỏ làm cổng xanh; PR xoá `cai_dat.js` tắt A8; câu sai B15;
  `trang_thai.md` cũ. → 416000c.
- Vòng 2 (416000c): KHÔNG ĐẠT — ba phép A8 tĩnh không có ca riêng; hook người gác chỉ soi chuỗi; tài liệu yml;
  thư mục con trong `tu_chay/` đỏ oan. → 1720a54.
- Vòng 3 (1720a54): KHÔNG ĐẠT — A8 tĩnh so cấu hình main trong khi trình cài dùng cấu hình PR → PR bộ khung đổi
  `muc_gac`/`ban_cai` đỏ vĩnh viễn (K5, do vòng 2 sinh ra); deny `Edit(./.claude/**)` không có ca riêng. → 3880e2d.

## Phát hiện (ngoài phạm vi, KHÔNG sửa)
1. Agent phụ nộp báo cáo bằng `SubagentHandback` — người gác chặn CC-LA (3 lần hôm nay: 07:19:31Z, 07:20:44Z, và agent
   soát kế hoạch). Thuộc D1 của chính việc này; ghi để thấy lỗi lặp trước khi vá.
2. Máy mây không vào được `docs.github.com` (WebFetch `EGRESS_BLOCKED`) — B1 chỉ tra qua kết quả tìm kiếm.
3. `kiem_tra_truoc_khi_giao.js:529-532` (T2, có từ TU-CHAY-1): thư mục con trong `tu_chay/` bị đọc như file → CẢNH BÁO
   oan "lệch" (cổng và trình cài đã bỏ thư mục con). Sửa T2 cần chủ quán cho (CLAUDE.md §6) — không sửa.
4. A11 không có lối miễn cho bài thử CŨ bị sửa mà xanh trên gốc (thêm ca hồi quy, sửa chú thích) — đúng chữ phiếu,
   chủ quán quyết có mở không. `npm test` theo `package.json` của PR: đề xuất thêm `package.json` vào `file_luat`.
5. Chủ quán sửa tay `.claude/hooks/*.cjs` (ngoài trình cài) sẽ bị cổng chặn (A8 theo chữ phiếu).

## Bài học (bước 11 — 01.10.2026)

### Sự cố của chính việc này
| # | Sự cố | Ngăn | Ở đâu / lý do |
|---|---|---|---|
| a | Agent phụ không nộp được báo cáo — `SubagentHandback` bị CC-LA 19 lần (nhật ký người gác) | KHOÁ | D1, `nguoi_gac.js` CONG_CU_DOC + ca CHO/CC-LA; có hiệu lực sau khi chủ quán cài |
| b | Ca D4 đặt SAU vòng chấm của `thu_nguoi_gac.js` → không bao giờ được chấm mà bài vẫn xanh (tự phát hiện khi chạy) | KHOÁ | `Object.freeze(CA)` sau vòng chấm; ca đỏ trước: bản chép có ca muộn → 777/778 không ✗; có khoá → `TypeError`, ĐỎ |
| c | Cổng: file `thu_*.js` luôn đỏ làm cổng xanh (soát 1) | KHOÁ | ca A11 "luôn đỏ", "không phải JS" + đột biến (dòng K3 "đỏ trên gốc kèm xanh trên bản vá" là ví dụ đi kèm, không tính ngăn riêng) |
| d | Ca gộp nhiều vi phạm → đột biến không bắt (soát 2, 3) | NGUYÊN TẮC | K3 thêm dòng "mỗi phép một ca chỉ vi phạm đúng phép đó" |
| e | Siết hook từ soi chuỗi sang so cấu trúc → chặn oan PR đổi `muc_gac` (soát 3) | NGUYÊN TẮC | K5 thêm dòng "siết một phép = thêm phép chặn, liệt kê lại luồng hợp lệ" |
| f | Câu tổng kết trong THIET_KE nói quá so với code (soát 1, 2) | BỎ | K1 đã có đúng luật này; lỗi là không áp dụng, không phải thiếu luật |
| g | Bài thử đỏ oan do chính bài thử (đột biến yml trúng dòng chú thích; soi "chưa commit" quá rộng) | BỎ | K2 đã có ("truy nguyên trước, sửa sau") — đã làm đúng |
| h | Người gác chặn 25 lệnh (B-MANOI, B-PHANTICH, NODE-CAIDAT, SED-I, CURL-HOST…) | BỎ | Người gác làm đúng việc; cách đi đúng (script Python trong nháp, F8) đã có |
| i | `docs.github.com` bị chặn ở máy mây | BỎ | Môi trường; đã ghi Phát hiện 2 và lỗ còn hở B15 |
| j | Vượt ngân sách bài thử (~1,6 lần) | BỎ | Lý do cụ thể ở báo cáo; luật "vượt thì giải thích" đã có |

### Bài học 28.09–01.10 (phiếu F4)
| # | Bài | Ngăn | Khoá ở đâu / lý do |
|---|---|---|---|
| 1 | Mở phiên từ bản chụp cũ | KHOÁ | C — `cai_thu_vien.sh` kéo nhánh; ca C1–C7, C5b trong `thu_cong_cu.js` |
| 2 | `\` là ký tự đại diện, `git add` lọt | KHOÁ | D3 — `tenThang` chung cho hoàn tác / add / commit; ca đỏ trước |
| 3 | Báo cáo agent soát không về | KHOÁ | D1 + E3 (`SubagentHandback`); lặp lại 4 lần trong chính việc này |
| 4 | `/ra-soat` đưa diff chưa commit | KHOÁ | E2 — `lenh_ra_soat.md` diff từ mốc PHIEU; ca E2 trong `thu_cong_cu.js` |
| 5 | Khoá không tự mở được từ bên trong | KHOÁ (đã có) | G1-KHUNG + deny `Edit(./.claude/**)` + nay `.github/**` |
| 6 | Commit không thành mà push "Everything up-to-date" | NGUYÊN TẮC | K7 — Chặn: phải thấy `[viec/<MÃ> <mã>]`, `git log origin/viec/<MÃ>..HEAD` rỗng |
| 7 | Bài thử TU-CHAY-2 vượt ngân sách ~2 lần | BỎ | Luật "vượt thì giải thích" đã có (`MAU_PHIEU.md`, `cau_hinh.json`) |
| 8 | Đột biến "bỏ bọc hàm" không dựng được ca hỏng thật | NGUYÊN TẮC | K3 — ghi CHƯA KIỂM, không đếm là phép |
| 9 | Bài phía chủ quán / chat (Shell treo, GitHub treo, `index.lock`, đổi mã GitHub) | BỎ | Thao tác của chủ quán, đã ghi Sổ Autonomous; máy không gặp (`.git/` bị người gác chặn) |

### Dọn (F1.3)
Không đề xuất xoá: chưa thấy lời dặn nào trong `KHUON_LOI.md` / `CLAUDE.md` có phép kiểm làm thay trọn vẹn.
`KHUON_LOI.md` = 107 dòng ≤ `khuon_loi_toi_da` 120.

### Đề xuất ngoài phạm vi (máy KHÔNG làm — chat soát duyệt)
- `kiem_tra_truoc_khi_giao.js` T2: bỏ thư mục con khi so `tu_chay/` (Phát hiện 3) — cần chủ quán cho sửa phép kiểm.
- `package.json` vào `file_luat` (Phát hiện 4).
- Ca thử cho phép kiểm cấu trúc `muc_gac` của `cai_dat.js` và phép kiểm cấu hình lúc nạp `cong.js` (đột biến M9, M10 sống).

## BÁO CÁO
```
VIỆC:        TU-CHAY-3 — Cổng GitHub cho mỗi PR, tự kéo nhánh khi mở phiên, rút kinh nghiệm
ĐÃ SỬA:      tu_chay/cong.js (mới, 242 dòng) — cổng: tinh (không chạy code PR: A4/A7, A6 qua xetPhamVi của người gác,
               A8 tĩnh :106, A9, A10, A12) / chay (A8 so kết quả cai_dat.js, npm ci, A11 đỏ trên gốc + xanh trên PR, A13);
               cau_hinh.json + nguoi_gac.js lấy từ thư mục cổng (= main)
             tu_chay/cong_github.yml (mới) — pull_request_target, 2 job cong / cong-chay, contents: read, chặn fork
               bước đầu, checkout v7.0.1 + setup-node v7.0.0 ghim SHA (node24), Node 22, ubuntu-24.04, timeout 20
             tu_chay/nguoi_gac.js:107 SubagentHandback; :188 xetPhamVi (tách khỏi ghiDuoc); :556 tenThang cho
               hoàn tác / git add / pathspec git commit + --pathspec-from-file; :865 phamViTuChu; xuất 3 hàm
             tu_chay/cai_dat.js:44 ghepHook (giữ hook chủ quán chung mục, cả PreToolUse lẫn SessionStart); :82 BAN_CAI,
               MUC_GAC đọc từ cau_hinh.json; deny Edit(./.github/**); in git add cho bản cài mới
             tu_chay/cai_thu_vien.sh:13-35 — kéo nhánh viec/* (fetch + merge --ff-only) trước npm ci
             tu_chay/cau_hinh.json — file_cam .github/**, khuon_loi_toi_da 120, muc_gac, ban_cai
             kiem_tra_truoc_khi_giao.js — T1c chạy thu_cong.js, T4 so bản cài trong ban_cai
             tu_chay/lenh_ra_soat.md (mới) · skill_lam_viec.md (bước 11, 7 mục) · MAU_PHIEU.md (G1–G3) · THIET_KE.md B15 ·
             CLAUDE.md §7 (7 mục, BÀI HỌC) · KHUON_LOI.md (K3, K5, K7) · PHIEN_BAN tu-chay 1.3.0
BÀI THỬ:     chạy trên bản chưa vá → ĐỎ: thu_nguoi_gac 36 chỗ (vd. `git restore .github/workflows/keep-alive.yml` ra CHO),
               thu_cong_cu 20 chỗ (C3–C7, E, F, G, H2), thu_cong 63/63; mỗi vòng soát thêm ca đỏ trước
               (bang_chung_do.txt: lần đầu + vòng 1, 2, 3; bước 11: ca thêm muộn). Sau khi vá → XANH:
               thu_nguoi_gac 777/777 ca + 157 phép, thu_cong_cu 66, thu_cong 138 (đột biến A6–A14, B6 23 đột biến yml);
               npm test và --day-du PASS 52 · FAIL 0 · CẢNH BÁO 4 (T2/T3/T4: bản cài chưa cài lại — chờ chủ quán)
ĐÃ RÀ K4:    grep "[*?[\]\\]" nguoi_gac.js → 1 chỗ (hoàn tác) → gộp thành tenThang cho add + commit;
               PreToolUse / SessionStart cùng khuôn lọc bỏ cả mục → 2 chỗ, một hàm ghepHook;
               file_cam ↔ deny Edit(...) → thêm cả hai; bảng bản cài chép tay 3 nơi → một ban_cai trong cau_hinh.json;
               grep "6 mục" → CLAUDE.md, skill (2), THIET_KE (1) → sửa hết (viec/TU-CHAY-1,2 là lịch sử, để nguyên);
               xoá trình cài: cai_dat.js / cai_dat.sh ở cả tinh lẫn chay
CHƯA KIỂM:   - Cổng CHƯA chạy trên GitHub: check-run của pull_request_target gắn vào commit nào, ruleset có nhận hai
               check không, thời gian thật so với timeout 20 — kiểm sống bước 1–2. Chính PR này chưa được cổng soát.
             - docs.github.com bị chặn ở máy mây (EGRESS_BLOCKED): B1 chỉ đọc qua kết quả tìm kiếm; SHA hai action đọc
               từ trang release + action.yml tại SHA (WebFetch), chưa đối chiếu bằng git ls-remote (người gác chặn).
             - Vòng sửa 3 (3880e2d) và bước 11 (c79ffae) CHƯA được /ra-soat lại — đã hết 3 vòng sửa.
             - SubagentHandback chỉ có căn cứ là nhật ký người gác + thông báo của Claude Code, chưa có tài liệu; chưa
               có hiệu lực tới khi chủ quán chạy bash tu_chay/cai_dat.sh (máy mây vẫn chạy người gác cũ).
             - Hook kéo nhánh chưa chạy trên máy mây thật; ca C1, C2, C5b xanh cả trên bản chưa vá (đối chứng C7/C3).
             - Đột biến M9 (phép kiểm muc_gac trong cai_dat.js), M10 (phép kiểm cau_hinh khi nạp cong.js) không có ca.
             - Ngân sách VƯỢT 1,3 lần: code ~450 dòng / ~320 (1,4×) — cong.js 242/150 (hai chế độ Q5, A8 tĩnh qua 3 vòng
               soát, chạy bài thử trên PR), cong_github.yml 87/45 (hai job Q5, setup-node Q3 trong cả hai); bài thử ~650 /
               ~400 (1,6×) — ca Q2, Q3, A10b, tách chế độ, ~25 ca do 3 vòng soát. Đường tiền, client/: không đụng.
GIT:         faf415a TU-CHAY-3: trang thai — /ra-soat 3 vong, bai hoc buoc 11, bao cao 7 muc
             c79ffae TU-CHAY-3: buoc 11 — khoa ca them muon trong thu_nguoi_gac (Object.freeze), 3 nguyen tac K3/K5
             (commit này chỉ thêm dòng GIT vào trang_thai.md)
BÀI HỌC:     KHOÁ 8 · NGUYÊN TẮC 4 · BỎ 7 (19 bài: 10 sự cố của việc này + 9 bài phiếu F4; chi tiết ở ## Bài học)
```

