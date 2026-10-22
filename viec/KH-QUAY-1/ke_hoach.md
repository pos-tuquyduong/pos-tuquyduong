# KH-QUAY-1 — kế hoạch

Việc thường [Th]: chạy thẳng, không chờ duyệt.

## Phương án
- **A (chọn)**: 2 file mới — `client/src/utils/maApp.js` (hàm thuần ~35 dòng) + `client/src/components/MaDangNhapApp.jsx` (~110 dòng); `Customers.jsx` thêm 1 dòng import + 1 dòng gắn `<MaDangNhapApp sdt={selectedCustomer.phone} />` trong khung chi tiết khách. Thành phần giữ state mã ngay trong nó → đóng modal (unmount) là mất mã, không localStorage.
- B: viết thẳng vào `Customers.jsx` (~+110 dòng vào file 954 dòng, đụng nhiều state chung). Nhiều dòng hơn trong file chung, khó sửa → bỏ.

## Thiết kế
- Gọi `api.post('/kh/cap-ma', { sdt })` (qua `utils/api.js`, base `/api/pos`); không `fetch` trần.
- Lúc nhận phản hồi: `hetHanLuc = Date.now() + het_han_giay*1000`; mỗi giây `giayConLai(hetHanLuc, Date.now())`. Hết giờ → mã mờ, "Hết hạn", nút "Lấy mã mới".
- Nút khoá khi đang chờ (cờ `dangLay` + `useRef` để hai cú bấm sát nhau không lọt qua trước khi render).
- Khi đổi khách / đóng modal: thành phần unmount (đặt `key={sdt}`) → mất mã. Phản hồi về muộn sau khi unmount thì bỏ (cờ `conSong`).
- Lỗi: `loiMaApp(err)` ở `maApp.js` — 503 (`KH_CHUA_CAU_HINH`) → "App khách chưa bật — báo quản lý"; `SDT_KHONG_HOP_LE` → SĐT khách không hợp lệ; còn lại → `error` của máy chủ, rỗng thì lời mặc định.

## Ánh xạ nghiệm thu → bằng chứng
| Mục | Bằng chứng |
|---|---|
| A | thành phần + gắn; `thu_KHQUAY1.js` D1–D9, G1–G6 (đồng hồ); đọc code (không localStorage: grep) |
| B | `thu_KHQUAY1.js` L1–L6 |
| C | đọc code `useRef` khoá; CHƯA KIỂM bằng máy (không có bài thử giao diện) |
| D | `git diff` Customers.jsx chỉ 2 dòng thêm |
| E | `node cong_cu/thu_KHQUAY1.js` |
| F | `npm run build`, `npm test`, `--day-du` |
| G | 3 thao tác trong trang_thai.md |

## Đường song song / luồng hợp lệ (K4, K5)
- `grep fetch` trong thành phần mới: 0. Không có chặn mới nên không luồng hợp lệ nào bị chặn.
- Server không đổi; mã quầy không giới hạn lượt xin (đã đọc `server/routes/kh/quay.js:1-3`).
