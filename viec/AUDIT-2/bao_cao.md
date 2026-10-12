# AUDIT-2 — Báo cáo đợt 2

Đo 12.10.2026 trên máy mây 4 lõi; code chạy thật = `4d175bc` (việc KHÔNG đổi byte nào ngoài `viec/AUDIT-2/` —
`git diff --stat 4d175bc..HEAD -- ':!viec/AUDIT-2/'` rỗng). Chi tiết: `a1_bang.md` (A1), `a2_bang.md` (A2), `a3_bang.md` (A3),
`b2_bang.md` (B1/B2), `b3_bang.md` (B3); công cụ: `dot_bien.py`, `dot_bien_bb.py`, `kiem_neo.py`, `lach.js` + `lach.json`;
bằng chứng công cụ không nói dối: `bang_chung_do.txt`.

## Kết luận một dòng
**Còn NẶNG ⇒ đợt này CHƯA đạt điểm dừng.** 1 NẶNG-code đã biết (lấy vượt lượt gói — LUOI-1 Phát hiện 5, nay có bằng chứng CHẠY,
trúng P26c) + 1 nhóm NẶNG-lưới mới (5 phép chặn / phép tính tiền-điểm-gói ở đường quầy mà lưới KHÔNG bắt khi hỏng). Mọi đột biến cũ
đang BẮT vẫn BẮT (A1: 174 + 20 + 26, không tên nào đổi kết quả). 23 C2F còn SỐNG: 0 NẶNG. Bộ sinh đột biến bất biến mới: 148 →
100 BẮT · 48 SỐNG (0 code sai, 4 vế thừa, 44 thiếu ca dữ liệu tay). Ca chồng nhau: 23 dòng, 2 SỐNG đều có lý do (khoá hai lớp / P26d).

## Bảng phát hiện

| mã | mức | ở HEAD (file:dòng) | lệnh thấy lại | đề xuất khoá (file · ca đỏ) | trúng P26c |
|---|---|---|---|---|---|
| **AU2-1** | **NẶNG-code** | `server/routes/orders.js:222–228` chỉ chặn gói HẾT lượt, không so số ly xin lấy với lượt còn; `:1026–1033` cộng lượt không trần | `python3 viec/AUDIT-2/dot_bien.py A3P-goi-lay-vuot-luot` → BẮT = máy chủ trả 200 cho "gói 3 lượt xin 4 ly" | `orders.js`: trong giao dịch, `SUM(qty from_package) > total_qty − delivered_qty` → 400; `kich_ban.js` KB21 thêm ca "gói 3 lượt xin 4 → 400" (đỏ trên code hiện tại) + I14 `delivered ≤ total` | **CÓ** — sổ việc P26c mục (5) LUOI-1 |
| **AU2-2** | **NẶNG-lưới** | 5 đột biến A3L SỐNG trên đường quầy (`a3_bang.md` mục 2): `loyalty.js:163` biên đổi điểm (`< cost − 1`), `orders.js:770` đơn flash vẫn cộng điểm, `signup-codes.js:213` nhận điểm mã bill cộng đôi, `orders.js:208` lấy gói của khách KHÁC, `orders.js:1383` huỷ đơn gói kèm món lẻ trả thừa lượt | `python3 viec/AUDIT-2/dot_bien.py A3L-redeem-thieu-1-diem A3L-earn-flash-van-cong A3L-nhandiem-cong-doi A3L-goi-bo-kiem-chu A3L-goi-huy-dem-ca-mon-tra-tien` → SỐNG ×5 | `kich_ban.js` thêm ca: KB19 đổi khi có ĐÚNG `cost − 1` điểm → 400; bán đơn flash có SĐT → 0 điểm (I8 bắt); bán có SĐT rồi nhận điểm mã bill → tổng = g × hệ số (I8); lấy gói bằng SĐT khác → 400 GOI_KHONG_DUNG_CHU; huỷ đơn lấy 1 ly gói + 1 món lẻ → gói trả đúng 1 lượt (I14). Ca đỏ: 5 đột biến này chuyển BẮT | gói chủ + huỷ đơn gói: **CÓ** (P26c sửa `orders.js` lấy / huỷ gói); 3 ca điểm: không (P22–P24) |
| AU2-3 | NHẸ | `cong_cu/gia_lap/bat_bien.js` — 44 đột biến (a) SỐNG: I1, I3, I4, I6, I9 và vế lúc-bán của I8 KHÔNG có ca dữ liệu tay; thêm I12–I16 mỗi cái 1–3 vế | `python3 viec/AUDIT-2/dot_bien_bb.py --chi BB-I1 --chi BB-I3 …` | `cong_cu/thu_gia_lap.js` khung dữ liệu tay theo `b2_bang.md` (ca ±1); ca đỏ = các đột biến (a) chuyển BẮT | không (P26c thêm bất biến thì dùng `dot_bien_bb.py`) |
| AU2-4 | NHẸ-tiền | 10 C2F SỐNG ở thao tác CHỦ (sửa / tắt gói, mã, quà; huỷ gói khách; chiết khấu riêng; reset mã bill) — `a2_bang.md` | `python3 viec/AUDIT-1/dot_bien.py C2F-discount-codes-03-update-quan-tri …` | một KB "chủ đổi cấu hình tiền rồi quầy bán ngay" (`a2_bang.md` cuối) | không |
| AU2-5 | NHẸ | `viec/HOC-1/dot_bien.py` `MA3`: ĐỎ đúng ca nhưng vì cổng SẬP ("cổng gặp lỗi bất ngờ … Received null") | `python3 viec/HOC-1/dot_bien.py MA3` | neo lại MA3 để cổng ra đúng câu A3 (không sập), hoặc mẫu loại dòng `[CONG] cổng gặp lỗi bất ngờ` | không |
| AU2-6 | NHẸ | `viec/HOC-2/dot_bien.py` `VS-E3-phien-ban-cu` neo `tu-chay 1.4.0` | `python3 viec/HOC-2/dot_bien.py VS-E3-phien-ban-cu` → LỖI | đổi neo sang `tu-chay 1.5.0` (TU-CHAY-5 Phát hiện 6) | không |
| AU2-7 | NHẸ (đã ghi thiết kế) | `tu_chay/nguoi_gac.js:953` CC-DOC cho mọi `Read` — đọc file bí mật bằng Read LỌT người gác; lớp 1 `.claude/settings.json:28–30` deny canh (`THIET_KE.md:669`) | `node viec/AUDIT-2/lach.js` → 1 LỌT | (tuỳ chọn) người gác chặn Read đường khớp `file_bi_mat` — lớp đôi như Bash `B-BIMAT-FILE`; ca `thu_nguoi_gac` "Read <file bí mật> → CHAN" | không |
| AU2-8 | NHẸ | `viec/P26b/dot_bien.py` `doi-soat-bo-tx` đỏ vì "móc không chạy" (bỏ giao dịch thì không còn chồng) | `python3 viec/P26b/dot_bien.py doi-soat-bo-tx` | mẫu bắt câu ví (`ví -25000` lệch) thay vì mọi dòng KB17 | không |
| AU2-9 | NHẸ (đã biết) | `orders.js:883–893` kiểm lại mã trong giao dịch — `BK-KB20-bo-kiem-lai-ma` SỐNG (UNIQUE mã đơn vấp trước — `kich_ban.js:384–386`); 3 đột biến B3 BẮT qua 500 UNIQUE | `python3 viec/AUDIT-2/dot_bien.py BK-KB20-bo-kiem-lai-ma` | khi P26d sửa mã đơn: siết KB20 về 200 + 400, chạy lại `BK-KB20…`, `BK-KB11-claim-bo-chiem`, `me-bo-khongAm`, `tao-don-chi-kiem-ngoai-tx` | không (P26d) |
| AU2-10 | NHẸ (chặn D3) | `tu_chay/thu_cong.js` chạy riêng 120 / 121 s (HEAD), 126 s (gốc `4d175bc`) ≥ hạn 120 s của `kiem_tra_truoc_khi_giao.js` → `--day-du` ĐỎ "ETIMEDOUT" cả trên gốc; 11.10 đo 94,8 s | `node tu_chay/thu_cong.js` (đo giờ) | KHÔNG nới hạn: chủ quán đo trên máy mình / GitHub; vẫn ≥ 96 s (80 %) → việc chia `thu_cong.js` thành lượt song song (khuôn TACH-GL) | không — nhưng P26c sẽ vướng cùng `--day-du` |

Chi tiết NHẸ còn lại của A3L (không vào bảng — xem `a3_bang.md`): hạn điểm theo quý, hệ số mặc định, `conLai <= 0` chồng với phép
trạng thái, `/deliver` số âm (không màn hình gọi).

## Tỷ lệ BẮT / SỐNG / HỎNG / LẠC theo nhóm (G3 / D2 / D2K là bộ tự chứng minh — cố ý mỗi loại một)

| nhóm | BẮT | SỐNG | HỎNG | LẠC | tỷ lệ BẮT = BẮT/(tổng−HỎNG) |
|---|---|---|---|---|---|
| A1 AUDIT-1 A3 người gác | 16 | 0 | 0 | 0 | 16/16 |
| A1 AUDIT-1 B1 cổng | 8 | 0 | 0 | 0 | 8/8 |
| A1 AUDIT-1 C2 + C2F | 65 | 23 | 0 | 1 | 65/89 (23 SỐNG = A2, 0 NẶNG) |
| A1 AUDIT-1 D1 bộ kiểm | 55 | 0 | 0 | 2 | 55/57 (LẠC `!D1-E11-P20/P26a` như cũ) |
| A1 HOC-1 / HOC-2 (trừ 6 đối chứng) | 17 + 22 | 0 | 0 + 1 | 0 | 39/39 (MA3 BẮT-vì-sập — AU2-5) |
| A3 bundle D2–D5 | 4 | 0 | 0 | 0 | 4/4 |
| A3 logic loyalty / gói | 9 | 8 | 0 | 0 | 9/17 (5 NẶNG-lưới — AU2-2) |
| A3 lách (15 mã) | 14 CHẶN | 1 LỌT | — | — | 14/15 (LỌT đã ghi thiết kế — AU2-7) |
| B1/B2 `dot_bien_bb.py` | 100 | 48 | 0 | 0 | 100/148 (4 thừa, 44 thiếu ca tay — AU2-3) |
| B3 ca chồng (23 dòng, đột biến bỏ khoá) | 4 mới + 19 dẫn | 2 | 0 | 0 | 23/25 (2 SỐNG có lý do — `b3_bang.md`) |
| C1 neo mọi bộ (`kiem_neo.py`) | 645 neo khớp (649 − 4 rữa cố ý) | — | 0 (+4 rữa cố ý) | — | 0 HỎNG ngoài danh sách cố ý; 0 mẫu nghi rữa |

## Đề xuất (không sửa ở việc này)
- **B4** — `tu_chay/skill_lam_viec.md` bước 4, thêm: "Việc đổi `cong_cu/gia_lap/bat_bien.js` → chạy `python3 viec/AUDIT-2/dot_bien_bb.py
  -j 4` ĐỦ, ghi dòng tổng (sinh / BẮT / SỐNG / LẠC / HỎNG) vào `trang_thai.md`; mỗi SỐNG mới xếp (a) ca tay / (b) vế thừa / (c) code
  sai." — `tu_chay/lenh_ra_soat.md`, thêm vào phần kiểm: "PR đổi `bat_bien.js` mà `trang_thai.md` không có dòng tổng `dot_bien_bb.py`
  chạy trên HEAD → KHÔNG ĐẠT." Kèm: dời công cụ về `cong_cu/gia_lap/dot_bien_bb.py` (như TU-CHAY-5 A1 định) + danh sách miễn đọc từ
  chú thích `// thừa vì …`; phép `thu_cong_cu.js` canh hai câu trên (ca đỏ: bỏ câu).
- **C2** — bản sao CẢ KHO bằng `git archive`: công cụ của việc này không cần (mọi đột biến đo trên HEAD, bản sao từ cây làm việc
  sạch như AUDIT-1 / LUOI-1). Đề xuất làm khi một công cụ phải đo trên commit KHÁC HEAD (như `viec/TU-CHAY-5/chay_goc.py`): đưa
  `--ca-kho` vào `cong_cu/ban_sao_goc.py` (TU-CHAY-5 D6), ca trong `baiBanSaoGoc`.
- **C1** — `kiem_neo.py` rà MẪU theo TỪ (≥ 4 chữ cái), không theo câu: đổi chữ phổ biến không bị bắt (giới hạn ghi ở CHƯA KIỂM).

## K5 — luồng hợp lệ không bị ảnh hưởng
Việc không đổi code chạy thật. Công cụ chỉ ghi vào bản sao trong thư mục tạm (`dot_bien_bb.py` kiểm `realpath` đích); mỗi lần chạy
so `git status` trước/sau ("✓ kho thật không đổi"); thử ngắt SIGINT giữa chừng cả `dot_bien_bb.py` (giây 20) và `dot_bien.py`
(giây 3) → 0 thư mục tạm sót. Không ghi file nào trong `viec/AUDIT-2/` khi bộ đo chạy (lời duyệt 12.10).
