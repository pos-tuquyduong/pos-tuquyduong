# KH-API-1 — trạng thái

## Bước 1 — đối chiếu bản chụp
- Lượt 1 (18.10.2026): nhánh `viec/KH-API-1`, cây sạch. HEAD `27e1ac1` = FETCH_HEAD `27e1ac1` → không kéo.
  ```
  27e1ac1 PHIEU: KH-API-1
  0bffc03 TIEN-DO: LUOI-5 (c8c20b3), TU-CHAY-8 (8259a59) xong; mo KH-API-1 + P26d + DOI-SOAT-1 + P16; them KH-OTP-1, DONG-CUNG-1; lich KH-OTP-1 — so v37
  8259a59 Merge pull request #33 from pos-tuquyduong/viec/TU-CHAY-8
  ```
- Lượt 2 (`tiep`, 18.10.2026): hook mở phiên kéo `d4e55a4 → 6fe38d8`; nhánh `viec/KH-API-1`, cây sạch, HEAD `6fe38d8` = FETCH_HEAD `6fe38d8`.
  ```
  6fe38d8 PHIEU: KH-API-1 theo Q1-Q7 (them nhan-diem, mo products.js, bo man quay -> KH-QUAY-1)
  d4e55a4 KH-API-1: ke hoach sua theo soat (claim giu SDT trong try, B1 loc nguon gui, products khong giau lenh ghi, Q7)
  5ce2063 KH-API-1: ke hoach (cho duyet) + trang thai, cau hoi Q1-Q6
  ```

## Bước 2 — đã đọc
`phieu.md`, `CLAUDE.md`, `LUAT_XAY_APP.md`, `KHUON_LOI.md`; code: `signup-codes.js`, `loyalty.js`, `products.js`, `customers.js` (POST /),
`middleware/auth.js`, `routes/auth.js` (ký token), `index.js`, `helpers.js`, `tienDaTra.js`, `database.js` (pos_customers, pos_orders,
pos_order_items, pos_point_transactions, pos_voucher_grants, pos_signup_codes, phân quyền mặc định), `Customers.jsx`, `utils/api.js`,
`kiem_tra_truoc_khi_giao.js` (E9, E12, E14, E15, mảng bài chạy thật), `cong_cu/thu_P20.js`, `tu_chay/cau_hinh.json`,
`viec/HOC-2b/kiem_neo.py` (chạy trên gốc: đã có sẵn nhiều neo HỎNG ở refunds.js / damages.js của các bộ cũ — không do việc này).

## Bước 3 — kế hoạch: `ke_hoach.md` — ĐÃ DUYỆT (chủ quán trả lời Q1–Q7 ngày 18.10, phiếu sửa ở `6fe38d8`)
Lượt 1 dừng ở đây chờ duyệt (phiếu dặn). Lượt 2 làm tiếp từ bước 4.

Soát độc lập (agent phụ chỉ đọc, 4 câu) — đã sửa vào kế hoạch:
- PHẢI SỬA (5, đã sửa): P7 giữ `normalizePhone(req.body.phone)` TRONG `try` (Express 5 + `.replace` ném → đổi hành vi `/claim` cũ);
  bỏ đột biến `VS-A3-het-han-bang` (ca ±1 giây không bắt được — xanh oan K3); thêm ca C không đặt `GUI_MA_KHACH`, ghi rõ biến môi
  trường đọc lúc gọi hàm; B1 lọc `nguon = 'gui'` ở cả 3 truy vấn con + ca "xin-ma ngay sau cap-ma" và "dòng quầy không ăn lượt IP";
  tách `products.js` không giấu lệnh ghi khỏi E14 + ca hồi quy `GET /products` + đột biến.
- NÊN SỬA (đã làm): biên 59/60 giây và 59/61 phút; chèn sẵn `huy_luc` (bỏ khe đua giữa hai câu); Q7 mới; Q1 ghi lỗ F3 phần điểm; ca
  `X-Service-Key` cho `/loyalty/*` + `/products`, `SDT_DA_NHAN`, món của đơn, `con_hang` true/false, `sync_status`; dùng `loiGhi` cho kho bận
  (KHÔNG cho mọi lỗi — nhánh còn lại của nó trả `err.message`, lộ lỗi nội bộ); thu hẹp phép B3; chặn `strftime` ra NULL; màn quầy ghi
  CHƯA KIỂM; ghi rõ `quay.js` là route nhân viên.

## Bước 4 — bài thử trước: `cong_cu/thu_KH1.js` (đỏ trên gốc) — `bang_chung_do.txt`
- Gốc (server/ của `6fe38d8`, bài bản `38392aa`): **9 đạt · 84 hỏng** — 9 ca đạt là ca CANH đường cũ (phải xanh cả hai phía).
- Hai ca xanh oan trên gốc ở bản bài đầu (`7136d93`) đã sửa ở `93ee2ce` (K3): "token không giải được bằng khoá nhân viên" xanh vì CHƯA
  có token; "món giá 0 không có trong menu" xanh vì menu RỖNG — nay cả hai đòi dữ liệu có thật.
- Ca F3 đổi thành so sâu (`38392aa`): bản cũ chỉ so trường `phone` của `/diem` → đột biến đọc điểm theo `?phone=` vẫn lọt.

## Bước 5 — chỗ vá → đột biến (`dot_bien.py`; chạy từng tên được, có ĐỐI CHỨNG, bài sập ≠ BẮT)
| Chỗ vá | Đột biến |
|---|---|
| F2 kiểm loại token (`khachAuth.js` xacThucKhach) | BV-F2-bo-kiem-loai · VS-F2-loai-sai-chieu |
| F1 đóng khi thiếu / trùng khoá (`khachAuth.js` khoaKhach, canCauHinhKhach) | BV-F1-bo-chan-thieu-khoa · VS-F1-khoa-du-phong-jwt · VS-F1-cho-trung-khoa |
| F3 SĐT chỉ từ token (`kh/index.js`) | VS-F3-ma-bill-sdt-tu-than · VS-F3-diem-tu-query · VS-F3-don-tu-query |
| A2 chiếm mã một lần + băm (`maKhach.js` xacMinhMa, xinMaGui) | BV-A2-bo-chua-dung · VS-A2-changes-lon-hon-1 · VS-A2-luu-ma-tho |
| A2 / A3 hạn mã (`maKhach.js` hanMa, câu chọn mã) | VS-A3-han-50-phut · BV-A3-bo-loc-het-han |
| A3 / B2 ≤ 5 lần thử / mã | BV-B2-bo-gioi-han-moi-ma · VS-B2-thu-6-lan |
| B2 ≤ 10 sai / SĐT / giờ, chỉ mã App (Q7) | BV-B2-bo-gioi-han-sdt · VS-B2-sdt-11 · VS-B2-chan-ca-ma-quay |
| B1 giới hạn xin mã, chỉ mã App (`maKhach.js` xinMaGui) | BV-B1-bo-60-giay · VS-B1-61-giay · VS-B1-so-bang · BV-B1-bo-sdt-gio · VS-B1-sdt-6 · BV-B1-bo-ip · VS-B1-ip-21 · VS-B1-tinh-ca-quay-ip · VS-B1-tinh-ca-quay-60 |
| B3 hằng số một chỗ (`GIOI_HAN`) | VS-B3-so-ten-roi |
| A4 khách mới / cũ, không tiêu mã khi thiếu tên | VS-A4-tieu-ma-truoc-khi-hoi-ten · BV-A4-bo-can-ten · VS-A4-loai-khach-sai |
| A5 không lộ ai là khách | VS-A5-bao-khach-moi |
| C chế độ gửi (`guiMaKhach.js`, huy_luc khi chèn) | VS-C-mac-dinh-gia · BV-C-quay-khong-huy · VS-C-doc-luc-nap |
| D quầy cấp mã (`kh/quay.js`) | BV-D-bo-authenticate · VS-D-ma-quay-thanh-gui |
| E1 chỉ sửa tên | VS-E1-sua-ca-sdt |
| E2 / E3 cùng hàm + mã khách mới (`diemKhach.js`) | VS-E2-kh-tu-tinh-bo-han · VS-E3-kh-tu-loc · VS-E3-ma-moi-khong-loc-sdt |
| E4 chỉ đơn của mình | BV-E4-bo-loc-sdt · VS-E4-chi-tiet-bo-loc |
| E5 danh sách trắng + tách `products.js` | VS-E5-tra-them-gia-von · BV-E5-tra-nguyen-mon · VS-Q3-route-cu-bo-gia |
| E6 / E7 cùng hàm `/claim`, `/nhan-diem` | VS-E6-bo-claim-chung · VS-E7-sai-ham |
| G không lộ (`kh/loi.js`, nhánh req.khach của `signup-codes.js`, log) | VS-G-500-lo-loi · VS-G-claim-lo-loi · VS-G-log-ma |
| Q2 tách `/claim` giữ hành vi cũ | VS-P7-sdt-ngoai-try |
| `index.js` trust proxy + gắn `/api/kh` | BV-Q5-trust-proxy · BV-IX-bo-gan-kh |

Kết quả: ĐỐI CHỨNG 116 đạt · 0 hỏng; **54 đột biến bị bắt · 0 KHÔNG bị bắt (trên 54)**.

## Bước 6 — kiểm
- `node cong_cu/thu_KH1.js` → 116 đạt · 0 hỏng (chạy 4 lần, cả 4 lần như nhau — ca 59 giây tự kiểm cùng giây).
- `npm test` → **ĐỎ 1 FAIL**: `✗ mọi bảng đều được sao lưu (31 bảng) → thiếu trong BACKUP_TABLES: pos_kh_ma_dang_nhap` (phép E8). Phép đúng
  (K8): bảng mới phải vào danh sách sao lưu `server/routes/backup.js` — file NGOÀI Phạm vi → Q8 dưới, DỪNG. Còn lại: E14 "route ghi không
  qua loiGhi" = 51 (đúng ngưỡng, không đổi), cảnh báo "GET có ghi" vẫn đúng 3 chỗ cũ (`products.js` vẫn trong danh sách — lệnh ghi nhớ tồn
  không bị giấu), E15 dòng cứng = 5, fetch trần = 32; `thu_KH1.js` xanh trong bộ.
- `node tu_chay/cong.js tinh . 27e1ac1^ HEAD viec/KH-API-1` (trước khi ghi bảng này): chỉ `✗ [A17]` (tên đột biến chưa ghi — nay đã ghi) và
  `✗ [A19]` (chưa tới bước 11.4); KHÔNG có ✗ Phạm vi.

## Câu hỏi
**Lượt 3 (`tiep`, 19.10.2026):** chủ quán trả lời Q8 ĐỒNG Ý (một dòng `pos_kh_ma_dang_nhap` NGAY SAU dòng `pos_customers` — P26d sửa cuối
danh sách), nói phiếu đã thêm `server/routes/backup.js`. Nhưng `git fetch origin viec/KH-API-1` → FETCH_HEAD = HEAD = `90ed271`;
`viec/KH-API-1/phieu.md` ở HEAD chưa có `backup.js` trong `## Phạm vi` (lần sửa phiếu cuối vẫn là `6fe38d8`). Máy không tự sửa phiếu, không
sửa file ngoài Phạm vi (cổng A6 đọc phiếu ở head) → DỪNG, chờ commit phiếu lên nhánh `viec/KH-API-1`.

**Q8 (ĐÃ ĐỒNG Ý — chờ phiếu lên nhánh):** xin thêm `server/routes/backup.js` vào Phạm vi, CHỈ thêm một dòng vào `BACKUP_TABLES`:
`{ name: 'pos_kh_ma_dang_nhap', label: 'Mã đăng nhập App KH', key: 'id' }` (bảng không có khoá ngoại → đặt cuối danh sách). Lý do: phép E8
của bộ kiểm (`kiem_tra_truoc_khi_giao.js`, khối "mọi bảng tạo trong database.js phải có trong danh sách sao lưu") đỏ, `npm test` đỏ → chưa
qua bước 6. Dữ liệu bảng này: mã băm sống 5 phút + lịch sử xin mã (giới hạn B, ai cấp mã ở quầy) — sao lưu để khôi phục không mất vết "ai
cấp mã". Phương án khác (không đề xuất): chủ quán cho phép thêm bảng vào danh sách MIỄN sao lưu của phép E8 (phải sửa bộ kiểm). Trả lời
xong thì `/lam-viec KH-API-1 tiep`: máy thêm dòng, chạy lại bước 6 → 11.

Q1–Q7 dưới đây ĐÃ được chủ quán trả lời (18.10) — giữ để đối chiếu.

- **Q1 — E6 và H nói hai việc khác nhau.** E6: `nhan-ma-bill` đi qua ĐÚNG logic `/signup-codes/claim` (giữ 409 `MA_DA_DUNG`) — đường
  này phát **voucher** khách mới (`INSERT INTO pos_discount_codes`), không cộng điểm. H: "nhận mã bill hợp lệ → **điểm tăng** đúng như khi
  nhận qua đường cũ" — điểm từ mã bill là đường KHÁC, `/signup-codes/nhan-diem` (`INSERT INTO pos_point_transactions`, nhân hệ số, bật
  tắt riêng bằng `nhandiem_enabled`).
  Phương án: **(a) đề xuất** — E6 = `/claim` đúng chữ phiếu; H đọc là "voucher phát ra giống hệt đường cũ" (ca H so từng cột voucher).
  (b) `nhan-ma-bill` làm CẢ HAI việc nào đang bật (voucher + nhân điểm) — thêm tách `/nhan-diem` (~+10 dòng, thêm đột biến + ca đua).
  (c) hai route riêng `nhan-ma-bill` (voucher) và `nhan-diem` (điểm).
  Lưu ý khi chọn (a): `/nhan-diem` không có trong `/api/kh` → App vẫn phải gọi đường `X-Service-Key` cũ với SĐT trong thân yêu cầu —
  phần NHÂN ĐIỂM vẫn còn lỗ "khách tự khai SĐT" (F3) cho tới khi chọn (b)/(c) hoặc AUDIT-KH đóng đường cũ.
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
- **Q7 — giới hạn "≤ 10 lần sai / SĐT / giờ" (B2) có chặn cả mã QUẦY cấp không?** Nếu chặn: kẻ xấu biết SĐT của khách chỉ cần 2 lần
  `xin-ma` (cách 60 giây) + 10 lần gõ sai là khoá khách thật 1 giờ, thu ngân cấp mã cũng không vào được. Đề xuất: trần theo SĐT chỉ đếm
  và chỉ chặn mã lối App (`nguon 'gui'`); mã quầy cấp vẫn giữ trần 5 lần / mã (dò mã quầy phải có nhân viên bấm cấp).
- **Q3 (bổ sung từ soát):** tách `products.js` theo cùng khuôn với `/claim` (dòng route + hàm NGAY dưới) để lệnh ghi nhớ tồn
  (`products.js:56–60`) vẫn nằm trong khối phép E14 quét — không giấu lệnh ghi vào hàm phụ, không làm E14 đòi hạ ngưỡng 51.
- **Ghi rõ (không cần trả lời nếu đồng ý):** `cap-ma` dùng `authenticate` (mọi nhân viên đã đăng nhập — cùng mức với tra / sửa khách
  `customers.js:136, 434`), vì thu ngân phải bấm được; khách A đọc đơn của B → 404 (phiếu F3 đã chốt, thay 403 của luật).

## Phát hiện (ngoài phạm vi — không sửa)
- Voucher phát qua `/claim` không ghi vào `pos_voucher_grants` → không hiện ở `/loyalty/vouchers/:phone` (quầy đổi quà vẫn không thấy).
  App KH thấy qua `ma_khach_moi` của `GET /api/kh/voucher` (E3, chủ quán Q1). Claim TRƯỚC 09.08.2026 phát mã KHÁC mã in bill → không nối
  được qua `claimed_phone`, không hiện.
- Khách chỉ có bên SX (trang Khách hàng ghép SX + POS) mà chưa có dòng `pos_customers` → lần đầu đăng nhập App sẽ bị hỏi tên.
- `Customers.jsx` còn 2 `fetch` trần cũ (`loadMembershipStatus`, `loyaltyApi`) — không đụng.
