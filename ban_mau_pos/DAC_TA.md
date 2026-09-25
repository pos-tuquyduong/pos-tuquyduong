# ĐẶC TẢ GIAO DIỆN POS — bản mẫu đã chốt
**Ngày chốt:** 22–23.09.2026 · Dùng cho **P13 · P14 · P15 · P16 · P18**
Quy ước: `[CHẮC]` = kiểm được bằng file/lệnh · `[ĐOÁN]` = suy luận chưa kiểm.

---

## 0 · CÁCH DÙNG BỘ NÀY

- `ban_mau_pos.html` — **mở bằng trình duyệt, bấm thử được**. Đây là **bản vẽ đã chốt với chủ quán**, không phải gợi ý.
- `thu/` + `chay_thu.sh` — **119 phép thử** chạy trên chính bản mẫu (`bash chay_thu.sh`).
- Luật làm việc: **đổi thiết kế thì sửa bản mẫu trước**, chạy lại 119 phép, rồi mới sửa mã thật. Bản mẫu và mã thật lệch nhau là mất điểm tựa.
- Bản mẫu **chỉ là giao diện**: dữ liệu bên trong là giả, không gọi API. Đừng chép mã của nó vào `client/src` — chép **hành vi**, không chép mã.

## 1 · NĂM MÀN / KHỐI TRONG BẢN MẪU, ỨNG VỚI VIỆC NÀO

| Trong bản mẫu | Việc | Mô tả ngắn |
|---|---|---|
| Dãy thẻ số bill trên giỏ + khung thẻ (thu · in lại · huỷ) | **P13** | Bill "mang ra bàn" thành thẻ; thu 2 chạm; hoàn tác 5 giây |
| Ba nút trả tiền + dãy tờ tiền, thay popup thanh toán | **P13** (đợt 2) | 💵 Tiền mặt · ▦ Chuyển khoản · 🧾 In bill mang ra bàn |
| Nút ghi chú mặc định + ô "ghi chú khác" + nút **tách ly** | **P14** | Hai phần tách hẳn; lưu vẫn một cột |
| Ô khách + 📷 quét thẻ + khối điểm/mã trên bill | **P15** | Khách quen cộng điểm; khách lẻ in mã nhận điểm |
| Màn **Xem trước & In** + **Cài đặt in** + sổ lệnh in | **P16** (in qua trình duyệt) · **P17** (trạm in) | Bill khách · tem cốc · phiếu pha chế |
| Màn **Lịch sử đơn** + ngăn phải + nhật ký + ⇄ đổi cách trả | **P18** | Tra cứu và việc sau bán |
| Thẻ 📱 đơn app + chuông | *(khi làm App KH)* | Tự in, chuông nhắc 15 giây tới khi mở thẻ |

## 2 · API THẬT ĐÃ CÓ (P19 xong) — bản mẫu mô phỏng đúng những đường này

- `[CHẮC]` `GET /api/pos/orders/cho-thu` → dựng **dãy thẻ**. Trả `data[]` gồm `id, code, so_bill, total, debt_amount, created_at, ngay_cu, items[]`. (`server/routes/don-mo-rong.js:22`)
- `[CHẮC]` `GET /api/pos/orders/:id/nhat-ky` → **nhật ký** trong ngăn Lịch sử. Trả `data[]` gồm `luc, loai, noi_dung, nguoi`; `loai` ∈ `tao · thu · doi · huy`. (`:66`)
- `[CHẮC]` `POST /api/pos/orders/:id/doi-cach-tra` body `{ sang: 'cash'|'transfer', ly_do }` → **⇄ Đổi cách trả**. Từ chối kèm mã: `THIEU_LY_DO · DA_LA_CACH_NAY · TRANG_THAI_KHONG_DOI_DUOC · CHUA_THU_XONG · KHONG_TRONG_NGAY · TRA_KET_HOP · VUA_BI_DOI`. (`:112`)
- `[CHẮC]` `POST /api/pos/orders/:id/pay-debt` body `{ payment_method, amount? }` → **thu bill đang chờ**. Đã chặn thu hai lần, trả `409 DA_THU_ROI`. (`server/routes/orders.js:1221`)
- `[CHẮC]` `PUT /api/pos/orders/:id/cancel` body `{ reason }` → **huỷ bill**, hoàn kho. (`orders.js:1349`)
- `[CHẮC]` Client đã có sẵn `ordersApi.payDebt` / `.cancel` / `.list` / `.get` / `.create` trong `client/src/utils/api.js`. **Ba đường mới chưa có hàm gọi** — phải thêm vào đúng tệp này, không gọi `fetch` trần (bộ kiểm canh ngưỡng `fetch` trần = 34, chỉ được giảm).
- `[CHẮC]` **Chưa có API** cho: hàng đợi in, cài đặt in, mã QR thành viên mới, tem. P16/P17/P15 phải làm thêm.

## 3 · SÁU LUẬT THIẾT KẾ — bắt buộc, không thương lượng

1. `[CHẮC]` **Bấm In mới ghi đơn.** Màn xem trước là bước kiểm; bấm *Quay lại* thì **chưa có gì được ghi**, giỏ hàng còn nguyên.
2. `[CHẮC]` **Hoàn tác 5 giây chỉ cho thao tác không in giấy**: thu bill, huỷ bill, đổi cách trả. Việc đã in ra giấy thì không hoàn tác — sửa bằng *đổi cách trả* hoặc *huỷ*.
3. `[CHẮC]` **Mỗi việc một chỗ làm.** Thu tiền bill chưa thu **chỉ** ở màn Bán hàng. Lịch sử đơn chỉ có nút *"Mở ở màn Bán hàng"*, **không có nút thu**. Hai nơi thu được một đơn là hai nơi thu hai lần.
4. `[CHẮC]` **Tờ in lại luôn có dòng "IN LẠI · LẦN n"** — để pha chế không làm thêm ly, thu ngân không thu thêm lần.
5. `[CHẮC]` **Lệnh in không bao giờ mất.** Máy tắt → lệnh **chờ**, bật lại **tự in**. Máy báo lỗi (hết giấy) → **không tự in lại** (có thể đã ra nửa tờ), người bấm in lại.
6. `[CHẮC]` **Không tạo khách ở quầy.** Khách mới tự đăng ký bằng mã in trên bill.

## 4 · CHI TIẾT HÀNH VI (thứ dễ làm sai nếu chỉ nhìn ảnh)

**Dãy thẻ (P13)**
- `[CHẮC]` Thẻ mang **số bill to** = 3 số cuối mã đơn. Xếp **bill ra bàn lâu nhất lên đầu**.
- `[CHẮC]` Chấm màu: xanh → vàng (nửa ngưỡng) → **đỏ từ 10 phút**. *(Ngưỡng 10 phút là tôi đề xuất — chủ quán **chưa chốt**.)*
- `[CHẮC]` **Đang mở một thẻ thì lưới món bị khoá** — chạm món không thêm được, tránh lỡ tay thêm vào bill đã in.
- `[CHẮC]` Thu tiền mặt = 2 chạm: 💵 → chọn tờ khách đưa (*Đúng tiền* đứng đầu, mỗi tờ ghi sẵn tiền thối).
- `[CHẮC]` Huỷ bill **bắt buộc chọn lý do**; nút huỷ khoá cho tới khi chọn.

**Ghi chú từng ly (P14)**
- `[CHẮC]` Hai phần **không đụng nhau**: bỏ nút mặc định không làm mất chữ đã gõ, và ngược lại.
- `[CHẮC]` Lưu xuống máy chủ vẫn **một cột `notes`**, hai phần cách nhau bằng **dấu xuống dòng**; ô gõ một dòng nên không bao giờ lẫn ranh giới. Máy chủ cắt 200 ký tự (`server/routes/orders.js:363`; màn hình cũng cắt ở `client/src/pages/Sales.jsx:717`).
- `[CHẮC]` **Tách ly**: ly mới **sạch ghi chú**, ô gõ mở sẵn. Chạm thêm món luôn vào **dòng chưa có ghi chú**.
- `[CHẮC]` Giới hạn tem ~**40 ký tự**: quá thì tem cắt kèm "…", bill khách và phiếu pha chế vẫn in đủ, màn xem trước báo trước. *(Con số 40 là **ước lượng**, chưa in thử tem thật.)*

**Khách (P15)**
- `[CHẮC]` Khách quen: bill in *"+N điểm · tổng M"*. Khách lẻ/mới: bill in **mã nhận điểm + QR**, ghi rõ được bao nhiêu điểm và hạn 24 giờ.
- `[CHẮC]` **Không in mã** khi đã chọn khách, và **không in mã** khi đơn chưa đủ 1 điểm.
- `[CHẮC]` Quét thẻ: **từ chối mã kiểu cũ** dạng `QR-<số điện thoại>` kèm câu giải thích.

**In (P16)**
- `[CHẮC]` Ba loại phiếu, mỗi loại chọn được **in ra máy nào · mấy bản · mặc định bật cho luồng nào** (trả tại quầy · mang ra bàn · đơn app).
- `[CHẮC]` Ô chọn máy **chỉ hiện máy đúng khổ giấy** — tem không gửi nhầm ra máy bill.
- `[CHẮC]` Nhân viên bỏ tick ở màn xem trước **chỉ áp cho đơn đó**, không đổi cài đặt.

**Lịch sử (P18)**
- `[CHẮC]` Popup → **ngăn trượt bên phải**, bảng vẫn nhìn thấy.
- `[CHẮC]` Bốn ô chốt ca: **tiền mặt đã thu · chuyển khoản đã thu · còn chờ thu · đã huỷ**. *(Ô "Doanh thu" hiện nay là `SUM(total)` gồm cả đơn chưa thu — `server/routes/orders.js:86`; bốn ô mới thay nó.)*
- `[CHẮC]` Biểu tượng cột Thanh toán phải đọc **tiền thật đã nhận**, không đọc `payment_method` — nay đơn `cho_thu` đã thu xong vẫn hiện ⏳ (`client/src/pages/Orders.jsx:374`).

## 5 · ĐÃ LOẠI — đừng dựng lại

- `[CHẮC]` **Chọn bàn · gọi thêm vào bàn · thu gộp nhiều bill** — quán không đánh số bàn, khách trả ngay khi cầm bill. Thu gộp còn kéo theo một **đường tiền mới** ở máy chủ.
- `[CHẮC]` **Nút "In lại" trên thanh báo sau khi in** — chủ quán thấy thừa.
- `[CHẮC]` **Hoàn tác kiểu xoá đơn** — hoàn tác phải **quay lại bước chọn cách trả, giữ nguyên giỏ**.
- `[CHẮC]` **Popup thanh toán nhiều bước** — cả vòng cũ tốn 11 lần bấm · 4 popup · 2 lần đổi màn; bản mẫu còn 4 lần bấm · 0 popup.

## 6 · CÒN CHỜ CHỦ QUÁN QUYẾT — không tự quyết thay

- `[CHẮC]` ① Ngưỡng **10 phút** (bill chờ đỏ) và **5 giây** (hoàn tác). ② Có tuỳ chỉnh nào **làm đổi giá** không (cỡ ly, topping)? Có thì P14 phình thành việc lớn. ③ Bao giờ mua máy in (quyết P16 dừng ở đâu, P17 bắt đầu khi nào). ④ Làm trang nhận điểm tạm hay đợi App KH. ⑤ Đơn app có cần nhân viên "nhận đơn" trước khi in.

## 7 · KIỂM BẢN MẪU CÒN NGUYÊN

```bash
bash chay_thu.sh          # phải: TỔNG: 119 đạt · 0 hỏng
```
- `[CHẮC]` Bài nào **không in ra được kết quả** bị tính là **SẬP = hỏng** — bộ chạy không bao giờ im lặng bỏ qua.
- `[CHẮC]` Sửa bản mẫu xong mà số phép thử **giảm**, hoặc có bài sập, là đã làm hỏng một hành vi đã chốt.
