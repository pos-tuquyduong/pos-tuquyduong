# TOC-DO-1 — Commit trên Replit không còn trượt ngẫu nhiên vì bài thử cổng chạy chậm

<!-- Phiếu do chat soạn 13.10.2026. Nền: main sau sổ việc v29 (cha c591b9e).
     Sự cố: hook pre-commit chạy `npm test` = `node kiem_tra_truoc_khi_giao.js`, trong đó `chayBaiThat('tu_chay/thu_cong.js')`
     (kiem_tra_truoc_khi_giao.js:553, hạn 120 s, hàm chayBaiThat ~dòng 479). Trên Replit chủ quán, commit sổ / phiếu (KHÔNG đụng
     tu_chay/) trượt ngẫu nhiên 3 lần ngày 12–13.10 với "FAIL 1": thu_cong.js đỏ (dòng ✗ ghép từ đầu ra, có "Received null").
     Chạy lại thì qua. Máy chat (1 lõi) đo thu_cong.js 49–51 s, 318 phép · 0 hỏng; máy mây AUDIT-2 đo 119–126 s (AU2-10).
     thu_cong.js chỉ kiểm bộ khung cổng (tu_chay/cong.js + workflow) — đổi sổ, phiếu, server/, client/ không làm nó đổi kết quả. -->

**Chờ duyệt kế hoạch:** viết `viec/TOC-DO-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Commit thường (sổ, phiếu, code quầy) trên Replit không còn đỏ ngẫu nhiên vì thu_cong.js; bài thử bộ khung vẫn chạy ĐỦ mỗi khi
bộ khung có thể bị đổi. Không nới hạn. Song song GOI-2 (không chung file).

## Nghiệm thu
- A1 Tìm nguyên nhân thật trước (ghi `trang_thai.md`): thu_cong.js đỏ ở ca nào khi máy chậm / bận (dựng tải CPU song song trên bản
  sao), vì sao có "Received null"; ca đó phụ thuộc thời gian kiểu gì. Có cách sửa gốc gọn (ca không còn phụ thuộc tốc độ máy, KHÔNG
  nới hạn) thì làm; không thì ghi lý do.
- A2 Bộ kiểm chạy thu_cong.js KHI VÀ CHỈ KHI có thể cần: `--day-du`; hoặc có file đổi trong `tu_chay/`, `.claude/`, `.github/` (so
  với gốc chung với `origin/main`, gồm cả vùng chờ commit và cây làm việc); hoặc không xác định được (không có git / không có
  `origin/main`) → CHẠY (mặc định an toàn). Bỏ qua thì in rõ một dòng "bỏ qua thu_cong.js — không đổi tu_chay/.claude/.github"
  (không đếm là PASS giả).
- A3 Ca thử cho phép chọn ở A2 (đỏ trên gốc vì gốc luôn chạy): không đổi gì → bỏ qua; đổi một file `tu_chay/` (cả chỉ trong vùng
  chờ) → chạy; `--day-du` → chạy; không có `origin/main` → chạy. Đột biến `viec/TOC-DO-1/dot_bien.py`: luôn bỏ qua / quên vùng chờ /
  quên `.github/` → đều BẮT.
- A4 Cổng GitHub (cong-chay chạy `npm test`) vẫn chạy thu_cong.js với PR đổi `tu_chay/` — ghi bằng chứng (đọc `tu_chay/cong.js` +
  `cong_github.yml`, không sửa chúng).
- A5 `npm test`, `--day-du` xanh, 0 CẢNH BÁO; đo `npm test` trước / sau (chạy RIÊNG) ghi vào `trang_thai.md`.

## Phạm vi
- viec/TOC-DO-1/**
- kiem_tra_truoc_khi_giao.js
- cong_cu/thu_TOCDO1.js

## Ngân sách
~30–60 dòng code + ~80 dòng thử.
**Phương án đơn giản nhất đã xét:** chỉ đổi điều kiện gọi `chayBaiThat('tu_chay/thu_cong.js')` trong bộ kiểm; không sửa
`tu_chay/` (sửa thì phải cài lại bộ khung). Sửa gốc ca chậm chỉ khi gọn và chứng minh được.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `tu_chay/`, `.claude/`, `.github/` (máy không sửa bộ khung trong việc này; nếu A1 chỉ ra phải sửa `tu_chay/thu_cong.js`
  → ghi `## Câu hỏi`, chủ quán mở việc cài). Không nới hạn 120 s, không bỏ hẳn thu_cong.js.
- Không sửa `server/`, `client/`, `cong_cu/thu_GOI1.js` (GOI-2 sửa song song). Không sửa sổ việc.
- Chỉ push đúng `git push -u origin viec/TOC-DO-1`. Không đụng `main`, không merge, không tạo PR.
