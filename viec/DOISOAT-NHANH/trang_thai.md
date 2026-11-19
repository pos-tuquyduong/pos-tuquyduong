# DOISOAT-NHANH — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh `viec/DOISOAT-NHANH`, cây sạch. `git fetch origin viec/DOISOAT-NHANH` → HEAD 21ab0fc · FETCH_HEAD 21ab0fc → bằng nhau, không kéo.
- `git log --oneline -3`:
  - 21ab0fc PHIEU: DOISOAT-NHANH doi soat that treo o cung mot buoc (13 cau) — do tung buoc, han gio, tim goc — chat ban 40
  - e1a89bb Merge pull request #101 from pos-tuquyduong/viec/GIAO-3
  - e4e7f8f GIAO-3: chat ban 40 soat thay vong sua 2, ghep main, --day-du, HEAD DA KIEM

## C1 — tái hiện chỗ treo
- Đọc code: mọi `await` trên đường Đối soát chỉ chờ câu kho (`bat_bien.js` 32 chỗ `await q(`; `doiSoat.js` chỉ `chiDoc` / hàm con của nó;
  `giaoHang.js doiSoatGiao` chỉ `await q(`). → khả năng (2) "await một thứ khác" KHÔNG có trong code; chỗ treo là một câu kho không có trả lời.
- **Khả năng (1) TÁI HIỆN ĐƯỢC** (kho giả bọc `execute`, câu "loại dòng điểm lạ" của I8 không trả lời): bản gốc TREO quá hạn ngoài của bài
  (✗ C1 (1) — TREO, bang_chung_do.txt). Trên kho rỗng + 2 đơn thử, câu đó là câu thứ 15 của lượt (phanLoai chen câu `tra`).
- **Khả năng (2) KHÔNG tái hiện**: dữ liệu cũ (tháng 9, trước mốc AP_DUNG_TU) có lệch I3 / I6 / I8, phanLoai gọi `tra` → bản GỐC chạy xong
  (ca C1 (2) xanh trên gốc).
- **HTTP libsql remote → máy chủ libsql tại chỗ: KHÔNG dựng được** (không có `sqld` / `turso` trong máy). Vì sao một câu cụ thể của kho thật
  (luôn sau 12 câu) không có trả lời — nguyên nhân gốc phía libsql / mạng / Turso — CHƯA tìm ra. Không đoán.
- `@libsql/client` 0.4.3 `http.js execute`: mỗi câu một `fetch` riêng (node-fetch, không hạn giờ, không tín hiệu huỷ) → câu treo chờ mãi.

## C3 — đối chứng giống hệt
`node viec/GIAO-3/do_doisoat.js --tre 0 --goc <doiSoat.js gốc 21ab0fc> --ra` và bản mới, ngày / tuần / tháng (1.800 đơn / 30 ngày; đỏ 82 / 142 / 1.042 dòng):
`cmp` hai JSON → GIỐNG HẾT (76.840 byte). Số câu mỗi kiểu không đổi (63 / 61 / 60).

## Chỗ vá → đột biến (`python3 viec/DOISOAT-NHANH/dot_bien.py`)
| chỗ vá | đột biến |
|---|---|
| database.js `[CHAM]` thêm "đang chờ" (A2) | BV-dang-cho-log, BV-dang-cho-kn1 |
| database.js doCau đếm `cho` trong finally (A2) | VS-dang-cho-chi-khi-xong |
| database.js query `coHan` (B1) — đưa lỗi treo cũ trở lại (C2) | BV-han-cau |
| database.js quá hạn đi vòng đọc lại (B1) | VS-qua-han-khong-doc-lai |
| database.js quá hạn ném KHO_QUA_HAN, không đổi thành mất kết nối | VS-qua-han-thanh-mat-ket-noi |
| database.js `han` mặc định null — đường khác không hạn (D2) | VS-han-mac-dinh-moi-duong |
| database.js hạn mỗi lần gửi = min(ms, het − bây giờ) (B2) | VS-han-khong-moc |
| doiSoat.js chiDoc truyền mốc lượt (B2) | VS-luot-khong-moc |
| doiSoat.js HAN 15 000 / 50 000 | VS-hang-so-cau, VS-hang-so-luot |
| doiSoat.js lỗi 503 DOI_SOAT_QUA_HAN + đúng bước + log qua_han | VS-ma-loi-qua-han, VS-loi-sai-buoc, BV-log-qua-han |
| doiSoat.js ngữ cảnh lượt (đếm theo lượt; gỡ = lỗi treo cũ trở lại) | BV-ngu-canh-luot |
| doiSoat.js log bat_dau / buoc / D2 / sao_ke (A1) | BV-log-bat-dau, BV-log-buoc, BV-buoc-D2, BV-buoc-sao-ke |
| doiSoat.js dừng khi khách bỏ (B3) | BV-bo-giua |
| reports.js truyền tín hiệu (B3) | BV-tin-hieu-route |

## Kiểm
(điền sau khi chạy)
