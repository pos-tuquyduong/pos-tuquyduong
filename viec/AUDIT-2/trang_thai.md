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
- [ ] Nhóm C · [ ] Nhóm D

## Số đo lúc lập kế hoạch
Xem `ke_hoach.md` mục 0 (đo riêng trong lượt này, máy mây 4 lõi).

## Kết quả nhóm A, B (chạy RIÊNG, tuần tự; sau mỗi lần `git status` sạch, 0 thư mục tạm sót)
| lệnh | thời gian | kết quả |
|---|---|---|
| `python3 viec/AUDIT-1/dot_bien.py G3 A3 B1 C2 D1 C2F -j 3` | 1992 s | 174: G3 1/1/1/1 (cố ý) · A3 16 BẮT · B1 8 · C2 3 · C2F 62 BẮT · 23 SỐNG · 1 LẠC · D1 55 · 2 LẠC — y như lần trước |
| `python3 viec/HOC-1/dot_bien.py` | 1510 s | 3 đối chứng XANH · 17/17 ĐỎ đúng chỗ (MA3 đỏ vì cổng sập — AU2-5) |
| `python3 viec/HOC-2/dot_bien.py` | 1906 s | 3 đối chứng XANH · 22/22 ĐỎ đúng chỗ · `VS-E3-phien-ban-cu` LỖI (neo 1.4.0 — AU2-6) |
| `python3 viec/AUDIT-2/dot_bien.py -j 3` | 486 s | 32: D2K HỎNG/BẮT/SỐNG · A3B 4/4 BẮT · A3L 9 BẮT 8 SỐNG · A3P BẮT (code sai) · B3 4 BẮT 2 SỐNG |
| `node viec/AUDIT-2/lach.js` | <1 s | 14/15 CHẶN · 1 LỌT (CC-DOC đọc file bí mật bằng Read — thiết kế đã ghi) |
| `python3 viec/AUDIT-2/dot_bien_bb.py -j 4` | 591 s | 146: BB 94 BẮT · 48 SỐNG; D2 HỎNG · BẮT · SỐNG · LẠC |
| `python3 viec/AUDIT-2/dot_bien_bb.py --chi BB-I7-js --chi D2- -j 4` (sau sửa bộ sinh) | 64 s | 6/6 BẮT; D2 lại đúng 4 trạng thái |
| `python3 viec/P26b/dot_bien.py <18 tên B3>` | — | 18/18 bị bắt |
| `python3 viec/LUOI-1/dot_bien.py VS-SRV-bo-khoa-dangChay` | 43 s | BẮT (đúng mong đợi 1/1) |

## Tên đột biến — `viec/AUDIT-2/dot_bien.py` (32, viết tay) và D2 của `dot_bien_bb.py` (4, viết tay)
`D2K-sai-chuoi`, `D2K-da-biet`, `D2K-vo-hai`, `A3B-D2-bundle-dev`, `A3B-D3-index-tro-sai`, `A3B-D4-bo-dau-vet`, `A3B-D5-src-chua-build`, `A3L-redeem-thieu-1-diem`, `A3L-redeem-bo-chan-diem`, `A3L-redeem-bo-han-diem`, `A3L-redeem-tru-them-1`, `A3L-redeem-ma-dung-2-lan`, `A3L-earn-lam-tron-len`, `A3L-earn-flash-van-cong`, `A3L-nhandiem-cong-doi`, `A3L-nhandiem-he-so-mac-dinh`, `A3L-goi-bo-kiem-chu`, `A3L-goi-bo-kiem-trang-thai`, `A3L-goi-bo-kiem-con-lai`, `A3L-goi-giao-them-1`, `A3L-goi-lay-ngay-them-1`, `A3L-goi-huy-lay-khong-tra-luot`, `A3L-goi-xoa-lay-khong-tra-luot`, `A3L-goi-huy-dem-ca-mon-tra-tien`, `A3L-deliver-bo-chan-am`, `A3P-goi-lay-vuot-luot`, `BK-KB10-thu-bo-changes`, `BK-KB11-claim-bo-chiem`, `BK-KB11-nhandiem-bo-chiem`, `BK-KB16-duyet-bo-cong-don`, `BK-KB20-bo-kiem-lai-ma`, `BK-KB21-huy-goi-bo-changes`.
D2 của `dot_bien_bb.py`: `D2-sai-chuoi`, `D2-da-biet`, `D2-vo-hai`, `D2-sap`. Đột biến `BB-I<n>-…` do `dot_bien_bb.py` SINH (tất định, liệt kê
bằng `--liet-ke`, 148 tên) — SỐNG ghi đủ trong `b2_bang.md`.

## Câu hỏi
(không có — lời duyệt 12.10 đã chốt 3 điểm mục 7)

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
(chưa có — việc chưa chạy đo)
