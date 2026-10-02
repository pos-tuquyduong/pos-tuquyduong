# P26a — Trạng thái

## Bản chụp lúc bắt đầu (02.10.2026)

```
$ git branch --show-current
viec/P26a
$ git log --oneline -3
604bcd5 PHIEU: P26a
3b1b9bc TIEN-DO: TU-CHAY-4 xong (ba274cd), them P26a P26b HOC-2, ghi quyet dinh 02.10
ba274cd Merge pull request #6 from pos-tuquyduong/viec/TU-CHAY-4
```

## Tiến độ

- [x] Bước 1 đối chiếu bản chụp
- [x] Bước 2 đọc phiếu, CLAUDE.md, KHUON_LOI.md, code thật (database.js, 4 route dính, thu_P20, giả lập, bộ kiểm)
- [x] Bước 3 kế hoạch `ke_hoach.md` + soát độc lập (ĐẠT, 4 lệch nhỏ đã sửa)
- [ ] **DỪNG — phiếu dặn chờ chủ quán duyệt kế hoạch.** Bước 4 trở đi làm sau khi duyệt (`/lam-viec P26a tiep`).

## Phát hiện

- `server/routes/refunds.js:113-119`: kiểm "đã có yêu cầu hoàn tiền pending" nằm NGOÀI giao dịch, không có ràng buộc
  duy nhất → hai lệnh `POST /refunds` chồng nhau có thể tạo hai yêu cầu cho một đơn. Ngoài phạm vi (routes/ bị cấm).
- `cong_cu/gia_lap/bat_bien.js:21`: chú thích hẹn KB12 sẽ phủ nhánh `refunded` của I1 — cần cập nhật khi KB12 vào. Ngoài phạm vi.
- Phiếu A2 gọi `tiers.js` là route "đã tự bọc Number()", nhưng `tiers.js:88` không trả id nào; kế hoạch giữ ca `PUT /tiers`
  → 200 và thêm `POST /rewards` (rewards.js:49) làm ca A2 đúng nghĩa.

## Câu hỏi

(chưa có — chờ duyệt kế hoạch)
