# TÁM KHUÔN LỖI — đọc TRƯỚC khi viết dòng code đầu tiên

Rút từ sổ rà soát từ 24.08.2026: lỗi lặp theo tám khuôn dưới đây, **nhiều lỗi chỉ lộ ra khi chủ quán hỏi lại**, vài lỗi
đã lên production. Biết khuôn thì chặn được trước khi giao. Lời dặn nào đã có phép máy làm thay thì không nhắc lại ở
đây — ghi tên phép: bài thử đỏ trên gốc ← cổng A11/A12; đổi bài sau khi ghi bằng chứng ← A16; tên đột biến trong hồ sơ
← A17; đột biến vá sai ← A18.

---

## K1 · Khẳng định về code mà chưa đọc code
Nguy hiểm nhất vì nó làm hỏng **quyết định**. Đã gây: tưởng POS tự sinh tab nhóm (thật ra `Sales.jsx` viết cứng 2 nút);
xếp 4 việc đã xong vào danh sách còn phải làm.
- **Dấu hiệu:** "thường thì", "chắc là", trí nhớ về file đọc lượt trước; xếp nặng/nhẹ theo nhãn ("admin", "hiếm",
  "chưa có trong kịch bản").
- **Chặn:** mọi khẳng định kèm **tên file + số dòng vừa đọc trong lượt này**, không có thì nói "chưa đọc". Xếp đường
  tiền theo cái khách chạm ở quầy + middleware + khoá trong thân hàm; nhánh hỏng (SX lỗi, mạng) đụng kho/tiền là NẶNG.

## K2 · Phép chốt báo ĐỎ trong khi code đúng
Đã 12 lần — thường do soi nhầm file, hoặc còn tìm tên biến của bản cũ.
- **Dấu hiệu:** đỏ ngay sau khi đổi tên / dời code mà hành vi không đổi.
- **Chặn:** đỏ thì **truy nguyên trước, sửa sau** — in chuỗi thật đang có trong file rồi mới kết luận.

## K3 · Bài kiểm báo XANH oan — nguy hơn K2 nhiều lần
Báo xanh oan thì **lỗi lên production**. Đã gây: bài thử tự gắn middleware vào đúng chỗ rồi đo (patch đặt sau 25 route
nên không bao giờ chạy); bài thử chỉ phủ `discount_value` mà bỏ `discount` — patch vô tác dụng vẫn 20 ca đạt.
- **Dấu hiệu:** bài xanh cả trước lẫn sau khi vá; tên ca nói một đằng, máy kiểm một nẻo (P26b M6: tên "= 1", kiểm "≤ 1").
- **Chặn:** phá thử bốn nhánh: chưa vá · marker suông · vá rồi quên marker · đủ cả hai. Ca "phải ĐỎ" khớp **câu kết luận**,
  không chỉ mã thoát ≠ 0 (thiếu file cũng thoát 1). Mỗi ca chặn **chỉ vi phạm đúng một phép** — ca gộp luôn đỏ nhờ phép
  khác; hai cổng chồng nhau cũng thế (P26b: cổng đơn che cổng yêu cầu). Ca "phải KHÔNG X" chỉ có giá trị khi đầu vào đủ mọi
  điều kiện kích hoạt X trừ điều kiện đang thử (HOC-2b: "bài đỏ thì không cảnh báo" dùng bài đỏ thoát NGAY — không bao giờ tới ngưỡng).
- **Chặn:** phép so bằng / NGƯỠNG (cả tỉ lệ) → ca ngay trên + ngay dưới; phép tiền tố → ca chuỗi nằm GIỮA; luôn cài đột biến
  "nới phép". Giá trị MẶC ĐỊNH là hành vi — khoá bằng ca KHÔNG truyền đối số, không chỉ soi chữ ký hàm (HOC-2b C3g, C3h).
  "Kịch bản X phủ nhánh Y" chỉ nói khi đột biến xoá Y làm giả lập ĐỎ.
- **Chặn:** con số "đạt" phải kèm lần chạy lại trên HEAD; đột biến neo chuỗi NGẮN, RIÊNG (neo dài rữa sau vài việc).
  Lỗi thất thường: "N/N lần sạch" chỉ là bằng chứng khi cùng khung đã cho thấy lỗi trên bản chưa vá — dựng đột biến đỏ
  TẤT ĐỊNH, không được thì ghi **CHƯA KIỂM**, không đếm là phép.

## K4 · Sửa nửa vời — quên đường song song
Sửa một đường, để nguyên đường kia làm cùng việc. Chỗ thứ hai thường trong cùng hàm hoặc cách chưa tới 150 dòng.
Đã gây: P26b gắn cổng cho khoản hoàn ví mà xoá đơn vẫn hoàn gói 2 lần.
- **Dấu hiệu:** vừa tìm ra một lỗi dạng X → gần như chắc chắn có chỗ thứ hai cùng dạng X trong cùng file.
- **Chặn:** `grep` cả file tìm mọi chỗ cùng khuôn **trước khi viết dòng sửa đầu tiên**: dời câu đọc vào `try` → rà
  `catch`/`finally`; gắn cổng một khoản hoàn → mọi khoản hoàn khác (gói, thẻ, kho, điểm); gom về hàm chung → mỗi CHỖ GỌI
  là chỗ vá riêng. "Cùng khuôn" phải giống ở **mọi loại đầu vào** (HOC-1: `Dirent.isFile()` bỏ symlink, `statSync` giữ).
- **Chặn:** tài liệu hứa theo ĐỐI TƯỢNG thì phép chặn gắn theo đối tượng, không theo một nhánh kết quả. Sửa / phủ định
  một câu tài liệu → grep CẢ FILE tìm câu cùng nghĩa; chạy lại bằng chứng → grep hồ sơ tìm mọi câu trích con số cũ.

## K5 · Patch chặn nhầm luồng hợp lệ
Đã lên production: chặn đơn khai "lấy từ gói" mà không kèm mã gói — nhưng luồng **mua gói rồi lấy hàng ngay** cũng gửi
đúng như vậy; quầy mất khả năng bán kiểu đó cho tới khi vá.
- **Dấu hiệu:** thêm hoặc siết một phép (soi chuỗi → so cấu trúc) mà chưa liệt kê ai đang đi qua nó.
- **Chặn:** liệt kê **mọi luồng hợp lệ** qua điều kiện, mỗi luồng một ca "**phải KHÔNG bị chặn**" — kể cả DỮ LIỆU CŨ trên
  production và luồng đổi chính thứ làm chuẩn so sánh. Chiều ngược: ca "phải qua" (200) chỉ khoá luồng **HỢP LỆ** — đọc
  phân quyền + đường tiền của route trước khi viết `status === 200`.
- **Chặn:** bài thử mới phải chạy được trong mọi bản sao đột biến đang dùng (có bản sao chỉ chép `tu_chay/` hoặc `server/`).
  Bản sao NỐI symlink tới thư mục mà công cụ chép-rồi-sửa → ghi XUYÊN vào kho thật (HOC-2b: 13 đột biến vào `server/` thật):
  bản sao chép thật, và công cụ chép-rồi-sửa tự kiểm `realpath` đích nằm trong thư mục tạm.

## K6 · Vi phạm luật có sẵn của chính dự án
Đã gây: `fetch` trần trong `Layout.jsx`, vi phạm bánh cóc — bộ kiểm của chủ quán bắt, không phải tự bắt.
- **Dấu hiệu:** giao xong mới chạy bộ kiểm.
- **Chặn:** chạy bộ kiểm **trước khi giao**, và đọc mục G trong `CHECKLIST_CODE.md` — phần máy không kiểm được.

## K7 · Lỗi kỹ thuật thường và lỗi giao nhận
Middleware đặt sau route · `setError` trong hàm cập nhật của `setCart` · quên `dotenv` trong công cụ thử · sai tên bảng
(`customer_packages` thay vì `pos_customer_packages`) · **bảo chạy `npm run kiem` ở POS trong khi POS dùng `npm test`** ·
commit không thành mà vẫn push → "Everything up-to-date".
- **Dấu hiệu:** tên bảng, cột, script, lệnh viết theo trí nhớ.
- **Chặn:** tra trong code, không nhớ từ kho kia. Sau `git commit` phải thấy dòng `[viec/<MÃ> <mã>]`; push xong
  `git log origin/viec/<MÃ>..HEAD` phải rỗng.

## K8 · Đổ cho bộ kiểm bắt oan, trong khi lỗi nằm ở mã của mình
Đã gây: bộ kiểm báo `POST /orders` chưa có cổng phân quyền; kết luận "nó khắt khe quá". Sai: khách có gói TRÀ khai lấy
NƯỚC ÉP từ gói, server vẫn cho 0 đồng. Sửa đúng thì cảnh báo tự tắt, **không đụng một dòng** bộ kiểm.
- **Dấu hiệu:** "phép kiểm này bắt oan", "khắt khe quá", "đã chặn ở chỗ khác rồi" — nhất là kèm đề nghị sửa phép kiểm.
- **Chặn:** phép kiểm của chủ quán **mặc định là đúng** — tìm cho ra **lỗ nó cảnh báo** trước khi nghĩ đến nới.
- **Chặn (chiều ngược):** phép tự-kiểm của mình mà báo oan lúc bình thường thì dạy người bỏ qua nó — chọn ngưỡng theo
  số đo thật, đo CHẠY RIÊNG (đo lúc máy chạy việc khác ra 91 s thay vì 51 s — HOC-2b); sát ngưỡng thì báo chủ quán, không nới.

---

## NĂM CÂU TỰ HỎI TRƯỚC KHI BÁO "XONG" — bắt buộc trả lời từng câu

1. **Bài thử này có chạy trên bản CHƯA vá không, và nó có hỏng không?** (K3)
2. **Lỗi vừa tìm ra thuộc dạng nào, còn chỗ nào cùng dạng trong file này không?** (K4)
3. **Phép chặn mới có luồng hợp lệ nào đi qua không?** Liệt kê từng luồng. (K5)
4. **Khẳng định này đến từ file nào, dòng bao nhiêu, đọc trong lượt này chưa?** (K1)
5. **Nếu định bảo một phép kiểm là bắt oan — đã tìm ra lỗ nó cảnh báo chưa?** (K8)

Không trả lời được câu nào thì **chưa xong**, không được báo xong.

**Phát hiện lỗi mới:** thêm vào file này và xếp vào khuôn; không thuộc khuôn nào thì mở K9 — ghi ngay.
