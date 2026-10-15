# AUDIT-3 — kế hoạch (chờ duyệt — bước 3 của /lam-viec)

Nền: HEAD `a13d8ad` (= `PHIEU: AUDIT-3` trên `142d5e5`, main sau sổ v31; code chạy thật = `31a5810` Merge PR #21 SO-LUONG-1). Việc CHỈ
KIỂM + BÁO CÁO trong `viec/AUDIT-3/`; không đổi byte nào ngoài đó. Định nghĩa BẮT / SỐNG / HỎNG / LẠC / NẶNG / NHẸ như
`viec/AUDIT-1/phieu.md` (+ TREO như khung AUDIT-1); **thêm (phiếu AUDIT-3): đột biến làm bài thử SẬP = HỎNG, không BẮT.**

## 0. Số đo lúc lập kế hoạch (HEAD `a13d8ad`, 15.10.2026, máy mây, đo RIÊNG tuần tự bằng script nháp — không đoán)

| Thứ | Số đo | Lệnh |
|---|---|---|
| `thu_P26c.js` | 3,4 s · 105 đạt · 0 hỏng | `node cong_cu/thu_P26c.js` |
| `thu_GOI1.js` | 2,6 s · 101 đạt · 0 hỏng | `node cong_cu/thu_GOI1.js` |
| `thu_P26b.js` | 1,8 s · 66 đạt · 0 hỏng | `node cong_cu/thu_P26b.js` |
| `thu_P26a.js` / `thu_P20.js` / `thu_P21.js` | 0,9 s · 8 · 0 / 1,2 s · 51 · 0 / 1,0 s · 14 · 0 | `node cong_cu/thu_P2x.js` |
| giả lập đủ (32 KB, 4 lượt, 18 bất biến) | 33,8 s · ĐẠT | `node cong_cu/gia_lap/chay.js` |
| `thu_gia_lap.js` đủ / `--chi-du-lieu-tay` | 49,5 s · 145 đạt · 0 hỏng / 1,1 s · 84 đạt | `node cong_cu/thu_gia_lap.js` |
| `thu_TOCDO1.js` · `thu_nguoi_gac.js` · `thu_cong_cu.js` | 1,3 s · 17/0 · 6,4 s · 924/924 · 3,3 s · 101/0 | — |
| `viec/AUDIT-2/lach.js` | 0,1 s · CHẶN 14 · LỌT ĐÃ BIẾT 1 · LỌT 0 (trên 15) — như AUDIT-2 | `node viec/AUDIT-2/lach.js` |
| `viec/AUDIT-2/kiem_neo.py` | **SẬP 0,2 s, thoát 1**: `git show 9521cec:cong_cu/gia_lap/kich_ban.js` → 128 — kho máy mây là bản CHỤP NÔNG (`git rev-parse --is-shallow-repository` = true, 422 commit), KHÔNG có `9521cec` (gốc LUOI-1) lẫn `b9b3928`; có `4d175bc`. `viec/LUOI-1/dot_bien.py:26` gọi `git show 9521cec:…` LÚC NẠP → mọi thứ nạp LUOI-1 (kiem_neo, chạy LUOI-1) sập ở đây. Người gác chặn `git fetch --deepen` (GIT-KEO) → **Câu hỏi 1** | `python3 viec/AUDIT-2/kiem_neo.py` |
| `kiem_tra_truoc_khi_giao.js` (bản nhanh) | 99,7 s · thoát 0 "Qua hết" | `node kiem_tra_truoc_khi_giao.js` |
| `--day-du` | 191,6 s · thoát 0 · 67 phép "Qua hết" | `node kiem_tra_truoc_khi_giao.js --day-du` |
| một đột biến mẫu mỗi bộ (0b, chạy riêng tuần tự, mỗi lệnh gồm chép bản sao + bài) | GOI-1 `BV-GOI1-TONG` 3,0 s · GOI-2 `BV-GOI2-GOM` 2,9 s · P26c `BV-B2-bo-chan-so-0` 3,7 s · P26b `huy-bo-cong` 2,0 s · P26b `huy-kiem-ngoai-tx` (kb15) 5,9 s · SO-LUONG-1 `BV-SOLUONG1-MON` (đối chứng + 1) 6,3 s · TACH-GL `VS-SRV-qua-bo-tran` (kiểm sạch gl29 + 1) 48,5 s · AUDIT-2 `D2K -j 3` 5,6 s — **D2K ra HỎNG 2 · SỐNG 1: `D2K-da-biet` HỎNG trên HEAD** (neo câu thu nợ `status != 'cancelled'` → P26c C1 đổi thành `status = 'completed'`, `orders.js` 0 lần; cùng lỗi với `G3-da-biet` của AUDIT-1 — P26c dựng lại `BV-G3-da-biet-thu-no`) → bằng chứng "đã biết → BẮT" của AUDIT-2 không còn tự chứng minh được trên HEAD; AUDIT-3 dùng D2 riêng (A4) | script nháp `do_mau.py` |
| mã luật người gác | 76 — `LUAT` HEAD so `4d175bc`: 0 mã mới, 0 mã bỏ; `git diff --stat 4d175bc..HEAD -- tu_chay/` rỗng | `grep -o "luat('…')" tu_chay/nguoi_gac.js \| sort -u` |
| code tiền đổi từ sau AUDIT-2 | `server/routes/orders.js` +195/−, `packages.js` +156, `refunds.js` +31, `damages.js` +27, `wallets.js` +18 (`ghiHoan`), `database.js` +8, MỚI `utils/goiKhach.js` 76, `utils/tienDaTra.js` 93; `kich_ban.js` +138, `bat_bien.js` +46 | `git diff --stat 4d175bc..HEAD -- server/ cong_cu/` |

Số đo cũ để so (KHÔNG dùng thay số đo): AUDIT-1 đủ 174 `-j 3` = 1992 s; AUDIT-2 32 `-j 3` = 486 s; `dot_bien_bb.py -j 4` = 591 s
(AUDIT-2 12.10); TACH-GL 29 = 755 s (LUOI-2, `0714b66`); LUOI-1 80 = 91 s (P26c); `thu_cong.js` 119–126 s (AU2-10).

## 1. Nguyên tắc (đơn giản nhất mà vẫn đúng)
- **Dùng lại nguyên bộ công cụ cũ, không sửa file bộ cũ** (phiếu). Viết mới đúng BA file trong `viec/AUDIT-3/`: `boc.py` (A1 — lớp bọc
  đối chứng + đột biến sập cho mọi bộ), `dot_bien.py` (A4 — đột biến độc lập, khuôn SO-LUONG-1 vì khuôn đó đã có đối chứng + bắt "bài
  thử sập"), `kiem_neo.py` (A5 — chép bản AUDIT-2, thêm các bộ chưa rà). Không dựng khung đo mới.
- **Chạy nặng tuần tự, đo riêng**; không ghi file nào trong `viec/AUDIT-3/` khi bộ đo đang chạy (bài học AUDIT-2 "KHO BẨN" oan); kết quả
  `--json` ghi ra thư mục nháp, chép bảng vào `.md` sau.
- Mỗi nhóm xong → commit + push, `trang_thai.md` ghi nhóm xong (hết hạn mức → `/lam-viec AUDIT-3 tiep`).

## 2. Nhóm A

### A1 — ĐỐI CHỨNG trước tiên: `viec/AUDIT-3/boc.py` (ngân sách phiếu 60–120 dòng; ước ~110–130, xem mục 6)
**Danh sách thật từ code** (đọc lượt này) — bộ nào có đối chứng, bộ nào phân biệt được "sập":

| bộ | đối chứng (bản chưa đột biến chạy xanh, đếm số) | phân biệt sập với đỏ đúng ca |
|---|---|---|
| `AUDIT-1/dot_bien.py` (khung) · `AUDIT-2/dot_bien.py` (nạp khung) | CÓ: `kiem_sach` 3 bản mỗi cách chạy (`:333–340`), đỏ → thoát 4 | MỘT PHẦN: BẮT đòi mẫu khớp (`:317`), sập → LẠC (G3-sap = LẠC, AUDIT-2 ghi); mẫu rộng `r'✗ '` (A3L) có thể khớp dòng "✗ bài thử sập" của `thu_gia_lap` — c2full/c2luoi không chạy bài đó, nhưng phải THỬ |
| `AUDIT-2/dot_bien_bb.py` | CÓ: "kiểm sạch 3 bản" (`:321–323`) | CÓ: D2-sap → LẠC (loại "SẬP" khỏi BẮT, `:269` vùng) |
| `LUOI-1/dot_bien.py` · `TACH-GL/dot_bien.py` | CÓ: `sạch:<cách>` trước khi chấm (LUOI-1 `main`, TACH-GL `main`) → thoát 4 | MỘT PHẦN: BẮT = MỌI mẫu khớp; sập → LẠC; không có đột biến sập |
| `SO-LUONG-1/dot_bien.py` · `TOC-DO-1/dot_bien.py` | CÓ: `doi_chung()` | CÓ: dòng `Bài thử sập` / `ném` → "không phải bị bắt" |
| `P26b`, `P26c`, `GOI-1`, `GOI-2` (`dot_bien.py` khuôn GOI-1) | **KHÔNG** (TOC-DO-1 Phát hiện 3) | **KHÔNG**: đạt = thoát ≠ 0 + mẫu khớp, in dòng khớp đầu tiên; bài sập ném trước ca thì mẫu hẹp (`✗ A1a`) không khớp → "không bị bắt", nhưng SẬP + 1 ca đỏ cùng mẫu vẫn tính "bị bắt" |

**Phương án A (chọn): một file `boc.py`, hai việc.**
1. `python3 viec/AUDIT-3/boc.py <P26b|P26c|GOI-1|GOI-2> [tên…] [-j N]` — chạy ĐỦ 4 bộ không có đối chứng qua lớp bọc: nạp bảng
   `DOT_BIEN` + hàm `ap` của bộ bằng `exec` cắt tới `\ndef chay1(` (cách `nap()` của `kiem_neo.py`, `sys.dont_write_bytecode`), dựng bản
   sao đúng như `chay1` của bộ (server/ · client/src · cong_cu/gia_lap; node_modules / tu_chay / server chỉ nối symlink đọc), gọi đúng lệnh
   của bộ (`BAI` / nhánh `cach` chép theo bộ: P26c có `thu thub cli kbN thugl`; P26b `thu kbN gl13 thugl`; GOI-1 `thu cli`; GOI-2 `thu cli
   p26c thub`). Chấm theo AUDIT-3: **HỎNG** = neo không khớp / đích ngoài thư mục tạm / SẬP (đầu ra có `Bài thử sập` (P26b/P26c/GOI1
   `:451/:829/:817`), `Giả lập: SẬP` (chay.js thoát 2), `bài thử sập` (thu_gia_lap), hoặc thoát 2) · **BẮT** = thoát ≠ 0 + mẫu khớp + không sập
   · **LẠC** = thoát ≠ 0 không mẫu · **SỐNG** = thoát 0. ĐỐI CHỨNG: mỗi cách chạy dùng tới, bản sao CHƯA đột biến chạy trước, phải thoát 0 và
   có dòng tổng (`N đạt · 0 hỏng` / `ĐẠT`) — đỏ thì DỪNG, thoát 4, không chấm. Cuối: so `git status` trước/sau (lọc `viec/AUDIT-3/`), thư
   mục tạm xoá (finally + SIGINT/SIGTERM).
2. `python3 viec/AUDIT-3/boc.py --sap` — mỗi bộ trong danh sách A2 (11 bộ) một đột biến CỐ Ý SẬP (`}}}{{{` vào file đầu tiên bộ đó đụng):
   4 bộ khuôn chạy qua lớp bọc (mục 1) → phải HỎNG; 7 bộ có đối chứng sẵn: nạp module bằng `importlib` (đường dẫn thật), **nối thêm** một
   dòng vào bảng `DOT_BIEN` trong bộ nhớ (không sửa file) — AUDIT-1 `G3-sap` có sẵn (mong LẠC), AUDIT-2 thêm `('SAP-AUDIT2','D2K','c2luoi',
   [(O,'// 1. Tạo đơn hàng','}}}{{{',1)], r'✗ ')` (mẫu RỘNG cố ý — thử đúng rủi ro ở bảng trên), bb có `D2-sap`, LUOI-1 / TACH-GL nối
   `('SAP-…', 'kb1'/'gl29', …, [mẫu], 'LẠC')`, SO-LUONG-1 / TOC-DO-1 gọi thẳng `chay1` với dòng nối → phải ra "bài thử SẬP / NÉM"; rồi gọi
   `main()` / `chay1` của bộ với đúng tên đó. Kết quả: **không bộ nào ra BẮT** (ra LẠC ở khung AUDIT-1/LUOI-1/TACH-GL được: định nghĩa AUDIT-3
   xếp "sập" = HỎNG, bảng A2 ghi "LẠC-sập = HỎNG"). Bộ nào ra BẮT → phát hiện NẶNG-lưới (bộ đó nói dối).
   Phương án B: thêm đối chứng vào từng file bộ cũ — phiếu cấm. Phương án C: chép 4 bộ khuôn vào `viec/AUDIT-3/` rồi sửa — trùng ~600
   dòng, bỏ.
   Rủi ro A: 4 bộ khuôn có hàm `ap` khác nhau (P26b `moi` là tuple "chỉ thay lần thứ k") → bọc dùng `ap` CỦA bộ (nạp cùng `exec`), không viết
   lại; P26b `ap` không kiểm realpath → bọc kiểm trước khi gọi.

### A2 — chạy lại ĐỦ trên HEAD (tuần tự, đo riêng; `--json` / nhật ký ra thư mục nháp)
| bộ | lệnh | kết quả mong (khác AUDIT-2 → giải thích trong `a2_bang.md`) |
|---|---|---|
| AUDIT-1 (174, cả G3) | `python3 viec/AUDIT-1/dot_bien.py G3 A3 B1 C2 D1 C2F -j 3 --json <nháp>` | G3 1/1/1/1 (cố ý); `G3-da-biet` nay HỎNG (neo thu nợ `status != 'cancelled'` → P26c C1 đổi; P26c dựng lại `BV-G3-da-biet-thu-no`); C2F: SỐNG mong giảm (LUOI-2 / P26c thêm ca) |
| C2F SỐNG → kết luận bằng `c2luoi` | `python3 viec/AUDIT-3/boc.py --c2luoi <tên C2F SỐNG…>` (~15 dòng trong `boc.py`: nạp module AUDIT-2 `m2`, gán `m2.K.DOT_BIEN` = các dòng C2F của AUDIT-1 với cách chạy đổi `c2full → c2luoi`, gọi `m2.K.main()`) | SỐNG thật = SỐNG cả c2luoi (có thu_P26c) |
| AUDIT-2 (32) | `python3 viec/AUDIT-2/dot_bien.py -j 3` | `D2K-da-biet` HỎNG (đo 0b — rữa vì P26c C1, ghi "đã thay bằng P26c `BV-G3-da-biet-thu-no`"); A3L 5 SỐNG cũ → BẮT (LUOI-2 đã ghi 7 BẮT `viec/LUOI-2/trang_thai.md:246`); `A3P-goi-lay-vuot-luot` NGƯỢC NGHĨA → mong SỐNG (= máy chủ nay trả 400; neo `const g1 = await goiCua(m1);` còn 1 lần ở `kich_ban.js:435`); D2K như cũ |
| `dot_bien_bb.py` (sinh từ `bat_bien.js` HEAD, +46 dòng so AUDIT-2) | `python3 viec/AUDIT-2/dot_bien_bb.py -j 4` + `--liet-ke` so với `bb_neo.json` | tên SINH LẠI khác ảnh (I18/I19 thêm) → `kiem_neo` báo "tên trôi": ghi là HỆ QUẢ P26c (AUDIT-2 B4 đã dặn sinh lại ảnh cùng commit — đề xuất, không sửa `bb_neo.json` vì ngoài Phạm vi); số BẮT/SỐNG so 100/48 |
| P26b (59 + 12 K1) · P26c (93) · GOI-1 (49) · GOI-2 (59) | `python3 viec/AUDIT-3/boc.py P26b` … (qua lớp bọc A1) | LẠC/HỎNG đã ghi: P26b 9 từ trước (GOI-2 trang_thai:119) + `me-huy/xoa-hoan-gap-doi`…; P26c 4 (GOI-2 Q-F dựng lại cùng tên trong GOI-2); GOI-1 7 (GOI-2 dựng lại, bảng GOI-2 trang_thai:98–100) + 2 (SO-LUONG-1 dựng lại `…-THU-GOI1`) — mỗi tên LẠC/HỎNG ghi "đã thay bằng <tên>" hoặc = phát hiện |
| SO-LUONG-1 (17) | `python3 viec/SO-LUONG-1/dot_bien.py` | 17/17 bắt, đối chứng xanh |
| LUOI-1 (80) | `python3 viec/LUOI-1/dot_bien.py` — **chỉ chạy được nếu Câu hỏi 1 cho kho đủ sâu**; không thì `boc.py --luoi1` nạp nguồn LUOI-1 với dòng `KB10_GOC = _kb10(git show 9521cec…)` thay bằng `''` trong bộ nhớ, chạy 78 đột biến HEAD, 2 `GOC-*` ghi CHƯA KIỂM | 80/80 đúng mong đợi (P26c đo 91 s) |
| TACH-GL (29) | `python3 viec/TACH-GL/dot_bien.py` | 25 BẮT · 3 HỎNG + 1 LẠC đã ghi (LUOI-2 trang_thai:110–112: `VS-kb-hai-luot`, `VS-luot-trung-thieu`, `BV-cha-kiem-mot-lan`, `VS-luot-thieu-bat-bien` — P26c dựng lại cùng tên trong `viec/P26c/dot_bien.py`) |
Bảng `a2_bang.md`: BẮT/SỐNG/HỎNG/LẠC từng tên, cột "AUDIT-2", cột "vì sao khác". HOC-1 / HOC-2 không trong danh sách A2 → không chạy.
TOC-DO-1 (10) không trong danh sách (không đụng tiền) → chỉ rà neo (A5) + `--sap` (A1, vì bộ có sẵn đối chứng nên rẻ: 1 lần `thu_TOCDO1`).

### A3 — đóng sổ AUDIT-2
| mã | nay | lệnh thấy lại | ca |
|---|---|---|---|
| AU2-1 lấy vượt lượt | P26c A2: trừ lượt trong giao dịch có trần `delivered_qty + ? <= total_qty` (`orders.js:926–928`), lấy ngay không vượt (`:410`) | `python3 viec/AUDIT-2/dot_bien.py A3P-goi-lay-vuot-luot` → SỐNG (ngược nghĩa = máy chủ đúng); `python3 viec/AUDIT-3/boc.py P26c BV-A2-bo-tran VS-A2-bo-kiem-changes BV-A2-lay-ngay-bo-tran` → BẮT | `thu_P26c.js` A2a (`:199`), A2d (`:210`) |
| AU2-2 5 đột biến A3L | LUOI-2 thêm ca L1a–L6a vào `thu_P26c.js`, AUDIT-2 đổi 7 dòng sang `c2luoi` | `python3 viec/AUDIT-2/dot_bien.py A3L-redeem-thieu-1-diem A3L-earn-flash-van-cong A3L-nhandiem-cong-doi A3L-goi-bo-kiem-chu A3L-goi-huy-dem-ca-mon-tra-tien -j 3` → BẮT ×5 | L1a, L2a, L3a, L4a, L5a |
| AU2-11 số lượt do quầy gõ | P26c A6: `soLuotGoi = Number(pkg.total_qty)` (`orders.js:408`), màn Bán hàng bỏ ô nhập; SO-LUONG-1: `pkgQty` nguyên ≥ 1 (`:202–203`) | `boc.py P26c BV-A6-so-man-hinh VS-A6-chi-sua-ten-dong BV-A6-o-nhap-so-luot` → BẮT; `python3 viec/SO-LUONG-1/dot_bien.py BV-SOLUONG1-GOI VS-SOLUONG1-GOI-LAM-TRON` → bắt | A6a (`:324`), A6b (`:326`), S2b, S2d |
Chưa xử lý nào còn → ghi "còn mở" + đề xuất.

### A4 — đột biến ĐỘC LẬP mới: `viec/AUDIT-3/dot_bien.py` (khuôn `viec/SO-LUONG-1/dot_bien.py`, ngân sách 100–200 dòng; ước ~90)
Cách chạy: `p26c` (`thu_P26c.js --may-chu`), `thu` (`thu_GOI1.js --may-chu`), `thub` (`thu_P26b.js --may-chu`), `gl` (`gia_lap/chay.js
--may-chu` đủ 32 KB — cho đột biến chỉ bất biến giả lập mới thấy). Đối chứng mỗi cách trước (khuôn SO-LUONG-1), dòng `Bài thử sập` /
`Giả lập: SẬP` → HỎNG không bắt. Tên = NGUYÊN chuỗi, mỗi dòng một `('…', …)` (A17). Chỗ chọn = chỗ bộ của CHÍNH việc đó chưa đột biến —
đối chiếu bằng `grep -l "<neo>" viec/*/dot_bien*.py` lúc lập kế hoạch (0 file khớp, trừ hai dòng ghi chú "cùng neo"):

| việc | tên | file:dòng (HEAD) | đổi gì (lỗi giả) | bài / ca mong bắt |
|---|---|---|---|---|
| P26c | `BV-AU3-P26C-DATRA-BO-TRU-SHIP` | `tienDaTra.js:18` | `Number(order.total \|\| 0) - Number(order.shipping_fee \|\| 0)` → bỏ `- shipping_fee` (đã trả tính cả phí ship → đền / hoàn quá) | thu_P26c B1*/A5* (đơn có phí ship) — nếu không ca nào có ship → SỐNG = phát hiện |
| P26c | `VS-AU3-P26C-DATRA-GIA-GOC` | `tienDaTra.js:16` | `Number(d.flash_unit_price \|\| d.tier_unit_price \|\| d.unit_price \|\| 0)` → `Number(d.unit_price \|\| 0)` (bỏ giá flash / hạng) | thu_P26c B1a–c (trần theo số đã trả sau flash) |
| P26c | `VS-AU3-P26C-DEN-TRAN-CA-DON` | `damages.js:173` | bỏ `.filter((d) => d.product_code === product_code)` (trần đền tính trên CẢ đơn) | thu_P26c B1a / thub C1a, C6b |
| P26c | `VS-AU3-P26C-DUYET-VI-DA-TRA-CHI-CON` | `refunds.js:164` | `Number(refund.refund_amount) + (don.parent_phone ? … : 0)` → chỉ `Number(refund.refund_amount)` (phần mẹ ăn vào phần con) | thub M5 / thu_P26c A5g, C3 |
| GOI-1 | `VS-AU3-GOI1-LOAI-KHONG-CONG-DON` | `goiKhach.js:24` | `xin[k] = (xin[k] \|\| 0) + Number(m.quantity)` → `xin[k] = Number(m.quantity)` (hai dòng cùng loại không cộng) | thu_GOI1 A2* (nếu không ca hai dòng cùng loại → SỐNG = phát hiện NẶNG) |
| GOI-1 | `BV-AU3-GOI1-LOAI-BO-DA-LAY` | `goiKhach.js:28` | `const con = Number(g.qty) - Number(da?.delivered_qty \|\| 0)` → `Number(g.qty)` | thu_GOI1 A2a |
| GOI-1 | `VS-AU3-GOI1-DEM-DONG-THAY-SL` | `goiKhach.js:15` | `SUM(oi.quantity) AS delivered_qty` → `COUNT(*) AS delivered_qty` | thu_GOI1 A2a / A2c (lấy 1 dòng SL 2) |
| GOI-2 | `BV-AU3-GOI2-BO-TRAN-DA-NHAN` | `tienDaTra.js:87` | `Math.max(0, Math.min(goc, total − so.nhan))` → `goc` (hoàn không trừ đã hoàn / đã đền) | thu_GOI1 B3l / B7j (I19) |
| GOI-2 | `VS-AU3-GOI2-HOAN-CA-DA-LAY` | `tienDaTra.js:80` | `const con = Math.max(0, total_qty − delivered_qty)` → `Number(cp.total_qty)` | thu_GOI1 B3c/B3d |
| GOI-2 | `VS-AU3-GOI2-NHAN-BO-DEN` | `tienDaTra.js:83` | `type IN ('refund', 'compensation')` → `type IN ('refund')` (trần quên tiền đã đền) | thu_GOI1 B3* / I19 — không ca "đền rồi kết thúc gói" → SỐNG = phát hiện |
| GOI-2 | `VS-AU3-GOI2-GHI-HOAN-PHAN-VI-HOAN-GOI` | `wallets.js:85` | `[tuVi, 'cash', 'total_spent']` → `[tuVi, 'hoan_goi', null]` (phần ví không giảm total_spent — đối xứng K4 với `VS-GOI2-TIEN-MAT-GIAM-TOTAL-SPENT`) | thu_GOI1 B3a2 / I11, I18 (thu_P26c A5c2) |
| SO-LUONG-1 | `BV-AU3-SL-HAM-LUON-DUNG` | `orders.js:37` (cùng neo `VS-SOLUONG1-BO-NGUYEN` — SO-LUONG-1 tự ghi CHƯA KIỂM "bỏ hàm") | `soNguyenDuong = (x) => true` | thu_P26c S1c + S2b |
| SO-LUONG-1 | `VS-AU3-SL-TIEN-MOT-GOI` | `orders.js:416` | `subtotal += pkg.price * pkgQty` → `pkg.price` (mua 2 gói thu tiền 1 — đúng lỗi "xoá `pkg_qty \|\| 1`" SO-LUONG-1 không đột biến được) | thu_P26c S2* (mua 2 gói) |
| SO-LUONG-1 | `VS-AU3-SL-TAO-MOT-GOI` | `orders.js:1036` | `for (let i = 0; i < pkgQty; i++)` → `i < 1` (thu tiền 2 gói, tạo 1) | thu_P26c S2* / I14 |
| SO-LUONG-1 | `BV-AU3-SL-THE-BO-CONG` | `orders.js:187` (cùng neo `VS-SOLUONG1-THE-SDT-THO`, bộ đó chỉ có VS-) | `if (membership_buy && …) {` → `if (false) {` | thu_P26c S4c |
Ngoài ra D2 (công cụ không nói dối) ngay trong file: `D2-AU3-sai-chuoi` → HỎNG, `D2-AU3-da-biet` (= `BV-SOLUONG1-MON` cùng neo) → BẮT,
`D2-AU3-vo-hai` (đổi chú thích) → SỐNG, `D2-AU3-sap` (`}}}{{{`) → HỎNG-sập. SỐNG ở đột biến đụng tiền / ví / gói = NẶNG → `bao_cao.md`
kèm đề xuất ca. Tổng 15 + 4 D2 = 19 dòng bảng.

### A5 — `viec/AUDIT-3/kiem_neo.py` (chép bản AUDIT-2 + ~40 dòng)
- Thêm `nap()` cho: GOI-1, GOI-2, P26c, SO-LUONG-1 (cắt `\ndef ap(`; tuple `(tên, cách, [(file, cũ, mới, n)], mẫu)`; tiền tố file theo cách:
  `cli` → `client/`, `thugl` → `cong_cu/gia_lap/`, còn lại `server/`), TOC-DO-1 (cắt `\ndef chay_bai(`; `(tên, [(cũ, mới, n)], mẫu)` trên
  `kiem_tra_truoc_khi_giao.js`), AUDIT-3 (`dot_bien.py` của việc này). LUOI-2 KHÔNG có `dot_bien*.py` / `do_*.js` (chỉ `.md`; đột biến LUOI-2
  nằm trong `viec/AUDIT-2/dot_bien.py` A3L — đã rà) → ghi rõ. LUOI-1: nạp như AUDIT-2 nhưng dòng `git show 9521cec` → bọc `try`: kho nông
  thì thay bằng `''` và in "(LUOI-1: 2 GOC-* không rà được — kho nông)" (Câu hỏi 1).
- `RUA_CO_Y` mở rộng theo hồ sơ đã ghi (mỗi tên một lý do "đã thay bằng …"): GOI-1 7 (GOI-2) + 2 (SO-LUONG-1); P26c 4 (GOI-2 Q-F); TACH-GL 4
  (P26c); AUDIT-1 `G3-da-biet` + AUDIT-2 `D2K-da-biet` (P26c `BV-G3-da-biet-thu-no`); HOC-2b `VS-q9-me-lon-hon-bang-0`, `BV-q9-bo-hoan-me` (P26c); P26b 9 từ trước
  (GOI-2 trang_thai:119) — P26b có bản thay? `me-huy/xoa-hoan-gap-doi` → P26c `VS-me-hoan-gap-doi-*` → GOI-2; 5 neo `refunds.js` + 2
  `damages.js`: đối chiếu từng tên với bảng "Đột biến cũ đổi" trong `viec/P26c/trang_thai.md` lúc làm — **KHÔNG có bản thay = phát hiện**.
  HỎNG ngoài danh sách = phát hiện. Kết quả vào `trang_thai.md` (bắt buộc chạy).

### A6 — lách người gác
`LUAT` HEAD = 76 mã, không mã mới từ sau AUDIT-2 (mục 0) → KHÔNG thêm ca lách; chạy lại `node viec/AUDIT-2/lach.js` → mong CHẶN 14 ·
LỌT ĐÃ BIẾT 1 (CC-DOC — AU2-7) · LỌT 0 (đã đo lượt này: đúng vậy; ghi lại vào `trang_thai.md` khi làm A6).

## 3. Nhóm D — sản phẩm
- **D1** `bao_cao.md` ≤ 200 dòng: kết luận một dòng (đạt / chưa đạt điểm dừng = không NẶNG?) · bảng `AU3-<n>` (mức · file:dòng HEAD · lệnh
  thấy lại · đề xuất khoá: file, ca đỏ) · tỷ lệ BẮT/SỐNG/HỎNG/LẠC theo nhóm (A1 sập, A2 từng bộ, A4). Chi tiết: `a2_bang.md` (A2 từng tên),
  `a4_bang.md` (nếu cần). Phát hiện đã thấy lúc lập kế hoạch: **AU3-1** kho máy mây nông → `viec/LUOI-1/dot_bien.py` và
  `viec/AUDIT-2/kiem_neo.py` sập (NHẸ-công cụ; đề xuất: LUOI-1 bọc `git show` trong `try`, hoặc hook mở phiên fetch đủ sâu).
- **D2** `bang_chung_do.txt`: đầu ra nguyên văn `python3 viec/AUDIT-3/dot_bien.py D2-AU3-sai-chuoi D2-AU3-da-biet D2-AU3-vo-hai D2-AU3-sap`
  (HỎNG · BẮT · SỐNG · HỎNG-sập) và `boc.py --sap` (11 bộ, không BẮT) và một lần `boc.py GOI-1 <đã biết> <sai chuỗi>`. Không có bài thử
  đỏ → không dòng `SỐ CA` (phiếu "Bài thử đỏ: không"). Mọi tên đột biến của `viec/AUDIT-3/dot_bien.py` ghi trong `trang_thai.md` (A17).
- **D3** `npm test` + `--day-du` xanh ở cuối (số đo mục 0: bản nhanh 99,7 s thoát 0); `git status` sạch sau mỗi lần chạy công cụ; thử ngắt
  `timeout -s INT 15 python3 viec/AUDIT-3/boc.py GOI-1` → không sót thư mục tạm (ghi). `git diff --stat a13d8ad..HEAD -- ':!viec/AUDIT-3/'`
  rỗng. `.gitignore` che `__pycache__` → `sys.dont_write_bytecode = True` trong cả ba file.

## 4. Đường song song cần canh (K4) · luồng hợp lệ (K5)
- Việc không đổi code chạy thật → không luồng quầy nào bị chặn. Công cụ chỉ ghi bản sao trong thư mục tạm (`ap` của bộ + kiểm `realpath`
  trong bọc), `TMPDIR` riêng cho lệnh con; so `git status` trước/sau.
- K4 trong A4: mỗi đột biến ở `tienDaTra.js` / `wallets.ghiHoan` đụng CẢ huỷ, xoá, duyệt hoàn, kết thúc gói (4 chỗ gọi) → bảng A4 ghi ca
  của MỖI đường bắt được (SỐNG ở một đường = phát hiện riêng). `goiKhach.vuotTheoLoai` gọi ở 2 chỗ (`orders.js:414` mua, `:869` lấy) → cùng.
- Bọc A1 không được "bắt oan" bộ cũ: đối chứng của bọc so với dòng tổng của chính bài (105 / 101 / 66 đạt) — lệch = bọc sai, không phải bộ sai.

## 5. Ca thử ↔ nghiệm thu (1-1)
| mục phiếu | cách chứng minh (lệnh / file) |
|---|---|
| A1 | `boc.py --sap` 11 dòng, mỗi bộ ≠ BẮT; `boc.py <4 bộ>` in dòng đối chứng xanh + đếm; `bang_chung_do.txt` mục 1 |
| A2 | `a2_bang.md` từng tên (AUDIT-1 174 + AUDIT-2 32 + bb + P26b + P26c + GOI-1 + GOI-2 + SO-LUONG-1 + LUOI-1 + TACH-GL), cột khác AUDIT-2 + lý do; LẠC → "đã thay bằng" |
| A3 | `trang_thai.md` mục A3: 3 dòng AU2-1/2/11, mỗi dòng lệnh + ca |
| A4 | `viec/AUDIT-3/dot_bien.py` ≥ 3 mỗi việc (P26c 4 · GOI-1 3 · GOI-2 4 · SO-LUONG-1 4), VS + BV, đối chứng; bảng kết quả trong `trang_thai.md`; SỐNG tiền = NẶNG trong `bao_cao.md` |
| A5 | `python3 viec/AUDIT-3/kiem_neo.py` đầu ra nguyên văn trong `trang_thai.md`; HỎNG ngoài `RUA_CO_Y` = phát hiện |
| A6 | `node viec/AUDIT-2/lach.js` đầu ra; dòng "0 mã mới" kèm lệnh đếm |
| D1 / D2 / D3 | `bao_cao.md` · `bang_chung_do.txt` · dòng `npm test`, `--day-du`, `git status`, `git diff --stat` trong `trang_thai.md` |

## 6. Thời gian máy (ước từ số đo mục 0, chạy RIÊNG tuần tự)
| nhóm | ước | căn cứ |
|---|---|---|
| A1 bọc 4 bộ (P26b 71 · P26c 93 · GOI-1 49 · GOI-2 59 = 272 đột biến, `-j 4`) | ~6 phút | 0b: một đột biến 2,0–3,7 s (kể cả chép server/), `kbN` 5,9 s; 272 × ~3,5 s ÷ 4 + 10 dòng kb ≈ 5 phút + đối chứng 9 cách chạy ≈ 1 phút |
| A1 `--sap` 11 bộ | ~5 phút | mỗi bộ 1 đối chứng + 1 đột biến; AUDIT-1/AUDIT-2 kiểm sạch 3 bản ×1 cách ≈ 80 s |
| A2 AUDIT-1 174 | ~35 phút | 1992 s ở AUDIT-2 (cùng khung, `-j 3`) |
| A2 c2luoi cho C2F SỐNG (≤ 23) | ~8 phút | c2luoi ≈ c2full + thu_P26c 3,4 s; kiểm sạch 3 bản |
| A2 AUDIT-2 32 | ~9 phút | 486 s |
| A2 bb (~150) | ~10 phút | 591 s |
| A2 SO-LUONG-1 · LUOI-1 · TACH-GL | ~1 + 2 + 13 phút | 0b: 6,3 s cho đối chứng + 1 → 17 ≈ 40 s · 91 s (P26c) · 755 s (LUOI-2; 0b: kiểm sạch + 1 = 48,5 s, 29 × 24 s ÷ 2) |
| A4 19 đột biến + 4 đối chứng | ~2 phút | 0b: ~3,5 s một đột biến (kể cả chép) × 19 ÷ 4 + 4 đối chứng (cách `gl` 33,8 s) |
| A5 kiem_neo · A6 lach | < 1 phút | 0,2 s + 0,1 s |
| D3 `npm test` + `--day-du` | ~2 + ~3,5 phút | 99,7 s · 191,6 s (mục 0) |
| **tổng** | **~100 phút** (< 180) | không cần cắt; nếu máy chậm hơn 1,8× thì cắt bằng cách bỏ chạy lại AUDIT-1 nhóm A3 / B1 / D1 (16 + 8 + 57, không đụng tiền — AUDIT-2 không tên nào đổi) → tiết kiệm ~15 phút, ghi rõ |

## 7. Câu hỏi (cần chủ quán trả lời trong lời duyệt)
1. **Kho máy mây là bản chụp NÔNG (shallow, 422 commit), không có `9521cec`** → `viec/LUOI-1/dot_bien.py` không nạp được (gọi `git show
   9521cec` lúc nạp) ⇒ `viec/AUDIT-2/kiem_neo.py` sập và A2 LUOI-1 không chạy được nguyên bản. Người gác chặn `git fetch --deepen`. Chọn:
   (a) chủ quán làm kho đủ sâu (hook mở phiên / môi trường) rồi tôi chạy nguyên bản; (b) tôi chạy LUOI-1 qua `boc.py --luoi1` (nạp nguồn
   trong bộ nhớ, thay dòng `git show` bằng `''`, bỏ 2 `GOC-*` ghi CHƯA KIỂM) và `kiem_neo.py` AUDIT-3 bọc `try` tương tự — không sửa file
   LUOI-1. Kế hoạch mặc định (b) nếu không có trả lời; (a) đúng hơn.
2. Ngân sách `boc.py` 60–120 dòng: ba việc (bọc 4 bộ · `--sap` 11 bộ · `--c2luoi`) ước 110–130 dòng. Chấp nhận tới 130, hay tách
   `--c2luoi` + `--luoi1` thành file thứ tư `chay_khung.py` (~30 dòng)?
3. `bb_neo.json` (ảnh neo của `dot_bien_bb.py`, AUDIT-2) nay lệch vì `bat_bien.js` +46 dòng (I18/I19) → `kiem_neo` sẽ báo "tên trôi" hàng
   loạt. Ngoài Phạm vi: ghi phát hiện + đề xuất sinh lại ảnh ở việc sau (AUDIT-2 B4), hay cho phép `viec/AUDIT-3/bb_neo.json` là ảnh mới
   (sinh bằng `--liet-ke --json`, kèm `b2`-bảng SỐNG mới) và `kiem_neo.py` AUDIT-3 so với ảnh đó? Mặc định: ghi phát hiện, so với ảnh cũ,
   liệt kê tên trôi.

## 8. Soát kế hoạch (agent phụ, chỉ đọc — 4 câu)
(điền sau khi agent trả lời: ra ngoài phạm vi? có cách ngắn hơn? ca nghiệm thu nào chưa có bài thử? đường song song nào sót?)
