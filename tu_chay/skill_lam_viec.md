---
name: lam-viec
description: Làm trọn một việc tu-chay trên máy mây theo phiếu viec/<MÃ>/phieu.md — kế hoạch, bài thử đỏ trước, sửa, kiểm, commit, push nhánh việc, báo cáo 7 mục, rút kinh nghiệm. Chủ quán gọi bằng /lam-viec <MÃ>.
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
- Thấy thông báo đổi model giữa phiên: ghi giờ + bước đang làm vào `trang_thai.md` (kết quả trước/sau có thể khác tay).

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
   Sửa một bài thử ĐÃ CÓ mà nó vẫn xanh trên code gốc (thêm ca hồi quy): ghi `## Câu hỏi`, báo chủ quán thêm mục
   `## Bài thử cũ sửa` vào phiếu — không tự sửa phiếu, không tự lách bằng ca đỏ giả.
   `bang_chung_do.txt` có một dòng `SỐ CA <bài thử>: <N>` cho mỗi bài đỏ (N = tổng số ca bài in ở dòng tổng khi chạy trên code ĐÃ VÁ); đổi bài
   sau khi ghi → chạy lại trên gốc, chép lại (cổng A16).
   Đổi code chạy thật (`server/`, `client/src/`): `viec/$0/dot_bien.py` có ít nhất một đột biến `VS-…` (vá sai — bản vá
   sai cách mà bài thử phải bắt) và một `BV-…` (bỏ vá — gỡ chỗ vá); mỗi đột biến một dòng `('<tên>', …)` — tên = NGUYÊN chuỗi đầu, không sinh tên
   bằng vòng lặp. Ghi bảng "chỗ vá → đột biến" và MỌI tên đột biến vào `trang_thai.md` (cổng A17, A18).
5. **Sửa code** cho tới khi bài thử xanh. Bản lưu trước khi vá để trong thư mục nháp, không để trong kho.
6. **Kiểm.** `npm test` phải xanh. Đụng `client/src/` thì `(cd client && npm run build)` rồi
   `node kiem_tra_truoc_khi_giao.js --day-du`. Tự rà: code chết, trùng lặp, hàm dùng một lần, so số
   dòng với ngân sách của phiếu.
7. **Commit từng file** (`git add <file>` từng cái), mỗi bước một commit có mã việc ở đầu dòng.
8. **Soát độc lập** bằng `/ra-soat`. KHÔNG ĐẠT → sửa, quay lại bước 6. Tối đa 3 vòng sửa
   (`so_vong_sua_toi_da` trong `cau_hinh.json`); quá thì ghi `## Câu hỏi` và dừng.
9. **Push nhánh việc**: `git push -u origin viec/$0` — đúng dạng này, không nhánh khác, không `main`.
   Phiếu hay chủ quán dặn push sau mỗi bước thì push ngay sau mỗi commit của bước.
10. **Báo cáo 7 mục** (CLAUDE.md §7) ghi vào cuối `viec/$0/trang_thai.md`: VIỆC · ĐÃ SỬA · BÀI THỬ ·
    ĐÃ RÀ K4 · CHƯA KIỂM · GIT · BÀI HỌC. Mục CHƯA KIỂM nói thẳng điều máy không kiểm được.
    Trước khi báo xong, ĐẾM từng mục nghiệm thu của phiếu: mỗi mục một dòng kèm bằng chứng (bài thử, ca, lệnh) —
    không lấy mẫu; còn mục thiếu bằng chứng thì chưa xong.
11. **Rút kinh nghiệm** (đầu vào cho BÀI HỌC):
    1. Gom sự cố của việc này: bài thử đỏ bất ngờ; lệnh bị người gác chặn (mã luật + vì sao — đọc
       `.tu_chay_nhat_ky.jsonl`); lỗi agent soát bắt (dòng `BÀI HỌC:` của `/ra-soat`); vượt ngân sách;
       phải hỏi / dừng; lệnh phải làm lại.
    2. Xếp mỗi bài vào **đúng một** ngăn, kèm lý do:
       - **KHOÁ** — thành bài thử, phép kiểm hoặc luật người gác, có ca đỏ trước. File trong Phạm vi thì
         làm luôn; ngoài Phạm vi thì ghi đề xuất cụ thể: file nào, phép kiểm gì, ca đỏ nào.
       - **NGUYÊN TẮC** — một mục trong `KHUON_LOI.md` theo khuôn sẵn ("Đã gây / Dấu hiệu / Chặn"), kèm ví dụ
         thật. Không vào khuôn K1–K8 nào thì mở K9 trở đi. Ngoài Phạm vi thì ghi đề xuất.
       - **BỎ** — chỉ xảy ra một lần. Một dòng lý do.
    3. Dọn: lời dặn nào trong `KHUON_LOI.md` / `CLAUDE.md` đã có phép kiểm làm thay thì đề xuất xoá.
       `KHUON_LOI.md` không vượt `khuon_loi_toi_da` của `cau_hinh.json` — vượt thì gộp, không nới số.
    4. Ghi mục `## Bài học` của `trang_thai.md`, commit, push, rồi in báo cáo 7 mục trong câu trả lời.
       Đề xuất ngoài Phạm vi máy KHÔNG tự làm — chat soát duyệt, gom vào việc sau hoặc phiếu `HOC-<n>`.
    **Dừng.** Không merge, không tạo PR.
