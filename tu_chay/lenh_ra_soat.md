---
description: Soát lại thay đổi vừa làm bằng một agent độc lập, theo 8 khuôn lỗi
---

<!-- Nguồn: tu_chay/lenh_ra_soat.md (TU-CHAY-3). Chủ quán cài thành .claude/commands/ra-soat.md bằng
     bash tu_chay/cai_dat.sh. Không sửa bản trong .claude/. -->

Người CHÉP và người SOÁT phải là hai đoạn code khác nhau (CHECKLIST C4). Vì vậy
việc soát này KHÔNG tự làm, mà giao cho một agent độc lập.

**Bước 1 — lấy thay đổi của CẢ NHÁNH việc** (skill `/lam-viec` commit ở bước 7, trước khi soát ở bước 8,
nên "thay đổi chưa commit" thường rỗng). Máy mây không có ref `main` và người gác cấm `git fetch`, nên mốc
là cha của commit `PHIEU: <MÃ>` ĐẦU TIÊN (MÃ = phần sau `viec/` của nhánh đang đứng):

```bash
git branch --show-current
git log --reverse -E --format=%H --grep="^PHIEU: <MÃ>([^A-Za-z0-9._-]|$)" | head -n 1
git diff --name-only <mốc>^ HEAD
git diff <mốc>^ HEAD
git status --short
```

Thay `<MÃ>` và `<mốc>` bằng giá trị thật. Có thay đổi chưa commit (`git status`) thì đưa thêm `git diff`.

**Bước 2 — khởi chạy một subagent độc lập** (công cụ Agent, loại "general-purpose") với nhiệm vụ dưới
đây. Đưa cho nó: tên nhánh, mốc, danh sách file đổi, toàn bộ diff ở bước 1.

---

Bạn là người soát code độc lập cho POS Tứ Quý Đường — quầy bán hàng đang chạy
thật. Nhiệm vụ của bạn là **tìm ra lỗi**, không phải xác nhận là ổn. Một bản
soát không tìm ra gì là một bản soát đáng ngờ.

Đọc `CLAUDE.md`, `KHUON_LOI.md` và `CHECKLIST_CODE.md` của kho này trước. Đọc phiếu
`viec/<MÃ>/phieu.md` để biết Phạm vi và Nghiệm thu.

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
BÀI HỌC:       <lỗi nào nên thành KHOÁ (bài thử / luật người gác) hay NGUYÊN TẮC (KHUON_LOI.md) — đầu vào bước 11>
```

Không được kết luận ĐẠT nếu còn mục nào chưa đọc được code thật.

**Nộp báo cáo:** khi xong, nộp báo cáo về phiên chính bằng công cụ `SubagentHandback` (người gác cho qua
đúng tên này). Không ghi báo cáo vào file trong kho.

---

**Bước 3 — phiên chính** chép nguyên báo cáo vào `viec/<MÃ>/trang_thai.md`. Không nhận được báo cáo thì
ghi rõ "báo cáo không về" trong `trang_thai.md` — không tự kết luận ĐẠT thay người soát.
