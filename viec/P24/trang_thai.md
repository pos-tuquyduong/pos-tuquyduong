# P24 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: `viec/P24` · cây sạch · `git fetch origin viec/P24` xong.
- HEAD `4c6e0ce` · FETCH_HEAD `4c6e0ce` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  4c6e0ce PHIEU: P24
  99f5894 TIEN-DO: P22-23 (c4fabcd), KH-QUAY-1 (168b481), P15-QR (423624b), KH-UI-1 (bd9b920) xong; DAC_TA_BAN_HANG_2410 + demo; mo QUAY-AN-1 + P24 + P3; them DIEM-THAT-1, UUDAI-1, TOPPING-1, BH-1, HD-1, KH-MUA-1, KH-UI-2; P13a-e + P14 gop; DON-DEP-v1 -> DONDEP-v1; lich — so v39
  bd9b920 Merge pull request #41 from pos-tuquyduong/viec/KH-UI-1
  ```

## Tiến độ
- Bước 2 (đọc) xong · Bước 3 kế hoạch `ke_hoach.md` xong, agent phụ đã soát (4 câu) và đã đưa vào kế hoạch.
- Dừng chờ duyệt kế hoạch → chủ quán duyệt 24.10 (`bdc530a`, phiếu mục "Đã duyệt": G-a, E-a, D có + signup-codes.js, rollback).

## Làm tiếp (`/lam-viec P24 tiep`)
- Đối chiếu: nhánh `viec/P24`, cây sạch; HEAD `bdc530a` · FETCH_HEAD `bdc530a` (hook mở phiên đã kéo `4bf6b9f → bdc530a`).
  ```
  bdc530a PHIEU: P24 duyet ke hoach 24.10 (G-a, E-a, D co + signup-codes.js, rollback khi loi ghi)
  4bf6b9f P24: ke hoach + trang thai — cho chu quan duyet
  4c6e0ce PHIEU: P24
  ```
- Bước 4: `cong_cu/thu_P24.js` đỏ trên gốc (11 đạt · 22 hỏng) — `bang_chung_do.txt`.
- Bước 5: vá `orders.js` (`truDiemDon` + 2 chỗ gọi), `signup-codes.js` (câu chiếm mã + `baoChiemHong`), `bat_bien.js` (I8),
  `kich_ban.js` (KB5), bài cũ `thu_P2223.js` F3, `thu_gia_lap.js` (+8 ca I8), `thu_DOISOAT1.js` F3/F3c, `kiem_tra_truoc_khi_giao.js`.
- Bước 6: `npm test` PASS 70 · `--day-du` PASS 74 · FAIL 0 (cảnh báo GET-ghi có sẵn).

## Chỗ vá → đột biến (`viec/P24/dot_bien.py`, 18/18 BẮT, đối chứng xanh)
| Chỗ vá | Đột biến |
|---|---|
| `orders.js` gọi `truDiemDon` trong huỷ | BV-xoa-cau-tru-huy · VS-try-catch · VS-tru-sau-commit |
| `orders.js` gọi `truDiemDon` trong xoá | BV-xoa-cau-tru-xoa |
| `orders.js` câu `INSERT … SELECT` của `truDiemDon` | VS-tru-duong · VS-tru-sdt-cua-don · VS-bo-not-exists · VS-bo-han · VS-gom-theo-sdt · VS-gom-tung-dong |
| `signup-codes.js` câu chiếm mã `AND EXISTS … 'completed'` | BV-nhan-diem-bo-exists |
| `signup-codes.js` `baoChiemHong(…, dong)` | VS-bao-chiem-hong-cu |
| `bat_bien.js` I8 đơn huỷ = 0 | BV-I8-huy |
| `bat_bien.js` mốc `HUY_TRU_DIEM_TU` | VS-I8-moc-ca-gia-lap · VS-I8-moc-nguoc · VS-I8-tha-don-huy-tao-truoc-moc |
| `bat_bien.js` `adjust` gắn đơn không "lạ" | BV-I8-adjust-la · VS-I8-adjust-moi-dong |

## Câu hỏi
1. **G — `DELETE /:id` đơn còn `completed` có điểm:** (a) trừ điểm như huỷ, dùng chung hàm `truDiemDon` — đề xuất; (b) chặn xoá,
   400 `DON_CO_DIEM`, bắt huỷ trước.
2. **E — dòng `earn` đã hết hạn lúc huỷ:** (a) dòng trừ chép đúng hạn → đã hết hạn theo → số dư không đổi — đề xuất; (b) dòng trừ
   không hạn → trừ cả điểm khách đã mất do hết hạn (mất hai lần).
3. **D — lỗ đua huỷ chen giữa lúc nhận điểm mã bill:** `kiemDonCuaMa` đọc ngoài giao dịch (`signup-codes.js:197`), câu ghi
   (`:278–288`) không kiểm lại đơn → đơn đã huỷ vẫn nhận `earn` mà không có dòng trừ. Vá cần thêm `server/routes/signup-codes.js` vào
   `## Phạm vi` của phiếu (~8 dòng: câu chiếm mã + `baoChiemHong` trả `DON_DA_HUY`). Đề xuất: có.
4. **Lỗi ghi dòng trừ khi huỷ:** (a) rollback cả lệnh huỷ — đề xuất (sổ điểm luôn cân); (b) bọc try/catch như lúc cộng điểm (huỷ
   luôn được, điểm lệch I8 tới khi sửa tay).
5. **Mốc I8:** `HUY_TRU_DIEM_TU = '2026-10-25'` ghi tạm — chat sửa đúng ngày gộp + 1 lúc duyệt PR.

## Phát hiện (ngoài phạm vi, không sửa)
- `server/utils/doiSoat.js:118` `tongHop`: "điểm trừ" cộng mọi dòng âm → dòng trừ do huỷ đơn lẫn với đổi quà trong tổng Đối soát.
- Hoàn tiền trọn (`refunds.js:158`) và hoàn một phần (báo hỏng, `damages.js`) đều GIỮ điểm của đơn — để việc sau (NT-I).
