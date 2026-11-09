# KH-THE-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: viec/KH-THE-1 · cây sạch · HEAD a4d89ae = FETCH_HEAD a4d89ae (bằng nhau — không kéo)
- `git log --oneline -3`:
  - a4d89ae PHIEU: KH-THE-1
  - de66463 TIEN-DO: GIAO-DIEN-1, KH-TOMTAT-1, GIAO-1, NAP-1, KHACH-APP-1 xong; mo DIEM-MON-1, KH-THE-1, QUAY-UI-1 + xep hang 5 viec; quyet dinh 07-08.11 — so v58
  - 801e99a Merge pull request #81 from pos-tuquyduong/viec/KHACH-APP-1

## Đối chiếu bản chụp — phiên làm tiếp 09.11 (sau khi chủ quán duyệt kế hoạch)
- Nhánh: viec/KH-THE-1 · cây sạch · HEAD da5f5d4 = FETCH_HEAD da5f5d4 (bằng nhau — không kéo)
- `git log --oneline -3`:
  - da5f5d4 KH-THE-1: ke hoach (cho duyet) + trang thai
  - a4d89ae PHIEU: KH-THE-1
  - de66463 TIEN-DO: GIAO-DIEN-1, KH-TOMTAT-1, GIAO-1, NAP-1, KHACH-APP-1 xong; mo DIEM-MON-1, KH-THE-1, QUAY-UI-1 + xep hang 5 viec; quyet dinh 07-08.11 — so v58
- Kho mở ở dạng nông (`thu_BH2` cần commit cbbb809) → `git fetch -q --unshallow origin viec/KH-THE-1` (chỉ tải thêm lịch sử).

## Chủ quán duyệt kế hoạch (09.11)
(1) Q1 không tách banThe.js — App đi đúng taoDon của quầy. (2) Q2 tiền QR về sau khi đơn App hết hạn → vào ví (luật 05.11), chưa có hạng.
(3) ĐỔI Q3: đơn App chỉ có sản phẩm không pha chế → tự "Xong" ngay lúc ghi đã thu, vẫn hiện ở màn Đơn App, nhãn "đã lên hạng, không pha".
(4) ĐỔI Q4: sản phẩm không pha chế (thẻ hạng, gói nạp, gói trả trước) bán MỌI giờ; giỏ có đồ uống vẫn chặn theo giờ — MỘT hàm "giỏ cần pha chế?"
(`gioCanPhaChe`, donApp.js, xuất ra cho KH-NAP-1). Hợp đồng v13 ghi bù phần NAP-1. Nối thu_KHTHE1.js vào bộ kiểm bằng một dòng chayBaiThat.

## Tiến độ
- 09.11 (làm tiếp) bước 4–6: bài thử `cong_cu/thu_KHTHE1.js` đỏ trên gốc (8 đạt · 40 hỏng) → vá → 67 đạt · 0 hỏng; đột biến 23/23 BẮT;
  `npm test -- --day-du` 111 đạt · 0 hỏng (1 cảnh báo cũ: route GET có lệnh ghi ở packages.js / products.js / sync.js — không thuộc việc này).
  Hai bài cũ khoá đúng danh sách trường /kh/hang (thu_KHAPI2 C1, thu_HANG1 F1 — ngoài Phạm vi) sửa đúng dòng danh sách thêm `quyen_loi`, vẫn so BẰNG
  (LUAT §6.7 — không dừng hỏi); bản mới đỏ trên gốc, ghi SỐ CA (§6.8/6.9).
- 09.11 soát kế hoạch (agent phụ chỉ đọc): bắt 5 điểm — ghép dòng thẻ theo `is_membership_item` không chạy được (kết quả chỉ tính
  không có trường đó, `orders.js:894`), chỉ số `i` lệch khi thẻ giữa giỏ, lý do "hết hàng" nhầm cho hạng bị xoá, `so_mon` đơn thật, màn khách —
  đã sửa vào kế hoạch; thêm ca D8, D9, G6, thử tay 3 thao tác.
- 09.11 bước 1–3 xong: đọc code, viết `ke_hoach.md`. Phiếu là việc [T] (tiền + hạng) — **DỪNG chờ chủ quán duyệt kế hoạch**.

## Câu hỏi
(Q1–Q4 của kế hoạch: chủ quán đã trả lời 09.11 — xem trên. Chưa có câu hỏi mới.)

## Chỗ vá → đột biến (cổng A17, A18)
| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| donApp.js docGio nhận dòng thẻ | BV-the-docgio | B1 |
| donApp.js docGio tối đa một thẻ | VS-the-nhieu | B3 |
| donApp.js docGio so_luong thẻ = 1 | VS-the-so-luong | B4 |
| donApp.js docGio khoá thẻ danh sách trắng | VS-the-khoa-la | S3 |
| donApp.js bamGio dòng thẻ băm riêng | VS-the-bam-bo-the | B10 |
| donApp.js bamGio dòng món y như cũ | VS-the-bam-doi-cu | K1 |
| donApp.js thanDon → membership_buy lúc tạo phiên | BV-the-membership-buy | D1 |
| donApp.js baoGia ghép dòng thẻ theo dải product_id | VS-the-ghep-vi-tri | B1 |
| donApp.js GIU_MA 3 mã thẻ | BV-the-giu-ma | A2 |
| donApp.js SĐT luôn từ token | VS-the-sdt-than | S1 |
| donApp.js LY_DO_NGAN dòng thẻ | VS-the-ly-do-thieu-chu | D8 |
| donApp.js Q3 tien_trinh_quay 'xong' ghi sẵn | BV-tu-xong | Q3 (QR) |
| donApp.js Q3 trả về sau chốt ví | VS-tu-xong-tra-ve | Q3 (ví) |
| donApp.js Q4 bỏ kiểm giờ khi giỏ không pha | BV-gio-moi-gio | GIO1 |
| donApp.js Q4 gioCanPhaChe chỉ đếm dòng món | VS-gio-can-pha-dem-ca-the | GIO1 |
| donApp.js chiTietDon mon[].loai 'the' | BV-chi-tiet-loai | G2 |
| donApp.js dsQuay bỏ dòng thẻ khỏi mon[] | BV-quay-bo-the | G3 |
| dongHoaDon.js dòng hoá đơn loai 'the' | BV-hoa-don-the | G1 |
| dongHoaDon.js ghi chú "Hạn mới" | VS-hoa-don-han-rong | G1 |
| tiers.js giữ quyen_loi khi không gửi | BV-quyen-loi-giu | F3 |
| tiers.js trần 10 dòng | VS-quyen-loi-tran-dong | F4 |
| tiers.js trần 120 ký tự | VS-quyen-loi-tran-ky-tu | F4 |
| kh/index.js GET /hang quyen_loi[] | BV-hang-quyen-loi | F2 |

Tên đột biến: BV-the-docgio, VS-the-nhieu, VS-the-so-luong, VS-the-khoa-la, VS-the-bam-bo-the, VS-the-bam-doi-cu, BV-the-membership-buy,
VS-the-ghep-vi-tri, BV-the-giu-ma, VS-the-sdt-than, VS-the-ly-do-thieu-chu, BV-tu-xong, VS-tu-xong-tra-ve, BV-gio-moi-gio,
VS-gio-can-pha-dem-ca-the, BV-chi-tiet-loai, BV-quay-bo-the, BV-hoa-don-the, VS-hoa-don-han-rong, BV-quyen-loi-giu, VS-quyen-loi-tran-dong,
VS-quyen-loi-tran-ky-tu, BV-hang-quyen-loi.
