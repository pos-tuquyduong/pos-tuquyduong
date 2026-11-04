# Kế hoạch HD-KH-1 (việc thường, máy làm thẳng — phiếu không dặn chờ duyệt)

## Phương án
- **Dựng dòng hoá đơn.** A: chép hàm hoá đơn sang máy chủ + bài so (~200 dòng, hai nơi sửa). B (CHỌN): máy chủ `import()` đúng
  `client/src/utils/hoaDon.js` (ESM, hàm thuần) — một nguồn; `server/utils/dongHoaDon.js` (~55 dòng) chỉ DẸT tờ thành dòng
  `{loai, trai, phai, dam, gach, ghi_chu}`. Dữ liệu tờ: tách thân `GET /hoa-don/:id` thành hàm `dungHoaDon(o)` dùng chung (không đổi hành vi quầy).
- **cach_tra / giu_vi / con_lai.** Không thêm cột (phiếu: không đổi DB): đọc từ phiên `pos_phien_thanh_toan` (`cach`, `giu_vi`, `giu_vi_me`, `con_lai`) trong
  `CAU_DON` (hai nhánh UNION); `cach_tra` suy ra: `cach='tai_khoan'`→`vi`; có giữ ví→`vi_qr`; còn lại `qr`. Đơn quầy → `null`.
- **Hợp đồng** v5 → v6 (không kiểm được main: SEPAY-1 — ghi Câu hỏi/Phát hiện).

## Ca thử ↔ Nghiệm thu
A → A1–A8 (≥ 6 loại đơn: thường, hạng, mã giảm, phí giao, huỷ, ví + QR, chữ quán sửa) · B → B0–B7 · C → C1–C5 · D → thu_HOPDONG_KH (+ ca v6) · K5 → K5, B0, C3 và thu_HD1 (npm test).
Đường song song: mọi chỗ đọc đơn App của khách là `tomDon` (list + chi tiết dùng chung); `dsQuay` (quầy) không đổi. Luồng hợp lệ không được chặn: C3 (khách xem đơn của mình), đơn quầy vẫn đủ trường cũ (K5).
