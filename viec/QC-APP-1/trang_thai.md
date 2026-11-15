# QC-APP-1 — trạng thái (13.11.2026)

Lời thường: thẻ Cài đặt "📣 Quảng cáo trên App" và cửa công khai `GET /api/kh/quang-cao` đã làm xong, bài thử + bộ đột biến + bộ kiểm đều xanh,
soát độc lập và soát bảo mật không thấy lỗi nặng. Bạn cần: (1) merge sau khi xem; (2) thử tay 3 thao tác ở mục CHƯA KIỂM; (3) báo App KH (hợp đồng v16
— đổi số nếu VOUCHER-2 gộp trước).

## Đối chiếu bản chụp (skill bước 1)
Nhánh `viec/QC-APP-1`, cây sạch. Lúc mở: HEAD = FETCH_HEAD = `d121491` (đã đồng bộ origin, không cần kéo; kho nông → đã `git fetch --unshallow` một lần, chỉ tải lịch sử).
```
d121491 PHIEU: QC-APP-1
4434ad5 TIEN-DO: HUY-1 xong (171109f); mo QC-APP-1 (Sonnet) + ND-API-1 (Opus lan 2) — so v64
171109f Merge pull request #91 from pos-tuquyduong/viec/HUY-1
```
Đổi model giữa phiên: không thấy thông báo.

## Bảng "chỗ vá → đột biến" (`python3 viec/QC-APP-1/dot_bien.py`, đối chứng 127 đạt · 0 hỏng, TỔNG 105 · BẮT 105 · SỐNG 0 · LẠC 0)
| Chỗ vá | Đột biến |
|---|---|
| route quầy: đăng nhập + quyền manage_settings (`quang-cao.js` `quyen`) | BV-AUTH-BO · BV-QUYEN-BO |
| PIN chủ quán trước khi ghi | BV-PIN-BO · VS-PIN-RONG-QUA |
| lưu cả danh sách: xoá dòng vắng, id lạ, id trùng / sai kiểu, thứ tự | BV-XOA-DONG-VANG · BV-ID-LA-BO · BV-ID-TRUNG-BO · VS-ID-KIEU-LONG · VS-UUTIEN-KHONG-THEO-MANG |
| công tắc Giờ vàng lưu / kiểu | BV-GIOVANG-KHONG-LUU · BV-GIOVANG-KIEU-BO |
| độ dài + đếm ký tự nhìn thấy + điều khiển + trống | VS-DAI-33 · BV-DAI-BO · VS-DEM-MA-KY-TU · VS-DEM-CODEPOINT · BV-CHU-TRONG-BO · BV-DIEU-KHIEN-BO |
| hằng số giới hạn (tiêu đề / phụ / nút / số dòng) | VS-GIOIHAN-TIEUDE-41 · VS-GIOIHAN-PHU-81 · VS-GIOIHAN-NUT-21 · VS-GIOIHAN-SODONG-21 · BV-SODONG-BO |
| dich + món | BV-DICH-BO · BV-MON-TONTAI-BO · VS-MON-DANG-BAN-THAY-TONTAI · VS-MON-GIU-KHI-KHONG-PHAI-MON |
| kiểu ngày / thứ / khoảng ngày | BV-KIEU-NGAY-BO · BV-THU-RONG-BO · VS-THU-8 · VS-THU-0 · BV-THU-KIEU-BO · VS-NGAY-THAT-LUON-DUNG · VS-NGAY-THAT-BO-NGAY · VS-DEN-NGAY-BANG-LOI · BV-DEN-NGAY-BO |
| giờ HH:mm | VS-GIO-MAU-NOI · VS-GIO-MAU-LONG · VS-GIO-BANG-DUOC · BV-GIO-SAU-BO · BV-GIO-MOT-DAU-BO · BV-BAT-BO |
| cửa App: lọc ngày / bật-tắt / thứ / biên khoảng | BV-NGAY-LOC-BO · BV-TAT-LOC-BO · VS-THU-LECH · VS-THU-CN-LA-0 · VS-KHOANG-DAU-LOAI · VS-KHOANG-CUOI-LOAI |
| cửa App: món tắt → menu, danh sách trắng, trần lượt | BV-MON-TAT-BO · VS-MON-TAT-KHONG-MENU · VS-MON-DUNG-ACTIVE-THAY-SELLABLE · VS-TRA-THUA-BAT · VS-TRA-THUA-NGAY · BV-TRAN-LUOT-BO |
| Giờ vàng tự động | BV-GIOVANG-CONGTAC-BO · VS-GIOVANG-KHONG-CHAY · VS-GIOVANG-KHONG-BAT · VS-GIOVANG-UUTIEN-1 · VS-GIOVANG-DEN-GIO-LA-GIO-MO · VS-GIOVANG-DICH-RONG · VS-GIOVANG-KHONG-DAU-DANH-SACH · VS-GIOVANG-PHAN-TRAM-CUNG · BV-GIOVANG-DOC-RIENG-KHONG-NGUON |
| sao lưu / bước 028 / dọn thử | BV-BACKUP-BO · VS-BACKUP-KHONG-KHOI-PHUC · BV-NANGCAP-UPDATE · VS-NANGCAP-GIO-SQLITE · VS-NANGCAP-KHONG-LAP-LAI · BV-DONTHU-XOA-QUANG-CAO |
| giao diện thẻ | BV-UI-BO-HOIPIN · BV-UI-BO-THANHLUU · BV-UI-BO-LOI-O · VS-UI-ALERT · VS-UI-FETCH-TRAN · BV-UI-BO-TAI-LAI · BV-UI-NUT-LUU-KHONG-KHOA · BV-UI-BO-NHAC · BV-UI-BO-DEM-NGUOC · BV-UI-BO-CAT-DAU-BA-CHAM · BV-UI-BO-XEM-TRUOC · BV-UI-BO-LEN-XUONG · BV-UI-BO-TRACNGHIEM · BV-UI-BO-GIOVANG-CHU · BV-UI-BO-MON-DA-TAT · BV-UI-LOI-O-VE-LUU |
| api.js + Settings.jsx | BV-UI-API-LOI-O · BV-UI-API-LUU-SAI-PT · BV-UI-SETTINGS-BO-IMPORT · VS-UI-SETTINGS-QUYEN-SAI · BV-UI-SETTINGS-NUT-KHONG-QUYEN · BV-UI-SETTINGS-KHONG-VE |
| hàm thuần phía quầy `quangCao.js` | VS-QS-DEM-MA-KY-TU · VS-QS-CHU-33 · BV-QS-CHU-TRONG · VS-QS-GIO-BANG · BV-QS-GIO-MOT-DAU · VS-QS-NGAY-31 · VS-QS-NHUAN-CHIA-4 · VS-QS-NHUAN-BO-400 · VS-QS-DEN-NGAY-BANG · VS-QS-THU-RONG-BO · VS-QS-MON-THIEU-BO · VS-QS-GIOIHAN-TIEUDE-41 · VS-QS-GIOIHAN-SODONG-21 |
| nối bộ kiểm + hợp đồng | BV-NOI-BO-KIEM-TRA · BV-HOPDONG-BO-DONG-CUA |

Đột biến tương đương đã BỎ (ghi lý do, không đếm là phép): món thiếu mã (`tonTai(null)` chặn cùng ô); khoảng ngày thiếu ngày (dòng đã kiểm trước khi lưu);
giờ rỗng thành chuỗi (đã chuẩn hoá lúc lưu); id âm (chặn nhờ UPDATE không trúng dòng nào → 400 cùng mã).

## Nghiệm thu (đếm từng mục, bằng chứng = ca trong `cong_cu/thu_QCAPP1.js`, 127 ca)
- A thẻ + quyền + PIN + thanh lưu + lưu xong tải lại: A1 A2 A4 A5 A6 A7 A7b A8 A10 A11 A13 A14, H3 H3b H4 H4b H4c H4d — đủ
- B mỗi dòng: B (chữ 32/33, emoji, tổ hợp), H5 câu nhắc, H6 đếm ngược, H7 xem trước, H8 nhãn, H10 ô chọn món — đủ
- C Giờ vàng tự động: D1 D2 D2b D2c D2d D3 D3b D3c D4 D4b D5 D6, H9 — đủ
- D cửa công khai: C0–C8 (C5/C5b/C5c/C5d sát nửa đêm) — đủ
- E máy chủ tự kiểm: nhóm B (mỗi luật một ca 400 + loi_o + không ghi gì), H11 — đủ
- F lưu trữ: F1–F6 (bước 028 chỉ tạo bảng, sao lưu, dọn thử chạy thật) — đủ
- G hợp đồng v16: `thu_HOPDONG_KH.js` ca v16 + gieo dòng, 93 ca — đủ
- H bộ kiểm: I1 I2, bằng chứng đỏ `bang_chung_do.txt`, 105 đột biến BẮT — đủ
- K5 không đổi: A8 A7b B(K5) C4–C4d D0 D6, `thu_BAO1b` cũ + `npm test` — đủ
→ 9/9 nhóm, không mục thiếu.

## Soát độc lập (`/ra-soat`) — chép từ báo cáo của agent
KẾT LUẬN: ĐẠT kèm 4 lỗi nhẹ. NGHIỆM THU 11/11 có bằng chứng. Lỗi tìm được:
1. `quang-cao.js` PUT không kiểm id trùng / id sai kiểu (`id:true`) — K4 → ĐÃ SỬA vòng 1 (commit f257b90, 74ffb29): ca A13 (id trùng → 400) + A14 (true · chuỗi · -1 · 1.5 → 400), đột biến BV-ID-TRUNG-BO, VS-ID-KIEU-LONG đỏ rồi bắt.
2. chữ báo khi `chu_dai` là null là "phải là chữ" thay vì "Nhập chữ dải" — chỉ chữ báo, không đổi luật → không sửa.
3. `ke_hoach.md` §5 hứa đột biến `VS-PIN-SAU-GHI` nhưng không có trong `dot_bien.py` — ca A5 (đếm dòng = 0 sau PIN sai) vẫn bắt; kế hoạch giữ nguyên làm lịch sử, bảng ở trên mới là danh sách thật.
4. số dòng trích ở `ke_hoach.md` §0 đã trôi — kế hoạch là hồ sơ lúc lập, code không ghi số dòng cứng.
Nghi ngờ (không sửa, ghi Phát hiện): ba cửa công khai chung một xô 300 lượt / phút / IP (khuôn có sẵn của /chuong-trinh); mỗi lượt có dòng `dich='mon'` gọi `layMenuQuay` (ngang `/menu` không token); lưu cả danh sách theo kiểu "vắng mặt thì xoá" — tab cũ có thể xoá dòng người khác vừa thêm (thiết kế đã ghi ở kế hoạch); vị từ Giờ vàng còn ở `utils/manKhach.js:200` và `routes/orders.js:587` (phiếu cấm đổi luật Giờ vàng).
Gợi ý gọn: dùng `trongGiaoDich` của wallets.js thay `beginTransaction` tay (~8 dòng) — chưa làm: bản hiện tại đã có ca đua và đột biến phủ, đổi thêm = thêm rủi ro không cần.

## Soát bảo mật
Báo cáo của agent (nguyên ý): KHÔNG CÓ LỖ HỔNG ở mức tin cậy ≥ 8/10 (trước lọc 0, sau lọc 0). Đã xem: quyền + PIN của PUT/GET (`authenticate` + `checkPermission('manage_settings')` + `kiemPinChuQuan` trước khi ghi, bcrypt, khoá 5 lần), SQL (`NOT IN (?,…)` chỉ nối dấu `?`, id đã ép số nguyên dương), cửa công khai (danh sách trắng 10 trường, lỗi qua `loiMayChu`, chỉ đọc), chữ tự do (quầy là React, không `dangerouslySetInnerHTML`), bước 028 chỉ CREATE TABLE IF NOT EXISTS, sao lưu chỉ thêm bảng cấu hình.
Ghi cho chat App KH: coi `chu_dai` / `tieu_de` / `phu` / `chu_nut` là chữ thuần, không đưa vào HTML thô (máy chủ chỉ chặn ký tự điều khiển + độ dài).
SOÁT BẢO MẬT: ĐẠT

## Báo cáo 7 mục
```
VIỆC:        QC-APP-1 — Cài đặt "Quảng cáo trên App" (dải quảng cáo + banner Trang chủ theo ngày / khung giờ) + cửa GET /api/kh/quang-cao
ĐÃ SỬA:      server/routes/quang-cao.js (mới, route quầy + dsCongKhai) · server/routes/kh/index.js (cửa /quang-cao, tách docGioVang dùng chung với /gio-vang) ·
             server/nang_cap/028_quang_cao.js (bảng) · server/index.js (mount) · server/routes/backup.js (BACKUP_TABLES) ·
             client/src/pages/CaiDat/QuangCao.jsx + quangCao.js (mới) · Settings.jsx (thẻ, nhóm Khách hàng) · utils/api.js (quangCaoApi, loi_o) · client/dist (đã build) ·
             HOP_DONG_API_KH.md (v16) · cong_cu/thu_QCAPP1.js (mới) · thu_HOPDONG_KH.js (ca v16 + gieo dòng) · kiem_tra_truoc_khi_giao.js (nối bài thử)
BÀI THỬ:     chạy trên bản chưa vá (d121491) → ĐỎ: thu_QCAPP1 1 đạt · 21 hỏng, thu_HOPDONG_KH sập (chưa có bảng); sau khi vá → XANH: thu_QCAPP1 127 · thu_HOPDONG_KH 93 ·
             đột biến 105/105 BẮT · npm test PASS 114 · --day-du PASS 118 (1 cảnh báo có sẵn)
ĐÃ RÀ K4:    giờ vàng "đang chạy": 3 chỗ (kh/index.js docGioVang dùng chung với /gio-vang; manKhach.js:200, orders.js:587 để nguyên vì phiếu cấm đổi luật) ·
             cửa công khai dùng giuLuotMenu: 3 cửa (/menu, /chuong-trinh, /quang-cao) · BACKUP_TABLES: 1 chỗ thêm, không vào BANG_KHONG_KHOI_PHUC · thẻ Cài đặt trong Settings.jsx: 4 chỗ (nhập, quyền, nhóm, nút+nhánh vẽ) · id trùng khi lưu cả danh sách: đã chặn
CHƯA KIỂM:   (1) giao diện chưa thử trên điện thoại / trình duyệt thật — chỉ có bài thử nguồn + hàm thuần; (2) chưa chạy trên Turso / Render thật (kho thử libsql tệp);
             (3) cửa công khai với SX thật (layMenuQuay gọi SX) chưa thử — kho thử không bật SX; (4) hai tab Cài đặt lưu cùng lúc: tab sau thắng, dòng người khác vừa thêm có thể bị xoá;
             (5) App KH chưa đọc cửa mới; (6) cảnh báo duy nhất của --day-du là cảnh báo có sẵn (chưa đọc nội dung — tôi không đổi gì liên quan)
GIT:         git log --oneline -2 (xem cuối file)
BÀI HỌC:     KHOÁ 3 · NGUYÊN TẮC 1 · BỎ 2 — xem ## Bài học
```
Thử tay 3 thao tác (điện thoại, chủ quán): (1) Cài đặt → Khách hàng → "📣 Quảng cáo trên App" → Thêm dòng, gõ chữ > 32 ký tự → thấy "Quá n ký tự" và đỏ dưới ô khi Lưu; (2) sửa chữ hợp lệ, bấm Lưu → hỏi PIN → "Đã lưu"; tải lại trang vẫn còn; (3) mở `https://www.pos-tuquyduong.io.vn/api/kh/quang-cao` trên trình duyệt → thấy đúng dòng đang bật hôm nay.

## Bài học
Sự cố: (a) soát độc lập tìm id trùng / sai kiểu ở PUT cả danh sách; (b) vài đột biến "SỐNG" lúc đầu — hoá ra đột biến tương đương (DB chặn thay) hoặc ca quá yếu (phần trăm Giờ vàng cố định 20, vòng "Giờ vàng không có dòng" xanh khi cửa sập 500); (c) người gác chặn lệnh ghép nhiều bước / `sed -i` / tên file có chữ SECRET chưa commit (đều làm theo hướng dẫn); (d) bài `thu_BH2` đỏ lúc đầu vì kho nông, hết sau `--unshallow`.
- KHOÁ (đã làm, trong Phạm vi): ca A13 / A14 + đột biến BV-ID-TRUNG-BO, VS-ID-KIEU-LONG (id trùng / sai kiểu); `khongGV()` — "không có dòng" chỉ tính khi cửa trả 200; ca D2d (phần trăm 35 và 90, chặn chữ cứng); ca C6c (đổi chỗ dòng có id — id tăng dần che lỗi bỏ `uu_tien`).
- NGUYÊN TẮC (đề xuất cho chat soát, ngoài Phạm vi — `KHUON_LOI.md`): K3/K4 thêm một dòng "Bài thử cho cửa 'không có X' phải kiểm cả mã 200 (cửa sập 500 trả danh sách rỗng làm ca xanh oan); API lưu cả danh sách theo id phải kiểm id trùng + kiểu id; ca thứ tự phải đổi chỗ hàng đã có id (id tăng dần che lỗi thứ tự)" — ví dụ thật: QC-APP-1 VS-GIOVANG-KHONG-BAT (sập 500 lúc đầu qua được ca D4b), A13, C6c.
- BỎ: kho nông làm `thu_BH2` đỏ (một lần, môi trường — cách xử lý đã có ở skill bước 1.3); hai chỗ lệch chữ báo nhẹ (null → "phải là chữ").
- Dọn: không có lời dặn nào trong KHUON_LOI / CLAUDE.md mới có phép máy thay → không đề xuất xoá.
- Phát hiện (ngoài Phạm vi, ghi để sau): ba bản vị từ Giờ vàng (`manKhach.js:200`, `orders.js:587`, `kh/index.js docGioVang`) — gom khi GIOVANG-1; ba cửa /api/kh công khai chung một xô lượt (nên tách xô nếu Trang chủ App gọi cả ba mỗi lần mở).

## Cổng
✓ CỔNG CHẠY ĐẠT (node tu_chay/cong.js chay . d121491^ HEAD viec/QC-APP-1; kèm cảnh báo A16 "gốc in 22 ca ≠ 127" — bài trên gốc dừng sớm vì chưa có route / bảng, bằng chứng đỏ ở bang_chung_do.txt)

GIT (git log --oneline -2): f545fa4a QC-APP-1: dòng SỐ CA đúng dạng · 35eed91d QC-APP-1: trang_thai.md, bằng chứng vòng sửa 1

HEAD ĐÃ KIỂM: f545fa4a


## Gộp (chat soát cuối 13.11, bàn 36): ĐẠT. Hợp đồng /api/kh giữ v16 (v15 dành VOUCHER-2 — gộp sau, chat chèn v15 trước v16, PHIEN_BAN giữ 16). Hai tab lưu cùng lúc → tab sau thắng: chấp nhận như các thẻ Cài đặt khác.
HEAD ĐÃ KIỂM: 74ffb29
