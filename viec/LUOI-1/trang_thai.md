# LUOI-1 — trạng thái

## Bản chụp lúc mở phiên (09.10.2026)
Nhánh: `viec/LUOI-1`
```
9521cec PHIEU: LUOI-1
769adfe TIEN-DO: HOC-2b xong (caabb73), LUOI-1 mo phieu — so v24
caabb73 Merge pull request #11 from pos-tuquyduong/viec/HOC-2b
```
Có commit `PHIEU: LUOI-1`, cha là commit sổ v24 (769adfe). Máy: 4 lõi (`/proc/cpuinfo`).

## Bước đang làm
Bước 3 — kế hoạch xong (`ke_hoach.md`), agent phụ soát → đã sửa 6 điểm. Phiếu dặn "chờ duyệt kế hoạch" → commit, push,
DỪNG. Chưa viết bài thử, chưa sửa code.

## Câu hỏi (chờ chủ quán trả lời khi duyệt kế hoạch)

- **Q1 — bán lại mã dùng-một-lần đã hết lượt.** Đọc code: màn Bán hàng chỉ gửi mã khi `POST /discount-codes/validate` hợp lệ
  (`Sales.jsx:234`, `:728`); validate mã hết lượt → 400 KHÔNG có `code` (`discount-codes.js:94–95`). Nếu vẫn gửi mã đó lên
  `POST /orders`, máy chủ **bỏ mã, đơn 200, tính đủ giá** (`orders.js:475–495`); chỉ khi hai đơn CHỒNG nhau mới ra
  400 `DISCOUNT_CODE_LIMIT_REACHED` (`:880–893`). Không mất tiền. Phiếu ghi "lần hai cùng mã → bị chặn". Đề xuất (a): KB20
  mong validate 400 + đơn tuần tự 200 / `discount_amount` 0 / đủ giá + ca chồng 200 + 400 `DISCOUNT_CODE_LIMIT_REACHED`.
  (b) coi "đơn 200 bỏ mã" là code sai → DỪNG việc.
- **Q2 — `PUT /packages/customer-packages/:id/deliver`.** Không màn hình nào gọi; cộng lượt KHÔNG trần, KHÔNG tạo đơn
  (`packages.js:170–181`). Đề xuất (a): KB26 gọi trong hạn lượt (1 ly trên gói còn lượt), I14 cộng sổ `giaoGoi` → bắt
  `C2F-packages-05`; "không trần" ghi Phát hiện 4. (b) không phủ → `C2F-packages-05` ghi CÒN SỐNG kèm lý do.
- **Q3 — lấy quá lượt gói (đụng tiền).** Theo code đọc, CHƯA chạy: (i) còn 1 lượt mà đơn lấy 2 ly → máy chủ chỉ chặn khi còn
  ≤ 0 (`orders.js:222–228`) nên giao vượt `total_qty`; (ii) hai quầy cùng lấy lượt cuối → kiểm ngoài giao dịch (`:194`), cộng
  sau commit không trần (`:1021–1037`) → vượt. Hai ca này sẽ làm I14 "`delivered_qty ≤ total_qty`" ĐỎ = lộ code sai. Đề xuất
  (a): KB21 KHÔNG thêm hai ca này (lấy đúng tới hết lượt, lấy thêm bị chặn; ca chồng của tiền gói = hai người cùng huỷ đơn
  mua gói); hai lỗ ghi Phát hiện 5 → gom vào P26c. (b) thêm hai ca → bài đỏ, việc DỪNG ở bước 4 chờ P26c sửa.
- **Q4 — thời gian máy ước ~195–210 phút > 150** (`ke_hoach.md` mục 12). Đề xuất cắt, không bỏ mục nghiệm thu: C1 và C2 dùng
  CHUNG một lần chạy 87 C2F (không chạy hai lần); C4 chỉ chạy đột biến có lệnh chạy giả lập / `thu_gia_lap` / bộ kiểm hoặc có
  neo trong 5 file việc này sửa (đột biến chỉ chạy `thu_P26b`/`tu_chay` bỏ qua vì không file nào của chúng đổi) — ước còn
  ~160 phút. Hoặc tách C4 sang phiếu sau.
- **Q5 — `thu_gia_lap` ước ~91 s**, sát ngưỡng 96 s (80 % hạn). Duyệt làm tiếp; đo thật vượt 96 s → DỪNG theo A2 với đề xuất
  tách giả lập hai lượt song song. Đồng ý?

## Phát hiện (ngoài phạm vi — KHÔNG sửa)

1. Huỷ / xoá đơn KHÔNG trả lượt mã giảm giá (`orders.js:1296–1458`, `:1462–1590` không đụng `pos_discount_codes`): mã đổi
   điểm dùng rồi huỷ đơn → khách mất cả mã lẫn điểm. Nghiệp vụ — gắn P24 (huỷ đơn trừ điểm)?
2. `POST /orders` lưu `discount_code` cả khi mã KHÔNG được áp (`orders.js:450` gán sẵn, chỉ ghi đè khi mã hợp lệ) → báo cáo
   đếm "đơn có mã" (`Reports.jsx:182`) tính cả đơn không được giảm.
3. `pos_voucher_grants.status` không bao giờ chuyển `used` (grep `used_order_id` trong `server/` chỉ có SELECT `loyalty.js:88`).
4. `PUT /packages/customer-packages/:id/deliver` không trần lượt, không tạo đơn, chỉ cần đăng nhập (`packages.js:170–181`);
   không màn hình gọi — đề xuất bỏ như `POST /buy` (P26b D).
5. Lấy quá lượt gói theo số lượng và khi hai quầy chồng nhau (Q3).
6. Hạng thẻ mặc định có "Kim cương" (`database.js:1144`, chỉ chạy khi bảng rỗng) — trái CLAUDE.md §5.6.
7. Tự đẩy sổ nợ mỗi 3 phút (`index.js:76`, `doSoNo.js:120`) đẩy cả nợ của đơn ĐÃ XOÁ → SX nhận vân tay của đơn không còn
   (cùng gốc P26c (4)). Vì vậy KB27 (SX lỗi lúc xoá) phải là kịch bản cuối.
8. `C2F-orders-31-delete-quay` (`orders.js:1515`, xoá gói khi xoá đơn mua) đang SỐNG — KB23 + I14 sẽ chạm (thêm, ngoài 21 cái).

## Soát kế hoạch (agent phụ, chỉ đọc) — CẦN SỬA 6 điểm, đã sửa trong ke_hoach.md
1. `C2-loyalty-redeem-tru-0` có mẫu bắt `→ I8:` → bắt bằng I12 sẽ bị chấm LẠC → chuyển vế đổi điểm vào I8 mở rộng.
2. "Công tắc không tự tắt" không có ca bắt (KB24 tự tắt) → tách: KB24 bật lỗi không tắt, KB25 đẩy sổ nợ nhờ tự tắt.
3. B1 "tích − đổi khớp sổ" thiếu → vế I8 mở rộng. 4. Thiếu mục B6/C2/D2 → mục 11b.
5. `wallets-08`: HTTP giống hệt khi bỏ INSERT → KB26 SELECT `pos_wallets`. 6. Ghi `orders-31` + nhánh sổ nợ chưa phủ.
