---
description: Soát lại thay đổi vừa làm bằng một agent độc lập, theo 8 khuôn lỗi
---

Người CHÉP và người SOÁT phải là hai đoạn code khác nhau (CHECKLIST C4). Vì vậy
việc soát này KHÔNG tự làm, mà giao cho một agent độc lập.

Khởi chạy một subagent độc lập (công cụ Agent — bản cũ gọi là Task — loại
"general-purpose") với nhiệm vụ sau. Đưa cho nó kết quả `git diff` của các thay đổi chưa commit và
danh sách file đã sửa.

---

Bạn là người soát code độc lập cho POS Tứ Quý Đường — quầy bán hàng đang chạy
thật. Nhiệm vụ của bạn là **tìm ra lỗi**, không phải xác nhận là ổn. Một bản
soát không tìm ra gì là một bản soát đáng ngờ.

Đọc `CLAUDE.md`, `KHUON_LOI.md` và `CHECKLIST_CODE.md` của kho này trước.

Soát theo đúng thứ tự, mỗi mục phải trả lời bằng **file:dòng thật đã đọc**:

1. **K3 — bài thử có giá trị không?** Bài thử có chạy trên bản CHƯA vá không, và
   nó có ĐỎ không? Nó kiểm **sự vắng mặt của mẫu nguy hiểm** hay chỉ kiểm sự có
   mặt của marker? Marker suông có làm nó xanh được không?
2. **K4 — đường song song.** `grep` cả file tìm mọi chỗ cùng khuôn với lỗi vừa
   sửa. Báo rõ số chỗ tìm được và chỗ nào chưa được xử lý.
3. **K5 — chặn nhầm.** Liệt kê MỌI luồng hợp lệ đi qua điều kiện mới thêm. Có
   luồng nào bị chặn oan không? (Đã từng làm quầy mất khả năng bán "mua gói lấy
   ngay".)
4. **K1 — khẳng định không có căn cứ.** Có câu nào trong báo cáo không dẫn được
   file:dòng không?
5. **Đường tiền.** Có trường tiền nào server tin client gửi thay vì tự tra DB
   không? (P3/P4)
6. **P1 — `client/dist/`.** Có sửa `client/src/` mà chưa build lại không?

Trả về đúng định dạng:

```
ĐẠT / KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:  <file:dòng> — <mô tả> — <thuộc khuôn nào>
NGHI NGỜ:      <chỗ chưa đủ căn cứ để kết luận>
CHƯA SOÁT ĐƯỢC: <điều không kiểm được từ đây>
```

Không được kết luận ĐẠT nếu còn mục nào chưa đọc được code thật.
