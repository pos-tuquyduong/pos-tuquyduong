/**
 * KHO-GON-2 B3–B4 — ảnh hoá đơn gắn phiếu nhận (bảng kho_anh_phieu, bước 034). Kiểu kiểm theo BYTE ĐẦU (utils/anhMon loaiAnh — không tin đuôi /
 * Content-Type); cỡ chặn ở bộ đọc thân (duong.js, GIOI_HAN_ANH_PHIEU). Ai xem được phiếu thì xem được ảnh — đọc luôn theo CẶP (phiếu, ảnh).
 */
const { loaiAnh, SO_ANH_PHIEU_TOI_DA } = require('../utils/anhMon');

const loi = (http, code, error) => ({ loi: [http, { error, code }] });

/** Q5: người gắn = người nhận (tạo phiếu) hoặc chủ / quản lý; chỉ phiếu nhận chưa huỷ. Gọi TRƯỚC khi đọc thân (không quyền thì không đọc byte nào). */
async function duocGan(csdl, phieuId, { nguoi, quanLy }) {
  const p = await csdl.queryOne('SELECT loai, trang_thai, nguoi_tao FROM kho_phieu WHERE id = ?', [phieuId]);
  if (!p) return loi(404, 'KHONG_THAY', 'Không thấy phiếu');
  if (p.loai !== 'PN') return loi(400, 'CHI_PHIEU_NHAN', 'Chỉ phiếu nhận hàng mới gắn ảnh hoá đơn');
  if (p.trang_thai === 'huy') return loi(409, 'PHIEU_DA_HUY', 'Phiếu đã huỷ — không gắn ảnh');
  if (!quanLy && p.nguoi_tao !== nguoi) return loi(403, 'KHONG_PHAI_NGUOI_NHAN', 'Chỉ người nhận hàng hoặc chủ / quản lý gắn ảnh vào phiếu này');
  return {};
}

/** Lưu một ảnh. Điều kiện "chưa đủ SO_ANH_PHIEU_TOI_DA" nằm NGAY trong câu ghi — hai người gửi cùng lúc không lọt ảnh quá số. */
async function luuAnh(tx, phieuId, buf, { nguoi, quanLy, luc }) {
  const kieu = Buffer.isBuffer(buf) ? loaiAnh(buf) : null;
  if (!kieu) return loi(400, 'ANH_KHONG_HOP_LE', 'Ảnh phải là JPEG, PNG hoặc WebP thật');
  const q = await duocGan(tx, phieuId, { nguoi, quanLy });
  if (q.loi) return q;
  const kq = await tx.run(`INSERT INTO kho_anh_phieu (phieu_id, kieu, du_lieu, co, nguoi, tao_luc) SELECT ?, ?, ?, ?, ?, ?
    WHERE (SELECT COUNT(*) FROM kho_anh_phieu WHERE phieu_id = ?) < ?`, [phieuId, kieu, buf.toString('base64'), buf.length, nguoi, luc, phieuId, SO_ANH_PHIEU_TOI_DA]);
  if (!kq.changes) return loi(400, 'QUA_SO_ANH', `Mỗi phiếu tối đa ${SO_ANH_PHIEU_TOI_DA} ảnh`);
  return { anh: { id: Number(kq.lastInsertRowid), kieu, co: buf.length } };
}

/** Danh sách ảnh của phiếu — chỉ cột nhỏ, KHÔNG kéo byte. */
const dsAnh = async (csdl, phieuId) => (await csdl.query('SELECT id, kieu, co FROM kho_anh_phieu WHERE phieu_id = ? ORDER BY id', [phieuId]))
  .map((a) => ({ id: Number(a.id), kieu: a.kieu, co: Number(a.co) }));

/** Một ảnh theo CẶP (phiếu, ảnh) — id ảnh của phiếu khác → null. */
const docAnh = (csdl, phieuId, anhId) => csdl.queryOne('SELECT kieu, du_lieu FROM kho_anh_phieu WHERE id = ? AND phieu_id = ?', [anhId, phieuId]);

/** Chủ quán sửa phiếu nhận (= huỷ cũ + phiếu mới) → ảnh hoá đơn đi theo phiếu mới (chép, phiếu cũ giữ nguyên — sổ chỉ thêm). */
const chepAnh = (tx, cuId, moiId) => tx.run(`INSERT INTO kho_anh_phieu (phieu_id, kieu, du_lieu, co, nguoi, tao_luc)
  SELECT ?, kieu, du_lieu, co, nguoi, tao_luc FROM kho_anh_phieu WHERE phieu_id = ? ORDER BY id`, [moiId, cuId]);

module.exports = { duocGan, luuAnh, dsAnh, docAnh, chepAnh };
