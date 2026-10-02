# HOC-1 — Kế hoạch (bước 3, CHỜ DUYỆT)

Đọc trong lượt này: `tu_chay/cong.js` (242 dòng), `tu_chay/cai_dat.js` 79–148, `kiem_tra_truoc_khi_giao.js` 521–541 (T2),
`tu_chay/thu_cong.js` 1–315, `tu_chay/thu_cong_cu.js` 1–60, `tu_chay/thu_nguoi_gac.js` 21–60, 470–590, 730–800,
`tu_chay/MAU_PHIEU.md` 25–45, `tu_chay/cau_hinh.json`, `viec/TU-CHAY-3/trang_thai.md` 40–116.

## Gốc rễ ba chỗ vướng (code thật)
- **A11** `cong.js:191–208`: mọi `thu_*.js` mới HOẶC sửa (`baiThu`, dòng 87) chạy trên code gốc; `status === 0` →
  A11 (dòng 204). Không có ngoại lệ cho file đã có ở mốc.
- **package.json**: `cau_hinh.json` `file_luat` có 4 mục; cổng `cong.js:211` chạy `npm test` = dòng `"test"` của
  `package.json` của PR. `nguoi_gac.js:189` và `cong.js:145–147` đã dùng chung `file_luat` → chỉ thêm 1 mục là đủ.
- **T2** `kiem_tra_truoc_khi_giao.js:529–530`: `readdirSync` lấy cả THƯ MỤC; `readFileSync(<thư mục>)` ném lỗi →
  `catch → true` = "lệch"; thư mục con trong `.claude/tu_chay/` rơi vào "thừa". Trình cài (`cai_dat.js:97`, `isFile`)
  và cổng (`cong.js:109`, chỉ `blob`) đều bỏ thư mục con → T2 lệch khuôn với hai chỗ kia.

## A. Miễn A11 cho bài thử cũ sửa — `tu_chay/cong.js`
**Phương án A (chọn, ~+20 dòng):** hàm `mucBaiThuCu(phieu)` (đặt cạnh `mucMien`, cùng cách tách dòng) đọc mục
`## Bài thử cũ sửa` tới `##` kế tiếp, mỗi dòng `- <đường dẫn> — <lý do>` → `Map` đường dẫn → lý do, dòng sai dạng
→ danh sách `hong`. Kiểm từng dòng lúc dùng (chỉ ở `chay`):
- lý do rỗng hoặc dạng `<…>` của mẫu, không phải `laBaiThu`, không có ở head lẫn mốc → `ghi` "dòng hỏng … — không miễn";
- có ở head nhưng KHÔNG có ở mốc (`blob(moc, p) === null`) → `ghi` "bài thử mới không được miễn: p" và A11 như cũ.

Kiểm **mọi dòng của mục**, kể cả dòng trỏ file PR không đụng (soát kế hoạch c). Đường dẫn bỏ backtick và `./` đầu
giống `phamViTuChu` (`nguoi_gac.js:871–872`) — dòng `` - `cong_cu/thu_P20.js` — … `` phải được hiểu (soát d).

Trong vòng A11 (dòng 204): `r.status === 0 && mienCu.has(p) && blob(moc, p) !== null` →
`ghi.push('miễn A11 (bài thử cũ sửa): p — lý do')`, KHÔNG `doHopLe++` (A7: miễn không thay A12).
Vòng "xanh trên code PR" (217–220) giữ nguyên → A4 tự có. Phiếu đọc từ blob head (dòng 74) như A5 → A8 nghiệm thu
dựa vào A7 cũ, không thêm code.

**Phương án B (bỏ):** thêm mã tắt mới trong `tat` / tách thành mã lý do A11b — nhiều dòng hơn, không cần cho nghiệm thu.
Rủi ro phương án A: đọc mục rộng quá (nuốt mục sau) → canh bằng ca A6 "dòng hỏng" và ca có mục khác đứng sau.

Ghi chú (không đổi hành vi): `laCode` coi `thu_*.js` là code → PR CHỈ thêm ca vào bài cũ (được miễn) vẫn A12 nếu phiếu
không có `## Bài thử đỏ` — đúng A7 của phiếu. `MAU_PHIEU.md` sẽ nói rõ: kèm bài thử đỏ mới, hoặc `## Bài thử đỏ`.

## B. `package.json` là file luật — `tu_chay/cau_hinh.json` (+1 mục trong mảng, cùng dòng)
Không đổi code người gác / cổng (cả hai đọc `file_luat`). Phương án B (luật riêng cho `package.json`) bỏ vì trùng.
Không đưa `package-lock.json` — ghi đề xuất ở `## Phát hiện` nếu thấy cần.

## C. T2 bỏ thư mục con — `kiem_tra_truoc_khi_giao.js` (±2 dòng)
Thêm lọc `isFile()` cho cả `nguon` (tu_chay/) và `coSan` (.claude/tu_chay/). Không đổi chữ cảnh báo, không nới gì khác.

**Bài thử (phương án A, chọn):** `thu_cong_cu.js` cắt khối mã T2 thật (từ dòng `// T2 —` tới `// T3 —`) và chạy nó
bằng `new Function('fs', 'path', 'GOC', 'pass', 'canhBao', khối)` với `GOC` = kho tạm. Không tìm thấy mốc → ca ĐỎ
(không xanh oan). ~35 dòng.
**Phương án B (bỏ):** chạy cả `kiem_tra_truoc_khi_giao.js` trên bản chép — chạy 36 phép, gọi lại `thu_cong_cu.js`
(đệ quy), chậm; hoặc tách T2 thành hàm xuất — đổi cấu trúc file luật nhiều hơn ±6.
Không tạo `cong_cu/thu_HOC1.js` (đặt được hợp lý trong `thu_cong_cu.js`).

## D. Ca cho đột biến M9, M10
- **D1 (M9) → `thu_nguoi_gac.js`** (phương án A, ~15 dòng): dùng lại `khoCai`, `caiDat`, `anh` và cờ có sẵn
  `--cai-dat <bản đột biến>` (dòng 22). Bốn ca, mỗi ca CHỈ sai một điều kiện của `cai_dat.js:86–87`: matcher `"Bash"`;
  lệnh bỏ `|| exit 2`; lệnh trỏ `.claude/tu_chay/khac.js … || exit 2`; hai hook (thêm `{type:'command',command:'true'}`).
  Mỗi ca: thoát ≠ 0, ra đúng câu "muc_gac phải là mục hook người gác", `anh()` không đổi byte nào. Không sửa `cai_dat.js`.
  Cấu hình hỏng: sau `khoCai()` ghi đè `tu_chay/cau_hinh.json` của kho tạm bằng bản thật đã đổi `muc_gac` (JSON parse →
  sửa một trường → stringify), rồi mới `anh()` + `caiDat()` (soát e).
  Phương án B (đặt ở `thu_cong_cu.js`) bỏ: phải dựng lại kho cài, ~+30 dòng.
- **D2 (M10) → `thu_cong.js`** (~15 dòng): chép `cong.js` + `nguoi_gac.js` vào thư mục tạm cùng `cau_hinh.json` thiếu
  lần lượt `ban_cai` / `muc_gac` / `thu_muc_bai_thu` → `node -e "require(<cong.js>)"` phải thoát ≠ 0 và ra đúng câu
  "cau_hinh.json (bản main) thiếu"; đối chứng K5: cấu hình đủ → nạp được.
- **Đột biến (ca đỏ trước)**: chạy tay trong nháp, ghi bảng vào `trang_thai.md`: M9 = bản `cai_dat.js` bỏ `dung(...)`
  của phép muc_gac, chạy `thu_nguoi_gac.js --cai-dat <bản đó>` → ≥ 1 ca D1 đỏ (mong đợi: matcher, `|| exit 2`, hai
  hook đỏ; ca "trỏ file khác" có thể vẫn dừng nhờ phép kiểm cấu trúc dòng 120–126 nhưng SAI câu → cũng đỏ);
  M10 = bản `tu_chay/` chép trong nháp, `cong.js` bỏ `throw` dòng 20, chạy `thu_cong.js` của bản chép → 3 ca D2 đỏ.

## Danh sách ca thử ↔ Nghiệm thu
| Nghiệm thu | Ca (file) | Đỏ trước bằng |
|---|---|---|
| A1 | `thu_cong.js`: `PHIEU: X` thêm mục `- cong_cu/thu_c.js — thêm ca hồi quy`; sửa `thu_c.js` thành xanh + `thu_a.js` hợp lệ + `server/moi.js` → ĐẠT, có dòng "miễn A11 (bài thử cũ sửa): cong_cu/thu_c.js — thêm ca hồi quy" | code gốc: A11 → ĐỎ |
| A2 | ca A1 cũ "đúng phạm vi + bài thử đỏ/xanh" giữ nguyên → ĐẠT | (K5, đã có) |
| A3 | mục ghi `cong_cu/thu_a.js` (mới), `thu_a.js` xanh trên gốc → ĐỎ A11 + "bài thử mới không được miễn" | đột biến tay: bỏ điều kiện "có ở mốc" |
| A4 | mục ghi `thu_c.js`, sửa `thu_c.js` thành bản XANH trên gốc, ĐỎ trên PR (`exit(existsSync('server/moi.js') ? 1 : 0)`) + bài đỏ hợp lệ khác → ĐỎ "ĐỎ trên code PR" (soát b: bản đỏ cả trên gốc thì không thử phần miễn) | đột biến tay: miễn bỏ luôn kiểm "xanh trên PR" |
| A5 | ca cũ "A11 bài thử SỬA mà xanh trên gốc" giữ nguyên → ĐỎ | (đã có) |
| A6 | ba ca, mỗi ca một lỗi: thiếu lý do (`- cong_cu/thu_c.js —`), không phải `thu_*.js` (`- cong_cu/khac.js — x`), không có trong kho (`- cong_cu/thu_khong_co.js — x`) → "dòng hỏng"; ca thiếu lý do: `thu_c.js` bị sửa xanh gốc → A11 | đột biến tay: bỏ từng kiểm |
| A7 | mục miễn `thu_c.js` hợp lệ, sửa `thu_c.js` + `server/a.js`, không bài đỏ, không `## Bài thử đỏ` → ĐỎ A12 | đột biến tay: miễn tính `doHopLe++` |
| A8 | dùng lại ca có sẵn "A7 phiếu đổi ở commit thường" (`thu_cong.js`) — mục miễn đọc từ cùng blob phiếu; không thêm ca (soát 2) | (A7 có sẵn + đột biến tắt A7) |
| B1 | `thu_nguoi_gac.js:583` thêm `package.json` vào danh sách phải có | code gốc → ĐỎ |
| B2 | kho cấu hình THẬT, phiếu `- *.json` → `E('package.json', 'G-LUAT')` | code gốc → CHO, ĐỎ |
| B3 | phiếu `- package.json` → `E('package.json', 'CHO')` | (K5) |
| B4 | `thu_cong.js`: commit `PHIEU: X` thêm `- *.json` (tránh A7), rồi commit đổi `package.json` (giữ `"test"`) kèm `thu_a.js` hợp lệ + `server/moi.js` (tránh A12, vì `laCode`) → A6 "ĐÚNG TÊN"; biến thể phiếu `- package.json` → ĐẠT (tinh) | code gốc: lý do khác, thiếu "ĐÚNG TÊN" → ĐỎ |
| C1 | kho tạm: `tu_chay/{a.js, con/b}` + `.claude/tu_chay/a.js` cùng byte → pass, không canhBao | code gốc → canhBao "lệch: con" |
| C2 | `.claude/tu_chay/a.js` khác byte → canhBao có "lệch: a.js" | (giữ hành vi cũ) |
| C3 | `.claude/tu_chay/thua.txt` → "thừa: thua.txt"; `.claude/tu_chay/con2/` → không thừa | code gốc → "thừa: con2" |
| D1, D2 | như mục D | đột biến tay M9, M10 |
| E | `THIET_KE.md` B15 thêm đoạn | tài liệu |
| F1–F3 | ghi vào `trang_thai.md` | — |
| G | `npm test`, `--day-du`, `PHIEN_BAN` = `tu-chay 1.3.1`; sửa ca `thu_nguoi_gac.js:598` từ `1.3.0` sang `1.3.1` (soát a) | code gốc: PHIEN_BAN 1.3.0 → ĐỎ |

Tài liệu (thêm ca soi chữ trong `thu_cong_cu.js` mục H, theo khuôn có sẵn ở đó): MAU_PHIEU có `## Bài thử cũ sửa`
(cách ghi, giới hạn A3/A7); skill nhắc "báo chủ quán thêm mục, không tự lách".

## Luồng hợp lệ phải KHÔNG bị chặn (K5)
1. Bài thử mới đỏ gốc / xanh PR, không mục miễn (A2 — ca cũ).
2. Phiếu có mục `## Bài thử cũ sửa` nhưng PR không đụng file đó → không A11, không báo hỏng sai (ca A1 có thêm một
   dòng hợp lệ cho `cong_cu/khac`… — cụ thể: thêm file `cong_cu/thu_e.js` ở gốc, ghi vào mục, không sửa).
3. Bài thử cũ được miễn mà vẫn ĐỎ trên gốc (thêm ca của hành vi mới) → tính `doHopLe` như thường (ca riêng, ĐẠT).
4. Mục `## Bài thử cũ sửa` đứng TRƯỚC `## Bài thử đỏ` → A5 (`mucMien`) vẫn đọc được (ca A7 biến thể có `## Bài thử đỏ`
   → ĐẠT).
5. `package.json` ghi đúng tên (B3, B4).
6. `tu_chay/` không có thư mục con → T2 như cũ (kho thật, `npm test`).
7. Cấu hình đủ → `cong.js` nạp được; `muc_gac` đúng → `cai_dat.js` cài được (ca cài có sẵn trong `thu_nguoi_gac.js`).

## Đường song song cần canh (K4)
- `mucMien` (A5) và `mucBaiThuCu`: cùng cách tách dòng `normalize('NFC')`.
- A12 có hai nơi: tinh (`cong.js:151`, đếm `baiThu`) và chay (`:209`, đếm `doHopLe`) — miễn chỉ đụng chay; tinh vẫn
  coi bài cũ sửa là "có bài thử" như trước (không nới, không siết).
- Bỏ thư mục con có ba nơi: `cai_dat.js:97`, `cong.js:109`, T2 → sau sửa cả ba cùng khuôn.
- `file_luat` dùng ở `nguoi_gac.js:189` (qua `xetPhamVi`) và `cong.js:145` → một mục cấu hình phủ cả hai.

## Cổng của chính PR này (luật CŨ, không có miễn)
File `thu_*.js` bị sửa và ca nào đỏ trên code gốc:
- `tu_chay/thu_cong.js` — A1 (dòng miễn), B4 ("ĐÚNG TÊN" với `package.json`).
- `tu_chay/thu_cong_cu.js` — C1, C3 (T2 gốc báo thư mục con).
- `tu_chay/thu_nguoi_gac.js` — B1, B2 (`cau_hinh.json` gốc chưa có `package.json`).

Ba file phải xanh trên code PR. Đổi `tu_chay/` → A8 đòi bản cài: **chủ quán chạy `bash tu_chay/cai_dat.sh` trên
nhánh `viec/HOC-1`** sau khi máy push xong, rồi mới mở PR.

## Ngân sách dự kiến
Code ~25 (`cong.js` +~20, `kiem_tra` ±2, `cau_hinh.json` ±1, `cai_dat.js` 0). Thử ~170 (`thu_cong.js` +~100,
`thu_cong_cu.js` +~45, `thu_nguoi_gac.js` +~25). Tài liệu ~30. Dưới ngân sách phiếu.

## Soát kế hoạch (agent phụ, chỉ đọc) — CẦN SỬA → đã sửa vào bản này
- (a) `thu_nguoi_gac.js:598` khoá `tu-chay 1.3.0` → thêm vào ca G.
- (b) A4 phải xanh gốc / đỏ PR → sửa ca.
- (c) A6 kiểm mọi dòng mục miễn → ghi rõ ở mục A.
- (d) bỏ backtick đường dẫn như `phamViTuChu` → ghi rõ ở mục A.
- (e) cách dựng B4 (commit `PHIEU: X`, kèm bài thử hợp lệ) và đưa cấu hình hỏng vào D1 → ghi rõ.
- Gợi ý ngắn hơn: dùng `f.st === 'M'` từ `doi` thay `blob(moc, p)` cho bài thử bị sửa — nhận, khi viết code dùng
  `doi` cho file PR đụng; dòng mục trỏ file PR không đụng vẫn phải `blob` để báo "không có trong kho".
- Ghi nhận: A3, A7, D1, D2 xanh trên code gốc (phép mới / phép đã có) → bằng chứng đỏ là đột biến tay; cổng luật cũ vẫn
  qua vì mỗi file `thu_*.js` có ca đỏ khác (A1/B4, C1/C3, B1/B2/G).
