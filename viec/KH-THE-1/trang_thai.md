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

## Câu hỏi của kế hoạch (đã trả lời)
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

## Soát bảo mật
/soat-bao-mat 09.11 (agent độc lập, chỉ đọc, HEAD f539ff4). Số lỗ hổng trước lọc: 0 · sau lọc: 0 (bước 2 không tìm được gì nên không có bước 3). Báo cáo nguyên văn:

> Mình không tìm thấy lỗ hổng nào trong thay đổi của nhánh viec/KH-THE-1 (a4d89ae^..HEAD, đã bỏ qua client/dist).
>
> Mình chỉ đọc code, không chạy bài thử nào. Kết luận dưới đây dựa trên bản diff và code `server/routes/orders.js` hiện tại.
>
> **Những chỗ đã soát và vì sao không phải lỗi:**
>
> - **Giá thẻ do máy chủ tự tra.** Trong `server/utils/donApp.js`, dòng thẻ ở `docGio` chỉ nhận đúng các khoá `hang_id`, `loai`, `so_luong`, `so_thang` (danh sách `TRUONG_THE`; khoá lạ thì trả 400). `so_luong` chỉ được là 1, và không có trường giá nào lọt qua. Dòng thẻ được chuyển thành `membership_buy {tier_id, so_thang}` của `taoDon` quầy. Ở `server/routes/orders.js:520-548`, máy chủ đọc hạng đang bật, chặn hạng chỉ chủ quán cấp (`HANG_CHI_CAP`), chặn gói chưa bán (`GOI_HANG_KHONG_BAN`), chặn khi khách đã có hạng cao hơn (`DA_CO_HANG_CAO_HON`). Giá lấy từ `goiBanDuoc(membershipTier)`, không lấy từ App. `datDon` còn so lại `tong_da_xem` với tổng máy chủ tính lại.
> - **Khách chỉ mua thẻ cho chính mình.** `thanDon` luôn lấy `customer_phone` và `customer_name` từ khách trong token, không từ thân yêu cầu. Vì vậy sổ thẻ chỉ ghi vào SĐT của người đang đăng nhập.
> - **Không lách được để có hạng Kim Cương.** Hạng chỉ cấp bị chặn ngay trong `taoDon`. Hạng đã tắt (`is_active = 0`) thì trả "không tồn tại".
> - **Bán thẻ mọi giờ và tự "xong".** `gioCanPhaChe` chỉ bỏ kiểm giờ khi giỏ không có món, tức là đúng ý đã duyệt. Trạng thái `'xong'` được ghi sẵn nhưng chỉ có tác dụng khi phiên đã thu tiền. Thanh toán vẫn đi qua `taoPhien` (cần PIN nếu trừ tài khoản, QR thì qua payOS) như trước.
> - **Ô quyền lợi hạng (`PUT /api/pos/tiers`).** Vẫn sau `authenticate` + `checkPermission('manage_promotions')` + `kiemPinChuQuan`. Câu SQL truyền tham số đúng cách, nên không có lỗ chèn lệnh SQL. Dữ liệu được kiểm kiểu, số dòng và độ dài. Khi máy gửi lên không có trường này, `COALESCE` giữ chữ cũ.
> - **`GET /api/kh/hang` thêm `quyen_loi[]`.** Đây là chữ chủ quán nhập, công khai theo ý muốn, không lộ dữ liệu khách. Màn quầy hiện chữ này bằng React, không dùng `dangerouslySetInnerHTML`, nên không có lỗi chèn mã.
> - **Hoá đơn dòng thẻ (`server/utils/dongHoaDon.js`, `dongTheCua`).** Hàm truy vấn theo `o.id` của đơn mà phía gọi đã kiểm là đơn của chính khách. Chỉ trả ra ngày hết hạn.
> - **Hàm `laDongThe`** chỉ nhận dải mã sản phẩm từ -2000000 (không kể) tới -1000000, nên không trùng với dải gói nạp hay gói sản phẩm.
> - **Mã lỗi mới chuyển tiếp cho App** (`HANG_CHI_CAP`, `GOI_HANG_KHONG_BAN`, `DA_CO_HANG_CAO_HON`, `NHIEU_THE`) chỉ nói tên hạng, không lộ thông tin nội bộ hay dữ liệu người khác.
>
> Nhánh này không đụng đến webhook QR hay mã OTP / PIN, nên không có cửa nhận gọi từ ngoài hay mã ngắn mới nào cần soát.

SOÁT BẢO MẬT: ĐẠT

## Câu hỏi
- **Phạm vi phiếu thiếu hai bài cũ** (cổng tĩnh `✗ [A6] file cong_cu/thu_HANG1.js không có trong Phạm vi của phiếu` · `✗ [A6] file cong_cu/thu_KHAPI2.js không có
  trong Phạm vi của phiếu`). Hai bài này khoá ĐÚNG danh sách trường của `GET /api/kh/hang`; phiếu thêm `quyen_loi` nên máy sửa đúng dòng danh sách đó
  (vẫn so BẰNG) theo LUAT §6.7 ("KHÔNG dừng hỏi xin thêm vào Phạm vi") — bản mới đỏ trên gốc, có `SỐ CA`. Cổng đỏ cho tới khi Phạm vi có hai dòng
  `cong_cu/thu_HANG1.js` và `cong_cu/thu_KHAPI2.js`. **Đề xuất:** chat thêm hai dòng này vào `## Phạm vi` của phiếu (máy không tự sửa phiếu). Ngoài ra không còn câu nào.

## Bài học
- **KHOÁ (đã làm, trong Phạm vi):** ca G7 — CÙNG một đơn App, so BẰNG mon[] (trường, thứ tự, tên, tiền, ghi chú) + mon_dau trước và sau khi trả (soát vòng 1
  bắt hai đường trả mon[] lệch nhau); đột biến BV-than-the-cuoi, BV-than-ghi-chu bắt.
- **KHOÁ (đề xuất, ngoài Phạm vi):** `tu_chay/cong.js` A6 hoặc khuôn phiếu — phiếu nào thêm trường vào một cửa `/api/kh` thì chat grep `ĐÚNG [0-9]+ trường`
  trong `cong_cu/thu_*.js` và ghi sẵn mọi bài khoá danh sách trường của cửa đó vào Phạm vi (lần này thiếu thu_HANG1, thu_KHAPI2 → A6 đỏ dù LUAT §6.7 cho sửa).
  Ca đỏ: phiếu KH-THE-1 bản gốc + diff hiện tại → phép mới báo thiếu đúng hai file đó.
- **NGUYÊN TẮC (đề xuất cho KHUON_LOI.md K4, ngoài Phạm vi):** "Mở đường tiền của quầy cho khách tự phục vụ (App) → liệt kê MỌI ưu đãi quầy áp lên dòng mới
  (giảm hạng, Giờ vàng, mã %, mã tiền, điểm) và ghi từng cái vào hợp đồng." Đã gây: KH-THE-1 vòng 1 — hợp đồng im lặng về mã giảm trên giá thẻ.
- **NGUYÊN TẮC (đề xuất cho KHUON_LOI.md K3, ngoài Phạm vi):** "Câu hứa 'giống hệt trước / sau' hoặc ca K5 kế hoạch đã hứa → tra lại theo TÊN trong bài thử
  trước khi báo xong; ca phải phủ cả khách có hạng / Giờ vàng." Đã gây: KH-THE-1 thiếu K5a/K5b (vòng 1), câu "giống hệt" rộng hơn ca G7 (vòng 2).
- **BỎ:** kho mở dạng nông làm thu_BH2 đỏ (git không thấy cbbb809) — xử lý bằng `fetch --unshallow` đúng luật bước 1.3, một lần. Người gác chặn `sed -i`,
  chuyển hướng ra file và lệnh ghép — đã có luật, làm theo (dùng Edit / script Python trong nháp).

## Báo cáo 7 mục
```
VIỆC:        KH-THE-1 — Bán thẻ hạng trên App (chung giỏ), cấp hạng tự động lúc đã thu; hợp đồng /api/kh v13
ĐÃ SỬA:      server/utils/donApp.js — dòng thẻ { loai:'the', hang_id, so_thang } trong giỏ (docGio, danh sách khoá trắng, ≤ 1 thẻ → NHIEU_THE),
               thanDon → membership_buy của taoDon quầy (báo giá + tạo phiên), ghép dòng thẻ theo dải product_id, GIU_MA 3 mã quầy, LY_DO_NGAN thẻ,
               gioCanPhaChe (Q4: giỏ không đồ uống bán mọi giờ — xuất cho KH-NAP-1), tien_trinh_quay 'xong' ghi sẵn (Q3), thân đơn chưa trả cùng hình
               đơn thật, mon[].loai 'the', dsQuay co_the + bỏ dòng thẻ khỏi mon[], băm khoá gửi dòng món y như cũ
             server/utils/membershipStatus.js — laDongThe (dải −1000000..−1999999)
             server/routes/kh/loi.js — NHIEU_THE · server/routes/kh/index.js — GET /hang quyen_loi[]
             server/routes/tiers.js — kiemQuyenLoi (≤ 10 dòng × 120 ký tự), INSERT / UPDATE COALESCE giữ chữ cũ
             server/nang_cap/023_quyen_loi_hang.js — cột quyen_loi (themCot, tự sao lưu)
             server/utils/dongHoaDon.js — hoa_don[] dòng thẻ loai 'the' + "Hạn mới: dd/mm/yyyy" / "không thời hạn"
             client/src/pages/CaiDat/HangThe.jsx — ô Quyền lợi · client/src/pages/DonApp.jsx — nhãn thẻ (đã lên hạng / đơn huỷ) · client/dist build
             HOP_DONG_API_KH.md — v13 (Ghi chú v13, bảng cửa, mã lỗi, máy đọc, nhật ký, ghi bù NAP-1: đơn trả ví vẫn có điểm; đơn nạp hiện trong /don, 0 điểm)
             kiem_tra_truoc_khi_giao.js — một dòng chayBaiThat('cong_cu/thu_KHTHE1.js')
             cong_cu/thu_KHTHE1.js (mới, 73 ca) · cong_cu/thu_KHAPI2.js C1, cong_cu/thu_HANG1.js F1 — thêm quyen_loi vào danh sách trường (LUAT §6.7)
BÀI THỬ:     chạy trên bản chưa vá (da5f5d4) → ĐỎ 44 ca (A2, B1–B13, C1–C3, D, E, F1–F5, G2, H1, GIO1–3, S1, B9b, B12b, K5a, K5b — bang_chung_do.txt);
             sau khi vá → XANH 73/73; thu_KHAPI2 101/101, thu_HANG1 144/144 (bản mới đỏ trên gốc); thu_HOPDONG_KH 88/88;
             npm test -- --day-du 111 đạt · 0 hỏng (dist KHỚP src); đột biến 27/27 BẮT (đối chứng 73/0)
ĐÃ RÀ K4:    grep "than).dong|JSON.parse(r.than)" donApp.js → 4 chỗ (tomTat, chiTietDon, dsQuay + ghi than) — đã xử lý hết; ghép báo giá ↔ items 1 chỗ;
             tien_trinh_quay 5 chỗ (ghi / trả / đọc / lọc / đổi) — đúng; kiểm giờ 1 chỗ (kiemVaBaoGia, gọi 2 lần trong datDon); mon[] trả App 2 đường
             (đơn thật / thân) — cùng hình (G7); grep "ĐÚNG [0-9]+ trường" danh sách /kh/hang → 2 bài (thu_KHAPI2, thu_HANG1) — đã sửa
CHƯA KIỂM:   giao diện thật (ô Quyền lợi, nhãn thẻ ở màn Đơn App — 3 thao tác thử tay dưới); Turso / Render thật (bài chạy libsql file tạm); cổng Tingee
             thật (webhook giả, payOS giả); App KH thật đọc dòng thẻ / quyen_loi; màn hình khách lúc thu hiện dòng thẻ là "Món" (có sẵn — Phát hiện);
             trên gốc mục D / E / G sập giữa chừng nên nhiều ca D/E/G chỉ được chứng minh bằng đột biến chứ chưa hiện ĐỎ riêng; điểm theo dòng (DIEM-MON-1)
             chưa vào main — H1 chỉ so App = quầy với luật điểm hiện tại; cổng A6 đỏ (Câu hỏi trên)
GIT:         (xem dòng git log cuối file sau commit cuối)
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 2 · BỎ 1 — chi tiết ở ## Bài học
```

### Thử tay (chủ quán, trên điện thoại / máy quầy)
1. Cài đặt → Hạng thành viên: gõ 3 dòng quyền lợi cho Vàng, gõ PIN chủ quán, Lưu → tải lại trang, đủ 3 dòng.
2. Màn Đơn App: một đơn App có thẻ + đồ uống hiện dòng tím "🎟️ Thẻ hội viên … — đã lên hạng, không pha", danh sách món không có dòng thẻ; đơn chỉ có thẻ hiện "Xong".
3. In tem đơn đó: chỉ có tem cho đồ uống, không có tem cho thẻ.

### Nghiệm thu — đếm từng mục
- A (một đường bán thẻ; quầy y nguyên — chủ quán đổi: không tách banThe.js): A1, A2/B5–B7 (4 ca quầy = App cùng mã).
- B (hợp đồng v13, dòng thẻ, mã lỗi, khoá gửi, 4xx): B1–B13, B9b, B12, B12b, S3, B11 (đếm bảng).
- C (đồ uống theo hạng ĐANG CÓ): C1, C2, C3.
- D (lên hạng lúc đã thu — ví / QR / ví+QR / tay; trùng → một dòng): D1–D9, I15, Q3 (hai ca).
- E (huỷ / hoàn / xoá thu hồi): E1–E5.
- F (quyen_loi, bước 023): F1–F5.
- G (hoa_don, màn Đơn App, tem, Đối soát): G1, G1b, G2–G7, G5 (tienTheoSo), Q3 màn Đơn App.
- H (điểm cùng hàm quầy): H1.
- K5 (không đổi): K1, K2, K5a, K5b, A1, thu_HOPDONG_KH, thu_KHMUA1 trong npm test.
- Q4 (chủ quán 09.11): GIO1, GIO2, GIO3.

## Cổng (bước 11.4, HEAD 275633a, cây sạch)
- `node tu_chay/cong.js chay . a4d89ae^ HEAD viec/KH-THE-1` → ✓ CỔNG CHẠY ĐẠT, kèm
  `· CẢNH BÁO A16: cong_cu/thu_KHTHE1.js chạy trên gốc in 52 ca ≠ 73 ca ở head — bài dừng sớm trên gốc thì bỏ qua` — đúng trường hợp "dừng sớm": trên gốc
  mục D / E / G sập giữa chừng (bang_chung_do.txt), số ca đủ 73 chỉ có trên code đã vá.
- `node tu_chay/cong.js tinh . a4d89ae^ HEAD viec/KH-THE-1` còn:
  - ✗ [A6] file `cong_cu/thu_HANG1.js` không có trong Phạm vi của phiếu
  - ✗ [A6] file `cong_cu/thu_KHAPI2.js` không có trong Phạm vi của phiếu
  (chờ chat thêm hai dòng vào Phạm vi — xem ## Câu hỏi; A19 do dòng dưới.)
- GIT: `git log --oneline -2` → 275633a KH-THE-1: soat bao mat DAT, cau hoi Pham vi, bai hoc, bao cao 7 muc · e3e2d59 KH-THE-1: sua nhe sau soat vong 2 — …
HEAD ĐÃ KIỂM: 275633a

## Phiên làm tiếp 09.11 — sau khi chat thêm hai bài cũ vào Phạm vi
- Đối chiếu bản chụp: nhánh viec/KH-THE-1 · cây sạch · HEAD f7725e0 = FETCH_HEAD f7725e0 (bằng nhau — không kéo). `git log --oneline -3`:
  - f7725e0 PHIEU: KH-THE-1 Pham vi them thu_HANG1.js + thu_KHAPI2.js (bai khoa truong /kh/hang, chu quan duyet 09.11)
  - 401d28f KH-THE-1: ket qua cong + HEAD DA KIEM
  - 275633a KH-THE-1: soat bao mat DAT, cau hoi Pham vi, bai hoc, bao cao 7 muc
- Câu hỏi Phạm vi (A6) đã được trả lời: phiếu có `cong_cu/thu_HANG1.js`, `cong_cu/thu_KHAPI2.js`. Không đổi code trong phiên này.
- Kho lại mở dạng nông → thu_BH2 đỏ (git không thấy cbbb809) → `git fetch -q --unshallow origin viec/KH-THE-1` đúng luật bước 1.3 (lần 2, cùng nguyên nhân BỎ ở ## Bài học).
- `npm test -- --day-du` → PASS 111 · FAIL 0 · CẢNH BÁO 1 (cảnh báo cũ, không thuộc việc này).
- `node tu_chay/cong.js tinh . a4d89ae^ HEAD viec/KH-THE-1` → ✓ CỔNG TĨNH ĐẠT.
- `node tu_chay/cong.js chay . a4d89ae^ HEAD viec/KH-THE-1` → ✓ CỔNG CHẠY ĐẠT (kèm cảnh báo A16 như trên: bài dừng sớm trên gốc, 52 ≠ 73 ca).
- GIT: `git log --oneline -2` → f7725e0 PHIEU: KH-THE-1 Pham vi them thu_HANG1.js + thu_KHAPI2.js … · 401d28f KH-THE-1: ket qua cong + HEAD DA KIEM
HEAD ĐÃ KIỂM: f7725e0


Chat gộp 09.11: gộp main 4eb31fc (QUAY-UI-1) — chỉ client/dist đụng, dựng lại từ mã nguồn; chủ quán thử tay ô Quyền lợi ĐẠT.
HEAD ĐÃ KIỂM: bf723ee
