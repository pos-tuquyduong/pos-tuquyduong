# P3 — trạng thái

## Bước 1 — đối chiếu bản chụp (24.10.2026)
- Nhánh: `viec/P3` · `git status --short` sạch (không dòng nào).
- `git fetch origin viec/P3` → HEAD `98f30df` · FETCH_HEAD `98f30df` (bằng nhau, không kéo).
- `git log --oneline -3`:
  ```
  98f30df PHIEU: P3
  99f5894 TIEN-DO: P22-23 (c4fabcd), KH-QUAY-1 (168b481), P15-QR (423624b), KH-UI-1 (bd9b920) xong; DAC_TA_BAN_HANG_2410 + demo; mo QUAY-AN-1 + P24 + P3; them DIEM-THAT-1, UUDAI-1, TOPPING-1, BH-1, HD-1, KH-MUA-1, KH-UI-2; P13a-e + P14 gop; DON-DEP-v1 -> DONDEP-v1; lich — so v39
  bd9b920 Merge pull request #41 from pos-tuquyduong/viec/KH-UI-1
  ```

## Bước 2–3 — đọc + kế hoạch
- Đã đọc: phiếu, CLAUDE.md, KHUON_LOI.md, CHECKLIST B4–B7, P3, P4, G, H; `DAC_TA_BAN_HANG_2410.md` mục 1–2;
  code `orders.js` POST / (167–1240), `wallets.js` (ghiVi 60–80, deduct/adjust 159–230), `loyalty.js` /redeem (80–170),
  `diemKhach.js`, `customers.js` (mọi chỗ trả `SELECT *`), `customers-v2.js` (getLocalCachedCustomers), `kh/index.js`, `kh/loi.js`,
  `index.js` (mount 64–121), `database.js` (pos_customers 78–100, quyền 982–1040), `backup.js` BACKUP_TABLES, `doiSoat.js`,
  `kiem_tra_truoc_khi_giao.js` (E8 388–398, mảng bài chạy thật 495), `env.example`, giả lập `kich_ban.js` (KB2, /loyalty/redeem).
- payOS: `payos.vn` KHÔNG phân giải được từ máy mây (WebFetch ENOTFOUND; curl bị người gác chặn — CURL-HOST, đúng luật).
  Đã đối chiếu mã nguồn SDK CHÍNH THỨC `github.com/payOSHQ/payos-lib-node` (nhánh main) — chi tiết ở `ke_hoach.md` mục 2.
- Kế hoạch: `viec/P3/ke_hoach.md`. Phiếu dặn **chờ duyệt kế hoạch** → commit, push, DỪNG ở bước 3.

## Câu hỏi
Xem `ke_hoach.md` mục 0 (Q1–Q7) — cần chủ quán trả lời trước khi viết bài thử / code.
