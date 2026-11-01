# TU-CHAY-10 — Bộ khung 1.9.0: soát bảo mật TỰ ĐỘNG cho việc phiếu ghi "## Soát bảo mật: có" (lệnh /soat-bao-mat + bước skill + cổng A20)

<!-- Phiếu do chat soạn 31.10.2026. Việc sửa BỘ KHUNG — Opus, lập kế hoạch, DỪNG chờ duyệt. Nền: main sau sổ v52, bộ khung tu-chay 1.8.1.
     Chủ quán chốt 31.10 (QUYET_DINH_CHU_QUAN.md mục Chung — dữ liệu và hệ thống): mở đóng băng tu_chay CHỈ cho việc này; mọi việc dính tiền / cửa công khai / đăng nhập /
     dữ liệu khách được soát bảo mật TỰ ĐỘNG (chủ quán không phải nhớ gõ lệnh); chat quyết việc nào cần soát ngay trong phiếu; làm MỘT lần, chép
     y nguyên sang kho App KH (tuquyduong/APP-KH dùng cùng bộ khung tu-chay 1.8.1 — mọi file tu_chay/ giống hệt POS, trừ cau_hinh.json).
     Nguồn lời nhắc: lệnh /security-review của Anthropic (github.com/anthropics/claude-code-security-review, `.claude/commands/security-review.md`,
     giấy phép MIT — giữ dòng ghi nguồn + giấy phép trong file mới). Bản gốc dùng `!git diff --merge-base origin/HEAD` — máy mây KHÔNG có ref main
     và người gác cấm `git fetch` ngoài nhánh việc → lấy diff theo ĐÚNG cách `/ra-soat` bước 1 (mốc = cha commit `PHIEU: <MÃ>` đầu tiên).
     Hiện trạng chat đọc 31.10 trên main 18ee394 (tu-chay 1.8.1):
     - tu_chay/skill_lam_viec.md (113 dòng; bước 8 "Soát độc lập bằng /ra-soat", bước 11.4 cổng chay + HEAD ĐÃ KIỂM).
     - tu_chay/lenh_ra_soat.md (khuôn lệnh: bước 1 lấy diff theo mốc PHIEU, bước 2 giao subagent độc lập) — cài thành .claude/commands/ra-soat.md.
     - tu_chay/cau_hinh.json `ban_cai` [[nguồn, đích]] — cong.js ~144 đã chấp nhận PR THÊM một mục ban_cai (thu_cong ca "K5 PR thêm một mục
       ban_cai + nguồn + chủ quán đã cài" ~262); `✗ [A8]` (chủ quán cài sau) ở PR sửa tu_chay/ là bình thường.
     - tu_chay/cong.js (358 dòng, phép A1–A19; đọc mục phiếu: mucMien ~58, mucBaiThuCu ~65); tu_chay/thu_cong.js (809 dòng); tu_chay/MAU_PHIEU.md
       (mục: Mục tiêu · Nghiệm thu · Phạm vi · Bài thử đỏ · Bài thử cũ sửa · Ngân sách · Đổi cấu trúc DB · Thư viện mới · Cấm); tu_chay/PHIEN_BAN.
     - Sau khi gộp: chat cài bằng `node tu_chay/cai_dat.js` (khuôn cai_TUCHAY*.py) trên main POS, rồi chép sang APP-KH bằng script của chat. -->

**Chờ duyệt kế hoạch:** viết `viec/TU-CHAY-10/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Việc nào phiếu ghi `## Soát bảo mật` = `có` thì máy tự soát bảo mật thay đổi của nhánh trước khi báo xong; cổng chặn nếu thiếu. Thay đổi giống hệt
dùng được cho kho App KH (chỉ khác cau_hinh.json một mục ban_cai).

## Nghiệm thu
- A **Lệnh `/soat-bao-mat`** — nguồn `tu_chay/lenh_soat_bao_mat.md`, thêm MỘT mục `ban_cai` → `.claude/commands/soat-bao-mat.md`:
  bước 1 lấy diff y như `/ra-soat` bước 1; bước 2 giao subagent độc lập (chỉ đọc) theo lời nhắc bảo mật của Anthropic (giữ nguyên các nhóm lỗi,
  luật loại báo nhầm, ngưỡng tin cậy ≥ 8, dạng báo cáo; chỉ dịch phần dẫn sang tiếng Việt nếu cần); bước 3 lọc báo nhầm bằng subagent riêng như
  bản gốc. Thêm phần "Tiền lệ của kho này" (NGẮN, không lặp bản gốc): webhook phải kiểm chữ ký + chống phát lại; không tin số tiền / giá từ
  máy khách; người này xem / sửa được đơn, điểm, ví của người khác (theo SĐT, mã đơn) là lỗi; mã ngắn (OTP 6 số, PIN, mã ghép) đoán được vì
  không giới hạn lần sai là lỗi XÁC THỰC (không phải "rate limit" bị loại); lộ khoá / PIN / token trong trả lời, lỗi hay nhật ký là lỗi.
  Không phụ thuộc kho (đọc CLAUDE.md của kho đang chạy) để chép sang APP-KH không phải sửa chữ.
- B **Skill bước 8b** (`tu_chay/skill_lam_viec.md`, sau bước 8): phiếu có `## Soát bảo mật` mà dòng đầu bắt đầu `có` → chạy `/soat-bao-mat`;
  chép NGUYÊN VĂN báo cáo vào `trang_thai.md` mục `## Soát bảo mật`; lỗi còn lại sau lọc = lỗi thật → vòng sửa như mọi lỗi (bài thử đỏ trước,
  đột biến), rồi soát bảo mật lại; tối đa 2 lần soát bảo mật — còn lỗi thì `## Câu hỏi` và dừng. Kết thúc bằng MỘT dòng riêng
  `SOÁT BẢO MẬT: ĐẠT` (không còn lỗi) hoặc `SOÁT BẢO MẬT: KHÔNG ĐẠT — <số lỗi>` . Bước này nằm TRƯỚC bước 11.4 (HEAD ĐÃ KIỂM). Không có mục
  hoặc `không` → bỏ qua bước 8b. Thêm đúng các dòng cần thiết, không đổi các bước khác.
- C **Cổng A20** (`tu_chay/cong.js`, cả `tinh` lẫn `chay` như các phép đọc phiếu khác): phiếu ở head có `## Soát bảo mật` →
  dòng đầu không rỗng phải bắt đầu `có` hoặc `không` (khác → ✗ A20 "ghi có hoặc không"); `có` → `viec/<MÃ>/trang_thai.md` ở head phải có một
  dòng đúng `^SOÁT BẢO MẬT: ĐẠT` (thiếu / KHÔNG ĐẠT → ✗ A20). Phiếu không có mục → không kiểm (phiếu cũ, việc đang chạy giữ nguyên).
- D **Mẫu phiếu** (`tu_chay/MAU_PHIEU.md`): thêm mục `## Soát bảo mật` (giữa `## Cấm` và cuối, hoặc chỗ kế hoạch chọn — một chỗ) với cách
  ghi `có — <lý do: cửa công khai / webhook / tiền / đăng nhập / dữ liệu khách>` hoặc `không — <lý do>`.
- E **Bài thử khung** (`tu_chay/thu_cong.js`): ca ĐỎ trên 1.8.1 cho A20 — phiếu `có` + thiếu dòng → ✗; `có` + `KHÔNG ĐẠT` → ✗; `có` + `ĐẠT` →
  qua; giá trị lạ → ✗; không có mục → qua; `không` → qua; PR thêm mục ban_cai soat-bao-mat + nguồn → qua (như ca K5 sẵn có).
- F **Phiên bản + tài liệu:** `tu_chay/PHIEN_BAN` = `tu-chay 1.9.0`; `tu_chay/THIET_KE.md` thêm MỘT đoạn ngắn (A20 + bước 8b + nguồn lời nhắc).
  `cau_hinh.json` POS chỉ thêm đúng một mục `["lenh_soat_bao_mat.md", ".claude/commands/soat-bao-mat.md"]` vào `ban_cai`.
- G **Chép sang APP-KH được nguyên:** trong `ke_hoach.md` / `trang_thai.md` ghi danh sách file tu_chay/ đổi (để chat chép), và XÁC NHẬN bằng
  đọc code rằng không file nào ghi cứng chữ "POS" / đường dẫn riêng của kho POS trong phần mới.
- H **K5:** mọi phép A1–A19, người gác, `/ra-soat`, các bước skill khác chạy y như cũ; `node tu_chay/thu_cong.js`, `thu_nguoi_gac.js`,
  `thu_cong_cu.js`, `npm test` xanh.

## Phạm vi
- viec/TU-CHAY-10/**
- tu_chay/lenh_soat_bao_mat.md
- tu_chay/skill_lam_viec.md
- tu_chay/MAU_PHIEU.md
- tu_chay/cong.js
- tu_chay/thu_cong.js
- tu_chay/cau_hinh.json
- tu_chay/PHIEN_BAN
- tu_chay/THIET_KE.md

## Bài thử đỏ
Có — `tu_chay/thu_cong.js` (bài thử của chính bộ khung, tự thử qua tiến trình con): các ca A20 ở mục E ĐỎ trên tu-chay 1.8.1, xanh sau khi sửa.

## Bài thử cũ sửa
- tu_chay/thu_cong.js — bài thử của bộ khung tự chạy chính nó qua tiến trình con; thêm ca A20 (skill bước 4: xanh trên gốc ở các ca cũ → cần mục này)

## Ngân sách
~40 dòng cong.js + ~15 dòng skill + ~5 dòng mẫu phiếu + lệnh mới ~200 dòng (phần lớn chép bản gốc) + ~80 dòng thử.
**Phương án đơn giản nhất đã xét:** một lệnh mới cài như `/ra-soat`, một bước skill, một phép cổng đọc một dòng; không đổi cách làm việc nào khác.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
không — chỉ sửa bộ khung (không có cửa công khai, tiền, dữ liệu khách)

## Cấm
- KHÔNG đổi các phép A1–A19, người gác (nguoi_gac.js), lenh_ra_soat.md, cai_dat.*, cong_github.yml, số vòng sửa của `/ra-soat`.
- KHÔNG sửa .claude/, .github/ (chủ quán / chat cài sau bằng cai_dat.js); KHÔNG sửa code app (server/, client/).
- KHÔNG làm bước soát bảo mật thành bắt buộc cho phiếu cũ không có mục (việc đang chạy phải gộp được như cũ).
- Mặc định: không sửa sổ việc. Chỉ push `git push -u origin viec/TU-CHAY-10`. Không đụng main, không merge, không tạo PR.
