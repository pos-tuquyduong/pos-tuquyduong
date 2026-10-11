# TACH-GL — Chia giả lập quầy thành nhiều lượt chạy song song (+ thêm lại đơn đổi sang chuyển khoản, quà % có trần)

<!-- Phiếu do chat soạn 10.10.2026. Nền: main sau sổ việc v25 (cha 28638d0 = Merge PR #12 LUOI-1, bộ khung tu-chay 1.4.0).
     Nguồn: viec/LUOI-1/trang_thai.md (Phát hiện 13, 14, 15; bảng C1/C2 "Bảng đủ 87"), viec/LUOI-1/dot_bien.py, bàn giao bản 17.
     Chat đo 10.10 trên 28638d0 (máy chat 1 lõi, chạy riêng, môi trường lọc sạch):
       - giả lập 79,1 s thực nhưng CPU chỉ 3,3 s (user 2,9 + sys 0,4) → ~96 % thời gian là CHỜ trễ 40 ms giả mạng, không phải
         tính toán. Từng KB (viec/LUOI-1/do_thoi_gian.js kb): KB17 16,3 s · KB16 8,1 s · KB21 7,7 s · KB14 4,5 s · KB23 3,4 s ·
         KB15 3,3 s · KB18 3,1 s · còn lại ≤ 2,9 s; vòng bất biến mỗi KB ≤ 10 ms.
       - Thử tạm (bản sao, không commit) chạy hai nửa CÙNG LÚC trên máy 1 lõi: KB1–16 ĐẠT 37,9 s; KB17–27 KHÔNG ĐẠT 44,3 s —
         KB23 → I2 (2 mã mồ côi), KB27 → I2 (1): lượt sau thiếu bước KB7 cho KH.moi /claim nên đơn của KH.moi sinh mã bill rồi
         bị xoá (lỗi đã biết P26c (4)). Thử {KB1–6, 8–16} / {KB7, 17–27}: KB7 SẬP (c.billDaThu chưa có — dựng ở KB trước),
         KB14 lệch HTTP + I2 (cũng dựa vào KB7). → Phụ thuộc giữa kịch bản là THẬT và nhiều tầng.
       - thu_gia_lap 97,5 s thực, CPU 22,2 s (user 18,7 + sys 3,5); một lượt giả lập rỗng (--den-kb 0: khởi động + dựng dữ liệu)
         0,9 s thực, ~0,8 s CPU → thêm tiến trình lượt chỉ tốn thêm ~0,8 s CPU mỗi cái.
       - Chạy thử (bản sao, chỉ hai kịch bản mới sau dungDuLieu) trên code hiện tại: đơn tiền mặt 30.000 → c.doi sang 'transfer'
         → 200, tiền mặt 0 · CK 30.000; quà percent 50 % trần 7.000 (points_cost 3), tích bằng đơn 30.000, đổi, bán đơn 35.000
         (c.mon(4)) → 200, giảm 7.000, thu 28.000 — ĐẠT. Bốn đột biến máy chủ đều BẮT: VS-SRV-doi-ck-giu-tien-mat (HTTP + I6 +
         I16); loyalty.js viết cứng 'fixed' (HTTP 400 + I12); loyalty.js bỏ trần (HTTP 400 + I12); orders.js bỏ áp trần
         (`codeRecord?.max_discount > 0 &&` → `false &&`) — CHỈ dòng HTTP của kịch bản bắt, không bất biến nào.
     Bàn giao bản 17 viết "máy chat 1 lõi không lợi từ song song" — SAI theo số đo trên (chờ trễ không tốn CPU). -->

**Chờ duyệt kế hoạch:** viết `viec/TACH-GL/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.
Chưa viết bài thử, chưa sửa code cho tới khi chủ quán gửi lời duyệt.

## Mục tiêu
Giả lập quầy (`cong_cu/gia_lap/`) chạy 27 kịch bản NỐI TIẾP trên một kho: ~79–85 s, và `cong_cu/thu_gia_lap.js` ~87 s (máy
mây) / 95–103 s (máy chat) — sát ngưỡng cảnh báo 96 s (80 % hạn 120 s). P26c sắp thêm kịch bản cho các lỗi tiền/gói của
LUOI-1, nên phải lấy lại chỗ TRƯỚC. Việc này chia giả lập thành nhiều lượt (mỗi lượt một tiến trình, kho tạm riêng) chạy
song song, KHÔNG bớt kịch bản / bất biến / phép kiểm nào, rồi dùng chỗ trống thêm lại hai phần LUOI-1 phải bỏ vì thời gian:
đơn đổi tiền mặt → chuyển khoản (Phát hiện 13) và quà % có trần (Phát hiện 14). Quầy không đổi gì (không sửa `server/`,
`client/`).

### Lưu ý — cổng của chính PR này
Cổng chấm bằng `tu_chay/cong.js` + `tu_chay/cau_hinh.json` của `main` (tu-chay 1.4.0 — cũng là luật mới nhất, vì việc này
không đổi `tu_chay/`). Vì vậy:
- Không đổi `server/`, `client/` → A18 không áp.
- `cong_cu/thu_gia_lap.js` CỐ Ý đổi (`DONG_DAT` sang 29 kịch bản, ca chia lượt mới) nên ĐỎ trên gốc là đúng — bài đỏ hợp lệ
  của việc này; KHÔNG ghi file này vào `## Bài thử cũ sửa`.
- A16: `viec/TACH-GL/bang_chung_do.txt` có dòng `SỐ CA <bài>: <N>` cho MỖI bài thử đỏ trên gốc, N = số ca bài in khi chạy trên
  head. Đổi bài sau khi ghi → chạy lại, chép lại.
- A17: có `viec/TACH-GL/dot_bien.py` thì MỌI tên đột biến (nguyên chuỗi đầu tuple) ghi NGUYÊN VĂN trong
  `viec/TACH-GL/trang_thai.md`.
Kế hoạch có bảng: file bài thử nào bị đụng → ca nào đỏ trên gốc.

## Nghiệm thu

### A. Đo (CHẠY RIÊNG — không lệnh nào khác chạy song song; ghi số lõi máy)
- A0 Trên gốc: `node cong_cu/gia_lap/chay.js`, `node cong_cu/thu_gia_lap.js`, `node kiem_tra_truoc_khi_giao.js --day-du`,
  từng KB (`node viec/LUOI-1/do_thoi_gian.js kb`), và CPU của giả lập (`bash -c 'time node cong_cu/gia_lap/chay.js'` với môi
  trường lọc sạch như bộ kiểm). Đối chiếu số đo của chat ở đầu phiếu.
- A1 Mục tiêu sau khi XONG cả B và C (29 kịch bản), máy mây chạy riêng, đo 3 lần và ghi đủ 3: giả lập **≤ 60 s** (50 % hạn) và
  `thu_gia_lap` **≤ 72 s** (60 % hạn); `--day-du` 0 CẢNH BÁO. Không đạt → DỪNG, `## Câu hỏi` kèm số đo + đề xuất.
- A2 Kế hoạch ghi ước tính cho MÁY CHAT 1 lõi (chat sẽ đo xác nhận khi soát cuối) — kèm lý do (thời gian chủ yếu là chờ) và
  tổng CPU (user + sys) của `thu_gia_lap` sau khi chia: trên 1 lõi, tổng CPU là sàn thời gian.

### B. Chia lượt — `cong_cu/gia_lap/chay.js` (+ `kich_ban.js` nếu cần), KHÔNG giảm lưới
- B1 **Bảng phụ thuộc** trong kế hoạch: với MỖI kịch bản, nó đọc trạng thái gì do phần dựng (`dungDuLieu`) hay kịch bản TRƯỚC
  tạo ra — trường `c.*` (vd `c.billDaThu`, `c.kbSxLoi`, `c.goiCoSan`), khách (`KH.quen/no/moi` đã claim, ví, gói, điểm), mã, bộ
  đếm (`sdtMoi`), `sxGia`/`nhanKho`/`soQuay` — ghi `kich_ban.js:dòng`. Ba phụ thuộc chat đã thấy (đầu phiếu) phải có trong bảng.
  Bảng phải có bằng chứng CHẠY: mỗi lượt chạy RIÊNG một mình → ĐẠT.
- B2 Cách chia: ≥ 2 lượt; mỗi lượt là một tiến trình riêng (kho tạm, máy chủ thật, SX giả, cổng 0, khoá giả ngẫu nhiên — như
  giả lập hiện đã chạy song song được trong `thu_gia_lap`), các lượt chạy CÙNG LÚC. Phụ thuộc giải bằng (i) đặt kịch bản cùng
  lượt với kịch bản nó dựa vào, hoặc (ii) phần dựng đầu lượt tạo đúng trạng thái đó. **Không đổi nội dung kiểm của kịch bản cũ:**
  mọi lệnh API và mọi `c.mong` giữ nguyên (chỉ được dời dữ liệu dựng). Trong một lượt, kịch bản chạy theo thứ tự số tăng dần;
  KB24 → KB25 liền nhau (KB25 kiểm `sxGia.kb === kbSxLoi + 1`); kịch bản nào chạy SAU KB27 trong cùng lượt không được đẩy sổ
  nợ (luật ghi trên KB27, `kich_ban.js:533–534`; Phát hiện LUOI-1 7); mỗi lượt xong dưới 180 s (tự đẩy sổ nợ, Phát hiện 15).
  Số lượt + cách chia: kế hoạch so ít nhất hai phương án bằng SỐ ĐO (tổng thời gian lượt dài nhất, máy mây và ước máy 1 lõi).
- B3 **Một lối vào:** bộ kiểm và `thu_gia_lap` vẫn chỉ gọi `node cong_cu/gia_lap/chay.js`; dòng tổng giữ dạng
  `Giả lập: N kịch bản · M bất biến · ĐẠT` / `… · KHÔNG ĐẠT (k lệch)`, N = tổng kịch bản ĐÃ CHẠY của mọi lượt. Dòng lệch giữ
  dạng `KB<n> → <bất biến|HTTP>: …` với n = SỐ GỐC của kịch bản trong `KICH_BAN` (không phải số thứ tự trong lượt) để bảng đột
  biến cũ vẫn khớp. Phương án khác (bộ kiểm gọi nhiều lệnh) → kế hoạch nêu lý do, chờ duyệt.
- B4 **An toàn:** phần A1/A2 hiện có của `chay.js` giữ nguyên ý nghĩa: mọi tiến trình lượt chạy phép từ chối máy thật TRƯỚC
  mọi `require` của máy chủ; kho tạm từng lượt xoá kể cả khi sập. Tiến trình cha bị SIGTERM/SIGINT (bộ kiểm hết hạn) hoặc một
  lượt sập → các lượt còn lại bị dừng, KHÔNG sót tiến trình con, KHÔNG sót thư mục `gia_lap_*`. Cha thoát 0 CHỈ khi mọi lượt
  thoát 0 VÀ mỗi kịch bản trong `KICH_BAN` chạy ĐÚNG MỘT lần (không thiếu, không trùng). Mã thoát khác: kế hoạch ghi bảng.
- B5 `--den-kb <n>` giữ nghĩa "kết quả tới hết KB n" cho `thu_gia_lap` (E2) và các bộ đột biến cũ; được phép rút ngắn thành
  "chỉ chạy lượt chứa KB n, tới KB n" nếu B1 chứng minh mọi phụ thuộc của KB ≤ n trong lượt đó nằm trong lượt đó. Kế hoạch
  ghi rõ.
- B5b File mới trong `cong_cu/gia_lap/` KHÔNG được (file luật, người gác chặn — chat đã thử `tu_chay/nguoi_gac.js`):
  mọi mã chia lượt nằm trong `chay.js` / `kich_ban.js`; công cụ đo, bản sao thử đặt ở `viec/TACH-GL/`.
- B6 Không giảm lưới: đổi lượt KHÔNG được làm một đột biến đang BẮT chuyển SỐNG (nghiệm thu ở D). Đây là phép đo "không giảm
  lưới", không chỉ "vẫn ĐẠT".

### C. Hai kịch bản mới (THÊM vào CUỐI `KICH_BAN`, không sửa/xoá kịch bản cũ; mong đợi bằng `status` + `code`, không dò chữ)
- C1 (Phát hiện LUOI-1 13) Đơn tiền mặt → đổi sang chuyển khoản bằng `c.doi` (ghi sổ quầy để I9 đối chiếu) → 200; I16 soát.
  Nghiệm thu: `VS-SRV-doi-ck-giu-tien-mat` trong `viec/LUOI-1/dot_bien.py` đổi mong đợi SỐNG → **BẮT** (sửa kịch bản +
  mẫu dòng lệch sang số KB mới) và BẮT thật.
- C2 (Phát hiện LUOI-1 14) Chủ tạo quà loại `percent` có `max_discount` > 0 qua `POST /rewards` (đường màn hình quản trị dùng —
  ghi `client/src` file:dòng); khách tích đủ điểm → `/loyalty/redeem` → bán một đơn đủ lớn để phần % VƯỢT trần → đơn giảm ĐÚNG
  trần (khẳng định số tiền bằng `c.mong`); I12 soát mã đẻ ra (loại %, trần). Nghiệm thu bằng đột biến máy chủ trong
  `viec/TACH-GL/dot_bien.py` (bản sao, không ghi file thật), mỗi cái phải BẮT: `server/routes/loyalty.js` viết cứng `'fixed'`
  thay `reward.discount_type` trong câu INSERT mã (`:183`); bỏ trần (`reward.max_discount || 0` → `0`, `:183`);
  `server/routes/orders.js` bỏ áp trần mã khi bán (`:613–623`). Chuỗi gốc khớp đúng số lần (kiểm như `kiem_neo.py`).
  Đột biến `orders.js` chỉ dòng HTTP của kịch bản bắt (chat thử) → `c.mong` phải khẳng định ĐÚNG số tiền giảm và tổng đơn.
- C3 Bánh cóc `kiem_tra_truoc_khi_giao.js`: `NGUONG_KICH_BAN` 27 → 29 (chỉ tăng), `NGUONG_BAT_BIEN` giữ 16 (hoặc tăng nếu
  thêm). Sửa chú thích S4 theo số đo A1 thật. Kịch bản mới lộ code đang sai → DỪNG, `## Câu hỏi`.

### D. Nghiệm thu bằng đột biến (đếm ĐỦ, không lấy mẫu; trong lúc chạy KHÔNG chạy lệnh nào khác — so nhật ký người gác
→ "KHO BẨN" oan; `-j` theo số lõi được)
- D1 `cong_cu/thu_gia_lap.js` E2: 13 đột biến M1–M13 vẫn lệch đúng `KB<n> → <bất biến>` như gốc.
- D2 `python3 viec/LUOI-1/dot_bien.py` đủ 80: đúng mong đợi 80/80, với `VS-SRV-doi-ck-giu-tien-mat` nay BẮT;
  `GOC-KB10-cu-tre-khong-bat-lai` LẠC như gốc (hoặc ghi lý do nếu đổi).
- D3 `python3 viec/AUDIT-1/dot_bien.py C2F C2-loyalty-redeem-tru-0` đủ 87: MỌI tên BẮT trong "Bảng đủ 87" của
  `viec/LUOI-1/trang_thai.md` (mục C2) VẪN BẮT; SỐNG chỉ được giảm; `C2F-orders-02-insert-quay` LẠC như gốc. In bảng đủ 87.
- D4 `viec/TACH-GL/dot_bien.py` — đột biến cơ chế chia lượt, mỗi cái phải BẮT (bằng ca `thu_gia_lap` hoặc bánh cóc): cha bỏ
  một lượt; một kịch bản chạy ở hai lượt; cha nuốt mã thoát của lượt con (con lệch mà cha in ĐẠT); cha không dừng con khi bị
  SIGTERM; lượt chạy tuần tự thay vì cùng lúc (kế hoạch nêu cách bắt KHÔNG dựa vào đo giờ — dễ đỏ oan); dòng lệch in số thứ
  tự trong lượt thay số gốc; bỏ phần dựng đầu lượt mà B2 (ii) thêm (kịch bản phụ thuộc phải đỏ). + 3 đột biến máy chủ của C2.
  Bảng "chỗ đổi → đột biến" trong `trang_thai.md`.
- D5 Bộ đột biến cũ chạm file việc này sửa: chạy `python3 viec/HOC-2b/kiem_neo.py` (neo rữa) rồi chạy các đột biến có lệnh
  giả lập / `thu_gia_lap` / bộ kiểm của `viec/TU-CHAY-4/`, `viec/P26b/`, `viec/HOC-2b/`, `viec/LUOI-1/`, nhóm D1 của
  `viec/AUDIT-1/` → 0 HỎNG trừ `G3-sai-chuoi` cố ý. Neo rữa: sửa trong bộ có ở Phạm vi; bộ ngoài Phạm vi (`viec/AUDIT-1/`,
  `viec/HOC-1/`, `viec/HOC-2/`) → ghi `## Phát hiện`.

### E. Kiểm sống (ghi vào `viec/TACH-GL/trang_thai.md`)
- E1 Lúc mở phiên: in `git log --oneline -3`, khớp GitHub (có commit `PHIEU: TACH-GL`, cha là commit sổ v25).
- E2 PR có 2 check `cong` + `cong-chay` xanh (máy không xem được — ghi CHƯA KIỂM). Không đổi `tu_chay/` → không cần
  `cai_dat.sh`.

### F. Toàn bộ
`npm test` và `node kiem_tra_truoc_khi_giao.js --day-du` xanh, 0 CẢNH BÁO lúc chạy riêng; `thu_gia_lap` xanh. Kế hoạch ghi
ước lượng thời gian máy (đo, không đoán); quá ~150 phút → đề xuất tách trong `## Câu hỏi`, KHÔNG tự cắt mục. Thấy thông báo
đổi model giữa phiên → ghi giờ + bước. `KHUON_LOI.md`: thêm bài học chỉ khi chưa có khuôn tương đương (trần 120 dòng).

## Phạm vi
- viec/TACH-GL/**
- cong_cu/gia_lap/chay.js
- cong_cu/gia_lap/kich_ban.js
- cong_cu/gia_lap/bat_bien.js
- cong_cu/thu_gia_lap.js
- kiem_tra_truoc_khi_giao.js
- viec/LUOI-1/dot_bien.py
- viec/TU-CHAY-4/dot_bien.py
- viec/P26b/dot_bien.py
- viec/HOC-2b/dot_bien.py
- KHUON_LOI.md

## Ngân sách
Code ~200 dòng: `chay.js` +~80 (cha/lượt con, gộp kết quả, dừng con, kiểm mỗi KB đúng một lần), `kich_ban.js` +~70 (2 kịch bản
mới, gán lượt, dời dữ liệu dựng nếu cần), `kiem_tra_truoc_khi_giao.js` ±~10. Thử ~80 dòng: `thu_gia_lap.js` (DONG_DAT, ca chia
lượt, sập/SIGTERM dọn sạch). Hồ sơ: `viec/TACH-GL/dot_bien.py` ~100. Neo đột biến cũ ±~30.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `server/`, `client/`, `tu_chay/`, `.claude/`, `.github/`, `package.json`, `CHECKLIST_CODE.md`, `CLAUDE.md`,
  `viec/AUDIT-1/`, `viec/HOC-1/`, `viec/HOC-2/`, sổ việc. Không chạy `cai_dat.sh`.
- Không nới hạn (120 s bộ kiểm, 110 s giả lập con trong `thu_gia_lap`), không hạ ngưỡng `han * 0.8`, **không giảm trễ 40 ms**
  (`TRE_MS`), không bớt hay gộp kịch bản / bất biến / `c.mong`, không thêm miễn; bánh cóc chỉ tăng.
- Không đổi phần A1/A2 của `chay.js` theo hướng yếu đi (từ chối biến máy thật, kho tạm, dọn khi sập).
- Kịch bản lộ code đang sai (tiền/điểm/kho lệch trên code hiện tại) → DỪNG, ghi `## Câu hỏi`; không sửa `server/`, không viết
  kịch bản né chỗ sai.
- Không viết lệnh thử vượt người gác; việc này không cần ca người gác nào.
- Chỉ push đúng `git push -u origin viec/TACH-GL`. Không đụng `main`, không merge, không tạo PR. Không chạy `patch_*.py`.
