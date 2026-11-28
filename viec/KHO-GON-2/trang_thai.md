# KHO-GON-2 — trạng thái

## Bước 1 — đối chiếu bản chụp (28.11.2026)
- Nhánh: viec/KHO-GON-2 · cây sạch · HEAD 6137dc7 · FETCH_HEAD 6137dc7 (bằng nhau, không kéo).
- git log --oneline -3:
  - 6137dc7 PHIEU: KHO-GON-2 — them the nguyen lieu (D) + luat duyet moi (E, chu quan chot 27.11), cho duyet ke hoach — chat ban 41
  - 8c257f0 PHIEU: KHO-GON-2
  - acc8892 Merge pull request #104 from pos-tuquyduong/viec/TIEN-KHOA-2

## Câu hỏi (phiên 28.11 sáng — ĐÃ GIẢI: chat bàn 42 ghép main aa9785f5 có KHO-GON-1 #110 vào nhánh)
1. ~~**KHO-GON-1 chưa có trong nhánh này → dừng theo phiếu.** Phiếu ghi: "LÀM SAU KHO-GON-1 … bắt đầu từ main ĐÃ có KHO-GON-1; nếu
   KHO-GON-1 chưa merge thì DỪNG hỏi, đừng làm song song". Đã kiểm trên cây (28.11):
   - nhánh dựng từ main `acc8892` (PR #104 TIEN-KHOA-2); `git log` không có commit nào mang mã KHO-GON-1;
   - không có thư mục `viec/KHO-GON-1/`, không có `cong_cu/thu_KHOGON1.js` (Phạm vi của phiếu có tên file này);
   - `server/nang_cap/` dừng ở `032_ten_mon_sx.js` (phiếu đặt bước mới là `034` → `033` là của KHO-GON-1, chưa có);
   - grep "KHO-GON-1" cả kho chỉ thấy trong `viec/KHO-GON-2/phieu.md`.
   Các mục D2 ("Chỉnh tồn" — đường chỉnh tay của KHO-GON-1), E1/E2 (Diễn biến của KHO-GON-1), E4 (kiểm kê / bàn giao KHO-GON-1) cần code đó.
   **Đề xuất:** chủ quán merge PR KHO-GON-1 vào main, rồi dựng lại nhánh `viec/KHO-GON-2` từ main mới (hoặc ghép main vào nhánh —
   máy không tự `merge`), rồi chạy lại `/lam-viec KHO-GON-2`. Máy chưa viết kế hoạch, chưa sửa code.~~

## Bước 1 — đối chiếu bản chụp, lần 2 (28.11.2026, `/lam-viec KHO-GON-2 tiep`)
- Nhánh: viec/KHO-GON-2 · cây sạch · HEAD 0641161 · FETCH_HEAD 0641161 (bằng nhau, không kéo; hook mở phiên đã kéo 6137dc7 → 0641161).
- git log --oneline -3:
  - 0641161 PHIEU: KHO-GON-2 — bo sung 28.11: dung lai anh ANH-MON-1, bang anh phieu vao BANG_KHONG_XUAT_EXCEL, luat khoa Q13/Q14, Pham vi them anhMon/backup/thu_SAOLUU2 — chat ban 42
  - e90747a Merge main aa9785f5 (KHO-GON-1 #110) vao viec/KHO-GON-2 — chat ban 42
  - aa9785f Merge pull request #110 from pos-tuquyduong/viec/KHO-GON-1
- Có commit `PHIEU: KHO-GON-2` (8c257f0, 6137dc7, 0641161). Có KHO-GON-1: `server/nang_cap/033_viec_kho.js`, `server/kho/viec.js`, `server/kho/kiemKe.js`.

## Bước 3 — kế hoạch
- `viec/KHO-GON-2/ke_hoach.md` — phiếu "Chờ duyệt kế hoạch" → commit, push, DỪNG. Có 4 câu hỏi cho chủ quán (Q1, Q2, Q3, Q5 — kế hoạch mục 9; Q4 đã bỏ sau soát, mục 11). Agent chỉ đọc đã soát kế hoạch 4 câu; sửa theo soát ở mục 11.
- Kho nông (bản chụp): npm test đỏ ở thu_BH2 G1 vì thiếu commit cbbb809 → git fetch --unshallow (chỉ tải lịch sử, không đổi file).

## Duyệt kế hoạch (28.11.2026 — chủ quán qua chat)
- Q1 = đề xuất: màn khoá nút + máy chủ chặn 409 THIEU_NGUYEN_LIEU lúc TẠO / DUYỆT phiếu xuất pha chế; chủ quán sửa phiếu cũ không chặn.
- Q2 = đề xuất + bổ sung: làm gói = phiếu xuất món gói (trừ thảo dược, cộng lô gói — đường có sẵn); pha trà từ gói → CHỈ trừ lô gói (hạn gần
  trước), KHÔNG trừ thảo dược lần hai; không đủ → 409 KHONG_DU_TON; bán / đặt hàng / phát sinh giữ nguyên (Phát hiện). Thêm MỘT ca trọn chuỗi
  làm 10 gói → pha 2 nồi + đột biến đưa lại cách trừ thảo dược.
- Q3 = đồng ý · Q5 = đề xuất · ngân sách ~520 code + ~480 thử chấp nhận. Kế hoạch theo mục 11 (không cột so_noi).
- Song song GIAO-DIEN-4 (không đụng Kho/**); xung đột client/dist chat ghép lúc gộp.

## Bước 4–6 — bài thử, sửa, kiểm (28.11.2026)
- Bài mới `cong_cu/thu_KHOGON2.js` (88 ca) — đỏ trên gốc aa9785f (14 đạt · 73 hỏng lần đầu). Bằng chứng: `viec/KHO-GON-2/bang_chung_do.txt`.
- Bài cũ sửa (LUAT §6.7–6.9, bài sửa thường — đều đỏ trên gốc): thu_KHO2a (Q1/Q2 + ca E1b), thu_KHO2b (E1), thu_SAOLUU2 D2e–h (Q3), thu_ANHMON1 G5 · H1 · H2.
- `npm test`: PASS 134 · FAIL 0 (CẢNH BÁO 1 có sẵn). `--day-du`: dist khớp src; ĐỎ ở giả lập KB24 (`cong_cu/gia_lap/kich_ban.js` — NGOÀI Phạm vi) → `## Câu hỏi` cuối file.

### Chỗ vá → đột biến (`viec/KHO-GON-2/dot_bien.py`, 26 / 26 BẮT, đối chứng xanh 88 đạt)
| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| tinh.toiDa (A2) | VS-toi-da-bo-1-nguyen-lieu · VS-toi-da-lam-tron-sai | A2b · A2c |
| chặn thiếu lúc tạo — cờ chanThieu ở POST /phieu-xuat (Q1) | BV-bo-chan-thieu · VS-chan-bang-ton | A3a–c · A3e |
| chặn thiếu lúc duyệt (duLieu.duyetPhieu) | BV-bo-chan-luc-duyet | A3d |
| chủ quán sửa KHÔNG chặn (K5) | VS-chan-ca-khi-sua | A3f |
| nút "Xem phiếu & in" khoá khi thiếu (PhaChe.jsx) | VS-nut-khong-khoa-thieu | A3g |
| trừ lô gói thay vì thảo dược (Q2 — đột biến chủ quán dặn) | VS-goi-trien-khai | A4f |
| gói thiếu lô → 409 ở ghiKho (đường sửa) | BV-goi-khong-chan-lo | A4m |
| màn nhân nồi × mẻ | VS-noi-khong-nhan | A4l |
| kiểm me_ra > 0 | VS-me-ra-nhan-0 | A4b |
| số nồi chỉ khi chẵn mẻ | VS-so-noi-khong-chan-me | A4g |
| kiểu ảnh theo byte đầu | VS-anh-tin-duoi-file | B3b |
| cỡ ảnh ≤ 400 KB | VS-anh-khong-gioi-han | B3c |
| ≤ 3 ảnh trong câu ghi | VS-anh-qua-so | B3e · B3f |
| người gắn ảnh (Q5) | VS-anh-nguoi-khac-gan | B3g |
| phiếu huỷ không gắn | BV-anh-phieu-huy | B3j |
| quyền đọc ảnh = quyền xem phiếu | BV-bo-kiem-quyen-xem-anh | B4d |
| đọc ảnh theo cặp (phiếu, ảnh) | VS-anh-doc-khong-theo-phieu | B4c |
| sửa phiếu nhận giữ ảnh | BV-sua-pn-mat-anh | B4f |
| thẻ bỏ giá cho nhân viên | VS-the-lo-gia | D1e |
| số gọn ô sửa (D5) | BV-so-gon | D5 |
| nhận cộng ngay (E1) | VS-nhan-van-cho-duyet | E1a |
| công tắc xuất kho (E2, có sẵn — khoá hành vi) | VS-cong-tac-bo-qua · VS-nv-doi-cong-tac · BV-xuat-nv-khong-duyet-khi-tat | E2c · E2b · E2a |

Tên đột biến: VS-toi-da-bo-1-nguyen-lieu, VS-toi-da-lam-tron-sai, BV-bo-chan-thieu, BV-bo-chan-luc-duyet, VS-chan-ca-khi-sua, VS-chan-bang-ton,
VS-nut-khong-khoa-thieu, VS-goi-trien-khai, BV-goi-khong-chan-lo, VS-noi-khong-nhan, VS-me-ra-nhan-0, VS-so-noi-khong-chan-me, VS-anh-tin-duoi-file,
VS-anh-khong-gioi-han, VS-anh-qua-so, VS-anh-nguoi-khac-gan, BV-anh-phieu-huy, BV-bo-kiem-quyen-xem-anh, VS-anh-doc-khong-theo-phieu, BV-sua-pn-mat-anh,
VS-the-lo-gia, BV-so-gon, VS-nhan-van-cho-duyet, VS-cong-tac-bo-qua, VS-nv-doi-cong-tac, BV-xuat-nv-khong-duyet-khi-tat

## Soát độc lập vòng 1 (/ra-soat, 28.11 — agent general-purpose, mốc aa9785f) — báo cáo nguyên văn
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
- client/src/pages/Kho/chung.js:5 (soGon) + SanPham.jsx:177–179 (batSua) + XemPhieu.jsx:265 — K5/K4. D5 ghi "không đổi số lưu", nhưng ô sửa công thức nay điền sẵn soGon(...) = làm tròn 3 chữ số. Chủ quán sửa món rồi Lưu thì lượng bị ghi lại đã làm tròn: soGon(1/30) = "0.033", soGon(1/300) = "0.003", soGon(0.0005) = "0.001", soGon(0.0004) = "0". Nồi 30 ly → 0.033 gói/ly → 2 nồi trừ 1,98 gói; lượng nhỏ → "0" → PUT 400. Ô sửa dòng phiếu DH / PN / PS cũng vậy (XemPhieu.jsx:265). Bài D5 chỉ dò chuỗi (thu_KHOGON2.js:435), BV-so-gon không bắt lỗi làm tròn (K3). Sửa: chỉ làm tròn để HIỂN THỊ, hoặc theo số chữ số có nghĩa.
- client/src/pages/Kho/index.jsx:110–123 — K4 so với kế hoạch đã duyệt (mục 11 S5 "ẩn bằng display, không tháo áp cho CẢ XemPhieu và thẻ"): code chỉ ẩn khi mở thẻ; mở phiếu vẫn tháo tab → mất bộ lọc, ô tìm, cuộn. D3a chỉ dò chữ "display" nên xanh oan (K3).
- server/kho/theNguyenLieu.js:23 — K4, nhẹ. "Dùng cho món" gọi tinh.trienKhai không truyền tập làm sẵn → thẻ Atiso ghi "Trà nồi: đủ khoảng N phần" theo thảo dược, Pha chế tính theo LÔ gói → hai màn hai số.
NGHI NGỜ:
- Q2 rộng hơn chữ duyệt: tinh.js:39 trừ LÔ cho MỌI thành phần lam_san (docLamSan, phaChe.js:9), không riêng gói; thu_KHO2a.js:130–150 đổi Siro đường sang pha_tai_cho để bài cũ khỏi đỏ. Món có thành phần làm sẵn chưa từng pha thành lô sẽ bị 409 KHONG_DU_TON → nên hỏi lại chủ quán + kiểm dữ liệu thật.
- Deploy (K5): dữ liệu thật 27.11 có 33 nguyên liệu tồn 0 → Q1 chặn mọi phiếu pha chế tới khi nhận hàng / chỉnh tồn tay; chưa nhắc chủ quán.
- Mặc định chanThieu = false (duLieu.js:158) mở cho chỗ gọi mới — lâu dài nên đảo (mặc định chặn; suaPhieu, monThu truyền false).
- Giá vốn lô thành phẩm làm từ gói (duLieu.js:195–221) đọc thấy đúng nhưng không có ca / đột biến.
- duyetPhieu kiểm đủ kho TRƯỚC câu khoá: người tạo tự duyệt phiếu thiếu kho nhận 409 THIEU thay vì 403 TU_DUYET. Nhẹ.
- Bán hàng "giữ hàng" không giữ lô gói trước pha chế. Chưa dựng ca.
- PhaChe.jsx:120, XemPhieu.jsx:185 ghi "→ ra n phần", phiếu viết "ra 25 ly". Nhẹ.
NGHIỆM THU: 18/20 mục có bằng chứng · mục thiếu: D3 (XemPhieu vẫn tháo tab; D3a / D3c dò chuỗi), D5 (hành vi sai — đổi số lưu). B2, D2, C1 chỉ dò chuỗi.
CHƯA SOÁT ĐƯỢC: --day-du chưa in kết quả kịp; không chạy dot_bien.py; không xem dữ liệu Turso; giao diện điện thoại không thử trình duyệt.
BÀI HỌC: KHOÁ — "số gọn" chỉ để HIỂN THỊ; vào ô nhập phải có ca lưu-lại-không-sửa so bằng số gốc (1/30, 0.0004). NGUYÊN TẮC — lời duyệt có ngoặc ví dụ ("làm sẵn (gói)") thì phạm vi hẹp theo ví dụ; đổi dữ liệu bài cũ để né hành vi mới là dấu hiệu đang mở rộng. NGUYÊN TẮC — mỗi dòng S1–S5 cần một ca kiểm HÀNH VI, không chỉ dò chuỗi.
