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

## Chỗ vá → đột biến (cổng A17, A18) — `python3 viec/KH-MUA-1/dot_bien.py`: 30 / 30 BẮT, đối chứng xanh
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
| 2 — tự xoá dòng giữ khoá sau 120 s | bỏ hẳn cơ chế "khoá chết"; dòng giữ khoá chưa có phiên → luôn 503 `DANG_XU_LY`; hợp đồng: sau ~1 phút xem `GET /don` trước khi đặt lại | V3 | BV-DANG-XU-LY-GIU-KHOA |
| 3 — chuông theo id lúc tạo | DonAppNoi.jsx: "mới" = id chưa có trong tập id đã thấy ở danh sách quầy (đơn vào danh sách khi đã trả) | — (giao diện: thử tay) | — |
| 4 — đơn huỷ / hoàn kẹt ở quầy, vẫn bấm được | dsQuay: đơn trước hôm nay chỉ hiện khi chưa xong VÀ chưa huỷ / hoàn; doiTienTrinh đòi đơn thật chưa huỷ / hoàn | V7 (đỏ) | VS-QUAY-KHONG-LOC-HOM-NAY · VS-QUAY-BAM-DON-HUY |
| 5 — 7 đột biến sống | thêm ca V2 (hai yêu cầu chồng thật — rào ở bước tra khoá), V3 (tra khoá lúc dòng giữ khoá chưa có phiên), V4 (giá đổi đúng lúc tạo phiên → huỷ phiên, nhả ví), V5 (chốt ví hỏng — Q8), V6 (DON_KHONG_HOP_LE) | V2–V6 | BV-FINALLY-HUY-PHIEN · BV-GIA-DOI-SAU-PHIEN · BV-TRUNG-KHOA-NEM · VS-CHOT-VI-BO-KIEM-DA-THU |
| nghiệm thu K | K1 thêm Giờ vàng ở quầy + điểm so BẰNG số gốc (6) | K1 | — |
| 6 — cổng chạy / thử tay / CHƯA KIỂM | ghi ở báo cáo 7 mục + bước 11 | — | — |

Không sửa (lý do): lưới 10 giây không nhớ khoá mới — hợp đồng dặn App gửi lại bằng khoá CŨ; quyền GET /don-app chỉ `authenticate` — phiếu H đòi
"MỌI máy nhân viên đang đăng nhập" thấy đơn; Map lượt clear() ở 10.000 khách — cùng khuôn giuLuotBoNho có sẵn; hai lần hỏi /don-app khi mở màn
Đơn App — chấp nhận (15 s một lần).
Tên đột biến thêm ở vòng 1: VS-FINALLY-TIN-CO-BO-NHO, BV-FINALLY-HUY-PHIEN, BV-GIA-DOI-SAU-PHIEN, BV-DANG-XU-LY-GIU-KHOA, BV-TRUNG-KHOA-NEM,
VS-CHOT-VI-BO-KIEM-DA-THU, VS-QUAY-KHONG-LOC-HOM-NAY, VS-QUAY-BAM-DON-HUY. `python3 viec/KH-MUA-1/dot_bien.py`: 38 / 38 BẮT, đối chứng xanh.
`npm test -- --day-du`: PASS 88 · FAIL 0 · CẢNH BÁO 1 (có sẵn từ trước).

