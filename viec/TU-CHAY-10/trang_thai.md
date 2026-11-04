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
| hơn MỘT tiêu đề → `{ lap }` (vòng 2) | VS-A20-lay-tieu-de-dau | hai tiêu đề ## Soát bảo mật |
| câu báo riêng cho mục lặp (vòng 4) | VS-A20-cau-lap-chung | hai tiêu đề ## Soát bảo mật |
| gỡ cả phép | BV-A20 | có + thiếu dòng (tinh) |
| skill 8b / bước 4 ghi "mục lặp" (vòng 4, đột biến tay trên bản sao) | xoá "hay mục lặp" khỏi skill bước 4 | thu_cong_cu "A20 tiêu đề lệch / giá trị lạ / mục lặp" |
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
3. (soát vòng 2, nghi ngờ) Tiêu đề không dấu / có số (`## Soat bao mat`, `## 8. Soát bảo mật`) cổng không nhận là mục; `**có**`,
   `` `có` ``, `<!-- -->` ngay dưới tiêu đề → đỏ "có hoặc không" (đỏ đúng chiều an toàn, có thể làm máy dừng). Chat soạn phiếu theo mẫu
   nên ít gặp — không sửa trong việc này.

## Đột biến — lần 2 (sau vòng sửa 1)
- ĐỐI CHỨNG XANH; VS-A20-dong-dau, VS-A20-bo-ranh-gioi, VS-A20-chi-tinh, VS-A20-dat-mot-phan, VS-A20-tieu-de-sat-chu, BV-A20: BẮT.
  VS-A20-bo-hoa-thuong LẠC (neo `exec(baoMat)` đổi thành `exec(baoMat.dau)` ở vòng 1 — K4 "đổi code → neo đột biến lạc") → sửa neo
  (`49d9ad5`), chạy lại riêng: ĐỐI CHỨNG XANH, BẮT.

## Soát độc lập vòng 2 (`/ra-soat`) — báo cáo nguyên văn
```
KHÔNG ĐẠT

Tóm lại: bốn lỗi của vòng 1 đã sửa đúng. Mình tự chạy lại các bài thử và đều xanh: thu_cong.js 385 phép · 0 hỏng, thu_cong_cu 116 · 0, thu_nguoi_gac 1011/1011 · 182, npm test qua hết. Cổng `tinh` chỉ còn ✗ [A8] và ✗ [A19], cả hai là bình thường lúc này; A17 đã hết. Còn hai lỗi NHẸ. Lỗi nặng hơn trong hai lỗi là cách sửa "bắt rộng" của vòng 1 vẫn còn một đường để cổng tự mở. Cả hai lỗi không đụng tiền, điểm hay ví, và mỗi lỗi sửa chỉ khoảng một dòng.

LỖI TÌM ĐƯỢC:
- tu_chay/cong.js:79-89 (`mucBaoMat`): cổng còn tự mở (fail-open) khi phiếu có hai tiêu đề `## Soát bảo mật` cùng đúng dạng. Hàm `findIndex` (:85) chỉ lấy tiêu đề ĐẦU TIÊN, còn phép `lech` (:83) chỉ bắt tiêu đề sai dạng, không bắt tiêu đề lặp. Mình đo bằng đúng hàm lấy từ cong.js:
  - `## Soát bảo mật\nkhông\n## Soát bảo mật\ncó` → `{dau:"không"}`, cổng bỏ qua.
  - Một khối chú thích HTML `<!-- … \n## Soát bảo mật\nkhông\n-->` đặt trước mục thật `## Soát bảo mật\ncó` → `{dau:"không"}`.
  - Một khối mã ``` chứa `## Soát bảo mật\nkhông` đặt trước mục thật → cũng `{dau:"không"}`.
  Đây đúng là khuôn lỗi vòng 1 đã rút bài học ("nhận diện mục X phải bắt mọi biến thể"): còn một biến thể thì cổng an ninh vẫn mở. Khuôn K3 (thiếu ca cho tiêu đề lặp) và K4. Mức NHẸ, vì đây là cổng quy trình, không đụng tiền / điểm / ví. Cách gọn: đòi `gan.length === 1 && /^##\s+Soát bảo mật$/.test(gan[0])`, khác thì trả `{ lech }` (vừa gọn hơn :83-85, vừa bỏ được `findIndex` lặp lại cùng regex). Thêm ca "hai tiêu đề, cái đầu `không`" và một đột biến đưa lại `find` thay cho phép đếm.
- tu_chay/skill_lam_viec.md:70 với :85-87: skill không hướng dẫn đủ cả ba kết quả của A20. Bước 4 (:70) gọi mọi `✗ [A20]` là "bình thường, không hỏi", không tách ba loại thông báo của cổng (cong.js:136 tiêu đề lệch, :137 "có hoặc không", :141 thiếu ĐẠT). Bước 8b nói rõ tiêu đề lệch thì hỏi, nhưng chỉ có hai nhánh `có` / không mục-hoặc-`không`. Giá trị lạ (vd `chưa rõ — …`) không thuộc nhánh nào, nên máy bỏ qua 8b, tới cổng 11.4 mới đỏ — phải chạy hết cả việc mới phát hiện, mà phiếu chỉ sửa được qua commit PHIEU (A7). Khuôn K4 (một vị từ, hai cách diễn đạt — BAN-HANG-1) / K5 (máy dừng muộn). Mức NHẸ. Cách gọn: câu ở bước 4 ghi "`✗ [A20]` … cần SOÁT BẢO MẬT: ĐẠT (chưa tới 8b)"; 8b thêm "dòng đầu không phải có / không, hoặc tiêu đề lệch → `## Câu hỏi`, dừng".

NGHI NGỜ:
- Cổng vẫn chỉ đọc một dòng chữ `SOÁT BẢO MẬT: ĐẠT` (cong.js:139-140) và không gắn SHA. Máy viết tay dòng đó là xanh, và sửa code sau lần soát thì cổng không thấy. Hồ sơ đã tự nêu (THIET_KE.md:988-989, trang_thai "Phát hiện" 2), và phiếu mục C chỉ đòi dòng chữ, nên mình không tính là lỗi. Cổng hiện bịt bằng LỜI DẶN (skill:89-90 "soát bảo mật lại"), chưa bằng KHOÁ.
- Có ba chỗ cổng đỏ đúng chiều an toàn nhưng làm máy dừng oan. Phiếu hợp lệ về ý mà ghi `**có**`, `` `có` ``, `> có`, `- [x] có`, hoặc có dòng `<!-- … -->` ngay dưới tiêu đề → `dau` là chính dòng đó → ✗ "có hoặc không". Tiêu đề có NBSP → lệch. Ngược lại, có tiêu đề cổng không nhận là mục, tức là mở cửa: `## Soat bao mat` (không dấu), `## 8. Soát bảo mật`, `## Soát bảo-mật` → null (đã đo). Cả hai loại đều ít khả năng gặp vì chat viết phiếu.
- cong.js:135: `không — <lý do>` (dòng mẫu chưa điền) vẫn được nhận là `không` hợp lệ. Trong khi đó `mucMien` (:62) cố ý loại dạng `<lý do>` của mẫu. Phiếu C không đòi lý do, nên không tính là lỗi, nhưng hai mục lệch nhau.
- lenh_soat_bao_mat.md:210-217: khối START ANALYSIS gốc ("Your final reply must contain the markdown report and nothing else") vẫn nằm trong lệnh mà phiên chính đọc. Nó chồng với bước 2-4 tiếng Việt (:28-45: phiên chính chép vào trang_thai rồi skill đi tiếp). Hai lời dặn có thể kéo ngược nhau ở chỗ "trả lời cuối". Khối này nằm ngoài phần được giao cho subagent (:32, chỉ tới hết FALSE POSITIVE FILTERING), nên ổn ở phía subagent. Chưa chạy thật nên chưa biết.
- thu_cong.js:542 dùng hàng mẫu `server/moi.js` để làm "code". Bài này chép sang APP-KH (G), nhưng cau_hinh của APP-KH khác. Nếu laCode / Phạm vi bên đó khác thì ca K5 có thể đổi nghĩa. Lỗ này có sẵn từ ca cũ ~:262, không phải do việc này.

Rà theo 8 mục:
1. K3: các ca A20 ở thu_cong.js:525-542 kiểm sự VẮNG mặt của dòng ĐẠT, có ca "ĐẠT rồi KHÔNG ĐẠT" (:529). Dòng chữ suông ở ĐẦU mục không làm xanh được (ca giá trị lạ, chữ dính, mục rỗng). bang_chung_do.txt:4-17 cho thấy đủ 12 ca đỏ trên 9ce1a32, kể cả 3 ca tiêu đề lệch. Đột biến VS-A20-tieu-de-sat-chu (dot_bien.py:17) đưa đúng lỗi vòng 1 trở lại. Lỗi dot_bien vòng 1 đã sửa: phép kiểm realpath so với gốc kho chạy TRƯỚC rmtree (:24-33). Còn thiếu: ca tiêu đề lặp (lỗi 1).
2. K4: grep `^#+\s*soát\s*bảo\s*mật` (iu) trên 60 file viec/*/phieu.md → đúng 1 tiêu đề (viec/TU-CHAY-10/phieu.md:82, dạng đúng, `không`). Dòng tiêu đề `# TU-CHAY-10 … soát bảo mật …` (:1) không khớp, vì regex neo `^#+\s*soát`. Các hàm đọc mục cùng khuôn là mucMien :58 và mucBaiThuCu :65, cả hai không bị đổi. Chỗ chưa xử lý: tiêu đề lặp (lỗi 1) và cách skill đọc giá trị lạ (lỗi 2).
3. K5: các luồng đi qua điều kiện mới — phiếu không có mục (60 phiếu, bản gốc thu_cong 337·0), `không — …` (:540), `- Có` (:541), `##  Soát bảo mật` hai dấu cách, CRLF, chữ tổ hợp (NFD) đều được nhận. KHÔNG ĐẠT rồi ĐẠT (:530), PR thêm ban_cai (:542). Không phiếu nào trong kho bị chặn oan. Các dạng chặn oan theo chiều an toàn: xem NGHI NGỜ.
4. K1: câu "nguyên văn" đã đổi thành "chép lại (… chưa so từng byte)" ở lenh:7 và THIET_KE:990. Danh sách G ở ke_hoach.md:101-104 và trang_thai đã cập nhật. Câu "thu_cong_cu đọc ../CLAUDE.md / ../KHUON_LOI.md" khớp thu_cong_cu.js:327 và :364. Mình grep lại các dòng THÊM trong tu_chay/: không có chữ POS / Tứ Quý / pos-tuquyduong; "server/" chỉ xuất hiện ở hàng mẫu thu_cong.js:306 của diff.
5. Đường tiền: diff không đụng server/ (git diff --stat). Không áp.
6. P1: không đụng client/. Không áp.
8. Đơn giản: mucBaoMat :81-85 chạy regex ba lần (filter, find, findIndex). Đổi sang phép đếm `gan.length === 1` thì gọn hơn và sửa luôn lỗi 1. Phần còn lại gọn: khối A20 ~12 dòng, một chỗ cho cả tinh và chay. Mình đồng ý lý do giữ `PHIEU.replace` ở ca :542 (vì A6 file luật).

NGHIỆM THU: 8/8 mục có bằng chứng · mục thiếu: không (✗ A8 / A19 chờ chủ quán, không tính).
- A: lenh_soat_bao_mat.md (bước 1-4 :14-45, Tiền lệ :47-55, lời nhắc :57-217); thu_cong_cu.js:489-497.
- B: skill_lam_viec.md:70 và :85-91; thu_cong_cu.js:499-503 (nội dung còn thiếu: lỗi 2).
- C: cong.js:76-89 và :132-143; thu_cong.js:525-542; DB :572-573; dot_bien.py 7 đột biến.
- D: MAU_PHIEU.md:64-67; thu_cong_cu.js:504-506.
- E: thu_cong.js:525-542, đủ 7 loại ca phiếu đòi + 3 ca tiêu đề lệch; bang_chung_do.txt.
- F: PHIEN_BAN `tu-chay 1.9.0`; THIET_KE.md:983-992; cau_hinh.json:16; thu_nguoi_gac.js:800-803.
- G: ke_hoach.md:100-104; trang_thai mục "Chép sang APP-KH" (danh sách + kết quả grep); mình grep lại thấy khớp.
- H: mình tự chạy thu_cong 385·0, thu_cong_cu 116·0, thu_nguoi_gac 1011/1011·182, npm test xanh.

CHƯA SOÁT ĐƯỢC:
- Không chạy dot_bien.py (bị dặn), `--day-du`, `cong.js chay`.
- Không so từng byte lời nhắc với bản gốc Anthropic (không có quyền mạng / gh).
- Không chạy được `/soat-bao-mat` thật (chưa cài, và subagent lồng subagent chưa thử).
- Script đo mucBaoMat của mình chạy bằng cách eval hàm lấy từ cong.js, không qua cổng đầy đủ — kết quả nghĩa là hàm trả "không", chưa đo tới dòng ✗ của cổng.

BÀI HỌC:
- KHOÁ (thu_cong.js): ca "phiếu hai tiêu đề `## Soát bảo mật`, cái đầu `không`, cái sau `có`" → ✗ A20, kèm đột biến đưa lại cách lấy tiêu đề đầu tiên.
- KHOÁ (thu_cong_cu.js): skill bước 4 / 8b phải nói cách xử lý khi A20 báo tiêu đề lệch hoặc giá trị lạ (dừng hỏi sớm), không gộp chung "bình thường".
- NGUYÊN TẮC (K4, nối bài học vòng 1): "bắt rộng rồi đòi đúng dạng" phải đòi đúng MỘT mục. Mục lặp, mục nằm trong chú thích hay khối mã là biến thể thứ hai của tiêu đề lệch, và một cổng chỉ lấy mục đầu tiên sẽ mở cửa ở đó.
- KHOÁ đề xuất (việc sau, ngoài Phạm vi): A20 gắn SHA như A19.
```

## Vòng sửa 2
- Lỗi 1 (hai tiêu đề → lấy cái đầu, cổng mở): ca ĐỎ trước `TU-CHAY-10 A20 hai tiêu đề ## Soát bảo mật (đầu không, sau có)` (commit
  trước khi vá; đỏ trên code vòng 1: 390 phép · 4 chỗ hỏng). Vá `mucBaoMat`: hơn một tiêu đề giống "Soát bảo mật" → `{ lech }` "chỉ được
  MỘT mục" (bắt luôn tiêu đề nằm trong chú thích / khối mã); bỏ `find` + `findIndex` lặp regex. Đột biến mới VS-A20-lay-tieu-de-dau;
  DB A20 thêm ca này.
- Lỗi 2 (skill gộp mọi ✗ A20 là "bình thường"): phép chữ mới ở `thu_cong_cu.js` (đỏ trước: 117 · 1); skill bước 4 tách "đòi SOÁT BẢO
  MẬT: ĐẠT" (bình thường) với "tiêu đề lệch, giá trị lạ hay mục lặp" (lỗi phiếu → `## Câu hỏi`, dừng); 8b ghi cùng ý.
- Không làm: nghi ngờ "không — <lý do>" của mẫu được nhận (phiếu C không đòi lý do); START ANALYSIS của bản gốc giữ để không đổi lời
  nhắc (bước 2–4 tiếng Việt nói rõ phiên chính làm gì); `server/moi.js` trong ca K5 là lỗ có sẵn của ca cũ.

## Đột biến — lần 3 (sau vòng sửa 2, HEAD 2567e2e, `dot_bien.py` chép nguyên kết quả)
```
ĐỐI CHỨNG: thoát 0 → XANH
VS-A20-dong-dau: BẮT (thoát 1, ca "TU-CHAY-10 A20 ĐẠT rồi lần soát sau KHÔNG ĐẠT")
VS-A20-bo-ranh-gioi: BẮT (thoát 1, ca "TU-CHAY-10 A20 chữ dính")
VS-A20-bo-hoa-thuong: BẮT (thoát 1, ca "TU-CHAY-10 A20 K5 "- Có — tiền"")
VS-A20-chi-tinh: BẮT (thoát 1, ca "TU-CHAY-10 A20 có + trang_thai thiếu dòng (chay)")
VS-A20-dat-mot-phan: BẮT (thoát 1, ca "TU-CHAY-10 A20 có + KHÔNG ĐẠT")
VS-A20-tieu-de-sat-chu: BẮT (thoát 1, ca "TU-CHAY-10 A20 tiêu đề lệch "## Soát Bảo Mật"")
VS-A20-lay-tieu-de-dau: BẮT (thoát 1, ca "TU-CHAY-10 A20 hai tiêu đề ## Soát bảo mật")
BV-A20: BẮT (thoát 1, ca "TU-CHAY-10 A20 có + trang_thai thiếu dòng (tinh)")
```

## Soát độc lập vòng 3 (`/ra-soat`, vòng cuối) — báo cáo nguyên văn
```
KHÔNG ĐẠT (chỉ còn lỗi NHẸ, không lỗi nào đụng tiền, điểm, ví hay bảo mật)

Tóm lại: hai lỗi của vòng 2 đã sửa đúng ở phần code. Cổng `mucBaoMat` giờ chỉ nhận MỘT mục. Skill bước 4 và 8b đã tách "đòi SOÁT BẢO MẬT: ĐẠT" (bình thường) với "lỗi phiếu" (hỏi). Mình tự chạy lại: thu_cong 390 · 0, thu_cong_cu 117 · 0, thu_nguoi_gac 1011/1011 · 182, npm test "Qua hết" (thoát 0). `cong.js tinh` chỉ còn ✗ [A8] và ✗ [A19], hai cái này lúc này là bình thường. Trong 60 phiếu ở kho, không phiếu nào bị chặn oan. Còn hai lỗi nhẹ về hồ sơ và bài thử chữ: kết quả đột biến sau vòng sửa 2 chưa được ghi, và một phép chữ có tên rộng hơn phần máy kiểm thật. Theo LUAT §6.5, đây là vòng sửa 4 do chat soát thay.

LỖI TÌM ĐƯỢC:
- viec/TU-CHAY-10/trang_thai.md:60-73 và :159-163, :217-225 — hồ sơ chưa ghi kết quả lần chạy dot_bien.py sau vòng sửa 2. Câu "đối chứng xanh + 8/8 BẮT" chỉ có trong lời người làm, trong kho không có dòng nào: grep "8/8" chỉ khớp :194, mà dòng đó là NGHIỆM THU của bản soát vòng 2. Bảng "chỗ vá → đột biến" (:62-70) cũng thiếu hàng cho đột biến mới VS-A20-lay-tieu-de-dau (dot_bien.py:18-19, ca thu_cong.js:541). Tên đột biến chỉ được nhắc trong câu văn ở :220. Không có bản ghi thì không ai kiểm lại được rằng đột biến vá lỗi vòng 2 thật sự bị BẮT. Khuôn K3/K1 (A17/A18 đòi bảng + kết quả). NHẸ. Cách sửa: thêm hàng `| hơn MỘT tiêu đề → lech (vòng 2) | VS-A20-lay-tieu-de-dau | hai tiêu đề ## Soát bảo mật |` và mục "Đột biến — lần 3" ghi ĐỐI CHỨNG + 8 dòng BẮT, chép nguyên văn từ lần chạy.
- tu_chay/thu_cong_cu.js:505-507 — tên phép ghi "tiêu đề lệch / giá trị lạ / **mục lặp** → ## Câu hỏi sớm", nhưng regex chỉ đòi `tiêu đề lệch[^.]*giá trị lạ[^.]*## Câu hỏi`. Chữ "mục lặp" không được kiểm ở cả b4 lẫn s8b. Xoá "hay mục lặp" khỏi skill_lam_viec.md:71 và :87 thì phép vẫn xanh. Đúng khuôn K3 "tên ca nói một đằng, máy kiểm một nẻo" (P26b M6). NHẸ. Cách sửa: thêm `mục lặp` vào hai regex, ví dụ `/tiêu đề lệch[^.]*giá trị lạ[^.]*mục lặp[^.]*## Câu hỏi/`.
- tu_chay/cong.js:84 với :137 — với hai tiêu đề đúng dạng, thông báo in ra là `tiêu đề "## Soát bảo mật / ## Soát bảo mật (2 tiêu đề — chỉ được MỘT mục)" phải viết đúng "## Soát bảo mật" (một dòng riêng; …)`. Câu này bảo người đọc viết lại cho đúng một tiêu đề vốn đã đúng, và không nói tiêu đề thừa nằm ở đâu: trong chú thích hay trong khối mã. Cổng vẫn đỏ đúng. Chỉ có lời dẫn gây hiểu nhầm cho chủ quán / chat khi sửa phiếu. NHẸ (dễ đọc, không mở cửa). Cách sửa: `lech` của nhánh lặp mang câu riêng, ví dụ `{ lech, lap: true }`, và :137 in "chỉ được MỘT mục ## Soát bảo mật (kể cả trong chú thích / khối mã)".

NGHI NGỜ:
- skill_lam_viec.md:66-71 — câu "✗ [A20] báo tiêu đề lệch … → ## Câu hỏi ngay" nằm trong nhánh (ii). Nhánh này chỉ chạy "Trước khi xin chủ quán sửa phiếu" (:66). Ở luồng bình thường, không cần xin sửa phiếu thì bước 4 không chạy `cong.js tinh`, nên phiếu ghi giá trị lạ chỉ lộ ra ở 8b (:86-87), tức là sau khi đã làm xong code và /ra-soat. Vậy "hỏi sớm" chỉ sớm hơn 11.4, chưa phải sớm thật. Phiếu B chỉ cho đổi câu ở bước 4, nên muốn kiểm sớm thật ở bước 2/3 là việc sau. Không tính là lỗi.
- skill:86 viết "dòng đầu bắt đầu `có`". Cổng (cong.js:136) còn đòi ranh giới chữ, nên "cóthể" là giá trị lạ. Skill chỉ nói "cùng cách đọc với cổng A20" chứ không nêu ranh giới. Hai cách diễn đạt cho một vị từ (K4 BAN-HANG-1). Chiều sai này an toàn, vì máy sẽ soát thừa rồi cổng đỏ.
- cong.js:82 — một dòng trong chú thích HTML hay khối mã của phiếu mà bắt đầu bằng `## Soát bảo mật` thì giờ bị đếm là mục lặp và cổng đỏ. Đỏ đúng chiều an toàn. Grep `^\s*#+\s*so[áa]t\s*b[ảa]o\s*m[ậa]t` (không phân biệt hoa thường) trên viec/ chỉ khớp viec/TU-CHAY-10/phieu.md:82. Cả 60 tiêu đề phiếu đều có dạng `# <MÃ> —`, nên tiêu đề dòng 1 không khớp được.

Rà theo 8 mục:
1. K3: ca vòng 2 ở thu_cong.js:540-542 đỏ trên gốc (bang_chung_do.txt:8, "phải ĐỎ — ✓ CỔNG TĨNH ĐẠT"), xanh trên HEAD (mình chạy được 390 · 0). DB đột biến tắt-A20 có ca này (thu_cong.js:577). Đột biến VS-A20-lay-tieu-de-dau (`> 1` → `> 9`) đưa ĐÚNG lỗi cũ trở lại: với hai tiêu đề, code rơi về `indexOf(gan[0])`, lấy cái đầu là "không". Neo khớp 1 lần (cong.js:84). Dòng ĐẠT viết tay vẫn qua cổng; đây là điều đã biết (Phát hiện 2), không tính.
2. K4: các hàm cùng khuôn đọc mục phiếu là mucMien :58 và mucBaiThuCu :65, cả hai không đổi (Cấm A1–A19). Đã đổi đủ ba chỗ đọc "Soát bảo mật": cong.js:80-89, skill :86-87, MAU_PHIEU.md:64-67. THIET_KE.md:986 đã cập nhật "hơn MỘT mục". Chỗ chưa xử lý: chữ "mục lặp" chưa vào phép thu_cong_cu (lỗi 2).
3. K5: các luồng hợp lệ đi qua điều kiện mới: phiếu không có mục (59 phiếu, bản gốc thu_cong 337 · 0 theo bang_chung_do:12), `không — …` (ca :543), `- Có — tiền` (:544), có + ĐẠT, KHÔNG ĐẠT rồi ĐẠT, PR thêm ban_cai (:545-552), và chính phiếu TU-CHAY-10 (`không`, tinh không có A20). Không luồng nào bị chặn oan.
4. K1: chú thích cong.js:76-79 khớp code :80-89. Câu "8/8 BẮT" chưa có bằng chứng trong kho (lỗi 1).
5. Đường tiền: `git diff --stat abed525^ HEAD` không có server/ hay client/. Không áp.
6. P1: không đụng client/. Không áp.
8. Đơn giản: mucBaoMat gọn (9 dòng, một regex lọc, một phép đếm). Thông báo lặp nên tách riêng (lỗi 3).

NGHIỆM THU: 8/8 mục có bằng chứng · mục thiếu: không (✗ A8 / A19 chờ chủ quán / bước 11.4, đúng như dặn)
- A: tu_chay/lenh_soat_bao_mat.md:1-55 (frontmatter, nguồn MIT :7-8, bước 1-4, Tiền lệ :47-55) và :200-217 (lời nhắc gốc); thu_cong_cu.js:488-499.
- B: skill_lam_viec.md:70-71 (bước 4) và :86-92 (8b); thu_cong_cu.js:500-507 (thiếu "mục lặp", lỗi 2).
- C: cong.js:76-89 và :133-145, cả tinh lẫn chay (khối chạy trước `if (cheDo === 'tinh')`); thu_cong.js:519-552.
- D: MAU_PHIEU.md:64-67; thu_cong_cu.js:508-510.
- E: thu_cong.js:525-552 đủ 7 loại ca phiếu đòi, thêm 3 ca tiêu đề lệch và 1 ca lặp; bang_chung_do.txt.
- F: PHIEN_BAN `tu-chay 1.9.0`; THIET_KE.md:983-992; cau_hinh.json:16 (đúng một mục thêm); thu_nguoi_gac.js:800-803.
- G: trang_thai.md:142-149 (danh sách + grep). Mình grep lại phần thêm của tu_chay/: chỉ có `server/moi.js` trong ca thử thu_cong.js (lỗ có sẵn) và chính regex "không chữ POS".
- H: tự chạy thu_cong 390 · 0, thu_cong_cu 117 · 0, thu_nguoi_gac 1011/1011 · 182, npm test thoát 0.

CHƯA SOÁT ĐƯỢC:
- Không chạy dot_bien.py (bị dặn), `--day-du`, `cong.js chay`. Vì vậy chưa tự xác nhận "8/8 BẮT", và hồ sơ cũng không ghi kết quả này (lỗi 1).
- Không chạy được thu_cong.js gốc 9ce1a32 + bài HEAD (390 · 43), con số chỉ lấy từ bang_chung_do.txt:4-11.
- Không so từng byte lời nhắc với bản gốc Anthropic, và chưa chạy `/soat-bao-mat` thật (chưa cài).
- Không thấy được phiếu của việc đang chạy trên các nhánh khác, chỉ thấy 60 phiếu trong cây hiện tại.

BÀI HỌC:
- KHOÁ (thu_cong_cu.js): phép chữ có tên kể N trường hợp thì regex phải đòi đủ cả N chữ (thêm "mục lặp"). Kèm ca đột biến xoá "mục lặp" khỏi skill → phép phải ĐỎ.
- NGUYÊN TẮC (K3/A17): mỗi vòng sửa thêm đột biến mới thì cùng commit hồ sơ phải có hàng bảng "chỗ vá → đột biến" và kết quả lần chạy mới (đối chứng + từng dòng BẮT). Lời "n/n BẮT" chỉ nói miệng không phải bằng chứng.
- NGUYÊN TẮC (dễ hiểu, LUAT §8.1): mỗi nhánh đỏ của cổng có câu thông báo riêng, nói đúng chỗ phải sửa. Không dùng chung câu "viết đúng tiêu đề" cho trường hợp tiêu đề vốn đúng nhưng bị lặp.
```

## Vòng sửa 4 (LUAT_XAY_APP §6.5 — hết 3 vòng, lần soát cuối chỉ còn lỗi NHẸ → làm ngay trong phiếu, không gọi soát nữa)
- Lỗi 1 (hồ sơ chưa ghi đột biến lần 3): đã chép nguyên kết quả lần 3 ở trên; bảng "chỗ vá → đột biến" thêm hàng VS-A20-lay-tieu-de-dau,
  VS-A20-cau-lap-chung và đột biến tay của skill.
- Lỗi 2 (phép chữ không kiểm "mục lặp"): regex `thu_cong_cu.js` đòi thêm `mục lặp` ở cả b4 và s8b (`3d9713d`). Đột biến tay trên bản sao
  HEAD trong nháp: xoá "hay mục lặp" khỏi skill bước 4 → `thu_cong_cu: 117 phép · 1 chỗ hỏng` (đúng phép này) = BẮT; đối chứng (HEAD
  nguyên) 117 · 0.
- Lỗi 3 (câu báo mục lặp gây hiểu nhầm): ca ĐỎ trước — ca hai tiêu đề đòi câu "chỉ được MỘT mục ## Soát bảo mật" + "xoá tiêu đề thừa"
  (`4d5a31d`… commit thử trước vá; đỏ trên code vòng 2: 391 · 2). Vá: `mucBaoMat` trả `{ lap: n }`, cổng in câu riêng "có n tiêu đề giống
  "Soát bảo mật" — chỉ được MỘT mục ## Soát bảo mật (kể cả dòng nằm trong chú thích / khối mã): xoá tiêu đề thừa" (`810d223`).
  Đột biến mới VS-A20-cau-lap-chung (đưa lại câu chung).
- Không làm (lần soát chỉ ghi Nghi ngờ, không phải lỗi): kiểm phiếu sớm ở bước 2/3 (ngoài phiếu B); ranh giới chữ trong câu skill.

## Đột biến — lần 4 (sau vòng sửa 4, HEAD 43e95db, chép nguyên)
```
ĐỐI CHỨNG: thoát 0 → XANH
VS-A20-dong-dau: BẮT (thoát 1, ca "TU-CHAY-10 A20 ĐẠT rồi lần soát sau KHÔNG ĐẠT")
VS-A20-bo-ranh-gioi: BẮT (thoát 1, ca "TU-CHAY-10 A20 chữ dính")
VS-A20-bo-hoa-thuong: BẮT (thoát 1, ca "TU-CHAY-10 A20 K5 "- Có — tiền"")
VS-A20-chi-tinh: BẮT (thoát 1, ca "TU-CHAY-10 A20 có + trang_thai thiếu dòng (chay)")
VS-A20-dat-mot-phan: BẮT (thoát 1, ca "TU-CHAY-10 A20 có + KHÔNG ĐẠT")
VS-A20-tieu-de-sat-chu: BẮT (thoát 1, ca "TU-CHAY-10 A20 tiêu đề lệch "## Soát Bảo Mật"")
VS-A20-lay-tieu-de-dau: BẮT (thoát 1, ca "TU-CHAY-10 A20 hai tiêu đề ## Soát bảo mật")
VS-A20-cau-lap-chung: BẮT (thoát 1, ca "TU-CHAY-10 A20 hai tiêu đề ## Soát bảo mật")
BV-A20: BẮT (thoát 1, ca "TU-CHAY-10 A20 có + trang_thai thiếu dòng (tinh)")
```
Kiểm sau vòng 4: `thu_cong.js` 391 · 0 (gốc 391 · 44); bản gốc `thu_cong.js` trên code mới 337 · 0; `thu_cong_cu.js` 117 · 0 (gốc 117 · 8);
`thu_nguoi_gac.js` 1011/1011 · 182 phép khác; `npm test` PASS 87 · FAIL 0 · CẢNH BÁO 4; `npm test -- --day-du` PASS 91 · FAIL 0 · CẢNH BÁO 4.

SOÁT LẦN CUỐI: chat soát thay

## Bài học
- **KHOÁ (đã làm, trong Phạm vi):** cổng an ninh "bắt buộc khi có mục X" phải bắt RỘNG mục X rồi đòi đúng dạng, đúng MỘT — ca tiêu đề lệch
  (3 dạng) + ca hai tiêu đề trong `thu_cong.js`, đột biến VS-A20-tieu-de-sat-chu / VS-A20-lay-tieu-de-dau. Lý do: hai vòng soát liền
  bắt cổng "mở cửa" khi đọc sát chữ.
- **KHOÁ (đã làm):** phép chữ kể N trường hợp đòi đủ N chữ (`thu_cong_cu.js` "mục lặp") + đột biến tay xoá chữ → ĐỎ.
- **KHOÁ (đề xuất, ngoài Phạm vi — việc sau):** A20 gắn SHA như A19 (dòng `SOÁT BẢO MẬT: ĐẠT <SHA>`, không commit đổi code nào sau SHA);
  file `tu_chay/cong.js` + `thu_cong.js`, ca đỏ "ĐẠT <SHA cũ> rồi commit đổi server/". Hiện chỉ là lời dặn ở skill 8b.
- **KHOÁ (đề xuất, ngoài Phạm vi):** `kiem_tra_truoc_khi_giao.js:653` nâng `NGUONG_THU_CONG_DON_VI` 126 → 142 sau khi gộp (bộ kiểm tự in).
- **NGUYÊN TẮC (đề xuất cho `KHUON_LOI.md` K4 — ngoài Phạm vi):** "Đã gây: TU-CHAY-10 cổng A20 đọc tiêu đề sát chữ → `## Soát Bảo Mật`
  thành 'không có mục' (vòng 1); sửa xong lấy tiêu đề ĐẦU → mục 'không' che mục 'có' (vòng 2). Chặn: phép 'bắt buộc khi có mục X' nhận
  diện X rộng (hoa thường, mọi cấp #, có đuôi, lặp) rồi đòi đúng dạng + đúng MỘT; mỗi nhánh đỏ một câu báo riêng." Gộp vào một gạch của K4
  (không thêm dòng mới để giữ `khuon_loi_toi_da`).
- **NGUYÊN TẮC (đề xuất cho `KHUON_LOI.md` K3):** mỗi vòng sửa thêm đột biến → cùng commit hồ sơ ghi hàng bảng + kết quả chạy nguyên văn;
  đổi code vòng sửa → chạy lại đủ bộ đột biến (TU-CHAY-10 vòng 1: neo VS-A20-bo-hoa-thuong LẠC vì `exec(baoMat)` → `exec(baoMat.dau)`).
  Đã có ý gần ở K4 TU-CHAY-5 ("đổi tên phép → mẫu đột biến LẠC") — chỉ nối thêm ví dụ.
- **NGUYÊN TẮC (đề xuất cho K5, nối HOC-2b):** công cụ chép-rồi-sửa kiểm `realpath` đích TRƯỚC khi xoá / giải nén, so với gốc kho (không
  so `getcwd()`) — `dot_bien.py` vòng 1.
- **BỎ:** `thu_cong_cu.js` soi nhầm chuỗi ở dòng chú thích nguồn (K2 — truy nguyên trước, sửa sau; đã có khuôn K2, chỉ một lần).
- **BỎ:** người gác chặn `time`, `until`, `sed -i`, `rm -rf` trong nháp, `git -C`, script python nhắc file bảo vệ chưa commit, lệnh chạy
  script nối sau `git commit &&` — đều đúng luật đã có (B-CHUONGTRINH, SED-I, GIT-TUYCHON, B-MANOI, B-PHANTICH); làm lại theo hướng dẫn.
  Một lần chạy lại bị hỏng vì `rm -rf` bị từ chối nên dùng thư mục CŨ — phát hiện bằng grep nội dung trước khi tin kết quả, chạy lại
  thư mục mới.
- Dọn: không lời dặn nào trong `KHUON_LOI.md` / `CLAUDE.md` vừa có phép làm thay.

## Nghiệm thu — đếm từng mục
- A lệnh `/soat-bao-mat`: `tu_chay/lenh_soat_bao_mat.md` (bước 1 như /ra-soat + git log, bước 2 subagent, bước 3 lọc < 8, bước 4 ghi,
  Tiền lệ 5 dạng, nguồn MIT); phép `thu_cong_cu.js` "TU-CHAY-10 A …" ×4 (đỏ gốc, xanh HEAD); mục `ban_cai` thêm ở `cau_hinh.json`.
  So từng byte với bản gốc: CHƯA KIỂM.
- B skill 8b + câu bước 4: `tu_chay/skill_lam_viec.md` bước 4 và 8b; phép `thu_cong_cu.js` "TU-CHAY-10 B …" ×3 + đột biến tay.
- C cổng A20 tinh + chay: `tu_chay/cong.js` `mucBaoMat` + khối A20 trước `if (cheDo === 'tinh')`; ca `thu_cong.js` (thiếu dòng tinh /
  chay, KHÔNG ĐẠT, dòng cuối thắng, giá trị lạ, chữ dính, mục rỗng, tiêu đề lệch ×3, hai tiêu đề); DB A20 ×5; `dot_bien.py` 9/9 BẮT.
- D mẫu phiếu: `tu_chay/MAU_PHIEU.md` mục `## Soát bảo mật` trước `## Cấm`; phép "TU-CHAY-10 D MAU_PHIEU".
- E bài thử khung: `thu_cong.js` đủ 7 loại ca phiếu đòi (thiếu dòng → ✗; KHÔNG ĐẠT → ✗; ĐẠT → qua; lạ → ✗; không mục → qua (mọi ca cũ +
  bản gốc 337 · 0); không → qua; PR thêm ban_cai soat-bao-mat → qua); đỏ trên 1.8.1: `bang_chung_do.txt` (391 · 44).
- F: `PHIEN_BAN` = `tu-chay 1.9.0`; `THIET_KE.md` mục `### TU-CHAY-10 (01.11.2026, tu-chay 1.9.0)` (phép TU-CHAY-8 A5 xanh);
  `cau_hinh.json` đúng một mục thêm; `thu_nguoi_gac.js` danh sách trắng 4 mục (đỏ gốc, xanh HEAD).
- G: mục "Chép sang APP-KH" ở trên (danh sách + grep); phép "không chữ POS" của `thu_cong_cu.js`.
- H: `thu_cong.js` 391 · 0, bản gốc 337 · 0, `thu_nguoi_gac.js` 1011/1011 · 182, `thu_cong_cu.js` 117 · 0, `npm test` 87 · 0 FAIL,
  `--day-du` 91 · 0 FAIL; cổng chay ở dưới.
→ 8/8 mục có bằng chứng (A còn phần "so từng byte" ghi CHƯA KIỂM).

## Báo cáo 7 mục
```
VIỆC:        TU-CHAY-10 — Bộ khung 1.9.0: soát bảo mật tự động (/soat-bao-mat + skill 8b + cổng A20)
ĐÃ SỬA:      tu_chay/lenh_soat_bao_mat.md (mới) — lệnh soát bảo mật: diff theo mốc PHIEU, lời nhắc Anthropic (MIT), lọc báo nhầm < 8, Tiền lệ
             tu_chay/cong.js mucBaoMat + khối A20 — tiêu đề đúng MỘT "## Soát bảo mật", có/không; "có" → dòng SOÁT BẢO MẬT: cuối = ĐẠT
             tu_chay/skill_lam_viec.md — bước 8b; câu bước 4 thêm [A20] (đòi ĐẠT = bình thường; lỗi phiếu = hỏi ngay)
             tu_chay/MAU_PHIEU.md — mục ## Soát bảo mật; tu_chay/cau_hinh.json — một mục ban_cai; PHIEN_BAN 1.9.0; THIET_KE.md mục TU-CHAY-10
             tu_chay/thu_cong.js (ca A20 + DB), thu_nguoi_gac.js (danh sách ban_cai), thu_cong_cu.js (phép chữ lệnh / skill / mẫu)
BÀI THỬ:     chạy trên bản chưa vá (9ce1a32) → ĐỎ: thu_cong 391 · 44 (12 ca A20 "phải ĐỎ" thành ĐẠT), thu_nguoi_gac 1 (ban_cai), thu_cong_cu 117 · 8;
             sau khi vá → XANH (391 · 0, 1011/1011 · 182, 117 · 0); bản gốc thu_cong.js trên code mới 337 · 0; dot_bien.py 9/9 BẮT + đối chứng
ĐÃ RÀ K4:    grep "^#+\s*soát\s*bảo\s*mật" (iu) trong viec/**/phieu.md → 1 chỗ (phiếu này, đúng dạng); ba chỗ đọc "có" (cổng, skill 8b, mẫu
             phiếu) cùng một luật; đọc trang_thai bằng blob như A17/A19, không sửa A1–A19
CHƯA KIỂM:   /soat-bao-mat chưa chạy thật (chờ chủ quán cài bằng cai_dat; việc này ghi "không"); lời nhắc chưa so từng byte với bản gốc
             (lấy qua WebFetch); A20 không gắn SHA — sửa code sau lần soát mà quên soát lại thì cổng không thấy; dòng ĐẠT viết tay vẫn qua
             cổng; subagent lồng subagent (bước 3 lọc) chưa thử; thu_cong.js/thu_cong_cu.js khi chép sang APP-KH chưa chạy bên đó
GIT:         (xem git log --oneline -2 ở dòng dưới, ghi sau commit này)
BÀI HỌC:     KHOÁ 4 (2 đã làm, 2 đề xuất) · NGUYÊN TẮC 3 (đề xuất) · BỎ 2 — chi tiết ở ## Bài học
```
GIT (`git log --oneline -2` tại lần kiểm cuối):
```
fbb23b4 TU-CHAY-10: trang thai soat vong 3, vong sua 4, bai hoc, bao cao 7 muc
ab5dc44 TU-CHAY-10 vong sua 4: bang chung do (391)
```

## Cổng chạy (bước 11.4) — `node tu_chay/cong.js chay . abed525^ HEAD viec/TU-CHAY-10` tại fbb23b4, cây sạch
- `✗ [A8] bản cài lệch kết quả cai_dat.js: .claude/commands/soat-bao-mat.md, .claude/skills/lam-viec/SKILL.md, .claude/tu_chay/MAU_PHIEU.md,
  .claude/tu_chay/PHIEN_BAN, .claude/tu_chay/THIET_KE.md, .claude/tu_chay/cau_hinh.json, .claude/tu_chay/cong.js, .claude/tu_chay/lenh_soat_bao_mat.md, …
  — chủ quán chạy bash tu_chay/cai_dat.sh trên nhánh việc` → ✗ [A8] chờ chủ quán cài (việc sửa `tu_chay/`, bình thường).
- `✗ CỔNG ĐỎ (CHẠY) — 1 lý do` (chỉ A8). Không ✗ A11 / A12 / A13 / A16 / A20.

HEAD ĐÃ KIỂM: fbb23b4
