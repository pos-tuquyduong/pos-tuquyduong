# KHO-GON-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: `viec/KHO-GON-1` · cây sạch (không dòng sửa dở).
- HEAD `5cbfc26` · FETCH_HEAD `5cbfc26` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  5cbfc26 PHIEU: KHO-GON-1
  acc8892 Merge pull request #104 from pos-tuquyduong/viec/TIEN-KHOA-2
  302560a TIEN-KHOA-2: trang thai ghep main 9a5defdf, HEAD DA KIEM 6f39911b — chat ban 41
  ```

## Tiến độ
- 26.11 · Kho nông (`is-shallow-repository` = true) làm `npm test` đỏ ở `thu_BH2.js` G1 (`bad revision 'cbbb809..HEAD'`) → `git fetch -q --unshallow origin viec/KHO-GON-1` (chỉ tải lịch sử, không đổi file).
- 26.11 · Bước 2 (đọc) xong · bước 3: `ke_hoach.md` viết xong, agent phụ soát (4 câu) → sửa kế hoạch theo soát (ke_hoach.md mục 10) → **DỪNG chờ duyệt kế hoạch** (phiếu dặn).

- 26.11 · Chủ quán duyệt kế hoạch (qua chat soát): Q1 "TỐI ĐẾM MÙ, SÁNG THẤY SỐ" — kiểm kê không hiện số máy, mọi dòng bắt buộc gõ số
  (400 KHO_THIEU_SO), lệch có hiệu lực ngay + tô cam; Q2 số ca / cho QL chỉnh tay chỉ chủ quán; Q3 giữ (bán sau chốt → sáng thấy lệch);
  ngân sách 1,53 lần chấp nhận. Chọn cách gọn hơn cho C5: **bỏ hẳn may_thay** (đếm mù không có số máy để gửi) — gốc = tồn hiện tại − Σ dòng
  phiếu da_duyet id > moc; huỷ / duyệt phiếu cũ sau moc_luc → 409 KHO_TON_DOI. MỘT cơ chế cho kiểm kê, bàn giao, chỉnh tay.
- Bước 4: bài thử `thu_KHOGON1.js` đỏ trên gốc (9 đạt · 86 hỏng) — `bang_chung_do.txt`. Bước 5: máy chủ + màn + dist.
- Bước 6: `npm test -- --day-du` PASS 132 · FAIL 0 · CẢNH BÁO 1 (cảnh báo cũ, không phải của việc này).

## Câu hỏi
(không còn — chủ quán đã trả lời Q1–Q3 ngày 26.11)

## Đột biến — chỗ vá → đột biến (cổng A17 / A18)
| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| viec.js sinhViec `NOT EXISTS` + 033 `ux_kho_viec_ngay_mau` | VS-sinh-viec-2-lan · BV-bo-not-exists | A3a/b · A3c |
| tinh.viecHienCho (ca / ql) | VS-ca-toi-thay-viec-sang · VS-nv-thay-viec-ql | A2f · A2d |
| viec.xongViec chặn việc ngoài phần | BV-bo-chan-viec-ngoai-phan | A2h |
| tinh.quaGio `>` | VS-qua-gio-lech-1 | B1a |
| viec.xongViec `AND xong_luc IS NULL` | VS-xong-hai-lan | B4a |
| duong `/viec/:id/mo-lai` CHU_QUAN | VS-mo-lai-quan-ly | B4b |
| viec.sauTaoPhieu tự xong (PN / PX), kiemKe tự xong | BV-bo-tu-xong-goi-hang · BV-bo-tu-xong-pha-che · BV-bo-tu-xong-kiem-ke | B3c · E1a · C3b |
| kiemKe.docDanhSach đếm mù | VS-kiemke-lo-so-may | Q1a |
| kiemKe.luuKiem bắt buộc số | VS-kiemke-thieu-so-lot | Q1b/c |
| kiemKe.luuKiem ghi chú dòng lệch (máy / chốt) | VS-lech-khong-ghi-chu-lot · VS-ban-giao-chi-so-may | C4a · C4b |
| kiemKe.luuKiem dòng thuộc danh sách | VS-nv-kiem-ke-ngoai-danh-sach | C6b |
| kiemKe.luuKiem số ≥ 0 | VS-kiem-ke-so-am-lot | D2a |
| kiemKe.docDanhSach "Chốt" từ ảnh chốt | VS-so-voi-may-thay-chot | C3c |
| kiemKe.gocCua gốc = hiện − Σ sau moc | VS-lech-gia-khi-vua-ban | C5a |
| kiemKe ảnh = tồn sau chốt | VS-anh-chot-la-so-go | C5b |
| kiemKe chặn tồn mới < 0 | BV-bo-chan-ton-moi-am | C5g |
| kiemKe.gocCua huỷ / duyệt xen giữa | BV-bo-kiem-huy-xen-giua | C5f |
| kiemKe.kiemMoc moc hợp lệ | BV-bo-kiem-moc-sai | C5d |
| kiemKe.kiemMoc KK id > moc | BV-bo-chan-hai-nguoi-chot | C-đua |
| duong duocChinhTay + QUAN_LY | VS-ql-chinh-tay-khi-tat · BV-bo-kiem-quyen-chinh-tay | D1a/d · D1d/e |
| duong `/chinh-tay` lý do | VS-chinh-tay-khong-ly-do | D1h |
| viec.denIdCua theo người, daXem MIN | VS-chua-xem-chung-nguoi · VS-da-xem-vuot-id | B5d · B5e |
| index.jsx tab đầu, cùng vòng hỏi | BV-bo-tab-viec-dau · VS-vong-hoi-thu-hai | E2a · B5f |

Tên đột biến (31): VS-sinh-viec-2-lan · BV-bo-not-exists · VS-ca-toi-thay-viec-sang · VS-nv-thay-viec-ql · VS-qua-gio-lech-1 · VS-xong-hai-lan ·
VS-mo-lai-quan-ly · BV-bo-chan-viec-ngoai-phan · BV-bo-tu-xong-goi-hang · BV-bo-tu-xong-pha-che · BV-bo-tu-xong-kiem-ke · VS-kiemke-lo-so-may ·
VS-kiemke-thieu-so-lot · VS-lech-khong-ghi-chu-lot · VS-ban-giao-chi-so-may · VS-nv-kiem-ke-ngoai-danh-sach · VS-kiem-ke-so-am-lot ·
VS-so-voi-may-thay-chot · VS-lech-gia-khi-vua-ban · VS-anh-chot-la-so-go · BV-bo-chan-ton-moi-am · BV-bo-kiem-huy-xen-giua · BV-bo-kiem-moc-sai ·
BV-bo-chan-hai-nguoi-chot · VS-ql-chinh-tay-khi-tat · BV-bo-kiem-quyen-chinh-tay · VS-chinh-tay-khong-ly-do · VS-chua-xem-chung-nguoi ·
VS-da-xem-vuot-id · BV-bo-tab-viec-dau · VS-vong-hoi-thu-hai.
(Đột biến phiếu nêu "VS-tin-may-thay-cua-man" ở kế hoạch không còn: chủ quán chọn đếm mù → bỏ may_thay; thay bằng BV-bo-kiem-huy-xen-giua.)

## Phát hiện
- `QUYET_DINH_CHU_QUAN.md` 26.10 + 28.10: "kiểm kê đếm mù, quản lý duyệt chênh lệch có lý do" / "Sai số kho sửa bằng phiếu kiểm kê có duyệt"
  — phiếu KHO-GON-1 (C2 hiện "Máy ghi", C6 nhân viên lưu KK đã duyệt ngay) đi ngược. Ghi Q1.
