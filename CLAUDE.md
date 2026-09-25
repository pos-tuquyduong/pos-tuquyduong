# POS Tứ Quý Đường — luật làm việc

Quầy bán hàng đang chạy thật tại `pos-tuquyduong.io.vn` (Render + Turso cloud).
Mỗi lỗi ở đây là tiền thật và là nhân viên đứng chờ trước mặt khách.

Triết lý của kho này: **đơn giản · tối ưu · không lỗi**. Và nguyên tắc gốc:
**bịt bằng KHOÁ, không bằng LỜI DẶN** (C16).

@KHUON_LOI.md

---

## 1. Luật số 0 — đọc code thật, không tin hồ sơ

Ngày 23.08.2026 đối chiếu hồ sơ với code POS: **6/8 mục lệch thực tế, lệch cả
hai chiều**. Hồ sơ ghi 2 chỗ `fetch` thiếu `res.ok` → thật ra 34 chỗ.

Mọi khẳng định về hành vi hệ thống phải kèm **file + số dòng vừa đọc trong lượt
này**, hoặc một lệnh `grep` chạy được. Không có thì nói "chưa đọc".

## 2. Bốn tầng của kho này — dùng đủ, đừng bỏ tầng nào

| Tầng | File | Vai trò |
|---|---|---|
| 1 | `CHECKLIST_CODE.md` | lỗi ĐÃ XẢY RA THẬT, chia theo mục A–P. Tra theo mục trước khi sửa. |
| 2 | `kiem_tra_truoc_khi_giao.js` | phép kiểm tự động (36 phép lúc 24.09.2026) + **bánh cóc** `NGUONG_FETCH` |
| 3 | `.git/hooks/pre-commit` | chặn commit khi bộ kiểm đỏ — cài bằng `bash cai_git_hook.sh` |
| 4 | `TIEN_DO_POS.json` | nguồn sự thật DUY NHẤT về việc còn mở / đã xong |

**Tra mục nào khi làm gì** (mã như C19, P4, H.1 là mục trong `CHECKLIST_CODE.md` — KHÁC mã việc
trong `TIEN_DO_POS.json`: ở sổ việc, H1 là "nâng Render", P7 là "tab nhóm"):

- đụng tiền, giá, gói, chiết khấu → **P4, H.1** (đường tiền đã khoá đúng, **đừng phá**).
  Mục P3 ghi "chưa vá" là **đã cũ** — xem mục 8.
- đụng đăng nhập, 401, khoá route → **B1–B7**
- đụng `client/src/` → **P1, P2** (quên build `dist` là lỗi ÂM THẦM)
- đụng màn Bán hàng, Lịch sử đơn, In, ghi chú ly, khách (P7, P13–P18) →
  **mục 9** + `ban_mau_pos/DAC_TA.md` — bản vẽ ĐÃ CHỐT, không tự thiết kế lại
- viết bài thử → **E11, E12, E13** (kiểm mẫu nguy hiểm BIẾN MẤT, đừng kiểm bản vá có mặt)
- viết script patch → **F1, F2, F8, F9**

## 3. Lệnh của kho POS — tên khác kho SX, đừng nhớ nhầm

```bash
npm test                                  # bộ kiểm tự động (SX là: npm run kiem)
node kiem_tra_truoc_khi_giao.js --day-du  # thêm: so băm dist với src
python3 dong_tien_do.py                   # xem sổ việc
cd client && npm run build && cd ..       # BẮT BUỘC sau mọi sửa client/src/
bash ban_mau_pos/chay_thu.sh              # 119 phép của bản mẫu giao diện
```

## 4. Quy trình một việc — theo đúng thứ tự

1. `python3 dong_tien_do.py` — xác nhận việc còn mở, lấy đúng mã việc.
2. Đọc code thật của vùng sắp sửa + mục CHECKLIST tương ứng.
3. `grep` tìm **mọi chỗ cùng khuôn** trong file, trước khi sửa dòng đầu tiên (K4).
4. Viết bài thử **trước**, chạy trên bản CHƯA vá, **xác nhận nó ĐỎ** (K3).
5. Sửa code. Lưu bản trước khi vá thành `<file>.truoc_<TEN_DOT>` (đã có trong `.gitignore`).
6. `npm test` → xanh. Sửa `client/src/` thì `npm run build` rồi `--day-du`.
7. `ghi_tien_do("<mã việc>", "<mã patch>")` hoặc sửa `TIEN_DO_POS.json`.
8. Commit. Báo cáo theo mẫu ở mục 7.

## 5. Ràng buộc vĩnh viễn — sửa vào là hỏng

1. **Server TỰ TRA GIÁ.** Không bao giờ tính tiền theo `unit_price` client gửi.
2. **Lỗi máy in KHÔNG BAO GIỜ rollback đơn.** Đơn đã tạo là đã tạo.
3. **Lỗi downstream KHÔNG cascade.** SX lỗi → POS chạy degraded. `checkStock`
   bọc `try/catch` chỉ log là **chủ ý**, không phải thiếu sót.
4. **Append-only ledger** cho mọi giao dịch có giá trị tài chính.
5. **KHÔNG bỏ `client/dist/` khỏi git** cho tới khi lockfile sinh lại (P6).
6. **Hai hạng thẻ: Vàng và Bạch Kim.** Không có Kim Cương.
7. **Replit dùng kho thử `data/pos_thu.db`, Render dùng Turso.** Chỉ
   `server/ketNoiKho.js` được đọc biến kết nối (P8). `data/pos.db` là rác.
8. **Không fabricate số liệu.** Mất kết nối SX thì hiện giá trị cuối cùng biết
   được + timestamp + màu vàng. Số 999 đã bị loại bỏ vĩnh viễn.

## 6. Tuyệt đối không làm

- **Không sửa `kiem_tra_truoc_khi_giao.js` để làm cảnh báo tắt đi** (K8). Được
  phép THÊM phép kiểm hoặc HẠ `NGUONG_FETCH` sau khi đã dọn thật; mọi thay đổi
  khác phải hỏi chủ quán và nêu rõ lỗ đã tìm ra.
- **Không `git commit --no-verify`**, không `git add -A` (Agent Replit đã tự
  commit 4 lần — F3), không `git push`, không `git merge`, không đụng `main`.
- **Không sửa code trực tiếp trên production.**
- **Không viết số cứng** (giá, hạng thẻ, số tháng) — tất cả nằm ở dữ liệu.
- **Không thêm `fetch` trần ngoài `client/src/utils/api.js`** — bánh cóc sẽ chặn commit.
- **Không dùng `str_replace` với chuỗi tiếng Việt** — hỏng mã. Dùng Python
  `content.replace()` (F8).

## 7. Mẫu báo cáo khi xong — bắt buộc đủ 6 mục

```
VIỆC:        <mã việc trong TIEN_DO_POS.json> — <tên>
ĐÃ SỬA:      <file:dòng> — <sửa gì>
BÀI THỬ:     chạy trên bản chưa vá → ĐỎ ở <chỗ nào>; sau khi vá → XANH
ĐÃ RÀ K4:    grep "<mẫu>" trong <file> → <n> chỗ, đã xử lý hết
CHƯA KIỂM:   <điều máy không kiểm được — nói thẳng, đừng giấu>
GIT:         git log --oneline -2
```

Thiếu mục "CHƯA KIỂM" là báo cáo không đạt. Đã có lần nói "đã kiểm hết" trong
khi tầng DB chỉ là stub.

## 8. Bẫy riêng của POS

- `client/dist/` **nằm trong git và Express serve thẳng nó**. Sửa `src` mà không
  build thì quầy chạy mã cũ, **không có thông báo lỗi nào** (P1).
- `.replit` đặt `NODE_ENV=development` từng làm bundle phình từ 673 kB lên 1.143 kB
  suốt 2 tuần mà không ai biết (P2). Đã bịt bằng `client/package.json`.
- `POST /orders` **ĐÃ CÓ cổng phân quyền** cho các trường đặc quyền (chiết khấu,
  lấy từ gói, mã gói) — bộ kiểm nhóm E canh. Mục P3 trong CHECKLIST_CODE.md ghi
  "chưa vá" là **đã cũ**. Đừng vá lại thứ đang chạy đúng.
- `POST /:id/pay-debt` đã chặn thu hai lần (trả `409 DA_THU_ROI`) — bộ kiểm canh.
- Vùng **CHƯA rà** đường tiền: huỷ đơn/hoàn tiền trong `orders.js`, ví & điểm.
  Đụng vào thì rà trước, đừng giả định như đường tạo đơn.
- Số dòng ghi trong `TIEN_DO_POS.json` và hồ sơ **hay bị lệch** sau các patch
  khác (P7 ghi 954–969, thực tế đã trôi xuống). Luôn `grep` tìm lại.
- Render free tier **ngủ khi idle** → không dùng cron. Hoạt động bán hàng là timer.
- `attached_assets/` đang chứa hàng trăm patch cũ. **Không đọc file ở đó để suy
  ra hành vi hiện tại** — chỉ đọc code trong `server/` và `client/src/`.

## 9. Bản mẫu giao diện — bản vẽ ĐÃ CHỐT với chủ quán

`ban_mau_pos/` là nguồn sự thật cho màn Bán hàng, Lịch sử đơn, In, ghi chú ly và
khách (P7, P13–P18). Đọc `ban_mau_pos/DAC_TA.md` trước khi đụng các màn này, và
đọc thẳng `ban_mau_pos/ban_mau_pos.html` để xem hành vi cụ thể.

- **Chép HÀNH VI, không chép mã.** Dữ liệu trong bản mẫu là giả, không gọi API.
- **Đổi thiết kế thì sửa bản mẫu trước**, chạy `bash ban_mau_pos/chay_thu.sh`
  (phải 119 đạt · 0 hỏng, số phép không được giảm), rồi mới sửa mã thật. Sửa
  bản mẫu phải hỏi chủ quán — đó là bản vẽ đã chốt, không phải nháp.
- **Sáu luật thiết kế — không thương lượng:**
  1. Bấm In mới ghi đơn. Quay lại từ màn xem trước = chưa có gì được ghi.
  2. Hoàn tác 5 giây CHỈ cho thao tác không in giấy: thu, huỷ, đổi cách trả.
  3. Mỗi việc một chỗ làm: thu bill chưa thu CHỈ ở màn Bán hàng. Lịch sử đơn
     không có nút thu — hai nơi thu được một đơn là hai nơi thu hai lần.
  4. Tờ in lại luôn có dòng "IN LẠI · LẦN n".
  5. Lệnh in không bao giờ mất. Máy báo lỗi thì KHÔNG tự in lại.
  6. Không tạo khách ở quầy.
- **Đã loại, đừng dựng lại:** chọn bàn · gọi thêm vào bàn · thu gộp nhiều bill ·
  nút "In lại" trên thanh báo · hoàn tác kiểu xoá đơn · popup thanh toán nhiều bước.
- **Chờ chủ quán quyết — KHÔNG tự quyết thay:** mục 6 của `DAC_TA.md` (ngưỡng
  10 phút và 5 giây, tuỳ chỉnh đổi giá, máy in, trang nhận điểm, nhận đơn app).
  Gặp chỗ chưa chốt thì dừng lại hỏi, đừng tự chọn một phương án.
