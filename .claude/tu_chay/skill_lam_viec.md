---
name: lam-viec
description: Làm trọn một việc tu-chay trên máy mây theo phiếu viec/<MÃ>/phieu.md — kế hoạch, bài thử đỏ trước, sửa, kiểm, commit, push nhánh việc, báo cáo 6 mục. Chủ quán gọi bằng /lam-viec <MÃ>.
argument-hint: "<MÃ> [tiep]"
disable-model-invocation: true
---

# /lam-viec $ARGUMENTS

Việc: `$0`. Có chữ `tiep` ở sau thì đang làm tiếp việc dở. Nguồn của skill này là
`tu_chay/skill_lam_viec.md` (chủ quán cài bằng `bash tu_chay/cai_dat.sh`).

## Luật cứng

- Code là sự thật; hồ sơ, sổ việc, trí nhớ có thể cũ (CLAUDE.md §1, KHUON_LOI.md K1).
- Chỉ sửa file có trong mục `## Phạm vi` của phiếu. Ngoài phạm vi, hoặc gặp câu hỏi nghiệp vụ
  (giá, tiền, cách quầy làm việc, chỗ phiếu chưa chốt): ghi vào mục `## Câu hỏi` của
  `viec/$0/trang_thai.md`, commit, push, rồi **dừng**. Không đoán thay chủ quán.
- Thấy lỗi ngoài phạm vi: ghi mục `## Phát hiện`, không sửa.
- `git add` luôn kèm tên từng file. Không bỏ qua hook khi commit. Không sửa sổ việc `TIEN_DO_*.json`,
  không chạy công cụ ghi sổ — chủ quán ghi sau khi quầy chạy ổn.
- Người gác chặn lệnh nào thì đọc lý do và làm theo hướng dẫn trong đó; không tìm cách lách.

## Các bước

1. **Đối chiếu bản chụp.** Chạy `git branch --show-current` và `git log --oneline -3`. Chép nguyên
   ba dòng log vào `viec/$0/trang_thai.md` và **in chúng trong câu trả lời đầu tiên** để chủ quán đối
   chiếu với GitHub (máy mây từng mở từ bản chụp cũ). Nhánh không phải `viec/$0`, hoặc không thấy
   commit `PHIEU: $0` trong lịch sử → dừng, báo chủ quán.
2. **Đọc.** `viec/$0/phieu.md`, `CLAUDE.md`, `KHUON_LOI.md`, mục tương ứng trong `CHECKLIST_CODE.md`,
   rồi code thật của vùng sắp sửa. `grep` tìm mọi chỗ cùng khuôn (K4). Làm tiếp (`tiep`): đọc thêm
   `trang_thai.md` và `ke_hoach.md`, làm tiếp từ bước dở.
3. **Kế hoạch** `viec/$0/ke_hoach.md`:
   - phương án A và B cho từng phần: số file, ước lượng số dòng, rủi ro;
   - chọn phương án ít dòng nhất mà vẫn đạt mọi ca nghiệm thu; chọn nhiều dòng hơn thì nêu lý do;
   - danh sách ca thử ánh xạ 1-1 với mục `## Nghiệm thu` (đụng tiền thì thêm ca hai người cùng bấm),
     các đường song song cần canh, và mọi luồng hợp lệ phải KHÔNG bị chặn (K5).
   Nhờ một agent phụ chỉ đọc soát kế hoạch theo 4 câu: ra ngoài phạm vi? có cách ngắn hơn? ca nghiệm
   thu nào chưa có bài thử? đường song song nào bị sót? Phiếu dặn "chờ duyệt kế hoạch" thì commit,
   push, rồi dừng ở đây.
4. **Bài thử trước.** Viết bài thử, chạy trên code CHƯA sửa, thấy nó **đỏ** (K3). Lưu kết quả vào
   `viec/$0/bang_chung_do.txt`. Xanh ngay trên bản chưa sửa = bài thử vô giá trị, viết lại.
5. **Sửa code** cho tới khi bài thử xanh. Bản lưu trước khi vá để trong thư mục nháp, không để trong kho.
6. **Kiểm.** `npm test` phải xanh. Đụng `client/src/` thì `(cd client && npm run build)` rồi
   `node kiem_tra_truoc_khi_giao.js --day-du`. Tự rà: code chết, trùng lặp, hàm dùng một lần, so số
   dòng với ngân sách của phiếu.
7. **Commit từng file** (`git add <file>` từng cái), mỗi bước một commit có mã việc ở đầu dòng.
8. **Soát độc lập** bằng `/ra-soat`. KHÔNG ĐẠT → sửa, quay lại bước 6. Tối đa 3 vòng sửa
   (`so_vong_sua_toi_da` trong `cau_hinh.json`); quá thì ghi `## Câu hỏi` và dừng.
9. **Push nhánh việc**: `git push -u origin viec/$0` — đúng dạng này, không nhánh khác, không `main`.
   Phiếu hay chủ quán dặn push sau mỗi bước thì push ngay sau mỗi commit của bước.
10. **Báo cáo 6 mục** (CLAUDE.md §7) ghi vào cuối `viec/$0/trang_thai.md`, commit, push, rồi in lại
    trong câu trả lời: VIỆC · ĐÃ SỬA · BÀI THỬ · ĐÃ RÀ K4 · CHƯA KIỂM · GIT. Mục CHƯA KIỂM nói thẳng
    điều máy không kiểm được. **Dừng.** Không merge, không tạo PR.
