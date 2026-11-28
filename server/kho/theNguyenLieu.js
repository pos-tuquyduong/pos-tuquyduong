/**
 * KHO-GON-2 D1 — thẻ một nguyên liệu: tồn + nhãn, dòng phiếu chờ duyệt, "dùng cho món" (đủ bao nhiêu phần — tinh.toiDa), lô đang có, lịch sử gần nhất.
 * Chỉ ĐỌC. Ba nút của thẻ đi đường ghi có sẵn (phiếu nhận · phát sinh · chỉnh tay) — không có đường ghi ở đây.
 */
const tinh = require('./tinh');
const duLieu = require('./duLieu');
const phaChe = require('./phaChe');

const SO_DONG_LICH_SU = 30;

const nhanTon = (ton, toiThieu) => (ton <= tinh.SAI_SO ? 'het' : toiThieu != null && ton < Number(toiThieu) ? 'duoi_nguong' : 'du');

async function docThe(csdl, id, luc) {
  const n = (await duLieu.docTon(csdl, luc)).nguyen_lieu.find((x) => Number(x.id) === id);
  if (!n) return null;
  const choDuyet = await csdl.query(`SELECT p.id AS phieu_id, p.so_phieu, p.loai, p.nguoi_tao, SUM(d.so_luong) AS luong FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id
    WHERE d.nguyen_lieu_id = ? AND p.trang_thai = 'cho_duyet' AND p.loai <> 'DH' GROUP BY p.id ORDER BY p.id DESC`, [id]);
  const bang = await duLieu.docBangCongThuc(csdl);
  const lamSan = await phaChe.docLamSan(csdl);   // mỗi món tính theo ĐƯỜNG trừ kho của chính nó: món làm sẵn qua phiếu xuất pha chế (thành phần làm sẵn trừ LÔ, Q2);
  // món pha tại chỗ qua đường bán (banHang — triển khai xuống tận nguyên liệu, không đổi)
  const mon = await csdl.query(`SELECT p.id, p.name, COALESCE(s.kieu, 'chua_dinh_luong') AS kieu FROM pos_products p LEFT JOIN kho_san_pham s ON s.pos_product_id = p.id
    WHERE p.is_active = 1 AND EXISTS (SELECT 1 FROM kho_cong_thuc c WHERE c.san_pham_id = p.id) ORDER BY p.sort_order, p.name`);
  const dungCho = [];
  for (const m of mon) {
    let mot = null;
    try { mot = tinh.trienKhai({ goc: Number(m.id), bang }, 1, m.kieu === 'lam_san' ? lamSan : null).find((d) => d.nguyen_lieu_id === id); } catch { /* công thức vòng — bỏ qua món này */ }
    if (mot) dungCho.push({ san_pham_id: Number(m.id), ten: m.name, kieu: m.kieu, mot_phan: mot.luong, mot_phan_hien: tinh.doiDonVi(mot.luong, n.he_so_doi || 1),
      du_phan: tinh.toiDa([{ khoa: 'nl', luong: mot.luong }], new Map([['nl', n.ton]])) });
  }
  const lo = (await duLieu.conLaiTheoLo(csdl, 'l.nguyen_lieu_id = ?', [id], 'han_dung IS NULL, han_dung, id'))
    .map((l) => ({ id: Number(l.id), so_luong: Number(l.so_luong), con: Number(l.con), con_hien: tinh.doiDonVi(Number(l.con), n.he_so_doi || 1), han_dung: l.han_dung,
      tao_luc: l.tao_luc, gia_von: l.gia_von }));
  const lichSu = await csdl.query(`SELECT p.id AS phieu_id, p.so_phieu, p.loai, p.trang_thai, p.su_co, p.ghi_chu, COALESCE(d.nguoi, p.nguoi_tao) AS nguoi,
    COALESCE(d.luc, p.tao_luc) AS luc, SUM(d.so_luong) AS so_luong FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id
    WHERE d.nguyen_lieu_id = ? AND p.loai <> 'DH' GROUP BY p.id ORDER BY p.id DESC LIMIT ?`, [id, SO_DONG_LICH_SU]);
  const hien = (x) => tinh.doiDonVi(Number(x), n.he_so_doi || 1);
  return {
    nguyen_lieu: { id, ten: n.ten, nhom_ten: n.nhom_ten, don_vi: n.don_vi_hien || n.don_vi_luu, don_vi_luu: n.don_vi_luu, he_so_doi: n.he_so_doi || 1, ton: n.ton,
      ton_hien: n.ton_hien, ton_toi_thieu: n.ton_toi_thieu, gia_nhap: n.gia_nhap, dang_dung: n.dang_dung, nhan: nhanTon(n.ton, n.ton_toi_thieu) },
    cho_duyet: choDuyet.map((p) => ({ ...p, phieu_id: Number(p.phieu_id), luong: Math.abs(Number(p.luong)), luong_hien: hien(Math.abs(Number(p.luong))), tang: Number(p.luong) > 0 })),
    dung_cho_mon: dungCho,
    lo,
    lich_su: lichSu.map((d) => ({ ...d, phieu_id: Number(d.phieu_id), so_luong: Number(d.so_luong), so_luong_hien: hien(d.so_luong) })),
  };
}

module.exports = { docThe, nhanTon };
