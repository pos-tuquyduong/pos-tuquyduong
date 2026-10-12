# AUDIT-2 — Audit đợt 2: chạy lại lưới, phủ phần AUDIT-1 chưa kiểm, xem còn lỗ NẶNG không

<!-- Phiếu do chat soạn 12.10.2026. Nền: main sau sổ việc v27 (cha 6c281f5 = Merge PR #14 TU-CHAY-5, tu-chay 1.5.0).
     Chạy SONG SONG P26c: việc này CHỈ KIỂM + BÁO CÁO trong viec/AUDIT-2/, không sửa file nào khác. Nguồn: viec/AUDIT-1/
     (phieu.md định nghĩa, bao_cao.md, dot_bien.py), viec/HOC-2b/trang_thai.md mục D5 (danh sách chuyển sang),
     viec/LUOI-1/trang_thai.md mục C2 (23 C2F còn SỐNG), viec/TU-CHAY-5/phieu.md nhóm A + D5 + D6 (dời sang đây 11.10),
     viec/TU-CHAY-5/trang_thai.md ## Phát hiện (6). -->

**Chờ duyệt kế hoạch:** viết `viec/AUDIT-2/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.
(Giữ bước duyệt tới khi P26c gộp — luật chốt 11.10.)

## Mục tiêu
Kiểm ĐỘC LẬP lưới có bắt lỗi tiền không (cố tình làm hỏng code tiền trên bản sao, xem bài thử / giả lập có kêu) — bằng chứng
để tin máy tự chạy. Đạt khi không còn lỗi NẶNG; điểm dừng chương trình audit: HAI đợt liên tiếp không NẶNG. Lộ NẶNG → việc sửa
riêng + AUDIT-3 (trúng chỗ P26c đang sửa → ghi rõ để gộp vào P26c). Đích: báo cáo xong 14.10 — không cắt chất lượng để kịp.
Định nghĩa BẮT / SỐNG / HỎNG / LẠC / NẶNG / NHẸ: như `viec/AUDIT-1/phieu.md`.

## Nghiệm thu
- A1 Chạy lại ĐỦ `viec/AUDIT-1/dot_bien.py` trên HEAD (kể cả nhóm G3 — chạy không tham số bỏ G3) + danh sách chuyển từ HOC-2b
  D5 (3) (71 AUDIT-1 + 14 HOC-1 + 23 HOC-2). Bảng BẮT/SỐNG/HỎNG/LẠC từng tên; khác lần chạy trước → giải thích.
- A2 23 C2F còn SỐNG sau LUOI-1: mỗi cái xếp NẶNG / NHẸ theo middleware + thân hàm (như AUDIT-1 C2), NẶNG → đề xuất KB / ca.
- A3 Phần AUDIT-1 CHƯA KIỂM: bundle D2–D5; logic loyalty / gói; 30 mã người gác chưa có ca lách — chỉ đối chiếu luật với ca thử
  có sẵn, lệnh lách TỐI THIỂU, chỉ dạng dữ liệu JSON vào bản sao người gác (không viết lệnh lách hàng loạt, không chạy thật).
- B1 (TU-CHAY-5 A1, dời) `viec/AUDIT-2/dot_bien_bb.py` tự sinh đột biến từ `cong_cu/gia_lap/bat_bien.js`: bỏ từng vế `||`/`&&`
  (JS) và `OR`/`AND` (SQL), mỗi phép so bằng / khác trên tiền, số lượng, điểm → hai đột biến MỘT CHIỀU. Tên tất định + dòng; chạy
  trên bản sao; BẮT chỉ khi đỏ đúng bất biến đó (sập / cú pháp = LẠC); có `-j N`, `--chi`, `--liet-ke`.
- B2 (TU-CHAY-5 A2) Chạy đủ; mỗi SỐNG xếp một loại: (a) cần thêm ca dữ liệu tay (đề xuất ca, so bằng tiền đủ +1 và −1);
  (b) vế THỪA (dẫn code thật + ca chứng minh); (c) code quầy đang SAI → NẶNG. KHÔNG sửa `bat_bien.js` / `thu_gia_lap.js`.
- B3 (TU-CHAY-5 A3) Liệt kê MỌI ca chồng nhau trong `kich_ban.js`; mỗi ca ghép một đột biến BỎ KHOÁ trên bản sao `server/`
  (đã có ở `viec/*/dot_bien.py` thì dẫn tên, chưa có thì thêm vào `viec/AUDIT-2/dot_bien.py`). SỐNG → phát hiện kèm đột biến.
- B4 (TU-CHAY-5 A4) Đề xuất câu cho `tu_chay/skill_lam_viec.md` bước 4 + `tu_chay/lenh_ra_soat.md`: việc đổi `bat_bien.js` phải
  chạy `dot_bien_bb.py` đủ — chỉ ghi đề xuất, không sửa.
- C1 (TU-CHAY-5 D5 + Phát hiện 6) `viec/AUDIT-2/kiem_neo.py` (mở rộng từ `viec/HOC-2b/kiem_neo.py`): rà neo + mẫu nhận kết quả của
  MỌI `viec/*/dot_bien.py` và `viec/*/do_*.js` có bảng neo; BẮT BUỘC chạy, kết quả vào `trang_thai.md`; rữa cố ý đánh dấu (vd
  `G3-sai-chuoi`; `VS-E3-phien-ban-cu` của HOC-2 rữa vì 1.4.0 → 1.5.0 — đề xuất đổi neo, không sửa file HOC-2).
- C2 (TU-CHAY-5 D6) Bản sao CẢ KHO bằng `git archive` — chỉ làm (trong `viec/AUDIT-2/`) nếu công cụ của việc này cần; không thì
  ghi đề xuất.
- D1 `viec/AUDIT-2/bao_cao.md`: bảng phát hiện `AU2-<n>` · NẶNG/NHẸ · file:dòng ở HEAD · lệnh chạy lại · đề xuất khoá (file, ca
  đỏ nào) · "trúng chỗ P26c" nếu là file / đường P26c sửa. Cuối bảng: tỷ lệ BẮT/SỐNG/HỎNG theo nhóm. Ngắn gọn (≤ 200 dòng; chi
  tiết để file phụ).
- D2 Công cụ đo không nói dối: một đột biến cố ý sai chuỗi → HỎNG; một đã biết → BẮT; một vô hại → SỐNG — lưu
  `bang_chung_do.txt`. Mỗi tên đột biến trong `viec/AUDIT-2/dot_bien.py` có trong `trang_thai.md`.
- D3 `npm test` + `node kiem_tra_truoc_khi_giao.js --day-du` vẫn xanh; `git status` sạch sau mỗi lần chạy công cụ (thư mục tạm
  xoá kể cả khi bị ngắt). Không đổi một byte ngoài `viec/AUDIT-2/`.

Làm theo nhóm A → B → C → D; mỗi nhóm xong thì commit + push, `trang_thai.md` ghi nhóm nào xong (hết hạn mức giữa chừng thì
`/lam-viec AUDIT-2 tiep`). Chạy nặng tuần tự, đo RIÊNG.

## Phạm vi
- viec/AUDIT-2/**

## Bài thử đỏ
không — việc chỉ kiểm + báo cáo, không đổi code; công cụ đo tự chứng minh bằng D2 (bang_chung_do.txt)

## Ngân sách
`dot_bien_bb.py` ~150–250 dòng; `dot_bien.py` chỉ phần B3 mới; `kiem_neo.py` ~+40 so bản HOC-2b; `bao_cao.md` ≤ 200 dòng.
Kế hoạch ước lượng thời gian máy từng nhóm (đo, không đoán); tổng > 180 phút → nêu cách cắt hợp lý trong `## Câu hỏi`.
**Phương án đơn giản nhất đã xét:** dùng lại công cụ có sẵn (`viec/AUDIT-1/dot_bien.py`, `viec/HOC-2b/kiem_neo.py`) — chỉ viết mới
`dot_bien_bb.py` (chưa có công cụ nào sinh đột biến từ `bat_bien.js`). Không dựng khung đo mới.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa file nào ngoài `viec/AUDIT-2/` — kể cả lỗi thấy rõ: ghi phát hiện + đề xuất. Không sửa `KHUON_LOI.md`; bài học ghi
  trong `trang_thai.md` dạng đề xuất.
- Đột biến chỉ trên bản sao trong thư mục tạm; không đụng `server/` thật, `data/`, `.claude/`, `.github/`, Turso, production.
- Lệnh "cố tình lách" chỉ là dữ liệu đưa vào bản sao người gác; không chạy thật, không thử lách người gác đang gác phiên này.
- Không gọi GitHub API; chỉ `git` với kho. Chỉ push đúng `git push -u origin viec/AUDIT-2`. Không đụng `main`, không merge,
  không tạo PR.
