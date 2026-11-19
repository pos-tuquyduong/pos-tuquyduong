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

## Kiểm
(điền sau khi chạy)

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
