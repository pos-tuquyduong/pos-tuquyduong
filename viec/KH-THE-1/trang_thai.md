# KH-THE-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: viec/KH-THE-1 · cây sạch · HEAD a4d89ae = FETCH_HEAD a4d89ae (bằng nhau — không kéo)
- `git log --oneline -3`:
  - a4d89ae PHIEU: KH-THE-1
  - de66463 TIEN-DO: GIAO-DIEN-1, KH-TOMTAT-1, GIAO-1, NAP-1, KHACH-APP-1 xong; mo DIEM-MON-1, KH-THE-1, QUAY-UI-1 + xep hang 5 viec; quyet dinh 07-08.11 — so v58
  - 801e99a Merge pull request #81 from pos-tuquyduong/viec/KHACH-APP-1

## Đối chiếu bản chụp — phiên làm tiếp 09.11 (sau khi chủ quán duyệt kế hoạch)
- Nhánh: viec/KH-THE-1 · cây sạch · HEAD da5f5d4 = FETCH_HEAD da5f5d4 (bằng nhau — không kéo)
- `git log --oneline -3`:
  - da5f5d4 KH-THE-1: ke hoach (cho duyet) + trang thai
  - a4d89ae PHIEU: KH-THE-1
  - de66463 TIEN-DO: GIAO-DIEN-1, KH-TOMTAT-1, GIAO-1, NAP-1, KHACH-APP-1 xong; mo DIEM-MON-1, KH-THE-1, QUAY-UI-1 + xep hang 5 viec; quyet dinh 07-08.11 — so v58
- Kho mở ở dạng nông (`thu_BH2` cần commit cbbb809) → `git fetch -q --unshallow origin viec/KH-THE-1` (chỉ tải thêm lịch sử).

## Chủ quán duyệt kế hoạch (09.11)
(1) Q1 không tách banThe.js — App đi đúng taoDon của quầy. (2) Q2 tiền QR về sau khi đơn App hết hạn → vào ví (luật 05.11), chưa có hạng.
(3) ĐỔI Q3: đơn App chỉ có sản phẩm không pha chế → tự "Xong" ngay lúc ghi đã thu, vẫn hiện ở màn Đơn App, nhãn "đã lên hạng, không pha".
(4) ĐỔI Q4: sản phẩm không pha chế (thẻ hạng, gói nạp, gói trả trước) bán MỌI giờ; giỏ có đồ uống vẫn chặn theo giờ — MỘT hàm "giỏ cần pha chế?"
(`gioCanPhaChe`, donApp.js, xuất ra cho KH-NAP-1). Hợp đồng v13 ghi bù phần NAP-1. Nối thu_KHTHE1.js vào bộ kiểm bằng một dòng chayBaiThat.

## Tiến độ
- 09.11 (làm tiếp) bước 4–6: bài thử `cong_cu/thu_KHTHE1.js` đỏ trên gốc (8 đạt · 40 hỏng) → vá → 67 đạt · 0 hỏng; đột biến 23/23 BẮT;
  `npm test -- --day-du` 111 đạt · 0 hỏng (1 cảnh báo cũ: route GET có lệnh ghi ở packages.js / products.js / sync.js — không thuộc việc này).
  Hai bài cũ khoá đúng danh sách trường /kh/hang (thu_KHAPI2 C1, thu_HANG1 F1 — ngoài Phạm vi) sửa đúng dòng danh sách thêm `quyen_loi`, vẫn so BẰNG
  (LUAT §6.7 — không dừng hỏi); bản mới đỏ trên gốc, ghi SỐ CA (§6.8/6.9).
- 09.11 soát kế hoạch (agent phụ chỉ đọc): bắt 5 điểm — ghép dòng thẻ theo `is_membership_item` không chạy được (kết quả chỉ tính
  không có trường đó, `orders.js:894`), chỉ số `i` lệch khi thẻ giữa giỏ, lý do "hết hàng" nhầm cho hạng bị xoá, `so_mon` đơn thật, màn khách —
  đã sửa vào kế hoạch; thêm ca D8, D9, G6, thử tay 3 thao tác.
- 09.11 bước 1–3 xong: đọc code, viết `ke_hoach.md`. Phiếu là việc [T] (tiền + hạng) — **DỪNG chờ chủ quán duyệt kế hoạch**.

## Câu hỏi
(Q1–Q4 của kế hoạch: chủ quán đã trả lời 09.11 — xem trên. Chưa có câu hỏi mới.)

## Chỗ vá → đột biến (cổng A17, A18)
| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| donApp.js docGio nhận dòng thẻ | BV-the-docgio | B1 |
| donApp.js docGio tối đa một thẻ | VS-the-nhieu | B3 |
| donApp.js docGio so_luong thẻ = 1 | VS-the-so-luong | B4 |
| donApp.js docGio khoá thẻ danh sách trắng | VS-the-khoa-la | S3 |
| donApp.js bamGio dòng thẻ băm riêng | VS-the-bam-bo-the | B10 |
| donApp.js bamGio dòng món y như cũ | VS-the-bam-doi-cu | K1 |
| donApp.js thanDon → membership_buy lúc tạo phiên | BV-the-membership-buy | D1 |
| donApp.js baoGia ghép dòng thẻ theo dải product_id | VS-the-ghep-vi-tri | B1 |
| donApp.js GIU_MA 3 mã thẻ | BV-the-giu-ma | A2 |
| donApp.js SĐT luôn từ token | VS-the-sdt-than | S1 |
| donApp.js LY_DO_NGAN dòng thẻ | VS-the-ly-do-thieu-chu | D8 |
| donApp.js Q3 tien_trinh_quay 'xong' ghi sẵn | BV-tu-xong | Q3 (QR) |
| donApp.js Q3 trả về sau chốt ví | VS-tu-xong-tra-ve | Q3 (ví) |
| donApp.js Q4 bỏ kiểm giờ khi giỏ không pha | BV-gio-moi-gio | GIO1 |
| donApp.js Q4 gioCanPhaChe chỉ đếm dòng món | VS-gio-can-pha-dem-ca-the | GIO1 |
| donApp.js chiTietDon mon[].loai 'the' | BV-chi-tiet-loai | G2 |
| donApp.js dsQuay bỏ dòng thẻ khỏi mon[] | BV-quay-bo-the | G3 |
| dongHoaDon.js dòng hoá đơn loai 'the' | BV-hoa-don-the | G1 |
| dongHoaDon.js ghi chú "Hạn mới" | VS-hoa-don-han-rong | G1 |
| tiers.js giữ quyen_loi khi không gửi | BV-quyen-loi-giu | F3 |
| tiers.js trần 10 dòng | VS-quyen-loi-tran-dong | F4 |
| tiers.js trần 120 ký tự | VS-quyen-loi-tran-ky-tu | F4 |
| kh/index.js GET /hang quyen_loi[] | BV-hang-quyen-loi | F2 |

Tên đột biến: BV-the-docgio, VS-the-nhieu, VS-the-so-luong, VS-the-khoa-la, VS-the-bam-bo-the, VS-the-bam-doi-cu, BV-the-membership-buy,
VS-the-ghep-vi-tri, BV-the-giu-ma, VS-the-sdt-than, VS-the-ly-do-thieu-chu, BV-tu-xong, VS-tu-xong-tra-ve, BV-gio-moi-gio,
VS-gio-can-pha-dem-ca-the, BV-chi-tiet-loai, BV-quay-bo-the, BV-hoa-don-the, VS-hoa-don-han-rong, BV-quyen-loi-giu, VS-quyen-loi-tran-dong,
VS-quyen-loi-tran-ky-tu, BV-hang-quyen-loi.

## Soát độc lập — vòng 1 (09.11, /ra-soat, agent độc lập, HEAD ea7ff47) — nguyên văn
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
1. server/utils/uuDai.js:25-31 + server/routes/orders.js:765-770 (dong = MỌI orderItems, có cả dòng thẻ) + HOP_DONG_API_KH.md:54 — mã giảm KIỂU % (và mã tiền) tính trên tamTinh CÓ giá thẻ.
   App nay cho khách TỰ gửi ma_giam cùng dòng thẻ (donApp.js thanDon chuyển discount_code + membership_buy). Ví dụ: giỏ chỉ có thẻ Vàng 12 tháng + mã 10% → máy chủ giảm 10% giá thẻ.
   Hợp đồng chỉ ghi "Không giảm hạng / Giờ vàng cho dòng thẻ", không nói gì về mã → App KH sẽ hiểu sai. B12 chỉ thử mã TIỀN 5.000 và so bằng với quầy, không có ca mã %.
   QUYET_DINH_CHU_QUAN.md (đợt 07–08.11, dòng 193-207) không có câu nào về mã giảm trên thẻ.
   → chuyện tiền chưa chốt, phải hỏi chủ quán (CLAUDE.md §9 "không tự quyết"). Khuôn K1 (hợp đồng im lặng) + K4 (đường tiền quầy mở thêm cho khách tự phục vụ).
2. cong_cu/thu_KHTHE1.js — mục K5 thiếu ca kế hoạch đã hứa (grep "tinhHang|hết hạn" chỉ ra D7, E2):
   - "luật giảm hạng: khách Kim Cương hết hạn còn Vàng → Vàng"
   - luồng K5 số 4 "khách Vàng hết hạn mua lại Vàng"
   Mục [K5] chỉ chạy K1, K2. Khuôn K5/K3.
3. server/utils/donApp.js:392 — GET /don/:ma của đơn CHƯA trả: dòng thẻ trong than không có ghi_chu → ghi_chu: undefined → mất hẳn khỏi JSON.
   Đơn đã trả có ghi_chu: null. Hợp đồng v13 hứa mon[] luôn có ghi_chu. Hai đường trả mon[] lệch trường. Khuôn K4.
4. server/utils/donApp.js:337 so với :356 (tomTatDonThat lấy dòng đầu theo oi.id) — mon_dau và thứ tự mon[] đổi khi đơn chuyển từ chưa trả sang đã trả:
   - chưa trả: theo thứ tự App gửi, thẻ đứng đầu được, tên "Thẻ Vàng · 1 tháng"
   - đã trả: taoDon đẩy thẻ SAU món (orders.js:515-547), tên "🎟️ Thẻ hội viên …"
   G6 chỉ khoá so_mon, không khoá mon_dau. Khuôn K4 (cùng việc "so_mon/mon_dau hai đường cùng cách" mà kế hoạch đã hứa).
5. server/utils/dongHoaDon.js:31-32 — expires_at = HAN_VO_HAN ('9999-12-31…') bị in thành "Hạn mới: 31/12/9999".
   Trái luật ghi ở membershipStatus.js:18 "mọi chỗ trả ra đổi thành null" (membership.js:44 có đổi). Xảy ra khi hạng chi_cap có khách được cấp vô hạn rồi chuyển sang 'ban' (chủ quán định làm, QUYET 08.11) và khách mua gia hạn. Hiếm. Khuôn K4.
6. HOP_DONG_API_KH.md:4-5 — NGAY vẫn 2026-11-07; DOC_TU_CODE chưa thêm KH-THE-1 dù PHIEN_BAN đã lên 13. Khuôn K4 (tài liệu).

NGHI NGỜ:
- K3: trên gốc, mục D / E / G sập giữa chừng (bang_chung_do.txt: "Cannot read … ma_payos"); E1–E3 đỏ vì 404 chứ không vì đúng câu kết luận.
  Nhiều ca chưa bao giờ hiện ĐỎ riêng trên gốc: D3–D9, E4, E5, G1, G3–G6, I15. Phần lớn là "không sửa code, chỉ khoá" nên chấp nhận được, nhưng chỉ có đột biến chứng minh giá trị của G1, G3, Q3, D8.
- docGio: các nhánh hang_id chữ / so_thang 0 / loai lạ / thiếu hang_id không có đột biến riêng. B4 gộp 6 ca vào một k() và xanh cả trên gốc.
- bamGio (donApp.js:60) băm so_luong THÔ của dòng thẻ: gửi lại cùng khoa_gui mà bỏ hay thêm so_luong:1 → 409 KHOA_GUI_DA_DUNG, trong khi docGio coi hai dạng là như nhau. Nhẹ.
- donApp.js:262 `the.name` — câu đọc tên hạng không lọc is_active; xoá là xoá mềm nên không null. An toàn hiện nay.
- gioCanPhaChe = gio.mon.length > 0 nghĩa là "mọi món /menu cần pha", trong khi hợp đồng và chú thích ghi "đồ uống". Nếu /menu có hàng đóng gói không pha thì chữ "đồ uống" sai. Chưa đọc /menu thật.
- manKhach.js:132-135: dòng thẻ hiện tên "Món" (tra pos_products theo product_id âm). Kế hoạch ghi "hiện đúng dòng thẻ", không đúng. Lỗi này có sẵn từ quầy, ngoài việc này → nên ghi Phát hiện.
- dongTheCua đọc lại pos_order_items, trùng với hoaDon.js:102. Kế hoạch định thêm la_the vào hd.mon (1 dòng). Ghép theo vị trí giữa hai câu đọc riêng: đúng nhờ cùng ORDER BY id và hoaDon.js:234 map 1–1, nhưng dễ vỡ. Đơn giản hơn là đánh dấu ngay tại hoaDon.js.

NGHIỆM THU: 8/9 mục có bằng chứng · mục thiếu: K5 (một phần — thiếu ca luật giảm hạng và ca "Vàng hết hạn mua lại Vàng")
  A: A1 quầy + A2/B5–B7 (4 ca cùng mã lỗi quầy ↔ App); phần "tách banThe.js" chủ quán đã đổi (Q1).
  B: B1–B13, S3.  C: C1, C2, C3.  D: D1–D9, Q3, I15.  E: E1–E5.  F: F1–F5; ô nhập ở HangThe.jsx chỉ thử tay.
  G: G1–G6, G5 Đối soát.  H: H1 so điểm App ↔ quầy (cờ theo dòng là việc DIEM-MON-1, chưa vào main).
  K5: K1, K2, A1, E5, thu_HOPDONG_KH; thiếu ca luật giảm hạng.
Các mục soát khác:
  K4: grep đủ; mọi chỗ đọc than.dong (donApp.js:263, 336, 392, 429) đã xử lý — trừ ghi_chu ở 392 và mon_dau ở 337.
    Ghép báo giá ↔ items: 1 chỗ (189-191), chuanLoi dùng mảng món riêng nên đúng. tien_trinh_quay: 7 chỗ — đúng. Kiểm giờ: 1 chỗ (207), cửa /gio-hoat-dong không đổi.
  K5 các luồng hợp lệ: giỏ cũ, khoá gửi cũ (K1 băm y gốc), quầy bán thẻ, gia hạn cùng hạng, đơn có đồ uống (Q3 '' giữ nguyên, K2), doiTienTrinh — không thấy luồng nào bị chặn oan.
  Đường tiền: giá thẻ, SĐT, so_luong đều do máy chủ quyết (S1, S3; orders.js:520-547).
  P1: `--day-du` "dist đã commit KHỚP với src hiện tại".  Đối soát: dùng lại I15 + tienTheoSo, không cần quy tắc mới.

CHƯA SOÁT ĐƯỢC:
- Giao diện thật: ô quyền lợi ở HangThe.jsx, nhãn 🎟️ ở DonApp.jsx; chuông không kêu với đơn chỉ có thẻ (DonAppNoi.jsx:64 chỉ kêu khi da_tra/vao_vi) — chủ quán cần thử tay.
- Turso thật / Render (bài chạy libsql file tạm). Tingee thật (dùng webhook giả). App KH thật xử lý mon[] thiếu ghi_chu thế nào.
- Chưa tự chạy lại dot_bien.py: chỉ đọc mã đột biến, tin số 23/23 trong bang_chung_do.txt. Chưa chạy lại bằng chứng gốc (--goc da5f5d4).

BÀI HỌC:
- NGUYÊN TẮC: mở đường tiền quầy cho khách tự phục vụ (App) → liệt kê MỌI ưu đãi quầy áp lên dòng mới (hạng, Giờ vàng, MÃ %, mã tiền, điểm) và ghi rõ từng cái vào hợp đồng. Hợp đồng im lặng về một ưu đãi = K1.
- KHOÁ: hai đường trả cùng một mảng cho App (đơn chưa trả từ than ↔ đơn thật từ pos_order_items) → bài thử so BẰNG danh sách khoá + thứ tự + mon_dau giữa hai trạng thái của CÙNG một đơn, không chỉ so_mon.
- NGUYÊN TẮC: ca K5 kế hoạch đã hứa phải tra lại theo tên trong bài thử trước khi báo xong (kế hoạch hứa K5 luật giảm hạng, bài thử không có).
```

### Phiên chính xử lý vòng 1
- Lỗi 1 KHÔNG phải câu hỏi mới: kế hoạch chủ quán duyệt 09.11 mục "Luồng hợp lệ" 6 ghi "Đơn thẻ + mã giảm hợp lệ — đi như quầy (mã áp theo luật mã hiện
  có, không viết luật mới)" — và đơn App phải đi đúng đường quầy (LUAT §5). Sửa: hợp đồng ghi rõ mã giảm áp như quầy (tính trên tạm tính gồm giá thẻ),
  thêm ca B12b mã % (App = quầy). Muốn mã KHÔNG áp lên thẻ là đổi luật mã của CẢ quầy → việc khác, chủ quán quyết (ghi Phát hiện).
- Lỗi 2–6 + nghi ngờ bamGio: sửa trong vòng này (ca thử đỏ trước). manKhach.js → Phát hiện (ngoài Phạm vi). dongTheCua ghép vị trí: giữ (hoaDon.js map 1–1,
  cùng ORDER BY id; thêm trường vào hd.mon dễ làm đỏ bài khoá trường của hoá đơn quầy) — ghi lý do.

### Vòng sửa 1 — đã làm (HEAD 3da7ac5)
- Ca mới đỏ trước (e21984a: 67 đạt · 6 hỏng) → vá → 73 đạt · 0 hỏng. `npm test -- --day-du` 111 đạt · 0 hỏng (dist KHỚP src).
- Lỗi 1: hợp đồng v13 ghi rõ mã giảm áp như quầy (tính trên tạm tính gồm giá thẻ) + ca B12b (mã 10% trên giỏ chỉ thẻ: App = quầy = 225.000).
- Lỗi 2: ca K5a (Kim Cương cấp có hạn đã hết → Vàng, không chặn mua Vàng), K5b (Vàng hết hạn mua lại Vàng trên App).
- Lỗi 3 + 4: thân đơn chưa trả = cùng hình đơn thật — dòng thẻ xếp sau món, tên như dòng hàng taoDon ("🎟️ Thẻ hội viên … · n tháng"), ghi_chu null;
  ca G2 (đủ trường) + G7 (mon[] và mon_dau giống hệt trước / sau khi trả). Nhãn màn Đơn App bỏ 🎟️ thừa (tên đã có).
- Lỗi 5: hoá đơn hạn không thời hạn → "Hạn mới: không thời hạn" (ca G1b). Lỗi 6: hợp đồng NGAY 2026-11-09, DOC_TU_CODE thêm KH-THE-1 / tiers.js / 023.
- Nghi ngờ bamGio: dòng thẻ băm so_luong bỏ trống = 1 (ca B9b). Nghi ngờ ghép vị trí ở dongHoaDon: giữ — hoaDon.js map 1–1 cùng ORDER BY id; thêm trường
  vào hd.mon sẽ đụng hoá đơn quầy (ngoài mục tiêu). Nghi ngờ gioCanPhaChe "mọi món /menu cần pha": đúng theo lời chủ quán 09.11 (giỏ có đồ uống = có
  món /menu); hàng đóng gói không pha trên /menu (nếu có sau này) là việc khác.
- Đột biến thêm: BV-hoa-don-vo-han (G1b), VS-bam-so-luong-tho (B9b), BV-than-the-cuoi (G7), BV-than-ghi-chu (G2); neo VS-hoa-don-han-rong đổi theo dòng mới.
  Tổng 27/27 BẮT.

## Phát hiện
- `server/utils/manKhach.js:132-135` (màn hình khách lúc thu): dòng thẻ / gói tra tên theo pos_products bằng product_id âm → hiện chữ "Món" thay vì tên
  thẻ. Có sẵn từ quầy (bán thẻ ở quầy cũng vậy), ngoài Phạm vi — không sửa.
- Mã giảm % / mã tiền áp lên cả giá thẻ (uuDai.js tính trên mọi dòng hàng) — ở quầy và App như nhau. Muốn mã KHÔNG giảm giá thẻ là đổi luật mã của quầy →
  chủ quán quyết, việc riêng.
- Đơn App chỉ có thẻ tới màn Đơn App ở trạng thái "xong" nên KHÔNG kêu chuông (DonAppNoi.jsx:64 chỉ kêu khi da_tra / vao_vi) — đúng ý "không pha";
  chủ quán muốn chuông cho đơn thẻ thì báo.

## Soát độc lập — vòng 2 (09.11, /ra-soat, agent độc lập, HEAD a8294af) — nguyên văn
```
ĐẠT (còn 4 lỗi NHẸ, không có lỗi NẶNG)

Kiểm từng lỗi vòng 1: 1 đúng căn cứ (ke_hoach.md "Luồng hợp lệ" 6; luật mã orders.js:765-770 chạy trên mọi dòng hàng; giảm hạng bỏ dòng thẻ orders.js:708;
Giờ vàng chỉ món flash orders.js:580-586; QUYET_DINH 07–08.11 dòng 196-200 không trái) · 2 K5a, K5b (thu_KHTHE1.js:410-425) · 3 ghi_chu null (donApp.js:266;
G2 thu_KHTHE1.js:335-337) · 4 thân chưa trả xếp thẻ sau món, tên như taoDon (donApp.js:265-267, orders.js:539; G7; BV-than-the-cuoi BẮT) · 5 "Hạn mới: không
thời hạn" (G1b; BV-hoa-don-vo-han BẮT) · 6 NGAY 2026-11-09, DOC_TU_CODE thêm KH-THE-1, tiers.js, 023 · bamGio so_luong bỏ trống = 1 (B9b; VS-bam-so-luong-tho BẮT).

LỖI TÌM ĐƯỢC:
- HOP_DONG_API_KH.md:68 — hợp đồng hứa mon[] "giống hệt trước và sau khi trả", nhưng don_gia hai đường khác nhau (chưa trả: it.unit_price donApp.js:196-197;
  đã trả: flash_unit_price || tier_unit_price || unit_price donApp.js:394). Ca G7 chỉ thử khách chưa hạng. Lệch có từ trước, câu hứa là mới — K1 / K3 — NHẸ.
- client/src/pages/DonApp.jsx:75 — nhãn "{co_the} — đã lên hạng, không pha" hiện cả khi đơn đã huỷ / hoàn (dsQuay trả đơn huỷ trong ngày donApp.js:426;
  co_the lấy từ thân đơn donApp.js:434) — K4 — NHẸ.
- server/utils/dongHoaDon.js:357-358 — chú thích "cộng nối từ đó ra số năm > 9999" sai, vế !/^\d{4}-\d\d-\d\d/ là code chết (hanCacHang membershipStatus.js:48
  giữ nguyên HAN_VO_HAN) — K1 — NHẸ.
- viec/KH-THE-1/trang_thai.md — chưa ghi kết quả node tu_chay/cong.js chay (LUAT §6.3) — NHẸ.

NGHI NGỜ:
- docGio (donApp.js:104): dòng có khoá `loai` khác 'the' đều 400, kể cả `loai: null` / 'mon' trên một ly — siết mới; nên ghi hợp đồng "dòng món KHÔNG có loai".
- K5a thử "Kim Cương hết hạn rồi mới mua Vàng", kế hoạch hứa "Kim Cương hết hạn trong khi còn Vàng" — yếu hơn lời hứa; luật hạng không đổi trong việc này.
- Trên gốc mục D / E / G sập giữa chừng; D3–D9, E4, E5, G1, G3–G6, I15 chưa hiện ĐỎ riêng; một số do đột biến chứng minh. Chấp nhận được.
- donApp.js:262/266: hạng xoá CỨNG giữa báo giá và ghi thân → the.name ném → 500. Hạng chỉ xoá mềm nên hiện không xảy ra.
- baoGia: mã sai + thẻ không bán được → App nhận lỗi của mã thay vì HANG_CHI_CAP. Cùng khuôn dòng món, có từ trước.

NGHIỆM THU: 9/9 mục có bằng chứng · mục thiếu: không có
  A: A1 + A2/B5–B7 · B: B1–B13, B9b, B12, B12b, S3 · C: C1–C3 · D: D1–D9, Q3, I15 · E: E1–E5 · F: F1–F5 (ô nhập HangThe.jsx chỉ thử tay)
  G: G1, G1b, G2–G7, G5 · H: H1 · K5: K1, K2, K5a, K5b, A1, thu_HOPDONG_KH 88/0.
Mục soát: K3 đỏ trên gốc 8/44, 4 đột biến mới BẮT, đối chứng 73/0 · K4 5 chỗ đọc than, ghép 1 chỗ, tien_trinh_quay 5 chỗ đúng, giờ 1 chỗ, mon[] 2 đường
(lệch don_gia), hoa_don 1–1 · K5 không chặn oan (nghi ngờ `loai` trên dòng món) · Tiền: giá thẻ máy chủ, SĐT token, TRUONG_THE · P1 bundle index-CkERXsz6.js có
chữ mới; --day-du của người soát chưa xong · Đơn giản: dùng lại taoDon, ~100 dòng máy chủ, đối soát dùng lại tienTheoSo.

CHƯA SOÁT ĐƯỢC: --day-du chưa ra kết quả trước lúc nộp; không chạy lại đủ 27 đột biến / --goc; chưa chạy cổng tu_chay/cong.js; giao diện thật, Turso / Render,
Tingee thật, App KH thật.

BÀI HỌC:
- NGUYÊN TẮC: câu hứa "giống hệt trước / sau" trong hợp đồng phải khoá bằng ca phủ cả khách có hạng và đơn dính Giờ vàng.
- KHOÁ: nhãn trạng thái ở quầy ("đã lên hạng") phải lấy từ trạng thái đơn (tien_trinh), không chỉ thân đơn đã lưu.
```

### Sửa nhẹ sau vòng 2 (chỉ đúng các lỗi lần soát nêu — HEAD e3e2d59)
- Hợp đồng: câu "giống hệt" thu hẹp đúng sự thật (thứ tự, ten, so_luong, ghi_chu, loai, mon_dau giống; don_gia như từ v5: chưa trả giá gốc, đã trả giá đã giảm);
  thêm "dòng MÓN không gửi khoá `loai`".
- DonApp.jsx: đơn có thẻ đã huỷ → "đơn đã huỷ, thẻ đã thu hồi" (giao diện — thử tay). dongHoaDon.js: bỏ vế code chết, chú thích đúng (voHan = han === HAN_VO_HAN).
- Chạy lại: thu_KHTHE1 73/0 · `npm test -- --day-du` 111/0 (dist KHỚP src) · đột biến 27/27 BẮT. Cổng chạy ghi ở bước 11.4.
