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
- [x] `/ra-soat` vòng 2 KHÔNG ĐẠT (nói sai KB12 phủ I1-refunded; mục GIT) → sửa tài liệu (vòng sửa 2/3)
- [x] `/ra-soat` vòng 3 KHÔNG ĐẠT (C1–C4, C7 xanh oan với id sai: bảng trống id = 1 = rowsAffected) → sửa bài thử
      (efcce93, vòng sửa 3/3 — vòng cuối). Còn `/ra-soat` vòng 4; KHÔNG ĐẠT nữa thì ghi Câu hỏi và dừng.
- [x] `/ra-soat` vòng 4 **ĐẠT** (dựng lại M-d + 4 đột biến khác). Sửa 2 chỗ tài liệu cũ (bang_chung_do, 143 dòng). Bước 9–11 xong.

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
- M-d (soát vòng 3 dựng; `run()` trả `soDong(result.rowsAffected)` thay cho `lastInsertRowid`) — dựng như M-a, thay
  `soDong(result.lastInsertRowid),` bằng `soDong(result.rowsAffected),` ở dòng 1355. Trước efcce93: `8 đạt · 0 hỏng` (XANH
  OAN). Sau efcce93 (đẩy `sqlite_sequence` mỗi bảng lên 100·i): ✗ C1 C2 C3 C4 C7 — `3 đạt · 5 hỏng` (vd "refund_id 1 · kho 101").
- Chạy lại với bài sau efcce93 (02.10.2026): gốc 604bcd5 ✗ C1–C5 `3 đạt · 5 hỏng`; M-a ✗ C1–C4; M-b ✗ đúng C5; HEAD `8 đạt · 0 hỏng`.

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
(`.tu_chay_nhat_ky.jsonl` 08:19–09:25). Soát vòng 1 KHÔNG ĐẠT (A5 chưa ghi). `thu_P26a.js` 143 dòng (sau efcce93) / ngân sách ~90
(vượt 1,59× > ngưỡng 1,5). Agent soát đè bản đột biến của phiên chính.

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
- **KHOÁ** — LÀM LUÔN trong Phạm vi (efcce93): `thu_P26a.js` đẩy `sqlite_sequence` 6 bảng → id ≠ 1 ≠ rowsAffected. Ca đỏ:
  M-d (`rowsAffected` thay `lastInsertRowid`) — trước 8/0 xanh oan, sau ✗ C1–C4, C7.
- **NGUYÊN TẮC** (đề xuất, KHUON_LOI.md đã 118/120 — không thêm dòng, gộp vào K3 ở việc dọn sau): phép "id trả về ===
  id trong kho" phải chạy trên bảng có sẵn dòng (id ≠ 1 = rowsAffected). Đã gây: C1–C4, C7 xanh oan qua 2 vòng soát.
- **KHOÁ** (ngoài Phạm vi bài này — đề xuất việc sau): KB12 đẩy `sqlite_sequence` của `pos_refund_requests` (hoặc tạo
  yêu cầu mồi) để `refund_id` ≠ 1; ca đỏ: M-d (`rowsAffected`) hôm nay chỉ làm giả lập đỏ ở KB9, KB12 vẫn xanh (soát vòng 4).
  Kèm: `thu_P26a.js:84` đổi INSERT `sqlite_sequence` thành UPSERT nếu sau này `initDatabase` gieo sẵn dòng (chưa xảy ra).
- **NGUYÊN TẮC** (đề xuất, gộp vào K4 ở việc dọn — KHUON_LOI.md 118/120): sửa bài thử thì chạy lại và cập nhật
  `bang_chung_do.txt` + số đo (số dòng, tỉ lệ ngân sách) trong cùng commit. Đã gây: soát vòng 4 bắt "kho 1" và "140 dòng" cũ.
- **BỎ**: vượt ngân sách `thu_P26a.js` — phiếu tính ~90 cho 4 route, bài cần thêm C5 + 3 ca K5 (C7–C9) và cờ `--may-chu`;
  một lần, không thành luật. Các lệnh bị người gác chặn: luật đúng, đã làm theo hướng dẫn, không lặp.
- Dọn: không thấy lời dặn nào trong KHUON_LOI.md / CLAUDE.md đã có phép kiểm làm thay do việc này. KHUON_LOI.md 118/120 dòng (sau dòng K3 vòng 2).

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
BÀI THỬ:     chạy trên bản chưa vá → ĐỎ: thu_P26a C1–C4 (HTTP 500 BigInt), C5 (bigint) — 3 đạt · 5 hỏng
             (bảng có id mồi từ efcce93 → đột biến trả sai id cũng đỏ, xem M-d);
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
GIT:         git log --oneline -2 ngay trước commit ghi file này (commit đó là "P26a: trang thai - ra-soat vong 3 …"):
             efcce93 P26a: thu_P26a day id moi bang len (sqlite_sequence) - 'dung dong' phan biet duoc voi rowsAffected
             6ebfd5c P26a: trang thai - ra-soat vong 2, sua phat hien I1, cau hoi C4, muc GIT
             Đối chiếu đầu nhánh thật: git log --oneline -1 origin/viec/P26a; git log origin/viec/P26a..HEAD phải rỗng.
BÀI HỌC:     KHOÁ 5 · NGUYÊN TẮC 5 · BỎ 1 — chi tiết ở ## Bài học
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

## /ra-soat vòng 3 — báo cáo nguyên văn

```
KHÔNG ĐẠT

Bản vá trong `server/database.js` đúng, các lỗi vòng 1 và vòng 2 đã xử lý đúng. Lý do không đạt: bài thử mới `thu_P26a.js` chỉ kiểm đúng một nửa nghiệm thu A1. Nó bắt được id kiểu BigInt, nhưng KHÔNG bắt được trường hợp id trả về là SAI DÒNG ở C1–C4 và C7. Tôi đã dựng đột biến chứng minh.

LỖI TÌM ĐƯỢC:
- cong_cu/thu_P26a.js:87-105 (C1–C4) và :116-118 (C7) — K3, xanh oan.
  - Mỗi ca chạy trên bảng TRỐNG, nên dòng vừa ghi luôn có id = 1. Lỗi này hiện rõ trong chính kết quả chạy trên bản gốc: "refund_id undefined · kho 1", "kho 1" ở cả C1–C4.
  - Số dòng bị ảnh hưởng (`rowsAffected`) cũng bằng 1. Vậy phép "c.id === id trong kho" không phân biệt được "đúng dòng vừa ghi" với "một số 1 bất kỳ".
  - Đột biến tôi đã chạy: bản sao server ở `scratchpad/rv3_y/mc`, `diff` lệch HEAD đúng 1 dòng, database.js:1355 đổi thành `lastInsertRowid: soDong(result.rowsAffected)`. Kết quả: `node cong_cu/thu_P26a.js --may-chu …/rv3_y/mc` → "8 đạt · 0 hỏng", thoát 0.
  - Nghĩa là bản nhanh (pre-commit) vẫn xanh với một bản vá trả sai id cho MỌI lệnh INSERT qua `run()`. Chỉ giả lập ở `--day-du` bắt được: "✗ KB9 … delivered_qty", "KHÔNG ĐẠT (2 lệch)".
  - Phiếu A1 đòi "đúng bằng id của dòng vừa ghi trong kho", tên ca cũng ghi "đúng dòng trong kho", nhưng phần đó chưa được kiểm thật. Nó còn vi phạm luật K3 "mỗi phép chặn một ca chỉ vi phạm đúng phép đó": vế "id đúng dòng" của C1–C4 không bao giờ đỏ riêng được.
  - C5 không dính lỗi này, vì id ở đó là 61.
  - Cách sửa: chèn sẵn 1–2 dòng mồi vào mỗi bảng trước khi gọi route, để id ≠ 1. Sửa xong thì chạy lại đột biến trên, phải ĐỎ ở C1–C4.
- viec/P26a/trang_thai.md:199-201 (mục GIT) — K7. Dòng này được ghi trong commit 6ebfd5c và nói "trước commit chứa chính dòng này", nhưng lại liệt kê 47c531c và dd3520a. Thực tế commit ngay trước 6ebfd5c là 57d5449, trước nữa là c65e451. Đây vẫn là trạng thái cũ ba commit, không phải kết quả `git log --oneline -2` khớp với nhánh lúc giao.
- viec/P26a/trang_thai.md:170 ghi "KHUON_LOI.md 117/120 dòng"; thực tế `wc -l` = 118, và chính dòng 278 cũng ghi 118. Dòng 14-20 (Tiến độ) dừng ở vòng 1, chưa có vòng 2. K4: sửa tài liệu một chỗ, sót chỗ cùng nghĩa.

Kiểm việc xử lý vòng 2:
- (1) Đúng. trang_thai.md:60-64 và ke_hoach.md:121-122 giờ ghi đúng là KB12 KHÔNG phủ nhánh I1-refunded. Tôi đã đọc bat_bien.js:20-32: WHERE ở dòng 28 chỉ lấy đơn có mã bill đã dùng. Grep "phủ|I1" trong ke_hoach.md và trang_thai.md không còn câu nào nói KB12 phủ I1. Vế "KB12 … sẽ phủ" vẫn còn ở bat_bien.js:21, nhưng file này ngoài Phạm vi và đã ghi Phát hiện.
- (2) Mục GIT nay đã có kết quả lệnh nhưng đã cũ (xem trên).
- (3) Đã có `## Câu hỏi` (trang_thai.md:68-72) về chuyện C4 mâu thuẫn với luật K5 mới, máy không tự đổi. Chấp nhận được.

Sáu mục soát:
1. K3:
   - Bản gốc (`scratchpad/rv3_x/goc` = server HEAD + `git show 604bcd5^:server/database.js`, diff đúng 3 chỗ của bản vá): `thu_P26a` 3 đạt · 5 hỏng (C1–C4 "HTTP 500 · Do not know how to serialize a BigInt", C5 "bigint 61"), thoát 1.
   - HEAD: 8 đạt · 0 hỏng, thoát 0.
   - Bài kiểm hành vi (status, `typeof`, id trong kho), không soi marker, nên marker suông không làm nó xanh được.
   - Lỗ: vế "đúng id" không phân biệt được (lỗi số 1 ở trên).
2. K4: `grep -n lastInsertRowid server/database.js` → chỉ :1355 và :1382 phát ra giá trị, cả hai đã vá.
   - Grep cả server → 17 chỗ ở routes, chỉ tiêu thụ, không phát ra.
   - `query()` (:1313-1325) chỉ trả rows, không trả lastInsertRowid.
   - `getDb` chỉ có ở database.js:1285 và :1391.
   - Grep `BigInt|bigint` → chỉ ra chú thích. Không sót chỗ nào.
3. K5: `soDong` (database.js:1339) chỉ đổi kiểu và giữ null/undefined, không chặn luồng nào.
   - Route đã tự bọc `Number()` vẫn xanh: rewards.js:49 (C7), loyalty.js:202 qua tx.run (C8), orders.js:868 và 1022 (giả lập ĐẠT).
   - `npm test`: PASS 57 · FAIL 0. `--day-du`: PASS 61 · FAIL 0, có giả lập 12 kịch bản và thu_gia_lap 26,2 s, thoát 0.
   - Không thấy luồng nào bị chặn oan.
4. K1: ngoài các lệch ở trên, các số dòng đã đối chiếu đều khớp code: database.js:1338-1339/1355/1382, kiem_tra_truoc_khi_giao.js:488/715, thu_gia_lap.js:31, KB12 ở kich_ban.js:169-178, bat_bien.js:21/28/31.
5. Đường tiền: diff không đổi logic tiền. KB12 và thu_P20 dùng `refund_id` server trả về. Các lỗ có từ trước (hoàn ví hai lần; `/packages/buy` không quyền, không thu tiền) đã ghi Phát hiện, ngoài Phạm vi.
6. P1: diff không đụng `client/`. `--day-du` báo "dist đã commit KHỚP với src hiện tại".

NGHI NGỜ:
- ke_hoach.md:81 nói "I4 tự kiểm sổ ví" cho KB12. Theo luật K3 mới, khẳng định về độ phủ cần đột biến kèm theo. Tôi không dựng đột biến cho câu này. Lỗi chính của KB12 đã có `c.mong` ví +30.000 kiểm trực tiếp, nên rủi ro thấp.
- Không thấy mục GIT nào ghi `git log origin/viec/P26a..HEAD`. Tôi đã tự chạy cả hai chiều, đều rỗng, tức nhánh đã đẩy khớp HEAD 6ebfd5c (theo ref origin cục bộ, chưa fetch).

CHƯA SOÁT ĐƯỢC:
- Turso production (hrana): chưa biết `lastInsertRowid` ở đó có kiểu gì.
- thu_P20 trên bản gốc và trên đột biến `rowsAffected`: thu_P20 không có cờ `--may-chu`, nên không chạy được.
- Màn hình thật trên trình duyệt.

BÀI HỌC:
- NGUYÊN TẮC (K3): bài thử so "id trả về === id trong kho" phải chạy trên bảng đã có dòng mồi, để id ≠ 1 = rowsAffected. Đột biến bắt buộc phải có: trả `rowsAffected` thay cho `lastInsertRowid`.
- KHOÁ (đề xuất): thêm đột biến M-d (`soDong(result.rowsAffected)` ở `run()`) vào bộ đột biến A5. M-d phải làm thu_P26a ĐỎ ngay trong bản nhanh, không chỉ trong `--day-du`.

Thư mục nháp đã dùng: `scratchpad/rv3_x`, `scratchpad/rv3_y`, `scratchpad/rv3_npmtest.txt`, `scratchpad/rv3_daydu.txt`. Tôi không sửa file nào trong kho và không commit.
```

Xử lý vòng 3 (vòng sửa 3/3, cuối): `thu_P26a.js` đặt `sqlite_sequence` cho 6 bảng (pos_refund_requests 100, pos_discount_codes
200, pos_invoice_logs 300, pos_customer_packages 400, pos_reward_catalog 500, pos_voucher_grants 600) → id khác 1, khác nhau
giữa bảng. Đã tự chạy M-d trên `rv3_y/mc` (diff đúng 1 dòng): trước 8/0, sau ✗ C1–C4, C7. M-d ghi vào mục Đột biến A5. Mục
GIT, số dòng KHUON_LOI, Tiến độ đã sửa. Nghi ngờ "I4 tự kiểm sổ ví" (ke_hoach.md:81): không dựng đột biến — KB12 tự kiểm ví
+30.000 bằng `c.mong`; câu ở kế hoạch là dự kiến, không phải khẳng định đã kiểm.

## /ra-soat vòng 4 — báo cáo nguyên văn

```
ĐẠT

Kết luận: cách xử lý lỗi vòng 3 đúng. Tôi đã dựng lại đột biến M-d và thêm 4 đột biến khác. Phần code của nhánh đúng, đủ nghiệm thu A1–A7. Còn 2 chỗ tài liệu cũ nhỏ, không làm sai kết luận nào. Thư mục nháp đã dùng: `scratchpad/rv4_a` (goc, md, mdtx, mnull), `scratchpad/rv4_b` (thu_P20 trên M-d), `scratchpad/rv4_c` (ma, mb), `scratchpad/rv4_daydu.txt`. Không sửa file nào trong kho, không commit.

LỖI TÌM ĐƯỢC (nhỏ, không chặn):
- `viec/P26a/bang_chung_do.txt:5-8` — đây là bằng chứng đỏ in từ bài thử bản trước efcce93, nên ghi "kho 1". Bài hiện tại chạy trên gốc in "kho 101 / 201 / 301 / 401" (tôi chạy lại: 3 đạt · 5 hỏng, cùng các ca C1–C5). Kết luận đỏ vẫn đúng, chỉ chi tiết đã cũ. Dòng 48 của trang_thai.md đã ghi kết quả chạy lại. Khuôn K4 (sửa bài thử, sót tài liệu cùng nghĩa).
- `viec/P26a/trang_thai.md:157` — ghi "`thu_P26a.js` 140 dòng … 1,55×". Sau efcce93, `wc -l` cho 143 dòng, tức khoảng 1,59×. Vẫn vượt ngưỡng 1,5 như đã ghi, nên kết luận BỎ không đổi. Khuôn K4/K7.

Sáu mục soát:

1. K3 — bài thử có giá trị.
   - Cách dựng: `thu_P26a.js:82-84` đặt `sqlite_sequence` cho 6 bảng. Cả 6 đều là AUTOINCREMENT, đã xem `database.js:370, 390, 450, 540, 613, 842`. Riêng C5 dùng rowid của `pos_settings` (bảng có sẵn 60 dòng, `database.js:527`).
   - Các lần chạy:

| Bản | Kết quả | Ca đỏ |
|---|---|---|
| HEAD | 8 đạt · 0 hỏng, thoát 0 | — |
| Gốc (`database.js` của 604bcd5^) | 3 đạt · 5 hỏng | C1–C4 (500 BigInt), C5 (`bigint 61`) |
| M-a (bỏ `soDong` ở `run()` thường) | 4 đạt · 4 hỏng | C1–C4 |
| M-b (bỏ ở `tx.run`) | 7 đạt · 1 hỏng | đúng C5 |
| M-d (`soDong(result.rowsAffected)` ở :1355) | 3 đạt · 5 hỏng | C1–C4, C7 ("id 1 · kho 101 / 201 / 301 / 401 / 501") — **khớp trang_thai.md:45-47** |
| M-dtx (mới: `rowsAffected` ở `tx.run` :1382) | 6 đạt · 2 hỏng | C5 ("number 1 · kho 61"), C8 ("grant_id 1 · kho 601") |

   - Mỗi bản đột biến tôi đã `diff`: lệch HEAD đúng 1 dòng.
   - Bài kiểm hành vi (status, kiểu, id khớp kho), không soi marker, nên marker suông không làm nó xanh được.
   - Thêm: `thu_P20` chạy trên bản sao có server M-d → 48 đạt · 3 hỏng ("hoàn tiền 2: duyệt → 400 Yêu cầu này đã được xử lý").

2. K4 — `grep lastInsertRowid` toàn kho (trừ attached_assets, node_modules, dist) ra 17 chỗ trong routes.
   - Chỗ phát ra giá trị chỉ có `database.js:1355` và `:1382`, cả hai đã dùng `soDong`.
   - `process.env` trong database.js: 0 chỗ. Vì vậy chặn ketNoiKho (`thu_P26a.js:27-36`) là đủ, bài thử không chạm Turso khi pre-commit chạy với env thật.
   - `customers.js:372→413` chỉ dùng id làm tham số SQL.
   - Không sót chỗ nào trong phạm vi.

3. K5 — `soDong` (`database.js:1339`) chỉ đổi kiểu, không thêm phép chặn nào.
   - Các luồng: route đã bọc `Number()` (rewards:49, loyalty:175/202, orders:868/1022); id dùng làm tham số SQL (refunds:216, users:61, packages:47, registrations:244, customers:372/632); UPDATE/DELETE.
   - `--day-du` trên HEAD: PASS 61 · FAIL 0, thoát 0; giả lập ≥12 kịch bản; thu_P26a chạy 0,7 s.
   - Không thấy luồng nào bị chặn oan.

4. K1 — đối chiếu khớp:
   - Số dòng: `database.js` 1338-1339/1355/1382; `kiem_tra_truoc_khi_giao.js` 488/715; KHUON_LOI.md 118 dòng.
   - Mục GIT (`trang_thai.md:211-213`): efcce93 và 6ebfd5c đúng là hai cha liền trước 8be601d.
   - `git log origin/viec/P26a..HEAD` rỗng; origin ở 8be601d.
   - Chỉ có 2 chỗ cũ đã nêu ở trên.

5. Đường tiền — diff không đổi logic tiền nào.
   - `/packages/buy` (`packages.js:169-178`) vẫn không kiểm quyền, không thu tiền, tin `total_qty` client gửi. Lỗi có từ trước và đã ghi Phát hiện / Câu hỏi.
   - Trước P26a route này cũng đã ghi dòng (rồi mới 500), nên P26a không mở thêm lỗ.
   - Lỗ hoàn ví hai lần vẫn mở; ngoài phạm vi, đã ghi.

6. P1 — diff không đụng `client/`. `--day-du` báo "dist đã commit KHỚP với src hiện tại".

NGHI NGỜ:
- KB12 (`kich_ban.js:170-178`) không phân biệt được M-d. Trong giả lập, `pos_refund_requests` còn trống, nên id 1 trùng với dòng đúng.
  - Tôi chạy `gia_lap/chay.js --may-chu rv4_a/md` → chỉ đỏ KB9 (delivered_qty), KB12 xanh.
  - Phiếu A3 không đòi KB12 kiểm id đúng dòng, và M-d đã bị thu_P26a cùng thu_P20 bắt. Đây là điểm yếu, không phải thiếu nghiệm thu.
- `thu_P26a.js:84` dùng `INSERT INTO sqlite_sequence` chứ không UPSERT. Nếu sau này `initDatabase` gieo sẵn dòng vào một trong 6 bảng, sẽ có 2 dòng `sqlite_sequence` cho cùng bảng, và hành vi khi đó chưa kiểm. Hôm nay cả 6 bảng đều trống: id ra 101, 201, … đúng như dự kiến.

CHƯA SOÁT ĐƯỢC:
- Turso production (hrana): chưa biết `lastInsertRowid` ở đó kiểu gì.
- Nhánh giữ null/undefined của `soDong`. Đột biến mnull (`soDong = v => Number(v)`) cho 8 đạt · 0 hỏng, nên không phân biệt được. Trang_thai đã ghi CHƯA KIỂM, khớp.
- `thu_P20` trên bản gốc: không có cờ `--may-chu`, tôi chỉ chạy được trên M-d qua cây bản sao.
- Màn hình thật trên trình duyệt.

BÀI HỌC:
- NGUYÊN TẮC (K4 của luật vòng 3): đã đặt dòng mồi cho bài thử chính thì phải rà cả những bài khác dùng id server trả về trên bảng trống (KB12 trong giả lập). Ca đỏ: M-d làm KB12 vẫn xanh.
- NGUYÊN TẮC (K4 tài liệu): sửa bài thử thì chạy lại và cập nhật luôn `bang_chung_do.txt` cùng các số đo (số dòng, tỉ lệ ngân sách) trong cùng commit.
```

Xử lý vòng 4: `bang_chung_do.txt` thêm khối chạy lại bài sau efcce93 trên gốc (giữ khối cũ làm lịch sử); số dòng
`thu_P26a.js` sửa 140 → 143 (1,59×). Hai NGHI NGỜ (KB12 không bắt M-d; INSERT sqlite_sequence không UPSERT) ghi vào Bài học
làm đề xuất cho việc sau — không sửa: hết vòng sửa, và phiếu A3 không đòi KB12 kiểm id đúng dòng.
