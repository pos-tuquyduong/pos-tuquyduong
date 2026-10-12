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
- [~] Nhóm D (D1 `bao_cao.md` 62 dòng · D2 `bang_chung_do.txt` · D3: `npm test` và `--day-du` đều vướng `thu_cong.js` sát/quá hạn 120 s — cả trên gốc, xem Câu hỏi 1)

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
| `python3 viec/P26b/dot_bien.py <18 tên B3>` | — | 18/18 bị bắt |
| `python3 viec/LUOI-1/dot_bien.py VS-SRV-bo-khoa-dangChay` | 43 s | BẮT (đúng mong đợi 1/1) |

## Tên đột biến — `viec/AUDIT-2/dot_bien.py` (32, viết tay) và D2 của `dot_bien_bb.py` (4, viết tay)
`D2K-sai-chuoi`, `D2K-da-biet`, `D2K-vo-hai`, `A3B-D2-bundle-dev`, `A3B-D3-index-tro-sai`, `A3B-D4-bo-dau-vet`, `A3B-D5-src-chua-build`, `A3L-redeem-thieu-1-diem`, `A3L-redeem-bo-chan-diem`, `A3L-redeem-bo-han-diem`, `A3L-redeem-tru-them-1`, `A3L-redeem-ma-dung-2-lan`, `A3L-earn-lam-tron-len`, `A3L-earn-flash-van-cong`, `A3L-nhandiem-cong-doi`, `A3L-nhandiem-he-so-mac-dinh`, `A3L-goi-bo-kiem-chu`, `A3L-goi-bo-kiem-trang-thai`, `A3L-goi-bo-kiem-con-lai`, `A3L-goi-giao-them-1`, `A3L-goi-lay-ngay-them-1`, `A3L-goi-huy-lay-khong-tra-luot`, `A3L-goi-xoa-lay-khong-tra-luot`, `A3L-goi-huy-dem-ca-mon-tra-tien`, `A3L-deliver-bo-chan-am`, `A3P-goi-lay-vuot-luot`, `BK-KB10-thu-bo-changes`, `BK-KB11-claim-bo-chiem`, `BK-KB11-nhandiem-bo-chiem`, `BK-KB16-duyet-bo-cong-don`, `BK-KB20-bo-kiem-lai-ma`, `BK-KB21-huy-goi-bo-changes`.
D2 của `dot_bien_bb.py`: `D2-sai-chuoi`, `D2-da-biet`, `D2-vo-hai`, `D2-sap`. Đột biến `BB-I<n>-…` do `dot_bien_bb.py` SINH (tất định, liệt kê
bằng `--liet-ke`, 148 tên) — SỐNG ghi đủ trong `b2_bang.md`.

## Kết quả nhóm C, D
| lệnh | kết quả |
|---|---|
| `python3 viec/AUDIT-2/kiem_neo.py` (HEAD) | thoát 0 — AUDIT-1 173/174, P26b 59/59, HOC-1 20/20, HOC-2 25/26, TU-CHAY-4 10/10, HOC-2b 26/26, LUOI-1 80/80, TACH-GL 29/29, TU-CHAY-5 34/34, AUDIT-2 31/32, AUDIT-2 bb 151/152 (bản sửa vòng 1: so với ảnh `bb_neo.json`), do_*.js 6/6 (`do_cpu.js` không có bảng — không tính); HỎNG chỉ 4 rữa cố ý (`G3-sai-chuoi`, `VS-E3-phien-ban-cu`, `D2K-sai-chuoi`, `D2-sai-chuoi`); mẫu nghi rữa 0 |
| `kiem_neo.py` trên bản sao kho đổi neo + đổi chữ | thoát 1 — 2 HỎNG + 2 mẫu nghi rữa (`bang_chung_do.txt` mục 4) |
| `npm test` | lần của tôi: thoát 0 · ĐẾM PASS 61 · FAIL 0 · CẢNH BÁO 0; lần người soát: PASS 60 · FAIL 1 (`thu_cong.js` 120.1 s ETIMEDOUT) — sát hạn, đỏ ngẫu nhiên |
| `node kiem_tra_truoc_khi_giao.js --day-du` | thoát 1 · ĐẾM PASS 64 · FAIL 1 · CẢNH BÁO 0 — FAIL duy nhất: `bài chạy thật tu_chay/thu_cong.js xanh (120.1 s) → spawnSync … ETIMEDOUT` |
| `node tu_chay/thu_cong.js` riêng ×3 | 120 s (HEAD) · 126 s (gốc `4d175bc`, git archive vào nháp) · 121 s (HEAD) — 318 phép · 0 chỗ hỏng; 11.10 TU-CHAY-5 đo 94,8 s |
| ngắt SIGINT `dot_bien_bb.py` (20 s), `dot_bien.py` (3 s) | 0 thư mục tạm sót, `git status` sạch |
| `git diff --stat 4d175bc..HEAD -- ':!viec/AUDIT-2/'` | rỗng |

## Câu hỏi
1. **D3 không xanh được ổn định trên máy mây hôm nay, cả trên gốc `4d175bc`:** `tu_chay/thu_cong.js` chạy RIÊNG 119–126 s (4 lần) ≥ hạn
   120 s của bộ kiểm (`kiem_tra_truoc_khi_giao.js:478`) → FAIL "ETIMEDOUT". Bộ kiểm chạy nó ở CẢ bản nhanh (`:553`) ⇒ `npm test` và hook
   pre-commit cũng đỏ ngẫu nhiên (soát vòng 1 bắt — tôi đã khoanh nhầm chỉ `--day-du`). Không do việc này (gốc không có file AUDIT-2 vẫn 126 s); sửa nằm ngoài Phạm vi và luật cấm nới
   hạn. Xin chủ quán chọn: (a) chạy `--day-du` trên máy chủ quán / check GitHub để xem có phải chỉ máy mây chậm; (b) mở việc chia
   `thu_cong.js` thành lượt song song (khuôn TACH-GL) trước P26c — P26c sẽ vướng cùng phép. Ghi AU2-10.
2. **Số lượt gói do quầy gõ tay có CỐ Ý không?** `orders.js:968` lưu `package_buy.total_qty` client gửi, giá vẫn là giá gói (`:374`); màn
   Bán hàng có ô "SL SP" sửa tay (`Sales.jsx:1225–1232`). Không cố ý → NẶNG-code (bán gói N lượt giá cố định mà ghi M lượt), đưa vào P26c;
   cố ý → cần luật + quy tắc đối soát. Máy không tự xếp (câu hỏi nghiệp vụ). Ghi AU2-11.
3. Hai thư mục bytecode `viec/AUDIT-1/__pycache__/`, `viec/AUDIT-2/__pycache__/` do công cụ của việc này đẻ ra (`.gitignore` che); người gác
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
  `do_chia.js` (mảng xuống dòng) mà vẫn in "không có bảng neo" → sửa, in số neo từng file (7 neo, `do_cpu.js` không có bảng). (2) `dot_bien_bb.py`
  luật "bỏ bí danh bảng" áp cả JS → loại nhầm `dem.get(vt) !== 1`, `soNo.get(vt) !== 1`… (6 đột biến I7) → luật bí danh chỉ cho SQL, JS
  chỉ bỏ tên một chữ cái trước `.`; chạy lại 6 đột biến mới (6/6 BẮT), 142 tên cũ không đổi.
- Ghi số dòng `a3_bang.md` theo trí nhớ → 7 chỗ lệch 1–2 dòng; script so từng dòng bắt được, đã sửa (K1).

## Phát hiện
Bảng đủ ở `bao_cao.md` (AU2-1 … AU2-10). Tóm tắt: **AU2-1 NẶNG-code** lấy vượt lượt gói (đã biết LUOI-1 Phát hiện 5, nay có bằng chứng
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
| nghi 2 B3 4 ca KB17 | giữ lý do (route không đọc gì ngoài giao dịch — không có khoá riêng để bỏ; phiếu B3 cho phép "ghi lý do"); tóm tắt `bao_cao.md` nêu rõ 4 dòng; đếm dẫn 20 |
| nghi 3 docstring tầng 2 | sửa docstring: tầng 2 chạy khi tầng 1 CHƯA BẮT |

**Ngân sách (lỗi 8):** `dot_bien_bb.py` 334 dòng (ngân sách 150–250): bộ quét phải tự tách JS / chuỗi SQL / `${}` / chú thích, dò biên vế
theo ngoặc cho cả JS và SQL (~120 dòng) — phiếu cấm thư viện mới nên không dùng trình phân tích có sẵn; phần chạy (bản sao, hai tầng, kiểm
sạch, tín hiệu, `--json`) ~90 dòng; D2 + liệt kê ~40. `kiem_neo.py` 128 dòng (+72 so bản HOC-2b): thêm 4 bộ mới, rà MẪU, neo `do_*.js`, so ảnh
`bb_neo.json` — mỗi phần là một mục nghiệm thu C1. Không tách được mà không bỏ mục.
