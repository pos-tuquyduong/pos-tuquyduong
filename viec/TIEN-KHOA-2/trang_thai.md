# TIEN-KHOA-2 — trạng thái

## Bước 1 — đối chiếu bản chụp (19.11.2026)
- Nhánh: `viec/TIEN-KHOA-2` · cây sạch.
- `git fetch origin viec/TIEN-KHOA-2` → HEAD `e911762` · FETCH_HEAD `e911762` (bằng nhau — không kéo).
- `git log --oneline -3`:
  ```
  e911762 PHIEU: TIEN-KHOA-2 bit 3 loi doi tien khong qua PIN / QR (thu no chi tien mat, tranh vung KHO-3a)
  bc16e14 Merge pull request #100 from pos-tuquyduong/viec/BO-MAN-CU-1
  9cb1dbb BO-MAN-CU-1: cong chay DAT, HEAD DA KIEM 57cc4091
  ```
- Kho mây là kho nông → `npm test` đỏ ở `thu_BH2` G1 (thiếu commit `cbbb809`). Đã `git fetch -q --unshallow origin viec/TIEN-KHOA-2` →
  PASS 122 · FAIL 0 · CẢNH BÁO 1.

## Bước 2–3 — đọc, kế hoạch (19.11.2026)
- Đã đọc phiếu, CLAUDE.md, KHUON_LOI.md, sổ quyết định (`:89` mọi CK qua QR; `:171` xác nhận tay tiền về muộn), code vùng sửa (file:dòng ở
  `ke_hoach.md` mục 1).
- Agent chỉ đọc soát kế hoạch (4 câu) bắt: sót 9 chỗ bài cũ gọi `adjust` không PIN và 4 chỗ `pay-debt` CK (`thu_P21/P26c/DOISOAT1/DIEMTHAT1`);
  bài tĩnh `thu_BAO1a` / `thu_GIAODIEN1` phải giữ xanh; A3 chặn được ngay ở phần kiểm đầu vào (ngắn hơn); A4 giữ `cotTien` để không trôi neo đột biến
  `thu_gia_lap.js`; hạ `NGUONG_FETCH` lệch chữ phiếu; vế Đối soát không đạt nếu câu 2 bị từ chối. Đã sửa hết vào `ke_hoach.md` (mục 2, 3, 4, 7).
- Phiếu dặn "Chờ duyệt kế hoạch" → DỪNG ở bước 3.

## Câu hỏi
Năm câu ở `ke_hoach.md` mục 7, mỗi câu có đề xuất:
1. Thêm `cong_cu/gia_lap/kich_ban.js` vào Phạm vi (giả lập gọi đúng ba lối bị bịt — không sửa thì `npm test` đỏ) — bắt buộc.
2. Thêm `server/utils/doiSoat.js` vào Phạm vi để điều chỉnh ví và đổi cách trả hiện ở màn Đối soát (dòng CẦN XEM) — đề xuất đồng ý.
3. A3 chọn (a): chặn hẳn tiền mặt → chuyển khoản — đề xuất đồng ý.
4. A7.2 không thử tay được (không màn nào có nút đổi cách trả) → thay bằng ca máy — đề xuất đồng ý.
5. Cho hạ `NGUONG_FETCH` 22 → 21 sau khi bỏ fetch trần `Orders.jsx` — đề xuất đồng ý.

→ **Chủ quán 19.11 16:05: DUYỆT cả 5 câu.** Phạm vi thêm `server/utils/doiSoat.js` + `cong_cu/gia_lap/kich_ban.js` (commit 83694262).
doiSoat.js: chỉ THÊM phép `phepSuaTay` (khuôn `phepXacNhanTay`), khoá `AP_DUNG_TU.DC` và MỘT phần tử `['DC', phepSuaTay]` trong danh sách phép
của `chayDoiSoat` (bắt buộc để phép chạy) — không đụng log / hạn giờ / vòng chạy (DOISOAT-NHANH đang sửa phần đó).

## Bước 4–6 — bài thử, vá, kiểm (19.11)
- Bài mới `cong_cu/thu_TIENKHOA2.js` (29 ca): trên gốc 16 hỏng, sau vá 29/29. Bằng chứng: `bang_chung_do.txt`.
- Người gác chặn chạy bài chưa commit có cụm bí mật của bài thử (luật B-BIMAT-CHU) → commit bài trước rồi chạy (đúng luật skill).
- Bài cũ đỏ sau vá (npm test FAIL 9, đúng danh sách kế hoạch mục 4): sửa theo hành vi mới; 7 bài bản mới còn xanh trên gốc → thêm một ca hành vi mới
  mỗi bài (LUAT §6.9) — nay cả 10 bài đổi đỏ trên gốc.
- `thu_DOISOAT1` B0 "không dòng CẦN XEM nào" → nay đúng MỘT dòng DC của lần đổi B0g (chủ ý của chủ quán, A3 "ghi đối soát"); B3 CK 195.000 → 170.000.
- `thu_KHNAP1`: dòng "trừ tay" kiểu cũ (purchase không đơn) dựng thẳng vào sổ — giữ phủ nhánh dữ liệu cũ của `lichSuVi.js`.
- `npm test`: PASS 123 · FAIL 0 · CẢNH BÁO 1. `npm test -- --day-du`: PASS 127 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có sẵn từ trước).

### Chỗ vá → đột biến (`viec/TIEN-KHOA-2/dot_bien.py`, 21 / 21 BẮT, đối chứng xanh)
| Chỗ vá | Đột biến |
|---|---|
| wallets.js bỏ `/deduct` | BV-DEDUCT |
| api.js bỏ `walletsApi.deduct` | BV-API-DEDUCT |
| wallets.js `/adjust` PIN chủ quán | BV-PIN-ADJUST · VS-PIN-BO-LOI · VS-PIN-CHI-KHI-TRU · VS-PIN-SAU-GHI · VS-PIN-TRUOC-KIEM-DU-LIEU |
| wallets.js không âm (giữ) | VS-ADJUST-AM |
| don-mo-rong.js chặn tiền mặt → CK | BV-DOI-CK · VS-DOI-CHAN-CA-HAI |
| orders.js pay-debt chặn CK | BV-NO-CK · VS-NO-CK-CHI-KHI-CO-SO · VS-NO-CHAN-CA-TIEN-MAT |
| doiSoat.js phép DC | BV-DS-DC · VS-DS-DC-CHI-VI · VS-DS-DC-DO |
| ViKhach.jsx HoiPin | BV-VIKHACH-PIN · VS-VIKHACH-KHONG-MO · VS-VIKHACH-GUI-THANG |
| Orders.jsx thu nợ tiền mặt qua api | BV-ORDERS-FETCH · VS-ORDERS-NUT-CK |

## Phát hiện
1. `POST /wallets/topup` nhận `payment_method` tự do → "nạp chuyển khoản không qua QR" bằng gọi API tay (chi tiết `ke_hoach.md` mục 8).
