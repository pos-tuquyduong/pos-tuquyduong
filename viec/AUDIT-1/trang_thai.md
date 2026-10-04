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
- [x] Nhóm A · [x] B · [x] C · [x] D · [ ] E · [ ] F · [ ] báo cáo G1 · [ ] soát G4 · [ ] bài học

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

## Phát hiện ghi sẵn (chưa chấm, kiểm lại khi chạy nhóm tương ứng)
- `kiem_tra_truoc_khi_giao.js:746` ghi giả lập 22 s / thu_gia_lap 24 s; đo 04.10: 67,6 s / 70,6 s — hạn 110/120 s (C3).
- `tu_chay/thu_cong.js:336-347` không có ca `tat` cho A3, A4, A5 (B1).
- `viec/TU-CHAY-4/dot_bien.py:56-63` đột biến sửa THẲNG file thật (E).
- `cong_cu/thu_p1.js` ghi kho thật nhưng nằm trong `thu_muc_bai_thu` (B3).
