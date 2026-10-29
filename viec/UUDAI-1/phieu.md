# UUDAI-1 — Ưu đãi: mã giảm dùng chung hay không với giá hạng, máy chủ chọn cách lợi hơn

<!-- Phiếu do chat soạn 26.10.2026. Việc tiền [T] — Opus, máy lập kế hoạch, dừng chờ chủ quán duyệt. Nền: main sau khi gộp DIEM-THAT-1.
     Đặc tả: ban_mau_pos/DAC_TA_BAN_HANG_2410.md mục 1.5–1.6. Chủ quán chốt thêm 26.10 (demo combo
     claude.ai/artifact/NR3wi1kVEAnyMK4ygGMdck): cài đặt THEO LOẠI mã, chữ trên màn là "Dùng chung với giá hạng"; quà / voucher đổi điểm
     LUÔN dùng chung; bỏ tích thì khách hội viên chỉ được một trong hai, máy tự chọn cái giảm nhiều hơn và ghi rõ trên giỏ.
     Code đọc 26.10 (main 9fd32af): giảm hạng TIER-2 orders.js ~625–668 (tierDiscountAmount, tier_unit_price, nhóm đặc biệt
     special_discount_percent, flash chặn hạng); mã % orders.js ~722 tính trên `subtotal` GỐC (chưa trừ hạng) — sai mục 1.6
     ("hạng tính trước, ưu đãi tính trên giá đã giảm"); trần mã ~733; mã 1 món (discount_scope 'item', itemScopeDiscount.js);
     voucher đổi điểm = dòng pos_discount_codes có dòng pos_voucher_grants cùng `code` (loyalty.js ~134). Đơn tạo qua payOS (P3) đi
     cùng hàm tạo đơn của orders.js. Combo (COMBO-1a) làm SAU việc này, dùng lại hàm của việc này — đừng làm combo ở đây. -->

**Đã duyệt (chủ quán 27.10, sau khi chat soát kế hoạch `ke_hoach.md` đầu nhánh `e3cb1ce`):** kế hoạch được duyệt; máy làm tiếp từ bước 4
(`/lam-viec UUDAI-1 tiep`) tới hết, không dừng hỏi lại các điểm này:
1. Q1 = **(a)**: `client/src/pages/Sales.jsx` vào Phạm vi. Khi đơn có mã: màn cũ hỏi `POST /orders/tinh-thu` (qua `api` đã export, KHÔNG sửa
   `client/src/utils/api.js`) mỗi khi giỏ / khách / mã đổi, dùng số máy chủ trả để hiện và thu tiền. Đơn không mã giữ cách tính cũ.
   Thêm ca thử: Sales.jsx gửi đúng tổng máy chủ cho khách Vàng + mã % (bật và tắt dùng chung) → không 400 "không khớp tổng".
2. Q2, Q3, mốc `min_order` theo giá gốc, làm tròn mã % về đồng, cách xếp loại mã: **đồng ý đúng như kế hoạch mục 2**.
3. `/discount-codes/validate` và `/increment-usage` (file Cấm): giữ ghi Phát hiện, không sửa ở việc này.
4. BH-2 (màn mới) sẽ dùng `tinh-thu` — việc này chỉ cần đường tinh-thu đúng, không đụng `client/src/pages/BanHang/**`.

**Trả lời câu hỏi vòng 3 (chủ quán 27.10, đầu nhánh `4de9e72`):**
5. Q5 = **(a)** giữ như máy đang làm: mã gõ vào không hợp lệ → tính như không có mã (khách có hạng thì `cach: 'hang'`), kèm `ma_loi` +
   `ma_loi_code`, `cau_ghi` rỗng; ca F6 khoá đúng hành vi này. Câu "không bao giờ trả `cach: 'hang'` vì mã sai" ở `ke_hoach.md` hiểu là:
   không được ÂM THẦM coi mã sai là "máy chọn hạng" — giỏ đọc `ma_loi` TRƯỚC `cach` (BH-2 làm theo). Không thêm `'ma_sai'`.
6. Q4: KHÔNG làm ở việc này (không đổi I13, không đổi DB). Chat ghi thành việc sau khai trương trong sổ. Ghi đúng giới hạn hiện có
   (chỉ giả lập KB33 bắt "chọn hạng mà vẫn tiêu mã") trong báo cáo là đủ.
7. Đã dùng hết 3 vòng sửa: `/lam-viec UUDAI-1 tiep` chạy soát độc lập lần 4 + cổng + báo cáo. Soát lần 4 ĐẠT → báo xong. KHÔNG ĐẠT →
   KHÔNG sửa thêm: ghi nguyên văn báo cáo vào `trang_thai.md`, push, DỪNG — chat soát thay và quyết.
**Chat soát thay sau soát lần 4 (28.10, đầu nhánh `2388d11`) — cho VÒNG SỬA 4, chỉ thêm bài thử + hồ sơ:**
8. Người soát kết luận code đúng, chỉ thiếu ca khoá. Làm ĐÚNG 4 việc, KHÔNG đổi code chạy (`server/`, `client/src/` ngoài bài thử):
   (1) ca giá trị cho `tier_unit_price`: khách Vàng, món 50.000 → 45.000 ở `tinh-thu` VÀ ở dòng `pos_order_items` đã ghi, + đột biến xoá
   `orders.js:729`; (2) ca mặc định khi THIẾU khoá cài đặt dùng chung (xoá khoá khỏi `pos_settings`) → hành vi "dùng chung" như hiện nay,
   + đột biến đảo mặc định `orders.js:718`; (3) ca giá trị giá mã 1 món trên giá đã giảm hạng (`orders.js:753`), + đột biến;
   (4) sửa các câu cũ trong `trang_thai.md` (ma_loi_code, số dòng trôi, Q5 "chặn") cho khớp hiện tại.
9. Ca mới đỏ trên code nào thì ghi `bang_chung_do.txt` như luật; nếu một ca mới bắt được LỖI THẬT (code sai, không phải ca thiếu) → KHÔNG sửa
   code, ghi Câu hỏi, push, DỪNG.
10. Xong (1)–(4): chạy bài thử, `--day-du`, toàn bộ đột biến, `node tu_chay/cong.js chay`, viết báo cáo 7 mục + dòng HEAD ĐÃ KIỂM, ghi rõ
   "SOÁT LẦN 5: chat soát thay" — KHÔNG gọi agent soát độc lập lần nữa. Push, DỪNG. Chat soát rồi soạn script gộp.

## Mục tiêu
Quầy biết chắc một đơn của khách hội viên có mã giảm sẽ tính ra bao nhiêu, theo đúng luật chủ quán đặt trong Cài đặt, và giỏ hiện
được con số đó TRƯỚC khi thu tiền. Máy chủ là nơi duy nhất quyết số tiền. Phải xong trước BH-2 (màn mới hiện giá hạng / dòng ưu đãi)
và COMBO-1a (giá combo dùng lại hàm này).

## Nghiệm thu
Số trong ví dụ: tỉ lệ hạng Vàng 10%, món 39.000đ / 50.000đ; mọi số tiền là số nguyên đồng.

- A MỘT hàm thuần `tinhUuDai(...)` ở FILE MỚI `server/utils/uuDai.js` quyết: tiền giảm hạng, tiền giảm của mã, cách đã chọn
  (`ca_hai` | `hang` | `ma` | `khong`), số tiền lợi hơn. POST / (tạo đơn, cả đường payOS của P3) và đường mới ở F gọi CÙNG hàm,
  không chép công thức. Hàm không đọc DB, không đọc giờ.
- B Dùng chung (cài đặt bật): hạng tính trước, mã tính trên phần CÒN LẠI sau hạng. Ví dụ 2 món 50.000 = 100.000, Vàng 10% → 90.000,
  mã 10% → giảm 9.000 → tổng 81.000 (code cũ ra 80.000 — đổi có chủ ý). `max_discount`, `min_order` của mã vẫn áp (min_order so với
  tiền trước mã như cũ — kế hoạch ghi rõ chọn mốc nào). Mã tiền: trừ thẳng, không vượt phần còn lại. Mã giảm 1 món: tính trên giá
  đơn vị ĐÃ giảm hạng của đúng món đó.
- C Không dùng chung (cài đặt tắt): máy chủ tính hai cách — chỉ hạng / chỉ mã — lấy tổng THẤP hơn. Bằng nhau → giữ hạng.
  Ví dụ 2 × 39.000 = 78.000, Vàng 10%: mã 20.000 → chọn mã, tổng 58.000, `tier_discount` = 0; mã 5.000 → chọn hạng, tổng 70.200.
  Chọn hạng thì mã KHÔNG bị tiêu: `used_count` không tăng, voucher không đổi trạng thái, đơn không ghi mã đó; huỷ / hoàn đơn đó
  không trả lượt mã. Chọn mã thì vẫn ghi `customer_tier` (tên hạng) nhưng không có giá hạng trên từng món.
- D Voucher đổi điểm (có dòng `pos_voucher_grants` cùng mã) LUÔN dùng chung với giá hạng, bất kể cài đặt.
- E Cài đặt: 3 khoá `pos_settings` theo loại mã — giảm %, giảm tiền, giảm 1 món — giá trị chỉ '0' | '1', MẶC ĐỊNH '1' (giữ cách đang
  chạy: cộng). Seed khi khởi động như các khoá khác. Chỉ người có quyền sửa Cài đặt mới sửa được; giá trị khác '0'/'1' → 400.
  Trang Cài đặt có khối "Mã giảm & giá hạng": mỗi loại một ô tích "Dùng chung với giá hạng" + một dòng giải thích lời thường
  ("Bỏ tích: khách hội viên chỉ được một trong hai — giá hạng hoặc mã, máy tự chọn cái giảm nhiều hơn"); dòng "Quà đổi điểm: luôn
  dùng chung" (chữ, không có ô tích).
- F Tính thử: `POST /api/pos/orders/tinh-thu` (đăng nhập như bán hàng) nhận đúng phần thân đơn như POST / (món, SĐT, mã) và trả
  subtotal, tiền giảm hạng, tiền giảm mã, tổng, cách đã chọn + câu ghi giỏ, giá đơn vị theo hạng của từng món (để màn hiện giá gạch).
  KHÔNG ghi gì: không tạo đơn, không tiêu mã, không giữ tiền, không gọi SX. Cùng một giỏ: số của tinh-thu = số POST / ghi vào đơn.
- G Không đổi: Flash vẫn chặn giá hạng như cũ; khách lẻ / thẻ hết hạn → không hạng; gói, thẻ hội viên không giảm hạng; nhóm đặc biệt
  vẫn dùng `special_discount_percent`; đơn không mã cho số y như cũ; công thức điểm DIEM-THAT-1 không đổi (điểm theo tiền thật của
  tổng mới); phí giao không giảm hạng, không áp mã.
- K5 luồng hợp lệ không bị chặn: đơn có mã mà khách không có hạng vẫn dùng mã bình thường; mã hết lượt / sai vẫn báo lỗi như cũ
  (kể cả khi máy sẽ chọn hạng — mã sai thì báo sai, không lặng lẽ bỏ).
- Ghi chú cho TOPPING-1 (KHÔNG làm ở đây): topping là dòng món → giảm hạng tự áp; COMBO-1a dùng lại `tinhUuDai`.

## Phạm vi
- viec/UUDAI-1/**
- server/utils/uuDai.js
- server/routes/orders.js
- server/routes/settings.js
- server/database.js
- client/src/pages/Settings.jsx
- client/src/pages/Sales.jsx
- client/dist/**
- cong_cu/thu_UUDAI1.js
- cong_cu/thu_P26c.js
- cong_cu/thu_P3.js
- cong_cu/thu_BH1.js
- cong_cu/gia_lap/bat_bien.js
- cong_cu/gia_lap/kich_ban.js
- cong_cu/thu_gia_lap.js
- kiem_tra_truoc_khi_giao.js

## Ngân sách
~150 dòng code + ~40 dòng giao diện + ~300 dòng thử.
**Phương án đơn giản nhất đã xét:** chỉ đổi thứ tự (mã % tính sau hạng) và một cờ chung cho mọi mã — không đủ: chủ quán chốt cài đặt
theo loại, quà luôn dùng chung, và giỏ phải biết trước máy chọn gì (cần tinh-thu dùng cùng hàm).

## Đổi cấu trúc DB
không (chỉ thêm 3 dòng seed `pos_settings`)

## Thư viện mới
không

## Cấm
- KHÔNG làm combo, topping, đổi điểm trong phiên (P3b), giao hàng; KHÔNG sửa client/src/pages/BanHang/** (BH-2 làm), không sửa
  server/routes/thanh-toan.js, wallets.js, loyalty.js, discount-codes.js, customers*.js, app_kh/**.
- KHÔNG đổi tỉ lệ / hạn điểm, mốc DIEM_THAT_TU, HUY_TRU_DIEM_TU.
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/UUDAI-1`. Không đụng main, không merge,
  không tạo PR.
