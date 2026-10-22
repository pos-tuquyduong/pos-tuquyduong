# TẦM NHÌN TỰ CHẠY — máy tự làm, tự kiểm; chủ quán chỉ đưa ngữ cảnh và quyết định

<!-- Ghi 18.10.2026 từ ý chủ quán (Linh); bản 2 cùng ngày: đích đến = CẤP 3 trên thang 5 cấp dùng AI (A, B5a, B5b). Trạng thái: CHƯA TRIỂN KHAI — bộ khung tu-chay 1.8.0 đóng băng tới khai trương.
     Bắt đầu SAU khai trương, gộp vào TU-CHAY-9 / DONG-GOI-1 trong sổ việc. Phần A viết cho chủ quán; phần B viết cho Claude
     (chat và Claude Code) — đọc cả hai trước khi bàn hay làm bất cứ gì liên quan tới file này. -->

---

## PHẦN A — Cho chủ quán (đọc 3 phút)

### Mục tiêu trong một câu
Chị chỉ làm hai việc: **nói rõ muốn gì** và **quyết các câu hỏi kinh doanh**. Việc viết code, kiểm code, tìm lỗi, xếp thứ tự công
việc — máy tự làm và tự chứng minh là đúng. Chị **xem kết quả**, không đọc code.

### Hình dung bằng chính cái quán
- **Hôm nay** giống quán mới mở: nhân viên (máy) làm, nhưng quản lý (chat) phải đứng cạnh soát từng ly, còn chủ quán phải tự tay
  mở két, chuyển giấy tờ (chạy script, tạo PR).
- **Đích đến** giống quán đã chạy ổn: nhân viên làm theo công thức chuẩn; có **tổ kiểm tra** mỗi người soi một khâu (tiền, an toàn,
  vệ sinh…); có **quản lý ca** tự xếp việc trong ngày. Chủ quán chỉ duyệt kế hoạch ngày, quyết chuyện giá / chính sách, và xem
  báo cáo cuối ngày.

### Vì sao KHÔNG làm kiểu "bung 100 tác nhân"
- 100 người cùng soi một ly trà không làm ly trà ngon hơn 5 người giỏi — họ chủ yếu thấy lại cùng một lỗi.
- Càng nhiều người soi càng nhiều "báo động nhầm". Ai đó vẫn phải lọc — tức là chị lại phải soát.
- Tốn hạn mức (tiền dùng Claude) rất nhanh.

**Cái thật sự giúp chị bớt soát là BẰNG CHỨNG, không phải số người soi.** Mỗi lỗi máy báo phải kèm một bài thử chạy được, cho thấy
lỗi có thật. Không chứng minh được → bỏ, không làm phiền chị.

### Cái gì máy làm được, cái gì vẫn là của chị
| Máy tự lo (đích đến) | Vẫn là của chị (mãi mãi) |
|---|---|
| Viết code, viết bài thử, tự tìm lỗi | Quy tắc của quán: giá, điểm, hoàn tiền, ship ai trả… |
| Tự soát nhiều góc, tự loại báo động nhầm | Chọn A hay B khi máy hỏi (máy luôn kèm đề xuất) |
| Tự xếp việc nào làm trước, việc nào chạy song song | Duyệt danh sách việc trong ngày (một lần) |
| Tự gộp việc thường khi mọi kiểm tra xanh | Thử thật: két tiền, máy in, Zalo, Ahamove, Render |
| Báo cáo ngắn: xong gì, cần chị quyết gì | Xem tab Đối soát, báo khi thấy số lạ |

### Đi từng bậc, không nhảy cóc
- **Bậc 0 — hiện nay:** chat soát mọi việc; chị chạy script, tạo PR.
- **Bậc 1:** tổ soát (5–7 góc) thay chat soát các việc thường; chat chỉ soát việc dính tiền.
- **Bậc 2:** máy tự xếp việc mỗi sáng; chị duyệt danh sách một lần.
- **Bậc 3:** việc thường tự gộp khi xanh; việc tiền chỉ dừng để hỏi chị câu kinh doanh.

Lên bậc khi số liệu cho thấy máy đáng tin (ít lỗi lọt qua). Có lỗi tiền lọt qua → lùi một bậc, vá lỗ, rồi đi lại.

### Đích đến theo thang 5 cấp dùng AI (chủ quán chọn 18.10: CẤP 3)
| Cấp | Nghĩa | Quán mình |
|---|---|---|
| 0 | mở chat, hỏi, chép câu trả lời dán vào | đã qua |
| 1 | AI sửa file thật, mình ngồi cạnh | đã qua |
| 2 | 4–5 việc cùng lúc, một tác nhân chuyên soát, mình đọc kết quả | **đang ở đây** — nhưng còn nhiều tay: chị chạy script, chat soát từng việc |
| 3 | **viết rõ mục tiêu rồi để máy lặp tới khi xong; việc hằng ngày đặt lịch** | **ĐÍCH ĐẾN** |
| 4 | có chuyện gì xảy ra thì tác nhân tự chạy, mình chỉ xử lý ngoại lệ | để sau, chỉ khi cấp 3 chạy ổn lâu |

Cấp 3 với quán mình nghĩa là: chị viết mục tiêu (hoặc nói với chat), máy tự làm → tự kiểm → đỏ thì tự sửa → lặp lại cho tới khi
mọi kiểm tra xanh. Máy chỉ dừng khi cần chị quyết chuyện kinh doanh hoặc thử thật. Mỗi sáng máy tự xếp việc; mỗi đêm máy tự chạy
các bài kiểm định kỳ và để sẵn báo cáo.

### Khi nào
Sau khai trương. Trước khai trương giữ nguyên cách làm hiện tại để không rủi ro.

---

## PHẦN B — Cho Claude (chat và Claude Code): đặc tả để triển khai

### B1. Mục tiêu đo được
1. Chủ quán **không đọc code, không phán đúng/sai kỹ thuật**. Chủ quán chỉ: (a) đưa ngữ cảnh / yêu cầu; (b) trả lời câu hỏi kinh
   doanh dạng chọn (2–4 phương án, có đề xuất, một câu là trả lời được); (c) duyệt danh sách việc trong ngày; (d) thử thế giới thật.
2. Mọi khẳng định "đúng" phải dựa trên **bằng chứng máy móc chạy lại được** (ca thử đỏ trên gốc → xanh trên bản vá, đột biến bị bắt,
   cổng GitHub xanh) — không dựa trên ý kiến của tác nhân.
3. Thao tác tay của chủ quán mỗi việc **thường** → 0; mỗi việc **tiền** → chỉ phần trả lời câu kinh doanh.

### B2. Nguyên tắc thiết kế (không được vi phạm khi triển khai)
- **Bằng chứng hơn số lượng.** Không mở hàng chục / hàng trăm tác nhân. Hội đồng soát 5–7 góc, mỗi góc một tác nhân chỉ đọc.
  Thêm góc chỉ khi sổ "lọt lưới" (B6) cho thấy có loại lỗi chưa góc nào bắt.
- **Phát hiện không có ca thử đỏ chạy được = bị loại.** Đây là luật diệt báo động nhầm; không có ngoại lệ "nghe hợp lý".
- **Câu hỏi gửi chủ quán phải là câu kinh doanh.** Câu kỹ thuật (đặt dòng ở đâu, file nào ngoài Phạm vi, thứ tự gộp) phải do điều
  phối / chat tự quyết theo luật đã có. Ngày 18.10 phần lớn câu hỏi tới chủ quán là loại kỹ thuật — đó là việc phải tự động hoá.
- **Giữ nguyên các lớp an toàn đang có:** người gác Phạm vi, cổng tĩnh + cổng chạy trên GitHub, bài thử đỏ trên gốc, đột biến,
  phân loại [T] / [Th], luật trong LUAT_XAY_APP.md và CLAUDE.md. Tự chủ tăng bằng cách THÊM kiểm, không bằng cách bỏ kiểm.
- **Không có bước nào bỏ hẳn người duyệt cho thay đổi quy tắc tiền.** Mục tiêu là chủ quán duyệt kết quả và quyết định, không
  duyệt code.
- **Thế giới thật không tự kiểm được:** Turso thật, Render, máy in, Zalo ZNS, Ahamove, tiền két. Mỗi việc chạm các thứ này phải
  có mục "chủ quán thử thật" ngắn, cụ thể (bấm gì, thấy gì là đạt).
- **Hạn mức là giới hạn thật.** Mỗi thành phần có trần số tác nhân và trần ngữ cảnh; đo hạn mức tiêu cho mỗi việc.

### B3. Thành phần 1 — Hội đồng soát (thay `/ra-soat` một tác nhân)
Các góc (tác nhân chỉ đọc, chạy song song, đọc diff + file liên quan, KHÔNG sửa code):
1. **Tiền & điểm** — đúng quy tắc chủ quán đã chốt (sổ việc, CLAUDE.md, ghi nhớ "quy tắc tiền"); số nguyên; ghi tiền qua đúng hàm.
2. **Bảo mật & quyền** — khách lấy từ token; khách A không đọc được của B; quyền nhân viên; không lộ lỗi nội bộ / khoá.
3. **Đồng bộ ba hệ** — SX / POS / App KH đúng bảng nguồn sự thật trong LUAT_XAY_APP.md; một quy tắc một hàm.
4. **Dữ liệu & DB** — chỉ thêm, không xoá / đổi tên; sao lưu đủ bảng; dữ liệu cũ không làm đỏ oan.
5. **Đua & kho bận** — giao dịch, thử lại, 409 đúng sự thật, hai người bấm cùng lúc.
6. **Giao diện ít bấm** — số thao tác, luồng thu tiền không thêm bước.
7. (tuỳ việc) **Hiệu năng** — câu SQL trên dữ liệu lớn dần.

**Chủ toạ** (một tác nhân) gộp kết quả theo luật cứng:
- Mỗi phát hiện phải có: chỗ (hàm / file), kịch bản, **ca thử đỏ chạy được trên code của nhánh**. Thiếu → loại, ghi lý do.
- Trùng → gộp. Phân loại: CHẶN (phải sửa trước khi gộp) / GHI (Phát hiện cho việc sau).
- Đầu ra ≤ 1 trang; mỗi CHẶN kèm lệnh chạy lại ca thử.

### B4. Thành phần 2 — Điều phối (làm thay phần chat đang làm tay)
Đầu vào: sổ việc, LICH_KHAI_TRUONG / lịch hiện hành, phụ thuộc giữa việc, Phạm vi các việc đang mở.
Đầu ra mỗi sáng (chủ quán duyệt một lần):
- Danh sách việc mở được hôm nay + phiếu nháp + model đề xuất.
- Kiểm **không đụng nhau**: Phạm vi không chung file; nếu buộc chung (database.js, kiem_tra_truoc_khi_giao.js, backup.js…) thì
  chỉ định vùng sửa tách biệt, như đã làm tay ngày 18.10.
- **Thứ tự gộp**, đặc biệt các việc cùng dựng lại `client/dist` (chỉ một việc / đợt, hoặc có bước dựng lại sau gộp).
- Tự xử lý các tình huống kỹ thuật đã gặp: phiên mở nhầm nhánh; hook đỏ chặn commit phiếu; máy hỏi thêm file ngoài Phạm vi khi
  file đó rõ ràng thuộc cùng mục tiêu (ví dụ bảng mới → BACKUP_TABLES) — điều phối sửa phiếu, không hỏi chủ quán.

### B5. Thành phần 3 — Gộp theo bậc tự chủ
| Bậc | Việc [Th] | Việc [T] (tiền / bảo mật) | Chat |
|---|---|---|---|
| 0 (18.10) | chat soát, chủ quán tạo PR | chat soát kế hoạch + kết quả | soát mọi việc |
| 1 | hội đồng soát; chủ quán bấm Merge | như bậc 0 + hội đồng | chỉ soát [T] |
| 2 | như bậc 1; điều phối mở việc | như bậc 1; điều phối mở việc | soát [T] + duyệt điều phối |
| 3 | tự gộp khi cổng + hội đồng xanh | dừng CHỈ để hỏi câu kinh doanh | soát mẫu ngẫu nhiên |

Lên một bậc (đề xuất, chủ quán chốt khi triển khai): ≥ 10 việc liên tiếp ở bậc hiện tại không có lỗi lọt dính tiền / bảo mật, và
tỉ lệ phát hiện bị loại của hội đồng giảm dần. Xuống một bậc: bất kỳ lỗi lọt nào dính tiền, điểm, ví, hay lộ dữ liệu khách.

### B5a. "Lặp tới khi xong" — điều kiện dừng (lõi của cấp 3)
Phiên thợ KHÔNG dừng ở mỗi trở ngại kỹ thuật. Vòng lặp: làm → chạy kiểm (npm test, --day-du, đột biến, hội đồng) → đỏ thì truy
nguyên và sửa → chạy lại. Được dừng CHỈ khi:
1. Cần quyết định kinh doanh (quy tắc tiền / điểm / chính sách) → câu hỏi dạng chọn, có đề xuất.
2. Cần thử thế giới thật (B2).
3. Chạm trần ngân sách đã đặt cho việc (số vòng, hạn mức, số dòng) → báo cáo + đề xuất chia việc.
4. Cần sửa file luật / bộ khung hoặc mở rộng Phạm vi KHÁC mục tiêu việc.
Mở rộng Phạm vi CÙNG mục tiêu (vd bảng mới → thêm dòng BACKUP_TABLES; tách hàm cần file kế bên) không hỏi chủ quán: điều phối
(B4) duyệt theo luật và sửa phiếu. Ngày 18.10 ba việc M2 dừng tổng cộng ~6 lần vì loại này — mục tiêu là 0.
Bước "chờ duyệt kế hoạch" của việc [T] giữ, nhưng kế hoạch đã qua hội đồng soát; chủ quán chỉ trả lời phần câu hỏi kinh doanh.

### B5b. Việc hằng ngày đặt lịch
- **Sáng:** điều phối (B4) đọc sổ việc → danh sách việc hôm nay + phiếu nháp → chờ chủ quán duyệt một lần → mở các phiên thợ.
- **Đêm:** chạy định kỳ trên main: đủ bộ kiểm + giả lập quầy + đột biến toàn bộ (rút mẫu nếu tốn) + so bản dựng; đối soát
  ngày trên bản sao dữ liệu (chỉ đọc) nếu có cách lấy an toàn. Kết quả: một báo cáo ngắn — xanh, hoặc đỏ kèm việc sửa đề xuất
  (ghi vào sổ, KHÔNG tự mở việc ở cấp 3).
- Cấp 4 (sau này): sự kiện (đối soát đỏ, lỗi máy chủ lặp, PR đỏ) tự mở việc sửa; chủ quán chỉ xử lý ngoại lệ.

### B6. Thành phần 4 — Đo lường (điều kiện để được tin máy hơn)
- **Sổ lọt lưới:** mỗi lỗi phát hiện SAU khi gộp (tab Đối soát, nhân viên, chủ quán, khách) ghi: việc nào, góc soát nào lẽ ra
  bắt, ca thử đã thêm, có phải thêm góc / luật không.
- **Tỉ lệ báo nhầm:** phát hiện bị chủ toạ loại hoặc bị chủ quán bác / tổng phát hiện.
- **Hạn mức:** tiêu bao nhiêu cho mỗi việc, mỗi góc soát. Góc nào tốn nhiều mà không bắt được gì qua nhiều việc → xem lại.
- **Số câu hỏi kỹ thuật lọt tới chủ quán:** mục tiêu 0.

### B7. Việc cụ thể khi triển khai (đưa vào sổ việc sau khai trương)
1. Kiểm lại tính năng Claude Code tại thời điểm đó (tác nhân con, chạy song song, chạy nền / theo lịch, tích hợp GitHub) — không
   thiết kế theo trí nhớ.
2. Hội đồng soát + chủ toạ (B3) → bậc 1. Thử trên 3–5 việc đã gộp trong quá khứ có lỗi đã biết: hội đồng phải bắt lại được.
3. Sổ lọt lưới + số đo (B6) — làm cùng lúc với bước 2.
4. Điều phối (B4) + việc đặt lịch sáng / đêm (B5b) → bậc 2.
4b. Vòng "lặp tới khi xong" (B5a) trong `/lam-viec`: chỉ dừng theo 4 điều kiện.
5. Tự gộp [Th] (B5) → bậc 3, chỉ khi số đo đạt.
6. DONG-GOI-1: đóng gói cả bộ cho app khác (SX, App KH) sau khi chạy ổn trên POS.

### B8. Bối cảnh tại thời điểm ghi (18.10.2026)
- Đã có: bộ khung tu-chay 1.8.0 (người gác, cổng tĩnh + cổng chạy, `/lam-viec`, `/ra-soat` một tác nhân chỉ đọc, bài thử đỏ trên
  gốc, đột biến, sổ việc, phiếu có Phạm vi). Máy đã tự soát độc lập và tự sửa kế hoạch trước khi hỏi (KH-API-1, P26d, DOI-SOAT-1).
- Đang chạy song song 4 việc đợt M2. Phần chat còn làm tay: viết phiếu, xếp Phạm vi không đụng nhau, thứ tự gộp, script sửa phiếu,
  soát kết quả — đây là phần B4 phải thay.
- Khai trương sau M5 (30.10). Trước đó KHÔNG đổi bộ khung.
