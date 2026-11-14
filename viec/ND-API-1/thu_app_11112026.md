# YÊU CẦU App KH → chat POS — 11.11.2026 · Kho nội dung App (/admin sửa nội dung, TRƯỚC khai trương) + quyền trong Phân quyền POS + rà chữ POS gửi tới khách

## 0. Chủ quán chốt 10–11.11
- Mọi chữ / ảnh / nút trình bày cho khách trên App KH **sửa trực tiếp ở App** (`tuquyduong.com/admin`, Chế độ sửa), **mở hết**; KHÔNG đụng dữ liệu POS (giá, gói, hạng, voucher…) —
  phần đó App chỉ hiện 🔒 "sửa ở POS".
- **/admin làm TRƯỚC khai trương.** Đăng nhập bằng **tài khoản POS**; **ai được sửa nằm trong Cài đặt › Phân quyền của POS.**
- Mỗi bảng sửa có nút **"Lưu"** (lưu tiến độ, khách chưa thấy) → **"Cập nhật toàn bộ"** mới đổi giao diện khách thành một **phiên bản mới**; **giữ mọi phiên bản**, quay lại được.
- Nội dung **ở nhờ máy chủ POS nhưng xây như nhà riêng**, để sau này tách máy chủ App (KH-TACH-1) chỉ là: dựng máy mới → Nhập toàn bộ → đổi 1 địa chỉ.
- Yêu cầu chung: thông minh, đơn giản, chuẩn — kho nội dung là "hộp chứa" đơn giản, KHÔNG hiểu nghĩa từng chữ (App giữ danh mục và kiểm tra).

## 1. Xin POS: "Kho nội dung App" — tách bạch hoàn toàn (đề nghị mã việc ND-API-1)
**Nguyên tắc nhà riêng:** bảng riêng, đường riêng `/api/nd/*` (KHÔNG nằm trong `/api/kh`), không khoá ngoại sang bảng POS, không đọc / ghi bảng tiền, khách, đơn.
Dữ liệu JSON thuần. Toàn bộ mã nằm gọn trong một thư mục / module để sau này bê đi được.

**Ba bảng (tên POS chốt):**
- `nd_ban` — phiên bản đã cập nhật: `so_ban` (tăng dần) · `gia_tri` (JSON: `{ khoá: giá trị }` — ĐẦY ĐỦ các chỗ đã sửa, không phải phần chênh) · `ghi_chu` · `tom_tat` · `nguoi` · `luc` · `tu_ban` (khi quay lại).
  GIỮ MỌI BẢN, không xoá. Một bản `dang_chay`.
- `nd_nhap` — nháp đang sửa: một dòng / khoá: `khoa` · `gia_tri` · `nguoi` · `luc` · `ban_goc` (số bản lúc bắt đầu sửa).
- `nd_anh` — ảnh: `ma` (mã băm nội dung) · `duong_dan` · `kich_thuoc` · `loai` · `luc`. Ảnh App đã cắt + nén (WebP) trước khi gửi.
- Nhật ký: `nd_nhat_ky` (ai · lúc · việc: luu / bo_nhap / cap_nhat / quay_lai / xuat / nhap · số bản · số khoá).

**Cửa (tên POS chốt):**
| Cửa | Ai | Làm gì |
|---|---|---|
| `GET /api/nd/ban-dang-chay?co=<so_ban>` | ai cũng gọi được | trùng số bản → `{ khong_doi: true }`; khác → `{ so_ban, gia_tri }`. Nhẹ, để App gọi mỗi lần mở |
| `GET /api/nd/anh/<ma>` | ai cũng gọi được | trả ảnh (cache lâu — tên theo mã băm không bao giờ đổi nội dung) |
| `POST /api/nd/dang-nhap` | tài khoản POS | `{ ten_dang_nhap, mat_khau }` → vé (hạn ~12 giờ) + `quyen[]`; giới hạn số lần sai như đăng nhập POS |
| `GET /api/nd/nhap` | quyền Xem | toàn bộ nháp + `so_ban` đang chạy |
| `PUT /api/nd/nhap` | quyền Sửa | `{ khoa, gia_tri, ban_goc }` — **Lưu** một chỗ (ghi đè nháp của khoá đó) |
| `DELETE /api/nd/nhap/:khoa` | quyền Sửa | bỏ một thay đổi chưa cập nhật |
| `POST /api/nd/cap-nhat` | quyền Cập nhật | `{ ban_goc, ghi_chu }` → gộp bản đang chạy + nháp thành bản mới, xoá nháp; `ban_goc` ≠ bản đang chạy → 409 `CO_BAN_MOI_HON` |
| `GET /api/nd/phien-ban` · `GET /api/nd/phien-ban/:so` | quyền Xem | danh sách (số, lúc, người, tóm tắt) · nội dung đầy đủ một bản (để Xem / So / Tải về) |
| `POST /api/nd/quay-lai` | quyền Cập nhật | `{ so, ban_goc }` → tạo bản MỚI có nội dung bản `so` (không xoá gì) |
| `POST /api/nd/anh` | quyền Sửa | tải ảnh (≤ 500 KB, chỉ webp / jpeg / png — kiểm byte đầu tệp) → `{ ma, url }`; trùng mã → trả ảnh cũ |
| `GET /api/nd/xuat` · `POST /api/nd/nhap-toan-bo` | quyền Xuất / nhập | một tệp: mọi phiên bản + nháp + ảnh (hoặc danh sách ảnh) — để sao lưu và để chuyển máy chủ |

- Giới hạn: `gia_tri` một bản ≤ 1 MB; khoá là chuỗi `[a-zA-Z0-9._-]` ≤ 80 ký tự; giá trị là chuỗi / số / đúng-sai / mảng / object (POS không cần hiểu nghĩa).
- Bảo mật: CORS chỉ tên miền App (tuquyduong.com, app-kh.pages.dev); vé kiểm QUYỀN MỖI LẦN GHI (thu quyền là có hiệu lực ngay); không lộ thông tin khách.
- Sao lưu: kho nội dung nằm trong lịch sao lưu thường của POS.

## 2. Xin POS: quyền trong Cài đặt › Phân quyền
Thêm nhóm **"App khách hàng — nội dung"** với 4 quyền: **Xem Chế độ sửa App** · **Sửa nội dung App (Lưu nháp)** · **Cập nhật toàn bộ + quay lại phiên bản** ·
**Xuất / nhập toàn bộ** (mặc định chỉ chủ quán). Mặc định: chủ quán có đủ; vai trò khác không có. Hiện trên màn Phân quyền như các quyền POS khác.

## 3. Tư vấn cho POS — POS có cần "nội dung sửa được" không? (chat App KH đề nghị, chủ quán xem)
- **POS KHÔNG cần Chế độ sửa kiểu App.** Màn POS là của nhân viên: chữ cố định giúp quen tay, đổi chữ làm rối thao tác — không mở sửa nhãn nút / màn POS.
- **Nhưng mọi chữ POS gửi tới KHÁCH phải nằm trong Cài đặt POS, có xem trước** (không viết cứng trong code). Xin POS rà và báo danh sách chỗ còn cứng, ví dụ:
  hoá đơn (tên quán, địa chỉ, hotline, wifi, mạng xã hội, lời cảm ơn đầu / chân) · tem ly · tin Zalo gửi khách (mã đăng nhập, đơn xong, nhắc) · nội dung chuyển khoản QR ·
  lời mời đánh giá Google · câu mô tả voucher / chương trình · thông báo POS trả cho App mà khách đọc nguyên câu (`thong_bao_tien_ve`, `ly_do`…).
  Câu POS trả cho App mà khách đọc nguyên văn: hoặc đặt trong Cài đặt POS, hoặc POS chỉ trả MÃ để App lấy chữ từ danh mục nội dung App — POS chọn, báo App.
- **Mọi màn Cài đặt POS có nhật ký thay đổi** (ai · lúc · cũ → mới), nhất là giá, Giờ vàng, voucher, gói, quyền; màn tiền quan trọng nên có "khôi phục giá trị cũ".
- (Đã có) CAIDAT-BAO-1: báo lưu rõ ràng ở mọi màn Cài đặt.

## 4. App sẽ làm
- **KH-ND-3a (đang chạy)** + **KH-ND-3b…3e**: chuyển mọi chữ / ảnh App về danh mục nội dung (khoá + mặc định), bộ kiểm chặn chữ cứng mới.
- **KH-ADMIN-1** (khi POS xong mục 1 + 2): `/admin` đăng nhập tài khoản POS; Chế độ sửa trên CHÍNH App: nút bút ✎ ở mỗi chỗ sửa, chạm chỗ khác vẫn chuyển màn như khách;
  "Đi tới màn" (cả trạng thái hiếm, dữ liệu mẫu); "Danh sách chữ của màn này"; nút làm thật (đặt đơn, trả tiền, xoá) bị khoá khi sửa; bảng sửa tự sinh từ danh mục; Lưu → Xem lại →
  Cập nhật toàn bộ; Lịch sử phiên bản (Xem / So / Quay lại / Tải về); Xuất / Nhập toàn bộ.

## 5. Sao lưu nội dung App (chủ quán hỏi 11.11)
- Kho nội dung nằm trong lịch sao lưu thường của POS (như mục 1).
- **Thêm một bản sao ở chỗ thứ hai, tự động mỗi đêm:** xin POS một **khoá sao lưu CHỈ ĐỌC** (chỉ gọi được `GET /api/nd/xuat`, không ghi / không xem gì khác, thu hồi được trong Cài đặt).
  Phía App: mỗi đêm một tác vụ tự động của kho GitHub App KH gọi cửa này và cất tệp nội dung (kèm ảnh) vào nhánh sao lưu riêng của kho App — có lịch sử từng ngày, không tốn tiền,
  không cần POS làm gì thêm. Mất máy chủ POS vẫn dựng lại được toàn bộ nội dung App.

## 6. Lịch
/admin phải xong TRƯỚC khai trương → xin POS làm mục 1 + 2 sớm nhất có thể, báo mã việc + ngày + phiên bản hợp đồng (đề nghị hợp đồng RIÊNG cho `/api/nd`, không gộp số phiên bản `/api/kh`,
để sau này tách đi không kéo theo hợp đồng POS). Mục 3 POS tự xếp lịch.
