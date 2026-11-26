/**
 * KHO-GON-1 — kiểm kê tối (đếm MÙ — chủ quán 26.11 Q1), nhận bàn giao sáng (so với số tối qua chốt), chỉnh tồn tay. MỘT hàm điều chỉnh cho cả ba:
 * phiếu KK đã duyệt ngay (cộng → lô mới; trừ → lô FEFO kể cả lô quá hạn, khuôn phatSinh.js), không lệch → không phiếu.
 * Tồn đổi giữa lúc mở và lúc lưu (C5): màn mở nhận `moc` = id phiếu lớn nhất + `moc_luc` = giờ đọc. Lúc lưu, máy chủ TỰ tính
 *   gốc = tồn hiện tại − Σ dòng phiếu da_duyet có id > moc (= tồn lúc màn mở; không tin số màn gửi), điều chỉnh = số đếm − gốc.
 *   Ly bán xen giữa (phiếu mới) không tạo lệch giả. Huỷ / duyệt phiếu CŨ sau moc_luc (đổi tồn mà không có phiếu mới) → 409 KHO_TON_DOI "tải lại".
 *   Có phiếu KK id > moc (người khác vừa kiểm / chỉnh) → 409 KHO_DA_KIEM — hai người cùng chốt không trừ hai lần.
 *   So giờ huỷ / duyệt bằng `>=` (cùng giây với lúc đọc thì thà 409 thừa). Kết quả pha chế (ghiKetQua chèn dòng vào PX CŨ) cũng làm gốc đổi —
 *   chấp nhận: đó là sửa sổ của phiếu đã có.
 */
const tinh = require('./tinh');
const duLieu = require('./duLieu');
const viec = require('./viec');

const loi = (http, code, error) => ({ loi: [http, { error, code }] });
const LO_FEFO = 'han_dung IS NULL, han_dung, id';
const MAU_LUC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
const gon = (x) => Number(Number(x).toFixed(3));
const cotCua = (m) => (m.nguyen_lieu_id ? 'nguyen_lieu_id' : 'san_pham_id');
const maCua = (m) => Number(m.nguyen_lieu_id || m.san_pham_id);
const khoaCua = (m) => `${cotCua(m)}:${maCua(m)}`;
/** Tồn = Σ dòng phiếu đã duyệt (thành phẩm: dòng có lô — tồn thành phẩm = Σ lô). `them` = điều kiện phiếu thêm (vd id > moc). */
const tongDong = async (csdl, m, them = '', args = []) => Number((await csdl.queryOne(`SELECT COALESCE(SUM(d.so_luong), 0) AS n FROM kho_phieu_dong d
  JOIN kho_phieu p ON p.id = d.phieu_id WHERE d.${cotCua(m)} = ? ${m.san_pham_id ? 'AND d.lo_id IS NOT NULL' : ''} AND ${duLieu.DA_DUYET} ${them}`, [maCua(m), ...args])).n);

/** Thứ được kiểm hằng ngày: nguyên liệu đang dùng có tick + món làm sẵn. MỘT vị từ cho danh sách và cho dòng gửi lên (KHO_DONG_LA). */
async function dsDuocKiem(csdl) {
  const nl = await csdl.query('SELECT id, ten, don_vi_luu, don_vi_hien, he_so_doi FROM kho_nguyen_lieu WHERE kiem_hang_ngay = 1 AND dang_dung = 1 ORDER BY ten');
  const sp = await csdl.query(`SELECT p.id, p.name AS ten FROM kho_san_pham s JOIN pos_products p ON p.id = s.pos_product_id WHERE s.kieu = 'lam_san'
    ORDER BY p.sort_order, p.name`);
  return [...sp.map((p) => ({ san_pham_id: Number(p.id), ten: p.ten, don_vi: 'phần', he_so_doi: 1 })),
    ...nl.map((n) => ({ nguyen_lieu_id: Number(n.id), ten: n.ten, don_vi: n.don_vi_hien || n.don_vi_luu, he_so_doi: n.he_so_doi || 1 }))];
}

/** Lần chốt kiểm kê gần nhất: { theo: Map khoá → dòng ảnh, ghi_chu_chung, luc } hoặc null. */
async function chotGanNhat(csdl) {
  const c = await csdl.queryOne("SELECT * FROM kho_chot WHERE che_do = 'kiemke' ORDER BY id DESC LIMIT 1");
  if (!c) return null;
  let anh = []; try { anh = JSON.parse(c.anh) || []; } catch { /* ảnh hỏng: coi như chưa chốt từng thứ */ }
  return { theo: new Map(anh.map((a) => [khoaCua(a), a])), ghi_chu_chung: c.ghi_chu_chung, luc: c.luc };
}

const docMoc = async (csdl) => Number((await csdl.queryOne('SELECT COALESCE(MAX(id), 0) AS n FROM kho_phieu')).n);

/** Màn kiểm: kiểm kê → KHÔNG số nào (đếm mù); bàn giao → "Chốt" tối qua (chưa có → số máy, cờ). Thành phẩm chỉ khi còn lô. */
async function docDanhSach(csdl, cheDo, luc) {
  const moc = await docMoc(csdl);
  const chot = cheDo === 'bangiao' ? await chotGanNhat(csdl) : null;
  const dong = [];
  for (const m of await dsDuocKiem(csdl)) {
    const ton = await tongDong(csdl, m);
    const c = chot?.theo.get(khoaCua(m));
    if (m.san_pham_id && ton <= tinh.SAI_SO && !(c?.chot > tinh.SAI_SO)) continue;   // thành phẩm hết lô (bàn giao: trừ khi tối qua chốt còn)
    if (cheDo !== 'bangiao') { dong.push(m); continue; }
    dong.push({ ...m, chot: gon(c ? c.chot : ton), may: gon(ton), chua_co_chot: !c });   // sáng THẤY số: chốt + máy (bán / đổi sau chốt → màn báo)
  }
  return { che_do: cheDo, moc, moc_luc: luc, dong, ...(cheDo === 'bangiao' && { chua_co_chot: !chot, ca_truoc_dan: chot?.ghi_chu_chung ?? null, chot_luc: chot?.luc ?? null }) };
}

/** moc / moc_luc do màn gửi lại: số nguyên 0…id lớn nhất, giờ đúng dạng và không ở tương lai. */
async function kiemMoc(tx, moc, mocLuc, luc) {
  const m = Number(moc);
  if (moc == null || moc === '' || !Number.isInteger(m) || m < 0 || m > await docMoc(tx) || !MAU_LUC.test(String(mocLuc)) || mocLuc > luc) {
    return loi(400, 'KHO_MOC_SAI', 'Màn kiểm đã cũ hoặc hỏng — tải lại');
  }
  if (await tx.queryOne("SELECT 1 FROM kho_phieu WHERE loai = 'KK' AND id > ? LIMIT 1", [m])) return loi(409, 'KHO_DA_KIEM', 'Vừa có người kiểm / chỉnh tồn — tải lại');
  return { moc: m };
}

/** Gốc (tồn lúc màn mở) + tồn hiện tại của một thứ; huỷ / duyệt phiếu cũ sau lúc mở → { loi }. */
async function gocCua(tx, m, moc, mocLuc) {
  const doi = await tx.queryOne(`SELECT 1 FROM kho_phieu p WHERE p.id <= ? AND (p.huy_luc >= ? OR (p.trang_thai = 'da_duyet' AND p.duyet_luc >= ?))
    AND EXISTS (SELECT 1 FROM kho_phieu_dong d WHERE d.phieu_id = p.id AND d.${cotCua(m)} = ?) LIMIT 1`, [moc, mocLuc, mocLuc, maCua(m)]);
  if (doi) return loi(409, 'KHO_TON_DOI', 'Tồn vừa đổi (huỷ đơn / duyệt phiếu) — tải lại rồi kiểm lại');
  const hien = await tongDong(tx, m);
  return { hien, goc: hien - await tongDong(tx, m, 'AND p.id > ?', [moc]) };
}

/** Số đếm: '' / null → undefined (để trống); không phải số → NaN. */
const docSo = (x) => (x === '' || x == null ? undefined : Number(x));

/** Ghi MỘT phiếu KK cho các dòng điều chỉnh [{ m, dc, ghiChu }] (dc ≠ 0). Trả id phiếu hoặc { loi }. */
async function ghiKK(tx, ds, { nguoi, luc, ghiChu = null, lyDo = null, maGui = null }) {
  const id = await duLieu.themPhieu(tx, { loai: 'KK', tuDuyet: true, nguoi, luc, ghiChu, lyDo, maGui });
  const ghi = (m, loId, so, donGia, gc) => tx.run(`INSERT INTO kho_phieu_dong (phieu_id, ${cotCua(m)}, lo_id, so_luong, don_gia, ghi_chu, loai, nguoi, luc)
    VALUES (?, ?, ?, ?, ?, ?, 'kiem_ke', ?, ?)`, [id, maCua(m), loId, so, donGia, gc, nguoi, luc]);
  for (const { m, dc, ghiChu: gc } of ds) {
    const nl = m.nguyen_lieu_id ? await tx.queryOne('SELECT han_ngay, gia_nhap FROM kho_nguyen_lieu WHERE id = ?', [maCua(m)]) : null;
    if (dc > 0) {
      const han = nl ? nl.han_ngay : (await tx.queryOne('SELECT han_ngay FROM kho_san_pham WHERE pos_product_id = ?', [maCua(m)]))?.han_ngay;
      const gia = nl ? nl.gia_nhap : (await tx.queryOne('SELECT gia_von FROM kho_lo WHERE san_pham_id = ? ORDER BY id DESC LIMIT 1', [maCua(m)]))?.gia_von;
      const lo = await tx.run(`INSERT INTO kho_lo (${cotCua(m)}, so_luong, han_dung, gia_von, phieu_id, tao_luc) VALUES (?, ?, ?, ?, ?, ?)`,
        [maCua(m), dc, duLieu.hanLo(luc, han), gia ?? null, id, luc]);
      await ghi(m, Number(lo.lastInsertRowid), dc, gia ?? null, gc);
      continue;
    }
    for (const x of tinh.chiaTheoLo([{ khoa: 0, luong: -dc }], await duLieu.conLaiTheoLo(tx, `l.${cotCua(m)} = ?`, [maCua(m)], LO_FEFO))) {
      if (x.lo_id == null && m.san_pham_id) return loi(409, 'KHO_TON_DOI', 'Thành phẩm không còn đủ lô — tải lại');
      await ghi(m, x.lo_id, -x.luong, nl ? nl.gia_nhap ?? null : null, gc);
    }
  }
  return { id };
}

const moTaDong = (d) => `${d.ten} ${gon(d.goc)}→${gon(d.chot)}${d.ghi_chu ? ` (${d.ghi_chu})` : ''}`;

/** Lưu kiểm kê / bàn giao. dongVao = [{ nguyen_lieu_id | san_pham_id, thuc, ghi_chu }]. */
async function luuKiem(tx, { cheDo, moc, mocLuc, dongVao, ghiChuChung, nguoi, luc, maGui }) {
  if (maGui) {
    const co = await tx.queryOne('SELECT id, phieu_id, anh FROM kho_chot WHERE ma_gui = ?', [maGui]);
    if (co) {   // bấm lại cùng mã (mất mạng sau khi đã ghi) → CÙNG dạng với lần ghi đầu (màn dùng chung nhánh vẽ)
      let anh = []; try { anh = JSON.parse(co.anh) || []; } catch { /* ảnh hỏng */ }
      return { chot_id: Number(co.id), phieu_id: co.phieu_id == null ? null : Number(co.phieu_id), lech: anh.filter((a) => Math.abs(a.lech) > tinh.SAI_SO), anh, da_co: true };
    }
  }
  if (!Array.isArray(dongVao)) return loi(400, 'DONG_SAI', 'Danh sách dòng kiểm sai');
  const duoc = new Map((await dsDuocKiem(tx)).map((m) => [khoaCua(m), m]));
  const vao = new Map();
  for (const d of dongVao) {
    const m = { nguyen_lieu_id: Number(d?.nguyen_lieu_id) || null, san_pham_id: Number(d?.nguyen_lieu_id) ? null : Number(d?.san_pham_id) || null };
    if (!duoc.has(khoaCua(m)) || vao.has(khoaCua(m))) return loi(400, 'KHO_DONG_LA', 'Có dòng không thuộc danh sách kiểm (hoặc gửi trùng) — tải lại');
    vao.set(khoaCua(m), { thuc: docSo(d.thuc), ghi_chu: String(d.ghi_chu ?? '').trim() || null });
  }
  const mc = await kiemMoc(tx, moc, mocLuc, luc);
  if (mc.loi) return mc;
  const chot = cheDo === 'bangiao' ? await chotGanNhat(tx) : null;
  const ds = [];
  for (const [khoa, m] of duoc) {
    const g = await gocCua(tx, m, mc.moc, mocLuc);
    if (g.loi) return g;
    const v = vao.get(khoa);
    const soChot = cheDo === 'bangiao' ? (chot?.theo.get(khoa)?.chot ?? g.goc) : null;
    if (m.san_pham_id && g.goc <= tinh.SAI_SO && !v && !(soChot > tinh.SAI_SO)) continue;   // cùng điều kiện với docDanhSach: không có trên màn
    const thuc = v?.thuc ?? (cheDo === 'bangiao' ? soChot : undefined);
    if (thuc === undefined || Number.isNaN(thuc)) return loi(400, 'KHO_THIEU_SO', `Chưa gõ số đếm: ${m.ten} — kiểm kê phải gõ đủ mọi dòng`);
    if (thuc < 0 || !Number.isFinite(thuc)) return loi(400, 'KHO_SO_AM', `Số đếm phải ≥ 0: ${m.ten}`);
    ds.push({ m, ten: m.ten, goc: g.goc, hien: g.hien, thuc, dc: thuc - g.goc, lech: cheDo === 'bangiao' ? thuc - soChot : thuc - g.goc, ghi_chu: v?.ghi_chu ?? null });
  }
  for (const d of ds) {
    if (d.hien + d.dc < -tinh.SAI_SO) return loi(409, 'KHO_TON_DOI', `Tồn vừa đổi (${d.ten} vừa bán) — tải lại rồi kiểm lại`);
    if ((Math.abs(d.dc) > tinh.SAI_SO || Math.abs(d.lech) > tinh.SAI_SO) && !d.ghi_chu) {
      return loi(400, 'KHO_THIEU_GHI_CHU', `Dòng lệch phải ghi chú: ${d.ten}`);
    }
  }
  const doi = ds.filter((d) => Math.abs(d.dc) > tinh.SAI_SO);
  let phieuId = null;
  if (doi.length) {
    const r = await ghiKK(tx, doi.map((d) => ({ m: d.m, dc: d.dc, ghiChu: d.ghi_chu })), { nguoi, luc, maGui,
      ghiChu: cheDo === 'bangiao' ? 'Nhận bàn giao' : 'Kiểm kê cuối ngày' });
    if (r.loi) return r;
    phieuId = r.id;
  }
  const anh = ds.map((d) => ({ [cotCua(d.m)]: maCua(d.m), ten: d.ten, chot: gon(d.hien + d.dc), thuc: gon(d.thuc), goc: gon(d.goc), lech: gon(d.lech), ghi_chu: d.ghi_chu }));
  const kq = await tx.run('INSERT INTO kho_chot (che_do, ngay, luc, nguoi, phieu_id, ghi_chu_chung, anh, ma_gui) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [cheDo, luc.slice(0, 10), luc, nguoi, phieuId, String(ghiChuChung ?? '').trim() || null, JSON.stringify(anh), maGui]);
  const lech = anh.filter((a) => Math.abs(a.lech) > tinh.SAI_SO);
  await viec.tuXong(tx, { loai: cheDo, nguoi, luc });
  const moTa = cheDo === 'bangiao' ? (lech.length ? `Lệch so với chốt: ${lech.map((a) => `${a.ten} chốt ${gon(a.thuc - a.lech)} → thực ${a.thuc}${a.ghi_chu ? ` (${a.ghi_chu})` : ''}`).join('; ')}` : 'Nhận ca — đúng hết')
    : `${anh.length} thứ · ${lech.length} lệch${lech.length ? ': ' + ds.filter((d) => Math.abs(d.lech) > tinh.SAI_SO).map((d) => moTaDong({ ...d, chot: d.hien + d.dc })).join('; ') : ''}`;
  await viec.ghiDienBien(tx, { luc, loai: cheDo === 'bangiao' ? 'nhan_ca' : 'kiem_ke', nguoi, chuY: lech.length > 0, phieuId,
    chiTiet: moTa + (String(ghiChuChung ?? '').trim() ? ` · dặn: ${String(ghiChuChung).trim()}` : '') });
  return { chot_id: Number(kq.lastInsertRowid), phieu_id: phieuId, lech, anh };
}

/** Chỉnh tồn tay một thứ về số đang có thật (quyền kiểm ở đường). */
async function chinhTay(tx, { than, nguoi, luc, maGui, lyDo }) {
  const m = { nguyen_lieu_id: Number(than.nguyen_lieu_id) || null, san_pham_id: Number(than.nguyen_lieu_id) ? null : Number(than.san_pham_id) || null };
  if (maGui) {   // bấm hai lần cùng mã → trả lần đã ghi
    const co = await tx.queryOne("SELECT id FROM kho_phieu WHERE ma_gui = ? AND loai = 'KK'", [maGui]);
    if (co) return { phieu_id: Number(co.id), da_co: true };
  }
  const thuc = docSo(than.thuc);
  if (thuc === undefined || !Number.isFinite(thuc) || thuc < 0) return loi(400, 'KHO_SO_AM', 'Số đang có thật phải là số ≥ 0');
  const co = m.nguyen_lieu_id ? await tx.queryOne('SELECT ten FROM kho_nguyen_lieu WHERE id = ?', [m.nguyen_lieu_id])
    : m.san_pham_id ? await tx.queryOne("SELECT p.name AS ten FROM kho_san_pham s JOIN pos_products p ON p.id = s.pos_product_id WHERE s.pos_product_id = ? AND s.kieu = 'lam_san'", [m.san_pham_id]) : null;
  if (!co) return loi(404, 'KHONG_THAY', 'Không thấy nguyên liệu / thành phẩm làm sẵn');
  const mc = await kiemMoc(tx, than.moc, than.moc_luc, luc);
  if (mc.loi) return mc;
  const g = await gocCua(tx, m, mc.moc, than.moc_luc);
  if (g.loi) return g;
  const dc = thuc - g.goc;
  if (g.hien + dc < -tinh.SAI_SO) return loi(409, 'KHO_TON_DOI', 'Tồn vừa đổi — tải lại');
  if (Math.abs(dc) <= tinh.SAI_SO) return { phieu_id: null };
  const r = await ghiKK(tx, [{ m, dc, ghiChu: lyDo }], { nguoi, luc, lyDo, maGui, ghiChu: 'Chỉnh tồn tay' });
  if (r.loi) return r;
  await viec.ghiDienBien(tx, { luc, loai: 'chinh_tay', nguoi, chuY: true, phieuId: r.id, chiTiet: `${co.ten} ${gon(g.goc)} → ${gon(thuc)} (${lyDo})` });
  return { phieu_id: r.id };
}

module.exports = { docDanhSach, docMoc, luuKiem, chinhTay };
