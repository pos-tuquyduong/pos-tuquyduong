# Kế hoạch BAO-1a (viết bổ sung khi đã làm — máy làm thẳng, phiếu không dặn "chờ duyệt kế hoạch")

## Phương án
| Phần | A (chọn) | B | Lý do |
|---|---|---|---|
| Thành phần | 2 file: `thongBaoKho.js` (kho thuần, có bài thử) + `ThongBao.jsx` (vẽ, `useSyncExternalStore`) · ~60 dòng | một file có cả hàm và thành phần · ~50 dòng | B làm lint "fast refresh" đỏ khi màn khác import hàm; A tách để bài thử nạp được kho bằng `import()` |
| Gọi từ màn | `baoXong(chu)` · `baoLoi(tieuDe, lyDo)` · `baoLoiTu(việc, err)` (lấy câu máy chủ, chữ kỹ thuật → câu chung) | mỗi màn tự dựng câu lỗi | A: một chỗ giữ câu chung (tiêu chí 4 · một quy tắc một hàm) |
| Màn dùng `error`/`success` state đầu trang | thay `setError/setSuccess` bằng gọi toast, xoá khối vẽ dòng chữ | giữ dòng chữ cũ + thêm toast | B báo hai lần; A xoá hẳn khối khuất |
| Sales.jsx (38 chỗ `setError`) | một hàm `setError` mức module gọi `baoLoi` (giữ nguyên 38 lời gọi, kể cả trong hàm cập nhật `setCart`) | sửa từng chỗ | A ít dòng; kho gộp thông báo ở microtask nên gọi trong lúc vẽ không cảnh báo React |
| BanHang/** (màn mới đã chốt) | KHÔNG đổi — xem `trang_thai.md` mục Câu hỏi | chuyển banner `bh-loi` sang toast | `ban_mau_pos/` là bản vẽ đã chốt, đổi phải hỏi chủ quán |

## Ca thử ↔ nghiệm thu
- A (thành phần): A1–A10, B1–B8 trong `cong_cu/thu_BAO1a.js`
- B (rà màn): D2 (28 file nối ThongBao, không `alert(`) + bảng trong `trang_thai.md`
- C (câu lỗi): C1–C5
- D (nút khoá): D3 (CSS mờ) + D4 (13 file có cờ đang xử lý đi cùng `disabled`)
- E (bánh cóc + nối bộ kiểm): D1 `alert(` ≤ 0; dòng `chayBaiThat('cong_cu/thu_BAO1a.js')` trong `kiem_tra_truoc_khi_giao.js`
- K5 (không đổi máy chủ/tiền/quyền): không file nào dưới `server/` đổi (xem `git diff --stat`)

## Đường song song / luồng hợp lệ (K4, K5)
- `alert(` : grep cả `client/src` → 11 chỗ (Orders 8, Refunds 2, InvoicePrint 1), đã xử lý hết.
- Thông báo trong hàm `setCart(prev => …)` của Sales (K7): kho gộp ở microtask + chống trùng câu → không lặp ở StrictMode.
- Luồng hợp lệ không bị chặn: nút In ở Kho/XemPhieu giữ nguyên dạng `if (await ghi(() => api.post(.../in))) setKho(k)` (bài `thu_KHOIN1.js` khoá đúng dạng đó).
