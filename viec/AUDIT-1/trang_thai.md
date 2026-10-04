# AUDIT-1 — trạng thái

## Bản chụp lúc mở việc (04.10.2026)
```
$ git branch --show-current
viec/AUDIT-1
$ git log --oneline -3
ac7f2d0 PHIEU: AUDIT-1
b94110e TIEN-DO: P26b xong (c3d5816), them P26c + P26d, bo sung HOC-2 — so v19
c3d5816 Merge pull request #8 from pos-tuquyduong/viec/P26b
```
Có commit `PHIEU: AUDIT-1` → đúng việc.

## Bản chụp lúc làm tiếp (04.10.2026, sau duyệt kế hoạch)
```
$ git branch --show-current
viec/AUDIT-1
$ git log --oneline -3
b9759cf AUDIT-1: trang thai — vong soat ke hoach, phat hien ghi san
fa17b35 AUDIT-1: ke hoach §8 — sua theo vong soat (E1 khong goi tai_cho, A15, ma NG loi hook, TMPDIR)
08fb596 AUDIT-1: trang thai buoc 1-3, cau hoi thoi gian
```
Chủ quán duyệt kế hoạch tại b9759cf (§8 thắng), Câu hỏi thời gian = (a) chạy đủ. Thêm 5 dặn: D1 đột biến chỉ vào
thứ phép soi; C2 NẶNG chỉ sau tầng 2 + dòng "ở quầy sẽ sai gì"; thu_p1.js KHÔNG chạy, xếp mức bằng đọc code;
LẠC/TREO chạy lại -j 1 một lần; vượt ước lượng 1,5 lần thì ghi số đo, làm tiếp.

## Tiến độ
- [x] Bước 1 — đối chiếu bản chụp
- [x] Bước 2 — đọc phiếu, CLAUDE.md, KHUON_LOI.md, đo kích thước + thời gian từng nhóm
- [x] Bước 3 — `ke_hoach.md` (soát bằng agent chỉ đọc) — **DỪNG chờ chủ quán duyệt** (phiếu: "Chờ duyệt kế hoạch")
- [ ] G3 công cụ đo tự chứng minh → `bang_chung_do.txt`
- [x] Nhóm A · [x] B · [x] C · [x] D · [x] E · [x] F · [x] báo cáo G1 · [x] soát G4 · [x] bài học

## Câu hỏi
1. Tổng thời gian máy ước lượng ~95 phút, sau sửa §8 còn ~85 phút (phiếu: > 90 phút thì hỏi). Cách cắt đề xuất ở `ke_hoach.md` §5 —
   chủ quán chọn (a) chạy đủ theo nhóm, hoặc (b)/(c). Chưa duyệt thì không chạy.

## Sự cố (đầu vào bài học)
- Bước 2: người gác chặn 3 lệnh đo của chính tôi — `$(( ))` và `( … )` giữa lệnh (B-PHANTICH), `for`/`nproc`
  (B-CHUONGTRINH). Đúng luật; đổi sang script node trong nháp. Dự kiến xếp BỎ (thói quen viết lệnh, không phải lỗ).
- Bước 3: agent chỉ đọc soát kế hoạch, bắt 1 lỗi ra ngoài phạm vi (E1 định gọi nguyên `viec/TU-CHAY-4/dot_bien.py` —
  bài này sửa thẳng file thật), 3 cách làm không chạy được ("nạp `CA`/`laBaiThu`" — không được xuất; "`tat` có sẵn cho
  mọi mã A*" — thiếu A3–A5), sót A15, 4 mã NG chỉ có ở lối hook, TMPDIR khi TREO. Đã kiểm lại bằng code rồi ghi vào
  `ke_hoach.md` §8. Dự kiến xếp: NGUYÊN TẮC (K1 — kế hoạch khẳng định "gọi nguyên / nạp / có sẵn" mà chưa đọc code
  đích; đề xuất câu dẫn trong KHUON_LOI K1, không sửa KHUON_LOI ở việc này).
- Bước 3: người gác chặn thêm `$'…'` (B-PHANTICH) — cùng loại sự cố bước 2.


## Soat doc lap (/ra-soat, agent general-purpose, 04.10.2026) -- KHONG DAT (vong 1)
Cong cu do TRUNG THUC (G3 dung; 10 dot bien ngau nhien 10/10 BAT; 6 phat hien kiem lai dung), NHUNG 3 diem phai sua:
1. LOI (K8/K3) -- bao_cao.md K5 + dot_bien.py anh_kho(): anh K5 gop nhat ky nguoi gac (ghi MOI lenh Bash cua phien).
   Co hoat dong song song khi dot_bien.py chay -> in "KHO BAN" thoat 3 OAN (git status that sach). Agent gap 2/2 lan.
   -> phai loai nhat ky nguoi gac khoi anh K5.
2. NGHI NGO -- "ngat giua chung -> 0 sot" noi qua: chi SIGINT/SIGTERM duoc bat, SIGKILL/OOM khong. -> sua thanh SIGINT/SIGTERM.
3. LO MOI (quan trong) -- server/routes/loyalty.js:170,179,189 POST /redeem: khach doi diem->voucher TAI QUAY
   (authenticateServiceOrUser), KHONG KB/bat bien nao phu (I8 chi soat earn, redeem co order_id=NULL nen bi loai).
   c_bang.md xep nham vao "admin config NHE CHUA KIEM". Theo dinh nghia phieu (sai diem/ma uu dai o quay) day la
   duong tien -> phai xep CHUA KIEM UU TIEN. De xuat HOC-2: them KB doi-thuong + bat bien "moi voucher_grant co dung
   mot redeem tru diem khop, discount_value = reward".
Da sua ca 3 trong vong nay (commit "ra-soat vong 1").

## Phát hiện ghi sẵn (chưa chấm, kiểm lại khi chạy nhóm tương ứng)
- `kiem_tra_truoc_khi_giao.js:746` ghi giả lập 22 s / thu_gia_lap 24 s; đo 04.10: 67,6 s / 70,6 s — hạn 110/120 s (C3).
- `tu_chay/thu_cong.js:336-347` không có ca `tat` cho A3, A4, A5 (B1).
- `viec/TU-CHAY-4/dot_bien.py:56-63` đột biến sửa THẲNG file thật (E).
- `cong_cu/thu_p1.js` ghi kho thật nhưng nằm trong `thu_muc_bai_thu` (B3).

## Bai hoc (buoc 11 — dau vao cho muc BAI HOC cua bao cao 7 muc; de xuat ngoai Pham vi KHONG tu lam)

Su co gom duoc:
- Nguoi gac chan nhieu lenh DO cua chinh toi: `for`/`$(( ))`/`$()`/`$'...'` (B-PHANTICH, B-CHUONGTRINH), heredoc nhac
  nhat ky nguoi gac / environ (B-MANOI, B-BIMAT-CHU), `git fetch` (GIT-LENH), `rmdir`/`wait` (B-CHUONGTRINH). Deu dung
  luat; da doi sang script python trong nhap.
- Dung dot bien sai lan dau: B1-A11-dao-goc HONG (chuoi goc sai), B1-A14-bo-dang-nhanh LAC roi SONG (dot bien qua rong
  -> thu hep dung cong A14 dang-nhanh). Da sua chuoi/thu hep roi chay lai.
- Agent soat (/ra-soat) bat 3 diem: (a) anh_kho() gop nhat ky nguoi gac -> bao "KHO BAN" OAN khi co hoat dong song song
  (khuon K8); (b) cau "ngat giua chung -> 0 sot" noi qua (chi SIGINT/SIGTERM); (c) loyalty redeem xep nham admin NHE,
  thuc ra la duong tien CHUA PHU (AU-G1 NANG).
- Dot bien/ho so CU rua theo thoi gian: I10-bo (chuoi khop 2 lan sau khi I11 them cung dong), MB/MB4 (file_luat moc
  them sau "package.json") — deu HONG tren HEAD du ho so ghi "dat".

Xep ngan:
- KHOA (da lam trong Pham vi viec nay):
  * dot_bien.py anh_kho() LOAI nhat ky nguoi gac khoi anh K5 — het bao oan "KHO BAN" (khuon K8). Co ca G3 chay lai xac nhan.
  * them dot bien C2-loyalty-redeem-tru-0 -> do duoc lo loyalty redeem (SONG), bien lo agent neu ra thanh so do duoc.
- KHOA (de xuat HOC-2, ngoai Pham vi — khong tu sua server/, tu_chay/, bo kiem):
  * bat bien giả lập cho loyalty redeem + KB doi-thuong (dong AU-G1); I8 noi soat ca dong redeem (order_id NULL).
  * thu_nguoi_gac khoa noi dung CONG_CU_DOC/CONG_CU_SUA bang tap co dinh (AU-A1).
  * thu_cong them ca cong A14 dang-nhanh rieng (AU-B1); sua neo I10-bo/MB/MB4 (AU-C1/E1/E2); nang T2-T4 thanh fail (AU-D2).
  * them cong_cu/thu_P20..P26b vao file_luat (AU-B3c); them ban_mau_pos/thu vao thu_muc_bai_thu (AU-B3b); doi ten thu_p1.js (AU-B3).
- NGUYEN TAC (de xuat KHUON_LOI, ngoai Pham vi — KHUON_LOI dang 120/120, khong tu sua, ghi de xuat):
  * (khuon K8 san co) Phep tu-kiem bao dong OAN trong dieu kien binh thuong day nguoi bo qua no -> mat canh bao that.
    Vi du that: anh_kho() cua AUDIT-1 gop nhat ky nguoi gac -> "KHO BAN" oan 2/2 lan agent chay. Chan: anh chup chi
    gom thu dot bien THUC SU co the doi (data/, git), khong gom file ghi hoat dong CA PHIEN.
  * (khuon K3, bo sung) Dot bien/ho so coi la DAT bi RUA theo thoi gian: neo bang chuoi dai di qua nhieu muc -> muc
    khac doi la HONG am tham ma ho so van ghi "dat". Vi du that: I10-bo, MB, MB4. Chan: moi con so "dat" phai kem lan
    CHAY LAI tren HEAD hom nay; neo dot bien NGAN/RIENG (WHERE cua chinh bat bien), khong om ca cau di qua nhieu muc.
  * (khuon K1/K5) Phan loai "duong tien" vs "admin config" theo DOI TUONG co gia tri tai chinh KHACH CHAM o quay,
    khong theo "co trong 18 KB hay chua". Vi du that: loyalty redeem (khach doi diem lay voucher) bi xep nham admin NHE.
- BO (chi xay ra mot lan):
  * Thoi quen viet lenh shell ghep (for/$()/heredoc) bi nguoi gac chan — da biet dung script python trong nhap.
  * git fetch/rmdir/wait bi chan — dung ref co san (b94110e lam moc B4), bo qua rac /tmp.

Moi de xuat NGOAI Pham vi (KHUON_LOI/CLAUDE.md/server/tu_chay/bo kiem): chat soat duyet, gom vao HOC-2 hoac phieu HOC-<n>.
AUDIT-1 KHONG tu sua.

## G5 — moi ten dot bien trong dot_bien.py (41 ten; co mat o trang_thai nay cho HOC-2)
G3-sai-chuoi G3-da-biet G3-vo-hai G3-sap A3-GITADD-bo-A A3-GITCOMMIT-bo-a A3-GITPUSH-moi-nhanh A3-SED-i-ngan A3-RM-bo-realpath A3-CURL-moi-host A3-LN-dao-s A3-G1CAM-theoten A3-FINDCAM-bo-delete A3-NPM-them-install A3-MKDIR-bo-khung A3-TARX-moi-dich A3-FILEC-bo-ngan A3-BGAN-bo-PATH A3-CCLA-them-la A3-GHIDUOC-bo-khung B1-A11-dao-goc B1-A11-bo-xanh-PR B1-A6-bo-phamvi B1-A10-bo-filecam B1-A7-noi-tieude B1-A12-bo B1-laBaiThu-noi-slash B1-A14-bo-dang-nhanh C2-orders-bo-diem-ban C2-sc-bo-diem-ma C2-loyalty-redeem-tru-0 D1-A1-fffd D1-B1-json-tran D1-C1-them-fetch D1-E1-unitprice D1-E7-paydebt D1-E8-backup D1-E12-vi-ngoai D1-K1-env-tho D1-S3-vi-lech D1-F3-test-thieu

## Bao cao 7 muc (CLAUDE.md §7)

VIEC:        AUDIT-1 — Soat toan bo phan tu chay: luat nao that su chan, phep nao that su do, tai lieu nao noi dung
DA SUA:      chi tao file trong viec/AUDIT-1/ (dot_bien.py, lach.js, bao_cao.md, a_bang_luat.md..f_tai_lieu.md,
             bang_chung_do.txt, trang_thai.md). KHONG doi mot byte nao ngoai viec/AUDIT-1/ (viec chi doc + do + bao cao).
BAI THU:     thay buoc "bai thu do" = G3 cong cu tu chung minh (python3 viec/AUDIT-1/dot_bien.py G3):
             G3-sai-chuoi HONG · G3-da-biet BAT · G3-vo-hai SONG · G3-sap LAC — cong cu do khong noi doi (K3).
DA RA K4:    duong song song da canh: hai loi vao nguoi gac (xet()/stdin), hai che do cong (tinh/chay), ghiVi vs
             reconcileWallet, ban cai .claude/ vs nguon tu_chay/. grep cau ghi duong tien 11 file routes = 87; phu
             duong ban/hoan/vi/diem-tich (P26b 59 BAT + C2 2 BAT); CHUA phu loyalty redeem (AU-G1).
CHUA KIEM:   - loyalty redeem (AU-G1): da do SONG, nhung CHUA doc het logic loyalty.js nen khong khang dinh no dang
               sai — chi khang dinh LUOI khong phu no.
             - E11/T1 (phep chay that cua bo kiem): suy tu C2/E1 lam chung do, khong dot bien rieng tung phep.
             - ban_mau_pos 119 phep: khong chay chay_thu.sh.
             - bang_chung_do cu tung viec: khong doi chieu lai so ca tung dong (E2).
             - may in khong rollback / Render ngu idle: khong soi duoc tu kho.
             - thu_p1.js: KHONG chay (xep muc bang doc code — Replit kho thu, cong khong cap Turso, may may neu co TURSO_* se ghi that).
GIT:         672b23c AUDIT-1: ra-soat vong 1 ... · 54f72ff bao cao G1 + B4 ... · 62b90ce nhom F tai lieu ...
             (9 commit tren nhanh viec/AUDIT-1, da push)
BAI HOC:     KHOA 2 (da lam: K5 bo nhat ky nguoi gac khoi anh_kho; them dot bien loyalty redeem) +
             de xuat HOC-2 (bat bien loyalty, khoa CONG_CU_DOC, ca cong A14, sua neo I10-bo/MB/MB4, nang T2-T4) ·
             NGUYEN TAC 3 (de xuat: K8 phep tu-kiem bao oan; K3 dot bien rua theo thoi gian; phan loai duong tien
             theo doi tuong khach cham) · BO 2 (thoi quen lenh shell ghep; git fetch/rmdir bi chan) — chi tiet o ## Bai hoc.

KET QUA CHINH: duong tien LOI da co KB vung (khong SONG); 1 NANG = luoi KHONG phu doi diem->voucher o quay (AU-G1);
14 phat hien NHE. 3 dot bien ho so cu HONG tren HEAD (I10-bo, MB, MB4). Dau vao duy nhat cua HOC-2 la bao_cao.md.
