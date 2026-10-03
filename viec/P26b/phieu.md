# P26b — Vá lỗ tiền: hoàn ví hai lần, bấm trùng ghi đè ví, báo hỏng tin số màn hình gửi

**Chờ duyệt kế hoạch:** viết `viec/P26b/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Tiền trong ví khách đang có thể sai ở quầy thật. Đơn 25.000đ trả bằng ví → duyệt hoàn rồi huỷ đơn (hoặc ngược lại)
→ ví +50.000đ (agent soát P26a đã chạy thật trên kho tạm). Nhiều route đọc ví/đơn NGOÀI giao dịch rồi ghi số dư tuyệt
đối → hai người bấm gần nhau thì một khoản bị ghi đè (vd khách nạp 100.000đ đúng lúc thu ngân bán đơn trả ví: mất khoản
nạp). Báo hỏng tin số tiền đền bù do màn hình gửi. Làm ngay vì đây là lỗ tiền đang mở; quy tắc tạm ở quầy ("đơn đã hoàn
không huỷ; đơn đã huỷ không duyệt hoàn") được bỏ khi việc này lên production.

Nguyên tắc vá (K4 — mọi đường song song, không vá một chỗ): MỌI chỗ ghi `pos_wallets.balance` và mọi chỗ đổi trạng thái
đơn/yêu cầu hoàn đều (1) đọc lại đơn/yêu cầu/ví BÊN TRONG giao dịch ghi (`beginTransaction()`), (2) đổi trạng thái bằng
UPDATE có điều kiện (`... AND status = ...`) và kiểm số dòng đổi, (3) cộng/trừ ví TƯƠNG ĐỐI (`balance = balance ± ?`),
`balance_before/after` lấy trong giao dịch. Danh sách chỗ ghi ví đã thấy (kế hoạch phải tự grep lại, đủ, ghi file:dòng):
`orders.js` tạo đơn (ví khách + ví mẹ), huỷ, xoá; `refunds.js` tạo yêu cầu, duyệt; `wallets.js` nạp, trừ tay, điều chỉnh,
đối soát; `damages.js` đền bù. Lệnh thua khi chồng nhau phải nhận 400 rõ nghĩa (hoặc chạy sau đúng số), KHÔNG 500; nếu kho
trả bận (SQLITE_BUSY) thì kế hoạch nêu cách xử lý.

## Nghiệm thu
A — Hoàn hai lần (tuần tự):
- A1 Huỷ đơn đã hoàn (`refunded`) → 400, ví không đổi. Huỷ đơn `completed` vẫn chạy như cũ (K5).
- A2 Duyệt yêu cầu hoàn khi đơn không còn `completed` (đã huỷ/đã hoàn) → 400, ví không đổi, yêu cầu không thành `approved`.
- A3 Xoá đơn (chủ quán) chỉ hoàn ví khi đơn còn `completed`; đơn đã hoàn hoặc đã huỷ → xoá không cộng ví.
- A4 Huỷ hoặc xoá đơn → yêu cầu hoàn `pending` của đơn đó thành `rejected`, lý do "Đơn đã huỷ", CÙNG giao dịch.
- A5 Tổng hoàn vào ví của một đơn (dòng `refund` theo `order_id`, mọi ví) ≤ số đơn đó đã trả bằng ví (khách + mẹ).

B — Bấm trùng / chồng nhau (dựng bằng `c.moc.truocTx` của giả lập như KB11, hoặc tương đương trong bài thử):
- B1 Hai lệnh huỷ cùng một đơn trả ví → đúng một lệnh thành công, ví cộng đúng một lần.
- B2 Hai lệnh duyệt cùng một yêu cầu hoàn → đúng một lần cộng ví.
- B3 Hai lệnh tạo yêu cầu hoàn cùng một đơn → đúng một yêu cầu `pending`.
- B4 Nạp ví chồng lên bán đơn trả ví (và chồng lên trừ tay / điều chỉnh / đối soát) → số dư = sổ (I4), không mất khoản nào.
- B5 Hai đơn trả ví chồng nhau, tổng vượt số dư → một đơn bị chặn "Số dư không đủ", số dư không âm.
- B6 Hai lệnh báo hỏng chồng nhau cùng một món → tổng số lượng đã báo ≤ số lượng mua (xem C2).

C — Báo hỏng (`damages.js`):
- C1 Số tiền đền bù do MÁY CHỦ quyết: tối đa = giá món hỏng (`unit_price × quantity` đọc từ đơn trong kho).
  Số màn hình gửi chỉ được ≤ mức đó (đền ít hơn được); vượt → 400, ví không đổi. Chủ quán chốt 03.10.2026: phương án 1.
- C2 Cộng dồn: tổng số lượng đã báo hỏng của một món trong đơn (mọi `action`, kể cả `return_stock`) ≤ số lượng mua; vượt → 400.
- C3 Đơn đã huỷ hoặc đã hoàn → báo hỏng có hoàn tiền → 400.
- C4 Dòng sổ `compensation` ghi `order_id`; ví + sổ + dòng `pos_damage_logs` cùng MỘT giao dịch (hoàn kho SX vẫn ngoài, như cũ).
- C5 K5: báo hỏng 1 món, đền đúng giá → vẫn 200, ví cộng đúng; KB6 vẫn xanh.

D — `POST /packages/buy` (`packages.js`): BỎ route (không màn hình nào, không máy nào gọi; gói bán qua đơn hàng có thu tiền).
`cong_cu/thu_P26a.js` ca C4 đổi thành: `POST /packages/buy` → 404 và không có dòng mới trong `pos_customer_packages`.
Đây là CỐ Ý đổi hành vi nên KHÔNG ghi file này vào `## Bài thử cũ sửa` — bản sửa đỏ trên gốc là bài đỏ hợp lệ.
Mua gói qua đơn hàng (KB9) vẫn xanh.

E — Giả lập (file luật, ghi đúng tên ở Phạm vi):
- E1 Mỗi ca A1–A3, B1–B6, C2–C3 có ít nhất một kịch bản; mỗi kịch bản mới ĐỎ trên code gốc (ghi bằng chứng).
- E2 Kịch bản "khách trả ví + dùng mã in trên bill (`/claim` hoặc `/nhan-diem`) + `POST /refunds` + duyệt" phủ nhánh
  `refunded` của I1. Chứng minh: thay nhánh đó (bat_bien.js ~dòng 31) bằng `false` → giả lập ĐỎ. Sửa chú thích bat_bien.js:21.
- E3 Bất biến mới: hoàn ví của mỗi đơn ≤ số đã trả bằng ví (A5); có đột biến trong `thu_gia_lap.js` bắt được nó.
- E4 Kịch bản đọc id: bảng liên quan có sẵn dòng (đẩy `sqlite_sequence` lên mốc khác nhau) — bài học P26a.
- E5 `NGUONG_KICH_BAN`, `NGUONG_BAT_BIEN` nâng đúng bằng số mới (chỉ tăng); `thu_gia_lap.js` đổi dòng tổng mong đợi.

F — Khoá cho lần sau:
- F1 `cong_cu/thu_P26b.js` (bài thử mới, ĐỎ trên gốc): A1–A5, C1–C4, D trên máy chủ thật + kho tạm (như `thu_P26a.js`);
  bộ kiểm chạy nó ở bản nhanh cạnh `thu_P26a`.
- F2 Phép tĩnh trong `kiem_tra_truoc_khi_giao.js`: trong `server/routes/` không còn ghi số dư ví tuyệt đối từ số đọc ngoài
  giao dịch (vd mẫu `SET balance = ?`), trừ chỗ được đánh dấu rõ (đối soát ghi trong giao dịch). Đỏ trên gốc.
- F3 Đột biến BẮT BUỘC cả hai kiểu cho mỗi chỗ vá: "bỏ vá" và "VÁ SAI" (vd kiểm trạng thái nhưng NGOÀI giao dịch; UPDATE có
  điều kiện nhưng không kiểm số dòng đổi; cộng tương đối nhưng `balance_before` đọc ngoài giao dịch; giới hạn đền bù so với
  số màn hình gửi thay vì giá trong kho). Mỗi đột biến phải bị bài thử hoặc giả lập bắt; lệnh chạy lại ở `viec/P26b/dot_bien.py`,
  tên đột biến ghi trong `trang_thai.md`.
- F4 `npm test`, `node kiem_tra_truoc_khi_giao.js --day-du` xanh; `thu_P20`, `thu_P21`, `thu_P26a`, `thu_P26b`, `thu_gia_lap` xanh.

Cổng của PR này chấm bằng luật main (tu-chay 1.3.2): `thu_P26b.js` (mới) đỏ trên gốc; `thu_P26a.js` (C4) và
`thu_gia_lap.js` (dòng tổng) là file sửa, đỏ trên gốc. Kế hoạch ghi rõ ca nào đỏ trên gốc ở từng file.

Lệch ngoài phạm vi thấy được (vd duyệt hoàn không trừ `total_spent` như huỷ đơn; ví mẹ trong yêu cầu hoàn; đơn có hai dòng
cùng `product_code` ở báo hỏng): ghi `## Phát hiện`, KHÔNG tự sửa.

## Phạm vi
- viec/P26b/**
- server/routes/orders.js
- server/routes/refunds.js
- server/routes/wallets.js
- server/routes/damages.js
- server/routes/packages.js
- cong_cu/thu_P26b.js
- cong_cu/thu_P26a.js
- cong_cu/gia_lap/chay.js
- cong_cu/gia_lap/kich_ban.js
- cong_cu/gia_lap/bat_bien.js
- cong_cu/thu_gia_lap.js
- kiem_tra_truoc_khi_giao.js
- KHUON_LOI.md

## Ngân sách
Code routes ~120–180 dòng (đổi nhiều hơn thêm). Thử: `thu_P26b.js` ~200, giả lập ~200 (kịch bản + 1 bất biến), `thu_P26a.js` ±10,
`thu_gia_lap.js` ~20, bộ kiểm ~25. `KHUON_LOI.md` đang 118/120: bài học mới phải gộp vào dòng cũ, không vượt trần.
Thấy cần sửa file ngoài Phạm vi (client, database.js, tu_chay/): KHÔNG tự làm — ghi `## Câu hỏi`.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `client/**`, `server/database.js`, `.claude/`, `.github/`, `tu_chay/`. Không đụng Turso hay production.
- Chỉ push đúng nhánh việc: `git push -u origin viec/P26b`. Không đụng `main`, không merge, không tạo PR.
- Không nới bộ kiểm, cổng, người gác; không bỏ kịch bản/bất biến/ca thử cũ (trừ C4 đổi theo D). Không sửa sổ việc.
