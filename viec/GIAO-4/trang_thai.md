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
