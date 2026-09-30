# TU-CHAY-1 — Người gác (POS)

## Mục tiêu
Dựng lớp 2 (người gác `nguoi_gac.js`, hook PreToolUse "chỉ cho những gì cần",
fail-closed) và lớp 1 (deny trong settings) theo THIET_KE_TU_CHAY v1.1, Phần B3/B4/B11,
cùng các điểm chủ quán đã chốt [A]–[E] và bảy điểm sửa (a)–(g) ngày 28.09.2026.
Mã nguồn nằm ở `tu_chay/`. Chủ quán tự cài vào `.claude/` bằng `bash tu_chay/cai_dat.sh`.

## Nghiệm thu
- `node tu_chay/thu_nguoi_gac.js` xanh, đủ các ca B11 trong `ke_hoach.md`, gồm:
  - `cp x viec/X/phieu.md` bị chặn dù phạm vi có `viec/X/**`;
  - commit có `;`, `(…)` và commit bằng heredoc đi qua được;
  - `TaskCreate` và `ToolSearch` được qua, `mcp__x__y` bị chặn;
  - `sha256sum x` được qua, `touch .claude/x` và `chmod +x viec/X/phieu.md` bị chặn.
- Đột biến: tắt từng mã luật trong `LUAT` thì bài thử phải đỏ ít nhất một ca.
- Bài thử chạy trên người gác rỗng và trên `cai_dat.js` rỗng → ĐỎ. Bằng chứng lưu ở `viec/TU-CHAY-1/bang_chung_do.txt`.
- Bài cài đặt trên kho tạm:
  - lần 1 ghép settings đúng;
  - lần 2 không đổi gì;
  - JSON hỏng hoặc có `CLAUDECODE` → từ chối;
  - `pre-push` khác nội dung → không đè;
  - push tới remote bare tạm bị từ chối khi có `CLAUDECODE` hoặc `CLAUDE_CODE_CHILD_SESSION`, đẩy được khi không có.
- `npm test` xanh, có nhóm T. `node kiem_tra_truoc_khi_giao.js --day-du` xanh.
- Sau khi chủ quán cài:
  - `/permissions` hiện đủ deny, không còn ask;
  - phá thử sống 4 ca (push `origin viec/TU-CHAY-1`, sửa `.env`, sửa ngoài phạm vi, sửa phiếu): việc KHÔNG xảy ra; nếu máy đã gọi công cụ thì nhật ký có dòng CHAN.

## Phạm vi
- tu_chay/PHIEN_BAN
- tu_chay/THIET_KE.md
- tu_chay/cau_hinh.json
- tu_chay/nguoi_gac.js
- tu_chay/thu_nguoi_gac.js
- tu_chay/cai_dat.sh
- tu_chay/cai_dat.js
- .gitignore
- kiem_tra_truoc_khi_giao.js
- viec/TU-CHAY-1/**

## Ngân sách
Khoảng 750 dòng code:
- nguoi_gac.js ~550;
- cai_dat.js ~180 + cai_dat.sh ~15;
- kiem_tra +~35.

Khoảng 650 dòng thử (thu_nguoi_gac.js).

Tài liệu: THIET_KE.md = bản v1.1 + B13 (~90 dòng).

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `.claude/settings.json`.
- Không chạy `cai_dat.sh` trên kho thật.
- Không push (trừ tới remote bare tạm trong bài thử), không merge, không đụng `main`.
- Không chạy `patch_*.py`.
- Không sửa sổ việc, không thêm mục TU-CHAY-1.
