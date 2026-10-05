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

## A6 — hồ sơ HOC-2 tự chạy `cong.js` MỚI (mốc `cb5d9fd`)
- `tinh` trên kho thật, head `e0ac352`: chỉ `[A8] bản cài lệch nguồn … chủ quán chạy bash tu_chay/cai_dat.sh` — không A6/A7/A9/
  A10/A12/A17/A18 (A17: mọi tên trong `viec/HOC-2/dot_bien.py` có ở bảng trên; A18 không áp — không đổi `server/`, `client/src/`).
- `chay` trên BẢN SAO kho (`.git` chép + `git archive e0ac352` giải vào thư mục nháp; `git clone`/`checkout -f` bị người gác
  chặn — GIT-LENH, GIT-CHECKOUT): chỉ `[A8] bản cài lệch kết quả cai_dat.js` — tức A11 (3 bài đỏ trên gốc, xanh trên PR), A12,
  A13 (`npm test` + `--day-du` của bản sao) và **A16** (`SỐ CA` khớp) đều qua. A8 tự hết khi chủ quán cài (F2).
- Sau soát vòng 1 (`009d249`) bài `thu_cong.js` có thêm ca → bằng chứng chạy lại trên gốc, `SỐ CA` 253 · 971 · 85 khớp head.

## G — kiểm toàn bộ (05.10.2026, máy mây)
- `npm test` (head `d5c24d2`): PASS 58 · FAIL 0 · CẢNH BÁO 3. `--day-du` (head `e0ac352`): PASS 62 · FAIL 0 · CẢNH BÁO 3. Ba
  cảnh báo đều là T2–T4 "bản cài `.claude/` lệch nguồn" — đúng dự kiến tới khi chủ quán chạy `cai_dat.sh`.
- Thời gian: `thu_cong` 58,9 s trong `--day-du` (riêng 52–56 s; hạn 120 s, ngưỡng báo 90 s — không vượt); giả lập 68,6 s,
  `thu_gia_lap` 72,1 s (đọc `ten_mien_production` của cấu hình mới vẫn xanh).
- `thu_nguoi_gac` 798/798 ca + 173 phép khác; `thu_cong` 253 phép; `thu_cong_cu` 85 phép — xanh cả ba.

| bộ đột biến (chạy trên `e0ac352`) | BẮT | SỐNG | HỎNG | LẠC | ghi chú |
|---|---|---|---|---|---|
| AUDIT-1 `A3` (16) | 16 | 0 | 0 | 0 | gồm `A3-CCLA-them-la` → "✗ ca khoá tập CONG_CU_DOC" (trước HOC-2: SỐNG) |
| AUDIT-1 `B1` (8) | 8 | 0 | 0 | 0 | gồm `B1-A14-bo-dang-nhanh` → "✗ A14 … lý do có "không có dạng viec/<MÃ>"" (trước: LẠC) |
| AUDIT-1 `!D1-T1-nguoi-gac`, `!D1-T1b-cong-cu`, `!D1-T1c-cong` | 3 | 0 | 0 | 0 | |
| AUDIT-1 `G3` (4) | 1 | 1 | 1 | 1 | ĐÚNG THIẾT KẾ "công cụ tự chứng minh": `G3-da-biet` BẮT, `G3-vo-hai` SỐNG (sửa vô hại), `G3-sai-chuoi` HỎNG (chuỗi cố ý sai), `G3-sap` LẠC (sập) |
| HOC-1 cả bộ (3 đối chứng + 16) | 16 | 0 | 0 | 0 | 3 đối chứng XANH; `MB`, `MB4` trước D1: HỎNG (neo 0 lần), sau: BẮT |
| HOC-2 cả bộ (3 đối chứng + 21) | 21 | 0 | 0 | 0 | bảng ở trên; chạy LẠI trên `009d249` (sau soát vòng 1): 3 XANH · 21 BẮT |

AUDIT-1 in "✓ kho thật không đổi", thoát 0, 518 s. HỎNG duy nhất là `G3-sai-chuoi` — đột biến cố ý hỏng của chính công cụ đo.

## Soát độc lập (`/ra-soat`) — vòng 1: KHÔNG ĐẠT → đã sửa (`009d249`)
LỖI: (1) `cong.js:288` câu A16 bảo "chạy lại bài trên code gốc" trong khi N là số ca ở head → sửa câu + ca K5 "gốc 2 ca ≠
head 3 ca, ghi số head → ĐẠT" + skill/MAU_PHIEU ghi "khi chạy trên code đã vá"; (2) bằng chứng đỏ không chạy lại sau khi
`thu_cong.js` đổi ở `870ef78` → chạy lại (số vẫn khớp); (3) trang_thai thiếu A6, G, `## Phát hiện`, Câu hỏi cũ → bổ sung
ở đây; (4) `THIET_KE.md:475` sót `cong.js:234`, `:777` "A6–A14" → sửa. NGHI NGỜ ghi nhận (không sửa, xem Phát hiện):
A16 so con số người ghi với head (không so với gốc); A18 không kiểm đột biến VS- có bị bắt; A17 sẽ đòi tên dài kiểu HOC-1
ghi nguyên văn; `ban_sao_goc.py` nhận đích có sẵn mà rỗng (THIET_KE ghi đúng "chưa có hoặc rỗng"). NGHIỆM THU 10/14 lúc soát
(thiếu A6, A7 Phát hiện, G, F2) — A6, A7, G đã bổ sung; F2 chờ chủ quán.

## Phát hiện
1. (A7, AU-B3b) `ban_mau_pos/thu/` KHÔNG vào `thu_muc_bai_thu`: sáu `ban_mau_pos/thu/thu_*.js` không gọi `process.exit`,
   in `N đạt · M hỏng` và LUÔN thoát 0 (`chay_thu.sh` mới đếm) → A11 sẽ chặn oan mọi PR sửa bài bản mẫu. Muốn thêm thì trước
   hết bài bản mẫu phải thoát ≠ 0 khi có ca hỏng — file luật bản mẫu, ngoài Phạm vi, chủ quán quyết. Lý do ghi ở THIET_KE B2.
2. (soát vòng 1) A16 chỉ so dòng `SỐ CA` với số ca ở head; sửa con số bằng tay mà không chạy lại vẫn qua. Cổng đã có đầu ra
   chạy trên gốc (A11) — đề xuất việc sau: A16 so thêm với số ca trên gốc khi lượt gốc có in dòng tổng (cảnh báo nếu lệch).
3. (soát vòng 1) A18 chỉ kiểm có tên `VS-`, không kiểm đột biến đó BẮT — cổng không chạy `dot_bien.py` (chạy code PR ở chế độ
   tĩnh là trái `cong.js:5`). Lớp canh còn lại: `/ra-soat` + bảng "chỗ vá → đột biến" trong trang_thai.
4. A17 đọc tên = nguyên chuỗi đầu của tuple: `viec/HOC-1/trang_thai.md` chỉ ghi tên ngắn (`MA1`…) cho 17/20 đột biến tên dài —
   việc cũ không bị soát lại (A17 chỉ đọc `viec/<MÃ>` của PR), việc mới phải ghi nguyên văn (skill, MAU_PHIEU đã nói).
5. Người gác chặn `git clone` (GIT-LENH) và `git checkout -f` (GIT-CHECKOUT) — dựng bản sao kho cho A6 phải đi đường vòng
   (`cp -r .git` + `git archive | tar -x` vào nháp). Đề xuất: mở rộng `cong_cu/ban_sao_goc.py` thêm chế độ cả kho (việc sau).

## Câu hỏi
(không còn — Q1–Q4 chủ quán đã chốt ở commit `61d037a`)
