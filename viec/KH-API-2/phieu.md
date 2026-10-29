# KH-API-2 — Cửa App KH (chỉ đọc) + giờ hoạt động + hợp đồng `/api/kh` v2 + bài thử hợp đồng

<!-- Phiếu do chat soạn 29.10.2026. Việc [T] (chạm vùng giá hạng của orders.js + cửa cho khách) — Opus, lập kế hoạch, dừng chờ duyệt.
     Nền: main sau sổ v45. Làn Opus 1: chạy NGAY (UUDAI-1 đã gộp 0a543cf), xong mới tới COMBO-1a (cùng vùng giá hạng orders.js).
     Đọc TRƯỚC: HOP_DONG_API_KH.md (v1 — nguồn duy nhất của cổng /api/kh), QUYET_DINH_CHU_QUAN.md (giờ VN, giờ hoạt động, quầy không chặn),
     LUAT_XAY_APP.md §2 (luật cổng = hợp đồng, giờ = giờ Việt Nam).
     App KH ở kho riêng tuquyduong/APP-KH (chat App KH) — việc này KHÔNG đụng app, chỉ mở / sửa cửa phía POS và hợp đồng.
     Hiện trạng chat đọc 29.10 (main feda0b0): % hạng từng món quyết ở orders.js ~645–668 (đọc pos_membership_tiers.discount_percent /
     special_discount_percent theo it.is_special_group, kẹp 0–90) rồi tinhUuDai (server/utils/uuDai.js) tính giá; giờ vàng = flash sale,
     server/utils/flashState.js readFlashState (KHÔNG có đếm suất); hồ sơ /toi ở server/routes/kh/index.js ~71–86; nhan-ma-bill /
     nhan-diem gọi hàm quầy trong server/routes/signup-codes.js — catch trả 500 { error: err.message } KHÔNG có code; lời MA_HET_HAN
     viết cứng "24 giờ". Cài đặt lưu ở pos_settings qua server/routes/settings.js. -->

**Đã duyệt (chủ quán 29.10, sau khi chat soát `ke_hoach.md` đầu nhánh `9da2e9e`):** kế hoạch duyệt nguyên (cả phần soát của agent phụ); bài
thử ~500 dòng chấp nhận (giữ phép quét mã lỗi). Máy làm tiếp từ bước 4 (`/lam-viec KH-API-2 tiep`) tới hết, không dừng hỏi lại các điểm này:
1. Q1 = **(a)**: hạn mã ưu đãi khách mới — cả phép SO lẫn lời báo đều lấy số giờ từ cài đặt hạn mã (bill hứa bao nhiêu giờ thì máy cho đúng
   bấy nhiêu). Đây là sửa lỗi có chủ quán duyệt: được đổi hành vi đường quầy ĐÚNG chỗ này (thay câu "Đường quầy giữ nguyên" của mục G cho
   riêng điểm này); thêm ca: cài 48 giờ → giờ thứ 30 nhận được, giờ thứ 49 bị từ chối, lời báo ghi "48 giờ".
2. Q2 = đồng ý: `so_du_vi` = số dư KHẢ DỤNG của ví riêng khách (số dư − tiền đang giữ cho phiên thanh toán chưa xong), đúng số quầy hiện;
   KHÔNG cộng ví mẹ / ví gia đình (làm sau).
3. Q3 = **thêm trường riêng**: `dang_mo` = quán đang mở THẬT theo giờ hoạt động; thêm `nhan_don` = còn nhận đơn App (đã trừ "ngừng nhận đơn
   trước giờ đóng N phút"); `hom_nay.dong` = giờ đóng thật. Hàm thuần trả cả hai; KH-MUA-1 sau này chặn theo `nhan_don`. Ghi vào hợp đồng v2.
4. Phát hiện `tier_round_to` không dùng, giờ UTC ở PUT /settings, 3 cách xét giờ vàng, 2 cách đọc giờ hạn mã: KHÔNG sửa ở việc này (chat ghi sổ).

## Mục tiêu
App KH mới (đợt 1, trước khai trương 07.11) đọc được đủ số thật từ POS: hạng + số dư ví của khách, danh sách hạng, giờ vàng hôm nay, giá
từng hạng của từng món (tính CÙNG cách với quầy), và giờ hoạt động của quán. Hợp đồng `HOP_DONG_API_KH.md` lên v2 cùng PR; có bài thử
canh hợp đồng khớp code từ nay về sau.

## Nghiệm thu
- A **Một hàm % hạng:** tách đoạn quyết % hạng từng món ở `orders.js` thành hàm thuần `server/utils/giaHang.js` (`tiLeHangMon(hang,
  laNhomDacBiet)` → % đã kẹp 0–90; + hàm giá hạng một món dùng ĐÚNG phép làm tròn của `tinhUuDai`). `orders.js` gọi lại hàm này — KHÔNG đổi
  hành vi: mọi bài thử tiền cũ (thu_UUDAI1, thu_P26c, thu_gia_lap…) xanh nguyên, không sửa ca cũ.
- B **`GET /api/kh/toi`** thêm `hang` (`{ id, ten, phan_tram, phan_tram_nhom_dac_biet, het_han }` hoặc `null` khi chưa có / hết hạng) và
  `so_du_vi` (số nguyên đồng, đọc đúng hàm số dư mà quầy dùng). Trường cũ giữ nguyên.
- C **`GET /api/kh/hang`** (không cần token): danh sách hạng đang bật `[{ id, ten, phan_tram, phan_tram_nhom_dac_biet, gia_the, thu_tu }]`.
- D **`GET /api/kh/gio-vang`** (không cần token): `{ dang_chay, bat_dau, ket_thuc, phan_tram, mon: [mã món] }` đọc qua `readFlashState`;
  tắt → `dang_chay: false`. Không có "suất còn" (POS không đếm) — hợp đồng ghi rõ.
- E **`GET /api/kh/menu`** mỗi món thêm `gia_hang: [{ hang_id, gia }]` tính bằng hàm ở A (món nhóm đặc biệt dùng % riêng; món giá 0 /
  `null` → `gia_hang: []`). Không đổi trường cũ.
- F **Giờ hoạt động (chủ quán chốt 28.10):** Cài đặt POS → mục "Giờ hoạt động": mỗi thứ trong tuần giờ mở – giờ đóng hoặc nghỉ cả ngày;
  ngày nghỉ đặc biệt (ngày + lý do); câu thông báo ngoài giờ (sửa được, có chữ tự điền giờ mở lại); "ngừng nhận đơn App trước giờ đóng
  N phút" (mặc định 0). Hàm thuần `dangMo(bayGio, caiDat)` ở MỘT file (KH-MUA-1 sau này gọi lại để chặn đơn `NGOAI_GIO_HOAT_DONG`).
  `GET /api/kh/gio-hoat-dong` (không cần token) → `{ bay_gio, dang_mo, hom_nay: { mo, dong } | null, mo_lai_luc | null, thong_bao,
  lich_tuan: [{ thu, mo, dong, nghi }], ngay_nghi: [{ ngay, ly_do }] }`; `thu` 2–7 = Thứ Hai–Thứ Bảy, 8 = Chủ nhật; mọi giờ là giờ VN
  (`getNow`), dạng `YYYY-MM-DDTHH:mm:ss`. Quầy KHÔNG bị chặn. Chưa cài gì → coi như mở cả ngày, `thong_bao` rỗng.
- G **Sửa lỗi đã biết của hợp đồng v1:** `nhan-ma-bill` / `nhan-diem` gọi qua `/api/kh` khi lỗi máy bất ngờ trả 500
  `{ error: <lời chung>, code: 'LOI_MAY_CHU' }` (không lộ lời máy); lời `MA_HET_HAN` lấy số giờ từ cài đặt hạn mã. Đường quầy giữ nguyên.
- H **Hợp đồng v2:** sửa `HOP_DONG_API_KH.md` cùng PR — thêm 4 cửa + trường mới (phần chữ VÀ khối `HOP_DONG_MAY_DOC`), mã lỗi mới, `PHIEN_BAN`
  2, một dòng nhật ký; bỏ dòng "Lỗi đã biết" đã sửa ở G.
- I **Bài thử hợp đồng `cong_cu/thu_HOPDONG_KH.js`:** đọc khối `HOP_DONG_MAY_DOC`, gọi TỪNG cửa trên kho thử (khách mẫu có hạng + ví +
  điểm): đủ cửa, mỗi cửa trả đủ trường hợp đồng ghi, mọi mã lỗi trả về nằm trong `ma_loi`; quét `server/routes/kh/index.js` — route dưới
  `/api/kh` không có trong hợp đồng → ĐỎ (trừ `routes/kh/quay.js` gắn ở `/api/pos/kh`). Ghép vào `npm test` / `--day-du`.
- J **K5:** quầy bán, giá hạng, mã giảm, giờ vàng, nhận điểm ở quầy chạy y như cũ; App KH v1 (cửa cũ) không vỡ.

## Phạm vi
- viec/KH-API-2/**
- server/utils/giaHang.js
- server/utils/gioHoatDong.js
- server/routes/orders.js
- server/routes/kh/index.js
- server/routes/kh/loi.js
- server/routes/signup-codes.js
- server/routes/settings.js
- server/database.js
- client/src/pages/Settings.jsx
- client/src/pages/CaiDat/**
- client/dist/**
- HOP_DONG_API_KH.md
- cong_cu/thu_KHAPI2.js
- cong_cu/thu_HOPDONG_KH.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_KHAPI2.js` (A–G) và `cong_cu/thu_HOPDONG_KH.js` (I) ĐỎ trên code gốc. Riêng A: ca "giá hạng ở `/menu` = giá hạng quầy
tính cho cùng món, cùng khách" với món thường + món nhóm đặc biệt + % lẻ (làm tròn). F: ca nửa đêm, ngày nghỉ, nghỉ cả ngày, "ngừng trước
giờ đóng", máy chủ chạy UTC (đặt `TZ=UTC` khi chạy ca) mà kết quả vẫn theo giờ VN.

## Ngân sách
~350 dòng máy chủ + ~200 dòng giao diện Cài đặt + ~450 dòng thử. `orders.js`: chỉ thay đoạn quyết % bằng lời gọi hàm (≤ 15 dòng đổi).
`kiem_tra_truoc_khi_giao.js`: thêm dòng chạy bài (giữ `thu_P3.js` đứng cuối như các việc trước).
**Phương án đơn giản nhất đã xét:** để App tự tính giá hạng từ % — không chọn: luật "một quy tắc một hàm", giá App phải khớp quầy.

## Đổi cấu trúc DB
không (giờ hoạt động lưu ở `pos_settings`, seed khoá mặc định ở `database.js`)

## Thư viện mới
không

## Cấm
- KHÔNG đổi hành vi tính tiền / điểm / ví ở quầy; KHÔNG sửa `server/utils/uuDai.js`, `thanh-toan.js`, `wallets.js`, `loyalty.js`, `server/kho/**`,
  `client/src/pages/Sales.jsx`, `client/src/pages/BanHang/**`, `app_kh/**`.
- KHÔNG làm đặt đơn trên App (KH-MUA-1), topping theo món (TOPPING-1), thêm ô hồ sơ (KH-HOSO-1), đánh giá Google (DG-GOOGLE-1), sửa giờ cũ
  lưu UTC (GIO-VN-1).
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/KH-API-2`. Không đụng main, không merge,
  không tạo PR.
