# TU-CHAY-6 — kế hoạch (chờ chủ quán duyệt)

Nền: `dfeaa57 PHIEU: TU-CHAY-6` (cha `8f6d43e` sổ v32), tu-chay 1.5.0. Máy mây 4 lõi (`node -p "require('os').cpus().length"`),
KHÔNG có ref `origin/main` (`git branch -a` chỉ có `viec/TU-CHAY-6`) → mốc của cổng tĩnh / ra-soát là `dfeaa57^`.
Mọi số dòng dưới đây đọc trong lượt này (K1). Kế hoạch đã qua một agent phụ soát chỉ đọc: 11 điểm, đã sửa hết vào bản này — bảng ở mục 13.

---

## 0. Ba chỗ code thật KHÁC điều phiếu giả định — phải chốt trước khi làm (K1, K5)

| # | Phiếu ghi | Đo / đọc được | Hệ quả |
|---|---|---|---|
| 0.1 | A2: `server/` thật → "0 cảnh báo mới ngoài ca (a) đã biết" (packages.js:194) | Quét thử (scratchpad `quet_A2b.js`, thân route = từ `^router.<m>(` tới `^});`): **(a) 3 route GET có lệnh ghi**: `packages.js:191` (run UPDATE :194), `products.js:20` (run UPDATE pos_products :56–59 — ghi đệm tồn kho cuối cùng biết được), `sync.js:104` (UPDATE pos_customers :146–149 + INSERT pos_sync_logs :154–155 — đánh dấu khách đã xuất). **(b) 51/60 route có lệnh ghi KHÔNG gọi `loiGhi(`** (`loiGhi` chỉ định nghĩa ở `wallets.js:97`, chỉ 5 file nhắc tới: damages, orders, packages, refunds, wallets). | Phép (b) theo chữ phiếu = 51 cảnh báo mỗi `npm test` → dạy người bỏ qua (K8 chiều ngược). Phép (a) = 3 cảnh báo, không phải 1. → **Câu hỏi Q1**, phương án ở mục 3. |
| 0.2 | A1: "file không có" = `git cat-file` thoát **1** | Đo (scratchpad `thu_gitgia.js`): file không có → `status 128`, stderr "fatal: path … does not exist"; bị SIGKILL → `status null, signal SIGKILL, error undefined`; không có git → `status null, error ENOENT`. | Phân biệt bằng `status === 0` / `status === null \|\| error` / còn lại = không có. Không so với số 1. Chú thích `cong.js:30` sẽ ghi đúng số đo (A4 K1). |
| 0.3 | A3: chạy `cong.js tinh` → "một lần hỏi đủ cả A11 + A12" | LUOI-2 hỏi 2 lần vì A11 (`cong.js:280`) và A12 (`:285`, vế `!doHopLe`) đều nằm trong chế độ **chay** (sau `:216`); chế độ `tinh` chỉ có A12 dạng "không có bài thử" (`:175`). `cong.js tinh` KHÔNG tái hiện được hai câu hỏi của LUOI-2. | Câu skill phải thêm vế "tự xét A11/A12 chế độ chay từ `bang_chung_do.txt` của mình" — mục 4. **Câu hỏi Q3** (xác nhận cách viết). |

---

## 1. Số đo trên gốc dfeaa57 (15.10.2026, máy mây 4 lõi)

`tu_chay/thu_nguoi_gac.js` và `tu_chay/thu_cong_cu.js` đo bằng `scratchpad/do_A5.js` (spawnSync tuần tự, 3 lần; lúc đo có vài lệnh
`grep`/`sed` nhẹ chạy xen — không có bài thử nào khác). `thu_cong.js` đo riêng 1 lần bằng `scratchpad/do_thu_cong.js`.

| Lệnh | Lần 1 | Lần 2 | Lần 3 | Kết quả |
|---|---|---|---|---|
| `node tu_chay/thu_nguoi_gac.js` | 6,6 s | 5,9 s | 6,2 s | XANH |
| `node tu_chay/thu_cong_cu.js` | 2,9 s | 3,1 s | 3,3 s | XANH |
| `node tu_chay/thu_cong.js` | 67,9 s | — | — | 318 phép · 0 chỗ hỏng |
| `node tu_chay/cong.js tinh . dfeaa57^ HEAD viec/TU-CHAY-6` | < 1 s | | | ✓ CỔNG TĨNH ĐẠT |

**A5 kết luận: cả hai bài < 30 s (xa ngưỡng) → KHÔNG đổi điều kiện chạy, không đổi `thu_nguoi_gac.js`/`thu_cong_cu.js` vì A5,
không thêm ca vào `cong_cu/thu_TOCDO1.js` vì A5.** Đo lại 3 lần CHẠY RIÊNG ở bước 6 trên HEAD (K8 chiều ngược) và ghi vào
`trang_thai.md`.

### Ước lượng thời gian máy (mỗi lần chạy là số ĐO ở trên; số lần là giả định)

| Khâu | Phép tính | Phút |
|---|---|---|
| Bài thử đỏ trên gốc: `thu_cong.js` (ca A1), `thu_TOCDO1.js` (ca A2), `thu_cong_cu.js` (A3/A4/A6) | 68 + ~5 + 3 s | 1,5 |
| Vòng sửa: giả định 5 vòng × (68 + 5 + 3 s + `npm test` ~120 s) | 5 × ~196 s | 16 |
| `--day-du` 2 lần | 2 × ~155 s (TU-CHAY-5 đo 154 s) | 5 |
| Đột biến (mục 8): 3 trên `thu_cong.js`, 5 trên `thu_TOCDO1.js`, 4 trên `thu_cong_cu.js` + 3 đối chứng | 3 × 68 + 5 × 5 + 4 × 3 + (68 + 5 + 3) s | 5,5 |
| `/ra-soat` tối đa 3 vòng, mỗi vòng chạy lại 3 bài + `npm test` | 3 × ~196 s (chưa tính agent đọc) | 10 |
| A5 đo lại 3 lần riêng trên HEAD | 3 × (6 + 3) s | 0,5 |
| **Tổng** | | **~40** |

---

## 2. A1 — `tu_chay/cong.js` `blob()` không trả `null` khi git không chạy được

Code thật: `blob` `:30–33` → `r.status === 0 ? r.stdout : null`; 18 chỗ gọi `blob(` (grep `blob(` = 18), ba chỗ ghi thẳng kết quả vào
`fs.writeFileSync`: `:268`, `:325`, `:327`. Lỗi gói ở `:343–345` thành `✗ [CONG] cổng gặp lỗi bất ngờ — ĐỎ: <message>` + dòng tổng
`✗ CỔNG ĐỎ`. TOC-DO-1 đã tái hiện tất định: 89 dòng "Received null" (`viec/TOC-DO-1/trang_thai.md:147–157`).

- **PA-A (chọn, ~4 dòng):** `blob` giữ chữ ký; `status === 0` → trả buffer; `status === null || r.error` → `throw new Error('git cat-file
  hỏng (<sha 7>:<p>): ' + (r.error ? r.error.message : r.signal || stderr))`; còn lại (128 — file không có ở sha) → `null` như cũ.
  Catch `:343` đã in một dòng ✗ và thoát 1 — không sửa. Sau vá, `null` CHỈ còn nghĩa "file không có": ở `:268` `p ∈ baiThu` (diff
  `st !== 'D'`, có ở head — `:111`), ở `:325` `p ∈ daMien` chỉ khi `blob(moc, p) !== null` (`:257`), ở `:327` `st !== 'D'` (`:257`) →
  ba chỗ không còn đường nào nhận `null`. Không thêm hàm bọc.
- PA-B (~7 dòng): PA-A + hàm `blobCo()` ném khi `null`, thay ở 3 chỗ. Che đường KHÔNG tới được (3 lập luận trên) bằng code; không có ca
  đỏ tất định nào cho nó (K3: phép không có ca đỏ) → loại.
- **A1b — cùng khuôn trong cùng file (K4, ngoài chữ phiếu — chủ quán gạch nếu không muốn, ~3 dòng):** `giaiNen` `:40–44` trả
  `false` cho MỌI lỗi; ba chỗ gọi `:229`, `:230`, `:266` đều BỎ QUA kết quả. `:229` cố ý ("gốc chưa có .claude/ thì bỏ qua" — git archive
  đường dẫn không có → 128). Nhưng git bị giết ở `archive` tại `:266` → thư mục `goc` RỖNG → bài thử chạy trên cây rỗng → ĐỎ → `:283`
  đếm là **đỏ hợp lệ** → cổng A11/A12 ĐẠT oan trên máy bận (K3 xanh oan, nặng hơn sập). Soát điểm 8: `:43` `tar` bị giết cũng trả
  `false` → sửa trong `giaiNen` không kín. **Chọn (1 dòng):** để `giaiNen` nguyên, tại `:266` `if (!giaiNen(thuMuc, moc, goc)) throw new
  Error('git archive <mốc 7> hỏng')` — mốc là commit thật, không đường dẫn → thất bại nào cũng bất thường; `:229` giữ bỏ qua (128 hợp
  lệ khi gốc chưa có `.claude/`), `:230` giữ (đã trong nhánh `blob(head, 'tu_chay/cai_dat.js') !== null`). Chỉ có BV-, KHÔNG có VS-
  (một đường, không có cách vá sai khác tất định) — lệch chữ A7, ghi `trang_thai.md` + Q4. Nếu không duyệt A1b thì ghi Phát hiện.
- **Hai chỗ nuốt ném (soát điểm 7, K4):** `:138` và `:152` bọc `JSON.parse(blob(…))` trong `try { } catch {}` → sau vá, lỗi
  "git cat-file hỏng" bị nuốt, A8 tĩnh chạy tiếp với dữ liệu thiếu. Sửa 2 dòng: lấy `blob` ra ngoài `try`, chỉ `JSON.parse` khi
  `!== null`. Ca: git giả giết ở `cat-file … :tu_chay/cau_hinh.json` chế độ `tinh` → một dòng `✗ [` nêu `cau_hinh.json` (đỏ trên gốc:
  gốc trả null → `JSON.parse(null)` = `null` → `chH.ban_cai` TypeError → `[CONG]` không nêu đường dẫn — soát vòng 1 sửa câu này).
- `git()` `:25–29` đã ném khi `status !== 0` (kể cả null) — không đổi. `kiem_tra_truoc_khi_giao.js:556–567` `lyDoChayThuCong` đã coi git
  hỏng là "chạy" (an toàn) — không đổi.
- **Chú thích** `cong.js:30` ghi đúng ba trường hợp đo được (status 0 / null+error / 128) — A4 K1.

### Ca thử A1 (trong `tu_chay/thu_cong.js`, hàm `baiCong`)
- Dựng `TAM/gitgia/git` = script node đứng ĐẦU `PATH`: `cat-file blob <sha>:cong_cu/thu_a.js` → `process.kill(process.pid, 'SIGKILL')`;
  mọi lệnh khác `spawnSync(GIT_THAT, a, {stdio: 'inherit'})` (GIT_THAT tìm một lần như `thu_cong_cu.js:33`). `goi()` `:109` nhận thêm
  `env` tuỳ chọn (một đối số, mặc định `envSach()`); `ca()` nhận `env` qua tuỳ chọn.
- **A1 ca:** PR của ca `A1 đúng phạm vi` (`PR['A1 …']`), chế độ `chay`, PATH giả → phải: `status !== 0`, có `CỔNG ĐỎ`, **KHÔNG có
  "Received null"** (mẫu nguy hiểm vắng mặt — E13), có đúng MỘT dòng bắt đầu `✗ [` (một dòng ✗ nêu lý do + dòng tổng), dòng đó nêu
  `cong_cu/thu_a.js` (đường dẫn, không dò câu chữ của mình — E12). Trên gốc: ra có "Received null" → ĐỎ.
- **A1b ca (nếu duyệt):** git giả giết ở `archive` khi đối số có `--format=tar` và KHÔNG có đường dẫn (`:266` gọi không đường dẫn;
  `:229–230` có) → trên gốc: cổng **ĐẠT** (bài đỏ trên cây rỗng tính hợp lệ) → ca mong `CỔNG ĐỎ` + một dòng `✗ [` + `chua: ['git
  archive']` → ĐỎ trên gốc.
- **K5 luồng hợp lệ:** ca có sẵn `A14 không có viec/<MÃ>/phieu.md` (`:265`) thêm `chua: ['không có viec/Y/phieu.md ở head']`,
  `khong: ['[CONG]']` — file vắng (128) vẫn phải là lý do A14 rõ, không phải lỗi bất ngờ. Mọi ca ĐẠT hiện có (`:133–155`, `:225–256`,
  `:274–300`) là luồng hợp lệ: git thật → không đổi kết quả.

---

## 3. A2 — hai phép tĩnh trong `kiem_tra_truoc_khi_giao.js` (nhóm E, đặt sau khối E12 `:494–520`)

Code thật quanh chỗ đặt: `boGhiChu` `:86–90` thay chú thích khối bằng MỘT khoảng trắng → **mất xuống dòng, số dòng trôi** (phép E12
không in số dòng nên chưa lộ). Phép mới cần số dòng thật → cắt chú thích nhưng GIỮ `\n` (hàm cục bộ 1 dòng, không sửa `boGhiChu`
đang được E12/E10/P20 dùng — K4: đổi `boGhiChu` thì rà 9 chỗ gọi, không cần).

- **PA-A (chọn, ~25 dòng code + ~2 dòng gọi):** một hàm thuần `quetRouteGhi(docFile, tenFile[])` → `{ getGhi: ['file:dòng'],
  khongLoiGhi: ['file:dòng (METHOD)'] }`:
  - thân route = từ dòng `^router\.(get|post|put|patch|delete)\(` tới ngay TRƯỚC dòng `^router\.` kế tiếp hoặc hết file (soát điểm
    4: `orders.js:1357–1520` `router.put(\n "/:id/cancel"` đóng bằng `  },\n);`, không có `^});` — grep `^router\.` = 6, `^});` = 5;
    `settings.js`, `sync.js` có `});` cấp module). Hàm phụ giữa hai route bị gộp vào thân route trước — chấp nhận (quét thử cả hai
    cách đều ra 3 / 51), ghi chú thích;
  - route ghi = thân có `\brun\(` ở BẤT KỲ dòng nào (bắt cả `tx.run(`) VÀ từ khoá ghi `\b(UPDATE(\s+OR\s+\w+)?|INSERT(\s+OR\s+\w+)?\s+INTO|REPLACE\s+INTO|DELETE\s+FROM)\b`
    cờ `i` (chép từ E12 `:508`, thêm `DELETE FROM`) ở BẤT KỲ dòng nào đã bỏ chú thích — soát điểm 3: chỉ 23/60 route có `run(` và từ
    khoá cùng một dòng (`await run(\n 'UPDATE …'`); `\bUPDATE\b` không khớp `updated_at`; `file:dòng` = dòng từ khoá đầu tiên;
  - (a) `get` + route ghi → `getGhi` `file:dòng`, trừ khi `// GET-ghi: <lý do>` (lý do không rỗng) nằm trên dòng thô của từ khoá, dòng
    `run(` gần nhất phía trên nó trong thân, hoặc dòng ngay trên dòng `run(` đó (lệnh nhiều dòng — soát điểm 3);
  - (b) route có lệnh ghi mà thân không có `loiGhi(` → `khongLoiGhi`.
  - Bộ kiểm gọi với `fs.readdirSync('server/routes')` `.js`, sort. Bánh cóc tách hàm thuần `xetBanhCoc(n, nguong)` đặt NGAY TRÊN
    `quetRouteGhi` để bài thử cắt một khối hai hàm (soát điểm 6).
- Cách báo — **chờ Q1**, ba phương án:
  - **PA-1 (chữ phiếu):** mỗi route (a) một `canhBao`, mỗi route (b) một `canhBao` → hôm nay 3 + 51 = 54 dòng `!` mỗi `npm test`.
  - **PA-2 (đề xuất):** (a) MỘT `canhBao` gộp liệt kê mọi `file:dòng` (hôm nay 3 — cho tới khi việc quầy thêm `// GET-ghi:` vào
    `server/`); (b) **bánh cóc cảnh báo**: hằng `NGUONG_ROUTE_GHI_KHONG_LOIGHI = 51` cạnh phép; `n > ngưỡng` → `canhBao` liệt kê toàn
    bộ danh sách (người sửa tự thấy route mới của mình); `n < ngưỡng` → `pass` nhắc HẠ ngưỡng (khuôn C1 `:221–241`); `n == ngưỡng` →
    `pass`. Hôm nay: 1 cảnh báo (a), 0 cảnh báo (b). Không FAIL (phiếu nói CẢNH BÁO).
  - PA-3: (b) như PA-2 nhưng FAIL khi mọc thêm (đúng khuôn bánh cóc C). Mạnh hơn chữ phiếu → chỉ làm nếu chủ quán chọn.
- **Phát hiện (không sửa — `server/` cấm):** hai route GET có ghi ngoài packages.js:194: `products.js:56–59` (đệm tồn kho — Ràng buộc 8,
  có vẻ chủ ý) và `sync.js:146–155` (đánh dấu đã xuất + log — nghiệp vụ xuất khách). Cần chú thích `// GET-ghi: <lý do>` trong một
  việc quầy; tới lúc đó phép (a) báo 3 chỗ.

### Ca thử A2 (trong `cong_cu/thu_TOCDO1.js` — đã có sẵn máy cắt khối `--kiem` + kho tạm, trong Phạm vi; thêm mục "A2 (TU-CHAY-6)")
Cắt khối THẬT từ `function xetBanhCoc(` tới dòng kết `^}` thứ hai sau nó (hai hàm liền nhau), `new Function` với `fs`, `path`; chạy
trên thư mục tạm `routes/` giả. Trên gốc không có hàm → ca R0 đỏ (như E0a). Mỗi ca phá ĐÚNG một điều kiện (K3):
- R0 thấy `function xetBanhCoc(` và `function quetRouteGhi(` ở đầu dòng.
- R0b (khuôn E1 của TOC-DO-1 `:30–33`, soát điểm 2): toàn bộ kiểm có đúng MỘT lời gọi `quetRouteGhi(` ngoài dòng `function`, và một
  lời gọi `xetBanhCoc(` — đột biến bỏ dòng gọi bị bắt ở đây, không phải ở ca cắt hàm.
- R1 GET + `run(` + `UPDATE` → (a) có `a.js:<dòng đúng>`; R2 GET + `INSERT INTO` → có; R2b GET + `tx.run(` + `DELETE FROM` → có.
- R3 GET + `UPDATE` + dòng trên `// GET-ghi: đệm tồn` → KHÔNG có (miễn); R3b `// GET-ghi:` lý do RỖNG → vẫn báo; R3c chữ `GET-ghi`
  ở route KHÁC trong cùng file → route này vẫn báo (miễn theo DÒNG, không theo file — marker suông, E13).
- R4 GET chỉ `SELECT … updated_at` → không báo; R5 `UPDATE` chỉ trong chú thích `//` và `/* */` → không báo; R6 khối chú thích nhiều
  dòng TRƯỚC route → số dòng vẫn đúng (bẫy `boGhiChu`).
- R7 POST + `run(UPDATE` không `loiGhi(` → (b) có; R8 POST + `loiGhi(` trong `catch` → không; R9 POST chỉ `SELECT` → không (không phải
  route ghi); R10 GET có ghi (a) cũng vào (b) nếu thiếu loiGhi (hai danh sách độc lập).
- R11 ngưỡng (PA-2): hàm bánh cóc tách riêng `xetBanhCoc(n, nguong)` → n = ngưỡng → không cảnh báo; n = ngưỡng + 1 → cảnh báo;
  n = ngưỡng − 1 → nhắc hạ (ngay trên / ngay dưới, K3).
- K5 (soát điểm 5): `server/routes/` THẬT quét bằng khối → không ném, mọi mục đúng dạng `<file>.js:<số>`, `getGhi` là TẬP CON của
  `{packages.js, products.js, sync.js}` (việc quầy thêm `// GET-ghi:` làm tập nhỏ đi vẫn xanh), `khongLoiGhi.length ≤ NGUONG` đọc từ bộ
  kiểm. Phát hiện route GET ghi MỚI là việc của phép (a) trong `npm test`, không phải của bài này.
Số ca cố định, không sinh từ nội dung file (K3 TU-CHAY-5).

---

## 4. A3 — `tu_chay/skill_lam_viec.md` bước 4 + `tu_chay/lenh_ra_soat.md`

- Soát điểm 9 (đọc `skill_lam_viec.md:52–65`, `cong.js:107–112, :175, :199–204, :147`): ở bước 4 HEAD mới có commit PHIEU / kế hoạch →
  `doi` không có code → A12 tĩnh không nổ, A6 chỉ soi file đã commit → cổng ĐẠT, KHÔNG có dòng ✗ để dẫn; còn sau khi commit code thì
  LUÔN có `✗ [A19]` (chưa tới 11.4) và việc `tu_chay/` thêm `✗ [A8]` → dẫn nhầm vào câu hỏi. Vế thật sự chặn LUOI-2 hỏi 2 lần là tự
  xét A11/A12. Vì vậy:
- **PA-A (chọn, +4 dòng skill, +1 dòng ra-soát):** sau câu "Sửa một bài thử ĐÃ CÓ … không tự lách bằng ca đỏ giả" (`skill_lam_viec.md:54–55`)
  thêm: *"Trước khi xin chủ quán sửa phiếu: (i) tự xét từ `bang_chung_do.txt` hai phép cổng `chay` sẽ bắt — bài cũ sửa mà xanh trên gốc
  → cần `## Bài thử cũ sửa` (A11); không bài nào đỏ trên gốc → cần `## Bài thử đỏ` (A12) — gom MỘT câu hỏi đủ cả hai (LUOI-2 hỏi
  2 lần); (ii) chạy `node tu_chay/cong.js tinh . <mốc>^ HEAD viec/$0` (mốc = commit `PHIEU: $0` đầu tiên, lệnh ở `/ra-soat` bước 1)
  để kiểm Phạm vi / A7 / A17 với file ĐÃ commit, dẫn NGUYÊN dòng ✗ liên quan; `✗ [A19]` (chưa tới 11.4) và `✗ [A8]` (việc sửa
  `tu_chay/`, chủ quán cài sau) ở bước này là bình thường, không hỏi."*
  `lenh_ra_soat.md:71–72` "Nộp báo cáo" → *"`SubagentHandback` là hành động CUỐI CÙNG và BẮT BUỘC; không nộp = chưa soát (SO-LUONG-1
  lần 1) — phiên chính khởi chạy lại, không tự kết luận."*
- PA-B: viết thành bước 4b riêng (đánh số lại 4→12) → `thu_cong_cu.js:359–363` F1 neo `\n10. `/`\n11. ` và mọi chỗ nhắc "bước 11"
  (THIET_KE, cong.js A19 `:204`, KHUON_LOI) phải đổi theo (K4 TU-CHAY-5) → loại.
- Người gác: `node tu_chay/cong.js tinh . dfeaa57^ HEAD viec/TU-CHAY-6` đã CHO ở lượt này (`.tu_chay_nhat_ky.jsonl` 07:19:54Z, `quyet: CHO`);
  luật `node` `nguoi_gac.js:686–692` chỉ chặn `cai_dat.*`, `-e` lộ môi trường, mã nói. Không thêm ca vào `thu_nguoi_gac.js`: ca đó
  xanh ngay trên gốc (người gác không đổi) → A11 đòi `## Bài thử cũ sửa` (chính cái bẫy LUOI-2). Ghi CHƯA KIỂM MÁY: kiểm tay một lần.
- Ca thử (trong `tu_chay/thu_cong_cu.js`, cạnh H3/E3 `:342–380`, 2 phép): bước 4 của skill cắt từ `sk` NGUYÊN (không phải `than` đã
  `toLowerCase` `:348` — soát điểm 11), `\n4. ` → `\n5. `, có `tu_chay/cong.js tinh`, `A11`, `A12`, `dòng ✗`, `MỘT câu hỏi`, `[A19]`;
  `lenh_ra_soat.md` có `SubagentHandback` + `CUỐI` + `BẮT BUỘC` + `không nộp`. Đỏ trên gốc (chữ chưa có). `thu_cong_cu.js` là bài thử trong `tu_chay/` → cổng tính là bài thử (`cong.js:36–37`).

---

## 5. A4 — `KHUON_LOI.md` (104 dòng hôm nay, trần 120 — `thu_cong_cu.js:317–329` F3)

+≤ 10 dòng, mỗi câu ≤ 2 dòng, dẫn việc gốc, không mở K9:
- K1 (`:15–16` Chặn) +1: *Chú thích trong code cũng là khẳng định — sai thì sửa cùng dòng vá (TU-CHAY-6: phiếu/chú thích ghi
  `cat-file` thoát 1, đo được 128).*
- K3 +2 câu: *Bộ đột biến phải có ĐỐI CHỨNG (bản chưa đột biến xanh) và loại dòng ném / sập — bài thử sập ≠ BẮT (TOC-DO-1 Phát hiện 3,
  SO-LUONG-1).* · *Ca một PHÉP TÍNH chọn số để trần / làm tròn phía sau KHÔNG che lỗi (GOI-2 B3c: 0,002 chứ không 0,5 khi có trần).*
- K4 (`:48–57`) +1: *Cổng "bắt buộc có X" kiểm CÙNG biểu thức với chỗ dùng X — SĐT đã chuẩn hoá, không phải giá trị thô (`" "` lọt,
  SO-LUONG-1 orders.js:198).*
- K7 (`:75–82`) +1: *Số thời gian trong code quầy dựng bằng `getNow` cùng quy ước với cột (Render TZ UTC, GOI-2 goiKhach.js:41).*
- **Câu hỏi Q2:** phiếu ghi hai câu cuối vào "K2/K5"; GOI-2 (`viec/GOI-2/trang_thai.md:226`) đề xuất K3 cho câu trần, K7 cho câu
  thời gian (`:132`: "K7 định dạng thời gian theo trí nhớ"). Kế hoạch đặt K3 + K7 (đúng cơ chế: đột biến VS vẫn ra đúng số = xanh oan;
  định dạng theo trí nhớ = K7). Chủ quán gạch nếu muốn đúng K2/K5.
- Ca thử (`thu_cong_cu.js`, 1 phép như TU-CHAY-5 E2 `:456–457`): 5 cụm chữ neo ngắn có mặt (`ĐỐI CHỨNG`, `≠ BẮT`, `che lỗi`, `CÙNG biểu
  thức`, `getNow`). F3 (`:328`) tự canh trần 120.

---

## 6. A5 — không đổi (số đo mục 1). Ghi số đo vào `trang_thai.md`; đo lại 3 lần CHẠY RIÊNG trên HEAD ở bước 6.

## 7. A6 — `tu_chay/PHIEN_BAN` → `tu-chay 1.6.0`; `tu_chay/THIET_KE.md` thêm `### TU-CHAY-6 (15.10.2026, tu-chay 1.6.0)` sau
TU-CHAY-5 (`:867–881`), trước `## B16` (`:883`) — ~8 dòng: blob ba trường hợp (+ archive nếu A1b), phép E mới + ngưỡng (theo Q1), skill
bước 4 + ra-soát. `thu_cong_cu.js:459` VÀ `thu_nguoi_gac.js:709` (soát điểm 1 — cùng canh `tu-chay 1.5.0`) đổi → `1.6.0` (cả hai đỏ trên gốc;
`thu_nguoi_gac.js` thành bài thử SỬA → `bang_chung_do.txt` thêm `SỐ CA tu_chay/thu_nguoi_gac.js: <N>` theo dạng "x/B ca người gác
… · C phép khác" — `cong.js:81`), thêm 1 phép B15 có `git cat-file hỏng`, `GET-ghi`, `cong.js tinh`. Bộ kiểm sẽ CẢNH BÁO "khớp từng byte" (`kiem_tra…:592,606,618–620`) tới khi chủ quán cài — ghi `trang_thai.md`, không chép
sang `.claude/`.

---

## 8. A7 — đột biến `viec/TU-CHAY-6/dot_bien.py` (khuôn `viec/TOC-DO-1/dot_bien.py`: đối chứng + "bài NÉM ≠ bắt", thêm "không in dòng tổng ≠ bắt")

Mỗi đột biến một dòng `('<tên>', …)`, tên nguyên chuỗi. Bản sao: chép THẬT (không symlink) `tu_chay/` + `KHUON_LOI.md` + `CLAUDE.md` +
`kiem_tra_truoc_khi_giao.js` vào thư mục tạm, tự kiểm `realpath` đích nằm trong tạm (K5 HOC-2b); bài `thu_cong.js`/`thu_cong_cu.js` chạy
từ bản sao (`__dirname`); `thu_TOCDO1.js --kiem <bản sao>`.

| Chỗ vá | BV- | VS- | Ca phải bắt |
|---|---|---|---|
| `cong.js` blob | `BV-TUCHAY6-BLOB-NULL` (trả lại `? r.stdout : null`) | `VS-TUCHAY6-BLOB-NUOT-SIGNAL` (chỉ ném khi `r.error`, status null vẫn trả null) · `VS-TUCHAY6-BLOB-NEM-128` (ném cả khi file không có) | A1 ca · A1 ca · ca A14 `khong: ['[CONG]']` |
| `cong.js` `:138`/`:152` | `BV-TUCHAY6-BLOB-TRONG-TRY` (đưa `blob` lại vào `try`) | — | ca cat-file `cau_hinh.json` |
| `cong.js` `:266` (A1b) | `BV-TUCHAY6-ARCHIVE-NUOT` | — (một đường; lệch chữ A7, ghi rõ) | A1b ca |
| `kiem_tra…` quetRouteGhi | `BV-TUCHAY6-A2-BO-GOI` (bỏ dòng gọi) | `VS-TUCHAY6-A2-QUEN-INSERT` · `VS-TUCHAY6-A2-MIEN-THEO-FILE` · `VS-TUCHAY6-A2-QUEN-TXRUN` · `VS-TUCHAY6-A2-NGUONG-LON-HON-BANG` · `VS-TUCHAY6-A2-CUNG-DONG` (run( và từ khoá phải cùng dòng) | R0b · R2 · R3c · R2b · R11 · R1b (lệnh nhiều dòng) |
| skill bước 4 / ra-soát | `BV-TUCHAY6-SKILL-B4` · `BV-TUCHAY6-RASOAT-CUOI` | `VS-TUCHAY6-SKILL-CHAY-THAY-TINH` (`cong.js chay`) | 2 phép A3 |
| KHUON_LOI / PHIEN_BAN | `BV-TUCHAY6-PHIENBAN-CU` (1.5.0) | — | phép A6 ở `thu_cong_cu.js` VÀ `thu_nguoi_gac.js:709` |

---

## 9. Bài thử ↔ Nghiệm thu (1-1)

| Mục | Bằng chứng |
|---|---|
| A1 | `thu_cong.js` ca A1 (git giả giết ở cat-file) đỏ trên gốc "Received null", xanh sau vá; ca cat-file `cau_hinh.json` chế độ tinh; ca A14 `khong: ['[CONG]']`; (A1b nếu duyệt) |
| A2 | `thu_TOCDO1.js` R0–R11 + ca K5 server thật; `npm test` in đúng số cảnh báo theo Q1 |
| A3 | `thu_cong_cu.js` 2 phép chữ skill/ra-soát; kiểm tay người gác CHO lệnh `cong.js tinh` |
| A4 | `thu_cong_cu.js` 1 phép 5 neo; F3 ≤ 120 |
| A5 | bảng số đo mục 1 + đo lại trên HEAD (trang_thai) — không đổi code |
| A6 | `thu_cong_cu.js` + `thu_nguoi_gac.js:709` PHIEN_BAN 1.6.0; phép B15 |
| A7 | `npm test`, `--day-du` (chỉ cảnh báo khớp byte + cảnh báo (a) theo Q1); `dot_bien.py` đối chứng xanh, N/N bị bắt |

Số dòng ước: code bộ khung ~4 (+3 A1b) + ~27 (A2) = ~34; thử ~25 (`thu_cong.js`) + ~55 (`thu_TOCDO1.js`) + ~12 (`thu_cong_cu.js`) +
~95 (`dot_bien.py`) ≈ 190 (vượt "~120 dòng thử" vì khuôn đột biến có đối chứng + bản sao chép thật); luật/skill ~15. Không chia
`thu_cong.js` song song.

---

## 10. Đường song song cần canh (K4)
- `cong.js`: 18 `blob(` đều qua một hàm → một chỗ vá; `giaiNen` 3 chỗ gọi (A1b); `git()` đã ném. Chú thích đầu file `:8` "tinh: đọc …
  bằng git" giữ đúng.
- `boGhiChu` 9 chỗ gọi — KHÔNG đổi; hàm cắt chú thích giữ dòng là hàm riêng cho phép mới.
- "bước 4" được nhắc ở `MAU_PHIEU.md` (cấm sửa) — kiểm bằng grep, chỉ thêm câu, không đổi số bước.
- `thu_cong_cu.js:459` và `thu_nguoi_gac.js:709` cùng canh PHIEN_BAN (sửa cả hai); `thu_nguoi_gac.js:698` canh `khuon_loi_toi_da = 120` (không đổi).
- Neo đột biến cũ đụng dòng sửa: `python3 viec/HOC-2b/kiem_neo.py` trên gốc và HEAD (kho nông có thể không chạy → ghi rõ).

## 11. Luồng hợp lệ phải KHÔNG bị chặn (K5)
- Mọi ca ĐẠT hiện có của `thu_cong.js` (git thật): A1 không đổi kết quả. File vắng ở sha (A14, A8 `blob(moc, 'tu_chay/cai_dat.js')`
  `:131`, `:157–158`, `:225`, `:257–258`, `:178`, `:180`, `:203`, `:220`) vẫn nhận `null`.
- A2: route GET chỉ đọc; route ghi đã `loiGhi`; chữ `UPDATE` trong chuỗi SELECT / chú thích; `// GET-ghi:` đúng dòng → không báo.
  Số lượng hôm nay (3 / 51) không làm `npm test` FAIL ở PA-1/PA-2.
- A3: lệnh `cong.js tinh` qua người gác (đã CHO).

## 12. Câu hỏi chờ chủ quán (ghi cả ở `trang_thai.md ## Câu hỏi`)
- **Q1 (chặn A2):** (a) chấp nhận 3 cảnh báo đã biết (gộp một dòng) tới khi việc quầy thêm `// GET-ghi:`? (b) chọn PA-1 (51 dòng `!`),
  **PA-2 (đề xuất: bánh cóc cảnh báo, ngưỡng 51)** hay PA-3 (FAIL khi mọc)?
- **Q2:** câu "trần / làm tròn" vào K3 và câu `getNow` vào K7 (kế hoạch) hay đúng chữ phiếu K2/K5?
- **Q3:** duyệt câu skill bước 4 theo PA-A mục 4: vế chính là "tự xét A11/A12 chế độ chay"; `cong.js tinh` chỉ kiểm Phạm vi/A7/A17
  với file đã commit và câu skill nói rõ `[A19]`/`[A8]` ở bước này là bình thường (không thì máy dẫn nhầm vào câu hỏi)?
- **Q4:** duyệt A1b (ném tại `cong.js:266` khi `giaiNen` thất bại, 1 dòng + 1 ca, chỉ có BV- không có VS- — lệch chữ A7) hay chỉ ghi Phát hiện?

## 13. Soát kế hoạch (agent phụ chỉ đọc, 15.10) — 11 điểm, đã sửa vào các mục trên

| # | Điểm | Đã sửa ở |
|---|---|---|
| 1 | `thu_nguoi_gac.js:709` cũng canh PHIEN_BAN 1.5.0 — mục 10 cũ ghi sai (K1/K4) | mục 7, 8, 9, 10 |
| 2 | `BV-A2-BO-GOI` sống vì mọi ca cắt hàm chạy riêng | ca R0b (khuôn E1) |
| 3 | `run(` và từ khoá ghi chỉ cùng dòng ở 23/60 route; cờ `i`; miễn `GET-ghi` cho lệnh nhiều dòng | mục 3 định nghĩa + R1b + VS-CUNG-DONG |
| 4 | `orders.js:1357–1520` đóng bằng `},\n);` — không có `^});` | thân route tới `^router.` kế tiếp |
| 5 | ca K5 so BẰNG tập 3 file chặn việc quầy thêm `GET-ghi` | tập con |
| 6 | R11 không có hàm vì chỉ cắt một hàm | cắt khối hai hàm |
| 7 | `cong.js:138`, `:152` `try/catch` nuốt ném sau vá | mục 2 + ca + BV |
| 8 | A1b sửa trong `giaiNen` không kín (`tar`) | ném tại `:266` |
| 9 | `cong.js tinh` ở bước 4 không có ✗ để dẫn / luôn có A19, A8 | PA-A mục 4, Q3 |
| 10 | A1b không có VS- — lệch chữ A7 phải nói thẳng | mục 2, Q4 |
| 11 | neo A3 so trên `sk` hay `than` toLowerCase | mục 4 ca thử |

Agent chưa soát được: chưa chạy bài nào (đỏ trên gốc của A1/A1b là suy từ code); chưa đọc nhật ký người gác; chưa có code hàm
`quetRouteGhi` để soi số dòng R5/R6.
