# DIEM-THAT-1 — Điểm thưởng chỉ tính trên tiền khách trả thật

<!-- Phiếu do chat soạn 25.10.2026. Việc tiền [T] — Opus, máy lập kế hoạch, dừng chờ chủ quán duyệt. Nền: main `5cb2a03` (P24 đã gộp:
     huỷ / xoá trừ điểm, mốc HUY_TRU_DIEM_TU = '2026-10-26'). Đặc tả: ban_mau_pos/DAC_TA_BAN_HANG_2410.md mục 1.14 — chủ quán chốt
     24.10, đừng hỏi lại: điểm CHỈ trên tiền mặt + chuyển khoản thật, KHÔNG tính phần trừ tài khoản (tài khoản / tài khoản mẹ), KHÔNG
     tính phí giao; tỉ lệ vẫn ở Cài đặt `loyalty_earn_per_amount`.
     Code đọc 25.10: `tinhDiemDon(tong, luc)` orders.js:42 (một công thức, P22-23); gọi ở orders.js:854 (POST /, `total`) và :1311
     (pay-debt, `order.total`); mã nhận điểm khách lẻ signup-codes.js:228 (`don.total`, nhân hệ số `nhandiem_he_so`); I8 bat_bien.js:141
     (`g = floor(total / per)`); phí giao là cột `pos_orders.shipping_fee` (`finalShippingFee` orders.js:729).
     P3 đang chạy song song và sửa thân POST / quanh 752–772, 819–860, sau INSERT — KHÔNG sửa `tinhDiemDon`, pay-debt, signup-codes, giả lập.
     Gộp: việc này gộp SAU P3 (script gộp của chat gộp main mới vào nhánh rồi chạy lại bộ bài; bài P3 nào giả định điểm = total/per thì
     máy của việc gộp sau sửa theo). -->

**Chờ duyệt kế hoạch:** viết `viec/DIEM-THAT-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

**Đã duyệt (chủ quán 25.10, sau khi chat soát kế hoạch `ke_hoach.md` đầu nhánh `ae69923`):** kế hoạch được duyệt kèm các điểm sau; máy làm
tiếp từ bước 4 (`/lam-viec DIEM-THAT-1 tiep`) tới hết, không dừng hỏi lại các điểm này:
1. ĐỔI chỗ đặt hàm (thay Phần 1 phương án A): `tienTinhDiem` nằm trong FILE MỚI `server/utils/diemThat.js` (export một hàm thuần).
   `orders.js` nạp nó bằng MỘT dòng `require` đặt NGAY TRÊN `tinhDiemDon` (vùng 39–59); `signup-codes.js` nạp thẳng ở đầu file (không
   nạp lười, không vòng). KHÔNG thêm dòng export nào ở cuối `orders.js` — P3 đang thêm `module.exports.taoDon` đúng chỗ đó, hai dòng sát
   nhau sẽ đụng khi gộp. Bài A2 đổi theo: đúng 1 định nghĩa `tienTinhDiem` (ở `diemThat.js`), 0 bản chép.
2. Câu hỏi 1: `cong_cu/thu_P20.js` đã thêm vào Phạm vi — sửa ca "trả bằng ví" như kế hoạch + thêm ca ví trọn → 400 `DON_KHONG_DU_DIEM`.
3. Câu hỏi 2: (a) — để nguyên lời hứa điểm trên bill (`orders.js:1207`); chat ghi cho HD-1 / P15.
4. I8 tính công thức RIÊNG (Phần 3 phương án A); mốc `DIEM_THAT_TU = '2026-10-27'` ghi tạm, chat sửa = ngày gộp + 1 lúc gộp.
5. Việc này gộp SAU P3. Ca điểm trong `cong_cu/thu_P3.js` (P3 viết theo công thức cũ) nếu vỡ khi gộp thì CHAT sửa trong script gộp —
   máy KHÔNG đụng `thu_P3.js`.
6. Phát hiện `doiSoat.js:257` (chú thích cũ): việc sau, không sửa ở đây.

## Mục tiêu
Khách được điểm đúng bằng số tiền họ thật sự bỏ ra lần này. Tiền đã nạp sẵn trong tài khoản (đã được tính lúc nạp hay không là chuyện
khác) và phí giao không sinh điểm, ở mọi đường cộng điểm.

## Nghiệm thu
- A MỘT hàm `tienTinhDiem(dong)` = `max(0, cash_amount + transfer_amount − shipping_fee)` (số nguyên), đặt cạnh `tinhDiemDon`; mọi chỗ cộng
  điểm dùng nó, không chép công thức.
- B POST / (đơn thu đủ lúc tạo): điểm = floor(tienTinhDiem / per). Đơn trả trọn bằng tài khoản → 0 điểm. Tài khoản một phần + tiền mặt →
  điểm chỉ trên phần tiền mặt. Có phí giao → trừ phí trước khi chia.
- C pay-debt (nợ cũ thu đủ): điểm trên tổng tiền mặt + chuyển khoản ĐÃ thu của đơn (kể cả lúc tạo) − phí giao.
- D Mã nhận điểm khách lẻ: điểm gốc theo tienTinhDiem của đơn, rồi nhân hệ số như cũ.
- E Flash vẫn 0 điểm; đơn chưa thu đủ vẫn 0 (P22-23); huỷ / xoá vẫn trừ đúng số đã cộng (P24) — không đổi.
- F Bất biến I8 tính theo cùng công thức cho đơn tạo từ mốc `DIEM_THAT_TU` (ghi tạm, chat sửa = ngày gộp + 1); đơn cũ hơn ở Đối soát
  thật được nhận luật cũ (khuôn mốc của P22-23 / P24). Mỗi vế điều kiện mới có một ca thử + một đột biến gỡ đúng vế đó (bài học P24).
- G K5: đơn tiền mặt / chuyển khoản không trừ tài khoản, không phí giao → điểm như cũ (không ai bị thiệt so với trước).

## Phạm vi
- viec/DIEM-THAT-1/**
- server/routes/orders.js
- server/routes/signup-codes.js
- server/utils/diemThat.js
- cong_cu/gia_lap/bat_bien.js
- cong_cu/gia_lap/kich_ban.js
- cong_cu/thu_DIEMTHAT1.js
- cong_cu/thu_P2223.js
- cong_cu/thu_P24.js
- cong_cu/thu_gia_lap.js
- cong_cu/thu_DOISOAT1.js
- cong_cu/thu_P20.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — bài mới `cong_cu/thu_DIEMTHAT1.js` (máy chủ thật trên kho tạm, khuôn `thu_P2223.js`) phải ĐỎ trên code gốc.

## Ngân sách
Code ~30 dòng; bất biến ~20; bài thử mới ~200.
**Vùng sửa của file chung:** `orders.js` CHỈ: thêm `tienTinhDiem` cạnh `tinhDiemDon` (dòng 39–59), đổi ĐÚNG MỘT dòng gọi ở POST / (~854,
chỉ biểu thức đối số) và dòng gọi ở pay-debt (~1311). KHÔNG đụng chỗ khác của thân POST / (P3 đang sửa). `kiem_tra_truoc_khi_giao.js`:
chỉ thêm tên bài mới vào CUỐI mảng bài chạy thật (~495) — P3 cũng thêm; script gộp của chat giữ đủ các tên.
**Phương án đơn giản nhất đã xét:** một hàm tính "tiền thật" từ ba cột sẵn có của đơn, đổi đối số ở ba chỗ gọi.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- KHÔNG đổi tỉ lệ / hạn điểm, luật flash, luật huỷ (P24), đổi quà, giữ điểm trong phiên (P3b).
- KHÔNG sửa server/routes/thanh-toan.js, server/utils/** (trừ file MỚI `server/utils/diemThat.js`), wallets.js, customers*.js, client/**, app_kh/**.
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/DIEM-THAT-1`. Không đụng main, không merge, không tạo PR.
