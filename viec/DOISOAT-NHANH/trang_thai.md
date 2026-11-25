# DOISOAT-NHANH — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh `viec/DOISOAT-NHANH`, cây sạch. `git fetch origin viec/DOISOAT-NHANH` → HEAD 21ab0fc · FETCH_HEAD 21ab0fc → bằng nhau, không kéo.
- `git log --oneline -3`:
  - 21ab0fc PHIEU: DOISOAT-NHANH doi soat that treo o cung mot buoc (13 cau) — do tung buoc, han gio, tim goc — chat ban 40
  - e1a89bb Merge pull request #101 from pos-tuquyduong/viec/GIAO-3
  - e4e7f8f GIAO-3: chat ban 40 soat thay vong sua 2, ghep main, --day-du, HEAD DA KIEM

## C1 — tái hiện chỗ treo
- Đọc code: mọi `await` trên đường Đối soát chỉ chờ câu kho (`bat_bien.js` 32 chỗ `await q(`; `doiSoat.js` chỉ `chiDoc` / hàm con của nó;
  `giaoHang.js doiSoatGiao` chỉ `await q(`). → khả năng (2) "await một thứ khác" KHÔNG có trong code; chỗ treo là một câu kho không có trả lời.
- **Khả năng (1) DỰNG ĐƯỢC bằng câu ÉP treo** (kho giả bọc `execute`, câu "loại dòng điểm lạ" của I8 không trả lời) — chứng minh code cũ treo NẾU một câu
  không trả lời, CHƯA chứng minh đó là nguyên nhân trên Turso: bản gốc TREO quá hạn ngoài của bài
  (✗ C1 (1) — TREO, bang_chung_do.txt). Trên kho rỗng + 2 đơn thử, câu đó là câu thứ 15 của lượt (phanLoai chen câu `tra`).
- **Khả năng (2) KHÔNG tái hiện**: dữ liệu cũ (tháng 9, trước mốc AP_DUNG_TU) có lệch I3 / I6 / I8, phanLoai gọi `tra` → bản GỐC chạy xong
  (ca C1 (2) xanh trên gốc).
- **HTTP libsql remote → máy chủ libsql tại chỗ: KHÔNG dựng được** (không có `sqld` / `turso` trong máy). Vì sao một câu cụ thể của kho thật
  (luôn sau 12 câu) không có trả lời — nguyên nhân gốc phía libsql / mạng / Turso — CHƯA tìm ra. Không đoán.
- `@libsql/client` 0.4.3 `http.js execute`: mỗi câu một `fetch` riêng (node-fetch, không hạn giờ, không tín hiệu huỷ) → câu treo chờ mãi.

## C3 — đối chứng giống hệt
`node viec/GIAO-3/do_doisoat.js --tre 0 --goc <doiSoat.js gốc 21ab0fc> --ra` và bản mới, ngày / tuần / tháng (1.800 đơn / 30 ngày; đỏ 82 / 142 / 1.042 dòng):
`cmp` hai JSON → GIỐNG HẾT (76.840 byte). Số câu mỗi kiểu không đổi (63 / 61 / 60).

## Chỗ vá → đột biến (`python3 viec/DOISOAT-NHANH/dot_bien.py`)
| chỗ vá | đột biến |
|---|---|
| database.js `[CHAM]` thêm "đang chờ" (A2) | BV-dang-cho-log, BV-dang-cho-kn1 |
| database.js doCau đếm `cho` trong finally (A2) | VS-dang-cho-chi-khi-xong |
| database.js query `coHan` (B1) — đưa lỗi treo cũ trở lại (C2) | BV-han-cau |
| database.js quá hạn đi vòng đọc lại (B1) | VS-qua-han-khong-doc-lai |
| database.js quá hạn ném KHO_QUA_HAN, không đổi thành mất kết nối | VS-qua-han-thanh-mat-ket-noi |
| database.js `han` mặc định null — đường khác không hạn (D2) | VS-han-mac-dinh-moi-duong |
| database.js hạn mỗi lần gửi = min(ms, het − bây giờ) (B2) | VS-han-khong-moc |
| doiSoat.js chiDoc truyền mốc lượt (B2) | VS-luot-khong-moc |
| doiSoat.js HAN 15 000 / 50 000 | VS-hang-so-cau, VS-hang-so-luot |
| doiSoat.js lỗi 503 DOI_SOAT_QUA_HAN + đúng bước + log qua_han | VS-ma-loi-qua-han, VS-loi-sai-buoc, BV-log-qua-han |
| doiSoat.js ngữ cảnh lượt (đếm theo lượt; gỡ = lỗi treo cũ trở lại) | BV-ngu-canh-luot |
| doiSoat.js log bat_dau / buoc / D2 / sao_ke (A1) | BV-log-bat-dau, BV-log-buoc, BV-buoc-D2, BV-buoc-sao-ke |
| doiSoat.js dừng khi khách bỏ (B3) | BV-bo-giua |
| reports.js truyền tín hiệu (B3) | BV-tin-hieu-route |
| database.js hết mốc TRƯỚC khi gửi: ném ngoài try (soát vòng 1) | VS-het-moc-dem-rot |
| doiSoat.js chiDoc ngoài lượt KHÔNG hạn (soát vòng 1) | VS-ngoai-luot-co-han |
| database.js một vị từ conLuot còn lượt + còn giờ cho mọi loại lỗi (soát vòng 2) | VS-moc-chi-qua-han |

Tên đột biến (24): BV-dang-cho-log, VS-dang-cho-chi-khi-xong, BV-dang-cho-kn1, BV-han-cau, VS-qua-han-khong-doc-lai, VS-qua-han-thanh-mat-ket-noi,
VS-han-mac-dinh-moi-duong, VS-ngoai-luot-co-han, VS-het-moc-dem-rot, VS-moc-chi-qua-han, VS-han-khong-moc, VS-luot-khong-moc, VS-hang-so-cau, VS-hang-so-luot,
VS-ma-loi-qua-han, VS-loi-sai-buoc, BV-log-qua-han, BV-ngu-canh-luot, BV-log-bat-dau, BV-log-buoc, BV-buoc-D2, BV-buoc-sao-ke, BV-bo-giua, BV-tin-hieu-route.

## Kiểm (số cuối — HEAD 82f7396, đã ghép main 7da9ba9a)
- `node cong_cu/thu_DOISOATNHANH.js` → 39 đạt · 0 hỏng. Trên 3 file gốc main 7da9ba9a → 8 đạt · 31 hỏng (bang_chung_do.txt, SỐ CA 39).
- `cong_cu/thu_KETNOI1.js` (sửa regex [CHAM]) → 102 đạt · 0 hỏng; trên database.js gốc → 100 · 2 hỏng (SỐ CA 102).
- `python3 viec/DOISOAT-NHANH/dot_bien.py` → ĐỐI CHỨNG XANH (dsn 39/0, kn1 102/0) · TỔNG 25 đột biến · BẮT 25 · SỐNG 0 · HỎNG 0 · LẠC 0.
- `npm test` (19.11, trước vòng sửa 1) → PASS 124 · FAIL 0 · CẢNH BÁO 1 (cũ: route GET có lệnh ghi packages.js / products.js / sync.js — không thuộc việc này).
- `npm test -- --day-du` (25.11, HEAD 82f7396) → PASS 130 · FAIL 0 · CẢNH BÁO 1 (như trên); thu_DOISOATNHANH xanh 18,2 s, thu_GIAO3 xanh, giả lập quầy xanh.
- `node tu_chay/cong.js chay . 7da9ba9a HEAD viec/DOISOAT-NHANH` → ✓ CỔNG CHẠY ĐẠT.
- Giao diện KHÔNG đổi (client/src, client/dist không đụng) → không cần build.
- Sự cố môi trường: kho nông làm thu_BH2 đỏ (`bad revision cbbb809..HEAD`) → `git fetch -q --unshallow origin viec/DOISOAT-NHANH`, chạy lại xanh.

## Soát độc lập — vòng 1 (agent general-purpose, nguyên văn)
```
KHÔNG ĐẠT (lỗi tìm được đều NHẸ, không đụng tiền, điểm, ví hay bảo mật; E1/E2 đang chờ)

LỖI TÌM ĐƯỢC:
1. ke_hoach.md mục 5 liệt kê "route /so-sach" là luồng phải KHÔNG bị chặn, mục 4 ghi "soSach … NGOÀI lượt → KHÔNG hạn giờ", nhưng
   cong_cu/thu_DOISOATNHANH.js không có ca nào cho luồng này. Ca D2 (dòng 173–178) chỉ gọi thẳng db.query / db.run, không đi qua chiDoc ngoài lượt
   (doiSoat.js:76–77). Đột biến đổi dòng 77 thành db.query(sql, args, { ms: HAN.CAU_DOI_SOAT_MS, het: Infinity }) → /daily và /so-sach bị hạn 15 s mà
   bài vẫn xanh. dot_bien.py không có đột biến này. Khuôn K3 (TU-CHAY-5) + K5. Sửa: thêm ca soSach chậm 2 × hạn câu → vẫn ra kết quả; đột biến VS-ngoai-luot-co-han.
2. Hồ sơ lệch code (K1): ke_hoach.md mục 3 ghi "rút ÷100", code RUT = 50. Tên ca B2 (thu_DOISOATNHANH.js:167–168) nói cận trên "hạn tổng + chờ đọc
   lại cuối", máy kiểm LUOT + db.CHO_DOC_MS[1] / RUT + 150 — CHO_DOC_MS không rút mà bị chia 50. Cận chặt hơn tên ca nên không xanh oan, nhưng tên ca
   một đằng, máy kiểm một nẻo (K3).
3. database.js:1600–1601: hết mốc lượt (han && ms <= 0) ném TRONG try → đi qua baoRot (:1614) và demRot.thu_lai_hong++ (:1616) dù chưa gửi câu nào
   → demKetNoi tăng rot / thu_lai_hong oan, in "[KET-NOI] doc lan 1/3 KHO_QUA_HAN — het luot" dù không có lần thử. Không sai kết quả, nhiễu số đo. K4.

NGHI NGỜ:
- thu_GIAO3.js:475: điều kiện chờ startsWith('[DOISOAT]') giờ thoả ngay lúc BẮT ĐẦU lượt (dòng bat_dau) → có thể thoát chờ sớm rồi ĐỎ oan ở :476
  (K2, thất thường). Không chạy thu_GIAO3.
- reports.js:386–387: res.on('close') gắn SAU authenticate + checkPermission — khách bỏ trong lúc xác thực thì lượt chạy tới hết. Nhỏ, không ca.
- thu_DOISOATNHANH.js:138 ca "B1 dừng ở bước treo … (I9)" XANH cả trên gốc (gốc treo nên không tới I9) — các ca 503 bên cạnh đã che.
- thu_DOISOATNHANH.js:96 viết cứng t !== 'I7' thay vì BO_QUA — BO_QUA đổi thì ĐỎ oan (K2).
- "đọc lại gửi trên socket khác" (ke_hoach §2): chưa đọc HttpClient.openStream có chờ lời hứa dùng chung không — CHƯA KIỂM.

NGHIỆM THU: 12/14 mục có bằng chứng · mục thiếu: E1 (chờ), E2 (chờ báo cáo cuối)
CHƯA SOÁT ĐƯỢC: dot_bien.py, --day-du, cong.js, thu_GIAO3, thu_KETNOI1 (không chạy); libsql HTTP thật với Turso; 'close' trên Render.
BÀI HỌC:
- KHOÁ: phiếu gắn hạn giờ / ngữ cảnh "chỉ trong lượt X" → bài thử phải có ca đi qua CÙNG cửa (chiDoc) mà NGOÀI lượt + đột biến "luôn gắn hạn".
- NGUYÊN TẮC (K4): thêm dòng log mới CÙNG tiền tố với dòng bài khác dò (startsWith('[DOISOAT]')) → grep mọi chỗ dò tiền tố đó.
- NGUYÊN TẮC (K3): rút giờ trong bài thử → hằng số không rút không được chia hệ số rút; tên ca nói đúng cận máy kiểm.
```
(Bản trên rút gọn phần "kết quả từng mục" — các mục 1–8 không có lỗi thêm; NGHIỆM THU dòng từng mục: A1 :104–124, A2 :198–211 + KETNOI1 :685–687,
B1 :84, 127–145, B2 :85–89, 159–170, B3 :213–221, B4 :223–240, C1 :133, :149, C2 BV-han-cau / BV-ngu-canh-luot, C3 trang_thai, D1 :154–157, D2 một phần.)

## Vòng sửa 1 (d2af13e) — theo soát vòng 1
- Lỗi 1: thêm ca `D2 soSach (qua chiDoc, ngoài lượt …)` + đột biến VS-ngoai-luot-co-han (BẮT).
- Lỗi 2: ke_hoach mục 3 sửa ÷50 / hạn tổng thử 2,5 s; ca B2 cận trên = hạn tổng + 150 ms (sau mốc không còn chờ đọc lại), tên ca khớp máy kiểm.
- Lỗi 3: `database.js` hết mốc TRƯỚC khi gửi ném ngoài try + ca "hết mốc trước khi gửi" + đột biến VS-het-moc-dem-rot (BẮT).
- Nghi ngờ thu_GIAO3.js:475: `--day-du` xanh (thu_GIAO3 5,4 s); vòng 2 đọc thêm: vế `man.chu(nutChay()) === 'Đối soát'` che (DoiSoat.jsx:35
  `setDangChay(true)` đồng bộ) → không sửa bài cũ (sửa = "Bài thử cũ sửa", phải hỏi chủ quán). Ghi Phát hiện.
- Nghi ngờ thu_DOISOATNHANH.js:96 viết cứng 'I7': BO_QUA không xuất khỏi doiSoat.js; đổi BO_QUA thì ca A1 đỏ — chủ ý báo cho người sửa thấy (K2 có thể
  xảy ra, nhưng rõ ràng). Không sửa.
- Nghi ngờ ca :138 (I9) xanh trên gốc: đúng — các ca 503 / treo cạnh nó đỏ trên gốc; ca này khoá "không chạy bước sau" sau khi đã vá.

## Soát độc lập — vòng 2 (agent general-purpose)
```
KHÔNG ĐẠT — chỉ còn lỗi NHẸ. Không lỗi nào đụng tiền, điểm, ví hay bảo mật, không lỗi nào ngoài Phạm vi. E1 và E2 đang chờ.
Hai (ba) lỗi vòng 1 đã sửa đúng: database.js:1599–1600 ném ngoài try (VS-het-moc-dem-rot đưa đúng hai dòng bản c7b375eb); ca soSach :186–190 +
VS-ngoai-luot-co-han; hồ sơ ÷50, tên ca B2 khớp cận.
LỖI TÌM ĐƯỢC:
1. server/database.js:1613 + :1599–1600 + :1619 — NHẸ · K4 (đường song song của lỗi vòng 1 số 3, ở lần thử lan > 0). Lỗi mạng xét conLuot không
   nhìn mốc het → baoRot "thu lai", chờ CHO_DOC_MS[lan], vòng sau ms <= 0 ném loiQuaHan ngoài try → dòng [KET-NOI] báo "thu lai" mà không có lần thử;
   thu_lai_hong / thu_lai_dat không tăng. Sửa gọn: conLuot = doc && lan < CHO_DOC_MS.length && (!han || han.het - Date.now() > CHO_DOC_MS[lan]) + ca lỗi
   mạng sát mốc.
2. trang_thai.md "## Kiểm" còn trống — chưa có bằng chứng npm test, --day-du, giả lập quầy, dot_bien.py. NHẸ (hồ sơ).
3. trang_thai.md — ba NGHI NGỜ vòng 1 chưa được trả lời (thu_GIAO3.js:475; 'I7' viết cứng; ca :138). NHẸ.
NGHI NGỜ:
- K1 trang_thai.md:13 "TÁI HIỆN ĐƯỢC" — thật ra câu bị ÉP treo; nên ghi "dựng được bằng câu ép treo".
- tongHop / tienTheoSo Promise.all: khi lượt ném 503 / bo_giua, câu anh em vẫn chạy vòng đọc lại (chặn bởi het ≤ 50 s) — có thể nhiều dòng qua_han.
- reports.js:386–387 'close' gắn sau authenticate — câu authenticate không hạn giờ; ngoài Phạm vi → Phát hiện.
- Xác nhận "đọc lại là yêu cầu mới, độc lập": @libsql/core config.js:56–64 preferHttp; hrana-client 0.5.6 http/client.js:52–58 _endpointPromise =
  Promise.resolve (protocol 2); http/stream.js:248 mỗi stream một fetch.
NGHIỆM THU: 11/14 · thiếu D2 (vế bộ kiểm + giả lập), E1, E2 (chờ).
BÀI HỌC:
- KHOÁ: sửa nhánh "hết mốc / quá hạn" ở lần thử ĐẦU → ca cùng điều kiện ở lần thử SAU + đột biến.
- NGUYÊN TẮC: vòng lặp có "còn lượt" lẫn "còn giờ" → MỘT vị từ conLuot cho MỌI loại lỗi (K4 · BAN-HANG-1).
- NGUYÊN TẮC: NGHI NGỜ của vòng soát trước phải được trả lời trong trang_thai.
```

## Vòng sửa 2 (4fb68b7) — theo soát vòng 2
- Lỗi 1: `conLuot` MỘT vị từ `(!han || han.het − bây giờ > chờ)` cho mọi loại lỗi + ca "B2 lỗi mạng sát mốc" (đỏ trên gốc và trên bản vòng 1) + đột biến
  VS-moc-chi-qua-han.
- Lỗi 2, 3 + nghi ngờ K1 :13: đã ghi ở trên / mục Kiểm.
- Nghi ngờ Promise.all: chấp nhận — mọi câu anh em bị chặn bởi mốc het (≤ 50 s, không treo); nhiều dòng qua_han cho một lượt chỉ là log. Phát hiện.

## Phát hiện (ngoài Phạm vi / không sửa)
- `server/middleware/auth.js` authenticate hỏi kho KHÔNG hạn giờ, và `res.on('close')` (reports.js) gắn sau authenticate → nếu Turso treo ngay câu
  xác thực thì màn vẫn chờ tới 60 s rồi tự bỏ (không treo mãi). Ngoài Phạm vi (Cấm: không thêm hạn cho câu đọc ngoài Đối soát).
- `cong_cu/thu_GIAO3.js:475` dò `startsWith('[DOISOAT]')` — nay khớp sớm ở dòng `bat_dau`; vế nút "Đối soát" che nên chưa đỏ oan. Nếu đỏ thất thường:
  đổi sang mẫu dòng cuối `/^\[DOISOAT\] ngay /` (cần mục "Bài thử cũ sửa").
- Lượt bị huỷ giữa chừng (503 / bo_giua): câu anh em trong Promise.all của tongHop vẫn chạy tới mốc het → có thể vài dòng qua_han cho một lượt.
- Yêu cầu HTTP libsql treo KHÔNG huỷ được (libsql 0.4.3 execute không nhận tín hiệu) — chỉ thôi chờ; `[CHAM] · đang chờ k câu` cho thấy số câu còn treo.

## Soát độc lập — vòng 3 (chỉ phần vòng sửa 2; agent general-purpose)
```
KHÔNG ĐẠT — chỉ lỗi NHẸ (không tiền / điểm / ví / bảo mật / ngoài Phạm vi). E1, E2 chờ.
Phần vá vòng 2 đúng: database.js:1613 MỘT vị từ; VS-moc-chi-qua-han đưa đúng dòng của 189bd256; ca mới kiểm hành vi, đỏ trên gốc (gửi 3 · hỏng 0 → 1).
LỖI TÌM ĐƯỢC:
1. trang_thai.md:127 ghi "Lỗi 2, 3 … đã ghi ở trên / mục Kiểm" nhưng "## Kiểm" vẫn "(điền sau khi chạy)" — K1, NHẸ.
2. thu_DOISOATNHANH.js thiếu ca K5 "lỗi MẠNG trong lượt, CÒN NHIỀU GIỜ → vẫn đọc lại"; đột biến (!han || (quaHan && …)) sẽ SỐNG — K5 + K3, NHẸ.
NGHI NGỜ: neo VS-qua-han-khong-doc-lai chết từ 4fb68b7 tới 7078e9c (bộ đột biến chưa chạy trước commit vòng 2); ca mới chỉ phủ lan = 0;
  lỗi mạng sát mốc nay ra 503 KHO_MAT_KET_NOI thay vì DOI_SOAT_QUA_HAN (hợp lý — màn xử lý cả hai).
K4: CHO_DOC_MS chỉ một vòng đọc lại (query); run / nemLoiGhi không thử lại. K5 không truyền han: `!han` → như gốc. Ghép main 4d994d47 không hỏng phần việc.
NGHIỆM THU: 11/14 · thiếu D2 (vế bộ kiểm + giả lập), E1, E2 (chờ).
BÀI HỌC:
- KHOÁ: siết vị từ thử lại theo điều kiện mới → mỗi loại lỗi qua vị từ có cặp ca "ngay dưới mốc → không thử" / "dư giờ → vẫn thử" + đột biến từng vế.
- NGUYÊN TẮC (K1): "đã ghi ở mục X" chỉ viết sau khi mục X có nội dung.
- NGUYÊN TẮC (K4 TU-CHAY-5): sửa dòng có neo đột biến → chạy bộ đột biến TRƯỚC khi commit vòng sửa.
```

## Vòng sửa 4 (dc8d38b, 82f7396) — chat soát thay (LUAT §6.5: hết 3 vòng, lần soát cuối chỉ lỗi NHẸ)
- Lỗi 1: mục "## Kiểm" đã điền số thật (ở trên).
- Lỗi 2: ca `B1 lỗi mạng trong lượt, còn nhiều giờ → VẪN đọc lại` (gửi 2, thu_lai_dat +1) + đột biến VS-mang-trong-luot-khong-doc-lai (BẮT).
- Nghi ngờ neo chết: neo VS-qua-han-khong-doc-lai sửa ở 7078e9c, cả bộ 25 đột biến chạy lại trên HEAD → 25/25 BẮT.
- Nghi ngờ lan = 0: vị từ không phụ thuộc lan (một biểu thức) — ca lan 1 không thêm. Mã lỗi mạng sát mốc = KHO_MAT_KET_NOI: giữ (đúng tên lỗi).
SOÁT LẦN CUỐI: chat soát thay

## Nghiệm thu — đếm từng mục
| Mục | Bằng chứng |
|---|---|
| A1 | thu_DOISOATNHANH.js ca A1 ngay / tuan / thang (bat_dau, buoc từng bước đúng thứ tự, dòng cuối giữ dạng, chỉ tên + số) + hai lượt chồng nhau; đột biến BV-log-bat-dau, BV-log-buoc, BV-buoc-D2, BV-buoc-sao-ke, BV-ngu-canh-luot |
| A2 | ca A2 (treo → đang chờ 1; câu ném lỗi → đang chờ 0) + thu_KETNOI1 F1; BV-dang-cho-log, VS-dang-cho-chi-khi-xong, BV-dang-cho-kn1 |
| B1 | ca H (15 000), C1/B1 (503 DOI_SOAT_QUA_HAN đúng bước, 1 + 2 lần gửi, log qua_han, treo lần đầu rồi đọc lại được, bước I9), lỗi mạng còn nhiều giờ vẫn đọc lại; ke_hoach §2 trả lời "chỉ thôi chờ, không huỷ HTTP" |
| B2 | ca H (50 000 < 60 000; 3 × 15 s + 0,8 s < 50 s), B2 lượt dài → 503 trong [hạn − 1 câu, hạn + 150 ms], không gửi thêm, hết mốc trước khi gửi, lỗi mạng sát mốc |
| B3 | ca B3 (HTTP thật, khách bỏ ở 0,4 s → bo_giua, không bước sau); BV-bo-giua, BV-tin-hieu-route |
| B4 | ca B4 (api.js thật: lời máy chủ, code DOI_SOAT_QUA_HAN, 1 yêu cầu) + mẫu catch / finally DoiSoat.jsx |
| C1 | khả năng (1) dựng được bằng câu ép treo (gốc TREO — đỏ); khả năng (2) dữ liệu cũ không treo (xanh trên gốc); HTTP libsql remote CHƯA KIỂM — mục C1 ở trên |
| C2 | không tìm được nguyên nhân gốc trên Turso → B lo "không treo", A cho số đo; BV-han-cau / BV-ngu-canh-luot đưa lỗi treo cũ trở lại; CHƯA KIỂM ghi ở báo cáo |
| C3 | do_doisoat.js --tre 0 --goc / --ra ngày / tuần / tháng → cmp GIỐNG HẾT (76.840 byte, đỏ 82 / 142 / 1.042) |
| D1 | ca D1 (0,7 × hạn câu → không lỗi, 1 lần gửi) + các lượt A1 không có qua_han |
| D2 | ca D2 query / run / soSach không hạn; VS-han-mac-dinh-moi-duong, VS-ngoai-luot-co-han; `--day-du` PASS 130 (giả lập quầy xanh) |
| E1 | npm test, --day-du, cong.js chay ĐẠT (mục Kiểm); bang_chung_do SỐ CA 39 / 102 |
| E2 | hai thao tác cho chủ quán ở báo cáo dưới |

## Bài học (bước 11)
1. Ca đo thời gian bị rút giờ: hằng số không rút (CHO_DOC_MS 0,8 s) làm sai quan hệ hạn câu / hạn tổng — bài đỏ bất ngờ ở lần chạy đầu (B1 gửi 2 lần thay vì 3).
   → **NGUYÊN TẮC** (K3, đã có dòng gần: "Ca PHÉP TÍNH chọn số để trần không che lỗi"): đề xuất thêm vào KHUON_LOI.md K3 — "rút giờ trong bài thử: giữ
   đúng QUAN HỆ giữa các hằng (rút và không rút), có ca khoá quan hệ đó trên giá trị THẬT; tên ca nói đúng cận máy kiểm (DOISOAT-NHANH: 3 × 300 + 800 > 1000)". Ngoài Phạm vi → đề xuất.
2. Thêm hạn giờ "chỉ trong lượt" nhưng thiếu ca cho cùng cửa NGOÀI lượt (soát vòng 1) và thiếu ca "dư giờ vẫn thử" (soát vòng 3).
   → **KHOÁ** đã làm trong Phạm vi: ca D2 soSach + ca lỗi mạng còn nhiều giờ + đột biến VS-ngoai-luot-co-han, VS-mang-trong-luot-khong-doc-lai.
   → **NGUYÊN TẮC** đề xuất K5: "siết một vị từ (thử lại / chặn) theo điều kiện mới → mỗi loại đầu vào qua vị từ một cặp ca ngay dưới / dư, mỗi vế một đột biến".
3. Vòng đọc lại có hai điều kiện (còn lượt, còn giờ) mà vế giờ chỉ gắn với một loại lỗi (soát vòng 2) — đã có NGUYÊN TẮC K4 "MỘT vị từ" (BAN-HANG-1). **BỎ** (đã có khuôn).
4. Sửa dòng code có neo đột biến mà chưa chạy bộ đột biến trước commit (neo VS-qua-han-khong-doc-lai chết một commit). → **KHOÁ** đề xuất ngoài Phạm vi:
   cổng `tu_chay/cong.js` chạy `dot_bien.py --kiem-neo` (mọi neo khớp đúng số lần) ở HEAD — giống `viec/HOC-2b/kiem_neo.py`; ca đỏ: neo khớp 0 lần → ✗.
5. Thêm dòng log cùng tiền tố `[DOISOAT]` với dòng bài cũ dò `startsWith` (thu_GIAO3:475) → **NGUYÊN TẮC** đề xuất K4: "thêm log mới cùng tiền tố → grep mọi chỗ dò tiền tố".
6. Người gác chặn: B-BIMAT-CHU (chạy bài có khoá thử của bài trước khi commit — làm đúng luật: commit rồi chạy), B-PHANTICH (lệnh chạy script nối `&&` / `|` sed / redirect),
   B-CD-VITRI, B-CHUONGTRINH (`until` trong Monitor), GIT-LENH (stash), GIT-CHECKOUT (`HEAD --`), FIND-CAM (`find -exec`). Đều do lệnh viết sai khuôn, không lách. **BỎ**.
7. Kho nông làm thu_BH2 đỏ (lần 2 sau GIAO-3) → **KHOÁ** đề xuất ngoài Phạm vi: skill bước 6 chạy `git rev-parse --is-shallow-repository` → true thì `--unshallow` trước npm test.
8. Hồ sơ trỏ tới mục còn trống ("đã ghi ở mục Kiểm") → NGUYÊN TẮC K1 đề xuất (một dòng): "viết 'đã ghi ở X' chỉ sau khi X có nội dung".
Dọn: không lời dặn nào trong KHUON_LOI.md / CLAUDE.md được phép kiểm mới của việc này làm thay.

## Báo cáo 7 mục
```
VIỆC:        DOISOAT-NHANH — Đối soát trên máy chủ thật treo ở cùng một bước: đo từng bước, hạn giờ, không bao giờ treo
ĐÃ SỬA:      server/database.js doCau — đếm `cho` (câu đã gửi chưa trả lời, bớt trong finally); doYeuCau [CHAM] thêm "· đang chờ <k> câu"
             server/database.js query(sql, params, han = null) — coHan (Promise.race) mỗi lần gửi chờ min(ms, het − bây giờ); hết mốc trước khi gửi → ném
               ngoài try; quá hạn đi vòng đọc lại CHO_DOC_MS có sẵn; MỘT vị từ conLuot (còn lượt + còn giờ, mọi loại lỗi); hết → KHO_QUA_HAN (không đổi
               thành mất kết nối, không thay kết nối). Không truyền han = như cũ.
             server/utils/doiSoat.js — HAN { CAU_DOI_SOAT_MS 15000, LUOT_DOI_SOAT_MS 50000 }; ngữ cảnh lượt (AsyncLocalStorage) — chiDoc trong lượt truyền han,
               KHO_QUA_HAN → 503 DOI_SOAT_QUA_HAN "Đối soát quá lâu ở bước <bước> — thử lại sau" + log qua_han; buoc() bọc từng bước: bo_giua khi khách bỏ,
               log "buoc <ten> · <ms> ms · <n> câu"; log bat_dau; dòng cuối đếm câu của RIÊNG lượt; D2 tách ganNhanD2; ngoài lượt (soSach /daily, /so-sach) không hạn
             server/routes/reports.js /doi-soat — AbortController theo res 'close' → tinHieu
             cong_cu/thu_DOISOATNHANH.js (mới, 39 ca), cong_cu/thu_KETNOI1.js (regex [CHAM] dạng mới), kiem_tra_truoc_khi_giao.js (THÊM một dòng chạy bài mới)
BÀI THỬ:     thu_DOISOATNHANH trên gốc main 7da9ba9a → ĐỎ 31/39 (treo ở C1 (1), B4 treo, không log bước, không "đang chờ", không bo_giua…); sau vá XANH 39/39.
             thu_KETNOI1 trên gốc → ĐỎ 2 (F1 dạng [CHAM]); sau vá 102/102. Đột biến 25/25 BẮT. C3 đối chứng JSON giống hệt.
ĐÃ RÀ K4:    grep "db.query\|db.queryOne" trong doiSoat.js → 1 chỗ (chiDoc) — mọi câu Đối soát qua đó; grep "await [a-zA-Z_.]*(" bat_bien.js / doiSoat.js /
             doiSoatGiao → chỉ chờ câu kho; grep "CHO_DOC_MS" database.js → 1 vòng đọc lại (query); grep "\[CHAM\]" cong_cu → thu_KETNOI1 (đã sửa);
             grep "\[DOISOAT\]" cong_cu → thu_GIAO3:475 dò tiền tố (che bởi vế nút — Phát hiện), :476 regex dòng cuối (giữ dạng). Đã xử lý hết.
CHƯA KIỂM:   - Nguyên nhân gốc chưa tìm ra — chờ log [DOISOAT] buoc / qua_han trên Render. Máy không có máy chủ libsql (sqld) để dựng kho qua HTTP;
               câu "không bao giờ trả lời" chỉ dựng bằng kho giả.
             - Hạn giờ CHỈ THÔI CHỜ: yêu cầu HTTP libsql treo không huỷ được (libsql 0.4.3 execute không nhận tín hiệu) — vẫn chiếm socket tới khi hệ điều hành cắt.
             - Đọc lại trên Turso thật có thoát được câu treo không (yêu cầu mới, độc lập — soát vòng 2 đọc hrana-client xác nhận) chưa đo trên máy chủ thật.
             - 'close' khi khách bỏ qua Cloudflare + Render chưa thử thật; khách bỏ trong lúc xác thực thì lượt vẫn chạy (Phát hiện).
             - Màn không đổi: hai thao tác tay cho chủ quán ở dưới.
GIT:         82f7396d DOISOAT-NHANH: bang chung do vong sua 4 tren goc main 7da9ba9a (SO CA 39)
             dc8d38b7 DOISOAT-NHANH: vong sua 4 (chat soat thay) — ca loi mang trong luot con nhieu gio van doc lai + dot bien
BÀI HỌC:     KHOÁ 3 (1 đã làm trong Phạm vi: ca soSach / lỗi mạng dư giờ; 2 đề xuất: kiểm neo đột biến ở cổng, --unshallow trước npm test) ·
             NGUYÊN TẮC 4 (đề xuất: rút giờ giữ quan hệ hằng; cặp ca dưới / dư cho vị từ siết; log cùng tiền tố; "đã ghi ở X") · BỎ 2 — chi tiết ở ## Bài học
```

## Hai thao tác cho chủ quán (E2) — sau khi gộp và Render chạy bản mới
1. Quản lý › Báo cáo › Đối soát › chọn Ngày 18/11 › bấm Đối soát → trong ≤ 60 giây phải ra kết quả, HOẶC dòng đỏ "Đối soát quá lâu ở bước … — thử lại sau"
   (không còn "Đang đối soát…" mãi). Bấm lại được.
2. Render › Logs › tìm `DOISOAT` → chụp các dòng `bat_dau`, `buoc …`, `qua_han …` (nếu có) gửi chat — dòng `qua_han buoc <X> cau <n>` chỉ đúng câu treo.
   Tìm thêm `CHAM` → dòng có "đang chờ k câu".

HEAD ĐÃ KIỂM: 82f7396d
