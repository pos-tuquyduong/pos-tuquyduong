# GOI-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (13.10.2026)
- Nhánh: `viec/GOI-1`. `git status --short` sạch (không dòng nào).
- `git fetch origin viec/GOI-1` → HEAD `93163f3` · FETCH_HEAD `93163f3` (bằng nhau — không kéo).
- `git log --oneline -3`:
  ```
  93163f3 PHIEU: GOI-1
  7f8656d TIEN-DO: P26c xong (9a68ab6), AUDIT-2 xong (bcfb509), mo GOI-1 + LUOI-2, them AUDIT-3 + DANG-NHAP-1 — so v28
  9a68ab6 Merge pull request #16 from pos-tuquyduong/viec/P26c
  ```
- Có commit `PHIEU: GOI-1`.

## Bước 2 — đã đọc (lượt này)
`phieu.md`, `CLAUDE.md`, `KHUON_LOI.md`, mục lục `CHECKLIST_CODE.md` (P4, G, H theo CLAUDE.md §2).
Code: `packages.js` (cả file), `orders.js` 160–400, 760–900, 990–1030, 1340–1360, 1400–1430, 1536–1560, `middleware/auth.js`
84–110, `helpers.js` 145–160, `customers-v2.js` 19–80 + 201–260, `database.js` (bảng `pos_customers`, `pos_wallets`,
`pos_packages`, `pos_customer_packages`, dòng 982), `Settings.jsx` 338–390 + 1140–1230, `Reports.jsx` 15–92 + 344–430,
`Customers.jsx` 25–160, `Sales.jsx` 75–112 + 405–435 + 535–550, `App.jsx` (route), `AuthContext.jsx` 58–66, `api.js` 180–242,
`kiem_tra_truoc_khi_giao.js` 215–240 + 492, `thu_P26c.js` 1–60 (khuôn bài thử), grep `pos_packages` trong `cong_cu/`.

## Bước 3 — kế hoạch
`ke_hoach.md`. Phiếu dặn **chờ duyệt kế hoạch** → commit, push, DỪNG. Câu hỏi cho chủ quán ở `ke_hoach.md` mục 11.
- Agent phụ (chỉ đọc) soát kế hoạch theo 4 câu → đã sửa: bỏ lọc gói ở máy chủ; không đặt sẵn lọc "Đang giao"; dừng gói một phép
  `UPDATE … AND status='active'`; thêm ca A1f, A2g–A2i, A4e–A4f, A5h, A6 (gia hạn, xoá gói, tổng lệch); lịch sử giao dùng chung
  điều kiện đếm; bỏ câu sai "khách 150 % vẫn lấy được"; sửa vị trí `BV-GOI1-DEM`; đột biến P26c đổi mong đợi → DỪNG (ngoài Phạm vi);
  thêm C6 (huỷ / xoá đơn mua gói của gói đã dừng), C7 (`package_buy` không SĐT).

## Làm tiếp sau duyệt (13.10) — bước 1
- `git status --short` sạch. fetch → HEAD `21736a8` · FETCH_HEAD `21736a8` (bằng nhau — không kéo).
- `git log --oneline -3`:
  ```
  21736a8 GOI-1: ke hoach — sua theo soat (them ca, bo phan thua, C6-C7)
  e1f2e51 GOI-1: ke hoach (cho duyet) + trang thai buoc 1-3
  93163f3 PHIEU: GOI-1
  ```
- Chủ quán duyệt: C1 đồng ý; C2 đặt sẵn "Đang giao"; C3 có; C4 không đổi khoá; C5–C7 ghi Phát hiện. Ghi ở `ke_hoach.md` mục 12–13.
- Mốc neo đột biến cũ trên `21736a8` (`python3 viec/HOC-2b/kiem_neo.py`): AUDIT-1 HỎNG 2 · P26b HỎNG 9 · HOC-1 0 · HOC-2 1 ·
  TU-CHAY-4 0 · HOC-2b 2 (có sẵn từ trước, không do GOI-1). Sau vá phải y nguyên.

## Bước 4 — bài thử trước
- `cong_cu/thu_GOI1.js` (mới, khuôn `thu_P26c`): 49 ca. Trên GỐC `21736a8` (server + client/src lấy bằng `git archive` vào thư mục
  nháp): **15 đạt · 34 hỏng**, thoát 1. Ca xanh trên gốc đều là luồng hợp lệ (K5) / phép có sẵn: A1c, A1f, A5a, A5d2, A5f, A5g,
  A6a–A6i. Sau vá: **49 đạt · 0 hỏng**. Chi tiết: `bang_chung_do.txt` (`SỐ CA cong_cu/thu_GOI1.js: 49`).
- Ca hai người cùng bấm: A2d (hai quầy cùng lấy — kho thử tự xếp hàng nên xanh cả gốc, giữ làm K5), A2d2 (khe hở tất định: đơn
  quầy 2 chèn ĐÚNG sau câu đọc "đã lấy" nếu câu đó chạy ngoài giao dịch — đột biến `VS-GOI1-LOAI-TRUOC-TX` bắt), A5e (hai chủ
  quán cùng dừng gói).
- Đổi bài sau lần đỏ đầu (A16): làm chặt A2d (bên thua phải là 400 `GOI_HET_LUOT_LOAI`), thêm A2d2, sửa A5a (đọc trạng thái
  trước khi gọi quản lý), A6d bỏ vế đã phủ ở A2c. Đã chạy lại cả gốc lẫn bản vá, chép lại `bang_chung_do.txt`.

## Bước 5 — chỗ vá → đột biến (`viec/GOI-1/dot_bien.py`, 40 đột biến, 40 bị bắt)
| Chỗ vá | Đột biến |
|---|---|
| tổng tự tính — POST (`packages.js`) | BV-GOI1-TONG, VS-GOI1-TONG-GUI |
| tổng tự tính — PUT | BV-GOI1-TONG-PUT |
| SL loại ≥ 1 | BV-GOI1-SL, VS-GOI1-SL-CHI-AM |
| giá > 0 — POST / PUT | BV-GOI1-GIA, VS-GOI1-GIA-AM, BV-GOI1-GIA-PUT |
| chặn theo loại trong giao dịch (`orders.js` + `goiKhach.js`) | BV-GOI1-LOAI, VS-GOI1-LOAI-SO-SAI, VS-GOI1-LOAI-TRUOC-TX |
| mua gói + lấy ngay | BV-GOI1-MUA-LOAI, VS-GOI1-MUA-NHAN-GOI |
| một cách đếm "đã lấy" | VS-GOI1-DEM-HUY, VS-GOI1-DEM-NULL, BV-GOI1-DEM |
| tên khách / lần lấy gần nhất / lịch sử giao | BV-GOI1-TEN, VS-GOI1-TEN-DON, VS-GOI1-LAN-LAY-HUY, BV-GOI1-LS |
| dừng gói | VS-GOI1-DUNG-QUYEN, BV-GOI1-LYDO, VS-GOI1-LYDO-KHONG-TRIM, VS-GOI1-DUNG-DUA, BV-GOI1-DUNG-CHANGES |
| Settings.jsx | VS-GOI1-O-TONG, BV-GOI1-TU-TINH, BV-GOI1-SL-MAN, VS-GOI1-LOC-AM-THAM, BV-GOI1-GIA-MAN, BV-GOI1-LINK |
| Reports.jsx | BV-GOI1-URL, VS-GOI1-LOC-GOI, BV-GOI1-TIM-TEN, BV-GOI1-DANG-GIAO, BV-GOI1-DO, VS-GOI1-SAP-CHUA-LAY, VS-GOI1-NUT-QUYEN, BV-GOI1-NUT-LYDO |
| Customers.jsx | BV-GOI1-KH-URL |

- Đột biến đầu tiên cho chỗ "trong giao dịch" (`VS-GOI1-LOAI-NGOAI-TX`: đọc bằng `query` ngay trong khối giao dịch) SỐNG — kho
  thử tự xếp hàng; thay bằng `VS-GOI1-LOAI-TRUOC-TX` (đúng phương án B đã loại) + ca A2d2 tất định → bắt.
- Neo P26c: 93 đột biến của `viec/P26c/dot_bien.py` neo khớp đủ trên cây đã vá (script nháp đếm chuỗi). `kiem_neo.py` y nguyên mốc.
- Chạy lại TOÀN BỘ `python3 viec/P26c/dot_bien.py` trên HEAD `8ded1bf`: **93 đột biến bị bắt · 0 KHÔNG bị bắt** — không cái nào đổi mong đợi.

## Đối soát "Dừng gói" (A8 — CLAUDE.md điều 5, chỉ ghi quy tắc)
- Gói dừng KHÔNG phát sinh tiền: không dòng `pos_balance_transactions`, không đổi `pos_wallets`, không đổi đơn mua gói (bài thử A5c).
- Mỗi gói dừng có trong `pos_customer_packages` (`status = 'cancelled'`, không xoá) với `notes` = "Dừng gói: <lý do> — <người>
  <thời điểm> (đã lấy d/t)". Số túi bỏ dở = `total_qty − delivered_qty` — DOI-SOAT-1 cộng theo ngày / tuần / tháng từ `updated_at`.
- Phân biệt với huỷ đơn mua gói (có hoàn tiền, P26c): gói huỷ theo đơn có `notes` "Hủy gói - đơn mua … bị hủy" và có dòng hoàn ví
  `hoan_goi`; gói dừng thì không. Đối soát: gói `cancelled` mà `notes` mở đầu "Dừng gói" ⇒ tổng hoàn của đơn mua phải = 0.

## Phát hiện
- (GOI-1, đo 13.10) libsql CỤC BỘ (kho thử `data/pos_thu.db` / bài thử): hai giao dịch ghi chồng nhau → BEGIN thứ hai ném
  `SQLITE_BUSY` NGAY (không chờ), và sau đó MỌI giao dịch ghi kế tiếp đều BUSY tới khi khởi động lại (script nháp `thu_khoa.js`:
  t1 mở, t2 BUSY, t1 commit, t3 vẫn BUSY). Turso production khác đường kết nối — chưa đo. Ảnh hưởng máy Replit thử nghiệm khi
  hai thao tác ghi cùng lúc. Để việc sau (P8 / ketNoiKho).
- (GOI-1) Mã đơn tính NGOÀI giao dịch (`orders.js` `taoMaDonTheoSo` trước `beginTransaction`): hai đơn đọc cùng số trước khi một
  bên ghi → bên sau 500 `SQLITE_CONSTRAINT_UNIQUE` (thấy khi chạy đột biến kiểm trước giao dịch). Tiền không lẫn (rollback) nhưng
  quầy thấy lỗi 500 thay vì "bấm lại". Để việc sau.
- C5 "💰 DT gói" ở Báo cáo (`Reports.jsx:77`) cộng cả gói đã dừng / đã huỷ — DOI-SOAT-1 cần tách.
- C6 Huỷ đơn MUA gói của gói đã dừng (`orders.js:1376–1388`) ghi đè `notes` (mất lý do dừng); gói chưa lấy lần nào thì xoá hẳn.
  Xoá đơn mua gói (`orders.js:1527–1536`) cũng xoá hẳn gói. Đường tiền hoàn P26c — việc sau.
- C7 `package_buy` không kèm SĐT: không tạo gói (`orders.js:994` `&& phone`) nhưng món lấy ngay vẫn 0đ, không chỗ nào chặn trước.
