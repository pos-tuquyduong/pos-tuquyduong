# TÁM KHUÔN LỖI — đọc TRƯỚC khi viết dòng code đầu tiên

Rút từ sổ rà soát 24.08–17.09.2026: 27 lỗi, **10 lỗi chỉ lộ ra khi chủ quán hỏi
lại**, 3 lỗi đã lên production. Các lỗi này KHÔNG ngẫu nhiên — chúng lặp theo
tám khuôn dưới đây. Biết khuôn thì chặn được trước khi giao.

---

## K1 · Khẳng định về code mà chưa đọc code
Nguy hiểm nhất vì nó làm hỏng **quyết định**, không chỉ hỏng một dòng mã.
Đã gây: tưởng POS tự sinh tab nhóm (thật ra `Sales.jsx` viết cứng 2 nút); coi
file `.db` trong zip là production; xếp 4 việc đã xong vào danh sách còn phải làm.

- **Dấu hiệu:** câu trả lời bắt đầu bằng "thường thì", "chắc là", hoặc dựa vào
  trí nhớ về file đã đọc lượt trước.
- **Chặn:** mọi khẳng định về hành vi hệ thống phải kèm **tên file + số dòng vừa
  đọc trong lượt này**. Không có thì nói "chưa đọc, để tôi kiểm".

## K2 · Phép chốt báo ĐỎ trong khi code đúng
Đã 12 lần. Tin ngay kết quả đỏ thì đi sửa một thứ đang lành.
Thường do phép chốt soi nhầm file, hoặc còn tìm tên biến của bản cũ.

- **Chặn:** đỏ thì **truy nguyên trước, sửa sau**. In ra chuỗi thật đang có
  trong file rồi mới kết luận.

## K3 · Bài kiểm báo XANH oan — nguy hơn K2 nhiều lần
Báo đỏ oan thì mất thời gian. Báo xanh oan thì **lỗi lên production**.
Đã gây: bài thử tự gắn middleware vào đúng chỗ rồi đo (kiểm ý tưởng, không kiểm
patch — patch đặt middleware sau 25 route nên không bao giờ chạy); bài thử chỉ
phủ `discount_value` mà bỏ `discount`, patch vô tác dụng mà vẫn 20 ca đạt.

- **LUẬT CỨNG:** mọi bài thử phải chạy trên **bản CHƯA vá** và **bắt buộc phải
  hỏng**. Xanh cả hai bên = bài thử vô giá trị, phải viết lại.
- Bốn nhánh phải phá thử: chưa vá · marker suông · vá rồi quên marker · đủ cả hai.

## K4 · Sửa nửa vời — quên đường song song
Sửa một đường, để nguyên đường kia làm cùng việc đó. Bốn lần trong một phiên,
chỗ thứ hai nằm ngay trong cùng hàm hoặc cách chưa tới 150 dòng.

- **Dấu hiệu:** vừa tìm ra một lỗi dạng X → gần như chắc chắn có chỗ thứ hai
  cùng dạng X trong cùng file.
- **Chặn:** tìm ra một lỗi thì `grep` cả file tìm mọi chỗ cùng khuôn **trước khi
  viết dòng sửa đầu tiên**.

## K5 · Patch chặn nhầm luồng hợp lệ
Lỗi nặng nhất phiên trước, và nó đã lên production: patch chặn đơn khai "lấy từ
gói" mà không kèm mã gói — nhưng luồng **mua gói rồi lấy hàng ngay** cũng gửi
đúng như vậy. Quầy mất khả năng bán kiểu đó cho tới khi vá.

- **Chặn:** thêm phép chặn nào cũng phải liệt kê **mọi luồng hợp lệ** đi qua
  điều kiện đó, rồi viết một ca thử "**phải KHÔNG bị chặn**" cho từng luồng.

## K6 · Vi phạm luật có sẵn của chính dự án
Đã gây: dùng `fetch` trần trong `Layout.jsx`, vi phạm luật bánh cóc. Bộ kiểm của
chủ quán bắt được, không phải tự bắt.

- **Chặn:** chạy bộ kiểm **trước khi giao**, không phải sau. Và đọc mục G trong
  `CHECKLIST_CODE.md` — phần lớn dạng lỗi máy không kiểm tự động được.

## K7 · Lỗi kỹ thuật thường và lỗi giao nhận
Middleware đặt sau route · ghi lại tồn cho mọi món mọi lần tải · gọi `setError`
trong hàm cập nhật của `setCart` · quên `dotenv` trong công cụ thử · sổ việc ghi
17 mà liệt kê 20 · để lẫn patch cũ trong thư mục giao · bài thử sai tên bảng cột
(`customer_packages` thay vì `pos_customer_packages`) · **bảo chạy `npm run kiem`
ở POS trong khi POS dùng `npm test`**.

- **Chặn:** tên bảng, tên cột, tên script — tra trong code, không nhớ từ kho kia.

## K8 · Đổ cho bộ kiểm bắt oan, trong khi lỗi nằm ở mã của mình
Khuôn nguy hiểm nhất về cách nghĩ. Bộ kiểm báo `POST /orders` chưa có cổng phân
quyền; kết luận "nó khắt khe quá" và đề nghị nới lỏng bộ kiểm. Sai hoàn toàn:
server chưa bao giờ kiểm món có nằm trong gói không — khách có gói TRÀ khai lấy
NƯỚC ÉP từ gói, server vẫn cho 0 đồng. Sửa đúng cách thì cảnh báo tự tắt, **không
phải đụng một dòng nào** trong bộ kiểm.

- **Dấu hiệu:** "phép kiểm này bắt oan", "nó khắt khe quá", "mình đã chặn ở chỗ
  khác rồi" — nhất là khi kèm đề nghị sửa chính phép kiểm.
- **Chặn:** phép kiểm do chủ quán viết, sau khi đã bị lừa nhiều lần, **mặc định
  là nó đúng**. Trước khi nghĩ đến nới lỏng, phải tìm cho ra **lỗ mà nó đang
  cảnh báo**. Tìm không ra thường nghĩa là chưa tìm đủ kỹ.

---

## NĂM CÂU TỰ HỎI TRƯỚC KHI BÁO "XONG" — bắt buộc trả lời từng câu

1. **Bài thử này có chạy trên bản CHƯA vá không, và nó có hỏng không?** (K3)
2. **Lỗi vừa tìm ra thuộc dạng nào, còn chỗ nào cùng dạng trong file này không?** (K4)
3. **Phép chặn mới có luồng hợp lệ nào đi qua không?** Liệt kê từng luồng. (K5)
4. **Khẳng định này đến từ file nào, dòng bao nhiêu, đọc trong lượt này chưa?** (K1)
5. **Nếu định bảo một phép kiểm là bắt oan — đã tìm ra lỗ nó cảnh báo chưa?** (K8)

Không trả lời được câu nào thì **chưa xong**, không được báo xong.

---

**Phát hiện lỗi mới:** thêm vào file này và xếp nó vào khuôn. Không thuộc khuôn
nào thì có khuôn thứ chín — ghi lại ngay, đừng để lần sau tự khám phá lại.
