# GIAO-2 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: viec/GIAO-2 · cây sạch
- HEAD 0c84944 · FETCH_HEAD 0c84944 (bằng nhau — không kéo)
```
0c84944 PHIEU: GIAO-2 bo sung B4 Tai lai hoi Ahamove ngay, B5 phan da co (chu quan 16.11 14:28)
4c52117 PHIEU: GIAO-2
1d66c61 Merge pull request #97 from pos-tuquyduong/viec/SAOLUU-DEM-1
```

## Kế hoạch / soát kế hoạch (bước 3)
- `ke_hoach.md`. Agent phụ soát kế hoạch (chỉ đọc) — đã nhận: (1) sổ chống lặp ghi TRƯỚC khi cập nhật thẻ → kho hỏng giữa chừng thì tin lặp bị bỏ mãi
  (thêm ca A2d + vá gỡ dòng); (2) A3 phải chạy khi cả hai tin cùng đang xử lý + đếm câu cập nhật; (3) A4 không gửi tin thứ hai (Ahamove đã nhận 200
  thì không gửi lại) — phục hồi bằng "Tải lại"; (4) A5 thêm ca "chuyến cũ đã thay"; (5) `.then(tai)` ở in tem sẽ truyền đối số lạ → sửa `() => tai()`;
  (6) `baoVe` của thu_GIAO1 phải gom cả nhật ký phần nền (quét khoá A3); (7) bỏ gỡ `{data}` (đoán), chỉ gỡ mảng / `{order}`.
- Không nhận: hàm chờ `choTinBao` (giữ — bài thử cần chờ phần nền, một Set nhỏ); `docLaiPhiHuy` (đường phí huỷ — Cấm "không đụng tiền") → Phát hiện.

## Chỗ vá → đột biến (viec/GIAO-2/dot_bien.py)
| Chỗ vá | Đột biến |
|---|---|
| routes/giao-hang.js cửa tin báo: trả 200 rồi mới xử lý | BV-tra-loi-ngay · VS-200-truoc-khoa |
| giaoHang.js nhanTinBaoNen: lỗi nền chỉ ghi log | VS-nen-khong-bat-loi |
| giaoHang.js nhanTinBao: thẻ dang_goi bỏ qua, không 409 | BV-tin-dang-goi · VS-tin-dang-goi-409 |
| giaoHang.js nhanTinBao: gỡ dòng chống lặp khi cập nhật thẻ hỏng | BV-go-chong-lap · VS-go-chong-lap-moi-trang-thai |
| ahamove.js motChuyen (gỡ mảng / {order}) | BV-mot-chuyen · VS-mot-chuyen-chi-mang |
| hạn đọc lại 4 s (HAN_DOC_LAI_MS, goiTho `han`) | BV-han-doc-lai · BV-han-goi-tho |
| danhSach: log lỗi đọc lại (hết `catch {}`) | BV-log-loi-doc-lai |
| (vòng sửa 1) docLaiPhiHuy: hạn 8 s, song song, chạy cùng lúc đọc thẻ, log lỗi | BV-han-phi-huy · VS-phi-huy-sau-the · BV-log-phi-huy |
| (vòng sửa 1) chống lặp `changes` (A3) | BV-chong-lap-changes |
| (vòng sửa 1) log tin bị bỏ qua; log in giá trị capNhatTuAhamove trả | BV-log-tin-bo-qua · VS-log-suy-lai |
| (vòng sửa 2) mỗi nhánh đọc lại / phí huỷ tự bắt lỗi, log đúng bước; phí huỷ song song; lấy token theo hạn ngắn | VS-phi-huy-loi-chung · VS-phi-huy-tuan-tu · BV-han-lay-token |
| danhSach: "Tải lại" đọc ngay (5 s), trần 8, hẹn 15 s giữ 60 s | BV-doc-lai-ngay · VS-tai-lai-khong-chan-don · VS-tai-lai-ca-hen-gio · VS-tran-tai-lai · BV-cua-doc-lai |
| logGiao: dòng [GIAO] không SĐT | BV-log-giao · VS-log-sdt-tai-xe |
| màn Giao hàng / api.js: nút Tải lại gửi cờ | BV-nut-tai-lai · VS-in-tem-truyen-doi-so · BV-api-doc-lai |

## Soát độc lập — vòng 1 (/ra-soat, agent độc lập) — chép nguyên ý báo cáo
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
- server/utils/giaoHang.js:472 `await docLaiPhiHuy()` + :219-225 — đọc lại phí huỷ trong CÙNG GET danh sách vẫn hạn 10 s, lần lượt ≤ 3 chuyến; B2a xanh oan vì kho không có dòng CHO_PHI_HUY — K4 + K3. (Dòng CHO_PHI_HUY mà Ahamove không bao giờ báo CANCELLED bị đọc lại mãi — có từ trước → Phát hiện.)
- giaoHang.js:221 `.catch(() => null)` và :472 `.catch(() => { … })` vẫn nuốt lỗi đọc lại; trang_thai chưa có mục Phát hiện đã hứa — K4.
- giaoHang.js:28 và ahamove.js:10 chú thích "màn chờ tối đa ~4 s" sai (còn docLaiPhiHuy, lấy token) — K1.
- giaoHang.js:407-411 logGiao tự suy trạng thái đích bằng trangThaiQuan, không phải điều capNhatTuAhamove làm (vd thẻ dang_giao + ACCEPTED cũ vẫn in "→ doi_tai_xe") — K1/K4.
- giaoHang.js:421, 427-441 — tin bị bỏ qua (không phải của quán, dang_goi, lặp) không có log; logLoi luôn ghi bước 'xử lý tin' — K4 (nhẹ).
NGHI NGỜ: B1 chỉ đỏ trên dạng bọc do Ahamove giả tự bọc (giả thuyết); giả thuyết khác: Ahamove thử chậm ≥ 5 s → hạ hạn 4 s có thể làm dự phòng hỏng nhiều hơn (số chưa đo); motChuyen gỡ {order} cũng áp cho traTheoMa; A3 không có đột biến; A1a ngưỡng < 1 s với kho 300 ms/câu còn rộng; đọc song song lúc chưa có token → nhiều lời lấy token cùng lúc.
NGHIỆM THU: 9/12 · thiếu B2, B3, B5 (B5: chưa ghi trong báo cáo cho chủ quán "Render không có hẹn giờ nền").
CHƯA SOÁT ĐƯỢC: chạy lại thu_GIAO2 trên gốc (người gác chặn nối node_modules); `--day-du`, cổng `cong.js chay`; tài liệu Ahamove; Turso / Render thật.
BÀI HỌC: KHOÁ — B2 có ca CHO_PHI_HUY + Ahamove treo; đột biến A3. NGUYÊN TẮC — log chẩn đoán in điều code ĐÃ làm (giá trị hàm trả); hạ hạn / sửa nuốt lỗi một đường thì grep mọi lời gọi ra ngoài trong CÙNG yêu cầu; không hạ thời gian chờ dưới độ trễ chưa đo của sự cố đang sửa.

## Vòng sửa 1 (sau soát vòng 1)
- giaoHang.js: `docLaiPhiHuy` đọc song song, hạn HAN_DOC_LAI_MS, chạy CÙNG LÚC với đọc thẻ, lỗi ghi `[GIAO] phi_huy <mã> lỗi …` (logic phí không đổi:
  vẫn CANCELLED → ghiPhiHuy một lần mỗi mã; chưa ra → xếp cuối). HAN_DOC_LAI_MS 4 s → 8 s (người soát: không hạ dưới độ trễ chưa đo; 8 s > 5,1 s của
  sự cố, < nhịp hỏi 15 s). `capNhatTuAhamove` trả ĐIỀU ĐÃ LÀM (trạng thái mới / "bỏ qua: …"); log in đúng giá trị đó. Tin bị bỏ qua (không phải của quán,
  thẻ đang gọi xe, tin lặp) có log. Lỗi ghi rõ bước: đọc kho / đọc Ahamove / ghi kho. Chú thích hạn ở ahamove.js:10 và giaoHang.js sửa cho đúng.
- thu_GIAO2: A1a kho chậm 1,5 s/câu (mọi câu kho trước khi trả → > 1 s); B2 Ahamove treo 12 s với 2 chuyến + 1 dòng "phí huỷ chưa rõ"; B3c, B3d mới.
- Đột biến: 28 · BẮT 28 (lần chạy đủ: 26 BẮT + 2 HỎNG do neo cũ → sửa neo, chạy lại riêng 2 cái: BẮT).

## Phát hiện (ngoài việc / không sửa)
- giaoHang.js docLaiPhiHuy: dòng CHO_PHI_HUY mà Ahamove không bao giờ báo CANCELLED bị đọc lại ở MỌI lần màn hỏi, mãi mãi (chỉ đổi `luc`) — có từ GIAO-1.
- Đọc lại song song lúc chưa có token (sau khi máy chủ khởi động lại): nhiều lời lấy token Ahamove cùng lúc (ahamove.js `goi`) — nhỏ, chưa sửa.
- Các chỗ gọi `aha.docChuyen(...).catch(() => undefined)` trong goiXe / huyChuyenGiao (giaoHang.js đường gọi xe / huỷ) vẫn nuốt lỗi — ngoài B3 (B3 chỉ đòi tin
  báo + đọc lại dự phòng), đụng đường gọi xe (C2 không đổi) → để việc sau.
- viec/GIAO-1/dot_bien.py: neo `try { d = await aha.docChuyen(ma); }`, `if (doiLai >= DOC_LAI_TOI_DA) break;`, `if (c.trang_thai === 'dang_goi') return loi(409…`
  không còn khớp (code đã đổi) — bộ đột biến cũ của GIAO-1 sẽ báo HỎNG ở 3 tên đó (ngoài Phạm vi).
- Render không có hẹn giờ nền: "tự hỏi lại" chỉ chạy khi màn Giao hàng ĐANG MỞ ở quầy (hẹn 15 s, mốc 60 s) hoặc khi bấm "Tải lại".

## Soát độc lập — vòng 2 (agent độc lập) — tóm nguyên ý
KHÔNG ĐẠT (chỉ lỗi NHẸ; không đụng tiền / điểm / ví, không lộ thông tin, không ngoài Phạm vi, không file Cấm)
LỖI TÌM ĐƯỢC:
1. giaoHang.js:30-32 chú thích HAN_DOC_LAI_MS "≤ ~8 s (+ token 8 s), dưới nhịp 15 s" sai: 8+8=16; nhánh tài xế huỷ → tự tìm lại (taoChuyenMoi: traTheoMa / baoPhi / taoChuyen) chạy trong cùng GET với hạn 10 s — K1, NHẸ.
2. giaoHang.js:461, :469, :432 — nhãn bước hỏng sai: :461 luôn 'ghi kho' mã '-'; :469/:432 gán 'ghi kho' cho mọi lỗi của capNhatTuAhamove (kể cả đọc pos_orders) — K1/K4, NHẸ.
3. giaoHang.js:222 Promise.all trong docLaiPhiHuy chỉ báo lỗi đầu, các lỗi sau bị nuốt; :463 câu giành doc_luc ngoài try — lỗi đầu làm GET 500, lỗi sau nuốt — K4, NHẸ.
4. thu_GIAO2 B2a chỉ 1 dòng CHO_PHI_HUY, token có sẵn: đột biến "docLaiPhiHuy tuần tự" sẽ SỐNG; nhánh lấy token theo hạn ngắn chưa có ca — K3, NHẸ.
NGHI NGỜ: B1 vẫn giả thuyết (báo cáo cuối phải nói rõ); HAN 8 s < 10 s cũ khi độ trễ thật chưa đo; nhiều giao dịch ghiPhiHuy đồng thời (không cộng hai lần — UNIQUE + INSERT OR IGNORE trong tx) có thể tăng KHO_BAN; hẹn 15 s cắt 3 chuyến rồi mới giành (hai máy → đọc ít hơn, không chặn); đọc phí huỷ không chặn bấm dồn (có từ trước, đã ghi Phát hiện).
NGHIỆM THU: 12/12 (B1 cần câu "giả thuyết" trong báo cáo cuối).
CHƯA SOÁT ĐƯỢC: đủ 28 đột biến (chạy 4), --day-du, cổng chay, tài liệu Ahamove, độ trễ thật, Turso thật.
BÀI HỌC: KHOÁ — B2 nhiều dòng CHO_PHI_HUY + token chưa lấy; hai nhánh song song cùng hỏng đều có log. NGUYÊN TẮC — đổi tuần tự sang Promise.all thì bắt lỗi TRONG từng nhánh; chú thích "chờ tối đa X" cộng MỌI lời gọi ra ngoài của cùng yêu cầu kể cả hàm phụ; nhãn bước đặt ở đúng câu hỏng.

## Vòng sửa 2 (sau soát vòng 2 — chỉ lỗi NHẸ)
- giaoHang.js docLaiPhiHuy: mỗi dòng tự bắt lỗi (đọc Ahamove / ghi kho) + log kèm mã chuyến; câu đọc kho lỗi → log, trả rỗng; không bao giờ ném.
- giaoHang.js danhSach: mỗi nhánh đọc thẻ tự bắt lỗi theo bước (ghi kho ở câu giành doc_luc · đọc Ahamove · cập nhật thẻ) — lỗi câu giành không còn làm
  GET 500 (giữ thẻ cũ, ghi log). nhanTinBao: lỗi của capNhatTuAhamove ghi bước "cập nhật thẻ"; `!d` ghi thẳng "bỏ qua: Ahamove không có chuyến".
- Chú thích HAN_DOC_LAI_MS sửa đúng: thường ≤ 8 s, lấy token lần đầu ≤ 16 s, riêng nhánh tự tìm lại gọi xe theo hạn 10 s.
- thu_GIAO2 B2: 3 dòng phí huỷ + kho hỏng ở câu xếp lại (log đủ cả ba); B2c: token hết hạn, lấy token treo 12 s → < 10 s.
- Bằng chứng: gốc 8 đạt · 19 hỏng; đã vá 27 đạt · 0 hỏng; thu_GIAO1 137 · 0. Đột biến: 31 · BẮT 31 · SỐNG 0 · HỎNG 0 · LẠC 0 (đối chứng XANH).

## Soát độc lập — vòng 3 (agent độc lập, lần cuối) — tóm nguyên ý
KHÔNG ĐẠT — chỉ lỗi NHẸ (không tiền / điểm / ví, không lộ thông tin, không ngoài Phạm vi, không file Cấm). Vòng sửa 2 xử lý đủ 4 lỗi vòng 2.
LỖI TÌM ĐƯỢC:
1. giaoHang.js:442 nhanTinBaoNen — hàm bắt lỗi gọi lại `String(b?._id …)`: thân `{"_id":{"toString":1}}` → nhanTinBao ném, hàm bắt lỗi ném TypeError, `.finally` chuyền tiếp → unhandledRejection → Node 22 sập tiến trình (gốc chỉ trả 500). Cần khoá đúng → NHẸ. K4 + K3 (A2c không thử thân dị dạng).
2. Hai chỗ vá vòng 2 không có ca / đột biến: :467-468 `.catch` câu giành doc_luc (gỡ → GET 500, bài vẫn xanh); :435/:473 nhãn "cập nhật thẻ" — K3, NHẸ.
3. :433-435 DELETE dòng chống lặp ném → lỗi gốc bị thay, log "xử lý tin", dòng chống lặp nằm lại không ai biết — K4, NHẸ.
NGHI NGỜ: chú thích :31-32 "hạn 10 s" dễ đọc nhầm là trần (taoChuyenMoi gọi 3 lời nối nhau ~30 s); B1 giả thuyết; HAN 8 s chưa đo; slice-rồi-giành; mã từ thân tin vào log không lọc xuống dòng.
NGHIỆM THU: 12/12 (A2 có lỗ ở lỗi 1).
CHƯA SOÁT ĐƯỢC: 27/31 đột biến, --day-du, cổng chay, tài liệu Ahamove, độ trễ thật.
BÀI HỌC: KHOÁ — mỗi chỗ vá người soát báo có một ca / đột biến đưa lỗi cũ trở lại; phần nền có ca thân tin dị dạng. NGUYÊN TẮC — hàm bắt lỗi không làm lại phép tính vừa ném; log trong `.catch` chỉ dùng giá trị đã tính an toàn.

## Soát bảo mật
(/soat-bao-mat — một subagent độc lập, chỉ đọc, trên diff `4c52117^..beb75713`; lỗi trước lọc: 0 · sau lọc: 0 — không có lỗi nên không cần bước lọc)

No vulnerabilities found.

- Webhook check unchanged (`server/routes/giao-hang.js`, `webhook.post('/')`): 503 khi chưa cài khoá và kiểm header `apikey` bằng `timingSafeEqual` vẫn chạy TRƯỚC mọi thứ; nhánh chỉ đổi phần sau: trả `{success:true}` ngay rồi gọi `gh.nhanTinBaoNen(req.body)`. Không có khoá thì không tới code mới.
- Webhook body still not trusted (`server/utils/giaoHang.js`): `maTin` chỉ nhận chuỗi / số, bỏ ký tự ngoài `[A-Za-z0-9_-]`, cắt 40 ký tự; tra bằng câu có tham số (`WHERE ma_ahamove = ?`); trạng thái vẫn đọc lại từ Ahamove bằng khoá của quán; phát lại vẫn chống lặp bằng `INSERT OR IGNORE INTO pos_giao_tin` — bước gỡ dòng chống lặp khi cập nhật hỏng chỉ mở lại việc áp trạng thái THẬT, vô hại.
- `?doc_lai=1`: vẫn sau `authenticate`; chỉ cho nhân viên đọc lại ngay ≤ 8 chuyến; câu giành `doc_luc` chặn đọc trùng; không đụng tiền, không lộ dữ liệu.
- Logs (`logGiao` / `logLoi`): chỉ mã chuyến (đã lọc, ≤ 40 ký tự), trạng thái Ahamove, kết quả, mã lỗi / tên lỗi, HTTP status — không SĐT / tên tài xế, không địa chỉ khách, không token / khoá. `han` thêm vào lời lấy token chỉ đổi hạn chờ.
- `motChuyen` (`server/utils/ahamove.js`): chỉ gỡ bọc; `capNhatTuAhamove` vẫn chặn chuyến lệch mã (`d.ma !== c.ma_ahamove`).
- Client (`GiaoHang/index.jsx`, `api.js`): chỉ thêm cờ Tải lại, qua `api.js`; không `fetch` trần, không HTML không an toàn.
- Không đụng giá, thanh toán, hay quyền xem dữ liệu khách.

SOÁT BẢO MẬT: ĐẠT

## Vòng sửa 4 (LUAT §6.5 — hết 3 vòng soát, chỉ còn lỗi NHẸ → sửa luôn, không gọi soát nữa)
- giaoHang.js: `maTin(b)` tính mã MỘT lần trong nhanTinBaoNen — chỉ nhận chuỗi / số, bỏ hậu tố `-n`, chỉ giữ `[A-Za-z0-9_-]`, ≤ 40 ký tự; hàm bắt lỗi
  dùng giá trị đã tính (thân `{"_id":{"toString":1}}` không còn làm sập tiến trình; mã có xuống dòng không chèn được dòng log). nhanTinBao nhận `ma`.
- giaoHang.js: câu gỡ dòng chống lặp hỏng → log "lỗi gỡ dòng chống lặp" riêng, lỗi gốc vẫn ghi "lỗi cập nhật thẻ".
- Chú thích HAN_DOC_LAI_MS: nhánh tự tìm lại = 3 lời gọi nối nhau mỗi lời 10 s → lần hỏi đó có thể ~30 s.
- thu_GIAO2: A2d kiểm thêm log "lỗi cập nhật thẻ"; A2e (thân dị dạng), A2f (hỏng cả gỡ chống lặp), B2d (hỏng câu giành → GET 200 + log). 30 ca.
- Đột biến thêm: VS-ma-tinh-lai · BV-ma-loc-ky-tu · BV-xoa-chong-lap-bat-loi · BV-nhan-cap-nhat-the · BV-gianh-bat-loi. Tổng 36 · BẮT 36 (chạy đủ: 35 BẮT +
  1 HỎNG neo cũ BV-go-chong-lap → sửa neo, chạy riêng: BẮT). Đối chứng XANH (g1 137/0 · g2 30/0).
- Bảng chỗ vá → đột biến bổ sung:

| Chỗ vá | Đột biến |
|---|---|
| (vòng sửa 4) mã tin tính một lần, lọc ký tự | VS-ma-tinh-lai · BV-ma-loc-ky-tu |
| (vòng sửa 4) lỗi gỡ chống lặp không che lỗi gốc; nhãn "cập nhật thẻ" | BV-xoa-chong-lap-bat-loi · BV-nhan-cap-nhat-the |
| (vòng sửa 4) câu giành doc_luc tự bắt lỗi | BV-gianh-bat-loi |

- npm test -- --day-du: PASS 124 · FAIL 0 · CẢNH BÁO 1 (cảnh báo cũ: route GET có lệnh ghi ở packages.js / products.js / sync.js — không thuộc việc này).
- `node tu_chay/cong.js chay . 4c52117^ HEAD viec/GIAO-2` ở e6beafc8 (cây sạch): ✓ CỔNG CHẠY ĐẠT
- Ghi chú môi trường: kho mở ở dạng NÔNG làm bài thu_BH2 trong npm test đỏ (thiếu commit cbbb809) → đã `git fetch -q --unshallow origin viec/GIAO-2` (chỉ tải lịch sử).

SOÁT LẦN CUỐI: chat soát thay

## Nghiệm thu — đếm từng mục
- A1 trả lời ngay: thu_GIAO2 A1a (Ahamove 8 s + kho 1,5 s/câu → 200 < 1 s), A1b (401 / 401 / 503, Ahamove không bị đọc); đột biến BV-tra-loi-ngay, VS-200-truoc-khoa.
- A2 xử lý sau, lỗi chỉ log, không sập: A2a (đọc lại THẬT), A2b (Ahamove lỗi → log), A2c (kho hỏng → log, không unhandledRejection), A2d (gỡ dòng chống lặp),
  A2e (thân dị dạng), A2f (log đủ hai lỗi); đột biến VS-nen-khong-bat-loi, BV-go-chong-lap, VS-ma-tinh-lai, BV-xoa-chong-lap-bat-loi.
- A3 hai tin cách 49 ms → một dòng chống lặp, câu cập nhật thẻ chạy MỘT lần: A3; đột biến BV-chong-lap-changes.
- A4 thẻ dang_goi → 200, không ghi sổ, "Tải lại" đọc ra trạng thái: A4 + thu_GIAO1 V10 (409 → 200); đột biến BV-tin-dang-goi, VS-tin-dang-goi-409.
- A5 không phải của quán / chuyến cũ đã thay / thân rỗng → 200 không làm gì: hai ca A5.
- B1 nguyên nhân: GIẢ THUYẾT (xem CHƯA KIỂM) — ca B1 ×2 (chi tiết chuyến bọc mảng / {order}) đỏ trên gốc; log B3 để lần thử sau nhìn ra.
- B2 hạn có tên, không treo màn: HAN_DOC_LAI_MS (giaoHang.js); B2a (Ahamove treo 12 s, 2 chuyến + 3 phí huỷ → < 10 s), B2c (lấy token treo → < 10 s), B2d.
- B3 log + hết nuốt lỗi: B3a, B3b (không SĐT / địa chỉ), B3c (tin bỏ qua có log), B3d (log in điều ĐÃ làm), B2b (lỗi đọc lại + phí huỷ có log đúng bước).
- B4 "Tải lại" hỏi ngay: B4a (hẹn 15 s giữ 60 s), B4b (đọc ngay), B4c (bấm dồn không đọc thêm), B4d (trần 8), Z3 (nút gửi cờ).
- B5 không làm lại: thu_GIAO1 H12 (60 s) xanh; Render không có hẹn giờ nền — ghi ở Phát hiện và CHƯA KIỂM.
- C1 thu_GIAO1 137/137, chỉ V10 đổi (đỏ trên gốc — bang_chung_do.txt).
- C2 gọi xe / tìm lại / huỷ / chuyến trùng / phí huỷ / tự tìm lại: thu_GIAO1 G*, I*, J*, V*, W* xanh không sửa.

## Bài học
Sự cố của việc: (1) tài liệu Ahamove không mở được (mạng chặn) → B1 chỉ tới giả thuyết; (2) agent soát kế hoạch bắt lỗi thật đầu tiên — sổ chống lặp ghi
TRƯỚC khi cập nhật thẻ; (3) ba vòng soát đều bắt thêm: đường đọc phí huỷ cùng yêu cầu bị sót (K4), log tự suy lại thay vì in điều đã làm, Promise.all chỉ
báo lỗi đầu, hàm bắt lỗi làm lại phép tính vừa ném (sập tiến trình); (4) neo đột biến lạc sau mỗi vòng sửa (3 lần HỎNG) — sửa neo rồi chạy lại riêng;
(5) người gác chặn chạy file script có cụm tên khoá Ahamove chưa commit → commit trước; (6) kho nông làm thu_BH2 đỏ → unshallow.
- KHOÁ (ngoài Phạm vi — đề xuất): `kiem_tra_truoc_khi_giao.js` — phép tĩnh "trong server/, thân `.catch(` gọi `String(b?.…)` / `String(req.body…)`" đỏ; ca đỏ:
  giaoHang.js ở d7827cb7^ (dòng nhanTinBaoNen). Chưa làm (phép hẹp; ca A2e đã khoá hành vi).
- KHOÁ (đã làm trong Phạm vi): thu_GIAO2 A2e / A2f / B2b / B2c / B2d — mỗi lỗi người soát báo có ca đỏ + đột biến đưa lỗi cũ trở lại.
- NGUYÊN TẮC (đề xuất cho KHUON_LOI.md, ngoài Phạm vi): K4 — "Đổi vòng tuần tự sang Promise.all → bắt lỗi TRONG từng nhánh (all chỉ báo lỗi đầu, các lỗi sau
  bị nuốt). Hạ hạn chờ / bỏ nuốt lỗi cho một đường → grep MỌI lời gọi ra ngoài trong CÙNG yêu cầu, kể cả hàm phụ (GIAO-2: danhSach → docLaiPhiHuy)."
- NGUYÊN TẮC (đề xuất, K1): "Log chẩn đoán in điều code ĐÃ làm (giá trị hàm trả về), không suy lại bằng công thức riêng; hàm bắt lỗi chỉ dùng giá trị đã tính an
  toàn từ trước (GIAO-2: `.catch` gọi lại `String(b._id)` → TypeError → unhandledRejection → sập)."
- BỎ: thu_BH2 đỏ vì kho nông — môi trường, đã có luật unshallow ở bước 1.3.

## Báo cáo
```
VIỆC:        GIAO-2 — Tin báo Ahamove trả lời ngay, xử lý sau; dự phòng đọc lại cập nhật được thẻ; nút Tải lại hỏi Ahamove ngay
ĐÃ SỬA:      server/routes/giao-hang.js webhook — kiểm khoá như cũ → res.json 200 NGAY → gh.nhanTinBaoNen; GET / nhận ?doc_lai=1
             server/utils/giaoHang.js — nhanTinBao(ma) chạy nền (maTin an toàn, bỏ 409 dang_goi, gỡ dòng chống lặp khi cập nhật thẻ hỏng, log mọi nhánh);
               capNhatTuAhamove trả điều đã làm; danhSach(docLaiNgay): đọc song song, hạn HAN_DOC_LAI_MS 8 s, Tải lại = mốc 5 s / trần 8, mỗi nhánh tự bắt
               lỗi + log đúng bước; docLaiPhiHuy song song + hạn 8 s + log (logic phí không đổi)
             server/utils/ahamove.js — goiTho nhận `han` (cả lấy token); motChuyen gỡ mảng / {order} cho docChuyen + traTheoMa
             client/src/pages/GiaoHang/index.jsx — nút Tải lại gọi tai(true); hẹn giờ / in tem gọi tai() không đối số; client/src/utils/api.js danhSach(docLai)
             client/dist build lại; kiem_tra_truoc_khi_giao.js chạy thu_GIAO2; cong_cu/thu_GIAO1.js baoVe chờ phần nền + V10 409 → 200
             server + client/src: 108 thêm / 62 bớt — vượt ngân sách ~60 dòng máy chủ vì 3 vòng soát thêm log từng bước + phí huỷ song song
BÀI THỬ:     cong_cu/thu_GIAO2.js trên gốc 0c84944 → ĐỎ 22/30 (A1a 12516 ms, A2b 502, A2c 500, A2d, A2e 500 TypeError, A2f, A4 409, B1×2, B2a 30017 ms,
             B2c 50040 ms, B2d 500, B3*, B4b/c/d, Z2, Z3); sau vá → 30/30 XANH. thu_GIAO1 gốc → ĐỎ V10; sau vá 137/137. Đột biến 36 · BẮT 36.
ĐÃ RÀ K4:    grep "aha.docChuyen" giaoHang.js → 6 chỗ: tin báo + đọc lại thẻ + phí huỷ đã hạn / log; 3 chỗ đường gọi xe / huỷ (.catch(() => undefined)) giữ
             nguyên — ghi Phát hiện. Đường đọc lại hết `catch {}` / `.catch(() => …)` im lặng. Gỡ bọc dồn một hàm motChuyen (docChuyen + traTheoMa).
             grep "tai" trong GiaoHang/index.jsx → 6 chỗ gọi, chỉ nút Tải lại truyền true.
CHƯA KIỂM:   - B1 NGUYÊN NHÂN THẬT CHƯA TÌM RA: máy không mở được tài liệu Ahamove (mạng chặn developers.ahamove.com). Dạng bọc chi tiết chuyến là GIẢ THUYẾT
               máy tái hiện được; giả thuyết khác: Ahamove bản thử / Turso chậm ≥ 5 s, mã chuyến đọc về có hậu tố, sổ chống lặp kẹt sau lỗi kho (đã vá).
               Lần thử sau: đọc nhật ký Render dòng "[GIAO] …" — mỗi lần đọc in mã chuyến, trạng thái Ahamove → điều đã làm (hoặc "bỏ qua: …") · ms.
             - Hạn 8 s chọn khi CHƯA đo độ trễ thật Render → Ahamove; nếu log cho thấy thường > 8 s thì cần nâng.
             - Chưa chạy với Ahamove thật / Turso thật / Render thật; chưa bấm thử màn trên điện thoại.
             - Render không có hẹn giờ nền: "tự hỏi lại" chỉ chạy khi màn Giao hàng ĐANG MỞ ở quầy (15 s, mốc 60 s) hoặc khi bấm "Tải lại".
             - Lọc mã tin còn [A-Za-z0-9_-]: nếu mã chuyến Ahamove thật có ký tự khác thì tin bị bỏ qua (dự phòng đọc lại vẫn lo) — chưa đối chiếu.
GIT:         e6beafc8 GIAO-2: neo dot bien BV-go-chong-lap; soat bao mat DAT
             beb75713 GIAO-2: bang chung do vong sua 4
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 2 · BỎ 1 — chi tiết ở ## Bài học
```
Thử tay trên điện thoại (chủ quán): (1) mở màn Giao hàng, gọi xe một đơn thử Ahamove → khi tài xế nhận, thẻ đổi sang có tên tài xế trong vài giây;
(2) nếu thẻ đứng yên, bấm "Tải lại" → thẻ lên đúng trạng thái ngay; (3) mở nhật ký Render, tìm dòng bắt đầu "[GIAO]" và gửi lại cho chat.

HEAD ĐÃ KIỂM: e6beafc8
