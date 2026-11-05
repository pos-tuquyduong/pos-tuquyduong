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
