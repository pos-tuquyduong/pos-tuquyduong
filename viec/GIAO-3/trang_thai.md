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

## Sự cố môi trường
- Kho mở phiên là kho nông → `npm test` đỏ ở thu_BH2 (`fatal: bad revision 'cbbb809..HEAD'`, không liên quan mã việc này). Đã chạy
  `git fetch -q --unshallow origin viec/GIAO-3` (chỉ tải lịch sử) → `--day-du` xanh.

## D2 — đối chứng giống hệt
`do_doisoat.js --tre 0 --ra` trên bản gốc (`git show 4fd64c3:server/utils/doiSoat.js`) và bản mới, cả ngày / tuần / tháng (đỏ 82 / 142 / 1.042 dòng):
`cmp` hai JSON → GIỐNG HẾT (76.840 byte). Việc này không đổi cách chạy bất biến (chỉ thêm log D4) — xem ke_hoach.md mục 2.

## Chỗ vá → đột biến (`python3 viec/GIAO-3/dot_bien.py`: ĐỐI CHỨNG XANH 40/40 · TỔNG 24 · BẮT 24 · SỐNG 0 · HỎNG 0 · LẠC 0)
| chỗ vá | đột biến |
|---|---|
| giaoHang.js loiGiao (A1) | BV-ly-do-giao-loi |
| ahamove.js chuAha cắt 200 (A1) | VS-ly-do-khong-cat |
| giaoHang.js CANCELLED dang_giao + cancel_comment (A3) | BV-ly-do-huy |
| giaoHang.js capNhatTuAhamove → capNhatTraHang (B1/B2) | BV-giao-loi-tra-hang |
| giaoHang.js phu chống lặp + sub_status (B2) | BV-chong-lap-sub-status |
| capNhatTraHang giờ return_time (B1) | BV-gio-return |
| capNhatTraHang chỉ ghi lý do khi có (A2) | VS-ly-do-ghi-de-rong |
| danhSach đọc lại giao_loi (B3) | BV-doc-lai-giao-loi, VS-doc-lai-ca-da-ve |
| danhSach trả tra_hang (B1) | BV-danh-sach-tra-hang |
| GiaoHang/index.jsx traHang (B1 màn) | BV-man-tra-hang |
| ahamove.js phiDuong ở tomChuyen (C1) | BV-phi-doc-chuyen, VS-phi-nhan-am |
| ahamove.js phiDuong ở taoChuyen (C, K4) | BV-phi-tao-chuyen |
| giaoHang.js logPhi (C3) | BV-log-phi |
| reports.js thuc_thu (G1/G2) | BV-thuc-thu-may-chu, VS-thuc-thu-cong-ship |
| Reports.jsx hiện thuc_thu (G2 màn) | BV-man-thuc-thu |
| DoiSoat.jsx han (D3) | BV-han-doi-soat |
| api.js QUA_HAN không gửi lại (D3) | VS-han-thanh-mat-mang |
| doiSoat.js log [DOISOAT] (D4) | BV-log-doi-soat |
| GiaoHang hộp lý do (E1/E4) | BV-hop-ly-do |
| HopLyDo kiểm ≥ 3 ký tự (E2) | VS-hop-khong-kiem-do-dai |
| HopLyDo Thôi không gửi (E2) | VS-thoi-gui-rong |

## Kiểm
- `node cong_cu/thu_GIAO3.js` 40 đạt · 0 hỏng; `node kiem_tra_truoc_khi_giao.js --day-du`: PASS 126 · FAIL 0 · CẢNH BÁO 1 (có sẵn từ trước, không phải bài này).
