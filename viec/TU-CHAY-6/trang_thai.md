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
4. (soát vòng 1) `server/routes/customers-v2.js:109, :201, :397, :459` — bốn route GET gọi `fetchSXCustomers()` (:23) → `cacheCustomersToLocal()`
   (:36) → `run(INSERT INTO pos_customers …)` (:57–58): GET có lệnh ghi QUA HÀM PHỤ, phép E14 (chỉ soi thân route) không thấy. Cùng cơ chế:
   wallets.js POST ghi qua `ghiVi`/`reconcileWallet` không tính là "route ghi" ở (b) (cả 5 đều đã `loiGhi`, số 51 không đổi). Việc quầy quyết.
5. (soát vòng 1) `tu_chay/cong.js:236` `giaiNen(thuMuc, head, cai, 'tu_chay')` vẫn bỏ qua kết quả: `tu_chay/` chắc có ở head nên thất bại chỉ
   là git/tar hỏng → hệ quả `cai_dat.js` không có → `[A8] cai_dat.js của PR chạy hỏng` (ĐỎ nhưng lý do lạc hướng, không ĐẠT oan). Cùng khuôn A1b, 1 dòng.
6. (soát vòng 1) `cong_cu/thu_TOCDO1.js` không nằm trong `npm test` / `lenh_bai_thu` / `file_luat` → 23 ca R chỉ chạy khi PR sửa chính nó hoặc
   chạy tay (tiền lệ TOC-DO-1). Miễn `// GET-ghi:` xét dòng từ khoá / dòng `run(` / dòng trên `run(`: dạng `const sql = 'UPDATE…'; run(sql)` (từ
   khoá TRƯỚC `run(`) thì chú thích ngay trên từ khoá không miễn — ba route thật hôm nay không ở dạng này.

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

### Chỗ vá → đột biến (`viec/TU-CHAY-6/dot_bien.py`, 18 đột biến)

**Lệch chữ A7 "mỗi chỗ vá ≥ 1 VS- + BV-" — nói thẳng (soát vòng 1):** (1) A1b chỉ BV- (chủ quán miễn, Q4); (2) hai chỗ `blob` ngoài try
chỉ BV- — "vá sai" ở đây chỉ có một dạng là để lại trong try, chính là BV; (3) dòng gọi E14 chỉ BV-, hai hàm E14 chỉ VS- — `BV-A2-BO-GOI` đã
là "bỏ vá" của cả khối; (4) các chỗ vá là CHỮ (lenh_ra_soat, KHUON_LOI K4, PHIEN_BAN, THIET_KE) chỉ BV- — "vá sai" cho chữ không có nghĩa
tất định, riêng skill có VS- (`chay` thay `tinh`); (5) bốn câu KHUON_LOI K1/K3/K3/K7 không có đột biến riêng — phép A4 canh 6 neo, chỉ K4
có BV. Chủ quán chốt: chấp nhận hay đòi thêm.

| Chỗ vá | BV- | VS- | Ca bắt |
|---|---|---|---|
| `cong.js` blob ném khi git không chạy được | `BV-TUCHAY6-BLOB-NULL` | `VS-TUCHAY6-BLOB-NUOT-SIGNAL` · `VS-TUCHAY6-BLOB-NEM-128` | A1 chay · A1 chay · A14 `khong [CONG]` |
| `cong.js` blob ngoài `try` (A8 đọc cau_hinh / settings) | `BV-TUCHAY6-BLOB-TRONG-TRY` | — (ném đã khoá ở blob) | A1 tinh cau_hinh.json |
| `cong.js` giaiNen cây gốc ném (A1b) | `BV-TUCHAY6-ARCHIVE-NUOT` | — (một đường, chốt Q4) | A1b |
| `kiem_tra` E14 gọi quét | `BV-TUCHAY6-A2-BO-GOI` | — (BV đã là bỏ vá cả khối) | R0b |
| `kiem_tra` quetRouteGhi | — (BV-A2-BO-GOI che) | `VS-TUCHAY6-A2-QUEN-INSERT` · `VS-TUCHAY6-A2-MIEN-THEO-FILE` · `VS-TUCHAY6-A2-QUEN-TXRUN` · `VS-TUCHAY6-A2-CUNG-DONG` · `VS-TUCHAY6-A2-NUOT-HAM-PHU` | R2 · R3d · R2b · R1b · R10b |
| `kiem_tra` xetBanhCoc | — (BV-A2-BO-GOI che) | `VS-TUCHAY6-A2-NGUONG-LON-HON-BANG` | R11 |
| skill bước 4 | `BV-TUCHAY6-SKILL-B4` | `VS-TUCHAY6-SKILL-CHAY-THAY-TINH` | A3 skill |
| lenh_ra_soat | `BV-TUCHAY6-RASOAT-CUOI` | — (chữ) | A3 ra-soát |
| KHUON_LOI K4 (K1/K3/K7 không đột biến riêng) | `BV-TUCHAY6-KHUONLOI-K4` | — (chữ) | A4 |
| PHIEN_BAN | `BV-TUCHAY6-PHIENBAN-CU` | — (chữ) | A6 ở `thu_cong_cu.js` VÀ `thu_nguoi_gac.js` |
| THIET_KE B15 | `BV-TUCHAY6-THIETKE-B15` | — (chữ) | A6 THIET_KE |

### Đột biến — ba lần chạy (`dot_bien.py`)
- Lần 1: **đối chứng `thu_cong` ĐỎ** trên bản sao (bản thật xanh) → DỪNG đúng K3. Truy nguyên: `thu_cong.js:647–651` B5 băm
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

## Bước 8 — soát độc lập (agent general-purpose, 37 lượt công cụ, nộp bằng SubagentHandback) — chép nguyên

```
KHÔNG ĐẠT (nhẹ — code bộ khung đúng, bài thử có giá trị; còn 3 chỗ hồ sơ/luật sai dẫn chứng hoặc nói quá code, sửa ≈ 4 dòng rồi ĐẠT)

LỖI TÌM ĐƯỢC:
1. KHUON_LOI.md:46 — câu K3 mới ghi "(B3c: 0,002, không 0,5)" dẫn SAI việc gốc: GOI-2 B3c là "giá niêm yết 1.350.000 bị trần `total − đã nhận` kéo về 1.215.000 → vá sai công thức vẫn ra đúng số" (viec/GOI-2/trang_thai.md:215, :227); số 0,002 là ca `pkg_qty` S2b của SO-LUONG-1 (viec/SO-LUONG-1/trang_thai.md:172, :190 — bài học khác: hợp lệ hoá số lẻ, không phải "trần che lỗi"). Việc này vừa thêm K1 "chú thích/luật cũng là khẳng định" rồi tự vi phạm ở dòng cách đó 30 dòng. Sửa: "(GOI-2 B3c: chọn số dưới trần, 1.350.000 bị trần kéo về 1.215.000 nên đột biến vẫn xanh)". Phép A4 (thu_cong_cu.js:467) neo 'không che lỗi' không vỡ. — K1.
2. kiem_tra_truoc_khi_giao.js:523 (+ tu_chay/THIET_KE.md:891, trang_thai Q1 "3 route GET có lệnh ghi") — chú thích nói "(a) route GET có lệnh ghi" nhưng code chỉ bắt `run(` + từ khoá NẰM TRONG THÂN route (:548–552). Đọc server thật: customers-v2.js:109, :201, :397, :459 (4 route GET) gọi `fetchSXCustomers()` :23 → `cacheCustomersToLocal()` :36 → `run(INSERT INTO pos_customers …)` :57–58 = GET có lệnh ghi qua hàm phụ, E14 KHÔNG thấy (script quét trong scratchpad xác nhận: (a) chỉ packages.js:194, products.js:57, sync.js:147). Đúng chữ phiếu A2 ("route GET có run( với UPDATE|INSERT|DELETE") nên không đòi sửa phép; nhưng chú thích + THIET_KE + trang_thai phải ghi giới hạn "chỉ lệnh ghi trực tiếp trong thân route, không theo hàm phụ" và ghi Phát hiện 4 route customers-v2 cho việc quầy. (Cùng cơ chế: wallets.js:121/:152/:187/:284/:300 POST ghi qua `ghiVi`/`reconcileWallet` không được tính "route ghi" ở (b) — không đổi số 51 vì cả 5 đều `loiGhi(` :141/:177/:217/:291/:314.) — K1 (+ K4: phép theo thân route, đường ghi qua hàm phụ là đường song song chưa ghi nhận).
3. viec/TU-CHAY-6/trang_thai.md bảng "Chỗ vá → đột biến" — A7 phiếu đòi "mỗi chỗ vá ≥ 1 VS- + BV-", chủ quán chỉ miễn VS- cho A1b (Q4). Thực tế: E14 dòng gọi (BV, không VS), `quetRouteGhi`/`xetBanhCoc` (VS, không BV riêng — BV-BO-GOI che được, chấp nhận), lenh_ra_soat / KHUON_LOI K4 / PHIEN_BAN / THIET_KE (chỉ BV, ô VS để "—" trống không lý do), và 4 câu KHUON_LOI K1/K3/K3/K7 không có đột biến nào (phép A4 canh 6 neo, chỉ K4 có BV). Với chữ thì VS- vô nghĩa — nhưng phải NÓI THẲNG trong trang_thai (như đã làm cho A1b) để chủ quán chốt, không để ô trống. — K3/K1 (hồ sơ).

NGHI NGỜ:
- tu_chay/cong.js:236 `giaiNen(thuMuc, head, cai, 'tu_chay')` vẫn bỏ qua kết quả: `tu_chay/` CHẮC CHẮN có ở head (được :233 bảo vệ) nên thất bại ở đây luôn là git/tar hỏng — hệ quả: `cai_dat.js` không tồn tại → :239 báo `[A8] cai_dat.js của PR chạy hỏng` (ĐỎ nhưng lý do lạc hướng, không phải ĐẠT oan như :273). :235 (`.claude` ở mốc, 128 hợp lệ) đúng là phải bỏ qua. Cùng khuôn A1b, 1 dòng — ke_hoach mục 2 ghi ":230 giữ" với lập luận "đã trong nhánh blob !== null" là lập luận cho việc NÉM chứ không phải giữ. Không chặn ĐẠT (không ĐẠT oan).
- viec/TU-CHAY-6/ke_hoach.md mục 2 "Hai chỗ nuốt ném": ghi gốc "`JSON.parse(null)` → `{}` → cổng ĐẠT, không ✗" — sai: `JSON.parse(null)` = `null` → `chH.ban_cai` TypeError :144 → `[CONG]` sập (bang_chung_do.txt dòng A1 tinh xác nhận "Cannot read properties of null (reading 'ban_cai')"). trang_thai đúng, ke_hoach sai — K1 nhỏ.
- trang_thai "thu_cong.js:643–647 B5 băm keep-alive.yml" → thật là :648–652 (:641–647 là A15). Trôi dòng, K1 nhỏ.
- cong_cu/thu_TOCDO1.js không nằm trong `npm test` / `lenh_bai_thu` / `file_luat` (grep: chỉ chú thích kiem_tra:529, :600) → 23 ca R chỉ chạy khi PR SỬA chính nó hoặc chạy tay; sửa `quetRouteGhi` sau này không có lưới tự động. Tiền lệ TOC-DO-1, không phải lỗi của việc này.
- kiem_tra:552 miễn `GET-ghi` xét `[iGhi, iRun, iRun-1]`: khi từ khoá đứng TRƯỚC `run(` (dạng `const sql = 'UPDATE…'; run(sql)`), `iRun` lùi tới dòng `router.` → chú thích "ngay trên lệnh" (iGhi−1) KHÔNG miễn, còn chú thích trên dòng `router.get(` lại miễn. Ba route thật hiện nay không ở dạng này (packages :194 cùng dòng; products run :56/kw :57; sync run :146/kw :147) nên không chặn oan hôm nay.

NGHIỆM THU: 7/7 mục có bằng chứng · mục thiếu: không (A7 có vết lệch chữ ở Lỗi 3 — chờ chủ quán chốt).
- A1: cong.js:33–37 ném khi `status === null || error`, 128 → null; :141–143, :156–158 blob ngoài try; :273 A1b. Ca thu_cong.js:486–496 (4 ca, `khong: ['Received null']` = vắng mẫu nguy hiểm E13, `soLyDo: 1`, `chua` là đường dẫn không phải câu của mình E12); K5 ca A14 :274–275 `khong: ['[CONG]']` (128 vẫn null, cong.js:106). Đỏ trên gốc: bang_chung_do.txt 7 hỏng/334 khớp code gốc (tôi đối chiếu: gốc `? r.stdout : null` → writeFileSync(null)). Tôi chạy lại HEAD: 334 phép · 0 hỏng. Ba chỗ ghi null cũ nay :275/:332/:334 — p ∈ baiThu (st ≠ 'D') / daMien (blob(moc) ≠ null ở :263) → không còn đường nhận null.
- A2: kiem_tra:531–565 (xetBanhCoc, quetRouteGhi, gọi 1 lần). Ca thu_TOCDO1.js:118–186 R0–R11b + K5 (tôi chạy: 42 đạt · 0 hỏng; gốc 3 hỏng R0/R0b/R0c đúng vì hàm chưa có). Quét server thật (script riêng): (a) 3 chỗ, (b) 51; ranh giới 136 route cột 0 — kết theo `});`/`);` cột 0 TRÙNG kết theo đếm ngoặc ở CẢ 136 route, không `router.` thụt đầu dòng, không `router.use/all/route`; orders.js:1357–1520 `},\n);` đúng. Marker suông: R3c (lý do rỗng vẫn báo), R3d (GET-ghi ở route khác không miễn) + đột biến MIEN-THEO-FILE bị bắt (tôi chạy). Chú thích giữ `\n`: :540 thay từng ký tự trừ `\n`, `tho[i]`/`sach[i]` thẳng hàng; R6 canh.
- A3: skill_lam_viec.md:56–60 (trong mục `4. **`, muc(sk,'\n4. **','\n5. **') thu_cong_cu.js:462–464); lenh_ra_soat.md:71–73; phép thu_cong_cu.js:465–466. H3/F1 không vỡ (105/0 tôi chạy; H3 MOC không chứa chữ mới; F1 neo `\n11. ` không khớp "11.4)").
- A4: KHUON_LOI.md 112 dòng (≤120), K1:17, K3:45–46, K4:62–63, K7:89–90 (Q2 chốt K3/K7); phép thu_cong_cu.js:467–468. Dẫn chứng orders.js:198 ✓ (nay :199, SO-LUONG-1 trang_thai:91); B3c ✗ (Lỗi 1).
- A5: số đo 6/3 s rồi 11/5 s < 30 s → không đổi, đúng phiếu.
- A6: PHIEN_BAN 1.6.0; thu_cong_cu.js:459 + thu_nguoi_gac.js:709 (grep toàn kho: chỉ `.claude/tu_chay/*` còn 1.5.0 — cấm sửa, đúng); THIET_KE.md:883–900; phép :469–470.
- A7: thu_TOCDO1 42/0, thu_cong_cu 105/0, thu_cong 334/0 (tôi chạy riêng, tuần tự); dot_bien.py: 18 neo khớp đúng n (kiểm tĩnh), đối chứng + 3 đột biến rẻ tôi chạy 3/3 bị bắt; bộ lọc sập `\bsập: |\bném: ` khớp đúng dạng in của thu_cong.js:722, thu_cong_cu.js:509, thu_nguoi_gac.js:1124, thu_TOCDO1.js:71/:104; bản sao chép thật + realpath (dot_bien.py:80–93). kiem_neo.py HỎNG 3 neo cũ đều ở server/refunds/damages/PHIEN_BAN 1.4.0 — diff không đụng server → có sẵn trên gốc.
- Đường tiền / P1: `git diff dfeaa57^ HEAD --stat -- server client` rỗng → không trường tiền, không cần build dist. A7 cổng: phiếu chỉ đổi ở `dfeaa57 PHIEU: TU-CHAY-6`.

CHƯA SOÁT ĐƯỢC: không chạy `npm test`/`--day-du` (4 phút, trang_thai ghi 61/0/4 và 65/0/4) và không chạy 15 đột biến còn lại (6 đột biến thu_cong ≈ 115 s/lần — chỉ kiểm tĩnh neo); không chạy được bài thử trên gốc (không checkout) — đỏ trên gốc đối chiếu bằng đọc code gốc qua diff + bang_chung_do.txt; không kiểm được thu_cong 117 s sát hạn 120 s trên máy GitHub (A13 có thể ETIMEDOUT — đã báo chủ quán trong trang_thai, không nới).

BÀI HỌC:
- KHOÁ: phép chữ cho KHUON_LOI nên neo CẢ mã việc + con số dẫn chứng của câu mới (vd 'GOI-2' gần 'trần') — dẫn chứng sai việc gốc hiện không phép nào bắt (Lỗi 1).
- KHOÁ: ca K5 server thật của thu_TOCDO1 hoặc một phép tĩnh nhỏ nên liệt kê "route GET gọi hàm phụ có ghi" (grep tên hàm có `run(`+từ khoá ở cột 0 rồi tìm trong thân GET) — hoặc ghi rõ giới hạn vào chú thích E14 (Lỗi 2).
- NGUYÊN TẮC (K1): câu "đo được X" phải trỏ đúng việc có số X; chép ví dụ từ phiếu sang luật vẫn phải mở hồ sơ việc gốc kiểm lại con số (phiếu cũng là hồ sơ, không phải code).
- NGUYÊN TẮC (K4): phép tĩnh định nghĩa theo "thân route" → ghi ngay giới hạn "không theo hàm phụ" và liệt kê hàm phụ có ghi trong file làm Phát hiện; đường ghi qua helper là đường song song của mọi phép quét route.
- BỎ: không cần thêm ca cho :236 nếu chủ quán coi A8 "cai_dat.js chạy hỏng" là đủ rõ — chỉ ghi Phát hiện.
```

### Sửa sau soát vòng 1 (đã kiểm lại ba lỗi bằng code: customers-v2.js:23/:36/:57–58/:109/:201/:397/:459; thu_cong.js:652; GOI-2 trang_thai:206, :227)
- Lỗi 1 → `KHUON_LOI.md` K3: "(GOI-2 B3c: trần kéo 1.350.000 về 1.215.000 nên vá sai công thức vẫn ra đúng số)" (113/120 dòng). Phiếu A4 ghi ví dụ
  "0,002 chứ không 0,5" — ví dụ của phiếu lẫn việc (SO-LUONG-1), máy chép theo mà không mở hồ sơ gốc → đúng K1 vừa viết; sửa theo hồ sơ GOI-2.
- Lỗi 2 → chú thích E14 (`kiem_tra`) + THIET_KE B15 ghi giới hạn "chỉ lệnh ghi NẰM TRONG thân route, không theo hàm phụ"; Phát hiện 4
  (customers-v2.js). Không đổi phép (đúng chữ phiếu A2).
- Lỗi 3 → bảng đột biến: đoạn "Lệch chữ A7 — nói thẳng" + lý do ở từng ô VS- trống. Chờ chủ quán chốt.
- Nghi ngờ: `ke_hoach.md` câu `JSON.parse(null)` sửa đúng; số dòng B5 → :648–652; `:236` và thu_TOCDO1 ngoài `npm test`, miễn GET-ghi dạng từ khoá
  trước `run(` → Phát hiện 5, 6. Không đổi code chạy.
- Chạy lại sau sửa: `thu_cong_cu.js` 105/0 · `thu_TOCDO1.js` 42/0 · `npm test` (bên dưới).

## Câu hỏi 5 (sau bước 8 — chờ chủ quán; KHÔNG chặn giao hồ sơ, nhưng `npm test` trên máy này đang sát/qua hạn)

`thu_cong.js` trên máy mây này trong NGÀY chậm dần: gốc dfeaa57 (318 phép) 67,9 s sáng → 112,9 s → 111,3 s chiều; HEAD (334 phép, git giả
node) 116,8 → 122,9 s **một mình** → `npm test` đỏ `ETIMEDOUT 120 s` (3 lần: 2 lần do hook dừng chạy chồng, 1 lần một mình). Việc này
thêm ≈ 4–12 s (4 lần cổng chạy với git giả; nhiễu ±5 s). Đã làm trong phạm vi: git giả đổi node → bash (như `thu_cong_cu.js`) → HEAD
**117,5 s** một mình (334/0). Không nới hạn 120 s (phiếu Cấm, K8); không chia lượt song song (phiếu dặn chỉ ghi Phát hiện). Chủ quán chọn:
(a) chấp nhận — máy GitHub của cổng đo TU-CHAY-5 66 s, bộ kiểm trong `cong.js chay` vẫn hạn 120 s/bài nên ngày máy chậm sẽ đỏ như hôm nay;
(b) mở việc chia `thu_cong.js` thành lượt song song (AU2-10, khuôn TACH-GL) — Phát hiện 7; (c) cách khác chủ quán chốt. Hook dừng
`kiem_truoc_khi_dung.cjs` tự chạy `npm test` mỗi lần máy dừng → chồng với bài đang đo (ETIMEDOUT 120,1 s ×2) — ghi nhận, không sửa `.claude/`.

## Bước 8 — soát vòng 2 (agent mới, chỉ đọc; `SendMessage` nối tiếp agent cũ bị người gác chặn CC-LA như SO-LUONG-1) — chép nguyên

```
ĐẠT (ba lỗi vòng 1 đã sửa đúng; 1 việc phải làm CÙNG commit git giả bash đang chờ — số dòng B5 sẽ trôi 1)

LỖI TÌM ĐƯỢC:
- `viec/TU-CHAY-6/trang_thai.md:114` (và :155, :185 trích lại) ghi B5 `thu_cong.js:648–652` — ĐÚNG ở HEAD cc5432d (`git show HEAD:tu_chay/thu_cong.js` → :648/:652), nhưng working tree đã đổi git giả node→bash (−1 dòng: bỏ 5 thêm 4, `git diff -- tu_chay/thu_cong.js`) → B5 nay ở **:647–651** (`grep -n "// B5:" tu_chay/thu_cong.js` → 647, chac → 651). Commit bash mà không sửa thì tái phạm đúng lỗi trôi dòng vòng 1 (K1). Sửa 3 chỗ trong cùng commit.
- Trong script bash git giả: không.

ĐÃ SOÁT ĐÚNG (file:dòng đọc lượt này):
1. K3: `KHUON_LOI.md:45–47` "(GOI-2 B3c: trần kéo 1.350.000 về 1.215.000 nên vá sai công thức vẫn ra đúng số)" khớp `viec/GOI-2/trang_thai.md:215` ("giá niêm yết 1.350.000 bị kéo về 1.215.000") và `:227–228` ("vá sai công thức vẫn ra đúng số nhờ trần"). `wc -l` = 113 ≤ 120. Bullet 45–47 gồm 2 câu: câu 1 dòng 45–46, câu 2 dòng 46–47 → mỗi câu ≤ 2 dòng (phiếu :33). Neo A4 'không che lỗi' còn (`thu_cong_cu.js:467–468`; tôi chạy `thu_cong_cu` 105/0).
2. E14: `kiem_tra_truoc_khi_giao.js:530–531` có "GIỚI HẠN … chỉ thấy lệnh ghi NẰM TRONG thân route; ghi qua hàm phụ (customers-v2.js …) không bắt"; `tu_chay/THIET_KE.md:894–895` "Giới hạn: chỉ lệnh ghi nằm TRONG thân route — ghi qua hàm phụ … không thấy". `grep -n "quetRouteGhi(\|xetBanhCoc("` → đúng 2 lần mỗi tên (:533/:564, :536/:561), chú thích mới không chứa. Tôi chạy `node cong_cu/thu_TOCDO1.js` → **42 đạt · 0 hỏng** (R0b đạt).
3. trang_thai: đoạn "Lệch chữ A7 — nói thẳng" (`:92–96`) nêu đủ 5 điểm vòng 1 đòi (A1b Q4; blob ngoài try; E14 dòng gọi/2 hàm; 4 chỗ chữ; K1/K3/K3/K7 không đột biến) + ô VS- trống đều có lý do. Phiếu A7 `phieu.md:39` đúng chữ "≥ 1 VS- + BV-"; Q4 `trang_thai:60`. Phát hiện 4: `server/routes/customers-v2.js:23` fetchSXCustomers, `:36` gọi cacheCustomersToLocal, `:57–58` `run(INSERT INTO pos_customers`, GET `:109/:201/:397/:459` (gọi ở :116/:203/:404/:466) ✓; wallets.js POST `:121/:152/:187/:284/:300`, loiGhi `:141/:177/:217/:291/:314` ✓. Phát hiện 5: `tu_chay/cong.js:233` guard cai_dat.js, `:236` `giaiNen(thuMuc, head, cai, 'tu_chay')` bỏ kết quả, `:239` "cai_dat.js của PR chạy hỏng" ✓. Phát hiện 6: `package.json:9` test = kiem_tra; `cau_hinh.json:2` lenh_bai_thu ["npm test"]; `:6` file_luat không có thu_TOCDO1 (grep rỗng); miễn GET-ghi `kiem_tra:551–552`: từ khoá trước `run(` → `iRun` lùi tới `r.i`, xét `[iGhi, r.i, r.i−1]` (r.i−1 bị loại vì `< r.i`) → chú thích ngay trên từ khoá không miễn ✓. ke_hoach `:73` "JSON.parse(null) = null → chH.ban_cai TypeError → [CONG] không nêu đường dẫn" đúng: gốc `git show dfeaa57:tu_chay/cong.js` :138–139, `bang_chung_do.txt` dòng 10 "Cannot read properties of null (reading 'ban_cai')".
4. Git giả bash `tu_chay/thu_cong.js:109–115` (CHƯA commit): `[[ "$*" =~ $GIET_KHOP ]]` — vế phải không ngoặc kép ✓, vế trái ngoặc kép ✓; ERE `[.]`, `[^ ]+` đúng (:486/:488/:491/:494); `kill -KILL $$` trước `exec` → cha thấy `status null` + SIGKILL, khớp `cong.js:33` `r.status === null || r.error`; `exec "$GIT_THAT" "$@"` truyền nguyên mã thoát (bản node map null→1 — bash sát hơn); `GIT_THAT` tính `:112` TRƯỚC khi chèn gitgia vào PATH ✓; `envSach` `:30` lọc `GIT_` nhưng `gitGia` `:115` thêm lại GIT_THAT sau spread ✓; `cong.js:23` envCon không lọc PATH/GIET_KHOP ✓; mẫu archive `[^ ]+$` chỉ khớp lệnh không đường dẫn (`cong.js:45` có `...duong`) ✓; chmod 755 `:114` ✓. Chú thích "như thu_cong_cu.js" đúng (`thu_cong_cu.js:34` git giả bash); "~40 ms/lần" đo 59/40/45 ms; "~30 lần" tĩnh 35 chỗ gọi git/blob/giaiNen — xấp xỉ chấp nhận. Phạm vi phiếu `:44` có `tu_chay/thu_cong.js`; Cấm `:70` không nới 120 s — không vi phạm; `:57` không chia lượt song song — giữ.

NGHI NGỜ:
- Bằng chứng đỏ trên gốc (`bang_chung_do.txt` lần 2) ghi với git giả NODE; bản bash chưa chạy lại trên gốc. A16 chỉ so SỐ CA (334 không đổi) nên không bắt. Tự chứng: ca A1 'ĐỎ' cần kill xảy ra mới đạt, nên "HEAD 334/0 bash" trong Câu hỏi 5 (nếu đúng) đã chứng kill hoạt động — nhưng tôi không chạy được thu_cong để xác nhận con số đó.
- "Câu hỏi 5" ghi "gốc dfeaa57 (318 phép)" — không kiểm được số 318 (không chạy gốc).
- Chú thích `thu_cong.js:109–111` và trang_thai Câu hỏi 5 có nhiều con số đo (123 s, 117,5 s, ~5 s) — khẳng định K1 từ số đo một máy một ngày; đã ghi "nhiễu ±5 s", chấp nhận.

CHƯA SOÁT ĐƯỢC: không chạy `thu_cong.js`, `npm test`, `--day-du` (theo lệnh — máy đang đo); không chạy đột biến; không checkout gốc. Hành vi kill của bash giả chỉ soát bằng đọc code + cơ chế spawnSync, chưa thấy dòng ✗/✓ thật.

BÀI HỌC:
- KHOÁ (K1 trôi dòng): hồ sơ trích `file:dòng` của file ĐANG sửa trong cùng việc → kiểm lại số dòng ở bước commit cuối, không ở bước viết (vòng 1 vừa sửa 643→648, bash lại đẩy về 647).
- NGUYÊN TẮC (K3/A16): đổi CƠ CHẾ của bài thử (git giả node→bash) không đổi số ca nên A16 im lặng; cần một câu trong trang_thai nói rõ vì sao HEAD xanh tự chứng cơ chế mới hoạt động (ca ĐỎ chỉ đạt khi kill xảy ra).
- BỎ: không đòi chạy lại bằng chứng đỏ trên gốc cho đổi bash — ca ĐỎ tự chứng; chỉ ghi một dòng vào trang_thai.
```

Sau vòng 2: B5 → `:647–651` (3 chỗ); bằng chứng đỏ với git giả bash VẪN chạy lại trên gốc (bản sao `cong.js` chưa vá) + 5 đột biến `thu_cong` chạy
lại — kết quả ở mục "Kiểm cuối" dưới; A16 im lặng vì SỐ CA 334 không đổi, nên tự chứng ở đây: ca A1/A1b chỉ ĐẠT khi SIGKILL thật xảy ra
(gốc 7 hỏng / HEAD 0 hỏng với cùng git giả bash).

## Bài học (bước 11)

Sự cố gom được: (1) đối chứng `dot_bien.py` đỏ vì bản sao thiếu `keep-alive.yml`; (2) bộ lọc sập/ném khớp chữ trong TÊN ca → 3 đột biến báo
"không bắt" oan; (3) `baiCong` sập khi `cong()` ném trong tiến trình (đột biến NEM-128); (4) `BLOB-TRONG-TRY` sống vì đường đọc lại cùng file
che; (5) neo `QUEN-INSERT` khớp 2 lần; (6) đột biến `THIETKE-B15` không gỡ neo nào; (7) người soát bắt dẫn chứng B3c chép sai từ phiếu, phép
E14 chưa ghi giới hạn hàm phụ, ô VS- trống không lý do, số dòng B5 trôi hai lần; (8) máy mây chậm 1,7× trong ngày → `thu_cong.js` sát/qua hạn
120 s; (9) hook dừng chạy `npm test` chồng lên bài đang đo; (10) người gác chặn 7 lệnh: B-DICHCHU, B-CHUONGTRINH ×2 (`for`), B-PHANTICH
(`$'…'`), B-TENCHU (`{ } > file`), B-BIMAT-CHU (`ps -eo`), CC-LA (`SendMessage` nối agent soát); (11) agent soát kế hoạch đề xuất ranh giới
thân route "tới `router.` kế tiếp" sai cho `wallets.js` — ca K5 server thật bắt; (12) thử vượt ngân sách "~120 dòng" (JS +112 + py 155).

- **KHOÁ (đã làm, trong Phạm vi):** (2) `dot_bien.py` lọc sập/ném theo dạng in `<bài> sập: ` / `khối ném: `; (3) `thu_cong.js` bọc `cong()`
  trong đoạn đột-biến-tắt → phép đỏ thay vì sập cả bài; (7a) phép A4 `thu_cong_cu.js` neo thêm `GOI-2 B3c` — dẫn chứng sai việc gốc nay có phép bắt.
- **KHOÁ (đề xuất, ngoài chữ phiếu — chủ quán gom việc sau):** (7b) phép tĩnh "route GET gọi hàm phụ có lệnh ghi" (`kiem_tra`, ca đỏ:
  `customers-v2.js` 4 route GET → `fetchSXCustomers` → INSERT — Phát hiện 4); (1)+(2) đưa đối chứng + lọc sập vào khuôn `dot_bien.py` chung
  (GOI-1/P26c/TACH-GL — TOC-DO-1 Phát hiện 3 đã nêu); (10) CC-LA: cho `SendMessage` nối tiếp đúng agent soát đã mở (SO-LUONG-1 cùng sự cố).
- **NGUYÊN TẮC (đã ghi `KHUON_LOI.md`, 116/120):** K1 "phiếu cũng là hồ sơ — ví dụ chép từ phiếu phải mở hồ sơ gốc" (7); K1 "số dòng trích
  của file đang sửa kiểm lại ở commit cuối" (7); K4 "phép theo thân route → ghi giới hạn hàm phụ" (7b).
- **BỎ:** (1) một lần, cơ chế đối chứng đã bắt đúng; (4)(5)(6) K3 đã có câu "cô lập một phép", "neo NGẮN RIÊNG", "đột biến gỡ đúng vế" — chỉ là
  chưa làm đúng; (8) → Câu hỏi 5 + Phát hiện 7; (9) → Phát hiện 8 (hook môi trường, ngoài phạm vi); (10) sáu luật người gác chặn đúng cách viết
  lệnh của máy; (11) KHOÁ có sẵn (ca K5) làm đúng việc; (12) đã nêu lý do ở bước 6.
- **Dọn (11.3):** không đề xuất xoá lời dặn nào — câu K3 "đối chứng" mới có phép trong `dot_bien.py` của hai việc, chưa có ở khuôn chung.

## Phát hiện (bổ sung)
7. `thu_cong.js` 111–123 s trên máy mây chậm (hạn 120 s): chia lượt song song (AU2-10, khuôn TACH-GL `--luot`) — phiếu dặn chỉ ghi, không làm.
8. Hook dừng `.claude/hooks/kiem_truoc_khi_dung.cjs` chạy `npm test` mỗi lần máy dừng, kể cả khi một `npm test`/bài thử khác đang chạy → hai
   `thu_cong.js` chồng nhau cùng ETIMEDOUT. Ngoài phạm vi (`.claude/`).
