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
(không còn — chủ quán trả lời Q8 = (a) ngày 27.11 và cho phép vòng sửa 4 chỉ cho Q8 + B6 pha tại chỗ hết nguyên liệu.)

## Vòng sửa 4 (chủ quán cho phép 27.11 — chỉ Q8 + B6)
- kiemKe.giamPhieuCho (gọi từ ghiKK — MỘT chỗ cho kiểm kê, bàn giao, chỉnh tay): phần thiếu của thành phẩm vượt số lô → giảm số phần dòng thành phẩm
  của phiếu PX CHỜ duyệt (mới nhất trước), ly_do "kiểm kê: đếm thiếu n", dòng cam `giam_phieu_cho`; dòng xuất nguyên liệu giữ nguyên. Không đủ phiếu
  chờ để trừ → vẫn 409. duLieu.ghiKho: không chia giá vốn cho 0 khi phiếu bị giảm về 0 phần. Ca Q8a–c; đột biến BV-bo-giam-phieu-cho ·
  VS-q8-khong-ly-do · VS-q8-giam-ca-xuat.
- viec.monCanChuY: "Cần chú ý" = monChuaSan + món PHA TẠI CHỖ tonMenu ra 0 phần (không bật bán khi thiếu), lý do "Pha tại chỗ: hết <tên>" — tên lấy từ
  lời báo của chính kiemDuHang (banHang.js chỉ đọc, không chép công thức). Ca B6c (Cà phê đen báo, Cam ép không); đột biến BV-bo-pha-het ·
  VS-pha-het-bao-ca-con.
- Bằng chứng: bài mới trên code trước vòng 4 (fa1392f4) 113 đạt · 4 hỏng (✗ Q8a · Q8b · Q8c · B6c); sau vá 117 đạt · 0 hỏng; đột biến 53/53.

## Câu hỏi đã trả lời (Q8)
Sau vòng sửa 3 (vòng cuối — LUAT §6.5) còn MỘT lỗi NẶNG đụng số tồn mà luật chưa có câu trả lời → máy DỪNG hỏi:

- **Q8 · Đếm thiếu một món làm sẵn đang có phiếu pha chế CHỜ duyệt.** Ví dụ: hết Nước cam, tối nhân viên pha 10 ly (phiếu chờ quản lý duyệt —
  sổ chưa có lô 10 ly này), đổ vỡ 1, kiểm kê đếm 9. Theo Q4 máy coi 10 ly chờ như đã có → lệch −1, nhưng chưa có lô nào để trừ → máy báo
  "tải lại" mãi; chủ quán chỉnh tay cũng bị chặn. Quán 1 người ca tối không chốt được. Ba cách:
  (a) **[đề xuất]** Trừ phần thiếu VÀO CHÍNH phiếu chờ: máy giảm số phần của phiếu pha chế chờ (10 → 9), ghi lý do "kiểm kê: đếm thiếu 1" trên
  phiếu + dòng cam ở Diễn biến. Nguyên liệu của phiếu vẫn trừ đủ 10 ly (đã dùng thật — hao hụt). Quản lý duyệt → lô 9 ly, khớp thực tế.
  (b) Ghi phần thiếu "treo" và máy tự trừ khi phiếu được duyệt — thêm một đường ghi lúc duyệt, phức tạp hơn.
  (c) Cho chốt các dòng khác, riêng dòng đó báo "còn phiếu pha chế chờ duyệt — nhờ quản lý duyệt rồi kiểm lại dòng này" + dòng cam.

Các lỗi khác của soát vòng 2 đã sửa ở vòng sửa 3 (mục dưới). Trả lời Q8 xong: máy làm phần Q8 (bài thử đỏ trước, đột biến) — chủ quán cho phép
thêm một vòng sửa ngoài 3 vòng — rồi soát lại, cổng, báo cáo 7 mục.

## Vòng sửa 3 (sau soát vòng 2)
- Kiểm sau vòng 3 (HEAD 6ca4d689 + bằng chứng): `node cong_cu/thu_KHOGON1.js` 113 đạt · 0 hỏng · đột biến 48/48 BẮT · `npm test -- --day-du`
  PASS 132 · FAIL 0 · CẢNH BÁO 1 (chạy một mình). Lần chạy trước đó FAIL 1 ở `thu_gia_lap.js` ("data/ không đổi") là do agent soát vòng 2 chạy
  `cong.js chay` SONG SONG cùng lúc chạm data/pos_thu.db — chạy lại một mình xanh (K2: truy nguyên trước).
- Soát bảo mật (ĐẠT) chạy trên 2167e453 — code đã đổi sau đó (vá Q5b, vòng 3) → soát bảo mật LẠI sau khi làm Q8.
- kiemKe.luuKiem: bàn giao — ô trống chỉ = "đúng chốt" khi máy = chốt; máy ≠ chốt → 400 KHO_THIEU_SO "gõ số đếm thật" (hết hàng ảo; ca C3g, C3h;
  đột biến BV-trong-khi-may-khac-chot). Màn KiemKe: dòng máy ≠ chốt bắt gõ số trước khi bấm.
- duong.js: dòng cam "phiếu chờ bị từ chối sau lần chốt" gắn cả đường huỷ và SỬA phiếu (PX + DH/PN/PS) — ca Q4d, Q4e; đột biến BV-bo-canh-bao-huy,
  BV-bo-canh-bao-sua. Đơn đặt hàng chờ duyệt không tính, không cảnh báo — ca Q4f; đột biến VS-dh-cho-tinh, VS-canh-bao-dh.
- Bàn giao: thành phẩm bán hết sau chốt vẫn có dòng — ca C3i; đột biến BV-bo-dong-tp-het-lo-chot-con.
- Phiếu KK có dấu +/− khi xem (duLieu.docPhieuNhap `tang`, XemPhieu) — ca C2f; đột biến VS-kk-khong-dau.
- Chú thích sửa: kiemKe.js lời báo thiếu lô, KiemKe.jsx "ô trống = đúng", duong.js lời hứa "không số" chỉ cho phản hồi POST (đường đọc khác — Q6).
- Không sửa (ghi lại): nhãn "Máy ghi" ở chỉnh tay lấy tồn đã duyệt, gốc máy chủ gồm phiếu chờ (Q4) — có phiếu chờ thì hai số khác nhau; cảnh báo
  sau chốt không xét thứ có trong bảng kiểm (có thể ra dòng cam thừa — an toàn); hai lần bấm cùng ma_gui song song: lần sau báo lỗi khoá trùng
  (đã ghi đúng một lần).
- Bằng chứng: bài mới trên code trước vòng 3 (afc6b9fe) thoát 1 (✗ C2f · ✗ C3g · ✗ C3h · kéo theo C4b/C3d/C3e · ✗ Q4e · Q4f); trên code đã sửa 113 đạt · 0 hỏng.

## Câu hỏi đã trả lời trước (Q4–Q7)
(chủ quán trả lời Q4–Q7 ngày 26.11: Q4 (a) phiếu chờ tính như đã ghi + dòng cam khi từ chối sau chốt; Q5 (a) + siết: nhân viên chỉ
nhận "đã chốt"; Q6 (a) giữ; Q7 chấp nhận ≈ 955 dòng.)

## Câu hỏi đã trả lời (lưu lại)
(Q1–Q3 chủ quán đã trả lời 26.11.) Soát vòng 1 bắt 3 chỗ đụng SỐ TỒN / đếm mù mà luật chưa có câu trả lời → máy DỪNG hỏi (LUAT §6.5). Các lỗi
rõ ràng khác của vòng 1 đã sửa (mục "Vòng sửa 1" dưới). Bạn chỉ cần trả lời Q4–Q7 (mỗi câu có đề xuất sẵn):

- **Q4 · Phiếu chờ duyệt lúc chốt (lỗi thật, phải sửa).** Tối nhân viên pha 10 ly (phiếu pha chế CHỜ quản lý duyệt — hàng đã có thật nhưng sổ
  chưa ghi). Kiểm kê đếm 10 ly → máy thêm 10 vào sổ. Sáng quản lý duyệt phiếu → sổ thêm 10 lần nữa = 20 ly ảo. Ba cách:
  (a) **[đề xuất]** Kiểm kê / bàn giao / chỉnh tay coi phiếu CHỜ DUYỆT như đã ghi (đếm thật đã gồm hàng đó) — duyệt sau không cộng đôi. Nếu
  sau đó quản lý TỪ CHỐI phiếu đó, máy ghi một dòng cam ở Diễn biến "phiếu X đã tính vào lần chốt — kiểm lại thứ này".
  (b) Chặn chốt khi còn phiếu chờ duyệt có thứ trong bảng kiểm ("nhờ quản lý duyệt trước") — quán 1 người ca tối sẽ không chốt được.
  (c) Bỏ duyệt phiếu pha chế / nhận hàng của nhân viên (tự ghi ngay) — đổi luật 26.10, không đề xuất.
- **Q5 · Đếm mù bị "dò" được.** Tối đếm mù: nếu số đếm lệch mà chưa ghi chú, máy báo "Dòng lệch phải ghi chú: Nước cam" → nhân viên đổi số
  tới khi máy hết báo = biết số máy, giấu được hao hụt. (a) **[đề xuất]** Riêng kiểm kê tối: dòng lệch KHÔNG bắt ghi chú lúc lưu — vẫn lưu,
  tô cam "lệch, chưa giải thích" ở Diễn biến / Cần chú ý (bàn giao sáng giữ bắt buộc ghi chú vì sáng đã thấy số). (b) Giữ bắt buộc nhưng chỉ báo
  "có dòng lệch", không nêu tên dòng — vẫn dò được bằng cách sửa từng dòng, không đề xuất.
- **Q6 · Nhân viên vẫn thấy số tồn ở tab Tồn kho và dải cam "còn 2 kg".** (a) **[đề xuất]** Giữ — nhân viên cần xem tồn khi pha chế / gọi
  hàng; đếm mù chỉ ở màn kiểm kê (nhân viên có thể mở Tồn kho xem trước — ghi rõ ở CHƯA KIỂM). (b) Ẩn số tồn với nhân viên ở mọi màn (đổi màn
  Tồn kho, Pha chế, Nhận hàng — ngoài Phạm vi việc này, cần phiếu riêng).
- **Q7 · Ngân sách.** Số dòng thật ≈ 955 (máy chủ ≈ 585 · màn ≈ 370) ≈ 2,1 lần 450 — vượt mức 1,53 lần bạn duyệt. Lý do thêm: đếm mù + bàn
  giao hai chế độ, xử lý 409 / tải lại mốc, màn Cài đặt kho đủ 3 khu, sửa vòng 1. Đề xuất: chấp nhận (không còn chỗ cắt mà vẫn đủ nghiệm thu).

Trả lời xong: máy làm vòng sửa 2 (Q4 + Q5 theo lựa chọn, bài thử đỏ trước + đột biến), soát bảo mật (bước 8b), soát lại, cổng, báo cáo 7 mục.

## Vòng sửa 1 (sau soát vòng 1)
- viec.js homNay: `da_giao` tính trên MỌI việc hôm nay (ca B3d — nhân viên). Đột biến VS-da-giao-theo-danh-sach-loc.
- kiemKe.js: bàn giao trả cả `may` (sáng thấy số) + màn báo "máy ghi X (bán / đổi sau chốt)", dòng đó bắt ghi chú (ca C3f, C3g; đột biến
  VS-ban-giao-khong-tra-may); thành phẩm hết lô mà tối qua chốt còn → vẫn có dòng ở bàn giao; bấm lại cùng ma_gui trả CÙNG dạng (anh, lech —
  ca C-ma_gui; đột biến VS-ma-gui-tra-thieu-anh); so giờ huỷ / duyệt `>=` (ca C5i; đột biến VS-so-gio-chat); chú thích đầu file sửa (ghiKetQua).
- Ca phủ thêm: C4d (dòng không lệch có ghi chú vẫn lưu), C5h (duyệt phiếu cũ xen giữa — đột biến BV-bo-kiem-duyet-xen-giua), C5f gửi ghi chú
  (409 vì tồn đổi, không vì thiếu ghi chú).
- KiemKe.jsx: gặp 409 KHO_DA_KIEM / KHO_TON_DOI / KHO_MOC_SAI → tải lại mốc, GIỮ số đã gõ.
- Bằng chứng: bài mới trên code trước vòng sửa (8d030468) thoát 1 · 98 đạt · 4 hỏng (✗ B3d · ✗ C-ma_gui · ✗ C3f · ✗ C5i); trên code đã sửa 102 đạt · 0 hỏng.
- Chưa làm (cố ý): `ghiVaTra` gần giống `ghiPhieu` (khác bước trả phiếu) — gộp sẽ đụng mọi đường phiếu cũ, để lại; phép số âm (`KHO_SO_AM`) giữ
  dù 409 thường bắt trước — 400 là lời báo đúng cho người gõ số âm.

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
Vòng sửa 1 thêm (5): BV-bo-kiem-duyet-xen-giua · VS-so-gio-chat · VS-da-giao-theo-danh-sach-loc · VS-ma-gui-tra-thieu-anh · VS-ban-giao-khong-tra-may
(bám C5h · C5i · B3d · C-ma_gui · C3f). Tổng 36 — BẮT 36.
Vòng sửa 2: bỏ BV-bo-kiem-duyet-xen-giua, VS-ma-gui-tra-thieu-anh; thêm VS-kiemke-bat-ghi-chu (C4a/C5c) · VS-kiemke-bao-dong-lech (Q5a) ·
VS-cho-duyet-khong-tinh (Q4a/C5h) · BV-bo-canh-bao-tu-choi (Q4b) · VS-canh-bao-moi-tu-choi (Q4c). Tổng 39 — BẮT 39.
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

## Soát bảo mật
Lần 1 (26.11, HEAD 2167e453 + bằng chứng 1c… ; subagent tìm lỗ hổng + subagent lọc riêng). Trước lọc: 1 lỗ hổng · sau lọc (điểm ≥ 8): 0.

Báo cáo sau lọc (nguyên văn): không còn lỗ hổng nào đạt điểm tin cậy ≥ 8.

Lỗ hổng bị lọc (điểm lọc 6/10 — chép để chủ quán thấy): "Vuln 1: Blind count bypassed by replaying `ma_gui` in a different mode —
`server/kho/kiemKe.js` (luuKiem, replay block) + `server/kho/duong.js` (POST /kiem-ke). Severity: Medium (Low given Q6a). The replay lookup
ignores mode and user; the route trims by the request's mode, not the saved mode — staff resends the evening count's ma_gui with che_do 'bangiao'
and receives the full snapshot (goc, lech, phieu_id)." Lý do lọc: dưới Q6 nhân viên vốn xem được số máy ở Tồn kho; chỉ thông tin, không đổi tiền / tồn;
ma_gui là UUID không đoán được.
Đã vá dù bị lọc (vì nó phá đúng cam kết Q5 "nhân viên chỉ nhận đã chốt"): tra ma_gui phải khớp cả che_do và người, khác → 409 MA_GUI_TRUNG
(ca Q5b đỏ trên a152c401 trước vá: "✗ Q5b … {success, chot_id, phieu_id, lech: [...]}"; xanh sau vá; đột biến BV-bo-chan-ma-gui-khac-che-do ·
VS-ma-gui-chi-so-che-do).

SOÁT BẢO MẬT: ĐẠT

## Soát độc lập — vòng 2 (agent /ra-soat, 26.11, trên HEAD sau afc6b9fe) — chép nguyên văn
KHÔNG ĐẠT

Tóm tắt dễ hiểu: các lỗi của vòng 1 phần lớn đã sửa đúng. Bài thử 107/107 xanh, và đỏ trên gốc 5cbfc26. `--day-du` cho PASS 132 · FAIL 0, dist khớp src. Mình chạy thử 3 đột biến của bộ: đối chứng xanh, BẮT 3/3.

Nhưng mình dựng ca thật (bài nháp trong scratchpad, không sửa kho) và thấy 2 lỗi NẶNG ở đường tồn:
(1) Có phiếu pha chế chờ duyệt mà đếm ra ít hơn phiếu ghi → không ai chốt kiểm kê được, chủ quán chỉnh tay cũng không. Đây đúng là phương án (b) chủ quán đã bác ở Q4.
(2) Lỗi vòng 1 "bàn giao để trống + ghi chú kéo tồn về số chốt" vẫn còn → tạo hàng ảo, quầy bán được.
Ngoài ra còn 5 vế kiểm chưa có ca nào bắt (đột biến SỐNG).

LỖI TÌM ĐƯỢC:
- server/kho/kiemKe.js:101–102 (ghiKK), cùng tongDong :25–28 — NẶNG (tồn, chặn nhầm luồng hằng ngày) — K5.
  - Tình huống: thành phẩm có phiếu PX chờ duyệt (lô chưa có, vì lô chỉ sinh khi duyệt — duLieu.js:193–205). Số đếm nhỏ hơn (lô đang có + số phiếu chờ) → điều chỉnh âm → chiaTheoLo trả lo_id null → 409 KHO_TON_DOI "…duyệt phiếu rồi tải lại".
  - Ca thật: bán hết 10 lô → nhân viên pha 10 (chờ duyệt) → đếm 9. nhân viên: 409 hai lần liên tiếp; chủ quán chốt: 409; chủ quán `/chinh-tay` 9: 409.
  - KiemKe.jsx:46 gặp 409 thì tải lại mốc rồi gửi lại, vẫn 409 mãi. Quán một người ca tối không chốt được khi quản lý vắng — trái Q4(a).
  - Phụ: ở chế độ đếm mù, lỗi này cũng là "máy dò" yếu (409 chỉ hiện khi số đếm < số lô).
  - Không ca thử nào đếm ít hơn số phiếu chờ: Q4a đếm đúng nc12+10. Đột biến bỏ phép 409 ở :102: SỐNG (107 đạt).
- server/kho/kiemKe.js:140 (`thuc = v?.thuc ?? soChot`), cùng KiemKe.jsx:32,85 — NẶNG (tồn ảo) — K5/K4. Lỗi vòng 1 chưa sửa hết.
  - Bàn giao khi máy ≠ chốt (bán / đổi sau chốt, Q3): màn hiện "máy ghi X (bán / đổi sau chốt) · lệch +n", gợi ý chính lý do đó làm ghi chú.
  - Nhân viên để trống ô số + gõ ghi chú → máy chủ lấy số = số chốt → phiếu KK +n lô MỚI.
  - Ca thật: chốt 10, máy 6, để trống + ghi chú → 200, tồn Nước cam 6 → 10 (lô mới, bán được).
  - C3g chỉ khoá "trống, không ghi chú → 400"; C3d luôn gõ số. Chưa có ca "trống + ghi chú khi máy ≠ chốt".
  - Sửa an toàn hơn: dòng có máy ≠ chốt thì bắt gõ số (400), không coi ô trống là "đúng chốt".
- server/kho/duong.js:318–332 (`/phieu/:id/sua`) — NHẸ — K4. Không gọi canhBaoSauChot.
  - PX chờ duyệt vẫn sửa được (nhánh PX không chặn chờ duyệt). Sửa = huỷ phiếu chờ + phiếu mới tự duyệt.
  - Ca thật: chốt đếm 10 (gồm phiếu chờ), sáng chủ quán sửa phiếu còn 6 → tồn 6, dòng cam tu_choi_sau_chot = 0.
  - Sáng bàn giao vẫn thấy lệch, nên không mất dấu hẳn. Đường sửa cũng không ghi diễn biến (E1 hứa mọi đường tạo phiếu đều ghi).
- cong_cu/thu_KHOGON1.js + viec/KHO-GON-1/dot_bien.py — vế kiểm không có ca / đột biến (mình tự chạy, đều SỐNG, 107 đạt) — K3:
  - (a) duong.js:312 canhBaoSauChot ở `/huy`: không ca nào huỷ phiếu CHỜ sau chốt.
  - (b) kiemKe.js:28 `AND p.loai <> 'DH'` ở nhánh phiếu chờ — vế TỒN. Bỏ đi thì đơn đặt hàng chờ duyệt bị tính là hàng có thật, mà không ca nào phát hiện.
  - (c) kiemKe.js:102 phép 409 thiếu lô (xem lỗi 1).
  - (d) kiemKe.js:57 bàn giao vẫn hiện thành phẩm hết lô khi tối qua chốt còn (sửa vòng 1, không có ca).
  - (e) viec.js:134 `loai <> 'DH'` trong canhBaoSauChot.
- server/kho/duLieu.js:374 (docPhieuNhap `luong = Math.abs`), dùng cho phiếu KK qua XemPhieu.jsx:18 — NHẸ — K4. Phiếu KK hiện "Nước cam 4 · Cam 0,8" mà không có dấu +/−, chủ quán không biết là cộng hay trừ (ca thật: Cam −0,8 hiện 0.8).
- Đường song song trả số cho nhân viên trong kiểm kê — NHẸ (được Q6a che), ghi để chủ quán biết. Lời hứa ở duong.js:397 ("không dòng / số lệch") chỉ đúng với phản hồi POST.
  - `GET /phieu` + `GET /phieu/:id` (NHAN_VIEN, duong.js:272–276): nhân viên thấy phiếu KK của chính lần chốt mù, có số lệch từng dòng. Ca thật: nv xem KK 200, dòng `luong` 4 / 0.8.
  - `GET /kiem-ke?che_do=bangiao` (NHAN_VIEN): trả `may` mọi dòng bất cứ lúc nào, kể cả 21:30 trước khi đếm.
- Chú thích sai — NHẸ — K1: kiemKe.js:102 lời báo "duyệt phiếu rồi tải lại" trái Q4 · KiemKe.jsx:3 "ô trống = đúng" — sai khi máy ≠ chốt · duong.js:397 "không dòng / số lệch" — sai, xem mục trên.

NGHI NGỜ:
- Nhãn "Máy ghi" ở chỉnh tay (TonKho.jsx, lấy docTon = chỉ phiếu đã duyệt) khác gốc máy chủ tính (kiemKe.gocCua = gồm phiếu chờ). Có phiếu chờ: chủ quán gõ số → dc = 0 → `{phieu_id: null}`, màn vẫn báo "Đã chỉnh tồn" (kiemKe.js:189, TonKho.jsx:36). Số "máy" ở bàn giao và số ở Tồn kho cũng lệch nhau khi có phiếu chờ.
- canhBaoSauChot (viec.js:135) so `kho_chot.luc >= tao_luc` trên mọi lần chốt, không xét thứ đó có trong bảng kiểm không → có thể ra dòng cam thừa (nguyên liệu không tick).
- Hai yêu cầu cùng ma_gui gửi song song: UNIQUE ux_kho_chot_ma_gui (033:69) ném lỗi. ghiVaTra (duong.js:349) không trả lại lần đã ghi như ghiPhieu → lần bấm sau báo lỗi dù đã lưu. Chưa thử.
- `/chinh-tay` tra ma_gui (kiemKe.js:175) không gắn người / loại thao tác. Chỉ chủ / QL gọi được, nên rủi ro thấp.

NGHIỆM THU: 17/19 mục có bằng chứng · mục thiếu:
- Có bằng chứng: A1 · A2 · A3 · B1 · B2 · B3 · B4 · B5 · B6 · C1 · C2 · C4 (C4a/b/d) · C5 · C6 · D1 · D2 · E2.
- C3 chưa đạt: ô trống tạo tồn ảo khi máy ≠ chốt (lỗi 2). E1 / K5 chưa đạt: kiểm kê bị chặn khi có phiếu chờ (lỗi 1).
- Đột biến phiếu đòi: 8/8 có (VS-tin-may-thay-cua-man thay bằng BV-bo-kiem-huy-xen-giua, đã ghi lý do).
- Ca chủ quán đòi thêm: Q1 có · Q4 (Q4a, Q4b/Q4c) có — thiếu ca đếm ≠ số phiếu chờ và ca huỷ / sửa phiếu chờ sau chốt · Q5 có.
- Phần "Thử" còn thiếu: kết quả `node tu_chay/cong.js chay` · 3 thao tác thử tay 390 px · mục CHƯA KIỂM cho phần chỉ có ở màn.

CHƯA SOÁT ĐƯỢC: `node tu_chay/cong.js chay` (quá 10 phút, bị cắt) · chưa chạy cả bộ 41 đột biến (chỉ 3 + 7 tự dựng) · chưa chạy giao diện thật · chưa thử khôi phục sao lưu thật · chưa dựng ca PS / PN chờ duyệt lúc chốt (đọc phatSinh.js:101–137 giữ nguyên tổng).

BÀI HỌC:
- KHOÁ: mọi phép "tính phiếu chờ như đã ghi" phải có ca số đếm NHỎ HƠN phần phiếu chờ (điều chỉnh âm khi chưa có lô), cùng ca đếm bằng.
- KHOÁ: ô trống có nghĩa "đúng X" thì phải có ca trống + ghi chú khi X ≠ số máy.
- NGUYÊN TẮC (K4): gắn một móc sau "từ chối / huỷ phiếu" thì grep MỌI đường đổi trạng thái phiếu: tu-choi · huy · sua · huyPhieuBan. Mỗi đường một ca + một đột biến.
- NGUYÊN TẮC: lời hứa "phản hồi không lộ số" phải kê cả đường ĐỌC song song (/phieu, /phieu/:id, chế độ khác của cùng GET).

## Soát bảo mật — lần 2 (27.11, HEAD sau 3002c03d — sau vá Q5b, vòng sửa 3, vòng sửa 4)
Trước lọc: 0 · sau lọc: 0 (không có lỗ hổng nên không cần bước lọc). Báo cáo (nguyên văn, dòng đầu): "No vulnerabilities found."
Tóm tắt người soát đã kiểm: phản hồi POST /kiem-ke của nhân viên chỉ `{ chot_id, da_chot }`; ma_gui chỉ trả lại cho cùng người + cùng chế độ (409
MA_GUI_TRUNG); danh sách kiểm kê của nhân viên không có số; giamPhieuCho chỉ GIẢM dòng thành phẩm của phiếu PX chờ, có ly_do + dòng cam, quản lý vẫn
duyệt sau; /chinh-tay QUAN_LY + công tắc chỉ chủ quán bật (settings.js chặn khoá kho_* với người không phải chủ); diễn biến chỉ chủ / QL; SQL tham số
hoá; không dangerouslySetInnerHTML / fetch trần; sao lưu chỉ thêm 5 bảng. Đường đọc khác lộ số cho nhân viên (bàn giao `may`, Tồn kho, phiếu KK) —
chủ quán đã chấp nhận Q6, không báo.

SOÁT BẢO MẬT: ĐẠT
