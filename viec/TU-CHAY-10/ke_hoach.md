# TU-CHAY-10 — kế hoạch (bộ khung tu-chay 1.9.0: soát bảo mật tự động)

Đọc trong lượt này (01.11.2026, HEAD `abed525`): `tu_chay/cong.js` (358 dòng), `tu_chay/thu_cong.js` 1–560 + 680–692,
`tu_chay/skill_lam_viec.md` 60–113, `tu_chay/MAU_PHIEU.md` (66 dòng), `tu_chay/lenh_ra_soat.md` (78 dòng), `tu_chay/cau_hinh.json`,
`tu_chay/thu_nguoi_gac.js` 790–806 + 1050–1075, `tu_chay/thu_cong_cu.js` 459–462, `tu_chay/THIET_KE.md` 975–981, `tu_chay/cai_dat.js` 83–91.
Bản gốc lời nhắc: `anthropics/claude-code-security-review` `.claude/commands/security-review.md` (192 dòng, MIT, "Copyright (c) 2025 Anthropic"),
lấy bằng WebFetch.

## ⚠ Chặn trước khi làm — cần chủ quán sửa phiếu (xem `trang_thai.md` ## Câu hỏi 1)
`tu_chay/thu_nguoi_gac.js:800-802` so BẰNG `ban_cai` với đúng 3 mục. Nghiệm thu F thêm mục thứ tư → phép này đỏ → nghiệm thu H hỏng.
`thu_nguoi_gac.js` là file luật, không có trong Phạm vi → người gác chặn ghi, cổng `✗ [A6]`. Đề xuất: thêm `- tu_chay/thu_nguoi_gac.js`
vào `## Phạm vi`; mình chỉ sửa đúng danh sách ở dòng 800–802 (LUAT_XAY_APP §6.7, vẫn so BẰNG).

## Phần A — lệnh `/soat-bao-mat` (`tu_chay/lenh_soat_bao_mat.md`, mới)
- **PA-A1 (chọn):** một file theo khuôn `lenh_ra_soat.md`: front-matter `description`; dòng chú thích nguồn + giấy phép MIT
  (`anthropics/claude-code-security-review`, Copyright (c) 2025 Anthropic, MIT); **Bước 1** lấy diff y hệt `/ra-soat` bước 1 (mốc = cha
  commit `PHIEU: <MÃ>` đầu tiên — thay các dòng `!git diff --merge-base origin/HEAD` của bản gốc); **Bước 2** giao một subagent độc lập
  chỉ đọc (Agent general-purpose) lời nhắc bản gốc GIỮ NGUYÊN tiếng Anh: OBJECTIVE, CRITICAL INSTRUCTIONS, SECURITY CATEGORIES,
  ANALYSIS METHODOLOGY, REQUIRED OUTPUT FORMAT, SEVERITY, CONFIDENCE, FALSE POSITIVE FILTERING; **Bước 3** mỗi lỗi tìm được một subagent lọc
  báo nhầm riêng (song song, đưa nguyên mục FALSE POSITIVE FILTERING), bỏ lỗi điểm tin cậy < 8 — đúng 3 bước "START ANALYSIS" của bản gốc;
  **Bước 4** phiên chính chép NGUYÊN VĂN báo cáo vào `viec/<MÃ>/trang_thai.md` mục `## Soát bảo mật` (không về thì ghi "báo cáo không về",
  không tự kết luận ĐẠT). Subagent nộp bằng `SubagentHandback` như `/ra-soat` (người gác cho qua đúng tên này).
  Thêm mục **"Tiền lệ của kho này"** (~8 dòng, tiếng Việt, ĐỨNG TRÊN các loại trừ của bản gốc): đọc `CLAUDE.md` của kho đang chạy để biết
  mô hình đe doạ; webhook phải kiểm chữ ký + chống phát lại; máy chủ không tin số tiền / giá máy khách gửi; người này xem / sửa đơn, điểm,
  ví của người khác (qua SĐT, mã đơn, mã khách trong tham số) là lỗi phân quyền; mã ngắn (OTP 6 số, PIN, mã ghép) không giới hạn số lần
  sai là lỗi XÁC THỰC — KHÔNG thuộc loại trừ "rate limiting" của bản gốc; lộ khoá / PIN / token trong trả lời, thông báo lỗi hay nhật ký là
  lỗi. Không chữ "POS", không đường dẫn riêng của kho POS (để chép sang APP-KH nguyên văn).
  ~215 dòng (≈ 190 dòng bản gốc + ~25 dòng dẫn / tiền lệ). Rủi ro: người gác chặn lệnh trong bước 1 → dùng đúng các lệnh `/ra-soat` đã qua.
- **PA-A2:** dịch toàn bộ bản gốc sang tiếng Việt. Không chọn: dài bằng, dễ lệch nghĩa các luật loại trừ, phiếu chỉ cho "dịch phần dẫn".
- Phần "dạng báo cáo" của bản gốc giữ nguyên; lệnh thêm một dòng kết luận cuối do phiên chính ghi (xem phần B).

## Phần B — skill bước 8b (`tu_chay/skill_lam_viec.md`)
- **PA-B1 (chọn):** chèn ~6 dòng ngay sau bước 8 (dòng 83–84), trước bước 9:
  `8b. **Soát bảo mật** — chỉ khi phiếu có `## Soát bảo mật` mà dòng đầu (không rỗng) bắt đầu `có` (hoa / thường như nhau): chạy
  `/soat-bao-mat`; báo cáo được chép NGUYÊN VĂN vào `trang_thai.md` mục `## Soát bảo mật`. Lỗi còn lại sau lọc = lỗi thật → vòng sửa như
  mọi lỗi (bước 4: bài thử đỏ trước, đột biến; bước 5–7), rồi soát bảo mật lại. Tối đa 2 lần soát bảo mật — lần 2 còn lỗi thì ghi `## Câu hỏi`
  và dừng. Kết thúc bằng MỘT dòng riêng `SOÁT BẢO MẬT: ĐẠT` hoặc `SOÁT BẢO MẬT: KHÔNG ĐẠT — <số lỗi>` (cổng A20 đọc dòng `SOÁT BẢO MẬT:` cuối).
  Sau vòng sửa của 8b thì làm lại bước 6–8 (`/ra-soat` soát cả chỗ sửa) rồi mới soát bảo mật lại. Bước này nằm trước bước 11.4
  (HEAD ĐÃ KIỂM); bước 11 đổi code ngoài `viec/<MÃ>/` thì soát bảo mật lại. Không có mục hoặc `không` → bỏ qua.`
  Một chỗ phải đụng ngoài 8b (chờ Câu hỏi 2): câu bước 4 dòng 70 "`✗ [A19]` … `✗ [A8]` … ở bước này là bình thường" — thêm `✗ [A20]`
  (chưa tới 8b), nếu không máy sẽ dừng hỏi oan ở mọi việc phiếu ghi `có`.
  Không đổi bước khác.
- **PA-B2:** gộp vào bước 8 (`/ra-soat` tự gọi soát bảo mật). Không chọn: đổi `lenh_ra_soat.md` (Cấm).

## Phần C — cổng A20 (`tu_chay/cong.js`)
- **PA-C1 (chọn):** ~14 dòng. Một hàm `mucBaoMat(phieu)` cùng khuôn `mucMien` (tìm `## Soát bảo mật`, lấy dòng KHÔNG RỖNG đầu tiên;
  không có mục → `null`) và một khối kiểm đặt ở **đoạn chung trước `if (cheDo === 'tinh')`** (sau dòng 118), nên MỘT chỗ code chạy cho cả
  `tinh` lẫn `chay` (không chép hai lần — K4):
  - dòng đầu khớp `^\s*[-*]?\s*(có|không)(?![\p{L}\p{N}])` (cờ `iu`, sau `normalize('NFC')`) — không khớp (kể cả `<…>` của mẫu, `cóx`,
    dòng trống tới hết mục) → `✗ [A20] ## Soát bảo mật: dòng đầu phải ghi "có — <lý do>" hoặc "không — <lý do>"`.
    Ghi chú: phiếu có tiêu đề mà mục rỗng tới tiêu đề kế → cũng ✗ (giá trị lạ), vì "không có dòng đầu" ≠ "không có mục".
  - `có` → đọc `viec/<MÃ>/trang_thai.md` ở head bằng `blob` (như A17 — không đọc đĩa); dòng CUỐI khớp `^SOÁT BẢO MẬT:` phải khớp
    `^SOÁT BẢO MẬT: ĐẠT(?![\p{L}\p{N}])` → thiếu / KHÔNG ĐẠT → `✗ [A20] phiếu ghi Soát bảo mật: có mà trang_thai.md chưa có dòng
    "SOÁT BẢO MẬT: ĐẠT" (skill bước 8b)`. Đọc dòng cuối (như A19) để "ĐẠT" cũ rồi "KHÔNG ĐẠT" ở lần soát sau không lọt.
  - Không có mục → không kiểm (phiếu cũ, việc đang chạy).
  - `mucBaoMat` dừng ở dòng `^#` kế tiếp (khuôn `mucBaiThuCu` dòng 69, KHÔNG như `mucMien` dòng 61 vốn đọc lấn sang mục sau) — mục rỗng
    báo đúng lý do "ghi có hoặc không".
  - "Dòng cuối thắng" CHẶT HƠN phiếu (phiếu: "có một dòng") — chọn vì lần soát sau KHÔNG ĐẠT phải thắng lần ĐẠT cũ; vẫn đạt mọi ca của phiếu.
  - Tắt được bằng `tat: A20` (cho đột biến của `thu_cong.js`), như A6–A19.
- **PA-C2:** hai khối riêng trong nhánh `tinh` và nhánh `chay`. Không chọn: gấp đôi dòng, hai biểu thức dễ lệch (K4 BAN-HANG-1).
- Không đụng A1–A19 (Cấm): khối mới chỉ THÊM dòng, không sửa dòng cũ.

## Phần D — mẫu phiếu (`tu_chay/MAU_PHIEU.md`)
- **Chọn:** ~5 dòng, mục `## Soát bảo mật` giữa `## Thư viện mới` và `## Cấm` (đúng chỗ phiếu TU-CHAY-10 đang đặt):
  dòng đầu mặc định `có — <lý do: cửa công khai / webhook / tiền / đăng nhập / dữ liệu khách>` + dòng `<hoặc: không — <lý do>>` + một dòng
  `<…>` giải thích bước 8b + cổng A20. Mặc định `có` là phía AN TOÀN: chat quên sửa thì máy vẫn soát. (PA khác: mặc định `không` — không
  chọn, quên sửa = bỏ soát.)

## Phần E — bài thử khung (`tu_chay/thu_cong.js`) ~45 dòng
Thêm khối "TU-CHAY-10 A20" vào `baiCong()` (phiếu đổi ở commit `PHIEU: X` — A7), PR chỉ hồ sơ `viec/X/` nên A12/A18/A19 không áp
(mỗi ca chỉ phá ĐÚNG A20 — K3). Ca "ĐỎ" khớp câu `[A20]` + đúng 1 dòng `✗ [` (soLyDo: 1):
| # | Ca | Mong | Ánh xạ |
|---|---|---|---|
| E1 | `có — webhook` + trang_thai không có dòng (tinh) | ĐỎ `[A20]` "SOÁT BẢO MẬT: ĐẠT" | C, E "thiếu dòng" |
| E1c | như E1, chế độ `chay` | ĐỎ `[A20]` | C "cả chay" |
| E2 | `có` + dòng `SOÁT BẢO MẬT: KHÔNG ĐẠT — 2` | ĐỎ | E "KHÔNG ĐẠT" |
| E3 | `có` + dòng `SOÁT BẢO MẬT: ĐẠT` (tinh + chay) | ĐẠT | E "ĐẠT → qua" |
| E4 | `có` + `ĐẠT` rồi dòng sau `KHÔNG ĐẠT — 1` | ĐỎ | dòng cuối thắng |
| E5 | `có` + `KHÔNG ĐẠT — 1` rồi dòng sau `ĐẠT` | ĐẠT | K5 soát lại |
| E6 | giá trị lạ `chưa rõ` | ĐỎ "có hoặc không" | E "giá trị lạ" |
| E6c | `cóthể` (chữ dính) | ĐỎ | ranh giới chữ |
| E7 | phiếu không có mục (PHIEU cũ) — mọi ca cũ | ĐẠT | E "không mục", H |
| E8 | `không — chỉ sửa khung`, không dòng trong trang_thai | ĐẠT | E "không → qua" |
| E9 | `- Có — tiền` (gạch đầu dòng, hoa) + `ĐẠT` | ĐẠT | K5 cách ghi |
| E11 | PR thêm mục `ban_cai` `["lenh_soat_bao_mat.md", ".claude/commands/soat-bao-mat.md"]` + nguồn + đã cài | ĐẠT | E ca K5 ban_cai |
Đột biến (`DB`): `['A20', E1, 'tinh']`, `['A20', E1c, 'chay']`, `['A20', E6, 'tinh']` → tắt A20 phải thành ĐẠT.
Đột biến tay (ghi kết quả vào `trang_thai.md`, chạy bằng bản sao trong nháp): đọc dòng ĐẦU thay dòng cuối → E4 bắt; bỏ `(?!…)` → E6c
bắt; bỏ cờ `i` → E9 bắt; đặt khối A20 chỉ trong nhánh `tinh` → E1c bắt.
**Đỏ trên 1.8.1:** E1, E1c, E2, E4, E6, E6c đỏ trên `cong.js` gốc (gốc không có A20 → các ca "phải ĐỎ" thành ĐẠT) → bài đỏ.
Ghi `SỐ CA tu_chay/thu_cong.js: <N>` (dòng tổng "… phép · … chỗ hỏng" — số phép khi chạy trên code đã vá) vào `bang_chung_do.txt`.
Phiếu đã ghi `thu_cong.js` ở `## Bài thử cũ sửa` → cổng chạy BẢN GỐC `thu_cong.js` trên code mới phải xanh (mọi ca cũ không đổi — H).

## Phần F — phiên bản, tài liệu, cấu hình
- `tu_chay/PHIEN_BAN` → `tu-chay 1.9.0`. `thu_cong_cu.js:461` đòi THIET_KE có tiêu đề `### … (…, tu-chay 1.9.0)` →
  `### TU-CHAY-10 (01.11.2026, tu-chay 1.9.0)` + ~5 dòng (A20, bước 8b, nguồn lời nhắc + MIT) cuối `THIET_KE.md`.
- `tu_chay/cau_hinh.json`: thêm ĐÚNG một mục `["lenh_soat_bao_mat.md", ".claude/commands/soat-bao-mat.md"]` vào `ban_cai`.
  `cong.js:144` (A8 tĩnh) đã nhận mục ban_cai THÊM vào `.claude/`; `thu_cong.js:688` (A2 người đọc khoá) không đổi vì không có khoá mới.
- `thu_nguoi_gac.js:800-802` (danh sách trắng `ban_cai`) — chờ Câu hỏi 1.

## Phần G — chép sang APP-KH
File tu_chay/ đổi (cập nhật 01.11 sau khi chủ quán duyệt Phạm vi — danh sách CUỐI ở `trang_thai.md` mục "Chép sang APP-KH"):
`lenh_soat_bao_mat.md` (mới), `skill_lam_viec.md`, `MAU_PHIEU.md`, `cong.js`, `thu_cong.js`, `thu_nguoi_gac.js`, `thu_cong_cu.js`, `PHIEN_BAN`,
`THIET_KE.md`; `cau_hinh.json` KHÔNG chép nguyên — APP-KH chỉ thêm đúng mục `ban_cai` mới (phiếu mục A, F).
Lưu ý cho chat: `thu_nguoi_gac.js:800-802` của APP-KH cũng khoá ban_cai — nếu bản APP-KH giống hệt thì chép được; khác thì chat sửa danh
sách đó. Xác nhận "không chữ POS / đường dẫn riêng": `grep -n "POS\|pos-tuquyduong\|Tứ Quý\|server/\|client/" <phần mới>` trên diff của 4 file
chữ (lệnh, skill, mẫu phiếu, THIET_KE đoạn mới) và khối A20 — kết quả chép vào `trang_thai.md`. (Bài thử dùng kho giả có `server/` sẵn —
không phải đường dẫn kho POS thật.)

## Đường song song cần canh (K4)
- A20 chạy cả `tinh` và `chay`: một khối chung trước chỗ tách; ca E1c + đột biến "chỉ trong tinh".
- Đọc phiếu: dùng `phieu` đã đọc bằng `blob` ở head (dòng 102) — không đọc đĩa (khuôn "tinh đọc phiếu bằng git show").
- Đọc trang_thai ở head bằng `blob` — cùng nguồn A17/A19 (dòng 186). Không sửa dòng 186 (Cấm đổi A17/A19): đọc lại một lần nữa trong khối A20.
- Ba chỗ đọc chữ "có": skill 8b (máy quyết có soát không), cổng A20 (đòi dòng ĐẠT), mẫu phiếu — CÙNG một luật "dòng đầu không rỗng bắt đầu
  có/không, hoa thường như nhau" (K4 BAN-HANG-1: một vị từ).
- Bản cài: `cai_dat.js` đọc `ban_cai` chung (dòng 83) → tự cài lệnh mới; `thu_nguoi_gac.js:1058` lặp theo ban_cai → tự kiểm bản cài mới.

## Luồng hợp lệ phải KHÔNG bị chặn (K5)
1. Mọi phiếu cũ không có mục (mọi ca cũ của `thu_cong.js` dùng PHIEU không mục — E7; và mọi việc đang chạy trên main).
2. `không — <lý do>` không cần dòng nào trong trang_thai (E8) — gồm chính phiếu TU-CHAY-10.
3. Cách ghi `- Có — …` (E9); soát lại sau KHÔNG ĐẠT (E5).
4. PR bộ khung thêm mục ban_cai mới (E11, như ca K5 dòng 262).
5. A1–A19, người gác, `/ra-soat`, các bước skill khác: không sửa dòng nào → `thu_cong.js` (bản gốc + bản mới), `thu_nguoi_gac.js`,
   `thu_cong_cu.js`, `npm test` xanh (H).

## Nghiệm thu → bằng chứng
| Mục | Bằng chứng dự kiến |
|---|---|
| A | file `lenh_soat_bao_mat.md` + đối chiếu từng nhóm bản gốc (bảng trong trang_thai); bản cài khớp byte qua `thu_nguoi_gac.js:1058` sau khi chủ quán cài |
| B | diff `skill_lam_viec.md` (chỉ thêm 8b) |
| C | E1, E1c, E2, E4, E6 + đột biến DB A20 |
| D | diff `MAU_PHIEU.md` |
| E | E1–E11, `bang_chung_do.txt` (đỏ trên 1.8.1 + SỐ CA) |
| F | `PHIEN_BAN`, THIET_KE, cau_hinh; `thu_cong_cu.js` A5 xanh |
| G | danh sách file ở trên + kết quả grep |
| H | `node tu_chay/thu_cong.js`, `thu_nguoi_gac.js`, `thu_cong_cu.js`, `npm test`, `npm test -- --day-du` xanh; cổng `chay` (✗ [A8] chờ chủ quán cài là bình thường) |

## Ngân sách
cong.js ~14 · skill ~6 · mẫu phiếu ~5 · lệnh ~215 · thử ~45 · PHIEN_BAN 1 · THIET_KE ~6 · cau_hinh 1 · thu_nguoi_gac 1 → trong ngân sách phiếu.

## Soát kế hoạch (agent phụ chỉ đọc, 01.11) — đã xử lý
- Ngoài phạm vi: chỉ `thu_nguoi_gac.js:800-802` khoá cứng (đã nêu). `kiem_tra_truoc_khi_giao.js:716-727` (T4) lặp ban_cai, thiếu bản cài chỉ
  cảnh báo; `thu_cong_cu.js:338-351, 418, 428, 465` (mục MAU_PHIEU, thứ tự mốc skill, cắt bước theo `\nN. **`) không vỡ khi chèn `8b.`.
- Ngắn hơn: bỏ ca E6b, E10 và một đột biến DB (giữ E4 "dòng cuối", E6c ranh giới, E9 K5).
- Thiếu bằng chứng tự động cho A (nội dung lệnh), B (8b), D (mẫu phiếu): khuôn sẵn là phép chữ trong `thu_cong_cu.js` (vd `:372-379` canh
  lenh_ra_soat) — file luật ngoài Phạm vi → gom vào Câu hỏi 1; không được thêm thì ghi CHƯA KIỂM, kiểm tay bằng bảng đối chiếu.
- Đường song song sót: (a) skill bước 4 chưa coi `✗ [A20]` là bình thường → Câu hỏi 2; (b) sửa sau 8b / bước 11 không được soát lại →
  thêm câu vào 8b (ở trên) + CHƯA KIỂM: A20 không gắn SHA như A19; (d) `mucBaoMat` dừng ở `^#` (ở trên).

## CHƯA KIỂM (biết trước)
- A20 chỉ đọc dòng `SOÁT BẢO MẬT: ĐẠT`, KHÔNG gắn SHA như A19: code đổi sau lần soát bảo mật vẫn qua cổng nếu máy quên soát lại (lời dặn
  ở 8b, không phải khoá). Khoá thật = dòng dạng `SOÁT BẢO MẬT: ĐẠT <SHA>` + phép như A19 — ngoài phiếu, ghi đề xuất ở bước 11.
- Lệnh `/soat-bao-mat` chạy thật trên một việc có mục `có` chỉ kiểm được sau khi chủ quán cài (`node tu_chay/cai_dat.js`); việc này
  `không` nên không tự chạy bước 8b. Bài thử chỉ canh cổng, không canh chất lượng báo cáo của subagent.
- Bản gốc lấy qua WebFetch (bước trích chữ) — khoảng trắng có thể lệch nhẹ so với file gốc; nội dung từng mục giữ nguyên.
