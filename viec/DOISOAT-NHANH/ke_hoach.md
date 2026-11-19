# DOISOAT-NHANH — kế hoạch

## 1. Đã đọc (HEAD 21ab0fc)
- Mọi `await` trên đường Đối soát chỉ chờ câu kho: `bat_bien.js` 32 chỗ `await q(`, `doiSoat.js` chỉ `await chiDoc(` / hàm con gọi `chiDoc`,
  `giaoHang.js doiSoatGiao` chỉ `await q(` (grep `await [a-zA-Z_.]*(` ba file). → khả năng (2) "await một thứ khác" KHÔNG có trong code: chỗ
  treo phải là một câu kho không có trả lời. Vì vậy hạn giờ đặt ở câu kho (một chỗ: `chiDoc`) là đủ chặn mọi kiểu treo của lượt.
- `@libsql/client` 0.4.3, `http.js execute`: mỗi câu mở stream riêng, một `fetch` (node-fetch, không `signal`, không hạn giờ). Câu treo không chặn
  câu sau (không chung hàng đợi). `execute(stmt)` KHÔNG nhận tín hiệu huỷ.
- Thứ tự câu trên kho rỗng (đo lại, `scratchpad/thu_thu_tu.js`): #7–#13 = I8, #13 = "loại dòng điểm lạ", #14 = I9 — khớp phiếu. Dòng `[CHAM]` đếm
  cả câu của `authenticate` (1) và câu nền của `doNeuDenLuc` (index.js:102 — không await, chạy trong cùng AsyncLocalStorage) → vị trí thật CHƯA CHẮC.
- `[CHAM]` regex khoá đuôi `· ngoài (\d+) ms$` ở `thu_KETNOI1.js` → A2 đổi dòng thì bài đó phải sửa (hành vi phiếu duyệt đổi — bài sửa thường, đỏ
  trên gốc vì gốc không có "đang chờ").
- `thu_GIAO3.js` rút mọi `setTimeout ≥ 30 s` còn 300 ms trong tiến trình (để thử hạn chờ màn). → không đặt hẹn giờ ≥ 30 s ở máy chủ (sẽ bị rút
  oan trong bài đó); hạn tổng đi bằng MỐC GIỜ truyền xuống từng câu, mỗi hẹn giờ ≤ 15 s.
- Màn: `DoiSoat.jsx:43` hiện `e.message`; `api.js` lỗi JSON → message = `data.error`; `MA_GUI_LAI` chỉ có `MAT_KET_NOI`, `KHO_MAT_KET_NOI` → 503
  `DOI_SOAT_QUA_HAN` hiện đúng lời máy chủ, không tự gửi lại. B4 KHÔNG cần sửa giao diện (bài thử khoá).

## 2. Phương án
| Phần | A (chọn) | B |
|---|---|---|
| B1 hạn mỗi câu | `query(sql, params, han)` thêm tham số MẶC ĐỊNH `null` (không truyền = như cũ, D2); `han = { ms, het }`: mỗi lần gửi `Promise.race` với hẹn giờ `min(ms, het − bây giờ)`; quá hạn = lỗi `KHO_QUA_HAN` đi CÙNG vòng đọc lại `CHO_DOC_MS` có sẵn. ~15 dòng database.js | client libsql thứ hai với `fetch` có `AbortSignal` hẹn giờ (huỷ thật yêu cầu HTTP). Phải mở client riêng, đọc cấu hình, ~30 dòng, rủi ro đổi đường kết nối |
| B2 hạn tổng | mốc `het = t0 + HAN.LUOT_DOI_SOAT_MS` (50 s) trong lượt (AsyncLocalStorage của doiSoat.js) → mỗi lần gửi chỉ chờ phần còn lại; đọc lại chỉ khi còn hơn thời gian chờ. Cận trên < 50 s + một khoảng chờ đọc lại < 60 s (không cần kiểm mốc ở đầu bước — câu đầu của bước tự ném) | `Promise.race` cả lượt với hẹn giờ 50 s — bị `thu_GIAO3` rút còn 300 ms (đỏ oan), và lượt nền vẫn chạy |
| B3 bỏ giữa | route `res.on('close')` → `AbortController` ('close' sau khi trả lời xong: lượt đã xong, huỷ vô hại); đầu mỗi bước kiểm `tinHieu.aborted` → log `bo_giua`, ném 499 | kiểm trong chiDoc mỗi câu — nhiều chỗ hơn, phiếu chỉ đòi "bước kế tiếp" |
| A1 log | hàm `buoc(l, ten, viec)` bọc mỗi bước trong vòng for có sẵn: đo ms + số câu của lượt (`l.cau`) | đếm theo demCau toàn cục — lượt chồng nhau cộng lẫn |
| A2 đang chờ | `doCau`: `d.cho++` trước, `d.cho--` trong `finally` (đếm cả câu ném lỗi); `[CHAM]` thêm `· đang chờ <k> câu` | — |

**B1 — có huỷ được yêu cầu HTTP không:** KHÔNG. Cách A chỉ THÔI CHỜ: yêu cầu HTTP treo vẫn nằm đó tới khi socket chết (libsql 0.4.3 `execute` không
nhận tín hiệu huỷ; muốn huỷ thật phải dựng client thứ hai với `fetch` riêng — cách B). Chọn A vì: (1) mỗi câu libsql HTTP là một `fetch` riêng, câu
treo không giữ hàng đợi nào → đọc lại gửi yêu cầu MỚI (socket khác — socket cũ đang bận) nên đọc lại có nghĩa; (2) không đụng cách nối kho của mọi
đường khác (D2); (3) ít dòng. Giá phải trả: tối đa vài yêu cầu treo/lượt chiếm socket tới khi hệ điều hành cắt — `[CHAM] · đang chờ k` cho thấy.

Số dòng ước: database.js ~18, doiSoat.js ~40, reports.js ~3, giao diện 0, bài thử ~300. Trong ngân sách (80 + 10 + 300).

## 3. Ca thử ↔ nghiệm thu (`cong_cu/thu_DOISOATNHANH.js`, hẹn giờ thử rút ÷100 — hằng số so BẰNG giá trị thật)
| Nghiệm thu | Ca |
|---|---|
| A1 | lượt bình thường: dòng `bat_dau ngay <ngày>`; mỗi bước I…, D1, DEN, CK, XNT, D2, tongHop, soHoaDonNgay, soKet (ngày) / sao_ke (tuần) một dòng `buoc <ten> · <ms> ms · <n> câu`; tổng câu các bước = số câu dòng cuối; dòng cuối giữ dạng cũ; log không SĐT / mã đơn / số tiền / SQL |
| A2 | câu treo → `[CHAM] … · đang chờ 1 câu`; câu ném lỗi → `đang chờ 0`; yêu cầu thường `đang chờ 0` |
| B1 | câu #k treo mãi → 503 `DOI_SOAT_QUA_HAN`, lời "Đối soát quá lâu ở bước I8 — thử lại sau", log `qua_han buoc I8 cau <thứ tự câu trong lượt>`, gửi đúng 3 lần (1 + 2 đọc lại); treo lần 1 rồi trả lời → kết quả đủ, không lỗi; hằng số 15 000 |
| B2 | mọi câu chậm 12 s (dưới hạn câu) → lượt dừng ở mốc tổng, 503, thời gian < 60 s (÷100); hằng số 50 000 < `HAN_DOI_SOAT_MS` 60 000 của màn |
| B3 | HTTP thật: khách bỏ kết nối khi câu đang chậm → log `bo_giua <bước>`, không chạy bước sau (số câu dừng) |
| B4 | màn DoiSoat.jsx thật + api.js thật: 503 DOI_SOAT_QUA_HAN → hiện lời máy chủ, nút "Đối soát" bấm lại được, gửi đúng 1 lần |
| C1 | (1) kho giả một câu không trả lời: bài thử chạy chayDoiSoat với hạn ngoài 20 s ÷100 — gốc TREO → ĐỎ. (2) dữ liệu cũ + dòng lệch I1–I8 (phanLoai gọi `tra`): chạy xong / không treo. HTTP libsql remote: không có máy chủ libsql (`sqld`) → CHƯA KIỂM |
| C3 | `viec/GIAO-3/do_doisoat.js --tre 0 --goc <gốc> --ra` ngày / tuần / tháng → `cmp` giống hệt (đối chứng như GIAO-3 D2) |
| D1 | câu chậm 2 s (÷100) vẫn chờ được, không lỗi; kết quả bình thường không có `DOI_SOAT_QUA_HAN` |
| D2 | `query` không truyền `han` không có hẹn giờ: câu chậm 20 s (÷100, quá hạn đối soát) vẫn trả kết quả; `run` / giao dịch không đổi; bộ kiểm + giả lập xanh |
| E1/E2 | `npm test`, `--day-du`, `cong.js chay`; thao tác chủ quán ghi ở trang_thai |

Hai người cùng bấm: hai lượt chạy chồng → mỗi lượt đếm câu của riêng mình (AsyncLocalStorage) — ca A1 chạy hai lượt song song, mỗi dòng cuối đúng
số câu của lượt.

## 4. Đường song song (K4)
- `chiDoc` là MỘT cửa của mọi câu Đối soát (bat_bien q, phanLoai tra, phép D1/DEN/CK/XNT, tongHop/tienTheoSo, doiSoatGiao, soHoaDonNgay, soKet,
  sao_ke) — grep `db.query\|db.queryOne` trong doiSoat.js: chỉ trong chiDoc. `soSach` (route /so-sach VÀ Báo cáo ngày /daily, reports.js) cũng qua
  chiDoc nhưng NGOÀI lượt → KHÔNG hạn giờ (soát kế hoạch: Báo cáo ngày là câu đọc ngoài Đối soát — Cấm).
- `doCau` chạy cho `query`, `run` và câu trong giao dịch → "đang chờ" đếm cả câu giao dịch (đúng nghĩa: câu kho đã gửi chưa trả lời).
- `queryOne` gọi `query` không truyền han → không đổi. `run`, giao dịch (`beginTransaction`) không đụng.
- `doCau` dùng cho `query` và `run`: chỉ thêm đếm `cho`, không đổi giá trị trả / lỗi.

## 5. Luồng hợp lệ phải KHÔNG bị chặn (K5)
Đối soát bình thường; câu chậm dưới hạn; hai lượt song song; route /so-sach; mọi đường bán / thu (query không han); câu treo lần đầu rồi đọc lại được.

## 6. Soát kế hoạch (agent chỉ đọc) — đã nhận
- Hạn giờ chỉ trong lượt Đối soát (soSach của /daily không hạn) — đã sửa mục 4.
- Quá hạn không đi qua `thayKetNoiNeuBan` / `loiKho`: nhánh `quaHan` riêng trong catch của query, ném nguyên KHO_QUA_HAN (đột biến VS-qua-han-thanh-mat-ket-noi).
- Có dùng `baoRot` cho quá hạn: dòng `[KET-NOI] doc lan k/3 KHO_QUA_HAN` + đếm `rot` — câu kho không trả lời là một kiểu rớt, nên hiện ở sức khoẻ kết nối.
- C2: đột biến BV-han-cau / BV-ngu-canh-luot đưa lỗi treo cũ trở lại. C3 kiểm có dòng lệch thật (đỏ 82 / 142 / 1.042).
- Đề xuất bỏ tham số `han` của query để chép vòng đọc lại vào chiDoc: KHÔNG nhận — hai vòng đọc lại là hai chỗ cùng quy tắc (LUAT §2 "một quy tắc — một hàm").
