# HOC-2b — Trạng thái

## Bản chụp lúc mở việc (07.10.2026) — F1
`git branch --show-current` → `viec/HOC-2b`. `git log --oneline -3`:
```
4a51723 PHIEU: HOC-2b
9ad7f99 TIEN-DO: HOC-2 xong (b681ede), HOC-2b mo phieu — so v23
b681ede Merge pull request #10 from pos-tuquyduong/viec/HOC-2
```
Có commit `PHIEU: HOC-2b`, cha là commit sổ v23 (`9ad7f99`). Đã in ba dòng này trong câu trả lời đầu tiên để chủ quán
đối chiếu GitHub.

## Tiến độ
- Bước 1–3 (07.10): kế hoạch `12123c8`. **Chủ quán DUYỆT 07.10**: Q1 ngưỡng **80 %** hạn (96 s) — chat đo chạy riêng
  thu_gia_lap 80,4 s, giả lập 67,7 s; Q2 chọn **(b)** + thêm vào phần chạy thật: MỌI đột biến D1 của AUDIT-1 và mọi đối chứng
  M0-* của HOC-1, HOC-2; phần sang AUDIT-2 liệt kê đủ tên; P1 đo lại `thu_cong` CHẠY RIÊNG; số đo S4 cũng đo chạy riêng.
- Bước 4: bài thử viết trước, chạy trên code CHƯA vá → `thu_gia_lap` ĐỎ (C3a, dòng tổng 10 bất biến — `bang_chung_do.txt`);
  `thu_P26b` (Bài thử cũ sửa) xanh trên gốc như phiếu dự đoán, đỏ bằng đột biến.
- Bước 5: commit `3c7fb57` (bài thử C2/C3) · `652952e` (C1, C2, C3) · `b7c2cae` (C4) · `bc22862` (D2, D3) · `9245cdd` (E1, E2) ·
  `b8e5306` (đột biến HOC-2b + `kiem_neo.py`).
- **D4 KHÔNG làm được** — người gác chặn xoá file trong kho (xem `## Câu hỏi`).
- **Sự cố 08.10 (K5 bản sao — đã khắc phục, xem Bài học):** lần chạy đầu `viec/HOC-2b/dot_bien.py`, kiểu `glk` nối symlink
  `server/` vào bản sao; `thu_gia_lap` chép `server/` bằng `fs.cpSync` → chép cái liên kết, 13 đột biến M1–M13 ghi XUYÊN vào
  `server/routes/*.js` THẬT. Bắt được nhờ chính phép "KHO BẨN" của file đột biến (so `git status` trước/sau). Đã: `git restore`
  6 file (`git diff --quiet HEAD -- server/` sạch), sửa `glk` chép thật `server/`, soát kho SAU MỖI đột biến (dừng ngay khi bẩn),
  chạy lại TOÀN BỘ phần kiểm sau mốc đó. Không có commit nào chứa `server/` bẩn (commit đầu của việc sau sự cố; `git log -- server/`
  trên nhánh rỗng). Lệnh dừng tiến trình nền bị người gác chặn (`TaskStop` CC-LA, `pgrep` B-CHUONGTRINH) — các bước còn lại của
  lần chạy hỏng chỉ ĐỌC `server/` vào bản sao (không ghi gì thêm), kết quả bỏ đi, chạy lại.
- **Máy mây khởi động lại** giữa phiên (thông báo "container was restarted", 08.10 ~00:37) lúc đang chạy lần kiểm cuối đầu tiên
  (bước 6). Cây làm việc và thư mục nháp còn nguyên; chạy lại các bước kiểm sau mốc sự cố. Không thấy thông báo đổi model.
- Người gác chặn trong phiên (đọc lý do, không lách): `nproc`, `until`, `pgrep` (B-CHUONGTRINH); `ps -o args` (B-BIMAT-CHU);
  `git -C` (GIT-TUYCHON); `cd` giữa lệnh (B-CD-VITRI); `mcp__github__actions_list`, `TaskStop` (CC-LA); `python3 -m py_compile`
  (PY-M); `git rm` (GIT-LENH); `rm cong_cu/thu_p1.js` (RM-NHAP); `git restore server/` (GIT-HOANTAC → làm lại đúng dạng, từng file).

## Số đo thật — CHẠY RIÊNG (không chạy gì song song), máy mây 4 lõi
| bài | 07.10 trên gốc | 08.10 trên head (có ca C3) |
|---|---|---|
| `tu_chay/thu_cong.js` | 51,4 · 53,4 s | 49,5 · 52,1 s (trong `--day-du` 52,2 s) |
| `cong_cu/gia_lap/chay.js` | 69,4 · 67,6 s | 66,5 · 66,7 s |
| `cong_cu/thu_gia_lap.js` | 71,6 · 70,3 s (34 ca) | 71,8 · 71,8 s (39 ca — C3 chạy trong worker song song, gần như không thêm thời gian) |
Ngưỡng cảnh báo 80 % × 120 s = 96 s → dư 24 s (thu_gia_lap) ở máy mây; theo số chat đo (80,4 s) dư ~16 s.
Số 91,3 s của `thu_cong` (Phát hiện P1 cũ) là đo khi phiên đang chạy việc khác song song → SAI, đã sửa P1.

## Đột biến của HOC-2b (`viec/HOC-2b/dot_bien.py`, chạy 08.10 trên `b8e5306`) — bảng chỗ đổi → đột biến
Kết quả: **16 đạt · 0 không đạt** (5 đối chứng XANH, 11 ĐỎ đúng chỗ), kho thật không đổi sau từng đột biến. VS- = vá sai, BV- = bỏ vá.

| chỗ đổi | đột biến (tên nguyên văn) | bài bắt (dòng ✗) |
|---|---|---|
| đối chứng | `M0-p26b`, `M0-kb17`, `M0-glk`, `M0-kiem`, `M0-tc4` | XANH |
| C4 `refunds.js:165` phép phần mẹ `> 0` (thu_P26b M9) | `VS-q9-me-lon-hon-bang-0` | ✗ M9 … — 1 dòng hoàn mẹ |
| C4 hoàn mẹ khi duyệt (M6 `=== 1`, M10) | `BV-q9-bo-hoan-me` | ✗ M6 … 0 dòng hoàn mẹ · ✗ M10 … 0 dòng hoàn mẹ |
| C4 KB17-Q9 kiểm tạo đơn (200) | `KB17-khong-nap-me` | ✗ KB17 → HTTP: đơn ví con 5.000 + ví mẹ 20.000 tạo được (200): HTTP 400 · SO_DU_KHONG_DU |
| C2 I11 bắt thay I10 (bản vá sai của P26b) | `C2-I11-huy-kiem-ngoai-tx` | ✗ KB15 → I11: đơn #1020, ví 0900000001: hoàn 50.000đ > ví này đã trả 25.000đ |
| C2 (như trên) | `C2-I11-xoa-doc-don-ngoai-tx` | ✗ KB14 → I11: đơn #1019, ví 0900000003: hoàn 20.000đ > ví này đã trả 10.000đ |
| C3 cắt hàm (C3e) | `VS-C3-doi-ten-ham` | ✗ C3e … không thấy function chayBaiThat( |
| C3 khối cảnh báo | `BV-C3-bo-canh-bao` | ✗ C3a … 0 cảnh báo |
| C3 chỉ hai lời gọi bật | `VS-C3-bo-co` | ✗ C3d … 1 cảnh báo |
| C3 ngưỡng theo hạn, không số cứng | `VS-C3-nguong-giay-co-dinh` | ✗ C3a … 0 cảnh báo |
| C5 `thu_P20` còn sống (`signup-codes.js:62`) | `C5-P20-hoan-bao-huy` | bộ kiểm bản nhanh trên bản sao: CHỈ ✗ bài chạy thật cong_cu/thu_P20.js (✗ /claim với đơn đã hoàn tiền → 400 DON_DA_HOAN — HTTP 400 · DON_DA_HUY) |
| D3 TU-CHAY-4 không ghi file thật | `VS-D3-ghi-that` | ✗ KHO BẨN (TU-CHAY-4 chạy trong kho git tạm) |

### C2 — bảng "đột biến → bất biến bắt" (sau khi bỏ I10)
| đột biến | trước (gốc) | sau (head) |
|---|---|---|
| `thu_gia_lap` M11 huỷ đơn bỏ cổng trạng thái | KB13 → I10 (+ I11) | ✓ M11 … → KB13 → I11 |
| `thu_gia_lap` M12 xoá đơn hoàn ví bất kể trạng thái | KB14 → I10 (+ I11) | ✓ M12 … → KB14 → I11 |
| `viec/P26b` `huy-kiem-ngoai-tx` | BẮT | BẮT — dòng khớp thật: "KB15 → HTTP: hai lệnh huỷ chồng nhau …" (nhánh HTTP); I11 bắt chứng minh riêng bằng `C2-I11-huy-kiem-ngoai-tx` |
| `viec/P26b` `xoa-doc-don-ngoai-tx` | BẮT | BẮT — dòng khớp thật: "KB14 → HTTP: xoá chồng lên huỷ …"; I11 bắt: `C2-I11-xoa-doc-don-ngoai-tx` |
Không đột biến nào chuyển SỐNG. `git grep -n "I10\|11 bất biến" -- ':!viec/' ':!TIEN_DO_POS.json'` → chỉ còn chú thích mới
"I10 ⊂ I11" (`bat_bien.js:139`, `kiem_tra_truoc_khi_giao.js:754`) và một file zip cũ trong `attached_assets/` (không đọc — CLAUDE.md §8).

## D5 — chạy lại trên head `b8e5306` (cách (b) chủ quán chọn), 08.10, tuần tự
Phần (1) — neo của MỌI đột biến 6 bộ (`python3 viec/HOC-2b/kiem_neo.py`, không chạy lệnh đo):
| bộ | đột biến | neo khớp | HỎNG |
|---|---|---|---|
| AUDIT-1 | 174 | 173 | 1 = `G3-sai-chuoi` (cố ý hỏng của công cụ đo) |
| P26b | 59 | 59 | 0 |
| HOC-1 | 20 | 20 | 0 |
| HOC-2 | 26 | 26 | 0 |
| TU-CHAY-4 | 10 | 10 | 0 |
| HOC-2b | 14 (+2 dùng lại bản vá P26b, kiểm ở bộ P26b) | 14 | 0 |

Phần (2) — chạy thật:
| bộ | chạy | BẮT | SỐNG | HỎNG | LẠC | ghi chú |
|---|---|---|---|---|---|---|
| AUDIT-1 D1 (57) | đủ | 55 | 0 | 0 | 2 | LẠC `!D1-E11-P20`, `!D1-E11-P26a` — y như trên gốc 07.10 (Phát hiện P5) |
| AUDIT-1 G3 (4) | đủ | 1 | 1 | 1 | 1 | đúng thiết kế: `G3-da-biet` BẮT, `G3-vo-hai` SỐNG (vô hại), `G3-sai-chuoi` HỎNG, `G3-sap` LẠC (sập) |
| AUDIT-1 C2 đã BẮT (2) | đủ | 2 | 0 | 0 | 0 | |
| AUDIT-1 C2F đã BẮT ở `c2_day_du.md` / gốc 07.10 (40) | đủ | 40 | 0 | 0 | 0 | vẫn BẮT sau khi bỏ I10 |
| P26b (59) | đủ | 59 | 0 | 0 | 0 | `I10-bo` đã bỏ (D2) |
| TU-CHAY-4 (10) | đủ | 9 ĐỎ đúng chỗ + M0 XANH | 0 | 0 | 0 | F2, S3 chạy trên bản sao; kho thật không đổi (D3) |
| HOC-1 `M0-*` (3) + `MC*` (3) | 6 | 3 | 0 | 0 | 0 | 3 đối chứng XANH |
| HOC-2 `M0-*` (3) | 3 | — | 0 | 0 | 0 | 3 đối chứng XANH |
| HOC-2b (16) | đủ | 11 | 0 | 0 | 0 | 5 đối chứng XANH |
AUDIT-1 kết thúc "✓ kho thật không đổi". Thời gian: HOC-2b 888 s · P26b 202 s · TU-CHAY-4 684 s · HOC-1 84 s · HOC-2 76 s ·
AUDIT-1 (103) 1206 s → ~52 phút.

Phần (3) — sang AUDIT-2 (không chạy thật ở đây; đo bằng `tu_chay/` mà việc này không đổi, hoặc SỐNG/LẠC trên gốc — neo đã kiểm ở (1)):
- AUDIT-1 A3 (BẮT trên gốc 07.10, 16): `A3-GITADD-bo-A`, `A3-GITCOMMIT-bo-a`, `A3-GITPUSH-moi-nhanh`, `A3-SED-i-ngan`, `A3-RM-bo-realpath`, `A3-CURL-moi-host`, `A3-LN-dao-s`, `A3-G1CAM-theoten`, `A3-FINDCAM-bo-delete`, `A3-NPM-them-install`, `A3-MKDIR-bo-khung`, `A3-TARX-moi-dich`, `A3-FILEC-bo-ngan`, `A3-BGAN-bo-PATH`, `A3-CCLA-them-la`, `A3-GHIDUOC-bo-khung`
- AUDIT-1 B1 (BẮT trên gốc 07.10, 8): `B1-A11-dao-goc`, `B1-A11-bo-xanh-PR`, `B1-A6-bo-phamvi`, `B1-A10-bo-filecam`, `B1-A7-noi-tieude`, `B1-A12-bo`, `B1-laBaiThu-noi-slash`, `B1-A14-bo-dang-nhanh`
- AUDIT-1 C2 (SỐNG trên gốc 07.10, 1): `C2-loyalty-redeem-tru-0`
- AUDIT-1 C2F (LẠC trên gốc 07.10, 1): `C2F-orders-02-insert-quay`
- AUDIT-1 C2F (SỐNG trên gốc 07.10, 45): `C2F-orders-05-update-quay`, `C2F-orders-07-insert-quay`, `C2F-orders-10-update-quay`, `C2F-orders-11-insert-quay`, `C2F-orders-13-update-quay`, `C2F-orders-14-insert-quay`, `C2F-orders-21-update-quay`, `C2F-orders-22-delete-quay`, `C2F-orders-23-update-quay`, `C2F-orders-24-delete-quay`, `C2F-orders-25-update-quay`, `C2F-orders-27-insert-quay`, `C2F-orders-30-update-quay`, `C2F-orders-31-delete-quay`, `C2F-orders-32-update-quay`, `C2F-orders-35-delete-quay`, `C2F-orders-36-delete-quay`, `C2F-orders-37-delete-quay`, `C2F-orders-38-delete-quay`, `C2F-orders-39-insert-quay`, `C2F-refunds-05-update-quay`, `C2F-wallets-08-insert-quay`, `C2F-damages-03-update-quan-tri`, `C2F-packages-01-insert-quan-tri`, `C2F-packages-02-update-quan-tri`, `C2F-packages-03-update-quan-tri`, `C2F-packages-04-delete-quan-tri`, `C2F-packages-05-update-quay`, `C2F-packages-06-update-quan-tri`, `C2F-signup-codes-05-update-quan-tri`, `C2F-signup-codes-06-delete-quan-tri`, `C2F-discount-codes-02-update-quan-tri`, `C2F-discount-codes-03-update-quan-tri`, `C2F-discount-codes-04-delete-quan-tri`, `C2F-discount-codes-05-update-quay`, `C2F-rewards-02-update-quan-tri`, `C2F-rewards-03-update-quan-tri`, `C2F-loyalty-01-insert-khach-app`, `C2F-loyalty-02-insert-khach-app`, `C2F-don-mo-rong-01-update-quay`, `C2F-customers-v2-01-insert-khong-ro`, `C2F-customers-v2-02-update-quan-tri`, `C2F-customers-v2-03-insert-quan-tri`, `C2F-customers-v2-04-update-quan-tri`, `C2F-customers-v2-05-insert-quan-tri`
- HOC-1 (14, đo bằng tu_chay/thu_cong.js · thu_nguoi_gac.js · thu_cong_cu.js): `M9 cai_dat bỏ phép kiểm muc_gac`, `M10 cong.js bỏ throw cấu hình thiếu khoá`, `MA1 bỏ miễn (về luật cũ)`, `MA3 bỏ điều kiện "có ở mốc"`, `MA4 miễn bỏ luôn kiểm xanh trên PR`, `MA6a bỏ kiểm lý do`, `MA6b bỏ kiểm thu_*.js`, `MA6c bỏ kiểm "không có trong kho"`, `MX bỏ kiểm "bị PR xoá / đổi tên"`, `MA7 miễn tính là bài đỏ hợp lệ`, `MB cau_hinh bỏ package.json khỏi file_luat`, `MB4 như MB, đo bằng bài thử cổng`, `MD bỏ phép (d) bản gốc chạy trên code PR`, `MD2 (d) chỉ cho bài xanh trên gốc`
- HOC-2 (23, đo bằng tu_chay/): `BV-A16-bo-khoi`, `VS-A16-mien-van-ap`, `VS-A16-dong-dau`, `VS-A16-bo-mau`, `VS-A16-chi-bat-lon`, `VS-A16-bo-thieu-dong`, `BV-A17-bo`, `VS-A17-bo-ranh-gioi`, `BV-A18-bo`, `VS-A18-chua-giua`, `VS-A18-chi-server`, `VS-A18-bo-xoa`, `VS-A18-mien-van-ap`, `VS-A2-them-khoa`, `VS-A7-bo-P26b`, `VS-B1-them-la`, `VS-B2-bo-kiem-kho`, `VS-B2-bo-kiem-tam`, `VS-B2-de-thu-muc`, `VS-B2-cay-lam-viec`, `VS-E3-phien-ban-cu`, `VS-E3-skill-bo-VS`, `VS-E3-ra-soat-bo-dem`
SỐNG của C2F ở trên chính là các lỗ AU-G1/G2/G3/G4/G6 (thuộc LUOI-1, `viec/AUDIT-1/c2_day_du.md`) — không làm gì ở đây.

## E1 — `KHUON_LOI.md` 120 → 88 dòng: ý bỏ / gộp → lý do
| dòng / ý cũ | xử lý | lý do |
|---|---|---|
| K3 "LUẬT CỨNG: chạy trên bản CHƯA vá, phải hỏng" | bỏ, ghi tên phép ở đầu file | cổng A11/A12 |
| K3 "'Đỏ trên gốc' kèm 'xanh trên bản vá' … đổi bài sau khi ghi → chạy lại" | bỏ | cổng A11 (chạy chính file) + A16 |
| tên đột biến trong hồ sơ, vá sai | ghi tên phép ở đầu file | A17, A18 |
| K3 "Đột biến không dựng được → CHƯA KIỂM", "lỗi thất thường N/N" | gộp một gạch K3 | giữ ý, rút chữ |
| K3 "Kịch bản X phủ nhánh Y", "mỗi ca chỉ vi phạm một phép", "BEGIN lười Turso" | giữ 2 ý đầu (rút gọn), bỏ ý Turso | ý Turso là chi tiết giả lập, đã nằm trong `thu_P26b` K1b |
| K4 bốn gạch ví dụ (try/catch, khoản hoàn, hàm chung, symlink, đối tượng, tài liệu) | gộp 2 gạch "Chặn" | giữ đủ ý, bỏ trích dẫn dài |
| K5 "siết một phép cũng là thêm phép chặn" | vào "Dấu hiệu" K5 | gộp |
| K7 "ghi lại tồn mọi món", "sổ việc ghi 17 mà liệt kê 20", "patch cũ trong thư mục giao" | bỏ | ví dụ một lần (BỎ), "Đã gây" giữ 1–2 ví dụ |
| mở đầu "27 lỗi, 10 lỗi, 3 lỗi" | bỏ số | số đếm cứng hay lệch (K4 tài liệu) |
| Ý MỚI gộp: K8 báo oan dạy bỏ qua · K3 con số đạt + chạy lại HEAD + neo ngắn · K3 so bằng 2 chiều, tiền tố chuỗi giữa, đột biến nới phép · K1 xếp đường tiền theo cái khách chạm + middleware + khoá thân hàm, nhánh hỏng NẶNG · K4 chạy lại bằng chứng → grep con số cũ · K5 bài thử chạy được trong mọi bản sao | thêm vào khuôn có sẵn | phiếu E1 |
Mỗi khuôn K1–K8 có "Dấu hiệu" + "Chặn" (K2, K5, K6, K7 trước đây thiếu "Dấu hiệu" — đã thêm một dòng). "Năm câu tự hỏi" giữ nguyên.

## Câu hỏi
- **Q-D4 (cần chủ quán):** xoá `cong_cu/thu_p1.js` (chốt 3a) — người gác chặn mọi cách xoá trong kho: `git rm` → `[GIT-LENH]`,
  `rm` → `[RM-NHAP] chỉ được xoá trong thư mục nháp`. Không lách (không dùng `os.remove` qua python). Đã kiểm: không bài thử,
  bộ kiểm, `package.json` hay `tu_chay/` nào gọi nó (`grep -rn thu_p1 package.json kiem_tra_truoc_khi_giao.js cong_cu/ tu_chay/ .github/`
  → chỉ chính file). Đề nghị: chủ quán chạy `git rm cong_cu/thu_p1.js` trên nhánh `viec/HOC-2b` rồi commit, hoặc ghi D4 sang
  DON-DEP-v1. `git grep -l thu_p1` hiện còn (không sửa): `CHECKLIST_CODE.md`, `TIEN_DO_POS.json`, `lui_KHOTHU_v2.sh`,
  `patch_pos_khothu_v2.py`, `viec/AUDIT-1/{b_bang.md,bang_chung_do.txt,bao_cao.md,ke_hoach.md,trang_thai.md}`,
  `viec/HOC-2/{ke_hoach.md,phieu.md}`, `viec/HOC-2b/{phieu.md,ke_hoach.md,trang_thai.md}`.

## Phát hiện
- P1 (SỬA 08.10) `tu_chay/thu_cong.js` chạy RIÊNG 49,5–53,4 s (hạn 120 s) — số 91,3 s ghi lúc lập kế hoạch là đo khi phiên đang
  chạy việc khác song song, KHÔNG phải số thật. Không có gì phải làm.
- P2 `tu_chay/THIET_KE.md:386` còn "giả lập 22 s, thu_gia_lap 24 s"; `:388` "số bất biến ≥ 9 — chỉ được tăng" (lệch với bánh
  cóc thật và lần hạ 11 → 10 chủ quán chốt). Ngoài Phạm vi.
- P3 AUDIT-1 kiểu `thugl` dựng bản sao `sv` không có `kiem_tra_truoc_khi_giao.js` → ca C3e của `thu_gia_lap` sẽ đỏ oan nếu có đột
  biến dùng `thugl` (hiện không đột biến nào dùng). Đã rà K4 sự cố symlink: P26b `thugl`/`gl13`, TU-CHAY-4 `gl` nối `server/`
  nhưng chạy `thu_gia_lap` với cwd = kho thật (nó chép `server/` thật) → an toàn; AUDIT-1 `sv` CHÉP `server/` → an toàn.
- P4 AUDIT-1 chạy không tham số bỏ nhóm G3 (`chon_db`, `viec/AUDIT-1/dot_bien.py:372`).
- P5 `!D1-E11-P20`, `!D1-E11-P26a` LẠC (cả trên gốc 07.10 lẫn head): bộ kiểm đỏ nhưng dòng ✗ không khớp mẫu
  `✗ bài chạy thật …` (phép tĩnh bắt trước). Liveness `thu_P20` đã chứng minh riêng ở C5. Không sửa `viec/AUDIT-1/`.
- P6 `CLAUDE.md:49` "119 phép của bản mẫu giao diện" và §9 "119 đạt" là sàn chủ quán đặt cho bản mẫu (không phải số phép bộ kiểm)
  → giữ (E2 chỉ bỏ số ở dòng 26).
