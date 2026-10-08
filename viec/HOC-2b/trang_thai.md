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
  `b8e5306` (đột biến HOC-2b + `kiem_neo.py`). Sửa theo soát: vòng 1 `44d1a7c`, `5e20f9c`; vòng 2 `3e44477`.
- **Mọi số đo / bảng dưới đây là lần chạy CUỐI trên head `3e44477`** (08.10, tuần tự, không sửa file nào trong lúc chạy), trừ
  chỗ ghi rõ mốc khác.
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
| `tu_chay/thu_cong.js` | 51,4 · 53,4 s | 49,5 · 52,1 s (`b8e5306`); trong `--day-du` 52,2 → 61,8 → 65,7 s (`3e44477`) |
| `cong_cu/gia_lap/chay.js` | 69,4 · 67,6 s | 66,5 · 66,7 s; trong `--day-du` (`3e44477`) 67,1 s |
| `cong_cu/thu_gia_lap.js` | 71,6 · 70,3 s (34 ca) | `3e44477`: 74,0 s riêng · 74,9 s trong `--day-du` (40 ca — ca C3 ngủ 4,5 s, chạy xong TRƯỚC các giả lập con) |
Ngưỡng cảnh báo 80 % × 120 s = 96 s → dư ~21 s (thu_gia_lap 75 s) ở máy mây; theo số chat đo (80,4 s, chưa có C3) + ~4,5 s → dư ~11 s.
`thu_cong` trong `--day-du` 61–66 s (cao hơn lúc chạy riêng) — dưới hạn 120 s, và không bật cảnh báo (phiếu C3: chỉ hai lời gọi).
Số 91,3 s của `thu_cong` (Phát hiện P1 cũ) là đo khi phiên đang chạy việc khác song song → SAI, đã sửa P1.

## Đột biến của HOC-2b (`viec/HOC-2b/dot_bien.py`) — bảng chỗ đổi → đột biến
Lần cuối: cả bộ trên `3e44477` → **23 đạt · 0 không đạt** (6 đối chứng XANH, 17 ĐỎ đúng chỗ), 1397 s, kho thật không đổi sau từng
đột biến. (Lịch sử: trên `44d1a7c` 20/21 — `M0-glsym` sập `Cannot find module 'express'` vì bản "server thật" đặt NGOÀI thư mục
tạm; sửa `5e20f9c`.) VS- = vá sai, BV- = bỏ vá.

| chỗ đổi | đột biến (tên nguyên văn) | bài bắt (dòng ✗) |
|---|---|---|
| đối chứng | `M0-p26b`, `M0-kb17`, `M0-glk`, `M0-kiem`, `M0-tc4`, `M0-glsym` | XANH |
| C4 `refunds.js:165` phép phần mẹ `> 0` (thu_P26b M9) | `VS-q9-me-lon-hon-bang-0` | ✗ M9 … — 1 dòng hoàn mẹ |
| C4 hoàn mẹ khi duyệt (M6 `=== 1`, M10) | `BV-q9-bo-hoan-me` | ✗ M6 … 0 dòng hoàn mẹ · ✗ M10 … 0 dòng hoàn mẹ |
| C4 KB17-Q9 kiểm tạo đơn (200) | `KB17-khong-nap-me` | ✗ KB17 → HTTP: đơn ví con 5.000 + ví mẹ 20.000 tạo được (200): HTTP 400 · SO_DU_KHONG_DU |
| C2 I11 bắt thay I10 (bản vá sai của P26b) | `C2-I11-huy-kiem-ngoai-tx` | ✗ KB15 → I11: đơn #1020, ví 0900000001: hoàn 50.000đ > ví này đã trả 25.000đ |
| C2 (như trên) | `C2-I11-xoa-doc-don-ngoai-tx` | ✗ KB14 → I11: đơn #1019, ví 0900000003: hoàn 20.000đ > ví này đã trả 10.000đ |
| C3 cắt hàm (C3e) — số "2,6 s / 3 s" ở các dòng C3 dưới là bản trước soát; bản cuối 4,5 s / 5 s | `VS-C3-doi-ten-ham` | ✗ C3e … không thấy function chayBaiThat( |
| C3 khối cảnh báo | `BV-C3-bo-canh-bao` | ✗ C3a … 0 cảnh báo |
| C3 chỉ hai lời gọi bật | `VS-C3-bo-co` | ✗ C3d … 1 cảnh báo |
| C3 ngưỡng theo hạn, không số cứng | `VS-C3-nguong-giay-co-dinh` | ✗ C3a … 0 cảnh báo |
| C3 chỉ cảnh báo bài XANH (soát vòng 1) | `VS-C3-bo-xanh` | ✗ C3c bài thoát 1 sau 4,5 s … chac [false] · 1 cảnh báo |
| C3 mặc định cờ TẮT (soát vòng 1) | `VS-C3-mac-dinh-bat` | ✗ C3f … mặc định canhGan = false |
| C3 lời gọi giả lập bật cờ (soát vòng 1) | `BV-C3-bo-co-gia-lap` | ✗ C3f … bật: 'cong_cu/thu_gia_lap.js' |
| khoá `banSao` của `thu_gia_lap` (sự cố 08.10, soát vòng 1) | `BV-banSao-bo-khoa` | ✗ GHI XUYÊN — server/ "thật" (đích của liên kết) bị sửa |
| C3f bật cờ qua biến (soát vòng 2) | `VS-C3-bat-qua-bien` | ✗ C3f … cờ không phải chữ true/false: 'tu_chay/thu_cong.js' |
| `banSao` lớp realpath riêng (soát vòng 2) | `BV-banSao-bo-dereference` | ✗ M1 … — bản chép routes/orders.js trỏ ra ngoài thư mục tạm — không ghi (và KHÔNG ghi xuyên) |
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

## D5 — chạy lại trên head CUỐI `3e44477` (cách (b) chủ quán chọn), 08.10, tuần tự
Phần (1) — neo của MỌI đột biến 6 bộ (`python3 viec/HOC-2b/kiem_neo.py`, không chạy lệnh đo):
| bộ | đột biến | neo khớp | HỎNG |
|---|---|---|---|
| AUDIT-1 | 174 | 173 | 1 = `G3-sai-chuoi` (cố ý hỏng của công cụ đo) |
| P26b | 59 | 59 | 0 |
| HOC-1 | 20 | 20 | 0 |
| HOC-2 | 26 | 26 | 0 |
| TU-CHAY-4 | 10 | 10 | 0 |
| HOC-2b | 21 (+2 dùng lại bản vá P26b, kiểm ở bộ P26b) | 21 | 0 |

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
| HOC-2b (23) | đủ | 17 | 0 | 0 | 0 | 6 đối chứng XANH |
AUDIT-1 kết thúc "✓ kho thật không đổi"; TU-CHAY-4 không "KHO BẨN". Thời gian: HOC-2b 1397 s · P26b 202 s · TU-CHAY-4 689 s ·
HOC-1 82 s · HOC-2 72 s · AUDIT-1 (103) 1188 s → ~60 phút.

Phần (3) — sang AUDIT-2 (không chạy thật ở đây; đo bằng `tu_chay/` mà việc này không đổi, hoặc SỐNG/LẠC trên gốc — neo đã kiểm ở (1)):
- AUDIT-1 A3 (BẮT trên gốc 07.10, 16): `A3-GITADD-bo-A`, `A3-GITCOMMIT-bo-a`, `A3-GITPUSH-moi-nhanh`, `A3-SED-i-ngan`, `A3-RM-bo-realpath`, `A3-CURL-moi-host`, `A3-LN-dao-s`, `A3-G1CAM-theoten`, `A3-FINDCAM-bo-delete`, `A3-NPM-them-install`, `A3-MKDIR-bo-khung`, `A3-TARX-moi-dich`, `A3-FILEC-bo-ngan`, `A3-BGAN-bo-PATH`, `A3-CCLA-them-la`, `A3-GHIDUOC-bo-khung`
- AUDIT-1 B1 (BẮT trên gốc 07.10, 8): `B1-A11-dao-goc`, `B1-A11-bo-xanh-PR`, `B1-A6-bo-phamvi`, `B1-A10-bo-filecam`, `B1-A7-noi-tieude`, `B1-A12-bo`, `B1-laBaiThu-noi-slash`, `B1-A14-bo-dang-nhanh`
- AUDIT-1 C2 (SỐNG trên gốc 07.10, 1): `C2-loyalty-redeem-tru-0`
- AUDIT-1 C2F (LẠC trên gốc 07.10, 1): `C2F-orders-02-insert-quay`
- AUDIT-1 C2F (SỐNG trên gốc 07.10, 45): `C2F-orders-05-update-quay`, `C2F-orders-07-insert-quay`, `C2F-orders-10-update-quay`, `C2F-orders-11-insert-quay`, `C2F-orders-13-update-quay`, `C2F-orders-14-insert-quay`, `C2F-orders-21-update-quay`, `C2F-orders-22-delete-quay`, `C2F-orders-23-update-quay`, `C2F-orders-24-delete-quay`, `C2F-orders-25-update-quay`, `C2F-orders-27-insert-quay`, `C2F-orders-30-update-quay`, `C2F-orders-31-delete-quay`, `C2F-orders-32-update-quay`, `C2F-orders-35-delete-quay`, `C2F-orders-36-delete-quay`, `C2F-orders-37-delete-quay`, `C2F-orders-38-delete-quay`, `C2F-orders-39-insert-quay`, `C2F-refunds-05-update-quay`, `C2F-wallets-08-insert-quay`, `C2F-damages-03-update-quan-tri`, `C2F-packages-01-insert-quan-tri`, `C2F-packages-02-update-quan-tri`, `C2F-packages-03-update-quan-tri`, `C2F-packages-04-delete-quan-tri`, `C2F-packages-05-update-quay`, `C2F-packages-06-update-quan-tri`, `C2F-signup-codes-05-update-quan-tri`, `C2F-signup-codes-06-delete-quan-tri`, `C2F-discount-codes-02-update-quan-tri`, `C2F-discount-codes-03-update-quan-tri`, `C2F-discount-codes-04-delete-quan-tri`, `C2F-discount-codes-05-update-quay`, `C2F-rewards-02-update-quan-tri`, `C2F-rewards-03-update-quan-tri`, `C2F-loyalty-01-insert-khach-app`, `C2F-loyalty-02-insert-khach-app`, `C2F-don-mo-rong-01-update-quay`, `C2F-customers-v2-01-insert-khong-ro`, `C2F-customers-v2-02-update-quan-tri`, `C2F-customers-v2-03-insert-quan-tri`, `C2F-customers-v2-04-update-quan-tri`, `C2F-customers-v2-05-insert-quan-tri`
- HOC-1 (14, đo bằng tu_chay/thu_cong.js · thu_nguoi_gac.js · thu_cong_cu.js): `M9 cai_dat bỏ phép kiểm muc_gac`, `M10 cong.js bỏ throw cấu hình thiếu khoá`, `MA1 bỏ miễn (về luật cũ)`, `MA3 bỏ điều kiện "có ở mốc"`, `MA4 miễn bỏ luôn kiểm xanh trên PR`, `MA6a bỏ kiểm lý do`, `MA6b bỏ kiểm thu_*.js`, `MA6c bỏ kiểm "không có trong kho"`, `MX bỏ kiểm "bị PR xoá / đổi tên"`, `MA7 miễn tính là bài đỏ hợp lệ`, `MB cau_hinh bỏ package.json khỏi file_luat`, `MB4 như MB, đo bằng bài thử cổng`, `MD bỏ phép (d) bản gốc chạy trên code PR`, `MD2 (d) chỉ cho bài xanh trên gốc`
- HOC-2 (23, đo bằng tu_chay/): `BV-A16-bo-khoi`, `VS-A16-mien-van-ap`, `VS-A16-dong-dau`, `VS-A16-bo-mau`, `VS-A16-chi-bat-lon`, `VS-A16-bo-thieu-dong`, `BV-A17-bo`, `VS-A17-bo-ranh-gioi`, `BV-A18-bo`, `VS-A18-chua-giua`, `VS-A18-chi-server`, `VS-A18-bo-xoa`, `VS-A18-mien-van-ap`, `VS-A2-them-khoa`, `VS-A7-bo-P26b`, `VS-B1-them-la`, `VS-B2-bo-kiem-kho`, `VS-B2-bo-kiem-tam`, `VS-B2-de-thu-muc`, `VS-B2-cay-lam-viec`, `VS-E3-phien-ban-cu`, `VS-E3-skill-bo-VS`, `VS-E3-ra-soat-bo-dem`
SỐNG của C2F ở trên chính là các lỗ AU-G1/G2/G3/G4/G6 (thuộc LUOI-1, `viec/AUDIT-1/c2_day_du.md`) — không làm gì ở đây.

## E1 — `KHUON_LOI.md` 120 → 88 dòng (91 sau khi thêm 2 câu NGUYÊN TẮC ở bước 11): ý bỏ / gộp → lý do
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

## Bằng chứng ĐẾM (C1, G) — `ĐẾM (không đoán)` nguyên văn
- C1 (cùng điều kiện, bản sao kho không có `.claude/`): gốc `4a51723` → `PASS 61 · FAIL 0 · CẢNH BÁO 0`; head `3e44477` →
  `PASS 61 · FAIL 0 · CẢNH BÁO 0`. Kho thật: gốc `--day-du` (07.10) `PASS 65 · FAIL 0 · CẢNH BÁO 0`.
- G (head `3e44477`): `npm test` → `PASS 61 · FAIL 0 · CẢNH BÁO 0`; `node kiem_tra_truoc_khi_giao.js --day-du` →
  `PASS 65 · FAIL 0 · CẢNH BÁO 0` (giả lập 67,1 s, thu_gia_lap 74,9 s, thu_cong 65,7 s — dưới 96 s, không cảnh báo);
  `thu_gia_lap` riêng 40 đạt · 0 hỏng; `thu_P20` 51 đạt · 0 hỏng; `thu_P26b` 65 đạt · 0 hỏng; bản GỐC `thu_P26b` (b681ede) trên
  code PR: 63 đạt · 0 hỏng.
- F2: 2 check `cong` + `cong-chay` của PR — **CHƯA KIỂM** (máy không tạo PR, người gác chặn công cụ GitHub); thời gian bước
  `cong-chay` trên GitHub — **CHƯA KIỂM** (chat đo khi soát cuối).

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
- P7 `CHECKLIST_CODE.md:16` còn "26 phép kiểm tự động" — số đếm cứng, lệch (K4 tài liệu như E2). File bị Cấm sửa.
- P6 `CLAUDE.md:49` "119 phép của bản mẫu giao diện" và §9 "119 đạt" là sàn chủ quán đặt cho bản mẫu (không phải số phép bộ kiểm)
  → giữ (E2 chỉ bỏ số ở dòng 26).

## Soát độc lập `/ra-soat` — vòng 1 (08.10, trên `f399872`) — báo cáo chép nguyên
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
1. cong_cu/thu_gia_lap.js:141,147 — ca C3c "bài thoát 1, cờ bật → FAIL, 0 cảnh báo" vô giá trị (K3): hong.js process.exit(1) chạy
   ~0,05 s với hạn 120 s — xa ngưỡng 96 s nên KHÔNG BAO GIỜ có cảnh báo dù bỏ `xanh &&`. Đã chạy thử trong thư mục nháp cắt đúng
   hàm kiem_tra_truoc_khi_giao.js:478-495 với đột biến `if (xanh && canhGan` → `if (canhGan`: hong.js hạn 120 s → 0 cảnh báo
   (C3c vẫn XANH); bài thoát 1 sau 2,6 s, hạn 3 s → 1 cảnh báo "gần hạn" cho một bài ĐỎ. Đột biến "nới phép" này không có trong
   viec/HOC-2b/dot_bien.py:34-40 → SỐNG không ai biết. Sửa: C3c phải là bài ngủ quá 80 % hạn giả rồi thoát 1.
2. kiem_tra_truoc_khi_giao.js:759,763 (hai lời gọi `120000, true`) — không phép nào canh hai lời gọi thật (K3/K4): bỏ `true` ở lời
   gọi giả lập hoặc thu_gia_lap → cảnh báo gần hạn tắt vĩnh viễn, mọi bài vẫn xanh. Ca C3d truyền `false` tường minh
   (thu_gia_lap.js:141 `[3000, false]`) nên đột biến đổi mặc định `canhGan = false` → `true` (bật cho cả 7 lời gọi khác: dòng 492,
   549, 551, 553) cũng không bị bắt. Lời hứa "CHỈ hai lời gọi đó bật cảnh báo" của phiếu C3 chưa có khoá.
3. cong_cu/thu_gia_lap.js:92 — gốc của sự cố 08.10 chưa được khoá (K4, "bịt bằng KHOÁ"): banSao vẫn fs.cpSync(GOC/server) không
   dereference, không kiểm server là symlink, rồi writeFileSync vào bản chép. Bản vá chỉ ở MỘT nơi gọi (viec/HOC-2b/dot_bien.py:89-92,
   kiểu glk chép thật server/). Bộ đột biến tương lai đặt thu_gia_lap.js cạnh server/ nối symlink sẽ lại ghi xuyên vào
   server/routes/*.js thật. File này trong Phạm vi — khoá được ngay tại banSao.
4. viec/HOC-2b/trang_thai.md — thiếu bằng chứng đã hứa (K1/K6): C1 — ke_hoach.md:67 và :206 hứa "ghi hai dòng ĐẾM vào
   trang_thai.md" (npm test trước/sau) nhưng không có dòng ĐẾM nào; G — không có dòng ĐẾM của lần --day-du cuối trên head
   (dòng 23-24 chỉ nói "chạy lại các bước kiểm sau mốc sự cố"); F2 — không có dòng "CHƯA KIỂM cong/cong-chay" (chỉ ở
   ke_hoach.md:26-27, cho PR #10); dòng 22 "xem Bài học" nhưng không có mục ## Bài học.
NGHI NGỜ:
- Ca C3 (thu_gia_lap.js:139-141) có thể đỏ thất thường (K5): hạn giả 3 s, bài ngủ 2,6 s → chỉ 0,4 s cho node khởi động, 4 worker
  spawn song song. Kế hoạch tự đặt biên 600 ms; bản cuối hẹp hơn. Máy CI chậm/bận → C3a/C3d ETIMEDOUT → thu_gia_lap FAIL → chặn
  --day-du/cong-chay. Chưa đo được độ lệch (người gác chặn vòng lặp for).
- Lập luận "I10 ⊂ I11" (bat_bien.js:139) dựa "tiền nguyên" không dẫn file:dòng; server/routes/orders.js ~720 nhận
  parent_balance_amount từ body, không thấy ép số nguyên. Trong giả lập kịch bản gửi số nguyên nên đúng; chú thích nói chung hơn.
- Ngưỡng 96 s so với cong-chay GitHub: chưa ai đo. Lần chạy của người soát: thu_gia_lap 73,1 s, giả lập 67,1 s, thu_cong 64,0 s
  (thu_cong trong --day-du cao hơn số 52 s ở trang_thai.md:38).
- Chú thích S4 (kiem_tra_truoc_khi_giao.js:755) "07.10 … thu_gia_lap 72 s" nhưng số 07.10 ở trang_thai.md:40 là 71,6 / 70,3 s.
- K4 tài liệu: CHECKLIST_CODE.md:16 còn "26 phép kiểm tự động" (số đếm cứng, lệch) — file Cấm sửa, chưa ghi ## Phát hiện.
- Bảng kết quả đột biến D5 / HOC-2b không có log trong kho; người soát không chạy lại theo lệnh.
(K3: thu_gia_lap đỏ trên gốc; thu_P26b miễn, đỏ bằng VS-q9/BV-q9/KB17. K4: grep I10 còn 2 chú thích mới; chayBaiThat( 9 chỗ,
 không chỗ nào khoá; cpSync 1 chỗ chưa khoá. K5: 7 lời gọi mặc định không đổi hành vi — npm test gốc 4a51723 61/0/0, head 61/0/0.
 Đường tiền: PR không đổi server/ (git log 4a51723..HEAD -- server/ client/ tu_chay/ → 0). P1: không đụng client/src/.
 Người soát tự chạy: npm test 61/0/0; --day-du head 65/0/0; thu_P20, thu_P26b, thu_gia_lap xanh; kiem_neo.py khớp bảng D5(1).)
NGHIỆM THU:    10/14 mục có bằng chứng trong hồ sơ · mục thiếu: C1 (thiếu 2 dòng ĐẾM — người soát bù 61/0/0 gốc lẫn head), D4 (chưa
               xoá thu_p1.js — Q-D4), F2 (không ghi CHƯA KIỂM cong/cong-chay), G (không có ĐẾM --day-du cuối — người soát bù 65/0/0)
CHƯA SOÁT ĐƯỢC: thời gian cong-chay GitHub và check cong/cong-chay của PR; kết quả các bộ đột biến D5 / HOC-2b (không chạy lại theo
               lệnh); độ lệch thời gian ca C3 khi máy bận; việc xoá thu_p1.js (D4)
BÀI HỌC:       KHOÁ: C3c đổi sang bài thoát 1 sau khi quá 80 % hạn giả + đột biến VS-C3-bo-xanh; phép tĩnh/ca: đúng 2 lời gọi
               chayBaiThat(..., true) (giả lập + thu_gia_lap), mặc định canhGan = false; thu_gia_lap.js banSao từ chối khi server/
               là symlink (hoặc chép dereference: true). NGUYÊN TẮC (K3): ca "phải KHÔNG X" chỉ có giá trị khi đầu vào đã đủ điều
               kiện kích hoạt X ngoài điều kiện đang thử — ca "bài đỏ thì không cảnh báo" phải dùng bài đỏ mà chậm. NGUYÊN TẮC (K4):
               sửa ở bộ đột biến (nơi gọi) chưa phải khoá — chỗ gây hại là hàm bị gọi (banSao). NGUYÊN TẮC (K6/K1): điều kế hoạch
               hứa ghi ("hai dòng ĐẾM", "xem Bài học") phải có trong trang_thai.md trước khi báo xong. BỎ: không có.
```
### Đã sửa theo vòng 1 (vòng sửa 1/3) — `44d1a7c`, `5e20f9c`
1. C3c → `hong.js` ngủ 4,5 s rồi thoát 1, hạn giả 5 s (`thu_gia_lap.js` [C3]); đột biến `VS-C3-bo-xanh` → ✗ C3c.
2. Ca C3f (`thu_gia_lap.js`): đếm mọi lời gọi `chayBaiThat(` thật trong bộ kiểm, lời gọi có `true` phải đúng là giả lập +
   thu_gia_lap, chữ ký có `canhGan = false`; đột biến `VS-C3-mac-dinh-bat`, `BV-C3-bo-co-gia-lap` → ✗ C3f. Ca C3f ĐỎ trên gốc.
3. `banSao` (`thu_gia_lap.js`): `cpSync(..., { dereference: true })` + chỉ ghi khi `realpath` của đích nằm trong thư mục tạm;
   đột biến `BV-banSao-bo-khoa` (kiểu `glsym`: server/ của bản sao là liên kết tới bản "thật" trong thư mục tạm) → ✗ GHI XUYÊN.
4. Thêm mục "Bằng chứng ĐẾM (C1, G)" + F2 CHƯA KIỂM; mục `## Bài học` ghi ở bước 11.
Nghi ngờ: biên C3 nới (hạn giả 5 s, ngủ 4,5 s — dư ~0,5 s mỗi phía); chú thích I10 ⊂ I11 nêu rõ giả định tiền nguyên và chiều
ngược (tiền lẻ < 1đ chia nhiều ví thì I10 thấy mà I11 không) — I10 bỏ theo chủ quán chốt 2a; S4 ghi số đo 08.10 (thu_gia_lap 75 s
sau ca C3 mới); P7 `CHECKLIST_CODE.md:16` vào Phát hiện. Số `thu_cong` 61–64 s trong `--day-du` (người soát và lần cuối) cao hơn
49–53 s lúc chạy riêng — vẫn dưới hạn, và thu_cong không bật cảnh báo (phiếu C3).
Bằng chứng đỏ C3 đã chạy lại với bài BẢN CUỐI trên gốc → `bang_chung_do.txt` (37 đạt · 3 hỏng; head 40 đạt), `SỐ CA` = 40.

## Soát độc lập `/ra-soat` — vòng 2 (08.10, trên `c7cfacf`) — báo cáo chép nguyên
```
KHÔNG ĐẠT
Kết quả: còn 2 mục nghiệm thu thiếu (D4 việc mở đã biết; D5 bằng chứng chạy lại chưa làm trên head cuối). Bốn lỗi vòng 1 đã sửa
thật (người soát chạy lại kiểm); phần sửa không làm hỏng gì ở server/, client/ hay đường tiền.
KIỂM TỪNG LỖI VÒNG 1 (chạy lại trên HEAD c7cfacf)
1. C3c đã sửa: thu_gia_lap.js:145 hong.js ngủ 4,5 s rồi thoát 1, hạn giả 5 s; `python3 viec/HOC-2b/dot_bien.py VS-C3-bo-xanh` →
   ĐỎ đúng chỗ ✗ C3c, ra 1 cảnh báo cho bài đỏ.
2. Hai lời gọi bật cờ đã có khoá ở ca C3f (thu_gia_lap.js:155-159); VS-C3-mac-dinh-bat → ✗ C3f. Khoá còn lỗ (lỗi 2 dưới).
3. banSao đã khoá ở thu_gia_lap.js:94 (dereference: true) và :98 (realpath); M0-glsym → XANH, BV-banSao-bo-khoa → ✗ GHI XUYÊN.
4. Mục ĐẾM C1/G có ở trang_thai.md:130-137, F2 ghi CHƯA KIỂM. Mục ## Bài học vẫn chưa có, trang_thai.md:22 vẫn ghi "xem Bài học"
   (hẹn bước 11).
Người soát tự chạy: npm test → PASS 61 · FAIL 0 · CẢNH BÁO 0; --day-du → PASS 65 · FAIL 0 · CẢNH BÁO 0 (giả lập 67,0 s ·
thu_gia_lap 74,5 s · thu_cong 61,5 s); thu_gia_lap 40 đạt · 0 hỏng (khớp SỐ CA 40); thu_P26b 65/0; thu_P20 51/0; kiem_neo.py:
AUDIT-1 hỏng 1 (G3-sai-chuoi, cố ý), các bộ khác hỏng 0, HOC-2b 19 đột biến.
LỖI TÌM ĐƯỢC:
1. viec/HOC-2b/trang_thai.md:79-103 — D5 ghi "chạy lại trên head b8e5306". Sau mốc đó 44d1a7c sửa cong_cu/thu_gia_lap.js (banSao,
   C3 4,5/5 s, C3f). 9 đột biến kiểu gl của TU-CHAY-4 (viec/TU-CHAY-4/dot_bien.py:57) chạy chính file này nhưng không được chạy lại;
   chỉ bộ HOC-2b chạy lại. Phiếu D5 đòi "trên head cuối", K3 đòi con số "đạt" kèm lần chạy lại trên HEAD. — K3
2. cong_cu/thu_gia_lap.js:155-156 — C3f soi chữ bằng regex chayBaiThat\(([^)\n]*)\) và chỉ tìm chữ true. Thử trong thư mục nháp
   ba cách bật cờ cho lời gọi thứ ba (tu_chay/thu_cong.js): qua biến (const BAT = true; … , BAT), qua path.join(...) lồng ngoặc,
   tách xuống dòng — cả ba để C3f XANH. goi.length chỉ in, không so. Lời hứa phiếu C3 "CHỈ hai lời gọi đó bật cảnh báo" mới khoá
   dạng chữ true viết thẳng. Hậu quả nhẹ: chỉ sinh thêm cảnh báo, không chặn. — K3 (thiếu đột biến "nới phép")
3. viec/HOC-2b/trang_thai.md:40-41 và :88 — số cũ chưa sửa sau lần chạy lại: dòng 40 "39 ca … C3 gần như không thêm thời gian"
   (nay 40 ca, C3 ngủ 4,5 s chạy xong trước các giả lập con); dòng 41 "dư 24 s" (74,5–74,7 s → dư ~21 s); dòng 88 "HOC-2b 14 …
   neo khớp 14" (kiem_neo.py nay 19/19). Đúng loại K4 việc này vừa thêm vào KHUON_LOI. — K4
4. kiem_tra_truoc_khi_giao.js:754 vẫn ghi không điều kiện "I10 ⊂ I11, không giảm độ phủ" trong khi bat_bien.js:139-140 (vòng 1) đã
   viết "tiền lẻ < 1đ chia nhiều ví thì I10 thấy mà I11 không". Server nhận số lẻ: server/routes/orders.js:698-719 lấy
   parent_balance_amount từ body không ép số nguyên, :739 Math.round nên lệch dưới 0,5đ vẫn qua. Hai chú thích tự mâu thuẫn. Câu ở
   :754 đúng chữ phiếu C2, nhưng nên ghi kèm giả định. — K4 tài liệu / K1
5. cong_cu/thu_p1.js vẫn còn (D4) — việc mở đã biết, Q-D4 trang_thai.md:140-146; người gác chặn git rm và rm. — chưa làm được,
   không phải lỗi mã
NGHI NGỜ:
- Biên thời gian C3 hẹp phía trên: C3a cần bài ngủ 4,5 s xong dưới 5 s. Đo trong thư mục nháp: máy rảnh 4,53 s; 8 vòng lặp chiếm
  CPU 4,60 s; 32 vòng lặp 4,79 s. Chưa thấy ETIMEDOUT, nhưng lúc quá tải chỉ dư ~0,2 s. Máy GitHub 2 lõi chưa đo.
- Hai khoá banSao (:94 dereference, :98 realpath) chỉ có một đột biến gỡ cả hai. Gỡ riêng realpath không quan sát được (dereference
  chặn); gỡ riêng dereference thì realpath chặn, bài báo đỏ an toàn. Phòng thủ nhiều lớp, mỗi khoá chưa chứng minh riêng.
- viec/HOC-2b/dot_bien.py:136 dòng "GHI XUYÊN" chỉ nối thêm vào đầu ra, không ép mã thoát ≠ 0. BV-banSao-bo-khoa đỏ là nhờ ca E1 của
  thu_gia_lap đọc phải server/ đã bị ghi đè. Nếu thoát 0 kết quả báo "SỐNG" (không tính đạt) — không thành xanh oan.
- ke_hoach.md:6 (kế hoạch đã duyệt) vẫn ghi "hạn giả 3 s / bài ngủ 2,6 s"; thiết kế đổi sau soát vòng 1, chỉ ghi ở trang_thai.md:211.
NGHIỆM THU:    12/14 mục có bằng chứng · mục thiếu: D4 (còn cong_cu/thu_p1.js — Q-D4), D5 (bảng chạy thật làm trên b8e5306, chưa trên
               head cuối sau khi thu_gia_lap.js đổi; bảng neo ghi HOC-2b 14, thực tế 19). Có: C1 (chú thích kiem_tra:558-559, 583, 597,
               626-627; ĐẾM gốc/head 61/0/0), C2, C3 (lỗ C3f — lỗi 2), C4, C5 (không chạy lại), D2, D3, E1, E2, F1, F2 (CHƯA KIỂM), G.
CHƯA SOÁT ĐƯỢC: 9 đột biến gl của TU-CHAY-4 và AUDIT-1/P26b/HOC-1/HOC-2 trên head cuối (bị cấm chạy viec/*/dot_bien.py ngoài HOC-2b);
               C5 và 15 đột biến HOC-2b còn lại (chỉ chạy 4: M0-glsym, BV-banSao-bo-khoa, VS-C3-bo-xanh, VS-C3-mac-dinh-bat → 4 đạt);
               thời gian cong-chay và hai check cong/cong-chay trên GitHub; thời gian C3 trên CI 2 lõi; D4.
BÀI HỌC:       KHOÁ: (a) C3f so số lời gọi và báo đỏ khi đối số thứ tư không phải chữ true/false viết thẳng, kèm đột biến "bật cờ qua
               biến"; (b) mỗi khoá banSao có đột biến gỡ riêng, hoặc ghi rõ khoá nào là lớp phụ; (c) dot_bien.py ép kết quả không đạt
               khi thấy GHI XUYÊN, không dựa mã thoát của bài. NGUYÊN TẮC (K3/K4): đã sửa code sau mốc chạy D5 thì chạy lại mọi bộ có
               lệnh đo đọc file vừa sửa, không chỉ bộ của việc mình; ghi rõ mốc head ở từng bảng. NGUYÊN TẮC (K4 tài liệu): thêm điều
               kiện vào một chú thích (I10 ⊂ I11 chỉ đúng với tiền nguyên) thì grep mọi câu cùng nghĩa (kiem_tra:754). BỎ: không có.
```
### Đã sửa theo vòng 2 (vòng sửa 2/3) — `3e44477` + hồ sơ
1. D5: chạy lại TOÀN BỘ phần (1) + (2) trên head cuối `3e44477` (bảng D5 ở trên ghi mốc). (TU-CHAY-4 thật ra ĐÃ chạy lại sau `44d1a7c`
   — 10/10 trên `5e20f9c`, không KHO BẨN — nhưng hồ sơ chưa ghi; nay mọi bảng ghi `3e44477`.)
2. C3f (`thu_gia_lap.js:154–173`): đọc đối số theo NGOẶC CÂN (lồng ngoặc, xuống dòng), đối số cờ (thứ tư) chỉ được là chữ
   `true`/`false` — bật qua biến là ĐỎ; tập lời gọi `true` đúng là giả lập + thu_gia_lap. Không so `goi.length` cố định (thêm một bài
   chạy thật vào bộ kiểm là luồng hợp lệ — K5). Đột biến `VS-C3-bat-qua-bien` → ✗ C3f.
3. Số cũ trong hồ sơ: bảng số đo, bảng HOC-2b, bảng neo (21), D5, ĐẾM — ghi lại theo lần chạy `3e44477`; `ke_hoach.md` dòng duyệt
   ghi C3 5 s / 4,5 s.
4. `kiem_tra_truoc_khi_giao.js:754–755`: chú thích NGUONG_BAT_BIEN giữ chữ phiếu C2 và thêm "với tiền đồng nguyên, giả định ghi ở
   bat_bien.js (I11)".
Nghi ngờ: (a) `dot_bien.py` — GHI XUYÊN luôn tính là bắt kể cả bài thoát 0; đột biến `BV-banSao-bo-dereference` chứng minh RIÊNG lớp
realpath (✗ M1 … "trỏ ra ngoài thư mục tạm — không ghi", và nếu ghi xuyên thì báo "ĐỎ nhưng GHI XUYÊN" = không đạt). Lớp chép-thật
gỡ riêng không dựng được ca đỏ (lớp realpath giữ an toàn) → CHƯA KIỂM riêng, ghi là lớp phụ. (b) Biên C3 (dư ~0,5 s mỗi phía, quá tải
còn ~0,2 s theo người soát) — chưa đo máy GitHub 2 lõi → CHƯA KIỂM; nếu C3 đỏ thất thường ở `cong-chay` thì báo chủ quán (nâng hạn
giả của CA THỬ — không phải hạn bộ kiểm). (c) "xem Bài học" — mục `## Bài học` ở cuối file.
`KHUON_LOI.md` thêm 2 câu NGUYÊN TẮC (K3 ca "phải KHÔNG X", K5 bản sao symlink) → 91 dòng.

## Bài học (bước 11)
Sự cố gom từ phiên: người gác chặn 12 lệnh (mục Tiến độ); soát vòng 1, 2 KHÔNG ĐẠT (báo cáo ở trên); sự cố ghi xuyên `server/`;
máy mây khởi động lại; vượt ngân sách hồ sơ (`dot_bien.py` 176 dòng so ~60 — vì 6 kiểu bản sao + khoá kho); làm lại lần kiểm cuối 3 lần.

**KHOÁ** (7 — 4 đã làm trong Phạm vi, 3 đề xuất ngoài Phạm vi)
1. Đã làm — bản sao nối symlink làm công cụ chép-rồi-sửa ghi XUYÊN kho thật: `thu_gia_lap.js` `banSao` chép `dereference` + chỉ ghi khi
   `realpath` đích trong thư mục tạm; `viec/HOC-2b/dot_bien.py` soát kho SAU MỖI đột biến. Ca đỏ: `BV-banSao-bo-khoa` (GHI XUYÊN),
   `BV-banSao-bo-dereference`.
2. Đã làm — ca "phải KHÔNG cảnh báo" với bài đỏ thoát ngay là vô giá trị: C3c dùng bài đỏ CHẬM. Ca đỏ: `VS-C3-bo-xanh`.
3. Đã làm — lời hứa "chỉ hai lời gọi bật cờ" chưa có khoá: C3f đọc lời gọi thật theo ngoặc cân. Ca đỏ: `VS-C3-mac-dinh-bat`,
   `BV-C3-bo-co-gia-lap`, `VS-C3-bat-qua-bien`.
4. Đã làm — đột biến cũ sửa file THẬT rồi trả lại (TU-CHAY-4 `tai_cho`): chạy trên bản sao + "KHO BẨN". Ca đỏ: `VS-D3-ghi-that`.
5. Đề xuất (`tu_chay/nguoi_gac.js`, việc sau) — phiếu có nghiệm thu XOÁ file (D4 chốt 3a) mà người gác chặn mọi cách xoá trong kho
   (`git rm` GIT-LENH, `rm` RM-NHAP): cho `git rm <file>` khi file nằm trong `## Phạm vi` của phiếu nhánh hiện tại. Ca đỏ: phiếu thử
   có `cong_cu/x.js` trong Phạm vi → `git rm cong_cu/x.js` CHO; file ngoài Phạm vi → CHẶN; `git rm -r` / glob → CHẶN.
6. Đề xuất (`tu_chay/cau_hinh.json` / người gác, việc sau) — không dừng được tiến trình nền đang chạy trên kho bẩn (`TaskStop` CC-LA,
   `pgrep`/`kill` B-CHUONGTRINH): cho `TaskStop` (chỉ dừng tiến trình của chính phiên). Ca đỏ: `thu_nguoi_gac` — `TaskStop` → CHO.
7. Đề xuất (`tu_chay/cong.js`, việc sau) — bảng kết quả trong hồ sơ bị trích số cũ sau khi code đổi (vòng 2 lỗi 1, 3): cổng đòi
   `trang_thai.md` nêu mốc head ≥ commit cuối đụng code / bài thử / `dot_bien.py` ở dòng "chạy lại trên head `<sha>`". Ca đỏ: hồ sơ
   ghi `b8e5306` trong khi `thu_gia_lap.js` đổi ở `44d1a7c` → ĐỎ; ghi `3e44477` → ĐẠT.

**NGUYÊN TẮC** (3 — đã ghi `KHUON_LOI.md`, file trong Phạm vi)
1. K3 — ca "phải KHÔNG X" chỉ có giá trị khi đầu vào đủ mọi điều kiện kích hoạt X trừ điều kiện đang thử (C3c vòng 1).
2. K5 — bản sao NỐI symlink tới thư mục mà công cụ chép-rồi-sửa → ghi XUYÊN vào kho thật; chép thật + công cụ tự kiểm `realpath`.
3. K8 — đo ngưỡng CHẠY RIÊNG (91 s đo lúc phiên chạy việc khác ≠ 51 s thật — P1).

**BỎ** (4)
1. Máy mây khởi động lại giữa phiên — một lần, cây làm việc còn nguyên.
2. `glsym` đặt "server thật" ngoài thư mục tạm → node không tìm thấy `express` — lỗi công cụ đo, một lần, đã sửa.
3. Sửa file trong lúc bộ đột biến chạy → "KHO BẨN" (TU-CHAY-4) — phép làm đúng việc; cách làm: không sửa gì khi đang chạy.
4. Hồ sơ thiếu dòng ĐẾM đã hứa (vòng 1 lỗi 4) — skill bước 10 đã có luật đếm từng mục nghiệm thu; soát bắt đúng chức năng.

Dọn: không thấy lời dặn mới nào trong `KHUON_LOI.md` / `CLAUDE.md` đã có phép làm thay ngoài những dòng E1 đã bỏ. `KHUON_LOI.md`
91 dòng ≤ `khuon_loi_toi_da` 120.

## Báo cáo (CLAUDE.md §7)
```
VIỆC:        HOC-2b — Phần còn lại của HOC-2: bộ kiểm, giả lập, đột biến cũ, KHUON_LOI.md, CLAUDE.md
ĐÃ SỬA:      kiem_tra_truoc_khi_giao.js:558-559,583,597,626-627 — C1 lý do giữ CẢNH BÁO T2/T3/T4/F2 (hành vi không đổi)
             kiem_tra_truoc_khi_giao.js:750,754-755 — C2 NGUONG_BAT_BIEN 11 → 10 + chú thích; "chỉ được TĂNG (trừ lần hạ có chủ quán chốt)"
             kiem_tra_truoc_khi_giao.js:476-490,756-764 — C3 chayBaiThat(han, canhGan): xanh mà > 80 % hạn → CẢNH BÁO, chỉ giả lập + thu_gia_lap; S4 số đo chạy riêng
             cong_cu/gia_lap/bat_bien.js:2,137-140 — C2 bỏ I10 (I10 ⊂ I11 với tiền nguyên)
             cong_cu/gia_lap/kich_ban.js:325-328 — C4 KB17-Q9 kiểm đơn tạo được (200) trước khi đo
             cong_cu/thu_P26b.js:351-369 — C4 M6 === 1, M9 phần mẹ 0đ, M10 yêu cầu cũ trên đơn ví mẹ
             cong_cu/thu_gia_lap.js:36,85-89,94-98,131-173 — C2 10 bất biến, M11/M12 → I11; khoá banSao; ca C3a–C3f
             viec/P26b/dot_bien.py:28,37,138 — D2 bỏ I10-bo, mẫu I10 → I11
             viec/TU-CHAY-4/dot_bien.py — D3 tai_cho → ban_sao + KHO BẨN
             KHUON_LOI.md (120 → 91 dòng) — E1; CLAUDE.md:26,112-115 — E2
             viec/HOC-2b/dot_bien.py (23 đột biến), viec/HOC-2b/kiem_neo.py (D5 b phần 1)
             KHÔNG làm: D4 xoá cong_cu/thu_p1.js — người gác chặn (Q-D4)
BÀI THỬ:     thu_gia_lap.js bản cuối trên code chưa vá (4a51723) → ĐỎ ở C3a, C3f, dòng tổng "10 bất biến" (37 đạt · 3 hỏng); sau khi vá
             → XANH 40 đạt · 0 hỏng (SỐ CA 40). thu_P26b (Bài thử cũ sửa) xanh trên gốc; đỏ bằng VS-q9-me-lon-hon-bang-0 (✗ M9),
             BV-q9-bo-hoan-me (✗ M6, ✗ M10), KB17-khong-nap-me (✗ KB17 … tạo được (200)); bản gốc thu_P26b trên code PR 63/0.
             Đột biến HOC-2b 23/23 trên 3e44477; D2: I10-bo HỎNG trên gốc (neo khớp 2 lần).
ĐÃ RÀ K4:    git grep "I10\|11 bất biến" ngoài viec/ + sổ việc → 2 chỗ, đều chú thích mới (bat_bien.js:139, kiem_tra…js:754) + 1 zip cũ
             attached_assets/; grep "chayBaiThat" kiem_tra…js → 7 chỗ (1 định nghĩa + 6 lời gọi), chỉ 760, 764 bật cờ — khoá bằng C3f;
             grep "cpSync" cong_cu/ → 1 chỗ (banSao), đã khoá; ba đường hoàn ví mẹ (refunds.js:165, orders.js:1337, :1499) — duyệt có
             M5/M6/M9/M10, huỷ/xoá có M2–M4; grep "[0-9]+ phép\|nhóm E" CLAUDE.md → 3 chỗ: :26 sửa, :113 sửa, :49 (sàn bản mẫu) giữ;
             đột biến cũ đọc file việc này sửa: kiem_neo.py 6 bộ, chỉ G3-sai-chuoi HỎNG (cố ý).
CHƯA KIỂM:   D4 (thu_p1.js còn — người gác chặn xoá); hai check cong + cong-chay của PR và thời gian cong-chay trên GitHub (người gác
             chặn công cụ GitHub — chat đo); ca C3 trên máy CI 2 lõi (biên ~0,5 s, quá tải ~0,2 s); lớp chép-thật của banSao gỡ riêng
             (lớp realpath che — không dựng được ca đỏ); "I10 ⊂ I11" chỉ đúng với tiền đồng nguyên (server không ép số nguyên ở
             parent_balance_amount — orders.js:698-719); 71 đột biến AUDIT-1 + 14 HOC-1 + 23 HOC-2 sang AUDIT-2 chỉ kiểm neo, không
             chạy thật (cách b chủ quán chọn); C1 so số trên bản sao không có .claude/ (cùng điều kiện cho gốc và head).
GIT:         (xem git log --oneline -2 ở câu trả lời cuối — commit này chứa chính báo cáo)
BÀI HỌC:     KHOÁ 7 · NGUYÊN TẮC 3 · BỎ 4 — chi tiết ở ## Bài học của trang_thai.md (bước 11 /lam-viec)
```
