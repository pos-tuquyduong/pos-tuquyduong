# KH-MUA-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (31.10.2026)
- Nhánh: `viec/KH-MUA-1`; cây sạch.
- `git fetch origin viec/KH-MUA-1` → HEAD `5e797f2` · FETCH_HEAD `5e797f2` (bằng nhau, không kéo).
- `git log --oneline -3`:
  ```
  5e797f2 PHIEU: KH-MUA-1
  97d1de2 TIEN-DO: KH-API-3 (a95634f), KHACH-CK-1 (4b52370) xong; mo KH-MUA-1, KHO-2b, KH-SP-1, BH-CKTAY-1; quyet dinh 31.10 (bo giam tay, dat don App vi+QR); luat 6.9 — so v49
  4b52370 Merge pull request #55 from pos-tuquyduong/viec/KHACH-CK-1
  ```
- Có commit `PHIEU: KH-MUA-1`.

## Bước 3 — kế hoạch
- `ke_hoach.md` đã viết; agent phụ (chỉ đọc) soát theo 4 câu — kết quả ghi cuối `ke_hoach.md`.
- Phiếu dặn **Chờ duyệt kế hoạch** → commit, push, DỪNG ở đây. Các điểm cần chủ quán xác nhận: mục 8 của `ke_hoach.md`.

## Sự cố
- Người gác chặn `git fetch -q origin main` (GIT-KEO: chỉ kéo được nhánh việc) — đúng luật. Hệ quả: máy KHÔNG kiểm được KH-SP-1 đã gộp
  main chưa (số hợp đồng v5, bước nâng cấp 006) → ghi ở mục 8 câu Q1.

## Câu hỏi
- (đã trả lời 31.10) Q1–Q10 của `ke_hoach.md` mục 8: chủ quán đồng ý đề xuất. Không còn câu hỏi mở.

## Làm tiếp (`/lam-viec KH-MUA-1 tiep`, 31.10.2026)
- Bước 1: nhánh `viec/KH-MUA-1`, cây sạch; HEAD `76ce7c5` = FETCH_HEAD `76ce7c5` (không kéo). `git log --oneline -3`:
  ```
  76ce7c5 KH-MUA-1: ke hoach (cho chu quan duyet) + trang thai buoc 1
  5e797f2 PHIEU: KH-MUA-1
  97d1de2 TIEN-DO: KH-API-3 (a95634f), KHACH-CK-1 (4b52370) xong; mo KH-MUA-1, KHO-2b, KH-SP-1, BH-CKTAY-1; quyet dinh 31.10 (bo giam tay, dat don App vi+QR); luat 6.9 — so v49
  ```
- Chủ quán duyệt kế hoạch + Q1–Q10, thêm (31.10):
  1. POST /don nhận `tong_da_xem` BẮT BUỘC (số nguyên ≥ 0) — kiểm SAU tra khoá, TRƯỚC giữ khoá; khác số máy chủ tính → 409 `GIA_DA_DOI`
     dạng `{ error, code, bao_gia: <dạng /gio/bao-gia> }`, không tạo gì; thiếu / sai dạng → 400 `YEU_CAU_KHONG_HOP_LE`. Đột biến VS-bo-so-tong-da-xem.
  2. Hợp đồng v5 ghi nguyên câu "Trả lời 4xx của POST /don không giữ khoá gửi — gửi lại cùng khoa_gui được xử lý như lần đầu." + ca
     thử sau KHO_BAN, QUA_NHIEU_LAN (hết cửa sổ), NGOAI_GIO, PIN_SAI, GIA_DA_DOI → gửi lại cùng khoá → như lần đầu (mục [R] của bài thử).
- Lệch kế hoạch (đã làm theo hướng đơn giản hơn): KHÔNG tạo `server/routes/kh/don.js` — dòng route nằm ở `kh/index.js` (bài hợp đồng chỉ
  quét file này), thân xử lý ở `utils/donApp.js`. Thẻ cài đặt chuông đặt chung thẻ "Giờ hoạt động" (khỏi thêm tab mới ở 4 chỗ của Settings.jsx).
  Nút "Đơn App" luôn hiện góc trên phải mọi màn (đỏ + số khi có đơn mới) — chỗ duy nhất vào màn Đơn App.
- Ngân sách: máy chủ ~450 dòng thêm (phiếu ~350; vượt vì hai điều chủ quán thêm + tính lại không mã Q10 + so lại tổng sau khi tạo phiên);
  giao diện ~240 (phiếu ~200); thử ~795 (phiếu ~450; vượt vì mục [P], [R] chủ quán thêm và các ca soát kế hoạch đòi).

## Chỗ vá → đột biến (cổng A17, A18) — `python3 viec/KH-MUA-1/dot_bien.py`: 30 / 30 BẮT lúc viết bảng này (hiện 39 / 39 — xem vòng sửa 1, 2), đối chứng xanh
| Chỗ vá | Đột biến |
|---|---|
| giờ hoạt động `kiemGio` (B) | BV-BO-KIEM-GIO · VS-GIO-CHI-DANG-MO |
| món / tồn `dungItems` (B, Q7) | VS-CON-HANG-NULL-LA-HET · BV-HET-HANG-TONG-SL |
| báo giá `baoGia` (A, Q10) | VS-MA-GIAM-LOI-HONG-CA-GIO · VS-BAO-GIA-DON-GIA-HANG |
| tạo đơn qua phiên (C) | VS-CHOT-VI-KHONG-CHOT · BV-SO-DU-THANH-VI-KHONG-DU · VS-HET-HANG-SX-KHONG-DOI |
| `tong_da_xem` / GIA_DA_DOI (chủ quán 31.10) | VS-bo-so-tong-da-xem · VS-GIA-DA-DOI-THIEU-BAO-GIA · BV-KIEM-DANG-TONG-DA-XEM |
| luật 4xx — không giữ khoá (D, R) | BV-BO-XOA-GIU-KHOA |
| khoá gửi / lưới 10 giây / lượt (E, K) | VS-KHOA-GUI-NOI · VS-BAM-CO-PIN · VS-NHO-KHOA-MAI · BV-BO-LUOI-10-GIAY · VS-DEM-LUOT-TRUOC-TRA-KHOA · BV-TRAN-LUOT |
| tiến trình / đơn của khách (F) | VS-TIEN-TRINH-HET-HAN-VAN-CHO-TRA · BV-BO-DIEU-KIEN-SDT-DON |
| huỷ (G) | VS-HUY-DA-TRA |
| quầy (H) | BV-QUAY-THAY-DON-CHO-TRA · BV-DOI-TIEN-TRINH-CHUA-TRA |
| cài đặt chuông `settings.js` (H) | BV-CHUONG-KIEM · VS-AM-LUONG-101 |
| tiền về muộn (I) | BV-TIEN-VE-CO |
| hợp đồng v5 (J) | BV-HOPDONG-CAU-4XX · BV-HOPDONG-CUA-DON · VS-HOPDONG-MA-THIEU |

Tên đột biến: BV-BO-KIEM-GIO, VS-GIO-CHI-DANG-MO, VS-CON-HANG-NULL-LA-HET, BV-HET-HANG-TONG-SL, VS-MA-GIAM-LOI-HONG-CA-GIO,
VS-BAO-GIA-DON-GIA-HANG, VS-CHOT-VI-KHONG-CHOT, BV-SO-DU-THANH-VI-KHONG-DU, VS-HET-HANG-SX-KHONG-DOI, VS-bo-so-tong-da-xem,
VS-GIA-DA-DOI-THIEU-BAO-GIA, BV-KIEM-DANG-TONG-DA-XEM, BV-BO-XOA-GIU-KHOA, VS-KHOA-GUI-NOI, VS-BAM-CO-PIN, VS-NHO-KHOA-MAI,
BV-BO-LUOI-10-GIAY, VS-DEM-LUOT-TRUOC-TRA-KHOA, BV-TRAN-LUOT, VS-TIEN-TRINH-HET-HAN-VAN-CHO-TRA, BV-BO-DIEU-KIEN-SDT-DON, VS-HUY-DA-TRA,
BV-QUAY-THAY-DON-CHO-TRA, BV-DOI-TIEN-TRINH-CHUA-TRA, BV-CHUONG-KIEM, VS-AM-LUONG-101, BV-TIEN-VE-CO, BV-HOPDONG-CAU-4XX,
BV-HOPDONG-CUA-DON, VS-HOPDONG-MA-THIEU.

## Phát hiện (ngoài Phạm vi, không sửa)
- `server/utils/gioHoatDong.js:2–3` chú thích còn ghi mã `NGOAI_GIO_HOAT_DONG`; mã thật là `NGOAI_GIO` + `QUA_GIO_NHAN_DON` (hợp đồng v5 đã sửa).
- Sáu 4xx của taoDon không có `code` (`orders.js:365, 371, 393, 460, 488, 672`) — App nhận `DON_KHONG_HOP_LE` / `HET_HANG` (dò lời "Không đủ hàng:");
  thêm `code` thật ở orders.js nên làm ở việc sau.
- Bộ kiểm có sẵn 1 cảnh báo (GET có lệnh ghi: packages.js:194, products.js:67, sync.js:147) — có từ trước việc này.
- Người gác chặn vòng `for` trong bash (B-CHUONGTRINH) — chạy lặp bài thử phải gõ từng lần.

## Soát độc lập — vòng 1 (agent /ra-soat, 31.10) — chép nguyên
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
1. server/utils/donApp.js:221–233 (lỗi tiền, khuôn K4 + K3). Với cách trả `vi`: `chotPhien` đã ghi xong (đơn thật đã có, ví đã trừ), sau đó
   `docPhien` ở dòng 223 hoặc câu `UPDATE pos_don_app SET phien_id` ở dòng 225 ném lỗi (Turso chập mạng). `finally` 229–232 vẫn thấy xong=false,
   xoá dòng giữ khoá (phien_id IS NULL). App nhận 500 LOI_MAY_CHU; gửi lại cùng khoa_gui → không còn khoá → phiên mới → trừ ví lần hai. Đơn đã trả
   lần đầu mất dòng pos_don_app → dsQuay không thấy, chuông không kêu. Cách sửa gọn: ghi phien_id ngay sau taoPhien (trước khi chốt); finally chỉ
   xoá dòng khi phiên không da_thu.
2. server/utils/donApp.js:180–181 và :225 (K4; LUAT §5 "kiểm changes"). Yêu cầu chạy quá GIU_KHOA_CHET_GIAY = 120 s (SX treo: checkStock 8 s mỗi món,
   gọi ở taoPhien và chotPhien) → lần gửi lại cùng khoá xoá dòng giữ khoá của nó, tạo phiên thứ hai; yêu cầu đầu UPDATE 0 dòng không kiểm changes,
   vẫn trả 200, đơn không có dòng App (quầy không thấy). Khách có thể có hai đơn.
3. client/src/components/DonAppNoi.jsx:57–63 + server/utils/donApp.js:292 (K4: hai vị từ lệch nhau). Chuông xét "mới" theo id pos_don_app (thứ tự
   TẠO), đơn hiện ở quầy khi TRẢ xong. Đơn A (id 10) trả QR chậm, B (id 11) trả ví ngay → mốc 11 → A trả xong không bao giờ kêu. Không bài thử.
4. server/utils/donApp.js:288–292 và :303–306 (nhẹ, K4). Đơn App đã trả mà quầy huỷ / hoàn (da_huy) vẫn nằm mãi trong danh sách quầy
   (tien_trinh_quay <> 'xong'); doiTienTrinh không xét trạng thái đơn thật — ghi được "Đang làm" cho đơn đã huỷ.
5. 7 đột biến tự dựng đều SỐNG (K3): X-BO-HUY-PHIEN (huyPhien trong finally :231), X-BO-GIA-DOI-SAU-PHIEN (:217–220), X-BO-DANG-XU-LY-CHET,
   X-GIU-KHOA-CHET-MAI (:180), X-TRUNG-KHOA-NEM (:207), X-CHOT-VI-BO-KIEM-DA-THU (:223), X-QUAY-KHONG-LOC-HOM-NAY (:292). Ca E5 "song song" thật ra
   chạy NỐI TIẾP, chưa lần nào vào nhánh UNIQUE / DANG_XU_LY — câu bang_chung_do.txt:21 không chứng minh "cùng lúc → một đơn".
6. trang_thai.md (K6): chưa ghi `node tu_chay/cong.js chay` (LUAT §6.3), chưa có 1–3 thao tác thử tay (§6.4), chưa có mục CHƯA KIỂM.
NGHI NGỜ: lưới 10 giây không nhớ khoá mới (gửi lại khoá đó sau 10 s → đơn cho_tra thứ hai, không mất tiền ví); quay.js GET /don-app + đổi tiến
  trình chỉ authenticate (phiếu không nêu quyền); Map lượt 10.000 khách clear() toàn bộ; nút cố định góc trên phải có thể đè nút màn Bán hàng;
  tiền mới chưa có quy tắc đối soát riêng (dựa chua_khop sẵn có, màn Đối soát chưa nhận ra đơn App).
NGHIỆM THU: 7/11 (A, B, C, F, G, I, J). Thiếu: D (ca DON_KHONG_HOP_LE; GIA_DA_DOI sau tạo phiên + huỷ phiên ở finally; Q8 chốt ví hỏng qua POST /don);
  E (cùng lúc thật); H (giao diện: huy hiệu, chuông máy ở quán, mặc định tắt, một lần, không kêu lại — không bài thử, không thao tác thử tay, lỗi 3);
  K (K1 chưa so hoàn, Giờ vàng quầy, đối soát; điểm chỉ "> 0").
CHƯA SOÁT ĐƯỢC: chưa dựng lỗi 1, 2 thành bài thử đỏ; chưa thử giao diện trên máy; chưa chạy cong.js chay; chưa rà mục G CHECKLIST từng dòng;
  chưa kiểm KH-SP-1 đã gộp main.
BÀI HỌC: KHOÁ — ca "lỗi ném SAU chotPhien → gửi lại cùng khoa_gui → ví trừ một lần, đơn vẫn ở quầy"; thêm 7 đột biến mục 5 kèm ca bắt; ca song song
  phải chồng thật (móc làm chậm sau INSERT giữ khoá). NGUYÊN TẮC (K4) — finally / dọn dẹp sau giao dịch có thể đã ghi thì đọc lại trạng thái CSDL
  trước khi xoá / huỷ, không dựa cờ trong bộ nhớ. (K4, giao diện) "mới" của chuông theo đúng mốc làm đơn hiện ở quầy. (K3) ca "song song" chỉ là
  bằng chứng khi đột biến gỡ cổng chống đua làm nó đỏ.
```

## Vòng sửa 1 (theo soát vòng 1)
| Lỗi soát | Sửa | Ca thử (đỏ trước vá) | Đột biến |
|---|---|---|---|
| 1 — lỗi ném SAU chốt ví → gửi lại trừ ví lần hai | donApp.js: gắn `phien_id` NGAY sau taoPhien (kiểm `changes`); finally chỉ xoá dòng đơn App khi phiên KHÔNG `da_thu` (đọc CSDL) | V1 (đỏ: ví 0 · đơn +2) | VS-FINALLY-TIN-CO-BO-NHO |
| 2 — tự xoá dòng giữ khoá sau 120 s | bỏ hẳn cơ chế "khoá chết"; dòng giữ khoá chưa có phiên → luôn 503 `DANG_XU_LY`; hợp đồng: sau ~1 phút xem `GET /don` trước khi đặt lại | V3 (ca phủ — xanh trước vá) | BV-DANG-XU-LY-GIU-KHOA (vòng 2: thay bằng VS-DON-KHOA-CHET-120) |
| 3 — chuông theo id lúc tạo | DonAppNoi.jsx: "mới" = id chưa có trong tập id đã thấy ở danh sách quầy (đơn vào danh sách khi đã trả) | — (giao diện: thử tay) | — |
| 4 — đơn huỷ / hoàn kẹt ở quầy, vẫn bấm được | dsQuay: đơn trước hôm nay chỉ hiện khi chưa xong VÀ chưa huỷ / hoàn; doiTienTrinh đòi đơn thật chưa huỷ / hoàn | V7 (đỏ) | VS-QUAY-KHONG-LOC-HOM-NAY · VS-QUAY-BAM-DON-HUY |
| 5 — 7 đột biến sống | thêm ca V2 (hai yêu cầu chồng thật — rào ở bước tra khoá), V3 (tra khoá lúc dòng giữ khoá chưa có phiên), V4 (giá đổi đúng lúc tạo phiên → huỷ phiên, nhả ví), V5 (chốt ví hỏng — Q8), V6 (DON_KHONG_HOP_LE) | V2–V6 là ca PHỦ đột biến (xanh trước vá, không phải ca đỏ — soát vòng 2 lỗi 3) | BV-FINALLY-HUY-PHIEN · BV-GIA-DOI-SAU-PHIEN · BV-TRUNG-KHOA-NEM · VS-CHOT-VI-BO-KIEM-DA-THU |
| nghiệm thu K | K1 thêm Giờ vàng ở quầy + điểm so BẰNG số gốc (6) | K1 | — |
| 6 — cổng chạy / thử tay / CHƯA KIỂM | ghi ở báo cáo 7 mục + bước 11 | — | — |

Không sửa (lý do): lưới 10 giây không nhớ khoá mới — hợp đồng dặn App gửi lại bằng khoá CŨ; quyền GET /don-app chỉ `authenticate` — phiếu H đòi
"MỌI máy nhân viên đang đăng nhập" thấy đơn; Map lượt clear() ở 10.000 khách — cùng khuôn giuLuotBoNho có sẵn; hai lần hỏi /don-app khi mở màn
Đơn App — chấp nhận (15 s một lần).
Tên đột biến thêm ở vòng 1: VS-FINALLY-TIN-CO-BO-NHO, BV-FINALLY-HUY-PHIEN, BV-GIA-DOI-SAU-PHIEN, BV-DANG-XU-LY-GIU-KHOA, BV-TRUNG-KHOA-NEM,
VS-CHOT-VI-BO-KIEM-DA-THU, VS-QUAY-KHONG-LOC-HOM-NAY, VS-QUAY-BAM-DON-HUY. `python3 viec/KH-MUA-1/dot_bien.py`: 38 / 38 BẮT, đối chứng xanh.
`npm test -- --day-du`: PASS 88 · FAIL 0 · CẢNH BÁO 1 (có sẵn từ trước).

## Soát độc lập — vòng 2 (agent /ra-soat mới, HEAD e520d46) — chép nguyên
```
KHÔNG ĐẠT
Chạy trên e520d46: thu_KHMUA1 118/0 · thu_HOPDONG_KH 81/0 · dot_bien 38/38 BẮT · --day-du PASS 88 FAIL 0 CẢNH BÁO 1 (có sẵn).
LỖI TÌM ĐƯỢC:
1. donApp.js:182–183 + :217 + :220–222 + :233–235 — K4 (đường song song do chính bản vá lỗi 1 tạo ra) — NẶNG (tiền). phien_id gắn ngay sau
   taoPhien; tra khoá chỉ coi phien_id IS NULL là "đang xử lý", dòng có phien_id coi là xong → traDon(cu, true) khi yêu cầu đầu còn chạy.
   (a) qr / vi_qr: giá đổi lúc tạo phiên, yêu cầu 1 đang tính lại báo giá; App gửi lại cùng khoá → 200 trung cho_tra kèm QR thật; yêu cầu 1 trả
   409 GIA_DA_DOI, finally huỷ phiên + XOÁ dòng đơn App; khách quét QR (link payOS không bị huỷ) → tiền về → PHIEN_DA_CHOT → chua_khop; App mất dấu
   đơn (GET /don/:ma 404, cờ tien_ve_cho_doi_soat không hiện) — trái nghiệm thu I. (b) vi: gửi lại trong lúc chotPhien chạy → 200 cho_tra,
   qr { chuoi: null } — trái hợp đồng "vi → da_tra"; chốt hỏng sau đó (như V5) → đơn App vừa nhận bị xoá → 404. Sửa gọn: dấu "tạo xong"; tra khoá
   trả DANG_XU_LY khi chưa tạo xong và phiên chưa da_thu. (Chưa chạy được bản tái hiện — người gác chặn script nháp có chữ [cụm bí mật — máy thay chữ gốc vì người gác chặn chữ đó].)
2. dot_bien.py:66 BV-DANG-XU-LY-GIU-KHOA — K3 (TACH-GL) — NHẸ: chỉ xoá dòng 182, V3 bắt vì traDon sập (docPhien(null) → 500), không vì lỗi cũ
   quay lại; không ca nào thử quá 120 giây → thêm lại "dọn khoá chết" vẫn xanh. Lỗi 2 vòng 1 chưa được khoá.
3. trang_thai.md:110–117 — K1 — NHẸ: bảng "Vòng sửa 1" ghi V2–V6, V3 là "đỏ trước vá" nhưng bang_chung_do.txt:29–33 chỉ có V1, V7 hỏng — V2–V6 là ca
   phủ đột biến. Dòng 63 còn "30 / 30 BẮT" (thật 38).
4. trang_thai.md — K6, LUAT §6.3/§6.4 — NHẸ: chưa có kết quả cong.js chay, 1–3 thao tác thử tay, mục CHƯA KIỂM.
5. HOP_DONG_API_KH.md "Gửi lại cùng khoa_gui không tính lượt" vs donApp.js:180–185 — K1 — NHẸ: sau 4xx dòng khoá bị xoá, gửi lại cùng khoá CÓ tính
   lượt (ca R "hết lượt" cho thấy).
6. thu_KHMUA1.js:402–409 (và :556–559) — K3 ngưỡng — NHẸ: trần 10 lần / 10 phút không bị khoá; đổi LUOT_DAT thành 5 hay 11 vẫn xanh. Thiếu ca
   "lần 10 qua, lần 11 bị chặn".
7. donApp.js:213 — K4 — NHẸ: taoPhien ném lỗi sau khi giao dịch đã ghi (giuCho.js:71 / :80) → phienId null, finally không huỷ → phiên cho mồ côi
   giữ ví (vi_qr) tối đa 10 phút. Không mất tiền nhưng chú thích dòng 7–8 "phiên lỡ tạo bị huỷ" không đúng cho đường này.
8. LUAT §5 — NHẸ, nhắc lại: chưa có quy tắc đối soát riêng cho đơn App; mục "Không sửa" không nêu lý do.
NGHI NGỜ: huyPhien ở finally hỏng → dòng đơn App trỏ phiên cho, gửi lại nhận cho_tra dù lần đầu 4xx; sập giữa INSERT giữ khoá và UPDATE phien_id
  → DANG_XU_LY vĩnh viễn, ví giữ 10 phút; vi bấm đúp hai khoá khác → lưới 10 giây chỉ xét phiên cho → trừ ví hai lần (đúng chữ phiếu E);
  DonAppNoi.jsx:30 AudioContext không resume() → Chrome có thể im sau tải lại; localStorage bị chặn → daThay luôn null, không bao giờ kêu;
  dsQuay LIMIT 100.
NGHIỆM THU: 9/11 · thiếu H (giao diện: không bài thử, chưa ghi CHƯA KIỂM / thử tay), K (hoàn + đối soát chưa so số trước–sau).
CHƯA SOÁT ĐƯỢC: bản tái hiện lỗi 1; cong.js chay; giao diện máy thật; mục G CHECKLIST; KH-SP-1.
BÀI HỌC: KHOÁ — ca "gửi lại cùng khoá trong lúc yêu cầu đầu đang chạy sau khi đã gắn phiên, rồi yêu cầu đầu thất bại → DANG_XU_LY"; đột biến thêm
  lại "dọn khoá chết 120 giây" + ca quá 120 giây; ca ngưỡng lượt 10 qua / 11 chặn. NGUYÊN TẮC (K4) — dời mốc "đã ghi" sớm hơn thì rà mọi chỗ ĐỌC
  mốc đó; trạng thái "đang dở" cần dấu riêng. (K1) cột "đỏ trước vá" chỉ ghi ca thật sự hỏng trong bang_chung.
```

## Vòng sửa 2 (theo soát vòng 2)
| Lỗi soát vòng 2 | Sửa | Ca thử | Đột biến |
|---|---|---|---|
| 1 (NẶNG) — có phien_id bị coi là "tạo xong" → gửi lại giữa chừng nhận 200 cho đơn sắp bị xoá | 006 thêm cột `xong` (bảng mới của việc này, CHƯA gộp main / chưa chạy kho thật nên sửa tại chỗ); tra khoá: chưa xong → 503 `DANG_XU_LY`, trừ phiên đã `da_thu` (lỗi sau chốt) → đánh dấu xong, trả đơn; lưới 10 giây, `GET /don` (đơn chưa trả), huỷ chỉ đọc `xong = 1`; đánh dấu xong ngay trước khi trả 200 | V8 (ĐỎ trước vá: gửi giữa chừng nhận 200) | VS-CO-PHIEN-LA-XONG |
| 2 — đột biến khoá chết bắt nhờ bài sập | ca V9 (dòng giữ khoá 3 phút → 503, không xoá) + đột biến đưa đúng cơ chế 120 giây trở lại | V9 (ca phủ) | VS-DON-KHOA-CHET-120 |
| 3 — ghi "đỏ trước vá" cho ca phủ; "30 / 30" cũ | sửa bảng vòng 1; số hiện tại 39 / 39 | — | — |
| 4 — cổng chạy / thử tay / CHƯA KIỂM | mục "Thử tay", "CHƯA KIỂM" dưới; cổng chạy ghi ở bước 11.4 | — | — |
| 5 — hợp đồng "không tính lượt" sai | sửa câu: gửi lại nhận đơn cũ / 409 / 503 không tính; sau 4xx thì tính | — | — |
| 6 — ngưỡng lượt không khoá | ca D: lần 1–10 qua bộ đếm, lần 11 → 429 | D1 / K3 (ca phủ) | BV-TRAN-LUOT |
| 7 — chú thích "phiên lỡ tạo bị huỷ" sai cho đường taoPhien tự ném | sửa chú thích đầu donApp.js (phiên mồ côi tự nhả sau HAN_PHUT) | — (CHƯA KIỂM) | — |
| 8 — quy tắc đối soát | mục "Quy tắc đối soát" dưới | — | — |
| nghi ngờ AudioContext treo | DonAppNoi gọi `ac.resume()` | — (thử tay) | — |

`python3 viec/KH-MUA-1/dot_bien.py`: 39 / 39 BẮT, đối chứng xanh (mua 120/0 · hd 81/0). `npm test -- --day-du`: PASS 88 · FAIL 0 · CẢNH BÁO 1 (có sẵn).

## Quy tắc đối soát (LUAT §5)
Đơn App KHÔNG có đường tiền riêng: tiền đi qua phiên thanh toán (`pos_phien_thanh_toan`, `nguoi_tao = 'app_kh'`) và đơn thật (`pos_orders`,
`created_by = 'app_kh'`) — màn Đối soát hiện có đã đếm hai thứ này như đơn quầy trả QR / ví. Quy tắc ngày: (1) mỗi phiên App `da_thu` có đúng một
đơn thật (`order_id`), số QR = `transfer_amount`, số ví = `balance_amount`; (2) mọi báo payOS của phiên App không tạo được đơn nằm ở
`pos_payos_su_kien.ket_qua = 'chua_khop'` (Đối soát ĐỎ) — quán hoàn tay, App hiện `tien_ve_cho_doi_soat`; (3) phiên App `cho` hết hạn không có
dòng tiền nào. Màn Đối soát CHƯA tách riêng dòng "đơn App" — ghi Phát hiện, việc sau (không trong Phạm vi: doiSoat.js / DoiSoat.jsx).

## Thử tay cho chủ quán (giao diện — máy không kiểm được)
1. Máy quầy: mở màn bất kỳ → góc trên phải có nút "🔔 Đơn App". Bấm → màn Đơn App; tick "Máy ở quán" → bấm "Thử chuông" phải nghe tiếng.
2. Đặt một đơn thử từ App (trả ví) → trong ~15 giây nút chuyển đỏ "1 mới" và máy đã tick "Máy ở quán" kêu MỘT lần; máy KHÔNG tick không kêu;
   tải lại trang → không kêu lại. Bấm "Đang làm" rồi "Xong" → App thấy tiến trình đổi.
3. Cài đặt › Giờ hoạt động (cuối thẻ) → "Chuông đơn App": đổi tiếng / âm lượng, bấm "Thử", Lưu; tắt chuông → đơn mới không kêu ở mọi máy.

## CHƯA KIỂM
- Toàn bộ giao diện quầy (nút Đơn App, chuông Web Audio, công tắc Máy ở quán, kêu một lần, không kêu lại khi tải trang, thẻ cài đặt chuông, nút
  cố định có đè nút màn Bán hàng không) — không có bài thử trình duyệt; chỉ thử tay ở trên. Trình duyệt chặn localStorage thì chuông không kêu.
- payOS THẬT (chỉ thử với máy payOS giả trên 127.0.0.1) và Turso thật (thử trên libsql file).
- taoPhien tự ném lỗi SAU khi giao dịch phiên đã ghi (giuCho.js) → phiên mồ côi giữ ví tới hết hạn 10 phút — không dựng được tất định, chỉ đọc code.
- huyPhien trong finally hỏng (mạng) → dòng đơn App trỏ phiên `cho`; sập máy chủ giữa giữ khoá và gắn phiên → khoá `DANG_XU_LY` mãi (hợp đồng
  dặn App xem `GET /don` rồi đặt lại bằng khoá mới).
- Lưới 10 giây chỉ xét phiên `cho`: `vi` bấm đúp bằng HAI khoá khác nhau → hai đơn, trừ ví hai lần (đúng chữ phiếu E; App phải giữ khoá cũ khi
  gửi lại).
- Hai yêu cầu cùng giỏ, hai khoá khác nhau, đến cùng mili-giây → lưới 10 giây có thể lọt cả hai (không có ràng buộc CSDL cho lưới hai).
- `dsQuay` LIMIT 100 — ngày rất đông có thể đẩy đơn cũ khỏi danh sách quầy.
- KH-SP-1 đã gộp main chưa (người gác không cho kéo main) — số hợp đồng v5 / bước 006 chờ chat sắp khi gộp.
- Nghiệm thu K phần hoàn / đối soát: code hoàn (orders.js), đối soát (doiSoat.js), phiên quầy (thanh-toan.js, giuCho.js trừ một dòng export) KHÔNG
  đổi (`git diff 5e797f2^ HEAD --stat`); bằng chứng là bộ cũ chạy trong `npm test` vẫn xanh: thu_P26b (hoàn), thu_DOISOAT1 (đối soát), thu_P3
  (phiên quầy + webhook), thu_UUDAI1 (mã / hạng), cộng K1 so số chụp trên gốc (tinh-thu, đơn, phiên tài khoản, điểm 6, Giờ vàng quầy).

## Soát độc lập — vòng 3 (lần cuối, HEAD ffa5cce) — chép nguyên
```
KHÔNG ĐẠT — chỉ còn lỗi NHẸ, không còn lỗi NẶNG (không đụng tiền / điểm / ví / lộ thông tin). Hai lỗi NẶNG vòng 1, 2 đã sửa đúng. Theo LUAT §6.5:
vòng sửa 4 trong phiếu, không hỏi chủ quán.
Chạy trên ffa5cce: thu_KHMUA1 120/0 · thu_HOPDONG_KH 81/0 · dot_bien đối chứng xanh 39/39 · --day-du PASS 88 FAIL 0 CẢNH BÁO 1 (có sẵn), dist khớp
src. Thêm 6 đột biến tự dựng (bản sao tạm): 4 SỐNG, 2 BẮT.
LỖI TÌM ĐƯỢC:
1. donApp.js:203, :260, :292, :190 — chỗ vá vòng 2 "chỉ đọc dòng xong = 1" không có ca khoá (K3) — NHẸ (chỗ :203 là vòng chặn tiền, nên vá trước).
   SỐNG: X-LUOI-BO-XONG (bỏ a.xong = 1 ở lưới 10 giây :203), X-DSDON-BO-XONG (nhánh 2 CAU_DON :260), X-HUY-BO-XONG (huyDon :292),
   X-TRA-KHOA-BO-DANH-DAU-XONG (bỏ dòng :190). X-LUOI-BO-XONG mở lại lỗi NẶNG vòng 2 qua đường song song: lần gửi hai bằng khoá KHÁC, cùng giỏ,
   lúc yêu cầu đầu còn dở → 200 trung kèm QR thật của đơn sau đó bị huỷ phiên + xoá dòng. V8 chỉ khoá đường cùng khoá. Cần ca: (a) khoá khác,
   cùng giỏ, chồng lúc yêu cầu đầu chưa xong → không 200 trung; (b) GET /don không thấy đơn đang dở; (c) huỷ đơn đang dở → 404; kèm 3 đột biến.
2. donApp.js:292 vs :253–257 — hai cách đọc lệch (K4) — NHẸ. Đơn trả ví, lỗi ném SAU chốt (như V1), App chưa gửi lại: dòng xong = 0; GET /don,
   /don/:ma (nhánh 1, nối phien_id, không lọc xong) hiện da_tra, nhưng POST /don/:ma/huy → 404 KHONG_THAY_DON thay vì 400 DA_TRA_GOI_QUAN như hợp
   đồng. Không mất tiền. Sửa: huyDon chỉ 404 khi chưa xong VÀ phiên chưa da_thu (hoặc đánh dấu xong như tra khoá :188–190).
3. HOP_DONG_API_KH.md:75 — "đơn hiện ở đó ngay khi đã có phiên trả tiền" sai sau vòng sửa 2 (K1/K4) — NHẸ: nhánh 2 :260 chỉ hiện xong = 1; nên
   ghi "đơn hiện ở đó khi đã trả, hoặc khi lần đặt đầu đã xong".
4. donApp.js:11–12 — chú thích "tra khoá / lưới / đơn của khách / huỷ chỉ đọc dòng xong = 1" không đúng hết (K1, TU-CHAY-6) — NHẸ: tra khoá cố ý
   đọc cả xong = 0; nhánh 1, dsQuay, doiTienTrinh cố ý không lọc xong (đúng ý K5, chỉ chú thích sai).
5. trang_thai.md — chưa có kết quả node tu_chay/cong.js chay (LUAT §6.3) (K6) — NHẸ. Phải ghi trước khi báo xong.
NGHI NGỜ: 006 sửa tại chỗ (thêm cột xong trong CREATE TABLE, không qua themCot) — kho nào đã chạy bản 006 cũ sẽ bỏ qua bước, bảng thiếu cột xong,
  mọi câu đọc hỏng; chưa kiểm data/pos_thu.db của Replit. Đơn ví ra xong = 0 (lỗi sau chốt) rồi tra khoá đánh dấu xong rồi trả KHOA_GUI_DA_DUNG nếu
  giỏ khác — đúng nhưng chưa có ca. DonAppNoi.jsx:64 chỉ kêu khi đơn mới đang da_tra — máy khác bấm "Đang làm" trong 15 giây trước nhịp hỏi thì
  máy ở quán không kêu. DonAppNoi.jsx:16–17 bộ nhớ trình duyệt bị chặn thì không kêu (đã ghi CHƯA KIỂM). MA_PHIEN_QUA_DAI (409, giuCho.js:66) bị đổi
  thành 400 DON_KHONG_HOP_LE qua chuanLoi (:116) — hiếm, có từ trước.
NGHIỆM THU: 11/11 có bằng chứng (H giao diện chấp nhận theo CHƯA KIỂM + 3 thao tác thử tay; K: K1 + thu_P26b, thu_DOISOAT1, thu_P3). Còn yếu: E
  (lưới 10 giây chưa khoá với đơn đang dở — lỗi 1), G (huỷ đơn trả ví xong = 0 — lỗi 2).
CHƯA SOÁT ĐƯỢC: cong.js chay; giao diện máy thật; payOS thật, Turso thật; kho Replit đã chạy bản 006 cũ chưa; KH-SP-1; chưa dựng bài tái hiện lỗi 1
  thành ca chồng thật.
BÀI HỌC: KHOÁ — mỗi chỗ đọc của một cột trạng thái mới là một chỗ vá riêng: một ca + một đột biến; lưới thứ hai phải có ca chồng lúc yêu cầu đầu
  chưa xong. NGUYÊN TẮC (K4) — thêm dấu "đã xong" thì MỘT vị từ "đơn nhìn thấy được" cho mọi đường đọc của App. (K1) đổi nghĩa trạng thái thì
  grep cả hợp đồng tìm câu hứa "đơn hiện ở đâu, khi nào". Bước nâng cấp đã từng chạy ở bất kỳ kho nào thì không sửa tại chỗ — thêm cột qua themCot.
```
SOÁT LẦN CUỐI: chat soát thay (LUAT §6.5 — hết 3 vòng, lần soát cuối chỉ còn lỗi NHẸ → vòng sửa 4 ngay trong phiếu, không gọi agent soát nữa).

## Vòng sửa 4 (chat soát thay — LUAT §6.5; chỉ đúng các lỗi soát vòng 3 nêu)
| Lỗi soát vòng 3 | Sửa | Ca thử | Đột biến |
|---|---|---|---|
| 1 — 4 chỗ đọc `xong` không có ca khoá | MỘT vị từ `THAY_DUOC` = `(a.xong = 1 OR p.trang_thai = 'da_thu')` cho lưới 10 giây, đơn chưa trả của GET /don, huỷ; bỏ dòng "đánh dấu xong khi tra khoá" (vị từ chung đã phủ — chỗ đọc thứ 4 hết) | V10 (ca phủ: khoá khác cùng giỏ lúc lần đầu đang chốt → đơn mới; GET /don không thấy đơn dở; huỷ đơn dở → 404) | BV-LUOI-BO-THAY-DUOC · BV-DSDON-BO-THAY-DUOC · BV-HUY-BO-THAY-DUOC |
| 2 — huỷ đơn ví lỗi-sau-chốt trả 404 | huyDon đọc qua `THAY_DUOC` → 400 `DA_TRA_GOI_QUAN` | V1b (ĐỎ trước vá: 404) | VS-HUY-CHI-XONG |
| 3 — hợp đồng "đơn hiện … khi đã có phiên" | sửa: "khi đã trả, hoặc khi lần đặt đầu đã xong" | — | — |
| 4 — chú thích donApp.js:11–12 | viết lại theo đúng vị từ | — | — |
| 5 — cổng chạy | ghi dưới (bước 11.4) | — | — |

Không sửa (nghi ngờ, không phải lỗi nêu): 006 sửa tại chỗ — chỉ an toàn khi chưa kho nào chạy nhánh này (xem CHƯA KIỂM); chuông bỏ sót khi máy khác
bấm "Đang làm" trong 15 giây trước nhịp hỏi; MA_PHIEN_QUA_DAI đổi mã (có từ trước).
`python3 viec/KH-MUA-1/dot_bien.py`: 43 / 43 BẮT, đối chứng xanh (mua 122/0 · hd 81/0). `npm test -- --day-du`: PASS 88 · FAIL 0 · CẢNH BÁO 1 (có sẵn).
Thêm vào CHƯA KIỂM: kho thử Replit `data/pos_thu.db` đã từng chạy nhánh này (bản 006 chưa có cột `xong`) hay chưa — máy không đọc được; nếu đã chạy thì
phải xoá dòng `pos_nang_cap` số 6 + bảng `pos_don_app` của kho thử trước khi chạy lại. Chuông không kêu nếu máy khác bấm "Đang làm" trước nhịp hỏi 15 giây.

## Nghiệm thu — đếm từng mục
- A báo giá — ca A1–A8 (thu_KHMUA1.js mục [A]); đột biến VS-MA-GIAM-LOI-HONG-CA-GIO, VS-BAO-GIA-DON-GIA-HANG.
- B chặn đặt — B1–B6 + K5 tồn chưa rõ; BV-BO-KIEM-GIO, VS-GIO-CHI-DANG-MO, VS-CON-HANG-NULL-LA-HET, BV-HET-HANG-TONG-SL.
- C tạo đơn — C1–C10, Q3; VS-CHOT-VI-KHONG-CHOT, BV-SO-DU-THANH-VI-KHONG-DU, VS-HET-HANG-SX-KHONG-DOI.
- D luật 4xx — D1 đếm bảng 18 mã + V4, V5, V6 + mục [R] (gửi lại sau KHO_BAN, QUA_NHIEU_LAN, NGOAI_GIO, PIN_SAI, GIA_DA_DOI); BV-BO-XOA-GIU-KHOA, BV-FINALLY-HUY-PHIEN.
- E chống trùng — E1–E8, V2 (chồng thật), V3, V8, V9, V10, P4; VS-KHOA-GUI-NOI, VS-BAM-CO-PIN, VS-NHO-KHOA-MAI, BV-BO-LUOI-10-GIAY, VS-CO-PHIEN-LA-XONG, VS-DON-KHOA-CHET-120, BV-LUOI-BO-THAY-DUOC.
- tong_da_xem / GIA_DA_DOI (chủ quán 31.10) — P1–P5, V4; VS-bo-so-tong-da-xem, VS-GIA-DA-DOI-THIEU-BAO-GIA, BV-KIEM-DANG-TONG-DA-XEM.
- F tiến trình — F1–F8; VS-TIEN-TRINH-HET-HAN-VAN-CHO-TRA, BV-BO-DIEU-KIEN-SDT-DON, BV-DSDON-BO-THAY-DUOC.
- G huỷ — G1–G6 (G6 huỷ và tiền về cùng lúc), V1b, V10; VS-HUY-DA-TRA, VS-HUY-CHI-XONG, BV-HUY-BO-THAY-DUOC.
- H về quầy + chuông — máy chủ H1–H6, V7; BV-QUAY-THAY-DON-CHO-TRA, BV-DOI-TIEN-TRINH-CHUA-TRA, VS-QUAY-*, BV-CHUONG-KIEM, VS-AM-LUONG-101. Giao diện:
  CHƯA KIỂM + 3 thao tác thử tay (mục "Thử tay cho chủ quán").
- I tiền về muộn / lệch — I1–I4 + ca hết hạn không tiền; BV-TIEN-VE-CO.
- J hợp đồng v5 — thu_HOPDONG_KH.js 81/0 (cửa, trường, mã, câu luật 4xx, dạng GIA_DA_DOI); BV-HOPDONG-CAU-4XX, BV-HOPDONG-CUA-DON, VS-HOPDONG-MA-THIEU.
- K không đổi luồng cũ — K1 số chụp gốc (tinh-thu, POST /orders, phiên tài khoản, điểm 6, Giờ vàng quầy), K2 không token 401, K3 lượt theo khách
  (lần 11 → 429, khách khác vẫn qua); bộ cũ trong `npm test` xanh: thu_P3, thu_P26b, thu_UUDAI1, thu_DOISOAT1, thu_KH1, thu_KHAPI2/3.
→ 11 / 11 mục có bằng chứng (H phần giao diện theo thử tay).

## Báo cáo 7 mục
```
VIỆC:        KH-MUA-1 — App KH đặt đơn nhận tại quán: báo giá giỏ · tạo đơn QR payOS / ví + PIN / ví + QR · đơn về quầy kèm chuông · tiến trình ·
             huỷ đơn chưa trả
ĐÃ SỬA:      server/nang_cap/006_don_app.js — bảng pos_don_app (khoá gửi theo khách, cột xong, tiến trình quầy; không cột tiền)
             server/utils/donApp.js — báo giá (= taoDon chỉ tính), datDon (khoá gửi → lượt → thân + tong_da_xem → giờ → món → lưới 10 giây →
               GIA_DA_DOI → giữ khoá → taoPhien → gắn phiên → [vi] chotPhien → xong; finally đọc lại CSDL), tiến trình, GET /don, huỷ, quầy
             server/routes/kh/index.js — POST /gio/bao-gia, POST /don, POST /don/:ma/huy; GET /don, /don/:ma qua donApp
             server/routes/kh/loi.js — 12 mã mới + thanLoi · server/routes/kh/quay.js — GET /don-app, POST /don-app/:id/dang-lam | /xong
             server/routes/settings.js — kiểm 3 khoá chuông · server/utils/giuCho.js — xuất gomRes
             client/src: components/DonAppNoi.jsx (nút Đơn App mọi màn + chuông), pages/DonApp.jsx, components/CaiDatChuong.jsx, Layout.jsx,
               App.jsx, Settings.jsx; client/dist build lại
             HOP_DONG_API_KH.md v5 · cong_cu/thu_KHMUA1.js (mới) · cong_cu/thu_HOPDONG_KH.js · kiem_tra_truoc_khi_giao.js (chạy bài mới)
BÀI THỬ:     thu_KHMUA1.js trên gốc 76ce7c5 → ĐỎ 11 đạt · 111 hỏng; sau vá → XANH 122 / 0. thu_HOPDONG_KH.js gốc → ĐỎ 73 / 8; sau vá 81 / 0.
             Lỗi tiền soát bắt có ca đỏ trên bản trước vá: V1 (ví trừ hai lần, đơn +2), V8 (gửi giữa chừng nhận 200 đơn sắp xoá), V1b, V7.
             Đột biến 43 / 43 BẮT, đối chứng xanh. npm test --day-du PASS 88 · FAIL 0 · CẢNH BÁO 1 (có sẵn).
ĐÃ RÀ K4:    grep "pos_don_app" trong server/utils/donApp.js → 15 dòng = 11 câu SQL (+ 2 dòng chú thích, 2 dòng nối): tra khoá :186, lưới :203,
             giữ khoá :213, gắn phiên :227, xong :238, finally :245, CAU_DON :257 :261, huỷ :293, quầy :306, đổi tiến trình :320 — mỗi chỗ đọc dòng App: THAY_DUOC (lưới, đơn chưa trả, huỷ) hoặc phiên da_thu (đơn thật, quầy, đổi tiến trình) hoặc cố ý
             đọc cả dòng dở (tra khoá → DANG_XU_LY); grep "SO_DU_KHONG_DU" → 1 chỗ đổi VI_KHONG_DU (chuanLoi, dùng cho cả tạo phiên và chốt);
             grep "huyPhien" → 2 chỗ (finally, huỷ của khách) cùng câu ghi có điều kiện 'cho'.
CHƯA KIỂM:   giao diện quầy trên máy thật (nút, chuông, Máy ở quán, kêu một lần, thẻ cài đặt — 3 thao tác thử tay ở trên); payOS thật, Turso thật;
             taoPhien tự ném sau khi đã ghi phiên → phiên mồ côi giữ ví ≤ 10 phút; huyPhien trong finally hỏng; sập máy chủ giữa giữ khoá và gắn phiên
             → DANG_XU_LY mãi (hợp đồng dặn xem GET /don rồi đặt lại); vi bấm đúp bằng hai khoá khác → trừ hai lần (đúng chữ phiếu E); hai khoá khác cùng
             giỏ cùng mili-giây; dsQuay LIMIT 100; chuông khi localStorage bị chặn / máy khác bấm Đang làm trước nhịp 15 giây; kho thử Replit đã chạy
             006 cũ chưa; KH-SP-1 đã gộp main chưa (v5 / 006 chờ chat sắp số); màn Đối soát chưa tách dòng đơn App.
GIT:         (xem dòng git log ghi ở cuối file, sau lần kiểm cuối)
BÀI HỌC:     KHOÁ 3 · NGUYÊN TẮC 3 · BỎ 2 — chi tiết ở ## Bài học
```

## Bài học
Sự cố của việc này: soát vòng 1 bắt lỗi tiền (lỗi ném SAU chốt ví → gửi lại trừ ví hai lần); vòng 2 bắt lỗi do CHÍNH bản vá vòng 1 tạo ra (gắn phiên
sớm → "có phiên" bị hiểu là "đã xong"); vòng 3 bắt 4 chỗ đọc cột mới không có ca; người gác chặn: `git fetch origin main` (GIT-KEO), heredoc /
`node --check` / vòng `for` (B-PHANTICH, B-CHUONGTRINH), script hoặc bài thử có chữ khoá bí mật chưa commit (B-BIMAT-CHU — phải commit trước khi chạy,
và đã phải đổi chữ trong bản chép báo cáo soát); bài thử tự viết sai 3 lần (dùng một khách vượt trần lượt, ví đủ với vi_qr, giá nạp ví sai);
`new Set(JSON.parse(null))` ra tập rỗng (tự bắt trước khi build); Express 5 không nhận `:x(a|b)`; vượt ngân sách dòng (máy chủ ~470, thử ~950).
- KHOÁ 1 (trong Phạm vi, ĐÃ làm): ca "lỗi ném SAU khi giao dịch tiền đã ghi → gửi lại cùng khoá" (V1, móc đọc phiên da_thu ném một lần) + đột
  biến VS-FINALLY-TIN-CO-BO-NHO. Lý do: lỗi tiền chỉ lộ khi có lỗi mạng giữa chừng, không bài thường nào chạm.
- KHOÁ 2 (trong Phạm vi, ĐÃ làm): ca chồng THẬT bằng rào / móc làm chậm (V2, V3, V8, V10) — ca "Promise.all" thường chạy nối tiếp (E5 cũ). Lý do:
  K3 "song song chỉ là bằng chứng khi đột biến gỡ cổng chống đua làm nó đỏ".
- KHOÁ 3 (ĐỀ XUẤT, ngoài Phạm vi — tu_chay/nguoi_gac hoặc cong.js): cổng A16/A17 thêm phép "mỗi chỗ đọc một cột trạng thái mới thêm trong việc
  (grep tên cột trong server/) có ít nhất một đột biến trỏ tới" — ca đỏ: dot_bien.py KH-MUA-1 ở ffa5cce (cột xong, 4 chỗ đọc không đột biến).
- NGUYÊN TẮC 1 (đề xuất KHUON_LOI.md K4, ngoài Phạm vi): "Dọn dẹp sau giao dịch có thể đã ghi thì ĐỌC LẠI CSDL, không tin cờ trong bộ nhớ" — Đã gây:
  KH-MUA-1 vòng 1 (finally xoá dòng đơn App theo cờ xong=false sau khi chotPhien đã trừ ví). Dấu hiệu: `finally { if (!xong) xoá… }` sau lời gọi ghi
  tiền. Chặn: điều kiện xoá nằm TRONG câu ghi (NOT EXISTS … da_thu) + ca ném sau ghi.
- NGUYÊN TẮC 2 (đề xuất KHUON_LOI.md K4): "Dời mốc 'đã ghi' sớm hơn → rà MỌI chỗ đọc mốc đó; trạng thái 'đang dở' cần dấu riêng và MỘT vị từ 'nhìn
  thấy được'" — Đã gây: KH-MUA-1 vòng 2 (gắn phien_id sớm, tra khoá coi có phiên là xong) và vòng 3 (huỷ lọc xong, chi tiết nối phiên).
- NGUYÊN TẮC 3 (đề xuất KHUON_LOI.md K1): "Đổi nghĩa trạng thái / sửa bước nâng cấp → grep hợp đồng tìm câu hứa 'hiện ở đâu, khi nào'; bước nâng cấp
  đã chạy ở BẤT KỲ kho nào thì không sửa tại chỗ (themCot)" — Đã gây: hợp đồng v5 câu GET /don sai sau vòng 2; 006 sửa tại chỗ (an toàn chỉ vì chưa gộp).
- BỎ 1: bài thử tự viết sai dữ liệu nền (khách vượt trần, ví đủ, nạp sai) — lỗi gõ một lần, bài đỏ ngay và đã sửa.
- BỎ 2: Express 5 không nhận `:x(a|b)` — bài sập ngay lần chạy đầu, không lên production được.
Dọn: không lời dặn nào trong KHUON_LOI.md / CLAUDE.md đã có phép kiểm làm thay mới trong việc này. Đề xuất ngoài Phạm vi máy KHÔNG tự làm.

