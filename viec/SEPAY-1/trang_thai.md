# SEPAY-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (31.10.2026)

- Nhánh: `viec/SEPAY-1`; cây sạch.
- HEAD `912576e` · FETCH_HEAD `912576e` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  912576e PHIEU: SEPAY-1
  18ee394 TIEN-DO: KHO-2b, BH-CKTAY-1, KH-QUAY-2, KH-MUA-1 xong; mo SEPAY-1, MANKHACH-1, KHO-IN-1, KH-SDT-1, them KHO-2c; quyet dinh 31.10 (SePay, man khach, SDT moi tu 0, khoi phuc khi dong cua, sua phieu nhan) — so v51
  596c346 Merge pull request #60 from pos-tuquyduong/viec/KH-MUA-1
  ```

## Bước 1 — làm tiếp (01.11.2026)

- Nhánh `viec/SEPAY-1`; cây sạch. HEAD `f6663aa` · FETCH_HEAD `f6663aa` — bằng nhau, không kéo (hook mở phiên đã kéo `912576e → f6663aa`).
- `git log --oneline -3`:
  ```
  f6663aa SEPAY-1: tai lieu SePay (Webhook + HMAC-SHA256) — chat lay tu developer.sepay.vn 01.11
  5f4ef1b SEPAY-1: ke hoach cho duyet + trang thai (cau hoi: tai lieu SePay bi chan mang, bai cu duoi cong sepay, mac dinh cong tac)
  912576e PHIEU: SEPAY-1
  ```
- Chủ quán trả lời 01.11: Q1 tài liệu ở `tai_lieu_sepay.md`; Q2 đồng ý phương án A; Q3 đồng ý mặc định payOS. Coi là duyệt kế hoạch → làm tiếp
  từ bước 4. Chỉnh kế hoạch theo tài liệu: `ke_hoach.md` mục 7.

## Tiến độ

- 31.10: Bước 2 (đọc) xong · Bước 3 (kế hoạch) xong: `ke_hoach.md`, đã có agent phụ chỉ đọc soát 4 câu (sửa đè ở mục 6 của kế hoạch).
  Phiếu dặn **Chờ duyệt kế hoạch** → DỪNG ở bước 3.
- 01.11: chủ quán trả lời Q1–Q3 → làm tiếp. Bước 4 bài thử `cong_cu/thu_SEPAY1.js` ĐỎ trên gốc (9 đạt · 51 hỏng — `bang_chung_do.txt`).
  Bước 5 code: `vietQr.js`, `sepay.js`, `congQr.js` (mới), `payos.js`, `giuCho.js`, `thanh-toan.js`, `index.js`, `doiSoat.js`; chữ:
  `env.example`, `HOP_DONG_API_KH.md` v6, `cai_dat_sepay.md`; bộ kiểm chạy bài mới. Bài thử XANH 60 đạt · 0 hỏng.
  Bước 6 `npm test`: PASS 89 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có sẵn: route GET có lệnh ghi ở packages.js / products.js / sync.js — không
  thuộc việc này). Không đụng `client/` → không build.
- Đột biến `python3 viec/SEPAY-1/dot_bien.py`: ĐỐI CHỨNG XANH (sp 60 · p3 100) · TỔNG 26 · BẮT 26 · SỐNG 0 · HỎNG 0 · LẠC 0.

## Chỗ vá → đột biến (cổng A17 / A18)

| Chỗ vá | Đột biến (tên NGUYÊN) | Ca bắt |
|---|---|---|
| `sepay.js kiemBao` so chữ ký | `BV-chu-ky` | C1 |
| `sepay.js kiemBao` ký trên thân THÔ | `VS-ky-lai-json` | C3 298 s (thân thụt lề) |
| `sepay.js kiemBao` mốc giờ | `BV-moc-gio` · `VS-moc-gio-mot-phia` · `VS-nguong-6-phut` · `VS-nguong-290-giay` | C3 302 s · C4 · C3 302 s · C3 298 s |
| `sepay.js docBao` khoá chống trùng | `BV-chong-trung` | C5 / C6 |
| `sepay.js` mã phiên `MA_PHIEN` | `VS-ma-dau-chuoi` · `VS-ma-khong-chan-so` · `VS-ma-chi-code` | C11 · C10b · C11 |
| `sepay.js daCauHinh` dạng BIN / số TK | `BV-dang-bin-so-tk` | A2 sai dạng |
| `thanh-toan.js` webhook SePay: tiền ra, nguồn | `VS-tien-ra` · `VS-nguon-sepay-thanh-payos` | C8 · A7 / C5 |
| `thanh-toan.js xuLyTienVe`: hai cổng, 5xx, câu "đã nhận", lệch tiền (payOS cũ) | `BV-hai-cong` · `BV-5xx-tra-loi` · `VS-tra-202` · `BV-lech-tien-ham-chung` | C14b · C16 · C8 · thu_P3 B6 |
| `index.js` thân thô | `BV-raw` | T1 |
| `congQr.js` mặc định, giá trị lạ | `VS-cong-mac-dinh-sepay` · `VS-cong-la-thanh-payos` | A1 · A3 |
| `giuCho.js` hỏi cổng / một chỗ chọn / số tiền QR | `BV-giuCho-kiem-cau-hinh` · `VS-doc-cong-ngoai` · `VS-so-tien-tong` | A2 · A4 · B1 |
| `vietQr.js` CRC / QR động | `VS-crc-sai` · `VS-qr-tinh` | B2 · B1 |
| `doiSoat.js` nguồn | `BV-nguon-doi-soat` | D1 |
| `doiSoat.js` dòng "hai cổng" → CẦN XEM (vòng sửa 1) | `BV-hai-cong-can-xem` · `VS-can-xem-moi-khong-hoan` | D2 · D2 |
| `thanh-toan.js` "hai cổng" chỉ khi cổng này chưa báo, hai chiều (vòng sửa 2) | `BV-hai-cong-da-bao` · `VS-hai-cong-mot-chieu` | C14c · C14d |
| `thanh-toan.js` thân thiếu id / không lưu số dư (vòng sửa 2) | `BV-bao-thieu-id` · `BV-luu-so-du` | C9b · C5b |

## Câu hỏi

- **Q1 — Máy không đọc được tài liệu SePay.** `developer.sepay.vn` và `docs.sepay.vn` báo `ENOTFOUND` từ máy mây (mạng môi trường chặn hai
  tên miền). Phiếu dặn đọc lại tài liệu, không tin trí nhớ → các chi tiết ở `ke_hoach.md` mục 0 (tên header chữ ký + mốc giờ, chuỗi được ký,
  tên trường thân báo, câu trả "đã nhận") còn CHƯA ĐỌC. Đề xuất: chủ quán thêm `developer.sepay.vn`, `docs.sepay.vn` vào danh sách tên miền
  được phép của môi trường (cài đặt môi trường trên claude.ai/code → mạng), HOẶC dán vào file `viec/SEPAY-1/tai_lieu_sepay.md` nguyên văn phần
  "Webhook" + "Xác thực HMAC-SHA256" của tài liệu SePay. Có một trong hai thì máy làm tiếp.
- **Q2 — Bài thử cũ dưới cổng SePay (nghiệm thu E).** Đề xuất A: bài cũ (`thu_P3`, `thu_BH2`, `thu_KHMUA1`, `thu_HOPDONG_KH`) ghim cổng
  payOS và chạy nguyên; các luồng ví + QR, huỷ, xác nhận tay, hết hạn, đơn App, hoàn, đối soát chạy lại dưới SePay trong `thu_SEPAY1`.
  B: thêm chế độ SePay vào từng bài cũ (~160 dòng thử thêm, vượt ngân sách 400). Máy đề xuất A.
- **Q3 — Mặc định công tắc.** Không đặt `CONG_QR` → **payOS** (gộp xong mà chưa điền khoá SePay thì quầy vẫn chạy như hôm nay; bật SePay
  bằng `CONG_QR=sepay`). Chủ quán xác nhận hoặc chọn mặc định SePay.
- Ghi chú môi trường: công cụ đọc tài liệu môi trường (`read_documentation`) bị người gác chặn (CC-LA) — máy không mở được trang hướng dẫn
  cài mạng cho chủ quán.

## Phát hiện (ngoài Phạm vi — không sửa)

- (soát vòng 1) Dòng Đối soát "đã xác nhận tay trước … KHÔNG hoàn" (có từ P3) nằm ở nhóm ĐỎ ("hoàn hoặc nạp") — dễ hoàn nhầm. Không đổi vì
  nghiệm thu E "đối soát cũ không đổi"; nên chuyển sang CẦN XEM ở việc sau (một dòng ở `doiSoat.js` phepTienVe).

- Chữ "payOS" người dùng thấy ngoài Phạm vi: tờ in `client/src/utils/hoaDon.js:27` và mặc định `server/database.js:1210`
  (`invoice_chu_ck` = "Chuyển khoản (payOS)") — đổi được ở Cài đặt chữ hoá đơn, sẽ ghi vào `cai_dat_sepay.md`; câu lỗi
  `server/routes/orders.js:220` "Chuyển khoản phải qua QR payOS" (`CK_PHAI_QUA_PAYOS`); nhãn sao lưu `server/routes/backup.js:91`.

## Soát độc lập — vòng 1 (agent general-purpose, 01.11) — chép nguyên báo cáo

```
KHÔNG ĐẠT

LỖI TÌM ĐƯỢC:
- viec/SEPAY-1/cai_dat_sepay.md:59-60 (mục 5) mâu thuẫn với dòng 17 (mục 1.3, bật "Bỏ qua giao dịch không có mã thanh toán") — K1. Mục 5 hứa:
  khách sửa / xoá nội dung TQD thì Đối soát hiện dòng vàng "SePay giao dịch … không thuộc phiên nào". Khi đã bật lọc ở 1.3, SePay không gửi
  giao dịch `code === null` (tai_lieu_sepay.md:26) → POS không thấy khoản đó; đơn App khách sửa nội dung → `tien_ve_cho_doi_soat` false.
  Phiếu cũng mâu thuẫn: Nghiệm thu C đòi ghi khong_phien cho giao dịch không mã, F đòi bật lọc. Đề xuất: TẮT lọc + sửa câu mục 5. Cần chủ quán.
- server/utils/doiSoat.js:229-233 — chua_khop luôn vào ĐỎ (canXem chỉ khong_phien, dòng 232), chú thích 227 nói ĐỎ = "hoàn hoặc nạp". Lý do mới
  "cùng một khoản báo qua hai cổng … KHÔNG hoàn" (thanh-toan.js:135-136) nằm trong nhóm "phải hoàn" — K4. Xảy ra hằng ngày khi bật webhook SePay
  trước CONG_QR=sepay / giữ SePay sau khi về payOS. (Câu "đã xác nhận tay … KHÔNG hoàn" có sẵn cũng cùng lỗi.)
- viec/SEPAY-1/cai_dat_sepay.md:44-45 và env.example:49 — K1. "QR SePay … về muộn, máy chủ vẫn nhận và chốt được" sai một phần: chotPhien
  (giuCho.js:90) từ chối khi het_han <= getNow(); giữ khoá chỉ có tác dụng ghi khoản đó vào Đối soát.
- Nghiệm thu E thiếu bằng chứng — K3: phương án A hứa chạy lại dưới SePay "ví + QR, huỷ, xác nhận tay, hết hạn, đơn App, hoàn, đối soát";
  thu_SEPAY1.js không có ca hoàn, đơn App chỉ `qr` (thu_SEPAY1.js:367), không có `vi_qr`.

NGHI NGỜ:
- sepay.js:12 MA_PHIEN chỉ chặn chữ số dính ngay sau mã; ngân hàng gộp số sau mã ngắn ("TQD12"+"34") → khớp nhầm phiên 1234; so số tiền đúng
  con_lai (thanh-toan.js:125) chặn phần lớn. Khả năng thấp, không có ca.
- Không so accountNumber (kế hoạch 7.4): công ty SePay theo dõi thêm tài khoản riêng của chủ → chuyển TQD<n> vào đó vẫn chốt đơn. Nên để
  chủ quán biết.
- cai_dat_sepay.md:10 tên menu "Cấu hình công ty → Cấu trúc mã thanh toán" không có trong tai_lieu_sepay.md (K1).
- Dòng khong_phien "SePay báo tiền ra" hiện chữ "về <tiền>" (doiSoat.js:233) — nhẹ.
- tai_lieu_sepay.md là bản tóm tắt; công thức chữ ký / câu trả dựa vào đó.

NGHIỆM THU:    5/6 mục có bằng chứng · mục thiếu: E (hoàn dưới cổng SePay; đơn App vi_qr qua SePay)

CHƯA SOÁT ĐƯỢC: chạy lại bài trên gốc (người gác chặn symlink); chỉ chạy lại 2/26 đột biến (BẮT 2); tài liệu SePay gốc; payOS có báo
giao dịch không qua link của nó không; www trên Render; tờ in thật.

BÀI HỌC:
- KHOÁ: tài liệu hứa "Đối soát hiện dòng X" thì có ca chạy đúng cấu hình đã dặn mà vẫn thấy dòng đó — hoặc cấm hứa.
- NGUYÊN TẮC (K4): thêm lý do mới vào bảng sự kiện ("KHÔNG hoàn") thì rà nơi xếp nhóm ở Đối soát.
- NGUYÊN TẮC (K1): hướng dẫn cài là khẳng định về hành vi — mỗi câu "máy sẽ làm X" trỏ tới một ca chạy đúng cấu hình hướng dẫn dặn; soát
  mâu thuẫn giữa các mục trong cùng file.
- NGUYÊN TẮC (K3): luồng nào phương án chủ quán duyệt liệt kê thì mỗi luồng một ca — đếm danh sách, không lấy mẫu.
```
(Bản trên rút gọn phần "Kết quả từng mục soát" 1–8 của báo cáo — các mục đó không nêu lỗi mới ngoài danh sách LỖI / NGHI NGỜ.)

## Vòng sửa 1 (01.11) — theo soát vòng 1

- Lỗi 2 (K4): dòng "cùng một khoản báo qua hai cổng … KHÔNG hoàn" chuyển sang CẦN XEM — cụm `LY_DO_HAI_CONG` đặt MỘT chỗ ở `congQr.js`, câu ở
  `thanh-toan.js` và phép xếp nhóm ở `doiSoat.js` cùng dùng. Dòng "đã xác nhận tay … KHÔNG hoàn" có từ trước GIỮ ở ĐỎ (nghiệm thu E: đối soát cũ
  không đổi) — ghi Phát hiện. Ca D2 ×2 (đỏ trên code trước vòng sửa: 64 đạt · 1 hỏng); đột biến `BV-hai-cong-can-xem`, `VS-can-xem-moi-khong-hoan`.
- Lỗi 1, 3 (K1): sửa `cai_dat_sepay.md` mục 1.2 (tên menu SePay chưa đọc được), mục 4 (tiền về muộn: trong hạn tự chốt, quá hạn ghi Đối soát),
  mục 4 cuối (dòng hai cổng ở CẦN XEM, kể cả lúc cài), mục 5 (đã bật lọc "bỏ qua không mã" → khách XOÁ mã thì SePay không báo, Đối soát không có
  dòng, xác nhận tay; đơn App hết hạn thành đã huỷ). `env.example`, chú thích `congQr.js` sửa cùng câu.
- Lỗi 4 (K3, nghiệm thu E): thêm E2b (hoàn đơn chốt qua SePay: ví nhận lại đúng 30.000, đơn refunded), C18b ×2 (đơn App `vi_qr` qua SePay).
- Bài thử 65 đạt · 0 hỏng; trên gốc 9 đạt · 56 hỏng. Đột biến: TỔNG 28 · BẮT 28. `npm test`: PASS 89 · FAIL 0 · CẢNH BÁO 1 (có sẵn).
- Không làm (nghi ngờ của người soát, ghi lại): mã ngắn bị ngân hàng dính số phía sau (chặn chủ yếu bằng so đúng số tiền); không so
  `accountNumber` (kế hoạch 7.4); chữ "về" cho dòng tiền ra (chỉ khi bật nhầm sự kiện tiền ra); gọn `xuLyTienVe` (trả kết quả thay vì ghi `res`).

## Câu hỏi (không chặn — máy đã làm theo phiếu, chủ quán quyết khi rảnh)

- **Q4 — Lọc "Bỏ qua giao dịch không có mã thanh toán" trên SePay.** Phiếu (mục F) dặn BẬT; máy làm theo. Hệ quả: khách xoá mã `TQD…` khi chuyển
  thì POS không thấy khoản đó (không tự chốt, Đối soát không có dòng) — nhân viên tra app ngân hàng rồi xác nhận tay, như hôm nay. TẮT lọc thì
  mọi tiền vào (kể cả tiền không liên quan đơn) hiện ở Đối soát mục CẦN XEM — đầy đủ hơn nhưng nhiều dòng hơn. Máy không sửa code gì cho lựa
  chọn này (code đã ghi `khong_phien` sẵn). Đề xuất: giữ BẬT như phiếu; nếu thấy sót tiền thì tắt trên trang SePay, không cần sửa code.
- **Q5 — Có so số tài khoản nhận không?** Máy KHÔNG so (lý do ở `ke_hoach.md` 7.4). Nếu tài khoản SePay của quán theo dõi thêm tài khoản riêng
  của chủ quán, một khoản `TQD<n>` chuyển nhầm vào tài khoản riêng vẫn chốt đơn. Đề xuất: chỉ liên kết tài khoản quán với SePay.

## Soát độc lập — vòng 2 (agent general-purpose mới, 01.11) — chép báo cáo

```
KHÔNG ĐẠT
Chạy lại: bài thử trên bản chụp 912576e^ (git archive, chép thật) 9 đạt · 56 hỏng; HEAD 65 · 0; npm test PASS 89 · FAIL 0 · CẢNH BÁO 1 (có sẵn);
3 đột biến của máy (VS-ma-khong-chan-so, BV-hai-cong-can-xem, VS-moc-gio-mot-phia) BẮT; 5 đột biến tự viết (M8, M10 SỐNG).

LỖI TÌM ĐƯỢC:
- server/routes/thanh-toan.js:136-137 — "hai cổng" đoán chỉ từ sau.nguon !== t.nguon, không xét cổng này đã báo cho phiên đó chưa. payOS chốt,
  khách chuyển thêm lần 2 thật (id SePay khác) → cả hai báo SePay ghi "hai cổng … KHÔNG hoàn", xếp CẦN XEM (doiSoat.js:233) — khoản trả thừa
  bị dặn KHÔNG hoàn. K4. NẶNG (tiền). Sửa: chỉ coi "hai cổng" khi cổng t.nguon chưa có dòng nào cho ma_payos này; ca "payOS chốt → SePay 2 giao
  dịch → dòng thứ 2 vào ĐỎ".
- cong_cu/thu_SEPAY1.js:340-347 (C14b) chỉ một chiều; chiều ngược (SePay chốt, payOS báo sau) không có ca — đột biến M10 (chỉ chiều
  sepay-sau-payos) SỐNG 65/0. K3. NHẸ.
- viec/SEPAY-1/cai_dat_sepay.md:28 "CONG_QR chỉ đặt SAU khi thử xong bước 3" trái bước 3.1 (dòng 35 đặt CONG_QR=sepay để thử). K1. NHẸ.
- cai_dat_sepay.md:49-50 chỉ trích câu "đã chốt bằng báo payOS"; chiều ngược "đã chốt bằng báo SePay" không nhắc. K4. NHẸ.
- cai_dat_sepay.md:39 "401 = khoá sai" — 401 còn do lệch giờ > 300 s (sepay.js:27); dòng 38 "5–30 giây" không căn cứ. K1. NHẸ.
- cong_cu/thu_SEPAY1.js: không ca thân báo thiếu id / không phải JSON — đột biến M8 (bỏ `|| b.id == null`, thanh-toan.js:161) SỐNG. K3. NHẸ.

NGHI NGỜ:
- du_lieu (thanh-toan.js:121) lưu nguyên thân SePay gồm accumulated (số dư tài khoản quán) — nên bỏ trường đó khi ghi.
- congQr.js:12 CONG_QR chỉ dấu cách → 503 thay vì payOS. Rất nhẹ.
- Không so accountNumber (Q5), mã ngắn dính số (vòng 1) — đã ghi câu hỏi.
- dot_bien.py:76 symlink node_modules — người soát chỉ kiểm lại 3/28.

NGHIỆM THU: 6/6 mục có bằng chứng · mục thiếu: không (C còn lỗ chiều ngược "hai cổng").
CHƯA SOÁT ĐƯỢC: trọn 28 đột biến; payOS có báo lần chuyển thứ hai vào link đã trả không; tài liệu SePay gốc; tên menu SePay; www Render;
ngân hàng thật giữ mã TQD / khoá số tiền QR động.
BÀI HỌC:
- KHOÁ: suy luận "trùng báo giữa hai nguồn" phải có ca "cùng nguồn báo lần 2 (giao dịch khác)" cho kết quả khác ca "nguồn kia báo".
- NGUYÊN TẮC (K3): điều kiện hai chiều → mỗi chiều một ca + đột biến "chỉ một chiều".
- NGUYÊN TẮC (K1): hướng dẫn cài chạy được đúng thứ tự viết; soát chéo câu "chỉ làm X sau Y".
- NGUYÊN TẮC (bảo mật): ghi nguyên thân báo bên ngoài thì bỏ trường nhạy cảm không dùng (số dư).
```

## Vòng sửa 2 (01.11) — theo soát vòng 2

- Lỗi NẶNG (K4): "hai cổng" chỉ khi phiên do cổng KIA chốt VÀ cổng đang báo chưa có dòng nào cho phiên đó (`congCuaKhoa` ở `congQr.js` — một chỗ
  biết dạng khoá, `doiSoat.js` cũng dùng). Khách chuyển thêm lần thật → "phiên đang da_thu lúc tiền về" ở ĐỎ. Ca C14c + D2 (dòng ĐỎ); đột biến
  `BV-hai-cong-da-bao`.
- Chiều ngược (K3): ca C14d (SePay chốt, payOS báo sau → "đã chốt bằng báo SePay … hai cổng"; payOS báo lần 2 → "phiên đang da_thu"); đột biến
  `VS-hai-cong-mot-chieu` (đúng đột biến M10 người soát dùng).
- Thân báo thiếu id / không phải JSON: ca C9b; đột biến `BV-bao-thieu-id` (đúng M8).
- Nghi ngờ bảo mật đã làm: `du_lieu` không lưu `accumulated` (số dư tài khoản quán) — ca C5b, đột biến `BV-luu-so-du`.
- `cai_dat_sepay.md`: dòng `CONG_QR` khớp bước 3.1; bỏ "5–30 giây" (không căn cứ); 401 = chữ ký không qua (khoá sai hoặc lệch giờ > 5 phút);
  nhắc cả câu "đã chốt bằng báo SePay"; nói rõ dòng ĐỎ "phiên đang da_thu" mới là tiền phải hoàn.
- Không làm: `CONG_QR` chỉ dấu cách → 503 (an toàn, không đoán); gọn `xuLyTienVe` (ghi lại cho việc sau).
- Bài thử 70 đạt · 0 hỏng (trước vòng sửa 2: 66 · 4); trên gốc 9 · 61. Đột biến TỔNG 32 · BẮT 32 (31 trong lượt chạy đủ + `VS-nguon-sepay-thanh-payos`
  chạy riêng sau khi sửa neo — dòng mã xuống hàng làm neo HỎNG, K4). `npm test` PASS 89 · FAIL 0 · CẢNH BÁO 1 (có sẵn).

## Soát độc lập — vòng 3 (agent general-purpose mới, 01.11) — chép báo cáo

```
KHÔNG ĐẠT
Chạy lại: HEAD 70 · 0; gốc 912576e^ (git archive, chép thật cả node_modules) 9 · 61; npm test PASS 89 · FAIL 0 · CẢNH BÁO 1 (có sẵn);
3 đột biến vòng sửa (BV-hai-cong-da-bao, VS-hai-cong-mot-chieu, BV-hai-cong-can-xem) BẮT, đối chứng xanh; bài thử riêng trong nháp trên bản sao HEAD.

LỖI TÌM ĐƯỢC:
- server/routes/thanh-toan.js:127-128 và 135-140 — chỉ nhánh PHIEN_DA_CHOT + da_thu (dòng 138) gộp "hai cổng". Ba nhánh khác ghi chua_khop không
  xét cổng kia đã báo cùng khoản chưa: lệch tiền / hết hạn (127-128), "phiên đang huy" (140), và lần báo thứ hai sau khi cả hai cổng đã báo.
  Chạy thật qua chayDoiSoat: S1 hết hạn, hai cổng báo → ĐỎ ×2; S2 lệch 1.000đ → ĐỎ ×2; S3 đã huỷ → ĐỎ ×2; S5 khách chuyển thêm lần thật, hai
  cổng báo → ĐỎ ×2 "phiên đang da_thu". Một khoản thành hai dòng "phải hoàn / nạp". K4. NẶNG (tiền). Cách gọn: thay daBao bằng ghép cặp, áp cho
  MỌI lý do chua_khop: "hai cổng" khi số dòng tiền vào (khop/chua_khop) của cổng kia cho mã này nhiều hơn số dòng của cổng đang báo.
- viec/SEPAY-1/cai_dat_sepay.md:47-52, 59-60 — "dòng đỏ này mới là tiền phải hoàn", "lệch / hết hạn / huỷ → dòng đỏ để hoàn": trong cấu hình hai
  cổng (hướng dẫn gọi là bình thường lúc cài) một khoản ra hai dòng đỏ → làm theo là hoàn hai lần. K1 + K4. NẶNG, đi cùng lỗi trên.
- server/routes/thanh-toan.js:135 — daBao đếm MỌI dòng của cổng cho mã, kể cả khong_phien (tiền ra, báo trước khi có phiên). S7: SePay tiền ra mang
  TQD6, payOS chốt, SePay báo đúng khoản → ĐỎ "phiên đang da_thu" thay vì CẦN XEM. Chỉ khi cài nhầm sự kiện tiền ra / mã trùng. K4/K5. NHẸ. Sửa:
  lọc ket_qua IN ('khop','chua_khop').
- server/utils/doiSoat.js:234 — dòng khong_phien "SePay báo tiền ra" hiện "về 25.000đ" — sai nghĩa. NHẸ.
- server/utils/doiSoat.js:233 — xếp CẦN XEM bằng tìm cụm chữ trong ly_do; gọn hơn: ket_qua riêng (vd trung_cong). xuLyTienVe có biểu thức lồng 4
  tầng (136-140) và tự gọi res. NHẸ.

NGHI NGỜ:
- Lỗi NẶNG chỉ thành tiền thật khi payOS có gửi báo cho khoản lệch / quá hạn / đã huỷ / chuyển thêm (code P3 sẵn có đã giả định payOS báo lệch và
  quá hạn), chưa đọc tài liệu payOS.
- S4: payOS đã chốt; webhook SePay bật SAU lần chuyển thứ nhất; khách chuyển thêm, chỉ SePay báo → CẦN XEM "hai cổng … KHÔNG hoàn" trong khi phải
  hoàn. Hiếm.
- Hai báo SePay hai giao dịch khác nhau tới CÙNG lúc → cả hai thấy daBao = false → cả hai "hai cổng". Hiếm.
- Q5 (accountNumber), mã ngắn dính số: chủ quán chưa trả lời.

NGHIỆM THU: 6/6 mục có bằng chứng · mục thiếu: không. Vẫn KHÔNG ĐẠT vì lỗi NẶNG ở D/C.
CHƯA SOÁT ĐƯỢC: payOS có báo khoản lệch / quá hạn / huỷ / chuyển thêm không; trang SePay thật; chỉ chạy lại 3/32 đột biến; không chạy
`node tu_chay/cong.js chay`; không thử điện thoại / tờ in thật.
BÀI HỌC:
- KHOÁ: gộp trùng giữa hai nguồn báo phải áp cho MỌI nhánh ghi cùng loại dòng, có ca "hai nguồn cùng báo" cho từng nhánh: lệch, hết hạn, huỷ,
  chuyển thêm.
- NGUYÊN TẮC (K4): sửa một nhánh của biểu thức lồng nhiều tầng → liệt kê mọi nhánh anh em, hỏi từng nhánh.
- NGUYÊN TẮC (K1): câu "dòng ĐỎ = phải hoàn" phải đúng trong MỌI cấu hình hướng dẫn gọi là bình thường.
- NGUYÊN TẮC (đồng bộ): nhóm trên màn tiền xếp theo mã (ket_qua), không tìm cụm chữ trong lý do.
- NGUYÊN TẮC (K4): phép "đã có dòng X chưa" lọc đúng loại dòng.
```

## DỪNG — hết 3 vòng soát, còn lỗi tiền (LUAT_XAY_APP §6.5)

Trạng thái lúc dừng: HEAD là commit trạng thái này; bài thử 70 · 0, đột biến 32 · 32, `npm test` PASS 89 · FAIL 0 · CẢNH BÁO 1 (có sẵn). Chưa chạy
cổng `node tu_chay/cong.js chay`, chưa ghi `HEAD ĐÃ KIỂM`, chưa có báo cáo 7 mục — chờ chủ quán trả lời Q6.

## Câu hỏi (vòng 3 — CHẶN)

- **Q6 — Khi payOS và SePay CÙNG theo dõi một tài khoản, một khoản tiền có thể hiện HAI dòng đỏ ở Đối soát.**
  *Chuyện gì:* trong lúc cài (bật webhook SePay khi quầy còn chạy payOS) hoặc sau khi quay về payOS mà chưa tắt webhook SePay, một lần khách chuyển
  khoản bị CẢ HAI cổng báo. Khi khoản đó tạo được đơn, máy đã gộp đúng (một dòng vàng "KHÔNG hoàn"). Nhưng khi khoản đó KHÔNG tạo đơn (chuyển
  lệch số, chuyển sau 10 phút, chuyển sau khi huỷ, khách chuyển thêm), máy ghi hai dòng ĐỎ — nhìn như hai khoản phải hoàn, dễ hoàn hai lần.
  *Đề xuất của máy (làm thêm một vòng sửa, ~20 dòng máy chủ + ~6 ca thử):* gộp theo cặp cho MỌI loại dòng đỏ — báo thứ hai của cùng một khoản
  (cổng kia đã báo cùng mã phiên, cùng số tiền, mà cổng này chưa) ghi một loại dòng riêng "trùng hai cổng", Đối soát xếp vào mục CẦN XEM theo loại
  dòng đó (không dò câu chữ); chỉ đếm dòng tiền vào khớp phiên; sửa hướng dẫn cài cho đúng. Một khoản → một dòng đỏ, như khi chỉ có một cổng.
  *Phương án đơn giản hơn nhưng dựa vào lời dặn (không khuyên):* giữ code, dặn trong hướng dẫn "không bao giờ để cả hai webhook cùng bật" — luật kho
  là "bịt bằng KHOÁ, không bằng LỜI DẶN" nên máy không chọn.
  *Bạn cần làm:* trả lời "Q6 đồng ý đề xuất" (máy làm vòng sửa 4 rồi soát lại) hoặc chọn khác. Các câu Q4, Q5 ở trên không chặn, trả lời khi rảnh.

## Chủ quán trả lời (03.11) — Q6 chốt, Q4/Q5 theo đề xuất

- **Q6:** KHÔNG làm vòng sửa 4. Chủ quán đã XOÁ kênh thanh toán trên payOS (03.11), chỉ dùng SePay; chấp nhận rủi ro còn lại. Máy ghi vào
  `cai_dat_sepay.md` mục 4: muốn bật lại payOS thì TẮT webhook SePay trước (và ngược lại); không bao giờ để hai webhook cùng bật.
- **Q4:** giữ BẬT "Bỏ qua giao dịch không có mã thanh toán" như phiếu. **Q5:** không so số tài khoản nhận; chỉ liên kết tài khoản quán với SePay.
- Đã sửa thêm trong `cai_dat_sepay.md`: câu "quầy vẫn chạy payOS" (kênh đã xoá → chưa cài xong thì dùng QR tĩnh + xác nhận tay), tiêu đề mục 3.

## Phát hiện / việc sau (không sửa)

- **Q6 (việc sau, chỉ làm nếu một ngày bật lại payOS):** khi payOS và SePay CÙNG theo dõi một tài khoản, khoản KHÔNG tạo đơn (lệch tiền, hết hạn,
  đã huỷ, chuyển thêm) ghi HAI dòng đỏ ở Đối soát (`server/routes/thanh-toan.js` ~127–140; chỉ nhánh PHIEN_DA_CHOT + da_thu gộp đúng). Cách sửa
  khi cần: gộp theo cặp cho mọi lý do chua_khop, loại dòng riêng (`ket_qua`), Đối soát xếp CẦN XEM theo mã không theo câu chữ; `daBao` chỉ đếm
  `khop`/`chua_khop`; dòng "SePay báo tiền ra" không ghi chữ "về" (`server/utils/doiSoat.js` ~233–234). Hiện chặn bằng lời dặn ở hướng dẫn cài
  (chủ quán chấp nhận, vì payOS đã xoá).

## Cổng (03.11)

`node tu_chay/cong.js chay . 912576e^ HEAD viec/SEPAY-1` →
✓ CỔNG CHẠY ĐẠT

## Báo cáo 7 mục

```
VIỆC:        SEPAY-1 — gộp cổng QR SePay (công tắc CONG_QR, mặc định payOS), webhook chữ ký HMAC, đối soát
ĐÃ SỬA:      cổng + webhook SePay (server/routes/thanh-toan.js, server/utils/ — chi tiết ở các mục vòng sửa phía trên); lần này chỉ
             viec/SEPAY-1/cai_dat_sepay.md mục 4 (một cổng bật webhook) + vài câu lỗi thời; không đổi code chạy thật
BÀI THỬ:     thu_SEPAY1: trên gốc 9 đạt · 61 hỏng (ĐỎ); trên HEAD 70 đạt · 0 hỏng (XANH); đột biến 32/32 bắt; npm test PASS 89 · FAIL 0 · CẢNH BÁO 1 (có sẵn)
ĐÃ RÀ K4:    xem các vòng sửa 1–2; lỗ hai-cổng còn lại ở nhánh lệch/hết hạn/huỷ/chuyển thêm — KHÔNG sửa theo quyết định Q6, ghi Phát hiện
CHƯA KIỂM:   tài liệu SePay thật (Q1: máy không đọc được; chi tiết chữ ký theo tài liệu chủ quán dán); trang SePay và webhook thật; payOS có báo
             khoản lệch/quá hạn/huỷ hay không; điện thoại + tờ in thật; hai webhook cùng bật vẫn ra hai dòng đỏ (chặn bằng lời dặn, chủ quán chấp nhận);
             soát vòng 4 không chạy (hết 3 vòng, Q6 chốt không sửa)
GIT:         xem dưới (git log --oneline -2)
BÀI HỌC:     KHOÁ 1 (đề xuất, ngoài Phạm vi) · NGUYÊN TẮC 3 (đề xuất) · BỎ 1
```

Nghiệm thu: 6/6 mục có bằng chứng ở các vòng trước (bài thử `thu_SEPAY1` 70 ca xanh); còn lại vì lỗi hai-cổng nên soát vòng 3 KHÔNG ĐẠT — rủi ro
này do chủ quán chấp nhận, không phải sót.

## Bài học

- **KHOÁ (đề xuất, ngoài Phạm vi):** bài thử `thu_SEPAY1` thêm ca "hai nguồn cùng báo" cho từng nhánh chua_khop (lệch, hết hạn, huỷ, chuyển thêm)
  — đỏ trên HEAD hiện tại. Chỉ làm nếu bật lại payOS cùng SePay.
- **NGUYÊN TẮC (K4):** sửa một nhánh của biểu thức lồng nhiều tầng → liệt kê mọi nhánh anh em, hỏi từng nhánh. (K1) Câu hướng dẫn "dòng đỏ = phải hoàn"
  phải đúng trong MỌI cấu hình hướng dẫn gọi là bình thường. (Đồng bộ) Nhóm trên màn tiền xếp theo mã `ket_qua`, không tìm cụm chữ trong lý do.
  Đề xuất mục K9 cho chat soát.
- **BỎ:** việc mạng chặn `developer.sepay.vn` (Q1) — lỗi môi trường, một lần, chủ quán đã dán tài liệu.

HEAD ĐÃ KIỂM: 4617bad
