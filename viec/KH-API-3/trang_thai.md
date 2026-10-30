# KH-API-3 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: `viec/KH-API-3`; cây sạch. HEAD `55a8f29` · FETCH_HEAD `55a8f29` (bằng nhau — không kéo).
- `git log --oneline -3`:
  - 55a8f29 PHIEU: KH-API-3
  - 7a3930f TIEN-DO: KH-API-2 (6f2c30b) xong; mo KH-API-3; them KHACH-CK-1; quyet dinh 29-30.10; luat noi de hieu + duyet 2 luot; tu-chay 1.8.1 (KHUNG-KEO-1) — so v47
  - 6f2c30b Merge pull request #51 from pos-tuquyduong/viec/KH-API-2
- Phiên tiếp (sau duyệt): HEAD `236b3dc` = FETCH_HEAD `236b3dc` — không kéo.

## Tiến độ
- Bước 3: kế hoạch duyệt 30.10 (chủ quán: câu 1 đồng ý thêm `thu_KHUI1.js`, `thu_P15QR.js` vào Phạm vi; câu 2 xưng hô bắt buộc với khách mới;
  câu 3 một địa chỉ chung quầy ↔ App).
- Bước 4–6: bài thử đỏ trên gốc (`bang_chung_do.txt`), code vá, `thu_KHAPI3.js` 58/58, `thu_KH1.js` 157/157, `thu_HOPDONG_KH.js` 67/67,
  đột biến 28/28 BẮT. `npm test` / `--day-du`: xanh trừ `cong_cu/thu_KHO1.js` (ngoài Phạm vi — Câu hỏi 1).

## Chỗ vá → đột biến (`viec/KH-API-3/dot_bien.py`)
| Chỗ vá | Đột biến |
|---|---|
| `/menu` đứng trước xacThucKhach với `tuyChonKhach` | BV-MENU-BAT-DANG-NHAP, VS-MENU-NUOT-MA-SAI |
| giới hạn menu không token (`giuLuotMenu`, `giuLuotBoNho`) | BV-MENU-GIOI-HAN, VS-MENU-TRAN-301, VS-MENU-DEM-CA-CO-DANG-NHAP, VS-CUA-SO-LECH, VS-TRAN-LECH |
| CAN_TEN khi thiếu xưng hô | BV-XUNG-HO-CAN-TEN |
| `chuanXungHo` / `XUNG_HO` | VS-XUNG-HO-LA, VS-XUNG-HO-THIEU-BAN |
| `chuanDiaChi` | VS-DIA-CHI-300, VS-DIA-CHI-KHONG-CAT, VS-PUT-DIA-CHI-KHONG-XOA |
| INSERT khách lưu xưng hô + địa chỉ | BV-INSERT-XUNG-HO |
| mã sống thêm 10 phút một lần khi CAN_TEN | BV-GIA-HAN-MA, VS-GIA-HAN-11-PHUT, VS-GIA-HAN-MA-MAI |
| chỉ kiểm thông tin khi tạo khách mới | VS-KIEM-CA-KHACH-CU |
| `PUT /toi` ba trường | VS-PUT-RONG, VS-PUT-XUNG-HO-RONG-XOA |
| `hoSo` thêm trường | BV-HOSO-XUNG-HO |
| bước nâng cấp 003 | BV-NANG-CAP-003 |
| `POST /gia-han` + trần | BV-GIA-HAN-TRAN, VS-GIA-HAN-UTC, VS-GIA-HAN-BANG-LAN-THU |
| hợp đồng v3 + bài thử hợp đồng | BV-HOPDONG-TUY-CHON, VS-HOPDONG-GIA-TRI-LA, BV-HOPDONG-GIA-HAN |

Mọi tên đột biến: BV-MENU-BAT-DANG-NHAP · VS-MENU-NUOT-MA-SAI · BV-MENU-GIOI-HAN · VS-MENU-TRAN-301 · VS-MENU-DEM-CA-CO-DANG-NHAP · VS-CUA-SO-LECH ·
VS-TRAN-LECH · BV-XUNG-HO-CAN-TEN · VS-XUNG-HO-LA · VS-XUNG-HO-THIEU-BAN · VS-DIA-CHI-300 · VS-DIA-CHI-KHONG-CAT · BV-INSERT-XUNG-HO · BV-GIA-HAN-MA ·
VS-GIA-HAN-11-PHUT · VS-GIA-HAN-MA-MAI · VS-KIEM-CA-KHACH-CU · VS-PUT-RONG · VS-PUT-DIA-CHI-KHONG-XOA · VS-PUT-XUNG-HO-RONG-XOA · BV-HOSO-XUNG-HO ·
BV-NANG-CAP-003 · BV-GIA-HAN-TRAN · VS-GIA-HAN-UTC · VS-GIA-HAN-BANG-LAN-THU · BV-HOPDONG-TUY-CHON · VS-HOPDONG-GIA-TRI-LA · BV-HOPDONG-GIA-HAN

Lần chạy đầu: 27/28 BẮT — VS-KIEM-CA-KHACH-CU SỐNG vì chính đột biến viết sai (vẫn giữ `if (sai) return sai;` trong khối khách mới → hành vi
không đổi). Sửa đột biến (83b28af) → BẮT. Không đổi bài thử.

## Câu hỏi (chờ chủ quán — người gác chặn sửa file ngoài Phạm vi và chặn sửa phiếu, `G5-NGOAIPV` / `G1-PHIEU`)
Chủ quán đã duyệt thêm hai file vào Phạm vi nhưng phiếu chưa ghi, nên máy không sửa được. Nhờ chat sửa `viec/KH-API-3/phieu.md`:
1. Thêm vào `## Phạm vi`:
   - `cong_cu/thu_KHUI1.js` (đã duyệt — ca H3 "menu không token → 401" thành "/toi không token → 401" + "menu không token → 200")
   - `cong_cu/thu_P15QR.js` (đã duyệt — ca A6 tạo khách mới qua App gửi thêm `xung_ho`)
   - **`cong_cu/thu_KHO1.js` (MỚI phát hiện)** — ca B1 / B2 khoá ĐÚNG danh sách bước nâng cấp (`nc1.length === 1`, `dem('pos_nang_cap') === 1`,
     dòng 246, 248). Bước 003 của việc này làm hai ca đỏ, và bài này nằm trong `npm test` → bộ kiểm + cổng đỏ tới khi sửa. Sửa đúng hai dòng
     danh sách (LUAT §6 mục 7): bước 1 = `001_kho` VÀ có bước 3 = `003_xung_ho_khach`, số dòng = 2 (vẫn so BẰNG). KHO-2a (bước 002) sẽ gặp
     đúng chỗ này.
2. Thêm mục:
   ```
   ## Bài thử cũ sửa
   - cong_cu/thu_HOPDONG_KH.js — hiểu token "tuy_chon" + xác minh gửi xung_ho; xanh trên gốc vì hợp đồng v2 không có cửa tuy_chon
   - cong_cu/thu_KHUI1.js — ca H3 đổi theo hành vi /menu mới (chủ quán duyệt 30.10)
   - cong_cu/thu_P15QR.js — khách mới qua App gửi thêm xung_ho (chủ quán duyệt 30.10)
   ```
   (`thu_HOPDONG_KH.js` chạy trên gốc 64 đạt · 0 hỏng — cổng A11 cần dòng này.)
Sửa phiếu xong → `/lam-viec KH-API-3 tiep`: máy sửa ba bài, ghi `SỐ CA`, chạy lại bộ kiểm + cổng.

## Phát hiện
- `cong_cu/thu_KHUI1.js`, `cong_cu/thu_P15QR.js` không nằm trong danh sách chạy `kiem_tra_truoc_khi_giao.js:495`.
- `/api/kh/hang`, `/gio-vang`, `/gio-hoat-dong` mở không token, không giới hạn lượt (`server/routes/kh/index.js`) — phiếu không giao.
- Số tầng proxy Render chưa kiểm (`server/index.js:55`) — giới hạn theo IP của `/menu` phụ thuộc điều này.
- `cong_cu/thu_KHO1.js:246,248` khoá cứng "chỉ có bước 1" — mọi bước nâng cấp mới (KHO-2a 002, việc này 003) đều làm nó đỏ.
