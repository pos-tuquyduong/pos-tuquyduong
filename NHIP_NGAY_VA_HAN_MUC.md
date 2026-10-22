# NHỊP NGÀY & HẠN MỨC — chủ quán chỉ duyệt 2 lần / ngày, giữ hạn khai trương, không đứt vì hết hạn mức

<!-- Ghi 21.10.2026 (Linh chốt). Áp dụng từ 22.10 tới khai trương. Đọc cùng LICH_KHAI_TRUONG.md (hạn) và TAM_NHIN_TU_CHAY.md
     (đích sau khai trương). Bộ khung tu-chay 1.8.0 vẫn đóng băng: không đổi luật máy; nhịp này chỉ đổi CÁCH LÀM VIỆC của người + chat. -->

## 1. Nhịp một ngày

| Lúc | Chủ quán (~20 phút) | Chat | Máy (Claude Code) |
|---|---|---|---|
| **SÁNG** (~7h) | Mở chat MỚI, gửi: file bàn giao + log tối qua. Chạy MỘT script. Mở phiên theo bảng chat đưa, dán câu trả lời. | Soát kế hoạch [T] máy lập qua đêm; trả lời câu hỏi; viết MỘT script sáng (sổ + phiếu + sửa phiếu + mở nhánh); đưa bảng phiên (nhánh · model · đoạn dán · lệnh). | — |
| **NGÀY** | Không cần mở máy. Phiên nào dừng vì câu hỏi thì chờ tối. | — | Làm việc [Th] tới hết; việc [T] đã duyệt kế hoạch thì code tới hết. |
| **TỐI** (~20h) | Gom phần cuối của MỌI phiên vào một file txt, mở chat MỚI gửi. Merge PR theo thứ tự chat đưa. Mở phiên lập kế hoạch [T] cho mai. Thử tay 5 phút trên POS thật. | Soát việc xong (chạy lại bài thử, gộp thử với main); xếp thứ tự PR; trả lời câu hỏi; viết phiếu [T] ngày mai + script tối nếu cần. | Lập kế hoạch [T] qua đêm, dừng ở bước 3. |

Luật để giữ đúng 2 lần duyệt:
- **Mỗi lần duyệt = một chat MỚI**, chỉ kèm file bàn giao ngắn + log. Không kéo một chat dài (chat dài là thứ tốn hạn mức nhất).
- **Mỗi lần duyệt = tối đa MỘT script** cho chủ quán chạy. Chat gộp mọi việc (sổ, sửa phiếu, mở nhánh, gộp main) vào đó.
- **Chạy script XONG rồi mới mở / tiếp phiên.** Mở phiên: nhìn khung Environment đúng `viec/<MÃ>`; mỗi nhánh một phiên; dán đúng phiên.
- **Mở nhiều việc song song** để một phiên dừng hỏi không làm cả ngày đứng.
- **Việc [T]:** mở TỐI để máy lập kế hoạch qua đêm → SÁNG duyệt → máy code cả ngày → TỐI soát + PR. Một vòng / ngày.

## 2. Lịch theo hạn (từ 21.10)

| Ngày | Sáng | Tối |
|---|---|---|
| T4 21.10 | — | Merge PR DOI-SOAT-1 → **M2 xong** (còn S5 bên SX, hỏi riêng) |
| T5 22.10 | Script sáng: sổ v38 (M2 xong, thêm GIAO-1, KH-QUAY-1, TAM_NHIN vào kho) + mở **KH-UI-1 [Th]**, **KH-QUAY-1 [Th]**; mở **P22-23 [T]**, **P15-QR [T]** để lập kế hoạch | Duyệt kế hoạch P22-23, P15-QR (gửi trong log tối) → máy code qua đêm |
| T6 23.10 | Soát / trả lời câu hỏi M3 | PR M3 xong việc nào gộp việc đó; mở **P24 [T]**, **KH-DON-1 [T]** lập kế hoạch |
| T7 24.10 | **Hạn M3.** Duyệt kế hoạch P24, KH-DON-1 | PR còn lại của M3; chủ quán gửi **tên bên dịch vụ ZNS** (hạn 25.10) |
| CN 25.10 | Mở **KH-UI-2 [Th]**, **KH-OTP-1 [Th]**, P17 nếu đã có máy in, P3 nếu payOS sẵn | Mở **GIAO-1 [T]** (Ahamove), **AUDIT-KH [T]** lập kế hoạch |
| T2 26.10 | Duyệt GIAO-1, AUDIT-KH | PR M4 |
| T3 27.10 | **Hạn M4.** | PR M4 còn lại |
| T4–T6 28–30.10 | X1 đo tải · H4 dọn dữ liệu thử · H5 chạy lại bộ dò · sửa lỗi tồn | **Hạn M5 30.10 — đủ chức năng** |
| 31.10 → | Chạy thử với nhân viên: CHỈ sửa lỗi, không thêm tính năng | |

Ràng buộc thứ tự: **P22-23 → P24 → KH-DON-1** cùng sửa `orders.js` → không chạy song song phần code; KH-DON-1 lập kế hoạch
được song song. Mọi việc sửa giao diện quầy (KH-QUAY-1, P15-QR, P17…) cùng dựng lại `client/dist` → chat xếp thứ tự gộp và gửi
script gộp main khi cần (như DOI-SOAT-1 21.10).

## 3. Hạn mức (gói Max 5x) — không đứt mạch

**Chia model**
- **Opus:** lập kế hoạch [T]; code [T] chạm tiền / bảo mật; chat soát sáng – tối.
- **Sonnet:** mọi việc [Th]; kiểm lại sau gộp; chạy cổng; việc lặp đơn giản.
- Đồng thời tối đa **2 phiên Opus + 2 phiên Sonnet**.

**Không làm lại (bài học tuần 18–21.10 — mỗi lần làm lại là mất hạn mức)**
- Phiếu sửa giao diện phải có `client/dist/**`; thêm bảng mới phải cho thêm dòng `BACKUP_TABLES`; file dùng chung phải ghi rõ
  vùng sửa của từng việc. (Chat tự kiểm danh sách này trước khi gửi phiếu.)
- Script luôn kéo đúng từng nhánh (`fetch` có refspec) — Replit có thể chỉ kéo main.
- Không sửa phiếu khi máy đang chạy trên nhánh đó (gây lệch hai phía như DOI-SOAT-1 19.10).
- [T] giữ tối đa 3 vòng sửa; vòng thêm chỉ khi chủ quán duyệt, và chỉ để khoá ca thử.

**Khi sắp hết / đã hết hạn mức**
- Không mất gì: trạng thái nằm trên nhánh (`trang_thai.md`). Khi mở lại: `/lam-viec <MÃ> tiep` ở phiên mới.
- Xếp việc nặng (Opus, lập kế hoạch, soát) ngay sau lúc hạn mức mở lại; việc nhẹ (Sonnet) để cuối kỳ.
- Thứ tự CẮT nếu thiếu (đã có trong LICH_KHAI_TRUONG.md): X1 / H4 / H5 dời → P17 dời (in qua trình duyệt) → P3 dời (QR chuyển
  khoản tĩnh) → GIAO-1 dời (App chỉ lấy tại quầy) → KH-DON-1 dời (App mở đợt 1). **Không cắt:** P22-23, P24, AUDIT-KH, sửa lỗi tiền.
- Chừa ~20 % hạn mức tuần cho sửa lỗi tuần khai trương. Nếu tuần khai trương vẫn thiếu, chủ quán cân nhắc tăng hạn mức tạm thời
  thay vì cắt việc tiền.

## 4. Mẫu file bàn giao (chat cập nhật mỗi tối, chủ quán gửi lại mỗi sáng)
- Main hiện tại (SHA) · sổ v? · mốc đang chạy.
- Bảng việc: mã · nhánh · đầu nhánh · trạng thái (đang code / chờ duyệt / chờ PR / xong) · việc chủ quán cần làm.
- Câu hỏi đang chờ chủ quán (dạng chọn).
- Script đã gửi (tên + vân tay) và đã chạy chưa.
- Hạn mức: đã chạm trần tuần chưa, lúc nào mở lại.
