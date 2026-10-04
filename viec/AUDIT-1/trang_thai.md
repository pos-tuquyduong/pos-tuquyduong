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

## Tiến độ
- [x] Bước 1 — đối chiếu bản chụp
- [x] Bước 2 — đọc phiếu, CLAUDE.md, KHUON_LOI.md, đo kích thước + thời gian từng nhóm
- [x] Bước 3 — `ke_hoach.md` (soát bằng agent chỉ đọc) — **DỪNG chờ chủ quán duyệt** (phiếu: "Chờ duyệt kế hoạch")
- [ ] G3 công cụ đo tự chứng minh → `bang_chung_do.txt`
- [ ] Nhóm A · [ ] B · [ ] C · [ ] D · [ ] E · [ ] F · [ ] báo cáo G1 · [ ] soát G4 · [ ] bài học

## Câu hỏi
1. Tổng thời gian máy ước lượng ~95 phút (> 90 phút của phiếu). Cách cắt đề xuất ở `ke_hoach.md` §5 —
   chủ quán chọn (a) chạy đủ theo nhóm, hoặc (b)/(c). Chưa duyệt thì không chạy.

## Sự cố (đầu vào bài học)
- Bước 2: người gác chặn 3 lệnh đo của chính tôi — `$(( ))` và `( … )` giữa lệnh (B-PHANTICH), `for`/`nproc`
  (B-CHUONGTRINH). Đúng luật; đổi sang script node trong nháp. Dự kiến xếp BỎ (thói quen viết lệnh, không phải lỗ).
