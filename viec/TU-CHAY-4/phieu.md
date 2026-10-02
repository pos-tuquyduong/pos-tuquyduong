# TU-CHAY-4 — Giả lập quầy POS: 11 kịch bản + 9 bất biến sổ sách, chạy trong cổng

<!-- Phiếu do chat soạn 02.10.2026. Nền: main d047037 (sổ việc v16, tu-chay 1.3.1). Thiết kế gốc: tu_chay/THIET_KE.md B10. -->

**Chờ duyệt kế hoạch:** viết `viec/TU-CHAY-4/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của
`/lam-viec`. Chưa viết code, chưa viết bài thử cho tới khi chủ quán gửi lời duyệt.

## Mục tiêu
Có một "ngày bán hàng trong vài phút": bật máy chủ POS THẬT trên kho tạm, chạy 11 kịch bản quầy qua API
như nhân viên bấm, và sau MỖI kịch bản kiểm 9 bất biến sổ sách (tiền, ví, mã bill, kho, điểm, nhật ký).
Cổng chạy giả lập này cho MỌI PR từ nay.

Vì sao làm bây giờ: bài thử của mỗi việc do chính máy viết, nên có thể yếu hoặc "giả". Giả lập độc lập với
từng việc: P20b → P24 có viết bài thử yếu thì tiền sai vẫn làm giả lập đỏ. Làm một lần, bảo vệ cả 5 việc tiền.

## Nghiệm thu

### A. An toàn (làm và thử TRƯỚC mọi thứ khác)
- A1 Biến môi trường có `TURSO_*`, `DATABASE_URL`, khoá thật, hoặc chuỗi nào trong `ten_mien_production`
  của `tu_chay/cau_hinh.json` → giả lập TỪ CHỐI chạy, thoát ≠ 0, nói rõ biến nào. Có ca thử cho từng loại.
- A2 Luôn dùng file kho tạm mới trong thư mục tạm của hệ điều hành, xoá khi xong (kể cả khi lỗi).
  Không đụng `data/`, không đụng Turso. Kết nối đi qua `server/ketNoiKho.js` như `cong_cu/thu_P20.js`.
- A3 Không sửa code server (`server/**`) và giao diện (`client/**`) — việc này chỉ THÊM lưới.

### B. Sân khấu
- B1 Máy chủ thật: mount ĐÚNG các route thật mà quầy dùng (không chép logic ra viết lại), cổng ngẫu nhiên.
- B2 SX giả: một máy chủ nhỏ trả tồn kho và GHI LẠI mọi lệnh trừ/hoàn kho kèm vân tay; POS trỏ vào nó qua
  `diaChiSX` của ketNoiKho.
- B3 Trễ mạng giả ~40 ms trên MỌI lệnh tới kho (bài học P19: không có trễ thì lỗ thu hai lần không lộ).
  Viết mới trong `cong_cu/gia_lap/` (trong kho không có `tre_mang.cjs` cũ).
- B4 Dữ liệu mẫu cố định: 3 khách (mới; quen có ví 200.000đ; đang nợ 50.000đ), 5 món, 1 gói, cấu hình
  điểm + mã bill giống `cong_cu/thu_P20.js`.

### C. 11 kịch bản (gọi API đúng như nhân viên)
1 tiền mặt 45.000đ · 2 chuyển khoản · 3 "chưa thu" rồi thu · 4 ghi nợ rồi trả nợ · 5 huỷ đơn · 6 hoàn tiền ·
7 khách mới dùng mã in trên bill (bill đã thu → được; bill chưa thu → bị từ chối) · 8 nạp ví rồi tiêu ví ·
9 mua gói · 10 HAI người cùng bấm thu một bill · 11 HAI người cùng nhập một mã.
Kịch bản 10, 11 phải thật sự chồng nhau (dùng móc trước giao dịch như `thu_P20.js` hoặc trễ mạng), và có
bằng chứng là chúng chồng nhau, không chạy tuần tự.

### D. 9 bất biến (SQL chỉ đọc trên kho tạm, sau MỖI kịch bản và ở cuối; mọi bất biến phải ra 0 dòng lệch)
I1 mã bill chỉ dùng trên đơn đã thu, chưa huỷ · I2 không có mã bill mồ côi mới · I3 không có đơn đã thu mà
trạng thái lạ · I4 số dư ví = tổng giao dịch thuộc danh sách trắng `LOAI_TINH_VAO_VI` · I5 không có loại giao
dịch ví lạ · I6 mỗi đơn thu ĐÚNG MỘT LẦN (tổng đã thu = tổng đơn) · I7 mỗi vân tay trừ kho SX giả nhận ĐÚNG
MỘT LẦN · I8 điểm khách = tổng dòng điểm · I9 mỗi thao tác tiền có một dòng nhật ký đơn.
Câu SQL viết từ code và schema THẬT (đọc trước, ghi file:dòng trong kế hoạch). Mỗi bất biến một hàm/câu riêng,
tên đúng I1…I9.

Kết quả in đúng một dòng tổng: `Giả lập: 11 kịch bản · 9 bất biến · ĐẠT`, hoặc chỉ rõ kịch bản nào làm
bất biến nào lệch, lệch bao nhiêu tiền/dòng. Thoát 0 chỉ khi ĐẠT.

### E. Phá thử — `cong_cu/thu_gia_lap.js` (bài thử của việc này, phải ĐỎ trên code gốc)
- E1 Giả lập trên code thật → ĐẠT.
- E2 Đột biến trên BẢN SAO code server (không sửa bản thật), mỗi đột biến bỏ một chặn có thật → đúng bất
  biến tương ứng lệch. Tối thiểu: chặn thu hai lần ở pay-debt → I6; chặn mã bill trên bill chưa thu → I1;
  danh sách trắng ví → I4 hoặc I5; trừ kho hai lần → I7. Bất biến nào không có đột biến tự nhiên thì ghi
  lý do trong kế hoạch.
- E3 Ca A1 (từ chối khi thấy khoá thật).
- E4 Đột biến vào chính giả lập (bỏ kiểm một bất biến, bỏ trễ mạng ở kịch bản 10) → `thu_gia_lap.js` đỏ.

### F. Nối vào bộ kiểm và khoá lưới
- F1 `kiem_tra_truoc_khi_giao.js`: chạy giả lập và `thu_gia_lap.js` như "bài chạy thật". Đo thời gian: nếu
  giả lập ≤ 15 s thì chạy cả bản nhanh (pre-commit), nếu dài hơn thì chỉ `--day-du` — ghi số đo vào kế hoạch.
  (Cổng `cong-chay` chạy `--day-du`, nên PR nào cũng qua giả lập.)
- F2 Bánh cóc: bộ kiểm đỏ nếu số kịch bản < 11 hoặc số bất biến < 9 (chỉ được tăng, không được giảm).
- F3 `tu_chay/cau_hinh.json` `file_luat` thêm `cong_cu/gia_lap/**` và `cong_cu/thu_gia_lap.js`: việc sau
  muốn sửa giả lập phải ghi ĐÚNG TÊN file trong phiếu. Cập nhật ca B1 tương ứng trong `tu_chay/thu_nguoi_gac.js`.
- F4 `tu_chay/THIET_KE.md` B10: sửa cho khớp cách nối thật (qua bộ kiểm `--day-du`, không qua `lenh_gia_lap`),
  ghi "việc sau thêm kịch bản mới, không xoá kịch bản cũ". `tu_chay/PHIEN_BAN` → `tu-chay 1.3.2`.

### G. Nếu giả lập phát hiện lỗi THẬT trong code hiện tại
Không sửa server. Dừng, ghi vào `## Câu hỏi` của `trang_thai.md`: kịch bản, bất biến, số tiền lệch, file:dòng
nghi ngờ. Chủ quán quyết (mở việc vá riêng hay tạm đánh dấu kịch bản "chờ P…").

### H. Toàn bộ
`npm test`, `--day-du` xanh; ba bài thử bộ khung xanh. Mỗi nhóm A, D, E, F có ca đỏ trước ghi trong `trang_thai.md`;
đột biến ghi kèm lệnh chạy lại được.

## Phạm vi
- viec/TU-CHAY-4/**
- cong_cu/gia_lap/**
- cong_cu/thu_gia_lap.js
- kiem_tra_truoc_khi_giao.js
- tu_chay/cau_hinh.json
- tu_chay/thu_nguoi_gac.js
- tu_chay/THIET_KE.md
- tu_chay/PHIEN_BAN
- KHUON_LOI.md

## Ngân sách
Giả lập ~450 dòng (sân khấu ~120, 11 kịch bản ~200, 9 bất biến ~80, an toàn + in kết quả ~50).
Thử ~200 dòng (`thu_gia_lap.js`). Bộ kiểm ±~30, cấu hình ±2, `thu_nguoi_gac.js` ±~5, tài liệu ~30.
Ghi chú: file giả lập KHÔNG đặt tên `thu_*.js` (nếu không cổng coi là bài thử và đòi đỏ trên gốc); bài thử
của việc là `cong_cu/thu_gia_lap.js`, đỏ trên gốc vì giả lập chưa có.
Cổng của chính PR này chấm bằng luật của main (tu-chay 1.3.1): mọi `thu_*.js` mới hoặc sửa phải ĐỎ trên gốc —
`thu_nguoi_gac.js` đỏ trên gốc nhờ ca F3 (file_luat mới). Kế hoạch ghi rõ ca nào đỏ trên gốc ở từng file.

## Đổi cấu trúc DB
không (giả lập chỉ tạo kho tạm bằng `initDatabase()` thật)

## Thư viện mới
không (dùng `express`, `jsonwebtoken`, libsql đã có)

## Cấm
- Không sửa `server/**`, `client/**`, `.claude/`, `.github/`. Không chạy `cai_dat.sh`, `xem_thu.sh` trên kho thật.
- Không kết nối Turso hay bất kỳ địa chỉ production nào, kể cả để "xem thử".
- Chỉ push đúng nhánh việc: `git push -u origin viec/TU-CHAY-4`. Không đụng `main`, không merge, không tạo PR.
- Không nới luật nào của người gác hay cổng. Không chạy `patch_*.py`. Không sửa sổ việc.
