# CK-NOIDUNG-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: `viec/CK-NOIDUNG-1`; cây sạch; `git fetch origin viec/CK-NOIDUNG-1` được.
- HEAD `4ec877f` · FETCH_HEAD `4ec877f` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  4ec877f PHIEU: CK-NOIDUNG-1
  7f9693f TIEN-DO: KH-SDT-1, GIO-VN-1, KH-NHANH-POS-1, HD-KH-1, SEPAY-1, CT-1a, SUA-E2-1, SUA-C9-1 xong; quyet dinh 04-05.11; mo GIAO-DIEN-1, CK-NOIDUNG-1, HUY-1, KH-TOMTAT-1 — so v54
  4723a3b Merge pull request #72 from pos-tuquyduong/viec/SUA-C9-1
  ```

## Đối chiếu bản chụp — lượt "tiep" 05.11 (sau duyệt)
- Nhánh `viec/CK-NOIDUNG-1`; cây sạch; hook mở phiên đã kéo `4ec877f → 150e7db`; `git fetch` được.
- HEAD `150e7db` · FETCH_HEAD `150e7db` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  150e7db PHIEU: CK-NOIDUNG-1 chu quan tra loi Q1-Q3 (them hoaDon.js, dongHoaDon.js, wallets.js, thu_SEPAY1.js, thu_P26c.js vao Pham vi)
  a10a453 CK-NOIDUNG-1: ke hoach sua theo soat (payOS giu TQD<id>, khop SePay bang noi_dung, them ca, Q2/Q3 du file)
  69fc4d4 CK-NOIDUNG-1: ke hoach (cho duyet) + trang thai
  ```

## Đối chiếu bản chụp — lượt "tiep" 05.11 lần 2 (Q4, Q5, phiên App lỗi vào ví)
- Nhánh `viec/CK-NOIDUNG-1`; cây sạch; hook mở phiên đã kéo `f45a9be → 9229b85`; `git fetch` được.
- HEAD `9229b85` · FETCH_HEAD `9229b85` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  9229b85 PHIEU: CK-NOIDUNG-1 chu quan tra loi cau hoi 05.11 (them file vao Pham vi)
  f45a9be CK-NOIDUNG-1: trang thai (tien do, bang dot bien, Cau hoi Q4-Q5 file ngoai Pham vi) + bang chung do ban ec477bf
  ec477bf CK-NOIDUNG-1: Q1b chi phien App huy / het han (phien loi giu chua_khop) + ca G11 + dot bien VS-cong-vi-ca-loi
  ```

## Đối chiếu bản chụp — lượt "tiep Q6 B" 06.11
- Nhánh `viec/CK-NOIDUNG-1`; cây sạch; hook mở phiên đã kéo `4ec877f → e7842a9`; `git fetch` được.
- HEAD `e7842a9` · FETCH_HEAD `e7842a9` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  e7842a9 CK-NOIDUNG-1: bao cao soat vong 3 (nguyen van) - con loi vi khi bat hai cong; het 3 vong -> Cau hoi Q6, DUNG
  68a7cd1 CK-NOIDUNG-1: dot bien 58/58 BAT sau vong sua 2 (sua mau VS-ly-do-ngan-thu-tu)
  c7a8d20 CK-NOIDUNG-1: bao cao soat vong 2 (nguyen van) + vong sua 2, bang chung do (SO CA 109), dot bien moi
  ```

## Tiến độ
- Lượt đầu: bước 2–3 xong; phiếu dặn chờ duyệt → dừng ở bước 3. Người gác chặn một lệnh ghép (B-PHANTICH) → viết file bằng Write.
- Lượt "tiep" 05.11 (chủ quán duyệt a10a453, trả lời Q1–Q3 ở phiếu 150e7db):
  - Bước 3: `ke_hoach.md` thêm mục "Sau duyệt" (Q1a, Q1b, Q2, Q3, bỏ mã App khỏi ghi chú, ca thử thêm) — commit dee44e2.
  - Bước 4: `cong_cu/thu_CKNOIDUNG1.js` ĐỎ trên gốc; sửa ca B1, E3 (`thu_SEPAY1.js`) và C1, C2 (`thu_P26c.js`) — đỏ ĐÚNG 4 ca đó trên gốc.
    Bằng chứng + SỐ CA: `bang_chung_do.txt`.
  - Bước 5: code xong — f3cfba4 (máy chủ), 8cf7d1d (giao diện + dist + hợp đồng v10 + bộ kiểm), ec477bf (Q1b loại phiên `loi`, ca G11).
    `thu_CKNOIDUNG1.js` 79 đạt · 0 hỏng; `thu_SEPAY1.js` 78 · 0; `thu_P26c.js` 157 · 0; `thu_HD1.js` 157 · 0; `thu_HOPDONG_KH.js` 86 · 0.
  - Đột biến: `python3 viec/CK-NOIDUNG-1/dot_bien.py` — đối chứng XANH; 40 đột biến, 40 BẮT (39 chạy một lượt, BV-gan-so-don chạy lại sau khi
    sửa mẫu regex của chính dot_bien.py; VS-cong-vi-ca-loi thêm sau cùng ca G11, BẮT).
  - Bước 6: `npm test` ĐỎ ở 2 bài cũ cần file NGOÀI Phạm vi → `## Câu hỏi` (Q4, Q5), DỪNG. (`thu_HD1` E6/G80 và `thu_HOPDONG_KH` v5 đỏ ở bản
    đầu — đã sửa trong Phạm vi: dòng "Mã GD" dùng nhãn cố định, không thêm khoá chữ cần seed ở `database.js`; hợp đồng giữ NGUYÊN câu 4xx đã
    duyệt 31.10 và nối ba ngoại lệ phía sau.)
- Lượt "tiep" 05.11 lần 2 (phiếu 9229b85 — Q4 CÓ, Q5 CÓ, phiên App LỖI vì đơn cũng vào ví):
  - Bước 3: `ke_hoach.md` mục "Sau duyệt lần 2".
  - Bước 4: `thu_KHMUA1.js` G6, I1, I4 sửa (I3 giữ nguyên) — ĐỎ đúng 3 ca đó trên gốc; `thu_CKNOIDUNG1.js` G11 đổi chiều + mục [L] + L12 — ĐỎ trên gốc
    (21 · 70) và trên code trước lượt 2 (81 · 14, đúng các ca mới). Bằng chứng + SỐ CA: `bang_chung_do.txt` mục "Lượt 2".
  - Bước 5: 9a785a0 (máy chủ: thanh-toan.js vị từ `vaoViDuoc` + hàm `vaoVi`, đọc lại phiên sau chốt hỏng; congQr.js; donApp.js `thong_bao_tien_ve`,
    dòng `vao_vi` của quầy; donThu.js Q5), 19acd58 (DonAppNoi.jsx, DonApp.jsx, dist, hợp đồng), f482a1e (dấu cách).
    `thu_CKNOIDUNG1.js` 95 · 0; `thu_KHMUA1.js` 122 · 0; `thu_KHSDT1.js` (D14) xanh; `thu_HOPDONG_KH.js` xanh.
  - Bước 6: `npm test -- --day-du` → PASS 102 · FAIL 0 · CẢNH BÁO 2 (cả hai cảnh báo ở file KHÔNG thuộc việc này: "route GET có lệnh ghi" packages.js /
    products.js / sync.js; "route ghi không qua loiGhi" 54 — có từ trước).
  - Đột biến: `python3 viec/CK-NOIDUNG-1/dot_bien.py` — ĐỐI CHỨNG XANH (ck 95 · 0, kh 95 · 0); TỔNG 48 · BẮT 48 · SỐNG 0 · HỎNG 0 · LẠC 0.
- Lượt "tiep Q6 B" 06.11 (chủ quán chọn B — đơn giản hoá, không cần vòng soát 4; soát nhanh một lần phần vừa đổi):
  - Bước 4: `thu_CKNOIDUNG1.js` G9c, X1–X6 đổi mong theo luật B + cột "số dòng KHÔNG tự cộng"; thêm Y1, Y2, Y3 (đúng ba thứ tự soát vòng 3 lỗi 1,
    T1 = 20.000 · T2 = 25.000) + ca Đối soát Y1–Y3 — commit 408ae4a. ĐỎ trên gốc (22 · 87) và trên e7842a9 (103 · 10: Y1 ví 50.000 cho 45.000
    thật, Y2 / Y3 40.000). Bằng chứng + SỐ CA 113: `bang_chung_do.txt`.
  - Bước 5 (72930df): thanh-toan.js — `laBanSao` (ghép theo thứ tự) bỏ, thay `congKiaDaBao`: đường vào ví, phiên đã có báo tiền vào từ CỔNG
    KIA → chua_khop "có thể cùng một khoản báo qua hai cổng … máy KHÔNG tự cộng — đối chiếu sao kê, khoản chưa cộng thì cộng tay vào tài khoản
    <SĐT>" (CẦN XEM). Đường chốt đơn (phiên đã chốt) trả về NGUYÊN `daBao` của main (chỉ đổi nhãn ĐỎ / CẦN XEM, không chuyển tiền) — soát vòng 3
    lỗi 4 (có từ main) + lỗi 5 (đổi hành vi so với daBao) hết là chỗ của việc này. Dòng ĐỎ "vượt số khoản" (doiSoat.js) GIỮ. Hợp đồng
    `tien_ve_da_cong_vi` sửa câu "hai cổng".
  - Bước 6: `thu_CKNOIDUNG1.js` 113 · 0; `npm test -- --day-du` PASS 102 · FAIL 0 · CẢNH BÁO 2 (như trước).
  - Đột biến: ĐỐI CHỨNG XANH (ck 113 · 0, kh 95 · 0, sp 78 · 0) · TỔNG 57 · BẮT 57 · SỐNG 0 · HỎNG 0 · LẠC 0. Bỏ 3 đột biến của laBanSao / đường chốt
    (VS-hai-cong-moi-bao, VS-hai-cong-chi-vao-vi, BV-chot-ban-sao — đường chốt về main, không còn là chỗ vá); thêm VS-hai-cong-thu-tu (đưa lại
    ĐÚNG lỗi vòng 3: ghép theo thứ tự đếm), VS-hai-cong-ca-cong-nay (chặn oan một cổng).
- Người gác chặn trong lượt "tiep" lần 2: GIT-TUYCHON ×1 (`git -C`), B-PHANTICH ×4 (`$(( ))`, script ghép `&&`, `$'…'`, heredoc + chạy),
  B-CHUONGTRINH ×1 (`bash <script nháp>`) → viết file bằng Write, chạy script Python đứng một mình.
- Người gác chặn trong lượt này (đọc lý do, làm theo): B-PHANTICH ×5 (lệnh chạy script ghép `> file`, `$'…'`, `git status &&`, heredoc + chạy),
  B-BIMAT-CHU ×2 (lệnh có chữ khoá bí mật — ghi file bằng Write), SED-I ×1, B-CD-VITRI ×1, GIT-ADD ×1 (thư mục `client/dist`), GIT-LENH ×1
  (`git worktree`) → dựng cây gốc bằng `git archive` qua script nháp.

## Chỗ vá → đột biến (`viec/CK-NOIDUNG-1/dot_bien.py`)
| Chỗ vá | Đột biến |
|---|---|
| helpers.js `capSoHoaDon` — đếm theo ngày giờ VN, trần 9999 | VS-so-khong-theo-ngay · VS-ngay-utc · VS-so-qua-9999 |
| helpers.js `taoMaDonTheoSo` — phiên có số → dùng số đó | VS-so-moi-khi-chot |
| orders.js — gắn số vào đơn (`order_id IS NULL`, changes 1) | BV-gan-so-don |
| giuCho.js `taoPhien` — giữ số, kênh chỉ từ tham số, nội dung theo cổng | BV-so-giu · VS-kenh-tu-than · VS-payos-noi-dung-so |
| sepay.js — nội dung số HD, mẫu mới chịu đổi dạng, mẫu cũ | BV-noi-dung-so · VS-regex-cach · VS-regex-hoa · VS-regex-dinh-so · BV-mau-cu |
| thanh-toan.js — chuỗi khách gõ khi không phiên | BV-khong-phien-chuoi |
| don-mo-rong.js — số bill HD / APP | BV-don-mo-rong |
| mã GD: giuCho `sauGhiDon`, webhook payOS, hoaDon.js, bill client | BV-ma-gd · BV-ma-gd-payos · BV-hoa-don-ma-gd · BV-bill-ma-gd |
| donApp.js ghi chú bỏ mã App | BV-ghi-chu-ma-app |
| Q1a route xác nhận tay muộn + chặn App; chotPhien `muon` | BV-xnt-muon · BV-xnt-chan-app · VS-muon-moi-cach · VS-muon-khoa-loi |
| Q1a Đối soát: nút + CẦN XEM sau xác nhận | BV-nut-xnt · BV-da-tay-can-xem |
| Q1b cộng ví App (một lần, chỉ App, huỷ / hết hạn / lỗi vì đơn) — thanh-toan.js `vaoViDuoc`, `vaoVi` | BV-cong-vi · VS-cong-vi-hai-lan · VS-cong-vi-quay · VS-cong-vi-chi-huy · BV-cong-vi-loi |
| Q6 B: `congKiaDaBao` — cổng kia đã báo → không tự cộng, CẦN XEM; một cổng không bị chặn; tài khoản khác không tính | BV-hai-cong-vao-vi · VS-hai-cong-thu-tu · VS-hai-cong-ca-cong-nay · VS-hai-cong-chi-ghi-tien · VS-hai-cong-dem-tk-khac |
| Lưới Đối soát ĐỎ "vượt số khoản" (doiSoat.js `phepTienVe`) | BV-doi-soat-vuot |
| Lý do ngắn cho App (donApp.js `LY_DO_NGAN`) | VS-ly-do-discount · VS-ly-do-ngan-thu-tu |
| Đối soát số của phiên có tiền về ghi "xem mục CK" | BV-so-ve-moi-trang-thai |
| Lượt 2: chốt hỏng vì đơn → đọc lại phiên → vào ví; ghi chú ví + lý do báo có mã GD | BV-cong-vi-sau-chot · BV-ghi-chu-loi · BV-ma-gd-doi-soat |
| Lượt 2: App `thong_bao_tien_ve` + lý do ngắn (không lộ lời lỗi nội bộ) | BV-thong-bao-app · VS-ly-do-noi-bo |
| Lượt 2: quầy thấy dòng `vao_vi` (dsQuay, DonApp.jsx, DonAppNoi.jsx, dist) | BV-quay-vao-vi · BV-man-vao-vi |
| Q5 donThu.js `BANG_KHONG_DON` có `pos_so_hoa_don` | BV-bang-khong-don |
| Q1b App thấy + Đối soát CẦN XEM | BV-tien-ve-vi-app · VS-vao-vi-do |
| Đối soát số hoá đơn | BV-doi-soat-so · BV-so-trong-do · VS-ly-do-het-han |
| cửa App `so_hd` | BV-so-hd-app · BV-so-hd-post · BV-so-hd-quay |
| hợp đồng câu luật 4xx | VS-hop-dong-luat-4xx |

## Câu hỏi
(Q1–Q3 lượt trước ĐÃ được chủ quán trả lời 05.11 — phiếu 150e7db; kế hoạch mục "Sau duyệt".)
(Q4, Q5 dưới đây ĐÃ được chủ quán trả lời 05.11 — phiếu 9229b85: CÓ cả hai; kèm luật mới "phiên App lỗi vì đơn cũng vào ví" — kế hoạch mục
"Sau duyệt lần 2".)

**Q6 — (ĐÃ TRẢ LỜI 06.11: "tiep Q6 B" — làm theo B, xem Tiến độ lượt "tiep Q6 B") Hết 3 vòng soát, còn một lỗ ở ví khi BẬT CẢ HAI cổng QR (payOS + SePay) cùng lúc — bạn chọn cách xử lý.**
- *Chuyện gì:* khi cả payOS lẫn SePay cùng theo dõi tài khoản quán, MỘT lần khách chuyển tiền sẽ được báo về HAI lần (mỗi cổng một lần). Với đơn
  App đã huỷ / hết hạn / lỗi, máy tự cộng tiền vào ví khách — nên phải nhận ra "hai báo này là một khoản" để chỉ cộng một lần. Hiện máy ghép hai
  báo theo THỨ TỰ (báo thứ 1 của cổng này = báo thứ 1 của cổng kia). Người soát vòng 3 chỉ ra: khách chuyển HAI khoản KHÁC số tiền (vd 20.000
  rồi 25.000) mà một cổng báo đảo thứ tự → ghép nhầm cặp → ví cộng thừa hoặc thiếu 5.000 (soát vòng 3, lỗi 1). Phép Đối soát ĐỎ mới cũng chỉ
  đếm số lần nên không bắt được (lỗi 2).
- *Bây giờ có sao không:* chỉ xảy ra khi CẢ HAI cổng cùng báo tiền về cho một tài khoản. Bạn đã chốt "một cổng QR tại một thời điểm"
  (`QUYET_DINH_CHU_QUAN.md` dòng 129, 01.11) và chuyển sang SePay (dòng 112, 31.10): giữ đúng như vậy thì phép ghép không bao giờ chạy, mỗi báo
  là một khoản, cộng đúng. Máy KHÔNG đọc được Render đang đặt `CONG_QR` gì (mã mặc định `payos`, `server/utils/congQr.js:7`) và hai webhook không
  tự kiểm cổng nào bật — "chỉ một cổng" vẫn là việc làm tay (`viec/SEPAY-1/cai_dat_sepay.md` mục 4). CHƯA KIỂM.
- **Đề xuất của mình (A):** cho máy làm **vòng sửa 4** đúng phạm vi lỗi vòng 3: (1) ghép hai báo theo SỐ TIỀN + thứ tự (thêm `so_tien` vào
  `laBanSao`) — mô phỏng của người soát cho thấy đúng ở cả 3 thứ tự lỗi; (2) phép Đối soát ĐỎ so TỔNG TIỀN đã ghi (đơn + cộng ví) với tổng tiền
  báo về của cổng báo nhiều nhất, theo từng số tiền; (3) một đoạn SQL "báo tiền vào" dùng chung (congQr.js) cho cả hai chỗ; (4) bỏ vế
  `sau.nguon !== t.nguon` ở đường chốt đơn (lỗi 4); (5) ca thật Y1–Y3 + ca "lệch tiền trước rồi cổng kia chốt" (lỗi 5) + đột biến; sửa câu hợp
  đồng / chú thích cho đúng điều kiện. Rồi soát lại MỘT lần. Còn nghi ngờ "payOS gửi lại thiếu `reference`" thì ghi CHƯA KIỂM.
- *Cách khác (B, đơn giản nhất):* phiên đã có báo từ cổng KIA thì KHÔNG tự cộng ví nữa — ghi CẦN XEM để bạn cộng tay. Ít code nhất, không bao giờ
  cộng sai, đổi lại là lúc bật hai cổng thì mọi khoản về muộn của đơn App phải cộng tay.
- *Bạn cần làm:* nhắn "tiep Q6 A" (hoặc "tiep Q6 B"). Nếu chọn A, bạn ghi thêm câu "cho vòng sửa 4 vì lỗi ví khi bật hai cổng" vào phiếu
  (comment chủ quán) — luật §6.5 không cho máy tự làm vòng 4 khi lỗi còn đụng ví.

**(Đã trả lời) Lượt "tiep" 05.11 — DỪNG ở bước 6: `npm test` đỏ ở 2 bài cũ, sửa cần 2 file NGOÀI Phạm vi.** Mọi phần khác của việc đã xong và xanh.
- **Q4 — `cong_cu/thu_KHMUA1.js` (bài cũ khoá hành vi bạn vừa duyệt đổi ở Q1b).** Ba ca khoá "tiền về muộn của đơn App → chưa khớp, ví giữ
  nguyên": G6 (dòng 778, nhánh "huỷ thắng": `sk.some(ket_qua 'chua_khop')` + ví 20.000), I1 (dòng 841: `ket_qua === 'chua_khop'`), I4 (dòng 865:
  ví `=== 20000`). Code mới đúng Q1b: dòng báo `vao_vi` và ví + số tiền đã về (I4: 20.000 + 25.000). **Đề xuất:** thêm `cong_cu/thu_KHMUA1.js`
  vào Phạm vi, sửa đúng 3 ca đó sang dạng mới (bài sửa thường LUAT §6.8: bản mới đỏ trên gốc, xanh trên code mới, ghi SỐ CA). Ca I3 (phiên `loi`)
  KHÔNG đổi — mình giữ phiên `loi` ngoài Q1b (ca G11 mới khoá điều này).
- **Q5 — `server/utils/donThu.js` (bảng mới cần đăng ký với "Dọn dữ liệu thử").** `thu_KHSDT1.js` D14: mọi bảng có cột `order_id` phải nằm trong
  danh sách dọn hoặc danh sách KHÔNG dọn của `donThu.js`; bảng mới `pos_so_hoa_don` chưa có → đỏ. **Đề xuất:** thêm `'pos_so_hoa_don'` vào
  `BANG_KHONG_DON` (`server/utils/donThu.js:50`, một chữ) — sổ số chỉ-thêm như `pos_phien_thanh_toan`: dọn đơn thử KHÔNG xoá số đã cấp (xoá thì
  số đó bị cấp lại cho đơn thật → trùng số trên sao kê). Không đổi tên cột để né phép kiểm (K8).
- Bạn chỉ cần thêm 2 dòng vào `## Phạm vi` của phiếu (`cong_cu/thu_KHMUA1.js`, `server/utils/donThu.js`) rồi nhắn "tiep"; máy làm nốt bước 6–11.

## Phát hiện
- (Đã xử lý theo chủ quán 05.11) Ghi chú đơn App bỏ mã ngẫu nhiên: nay `Đơn App · nhận tại quán` (mã vẫn ở `pos_don_app.ma`).
- Ngày triển khai: đơn đã bán trong ngày mang mã cũ `ORD-YYYYMMDD-NNN`, dãy mới bắt đầu `HD0001` — hai dãy cùng ngày (bill `HD0001` đứng sau
  bill `030`). Nên triển khai ngoài giờ bán.
- payOS (dự phòng) giới hạn nội dung 9 ký tự → nội dung CK của payOS giữ `TQD<mã phiên>`, không mang số hoá đơn (bill vẫn in số).
- Chỗ bấm xác nhận tay sau khi QR hết hạn (Q1a): màn QR ở quầy tự quay về giỏ khi hết hạn (`client/src/pages/BanHang/ManQr.jsx:34`) và màn Bán
  hàng là bản vẽ đã chốt → nút đặt ở màn **Đối soát** (dòng CK "tiền về sau khi QR hết hạn" / "phiên đang huy" của phiên quầy). Muốn đặt ở
  màn Bán hàng thì cần sửa bản mẫu `ban_mau_pos/` (chủ quán quyết).
- Dòng "Mã GD" trên bill dùng nhãn cố định "Mã GD" (không có ô sửa chữ trong Cài đặt hoá đơn): thêm khoá chữ mới phải seed ở `server/database.js`
  (ngoài Phạm vi, phép `thu_HD1` E6). Muốn sửa được chữ thì mở việc sau.
- Tên ca I3 của `cong_cu/thu_KHMUA1.js` còn chữ "chua_khop" — nay phiên `loi` của đơn App ghi `vao_vi` (luật chủ quán 05.11 lượt 2). Ca vẫn XANH vì
  máy chỉ kiểm phiên `loi` + App `da_huy` + cờ `tien_ve_cho_doi_soat`, không kiểm `chua_khop`. Chủ quán dặn giữ nguyên I3 → không sửa; nên sửa tên
  ở việc sau (tên ca nói một đằng, máy kiểm một nẻo — K3). Hành vi mới đã khoá ở `thu_CKNOIDUNG1.js` L1 / G11.
- Lý do ngắn cho App (`LY_DO_NGAN`, donApp.js) đọc từ `ly_do` phiên — nhiều lỗi của `taoDon` không có `code` (vd "Không đủ hàng…", "Sản phẩm không tồn
  tại hoặc đã ngừng bán") nên bảng so theo chữ. Lỗi lạ → câu chung "vì đơn không còn hợp lệ". Muốn chắc hơn thì thêm `code` cho các lỗi đó ở
  `orders.js` (việc sau — đụng đường tạo đơn).
- (Soát vòng 1) `viec/SEPAY-1/cai_dat_sepay.md` mục 4 (ngoài Phạm vi) còn tả rủi ro "bật cả hai cổng" theo hành vi cũ ("HAI dòng đỏ — đừng hoàn hai
  lần"). Nay với đơn App huỷ / hết hạn / lỗi: khoản đầu tự cộng vào ví khách, báo qua cổng thứ hai ghi CẦN XEM "hai cổng" (không cộng lần hai).
  Nên sửa câu đó ở việc sau. Hai webhook vẫn không tự kiểm cổng nào đang bật — "chỉ một cổng bật" vẫn là bước làm tay.
- (Soát vòng 2) Luật "hai cổng" đếm số báo mỗi cổng — đúng khi payOS và SePay theo dõi CÙNG một tài khoản (cấu hình hiện tại). Nếu hai cổng theo dõi
  HAI tài khoản khác nhau, khoản thứ hai thật vào tài khoản SePay có thể bị ghi "hai cổng" (CẦN XEM, không tự cộng) — tiền không mất, quán cộng tay.
  Chặn chắc hơn là so mã giao dịch ngân hàng giữa hai cổng — cần biết payOS `reference` có trùng SePay `referenceCode` không (chưa kiểm).
- (Soát vòng 2) Đường "lệch tiền" khi phiên còn hạn (chua_khop ĐỎ) không xét "hai cổng": một khoản lệch báo qua hai cổng → hai dòng ĐỎ (hành vi cũ
  SEPAY-1) — chủ quán đối chiếu sao kê trước khi hoàn.
- (Soát vòng 1) Không có chỉ mục trên `pos_phien_thanh_toan.noi_dung` — webhook SePay tra theo cột này. Chưa đo; bảng nhỏ. Nếu chậm thì thêm chỉ mục ở
  một bước nâng cấp sau.
- Đơn / phiên hỏng TRONG giao dịch (ví thiếu, giá đổi…) → số hoá đơn rollback cùng giao dịch, không thành chỗ trống. Số chỉ "huỷ" khi phiên QR
  đã hiện (khách có thể đã thấy số) — đúng ý "mỗi chỗ trống có lý do".

- (Q6 B, soát vòng 3 lỗi 4) Đường chốt đơn = `daBao` của main: payOS chốt T1, khách chuyển thêm T2, SePay báo T1 rồi T2, payOS báo T2 → hai dòng
  ĐỎ cho một khoản T2 (có từ main, SEPAY-1). Chỉ khi bật CẢ HAI cổng; không chuyển tiền — chủ quán đối chiếu sao kê trước khi hoàn. Muốn sửa thì
  việc sau (cùng luật B: cổng kia đã báo → CẦN XEM; phải đổi ca C14c của `thu_SEPAY1.js`).
- (Q6 B) Bật cả hai cổng thì MỌI khoản về muộn / lỗi của đơn App sau báo đầu phải cộng tay (CẦN XEM "KHÔNG tự cộng"). Đường "lệch tiền" khi phiên
  còn hạn vẫn không xét hai cổng (ghi ở soát vòng 2).

## Soát độc lập

### Vòng 1 — `/ra-soat` trên HEAD 2bc84b9 (agent độc lập, chỉ đọc) — báo cáo nguyên văn
```
KHÔNG ĐẠT

Lý do chính: có một lỗ ở đường tiền (ví) chưa được khoá (lỗi 1 dưới đây). Cần vá lỗ đó, hoặc chủ quán phải chấp nhận rủi ro bằng chữ, dựa trên mô tả rủi ro ĐÚNG với hành vi mới (LUAT §6.5: còn lỗi ví thì dừng, ghi ## Câu hỏi). Các phần khác của nhánh đều có bài thử và bằng chứng.

Mình đã chạy lại `node kiem_tra_truoc_khi_giao.js --day-du` trên HEAD 2bc84b9: PASS 102 · FAIL 0 · CẢNH BÁO 2, và "dist đã commit KHỚP với src hiện tại". Mình không chạy dot_bien.py. Cây làm việc sạch, `git log origin/viec/CK-NOIDUNG-1..HEAD` rỗng.

LỖI TÌM ĐƯỢC:
1. server/routes/thanh-toan.js:146-159 và 166-168 (vaoViDuoc / vaoVi) — Một lần chuyển khoản được báo qua HAI cổng (payOS + SePay) sẽ được cộng vào ví HAI LẦN, tự động. Khuôn K4 (đường song song) + C16 (bịt bằng khoá, không bằng lời dặn).
   - Vì sao xảy ra: vaoVi chỉ chặn trùng theo `khoa` (thanh-toan.js:152-153). Khoá payOS là `<orderCode>:<reference>`, khoá SePay là `sepay:<id>` (congQr.js congCuaKhoa). SePay vẫn đọc mẫu cũ `TQD<mã phiên>` (sepay.js:12, 39). Vậy phiên App tạo dưới CONG_QR=payos (nội dung TQD<id>, giuCho.js) mà đang `huy` / `loi` / hết hạn → mỗi cổng ghi một dòng `vao_vi` khác khoá → ghiVi chạy hai lần cho cùng một khoản tiền thật.
   - Đường chốt đơn đã có khoá "hai cổng" (daBao / LY_DO_HAI_CONG, thanh-toan.js:171-175). Đường vào ví mới thêm thì không có.
   - Hai webhook không tự kiểm cổng nào đang bật (thanh-toan.js:179-207). "Chỉ một cổng bật" hiện chỉ là bước làm tay (viec/SEPAY-1/cai_dat_sepay.md mục 4).
   - Trước nhánh này, cấu hình sai đó chỉ sinh hai dòng ĐỎ để người xem. Nay máy tự cộng tiền hai lần, và Đối soát xếp cả hai dòng ở CẦN XEM (doiSoat.js:246), không ĐỎ.
   - Cách sửa gọn: trong vaoVi, trước khi ghiVi, dùng lại đúng phép daBao sẵn có. Nếu cổng KIA đã có dòng `vao_vi` cho cùng ma_payos (và cùng mã GD khi cả hai có) mà cổng NÀY chưa báo phiên này → ghi `chua_khop` kèm LY_DO_HAI_CONG (CẦN XEM, KHÔNG cộng). Kèm một ca: payOS báo rồi SePay báo cùng khoản cho phiên App đã huỷ → ví cộng đúng một lần. Kèm đột biến bỏ phép đó.
2. HOP_DONG_API_KH.md, Ghi chú v10, dòng `tien_ve_da_cong_vi` — Hợp đồng hứa cộng "một lần mỗi giao dịch ngân hàng". Câu này sai trong ca lỗi 1. Code chỉ bảo đảm "một lần mỗi báo" (khoá): chú thích ở thanh-toan.js:145 và lời chủ quán Q1b đều nói "mỗi báo tiền". Khuôn K1.
   viec/SEPAY-1/cai_dat_sepay.md mục 4 cũng đã cũ: còn ghi "trả sau khi đã huỷ … HAI dòng đỏ — đừng hoàn hai lần", trong khi nay máy tự cộng ví hai lần. File này ngoài Phạm vi nên ghi Phát hiện. Rủi ro chủ quán đã chấp nhận ngày 03.11 dựa trên mô tả cũ. K4 (tài liệu hứa theo đối tượng).
3. server/utils/donApp.js:64-66 (LY_DO_NGAN) — Bảng xét `/GIA_DA_DOI|giá/i` TRƯỚC `/^MA_|mã giảm|voucher/i`. Hậu quả:
   - Lỗi không có `code` "Đang flash sale — chỉ dùng được voucher/giảm giá kiểu TIỀN…" (orders.js:672-674) khớp chữ "giá" trong "giảm giá" → App báo "vì giá món đã đổi".
   - Lỗi "Sản phẩm X chưa có giá bán" (orders.js:371-372) cũng ra "giá món đã đổi".
   - Khách nhận lý do sai (không lệch tiền). Sửa: xét mục mã giảm / voucher trước, và cho mục giá khớp đúng cụm `GIA_DA_DOI|giá .*đổi`. Khuôn K4 (một vị từ khớp nhầm loại đầu vào).
4. server/utils/doiSoat.js:256-262 (lyDoSo) — Chỉ nhánh `cho` nối "— tiền về muộn, xem mục CK" khi `ve_muon`. Nhánh `huy` ("huỷ trước khi trả") và `loi` bỏ qua `ve_muon`, dù phiên App huỷ / lỗi có tiền vào ví là ca thường gặp nhất (G1, L1). Ở bảng số hoá đơn, số APP đã có tiền về và đã cộng ví hiện như số huỷ chưa có tiền. Khuôn K4 (nhẹ).
5. Kế hoạch ≠ bài thử. viec/CK-NOIDUNG-1/ke_hoach.md:116-128 ghi "ánh xạ 1-1 nghiệm thu", nhưng thu_CKNOIDUNG1.js THIẾU các ca:
   - C7 (App GIA_DA_DOI → "huỷ trước khi trả");
   - `rutGonMa` (inPhieu.js, tem ly / phiếu pha chế = APP<số>) — mình grep "rutGon|inPhieu" trong bài thử: 0 chỗ;
   - K2 (giữ ví + QR), K3 (PIN sai), K7 (điểm cộng);
   - "hai webhook cùng nội dung song song → một đơn, một số" — Promise.all chỉ có ở dòng 207, 376, 453, 529; không ca nào cho đường chốt thành đơn.
   Đột biến kế hoạch liệt kê cũng không có trong dot_bien.py: VS-MAX-NGOAI-GD, VS-cong-vi-sau-chot-quay, BV-dist-vao-vi (ke_hoach.md:126-128 và 252-253). trang_thai.md liệt kê đúng 48 tên thật, nên trang_thai trung thực; chỉ ke_hoach sai. K5 vẫn có bằng chứng qua bài cũ: thu_P3, thu_KHMUA1, thu_SEPAY1 chạy trong npm test. Khuôn K1 (hồ sơ khẳng định thứ không có) / K3.
6. Rườm rà, lệch luật "Một quy tắc — một hàm" (LUAT §2):
   - Cách ghép số hoá đơn `kenh + padStart(4)` được viết lại 4 lần: helpers.js:24 `chuoiSoHd` (ĐÃ export ở helpers.js:242), donApp.js:60 `soHd` (chú thích còn ghi "= helpers chuoiSoHd"), thanh-toan.js:26-29 `soHdCuaPhien`, doiSoat.js:254 `soHdChuoi`. Thêm bản SQL `printf('%04d')` ở donApp.js SO_GIU, và câu đọc `pos_so_hoa_don WHERE phien_id` lặp ở donApp.js traDon và thanh-toan.js:27.
   - `soHdCuaMa` (helpers) là bản thứ hai của `soBill` trong hoaDon.js:29 (cùng `split('-').pop()`). Trong khi đó don-mo-rong.js:19 dùng regex khác (mã lạ → null). Hai vị từ cho cùng "số in to" lệch nhau ở mã dạng khác.
   - Cách gọn: một `chuoiSoHd` + một câu SQL dùng chung; `soHdCuaMa` thay cho soBill của hoaDon.js.

NGHI NGỜ:
- thanh-toan.js:147, vế `luc > x.het_han` của vaoViDuoc dùng giờ của ngân hàng. Đồng hồ ngân hàng nhanh hơn máy chủ thì phiên App còn hạn theo máy chủ (`cho`) vẫn bị cộng ví. Khi đó App vẫn hiện `cho_tra` + QR, nhưng `thong_bao_tien_ve` lại nói "đơn đã huỷ / hết hạn". Nhân viên xác nhận tay trong hạn (route không chặn vì `muon` = false, thanh-toan.js:86) sẽ tạo đơn cho khoản đã vào ví. Hiếm, chưa có ca thử.
- Không có index trên `pos_phien_thanh_toan.noi_dung` (019_so_hoa_don.js; database.js:996 chỉ có idx_phien_giu). Mỗi webhook SePay quét cả bảng (thanh-toan.js:134). Chưa đo.
- Phiên App `vi_qr` hỏng đơn ĐÚNG hạn (`loi`): chưa có ca kiểm ví nhả đúng phần đã giữ, chỉ cộng phần QR. I4 của thu_KHMUA1 chỉ phủ ca hết hạn. Đọc code wallets.js:59-65 (dangGiu chỉ đếm `cho`) thì thấy đúng.
- bang_chung_do.txt:83 dựng gốc với node_modules nối symlink. Chỉ chạy đọc nên khả năng vô hại, nhưng trái lời K5 "bản sao chép thật".
- trang_thai.md chưa có: kết quả `node tu_chay/cong.js chay` (LUAT §6.3), và 1–3 thao tác thử tay cho chủ quán (LUAT §6.4 — kế hoạch F6 có hứa). Có thể thuộc bước sau soát.

NGHIỆM THU: 16/16 mục có bằng chứng · mục thiếu: không có mục nào thiếu hẳn. Riêng F chỉ có bằng chứng đọc code cho phần tem ly / phiếu pha chế, không có ca thử. Từng mục:
- A: A1–A8 (thu_CKNOIDUNG1.js:197-242).
- B: A1/A2 (nội dung), B3 ×3 / B4 / B5 / B6 / B7 / B8 / B9 (:247-303).
- C: C1, C5 (:313, 344); C2 / C3 / C6 / E1 (:597-601); C4 (:354-423).
- D: D1–D5 (:314-349, 603).
- E: E1–E3 (:597-607).
- F:
  - so_hd ở cửa App: F1–F6 (:619-649).
  - Bill: C5 (:344).
  - Tem ly / phiếu pha chế: CHỈ có bằng chứng đọc code inPhieu.js:93 và InvoicePreview.jsx:225 (`split('-').pop()`), không có ca thử (lỗi 5).
- F2: ca ở :656 + thu_HOPDONG_KH trong npm test.
- K5: K1 / K4 / K5 / K6 (:664-677) + bài cũ xanh (PASS 102).
- Q1a: C4 (:371-423). Q1b: G1–G9 (:426-492).
- Q2: D5 (:321, 349). Q3: bang_chung_do.txt:67-75. Bỏ mã App khỏi ghi chú: :346.
- Q4: bang_chung_do.txt:106-111. Q5: thu_KHSDT1 D14 + đột biến BV-bang-khong-don.
- Lượt 2 (phiên App lỗi → cộng ví, câu App, quầy thấy báo, Đối soát CẦN XEM): L1–L13 + G11 (:472-575).
- Đỏ trên gốc / xanh sau vá: bang_chung_do.txt:86-104.

CHƯA SOÁT ĐƯỢC:
- Chưa chạy dot_bien.py (theo dặn), nên 48/48 BẮT là lời trang_thai, mình chưa kiểm lại.
- Chưa chạy `tu_chay/cong.js`.
- Chưa xem màn hình thật: nút nổi màu vàng "· n vào ví", khung vàng ở màn Đơn App, nút "Xác nhận tay → tạo đơn" ở Đối soát, chữ APP0016 trên tem ly / máy in.
- Chưa kiểm hành vi Turso (BEGIN IMMEDIATE với câu INSERT…MAX+1 khi chạy trên cloud).
- Chưa kiểm payOS thật có gửi `reference` bằng đúng mã FT như SePay `referenceCode` không — điều này quyết định có dùng mã GD để chặn trùng hai cổng được không.

BÀI HỌC:
- KHOÁ: mọi đường ghi tiền theo báo tiền (chốt đơn VÀ cộng ví) phải đi qua CÙNG một phép "hai cổng". Cần bài thử "một khoản báo qua payOS rồi SePay cho phiên App huỷ → ví cộng một lần" + đột biến gỡ phép. Nên thêm phép tĩnh: mọi `ghiVi` trong thanh-toan.js nằm sau phép chặn hai cổng.
- NGUYÊN TẮC (KHUON_LOI K4): đổi hệ quả của một rủi ro chủ quán đã chấp nhận (từ "hiện dòng đỏ cho người xem" sang "máy tự chuyển tiền") thì phải grep tài liệu cài đặt / sổ quyết định tìm câu mô tả rủi ro cũ, rồi hỏi lại chủ quán — rủi ro đã đổi bản chất.
- NGUYÊN TẮC (K1): ke_hoach.md ghi "ánh xạ 1-1" thì bước báo xong phải đối chiếu từng tên ca / tên đột biến trong kế hoạch với file thật (grep). Ca nào bỏ thì ghi lý do. Lần này 7 ca và 3 đột biến của kế hoạch không có trong mã.
- NGUYÊN TẮC (LUAT §2): hàm dùng chung đã export (chuoiSoHd) thì không viết lại ở file khác. Chú thích "= helpers X" là dấu hiệu chép công thức.
```

### Vòng sửa 1 (sau báo cáo vòng 1) — commit 5410562 (bài thử), 9eb3c5a (code)
Lỗi 1 thuộc đường ví nhưng nằm TRONG Phạm vi và cách vá là áp đúng luật chủ quán đã có (một khoản báo qua hai cổng → CẦN XEM, KHÔNG hoàn —
`LY_DO_HAI_CONG`, sổ QUYET_DINH 01.11) cho đường vào ví mới → sửa ở vòng 1 (LUAT §6.5: dừng hỏi chỉ khi hết 3 vòng còn lỗi tiền).
| Lỗi soát | Xử lý | Ca thử (đỏ trên 2bc84b9 + gốc, xanh sau vá) | Đột biến |
|---|---|---|---|
| 1 hai cổng cộng ví hai lần | thanh-toan.js `vaoVi`: TRONG giao dịch ghi, cổng này báo phiên ít lần hơn số dòng `vao_vi` của cổng kia → `chua_khop` + LY_DO_HAI_CONG, KHÔNG cộng; báo nhiều hơn (khoản thật thứ hai) → cộng | G9b ×2, G9c | BV-hai-cong-vao-vi · VS-hai-cong-moi-bao |
| 2 câu hợp đồng "một lần mỗi giao dịch" | nay đúng sau lỗi 1; câu ghi rõ "báo lặp, hoặc cùng khoản qua hai cổng, chỉ cộng một lần" | G9b | (như lỗi 1) |
| 3 LY_DO_NGAN khớp nhầm "giảm giá" | xét mã giảm TRƯỚC; mục giá chỉ khớp `GIA_DA_DOI\|giá .*đổi\|không khớp tổng` | L14 (3 lời lỗi) | VS-ly-do-ngan-thu-tu |
| 4 lyDoSo chỉ nhánh `cho` nối "xem mục CK" | mọi trạng thái có báo tiền về nối " — có tiền về, xem mục CK" | L9b | BV-so-ve-moi-trang-thai |
| 5 kế hoạch ≠ bài thử | `ke_hoach.md` mục "Đối chiếu kế hoạch ↔ bài thử / đột biến THẬT" — từng ca / đột biến bỏ + chỗ phủ thay; tiêu đề "ánh xạ 1-1" sửa | — | — |
| 6 công thức số hoá đơn chép 4 lần | donApp.js, doiSoat.js, thanh-toan.js dùng `chuoiSoHd` (helpers); hoaDon.js dùng `soHdCuaMa` thay `soBill` riêng. GIỮ: `printf('%04d')` trong SQL (`SO_GIU` — câu SQL cần chuỗi trong câu), `don-mo-rong.js soBill` (biểu thức cũ có từ trước, mã lạ → null là hành vi cũ của màn chờ thu) | toàn bài xanh (F2, C1, C5, E1) | BV-so-hd-post (mẫu đổi theo) |
Nghi ngờ của người soát:
- Giờ ngân hàng `luc > het_han`: vế này có từ Q1b (ec477bf) và cùng luật "tiền về sau khi QR hết hạn" của phiên quầy (giờ giao dịch). Đồng hồ ngân hàng
  nhanh hơn máy chủ trong 10 phút hạn QR là hiếm; chưa có ca → CHƯA KIỂM (báo cáo 7 mục).
- Chỉ mục `noi_dung`: chưa đo; bảng phiên nhỏ (mỗi ngày vài trăm dòng). Ghi Phát hiện, không thêm bước nâng cấp ở việc này.
- `vi_qr` lỗi đúng hạn: `dangGiu` chỉ đếm phiên `cho` (wallets.js) → phiên `loi` nhả giữ; L1 phủ phần cộng QR. Ca ví giữ + lỗi đúng hạn chưa có → CHƯA KIỂM.
- node_modules nối symlink khi dựng gốc: chỉ đọc gói, không ghi (K5 nói về bản sao server/ mà đột biến ghi — dot_bien.py chép thật).
- Cổng `tu_chay/cong.js chay` + thao tác thử tay: làm ở bước 11 / báo cáo 7 mục.
Kiểm sau vòng sửa 1: `thu_CKNOIDUNG1.js` 100 · 0; `npm test -- --day-du` PASS 102 · FAIL 0 · CẢNH BÁO 2 (như trước, file ngoài việc);
`python3 viec/CK-NOIDUNG-1/dot_bien.py` ĐỐI CHỨNG XANH (ck 100 · 0, kh 95 · 0) · TỔNG 52 · BẮT 52 · SỐNG 0 · HỎNG 0 · LẠC 0.

### Vòng 2 — `/ra-soat` trên HEAD de6cf86 (agent độc lập mới, chỉ đọc) — báo cáo nguyên văn
```
KHÔNG ĐẠT

Tóm lại: vòng sửa 1 vá đúng ca người soát nêu: một khoản báo qua payOS, sau đó SePay báo lại → chỉ cộng ví một lần. Nhưng phép "hai cổng" mới trong `vaoVi` đếm lệch giữa hai cổng. Khi khách chuyển từ hai khoản trở lên, hoặc khi đã có báo lệch tiền trước đó, máy vẫn cộng ví hai lần cho cùng một khoản. Lỗi này chạm ví, xếp NẶNG. Các lỗi vòng 1 khác (2–6) đã vá thật trong code.

Mình đã chạy lại trên HEAD de6cf86, cây làm việc sạch:
- `node cong_cu/thu_CKNOIDUNG1.js` → 100 đạt · 0 hỏng.
- `node kiem_tra_truoc_khi_giao.js --day-du` → PASS 102 · FAIL 0 · CẢNH BÁO 2, kèm dòng "dist đã commit KHỚP với src hiện tại".

LỖI TÌM ĐƯỢC:
1. server/routes/thanh-toan.js:155-157 (vaoVi, phép "hai cổng") — Hai vế đếm khác loại dòng nên vẫn còn đường cộng ví hai lần. Khuôn K4 + K3. NẶNG (ví).
   - Hai vế so sánh:
     - `nay` = đếm MỌI dòng báo của cổng này, mọi `ket_qua` (khop, chua_khop lệch tiền, chua_khop "hai cổng", tkKhac, that_bai).
     - Vế kia = CHỈ dòng `vao_vi` của cổng kia.
   - Hệ quả: dòng chua_khop "hai cổng" mà chính phép này ghi ra được tính vào `nay` của cổng ghi, nhưng không bao giờ tính cho cổng kia. Sau khoản đầu tiên, hai vế lệch nhau.
   - Mình tách đúng biểu thức 155-157 ra mô phỏng thuần (/tmp/claude-0/-home-user-pos-tuquyduong/9248b212-f5f8-5e47-9ba1-a08ca1af158f/scratchpad/mo_phong.js). Kết quả:
     - X1 — đúng chuỗi G9 → G9b → G9c, rồi payOS báo nốt khoản T2. Thứ tự hoàn toàn tự nhiên, chỉ là khoản T2 tới SePay trước. 2 khoản thật mà cộng ví 3 lần: `vao_vi,chua_khop,vao_vi,vao_vi`.
     - X1b — SePay T1 · payOS T1 · payOS T2 · SePay T2: cũng 3 lần cho 2 khoản.
     - X2 — một khoản lệch tiền báo qua hai cổng khi phiên còn hạn (chua_khop ×2, không cộng). Đơn huỷ, rồi khoản T2 đúng số báo qua hai cổng → cộng 2 lần cho 1 khoản.
     - Biến thể X2: dòng lệch tiền chỉ có ở SePay, báo payOS cho CÙNG khoản đó tới sau khi hết hạn → payOS cộng ví. Dòng SePay vẫn ĐỎ "lệch tiền" mời chủ quán hoàn tay → hoàn hai lần.
     - Đối chứng G9b (1 khoản, payOS trước) → 1 lần, đúng.
   - Cách sửa gọn: đếm đối xứng các dòng "tiền vào" của phiên ở mỗi cổng (bỏ that_bai và tkKhac). Cổng này tính cả báo này mà ≤ số của cổng kia → bản sao → chua_khop LY_DO_HAI_CONG. Mô phỏng tay cho đúng ở cả X1, X1b, X2 và G9b/G9c.
   - Kèm ca thử cho X1, X1b, X2 và một đột biến đưa lại vế chỉ-`vao_vi`.
2. HOP_DONG_API_KH.md:55 — Hợp đồng hứa "một lần mỗi giao dịch ngân hàng — … cùng khoản báo qua cả hai cổng QR, chỉ cộng một lần". Câu này sai ở X1/X2. Khuôn K1. NẶNG — lời hứa tiền gửi App KH.
   - Cùng khuôn: chú thích thanh-toan.js:152-154 "Báo NHIỀU hơn = khách chuyển thêm thật" và bảng vòng sửa ở viec/CK-NOIDUNG-1/trang_thai.md:206 "báo nhiều hơn (khoản thật thứ hai) → cộng". Ở X1, payOS T2 không báo nhiều hơn mà vẫn được cộng.
3. cong_cu/thu_CKNOIDUNG1.js:490-503 — G9/G9b/G9c chỉ phủ một thứ tự: payOS trước, rồi SePay. Khuôn K3. NHẸ (phép thử).
   - Thiếu ca SePay → payOS, thiếu ca xen kẽ hai khoản, thiếu ca có dòng chua_khop của cổng này từ trước, thiếu ca hai cổng báo cùng lúc.
   - Đột biến VS-hai-cong-moi-bao (dot_bien.py:75) chỉ thay `nay <` bằng `0 <`. Công thức sai ở lỗi 1 vì vậy sống mà không bị bắt.
4. server/utils/donApp.js:64-66 (LY_DO_NGAN) — Chạm tới nhưng chưa vá hết. `ly_do` phiên lưu `code` trước `error` (giuCho.js, khối 'loi' cuối chotPhien). Khuôn K4 (vị từ không phủ đủ mã cùng loại). NHẸ (sai chữ, không lệch tiền).
   - Mã giảm hết lượt lúc chốt có code `DISCOUNT_CODE_LIMIT_REACHED` (orders.js:1015), không bắt đầu bằng `MA_` → App hiện "vì đơn không còn hợp lệ" thay vì "vì mã giảm giá không còn dùng được".
   - Đây đúng là ca đua hay gặp ở đơn App: mã còn lượt lúc đặt, hết lượt lúc tiền về.
5. server/routes/thanh-toan.js:155-157 và 180-184 — Hai vị từ "hai cổng" khác nghĩa nằm trong CÙNG một hàm xuLyTienVe. Chỗ 180 là `daBao` = cổng này đã có dòng nào chưa; chỗ 155-157 là phép đếm. Lệch luật "Một quy tắc — một hàm" (LUAT §2), khuôn K4 (BAN-HANG-1: hai biểu thức sẽ lệch nhau). NHẸ. Nên gom thành một hàm đếm dùng cho cả đường chốt đơn và đường vào ví.

NGHI NGỜ:
- thanh-toan.js:147, vế `luc > x.het_han` (giờ ngân hàng) — vẫn mở từ vòng 1, trang_thai ghi CHƯA KIỂM.
  - vaoVi không đổi trạng thái phiên. Nếu đồng hồ ngân hàng nhanh hơn máy chủ, phiên vẫn `cho` còn hạn → App hiện `cho_tra` + QR, trong khi ví đã được cộng.
  - xac-nhan-tay (thanh-toan.js:86-90) lúc đó có `muon` = false → tạo được đơn cho khoản đã vào ví.
  - Nút ở Đối soát không hiện cho phiên App (doiSoat.js, `choTay` cần `!r.p_app`), nên chỉ còn đường khác.
- K5 chặn oan (hiếm): payOS và SePay theo dõi HAI tài khoản khác nhau, khách chuyển tay T2 vào tài khoản SePay với nội dung TQD<mã phiên> sau khi payOS đã cộng T1 → SePay ghi chua_khop "hai cổng", không cộng. Tiền không mất (CẦN XEM), nhưng khách không được cộng tự động.
- Dòng tkKhac / that_bai của cùng cổng được đếm vào `nay` → thêm một đường lệch, cùng gốc với lỗi 1.
- Hai cổng báo song song trên đường vào ví: câu đọc ở :155 là câu ĐẦU của giao dịch. beginTransaction (server/database.js:1581-1599) mở `db.transaction("write")` ngay ở câu đầu → đọc nằm trong khoá ghi, nên báo sau thấy dòng của báo trước. Lập luận đúng, nhưng chưa có ca thử hai cổng chạy cùng lúc.
- soHdCuaPhien được đọc NGOÀI giao dịch (thanh-toan.js:149). Chỉ là chữ mô tả, không hại tiền.

NGHIỆM THU: 16/16 mục có bằng chứng · mục thiếu hẳn: không. Q1b có bằng chứng nhưng mang lỗi 1, nên vẫn KHÔNG ĐẠT.
- A: A1–A8 (thu_CKNOIDUNG1.js:197-242).
- B: B3–B9 (:247-303); payOS giữ TQD<mã phiên> ≤ 9 ký tự (giuCho.js:70-71, B6 :283).
- C: C1 (:313, :328), C5 (:344); C2/C3/C6/E1 (:628-632); C4 (:371-423).
- D: D1–D5 (:314-349, :634).
- E: E1–E3 (:628-638).
- F: F1–F6 (:650-680).
  - Riêng tem ly / phiếu pha chế: chỉ có bằng chứng đọc code — client/src/utils/inPhieu.js:93 `split('-').pop()`, mình đã đọc. Không có ca thử; ke_hoach ghi CHƯA KIỂM.
- F2: :687 + thu_HOPDONG_KH trong npm test.
- K5: K1/K4/K5/K6 (:698-707) + bài cũ xanh (PASS 102).
- Q1a: C4–C4h (:371-423).
- Q1b: G1–G8 (:438-484), G9/G9b/G9c (:491-503). Thiếu ca xen kẽ hai cổng (lỗi 1, 3).
- Q2: D5 (:321, :349).
- Q3: bang_chung_do.txt (thu_SEPAY1, thu_P26c).
- Q4: bang_chung_do.txt:106-111.
- Q5 donThu: donThu.js BANG_KHONG_DON + đột biến BV-bang-khong-don.
- Q5 lượt 2: L1–L14 (:521-605). Quầy thấy báo: L8 / L13; Đối soát CẦN XEM: L9 / L9b.
- Bỏ mã App khỏi ghi chú: donApp.js, `notes: 'Đơn App · nhận tại quán'`.
- Lỗi vòng 1 đã vá, mình đọc code từng chỗ:
  - Lỗi 2: chỉ đúng câu chữ, sai thực chất vì lỗi 1.
  - Lỗi 3: thứ tự mã giảm trước giá đã sửa (donApp.js:64-66); còn sót mã như lỗi 4.
  - Lỗi 4: lyDoSo, doiSoat.js:254-260.
  - Lỗi 5: ke_hoach.md mục "Đối chiếu". Mình kiểm câu inPhieu.js:93 và thu_SEPAY1.js:308 Promise.all — đúng.
  - Lỗi 6: chuoiSoHd dùng chung ở thanh-toan.js:28, doiSoat.js:268, donApp.js:194; hoaDon.js dùng soHdCuaMa.

CHƯA SOÁT ĐƯỢC:
- X1/X2 mình chỉ chứng minh bằng mô phỏng thuần chép đúng biểu thức thanh-toan.js:155-157, CHƯA chạy qua webhook thật. Người gác chặn chạy bản sao bài thử có thêm ca, vì file chứa tên biến JWT_SECRET. Nên thêm thành ca thật trong thu_CKNOIDUNG1.js.
- Chưa chạy dot_bien.py (theo dặn). Chưa chạy `tu_chay/cong.js chay`.
- Chưa xem giao diện thật: nút nổi vàng, thẻ vào ví ở màn Đơn App, nút xác nhận tay ở Đối soát, tem ly APP0016.
- Chưa kiểm hành vi trên Turso.
- Chưa biết payOS `reference` có trùng mã FT với SePay `referenceCode` không. Nếu trùng thì so mã GD là cách chặn hai cổng chắc hơn đếm.

BÀI HỌC:
- KHOÁ: phép chặn trùng giữa hai nguồn phải thử theo MỌI thứ tự của ≥ 2 sự kiện mỗi nguồn: A trước B, B trước A, xen kẽ, có dòng loại khác từ trước. Bài thử nên sinh mọi hoán vị nhỏ (2 khoản × 2 cổng) và so tổng cộng ví với số khoản thật. Đột biến: đổi vế đếm của một bên.
- KHOÁ (Đối soát): một phiên có ≥ 2 dòng `vao_vi` từ HAI cổng khác nhau → ĐỎ, không chỉ CẦN XEM. Đây là phép đối soát kèm theo tính năng tự cộng ví (LUAT §5); có phép này thì X1 đã lộ.
- NGUYÊN TẮC (K3/K4 — thêm vào KHUON_LOI.md): phép so "đếm A < đếm B" phải đếm CÙNG loại dòng ở hai vế. Dòng do chính phép ghi ra (chua_khop "hai cổng") phải được đếm như nhau ở cả hai phía, nếu không hai vế lệch sau lần kích hoạt đầu tiên.
- NGUYÊN TẮC (K1): bảng vòng sửa ghi "báo nhiều hơn = khoản thật thứ hai → cộng" là khẳng định về MỌI thứ tự, nhưng chỉ có một ca một thứ tự làm căn cứ.
```

### Vòng sửa 2 (sau báo cáo vòng 2) — commit 95c7a0f (bài thử), ca6aa19 (code)
Dòng bảng vòng sửa 1 "báo nhiều hơn (khoản thật thứ hai) → cộng" là SAI (người soát vòng 2 bắt) — thay bằng luật đếm đối xứng dưới đây.
| Lỗi soát | Xử lý | Ca thử (đỏ trên de6cf86 qua webhook thật; đỏ trên gốc) | Đột biến |
|---|---|---|---|
| 1 hai vế đếm khác loại dòng → cộng ví 2 lần | MỘT hàm `laBanSao(q, t)` (thanh-toan.js): báo thứ n của cổng này (tính cả báo đang xét) là bản sao khi cổng kia có ≥ n báo tiền vào; hai vế đếm CÙNG loại dòng (khop, chua_khop kể cả lệch tiền và dòng "hai cổng", vao_vi; trừ that_bai, khong_phien, tiền vào tài khoản khác); câu đọc là câu đầu giao dịch ghi | X1, X1b, X2, X2b, X3 (cùng lúc), G9b/G9c giữ xanh | BV-hai-cong-vao-vi · VS-hai-cong-moi-bao · VS-hai-cong-chi-vao-vi (đưa lại ĐÚNG lỗi vòng 2) · VS-hai-cong-chi-ghi-tien |
| 1 (K5) không chặn oan | một cổng hai khoản → cộng 2; báo "tài khoản khác" không tính là khoản | X4, X6 | VS-hai-cong-dem-tk-khac |
| 2 hợp đồng "một lần mỗi giao dịch" | đúng sau lỗi 1 (X1–X3); chú thích code viết lại theo luật đếm | X1–X3 | (như lỗi 1) |
| 3 bài thử một thứ tự | 6 kịch bản: P→S, S→P, xen kẽ 2 khoản, lệch trước, cùng lúc, một cổng | X1–X6 | (như trên) |
| 4 `DISCOUNT_CODE_LIMIT_REACHED` | LY_DO_NGAN mục mã giảm thêm `DISCOUNT` | L14 | VS-ly-do-discount |
| 5 hai vị từ "hai cổng" | đường chốt đơn dùng CÙNG `laBanSao` (thay `daBao`) — thu_SEPAY1 C14b / C14d xanh | C14b, C14d (thu_SEPAY1) | BV-chot-ban-sao |
| Bài học KHOÁ Đối soát | `phepTienVe` (doiSoat.js): phiên có số lần ghi tiền (khop + vao_vi) > số báo tiền vào của cổng báo nhiều nhất → ĐỎ "vượt số khoản" | X5 ×2 | BV-doi-soat-vuot |
Nghi ngờ vòng 2: giờ ngân hàng `luc > het_han` và hai tài khoản khác nhau cho hai cổng (K5 hiếm — tiền không mất, CẦN XEM) → CHƯA KIỂM / Phát hiện;
`soHdCuaPhien` đọc ngoài giao dịch — chỉ chữ mô tả, để nguyên.
Kiểm sau vòng sửa 2: `thu_CKNOIDUNG1.js` 109 · 0; `npm test -- --day-du` PASS 102 · FAIL 0 · CẢNH BÁO 2 (như trước); `python3 viec/CK-NOIDUNG-1/dot_bien.py`
ĐỐI CHỨNG XANH (ck 109 · 0, kh 95 · 0, sp 78 · 0) · TỔNG 58 · BẮT 57 · HỎNG 1 (VS-ly-do-ngan-thu-tu: mẫu chuỗi cũ sau khi thêm `DISCOUNT` — sửa mẫu
trong dot_bien.py, chạy lại riêng tên đó: BẮT) → 58/58 BẮT.

### Vòng 3 (cuối) — `/ra-soat` trên HEAD 68a7cd1 (agent độc lập mới, chỉ đọc) — báo cáo nguyên văn
```
KHÔNG ĐẠT

Tóm lại bằng lời thường: vòng sửa 2 đã vá đúng các ca người soát vòng 2 nêu. Đó là các ca X1, X1b, X2, X2b, X3, cùng L14 và việc gom về một hàm laBanSao. Nhưng phép "bản sao giữa hai cổng" vẫn chỉ đếm số lần báo, không nhìn số tiền. Khi khách chuyển hai khoản KHÁC số tiền tới một đơn App đã huỷ, và một cổng báo đảo thứ tự, máy cộng ví sai tiền: có thứ tự cộng thừa, có thứ tự cộng thiếu. Phép Đối soát ĐỎ mới "vượt số khoản" cũng chỉ đếm số lần, nên không bắt được ca này. Lỗi chạm ví nên xếp NẶNG. Theo LUAT §6.5, đã hết 3 vòng mà còn lỗi tiền thì phải dừng và ghi ## Câu hỏi cho chủ quán.

Mình đã chạy lại trên HEAD 68a7cd1, cây làm việc sạch trước và sau khi chạy:
- `node cong_cu/thu_CKNOIDUNG1.js`: 109 đạt · 0 hỏng.
- `node cong_cu/thu_SEPAY1.js`: 78 đạt · 0 hỏng.
- `node kiem_tra_truoc_khi_giao.js --day-du`: PASS 102 · FAIL 0 · CẢNH BÁO 2, thoát 0.
  - Mình chỉ giữ 25 dòng cuối, nên không thấy dòng "dist KHỚP". Vì FAIL 0 nên phép so băm dist (D5) đã xanh.
- Không chạy dot_bien.py (theo dặn).

LỖI TÌM ĐƯỢC:

1. server/routes/thanh-toan.js:133-138 (laBanSao) và :164 (vaoVi) — Phép "bản sao" ghép báo của hai cổng chỉ theo THỨ TỰ ĐẾM, không theo SỐ TIỀN. — K3 + K4 (vị từ không phủ đủ loại đầu vào: khoản khác số tiền) — NẶNG (ví).
   - Câu SQL ở :134 không có `so_tien`. Kết luận "là bản sao" (:136-137) vì vậy đúng chỉ khi hai cổng báo các khoản theo CÙNG thứ tự.
   - Đường vào ví bỏ qua phép lệch tiền (:175 xét trước :176), nên đơn App huỷ / hết hạn / lỗi cộng đúng `t.soTien` của báo nào được ghép là "khoản mới" (:170).
   - Mình mô phỏng thuần, chép đúng biểu thức :134-137 và luồng :164-170 (/tmp/claude-0/-home-user-pos-tuquyduong/9248b212-f5f8-5e47-9ba1-a08ca1af158f/scratchpad/sim3.js). Đơn App đã huỷ, T1 = 20.000, T2 = 25.000, tiền thật 45.000:
     - Y1 — SePay T2 · payOS T1 · payOS T2 · SePay T1: ví cộng 50.000, THỪA 5.000.
     - Y2 — SePay T1 · payOS T2 · payOS T1 · SePay T2: ví cộng 40.000, THIẾU 5.000. Khách mất tiền, chỉ còn dòng CẦN XEM ghi sai "cổng kia đã báo khoản này".
     - Y3 — payOS T1 · SePay T2 · SePay T1 · payOS T2: ví cộng 40.000, THIẾU 5.000.
   - Ở cả ba ca, phép Đối soát "vượt" KHÔNG ĐỎ (lỗi 2).
   - Thứ tự đảo trong một cổng xảy ra thật: Render ngủ làm lần báo đầu hỏng rồi cổng gửi lại sau. Ca khách chuyển nhầm số tiền rồi chuyển lại cũng thường gặp.
   - Bài thử X1–X6 (cong_cu/thu_CKNOIDUNG1.js:509-515) đều dùng HAI khoản CÙNG số tiền. X2 có khoản lệch, nhưng báo theo đúng thứ tự, nên không lộ lỗi.
   - Cách sửa gọn: thêm `AND so_tien = ?` (`t.soTien`) vào câu :134, tức ghép theo từng số tiền. Mô phỏng cột "ghép theo số tiền" ra 45.000 ở cả Y1, Y2, Y3, và X1 vẫn đúng.
   - Kèm ca thật trong khung có sẵn: `['huy','S','P20000','P','S20000']` mong ví 45.000. Kèm một đột biến gỡ vế số tiền.

2. server/utils/doiSoat.js:241-247 (lưới "vượt số khoản") — Phép so SỐ LẦN ghi tiền với SỐ LẦN báo, không so số tiền. — K3 (lưới báo xanh oan) — NẶNG.
   - Đây là quy tắc đối soát đi kèm tính năng tự cộng ví (LUAT §5). Nó được ghi là "lưới chặn cộng ví hai lần", nhưng để lọt Y1, nơi ví bị cộng thừa.
   - Cách sửa: GROUP BY thêm `s.so_tien`, hoặc so tổng `so_tien` của các dòng khop + vao_vi với tổng báo tiền vào của mỗi cổng.
   - Thêm: vị từ "báo tiền vào" bị viết hai lần, một bản SQL ở doiSoat.js:243 (VAO) và một bản ở thanh-toan.js:134-135. Hai bản sẽ lệch nhau khi một bên được sửa (K4 BAN-HANG-1, LUAT §2). Nên đặt một đoạn SQL dùng chung ở congQr.js, cạnh LY_DO_*.

3. HOP_DONG_API_KH.md (Ghi chú v10, dòng `tien_ve_da_cong_vi`) — Câu "một lần mỗi giao dịch ngân hàng — … cùng khoản báo qua cả hai cổng QR, chỉ cộng một lần" vẫn sai ở Y1, Y2, Y3. — K1 — NẶNG (lời hứa tiền gửi App KH).
   - Cùng khuôn: chú thích thanh-toan.js:128-132 "báo thứ n … là BẢN SAO khi cổng kia đã có ≥ n báo" nói như thể luôn đúng, trong khi điều kiện ngầm "cùng thứ tự" không được nêu.
   - Cùng khuôn: bảng vòng sửa 2 ở trang_thai.md ghi "MỌI thứ tự", nhưng chỉ có căn cứ cho các khoản cùng số tiền.

4. server/routes/thanh-toan.js:190 — Vế `sau.nguon !== t.nguon` chặn trước `banSao`, nên lời nói "một hàm đối xứng" chưa thật. — K4 — NHẸ.
   - Lỗi có từ trước nhánh (daBao cũ cũng thế), chỉ đổi nhãn ĐỎ / CẦN XEM, máy không tự chuyển tiền.
   - Ca lỗi: payOS chốt T1, khách chuyển thêm T2, SePay báo T1 rồi T2 (T2 ra ĐỎ, đúng), rồi payOS báo T2. Vì cùng cổng đã chốt, báo payOS T2 bỏ qua laBanSao và ra ĐỎ "phiên đang da_thu".
   - Kết quả: hai dòng ĐỎ cho một khoản T2, dễ hoàn hai lần.
   - Bỏ vế đó, chỉ để laBanSao quyết, thì payOS T2 (lần 2, SePay có 2) thành bản sao (CẦN XEM), đúng.

5. Đường chốt đơn đổi hành vi so với daBao cũ mà không có ca nào ĐỎ trên bản cũ. — K3 — NHẸ.
   - Hai ca khác nhau giữa cũ và mới:
     - (a) cổng này đã có báo lệch tiền trước đó (cũ: ĐỎ, mới: CẦN XEM nếu cổng kia có ≥ n);
     - (b) cổng này đã có dòng that_bai / tiền vào tài khoản khác (cũ: ĐỎ, mới: CẦN XEM).
   - Hướng đổi hợp lý: trước đây ca (a) bảo hoàn một khoản đã trả cho đơn.
   - Nhưng chỉ có C14b / C14d (thu_SEPAY1.js:362, 375) làm chứng, và hai ca này xanh ở CẢ bản cũ lẫn bản mới. Đột biến BV-chot-ban-sao (dot_bien.py:83) chỉ thay bằng `false`.
   - Đột biến "đưa lại daBao cũ" sẽ SỐNG. Thiếu ca "lệch tiền trước rồi cổng kia chốt → báo sau CẦN XEM".

NGHI NGỜ:
- thanh-toan.js:179 (đường khop / chotPhien) không gọi laBanSao.
  - Phiên App `cho`: một cổng có giờ ngân hàng `luc` > het_han nên vào ví (:158), cổng kia có giờ ≤ het_han mà máy chủ còn hạn nên tạo đơn. Kết quả: cùng một khoản vừa vào ví vừa thành đơn.
  - Lưới "vượt" bắt được ca này (ghi 2 > 1). Chỉ xảy ra khi hai cổng báo giờ giao dịch khác nhau. Vế `luc > het_han` mở từ vòng 1, vẫn CHƯA KIỂM.
- Khoá payOS `${orderCode}:${reference ?? ''}` (:200): nếu payOS gửi lại cùng khoản lúc có lúc thiếu `reference`, hai khoá khác nhau. Một cổng nên laBanSao không chặn, và đơn App huỷ sẽ được cộng ví hai lần; lưới "vượt" không bắt (ghi 2 = payOS 2). Chưa biết payOS có làm vậy không.
- laBanSao ở đường chốt đơn đọc ngoài giao dịch (:187) rồi ghi ngoài giao dịch. Hai báo cùng lúc sau khi phiên đã chốt có thể cùng ra ĐỎ. Bản cũ cũng vậy, nên không phải lỗi mới.
- Biểu thức `nay <= ds.length - (nay - 1)` (:137) khó đọc. Đặt `khac = ds.length - (nay - 1)` rồi so `nay <= khac` thì cùng nghĩa mà dễ soát hơn.
- Không có chỉ mục trên pos_phien_thanh_toan.noi_dung (đã ghi từ vòng 1). Nội dung TQD<MMM><DD> lặp lại sau một năm; :145 dùng ORDER BY id DESC nên lấy phiên mới nhất, chấp nhận được.

NGHIỆM THU: 16/16 mục có bằng chứng · không mục nào thiếu hẳn. Q1b mang lỗi 1 nên vẫn KHÔNG ĐẠT.
- A: A1–A8 (thu_CKNOIDUNG1.js:197-242).
- B: B3–B9 (:247-300); payOS giữ TQD<id> (giuCho.js, B6 :283-287).
- C: C1 (:313/316/328), C5 (:344); C2/C3/C6/E1 (:668-672); C4–C4h (:371-423).
- D: D1–D5 (:314-349, :674).
- E: E1–E3 (:672-678).
- F: F1–F6 (:690-729). Tem ly / phiếu pha chế chỉ có bằng chứng đọc code (inPhieu.js, như vòng 1–2).
- F2: :727 + thu_HOPDONG_KH trong npm test.
- K5: K1/K4/K5/K6 (:738-747) + toàn bộ bài cũ xanh (PASS 102).
- Q1a: C4–C4h.
- Q1b: G1–G9c (:438-503) + X1–X6 (:509-538). Thiếu ca khác số tiền (lỗi 1).
- Q2: D5 (:317, :321, :349).
- Q3: bang_chung_do.txt (SEPAY1 B1/E3, P26c C1/C2).
- Q4: bang_chung_do.txt:106-111.
- Q5 donThu: donThu.js BANG_KHONG_DON.
- Q5 lượt 2:
  - câu App: L3/L12 (:475-477, :568-571);
  - quầy thấy báo: L8 (:595-600), L13 (:645);
  - Đối soát CẦN XEM: L9/L9b (:604-607); lý do ngắn: L14 (:640).
- Bỏ mã App khỏi ghi chú bill: donApp.js datDon `notes: 'Đơn App · nhận tại quán'`.
- Lỗi vòng 2, đọc code từng chỗ:
  - Lỗi 1 (đếm khác loại dòng) đã vá: hai vế cùng loại dòng (:134-137). Còn lỗ số tiền (lỗi 1 mới).
  - Lỗi 2: đúng với khoản cùng số tiền, sai với khoản khác số tiền (lỗi 3).
  - Lỗi 3 (một thứ tự): đã thêm 6 kịch bản, nhưng chỉ cùng số tiền.
  - Lỗi 4: DISCOUNT đã thêm (donApp.js:65).
  - Lỗi 5: một hàm laBanSao cho cả hai đường. Còn vế :190 (lỗi 4 mới).

CHƯA SOÁT ĐƯỢC:
- Y1, Y2, Y3 chỉ chứng minh bằng mô phỏng thuần, chép đúng thanh-toan.js:134-137 + :164-170, chưa chạy qua webhook thật. Vòng 2 đã ghi người gác chặn chạy bản sao bài thử. Khung kichBan ở :509-528 nhận được ngay token `P20000` / `S20000` để làm ca thật.
- Chưa chạy dot_bien.py, chưa chạy `tu_chay/cong.js chay` (LUAT §6.3; trang_thai.md:223 hẹn làm ở bước 11).
- Chưa xem giao diện thật: nút nổi vàng "· n vào ví", thẻ vào ví ở màn Đơn App, nút "Xác nhận tay → tạo đơn" ở Đối soát, tem ly APP0016.
- Chưa kiểm trên Turso: SUM(bool), MAX(a,b) hai đối số, INSERT…SELECT MAX+1 trong giao dịch ghi.
- Chưa biết payOS `reference` có trùng mã FT với SePay `referenceCode` không. Nếu trùng, ghép theo mã GD chắc hơn cả ghép theo số tiền.
- Không thấy dòng "dist KHỚP" vì chỉ giữ 25 dòng cuối. Suy ra từ FAIL 0.

BÀI HỌC:
- KHOÁ (bài thử): phép khử trùng giữa hai nguồn phải thử với sự kiện KHÁC GIÁ TRỊ (số tiền), không chỉ khác thứ tự. Bộ hoán vị 2 khoản × 2 cổng phải có một khoản lệch số tiền và so TỔNG TIỀN cộng ví với tổng tiền thật, không so số lần.
- KHOÁ (Đối soát): lưới đối soát tiền phải so TỔNG TIỀN, không chỉ đếm dòng. Lưới đếm số lần không bắt được việc ghép nhầm cặp.
- NGUYÊN TẮC (KHUON_LOI K3/K4): ghép "bản sao" giữa hai nguồn phải theo một khoá nhận dạng đủ (số tiền, mã GD) chứ không theo thứ tự đến. "Báo thứ n" chỉ là một khoá khi mọi nguồn giữ cùng thứ tự, và với webhook gửi lại thì không có bảo đảm đó.
- NGUYÊN TẮC (K3): đổi hành vi của đường cũ để "gom một hàm" thì phải có ca ĐỎ trên bản cũ cho từng ca hành vi khác. Bài cũ xanh cả hai bên chỉ chứng minh không thụt lùi, không chứng minh bản mới đúng (BV-chot-ban-sao).
```
Kết luận phiên chính: hết 3 vòng sửa (`so_vong_sua_toi_da`), lần soát cuối còn lỗi NẶNG đụng ví (lỗi 1–3) → theo LUAT §6.5 / `/lam-viec` bước 8:
DỪNG, ghi `## Câu hỏi` (Q6). Không sửa thêm, chưa soát bảo mật (bước 8b), chưa ghi Bài học / HEAD ĐÃ KIỂM. Lỗ chỉ mở khi CẢ HAI cổng QR cùng
báo tiền về cho một phiên — đúng luật "một cổng tại một thời điểm" (QUYET_DINH 01.11) thì `laBanSao` không kích hoạt (cổng kia không có báo nào).

### Soát nhanh sau Q6 B — agent độc lập, chỉ đọc, trên 72930df (chủ quán: không cần vòng soát 4, soát nhanh MỘT lần phần vừa đổi)
Kết luận: **ĐẠT** — không đường nào làm ví cộng thừa (`congKiaDaBao` là câu đọc đầu giao dịch ghi `db.transaction("write")`; cộng chỉ khi `changes === 1`;
một cổng không bị chặn oan — X4 + VS-hai-cong-ca-cong-nay); dòng "KHÔNG tự cộng" chứa `LY_DO_HAI_CONG` → CẦN XEM; đường chốt đơn trùng từng chữ
với main 4ec877f; tên ca Y1–Y3 khớp thứ tự + số tiền; 5 neo đột biến mới mỗi neo đúng 1 chỗ.
Hai lỗi NHẸ (chữ, không đụng tiền) — đã sửa ở 246f400: (1) câu hợp đồng `tien_ve_da_cong_vi` nay ghi "từ lúc cổng thứ hai báo, mọi báo sau (của cả
hai cổng) KHÔNG tự cộng"; (2) chú thích đầu mục CK của doiSoat.js thêm vế "phiên App mà máy không tự cộng ví".
Nghi ngờ người soát nêu: đường chốt đơn không còn đột biến riêng — đúng chủ ý (là code main, C14b / C14c / C14d của `thu_SEPAY1.js` vẫn canh `daBao`,
78 · 0); cụm "KHÔNG tự cộng" là chữ tự do mà bài thử đếm — đổi chữ thì bài ĐỎ (không xanh oan), để nguyên.
BÀI HỌC (người soát): máy không phân biệt chắc "bản sao" với "khoản thật thứ hai" thì đừng ghép theo thứ tự đếm — chặn theo điều kiện có / không
(cổng kia đã báo chưa) và đẩy sang người đối chiếu tay: thà cộng thiếu rồi bù tay còn hơn cộng thừa.

## Soát bảo mật
`/soat-bao-mat` lượt "tiep Q6 B" 06.11 — mốc 4ec877f^ … HEAD 246f400, cả nhánh (diff trừ client/dist 3179 dòng). Bước 2: một subagent độc lập chỉ đọc.
Số lỗi trước lọc: 0 · sau lọc: 0 (bước 3 không cần — bước 2 không tìm được lỗ hổng nào). Báo cáo nguyên văn:
```
Bản soát bảo mật nhánh viec/CK-NOIDUNG-1 (mốc 4ec877f^). Mình chỉ đọc, không sửa file, không commit.

**Kết quả: Không tìm thấy lỗ hổng** đạt ngưỡng tin cậy ≥ 8/10 do nhánh này mới thêm vào.

Mình đã đọc hết phần code máy chủ và màn quầy trong diff (dòng 1–286 và 1162–1937). Không đọc kỹ: file bài thử `cong_cu/thu_*.js` (đọc lướt tới khoảng dòng 800), hồ sơ `viec/CK-NOIDUNG-1/*` và `client/dist`. Ba phần này thuộc loại trừ (bài thử, tài liệu, bản build).

## Các đường đã soát và lý do không phải lỗ hổng

1. **Webhook SePay / payOS: chữ ký và chống phát lại** (`server/routes/thanh-toan.js` diff dòng 1418–1437)
   - Vẫn kiểm chữ ký trước khi xử lý: `kiemBao` của SePay (HMAC kèm mốc giờ ±300 giây) và `kiemChuKy` của payOS.
   - Mỗi báo tiền ghi một dòng có khoá riêng (`sepay:<id>` hoặc `<orderCode>:<reference>`) bằng `ON CONFLICT DO NOTHING`.
   - Đường mới cộng ví (`vaoVi`, diff dòng 1387–1403) chỉ gọi `ghiVi` khi câu ghi báo `changes === 1`, trong CÙNG một giao dịch. Báo lặp, hay hai báo tới cùng lúc, chỉ cộng một lần.
   - Kiểm tài khoản nhận sai (`tkKhac`) và báo thất bại (`thatBai`) chạy TRƯỚC nhánh vào ví, nên tiền vào tài khoản khác không được cộng.

2. **Số tiền cộng vào ví do ai quyết**
   - `t.soTien` lấy từ thân báo đã ký của cổng (`transferAmount` / `amount`), không phải số máy khách gửi.
   - Ví được cộng là `x.phone` của phiên. SĐT này lưu lúc tạo phiên App, lấy từ token khách. Không có tham số nào cho người gọi tự chọn ví.

3. **Số hoá đơn đoán được** (`TQDNOV05 HD0016`)
   - Trước nhánh này, nội dung `TQD<mã phiên>` và mã đơn `ORD-YYYYMMDD-001` vốn đã tăng dần, nên đây không phải chỗ hở mới.
   - Muốn khớp được một phiên thì phải chuyển tiền thật vào tài khoản quán; webhook giả thì không qua được chữ ký.
   - Chuyển tiền kèm nội dung của phiên người khác chỉ làm lợi cho người đó (trả hộ, hoặc cộng vào ví họ). Kẻ tấn công không lấy được gì.
   - Mã nhận điểm trên bill là bảng riêng `pos_signup_codes`, không phải mã đơn (`server/routes/signup-codes.js:160`).

4. **Xác nhận tay khi tiền về muộn** (`thanh-toan.js` diff dòng 1336–1349, `server/utils/giuCho.js` diff dòng 1768–1805)
   - Vẫn qua `authenticate`, `checkPermission('xac_nhan_ck_tay')` và bắt buộc lý do.
   - Cờ `muon` do máy chủ tự tính, máy khách không gửi được. Phiên của đơn App bị chặn (409 `PHIEN_APP_KHONG_TAO_LAI`).
   - Giá và ví đi qua `taoDon`, máy chủ tự tính lại (ví không đủ thì 400 `SO_DU_KHONG_DU`).
   - Cổng ghi `cho/huy → da_thu` vẫn là một câu ghi có điều kiện, kiểm `changes`.

5. **Kênh `APP` ở quầy**
   - `kenh` chỉ là tham số thứ ba của `taoPhien`, `donApp.js` truyền vào. Route quầy không đọc nó từ thân yêu cầu (bài thử A8 cũng canh điểm này).

6. **Cửa `/api/kh`**
   - `chiTietDon` và danh sách đơn vẫn lọc theo `req.khach.phone` lấy từ token (`server/utils/donApp.js:313-314`, `CAU_DON`).
   - Các trường mới `so_hd`, `tien_ve_da_cong_vi`, `thong_bao_tien_ve` chỉ tính trên các dòng đã lọc theo khách.
   - `thong_bao_tien_ve` dùng `lyDoNgan` để đổi lỗi thành câu chung, không lộ lỗi nội bộ.

7. **Nội dung lạ hiện ra màn hình**
   - `ma_gd` (cắt còn 64 ký tự) và `noiDung` đã chuẩn hoá đều hiện qua React, không dùng `dangerouslySetInnerHTML`.
   - `noiDung` dựng lại từ nhóm của biểu thức chính quy, chỉ gồm chữ và số.
   - Chuỗi lý do có SĐT khách chỉ hiện ở màn quầy đã đăng nhập (`/kh/don-app` có `authenticate`), không ra App.

8. **Các chỗ khác**
   - Mọi câu SQL mới đều dùng tham số, không ghép chuỗi người dùng.
   - Bảng `pos_so_hoa_don` đã có trong `BANG_KHONG_KHOI_PHUC` (sao lưu không ghi đè được) và `BANG_KHONG_DON` (công cụ dọn dữ liệu thử không xoá).

## Ghi chú phụ (dưới ngưỡng báo, không tính là lỗ hổng)

Phiên QUẦY đã `huy` mà vẫn xác nhận tay được thì ví bị trừ lại phần `giu_vi`, không hỏi lại PIN của khách. PIN này khách đã nhập lúc tạo đúng phiên đó. Muốn làm vậy phải có quyền `xac_nhan_ck_tay` và ghi lý do. Đây là chỗ nghiệp vụ nên cân nhắc, không phải lỗ hổng khai thác được. Điểm tin cậy: 3/10.
```
SOÁT BẢO MẬT: ĐẠT

## Bài học
Sự cố của việc: hết 3 vòng soát vẫn còn lỗi ví (ghép báo hai cổng theo thứ tự — vòng 2 vá đếm, vòng 3 bắt thứ tự đảo + khác số tiền) → hỏi chủ quán
(Q6) → chọn B (đơn giản hoá). Người gác chặn lượt này: B-BIMAT-CHU ×1 (chạy thẳng bài thử có chữ khoá — commit trước rồi chạy), B-PHANTICH ×2 (lệnh
ghép sau `&&` / script + `node`), SED-I ×1, CC-LA ×1 (ReadNotifications). Lượt trước: xem Tiến độ.
- **KHOÁ** (đã làm, trong Phạm vi): phép khử trùng giữa hai nguồn thử với sự kiện KHÁC GIÁ TRỊ và thứ tự đảo — Y1, Y2, Y3 (`thu_CKNOIDUNG1.js`) +
  đột biến VS-hai-cong-thu-tu đưa lại đúng lỗi vòng 3 (BẮT). Đỏ trên gốc và trên e7842a9.
- **NGUYÊN TẮC** (ngoài Phạm vi — đề xuất `KHUON_LOI.md` K3, thêm một dòng "Chặn (CK-NOIDUNG-1)"): "Ghép 'bản sao' giữa hai nguồn không theo thứ tự
  đến (webhook gửi lại không giữ thứ tự). Không có khoá nhận dạng chắc (mã GD chung) → đừng tự quyết đường tiền: chặn theo có / không và đẩy sang
  người đối chiếu tay — thà cộng thiếu có dòng CẦN XEM còn hơn cộng thừa. Đã gây: 3 vòng soát, Y1 cộng 50.000 cho 45.000 thật." KHUON_LOI hiện
  K1–K8, gộp vào K3 không tăng số mục.
- **NGUYÊN TẮC** (ngoài Phạm vi — đề xuất K3): "Gom hai đường về một hàm mà đổi hành vi đường CŨ → mỗi ca hành vi khác phải có ca ĐỎ trên bản cũ;
  không muốn đổi thì để đường cũ nguyên như main." Đã gây: vòng sửa 2 thay `daBao` bằng `laBanSao` (soát vòng 3 lỗi 4, 5) — Q6 B trả về main.
- **BỎ**: lưới Đối soát so TỔNG TIỀN (soát vòng 3 bài học KHOÁ) — với B, cộng thừa không xảy ra theo cách dựng (cổng kia đã báo → không cộng); lưới
  đếm "vượt số khoản" giữ làm phép canh. Chặn của người gác: luật đã có trong skill (B-BIMAT-CHU, lệnh đứng một mình, SED-I) — lỗi của máy, không
  cần luật mới.
- Dọn: không thấy lời dặn nào trong KHUON_LOI / CLAUDE.md mà việc này có phép kiểm làm thay.

## Báo cáo 7 mục (lượt "tiep Q6 B")
```
VIỆC:        CK-NOIDUNG-1 — Nội dung chuyển khoản có số hoá đơn (lượt Q6 B: không tự cộng ví khi cả hai cổng cùng báo)
ĐÃ SỬA:      server/routes/thanh-toan.js:126-138 — bỏ laBanSao (ghép theo thứ tự), thêm congKiaDaBao: phiên đã có báo tiền vào từ cổng kia → không cộng ví
             server/routes/thanh-toan.js:162-167 — dòng chua_khop "có thể cùng một khoản báo qua hai cổng … máy KHÔNG tự cộng — đối chiếu sao kê … cộng tay" (CẦN XEM)
             server/routes/thanh-toan.js:186-192 — đường chốt đơn trả về đúng daBao của main 4ec877f
             server/utils/doiSoat.js — chỉ chú thích; dòng ĐỎ "vượt số khoản" GIỮ nguyên
             HOP_DONG_API_KH.md — câu tien_ve_da_cong_vi theo luật mới (không đổi trường, không đổi PHIEN_BAN — v10 chưa gộp)
BÀI THỬ:     thu_CKNOIDUNG1.js (G9c, X1–X6 đổi mong; Y1, Y2, Y3 + ca Đối soát Y1–Y3 mới) — gốc 4ec877f ĐỎ 22 · 87; e7842a9 ĐỎ 103 · 10
             (Y1 ví 50.000 cho 45.000 thật, Y2/Y3 40.000); sau vá XANH 113 · 0. npm test -- --day-du PASS 102 · FAIL 0 · CẢNH BÁO 2 (cảnh báo cũ, file khác).
             Đột biến: ĐỐI CHỨNG XANH · 57 / 57 BẮT.
ĐÃ RÀ K4:    grep "laBanSao|banSao" server/ cong_cu/ HOP_DONG_API_KH.md → 0 chỗ (chỉ banSao khác nghĩa ở thu_gia_lap.js); grep "hai cổng" → đường vào ví
             (đã đổi) + đường chốt đơn (về main) + doiSoat (CẦN XEM) — hết. Đường "lệch tiền" khi phiên còn hạn không xét hai cổng (Phát hiện, như cũ).
CHƯA KIỂM:   Render đang đặt CONG_QR gì / có bật cả hai cổng không — máy không đọc được; "chỉ một cổng" vẫn là việc làm tay. payOS reference có trùng
             mã FT của SePay không (nếu trùng, ghép theo mã GD sẽ tự cộng được thay vì cộng tay). Giao diện thật trên điện thoại (dòng CẦN XEM "KHÔNG tự
             cộng" ở Đối soát) — chỉ kiểm qua bài thử. Turso thật (giao dịch ghi) — chỉ chạy trên kho thử. Đường chốt đơn khi bật hai cổng vẫn có thể ra
             hai dòng ĐỎ cho một khoản (có từ main — Phát hiện).
GIT:         28a9878 CK-NOIDUNG-1: soat nhanh Q6 B, soat bao mat (DAT), Bai hoc, bao cao 7 muc
             246f400 CK-NOIDUNG-1: Q6 B sua chu theo soat nhanh (hop dong: tu luc cong thu hai bao moi bao sau khong tu cong; chu thich doiSoat)
BÀI HỌC:     KHOÁ 1 · NGUYÊN TẮC 2 · BỎ 2 — chi tiết ở ## Bài học
```
Thử tay cho chủ quán (chỉ khi có lúc bật cả hai cổng): vào **Đối soát** → mục CK, dòng có chữ "KHÔNG tự cộng" nằm ở CẦN XEM → mở sao kê ngân hàng,
khoản nào chưa vào ví khách thì nạp tay vào tài khoản khách (SĐT ghi ngay trong dòng).

## Cổng kiểm (bước 11.4)
`node tu_chay/cong.js chay . 4ec877f^ HEAD viec/CK-NOIDUNG-1` trên HEAD 28a9878, cây sạch:
✓ CỔNG CHẠY ĐẠT
(kèm một CẢNH BÁO A16: bài thu_CKNOIDUNG1.js trên gốc in 109 ca, head 113 — bài dừng sớm trên gốc vì gốc chưa có các route / cột mới; bằng chứng đỏ
22 · 87 ghi ở `bang_chung_do.txt`.)

HEAD ĐÃ KIỂM: 28a9878
