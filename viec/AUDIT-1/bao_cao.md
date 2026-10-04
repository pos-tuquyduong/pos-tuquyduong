# AUDIT-1 — Báo cáo soát lưới an toàn

HEAD `b9759cf` (+ sản phẩm AUDIT-1), đo 04.10.2026. Việc CHỈ ĐỌC + ĐO; không đổi byte nào ngoài `viec/AUDIT-1/`.
Chi tiết từng nhóm: `a_bang_luat.md` (A), `b_bang.md` (B), `c_bang.md` (C), `d_bang.md` (D), `e_bang.md` (E),
`f_tai_lieu.md` (F). Bằng chứng chạy: `bang_chung_do.txt`. Công cụ đo: `dot_bien.py`, `lach.js`.

## Kết luận một dòng
**Đường tiền LÕI (tạo/huỷ/xoá đơn · hoàn · ví · điểm · kho · mã) vững: KHÔNG đột biến nào SỐNG ở đường tiền.** Mọi phát
hiện đều **NHẸ** — lỗ hổng coverage của LƯỚI (đột biến cũ HỎNG, phép chỉ cảnh báo, tài liệu lệch), không phải lỗ cho
tiền sai ở quầy.

## Bảng phát hiện

| mã | nhóm | mức | ở HEAD (file:dòng) | lệnh thấy lại | đề xuất khoá cho HOC-2 |
|---|---|---|---|---|---|
| AU-A1 | A | NHẸ | `nguoi_gac.js` CONG_CU_DOC `:105-107` | `python3 … dot_bien.py A3-CCLA-them-la` → SỐNG | thêm phép `thu_nguoi_gac` so `CONG_CU_DOC`/`CONG_CU_SUA` với tập cố định (ca đỏ: thêm 1 tên) |
| AU-B1 | B | NHẸ | `cong.js` hai cổng A14 `:82,88` | `python3 … dot_bien.py B1-A14-bo-dang-nhanh` → SỐNG | ca `thu_cong`: phiếu ở `viec/<MÃ xấu>` + nhánh không dạng `viec/<MÃ>` → ĐỎ riêng cổng dạng-nhánh |
| AU-B2 | B | NHẸ | `cau_hinh.json` 8 khoá nhãn | `python3 scratchpad/b2.py` | bỏ khoá-nhãn hoặc ghi chú phân biệt khoá-code/tài-liệu |
| AU-B3 | B | NHẸ | `cong_cu/thu_p1.js:21,32` | đọc code (KHÔNG chạy) | đổi tên `thu_p1.js`→`congcu_p1.js` (thoát `laBaiThu`) hoặc tự từ chối khi `!laMayThu()` |
| AU-B3b | B | NHẸ | `cau_hinh.json` thu_muc_bai_thu | đọc `laBaiThu` + git ls-files | thêm `ban_mau_pos/thu/` vào `thu_muc_bai_thu` (A12 nhận bộ thử bản mẫu) |
| AU-B3c | B | NHẸ | `cau_hinh.json` file_luat | đọc file_luat | thêm `cong_cu/thu_P20/P21/P26a/P26b.js` vào `file_luat` (sửa phải ghi đúng tên) |
| AU-C1 | C | NHẸ | `bat_bien.js` I10⊂I11 `:146-156` | `python3 viec/P26b/dot_bien.py I10-bo` → HỎNG | bỏ I10 (I11 bao trùm) hoặc neo `I10-bo` theo WHERE riêng |
| AU-C3 | C | NHẸ | `kiem_tra…js:746` ghi 22/24s | `python3 scratchpad/c3.py` → 68/70s | cập nhật ghi chú; cân nhắc nâng ngưỡng 110/120s hoặc giảm KB ở pre-commit |
| AU-D1 | D | NHẸ | `kiem_tra…js:636` F2 canhBao | đọc code (F2 không có nhánh fail) | — (hygiene; người gác đã chặn tạo .js gốc ở đường việc) |
| AU-D2 | D | NHẸ | `kiem_tra…js:569,582,594,596` T2–T4 canhBao | đọc code | nâng T2–T4 thành `fail`, hoặc chủ quán xác nhận giữ cảnh báo (cổng A8 đã cứng chặn) |
| AU-E1 | E | NHẸ | `viec/P26b/dot_bien.py` I10-bo | `python3 viec/P26b/dot_bien.py` → 1 HỎNG | như AU-C1 |
| AU-E2 | E | NHẸ | `viec/HOC-1/dot_bien.py` MB,MB4 | `python3 viec/HOC-1/dot_bien.py` → 2 LỖI | neo đột biến theo `"package.json"` (không kèm `]`) |
| AU-E3 | E | NHẸ | `viec/TU-CHAY-4/dot_bien.py:32-63` tai_cho | đọc code | đổi `tai_cho` sang bản sao kho (không đụng file thật) |
| AU-F1 | F | NHẸ | `CLAUDE.md:113` | đọc + `kiem_tra…js:373` (E6) | sửa câu: nhóm E chỉ canh `from_package`, không canh `discount_*` |
| AU-F2 | F | NHẸ | `CLAUDE.md:26` "36 phép" | `node kiem_tra…js` → 61 | bỏ số đếm cứng trong tài liệu |

**Hai SỐNG — ở quầy sẽ sai gì?** Cả hai KHÔNG làm sai tiền ở quầy; là lỗ coverage của lưới:
- AU-A1: nếu ai sửa `nguoi_gac.js` thêm một tên công cụ vào tập chỉ-đọc, `thu_nguoi_gac` không bắt (cổng A8 bắt mọi sửa
  `nguoi_gac.js` lệch nguồn → không tới quầy được).
- AU-B1: nếu ai xoá cổng A14 dạng-nhánh, `thu_cong` vẫn xanh vì cổng A14 thứ hai (phiếu) chặn — PR nhánh sai vẫn bị
  chặn. Lỗ chỉ là test không phân biệt hai cổng chồng nhau.

## Tỷ lệ BẮT/SỐNG/HỎNG/LẠC/TREO (LẠC+TREO KHÔNG cộng vào BẮT)

Đột biến AUDIT-1 (`dot_bien.py`), chạy `python3 viec/AUDIT-1/dot_bien.py G3 A3 B1 C2 D1` (G3 là bộ tự-chứng-minh, LẠC/
HỎNG/SỐNG của G3 là CỐ Ý):

| nhóm | BẮT | SỐNG | HỎNG | LẠC | TREO | tỷ lệ BẮT = BẮT/(tổng−HỎNG) |
|---|---|---|---|---|---|---|
| G3 (demo) | 1 | 1 | 1 | 1 | 0 | — (cố ý mỗi loại 1) |
| A3 người gác | 15 | 1 | 0 | 0 | 0 | 15/16 |
| B1 cổng | 7 | 1 | 0 | 0 | 0 | 7/8 |
| C2 đường tiền (thêm) | 2 | 0 | 0 | 0 | 0 | 2/2 |
| D1 bộ kiểm | 10 | 0 | 0 | 0 | 0 | 10/10 |

A4 lách (`lach.js`): **52/52 CHẶN · 0 LỌT** (không phải đột biến — là lệnh lách đưa vào `xet()`).

Đột biến CŨ chạy lại (E1), LẠC/TREO không có:

| bộ | BẮT | HỎNG | ghi |
|---|---|---|---|
| P26b (`viec/P26b/dot_bien.py`) | 59 | 1 | HỎNG = `I10-bo` (AU-E1) |
| HOC-1 (`viec/HOC-1/dot_bien.py`) | 15 | 2 | HỎNG = `MB`, `MB4` (AU-E2); M0×3 đối chứng XANH |
| TU-CHAY-4 gl (`… M0 E4`) | 7 | 0 | M0 đối chứng XANH; `tai_cho` (F2/S3) KHÔNG chạy (AU-E3) |

**Tổng: không SỐNG nào ở đường tiền; 2 SỐNG ở lưới (A/B) đều NHẹ; 3 đột biến cũ HỎNG trên HEAD (I10-bo, MB, MB4).**

## B4 — cổng tĩnh của main chạy trên chính nhánh này
`node tu_chay/cong.js tinh . b94110e 62b90ce viec/AUDIT-1` → **✓ CỔNG TĨNH ĐẠT** (mọi file đổi nằm trong Phạm vi
`viec/AUDIT-1/**`, không đụng code chạy thật nên A11/A12 không áp).

## K5 — luồng hợp lệ KHÔNG bị ảnh hưởng
`dot_bien.py` chỉ đụng bản sao trong thư mục tạm; cuối mỗi lần chạy in "✓ kho thật không đổi" (so `git status` ngoài
`viec/AUDIT-1/`, nhật ký người gác, `data/`, `client/node_modules/.vite`); ngắt giữa chừng (SIGINT) → giết nhóm tiến
trình con + xoá thư mục tạm (thử: `timeout -s INT 30 … G3-vo-hai` → 0 sót). `lach.js` chỉ truyền CHUỖI vào `xet()`,
không thực thi lệnh lách nào.
