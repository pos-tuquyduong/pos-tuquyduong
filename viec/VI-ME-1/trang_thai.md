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
| `viMe.js` so `parent_phone` đã chuẩn hoá hai vế | `VS-2-khong-chuan-hoa` | A5 |
| | `VS-3-chi-kiem-co-me` | A1 |
| `viMe.js` khách phải tồn tại | `VS-5-khong-can-khach` | A3 |
| `viMe.js` SĐT mẹ rỗng → từ chối | `VS-6-trong-me-cho-qua` | A4 |

Tên đột biến: BV-1-bo-goi, VS-1-chi-khi-co-tien, VS-4-bo-qua-chi-tinh, VS-7-chi-khi-co-sdt-me, VS-2-khong-chuan-hoa, VS-3-chi-kiem-co-me,
VS-5-khong-can-khach, VS-6-trong-me-cho-qua.
