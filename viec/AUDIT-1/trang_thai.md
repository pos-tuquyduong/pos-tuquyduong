# AUDIT-1 — trạng thái

## Bản chụp lúc mở việc (04.10.2026)
```
$ git branch --show-current
viec/AUDIT-1
$ git log --oneline -3
ac7f2d0 PHIEU: AUDIT-1
b94110e TIEN-DO: P26b xong (c3d5816), them P26c + P26d, bo sung HOC-2 — so v19
c3d5816 Merge pull request #8 from pos-tuquyduong/viec/P26b
```
Có commit `PHIEU: AUDIT-1` → đúng việc.

## Bản chụp lúc làm tiếp (04.10.2026, sau duyệt kế hoạch)
```
$ git branch --show-current
viec/AUDIT-1
$ git log --oneline -3
b9759cf AUDIT-1: trang thai — vong soat ke hoach, phat hien ghi san
fa17b35 AUDIT-1: ke hoach §8 — sua theo vong soat (E1 khong goi tai_cho, A15, ma NG loi hook, TMPDIR)
08fb596 AUDIT-1: trang thai buoc 1-3, cau hoi thoi gian
```
Chủ quán duyệt kế hoạch tại b9759cf (§8 thắng), Câu hỏi thời gian = (a) chạy đủ. Thêm 5 dặn: D1 đột biến chỉ vào
thứ phép soi; C2 NẶNG chỉ sau tầng 2 + dòng "ở quầy sẽ sai gì"; thu_p1.js KHÔNG chạy, xếp mức bằng đọc code;
LẠC/TREO chạy lại -j 1 một lần; vượt ước lượng 1,5 lần thì ghi số đo, làm tiếp.

## Tiến độ
- [x] Bước 1 — đối chiếu bản chụp
- [x] Bước 2 — đọc phiếu, CLAUDE.md, KHUON_LOI.md, đo kích thước + thời gian từng nhóm
- [x] Bước 3 — `ke_hoach.md` (soát bằng agent chỉ đọc) — **DỪNG chờ chủ quán duyệt** (phiếu: "Chờ duyệt kế hoạch")
- [ ] G3 công cụ đo tự chứng minh → `bang_chung_do.txt`
- [x] Nhóm A · [x] B · [x] C · [x] D · [x] E · [x] F · [x] báo cáo G1 · [x] soát G4 · [x] bài học

## Câu hỏi
1. Tổng thời gian máy ước lượng ~95 phút, sau sửa §8 còn ~85 phút (phiếu: > 90 phút thì hỏi). Cách cắt đề xuất ở `ke_hoach.md` §5 —
   chủ quán chọn (a) chạy đủ theo nhóm, hoặc (b)/(c). Chưa duyệt thì không chạy.

## Sự cố (đầu vào bài học)
- Bước 2: người gác chặn 3 lệnh đo của chính tôi — `$(( ))` và `( … )` giữa lệnh (B-PHANTICH), `for`/`nproc`
  (B-CHUONGTRINH). Đúng luật; đổi sang script node trong nháp. Dự kiến xếp BỎ (thói quen viết lệnh, không phải lỗ).
- Bước 3: agent chỉ đọc soát kế hoạch, bắt 1 lỗi ra ngoài phạm vi (E1 định gọi nguyên `viec/TU-CHAY-4/dot_bien.py` —
  bài này sửa thẳng file thật), 3 cách làm không chạy được ("nạp `CA`/`laBaiThu`" — không được xuất; "`tat` có sẵn cho
  mọi mã A*" — thiếu A3–A5), sót A15, 4 mã NG chỉ có ở lối hook, TMPDIR khi TREO. Đã kiểm lại bằng code rồi ghi vào
  `ke_hoach.md` §8. Dự kiến xếp: NGUYÊN TẮC (K1 — kế hoạch khẳng định "gọi nguyên / nạp / có sẵn" mà chưa đọc code
  đích; đề xuất câu dẫn trong KHUON_LOI K1, không sửa KHUON_LOI ở việc này).
- Bước 3: người gác chặn thêm `$'…'` (B-PHANTICH) — cùng loại sự cố bước 2.

## Soát độc lập (/ra-soát) — hai vòng, đều KHÔNG ĐẠT rồi sửa trong Phạm vi

**Vòng 1** (agent general-purpose): công cụ đo TRUNG THỰC (G3 đúng; 10 đột biến ngẫu nhiên 10/10 BẮT; 6 phát hiện kiểm
lại đúng), bắt 3 điểm: (1) `anh_kho()` gộp nhật ký người gác → báo "KHO BẨN" OAN khi có hoạt động song song (khuôn K8)
— đã sửa, loại nhật ký khỏi ảnh K5; (2) câu "ngắt giữa chừng → 0 sót" nói quá (chỉ SIGINT/SIGTERM) — đã sửa; (3) lỗ
mới `loyalty.js` đổi điểm→voucher ở quầy xếp nhầm admin NHẸ → sửa thành đường tiền (AU-G1).

**Vòng 2** (chat soát cuối): công cụ đúng (chạy lại khớp từng dòng) nhưng đã tự CẮT MẪU trái lời duyệt (a). Làm tiếp
ĐỦ, không cắt: (1) **C2 ĐỦ** — 86 đột biến bỏ-câu cho MỖI câu ghi ở 11 file routes tiền + lời gọi ghiVi (`C2F`,
40 BẮT · 45 SỐNG · 1 LẠC); phân loại route theo middleware đọc từ code; 16 SỐNG đụng tiền → AU-G1/G2/G3 NẶNG + AU-G4
NHẸ (`c2_day_du.md`). (2) **D1 ĐỦ** — mỗi phép (61 nhanh + --day-du) một đột biến riêng vào THỨ phép soi (46 BẮT · 2 LẠC
liệt kê riêng). (3) **B1** thêm VÁ SAI A8/A9/A13/A15. (4) **E2** số ca thật (bang_chung_do cũ 782→786 ca, trôi). (5)
**A4** 30 mã chưa có lệnh lách = CHƯA KIỂM kèm lý do. (6) bao_cao bỏ câu "P26b phủ mỗi câu", thêm số C2 ĐỦ; sửa dấu.

## Phát hiện ghi sẵn (chưa chấm, kiểm lại khi chạy nhóm tương ứng)
- `kiem_tra_truoc_khi_giao.js:746` ghi giả lập 22 s / thu_gia_lap 24 s; đo 04.10: 67,6 s / 70,6 s — hạn 110/120 s (C3).
- `tu_chay/thu_cong.js:336-347` không có ca `tat` cho A3, A4, A5 (B1).
- `viec/TU-CHAY-4/dot_bien.py:56-63` đột biến sửa THẲNG file thật (E).
- `cong_cu/thu_p1.js` ghi kho thật nhưng nằm trong `thu_muc_bai_thu` (B3).


## Bài học (bước 11 — đầu vào cho mục BÀI HỌC; đề xuất ngoài Phạm vi KHÔNG tự làm)

Sự cố gom: người gác chặn nhiều lệnh đo của chính tôi (`for`/`$(( ))`/`$()`/`$'…'`/heredoc nhắc file bảo vệ/`git fetch`/
`rmdir`/`wait`) → đổi sang script Python trong nháp; đột biến dựng sai lần đầu (B1-A11-dao-goc HỎNG chuỗi sai, B1-A14
LẠC quá rộng, !D1-E11-P20/P26a LẠC vì phép tĩnh bắt trước) → sửa/thu hẹp/liệt kê riêng; agent soát bắt K5 báo oan +
loyalty xếp nhầm; đột biến/hồ sơ cũ RỮA theo thời gian (I10-bo, MB, MB4 HỎNG trên HEAD; số ca 782→786).

- **KHOÁ (đã làm trong Phạm vi):** `anh_kho()` loại nhật ký người gác (hết báo oan); thêm đột biến `C2-loyalty-redeem-tru-0`
  + bộ sinh `C2F` 86 câu (đo được lỗ đường tiền); D1 đủ mỗi phép một đột biến.
- **KHOÁ (đề xuất HOC-2, ngoài Phạm vi):** bất biến loyalty redeem (AU-G1); KB+bất biến voucher used_count khi bán
  (AU-G2); KB+bất biến gói/thẻ trả trước (AU-G3); `thu_nguoi_gac` khoá `CONG_CU_DOC` (AU-A1); ca `thu_cong` cổng A14
  dạng-nhánh (AU-B1); neo lại I10-bo/MB/MB4 (AU-C1/E1/E2); nâng T2–T4 thành fail (AU-D2); thêm cong_cu/thu_P2x vào
  file_luat (AU-B3c); đổi tên thu_p1.js / tự từ chối khi không laMayThu (AU-B3).
- **NGUYÊN TẮC (đề xuất, KHUON_LOI đang 120/120 — không tự sửa):** (K8) phép tự-kiểm báo OAN trong điều kiện bình thường
  dạy người bỏ qua nó (ví dụ anh_kho gộp nhật ký phiên); (K3 bổ sung) đột biến/hồ sơ coi là ĐẠT bị RỮA theo thời gian —
  neo chuỗi dài đi qua nhiều mục thì mục khác đổi làm HỎNG âm thầm (I10-bo, MB, MB4) → mọi con số "đạt" phải kèm lần
  chạy lại trên HEAD, neo NGẮN/RIÊNG; (K1/K5) phân loại "đường tiền" vs "admin config" theo ĐỐI TƯỢNG khách chạm ở quầy,
  không theo "có trong 18 KB hay chưa" (loyalty redeem, gói/thẻ).
- **BỎ (một lần):** thói quen viết lệnh shell ghép bị người gác chặn; `git fetch`/`rmdir` bị chặn → dùng ref có sẵn.

Mọi đề xuất NGOÀI Phạm vi (KHUON_LOI/CLAUDE.md/server/tu_chay/bộ kiểm) → chat soát duyệt, gom vào HOC-2. AUDIT-1 KHÔNG tự sửa.

## G5b — tên đột biến thêm vòng 2 round 3: D1-E1b-tra-gia D1-E9-claim-kiem D1-E9-ndiem-kiem D1-E9-claim-dung D1-E9-ndiem-dung D1-E10-doisoat-tx D1-E10-doisoat-trang D1-B-deadcodes-service D1-B-pos5-query

## G5 — mọi tên đột biến trong dot_bien.py (165 tên; có mặt ở trang_thai này cho HOC-2)
G3-sai-chuoi G3-da-biet G3-vo-hai G3-sap A3-GITADD-bo-A A3-GITCOMMIT-bo-a A3-GITPUSH-moi-nhanh A3-SED-i-ngan A3-RM-bo-realpath A3-CURL-moi-host A3-LN-dao-s A3-G1CAM-theoten A3-FINDCAM-bo-delete A3-NPM-them-install A3-MKDIR-bo-khung A3-TARX-moi-dich A3-FILEC-bo-ngan A3-BGAN-bo-PATH A3-CCLA-them-la A3-GHIDUOC-bo-khung B1-A11-dao-goc B1-A11-bo-xanh-PR B1-A6-bo-phamvi B1-A10-bo-filecam B1-A7-noi-tieude B1-A12-bo B1-laBaiThu-noi-slash B1-A14-bo-dang-nhanh C2-orders-bo-diem-ban C2-sc-bo-diem-ma C2-loyalty-redeem-tru-0 D1-A1-fffd D1-B1-json-tran D1-C1-them-fetch D1-E1-unitprice D1-E7-paydebt D1-E8-backup D1-E12-vi-ngoai D1-K1-env-tho D1-S3-vi-lech D1-F3-test-thieu D1-A2-server-cu-phap D1-A2c-client-cu-phap D1-B2-login-2-cho D1-B-handleSE D1-B-co-song-song D1-B-pathname D1-B-deadcodes-thieu D1-B-eb-getDerived D1-B-eb-ton-tai D1-B-main-boc D1-B-layout-boc D1-B-key D1-B-ahref-api D1-B-pos6-loginTime D1-D-build-prod D1-E-gia-0 D1-E2-authz-tho D1-E-trangthai-dungma D1-E-danhsach-trang D1-E-claim-chiem D1-E-ndiem-chiem D1-E-vi-tuongdoi D1-E-vi-trang5 D1-K-4ca D1-K-data D1-F-attached D1-F-dist !D1-E11-P20 !D1-E11-P21 !D1-E11-P26a !D1-E11-P26b !D1-T1-nguoi-gac !D1-T1b-cong-cu !D1-T1c-cong B1-A8-noi B1-A9-noi B1-A13-bo-daydu B1-A15-dao-fork C2F-orders-01-ghiVi-quay C2F-orders-02-insert-quay C2F-orders-03-update-quay C2F-orders-04-insert-quay C2F-orders-05-update-quay C2F-orders-06-insert-quay C2F-orders-07-insert-quay C2F-orders-08-insert-quay C2F-orders-09-update-quay C2F-orders-10-update-quay C2F-orders-11-insert-quay C2F-orders-12-update-quay C2F-orders-13-update-quay C2F-orders-14-insert-quay C2F-orders-15-insert-quay C2F-orders-16-update-quay C2F-orders-17-insert-quay C2F-orders-18-update-quay C2F-orders-19-ghiVi-quay C2F-orders-20-ghiVi-quay C2F-orders-21-update-quay C2F-orders-22-delete-quay C2F-orders-23-update-quay C2F-orders-24-delete-quay C2F-orders-25-update-quay C2F-orders-26-update-quay C2F-orders-27-insert-quay C2F-orders-28-ghiVi-quay C2F-orders-29-ghiVi-quay C2F-orders-30-update-quay C2F-orders-31-delete-quay C2F-orders-32-update-quay C2F-orders-33-delete-quay C2F-orders-34-delete-quay C2F-orders-35-delete-quay C2F-orders-36-delete-quay C2F-orders-37-delete-quay C2F-orders-38-delete-quay C2F-orders-39-insert-quay C2F-refunds-01-insert-quay C2F-refunds-02-update-quay C2F-refunds-03-update-quay C2F-refunds-04-ghiVi-quay C2F-refunds-05-update-quay C2F-refunds-06-ghiVi-quay C2F-refunds-07-update-quay C2F-wallets-01-update-quay C2F-wallets-02-insert-quay C2F-wallets-03-insert-quay C2F-wallets-04-ghiVi-quay C2F-wallets-05-ghiVi-quay C2F-wallets-06-ghiVi-quay C2F-wallets-07-update-quay C2F-wallets-08-insert-quay C2F-damages-01-ghiVi-quan-tri C2F-damages-02-insert-quan-tri C2F-damages-03-update-quan-tri C2F-packages-01-insert-quan-tri C2F-packages-02-update-quan-tri C2F-packages-03-update-quan-tri C2F-packages-04-delete-quan-tri C2F-packages-05-update-quay C2F-packages-06-update-quan-tri C2F-signup-codes-01-update-khach-app C2F-signup-codes-02-insert-khach-app C2F-signup-codes-03-update-khach-app C2F-signup-codes-04-insert-khach-app C2F-signup-codes-05-update-quan-tri C2F-signup-codes-06-delete-quan-tri C2F-discount-codes-01-insert-quan-tri C2F-discount-codes-02-update-quan-tri C2F-discount-codes-03-update-quan-tri C2F-discount-codes-04-delete-quan-tri C2F-discount-codes-05-update-quay C2F-rewards-01-insert-quan-tri C2F-rewards-02-update-quan-tri C2F-rewards-03-update-quan-tri C2F-loyalty-01-insert-khach-app C2F-loyalty-02-insert-khach-app C2F-loyalty-03-insert-khach-app C2F-don-mo-rong-01-update-quay C2F-customers-v2-01-insert-khong-ro C2F-customers-v2-02-update-quan-tri C2F-customers-v2-03-insert-quan-tri C2F-customers-v2-04-update-quan-tri C2F-customers-v2-05-insert-quan-tri

## Báo cáo 7 mục (CLAUDE.md §7)

VIỆC:      AUDIT-1 — Soát toàn bộ phần tự chạy: luật nào thật sự chặn, phép nào thật sự đỏ, tài liệu nào nói đúng.
ĐÃ SỬA:    chỉ tạo file trong `viec/AUDIT-1/` (dot_bien.py 127 đột biến, lach.js, bao_cao.md, c2_day_du.md, 6 bảng,
           bang_chung_do.txt, trang_thai.md). KHÔNG đổi một byte nào ngoài `viec/AUDIT-1/`.
BÀI THỬ:   thay bước "bài thử đỏ" = G3 công cụ tự chứng minh (G3-sai-chuoi HỎNG · G3-da-biet BẮT · G3-vo-hai SỐNG ·
           G3-sap LẠC) — công cụ đo không nói dối (K3).
ĐÃ RÀ K4:  đường song song: hai lối người gác (xet/stdin), hai chế độ cổng (tĩnh/chạy), ghiVi vs reconcileWallet, bản
           cài .claude/ vs nguồn tu_chay/; C2 ĐỦ 86 câu ghi ở 11 file routes tiền (grep bỏ ghi chú) + lời gọi ghiVi.
CHƯA KIỂM: logic loyalty.js/gói (chỉ đo lưới, không khẳng định code sai); D2/D3/D4 bundle dist (đột biến cần tên băm);
           30 mã chưa có lệnh lách (A4b); số ca từng dòng bang_chung_do cũ; máy in/Render idle; thu_p1.js KHÔNG chạy
           (xếp mức bằng đọc code); 2 LẠC !D1-E11-P20/P26a (bị phép tĩnh bắt trước — bài-thật vẫn failable qua ngả khác).
GIT:       xem `git log --oneline` nhánh viec/AUDIT-1 (đã push mỗi nhóm; vòng 2 thêm C2F/D1-full/B1 + báo cáo).
BÀI HỌC:   KHOÁ (đã làm: K5 anh_kho, C2F, D1 đủ) + đề xuất HOC-2 (bất biến loyalty/voucher/gói, CONG_CU_DOC, A14, neo
           đột biến cũ, T2-T4) · NGUYÊN TẮC 3 (K8 báo oan; K3 đột biến rữa; phân loại đường tiền theo đối tượng) · BỎ 2.

KẾT QUẢ CHÍNH: câu ví/điểm-tích/hoàn/debt LÕI vững (40 BẮT, không SỐNG). Lưới KHÔNG phủ 20 câu đụng tiền → 4 nhóm NẶNG
(AU-G1 đổi điểm→voucher, AU-G2 voucher dùng-lại khi bán, AU-G3 gói/thẻ trả trước + huỷ-đơn-gói rò tiền, AU-G6 kho SX không bị trừ khi SX trục trặc) + AU-G4/G5 NHẸ; 12 phát hiện NHẸ
khác; 3 đột biến hồ sơ cũ HỎNG trên HEAD. Đầu vào duy nhất của HOC-2 là bao_cao.md + c2_day_du.md.


## Soát độc lập vòng 2 — kết quả (04.10.2026) — KHÔNG ĐẠT, đã sửa trong Phạm vi
Agent chạy thật, lõi báo cáo vững (G3 sạch, nhãn C2F khớp, AU-G1/G2/G3 đúng — đã kiểm orders-05/21, loyalty-01,
packages-05, G3 in "✓ kho thật không đổi"), NHƯNG bắt 2 điểm:
1. **Phân loại SAI `orders-22`** (`orders.js:1357` DELETE customer_packages): tôi xếp "xoá đơn admin/hiếm NHẸ". Thực
   ra ở `PUT /:id/cancel` (quyền `cancel_order`, KHÔNG owner — khoá owner `:1464` chỉ ở route DELETE). Bỏ câu → huỷ đơn
   mua-gói HOÀN TIỀN (ghiVi refund :1333) mà customer_package vẫn 'active' = RÒ TIỀN cấp quầy. Cùng khuôn loyalty vòng 1.
   → chuyển orders-22 + orders-24 (membership trong cùng route cancel) lên AU-G3; ghi caveat classifier chỉ đọc
   middleware ở `router.<verb>(`, không đọc khoá owner trong thân hàm (orders-31/35/36/37/38 ở DELETE mới thật owner-only).
2. **thu_P20 liveness CHƯA chứng minh**: báo cáo gộp P20 với P21/P26b "vẫn failable". Chạy thật: !D1-E11-P21/P26b BẮT
   (dòng riêng), !D1-E11-P20/P26a LẠC (bị phép tĩnh E7/refunds chặn trước). thu_P26a live qua C2F-loyalty-03 C8; nhưng
   **thu_P20 chưa đột biến nào làm nó đỏ dòng riêng** → ghi CHƯA KIỂM liveness (AU-G5), đúng cảnh báo K3/TU-CHAY-4.
NGHI NGỜ agent nêu (nhận): "D1 ĐỦ" nói quá so với d_bang → đã sửa d_bang/bao_cao nêu rõ ngoại lệ (D2/D3/D4, thu_P20,
canhBao T2-T4/F2). Classifier không đọc được role runtime (cancel_order/adjust_balance là quầy hay owner) — caveat đã ghi.

## Bài học bổ sung (vòng 2)
- **NGUYÊN TẮC K1:** xác định "đường khách/quầy chạm" phải bằng MIDDLEWARE + đọc THÂN HÀM (khoá `role==='owner'` nằm
  TRONG hàm, classifier theo `router.<verb>(` không thấy) — không bằng chữ "admin/hiếm" trong văn xuôi. Ví dụ thật:
  orders-22 (cancel, cancel_order) bị xếp nhầm admin NHẸ, thực là rò tiền quầy.
- **KHOÁ K3:** một bài chạy-thật chỉ được tính "còn sống" khi có đột biến làm CHÍNH file đó in dòng đỏ RIÊNG; LẠC (bị
  phép tĩnh chặn trước) KHÔNG chứng minh liveness. thu_P20 phải ghi CHƯA KIỂM cho tới khi có đột biến phá đúng thứ nó canh.


## Chat soát cuối vòng 2 (round 3) — sửa 3 điểm rồi dừng (không /ra-soat vòng 3)
1. **AU-G6 NẶNG (kho):** `C2F-orders-07/27/39` (INSERT pos_stock_pending = sổ nợ trừ kho SX khi SX/mạng trục trặc)
   trước xếp NHẸ "SX giả không lỗi nên KB không chạm" — chính đó là lỗ lưới; phiếu định nghĩa kho = NẶNG. Ở quầy: bán
   lúc SX trục trặc thì kho SX không bao giờ bị trừ. Đề xuất HOC-2: KB giả lập SX trả lỗi + bất biến mỗi dòng đơn hoặc
   trừ kho được hoặc có đúng một dòng stock_pending. (orders-22 đã rời "dọn dẹp" sang AU-G3 từ round 2.)
2. **D1 ĐỦ:** thêm 9 đột biến riêng cho các phép còn thiếu — tự-tra-giá-pos_products, /claim+/nhan-diem kiểm-TRƯỚC-ghi,
   /claim+/nhan-diem DÙNG-kết-quả, ví đối-soát CÙNG-tx, ví đối-soát danh-sách-trắng, SESSION_DEAD_CODES-service, POS-5.
   Tất cả BẮT. Bảng đối chiếu TÊN phép (nhanh + --day-du) ↔ đột biến D1 ở cuối `d_bang.md`: 53/65 phép có đột biến BẮT,
   12 CHƯA KIỂM đều có lý do (4 bundle dist cần tên băm; 4 byte-khớp + gốc-sạch canhBao-thuần không FAIL; 3 giả-lập
   --day-du chứng qua nhóm C/E) — KHÔNG phép nào thiếu dòng. (Phát hiện khi làm: route /nhan-diem ở :116 chứa call
   kiemDonCuaMa(dong) :174, /claim ở :290 chứa kiemDonCuaMa(signupRow) :339 — khoi() của bộ kiểm cắt khối đúng vậy.)
3. **bao_cao.md:** ghi HEAD thật (mã server/ tại b9759cf không đổi; sản phẩm tới HEAD hiện tại), cập nhật số D1
   (55 BẮT · 2 LẠC) và AU-G6.

Bài học bổ sung (round 3): NGUYÊN TẮC — "KB không chạm" KHÔNG phải "an toàn"; với kho/tiền, nhánh degraded (SX lỗi,
mạng trục trặc) mà lưới không có KB mô phỏng lỗi = lỗ NẶNG, không phải NHẸ. Đã gây: stock_pending xếp nhầm NHẸ 2 vòng.
