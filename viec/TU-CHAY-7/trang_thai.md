# TU-CHAY-7 — trạng thái

## Bước 1 — đối chiếu bản chụp (16.10.2026)
- nhánh: viec/TU-CHAY-7 · cây sạch trước khi ghi
- HEAD 6cb52fa · FETCH_HEAD 6cb52fa → bằng nhau, không kéo
- git log --oneline -3:
  - 6cb52fa PHIEU: TU-CHAY-7
  - 8194c9c TIEN-DO: AUDIT-4 (ddc42d2), P20c (d47b81c) xong; AU4-16 = A; mo LUOI-4 + MA-GIAM-1 + TU-CHAY-7; them LUOI-5, AUDIT-5 — so v35
  - ddc42d2 Merge pull request #28 from pos-tuquyduong/viec/AUDIT-4

## Bước 3 — kế hoạch
- `ke_hoach.md` viết xong; phiếu dặn "Chờ duyệt kế hoạch" → commit, push, DỪNG chờ chủ quán duyệt.

## Số đo (máy mây 4 lõi, chạy riêng, gốc 6cb52fa)
- `node tu_chay/thu_cong.js`: 89,5 s (334 phép, xanh) = 75 % hạn 120 s.
- `node cong_cu/thu_TOCDO1.js`: 1,7 s (42 đạt) — không bộ kiểm nào gọi bài này qua `chayBaiThat` (grep `kiem_tra_truoc_khi_giao.js`: chỉ
  nhắc trong chú thích :529, :602) → vế "cũng cho thu_TOCDO1.js nếu > 30 s" của A1 không áp dụng.
- A3: mẫu `\(:\d+\)|:\d+[–-]\d+` trong chú thích của 79 file phạm vi → 4 chỗ (`server/routes/orders.js:1633`, `cong_cu/thu_P26c.js` ×3).

## Câu hỏi
(chưa có)

## Phát hiện
- thu_cong.js 89,5 s chạy riêng = 75 % hạn; thêm ca tự thử A2 (~2 s) → ~77 %. Máy bận nhẹ là vượt 80 % → cảnh báo A1 sẽ hiện thường xuyên.
  Chia lượt thu_cong (TU-CHAY-6 Q5) nên vào việc sau — KHÔNG làm trong việc này (phiếu: Ngân sách).
