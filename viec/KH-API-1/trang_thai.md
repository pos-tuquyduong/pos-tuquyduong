# KH-API-1 — trạng thái

## Bước 1 — đối chiếu bản chụp
- Lượt 1 (18.10.2026): nhánh `viec/KH-API-1`, cây sạch. HEAD `27e1ac1` = FETCH_HEAD `27e1ac1` → không kéo.
  ```
  27e1ac1 PHIEU: KH-API-1
  0bffc03 TIEN-DO: LUOI-5 (c8c20b3), TU-CHAY-8 (8259a59) xong; mo KH-API-1 + P26d + DOI-SOAT-1 + P16; them KH-OTP-1, DONG-CUNG-1; lich KH-OTP-1 — so v37
  8259a59 Merge pull request #33 from pos-tuquyduong/viec/TU-CHAY-8
  ```

## Bước 2 — đã đọc
`phieu.md`, `CLAUDE.md`, `LUAT_XAY_APP.md`, `KHUON_LOI.md`; code: `signup-codes.js`, `loyalty.js`, `products.js`, `customers.js` (POST /),
`middleware/auth.js`, `routes/auth.js` (ký token), `index.js`, `helpers.js`, `tienDaTra.js`, `database.js` (pos_customers, pos_orders,
pos_order_items, pos_point_transactions, pos_voucher_grants, pos_signup_codes, phân quyền mặc định), `Customers.jsx`, `utils/api.js`,
`kiem_tra_truoc_khi_giao.js` (E9, E12, E14, E15, mảng bài chạy thật), `cong_cu/thu_P20.js`, `tu_chay/cau_hinh.json`,
`viec/HOC-2b/kiem_neo.py` (chạy trên gốc: đã có sẵn nhiều neo HỎNG ở refunds.js / damages.js của các bộ cũ — không do việc này).

## Bước 3 — kế hoạch: `ke_hoach.md` — CHỜ DUYỆT
Phiếu dặn "Chờ duyệt kế hoạch" → commit, push, DỪNG ở đây. Chưa viết bài thử, chưa sửa code.

## Câu hỏi
Mỗi câu có đề xuất; kế hoạch viết theo đề xuất. Chủ quán chọn khác thì ghi lại, máy sửa đúng phần đó.

- **Q1 — E6 và H nói hai việc khác nhau.** E6: `nhan-ma-bill` đi qua ĐÚNG logic `/signup-codes/claim` (giữ 409 `MA_DA_DUNG`) — đường
  này phát **voucher** khách mới (`INSERT INTO pos_discount_codes`), không cộng điểm. H: "nhận mã bill hợp lệ → **điểm tăng** đúng như khi
  nhận qua đường cũ" — điểm từ mã bill là đường KHÁC, `/signup-codes/nhan-diem` (`INSERT INTO pos_point_transactions`, nhân hệ số, bật
  tắt riêng bằng `nhandiem_enabled`).
  Phương án: **(a) đề xuất** — E6 = `/claim` đúng chữ phiếu; H đọc là "voucher phát ra giống hệt đường cũ" (ca H so từng cột voucher).
  (b) `nhan-ma-bill` làm CẢ HAI việc nào đang bật (voucher + nhân điểm) — thêm tách `/nhan-diem` (~+10 dòng, thêm đột biến + ca đua).
  (c) hai route riêng `nhan-ma-bill` (voucher) và `nhan-diem` (điểm).
- **Q2 — tách `/claim` ra `utils/nhanMaBill.js` sẽ làm ĐỎ phép E9.** E9 (`kiem_tra_truoc_khi_giao.js:400–470`) cắt khối từ
  `router.post('/claim'` tới `router.` kế tiếp TRONG `signup-codes.js` rồi đòi `kiemDonCuaMa` + câu chiếm mã `AND claimed_at IS NULL` +
  `if (!X || X.changes !== 1) { await tx.rollback(); return` nằm trong khối đó. Phiếu cấm sửa bộ kiểm ngoài việc thêm tên bài.
  Phương án: **(A) đề xuất** — giữ thân trong `signup-codes.js`, đổi thành `async function nhanMaUuDai(req, res, phone)` đặt NGAY dưới
  dòng `router.post('/claim', …)` (vẫn nằm trong khối E9 cắt; E14 vẫn đếm như cũ) — KHÔNG tạo `nhanMaBill.js`, không đụng bộ kiểm.
  (B) chuyển sang `utils/nhanMaBill.js` và chủ quán cho sửa E9 trỏ sang file mới (+ neo đột biến `viec/AUDIT-1` D1-E-* sẽ rữa).
- **Q3 — xin thêm `server/routes/products.js` vào Phạm vi.** E5 "lấy như quầy đang lấy": toàn bộ logic menu (gọi SX, nhớ tồn, nhánh
  tồn cũ, trộn giá khoá ghép, `sellable`) nằm TRONG thân `GET /` (`products.js:20–111`). Không tách được thì `/api/kh/menu` phải chép
  ~40 dòng — trái "một quy tắc — một hàm" (LUAT §2). Đề xuất: bọc thân thành `layMenuQuay(category)`, route cũ gọi nó (không đổi hành vi),
  xuất như `module.exports.kiemDonCuaMa` ở cuối `signup-codes.js`.
- **Q4 — xin thêm `client/dist/**` vào Phạm vi.** Mục D sửa `Customers.jsx` → bắt buộc build `client/dist` (CLAUDE.md §8, P1); không có
  trong Phạm vi thì cổng A6 đỏ khi commit bản build. Các phiếu BAN-HANG-1, GOI-1, GOI-2, P26c đều có dòng này.
- **Q5 — IP thật của khách trên Render.** `server/` chưa đặt `trust proxy` (grep `trust proxy|req\.ip` → 0 chỗ). Sau proxy của Render,
  `req.ip` là IP của proxy → mọi khách chung MỘT IP → giới hạn 20 lần / IP / giờ thành 20 lần cho CẢ QUÁN (chặn oan). Đề xuất:
  `app.set('trust proxy', 1)` trong `index.js` (lấy IP do proxy gần nhất ghi). Máy không kiểm được số tầng proxy của Render → sau khi
  lên, chủ quán thử `xin-ma` từ 2 mạng khác nhau (wifi + 4G) và xem cột `ip` của bảng mã ra 2 giá trị khác nhau. Ra cùng một giá trị →
  báo lại, đổi số tầng.
- **Q6 — khách tạo từ App là loại nào?** Đường quầy (`customers.js:348`): `customer_type 'retail'` → `sync_status 'retail_only'` (KHÔNG
  vào danh sách xuất sang SX); mặc định `'subscription'` → `'new'` (vào hàng chờ xuất SX). Đề xuất: `'retail'` — khách App là khách mua
  lẻ, chưa đăng ký gói giao hàng.
- **Ghi rõ (không cần trả lời nếu đồng ý):** `cap-ma` dùng `authenticate` (mọi nhân viên đã đăng nhập — cùng mức với tra / sửa khách
  `customers.js:136, 434`), vì thu ngân phải bấm được; khách A đọc đơn của B → 404 (phiếu F3 đã chốt, thay 403 của luật).

## Phát hiện (ngoài phạm vi — không sửa)
- Voucher phát qua `/claim` không ghi vào `pos_voucher_grants` → không hiện ở `/loyalty/vouchers/:phone` (nên cũng không hiện ở
  `GET /api/kh/voucher`). App KH phải hiện mã từ phản hồi `nhan-ma-bill`. Sửa = đổi hành vi `/claim` → việc sau.
- Khách chỉ có bên SX (trang Khách hàng ghép SX + POS) mà chưa có dòng `pos_customers` → lần đầu đăng nhập App sẽ bị hỏi tên.
- `Customers.jsx` còn 2 `fetch` trần cũ (`loadMembershipStatus`, `loyaltyApi`) — không đụng.
