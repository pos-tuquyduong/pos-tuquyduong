# TU-CHAY-7 — trạng thái

## Bước 1 — đối chiếu bản chụp (16.10.2026)
- nhánh: viec/TU-CHAY-7 · cây sạch trước khi ghi
- HEAD 6cb52fa · FETCH_HEAD 6cb52fa → bằng nhau, không kéo
- git log --oneline -3:
  - 6cb52fa PHIEU: TU-CHAY-7
  - 8194c9c TIEN-DO: AUDIT-4 (ddc42d2), P20c (d47b81c) xong; AU4-16 = A; mo LUOI-4 + MA-GIAM-1 + TU-CHAY-7; them LUOI-5, AUDIT-5 — so v35
  - ddc42d2 Merge pull request #28 from pos-tuquyduong/viec/AUDIT-4

## Bước 3 — kế hoạch
- `ke_hoach.md` bản 1 commit 25f1429 (hook Stop đòi commit file chưa theo dõi trước khi soát xong); bản 2 sửa theo soát.
- Phiếu dặn "Chờ duyệt kế hoạch" → DỪNG. Thêm: hai chỗ CHẶN cần chủ quán quyết (Q1, Q2).

## Số đo (máy mây 4 lõi, chạy riêng, gốc 6cb52fa)
- `node tu_chay/thu_cong.js`: 89,5 s (334 phép, xanh) = 75 % hạn 120 s.
- `node cong_cu/thu_TOCDO1.js`: 1,7 s (42 đạt) — bộ kiểm không gọi bài này qua `chayBaiThat` (chỉ nhắc ở chú thích `kiem_tra :529`, `:602`).
- A3: mẫu `\(:\d+\)|:\d+[–-]\d+` trong chú thích của 79 file phạm vi → 4 lần khớp (`server/routes/orders.js:1633`, `cong_cu/thu_P26c.js` ×3,
  trong đó `:12` có 2 lần) — ngưỡng đếm theo DÒNG, chốt lại khi làm.

## Soát kế hoạch (agent phụ chỉ đọc) — lỗi bản 1, đã sửa ở bản 2
1. A5 đổi PHIEN_BAN làm đỏ `tu_chay/thu_cong_cu.js:459` + `tu_chay/thu_nguoi_gac.js:709` (ngoài Phạm vi) — đã kiểm bằng sed, đúng → Q1.
2. `thu_cong.js` đồng bộ: hàm nghe tín hiệu không chạy được, còn gỡ chết-ngay mặc định → nới hạn 120 s → Q2. Bản 1 nói "+1–3 s" là SAI.
3. KHUON_LOI có 12 cụm bị `thu_cong_cu.js:457–458, :467–468` neo → giữ nguyên khi gộp.
4. Mục R `thu_TOCDO1.js:119–126` cắt `xetBanhCoc`…`\n}\n` và đếm `xetBanhCoc(` = 2 → hàm A3 đặt sau khối, không dùng lại xetBanhCoc.
5. Ca thiếu: SIGINT, đường `exit` khi chạy hết, giết giữa lúc giả lập con chạy, danh sách file quét A3, vế "không FAIL", đếm theo dòng.
6. Ca tín hiệu thu_gia_lap không chạy chung đợt T3–T6 (`thu_gia_lap.js:271–272`).
7. Số dòng sai: thu_TOCDO1 regex `:27` (không :28); don_rong `:14–16`; K1 `:17–19`; K5 `:76–78`; T3 skill không cảnh báo.
8. C1 dùng cặp 4,25 s / 5 s (bản 1: 1,7 / 2 s dư quá mỏng).

## Câu hỏi
- **Q1 (Phạm vi — A5):** đổi `tu_chay/PHIEN_BAN` sang `tu-chay 1.7.0` thì `tu_chay/thu_cong_cu.js:459` và `tu_chay/thu_nguoi_gac.js:709` (cả hai
  chạy trong `npm test`) đỏ vì đòi đúng chữ `tu-chay 1.6.0`. Hai file ngoài Phạm vi. Đề xuất: thêm cả hai vào `## Phạm vi`, mỗi file sửa một
  dòng (1.6.0 → 1.7.0, ghi "TU-CHAY-7 A5"). Không thêm thì A5 + A6 không đạt cùng lúc.
- **Q2 (A2 thu_cong.js — cách làm khác phiếu):** `thu_cong.js` chạy đồng bộ liền một mạch, Node chỉ chạy hàm nghe SIGINT/SIGTERM khi vòng sự kiện
  quay → hàm nghe không bao giờ chạy trước khi bài xong. Cài hàm nghe còn GỠ chết-ngay mặc định: hết hạn 120 s, `spawnSync` của bộ kiểm gửi
  SIGTERM mà con vẫn chạy tới hết = nới hạn (Cấm), Ctrl-C không dừng được. Đề xuất: (a) `process.on('exit')` (bắt đường ném) + TAM đặt tên kèm
  pid, đầu bài dọn các `thu_cong_<pid>_*` của pid ĐÃ CHẾT; không cài hàm nghe tín hiệu. Ca đỏ: thư mục giả của pid chết → bị dọn; của pid
  còn sống → giữ. (b) Đổi thu_cong sang bất đồng bộ — đụng ~700 dòng, ngoài ngân sách. (c) Bỏ vế thu_cong khỏi A2, chỉ làm thu_gia_lap.
  Máy chọn (a) nếu chủ quán duyệt; phiếu ghi "dọn ở exit + bắt SIGINT / SIGTERM" nên cần chủ quán chốt.

## Phát hiện
- thu_cong.js 89,5 s chạy riêng = 75 % hạn; máy bận nhẹ là vượt 80 % → cảnh báo A1 sẽ hiện thường. Chia lượt thu_cong (TU-CHAY-6 Q5) nên vào
  việc sau — KHÔNG làm ở việc này (phiếu: Ngân sách).
- Cùng khuôn "TAM chỉ dọn ở cuối": `cong_cu/thu_TOCDO1.js:17/:189`, `tu_chay/thu_nguoi_gac.js:1126` — ngoài nghiệm thu A2.
- `thu_gia_lap.js` bị giết thì giả lập con đang chạy thành mồ côi (tự sập khi TMPDIR mất) — ngoài nghiệm thu.
- Hồ sơ cũ neo chữ lời gọi `chayBaiThat('tu_chay/thu_cong.js');`: `viec/HOC-2b/dot_bien.py:61`, `viec/TOC-DO-1/dot_bien.py:31` — đổi `:616`
  làm hai đột biến cũ đó LẠC (chạy `python3 viec/HOC-2b/kiem_neo.py` khi làm, ghi kết quả).
