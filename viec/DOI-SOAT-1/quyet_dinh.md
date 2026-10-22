# DOI-SOAT-1 — quyết định của chủ quán (18.10.2026) và thiết kế chốt

Chủ quán trả lời 8 câu của `ke_hoach.md` mục 9. Khi `ke_hoach.md` và file này khác nhau, **file này thắng**.

| # | Chủ quán chốt | Hệ quả thiết kế |
|---|---|---|
| 1 | **(B)** tiền mặt theo sổ = tiền mặt thật vào két trong ngày: bán + nạp ví tiền mặt + thu nợ tiền mặt theo NGÀY THU − tiền mặt trả ra. Két nhập "tiền đếm cuối ngày" và "để lại cho mai"; sổ = để lại hôm trước + vào − ra | mục 1 dưới |
| 2 | Đồng ý bảng ngày áp dụng. Ngày gộp kiểm bằng `git log` đầy đủ; kho nông → ghi **CHƯA KIỂM**, chat soát kiểm lúc duyệt PR. Chủ quán chạy trên dữ liệu thật sau khi lên Render rồi gửi danh sách đỏ | bảng 1.3 giữ nguyên; không đòi bản sao thật |
| 3 | Đồng ý nạp thẳng `cong_cu/gia_lap/bat_bien.js`, không dời | phương án A |
| 4 | Bỏ I7, rút gọn I9 / I13 / I14; dòng "có thể oan" vào nhóm **CẦN XEM** (vàng), không đỏ | mục 2 dưới |
| 5 | Giữ `floor(total/per)` như I8 | không phép mới cho D2 |
| 6 | Đỏ khi khác 0, không ngưỡng | |
| 7 | Chấp nhận ~400 dòng | |
| 8 | Thêm index CHỈ khi đo thấy chậm: `CREATE INDEX IF NOT EXISTS` trong khối của việc này ở cuối `createTables` | ca H1 quyết |
| — | Thứ tự gộp: **P16 trước, việc này sau**; nếu PR đụng `client/dist` thì chat lo | build `dist` bình thường, commit từng file |

## 1. Tiền mặt / chuyển khoản theo sổ (câu 1 = B)

Một hàm `tienTheoSo(tu, den, cach)` (`cach` = `cash` | `transfer`, cùng một quy tắc cho cả hai) trong `server/utils/doiSoat.js`:

- **bán** = `Σ (cột tiền của đơn − Σ dòng nhật ký 'thu' cùng cách của đơn)` cho đơn có `DATE(created_at) ∈ [tu, den]`, MỌI trạng thái (tiền đã vào két lúc bán). Thu nợ cộng thẳng vào cột tiền của đơn gốc (`orders.js:1305–1310`) nên phải trừ ra để không tính hai lần;
- **thu nợ** = `Σ so_tien` các dòng `pos_order_log` loại `thu`, `cach` khớp, `DATE(luc) ∈ [tu, den]` (đọc JSON bằng `json_valid` + `json_extract`);
- **nạp ví** = `Σ amount` dòng `pos_balance_transactions` loại `topup`, `COALESCE(payment_method,'cash')` khớp, `DATE(created_at) ∈ [tu, den]`;
- **trả ra** = `Σ cột tiền` của đơn **huỷ** (`status='cancelled'`, `DATE(cancelled_at) ∈ [tu, den]`) **không có dòng gói** (`product_id < 0 AND > −1000000`). Lý do đọc từ code: huỷ đơn chỉ hoàn VÍ phần khách trả bằng ví (`orders.js:1364–1372` `hoanVi`), phần tiền mặt / CK của đơn thường không được ghi vào chỗ nào → hiểu là trả lại tận tay; đơn MUA GÓI thì phần tiền mặt / CK được hoàn vào VÍ khách (`hoan_goi`) nên két không ra. Đơn `refunded` (duyệt hoàn) chỉ hoàn phần ví → két không ra. **Đây là suy luận từ code, chủ quán xác nhận ở lần chạy thật đầu** (ghi CHƯA KIỂM);
- `rong = bán + thu nợ + nạp ví − trả ra`.

**Luật chủ quán chốt 21.10 (câu 13):**
- **13b — quầy KHÔNG chi tiền mặt từ két** (mua nguyên liệu, tạm ứng… không lấy từ két). Không có ô "chi khác"; két ĐỎ vì có người lấy tiền ra là ĐÚNG (đó là thứ đối soát phải bắt).
- **13c — quán KHÔNG cho rút ví ra tiền mặt.** Điều chỉnh ví âm (`wallets.js`, chỉ chủ) KHÔNG tính vào "trả ra" của két.
- **13d — giữ vị từ "trả ra" theo DÒNG HÀNG gói** (`product_id < 0 AND > −1000000`), không đổi sang "có gói khách" (route huỷ xoá gói khách chưa giao — `orders.js:1444`) hay "có dòng ví `hoan_goi`". Đường thêm gói khách lỗi (`orders.js:1056–1063`) ghi CHƯA KIỂM.
- **Câu 10 = C (19.10) — quán KHÔNG đền tiền cho khách lẻ** (làm lại ly / tặng món): công thức két không tính khoản đền; sổ có khoản đền bằng tiền cho đơn không SĐT thì liệt kê CẦN XEM (`DEN`), không làm đỏ.

**Sổ két của ngày D** = `de_lai(k) + rong(k+1 … D)` với `k` = ngày CÓ ghi két gần nhất trước D (dòng mới nhất của ngày đó). Không có `k` → "chưa có số để lại của ngày trước" (vàng, không đỏ). Chọn `k` gần nhất (không bắt buộc đúng D−1) để ngày nghỉ không làm vỡ chuỗi; đã tính tiền vào / ra của mọi ngày giữa.
**Chênh lệch** = `so_tien (đếm cuối ngày) − sổ két`. `≠ 0` → ĐỎ kèm số. Chưa đếm → "chưa đếm két" (vàng).

Bảng `pos_doi_soat_ghi`: `id, loai ('ket'|'sao_ke'), ky, so_tien INTEGER (đếm cuối ngày), de_lai INTEGER (để lại cho mai), da_so INTEGER, ghi_chu, nguoi, luc`. Kiểm: `so_tien`, `de_lai` số nguyên, `0 ≤ de_lai ≤ so_tien ≤ TRAN_KET` (1.000.000.000) — sai → 400 `DOI_SOAT_SO_TIEN_SAI`; `de_lai > so_tien` → 400 `DOI_SOAT_DE_LAI_SAI`.

Tuần: "tổng chuyển khoản theo sổ" = `rong` của `cach='transfer'` cả tuần; tháng: 4 nhóm = tiền mặt (`rong` cash) · chuyển khoản (`rong` transfer) · ví (nạp `Σ topup`, chi `Σ balance_amount` đơn completed) · điểm (`Σ points` dương / âm).

## 2. Nhóm "CẦN XEM" (câu 4)

Phản hồi có ba nhóm dòng lệch: `do`, `can_xem`, `cu`.
- `cu` (vàng): ngày dòng `< AP_DUNG_TU[bất biến]` — thắng mọi nhóm khác.
- `can_xem` (vàng): bất biến so với trạng thái HIỆN TẠI nên có thể oan — **I12, I13, I14** (mục 1.1 `ke_hoach.md`) và D1 `diem_nhan_phone` khi `nhandiem_chi_lan_dau='0'`; thêm `DEN` (đền tiền khách lẻ không SĐT — câu 10 = C).
- `do`: còn lại. **I8 giữ ĐỎ** dù đọc `pos_settings` hiện tại: phiếu (nghiệm thu D/I) đòi "điểm sai AU4-16 → ĐỎ"; nếu chủ quán đổi hệ số điểm thì đơn cũ sẽ đỏ hàng loạt → CHƯA KIỂM, ghi ở báo cáo. I9 rút gọn vẫn đỏ (vế còn lại là so hai sổ với nhau, không phụ thuộc cài đặt).
- Kết quả tổng: `DO` nếu `do` không rỗng hoặc két chênh ≠ 0; còn lại `XANH`. `can_xem` / `cu` / "chưa đếm két" không làm đỏ.

## 3. Giao diện lập trình

- `GET /api/pos/reports/doi-soat?kieu=ngay|tuan|thang&ngay=YYYY-MM-DD` (mặc định `ngay` = hôm nay VN) → `{ ket_qua, kieu, tu, den, hom_nay, bat_bien: [{ten, pham_vi, trang_thai: 'day_du'|'rut_gon'|'bo', ly_do?}], do: [...], can_xem: [...], cu: [...], tien: {tien_mat, chuyen_khoan, vi, diem}, ket?: {...}, sao_ke?: {...}, nhac_kho? }`. Mỗi dòng lệch: `{ bat_bien, mo_ta, ngay, pham_vi: 'ky'|'toan_so', nhan? }`. Mỗi nhóm cắt `TRAN_DONG = 200` dòng; `so_luong: {do, can_xem, cu}` = số dòng ĐỦ của từng nhóm (kể cả phần bị cắt) — tên trường chốt 21.10 (câu 13e), thay `con_nua` của bản đầu.
- `POST /api/pos/reports/doi-soat/ghi` `{loai, ky, so_tien?, de_lai?, da_so?, ghi_chu?}` → 201 `{success:true, data:{id}}`; lỗi `{error, code}`: `DOI_SOAT_KY_SAI`, `DOI_SOAT_KIEU_SAI`, `DOI_SOAT_LOAI_SAI`, `DOI_SOAT_SO_TIEN_SAI`, `DOI_SOAT_DE_LAI_SAI`.
- Cả hai: `authenticate, checkPermission('view_reports')`.
