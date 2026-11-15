# KH-NAP-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (15.11.2026)
- Nhánh: `viec/KH-NAP-1`; cây sạch (không file đã theo dõi đang sửa).
- `git fetch origin viec/KH-NAP-1` → HEAD `6fe3f4f` · FETCH_HEAD `6fe3f4f` (bằng nhau — không kéo).
- `git log --oneline -3`:
  - 6fe3f4f PHIEU: KH-NAP-1
  - d8f0053 TIEN-DO: QC-APP-1 (5568725) + ND-API-1 (1a71424) xong; KH-NAP-1 gop luat the khong tra so du + nap App qua don, mo (Opus lan 2); them BAO-MAT-POS-1, VOUCHER-3; quyet dinh 12-14.11 (Q24, tien ve muon du quyen loi); lich 14.11; KHUON_LOI bo sung — so v66
  - 1a71424 Merge pull request #93 from pos-tuquyduong/viec/ND-API-1
- Có commit `PHIEU: KH-NAP-1`. Kho nông (`git rev-parse --is-shallow-repository` → true).

## Bước 2–3
- Đã đọc: phiếu, CLAUDE.md, KHUON_LOI.md, code thật donApp.js · giuCho.js · thanh-toan.js · orders.js (khối nạp / thẻ 220–290, 520–580,
  970–1060) · viKhach.js · wallets.js (ghiVi, LOAI_TINH_VAO_VI) · goi-nap.js · routes/kh/index.js · loi.js · DonApp.jsx · ThuTien.jsx · tinh.js.
- Đo thật bài cũ phải sửa (Q-C): bản sao nháp, chặn thử thẻ trả số dư ở orders.js + giuCho.js (4 dòng), chạy `npm test` và giả lập —
  kết quả ghi trong `ke_hoach.md` mục Q-C.
- Kế hoạch: `ke_hoach.md`. Phiếu "Chờ duyệt kế hoạch" → commit, push, DỪNG ở bước 3.

## Câu hỏi
1. **(Cấm — giuCho.js ngoài khối chặn nạp / thẻ)** A6 cần sửa MỘT dòng trong `chotPhien` (giuCho.js): `const muon = nguon === 'tay' && them.muon === true`
   → `const muon = them.muon === true` (+ câu chú thích), để webhook tiền về muộn dùng CÙNG chotPhien kiểu muộn mà quầy dùng khi xác nhận tay.
   Đây là chỗ ngoài "khối chặn nạp / thẻ" mà mục Cấm cho phép → xin chủ quán duyệt cùng kế hoạch (chi tiết ở `ke_hoach.md` Q-A). Không duyệt thì A6 không
   làm được mà không viết đường chốt thứ hai (phiếu cấm).

2. **Đối soát cho đơn chốt muộn tự động (A6):** xác nhận tay muộn đang có mục CẦN XEM ở Đối soát (doiSoat.js phepXacNhanTay); đơn App chỉ thẻ / chỉ nạp
   mà máy TỰ chốt khi tiền về muộn thì không vào mục nào (tiền đã khớp đúng số, đúng phiên). Đề xuất: KHÔNG thêm mục (tiền đúng số, đúng đơn — giống tiền
   về đúng hạn); quầy vẫn thấy đơn ở màn Đơn App hôm đó. Bạn chỉ cần xác nhận, hoặc dặn thêm mục.

## Soát kế hoạch (agent phụ, chỉ đọc)
- Bắt 1 lỗi thật: khối chốt muộn bản đầu rơi về `vaoVi(p)` với phiên cũ → có thể vừa có đơn (quầy xác nhận tay lúc còn hạn) vừa cộng ví. Đã đổi sang cách
  ngắn hơn (một cờ `muonChot` trên lời gọi chotPhien có sẵn) — hết đường đó, thêm đột biến VS-muon-p-cu.
- Đã thêm: báo rõ lý do khi không chốt được; ca A7 hoàn / sự cố; ca giá gói đổi; ca thứ tự lỗi (NGOAI_GIO trước NAP_KHONG_GOP); `chiTinh` truyền `nap`;
  sửa hai chú thích giuCho.js:9, :97; ca D3 giờ VN, B2 cờ payOS bắt buộc, A8 `tra[]` + `GET /don`; dòng G1/G2 trong bảng.

## Phát hiện
- `cong_cu/thu_BH2.js` ca G1 đỏ trong kho nông (máy mây): `git log cbbb809..HEAD` → `bad revision` vì `cbbb809` không có trong lịch sử nông
  (`git cat-file -t cbbb809` → fatal). Không do việc này. Đã chạy `git fetch -q --unshallow origin viec/KH-NAP-1` (chỉ tải lịch sử, không đổi file) → `cbbb809` có.
