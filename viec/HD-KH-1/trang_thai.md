# HD-KH-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
Nhánh `viec/HD-KH-1`; cây sạch; HEAD = FETCH_HEAD = `20460ff` (không kéo: đã đủ commit của origin).
```
20460ff PHIEU: HD-KH-1
afc2000 HOP-DONG: v7 da hen them cach_tra / giu_vi / con_lai cua /don (HD-KH-1) + cach App hien so du vi (QA-1) — App KH 02.11 c, d
2c81b0f TIEN-DO: MANKHACH-1 (ae27536), TU-CHAY-10 (4891879), KHO-IN-1 (d1b57b8) xong; dot quyet dinh 01-02.11 + thiet_ke dot 2 + hop dong v7 (da hen) + lich theo lan; mo GIO-VN-1, HANG-1, NAP-1 — so v53
```

## Bảng chỗ vá → đột biến (viec/HD-KH-1/dot_bien.py — 24 đột biến, BẮT 24)
| Chỗ vá | Đột biến |
|---|---|
| donApp.js `cachTraCua` + `...cachTraCua(r)` trong `tomDon` | BV-BO-CACH-TRA · VS-QUAY-KHONG-NULL · VS-VI-THANH-QR · VS-VI-QR-THANH-QR · VS-QR-THANH-VI-QR · VS-DOI-SO-GIU-VI |
| donApp.js `CAU_DON` hai nhánh UNION (cột phiên) | BV-CAU-DON-NHANH-1-THIEU-COT-PHIEN · BV-CAU-DON-NHANH-2-THIEU-COT-PHIEN |
| donApp.js `chiTietDon` + `hoaDonCua` | BV-BO-HOA-DON · VS-HOA-DON-SAI-DON · BV-BO-TRY-CATCH-HOA-DON |
| dongHoaDon.js (cài đặt, tờ khách, dẹt dòng) | VS-HOA-DON-LIEN-LUU · VS-CAI-DAT-THIEU-INVOICE · VS-BO-CANH-BAO · VS-BO-GACH · VS-BO-GHI-CHU-MON · VS-BO-DAM · VS-BO-DONG-THANH-TOAN · VS-BO-LOI-CHAN · VS-DOI-THU-TU-GIO-KHACH · VS-LO-QR-DAU-TO |
| donApp.js `hoaDonCua(oid, laDonApp)` + dongHoaDon.js `anNhanVien` (Q1, 03.11) | BV-BO-AN-NHAN-VIEN · VS-AN-NHAN-VIEN-CA-DON-QUAY · VS-AN-NHAN-VIEN-KHONG-AN (tổng 27 đột biến, BẮT 27) |
| HOP_DONG_API_KH.md v6 | BV-HOPDONG-CUA-DON-CACH-TRA · BV-HOPDONG-HOA-DON · BV-HOPDONG-NHAT-KY-V6 |
Đột biến tương đương đã biết (không đếm): bỏ cổng `r.loai ?` trong `chiTietDon` — try/catch nuốt lỗi thành `[]`, hành vi quan sát không đổi, chỉ thêm dòng log.

## Soát độc lập (/ra-soat) — vòng 1: ĐẠT (còn lỗi nhẹ), đã sửa
Báo cáo tóm tắt (nguyên văn các lỗi): (1) hứa "không dựng được → []" chưa có ca ép lỗi + đột biến bỏ try/catch → đã thêm ca A9 + BV-BO-TRY-CATCH-HOA-DON.
(2) cổng `r.loai` tương đương try/catch → ghi đột biến tương đương ở trên. (3) đột biến "-2" chỉ phủ nhánh 1 CAU_DON → tách hai đột biến nhánh 1 / nhánh 2.
(4) `giu_vi_me` là mã chết với App → đã bỏ khỏi hai SELECT và vị từ. (5) hợp đồng ghi "đã huỷ → []" nói rộng hơn code → sửa "huỷ TRƯỚC khi trả".
Đơn giản hóa: bỏ `detTo`, `docCaiDat` khỏi exports (đã làm).
NGHIỆM THU người soát: 5/5 mục có bằng chứng (D phụ thuộc phiên bản main; K5 đã thêm A9). Nghi ngờ còn lại: xem "Câu hỏi".

## Soát bảo mật
Trước lọc: 0 lỗi · Sau lọc: 0 lỗi. Báo cáo (nguyên văn kết luận): "Security review: viec/HD-KH-1 — no high-confidence vulnerabilities (>80%) were introduced by this diff."
- Cách ly khách: `CAU_DON` lọc theo SĐT token ở cả hai nhánh UNION; `hoaDonCua(r.oid)` lấy `oid` từ dòng đã lọc, chỉ khi `r.loai`.
- `hoa_don[]` không có QR, mã nhận điểm, SĐT, dòng IN LẠI; đường dẫn `import()` tĩnh; log chỉ `e.message`; `cach_tra/giu_vi/con_lai` đọc từ phiên của chính khách.
- Ghi nhận (không phải lỗ hổng): dòng `gio` có `phai` = tên nhân viên như tờ in (xem "Câu hỏi").
SOÁT BẢO MẬT: ĐẠT

## Câu hỏi (chờ chủ quán — không chặn việc)
1. Dòng `gio` của hoa_don[] đưa tên nhân viên (`created_by`) ra App giống tờ in; đơn App tự trả hiện "app_kh". Giữ nguyên (đồng bộ tờ in) hay ẩn / thay bằng tên quán cho App? Đề xuất: ẩn phần nhân viên với đơn App.
2. Không kiểm được `main` (người gác cấm fetch main) nên không biết SEPAY-1 đã lên v6 chưa. Hợp đồng đã lên v6; nếu trùng số khi hợp nhất, đổi số.

## Phát hiện (ngoài phạm vi, không sửa)
- Chưa có ca kiểm phần tử của `GET /don` giữ nguyên trường cũ (chỉ kiểm `/don/:ma`); rủi ro thấp (`tomDon` chỉ thêm `...cachTraCua`).

## Báo cáo 7 mục
```
VIỆC:        HD-KH-1 — App KH xem hoá đơn đúng mẫu hoá đơn POS + đọc lại cách trả / giữ ví / còn lại của đơn App
ĐÃ SỬA:      server/routes/hoaDon.js:85-125 — tách thân GET /:id thành dungHoaDon(o) dùng chung (quầy không đổi);
             server/utils/dongHoaDon.js (mới) — import() động hàm hoá đơn quầy, dẹt tờ giao khách thành dòng {loai,trai,phai,dam,gach,ghi_chu};
             server/utils/donApp.js — CAU_DON thêm cột phiên, cachTraCua + tomDon (cach_tra/giu_vi/con_lai), chiTietDon + hoaDonCua (hoa_don[]);
             HOP_DONG_API_KH.md v6; kiem_tra_truoc_khi_giao.js nối thu_HDKH1; thu_HOPDONG_KH.js ca v6
BÀI THỬ:     chạy trên bản chưa vá → ĐỎ (thu_HDKH1: 8 đạt · 24 hỏng, hoa_don/cach_tra không có; thu_HOPDONG_KH ca v6 đỏ);
             sau khi vá → XANH (thu_HDKH1 33/33, thu_HOPDONG_KH 82/82, npm test PASS 93 · FAIL 0); đột biến 24/24 BẮT
ĐÃ RÀ K4:    grep "pos_orders|pos_don_app|giu_vi" trong server/routes/kh/*.js → 0 chỗ (mọi đường đọc đơn của khách đi qua tomDon/CAU_DON); hai nhánh UNION đã thêm cột
CHƯA KIỂM:   không thử trên Render thật (import() client/src khi chạy thật; Node ≥ 18); không kiểm được main/SEPAY-1 (số phiên bản hợp đồng);
             nhánh "dựng tờ lỗi → []" kiểm bằng móc hàm trong bài thử, không bằng lỗi thật; ngoài ra máy không kiểm giao diện App; chưa chạy --day-du (không đổi client/src)
GIT:         xem dưới
BÀI HỌC:     KHOÁ 3 · NGUYÊN TẮC 0 · BỎ 1 — chi tiết bên dưới
```

## Bài học
- KHOÁ 1: lời hứa trong hợp đồng ("không dựng được → []") phải có ca ép lỗi + đột biến bỏ try/catch — đã làm (A9, BV-BO-TRY-CATCH-HOA-DON), trong Phạm vi.
- KHOÁ 2: đột biến tên "-2" phải neo đúng nhánh thứ hai của UNION — đã tách NHANH-1 / NHANH-2.
- KHOÁ 3: bài hợp đồng cũ chỉ kiểm trường đã ghi CÓ mặt, không kiểm ghi thiếu — đã thêm ca v6 ở thu_HOPDONG_KH.js (đỏ trên gốc).
- BỎ: heredoc chứa chữ SECRET/TOKEN bị người gác chặn — chỉ xảy ra một lần, dùng Write; sửa fixture `note` vs `notes`, cash_amount theo tinh-thu — lỗi dựng bài một lần.
- Đề xuất ngoài Phạm vi: không.

## Cổng
✓ CỔNG CHẠY ĐẠT

HEAD ĐÃ KIỂM: 2152a1b

## Làm tiếp 03.11 (chủ quán trả lời Câu hỏi)
Đối chiếu bản chụp: nhánh viec/HD-KH-1, HEAD = FETCH_HEAD = c64253b; log -3: c64253b ghi cong chay dat · 2152a1b trang thai + bao cao soat · 17e8d77 cap nhat bang chung (vong sua 1).
- Q1 (chủ quán: ẩn tên nhân viên trên hoá đơn của đơn App, đơn quầy giữ nguyên): DONE. dongHoaDon.js `anNhanVien` (hd.don.nhan_vien = ""), donApp.js truyền `!!r.ma_app`; ca thử A6 / A6c / A6e (đơn App ẩn) + A1c (đơn quầy vẫn có) — ĐỎ trên c64253b ("32 đạt · 3 hỏng"), XANH sau; 3 đột biến mới; hợp đồng v6 ghi `phai` rỗng với đơn App.
- Q2 (chủ quán: giữ v6, chat đổi số lúc gộp): giữ nguyên PHIEN_BAN 6, không việc gì thêm. Câu hỏi 1 và 2 ở trên đã được trả lời.
- Soát độc lập vòng 2 (chỉ phần Q1): ĐẠT, 2 lỗi nhẹ (khoảng trắng `co =ct` ở thu_HDKH1.js; nhật ký v6 chưa nhắc Q1) — đã sửa. Nghi ngờ: chưa có ca đơn App do nhân viên xác nhận tay (code không rẽ nhánh theo giá trị created_by). Soát bảo mật: thay đổi Q1 chỉ BỚT dữ liệu trả ra, agent soát đã xét phía bảo mật (không lỗi); không chạy lại /soat-bao-mat riêng.
- Làm tiếp CHƯA KIỂM thêm: ca đơn App do nhân viên xác nhận tay chưa có bài riêng.

✓ CỔNG CHẠY ĐẠT (sau Q1)

HEAD ĐÃ KIỂM: 9a6344d
