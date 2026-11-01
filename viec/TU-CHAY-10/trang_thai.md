# TU-CHAY-10 — trạng thái

## Bước 1 — đối chiếu bản chụp (01.11.2026)
- Nhánh: `viec/TU-CHAY-10`; `git status --short` sạch.
- `git fetch origin viec/TU-CHAY-10` xong. HEAD = `abed525`, FETCH_HEAD = `abed525` → bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  abed525 PHIEU: TU-CHAY-10
  aed6128 TIEN-DO: SAOLUU-2 (c8284ad) xong; mo TU-CHAY-10 (soat bao mat tu dong, tu-chay 1.9.0); quyet dinh 31.10 (soat bao mat tu dong, khong cai Superpowers) — so v52
  c8284ad Merge pull request #61 from pos-tuquyduong/viec/SAOLUU-2
  ```
- Có commit `PHIEU: TU-CHAY-10` (`abed525`).

## Bước 3 — kế hoạch
- `viec/TU-CHAY-10/ke_hoach.md` đã viết. Phiếu dặn **Chờ duyệt kế hoạch** → commit, push, DỪNG.

## Sự cố trong phiên
- Người gác chặn `curl` tới raw.githubusercontent.com (`[CURL-HOST]`, đúng luật) và một lệnh `cd <scratchpad> ... ;` (`[B-CD-VITRI]`).
  Lấy bản gốc lời nhắc /security-review bằng agent web-fetch (WebFetch người gác cho qua): 192 dòng, giấy phép MIT "Copyright (c) 2025 Anthropic".

## Câu hỏi (01.11 — ĐÃ TRẢ LỜI: chủ quán đồng ý cả hai, phiếu sửa ở commit `9ce1a32 PHIEU: TU-CHAY-10 …`)
1. **Thêm `tu_chay/thu_nguoi_gac.js` vào `## Phạm vi`** (bắt buộc để làm nghiệm thu F + H cùng lúc).
   `tu_chay/thu_nguoi_gac.js:800-802` khoá ĐÚNG danh sách `ban_cai` (so bằng ba mục skill / ra-soat / cong.yml). Nghiệm thu F thêm mục
   thứ tư `["lenh_soat_bao_mat.md", ".claude/commands/soat-bao-mat.md"]` → phép đó ĐỎ → nghiệm thu H (`thu_nguoi_gac.js` xanh) không đạt.
   LUAT_XAY_APP §6.7 cho sửa đúng dòng danh sách trắng mà không hỏi, nhưng `thu_nguoi_gac.js` là file luật (`tu_chay/**`) nên người gác
   (G-LUAT) chặn ghi và cổng báo `✗ [A6] file luật ... phải ghi ĐÚNG TÊN trong Phạm vi` — không làm được nếu phiếu không ghi tên.
   **Đề xuất:** chủ quán thêm một dòng `- tu_chay/thu_nguoi_gac.js` vào `## Phạm vi` (commit `PHIEU: TU-CHAY-10`). Mình chỉ sửa đúng
   danh sách ở dòng 800-802 (vẫn so BẰNG, thêm mục thứ tư). Bản sửa ĐỎ trên gốc (cau_hinh gốc chỉ có 3 mục) → là bài đỏ hợp lệ, ghi
   `SỐ CA` như luật — KHÔNG cần thêm vào `## Bài thử cũ sửa`.
   **Cùng câu (tuỳ chủ quán):** thêm `- tu_chay/thu_cong_cu.js` để KHOÁ bằng phép chữ (khuôn `thu_cong_cu.js:372-379` đang canh
   `/ra-soat`): lệnh mới có dòng MIT + `SubagentHandback` + ngưỡng 8 + mục "Tiền lệ"; skill có bước `8b.` và dòng `SOÁT BẢO MẬT: ĐẠT`;
   mẫu phiếu có `## Soát bảo mật`. Không thêm thì các mục A/B/D chỉ có bằng chứng đọc tay (ghi CHƯA KIỂM). Đề xuất: thêm (khoá hơn lời dặn).
2. **Cho sửa thêm một câu ở bước 4 của skill** (`tu_chay/skill_lam_viec.md:70`): câu "`✗ [A19]` … và `✗ [A8]` … ở bước này là bình
   thường, không hỏi" cần thêm `✗ [A20]` (bước 4 chưa tới 8b nên việc có phiếu `có` LUÔN thấy `✗ [A20]`; không thêm thì máy dừng hỏi oan).
   File đã trong Phạm vi, nhưng nghiệm thu B ghi "không đổi các bước khác" nên mình hỏi. Đề xuất: cho thêm đúng chữ `✗ [A20]` vào câu đó.

## Phiên 2 (01.11.2026, `/lam-viec TU-CHAY-10 tiep`) — bước 1 đối chiếu bản chụp
- Nhánh `viec/TU-CHAY-10`; `git status --short` sạch. Hook mở phiên đã kéo `abed525 → 9ce1a32`.
- `git fetch origin viec/TU-CHAY-10`: HEAD = `9ce1a32`, FETCH_HEAD = `9ce1a32` → bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  9ce1a32 PHIEU: TU-CHAY-10 tra loi 2 cau 01.11 (Pham vi them thu_nguoi_gac.js + thu_cong_cu.js; skill buoc 4 them A20)
  4ea794a TU-CHAY-10: ke hoach (cho duyet) + trang thai, 2 cau hoi (Pham vi thu_nguoi_gac.js / thu_cong_cu.js; skill buoc 4 them A20)
  abed525 PHIEU: TU-CHAY-10
  ```
- Có commit `PHIEU: TU-CHAY-10` (`abed525`, `9ce1a32`). Chủ quán trả lời 2 câu → làm tiếp theo kế hoạch.

## Bước 4–7 — bài thử trước, sửa, kiểm
- Bài thử (commit TRƯỚC khi sửa code): `tu_chay/thu_cong.js` (ca A20 + 4 đột biến DB A20), `tu_chay/thu_nguoi_gac.js` (danh sách
  trắng `ban_cai` thêm mục thứ tư, vẫn so BẰNG), `tu_chay/thu_cong_cu.js` (7 phép chữ: lệnh, skill 8b, câu bước 4 [A20], mẫu phiếu).
- Cả ba ĐỎ trên cây gốc `9ce1a32`, XANH trên HEAD — chi tiết + `SỐ CA` ở `bang_chung_do.txt`. Bản GỐC `thu_cong.js` (mục
  `## Bài thử cũ sửa`) chạy trên code mới: 337 phép · 0 chỗ hỏng.
- `thu_cong_cu.js` đỏ hai phép ngay sau khi vá (K2): phép soi nhầm chỗ — cụm "Tiền lệ của kho này" và "origin/HEAD" có ở dòng chú thích
  nguồn (dòng 9) nên cửa sổ soi bắt đầu sai. Truy nguyên rồi sửa bài: soi từ tiêu đề `\n## Tiền lệ của kho này`; "không dùng
  origin/HEAD" → "không còn dòng lệnh !`git" của bản gốc. Sửa trước khi ghi bằng chứng; bằng chứng đỏ chạy bằng bản đã sửa.
- `npm test`: ĐẾM PASS 87 · FAIL 0 · CẢNH BÁO 4. `npm test -- --day-du`: PASS 91 · FAIL 0 · CẢNH BÁO 4. Bốn cảnh báo: GET-ghi có sẵn
  (packages/products/sync), `.claude/tu_chay/` + SKILL.md lệch và `.claude/commands/soat-bao-mat.md` chưa cài (chủ quán cài sau),
  và dòng "– thu_cong.js: 141 đơn vị → NÂNG NGUONG_THU_CONG_DON_VI" (xem Phát hiện 1).

## Đột biến (viec/TU-CHAY-10/dot_bien.py — chạy trên bản sao HEAD ngoài kho, có ĐỐI CHỨNG)
| Chỗ vá (tu_chay/cong.js) | Đột biến | Ca thu_cong.js phải bắt |
|---|---|---|
| đọc dòng `SOÁT BẢO MẬT:` CUỐI (`.pop()`) | VS-A20-dong-dau | ĐẠT rồi lần soát sau KHÔNG ĐẠT |
| ranh giới chữ sau có/không | VS-A20-bo-ranh-gioi | chữ dính "cóthể" |
| hoa thường như nhau (cờ `i`) | VS-A20-bo-hoa-thuong | K5 "- Có — tiền" |
| một khối chung cho tinh + chay | VS-A20-chi-tinh | có + thiếu dòng (chay) |
| dòng ĐẠT phải đúng nguyên dòng | VS-A20-dat-mot-phan | có + KHÔNG ĐẠT |
| bắt rộng tiêu đề rồi đòi đúng dạng (vòng 1) | VS-A20-tieu-de-sat-chu | tiêu đề lệch "## Soát Bảo Mật" |
| gỡ cả phép | BV-A20 | có + thiếu dòng (tinh) |
- Lần 1 (trước vòng 1, 6 đột biến): ĐỐI CHỨNG XANH; VS-A20-dong-dau, VS-A20-bo-ranh-gioi, VS-A20-bo-hoa-thuong, VS-A20-chi-tinh,
  VS-A20-dat-mot-phan, BV-A20: BẮT cả 6.
- Đột biến DB trong `thu_cong.js` (tắt A20 → ca thành ĐẠT): 4 ca (thiếu dòng tinh, thiếu dòng chay, giá trị lạ, tiêu đề lệch hoa).

## Soát độc lập vòng 1 (`/ra-soat`, agent general-purpose) — báo cáo nguyên văn
```
KHÔNG ĐẠT

Tóm lại: phần chính chạy đúng. Bài thử đỏ trên bản gốc và xanh trên HEAD; mình tự chạy `thu_cong_cu.js` thì ra 116 phép · 0 chỗ hỏng. Còn hai việc phải làm trước khi gộp: (1) cổng A20 bỏ qua im lặng khi tiêu đề mục viết lệch chữ, và (2) nghiệm thu G chưa có bằng chứng.

LỖI TÌM ĐƯỢC:
- tu_chay/cong.js:78 (`mucBaoMat`, mẫu tiêu đề `/^##\s+Soát bảo mật\s*$/` không có cờ `i`). Cổng là "khoá" nhưng gặp lỗi thì mở cửa (fail-open). Mình đo bằng một script trong nháp, gọi đúng hàm `mucBaoMat` lấy từ cong.js: `## Soát Bảo Mật` (viết hoa), `### Soát bảo mật` và `## Soát bảo mật: có — tiền` đều trả `null`, tức là coi như "không có mục", và A20 không kiểm gì. Chat soạn phiếu lệch chữ một chút là việc dính tiền vượt cổng mà không có dòng ✗ nào. Trong khi đó, giá trị lạ ở DÒNG ĐẦU thì cổng lại khoá chặt (đỏ). Hai nửa của cùng một phép xử lý ngược chiều nhau. Thuộc khuôn K3 (ca không mục / có mục chưa tách được tiêu đề lệch) và K4 (cổng "bắt buộc có X" phải kiểm cùng biểu thức với chỗ đọc X). Cách sửa gọn: cờ `iu` cho mẫu tiêu đề, và dòng `^#{1,6}\s*Soát bảo mật` nào không khớp đúng mẫu thì ✗ A20 "tiêu đề phải đúng `## Soát bảo mật`". Thêm ca thử cho cả ba dạng trên.
- viec/TU-CHAY-10/ke_hoach.md:101-102 — danh sách file để chat chép sang APP-KH (nghiệm thu G) đã cũ. Danh sách thiếu `tu_chay/thu_cong_cu.js`, và vẫn ghi "(`thu_nguoi_gac.js` nếu được duyệt)" dù cả hai file đã được duyệt (phiếu 9ce1a32) và đã sửa. Kết quả grep "không chữ POS" mà kế hoạch hứa "chép vào trang_thai.md" cũng chưa có ở đâu. Chat chép theo danh sách này sẽ bỏ sót `thu_cong_cu.js`, và APP-KH sẽ thiếu phép canh lệnh, skill, mẫu phiếu. Thuộc khuôn K4/K7 (lỗi giao nhận) và K1 (hồ sơ lệch thực tế).
- viec/TU-CHAY-10/dot_bien.py:24-31 (`dung`) — phép kiểm "thư mục tạm nằm trong kho" chạy SAU `shutil.rmtree(dich)` + `extractall`, và so với `os.getcwd()` chứ không so với gốc kho. Nếu tham số trỏ vào trong kho thì đã xoá / giải nén xuyên vào kho rồi mới thoát. Chạy từ thư mục khác thì phép kiểm không bảo vệ gì. Thuộc khuôn K5 (HOC-2b: công cụ chép-rồi-sửa phải tự kiểm `realpath` đích TRƯỚC khi ghi). Lỗi nhẹ, vì chỉ đụng công cụ của việc.
- tu_chay/skill_lam_viec.md:85 với tu_chay/cong.js:130 — hai cách đọc "có" lệch nhau (K4 BAN-HANG-1: một vị từ, hai biểu thức). Skill ghi "dòng đầu bắt đầu `có`", còn cổng chấp nhận cả `- có` / `* có` (mẫu `^[-*]?\s*`). Máy đọc skill sát chữ sẽ bỏ qua bước 8b với `- Có — tiền`, rồi cổng đỏ. Lệch theo chiều an toàn (đỏ, không lọt) nhưng sẽ làm máy dừng hỏi oan. Cách sửa: skill ghi đúng "(cho phép `- ` / `* ` ở đầu)".

NGHI NGỜ:
- K3 "marker suông": cổng cho qua nếu chỉ có dòng chữ `SOÁT BẢO MẬT: ĐẠT` (cong.js:132-133), không đòi bằng chứng là `/soat-bao-mat` đã chạy thật. Máy viết tay dòng đó là xanh. Lỗ này cùng khuôn với `/ra-soat`, và phiếu mục C chỉ đòi dòng chữ nên mình không tính là lỗi. Nhưng cổng hiện đang bịt bằng LỜI DẶN, chưa bằng KHOÁ (C16).
- A20 không gắn SHA (THIET_KE.md:988-989 và ke_hoach phần "CHƯA KIỂM" đã tự nêu): sửa code sau lần soát thì cổng không thấy. Câu "bước 11 đổi code … thì soát bảo mật lại" (skill_lam_viec.md:89-90) chỉ là lời dặn.
- Dòng ĐẠT phải viết sát chữ: `**SOÁT BẢO MẬT: ĐẠT**` thì cổng coi là "chưa có", `SOÁT BẢO MẬT: ĐẠT.` thì ĐỎ (đã đo). An toàn, nhưng dễ làm máy dừng oan. Skill đã ghi "MỘT dòng riêng" nên tạm chấp nhận.
- Nghiệm thu A "giữ nguyên nguyên văn": người làm lấy bản gốc qua WebFetch, mà WebFetch đi qua một mô hình nhỏ trích lại (ke_hoach tự ghi "khoảng trắng có thể lệch"). Mình cũng chỉ đối chiếu được CẤU TRÚC qua WebFetch: 18 mục HARD EXCLUSIONS có "16" lặp, 12 PRECEDENTS, đủ các nhóm OBJECTIVE … START ANALYSIS, câu cuối "Your final reply must contain the markdown report and nothing else." đều khớp lenh_soat_bao_mat.md:56-217. Chưa so được từng byte. Câu "chép nguyên văn" ở THIET_KE.md:990 và lenh_soat_bao_mat.md:7 vì vậy chưa có căn cứ byte (K1).
- lenh_soat_bao_mat.md:21 thêm `git log --no-decorate <mốc>^..HEAD`, trong khi lenh_ra_soat.md bước 1 không có lệnh này. Phiếu ghi "y như /ra-soat". Lệch nhỏ và hợp lý (bản gốc có khối COMMITS), người gác cho qua `log` (nguoi_gac.js:119). Nên ghi một dòng lý do.
- Báo cáo chép nguyên văn có tiêu đề `# Vuln 1:` (cấp H1) sẽ nằm trong trang_thai.md. Hiện không phép nào đọc trang_thai theo tiêu đề (grep "Bài học" / "## Câu hỏi" trong cong.js, nguoi_gac.js, cai_dat.js đều rỗng), nên chưa vỡ gì.

Kết quả rà theo 8 mục:
1. K3: ba bài thử đỏ trên 9ce1a32 (bang_chung_do.txt:5-36). Các ca A20 ở thu_cong.js:519-544 kiểm sự VẮNG mặt của dòng ĐẠT, có ca "ĐẠT rồi KHÔNG ĐẠT", ca chữ dính, ca mục rỗng, và 3 đột biến ở mảng DB (thu_cong.js:567-568). Đột biến dot_bien.py:9-21 neo chuỗi ngắn, có đối chứng. Thiếu ca cho tiêu đề lệch chữ (xem lỗi 1).
2. K4: grep `^##\s+` trong cong.js → 3 hàm đọc mục (mucMien :59, mucBaiThuCu :66, mucBaoMat :78), đều so tiêu đề sát chữ. Riêng mục bảo mật thì sát chữ nghĩa là bỏ qua im lặng. Đọc trang_thai qua `blob` ở 3 chỗ (:132, :204, :227); chỗ mới không đụng A17/A19.
3. K5: phiếu không mục (mọi ca cũ, bản gốc thu_cong 337 phép xanh trên code mới), `không — …`, `- Có`, soát lại sau KHÔNG ĐẠT, PR thêm ban_cai: đều có ca ĐẠT. Chặn oan theo chiều an toàn: `**có**`, `` `có` ``, dòng `<!-- -->` đứng trước "có" đều thành ✗ A20 (đã đo).
4. K1: xem phần Nghi ngờ (câu "nguyên văn"; ke_hoach:101-102 đã cũ).
5. Đường tiền: diff không đụng server/ (git diff --stat). Không áp.
6. P1: không đụng client/. Không áp.
7. Nghiệm thu: xem dòng dưới.
8. Đơn giản:
   - thu_cong.js:536-544 (ca K5 ban_cai): gần như chép ca cũ ~:262. Phiếu thử PHIEU (thu_cong.js:68) đã có `- tu_chay/**`, nên lệnh `PHIEU.replace(... lenh_soat_bao_mat.md)` là thừa. Ca này còn không có mục `## Soát bảo mật`, nên không thử gì thêm của A20. Gọn hơn: bỏ dòng replace, hoặc gộp tên vào ca cũ.
   - Phần còn lại gọn: khối A20 ~12 dòng, đặt một chỗ cho cả `tinh` lẫn `chay`.

NGHIỆM THU: 7/8 mục có bằng chứng · mục thiếu: G.
- A có: lenh_soat_bao_mat.md, 4 phép ở thu_cong_cu.js:487-499 (riêng "nguyên văn" thì chưa so được byte).
- B có: skill_lam_viec.md:70, 85-90; phép ở thu_cong_cu.js:501-504.
- C có: cong.js:76-82, 126-136; ca A20 và mảng DB của thu_cong.js; dot_bien.py.
- D có: MAU_PHIEU.md:64-67; phép ở thu_cong_cu.js:505-507.
- E có: đủ 7 loại ca ở thu_cong.js:525-544; bang_chung_do.txt.
- F có: PHIEN_BAN, THIET_KE.md:983-991, cau_hinh.json:16, thu_nguoi_gac.js:800-803.
- G thiếu: danh sách file đã cũ (thiếu thu_cong_cu.js), chưa ghi kết quả grep xác nhận. Mình đã đọc tay phần mới của lệnh, skill, mẫu phiếu, THIET_KE và khối A20: không có chữ POS / đường dẫn riêng của kho POS. Nhưng hồ sơ thì chưa ghi.
- H có một phần: thu_cong_cu chính mình chạy xanh (116/0); thu_cong, thu_nguoi_gac, npm test theo lời người làm, mình chưa chạy lại.
- Cổng `tinh` mình chạy trên HEAD ra ✗ [A8] (chờ chủ quán cài — bình thường), ✗ [A17] (trang_thai chưa ghi 6 tên đột biến VS-A20-*/BV-A20) và ✗ [A19] (thiếu dòng HEAD ĐÃ KIỂM). A17 và A19 sẽ hết khi người làm ghi báo cáo cuối. Kết quả 4 đột biến tay mà kế hoạch hứa ghi vào trang_thai cũng chưa có.

CHƯA SOÁT ĐƯỢC:
- So từng byte với bản gốc Anthropic: người gác chặn `gh`, WebFetch chỉ trả bản tóm tắt.
- Không chạy lại `thu_cong.js`, `thu_nguoi_gac.js`, `npm test`, `--day-du`, `cong.js chay` và `dot_bien.py` (bị dặn không chạy).
- Không kiểm được `/soat-bao-mat` chạy thật trên một việc ghi `có`: phải chờ chủ quán cài, và subagent lồng subagent có thể bị giới hạn.

BÀI HỌC:
- KHOÁ (thêm ca vào thu_cong.js): phiếu có tiêu đề gần giống `Soát bảo mật` mà lệch chữ (hoa thường, `###`, có đuôi `: có`) → ✗ A20, không được bỏ qua. Lý do: cổng an ninh mà tiêu đề lệch lại mở cửa.
- KHOÁ: dòng `SOÁT BẢO MẬT: ĐẠT <SHA>` + phép như A19 (đã có trong đề xuất bước 11), để code sửa sau lần soát không lọt.
- NGUYÊN TẮC (KHUON_LOI K4): một phép "bắt buộc khi có mục X" thì nhận diện mục X phải bắt được mọi biến thể (bắt rộng rồi đòi đúng dạng). Nếu không, lệch chữ thành mở cửa (fail-open). Ghi kèm: hồ sơ giao nhận (danh sách file để chép sang kho khác) phải cập nhật lại sau khi chủ quán đổi Phạm vi.
- NGUYÊN TẮC (K5): công cụ chép-rồi-sửa kiểm `realpath` đích TRƯỚC khi xoá hoặc giải nén, so với gốc kho chứ không so với thư mục đang đứng.
```

## Vòng sửa 1
- Lỗi 1 (tiêu đề lệch → bỏ qua im lặng): ca ĐỎ trước — 3 ca `TU-CHAY-10 A20 tiêu đề lệch "…"` (`3009890`), chạy trên code chưa vá vòng 1
  → đỏ đúng 3 ca (385 phép · 12 chỗ hỏng); vá `cong.js` `mucBaoMat`: bắt rộng `^#+\s*soát\s*bảo\s*mật` (cờ `iu`), tiêu đề nào không đúng
  `## Soát bảo mật` → `{ lech }` → ✗ A20 "phải viết đúng". Đột biến mới VS-A20-tieu-de-sat-chu + DB A20 cho ca hoa. Rà K4: grep
  `^#+\s*[Ss]oát\s*[Bb]ảo` trong `viec/**/phieu.md` → 1 chỗ (phiếu này, đúng dạng) — không phiếu đang chạy nào bị chặn oan.
- Lỗi 2 (G): `ke_hoach.md` danh sách file cập nhật; danh sách CUỐI + grep ở mục "Chép sang APP-KH" dưới.
- Lỗi 3 (dot_bien.py): kiểm `realpath` đích TRƯỚC `rmtree` / giải nén, so với gốc kho (`__file__/../..`).
- Lỗi 4 (skill ↔ cổng): 8b ghi rõ được có `- ` / `* ` ở đầu, cùng cách đọc với A20.
- Nghi ngờ "nguyên văn" (K1): lệnh + THIET_KE đổi thành "chép lại (bản lấy bằng WebFetch 01.11, chưa so từng byte)".
- Nghi ngờ `git log`: thêm một câu lý do trong lệnh.
- KHÔNG làm theo ý mục 8 "bỏ `PHIEU.replace`": file trong `tu_chay/` là file luật, glob `tu_chay/**` không mở được (ca có sẵn
  "A6 file luật chỉ ghi bằng glob chung", `cong.js` A6 G-LUAT) — bỏ dòng đó thì ca K5 đỏ vì A6, không phải vì A20.

## Chép sang APP-KH (nghiệm thu G) — danh sách cuối
File `tu_chay/` đổi, chép NGUYÊN: `lenh_soat_bao_mat.md` (mới), `skill_lam_viec.md`, `MAU_PHIEU.md`, `cong.js`, `thu_cong.js`,
`thu_nguoi_gac.js`, `thu_cong_cu.js`, `PHIEN_BAN`, `THIET_KE.md`. `cau_hinh.json`: KHÔNG chép nguyên — APP-KH chỉ thêm đúng mục
`["lenh_soat_bao_mat.md", ".claude/commands/soat-bao-mat.md"]` vào `ban_cai`. Lưu ý: `thu_nguoi_gac.js:800-803` khoá đúng danh sách
`ban_cai` 4 mục; `thu_cong_cu.js` có phép đọc `../CLAUDE.md` / `../KHUON_LOI.md` của kho — APP-KH phải có các mục đó như POS (chat đối chiếu).
Grep xác nhận (01.11, trên phần THÊM của diff `9ce1a32..HEAD` các file lệnh, skill, mẫu phiếu, THIET_KE, cong.js, cau_hinh, PHIEN_BAN):
`grep "POS\|pos-tuquyduong\|Tứ Quý\|server/\|client/\|turso\|Render"` → 5 dòng khớp, cả 5 là chữ "FALSE POSITIVE(S)" của bản gốc
Anthropic; không có chữ POS / đường dẫn riêng của kho POS. `thu_cong_cu.js` phép "không chữ POS" canh lệnh tự động (`\bPOS\b`).

## Phát hiện (ngoài Phạm vi — không sửa)
1. `kiem_tra_truoc_khi_giao.js:653` bánh cóc `NGUONG_THU_CONG_DON_VI = 126`; `thu_cong.js` giờ 141 đơn vị → bộ kiểm in "NÂNG lên 141".
   File luật ngoài Phạm vi → chat / chủ quán nâng sau khi gộp (chỉ siết, đúng chiều bánh cóc).
2. Cổng A20 chưa gắn SHA như A19 và chỉ đọc dòng chữ `SOÁT BẢO MẬT: ĐẠT` (marker suông viết tay vẫn qua) — xem Bài học.
