# GIAO-4 — trạng thái

## Đối chiếu bản chụp (bước 1)
- nhánh: viec/GIAO-4 · cây sạch · HEAD 5563576 · FETCH_HEAD 5563576 (bằng nhau, không kéo)
- git log --oneline -3:
  - 5563576 PHIEU: GIAO-4 chan phi Ahamove 0d, quay tinh phi lai — chat ban 41
  - 7da9ba9 Merge pull request #102 from pos-tuquyduong/viec/KHO-3a
  - 0335fee KHO-3a: cong chay DAT, HEAD DA KIEM fab40374

## Tiến độ
- 26.11: bước 2 đọc xong, bước 3 viết `ke_hoach.md`, agent phụ soát 4 câu (kết quả ở ke_hoach.md mục 5c).
- 26.11: hook dừng báo `thu_BH2.js` đỏ (G1: `fatal: bad revision 'cbbb809..HEAD'`) — kho nông, không phải lỗi code. Chạy
  `git fetch -q --unshallow origin viec/GIAO-4` (chỉ tải lịch sử) → `npm test`: PASS 125 · FAIL 0 · CẢNH BÁO 1.
- DỪNG ở bước 3 — phiếu "Chờ duyệt kế hoạch".
- 26.11: chủ quán duyệt kế hoạch (chat đã soát; T5 giữ: total_price 0 thì CHẶN dù total_fee > 0). Chat ghép main → nhánh ở 8ac5ae5a (hook mở
  phiên đã kéo d944527f → 8ac5ae5a, HEAD = FETCH_HEAD = 8ac5ae5a). Làm tiếp từ bước 4.
- Bước 4: thu_GIAO4.js (8a4d71ea) đỏ trên gốc 17/24; thu_GIAO3.js sửa C3 (efe39b50) đỏ trên gốc 1/47; bản GỐC thu_GIAO3 đỏ trên code đã vá →
  bài sửa thường. Bằng chứng: bang_chung_do.txt.
- Bước 5: vá e93e41f6 (giaoHang.js +8, ahamove.js +2/−1, kiem_tra_truoc_khi_giao.js +1 dòng chayBaiThat). GIAO-4 24/24, GIAO-3 47/47.
- Bước 6: `npm test -- --day-du` PASS 132 · FAIL 0 · CẢNH BÁO 1 (packages.js:196 route GET có lệnh ghi — có từ trước, ngoài phạm vi).
- Đột biến `python3 viec/GIAO-4/dot_bien.py`: ĐỐI CHỨNG XANH 24/0 · TỔNG 10 · BẮT 10 · SỐNG 0 · HỎNG 0 · LẠC 0.

## Chỗ vá → đột biến
| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| giaoHang.js `phiHopLe` (> 0) | VS-phi-0-lot · VS-phi-am-lot · VS-chan-ca-1d | T1 · T2 · K1 |
| giaoHang.js khối chặn trong `taoBaoPhi` | BV-bo-chan-phi-0 · VS-chan-sau-ghi · VS-chan-o-aha · VS-ma-loi-cu | T1 · T1 (không ghi dòng) · K6 · T1 |
| giaoHang.js dòng log `[GIAO] phi_0` | BV-bo-log-phi-0 | T6 |
| ahamove.js `phi_tho` | BV-phi-tho | T6 |
| ahamove.js `total_price ?? total_fee` (khoá T5, chủ quán 26.11) | VS-total-fee-thay | T5 |

Tên đột biến: VS-phi-0-lot, VS-phi-am-lot, VS-chan-ca-1d, BV-bo-chan-phi-0, VS-chan-sau-ghi, VS-chan-o-aha, BV-bo-log-phi-0, BV-phi-tho, VS-ma-loi-cu, VS-total-fee-thay

## Câu hỏi
(không có)

## Phát hiện
- Dòng `pos_giao_bao_phi` phí ≤ 0 tạo trước khi vá (nếu có) vẫn dùng được (chốt phiên bỏ qua hạn). Không chặn ở `docBaoPhiDon` — xem ke_hoach.md mục 9.
- (người soát) Khôi phục sao lưu (`server/routes/backup.js` ~119, ~171 — chỉ chủ quán) có thể nạp lại dòng báo phí phí 0 cũ mà không qua chỗ chặn. Ngoài phạm vi.
- (người soát) Địa chỉ vừa quá xa vừa bị Ahamove báo 0 → quầy thấy "bấm Tính phí lại" thay vì "Quá xa" (chặn phí 0 đứng trước kiểm km,
  giaoHang.js ~127–131). Không mất tiền; thứ tự đã nêu trong kế hoạch mục 1 ("TRƯỚC km"), chưa có ca khoá thứ tự.
- Kho máy mây mở NÔNG (shallow): `thu_BH2.js` G1 đỏ `fatal: bad revision 'cbbb809..HEAD'` cho tới khi `git fetch --unshallow` (xem Bài học).

## Soát độc lập (/ra-soat, vòng 1 — báo cáo nguyên văn)

```
ĐẠT (có 3 lỗi nhẹ trong tài liệu và chú thích, không đụng tiền và không bắt sửa code)

Tóm tắt: mình đã đọc diff acc88921..HEAD, đọc code thật quanh chỗ vá và chạy lại bài thử lẫn đột biến. Kết quả: thu_GIAO4 24 đạt · 0 hỏng;
thu_GIAO3 47 đạt · 0 hỏng; dot_bien.py có đối chứng XANH 24/0, 10 đột biến thì BẮT 10, SỐNG 0, HỎNG 0, LẠC 0. Mình không tìm ra lỗi tiền hay lỗi
bảo mật. Có ba chỗ tài liệu và chú thích ghi sai nhẹ (khuôn K1), cộng vài chỗ có thể viết gọn hơn.

LỖI TÌM ĐƯỢC:
- viec/GIAO-4/ke_hoach.md mục 4 (dòng "Đỏ trên gốc… K1–K7, H2 xanh cả hai phía") — ghi sai. Trong bang_chung_do.txt, ca K4 ĐỎ trên gốc
  ("✗ K4 chặn (0đ) rồi bấm Tính phí lại — [null,200,15000]"). Lý do là K4 đòi lần bấm đầu phải trả AHAMOVE_PHI_0. Khẳng định không khớp bằng chứng — K1.
- cong_cu/thu_GIAO4.js:7 — chú thích "PHẢI ĐỎ TRÊN CODE CHƯA VÁ ở T1–T6, H1" cũng thiếu K4. Trên gốc có 17 dòng ✗, gồm cả K4. Theo luật, chú thích
  là khẳng định — K1 (TU-CHAY-6). Đây là lỗi nhẹ và nằm trong file bài thử: sửa ở đây sẽ làm đổi file bài thử sau khi đã ghi bằng chứng, cổng A16
  sẽ hỏi. Vì vậy chỉ nên sửa ke_hoach.md, hoặc ghi Phát hiện.
- server/utils/giaoHang.js:115 — vế Number.isInteger(phi) trong phiHopLe luôn đúng. Lý do: ahamove.js:77 trả Math.round(phi), và ahamove.js:74 đã
  loại null, chữ, NaN và vô cực (hàm so() ở ahamove.js:53). Đây là vế chết, không đột biến nào bắt được. Kế hoạch mục 5c đã biết và chọn giữ vì
  phiếu đặt tên "số nguyên > 0". Không phải lỗi, ghi vào mục Đơn giản.

NGHI NGỜ:
- giaoHang.js:127–131 kiểm phí 0 TRƯỚC khi kiểm km (dòng 131). Nếu địa chỉ vừa quá xa vừa bị báo phí 0, quầy nhận câu "bấm Tính phí lại" thay vì
  "Quá xa". Không mất tiền, chỉ là câu báo kém rõ trong ca hiếm. Đột biến không khoá thứ tự này.
- Phiếu ghi ca "null-total_price-và-total_fee-0", nhưng T4 (thu_GIAO4.js:116) THIẾU hẳn trường thay vì gửi null thật. Với ?? hai cách cho cùng kết
  quả (ahamove.js:74), nên mình xếp là nghi chứ chưa xếp lỗi.
- Báo phí ≤ 0 lưu TRƯỚC khi vá vẫn dùng được, nhất là ở chốt phiên (boQuaHan, orders.js:319). Kế hoạch mục 9 đã ghi Phát hiện, đúng luật §6.6.
  Đường sao lưu và khôi phục (routes/backup.js:119, 171) cũng có thể nạp dòng phi = 0 vào lại mà không qua chỗ chặn. Chỉ chủ quán làm được việc
  này, nhưng đó cũng là một đường song song chưa ghi.
- Khối chặn đọc bp.phi_tho.total_price (giaoHang.js:128). Nếu sau này ai gỡ phi_tho, câu báo thành AHAMOVE_LOI thay vì PHI_0. Vẫn chặn, an toàn;
  đột biến BV-phi-tho xác nhận điều này.

Soát theo 8 mục:
1. K3: Bài thử viết trước chỗ vá. Commit bài thử 8a4d71ea và efe39b50 ra đời trước commit vá e93e41f6; git diff --stat e93e41f6 HEAD không đụng tới
   cong_cu/. Trên gốc bài ĐỎ 17/24 (bang_chung_do.txt); bản sửa của thu_GIAO3 đỏ 1/47; bản thu_GIAO3 gốc chạy trên code đã vá cũng đỏ, nên xếp là
   bài sửa thường là đúng (luật §6.8–6.9). Bài kiểm HÀNH VI chứ không kiểm marker. Ca T1–T5 so cả bốn thứ: mã 502, code, đúng câu lỗi, và số dòng
   pos_giao_bao_phi không đổi (thu_GIAO4.js:123–124). Ca T6 so ĐÚNG MỘT dòng log và kiểm vắng địa chỉ, SĐT (dòng 126–127). Có ca sát ngưỡng: phí 1đ
   (K1) và đột biến phi > 1 (VS-chan-ca-1d) bị bắt. Có ca thứ tự: VS-chan-sau-ghi bị bắt qua số dòng.
2. K4: Có đúng 2 chỗ gọi aha.baoPhi (giaoHang.js:126 và :332). Có đúng 1 câu INSERT vào pos_giao_bao_phi (giaoHang.js:133). Hai câu UPDATE còn lại
   (dòng 153, 204) chỉ đổi order_id. Chỉ một route vào được taoBaoPhi (routes/giao-hang.js:25), quầy gọi nó ở client/src/utils/api.js:464. Đường gọi
   xe (giaoHang.js:332–334) giữ nguyên, ca K6 và đột biến VS-chan-o-aha khoá điều đó. App KH từ chối đơn giao (donApp.js:108 CHUA_GIAO). baoPhien ở
   manKhach.js:139 chỉ trùng tên. Không còn chỗ nào chưa xử lý, trừ đường khôi phục sao lưu nêu ở NGHI NGỜ.
3. K5: Các luồng hợp lệ đều có ca, và không luồng nào bị chặn oan: phí 1đ (K1), 15.000đ (K2), chỉ có total_fee (K3), bấm lại sau lỗi (K4), báo phí
   cũ > 0 dùng cho đơn (K5), gọi xe khi Ahamove báo 0 (K6), chuyến cũ không đổi (K7), hai máy cùng bấm (H2). Phí lẻ 0,6 làm tròn lên 1 nên vẫn qua.
   T5 (total_price 0 nhưng total_fee > 0) bị chặn: đây là chủ ý, chủ quán đã xác nhận.
4. K1: Hai khẳng định sai đã nêu ở LỖI. Các khẳng định khác mình kiểm thấy đúng: số dòng orders.js 316–320, 787, 1106; manKhach.js:139; donApp.js:108
   (kế hoạch ghi 109, lệch 1 dòng, không đáng kể). KhungGiao.jsx:47–53 hiện e.message rồi finally setDangTinh(false). api.js:102–111 lấy data.error;
   MA_TRANG_PROXY chỉ bắt thân không phải JSON; POST mặc định không tự gửi lại (api.js:181).
5. Đường tiền: không thêm trường nào server tin từ client. Phí giao vẫn lấy từ báo phí đã lưu (orders.js:787). Riêng đơn KHÔNG giao vẫn nhận
   shipping_fee từ client, nhưng đó là hành vi có từ trước, ngoài việc này.
6. P1: không đụng client/src, nên không cần build.
7. Nghiệm thu (dưới đây).
8. Đơn giản: chỗ vá gọn, chỉ +8 dòng ở giaoHang.js và +2/−1 ở ahamove.js. Có thể bỏ vế Number.isInteger. H1/H2 chạy đồng thời chỉ là phụ, vì đường
   này không có trạng thái dùng chung. Không có phần lan man hay đặt sai chỗ.

NGHIỆM THU:    7/7 mục có bằng chứng · mục thiếu: không có. (Nếu không tính lời ghi trong trang_thai.md thì mục cuối chưa có bằng chứng nào mình tự chạy.)
- A1 có: giaoHang.js:115 và :127–130 trả 502 AHAMOVE_PHI_0 đúng câu phiếu, kiểm TRƯỚC câu INSERT ở :133; ca T1–T5 và H1.
- A2 có: giaoHang.js:128 log một dòng chỉ gồm số; ca T6 ×5 và đột biến BV-bo-log-phi-0, BV-phi-tho.
- A3 có: đọc KhungGiao.jsx:47–53, :87–90 và api.js:102–111 thấy câu lỗi hiện đúng, nút bấm lại được; ca K4. Thao tác trên điện thoại chưa ai thử tay.
- A4 có: grep thấy 1 route, 1 chỗ ghi; App KH trả CHUA_GIAO.
- K5 có: các ca K1–K7, H2.
- Bài thử và đột biến có: bang_chung_do.txt đỏ 17/24 và 1/47, có dòng SỐ CA cho cả hai bài; mình chạy lại đột biến được 10/10 BẮT, có đối chứng.
- --day-du và cổng: chỉ trang_thai.md ghi "PASS 132 · FAIL 0"; mình không được phép chạy --day-du nên chưa kiểm lại. Cổng chay theo bạn dặn làm sau.

CHƯA SOÁT ĐƯỢC: node kiem_tra_truoc_khi_giao.js --day-du và npm test (không nằm trong danh sách lệnh được chạy); cổng tu_chay/cong.js chay; quầy thật
với Ahamove thật. Chưa ai giả được Ahamove báo 0đ trên quầy thật, và total_price / total_fee thật của Ahamove chưa đối chiếu. Mình cũng chưa soát
dữ liệu thật: số dòng pos_giao_bao_phi có phi <= 0 trên Turso.

BÀI HỌC:
- NGUYÊN TẮC: câu "ca X xanh cả hai phía" trong kế hoạch hay chú thích bài thử phải chép từ bang_chung_do.txt, không viết theo dự đoán (vụ K4 lần này).
- KHOÁ có thể làm: một phép tự so danh sách ca ✗ trong bang_chung_do với chú thích "PHẢI ĐỎ … ở" ở đầu bài thử.
- NGUYÊN TẮC: vị từ có vế luôn đúng (vế không đột biến nào giết được) thì ghi rõ là "giữ theo tên phiếu" hoặc bỏ đi.
- Cân nhắc: khi một chỗ chặn mới đứng cạnh chỗ chặn sẵn có (km), nêu rõ thứ tự kiểm trong kế hoạch, kèm một ca và đột biến cho thứ tự đó.
```

Xử lý sau soát (3be94015): sửa ke_hoach.md mục 4 và chú thích thu_GIAO4.js:7 (thêm K4). Chỉ đổi chú thích, không đổi ca: chạy lại 24/24, SỐ CA
giữ 24 (A16 so số ca, không so chú thích). Hai nghi ngờ (khôi phục sao lưu, thứ tự km) → mục Phát hiện. `Number.isInteger` giữ (kế hoạch 5c).
Lần soát chỉ nêu lỗi nhẹ, kết luận ĐẠT → không vòng sửa. Chạy lại `npm test -- --day-du` ở 3be94015: PASS 132 · FAIL 0 · CẢNH BÁO 1 (packages.js:196, có từ trước).

## Soát bảo mật
Phiếu ghi "không" — bỏ qua bước 8b.

## Bài học
Sự cố của việc này:
1. Hook dừng đỏ: `thu_BH2.js` G1 `fatal: bad revision 'cbbb809..HEAD'` — kho máy mây NÔNG, không phải lỗi code. Phải tự `git fetch --unshallow`.
2. Người soát bắt: kế hoạch + chú thích bài thử ghi K4 "xanh cả hai phía" trong khi bằng chứng đỏ (viết theo dự đoán, trước khi chạy).
3. `cong.js tinh . <mốc>^ HEAD` theo skill bước 4 ra 32 lý do A6 giả: chat đã ghép main vào nhánh, nên `<mốc>^..HEAD` kéo theo file của PR khác.
   Mốc đúng là merge-base với main (`acc88921`, cùng cách cổng GitHub ở `tu_chay/cong.js:124`).
4. Người gác chặn: B-BIMAT-CHU (chạy bài thử có cụm bí mật khi chưa commit; ghi sổ có nhắc tên cụm đó), B-TENCHU / B-PHANTICH / B-DICHCHU (ghi đầu ra
   bài thử vào file, dùng biến đường dẫn, vòng `for`), một lệnh `rm -rf` trong nháp bị từ chối quyền — đều do mình viết lệnh trái luật đã có; làm lại theo hướng dẫn.

Xếp ngăn:
- **KHOÁ 1** (ngoài Phạm vi — đề xuất): `cong_cu/thu_BH2.js` G1 (và mọi bài gọi `git log <sha>..HEAD`) kiểm `git cat-file -e <sha>` trước; thiếu thì in
  "kho nông — chạy git fetch --unshallow" thay vì `fatal`. Ca đỏ: chạy trong bản `git clone --depth 1` → phải ra câu hướng dẫn. (Hoặc hook mở phiên
  tự `--unshallow` — khung đóng băng tới khai trương, làm sau.)
- **KHOÁ 2** (ngoài Phạm vi — đề xuất, người soát nêu): phép trong `tu_chay/cong.js` so danh sách ca ✗ ở `bang_chung_do.txt` với dòng "PHẢI ĐỎ TRÊN
  CODE CHƯA VÁ ở …" đầu bài thử. Ca đỏ: chú thích thiếu một ca có ✗ (đúng vụ K4 ở 8a4d71ea). Khung đóng băng → sau khai trương.
- **NGUYÊN TẮC 1** (ngoài Phạm vi — đề xuất `KHUON_LOI.md` K1, gộp vào dòng TU-CHAY-6 để không vượt `khuon_loi_toi_da`): "Câu 'ca X đỏ / xanh trên
  gốc' trong kế hoạch / chú thích bài thử chép từ `bang_chung_do.txt` SAU khi chạy, không viết theo dự đoán (GIAO-4: K4 ghi xanh, thật đỏ)."
- **NGUYÊN TẮC 2** (ngoài Phạm vi — đề xuất sửa `tu_chay/skill_lam_viec.md` bước 4 + `tu_chay/lenh_ra_soat.md` bước 1): nhánh đã ghép main → mốc cho
  `cong.js tinh/chay` và diff soát là merge-base với main (SHA main đã ghép), không `<PHIEU>^`. Khung đóng băng → ghi lại, làm sau.
- **BỎ 1** (người gác chặn cú pháp / quyền `rm -rf`): luật đã có trong skill; mình viết sai, làm lại theo hướng dẫn là qua.
- **BỎ 2** (vế `Number.isInteger` chết): giữ có chủ ý theo tên vị từ của phiếu, đã nêu kế hoạch 5c.
Dọn: không lời dặn nào trong KHUON_LOI.md / CLAUDE.md mà việc này có phép kiểm làm thay.

## Cổng
`node tu_chay/cong.js chay . acc88921 HEAD viec/GIAO-4` ở HEAD 3593f00f, cây sạch (mốc = merge-base với main — Bài học sự cố 3):
✓ CỔNG CHẠY ĐẠT

## Báo cáo 7 mục

```
VIỆC:        GIAO-4 — Ahamove báo phí 0đ (hoặc âm) thì CHẶN, quầy bấm Tính phí lại
ĐÃ SỬA:      server/utils/giaoHang.js:112–115 — vị từ phiHopLe (số nguyên > 0);
             server/utils/giaoHang.js:127–130 — trong taoBaoPhi, ngay sau aha.baoPhi, TRƯỚC km và TRƯỚC INSERT: phí ≤ 0 → log
               "[GIAO] phi_0 total_price=… total_fee=…" + 502 { code: 'AHAMOVE_PHI_0', error: 'Ahamove báo phí 0đ — bấm Tính phí lại (nếu lặp lại, gọi Ahamove kiểm tra)' };
             server/utils/ahamove.js:66, 76–77 — baoPhi trả thêm phi_tho { total_price, total_fee } (chỉ số, cho log); chú thích hàm;
             kiem_tra_truoc_khi_giao.js:515 — chayBaiThat('cong_cu/thu_GIAO4.js');
             cong_cu/thu_GIAO3.js ~397–404 — C3: báo phí 0 CHỈ lúc gọi xe (đơn dùng báo phí thường) + ca mới "Tính phí ở quầy báo 0 → 502".
             Không đổi: đường gọi xe (giaoHang.js goiXe), client/ (màn đã hiện lời máy chủ), DB.
BÀI THỬ:     thu_GIAO4.js trên bản chưa vá → ĐỎ 17/24 (T1–T6, K4, H1: gốc trả 200, ghi dòng báo phí phí 0/−5000, không log); sau vá → XANH 24/24.
             thu_GIAO3.js (bản sửa) trên gốc → ĐỎ 1/47 (C3 GIAO-4); sau vá → 47/47. Bản GỐC thu_GIAO3 trên code đã vá → đỏ (bài sửa thường, §6.8–6.9).
             Đột biến viec/GIAO-4/dot_bien.py: đối chứng XANH 24/0 · 10 đột biến · BẮT 10 · SỐNG 0 · HỎNG 0 · LẠC 0.
             npm test -- --day-du: PASS 132 · FAIL 0 · CẢNH BÁO 1 (packages.js:196, có từ trước). Cổng chạy: ĐẠT. /ra-soat vòng 1: ĐẠT.
             Nghiệm thu, từng mục:
               A1 MỘT chỗ chặn, 502 AHAMOVE_PHI_0, không ghi báo phí → T1–T5 (5 ca × 2 phép), H1; đột biến VS-phi-0-lot, VS-phi-am-lot, BV-bo-chan-phi-0, VS-chan-sau-ghi, VS-ma-loi-cu
               A2 log một dòng chỉ số → T6 (×5, so đúng chuỗi + vắng địa chỉ / SĐT); BV-bo-log-phi-0, BV-phi-tho
               A3 màn hiện lời máy chủ, bấm lại được → không sửa màn: KhungGiao.jsx:47–53 (setLoi(e.message), finally setDangTinh(false)), :87–90 (nút hiện lại),
                  api.js:102–111 (lấy data.error); K4 (máy chủ cho bấm lại); điện thoại: CHƯA KIỂM
               A4 mọi đường → chỉ taoBaoPhi tạo báo phí (grep: 2 chỗ gọi baoPhi, 1 INSERT); App KH CHUA_GIAO (donApp.js:108); màn khách không có đường; ke_hoach.md mục 0
               K5 phí 1đ → K1 (+ VS-chan-ca-1d) · 15.000đ → K2 · chỉ total_fee > 0 → K3 · báo phí cũ > 0 → K5 · gọi xe → K6 (+ VS-chan-o-aha) · đơn cũ → K7 + không đổi DB
               Bài thử cong_cu/thu_GIAO4.js đủ ca phiếu (0 / −5000 / "0" / total_fee 0 / 1 / 15000 / chỉ total_fee 20000) + T5 (total_price 0, total_fee 20000 → chặn, chủ quán 26.11), đỏ trên gốc, 3 đột biến phiếu + 7 thêm, đối chứng xanh
               --day-du xanh, cong.js chay ĐẠT → hai dòng trên
ĐÃ RÀ K4:    grep "baoPhi(" server → 2 chỗ (giaoHang.js taoBaoPhi: đã chặn; goiXe: giữ nguyên có chủ ý, K6 khoá);
             grep "INSERT INTO pos_giao_bao_phi" server → 1 chỗ (sau chỗ chặn); grep "baoPhi\|taoBaoPhi" (manKhach / man-khach / orders) → chỉ đọc báo phí đã lưu
             hoặc trùng tên; bài cũ có Ahamove giả báo phí (thu_GIAO1/2/3) → chỉ GIAO3 C3 báo 0 ở quầy, đã sửa.
CHƯA KIỂM:   Ahamove THẬT báo 0đ trên quầy thật (không giả được) và dạng total_price / total_fee thật của Ahamove; thao tác trên điện thoại;
             dữ liệu thật: báo phí phí ≤ 0 lưu trước khi vá (SELECT count(*) FROM pos_giao_bao_phi WHERE phi <= 0) và đường khôi phục sao lưu nạp lại dòng
             đó (Phát hiện); thứ tự "phí 0 trước km" không có ca khoá.
GIT:         3593f00f GIAO-4: ra-soat DAT (chep nguyen van), phat hien, bai hoc
             3be94015 GIAO-4: sua chu thich/ke hoach — K4 cung do tren goc (ra-soat bat)
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 2 · BỎ 2 — chi tiết ở ## Bài học (đều ngoài Phạm vi → đề xuất, máy không tự làm)
```

Thử tay trên điện thoại (chủ quán): (1) Bán hàng → Giao hàng · Ahamove → nhập SĐT, tên, địa chỉ → Tính phí: phí hiện như cũ (vd 15.000đ), thu tiền được.
(2) Ahamove báo 0đ không giả được ở quầy thật — nếu có lần thấy lời "Ahamove báo phí 0đ — bấm Tính phí lại", bấm lại; lặp lại thì gọi Ahamove.

HEAD ĐÃ KIỂM: 3593f00f
