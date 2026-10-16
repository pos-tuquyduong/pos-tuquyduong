# TÁM KHUÔN LỖI — đọc TRƯỚC khi viết dòng code đầu tiên

Rút từ sổ rà soát từ 24.08.2026: lỗi lặp theo tám khuôn dưới đây, **nhiều lỗi chỉ lộ ra khi chủ quán hỏi lại**, vài lỗi đã lên
production. Lời dặn đã có phép máy làm thay thì chỉ ghi tên phép: bài thử đỏ trên gốc ← cổng A11/A12; đổi bài sau khi ghi bằng
chứng ← A16; tên đột biến trong hồ sơ ← A17; đột biến vá sai ← A18; kiểm lại trên HEAD ← A19.

## K1 · Khẳng định về code mà chưa đọc code
Nguy hiểm nhất vì nó làm hỏng **quyết định**. Đã gây: tưởng POS tự sinh tab nhóm (thật ra `Sales.jsx` viết cứng 2 nút); xếp 4
việc đã xong vào danh sách còn phải làm.
- **Dấu hiệu:** "thường thì", "chắc là", trí nhớ lượt trước; xếp nặng/nhẹ theo nhãn ("admin", "hiếm", "chưa có kịch bản").
- **Chặn:** mọi khẳng định kèm **tên file + số dòng vừa đọc trong lượt này**, không có thì nói "chưa đọc". Xếp đường tiền theo
  cái khách chạm ở quầy + middleware + khoá trong thân hàm; nhánh hỏng (SX lỗi, mạng) đụng kho/tiền là NẶNG.
- **Chặn (TU-CHAY-6):** Chú thích trong code cũng là khẳng định — sai thì sửa cùng dòng vá (`cat-file` ghi thoát 1, đo được
  128); phiếu cũng là hồ sơ — chép sang luật thì mở hồ sơ gốc kiểm lại (B3c GOI-2 ghi số của SO-LUONG-1). Số dòng trích của
  file ĐANG sửa: kiểm lại ở commit cuối (B5 `thu_cong.js` 643 → 648 → 647) (E15 chỉ canh chú thích code).

## K2 · Phép chốt báo ĐỎ trong khi code đúng
Đã 12 lần — thường do soi nhầm file, hoặc còn tìm tên biến của bản cũ.
- **Dấu hiệu:** đỏ ngay sau khi đổi tên / dời code mà hành vi không đổi.
- **Chặn:** đỏ thì **truy nguyên trước, sửa sau** — in chuỗi thật đang có trong file rồi mới kết luận.

## K3 · Bài kiểm báo XANH oan — nguy hơn K2 nhiều lần
Báo xanh oan thì **lỗi lên production**. Đã gây: bài thử tự gắn middleware vào đúng chỗ rồi đo (patch đặt sau 25 route nên
không bao giờ chạy); bài thử chỉ phủ `discount_value` mà bỏ `discount` — patch vô tác dụng vẫn 20 ca đạt.
- **Dấu hiệu:** bài xanh cả trước lẫn sau khi vá; tên ca nói một đằng, máy kiểm một nẻo (P26b M6: tên "= 1", kiểm "≤ 1").
- **Chặn:** phá thử bốn nhánh: chưa vá · marker suông · vá rồi quên marker · đủ cả hai. Ca "phải ĐỎ" khớp **câu kết luận**,
  không chỉ mã thoát ≠ 0. Mỗi ca chặn **chỉ vi phạm đúng một phép** (P26b: cổng đơn che cổng yêu cầu). Ca "phải KHÔNG X" phải
  đủ mọi điều kiện kích hoạt X trừ điều kiện đang thử (HOC-2b: bài đỏ thoát NGAY không bao giờ tới ngưỡng).
- **Chặn:** so bằng / NGƯỠNG (cả tỉ lệ) → ca ngay trên + ngay dưới; tiền tố → ca chuỗi nằm GIỮA; luôn cài đột biến "nới phép".
  Ngưỡng về hằng số TẤT ĐỊNH thì so bằng, không so một chiều. Giá trị MẶC ĐỊNH là hành vi — khoá bằng ca KHÔNG truyền đối số
  (HOC-2b). "Kịch bản X phủ nhánh Y" chỉ nói khi đột biến xoá Y làm giả lập ĐỎ.
- **Chặn:** đột biến neo chuỗi NGẮN, RIÊNG. Lỗi thất thường: "N/N lần sạch" chỉ là bằng chứng khi cùng khung đã cho thấy lỗi
  trên bản chưa vá — dựng đột biến đỏ TẤT ĐỊNH, không được thì ghi **CHƯA KIỂM**, không đếm là phép. Ca tín hiệu / thời gian
  không chạy chung đợt nặng; nghi thì chạy lặp ≥ 3 lần (T3 đỏ oan 1/3; TU-CHAY-7 DON sót 2/3).
- **Chặn (TACH-GL):** sửa lỗi người soát báo → đột biến đưa ĐÚNG lỗi cũ trở lại, không chỉ gỡ phép vừa thêm. Ca TỪ CHỐI so
  đúng câu của phép đang thử + dấu vết không xảy ra (không dòng `lượt k/L pid`).
- **Chặn (TU-CHAY-5):** số ca không được SINH từ nội dung file PR sửa (gốc 927, head 933). Mỗi luồng "phải KHÔNG bị chặn" của
  kế hoạch trỏ tới MỘT ca + đột biến gỡ vế đó ra BẮT (`cong.yml` không ca — SỐNG).
- **Chặn (TOC-DO-1, GOI-2, AUDIT-4):** bộ đột biến chạy được TỪNG TÊN, có ĐỐI CHỨNG (bản chưa đột biến xanh) và luật sập rõ —
  bài thử sập ≠ BẮT (9/9 "bị bắt" khi bài đang sập); không dò chuỗi trong chi tiết dòng ca (AU4-17). Ca PHÉP TÍNH chọn số để
  trần / làm tròn không che lỗi (GOI-2 B3c: trần kéo 1.350.000 về 1.215.000).

## K4 · Sửa nửa vời — quên đường song song
Sửa một đường, để nguyên đường kia làm cùng việc — thường trong cùng hàm hoặc cách chưa tới 150 dòng. Đã gây: P26b gắn cổng
cho khoản hoàn ví mà xoá đơn vẫn hoàn gói 2 lần; TU-CHAY-7 theo dõi tiến trình con ở 2/3 chỗ `spawn`.
- **Dấu hiệu:** vừa tìm ra một lỗi dạng X → gần như chắc chắn có chỗ thứ hai cùng dạng X.
- **Chặn:** `grep` cả file tìm mọi chỗ cùng khuôn **trước khi viết dòng sửa đầu tiên**: dời câu đọc vào `try` → rà
  `catch`/`finally`; gắn cổng một khoản hoàn → mọi khoản hoàn khác (gói, thẻ, kho, điểm); gom về hàm chung → mỗi CHỖ GỌI là
  chỗ vá riêng. "Cùng khuôn" phải giống ở **mọi loại đầu vào** (HOC-1: `Dirent.isFile()` bỏ symlink).
- **Chặn:** cổng "bắt buộc có X" kiểm CÙNG biểu thức với chỗ dùng X (SO-LUONG-1: `" "` lọt qua `customer_phone` thô); chép
  cổng có sẵn thì chép luôn lỗ của nó. MỘT vị từ cho cả "có gì để làm" và "làm" — hai biểu thức sẽ lệch nhau (BAN-HANG-1).
- **Chặn:** tài liệu hứa theo ĐỐI TƯỢNG thì phép chặn gắn theo đối tượng, không theo một nhánh kết quả; bỏ một lời dặn vì "máy
  đã làm" thì phép đó phải phủ ĐỦ đối tượng lời dặn hứa. Sửa / phủ định một câu tài liệu → grep CẢ FILE tìm câu cùng nghĩa;
  chạy lại bằng chứng → grep hồ sơ tìm mọi câu trích con số cũ.
- **Chặn:** thêm cờ nội bộ cha→con (argv, biến môi trường) → rà MỌI đường vào: chuyển tiếp nguyên đối số, kế thừa môi trường,
  phép cấp module chạy cả ở cha (TACH-GL `--kho` xoá kho giả lập khác; TU-CHAY-7 `THU_CONG_CON` lọt từ shell thì thoát 0 sớm).
- **Chặn (TU-CHAY-5):** dời một bước / đổi tên một phép / chép một khối code → grep khắp nơi: thông báo lỗi của cổng, tài
  liệu, chú thích bài thử, neo `viec/*/dot_bien.py` (`python3 viec/HOC-2b/kiem_neo.py` trên gốc và HEAD). Đã gây: thông báo
  A19 còn "bước 10"; neo HOC-2 khớp 2 lần, chết im lặng.
- **Chặn (TU-CHAY-6):** quét "thân route" không thấy ghi qua hàm phụ (customers-v2.js GET → `fetchSXCustomers`) — ghi rõ.

## K5 · Patch chặn nhầm luồng hợp lệ
Đã lên production: chặn đơn khai "lấy từ gói" mà không kèm mã gói — nhưng luồng **mua gói rồi lấy hàng ngay** cũng gửi đúng
như vậy; quầy mất khả năng bán kiểu đó cho tới khi vá.
- **Dấu hiệu:** thêm hoặc siết một phép (soi chuỗi → so cấu trúc) mà chưa liệt kê ai đang đi qua nó.
- **Chặn:** liệt kê **mọi luồng hợp lệ** qua điều kiện, mỗi luồng một ca "**phải KHÔNG bị chặn**" — kể cả DỮ LIỆU CŨ trên
  production và luồng đổi chính thứ làm chuẩn so sánh. Chiều ngược: ca "phải qua" (200) chỉ khoá luồng **HỢP LỆ** — đọc phân
  quyền + đường tiền của route trước khi viết `status === 200`.
- **Chặn:** bài thử mới chạy được trong mọi bản sao đột biến đang dùng. Bản sao chép thật, không NỐI symlink; công cụ
  chép-rồi-sửa tự kiểm `realpath` đích trong thư mục tạm (HOC-2b: 13 đột biến ghi XUYÊN vào `server/` thật).

## K6 · Vi phạm luật có sẵn của chính dự án
Đã gây: `fetch` trần trong `Layout.jsx`. Bộ kiểm chạy ở cổng PR (A13) và hook pre-commit khi đã cài — máy mây KHÔNG có hook:
tự chạy `npm test` trước commit. Đọc mục G `CHECKLIST_CODE.md` (máy không kiểm); công cụ của việc theo luật việc vừa ghi.

## K7 · Lỗi kỹ thuật thường và lỗi giao nhận
Middleware đặt sau route · `setError` trong hàm cập nhật của `setCart` · quên `dotenv` · sai tên bảng (`customer_packages`
thay vì `pos_customer_packages`) · lệnh theo trí nhớ kho kia (CLAUDE.md §3) · commit không thành mà vẫn push.
- **Chặn:** tên bảng, cột, script, lệnh tra trong code. Sau `git commit` phải thấy dòng `[viec/<MÃ> <mã>]`; push xong `git log
  origin/viec/<MÃ>..HEAD` rỗng. Dòng mới ở ĐỈNH file (ngoài try) → nó ném thì thoát mã gì (TACH-GL T10).
- **Chặn (GOI-2):** số thời gian trong code quầy dựng bằng `getNow`, cùng quy ước với cột (Render TZ UTC: `new Date(moc)` trên
  chuỗi giờ VN không hậu tố lệch 7 giờ).

## K8 · Đổ cho bộ kiểm bắt oan, trong khi lỗi nằm ở mã của mình
Đã gây: bộ kiểm báo `POST /orders` chưa có cổng phân quyền; kết luận "nó khắt khe quá". Sai: khách có gói TRÀ khai lấy NƯỚC ÉP
từ gói, server vẫn cho 0 đồng. Sửa đúng thì cảnh báo tự tắt, **không đụng một dòng** bộ kiểm.
- **Dấu hiệu:** "phép kiểm này bắt oan", "khắt khe quá", "đã chặn ở chỗ khác rồi" — nhất là kèm đề nghị sửa phép kiểm.
- **Chặn:** phép kiểm của chủ quán **mặc định là đúng** — tìm cho ra **lỗ nó cảnh báo** trước khi nghĩ đến nới. Chiều ngược:
  phép tự-kiểm báo oan lúc bình thường dạy người bỏ qua nó — ngưỡng theo số đo CHẠY RIÊNG (91 s thay vì 51 s — HOC-2b); sát
  ngưỡng thì báo chủ quán, không nới.

## NĂM CÂU TỰ HỎI TRƯỚC KHI BÁO "XONG" — bắt buộc trả lời từng câu

1. **Bài thử này có chạy trên bản CHƯA vá không, và nó có hỏng không?** (K3)
2. **Lỗi vừa tìm ra thuộc dạng nào, còn chỗ nào cùng dạng trong file này không?** (K4)
3. **Phép chặn mới có luồng hợp lệ nào đi qua không?** Liệt kê từng luồng. (K5)
4. **Khẳng định này đến từ file nào, dòng bao nhiêu, đọc trong lượt này chưa?** (K1)
5. **Nếu định bảo một phép kiểm là bắt oan — đã tìm ra lỗ nó cảnh báo chưa?** (K8)

Không trả lời được câu nào thì **chưa xong**, không được báo xong. Lỗi mới: xếp vào khuôn, không vừa khuôn nào thì mở K9.
