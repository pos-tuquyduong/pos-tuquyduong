# AUDIT-2 — trạng thái

## Bước 1 — đối chiếu bản chụp (12.10.2026)
- nhánh: `viec/AUDIT-2`; `git status --short` sạch → kéo được.
- `git fetch origin viec/AUDIT-2` → HEAD `4d175bc` · FETCH_HEAD `4d175bc` (bằng nhau → không kéo).
- `git log --oneline -3`:
  ```
  4d175bc PHIEU: AUDIT-2
  43c793e TIEN-DO + LUAT: TU-CHAY-5 xong (6c281f5), mo P26c + AUDIT-2, them DOI-SOAT-1, dinh huong chu quan — so v27
  6c281f5 Merge pull request #14 from pos-tuquyduong/viec/TU-CHAY-5
  ```

## Tiến độ
- [x] Bước 1–2: đối chiếu, đọc phiếu + nguồn (AUDIT-1, HOC-2b D5, LUOI-1 C2, TU-CHAY-5 A/D5/D6/Phát hiện).
- [x] Bước 3: `ke_hoach.md` — chủ quán DUYỆT e055d63 (12.10): đồng ý cả 3 điểm mục 7 theo mặc định; giữ luật không ghi file nào
  trong viec/AUDIT-2/ khi bộ đo đang chạy.
- Phiên `tiep` (12.10): bước 1 — HEAD `e055d63` = FETCH_HEAD `e055d63`; log `e055d63 AUDIT-2: ke hoach (cho duyet)…` · `4d175bc PHIEU:
  AUDIT-2` · `43c793e TIEN-DO + LUAT…`.
- [x] Nhóm A (A1 `a1_bang.md` · A2 `a2_bang.md` · A3 `a3_bang.md`, `lach.js`, `lach.json`)
- [x] Nhóm B (B1 `dot_bien_bb.py` · B2 `b2_bang.md` · B3 `b3_bang.md` · B4 đề xuất ở `bao_cao.md`)
- [x] Nhóm C (C1 `kiem_neo.py` chạy trên HEAD + bản sao chứng minh; C2 không cần — đề xuất ở `bao_cao.md`)
- [~] Nhóm D (D1 `bao_cao.md` (`wc -l` ở báo cáo 7 mục) · D2 `bang_chung_do.txt` · D3: `npm test` và `--day-du` đều vướng `thu_cong.js` sát/quá hạn 120 s — cả trên gốc, xem Câu hỏi 1)

## Số đo lúc lập kế hoạch
Xem `ke_hoach.md` mục 0 (đo riêng trong lượt này, máy mây 4 lõi).

## Kết quả nhóm A, B (chạy RIÊNG, tuần tự; sau mỗi lần `git status` sạch, 0 thư mục tạm sót)
| lệnh | thời gian | kết quả |
|---|---|---|
| `python3 viec/AUDIT-1/dot_bien.py G3 A3 B1 C2 D1 C2F -j 3` | 1992 s | 174: G3 1/1/1/1 (cố ý) · A3 16 BẮT · B1 8 · C2 3 · C2F 62 BẮT · 23 SỐNG · 1 LẠC · D1 55 · 2 LẠC — y như lần trước |
| `python3 viec/HOC-1/dot_bien.py` | 1510 s | 3 đối chứng XANH · 17 ĐỎ đúng chỗ theo công cụ HOC-1 = 16 BẮT + 1 LẠC theo định nghĩa AUDIT (MA3 đỏ vì cổng sập — AU2-5) |
| `python3 viec/HOC-2/dot_bien.py` | 1906 s | 3 đối chứng XANH · 22/23 ĐỎ đúng chỗ + 1 HỎNG: `VS-E3-phien-ban-cu` LỖI (neo 1.4.0 — AU2-6) |
| `python3 viec/AUDIT-2/dot_bien.py -j 3` | 486 s | 32: D2K HỎNG/BẮT/SỐNG · A3B 4/4 BẮT · A3L 9 BẮT 9 SỐNG · A3P BẮT (code sai) · B3 4 BẮT 2 SỐNG |
| `node viec/AUDIT-2/lach.js` (bản sửa vòng 1) | <1 s | CHẶN 14 · LỌT 1 · SAI MÃ 0 · TẮT KHÔNG ĐỔI 0 (5 mục loại "chặn": tắt luật nhắm → CHO); LỌT = CC-DOC đọc file bí mật bằng Read — thiết kế đã ghi |
| `python3 viec/AUDIT-2/dot_bien_bb.py -j 4` | 591 s | 146: BB 94 BẮT · 48 SỐNG; D2 HỎNG · BẮT · SỐNG · LẠC |
| `python3 viec/AUDIT-2/dot_bien_bb.py --chi BB-I7-js --chi D2- -j 4` (sau sửa bộ sinh) | 64 s | 6/6 BẮT; D2 lại đúng 4 trạng thái |
| `python3 viec/P26b/dot_bien.py <18 tên B3>` | — | công cụ P26b: 18/18 "bị bắt" = 17 BẮT + 1 LẠC-giống (`doi-soat-bo-tx` đỏ vì móc không chạy — AU2-8, soát vòng 2) |
| `python3 viec/LUOI-1/dot_bien.py VS-SRV-bo-khoa-dangChay` | 43 s | BẮT (đúng mong đợi 1/1) |

## Tên đột biến — `viec/AUDIT-2/dot_bien.py` (32, viết tay) và D2 của `dot_bien_bb.py` (4, viết tay)
`D2K-sai-chuoi`, `D2K-da-biet`, `D2K-vo-hai`, `A3B-D2-bundle-dev`, `A3B-D3-index-tro-sai`, `A3B-D4-bo-dau-vet`, `A3B-D5-src-chua-build`, `A3L-redeem-thieu-1-diem`, `A3L-redeem-bo-chan-diem`, `A3L-redeem-bo-han-diem`, `A3L-redeem-tru-them-1`, `A3L-redeem-ma-dung-2-lan`, `A3L-earn-lam-tron-len`, `A3L-earn-flash-van-cong`, `A3L-nhandiem-cong-doi`, `A3L-nhandiem-he-so-mac-dinh`, `A3L-goi-bo-kiem-chu`, `A3L-goi-bo-kiem-trang-thai`, `A3L-goi-bo-kiem-con-lai`, `A3L-goi-giao-them-1`, `A3L-goi-lay-ngay-them-1`, `A3L-goi-huy-lay-khong-tra-luot`, `A3L-goi-xoa-lay-khong-tra-luot`, `A3L-goi-huy-dem-ca-mon-tra-tien`, `A3L-deliver-bo-chan-am`, `A3P-goi-lay-vuot-luot`, `BK-KB10-thu-bo-changes`, `BK-KB11-claim-bo-chiem`, `BK-KB11-nhandiem-bo-chiem`, `BK-KB16-duyet-bo-cong-don`, `BK-KB20-bo-kiem-lai-ma`, `BK-KB21-huy-goi-bo-changes`.
D2 của `dot_bien_bb.py`: `D2-sai-chuoi`, `D2-da-biet`, `D2-vo-hai`, `D2-sap`. Đột biến `BB-I<n>-…` do `dot_bien_bb.py` SINH (tất định, liệt kê
bằng `--liet-ke`, 148 tên) — SỐNG ghi đủ trong `b2_bang.md`.

## Kết quả nhóm C, D
| lệnh | kết quả |
|---|---|
| `python3 viec/AUDIT-2/kiem_neo.py` (HEAD) | (bản sửa vòng 2) thoát 0 — neo khớp / mục CÓ neo: AUDIT-1 173/174, P26b 59/59, HOC-1 17/17 (+3 đối chứng), HOC-2 22/23 (+3), TU-CHAY-4 9/9 (+1), HOC-2b 20/20 (+6), LUOI-1 78/78 (+2 GOC-*), TACH-GL 29/29, TU-CHAY-5 34/34, AUDIT-2 31/32, AUDIT-2 bb 151/152 (so CHUỖI với ảnh `bb_neo.json`), do_*.js 6/6 (`do_cpu.js` không có bảng) ⇒ 629/633; HỎNG chỉ 4 rữa cố ý (`G3-sai-chuoi`, `VS-E3-phien-ban-cu`, `D2K-sai-chuoi`, `D2-sai-chuoi`); mẫu nghi rữa 0 |
| `kiem_neo.py` trên bản sao kho đổi neo + đổi chữ | thoát 1 — 2 HỎNG + 2 mẫu nghi rữa (`bang_chung_do.txt` mục 4) |
| `npm test` | lần của tôi: thoát 0 · ĐẾM PASS 61 · FAIL 0 · CẢNH BÁO 0; lần người soát: PASS 60 · FAIL 1 (`thu_cong.js` 120.1 s ETIMEDOUT) — sát hạn, đỏ ngẫu nhiên |
| `node kiem_tra_truoc_khi_giao.js --day-du` | thoát 1 · ĐẾM PASS 64 · FAIL 1 · CẢNH BÁO 0 — FAIL duy nhất: `bài chạy thật tu_chay/thu_cong.js xanh (120.1 s) → spawnSync … ETIMEDOUT` |
| `node tu_chay/thu_cong.js` riêng ×3 | 120 s (HEAD) · 126 s (gốc `4d175bc`, git archive vào nháp) · 121 s (HEAD) — 318 phép · 0 chỗ hỏng; 11.10 TU-CHAY-5 đo 94,8 s |
| ngắt SIGINT `dot_bien_bb.py` (20 s), `dot_bien.py` (3 s) | 0 thư mục tạm sót, `git status` sạch |
| `git diff --stat 4d175bc..HEAD -- ':!viec/AUDIT-2/'` | rỗng |

## Câu hỏi
1. **D3 không xanh được ổn định trên máy mây hôm nay, cả trên gốc `4d175bc`:** `tu_chay/thu_cong.js` chạy RIÊNG 119–126 s (4 lần) ≥ hạn
   120 s của bộ kiểm (`kiem_tra_truoc_khi_giao.js:478`) → FAIL "ETIMEDOUT". Bộ kiểm chạy nó ở CẢ bản nhanh (`:553`) ⇒ `npm test` và hook
   pre-commit cũng đỏ ngẫu nhiên (soát vòng 1 bắt — tôi đã khoanh nhầm chỉ `--day-du`).
   Quá hạn còn để SÓT thư mục tạm của `thu_cong.js` (SIGTERM, dọn chỉ ở cuối bài `tu_chay/thu_cong.js:698`) — hiện còn `/tmp/thu_cong_R1vc3w`,
   `/tmp/cong_QI3hE4` (07:14), `/tmp/thu_cong_9a0wrs` (07:37) từ các lần chạy hôm nay (ngoài kho; người gác không cho máy xoá ngoài nháp). Không do việc này (gốc không có file AUDIT-2 vẫn 126 s); sửa nằm ngoài Phạm vi và luật cấm nới
   hạn. Xin chủ quán chọn: (a) chạy `--day-du` trên máy chủ quán / check GitHub để xem có phải chỉ máy mây chậm; (b) mở việc chia
   `thu_cong.js` thành lượt song song (khuôn TACH-GL) trước P26c — P26c sẽ vướng cùng phép. Ghi AU2-10.
2. **Số lượt gói do quầy gõ tay có CỐ Ý không?** `orders.js:968` lưu `package_buy.total_qty` client gửi, giá vẫn là giá gói (`:374`); màn
   Bán hàng có ô "SL SP" sửa tay (`Sales.jsx:1225–1232`). Không cố ý → NẶNG-code (bán gói N lượt giá cố định mà ghi M lượt), đưa vào P26c;
   cố ý → cần luật + quy tắc đối soát. Máy không tự xếp (câu hỏi nghiệp vụ). Ghi AU2-11.
3. Ba thư mục bytecode `viec/AUDIT-1/__pycache__/`, `viec/AUDIT-2/__pycache__/`, `viec/P26b/__pycache__/` (02:32 — lúc lập kế hoạch tôi chạy
   `viec/HOC-2b/kiem_neo.py`, nó nạp `viec/HOC-2b/dot_bien.py:18–19` → P26b) do việc này đẻ ra (`.gitignore` che); người gác
   không cho máy xoá (RM-NHAP) — xin chủ quán xoá tay. Công cụ đã tắt ghi bytecode.

## Sự cố trong lượt lập kế hoạch (đầu vào bước 11)
- Đo mẫu AUDIT-1 in "✗ KHO BẨN": truy nguyên → chỉ do `viec/AUDIT-2/ke_hoach.md`, `trang_thai.md` tôi tạo TRONG lúc đo
  (khung lọc `viec/AUDIT-1/`); không sót thư mục tạm. → kế hoạch: bọc lọc thêm `viec/AUDIT-2/`, không ghi file khi đo.
- Người gác chặn (đúng luật): `nproc`, `until` (B-CHUONGTRINH); số học `$(( ))`, chuỗi `$'…'` (B-PHANTICH); `cd` giữa lệnh
  (B-CD-VITRI); script python có từ tiếng Anh chỉ "thẻ khoá" viết hoa (B-BIMAT-CHU). Đã viết lại lệnh đơn giản hơn.
- Agent soát kế hoạch bắt: D4 bundle tìm `sessionExpiredHandled` chứ không phải `POS-ERRHANDLING-v1` (tôi suy từ TÊN phép — K1).
- Phiên `tiep` — người gác chặn thêm (đúng luật): `for` (B-CHUONGTRINH), `$((…))` lỡ gõ (B-PHANTICH), `${x%%:*}` (B-PHANTICH), python
  viết thẳng nhắc sổ việc / tên file bí mật (B-MANOI ×2 — đọc sổ việc bằng Read/Grep, viết lại câu). Viết lại lệnh đơn giản hơn.
- Tự bắt K3 trong công cụ của chính việc này (trước khi ghi số): (1) `kiem_neo.py` regex bảng neo `do_*.js` đòi `[[` liền nên bỏ sót
  `do_chia.js` (mảng xuống dòng) mà vẫn in "không có bảng neo" → sửa, in số neo từng file (6 neo; `do_cpu.js` không có bảng — vòng 1 sửa cách đếm). (2) `dot_bien_bb.py`
  luật "bỏ bí danh bảng" áp cả JS → loại nhầm `dem.get(vt) !== 1`, `soNo.get(vt) !== 1`… (6 đột biến I7) → luật bí danh chỉ cho SQL, JS
  chỉ bỏ tên một chữ cái trước `.`; chạy lại 6 đột biến mới (6/6 BẮT), 142 tên cũ không đổi.
- Ghi số dòng `a3_bang.md` theo trí nhớ → 7 chỗ lệch 1–2 dòng; script so từng dòng bắt được, đã sửa (K1).

## Phát hiện
Bảng đủ ở `bao_cao.md` (AU2-1 … AU2-11). Tóm tắt: **AU2-1 NẶNG-code** lấy vượt lượt gói (đã biết LUOI-1 Phát hiện 5, nay có bằng chứng
chạy, trúng P26c) · **AU2-2 NẶNG-lưới** 5 phép chặn / tính tiền-điểm-gói ở quầy không có ca bắt (2 trúng P26c) · AU2-3 … AU2-10 NHẸ
(44 vế bất biến thiếu ca dữ liệu tay; 10 thao tác chủ; MA3 đỏ vì sập; neo 1.4.0; Read file bí mật chỉ lớp 1 canh; `doi-soat-bo-tx` đỏ vì
móc không chạy; KB20 kiểm lại mã chưa kiểm được (P26d); `thu_cong.js` ≥ hạn 120 s — cả npm test) · **AU2-11 chờ chủ quán** (số lượt gói
do quầy gõ tay — Câu hỏi 2).

## Soát độc lập `/ra-soat` — vòng 1 (12.10, trên `b49e0d1`) — báo cáo chép nguyên
```
KHÔNG ĐẠT

Hai phát hiện NẶNG của đợt audit này đứng vững. AU2-1 tôi chạy lại và ra đúng như báo cáo. Năm đột biến AU2-2 trích đúng dòng code
thật. Lý do KHÔNG ĐẠT: D3 chưa đạt, có số đếm sai trong báo cáo, và có ba chỗ công cụ đo báo "xanh" mà không đo gì thật (khuôn K3).

LỖI TÌM ĐƯỢC:
1. kiem_tra_truoc_khi_giao.js:553 (với hạn 120 s ở :478). Bộ kiểm gọi tu_chay/thu_cong.js ở cả chế độ thường, không riêng --day-du.
   Nghĩa là npm test và hook pre-commit cũng vướng hạn 120 s.
   - Tôi chạy lại: node tu_chay/thu_cong.js riêng mất 119 s. npm test chạy riêng ra PASS 60 · FAIL 1 ("thu_cong.js xanh (120.1 s)
     → ETIMEDOUT").
   - Nhưng trang_thai.md:50 ghi "npm test thoát 0 · PASS 61 · FAIL 0". AU2-10 (bao_cao.md:27) và Câu hỏi (trang_thai.md:57–60) chỉ
     nói --day-du đỏ.
   - Vế "npm test xanh" của D3 không đứng vững. P26c và mọi việc khác có thể bị pre-commit chặn ngẫu nhiên. (K4 + K1)
2. Số A3L sai.
   - dot_bien.py có 18 đột biến A3L (grep -c "^  ('A3L-" = 18). Bảng a3_bang.md:27–44 có 18 dòng, trong đó 9 BẮT và 9 SỐNG.
   - Nhưng a3_bang.md:17, bao_cao.md:42 ("9/17") và trang_thai.md:33 ("A3L 9 BẮT 8 SỐNG") đều ghi 17 / 8. Theo trang_thai thì tổng
     còn 31 ≠ 32. (K1)
3. viec/AUDIT-2/kiem_neo.py:95–97 là phép tự so với chính nó: s_bb[a:b] == d['cu'], mà cu vốn được cắt từ đúng s_bb trong cùng lần
   sinh(), nên luôn xanh.
   - 148/152 "neo khớp" của nhóm "AUDIT-2 bb" (trang_thai.md:48, bao_cao.md:46 "645 neo khớp") không đo gì.
   - Nguy cơ thật là bat_bien.js đổi thì tên trôi: tên SỐNG ghi trong b2_bang.md trỏ sang vế khác mà không ai biết. Không có phép
     nào canh việc này. (K3)
4. viec/AUDIT-2/lach.js:42–45 chỉ so CHO hay CHẶN, không so mã chặn với mã đang nhắm. Ba mục trong lach.json bị chặn bởi luật khác
   chứ không phải luật đang thử:
   - Các mục đó là dòng 11 GIT-CHECKOUT-FILE, 14 B-GHI-TOUCH, 15 CP-DICH. Đích là <file bí mật>, nên luật B-BIMAT-FILE
     (nguoi_gac.js:395–398, quét mọi từ trong lệnh) chặn trước.
   - Tôi tắt đúng luật đang nhắm qua tham số tat của xet() (script trong thư mục nháp): cả ba vẫn CHẶN:B-BIMAT-FILE.
   - Vậy câu "14/15 CHẶN" và "59/76 mã có lệnh lách" (a3_bang.md:62, 82) thổi phồng phần phủ: ba mã này chưa có ca thử thật. Cùng
     lần chạy đó, 12/15 vẫn CHẶN dù đã tắt luật. Phần lớn là luật "cho qua", nơi chặn bằng luật khác là hợp lý; chỉ ba mã trên là cơ
     chế không được thử. (K3: ca gộp đỏ nhờ phép khác)
5. viec/AUDIT-2/kiem_neo.py:105 đếm dòng "do_cpu.js (không có bảng neo)" như một neo khớp. Thực tế "do_*.js 7/7" (trang_thai.md:48,
   71) chỉ có 6 neo. (K1)
6. bao_cao.md:40 đếm MA3 là BẮT (39/39). Nhưng chính a1_bang.md (dòng MA3) và AU2-5 xếp nó "LẠC-giống" vì cổng sập. Theo định nghĩa
   AUDIT thì phải là 38 BẮT + 1 LẠC. Ngoài ra trang_thai.md:32 ghi HOC-2 "22/22", đúng ra là 22/23 + 1 HỎNG. (K3/K1)
7. Bytecode ghi vào kho thật, kể cả ngoài viec/AUDIT-2/:
   - viec/AUDIT-2/dot_bien.py:14–16 và kiem_neo.py:23–24, 90, 94 nạp module bằng importlib mà không tắt ghi bytecode.
   - Hệ quả: có viec/AUDIT-1/__pycache__/dot_bien.cpython-313.pyc (05:15) và viec/AUDIT-2/__pycache__/*.pyc (06:38, 07:05).
   - .gitignore:38 che các file này, nên phép so git status trước/sau mù với chúng. Câu "Công cụ chỉ ghi vào bản sao trong thư mục
     tạm" (bao_cao.md:60) và "Không đổi một byte ngoài viec/AUDIT-2/" chưa đúng tuyệt đối. Mức nhẹ, không ảnh hưởng tiền. (K5)
8. Vượt ngân sách mà không ghi lý do:
   - dot_bien_bb.py 332 dòng, ngân sách 150–250 (phieu.md:56, ke_hoach.md:93).
   - kiem_neo.py 122 dòng, tức +66 so với bản HOC-2b 56 dòng (ngân sách ~+40).
   - Không có giải thích trong trang_thai.md hay ke_hoach.md. (đơn giản / K6)

NGHI NGỜ:
- Phần "logic gói" của A3 có thể sót một đường tiền:
  - orders.js:968 lưu package_buy.total_qty do client gửi, trong khi giá lấy từ pkg.price (:374).
  - Ở quầy, ô số lượng sửa tay được (Sales.jsx:1225–1232, gửi đi ở :747): bán gói giá cố định nhưng số lượt tuỳ ý.
  - AUDIT-2 không có dòng nào xét đường này. a3_bang.md:21 liệt kê orders.js:974–1035 nhưng không nhắc :968.
  - P26a đã ghi cùng lỗi cho /packages/buy (viec/P26a/trang_thai.md:100, 412). Có thể chủ quán cố ý cho sửa số lượt; nếu không
    thì đây là NẶNG-code chưa ghi. Cần chủ quán xác nhận.
- B3: 4 ca chồng nhau (KB17:292, 293, 298, 300 — b3_bang.md:21–25) không có đột biến bỏ khoá nào, chỉ có lý do ở ghi chú 2. Phiếu
  B3 đòi mỗi ca ghép một đột biến. Có thể dẫn các đột biến ghiVi của P26b nhưng chưa làm. Tóm tắt "23 dòng… 23/25" (bao_cao.md:12,
  45) không nhắc 4 ca thiếu này. Đếm "19 dẫn" lệch với số tên tôi đếm được: 18 tên P26b + G3-da-biet + VS-SRV = 20.
- dot_bien_bb.py:262–270: code chạy tiếp tầng 2 cả khi tầng 1 đỏ không khớp, khác docstring ":14 tầng 2 (tầng 1 xanh)". Hiện không
  tìm được ca nào gây BẮT oan. Mẫu SẬP và → I<n>: mà công cụ phụ thuộc thì kiem_neo.py không canh.
- Phép rà mẫu của kiem_neo.py rỗng với mọi mẫu không có từ ≥ 4 chữ cái (vd → I8:, KB10 → I6:). Giới hạn này đã ghi một phần ở
  bao_cao.md:57.

(Những điểm đã kiểm và đúng: diff server/ client/ rỗng; AU2-1 chạy lại BẮT; A3L-goi-bo-kiem-chu vẫn SỐNG; 5 dòng AU2-2 đúng; 15+
trích dẫn khác đúng; bộ sinh 148 đối chiếu tay khớp, không sót; "142 tên cũ không đổi" đúng; --chi BB-I3-sql-1 --chi BB-I12-js-2
khớp b2_bang.md; kiem_neo.py thoát 0 khớp; A2 23 dòng không xếp nhầm; A1 174 dòng đếm khớp.)

NGHIỆM THU: 11/12 mục có bằng chứng · mục thiếu: D3. (A1 có — MA3 phải LẠC; A2 có; A3 có — số A3L sai, 3 lệnh lách không thử đúng
luật; B1 có — vượt ngân sách; B2 có; B3 có một phần — 4 ca không có đột biến; B4 có; C1 có — 148 neo tự so; C2 có; D1 có — AU2-10
thiếu phạm vi npm test; D2 có; D3 thiếu.)

CHƯA SOÁT ĐƯỢC: không chạy lại đủ các bộ dài (A1, HOC-1, HOC-2, bb đủ 148, dot_bien.py đủ 32); không thử ngắt SIGINT; không đo
thu_cong.js trên gốc; không xác nhận chủ quán có cố ý cho sửa số lượt gói; không đọc hết 256 dòng a1_bang.md theo từng tên.

BÀI HỌC:
- KHOÁ: phép neo cho đột biến sinh tự động phải so với một ảnh chụp lưu riêng (tên → chuỗi gốc), không so với đầu ra của chính lần
  sinh. Ca đỏ: sửa một vế trong bat_bien.js thì tên SỐNG trôi phải làm phép đỏ.
- KHOÁ: mỗi mục trong lach.json phải ghi các mã chặn được chấp nhận (mong), và lach.js phải so r.ma với đó. Ca đỏ: tắt luật đang
  nhắm qua xet(…, tat) thì phải ra LỌT hoặc sai mã.
- KHOÁ: số tổng trong bao_cao.md và trang_thai.md phải lấy bằng máy từ --json của lần chạy, không gõ tay (lỗi 17/18 và 7/6).
- NGUYÊN TẮC (K4): gặp một phép quá hạn ở --day-du thì grep xem cùng bước có chạy trong npm test / pre-commit không trước khi khoanh
  phạm vi ảnh hưởng.
- NGUYÊN TẮC (K5): công cụ nạp module bằng importlib phải tắt ghi bytecode (sys.dont_write_bytecode). Phép "git status trước/sau" mù
  với file nằm trong .gitignore.
- NGUYÊN TẮC (K1): đường tiền nào nhận số lượng hoặc lượt từ client (package_buy.total_qty) phải xếp loại rõ trong bảng A3. Không
  được bỏ qua vì "đã biết ở route khác".
```
(Một chữ tên file bí mật trong báo cáo thay bằng "<file bí mật>" — người gác chặn mã viết thẳng nhắc tên đó.)

### Đã sửa theo vòng 1 (vòng sửa 1/3)
| lỗi vòng 1 | xử lý |
|---|---|
| 1 `thu_cong.js` chạy cả ở bản nhanh → npm test / pre-commit | AU2-10 mở rộng phạm vi (`kiem_tra_truoc_khi_giao.js:478, :553`), Câu hỏi 1 sửa; D3 vẫn CHƯA đạt — chờ chủ quán |
| 2 số A3L 17/8 | 18 / 9 SỐNG ở `a3_bang.md`, `bao_cao.md`, bảng trên |
| 3 neo `dot_bien_bb` tự so | ẢNH `viec/AUDIT-2/bb_neo.json` (`dot_bien_bb.py --liet-ke --json`), `kiem_neo.py` so tên sinh lại với ảnh; ca đỏ: bản sao chèn một vế vào I1 → thoát 1, 9 HỎNG "tên trôi" |
| 4 lách bị luật khác chặn hộ | `lach.json` thêm `mong` + `loai`; `lach.js` so mã + tắt luật nhắm (`xet(…, tat)`); đổi đích 3 mục khỏi file bí mật; 5/5 mục "chặn": tắt → CHO; ca đỏ: bản nháp đổi đích `cp` về file bí mật → "SAI MÃ" |
| 5 `do_cpu.js` đếm như neo | không tính, in riêng; do_*.js 6/6 |
| 6 MA3 / HOC-2 đếm | 16 BẮT + 1 LẠC; HOC-2 22/23 + 1 HỎNG |
| 7 bytecode | `sys.dont_write_bytecode = True` ở `dot_bien.py`, `kiem_neo.py` (bản sao chạy lại: 0 `__pycache__`); thư mục cũ → Câu hỏi 3 |
| 8 vượt ngân sách | lý do dưới đây |
| nghi 1 `package_buy.total_qty` | AU2-11 + Câu hỏi 2 |
| nghi 2 B3 4 ca KB17 | giữ lý do (route không đọc gì ngoài giao dịch — không có khoá riêng để bỏ; kế hoạch đã duyệt `ke_hoach.md:143` "Ca không có khoá tương ứng để bỏ → ghi lý do" — soát vòng 2 sửa nguồn trích); tóm tắt `bao_cao.md` nêu rõ 4 dòng; đếm dẫn 20 |
| nghi 3 docstring tầng 2 | sửa docstring: tầng 2 chạy khi tầng 1 CHƯA BẮT |

**Ngân sách (lỗi 8):** `dot_bien_bb.py` 334 dòng sau vòng 1 (344 sau vòng 2: +10 dòng `anh_kho` soi đường bị `.gitignore` che) (ngân sách 150–250): bộ quét phải tự tách JS / chuỗi SQL / `${}` / chú thích, dò biên vế
theo ngoặc cho cả JS và SQL (~120 dòng) — phiếu cấm thư viện mới nên không dùng trình phân tích có sẵn; phần chạy (bản sao, hai tầng, kiểm
sạch, tín hiệu, `--json`) ~90 dòng; D2 + liệt kê ~40. `kiem_neo.py` 128 dòng sau vòng 1 (133 sau vòng 2: +5 đếm mục có neo / so chuỗi) (+77 so bản HOC-2b): thêm 4 bộ mới, rà MẪU, neo `do_*.js`, so ảnh
`bb_neo.json` — mỗi phần là một mục nghiệm thu C1. Không tách được mà không bỏ mục.

## Soát độc lập `/ra-soat` — vòng 2 (12.10, trên `7455eb2`) — báo cáo chép nguyên (rút gọn trình bày, giữ nội dung)
```
KHÔNG ĐẠT
Lý do chính: D3 vẫn chưa đạt (đang chờ chủ quán, nằm ngoài phạm vi việc). Ngoài ra còn 6 lỗi nhẹ mới, thuộc khuôn K4/K3: số liệu và câu
chữ còn sót sau vòng sửa 1, và hai phép mới báo sai cách. Đường tiền không bị đụng. Phát hiện NẶNG AU2-1 tôi chạy lại vẫn BẮT.

KIỂM TỪNG LỖI VÒNG 1: 1 ĐÃ SỬA hồ sơ (kiem_tra:478 hạn 120000, :553 ngoài if (DAY_DU); D3 vẫn đỏ, chờ chủ quán). 2 ĐÃ SỬA (A3L 18, B3 6,
tổng 32; ba file khớp 9/9). 3 ĐÃ SỬA THẬT (--liet-ke --json ra giống từng byte bb_neo.json; đổi chữ một vế → thoát 1, 1 HỎNG; chèn dòng ở
cuối → thoát 0) — còn lỗi 3, 5 mới. 4 ĐÃ SỬA THẬT (CHẶN 14 · LỌT 1 · SAI MÃ 0 · TẮT KHÔNG ĐỔI 0; 3 đột biến bản sao: SAI MÃ, SAI MÃ, LỌT)
— còn lỗi 4. 5 ĐÃ SỬA (do_*.js 6/6) — còn sót cùng khuôn, lỗi 1. 6 ĐÃ SỬA ở bao_cao.md:43, trang_thai.md:31–32 — còn sót a1_bang.md:255–256
và doi-soat-bo-tx (lỗi 2). 7 ĐÃ SỬA (dont_write_bytecode dot_bien.py:12, kiem_neo.py:9; .pyc không đổi giờ) — phép "kho sạch" vẫn mù với
.gitignore (lỗi 6). 8 lý do ngân sách hợp lý (334, 128, 59, 94 dòng). Nghi 1 AU2-11 có, trích dẫn đúng. Nghi 2 giữ lý do, căn cứ
ke_hoach.md:143 nhưng trích sai nguồn (lỗi 7). Nghi 3 ĐÃ SỬA dot_bien_bb.py:15.

LỖI TÌM ĐƯỢC:
1. kiem_neo.py:118–123 (ghi() :53–61) — K4: mục không có neo (ds rỗng) vẫn đếm "neo khớp": 15 mục (HOC-1 3, HOC-2 3, TU-CHAY-4 1, HOC-2b 6
   M0-*, LUOI-1 2 GOC-KB10-*) → "644 neo khớp" (bao_cao.md:49) thật ra 629; "HOC-1 20/20", "HOC-2b 26/26" (trang_thai.md:48) thổi phồng.
2. a1_bang.md:255–256 — K4: vẫn "HOC-1 … 17/17 ĐỎ đúng chỗ", "mọi đột biến chuyển sang đều BẮT", trái "16 BẮT + 1 LẠC". Cùng khuôn: b3_bang.md:23,
   bao_cao.md:48 ("20 dẫn" tính BẮT) vẫn đếm doi-soat-bo-tx là BẮT dù ghi chú 4 / AU2-8 nói đỏ vì "móc không chạy" — B3 phải 23 BẮT + 1 LẠC-giống.
3. kiem_neo.py:102 — K2 / K8 chiều ngược: câu báo chỉ in số dòng ([:1]); chèn MỘT dòng chú thích trước I1 → 148 HỎNG "tên trôi", thoát 1 dù
   tên nào cũng trỏ đúng vế cũ. Nên so chuỗi trước, lệch dòng báo riêng; in cả hai chuỗi.
4. lach.js:59 — K3: HEAD thoát 1 vĩnh viễn vì CC-DOC LỌT đã biết (mong ["*"] vô nghĩa); đột biến cũng thoát 1 — mã thoát không phân biệt
   hồi quy. Đánh dấu CC-DOC "biết LỌT" để HEAD thoát 0.
5. bao_cao.md:52–56 (B4) — K4: không nhắc bb_neo.json; sau sửa bat_bien.js hợp lệ thì lối ra duy nhất là sinh lại ảnh — không luật nào buộc
   "sinh lại ảnh ⇒ chạy đủ dot_bien_bb.py + cập nhật b2_bang.md".
6. dot_bien_bb.py:277–278, :327–328 — K5: anh_kho chỉ so git status, mù với .gitignore (data/, __pycache__); khung AUDIT-1 còn so data/.
   bao_cao.md:63–64 vẫn dùng "✓ kho thật không đổi" làm bảo đảm.
7. K1 nhẹ: trang_thai.md:188 "phiếu B3 cho phép 'ghi lý do'" — phieu.md:29–30 không có, câu ở ke_hoach.md:143; trang_thai.md:22 "62 dòng" → 67.

NGHI NGỜ: viec/P26b/__pycache__/dot_bien.cpython-313.pyc 02:32:05 (sau PHIEU 02:27) — Câu hỏi 3 chỉ kê hai thư mục; thủ phạm khả dĩ
viec/HOC-2b/dot_bien.py:18. .git/hooks trong bản sao KHÔNG có pre-commit — commit AUDIT-2 không qua tầng 3; AU2-10 nói "pre-commit đỏ ngẫu
nhiên" mà không nói điều này. AU2-10 đề xuất là lời dặn: thu_cong.js gọi không có canhGan (kiem_tra :553; chỉ :761, :765 bật cảnh báo 80 %)
— khoá đơn giản: bật canhGan cho bài thật tu_chay. Ảnh bb_neo.json không chụp `moi`. 4 ca KB17 lý do yếu (P26b đã dựng được kiểu nap-ghi-
tuyet-doi-tu-so-ngoai-tx). 10 mục "cho" của lach.json không chứng minh luật "cho" được xét tới.

NGHIỆM THU: 11/12 · thiếu D3 (npm test chưa chạy lại trên 7455eb2; không nêu khoá canhGan, không nêu commit không có hook gác).
Đường tiền: git diff 4d175bc^ HEAD -- server client 0 dòng. P1: client/src không đổi. Cổng tĩnh: node tu_chay/cong.js tinh . 43c793e
7455eb2 viec/AUDIT-2 → "✓ CỔNG TĨNH ĐẠT".
CHƯA SOÁT ĐƯỢC: npm test / --day-du / thu_cong.js; bộ dài; SIGINT; ai đẻ P26b __pycache__; 256 dòng a1_bang / a2_bang theo tên; "tầng 1 bắt
80 / tầng 2 bắt 20".
BÀI HỌC: KHOÁ đếm "neo khớp" chỉ mục có neo · KHOÁ công cụ tự chứng minh thoát 0 trên HEAD (điều đã biết đánh dấu trong dữ liệu) · KHOÁ ảnh
neo so chuỗi + B4 gắn "sinh lại ảnh ⇒ chạy đủ + cập nhật b2_bang.md" · NGUYÊN TẮC (K4) đổi phân loại vì "đỏ đúng ca sai lý do" thì grep mọi
chỗ cùng lý do + mọi file tóm tắt · NGUYÊN TẮC (K5) vá cả phép mù, không chỉ nguồn bẩn · NGUYÊN TẮC (K6) kiểm .git/hooks/pre-commit có cài.
```

### Đã sửa theo vòng 2 (vòng sửa 2/3)
| lỗi vòng 2 | xử lý |
|---|---|
| 1 mục không neo đếm "neo khớp" | `kiem_neo.py` đếm riêng mục có neo (`ghi()` ghi cờ `bool(ds)`); in "(n không neo — đối chứng) · neo khớp x/y" → 629/633 |
| 2 MA3 / doi-soat-bo-tx sót | `a1_bang.md` cuối: 16 BẮT + 1 LẠC; `b3_bang.md` KB17:295 → LẠC-giống; `bao_cao.md` B3: 23 BẮT · 2 SỐNG · 1 LẠC = 23/26 |
| 3 "tên trôi" so số dòng | so CHUỖI; cùng chuỗi khác dòng chỉ in "dời dòng", không HỎNG; câu báo in cả hai chuỗi. Bản sao: chèn 1 dòng chú thích trước I1 → thoát 0 (148 dời dòng); đổi `'completed'` → `'xong'` → thoát 1, 2 HỎNG in đủ chuỗi |
| 4 lach.js thoát 1 vĩnh viễn | CC-DOC `biet_lot` → "LỌT ĐÃ BIẾT" không làm đỏ; HEAD thoát 0 (CHẶN 14 · LỌT ĐÃ BIẾT 1 · LỌT 0 · SAI MÃ 0 · TẮT KHÔNG ĐỔI 0) |
| 5 B4 không nhắc ảnh | đề xuất B4 thêm luật "sinh lại `bb_neo.json` chỉ cùng commit chạy đủ `dot_bien_bb.py` + cập nhật `b2_bang.md`" |
| 6 phép kho sạch mù .gitignore | `dot_bien_bb.py` `anh_kho` so thêm mọi đường `git status --ignored` (trừ node_modules, nhật ký người gác): số file + mtime lớn nhất; `--chi D2-` → "✓"; ca đỏ CHƯA KIỂM (người gác chặn `git init` — không dựng được kho giả; không chạm kho thật) |
| 7 trích dẫn / số đếm | nguồn "ghi lý do" = `ke_hoach.md:143`; số dòng `bao_cao.md` |
| nghi: P26b `__pycache__` | do tôi (lúc lập kế hoạch) — Câu hỏi 3 |
| nghi: không có pre-commit | xác nhận: chỉ file mẫu trong thư mục hook — ghi ở AU2-10 + CHƯA KIỂM |
| nghi: canhGan | đề xuất khoá báo trước ở AU2-10 (kèm đổi ca C3f) |
| nghi: ảnh không chụp `moi` / 10 mục "cho" của lách / 4 ca KB17 | giữ — ghi CHƯA KIỂM / lý do: mục "cho" thử rằng luật CHO không cho quá đà, bị luật khác chặn là kết quả ĐÚNG (tắt luật CHO không có nghĩa) |

`npm test` chạy lại trên `a903c02` (12.10, sau vòng sửa 2): thoát 0 · ĐẾM PASS 61 · FAIL 0 · CẢNH BÁO 0 — lần này `thu_cong.js` dưới hạn; vẫn sát
hạn (lần người soát vòng 1: FAIL 1) — D3 vẫn chờ chủ quán (Câu hỏi 1).

## Soát độc lập `/ra-soat` — vòng 3 (12.10, trên `59b2c36`) — báo cáo chép nguyên (rút gọn trình bày, giữ nội dung)
```
KHÔNG ĐẠT
Hai lý do: D3 vẫn đỏ, chờ chủ quán (ngoài phạm vi); còn 6 lỗi nhẹ sửa được trong viec/AUDIT-2/ — phần lớn số liệu / câu chữ sót sau vòng
2, cộng một chỗ kiem_neo.py sót thư mục tạm. Đường tiền không bị đụng (git diff 4d175bc^ HEAD -- server client 0 dòng). Mọi lệnh người
soát chạy để kho y nguyên (so mtime 370 file: chỉ khác nhật ký người gác; git status sạch).

KIỂM TỪNG LỖI VÒNG 2: 1 ĐÃ SỬA THẬT (kiem_neo.py:61, :127–128; 629/633, 15 đối chứng, 4 rữa cố ý). 2 SỬA CHƯA HẾT (a1_bang:255–256,
b3_bang:23, bao_cao:48 đã sửa; còn trang_thai:37 "18/18 bị bắt", bao_cao:10–11, a1_bang:257). 3 ĐÃ SỬA THẬT (chèn dòng → thoát 0, 148 dời
dòng; đảo hai vế && I9:162 → thoát 1, 2 HỎNG; đổi chỗ hai filter I9 → thoát 1, 2 HỎNG). 4 ĐÃ SỬA THẬT (lach: CHẶN 14 · LỌT ĐÃ BIẾT 1 ·
LỌT 0 · SAI MÃ 0 · TẮT KHÔNG ĐỔI 0, thoát 0). 5 ĐÃ SỬA (bao_cao:56–58). 6 ĐÃ SỬA THẬT (dot_bien_bb.py:277–288; --chi D2- đủ 4 trạng thái,
"✓"); hồ sơ ghi ca đỏ CHƯA KIỂM nhưng dựng được: cp -r .git vào scratchpad rồi gọi anh_kho() của bản sao → BẮT 6/8 ca (pyc mới trong thư
mục chưa theo dõi, pyc mới trong __pycache__ đã có, data/pos.db, server/x.db, ghi đè .bak đã có, .claude/settings.local.json); 2 ca MÙ đúng
thiết kế (node_modules, nhật ký người gác). 7 ke_hoach.md:143 đúng; "≤ 70 dòng" ở trang_thai:22 vẫn sai. Nghi vòng 2: Câu hỏi 3 đủ ba thư
mục; không có pre-commit xác nhận; canhGan đã đề xuất, trích đúng.

LỖI TÌM ĐƯỢC:
1. bao_cao.md:10–11, a1_bang.md:257, trang_thai.md:37 — K4: "Mọi đột biến cũ đang BẮT vẫn BẮT (A1: 174 + 20 + 26, không tên nào đổi kết
   quả)" trái bao_cao:43 (MA3 LẠC, VS-E3 HỎNG); a1_bang:257 bỏ qua VS-E3; trang_thai:37 "<18 tên B3> 18/18 bị bắt" dù doi-soat-bo-tx LẠC-giống.
2. kiem_neo.py:91–92 + dot_bien.py:17, :25 — K5 + K7: nạp AUDIT-2 thì khung AUDIT-1 tạo GOC_TAM lúc nạp; dot_bien.py:25 ném lỗi nếu thiếu
   client/dist/assets; :92 không try/finally → sót /tmp/audit1_* + traceback thoát 1 (tái hiện tất định trên bản sao bỏ client/dist). Cùng
   khuôn: python3 viec/AUDIT-2/dot_bien.py cũng sót K.GOC_TAM khi sập lúc nạp (tín hiệu gắn sau :25).
3. AU2-10 / Câu hỏi 1 chưa đủ — K4/K1: spawnSync quá hạn SIGTERM thu_cong.js; thư mục tạm của nó chỉ xoá ở tu_chay/thu_cong.js:698, không
   móc tín hiệu → thư mục tạo ở :24 bị bỏ lại. Hiện có /tmp/thu_cong_R1vc3w (07:14), /tmp/cong_QI3hE4 (07:14), /tmp/thu_cong_9a0wrs (07:37),
   ~7 MB mỗi cái. Phép "0 thư mục tạm sót" (bang_chung_do.txt:41) chỉ lọc tiền tố gõ tay nên không thấy.
4. trang_thai.md:22, :78, :84, :192–194 — K4: "≤ 70 dòng" thật 71; "7 neo" thật 6; "AU2-1 … AU2-10" thật có AU2-11; ngân sách 334 / 128
   thật 344 / 133, lý do chưa nói +10 dòng vòng 2.
5. a3_bang.md:65, bao_cao.md:26, :46 — K4: vẫn nhãn "LỌT 1" trong khi lach.js ra "LỌT ĐÃ BIẾT 1 · LỌT 0" (khác nghĩa); bang_chung_do.txt:11
   còn câu anh_kho cũ "(git status)", không mục nào ghi bằng chứng bản mới.
6. lach.js:52–54 — K3 nhẹ: phép "tắt luật nhắm thì phải ĐỔI" nhận mọi kết quả khác ma, kể cả NG-LOI (xet() bắt ngoại lệ → chan('NG-LOI'),
   nguoi_gac.js:961–962). Nên đòi tat === 'CHO'.

NGHI NGỜ: kiem_neo.py:104–105 bỏ qua tên chỉ dời dòng khi chuỗi giống ảnh — có cặp tên trùng chuỗi (BB-I9-js-1/-5-bo-ve; BB-I14-sql-3/-10,
-sql-4/-11, -sql-1/-2-duong, -js-1/-5-bo-ve): đổi chỗ thì tráo tên lặng lẽ (chưa dựng được ca mà mọi tên lân cận đều trùng).
dot_bien_bb.py:220 symlink node_modules "chỉ đọc" không ép; anh_kho bỏ qua node_modules. dot_bien.py:23 lọc viec/AUDIT-2/ khỏi ảnh git status —
luật "không ghi khi đo" chỉ là lời dặn. b3_bang:21–25 KB17:292 có thể ghép tru-tay-chi-kiem-ngoai-tx (phán đoán). kiem_neo.py:89 in LUOI-1
goc* là "đối chứng" nhưng thật là neo không phép nào canh.

NGHIỆM THU: 11/12 · thiếu D3 (Câu hỏi 1 đúng nguyên nhân, phạm vi, trích dẫn; thiếu chuyện quá hạn sót thư mục tạm — lỗi 3; vế "thư mục tạm
xoá kể cả khi ngắt" chưa phủ kiem_neo.py — lỗi 2).
CHƯA SOÁT ĐƯỢC: npm test / --day-du / thu_cong.js; bộ dài; SIGINT kiem_neo.py, lach.js (Node mặc định: process.on('exit') không chạy khi
SIGINT — suy từ code); "tầng 1 bắt 80 / tầng 2 bắt 20"; 256 dòng a1_bang theo tên. K1: 12+ trích dẫn đọc lại đều ĐÚNG.
Đơn giản: ô AU2-10 (bao_cao:29) nhồi nhiều thứ — tách pre-commit ra một dòng.
BÀI HỌC: KHOÁ công cụ tạo thư mục tạm lúc nạp phải dọn trong try/finally hoặc atexit + móc tín hiệu (ca đỏ: hỏng một bước sau khi tạo → không
sót); phép "0 thư mục tạm sót" lấy tiền tố từ đúng mkdtemp. KHOÁ "tắt luật thì phải đổi" khẳng định đúng CHO. NGUYÊN TẮC (K4) sửa phân loại
một tên thì grep tên đó + câu tổng quát trong mọi hồ sơ; sửa file thì con số mô tả chính file (số dòng) sinh lại bằng wc -l trong cùng commit.
NGUYÊN TẮC (K3) đừng ghi "CHƯA KIỂM — không dựng được" trước khi thử chép .git vào nháp. NGUYÊN TẮC (K1) phép quá hạn xét cả dọn dẹp sau khi bị giết.
```

### Đã sửa theo vòng 3 (vòng sửa 3/3 — vòng cuối; không mở soát vòng 4)
| lỗi vòng 3 | xử lý |
|---|---|
| 1 câu tổng "mọi … vẫn BẮT" | `bao_cao.md` kết luận, `a1_bang.md` cuối (thêm VS-E3 HỎNG), dòng P26b ở bảng lệnh trên (17 BẮT + 1 LẠC-giống) |
| 2 sót thư mục tạm khi nạp hỏng | `dot_bien.py`: `atexit.register(shutil.rmtree, K.GOC_TAM, True)` ngay sau khi nạp khung (phủ cả `kiem_neo.py` nạp nó). Bản sao bỏ `client/dist`: `dot_bien.py` và `kiem_neo.py` đều sập như cũ nhưng `ls /tmp \| grep -c audit1_` = 0 (người soát tái hiện bản cũ: sót 1 mỗi lần) |
| 3 quá hạn sót thư mục tạm `thu_cong.js` | AU2-10 + Câu hỏi 1 bổ sung (`tu_chay/thu_cong.js:24, :698`), đề xuất khoá |
| 4 số liệu trang_thai | số dòng, 6 neo, AU2-11, ngân sách 344 / 133 (+ phần vòng 2) |
| 5 nhãn "LỌT 1" | "LỌT ĐÃ BIẾT 1" ở `a3_bang.md`, `bao_cao.md`; ca đỏ của `anh_kho` mới: bản sao `kg2` (git archive + chép `.git` vào nháp) — `bang_chung_do.txt` mục 10 |
| 6 lach "tắt → khác là được" | đòi ĐÚNG `CHO`; HEAD vẫn CHẶN 14 · LỌT ĐÃ BIẾT 1 · 0 · 0 · 0, thoát 0 |
| nghi: tên trùng chuỗi đổi chỗ, node_modules symlink, lọc viec/AUDIT-2 ở ảnh git status, KB17:292, LUOI-1 goc* | ghi CHƯA KIỂM / Bài học (không sửa thêm — vòng cuối, ưu tiên không mở rộng) |

## Nghiệm thu — đếm từng mục (không lấy mẫu)
| mục | bằng chứng | trạng thái |
|---|---|---|
| A1 | `a1_bang.md` (174 AUDIT-1 + 20 HOC-1 + 26 HOC-2 từng tên, so lần trước); lệnh + thời gian ở bảng "Kết quả nhóm A, B" | có |
| A2 | `a2_bang.md` — 23 C2F, 0 NẶNG, 10 NHẸ-tiền + đề xuất một KB | có |
| A3 | `a3_bang.md` — bundle D2–D5 4/4 BẮT; loyalty/gói 18 (9 BẮT · 9 SỐNG, 5 NẶNG-lưới); thăm dò A3P BẮT (AU2-1); lách 15 mã `lach.js`/`lach.json` | có |
| B1 | `dot_bien_bb.py` (`--liet-ke` 148 tên tất định + dòng, `--chi`, `-j`, `--json`; BẮT chỉ khi đúng I<n>, sập = LẠC); ảnh `bb_neo.json` | có |
| B2 | `b2_bang.md` — 148 → 100 BẮT · 48 SỐNG: (a) 44 · (b) 4 · (c) 0 | có |
| B3 | `b3_bang.md` — 23 dòng ca chồng; 26 đột biến (6 mới + 20 dẫn): 23 BẮT · 2 SỐNG có lý do · 1 LẠC-giống; 4 dòng KB17 không có khoá riêng (lý do, `ke_hoach.md:143`) | có |
| B4 | `bao_cao.md` mục Đề xuất (skill bước 4 + lenh_ra_soat + luật sinh lại ảnh) | có |
| C1 | `kiem_neo.py` — 629/633 neo khớp, 4 rữa cố ý đánh dấu, 0 mẫu nghi rữa; ca đỏ `bang_chung_do.txt` mục 4, 6, 8 | có |
| C2 | `bao_cao.md` mục Đề xuất (không cần — lý do) | có |
| D1 | `bao_cao.md` 72 dòng ≤ 200, AU2-1 … AU2-11, tỷ lệ theo nhóm | có |
| D2 | `bang_chung_do.txt` (HỎNG/BẮT/SỐNG/LẠC của cả hai công cụ + mục 4–11); 32 tên `dot_bien.py` + 4 D2 ở mục "Tên đột biến" | có |
| D3 | `npm test` trên `decb701`: PASS 61 · FAIL 0 (nhưng sát hạn — lần người soát vòng 1 FAIL 1); `--day-du` ĐỎ (`thu_cong.js` ≥ 120 s, cả trên gốc); `git status` sạch sau mỗi lần chạy, thư mục tạm xoá cả khi ngắt / nạp hỏng; `git diff --stat 4d175bc..HEAD -- ':!viec/AUDIT-2/'` rỗng | **THIẾU — chờ chủ quán (Câu hỏi 1)** |
→ 11/12 mục có bằng chứng; D3 không đạt được trong Phạm vi (cần sửa ngoài `viec/AUDIT-2/` hoặc đo trên máy khác).

## Báo cáo 7 mục
```
VIỆC:        AUDIT-2 — Audit đợt 2: chạy lại lưới, phủ phần AUDIT-1 chưa kiểm, xem còn lỗ NẶNG không
ĐÃ SỬA:      không đổi code chạy thật (git diff 4d175bc..HEAD -- ':!viec/AUDIT-2/' rỗng). Thêm trong viec/AUDIT-2/: dot_bien_bb.py (B1,
             344 dòng), dot_bien.py (A3 + B3, bọc khung AUDIT-1, 95 dòng), kiem_neo.py (C1, 133 dòng), lach.js + lach.json (A3), bb_neo.json
             (ảnh neo), bảng a1/a2/a3/b2/b3, bao_cao.md (72 dòng), bang_chung_do.txt.
BÀI THỬ:     phiếu "Bài thử đỏ: không". Công cụ đo tự chứng minh (D2, bang_chung_do.txt): dot_bien_bb.py D2 → HỎNG · BẮT · SỐNG · LẠC;
             dot_bien.py D2K → HỎNG · BẮT · SỐNG; kiem_neo.py bản sao đổi neo / chữ / vế → thoát 1 (HỎNG, mẫu nghi rữa, tên trôi), chỉ dời
             dòng → thoát 0; lach.js đích sai → SAI MÃ; anh_kho bản sao: pyc mới / data/ / ghi đè → đổi. Kết quả chính: AU2-1 NẶNG-code
             (lấy vượt lượt gói — HTTP 200, đã biết, trúng P26c) · AU2-2 NẶNG-lưới (5 đột biến A3L SỐNG ở đường quầy) · AU2-11 chờ chủ quán.
ĐÃ RÀ K4:    soát 3 vòng bắt 21 lỗi cùng khuôn (số liệu / câu tổng sót ở file tóm tắt, phép tự so, đếm mục không neo, luật khác chặn hộ,
             bytecode + thư mục tạm); đã sửa hết trong phạm vi; grep "mọi … BẮT", "n/n", "LỌT 1", số dòng lần cuối sau vòng 3.
CHƯA KIỂM:   D3 — --day-du đỏ và npm test / pre-commit sát hạn vì tu_chay/thu_cong.js 119–126 s ≥ 120 s (cả trên gốc) — chờ chủ quán;
             bản sao máy mây KHÔNG cài hook pre-commit — các commit của việc này không qua tầng 3 (npm test chạy tay trước mỗi đợt);
             chưa chạy lại ĐỦ các bộ dài sau vòng sửa (A1 174, HOC-1/2, dot_bien_bb 148, dot_bien.py 32) — công cụ đo của chúng không đổi
             phần chấm từ lần chạy đủ, chỉ D2/D2K và mẫu chạy lại; ảnh bb_neo.json không chụp chuỗi thay — đổi luật sinh mà tên giữ
             nguyên thì không bị bắt; hai tên cùng chuỗi trong một bất biến đổi chỗ cho nhau có thể tráo tên lặng lẽ; phép "kho sạch" bỏ
             node_modules (symlink "chỉ đọc" không ép); khung AUDIT-1 dùng lại chỉ so git status + data/ + .vite; rà MẪU của kiem_neo.py
             theo TỪ ≥ 4 chữ cái (mẫu không có từ như "→ I8:" không được rà); "tầng 1 bắt 80 / tầng 2 bắt 20" đếm từ đầu ra, người soát
             chưa kiểm lại; 10 mục "cho" của lach.json không chứng minh luật CHO được xét tới; 4 ca KB17 không đột biến; AU2-11 cố ý hay
             không — câu hỏi nghiệp vụ; ba thư mục __pycache__ trong kho và ba /tmp/thu_cong_* / cong_* sót — máy không được xoá.
GIT:         decb701 AUDIT-2: sua theo ra-soat vong 3 — atexit don GOC_TAM, lach tat phai ra CHO, ca do anh_kho, so lieu / cau tong, AU2-10…
             59b2c36 AUDIT-2: ghi npm test tren a903c02
BÀI HỌC:     KHOÁ 4 (đề xuất — ngoài Phạm vi) · NGUYÊN TẮC 4 (đề xuất KHUON_LOI) · BỎ 2 — chi tiết ở ## Bài học dưới
```

## Bài học
Gom sự cố: người gác chặn 11 lệnh (B-CHUONGTRINH nproc/until/for, B-PHANTICH $((…))/${x%%…}/$'…', B-CD-VITRI ×3, B-CD, GIT-TUYCHON
--version, GIT-LENH init, B-BIMAT-CHU, B-MANOI ×5 — mã viết thẳng nhắc tên file bí mật / sổ việc / khung); 3 lỗi K3 tự bắt trong công cụ
(regex do_chia, luật bí danh I7, chọn chữ "React" để thử); 21 lỗi soát bắt qua 3 vòng; vượt ngân sách dot_bien_bb.py / kiem_neo.py (lý do
ghi); 3 câu hỏi chủ quán. Xếp:
- **KHOÁ (đề xuất, ngoài Phạm vi — chat soát duyệt):**
  1. `tu_chay/thu_cong.js` dọn thư mục tạm bằng `process.on('exit')` + móc SIGTERM; ca `thu_cong_cu.js` "SIGTERM giữa chừng → không sót
     /tmp/thu_cong_*" (đỏ trên gốc: sót). + `kiem_tra_truoc_khi_giao.js:549–553` bật `canhGan` cho bài thật tu_chay (đổi ca C3f `thu_gia_lap.js`).
  2. Công cụ đột biến dùng chung (khi dời `dot_bien_bb.py` về `cong_cu/gia_lap/`): ảnh neo so CHUỖI, "kho sạch" soi đường `.gitignore` che,
     `atexit` dọn thư mục tạm tạo lúc nạp, tắt bytecode — ca đỏ như `bang_chung_do.txt` mục 6, 8, 10, 11.
  3. Công cụ tự chứng minh phải thoát 0 trên HEAD — điều đã biết đánh dấu trong DỮ LIỆU (`biet_lot`), phép "tắt luật thì phải ra CHO";
     ca đỏ: đột biến LỌT / SAI MÃ đổi mã thoát (`lach.js` đã làm trong Phạm vi).
  4. Số tổng trong `bao_cao.md` / `trang_thai.md` sinh bằng máy từ `--json` của lần chạy (17/18, 7/6, 645/629 đều do gõ tay) — đề xuất
     `--tom-tat` in sẵn dòng tổng để chép, người soát so với `--json`.
- **NGUYÊN TẮC (đề xuất `KHUON_LOI.md` — phiếu cấm sửa ở việc này):**
  1. K1 — "đọc TÊN phép không phải đọc phép": D4 bundle tên "POS-ERRHANDLING-v1" mà tìm `sessionExpiredHandled` (soát kế hoạch bắt).
  2. K4 — đổi phân loại một tên (MA3, doi-soat-bo-tx) hoặc con số → grep tên đó + câu tổng quát ("mọi … vẫn BẮT", "n/n", "LỌT 1") +
     số mô tả chính file (wc -l) trong MỌI hồ sơ cùng commit (soát vòng 2, 3).
  3. K4 — một phép quá hạn ở `--day-du`: grep xem bước đó có chạy ở bản nhanh / pre-commit, và xét dọn dẹp khi bị giết (soát vòng 1, 3).
  4. K5 — "git status trước/sau" mù với file bị `.gitignore` che (bytecode, data/) và với thư mục tạm của tiến trình con bị giết; nạp
     module bằng importlib → `sys.dont_write_bytecode` (soát vòng 1, 2).
- **BỎ:**
  1. Lỗi chọn chữ "React" khi thử mẫu rữa (chữ nằm trong chuỗi đột biến chèn) — một lần, đã ghi ở `bang_chung_do.txt` mục 4.
  2. Ghi số dòng `a3_bang.md` theo trí nhớ — đã thuộc K1 sẵn có; một lần.
Dọn: không đề xuất xoá lời dặn nào (không có phép mới thay được lời dặn hiện có trong `KHUON_LOI.md` / `CLAUDE.md`).
HEAD ĐÃ KIỂM: decb701
