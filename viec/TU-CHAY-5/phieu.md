# TU-CHAY-5 — Việc bộ khung: siết lưới bất biến, vá lỗ người gác / cổng / công cụ, máy tự nhận nhánh có commit mới

<!-- Phiếu do chat soạn 11.10.2026. Nền: main sau sổ việc v26 (cha befc6ad = Merge PR #13 TACH-GL, bộ khung tu-chay 1.4.0).
     Nguồn: viec/TACH-GL/trang_thai.md (Phát hiện 2–5, Bài học), viec/HOC-2/trang_thai.md (Phát hiện 2, 3, 5),
     viec/HOC-2b/trang_thai.md (P2), bàn giao bản 18 (mục 0, 0b, 5). Chat chạy thử 11.10 trên befc6ad (người gác thật,
     kho thử nhánh viec/TU-CHAY-5 có phiếu):
       - `git rm <file trong Phạm vi>` → CHẶN GIT-LENH; `rm <file trong Phạm vi>` → CHẶN RM-NHAP (chỉ xoá trong nháp);
         `git add <file đã xoá>` → CHO. Tức là hiện máy KHÔNG có đường nào xoá một file trong Phạm vi.
       - Công cụ `TaskStop` → CHẶN CC-LA. `git fetch origin viec/<MÃ>` và `git ls-remote origin` → CHẶN GIT-LENH.
       - 2237259 (PHIEU: TACH-GL, bản phiên claude.ai/code nạp sai) là tổ tiên của 443f41b (51 commit sau) → nhánh trên
         GitHub đi-trước-nhanh (fast-forward) được từ bản phiên nạp.
       - `cong_cu/thu_gia_lap.js:62–63` (`chayGL`) cộng thẳng Buffer vào chuỗi, không setEncoding.
       - `node viec/LUOI-1/do_thoi_gian.js kb` ném "neo đo không khớp: const tong = `Giả lập:" (thoát 1).
       - `tu_chay/THIET_KE.md:386` "Đo: giả lập 22 s, `cong_cu/thu_gia_lap.js` 24 s"; `:388` "Bánh cóc: số kịch bản ≥ 11, số bất
         biến ≥ 9" — lệch thật (`kiem_tra_truoc_khi_giao.js:753–754` NGUONG_KICH_BAN = 29, NGUONG_BAT_BIEN = 16).
       - Lớp 1 (deny trong `.claude/settings.json`, nguồn `tu_chay/cai_dat.js:28`) có `Bash(git merge *)` và `Bash(git reset *)`
         → mọi lệnh `git merge …` bị chặn TRƯỚC người gác. `git pull --no-rebase --ff-only origin <nhánh>` không khớp deny nào;
         chat thử trên kho giả (git 2.43, có cả `pull.rebase=true`): nhánh đi sau → đi tới đúng commit GitHub; nhánh lệch hai
         phía → git từ chối (thoát 128), nhánh local giữ nguyên.
       - Bộ kiểm cảnh báo "… khớp từng byte với tu_chay/…" (`kiem_tra_truoc_khi_giao.js:575, 589, 601–603`) khi nguồn `tu_chay/`
         khác bản đã cài trong `.claude/` — việc nào sửa `tu_chay/` cũng gặp tới khi chủ quán chạy `cai_dat.sh` sau gộp. -->

**Chờ duyệt kế hoạch:** viết `viec/TU-CHAY-5/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.
Chưa viết bài thử, chưa sửa code cho tới khi chủ quán gửi lời duyệt.

## Mục tiêu
Gom MỘT lần mọi lỗ bộ khung còn mở (một lần `cai_dat.sh`), trước AUDIT-2 và P26c — hai việc đó sẽ thêm bất biến, kịch bản và
đột biến, nên lưới phải chắc trước:
(1) mọi vế của bất biến tiền và mọi phép so bằng tiền đều có đột biến bắt (bất biến "nhiều vế, có vế không ai giết" là lỗi máy
lặp lại ở LUOI-1 vòng 1–3); (2) máy xoá được file trong Phạm vi, dừng được tác vụ nền của chính mình; (3) cổng bắt hồ sơ cũ hơn
code và số ca tự sửa tay; (4) phiên claude.ai/code nạp bản cũ của nhánh thì máy TỰ nhận ra và đi-trước-nhanh tới đúng bản
GitHub (TACH-GL: phiên mới vẫn nạp `2237259`, máy không đo được); (5) sửa các công cụ đã hỏng/yếu; (6) tài liệu đúng số thật.

## Nghiệm thu

### A. Lưới bất biến (`cong_cu/gia_lap/bat_bien.js`) — công cụ mới `cong_cu/gia_lap/dot_bien_bb.py`
- A1 Công cụ TỰ SINH đột biến từ mã nguồn `bat_bien.js` (không gõ tay từng cái): (a) bỏ từng vế của mỗi `||` / `&&` trong
  phần JS và mỗi `OR` / `AND` trong mệnh đề `WHERE`/`ON`/`CASE` của câu SQL — "bỏ vế" = thay vế đó bằng giá trị làm nó vô hiệu
  (vế của `||`/`OR` → false, vế của `&&`/`AND` → true); (b) mỗi phép so BẰNG / KHÁC trên số tiền, số lượng, điểm (`===`, `!==`,
  `=`, `<>`, `Math.abs(…) > 0.5`, …) → hai đột biến MỘT CHIỀU (chỉ bắt lệch dương / chỉ bắt lệch âm). Tên đột biến tất định
  (bất biến + số thứ tự vế + dạng), in kèm `bat_bien.js:<dòng>`. Đột biến chạy trên BẢN SAO (không sửa bản thật), BẮT = giả lập
  hoặc `thu_gia_lap.js` đỏ đúng bất biến đó (không tính đỏ vì sập/lỗi cú pháp — loại đó in riêng là LẠC). Có `-j N`, `--chi <mẫu>`,
  `--liet-ke` (chỉ in danh sách, không chạy).
- A2 Chạy đủ trên HEAD của việc. Mỗi đột biến SỐNG phải được xử lý đúng MỘT cách, ghi trong `trang_thai.md`: (a) thêm ca dữ liệu
  tay vào `thu_gia_lap.js` làm nó BẮT (so bằng tiền: đủ hai ca lệch +1 và −1); (b) vế THỪA → xoá vế, hoặc giữ kèm chú thích
  `// thừa vì … (<file>:<dòng> code thật) — ca: <tên ca chứng minh>` và tên đột biến vào danh sách miễn của công cụ (đọc chú thích,
  không danh sách tay riêng); (c) SỐNG vì code quầy đang SAI → DỪNG, ghi `## Câu hỏi` (không sửa `server/`, không sửa bất biến
  cho né). Kết thúc: 0 SỐNG chưa xử lý, 0 LẠC. Số đột biến sinh ra / BẮT / miễn ghi vào `trang_thai.md` và THIET_KE B10.
- A3 Ca "chồng nhau" (hai người cùng bấm) phải thật sự chạy khi CÒN việc để làm: máy liệt kê MỌI ca chồng trong
  `cong_cu/gia_lap/kich_ban.js` (file:dòng), mỗi ca ghép với một đột biến BỎ KHOÁ trên bản sao `server/` (bỏ kiểm lại trong
  giao dịch / bỏ khoá ghi) phải ĐỎ. Đột biến đã có ở `viec/*/dot_bien.py` thì dẫn tên; chưa có thì thêm vào
  `viec/TU-CHAY-5/dot_bien.py`. Ca chồng nào không có khoá tương ứng để bỏ → ghi lý do trong bảng. Ca nào SỐNG (ca chạy tuần
  tự, không chồng thật) → ghi `## Phát hiện` kèm file:dòng + đột biến chứng minh, KHÔNG sửa `kich_ban.js` ở việc này (gom P26c).
- A4 `tu_chay/skill_lam_viec.md` bước 4 + `tu_chay/lenh_ra_soat.md`: việc đổi `bat_bien.js` thì phải chạy `dot_bien_bb.py` đủ
  và ghi kết quả; người soát kiểm điều đó.

### B. Người gác (`tu_chay/nguoi_gac.js`, ca thử trong `tu_chay/thu_nguoi_gac.js`, đỏ trên gốc)
- B1 `git rm <file>` cho qua khi: đúng một hoặc nhiều tên file viết thẳng, mỗi file đang được theo dõi và nằm trong Phạm vi
  (luật xét như sửa file: file luật phải ghi đúng tên, file cấm / bí mật / `phieu.md` / `.claude/` vẫn chặn); tuỳ chọn chỉ `-q`.
  Chặn: `-r`, `-f`, `--cached`, thư mục, glob, `--pathspec-from-file`, file ngoài Phạm vi, đường ngoài kho. Mỗi vế một ca.
- B2 `TaskStop` cho qua (công cụ Claude Code dừng tác vụ nền do chính phiên mở — cần khi một lệnh nền treo). Ca cho qua.
- B3 (môi trường claude.ai/code) ĐÚNG HAI dạng mới, chỉ khi nhánh đang đứng là `viec/<MÃ>` có phiếu, chạy trong kho:
  `git fetch origin viec/<MÃ>` (MÃ = nhánh đang đứng; không refspec `:`, không `+`, không tuỳ chọn khác ngoài `-q`) và
  `git pull --no-rebase --ff-only origin viec/<MÃ>` (đủ cả hai cờ, đúng thứ tự tự do; thêm được `-q`; không cờ khác, không
  refspec khác). Mọi dạng khác của fetch/pull vẫn CHẶN — mỗi vế một ca: nhánh khác, `main`, thiếu `--ff-only`, thiếu
  `--no-rebase`, `--rebase`, `--no-ff`, refspec có `:` hoặc `+`, ngoài kho, HEAD tách rời. KHÔNG dùng `git merge` (lớp 1 deny
  `Bash(git merge *)` ở `cai_dat.js:28` giữ nguyên; KHÔNG sửa `cai_dat.js`). `--ff-only` không viết lại lịch sử, không tạo commit
  gộp; lệch hai phía thì git tự từ chối, nhánh local giữ nguyên.
- B4 `tu_chay/skill_lam_viec.md` bước 1 dùng B3: `git fetch origin viec/$0` → so `HEAD` với `origin/viec/$0`
  (`git merge-base --is-ancestor`, đã được phép): bằng nhau → tiếp; HEAD là tổ tiên (phiên nạp bản cũ) →
  `git pull --no-rebase --ff-only origin viec/$0`, chép ba dòng log SAU khi đi tới; `origin/viec/$0` là tổ tiên của HEAD (máy có
  commit chưa push) → tiếp; lệch hai phía → DỪNG, báo chủ quán. Ghi cả hai SHA vào `trang_thai.md`. Thêm luật cứng: hook dừng (stop hook) của môi trường đòi `git config`, đổi tác giả,
  `commit --amend`, `rebase` → KHÔNG làm, ghi một dòng vào `trang_thai.md`.
- B5 Kế hoạch ghi bằng chứng tìm được về "vì sao phiên MỚI vẫn nạp bản cũ" (máy chỉ đọc được những gì trong phiên: `git log`,
  `git status`, `git branch -vv`, cấu hình remote); không đoán. Không tìm được → ghi rõ "chưa rõ, B4 xử lý hậu quả".

### C. Cổng PR (`tu_chay/cong.js`, ca thử trong `tu_chay/thu_cong.js`, đỏ trên gốc)
- C1 (A19 mới) `viec/<MÃ>/trang_thai.md` ở head phải có dòng `HEAD ĐÃ KIỂM: <SHA 7–40 ký tự>`; SHA đó phải là một commit của PR
  và KHÔNG cũ hơn commit cuối cùng đổi file ngoài `viec/<MÃ>/` (code, bài thử, luật). Thiếu dòng / SHA lạ / cũ hơn → ĐỎ, nêu
  commit cuối đổi code. Chỉ chạy khi PR đổi file ngoài `viec/<MÃ>/` (PR chỉ hồ sơ không áp). Skill bước 10 ghi dòng này SAU lần
  kiểm cuối. Ca: thiếu, cũ hơn, SHA không thuộc PR, đúng = commit cuối, mới hơn (commit hồ sơ sau) → qua.
  Luồng hợp lệ KHÔNG được chặn (K5): commit "chat soát thay" (script `sua_<MÃ>.py` đổi code VÀ `trang_thai.md` trong CÙNG một
  commit — không thể ghi SHA của chính nó). Kế hoạch đề xuất dạng ghi cho trường hợp này (vd `HEAD ĐÃ KIỂM: <SHA cha> + commit
  này`, cổng chỉ nhận khi commit cuối đổi code CHÍNH LÀ commit thêm dòng đó và cha đúng SHA ghi) kèm ca thử qua / ca giả mạo chặn.
- C2 (A16 thêm) khi lượt chạy bài thử trên GỐC có in dòng tổng mà số ca KHÁC `SỐ CA` khai ở `bang_chung_do.txt` → CẢNH BÁO
  (không đỏ — bài đỏ trên gốc có thể dừng sớm). Ca: khớp → không cảnh báo; lệch → cảnh báo nêu cả hai số.
- C3 A18 vẫn KHÔNG chạy đột biến trong cổng (chạy `dot_bien.py` = chạy code PR hàng chục phút; lớp canh là `/ra-soat` + chat
  soát cuối). Ghi rõ giới hạn này ở THIET_KE B15 — chat đã chốt, không làm khác.

### D. Công cụ
- D1 `cong_cu/gia_lap/chay.js`: tiến trình lượt chỉ nhận `--kho` khi có kênh IPC (do cha sinh); gọi thẳng `--luot k --kho …`
  không IPC → TỪ CHỐI thoát 3, kho đó còn nguyên. Sửa T7a/T7b của `thu_gia_lap.js` để sinh lượt CÓ IPC (mỗi ca vẫn vi phạm
  đúng một vế) + ca mới "không IPC + --kho hợp lệ của giả lập khác → TỪ CHỐI, kho còn nguyên" (đỏ trên gốc).
- D2 Lối "lượt con TỪ CHỐI → cha dừng mọi lượt, thoát 3, dòng cuối TỪ CHỐI" có ca thử trong `thu_gia_lap.js` và đột biến
  (xoá dòng `if (ma === 3) dungHet(cuoiCon, 3);` → ca đỏ). Cách gây con từ chối: kế hoạch đề xuất (không thêm cửa sau vào
  `chay.js` chỉ để thử, trừ khi không còn cách — khi đó ghi lý do).
- D3 `cong_cu/thu_gia_lap.js` `chayGL` (và mọi chỗ cùng khuôn trong file) đọc đầu ra con bằng `setEncoding('utf8')` hoặc
  gom Buffer rồi giải một lần. Ca tất định đỏ trên gốc: con giả in chuỗi tiếng Việt bị cắt giữa ký tự qua hai lần ghi → bản gốc ra
  ký tự hỏng, bản sửa ra đúng.
- D4 `viec/LUOI-1/do_thoi_gian.js kb` chạy lại được sau chia lượt: in thời gian từng KB của MỌI lượt (chèn mốc vào bản sao
  `chay.js`, chạy từng lượt `--luot k`). Neo rữa → báo lỗi rõ, thoát ≠ 0 (như hiện nay). Ca: chạy thật trên HEAD in đủ 29 dòng
  `DO KB`.
- D5 `viec/HOC-2b/kiem_neo.py` rà thêm `viec/LUOI-1/dot_bien.py`, `viec/TACH-GL/dot_bien.py`, `viec/TU-CHAY-5/dot_bien.py` và mọi
  `viec/*/do_*.js` có bảng neo; rà cả MẪU nhận kết quả (không chỉ neo) khi bộ đó có mẫu tĩnh. Chạy trên HEAD: kết quả ghi trong
  `trang_thai.md`; rữa nào là CỐ Ý (vd `G3-sai-chuoi`) phải đánh dấu trong `kiem_neo.py`, còn lại 0 HỎNG. Không đưa vào `npm test`
  (việc sau đổi code sẽ làm rữa neo cũ hợp lệ).
- D6 `cong_cu/ban_sao_goc.py` thêm chế độ CẢ KHO (`--ca-kho`): dựng bản sao toàn kho của một commit bằng `git archive` (không
  `git clone`, không `checkout -f` — người gác chặn), vẫn giữ mọi luật đích hiện có. Ca trong `baiBanSaoGoc` (`thu_nguoi_gac.js`).

### E. Tài liệu và bài học
- E1 `tu_chay/THIET_KE.md:386,388`: thay số cũ bằng cách nói không trôi (trỏ tới `NGUONG_KICH_BAN` / `NGUONG_BAT_BIEN` của bộ kiểm
  và số đo mới nhất có ngày), bánh cóc như thật. B10 thêm `dot_bien_bb.py` (A1) và cách chia lượt; B15 thêm A19 + giới hạn C3;
  phần người gác thêm B1–B3.
- E2 `KHUON_LOI.md` (trần 120 dòng, hiện 92) — thêm nếu chưa có khuôn tương đương, gộp nếu vượt, KHÔNG nới số:
  K3 "sửa lỗi người soát báo → đột biến phải đưa ĐÚNG lỗi cũ trở lại, không chỉ gỡ phép vừa thêm (TACH-GL T9)";
  K4 "thêm cờ nội bộ cha→con → rà mọi đường argv (chuyển tiếp, lấy lần đầu, phép cấp module chạy cả ở cha) (TACH-GL `--kho`)";
  "ca TỪ CHỐI so đúng câu của phép đang thử + dấu vết không xảy ra (TACH-GL T9 vòng 3)";
  "ca tín hiệu / thời gian không chạy chung đợt nặng; nghi thì chạy lặp ≥ 3 lần (TACH-GL T3 đỏ oan 1/3)";
  "dòng mới ở ĐỈNH file (ngoài try) → tự hỏi nó ném thì thoát mã gì (TACH-GL T10)".
- E3 `tu_chay/PHIEN_BAN` → `tu-chay 1.5.0`. `tu_chay/MAU_PHIEU.md` nhắc dòng `HEAD ĐÃ KIỂM` (C1) và `dot_bien_bb.py` (A4).

### F. Toàn bộ
`npm test`, `node kiem_tra_truoc_khi_giao.js --day-du` xanh, 0 CẢNH BÁO lúc chạy riêng — trừ đúng các cảnh báo "khớp từng byte
với tu_chay/…" (bản cài lệch nguồn, chủ quán cài sau gộp; liệt kê đủ trong `trang_thai.md`); `thu_nguoi_gac`, `thu_cong`,
`thu_cong_cu`, `thu_gia_lap` xanh; ca tín hiệu/thời gian chạy ≥ 3 lần riêng. Mọi đột biến cũ đang BẮT vẫn BẮT
(`viec/TACH-GL/dot_bien.py` 29/29, `viec/LUOI-1/dot_bien.py` 80/80 — hoặc ghi rõ đột biến nào đổi mong đợi và vì sao).
Mỗi nhóm A–D có ca đỏ trước ghi trong `trang_thai.md` kèm lệnh chạy lại. Kế hoạch ghi ước lượng thời gian máy (đo, không đoán);
quá ~180 phút → đề xuất tách trong `## Câu hỏi`, KHÔNG tự cắt mục.

## Phạm vi
- viec/TU-CHAY-5/**
- tu_chay/nguoi_gac.js
- tu_chay/thu_nguoi_gac.js
- tu_chay/cong.js
- tu_chay/thu_cong.js
- tu_chay/thu_cong_cu.js
- tu_chay/skill_lam_viec.md
- tu_chay/lenh_ra_soat.md
- tu_chay/MAU_PHIEU.md
- tu_chay/THIET_KE.md
- tu_chay/PHIEN_BAN
- cong_cu/gia_lap/dot_bien_bb.py
- cong_cu/gia_lap/chay.js
- cong_cu/gia_lap/bat_bien.js
- cong_cu/thu_gia_lap.js
- cong_cu/ban_sao_goc.py
- viec/LUOI-1/do_thoi_gian.js
- viec/HOC-2b/kiem_neo.py
- KHUON_LOI.md

## Ngân sách
Bộ khung ~200 dòng code: người gác +~60 (B1–B3), cổng +~40 (C1, C2), `chay.js` ±~10, `thu_gia_lap.js` ±~60, `ban_sao_goc.py`
+~30, `do_thoi_gian.js` ±~30, `kiem_neo.py` +~40. Công cụ mới `dot_bien_bb.py` ~180. Thử ~200 dòng (`thu_nguoi_gac` ~90,
`thu_cong` ~80, `thu_gia_lap` ~30 + ca dữ liệu tay của A2 tuỳ số SỐNG). Tài liệu ~80. `bat_bien.js` chỉ chú thích / bỏ vế thừa.
Cổng của chính PR này chấm bằng luật main (tu-chay 1.4.0): mọi `thu_*.js` sửa phải ĐỎ trên gốc và có `SỐ CA` (A16).

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `server/`, `client/`, `.claude/`, `.github/`, `package.json`, `CHECKLIST_CODE.md`, `CLAUDE.md`, `ban_mau_pos/`,
  `cong_cu/gia_lap/kich_ban.js`, sổ việc. Không chạy `cai_dat.sh`, `xem_thu.sh`.
- Không NỚI luật người gác hay cổng ngoài đúng B1–B3 (mỗi dạng mới hẹp nhất có thể, có ca chặn cho từng vế lân cận). Không mở
  `git clone`, `checkout -f`, `reset`, `merge`, `config`, `rebase`, `--amend`; `pull` chỉ đúng dạng B3.
- Không nới hạn (120 s bộ kiểm, 110 s giả lập con), không hạ ngưỡng `han * 0.8`, không giảm trễ 40 ms, không bớt kịch bản /
  bất biến / `c.mong`; bánh cóc chỉ tăng. Bỏ vế thừa ở `bat_bien.js` chỉ khi có ca chứng minh (A2 b).
- Không đổi phần A1/A2 của `chay.js` theo hướng yếu đi.
- Đột biến lộ code quầy đang sai → DỪNG, ghi `## Câu hỏi`; không sửa `server/`, không viết bất biến/ca né chỗ sai.
- Chỉ push đúng `git push -u origin viec/TU-CHAY-5`. Không đụng `main`, không merge, không tạo PR. Không chạy `patch_*.py`.
