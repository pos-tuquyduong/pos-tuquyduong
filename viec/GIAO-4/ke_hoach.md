# GIAO-4 — kế hoạch (chờ chủ quán / chat duyệt)

Đọc trên `viec/GIAO-4` = `5563576` (cha `7da9ba9` = main của phiếu). Mọi số dòng dưới đây đọc trong lượt này.

## 0. Hiện trạng (code thật)

- `server/utils/ahamove.js:67-77` `baoPhi`: `phi = so(d.total_price ?? d.total_fee)`; chỉ ném `AHAMOVE_TU_CHOI` khi `km == null || phi == null`
  (dòng 74) → phí `0` / `-5000` / `"0"` **lọt qua**, trả `Math.round(phi)`. Chữ / rỗng → `so()` = null → đã bị chặn (502 `AHAMOVE_LOI`
  "Ahamove từ chối…") — GIỮ NGUYÊN.
- `aha.baoPhi` có đúng **2 chỗ gọi** (`grep -rn "baoPhi(" server` → `giaoHang.js:122`, `giaoHang.js:324`):
  - `giaoHang.js:113-130` `taoBaoPhi` — đường "Tính phí" của quầy (`POST /api/pos/giao-hang/bao-phi`, `routes/giao-hang.js:25`):
    ghi `pos_giao_bao_phi.phi = bp.phi` (dòng 125-126) rồi trả `phi` cho màn. **Đây là đường phí KHÁCH TRẢ.**
  - `giaoHang.js:324-326` `goiXe` — đường gọi xe, phí THẬT quán trả: đã xử lý phí 0 (`bp.phi > 0 ? bp.phi : null`, GIAO-3 C). **Cấm đổi.**
- Các grep khác của phiếu: `manKhach.js:139` / `routes/man-khach.js:40` là `baoPhien` (báo PHIÊN cho màn khách, không phải báo phí) — không
  đi qua Ahamove. `routes/orders.js:316-320,787,1106` chỉ ĐỌC báo phí đã lưu (`docBaoPhiDon`) và ghi chuyến — không hỏi Ahamove.
- App KH: `server/utils/donApp.js:109` `cach_nhan === 'giao'` → `CHUA_GIAO`; `donApp.js:223` `phi_giao: 0` — App KH chưa có đường giao,
  không gọi `taoBaoPhi`.
- Màn quầy: `KhungGiao.jsx:49-56` `tinhPhi` → `catch (e) { setLoi(e.message …) }`, `finally setDangTinh(false)`; nút "Tính phí" (dòng 87-90)
  hiện lại khi `!giao && !cho` và chỉ tắt khi `dangTinh` / chưa cài / thiếu địa chỉ. `api.js:102-111` `buildApiError` lấy `data.error` của
  thân JSON (502 có thân JSON nên không rơi vào nhánh "mất kết nối" dòng 104). POST mặc định KHÔNG tự gửi lại (`api.js` dòng ~169-181).
  → lời máy chủ hiện nguyên, bấm lại được. **Không sửa màn, không build** (A3).

## 1. Chỗ chặn (A1, A4)

| | Phương án | File · dòng | Rủi ro |
|---|---|---|---|
| **A (chọn)** | vị từ `phiHopLe` + chặn trong `taoBaoPhi`, ngay sau `aha.baoPhi`, TRƯỚC km và TRƯỚC `INSERT` | `giaoHang.js` ~+6 | không |
| B | chặn trong `aha.baoPhi` | `ahamove.js` ~+3 | đường gọi xe (`giaoHang.js:324`) cũng ném → gọi xe hỏng khi Ahamove báo 0 — **phạm Cấm + K5** (thu_GIAO3 C3 dòng 397-402 khoá đúng ca này) |

A là MỘT chỗ cho mọi đường lấy phí báo cho khách (chỉ `taoBaoPhi` tạo dòng `pos_giao_bao_phi`, `grep -rn "INSERT INTO pos_giao_bao_phi" server`
→ 1 chỗ). Code dự kiến (`giaoHang.js`):

```js
/** GIAO-4: phí báo cho KHÁCH chỉ nhận số nguyên > 0 — Ahamove báo 0 / âm (lỗi bên Ahamove) không thành "miễn phí giao" (chủ quán 19.11). */
const phiHopLe = (phi) => Number.isInteger(phi) && phi > 0;
...
    const bp = await aha.baoPhi(...);
    if (!phiHopLe(bp.phi)) {
      console.warn(`[GIAO] phi_0 total_price=${bp.phi_tho.total_price} total_fee=${bp.phi_tho.total_fee}`);
      return loi(502, 'AHAMOVE_PHI_0', 'Ahamove báo phí 0đ — bấm Tính phí lại (nếu lặp lại, gọi Ahamove kiểm tra)');
    }
```

`loi(502, …)` là cùng hàm dựng lỗi của `loiAhamove` (`giaoHang.js:43,92-93`) → cùng dạng `{ error, code }`, HTTP 502.
Mã MỚI `AHAMOVE_PHI_0` (phiếu chốt), không dùng lại `AHAMOVE_LOI` để màn / log phân biệt được.

## 2. Log (A2)

| | Phương án | Rủi ro |
|---|---|---|
| **A (chọn)** | `aha.baoPhi` trả thêm `phi_tho: { total_price: so(d.total_price), total_fee: so(d.total_fee) }` — CÙNG tên trường `tomChuyen` đang dùng (`ahamove.js:111`); `taoBaoPhi` in một dòng | +1 dòng `ahamove.js`; trường thêm không ai đọc ở đường gọi xe |
| B | chỉ in `bp.phi` | không đạt A2 (phiếu đòi `total_price=… total_fee=…`) |

Chỉ in hai số (đã qua `so()` → số hoặc `null`) — không địa chỉ, không SĐT, không mã báo phí.

## 3. Ngân sách

~8 dòng code (`giaoHang.js` +6, `ahamove.js` +1/−0) — dưới 20. Bài thử ~150 dòng (`thu_GIAO4.js` mới) + sửa `thu_GIAO3.js` (mục 5).
Không đổi `client/`, không `dist`, không DB, không `kiem_tra_truoc_khi_giao.js` trừ một dòng `chayBaiThat('cong_cu/thu_GIAO4.js')` (dòng ~514,
cùng khuôn GIAO1–3) để bộ kiểm chạy bài mới.

## 4. Bài thử `cong_cu/thu_GIAO4.js` (khuôn thu_GIAO3: máy chủ thật + kho thử + Ahamove giả qua `AHAMOVE_BASE_URL`)

Ahamove giả: `/v3/orders/estimates` trả `data: { distance: 3, ...A.phiBao }` (đặt được `total_price` / `total_fee` riêng, kể cả thiếu).

| Ca | Ánh xạ | Đầu vào Ahamove giả | Phải thấy |
|---|---|---|---|
| T1 | A1 | `total_price: 0` | 502 · `code AHAMOVE_PHI_0` · `error` ĐÚNG câu phiếu · số dòng `pos_giao_bao_phi` không đổi |
| T2 | A1 | `total_price: -5000` | như T1 |
| T3 | A1 | `total_price: "0"` | như T1 |
| T4 | A1 | thiếu `total_price`, `total_fee: 0` | như T1 |
| T5 | A1 | `total_price: 0`, `total_fee: 20000` | như T1 (`??` giữ 0 — không lấy total_fee thay; đúng "báo phí 0đ → chặn") |
| T6 | A2 | T1, T2, T4 | MỖI lần đúng 1 dòng `[GIAO] phi_0 total_price=0 total_fee=null` / `=-5000 …` / `=null total_fee=0`; không chứa địa chỉ / SĐT quán |
| K1 | K5 | `total_price: 1` | 200 · `phi 1` · dòng báo phí `phi = 1` · KHÔNG có log `phi_0` |
| K2 | K5 | `total_price: 15000` | 200 · `phi 15000` · dòng lưu `15000` |
| K3 | K5 | thiếu `total_price`, `total_fee: 20000` | 200 · `phi 20000` |
| K4 | K5 + A3 | T1 rồi bấm lại với 15000 | lần 2: 200 (máy chủ không khoá gì sau lỗi) |
| K5 | K5 | báo phí cũ 15000 đã lưu → `POST /orders` (tiền mặt) | đơn tạo, `shipping_fee = 15000`, chuyến `phi_khach = 15000` |
| K6 | K5 + Cấm | đơn K5, rồi Ahamove báo 0 lúc **gọi xe** | `goi-xe` 200, chuyến `tim_xe`, `phi_that` null (đường `giaoHang.js:324` không đổi) |
| K7 | K5 | sau T1–T5 | dòng `pos_giao_chuyen` của K5 không đổi (so trước / sau) |
| H1 | tiền: hai người cùng bấm | 2 lời `bao-phi` song song, Ahamove báo 0 | cả hai 502 `AHAMOVE_PHI_0`, 0 dòng mới |
| H2 | tiền: hai người cùng bấm | 2 lời song song, 15000 | cả hai 200, 2 mã báo phí KHÁC nhau |

A3 (màn): không sửa → bằng chứng là đọc dòng (mục 0) + thao tác thử tay (mục 7). A4: bảng mục 0 (chỉ `taoBaoPhi` tạo báo phí; App KH,
màn khách không có đường).

**Đỏ trên gốc `7da9ba9`:** T1–T6, H1 đỏ (gốc trả 200, có dòng báo phí, không log); K4 cũng đỏ trên gốc (lần bấm đầu phải ra AHAMOVE_PHI_0 —
sửa 26.11 theo bang_chung_do.txt, người soát bắt). K1–K3, K5–K7, H2 xanh cả hai phía (luồng phải KHÔNG bị chặn).

## 5. Bài thử cũ phải đổi — `cong_cu/thu_GIAO3.js`

`thu_GIAO3.js:397-399`: `A.phiBao = 0; A.phiTao = 0; moChuyen(false)` — `moChuyen` (dòng 249-259) gọi `POST /giao-hang/bao-phi` TRƯỚC,
nên sau vá báo phí ở quầy bị chặn → đơn không tạo → ca "C3 (K4) báo phí lúc gọi xe 0 …" đỏ. Đây là hành vi chủ quán ĐÃ DUYỆT đổi
(19.11 "Đồng ý chặn") → bài SỬA thường (LUAT §6.8), không vào `## Bài thử cũ sửa`:
- dời `A.phiBao = 0` xuống SAU `moChuyen(false)`, TRƯỚC `goi-xe` (ca vẫn thử đúng điều nó tên: báo phí LÚC GỌI XE = 0);
- bản mới vẫn xanh trên gốc → theo §6.9 thêm MỘT ca đỏ trên gốc vào thu_GIAO3: "C3 (GIAO-4) báo phí ở quầy 0 → 502 AHAMOVE_PHI_0" (2–3 dòng).
- `SỐ CA cong_cu/thu_GIAO3.js: <N>` vào `bang_chung_do.txt`.

Đã chạy trước: `grep -n "phi = 0\|phi: 0\|A.phi =\|total_fee" cong_cu/thu_GIAO1.js cong_cu/thu_GIAO2.js` → chỉ `A.phi = 30000/25000/21000` —
không ca nào báo phí 0 ở quầy → GIAO1, GIAO2 không đổi (sẽ chạy lại bằng `npm test` để chắc).

## 5b. Nghiệm thu cuối

`npm test` · `node kiem_tra_truoc_khi_giao.js --day-du` xanh · `node tu_chay/cong.js chay . 5563576^ HEAD viec/GIAO-4` ĐẠT — chép vào `trang_thai.md`.

## 5c. Soát kế hoạch (agent phụ chỉ đọc, 26.11)

Phạm vi / Cấm: không phạm. Cách ngắn hơn: chỉ bỏ được `Number.isInteger` (bp.phi luôn là số đã `Math.round`) — GIỮ vì phiếu đặt tên vị từ
"số nguyên > 0"; H1/H2 và vài đột biến thêm là tuỳ chọn, giữ (việc tiền). Ca thiếu: nghiệm thu cuối → đã thêm 5b; K7 → đã ghi rõ mục 7.
Đường song song sót: không (2 chỗ gọi `baoPhi`, 1 INSERT; `thu_VOUCHER2.js:520`, `thu_BOMANCU1.js:377` chèn dòng báo phí thẳng — không ảnh hưởng).

## 6. Đột biến `viec/GIAO-4/dot_bien.py` (khuôn `viec/GIAO-3/dot_bien.py`, có ĐỐI CHỨNG)

| Chỗ vá | Đột biến | Ca phải bắt |
|---|---|---|
| vị từ `> 0` | `VS-phi-0-lot` (`phi > 0` → `phi >= 0`) | T1 |
| vị từ âm | `VS-phi-am-lot` (`Number.isInteger(phi) && phi > 0` → `Number.isInteger(phi) && phi !== 0`) | T2 |
| khối chặn | `BV-bo-chan-phi-0` (gỡ cả khối `if`) | T1 |
| thứ tự | `VS-chan-sau-ghi` (khối chặn dời xuống sau `INSERT`) | T1 (số dòng báo phí) |
| chỗ chặn | `VS-chan-o-aha` (chặn trong `aha.baoPhi` thay vì `taoBaoPhi`) | K6 |
| log | `BV-bo-log-phi-0` (gỡ dòng `console.warn`) | T6 |
| log số thô | `BV-phi-tho` (gỡ `phi_tho` ở `ahamove.js`) | T6 (hoặc bài sập — LẠC thì đổi neo) |
| mã lỗi | `VS-ma-loi-cu` (`AHAMOVE_PHI_0` → `AHAMOVE_LOI`) | T1 |

## 7. Luồng hợp lệ phải KHÔNG bị chặn (K5) → ca

phí 1đ → K1 · phí 15.000đ → K2 · chỉ `total_fee` > 0 → K3 · bấm lại sau lỗi → K4 · báo phí cũ đã lưu > 0 dùng cho đơn → K5 · gọi xe báo 0 → K6
· đơn giao cũ không đổi → K7 trên kho thử; trên dữ liệu thật đủ bằng chứng vì bản vá không đổi cấu trúc DB và không thêm câu UPDATE / INSERT nào
(chỉ CHẶN trước câu INSERT sẵn có). Chốt phiên (`orders.js:319` `boQuaHan`) đọc dòng đã lưu — không
đi qua chỗ chặn.

Thử tay (chủ quán, điện thoại): (1) Bán hàng → Giao hàng → nhập địa chỉ → Tính phí: phí bình thường hiện như cũ. (2) Không giả được Ahamove
báo 0 trên quầy thật — chỉ máy kiểm (CHƯA KIỂM tay).

## 8. Đường song song đã rà (K4)

- `grep -rn "baoPhi(" server` → 2 chỗ (mục 0); chỉ `taoBaoPhi` cần chặn.
- `grep -rn "INSERT INTO pos_giao_bao_phi" server` → 1 chỗ (`giaoHang.js:125`).
- `phiDuong` (`ahamove.js:57`) là quy tắc phí CHUYẾN (0 = "chưa biết" → null) — khác nghĩa với phí khách (0 = chặn), không gộp.

## 9. Phát hiện (ngoài phạm vi, không sửa)

- Dòng `pos_giao_bao_phi` phí 0 tạo TRƯỚC khi vá (nếu có) vẫn dùng được trong 30 phút, và ở chốt phiên (`boQuaHan`) dùng được quá hạn.
  Không chặn ở `docBaoPhiDon`: tiền khách đã về ở chốt phiên (cùng lý do `orders.js:314-315`). Chủ quán muốn soát: `SELECT count(*) FROM
  pos_giao_bao_phi WHERE phi <= 0`.
