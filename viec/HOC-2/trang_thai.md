# HOC-2 — Trạng thái

## Bản chụp lúc mở việc (05.10.2026) — F1
`git branch --show-current` → `viec/HOC-2`. `git log --oneline -3`:
```
ba72a3f PHIEU: HOC-2
cb5d9fd TIEN-DO: HOC-2 chot 1b 2a 3a 4a, AU-G4 sang LUOI-1 — so v21
9d5327b TIEN-DO: AUDIT-1 xong (41fc639), them LUOI-1 + AUDIT-2, HOC-2 nhan phat hien NHE
```
Có commit `PHIEU: HOC-2`. Đã in ba dòng này trong câu trả lời đầu tiên để chủ quán đối chiếu GitHub.

## Bản chụp lúc làm tiếp (05.10.2026, `/lam-viec HOC-2 tiep`) — F1
`git branch --show-current` → `viec/HOC-2`. `git log --oneline -3` (đã in trong câu trả lời đầu tiên):
```
61d037a PHIEU: HOC-2 sua - tach phan bo khung (Q1-Q4 chu quan chot)
0e82586 HOC-2: ke hoach sua theo soat (8 diem) — cho duyet
7b0d413 HOC-2: ke hoach (cho duyet) + trang thai mo phien
```
Thấy commit PHIEU thứ hai (`61d037a`). Hook mở phiên kéo nhánh `ba72a3f → 61d037a`.

## Tiến độ
- Bước 1–3 xong (phiên trước); kế hoạch ĐÃ DUYỆT (phiếu sửa `61d037a`). Thêm mục "Phạm vi sau khi tách" → `97fe898`.
- Bước 4: ba bài thử mới chạy trên code CHƯA sửa → ĐỎ (`bang_chung_do.txt`: thu_cong 30 chỗ hỏng / 251, thu_nguoi_gac
  12 / 971, thu_cong_cu 8 / 85). Mọi ca CŨ vẫn đạt trên gốc.
- Bước 5: `b05f135` (A), `2529671` (B), `71bdd9b` (E3), `d5c24d2` (D1), `870ef78` (đột biến HOC-2). Ba bài xanh, số ca
  khớp bằng chứng (251 · 971 · 85).
- Không thấy thông báo đổi model trong phiên.

## Đột biến của HOC-2 (`viec/HOC-2/dot_bien.py`, chạy 05.10 trên `870ef78`) — bảng chỗ vá → đột biến
VS- = vá sai, BV- = bỏ vá. Kết quả: 3 đối chứng XANH · 21 BẮT · 0 SỐNG · 0 HỎNG.

| chỗ vá | đột biến | bài bắt (dòng ✗) | kết quả |
|---|---|---|---|
| đối chứng | `M0-cong`, `M0-gac`, `M0-cc` | — | XANH |
| `cong.js` A16 khối | `BV-A16-bo-khoi` | thu_cong "HOC-2 A16 thêm 1 ca" | BẮT |
| A16 điều kiện miễn | `VS-A16-mien-van-ap` | "HOC-2 A16 K5 phiếu miễn" | BẮT |
| A16 dòng tổng cuối | `VS-A16-dong-dau` | "lấy dòng tổng CUỐI" | BẮT |
| A16 bỏ mã màu | `VS-A16-bo-mau` | "kèm mã màu" | BẮT |
| A16 thiếu dòng | `VS-A16-bo-thieu-dong` | "thiếu dòng SỐ CA" | BẮT |
| A17 | `BV-A17-bo`, `VS-A17-bo-ranh-gioi` | "HOC-2 A17 tên đột biến M2" | BẮT ×2 |
| A18 | `BV-A18-bo` | "HOC-2 A18 đổi server/" | BẮT |
| A18 client/src | `VS-A18-chi-server` | "HOC-2 A18 đổi client/src/" | BẮT |
| A18 kể cả xoá | `VS-A18-bo-xoa` | "HOC-2 A18 xoá file server/" | BẮT |
| A18 miễn (Q4) | `VS-A18-mien-van-ap` | "HOC-2 A18 K5 (Q4)" | BẮT |
| `cau_hinh.json` khoá lạ (A2) | `VS-A2-them-khoa` | "HOC-2 A2" | BẮT |
| `file_luat` thu_P26b (A7) | `VS-A7-bo-P26b` | thu_nguoi_gac "thu_P26b" | BẮT |
| tập công cụ (B1) | `VS-B1-them-la` | "khoá tập CONG_CU_SUA" | BẮT |
| `ban_sao_goc.py` (B2) | `VS-B2-bo-kiem-kho`, `VS-B2-bo-kiem-tam`, `VS-B2-de-thu-muc`, `VS-B2-cay-lam-viec` | "đích trong kho", "ngoài thư mục tạm", "không rỗng", "đúng byte commit" | BẮT ×4 |
| `PHIEN_BAN` (E3) | `VS-E3-phien-ban-cu` | "PHIEN_BAN" | BẮT |
| skill / ra-soat (E3) | `VS-E3-skill-bo-VS`, `VS-E3-ra-soat-bo-dem` | "HOC-2 E3a", "HOC-2 E3 lenh_ra_soat" | BẮT ×2 |

## Số đo lúc lập kế hoạch
`node kiem_tra_truoc_khi_giao.js --day-du` (máy mây, 05.10.2026, HEAD ba72a3f): PASS 65 · FAIL 0 · CẢNH BÁO 0;
`cong_cu/gia_lap/chay.js` 68,0 s; `cong_cu/thu_gia_lap.js` 73,3 s; `tu_chay/thu_cong.js` 48,1 s (hạn chayBaiThat 120 s).

## Câu hỏi
Xem `ke_hoach.md` mục "Câu hỏi cho chủ quán" (Q1 chặn cổng của chính PR này nếu không sửa phiếu; Q2–Q4 chọn phương án).
