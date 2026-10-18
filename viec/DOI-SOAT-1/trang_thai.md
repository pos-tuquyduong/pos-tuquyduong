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

## Phát hiện (ngoài Phạm vi, không sửa)

- `client/src/pages/Balance.jsx:111` luôn gửi `payment_method: 'cash'` khi nạp ví → nạp ví bằng chuyển khoản (nếu có) cũng ghi là tiền mặt; màn Đối soát tính nạp ví tiền mặt theo cột này.
- Xoá đơn làm tiền mặt của đơn biến khỏi mọi tổng theo sổ (đơn không còn dòng) — chưa rà đường xoá đơn trong việc này.

- `client/src/pages/Reports.jsx:11` mặc định "hôm nay" bằng `new Date().toISOString()` (UTC): 0:00–7:00 sáng VN tab Ngày hiện hôm qua.
- Báo cáo ngày/tuần (`server/routes/reports.js:34, :127, :142`) tính thu nợ vào NGÀY TẠO đơn gốc (`orders.js:1305–1310`) → doanh thu tiền mặt ngày cũ đổi về sau; không có nạp ví tiền mặt.
- Nạp ví mặc định `payment_method = 'cash'` (`database.js:333`, `wallets.js:136`).
- Chú thích `cong_cu/gia_lap/bat_bien.js:217` ghi `orders.js:450` — dòng đó nay là `sx_product_id: null` (lệch số dòng).

## Bài học (tạm — điền khi làm xong)

Chưa làm tới. Ghi sớm một điều: bản 1 của kế hoạch có một câu sai về phiếu và một mâu thuẫn nội bộ (B/C) mà tôi không thấy; agent soát đọc độc lập bắt được cả hai — nên giữ bước soát kế hoạch cho việc tiền.
