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

## Soát độc lập — vòng 1 (agent /ra-soat, 26.11, trên HEAD 8d030468) — chép nguyên văn
KHÔNG ĐẠT

Tóm tắt: phần đã có bài thử đều chạy đúng. Mình đã tự chạy lại: bài mới 96 đạt · 0 hỏng; trên cây gốc 5cbfc26 bài đỏ (thoát 1, A1… 403 DUONG_LA); đột biến 31 BẮT · 0 SỐNG (đối chứng xanh 96); `--day-du` cho PASS 132 · FAIL 0 · CẢNH BÁO 1, dist khớp src. Nhưng vẫn KHÔNG ĐẠT vì ba lý do. (1) Có lối đổi tồn sai mà cơ chế mốc không thấy: phiếu còn chờ duyệt lúc đếm sẽ bị tính hai lần. (2) "Đếm mù" có hai lối lộ số máy, trong đó có lối giấu hao hụt mà không để lại dấu vết. (3) Một mục nghiệm thu và một mục "Thử" chưa có bằng chứng.

LỖI TÌM ĐƯỢC:
- server/kho/kiemKe.js:21–23 (tongDong dùng duLieu.DA_DUYET, duLieu.js:95) + :68–75 (gocCua) — **phiếu CHỜ DUYỆT lúc đếm bị tính đôi**. Mặc định nhân viên tạo PX / PN / PS là phiếu chờ duyệt (duLieu.js:104 nvCanDuyet: chỉ '0' mới tắt). Phiếu chờ duyệt không vào tồn. Riêng thành phẩm chỉ có lô sau khi duyệt (duLieu.js:193–205 ghiKho).
  - Ví dụ: tối nhân viên pha 10 Nước cam (PX chờ duyệt), 21:30 kiểm kê đếm thấy 10 ly thật → KK +10 lô mới, Cam −x. Sáng quản lý duyệt PX → ghiKho tạo thêm lô +10 và trừ Cam lần nữa.
  - Cách hai lớp chặn đang chạy, và vì sao không bắt: phép 409 ở :70 chỉ bắt khi duyệt xen giữa lúc mở và lúc lưu. Phép KHO_DA_KIEM ở :64 chỉ chặn KK sau mốc. Không phép nào chặn "duyệt sau khi đã chốt" hay "chốt khi còn phiếu chờ".
  - Kế hoạch mục 3 và mục 8 không nhắc tới trường hợp này. Đây là luồng hằng ngày (pha chế tối + kiểm kê tối) → sai số tồn thật. Khuôn K4 (đường song song đổi tồn) + đường tồn.
- server/kho/kiemKe.js:136–138 + client KiemKe.jsx:28,91 — **lỗi 400 KHO_THIEU_GHI_CHU thành "máy dò" số máy trong chế độ đếm mù**.
  - Màn kiểm kê không biết dòng nào lệch, nên nút luôn bấm được. Máy chủ trả "Dòng lệch phải ghi chú: <tên>" mà không ghi gì (rollback, không có dòng diễn biến).
  - Nhân viên chỉ việc đổi số rồi gửi lại cho tới khi hết 400 → khớp số máy, không lệch, không tô cam → hao hụt biến mất không dấu vết.
  - Ca C4a (thu_KHOGON1.js:276) chính là ca chứng minh lỗi này chạy được.
  - Đề xuất máy chủ đưa ra (chủ quán quyết vì C4 và Q1 vênh nhau): ở kiemke, dòng lệch không ghi chú vẫn LƯU và tô cam (hoặc chỉ báo "có lệch", không nêu tên dòng).
  - Khuôn K4 / K5; hai câu cùng nghĩa nhau đã lệch nhau: K4 "MỘT vị từ" và Q1.
- server/kho/duong.js:337–341 (GET /ton, NHAN_VIEN) + client index.jsx:43 (tab Tồn kho hiện cho mọi người) + viec.js:47–48 (duoi_nguong.ton_hien trả cho nhân viên) — **số máy vẫn lộ cho nhân viên ở đường song song**. Nhân viên mở tab Tồn kho trước khi đếm là chép được số.
  - Q1 theo chữ ("GET kiem-ke che_do=kiemke không trả số máy") đã đạt; mục đích "đếm khách quan" thì không.
  - Cần chủ quán quyết: có che `/ton` với nhân viên trong giờ kiểm kê không. Ít nhất phải ghi vào Phát hiện / CHƯA KIỂM.
  - Khuôn K4.
- server/kho/viec.js:44 — `daGiao` tính từ `ds` ĐÃ LỌC theo viecHienCho. Việc "Gọi thêm …" luôn giao `ql` nên bị lọc khỏi danh sách của nhân viên → với nhân viên `da_giao` luôn false → nút "Giao việc gọi thêm" hiện lại dù đã giao. Sai B3 ("đã có việc chưa xong thì hiện 'đã giao' thay nút").
  - Ca B3b (thu_KHOGON1.js:231) chỉ hỏi bằng vai `ql` → xanh oan cho vai nhân viên.
  - Sửa: tính daGiao trên `docViec(tx, ngay)` chưa lọc.
  - Khuôn K4 (một danh sách lọc dùng cho việc khác) + K3.
- server/kho/kiemKe.js:136 + KiemKe.jsx:28,90–92 — **bàn giao sau khi có bán sau chốt (Q3)**: ô trống thì máy tính `thuc = soChot`, nên `dc = soChot − gốc ≠ 0` trong khi `lech = 0`.
  - Màn báo "Tất cả đúng / Nhận ca — đúng hết", máy chủ lại trả 400 THIEU_GHI_CHU mà màn không hề báo trước.
  - Nhân viên thêm ghi chú → KK +1 → tồn bị kéo về số chốt, trong khi hàng thật đã bán (tồn ảo).
  - Không có ca thử cho luồng ô trống + bán sau chốt: C3d / C4b luôn gõ số.
  - Khuôn K5 (chặn nhầm / sai luồng hợp lệ).
- server/kho/kiemKe.js:109 + KiemKe.jsx:38,49 — bấm lại cùng `ma_gui` (vd mất mạng sau khi máy chủ đã ghi, bấm lại) trả `{ chot_id, phieu_id, lech: [], da_co }` không có `anh` → `daChot.anh.map` ném lỗi, màn trắng. Khuôn K7.
- client KiemKe.jsx:31–41 — gặp 409 KHO_DA_KIEM / KHO_TON_DOI thì màn không tải lại mốc. Gửi lại vẫn 409 mãi; muốn tải lại phải rời màn, mất hết số đã gõ.
  - Các việc hợp lệ gây ra 409 khi đang đếm: quầy huỷ một đơn, quản lý duyệt một phiếu cũ, chủ quán chỉnh tay MỘT thứ bất kỳ (kiemKe.js:64 chặn chung mọi thứ).
  - Khuôn K5.
- server/kho/kiemKe.js:70 — `p.huy_luc > ? / p.duyet_luc > ?` so theo giây với `moc_luc`. Huỷ / duyệt trong CÙNG giây với lúc đọc thì lọt.
  - Chính kế hoạch (mục 3 phần 2) đã bác so theo giờ vì getNow chỉ tới giây.
  - Dùng `>=` an toàn hơn (thà 409 thừa). Không có ca nào ở ngưỡng bằng. Khuôn K3.
- cong_cu/thu_KHOGON1.js (khối C5, :358–364) + dot_bien.py — vế `OR (p.trang_thai = 'da_duyet' AND p.duyet_luc > ?)` của gocCua KHÔNG có ca thử và KHÔNG có đột biến. Chỉ có ca huỷ đơn C5f, nên đột biến xoá vế duyệt sẽ SỐNG.
  - BV-bo-kiem-huy-xen-giua bắt được C5f vì 400 THIEU_GHI_CHU (ca không gửi ghi chú), không phải vì tồn sai.
  - Khuôn K3 (bổ sung 11.11: "đột biến cho TỪNG vế kiểm").
- kiemKe.js:2–7 (chú thích đầu file) — ghi "gốc = tồn lúc màn mở" và "chỉ huỷ / duyệt phiếu cũ đổi tồn không qua phiếu mới". Thực tế còn `ghiKetQua` (duLieu.js:305) chèn dòng vào PX CŨ, nên gốc bao gồm cả kết quả pha chế ghi sau.
  - Hành vi này chấp nhận được (đó là sửa sổ), nhưng chú thích sai. Khuôn K1.

NGHI NGỜ:
- Ngân sách: số dòng thật là máy chủ 567 + màn 366 = 933 dòng, tức 2,07 lần 450. Chủ quán duyệt 1,53 lần (khoảng 690 dòng). Vượt mức đã duyệt khoảng 35%, trang_thai.md không giải thích lại.
- duong.js:345 `ghiVaTra` gần như chép `ghiPhieu` (duong.js:204–216, chỉ khác bước trả phiếu). Hai bản sẽ lệch nhau khi một bên được sửa.
- Đột biến VS-kiem-ke-so-am-lot bị "bắt" với 409 KHO_TON_DOI chứ không phải 400. Vậy phép số âm ở kiemKe.js:131 phần lớn trùng với phép ở :135, hai phép cùng chặn một việc.
- `moc_luc` do màn gửi, chỉ kiểm ≤ giờ hiện tại. Gửi `moc_luc` muộn hơn thật là né được 409 huỷ / duyệt. Mình chưa thấy lối này giấu được hao hụt (gốc vẫn là số sổ), nhưng chưa thử bằng ca.
- kiemKe.js:108–110 bỏ qua thành phẩm có gốc ≤ 0, kể cả khi tối qua chốt > 0. Bán hết sau chốt thì sáng không có dòng nào báo.

NGHIỆM THU: 18/19 mục có bằng chứng · mục thiếu:
- C4 thiếu nửa sau ("dòng KHÔNG lệch có ghi chú vẫn lưu"). Ca C4c (:329) là dòng ĐANG lệch (ncTruoc+1 so với chốt ncTruoc+2). Không ca nào thử dòng không lệch có ghi chú.
- Phần "Thử" của phiếu thiếu: `node tu_chay/cong.js chay` ĐẠT (không có trong trang_thai.md) · 3 thao tác thử tay trên điện thoại 390 px (không có) · phần chỉ có ở màn (nhớ ca, nút Làm, 4 gợi ý, in có chỗ ký, nút dính đáy) chưa ghi CHƯA KIỂM.
- Có bằng chứng: A1 · A2 · A3 · B1 · B2 · B3 (có lỗ vai nhân viên ở trên) · B4 · B5 · B6 · C1 · C2 · C3 · C5 · C6 · D1 · D2 · E1 · E2. 8 đột biến phiếu đòi đều có và đều BẮT. Các ca K5-1, K5-2, K5-3, K5-7 có.

CHƯA SOÁT ĐƯỢC: chưa chạy `node tu_chay/cong.js chay` · chưa chạy giao diện thật (390 px, in, localStorage ca) · chưa dựng ca thật cho lỗi phiếu chờ duyệt tính đôi (kết luận rút từ đọc code duLieu.js:95,104,193–205 và kiemKe.js:21–23,64,70) · chưa thử khôi phục sao lưu thật với 5 bảng mới (đã đọc khoiPhuc.js:42,61–67) · chưa soát bảo mật riêng.

BÀI HỌC:
- KHOÁ: mọi phép "chốt / điều chỉnh tồn" phải có ca "phiếu CHỜ DUYỆT tồn tại lúc chốt, duyệt SAU chốt". Mục 8 của kế hoạch phải liệt kê cả trạng thái phiếu (chờ / duyệt / huỷ), không chỉ loại phiếu.
- NGUYÊN TẮC: chế độ "mù" mà còn lỗi kiểm có điều kiện theo số ẩn (400 nêu tên dòng lệch) là máy dò. Lỗi không được tiết lộ đúng thứ đang giấu. Grep mọi đường trả số ẩn đó (/ton, duoi_nguong, thân lỗi) trước khi báo "đếm mù xong".
- NGUYÊN TẮC (K3): ca kiểm cờ phụ thuộc vai (`da_giao`, danh sách lọc) phải chạy với MỌI vai thấy cờ đó, không chỉ vai quản lý.
- NGUYÊN TẮC: đường trả "lần đã ghi" (ma_gui) phải trả CÙNG dạng với lần ghi đầu, vì màn dùng chung một nhánh vẽ.
