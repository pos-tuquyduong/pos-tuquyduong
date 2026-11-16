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
