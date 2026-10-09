# LUOI-1 — Vá lưới tiền/kho: kịch bản giả lập + bất biến cho 4 lỗ NẶNG của AUDIT-1 (+ AU-G4)

<!-- Phiếu do chat soạn 08.10.2026. Nền: main sau sổ việc v24 (cha caabb73 = Merge PR #11 HOC-2b, bộ khung tu-chay 1.4.0).
     Nguồn: dòng sổ LUOI-1 (chốt 05.10, chủ quán chọn (a)); viec/AUDIT-1/bao_cao.md (bảng AU-G1..G6), c2_day_du.md (tên
     C2F SỐNG đầy đủ), d_bang.md; viec/HOC-2b/trang_thai.md mục D5 (C2F SỐNG trên gốc 07.10). Chat đo 08.10 trên caabb73
     (máy 1 lõi, chạy riêng): giả lập 68 s (mỗi kịch bản tốn thêm ~0,58 s chỉ để kiểm 10 bất biến vì câu SQL kiểm cũng bị
     cộng trễ 40 ms), thu_gia_lap 97 s. Thử tạm "bất biến kiểm không cộng trễ": giả lập 58 s ĐẠT, thu_gia_lap 78 s 42/0.
     Chủ quán chốt Q-TG 08.10 (nhóm A). -->

**Chờ duyệt kế hoạch:** viết `viec/LUOI-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.
Chưa viết bài thử, chưa sửa code cho tới khi chủ quán gửi lời duyệt.

## Mục tiêu
AUDIT-1 thấy lưới an toàn (giả lập + bất biến + bài thử) KHÔNG canh bốn đường tiền/kho mà quầy dùng thật: đổi điểm lấy
mã giảm giá, mã giảm giá dùng-một-lần khi bán, gói & thẻ trả trước (mua, lấy hàng, HUỶ đơn mua gói/thẻ), và sổ nợ kho khi
SX/mạng trục trặc. Bỏ một câu ghi sổ ở các đường này thì mọi phép kiểm vẫn xanh. Việc này CHỈ THÊM LƯỚI (kịch bản giả lập +
bất biến) để mỗi đột biến "bỏ câu" tương ứng chuyển SỐNG → BẮT — làm trước P26c vì P26c/P20b/P22–P24 sẽ sửa đúng các đường
này. KHÔNG sửa logic tiền: kịch bản lộ code đang sai → DỪNG, ghi `## Câu hỏi`.

### Lưu ý — cổng của chính PR này
Cổng chấm bằng `tu_chay/cong.js` + `tu_chay/cau_hinh.json` của `main` (tu-chay 1.4.0 — cũng là luật mới nhất, vì việc này
không đổi `tu_chay/`). Vì vậy:
- Không đổi `server/`, `client/` → A18 không áp.
- `cong_cu/thu_gia_lap.js` CỐ Ý đổi (dòng `DONG_DAT` sang N kịch bản · M bất biến, ca mới) nên ĐỎ trên gốc là đúng — đó là
  bài đỏ hợp lệ của việc này; KHÔNG ghi file này vào `## Bài thử cũ sửa`.
- A16: `viec/LUOI-1/bang_chung_do.txt` có dòng `SỐ CA <bài>: <N>` cho MỖI bài thử đỏ trên gốc, N = số ca bài in khi chạy trên
  head. Đổi bài sau khi ghi → chạy lại, chép lại.
- A17: có `viec/LUOI-1/dot_bien.py` thì MỌI tên đột biến (nguyên chuỗi đầu tuple) ghi NGUYÊN VĂN trong
  `viec/LUOI-1/trang_thai.md`.
Kế hoạch có bảng: file bài thử nào bị đụng → ca nào đỏ trên gốc.

## Nghiệm thu

### A. Thời gian (chủ quán chốt Q-TG 08.10) — làm TRƯỚC khi thêm kịch bản
- A0 Đo CHẠY RIÊNG trên gốc (không lệnh nào khác chạy song song): `node cong_cu/gia_lap/chay.js`, `node cong_cu/thu_gia_lap.js`,
  `node kiem_tra_truoc_khi_giao.js --day-du`; ghi số lõi máy. Đo thời gian TỪNG kịch bản cũ (bản sao tạm hoặc công cụ trong
  `viec/LUOI-1/`, không commit bản đo vào `cong_cu/`).
- A1 `cong_cu/gia_lap/chay.js`: bất biến chạy KHÔNG cộng trễ 40 ms (trễ chỉ để lộ lỗi chồng lệnh trong kịch bản; kiểm sổ sau
  kịch bản là đọc tuần tự, không có gì chồng). Trễ bật lại TRƯỚC mỗi kịch bản. KB10 vẫn đạt ca "trễ kho đang bật". Đo lại
  A0 sau A1. Không đổi phần an toàn của `chay.js` (các khối ghi "A1", "A2" trong file: từ chối biến máy thật, kho tạm,
  dọn khi sập).
- A2 Ước tổng sau khi thêm kịch bản (từ số đo từng kịch bản mới). Giả lập hoặc `thu_gia_lap` chạy riêng ở máy mây vượt 80 %
  hạn (96 s) → DỪNG, ghi `## Câu hỏi` kèm đề xuất (vd tách giả lập hai lượt). **Cấm nới hạn** (120 s bộ kiểm, 110 s giả lập
  con trong `thu_gia_lap`), cấm hạ ngưỡng `han * 0.8`, cấm bớt kịch bản cũ.

### B. Kịch bản + bất biến (THÊM vào CUỐI `kich_ban.js`, không sửa/xoá kịch bản cũ)
Mỗi kịch bản gọi API ĐÚNG như quầy bấm (đọc `client/src` để biết màn hình gọi gì, ghi tên file:dòng vào kế hoạch); mong đợi
HTTP bằng `status` + `code`, không dò chữ. Bất biến là SQL chỉ đọc, chạy sau MỌI kịch bản (cũ + mới) và phải ĐẠT trên toàn bộ
giả lập — không bất biến nào được miễn kịch bản cũ.
- B1 (AU-G1) Đổi điểm lấy mã `/loyalty/redeem`: khách tích đủ điểm → đổi → mã dùng được khi bán; đổi khi thiếu điểm → 400.
  Bất biến: mỗi `pos_voucher_grants` có đúng MỘT dòng `pos_point_transactions` loại `redeem` (id = `point_tx_id`) trừ đúng số
  điểm của quà; mã đẻ ra có `discount_type`/`discount_value` = quà, `usage_limit` = 1. Điểm của khách (tích − đổi) khớp sổ.
- B2 (AU-G2) Bán có áp mã dùng-một-lần: lần đầu 200 + giảm đúng tiền; lần hai cùng mã → bị chặn (status + code thật của máy
  chủ). Bất biến: `used_count` ≤ `usage_limit` với mọi mã; `used_count` = số đơn còn hiệu lực đã dùng mã (đọc code để biết huỷ
  đơn có trả lượt dùng không — ghi rõ trong kế hoạch, KHÔNG đoán).
- B3 (AU-G3) Gói & thẻ trả trước: mua gói → lấy hàng từ gói (cả đường `packages.js` deliver nếu quầy dùng) → lấy tới hết
  lượt → lấy thêm bị chặn; mua thẻ thành viên; HUỶ đơn mua gói và HUỶ đơn mua thẻ bằng quyền quầy (`nv`, `cancel_order`) →
  gói/thẻ bị gỡ, tiền hoàn đúng; huỷ đơn LẤY hàng từ gói → trả lượt. Bất biến: `delivered_qty` ≤ `total_qty`; `delivered_qty`
  của mỗi gói = tổng món lấy từ gói ở đơn còn hiệu lực; không đơn mua gói/thẻ nào đã huỷ mà gói/thẻ của nó còn dùng được;
  đơn mua gói có `customer_package_id` đúng. Quy tắc tạm ở quầy (tới P26c): đơn giao từ gói chỉ Huỷ, không Xoá — đường XOÁ
  (owner) phủ được thì phủ, không phủ được mà không chạm lỗi đã biết (P26b Phát hiện 4: xoá đơn có món SX → I7 lệch) thì ghi
  CHƯA PHỦ + lý do, không nới bất biến cũ.
- B4 (AU-G6) SX trả lỗi: `cong_cu/gia_lap/chay.js` thêm công tắc cho SX giả trả lỗi lệnh trừ/hoàn kho — MẶC ĐỊNH TẮT, tự tắt
  trước mỗi kịch bản. Kịch bản bán / huỷ / (xoá nếu phủ được, xem B3) lúc SX lỗi. I7 mở rộng (không nới): mỗi vân tay kho cần
  có HOẶC SX nhận đúng một lần, HOẶC đúng một dòng `pos_stock_pending` cùng vân tay — không cả hai, không thiếu; nợ kho chỉ được
  có ở kịch bản bật SX lỗi. Nếu quầy có nút đẩy sổ nợ (`so-no.js`) thì thêm: SX hết lỗi → đẩy → kho nhận đúng một lần, sổ nợ
  đánh dấu xong; bấm đẩy hai lần không trừ hai lần.
- B5 (AU-G4, NHẸ-tiền) Đối soát ví khi ví CHƯA có; duyệt hoàn có gắn `balance_transaction_id`; đổi cách trả ghi đúng số
  tiền mặt/chuyển khoản; `/discount-codes/:id/increment-usage` (ghi trong kế hoạch màn hình nào gọi; không màn hình nào gọi
  thì vẫn phủ qua API, ghi rõ).
- B6 Bánh cóc `kiem_tra_truoc_khi_giao.js`: `NGUONG_KICH_BAN` 18 → N, `NGUONG_BAT_BIEN` 10 → M (chỉ tăng) theo số thật.
  Sửa chú thích thời gian trong file này theo số đo A0/A1 thật.

### C. Nghiệm thu bằng đột biến (đếm ĐỦ, không lấy mẫu)
Chạy `python3 viec/AUDIT-1/dot_bien.py <tên…>` trên head cuối; trong lúc chạy KHÔNG chạy lệnh nào khác song song (so nhật
ký người gác → "KHO BẨN" oan); `-j` theo số lõi được.
- C1 Hai mươi mốt đột biến phải chuyển SỐNG → BẮT: `C2F-loyalty-01-insert-khach-app`, `C2F-loyalty-02-insert-khach-app`,
  `C2-loyalty-redeem-tru-0`, `C2F-orders-05-update-quay`, `C2F-orders-07-insert-quay`, `C2F-orders-27-insert-quay`,
  `C2F-orders-39-insert-quay`, `C2F-orders-10-update-quay`, `C2F-orders-11-insert-quay`, `C2F-orders-21-update-quay`,
  `C2F-orders-22-delete-quay`, `C2F-orders-23-update-quay`, `C2F-orders-24-delete-quay`, `C2F-orders-25-update-quay`,
  `C2F-orders-30-update-quay`, `C2F-orders-32-update-quay`, `C2F-packages-05-update-quay`, `C2F-wallets-08-insert-quay`,
  `C2F-refunds-05-update-quay`, `C2F-don-mo-rong-01-update-quay`, `C2F-discount-codes-05-update-quay`. Mỗi cái ghi bất biến
  hoặc dòng HTTP nào bắt. Cái nào vẫn SỐNG → ghi rõ vì sao (vd chỉ phủ được bằng đường xoá vướng Phát hiện 4) + `## Câu hỏi`;
  KHÔNG sửa `viec/AUDIT-1/`, KHÔNG sửa `server/` để làm nó BẮT.
- C2 Bốn mươi C2F đã BẮT trên gốc VẪN BẮT — tên = 86 câu C2F của `viec/AUDIT-1/dot_bien.py` trừ 45 SỐNG và 1 LẠC liệt kê
  ở `viec/HOC-2b/trang_thai.md` mục D5; in đủ 40 tên trong `trang_thai.md`. Chạy lại đủ 86, bảng BẮT / SỐNG / HỎNG / LẠC
  đủ tên. `C2F-orders-02-insert-quay` LẠC như gốc là đúng.
- C3 Đột biến của chính việc này trong `viec/LUOI-1/dot_bien.py` (bản sao, không ghi file thật): mỗi bất biến mới/mở rộng có
  đột biến "nới phép" lệch ÍT cả hai phía (`===` → `<=`/`>=`, bỏ một điều kiện WHERE, đổi `1` → `2`) và phải BẮT; công tắc SX
  lỗi "không tự tắt" và "mặc định bật" phải BẮT (bằng ca trong `thu_gia_lap.js` hoặc bất biến); A1 "trễ không bật lại trước
  kịch bản" phải BẮT. Chat thử 08.10: đột biến này bị KB10 ca "hai lệnh thu chồng nhau" bắt, còn ca "trễ kho đang bật"
  KHÔNG bắt (nó tính trung vị trên các lệnh ĐÃ bị trễ) → siết ca đó đo riêng lệnh của chính KB10 (có lệnh bị trễ, trung vị
  ≥ 35 ms) và cho đột biến này đỏ ở CẢ hai ca. Bảng "chỗ đổi → đột biến" trong `trang_thai.md`.
- C4 Chạy lại mọi bộ đột biến chạm file việc này sửa (`viec/TU-CHAY-4/dot_bien.py`, `viec/P26b/dot_bien.py`,
  `viec/HOC-2b/dot_bien.py`, nhóm D1 của `viec/AUDIT-1/dot_bien.py` liên quan giả lập) → 0 HỎNG trừ `G3-sai-chuoi` cố ý; neo
  rữa vì file này đổi → sửa neo trong bộ của việc này nếu ở Phạm vi, không thì ghi `## Phát hiện`.

### D. Kiểm sống (ghi vào `viec/LUOI-1/trang_thai.md`)
- D1 Lúc mở phiên: in `git log --oneline -3`, khớp GitHub (có commit `PHIEU: LUOI-1`, cha là commit sổ v24).
- D2 PR có 2 check `cong` + `cong-chay` xanh (máy không xem được — ghi CHƯA KIỂM). Không đổi `tu_chay/` → không cần
  `cai_dat.sh`.

### E. Toàn bộ
`npm test` và `node kiem_tra_truoc_khi_giao.js --day-du` xanh, 0 CẢNH BÁO lúc chạy riêng; `thu_gia_lap` xanh. Kế hoạch ghi
ước lượng thời gian máy (đo, không đoán); quá ~150 phút → đề xuất tách trong `## Câu hỏi`, KHÔNG tự cắt mục. Thấy thông báo
đổi model giữa phiên → ghi giờ + bước.

## Phạm vi
- viec/LUOI-1/**
- cong_cu/gia_lap/kich_ban.js
- cong_cu/gia_lap/bat_bien.js
- cong_cu/gia_lap/chay.js
- cong_cu/thu_gia_lap.js
- kiem_tra_truoc_khi_giao.js
- viec/TU-CHAY-4/dot_bien.py
- viec/P26b/dot_bien.py
- viec/HOC-2b/dot_bien.py
- KHUON_LOI.md

## Ngân sách
Code ~250 dòng: `kich_ban.js` +~150 (5–7 kịch bản), `bat_bien.js` +~60 (3–4 bất biến mới, I7 mở rộng), `chay.js` +~15
(A1, công tắc SX lỗi), `kiem_tra_truoc_khi_giao.js` ±~5. Thử ~80 dòng: `thu_gia_lap.js` (DONG_DAT, ca công tắc). Hồ sơ:
`viec/LUOI-1/dot_bien.py` ~80. Neo đột biến cũ ±~20.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `server/`, `client/`, `tu_chay/`, `.claude/`, `.github/`, `package.json`, `CHECKLIST_CODE.md`, `CLAUDE.md`,
  `viec/AUDIT-1/`, `viec/HOC-1/`, `viec/HOC-2/`, sổ việc. Không chạy `cai_dat.sh`.
- Không nới, xoá, hay thêm miễn cho bất biến/kịch bản cũ; không nới hạn thời gian, không hạ ngưỡng cảnh báo, không giảm số
  kịch bản; bánh cóc chỉ tăng.
- Kịch bản lộ code đang sai (tiền/điểm/kho lệch trên code hiện tại) → DỪNG, ghi `## Câu hỏi`; không sửa `server/`, không
  viết kịch bản né chỗ sai.
- Không viết lệnh thử vượt người gác; việc này không cần ca người gác nào.
- Chỉ push đúng `git push -u origin viec/LUOI-1`. Không đụng `main`, không merge, không tạo PR. Không chạy `patch_*.py`.
