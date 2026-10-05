# AUDIT-1 — Nhóm F · Tài liệu

HEAD b9759cf, đọc 04.10.2026. Mỗi khẳng định CƠ CHẾ (chặn/cấm/bắt buộc/tự kiểm/cổng bắt) → dẫn phép kiểm hoặc CHƯA KIỂM.
SAI cơ chế (thử thật thấy không đúng) = NẶNG.

## F1 — khẳng định cơ chế → phép kiểm

| tài liệu : dòng | khẳng định | phép kiểm / trạng thái |
|---|---|---|
| CLAUDE.md:16 | "thật ra 34 chỗ fetch" | C1 (NGUONG_FETCH=34) — ĐÚNG (C1 đếm 34 ở HEAD) |
| CLAUDE.md §5.1 | "Server TỰ TRA GIÁ" | E1 `orders.js tự tra giá` + `KHÔNG item.unit_price` — ĐÚNG (D1-E1 bắt) |
| CLAUDE.md §5.2 | "lỗi máy in KHÔNG rollback đơn" | CHƯA KIỂM (không phép tự động; đọc code: đơn tạo trước, in sau) |
| CLAUDE.md:113 §8 | "chiết khấu, lấy từ gói, mã gói — bộ kiểm nhóm E canh" | **AU-F1**: E2 chỉ canh `from_package`; `discount_type/value` KHÔNG có phép (ghi chú E6 của `kiem_tra:373` tự nhận) — câu nói quá |
| CLAUDE.md:115 §8 | "pay-debt chặn thu hai lần (409 DA_THU_ROI) — bộ kiểm canh" | E7 + giả lập KB10 (M1) — ĐÚNG (D1-E7, thu_gia_lap M1 bắt) |
| CLAUDE.md §8 | "POST /orders ĐÃ CÓ cổng phân quyền; P3 'chưa vá' là đã cũ" | E2 pass ở HEAD (marker POS-AUTHZ-v1 + không còn `item.from_package ? 0`) — ĐÚNG |
| CLAUDE.md §5.5 | "KHÔNG bỏ client/dist/ khỏi git" | F1b `.gitignore KHÔNG chặn client/dist` — ĐÚNG |
| CLAUDE.md §5.7 | "chỉ ketNoiKho.js đọc biến kết nối" | K1 — ĐÚNG (D1-K1 bắt) |
| CLAUDE.md §8 | "Render ngủ khi idle → không cron" | CHƯA KIỂM (hạ tầng Render, không soi được từ kho) |
| THIET_KE.md:204 | "lenh_gia_lap cổng KHÔNG đọc (`cong.js:234`)" | ĐÚNG (B2: không code đọc; cong.js chỉ chạy lenh_bai_thu+lenh_kiem_day_du) |
| THIET_KE.md:748-753 | "pull_request_target; checkout v7 chặn fork" | B (kiemYml) + A15 chạy thật — ĐÚNG |
| THIET_KE.md:808 | "A8 chặn mọi sửa tay .claude/ không qua cai_dat.sh" | B1 (thu_cong A8 tĩnh/chạy) — ĐÚNG |
| THIET_KE.md:429 | "bản mẫu 119 phép cho luồng bấm" | CHƯA KIỂM (không chạy `ban_mau_pos/chay_thu.sh`; cổng KHÔNG thấy bộ này — AU-B3b) |
| KHUON_LOI.md | "120/120 khuôn lỗi" | thu_cong_cu/thu_nguoi_gac đọc `khuon_loi_toi_da`=120 — số dòng khuôn chưa đo riêng (CHƯA KIỂM) |

**Không có khẳng định cơ chế SAI (thử thật thấy ngược).** AU-F1 là câu NÓI QUÁ (over-claim), không phải sai hẳn: nhóm E
CÓ canh một phần (from_package), chỉ không canh discount — NHẸ.

## F1b — đếm cũ trong tài liệu (ngày tháng → không phải lời nói dối cơ chế, nhưng lệch)
- **AU-F2:** CLAUDE.md:26 "kiem_tra… 36 phép lúc 24.09.2026" — HEAD nay **61 phép** (nhanh). Có ghi ngày nên là ảnh cũ,
  nhưng dễ gây hiểu nhầm quy mô. NHẸ. Đề xuất HOC-2: bỏ số, ghi "script tự đếm ở cuối".

## F2 — lời dặn đã có phép kiểm làm thay → đề xuất xoá (đầu vào rút gọn)

| lời dặn (tài liệu) | phép kiểm làm thay | đề xuất |
|---|---|---|
| CLAUDE.md §6 "không thêm fetch trần ngoài api.js" | C1 bánh cóc (NGUONG_FETCH) + người gác không liên quan | giữ 1 câu ngắn, bỏ giải thích dài (máy đã chặn) |
| CLAUDE.md §6 "không git add -A / add ." | người gác GIT-ADD (A3/A4 bắt) | có thể rút còn tham chiếu |
| CLAUDE.md §6 "không commit --no-verify" | người gác GIT-COMMIT-CO | rút |
| CLAUDE.md §6 "không fetch trần ngoài api.js — bánh cóc chặn commit" | trùng C1 | gộp |
| CLAUDE.md §6 "không dùng str_replace chuỗi tiếng Việt" | KHÔNG có phép máy | GIỮ (chỉ lời dặn giữ được) |
| CLAUDE.md §5.1 "server tự tra giá" | E1 | giữ ngắn (quan trọng, nhắc người) |

**Lưu ý K8:** các phép kiểm trên do chủ quán viết sau khi bị lừa nhiều lần — đề xuất xoá LỜI DẶN (không xoá phép kiểm).
Mọi đề xuất ở đây NGOÀI phạm vi (sửa CLAUDE.md/KHUON_LOI.md) → chat soát duyệt, gom vào HOC-2, AUDIT-1 KHÔNG tự sửa.
