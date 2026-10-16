# P20c — kế hoạch v1 (CHỜ DUYỆT — chưa viết bài thử, chưa sửa code)

Số dòng dưới đây đọc trong lượt này trên HEAD `2353fe9` (= main `0ee7346` + sổ việc v34 `783a1dd` + `PHIEU: P20c`).

## 0. Phát hiện làm đổi cách viết — chuỗi SQL chiếm mã đang bị NEO ở file Cấm / ngoài Phạm vi

Phiếu A1/A2 thêm `AND NOT EXISTS (...)` vào câu UPDATE chiếm mã. Nhưng NGUYÊN chuỗi của hai câu đó đang bị phép tĩnh và đột biến cũ neo:

| Nơi neo (không sửa được trong việc này) | Neo | Chèn `NOT EXISTS` vào GIỮA / CUỐI chuỗi thì |
|---|---|---|
| `kiem_tra_truoc_khi_giao.js:446` (Cấm) regex /claim | `…\bAND\s+claimed_at\s+IS\s+NULL\s*['\`]` — chuỗi phải KẾT THÚC ở `IS NULL` + dấu nháy | ✗ "/claim: chiếm mã…" → `npm test` đỏ |
| `kiem_tra_truoc_khi_giao.js:463` (Cấm) regex /nhan-diem | `…\bAND\s+diem_nhan_luc\s+IS\s+NULL\s*['\`]` | ✗ "/nhan-diem: chiếm mã…" |
| `cong_cu/thu_gia_lap.js:128` (Cấm) M5 | `'WHERE id = ? AND diem_nhan_luc IS NULL'` khớp đúng 1 lần | M5 không áp được → `--day-du` đỏ |
| `viec/AUDIT-1/dot_bien.py:111–112` (ngoài Phạm vi) D1-E-claim-chiem, D1-E-ndiem-chiem | `'SET claimed_at = ?, claimed_phone = ? WHERE id = ? AND claimed_at IS NULL'`, `'WHERE id = ? AND diem_nhan_luc IS NULL'` | đột biến LẠC |
| `viec/AUDIT-2/dot_bien.py:91–92` (ngoài Phạm vi) BK-KB11-* | `"WHERE id = ? AND claimed_at IS NULL'"`, ``'WHERE id = ? AND diem_nhan_luc IS NULL`'`` — có cả DẤU NHÁY ĐÓNG | đột biến LẠC |

Phiếu A6 cho "neo rữa → neo lại", nhưng mọi file neo đều nằm ngoài Phạm vi. → **Giữ nguyên chuỗi cũ, NỐI phần chặn SĐT ngay sau dấu nháy đóng**
(`'… AND claimed_at IS NULL' + ' AND NOT EXISTS (…)'`). SQL chạy y như chèn thẳng; mọi neo trên còn khớp đúng 1 lần, không cần neo lại.
Đột biến cũ "bỏ `AND … IS NULL`" vẫn phải BẮT: chạy lại ở bước 6 (mục 5).

## 1. A1 — /claim: chặn SĐT trong câu chiếm mã

Code hiện tại: phép kiểm SĐT NGOÀI giao dịch `signup-codes.js:329–335`; chiếm mã `:384–391` (`changes !== 1` → 409 `MA_DA_DUNG`).

| | **A: `NOT EXISTS` nối sau chuỗi cũ (chọn)** | B: `SELECT` SĐT trong giao dịch, trước UPDATE |
|---|---|---|
| sửa | `:385` + 1 dòng nối `' AND NOT EXISTS (SELECT 1 FROM pos_signup_codes WHERE claimed_phone = ? AND id <> ?)'`, tham số + `phone, signupRow.id` | +6 dòng `tx.queryOne` + `if` |
| đúng khi | luôn: một câu lệnh, SQLite tự khoá ghi khi chạy nó | chỉ khi giao dịch là `BEGIN IMMEDIATE` (`database.js:1374` `transaction("write")`) — đúng hôm nay, nhưng đổi chế độ là lỗ lại |
| khớp quyết định chủ quán | đúng chữ "kiểm NGAY trong câu UPDATE" | lệch |

**Chọn A.** Giữ phép kiểm sớm `:329` (lời báo đẹp, cùng biểu thức `claimed_phone = phone` đã chuẩn hoá — SO-LUONG-1).

**Lời báo khi `changes = 0`** — giờ có HAI lý do: mã vừa bị người khác chiếm, hoặc SĐT vừa claim qua mã KHÁC.

| | **A: đọc lại dòng sau rollback để báo đúng lý do (chọn)** | B: một mã lỗi `MA_DA_DUNG` 409 cho cả hai |
|---|---|---|
| dòng | +1 hàm phụ dùng chung hai route ~10 dòng | 0 |
| ca A1 (cùng SĐT, hai mã) | người thua nhận 400 `SDT_DA_NHAN` — đúng sự thật | người thua nhận "Mã này vừa được sử dụng" cho một mã CHƯA ai dùng — sai lời báo đúng ở ca phiếu đòi |

**Chọn A** (nhiều dòng hơn vì B báo sai đúng ca nghiệm thu). Hàm phụ đặt cạnh `kiemDonCuaMa`, gọi NGAY sau `await tx.rollback();` để phép
tĩnh `kiem_tra_truoc_khi_giao.js:452` / `:466` (`{ await tx.rollback(); return …`) còn khớp — viết ĐÚNG dạng `return baoChiemHong(…)`
(`await baoChiemHong(…); return;` làm regex đỏ):

```js
// Chiếm mã được 0 dòng: mã vừa bị chiếm, hoặc SĐT vừa nhận qua mã KHÁC (P20c). Đọc lại SAU rollback để báo đúng lý do.
async function baoChiemHong(res, id, cotLuc, daDung) {
  const d = await queryOne(`SELECT ${cotLuc} AS luc FROM pos_signup_codes WHERE id = ?`, [id]);
  if (!d) return res.status(404).json({ success: false, error: 'Mã không tồn tại' });
  if (d.luc) return res.status(daDung.status).json({ success: false, error: daDung.error, code: daDung.code });
  return res.status(400).json({ success: false, error: 'Số điện thoại này đã nhận ưu đãi này từ một mã bill khác.', code: 'SDT_DA_NHAN' });
}
```
(`cotLuc` chỉ nhận hằng `'claimed_at'` / `'diem_nhan_luc'` viết trong code, không lấy từ request.) Nhánh `!d`: P26c xoá mã chưa dùng khi xoá
đơn (`orders.js` `DELETE FROM pos_signup_codes WHERE order_id = ? AND claimed_at IS NULL AND diem_nhan_luc IS NULL`) — hôm nay nhánh đó báo nhầm "mã đã dùng".

## 2. A2 — /nhan-diem khi `chiLanDau`

Code hiện tại: kiểm SĐT ngoài giao dịch `:159–171`; chiếm mã `:246–258` (`changes === 0` → 400 `MA_DA_NHAN_DIEM`).

| | **A: một câu, cờ là tham số (chọn)** | B: nối chuỗi có điều kiện |
|---|---|---|
| sửa | `` `…WHERE id = ? AND diem_nhan_luc IS NULL` `` + `' AND (? = 0 OR NOT EXISTS (SELECT 1 FROM pos_signup_codes WHERE diem_nhan_phone = ? AND id <> ?))'`, tham số + `ch.chiLanDau ? 1 : 0, phone, dong.id` | `+ (ch.chiLanDau ? CHAN : '')` và mảng tham số cũng phải rẽ nhánh |
| dòng | +1, sửa 1 | +3 |

**Chọn A.** `changes = 0` → `baoChiemHong(res, dong.id, 'diem_nhan_luc', { status: 400, code: 'MA_DA_NHAN_DIEM', error: … })` — giữ đúng
mã lỗi hiện tại (xem Câu hỏi 1).

## 3. A3 — /:id/reset: kiểm `used_count` trong giao dịch

Code hiện tại: đọc voucher + chặn `used_count > 0` NGOÀI giao dịch `:465–473`; trong giao dịch UPDATE gỡ claimed `:477–480` rồi
`DELETE FROM pos_discount_codes WHERE code = ?` `:484` (không điều kiện).

Chữ phiếu: "`changes = 0` → rollback, 400". **Làm đúng chữ thì chặn nhầm một luồng hợp lệ (K5):** dòng đã claim mà KHÔNG có voucher cùng mã —
dữ liệu claim trước 09.08.2026 (voucher mang mã KHÁC, `signup-codes.js:9–12`) hoặc voucher bị xoá tay. Hôm nay reset vẫn chạy được (`:468`
`voucherRow && …` cho qua khi không có voucher). Nên:

| | **A: giữ phép đọc voucher ngoài giao dịch; DELETE có điều kiện + `changes` trong giao dịch (chọn — v1 sau soát)** | B: đúng chữ phiếu `changes = 0` → 400 |
|---|---|---|
| trong giao dịch | ĐẦU giao dịch: `const xoa = await tx.run('DELETE … WHERE code = ? AND used_count = 0')`; `if (voucherRow && xoa.changes === 0)` → rollback, 400 (lời báo cũ `:471`); rồi UPDATE gỡ claimed như cũ | `changes = 0` → 400 |
| dòng | ~+4 (giữ `:467–473` làm lời báo sớm; `voucherRow` có từ `:467`) | ~4 |
| voucher không tồn tại | `voucherRow` null → 200, gỡ claimed như hôm nay | **400 — chặn nhầm** |

**Chọn A.** Đổi thứ tự trong giao dịch: DELETE → kiểm → UPDATE (rollback không phải hoàn UPDATE). ~~Đủ vì voucher không thể XUẤT HIỆN
sau `:467` khi dòng signup đang claimed~~ — **SAI (soát vòng 1, K1):** hai lần hoàn tác chồng nhau + khách claim lại xen giữa (ca Z1 → H3d)
làm voucher mới xuất hiện; mã tay trùng chữ cũng tạo được (`discount-codes.js:195–215`). Bản vá sau soát: UPDATE gỡ claim lên ĐẦU giao dịch, gắn
đúng lần claim đã đọc (`AND claimed_at = ? AND claimed_phone = ?`), 0 dòng → 409; DELETE dùng `COALESCE(used_count, 0) = 0` (cùng nghĩa phép
kiểm ngoài với NULL — H3f). Bản nháp trước (xoá `:465–473`, thêm `tx.queryOne` hỏi "còn
voucher") dài gấp đôi — agent soát chỉ ra. Còn một cửa hẹp: voucher bị XOÁ TAY (`discount-codes.js:326`) đúng giữa `:467` và giao dịch →
400 thay vì 200; bấm lại là qua — chấp nhận, ghi CHƯA KIỂM.

## 4. A4 — mã lỗi

| Chỗ | Hôm nay | Sau |
|---|---|---|
| /claim `:316–318` mã đã claim (kiểm sớm) | 400, không `code` | **409 `MA_DA_DUNG`** — cùng `:390` |
| /claim `:333–335` SĐT đã claim (kiểm sớm) | 400, không `code` | **400 `SDT_DA_NHAN`** — cùng /nhan-diem `:168` |
| /claim `:388–391` chiếm 0 dòng | 409 `MA_DA_DUNG` | qua `baoChiemHong`: 409 `MA_DA_DUNG` hoặc 400 `SDT_DA_NHAN` |
| /nhan-diem `:139–145`, `:251–258` | 400 `MA_DA_NHAN_DIEM` (cả hai chỗ, ĐÃ thống nhất) | **giữ nguyên** — Câu hỏi 1 |

Ai đọc `code` / status: `client/src/` không gọi `/claim`, `/nhan-diem` (grep `signup-codes` trong `client/src`: chỉ `Settings.jsx:425` GET và
`:432` reset — đọc `data.error`, không đọc `code`). Người gọi `/claim` là App KH qua `X-Service-Key` (chưa có trong kho). Màn hình không đổi.

## 5. Bài thử — `cong_cu/thu_P20.js` thêm mục [H] (ánh xạ 1-1 nghiệm thu)

Race dựng bằng MÓC `mocTruocTx` đã có (`thu_P20.js:68–74`), KHÔNG dùng `Promise.all`: chú thích `:63–67` đã đo — `Promise.all` trên kho
cục bộ chạy tuần tự, người thứ hai bị phép kiểm sớm chặn, ca xanh cả trên gốc (K3). Móc cho ra race TẤT ĐỊNH (phiếu A1 cho phép cách thay thế, ghi rõ).

| Ca | Nghiệm thu | Dựng | Trên gốc | Sau vá |
|---|---|---|---|---|
| H1 | A1 | bill1, bill2 đã thu; SĐT P. Móc: claim(bill2, P) trọn vẹn. Ngoài: claim(bill1, P) đã qua kiểm sớm | ngoài 200, P có 2 dòng claimed, 2 voucher → **ĐỎ** | móc 200; ngoài 400 `SDT_DA_NHAN`; P đúng 1 dòng claimed; voucher bill1 = 0 |
| H2 | A2 | như H1 với /nhan-diem, `chiLanDau` mặc định (bật) | 2 dòng earn cho P → **ĐỎ** | ngoài 400 `SDT_DA_NHAN`; đúng 1 dòng earn của P; điểm = một lần |
| H2b | A2 · K5 | như H2, `nhandiem_chi_lan_dau = '0'` (đặt lại `'1'` sau ca) | xanh | cả hai 200, 2 dòng earn — chặn SĐT KHÔNG chạy khi tắt |
| H3 | A3 | claim bill đã thu. Móc (giữa kiểm sớm và giao dịch của reset): dùng voucher ở POST /orders THẬT (khuôn G4) → `used_count = 1` | reset 200, voucher MẤT → **ĐỎ** | reset 400; voucher còn, `used_count = 1`; dòng signup còn `claimed_at` |
| H3b | A3 · K5 | claim → reset voucher chưa dùng → claim LẠI cùng mã | xanh | 200, voucher bị xoá, gỡ claimed; claim lại 200 (lý do có DELETE `:481–483`) |
| H3c | A3 · K5 | claim rồi xoá tay dòng voucher (dữ liệu trước 09.08) → reset | xanh | 200, gỡ claimed |
| H4 | A4 | claim lại mã đã claim (tuần tự) · claim mã mới bằng SĐT đã claim · /nhan-diem bằng SĐT đã nhận | 400 không `code` ×2 → **ĐỎ** | 409 `MA_DA_DUNG` · 400 `SDT_DA_NHAN` · 400 `SDT_DA_NHAN` |
| H5 | A5 [c] · K5 | dòng signup `order_id` trỏ đơn không tồn tại → /claim và /nhan-diem | xanh | 404 `KHONG_THAY_DON` cả hai (ca hồi quy, phiếu đòi) |

Luồng hợp lệ phải KHÔNG bị chặn (K5): H2b (chiLanDau tắt), H3b, H3c, H5; ca [E]/[F] có sẵn — hai SĐT KHÁC nhau tranh CÙNG mã → vẫn
đúng `MA_DA_DUNG` 409 / `MA_DA_NHAN_DIEM` 400 (đường `baoChiemHong` nhánh `d.luc`); [D] — một mã, claim + nhận điểm bằng hai SĐT khác nhau
→ 200/200 (hai cột độc lập, `NOT EXISTS` chỉ soi cột của chính route). Cũng có: một SĐT claim mã A rồi nhận điểm mã B → không chặn nhau (~~H4 có~~ — SAI, soát vòng 1: H4 dùng hai SĐT khác nhau; thêm H4b).
Bài cả bài ĐỎ trên gốc (H1, H2, H3, H4) → không cần `## Bài thử cũ sửa`; H2b/H3b/H3c/H5 là ca K5 thêm vào cùng mục.

## 6. Đột biến — `viec/P20c/dot_bien.py` (khuôn `viec/P20b/dot_bien.py`), có đối chứng (bản không đột biến xanh)

| Chỗ vá | Đột biến | Ca phải BẮT |
|---|---|---|
| A1 | `BV-A1-bo-chan-sdt` gỡ dòng nối `NOT EXISTS` của /claim | H1 |
| A1 | `VS-A1-id-bang` `id <> ?` → `id = ?` (soi chính dòng mình — luôn qua) | H1 |
| A1/A4 | `VS-A1-mot-ma-loi` `baoChiemHong` bỏ nhánh SĐT (luôn báo mã đã dùng) | H1 (code) |
| A2 | `BV-A2-bo-chan-sdt` gỡ dòng nối của /nhan-diem | H2 |
| A2 | `VS-A2-bo-co` bỏ `? = 0 OR` (chặn cả khi tắt) — kèm bỏ tham số cờ | H2b |
| A3 | `BV-A3-bo-dieu-kien` `AND used_count = 0` → `''` | H3 |
| A3 | `VS-A3-changes-0-chan` bỏ vế `voucherRow &&` (chặn mọi `changes = 0` — đúng chữ phiếu) | H3c |
| A4 | `BV-A4-claim-bo-ma` `:317` trả lại 400 không `code` | H4 |

Đột biến cũ chạy lại trên HEAD (phiếu A6): AUDIT-1 nhóm D1 (8 tên neo `signup-codes.js`: `D1-E-trangthai-dungma`, `D1-E-danhsach-trang`,
`D1-E-claim-chiem`, `D1-E-ndiem-chiem`, `D1-E9-claim-kiem`, `D1-E9-ndiem-kiem`, `D1-E9-claim-dung`, `D1-E9-ndiem-dung`), AUDIT-2 `BK-KB11-claim-bo-chiem`,
`BK-KB11-nhandiem-bo-chiem`, P20b 4 tên, `thu_gia_lap.js` M2/M5 (qua `--day-du`). Mục tiêu: không neo nào rữa (mục 0). Rữa → ghi Câu hỏi, không tự neo lại file ngoài Phạm vi.
Chạy AUDIT-1 với `--json` thì đường ra đặt trong `viec/P20c/` (`viec/AUDIT-1/dot_bien.py:383, 408` ghi file JSON) — không ghi vào `viec/AUDIT-1/`.

## 7. Đường song song (K4) đã rà

- `grep -rn "claimed_phone\|diem_nhan_phone" server/` — chỉ `signup-codes.js` GHI hai cột; `orders.js:1142` chỉ ĐỌC (`claimed_phone`, quyết định có in mã
  lên bill không) — đọc thì không phải đường song song của phép chặn.
- `grep -rn "DELETE FROM pos_discount_codes" server/` → 2 chỗ: `signup-codes.js:484` (vá ở A3) và **`discount-codes.js:315–326` CÙNG KHUÔN**
  (kiểm `existing.used_count > 0` NGOÀI giao dịch rồi `DELETE … WHERE id = ?` không điều kiện). Ngoài Phạm vi → **Phát hiện**, không sửa;
  đề xuất: `DELETE … WHERE id = ? AND used_count = 0`, `changes = 0` → rơi về nhánh vô hiệu hoá. Đường này cũng là lý do ca H3c có thật
  (chủ quán xoá tay voucher chưa dùng ở màn Mã chiết khấu → dòng signup còn claimed mà không còn voucher).
- **Ngoài Phạm vi (Phát hiện, không sửa):** `orders.js:962–979` POST /orders đọc lại voucher trong giao dịch, `freshCode` null (voucher vừa bị
  reset xoá giữa lúc đọc ngoài giao dịch `:502–505` và giao dịch) → vẫn cho giảm giá, `UPDATE used_count` 0 dòng. Cửa sổ hẹp, chỉ khi chủ quán bấm
  hoàn tác đúng lúc khách dùng — ghi để chủ quán xét, đường tiền POST /orders thuộc file Cấm.
- [b] phép tĩnh E9 bị lừa bởi chuỗi trong chuỗi / `--` SQL: chỉ ghi ĐỀ XUẤT ở `trang_thai.md` (thêm phép mới, không nới phép cũ) — phiếu cấm sửa bộ kiểm.
- **Phát hiện (soát độc lập, ngoài mục tiêu — không sửa):** /nhan-diem đọc `daCong` (dòng earn lúc bán) NGOÀI giao dịch `:208–214` — nếu sau
  này điểm được cộng ở pay-debt (P22) chạy song song thì cộng bù lệch; /claim tra trùng `pos_discount_codes` NGOÀI giao dịch `:358–367` —
  race chỉ bị UNIQUE đỡ, ra 500 thay vì 409. Cả hai ghi vào `## Phát hiện`.
- `id <> ?` trong hai `NOT EXISTS` gần như không bao giờ có tác dụng (dòng đang chiếm có `claimed_at IS NULL` thì cột SĐT cũng NULL — chỉ
  `/reset` gỡ, và gỡ cả hai). Giữ vì phiếu ghi đúng chữ, rẻ, và đúng nếu sau này có đường gỡ một cột.
- A5 `kiemDonCuaMa` vẫn ngoài giao dịch (`:174`, `:339`) — CHƯA KIỂM, không sửa (P20b đã chốt).

## 8. Ngân sách

Code `signup-codes.js`: hàm phụ ~7, hai dòng nối + tham số, hai `code`, reset ~+4 → **~20 dòng đổi** (phiếu 30–50). Thử: mục [H] ~90 dòng
(phiếu ~80 — vượt nhẹ vì thêm H3c, ca K5 chặn đúng lỗ của cách làm theo chữ phiếu). `dot_bien.py` ~40 dòng.

## Câu hỏi cho chủ quán (cũng ghi ở `trang_thai.md`)

1. **A4 — /nhan-diem có đổi `MA_DA_NHAN_DIEM` 400 sang `MA_DA_DUNG` 409 không?** Phiếu ghi đổi (và ghi `:142` "không code" — đọc lại: `:143` ĐÃ có
   `code: 'MA_DA_NHAN_DIEM'`). Đổi thì đỏ `cong_cu/gia_lap/kich_ban.js:192` (Cấm: đòi `400 MA_DA_NHAN_DIEM`) và phải sửa ca [F] `thu_P20.js:243`.
   Đề xuất **giữ** `MA_DA_NHAN_DIEM`: hai chỗ trong /nhan-diem đã cùng một mã; "mã đã đổi voucher" và "mã đã nhận điểm" là hai sự việc khác
   nhau cho tới P20d (một mã còn dùng được cả hai). Muốn đổi → thêm `cong_cu/gia_lap/kich_ban.js` vào Phạm vi.
2. Duyệt ba chỗ lệch chữ phiếu: (a) nối chuỗi thay vì chèn (mục 0); (b) reset chặn theo "còn voucher" thay vì `changes = 0` (mục 3, ca H3c);
   (c) race dựng bằng móc thay `Promise.all` (mục 5).
