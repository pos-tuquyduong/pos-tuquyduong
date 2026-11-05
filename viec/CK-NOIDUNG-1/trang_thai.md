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
