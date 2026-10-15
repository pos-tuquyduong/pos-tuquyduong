# Trạng thái — TU-CHAY-6

## Bước 1 — đối chiếu bản chụp (2026-10-15)

- nhánh: `viec/TU-CHAY-6`
- `git status --short`: sạch
- SHA HEAD: `dfeaa57` · SHA FETCH_HEAD: `dfeaa57` → bằng nhau, không kéo
- `git log --oneline -3`:

```
dfeaa57 PHIEU: TU-CHAY-6
8f6d43e TIEN-DO: mo TU-CHAY-6 + BAN-HANG-1 (song song AUDIT-3), DANG-NHAP-1 gop vao BAN-HANG-1 — so v32
142d5e5 TIEN-DO: SO-LUONG-1 xong (31a5810), mo AUDIT-3, them BAN-HANG-1, TU-CHAY-6 (6)(7) — so v31
```

## Bước 2–3 — đọc code thật, kế hoạch (15.10.2026)

- Phiếu dặn **chờ duyệt kế hoạch** → dừng ở bước 3 sau khi commit + push `ke_hoach.md`.
- Số đo A5 (đo 3 lần tuần tự, `scratchpad/do_A5.js`): `thu_nguoi_gac.js` 6,6 / 5,9 / 6,2 s · `thu_cong_cu.js` 2,9 / 3,1 / 3,3 s → < 30 s,
  **không đổi** điều kiện chạy. `thu_cong.js` 67,9 s (318 phép · 0 hỏng). `cong.js tinh . dfeaa57^ HEAD viec/TU-CHAY-6` → ĐẠT.
- Người gác chặn trong lượt này: `B-DICHCHU` (đích ghi là biến `$S` trong vòng for) · `B-CHUONGTRINH` (`for` ở đầu lệnh). Đều do
  cách viết lệnh của máy; viết lại thành script trong scratchpad / lệnh thẳng.

- Agent phụ soát kế hoạch (chỉ đọc) nêu 11 điểm — đã kiểm lại hai điểm nặng bằng code (`thu_nguoi_gac.js:709` canh `tu-chay 1.5.0`;
  `orders.js` 6 `^router.` / 5 `^});`) và sửa hết vào `ke_hoach.md` (bảng mục 13).

## Câu hỏi (chờ chủ quán — ghi kèm phương án ở `ke_hoach.md` mục 12)

1. **Q1 (chặn A2):** code thật không như phiếu giả định — quét `server/routes/` (thân route từ `^router.<m>(` tới `^});`): **3** route GET
   có lệnh ghi (`packages.js:191` run UPDATE :194 · `products.js:20` UPDATE pos_products :56–59 · `sync.js:104` UPDATE pos_customers
   :146–149 + INSERT pos_sync_logs :154–155), và **51/60** route có lệnh ghi KHÔNG gọi `loiGhi(` (`loiGhi` chỉ có ở `wallets.js:97`,
   5 file nhắc tới). Phép (b) theo chữ phiếu = 51 cảnh báo mỗi `npm test`. Chọn: PA-1 (đúng chữ phiếu, 3 + 51 dòng `!`) ·
   **PA-2 đề xuất** ((a) một cảnh báo gộp 3 chỗ; (b) bánh cóc CẢNH BÁO ngưỡng 51 — hôm nay 0) · PA-3 ((b) FAIL khi mọc thêm).
2. **Q2 (A4):** câu "trần / làm tròn" đặt K3, câu `getNow` đặt K7 (theo cơ chế + đề xuất GOI-2 :226, :132) — hay đúng chữ phiếu K2/K5?
3. **Q3 (A3):** `cong.js tinh` không chạy A11/A12 chế độ chay (`cong.js:280`, `:285` nằm sau `:216`) — hai câu LUOI-2 hỏi đều ở đó;
   hơn nữa ở bước 4 (chưa commit code) cổng tĩnh ĐẠT không có ✗, còn sau khi commit code thì luôn có `✗ [A19]` (+ `[A8]` với việc
   `tu_chay/`). Duyệt câu skill bước 4 theo PA-A `ke_hoach.md` mục 4: vế chính "tự xét A11/A12 từ `bang_chung_do.txt`, gom một câu
   hỏi"; `cong.js tinh` chỉ kiểm Phạm vi/A7/A17 với file đã commit, nói rõ `[A19]`/`[A8]` ở bước này là bình thường?
4. **Q4 (A1b):** `giaiNen` (`cong.js:40–44`) nuốt lỗi git/tar ở `:266` → cây gốc RỖNG → bài thử đỏ oan được tính "đỏ hợp lệ" (cổng ĐẠT
   oan, nặng hơn sập). Cùng khuôn A1: ném tại `:266` khi `giaiNen` thất bại, 1 dòng + 1 ca; chỉ có đột biến BV-, không có VS- (một
   đường) — lệch chữ A7 "mỗi chỗ vá ≥ 1 VS- + BV-". Làm trong việc này hay chỉ ghi Phát hiện?

## Phát hiện (ngoài phạm vi — không sửa)

1. `server/routes/products.js:56–59` (GET `/` ghi đệm tồn kho — Ràng buộc 8) và `server/routes/sync.js:146–155` (GET `/export` đánh dấu
   đã xuất + log) là route GET có lệnh ghi ngoài packages.js:194 — cần chú thích `// GET-ghi: <lý do>` trong một việc quầy (server/ cấm ở đây).
2. `kiem_tra_truoc_khi_giao.js:86–90` `boGhiChu` thay chú thích khối bằng MỘT khoảng trắng → số dòng trôi; phép E12/E10/P20 dùng nó
   không in số dòng nên chưa lộ. Phép A2 dùng hàm cắt riêng giữ `\n`, không sửa `boGhiChu`.
3. Phiếu / TOC-DO-1 ghi "`git cat-file` thoát 1" khi file không có — đo được **128** (`scratchpad/thu_gitgia.js`). Kế hoạch phân biệt theo
   `status === 0` / `status === null || error` / còn lại.
