# KH-QUAY-2 — kế hoạch

## Phần A — ô "Mã đăng nhập App cho số mới"
- **Phương án A (chọn):** `components/MaAppSoMoi.jsx` (~30 dòng): ô nhập SĐT + nút "Cấp mã"; bấm → `chuanSdtQuay` (hàm thuần mới trong `utils/maApp.js`, ~8 dòng, cùng luật normalizePhone của quầy: bỏ ký tự lạ, 84→0, `0` + 9–10 số). Sai dạng → báo ngay, không mount thành phần gọi máy chủ. Đúng → mount `MaDangNhapApp` (thêm prop `tuLay` ~4 dòng để vào là lấy mã luôn, khỏi bấm hai lần). Gắn một lần ở đầu `Customers.jsx`. 3 file, ~50 dòng.
- Phương án B: sửa thẳng MaDangNhapApp nhận ô nhập. Trộn hai việc vào một thành phần đang chạy ổn (K5), nhiều dòng sửa hơn. Bỏ.
- Không đổi máy chủ / hợp đồng (đã có ca máy chủ trong thu_KH1 mục D; thu_KHQUAY2 A3 thêm ca "số chưa là khách → bảng khách không thêm dòng").

## Phần B — hoá đơn khách chỉ còn 58mm / 80mm
- **Chọn: BỎ HẲN** (không ẩn). Một hàm dùng chung `khoHoaDon(v)` trong `utils/inPhieu.js`: '58mm'/'80mm' giữ, còn lại (a5, a4, rỗng, lạ) → '80mm'. `KHO_BILL=['58mm','80mm']`, khổ bill mặc định '80mm'.
- InvoicePrint: bảng PAPER_SIZES còn 2 khổ, khổ khởi tạo qua `khoHoaDon`, bỏ nhánh `@page A4/A5` + bề ngang hộp. InvoicePreview: bỏ kiểu a5/a4, `CO_TO` a5/a4, nhánh header A5/A4 (khối ~60 dòng chết), các `isThermal ? x : y` gọn về `x`. InvoiceSettings: bỏ 2 `<option>`, nút xem trước, mặc định `default_size` → "80mm", giá trị cũ đọc qua `khoHoaDon`.
- Phương án B (ẩn bằng CSS/điều kiện): để lại ~100 dòng chết → trái "không để code chết". Bỏ.
- Không sửa dữ liệu, không sửa máy chủ (database.js seed 'a5' và settings.js paper_size='a5' ghi vào Phát hiện).

## Phần D — thêm `chayBaiThat('cong_cu/thu_KHSP1.js')` vào kiem_tra_truoc_khi_giao.js (chỉ THÊM).

## Ca thử ↔ nghiệm thu
- A: thu_KHQUAY2 [A1] chuẩn hoá (ranh giới 9/10/11/12 số, +84, rỗng), [A2] giao diện, [A3] máy chủ không tạo khách.
- B: [B1] khoHoaDon + docBoIn (a5/a4/rỗng/lạ → 80mm; 58mm giữ), [B2] 4 file giao diện.
- C (K5): [C] phiếu pha chế/tem/phiếu kho giữ khổ, MaDangNhapApp trong chi tiết khách, HoaDonTo, máy chủ seed. Bài cũ phải đổi theo quyết định chủ quán 31.10: thu_P16 C8, C24 (khổ bill mặc định a5 → 80mm) — bài sửa thường, đỏ trên gốc.
- D: npm test chạy thu_KHSP1.
- Đường song song (K4): `grep a5|a4` trong 4 file + inPhieu + thu_*.js; MAC_DINH_BO_IN.bill, docBoIn, InvoiceSettings KHO_THEO_LOAI (dùng KHO_BILL — tự theo).
