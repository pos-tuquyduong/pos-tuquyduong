# GIAO-3 — trạng thái

## Đối chiếu bản chụp (bước 1)
- HEAD lúc mở phiên e780d7b · FETCH_HEAD 4fd64c3 → HEAD là tổ tiên → `git pull --ff-only` → 4fd64c3
- `git log --oneline -3`:
  - 4fd64c3 PHIEU: GIAO-3 dinh chinh: 16:05 may chu con o kho Tokyo
  - e780d7b PHIEU: GIAO-3 them F-LOI-2 Thuc thu cong phi giao hai lan; F-LOI-1 van ket o Virginia (chat thu 18.11 16:05)
  - a5adb8f PHIEU: GIAO-3

## D1 — số đo trước khi sửa (`node viec/GIAO-3/do_doisoat.js --tre <ms>`, 1.800 đơn / 30 ngày)
| trễ / câu | ngày | tuần | tháng |
|---|---|---|---|
| 40 ms | 2.366 ms · 63 câu | 2.205 ms · 61 câu | 2.156 ms · 60 câu |
| 150 ms | 7.923 ms · 63 câu | 7.606 ms · 61 câu | 7.406 ms · 60 câu |

Câu theo bất biến (ngày): I8=7 I9=3 I14=3 I12=2 I13=2 I15=2, các bất biến khác 1 câu. D2 (≤ 5 s ở 40 ms) đạt ngay trên gốc → theo phiếu không tối ưu.
