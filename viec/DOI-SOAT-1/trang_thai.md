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

## Bước 8 · soát độc lập `/ra-soat` vòng 3 (21.10) — KHÔNG ĐẠT

Agent soát (general-purpose, chỉ đọc) soát `2123b69^..390faee`. Báo cáo chép nguyên văn:

```
KHÔNG ĐẠT

Soát `2123b69^..390faee`, không tính `client/dist`. Tôi đã đọc toàn bộ diff, cả `doiSoat.js`, `DoiSoat.jsx`, `thu_DOISOAT1.js`, `dot_bien.py`, phiếu, quyết định, trạng thái và bằng chứng. Đọc thêm đường tiền: `orders.js` (huỷ :1379–1530, pay-debt :1242–1330), `tienDaTra.js`, `wallets.js:60–140`, `refunds.js:105–175`, `packages.js:215–285`, `don-mo-rong.js` (đổi cách trả) và `damages.js:181–200`.

Lệnh đã chạy:
- `node cong_cu/thu_DOISOAT1.js` trên HEAD: **121 đạt · 0 hỏng**.
- `dot_bien.py --goc 2123b69`: **29 đạt · 93 hỏng**. `--goc 958f268`: **118 · 3 hỏng** (A2e, A2f, C6c). Cả hai khớp `bang_chung_do.txt`.
- `dot_bien.py` (bộ đầy đủ): ĐỐI CHỨNG 121/0, **TỔNG 48 · BẮT 48**.
- 13 đột biến tôi tự dựng (chép `server/` + `cong_cu/gia_lap/` vào /tmp, chạy với `--may-chu`): **10 SỐNG** trọn bài 121/0. Một trong số đó (`m_ra_status`) là đột biến tương đương nên không tính; còn lại **9 lỗ thật**, liệt kê ở các lỗi dưới. 3 đột biến bị bắt: `m_canxem_i12` (C4), `m_ra_cot` (B3/F1/F3), `m_ket_dong_lech` (E3).

**Lỗi 3 của vòng 2: người làm đúng, người soát vòng 2 sai.**
- Code thật: `orders.js:1440–1446`. Huỷ đơn mua gói có `delivered_qty = 0` thì `DELETE FROM pos_customer_packages` (`:1444`); có `> 0` thì chỉ đổi status thành `cancelled`.
- Vì vậy sau một lần huỷ hợp lệ, vị từ `pos_customer_packages` không còn thấy gói, và 300.000 bị tính vào "trả ra" → két ĐỎ oan.
- Tôi đã chạy lại: đột biến `VS-DS-RA-THEO-GOI-KHACH` (đúng đề xuất vòng 2) bị **E0 BẮT**.
- Đường "INSERT gói khách lỗi" (`orders.js:1056–1063`) đã được ghi CHƯA KIỂM + Phát hiện. Hợp lệ.

LỖI TÌM ĐƯỢC:

1. **`server/utils/doiSoat.js:96–100` — vế "thu nợ CÙNG CÁCH trả" của công thức két (`quyet_dinh.md` mục 1) không có ca nào khoá — K3.**
   - Đột biến `m_thu_cach`: bỏ điều kiện `json_extract(chi_tiet,'$.cach') = ?` trong `jTien` → **SỐNG 121/0**.
   - Lý do: bài chỉ có thu nợ bằng tiền mặt (`thu_DOISOAT1.js:168`, `:443`). Không ca nào thu nợ bằng chuyển khoản.
   - Đột biến này không tương đương. Ví dụ: CK ngày 06.01 sẽ thành 100.000 thay vì 50.000, và nếu khách trả nợ bằng CK thì phần đó bị cộng vào tiền mặt két. Ca tuần F1 không thấy vì hai ngày bù trừ nhau.
   - Cần một ca: pay-debt bằng `transfer` ở ngày khác ngày tạo đơn; tiền mặt và CK của ngày thu đều phải đúng. Kèm đột biến.

2. **`server/utils/doiSoat.js:127–128` — vế "dòng mới nhất của ngày ghi KÉT" (lọc `x.loai = 'ket'` trong câu con MAX(id)) không có ca khoá — K3, cùng khuôn với lỗi 1 vòng 2.**
   - Đột biến `m_moc_loai` bỏ `x.loai = 'ket'` → **SỐNG**.
   - Trường hợp thật bị ảnh hưởng: két ngày thứ 2 ghi trước, sao kê tuần (`ky` = thứ 2) ghi sau, id lớn hơn. Khi đó ngày thứ 2 bị bỏ làm mốc, mốc lùi về ngày trước → két ĐỎ oan, lặp lại hằng tuần.
   - E7 dùng ngày 08.01 (thứ 6), nên không đi qua nhánh này.

3. **`server/utils/doiSoat.js:152–155, :159–160, :174–176` — nguồn ngày "sự việc mới nhất" (nghiệm thu C) mới khoá được 2/7 vế — K3.**
   - Vòng sửa 1 ghi đã sửa "MAX(tạo, huỷ, nhật ký, ví, điểm) — cả 8 bất biến", nhưng chỉ vế ví (`VS-DS-NGAY-BO-VI`) và vế đơn lấy từ gói (`VS-DS-GOI-NGAY-TAO`) có đột biến.
   - Các đột biến sau đều **SỐNG**:
     - `m_don_huy`: bỏ `cancelled_at` của đơn
     - `m_don_log`: bỏ nhật ký đơn
     - `m_don_diem`: bỏ dòng điểm
     - `m_goi_huy_mua`: bỏ `cancelled_at` của đơn mua gói (I14)
     - `m_i1_max`: MAX → MIN ở I1
   - Hậu quả nếu vỡ: lệch MỚI trên đơn cũ bị xếp thành "LỆCH CŨ" hoặc rơi khỏi kỳ, tức xanh oan. Đúng khuôn mà bài học vòng 1 đã yêu cầu khoá ("sự việc mới trên đơn cũ").

4. **`server/utils/doiSoat.js:117` — vế "ví chi = đơn completed" của nhóm tháng không có ca — K3, nhỏ, cùng loại với lỗi 9 vòng 2.**
   - Đột biến `m_vichi_status` bỏ `status = 'completed'` → SỐNG.
   - Lý do: F3/F3b không có đơn huỷ hay hoàn nào trả bằng ví trong tháng 01.2027.

NGHI NGỜ / ĐỀ XUẤT (không chặn):
- **Vị từ "trả ra"** (`doiSoat.js:107`): vị từ dòng hàng là đúng, như đã nói ở trên. Muốn gần với `coGoi` của `soTienHoan` (`tienDaTra.js:36`) hơn mà không sửa `orders.js`: "có gói khách HOẶC có dòng ví `payment_method = 'hoan_goi'` của đơn". `ghiHoan` ghi dòng này khi huỷ đơn gói (`wallets.js:85–88`), nên vị từ mới phủ được cả đường INSERT gói lỗi. Lệch còn lại khi `tienMat = 0`.
- **Nhãn D2** (`doiSoat.js:265`): đột biến `m_d2_nhan` (gắn D2 cho MỌI dòng I8) SỐNG, vì không có ca phủ định "đơn thường không mang nhãn D2". Chỉ là nhãn.
- **Màn hình** (`DoiSoat.jsx:147`): khi dòng sao kê mới nhất là `da_so = 0` thì không hiện cảnh báo vàng "chưa so". Chỉ hiện khi chưa có dòng nào.
- **Điều chỉnh ví âm** (`wallets.js:187`, chỉ chủ) không vào "trả ra". Nếu quầy dùng nó để trả lại tiền mặt khi khách rút ví thì két lệch. Cần chủ quán xác nhận.
- **Ngân sách:** code hiện khoảng 577 dòng (doiSoat 312 + DoiSoat.jsx 183 + reports 29 + db 25 + bat_bien +16 + Reports.jsx 10 + 2). Bài thử 635 dòng. Câu 12 chấp nhận ~558 / ~570. `trang_thai.md` vòng sửa 2 không ghi số mới (K1, nhẹ).
- **Đơn giản:**
  - `doiSoat.js:295` và `:300` chép cùng biểu thức `ghi_chu`: tính một lần.
  - `doiSoat.js:237`: vế `!troi && n10 &&` thừa (n10 có giá trị thì troi luôn false).

ĐỐI CHIẾU 8 MỤC:
- **K3:** bài ĐỎ thật trên gốc (93 hỏng) và trên `958f268` (3 hỏng đúng ca mới). Ca kiểm hành vi qua route thật, không dò marker; ngoại lệ là G5, đã ghi. Lỗ còn lại ở lỗi 1–4.
- **K4:**
  - `grep "db\.(query|run)" doiSoat.js` ra đúng 2 chỗ: `:65` (`chiDoc`) và `:306` (`ghiMoi`).
  - Mọi câu đọc đều qua `chiDoc`. `phepD1`, `phepDenLe`, `lo`, nhãn D2, `soKet`, `tongHop` đều nhận `chiDoc`.
  - `bat_bien.js` không `require` DB.
  - Các cột ngày mà `tienTheoSo` đọc đều ghi bằng `getNow` (giờ VN): `orders`, `ghiVi` (`wallets.js:60`), nhật ký (`nhatKyDon.js:20`). Ngoại lệ là `hoan_goi` của `packages.js:247`, đã ghi ở Phát hiện.
  - Đường song song chưa xử lý: xoá đơn (`orders.js:1549`), đã ghi CHƯA KIỂM; điều chỉnh ví (NGHI NGỜ trên).
- **K5:**
  - Cổng `chiDoc` mới: 17 bất biến + mọi câu của `doiSoat` đều qua (B0, A2). Chú thích mở đầu (A2f), chuỗi chứa từ khoá (A2d), `created_at`/`updated_at` không khớp `\b`.
  - Ngày gói mới (`:174–176`): bỏ `updated_at` không chặn luồng hợp lệ nào. Huỷ đơn lấy từ gói giảm `delivered_qty` và `da_lay` cùng lúc nên không sinh lệch. Kết thúc gói chỉ làm giảm lệch.
- **K1:** các trích dẫn tôi đã đối chiếu đều đúng:
  - `orders.js:1444`, `:1056`
  - `damages.js:183`, `:195`
  - `database.js:815`, `:333`, `:1203`, `:1262`
  - `bat_bien.js:221`, `Reports.jsx:12`, `reports.js:35`, `:128`, `:143`, `Balance.jsx:111`, `packages.js:195`, `:247`

  Sai nhỏ duy nhất: vòng sửa 1 ghi "K4: cả 8" như thể đã khoá, trong khi chỉ khoá 2 vế (lỗi 3). Thiếu số ngân sách mới.
- **Đường tiền:** không trường tiền nào lấy từ client để tính; `so_tien` là số két đếm nhập tay, đã kiểm nguyên / trần. `nguoi` lấy từ token, `luc` từ `getNow`. Lệnh ghi duy nhất là INSERT vào `pos_doi_soat_ghi` (`:306`), cộng CREATE TABLE/INDEX ở `database.js:905–928`. A3 băm nội dung bảng xác nhận các bảng khác không đổi.
- **P1:** `client/src` chỉ đổi ở `841cfb7`, `30f661b`, `a48afbf`, và cả ba đều commit kèm dist. `index.html` trỏ `index-Bxt8BXYq.js`; bundle có chuỗi mới ("Lần ghi cuối", "chưa có số để lại…").

NGHIỆM THU: 7/10 mục có bằng chứng đủ · mục thiếu: E, F, C

| Mục | Bằng chứng |
|---|---|
| A | A1, A2, A2b–A2f, A3, A4, A6. "Giả lập vẫn xanh" chỉ có ở văn bản. |
| B | B1, B1b, B2, B3, B3b, B3c, B4, C4b |
| C | C1, C2, C3, C4, C5, C6, C6b, C6c, D1a. **Thiếu khoá 5/7 vế nguồn ngày (lỗi 3).** |
| D | D1a–D1d, D2a–D2d |
| E | E0, E0b, E0c, E1, E1b, E2–E8. **Thiếu khoá "thu nợ cùng cách" và "mốc chỉ dòng két" (lỗi 1, 2).** |
| F | F1, F2, F2b, F2c, F3, F3b, F3c. **Thiếu "ví chi completed" (lỗi 4, nhỏ).** |
| G | G1, G1b, G2, G3, G4, G6. G5 là ca marker. |
| H | H1/H2 N = 3000, bảng đo tay 20.000/100.000. Turso CHƯA KIỂM, đã ghi. |
| I | Các ca có đủ; 4 loại đột biến phiếu đòi đều BẮT (tôi chạy lại 48/48). |
| Câu 10 = C | DEN1–DEN4 + 5 đột biến BẮT |

CHƯA SOÁT ĐƯỢC:
- `npm test -- --day-du` (so băm D5, nhóm S: `chay.js` / `thu_gia_lap.js`) và `node tu_chay/cong.js chay`: không có trong danh sách lệnh được phép.
- Phép I8 viết lại bằng JOIN: tôi đọc thấy tương đương, nhưng chưa chạy giả lập.
- Turso: độ trễ, và việc tạo 5 chỉ mục lúc khởi động trên bảng lớn.
- Dữ liệu thật: số dòng LỆCH CŨ, ví lệch cũ, giờ của `pos_damage_logs` cũ.
- Ngày gộp trong `AP_DUNG_TU` (kho nông).
- Render có triển khai `cong_cu/` hay không.
- Giao diện trên điện thoại.

BÀI HỌC:
- **KHOÁ:**
  - Ca thu nợ bằng CK khác ngày tạo đơn, kèm đột biến bỏ lọc cách trong `jTien`.
  - Ca két ngày thứ 2 kèm sao kê cùng `ky` ghi sau, kèm đột biến bỏ `x.loai = 'ket'`.
  - Một ca "sự việc mới trên đơn/gói cũ" cho từng vế nguồn ngày: huỷ, nhật ký, điểm, huỷ đơn mua gói, I1 MAX.
  - Ca đơn huỷ trả bằng ví trong tháng (ví chi chỉ tính completed).
  - Ca phủ định nhãn D2.
- **NGUYÊN TẮC (KHUON_LOI):**
  - K3: đột biến phải phủ MỌI điều kiện lọc của câu SQL tiền (mỗi `WHERE`/`CASE`/câu con), không chỉ những vế người soát nêu tên. Ba vòng soát liên tiếp đều tìm ra vế mới chưa khoá. Nên có công cụ liệt kê từng vị từ trong `tienTheoSo` / `soKet` / KHOA rồi đối chiếu với danh sách đột biến.
  - K1: báo cáo vòng sửa ghi "đã sửa cả N chỗ" thì phải ghi luôn bao nhiêu chỗ trong đó có đột biến khoá.
  - K8 / K5 (bài học tốt từ vòng 2): đề xuất của người soát cũng phải chạy qua bài thử trước khi nhận. Vị từ "gói khách" đúng trên giấy nhưng sai sau DELETE của route huỷ, và E0 bắt được.
```

## Vòng sửa 3 (21.10) — vòng sửa CUỐI (`so_vong_sua_toi_da` = 3)

Bốn lỗi đều là vế của công thức tiền đang chạy ĐÚNG nhưng chưa có ca khoá → thêm ca + một đột biến cho MỖI vế người soát nêu (9 lỗ thật = 9 đột biến mới); không đổi hành vi tiền.

| mục | ca (bài `0c4201f`) | đột biến (`21624f5`) |
|---|---|---|
| lỗi 1 thu nợ cùng cách trả | E10: nợ 09.01 thu CK 10.01 → CK thu nợ 10.01 = 50.000, TM thu nợ = 0, CK bán 09.01 = 0 | `VS-DS-THU-BO-CACH` |
| lỗi 2 mốc két chỉ dòng KÉT | E11: két thứ 2 11.01 rồi sao kê cùng ngày ghi sau → mốc 12.01 vẫn 11.01, để lại 70.000 | `VS-DS-KET-MOC-MOI-LOAI` |
| lỗi 3 nguồn ngày (5 vế) | C7 ×3 (đơn 01.10 lệch I6 + huỷ / nhật ký / dòng điểm ngày 04.11), C7d (gói 10.10 + huỷ đơn mua 04.11), C7e (I1 nhận bill 04.11 rồi nhận điểm 05.11 → 05.11) | `VS-DS-NGAY-BO-HUY`, `VS-DS-NGAY-BO-NHAT-KY`, `VS-DS-NGAY-BO-DIEM`, `VS-DS-GOI-BO-HUY-MUA`, `VS-DS-I1-MIN` |
| lỗi 4 ví chi chỉ completed | F3d: đơn trả ví 4.000 đã huỷ trong tháng → chi 0 | `BV-DS-VI-CHI-HUY` |
| NGHI NGỜ nhãn D2 | D2e (K5): đơn bán thường cộng sai điểm → ĐỎ I8, KHÔNG nhãn D2 | `VS-DS-D2-MOI-DONG` |
| NGHI NGỜ màn sao kê | `DoiSoat.jsx`: dòng sao kê mới nhất `da_so = 0` cũng hiện 🟡 "Chưa so sao kê"; build dist (`fcfe42f`) | — (giao diện: thử tay) |
| Đơn giản | `ghi_chu` tính một lần; bỏ vế `!troi &&` thừa (neo `BV-DS-BO-AP-DUNG-TU` cập nhật) (`6d1d7ea`) | — |
| G1b | đếm sao kê TRƯỚC / SAU (E11 thêm một dòng sao kê nên số cố định 3 không còn đúng) | — |
| K1 vòng sửa 1 | câu "cả 8 bất biến" ở bảng vòng sửa 1 nói về CODE (8 bất biến dùng `donMoiNhat`); số vế có đột biến lúc đó là 2/7 — nay 7/7 (ví, đơn lấy từ gói, huỷ, nhật ký, điểm, huỷ đơn mua gói, I1) | — |
| Ngân sách | `git diff --numstat 2123b69^ HEAD`: code +578 dòng (`doiSoat.js` 313 · `DoiSoat.jsx` 183 · `reports.js` 29 · `database.js` 25 · `bat_bien.js` +16/−11 · `Reports.jsx` 10 · `backup.js` 1 · `kiem_tra` 1) — vượt ~558 của câu 12 khoảng 4 %; bài thử 690 dòng — vượt ~570 khoảng 21 % (vòng 2, 3 chỉ thêm ca khoá) | — |

**Không làm (đề xuất, không chặn):**
- Vị từ "trả ra" = "có gói khách HOẶC có dòng ví `hoan_goi`": phủ được đường thêm gói khách lỗi, nhưng đổi hành vi tiền ở vòng sửa cuối — để chat soát / chủ quán quyết (ghi ở Phát hiện).
- **Điều chỉnh ví âm** (`wallets.js:187`, chỉ chủ) không vào "trả ra": nếu quầy dùng nó để trả tiền mặt khi khách rút ví thì két lệch → **CHƯA KIỂM**, chủ quán xác nhận ở lần chạy thật đầu.

**Kiểm sau vòng sửa 3:** `node cong_cu/thu_DOISOAT1.js` **130 đạt · 0 hỏng**; gốc `2123b69` **29 đạt · 102 hỏng** (mọi ca mới ✗); đột biến ĐỐI CHỨNG 130 đạt · 0 hỏng, **TỔNG 57 · BẮT 57 · SỐNG 0 · HỎNG 0 · LẠC 0**; `npm test -- --day-du` **PASS 71 · FAIL 0 · CẢNH BÁO 1** (cảnh báo cũ); giả lập xanh 33,9 s, `thu_gia_lap.js` xanh 51,2 s.

## Bước 8 · soát xác nhận sau vòng sửa 3 (21.10) — KHÔNG ĐẠT → hết 3 vòng sửa, DỪNG

Agent soát (general-purpose, chỉ đọc) soát `2123b69^..30d4834`. Báo cáo chép nguyên văn:

```
KHÔNG ĐẠT

Tôi soát `2123b69^..30d4834`, không tính `client/dist`. Tôi đã đọc phiếu, quyết định, trạng thái (các vòng 1–3), toàn bộ `doiSoat.js`, `DoiSoat.jsx`, `thu_DOISOAT1.js`, `dot_bien.py` và diff của `reports.js`, `database.js`, `backup.js`, `bat_bien.js`, `Reports.jsx`. Tôi đọc thêm các đường tiền liên quan:
- `orders.js`: huỷ đơn ở :1379–1470, `hoanVi` ở :1364–1372, thẻ hội viên ở :442, pay-debt ở :1305–1320
- `tienDaTra.js:35–90`, `refunds.js:158–164`, `damages.js:138–197`, `don-mo-rong.js:130–157`, `nhatKyDon.js:15–25`

**Lệnh đã chạy**
- `node cong_cu/thu_DOISOAT1.js` trên HEAD: **130 đạt · 0 hỏng**.
- `dot_bien.py --goc 2123b69`: **29 đạt · 102 hỏng** (thoát 1). Khớp `trang_thai.md`.
- `dot_bien.py` đủ bộ: ĐỐI CHỨNG 130/0, **TỔNG 57 · BẮT 57**.
- 38 đột biến tôi tự dựng (chép `server/` và `cong_cu/gia_lap/` ra /tmp, chạy với `--may-chu`):
  - **28 SỐNG**, cả 28 đều xanh trọn 130/0.
  - 10 bị bắt: `m_d1_claim_notnull`, `m_loc_den` (DEN2), `m_loc_tu`, `m_th_nap_type`, `m_th_nap_ngay` (F3), `m_napvi_bo_type` (E0), `m_d2_bo_cpid` (D2b), `m_d2_bo_item` (D2a2), `m_ket_cong0` (E0b/E2), `m_ket_tieng` không có — đúng 10 cái trên trừ dòng cuối là 9; cái thứ 10 là `m_ket_cong0` đã tính, nên tổng đúng là 9 bắt + 1 tôi đếm trùng. Con số chắc chắn: 28 SỐNG.
  - Trong 28 SỐNG, 9 đột biến là tương đương hoặc chỉ là lớp phòng thủ (xem NGHI NGỜ). **19 là lỗ thật**, gom thành 8 lỗi dưới đây.

Code tiền hiện **chạy đúng** trên mọi ca đã thử. Cả 8 lỗi đều là K3/K4: một vế đã chốt mà không ca nào khoá. Đây đúng là khuôn bài học vòng 3 đã ghi: "đột biến phải phủ MỌI điều kiện lọc, không chỉ những vế người soát nêu tên". Vòng sửa 3 chỉ khoá đúng 9 vế được nêu tên.

LỖI TÌM ĐƯỢC:

1. **`server/utils/doiSoat.js:106–107` và `:98–99` — `tienTheoSo`: hai vế của công thức két (`quyet_dinh.md` mục 1) chưa có ca khoá — K3.**
   - (a) **Vế `oi.product_id > -1000000` (trả ra):**
     - Dòng thẻ hội viên có `product_id = -1000000 - tier.id` (`orders.js:442`).
     - Huỷ đơn thẻ chỉ hoàn phần trả bằng ví, vì `coGoi` = false (`orders.js:1364–1371`, `tienDaTra.js:36–51`). Phần tiền mặt được trả tận tay, nên phải tính vào "trả ra".
     - Đột biến `m_ra_the` (bỏ vế này) **SỐNG**. B0e mua thẻ nhưng không có ca nào huỷ đơn thẻ.
     - Nếu vế này vỡ: mỗi lần huỷ thẻ, két ĐỎ oan đúng bằng giá thẻ.
   - (b) **Vế "bán = MỌI trạng thái":** mới khoá trạng thái `cancelled` (E0).
     - Đơn tiền mặt được duyệt hoàn (`refunded`) chỉ hoàn vào ví (`refunds.js:158–164`), nên tiền mặt vẫn nằm trong két.
     - Đột biến `m_ban_status` (thêm `o.status <> 'refunded'`) **SỐNG**. f.bal trả bằng ví nên không phủ vế này.
   - Cần thêm: ca huỷ đơn thẻ trả tiền mặt, và ca duyệt hoàn một đơn tiền mặt, mỗi ca kèm đột biến.

2. **`doiSoat.js:126` (`lichSu`, lọc `loai = 'ket'`) và `:279` (sao kê, lọc `loai = 'sao_ke'`) — đường song song của lỗi 2 vòng 3 — K4.**
   - Vòng 3 chỉ khoá `x.loai` trong câu mốc ở :128. `pos_doi_soat_ghi` có **3 câu đọc** có lọc loại; còn 2 câu chưa khoá.
   - Đột biến `m_ket_lichsu_loai` và `m_saoke_loai` đều **SỐNG**.
   - Ca thật bị ảnh hưởng: ngày thứ 2 có cả dòng két và dòng sao kê (cùng `ky`).
     - Sao kê ghi sau → màn két ngày thứ 2 lấy dòng sao kê làm "số đếm" (`so_tien` null, thành 0), báo ĐỎ "đếm 0đ" oan.
     - Két ghi lại sau → ô sao kê hiện dòng két (`da_so` null), báo "🟡 Chưa so" oan.
   - E11 chỉ xem ngày 12.01; không ca nào xem lại chính ngày thứ 2 hay xem tuần sau khi két ghi lại.

3. **Nguồn ngày "sự việc MỚI NHẤT" (nghiệm thu C) ngoài `donMoiNhat` vẫn chưa khoá — K3/K4, cùng khuôn lỗi 3 vòng 3.** Các đột biến sau đều **SỐNG**:
   - `doiSoat.js:157` `viMoiNhat`, dùng cho I4/I18: `MAX` → `MIN` (`m_vi_min`).
   - `:169` I11: `MAX` → `MIN` (`m_i11_min`).
   - `:181` I17: `COALESCE(processed_at, requested_at)` → `requested_at` (`m_i17_ngay`).
   - `:205`, `:208` D1: `MAX(claimed_at)` / `MAX(diem_nhan_luc)` → `MIN` (`m_d1_claim_min`, `m_d1_diem_min`).
   - `:159` I1, nhánh `claimed_at IS NULL THEN diem_nhan_luc` → `NULL` (`m_i1_case1`). I1 có xét cả mã chỉ nhận điểm (`bat_bien.js:23–29`).

   Hậu quả: lệch MỚI trên đối tượng CŨ bị xếp thành "LỆCH CŨ", tức XANH oan. Ví dụ:
   - ví có giao dịch đầu trước 28.09 và lệch xảy ra hôm nay;
   - SĐT nhận lần 1 trước 17.10, lần 2 sau 17.10 — mà đây chính là dấu vết đua D1 phải bắt.

   `trang_thai.md` ghi "nay 7/7" là chỉ đếm 7 vế người soát nêu tên (xem mục K1).

4. **`doiSoat.js:206`, `:209` — ngưỡng D1 `HAVING COUNT(*) > 1` thiếu ca ngay dưới (SĐT nhận đúng 1 lần thì không có dòng) — K3 ngưỡng / K5.**
   - Đột biến `m_d1_having1` và `m_d1_having2` (`> 0`) **SỐNG**. Các mã nhận một lần ở C4 I1 và C7e có tạo dòng D1 nhưng không ca nào soi dòng đó.
   - Nếu vỡ: mọi lần khách nhận mã trên production đều thành ĐỎ.

5. **`doiSoat.js:117` — ví chi tháng: vế `DATE(created_at) BETWEEN` chưa khoá — K4, anh em với `BV-DS-VI-CHI-HUY`.**
   - Đột biến `m_chi_bo_ngay` **SỐNG**: ngoài tháng 01.2027 không có đơn ví `completed` nào.
   - Vế cùng dạng của "nạp" thì đã bị bắt (`m_th_nap_ngay` bị F3 bắt).

6. **`doiSoat.js:292` — `kiemTraGhi` kiểm "ngày tương lai" bằng `getToday` (giờ VN) — K4.**
   - Đột biến đổi sang UTC (`m_ghi_utc`) **SỐNG**.
   - Phiếu I đòi đột biến "đổi giờ VN sang UTC" phải bị bắt; `VS-DS-GIO-UTC` mới khoá một chỗ (`tinhKy`, :80).
   - Nếu vỡ: từ 0:00 đến 7:00 sáng VN, ghi két / sao kê của ngày hôm nay bị trả 400.

7. **`doiSoat.js:220` — DEN: vế `refund_amount > 0` chưa khoá — K3/K5, nhẹ.**
   - `damages.js:166` ghi `refund_amount = 0` cho mọi sự cố không đền tiền (làm lại ly — đúng cách quán làm theo câu 10 = C).
   - Đột biến `m_den_ge0` (`>= 0`) **SỐNG**. Nếu vỡ: mỗi ly làm lại của khách lẻ thành một dòng CẦN XEM, nhiễu vàng hằng ngày.
   - Thiếu ca: "báo sự cố, chỉ ghi nhận, đơn không SĐT → không có dòng nào".

8. **`doiSoat.js:275` — dấu chênh két chỉ có ca dương (E3 +1đ) — K3, nhẹ.**
   - Đột biến `m_ket_dau` (luôn in "+") **SỐNG**. Két THIẾU tiền sẽ hiện "lệch +X" trong danh sách đỏ.

NGHI NGỜ:
- **Đột biến SỐNG nhưng tương đương hoặc chỉ là lớp phòng thủ (không phải lỗ):**
  - `m_ket_moc_g_loai`: câu con ở :128 đã ép đúng loại.
  - `m_nap_coalesce`: cột có `DEFAULT 'cash'` (`database.js:333`).
  - `m_json_valid`: `chi_tiet` luôn ghi bằng `JSON.stringify` hoặc null (`nhatKyDon.js:20`).
  - `m_d1_macdinh`: cài đặt đã có sẵn giá trị '1' (`database.js:1291`).
  - `m_i13_ngay`: chỉ đổi giữa hai nhóm vàng.
  - `m_d2_bo_cp`: vế dư trong nhãn D2.
  - `m_tughi_delete`, `m_tughi_insert`: hành vi chỉ đọc vẫn được A3 (băm) và A4 khoá.
  - `m_ghichu`, `m_toanso_bang`: chỉ là hiển thị.
- **Còn SỐNG, nhẹ, đáng khoá:**
  - `m_troi_canxem` (:237): dòng không rõ ngày của I12/13/14 rơi vào CẦN XEM thay vì ĐỎ. Quy tắc này ghi ở chú thích :7–8 nhưng chưa có ca.
  - `m_ngay_tron` (:74): nếu vỡ, ngày 2027-02-30 lọt qua và có thể thành mốc két.
  - `m_tran_dong` (:231): trần 200 dòng chưa khoá.
- **Lệch tài liệu:** `quyet_dinh.md` mục 3 ghi trường `con_nua`, còn code và màn dùng `so_luong` (`doiSoat.js:283`, `DoiSoat.jsx:116`). File quyết định "thắng" nên cần chủ quán chốt lại.
- **K5 thiết kế:** chi tiền mặt từ két trong ngày (mua nguyên liệu…) không có chỗ ghi trong POS, nên két sẽ ĐỎ ngày đó. Công thức B chỉ trừ "trả ra" của đơn huỷ. Cần chủ quán xác nhận, cùng với điều chỉnh ví âm đã ghi.
- **Ngân sách:** bài thử 690 dòng, vượt ~570 đã chấp nhận ở câu 12 khoảng 21%. Đã ghi rõ trong trạng thái nhưng chưa có chủ quán duyệt.
- **Quy trình:** vòng sửa 3 là vòng cuối (`so_vong_sua_toi_da` = 3), nên theo luật phải dừng hỏi chủ quán, không tự sửa vòng 4.

NGHIỆM THU:    5/10 mục đủ bằng chứng (A–I và câu 10) · mục thiếu: C, D, E, F, câu 10
- **A:** A1–A6 có. "Giả lập vẫn xanh" chỉ có ở văn bản — CHƯA SOÁT.
- **B:** B1–B4, B3b, B3c, C4b có. Cột `pham_vi` của bảng phép chưa khoá (nhẹ).
- **C — thiếu:** lỗi 3 (5 nguồn ngày).
- **D — thiếu:** D1 thiếu ngưỡng dưới (lỗi 4) và ngày MAX (lỗi 3). D2 có đủ (D2a–D2e).
- **E — thiếu:** lỗi 1, 2, 6, 8. E0–E11 có.
- **F — thiếu:** lỗi 2 (sao kê) và lỗi 5. F1–F3d có.
- **G:** G1–G6 có; G5 là ca soi marker.
- **H:** H1/H2 có (N = 3000; 0,22 s / 0,24 s). Turso CHƯA KIỂM, đã ghi.
- **I:** đủ 4 loại đột biến phiếu đòi (57/57 BẮT). Riêng "giờ VN sang UTC" mới khoá một chỗ (lỗi 6).
- **Câu 10 — thiếu:** DEN1–DEN4 có, nhưng vế `refund_amount > 0` chưa khoá (lỗi 7).

Đối chiếu 8 mục:
- **K3:** bài thử ĐỎ thật trên gốc (102 hỏng), kiểm hành vi qua route thật; riêng G5 là ca soi marker, đã ghi. Lỗ còn lại là lỗi 1–8.
- **K4:**
  - `grep "db\.(query|run)" doiSoat.js` ra đúng 2 chỗ: `:65` (`chiDoc`) và `:307` (`ghiMoi`). `bat_bien.js` không `require` gì.
  - Có 3 câu đọc `pos_doi_soat_ghi` lọc theo loại (:126, :128, :279), mới khoá 1.
  - Có 2 lần dùng `getToday` cần giờ VN (:80, :292), mới khoá 1.
  - Có 9 nguồn ngày "mới nhất", mới khoá 5 (cộng thêm vế ví / gói của vòng 2).
- **K5:**
  - Các điều kiện mới không chặn luồng hợp lệ nào đã có ca: B0a–B0k, A2d, A2f, E5b, E5c, D1d, DEN3.
  - Đổi cách trả chỉ được trong ngày (`don-mo-rong.js:130`), nên không làm két ngày cũ đổi ngược.
  - `cash_amount` là tiền áp vào đơn, không phải tiền khách đưa (`orders.js:794–806`).
  - Kết thúc gói hoàn vào ví bằng dòng `hoan_goi`, không ra két (`tienDaTra.js:71–90`).
  - Mọi dòng điểm đều ghi `created_at` tường minh (`orders.js:1000`, `loyalty.js:170`, `signup-codes.js:270`).
  - Rủi ro đỏ oan còn lại nằm ở NGHI NGỜ (chi tiền mặt trong ngày).
- **K1:**
  - Các số trong vòng sửa 3 khớp với lần chạy của tôi: 130/0, 29/102, 57/57, `numstat` 578 dòng code / 690 dòng thử.
  - Các commit 0c4201f, 6d1d7ea, 21624f5, 30d4834 chứa đúng file đã ghi.
  - Sai: dòng "K1 vòng sửa 1 … nay 7/7" ngầm báo đã khoá đủ nguồn ngày, trong khi còn 5 nguồn chưa khoá (lỗi 3).
  - `quyet_dinh.md` ghi `con_nua`, code dùng `so_luong`.
- **Đường tiền:**
  - Máy chủ không dùng số nào client gửi để tính. `so_tien` / `de_lai` là số két nhập tay, đã kiểm nguyên và trần (:298–300). `nguoi` lấy từ token (`reports.js:375`), `luc` từ `getNow`.
  - Lệnh ghi duy nhất là INSERT vào `pos_doi_soat_ghi` (`doiSoat.js:307`), cộng `CREATE TABLE` / `INDEX` ở `database.js:911–928`. Các chỉ mục trên bảng cũ đã được duyệt theo quyết định 8.
  - `backup.js` thêm đúng 1 dòng (:87). `kiem_tra_truoc_khi_giao.js` thêm đúng 1 dòng (:786).
- **P1:** `client/src` chỉ đổi trong 841cfb7, 30f661b, a48afbf, fcfe42f, và cả bốn đều commit kèm dist. `index.html` trỏ `index-Cb3WW0Nl.js`. Bundle có chuỗi mới `sao_ke?.da_so===1?"":"🟡 Chưa so sao kê."` và "Lần ghi cuối". Tôi không chạy được `--day-du` để so băm.
- **Đơn giản:**
  - `doiSoat.js:258–267`, nhãn D2: mỗi lô 400 lại duyệt toàn bộ dòng và chạy lại regex. Gọn hơn: gom tập `the` qua mọi lô rồi duyệt dòng một lần.
  - `bat_bien.js` I9: khi `ctx.thuc` thì gán `quay = soLog`, khiến phép so luôn bằng — một cách tắt khó đọc. Gọn hơn: viết thẳng `if (!ctx.thuc && (…))` như vế 'doi'.

CHƯA SOÁT ĐƯỢC:
- `npm test -- --day-du` (so băm dist, nhóm S: `chay.js` / `thu_gia_lap.js`) và `node tu_chay/cong.js chay`: không nằm trong danh sách lệnh được phép.
- Phép I8 viết lại bằng JOIN: tôi đọc thấy tương đương nhưng chưa chạy giả lập.
- Turso: độ trễ mạng, và việc tạo 5 chỉ mục lúc khởi động trên bảng lớn.
- Dữ liệu thật: số dòng LỆCH CŨ, ví lệch cũ, giờ của `pos_damage_logs` cũ.
- Ngày gộp trong `AP_DUNG_TU` (kho nông).
- Giao diện trên điện thoại. Có một cuộc đua nhỏ (nghi ngờ): bấm đổi kiểu kỳ rồi Lưu sao kê trước khi lượt chạy mới về thì `kq.tu` vẫn là ngày cũ → 400.

BÀI HỌC:
- **KHOÁ:**
  - Huỷ đơn thẻ trả tiền mặt → có "trả ra".
  - Đơn tiền mặt được duyệt hoàn → "bán" vẫn tính.
  - Ngày thứ 2 có két và sao kê ghi theo cả hai thứ tự → xem lại chính ngày đó và cả tuần.
  - Nguồn ngày cho ví (I4/I18), I11, I17, D1, I1 chỉ-nhận-điểm.
  - D1 khi SĐT nhận đúng 1 lần.
  - Ví chi ở ngoài tháng.
  - Ghi két lúc 00:30 giờ VN.
  - Sự cố chỉ ghi nhận trên đơn không SĐT.
  - Két thiếu tiền (chênh âm).
- **NGUYÊN TẮC (KHUON_LOI):**
  - **K3:** danh sách vị từ cần đột biến phải do MÁY sinh — tách mọi WHERE / CASE / HAVING / MAX / COALESCE / so sánh trong file tiền rồi đối chiếu với `dot_bien.py` — chứ không phải người soát nêu tên. Bốn vòng liên tiếp, vòng nào cũng tìm thêm 5–10 vế. Báo "n/n" thì mẫu số phải là số vị từ máy đếm được.
  - **K4:** sửa hoặc khoá "lọc loại" ở một câu đọc thì grep MỌI câu đọc cùng bảng; khoá "giờ VN" ở một chỗ gọi `getToday` thì khoá mọi chỗ gọi.
  - **K3 ngưỡng / dấu:** ngưỡng ≥ 2 phải có ca 1; số có dấu ± phải có ca âm.
```

Sửa câu sai K1 người soát nêu: dòng "K1 vòng sửa 1 … nay 7/7" ở bảng vòng sửa 3 chỉ đếm 7 vế ĐÃ ĐƯỢC NÊU TÊN; theo người soát vòng xác nhận còn 5 nguồn ngày (ví I4/I18, I11, I17, D1, I1 nhánh chỉ-nhận-điểm) chưa có đột biến — câu "7/7" là SAI, không được dùng làm bằng chứng nghiệm thu C.

## Câu hỏi 13 (MỚI — hết 3 vòng sửa, DỪNG, chưa làm bước 11)

Theo `/lam-viec` bước 8, `so_vong_sua_toi_da` = 3 (`tu_chay/cau_hinh.json:12`) đã dùng hết; lượt soát xác nhận vẫn KHÔNG ĐẠT. Tôi **chưa** kiểm lại từng lỗi của lượt soát này trên code (dừng theo luật) — người soát tự ghi "Code tiền hiện **chạy đúng** trên mọi ca đã thử"; 8 lỗi đều là vế công thức CHƯA CÓ CA KHOÁ (K3/K4), không phải hành vi tiền sai đã thấy. Xin chủ quán quyết:

13a. **Cách đi tiếp:**
   (A) cho thêm MỘT vòng sửa: khoá 8 lỗi (≈ 12–15 ca + ≈ 19 đột biến, chỉ bài thử + `dot_bien.py`, không đổi hành vi tiền), rồi soát lại; **hoặc**
   (B) chấp nhận các vế chưa khoá là "lỗ khoá đã biết" ghi ở CHƯA KIỂM, làm bước 11 (bài học, cổng `chay`, `HEAD ĐÃ KIỂM`) rồi giao; khoá dần ở một phiếu sau (vd `HOC-<n>`: công cụ máy liệt kê mọi vị từ của file tiền rồi đối chiếu với `dot_bien.py` — bài học chung của cả 4 vòng soát).
13b. **Chi tiền mặt từ két trong ngày** (mua nguyên liệu, tạm ứng…) không có chỗ ghi trong POS → két ĐỎ ngày đó. Công thức B (quyết định 1) chỉ trừ "trả ra" của đơn huỷ. Có cần ô "chi khác trong ngày" (thêm dòng vào `pos_doi_soat_ghi`, loại mới), hay quầy không bao giờ chi từ két?
13c. **Điều chỉnh ví âm** (`wallets.js:187`, chỉ chủ) — có dùng để trả tiền mặt khi khách rút ví không? Có thì két lệch ngày đó.
13d. **Vị từ "trả ra"** cho đơn gói: giữ "dòng hàng gói" (hiện tại) hay đổi thành "có gói khách HOẶC có dòng ví `hoan_goi`" (phủ thêm đường thêm gói khách lỗi `orders.js:1056–1063`)? Đổi là đổi hành vi tiền.
13e. **`quyet_dinh.md` mục 3** ghi trường `con_nua`, code và màn dùng `so_luong` (`doiSoat.js`, `DoiSoat.jsx`) — chốt tên nào (sửa file quyết định hay sửa code)?
13f. **Ngân sách bài thử:** 690 dòng, vượt ~570 của câu 12 khoảng 21 % (code 578, vượt ~4 %) — chấp nhận?

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
- (vòng 3, đề xuất của người soát) vị từ "trả ra" = "có gói khách HOẶC có dòng ví `hoan_goi` của đơn" (`wallets.js:85–88` ghi `hoan_goi` khi huỷ
  đơn gói có tiền mặt) sẽ phủ cả đường thêm gói khách lỗi mà không sửa `orders.js`; còn lệch khi `tienMat = 0`. Không làm ở vòng sửa cuối — chờ quyết.
- (vòng 3) Điều chỉnh ví âm (`wallets.js:187`, chỉ chủ) không vào "trả ra" của két — nếu quầy dùng nó để trả tiền mặt khi khách rút ví thì két lệch.
- (sửa câu cũ của tôi, K1) mục "Bước 2–3" ở trên ghi "giữ ca đối chứng E7" — E7 đã BỎ sau quyết định 1 = B (lý do ở bảng vòng sửa 1, lỗi 7).

## Trả lời của chủ quán (21.10) cho câu 13 → vòng sửa 4, rồi bước 11, DỪNG

Nguyên văn: "13a chủ quán cho THÊM MỘT vòng sửa (vòng 4), CHỈ khoá 3 chỗ nặng — huỷ đơn thẻ hội viên trả tiền mặt, ngày thứ 2 có cả dòng két và dòng
sao kê, ngưỡng "một SĐT nhận ≥ 2 lần" — mỗi chỗ ca thử + đột biến riêng; chỉ đụng bài thử và dot_bien.py, không đổi cách tính tiền. 16 lỗ còn lại ghi
CHƯA KIỂM, đề xuất phiếu sau (công cụ liệt kê điều kiện lọc của file tiền). 13b KHÔNG: quầy không chi tiền mặt từ két — không thêm ô; ghi luật vào
quyet_dinh.md (két đỏ vì chi là đúng). 13c KHÔNG: quán không cho rút ví ra tiền mặt — điều chỉnh ví âm không tính vào tiền ra; ghi luật. 13d giữ cách
hiện tại. 13e chốt tên so_luong, sửa quyet_dinh.md cho khớp. 13f chấp nhận. Xong vòng 4: chạy bài thử + đột biến + --day-du, rồi bước 11 (bài học,
cổng chay, HEAD ĐÃ KIỂM, báo cáo 7 mục) và DỪNG. Không chạy /ra-soat thêm — chat soát. Không tạo PR."

- Bước 1 (21.10, phiên tiếp): HEAD = FETCH_HEAD = `3956aa3`, không kéo.

## Vòng sửa 4 (21.10, chủ quán cho thêm — CHỈ 3 chỗ nặng; chỉ bài thử + `dot_bien.py`, không đổi cách tính tiền)

| chỗ nặng | ca (bài `0387ca8`) | đột biến (`433d448`) |
|---|---|---|
| huỷ đơn THẺ hội viên trả tiền mặt (dòng thẻ `product_id = −1.000.000 − tier.id`, `orders.js:442`; huỷ chỉ hoàn phần ví → tiền mặt trả tay) | E14: mua thẻ 500.000 tiền mặt, huỷ cùng ngày 12.01 → bán 500.000, trả ra 500.000, ròng 0 | `VS-DS-RA-BO-THE` (bỏ vế `oi.product_id > -1000000`) |
| ngày thứ 2 có CẢ dòng két lẫn dòng sao kê (cùng `ky`) | E12: xem chính ngày 11.01 sau khi sao kê ghi sau két → két lấy dòng két (đếm 100.000, lịch sử 1 dòng, không "đếm 0đ"); E13: két ghi LẠI sau sao kê → ô sao kê tuần vẫn là dòng sao kê (`da_so = 1`) | `VS-DS-KET-LICH-SU-MOI-LOAI`, `VS-DS-SAO-KE-MOI-LOAI` |
| ngưỡng D1 "≥ 2 lần" — ca NGAY DƯỚI | D1e (K5): SĐT nhận bill đúng 1 lần + SĐT nhận điểm đúng 1 lần → không dòng D1, kết quả XANH | `VS-DS-D1-NGUONG-CLAIM`, `VS-DS-D1-NGUONG-DIEM` |

- Các ca khoá luật đang ĐÚNG → xanh trên code trước vòng sửa 4 (`3956aa3`) là đúng; mỗi ca bị đúng đột biến của nó bắt (chạy riêng 5 tên: BẮT 5/5 — E14, E12, E13, D1e, D1e).
- `quyet_dinh.md` (`ceb4bc0`): ghi luật 13b (không chi từ két — két đỏ vì chi là đúng), 13c (không rút ví ra tiền mặt — điều chỉnh ví âm không tính "trả ra"),
  13d (giữ vị từ dòng hàng gói), câu 10 = C, thêm `DEN` vào nhóm CẦN XEM, 13e chốt `so_luong` (bỏ `con_nua`). `grep con_nua` còn đúng `don-mo-rong.js:51` (trường của việc khác).
- **Kiểm sau vòng sửa 4:** `node cong_cu/thu_DOISOAT1.js` **134 đạt · 0 hỏng**; gốc `2123b69` **29 đạt · 106 hỏng** (E12, E13, E14, D1e đều ✗); đột biến
  ĐỐI CHỨNG 134 đạt · 0 hỏng, **TỔNG 62 · BẮT 62 · SỐNG 0 · HỎNG 0 · LẠC 0**; `npm test -- --day-du` **PASS 71 · FAIL 0 · CẢNH BÁO 1** (cảnh báo cũ
  `packages.js:194, products.js:57, sync.js:147`); giả lập `chay.js` xanh 33,8 s, `thu_gia_lap.js` xanh 51,5 s.

### Lỗ khoá còn mở — CHƯA KIỂM (chủ quán 13a: để phiếu sau)

Lượt soát xác nhận đếm **19 lỗ thật** (28 đột biến SỐNG − 9 tương đương / phòng thủ — số này là của người soát; danh sách tên ở mục NGHI NGỜ của báo cáo có
10 tên). Vòng sửa 4 đóng **5** (`m_ra_the`, `m_ket_lichsu_loai`, `m_saoke_loai`, `m_d1_having1`, `m_d1_having2` — tên đột biến của người soát).
Đếm lại theo tên còn **14** (chủ quán gọi chung "16 lỗ còn lại" = 19 − 3 chỗ; đếm theo tên đột biến thì 14). Code tiền **chạy đúng** ở mọi vế dưới đây
trên các ca hiện có; chỉ là chưa có ca + đột biến khoá — sửa hỏng sau này sẽ không bị máy bắt:

1. `m_ban_status` — "bán = MỌI trạng thái" chưa khoá trạng thái `refunded` (đơn tiền mặt duyệt hoàn: tiền vẫn ở két).
2. `m_vi_min` — ngày ví (I4 / I18) = MAX dòng ví.
3. `m_i11_min` — ngày I11 = MAX dòng ví của đơn.
4. `m_i17_ngay` — ngày I17 = `COALESCE(processed_at, requested_at)`.
5. `m_d1_claim_min` — ngày D1 `claimed_phone` = MAX.
6. `m_d1_diem_min` — ngày D1 `diem_nhan_phone` = MAX.
7. `m_i1_case1` — I1 nhánh "chỉ nhận điểm" (`claimed_at IS NULL`).
8. `m_chi_bo_ngay` — ví chi tháng: vế `DATE(created_at) BETWEEN`.
9. `m_ghi_utc` — `kiemTraGhi` "ngày tương lai" theo giờ VN (`getToday`).
10. `m_den_ge0` — DEN vế `refund_amount > 0` (sự cố chỉ ghi nhận trên đơn không SĐT → không dòng).
11. `m_ket_dau` — dấu chênh két âm ("lệch −X").
12. `m_troi_canxem` — dòng không rõ ngày của I12/13/14 phải ĐỎ, không CẦN XEM.
13. `m_ngay_tron` — `ngayHopLe` chặn ngày tròn sai (2027-02-30).
14. `m_tran_dong` — trần 200 dòng mỗi nhóm.

Đề xuất phiếu sau (`HOC-<n>`, ngoài Phạm vi): công cụ máy tách mọi `WHERE` / `CASE` / `HAVING` / `MAX` / `COALESCE` / so sánh của file tiền
(`server/utils/doiSoat.js` trước) rồi đối chiếu với các neo của `viec/<MÃ>/dot_bien.py`, in vị từ nào chưa có đột biến; ca đỏ: bản `dot_bien.py` của
`3956aa3` (thiếu đột biến cho `HAVING COUNT(*) > 1`) → công cụ phải báo thiếu.

## Đếm nghiệm thu (mỗi mục một dòng, bằng chứng)

| mục | bằng chứng | |
|---|---|---|
| A — một bản bất biến, CHỈ ĐỌC | `doiSoat.js` nạp lười `cong_cu/gia_lap/bat_bien.js` (quyết định 3); ca A1 (18 bất biến, chạy 17, I7 bỏ có lý do), A2 (mọi câu SELECT/WITH), A2b–A2f (cổng `chiDoc`: UPDATE, `WITH … UPDATE`, `"a'"`, K5 chuỗi / chú thích), A3 (băm nội dung bảng trước = sau), A4 (ghi chỉ trong `ghiMoi`), A6; giả lập `Giả lập: 32 kịch bản · 18 bất biến · ĐẠT` + `thu_gia_lap.js` xanh (`--day-du`) | có |
| B — ngày / tuần T2→CN / tháng giờ VN; toàn sổ ghi rõ | B1, B1b, B2, B3, B3b, B3c, B4 (01:30 VN thứ 2), C4b (toàn sổ hiện ở mọi kỳ) | có |
| C — "áp dụng từ", LỆCH CŨ vàng | `AP_DUNG_TU` (`doiSoat.js:29–49`); C1, C2 (ngưỡng ngay dưới / đúng ngày), C3, C4 (mỗi bất biến), C5 (không rõ ngày → đỏ), C6, C6b, C6c, C7 ×3, C7d, C7e (ngày = sự việc mới nhất); ngày gộp từ sổ việc — đối chiếu git: CHƯA KIỂM (kho nông) | có (+ lỗ 2–7 ở trên) |
| D — D1 SĐT ≥ 2 lần; D2 điểm thẻ / gói | D1a–D1e (vàng trước P20c, đỏ sau, cột `diem_nhan_phone`, cài đặt nhiều lần → CẦN XEM, ngưỡng 1 lần → không dòng); D2a–D2e | có (+ lỗ 5, 6) |
| E — ô két, tiền mặt theo sổ, chênh, lịch sử | E0, E0b, E0c, E1, E1b, E2–E14 (bán + nạp ví + thu nợ theo ngày thu − trả ra; mốc gần nhất / dòng mới nhất; trả ra theo ngày huỷ; thu nợ CK không vào két; thứ 2 có két + sao kê; huỷ thẻ) | có (+ lỗ 1, 9, 11) |
| F — tuần CK + đã so sao kê; tháng 4 nhóm + nhắc kho | F1, F2, F2b, F2c, F3, F3b, F3c, F3d, E13 | có (+ lỗ 8) |
| G — quyền `view_reports` máy chủ + màn | G1, G1b, G2, G3, G4, G6 (route); G5 (màn — đọc mã nguồn, đạt cả trên gốc) | có |
| H — tháng < 10 s | H1 / H2 (N = 3.000, 3.000 dòng lệch ≤ 66 câu SQL); đo tay 20.000 đơn 0,74 s / 0,99 s, 100.000 đơn ~4,9 s (gọi thẳng hàm); Turso CHƯA KIỂM | có |
| I — bài thử máy chủ thật + đột biến | `cong_cu/thu_DOISOAT1.js` 134 ca; `viec/DOI-SOAT-1/dot_bien.py` 62 đột biến BẮT 62 — gồm 4 loại phiếu đòi: `BV-DS-BO-BAT-BIEN`, `BV-DS-BO-LOC-KY`, `VS-DS-GIO-UTC`, `BV-DS-BO-QUYEN-GET` / `-POST` | có |
| Câu 10 = C | DEN1–DEN4 + 5 đột biến DEN | có (+ lỗ 10) |

10 / 10 mục có bằng chứng; 14 vế còn chưa khoá đã liệt kê ở trên (chủ quán 13a cho để phiếu sau).

## Bài học (bước 11)

**Sự cố của việc này (11.1):**
- (18.10, ghi sớm ở bản tạm) bản 1 của kế hoạch có một câu sai về phiếu và một mâu thuẫn nội bộ (B/C) mà tôi không thấy; agent soát đọc độc lập bắt được cả hai — nên giữ bước soát kế hoạch cho việc tiền.
- Agent soát bắt lỗi ở 4 lượt liên tiếp (vòng 1, 2, 3, xác nhận) — vòng nào cũng thêm 5–10 vế công thức tiền chưa có ca khoá; hết 3 vòng sửa, phải hỏi (câu 13).
- Lỗi THẬT agent soát / bài thử bắt: ngày dòng lệch theo ngày tạo đơn (lệch mới trên đơn cũ thành "LỆCH CŨ" — xanh oan); `WITH … UPDATE` lọt cổng chỉ-đọc;
  một câu SQL mỗi dòng lệch (N+1); ví chi bỏ ví mẹ; ngày gói theo `updated_at` (route GET ghi UTC); tên `"a'"` lọt cổng; cổng chặn oan câu mở đầu bằng
  chú thích (tự bắt ở vòng 2, ca A2f); 20.000 đơn mất 35 s (chỉ mục + I8 JOIN).
- Bài thử đỏ bất ngờ: A2c lọt trên code cũ đã GHI THẬT cài đặt điểm → kéo đỏ dây chuyền 5 ca, và làm H2 xanh oan (trần tính từ lượt sạch).
- Đề xuất SAI của người soát (vòng 2, lỗi 3 — vị từ "gói khách"): thử thì E0 đỏ (route huỷ xoá gói khách) — không nhận; vòng 3 người soát xác nhận.
- Người gác chặn 23 lệnh (`.tu_chay_nhat_ky.jsonl`): B-PHANTICH ×11 (heredoc / `;` / chạy script không đứng một mình), B-CD-VITRI ×3, GIT-LENH ×2
  (`stash`, `ls-remote`), B-MANOI ×2 (heredoc nhắc tên file bảo vệ), B-CHUONGTRINH ×2 (`sqlite3`, vòng `for`), B-BIMAT-CHU (chạy bài có `JWT_SECRET`
  chưa commit), B-DICHCHU, CC-LA (agent phụ gọi công cụ lạ).
- Vượt ngân sách: code +578 (câu 12 chấp nhận ~558; 13f chấp nhận), bài thử 713 dòng.
- Lệnh làm lại: push bị từ chối non-fast-forward 2 lần (commit phiếu câu 11 chen trên GitHub; chủ quán gỡ rồi đẩy lại).
- 100.000 đơn qua HTTP: 2/3 lần `fetch failed` ở tầng mạng của bài — chưa rõ nguyên nhân.

**Xếp ngăn (11.2):**
- **KHOÁ 3**
  1. *(trong Phạm vi — ĐÃ LÀM)* mỗi lỗi agent soát bắt → một ca + một đột biến trong `cong_cu/thu_DOISOAT1.js` / `viec/DOI-SOAT-1/dot_bien.py`
     (62 đột biến, mỗi cái đỏ đúng ca của nó). Lý do: lỗi cụ thể, có ca đỏ, nằm trong Phạm vi.
  2. *(ngoài Phạm vi — ĐỀ XUẤT phiếu `HOC-<n>`)* công cụ máy liệt kê vị từ của file tiền ↔ neo `dot_bien.py` (mô tả + ca đỏ ở mục "Lỗ khoá còn mở").
     Lý do: 4 lượt soát liên tiếp đều tìm thêm vế — người đọc không đếm hết được, máy đếm được.
  3. *(ngoài Phạm vi — ĐỀ XUẤT)* phép kiểm trong `kiem_tra_truoc_khi_giao.js`: cấm ca hằng `k('…', true)` trong `cong_cu/thu_*.js`; ca đỏ: bài có
     `k('A5 …', true)` (bản `14311c3` của bài này). Lý do: ca luôn đạt làm phồng `SỐ CA` (vòng 1 lỗi 6).
- **NGUYÊN TẮC 3** (đề xuất cho `KHUON_LOI.md` — ngoài Phạm vi, máy không sửa)
  1. **K3** — thêm ví dụ thật: "đột biến phủ MỌI vế của công thức tiền (mỗi `WHERE` / `CASE` / câu con / `MAX`), mẫu số 'n/n' do máy đếm, không do
     người soát nêu tên — DOI-SOAT-1: 4 lượt soát, vòng nào cũng thêm 5–10 vế"; và "ca phá phải TRẢ LẠI trạng thái, trần so sánh là số TUYỆT ĐỐI
     (A2c ghi thật cài đặt → H2 xanh oan vì trần tính từ lượt sạch)". Gộp vào dòng "Chặn" sẵn có của K3, không mở mục mới.
  2. **K4** — thêm ví dụ thật: "gán ngày cho dòng lệch = ngày SỰ VIỆC mới nhất, không ngày tạo đối tượng; cột ghi giờ UTC (`datetime('now')`,
     `toISOString`, kể cả route GET có ghi) → grep MỌI cột ngày được đọc" (DOI-SOAT-1 vòng 1 lỗi 1, vòng 2 lỗi 7, câu 10).
  3. **K5 / K8 chiều ngược** — "đề xuất của người soát cũng chạy qua bài thử trước khi nhận: vị từ 'gói khách' đúng trên giấy nhưng sai sau DELETE
     của route huỷ — E0 đỏ" (DOI-SOAT-1 vòng 2 lỗi 3). Gộp vào K5 ("liệt kê mọi luồng hợp lệ … kể cả luồng đổi chính thứ làm chuẩn so sánh").
- **BỎ 3**
  1. Push non-fast-forward — do commit phiếu chen trên GitHub giữa phiên, chủ quán đã xử lý; một lần.
  2. Lệnh bị người gác chặn — đều làm theo hướng dẫn trong lý do chặn, luật đã có ở skill; không lặp sau khi đổi cách viết.
  3. `fetch failed` ở 100.000 đơn — chỉ ở cỡ đo tay qua HTTP, không thuộc `npm test`; ghi CHƯA KIỂM.

**Dọn (11.3):** không đề xuất xoá lời dặn nào — chưa có phép máy mới thay được lời dặn nào trong `KHUON_LOI.md` / `CLAUDE.md`. Ba NGUYÊN TẮC trên
đều GỘP vào K3 / K4 / K5 sẵn có (không mở K9) nên không làm `KHUON_LOI.md` vượt `khuon_loi_toi_da`.

## Báo cáo 7 mục

```
VIỆC:        DOI-SOAT-1 — Màn "Đối soát" trong POS: chạy bất biến sổ sách trên dữ liệu THẬT (chỉ đọc), ngày / tuần / tháng, chỉ ra đơn / khoản lệch
ĐÃ SỬA:      server/utils/doiSoat.js (mới, 313 dòng) — chayDoiSoat (17 bất biến + D1 + DEN, nhóm đỏ / cần xem / lệch cũ, ngày = sự việc mới nhất,
               tra ngày theo lô), cổng chiDoc chỉ-đọc, tienTheoSo / tongHop / soKet (két = để lại mốc gần nhất + bán + nạp ví + thu nợ theo ngày
               thu − trả ra), kiemTraGhi + ghiMoi (chỉ THÊM dòng)
             server/routes/reports.js:+29 — GET /doi-soat, POST /doi-soat/ghi (authenticate + view_reports)
             server/database.js:+25 — bảng pos_doi_soat_ghi + 5 chỉ mục order_id cuối createTables (quyết định 8: đo 20.000 đơn 35 s → 0,74 s)
             server/routes/backup.js:87 — một dòng pos_doi_soat_ghi sau pos_order_log (câu 9)
             cong_cu/gia_lap/bat_bien.js — nhánh ctx.thuc ở I9 / I13 / I14; I8 viết JOIN gộp (cùng kết quả; giả lập 32 · 18 · ĐẠT)
             client/src/components/DoiSoat.jsx (mới) + client/src/pages/Reports.jsx (tab) + client/dist (build)
             kiem_tra_truoc_khi_giao.js — một dòng chayBaiThat('cong_cu/thu_DOISOAT1.js') trước mục K
BÀI THỬ:     cong_cu/thu_DOISOAT1.js chạy trên gốc 2123b69 → ĐỎ 106 ca (29 đạt · 106 hỏng: mọi ca của màn); sau khi vá → XANH 134 đạt · 0 hỏng.
             Mỗi vòng sửa: ca mới đỏ trên code trước vòng (14311c3: 5 · 958f268: 3 · ca khoá luật đúng: đột biến bắt). dot_bien.py 62 đột biến:
             BẮT 62 · SỐNG 0 · HỎNG 0 · LẠC 0. npm test -- --day-du PASS 71 · FAIL 0.
ĐÃ RÀ K4:    grep "db\.(query|run)" server/utils/doiSoat.js → 2 chỗ (chiDoc, ghiMoi), mọi câu đọc qua chiDoc; grep "donMoiNhat" → 8 bất biến khoá theo
             đơn dùng cùng một hàm ngày; grep "pos_doi_soat_ghi WHERE loai" → 3 câu đọc, đã khoá cả 3 (E7/E11, E12, E13); grep "con_nua" → chỉ còn
             don-mo-rong.js:51 (việc khác); 69/69 neo LUOI-1 + mọi neo viec/*/dot_bien*.py vào bat_bien.js / doiSoat.js / database.js còn khớp.
CHƯA KIỂM:   14 vế công thức chưa có ca khoá (danh sách "Lỗ khoá còn mở" — chủ quán 13a: phiếu sau); Turso thật (độ trễ, tạo 5 chỉ mục lúc khởi động
             trên bảng lớn); dữ liệu thật (số dòng LỆCH CŨ, ví lệch cũ, giờ của pos_damage_logs cũ); ngày gộp trong AP_DUNG_TU (kho nông);
             100.000 đơn qua HTTP (2/3 lần fetch failed); "trả ra" = suy luận từ code (chủ quán xác nhận lần chạy thật đầu); đường thêm gói khách lỗi
             (orders.js:1056–1063) và xoá đơn (vùng "CHƯA rà"); Render có triển khai cong_cu/ hay không; giao diện trên điện thoại;
             viec/AUDIT-2/bb_neo.json lệch số dòng; G5 chỉ đọc mã nguồn màn.
GIT:         (xem dòng git log --oneline -2 ngay dưới khối này)
BÀI HỌC:     KHOÁ 3 · NGUYÊN TẮC 3 · BỎ 3 — chi tiết ở ## Bài học của trang_thai.md (bước 11 /lam-viec)
```

**Thử tay trên điện thoại (chủ quán, 3 thao tác):** (1) Báo cáo → tab 🧾 Đối soát → Ngày → bấm "Đối soát": thấy XANH / ĐỎ + bảng tiền mặt; (2) nhập "Tiền
đếm cuối ngày" + "Để lại cho mai" → Lưu số két: thấy "Lần ghi cuối: <tên> lúc <giờ>" và chênh; (3) Tuần → tích "Đã so sao kê" → Lưu, bỏ tích → Lưu:
thấy 🟡 "Chưa so sao kê".

## Cổng chạy (bước 11.4, 21.10)

`node tu_chay/cong.js chay . 2123b69^ HEAD viec/DOI-SOAT-1` đứng ở HEAD `f737afc`, cây sạch:
```
· CẢNH BÁO A16: `cong_cu/thu_DOISOAT1.js` chạy trên gốc in 135 ca ≠ 134 ca ở head — bài dừng sớm trên gốc thì bỏ qua; không thì xem lại bằng chứng đỏ (dạng "… phép · … chỗ hỏng" không tách được số ca nên không so)
✓ CỔNG CHẠY ĐẠT
```
Cảnh báo A16: trên gốc bài in thêm đúng MỘT ca `A0 server/utils/doiSoat.js nạp được` (chỉ in khi không nạp được module — `thu_DOISOAT1.js`, khối nạp
`doiSoat`); 29 + 106 = 135 = 134 + A0. Đã ghi ở `bang_chung_do.txt`.

GIT (`git log --oneline -2` tại lần kiểm):
```
f737afc DOI-SOAT-1: vong sua 4, dem nghiem thu, Bai hoc, bao cao 7 muc (SO CA 134)
ceb4bc0 DOI-SOAT-1: quyet dinh cau 13b-13e (khong chi tu ket, khong rut vi tien mat, giu vi tu dong hang goi, chot so_luong) + cau 10
```

HEAD ĐÃ KIỂM: f737afc
