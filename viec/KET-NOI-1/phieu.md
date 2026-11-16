# KET-NOI-1 — Kết nối bền vững: đọc tự thử lại khi rớt mạng, thu tiền ở quầy bấm lại không ra đơn đôi, lỗi mạng báo dễ hiểu

<!-- Phiếu do chat soạn 16.11.2026 (bàn 38, sổ v69, main 1d66c61). Việc [T] (đường thu tiền quầy) — Opus làn 1, CÓ kế hoạch chủ quán duyệt, CÓ soát bảo mật.
     Nguồn — chủ quán 12.11 (TRƯỚC khai trương): Cài đặt báo "socket hang up" khi Render gọi Turso. 16.11 gặp lại hai lần: (a) trưa, Cài đặt › Sao lưu
     "Chưa tải dữ liệu… turso.io/v2/pipeline failed, reason: socket hang up"; (b) chat thử Ahamove B-LOI-1: màn Bán hàng sau "Đúng địa chỉ" hiện NGUYÊN
     chữ kỹ thuật đó + nút Thử lại, ô Phải trả "Đang tính…" mà nút cuối ghi "Đơn 0đ — hoàn tất" (nút bị khoá vì chưa có số máy chủ — không ra đơn 0đ,
     nhưng chữ sai, nhân viên hoảng). Bấm Thử lại một lần thì tính đúng.
     Chat đọc main 1d66c61:
       - server/database.js: query() / run() (~1495 / ~1530) gọi db.execute một lần, lỗi → ném ngay; thayKetNoiNeuBan chỉ cho kho FILE. queryOne gọi query.
         Giao dịch (beginTransaction ~1581, trongGiaoDich ở routes/wallets.js) dùng kết nối riêng — KHÔNG thuộc việc này.
       - Thu tiền quầy (màn Bán hàng mới BH-2, BanHangMoi.jsx chayPhien ~266): POST /thanh-toan/phien (giuCho.taoPhien, giữ ví / voucher, giữ số hoá
         đơn) → POST /thanh-toan/phien/:id/chot (chotPhien; lần hai → 409 PHIEN_DA_CHOT). Chốt hỏng → GET /phien/:id kiểm đã ghi chưa; GET đó cũng rớt →
         "Mất kết nối khi chốt — KHÔNG thu lại ngay…". taoPhien rớt mạng sau khi máy chủ đã ghi → phiên mồ côi giữ ví / voucher tới hết hạn; bấm lại ra phiên
         thứ hai. Nạp ở quầy, bán gói, thẻ hạng, giao hàng đều đi CHÍNH đường này.
       - Khuôn "mã lượt bấm" có sẵn: kho_phieu.ma_gui (nang_cap/002 — UNIQUE WHERE NOT NULL) + server/kho/duong.js ghiPhieu(lam, khiTrung) ~195:
         đụng khoá duy nhất → trả bản ghi đã có. Client Kho (PhaChe.jsx, NhanHang.jsx…) sinh ma_gui mỗi lần bấm.
       - Đơn App POST /api/kh/don đã có khoa_gui (KH-MUA-1) — không thuộc việc này. Webhook tiền về đã chống trùng theo khoá báo.
       - client/src/utils/api.js request() (~150): fetch ném TypeError khi rớt mạng → e.message tiếng Anh ("Failed to fetch") ra thẳng màn hình; 5xx của máy
         chủ trả err.message thô (chữ Turso) ở nhiều route.
       - Số bước nâng cấp DB trống tiếp theo: 029 (KH-NAP-1 không dùng).
     Song song: Opus làn 2 làm QUA-1 (quà chào mừng — có thể đụng orders.js / uuDai.js), Sonnet làm MANKHACH-2a (màn khách — có thể đụng BanHangMoi.jsx
     chỗ báo phiên cho màn khách) → xem Cấm. -->

**Chờ duyệt kế hoạch:** viết `viec/KET-NOI-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Mạng giữa máy chủ (Render) và kho dữ liệu (Turso), hoặc giữa máy quầy và máy chủ, chập chờn một nhịp thì quầy KHÔNG thấy lỗi kỹ thuật, KHÔNG phải đoán đơn
đã ghi chưa, và tiền KHÔNG bao giờ ghi hai lần: đọc thì máy tự thử lại; thu tiền ở quầy thì mỗi lần bấm mang một mã, gửi lại cùng mã chỉ ra đúng một kết quả;
ghi khác thì báo rõ để nhân viên tự kiểm. Làm TRƯỚC khai trương — giờ cao điểm bán hàng mà rớt một nhịp là kẹt quầy.

## Nghiệm thu

### A. Máy chủ: ĐỌC tự thử lại khi rớt kết nối
- A1 `query` / `queryOne` (ngoài giao dịch) gặp lỗi MẠNG (socket hang up, ECONNRESET, ETIMEDOUT, EPIPE, "fetch failed", … — kế hoạch liệt kê dấu hiệu nhận
  dạng, MỘT hàm `laLoiMang`) → tự thử lại tối đa 2 lần, chờ ngắn tăng dần (tổng ≤ ~1 giây); lần thứ ba vẫn hỏng → ném như cũ.
- A2 CHỈ thử lại câu ĐỌC: câu bắt đầu bằng SELECT / WITH (bỏ khoảng trắng, chú thích đầu). `run()` và mọi câu ghi đi qua `query()` (nếu có) KHÔNG thử lại.
  Kế hoạch grep và liệt kê chỗ nào gọi `query()` với câu không phải SELECT.
- A3 Lỗi KHÔNG phải mạng (sai SQL, ràng buộc, SQLITE_BUSY đã có đường riêng P26d) → không thử lại, hành vi như cũ.
- A4 Mỗi lần rớt: một dòng log `[KET-NOI] …` (loại lỗi, lần thử, thử lại được hay không — KHÔNG có câu SQL đầy đủ, KHÔNG có tham số / dữ liệu khách);
  đếm trong bộ nhớ, `GET /api/pos/health` trả thêm `ket_noi: { rot, thu_lai_dat, thu_lai_hong, tu }` (tu = lúc máy chủ khởi động).

### B. Thu tiền ở quầy: mã lượt bấm (khuôn ma_gui của Kho)
- B1 Màn Bán hàng mới sinh MỘT `ma_gui` cho mỗi lần bấm thu (mỗi lần chayPhien), gửi kèm `POST /thanh-toan/phien`. Cột mới `pos_phien_thanh_toan.ma_gui`
  (UNIQUE khi khác NULL, bước nâng cấp 029). Cùng `ma_gui` lần hai → trả ĐÚNG phiên đã tạo (cùng id, cùng số giữ, cùng QR), không tạo phiên thứ hai, không giữ
  ví / voucher / số hoá đơn lần nữa (đúng kiểu khiTrung: đụng khoá → đọc bản đã có). `ma_gui` lần hai mà thân KHÁC lần đầu (giỏ khác) → 409 rõ ràng, không
  trả nhầm phiên. Không gửi `ma_gui` → như cũ (đơn App, lời gọi cũ, bài thử cũ không đổi).
- B2 `POST /thanh-toan/phien/:id/chot` gọi lần hai cho phiên mà CHÍNH lần chốt trước đã ghi xong (da_thu, có order_id, cùng cách trả) → 200 với đúng đơn đã
  ghi (như lần đầu), KHÔNG 409, không ghi gì thêm. Phiên đã huỷ / hết hạn / chốt bởi đường khác → giữ 409 như cũ.
- B3 Màn Bán hàng: tạo phiên / chốt / hỏi phiên gặp lỗi MẠNG (không có trả lời từ máy chủ, hoặc 502/503/504 của Render) → tự gửi lại CÙNG ma_gui / cùng phiên,
  tối đa 2 lần, chờ ngắn; nút thu khoá suốt lúc gửi (đã có dangGui). Gửi lại xong → đi tiếp như bình thường (in hoá đơn). Hết lượt vẫn không biết →
  câu báo rõ (B5), KHÔNG tự nhả phiên khi chưa biết máy chủ đã ghi hay chưa.
- B4 Bấm hai lần liền / gửi lại sau rớt mạng → đúng MỘT đơn, ví trừ MỘT lần, voucher dùng MỘT lần, MỘT số hoá đơn. Ca thử tất định: móc lớp mạng giả
  "máy chủ đã ghi rồi mới rớt trả lời" cho cả tạo phiên và chốt.
- B5 Câu báo khi hết lượt mà vẫn rớt: "Mất kết nối — chưa biết đơn đã ghi chưa. Đừng thu lại: mở Đơn hàng kiểm đơn mới nhất." (một chỗ dựng câu).
- B6 Kế hoạch liệt kê ĐỦ mọi đường GHI TIỀN quầy đang có (tạo / chốt / huỷ phiên, xác nhận tay, nạp tay chủ quán, huỷ đơn HUY-1, sự cố / hoàn, giao hàng
  gọi xe…) kèm cách mỗi đường đang chống bấm hai lần. Đường nào CHƯA chống mà không đi qua phiên → đề xuất trong kế hoạch (làm trong việc này hay để
  việc sau), chủ quán quyết lúc duyệt.

### C. Ghi khác rớt mạng: báo rõ, không tự ghi lại
- C1 client/src/utils/api.js: fetch ném lỗi mạng → lỗi có `code: 'MAT_KET_NOI'` + lời tiếng Việt "Mất kết nối tới máy chủ — kiểm tra mạng rồi thử lại"
  (một chỗ). GET rớt mạng → tự thử lại tối đa 2 lần (đọc an toàn). POST / PUT / DELETE KHÔNG tự gửi lại (trừ các lời gọi B3 có mã).
- C2 Máy chủ: lỗi mạng tới kho (sau A1 vẫn hỏng) → trả 503 `KHO_MAT_KET_NOI` với lời dễ hiểu ("Mất kết nối tới kho dữ liệu — thử lại sau vài giây"),
  KHÔNG trả nguyên chữ lỗi Turso / địa chỉ kho ra màn hình. Kế hoạch chọn MỘT chỗ làm (vd loiGhi / bộ bắt lỗi chung), không sửa từng route.

### D. Hồi quy (K5) — luồng bình thường KHÔNG đổi
- D1 Mạng tốt: tạo phiên, chốt tiền mặt / trừ tài khoản / QR, nạp, gói, thẻ, giao hàng, đơn App, webhook tiền về — kết quả y như trước (bài cũ xanh).
- D2 Phiên QR: QR hết hạn / huỷ / tiền về muộn — không đổi (KH-NAP-1).
- D3 SQLITE_BUSY / KHO_BAN (P26d) giữ đường cũ.

### E. Màn Bán hàng khi chưa có số máy chủ (B-LOI-1, chat thử Ahamove 16.11)
- E1 Chưa có số máy chủ cho đúng giỏ (`coSo` sai: đang tính / tính hỏng) → khối thu KHÔNG hiện nhánh "Đơn 0đ — hoàn tất" / "Trả đủ bằng tài khoản"; chỉ hiện
  "Đang tính…" hoặc lời lỗi + nút Thử lại. Đơn 0đ thật (máy chủ tính ra 0) vẫn hiện như cũ.
- E2 Lời lỗi tính giá: lỗi mạng / 503 KHO_MAT_KET_NOI → "Mất kết nối, bấm Thử lại"; không bao giờ hiện chữ kỹ thuật (địa chỉ kho, "socket hang up").
  Lỗi nghiệp vụ (mã hết hạn, hết hàng…) giữ nguyên lời máy chủ.

## Phạm vi
- viec/KET-NOI-1/**
- server/database.js
- server/index.js
- server/nang_cap/029_ket_noi.js
- server/utils/giuCho.js
- server/routes/thanh-toan.js
- server/routes/wallets.js
- client/src/utils/api.js
- client/src/pages/BanHang/BanHangMoi.jsx
- client/src/pages/BanHang/ThuTien.jsx
- client/src/pages/BanHang/tinh.js
- client/dist/**
- cong_cu/thu_KETNOI1.js
- cong_cu/thu_*.js
- cong_cu/gia_lap/kich_ban.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_KETNOI1.js` ĐỎ trên gốc: đọc rớt một nhịp → lỗi ngay; cùng ma_gui tạo hai phiên; chốt lần hai 409; rớt mạng ra chữ kỹ thuật; nhánh
"Đơn 0đ — hoàn tất" hiện khi chưa có số máy chủ.

## Ngân sách
~150 dòng máy chủ + ~80 dòng giao diện + ~400 dòng thử.
**Phương án đơn giản nhất đã xét:** thử lại đặt ở MỘT chỗ (database.js `query`) chỉ cho câu SELECT; chống đơn đôi dùng LẠI khuôn ma_gui của Kho (một cột +
khoá duy nhất trên bảng phiên, đụng khoá → trả phiên đã có) và chỉ cho đường thu tiền quầy — mọi cách trả, nạp, gói, thẻ, giao hàng đều đi qua phiên nên một
chỗ là đủ; chốt lần hai trả đúng kết quả đã ghi. Không đổi thư viện, không thêm hàng đợi ngoại tuyến, không thử lại câu ghi ở máy chủ.

## Đổi cấu trúc DB
có — bước nâng cấp `029_ket_noi.js`: THÊM cột `pos_phien_thanh_toan.ma_gui TEXT` + chỉ mục UNIQUE `WHERE ma_gui IS NOT NULL` (khuôn 002_kho_pha_che.js).
Không xoá / đổi tên gì.

## Thư viện mới
không

## Soát bảo mật
có — đường thu tiền / giữ ví / voucher (chống ghi hai lần), lời lỗi trả ra màn hình (không lộ địa chỉ kho / chi tiết máy chủ), nhật ký (không ghi dữ liệu khách).

## Câu hỏi kế hoạch (trả lời trong ke_hoach.md, chủ quán duyệt)
- Q-A Danh sách dấu hiệu "lỗi mạng" (A1) lấy từ đâu — @libsql/client HTTP ném dạng gì; kèm ca thử cho từng dạng.
- Q-B Bảng B6: mọi đường ghi tiền quầy + cách chống bấm hai lần hiện có + đề xuất cho đường còn hở.
- Q-C B1: "thân khác" so bằng gì (băm thân đã chuẩn hoá như khoa_gui của đơn App?) — chọn cách ít dòng nhất.
- Q-D C2: chỗ duy nhất đổi lỗi mạng thành 503 dễ hiểu (loiGhi của wallets.js đang dùng ở đâu, route nào không qua nó).

## Cấm
- Không thử lại câu GHI ở máy chủ (run, giao dịch). Không thêm hàng đợi / lưu đơn ngoại tuyến. Không đổi thư viện.
- Không đụng đơn App (`/api/kh`, donApp.js), webhook tiền về, giao hàng (giaoHang.js) — ngoài việc dùng chung lời lỗi C2 nếu đi qua chỗ chung.
- `giuCho.js`: chỉ thêm nhánh ma_gui ở taoPhien + nhánh "chốt lần hai trả kết quả cũ" ở chotPhien — sửa chỗ khác → câu hỏi, DỪNG.
- `BanHangMoi.jsx`: chỉ khối chayPhien / tinh giá / lời lỗi (MANKHACH-2a Sonnet có thể sửa chỗ báo phiên cho màn khách song song). Không sửa màn cũ `Sales.jsx`.
- Không tự gộp main (chat gộp lúc duyệt kế hoạch). Mặc định: không sửa .claude/, không merge, không tạo PR, không đụng main, chỉ push đúng
  `git push -u origin viec/KET-NOI-1`, không sửa sổ việc, không chạy patch_*.py. Đẩy nhánh sau mỗi bước lớn (máy mây có thể bị thu hồi).
