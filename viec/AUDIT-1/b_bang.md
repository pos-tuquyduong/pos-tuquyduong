# AUDIT-1 — Nhóm B · Cổng PR (`tu_chay/cong.js`, `tu_chay/cong_github.yml`)

HEAD b9759cf, đo 04.10.2026.

## B1 — mọi mã A* của cổng

`cong.js` có 9 mã `doLy`: **A6, A7, A8, A9, A10, A11, A12, A13, A14** (đếm từ code; A3/A4/A5 KHÔNG phải mã cổng — chúng
là mục A3–A5 của `THIET_KE.md`, dễ lẫn). A15 nằm ở `cong_github.yml` (bước chặn PR fork).

- **Ca đỏ + tắt (`tat`):** `thu_cong.js` có vòng đột biến tắt từng mã A6–A14 (`tu_chay/thu_cong.js:335-347`, 19 ca `DB`)
  → mỗi mã có ca "phải ĐỎ" và khi tắt phải thành ĐẠT. A15 kiểm bằng `kiemYml` + **chạy thật** bước chặn fork (PR từ
  fork → thoát ≠ 0; cùng kho → qua). Chạy `node tu_chay/thu_cong.js` trên HEAD → xanh.
- **VÁ SAI** (`python3 viec/AUDIT-1/dot_bien.py B1`, bản sao `cong.js`, chạy `thu_cong.js`): **7 BẮT · 1 SỐNG**.
  BẮT: A6 (bỏ xét phạm vi), A7 (nới tiêu đề PHIEU), A10 (bỏ file cấm), A11 cả hai chiều (đảo "đỏ trên gốc" + bỏ "xanh
  trên PR"), A12 (bỏ), laBaiThu (nới `thu_*.js` cho khớp đường có `/`).
  - **SỐNG → AU-B1 (NHẸ):** `B1-A14-bo-dang-nhanh` xoá cổng A14 kiểm DẠNG nhánh (`if (!m) {…return}`) → `thu_cong` vẫn
    xanh vì cổng A14 THỨ HAI (`if (!phamVi)`) bắt lại nhánh sai. Hai cổng A14 chồng nhau nên `thu_cong` không phân biệt
    được cổng dạng-nhánh (giống P26b: cổng đơn che cổng yêu cầu). Không phải lỗ an toàn (nhánh sai vẫn bị chặn). Đề xuất
    HOC-2: thêm ca `thu_cong` nhắm riêng cổng dạng-nhánh (phiếu CÓ ở `viec/<MÃ xấu>` nhưng nhánh không dạng `viec/<MÃ>`).

## B2 — mỗi khoá `cau_hinh.json`: code nào đọc (20 khoá)

| khoá | code đọc (file) |
|---|---|
| lenh_bai_thu, lenh_kiem_day_du, thu_muc_bai_thu | `tu_chay/cong.js` |
| file_cam | `cong.js`, `nguoi_gac.js`, `thu_nguoi_gac.js` |
| file_luat, tep_bash_them | `nguoi_gac.js`, `thu_nguoi_gac.js` |
| file_bi_mat, chuong_trinh_them | `nguoi_gac.js` |
| ten_mien_production | `cong_cu/gia_lap/chay.js` |
| khuon_loi_toi_da | `thu_cong_cu.js`, `thu_nguoi_gac.js` |
| muc_gac, ban_cai | `cong.js`, `thu_cong.js`, `thu_nguoi_gac.js` (ban_cai: + `kiem_tra_truoc_khi_giao.js`) |
| **app, nhanh_chinh, so_viec, cong_cu_so_viec** | — KHÔNG code nào đọc (nhãn / mô tả cấu hình; `so_viec`/`cong_cu_so_viec` chỉ tới mục việc) |
| **so_vong_sua_toi_da, vuot_ngan_sach_canh_bao** | — không code; đọc trong `skill_lam_viec.md` / `THIET_KE.md` (hướng dẫn cho người/skill) |
| **lenh_gia_lap** | — không code; `THIET_KE.md:204` ghi RÕ "cổng KHÔNG đọc nó" (chủ ý) |
| **kiem_sau_day_len** | — không code; chuỗi mô tả cho người đọc log Render |

→ **AU-B2 (NHẸ):** 8 khoá không code nào đọc. Không khoá nào là bẫy (không code nào dựa vào khoá nó không đọc). Đáng lưu
ý nhất là `lenh_gia_lap` (rỗng, cổng không đọc — ghi giả lập vào đây thì KHÔNG BAO GIỜ chạy ở cổng; đã có cảnh báo ở
`THIET_KE.md`). Đề xuất HOC-2: hoặc bỏ các khoá-nhãn, hoặc thêm một dòng ghi chú trong `cau_hinh.json` phân biệt
khoá-code với khoá-tài-liệu.

## B3 — `thu_*.js` vs `laBaiThu` (cổng coi là bài thử)

`laBaiThu(p)` = basename khớp `thu_*.js` VÀ (dirname = `tu_chay` HOẶC bắt đầu bằng `cong_cu/`).

| file | laBaiThu | ghi chú |
|---|---|---|
| `tu_chay/thu_{cong,cong_cu,nguoi_gac}.js` | ✓ | bài thử tự chạy thật |
| `cong_cu/thu_{P20,P21,P26a,P26b,gia_lap}.js` | ✓ | bài chạy thật, bộ kiểm nhóm E/S gọi |
| `cong_cu/thu_p1.js` | ✓ | **xem AU-B3** — KHÔNG phải bài thử an toàn |
| `.claude/tu_chay/thu_*.js` | ✗ (dirname `.claude/tu_chay`) | bản đã cài; cổng không chấm bản cài |
| `ban_mau_pos/thu/thu_*.js` (6 file) | ✗ | **xem AU-B3b** — bộ thử bản mẫu (119 phép) cổng không thấy |
| `viec/P26b/thu_kho_ban.js` | ✗ (dirname `viec/P26b`) | phụ trợ cho `viec/P26b/dot_bien.py`, đúng là không phải bài thử cổng |

- **AU-B3 (NHẸ, xếp mức bằng ĐỌC CODE — KHÔNG chạy `thu_p1.js`):** `cong_cu/thu_p1.js` khớp `laBaiThu` nhưng dòng 21
  `require('dotenv').config()` + dòng ~32 `cauHinhTurso()` (`server/ketNoiKho.js`) → nối vào KHO do `ketNoiKho` quyết
  định. Xếp mức theo 3 môi trường:
  - **Replit** (`REPL_ID`): `laMayThu()` → `file:data/pos_thu.db` = KHO THỬ → an toàn (ghi chú đầu file nói vậy, và P8).
  - **GitHub Actions** (`cong_github.yml`): `permissions: contents: read`, KHÔNG `secrets.`, không cấp `TURSO_*`
    (xác nhận: `grep secrets. cong_github.yml` rỗng) → không Replit, thiếu `TURSO_DATABASE_URL` → `cauHinhTurso()` ném
    "thiếu TURSO_DATABASE_URL" → thu_p1.js KHÔNG chạy được ở cổng. Và cổng KHÔNG gọi thu_p1.js (A11/A13 gọi bài khác).
  - **máy mây (claude.ai/code)**: không `REPL_ID`. Nếu môi trường CÓ `TURSO_DATABASE_URL` thì `node cong_cu/thu_p1.js chen`
    sẽ ghi 2 dòng sổ nợ giả `ZZTHU-` vào **kho thật**. Người gác KHÔNG chặn `node cong_cu/thu_p1.js` (không phải
    cai_dat, không nhắc file bảo vệ). **Ở quầy sẽ sai gì:** nếu chạy tay trên máy trỏ Turso production, 2 dòng sổ nợ giả
    xuất hiện ở sổ nợ khách thật cho tới khi `node thu_p1.js don`.
  - Mức: NHẸ (cần hai điều kiện hiếm cùng lúc: chạy tay + máy trỏ production; bộ kiểm không tự chạy nó). Đề xuất HOC-2:
    đổi tên `thu_p1.js` → `cong_cu/congcu_p1.js` (thoát `laBaiThu`) hoặc cho nó tự từ chối khi KHÔNG `laMayThu()`.
- **AU-B3b (NHẸ):** `ban_mau_pos/thu/thu_*.js` (bộ thử bản mẫu, 119 phép qua `ban_mau_pos/chay_thu.sh`) KHÔNG nằm trong
  `thu_muc_bai_thu` nên cổng không coi là bài thử. PR sửa `ban_mau_pos/*.html` (là "code" theo `laCode`) sẽ bị A12 đòi
  một `thu_*.js` trong `cong_cu/` hoặc `tu_chay/` — bộ thử riêng của bản mẫu không thoả A12. Đề xuất HOC-2: thêm
  `ban_mau_pos/thu/` vào `thu_muc_bai_thu`, hoặc cho `chay_thu.sh` vào `tep_bash_them` + A12 nhận nó.

File luật nào thiếu trong `file_luat`: `file_luat` = `[kiem_tra…, CHECKLIST_CODE.md, ban_mau_pos/**, tu_chay/**,
package.json, cong_cu/gia_lap/**, cong_cu/thu_gia_lap.js]`. `cong_cu/thu_P20/P21/P26a/P26b.js` (bài chạy thật mà bộ kiểm
nhóm E dựa vào) KHÔNG trong `file_luat` → sửa chúng không cần ghi đúng tên trong Phạm vi. Xếp NHẸ (xem AU-B3c ở báo cáo).

## B4 — cổng tĩnh của main chạy trên chính nhánh này

(chạy sau khi có báo cáo — xem cuối `bao_cao.md` / `bang_chung_do.txt`)
