# AUDIT-1 — Nhóm E · Hồ sơ các việc đã gộp

HEAD b9759cf, đo 04.10.2026. Chạy lại mọi `viec/*/dot_bien.py` trên main hôm nay.

## E1 — chạy lại đột biến cũ

| việc | lệnh | kết quả |
|---|---|---|
| P26b | `python3 viec/P26b/dot_bien.py` | 60 đột biến: **59 BẮT · 1 HỎNG (`I10-bo`)** |
| HOC-1 | `python3 viec/HOC-1/dot_bien.py` | ~18: M0×3 XANH đối chứng, phần còn ĐỎ đúng chỗ, **2 HỎNG (`MB`, `MB4`)** |
| TU-CHAY-4 | `python3 viec/TU-CHAY-4/dot_bien.py M0 E4` (chỉ `gl`) | 8/8 ĐỎ đúng chỗ / XANH. `tai_cho` (F2, S3) **KHÔNG chạy** — xem AU-E3 |
| P26a, TU-CHAY-1/2/3 | — | không có `dot_bien.py` (ghi "không có") |

- **AU-E1 (NHẸ, đã biết trong kế hoạch):** P26b `I10-bo` HỎNG — chuỗi `return ds.filter((r) => so(r.hoan) > so(r.tra) +
  0.5)` khớp **2 lần** (I10 và I11 cùng dòng, `bat_bien.js`) nên không áp được. Hồ sơ P26b ghi nó "đạt". Đây đúng khuôn
  P26b từng mắc (bằng chứng đỏ lệch số ca). Đề xuất HOC-2: neo `I10-bo` theo WHERE riêng của I10, hoặc bỏ I10 (I11 bao
  trùm — xem AU-C1).
- **AU-E2 (NHẸ, MỚI):** HOC-1 `MB` + `MB4` HỎNG — chuỗi `, "package.json"]` không còn trong `cau_hinh.json` vì
  `file_luat` đã MỌC THÊM sau `package.json` (`"cong_cu/gia_lap/**"`, `"cong_cu/thu_gia_lap.js"` do TU-CHAY-4 F3). Hai
  đột biến này giờ không áp được → không còn canh gì. Đề xuất HOC-2: neo theo `"package.json"` (không kèm `]`).
- **AU-E3 (NHẸ, MỚI, cấu trúc):** `viec/TU-CHAY-4/dot_bien.py` có 2 đột biến kiểu `tai_cho` (F2, S3) SỬA THẲNG file thật
  (`cong_cu/gia_lap/kich_ban.js`, `bat_bien.js`) rồi chép lại (`:32-36`). Ngắt giữa chừng = kho BẨN (dù có `assert` trả
  lại từng byte trong `finally`). AUDIT-1 KHÔNG chạy chúng (phạm "không đổi byte ngoài viec/AUDIT-1/"). Đề xuất HOC-2:
  đổi `tai_cho` sang BẢN SAO kho như P26b/AUDIT-1 làm, để không bao giờ đụng file thật.

## E2 — bằng chứng cũ khớp bài thử hiện tại?

- Tên đột biến truy được: P26b (`I10-bo`, `me-tao-don-khong-tru`, `Q9-bo-hoan-me`, `packages-buy-dung-lai`…), HOC-1
  (`MB`, `MB4`…), TU-CHAY-4 (`E4a`–`E4g`, `S3`) đều CÓ trong `trang_thai.md` của việc đó. Không tên đột biến "mồ côi".
- `bang_chung_do.txt`: HOC-1 98 dòng, TU-CHAY-4 23, P26b 154 — là bản ghi lúc làm việc đó. KHÔNG đối chiếu lại số ca
  từng dòng với bài thử hiện tại (CHƯA KIỂM — tốn, và E1 đã đo lại kết quả thực tế quan trọng hơn số ca cũ).
- Lệch THỰC CHẤT không ở TÊN mà ở KẾT QUẢ: ba đột biến (`I10-bo`, `MB`, `MB4`) hồ sơ coi là đạt nay HỎNG trên HEAD —
  đúng điều AUDIT-1 sinh ra để bắt: hồ sơ "đạt" không bằng đột biến áp được hôm nay.


## E2b — số ca `bang_chung_do.txt` cũ vs bài thử hiện tại (đo 04.10.2026)

| việc | bang_chung_do ghi | hiện tại | lệch? |
|---|---|---|---|
| HOC-1 | `thu_nguoi_gac: 780/782 ca`, `thu_cong: 187 phép`, `thu_cong_cu: 74 phép` | `thu_nguoi_gac 786/786`, `thu_cong_cu 165 phép khác` | CÓ — tăng theo thời gian |
| TU-CHAY-4 | `thu_nguoi_gac: 784/786 ca` | `786/786` | CÓ |
| P26b | `thu_P26b 63 ca · giả lập 18 KB · 11 bất biến` | giả lập 18 KB · 11 bất biến (khớp); thu_P26b ca chưa đếm lại | phần KB/bất biến KHỚP |

Kết luận E2: `bang_chung_do.txt` là ẢNH CHỤP lúc làm việc đó, KHÔNG tự kiểm lại — số ca người gác đã trôi (782→786).
Đây đúng luận điểm AUDIT: không tin con số cũ, phải chạy lại trên HEAD (E1 đã làm, bắt I10-bo/MB/MB4 HỎNG). Tên đột
biến trong `dot_bien.py` cũ đều có trong `trang_thai.md` của việc đó (đã kiểm ở E2 trên) — lệch nằm ở KẾT QUẢ, không ở tên.
