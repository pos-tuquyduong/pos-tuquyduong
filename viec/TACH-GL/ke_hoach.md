# TACH-GL — kế hoạch (chờ chủ quán duyệt)

Nền: `2237259 PHIEU: TACH-GL` (cha `263f2ca` sổ v25 ← `28638d0` Merge PR #12 LUOI-1). Máy mây **4 lõi**
(`node -p "require('os').cpus().length"`). Mọi số đo dưới chạy RIÊNG (không lệnh nào khác chạy song song), môi trường lọc sạch
như bộ kiểm. Công cụ đo thử (bản sao `cong_cu/gia_lap/` trong thư mục tạm — KHÔNG ghi `cong_cu/`, KHÔNG ghi `server/`):
- `viec/TACH-GL/do_chia.js [--rieng] <nhóm> …` — chỉ chạy các KB trong nhóm (giữ SỐ GỐC), mỗi nhóm một tiến trình, in CPU
  user + sys của tiến trình; `--rieng` chạy từng nhóm MỘT MÌNH trước.
- `viec/TACH-GL/do_chia_e2.js '<LUOT>'` — 13 đột biến E2 của `thu_gia_lap` (đọc nguyên mảng `DOT_BIEN` từ file đó) trên cách chia
  đề xuất, mỗi đột biến chỉ chạy lượt chứa KB của nó tới KB đó → BẮT / SỐNG (phép B6 TRƯỚC khi chốt cách chia).

## 1. A0 — số đo trên gốc (10.10.2026, máy mây 4 lõi)

| Lệnh | Máy mây (đo) | Chat (đầu phiếu, 1 lõi) |
|---|---|---|
| `node cong_cu/gia_lap/chay.js` | **79,8 s** · ĐẠT 27 KB · 16 bất biến | 79,1 s |
| CPU giả lập (user + sys, `process.cpuUsage()` lúc thoát — `do_chia.js 1-27`) | **4,1 s** (79,6 s thực) | 3,3 s (`time`) |
| `node cong_cu/thu_gia_lap.js` | **89,6 s** · 109 đạt · 0 hỏng | 97,5 s · CPU 22,2 s |
| `node kiem_tra_truoc_khi_giao.js --day-du` | **252,5 s** · PASS 65 · FAIL 0 · CẢNH BÁO 0 | — |

Lệnh `bash -c 'time …'` có `cd`/`env` bị người gác chặn (B-CD-VITRI, B-CHUONGTRINH) → CPU đo bằng `process.cpuUsage()` của
chính tiến trình giả lập (giả lập là một tiến trình). `taskset -c 0` (giả lập máy 1 lõi) cũng bị chặn (B-CHUONGTRINH) → số 1 lõi
ở mục 4 là ƯỚC, chat đo xác nhận khi soát cuối.

Từng KB (`node viec/LUOI-1/do_thoi_gian.js kb`, ms; vòng bất biến mỗi KB 4–10 ms):

| KB | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ms | 641 | 735 | 731 | 1706 | 2874 | 1295 | 1275 | 1545 | 1872 | 720 | 2601 | 1868 | 2450 | 4554 |

| KB | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | Σ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ms | 3356 | 8134 | 16556 | 3122 | 2386 | 2833 | 7761 | 2148 | 3444 | 1776 | 432 | 582 | 1250 | 78 647 |

Khớp chat (KB17 16,3 · KB16 8,1 · KB21 7,7 · KB14 4,5 · KB23 3,4 · KB15 3,3 · KB18 3,1). CPU 4,1 s / 79,6 s → **~95 % là chờ trễ
40 ms**, xác nhận số của chat; bàn giao bản 17 ("1 lõi không lợi") sai.

## 2. B1 — bảng phụ thuộc (đọc `cong_cu/gia_lap/kich_ban.js` trong lượt này)

Phần dựng `dungDuLieu` (`:17–87`) chạy ở ĐẦU MỖI lượt (mỗi lượt một tiến trình, một kho): mốc id (`:20–24`), cài đặt (`:61–62`),
5 món + giá (`:63–66`), `c.monKhongSx` (`:68–70`), `c.goiId` (`:73–74`), `KH.quen`, `KH.no` (`:75`), `c.goiCoSan` = gói của
KH.quen 10 lượt, đã giao 0 (`:76–77`), ví KH.quen 200.000 (`:78`), `c.donNo` = nợ 50.000 của KH.no (`:79–80`).
Trạng thái theo TIẾN TRÌNH (mỗi lượt riêng, không chia sẻ, bắt đầu rỗng): bộ đếm `sdtMoi` (`:13–14` — mỗi kho riêng nên không
trùng trong một kho); sổ quầy `soQuay.thu/doi/tangMa/giaoGoi` và `nhanKho`, `sxGia` (`chay.js:153`, `:70–71`) — KB20 đọc
`nhanKho` + `soQuay.tangMa` (`:387`, `:401`, `:416`), KB26 ghi `soQuay.giaoGoi` (`:530`), I7/I9/I13/I14 đọc theo lượt của chính nó.

Cột 3 = trạng thái cần để **đột biến** đang bắt ở KB đó vẫn bắt (B6 — soát kế hoạch bắt lỗ: KB8 ← KB4, xem dưới).

| KB | Đọc trạng thái do phần dựng / KB trước tạo | Cần để đột biến vẫn bắt | Kết luận |
|---|---|---|---|
| 1 | — ; ĐẶT `c.billDaThu` (`:93`) | — | KB7 cần |
| 2, 3, 10, 11, 19, 20, 22 | chỉ món / `sdtMoi` / quà, mã tự tạo; KB10 đo trễ trên lệnh của chính nó (`:166`, `:174`); KB20 đếm sổ toàn kho TRƯỚC–SAU trong chính KB (`:386–405`, tương đối) | tự tạo trong KB (M1 KB10, M5 KB11, M6/M8 KB3, M7 KB2) | độc lập |
| 4 | `c.donNo` chưa trả (`:107–110`); ví KH.quen ≥ 10.000 (`:111–113`); trả nợ đơn có SĐT ghi dòng `debt_payment` vào sổ ví KH.quen (`server/routes/orders.js:1257`) | M9 tự tạo | phần dựng đủ |
| **8** | ví KH.quen; đối soát (`:151–153`) so số dư trước–sau | **M3 (đối soát cộng `debt_payment`) chỉ lệch khi sổ KH.quen ĐÃ có dòng `debt_payment` — do KB4 tạo** | **cùng lượt, SAU KB4** |
| 5, 6, 12, 13, 15, 16, 18 | ví KH.quen đủ trả (đơn ví 20.000–30.000 mỗi lần), khẳng định ví TƯƠNG ĐỐI (`truoc + …`, vd `:121`, `:135`, `:201`, `:241`, `:256`) | tự tạo (M4 KB5, M10 KB6, M11 KB13) | phần dựng đủ (200.000 ≥ mọi lần trừ) |
| **7** | **`c.billDaThu` của KB1** (`:138`); claim mã đó bằng **KH.moi** → KH.moi thành khách đã claim | M2 cần bill chưa thu tự tạo | **cùng lượt KB1** |
| 9 | `c.goiId`, `c.goiCoSan` đã giao **0** — khẳng định TUYỆT ĐỐI `delivered_qty = 1` (`:162–163`) | — | KB26 cùng lượt thì phải SAU KB9 (thứ tự tăng tự bảo đảm) |
| **14** | **KH.moi đã claim (KB7)** — khẳng định đơn của KH.moi KHÔNG sinh mã bill (`:221–222`); `c.monKhongSx` | M12 tự tạo | **cùng lượt KB7** (chat thử: thiếu KB7 → KB14 lệch HTTP + I2) |
| 17, 21 | `sdtMoi` (`:281`, `:317`, `:420`), `c.goiId` (`:421`) | M13 tự tạo | độc lập |
| **23** | **KH.moi đã claim** (`:471`) — không thì đơn sinh mã bill, xoá đơn → mã mồ côi (I2, lỗi đã biết P26c (4)) | — | **cùng lượt KB7** (chat: KB23 → I2 2 mã) |
| **24** | — ; ĐẶT `c.kbSxLoi` (`:502`), để 3 dòng nợ kho chờ (`:499–500`) | — | KB25 cần |
| **25** | `c.kbSxLoi`, `sxGia.kb === kbSxLoi + 1` (`:505`) → **KB24 liền trước**; đếm nợ kho TOÀN KHO (`:513`), khẳng định đẩy ĐÚNG 3 (`:516`) → không KB nào trước nó trong lượt để nợ kho (chỉ KB24, KB27 gọi `batSxLoi`) | `VS-SRV-bo-khoa-dangChay` cần 3 nợ của KB24 | **24 → 25 liền nhau, cùng lượt; KB27 (nếu cùng lượt) sau KB25** |
| 26 | KH.no **CHƯA có ví** (`:520–524`, không KB nào khác tạo ví KH.no); `c.goiCoSan` còn lượt, khẳng định TƯƠNG ĐỐI (`:527–531`) | — | phần dựng đủ |
| **27** | **KH.moi đã claim** (`:537`; chat: KB27 → I2 1 mã); để nợ kho của đơn ĐÃ XOÁ → không lệnh đẩy sổ nợ sau nó trong lượt (`:533–534`), lượt < 180 s (tự đẩy, `server/index.js:76`) | — | **cùng lượt KB7; sau KB25 của lượt** |
| 28 (mới, C1) | — (đơn tiền mặt tự tạo) | `VS-SRV-doi-ck-giu-tien-mat` tự tạo | độc lập |
| 29 (mới, C2) | `sdtMoi`, quà tự tạo | 4 đột biến máy chủ C2 tự tạo | độc lập |

Ba phụ thuộc chat đã thấy đều có: KB7 → `c.billDaThu` (KB1); KB14/KB23/KB27 → KH.moi claim ở KB7 (KB14 lệch HTTP khi thiếu KB7).
Nhóm bắt buộc cùng lượt: **{1, 7, 14, 23, 27}**, **{24, 25}** (liền, trước 27), **{4, 8}** (8 sau 4 — để M3 bắt).
→ Giải bằng **(i) đặt cùng lượt** cho mọi phụ thuộc; KHÔNG cần (ii) dựng thêm đầu lượt → `dungDuLieu` không đổi, đột biến
"bỏ phần dựng (ii)" của D4 không áp (không có phần dựng (ii) nào để bỏ).

**Bằng chứng chạy** (`do_chia.js --rieng`, mỗi lượt chạy MỘT MÌNH rồi cùng lúc): mọi cách chia ở mục 3 đều thoát 0, 16 bất biến ·
ĐẠT từng lượt. Sau khi sửa `chay.js`: chạy lại từng lượt riêng trên code thật (cha chỉ chạy một lượt — `--den-kb <KB cuối của
lượt>`), chép vào `trang_thai.md`.

## 3. B2 — số lượt + cách chia: bốn phương án ĐO (27 KB hiện có)

| Phương án | Lượt (số gốc KB) | Lượt riêng (s) | Cùng lúc (s) | Σ CPU (s) | E2 (`do_chia_e2.js`) |
|---|---|---|---|---|---|
| A — 2 lượt | {11,15–18,21} · {1–10,12–14,19,20,22–27} | 42,5 · 38,5 | **42,6** | 5,0 | — |
| B — 3 lượt | {2,3,11,15,17,18} · {12,13,16,19–22} · {1,4–10,14,23–27} | 28,2 · 28,7 · 25,1 | **28,9** | 5,9 | — |
| C — 4 lượt | {2,15,17} · {3,10,16,18,21} · {1,4–7,14,23–27} · {8,9,11–13,19,20,22} | 21,7 · 21,5 · 20,7 · 18,8 | **21,9** | 7,1 | **12/13 — M3 SỐNG** (giảm lưới) |
| **C' — 4 lượt** | {2,15,17} · {3,10,16,18,21} · {1,4–8,14,23–27} · {9,11–13,19,20,22} | 21,8 · 22,0 · 22,3 · 17,3 | **22,8** | 7,3 | **13/13 BẮT** |

Sàn: KB17 một mình 16,6 s + ~1 s khởi động/dựng → 5 lượt trở lên gần như không lợi thêm.

**Chọn C'** + KB28 vào lượt 1 (không phải sau KB27 — bỏ hẳn ràng buộc "sau KB27"), KB29 vào lượt 4 (lượt ngắn nhất):
`LUOT = [[2, 15, 17, 28], [3, 10, 16, 18, 21], [1, 4, 5, 6, 7, 8, 14, 23, 24, 25, 26, 27], [9, 11, 12, 13, 19, 20, 22, 29]]`
→ ước lượt dài nhất ~23 s (lượt 3 đo 22,8; lượt 1 22,1 + ~0,8; lượt 4 17,6 + ~4). Lý do C' hơn B: số dòng code BẰNG nhau (chỉ khác
mảng `LUOT`), chỗ trống cho P26c lớn nhất (~37 s tới mốc 60 s), CPU thêm +1,4 s. A bị loại: 42,6 s + ~5 s KB mới sát 50 s, P26c thêm là
vượt. C bị loại vì làm M3 SỐNG — bằng chứng "mỗi lượt riêng ĐẠT" KHÔNG đủ cho B6, phải chạy cả đột biến (công cụ `do_chia_e2.js`
tái hiện đúng: C → M3 SỐNG, C' → 13/13).
Luật trong lượt: chạy theo số tăng dần; lượt 3: 24 → 25 liền nhau, 27 sau 25 và là KB cuối của lượt; mỗi lượt ~17–23 s ≪ 180 s.

## 4. A1/A2 — mục tiêu và ước tính

| | Máy mây (mục tiêu A1) | Ước sau chia (máy mây) | Máy chat 1 lõi (ƯỚC — chat đo) |
|---|---|---|---|
| giả lập 29 KB | ≤ 60 s | ~23 s | ~25 s |
| `thu_gia_lap` | ≤ 72 s | ~40 s | ~50–55 s |
| `--day-du` | 0 CẢNH BÁO | ~170 s (bớt ~80 s) | — |

Lý do ước 1 lõi: thời gian chủ yếu là chờ hẹn giờ 40 ms, không tốn CPU; trên 1 lõi, **tổng CPU (user + sys) là sàn** thời gian.
Ước CPU `thu_gia_lap` sau chia: gốc 22,2 s (chat) + E1 thêm 3 lượt × ~0,8 s (~2,5 s) + lượt sập (`--may-chu` rỗng) thêm 3 × ~0,3 s
(~1 s) + **T1–T5 (mục 8): ~3 lần chạy đủ × 4 lượt dừng giữa chừng + 1 lần T2 dùng chung E1** (~3 × 4 × 0,8 ≈ 10 s) + ~20 tiến trình
cha × ~0,05 s (~1 s), trừ phần E2 ngắn đi (mỗi đột biến chỉ chạy lượt chứa KB của nó tới KB đó — mục 6; ước −3 s) → **~33–36 s
CPU**. Chuỗi chờ dài nhất máy mây: C3 ~5 s + lượt dài nhất dưới tải ~25 s + dữ liệu tay ~3 s ≈ 33 s; 1 lõi: CPU ~35 s là sàn,
cộng chờ chồng lên → ~50–55 s < 72 s. Nếu đo thật vượt: T3/T4/T5 dừng sớm (kill ngay khi đủ pid sống — đã là thiết kế) nên
phần CPU của chúng chủ yếu là khởi động + dựng (~0,8 s/lượt). Sau khi làm: đo CPU tổng (`process.resourceUsage()` của cha +
`cpuUsage` mỗi con in lúc thoát, cộng trong công cụ đo ở `viec/TACH-GL/`), ghi `trang_thai.md` cho chat đối chiếu.

## 5. Phương án code (B3, B4, B5b) — chọn A

| | A — `chay.js` tự sinh lượt con (`--luot k`), `LUOT` export trong `kich_ban.js` | B — lượt bằng `worker_threads` / bộ kiểm gọi nhiều lệnh |
|---|---|---|
| File | `chay.js` +~70, `kich_ban.js` +1 mảng (6 dòng) | B1 worker: KHÔNG được — `chay.js` vá trạng thái toàn tiến trình (`require.cache` `:62`, `http.Server.prototype.listen` `:131–147`, khoá giả trong `process.env` `:123–129`, `console.log` `:64`) → hai lượt chung tiến trình giẫm nhau. B2 nhiều lệnh: trái B3, đổi `kiem_tra` + `thu_gia_lap` + mọi bộ đột biến |
| Rủi ro | thêm mã cha/con; dừng con khi cha chết | cao |

Gán lượt: **một mảng `LUOT` trong `kich_ban.js`** (A) thay vì thêm trường `luot` vào 29 kịch bản (B — đụng từng kịch bản cũ).

**Thiết kế A (`chay.js`):**
1. A1 (`:37–51`) và `--chi-kiem-an-toan` GIỮ NGUYÊN ở đầu file → chạy ở CẢ cha lẫn mọi con (con = cùng file) TRƯỚC mọi
   `require` của máy chủ. Cha bị từ chối thì thoát 3 trước khi sinh con.
2. Không có `--luot` → **cha**: không nạp máy chủ. *(Sửa sau duyệt — vòng sửa 2: cha TẠO kho tạm cho từng lượt (`--kho`) và DỌN lúc thoát; con bị SIGKILL / chết trước khi cài xử lý tín hiệu không tự dọn được. Vòng sửa 3: chế độ theo SỰ CÓ MẶT của `--luot`, `--luot` phải là số nguyên ≥ 1, cha nhận `--kho` từ người gọi → TỪ CHỐI; `--kho` của lượt phải là `gia_lap_xxxxxx` ngay trong thư mục tạm.)* `require('./kich_ban.js')` chỉ để đọc `LUOT` + số kịch bản
   (file không `require` máy chủ). Sinh MỌI lượt cùng lúc: `spawn(process.execPath, [__filename, ...argv, '--luot', k],
   { env: process.env, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] })` (`__filename` → bản sao giả lập ở thư mục khác vẫn sinh đúng
   bản sao); in ngay `Giả lập: lượt k/L pid <pid> · KB …` (bài thử đọc pid). Xong hết thì in mọi dòng `✗ KB<n> → …` của con (thứ tự
   lượt), mỗi lượt một dòng `Lượt k: KB a,b,c · <s> s`, rồi **đúng MỘT dòng tổng**: `Giả lập: N kịch bản · M bất biến · ĐẠT` /
   `… · KHÔNG ĐẠT (k lệch)`. Cha KHÔNG in lại dòng tổng của con (bánh cóc `kiem_tra_truoc_khi_giao.js:761` lấy kết quả khớp ĐẦU
   TIÊN). N = tổng KB các con báo đã chạy; **M lấy từ báo cáo của con** (con in số bất biến nó đã kiểm; cha KHÔNG tự đếm
   `bat_bien.js`) — các con báo M khác nhau → lệch "chia lượt". Giữ cho `E4c bỏ kiểm một bất biến` (TU-CHAY-4) vẫn bắt.
3. **Mỗi KB đúng một lần:** mỗi con báo danh sách KB đã chạy; cha so bội tập hợp với tập phải chạy (đủ: 1…`KICH_BAN.length`;
   `--den-kb n`: KB ≤ n của lượt chứa n) — thiếu / trùng → dòng lệch `chia lượt → KB<n> chạy <c> lần` → thoát 1. (Soát kế hoạch
   đề xuất bản tĩnh `LUOT.flat()` = 1…N; giữ bản chạy vì nó bắt cả "cha bỏ một lượt" lẫn con lọc sai, số dòng gần bằng.)
4. **Con** (`--luot k`): đúng mã hiện tại (A2 kho tạm + dọn khi thoát/SIGTERM/SIGINT, SX giả, máy chủ thật, cổng 0, khoá giả
   ngẫu nhiên); vòng `for (const [i, kb] of KICH_BAN.entries())` thêm MỘT dòng `if (!luot.includes(i + 1)) continue;` → `sxGia.kb
   = i + 1`, dòng lệch `KB${i + 1}` vẫn là SỐ GỐC; mọi neo đột biến cũ giữ nguyên (mục 9). `process.on('disconnect', () =>
   process.exit(2))` — cha chết kể cả SIGKILL (`thu_gia_lap` hẹn 110 s dùng SIGKILL) → con tự thoát và dọn kho tạm.
5. **Dừng:** cha nhận SIGTERM/SIGINT → gửi SIGTERM mọi con còn chạy, CHỜ chúng đóng (con dọn kho), quá 10 s thì SIGKILL, thoát 2.
   Một con thoát 2 / chết vì tín hiệu → cha dừng các con còn lại như trên, in dòng sập của con, thoát 2.
6. Không file mới trong `cong_cu/gia_lap/` (B5b).

**Mã thoát (B4):**

| Mã | Khi nào |
|---|---|
| 0 | mọi con thoát 0 VÀ mỗi KB phải chạy chạy đúng một lần |
| 1 | không con nào sập, có con thoát 1 (lệch bất biến / HTTP) HOẶC lệch "chia lượt" (thiếu / trùng KB, M khác nhau) |
| 2 | một con thoát 2 / chết vì tín hiệu / con thoát mã lạ; cha bị SIGTERM/SIGINT; cha sập |
| 3 | A1 từ chối (cha kiểm trước khi sinh con; con thoát 3 → cha thoát 3) · *(sau duyệt)* `--luot` không phải số nguyên ≥ 1 · cha nhận `--kho` · lượt nhận `--kho` không phải `gia_lap_xxxxxx` trong thư mục tạm |

## 6. B5 — `--den-kb n`: chọn bản RÚT NGẮN
"Chỉ chạy lượt chứa KB n, tới hết KB n". Đúng vì: (a) bảng mục 2 — mọi phụ thuộc của một KB (kể cả trạng thái cần để đột biến
bắt) nằm trong lượt của nó, ở KB SỐ NHỎ HƠN; (b) trong lượt chạy theo số tăng → cắt ở n giữ đủ mọi KB < n của lượt; (c) bằng
chứng `--rieng` (mỗi lượt một mình ĐẠT) + `do_chia_e2.js` (13 đột biến E2 chạy đúng nghĩa rút ngắn: 13/13 BẮT). Trạng thái KB n
thấy khi `--den-kb n` = đúng trạng thái nó thấy trong lần chạy đủ. n lớn hơn số kịch bản (mặc định) → mọi lượt. Lợi: mỗi đột
biến E2 / bộ cũ chỉ sinh 1 con → ít CPU trên máy 1 lõi.
Đã rà mọi lệnh `--den-kb` của bộ cũ (grep `den-kb` / `'kb<n>'`; soát kế hoạch rà lại): mẫu mong đợi luôn là `KB<n>` cùng n
(AUDIT-1 `kb1`/`kb10`; P26b `kb13–18`, `gl13`; HOC-2b `kb14/15/17`; LUOI-1 `kb1/10/24/25/26`; thu_gia_lap E2) → nghĩa rút ngắn
khớp. LUOI-1: `VS-SRV-doi-ck-giu-tien-mat` đổi cách chạy `kb26` → `kb28` VÀ thêm 28 vào vòng `for _k in (1, 10, 24, 25, 26)`
(`viec/LUOI-1/dot_bien.py:140`).

## 7. C — hai kịch bản mới (cuối `KICH_BAN`, mong đợi bằng `status` + `code` + số tiền)
- **KB28 (C1, Phát hiện LUOI-1 13):** đơn tiền mặt 30.000 (`c.mon(2)`) → `c.doi(id, 'transfer', …)` (ghi sổ quầy `soQuay.doi` →
  I9) → `c.mong`: 200, đơn ghi tiền mặt 0 · CK 30.000. I16/I6 soát. `VS-SRV-doi-ck-giu-tien-mat` (LUOI-1) đổi mong đợi
  SỐNG → BẮT, mẫu `KB28 → I16: đơn .*: nhật ký đổi sang transfer`.
- **KB29 (C2, Phát hiện LUOI-1 14):** chủ `POST /rewards` `{ discount_type: 'percent', discount_value: 50, max_discount: 7000,
  points_cost: 3 }` (route của màn quản trị `client/src/pages/Settings.jsx:565` — xem Q1); khách mới tích 6 điểm (đơn 60.000 =
  `c.mon(2, 2)`), đổi quà HAI lần (`/loyalty/redeem` → 2 mã). Bán `c.mon(4)` 35.000 + mã 1 → 50 % = 17.500 VƯỢT trần → `c.mong`
  200, giảm **7.000**, tổng **28.000**. Thêm (K3 — ca ngay dưới trần, Q2) bán `c.monKhongSx` 10.000 + mã 2 → 50 % = 5.000 < trần →
  giảm **5.000**, tổng **5.000** (bắt đột biến "luôn áp trần"). I12 soát hai mã (loại percent, trần 7.000), I8 vế đổi điểm, I13.
- Kịch bản lộ code đang sai (khác số trên) → DỪNG, `## Câu hỏi`. Chat đã chạy thử bản một lần đổi: ĐẠT trên code hiện tại.

## 8. Bài thử — file bị đụng → ca ĐỎ trên gốc (A16)

| File | Ca | Trên gốc | Trên head |
|---|---|---|---|
| `cong_cu/thu_gia_lap.js` | E1 `DONG_DAT` = `Giả lập: 29 kịch bản · 16 bất biến · ĐẠT` + **đúng MỘT dòng `Giả lập: … kịch bản`** trong đầu ra | ĐỎ (27) | xanh |
| `cong_cu/thu_gia_lap.js` | **T1 cùng lúc:** chạy đủ, đọc dòng `lượt k/L pid`; trước khi BẤT KỲ con nào thoát phải thấy ĐỦ L pid sống cùng lúc (`process.kill(pid, 0)`) — không ngưỡng giờ | ĐỎ (không có dòng lượt) | xanh |
| | **T2 mỗi KB đúng một lần:** gộp dòng `Lượt k: KB …` của lần chạy E1 → bội tập = 1…29 | ĐỎ | xanh |
| | **T3 SIGTERM cha** (khi đủ L pid sống): cha thoát 2; ngay khi cha đóng, mọi pid con đã chết, không còn `gia_lap_*` trong TMPDIR | ĐỎ | xanh |
| | **T4 một lượt sập:** SIGTERM MỘT con → cha thoát 2, các con khác chết, không sót `gia_lap_*` | ĐỎ | xanh |
| | **T5 SIGKILL cha** (giống hẹn 110 s): mọi con tự thoát trong ≤ 15 s, không sót `gia_lap_*` (Q2) | ĐỎ | xanh |
| `kiem_tra_truoc_khi_giao.js` | bánh cóc `NGUONG_KICH_BAN` 27 → 29 (S2, chỉ ở `--day-du`) | ĐỎ (27 < 29) | xanh |
| `viec/LUOI-1/dot_bien.py` | `VS-SRV-doi-ck-giu-tien-mat` mong BẮT (`kb28`) | ĐỎ (SỐNG ≠ mong) | đúng mong đợi |

E2 (13 đột biến M1–M13), E3, A2, C3, dữ liệu tay: KHÔNG đổi, xanh cả hai phía (KB giữ số gốc). T1–T5 dùng chung một hàm khởi
chạy + đọc pid (~45 dòng); T3/T4/T5 dừng ngay khi đủ pid sống (không chạy hết lượt). Mỗi ca một TMPDIR con riêng để đếm
`gia_lap_*` không lẫn. Bằng chứng đỏ: chạy `thu_gia_lap` MỚI với `--gia-lap` trỏ bản `cong_cu/gia_lap/` của gốc (git archive
`2237259`) → các ca trên đỏ; bộ kiểm + LUOI-1 chạy trên bản sao của gốc. `bang_chung_do.txt`: `SỐ CA cong_cu/thu_gia_lap.js:
<N>` (N = số ca trên head), dòng tương ứng cho bộ kiểm và LUOI-1.

## 9. D — đột biến
**D4 — `viec/TACH-GL/dot_bien.py`** (bản sao thật, kiểm `realpath` đích trong thư mục tạm, chuỗi gốc khớp đúng số lần):

| Tên | Chỗ đổi | Phải bắt bằng |
|---|---|---|
| `BV-cha-bo-luot` | cha chỉ sinh `LUOT.slice(1)` | E1 (N = 25) + T2 |
| `VS-kb-hai-luot` | `LUOT` thêm KB5 vào lượt 1 (KB5 chạy 2 lần) | E1 (lệch "chia lượt") |
| `VS-luot-trung-thieu` | KB6 → KB5 trong `LUOT` (N vẫn 29, KB5 hai lần, KB6 không) | E1 thoát 1 + T2 — chỉ phép "đúng một lần" bắt |
| `BV-cha-kiem-mot-lan` | bỏ phép "đúng một lần" của cha, kèm `VS-luot-trung-thieu` | T2 |
| `VS-cha-nuot-ma-thoat` | cha thoát 0 + in ĐẠT dù con thoát 1 | E2 (13 ca mong thoát 1) |
| `VS-cha-in-lai-tong-con` | cha chuyển tiếp dòng tổng của từng con | E1 (đúng một dòng tổng) |
| `BV-cha-khong-dung-con-SIGTERM` | bỏ gửi SIGTERM cho con khi cha bị SIGTERM | T3 |
| `BV-cha-khong-dung-con-khi-sap` | con sập → cha không dừng con khác | T4 |
| `BV-con-khong-theo-doi-cha` | bỏ `process.on('disconnect', …)` | T5 |
| `VS-luot-tuan-tu` | cha `await` từng con xong mới sinh con sau | T1 (không đo giờ — đếm pid sống cùng lúc) |
| `VS-dong-lech-so-trong-luot` | dòng lệch in số thứ tự trong lượt thay `i + 1` | E2 (M-ca ở lượt 2–4, vd M1 `KB10`) |
| `VS-SRV-qua-viet-cung-fixed` | `server/routes/loyalty.js:183` `reward.discount_type` → `'fixed'` | KB29 HTTP + I12 |
| `VS-SRV-qua-bo-tran` | `loyalty.js:183` `reward.max_discount \|\| 0` → `0` | KB29 HTTP + I12 |
| `BV-SRV-ban-bo-ap-tran` | `orders.js:620` `codeRecord?.max_discount > 0 &&` → `false &&` | KB29 HTTP (giảm 7.000 / tổng 28.000) |
| `VS-SRV-tran-luon-ap` | `orders.js:621` `finalDiscountAmount > codeRecord.max_discount` → `true` | KB29 HTTP (ca dưới trần 5.000) |

Đột biến cơ chế chạy `thu_gia_lap --gia-lap <bản sao>` (như TU-CHAY-4); đột biến máy chủ chạy `chay.js --may-chu <bản sao>
--den-kb 29`. Không có phần dựng (ii) → không có đột biến "bỏ dựng đầu lượt" (ghi rõ trong `trang_thai.md`). Bảng "chỗ đổi →
đột biến" + MỌI tên nguyên văn → `trang_thai.md` (A17).

**D1** `thu_gia_lap` E2 13/13 (đã thử trước trên C': 13/13). **D2** `python3 viec/LUOI-1/dot_bien.py` 80/80
(`VS-SRV-doi-ck-giu-tien-mat` BẮT; `GOC-KB10-cu-tre-khong-bat-lai` LẠC — chạy trên gốc `9521cec`, không đổi). **D3**
`python3 viec/AUDIT-1/dot_bien.py C2F C2-loyalty-redeem-tru-0` 87: mọi BẮT của "Bảng đủ 87" vẫn BẮT, in bảng đủ. Rủi ro (cùng dạng
M3): một C2F trước bắt nhờ trạng thái tích từ KB nay ở lượt khác → chuyển SỐNG = giảm lưới → **đổi `LUOT`** (dời KB về chung lượt
với KB tạo trạng thái đó, bổ sung bảng mục 2), KHÔNG nới, chạy lại D1–D3. **D5** `python3 viec/HOC-2b/kiem_neo.py` rồi các đột
biến chạm giả lập / `thu_gia_lap` / bộ kiểm của `viec/TU-CHAY-4/`, `viec/P26b/`, `viec/HOC-2b/`, `viec/LUOI-1/`, nhóm D1
`viec/AUDIT-1/` → 0 HỎNG trừ `G3-sai-chuoi`. Neo dự kiến KHÔNG rữa — mỗi chuỗi vẫn đúng 1 lần trong file thật: `    sxGia.kb = i +
1;\n`, `TRE_BAT`, `    sxGia.loi = false;   // B4…`, `const sxGia = { loi: false,`, `sxGia.loi = true; sxGia.kbBat.add(sxGia.kb);`,
`return r.status(503).json({ error: 'SX giả đang lỗi' }); }` (LUOI-1 `:29`, `:41–57`); `const TRE_MS = 40;`, `const tenBB =
Object.keys(BAT_BIEN);`, `module.exports = { KICH_BAN,`, `|SX_API_KEY|`, `process.on('exit', () => { try { fs.rmSync(THU_MUC`,
`http://127.0.0.1:${mayPos.address().port}/api/pos` (TU-CHAY-4 `:18–29`). `E4c` (slice 8 bất biến trong con) bắt nhờ M lấy từ con;
`E4d` (`KICH_BAN.slice(0, 10)`) bắt nhờ N = 10 — nhưng `LUOT` còn chứa KB > 10: cha phải bỏ qua số không có trong `KICH_BAN` khi
lập tập phải chạy (lấy 1…`KICH_BAN.length`), không thì E4d ra lệch "chia lượt" thay vì dòng tổng — vẫn đỏ, `kiem_neo` + chạy D5 xác nhận.

## 10. Câu hỏi (chờ duyệt cùng kế hoạch)
- **Q1 — C2 "qua đường màn hình quản trị":** màn thêm quà `Settings.jsx:565–571` gửi `POST /api/pos/rewards` nhưng KHÔNG gửi
  `max_discount` (sửa quà `:581` chỉ gửi `is_active`) → từ màn hình không tạo được quà % có trần; máy chủ nhận trần qua API
  (`rewards.js:32`, `:47`). (a) **đề xuất:** KB29 gọi đúng route đó kèm `max_discount` (phủ đường máy chủ — giống `/deliver`
  phủ qua API), ghi Phát hiện 1 (màn hình thiếu ô trần). (b) KB29 dùng quà % KHÔNG trần như màn hình tạo được — khi đó hai đột
  biến trần (`VS-SRV-qua-bo-tran`, `BV-SRV-ban-bo-ap-tran`) không bắt được, trái nghiệm thu C2.
- **Q2 — thêm ngoài phiếu (nhỏ):** ca "ngay dưới trần" trong KB29 (đổi quà 2 lần, ~3 lệnh API, ~1 s) + đột biến
  `VS-SRV-tran-luon-ap`; ca T5 (SIGKILL cha) + `disconnect` ở con (~3 dòng). Lý do: K3 (ngưỡng → ca trên + dưới) và B4 (không sót
  con — hẹn 110 s của `thu_gia_lap` là SIGKILL). Không muốn thì bỏ.

## 11. Các bước khi được duyệt (đủ mục nghiệm thu)
1. E1: in `git log --oneline -3` lúc mở phiên làm tiếp, khớp GitHub (đã ghi lần này ở `trang_thai.md`).
2. Bài thử trước (mục 8) → chạy trên gốc → `bang_chung_do.txt` (A16) — ĐỎ đúng câu kết luận.
3. `kich_ban.js` (`LUOT`, KB28, KB29) · `chay.js` (cha/con) · `kiem_tra_truoc_khi_giao.js` (C3: ngưỡng 29, chú thích S4 theo số
   đo A1 thật) · `viec/LUOI-1/dot_bien.py` (mong đợi + `kb28`).
4. B1 bằng chứng code thật: từng lượt chạy riêng → ĐẠT.
5. F: `npm test` xanh; `node kiem_tra_truoc_khi_giao.js --day-du` 0 CẢNH BÁO; `thu_gia_lap` xanh. A1: đo 3 lần (giả lập +
   `thu_gia_lap`, chạy riêng, ghi đủ 3) + CPU tổng (A2). Không đạt → DỪNG, `## Câu hỏi`.
6. D1–D5 (đếm đủ, không lấy mẫu, chạy riêng); bảng đủ 87 in vào `trang_thai.md`.
7. Commit từng file, `/ra-soat`, push `viec/TACH-GL`, báo cáo 7 mục. E2: 2 check `cong` + `cong-chay` — máy không xem được →
   ghi CHƯA KIỂM. `KHUON_LOI.md`: thêm bài học "bằng chứng ĐẠT không chứng minh đột biến còn bắt" vào K3 nếu chưa có khuôn tương
   đương (trần 120 dòng). Đổi model giữa phiên → ghi giờ + bước.

## 12. Ngân sách + thời gian máy
Code: `chay.js` +~75 · `kich_ban.js` +~35 (KB28 ~8, KB29 ~20, `LUOT` ~6) · `kiem_tra_truoc_khi_giao.js` ±~6. Thử: `thu_gia_lap.js`
+~55 (DONG_DAT, một dòng tổng, T1–T5). Hồ sơ: `viec/TACH-GL/dot_bien.py` ~110, `do_chia.js` + `do_chia_e2.js` (đã có). Neo cũ:
`viec/LUOI-1/dot_bien.py` ±~4. Trong ngân sách phiếu (~200 + 80 + 100 + 30).
Thời gian máy (ước theo số đo trên, chạy riêng): A1 3 × (giả lập ~23 s + `thu_gia_lap` ~40 s) ≈ 3 phút; `--day-du` × 2 ≈ 6 phút;
bằng chứng đỏ ≈ 6 phút; D2 80 đột biến ≈ 4 phút; D3 87 × (~25 s giả lập + P26a/b) / 4 ≈ 12 phút; D4 15 đột biến ≈ 6 phút; D5
(TU-CHAY-4 ~10, P26b ~40, HOC-2b ~30, AUDIT-1 D1) ≈ 30 phút; vòng soát + làm lại ≈ 20 phút → **~90 phút** < 150.

## 13. Luồng hợp lệ phải KHÔNG bị chặn (K5)
- Bộ kiểm `--day-du` gọi `node cong_cu/gia_lap/chay.js` (không đối số) → ĐẠT, một dòng tổng như cũ (bánh cóc đọc `(\d+) kịch
  bản · (\d+) bất biến`, kết quả khớp đầu tiên).
- `--chi-kiem-an-toan`, `--cau-hinh`, `--may-chu` (E3, A2, bộ cũ), `--den-kb n` (E2, bộ cũ) — cha chuyển nguyên đối số cho con.
- Bản sao giả lập chạy từ thư mục khác (P26b `gl13`, HOC-2b `kb17`, TU-CHAY-4 `--gia-lap`): con sinh bằng `__filename` của bản
  sao, không đường cố định.
- Giả lập song song (`thu_gia_lap` chạy ~20 giả lập cùng lúc): mỗi con cổng 0 + khoá ngẫu nhiên như cũ.
- `--may-chu <rỗng>` (A2): mọi con sập → cha chờ con dọn rồi thoát 2, không sót `gia_lap_*`.
