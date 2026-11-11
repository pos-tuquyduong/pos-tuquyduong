# GIAO-1 — Giao hàng Ahamove ở quầy: màn "Giao hàng" 4 cột, gọi tài xế đúng lúc, huỷ theo bước, Cài đặt → Giao hàng

<!-- Phiếu do chat soạn 05.11.2026 (bàn 32). Việc [T] (tiền + bên thứ ba) — Opus, lập kế hoạch rồi DỪNG chờ duyệt.
     Chủ quán chốt 18–21.10 (sổ GIAO-1), 24.10 (ban_mau_pos/DAC_TA_BAN_HANG_2410.md mục 15), 29.10 (khoá chỉ ở biến môi trường Render) và 05.11 (chat
     claude.ai bàn 32, duyệt hình mẫu): giao Ahamove, KHÔNG COD; phí ship là dòng riêng — không giảm hạng, không áp mã, không tích điểm; khách trả
     ĐÚNG phí Ahamove báo; thu đủ TRƯỚC rồi mới gọi xe; phí lệch lúc gọi xe quán chịu, Đối soát ghi lại; huỷ chuyến được. Ô địa chỉ dùng GỢI Ý ĐỊA
     CHỈ CỦA AHAMOVE (không thêm dịch vụ bản đồ — chủ quán không muốn phát sinh chi phí). Chủ quán muốn thao tác thật tiện và code thật chuẩn.
     Hiện trạng 05.11: khoá THỬ (staging) chạy được — token qua POST {gốc}/v3/accounts/token {mobile, api_key}, báo phí qua POST {gốc}/v3/orders/estimates
     (gốc staging https://partner-apistg.ahamove.com, thật https://partner-api.ahamove.com); Hà Nội: HAN-BIKE, HAN-EXPRESS. pos_orders đã có cột
     shipping_fee; hoá đơn có nhãn "Phí giao Ahamove" (invoice_chu_phi_giao). App KH giao (KH-MUA-2) là việc SAU, dùng chung hàm của việc này. -->

**Chờ duyệt kế hoạch:** viết `viec/GIAO-1/ke_hoach.md` (kèm cách gọi API Ahamove đã đọc trong tài liệu, trạng thái chuyến, cách xác thực tin Ahamove
báo về), commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Quầy nhận và giao đơn qua Ahamove với ít thao tác nhất (2 lần bấm: Nhận đơn, Gọi tài xế), tài xế tới vừa lúc đồ xong, khách không mất tiền khi huỷ, và
Đối soát khớp từng đồng tiền ship.

## Nghiệm thu
- A **Biến môi trường (chỉ ở Render):** `AHAMOVE_API_KEY`, `AHAMOVE_SDT`, `AHAMOVE_MOI_TRUONG` (`staging` | `production`, mặc định staging),
  `AHAMOVE_KHOA_BAO` (khoá bí mật cho tin Ahamove báo về). Không khoá nào ở DB, sao lưu, nhật ký, trả về trình duyệt. Cài đặt chỉ hiện
  "Ahamove: đã cài ✓ (bản thử | bản thật) / chưa cài ✗".
- B **Cài đặt → Giao hàng** (chủ quán sửa): khoảng cách giao tối đa (km), giờ nhận đơn giao, loại xe mặc định (HAN-BIKE / HAN-EXPRESS), phút pha mỗi món
  (mặc định 2), phút tìm xe ước tính (mặc định 6), phút nhắc khi đã nhận mà chưa gọi xe (mặc định 15), địa chỉ + toạ độ điểm lấy hàng của quán (chọn qua ô
  gợi ý Ahamove), SĐT liên hệ của quán cho tài xế.
- C **Ô địa chỉ có gợi ý của Ahamove:** máy chủ làm trung gian (khoá không ra trình duyệt); người dùng gõ → chọn một gợi ý → lưu địa chỉ chuẩn + toạ độ;
  KHÔNG nhận địa chỉ gõ tự do không chọn gợi ý. Ô ghi chú cho tài xế (số nhà, ngõ, tầng). Quá khoảng cách tối đa → không cho tạo đơn giao, báo rõ.
- D **Bán hàng ở quầy — đơn giao** (đặc tả mục 15): "Mang đi / tại quán" | "Giao hàng · Ahamove" → SĐT + tên người nhận + địa chỉ (ô C) → "Tính phí"
  (chưa tính phí thì chưa thu được) → phí là dòng riêng (không giảm, không mã, không điểm) → thu đủ (tiền mặt / chuyển khoản / tài khoản theo luật
  hiện có) → đơn vào cột "Đang pha" của màn Giao hàng. Hoá đơn in "GIAO HÀNG: <địa chỉ>".
- E **Màn "Giao hàng"** (theo hình mẫu chủ quán duyệt 05.11): 4 cột màu khác nhau — Mới · Đang pha · Đợi tài xế · Đang giao (điện thoại: 4 tab); mỗi thẻ: số
  HD, tên, số món, km; MỘT nút chính = việc tiếp theo. Bấm thẻ → chi tiết đơn (món, ghi chú món, người nhận, SĐT, địa chỉ, ghi chú tài xế, km, phí,
  đã trả bằng gì) để quyết Nhận / Từ chối. Cột "Mới" dành cho đơn App giao (KH-MUA-2); việc này dựng sẵn cột và luồng Nhận / Từ chối.
- F **Gọi tài xế đúng lúc:** thẻ "Đang pha" hiện "Gọi tài xế lúc HH:MM" = lúc nhận + (số món × phút/món, cộng phần của các đơn đang pha trước nó) − phút
  tìm xe; tới giờ thẻ đổi màu + kêu nhẹ; quá phút nhắc mà chưa gọi → nhắc lại. Quầy vẫn tự bấm "Gọi tài xế" (không tự gọi).
- G **Gọi xe chuẩn:** báo phí lại lúc gọi; tạo chuyến Ahamove (mã theo dõi = số HD của đơn) với toạ độ đã lưu; bấm hai lần / hai máy cùng bấm → MỘT
  chuyến; lỗi mạng giữa chừng → kiểm lại theo mã theo dõi trước khi tạo lại. Phí thật ≠ phí khách trả → ghi phần chênh (quán bù / dư) cho Đối soát,
  thẻ hiện "quán bù X đ".
- H **Ahamove báo về (webhook):** xác thực bằng `AHAMOVE_KHOA_BAO` (kế hoạch nêu cách: đường dẫn bí mật / header, so sánh an toàn thời gian); mỗi báo xử
  lý một lần (báo lặp không đổi gì thêm); trạng thái lưu kèm giờ. Có tài xế → thẻ sang "Đợi tài xế" hiện tên, biển số, SĐT tài xế + in tem túi giao
  (số HD, người nhận, SĐT, địa chỉ, ghi chú, tài xế, biển số); tài xế lấy hàng → TỰ sang "Đang giao" (quầy không bấm); giao xong → đơn hoàn tất.
- I **Sự cố tự xử lý:** tìm xe quá 10 phút không có → thẻ đỏ + nút "Tìm lại" / đổi loại xe; tài xế huỷ chuyến → tự tìm lại MỘT lần + báo quầy; Ahamove
  lỗi / mất mạng → báo rõ trên thẻ, không mất đơn.
- J **Huỷ theo bước** (quyền + lý do bắt buộc như HUY-1: quản lý + chủ quán): Mới → "Từ chối"; Đang pha → huỷ (đồ đã pha ghi hàng hỏng); Đợi tài xế
  (tài xế chưa lấy hàng) → máy huỷ chuyến Ahamove rồi huỷ đơn, phí huỷ Ahamove (nếu có) quán chịu, ghi Đối soát; Đang giao → KHÔNG huỷ trên máy (dùng
  "Báo sự cố"). Hoàn tiền: TRƯỚC khi HUY-1 gộp chỉ cho huỷ đơn giao chưa thu / thu bằng tài khoản (đường huỷ hiện có); khi HUY-1 gộp dùng đường hoàn
  toàn bộ của HUY-1 — kế hoạch nêu cách nối.
- K **Đối soát:** mỗi ngày: tổng phí ship khách trả, tổng phí Ahamove thật, phần quán bù / dư, phí huỷ chuyến; đơn giao huỷ.
- K5 **Không đổi:** cách tính tiền món, điểm, hạng, mã; đơn không giao; cửa App (KH-MUA-2 làm sau).

## Phạm vi
- viec/GIAO-1/**
- ban_mau_pos/**
- server/utils/ahamove.js
- server/utils/giaoHang.js
- server/routes/giao-hang.js
- server/routes/orders.js
- server/routes/refunds.js
- server/routes/damages.js
- server/routes/settings.js
- server/routes/hoaDon.js
- server/routes/backup.js
- server/utils/dongHoaDon.js
- server/utils/doiSoat.js
- server/utils/donThu.js
- server/utils/giuCho.js
- server/index.js
- server/database.js
- server/nang_cap/021_giao_hang.js
- server/nang_cap/chay.js
- client/src/**
- client/dist/**
- cong_cu/thu_GIAO1.js
- kiem_tra_truoc_khi_giao.js

<!-- Chủ quán 05.11 (5 câu kế hoạch ef672f9):
     Q1 — gợi ý địa chỉ: Ahamove CÓ API gợi ý (gói @ahamove/react gọi GET <apiURL>/dplaces/web/v2/autocomplete?text=…, header `apikey`; chi
       tiết gplaces/web/v2/detail; trả features có lat/lng) nhưng cần apiURL + apiKey RIÊNG do Ahamove cấp — chủ quán đang hỏi Ahamove. Làm ô địa chỉ
       qua MỘT hàm máy chủ có hai cách: (1) có biến môi trường AHAMOVE_DIA_CHI_URL + AHAMOVE_DIA_CHI_KHOA → gợi ý thật; (2) chưa có → cách của máy:
       gửi chữ cho Ahamove định vị, hiện lại địa chỉ + km Ahamove hiểu để nhân viên XÁC NHẬN rồi mới tính phí. Thử cách (2) bằng khoá thử trước.
       Không dùng OpenStreetMap / Google.
     Q2 CÓ — thêm server/utils/giuCho.js (đơn giao trả QR / tài khoản).
     Q3 — dựng theo chữ mục E (4 cột MÀU KHÁC NHAU, bấm thẻ ra chi tiết để quyết Nhận / Từ chối, mỗi thẻ một nút chính); chủ quán duyệt bằng mắt
       trên bản thử.
     Q4 — huỷ đơn ĐANG PHA / ĐỢI TÀI XẾ: máy hỏi "Đồ đã pha: Dùng cho đơn khác | Bỏ đi". Huỷ luôn hoàn kho như đường huỷ hiện có. "Dùng cho
       đơn khác" → không ghi gì thêm (đơn sau tự trừ kho khi bán). "Bỏ đi" → ghi HÀNG HỎNG đúng món + số lượng (dùng chung hàm của
       server/routes/damages.js, lý do "huỷ đơn giao <số HD>") để kho trừ lại đúng; đánh dấu trên chuyến + Đối soát liệt kê.
     Q5 CÓ — thêm server/routes/refunds.js: không cho hoàn đơn giao còn chuyến ở Ahamove.
     Vượt ngân sách máy chủ (~755 dòng) chấp nhận nếu cần, ưu tiên gọn. -->
## Bài thử đỏ
Có — `cong_cu/thu_GIAO1.js` ĐỎ trên code gốc, chạy với một Ahamove GIẢ trong tiến trình (không gọi Ahamove thật): khoá không lộ ra trình duyệt /
sao lưu / nhật ký; địa chỉ không qua gợi ý → 400; quá km → 400; phí là dòng riêng (không giảm, không mã, không điểm); chưa thu đủ → không gọi xe;
gọi hai lần / song song → một chuyến; lỗi mạng giữa chừng không tạo chuyến thứ hai; báo về sai khoá → 401, báo lặp không đổi thêm; tài xế lấy hàng
→ tự "Đang giao"; huỷ ở từng bước đúng bảng J; phí lệch ghi Đối soát; giờ gợi ý gọi tài xế đúng công thức F.

## Ngân sách
~600 dòng máy chủ + ~700 dòng giao diện + ~800 dòng thử.
**Phương án đơn giản nhất đã xét:** một mô-đun `ahamove.js` (token, báo phí, tạo / huỷ chuyến, gợi ý địa chỉ — chỉ máy chủ gọi), một bảng chuyến giao
gắn với đơn, một màn Giao hàng đọc bảng đó; trạng thái chỉ đổi qua một hàm duy nhất.

## Đổi cấu trúc DB
có — chỉ THÊM (bước 021): bảng chuyến giao (đơn, mã chuyến Ahamove, trạng thái + giờ từng bước, tài xế, phí báo / phí thật / chênh, phí huỷ), bảng nhật
ký tin Ahamove báo về (chống xử lý lặp), cài đặt giao hàng. Bảng mới vào BACKUP_TABLES (không chứa khoá).

## Thư viện mới
không

## Soát bảo mật
có — khoá bên thứ ba, webhook vào, tiền ship, chống gọi xe hai lần.

## Cấm
Không gọi Ahamove THẬT (production) trong bài thử; không làm phần App (KH-MUA-2), nạp gói (NAP-1), huỷ hoàn toàn bộ (HUY-1).
