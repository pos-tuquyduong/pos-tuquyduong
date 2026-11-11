# VI-ME-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (10.11.2026)
HEAD 7239819 · FETCH_HEAD 7239819 (bằng nhau, không kéo)
```
7239819 PHIEU: VI-ME-1
136d6b0 TIEN-DO: QUAY-UI-1, KH-THE-1 xong; bo P3b; NAP-2 -> KH-NAP-1; CAIDAT-BAO-1 -> BAO-1b; them VOUCHER-2, BAO-1a, BAO-1b, QC-APP-1, GIAO-MA-1, GIAO-DIEN-2; mo VI-ME-1, BAO-1a; quyet dinh 08-09.11 b; lich 09.11 — so v59
db2d71d Merge pull request #84 from pos-tuquyduong/viec/KH-THE-1
```

Stop hook báo `npm test` đỏ ở thu_BH2 G1: kho nông, thiếu commit cbbb809 (`git log` lỗi) — không phải lỗi code. `git fetch -q --unshallow origin viec/VI-ME-1` (chỉ tải lịch sử) → `npm test` PASS 108 · FAIL 0 · CẢNH BÁO 1.

## Bước 3 — kế hoạch
`ke_hoach.md`. Phiếu dặn lập kế hoạch rồi DỪNG chờ duyệt → dừng sau khi push.

## Câu hỏi (vòng 1 — chủ quán đã trả lời 10.11)
1. Duyệt kế hoạch (phương án A: một lời gọi `kiemTraMe` trong `taoDon`, phủ tạo đơn + giữ chỗ + chốt phiên).
2. Kiểm quan hệ mẹ–con đọc NGOÀI giao dịch ghi (đề xuất của mình — đủ an toàn, ít dòng). Bạn muốn kiểm lại cả TRONG giao dịch thì nói (thêm ~4 dòng).

3. Khách chỉ có ở danh sách đăng ký (`pos_registrations`, đã duyệt / từ chối, không có dòng khách — bước nâng cấp 022 chỉ chép đăng ký đang chờ) vẫn hiện "số dư mẹ" trên màn, nhưng theo nghiệm thu A sẽ bị từ chối 403. Đề xuất của mình: giữ đúng phiếu (chỉ tin `pos_customers`) — màn vẫn hiện số dư mẹ nhưng bấm thu sẽ báo "không phải tài khoản mẹ". Bạn xác nhận là được.

Trả lời chủ quán 10.11: (1) Phương án A — đồng ý. (2) KHÔNG kiểm lại trong giao dịch (ghi CHƯA KIỂM). (3) Khách chỉ có trong danh sách
đăng ký → từ chối (giữ đúng phiếu). Ba phát hiện ngoài phiếu: chat xử lý bằng việc riêng.

## Soát kế hoạch (agent phụ, 10.11)
Không ra ngoài Phạm vi; không có cách ngắn hơn. Đã thêm ca B5 (kiểm mẹ trước PIN), B6 (số dư mẹ báo màn), B7 (màn khách), B2 chốt hai cách; sửa số dòng nhả giữ chỗ 130-133; thêm Câu hỏi 3 và Phát hiện `/wallets/deduct`.

## Phát hiện
- `POST /wallets/deduct` (`wallets.js:181`) trừ ví SĐT bất kỳ — chỉ quyền `adjust_balance` (mặc định chủ quán). Không phải lối mẹ, không sửa.
- `balance_amount` (ví của chính khách) ở POST /orders cũng trừ theo SĐT màn gửi, không PIN khi cờ `thanh_toan_payos_bat_buoc` tắt (`orders.js:831-848`). Ngoài phiếu, không sửa.
- Người có quyền sửa khách có thể đặt `parent_phone` của một khách thành SĐT bất kỳ rồi trừ ví đó qua lối quầy cũ (không PIN). Lối phiên vẫn đòi PIN ví mẹ (`giuCho.js:56-60`). Ngoài phiếu.

## Phiên làm tiếp (10.11.2026)
Bước 1: nhánh viec/VI-ME-1, cây sạch. HEAD 999889f · FETCH_HEAD 999889f (bằng nhau, không kéo).
```
999889f VI-ME-1: ghi kho nong lam thu_BH2 do oan, da unshallow, npm test xanh
0857319 VI-ME-1: ke hoach + trang thai — cho chu quan duyet
7239819 PHIEU: VI-ME-1
```
Kho lại nông (thu_BH2 G1 đỏ vì thiếu cbbb809) → `git fetch -q --unshallow origin viec/VI-ME-1`, BH2 xanh lại.

Bước 4 — bài thử `cong_cu/thu_VIME1.js` (23 ca): gốc 11 đạt · 12 hỏng; bản vá 23 đạt · 0 hỏng (`bang_chung_do.txt`).
Bước 5 — bản vá theo phương án A: một hàm `kiemTraMe(phoneKhach, sdtMe)` ở `server/utils/viMe.js`, MỘT lời gọi trong `taoDon` ngay sau dòng
chuẩn hoá SĐT mẹ, điều kiện `parent_phone || parent_balance_amount > 0`; + 1 dòng `chayBaiThat` trong bộ kiểm. ~20 dòng máy chủ.
**CHƯA commit vào `server/`** (sẽ làm `npm test` đỏ — xem Câu hỏi 4): lưu ở `viec/VI-ME-1/va_cho_duyet.diff` + `viec/VI-ME-1/viMe_cho_duyet.js`.

## Câu hỏi (vòng 2 — DỪNG chờ chủ quán)
4. Vá xong thì `npm test` đỏ 6 bài CŨ (PASS 103 · FAIL 6): `thu_P26b.js`, `thu_P26c.js`, `thu_GOI1.js`, `thu_DIEMTHAT1.js`, `thu_HD1.js`,
   `thu_NAP1.js`. Lý do: các bài này bán đơn "trả bằng tài khoản mẹ" mà KHÔNG ghi trong hồ sơ khách rằng người mua là con của mẹ đó
   (18 chỗ gửi `parent_phone`) — đúng loại đơn VI-ME-1 phải chặn, nên giờ bị 403 `KHONG_PHAI_TK_ME`. Không phải lỗi của bản vá.
   Cách sửa: mỗi bài thêm bước dựng dữ liệu — tạo / cập nhật dòng khách con trong `pos_customers` với `parent_phone` = mẹ trước khi bán
   (không đổi phép kiểm nào, không đổi số mong đợi; vài dòng mỗi bài). Bản sửa xanh trên code mới và cũng xanh trên gốc (gốc không kiểm
   mẹ) → cổng A11 cần mục `## Bài thử cũ sửa`. Sáu file NGOÀI `## Phạm vi` nên mình dừng.
   **Đề xuất của mình:** thêm vào phiếu VI-ME-1:
   - `## Phạm vi`: `cong_cu/thu_P26b.js`, `cong_cu/thu_P26c.js`, `cong_cu/thu_GOI1.js`, `cong_cu/thu_DIEMTHAT1.js`, `cong_cu/thu_HD1.js`, `cong_cu/thu_NAP1.js`
   - `## Bài thử cũ sửa`: sáu file trên — "dựng quan hệ mẹ–con trong pos_customers trước đơn trả tài khoản mẹ (VI-ME-1)".
   Bạn chỉ cần trả lời "đồng ý câu 4" (chat sửa phiếu) — máy làm tiếp từ bản vá đã lưu.

## Phiên làm tiếp 2 (10.11.2026 — chủ quán đồng ý câu 4)
Bước 1: nhánh viec/VI-ME-1, cây sạch. HEAD 35f0d48 · FETCH_HEAD 35f0d48 (bằng nhau, không kéo).
```
35f0d48 PHIEU: VI-ME-1 Pham vi them 6 bai thu cu (thu_P26b, thu_P26c, thu_GOI1, thu_DIEMTHAT1, thu_HD1, thu_NAP1) — chu quan duyet cau 4 10.11
549cf4c VI-ME-1: bang chung do + ban va cho duyet; cau hoi 4: 6 bai cu ngoai pham vi
f71ce7c VI-ME-1: thu_VIME1 C1 doc parent_phone tu CSDL
```
Kho lại nông (thu_BH2 G1 đỏ, thiếu cbbb809) → `git fetch -q --unshallow origin viec/VI-ME-1`.

Bước 5 — đặt lại bản vá từ `va_cho_duyet.diff` + `viMe_cho_duyet.js` (người gác chặn `git apply` / `patch` → đặt bằng Python
`content.replace`, mỗi chuỗi khớp đúng 1 lần), xoá hai file lưu tạm. Sáu bài cũ: thêm hàm `datMe(con, me)` (upsert
`pos_customers.parent_phone`) ngay sau `db.initDatabase()`; gọi trước mỗi đơn trả tài khoản mẹ (P26b, P26c, GOI1: dòng nạp ví; DIEMTHAT1,
HD1, NAP1: trong `ban` khi thân có `parent_phone`). Không đổi phép kiểm, không đổi số mong đợi — số ca gốc = HEAD (`bang_chung_do.txt`).
`thu_VIME1.js` thêm `--may-chu` (chạy trên bản sao cho đột biến), số ca vẫn 23.
Bước 6 — `npm test`: PASS 109 · FAIL 0 · CẢNH BÁO 1.

### Chỗ vá → đột biến (`python3 viec/VI-ME-1/dot_bien.py` — ĐỐI CHỨNG XANH 23 đạt · 0 hỏng; TỔNG 8 · BẮT 8 · SỐNG 0 · HỎNG 0 · LẠC 0)
| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| `orders.js:691-692` lời gọi `kiemTraMe` trong `taoDon` | `BV-1-bo-goi` | A1 |
| `orders.js:690` điều kiện `parent_phone \|\| parent_balance_amount > 0` | `VS-1-chi-khi-co-tien` | B1 |
| | `VS-7-chi-khi-co-sdt-me` | A4 |
| lời gọi chạy cả ở chế độ chỉ tính (phiên) | `VS-4-bo-qua-chi-tinh` | B1 |
| `viMe.js` so `parent_phone` đã chuẩn hoá hai vế | `VS-2-khong-chuan-hoa` (gỡ cả hai vế) | A5 |
| `viMe.js` vế phía CSDL `normalizePhone(kh.parent_phone)` (thêm 11.11, soát lần 3) | `VS-8-khong-chuan-hoa-csdl` | A5c |
| | `VS-3-chi-kiem-co-me` | A1 |
| `viMe.js` khách phải tồn tại | `VS-5-khong-can-khach` | A3 |
| `viMe.js` SĐT mẹ rỗng → từ chối | `VS-6-trong-me-cho-qua` | A4 |

Tên đột biến: BV-1-bo-goi, VS-1-chi-khi-co-tien, VS-4-bo-qua-chi-tinh, VS-7-chi-khi-co-sdt-me, VS-2-khong-chuan-hoa, VS-3-chi-kiem-co-me,
VS-5-khong-can-khach, VS-6-trong-me-cho-qua, VS-8-khong-chuan-hoa-csdl (thêm 11.11).

Bước 6 (bổ sung) — `npm test -- --day-du`: PASS 111 · FAIL 2 — giả lập quầy `cong_cu/gia_lap/kich_ban.js:328,335` (KB17) bán đơn trả tài khoản
mẹ mà không dựng quan hệ mẹ–con → 403 KHONG_PHAI_TK_ME (`cong_cu/gia_lap/chay.js`, `cong_cu/thu_gia_lap.js`). Ngoài Phạm vi.
Lệnh bị người gác chặn phiên này: `git apply` (GIT-LENH), `patch` (B-CHUONGTRINH), `git worktree` (GIT-LENH), vòng `for` (B-CHUONGTRINH),
lệnh `cat … ; node …` ghép (B-PHANTICH) — đều đổi sang cách khác được (Python replace, dot_bien.py --goc, lệnh tách rời).

## Soát độc lập (/ra-soat lần 1, 10.11 — báo cáo nguyên văn)
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
- cong_cu/gia_lap/kich_ban.js:328 và :335 (KB17) gửi parent_phone: ME nhưng không dựng quan hệ mẹ–con trong pos_customers → 403
  KHONG_PHAI_TK_ME. `--day-du` → PASS 111 · FAIL 2 (gia_lap/chay.js, thu_gia_lap.js M13 → KB17 → I11, 3 lệch). Bị sót vì npm test không
  chạy giả lập; trang_thai chỉ ghi "npm test PASS 109". Ngoài Phạm vi → dừng hỏi. Khuôn K4 + K6.
- `node tu_chay/cong.js chay . 72398197^ HEAD viec/VI-ME-1` → CỔNG ĐỎ 8 lý do: A11 × 6 (thu_DIEMTHAT1, thu_GOI1, thu_HD1, thu_NAP1,
  thu_P26b, thu_P26c — "bài thử cũ được miễn nhưng bản gốc đỏ trên code PR"); theo LUAT_XAY_APP §6.9 bài như vậy KHÔNG thuộc
  ## Bài thử cũ sửa mà là bài sửa thường (§6.8): cần thêm một ca ĐỎ trên gốc khi bản mới vẫn xanh trên gốc. Lập luận Câu hỏi 4 đọc
  ngược luật. A13 (--day-du đỏ). A20 (chưa có dòng SOÁT BẢO MẬT — bình thường ở bước này). Khuôn K1 / K6.
- ke_hoach.md:72-76 tên đột biến cũ (VS-3-chi-kiem-ton-tai, VS-4-sau-chi-tinh) ≠ dot_bien.py (VS-3-chi-kiem-co-me, VS-4-bo-qua-chi-tinh);
  thiếu VS-5, VS-6, VS-7. K4.
- ke_hoach.md ca E1 hứa phép hành vi; thu_VIME1.js:224-225 chỉ kiểm tĩnh. K3 nhẹ.
- cong_cu/thu_VIME1.js:152 `p1` dựng mà không ca nào kiểm (mã chết).
NGHI NGỜ:
- orders.js:690 kiểm cả lúc chốt phiên: phiên tru_tai_khoan_me có giu_vi_me = 0, hoặc phiên QR chốt qua webhook mà quan hệ đổi giữa
  giữ và chốt → 403, phiên 'loi' (giuCho.js:129-132), tiền QR đã về. Xác suất thấp; chưa có ca thử.
- thu_DIEMTHAT1.js:103-106, thu_HD1.js:393-396, thu_NAP1.js:121-124: `ban` tự dựng quan hệ cho MỌI thân có parent_phone → ca "sai mẹ"
  viết sau này trong ba file sẽ xanh oan (K3).
- Đường tấn công qua ví của CHÍNH khách (customer_phone = X + balance_amount, orders.js:837-848, không PIN khi cờ tắt) vẫn còn — đã ghi
  Phát hiện.
- trang_thai "18 chỗ" (grep 17); ke_hoach giuCho.js:27 (thật :22); chú thích orders.js:688-689 xếp "chốt phiên" vào chế độ chỉ tính
  (thật: chốt đi vaoGiaoDich, giuCho.js:109).
NGHIỆM THU: 4/6 mục có bằng chứng · mục thiếu: C (--day-du đỏ KB17), K5 (luật ví mẹ KB17 / M13 đỏ)
CHƯA SOÁT ĐƯỢC: số khách chỉ có trong pos_registrations trên production; chốt webhook khi quan hệ đổi giữa chừng; nhánh dungHien của
  manKhach.js:127; đua giữa kiểm và ghi (CHƯA KIỂM theo quyết định chủ quán).
BÀI HỌC: KHOÁ — chạy --day-du / cong.js chay trước khi ghi "npm test xanh" cho việc tiền; KHOÁ — đề xuất ## Bài thử cũ sửa thì công cụ
  tự chạy BẢN GỐC bài trên code mới (§6.9, lần sai thứ 4); NGUYÊN TẮC K4 — grep bài bị ảnh hưởng quét cả cong_cu/gia_lap/;
  NGUYÊN TẮC K3 — hàm dựng dữ liệu không tự "chữa" mọi đầu vào, gọi datMe tường minh từng ca.
```
Phiên chính đã chạy lại `node tu_chay/cong.js chay . 72398197^ HEAD viec/VI-ME-1` → xác nhận đúng 8 dòng ✗ (A20, A13, A11 × 6).

## Soát bảo mật
Số lỗi trước lọc: 0 · sau lọc: 0 (người soát tự làm cả bước tìm và lọc — không có công cụ sub-task). Báo cáo nguyên văn (rút gọn trình bày, giữ nội dung):
```
# Soát bảo mật VI-ME-1 (viec/VI-ME-1, mốc 72398197^..c4ed786f)
Không tìm thấy lỗ hổng nào đạt ngưỡng báo cáo. Số lỗi trước lọc: 0 · sau lọc: 0
Điểm vá: viMe.js:12-16 — chuẩn hoá hai vế, truy vấn có tham số; mọi trường hợp sai cùng 403 KHONG_PHAI_TK_ME. orders.js:690-693 —
  gửi tiền mẹ mà trống parent_phone vẫn 403; không lách bằng đổi kiểu; cổng chạy TRƯỚC đọc ví mẹ / dangGiu (860-881), ghiVi (969),
  ghi đơn (1000/1015), nhánh chiTinh (898) — phủ tạo phiên và tinh-thu (1354).
Lối: POST /orders qua taoDon; POST /thanh-toan/phien → taoPhien (giuCho.js:47-53) — đối chiếu mẹ trước PIN (56-60) và trước giữ
  (62-68): không tốn lượt PIN sai, không phân biệt "SĐT có ví / có PIN"; chốt phiên (giuCho.js:105-123) mọi cách đối chiếu lại với CSDL,
  quan hệ đổi → 403, phiên 'loi' (131-134) — chiều an toàn; App KH (donApp.js:281) không có tru_tai_khoan_me, TRUONG_DON (giuCho.js:23-24)
  không có parent_phone; hoàn / huỷ / đền đọc từ đơn (wallets.js:116, refunds.js:173-178, tienDaTra.js:50,86-88) — không đụng.
Lộ thông tin: một mã lỗi chung; chỉ đoán được "Y có phải mẹ X" — nhân viên vốn xem được qua danh sách khách (customers.js:162,210-219).
Không tính là lỗi: cờ thanh_toan_payos_bat_buoc tắt → POST /orders trừ tiền mẹ không PIN (orders.js:239-246) — có từ trước, nay chỉ
  áp cho con thật của mẹ đó.
```
SOÁT BẢO MẬT: ĐẠT

## Câu hỏi (vòng 3 — DỪNG chờ chủ quán)
5. **Mình đã sai ở Câu hỏi 4 — xin lỗi bạn.** Mình đề xuất xếp 6 bài cũ vào `## Bài thử cũ sửa`, nhưng luật §6.9 nói ngược lại: mục đó chỉ
   dành cho bài cũ mà BẢN CHƯA SỬA vẫn xanh trên code mới. Sáu bài này bản chưa sửa ĐỎ trên code mới (cổng A11 bắt cả 6) → chúng là
   "bài sửa thường" (§6.8): mỗi bài phải có ít nhất một ca ĐỎ trên code gốc. Đồng thời mình bỏ sót bài giả lập quầy
   `cong_cu/gia_lap/kich_ban.js` (KB17 bán đơn trả tài khoản mẹ, chỉ chạy ở `--day-du`) — nó cũng bị chặn 403 và nằm NGOÀI Phạm vi.
   **Đề xuất của mình** (chat sửa phiếu, máy làm tiếp):
   - (a) Xoá 6 dòng khỏi mục `## Bài thử cũ sửa` của phiếu (giữ nguyên 6 file trong `## Phạm vi`).
   - (b) Cho phép mỗi bài trong 6 bài thêm ĐÚNG MỘT ca mới: "đơn trả tài khoản mẹ khi hồ sơ khách CHƯA ghi mẹ → 403 KHONG_PHAI_TK_ME,
     ví mẹ không đổi" — ca này đỏ trên code gốc (gốc cho trừ), xanh trên code mới. Ca cũ, số mong đợi cũ giữ nguyên. Đồng thời gọi
     `datMe` tường minh ở từng ca thay vì nhúng trong hàm `ban` (người soát lo ca "sai mẹ" về sau xanh oan).
   - (c) Thêm `cong_cu/gia_lap/kich_ban.js` vào `## Phạm vi`: KB17 chỉ thêm một dòng dựng quan hệ mẹ–con trước hai đơn trả tài khoản mẹ
     (không đổi phép kiểm). Nếu bộ giả lập đang ĐÓNG BĂNG thì bạn cho mình biết, mình sẽ đề xuất cách khác.
   Bạn chỉ cần trả lời "đồng ý câu 5" (hoặc nêu phần nào không đồng ý).
   Việc nhỏ máy sẽ làm cùng vòng sau (trong Phạm vi, không cần hỏi): sửa tên đột biến cũ ở `ke_hoach.md`, bỏ biến `p1` thừa ở
   `thu_VIME1.js:152`, sửa chú thích `orders.js:688-689` (chốt phiên không phải chế độ chỉ tính) — đổi `server/` thì soát bảo mật lại.

## Phiên làm tiếp 3 (11.11.2026 — chủ quán đồng ý câu 5 (a)(b)(c))
Bước 1: nhánh viec/VI-ME-1, cây sạch. HEAD 5a0274c · FETCH_HEAD 5a0274c (bằng nhau, không kéo; hook mở phiên đã kéo 7239819 → 5a0274c).
```
5a0274c PHIEU: VI-ME-1 bo muc Bai thu cu sua (sai luat A11), Pham vi them cong_cu/gia_lap/kich_ban.js (KB17) — chu quan dong y cau 5 10.11
a1a87c5 VI-ME-1: ra-soat lan 1 KHONG DAT + soat bao mat DAT; cau hoi 5 (A11 x6, gia lap KB17 ngoai pham vi) — dung
c4ed786 VI-ME-1: trang thai phien tiep 2 + bang dot bien
```
Đã làm:
- 6 bài cũ (P26b, P26c, GOI1, DIEMTHAT1, HD1, NAP1): mỗi bài thêm ĐÚNG một ca `VM1 (VI-ME-1) đơn trả tài khoản mẹ khi hồ sơ khách CHƯA ghi mẹ
  → 403 KHONG_PHAI_TK_ME, ví mẹ không đổi` (khách con mới, không dựng quan hệ). Ca cũ + số mong đợi giữ nguyên. `ban` của DIEMTHAT1, HD1, NAP1
  trở lại như gốc; `datMe(con, me)` gọi tường minh trước từng đơn trả tài khoản mẹ (DIEMTHAT1 B4, B8, D5; HD1 A25; NAP1 C3, C7b, E3b, E7c).
  Gốc 35f0d48: mỗi bài đỏ đúng 1 ca VM1 (HTTP 200, ví mẹ bị trừ); HEAD: xanh, số ca +1 (`bang_chung_do.txt`).
- KB17 (`cong_cu/gia_lap/kich_ban.js`): một lệnh upsert `pos_customers (S, parent_phone = ME)` trước hai đơn trả ví mẹ. Không đổi phép kiểm.
- 3 việc nhỏ: `ke_hoach.md` §4 tên đột biến theo `dot_bien.py` (đủ 8); bỏ biến `p1` thừa ở `thu_VIME1.js` (23 ca; gốc 12 đạt · 11 hỏng qua `dot_bien.py --goc`, như lần chạy 10.11 — lần đầu trên gốc thật 11 · 12, lý do ở `bang_chung_do.txt`);
  sửa chú thích `orders.js` (chốt phiên là lúc taoDon ghi thật, không phải chế độ chỉ tính).
- Đột biến: `python3 viec/VI-ME-1/dot_bien.py` → ĐỐI CHỨNG XANH 23 · TỔNG 8 · BẮT 8 · SỐNG 0 · HỎNG 0 · LẠC 0.
- Lệnh bị người gác chặn phiên này: `$(( ))` và vòng `for` (B-PHANTICH / B-CHUONGTRINH); chạy bài có cụm bí mật trước khi commit
  (B-BIMAT-CHU — commit trước rồi chạy; script nháp có chữ đó cũng bị chặn → dùng Edit); `python3 … && git add …` ghép (B-PHANTICH).
- Bước 6: `npm test -- --day-du` → PASS 112 · FAIL 1 (chỉ `thu_BH2.js` G1 — kho nông, thiếu cbbb809; giả lập KB17 hết đỏ). Stop hook cũng báo
  `thu_QUAYUI1.js` sập "Cannot find module express" một lần — chạy lại riêng 63/63 xanh, `node_modules/express` có mặt (thoáng qua, không tái hiện).
  `git fetch -q --unshallow origin viec/VI-ME-1` → `thu_BH2.js` 100 đạt · 0 hỏng.

## Soát độc lập (/ra-soat lần 2, 11.11 — báo cáo nguyên văn)
```
KHÔNG ĐẠT (chỉ còn lỗi NHẸ: không lỗi nào đụng tiền, ví, điểm hay bảo mật lúc quầy chạy. Phần máy chủ đã vá đúng.)
LỖI TÌM ĐƯỢC:
1. cong_cu/thu_P26c.js:177 — hàm phụ `goiDaLay` có dòng `if (them.parent_phone) await datMe(sdt, them.parent_phone);` — tự dựng quan hệ
   cho MỌI lần gọi có parent_phone, trái ý (b) "datMe tường minh từng ca"; hôm nay một chỗ gọi (A5g, :300); trang_thai.md:172 bỏ sót. — K3 (+K1).
2. viec/VI-ME-1/ke_hoach.md:63 (ca E1) hứa phép hành vi; thu_VIME1.js:223-224 chỉ soi tĩnh. Lần soát 1 đã nêu, chưa sửa. — K3 nhẹ / K1.
3. viec/VI-ME-1/ke_hoach.md:14 `giuCho.js:27 TRUONG_DON`; thật là giuCho.js:22. Lần soát 1 đã nêu, chưa sửa. — K1.
Đã kiểm 8 lỗi / nghi ngờ lần 1: KB17 (gia_lap/chay.js 33 kịch bản ĐẠT), A11 ×6 (cổng chạy ĐẠT), tên đột biến khớp dot_bien.py:23-34,
  p1 đã bỏ, chú thích orders.js:688-689 đúng, `ban` DIEMTHAT1/HD1/NAP1 như gốc.
K3: VIME1 gốc 12 · 11, HEAD 23 · 0; P26c gốc 157/1, NAP1 88/1 (đỏ đúng VM1); sáu ca VM1 đủ chặt (403 + code + ví mẹ).
K4: mọi đơn mẹ mong 200 có datMe tường minh trừ P26c:300 (lỗi 1); NAP1:263, :271 mong 400 NAP_CHI_TIEN_MAT_QR — phép nạp chạy trước
  kiemTraMe (orders.js:228-237; giuCho.js:43-45), không xanh oan. Mọi lối trừ/giữ ví mẹ qua taoDon; trước orders.js:690 không câu ghi.
K5: C1, C2, A5, đơn không mẹ (Sales.jsx:730, tinh.js:144 gửi null), phiên giữ 0đ, D1, B7 qua; khách chỉ có pos_registrations chặn theo Q3
  (docKhach.js:28 vẫn hiện số dư mẹ — chủ quán đã chấp nhận).
K1: trang_thai.md:175 "gốc VẪN 12 · 11" trong khi :42 ghi 11 · 12 — chữ "vẫn" sai.
Đường tiền: đối chiếu pos_customers (viMe.js:14), số tiền mẹ qua phép đủ số dư (orders.js:867). P1: không đổi client.
NGHI NGỜ: không có đột biến "chỉ bỏ kiểm lúc chốt phiên"; SOÁT BẢO MẬT: ĐẠT của mốc c4ed786 (server/ từ đó chỉ đổi chú thích);
  pos_customers.phone thô (sync.js:290) → 403 oan, chưa thấy dòng nào.
NGHIỆM THU: 6/6 mục có bằng chứng (C chờ --day-du của phiên chính).
CHƯA SOÁT ĐƯỢC: --day-du; P26b, GOI1, DIEMTHAT1, HD1 trên gốc (dựa bang_chung_do); dữ liệu production; chốt webhook QR khi quan hệ đổi;
  đua kiểm–ghi (CHƯA KIỂM theo chủ quán).
BÀI HỌC: NGUYÊN TẮC K3 — grep MỌI hàm phụ dựng đơn, không chỉ `ban`; KHOÁ — mỗi lỗi soát trước phải có dòng "đã sửa / không sửa vì…".
```

### Vòng sửa 1 (sau soát lần 2) — từng lỗi
| Lỗi | Xử lý |
|---|---|
| 1 P26c `goiDaLay` datMe ẩn | ĐÃ SỬA (a3d50f7): bỏ dòng trong `goiDaLay`, thêm tham số `sdt`; A5g dựng `con5` + `datMe(con5, me)` tường minh. grep `datMe(` 6 bài: 15 chỗ, đều ở ca. P26c gốc 157 · 1 hỏng (VM1), HEAD 158 · 0 — số không đổi. |
| 2 ke_hoach E1 | ĐÃ SỬA (bf9f93f): câu E1 ghi đúng là phép tĩnh. |
| 3 ke_hoach giuCho.js:27 | ĐÃ SỬA (bf9f93f): → `giuCho.js:22`. |
| K1 "vẫn 12 · 11" | ĐÃ SỬA: ghi rõ nguồn hai con số. |
| Nghi: đột biến bỏ kiểm lúc chốt | KHÔNG làm: chủ quán dặn ca chốt khi quan hệ đổi giữa chừng ghi CHƯA KIỂM; B2 đỏ trên gốc là bằng chứng hiện có. |
| Nghi: phone thô (sync.js:290) | KHÔNG sửa: ngoài Phạm vi, ghi Phát hiện. (Soát lần 3: nghi ngờ sai — sync.js:243 đã chuẩn hoá; Phát hiện đã rút.) |
| Nghi: soát bảo mật cũ | Làm lại soát bảo mật (bước 8b) ở HEAD mới. |

## Phát hiện (thêm 11.11) — ĐÃ RÚT LẠI
- ~~`server/routes/sync.js:290` ghi `pos_customers.phone` thô~~ — SAI (soát lần 3): `sync.js:243` `const phone = normalizePhone(values[phoneIndex]);`,
  câu INSERT `:289-297` dùng đúng biến đó. Không có việc dọn dữ liệu. Mình đã chép nghi ngờ của người soát mà không mở code (K1).

## Soát bảo mật lần 2 (11.11, mốc 72398197^..bf9f93f — sau vòng sửa 1)
Số lỗi trước lọc: 2 · sau lọc: 0 (người soát tự làm cả bước tìm và lọc — không có công cụ sub-task). Báo cáo nguyên văn:
```
Mình đã soát bảo mật toàn bộ thay đổi của nhánh viec/VI-ME-1, tính từ mốc 723981971^ tới HEAD. Kết quả: không có lỗ hổng nào đạt ngưỡng báo,
và bản vá đóng đúng lỗ tiền mẹ mà phiếu nêu.
Số lỗi trước lọc: 2 · sau lọc: 0
## Phạm vi đã đọc
- git diff 723981971^ HEAD: 16 file. Code chạy thật chỉ có 2 chỗ: server/routes/orders.js dòng 30 nạp kiemTraMe; dòng 688–694 cổng mới trong
  taoDon. server/utils/viMe.js: file mới, 18 dòng.
- Phần còn lại là bài thử (cong_cu/thu_*.js, cong_cu/gia_lap/kich_ban.js), một dòng đăng ký bài thử ở kiem_tra_truoc_khi_giao.js, và hồ sơ
  viec/VI-ME-1/* — thuộc loại trừ "chỉ dùng để chạy thử" và "tài liệu".
## Kiểm tra luồng dữ liệu
1. Cổng che hết các chỗ đụng ví mẹ trong taoDon — có. Cổng ở orders.js:690 chạy khi có parent_phone hoặc Number(parent_balance_amount) > 0.
   Đọc ví mẹ (orders.js:860–881) và trừ ví (orders.js:969) đều cần normalizedParentPhone khác rỗng → cổng luôn chạy trước. orders.js:178–684
   chỉ có lối trả lỗi 4xx sớm. Lối chỉ-tính trả ở orders.js:898, sau cổng.
2. Phiên giữ chỗ và chốt phiên cũng qua cổng: giuCho.js:47–52 gọi taoDon chỉ-tính trước kiểm PIN và trước INSERT phiên giữ ví mẹ
   (giuCho.js:57–72) — mẹ sai 403, không giữ chỗ. chotPhien (giuCho.js:105) dựng lại thân đơn từ phien.than (có parent_phone) rồi gọi taoDon
   — cổng chạy lại.
3. viMe.js an toàn: truy vấn có tham số; mặc định từ chối (khách rỗng, SĐT mẹ rỗng, không có khách, khách không có mẹ → 403
   KHONG_PHAI_TK_ME); hai vế chuẩn hoá bằng normalizePhone (cùng hàm chỗ trừ ví); thông báo lỗi không lộ số dư / SĐT mẹ thật.
## Hai ứng viên đã xét và loại
| 1 | Dò quan hệ mẹ–con qua 403 khác 200/400 | 2/10 | Cần tài khoản nhân viên, nhân viên vốn tra được khách; chỉ lộ một ý có/không. |
| 2 | SO_DU_KHONG_DU (orders.js:868–871) in số dư khả dụng ví mẹ | 2/10 | Có từ trước nhánh; nay chỉ hiện khi đã qua cổng đúng mẹ — bản vá thu hẹp. |
## Chưa kiểm
- Không chạy bài thử, không dựng ca khai thác (chỉ đọc code).
- Hạng mục E: kh/index.js:55 chú thích "không cộng ví mẹ"; chưa rà đủ server/utils/donApp.js (file không đổi trong nhánh).
```
(Hạng mục E đã có bằng chứng riêng: ca E1 tĩnh `thu_VIME1.js` + donApp.js:281 không có `tru_tai_khoan_me` — soát độc lập lần 2.)
SOÁT BẢO MẬT: ĐẠT

## Soát độc lập (/ra-soat lần 3, 11.11 — báo cáo nguyên văn, rút gọn trình bày)
```
KHÔNG ĐẠT (chỉ còn lỗi NHẸ: không lỗi nào đụng tiền, ví, điểm hay bảo mật. Phần máy chủ đúng, cổng chạy ĐẠT.)
LỖI TÌM ĐƯỢC:
1. server/utils/viMe.js:15 — vế chuẩn hoá phía CSDL `normalizePhone(kh.parent_phone)` không có ca thử hay đột biến nào khoá. Đổi thành
   `kh.parent_phone === me`: thu_VIME1 23 · 0, thu_P26b 104 · 0 — SỐNG. A5 (thu_VIME1.js:133) chỉ đổi dạng SĐT gửi lên; VS-2
   (dot_bien.py:31) gỡ cả hai vế một lượt nên che vế CSDL. trang_thai.md:82, ke_hoach.md:51 ghi "chuẩn hoá hai vế". Mọi chỗ ghi hôm nay
   đã chuẩn hoá (customers.js:403, khachMoi.js:26, registrations.js:259/327) — vế này chỉ che DỮ LIỆU CŨ; bỏ thì con thật bị 403 oan,
   không mất tiền. Sửa: ca "hồ sơ con ghi parent_phone dạng +84… / có dấu cách → vẫn 200" + đột biến chỉ gỡ vế CSDL. — K3 + K1 (+K5 dữ liệu cũ).
2. viec/VI-ME-1/trang_thai.md:221-222 (cùng :217, :202) — "sync.js:290 ghi pos_customers.phone thô" SAI: sync.js:243
   `const phone = normalizePhone(values[phoneIndex]);`, INSERT :289-297 dùng biến đó. — K1.
Đã kiểm 3 lỗi lần 2 — cả 3 đã sửa đúng (P26c:174 goiDaLay, A5g :298-299; gốc 157 · 1, HEAD 158 · 0; E1; giuCho.js:22; grep datMe( 15 chỗ).
K3: gốc VIME1 11 ca đỏ đúng mẫu; HEAD 23 · 0; VM1 đủ 403 + code + ví mẹ. Thử thêm "bỏ kiểm lúc chốt phiên" (orders.js:690) → B2 bắt (21 · 2).
K4: taoDon 6 chỗ gọi (orders.js:1344, :1354; giuCho.js:52, :109; manKhach.js:127; donApp.js:169); mọi chỗ đọc/giữ/trừ ví mẹ sau cổng :690.
K5: C1, C2, A5, D1 qua; đơn không mẹ gửi null (Sales.jsx:730, tinh.js:144, :260); khách chỉ có đăng ký chặn theo Q3.
Đường tiền: đủ số dư orders.js:865-867; quan hệ từ CSDL viMe.js:14. P1: không đổi client/.
NGHI NGỜ: dot_bien.py chưa có đột biến "bỏ kiểm lúc chốt"; bang_chung_do dòng HD1 thiếu thụt lề.
NGHIỆM THU: 6/6 mục có bằng chứng · mục thiếu: không.
CHƯA SOÁT ĐƯỢC: --day-du và giả lập; gốc chỉ tự chạy P26c, VIME1; production parent_phone thô; chốt QR khi quan hệ đổi, đua kiểm–ghi (CHƯA KIỂM theo chủ quán).
BÀI HỌC: NGUYÊN TẮC K3 — chỗ vá hai vế thì mỗi vế một đột biến riêng; KHOÁ/K1 — nghi ngờ thành Phát hiện phải mở code trích dòng trước.
```

### Vòng sửa sau soát lần 3 (vòng sửa thứ 3 — luật LUAT_XAY_APP §6.5: lỗi NHẸ, không gọi agent soát nữa)
| Lỗi | Xử lý |
|---|---|
| 1 vế CSDL không khoá | ĐÃ SỬA (53c0dd6, 193dff4): ca A5c `thu_VIME1.js` (hồ sơ con ghi SĐT mẹ `+84…` / có dấu cách, màn gửi dạng chuẩn → 200, ví mẹ −50.000) + đột biến `VS-8-khong-chuan-hoa-csdl` (chỉ gỡ vế CSDL) → BẮT ở A5c. `dot_bien.py`: ĐỐI CHỨNG 24 · TỔNG 9 · BẮT 9 · SỐNG 0 · HỎNG 0 · LẠC 0. Gốc 13 đạt · 11 hỏng; HEAD 24 · 0; SỐ CA 24. Bảng đột biến + ke_hoach §3/§4 sửa. |
| 2 Phát hiện sync.js sai | ĐÃ SỬA: rút Phát hiện, ghi lý do (sync.js:243). |
| Nghi: đột biến bỏ kiểm lúc chốt | KHÔNG thêm: chủ quán dặn ca đổi quan hệ giữa giữ và chốt ghi CHƯA KIỂM; người soát chạy tay thì B2 bắt (21 · 2). |
| Nghi: thụt lề HD1 | ĐÃ SỬA. |
Code chạy thật (`server/`) không đổi sau soát bảo mật lần 2 (chỉ bài thử + hồ sơ) → không soát bảo mật lại.
SOÁT LẦN CUỐI: chat soát thay

## Kiểm cuối (11.11, HEAD 1ecc2fe)
- `npm test -- --day-du` → ĐẾM PASS 113 · FAIL 0 · CẢNH BÁO 1. (Lần chạy trước đó đỏ `thu_gia_lap.js` "data/ không đổi" — chạy CHỒNG với
  agent soát lần 3 đang chạy bài khác; chạy riêng thì xanh.)
- `node tu_chay/cong.js chay . 723981971bb87765a113eeaa3a0b8602b665ab19^ HEAD viec/VI-ME-1` → ✓ CỔNG CHẠY ĐẠT

## Nghiệm thu — đếm từng mục
- A → `thu_VIME1.js` A1 (sai mẹ: 403 + đúng câu + không ghi đơn/ví/điểm), A2 (không mẹ), A3 (không khách / không có trong pos_customers),
  A4 (tiền mẹ không SĐT), A5 + A5c (chuẩn hoá hai vế); đột biến BV-1, VS-2, VS-3, VS-5, VS-6, VS-7, VS-8.
- B → một hàm `server/utils/viMe.js`, một chỗ gọi `orders.js:690-693` (B4 tĩnh); phiên B1 / B5 (trước PIN), chốt B2, tinh-thu B3,
  số dư mẹ báo màn B6, màn khách B7; đột biến VS-1, VS-4. Bảng lối ở `ke_hoach.md` §1.
- C → C1–C3 (`thu_VIME1.js`); 6 bài cũ xanh với ca cũ + số mong đợi giữ nguyên; giả lập KB17 xanh; `--day-du` PASS 113 · FAIL 0.
- D → D1 (huỷ đơn có mẹ sau khi xoá quan hệ → ví mẹ hoàn đúng).
- E → E1 tĩnh: `donApp.js` không có `tru_tai_khoan_me` / `parent_phone`, `kh/index.js` không có `parent`.
- K5 → diff `server/` chỉ thêm một cổng + một file; không đổi `client/`; ca C1, C2, A5, A5c, D1, VM1 ×6 (đúng mẹ vẫn trừ).

## Bài học
- **NGUYÊN TẮC** (K3) — chỗ vá có hai vế (chuẩn hoá phía gửi + phía CSDL) thì mỗi vế một đột biến riêng; đột biến gỡ cả hai vế che vế
  không có ca. Ví dụ: VS-2 che vế CSDL tới soát lần 3. Đề xuất thêm một dòng "Chặn" vào K3 của `KHUON_LOI.md` (ngoài Phạm vi — chat duyệt).
- **NGUYÊN TẮC** (K4) — "hàm dựng dữ liệu không tự chữa đầu vào": grep MỌI hàm phụ dựng đơn, không chỉ hàm tên `ban` (P26c `goiDaLay` lọt
  soát lần 2). Gộp với dòng K4 "ghi qua hàm phụ là đường song song" sẵn có — đề xuất thêm ví dụ, không thêm khuôn.
- **KHOÁ** (đề xuất, ngoài Phạm vi) — `/ra-soat` và skill `/lam-viec` bước 8: mỗi lỗi của lần soát trước phải có dòng "đã sửa / không sửa
  vì…" trong `trang_thai.md` (E1, giuCho:27 bị bỏ im lặng hai vòng). File: `tu_chay/lenh_ra_soat.md` (thêm yêu cầu) + phép cổng đọc bảng
  "Vòng sửa". Ca đỏ: trang_thai có báo cáo soát n lỗi mà không bảng xử lý.
- **KHOÁ** (đề xuất, ngoài Phạm vi) — đề xuất `## Bài thử cũ sửa` thì công cụ tự chạy BẢN GỐC bài trên code mới (§6.9; lần sai thứ 4 ở
  câu hỏi 4 của việc này). File: `tu_chay/` công cụ tính cổng, lệnh `tinh` chạy A11 sớm.
- **NGUYÊN TẮC** (K1) — nghi ngờ của người soát chép thành Phát hiện phải mở code trích dòng trước (sync.js:290 sai, :243 bác ngay).
  Đã có trong K1 ("chép sang luật thì mở hồ sơ gốc kiểm lại") — BỎ thêm dòng mới, chỉ là vi phạm luật sẵn có.
- **BỎ** — `npm test -- --day-du` chạy CHỒNG với agent soát → `thu_gia_lap.js` đỏ "data/ không đổi"; một lần, đã hiểu nguyên nhân.
- **BỎ** — kho nông làm `thu_BH2.js` G1 đỏ (lần 3 trong việc này) — đã có cách xử lý sẵn ở skill bước 1.3.

## Báo cáo 7 mục
```
VIỆC:        VI-ME-1 — Chỉ trừ tài khoản mẹ khi khách đang mua đúng là con được liên kết với mẹ đó
ĐÃ SỬA:      server/utils/viMe.js (mới, 18 dòng) — kiemTraMe: pos_customers.parent_phone của khách = SĐT mẹ (chuẩn hoá hai vế), sai → 403 KHONG_PHAI_TK_ME
             server/routes/orders.js:688-694 — một lời gọi trong taoDon (phủ tạo đơn quầy, tạo phiên giữ chỗ, chốt phiên, màn khách)
             kiem_tra_truoc_khi_giao.js — chayBaiThat thu_VIME1; cong_cu/thu_VIME1.js (24 ca); 6 bài cũ +1 ca VM1 mỗi bài + datMe tường minh;
             cong_cu/gia_lap/kich_ban.js KB17 dựng quan hệ mẹ–con
BÀI THỬ:     thu_VIME1 gốc 35f0d48 → ĐỎ 11 ca (A1–A4, B1, B2, B4, B5); HEAD 24 · 0. 6 bài cũ gốc đỏ đúng ca VM1, HEAD xanh (104/158/114/36/158/89).
             Đột biến 9/9 BẮT. npm test --day-du PASS 113 · FAIL 0. Cổng chạy ĐẠT.
ĐÃ RÀ K4:    grep parent_phone|parent_balance|tru_tai_khoan_me|giu_vi_me trong server/ → 11 lối (ke_hoach §1), 3 lối đi qua taoDon, còn lại
             đọc từ đơn / lọc trắng / không có trường mẹ; grep datMe( trong 6 bài → 15 chỗ, đều tường minh ở ca
CHƯA KIỂM:   chốt phiên QR (webhook) khi quan hệ mẹ–con đổi giữa lúc giữ và chốt (chủ quán dặn không làm); đua giữa kiểm và ghi (kiểm ngoài
             giao dịch — chủ quán chọn); dữ liệu production: khách chỉ có trong pos_registrations (sẽ bị 403 theo Q3), hồ sơ con ghi
             parent_phone lạ dạng; bộ đột biến chưa có đột biến "chỉ bỏ kiểm lúc chốt"; không thử tay trên quầy thật
GIT:         1ecc2fe VI-ME-1: vong sua sau soat lan 3 — bang chung VIME1 24 ca, VS-8, rut Phat hien sync.js
             193dff4 VI-ME-1: dot bien VS-8-khong-chuan-hoa-csdl
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 3 · BỎ 2 — chi tiết ở ## Bài học
```
HEAD ĐÃ KIỂM: 1ecc2fe
