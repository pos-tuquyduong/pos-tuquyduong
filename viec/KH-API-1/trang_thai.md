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
- Lượt 4 (`tiep`, 19.10.2026): hook mở phiên kéo `27e1ac1 → 22d1cb5`; nhánh `viec/KH-API-1`, cây sạch, HEAD `22d1cb5` = FETCH_HEAD `22d1cb5`.
  ```
  22d1cb5 PHIEU: KH-API-1 Q8 mo backup.js (mot dong BACKUP_TABLES sau pos_customers)
  e382815 KH-API-1: Q8 dong y nhung phieu chua co backup.js tren nhanh - dung cho phieu
  90ed271 KH-API-1: trang thai buoc 4-6 (do tren goc 9/84, xanh 116/0, 54/54 dot bien) + cau hoi Q8 backup.js
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
| A4 khách mới / cũ, không tiêu mã khi thiếu tên; đua tạo khách (`ON CONFLICT`, soát vòng 1) | VS-A4-tieu-ma-truoc-khi-hoi-ten · BV-A4-bo-can-ten · VS-A4-loai-khach-sai · VS-A4-tao-trung |
| A5 không lộ ai là khách | VS-A5-bao-khach-moi |
| C chế độ gửi (`guiMaKhach.js`, huy_luc khi chèn; `gia` chỉ ở máy thử — soát vòng 1) | VS-C-mac-dinh-gia · BV-C-quay-khong-huy · VS-C-doc-luc-nap · BV-C-gia-ngoai-may-thu |
| D quầy cấp mã (`kh/quay.js`) | BV-D-bo-authenticate · VS-D-ma-quay-thanh-gui |
| E1 chỉ sửa tên | VS-E1-sua-ca-sdt |
| E2 / E3 cùng hàm + mã khách mới (`diemKhach.js`) | VS-E2-kh-tu-tinh-bo-han · VS-E3-kh-tu-loc · VS-E3-ma-moi-khong-loc-sdt |
| E4 chỉ đơn của mình | BV-E4-bo-loc-sdt · VS-E4-chi-tiet-bo-loc |
| E5 danh sách trắng + tách `products.js` | VS-E5-tra-them-gia-von · BV-E5-tra-nguyen-mon · VS-Q3-route-cu-bo-gia |
| E6 / E7 cùng hàm `/claim`, `/nhan-diem` | VS-E6-bo-claim-chung · VS-E7-sai-ham |
| G không lộ (`kh/loi.js`, log) | VS-G-500-lo-loi · VS-G-log-ma |
| G nhánh req.khach của `signup-codes.js` → `loiMayChu`; `code` ở mọi lỗi 4xx (soát vòng 1 — thay `VS-G-claim-lo-loi` cũ, neo chuỗi `LOI_KHACH` đã gỡ) | BV-G-claim-bo-loiMayChu · BV-G-nhandiem-bo-loiMayChu · VS-G-claim-500-khong-code · BV-G-bo-code-ma-khong-co · BV-G-bo-code-thieu-ma |
| Q2 tách `/claim` giữ hành vi cũ | VS-P7-sdt-ngoai-try |
| `index.js` trust proxy + gắn `/api/kh` (phép tĩnh bỏ chú thích — soát vòng 1) | BV-Q5-trust-proxy · BV-IX-bo-gan-kh · VS-IX-gan-kh-chu-thich · VS-Q5-trust-proxy-chu-thich |

Kết quả lượt 2: ĐỐI CHỨNG 116 đạt · 0 hỏng; 54 đột biến bị bắt · 0 KHÔNG bị bắt (trên 54).
Kết quả sau soát vòng 1: xem `## Bước 8` dưới (62 đột biến).

## Bước 6 — kiểm
- `node cong_cu/thu_KH1.js` → 116 đạt · 0 hỏng (chạy 4 lần, cả 4 lần như nhau — ca 59 giây tự kiểm cùng giây).
- `npm test` → **ĐỎ 1 FAIL**: `✗ mọi bảng đều được sao lưu (31 bảng) → thiếu trong BACKUP_TABLES: pos_kh_ma_dang_nhap` (phép E8). Phép đúng
  (K8): bảng mới phải vào danh sách sao lưu `server/routes/backup.js` — file NGOÀI Phạm vi → Q8 dưới, DỪNG. Còn lại: E14 "route ghi không
  qua loiGhi" = 51 (đúng ngưỡng, không đổi), cảnh báo "GET có ghi" vẫn đúng 3 chỗ cũ (`products.js` vẫn trong danh sách — lệnh ghi nhớ tồn
  không bị giấu), E15 dòng cứng = 5, fetch trần = 32; `thu_KH1.js` xanh trong bộ.
- `node tu_chay/cong.js tinh . 27e1ac1^ HEAD viec/KH-API-1` (trước khi ghi bảng này): chỉ `✗ [A17]` (tên đột biến chưa ghi — nay đã ghi) và
  `✗ [A19]` (chưa tới bước 11.4); KHÔNG có ✗ Phạm vi.
- **Lượt 4 — Q8 làm xong** (`75dfdfb`): phiếu ở `22d1cb5` có `server/routes/backup.js` trong Phạm vi. Thêm ĐÚNG một dòng
  `{ name: 'pos_kh_ma_dang_nhap', label: 'Mã đăng nhập App KH', key: 'id' }` ngay sau dòng `pos_customers` (`backup.js:43`; `git diff
  --stat` 1 insertion). Bảng không khoá ngoại nên đứng sau `pos_customers` không vướng thứ tự restore cha→con; nhãn 19 ký tự (< 31 giới hạn
  tên trang Excel), không trùng nhãn khác (xem trước / restore tra trang theo nhãn — `backup.js:253, 304`).
  Khoá: phép E8 của bộ kiểm — ĐỎ trên `22d1cb5` (lượt 3 ở trên: `✗ mọi bảng đều được sao lưu (31 bảng) → thiếu trong BACKUP_TABLES:
  pos_kh_ma_dang_nhap`), XANH sau vá: `npm test` → PASS 67 · FAIL 0 · CẢNH BÁO 1 (cảnh báo cũ "route GET có lệnh ghi (3)"); `npm test --
  --day-du` → PASS 71 · FAIL 0 (`✓ mọi bảng đều được sao lưu (31 bảng)`, `✓ bài chạy thật cong_cu/thu_KH1.js xanh`). Không thêm đột biến
  cho dòng này: `dot_bien.py` chỉ chạy `thu_KH1.js`; đột biến "bỏ dòng" chính là bản `22d1cb5` mà E8 đã bắt.

## Bước 8 — soát độc lập `/ra-soat`

### Vòng 1 (19.10.2026, trên HEAD `75dfdfb`) — báo cáo của agent soát, chép nguyên

```
KHÔNG ĐẠT

Tôi chỉ đọc, không sửa file nào. Đã chạy lại trên HEAD 75dfdfb: `node cong_cu/thu_KH1.js` ra 116 đạt · 0 hỏng; `npm test` ra PASS 67 · FAIL 0 · CẢNH BÁO 1; `python3 viec/KH-API-1/dot_bien.py` có đối chứng xanh, 54/54 đột biến bị bắt; `node tu_chay/cong.js tinh . 27e1ac1^ HEAD viec/KH-API-1` chỉ đỏ ở [A19] (chưa ghi "HEAD ĐÃ KIỂM", việc của bước 11.4).

LỖI TÌM ĐƯỢC:
1. server/routes/signup-codes.js:137,138,153,211,313,316,321,331,342,367,381-384 và baoChiemHong :79 — các lỗi App KH nhận qua /api/kh/nhan-ma-bill và /api/kh/nhan-diem không có `code`. Ví dụ: 'Mã không tồn tại' 404, 'Mã đã hết hạn (quá 24 giờ)' 400, 'Chương trình … đang tắt' 400, 'Thiếu mã'. Phiếu G và LUAT §2 đòi `{ error, code }`. App sẽ phải dò chữ tiếng Việt mới phân biệt được "hết hạn", "tắt" hay "sai mã". Bài thử không bắt được vì ca G (cong_cu/thu_KH1.js:603-604) chỉ kiểm khoá là TẬP CON của {error, code, success}, không đòi `code` phải có. Khuôn: K3 (ca lỏng, tên ca nói "chỉ error·code" mà máy kiểm "tập con") và K4 (mở hàm cũ cho đối tượng mới nhưng chỉ vá nhánh 500).
2. server/routes/signup-codes.js:300,450 — lỗi 500 khi gọi từ App trả `{ success:false, error: LOI_KHACH }`, KHÔNG có `code: 'LOI_MAY_CHU'`. Mọi đường /api/kh khác thì có: kh/loi.js:179, khachAuth.js:42. Kho bận (SQLITE_BUSY) ở hai đường này cũng ra 500 thay vì 409 KHO_BAN như loiMayChu (kh/loi.js:177). Cùng một tình huống mà hai mã lỗi (LUAT §2). Ca G "lỗi nội bộ" (thu_KH1.js ~598) chỉ kiểm status. Khuôn: K4. Vá được ngay trong Phạm vi, ở nhánh `req.khach` vốn đã có.
3. Cả hai đường /api/kh/nhan-ma-bill và /api/kh/nhan-diem (kh/index.js:136-137) không giới hạn số lần thử. LUAT_XAY_APP §4 ghi: "Đăng nhập, nhận mã, đặt đơn từ App KH: giới hạn số lần thử theo SĐT + IP". Trước việc này, cửa nhận mã bill chỉ mở cho máy chủ App (X-Service-Key). Giờ mọi khách có token gọi thẳng được, không trần, và có chỗ dò: 404 'Mã không tồn tại' khác hẳn 400/409. Không gian mã chỉ 31^6 ≈ 887 triệu, sinh bằng Math.random (utils/voucherCode.js:11). Nếu `nhandiem_chi_lan_dau='0'` thì một tài khoản dò trúng mã nào là cộng điểm mã đó. Mỗi lần dò còn tốn lượt đọc Turso. Phiếu mục B không nêu điểm này, nên đây là lỗ của phiếu so với luật. Cần hỏi chủ quán, không tự vá. Khuôn: K6.
4. Hồ sơ còn câu sai hoặc cũ (K1/K4 — sửa câu tài liệu mà không grep cả file):
   - trang_thai.md, mục Q8: "(bảng không có khoá ngoại → đặt cuối danh sách)". Thực tế đặt ngay sau pos_customers (backup.js:43).
   - ke_hoach.md mục P7 và §5: "/nhan-diem KHÔNG được gắn vào /api/kh". Thực tế đã gắn (kh/index.js:137).
   - ke_hoach.md §7 F1: "GET /api/kh/voucher không hiện voucher khách mới". Thực tế có `ma_khach_moi` (kh/index.js:92, diemKhach.js:70).
   - ke_hoach.md P2: GIOI_HAN có hạn token 30 ngày. Code không có (maKhach.js:13-21; hạn token để riêng ở khachAuth.js:11).
   - ke_hoach.md §4: các tên đột biến BV-F3-khach-tu-token-sdt, VS-F3-sdt-tu-than, VS-A2-kiem-changes-lon-hon-0, VS-A4-tao-trung, VS-D-gioi-han-quay, VS-E6-sdt-tu-than, BV-E6-bo-claim-chung, VS-B1-tinh-ca-quay không có trong dot_bien.py. Mục "Khác kế hoạch khi làm" chỉ ghi 3 tên đã bỏ. Riêng VS-A4-tao-trung (bỏ ON CONFLICT) bị bỏ mà không ghi.
   - ke_hoach.md §3 E5: "so sâu với bản chụp lấy ở ĐẦU bài … stock_status không đổi". Bài thật (thu_KH1.js:478-488) so với pos_products và không so stock_status.
   - ke_hoach.md §6 luồng 6: "ca B1 61 giây". Thực tế là ca ĐÚNG 60 giây.
   - Số dòng index.js trích ở ke_hoach §1 (64–68, 56–60, 154) đã trôi 3 dòng vì chính việc này thêm dòng.
5. cong_cu/thu_KH1.js:638-644 — phép tĩnh cho index.js dùng `includes`/`indexOf` chuỗi, nên một dòng mount đã bị chú thích (`// app.use('/api/kh', …)`, `// app.set('trust proxy', 1)`) vẫn xanh. Đây đúng là marker suông. Bài thử tự dựng express riêng, nên việc gắn route trong index.js thật không có ca hành vi nào. Khuôn: K3.

NGHI NGỜ:
- maKhach.js:65-76 (K5): ở chế độ `quay` (mặc định trên production), xin-ma không gửi gì mà vẫn bị đếm và vẫn trả 429 sau 20 lần / IP / giờ. Khách ngồi trong quán dùng chung wifi lại chính là nhóm cần mã quầy. Nếu App KH-UI-1 chỉ mở ô nhập mã sau khi xin-ma thành công thì khách bị chặn oan. Nếu `trust proxy 1` sai số tầng trên Render thì cả quán chung một IP.
- maKhach.js:91-93: xác minh chỉ xét mã MỚI NHẤT còn hạn và không huỷ mã cũ. Khi mã mới bị gõ sai 5 lần thì mã cũ còn hạn lại thành mã được xét. Khi có chế độ gửi tin (KH-OTP-1), một lần App xin mã sau khi quầy đã cấp sẽ che mất mã quầy: khách gõ mã quầy sẽ ra MA_SAI. Hôm nay ở chế độ `quay` chưa xảy ra vì dòng App xin được huỷ sẵn.
- guiMaKhach.js:53-61 (C16): chế độ `gia` "chỉ cho bài thử" mới là lời dặn, chưa có khoá. Lỡ đặt GUI_MA_KHACH=gia trên production thì App nhận `lay_ma_tai_quay:false` ("mã đã gửi") mà không có tin nào đi, và mã App xin sẽ che mã quầy.
- kh/index.js:23: `da_tra = total − debt_amount` cho cả đơn đã huỷ hoặc đã hoàn, nên App hiện "đã trả" đủ tiền cho đơn đã hoàn. Có kèm `trang_thai` nhưng con số vẫn dễ hiểu sai.
- kh/index.js:136-137 / signup-codes.js: khách có token nhận được mã của bill mà đơn ghi SĐT người khác (`order_customer_phone`). Hành vi cũ không đổi, nhưng nay mở thẳng cho khách. Chủ quán nên quyết.
- kh/index.js:125-128: mỗi lần gọi /menu là một lần gọi SX và có thể ghi Turso (layMenuQuay), không đệm, không giới hạn. Đáng lo trên Render bản free.
- Các phép tĩnh quét route chỉ đọc `server/routes/*.js` cấp 1 (kiem_tra_truoc_khi_giao.js:508, 563). Thư mục `server/routes/kh/` mà LUAT §3 bắt dùng nằm ngoài mọi phép quét route, gồm cả E14.

NGHIỆM THU: 22/23 mục có bằng chứng · mục thiếu: G.
(A1 :170 · A2 :182 — `crypto.randomInt` chỉ có bằng chứng đọc code (maKhach.js:50), không ca/đột biến khoá; không khoá HMAC so với sha256 không khoá · A3 :199 · A4 :234 · A5 :261 · B1 :269 · B2 :319 · B3 :336 · C :346 · D :366 · E1 :388 · E2 :402 · E3 :413 + ma_khach_moi ở E6 · E4 :429 · E5 :459 — chỉ nhánh SX tắt, SX bật CHƯA KIỂM · E6 :490 · E7 :518 · F1 :543 · F2 :554 · F3 :573 + thân yêu cầu ở E1/E6/E7 · G THIẾU (LỖI 1, 2) · H :617 + npm test 67/0 · Đột biến: đủ 7 loại phiếu đòi, 54/54.)

Các câu soát: K3 — bài đỏ trên bản chưa vá (9 đạt · 84 hỏng; 9 ca xanh đều canh đường cũ); ca hành vi kiểm qua HTTP, marker không làm chúng xanh; ngoại lệ 3 phép tĩnh index.js (LỖI 5); ca G lỏng (LỖI 1). K4 — grep `req.(body|query|params)` trong server/routes/kh/ ra 8 chỗ; SĐT từ client chỉ ở dang-nhap (index.js:40,52) và cap-ma (quay.js:15), hợp lệ; 10 đường 500 có `code`, 2 đường không (signup-codes.js:300,450); ~12 nhánh 4xx không `code` trong hai hàm chung; đã chuyển đủ 3 chỗ dùng chung loyalty → diemKhach. K5 — các luồng có ca, không bị chặn: khách cũ / mới đăng nhập bằng mã quầy; sai 1–4 lần rồi đúng; quầy cấp nhiều lần; xin-ma trước / sau cap-ma; X-Service-Key cũ; POST /orders. Còn ngờ: wifi chung ở chế độ quay, mã quầy bị che khi có chế độ gửi. Đường tiền (P3/P4): không trường tiền nào lấy từ client. P1: diff không đụng `client/`. backup.js: đúng một dòng ngay sau pos_customers (backup.js:43); E8 khoá sự có mặt (kiem_tra:388), vị trí không phép nào khoá; mọi file đổi trong Phạm vi; database.js chỉ thêm bảng + 2 chỉ mục; kiem_tra chỉ thêm một tên bài. Route cũ: /loyalty, /products giữ câu SQL; /claim, /nhan-diem chỉ khác ở nhánh `req.khach`; ca H xanh.

Đơn giản (mục 8):
- maKhach.js:65-79: ở chế độ quay đang sinh mã, băm mã, rồi chèn một dòng huỷ sẵn chỉ để đếm giới hạn, mà giới hạn đó chỉ có thể chặn oan. Gọn hơn: `if (!coKenhGui()) return { layMaTaiQuay: true }` trước câu INSERT. Cần chủ quán xác nhận vì ca C đang khoá đúng thiết kế hiện tại.
- kh/index.js:23,117: chép lại công thức `total − debt_amount` và `flash || tier || unit` của tienDaTra.js:15,45 thay vì gọi hàm chung (LUAT §2). tienDaTra.js ngoài Phạm vi — nên ghi Phát hiện.
- kh/loi.js:157 lấy `loiGhi` từ routes/wallets.js, tức một file route; quy tắc dùng chung lẽ ra ở utils/ (LUAT §3).
- Đối soát (LUAT §5): voucher và điểm nhận qua App là kênh mới, có `created_by 'app_kh'`, chưa có quy tắc đối soát. Cần ghi rõ "không phải tính năng tiền mới", hoặc thêm quy tắc.

CHƯA SOÁT ĐƯỢC: số tầng proxy Render; ngữ nghĩa đua INSERT…SELECT trên Turso từ xa; nhánh SX bật của /menu; mount thật trong index.js; tải /menu; khôi phục backup có sheet mới; `cong.js chay` (phải npm ci); giao diện App và quầy (KH-UI-1, KH-QUAY-1).

BÀI HỌC:
- KHOÁ: ca G phải đòi `code` có mặt trong MỌI thân lỗi /kh, và mỗi nhánh lỗi của nhan-ma-bill / nhan-diem có một ca.
- KHOÁ: phép tĩnh index.js phải bỏ dòng chú thích trước khi dò, hoặc thêm một ca hành vi nạp app thật.
- KHOÁ: chế độ `gia` chỉ được nhận khi chạy máy thử (laMayThu); còn lại coi như `quay`.
- KHOÁ (hỏi chủ quán vì phải sửa bộ kiểm): phép quét route đệ quy cả `server/routes/**`.
- NGUYÊN TẮC (K4, KHUON_LOI.md): khi mở một hàm cũ cho đối tượng mới (khách), rà MỌI nhánh trả của hàm theo luật của đối tượng mới: mã lỗi, giới hạn thử LUAT §4, mã 500. Không chỉ nhánh 500.
- NGUYÊN TẮC (K1): chủ quán chốt khác đề xuất thì grep cả kế hoạch tìm mọi câu dựa trên phương án cũ (Q1-(a), F1 voucher, tên đột biến) và sửa luôn, không chỉ thêm đoạn "đè lên".
```
(Chép gần nguyên văn; hai chỗ rút gọn định dạng: danh sách nghiệm thu và "Các câu soát" gộp thành đoạn; một cụm tên hằng trong mục 4 viết bằng lời
vì người gác chặn chữ in hoa đó trong lệnh.)

### Vòng 1 — đã sửa (commit `ec5efe4` → `b46daf1` + hồ sơ)
| Lỗi soát | Sửa | Bằng chứng |
|---|---|---|
| 1 — lỗi 4xx của hàm chung không `code` | `signup-codes.js` thêm `code` ở 12 chỗ (THIEU_MA ×2, SDT_KHONG_HOP_LE ×2, MA_KHONG_TON_TAI ×3 kể cả `baoChiemHong`, CAU_HINH_DIEM_SAI, UU_DAI_DANG_TAT, MA_HET_HAN, CHUA_CAU_HINH_NHOM, MA_TRUNG); lời báo giữ nguyên, route cũ chỉ THÊM khoá `code` (LUAT §2) | ca G mới đỏ trên bản trước vòng 1 (`bang_chung_do.txt` cuối: 115 · 12) → xanh; đột biến BV-G-bo-code-ma-khong-co · BV-G-bo-code-thieu-ma |
| 2 — 500 / kho bận từ App không `code` | nhánh `req.khach` của hai `catch` gọi `loiMayChu` (500 LOI_MAY_CHU / 409 KHO_BAN); bỏ hằng `LOI_KHACH`; route cũ vẫn `err.message` (ca "G /claim cũ" giữ) | ca G 500 ×2 + KHO_BAN đỏ → xanh; BV-G-claim-bo-loiMayChu · BV-G-nhandiem-bo-loiMayChu · VS-G-claim-500-khong-code |
| 3 — không giới hạn thử nhận mã | KHÔNG tự vá — Q9 dưới | — |
| 4 — hồ sơ cũ | `ke_hoach.md` sửa TẠI CHỖ: P2 (hằng), P7 (`catch`, `/nhan-diem` đã gắn), §1 (số dòng của `27e1ac1`), §3 E5 + thêm hàng E7 + G + (tĩnh), §4 tên đột biến theo `dot_bien.py` (đã bỏ thì gạch + lý do), §5, §6 luồng 6, §7 F1; `trang_thai.md` Q8 | grep tên đột biến `ke_hoach.md`/`trang_thai.md` ↔ `dot_bien.py`: chỉ còn 3 tên đã ghi "bỏ" (dòng 11) + `VS-G-claim-lo-loi` (bảng bước 5 ghi "thay") |
| 5 — phép tĩnh index.js marker suông | bỏ `/* */` và dòng `//` trước khi dò | VS-IX-gan-kh-chu-thich · VS-Q5-trust-proxy-chu-thich bị bắt |
| VS-A4-tao-trung bỏ không ghi | thêm ca "A4 đua: khách được tạo chen" (móc `beginTransaction` chèn khách giữa lúc đọc và lúc chèn) + đột biến | đỏ trên gốc (404); đột biến bỏ `ON CONFLICT` → HTTP 500 → bắt |
| Nghi ngờ `gia` ngoài máy thử (C16) | `guiMaKhach.js`: `gia` chỉ nhận khi `laMayThu()`, ngoài máy thử như giá trị lạ (cảnh báo + quay) | ca C mới đỏ trên bản trước vòng 1 → xanh; BV-C-gia-ngoai-may-thu |

Kiểm sau vòng 1: `node cong_cu/thu_KH1.js` → 128 đạt · 0 hỏng; gốc `6fe38d8` → 9 đạt · 86 hỏng; `python3 viec/KH-API-1/dot_bien.py` → ĐỐI CHỨNG
128 đạt · 0 hỏng, **62 đột biến bị bắt · 0 KHÔNG bị bắt (trên 62)**; `npm test -- --day-du` → PASS 71 · FAIL 0 · CẢNH BÁO 1 (cảnh báo cũ "route GET
có lệnh ghi (3)"), E9 hai phép `/claim` `/nhan-diem` xanh, E14 = 51 không đổi.

Còn lại của báo cáo → Q9–Q11 (`## Câu hỏi`) và `## Phát hiện`. Theo luật skill: có câu hỏi nghiệp vụ → commit, push, DỪNG; vòng soát 2 chạy sau khi
chủ quán trả lời (vòng sửa đã dùng: 1 / 3).

## Câu hỏi
**Lượt 4 (19.10.2026) — chờ chủ quán trả lời Q9–Q11** (soát vòng 1 nêu; máy KHÔNG tự chọn):

- **Q9 — giới hạn thử ở `/api/kh/nhan-ma-bill` và `/api/kh/nhan-diem`.** LUAT_XAY_APP §4: "Đăng nhập, nhận mã, đặt đơn từ App KH: giới hạn số lần
  thử theo SĐT + IP". Phiếu mục B chỉ đặt giới hạn cho đăng nhập. Trước việc này hai cửa này chỉ mở cho máy chủ App (`X-Service-Key`); nay mọi khách có
  token gọi thẳng, không trần, và 404 `MA_KHONG_TON_TAI` khác 400 / 409 → dò được mã có tồn tại. Mã bill 6 ký tự / 31 chữ (~887 triệu tổ hợp, sinh bằng
  `Math.random` — `utils/voucherCode.js`, soát dẫn :11, chưa đọc lại lượt này). Với `nhandiem_chi_lan_dau='0'`, một tài khoản dò trúng mã nào là cộng
  điểm của bill đó.
  Phương án: **(a) đề xuất** — đếm lần nhận mã HỎNG (404 / hết hạn) theo khách + IP trong CSDL, ví dụ ≤ 10 lần hỏng / khách / giờ, ≤ 30 / IP / giờ →
  429 `QUA_NHIEU_LAN`; cần một bảng đếm nhỏ (`database.js` + `backup.js` thêm dòng → sửa Phạm vi / Cấm của phiếu) + ~25 dòng + ca + đột biến.
  (b) Gộp 404 `MA_KHONG_TON_TAI` vào cùng câu với hết hạn (không lộ tồn tại) — không chặn dò, chỉ bớt tín hiệu; đổi hành vi route cũ (Cấm).
  (c) Để AUDIT-KH / việc sau (ghi Phát hiện), giữ nguyên như hiện tại.
  Số ngưỡng (10 / 30) là quyết định của chủ quán.
- **Q10 — chế độ `quay` (mặc định production) có nên KHÔNG đếm `xin-ma` không?** Hôm nay `xin-ma` ở chế độ `quay` không gửi gì nhưng vẫn chèn một dòng
  (huỷ sẵn) và vẫn tính vào trần 20 lần / IP / giờ, 5 lần / SĐT / giờ, 60 giây → khách ngồi trong quán chung wifi (chính nhóm cần mã quầy) có thể bị 429.
  Nếu App (KH-UI-1) chỉ mở ô nhập mã sau khi `xin-ma` trả 200 thì khách bị chặn oan (K5). Phương án: **(a) đề xuất** — chế độ `quay`: `xin-ma` trả ngay
  `lay_ma_tai_quay: true`, không sinh mã, không chèn dòng (gọn hơn ~5 dòng, bớt một lần ghi Turso mỗi lần bấm); ca C đổi theo. (b) giữ như hiện tại, App
  KH-UI-1 luôn cho nhập mã (kể cả khi 429).
- **Q11 — khách nhận mã của bill ghi SĐT người khác.** `/claim` cũ cho mọi SĐT nhận mã của bất kỳ bill nào (kể cả bill có `customer_phone` của người khác) —
  hành vi cũ không đổi, nhưng nay khách tự gọi được. Giữ như cũ (mã in trên giấy = ai cầm giấy được dùng), hay chặn khi bill đã có SĐT khác SĐT token?
  Chặn là đổi hàm chung → đổi luôn hành vi `/claim` cũ (Cấm của phiếu).

**Đối soát (LUAT §5) — ghi rõ, không cần trả lời nếu đồng ý:** việc này KHÔNG thêm tính năng tiền mới — voucher / điểm qua App đi đúng hàm `/claim` /
`/nhan-diem` cũ (cùng bảng, cùng quy tắc); dòng ĐIỂM nhận qua App có `created_by 'app_kh'` (`signup-codes.js:281` lấy `req.user.username`, `quaToken` đặt `app_kh`) để màn Đối soát
lọc được; voucher qua `/claim` KHÔNG có cột người tạo (cùng như đường cũ) — App hay `X-Service-Key` không phân biệt được (ghi Phát hiện).

## Câu hỏi cũ (đã trả lời)
**Lượt 3 (`tiep`, 19.10.2026):** chủ quán trả lời Q8 ĐỒNG Ý (một dòng `pos_kh_ma_dang_nhap` NGAY SAU dòng `pos_customers` — P26d sửa cuối
danh sách), nói phiếu đã thêm `server/routes/backup.js`. Nhưng `git fetch origin viec/KH-API-1` → FETCH_HEAD = HEAD = `90ed271`;
`viec/KH-API-1/phieu.md` ở HEAD chưa có `backup.js` trong `## Phạm vi` (lần sửa phiếu cuối vẫn là `6fe38d8`). Máy không tự sửa phiếu, không
sửa file ngoài Phạm vi (cổng A6 đọc phiếu ở head) → DỪNG, chờ commit phiếu lên nhánh `viec/KH-API-1`.

**Q8 (ĐÃ ĐỒNG Ý — chờ phiếu lên nhánh):** xin thêm `server/routes/backup.js` vào Phạm vi, CHỈ thêm một dòng vào `BACKUP_TABLES`:
`{ name: 'pos_kh_ma_dang_nhap', label: 'Mã đăng nhập App KH', key: 'id' }` (đề xuất ban đầu "đặt cuối danh sách"; chủ quán chốt NGAY SAU
`pos_customers` — đã làm ở `backup.js:43`, bảng không khoá ngoại nên chỗ nào cũng đúng thứ tự cha→con). Lý do: phép E8
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
- (soát vòng 1) Phép quét route của bộ kiểm (E14, "GET có ghi"…) chỉ đọc `server/routes/*.js` cấp 1 → `server/routes/kh/` (LUAT §3 bắt dùng) nằm
  ngoài mọi phép quét route. Đề xuất KHOÁ: quét đệ quy `server/routes/**` — sửa bộ kiểm, cần chủ quán cho phép (CLAUDE.md §6).
- (soát vòng 1) `kh/index.js` tính `da_tra = total − debt_amount` cho mọi đơn, kể cả đơn đã huỷ / đã hoàn (có kèm `trang_thai`) — App KH-UI-1 nên
  hiện theo `trang_thai`. Công thức trùng `tienDaTra.js` (nằm trong `soTienHoan`, không có hàm riêng để gọi) — tách hàm là việc của file ngoài Phạm vi.
- (soát vòng 1) `/api/kh/menu` mỗi lần gọi là một lần gọi SX và có thể ghi Turso (nhớ tồn của `layMenuQuay`), không đệm, không giới hạn — đáng đo
  khi App lên (Render free).
- (soát vòng 1) `xacMinhMa` chỉ xét mã MỚI NHẤT còn hạn và không huỷ mã cũ: khi KH-OTP-1 có chế độ gửi, một lần App xin mã sau khi quầy đã cấp sẽ che
  mã quầy (khách gõ mã quầy → `MA_SAI`). Hôm nay (`quay`) không xảy ra vì dòng App xin bị huỷ sẵn. KH-OTP-1 phải xử lý.
- (soát vòng 1) `kh/loi.js` lấy `loiGhi` từ `routes/wallets.js` (một file route) — quy tắc dùng chung lẽ ra ở `utils/` (LUAT §3); dời là sửa `wallets.js`.
- (soát vòng 1) Voucher phát qua `/claim` không có cột người tạo → Đối soát không tách được voucher nhận qua App với qua `X-Service-Key`.
- (soát vòng 1) A2 `crypto.randomInt` và HMAC có khoá (`bamMa`) chỉ có bằng chứng đọc code, không ca / đột biến khoá (thay bằng `Math.random` hay
  sha256 không khoá thì bài vẫn xanh) — khoá được bằng phép tĩnh, chưa làm.
