# DOI-SOAT-1 — trạng thái

## Bước 1 · đối chiếu bản chụp (18.10.2026)

- Nhánh: `viec/DOI-SOAT-1`. Cây sạch (không dòng nào ngoài `??`).
- `git fetch origin viec/DOI-SOAT-1`: HEAD = FETCH_HEAD = `2123b69` → không kéo.
- `git log --oneline -3`:
  ```
  2123b69 PHIEU: DOI-SOAT-1
  0bffc03 TIEN-DO: LUOI-5 (c8c20b3), TU-CHAY-8 (8259a59) xong; mo KH-API-1 + P26d + DOI-SOAT-1 + P16; them KH-OTP-1, DONG-CUNG-1; lich KH-OTP-1 — so v37
  8259a59 Merge pull request #33 from pos-tuquyduong/viec/TU-CHAY-8
  ```
- Kho NÔNG (`git rev-parse --is-shallow-repository` = true): commit của bản vá trong sổ (`9a68ab6`, `28638d0`, `c3d5816`…) không có → không đối chiếu được ngày gộp bằng git.

## Bước 2–3 · kế hoạch

- `ke_hoach.md` bản 1 (`a6a488d`) viết từ code thật: `bat_bien.js`, `reports.js`, `orders.js:1237–1320`, `database.js`, `helpers.js`, `signup-codes.js`, `thu_P26c.js`, `kiem_tra_truoc_khi_giao.js`.
- **Soát độc lập bằng agent phụ chỉ đọc** (4 câu của skill). Đã sửa thành **bản 2**:
  - sai của tôi: bản 1 ghi "phiếu cho sửa một dòng ở `kiem_tra`" — phiếu chỉ cho THÊM một dòng gọi bài, không cho sửa `:886`;
  - mâu thuẫn B/C: "toàn sổ" vừa không có ngày vừa có `AP_DUNG_TU` → chia 3 lớp (có khoá / toàn sổ có khoá / gộp không khoá → đỏ luôn);
  - `ctx.thuc` ở I9 bỏ sót `bat_bien.js:160` (`ctx.soQuay` undefined sẽ ném `TypeError`);
  - khoá→ngày: bảng riêng từng bất biến (không một regex chung — "mã" mang 3 nghĩa, "đơn mua gói/thẻ CODE" bắt nhầm; đơn đã xoá ở I9/I11 lấy ngày từ sổ ví / nhật ký);
  - H: chi phí không "tuyến tính" mà gần N × M (cột `order_id` không chỉ mục); ca H1 phải dựng điểm / ví / mã bill; bỏ ý cache vào `pos_doi_soat_ghi`;
  - D1: đếm cả hai cột như phiếu (không lọc theo cài đặt hiện tại); thêm ca `diem_nhan_phone` đỏ;
  - ca thiếu: B0 (XANH ba kỳ trên luồng thật), A2b (tiêm bất biến giả có UPDATE — đột biến bỏ chặn ghi mới bị bắt), băm nội dung thay đếm hàng, B5 mở rộng I2/I4/I13/I18, E3b/E4/F2/F3/G5, D2d, đột biến cho D1/F;
  - "đỏ oan đã biết" (so với cài đặt/danh mục HIỆN TẠI: I8, I12, I13; I14 tính đơn `refunded`) → thêm Câu hỏi 4;
  - số dòng lệch nhẹ đã sửa (I8 `:120–152`, `pay-debt` `:1305–1310`).
  - Điều tôi KHÔNG nhận từ agent soát: trích câu SUM thành hàm dùng chung cho `/daily` (sửa đường số tiền đang chạy thật) → giữ ca đối chứng E7; ghi lại ở `ke_hoach.md` 1.5 để chủ quán quyết.
- Phiếu dặn **"Chờ duyệt kế hoạch"** → commit, push, DỪNG ở bước 3. Chưa viết bài thử, chưa sửa code.

## Câu hỏi

Chi tiết và lập luận ở `ke_hoach.md` mục 9. Cần chủ quán trả lời trước khi làm:

1. **Tiền mặt theo sổ của ngày** (nghiệm thu E): (A) đúng con số báo cáo hiện có (`reports.js:34`: tiền mặt đơn completed theo ngày TẠO đơn) hay (B) cộng nạp ví tiền mặt (`wallets.js:123–136`) + thu nợ tiền mặt theo ngày thu (`orders.js:1305–1320` hiện cộng vào đơn gốc)? Số két đếm có gồm tiền để lại từ hôm trước không?
2. **Ngày áp dụng** (nghiệm thu C): bảng `ke_hoach.md` 1.3 đúng chưa; quy ước "ngày gộp + 1"; `I3, I6, I12, I15, I16` chưa có nguồn; ai chạy bất biến trên BẢN SAO dữ liệu thật (máy mây không có Turso).
3. **Vị trí lõi bất biến** (nghiệm thu A): chuyển sang `server/utils/batBien.js` làm hỏng 31 neo (11 file `viec/**/*.py`, ngoài Phạm vi); phiếu cũng không cho sửa `kiem_tra_truoc_khi_giao.js:886`. Kế hoạch chọn: để nguyên file, `doiSoat.js` nạp thẳng `cong_cu/gia_lap/bat_bien.js`. Duyệt, hay mở việc riêng để chuyển?
4. **Rút gọn / bỏ + đỏ oan đã biết**: I7 bỏ; I9, I13, I14 rút gọn; các dòng so với cài đặt hiện tại (I8, I12, I13, I14) hiện ĐỎ kèm nhãn "có thể oan"? Hay thêm nhóm "cần xem" (phiếu chỉ có đỏ / vàng)?
5. **D2**: giữ `điểm = floor(total / per)` như `I8`, hay "tiền thực trả" = `total − nợ`?
6. Chênh két `≠ 0` → ĐỎ ngay, không ngưỡng (đúng phiếu) — chắc chưa?
7. Ngân sách ~400 dòng code vượt ~300 của phiếu ~30 % — cắt (`ke_hoach.md` mục 7) hay chấp nhận?
8. Nếu đo thấy chậm: cho thêm index vào bảng cũ trong `database.js` (ngoài "chỉ thêm bảng" của phiếu)?

## Trả lời của chủ quán (18.10) → đã duyệt kế hoạch, làm tiếp

Cả 8 câu đã được trả lời; nguyên văn và thiết kế chốt ở **`quyet_dinh.md`** (file đó thắng `ke_hoach.md` khi khác nhau). Tóm tắt: 1 = B (tiền mặt thật vào két: bán + nạp ví + thu nợ theo ngày thu − trả ra; két nhập "đếm cuối ngày" + "để lại cho mai"); 2 đồng ý bảng, ngày gộp kiểm bằng git log đầy đủ — **kho nông → ghi CHƯA KIỂM**, chat soát kiểm lúc duyệt PR; 3 nạp thẳng `bat_bien.js`; 4 dòng "có thể oan" → nhóm CẦN XEM (vàng); 5 giữ `floor(total/per)`; 6 đỏ khi ≠ 0; 7 chấp nhận ~400 dòng; 8 index chỉ khi đo chậm, `CREATE INDEX IF NOT EXISTS` ở khối của việc này cuối `createTables`. Thứ tự gộp: P16 trước, việc này sau.

Điều tôi suy từ code và đưa vào thiết kế (CHƯA KIỂM với quầy thật, chủ quán xác nhận ở lần chạy thật đầu): "tiền mặt trả ra" = tiền mặt/CK của đơn **huỷ** không có dòng gói — vì huỷ đơn chỉ hoàn VÍ phần trả bằng ví (`orders.js:1364–1372`), phần tiền mặt không được ghi vào đâu; đơn mua gói hoàn tiền mặt vào VÍ nên két không ra; đơn `refunded` chỉ hoàn ví nên két không ra. Dòng gói là `product_id = −pkg.id` (`orders.js:421`).

## Bước 4–6 · bài thử, code, kiểm (18.10)

- **Bài thử** `cong_cu/thu_DOISOAT1.js` (khuôn `thu_P26c.js`, route thật + kho tạm + đồng hồ giả). Trên gốc `2123b69`: **28 đạt · 78 hỏng** (ĐỎ ở mọi ca của màn Đối soát vì chưa có route / hàm / bảng); sau vá: **105 đạt · 0 hỏng**. `bang_chung_do.txt` có dòng `SỐ CA cong_cu/thu_DOISOAT1.js: 105`.
- **Code**: `server/utils/doiSoat.js` (mới) · `server/routes/reports.js` (GET `/doi-soat`, POST `/doi-soat/ghi`) · `server/database.js` (bảng `pos_doi_soat_ghi` ở cuối `createTables`) · `cong_cu/gia_lap/bat_bien.js` (nhánh `ctx.thuc` ở I9 / I13 / I14, giả lập không đổi) · `client/src/components/DoiSoat.jsx` (mới) + `Reports.jsx` (tab) + `client/dist` đã build · `kiem_tra_truoc_khi_giao.js` (1 dòng gọi bài).
- **Giả lập không đổi**: `Giả lập: 32 kịch bản · 18 bất biến · ĐẠT` trước và sau; `thu_gia_lap.js` xanh (55,6 s) sau khi `doiSoat.js` đổi sang nạp `bat_bien.js` LƯỜI (lần đầu nạp sớm làm 13 bản sao đột biến của `thu_gia_lap.js` — chỉ chép `server/` — sập: bắt được nhờ `--day-du`, ca A6 + đột biến `VS-DS-NAP-SOM` khoá lại).
- **Neo đột biến cũ**: 5 chỗ sửa trong `bat_bien.js` (I9 ×3, I13 ×2, I14 ×2 dòng) vẫn chứa nguyên các chuỗi neo của `viec/LUOI-1/dot_bien.py` (`so(r.used_count) !== so(r.so_don) + tay`, `so(g.delivered_qty) !== so(g.da_lay) + tay`, `(so(r.usage_limit) > 0 && so(r.used_count) > so(r.usage_limit))`…) — kiểm bằng grep, mỗi chuỗi khớp 1 lần. `viec/AUDIT-2/kiem_neo.py` sập từ trước vì kho nông (`git show 9521cec` — không có commit đó), `viec/HOC-2b/kiem_neo.py` có 4 neo HỎNG đều ở file KHÁC (`refunds.js`, `kiem_tra_truoc_khi_giao.js`, `tu_chay/PHIEN_BAN`) — không do việc này. `viec/AUDIT-2/bb_neo.json` (ảnh dòng tự sinh từ `bat_bien.js`) sẽ lệch số dòng: CHƯA KIỂM.

### Bảng "chỗ vá → đột biến" (27 đột biến, `viec/DOI-SOAT-1/dot_bien.py`, BẮT 27 · SỐNG 0 · HỎNG 0 · LẠC 0)

| chỗ vá | đột biến (nguyên tên) | ca bắt |
|---|---|---|
| danh sách bất biến chạy | `BV-DS-BO-BAT-BIEN` | A1, C4 I6 |
| q chỉ đọc | `BV-DS-GHI-DUOC` | A2b |
| nạp bat_bien.js lười | `VS-DS-NAP-SOM` | A6 |
| lọc dòng lệch theo kỳ | `BV-DS-BO-LOC-KY` · `VS-DS-LOP2-LOC-KY` | B1b · C4b |
| "hôm nay" / tuần giờ VN | `VS-DS-GIO-UTC` · `VS-DS-TUAN-CN` | B4 · B2 |
| nhóm LỆCH CŨ | `BV-DS-BO-AP-DUNG-TU` · `VS-DS-AP-DUNG-NGUOC` · `VS-DS-AN-KHONG-RO-NGAY` | C1 · C2 · C5 |
| D1 SĐT nhận ≥ 2 lần | `BV-DS-D1-BO-DIEM-NHAN` · `VS-DS-D1-VANG-NGUOC` | D1c · D1c/D1d |
| tiền mặt vào két (bán / thu nợ / nạp ví / trả ra) | `VS-DS-BAN-KHONG-TRU-THU` · `VS-DS-THU-THEO-NGAY-TAO` · `VS-DS-RA-CA-GOI` · `BV-DS-BO-NAP-VI` | E0c/F3 · E0 · E0 · E0 |
| ghi két / sao kê | `VS-DS-GHI-DE` · `BV-DS-BO-KIEM-SO-TIEN` · `BV-DS-F-BO-DA-SO` · `VS-DS-F-THANG-NHOM` | E4 · E5 · F2 · F3 |
| quyền view_reports | `BV-DS-BO-QUYEN-GET` · `BV-DS-BO-QUYEN-POST` | G1 · G1b |
| bản rút gọn ctx.thuc | `BV-DS-THUC-I13` · `VS-DS-THUC-I13-BANG` · `VS-DS-THUC-I14-BANG` · `VS-DS-THUC-I9-QUAY-RONG` · `BV-DS-THUC-I9-DOI` | B0 |

Bài học ngay trong lúc làm (đầu vào cho bước 11): (1) lần chạy đột biến đầu BẮT 22 / SỐNG 2 / LẠC 2 — hai SỐNG vì ca B0 chỉ đòi "XANH" mà dòng CẦN XEM (vàng) lọt; hai LẠC vì bài sập khi hàm ném lỗi (K3); (2) `doiSoat.js` nạp sớm làm sập bản sao đột biến của giả lập (K4 — phép nạp ở đầu file chạy cả ở bản sao chỉ chép `server/`).

## Câu hỏi 9 (MỚI — chặn bước 6, ngoài Phạm vi)

Bảng mới `pos_doi_soat_ghi` làm đỏ phép **E8** của bộ kiểm: `✗ mọi bảng đều được sao lưu (31 bảng) → thiếu trong BACKUP_TABLES: pos_doi_soat_ghi` (`kiem_tra_truoc_khi_giao.js:388–398`; `database.js:802` cũng dặn "bảng mới nào cũng phải vào BACKUP_TABLES"). `BACKUP_TABLES` nằm ở **`server/routes/backup.js:41`** — file đó **không** có trong Phạm vi và phiếu ghi P26d đang sửa nó song song. Không sửa phép kiểm (K8). Đề xuất đúng MỘT dòng, đặt sau `pos_order_log` (`backup.js:86`, bảng này không có khoá ngoại nên thứ tự không ảnh hưởng restore):

```
  { name: 'pos_doi_soat_ghi', label: 'Sổ đối soát (két, sao kê)', key: 'id' },
```

Xin chủ quán cho phép thêm dòng này vào `server/routes/backup.js` (nằm trong việc này, hoặc để P26d / chat gộp lúc duyệt PR). Mọi phần còn lại đã xong: `npm test --day-du` chỉ còn đúng phép E8 này đỏ (PASS 70 · FAIL 1).

## Phiên 19.10 · làm tiếp sau câu 9

- Bước 1: nhánh `viec/DOI-SOAT-1`, cây sạch; `git fetch origin viec/DOI-SOAT-1`: HEAD = FETCH_HEAD = `1a797db` → không kéo.
  ```
  1a797db PHIEU: DOI-SOAT-1 cau 9 mo backup.js (mot dong BACKUP_TABLES sau pos_order_log)
  81b8c39 DOI-SOAT-1: bang chung do (SO CA 105), bang cho va -> dot bien, Cau hoi 9 (backup.js ngoai Pham vi)
  9540a3d DOI-SOAT-1: bai thu A6 — mau nap som
  ```
- Câu 9 đã trả lời (phiếu `1a797db` thêm `server/routes/backup.js` vào Phạm vi, đúng một dòng). Đã thêm
  `{ name: 'pos_doi_soat_ghi', label: 'Sổ đối soát (két, sao kê)', key: 'id' }` ngay sau dòng `pos_order_log` (`backup.js:87`), commit `72d0ccf`.
  Bảng có cột `id INTEGER PRIMARY KEY` (`database.js:911–912`) nên `key: 'id'` khớp.
- Bài thử của dòng này là phép **E8** sẵn có của bộ kiểm: ĐỎ trước (`✗ … thiếu trong BACKUP_TABLES: pos_doi_soat_ghi`, ghi ở Câu hỏi 9),
  XANH sau (`✓ mọi bảng đều được sao lưu (31 bảng)`). Không thêm đột biến cho dòng này: bộ đột biến chạy `thu_DOISOAT1.js`, còn khoá là E8 ở cổng.
- `npm test -- --day-du`: **PASS 71 · FAIL 0 · CẢNH BÁO 1** (cảnh báo `route GET có lệnh ghi` ở `packages.js:194, products.js:57, sync.js:147` — có từ trước,
  không file nào của việc này); `thu_DOISOAT1.js` xanh 2,9 s; giả lập `chay.js` xanh 33,6 s, `thu_gia_lap.js` xanh 48,4 s.

## Bước 8 · soát độc lập `/ra-soat` vòng 1 (19.10) — KHÔNG ĐẠT

Agent soát (general-purpose, chỉ đọc) soát `2123b69^..14311c3`. Báo cáo chép nguyên văn:

```
KHÔNG ĐẠT

Tôi đã đọc diff `2123b69^..HEAD` (bỏ `client/dist`), cả file `server/utils/doiSoat.js`, `DoiSoat.jsx`, đoạn đổi trong `bat_bien.js`, `reports.js`, `database.js`, `backup.js` và `kiem_tra`, cùng phiếu, quyết định, trạng thái, bằng chứng đỏ và `dot_bien.py`. Tôi đọc thêm các đường tiền liên quan (`orders.js` huỷ đơn và pay-debt, `tienDaTra.js`, `damages.js`, `don-mo-rong.js`, `wallets.js`).

Đã chạy hai lệnh:
- `node cong_cu/thu_DOISOAT1.js` trên HEAD: **105 đạt · 0 hỏng**.
- Cùng bài đó với `--may-chu` trỏ vào bản chép `server/` + `cong_cu/gia_lap/` của `2123b69` (lấy bằng `git archive`, đặt trong scratchpad): **28 đạt · 78 hỏng**. Kết quả khớp `bang_chung_do.txt`.

**LỖI TÌM ĐƯỢC:**

1. **`server/utils/doiSoat.js:164`, `:153`, `:158` — dòng lệch I19, I9, I14 lấy ngày tạo đơn/gói thay vì ngày xảy ra sự việc (khuôn K4, kéo theo K3).**
   - I19 là "khách nhận lại > đã trả" (`bat_bien.js:313–319`), tức hoàn hoặc đền xảy ra SAU lúc bán, nhưng được gán ngày theo `donMa` = `pos_orders.created_at`. I9 (thu nợ) và I14 (giao gói) cũng vậy.
   - Hệ quả 1: hôm nay đền hoặc thu thừa trên một đơn tạo từ tháng trước thì dòng lệch bị lọc khỏi kỳ ngày/tuần/tháng hiện tại (`doiSoat.js:199`). Nó chỉ hiện khi xem đúng kỳ cũ.
   - Hệ quả 2: nếu đơn tạo trước mốc áp dụng (`AP_DUNG_TU`, ví dụ I19 là 2026-10-14) thì lệch MỚI bị xếp vào "LỆCH CŨ", màu vàng, không làm kết quả đỏ.
   - Cùng file, I11 (`:154`, MAX ngày dòng ví) và I17 (`:162`, `processed_at`) lại dùng ngày sự việc, nên hai cách tính lệch nhau.
   - Ca B1b chỉ cấy lệch trên đơn có cùng ngày, nên không bắt được trường hợp này.

2. **`server/utils/doiSoat.js:58–61` — cổng "chỉ đọc" `chiDoc` để lọt lệnh ghi (khuôn K3).**
   - Regex `^(SELECT|WITH)\b` cho qua `WITH x AS (SELECT 1) UPDATE …`, mà SQLite chạy câu đó. Tôi đã thử bằng sqlite3: câu qua được regex và ghi thật (a: 1 → 99).
   - Chú thích ở `:57` ("bất biến lỡ viết câu ghi cũng không ghi được") vì thế sai.
   - A2 và A2b (`thu_DOISOAT1.js:227–233`) chỉ thử `UPDATE` trần. Đột biến `BV-DS-GHI-DUOC` chỉ xoá cả phép, không thử dạng WITH.

3. **`server/utils/doiSoat.js:208–209` — gán ngày cho từng dòng lệch gây N+1 câu SELECT chạy tuần tự (thiếu bằng chứng cho nghiệm thu H; ca H1 xanh oan, khuôn K3).**
   - Mỗi dòng lệch tốn một SELECT, tối đa `TRAN_PHAN_LOAI = 1000` dòng × 17 bất biến.
   - Việc gán ngày chạy trên MỌI dòng lệch của toàn sổ, trước khi lọc theo kỳ, nên cả kỳ ngày cũng trả đủ chi phí này.
   - H1 (`thu_DOISOAT1.js:486–512`) đo trên dữ liệu SẠCH (0 dòng lệch), nên không bao giờ đi qua đường này. Trong khi đó, dữ liệu thật được dự kiến có nhiều "LỆCH CŨ" — đó chính là lý do có nghiệm thu C. Trên Turso, vài trăm dòng × độ trễ mỗi câu là đã vượt 10 giây.
   - Cách gọn hơn: tra ngày theo lô (`IN (…)`) cho mỗi bất biến.

4. **`server/utils/doiSoat.js:101–102` — "trả ra" thiếu khoản đền tiền cho khách lẻ không SĐT (khuôn K4/K5: luồng hợp lệ bị đỏ oan).**
   - `damages.js:181–185` chỉ ghi vào ví khi đơn có `customer_phone`. Đơn không SĐT thì tiền đền chỉ nằm ở `pos_damage_logs.refund_amount`, tức tiền mặt đưa từ két.
   - Két đếm sẽ thấp hơn sổ, nên ĐỎ oan.
   - Đây là suy luận từ code, cùng mức chắc chắn với suy luận "huỷ đơn = trả tận tay" mà người làm đã ghi. Danh sách Phát hiện không nhắc tới khoản này.

5. **`server/utils/doiSoat.js:112` — "ví chi" chỉ cộng `balance_amount`, bỏ `parent_balance_amount` (tiền trả bằng ví mẹ) (khuôn K4).**
   - Đường song song đã có sẵn ở `orders.js:1365` (`hoanVi` cộng phần ví mẹ), nên tổng ví chi của màn Tháng bị thiếu.
   - F3 (`thu_DOISOAT1.js`) chốt "chi 0", nên không phủ trường hợp chi dương.

6. **`cong_cu/thu_DOISOAT1.js:238` — ca A5 là `k(…, true)` (khuôn K3).** Ca này luôn đạt nhưng vẫn được đếm vào "105 đạt" và `SỐ CA 105`. G5 (`:479`) chỉ là kiểm marker tĩnh, và nó cũng ĐẠT trên bản gốc.

7. **`viec/DOI-SOAT-1/trang_thai.md` — các câu dẫn chứng sai hoặc đã cũ (khuôn K1).**
   - `:28` ghi "giữ ca đối chứng E7", nhưng `thu_DOISOAT1.js` không có E7 (grep rỗng; quyết định 1 = B đã thay nó) và báo cáo không ghi là bỏ. E3b cũng biến mất mà không có lời nào.
   - Phần Phát hiện trích số dòng của gốc, không phải HEAD, dù đó là file đang sửa:
     - `Reports.jsx:11` → HEAD là `:12`
     - `reports.js:34, :127, :142` → HEAD là `:35, :128, :143`
     - `bat_bien.js:217` → HEAD là `:219`
   - Báo cáo không nói H1 chạy một cỡ N = 3000, trong khi kế hoạch hứa 2.000 / 20.000 / 100.000 (`ke_hoach.md:111`).

8. **`viec/DOI-SOAT-1/dot_bien.py:139` — `--help` không được xử lý.** Đối số này bị lọc vì bắt đầu bằng `--`, nên lệnh chạy TOÀN BỘ đối chứng + 27 đột biến. Lệnh mà phiếu soát cho phép thực ra là một lần chạy nặng.

9. **`client/src/components/DoiSoat.jsx:122` — trạng thái "chưa đếm két" / "chưa có mốc" không có màu vàng như phiếu E đòi.** Đây là lỗi giao diện nhỏ.

**NGHI NGỜ:**
- I4/I18 lấy ngày theo MAX ngày dòng ví (`doiSoat.js:139`). Một ví lệch từ trước bản vá sẽ thành ĐỎ ngay khi khách có giao dịch mới, trái ý "dữ liệu cũ không đỏ oan". Cần dữ liệu thật mới kết luận được.
- "Trả ra" xác định đơn gói bằng dòng hàng `product_id ∈ (−1000000, 0)`. Hàm `soTienHoan` thật (`tienDaTra.js:36`) lại xét `pos_customer_packages` theo `order_id`. Hai vị từ này lệch nhau khi đơn có dòng gói mà không có gói khách, ví dụ đơn gói không SĐT trước SO-LUONG-1, hoặc INSERT gói lỗi trong `try` ở `orders.js:1056`.
- `AP_DUNG_TU` để `null` cho I3, I6, I12, I15, I16, nên lệch cũ của các bất biến này luôn ĐỎ. Chủ quán đã đồng ý (quyết định 2), nhưng lần chạy thật đầu có thể đỏ hàng loạt.
- Cả quầy giờ phụ thuộc `cong_cu/gia_lap/bat_bien.js` lúc chạy (đã duyệt ở quyết định 3). Tôi không thấy file render hay ignore nào loại `cong_cu/` khỏi bản triển khai, nhưng chưa kiểm được trên Render.
- Màn có thể hiện "bán âm" khi đơn nợ được thu tiền mặt rồi đổi sang chuyển khoản trong cùng ngày. Số ròng vẫn đúng.

**ĐỐI CHIẾU 8 MỤC SOÁT:**
- **K3:** Bài thử ĐỎ thật trên gốc (78 hỏng, tôi đã chạy lại). Phần lớn ca kiểm hành vi qua route thật, không kiểm marker. Ngoại lệ là A5 (luôn đúng), G5 (marker) và H1 (không đi qua đường đắt).
- **K4:** Tôi tìm được 5 chỗ cùng khuôn chưa xử lý:
  - ngày sự việc của I9, I14, I19 (3 chỗ)
  - khoản đền cho khách không SĐT (1 chỗ)
  - tiền ví mẹ (1 chỗ)

  Cổng `chiDoc` chỉ có 1 chỗ và có lỗ như đã nêu.
- **K5:** Các luồng hợp lệ đi qua `kiemTraGhi` không bị chặn:
  - két ngày hôm nay hoặc ngày đã qua
  - số tiền 0 hoặc đúng trần
  - để lại bằng số đếm
  - sao kê ghi đúng thứ 2
  - quản lý hoặc chủ ghi

  Nhân viên bị 403 là đúng ý phiếu G. Luồng đỏ oan là đền tiền cho khách lẻ (lỗi 4).
- **Đường tiền:** Không có trường tiền nào lấy từ client để tính. Lệnh ghi duy nhất là `ghiMoi` vào `pos_doi_soat_ghi` (`doiSoat.js:266–271`). A3 băm bảng xác nhận các bảng khác không đổi.
- **P1:** `client/src` chỉ đổi ở commit `841cfb7`, cùng commit build `dist`. Bundle `index-nxCBBs2z.js` có chuỗi `reports/doi-soat/ghi` và `index.html` trỏ đúng bundle này. Tôi không chạy D5 (so băm khi build lại).
- **backup.js:** Đúng một dòng, ở `:87`, ngay sau `pos_order_log`. `kiem_tra` thêm đúng một dòng, đặt trước nhóm K.

**NGHIỆM THU: 8/9 mục có bằng chứng · mục thiếu: H**
- **A** — A1, A2, A2b, A3, A4, A6. Phần "giả lập vẫn xanh" chỉ có ở văn bản `bang_chung_do.txt`; ca A5 là hằng `true`.
- **B** — B1, B1b, B2, B3, B3b, B3c, B4, C4b.
- **C** — C1, C2, C3, C4, C5, D1a. Lưu ý lỗi 1.
- **D** — D1a–D1d, D2a–D2d.
- **E** — E0, E0b, E0c, E1, E1b, E2–E6.
- **F** — F1, F2, F2b, F3.
- **G** — G1–G6.
- **H** — **THIẾU.** Chỉ có H1 với N = 3000 trên kho cục bộ, dữ liệu sạch. Không có phép đo "lớn dần" như phiếu đòi và kế hoạch hứa (2k/20k/100k), không phủ đường gán ngày N+1 (lỗi 3), và Turso chưa kiểm.
- **I** — Bài thử có đủ các ca; 4 loại đột biến phiếu đòi đều có tên (`BV-DS-BO-BAT-BIEN`, `BV-DS-BO-LOC-KY`, `VS-DS-GIO-UTC`, `BV-DS-BO-QUYEN-*`). Kết quả BẮT 27/27 chỉ có ở văn bản, tôi chưa chạy lại.
- Ca chưa phủ: mã lỗi `DOI_SOAT_LOAI_SAI` và `DOI_SOAT_DA_SO_SAI`; nhánh `donHoacXoa` cho đơn đã xoá ở I9.

**Đơn giản:**
- `doiSoat.js:207`: danh sách `['I2','I4','I5','I13','I18']` chép lại thông tin đã có trong `KHOA`. Nên lấy từ `KHOA` để còn một vị từ.
- `doiSoat.js:135–173`: bảng regex để đọc lại ngày từ chữ mô tả rất dễ vỡ. Gọn hơn là dưới `ctx.thuc` để bất biến trả thẳng `{mo_ta, ngay}` — làm vậy cũng sửa luôn lỗi 1 và lỗi 3.
- `doiSoat.js:90–106`: 4 câu × 2 cách trả, rồi `soKet` gọi lại thêm lần nữa. Có thể gộp bằng một câu `GROUP BY` theo cách trả.
- Code khoảng 516 dòng (doiSoat 274 + DoiSoat.jsx 182 + reports 29 + db 20 + bat_bien ~11), vượt mức ~400 mà chủ quán đã chấp nhận ở quyết định 7.

**CHƯA SOÁT ĐƯỢC:**
- Chưa chạy `npm test --day-du`: nhóm D5 so băm dist và nhóm S giả lập (`chay.js`, `thu_gia_lap.js`).
- Chưa chạy bộ 27 đột biến.
- Độ trễ Turso và dữ liệu thật: số dòng LỆCH CŨ thực tế, ví lệch cũ.
- Ngày gộp trong `AP_DUNG_TU`: kho nông, không có git log để đối chiếu.
- Lệch số dòng của `viec/AUDIT-2/bb_neo.json`. Tôi đã kiểm bằng script rằng không neo chuỗi nào trong `viec/*/*.py` bị gãy.
- Giao diện trên điện thoại.
- Việc Render có triển khai `cong_cu/` hay không.

**BÀI HỌC:**
- **KHOÁ:**
  - Ca A2b-WITH: bất biến giả chạy `WITH … UPDATE` phải bị chặn, kèm đột biến nới regex.
  - Ca "sự việc mới trên đơn cũ": đền hoặc hoàn hôm nay trên đơn tạo trước mốc phải ĐỎ trong kỳ hôm nay.
  - Ca H trên dữ liệu CÓ lệch, đếm số câu SQL theo số dòng lệch.
  - Ca đền tiền cho khách không SĐT trong két.
  - Phép tĩnh cấm `k(…, true)` trong bài thử.
- **NGUYÊN TẮC (KHUON_LOI):**
  - K4: gán mốc thời gian cho một dòng lệch thì dùng ngày của SỰ VIỆC gây lệch, không dùng ngày tạo đối tượng — grep mọi bất biến xem đang lấy ngày nào.
  - K3: cổng "chỉ đọc" bằng tiền tố SQL phải tính tới CTE (`WITH`) mở đầu lệnh ghi.
  - K3: ca hiệu năng phải đi qua đường đắt nhất (dữ liệu có lệch), không chỉ dữ liệu sạch.
  - K1: kế hoạch đổi theo quyết định thì báo cáo phải ghi rõ ca nào đã bỏ (E7, E3b) và lệch so với kế hoạch (cỡ N của H1).
```

## Vòng sửa 1 (19.10) — từng lỗi của báo cáo soát

Đã kiểm từng lỗi trên code trước khi sửa (K8): lỗi 1, 2, 3, 5 thấy lỗ thật ở `doiSoat.js:138, :164, :58–61, :208–209, :112` (số dòng bản `14311c3`).

| lỗi | xử lý | commit | ca thử (đỏ trên `14311c3`) | đột biến |
|---|---|---|---|---|
| 1 ngày sự việc | `donMoiNhat` = MAX(tạo, huỷ, nhật ký đơn, dòng ví, dòng điểm) cho MỌI dòng khoá theo đơn (I3, I6, I8, I9, I14, I15, I16, I19 — K4: cả 8, không chỉ 3 chỗ người soát nêu); gói I14 = MAX(created_at, updated_at); I1 lấy MAX hai lần nhận (trước là MIN). `donHoacXoa` bỏ: dưới `ctx.thuc` I9 không bao giờ sinh dòng `đơn #id` (đơn mất thì không có `customer_phone`, vế 'thu' so với chính nó — `bat_bien.js:157–182`) | `89d35c7` | C6, C6b | `VS-DS-NGAY-BO-VI`, `VS-DS-GOI-NGAY-TAO` |
| 2 `WITH … UPDATE` | `chiDoc` bỏ chú thích và chuỗi `'…'`, rồi chặn khi không mở đầu SELECT/WITH, HOẶC có từ khoá ghi ở bất kỳ đâu, HOẶC nhiều câu | `89d35c7` | A2c; A2d (K5: chữ "update; drop" trong CHUỖI không bị chặn) | `VS-DS-CHI-DOC-TIEN-TO`, `VS-DS-CHI-DOC-SOI-CHUOI` |
| 3 N+1 | tra ngày THEO LÔ (`lo`, 400 khoá một câu) — bỏ `TRAN_PHAN_LOAI` | `89d35c7` | H2 (3000 dòng lệch I8: ≤ 66 câu SQL; trên `14311c3` ra 1040 câu) | `VS-DS-TRA-TUNG-DONG` |
| 4 đền khách lẻ | **không tự sửa — Câu hỏi 10** (cách quầy trả tiền đền là câu hỏi nghiệp vụ) | — | — | — |
| 5 ví mẹ | ví chi = `balance_amount + parent_balance_amount` | `89d35c7` | F3b | `BV-DS-VI-ME` |
| 6 A5 hằng `true` | bỏ ca A5 (giả lập canh ở cổng `--day-du` nhóm S, số liệu dưới đây). G5 giữ — phiếu G đòi "màn ẩn nút", ca này đọc `client/src` thật (trên gốc G5 đạt vì bài đọc `client/` của cây hiện tại, không của `--may-chu`) | `376d1e4` | — | — |
| 7 K1 | sửa mục Phát hiện (số dòng HEAD) bên dưới; E7 / E3b: **bỏ** vì quyết định 1 = B — tiền mặt vào két nay cố ý KHÁC `cash_revenue` của `/daily` (thêm nạp ví, thu nợ theo ngày thu, trừ trả ra), nên E7 "bằng `/daily`" sai về nghiệp vụ; E3b ("ngoài sổ" của phương án A) không còn nghĩa — E0 / E0c thay cả hai | — | — | — |
| 8 `--help` | `dot_bien.py --help` / `-h` in hướng dẫn rồi thoát | `d7c7518` | — | — |
| 9 màu két | `🟡 chưa đếm két` · `🟡 chưa có mốc` · `🟢 khớp` · `🔴 LỆCH`; build dist | `30f661b` | — (giao diện; thử tay ở báo cáo) | — |
| Đơn giản `:207` | phạm vi bảng bất biến lấy từ `KHOA` (một vị từ) | `89d35c7` | A1 / C4b | — |
| Đơn giản: bất biến trả `{mo_ta, ngay}` | **không làm**: đổi 17 bất biến của giả lập (cấm đổi mô tả lệch, 69 neo LUOI-1 vào `bat_bien.js`); bảng KHOA đã có C4 canh từng bất biến | — | — | — |
| Đơn giản: gộp `tienTheoSo` bằng GROUP BY | **không làm**: 4 câu ngắn, mỗi câu một khoản chủ quán đọc tên được; không phải lỗi | — | — | — |

**Bài thử bị kéo đỏ dây chuyền (K3, tự bắt khi chạy trên `14311c3`):** lần đầu, A2c trên code cũ để lọt `WITH … UPDATE` và nó GHI THẬT `loyalty_enabled` → D2a2, D2c, D2d, F3, Z1 đỏ theo. Lỗi rò này còn làm H2 **xanh oan**, vì trần H2 tính từ lượt chạy sạch, mà lượt sạch giờ cũng nhiều lệch. Đã sửa (`c3c1892`): A2c trả lại cài đặt ngay sau ca, trần H2 thành số TUYỆT ĐỐI. Chạy lại trên `14311c3` thì đỏ đúng 5 ca mới, mỗi ca đỏ vì lỗi của chính nó.

**Hiệu năng (nghiệm thu H) — đo lớn dần** (`node cong_cu/thu_DOISOAT1.js --h-n <N>`, kho cục bộ):

| N đơn | trước vòng sửa (`14311c3` + bài mới) | sau khi tra theo lô, chưa chỉ mục | + chỉ mục `order_id` (5 bảng) | + I8 JOIN gộp (HEAD) |
|---|---|---|---|---|
| 3.000 | H1 0,95 s · H2 1040 câu | H1 0,86 s · H2 1,86 s / 48 câu | — | H1 0,84 s · H2 1,80 s / 48 câu |
| 20.000 | — | H1 35,1 s · H2 91,9 s | H1 12,3 s · H2 12,7 s | **H1 0,74 s · H2 0,99 s / 90 câu** |
| 20.000, HEAD bỏ chỉ mục | | | | H1 11,0 s · H2 67,5 s → chỉ mục CẦN |
| 100.000 | — | — | — | H2 4,40 s / 290 câu (1 lần trọn); `chayDoiSoat` gọi thẳng (không HTTP): 4,9 s sạch · 4,6 s với 100.000 dòng lệch |

- Chỉ mục: quyết định 8 ("index chỉ khi đo chậm, `CREATE INDEX IF NOT EXISTS` ở khối của việc này cuối `createTables`") — đo chậm nên thêm `idx_ds_<bảng>_order` cho `pos_order_items`, `pos_balance_transactions`, `pos_point_transactions`, `pos_refund_requests`, `pos_customer_packages` (`database.js:924–928`). KHÔNG thêm cho `pos_signup_codes` / `pos_membership_purchases`: hai bảng tạo SAU `createTables` (`database.js:1203, :1262`, trong `seedDefaultData` — sửa ở vòng 2, bản đầu ghi sai `:1198, :1257`) — kho mới sẽ sập lúc khởi động. Câu chậm còn lại là I8 lồng theo `pos_signup_codes.order_id` (đo từng bất biến: 11,8 s / 12,3 s) → viết lại I8 thành JOIN với bảng gộp sẵn (`bat_bien.js:125–130`, cùng kết quả; giả lập `32 kịch bản · 18 bất biến · ĐẠT`; 69/69 neo LUOI-1 vào `bat_bien.js` vẫn khớp, đếm bằng script ast).
- 100.000 đơn: 2/3 lần chạy HTTP sập ngay ở yêu cầu H1 (`TypeError: fetch failed` trong `goiAi`, tầng mạng của bài thử sau ~100.000 lệnh INSERT; chưa rõ nguyên nhân) — **CHƯA KIỂM** ở cỡ này qua HTTP; số đo gọi thẳng hàm ở dòng trên.
- `npm test` chỉ chạy N = 3.000: đột biến gỡ chỉ mục SẼ SỐNG ở cỡ đó (0,84 s) — khoá chỉ mục là số đo tay ở bảng trên, chưa phải phép máy.

**Bộ đột biến** `viec/DOI-SOAT-1/dot_bien.py` (33 = 27 cũ + 6 mới; neo `BV-DS-GHI-DUOC` cập nhật theo dòng `chiDoc` mới): ĐỐI CHỨNG 110 đạt · 0 hỏng; **TỔNG 33 · BẮT 33 · SỐNG 0 · HỎNG 0 · LẠC 0**. Tên mới: `VS-DS-CHI-DOC-TIEN-TO`, `VS-DS-CHI-DOC-SOI-CHUOI`, `VS-DS-NGAY-BO-VI`, `VS-DS-GOI-NGAY-TAO`, `BV-DS-VI-ME`, `VS-DS-TRA-TUNG-DONG`.

**Kiểm sau vòng sửa:** `node cong_cu/thu_DOISOAT1.js` **110 đạt · 0 hỏng**; trên gốc `2123b69` **27 đạt · 84 hỏng** (111 ca vì A0 chỉ hiện khi không nạp được module); `npm test -- --day-du` **PASS 71 · FAIL 0 · CẢNH BÁO 1** (cảnh báo cũ `packages.js:194, products.js:57, sync.js:147`); `node cong_cu/gia_lap/chay.js` → `Giả lập: 32 kịch bản · 18 bất biến · ĐẠT`; `thu_gia_lap.js` xanh 49,0 s; `viec/HOC-2b/kiem_neo.py` không có neo HỎNG nào ở `bat_bien.js` / `doiSoat.js` / `database.js` (các HỎNG còn lại ở `refunds.js`, `damages.js`, `kiem_tra_truoc_khi_giao.js`, `tu_chay/PHIEN_BAN` — file nhánh này không đụng).

**Cổng tĩnh** `node tu_chay/cong.js tinh . 2123b69^ HEAD viec/DOI-SOAT-1` (trước vòng sửa, `14311c3`):
```
✗ [A6] file `client/dist/assets/index-B9Vi2Xgu.js` không có trong Phạm vi của phiếu
✗ [A6] file `client/dist/assets/index-nxCBBs2z.js` không có trong Phạm vi của phiếu
✗ [A6] file `client/dist/index.html` không có trong Phạm vi của phiếu
✗ [A19] viec/DOI-SOAT-1/trang_thai.md thiếu dòng "HEAD ĐÃ KIỂM: <SHA>" — ghi SAU lần kiểm cuối, sau mọi sửa của bước 11 (skill bước 11.4)
✗ CỔNG ĐỎ (TĨNH) — 4 lý do
```
`✗ [A19]` là bình thường ở bước này. `✗ [A6]` → Câu hỏi 11.

## Câu hỏi 10, 11, 12 (MỚI — chờ chủ quán; dừng ở đây, chưa soát vòng 2)

10. **Đền tiền cho khách lẻ KHÔNG SĐT** (lỗi 4 của người soát). `damages.js:183–186` chỉ ghi vào ví khi đơn có `customer_phone`; đơn không SĐT thì khoản đền chỉ nằm ở `pos_damage_logs.refund_amount` (bảng không có cột cách trả, `database.js:751–771`). Quầy đưa tiền đền đó thế nào?
    (A) tiền mặt từ két → tôi cộng `refund_amount` của đơn không SĐT vào "trả ra" tiền mặt của ngày đền (két không đỏ oan);
    (B) chuyển khoản / cách khác → không tính vào két, chỉ ghi chú trên màn;
    (C) quầy không đền tiền cho khách lẻ → để nguyên.
    Lưu ý cho cả A: `pos_damage_logs.created_at` ghi bằng `datetime('now')` (UTC, `damages.js:195`) — đền 0:00–7:00 sáng VN sẽ rơi vào ngày hôm trước; tôi sẽ cộng 7 giờ khi lọc ngày.
11. **Phạm vi thiếu `client/dist/**`** — cổng `chay` sẽ đỏ `✗ [A6]` (ba dòng trên). Phiếu cho sửa `client/src/…`, mà CLAUDE.md P1 bắt build `dist` sau mỗi lần sửa (BAN-HANG-1, GOI-2, P26c đều có dòng `- client/dist/**` trong Phạm vi). Xin chủ quán thêm `- client/dist/**` vào `## Phạm vi` của phiếu.
12. **Ngân sách**: code (kể cả chú thích) +558 dòng (`doiSoat.js` 295 · `DoiSoat.jsx` 182 · `reports.js` 29 · `database.js` 25 · `bat_bien.js` +16/−11 · `Reports.jsx` 10 · `backup.js` 1 · `kiem_tra` 1), so với ~400 đã chấp nhận ở quyết định 7; bài thử 569 dòng, so với ~250 của phiếu. Vòng sửa 1 thêm ~20 dòng code (tra theo lô, chặn ghi, chỉ mục) và ~45 dòng thử. Chấp nhận, hay chỉ chỗ cắt?

Sau khi có trả lời: sửa theo câu 10 (nếu A/B: thêm ca + đột biến), rồi `/ra-soat` vòng 2, rồi bước 11.

## Trả lời của chủ quán (19.10) cho câu 10–12 → làm tiếp

Nguyên văn: "Câu 10 chọn (C): quán KHÔNG đền tiền cho khách lẻ (làm lại ly / tặng món) — công thức két không tính khoản đền; nếu sổ có khoản
đền bằng tiền cho khách không SĐT thì liệt kê ở nhóm CẦN XEM (vàng), không làm két đỏ; có ca thử. Câu 11: phiếu đã thêm client/dist/**. Câu 12
chấp nhận ~558 dòng code + 569 dòng thử. Gộp SAU P16."

- **Câu 11 — CHƯA thấy trên nhánh:** `git fetch origin viec/DOI-SOAT-1` lúc 19.10 (phiên làm tiếp) ra FETCH_HEAD = HEAD = `2a6a671`; phiếu chưa có dòng
  `client/dist/**` (commit cuối của phiếu vẫn là `1a797db`). Tôi không sửa phiếu (luật). Cổng `chay` sẽ còn `✗ [A6]` cho tới khi commit phiếu lên nhánh này.
- **Câu 10 = C** — đã làm (commit `4a7a3a4`): phép `DEN` trong `doiSoat.js` (`phepDenLe`) liệt kê mọi dòng `pos_damage_logs` có `refund_amount > 0`
  và `customer_phone` rỗng (cùng vị từ với `damages.js:183` `order.customer_phone` — null / '' thì không vào ví) vào nhóm CẦN XEM; ngày = `created_at` + 7 giờ
  (bảng ghi UTC, `damages.js:195`). Công thức két KHÔNG đổi (không cộng khoản đền). Bài thử (mount route `damages` thật):
  DEN1 (CẦN XEM đúng ngày VN, có số tiền, kết quả XANH) · DEN2 (không lọt sang ngày UTC) · DEN3 K5 (đơn CÓ SĐT → không dòng nào) · DEN4 (két trước = sau).
  Đột biến (5): `BV-DS-DEN-BO`, `VS-DS-DEN-GIO-UTC`, `VS-DS-DEN-DO`, `VS-DS-DEN-CA-CO-SDT`, `VS-DS-DEN-VAO-KET` — BẮT 5/5.
- **Câu 12** chấp nhận. Câu 10 thêm ~15 dòng code, ~25 dòng thử.
- Kiểm: `node cong_cu/thu_DOISOAT1.js` **114 đạt · 0 hỏng**; gốc `2123b69` **29 đạt · 86 hỏng**; đột biến **TỔNG 38 · BẮT 38 · SỐNG 0 · HỎNG 0 · LẠC 0**;
  `npm test -- --day-du` **PASS 71 · FAIL 0 · CẢNH BÁO 1** (cảnh báo cũ); giả lập xanh 33,5 s, `thu_gia_lap.js` xanh 49,8 s.

- 19.10 · Stop hook đòi push 4 commit (a6a86f4..b7bd23e); push bị từ chối non-fast-forward vì origin có `0e98c79 PHIEU: DOI-SOAT-1 cau 11 them client/dist/**`
  (lệch hai phía, gốc chung `2a6a671`). Không merge / rebase / force (luật) — chờ chủ quán chọn: (A) cho chạy `git pull --no-rebase origin viec/DOI-SOAT-1`, hoặc (B) tự gộp.

## Phiên 21.10 · làm tiếp (soát vòng 2 → bước 11)

- Bước 1: nhánh `viec/DOI-SOAT-1`, cây sạch; fetch: HEAD `69868c9` là tổ tiên của FETCH_HEAD `9290cf4` → `git pull --no-rebase --ff-only` (fast-forward, chỉ phiếu).
  ```
  9290cf4 PHIEU: DOI-SOAT-1 cau 11 them client/dist/**
  69868c9 DOI-SOAT-1: ghi lech hai phia voi origin (cho chu quan chon cach gop)
  b7bd23e DOI-SOAT-1: tra loi cau 10-12, bang chung do cau 10 (SO CA 114)
  ```
- Push 5 commit câu 10 đã lên (20.10, `2a6a671..69868c9` fast-forward) sau khi chủ quán trả nhánh GitHub về `2a6a671`. Câu 11 có hiệu lực (`- client/dist/**` trong Phạm vi).

## Bước 8 · soát độc lập `/ra-soat` vòng 2 (21.10) — KHÔNG ĐẠT

Agent soát (general-purpose, chỉ đọc) soát `2123b69^..958f268`. Báo cáo chép nguyên văn:

```
KHÔNG ĐẠT

Kết quả soát vòng 2 cho `viec/DOI-SOAT-1`, so `2123b69^` với HEAD `958f268`. Năm sửa chính của vòng 1 đúng. Nhưng còn hai luật tiền chủ quán đã chốt ở `quyet_dinh.md` mục 1 mà bài thử không khoá: đột biến phá chúng đi vẫn xanh trọn bài. Thêm một chỗ hai vị từ "đơn có gói" lệch nhau trên đường tiền, chỗ này vá được ngay trong `doiSoat.js`.

Lệnh đã chạy:
- `node cong_cu/thu_DOISOAT1.js` trên HEAD: **114 đạt · 0 hỏng**.
- `dot_bien.py --goc 2123b69`: **29 đạt · 86 hỏng**, thoát 1. Khớp `bang_chung_do.txt`.
- `dot_bien.py` (bộ đầy đủ): ĐỐI CHỨNG 114 đạt; **TỔNG 38 · BẮT 38 · SỐNG 0 · HỎNG 0 · LẠC 0**.
- Đột biến của tôi, chép `server/` + `cong_cu/gia_lap/` vào scratchpad, chạy với `--may-chu`:
  - bản m1 gộp 6 đột biến → **114 đạt · 0 hỏng, cả 6 SỐNG**;
  - bản m2 gộp 3 đột biến → 113 đạt · 1 hỏng. Chỉ đột biến bỏ cận trên kỳ bị DEN2 bắt; hai đột biến kia SỐNG.

**Kiểm từng sửa của vòng 1:**

| Lỗi vòng 1 | Kết quả soát vòng 2 |
|---|---|
| 1 ngày sự việc | Đúng. `doiSoat.js:150-154` có `donMoiNhat` = MAX(tạo, huỷ, nhật ký, ví, điểm); `:171` gói lấy MAX(created_at, updated_at); I1 lấy MAX. C6/C6b đỏ trên `14311c3`. Còn lỗ phụ, xem lỗi 7. |
| 2 `WITH … UPDATE` | Vá được dạng đã nêu (A2c). Còn lỗ của bộ tách chuỗi, và hai vế không có ca, xem lỗi 4. |
| 3 N+1 | Đúng. Tra theo lô `lo` (`:141-148`); H2 đo 49 câu, trần 66; `VS-DS-TRA-TUNG-DONG` bị BẮT. |
| 4 đền khách lẻ | Làm theo câu 10 = C: `phepDenLe` (`:213-218`), DEN1–DEN4, 5 đột biến đều BẮT. |
| 5 ví mẹ | Đúng. `:115`; F3b; `BV-DS-VI-ME` bị BẮT. |
| 6 A5 hằng `true` | Đã bỏ. G5 vẫn là ca marker, xem NGHI NGỜ. |
| 7 K1 | Đã sửa các dòng bị nêu, nhưng có trích dẫn sai mới, xem lỗi 6. |
| 8 `--help` | Đã chạy, in hướng dẫn rồi thoát. |
| 9 màu két | `DoiSoat.jsx:14` có 🟡/🟢/🔴; bundle `index-B15H6HFH.js` có chuỗi mới. |
| Ca chưa phủ `DOI_SOAT_LOAI_SAI` / `DOI_SOAT_DA_SO_SAI` | Không xử lý, xem lỗi 5. |
| NGHI NGỜ I4/I18 (ngày ví = MAX dòng ví) | `trang_thai.md` không trả lời mục này. |

LỖI TÌM ĐƯỢC:

1. **`server/utils/doiSoat.js:125-126` — luật két "ngày CÓ ghi gần nhất trước D, dòng mới nhất của ngày đó" không có ca khoá — K3.**
   - Đột biến `MAX(x.id)` → `MIN(x.id)` cùng `ORDER BY g.ky DESC` → `ASC`: bài vẫn 114/0, SỐNG.
   - Lý do: bài chỉ có một ngày ghi két trước ngày 06.01 (05.01, `thu_DOISOAT1.js:424`), và ngày đó chỉ có một dòng.
   - Đây là công thức tiền chủ quán chốt. Viết sai thì két đỏ hoặc xanh oan mà không phép máy nào bắt.

2. **`server/utils/doiSoat.js:104` — "trả ra" tính theo `DATE(o.cancelled_at)` nhưng không có ca huỷ khác ngày tạo đơn — K3.**
   - Đột biến `cancelled_at` → `created_at`: SỐNG.
   - Lý do: ở E0 (`thu_DOISOAT1.js:431-435`) đơn được tạo và huỷ cùng ngày 06.01.

3. **`server/utils/doiSoat.js:105` — vị từ "đơn có gói" khác với hàm tiền thật — K4 (MỘT vị từ, BAN-HANG-1; LUAT §2 "một quy tắc — một hàm").**
   - Ở đây: dòng hàng có `product_id ∈ (−1000000, 0)`.
   - Hàm hoàn thật `soTienHoan` (`tienDaTra.js:36`): `pos_customer_packages` theo `order_id` (cờ `coGoi`).
   - Hai vị từ lệch nhau trên đường đang chạy, không chỉ dữ liệu cũ: lệnh INSERT `pos_customer_packages` nằm trong `try` nuốt lỗi (`orders.js:1056-1063`). Khi đó huỷ đơn không hoàn vào ví, quầy trả tiền mặt tận tay, nhưng đối soát không tính "trả ra" → két ĐỎ oan.
   - Vòng 1 đã nêu (NGHI NGỜ); người làm chỉ chuyển sang Phát hiện.
   - Cách sửa: `NOT EXISTS (SELECT 1 FROM pos_customer_packages cp WHERE cp.order_id = o.id)`. Có thêm ca cho trường hợp này.

4. **`server/utils/doiSoat.js:58-63` — cổng `chiDoc` chưa được khoá đủ như chú thích hứa — K3.**
   - Đột biến bỏ vế "nhiều câu" `|;\s*\S`: SỐNG.
   - Đột biến bỏ phần lọc chú thích `/*…*/` và `--`: SỐNG.
   - Bộ tách chuỗi bỏ qua tên định danh trong ngoặc kép. Tôi đã chép đúng regex ra `node -e` để thử: câu `WITH x AS (SELECT 1 AS "a'") UPDATE pos_settings SET value = '' WHERE key <> 'z'` lọt qua cổng (in ra `QUA`).
   - Tôi chưa chạy câu đó trên SQLite: người gác chặn lệnh `sqlite3`. Đây là câu SQL hợp lệ, và vòng 1 đã xác nhận SQLite chạy lệnh ghi mở đầu bằng WITH.
   - Rủi ro thấp vì bất biến là code nội bộ, nhưng chú thích `:58-59` hứa nhiều hơn những gì đã khoá.

5. **`server/utils/doiSoat.js:285` và `:289` — `DOI_SOAT_LOAI_SAI` và `DOI_SOAT_DA_SO_SAI` không có ca nào — K3, sót từ vòng 1.**
   - `grep "LOAI_SAI|DA_SO_SAI"` trong `thu_DOISOAT1.js` không ra dòng nào.
   - Đột biến `if (false)` cho cả hai: SỐNG.

6. **`viec/DOI-SOAT-1/trang_thai.md:255` — trích `database.js:1198, :1257` cho chỗ tạo `pos_membership_purchases` / `pos_signup_codes` — K1.**
   - Thật ra ở `:1203` và `:1262`, cả ở `89d35c7` lẫn HEAD.
   - `:1198` là dòng chú thích, không phải câu tạo bảng.

7. **Nguồn ngày của dòng lệch I14 bị kéo sang hôm nay và lệch 7 giờ — K4, cùng khuôn với DEN (cột ghi giờ UTC).**
   - `doiSoat.js:171` lấy ngày I14 = MAX(created_at, updated_at) của `pos_customer_packages`.
   - `packages.js:194-195` là route GET, mỗi lần mở Báo cáo → Gói SP lại ghi `updated_at = new Date().toISOString()` (giờ UTC). Một lệch I14 cũ (đã giao > tổng, còn `active`) vì thế nhảy sang ngày xem, thoát khỏi nhóm "LỆCH CŨ".
   - `packages.js:247` + `:266`: kết thúc gói cũng ghi `updated_at` và dòng ví `hoan_goi` bằng giờ UTC (ảnh hưởng ngày của `donMoiNhat` / `viMoiNhat`).
   - Chỉ đổi nhóm vàng / ngày hiển thị, không làm két đỏ, nên mức nhẹ.

8. **`client/src/components/DoiSoat.jsx:135` — người nhập và giờ nhập két chỉ hiện khi có từ 2 dòng.** Phiếu E đòi "người nhập, giờ". Lỗi giao diện nhỏ.

9. **`server/utils/doiSoat.js:116` — "điểm trừ" của tháng (nhóm thứ 4 của phiếu F) không có ca.** F3 chốt `tru 0`; đột biến `0 AS tru`: SỐNG. Nhỏ.

NGHI NGỜ:

- **Xoá đơn (`orders.js:1549`, chỉ chủ, ngày nào cũng xoá được) là đường song song với huỷ nhưng không vào "trả ra".**
  - Dòng đơn biến mất nên tiền của ngày tạo đơn đổi ngược về sau; ngày xoá thì két lệch.
  - Báo cáo chỉ ghi ở Phát hiện. Nên thành Câu hỏi hoặc mục CHƯA KIỂM, vì đây là vùng CLAUDE.md §8 ghi "CHƯA rà".
- **Công thức két dựa vào nhật ký `thu`, mà nhật ký này không bao giờ ném lỗi** (`nhatKyDon.js:9-24`).
  - Mất một dòng nhật ký thì thu nợ bị tính về ngày tạo đơn, két lệch ở cả hai ngày.
  - I9 chỉ bắt được đơn có SĐT.
- **I4/I18 lấy ngày = MAX dòng ví** (`doiSoat.js:155`): ví lệch từ trước bản vá sẽ thành ĐỎ ngay lần giao dịch tiếp theo. Vòng 1 đã nêu, chưa có câu trả lời.
- **G5 (`thu_DOISOAT1.js:528-530`) là ca marker suông, tính vào `SỐ CA 114`.**
  - Ca này đọc `client/src` của cây thật, không theo `--may-chu`, nên cũng đạt trên gốc.
  - Thêm nữa, `hasPermission('view_reports')` trùng với cổng ở thanh menu (`Layout.jsx:73`), nên nút luôn hiện với người vào được màn.
- **Dòng DEN có `created_at` NULL hoặc không đọc được** → `DATETIME(...)` ra NULL → nhánh "không rõ ngày" xếp ĐỎ, trái với câu 10 = C ("không làm đỏ"). Chỉ là lý thuyết, vì cột có DEFAULT.
- **Dữ liệu `pos_damage_logs` cũ (trước khi `damages.js` dùng `datetime('now')`) có thể đã ghi giờ VN.** Nếu vậy +7 giờ sẽ lệch đôi. Chưa kiểm được vì kho nông.

NGHIỆM THU: 9/9 mục có bằng chứng (kèm hai lỗ ở E, F và phần "CHƯA KIỂM" ở H) + câu 10 có bằng chứng · mục thiếu: không có mục nào trống hẳn, nhưng E chưa khoá hai vế công thức (lỗi 1, 2) nên không tính là đủ.

- **A:** A1, A2, A2b, A2c, A2d, A3, A4, A6. Câu "giả lập vẫn xanh" chỉ có ở văn bản `bang_chung_do.txt`.
- **B:** B1, B1b, B2, B3, B3b, B3c, B4, C4b.
- **C:** C1, C2, C3, C5, C6, C6b, D1a, C4 (mỗi bất biến). Ngày trong `AP_DUNG_TU` khớp `TIEN_DO_POS.json` ngày + 1 (P19 / P20 / P21 / P26b / P26c / GOI-2 / P20c đều đúng).
- **D:** D1a–D1d, D2a–D2d.
- **E:** E0, E0b, E0c, E1, E1b, E2–E6. **Thiếu khoá** cho "ngày ghi gần nhất / dòng mới nhất" và "trả ra theo ngày huỷ" (lỗi 1, 2).
- **F:** F1, F2, F2b, F3, F3b. Điểm trừ chưa khoá (lỗi 9).
- **G:** G1, G1b, G2, G3, G4, G6. G5 là ca marker.
- **H:** H1/H2 ở N = 3.000 + bảng đo tay 20.000 / 100.000 trong `trang_thai.md:248-257`. Turso CHƯA KIỂM. Chỉ mục chưa có phép máy khoá (đã tự ghi).
- **I:** có đủ các ca; 4 loại đột biến phiếu đòi đều có và đều BẮT (tôi đã chạy lại 38/38).
- **Câu 10 = C:** DEN1–DEN4 + 5 đột biến BẮT.

Phần còn lại của 8 mục soát:

- **K3:** bài thử đỏ thật trên gốc; phần lớn ca kiểm hành vi qua route thật. Ngoại lệ: các lỗ nêu ở lỗi 1, 2, 4, 5, 9 và G5.
- **K4:** `grep "db\.(query|queryOne|run|execute)" doiSoat.js` → đúng 2 chỗ: `:64` (`chiDoc`) và `:301` (`ghiMoi`). Mọi câu đọc đi qua cổng.
  - Ngày sự việc: đủ 8 bất biến khoá theo đơn, cộng gói và I1.
  - Chưa xử lý: vị từ "đơn có gói" (lỗi 3), các cột ngày ghi giờ UTC ngoài `damages.js` (lỗi 7), đường xoá đơn (NGHI NGỜ).
- **K5:**
  - `chiDoc`: grep từ khoá ghi trong `bat_bien.js` chỉ ra `:75` (chú thích, không phải SQL). Các tên cột `created_at`, `updated_at`, `deleted_at`, `pragma_table_info` không khớp `\b…\b`. Mọi câu của 17 bất biến và của `doiSoat` đã chạy qua cổng ở B0/A2 mà xanh → không câu SELECT hợp lệ nào bị chặn oan.
  - `kiemTraGhi`: số 0, đúng trần, để lại bằng số đếm, sao kê đúng thứ 2, quản lý ghi đều qua (E5b, E5c, G2).
- **Đường tiền:** không trường tiền nào lấy từ client để tính. Lệnh ghi duy nhất là INSERT vào `pos_doi_soat_ghi` (`:301`), cộng CREATE TABLE/INDEX ở `database.js:905-928`.
  - Chỉ mục mới: 5 bảng đều có cột `order_id` ngay trong CREATE (`database.js:275`, `:333`, `:355`, `:451`, `:845`); `IF NOT EXISTS` an toàn trên cả kho mới lẫn kho thật.
  - Lưu ý: khối này không bọc `try` (khác khối `:899-902`), nên Turso lỗi lúc tạo chỉ mục thì máy chủ không khởi động.
- **P1:** `client/src` chỉ đổi ở `841cfb7` và `30f661b`, cả hai cùng commit `dist`; `index.html` trỏ đúng `index-B15H6HFH.js`; bundle có chuỗi mới. Phép so băm D5 tôi chưa chạy.

**Đơn giản (mục 8):**
- `doiSoat.js:141`: tham số `lan` của `lo` không chỗ gọi nào truyền (luôn 1), là code chết theo LUAT §3. Bỏ đi và truyền thẳng `phan`.
- `doiSoat.js:105`: dùng lại vị từ của `soTienHoan` (xem lỗi 3), không giữ vị từ thứ hai.
- `doiSoat.js:264-266`: ở kỳ ngày, `soKet` gọi lại `tienTheoSo(…, 'cash')` thêm 4 câu, trùng với `tongHop` khi mốc là ngày D−1. Nhẹ, không bắt buộc sửa.

CHƯA SOÁT ĐƯỢC:
- `npm test -- --day-du` (so băm D5, nhóm S: `chay.js`, `thu_gia_lap.js`) và `node tu_chay/cong.js chay` — không có trong danh sách lệnh được phép.
- Turso: độ trễ, và chuyện tạo chỉ mục lúc khởi động.
- Dữ liệu thật: số dòng LỆCH CŨ, ví lệch cũ, định dạng giờ của `pos_damage_logs` cũ.
- 69 neo LUOI-1 và `viec/AUDIT-2/bb_neo.json`.
- Ngày gộp đối chiếu bằng git log (kho nông).
- Render có triển khai `cong_cu/` hay không.
- Giao diện trên điện thoại.
- Chạy câu bypass trên SQLite thật (người gác chặn `sqlite3`).

BÀI HỌC:
- **KHOÁ:**
  - Ca két có ≥ 2 ngày ghi trước D, và ngày mốc có ≥ 2 dòng, kèm đột biến MIN/ASC.
  - Ca huỷ đơn khác ngày tạo đơn, kèm đột biến `cancelled_at` → `created_at`.
  - Ca `chiDoc` nhiều câu, ca có chú thích, ca `"a'"` (lỗ của bộ tách chuỗi).
  - Ca `DOI_SOAT_LOAI_SAI` / `DOI_SOAT_DA_SO_SAI`; ca điểm trừ trong tháng.
  - Ca đơn gói không có dòng `pos_customer_packages` bị huỷ → két không đỏ oan.
  - Luật người gác: ca marker đọc cây thật (như G5) không được tính vào `SỐ CA` khi chạy `--may-chu`.
- **NGUYÊN TẮC (KHUON_LOI):**
  - K3: mỗi vế của công thức tiền chủ quán chốt (mỗi cột ngày, mỗi chữ "gần nhất / mới nhất") phải có một đột biến; ca chỉ có một mốc thì không khoá được chữ "gần nhất".
  - K4: vị từ nghiệp vụ dùng trong đối soát lấy từ cùng nguồn với hàm tiền đang chạy (`soTienHoan`), không tự chế vị từ thứ hai.
  - K4: sửa một cột ngày ghi giờ UTC thì grep mọi cột ngày đối soát đọc (`datetime('now')`, `toISOString`), kể cả route GET có ghi.
  - K1: bảng "vòng sửa" phải trả lời TỪNG mục NGHI NGỜ và "ca chưa phủ" của người soát, không chỉ các mục LỖI.
```

## Vòng sửa 2 (21.10) — từng mục của báo cáo soát vòng 2

| mục | xử lý | commit | ca (đỏ trên `958f268` hoặc chỉ đột biến bắt) | đột biến |
|---|---|---|---|---|
| lỗi 1 két "gần nhất / mới nhất" | thêm ca: 08.01 ghi hai dòng (để lại 50.000 rồi 80.000), xem 09.01 → mốc 08.01, để lại 80.000 | `3cdf90e` | E7 (khoá luật đang đúng — chỉ đột biến bắt) | `VS-DS-KET-MOC-DONG-DAU`, `VS-DS-KET-MOC-XA-NHAT` |
| lỗi 2 trả ra theo ngày huỷ | thêm ca: đơn tạo 09.01, huỷ 10.01 | `3cdf90e` | E8 (chỉ đột biến bắt) | `VS-DS-RA-THEO-NGAY-TAO` |
| lỗi 3 vị từ "đơn có gói" | **KHÔNG nhận đề xuất** — đã thử (ca E9 + đổi vị từ sang `pos_customer_packages`) thì **E0 ĐỎ**: huỷ đơn mua gói hợp lệ XOÁ luôn gói khách chưa giao lượt nào (`orders.js:1442–1444`), nên nhìn lại sau khi huỷ "còn gói khách" sai với MỌI đơn gói huỷ bình thường → két đỏ oan 300.000 (K5). Dòng hàng gói còn sau huỷ nên giữ vị từ dòng hàng; chú thích `doiSoat.js` ghi rõ lý do. Ca "thêm gói khách lỗi" (`orders.js:1056–1063`, try nuốt lỗi) là đường hỏng hiếm; sau huỷ không còn dấu vết phân biệt → **CHƯA KIỂM** + Phát hiện. Bỏ ca E9 (`4510847`). | `18e313c` | E0 (đã có) | `VS-DS-RA-THEO-GOI-KHACH` (= đúng đề xuất của người soát → E0 bắt) |
| lỗi 4 `chiDoc` | (a) tên trong `"…"`, `` `…` ``, `[…]` cũng được thay trước khi soi (ca `"a'"` lọt — A2e ĐỎ trên `958f268`); (b) **lỗi mới tự bắt**: bộ thay cũ thay CẢ chú thích bằng `''` nên câu mở đầu bằng chú thích bị chặn oan (A2f ĐỎ trên `958f268`, K5) → nay thay bằng khoảng trắng; (c) bỏ vế `;\s*\S`: thừa — câu ghi thứ hai có từ khoá ghi nên vế từ khoá đã bắt, câu thứ hai chỉ đọc thì vô hại | `18e313c` | A2e, A2f | `VS-DS-CHI-DOC-SOI-CHUOI`, `VS-DS-CHI-DOC-DINH-DANH`, `BV-DS-CHI-DOC-CHU-THICH` |
| lỗi 5 mã lỗi ghi | thêm ca | `3cdf90e` | F2c (chỉ đột biến bắt) | `BV-DS-LOAI-SAI`, `BV-DS-DA-SO-SAI` |
| lỗi 6 K1 | số dòng đúng: `pos_membership_purchases` tạo ở `database.js:1203`, `pos_signup_codes` ở `:1262` (câu cũ ghi `:1198, :1257` là SAI) | — | — | — |
| lỗi 7 ngày I14 | ngày gói = MAX(tạo gói, đơn lấy từ gói, huỷ đơn mua) — bỏ `updated_at` (route GET ghi lại bằng giờ UTC). Các cột UTC khác (`packages.js:247, :266`: kết thúc gói, dòng ví `hoan_goi`) nằm ngoài Phạm vi → Phát hiện | `18e313c` | C6c (ĐỎ trên `958f268`), C6b viết lại theo đơn lấy từ gói | `VS-DS-GOI-UPDATED-AT`, `VS-DS-GOI-NGAY-TAO` |
| lỗi 8 người + giờ két | hiện "Lần ghi cuối: <người> lúc <giờ>" ngay từ dòng đầu; build dist | `a48afbf` | — (giao diện: thử tay) | — |
| lỗi 9 điểm trừ | thêm ca dòng đổi −3 trong tháng | `3cdf90e` | F3c (chỉ đột biến bắt) | `VS-DS-F-BO-DIEM-TRU` |
| đơn giản: tham số `lan` chết | bỏ | `18e313c` | — | — |
| đơn giản: `soKet` gọi lại `tienTheoSo` | không làm (người soát ghi "không bắt buộc"; 4 câu đọc nhỏ) | — | — | — |

**Trả lời từng NGHI NGỜ (vòng 1 + vòng 2):**
- **Xoá đơn** (`orders.js` route DELETE, chỉ chủ): tiền của đơn đã xoá biến khỏi mọi tổng theo sổ → két ngày xoá có thể lệch, ngày tạo đổi ngược. Vùng CLAUDE.md §8 ghi "CHƯA rà"; việc này không rà → **CHƯA KIỂM**, ghi Phát hiện.
- **Nhật ký `thu` không bao giờ ném lỗi** (`nhatKyDon.js`): mất một dòng thì thu nợ tính về ngày tạo đơn → **CHƯA KIỂM**; I9 chỉ bắt đơn có SĐT.
- **I4 / I18 ngày = MAX dòng ví:** giữ. Số dư ví là trạng thái HIỆN TẠI, không có ngày sự việc riêng; ví lệch từ trước bản vá sẽ đỏ ngay ở kỳ có giao dịch mới của ví đó — đúng nguyên tắc "không bao giờ ẩn một lệch" của `doiSoat.js`, và chủ quán đã chấp nhận "lần chạy thật đầu có thể đỏ" (quyết định 2). Số ví lệch cũ trên dữ liệu thật: **CHƯA KIỂM**.
- **G5 marker:** giữ — phiếu G đòi "màn ẩn nút"; ca đọc `client/src` của cây thật nên đạt cả trên gốc (đã ghi). `hasPermission('view_reports')` trùng cổng menu nên nút hiện với mọi người vào được màn — đúng phiếu G ("chỉ người có quyền xem báo cáo tiền").
- **DEN `created_at` NULL → đỏ:** chỉ lý thuyết (cột có DEFAULT, nguồn ghi duy nhất `damages.js:195` dùng `datetime('now')`) → **CHƯA KIỂM**, không thêm nhánh.
- **`pos_damage_logs` cũ ghi giờ VN:** kho nông, không thấy lịch sử `damages.js` → **CHƯA KIỂM**.
- **Khối chỉ mục không bọc `try`:** giữ — cùng cách với các `CREATE INDEX` khác trong `createTables` (vd `database.js:815`), câu `IF NOT EXISTS` trên cột có sẵn.

**Kiểm sau vòng sửa 2:** `node cong_cu/thu_DOISOAT1.js` **121 đạt · 0 hỏng**; trên `958f268` **118 đạt · 3 hỏng** (A2e, A2f, C6c); trên gốc `2123b69` **29 đạt · 93 hỏng**; đột biến ĐỐI CHỨNG 121 đạt · 0 hỏng, **TỔNG 48 · BẮT 48 · SỐNG 0 · HỎNG 0 · LẠC 0**; `npm test -- --day-du` **PASS 71 · FAIL 0 · CẢNH BÁO 1** (cảnh báo cũ); giả lập xanh 34,2 s, `thu_gia_lap.js` xanh 50,8 s.

## Phát hiện (ngoài Phạm vi, không sửa)

- `client/src/pages/Balance.jsx:111` luôn gửi `payment_method: 'cash'` khi nạp ví → nạp ví bằng chuyển khoản (nếu có) cũng ghi là tiền mặt; màn Đối soát tính nạp ví tiền mặt theo cột này.
- Xoá đơn làm tiền mặt của đơn biến khỏi mọi tổng theo sổ (đơn không còn dòng) — chưa rà đường xoá đơn trong việc này.

- `client/src/pages/Reports.jsx:12` mặc định "hôm nay" bằng `new Date().toISOString()` (UTC): 0:00–7:00 sáng VN tab Ngày hiện hôm qua.
- Báo cáo ngày/tuần (`server/routes/reports.js:35, :128, :143`) tính thu nợ vào NGÀY TẠO đơn gốc (`orders.js:1305–1310`) → doanh thu tiền mặt ngày cũ đổi về sau; không có nạp ví tiền mặt.
- Nạp ví mặc định `payment_method = 'cash'` (`database.js:333`, `wallets.js:136`).
- Chú thích `cong_cu/gia_lap/bat_bien.js:221` ghi `orders.js:450` — dòng đó nay là `sx_product_id: null` (lệch số dòng).
- `server/routes/damages.js:195` ghi `pos_damage_logs.created_at` bằng `datetime('now')` (UTC), khác quy ước `getNow` (giờ VN) — báo cáo / đối soát theo ngày của bảng này lệch 7 giờ.
- (người soát, NGHI NGỜ) "trả ra" nhận đơn gói bằng dòng `product_id ∈ (−1000000, 0)` (`doiSoat.js` `tienTheoSo`), còn `soTienHoan` (`server/utils/tienDaTra.js:36`) xét `pos_customer_packages` theo `order_id` — hai vị từ lệch nhau ở đơn gói không có dòng gói khách (dữ liệu cũ trước SO-LUONG-1). CHƯA KIỂM trên dữ liệu thật.
- (vòng 2) `server/routes/packages.js:194–195` route GET ghi `updated_at` của gói bằng `toISOString()` (UTC) mỗi lần mở; `:247`, `:266` kết thúc gói
  ghi `updated_at` và dòng ví `hoan_goi` bằng giờ UTC — ngày của các dòng này lệch 7 giờ so với quy ước `getNow` (đối soát gói đã bỏ `updated_at`).
- (vòng 2) `server/routes/orders.js:1056–1063`: thêm gói khách nằm trong `try` nuốt lỗi — lỗi thì đơn có dòng gói mà không có gói khách; huỷ đơn đó không hoàn
  ví (route huỷ và `soTienHoan` xét gói khách), quầy phải trả tay, nhưng đối soát (vị từ dòng hàng) không tính "trả ra" → két có thể đỏ. Không phân
  biệt được sau huỷ (route huỷ xoá gói khách chưa giao, `orders.js:1444`) — muốn khoá thì cần sửa ở `orders.js` (ngoài Phạm vi).
- (vòng 2) Xoá đơn (route DELETE `orders.js`, chỉ chủ) không vào "trả ra" và làm tiền của ngày tạo đơn đổi ngược — vùng CLAUDE.md §8 "CHƯA rà".
- (sửa câu cũ của tôi, K1) mục "Bước 2–3" ở trên ghi "giữ ca đối chứng E7" — E7 đã BỎ sau quyết định 1 = B (lý do ở bảng vòng sửa 1, lỗi 7).

## Bài học (tạm — điền khi làm xong)

Chưa làm tới. Ghi sớm một điều: bản 1 của kế hoạch có một câu sai về phiếu và một mâu thuẫn nội bộ (B/C) mà tôi không thấy; agent soát đọc độc lập bắt được cả hai — nên giữ bước soát kế hoạch cho việc tiền.
