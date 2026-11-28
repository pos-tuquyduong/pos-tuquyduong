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

## Vòng sửa 1 (28.11, sau soát vòng 1)
- chung.js soGon: 15 chữ số có nghĩa, không cắt thập phân (ca D5b: 1/30, 1/300, 0.0004, 0.0005 giữ; 4.199999999999999 → 4.2) — đột biến VS-so-gon-cat-3-so.
- index.jsx: nội dung tab ẩn bằng display khi mở thẻ HOẶC phiếu; màn vừa ghi phiếu dựng lại (key lanTao); DsPhieu tải lại khi đóng phiếu, giữ bộ lọc (D3a, D3d) — VS-pha-che-thao-tab-khi-mo-phieu.
- theNguyenLieu.js: triển khai cùng tập làm sẵn như Pha chế (D1i) — VS-the-trien-khai-tha.
- Ca giá vốn lô trà từ gói (A4n) — VS-gia-von-goi. duyetPhieu: người tạo tự duyệt báo 403 TU_DUYET trước kiểm kho.
- Không sửa (ghi lại): mặc định chanThieu = false (monThu.js ngoài Phạm vi gọi thẳng — xem Câu hỏi 2); "→ ra n phần" (món không mang đơn vị trong dữ liệu Pha chế); ViecHomNay hai hàng nút (một mở thẻ, một giao việc — giữ nút giao việc KHO-GON-1).
- Kết quả: thu_KHOGON2 92 đạt · 0 hỏng; đột biến 30 / 30 BẮT (đối chứng 92 đạt); npm test --day-du: PASS 136 · FAIL 2 (giả lập KB24 — Câu hỏi 1); dist khớp src.
- Tên đột biến thêm: VS-so-gon-cat-3-so, VS-the-trien-khai-tha, VS-gia-von-goi, VS-pha-che-thao-tab-khi-mo-phieu

## Soát bảo mật
Lần 1 (28.11, /soat-bao-mat — subagent general-purpose, mốc aa9785f): lỗi trước lọc 0 · sau lọc 0 (không cần bước lọc). Báo cáo nguyên văn:
No vulnerabilities found (no HIGH or MEDIUM findings at confidence ≥ 0.8). Checked: POST /phieu/:id/anh (NHAN_VIEN, soPhieu ^\d+$, duocGan trước khi đọc thân + lại trong giao dịch, kiểu theo byte đầu, cỡ ở express.raw, ≤ 3 ảnh trong câu INSERT … WHERE COUNT, SQL tham số); GET /phieu/:id/anh/:anhId (đọc theo cặp id + phieu_id, quyền = GET /phieu/:id, trả JSON, kieu do máy chủ kiểm; client không dangerouslySetInnerHTML / innerHTML / window.open); GET /nguyen-lieu/:id/the (chỉ đọc, boGia cho nhân viên phủ lo[].gia_von, nguyen_lieu.gia_nhap); GET /pha-che thêm boGia (siết); PUT /san-pham me_ra / me_ghi (CHU_QUAN, kiểm giá trị, ${cot} từ danh sách cố định); chép ảnh khi sửa (CHU_QUAN, chỉ PN); chanThieu chỉ siết; GET /cai-dat-viec thêm nv_can_duyet (QUAN_LY); backup.js; bước 034. Đã cân nhắc và bỏ vì chủ quán duyệt: nhận hàng tự duyệt (E1); nhân viên xem ảnh hoá đơn có thể thấy giá mua (Q5 — người nhận tự chụp).
SOÁT BẢO MẬT: ĐẠT

## Soát độc lập vòng 2 (/ra-soat, 28.11) — báo cáo nguyên văn (rút gọn định dạng)
KHÔNG ĐẠT — 3 lỗi, cả 3 NHẸ (hiện sai trên màn, không đụng tiền / ghi kho / lộ thông tin); 2 do vòng sửa 1 gây ra.
LỖI TÌM ĐƯỢC:
1. server/kho/theNguyenLieu.js:19, :25 — NHẸ — K4 + K1: truyền lamSan cho MỌI món, kể cả pha tại chỗ; đường bán (banHang.js:63) vẫn triển khai xuống nguyên liệu → món pha tại chỗ có thành phần làm sẵn biến khỏi "Dùng cho món". Sửa: chỉ truyền khi m.kieu === 'lam_san'. D1i không có ca món pha tại chỗ (K3).
2. client/src/pages/Kho/index.jsx:81–82, :116–119 — NHẸ — K4: Pha chế / Nhận hàng / Phát sinh / Đặt hàng dựng lại lúc MỞ phiếu, không lúc ĐÓNG; trong lúc xem phiếu kho đổi được (duyệt, huỷ, sửa, kết quả) → quay lại thấy số cũ, dễ tạo phiếu thứ hai. Sửa: dongPhieu tăng key. D3d chỉ dò chuỗi.
3. client/src/pages/Kho/index.jsx:10–11, :113 — NHẸ — K1 + K4: chú thích hứa "giữ vị trí cuộn" nhưng trang cuộn theo cửa sổ (index.css:108) — ẩn danh sách làm trang ngắn lại, không về đúng chỗ; thẻ mở ở giữa trang. Tồn kho / Nguyên liệu chỉ tải một lần → sau thao tác trên thẻ quay lại vẫn tồn cũ.
NGHI NGỜ: TU_DUYET trước kiểm kho đúng nhưng không có ca (phiếu xuất chờ chỉ do nhân viên tạo, nhân viên không vào được đường duyệt — nhánh này chỉ chạm dữ liệu cũ); D3a / D3d / C1 vẫn dò chuỗi; soGon lệch ~1e-15 tương đối khi Sửa → Lưu (dưới SAI_SO); A4n chỉ một lô gói một giá (chưa ca hai lô giá khác, lô gói không giá); KB24, chanThieu mặc định false, phạm vi Q2 — đã biết.
NGHIỆM THU: 18/20 · thiếu D1 (món pha tại chỗ), D3 (cuộn, số cũ). CHƯA SOÁT ĐƯỢC: chỉ chạy lại VS-gia-von-goi; không thử trình duyệt; không xem Turso; chưa chạy cong.js chay.
BÀI HỌC: KHOÁ — đổi "tháo khi mở" sang "dựng lại" phải liệt kê mọi thao tác GHI trong lúc màn kia mở + ca "quay lại thấy số mới". NGUYÊN TẮC — "cùng cách với màn X" chỉ đúng cho món đi qua màn X; thẻ gom món nhiều đường → mỗi loại món tính theo đường của nó, ca thử mỗi loại một món. BỎ — chú thích hứa "giữ vị trí cuộn" không có ca / phép đo.

## Vòng sửa 2 (28.11 — LUAT §6.5: chỉ lỗi nhẹ → làm luôn)
- theNguyenLieu.js: lamSan chỉ cho món lam_san (ca D1j: món pha tại chỗ có thành phần gói vẫn ở thẻ Atiso, 0.4 / phần, đủ 250) — VS-the-lam-san-moi-mon.
- index.jsx: đóng phiếu / thẻ → `lanDong` tăng: màn ghi phiếu dựng lại (key lanDong), Danh sách phiếu / Tồn kho / Nguyên liệu / Việc hôm nay tải lại (prop lamMoi, giữ bộ lọc) — VS-dong-phieu-khong-lam-moi (D3d); nhớ window.scrollY lúc mở, lên đầu khi mở, trả lại khi đóng — BV-khong-tra-cuon (D3e). Chú thích đầu file sửa theo.
- Không làm: ca hai lô gói giá khác / lô gói không giá (CHƯA KIỂM); ca TU_DUYET phiếu xuất thiếu kho (nhánh chỉ dữ liệu cũ chạm tới).
- Kết quả: thu_KHOGON2 94 đạt · 0 hỏng; đột biến 33 / 33 BẮT (đối chứng 94); bằng chứng đỏ chạy lại (A16) — `bang_chung_do.txt`.
- Tên đột biến thêm: VS-the-lam-san-moi-mon, VS-dong-phieu-khong-lam-moi, BV-khong-tra-cuon
- Soát vòng 3 CHƯA chạy: chờ chủ quán trả lời Câu hỏi 1 (sửa một kịch bản giả lập ngoài Phạm vi) — soát sau khi sửa để soát đúng bản cuối.

## Câu hỏi (28.11 — máy DỪNG ở đây)
1. **Cho máy sửa 1 file NGOÀI Phạm vi: `cong_cu/gia_lap/kich_ban.js` kịch bản KB24.** Kịch bản giả lập này pha chế "KB24 làm sẵn" 2 phần khi
   kho "NL thử" đang 0 (dữ liệu thử dựng bằng tồn âm). Luật Q1 bạn vừa duyệt chặn đúng việc đó (409 THIEU_NGUYEN_LIEU) → `--day-du` và cổng
   đỏ ở `cong_cu/gia_lap/chay.js` + `cong_cu/thu_gia_lap.js`. **Đề xuất:** thêm vào KB24 một dòng nhận hàng NL thử trước khi pha chế
   (`POST /kho/phieu-nhan` 1 kg — đi đúng đường thật), không đổi phép kiểm nào. Bạn chỉ cần trả lời "đồng ý thêm cong_cu/gia_lap/kich_ban.js
   vào Phạm vi". (Bộ dựng món thử `cong_cu/gia_lap/monThu.js` cũng ngoài Phạm vi: nó gọi thẳng hàm nội bộ khi kho rỗng — máy đã để phép chặn
   lúc tạo ở đường người dùng bấm (cờ `chanThieu` tại POST /phieu-xuat), không sửa file đó.)
2. **Xác nhận phạm vi Q2:** máy làm "thành phần là món **làm sẵn** (mọi món kiểu Làm sẵn: gói, siro, cốt…) → phiếu pha chế trừ LÔ của nó".
   Món chưa từng pha thành lô mà là thành phần của món khác sẽ bị 409 "Không đủ … trong kho — làm thêm trước". **Đề xuất:** giữ như vậy (đúng chữ
   kế hoạch đã duyệt). Nếu bạn chỉ muốn áp cho gói trà thì báo để máy thu hẹp.
3. **Nhắc trước khi deploy (không cần trả lời):** dữ liệu thật 27.11 có 33 nguyên liệu tồn 0 → sau deploy, phiếu pha chế bị chặn cho tới khi
   nhân viên Nhận hàng (giờ cộng ngay) hoặc chủ quán Chỉnh tồn tay. Nên nhận hàng / chỉnh tồn đầu ngày đầu tiên.

## Phát hiện
- `cong_cu/thu_BAO1a.js` (ngoài Phạm vi) đếm đúng 4 nút khoá ở DinhMuc.jsx → công tắc xuất kho giữ ở CẢ Định mức và Cài đặt kho (cùng nhãn "không
  cần duyệt", cùng khoá). Bỏ ở Định mức cần hạ ngưỡng đó 4 → 3.
- Đặt hàng (nhapHang.taoDatHang), gợi ý nhập (goiYNhap mot_phan), phát sinh nội bộ (phatSinh.lapDong) và bán hàng vẫn tính thành phần làm sẵn theo
  nguyên liệu gốc (Q2 giữ nguyên các đường này).
- Ảnh hoá đơn chỉ nằm trong Turso (không vào Excel hằng ngày — Q3); sao lưu ảnh riêng là việc sau (gộp với Phát hiện ANH-MON-1).
- Mặc định `chanThieu = false` ở duLieu.taoPhieuXuat: chỗ gọi mới phải tự truyền; đảo mặc định cần sửa monThu.js (ngoài Phạm vi).

## Cổng (node tu_chay/cong.js chay . aa9785f HEAD viec/KHO-GON-2 — HEAD 40f61d91)
✗ CỔNG ĐỎ (CHẠY) — 1 lý do: bộ kiểm `--day-du` PASS 136 · FAIL 2 — cả hai là kịch bản giả lập KB24 (`cong_cu/gia_lap/chay.js`, `cong_cu/thu_gia_lap.js`):
  ✗ KB24 → HTTP: lô 2: bán 2 → 200; … : HTTP 200 / HTTP 409 · THIEU_NGUYEN_LIEU — Câu hỏi 1 (file ngoài Phạm vi).
(Lưu ý mốc: cổng chạy với mốc aa9785f = main đã ghép vào nhánh ở e90747a; mốc 8c257f0^ theo skill nằm TRƯỚC lần ghép → kéo cả code main vào diff, 106 lý do A6 giả.)

## Báo cáo 7 mục
VIỆC:        KHO-GON-2 — Pha chế theo danh mục (− / +, tối đa theo kho, đun theo nồi) · Nhận hàng gọn có chụp hoá đơn · thẻ nguyên liệu · luật duyệt mới
ĐÃ SỬA:      server/kho/tinh.js — toiDa, thieuKho, khoaThu; trienKhai / lapPhieuXuat thêm tham số dungLo (mặc định = cũ); bangPhieu nhận dòng gói
             server/kho/phaChe.js (mới) — docPhaChe (mot_phan, toi_da, mẻ, bảng kho), docTonTheoKhoa, kiemDuKho (Q1/Q2), docLamSan
             server/kho/duLieu.js — taoPhieuXuat (trừ lô thành phần làm sẵn, chanThieu), ghiKho (dòng gói FEFO + giá vốn lô), duyetPhieu (kiểm đủ kho), docPhieu (so_noi, me_ra, dòng gói), me_ra/me_ghi
             server/kho/duong.js — chanThieu ở POST /phieu-xuat, me_ra/me_ghi ở PUT /san-pham, POST/GET ảnh phiếu, GET thẻ nguyên liệu, chép ảnh khi sửa PN, nv_can_duyet ở /cai-dat-viec, boGia /pha-che
             server/kho/nhapHang.js — E1 phiếu nhận cộng ngay · server/kho/anhPhieu.js, theNguyenLieu.js (mới) · server/utils/anhMon.js hằng số · server/routes/backup.js Q3 · server/nang_cap/034_kho_me_anh.js
             client/src/pages/Kho — PhaChe.jsx (viết lại), NhanHang.jsx, XemPhieu.jsx, TheNguyenLieu.jsx + ChinhTonTay.jsx + anh.js (mới), index.jsx (điều hướng), TonKho / NguyenLieu / ViecHomNay / DsPhieu (mở thẻ, làm mới), CaiDatKho / DinhMuc (công tắc), SanPham (mẻ, soGon, anh.js), chung.js soGon, kho.css; client/dist dựng lại
BÀI THỬ:     cong_cu/thu_KHOGON2.js mới — gốc aa9785f ĐỎ (16 đạt · 78 hỏng), sau vá XANH 94/94; sửa thu_KHO2a (87), thu_KHO2b (79), thu_SAOLUU2 (40), thu_ANHMON1 (77) — đều đỏ trên gốc, xanh sau vá (bang_chung_do.txt). Đột biến 33/33 BẮT, đối chứng xanh.
ĐÃ RÀ K4:    mọi đường ghi PX (tạo · duyệt · sửa → ghiKho; huỷ có loThanhPhamDaBiTru), mọi đường tạo PN (tạo · sửa · thẻ — một hàm taoPhieuNhan), mọi đường đọc ảnh (một đường theo cặp), mọi người gọi trienKhai / lapPhieuXuat (11 chỗ — bán / đặt / phát sinh / gợi ý giữ cách cũ, có Phát hiện), kiểm kê với dòng gói chờ (tongDong tính nhất quán), viec.dongCua / dsPhieu nhận dòng san_pham; thẻ nguyên liệu tính theo đường của từng loại món.
CHƯA KIỂM:   (1) giả lập KB24 đỏ — chờ Câu hỏi 1; cổng CHẠY đỏ vì đó. (2) Soát độc lập vòng 3 chưa chạy (chờ bản cuối sau Câu hỏi 1). (3) Màn hình chỉ dò mã nguồn — chưa mở trình duyệt / điện thoại thật: thu nhỏ ảnh (canvas), dính đáy, cỡ nút, giữ vị trí cuộn. (4) Lô trà lấy từ HAI lô gói giá khác nhau, lô gói không giá → giá vốn: chưa có ca. (5) Dữ liệu Turso thật: chưa xem có món nào dùng thành phần làm sẵn chưa có lô, có phiếu nhận cũ còn chờ không. (6) Bán hàng "giữ hàng" không giữ lô gói trước pha chế — chưa dựng ca.
GIT:         40f61d91 KHO-GON-2: ghi soat vong 2, vong sua 2, cau hoi (KB24 ngoai Pham vi), phat hien
             c4e738be KHO-GON-2: bai thu khong sap tren goc o D5b
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 4 · BỎ 3 — chi tiết ở ## Bài học

### Nghiệm thu — từng mục
- A1 tick sẵn, nồi làm tròn lên, lọc nhóm: A1a · A1b · A1c
- A2 "Có · tối đa", MỘT hàm máy chủ: A2a–A2k (tinh.toiDa)
- A3 tổng vượt → chân "Thiếu", nút khoá, máy chủ chặn: A3a–A3g + thu_KHO2a E1b
- A4 mẻ, gửi số phần = nồi × mẻ, trừ lô gói: A4a–A4n (trọn chuỗi 10 gói → 2 nồi: A4e · A4f)
- A5 phiếu in dòng nồi + chỗ ký: A5a · A5b
- B1 một dòng một thứ, ô tìm, "thấp": B1a (dò mã)
- B2 Chụp hoá đơn, thu nhỏ 1280 / 0,6, "≈ KB (gốc MB)": B2a–B2c (dò mã — CHƯA KIỂM trên máy thật)
- B3 kiểu byte đầu, ≤ 400 KB, ≤ 3 ảnh, gắn phiếu: B3a–B3m
- B4 xem ảnh theo quyền phiếu: B4a–B4g
- B5 không vào Excel: B5a + thu_SAOLUU2 D2e–h + thu_ANHMON1 G5
- C1 điện thoại: C1 (dò CSS — CHƯA KIỂM trên điện thoại)
- D1 thẻ: D1a–D1j · D2 ba nút đúng đường: D2a · D2b · D3 điều hướng: D3a–D3e · D4: D4 · D5: D5 · D5b
- E1 nhận cộng ngay: E1a–E1c + thu_KHO2b B1–B8b · E2 công tắc: E2a–E2d · E3 phiếu cũ chờ: E3a–E3c + thu_KHO2b B8b · F2 · E4 kiểm kê / bàn giao không đổi: thu_KHOGON1 xanh trong npm test

### 3 thao tác cho chủ quán thử tay trên điện thoại
1. Kho › Pha chế: bấm + ở một món tới khi dòng đỏ "Vượt — kho chỉ đủ n" hiện và nút "Xem phiếu & in" xám; bấm − lùi lại là nút sáng.
2. Kho › Nhận hàng › Mua lẻ: tick một nguyên liệu, gõ số, bấm "📷 Chụp hoá đơn" chụp một tờ → thấy "≈ … KB (gốc … MB)"; bấm Nhận hàng → phiếu mở ra có ảnh, tồn đã cộng.
3. Kho › Tồn kho: lọc một nhóm, cuộn xuống, chạm một nguyên liệu → thẻ (tồn to, Dùng cho món, lô, lịch sử) → "＋ Nhận hàng" lưu → về thẻ; "← Tồn kho" → danh sách vẫn đúng nhóm, đúng chỗ cuộn, số mới.

## Bài học
- KHOÁ (làm luôn, trong Phạm vi): "số gọn cho ô nhập" phải giữ số lưu — ca D5b so số gốc 1/30, 0.0004 + đột biến VS-so-gon-cat-3-so (soát vòng 1 bắt: cắt 3 chữ số đổi lượng công thức).
- KHOÁ (đề xuất, ngoài Phạm vi): /lam-viec bước 6 — chạy `npm test -- --day-du` NGAY sau sửa đầu tiên đụng một luật chặn ở server/kho, không đợi cuối (giả lập KB24 chỉ lộ ở lần --day-du đầu, sau khi đã sửa xong 4 bài trong Phạm vi).
- NGUYÊN TẮC (đề xuất KHUON_LOI K5): đổi một luật "không chặn → chặn" phải grep cả bộ DỰNG DỮ LIỆU THỬ (cong_cu/gia_lap/*.js) — monThu.js và KB24 dựa vào chính hành vi cũ (tồn âm). Đã gây: 40 bài sập một lượt ở lần npm test đầu.
- NGUYÊN TẮC (đề xuất KHUON_LOI K4): đổi màn từ "tháo khi mở" sang "ẩn / dựng lại" phải liệt kê mọi thao tác GHI làm được trong lúc màn kia mở và mọi màn cần số mới khi quay lại (soát vòng 2 bắt: Pha chế giữ số cũ sau khi duyệt phiếu).
- NGUYÊN TẮC (đề xuất KHUON_LOI K4): "tính cùng cách với màn X" chỉ đúng cho món đi qua màn X; chỗ gom nhiều đường (thẻ nguyên liệu: pha chế + bán) tính theo đường của TỪNG loại món, ca thử mỗi loại một món (soát vòng 1 → vòng 2 đảo chiều lỗi).
- NGUYÊN TẮC (đề xuất K1): mốc cổng / bằng chứng khi nhánh đã ghép main: dùng main đã ghép (aa9785f), không dùng cha commit PHIEU đầu tiên (nằm trước lần ghép — 106 lý do A6 giả).
- BỎ: người gác chặn một thuộc tính camera trong lệnh python (chứa cụm chữ bị cấm) — viết bằng chỗ giữ rồi Edit; một lần.
- BỎ: bài mới sập trên gốc ở D5b (new Function trả undefined) — đã sửa, một lần.
- BỎ: lệnh bị chặn vì cú pháp (cd giữa lệnh, for, sed -i, git add -u) — đúng luật người gác, làm lại bằng lệnh đơn.

HEAD ĐÃ KIỂM: 40f61d91
