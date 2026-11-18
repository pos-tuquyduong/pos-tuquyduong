/**
 * KHO-3a — bán theo kho POS. MỘT chỗ cho luật "đủ hàng mới bán" (chủ quán 17.11 18:47), giữ hàng theo phiên chờ trả, trừ kho trong giao dịch đơn,
 * trả kho khi huỷ, số trên menu, danh sách món chưa sẵn sàng bán. Hàm nhận `csdl` = module database hoặc giao dịch (cùng query / queryOne / run).
 * - Món làm sẵn (lam_san): bán từ lô thành phẩm CÒN HẠN, hạn gần trước (FEFO). Không đủ → HET_HANG. Không tự trừ sang nguyên liệu.
 * - Món pha tại chỗ (pha_tai_cho): trừ nguyên liệu theo công thức × số lượng (lồng — trienKhai). Thiếu → THIEU_NGUYEN_LIEU, trừ món bật cho_ban_thieu
 *   (bán, ghi phần thiếu không lô = âm, Tồn kho báo đỏ).
 * - Chưa có dòng kho / chua_dinh_luong / công thức rỗng → CHUA_CO_CONG_THUC.
 * - Phần ĐANG GIỮ = Σ cần của các phiên thanh toán 'cho' còn hạn (khuôn giữ ví / voucher: không cột "đã giữ", nhả = đổi trạng thái / hết hạn).
 *   "Còn bán được" = tồn − phần giữ của phiên KHÁC — quầy, App, màn khách cùng một con số.
 * - Phiếu bán = phiếu PS su_co 'ban_hang', da_duyet, don_hang_id = đơn (khoá duy nhất — bước 031). Huỷ đơn = phiếu → 'huy' → hàng về đúng lô.
 */
const tinh = require('./tinh');
const duLieu = require('./duLieu');

const SU_CO_BAN = 'ban_hang';
const LO_FEFO = 'han_dung IS NULL, han_dung, id';
const ma = (p) => `${p.sx_product_type}_${p.sx_product_id}`;
const cong = (m, khoa, so) => m.set(khoa, (m.get(khoa) || 0) + so);
const loi = (code, error, p) => ({ status: 400, body: { error, code, mon: p.name, ma: ma(p) } });

/** Món của một dòng items — CÙNG vị từ với vòng món của taoDonGoc (orders.js): có khoá SX thì theo khoá, không thì theo product_id; chỉ món đang bán. */
const timMon = (ds, i) => (i && i.sx_product_type && i.sx_product_id !== undefined
  ? ds.find((p) => p.sx_product_type === i.sx_product_type && String(p.sx_product_id) === String(i.sx_product_id))
  : ds.find((p) => Number(p.id) === Number(i?.product_id))) || null;

/** Một lượt đọc: món đang bán + kiểu kho, công thức, tồn nguyên liệu, lô thành phẩm còn hạn tại `bayGio`, phần đang giữ (phiên 'cho' còn hạn). */
async function docKhaNang(csdl, { bayGio }) {
  const mon = await csdl.query(`SELECT p.id, p.name, p.sx_product_type, p.sx_product_id, s.kieu, COALESCE(s.cho_ban_thieu, 0) AS cho_ban_thieu
    FROM pos_products p LEFT JOIN kho_san_pham s ON s.pos_product_id = p.id WHERE p.is_active = 1`);
  const bang = await duLieu.docBangCongThuc(csdl);
  const tonNL = new Map((await csdl.query(`SELECT d.nguyen_lieu_id AS id, SUM(d.so_luong) AS ton FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id
    WHERE d.nguyen_lieu_id IS NOT NULL AND ${duLieu.DA_DUYET} GROUP BY d.nguyen_lieu_id`)).map((r) => [Number(r.id), Number(r.ton)]));
  const tonTP = new Map();
  for (const l of await duLieu.conLaiTheoLo(csdl, 'l.san_pham_id IS NOT NULL AND (l.han_dung IS NULL OR l.han_dung > ?)', [bayGio])) cong(tonTP, Number(l.san_pham_id), Number(l.con));
  const ctx = { mon, bang, tonNL, tonTP };
  const giu = { thanhPham: new Map(), nguyenLieu: new Map() };
  for (const ph of await csdl.query("SELECT than FROM pos_phien_thanh_toan WHERE trang_thai = 'cho' AND het_han > ?", [bayGio])) {
    let t = {}; try { t = JSON.parse(ph.than) || {}; } catch { /* thân hỏng: không giữ gì */ }
    const c = canCuaItems(t.items, ctx);
    for (const [k, v] of c.thanhPham) cong(giu.thanhPham, k, v);
    for (const [k, v] of c.nguyenLieu) cong(giu.nguyenLieu, k, v);
  }
  return { ...ctx, giu };
}

const chuaSan = (p, bang) => !p.kieu || p.kieu === 'chua_dinh_luong' || !(bang[p.id] || []).length;

/** items → cần gì: thành phẩm (món làm sẵn → SL), nguyên liệu (món pha tại chỗ → triển khai × SL, cả giỏ), từng món, món chưa sẵn sàng. */
function canCuaItems(items, { mon, bang }) {
  const ra = { thanhPham: new Map(), nguyenLieu: new Map(), phaCua: new Map(), chua: [] };
  for (const i of Array.isArray(items) ? items : []) {
    const p = timMon(mon, i);
    const sl = Number(i?.quantity);
    if (!p || !(sl > 0)) continue;   // món không bán / SL sai: taoDonGoc tự chặn
    if (chuaSan(p, bang)) { ra.chua.push(p); continue; }
    if (p.kieu === 'lam_san') { cong(ra.thanhPham, p.id, sl); continue; }
    for (const n of tinh.trienKhai({ goc: p.id, bang }, sl)) {
      cong(ra.nguyenLieu, n.nguyen_lieu_id, n.luong);
      cong(ra.phaCua, `${p.id}:${n.nguyen_lieu_id}`, n.luong);
    }
  }
  return ra;
}

/** Thứ tự B3 → B1 → B2. null = đủ; còn lại { status: 400, body: { error, code, mon, ma } }. ctx = docKhaNang (đã trừ phần giữ của phiên khác). */
async function xetDu(csdl, items, ctx) {
  const can = canCuaItems(items, ctx);
  if (can.chua.length) return loi('CHUA_CO_CONG_THUC', `Món chưa có công thức: ${can.chua[0].name}`, can.chua[0]);
  for (const [spId, sl] of can.thanhPham) {
    const con = (ctx.tonTP.get(spId) || 0) - (ctx.giu.thanhPham.get(spId) || 0);
    if (con + tinh.SAI_SO < sl) {
      return loi('HET_HANG', `Không đủ hàng: ${ctx.mon.find((p) => p.id === spId).name}. Còn: ${Math.max(0, +con.toFixed(3))}, cần: ${sl}`, ctx.mon.find((p) => p.id === spId));
    }
  }
  for (const khoa of can.phaCua.keys()) {
    const [spId, nlId] = khoa.split(':').map(Number);
    const p = ctx.mon.find((x) => x.id === spId);
    if (Number(p.cho_ban_thieu) === 1) continue;
    if (can.nguyenLieu.get(nlId) > (ctx.tonNL.get(nlId) || 0) - (ctx.giu.nguyenLieu.get(nlId) || 0) + tinh.SAI_SO) {
      const nl = await csdl.queryOne('SELECT ten FROM kho_nguyen_lieu WHERE id = ?', [nlId]);
      return loi('THIEU_NGUYEN_LIEU', `Thiếu nguyên liệu: ${nl?.ten || '#' + nlId} cho ${p.name}`, p);
    }
  }
  return null;
}

/** Kiểm đủ hàng cho items TRONG giao dịch ghi: tạo phiên (giuCho) — tồn − phần đang giữ của các phiên khác ≥ cần. */
const kiemDuHang = async (csdl, items, { bayGio }) => xetDu(csdl, items, await docKhaNang(csdl, { bayGio }));

/**
 * Trừ kho cho đơn VỪA ghi — TRONG giao dịch đơn (taoDonGoc). items = orderItems (product_id > 0 = món thật; gói / thẻ / nạp âm → bỏ).
 * Kiểm lại (tồn − phần đang giữ) rồi ghi MỘT phiếu PS ban_hang da_duyet: thành phẩm chia lô còn hạn FEFO, nguyên liệu chia lô FEFO như ghiKho (phần
 * thiếu không lô — chỉ có ở món bật cho_ban_thieu). Chốt phiên: câu ghi phiên → da_thu chạy TRƯỚC trong cùng giao dịch (vaoGiaoDich), nên phần giữ
 * của chính phiên đang chốt đã không còn tính — chỉ phần giữ của phiên KHÁC. Thành phẩm không bao giờ âm: kiểm và chia lô đọc CÙNG một câu lô
 * (conLaiTheoLo còn hạn), đủ ở bước kiểm là đủ lô. Trả { loi } → chỗ gọi rollback.
 */
async function truKhoDon(tx, { orderId, items, nguoi, luc }) {
  const that = (items || []).filter((i) => Number(i.product_id) > 0).map((i) => ({ product_id: i.product_id, quantity: i.quantity }));
  if (!that.length) return {};
  const ctx = await docKhaNang(tx, { bayGio: luc });
  const thieu = await xetDu(tx, that, ctx);
  if (thieu) return { loi: thieu };
  const can = canCuaItems(that, ctx);
  const id = await duLieu.themPhieu(tx, { loai: 'PS', tuDuyet: true, nguoi, luc, suCo: SU_CO_BAN, ghiChu: `Đơn #${orderId}`, donHangId: orderId });
  const ghi = (cot, ma, loId, so, donGia) => tx.run(`INSERT INTO kho_phieu_dong (phieu_id, ${cot}, lo_id, so_luong, don_gia, loai, nguoi, luc) VALUES (?, ?, ?, ?, ?, 'ban', ?, ?)`,
    [id, ma, loId, -so, donGia, nguoi, luc]);
  for (const [spId, sl] of can.thanhPham) {
    const lo = await duLieu.conLaiTheoLo(tx, 'l.san_pham_id = ? AND (l.han_dung IS NULL OR l.han_dung > ?)', [spId, luc], LO_FEFO);
    for (const m of tinh.chiaTheoLo([{ khoa: spId, luong: sl }], lo)) await ghi('san_pham_id', spId, m.lo_id, m.luong, null);
  }
  for (const [nlId, luong] of can.nguyenLieu) {
    const gia = (await tx.queryOne('SELECT gia_nhap FROM kho_nguyen_lieu WHERE id = ?', [nlId]))?.gia_nhap ?? null;
    const lo = await duLieu.conLaiTheoLo(tx, 'l.nguyen_lieu_id = ? AND (l.han_dung IS NULL OR l.han_dung > ?)', [nlId, luc], LO_FEFO);
    for (const m of tinh.chiaTheoLo([{ khoa: nlId, luong }], lo)) await ghi('nguyen_lieu_id', nlId, m.lo_id, m.luong, gia);
  }
  return { id };
}

/** Huỷ / xoá đơn (trong giao dịch, SAU cổng trạng thái đơn): phiếu bán → 'huy' (hàng về đúng lô). Đồ đã pha bỏ đi → giữ phiếu, ghi hao hụt. Một lần: câu ghi khoá da_duyet. */
async function huyPhieuBan(tx, orderId, { doDaPha = null, nguoi, luc, lyDo }) {
  if (doDaPha === 'bo_di') {
    return tx.run(`UPDATE kho_phieu SET ghi_chu = COALESCE(ghi_chu || ' · ', '') || 'hao hụt: huỷ đơn — đồ đã pha bỏ đi' WHERE don_hang_id = ? AND su_co = ?
      AND trang_thai = 'da_duyet'`, [orderId, SU_CO_BAN]);
  }
  return tx.run(`UPDATE kho_phieu SET trang_thai = 'huy', ly_do = ?, nguoi_huy = ?, huy_luc = ? WHERE don_hang_id = ? AND su_co = ? AND trang_thai = 'da_duyet'`,
    [lyDo, nguoi, luc, orderId, SU_CO_BAN]);
}

/** Số trên menu cho từng món (id → { stock_quantity, khong_quan_kho, chua_cong_thuc }). Pha tại chỗ: số phần pha được từ nguyên liệu còn bán được. */
async function tonMenu(csdl, bayGio) {
  const ctx = await docKhaNang(csdl, { bayGio });
  const ra = new Map();
  const nguyen = (x) => Math.max(0, Math.floor(x + tinh.SAI_SO));
  for (const p of ctx.mon) {
    if (chuaSan(p, ctx.bang)) { ra.set(p.id, { stock_quantity: null, khong_quan_kho: false, chua_cong_thuc: true }); continue; }
    if (p.kieu === 'lam_san') {
      ra.set(p.id, { stock_quantity: nguyen((ctx.tonTP.get(p.id) || 0) - (ctx.giu.thanhPham.get(p.id) || 0)), khong_quan_kho: false, chua_cong_thuc: false });
      continue;
    }
    if (Number(p.cho_ban_thieu) === 1) { ra.set(p.id, { stock_quantity: null, khong_quan_kho: true, chua_cong_thuc: false }); continue; }
    const mot = tinh.trienKhai({ goc: p.id, bang: ctx.bang }, 1);
    const phan = mot.map((n) => ((ctx.tonNL.get(n.nguyen_lieu_id) || 0) - (ctx.giu.nguyenLieu.get(n.nguyen_lieu_id) || 0)) / n.luong);
    ra.set(p.id, { stock_quantity: phan.length ? nguyen(Math.min(...phan)) : 0, khong_quan_kho: false, chua_cong_thuc: false });
  }
  return ra;
}

/** A7: món đang bán chưa sẵn sàng — chưa kiểu / chưa định lượng / công thức rỗng, hoặc làm sẵn hết lô còn hạn. */
async function monChuaSan(csdl, bayGio) {
  const ctx = await docKhaNang(csdl, { bayGio });
  const mon = [];
  for (const p of ctx.mon) {
    const lyDo = !p.kieu ? 'Chưa có kiểu kho và công thức' : p.kieu === 'chua_dinh_luong' ? 'Chưa định lượng' : !(ctx.bang[p.id] || []).length ? 'Chưa có công thức'
      : p.kieu === 'lam_san' && (ctx.tonTP.get(p.id) || 0) <= tinh.SAI_SO ? 'Làm sẵn: hết lô còn hạn' : null;
    if (lyDo) mon.push({ san_pham_id: p.id, ten: p.name, ly_do: lyDo });
  }
  return { mon, so: mon.length };
}

module.exports = { SU_CO_BAN, timMon, kiemDuHang, truKhoDon, huyPhieuBan, tonMenu, monChuaSan };
