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

## Soát độc lập — vòng 2 (agent, 25.11, phạm vi: vòng sửa 1 c8a57928 + ghép main f5a82442; báo cáo nguyên văn)
```
KHÔNG ĐẠT (chỉ còn lỗi NHẸ: không lỗi tiền, không lộ thông tin, không ra ngoài Phạm vi. Sửa một vòng ngắn là xong)

Nói ngắn: vòng sửa 1 đã sửa đúng cả 4 lỗi vòng 1. Phần ghép main cũng đúng: 4 bài giữ cả dòng PIN lẫn `dungMonThu`, các bài đều xanh. Còn 3 chỗ nhẹ:
- Lỗi 4 (nhánh chết) mới dọn được một nửa: còn 2 nhánh chết trong cùng route.
- Một sửa ở màn hình (ViKhach) không có bài thử nào khoá.
- Hồ sơ lệch vài chỗ: số dòng trích, tên đột biến, số ca P26c.

LỖI TÌM ĐƯỢC:
1. server/routes/orders.js:1496 và :1614 — sau dòng chặn transfer ở :1492, `["cash", "transfer"].includes(payment_method)` (:1496) và
   `payment_method === "cash" ? "tiền mặt" : "chuyển khoản"` trong ghi chú sổ debt_payment (:1614) đều là nhánh chết. Đây đúng khuôn lỗi 4
   vòng 1: vòng sửa đã gọn `cotTien` (:1553) nhưng sót 2 chỗ trong CÙNG route. Cách gọn: thay :1496 bằng `if (payment_method !== "cash")`,
   ghi chú :1614 ghi thẳng "tiền mặt". — K4 (sửa nửa vời), LUAT §3 (không để code chết).
2. client/src/components/ViKhach.jsx:41 — `setHoiPin(false)` trong `mo()` (vòng sửa 1, Nghi ngờ ViKhach) chưa có bài thử và chưa có đột biến.
   Ca A2i (cong_cu/thu_TIENKHOA2.js:71-73) chỉ dò `<HoiPin mo={hoiPin`, `if (!nap) { setHoiPin(true); return; }`, `pin` và không có `prompt(`.
   Gỡ `setHoiPin(false)` thì bài vẫn xanh. Cần thêm một vế vào A2i, kèm đột biến kiểu VS-VIKHACH-KHONG-DAT-LAI. — K3, LUAT §6.1.
3. viec/TIEN-KHOA-2/ke_hoach.md:62 — câu mới viết ở vòng sửa trích "thu_gia_lap.js:132-145". Nội dung câu thì đúng (M1/M6/M8 neo vào UPDATE /
   ghiNhatKy / paid-partial, không neo vào `cotTien`). Nhưng số dòng sai: ở 28047a7 khoảng này cắt mất M8 (M8 ở :145-146), sau ghép main M8
   trôi xuống :147-148 (đã đọc cả hai bản). Cũng trong ke_hoach.md mục 5: còn tên đột biến `VS-NO-CK-SAU-GHI`, trong khi dot_bien.py:51 đã
   thay bằng `VS-NO-CK-CHI-KHI-CO-SO` (bảng trong trang_thai.md thì đúng). — K1 (hồ sơ lệch code).
4. viec/TIEN-KHOA-2/bang_chung_do.txt:68 — `SỐ CA thu_P26c.js: 161`, nay chạy ra 159 (đã biết). 9 bài đổi còn lại mình chạy lại từng bài trên
   HEAD f5a8244, đều khớp số ghi: TIENKHOA2 29 · DIEMTHAT1 36 · DOISOAT1 134 · KHNAP1 66 · NAP1 90 · P20 179 · P21 15 · P26b 104 · P3 101.
   Không thấy chỗ lệch nào khác. Dòng "npm test -- --day-du PASS 127" trong trang_thai.md là số trước ghép main; nay tổng là 130 phép, cần
   cập nhật. — K1 (bổ sung 11.11: cập nhật mọi số).

Theo từng mục được giao:
1. K3. thu_TIENKHOA2 đỏ trên gốc ở 16 ca. Riêng A4c (thu_TIENKHOA2.js:249-250) có vế mới, kiểm "lời báo KHÔNG chứa transfer/chuyển khoản".
   Đây là kiểm mẫu nguy hiểm vắng mặt, không phải dò marker, và đỏ trên gốc (ghi ở bang_chung_do). E10 (thu_DOISOAT1.js:618-630) dựng thẳng
   dòng thu CK cũ đúng khuôn `ghiNhatKy`: cột `transfer_amount` + nhật ký 'thu' có `{cach, so_tien, con_no}`, khớp nhatKyDon.js:17-20. Công
   thức `tienTheoSo` (doiSoat.js:105-123) đọc cả cột lẫn nhật ký, nên E10 khoá được cả "CK thu nợ 20.000" và "CK bán 0". Hai sửa không có ca:
   lỗi 2 ở trên (ViKhach). Còn `[soTien, 0, …]` ở don-mo-rong.js:155 thì A3b khoá được.
2. K4. Trong route pay-debt (orders.js:1486-1642), grep `transfer` ra 3 chỗ còn lại: :1492 là chặn (đúng), :1496 và :1614 là nhánh chết
   (lỗi 1). Trong don-mo-rong.js, grep ra 9 chỗ. :118 có lời "cash hoặc transfer" vẫn đúng, vì transfer là đầu vào hợp lệ để trả 409. :148
   dùng `pmMoi`, nay luôn ra 'cash' khi đơn là cash/transfer, đúng. Không dot_bien.py nào neo vào các chuỗi đã xoá: grep trong viec/ cong_cu/
   server/ client/src/ tu_chay/ chỉ ra hồ sơ cũ. Neo `[cotTien]` của viec/DIEM-THAT-1/dot_bien.py:24 vẫn còn ở orders.js:1558. Lối song song
   ngoài phiếu vẫn mở: `/wallets/topup` (Phát hiện 1).
3. K5. Các luồng hợp lệ đi qua điều kiện mới đều có ca xanh:
   - adjust cộng / trừ có PIN: A2f, A2f2;
   - CK → tiền mặt: A3b;
   - thu nợ / chờ thu bằng tiền mặt, thu một phần rồi đủ: A4f, A4g;
   - hai người cùng thu tiền mặt: A4d1;
   - bán qua phiên ví / CK: K5-4a, K5-4b;
   - nạp tay: K5-5;
   - App KH: thu_HOPDONG_KH xanh trong --day-du.
   Không thấy luồng nào bị chặn oan.
4. K1. Lỗi 3 và lỗi 4 ở trên. A7 nay nằm ở trang_thai.md, mục "A7 — chủ quán thử tay", đủ 3 thao tác, A7.2 ghi rõ là thay bằng ca máy.
   Lỗi 1 vòng 1 đã sửa.
5. Đường tiền. pay-debt tự đọc nợ từ DB (:1506) và dùng `paidAmount ≤ debt_amount`. Cột tiền giờ cố định là cash. /adjust: số tiền là chủ
   quán gõ tay, có PIN, sổ có `khongAm`. Không thấy chỗ nào máy chủ tin giá hay tiền do client gửi.
6. P1. `--day-du`: "dist đã commit KHỚP với src hiện tại". Bundle index-BbIj_N_8.js có chuỗi "Thu nợ chuyển khoản phải qua QR", có "Điều
   chỉnh số dư — gõ PIN chủ quán", và không còn `wallets/deduct`.
7. Nghiệm thu: xem dưới.
8. Đơn giản. Ngoài lỗi 1 thì code gọn. phepSuaTay ở doiSoat.js:345-353 cùng khuôn phepXacNhanTay, chấp nhận được.

Chạy lại trong lượt này:
- `node kiem_tra_truoc_khi_giao.js --day-du` ra PASS 129 · FAIL 1 · CẢNH BÁO 1. Phép FAIL duy nhất là thu_BH2 G1 "fatal: bad revision
  'cbbb809..HEAD'". Lúc mình kiểm sau đó, `git cat-file -t cbbb809` ra `commit`, kho không còn nông. Chạy riêng `node cong_cu/thu_BH2.js` ra
  100 đạt · 0 hỏng. Mình đoán phiên chính `--unshallow` đúng lúc bộ kiểm đang chạy (có 2 tiến trình kiem_tra chạy song song), nhưng chưa xác
  nhận. Vậy là 130/130, nhưng phiên chính nên chạy lại --day-du một lần cho sạch.
- `node cong_cu/thu_TIENKHOA2.js` ra 29/29 · `node cong_cu/thu_DOISOAT1.js` ra 134/134.

NGHI NGỜ:
- server/utils/pinChuQuan.js:57-61: thiếu PIN cũng tốn một lượt. Ai có quyền `adjust_balance` gọi tay /adjust không PIN 5 lần là khoá PIN chủ
  quán 15 phút cho MỌI việc dùng PIN đó (hạng thẻ, gói nạp, ví). Đây là luật chung có sẵn, phiếu bảo dùng chung. Đề xuất ghi Phát hiện, đừng
  sửa trong phiếu này.
- client/src/pages/Orders.jsx:947: nút Thu nợ hiện cả cho bill cho_thu (vì `debt_amount > 0`). Như vậy có hai nơi thu một bill, trái DAC_TA
  luật 3. Chuyện này có từ trước, ngoài phiếu; phiếu A4 chủ ý giữ thu tiền mặt ở màn này.
- client/src/utils/api.js:391-398: `balanceApi.adjust` / `topup` trỏ tới `/customers/:id/balance/*`, server không có route này (grep
  `router.post` trong server/routes ra 0). Code chết, ngoài Phạm vi.
- server/routes/don-mo-rong.js:174: lỗi 500 trả `err.message`, lộ lỗi nội bộ (trái LUAT §4). Có từ trước.
- Phát hiện 1 (topup nhận `payment_method` tự do) vẫn mở, cần việc riêng.

NGHIỆM THU:    7/7 mục có bằng chứng · mục thiếu: không
- A1 có: wallets.js không còn /deduct, api.js:300-303 không còn `deduct`, ca A1/A1b, BV-DEDUCT/BV-API-DEDUCT.
- A2 có: wallets.js:202-204 gọi `kiemPinChuQuan`, kiểm sau phần kiểm dữ liệu và ngoài giao dịch; `khongAm`; dòng sổ 'adjust' kèm phép DC;
  ViKhach dùng HoiPin; các ca A2a–A2j.
- A3 có: don-mo-rong.js:119-121 trả 409 DOI_SANG_CK_PHAI_QUA_QR; CK → tiền mặt vẫn được và có dòng DC; ca A3a/b/c.
- A4 có: chặn ở orders.js:1492, ca A4a/b/c/d/e/f/g, Orders.jsx dùng `ordersApi.payDebt`, NGUONG_FETCH 21.
- A5 có: 21 đột biến, đối chứng xanh, 21/21 BẮT theo bang_chung_do. Lượt này mình không chạy lại đột biến.
- A6 có: K5 như mục 3 ở trên.
- A7 có: trang_thai.md mục "A7 — chủ quán thử tay".
- `node tu_chay/cong.js chay`: chưa chạy, sẽ chạy sau soát (không tính là thiếu).

CHƯA SOÁT ĐƯỢC:
- Không chạy lại 21 đột biến (dựa vào bang_chung_do và trang_thai).
- Không chạy `--cay-goc` để xác nhận lại A4c / E10 đỏ trên gốc.
- Không thử giao diện ViKhach / Orders trên trình duyệt.
- Không chạy `cong.js`.
- Phép FAIL thu_BH2 trong --day-du: mình kết luận do kho bị nông lúc chạy, dựa trên lần chạy riêng xanh. Chưa chứng minh trực tiếp.

BÀI HỌC:
- NGUYÊN TẮC (K4): dọn nhánh chết sau khi chặn một giá trị thì grep CẢ route tìm mọi chỗ còn rẽ nhánh theo giá trị đó (danh sách trắng, ghi
  chú sổ, cột), không chỉ dòng người soát chỉ ra.
- KHOÁ (K3): mỗi chỗ sửa ở vòng sửa (kể cả sửa theo Nghi ngờ ở giao diện) phải có một vế bài thử kèm một đột biến ghi vào dot_bien.py. Cổng có
  thể đối chiếu: mỗi file client/src/ đổi giữa hai lượt soát phải có ít nhất một đột biến mới neo vào file đó.
- NGUYÊN TẮC (K1): câu hồ sơ trích "file:dòng" của file khác dễ trôi sau ghép main. Nên trích tên ca hoặc chuỗi neo (vd "M1/M6/M8 trong
  DOT_BIEN") thay cho số dòng.
```

## Vòng sửa 2 (25.11, commit f68756ba + 18018c02)
- Lỗi 1: `orders.js` pay-debt: `if (payment_method !== "cash")` thay danh sách trắng `["cash", "transfer"]`; ghi chú sổ debt_payment ghi thẳng
  "bằng tiền mặt". Hai nhánh này không tới được sau dòng chặn transfer → hành vi không đổi, không dựng được đột biến khác hành vi (đột biến tương
  đương) — lời báo CACH_TRA_LA vẫn do A4c khoá.
- Lỗi 2: A2i thêm vế `mo()` có `setHoiPin(false)`; đột biến mới `VS-VIKHACH-KHONG-DAT-LAI` → BẮT. (Lần đầu regex `[^}]*` vấp `setNhap({…})`
  → A2i đỏ oan trên code đúng — K2, đã truy nguyên rồi sửa regex theo dòng.) A2i đỏ trên gốc (gốc không có HoiPin).
- Lỗi 3: `ke_hoach.md` bỏ số dòng `thu_gia_lap.js`, trích tên đột biến M1 / M6 / M8; bảng đột biến mục 5 đổi `VS-NO-CK-SAU-GHI` → `VS-NO-CK-CHI-KHI-CO-SO`.
  (Dòng "đã đọc `thu_gia_lap.js:132-145`" ở mục Vòng sửa 1 phía trên là ghi chép lúc đó — giữ nguyên làm vết.)
- Lỗi 4: `bang_chung_do.txt` SỐ CA thu_P26c 161 → 159 (KHO-3a bỏ B3d / B3e); 9 bài còn lại chạy lại, số không đổi.
- Nghi ngờ vòng 2 đều có từ trước / ngoài Phạm vi → Phát hiện 4–7.
- Chạy lại trên HEAD 18018c02: `thu_TIENKHOA2` 29/29 · đột biến 22 / 22 BẮT, đối chứng xanh · `npm test` PASS 126 · FAIL 0 (trước vòng sửa 2) ·
  `npm test -- --day-du` PASS 130 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có sẵn). Kho mây nông lại khi mở phiên → `git fetch --unshallow` (thu_BH2 G1).
- Vòng sửa 2 CHƯA được agent soát lại (chat dặn dừng sau vòng 2): chỉ lỗi nhẹ — chat soát thay hoặc /ra-soat vòng 3 ở phiên sau.

## Phát hiện (thêm sau soát vòng 2)
4. `pinChuQuan.js`: gõ thiếu PIN cũng tốn một lượt → người có quyền `adjust_balance` gọi /adjust không PIN 5 lần là khoá PIN chủ quán 15 phút cho mọi
   việc dùng PIN (luật chung có sẵn).
5. `Orders.jsx`: nút Thu nợ hiện cả cho bill `cho_thu` (`debt_amount > 0`) → hai nơi thu một bill, trái DAC_TA luật 3 (có từ trước).
6. `api.js` `balanceApi.adjust` / `topup` trỏ `/customers/:id/balance/*` — máy chủ không có route này (code chết).
7. `don-mo-rong.js` lỗi 500 trả `err.message` (lộ lỗi nội bộ, LUAT §4; có từ trước).

## Soát bảo mật (25.11, /soat-bao-mat — agent độc lập, chỉ đọc; diff `7da9ba9..beaeecff` = phần riêng của nhánh sau ghép main)
Số lỗ hổng trước lọc: 0 · sau lọc: 0 (bước 2 không tìm được gì → không cần bước 3). Báo cáo nguyên văn:
```
Không tìm thấy lỗ hổng (diff 7da9ba9..HEAD của viec/TIEN-KHOA-2, chỉ đọc).

Mình đã soát những chỗ sau:

1. server/routes/wallets.js:184-219, POST /adjust. Route vẫn đi qua `authenticate` và `checkPermission("adjust_balance")`, giờ có thêm
   `kiemPinChuQuan(req.body?.pin)` ở dòng 202-203. PIN được kiểm trước khi vào giao dịch ghi; sai PIN thì trả về ngay và không ghi gì. Hàm
   server/utils/pinChuQuan.js:56-67 dùng chung với membership, backup, goi-nap và quang-cao:
   - So băm bằng bcrypt.
   - Sai 5 lần thì khoá 15 phút.
   - Giữ chỗ lượt thử bằng một câu UPDATE có điều kiện và kiểm `changes`, nên gửi nhiều lượt cùng lúc cũng không đoán vượt được 5 lần.
   - Câu trả lời lỗi chỉ có `code` và lời báo, không lộ băm PIN.
   Vì vậy không có lỗi PIN ngắn đoán được.
2. Gỡ POST /wallets/deduct. Lối trừ ví tay đã mất hẳn. Phía máy khách cũng bỏ `walletsApi.deduct` (client/src/utils/api.js). Không mở thêm lối nào.
3. server/routes/don-mo-rong.js:113-168, doi-cach-tra. Chiều `sang === 'transfer'` bị chặn bằng 409 trước mọi lần đọc hay ghi. Câu UPDATE giờ ghi
   cứng `[soTien, 0, ...]`. Chốt chống đổi hai lần (điều kiện WHERE kèm `changes !== 1`) vẫn còn, các tham số đều qua chỗ giữ chỗ `?`. Phần thay
   đổi không tạo lối chèn SQL hay vượt quyền nào.
4. server/routes/orders.js pay-debt, khoảng dòng 1488-1615. Chỉ nhận `payment_method === "cash"`, còn `transfer` bị trả 400 THU_NO_CK_PHAI_QR.
   Biến `cotTien` giờ là hằng `"cash_amount"`, nên cũng hết chỗ ghép tên cột theo dữ liệu gửi lên. Dòng ghi chú sổ không còn chèn `payment_method`.
5. server/utils/doiSoat.js:344-353, phép DC. Hai câu SELECT cố định, không có tham số người dùng. Kết quả ra qua GET /reports/doi-soat, vẫn cần
   `authenticate` và `checkPermission('view_reports')` (server/routes/reports.js:383). SĐT và lý do điều chỉnh chỉ hiện cho người có quyền xem báo
   cáo, đúng mục đích đối soát. Chữ hiện qua JSX `{l.mo_ta}` ở client/src/components/DoiSoat.jsx:129, React tự thoát ký tự, không dùng
   dangerouslySetInnerHTML, nên không có XSS.
6. Máy khách.
   - client/src/components/ViKhach.jsx chỉ gửi PIN trong thân POST, không ghi log và không lưu lại.
   - client/src/components/HoiPin.jsx xoá PIN sau khi xong.
   - client/src/pages/Orders.jsx chuyển thu nợ sang `ordersApi.payDebt`, bỏ `fetch` trần và bỏ đọc token thủ công. Không lộ token.
7. Bỏ qua. Bài thử cong_cu/thu_*.js, giả lập cong_cu/gia_lap/kich_ban.js, viec/TIEN-KHOA-2/* và bộ kiểm (chỉ hạ `NGUONG_FETCH` 22→21 và thêm một
   bài) thuộc loại trừ "chỉ dùng để chạy thử / tài liệu", không có bề mặt tấn công.

Không có phát hiện mức HIGH hay MEDIUM nào đạt độ tin cậy từ 7/10 trở lên.
```
SOÁT BẢO MẬT: ĐẠT
