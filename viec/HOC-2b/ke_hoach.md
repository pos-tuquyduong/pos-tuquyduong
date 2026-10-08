# HOC-2b — Kế hoạch (bước 3 — ĐÃ DUYỆT 07.10)

**Chủ quán duyệt 07.10 — thay các chỗ khác trong file này:** Q1 ngưỡng cảnh báo gần hạn **80 %** hạn (96 s), không 75 %
(chat đo chạy riêng: thu_gia_lap 80,4 s, giả lập 67,7 s). Q2 chọn **(b)**, thêm vào phần CHẠY THẬT: mọi đột biến D1 của AUDIT-1
và mọi đối chứng M0-* của HOC-1, HOC-2; phần sang AUDIT-2 liệt kê đủ tên. P1: đo lại `thu_cong` CHẠY RIÊNG trước khi ghi; số đo
trong chú thích S4 cũng đo chạy riêng. Ca C3 dùng hạn giả 3 s / bài ngủ 2,6 s (ngưỡng 2,4 s) — bốn ca chạy song song trong worker.

Đọc trong lượt này: `viec/HOC-2b/phieu.md`; `CLAUDE.md`; `KHUON_LOI.md`; `viec/HOC-2/ke_hoach.md` 1–60, 192–365 (phần C/D/E đã
qua soát 05.10 — đối chiếu lại với code, không chép mù); `kiem_tra_truoc_khi_giao.js` 322–380, 403–488, 540–630, 730–783;
`cong_cu/gia_lap/bat_bien.js` 128–157; `cong_cu/gia_lap/kich_ban.js` 300–357; `cong_cu/thu_gia_lap.js` cả file;
`cong_cu/thu_P26b.js` 140–150, 323–380 + mọi dòng `k(`; `cong_cu/thu_P20.js` mọi dòng `k(`; `server/routes/refunds.js` 150–175;
`server/routes/orders.js` 160–165, 522, 698–720, 825–845; `server/routes/signup-codes.js` 40–72, 370–395;
`server/routes/wallets.js` 60–75 (ghiVi); `viec/P26b/dot_bien.py`, `viec/TU-CHAY-4/dot_bien.py`, `viec/HOC-2/dot_bien.py` (cả file);
`viec/AUDIT-1/dot_bien.py` 1–40, 87–88, 129–132, 205–300, 330–418; `viec/AUDIT-1/c2_day_du.md` 1–90; `viec/HOC-1/dot_bien.py` 9, 33–36;
`tu_chay/cau_hinh.json`; `tu_chay/thu_cong_cu.js` 317–368 (F2, F3 soi CLAUDE.md / KHUON_LOI.md).

## Số đo thật lúc lập kế hoạch (máy mây 4 lõi, HEAD `4a51723`, 07.10.2026)
`node kiem_tra_truoc_khi_giao.js --day-du`: PASS 65 · FAIL 0 · CẢNH BÁO 0. Thời gian các bài chạy thật (dòng ✓ của bộ kiểm):

| bài | giây | hạn `chayBaiThat` |
|---|---|---|
| `cong_cu/gia_lap/chay.js` | **69,3** | 120 |
| `cong_cu/thu_gia_lap.js` | **77,4** | 120 (giả lập con: 110, `thu_gia_lap.js:52`) |
| `tu_chay/thu_cong.js` | **91,3** | 120 — xem Phát hiện P1 |
| `tu_chay/thu_nguoi_gac.js` · `thu_cong_cu.js` | 9,4 · 4,7 | 120 |
| `thu_P20` · `thu_P21` · `thu_P26a` · `thu_P26b` | 2,2 · 1,6 · 1,3 · 2,5 | 120 |

GitHub (bước `cong-chay` của PR #10): **CHƯA ĐỌC ĐƯỢC** — người gác chặn công cụ GitHub (`[CC-LA] mcp__github__actions_list`).
Ghi CHƯA KIỂM; chat đo khi soát cuối (phiếu C3 cho phép).
Đo D5: xem mục "Thời gian máy" cuối file.

---

## Câu hỏi cho chủ quán (trả lời khi duyệt)

**Q1 — Ngưỡng cảnh báo gần hạn (C3): đề xuất 75 % hạn = 90 s.** Bình thường ở máy mây: giả lập 69,3 s, `thu_gia_lap` 77,4 s →
không bật (dư 20,7 s và 12,6 s). Máy GitHub chưa đo được (người gác chặn). Nếu chat đo thấy `cong-chay` chậm hơn máy mây
≥ 15 % thì `thu_gia_lap` sẽ bật cảnh báo MỖI lần (báo oan — K8). Phiếu cấm nới hạn, nên lúc đó chỉ có hai đường: nâng tỉ lệ
(vd 80 % = 96 s) hoặc làm giả lập nhanh hơn (việc khác). Đề nghị: duyệt 75 %; chat đo GitHub khi soát, lệch thì sửa tỉ lệ
trong vòng soát.

**Q2 — Tổng việc ước ~3–3,5 giờ máy (> 150 phút) → chủ quán chọn cách làm D5** (máy KHÔNG tự cắt; số đo ở mục cuối):
riêng D5 đo trên HEAD gốc ~97 phút + ~18 phút chưa đo được = **~115 phút**, cộng C–E + các lần `--day-du` + `/ra-soat` 1–3 vòng.
- **(a) Tách việc:** HOC-2b làm C1–C5, D2–D4, E1–E2 + chạy lại những bộ đột biến việc này CHẠM (P26b, TU-CHAY-4, HOC-2b, AUDIT-1
  nhóm `D1-S3-vi-lech` + `!D1-E11-*` + `kiemdd`). Việc sau (AUDIT-2 / D5 riêng): chạy lại cả AUDIT-1 + HOC-1 + HOC-2 trên head đã gộp.
- **(b) D5 thu hẹp (cách phiếu nêu):** (1) MỌI đột biến của 6 bộ: kiểm "chuỗi gốc khớp đúng số lần" trên head mà KHÔNG chạy lệnh
  đo (vài giây — phát hiện mọi neo rữa); (2) chạy thật: mọi đột biến có chuỗi gốc trong file việc này sửa (`bat_bien.js`,
  `kich_ban.js`, `kiem_tra…js`, `thu_gia_lap.js`, `thu_P26b.js`) hoặc đo bằng bài/giả lập việc này sửa VÀ trước đây BẮT —
  gồm cả bộ P26b (214 s), TU-CHAY-4 (~14 phút), HOC-2b, HOC-1 MC/MC2/MC3 (neo khối T2), AUDIT-1 C2F đã BẮT (40 — đo bằng giả lập
  + thu_P26b, ~15 phút) + `!D1-*` + `D1-S3-*`; ước ~45–55 phút. (3) phần còn lại (AUDIT-1 A3/B1/C2/C2F SỐNG, HOC-1 khác MC*, HOC-2:
  chỉ đo bằng `tu_chay/` — việc này không đổi `tu_chay/`) ghi sang AUDIT-2 kèm danh sách tên.
- **(c) Làm đủ D5 như phiếu** (~115 phút chỉ riêng D5, chạy tuần tự để không đo oan — chạy song song các bộ thì `thu_cong` 91 s
  sát hạn 120 s trong `!D1-*` sẽ TREO/LẠC oan).
Đề nghị: (b) — phủ đúng chỗ việc này có thể làm hỏng, phần bỏ lại chỉ đo bằng `tu_chay/` mà việc này không chạm.

---

## C. Bộ kiểm + giả lập

### C1 — chú thích lý do cho T2, T3, T4, F2 (`kiem_tra_truoc_khi_giao.js:551, 576, 589, 619`)
Chỉ thêm dòng chú thích NGAY DƯỚI dòng tiêu đề `// T2 …`, `// T3 …`, `// T4 …`, `// F2 …` — KHÔNG chèn vào thân khối
(neo của `viec/HOC-1/dot_bien.py:33–36` MC/MC2/MC3 và khối T2 mà `thu_cong_cu.js` cắt ra phải nguyên).
- T2–T4: "Giữ CẢNH BÁO (chủ quán chốt 1b): máy sửa `tu_chay/` trên nhánh thì bản cài chắc chắn lệch tới khi chủ quán chạy
  `cai_dat.sh`; cổng A8 đã chặn cứng ở PR — nâng thành FAIL là chặn commit của chính việc đang sửa `tu_chay/`."
  (T3, T4 một dòng trỏ về lý do ở T2.)
- F2: "Giữ CẢNH BÁO (1b): người gác chặn tạo `.js` ở gốc trong phiên việc; file lạc cũ không làm hỏng quầy."
- Bằng chứng: `npm test` trước/sau cùng PASS · FAIL · CẢNH BÁO (ghi hai dòng ĐẾM vào `trang_thai.md`).
- A/B: A = 1–2 dòng mỗi chỗ (~6 dòng). B = gom một khối chú thích chung trước T2 (~4 dòng) — đọc T4/F2 không thấy lý do. Chọn A.

### C2 — bỏ I10
- `bat_bien.js:137–145` xoá chú thích + hàm I10; `:146–147` chú thích I11 bỏ câu so I10 (giữ "theo TỪNG ví … tổng refund ≤
  phần ví đó đã trả"); `:2` "11 bất biến" → "10 bất biến".
- `kiem_tra_truoc_khi_giao.js:745` `NGUONG_BAT_BIEN = 10` + chú thích "I10 ⊂ I11, không giảm độ phủ (HOC-2b, chủ quán chốt 2a)";
  `:742` "chỉ được TĂNG" → "chỉ được TĂNG (trừ lần hạ có chủ quán chốt)".
- `thu_gia_lap.js:31` `DONG_DAT` → `· 10 bất biến ·`; `:80`, `:82` (M11, M12) mong `'I11'`.
- Lẽ bao trùm (ghi kèm, chứng minh bằng CHẠY): tiền nguyên; Σ_ví(hoàn − trả) > 0,5 ⇒ có ví (hoàn − trả) ≥ 1 > 0,5 ⇒ dòng
  I10 nào lệch thì I11 lệch cùng đơn.
- Bảng "đột biến → bất biến bắt" (chạy sau sửa, ghi `trang_thai.md`): `thu_gia_lap` M11 → `KB13 → I11`, M12 → `KB14 → I11`;
  `viec/P26b/dot_bien.py` `huy-kiem-ngoai-tx` (mẫu `|I10` → `|I11`, `:28`), `xoa-doc-don-ngoai-tx` (`:37`). Chuyển SỐNG → DỪNG.
  Hai mẫu P26b có dạng `(HTTP: …|I11)` — BẮT nhờ nhánh HTTP không chứng minh I11 bắt: bảng chép NGUYÊN dòng thật đã khớp
  (`trung[0]`), và in thêm mọi dòng `→ I\d` của lần chạy đó; không tự điền "I11".
- Sau sửa: `git grep -n "I10\|11 bất biến" -- ':!viec/' ':!TIEN_DO_POS.json'` phải rỗng (trừ chú thích mới "I10 ⊂ I11").
  `TIEN_DO_POS.json:354, 390, 399` có chữ I10 — sổ việc, Cấm sửa, phiếu chỉ đòi soát code + bài thử.

### C3 — cảnh báo gần hạn (chỉ giả lập + `thu_gia_lap`)
- `kiem_tra…js:477` `function chayBaiThat(bai, env, han = 120000, canhGan = false)`: `timeout: han`; bài XANH và
  `canhGan` và thời gian > `han × 0,75` → `canhBao('bài chạy thật X gần hạn', 'chạy Y s / hạn Z s — …')`. Bài đỏ → chỉ FAIL
  như cũ (không thêm cảnh báo). +~3 dòng.
- Hai lời gọi `:749`, `:753` thêm `, 120000, true`. Bốn bài thu_P2x (`:488`) và ba bài `tu_chay/` (`:545–549`) KHÔNG đổi.
- `:746` chú thích S4 sửa theo số đo thật: "đo 07.10.2026 máy mây: giả lập 69 s, thu_gia_lap 77 s; cảnh báo khi > 75 % hạn".
  (Số "22 s" ở `tu_chay/THIET_KE.md:386` ngoài Phạm vi → `## Phát hiện`.)
- A/B: A = tỉ lệ cố định 0,75 × hạn (~3 dòng). B = ngưỡng giây riêng mỗi lời gọi (`{ han, nguong }`, ~5 dòng, thêm một số
  cứng phải giữ đồng bộ với hạn). Chọn A.
- Ca thử trong `cong_cu/thu_gia_lap.js` (nhóm `[C3]`, ~25 dòng): đọc `kiem_tra_truoc_khi_giao.js` của GOC, cắt khối từ
  `function chayBaiThat(` tới `\n}\n` đầu tiên, dựng bằng `new Function('spawnSync','path','GOC','chac','canhBao', khối + 'return chayBaiThat;')`
  với `chac`/`canhBao` giả ghi lại lời gọi; GOC = TAM có `ngu.js` (ngủ 2000 ms, thoát 0) và `hong.js` (thoát 1).
  Biên rộng để không đỏ ngẫu nhiên (node khởi động 50–150 ms, máy đang bận): hạn giả 2600 ms → ngưỡng 1950 ms, bài ngủ 2000 ms
  ⇒ cảnh báo, còn 600 ms tới hạn. Nhóm `[C3]` chạy TRƯỚC khi bắn các giả lập con song song (`thu_gia_lap.js:120–138`), không
  chồng lên chúng (+~2 s cho cả bài). Mọi thứ mới của `chayBaiThat` (tham số, tỉ lệ 0,75) nằm TRONG thân hàm, không `}` ở cột 0
  trong thân — để cắt tới `\n}\n` đầu tiên đúng hàm.
  - C3a hạn giả 2600 ms, `canhGan` → đúng 1 cảnh báo, `chac` đúng.
  - C3b hạn thật 120000, `canhGan` → 0 cảnh báo.
  - C3c `hong.js`, hạn thật, `canhGan` → `chac` sai, 0 cảnh báo.
  - C3d hạn giả 2600 ms, KHÔNG `canhGan` → 0 cảnh báo (chỉ hai lời gọi bật — K5).
  - C3e cắt không được (không thấy khối / dựng lỗi) → ca ĐỎ, không sập cả bài.
  Đỏ trên gốc: `chayBaiThat` gốc không có tham số hạn/cảnh báo → C3a ĐỎ (C3e xanh).
  C3e đỏ bằng đột biến `VS-C3-doi-ten-ham` (`viec/HOC-2b/dot_bien.py`, kiểu `glk`: bản sao có `kiem_tra…js` + `cong_cu/`, liên kết
  `server/`, `tu_chay/`, `node_modules`; đổi `function chayBaiThat(` → `function chayBaiThat2(` trong `kiem_tra…js` của bản sao,
  chạy `thu_gia_lap` của bản sao) → "✗ C3e".
- Bản sao đột biến đang dùng có chạy `thu_gia_lap` (K5 bản sao): TU-CHAY-4 `gl` và P26b `thugl` chạy với cwd = kho thật
  (có `kiem_tra…js`); AUDIT-1 `thugl` khai báo nhưng không đột biến nào dùng; `kiemdd` chép đủ kho. → không bản sao nào
  làm C3e đỏ oan. Kiểm lại bằng D5.

### C4 — `cong_cu/thu_P26b.js` (+~14) và KB17-Q9 (`kich_ban.js:322–326`, +~2)
- M6 (`thu_P26b.js:351–352`) `<= 1` → `=== 1`, tên ca "(tổng hoàn mẹ = đúng 1 dòng)".
- M9 "đơn có ví mẹ, phần mẹ 0đ (con trả đủ 25.000 bằng ví) → duyệt 200, 0 dòng hoàn mẹ, ví mẹ không đổi": `donMe(25000)`
  (đơn lưu `parent_phone` dù phần mẹ 0 — `orders.js:845` `normalizedParentPhone || null, actualParentBalanceAmount`).
- M10 "yêu cầu cũ (dữ liệu trước bản vá) trên đơn có ví mẹ → duyệt 200, ví mẹ +20.000, đúng 1 dòng hoàn mẹ": `donMe(5000)`
  + `ycCu(d)` (`:143`) + `duyet`.
- KB17-Q9: `const tQ9 = await c.goi(...)`; `c.mong('đơn ví con 5.000 + ví mẹ 20.000 tạo được (200)', tQ9.status === 200, c.ma(tQ9))`
  TRƯỚC `c.yeuCau`; `dQ9 = tQ9.order?.id`.
- KHÔNG sửa `server/`. Ca nào đỏ trên code hiện tại → DỪNG, ghi `## Câu hỏi`.
- Đỏ trước = đột biến trong `viec/HOC-2b/dot_bien.py` (bản sao `server/`, `thu_P26b --may-chu`; giả lập `--may-chu --den-kb 17`):
  - `VS-q9-me-lon-hon-bang-0`: `refunds.js:165` `Number(me.parent_balance_amount) > 0` → `>= 0` → M9 ĐỎ (ghiVi soTien 0 thêm 1 dòng refund mẹ).
  - `BV-q9-bo-hoan-me`: `:165` `if (me?.parent_phone && Number(me.parent_balance_amount) > 0) {` → `if (false) {` → M6 (nhờ
    `=== 1`), M10 (và M5) ĐỎ.
  - `KB17-khong-nap-me`: bản sao `cong_cu/gia_lap/` bỏ `await c.nap(ME, 20000);` → dòng "tạo được (200)" ĐỎ.
- Bản GỐC `thu_P26b.js` (main `b681ede`) chạy trên code PR → phải XANH (chạy bằng bản sao: `git show b681ede:cong_cu/thu_P26b.js`
  vào thư mục nháp + liên kết `server/`, `node_modules`). Đỏ → DỪNG.

### C5 — `thu_P20` còn sống
Phép tĩnh E9 (`kiem_tra…js:403–445`) chỉ soi: `kiemDonCuaMa` là danh sách trắng (`completed` + `paid`), được gọi, kết quả được
dùng trước lệnh ghi; chiếm mã `AND claimed_at IS NULL` / `AND diem_nhan_luc IS NULL` + dạng chặn. KHÔNG soi nhánh chọn lời báo.
Ứng viên (thử theo thứ tự, lấy cái đầu tiên đạt cả hai điều kiện):
1. `C5-P20-hoan-bao-huy`: `signup-codes.js:62` `if (don.status === 'cancelled') {` → `if (don.status === 'cancelled' || don.status === 'refunded') {`
   → `thu_P20` "✗ /claim với đơn đã hoàn tiền → 400 DON_DA_HOAN" (`:190`, `:193`).
2. `C5-P20-no-bao-hoan`: nhánh `BILL_CHUA_THANH_TOAN` (`:71`) đổi mã → `thu_P20:140–158` đỏ.
Chạy `node kiem_tra_truoc_khi_giao.js` (bản nhanh — có E9 tĩnh + `thu_P20` chạy thật `:488`) trên BẢN SAO cả kho dựng theo
khuôn AUDIT-1 `dung_ban_sao` kiểu `kho` (`viec/AUDIT-1/dot_bien.py:243–255`: mọi file git theo dõi trừ `attached_assets/`, liên
kết `node_modules`, `client/node_modules`; GIỮ bài chạy thật — như `!D1-E11-P20` `:129`; chép khuôn, không import, không sửa
AUDIT-1). Đối chứng `M0-kiem` (bản sao chưa đột biến) phải thoát 0, 0 dòng ✗ — chạy trước, đỏ thì không chấm C5. Đột biến:
ĐỎ đúng dòng "bài chạy thật cong_cu/thu_P20.js" VÀ không dòng ✗ nào khác (kiểm bằng cả hai). Không dựng được → ghi rõ vì sao. Xanh với mọi ứng viên → DỪNG, ghi
`## Câu hỏi`. `thu_P20.js` không sửa (A).

## D. Đột biến cũ và công cụ cũ
- **D2** `viec/P26b/dot_bien.py:138–139` bỏ `I10-bo`, thay bằng 1 dòng chú thích "bỏ ở HOC-2b: I10 xoá (I10 ⊂ I11, chủ quán chốt 2a)";
  `:28`, `:37` mẫu `|I10` → `|I11`. Đỏ trước: `I10-bo` HỎNG ngay trên HEAD gốc — neo `return ds.filter((r) => so(r.hoan) >
  so(r.tra) + 0.5)` khớp 2 lần (`bat_bien.js:143`, `:152`), cần 1 (`grep -c` = 2, đo 07.10) — chạy `python3 viec/P26b/dot_bien.py
  I10-bo` trên gốc, chép vào `bang_chung_do.txt`. (Sau C2 neo còn 1 lần — trong I11 — nên giữ `I10-bo` sẽ tắt I11: phải XOÁ, không
  sửa neo.) Sau D2: cả bộ 0 HỎNG.
- **D3** `viec/TU-CHAY-4/dot_bien.py:55–66` kiểu `tai_cho` → bản sao: chép mọi file git theo dõi (trừ `attached_assets/`) vào
  thư mục tạm, liên kết `node_modules`; `client/node_modules` CHÉP (symlinks=True) khi chạy `--day-du` (bước so `dist` build
  vào `client/node_modules/.vite` — như AUDIT-1 `khodd`, `dot_bien.py:252`), liên kết khi chạy bản nhanh. Thay chuỗi trong bản
  sao, chạy bộ kiểm của bản sao. Chụp trước/sau ở kho thật: `git status --porcelain` + danh sách `data/` (tên:mtime) +
  `client/node_modules/.vite` mtime; khác → in "KHO BẨN", thoát 3. F2, S3 → ĐỎ đúng chỗ. (~+20 dòng, −10.)
  - A/B: A = chép như trên (~20 dòng). B = gọi `cong_cu/ban_sao_goc.py` — chỉ dựng `server/` (Phát hiện 5 của HOC-2 là chế độ
    cả kho, ngoài Phạm vi). Chọn A.
  - Đỏ trước (`viec/HOC-2b/dot_bien.py`, kiểu `tc4`): dựng kho tạm (chép file git theo dõi + `git init` + commit trong thư mục
    tạm), chạy `python3 viec/TU-CHAY-4/dot_bien.py S3` TRONG kho tạm:
    `M0-tc4` (bản đã sửa) → "✓ S3", không "KHO BẨN"; `VS-D3-ghi-that` (bản sao trỏ về GOC — ghi file thật, không trả lại)
    → "KHO BẨN", thoát ≠ 0. (Không thêm đột biến "bỏ chụp": bỏ chụp thì không gì in "KHO BẨN" — chính `VS-D3-ghi-that` đã là
    ca bắt; một BV- riêng không dựng được ca đỏ khác.)
- **D4** `git rm cong_cu/thu_p1.js`. `git grep -l thu_p1` hiện còn: `CHECKLIST_CODE.md`, `TIEN_DO_POS.json`, `lui_KHOTHU_v2.sh`,
  `patch_pos_khothu_v2.py`, `viec/AUDIT-1/{b_bang,bang_chung_do.txt,bao_cao,ke_hoach,trang_thai}.md`, `viec/HOC-2/{ke_hoach,phieu}.md`,
  `viec/HOC-2b/phieu.md` → không sửa, ghi `## Phát hiện` cho DON-DEP-v1. Kiểm: không bài/bộ kiểm/package.json nào gọi nó.
- **D5** chạy LẠI CẢ BỘ trên head cuối: AUDIT-1 (mọi nhóm kể cả C2F; 170 đột biến — chính công cụ đếm), P26b, HOC-1,
  TU-CHAY-4, HOC-2, HOC-2b. Bảng BẮT / SỐNG / HỎNG / LẠC từng bộ, ĐẾM đủ. Mong: 0 HỎNG (trừ `G3-sai-chuoi` cố ý); SỐNG chỉ là
  C2F của AU-G1/G2/G3/G4/G6 — liệt kê tên; C2F BẮT ở `c2_day_du.md` vẫn BẮT. AUDIT-1 HỎNG vì neo rữa → ghi `## Phát hiện`,
  không sửa `viec/AUDIT-1/`. So với lần chạy trên HEAD gốc (đang đo — mục cuối) để tách "rữa sẵn" với "do việc này".
  Lưu ý đo: AUDIT-1 so cả nhật ký người gác → lệnh của chính phiên trong lúc chạy làm "KHO BẨN" oan; lần chạy D5 thật không
  gọi lệnh nào khác song song.

## E. Tài liệu
- **E1** `KHUON_LOI.md` 120 → ≤ 100 dòng; `khuon_loi_toi_da` giữ 120 (F3 `thu_cong_cu.js:317–328`). Giữ số hiệu + tên K1–K8,
  "Năm câu tự hỏi", mỗi khuôn giữ "Dấu hiệu" + "Chặn", "Đã gây" 1–2 ví dụ.
  Bỏ (đã có phép làm thay): K3 "LUẬT CỨNG chạy trên bản chưa vá, phải hỏng" + "'đỏ trên gốc' kèm 'xanh trên bản vá'" ← cổng
  A11/A12; K3 "đổi bài sau khi ghi bằng chứng → chạy lại" ← A16; tên đột biến trong hồ sơ ← A17; vá sai ← A18 (giữ một vế
  ngắn "cổng A11/A12/A16–A18 chặn" để người đọc biết). K7 "tên script npm test" giữ (không có phép).
  Gộp (không thêm mục mới): K8 + "phép tự-kiểm báo oan dạy người bỏ qua nó"; K3 + "con số 'đạt' kèm lần chạy lại trên HEAD;
  đột biến neo NGẮN/RIÊNG"; K3 + "phép so bằng → ca lệch CẢ HAI chiều; phép tiền tố → ca chuỗi nằm GIỮA; luôn cài đột biến
  'nới phép'"; K1/K5 + "xếp đường tiền theo cái khách chạm ở quầy + middleware + khoá trong thân hàm; nhánh hỏng (SX lỗi,
  mạng) đụng kho/tiền là NẶNG"; K4 + "chạy lại bằng chứng → grep hồ sơ tìm mọi câu trích con số cũ"; K5 + "bài thử mới phải
  chạy được trong mọi bản sao đột biến đang dùng".
  `trang_thai.md` có bảng "dòng/ý bỏ → lý do (phép X / gộp vào Kn)". Kiểm: `wc -l` ≤ 100; F3 xanh; `npm test` xanh.
- **E2** `CLAUDE.md:112–114`: "`POST /orders` ĐÃ CÓ cổng phân quyền cho các trường đặc quyền … — bộ kiểm nhóm E canh" →
  "… về cổng phân quyền, bộ kiểm nhóm E chỉ canh `from_package` (mẫu thô `item.from_package ? 0` + marker POS-AUTHZ-v1);
  chiết khấu (`discount_type`/`discount_value`) và mã gói (`customer_package_id`) không có phép tĩnh (`kiem_tra…js:367–375`) —
  tự soi, mục G". (Nhóm E còn canh việc khác: E7 pay-debt, E9 mã bill, E12 ví — câu không được hiểu là "nhóm E chỉ có một phép".) `:26` bỏ "(36 phép lúc 24.09.2026)". Giữ "bắt buộc đủ 7 mục",
  dòng `BÀI HỌC:`, không thêm "6 mục" (F2 `thu_cong_cu.js:364–368`). K4: `grep -n "nhóm E\|phép kiểm tự động\|[0-9]\+ phép" CLAUDE.md`.

## Cổng của chính PR này (cổng main tu-chay 1.4.0) — file bài thử bị đụng

| file | ca ĐỎ trên code gốc | dòng miễn / SỐ CA |
|---|---|---|
| `cong_cu/thu_gia_lap.js` | E1 "dòng tổng đúng … 10 bất biến" (gốc in 11); M11/M12 mong I11 (gốc KB13/14 → I10 + I11, ca chấm theo `KB13 → I11:` — xem ghi chú); C3a | KHÔNG miễn → dòng `SỐ CA cong_cu/thu_gia_lap.js: N` |
| `cong_cu/thu_P26b.js` | xanh trên gốc (server không đổi) — đỏ bằng đột biến C4 | `## Bài thử cũ sửa`; bản gốc chạy trên code PR phải XANH (sẽ chạy) |
| `cong_cu/thu_P20.js` | không đụng (C5 phương án A) | — |
| `cong_cu/thu_p1.js` | xoá — không phải bài thử của cổng | — |
Ghi chú M11/M12: trên gốc I11 CŨNG lệch ở KB13/14 (đó là lẽ bao trùm) nên hai ca này có thể XANH trên gốc; ca đỏ trên gốc của
`thu_gia_lap` là E1 (DONG_DAT) và C3a — đủ cho A11/A12. A18 không áp (không đổi `server/`, `client/src/`).

## Danh sách ca thử ↔ Nghiệm thu

| NT | ca / bằng chứng | đỏ trước bằng |
|---|---|---|
| C1 | `npm test` trước/sau: cùng PASS · FAIL · CẢNH BÁO (2 dòng ĐẾM trong `trang_thai.md`) | chú thích, không hành vi |
| C2 | `thu_gia_lap` E1 (10 bất biến), M11 → I11, M12 → I11; P26b `huy-kiem-ngoai-tx`, `xoa-doc-don-ngoai-tx` BẮT `I11`; bảng tên → bất biến; `git grep I10` | gốc 11 bất biến → E1 ĐỎ |
| C3 | `thu_gia_lap` C3a–C3e; số đo thật trong chú thích S4; `--day-du` lúc thường 0 CẢNH BÁO | gốc không cảnh báo → C3a ĐỎ; `VS-C3-doi-ten-ham` → C3e ĐỎ |
| C4 | `thu_P26b` M6 `===1`, M9, M10; KB17 "tạo được (200)"; bản gốc thu_P26b xanh trên code PR | `VS-q9-me-lon-hon-bang-0`, `BV-q9-bo-hoan-me`, `KB17-khong-nap-me` |
| C5 | `M0-kiem` xanh; bộ kiểm bản nhanh trên bản sao đột biến: đỏ ĐÚNG và CHỈ dòng thu_P20 | `C5-P20-hoan-bao-huy` (hoặc ứng viên 2) |
| D2 | bộ P26b 0 HỎNG | `I10-bo` HỎNG trên HEAD gốc (neo khớp 2 lần) |
| D3 | TU-CHAY-4 F2, S3 ĐỎ đúng chỗ; chụp kho trước/sau giống nhau | `VS-D3-ghi-that` → KHO BẨN |
| D4 | `git grep -l thu_p1` sau xoá = danh sách Phát hiện | — |
| D5 | bảng đếm 6 bộ, so lần chạy gốc | — |
| E1 | `wc -l KHUON_LOI.md` ≤ 100; F3 xanh; bảng bỏ/gộp | — |
| E2 | grep CLAUDE.md: không "36 phép"; câu nhóm E nêu `from_package`, không gán `discount_*` cho nhóm E; F2 xanh | — |
| F1 | `trang_thai.md` + câu trả lời đầu (đã làm) | — |
| F2 | 2 check `cong` + `cong-chay` — CHƯA KIỂM (máy không làm được) | — |
| G | `npm test`, `--day-du` (0 CẢNH BÁO), `thu_gia_lap`, `thu_P20`, `thu_P26b` chạy riêng | — |

Đường tiền: không đổi `server/` → không có ca "hai người cùng bấm" mới; C4 chỉ thêm ca trên đường hoàn ví mẹ đã có (KB17 B5
đã có ca chồng nhau ví mẹ).

## Luồng hợp lệ phải KHÔNG bị chặn (K5)
1. Bộ kiểm lúc thường (giả lập 69 s, `thu_gia_lap` 77 s) → 0 CẢNH BÁO (G). Q1 về GitHub.
2. Bài thử khác chạy chậm (`thu_cong` 91 s) → KHÔNG cảnh báo (C3 chỉ hai lời gọi; ca C3d).
3. Bài đỏ → FAIL như cũ, không thêm cảnh báo (C3c).
4. Đơn có ví mẹ phần mẹ 0đ → duyệt 200 (M9); yêu cầu cũ trên đơn ví mẹ → duyệt 200 (M10); đơn con+mẹ → 200 (M5 giữ).
5. Bản sao đột biến đang dùng chạy `thu_gia_lap` (TU-CHAY-4 `gl`, P26b `thugl`, AUDIT-1 `kiemdd`) vẫn xanh ở M0 — D5.
6. TU-CHAY-4 `gl` (E4a–E4g) không đổi cách chạy; E4c `.slice(0, 8)` vẫn bắt với 10 bất biến.
7. `npm test` bản nhanh không chạy giả lập (S4 giữ).

## Đường song song cần canh (K4)
- Bỏ I10: `bat_bien.js:2, 137–147`, `kiem_tra…js:742, 745`, `thu_gia_lap.js:31, 80, 82`, `viec/P26b/dot_bien.py:28, 37, 138–139`.
- `chayBaiThat` có 4 chỗ gọi (`:488` vòng 4 bài, `:545–549`, `:749`, `:753`) — chỉ hai chỗ cuối bật.
- Hai thời gian hạn trong `thu_gia_lap` (110 s mỗi giả lập con, `:52`) và bộ kiểm (120 s) — không đổi cái nào (Cấm).
- Hoàn ví mẹ có 3 đường: duyệt (`refunds.js:165`), huỷ (`orders.js:1337`), xoá (`orders.js:1499`) — C4 chỉ thêm ca cho duyệt
  (phiếu); huỷ/xoá đã có M2, M3, M4.
- Tài liệu: "36 phép", "11 bất biến", "22 s", "nhóm E" — grep CLAUDE.md, KHUON_LOI.md, chú thích bộ kiểm.
- Neo đột biến cũ trên vùng sửa: HOC-1 MC* (khối T2 — C1 không chạm), TU-CHAY-4 E4c/E4d/S3, AUDIT-1 `D1-S3-vi-lech` (danh sách
  trắng ví — không chạm).

## Ngân sách dự kiến (so phiếu)
Code ~60: `kiem_tra…js` +~12 (phiếu ±25), `bat_bien.js` −~10, `kich_ban.js` +~2, `chay.js` 0, `viec/P26b/dot_bien.py` ±~4,
`viec/TU-CHAY-4/dot_bien.py` +~20 −~10, `thu_p1.js` −106. Thử ~45: `thu_gia_lap.js` +~28, `thu_P26b.js` +~14, `thu_P20.js` 0.
Hồ sơ `viec/HOC-2b/dot_bien.py` ~80 (năm kiểu chạy: `p26b`, `kb17`, `glk`, `kiem`, `tc4` — phiếu ~60; vượt vì D3/C3e cần bản sao riêng). Tài liệu: `KHUON_LOI.md` 120 → ≤ 100, `CLAUDE.md` ±~4.


## Soát kế hoạch (agent phụ, chỉ đọc) — CẦN SỬA → đã sửa vào bản này
Ngoài Phạm vi / trái Cấm: không. Đã sửa 6 điểm:
1. C3a/C3d: biên thời gian rộng (ngủ 2000 ms / hạn 2600 ms), nhóm C3 chạy trước các giả lập con song song; mọi thứ mới trong thân hàm.
2. C3e: thêm đột biến `VS-C3-doi-ten-ham`.
3. D2: bằng chứng đỏ = `I10-bo` HỎNG trên HEAD gốc (neo khớp 2 lần — đã `grep -c` lại: 2); bỏ câu "HỎNG sau C2".
4. C2: grep bỏ `TIEN_DO_POS.json` (Cấm); bảng bất biến chép dòng thật đã khớp (mẫu `HTTP|I11` không chứng minh I11).
5. E2: câu mới nêu cả mã gói `customer_package_id`, giới hạn "về cổng phân quyền".
6. C5: đối chứng `M0-kiem`; dựng bản sao theo khuôn AUDIT-1 `kho`. Thêm Phát hiện `tu_chay/THIET_KE.md:388`. Đo thời gian máy (mục dưới).
Nhận gợi ý ngắn hơn: bỏ `BV-D3-bo-chup`; C5 chép khuôn bản sao AUDIT-1.

## Thời gian máy (đo 07.10.2026, máy mây 4 lõi, HEAD gốc `4a51723`, chạy tuần tự)
| bộ | lệnh | thời gian | kết quả trên gốc |
|---|---|---|---|
| bộ kiểm `--day-du` | `node kiem_tra_truoc_khi_giao.js --day-du` | ~4,5 phút (cộng các bài chạy thật ~260 s) | PASS 65 · FAIL 0 · CẢNH BÁO 0 |
| AUDIT-1 (mặc định, 170 đột biến — không gồm G3) | `python3 viec/AUDIT-1/dot_bien.py -j 4` | **2415 s** | A3 16 BẮT · B1 8 BẮT · C2 2 BẮT 1 SỐNG · C2F 40 BẮT 45 SỐNG 1 LẠC · D1 55 BẮT 2 LẠC · 0 HỎNG · 0 TREO; "KHO BẨN" oan (nhật ký người gác đổi do lệnh khác của phiên — Phát hiện P4) |
| AUDIT-1 G3 (4) | `… G3` | chưa đo (~2 phút: kb1, kb10, c2) | — |
| P26b (60) | `python3 viec/P26b/dot_bien.py` (6 luồng) | **214 s** | 59 BẮT · 1 HỎNG = `I10-bo` "chuỗi gốc khớp 2 lần, cần 1" (bằng chứng đỏ D2) |
| HOC-1 | `python3 viec/HOC-1/dot_bien.py` | **1220 s** | thoát 0; 20 dòng cuối đều "ĐỎ đúng chỗ" (đếm đủ ở D5) |
| TU-CHAY-4 kiểu `gl` (8) | `… dot_bien.py "M0 giả lập" E4a … E4g` | **479 s** | 8/8 đạt |
| TU-CHAY-4 F2, S3 | (kiểu `tai_cho` ghi file thật — KHÔNG chạy trước D3) | chưa đo (~5 phút: một `--day-du` + một bản nhanh) | — |
| HOC-2 (26) | `python3 viec/HOC-2/dot_bien.py` | **1477 s** | 26/26 đạt (3 đối chứng XANH, 23 BẮT) |
| HOC-2b (mới, ~10) | — | chưa có (~10 phút ước: 3 lần thu_P26b, 1 giả lập KB17, 2 bộ kiểm bản sao, 1 thu_gia_lap, 2 kho tạm D3) | — |
Tổng D5 đo được: 5805 s ≈ **97 phút**; + phần chưa đo ~17 phút ⇒ **~115 phút**. Ba bộ chạy tuần tự (HOC-1, HOC-2, TU-CHAY-4)
chiếm 53 phút — script của chúng không có `-j`, nằm ngoài Phạm vi (trừ TU-CHAY-4 — không thêm `-j` để giữ nguyên ngân sách).
Phần còn lại của việc (C–E, mỗi `--day-du` ~4,5 phút × ~4 lần, bộ P26b ×2, `/ra-soat` 1–3 vòng) ~60–90 phút ⇒ tổng ~3–3,5 giờ → Q2.
