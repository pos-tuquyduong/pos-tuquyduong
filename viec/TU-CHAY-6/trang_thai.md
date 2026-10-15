# Trạng thái — TU-CHAY-6

## Bước 1 — đối chiếu bản chụp (2026-10-15)

- nhánh: `viec/TU-CHAY-6`
- `git status --short`: sạch
- SHA HEAD: `dfeaa57` · SHA FETCH_HEAD: `dfeaa57` → bằng nhau, không kéo
- `git log --oneline -3`:

```
dfeaa57 PHIEU: TU-CHAY-6
8f6d43e TIEN-DO: mo TU-CHAY-6 + BAN-HANG-1 (song song AUDIT-3), DANG-NHAP-1 gop vao BAN-HANG-1 — so v32
142d5e5 TIEN-DO: SO-LUONG-1 xong (31a5810), mo AUDIT-3, them BAN-HANG-1, TU-CHAY-6 (6)(7) — so v31
```

## Bước 2–3 — đọc code thật, kế hoạch (15.10.2026)

- Phiếu dặn **chờ duyệt kế hoạch** → dừng ở bước 3 sau khi commit + push `ke_hoach.md`.
- Số đo A5 (đo 3 lần tuần tự, `scratchpad/do_A5.js`): `thu_nguoi_gac.js` 6,6 / 5,9 / 6,2 s · `thu_cong_cu.js` 2,9 / 3,1 / 3,3 s → < 30 s,
  **không đổi** điều kiện chạy. `thu_cong.js` 67,9 s (318 phép · 0 hỏng). `cong.js tinh . dfeaa57^ HEAD viec/TU-CHAY-6` → ĐẠT.
- Người gác chặn trong lượt này: `B-DICHCHU` (đích ghi là biến `$S` trong vòng for) · `B-CHUONGTRINH` (`for` ở đầu lệnh). Đều do
  cách viết lệnh của máy; viết lại thành script trong scratchpad / lệnh thẳng.

- Agent phụ soát kế hoạch (chỉ đọc) nêu 11 điểm — đã kiểm lại hai điểm nặng bằng code (`thu_nguoi_gac.js:709` canh `tu-chay 1.5.0`;
  `orders.js` 6 `^router.` / 5 `^});`) và sửa hết vào `ke_hoach.md` (bảng mục 13).

## Câu hỏi (chờ chủ quán — ghi kèm phương án ở `ke_hoach.md` mục 12)

1. **Q1 (chặn A2):** code thật không như phiếu giả định — quét `server/routes/` (thân route từ `^router.<m>(` tới `^});`): **3** route GET
   có lệnh ghi (`packages.js:191` run UPDATE :194 · `products.js:20` UPDATE pos_products :56–59 · `sync.js:104` UPDATE pos_customers
   :146–149 + INSERT pos_sync_logs :154–155), và **51/60** route có lệnh ghi KHÔNG gọi `loiGhi(` (`loiGhi` chỉ có ở `wallets.js:97`,
   5 file nhắc tới). Phép (b) theo chữ phiếu = 51 cảnh báo mỗi `npm test`. Chọn: PA-1 (đúng chữ phiếu, 3 + 51 dòng `!`) ·
   **PA-2 đề xuất** ((a) một cảnh báo gộp 3 chỗ; (b) bánh cóc CẢNH BÁO ngưỡng 51 — hôm nay 0) · PA-3 ((b) FAIL khi mọc thêm).
2. **Q2 (A4):** câu "trần / làm tròn" đặt K3, câu `getNow` đặt K7 (theo cơ chế + đề xuất GOI-2 :226, :132) — hay đúng chữ phiếu K2/K5?
3. **Q3 (A3):** `cong.js tinh` không chạy A11/A12 chế độ chay (`cong.js:280`, `:285` nằm sau `:216`) — hai câu LUOI-2 hỏi đều ở đó;
   hơn nữa ở bước 4 (chưa commit code) cổng tĩnh ĐẠT không có ✗, còn sau khi commit code thì luôn có `✗ [A19]` (+ `[A8]` với việc
   `tu_chay/`). Duyệt câu skill bước 4 theo PA-A `ke_hoach.md` mục 4: vế chính "tự xét A11/A12 từ `bang_chung_do.txt`, gom một câu
   hỏi"; `cong.js tinh` chỉ kiểm Phạm vi/A7/A17 với file đã commit, nói rõ `[A19]`/`[A8]` ở bước này là bình thường?
4. **Q4 (A1b):** `giaiNen` (`cong.js:40–44`) nuốt lỗi git/tar ở `:266` → cây gốc RỖNG → bài thử đỏ oan được tính "đỏ hợp lệ" (cổng ĐẠT
   oan, nặng hơn sập). Cùng khuôn A1: ném tại `:266` khi `giaiNen` thất bại, 1 dòng + 1 ca; chỉ có đột biến BV-, không có VS- (một
   đường) — lệch chữ A7 "mỗi chỗ vá ≥ 1 VS- + BV-". Làm trong việc này hay chỉ ghi Phát hiện?

## Phát hiện (ngoài phạm vi — không sửa)

1. `server/routes/products.js:56–59` (GET `/` ghi đệm tồn kho — Ràng buộc 8) và `server/routes/sync.js:146–155` (GET `/export` đánh dấu
   đã xuất + log) là route GET có lệnh ghi ngoài packages.js:194 — cần chú thích `// GET-ghi: <lý do>` trong một việc quầy (server/ cấm ở đây).
2. `kiem_tra_truoc_khi_giao.js:86–90` `boGhiChu` thay chú thích khối bằng MỘT khoảng trắng → số dòng trôi; phép E12/E10/P20 dùng nó
   không in số dòng nên chưa lộ. Phép A2 dùng hàm cắt riêng giữ `\n`, không sửa `boGhiChu`.
3. Phiếu / TOC-DO-1 ghi "`git cat-file` thoát 1" khi file không có — đo được **128** (`scratchpad/thu_gitgia.js`). Kế hoạch phân biệt theo
   `status === 0` / `status === null || error` / còn lại.

## Làm tiếp (15.10, chủ quán duyệt kế hoạch 4709f5a; Q1 → PA-2 · Q2 → K3/K7 · Q3 → PA-A mục 4 · Q4 → làm A1b, chỉ BV-)

- Bước 1: nhánh `viec/TU-CHAY-6`, cây sạch, HEAD = FETCH_HEAD = `415a7e7`, không kéo. `git log --oneline -3`:

```
415a7e7 TU-CHAY-6: trang thai buoc 1-3 — SHA doi chieu, so do A5, 4 cau hoi (Q1 A2 3/51 route, Q2 K3/K7, Q3 skill, Q4 A1b), 3 phat hien
4709f5a TU-CHAY-6: ke hoach (cho duyet) — A1 blob/giaiNen, A2 phep tinh route ghi, A3 skill buoc 4, A4 KHUON_LOI, A5 so do, A6 1.6.0; 11 diem soat da gop
dfeaa57 PHIEU: TU-CHAY-6
```
- Phiếu ghi sai một số đo: "file không có" = `git cat-file` thoát **1** — thật ra thoát **128** (đo `scratchpad/thu_gitgia.js`:
  `fatal: path … does not exist`); bị giết → `status null` + `signal SIGKILL`; không có git → `status null` + `error ENOENT`. Chú thích
  `cong.js:30` viết theo số đo này.

## Bước 4–6 (15.10)

- Bài thử đỏ trên gốc (`bang_chung_do.txt`): `thu_cong.js` 330 phép · **6 hỏng** (A1 chay "Received null" + không nêu đường dẫn; A1 tinh
  "Cannot read properties of null (reading 'ban_cai')"; A1b cổng **ĐẠT oan** trên cây rỗng) · `thu_TOCDO1.js` 17 đạt · **3 hỏng** (R0/R0b/R0c)
  · `thu_cong_cu.js` 105 phép · **5 hỏng** (A3 ×2, A4, A6 ×2) · `thu_nguoi_gac.js` **1 hỏng** (PHIEN_BAN). Sau vá: 330/0 · 42/0 · 105/0 ·
  924 ca + 179 phép XANH.
- Lệch so với kế hoạch (soát điểm 4 chọn "thân route tới `router.` kế tiếp"): chạy trên `server/` thật thì hàm phụ giữa hai route
  (`wallets.js:60–119` ghiVi/ghiHoan/loiGhi/trongGiaoDich) bị gộp vào GET `/:phone` → báo oan `wallets.js:67, :271`, (b) 52. Sửa: thân route
  kết ở dòng `});` hoặc `);` cột 0 (orders.js:1357 đóng `},\n);`), chặn ở `router.` kế tiếp; ca R10b đổi thành "hàm phụ CÓ lệnh ghi
  không thuộc route trước"; thêm ca R10c cho dạng `},\n);`. Kết quả thật: (a) `packages.js:194, products.js:57, sync.js:147` · (b) 51.
- `npm test` trên HEAD cây làm việc: **PASS 61 · FAIL 0 · CẢNH BÁO 4** = 1 cảnh báo (a) ba route GET (chốt Q1) + 3 cảnh báo "khớp từng byte"
  (`.claude/tu_chay/` lệch 8 file, SKILL.md, ra-soat.md — chờ chủ quán `bash tu_chay/cai_dat.sh`; máy không chép sang `.claude/`).
  `thu_cong.js` trong bộ kiểm 73,3 s (< 120 s). `cong.js tinh . dfeaa57^ HEAD viec/TU-CHAY-6` → ĐẠT (file chưa commit không được soi).
- `python3 viec/HOC-2b/kiem_neo.py`: HỎNG có sẵn trên gốc, không do việc này — HOC-2 `VS-E3-phien-ban-cu` neo "tu-chay 1.4.0" (gốc đã
  1.5.0), HOC-2b/khác neo `refunds.js`, `damages.js` (việc này không đụng). Không có neo nào đụng dòng TU-CHAY-6 sửa.
- Người gác chặn thêm trong lượt này: `B-PHANTICH` (`$'…'` trong grep), `B-TENCHU` (nhóm `{ … } > file`), `B-CHUONGTRINH` (`for`) —
  đều cách viết lệnh, viết lại thành script trong scratchpad.

### Chỗ vá → đột biến (`viec/TU-CHAY-6/dot_bien.py`, 18 đột biến; A7: A1b chỉ BV- theo chốt Q4)

| Chỗ vá | BV- | VS- | Ca bắt |
|---|---|---|---|
| `cong.js` blob ném khi git không chạy được | `BV-TUCHAY6-BLOB-NULL` | `VS-TUCHAY6-BLOB-NUOT-SIGNAL` · `VS-TUCHAY6-BLOB-NEM-128` | A1 chay · A1 chay · A14 `khong [CONG]` |
| `cong.js` blob ngoài `try` (A8 đọc cau_hinh / settings) | `BV-TUCHAY6-BLOB-TRONG-TRY` | — (ném đã khoá ở blob) | A1 tinh cau_hinh.json |
| `cong.js` giaiNen cây gốc ném (A1b) | `BV-TUCHAY6-ARCHIVE-NUOT` | — (một đường, chốt Q4) | A1b |
| `kiem_tra` E14 gọi quét | `BV-TUCHAY6-A2-BO-GOI` | — | R0b |
| `kiem_tra` quetRouteGhi | — | `VS-TUCHAY6-A2-QUEN-INSERT` · `VS-TUCHAY6-A2-MIEN-THEO-FILE` · `VS-TUCHAY6-A2-QUEN-TXRUN` · `VS-TUCHAY6-A2-CUNG-DONG` · `VS-TUCHAY6-A2-NUOT-HAM-PHU` | R2 · R3d · R2b · R1b · R10b |
| `kiem_tra` xetBanhCoc | — | `VS-TUCHAY6-A2-NGUONG-LON-HON-BANG` | R11 |
| skill bước 4 | `BV-TUCHAY6-SKILL-B4` | `VS-TUCHAY6-SKILL-CHAY-THAY-TINH` | A3 skill |
| lenh_ra_soat | `BV-TUCHAY6-RASOAT-CUOI` | — | A3 ra-soát |
| KHUON_LOI K4 | `BV-TUCHAY6-KHUONLOI-K4` | — | A4 |
| PHIEN_BAN | `BV-TUCHAY6-PHIENBAN-CU` | — | A6 ở `thu_cong_cu.js` VÀ `thu_nguoi_gac.js` |
| THIET_KE B15 | `BV-TUCHAY6-THIETKE-B15` | — | A6 THIET_KE |

### Đột biến — ba lần chạy (`dot_bien.py`)
- Lần 1: **đối chứng `thu_cong` ĐỎ** trên bản sao (bản thật xanh) → DỪNG đúng K3. Truy nguyên: `thu_cong.js:643–647` B5 băm
  `.github/workflows/keep-alive.yml` qua `__dirname/..` — bản sao thiếu file. Sửa: chép thêm file này (commit `dot_bien.py`).
- Lần 2: 12/18 bắt. 6 "KHÔNG bắt" truy nguyên: (a) 3 ca bị xếp nhầm vì bộ lọc sập/ném khớp chữ "sập"/"ném" trong TÊN ca (`ARCHIVE-NUOT`,
  `KHUONLOI-K4`, `NEM-128`) → lọc theo dạng `<bài> sập: ` / `khối ném: `; riêng `NEM-128` còn làm `baiCong` sập thật ở đoạn gọi `cong()`
  trong tiến trình (không bọc try) → bọc, phép đột-biến-tắt đỏ thay vì sập cả bài; (b) `BLOB-TRONG-TRY` sống: ca `cau_hinh.json` bị che
  vì `cong.js` đọc lại cùng file ở bước so bản cài → thêm ca `.claude/settings.json` (chỉ A8 đọc qua try) `khong: ['[A8]']`, đột biến
  hoàn cả hai chỗ try; (c) `QUEN-INSERT` neo khớp 2 lần (E12 cùng regex) → neo nguyên dòng `const GHI`; (d) `THIETKE-B15` đột biến
  không gỡ neo nào → gỡ cụm `git cat-file hỏng`.
- Lần 3 (HEAD `thu_cong.js` 334 phép): **đối chứng 4/4 xanh · 18/18 bị bắt · 0 không bắt**. Bằng chứng đỏ ghi lại lần 2 (A16): gốc 334 phép ·
  7 hỏng, head 334 · 0.
- Hook dừng của môi trường (`kiem_truoc_khi_dung.cjs`) chạy `npm test` chồng lên chuỗi nền → `thu_cong.js` trong hook 120,1 s ETIMEDOUT
  (chạy riêng 73 s). Không nới hạn; chạy lại riêng ở bước 6 (bên dưới).

### Bước 6 — kiểm trên HEAD 2e43901 (chạy RIÊNG, tuần tự)
- `npm test`: **PASS 61 · FAIL 0 · CẢNH BÁO 4** · `--day-du`: **PASS 65 · FAIL 0 · CẢNH BÁO 4**. Bốn cảnh báo = 1 cảnh báo E14 (a) ba route
  GET có ghi (chốt Q1) + 3 cảnh báo "khớp từng byte" (`.claude/tu_chay/` 8 file, SKILL.md, ra-soat.md) — chờ chủ quán `bash tu_chay/cai_dat.sh`.
- A5 đo lại 3 lần riêng trên HEAD: `thu_nguoi_gac.js` 11,3 / 11,9 / 10,2 s · `thu_cong_cu.js` 5,3 / 5,1 / 5,7 s → vẫn < 30 s, **không đổi**.
- **Máy mây chậm đi trong ngày — báo chủ quán, không nới hạn:** `thu_cong.js` HEAD chạy riêng 116,8 s (trong `npm test` 112–117 s, hạn
  120 s); đo lại NGAY SAU đó bản `thu_cong.js` + `cong.js` GỐC dfeaa57 (318 phép) trên cùng máy: **112,9 s** (sáng nay 67,9 s). Mọi bài
  đều chậm ~1,7× (A5 6 s → 11 s), không có tiến trình lạ (`ps -A`). Phần việc này thêm ≈ 4 s (4 ca cổng mới). Hook dừng của môi trường chạy
  `npm test` khi máy chậm → `thu_cong.js` ETIMEDOUT 120,1 s một lần (xem trên). Cùng hiện tượng TOC-DO-1 ghi (máy mây AUDIT-2 119–126 s).
  → Phát hiện: chia `thu_cong.js` thành lượt song song (AU2-10) — phiếu đã dặn "nếu A5 đo thấy cần thì ghi Phát hiện", không làm ở đây.
- `cong.js tinh . dfeaa57^ HEAD viec/TU-CHAY-6` trên HEAD đã commit: chỉ `✗ [A8]` (bản cài lệch, chờ cài) + `✗ [A19]` (chưa tới 11.4) —
  đúng hai dòng câu skill mới nói là bình thường ở bước này.
- Số dòng (`git diff --numstat dfeaa57..HEAD`): code bộ khung +55 −3 (`cong.js` +10 −3, `kiem_tra` +45) · thử JS +112 −8 ·
  `dot_bien.py` 155 · luật/skill +16 −2 · THIET_KE +19. Thử vượt ngân sách "~120 dòng" vì khuôn đột biến có đối chứng + bản sao chép thật
  và 23 ca R cho phép tĩnh mới.
