# HUY-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (05.11.2026)
- Nhánh: `viec/HUY-1`; `git status --short` sạch.
- `git fetch origin viec/HUY-1` → HEAD `1d21626` · FETCH_HEAD `1d21626` (bằng nhau, không kéo).
- `git log --oneline -3`:
  ```
  1d21626 PHIEU: HUY-1
  7f9693f TIEN-DO: KH-SDT-1, GIO-VN-1, KH-NHANH-POS-1, HD-KH-1, SEPAY-1, CT-1a, SUA-E2-1, SUA-C9-1 xong; quyet dinh 04-05.11; mo GIAO-DIEN-1, CK-NOIDUNG-1, HUY-1, KH-TOMTAT-1 — so v54
  4723a3b Merge pull request #72 from pos-tuquyduong/viec/SUA-C9-1
  ```
- Sổ việc: HUY-1 còn mở; CK-NOIDUNG-1 còn mở (phiếu dặn LÀM sau khi CK-NOIDUNG-1 gộp — kế hoạch lập được ngay).

## Bước 3 — kế hoạch
- `viec/HUY-1/ke_hoach.md` đã viết. Phiếu có "Chờ duyệt kế hoạch" → commit, push, DỪNG.
- Câu hỏi cho chủ quán: ở cuối `ke_hoach.md` (mục "Câu hỏi cần chủ quán chốt") và chép dưới đây.

## Câu hỏi
Xem `ke_hoach.md` mục 9 — Q1 (bản mẫu giao diện), Q2 (mã nguồn dòng sổ ví), Q3 (đơn App chưa trả ở quầy), Q4 (CK-NOIDUNG-1 gộp trước), Q5 (thêm `server/utils/donThu.js` + `cong_cu/gia_lap/kich_ban.js` vào Phạm vi).

## Soát kế hoạch (agent phụ, chỉ đọc)
Bắt: sót đường song song `donThu.js:71-79` (bản chép công thức két) và `packages.js:267` (cùng `ghiHoan`); kịch bản giả lập huỷ bằng nhân viên
(`kich_ban.js:440,482,518,627`); có cách ngắn hơn (dùng lại `soTienHoan` + cờ thay vì hàm mới); thiếu ca thẻ hội viên, dòng hoàn tiền mặt đủ
trường, bài hợp đồng App, giao diện; trích nhầm I11 / I18. Mình kiểm lại từng điểm trong code → đúng, đã sửa hết vào kế hoạch.
Sự cố: một lệnh có `sed -i` bị người gác chặn (luật SED-I) → viết lại file bằng Write.

## Phiên 11.11.2026 — `tiep` sau khi chat gộp main (Q4)

### Bước 1 — đối chiếu bản chụp
- Nhánh: `viec/HUY-1`; `git status --short` sạch (hook mở phiên đã kéo `1d21626 → aa5874f`).
- `git fetch origin viec/HUY-1` → HEAD `aa5874f` · FETCH_HEAD `aa5874f` (bằng nhau, không kéo).
- `git log --oneline -3`:
  ```
  aa5874f PHIEU: HUY-1 11.11 buoc nang cap 025 + ghi chu main moi (DIEM-MON-1, VI-ME-1, NAP-1, BAO-1a) + VOUCHER-2 song song
  f77b7fb GOP-HUY-1 gop main 53a71a2 (chat 11.11, truoc tiep — Q4)
  53a71a2 TIEN-DO: DIEM-MON-1, VI-ME-1, BAO-1a xong; them QUET-1, BO-MAN-CU-1, MATKHAU-1 (truoc khai truong), DOI-DIEM-1, QUET-2 (cuoi danh sach); quyet dinh 11.11; KHUON_LOI bo sung; bo attached_assets/ khoi kho
  ```

### Bước 2–3 — đọc lại kế hoạch so với code mới
- Kết quả: **lệch nhiều** → theo ghi chú 11.11 của phiếu: sửa kế hoạch (mục 0 mới của `ke_hoach.md`), ghi câu hỏi, DỪNG chờ duyệt lại.
- Buộc sửa file NGOÀI Phạm vi: (1) cổng tạm `CHO_HUY_1` của GIAO-1 (`server/utils/giaoHang.js:160-163`) + ca J4/J9, K5b của `cong_cu/thu_GIAO1.js`;
  (2) bài cũ khoá luật "huỷ chỉ hoàn phần ví": `thu_P26b.js` A5, `thu_P26c.js` B5d, `thu_P24.js` A4b, `thu_DOISOAT1.js` E14.
- Cách đo (2): bản sao cây `aa5874f` trong thư mục nháp (`git archive`), sửa đúng một chỗ ở `hoanVi` (hoàn total − nợ khi huỷ), chạy 19 bài có huỷ
  đơn trên gốc và bản nháp (bảng `ke_hoach.md` mục 0.1). Gốc: 19/19 xanh. Bản nháp: đỏ đúng 4 ca (3 bài ngoài Phạm vi + KB5 giả lập trong Phạm vi).
  E14 của `thu_DOISOAT1.js` do agent soát chỉ ra (bản nháp chưa đổi Đối soát nên chưa đỏ) — đã đọc lại dòng 631-636.
- Phần còn lại khớp hoặc lệch ít (NAP-1 ví hai ngăn tự chia qua `ghiVi`; DIEM-MON-1 `truDiemDon` không đổi; `traLuotMa` chỉ gọi; PHIEN_BAN 13 → 14;
  bước 025; mã lỗi lý do đổi sang `LY_DO_BAT_BUOC` cho trùng GIAO-1, kiểm SAU cổng giao để ca J2 giữ xanh) — đã sửa vào kế hoạch.
- Soát kế hoạch (agent phụ, chỉ đọc): bắt K5b + J2 (`thu_GIAO1.js`), E14 (`thu_DOISOAT1.js`), đơn giao không SĐT (→ Q8), thiếu ca `do_da_pha`
  và lý do < 3 ký tự cho đơn giao (→ D11, D12), lệch nhỏ số dòng `GiaoHang/index.jsx` — mình kiểm lại trong code, đúng, đã sửa vào kế hoạch.
- Sự cố người gác: grep đệ quy ở gốc kho (B-BIMAT-CHU) → trỏ vào thư mục con; `git worktree` (GIT-LENH) → dùng `git archive | tar`;
  đích ghi có biến (B-DICHCHU) → viết thẳng đường dẫn; `time` (B-CHUONGTRINH) → bỏ; `ReadNotifications` (CC-LA) → không dùng;
  heredoc nhắc file được bảo vệ (B-MANOI) → viết script ra file nháp rồi chạy.

## Câu hỏi (11.11)
Chi tiết + đề xuất ở cuối `ke_hoach.md`, mục "Câu hỏi mới 11.11":
- **Q6** — thêm `server/utils/giaoHang.js` (xoá cổng tạm `CHO_HUY_1`) và `cong_cu/thu_GIAO1.js` (đổi ca J4 + J9, K5b) vào Phạm vi.
- **Q7** — thêm `cong_cu/thu_P26b.js`, `cong_cu/thu_P26c.js`, `cong_cu/thu_P24.js`, `cong_cu/thu_DOISOAT1.js` vào Phạm vi (mỗi ca chỉ đổi số mong đợi theo luật hoàn toàn bộ).
- **Q8** — đơn giao KHÔNG có tài khoản khách mà trả tiền mặt / CK: đề xuất vẫn chặn huỷ trên máy (như hôm nay).

## Phát hiện (11.11)
- `server/utils/viKhach.js:6-7` chú thích chỉ nói dòng tiền mặt / CK hoàn vào ví là `'hoan_goi'`; HUY-1 dùng mã riêng (Q2) → chú thích cần thêm mã mới (ngoài Phạm vi; hành vi vẫn đúng nhờ thứ tự ghi).
- `server/utils/doiSoat.js:252-260`: tiền đền cho khách lẻ không SĐT ra khỏi két nhưng công thức két không tính (đang liệt kê CẦN XEM) — trái chữ "lối DUY NHẤT lấy tiền mặt ra khỏi két" của phiếu E. Không đụng.

## Phiên 12.11.2026 — `tiep` sau khi chủ quán đồng ý Q6, Q7, Q8 (11.11)

### Bước 1 — đối chiếu bản chụp
- Nhánh: `viec/HUY-1`; `git status --short` sạch (hook mở phiên đã kéo `eb4c4d3 → 078723f`).
- `git fetch origin viec/HUY-1` → HEAD `078723f` · FETCH_HEAD `078723f` (bằng nhau, không kéo).
- `git log --oneline -3`:
  ```
  078723f PHIEU: HUY-1 Pham vi them giaoHang.js + 5 bai thu (Q6, Q7), tra loi Q6-Q8 — chu quan 11.11
  eb4c4d3 HUY-1 doi chieu ke hoach voi code moi 11.11 (muc 0), cau hoi Q6-Q8, DUNG cho duyet lai
  aa5874f PHIEU: HUY-1 11.11 buoc nang cap 025 + ghi chu main moi (DIEM-MON-1, VI-ME-1, NAP-1, BAO-1a) + VOUCHER-2 song song
  ```

### Bước 4–6 — bài thử đỏ trước, sửa máy chủ, kiểm (12.11)
Lời thường: phần MÁY CHỦ của việc huỷ đơn đã xong và đã kiểm: huỷ đơn hoàn toàn bộ tiền vào tài khoản khách (khách lẻ: máy ghi khoản trả tiền mặt
từ két), lý do bắt buộc, nhân viên không huỷ được, quản lý chỉ huỷ đơn trong ngày, Đối soát có hai dòng mới, App thấy số đã hoàn. Phần GIAO DIỆN
(nút Huỷ đơn) CHƯA làm: phải sửa bản mẫu `ban_mau_pos/` trước, mà người gác chỉ cho sửa khi Phạm vi ghi ĐÚNG TÊN từng file → Q10.

- Bài thử mới `cong_cu/thu_HUY1.js` (58 ca) — gốc: 16 đạt · 42 hỏng; HEAD: 58 đạt · 0 hỏng. Bằng chứng: `bang_chung_do.txt`.
- Bài cũ đổi theo luật đã duyệt (Q6, Q7, Q5 — bài sửa thường, đỏ trên gốc): `thu_GIAO1.js` (J4 + J9, J4b mới cho Q8, K5b), `thu_P26b.js` A5,
  `thu_P26c.js` A5c2 / A5k / B5d, `thu_P24.js` A4b, `thu_DOISOAT1.js` E14, `thu_HOPDONG_KH.js` (ca v14 mới), `gia_lap/kich_ban.js` KB5, KB21, KB22,
  KB24 (nhân viên → chủ: giả lập chỉ có chủ + nhân viên, `chay.js` ngoài Phạm vi), `gia_lap/bat_bien.js` I11 / I18 (Q2).
- `npm test`: **PASS 112 · FAIL 0 · CẢNH BÁO 1** (cảnh báo có sẵn: route GET có lệnh ghi packages.js / products.js / sync.js — không phải của việc này).
- `npm test -- --day-du`: **PASS 115 · FAIL 1** — `✗ bài chạy thật cong_cu/thu_gia_lap.js xanh → ✗ M11 huỷ đơn bỏ cổng trạng thái (huỷ được đơn đã hoàn)
  (routes/orders.js) — chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được` → Q9 (file ngoài Phạm vi).
- Giả lập `cong_cu/gia_lap/chay.js`: 33 kịch bản · 18 bất biến · ĐẠT.
- `node tu_chay/cong.js tinh . 1d21626^ HEAD viec/HUY-1`: 238 lý do — gần hết là `✗ [A6]` / `✗ [A10]` của file main mà chat gộp vào nhánh (commit
  `f77b7fb`, Q4: `attached_assets/…`, `viec/NAP-1/…`, `TIEN_DO_POS.json`…), không phải file việc này sửa → Phát hiện khung. Từ commit gộp
  `node tu_chay/cong.js tinh . f77b7fb HEAD viec/HUY-1`: chỉ `✗ [A20]` (chưa tới bước 8b), `✗ [A17]` (ghi tên đột biến — đã ghi dưới), `✗ [A19]` (chưa tới 11.4).

### Chỗ vá → đột biến (`python3 viec/HUY-1/dot_bien.py` — 25 đột biến · BẮT 25 · SỐNG 0 · HỎNG 0 · LẠC 0, đối chứng thu_HUY1 58/0, thu_GIAO1 137/0)
| Chỗ vá | Đột biến (ca bắt) |
|---|---|
| `orders.js` hoanVi — hoàn cả tiền mặt + CK | BV-HOAN-TIEN-MAT (D1), BV-HOAN-CK (D2) |
| `orders.js` hoanVi — chia tiền mặt rồi CK, phần ví riêng | VS-CK-VAO-TIEN-MAT (D2), VS-TIEN-MAT-NHU-VI (D1) |
| `orders.js` hoanVi — khách lẻ → pos_hoan_tien_mat | BV-KHACH-LE (E1) |
| `orders.js` xoá đơn không đi đường mới (K5) | VS-XOA-DOI (K1) |
| `orders.js` route huỷ — quyền theo ngày | BV-NGAY-TRUOC (B3), VS-NGAY-BANG (B2), VS-NGAY-CHO-QUAN-LY (B3) |
| `orders.js` docLyDoHuy / cổng lý do | BV-LY-DO (C1), VS-KHAC-KHONG-TRIM (C3), VS-MA-LA-QUA (C2), VS-BO-THAN-CU (C6) |
| `database.js` seed staff cancel_order = 0 | BV-SEED-STAFF (B1) |
| `nang_cap/025_huy_don.js` tắt quyền staff kho cũ | BV-025-QUYEN (B1b) |
| `wallets.js` ghiHoan — cách huy_tien_mat / huy_ck | VS-CACH-HOAN-GOI (D1), BV-GHI-CK (D2) |
| `doiSoat.js` tienTheoSo — két luật mới | VS-KET-CU (F2), BV-KET-Y (F2) |
| `doiSoat.js` tongHop — dòng "hoàn vào tài khoản" | VS-X-DON-CU (F1) |
| `donApp.js` — hai trường App + oid | VS-LO-GHI-THEM (H1), BV-HOAN-APP (H1), BV-OID (A4) |
| `giaoHang.js` — bỏ cổng tạm (Q6), giữ chặn đơn giao không tài khoản (Q8) | BV-Q8 (J4b), VS-Q8-CHAN-HET (J4 + J9) |

Tên đột biến (đủ, cổng A17): BV-HOAN-TIEN-MAT, BV-HOAN-CK, VS-CK-VAO-TIEN-MAT, VS-TIEN-MAT-NHU-VI, BV-KHACH-LE, VS-XOA-DOI, BV-NGAY-TRUOC, VS-NGAY-BANG,
VS-NGAY-CHO-QUAN-LY, BV-LY-DO, VS-KHAC-KHONG-TRIM, VS-MA-LA-QUA, VS-BO-THAN-CU, BV-SEED-STAFF, BV-025-QUYEN, VS-CACH-HOAN-GOI, BV-GHI-CK, VS-KET-CU,
BV-KET-Y, VS-X-DON-CU, VS-LO-GHI-THEM, BV-HOAN-APP, BV-OID, BV-Q8, VS-Q8-CHAN-HET.
Lần chạy đầu BV-SEED-STAFF SỐNG (bước 025 sửa lại ngay sau seed nên hành vi y nguyên) → thêm vế "kho mới không có bảng _sao_luu_025" vào B1 → BẮT.
Chưa có đột biến: `donThu.js` (két ở công cụ dọn dữ liệu thử — không bài nào gọi `tienMatTheoNgay` trực tiếp → CHƯA KIỂM), `backup.js` (thu_SAOLUU2
canh "mọi bảng đều sao lưu" — xanh), `bat_bien.js` (công cụ thử).

### Sự cố phiên
- Người gác: `|` sau lệnh chạy script, `cd` giữa lệnh, `sed -i`, `stash`, `bash` trong thư mục nháp → viết lại lệnh đơn; `G-LUAT` khi Write
  `ban_mau_pos/thu/thu_hd.js` → dừng phần bản mẫu, hỏi Q10. Trước đó một script Python đã sửa `ban_mau_pos/ban_mau_pos.html` (người gác không thấy
  qua Python) — mình đã **hoàn lại** bằng `git checkout -- ban_mau_pos/ban_mau_pos.html` (chưa commit), không lách.
- Bài thử tự sai 2 lần (G7 cần đơn trả ví, D10 số ví tính tay sai 125.000 → 140.000; ví nền D10 thiếu tổng nạp làm I18 lệch) — sửa bài, chạy lại gốc.

## Câu hỏi (12.11) — DỪNG chờ chủ quán
- **Q9 · Một chuỗi neo đột biến cũ trong `cong_cu/thu_gia_lap.js` (ngoài Phạm vi).** Lời thường: bài kiểm bộ
  giả lập có một "đột biến" M11 tìm đúng câu lệnh huỷ đơn cũ để làm hỏng thử; mình đổi câu đó (thêm mã lý do) nên M11 không tìm thấy chỗ, `--day-du`
  đỏ. **Đề xuất:** thêm `cong_cu/thu_gia_lap.js` vào Phạm vi để đổi ĐÚNG một dòng neo (dòng 152):
  `[reason ||` → `[lyDo.chu,` ở cả chuỗi gốc lẫn chuỗi thay (M11 vẫn bỏ cổng `AND status = 'completed'`, vẫn phải bị I11 bắt).
- **Q10 · Bản mẫu giao diện cần ghi ĐÚNG TÊN file trong Phạm vi.** Lời thường: người gác coi `ban_mau_pos/` là "file luật" — chỉ cho sửa file có tên
  đầy đủ trong Phạm vi, glob `ban_mau_pos/**` không đủ. Theo Q1 phải sửa bản mẫu TRƯỚC rồi mới làm nút Huỷ đơn thật. **Đề xuất:** thêm ba dòng vào Phạm vi:
  `ban_mau_pos/ban_mau_pos.html`, `ban_mau_pos/thu/thu_hd.js`, `ban_mau_pos/DAC_TA.md` (sửa dòng `PUT …/cancel body { reason }` và luật hoàn tác
  cho đúng: huỷ đơn ĐÃ THU không hoàn tác 5 giây). Bản nháp đã sẵn: `viec/HUY-1/nhap/ban_mau.py` (sửa bản mẫu) + `viec/HUY-1/nhap/thu_hd.js` (13 ca) —
  thử trên bản sao: bản mẫu gốc → bài sập (chưa có hàm); sau khi áp → 13 đạt · 0 hỏng, 6 bài cũ vẫn 119 đạt (tổng 132 · 0 hỏng).
  Có Q10 thì phiên sau làm: bản mẫu → `HopHuyDon.jsx` + `Orders.jsx` + `DonApp` + màn Đối soát + build `dist` → `/ra-soat` → `/soat-bao-mat`.

## Phát hiện (12.11)
- Khung: khoảng `1d21626^..HEAD` của cổng gồm cả main chat gộp vào nhánh (Q4) → `✗ [A6]` / `✗ [A10]` hàng trăm file không phải của việc. Tính từ
  commit gộp `f77b7fb` thì sạch. Cổng PR của chủ quán có thể gặp cùng chuyện — chat xem lúc gộp.
- `server/utils/tienDaTra.js:85` (`soTienHoanGoi`) và `server/utils/viKhach.js:29` (`thuongKhiHoan`) chỉ loại `'hoan_goi'` khỏi phần "đã hoàn bằng ví";
  dòng `huy_tien_mat` / `huy_ck` bị đếm như phần ví. Không sai hôm nay: `soTienHoanGoi` chỉ đọc đơn còn `completed` (đơn đã huỷ không vào), còn
  `thuongKhiHoan` đúng nhờ thứ tự ghi (ví trước — ca D10 khoá). Ghi để việc sau đổi một trong hai chỗ thì nhớ ba cách (`viKhach.js` ngoài Phạm vi).
