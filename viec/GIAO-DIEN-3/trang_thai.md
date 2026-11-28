# GIAO-DIEN-3 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh `viec/GIAO-DIEN-3`; hai SHA (HEAD · FETCH_HEAD) lúc mở phiên: `294cd01` · `294cd01` (bằng nhau, không phải kéo).
- `git log --oneline -3` lúc mở phiên:
  - `294cd01 PHIEU: GIAO-DIEN-3 — man hinh vua khit moi thiet bi (min-width:0 khung chung, chu iPhone, tab Kho may tinh) — chat ban 42`
  - `c4b370c Merge pull request #109 from pos-tuquyduong/viec/ANH-MON-1`
  - `7d15ace ANH-MON-1: kết quả cổng cuối, HEAD ĐÃ KIỂM`
- Kho mở ở dạng nông (shallow): bài `thu_BH2.js` ca G1 đỏ vì thiếu commit `cbbb809` — KHÔNG phải lỗi của việc này. Đã `git fetch --unshallow origin viec/GIAO-DIEN-3` (chỉ tải lịch sử, không đổi file), `thu_BH2.js` lại xanh (100 đạt · 0 hỏng).
- Không có thông báo đổi model giữa phiên.

## Bảng chỗ vá → đột biến (cổng A17, A18)
| Chỗ vá | Đột biến (VS = vá sai · BV = bỏ vá) |
|---|---|
| `index.css` `.main-content { min-width: 0 }` | BV-bo-min-width · VS-min-width-chi-trong-media-768 · VS-min-width-mot-pixel · VS-min-width-bi-ghi-de-sau · VS-main-content-doi-flex · VS-giau-tran-overflow-hidden · BV-mat-margin-left-0-dien-thoai · VS-giau-tran-overflow-viet-tat |
| `index.css` `html { text-size-adjust }` | BV-bo-text-size-adjust · VS-text-size-auto · VS-text-size-chi-webkit · VS-text-size-chi-trong-media |
| `client/index.html` viewport (khoá, không sửa) | VS-viewport-khoa-phong-to · VS-viewport-scale-1 · BV-viewport-mat-width |
| `kho.css` khối `@media (min-width: 769px)` | BV-bo-khoi-tab-may-tinh · VS-tab-wrap-ngoai-media · VS-tab-media-min-0 · VS-tab-nguong-lech-len · VS-tab-nguong-lech-xuong · VS-tab-van-cuon-ngang · VS-tab-khong-wrap-chi-visible · VS-tab-mat-hang-flex |
| `index.css` `.table-responsive` (vòng sửa 1) | BV-bo-table-responsive · VS-table-responsive-hidden · VS-table-responsive-chi-dien-thoai · VS-table-responsive-overflow-viet-tat · VS-bang-het-600px |
| `kiem_tra_truoc_khi_giao.js` gắn bài | BV-quen-gan-bai-vao-bo-kiem |

Kết quả `python3 viec/GIAO-DIEN-3/dot_bien.py`: đối chứng XANH · TỔNG 29: BẮT 29 · SỐNG 0 · LẠC 0 · HỎNG 0.

## Soát bảo mật
không — chỉ CSS (phiếu `## Soát bảo mật: không`).

## Đo bề ngang bằng Chrome (C3)
Playwright + Chromium có sẵn trong máy (không thêm thư viện vào kho; script ở thư mục nháp). Trang dựng lại từ `index.css` + `kho.css` THẬT (gốc = commit `294cd013`, vá = cây làm việc) với cấu trúc Layout/Kho: `.app-layout > aside.sidebar + main.main-content`, hàng 11 tab, lưới 8 thẻ `.kho-the`, một bảng `.table`. `isMobile` bật dưới 1.000 px. `document.documentElement.scrollWidth`:

| Màn | GỐC | VÁ | Lưới thẻ gốc → vá | Hàng tab Kho (vá) |
|---|---|---|---|---|
| điện thoại 390 | 1.253 | **390** | 4 cột → 1 cột | 1 hàng, cuộn ngang |
| máy tính bảng 820 | 1.524 | **820** | 4 → 2 cột | 3 hàng, thấy đủ 11 tab |
| máy tính 1.280 | 1.524 | **1.280** | 4 → 4 cột | 2 hàng, thấy đủ 11 tab |

(Số gốc 1.253 vs 1.252 của phiếu: lệch 1 px do trang dựng khác chút — cùng bậc.) Bảng trong trang đo:
- bảng bọc `overflow-x: auto` (như Đơn, Báo cáo) hoặc `className="table-responsive"` (như Đối soát, Mã giảm giá; sau vòng sửa 1): vá = 390 / 820 / 1.280 — bằng bề rộng màn ở cả ba.
- bảng KHÔNG bọc gì (như Hoàn tiền): ở 390 px vá = **608** (gốc 1.253) — đỡ hơn nhiều nhưng vẫn kéo ngang, vì bảng 600 px thò ra ngoài. Xem `## Phát hiện` mục 1.
- `.grid-2` chứa thẻ + `.table-responsive` (như Báo cáo › chiết khấu), 390 px: **390** = bằng màn (đo sau khi người soát vòng 2 nghi ngờ — không tái hiện).

## Báo cáo của người soát độc lập

### Vòng 1 (RÚT GỌN — không phải nguyên văn: các câu lặp thay bằng "…"; số liệu, file:dòng, kết luận giữ nguyên)
```
KHÔNG ĐẠT (lỗi vừa, sửa một vòng được; phần CSS vá và bài thử tự nó đúng)

Chạy thật trong lượt này:
- `node cong_cu/thu_GIAODIEN3.js` trên HEAD: 28 đạt · 0 hỏng.
- Cùng bài trên bản gốc 294cd013 (chép 4 file ra thư mục tạm, `--goc`): 19 đạt · 9 hỏng. Đỏ ở T1a/b/c, T2a/b/c, T4b, T4c, C1, khớp `bang_chung_do.txt`.
- `python3 viec/GIAO-DIEN-3/dot_bien.py`: đối chứng XANH, TỔNG 22: BẮT 22 · SỐNG 0 · LẠC 0 · HỎNG 0.
- `node kiem_tra_truoc_khi_giao.js` chạy đủ: quá 280 giây nên tôi dừng, chưa có kết quả.

LỖI TÌM ĐƯỢC:
1. `client/src/index.css:652` (`@media ≤768 { .table { min-width: 600px } }`) kết hợp `index.css:112` (`.main-content { min-width: 0 }`) — K5 (luồng hợp lệ đổi) và K1 (khẳng định không căn cứ).
   - Trước vá, bảng không bọc khung cuộn kéo cả trang rộng ra, header và thẻ rộng theo. Sau vá, `.main-content` chỉ rộng bằng màn (390 px) còn bảng 600 px thò ra ngoài thẻ `.card`. Trang vẫn cuộn ngang, và nền thẻ không còn bao hết bảng.
   - Bảng không có khung cuộn thật: Settings.jsx:1098, 1218, 1329, 1862, 1949, 2258, 2423; Refunds.jsx:51; ViKhach.jsx:112 (trong modal).
   - Cái bẫy: DoiSoat.jsx:123/147, DiscountCodes.jsx:335 và Reports.jsx:317/358 bọc bảng bằng `className="table-responsive"`, nhưng lớp này KHÔNG có CSS ở đâu cả. `grep table-responsive` trong client/src: 0 chỗ trong css. Trong `client/dist/assets/index-CBFfOn-D.css`: 0. Chỉ Orders.jsx:556/689, Reports.jsx:416 và Settings.jsx:1527 có `overflowX:'auto'` inline thật.
   - `ke_hoach.md` ghi "Bảng .table không bọc khung cuộn: xem ## Phát hiện" và phần luồng hợp lệ chỉ nhắc bảng bọc `overflowX:auto`. Vậy việc này chưa đạt mục tiêu "hết tràn ngang" ở các màn bảng, và có nguy cơ xấu đi ở các màn kể trên. Tôi không có Chrome để đo nên chưa đo được, ghi nguy cơ chứ không khẳng định đã hỏng.
   - Đề xuất: thêm một dòng `.table-responsive { overflow-x: auto; }` vào index.css (nằm trong Phạm vi, không đụng màu/phông/ngưỡng), kèm ca thử. Bọc các bảng trần là sửa .jsx nên bị Cấm, phải ghi Phát hiện. Cần đo Chrome 390 px một màn Settings bảng trần (C3).
2. `cong_cu/thu_GIAODIEN3.js` dòng T4c, so `r.dk === '@media (min-width: 769px)'` ... Viết `(min-width:769px)` không dấu cách thì T4c báo ĐỎ oan. Không phải xanh oan ... chỉ là độ giòn (K2). Nên chuẩn hoá dấu hai chấm trước khi so.

NGHI NGỜ: bộ đọc CSS chỉ so selector nguyên văn (đã tự nêu giới hạn đầu file); thiếu hai đột biến phụ (margin-left:0 ở ≤768, overflow viết tắt cho T1e); bài thử 146 dòng + dot_bien 99 dòng vượt ngân sách ~80 dòng (phần vượt là bộ đọc CSS + 11 ca giả); dist: index-v3WBv648.js giống từng byte index-DRZ9RfBc.js, chỉ đổi tên băm.

K4: `.kho-tabs` dùng ở Kho/index.jsx:74, ChonNguyenLieu.jsx:26, NguyenLieu.jsx:126, TonKho.jsx:40 — cùng xuống dòng từ 769 px, đúng ke_hoach.md. Không CSS nào khác đặt min-width/overflow cho .main-content/.page-content/.app-layout.
K5: điện thoại ≤768 giữ hàng cuộn (kho.css:2 nguyên văn); margin-left 0 giữ; viewport maximum-scale=5.0 giữ; Orders.jsx bảng bọc vẫn cuộn; không @media print đụng .main-content.
Đường tiền: không đụng. Phạm vi / Cấm: đúng (kho.css chỉ THÊM 2 dòng cuối; không server/, .jsx, màu/phông/ngưỡng).

NGHIỆM THU: 4/7 mục có bằng chứng · thiếu/chờ: C2, C3, C4 (chờ trang_thai.md).
CHƯA SOÁT ĐƯỢC: không có Chrome để đo; chưa chạy bộ kiểm đủ; chưa rà hết flex con thiếu min-width:0 ở các màn khác.
BÀI HỌC: K1 "đã bọc bảng" không đủ — grep tên lớp trong CSS (table-responsive là lớp ma). K5 sửa gốc ở khung chung dời chỗ tràn xuống từng con: liệt kê MỌI con có min-width cứng (.table 600 px), mỗi loại một ca. K3 so chuỗi dk nguyên văn thì giòn — chuẩn hoá trước khi so.
```
(Báo cáo đầy đủ nằm trong lịch sử phiên; bản trên tóm lược "NGHI NGỜ", K4, K5 thành vài dòng.)

### Xử lý vòng 1 (commit `6e7c8d2f`)
- Lỗi 1: thêm `.table-responsive { overflow-x: auto; }` (index.css, ngay sau `.table`) + ca T5a/T5b + 4 đột biến; đo lại bằng Chrome (bảng trên). Bảng trần trong .jsx → `## Phát hiện`. Luồng bảng bọc `className="table-responsive"` (DoiSoat, DiscountCodes, Reports) giờ cuộn TRONG khung.
- Lỗi 2: `phanTich` chuẩn hoá `(min-width:769px)` → `(min-width: 769px)`; ca 0l.
- Hai đột biến phụ: BV-mat-margin-left-0-dien-thoai, VS-giau-tran-overflow-viet-tat.
- Vượt ngân sách (ghi thẳng): phiếu ~10 dòng CSS + ~80 dòng thử; thực tế CSS +7 dòng (kể cả chú thích), `thu_GIAODIEN3.js` ~155 dòng, `dot_bien.py` ~110 dòng. Phần vượt là bộ đọc CSS có tính media/biên (dò chuỗi không bắt được "chỉ nằm trong @media 768" và biên 768/769) + 12 ca giả để bài không tự xanh oan. Nhãn A3/T5 và lớp `.table-responsive` là việc NGOÀI A1/A2/B1 của phiếu — thêm vì vòng soát 1 chỉ ra, nằm trong file thuộc Phạm vi, nêu rõ để chủ quán biết.

### Vòng 2 (tóm tắt trung thực; kết luận KHÔNG ĐẠT (nhẹ) của người soát)
```
KHÔNG ĐẠT (nhẹ) — còn 1 lỗ ở mục (a)/(c), không do bản vá gây ra. Mọi mục chính (A1, A2, B1, C1) đều đạt.
--day-du ở HEAD 6e7c8d2f: PASS 137 · FAIL 0 · CẢNH BÁO 1.
LỖI 1: index.css:243, :630 + Reports.jsx:312 (→ :317, :358) — K4+K1. `.grid-2 { repeat(2, 1fr) }`, `1fr` = minmax(auto,1fr), ô lưới không co nhỏ hơn
  min-content của .card; bảng 600 px trong .table-responsive trong .card → suy luận (CHƯA ĐO) lưới ~1250 px, trang vẫn kéo ngang ở Báo cáo > chiết khấu.
  Lỗi có từ trước, không phải hồi quy. Cách xử: ghi Phát hiện, hoặc `minmax(0,1fr)` + ca thử + đo Chrome.
LỖI 2: thu_GIAODIEN3.js ca T5a chỉ đọc overflow-x; `.table-responsive { overflow: hidden }` viết tắt đặt sau vẫn xanh (K3). Thêm ca / đột biến.
NGHI NGỜ: bảng trần Settings/Refunds/ViKhach chưa đọc; thu_GIAODIEN3.js 154 dòng > ngân sách ~80, nhãn A3 ngoài phiếu; khối kho.css cuối file — KHO-GON-1 thêm sau thì ghép tay.
(a) sửa vòng 1 đúng, không tác dụng phụ xấu (DoiSoat/DiscountCodes/Reports bên trong không có sticky/dropdown/bóng; Reports:358 đã có overflowY:auto inline).
(b) 31 đạt · 0 hỏng; đột biến 28/28; gốc 21 đạt · 10 hỏng khớp bang_chung_do.txt; 6 đột biến mới đúng ngưỡng.
(c) .main-content chỉ ở index.css:112, :627, con flex duy nhất cạnh .sidebar (fixed); .bh-cot-mon đã có min-width:0 từ trước; .kho-tabs 4 chỗ dùng như kế hoạch.
(d) dist khớp src: css chứa đủ 4 khối; viewport không đổi.
NGHIỆM THU: 4/4 phần soát (A1, A2, B1, C1) · chờ C2/C3/C4.
CHƯA SOÁT ĐƯỢC: Chrome bị người gác chặn với người soát (không đo được lỗi 1); npm test / cong.js chay chưa chạy; bảng trần Settings/Refunds/ViKhach chưa đọc.
BÀI HỌC: K4 thêm lớp bọc cuộn ngang cho bảng thì rà luôn cha dạng lưới 1fr; K3 ca "overflow phải là X" đọc cả viết tắt `overflow`.
```
### Xử lý vòng 2 (commit `8b92df10`)
- Lỗi 2: sửa — T5a đọc thêm `overflow` viết tắt (đỏ nếu `hidden/visible/clip` đặt sau), đột biến `VS-table-responsive-overflow-viet-tat` BẮT. Gốc vẫn 21 đạt · 10 hỏng (T5a đỏ trên gốc), `SỐ CA` 31 không đổi.
- Lỗi 1: **ĐO bằng Chrome, KHÔNG tái hiện** — `.grid-2` chứa `.card > .table-responsive > .table` ở 390 px: `scrollWidth` 390 = bằng màn (trang dựng từ index.css thật, gồm cả `@media` dòng 630). Suy luận lưới `1fr` của người soát không đúng với kết quả đo; không vá `.grid-2`. Chưa đo trên trang Báo cáo thật (cần dữ liệu), chỉ trên cấu trúc dựng lại — ghi CHƯA KIỂM.
- Hai vòng sửa (1 và 2) trên tối đa 3 vòng. Lỗi còn lại của lần soát cuối là NHẸ, không đụng tiền / ví / điểm / bảo mật / ngoài Phạm vi; đã xử lý hết (lỗi 2 sửa, lỗi 1 đo không tái hiện). Không gọi agent soát vòng 3.

## Phát hiện (ngoài Phạm vi — chỉ ghi, không sửa)
1. **Bảng `.table` không bọc khung cuộn trong .jsx** (file .jsx bị Cấm ở phiếu này): `Settings.jsx:1098, 1218, 1329, 1862, 1949, 2258, 2423` (1862 có khung `maxHeight`+`overflowY` nhưng không `overflow-x`), `Refunds.jsx:51`, `components/ViKhach.jsx:112` (modal). Ở điện thoại ≤ 768 px mỗi bảng 600 px (`index.css` `.table { min-width: 600px }`) thò ra ngoài thẻ; đo Chrome trang dựng: 608 px ở màn 390 (gốc 1.253). Đề xuất việc sau: bọc từng bảng bằng `<div className="table-responsive">` (lớp đã có CSS từ việc này) — mỗi chỗ một ca; Refunds + Settings là đường nhân viên hay dùng.
2. **Lớp "ma"**: `table-responsive` được 5 chỗ dùng mà trước việc này không có CSS (K1). Gợi ý khoá: phép kiểm "mọi `className="…"` trong .jsx phải có định nghĩa CSS" (nhiều lớp tiện ích có thể false-positive — cần danh sách trắng).
3. Cảnh báo sẵn có của bộ kiểm: `packages.js:196` route GET có lệnh ghi (không thuộc việc này).
4. `kho.css` khối B1 nằm cuối file (dòng ~41–42). KHO-GON-1 đang sửa file này → chat ghép tay lúc gộp; `client/dist/**` chắc chắn xung đột (build lại sau khi gộp).

## Bài học
Sự cố của việc này (bước 11.1): (a) người soát vòng 1 chỉ ra lớp `table-responsive` không có CSS; (b) bài thử so `@media` nguyên văn giòn; (c) T5a bỏ sót `overflow` viết tắt; (d) người soát vòng 2 suy luận một lỗi lưới `1fr` mà đo thật không tái hiện; (e) kho mở dạng nông làm `thu_BH2.js` ca G1 đỏ; (f) người gác chặn chuyển hướng `> file`, `git -C`, `python3 - <<EOF`, `pgrep`, `cd` vào thư mục tác vụ nền, `sleep`, Monitor với `until`, chạy `kiem_tra_truoc_khi_giao.js` thẳng khi đang sửa (cụm TOKEN) — làm lại bằng `npm test -- --day-du`, tool Write, file script trong nháp. Không có lệnh nào bị chặn vì mã luật cần sửa luật.

| # | Bài học | Ngăn | Lý do / chỗ ghi |
|---|---|---|---|
| 1 | Lớp CSS được `.jsx` dùng mà không có định nghĩa (`table-responsive`) | **KHOÁ** (đề xuất, ngoài Phạm vi) | File: `kiem_tra_truoc_khi_giao.js` — phép "mọi `className="x"` chuỗi tĩnh trong `client/src/**/*.jsx` phải có `.x` trong một file `.css` hoặc nằm trong danh sách trắng"; ca đỏ: thêm `className="khong-co-css"` vào một .jsx → ĐỎ. Dễ false-positive (lớp tiện ích) → cần danh sách trắng + hạ `NGUONG` kiểu bánh cóc. Chat soát duyệt, gom phiếu `HOC-<n>`. |
| 2 | Sửa ở khung chung (`min-width: 0`) chỉ dời chỗ tràn từ "cả trang" xuống từng con có `min-width` cứng; phải liệt kê mọi con loại đó và đo từng loại | **NGUYÊN TẮC** (đề xuất cho `KHUON_LOI.md`, K5) | Đã gây: bảng 600 px thò ra ngoài thẻ (đo 608 px ở 390). Dấu hiệu: sửa gốc "một dòng cho mọi màn". Chặn: mỗi loại con (bảng bọc / bảng trần / lưới / hàng tab) một ca đo Chrome trước khi báo xong. Ghi vào `KHUON_LOI.md` là ngoài Phạm vi — chỉ đề xuất. |
| 3 | Suy luận CSS của người soát ("lưới 1fr co không nổi") phải đo trước khi sửa | **NGUYÊN TẮC** (K1: "đoán nguyên nhân phải đo trước" đã có mục BAO-1a — chỉ thêm ví dụ GIAO-DIEN-3) | Đã có trong KHUON_LOI.md (K1 bổ sung 11.11) — không mở mục mới, đề xuất thêm một dòng ví dụ. |
| 4 | Bài thử CSS: chuẩn hoá điều kiện `@media`, đọc cả thuộc tính viết tắt (`overflow`) khi kiểm một thuộc tính con | **KHOÁ** (đã làm, trong Phạm vi) | Ca 0l, T5a mở rộng, đột biến `VS-table-responsive-overflow-viet-tat`. |
| 5 | Kho mở dạng nông → một bài đọc lịch sử (`thu_BH2.js` G1) đỏ oan | **BỎ** | Môi trường mở phiên, `git fetch --unshallow` đã được SKILL cho phép; xảy ra một lần. |
| 6 | Dọn lời dặn đã có phép kiểm làm thay (11.3) | — | Không có lời dặn mới nào trong `KHUON_LOI.md` / `CLAUDE.md` bị phép kiểm thay; không đề xuất xoá. `KHUON_LOI.md` không đụng nên không đổi `khuon_loi_toi_da`. |

Tổng: KHOÁ 2 (1 đề xuất, 1 đã làm) · NGUYÊN TẮC 2 (đề xuất) · BỎ 1.
