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
  cần việc riêng; màn quầy chưa gọi `POST /refunds` (api.js không có hàm tạo yêu cầu), nhưng màn DUYỆT đang chạy thật
  (`client/src/pages/Refunds.jsx:21` → `refundsApi.approve`); trước P26a `POST /refunds` vẫn ghi dòng rồi mới 500, nên
  production có thể đang có yêu cầu treo duyệt được. Đề nghị gom vào P26b cùng mục trên.
- `refunds.js:151-173, 209-216` (NGHI NGỜ, chưa tái hiện): duyệt kiểm `pending` và đọc số dư ví ngoài giao dịch, UPDATE
  không có `AND status = 'pending'`, ví ghi số tuyệt đối → có thể duyệt đôi trên Turso có trễ mạng. 3 lần chạy cục bộ không ra.
- `POST /packages/buy` (packages.js:169-178): chỉ `authenticate`, không `checkPermission`, không thu tiền, `total_qty` lấy
  từ client, không kiểm `package_id` → nhân viên nào cũng tạo được gói `active` miễn phí. Client không gọi route này.
  `thu_P26a.js` C4 đòi route này 200 (phiếu A1 ghi đích danh) bằng token CHỦ QUÁN → thêm `checkPermission` sau này
  vẫn xanh; nhưng thêm "phải thu tiền" sẽ làm C4 đỏ — khi đó sửa C4 theo luồng hợp lệ mới, KHÔNG nới route.
- **KB12 CHƯA phủ nhánh `refunded` của I1** (soát vòng 2 bắt, đã tự đọc lại): I1 chỉ xét đơn có mã bill ĐÃ DÙNG
  (`cong_cu/gia_lap/bat_bien.js:28` `WHERE s.claimed_at IS NOT NULL OR s.diem_nhan_luc IS NOT NULL`), KB12 không gọi
  `/claim` hay `/nhan-diem`. Đột biến của người soát: thay nhánh `refunded` (bat_bien.js:31) bằng `false` → giả lập vẫn
  `12 kịch bản · 9 bất biến · ĐẠT`. Chú thích bat_bien.js:21 "CHƯA có kịch bản chạy qua" vẫn ĐÚNG — chỉ cần bỏ vế
  "KB12 … sẽ phủ". Việc sau (P26b): kịch bản đơn trả ví → claim mã bill → `POST /refunds` + duyệt, đỏ khi xoá nhánh.
- Phiếu A2 gọi `tiers.js` là route "đã tự bọc Number()", nhưng `tiers.js:88` không trả id nào; C9 chỉ kiểm `PUT /tiers` → 200,
  ca A2 đúng nghĩa là C7 `POST /rewards` (rewards.js:49) và C8 `/loyalty/redeem` (loyalty.js:202, đi qua `tx.run`).

## Câu hỏi

- (không chặn việc này) Luật K5 "chiều ngược" vừa thêm lấy C4 làm ví dụ vi phạm, nhưng C4 vẫn nằm trong bộ kiểm bản nhanh
  vì phiếu A1 ghi đích danh `POST /packages/buy`. Chủ quán chọn: giữ C4 tới khi P26b vá route (C4 đổi theo luồng hợp lệ
  mới), hay bỏ C4 khỏi `thu_P26a` ngay (A1 còn 3 route + đường giao dịch)? Máy KHÔNG tự đổi.

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
- **NGUYÊN TẮC** — K3, ĐÃ GHI vào `KHUON_LOI.md` (1 dòng): "kịch bản X phủ nhánh Y" chỉ nói được khi đột biến xoá Y làm
  giả lập ĐỎ; đọc WHERE của bất biến trước. Đã gây: kế hoạch + trang_thai nói KB12 phủ I1-refunded (soát vòng 2 bắt).
- **KHOÁ** (ngoài Phạm vi — đề xuất P26b): kịch bản "đơn trả ví → claim mã bill → POST /refunds + duyệt" — phủ thật
  I1-refunded; ca đỏ: xoá nhánh `refunded` ở bat_bien.js:31 phải làm giả lập ĐỎ (hôm nay vẫn ĐẠT).
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
GIT:         (lúc ghi báo cáo, trước commit chứa chính dòng này)
             47c531c P26a: trang thai - dot bien A5, phat hien, ra-soat vong 1, bai hoc, bao cao 7 muc
             dd3520a P26a: ke hoach - C3 so id theo invoice_number (khong MAX)
BÀI HỌC:     KHOÁ 3 · NGUYÊN TẮC 3 · BỎ 1 — chi tiết ở ## Bài học
```

## /ra-soat vòng 2 — báo cáo nguyên văn

```
KHÔNG ĐẠT. Phần code đúng. A5 chạy lại được, và cả ba lỗi vòng 1 đã xử lý đúng. Nhưng báo cáo còn một khẳng định sai mà tôi đã chứng minh bằng đột biến: KB12 KHÔNG phủ nhánh `refunded` của bất biến I1. Đây đúng là khuôn "xanh oan" về độ phủ. Sửa chỉ mất 2 dòng tài liệu, không phải sửa code.

LỖI TÌM ĐƯỢC:
- viec/P26a/trang_thai.md:58 và ke_hoach.md:121-122 — sai so với kết quả chạy — K1/K3.
  - Hai chỗ này nói KB12 đã phủ nhánh `refunded` của I1 ("sau việc này KB12 phủ thật", "KB12 đã có; cập nhật ở việc sau").
  - Thực tế I1 (cong_cu/gia_lap/bat_bien.js:22-32) chỉ chọn đơn có mã bill đã dùng: `WHERE s.claimed_at IS NOT NULL OR s.diem_nhan_luc IS NOT NULL` (dòng 28). KB12 (kich_ban.js:170-178) không gọi `/claim` hay `/nhan-diem`, nên không bao giờ đi vào nhánh này.
  - Đột biến đã chạy: chép `cong_cu/gia_lap` sang `scratchpad/rv2_i1`, rồi thay `|| (r.status === 'refunded' && String(r.luc_hoan) >= String(r.luc_dung))` bằng `|| false`. Lệnh: `node rv2_i1/cong_cu/gia_lap/chay.js --may-chu /home/user/pos-tuquyduong/server --cau-hinh .../tu_chay/cau_hinh.json` → `Giả lập: 12 kịch bản · 9 bất biến · ĐẠT`.
  - Nghĩa là nhánh này vẫn không có kịch bản nào chạy qua. Chú thích bat_bien.js:21 ("CHƯA có kịch bản chạy qua") hiện vẫn ĐÚNG. Việc sau mà theo trang_thai.md "cập nhật chú thích" sẽ ghi sai rằng nhánh đã được phủ.
  - Cách sửa: ghi lại Phát hiện thành "KB12 chưa phủ I1-refunded — cần kịch bản claim mã bill rồi hoàn qua /refunds". Ghi luôn kết quả đột biến trên.
- viec/P26a/trang_thai.md:187 — mục GIT ghi "xem git log --oneline -2 ở câu trả lời cuối" thay vì kết quả lệnh. Mẫu ở CLAUDE.md §7 đòi kết quả thật. Lỗi nhỏ, thuộc K7 (giao nhận).

Kiểm việc xử lý vòng 1:
- (a) Đã xử lý đúng. trang_thai.md đã có khối A5 và mục CHƯA KIỂM. Tôi chạy đúng khối lệnh, thay `<NHAP>` bằng `scratchpad/rv2_a5`:
  - `diff` cho thấy mỗi bản sao lệch HEAD đúng một dòng (1355 với ma, 1382 với mb).
  - M-a: 4 đạt · 4 hỏng (C1–C4, HTTP 500 BigInt).
  - M-b: 7 đạt · 1 hỏng (đúng C5, `bigint 61`).
  - M-c: `✗ KB12 → HTTP … 500`, `KHÔNG ĐẠT (1 lệch)`.
  - Tất cả khớp với ghi chép.
- (b) Ghi Phát hiện là đúng. Tôi đã đọc code và thấy khớp:
  - refunds.js:150-225: duyệt yêu cầu hoàn tiền không kiểm trạng thái đơn.
  - orders.js:1362: huỷ đơn chỉ chặn `cancelled`; từ 1372 cộng `balance_amount` vào ví, không xét `refunded`.
  - orders.js:1579 và 1608: chỉ kiểm `!== "cancelled"`.
  - refunds.js:104: chỉ đường tạo yêu cầu mới chặn `refunded`.
  - Lỗi có từ trước, ngoài phạm vi. Lưu ý thêm: client CÓ màn duyệt (client/src/pages/Refunds.jsx:21 → `refundsApi.approve`; Layout.jsx:74). Trước P26a, `POST /refunds` vẫn ghi dòng xong rồi mới báo 500, nên yêu cầu treo có thể đã nằm sẵn trên production và duyệt được. Câu "màn quầy hiện chưa gọi `POST /refunds`" đúng (api.js:370-377 không có hàm tạo yêu cầu), nhưng đường duyệt thì đang chạy thật.
- (c) Giữ C4 là chấp nhận được, vì phiếu A1 ghi đích danh route này. Đã kiểm hai khẳng định:
  - "Thêm `checkPermission` sau này vẫn xanh" là đúng: auth.js:90-92 cho `owner` qua hết, và C4 dùng token chủ quán (thu_P26a.js:63-64).
  - packages.js:169-178 hở đúng như mô tả.

Trả lời 6 mục soát:
1. K3 — bài thử có giá trị.
   - Trên gốc (`rv2_a5/goc` = server HEAD + `git show 604bcd5^:server/database.js`): `thu_P26a` 3 đạt · 5 hỏng (C1–C5), khớp bang_chung_do.txt.
   - Trên HEAD: 8 đạt · 0 hỏng.
   - Bài kiểm hành vi: HTTP 200, `typeof` là số, id khớp kho (thu_P26a.js:89-127). Không soi marker.
   - Vá kiểu marker suông, kiểu `BigInt.prototype.toJSON`, hay chỉ vá route đều không qua được C5 (kiểm `laSo` trên `tx.run`). M-a và M-b mỗi cái đỏ đúng ca của nó.
2. K4 — `grep -rn lastInsertRowid server` ra 21 dòng: 4 ở database.js, 17 ở routes.
   - Chỉ database.js:1355 và 1382 phát ra giá trị; cả hai đã vá.
   - `getDb` và `createClient` chỉ có trong database.js. `.execute(` ngoài database.js: 0 chỗ.
   - Công cụ thử (gia_lap/chay.js:164, kich_ban.js:50/53, thu_P20.js:298/301) tự bọc `Number()`, nên vẫn đúng.
   - Không sót chỗ nào.
3. K5 — `soDong` (database.js:1339) chỉ đổi kiểu, không chặn gì.
   - Route đã bọc `Number()` (C7, C8): xanh.
   - Id dùng làm tham số SQL (refunds.js:216 qua approve): xanh.
   - UPDATE/DELETE (KB1–11): xanh.
   - `--day-du` tôi chạy lại: PASS 61 · FAIL 0, thoát 0; thu_P26a 0,7 s trong bản nhanh (kiem_tra_truoc_khi_giao.js:488).
4. K1 — ngoài lỗi I1 ở trên, các khẳng định khác đều khớp code hoặc kết quả chạy:
   - Số dòng: database.js:1338-1339/1355/1382, kiem_tra:488/715, thu_gia_lap:31, thu_P20:180, tiers.js:88, rewards.js:49, loyalty.js:202.
   - KHUON_LOI.md dài 117 dòng; thu_P26a.js 140 dòng (gấp 1,55 lần ngân sách 90).
   - Số lần người gác chặn khớp `.tu_chay_nhat_ky.jsonl`: phiên chính 5 lần (4 B-* + B-MANOI); a825 chặn 6 lần (09:18–09:25); ae709 chặn 2 lần (08:19).
5. Đường tiền — diff không đổi logic tiền. KB12 hoàn `refund_amount` lấy từ đơn trong DB (refunds.js:127-128), không tin client. Các lỗ có từ trước đã nêu ở trên.
6. P1 — không đụng `client/`; `--day-du` báo "dist đã commit KHỚP với src".

NGHI NGỜ:
- KHUON_LOI.md (K5, dòng thêm mới) lấy C4 làm ví dụ vi phạm ("khoá … vào pre-commit; soát bắt"), nhưng C4 vẫn nằm nguyên trong bộ kiểm bản nhanh. Luật mới và bài thử của chính nhánh này mâu thuẫn nhau. Đáng lẽ phải nêu ở `## Câu hỏi` cho chủ quán quyết (phiếu: "ghi ## Câu hỏi"), nhưng mục này để "(không có)" và phiên tự quyết.
- Lỗ hoàn ví hai lần: tôi chỉ đọc code, không tự chạy lại ca +50.000 (vòng 1 đã chạy). Đọc code thấy khớp.

CHƯA SOÁT ĐƯỢC:
- Turso production (hrana): chưa kiểm `lastInsertRowid` ở đó có kiểu gì.
- thu_P20 trên bản gốc: chỉ đối chiếu bang_chung_do.txt (43/8), không chạy lại vì thu_P20 không có cờ `--may-chu`.
- Màn hình thật (tạo mã chiết khấu, in hoá đơn) trên trình duyệt.
- Duyệt hai lần cùng lúc trên kho có độ trễ mạng.

BÀI HỌC:
- NGUYÊN TẮC (K3/K1): khẳng định "kịch bản X phủ nhánh Y của bất biến" phải kèm đột biến xoá nhánh Y mà làm giả lập ĐỎ. Đọc điều kiện WHERE của bất biến trước khi nói một kịch bản "chạy qua" nó. Lần này I1 chỉ xét đơn có mã bill đã dùng, nên KB12 không chạm tới.
- KHOÁ (đề xuất cho P26b): thêm kịch bản "đơn trả bằng ví, claim mã bill, rồi `POST /refunds` + approve". Kịch bản này phủ thật I1-refunded và dùng được để dựng ca đỏ cho lỗ hoàn hai lần.

Thư mục nháp đã dùng: …/scratchpad/rv2_a5 (da5/ma, da5/mb, goc), …/scratchpad/rv2_i1, …/scratchpad/rv2_dd.txt. Không sửa file nào trong kho, không commit.
```

Xử lý vòng 2 (vòng sửa 2/3): Phát hiện I1 viết lại (đã tự đọc bat_bien.js:20-32); ke_hoach §8b đánh dấu sai dự đoán;
Phát hiện hoàn ví thêm màn duyệt Refunds.jsx:21 đang chạy thật; mâu thuẫn K5/C4 → `## Câu hỏi` (máy không tự đổi C4);
mục GIT ghi kết quả lệnh; thêm 1 dòng K3 vào KHUON_LOI.md (118/120). Không đổi code.
