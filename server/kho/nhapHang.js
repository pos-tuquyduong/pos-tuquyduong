/**
 * KHO-2b — đặt hàng (DH) và nhận hàng (PN theo đơn / mua lẻ). Hàm tạo chạy trong giao dịch, trả { id } hoặc { loi: [http, thân] }.
 * DH: dòng 'dat' (+lượng, đơn giá = giá nhập lúc đặt) — KHÔNG vào tồn (duLieu.DA_DUYET). Chủ quán tự duyệt; quản lý tự duyệt khi tổng ≤ hạn mức.
 * PN: dòng 'nhap' (+lượng, giá thật, hạn) — luôn chờ người KHÁC duyệt; duyệt → mỗi dòng một lô (ghiKhoNhan). Giá nhập của nguyên liệu KHÔNG đổi
 * (chủ quán chốt 31.10). `ep` = chủ quán sửa phiếu: tự duyệt, bỏ kiểm đơn (phiếu mới giữ đơn của phiếu cũ).
 */
const { addDaysToDateString } = require('../utils/helpers');
const tinh = require('./tinh');
const duLieu = require('./duLieu');

const loi = (http, code, error) => ({ loi: [http, { error, code }] });
const soDuong = (x) => Number.isFinite(Number(x)) && Number(x) > 0;
const thieuNL = (tx, ds) => duLieu.demThieu(tx, 'kho_nguyen_lieu', [...new Set(ds.map((d) => d.nguyen_lieu_id))]);
const dongSai = () => loi(400, 'DONG_SAI', 'Dòng sai: chọn nguyên liệu / món, lượng lớn hơn 0');

/** Đơn đặt hàng: món × số phần (triển khai công thức) + nguyên liệu lẻ, gộp mỗi nguyên liệu một dòng. */
async function taoDatHang(tx, { mon, nguyenLieu, nccId, ghiChu, nguoi, vaiTro, maGui, luc, thayCho = null, lyDo = null, ep = false }) {
  if (!Array.isArray(mon) || !Array.isArray(nguyenLieu)) return dongSai();
  const m = mon.map((x) => ({ san_pham_id: Number(x?.san_pham_id), so_phan: Number(x?.so_phan) }));
  const l = nguyenLieu.map((x) => ({ nguyen_lieu_id: Number(x?.nguyen_lieu_id), luong: Number(x?.luong) }));
  if ((!m.length && !l.length) || m.some((x) => !(x.san_pham_id > 0) || !soDuong(x.so_phan)) || l.some((x) => !(x.nguyen_lieu_id > 0) || !soDuong(x.luong))) return dongSai();
  const px = tinh.lapPhieuXuat(m, await duLieu.docBangCongThuc(tx));
  if (px.thieu_cong_thuc.length) {
    return loi(400, 'MON_CHUA_CONG_THUC', `Món chưa có công thức: ${(await duLieu.tenSanPham(tx, px.thieu_cong_thuc)).join(', ')}`);
  }
  const gop = tinh.gopLuong([...px.theo_mon.flatMap((x) => x.nguyen_lieu), ...l]);
  if (await thieuNL(tx, gop)) return loi(400, 'KHONG_THAY', 'Nguyên liệu không có');
  const ids = gop.map((d) => d.nguyen_lieu_id);
  const gia = duLieu.theoId(await tx.query(`SELECT id, gia_nhap FROM kho_nguyen_lieu WHERE id IN (${duLieu.dauHoi(ids)})`, ids));
  const dong = gop.map((d) => ({ ...d, don_gia: gia.get(d.nguyen_lieu_id)?.gia_nhap ?? null }));
  const tong = tinh.tongTien(dong.map((d) => ({ so_luong: d.luong, don_gia: d.don_gia })));
  const tuDuyet = ep || vaiTro === 'owner' || (vaiTro === 'manager' && tinh.trongHanMuc(tong, await duLieu.docHanMuc(tx, 'kho_han_muc_dat_hang')));
  const id = await duLieu.themPhieu(tx, { loai: 'DH', tuDuyet, nguoi, luc, nccId, ghiChu, thayCho, lyDo, maGui });
  for (const d of dong) {
    await tx.run("INSERT INTO kho_phieu_dong (phieu_id, nguyen_lieu_id, so_luong, don_gia, loai, nguoi, luc) VALUES (?, ?, ?, ?, 'dat', ?, ?)",
      [id, d.nguyen_lieu_id, d.luong, d.don_gia, nguoi, luc]);
  }
  return { id };
}

/** Phiếu nhận: theo đơn (don_id = đơn đã duyệt còn mở) hoặc mua lẻ. Hạn trống + nguyên liệu có hạn → giờ nhận + hạn nguyên liệu. */
async function taoPhieuNhan(tx, { donId, dong, nccId, ghiChu, nguoi, maGui, luc, thayCho = null, lyDo = null, ep = false }) {
  if (!Array.isArray(dong) || !dong.length) return dongSai();
  const ds = dong.map((d) => ({ nguyen_lieu_id: Number(d?.nguyen_lieu_id), luong: Number(d?.luong),
    don_gia: d?.don_gia === '' || d?.don_gia == null ? null : Number(d.don_gia), han: tinh.chuanHan(d?.han_dung) }));
  if (ds.some((d) => !(d.nguyen_lieu_id > 0) || !soDuong(d.luong) || (d.don_gia !== null && !(Number.isInteger(d.don_gia) && d.don_gia >= 0)) || d.han === undefined)) {
    return loi(400, 'DONG_SAI', 'Dòng sai: chọn nguyên liệu, lượng lớn hơn 0, giá là số đồng ≥ 0, hạn dạng ngày');
  }
  if (await thieuNL(tx, ds)) return loi(400, 'KHONG_THAY', 'Nguyên liệu không có');
  if (donId != null && !ep) {
    const don = await tx.queryOne('SELECT loai, trang_thai FROM kho_phieu WHERE id = ?', [donId]);
    if (don?.loai !== 'DH' || don.trang_thai !== 'da_duyet') return loi(409, 'DON_KHONG_MO', 'Đơn chưa duyệt hoặc đã huỷ — không nhận theo đơn này được');
    if ((await duLieu.docConLaiDon(tx, donId)).du) return loi(409, 'DON_DA_DONG', 'Đơn đã nhận đủ — tải lại');
  }
  const ids = [...new Set(ds.map((d) => d.nguyen_lieu_id))];
  const han = duLieu.theoId(await tx.query(`SELECT id, han_ngay FROM kho_nguyen_lieu WHERE id IN (${duLieu.dauHoi(ids)})`, ids));
  const id = await duLieu.themPhieu(tx, { loai: 'PN', tuDuyet: ep, nguoi, luc, nccId, ghiChu, donId, thayCho, lyDo, maGui });
  for (const d of ds) {
    await tx.run("INSERT INTO kho_phieu_dong (phieu_id, nguyen_lieu_id, so_luong, don_gia, han_dung, loai, nguoi, luc) VALUES (?, ?, ?, ?, ?, 'nhap', ?, ?)",
      [id, d.nguyen_lieu_id, d.luong, d.don_gia, d.han ?? duLieu.hanLo(luc, han.get(d.nguyen_lieu_id)?.han_ngay), nguoi, luc]);
  }
  if (ep) await ghiKhoNhan(tx, id, luc);
  return { id };
}

/** Phiếu nhận VỪA chuyển da_duyet: mỗi dòng một lô (lượng, hạn, giá vốn = giá nhập thật), gắn lo_id. */
async function ghiKhoNhan(tx, id, luc) {
  for (const d of await tx.query("SELECT * FROM kho_phieu_dong WHERE phieu_id = ? AND loai = 'nhap' ORDER BY id", [id])) {
    const lo = await tx.run('INSERT INTO kho_lo (nguyen_lieu_id, so_luong, han_dung, gia_von, phieu_id, tao_luc) VALUES (?, ?, ?, ?, ?, ?)',
      [d.nguyen_lieu_id, d.so_luong, d.han_dung, d.don_gia, id, luc]);
    await tx.run('UPDATE kho_phieu_dong SET lo_id = ? WHERE id = ?', [Number(lo.lastInsertRowid), d.id]);
  }
  return {};
}

/** Màn Đặt hàng / Nhận hàng: nguyên liệu đang dùng (tồn, cờ dưới tối thiểu), "hay mua", món có công thức (lượng 1 phần), đơn đã duyệt còn mở. */
async function goiYNhap(csdl, luc) {
  const ton = await duLieu.docTon(csdl, luc);
  const hay = await csdl.query(`SELECT d.nguyen_lieu_id, COUNT(*) AS n FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id WHERE p.loai = 'PN'
    AND p.trang_thai IN ('cho_duyet', 'da_duyet') AND d.loai = 'nhap' AND p.tao_luc >= ? GROUP BY d.nguyen_lieu_id ORDER BY n DESC, d.nguyen_lieu_id LIMIT ?`,
  [addDaysToDateString(luc, -tinh.HAY_MUA_NGAY), tinh.HAY_MUA_SO]);
  const bang = await duLieu.docBangCongThuc(csdl);
  const mon = (await csdl.query(`SELECT p.id, p.name FROM pos_products p WHERE p.is_active = 1 AND EXISTS (SELECT 1 FROM kho_cong_thuc c WHERE c.san_pham_id = p.id)
    ORDER BY p.sort_order, p.name`)).map((p) => ({ san_pham_id: Number(p.id), ten: p.name, mot_phan: tinh.trienKhai({ goc: Number(p.id), bang }, 1) }));
  const donMo = [];
  for (const d of await csdl.query("SELECT id, so_phieu, nha_cung_cap_id, tao_luc FROM kho_phieu WHERE loai = 'DH' AND trang_thai = 'da_duyet' ORDER BY id DESC LIMIT 50")) {
    const c = await duLieu.docConLaiDon(csdl, d.id);
    if (!c.du) donMo.push({ ...d, id: Number(d.id), con_lai: c.con_lai });
  }
  return { nguyen_lieu: ton.nguyen_lieu.filter((n) => n.dang_dung), nhom: ton.nhom_nguyen_lieu, hay_mua: hay.map((h) => Number(h.nguyen_lieu_id)), mon, don_mo: donMo,
    nha_cung_cap: await csdl.query('SELECT id, ten, sdt FROM kho_nha_cung_cap WHERE dang_dung = 1 ORDER BY ten') };
}

module.exports = { taoDatHang, taoPhieuNhan, ghiKhoNhan, goiYNhap };
