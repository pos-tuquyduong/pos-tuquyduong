# TU-CHAY-5 — trạng thái

## Bước 1 — đối chiếu bản chụp (11.10.2026)

Nhánh: `viec/TU-CHAY-5`. `git log --oneline -3`:

```
5ad35ea PHIEU: TU-CHAY-5
c18ee16 TIEN-DO: TACH-GL xong (befc6ad), TU-CHAY-5 mo phieu — so v26
befc6ad Merge pull request #13 from pos-tuquyduong/viec/TACH-GL
```

`git branch -vv`: `viec/TU-CHAY-5 5ad35ea [origin/viec/TU-CHAY-5]` — HEAD = origin (hook SessionStart in
"· kéo nhánh: viec/TU-CHAY-5 đã có đủ commit của origin — không kéo").

## Lời chốt của chủ quán (11.10.2026, trong phiên)

> Nhóm A (A1–A4), D5, D6 DỜI sang AUDIT-2 — không làm, không lập kế hoạch cho các mục đó; mục F chỉ áp cho B, C, D1–D4, E.
> Lập kế hoạch rồi dừng chờ duyệt như phiếu.

## Lời duyệt kế hoạch (chủ quán, 11.10.2026)

> Duyệt kế hoạch a456f3d. Q1 đúng: A8 đỏ tới khi chủ quán chạy script cài của chat trên nhánh sau soát cuối — máy không chạy
> cai_dat.sh. Q2 đồng ý /dev/fd/3 (chat đã thử: cha đọc được, con ENXIO), vẫn chạy thử khả thi trước như kế hoạch. Q3 chấp nhận
> khe 300 ms, đột biến D3 chạy ≥ 3 lần và ghi từng lần, không sửa chayGL thêm. Q4 đồng ý. Q5 chỉ so phần SỐ CA, không so số
> phép; bài nào không tách được số ca thì bỏ so cho bài đó và ghi lý do. Q6 đồng ý, ghi Phát hiện kèm đề xuất sửa cai_thu_vien.sh.

## Chỗ vá → đột biến (`python3 viec/TU-CHAY-5/dot_bien.py -j 2`)

| Chỗ vá | Bài bắt | Đột biến |
|---|---|---|
| B1 nhánh `git rm` (`nguoi_gac.js` LUAT_CON.git) | `thu_nguoi_gac` | `BV-B1-bo-rm` |
| B1 lọc cờ rm (chỉ `-q`) | `thu_nguoi_gac` | `VS-B1-rm-cho-moi-co` |
| B1 rm xét như SỬA file (không miễn hoàn tác) | `thu_nguoi_gac` | `VS-B1-rm-mien-hoantac` |
| B1 rm không trong kho lồng | `thu_nguoi_gac` | `VS-B1-rm-bo-khoLong` |
| `khoLong` dừng khi ra ngoài kho | `thu_nguoi_gac` (treo) | `VS-B1-khoLong-bo-dung-ngoai-kho` |
| B2 `TaskStop` trong `CONG_CU_DOC` | `thu_nguoi_gac` | `BV-B2-bo-TaskStop` |
| B3 nhánh fetch/pull | `thu_nguoi_gac` | `BV-B3-bo-keo` |
| B3 pull bắt buộc `--ff-only` | `thu_nguoi_gac` | `VS-B3-pull-thieu-ff-only` |
| B3 đúng nhánh đang đứng | `thu_nguoi_gac` | `VS-B3-keo-moi-nhanh` |
| B3 không kho lồng | `thu_nguoi_gac` | `VS-B3-keo-bo-khoLong` |
| C1 A19 | `thu_cong` | `BV-C1-bo-A19` |
| C1 chỉ commit đổi CODE sau SHA mới tính | `thu_cong` | `VS-C1-tinh-ca-commit-ho-so` |
| C1 "+ commit này" phải do chính commit đó thêm | `thu_cong` | `VS-C1-commit-nay-moi-noi` |
| C1 loại `.claude/` (chủ quán cài sau kiểm) | `thu_cong` | `VS-C1-khong-loai-claude` |
| C2 cảnh báo A16 | `thu_cong` | `BV-C2-bo-canh-bao` |
| C2 chỉ so số CA (Q5) | `thu_cong` | `VS-C2-so-ca-phep` |
| D1 `--kho` chỉ qua IPC (`chay.js`) | `thu_gia_lap` T7c | `BV-D1-bo-ipc` |
| D2 lượt TỪ CHỐI → cha dừng hết, thoát 3 | `thu_gia_lap` D2 | `BV-D2-bo-dung-het-3` |
| D3 `chayGL` setEncoding | `thu_gia_lap` D3 | `BV-D3-chayGL-bo-setEncoding` |
| D3 `chayTheoDoi` setEncoding (K4) | `thu_gia_lap` D3 | `BV-D3-theodoi-bo-setEncoding` |
| D4 neo `Lượt ` | `do_thoi_gian.js kb` | `BV-D4-neo-cu` |

## Đang ở

Bước 6 — kiểm.

## Phát hiện

1. **`tu_chay/cai_thu_vien.sh` im lặng khi HEAD tách rời** (ngoài Phạm vi — chủ quán duyệt Q6: chỉ ghi, kèm đề xuất).
   `cai_thu_vien.sh:15–34`: `case "$nhanh" in viec/?*) … ;; esac` — HEAD tách rời (hoặc nhánh khác) thì không có nhánh `*)`,
   hook không in gì, không kéo. Bằng chứng phiên này: `.git/logs/HEAD` dòng 1 clone ra HEAD tách rời ở `5ad35ea`, dòng 2
   `checkout: moving from 5ad35ea… to viec/TU-CHAY-5` — môi trường đặt nhánh SAU khi nạp; nếu hook chạy trước bước đặt nhánh thì
   máy không biết phiên nạp bản cũ (một giả thuyết cho TACH-GL `2237259`, chưa kiểm được). Fetch hỏng chỉ in `⚠`.
   **Đề xuất sửa** (việc sau, ghi đúng tên `tu_chay/cai_thu_vien.sh` + `tu_chay/thu_cong_cu.js` trong Phạm vi):
   - thêm nhánh `*) echo "⚠ kéo nhánh: không đứng ở viec/* (${nhanh:-HEAD tách rời}) — KHÔNG kéo, máy tự kéo ở bước 1 của /lam-viec" ;;`;
   - ca thử trong `baiKeoNhanh` (`thu_cong_cu.js:227`): kho máy đứng HEAD tách rời → dòng ⚠ có mặt (đỏ trên gốc: không in gì).
   Skill bước 1 mới (B4) đã xử lý hậu quả: máy tự fetch + đi-trước-nhanh, ghi hai SHA.

## Câu hỏi

(Q1–Q7 của `ke_hoach.md` mục 9 đã được trả lời ở lời duyệt.)
