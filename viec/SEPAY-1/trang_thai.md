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
