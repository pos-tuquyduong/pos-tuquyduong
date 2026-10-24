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
- **DỪNG chờ chủ quán duyệt kế hoạch** (phiếu: việc tiền). Chưa viết bài thử, chưa sửa code.

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
