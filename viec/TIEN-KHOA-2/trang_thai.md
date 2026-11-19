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
2. (soát vòng 1) `don-mo-rong.js` đổi cách trả: UPDATE đơn và `ghiNhatKy('doi')` là hai lệnh tự commit (có từ trước, trái LUAT §5). Ghi nhật ký hỏng sau
   UPDATE → lần đổi CK → tiền mặt không hiện ở Đối soát (phép DC đọc nhật ký). Đề xuất việc sau: gộp một giao dịch.
3. (soát vòng 1) Phép DC (`doiSoat.js` `phepSuaTay`) như `phepXacNhanTay`: đọc cả bảng rồi lọc kỳ ở `xep` — sổ lớn dần thì chậm; báo DOISOAT-NHANH.
   Dòng DC hiện dưới tiêu đề "CẦN XEM — có thể oan" (`DoiSoat.jsx:14`) — chữ tiêu đề chưa sát nghĩa "sửa tay", ngoài Phạm vi.

## Soát độc lập — vòng 1 (agent, báo cáo nguyên văn)
```
ĐẠT / KHÔNG ĐẠT: KHÔNG ĐẠT

LỖI TÌM ĐƯỢC:
1. viec/TIEN-KHOA-2/trang_thai.md — thiếu A7: không có mục ghi các thao tác chủ quán thử tay
   (A7.1 ViKhach hỏi PIN · A7.3 thu nợ chỉ còn tiền mặt · A7.2 thay bằng ca máy A3a/A3b, ghi vào CHƯA KIỂM).
   grep "thử tay|A7" chỉ ra dòng 28, là câu hỏi cũ. Cũng chưa ghi `node tu_chay/cong.js chay`
   (LUAT §6.3, §6.4) — khuôn K6 (vi phạm luật có sẵn của dự án).
2. server/routes/orders.js:1536-1541 — lời báo CACH_TRA_LA vẫn ghi "(cash hoặc transfer)".
   Gửi "the" thì quầy được bảo "transfer" là hợp lệ, trong khi transfer giờ luôn bị 400.
   Sửa thành "chỉ nhận tiền mặt". Khuôn K4 (sửa một câu thì grep câu cùng nghĩa).
3. server/routes/orders.js:1521-1524 (chú thích đầu route "Cập nhật … cash_amount/transfer_amount")
   và server/routes/don-mo-rong.js:8 (mục lục route "tiền mặt ↔ chuyển khoản sau khi đã in bill")
   — chú thích sai sau vá. Khuôn K1 (TU-CHAY-6: chú thích là khẳng định).
4. server/routes/don-mo-rong.js:155 — `sang === 'transfer' ? soTien : 0` nay là nhánh chết
   (sang luôn là 'cash' sau dòng 119). LUAT §3 "không để code chết".
   Gọn hơn: `[soTien, 0, pmMoi, …]`.
   orders.js:1572 (nhánh transfer của cotTien) cũng chết, nhưng kế hoạch mục 2 A4 có ghi lý do giữ
   (neo đột biến thu_gia_lap M1/M6/M8). Chấp nhận được; nên thêm một dòng chú thích tại chỗ nói rõ là cố ý.

NGHI NGỜ:
- don-mo-rong.js:150-161 — UPDATE đổi tiền và ghiNhatKy('doi') là hai lệnh tự commit riêng
  (có từ trước, không trong một giao dịch, trái LUAT §5). Phép DC mới (doiSoat.js:346) CHỈ đọc nhật ký
  'doi'. Nếu ghi nhật ký hỏng sau khi UPDATE xong thì lần đổi CK→tiền mặt không hiện ở Đối soát.
  Ngoài phiếu, đề xuất ghi Phát hiện.
- doiSoat.js:343-350 phepSuaTay: hai SELECT không lọc ngày, quét cả bảng pos_balance_transactions /
  pos_order_log mỗi lần chạy, rồi mới lọc kỳ ở `xep`. Cùng khuôn phepXacNhanTay nên chấp nhận được,
  nhưng sổ sẽ lớn dần; DOISOAT-NHANH nên biết.
  Dòng DC còn hiện dưới tiêu đề "CẦN XEM — … có thể oan" (DoiSoat.jsx:14), không đúng nghĩa cho dòng sửa tay. Nhẹ.
- Mất phủ bài thử: thu_DOISOAT1 E10 trước đây khoá cách Đối soát cộng "CK thu nợ" (dữ liệu cũ đã thu nợ
  bằng CK trên quầy vẫn đi qua nhánh này). Nay đổi sang tiền mặt nên nhánh CK thu_no chỉ còn được kiểm
  bằng giá trị 0. K5: dữ liệu cũ trên production.
- A4d2 (thu_TIENKHOA2.js:271-274) gọi là "cùng lúc", nhưng lệnh CK bị chặn trước khi đọc đơn nên không có đua thật.
  Ca hai người thật của A4 là A4d1. Tên ca nói nhiều hơn điều máy kiểm (K3 nhẹ).
- ViKhach.jsx:106: nếu KhungModal 'chinh' bị đóng khi HoiPin đang mở, hoiPin vẫn true. Mở lại "Điều chỉnh"
  thì ô PIN bật ngay. Chưa thử được trên trình duyệt (HoiPin có lớp phủ nên khó xảy ra).
- Lối thứ 4 cùng khuôn: POST /wallets/topup (wallets.js:155-176) nhận payment_method tự do, nên vẫn
  "nạp chuyển khoản không qua QR" và không cần PIN. Đã ghi Phát hiện 1 (ke_hoach mục 8), ngoài phiếu.
  Cần mở việc riêng.

NGHIỆM THU:    6/7 mục có bằng chứng · mục thiếu: A7 (A7.1, A7.3 chưa ghi thao tác; A7.2 ghi "thay ca máy" trong kế hoạch nhưng chưa vào trang_thai)
  (chi tiết A1–A6: CÓ — xem bản đầy đủ của agent; A5 agent tự chạy lại 3 đột biến: đối chứng XANH, BẮT 3/3)

CHƯA SOÁT ĐƯỢC:
- --day-du / npm test: chạy nền chưa có kết quả lúc nộp — dựa vào trang_thai (PASS 127 · FAIL 0).
- `node tu_chay/cong.js chay`: chưa chạy, chưa có kết quả.
- 18/21 đột biến còn lại: không chạy lại.
- Giao diện ViKhach / Orders trên trình duyệt thật.

BÀI HỌC:
- KHOÁ: cổng / người gác kiểm trang_thai.md có mục "thử tay" với 1–3 thao tác khi phiếu có nghiệm thu A-thử-tay.
- NGUYÊN TẮC (K4): chặn một giá trị khỏi danh sách trắng (cash|transfer → chỉ cash) thì grep MỌI lời báo lỗi, chú thích đầu route,
  mục lục file và nhánh dùng giá trị đó; nhánh chết giữ lại làm neo đột biến phải có chú thích tại chỗ.
- NGUYÊN TẮC (K5 dữ liệu cũ): bỏ một luồng mà bài thử cũ dùng để khoá cách Đối soát tính dữ liệu cũ (E10 CK thu nợ) thì giữ phủ bằng
  dữ liệu dựng thẳng vào sổ, đừng đổi hẳn sang luồng mới.
```

## Vòng sửa 1 (commit c8a57928)
- Lỗi 2: `orders.js` lời CACH_TRA_LA → "thu nợ chỉ nhận tiền mặt (cash)"; bài A4c thêm vế "lời báo không mời dùng transfer" (đỏ trên gốc).
- Lỗi 3: chú thích đầu route pay-debt + mục lục `don-mo-rong.js` sửa theo hành vi mới.
- Lỗi 4: `don-mo-rong.js` bỏ nhánh chết `sang === 'transfer' ? …`; `orders.js` `cotTien = "cash_amount"`. Lý do "giữ cotTien vì neo đột biến
  M1/M6/M8" trong kế hoạch là SAI (K1) — đã đọc `thu_gia_lap.js:132-145`: M1/M6/M8 bám câu UPDATE / ghiNhatKy / paid-partial, không bám cotTien.
  Đã sửa câu trong `ke_hoach.md`.
- Nghi ngờ ViKhach: `mo()` đặt lại `hoiPin = false` mỗi lần mở khung. Nghi ngờ A4d2: đổi tên ca (không nói "đua").
- Nghi ngờ E10: `thu_DOISOAT1` E10 dựng thẳng một lần thu nợ CK CŨ 20.000 (cột + nhật ký 'thu') rồi thu tiền mặt 30.000 → khoá cả CK thu nợ
  20.000 lẫn tiền mặt 30.000.
- Hai Nghi ngờ còn lại ngoài Phạm vi → Phát hiện 2, 3.
- Chạy lại: `npm test -- --day-du` PASS 127 · FAIL 0 · CẢNH BÁO 1 · đột biến 21/21 BẮT · đỏ trên gốc + SỐ CA ghi trong `bang_chung_do.txt`.

## A7 — chủ quán thử tay (điện thoại / máy quầy, sau khi Render chạy bản mới)
1. **Khách hàng › chọn một khách › Ví › Điều chỉnh**: gõ số (vd `1000`) + lý do → bấm "Xác nhận điều chỉnh" → hiện ô "gõ PIN chủ quán". Gõ sai
   PIN → báo đỏ ngay dưới ô, số dư không đổi; gõ đúng → "Đã điều chỉnh 1.000đ…". (Nhớ điều chỉnh ngược lại −1.000 để trả số cũ.)
2. **(A7.2 thay bằng ca máy)** không màn nào có nút đổi cách trả → máy thử: A3a (tiền mặt → CK bị chặn 409), A3b (CK → tiền mặt được), A3c (hiện ở Đối soát).
3. **Đơn hàng › mở một đơn còn nợ cũ (nếu có) › Thu nợ**: hộp chỉ còn "Thu tiền mặt" kèm dòng "Thu nợ chuyển khoản phải qua QR — tạm thu tiền mặt".
   Không có đơn nợ cũ thì bỏ qua (máy thử A4a/A4b/A4f/A4g).
