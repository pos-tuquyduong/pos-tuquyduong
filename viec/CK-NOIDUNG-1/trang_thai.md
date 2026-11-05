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
"Sau duyệt lần 2". Lượt này không còn câu hỏi mở.)

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
- Đơn / phiên hỏng TRONG giao dịch (ví thiếu, giá đổi…) → số hoá đơn rollback cùng giao dịch, không thành chỗ trống. Số chỉ "huỷ" khi phiên QR
  đã hiện (khách có thể đã thấy số) — đúng ý "mỗi chỗ trống có lý do".
