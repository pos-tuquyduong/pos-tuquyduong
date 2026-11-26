# DOISOAT-NHANH — Đối soát trên máy chủ thật TREO mãi ở cùng một bước: tìm chỗ treo, sửa, và không bao giờ treo nữa

<!-- Phiếu do chat POS soạn 19.11.2026 15:55 (bàn 40, main e1a89bb3). Máy: Claude Code · OPUS (tìm lỗi treo trên đường chỉ đọc, chạm database.js phần đo).
     Việc chỉ ĐỌC (không đổi tiền, ví, điểm, cách xác thực) → việc thường: KHÔNG chờ duyệt kế hoạch, chạy thẳng tới hết. KHÔNG soát bảo mật riêng
     (chỉ thêm log — luật log ở mục Cấm).

     SỐ ĐO THẬT (chủ quán chụp Render › Logs tìm "doi-soat", 17.11 → 19.11; dòng [CHAM] ghi lúc người gọi BỎ đi, database.js doYeuCau ~1558–1575):
       17.11 14:54 Tokyo   105240 ms · kho 13 câu / 2270 ms · ngoài 0 ms
       18.11 16:07 Tokyo    53818 ms · kho 13 câu / 2288 ms · ngoài 0 ms
       18.11 16:16 Tokyo   164301 ms · kho 13 câu / 2243 ms · ngoài 0 ms
       18.11 20:44 Virginia 59988 ms · kho 13 câu /  253 ms · ngoài 0 ms   (sau GIAO-3: màn thôi chờ ở 60 s)
       18.11 20:45 Virginia 276613 ms · kho 13 câu / 321 ms   ·   18.11 20:45 251483 ms · kho 13 câu / 74 ms
       19.11 11:57 Virginia 816410 ms · kho 13 câu /  200 ms · ngoài 0 ms   (chat đo bằng Chrome, chủ quán đăng nhập — owner)
     → KHÔNG có dòng `[DOISOAT] …` nào trong 2 ngày: doiSoat.js:410 chỉ in khi chạy XONG → chưa lần nào xong trên máy chủ thật.
     → LUÔN đúng 13 câu, mọi ngày, cả hai kho, cả trước và sau GIAO-3. Thời gian hỏi kho nhỏ → KHÔNG phải chậm, mà TREO ở một chỗ cố định.

     CHAT ĐÃ ĐỌC / ĐO (main e1a89bb3):
       - Owner → authenticate 1 câu (middleware/auth.js:41), checkPermission 0 câu (:90 owner next()) → Đối soát xong 12 câu chiDoc rồi treo.
       - doCau (database.js ~1535) cộng `cau` trong `finally` = SAU khi câu trả lời → câu đang treo KHÔNG được đếm, không vào khoMs.
       - Thứ tự câu chiDoc trên kho file rỗng (chat chạy chayDoiSoat, /tmp): #7–#13 = I8 (bat_bien.js:149–222): #7 pos_settings, #8–#10 sqlite_master,
         #11 câu gộp đơn (~:168), #12 dòng 'redeem', #13 "loại dòng điểm lạ". #14 = I9 `SELECT order_id, loai, chi_tiet FROM pos_order_log`.
         Kho thật có thể chen thêm câu `tra` của phanLoai (doiSoat.js:243–256) khi I1–I7 có dòng lệch → vị trí thật CHƯA CHẮC — máy phải đo.
       - Chat chạy tay trên Turso console kho pos-tqd (chỉ đọc): câu #12 (bọc COUNT) 15 dòng, < 1 s; câu #13 0 dòng, < 1 s; pos_order_log 3 dòng.
         Turso "Top Queries" hôm nay: câu #11 có chạy (1.86K dòng đọc, 1,55 ms). Kho 1,52 MB. Số dòng đọc không tăng khi đang treo.
       - Lúc treo: cửa 404 trả 0,26 s, /api/kh/menu 0,89 s → vòng sự kiện Node KHÔNG bị chặn (không phải vòng lặp CPU).
       - database.js ~1504: "libsql không đặt hạn giờ cho fetch" → một câu gửi đi mà không có trả lời sẽ chờ MÃI (không lỗi, không đọc lại).
       - Giả lập (GIAO-3 D1, kho file + độ trễ giả) chạy XONG ~2,4 s → giả lập KHÔNG tái hiện được; chỗ khác nhau: kho thật qua HTTP (libsql remote) và
         dữ liệu thật (đơn cũ trước các mốc AP_DUNG_TU, có dòng lệch).
     KHÔNG đoán nguyên nhân trong phiếu. Hai khả năng chat chưa loại: (1) một câu kho gửi qua HTTP không bao giờ có trả lời; (2) code await một thứ khác
     không bao giờ xong. Bước A làm cho lần chạy thật đầu tiên chỉ ra chỗ nào; bước B làm cho dù nguyên nhân là gì, màn KHÔNG treo nữa. -->

## Mục tiêu
Chủ quán bấm Đối soát (ngày / tuần / tháng) trên POS thật → trong vài giây ra kết quả. Nếu có bước nào hỏng, màn báo rõ bước đó hỏng — không bao giờ
"Đang đối soát…" mãi, máy chủ không chạy ngầm mãi. Nhật ký Render chỉ ra đúng bước / câu nào chậm hay treo.

## Nghiệm thu

### A. Đo được chỗ treo trên máy chủ thật
- A1 Mỗi lần đối soát ghi log lúc BẮT ĐẦU: `[DOISOAT] bat_dau <kieu> <ngay>`; mỗi bước (mỗi bất biến I…, D1, DEN, CK, XNT, D2, tongHop, soHoaDonNgay,
  soKet, sao_ke) xong ghi một dòng `[DOISOAT] buoc <ten> · <ms> · <số câu của bước>`; xong cả lượt giữ dòng cũ (D4 GIAO-3). Chỉ tên bước + số, KHÔNG SĐT,
  mã đơn, số tiền, câu SQL, tham số.
- A2 Dòng `[CHAM]` (database.js doYeuCau) thêm `· đang chờ <k> câu` (số câu kho đã gửi mà CHƯA trả lời lúc người gọi bỏ đi). Đếm đúng cả khi câu ném lỗi.
  Chỉ đổi phần đo; không đổi cách đọc lại / báo lỗi của query, queryOne, run, giao dịch.

### B. Không bao giờ treo
- B1 Mỗi câu chiDoc của đối soát có hạn giờ (hằng số có tên, vd `HAN_CAU_DOI_SOAT_MS` = 15 000). Quá hạn → ĐỌC LẠI theo đúng luật đọc lại có sẵn (KET-NOI-1:
  tối đa CHO_DOC_MS.length lần) nếu cách làm cho phép mở kết nối mới; vẫn quá → ném lỗi `{ status: 503, code: 'DOI_SOAT_QUA_HAN' }` lời
  "Đối soát quá lâu ở bước <tên bước> — thử lại sau". Log `[DOISOAT] qua_han buoc <ten> cau <n>`. Kế hoạch ghi rõ: hạn giờ này có huỷ được yêu cầu HTTP
  đang treo không (libsql), hay chỉ thôi chờ — và vì sao chọn cách đó.
- B2 Cả lượt có hạn tổng (hằng số có tên, NHỎ HƠN hạn chờ 60 s của màn `HAN_DOI_SOAT_MS` ở DoiSoat.jsx) → trả 503 `DOI_SOAT_QUA_HAN` trước khi màn tự bỏ.
- B3 Người gọi bỏ đi (req 'close' trước khi trả lời) → lượt đối soát DỪNG ở bước kế tiếp, không chạy tiếp các bước còn lại (log `[DOISOAT] bo_giua <ten>`).
- B4 Màn Đối soát hiện đúng lời máy chủ trả với 503 `DOI_SOAT_QUA_HAN` (như KHO_MAT_KET_NOI hôm nay — GIAO-3 D3), nút Đối soát bấm lại được.

### C. Tìm và sửa nguyên nhân
- C1 Dựng lại chỗ treo trong bài thử TRƯỚC khi sửa, theo hai khả năng ở đầu phiếu: (1) kho giả mà MỘT câu (theo vị trí / theo mẫu) không bao giờ trả lời —
  bài thử trên bản chưa vá phải TREO (đo bằng hạn ngoài của bài thử, vd 20 s) → ĐỎ; (2) dữ liệu giống kho thật: đơn cũ trước các mốc `AP_DUNG_TU`, có dòng lệch
  ở I1–I8 để phanLoai gọi `tra` — chạy chayDoiSoat thấy treo / ném lỗi không được bắt. Ghi vào trang_thai.md khả năng nào tái hiện được, ở bước / câu nào.
  Nếu dựng được qua HTTP (libsql remote tới một máy chủ libsql chạy tại chỗ) thì dùng; không dựng được thì ghi CHƯA KIỂM, KHÔNG đoán.
- C2 Tái hiện được → sửa đúng gốc + ca ĐỎ trên gốc / XANH sau vá + đột biến đưa lỗi cũ trở lại. Không tái hiện được → B lo phần "không treo", A cho
  số đo ở lần bấm thật đầu tiên sau khi gộp; ghi rõ ở CHƯA KIỂM: "nguyên nhân gốc chưa tìm ra — chờ log [DOISOAT] buoc / qua_han trên Render".
- C3 Kết quả đối soát (JSON) GIỐNG HỆT bản cũ trên cùng dữ liệu, mọi kiểu ngày / tuần / tháng, có dòng lệch thật (đối chứng như GIAO-3 D2).
  Không đổi phép kiểm nào, không bỏ bất biến nào.

### D. Ca hợp lệ không đổi (K5)
- D1 Đối soát bình thường (không câu nào chậm) ra kết quả như cũ, không có lỗi `DOI_SOAT_QUA_HAN`; câu chậm dưới hạn (vd 2 s) vẫn chờ được, không báo lỗi oan.
- D2 Các đường khác dùng `query` / `queryOne` / `run` / giao dịch (bán hàng, thu tiền) KHÔNG có hạn giờ mới, KHÔNG đổi hành vi — B1 chỉ gắn cho chiDoc
  của đối soát. Bộ kiểm đầy đủ + giả lập quầy xanh.

### E. Hồ sơ
- E1 `npm test`, `node kiem_tra_truoc_khi_giao.js --day-du`, `node tu_chay/cong.js chay . <gốc> <head> viec/DOISOAT-NHANH` ĐẠT; bang_chung_do.txt đủ SỐ CA.
- E2 Ghi 2 thao tác cho chủ quán thử sau khi gộp: (1) Quản lý › Báo cáo › Đối soát › Ngày 18/11 → ra kết quả hoặc lời báo bước hỏng trong ≤ 60 s;
  (2) Render › Logs tìm `DOISOAT` → chụp các dòng `buoc …` gửi chat.

## Phạm vi
- viec/DOISOAT-NHANH/**
- server/utils/doiSoat.js
- server/routes/reports.js
- server/database.js
- client/src/components/DoiSoat.jsx
- client/src/utils/api.js
- client/dist/**
- cong_cu/gia_lap/bat_bien.js
- cong_cu/thu_DOISOATNHANH.js
- cong_cu/thu_DOISOAT1.js
- cong_cu/thu_GIAO3.js
- cong_cu/thu_KETNOI1.js
- kiem_tra_truoc_khi_giao.js

## Ngân sách
~80 dòng máy chủ + ~10 dòng giao diện + ~300 dòng thử. Vượt 1,5 lần phải giải thích.
**Phương án đơn giản nhất đã xét:** hạn giờ bằng `Promise.race` bọc MỘT chỗ (chiDoc) + một bộ đếm "đang chờ" trong doCau + log mỗi bước trong vòng for
có sẵn của chayDoiSoat. Không chạy song song, không viết lại bất biến. `bat_bien.js` CHỈ được sửa nếu C tìm ra chỗ treo nằm trong nó (giữ kết quả giống hệt).

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
không — chỉ thêm log (luật log ở mục Cấm) và hạn giờ trên đường chỉ đọc.

## Cấm
- Mặc định của mẫu phiếu (không sửa .claude/, không merge, không tạo PR, không đụng main, chỉ push `viec/DOISOAT-NHANH`, không sửa sổ việc).
- KHÔNG thêm hạn giờ / đổi hành vi cho câu GHI, giao dịch, hay câu đọc ngoài đối soát (bán hàng, thu tiền, ví, điểm). Nếu thấy cần → ghi Phát hiện.
- KHÔNG đổi phép kiểm / bất biến / cách tính tiền (`soSach`, `tongHop`); không bỏ bước nào.
- Log mới KHÔNG chứa SĐT, tên, mã đơn, số tiền, câu SQL, tham số, khoá.
- KHÔNG sửa biến môi trường Render, không gọi kho thật.
- Song song: KHO-3a (`viec/KHO-3a`, sửa `bat_bien.js` + 4 dòng `database.js`) và TIEN-KHOA-2 (thêm một phép CẦN XEM vào `doiSoat.js`) đang mở — ai gộp sau
  thì ghép main; việc này giữ thay đổi ở `bat_bien.js` tối thiểu để ít xung đột.
