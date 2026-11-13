# VOUCHER-2 — Mẫu voucher + nhiều voucher một đơn (tối đa N), một mã khuyến mãi chung, voucher ship, không áp lên thẻ / nạp / gói / thẻ quà

<!-- Phiếu do chat soạn 11.11.2026 (bàn 35, sổ v61). Việc [T] (tiền) — Opus làn 1, lập kế hoạch rồi DỪNG chờ duyệt.
     Chủ quán chốt 08–09.11 + 10.11 + 11.11 (QUYET_DINH_CHU_QUAN.md mục 08–09.11, 10.11, 11.11):
     (1) MẪU VOUCHER trong Cài đặt Voucher (tên hiển thị · giảm số tiền HOẶC % có trần · đơn tối thiểu · áp dụng tất cả / nhóm món / món chọn ·
         hạn = số ngày từ lúc phát · dùng 1 lần · xem trước câu khách thấy) — mỗi lần phát sinh MỘT mã riêng từ mẫu, ghi nguồn. Việc sau (DOI-DIEM-1,
         GIOI-THIEU-1, sinh nhật…) chỉ CHỌN mẫu, không làm lại.
     (2) Một đơn: tối đa N voucher (Cài đặt, gợi ý 3) + MỘT mã khuyến mãi chung. Voucher TIỀN trừ trước, rồi voucher % trên phần còn lại; tổng giảm
         ≤ tiền món. Giờ flash: không voucher % (luật F2 sẵn có). Voucher ship (số tiền hoặc % có trần) chỉ giảm DÒNG PHÍ GIAO, tính vào N.
     (3) Mã giảm / voucher KHÔNG áp lên thẻ hạng, nạp tiền, gói trả trước, thẻ quà — đơn có thêm món thường thì chỉ tính trên món thường; máy chủ
         chặn ở cả quầy lẫn App (nạp đã có NAP_CHI_TIEN_MAT_QR — giữ).
     (4) Huỷ / không thành công → trả lại MỌI voucher của đơn.
     Hiện trạng chat đọc 11.11 trên main 53a71a2: đơn nhận MỘT discount_code (orders.js ~623–800, taoDon), giảm hạng + mã qua tinhUuDai (utils/uuDai.js,
     UUDAI-1: dùng chung / không theo loại mã); voucher đổi điểm = dòng pos_voucher_grants trỏ mã trong pos_discount_codes (loyalty.js /redeem, đổi
     sang 'used' ở orders.js ~1113); trả lượt khi huỷ / hoàn: traLuotMa (utils/tienDaTra.js ~62). Danh mục quà đổi điểm pos_reward_catalog (rewards.js)
     đã có kiểu giảm / giá trị / trần / valid_days — gần với "mẫu voucher": KẾ HOẠCH xét dùng lại / mở rộng, không đẻ bảng thừa.
     SONG SONG: HUY-1 (Opus làn 2) sửa đường huỷ đơn và GỌI traLuotMa — VOUCHER-2 là việc DUY NHẤT đổi thân traLuotMa (trả nhiều voucher);
     giữ nguyên tên + tham số để HUY-1 không phải đổi lời gọi. Bước nâng cấp: VOUCHER-2 dùng 026 (HUY-1 giữ 025). -->

**Chờ duyệt kế hoạch:** viết `viec/VOUCHER-2/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Quán phát voucher theo mẫu cài sẵn (đổi điểm, giới thiệu bạn bè, sinh nhật… sau này chỉ chọn mẫu), khách dùng được nhiều voucher trong một đơn ở
quầy lẫn App, máy chủ tính đúng một cách duy nhất và không để giảm lố. Làm trước khai trương vì DOI-DIEM-1, GIOI-THIEU-1 dựa vào mẫu voucher.

## Nghiệm thu
- A **Mẫu voucher (Cài đặt → Voucher):** thêm / sửa / tắt mẫu (chủ quán / quản lý theo quyền sẵn có): tên hiển thị, kiểu (số tiền | % + trần |
  ship số tiền | ship % + trần), đơn tối thiểu, áp dụng (tất cả / nhóm món / món chọn), hạn (số ngày từ lúc phát), dùng 1 lần; xem trước câu khách
  thấy, vd "Giảm 20.000đ cho đơn từ 50.000đ · HSD 30 ngày" (MỘT hàm dựng câu, App và quầy dùng chung). Lưu báo rõ (thành phần BAO-1a).
- B **Phát từ mẫu:** một hàm `phatVoucher(mau, sdt, nguon)` sinh MỘT mã riêng gắn tài khoản khách, hạn tính từ lúc phát, ghi `nguon`
  (doi_diem / gioi_thieu / tay …). Đổi điểm hiện có (loyalty /redeem) đi qua hàm này (hành vi đổi điểm giữ nguyên).
- C **Nhiều voucher một đơn:** tối đa N (Cài đặt, mặc định 3) + MỘT mã khuyến mãi chung. Thứ tự: voucher tiền → voucher % trên phần còn lại; tổng
  giảm (hạng + mã chung + voucher) ≤ tiền món đủ điều kiện; luật UUDAI-1 (dùng chung / không với giá hạng) giữ cho mã chung. Vượt N, voucher của
  người khác, hết hạn, đã dùng, chưa đủ đơn tối thiểu → báo rõ từng mã, đơn không lưu.
- D **Giờ flash:** không nhận voucher % (luật F2) — voucher tiền vẫn dùng được.
- E **Voucher ship:** chỉ giảm dòng phí giao (GIAO-1), không quá phí giao; đơn không có phí giao → báo "Voucher giao hàng chỉ dùng cho đơn giao".
  Tính vào N.
- F **Không áp:** thẻ hạng, nạp tiền, gói trả trước, (sau này) thẻ quà — đơn trộn thì mã / voucher chỉ tính trên món thường; đơn chỉ có các dòng
  đó thì báo rõ. Máy chủ chặn ở mọi đường (quầy, phiên thanh toán, App báo giá + tạo đơn).
- G **Huỷ / không thành công / hoàn:** trả lại MỌI voucher + lượt mã chung của đơn (traLuotMa). Phiên QR hết hạn / huỷ → không tiêu voucher.
  Hai đơn cùng lúc dùng một voucher → chỉ một đơn được.
- H **App KH:** `GET /voucher` trả thêm `mo_ta` (câu dựng từ mẫu) + `nguon`; báo giá + tạo đơn nhận DANH SÁCH voucher (tên trường kế hoạch đề xuất);
  hợp đồng `/api/kh` tăng PHIEN_BAN, `cong_cu/thu_HOPDONG_KH.js` khớp; App cũ gửi một mã vẫn chạy (tương thích ngược).
- I **Màn Bán hàng mới:** chọn / bỏ nhiều voucher của khách (danh sách voucher còn dùng được), ô mã khuyến mãi chung; giỏ / hoá đơn / tem hiện
  từng dòng giảm. Đơn đã lưu ghi đủ các mã đã dùng (báo cáo, Đối soát voucher khớp).
- K5 **Không đổi:** cách tính giảm hạng, Flash, combo / topping hiện có, đơn không dùng voucher (tiền y hệt trước), luật nạp chỉ tiền thật.

## Phạm vi
- viec/VOUCHER-2/**
- server/routes/orders.js
- server/routes/discount-codes.js
- server/routes/loyalty.js
- server/routes/rewards.js
- server/routes/settings.js
- server/routes/thanh-toan.js
- server/routes/don-mo-rong.js
- server/routes/hoaDon.js
- server/routes/reports.js
- server/routes/backup.js
- server/routes/kh/index.js
- server/utils/uuDai.js
- server/utils/itemScopeDiscount.js
- server/utils/voucherCode.js
- server/utils/tienDaTra.js
- server/utils/donApp.js
- server/utils/donThu.js
- server/utils/doiSoat.js
- server/utils/dongHoaDon.js
- server/utils/giuCho.js
- server/database.js
- server/nang_cap/026_voucher.js
- server/nang_cap/chay.js
- client/src/**
- client/dist/**
- cong_cu/thu_VOUCHER2.js
- cong_cu/thu_HOPDONG_KH.js
- HOP_DONG_API_KH.md
- kiem_tra_truoc_khi_giao.js
- cong_cu/thu_P20.js
- cong_cu/gia_lap/kich_ban.js
- cong_cu/thu_KH1.js
- cong_cu/thu_KHAPI2.js
- cong_cu/thu_HD1.js
- cong_cu/thu_GOI1.js
- ban_mau_pos/ban_mau_pos.html
- ban_mau_pos/DAC_TA.md
- ban_mau_pos/thu/thu_voucher.js
- server/utils/diemKhach.js
- server/utils/manKhach.js
- cong_cu/gia_lap/bat_bien.js
- cong_cu/thu_UUDAI1.js
- cong_cu/thu_KHTHE1.js
- cong_cu/thu_P26c.js
- cong_cu/thu_DOISOAT1.js
- server/routes/signup-codes.js
- server/routes/registrations.js

<!-- Chủ quán 11.11 (Q1–Q6 kế hoạch VOUCHER-2) — Q1, Q2, Q4 chủ quán SỬA khác đề xuất; kế hoạch phải sửa theo:
     Q1 SỬA — HAI loại voucher, chọn ở MẪU voucher (Cài đặt): "Chia sẻ được" (ai cầm mã cũng dùng, như luật 15.07) hoặc "Chỉ chính chủ" (chỉ đơn
        của tài khoản được phát; dùng sai → báo "Voucher này chỉ dùng cho chủ tài khoản"). Voucher đã phát trước đây GIỮ như cũ (chia sẻ được).
        Thưởng giới thiệu (GIOI-THIEU-1), phiếu quà đổi điểm (DOI-DIEM-1) sau này sẽ chọn "Chỉ chính chủ". Mã khuyến mãi chung vẫn ai cũng dùng.
     Q2 SỬA — Mã ưu đãi in trên hoá đơn cho khách mới KHÔNG dùng thẳng ở ô mã nữa: chỉ người CHƯA có tài khoản, đăng ký tài khoản LẦN ĐẦU (App
        hoặc quầy) mới nhập được; hợp lệ → phát MỘT voucher (theo mẫu chủ quán chọn trong Cài đặt) vào tài khoản mới; mỗi mã in dùng một lần;
        SĐT đã có tài khoản → báo rõ, không phát. Đường nhận mã sẵn có (signup-codes.js nhanMaUuDai, /api/kh/nhan-ma-bill) đi qua hàm phát voucher
        — không làm đường thứ hai. Hợp đồng /api/kh ghi rõ. Đã thêm signup-codes.js + registrations.js vào Phạm vi; cần file khác → câu hỏi, DỪNG.
     Q3 CÓ — voucher "nhóm món / món chọn" giảm trên tổng tiền các món thuộc nhóm / danh sách; đơn tối thiểu tính trên tiền món thường cả đơn.
     Q4 SỬA — mỗi đơn tối đa MỘT voucher % (áp cho món / nhóm nào do MẪU trong Cài đặt quy định); voucher tiền dùng nhiều cái trong giới hạn N;
        chọn voucher % thứ hai → báo rõ "Mỗi đơn chỉ dùng một voucher giảm %".
     Q5, Q6 CÓ — CHỦ QUÁN DẶN CẨN TRỌNG TỐI ĐA, không phá luật chung, không ảnh hưởng việc sau:
        · ke_hoach.md ghi cho TỪNG file thêm: sửa chỗ nào, vì sao, theo luật nào;
        · bài thử cũ CHỈ đổi số mong đợi đúng theo luật 10.11 (mã không áp lên thẻ / gói / nạp) — không nới, không bỏ phép kiểm nào; mỗi ca đổi
          ghi lý do; là bài sửa thường (đỏ trên gốc), KHÔNG ghi vào "## Bài thử cũ sửa";
        · bat_bien.js chỉ đổi cách đếm mã cho đúng nhiều voucher, không bỏ / nới phép đối soát nào;
        · thu_P26c.js + thu_DOISOAT1.js cũng nằm trong Phạm vi HUY-1 (song song): chỉ sửa đúng ca của mình, không viết lại cả file;
        · chạy --day-du + cong.js chay (gồm giả lập quầy) trước khi báo xanh; soát độc lập + soát bảo mật rà RIÊNG các file này.
     Kế hoạch sửa theo Q1 / Q2 / Q4 mới: cập nhật ke_hoach.md rồi làm tiếp; đổi lớn hoặc cần file ngoài Phạm vi → câu hỏi, DỪNG. -->

<!-- Chủ quán 12.11 (Q7–Q10 trạng thái c58ef77) — đồng ý cả 4 đề xuất:
     Q7 CÓ — đơn tạo từ VOUCHER-2 trở đi có cờ (bước 026). Với đơn có cờ: dòng gói / thẻ / nạp tính đã trả ĐỦ giá, phần giảm của mã / voucher chỉ
        chia trên món thường. Đơn cũ giữ cách chia cũ. Không đổi tên / tham số tienDaTraTheoDong, soTienHoan (HUY-1 đang gọi). Ca thử dùng SỐ TÍNH TAY
        (K3): gói 300.000 + món 50.000, mã 10% món → món đã trả 45.000, gói đã trả 300.000; đền món không quá 45.000; kết thúc gói tính trên 300.000.
     Q8 CÓ — giữ ca M4a của thu_P26c cho đơn CŨ (đặt cờ "đơn cũ" + giảm như cũ), N8–N10 vẫn phải bị bắt; THÊM ca M4c theo luật mới (mã không giảm
        gói, khách trả 600.000). Không bỏ, không nới ca nào.
     Q9 CÓ — "chưa có tài khoản" = hồ sơ khách (pos_customers) của SĐT tạo SAU lúc in bill; SĐT đã có trong POS từ trước (kể cả khách quầy chưa dùng
        App) → không nhận. Câu báo như đề xuất. Quầy: ô mã bill trong form Thêm khách. Lên bản: tự tạo mẫu voucher đúng ưu đãi khách mới đang chạy
        (giảm cả đơn); kiểu "giảm 1 món nhóm khách mới" thì để chủ quán chọn mẫu trong Cài đặt → Voucher. Cần file ngoài Phạm vi → câu hỏi, DỪNG.
     Q10 CÓ — voucher ship (số tiền hay %) KHÔNG tính là "voucher giảm %" của Q4; chỉ giảm phí giao, không quá phí giao, vẫn tính vào N. -->

<!-- Chủ quán 12.11 (Q11–Q14 trạng thái d38def4) — đồng ý cả 4 đề xuất (Q14 sau khi xem demo của chat; N mặc định 3):
     BƯỚC 0 — CHAT ĐÃ LÀM (13.11): máy KHÔNG được gộp main (người gác chặn) → chat gộp main 171109f (có HUY-1) vào nhánh bằng commit
        "GOP-VOUCHER-2 gop main 171109f …": HOP_DONG_API_KH.md giữ v14 của HUY-1 nguyên văn, phần voucher của việc này đổi thành **v15** (PHIEN_BAN 15,
        "phien_ban": 15, "Ghi chú v15", dòng nhật ký v15, hai dòng mã lỗi (v15)); client/dist dựng lại. Chat đã chạy trên bản gộp: thu_HOPDONG_KH 89/89,
        thu_HUY1 59/59, thu_VOUCHER2 80/80, thu_P26c 161/161 xanh; thu_GOI1 đỏ đúng B3c (Q12). Máy: kéo nhánh, chạy lại các bài trên + npm test; số ca
        bài cũ đổi sau gộp thì ghi lại SỐ CA trong bang_chung_do (A16); cổng chạy về sau tính từ commit gộp này. Thấy gì lạ do gộp → câu hỏi, DỪNG.
     Q11 CÓ — thêm 5 bài cũ; chỉ sửa đúng các ca Q2 / Q9 đổi: (a) ca nhận mã hợp lệ → tạo hồ sơ khách SAU lúc in bill rồi mới nhận; (b) P20b dùng mã voucher
        mới trả về (data.voucher_code); (c) "khách quen" giả lập → mong đợi KHACH_DA_CO_TAI_KHOAN. Mỗi ca đổi ghi lý do, đỏ trên gốc; không bỏ / nới phép nào.
     Q12 CÓ — thu_GOI1.js B3c: giữ cho ĐƠN CŨ (cờ đơn cũ, phép "hoàn theo giá đã trả" vẫn canh) + THÊM ca luật mới (mã không giảm gói, hoàn theo 1.350.000).
     Q13 CÓ — M1b / M1c, N4a / N4c trong thu_P26c.js làm đúng cách Q8: đồng ý.
     Q14 CÓ — sửa bản mẫu TRƯỚC (ban_mau_pos.html + DAC_TA.md + bài mới ban_mau_pos/thu/thu_voucher.js; `bash ban_mau_pos/chay_thu.sh` số phép không
        giảm), sửa bằng Edit / Write, không bằng script Python; rồi mới sửa mã thật:
        (1) Bán hàng: chọn khách có voucher → ngay DƯỚI ô mã khuyến mãi hiện hàng chip "🎟 <mo_ta>": bấm chọn, bấm lại bỏ; đủ N thì chip còn lại mờ; chip
            không dùng được → viền đỏ + lý do máy chủ. Giỏ thêm từng dòng "Voucher <MÃ> −x" và "Giảm phí giao −x".
        (2) Bill khách (tờ in quầy + hoá đơn App dongHoaDon.js): dòng "Voucher <MÃ> −x" dưới dòng ưu đãi; có voucher ship thì "Phí giao <gốc>" +
            "Giảm phí giao −x". TEM CỐC và phiếu pha chế KHÔNG đổi.
        (3) Form "Thêm khách mới": ô "Mã trên bill (nếu có)" theo Q9.
        Cần file ngoài Phạm vi → câu hỏi, DỪNG. -->

## Bài thử đỏ
Có — `cong_cu/thu_VOUCHER2.js` ĐỎ trên code gốc: đơn 2 voucher tiền + 1 voucher % → tổng đúng thứ tự; voucher thứ N+1 → từ chối; mã chung + voucher
cùng đơn; voucher % giờ flash → từ chối, voucher tiền vẫn qua; voucher ship chỉ trừ phí giao; đơn có thẻ hạng / nạp / gói → mã chỉ tính phần món
thường; huỷ đơn → mọi voucher về 'available'; hai đơn song song cùng voucher → một đơn; phát từ mẫu → hạn đúng số ngày, gắn đúng khách.

## Ngân sách
~400 dòng máy chủ + ~250 dòng giao diện + ~600 dòng thử. Vượt 1,5 lần thì giải thích trong kế hoạch.
**Phương án đơn giản nhất đã xét:** giữ MỘT hàm tính (tinhUuDai mở rộng nhận danh sách voucher), mẫu voucher dựa trên bảng sẵn có
(pos_reward_catalog / pos_discount_codes) nếu đủ trường; đường phát / dùng / trả voucher mỗi thứ MỘT hàm, quầy và App gọi chung.

## Đổi cấu trúc DB
có — chỉ THÊM (bước `026_voucher.js`): cột / bảng mẫu voucher, nguồn phát, bảng nối đơn ↔ các mã đã dùng (nếu cần); bảng mới vào BACKUP_TABLES.

## Thư viện mới
không

## Soát bảo mật
có — tiền / giảm giá, dùng voucher của người khác, dùng hai lần, đua hai đơn.

## Cấm
Không làm đổi điểm lấy quà hiện vật / phiếu quà (DOI-DIEM-1), giới thiệu bạn bè (GIOI-THIEU-1), thẻ quà (QUA-TANG-1) — chỉ làm sẵn mẫu + hàm phát để
các việc đó gọi. Không sửa đường huỷ đơn ngoài thân traLuotMa (HUY-1 song song). Không đổi luật nạp tiền. Giao diện mẫu voucher đặt trong file MỚI
`client/src/pages/CaiDat/MauVoucher.jsx`; Settings.jsx chỉ thêm vài dòng gắn thẻ (BAO-1b song song sửa Settings.jsx — chỗ đụng ít nhất).
