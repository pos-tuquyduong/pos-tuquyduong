# AUDIT-3 — kế hoạch (bản 2, sau soát độc lập — chờ duyệt, bước 3 của /lam-viec)

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
| `viec/AUDIT-2/kiem_neo.py` | **SẬP 0,2 s, thoát 1**: `git show 9521cec:cong_cu/gia_lap/kich_ban.js` → 128 — kho máy mây là bản CHỤP NÔNG (`git rev-parse --is-shallow-repository` = true, 422 commit), KHÔNG có `9521cec` (gốc LUOI-1) lẫn `b9b3928`; có `4d175bc`. `viec/LUOI-1/dot_bien.py:26` gọi `git show 9521cec:…` LÚC NẠP → mọi thứ nạp LUOI-1 (kiem_neo, chạy LUOI-1) sập ở đây. Tôi đã thử `git fetch --deepen=400 origin viec/AUDIT-3` → người gác chặn (GIT-KEO), không lách → **Câu hỏi 1** | `python3 viec/AUDIT-2/kiem_neo.py` |
| `kiem_tra_truoc_khi_giao.js` (bản nhanh = `npm test`, `package.json:9`) | 99,7 s · thoát 0 "Qua hết" | `node kiem_tra_truoc_khi_giao.js` |
| `--day-du` | 191,6 s · thoát 0 · 67 phép "Qua hết" | `node kiem_tra_truoc_khi_giao.js --day-du` |
| một đột biến mẫu mỗi bộ (0b, chạy riêng tuần tự, mỗi lệnh gồm chép bản sao + bài) | GOI-1 `BV-GOI1-TONG` 3,0 s · GOI-2 `BV-GOI2-GOM` 2,9 s · P26c `BV-B2-bo-chan-so-0` 3,7 s · P26b `huy-bo-cong` 2,0 s · P26b `huy-kiem-ngoai-tx` (kb15) 5,9 s · SO-LUONG-1 `BV-SOLUONG1-MON` (đối chứng + 1) 6,3 s · TACH-GL `VS-SRV-qua-bo-tran` (kiểm sạch gl29 + 1) 48,5 s · AUDIT-2 `D2K -j 3` 5,6 s — **D2K ra HỎNG 2 · SỐNG 1: `D2K-da-biet` HỎNG trên HEAD** (neo câu thu nợ `status != 'cancelled'` → P26c C1 đổi thành `status = 'completed'`; grep `orders.js` 0 lần / 1 lần; cùng lỗi với `G3-da-biet` của AUDIT-1 — P26c dựng lại `BV-G3-da-biet-thu-no`) → bằng chứng "đã biết → BẮT" của AUDIT-2 không còn tự chứng minh được trên HEAD; AUDIT-3 dùng D2 riêng (A4) | script nháp `do_mau.py` |
| mã luật người gác | 76 — `LUAT` HEAD so `4d175bc`: 0 mã mới, 0 mã bỏ; `git diff --stat 4d175bc..HEAD -- tu_chay/` rỗng | `grep -o "luat('…')" tu_chay/nguoi_gac.js \| sort -u` |
| code tiền đổi từ sau AUDIT-2 | `server/routes/orders.js` +195, `packages.js` +156, `refunds.js` +31, `damages.js` +27, `wallets.js` +18 (`ghiHoan`), `database.js` +8, MỚI `utils/goiKhach.js` 76, `utils/tienDaTra.js` 93; `kich_ban.js` +138, `bat_bien.js` +46 | `git diff --stat 4d175bc..HEAD -- server/ cong_cu/` |
| `shipping_fee` trong bài thử | 0 lần ở `thu_P26c.js`, `thu_GOI1.js`, `thu_P26b.js`, `kich_ban.js` → đột biến phí ship ở A4 mong SỐNG = phát hiện (lưới không phủ) | `grep -rn shipping_fee cong_cu/…` |

Số đo cũ để so (KHÔNG dùng thay số đo): AUDIT-1 đủ 174 `-j 3` = 1992 s; AUDIT-2 32 `-j 3` = 486 s; `dot_bien_bb.py -j 4` = 591 s
(AUDIT-2 12.10); TACH-GL 29 = 755 s (LUOI-2, `0714b66`); LUOI-1 80 = 91 s (P26c); `thu_cong.js` 119–126 s (AU2-10).

## 1. Nguyên tắc (đơn giản nhất mà vẫn đúng)
- **Dùng lại nguyên bộ công cụ cũ, không sửa file bộ cũ** (phiếu). Viết mới đúng BA file trong `viec/AUDIT-3/`: `boc.py` (A1 — lớp bọc
  đối chứng + đột biến sập + chạy C2F bằng `c2luoi` + xếp lại LẠC-sập), `dot_bien.py` (A4 — đột biến độc lập, khuôn SO-LUONG-1 vì khuôn đó
  đã có đối chứng + bắt "bài thử sập"), `kiem_neo.py` (A5 — chép bản AUDIT-2, thêm các bộ chưa rà). Không dựng khung đo mới.
- **Chạy nặng tuần tự, đo riêng**; không ghi file nào trong `viec/AUDIT-3/` khi bộ đo đang chạy (bài học AUDIT-2 "KHO BẨN" oan); đầu ra /
  `--json` ghi ra thư mục nháp, chép bảng vào `.md` sau.
- Mỗi nhóm xong → commit + push, `trang_thai.md` ghi nhóm xong (hết hạn mức → `/lam-viec AUDIT-3 tiep`).

## 2. Nhóm A

### A1 — ĐỐI CHỨNG trước tiên: `viec/AUDIT-3/boc.py` (ngân sách phiếu 60–120 dòng; ước ~80–100)
**Danh sách thật từ code** (đọc lượt này) — bộ nào có đối chứng, bộ nào phân biệt được "sập":

| bộ | đối chứng (bản chưa đột biến chạy xanh, đếm số) | phân biệt sập với đỏ đúng ca |
|---|---|---|
| `AUDIT-1/dot_bien.py` (khung) · `AUDIT-2/dot_bien.py` (nạp khung) | CÓ: `kiem_sach` 3 bản mỗi cách chạy (`:337–344`), đỏ → thoát 4; chỉ xét thoát 0, KHÔNG đếm số | MỘT PHẦN: BẮT đòi mẫu khớp (`:326–328`), sập → LẠC với `chi` = dòng cuối (`:329–330` — dòng `Giả lập: SẬP…` / `✖ Bài thử sập`); G3-sap = LẠC (AUDIT-2 ghi); mẫu rộng `r'✗ '` (A3L) có thể khớp dòng "✗ bài thử sập" của `thu_gia_lap` — c2full/c2luoi không chạy bài đó, nhưng phải THỬ |
| `AUDIT-2/dot_bien_bb.py` | CÓ: "kiểm sạch 3 bản" (`:321–323`), không đếm số | CÓ: D2-sap → LẠC (loại "SẬP" khỏi BẮT, `:269` vùng) |
| `LUOI-1/dot_bien.py` · `TACH-GL/dot_bien.py` | CÓ: `sạch:<cách>` trước khi chấm → thoát 4; không đếm số | MỘT PHẦN: BẮT = MỌI mẫu khớp; sập → LẠC, `chi` = dòng cuối; không có đột biến sập |
| `SO-LUONG-1/dot_bien.py` · `TOC-DO-1/dot_bien.py` | CÓ: `doi_chung()` đếm số (dòng tổng) | CÓ: dòng `Bài thử sập` / `ném` → "không phải bị bắt" |
| `P26b`, `P26c`, `GOI-1`, `GOI-2` (`dot_bien.py` khuôn GOI-1) | **KHÔNG** (TOC-DO-1 Phát hiện 3) | **KHÔNG**: đạt = thoát ≠ 0 + mẫu khớp, in dòng khớp đầu; SẬP + một ca đỏ cùng mẫu vẫn tính "bị bắt" |

**Phương án A (chọn, theo soát độc lập): `boc.py` gọi lại `chay1` CỦA bộ, không dựng lại bản sao.**
1. `python3 viec/AUDIT-3/boc.py <P26b|P26c|GOI-1|GOI-2> [tên…] [-j N]` — nạp nguồn bộ bằng `exec` cắt tới `\nif __name__` (có `ap`,
   `chay1`, `DOT_BIEN`, `BAI`; `sys.dont_write_bytecode`), thay `subprocess.run` trong không gian tên đó bằng hàm bọc gọi `subprocess.run`
   thật và GIỮ LẠI đầu ra của lần gọi; gọi `chay1` gốc; chấm lại theo AUDIT-3: **HỎNG** = `chay1` báo "không áp được" / đầu ra có `Bài
   thử sập` (P26b/P26c/GOI1 `:451/:829/:817`) hoặc `Giả lập: SẬP` (chay.js thoát 2) hoặc `bài thử sập` (thu_gia_lap) · **BẮT** = `chay1`
   đạt và không sập · **LẠC** = thoát ≠ 0 không mẫu · **SỐNG** = thoát 0. **ĐỐI CHỨNG** mỗi cách chạy dùng tới: gọi `chay1((f'sạch:{cách}',
   cách, [], r'$^'))` — danh sách đổi rỗng thì `ap` trả `''` (GOI-1 `:95–104`), bài chạy trên bản sao chưa đột biến — phải thoát 0 VÀ dòng
   tổng khớp số mục 0 (`105 đạt · 0 hỏng` / `101` / `66` / `ĐẠT`) — đỏ hoặc lệch → DỪNG, thoát 4. Cuối: so `git status` trước/sau (lọc
   `viec/AUDIT-3/`), thư mục tạm xoá (`chay1` của bộ có `finally`; bọc thêm SIGINT/SIGTERM → `sys.exit(130)`).
   ~50 dòng. Phương án B (bản 1): bọc dựng lại bản sao + bảng `BAI` của 4 bộ — ~110–130 dòng, dễ sai (P26b `gl13` đặt bản sao đúng độ
   sâu `:168–180`), bỏ. Phương án C: sửa từng bộ — phiếu cấm.
2. `python3 viec/AUDIT-3/boc.py --sap` (~25 dòng) — mỗi bộ trong danh sách A2 một đột biến CỐ Ý SẬP (`}}}{{{` vào file đầu tiên bộ đó
   đụng), phải ra HỎNG / LẠC-sập, **không bộ nào ra BẮT**: 4 bộ khuôn qua mục 1 (`SAP-P26b`, `SAP-P26c`, `SAP-GOI1`, `SAP-GOI2`, nối vào
   `DOT_BIEN` trong bộ nhớ) → HỎNG; AUDIT-2: nạp module `m2` (importlib, đường dẫn thật), nối `('SAP-AUDIT2','D2K','c2luoi',[(O,'// 1. Tạo
   đơn hàng','}}}{{{',1)], r'✗ ')` (mẫu RỘNG cố ý — thử đúng rủi ro ở bảng trên), gọi `m2.K.main()` với tên đó → mong LẠC có `chi` chứa
   `SẬP`; LUOI-1 / TACH-GL: nối `('SAP-…','kb1'/'gl29',[(CH,…,'}}}{{{',1)],[r'KB\d+ → '],'LẠC')` rồi gọi `main()` (LUOI-1 chỉ khi Câu hỏi 1
   cho nạp được); SO-LUONG-1: gọi `chay1` với dòng nối → phải ra "bài thử SẬP". AUDIT-1 `G3-sap` và bb `D2-sap` CÓ SẴN → đọc từ kết quả A2,
   không chạy lại. TOC-DO-1 không trong danh sách A2 → không thử sập (chỉ rà neo A5). Bộ nào ra BẮT → phát hiện NẶNG-lưới (bộ nói dối).
3. `python3 viec/AUDIT-3/boc.py --xep <file đầu ra nháp>` (~15 dòng) — đọc đầu ra A2 của các bộ chỉ "MỘT PHẦN" (AUDIT-1, AUDIT-2, LUOI-1,
   TACH-GL), dòng `LẠC … · <chi>` mà `chi` có `SẬP` / `sập` / `Bài thử sập` → ghi lại là **HỎNG-sập**; LẠC còn lại = LẠC thật. Bảng A2 dùng
   nhãn sau xếp. Đối chứng "đếm số" của các bộ này = bảng mục 0 (mỗi bài chạy trên HEAD không đột biến, có số ca) + `kiem_sach` của khung
   (thoát 0) — ghi rõ vào `a2_bang.md`, không viết thêm đối chứng.
4. `python3 viec/AUDIT-3/boc.py --c2luoi [tên…]` (~15 dòng): nạp `m2`, gán `m2.K.DOT_BIEN` = 87 dòng C2F của AUDIT-1 với cách chạy
   `c2full → c2luoi` (+ các dòng A3L của AUDIT-2 còn `c2full`, 14 dòng), bọc thêm `anh_kho` lọc `viec/AUDIT-3/`, gọi `m2.K.main()`. Chạy
   MỘT lần thay cho "c2full rồi chạy lại SỐNG" (c2luoi = c2full + `thu_P26c` 3,4 s — soát độc lập).

### A2 — chạy lại ĐỦ trên HEAD (tuần tự, đo riêng; `--json` / nhật ký ra thư mục nháp)
| bộ | lệnh | kết quả mong (khác AUDIT-2 → giải thích trong `a2_bang.md`) |
|---|---|---|
| AUDIT-1 trừ C2F (87: G3 4 · A3 16 · B1 8 · C2 3 · D1 56) | `python3 viec/AUDIT-1/dot_bien.py G3 A3 B1 C2 D1 -j 3 --json <nháp>` | G3: `G3-da-biet` nay HỎNG (neo thu nợ — P26c C1; dựng lại `BV-G3-da-biet-thu-no`), `G3-sap` LẠC-sập; còn lại như AUDIT-2 (A3 16 · B1 8 · D1 55 + 2 LẠC `!D1-E11-P20/P26a` như cũ) |
| AUDIT-1 C2F (87) + AUDIT-2 A3L c2full (14) bằng `c2luoi` | `python3 viec/AUDIT-3/boc.py --c2luoi` | C2F SỐNG mong ≤ 23 (LUOI-2 / P26c thêm ca); BẮT nhờ `thu_P26c` ghi cột riêng |
| AUDIT-2 A3L (7 dòng c2luoi) · B3 · A3P · D2K | `python3 viec/AUDIT-2/dot_bien.py A3L B3 A3P D2K -j 3` (bỏ A3B: 4 dòng bundle, cách `kiem`/`kiemdd` chép cả kho, không đụng tiền, phiếu không đòi) | 5 A3L SỐNG cũ → BẮT (LUOI-2 `trang_thai.md:246` đã ghi 7 BẮT); `A3P-goi-lay-vuot-luot` NGƯỢC NGHĨA → mong SỐNG (máy chủ nay 400; neo `const g1 = await goiCua(m1);` 1 lần `kich_ban.js:435`); `D2K-da-biet` HỎNG (0b), `BK-KB20-bo-kiem-lai-ma` SỐNG (AU2-9, P26d) |
| `dot_bien_bb.py` (sinh từ `bat_bien.js` HEAD, +46 dòng) | `python3 viec/AUDIT-2/dot_bien_bb.py -j 4` + `--liet-ke --json <nháp>` so `bb_neo.json` | tên SINH LẠI khác ảnh (I18/I19 thêm) → `kiem_neo` "tên trôi": hệ quả P26c (AUDIT-2 B4 đã dặn) — Câu hỏi 2; số BẮT/SỐNG so 100/48; `D2-sap` LẠC-sập |
| P26b (59 + 12 K1) · P26c (93) · GOI-1 (49) · GOI-2 (59) | `python3 viec/AUDIT-3/boc.py P26b` … (lớp bọc A1) | LẠC/HỎNG đã ghi: P26b 9 từ trước (GOI-2 `trang_thai.md:119`); P26c 4 (Q-F, GOI-2 dựng lại cùng tên); GOI-1 7 (GOI-2 dựng lại — bảng GOI-2 `:98–100`) + 2 (SO-LUONG-1 `…-THU-GOI1`). **Phiếu "tách `ghiHoan`: 3"** (GOI-2 `ke_hoach.md:165–166`): `VS-H2-khong-ghi-hoan-goi`, `VS-H2-hoan-goi-giam-total-spent` → đã thay (GOI-2); `VS-H2-mot-dong-hoan-goi` neo `const tuVi = coGoi ? …` còn 1 lần `orders.js:1347` → mong BẮT, ghi "không LẠC" (soát độc lập). Mỗi tên LẠC/HỎNG ghi "đã thay bằng <tên>" hoặc = phát hiện |
| SO-LUONG-1 (17) | `python3 viec/SO-LUONG-1/dot_bien.py` | 17/17 bắt, đối chứng 105/0 + 101/0 |
| LUOI-1 (80) | `python3 viec/LUOI-1/dot_bien.py` — chỉ khi Câu hỏi 1 cho kho đủ sâu; không thì `boc.py --luoi1`: nạp nguồn LUOI-1 với dòng `KB10_GOC = _kb10(…git show 9521cec…)` thay bằng `''` trong bộ nhớ, chạy 78 đột biến HEAD, 2 `GOC-*` ghi CHƯA KIỂM | 80/80 đúng mong đợi (P26c đo 91 s) |
| TACH-GL (29) | `python3 viec/TACH-GL/dot_bien.py` | 25 BẮT · 3 HỎNG + 1 LẠC đã ghi (LUOI-2 `:110–112`: `VS-kb-hai-luot`, `VS-luot-trung-thieu`, `BV-cha-kiem-mot-lan`, `VS-luot-thieu-bat-bien` — P26c dựng lại cùng tên) |
Bảng `a2_bang.md`: BẮT/SỐNG/HỎNG(-sập)/LẠC từng tên, cột "AUDIT-2", cột "vì sao khác" (sau `--xep`). HOC-1 / HOC-2 / TOC-DO-1 không
trong danh sách A2 → không chạy.

### A3 — đóng sổ AUDIT-2
| mã | nay | lệnh thấy lại | ca |
|---|---|---|---|
| AU2-1 lấy vượt lượt | P26c A2: trừ lượt trong giao dịch có trần `delivered_qty + ? <= total_qty` (`orders.js:926–928`), lấy ngay không vượt (`:410`) | `python3 viec/AUDIT-2/dot_bien.py A3P-goi-lay-vuot-luot` → SỐNG (ngược nghĩa = máy chủ đúng); `python3 viec/AUDIT-3/boc.py P26c BV-A2-bo-tran VS-A2-bo-kiem-changes BV-A2-lay-ngay-bo-tran` → BẮT | `thu_P26c.js` A2a (`:199`), A2d (`:210`) |
| AU2-2 5 đột biến A3L | LUOI-2 thêm ca L1a–L6a vào `thu_P26c.js`, AUDIT-2 đổi 7 dòng sang `c2luoi` | `python3 viec/AUDIT-2/dot_bien.py A3L-redeem-thieu-1-diem A3L-earn-flash-van-cong A3L-nhandiem-cong-doi A3L-goi-bo-kiem-chu A3L-goi-huy-dem-ca-mon-tra-tien -j 3` → BẮT ×5 (trích từ lần chạy A2, không chạy lại) | L1a, L2a, L3a, L4a, L5a |
| AU2-11 số lượt do quầy gõ | P26c A6: `soLuotGoi = Number(pkg.total_qty)` (`orders.js:408`), màn Bán hàng bỏ ô nhập; SO-LUONG-1: `pkgQty` nguyên ≥ 1 (`:202–203`) | `boc.py P26c BV-A6-so-man-hinh VS-A6-chi-sua-ten-dong BV-A6-o-nhap-so-luot` → BẮT; `python3 viec/SO-LUONG-1/dot_bien.py BV-SOLUONG1-GOI VS-SOLUONG1-GOI-LAM-TRON` → bắt | A6a (`:324`), A6b (`:326`), S2b, S2d |
Chưa xử lý nào còn → ghi "còn mở" + đề xuất.

### A4 — đột biến ĐỘC LẬP mới: `viec/AUDIT-3/dot_bien.py` (khuôn `viec/SO-LUONG-1/dot_bien.py`, ngân sách 100–200 dòng; ước ~90)
Cách chạy: `p26c` (`thu_P26c.js --may-chu`), `thu` (`thu_GOI1.js --may-chu`), `thub` (`thu_P26b.js --may-chu`). Đối chứng mỗi cách trước
(khuôn SO-LUONG-1, dòng tổng phải khớp mục 0), dòng `Bài thử sập` → HỎNG không bắt. Tên = NGUYÊN chuỗi, mỗi dòng một `('…', …)` (A17).
Chỗ chọn = chỗ bộ của CHÍNH việc đó chưa đột biến — mỗi chuỗi neo dưới đây đã `grep -F` trên HEAD lượt này: khớp đúng 1 lần ở file:dòng
ghi, và 0 file `viec/*/dot_bien*.py` chứa nó (trừ hai dòng "bổ sung" ghi rõ cùng neo):

| việc | tên | file:dòng (HEAD) | chuỗi neo (nguyên văn) → đổi gì | bài / ca mong bắt |
|---|---|---|---|---|
| P26c | `BV-AU3-P26C-DATRA-BO-TRU-SHIP` | `tienDaTra.js:18` | `Number(order.total \|\| 0) - Number(order.shipping_fee \|\| 0)` → `Number(order.total \|\| 0)` (đã trả tính cả phí ship → đền / hoàn quá) | không bài nào có `shipping_fee` (mục 0) → mong SỐNG = phát hiện (NẶNG nếu quầy có đơn ship) |
| P26c | `VS-AU3-P26C-DATRA-GIA-GOC` | `tienDaTra.js:16` | `Number(d.flash_unit_price \|\| d.tier_unit_price \|\| d.unit_price \|\| 0)` → `Number(d.unit_price \|\| 0)` | thu_P26c B1a–c |
| P26c | `VS-AU3-P26C-DEN-GIAM-BO-FLASH` | `tienDaTra.js:22` | `const giam = Number(order.discount \|\| 0) - Number(order.flash_discount \|\| 0) - Number(order.tier_discount \|\| 0);` → bỏ `- Number(order.flash_discount \|\| 0)` (trần đền mã-một-món trừ cả flash → chặn oan) | thu_P26c B1f — không ca flash + mã món → SỐNG = phát hiện NHẸ (K5) |
| P26c | `VS-AU3-P26C-DEN-TRAN-CA-DON` | `damages.js:173` | `.filter((d) => d.product_code === product_code)` → bỏ (trần đền tính trên CẢ đơn) | thu_P26c B1a / thub C1a, C6b |
| P26c | `VS-AU3-P26C-DUYET-VI-DA-TRA-CHI-CON` | `refunds.js:164` | `Number(refund.refund_amount) + (don.parent_phone ? Number(don.parent_balance_amount \|\| 0) : 0)` → `Number(refund.refund_amount)` | thub M5 / thu_P26c A5g, C3 |
| P26c | `VS-AU3-P26C-HUY-ME-TRA-0` (K4 — anh em của dòng trên ở huỷ / xoá) | `orders.js:1343` | `const meTra = order.parent_phone ? Number(order.parent_balance_amount \|\| 0) : 0;` → `const meTra = 0;` | thub M2 / M3 (mẹ hoàn thiếu) |
| GOI-1 | `VS-AU3-GOI1-LOAI-KHONG-CONG-DON` | `goiKhach.js:24` | `xin[khoaLoai(m)] = (xin[khoaLoai(m)] \|\| 0) + Number(m.quantity);` → `xin[khoaLoai(m)] = Number(m.quantity);` | thu_GOI1 A2* — không ca hai dòng cùng loại → SỐNG = phát hiện NẶNG |
| GOI-1 | `BV-AU3-GOI1-LOAI-BO-DA-LAY` | `goiKhach.js:28` | `const con = Number(g.qty) - Number(da?.delivered_qty \|\| 0);` → `const con = Number(g.qty);` | thu_GOI1 A2a |
| GOI-1 | `VS-AU3-GOI1-DEM-DONG-THAY-SL` | `goiKhach.js:15` | `SUM(oi.quantity) AS delivered_qty` → `COUNT(*) AS delivered_qty` | thu_GOI1 A2a / A2c |
| GOI-1 | `VS-AU3-GOI1-LOAI-SL-0-CUNG-CHAN` | `goiKhach.js:26` | `if (!(Number(g.qty) > 0) \|\| !xin[khoaLoai(g)]) continue;` → `if (!xin[khoaLoai(g)]) continue;` (loại cài SL 0 cũng bị chặn — K5, dữ liệu gói cũ) | thu_GOI1 A1d/A2* — SỐNG = phát hiện NHẸ |
| GOI-2 | `BV-AU3-GOI2-BO-TRAN-DA-NHAN` | `tienDaTra.js:87` | `Math.max(0, Math.min(goc, Number(don.total \|\| 0) - Number(so.nhan)))` → `goc` | thu_GOI1 B3l / B7j (I19); cả `hoan-du-kien` (`packages.js:212`, ca B3a) |
| GOI-2 | `VS-AU3-GOI2-HOAN-CA-DA-LAY` | `tienDaTra.js:80` | `Math.max(0, Number(cp.total_qty) - Number(cp.delivered_qty))` → `Number(cp.total_qty)` | thu_GOI1 B3a (du kien 900.000) / B3c |
| GOI-2 | `VS-AU3-GOI2-NHAN-BO-DEN` | `tienDaTra.js:83` | `type IN ('refund', 'compensation')` → `type IN ('refund')` | thu_GOI1 B3* / I19 — không ca "đền rồi kết thúc gói" → SỐNG = phát hiện |
| GOI-2 | `VS-AU3-GOI2-GHI-HOAN-PHAN-VI-HOAN-GOI` | `wallets.js:85` | `[tuVi, 'cash', 'total_spent']` → `[tuVi, 'hoan_goi', null]` (đối xứng K4 với `VS-GOI2-TIEN-MAT-GIAM-TOTAL-SPENT`; `ghiHoan` có ĐÚNG 2 chỗ gọi: `orders.js:1348` huỷ/xoá, `packages.js:266` kết thúc gói) | thu_GOI1 B3a2 / I11, I18; thu_P26c A5c2 |
| SO-LUONG-1 | `VS-AU3-SL-TIEN-MOT-GOI` | `orders.js:416` | `subtotal += pkg.price * pkgQty;` → `subtotal += pkg.price;` (mua 2 gói thu tiền 1 — đúng lỗi "xoá `pkg_qty \|\| 1`" SO-LUONG-1 không đột biến được) | thu_P26c S2a (2 gói) |
| SO-LUONG-1 | `VS-AU3-SL-DONG-GOI-SL-1` | `orders.js:422` | `quantity: pkgQty,` → `quantity: 1,` (dòng gói ghi SL 1 → mẫu số `tienDaTra.js:43`, `:81` chia sai khi hoàn / kết thúc gói) | thu_P26c S2a / A5c (huỷ đơn 2 gói) — không ca → SỐNG = phát hiện NẶNG |
| SO-LUONG-1 | `VS-AU3-SL-DONG-GOI-TONG-1` | `orders.js:424` | `total_price: pkg.price * pkgQty,` → `total_price: pkg.price,` | thu_P26c S2a / I6 |
| SO-LUONG-1 | `VS-AU3-SL-TAO-MOT-GOI` | `orders.js:1036` | `for (let i = 0; i < pkgQty; i++) {` → `for (let i = 0; i < 1; i++) {` (thu tiền 2 gói, tạo 1) | thu_P26c S2a / I14 |
| SO-LUONG-1 | `VS-AU3-SL-HOAN-2-GOI-KHONG-CHIA-SL` (đường nhiều gói, soát độc lập) | `tienDaTra.js:43` | `(Number(d.quantity) * Number(g.total_qty))` → `Number(g.total_qty)` (huỷ đơn 2 gói: đã dùng tính gấp đôi) | thu_P26c A5c — không ca huỷ đơn 2 gói → SỐNG = phát hiện NẶNG |
| bổ sung (cùng neo bộ cũ, khác lỗi — KHÔNG đếm vào "≥ 3") | `BV-AU3-SL-HAM-LUON-DUNG` (`orders.js:37`, neo `VS-SOLUONG1-BO-NGUYEN`; SO-LUONG-1 tự ghi CHƯA KIỂM "bỏ hàm") → `(x) => true`; `BV-AU3-SL-THE-BO-CONG` (`orders.js:187`, neo `VS-SOLUONG1-THE-SDT-THO`, bộ đó chỉ VS-) → `if (false) {` | | S1c + S2b; S4c |
D2 (công cụ không nói dối) trong cùng file: `D2-AU3-sai-chuoi` → HỎNG, `D2-AU3-da-biet` (= neo `BV-SOLUONG1-MON`, bắt S1c) → BẮT,
`D2-AU3-vo-hai` (đổi chú thích `// 1. Tạo đơn hàng`) → SỐNG, `D2-AU3-sap` (`}}}{{{`) → HỎNG-sập. Đếm: P26c 6 · GOI-1 4 · GOI-2 4 · SO-LUONG-1 5
(+ 2 bổ sung) + 4 D2 = 25 dòng. SỐNG ở đột biến đụng tiền / ví / gói = NẶNG → `bao_cao.md` kèm đề xuất ca (file, ca đỏ).

### A5 — `viec/AUDIT-3/kiem_neo.py` (chép bản AUDIT-2 + ~40 dòng)
- Thêm `nap()` cho: GOI-1, GOI-2, P26c, SO-LUONG-1 (cắt `\ndef ap(`; tuple `(tên, cách, [(file, cũ, mới, n)], mẫu)`; tiền tố file theo cách:
  `cli` → `client/`, `thugl` → `cong_cu/gia_lap/`, còn lại `server/`), TOC-DO-1 (cắt `\ndef chay_bai(`; `(tên, [(cũ, mới, n)], mẫu)` trên
  `kiem_tra_truoc_khi_giao.js`), AUDIT-3 (`dot_bien.py` của việc này). LUOI-2 KHÔNG có `dot_bien*.py` / `do_*.js` (chỉ `.md`; đột biến LUOI-2
  nằm trong `viec/AUDIT-2/dot_bien.py` A3L — đã rà) → ghi rõ. LUOI-1: nạp như AUDIT-2 nhưng dòng `git show 9521cec` bọc `try`: kho nông
  thì thay bằng `''` và in "(LUOI-1: 2 GOC-* không rà được — kho nông)" (Câu hỏi 1).
- `RUA_CO_Y` mở rộng theo hồ sơ đã ghi (mỗi tên một lý do "đã thay bằng …"): GOI-1 7 (GOI-2) + 2 (SO-LUONG-1); P26c 4 (GOI-2 Q-F); TACH-GL 4
  (P26c); AUDIT-1 `G3-da-biet` + AUDIT-2 `D2K-da-biet` (P26c `BV-G3-da-biet-thu-no`); HOC-2b `VS-q9-me-lon-hon-bang-0`, `BV-q9-bo-hoan-me`
  (P26c); P26b 9 từ trước (GOI-2 `trang_thai.md:119`): `me-huy/xoa-hoan-gap-doi` → P26c `VS-me-hoan-gap-doi-*` → GOI-2; 5 neo `refunds.js` +
  2 `damages.js` đối chiếu từng tên với bảng "Đột biến cũ đổi" `viec/P26c/trang_thai.md` lúc làm — **không có bản thay = phát hiện**.
  HỎNG ngoài danh sách = phát hiện. Kết quả vào `trang_thai.md` (bắt buộc chạy).

### A6 — lách người gác
`LUAT` HEAD = 76 mã, không mã mới từ sau AUDIT-2 (mục 0) → KHÔNG thêm ca lách; chạy lại `node viec/AUDIT-2/lach.js` → mong CHẶN 14 ·
LỌT ĐÃ BIẾT 1 (CC-DOC — AU2-7) · LỌT 0 (đã đo lượt này: đúng vậy; ghi lại khi làm A6).

## 3. Nhóm D — sản phẩm
- **D1** `bao_cao.md` ≤ 200 dòng: kết luận một dòng (đạt / chưa đạt điểm dừng) · bảng `AU3-<n>` (mức · file:dòng HEAD · lệnh thấy lại ·
  đề xuất khoá: file, ca đỏ) · tỷ lệ BẮT/SỐNG/HỎNG/LẠC theo nhóm (A1 sập, A2 từng bộ, A4). Chi tiết: `a2_bang.md` (A2 từng tên), `a4_bang.md`
  (nếu cần). Phát hiện đã thấy lúc lập kế hoạch: **AU3-1** kho máy mây nông → `viec/LUOI-1/dot_bien.py` và `viec/AUDIT-2/kiem_neo.py` sập
  (NHẸ-công cụ; đề xuất: LUOI-1 bọc `git show` trong `try`, hoặc hook mở phiên fetch đủ sâu); **AU3-2** `D2K-da-biet` rữa (NHẸ, bằng chứng
  D2 của AUDIT-2 không còn tự chứng minh — đề xuất đổi neo khi có việc đụng `viec/AUDIT-2/`).
- **D2** `bang_chung_do.txt`: đầu ra nguyên văn `python3 viec/AUDIT-3/dot_bien.py D2-AU3-sai-chuoi D2-AU3-da-biet D2-AU3-vo-hai D2-AU3-sap`
  (HỎNG · BẮT · SỐNG · HỎNG-sập) và `boc.py --sap` (không bộ nào BẮT) và `boc.py GOI-1 BV-GOI1-TONG` (BẮT, đối chứng 101/0). Không có bài thử
  đỏ → không dòng `SỐ CA` (phiếu "Bài thử đỏ: không"). Mọi tên đột biến của `viec/AUDIT-3/dot_bien.py` ghi trong `trang_thai.md` (A17).
- **D3** `npm test` (= `node kiem_tra_truoc_khi_giao.js`, `package.json:9`) + `--day-du` xanh ở cuối (mục 0: 99,7 s / 191,6 s thoát 0);
  `git status` sạch sau mỗi lần chạy công cụ; thử ngắt `timeout -s INT 15 python3 viec/AUDIT-3/boc.py GOI-1` → không sót thư mục tạm (ghi).
  `git diff --stat a13d8ad..HEAD -- ':!viec/AUDIT-3/'` rỗng. `.gitignore` che `__pycache__` → `sys.dont_write_bytecode = True` cả ba file.

## 4. Đường song song cần canh (K4) · luồng hợp lệ (K5)
- Việc không đổi code chạy thật → không luồng quầy nào bị chặn. Công cụ chỉ ghi bản sao trong thư mục tạm (`ap` của bộ + kiểm `realpath`),
  `TMPDIR` riêng cho lệnh con; so `git status` trước/sau.
- K4 trong A4 (đã soát độc lập): `soTienHoan` gọi ở huỷ + xoá (`hoanVi`, `orders.js:1344`) và duyệt hoàn (`refunds.js:164`) → đột biến
  `tienDaTra.js` ghi ca của MỖI đường; phần ví mẹ có HAI chỗ tính (`:1343` `meTra`, `refunds.js:164`) → hai đột biến. `ghiHoan` 2 chỗ gọi
  (`orders.js:1348`, `packages.js:266`). `soTienHoanGoi` 2 đường: xem trước `hoan-du-kien` (`packages.js:212`) và kết thúc (`:253`) → ca B3a
  (du kien) + B3c/B3l. `vuotTheoLoai` 2 chỗ (`orders.js:414` mua, `:869` lấy). Đường nhiều gói: `pkgQty` ở `:416`, `:422`, `:424`, `:1036` và
  mẫu số `tienDaTra.js:43` → 5 đột biến SO-LUONG-1.
- Bọc A1 không "bắt oan" bộ cũ: đối chứng so dòng tổng với mục 0 (105 / 101 / 66 đạt) — lệch = bọc sai, không phải bộ sai.

## 5. Ca thử ↔ nghiệm thu (1-1)
| mục phiếu | cách chứng minh (lệnh / file) |
|---|---|
| A1 | `boc.py --sap` (AUDIT-2, LUOI-1, TACH-GL, SO-LUONG-1, 4 bộ khuôn) + `G3-sap`, `D2-sap` từ A2: 10 bộ, mỗi bộ ≠ BẮT; `boc.py <4 bộ>` in đối chứng xanh + số ca; `--xep` tách LẠC-sập; `bang_chung_do.txt` mục 1 |
| A2 | `a2_bang.md` từng tên 10 bộ (AUDIT-1 87 + C2F 87 · AUDIT-2 · bb · P26b · P26c · GOI-1 · GOI-2 · SO-LUONG-1 · LUOI-1 · TACH-GL), cột AUDIT-2 + lý do; LẠC/HỎNG → "đã thay bằng" / "không LẠC" / phát hiện |
| A3 | `trang_thai.md` mục A3: 3 dòng AU2-1/2/11, mỗi dòng lệnh + ca |
| A4 | `viec/AUDIT-3/dot_bien.py`: P26c 6 · GOI-1 4 · GOI-2 4 · SO-LUONG-1 5 (mỗi việc ≥ 3 ở chỗ mới, có VS + BV), đối chứng; bảng kết quả `trang_thai.md`; SỐNG tiền = NẶNG `bao_cao.md` |
| A5 | `python3 viec/AUDIT-3/kiem_neo.py` đầu ra nguyên văn trong `trang_thai.md`; HỎNG ngoài `RUA_CO_Y` = phát hiện |
| A6 | `node viec/AUDIT-2/lach.js` đầu ra; dòng "0 mã mới" kèm lệnh đếm |
| D1 / D2 / D3 | `bao_cao.md` · `bang_chung_do.txt` · dòng `npm test`, `--day-du`, `git status`, `git diff --stat` trong `trang_thai.md` |

## 6. Thời gian máy (ước từ số đo mục 0, chạy RIÊNG tuần tự)
| nhóm | ước | căn cứ |
|---|---|---|
| A1 bọc 4 bộ (P26b 71 · P26c 93 · GOI-1 49 · GOI-2 59 = 272, `-j 4`) | ~6 phút | 0b: một đột biến 2,0–3,7 s kể cả chép server/, `kbN` 5,9 s; 272 × ~3,5 s ÷ 4 + 10 dòng kb + đối chứng 9 cách ≈ 1 phút |
| A1 `--sap` (AUDIT-2 c2luoi kiểm sạch 3 bản ≈ 80 s + 1; LUOI-1 kb1; TACH-GL gl29 48,5 s; SO-LUONG-1 6 s; 4 bộ khuôn ~4 s) | ~4 phút | 0b + AUDIT-2 ke_hoach mục 0 (kiểm sạch ~80 s) |
| A2 AUDIT-1 trừ C2F (87) | ~18 phút | AUDIT-2: 1992 s cho 174 với C2F chiếm ~23 s × 87 ÷ 3; phần còn lại ≈ nửa |
| A2 C2F + A3L bằng c2luoi (101) | ~15 phút | c2luoi ≈ c2full (23 s) + 3,4 s; 101 × 27 s ÷ 3 + kiểm sạch 80 s |
| A2 AUDIT-2 A3L B3 A3P D2K (24) | ~5 phút | 486 s cho 32 trừ A3B (kiem/kiemdd nặng) |
| A2 bb (~150) | ~10 phút | 591 s |
| A2 SO-LUONG-1 · LUOI-1 · TACH-GL | ~1 + 2 + 13 phút | 0b: 6,3 s đối chứng + 1 → 17 ≈ 40 s · 91 s (P26c) · 755 s (LUOI-2; 0b 48,5 s cho kiểm sạch + 1, 29 × 24 s ÷ 2) |
| A4 25 đột biến + 3 đối chứng | ~2 phút | 0b: ~3,5 s một đột biến × 25 ÷ 4 |
| A5 kiem_neo · A6 lach | < 1 phút | 0,2 s + 0,1 s |
| D3 `npm test` + `--day-du` | ~2 + ~3,5 phút | 99,7 s · 191,6 s (mục 0) |
| **tổng** | **~85 phút** (< 180) | không cần cắt; máy chậm hơn 2× thì bỏ chạy lại AUDIT-1 nhóm A3 / B1 / D1 (16 + 8 + 56, không đụng tiền — AUDIT-2 không tên nào đổi) → bớt ~12 phút, ghi rõ |

## 7. Câu hỏi (cần chủ quán trả lời trong lời duyệt)
1. **Kho máy mây là bản chụp NÔNG (shallow, 422 commit), không có `9521cec`** → `viec/LUOI-1/dot_bien.py` không nạp được (gọi `git show
   9521cec` lúc nạp) ⇒ `viec/AUDIT-2/kiem_neo.py` sập và A2 LUOI-1 không chạy được nguyên bản. Người gác chặn `git fetch --deepen` (đã thử,
   bị chặn, không lách). Chọn: (a) chủ quán làm kho đủ sâu (hook mở phiên / môi trường) rồi tôi chạy nguyên bản; (b) tôi chạy LUOI-1 qua
   `boc.py --luoi1` (nạp nguồn trong bộ nhớ, thay dòng `git show` bằng `''`, bỏ 2 `GOC-*` ghi CHƯA KIỂM) và `kiem_neo.py` AUDIT-3 bọc `try`
   tương tự — không sửa file LUOI-1. Mặc định (b) nếu không có trả lời; (a) đúng hơn.
2. `bb_neo.json` (ảnh neo của `dot_bien_bb.py`, AUDIT-2) nay lệch vì `bat_bien.js` +46 dòng (I18/I19) → `kiem_neo` sẽ báo "tên trôi" hàng
   loạt. Ngoài Phạm vi: ghi phát hiện + đề xuất sinh lại ảnh ở việc sau (AUDIT-2 B4), hay cho phép `viec/AUDIT-3/bb_neo.json` là ảnh mới
   (sinh bằng `--liet-ke --json`, kèm bảng SỐNG mới) và `kiem_neo.py` AUDIT-3 so với ảnh đó? Mặc định: ghi phát hiện, so với ảnh cũ, liệt kê
   tên trôi.
(Câu hỏi ngân sách `boc.py` ở bản 1 đã bỏ: phương án gọi lại `chay1` của bộ ước ~80–100 dòng, trong ngân sách.)

## 8. Soát kế hoạch (agent phụ, chỉ đọc, bản 1 → kết luận KHÔNG ĐẠT) — đã sửa ở bản 2
1. Ngoài phạm vi / việc thừa: AUDIT-2 chạy cả A3B (bundle, không đụng tiền) → bỏ, chỉ `A3L B3 A3P D2K`; `--sap` thêm TOC-DO-1 → bỏ; cách
   chạy `gl` khai mà A4 không dùng → bỏ; `git fetch --deepen` → ghi là đã bị chặn, để Câu hỏi 1.
2. Ngắn hơn: `boc.py` gọi lại `chay1` của bộ + thay `subprocess.run` giữ đầu ra (~50 dòng thay ~120) → nhận; C2F chạy thẳng `c2luoi` một
   lần (bỏ chạy đôi, ~8 phút) → nhận; `G3-sap` / `D2-sap` lấy từ A2, không chạy lại → nhận.
3. Thiếu chứng minh: A1 chưa tách LẠC-sập ở bộ khung → thêm `--xep` (dựa `chi` = dòng cuối); đối chứng "đếm số" của bộ khung = mục 0 (ghi rõ);
   số dòng khung sửa (`:337–344`, `:326–328`); A2 thiếu "tách `ghiHoan`: 3" → thêm dòng P26c (`VS-H2-mot-dong-hoan-goi` không LẠC); A3L
   c2full SỐNG → gộp vào `--c2luoi`; A4 GOI-1 neo `xin[k]…` viết tắt sai → chép nguyên văn + thêm 1; SO-LUONG-1 2/4 trùng dòng bộ cũ → 5 neo
   mới (đường nhiều gói), 2 cũ chuyển "bổ sung"; A5 thêm `D2K-da-biet` vào `RUA_CO_Y`.
4. K4 sót: `meTra` `orders.js:1343` → `VS-AU3-P26C-HUY-ME-TRA-0`; `ghiHoan` 2 chỗ gọi (không phải 4) → sửa §4; `hoan-du-kien` → ghi ca B3a;
   nhiều gói (`tienDaTra.js:43`, `orders.js:422`, `:424`) → 3 đột biến; `giam` `tienDaTra.js:22` → `VS-AU3-P26C-DEN-GIAM-BO-FLASH`;
   8 số dòng lệch → sửa (grep HEAD lượt này); `BV-AU3-P26C-DATRA-BO-TRU-SHIP` chắc SỐNG → ghi là phát hiện mong đợi.
