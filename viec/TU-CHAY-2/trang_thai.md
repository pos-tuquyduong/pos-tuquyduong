# TU-CHAY-2 — trạng thái
Kiểm sống 2a: máy mây push nhánh việc.

## 30.09 — kế hoạch bản 3 (máy mây)
- Commit trên cùng lúc bắt đầu: `2989d48 PHIEU: TU-CHAY-2 (ban 3, chot 6 cau hoi)` — đúng.
- Đã viết `ke_hoach.md`: so A/B cho 8 phần, danh sách ca thử ánh xạ 1-1 với Nghiệm thu A–I.
- **CHƯA sửa code.** Đang DỪNG chờ chủ quán duyệt kế hoạch (2 điểm cần gật đầu ở cuối ke_hoach.md).

## 30.09 — chủ quán duyệt kế hoạch 0956768 (+ 4 yêu cầu a–d)
- Bước 1 XONG: ca B, D2/D2b, I3 vào `tu_chay/thu_nguoi_gac.js`; viết `tu_chay/thu_cong_cu.js` (F, E, H; mỗi ca tự đặt/xoá
  CLAUDE_CODE_REMOTE, CLAUDECODE). Chạy trên bản CHƯA vá → cả hai ĐỎ (`bang_chung_do.txt`: 53 + 23 chỗ hỏng).
  `npm test` ĐỎ ở T1 tới hết bước 2–4 — chủ ý (bài thử đi trước mã).
- Bước 2 XONG: `nguoi_gac.js` thêm `xetHoanTac` + mã `GIT-HOANTAC`, `G-HOANTAC`. `thu_nguoi_gac.js`: 728/728 ca đúng mã,
  đột biến hai mã mới đều đỏ khi tắt. Còn đỏ 5 phép của bước 3 (trình cài) và bước 6 (PHIEN_BAN).
- Bước 3 XONG: `cai_dat.js` (skill + SessionStart), `cai_thu_vien.sh`, `skill_lam_viec.md` (bước đầu: git log --oneline -3,
  ghi trang_thai, in trong câu trả lời đầu tiên), `MAU_PHIEU.md`. Bài cài đặt, E2–E5, H1–H3 xanh.
