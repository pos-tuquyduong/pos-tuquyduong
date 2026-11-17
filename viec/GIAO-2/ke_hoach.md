# GIAO-2 — kế hoạch

Đọc trong lượt này (main 0c84944): `server/routes/giao-hang.js:34-41` (cửa tin báo `await gh.nhanTinBao` rồi mới trả), `server/utils/giaoHang.js:405-418`
(nhanTinBao: thẻ dang_goi → 409; đọc lại chuyến; INSERT OR IGNORE pos_giao_tin; capNhatTuAhamove), `:427-441` (danhSach: đọc lại TUẦN TỰ tối đa 3 chuyến
quá 60 s, `catch {}` rỗng ở :438), `server/utils/ahamove.js:10` (HAN_GOI_MS 10000 cho MỌI lời gọi, kể cả lấy token), `:80-91` (docChuyen KHÔNG gỡ
mảng; traTheoMa CÓ gỡ mảng `Array.isArray(j) ? j[0] : j`), `:96-103` (tomChuyen: `ma = String(o._id || o.order_id)` → thân bọc thì ma = 'undefined'),
`client/src/pages/GiaoHang/index.jsx:52-59` (tai() dùng chung cho hẹn 15 s và nút "Tải lại"), `client/src/utils/api.js:429`.

## A. Trả lời ngay

| | Phương án A (chọn) | Phương án B |
|---|---|---|
| Cách | Route kiểm khoá → `res.json({success:true})` → `gh.xuLyTinNen(body)` (Promise không await, `.catch` ghi log, giữ trong một Set để bài thử chờ được) | Hàng đợi trong bộ nhớ + vòng xử lý, gộp tin cùng chuyến |
| File / dòng | giao-hang.js ~3 · giaoHang.js ~15 | ~40 dòng |
| Rủi ro | Máy chủ khởi động lại giữa chừng → mất tin → dự phòng đọc lại lo (phiếu đã nhận) | Thêm trạng thái, thêm lỗi |

- nhanTinBao giữ NGUYÊN logic (đọc lại chuyến thật, chống lặp, capNhatTuAhamove); chỉ thôi trả mã HTTP. Thẻ `dang_goi` (A4): bỏ qua, KHÔNG ghi sổ
  chống lặp — tin của chuyến CŨ (chuyến mới chưa có mã trên thẻ); goiXe tự đọc chuyến cũ; trạng thái thẻ sau khi gọi xe do dự phòng 60 s / "Tải lại" đọc.
  Cách đơn giản nhất phiếu cho ("dựa dự phòng").
- Hai tin cách 49 ms (A3): cả hai đọc lại, INSERT OR IGNORE chỉ cho một bản ghi → capNhat MỘT lần (khoá có sẵn). Không gộp thêm: mỗi tin đúng một lần đọc.
- Lỗi nền (A2): `console.error('[GIAO] tin <mã> lỗi <code|tên lỗi>')` — không in `e.message` của CSDL, không thân tin, không khoá.
- Bài thử cũ: `baoVe` trong thu_GIAO1 chờ `giaoHang.choTinBao()` sau khi nhận trả lời (một dòng); V10 đổi 409 → 200 (C1, LUAT §6.8).

## B. Dự phòng đọc lại

- **B1 (nguyên nhân)** — KHÔNG mở được tài liệu Ahamove từ máy (mạng chặn developers.ahamove.com) → không đối chiếu được dạng tin thật. Điều đọc được
  trong code: (1) mọi lỗi của đường đọc lại bị nuốt (`catch {}` :438 — kể cả lỗi Turso "socket hang up" trong capNhat) → không nhìn ra gì; (2) chuyến
  đọc về mà mã không khớp (`d.ma !== c.ma_ahamove`) hoặc trạng thái lạ (`trangThaiQuan` null) → capNhat `return` IM LẶNG; (3) docChuyen không gỡ bọc
  trong khi traTheoMa cùng file gỡ mảng (K4 lệch hai đường đọc cùng một đối tượng) — thân `[order]` / `{order}` / `{data}` → ma 'undefined' → thẻ
  không bao giờ đổi, không log. Vá: hàm chung `motChuyen` gỡ mảng / `order` / `data` cho cả docChuyen và traTheoMa (đọc RỘNG — khuôn baoPhi) + log mọi
  lần bỏ qua (B3). Ca B1 tái hiện (3) trên Ahamove giả: ĐỎ trên gốc. Ghi rõ trong báo cáo: đây là GIẢ THUYẾT mạnh nhất máy tái hiện được, CHƯA đối
  chiếu Ahamove thật; log B3 sẽ cho thấy lần thử sau.
- **B2 (hạn)** — A: `HAN_DOC_LAI_MS = 4000` chỉ cho đọc lại từ màn Giao hàng (truyền `han` qua docChuyen → goi → goiTho, cả lấy token) + đọc các chuyến
  SONG SONG → yêu cầu của màn chờ Ahamove tối đa ~4 s (+ lấy token lần đầu ~4 s), không cộng dồn theo số chuyến. Gọi xe / huỷ / tin nền giữ 10 s (hết
  giờ khi TẠO chuyến = "chưa rõ đã gọi chưa", hạn ngắn làm tăng ca đó). B: hạ HAN_GOI_MS chung → tăng ca gọi xe "mất mạng". Chọn A.
- **B4 (Tải lại)** — `GET /api/pos/giao-hang?doc_lai=1` (chỉ nút "Tải lại"); máy chủ đọc chuyến sống có `doc_luc` cũ hơn `DOC_LAI_TAY_GIAY = 5`
  (chặn bấm dồn: câu giành `doc_luc` có sẵn), tối đa `DOC_LAI_TAY_TOI_DA = 8` chuyến; hẹn 15 s giữ 60 s / 3 chuyến. Client: `tai(true)` ở nút, api
  `danhSach(docLai)`. ~8 dòng máy chủ, ~3 dòng client.
- **B3 (log)** — một hàm `logGiao(nguon, c, d, t0)`: `[GIAO] <mã> <trạng thái Ahamove> → <trạng thái thẻ đích | bỏ qua: lý do> · <ms>ms`; lỗi đọc
  lại: `[GIAO] doc_lai <mã> lỗi <code>`. Không SĐT / tên tài xế / địa chỉ.

## Ca thử ↔ nghiệm thu (`cong_cu/thu_GIAO2.js`, Ahamove giả + kho tạm, khuôn thu_GIAO1)

| Nghiệm thu | Ca |
|---|---|
| A1 | A1a Ahamove giả chậm 8 s + kho chậm 300 ms/câu → cửa trả 200 < 1 s; A1b khoá sai / thiếu → 401, chưa cài khoá → 503 (như cũ), Ahamove không bị gọi |
| A2 | A2a sau khi chờ nền xong: thẻ doi_tai_xe + tài xế (đọc lại THẬT, thân nói COMPLETED); A2b Ahamove lỗi đọc → 200, có log `[GIAO]` lỗi kèm mã, máy chủ còn trả lời; A2c kho ném lỗi trong nền → không sập tiến trình (không unhandledRejection), có log |
| A3 | Hai tin cùng chuyến cách 49 ms → 1 dòng pos_giao_tin, thẻ cập nhật một lần, cả hai 200 |
| A4 | Thẻ dang_goi → 200, không ghi pos_giao_tin; sau khi thẻ về tim_xe tin sau được áp |
| A5 | Mã lạ / thân rỗng → 200, Ahamove không bị gọi đọc, không ghi gì |
| B1 | Ahamove giả trả chi tiết chuyến bọc mảng / `{order}` → đọc lại dự phòng (65 s) đưa thẻ lên doi_tai_xe + tài xế |
| B2 | Ahamove treo 8 s → `GET ?doc_lai=1` trả < 6 s, thẻ giữ nguyên, có log lỗi; hẹn 15 s (không cờ) cùng thế |
| B3 | Log đọc lại / tin có dạng `[GIAO] <mã> ACCEPTED → doi_tai_xe · Nms`; không SĐT tài xế, không địa chỉ, không khoá / token trong toàn nhật ký |
| B4 | Tin mất, doc_luc mới (10 s) → GET không cờ: tim_xe (giữ mốc 60 s); `?doc_lai=1` → doi_tai_xe + tài xế ngay lần đó; bấm lại ngay → Ahamove không bị đọc thêm; 9 chuyến chờ → đọc đúng 8 |
| B5 | Không làm lại — H12 của thu_GIAO1 (60 s) còn xanh |
| C1 | `node cong_cu/thu_GIAO1.js` xanh, chỉ V10 đổi (409 → 200) |
| C2 | thu_GIAO1 G*, I*, J*, V*, W* (gọi xe, tìm lại, huỷ, chuyến trùng, phí huỷ, tự tìm lại) xanh không sửa |

Đường song song (K4): mọi chỗ gọi `aha.docChuyen` (giaoHang.js 218, 255, 323, 351 + nhanTinBao + danhSach) — gỡ bọc ở MỘT hàm nên cả 6 chỗ cùng
được; mọi `catch` rỗng / `.catch(() => …)` của đường đọc lại (438, 441 docLaiPhiHuy) → 438 ghi log; 441 (phí huỷ) giữ ngoài việc, ghi Phát hiện nếu
còn nuốt. Luồng hợp lệ KHÔNG bị chặn (K5): khoá đúng → luôn 200; chuyến không bọc (dạng hiện tại) vẫn đọc đúng (toàn bộ thu_GIAO1); hẹn 15 s không cờ
vẫn đọc chuyến quá 60 s (H12); gọi xe / tìm lại vẫn dùng hạn 10 s.

Ngân sách: máy chủ ~45 dòng, client ~3, thử ~250.
