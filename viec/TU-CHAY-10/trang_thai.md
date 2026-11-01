# TU-CHAY-10 — trạng thái

## Bước 1 — đối chiếu bản chụp (01.11.2026)
- Nhánh: `viec/TU-CHAY-10`; `git status --short` sạch.
- `git fetch origin viec/TU-CHAY-10` xong. HEAD = `abed525`, FETCH_HEAD = `abed525` → bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  abed525 PHIEU: TU-CHAY-10
  aed6128 TIEN-DO: SAOLUU-2 (c8284ad) xong; mo TU-CHAY-10 (soat bao mat tu dong, tu-chay 1.9.0); quyet dinh 31.10 (soat bao mat tu dong, khong cai Superpowers) — so v52
  c8284ad Merge pull request #61 from pos-tuquyduong/viec/SAOLUU-2
  ```
- Có commit `PHIEU: TU-CHAY-10` (`abed525`).

## Bước 3 — kế hoạch
- `viec/TU-CHAY-10/ke_hoach.md` đã viết. Phiếu dặn **Chờ duyệt kế hoạch** → commit, push, DỪNG.

## Sự cố trong phiên
- Người gác chặn `curl` tới raw.githubusercontent.com (`[CURL-HOST]`, đúng luật) và một lệnh `cd <scratchpad> ... ;` (`[B-CD-VITRI]`).
  Lấy bản gốc lời nhắc /security-review bằng agent web-fetch (WebFetch người gác cho qua): 192 dòng, giấy phép MIT "Copyright (c) 2025 Anthropic".

## Câu hỏi
1. **Thêm `tu_chay/thu_nguoi_gac.js` vào `## Phạm vi`** (bắt buộc để làm nghiệm thu F + H cùng lúc).
   `tu_chay/thu_nguoi_gac.js:800-802` khoá ĐÚNG danh sách `ban_cai` (so bằng ba mục skill / ra-soat / cong.yml). Nghiệm thu F thêm mục
   thứ tư `["lenh_soat_bao_mat.md", ".claude/commands/soat-bao-mat.md"]` → phép đó ĐỎ → nghiệm thu H (`thu_nguoi_gac.js` xanh) không đạt.
   LUAT_XAY_APP §6.7 cho sửa đúng dòng danh sách trắng mà không hỏi, nhưng `thu_nguoi_gac.js` là file luật (`tu_chay/**`) nên người gác
   (G-LUAT) chặn ghi và cổng báo `✗ [A6] file luật ... phải ghi ĐÚNG TÊN trong Phạm vi` — không làm được nếu phiếu không ghi tên.
   **Đề xuất:** chủ quán thêm một dòng `- tu_chay/thu_nguoi_gac.js` vào `## Phạm vi` (commit `PHIEU: TU-CHAY-10`). Mình chỉ sửa đúng
   danh sách ở dòng 800-802 (vẫn so BẰNG, thêm mục thứ tư). Bản sửa ĐỎ trên gốc (cau_hinh gốc chỉ có 3 mục) → là bài đỏ hợp lệ, ghi
   `SỐ CA` như luật — KHÔNG cần thêm vào `## Bài thử cũ sửa`.
   **Cùng câu (tuỳ chủ quán):** thêm `- tu_chay/thu_cong_cu.js` để KHOÁ bằng phép chữ (khuôn `thu_cong_cu.js:372-379` đang canh
   `/ra-soat`): lệnh mới có dòng MIT + `SubagentHandback` + ngưỡng 8 + mục "Tiền lệ"; skill có bước `8b.` và dòng `SOÁT BẢO MẬT: ĐẠT`;
   mẫu phiếu có `## Soát bảo mật`. Không thêm thì các mục A/B/D chỉ có bằng chứng đọc tay (ghi CHƯA KIỂM). Đề xuất: thêm (khoá hơn lời dặn).
2. **Cho sửa thêm một câu ở bước 4 của skill** (`tu_chay/skill_lam_viec.md:70`): câu "`✗ [A19]` … và `✗ [A8]` … ở bước này là bình
   thường, không hỏi" cần thêm `✗ [A20]` (bước 4 chưa tới 8b nên việc có phiếu `có` LUÔN thấy `✗ [A20]`; không thêm thì máy dừng hỏi oan).
   File đã trong Phạm vi, nhưng nghiệm thu B ghi "không đổi các bước khác" nên mình hỏi. Đề xuất: cho thêm đúng chữ `✗ [A20]` vào câu đó.
