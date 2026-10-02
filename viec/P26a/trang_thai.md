# P26a — Trạng thái

## Bản chụp lúc bắt đầu (02.10.2026)

```
$ git branch --show-current
viec/P26a
$ git log --oneline -3
604bcd5 PHIEU: P26a
3b1b9bc TIEN-DO: TU-CHAY-4 xong (ba274cd), them P26a P26b HOC-2, ghi quyet dinh 02.10
ba274cd Merge pull request #6 from pos-tuquyduong/viec/TU-CHAY-4
```

## Tiến độ

- [x] Bước 1–3 (kế hoạch, soát kế hoạch ĐẠT) — chủ quán duyệt 02.10.2026: phương án A ở mọi mục.
- [x] Bước 4 bài thử đỏ trên gốc → `bang_chung_do.txt` (thu_P26a 3/5, thu_P20 43/8, giả lập KB12 500, thu_gia_lap E1)
- [x] Bước 5 vá `server/database.js` (`soDong`, dòng 1338-1339; dùng ở 1355 và 1382)
- [x] Bước 6 `npm test` thoát 0 · `--day-du` 61 đạt / 0 hỏng (giả lập 12 kịch bản ĐẠT, thu_gia_lap xanh)
- [x] Bước 7 commit từng file · bước 8 `/ra-soat` vòng 1 KHÔNG ĐẠT (thiếu A5 trong file này) → sửa (vòng sửa 1/3)

## Đột biến A5 — lệnh chạy lại được

Dựng bản sao trong thư mục nháp `<NHAP>` (viết THẲNG đường dẫn — người gác chặn biến ở đích ghi, B-DICHCHU; dùng
tên thư mục MỚI — `cp -r server <thư mục đã có>` chép vào bên trong, đã đè bản đột biến một lần):
```bash
mkdir -p <NHAP>/da5 && cp -r server <NHAP>/da5/ma && cp -r server <NHAP>/da5/mb && ln -s "$PWD/node_modules" <NHAP>/da5/node_modules
python3 -c "
import sys; N=sys.argv[1]
for d,a in [('ma','      lastInsertRowid: soDong(result.lastInsertRowid),'),('mb','return { lastInsertRowid: soDong(result.lastInsertRowid), changes')]:
    p=N+'/'+d+'/database.js'; s=open(p).read(); assert s.count(a)==1; open(p,'w').write(s.replace(a,a.replace('soDong(result.lastInsertRowid)','result.lastInsertRowid')))
print('đã áp')" <NHAP>/da5
node cong_cu/thu_P26a.js --may-chu <NHAP>/da5/ma        # M-a → 4 đạt · 4 hỏng (C1–C4)
node cong_cu/thu_P26a.js --may-chu <NHAP>/da5/mb        # M-b → 7 đạt · 1 hỏng (C5)
node cong_cu/gia_lap/chay.js --may-chu <NHAP>/da5/ma    # M-c → KB12 500, KHÔNG ĐẠT
```
Kết quả (02.10.2026, chạy lại sau soát trên bản sao đã `diff` đúng một dòng khác HEAD):
- M-a (bỏ `soDong` ở `run()` thường): ✗ C1 C2 C3 C4 — `4 đạt · 4 hỏng`, C5 xanh.
- M-b (bỏ ở `run()` giao dịch): ✗ đúng C5 — `7 đạt · 1 hỏng`.
- M-c (M-a trên giả lập): `✗ KB12 → HTTP: POST /refunds → 200, refund_id là số: HTTP 500 · Do not know how to serialize a BigInt`,
  `Giả lập: 12 kịch bản · 9 bất biến · KHÔNG ĐẠT (1 lệch)`.

## Phát hiện

- **[gom sang P26b — chủ quán dặn 02.10]** `server/routes/refunds.js:113-119`: kiểm "đã có yêu cầu hoàn tiền pending"
  nằm NGOÀI giao dịch, không có ràng buộc duy nhất → hai lệnh `POST /refunds` chồng nhau có thể tạo hai yêu cầu cho một đơn.
- **[LỖ TIỀN — soát vòng 1 bắt, đã tự đọc lại]** Hoàn ví HAI LẦN cho một đơn: `POST /refunds/:id/approve` (refunds.js:150-225)
  không kiểm trạng thái đơn; `PUT /orders/:id/cancel` chỉ chặn `status === "cancelled"` (orders.js:1362), không chặn
  `refunded`. Đơn 25.000 trả ví → yêu cầu hoàn → duyệt → huỷ: ví +50.000 (người soát chạy thật trên kho tạm, cả hai thứ tự).
  Đường song song: `DELETE /:id` (orders.js:1579, 1608) chỉ kiểm `!== "cancelled"`. Ngoài phạm vi (routes/ bị cấm) —
  cần việc riêng; màn quầy hiện chưa gọi `POST /refunds`, nhưng API đã mở. Đề nghị gom vào P26b cùng mục trên.
- `refunds.js:151-173, 209-216` (NGHI NGỜ, chưa tái hiện): duyệt kiểm `pending` và đọc số dư ví ngoài giao dịch, UPDATE
  không có `AND status = 'pending'`, ví ghi số tuyệt đối → có thể duyệt đôi trên Turso có trễ mạng. 3 lần chạy cục bộ không ra.
- `POST /packages/buy` (packages.js:169-178): chỉ `authenticate`, không `checkPermission`, không thu tiền, `total_qty` lấy
  từ client, không kiểm `package_id` → nhân viên nào cũng tạo được gói `active` miễn phí. Client không gọi route này.
  `thu_P26a.js` C4 đòi route này 200 (phiếu A1 ghi đích danh) bằng token CHỦ QUÁN → thêm `checkPermission` sau này
  vẫn xanh; nhưng thêm "phải thu tiền" sẽ làm C4 đỏ — khi đó sửa C4 theo luồng hợp lệ mới, KHÔNG nới route.
- `cong_cu/gia_lap/bat_bien.js:21`: chú thích hẹn KB12 sẽ phủ nhánh `refunded` của I1 — KB12 đã có; cập nhật ở việc sau.
- Phiếu A2 gọi `tiers.js` là route "đã tự bọc Number()", nhưng `tiers.js:88` không trả id nào; C9 chỉ kiểm `PUT /tiers` → 200,
  ca A2 đúng nghĩa là C7 `POST /rewards` (rewards.js:49) và C8 `/loyalty/redeem` (loyalty.js:202, đi qua `tx.run`).

## Câu hỏi

(không có)

## /ra-soat vòng 1 — báo cáo nguyên văn

```
KHÔNG ĐẠT

Phần code thì đúng: bản vá ở server/database.js và các bài thử đều đỏ trên bản chưa vá, xanh sau khi vá, đã chạy lại từng cái. Kết luận KHÔNG ĐẠT vì hai lý do. Một: nghiệm thu A5 chưa có trong kho. Hai: có một lỗ tiền thật trên chính đường mà KB12 vừa đưa vào giả lập.

VIỆC CẦN BIẾT NGAY: trong lúc soát, tôi đã ghi đè hai bản đột biến của phiên chính. Tôi chạy `cp -r server <scratchpad>/ma` và `cp -r server <scratchpad>/mb` mà không biết hai thư mục này đã có sẵn từ 09:16. Vì vậy `scratchpad/ma/server/database.js` và `scratchpad/mb/server/database.js` giờ giống hệt HEAD (đã kiểm bằng `cmp`), không còn là đột biến. Đừng dùng kết quả chạy lại từ hai thư mục đó. Bản đột biến tôi tự dựng (đã kiểm bằng `diff`) nằm ở `scratchpad/rv_ma` (bỏ `soDong` ở `run()` thường) và `scratchpad/rv_mb` (bỏ ở `run()` giao dịch). Trong kho không có file nào bị sửa.

LỖI TÌM ĐƯỢC:
- viec/P26a/trang_thai.md (cả file) — Nghiệm thu A5 trong phiếu đòi "Ghi lệnh chạy lại được trong trang_thai.md". Ở HEAD (da7b2f5) file này vẫn là bản chụp bước 3, còn ghi "DỪNG — chờ duyệt". Không có lệnh đột biến M-a/M-b/M-c, không có kết quả, không có mục CHƯA KIỂM. ke_hoach.md:46 và ke_hoach.md:107 hứa "ghi CHƯA KIỂM" (rowid lớn hơn 2^53; từng route chỉ dùng id làm tham số SQL), nhưng chưa ghi ở đâu cả. — K1/K7 (báo cáo chưa có căn cứ trong kho).
- server/routes/refunds.js:150-218 cùng server/routes/orders.js:1348-1372 — Hoàn tiền vào ví HAI LẦN cho một đơn. Lỗi có từ trước, không do P26a gây ra, nhưng P26a làm luồng này chạy được, và KB12 coi nó là luồng chuẩn mà không bất biến nào bắt.
  - Nguyên nhân: route duyệt yêu cầu hoàn tiền (`approve`) không kiểm trạng thái đơn. `PUT /orders/:id/cancel` chỉ chặn `status === "cancelled"` (orders.js:1362), không chặn `refunded`. Đường song song là `DELETE /:id` (orders.js:1579, 1608) cũng chỉ chặn `!== "cancelled"`.
  - Đã chạy thật (file `scratchpad/rv_dua/dua2.js`, máy chủ thật trên kho tạm). Đơn 25.000 trả bằng ví → `POST /refunds` → duyệt → huỷ đơn: cả hai lệnh 200, ví đi từ 75.000 lên 125.000, có 2 dòng `refund` trong sổ.
  - Đảo thứ tự (huỷ rồi mới duyệt) cho đúng kết quả đó. Lỗi xảy ra tất định.
  - Đây là vùng "CHƯA rà" mà CLAUDE.md mục 8 đã cảnh báo. Phạm vi P26a cấm sửa routes/, nên cần mở một việc riêng. — Đường tiền / K4 (một đường hoàn tiền đã chặn đơn đã hoàn, đường kia không).
- cong_cu/thu_P26a.js:100-105 (C4) — Bài thử khoá cứng `POST /packages/buy` phải trả 200. Route này (server/routes/packages.js:169-178) có ba chỗ hở:
  - chỉ cần `authenticate`, không có `checkPermission`;
  - không thu tiền, `total_qty` lấy thẳng từ client;
  - không kiểm `package_id` hay `order_id` có tồn tại không.
  Hậu quả: nhân viên nào cũng tạo được gói đang dùng (`active`) với số ly tuỳ ý, miễn phí. Client không gọi route này (grep `client/src` không thấy chỗ nào). Bài thử nằm trong bộ kiểm bản nhanh (kiem_tra_truoc_khi_giao.js:488), tức là trong pre-commit. Nên việc sau mà thêm cổng phân quyền cho route này sẽ làm `thu_P26a` đỏ, tạo sức ép nới bài thử thay vì vá lỗ. — Đường tiền (P3/P4) / K5 ngược (bài thử khoá một luồng không hợp lệ thành luồng phải qua).

Trả lời 6 mục soát:
1. K3 — bài thử có giá trị. Đã chạy lại:
   - Bản gốc 604bcd5 (`scratchpad/goc`): `thu_P26a` đỏ C1–C5 (3 đạt · 5 hỏng, thoát 1); `thu_P20` 43 đạt · 8 hỏng; giả lập "12 kịch bản · KHÔNG ĐẠT (1 lệch)". Khớp `bang_chung_do.txt`.
   - HEAD: `thu_P26a` 8/0, `thu_P20` 51/0, giả lập ĐẠT, `npm test` 57 đạt / 0 hỏng, `--day-du` 61 đạt / 0 hỏng.
   - Đột biến M-a: C1–C4 đỏ, C5 xanh. M-b: chỉ C5 đỏ. M-c (giả lập trên rv_ma): KB12 báo 500.
   - Bài thử kiểm hành vi: HTTP 200, `typeof === 'number'`, id trùng với kho. Không soi marker. Marker suông, chỉ vá 4 route, hay gắn `BigInt.prototype.toJSON` đều không qua được C5 hoặc `laSo`.
2. K4 — `grep lastInsertRowid server` ra 21 dòng: 4 ở database.js (1338, 1345, 1355, 1382), 17 ở routes.
   - Chỗ duy nhất phát ra giá trị là database.js:1355 và 1382; cả hai đã vá.
   - `.execute(` ngoài database.js: 0 chỗ. `getDb` ngoài database.js: 0 chỗ. `createClient` chỉ có ở database.js:27.
   - Không chỗ nào dùng phép tính BigInt hay `typeof bigint` (grep `BigInt|bigint|\dn\b` chỉ ra chú thích).
   - Không sót chỗ nào.
3. K5 — `soDong` (database.js:1339) chỉ đổi kiểu, không chặn gì.
   - Route đã tự bọc `Number()` (orders.js:868, 1022; rewards.js:49; loyalty.js:175, 202): C7, C8 xanh trên cả hai bản.
   - Route dùng id làm tham số SQL (refunds.js:216 đi qua `approve`): xanh.
   - UPDATE/DELETE: KB1–11 xanh.
   - Không thấy luồng nào bị chặn oan.
   - Hai route trước đây "ghi xong rồi 500" nay trả 200 (`/discount-codes`, `/invoice/log`; InvoicePrint.jsx:224 không đọc kết quả). Đây là tác dụng mong muốn.
4. K1 — ke_hoach.md:9-20 đối chiếu khớp với 604bcd5. Lệch:
   - ke_hoach.md:61 ghi C3 so với `MAX(id)`, code (thu_P26a.js:97) không dùng MAX. Nhỏ.
   - ke_hoach.md:11 nói "thử thật `:memory:`" nhưng không lưu lệnh hay kết quả.
   - trang_thai.md lỗi thời (xem trên).
   - trang_thai.md "Phát hiện" (tiers.js:88 không trả id, bat_bien.js:21) đúng như đã đọc.
5. Đường tiền — diff không đổi logic tiền. Hai lỗ có từ trước như đã nêu ở trên.
6. P1 — không đụng `client/` (diff stat); `--day-du` báo "dist đã commit KHỚP với src".

NGHI NGỜ:
- refunds.js:151-160 và 169-173: kiểm `status === 'pending'` và đọc số dư ví nằm NGOÀI giao dịch. Lệnh `UPDATE pos_refund_requests` (dòng 209-216) không có `AND status = 'pending'`, cũng không kiểm `changes`. Lệnh ví ghi số tuyệt đối `balanceAfter`.
  - Có thể duyệt hai lần cùng lúc, hoặc mất một lần trừ ví nếu có giao dịch xen vào giữa.
  - Chạy thử 3 lần với kho file cục bộ, hai lệnh duyệt song song: không tái hiện được (lệnh sau nhận 400). Trên Turso có độ trễ mạng thì chưa biết.
- ke_hoach.md:110 nói libsql "luôn trả bigint". Lời này mới thử trên kho cục bộ. Production dùng Turso qua mạng (hrana); `soDong` giữ nguyên null/undefined nên vẫn an toàn, nhưng chưa kiểm trên đường đó.

CHƯA SOÁT ĐƯỢC:
- Hành vi trên Turso production (hrana).
- Đột biến M-c trong khung E2 của `thu_gia_lap` (kế hoạch cố ý không thêm).
- Từng route chỉ dùng id làm tham số SQL (users.js:61, customers.js:372→413 và 632, registrations.js:244, packages.js:47) không có bài thử riêng.
- Ca rowid lớn hơn 2^53.
- `thu_gia_lap.js` chỉ chạy gián tiếp qua `--day-du` (xanh, 25,9 s), chưa chạy riêng trên bản gốc.

BÀI HỌC:
- KHOÁ: bất biến mới cho giả lập: "mỗi đơn có tổng dòng `refund` + `cancel_refund` trong sổ ví không vượt `balance_amount`". Thêm một kịch bản "hoàn tiền rồi huỷ đơn / huỷ rồi duyệt hoàn tiền → lệnh thứ hai bị chặn". Kịch bản này phải đỏ trên code hiện tại (đã chứng minh: ví +50.000 cho đơn 25.000).
- KHOÁ: một phép kiểm tĩnh: mọi route cộng ví (cancel, delete, refunds approve, damages) phải chặn đơn có `status IN ('cancelled','refunded')` (K4 — hai đường hoàn tiền).
- NGUYÊN TẮC (KHUON_LOI K5, chiều ngược): bài thử "phải qua" chỉ được khoá luồng HỢP LỆ. Trước khi viết `status === 200` cho một route, đọc phân quyền và đường tiền của route đó. C4 đang khoá `/packages/buy` (không quyền, không thu tiền) vào pre-commit.
- NGUYÊN TẮC (K7): agent soát phải dùng thư mục nháp tên riêng (`rv_*`). Lệnh `cp -r X dir` khi `dir` đã tồn tại sẽ ghi vào `dir/X` và đè bản đột biến của phiên chính (đã xảy ra lần này với ma/, mb/).
- Quy trình: cập nhật trang_thai.md (lệnh đột biến A5 + CHƯA KIỂM) TRƯỚC khi gọi /ra-soat, để người soát có bằng chứng mà đối chiếu.
```

Xử lý vòng 1: ghi A5 + CHƯA KIỂM (mục trên / báo cáo); C4 giữ vì phiếu A1 ghi đích danh `/packages/buy` và dùng token chủ
quán — ghi Phát hiện; ke_hoach.md:61 sửa MAX(id); lỗ hoàn ví hai lần → Phát hiện (routes/ cấm sửa).

## Bài học

Sự cố của việc này: người gác chặn 4 lệnh phiên chính (B-PHANTICH `${…}` trong vòng lặp; B-CHUONGTRINH `env -i`;
SED-I `sed -i` trên bản sao trong thư mục nháp; B-DICHCHU biến ở đích ghi) + B-MANOI (heredoc nhắc file được bảo vệ khi
ghi file này) + 1 lệnh bị từ chối quyền (`rm -rf` thư mục nháp); agent soát kế hoạch bị chặn 2, agent soát code bị chặn 6
(`.tu_chay_nhat_ky.jsonl` 08:19–09:25). Soát vòng 1 KHÔNG ĐẠT (A5 chưa ghi). `thu_P26a.js` 140 dòng / ngân sách ~90
(vượt 1,55× > ngưỡng 1,5). Agent soát đè bản đột biến của phiên chính.

- **KHOÁ** (ngoài Phạm vi — đề xuất, gom vào P26b): kịch bản giả lập "hoàn tiền rồi huỷ đơn / huỷ rồi duyệt hoàn" →
  lệnh thứ hai phải bị chặn, + bất biến giả lập "tổng dòng ví refund + cancel_refund của một đơn ≤ balance_amount".
  Ca đỏ: người soát đã chạy thật — đơn 25.000, ví +50.000. Không làm ở P26a: thêm kịch bản đỏ vào giả lập làm cổng đỏ mà
  routes/ cấm sửa; file bất biến ngoài Phạm vi.
- **KHOÁ** (ngoài Phạm vi — đề xuất cho skill `/lam-viec`, nguồn ở thư mục tự chạy): bước 8 `/ra-soat` chỉ chạy khi
  `trang_thai.md` đã có mục "Đột biến"/"CHƯA KIỂM" mà phiếu đòi — skill hoặc người gác kiểm có mặt các mục đó trước khi
  giao soát. Ca đỏ: lần này (da7b2f5 gọi soát khi trang_thai.md còn là bản bước 3).
- **NGUYÊN TẮC** — K5 chiều ngược, ĐÃ GHI vào `KHUON_LOI.md` (K5, 2 dòng): ca "phải qua" chỉ khoá luồng HỢP LỆ; đọc phân
  quyền + đường tiền của route trước khi viết `status === 200`. Ví dụ thật: C4 `/packages/buy`.
- **NGUYÊN TẮC** (ngoài Phạm vi — đề xuất cho lệnh `/ra-soat`): agent soát dựng bản sao trong thư mục nháp tên riêng
  (`rv_*`), không `cp -r` vào thư mục đã có. Đã gây: đè `ma/`, `mb/` của phiên chính (K7).
- **BỎ**: vượt ngân sách `thu_P26a.js` — phiếu tính ~90 cho 4 route, bài cần thêm C5 + 3 ca K5 (C7–C9) và cờ `--may-chu`;
  một lần, không thành luật. Các lệnh bị người gác chặn: luật đúng, đã làm theo hướng dẫn, không lặp.
- Dọn: không thấy lời dặn nào trong KHUON_LOI.md / CLAUDE.md đã có phép kiểm làm thay do việc này. KHUON_LOI.md 117/120 dòng.

## Báo cáo 7 mục

```
VIỆC:        P26a — Vá lỗi "ghi xong rồi báo 500" (BigInt) tại gốc + kịch bản 12 cho giả lập
ĐÃ SỬA:      server/database.js:1338-1339 — hàm soDong (BigInt → Number, giữ null/undefined);
             server/database.js:1355 run() và :1382 tx.run() dùng soDong.
             cong_cu/thu_P26a.js (mới) — C1–C5 + C7–C9, cờ --may-chu.
             cong_cu/thu_P20.js:180 — bỏ đoạn lách tra pos_refund_requests; kiểm 200 + refund_id số, dùng thẳng refund_id.
             cong_cu/gia_lap/kich_ban.js — KB12 (POST /refunds → approve bằng refund_id, ví +30.000); sửa chú thích KB6.
             cong_cu/thu_gia_lap.js:31 — dòng tổng 12 kịch bản.
             kiem_tra_truoc_khi_giao.js:488 thêm thu_P26a vào bài chạy thật (bản nhanh); :715 NGUONG_KICH_BAN 11 → 12.
             KHUON_LOI.md K5 — thêm 2 dòng "chiều ngược".
BÀI THỬ:     chạy trên bản chưa vá → ĐỎ: thu_P26a C1–C4 (HTTP 500 BigInt), C5 (bigint) — 3 đạt · 5 hỏng;
             thu_P20 "POST /refunds → 200, refund_id là số" HTTP 500 — 43 đạt · 8 hỏng;
             giả lập "KB12 → HTTP … 500", KHÔNG ĐẠT; thu_gia_lap E1 dòng tổng (bang_chung_do.txt).
             Sau khi vá → XANH: thu_P26a 8/0, thu_P20 51/0, giả lập 12 kịch bản ĐẠT, npm test thoát 0, --day-du 61/0.
             Đột biến: M-a đỏ C1–C4, M-b đỏ đúng C5, M-c KB12 500 (lệnh ở mục "Đột biến A5").
ĐÃ RÀ K4:    grep "lastInsertRowid" server → 21 dòng (4 database.js, 17 routes); chỉ database.js:1355, 1382 phát ra giá trị,
             đã vá cả hai; ".execute(" và "getDb" ngoài database.js → 0 chỗ. Route đã bọc Number() vẫn đúng (C7, C8).
CHƯA KIỂM:   - Turso production (hrana): chỉ thử libsql file cục bộ; soDong giữ null/undefined nên không hỏng nếu kho trả khác.
             - Nhánh giữ null/undefined: libsql thật luôn trả bigint (kể cả UPDATE) → không dựng được ca thật.
             - rowid > 2^53 (Number mất chính xác) — không thực tế với kho quầy, không có ca thử.
             - Từng route chỉ dùng id làm tham số SQL (users.js:61, customers.js:372→413 và 632, registrations.js:244,
               packages.js:47) không có bài thử riêng; refunds.js:216 có (approve trong C1/KB12/thu_P20).
             - M-c không nằm trong khung E2 của thu_gia_lap (khung đòi lệch bất biến, KB12 lệch ở HTTP) — chỉ chạy tay.
             - Màn hình thật (tạo mã chiết khấu, in hoá đơn) chưa bấm thử trên trình duyệt; chỉ kiểm qua API.
             - Lỗ hoàn ví hai lần (refunds approve + cancel) CÒN MỞ — ngoài phạm vi, xem Phát hiện.
GIT:         xem git log --oneline -2 ở câu trả lời cuối
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 2 · BỎ 1 — chi tiết ở ## Bài học
```
