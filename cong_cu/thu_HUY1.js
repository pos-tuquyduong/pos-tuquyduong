#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ HUY-1 — huỷ đơn hoàn TOÀN BỘ tiền đã trả vào tài khoản khách (khách lẻ: trả tiền mặt từ két), lý do có mã,
 *  quản lý + chủ quán huỷ trong ngày (ngày trước chỉ chủ quán), Đối soát hai dòng mới, App thấy số đã hoàn.
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_HUY1.js [--may-chu <thư mục server>]
 *  --may-chu: chạy trên bản sao server/ (đột biến, viec/HUY-1/dot_bien.py). bat_bien.js nạp từ <may-chu>/../cong_cu/gia_lap.
 *  Khuôn thu_P24.js: database.js thật + libsql thật trên kho TẠM, SX giả (ghi lại lệnh trả kho).
 *  Số mong đợi viết TAY theo giá cài sẵn (25.000 / 20.000 / 50.000) — không chép công thức của code (K3).
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_huy1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');

const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: {
    laMayThu: () => true,
    cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }),
    diaChiSX: () => '',
    FILE_THU: FILE_KHO,
  },
};
process.env.JWT_SECRET = 'thu_huy1_' + Date.now();

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();
  const { getNow, addDaysToDateString } = require(path.join(MAY_CHU, 'utils', 'helpers.js'));

  const duongSX = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
  const sxThat = require(duongSX);
  const traKho = [];
  const sxGia = async () => ({ ok: true });
  require.cache[duongSX].exports = { ...sxThat, isSxConfigured: () => true, checkStock: async () => ({ sufficient: true, stock: 999 }),
    outStockFIFO: sxGia, inStockReturn: async (...a) => { traKho.push(a); return { ok: true }; }, callSxApi: sxGia };

  const app = express();
  app.use(express.json());
  for (const r of ['orders', 'wallets', 'refunds', 'damages']) app.use('/api/pos/' + r, require(path.join(MAY_CHU, 'routes', r + '.js')));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  const batBien = require(path.join(MAY_CHU, '..', 'cong_cu', 'gia_lap', 'bat_bien.js'));
  const doiSoat = require(path.join(MAY_CHU, 'utils', 'doiSoat.js'));
  const donApp = require(path.join(MAY_CHU, 'utils', 'donApp.js'));
  noiLai();

  const mot = async (sql, a = []) => db.queryOne(sql, a);
  const so = async (sql, a = []) => Number(Object.values((await mot(sql, a)) || { x: NaN })[0]);
  const tk = {};
  tk.owner = jwt.sign({ userId: (await mot("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1")).id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  for (const v of ['manager', 'staff']) {
    const id = Number((await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', ?, ?, 1)", ['h1_' + v, 'h1_' + v, v])).lastInsertRowid);
    tk[v] = jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  }
  const goi = async (method, url, body, the = tk.owner) => {
    imLang();
    try {
      const r = await fetch(goc + url, { method, body: body ? JSON.stringify(body) : undefined,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + the } });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { ...j, status: r.status };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r?.status}${r?.code ? ' · ' + r.code : ''}${r?.error ? ' · ' + r.error : ''}`;
  const datCaiDat = (key, v) => db.run('INSERT OR REPLACE INTO pos_settings (key, value) VALUES (?, ?)', [key, String(v)]);
  for (const [key, v] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', 1000], ['loyalty_expiry_mode', 'none'], ['flash_enabled', 'false'],
    ['thanh_toan_payos_bat_buoc', '0']]) await datCaiDat(key, v);

  const sp = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 3');
  const GIA = [25000, 20000, 50000];
  for (const [i, g] of GIA.entries()) await db.run('UPDATE pos_products SET price = ? WHERE id = ?', [g, sp[i].id]);
  const mon = (i, sl = 1) => ({ product_id: sp[i].id, sx_product_type: sp[i].sx_product_type, sx_product_id: sp[i].sx_product_id, quantity: sl });
  let soSdt = 0;
  const sdtMoi = () => '0937' + String(500000 + (++soSdt));
  const ban = async (body) => {
    const r = await goi('POST', '/orders', { customer_name: 'Khách HUY1', ...body });
    if (r.status !== 200) throw new Error('không tạo được đơn: ' + moTa(r));
    return r.order;
  };
  const khach = (sdt) => (sdt ? { customer_phone: sdt } : {});
  const tienMat = (sdt, i = 0) => ban({ ...khach(sdt), items: [mon(i)], payment_method: 'cash', cash_amount: GIA[i] });
  const chuyenKhoan = (sdt, i = 1) => ban({ ...khach(sdt), items: [mon(i)], payment_method: 'transfer', transfer_amount: GIA[i] });
  const nap = async (sdt, tien) => {
    const r = await goi('POST', '/wallets/topup', { phone: sdt, amount: tien, customer_name: 'Khách HUY1', payment_method: 'cash' });
    if (r.status !== 200) throw new Error('không nạp được ví: ' + moTa(r));
  };
  const vi = (sdt) => so('SELECT COALESCE((SELECT balance FROM pos_wallets WHERE phone = ?), 0)', [sdt]);
  const thuong = (sdt) => so('SELECT COALESCE((SELECT thuong FROM pos_wallets WHERE phone = ?), 0)', [sdt]);
  const dongHoan = (id) => db.query("SELECT customer_phone, amount, payment_method, notes FROM pos_balance_transactions WHERE order_id = ? AND type = 'refund' ORDER BY id", [id]);
  const tongHoan = async (id) => (await dongHoan(id)).reduce((s, d) => s + Number(d.amount), 0);
  const hoanTM = (id) => db.query('SELECT * FROM pos_hoan_tien_mat WHERE order_id = ?', [id]).catch(() => []);
  const don = (id) => mot('SELECT * FROM pos_orders WHERE id = ?', [id]);
  const huy = (id, body = { ly_do_ma: 'pha_nham' }, the = tk.manager) => goi('PUT', `/orders/${id}/cancel`, body, the);
  const homQua = addDaysToDateString(getNow().slice(0, 10), -1);
  const homNay = getNow().slice(0, 10);

  // ═══ C · lý do bắt buộc ═══
  muc('[C] Lý do bắt buộc — chọn mã có sẵn, "khác" phải ghi thêm');
  {
    const ds = await goi('GET', '/orders/ly-do-huy', null, tk.manager);
    const ma = (ds.data || []).map((x) => x.ma);
    k('C0 GET /orders/ly-do-huy → đúng 5 mã: pha_nham · bam_nham · het_nguyen_lieu · khach_doi_y · khac (kèm nhãn)', ds.status === 200
      && JSON.stringify(ma) === JSON.stringify(['pha_nham', 'bam_nham', 'het_nguyen_lieu', 'khach_doi_y', 'khac']) && (ds.data || []).every((x) => x.nhan),
    `${moTa(ds)} ${JSON.stringify(ma)}`);
    const sdt = sdtMoi();
    const d = await tienMat(sdt);
    const c1 = await huy(d.id, {});
    const c2 = await huy(d.id, { ly_do_ma: 'xyz' });
    const c3 = await huy(d.id, { ly_do_ma: 'khac', ghi_them: '   ' });
    const c1b = await huy(d.id, { reason: '   ' });
    const conNguyen = (await don(d.id)).status === 'completed' && (await vi(sdt)) === 0;
    k('C1 thiếu lý do → 400 LY_DO_BAT_BUOC', c1.status === 400 && c1.code === 'LY_DO_BAT_BUOC', moTa(c1));
    k('C2 mã lý do lạ → 400 LY_DO_BAT_BUOC', c2.status === 400 && c2.code === 'LY_DO_BAT_BUOC', moTa(c2));
    k('C3 "khác" mà ghi thêm toàn dấu cách → 400 LY_DO_BAT_BUOC', c3.status === 400 && c3.code === 'LY_DO_BAT_BUOC', moTa(c3));
    k('C1b thân cũ { reason } toàn dấu cách → 400 LY_DO_BAT_BUOC', c1b.status === 400 && c1b.code === 'LY_DO_BAT_BUOC', moTa(c1b));
    k('C1–C3 bị từ chối thì đơn vẫn completed, ví không đổi', conNguyen);
    const c4 = await huy(d.id, { ly_do_ma: 'khac', ghi_them: '  khách gọi lại  ' });
    const o4 = await don(d.id);
    k('C4 "khác" + ghi thêm → 200; lưu huy_ly_do_ma = khac, cancelled_reason = ghi thêm đã cắt, người huỷ, giờ huỷ', c4.status === 200
      && o4.huy_ly_do_ma === 'khac' && o4.cancelled_reason === 'khách gọi lại' && o4.cancelled_by === 'h1_manager' && String(o4.cancelled_at).slice(0, 10) === homNay,
    `${moTa(c4)} ${o4.huy_ly_do_ma} "${o4.cancelled_reason}" ${o4.cancelled_by} ${o4.cancelled_at}`);
    const d5 = await tienMat(sdtMoi());
    const c5 = await huy(d5.id, { ly_do_ma: 'het_nguyen_lieu' });
    const o5 = await don(d5.id);
    k('C5 mã có sẵn, không ghi thêm → 200, cancelled_reason = nhãn "Hết nguyên liệu"', c5.status === 200 && o5.huy_ly_do_ma === 'het_nguyen_lieu'
      && o5.cancelled_reason === 'Hết nguyên liệu', `${moTa(c5)} ${o5.huy_ly_do_ma} "${o5.cancelled_reason}"`);
    const d5b = await tienMat(sdtMoi());
    const c5b = await huy(d5b.id, { ly_do_ma: 'bam_nham', ghi_them: 'bàn 3' });
    const o5b = await don(d5b.id);
    k('C5b mã có sẵn + ghi thêm → cancelled_reason = "Bấm nhầm · bàn 3"', c5b.status === 200 && o5b.cancelled_reason === 'Bấm nhầm · bàn 3', `"${o5b.cancelled_reason}"`);
    const d6 = await tienMat(sdtMoi());
    const c6 = await huy(d6.id, { reason: 'màn cũ gửi' });
    const o6 = await don(d6.id);
    k('C6 thân cũ { reason } (màn Giao hàng, bài cũ) → 200, mã khac, lý do giữ nguyên chữ', c6.status === 200 && o6.huy_ly_do_ma === 'khac'
      && o6.cancelled_reason === 'màn cũ gửi', `${moTa(c6)} ${o6.huy_ly_do_ma} "${o6.cancelled_reason}"`);
  }

  // ═══ B · quyền ═══
  muc('[B] Quyền — staff không huỷ; manager chỉ đơn trong ngày (giờ VN); đơn ngày trước chỉ owner');
  {
    const q = await so("SELECT allowed FROM pos_permissions WHERE role = 'staff' AND permission = 'cancel_order'");
    const saoLuu0 = await so("SELECT COUNT(*) FROM sqlite_master WHERE name = '_sao_luu_025_pos_permissions'");
    const d = await tienMat(sdtMoi());
    const b1 = await huy(d.id, { ly_do_ma: 'pha_nham' }, tk.staff);
    k('B1 staff huỷ → 403, quyền cancel_order của staff = 0 (kho mới: seed đã 0, bước 025 không phải đổi — không có bảng sao lưu)', b1.status === 403 && q === 0
      && saoLuu0 === 0 && (await don(d.id)).status === 'completed', `${moTa(b1)} quyền ${q} sao lưu ${saoLuu0}`);
    // kho đang chạy: staff đang = 1 → bước 025 chạy lại đặt 0 (một lần, có sao lưu)
    await db.run("UPDATE pos_permissions SET allowed = 1 WHERE role = 'staff' AND permission = 'cancel_order'");
    await db.run('DELETE FROM pos_nang_cap WHERE so = 25').catch(() => {});
    imLang();
    const kq = await require(path.join(MAY_CHU, 'nang_cap', 'chay.js')).chayNangCap({ beginTransaction: db.beginTransaction, query: db.query }).catch((e) => ({ hong: e.message }));
    noiLai();
    const q2 = await so("SELECT allowed FROM pos_permissions WHERE role = 'staff' AND permission = 'cancel_order'");
    const saoLuu = await so("SELECT COUNT(*) FROM sqlite_master WHERE name = '_sao_luu_025_pos_permissions'");
    const qm = await so("SELECT allowed FROM pos_permissions WHERE role = 'manager' AND permission = 'cancel_order'");
    k('B1b kho cũ (staff cancel_order = 1) → bước 025 đặt 0, có bảng _sao_luu_025_pos_permissions, manager giữ 1', !kq.hong && q2 === 0 && saoLuu === 1 && qm === 1,
      `hỏng ${kq.hong} staff ${q2} sao lưu ${saoLuu} manager ${qm}`);
    const b2 = await huy(d.id, { ly_do_ma: 'pha_nham' }, tk.manager);
    k('B2 manager huỷ đơn hôm nay → 200', b2.status === 200, moTa(b2));
    const sdt = sdtMoi();
    const c = await tienMat(sdt);
    await db.run('UPDATE pos_orders SET created_at = ? WHERE id = ?', [homQua + 'T15:00:00', c.id]);
    const b3 = await huy(c.id, { ly_do_ma: 'pha_nham' }, tk.manager);
    const o3 = await don(c.id);
    k('B3 manager huỷ đơn hôm qua → 403 HUY_DON_NGAY_TRUOC, đơn vẫn completed, ví không đổi', b3.status === 403 && b3.code === 'HUY_DON_NGAY_TRUOC'
      && o3.status === 'completed' && (await vi(sdt)) === 0, `${moTa(b3)} ${o3.status} ví ${await vi(sdt)}`);
    const b4 = await huy(c.id, { ly_do_ma: 'pha_nham' }, tk.owner);
    k('B4 owner huỷ đơn hôm qua → 200, ví +25.000', b4.status === 200 && (await vi(sdt)) === 25000, `${moTa(b4)} ví ${await vi(sdt)}`);
    const e = await tienMat(sdtMoi());
    await db.run('UPDATE pos_orders SET created_at = ? WHERE id = ?', [homQua + 'T23:59:59', e.id]);
    const b5a = await huy(e.id, { ly_do_ma: 'pha_nham' }, tk.manager);
    const f = await tienMat(sdtMoi());
    await db.run('UPDATE pos_orders SET created_at = ? WHERE id = ?', [homNay + 'T00:00:00', f.id]);
    const b5b = await huy(f.id, { ly_do_ma: 'pha_nham' }, tk.manager);
    k('B5 ranh giờ VN: tạo 23:59:59 hôm qua → manager 403; tạo 00:00:00 hôm nay → manager 200', b5a.status === 403 && b5b.status === 200, `${moTa(b5a)} / ${moTa(b5b)}`);
  }

  // ═══ A · huỷ ở mọi bước ═══
  muc('[A] Huỷ ở mọi bước — đơn quầy đã xong, đơn chưa thu, đơn App ở mọi tiến trình');
  {
    const sdt = sdtMoi();
    const d = await tienMat(sdt);
    const a1 = await huy(d.id);
    k('A1 đơn quầy đã xong (tiền mặt) → 200, trả về hoan.tai_khoan = 25.000, hoan.tien_mat = 0', a1.status === 200 && a1.hoan?.tai_khoan === 25000 && a1.hoan?.tien_mat === 0,
      `${moTa(a1)} ${JSON.stringify(a1.hoan)}`);
    const sdt3 = sdtMoi();
    const n = await ban({ customer_phone: sdt3, items: [mon(0)], payment_method: 'debt', debt_amount: 25000 });
    const a3 = await huy(n.id);
    k('A3 đơn chưa thu (nợ toàn bộ) → 200, không hoàn gì', a3.status === 200 && (await vi(sdt3)) === 0 && (await dongHoan(n.id)).length === 0 && (await hoanTM(n.id)).length === 0,
      `${moTa(a3)} ví ${await vi(sdt3)}`);
  }

  // Đơn App: đơn thật (CK) + phiên đã thu + dòng pos_don_app — như KH-MUA-1 ghi sau khi tiền về
  let soApp = 0;
  const donAppMoi = async (sdt, tienTrinh, coSan = null) => {
    const o = coSan || await chuyenKhoan(sdt, 1);
    const now = getNow();
    const p = await db.run(`INSERT INTO pos_phien_thanh_toan (than, tong, phone, giu_vi, con_lai, cach, trang_thai, het_han, order_id, nguoi_tao, tao_luc, luc_chot)
      VALUES ('{}', ?, ?, 0, ?, 'payos', 'da_thu', ?, ?, 'app', ?, ?)`, [GIA[1], sdt, GIA[1], now, o.id, now, now]);
    const ma = 'AHUY1' + (++soApp);
    await db.run(`INSERT INTO pos_don_app (ma, phone, khoa_gui, bam, than, phien_id, xong, tien_trinh_quay, tao_luc) VALUES (?, ?, ?, 'b', ?, ?, 1, ?, ?)`,
      [ma, sdt, 'k' + soApp, JSON.stringify({ dong: [{ ten: 'Món thử', so_luong: 1 }] }), Number(p.lastInsertRowid), tienTrinh, now]);
    return { o, ma };
  };
  muc('[A · H] Đơn App — huỷ ở mọi tiến trình; App thấy da_huy + số đã hoàn + lý do ngắn (không lộ ghi thêm)');
  {
    const sdt = sdtMoi();
    const ds = [await donAppMoi(sdt, ''), await donAppMoi(sdt, 'dang_lam'), await donAppMoi(sdt, 'xong')];
    const q = await donApp.dsQuay();
    const a4 = ds.every((x) => q.some((r) => r.ma === x.ma && Number(r.oid) === Number(x.o.id)));
    k('A4 màn Đơn App (dsQuay) trả oid = id đơn thật để gọi cùng route huỷ', a4, JSON.stringify(q.filter((r) => ds.some((x) => x.ma === r.ma)).map((r) => [r.ma, r.oid])));
    const truoc = await donApp.chiTietDon(sdt, ds[0].ma);
    k('H3 đơn App chưa huỷ → hoan_vao_tai_khoan = null, ly_do_huy = null (có trường)', truoc && 'hoan_vao_tai_khoan' in truoc && 'ly_do_huy' in truoc
      && truoc.hoan_vao_tai_khoan === null && truoc.ly_do_huy === null, JSON.stringify({ h: truoc?.hoan_vao_tai_khoan, l: truoc?.ly_do_huy }));
    const kq = [];
    for (const x of ds) kq.push(await huy(x.o.id, { ly_do_ma: 'het_nguyen_lieu', ghi_them: 'GHI_NOI_BO_K' }));
    k('A2 đơn App tiến trình "" / dang_lam / xong → huỷ 200 cả ba', kq.every((r) => r.status === 200), kq.map(moTa).join(' / '));
    const sau = await donApp.chiTietDon(sdt, ds[1].ma);
    const ds2 = await donApp.dsDon(sdt, 1, 20);
    const dong2 = ds2.data.find((r) => r.ma === ds[2].ma);
    k('H1 GET /don/:ma đơn bị huỷ → da_huy, hoan_vao_tai_khoan = 20.000, ly_do_huy = "Hết nguyên liệu", không lộ ghi thêm', sau?.tien_trinh === 'da_huy'
      && sau.hoan_vao_tai_khoan === 20000 && sau.ly_do_huy === 'Hết nguyên liệu' && !JSON.stringify(sau).includes('GHI_NOI_BO_K'),
    JSON.stringify({ t: sau?.tien_trinh, h: sau?.hoan_vao_tai_khoan, l: sau?.ly_do_huy }));
    k('H1b GET /don (danh sách) cùng hai trường', dong2?.tien_trinh === 'da_huy' && dong2.hoan_vao_tai_khoan === 20000 && dong2.ly_do_huy === 'Hết nguyên liệu'
      && !JSON.stringify(ds2).includes('GHI_NOI_BO_K'), JSON.stringify({ t: dong2?.tien_trinh, h: dong2?.hoan_vao_tai_khoan, l: dong2?.ly_do_huy }));
    k('H2 khách khác đọc mã đơn App này → null (404 như cũ)', (await donApp.chiTietDon(sdtMoi(), ds[1].ma)) === null);
    k('A2b ví khách đơn App +60.000 (ba đơn CK 20.000 hoàn vào tài khoản)', (await vi(sdt)) === 60000, `ví ${await vi(sdt)}`);
    // H6 (soát vòng 1): đơn App của con trả ví mẹ 10.000 + tiền mặt 10.000 → App của con thấy hoàn 10.000 (phần ví mẹ về ví mẹ, không tính)
    const me = sdtMoi(), con = sdtMoi();
    await db.run('INSERT INTO pos_customers (phone, name, parent_phone) VALUES (?, ?, ?) ON CONFLICT(phone) DO UPDATE SET parent_phone = excluded.parent_phone', [con, 'Con', me]);
    await nap(me, 50000);
    const om = await ban({ customer_phone: con, parent_phone: me, items: [mon(1)], payment_method: 'combined', parent_balance_amount: 10000, cash_amount: 10000 });
    const xm = await donAppMoi(con, 'xong', om);
    const hm = await huy(om.id, { ly_do_ma: 'bam_nham' });
    const tm = await donApp.chiTietDon(con, xm.ma);
    k('H6 đơn App ví mẹ 10.000 + tiền mặt 10.000 → huỷ 200; App con: hoan_vao_tai_khoan = 10.000 (ví mẹ không tính); mẹ về 50.000', hm.status === 200
      && tm?.hoan_vao_tai_khoan === 10000 && (await vi(me)) === 50000 && (await vi(con)) === 10000,
    `${moTa(hm)} h ${tm?.hoan_vao_tai_khoan} mẹ ${await vi(me)} con ${await vi(con)}`);
  }

  // ═══ D · hoàn toàn bộ vào tài khoản ═══
  muc('[D] Khách có tài khoản — TOÀN BỘ đã trả vào ví, mỗi phần một dòng sổ ghi nguồn');
  {
    const s1 = sdtMoi();
    const d1 = await tienMat(s1);
    await huy(d1.id);
    const r1 = await dongHoan(d1.id);
    k('D1 tiền mặt 25.000 → ví +25.000, một dòng sổ cách huy_tien_mat, ghi chú "tiền mặt"', (await vi(s1)) === 25000 && r1.length === 1
      && r1[0].payment_method === 'huy_tien_mat' && Number(r1[0].amount) === 25000 && /tiền mặt/.test(r1[0].notes || ''), JSON.stringify(r1));
    const s2 = sdtMoi();
    const d2 = await chuyenKhoan(s2);
    await huy(d2.id);
    const r2 = await dongHoan(d2.id);
    k('D2 chuyển khoản 20.000 → ví +20.000, dòng cách huy_ck, ghi chú "chuyển khoản"', (await vi(s2)) === 20000 && r2.length === 1
      && r2[0].payment_method === 'huy_ck' && /chuyển khoản/.test(r2[0].notes || ''), JSON.stringify(r2));
    const s3 = sdtMoi();
    await nap(s3, 100000);
    const d3 = await ban({ customer_phone: s3, items: [mon(0)], payment_method: 'balance', balance_amount: 25000 });
    await huy(d3.id);
    const r3 = await dongHoan(d3.id);
    k('D3 trả ví 25.000 → ví về 100.000, một dòng cách cash (như cũ)', (await vi(s3)) === 100000 && r3.length === 1 && r3[0].payment_method === 'cash', JSON.stringify(r3));
    const s4 = sdtMoi();
    await nap(s4, 10000);
    const d4 = await ban({ customer_phone: s4, items: [mon(0)], payment_method: 'combined', balance_amount: 10000, cash_amount: 15000 });
    await huy(d4.id);
    const r4 = await dongHoan(d4.id);
    k('D4 ví 10.000 + tiền mặt 15.000 → hai dòng (cash 10.000 · huy_tien_mat 15.000), ví = 25.000', (await vi(s4)) === 25000 && r4.length === 2
      && r4.some((x) => x.payment_method === 'cash' && Number(x.amount) === 10000) && r4.some((x) => x.payment_method === 'huy_tien_mat' && Number(x.amount) === 15000),
    JSON.stringify(r4));
    const me = sdtMoi(), con = sdtMoi();
    await db.run('INSERT INTO pos_customers (phone, name, parent_phone) VALUES (?, ?, ?) ON CONFLICT(phone) DO UPDATE SET parent_phone = excluded.parent_phone', [con, 'Con', me]);
    await nap(me, 100000);
    const d5 = await ban({ customer_phone: con, parent_phone: me, items: [mon(0)], payment_method: 'combined', parent_balance_amount: 10000, cash_amount: 15000 });
    await huy(d5.id);
    k('D5 ví mẹ 10.000 + tiền mặt 15.000 → mẹ về 100.000, con +15.000', (await vi(me)) === 100000 && (await vi(con)) === 15000, `mẹ ${await vi(me)} con ${await vi(con)}`);
    const s6 = sdtMoi();
    const d6 = await ban({ customer_phone: s6, items: [mon(0)], payment_method: 'combined', cash_amount: 10000, debt_amount: 15000 });
    const tra = await goi('POST', `/orders/${d6.id}/pay-debt`, { amount: 5000, payment_method: 'cash' });
    await huy(d6.id);
    k('D6 nợ đã thu một phần (10.000 + thu 5.000, còn nợ 10.000) → ví +15.000', tra.status === 200 && (await vi(s6)) === 15000, `${moTa(tra)} ví ${await vi(s6)}`);
    const s7 = sdtMoi();
    const d7 = await tienMat(s7, 2);
    const diem7 = await so("SELECT COALESCE(SUM(points), 0) FROM pos_point_transactions WHERE order_id = ? AND type = 'earn'", [d7.id]);
    const den = await goi('POST', '/damages', { order_id: d7.id, reason: 'damaged', reason_note: 'thử HUY1', product_code: sp[2].code, quantity: 1, action: 'refund', refund_amount: 10000 });
    const viSauDen = await vi(s7);
    await huy(d7.id);
    k('D7 đơn 50.000 đã đền 10.000 → huỷ chỉ hoàn 40.000 (tổng nhận lại = 50.000)', den.status === 200 && (await vi(s7)) - viSauDen === 40000
      && (await so("SELECT SUM(amount) FROM pos_balance_transactions WHERE order_id = ? AND type IN ('refund', 'compensation')", [d7.id])) === 50000,
    `${moTa(den)} huỷ +${(await vi(s7)) - viSauDen}`);
    k('G1b đơn đã đền một phần rồi huỷ → tổng điểm của đơn = 0 (không trừ hai lần)', diem7 > 0
      && (await so('SELECT COALESCE(SUM(points), 0) FROM pos_point_transactions WHERE order_id = ?', [d7.id])) === 0, `earn ${diem7}`);
    const s10 = sdtMoi();
    await db.run('INSERT INTO pos_wallets (phone, balance, thuong, total_topup, total_spent, created_at, updated_at) VALUES (?, 100000, 20000, 100000, 0, ?, ?)', [s10, getNow(), getNow()]);
    await db.run(`INSERT INTO pos_balance_transactions (customer_phone, type, amount, thuong, balance_before, balance_after, payment_method, notes, created_by, created_at)
      VALUES (?, 'adjust', 100000, 20000, 0, 100000, 'cash', 'nền thử', 'thu', ?)`, [s10, getNow()]);
    const d10a = await tienMat(s10);
    await huy(d10a.id);
    const t1 = await thuong(s10);
    const d10b = await ban({ customer_phone: s10, items: [mon(0)], payment_method: 'combined', balance_amount: 10000, cash_amount: 15000 });
    const tGiua = await thuong(s10);
    await huy(d10b.id);
    k('D10 (NAP-1) đơn tiền mặt huỷ → thưởng không đổi (cả khoản vào tiền nạp); đơn ví + tiền mặt huỷ → thưởng về đúng như trước', t1 === 20000
      && tGiua < 20000 && (await thuong(s10)) === 20000 && (await vi(s10)) === 140000, `thưởng ${t1} → ${tGiua} → ${await thuong(s10)} · ví ${await vi(s10)}`);
    const coTM = await so(`SELECT COUNT(*) FROM pos_hoan_tien_mat WHERE order_id IN (${[d1, d2, d3, d4, d5, d6, d7, d10a, d10b].map((x) => x.id).join(',')})`).catch(() => -1);
    k('D9 đơn có SĐT không bao giờ có dòng hoàn tiền mặt khách lẻ', coTM === 0, String(coTM));
  }

  // ═══ E · khách lẻ ═══
  muc('[E] Khách lẻ (không SĐT) — tiền mặt + CK trả bằng TIỀN MẶT từ két, máy ghi khoản hoàn tiền mặt');
  {
    const a = await tienMat(null);
    const ea = await huy(a.id, { ly_do_ma: 'khach_doi_y', ghi_them: 'đi gấp' });
    const ra = await hoanTM(a.id);
    k('E1 khách lẻ tiền mặt 25.000 → một dòng hoàn tiền mặt 25.000; trả về hoan.tien_mat = 25.000, tai_khoan = 0', ea.status === 200 && ra.length === 1
      && Number(ra[0].so_tien) === 25000 && ea.hoan?.tien_mat === 25000 && ea.hoan?.tai_khoan === 0, `${moTa(ea)} ${JSON.stringify(ra)} ${JSON.stringify(ea.hoan)}`);
    k('E4 dòng có đơn, số, người làm, lúc (giờ VN hôm nay), mã lý do, lý do', ra[0] && ra[0].nguoi === 'h1_manager' && String(ra[0].luc).slice(0, 10) === homNay
      && ra[0].ly_do_ma === 'khach_doi_y' && ra[0].ly_do === 'Khách đổi ý · đi gấp', JSON.stringify(ra[0] || {}));
    const b = await chuyenKhoan(null);
    await huy(b.id);
    const rb = await hoanTM(b.id);
    k('E2 khách lẻ chuyển khoản 20.000 → dòng hoàn tiền mặt 20.000 (trả bằng tiền mặt)', rb.length === 1 && Number(rb[0].so_tien) === 20000, JSON.stringify(rb));
    k('E3 khách lẻ: không ghi dòng sổ ví nào', (await so('SELECT COUNT(*) FROM pos_balance_transactions WHERE order_id IN (?, ?)', [a.id, b.id])) === 0);
    let trung = null;
    try { await db.run("INSERT INTO pos_hoan_tien_mat (order_id, so_tien, luc) VALUES (?, 1, '2026-01-01T00:00:00')", [a.id]); } catch (e) { trung = e; }
    k('E5 bảng hoàn tiền mặt UNIQUE theo đơn — đã có một dòng, dòng thứ hai bị chặn', ra.length === 1 && !!trung && (await hoanTM(a.id)).length === 1);
    // E6 (soát vòng 1): I19 "khách nhận lại ≤ đã trả" phải tính cả khoản trả tiền mặt khách lẻ — ngay trên (25.001) báo, đúng 25.000 không báo
    const i19 = async () => (await batBien.BAT_BIEN.I19((sql, x = []) => db.query(sql, x), {})).filter((l) => l.includes(a.code));
    await db.run('UPDATE pos_hoan_tien_mat SET so_tien = 25001 WHERE order_id = ?', [a.id]);
    const tren = await i19();
    await db.run('UPDATE pos_hoan_tien_mat SET so_tien = 25000 WHERE order_id = ?', [a.id]);
    const dung = await i19();
    k('E6 I19 tính khoản hoàn tiền mặt khách lẻ: 25.001 > đã trả 25.000 → báo; 25.000 → không báo', tren.length === 1 && dung.length === 0,
      `trên ${JSON.stringify(tren)} · đúng ${JSON.stringify(dung)}`);
    const ghi = [];
    const quet = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) { if (f.name !== 'node_modules') quet(p); } else if (f.name.endsWith('.js') && /INSERT\s+INTO\s+pos_hoan_tien_mat/i.test(fs.readFileSync(p, 'utf8'))) ghi.push(path.relative(MAY_CHU, p));
    } };
    quet(MAY_CHU);
    k('E5b lối DUY NHẤT ghi khoản hoàn tiền mặt: chỉ routes/orders.js', JSON.stringify(ghi) === JSON.stringify(['routes/orders.js']), JSON.stringify(ghi));
  }

  // ═══ F · Đối soát ═══
  muc('[F] Đối soát — "hoàn vào tài khoản" X, "hoàn tiền mặt khách lẻ" Y; két trừ Y; CK đơn luật mới không trả ra');
  {
    const tong = async () => (await doiSoat.chayDoiSoat({ kieu: 'ngay', ngay: homNay }, {})).tien;
    const t0 = await tong();
    const x = await tienMat(sdtMoi());
    await huy(x.id);
    const y1 = await tienMat(null);
    await huy(y1.id);
    const y2 = await chuyenKhoan(null);
    await huy(y2.id);
    const ck = await chuyenKhoan(sdtMoi());
    await huy(ck.id);
    const t1 = await tong();
    const dX = (t1.huy_don?.hoan_tai_khoan ?? NaN) - (t0.huy_don?.hoan_tai_khoan ?? NaN);
    const dY = (t1.huy_don?.hoan_tien_mat ?? NaN) - (t0.huy_don?.hoan_tien_mat ?? NaN);
    k('F1 tổng hợp ngày có huy_don.hoan_tai_khoan (+45.000 = 25.000 tiền mặt + 20.000 CK) và huy_don.hoan_tien_mat (+45.000 khách lẻ)', dX === 45000 && dY === 45000,
      `X +${dX} Y +${dY} ${JSON.stringify(t1.huy_don)}`);
    const dTM = t1.tien_mat.tra_ra - t0.tien_mat.tra_ra, dCK = t1.chuyen_khoan.tra_ra - t0.chuyen_khoan.tra_ra;
    k('F2 két tiền mặt "trả ra" +45.000 = đúng Y (đơn có SĐT trả tiền mặt KHÔNG trừ két)', dTM === 45000, `tiền mặt trả ra +${dTM}`);
    k('F3 chuyển khoản "trả ra" +0 (tiền CK đã về, rồi hoàn vào ví / trả bằng tiền mặt)', dCK === 0, `CK trả ra +${dCK}`);
    // F5: đơn huỷ CŨ (trước HUY-1 — huy_ly_do_ma NULL) giữ công thức cũ: tiền mặt của đơn = trả tận tay
    const cu = await tienMat(sdtMoi());
    await db.run(`UPDATE pos_orders SET status = 'cancelled', cancelled_at = ?, cancelled_reason = 'cũ' WHERE id = ?`, [getNow(), cu.id]);
    const t2 = await tong();
    k('F5 đơn huỷ cũ (không mã lý do) → két "trả ra" +25.000 như trước, X không đổi', t2.tien_mat.tra_ra - t1.tien_mat.tra_ra === 25000
      && t2.huy_don?.hoan_tai_khoan === t1.huy_don?.hoan_tai_khoan, `+${t2.tien_mat.tra_ra - t1.tien_mat.tra_ra}`);
  }

  // ═══ G · đi kèm ═══
  muc('[G] Đi kèm — điểm, mã, kho, gói, huỷ hai lần, hai người cùng bấm, yêu cầu hoàn');
  {
    const s = sdtMoi();
    await db.run("INSERT INTO pos_discount_codes (code, discount_type, discount_value, is_active, usage_limit, used_count) VALUES ('HUY1GIAM', 'fixed', 5000, 1, 0, 0)");
    const d = await ban({ customer_phone: s, items: [mon(0)], payment_method: 'cash', cash_amount: 20000, discount_code: 'HUY1GIAM' });
    const diem = await so("SELECT COALESCE(SUM(points), 0) FROM pos_point_transactions WHERE order_id = ? AND type = 'earn'", [d.id]);
    const dung = await so("SELECT used_count FROM pos_discount_codes WHERE code = 'HUY1GIAM'");
    const kho0 = traKho.length;
    const g = await huy(d.id);
    k('G1 điểm đã cộng trừ lại (tổng điểm của đơn = 0)', g.status === 200 && diem > 0 && (await so('SELECT COALESCE(SUM(points), 0) FROM pos_point_transactions WHERE order_id = ?', [d.id])) === 0, `earn ${diem}`);
    k('G2 lượt mã trả lại (1 → 0)', dung === 1 && (await so("SELECT used_count FROM pos_discount_codes WHERE code = 'HUY1GIAM'")) === 0, `trước ${dung}`);
    k('G3 hoàn kho SX: lệnh trả hàng có vân tay POS:<id>:in:0', traKho.length - kho0 === 1 && traKho[kho0][4] === `POS:${d.id}:in:0`, JSON.stringify(traKho.slice(kho0)));
    k('D-mã ví +20.000 = số khách thật trả sau giảm', (await vi(s)) === 20000, `ví ${await vi(s)}`);
    const viTruoc = await vi(s);
    const g5 = await huy(d.id);
    k('G5 huỷ lần hai → 400 DON_KHONG_HUY_DUOC, ví không đổi', g5.status === 400 && g5.code === 'DON_KHONG_HUY_DUOC' && (await vi(s)) === viTruoc, moTa(g5));
    // G6 hai người bấm cùng lúc
    const s6 = sdtMoi();
    const d6 = await tienMat(s6);
    const le = await tienMat(null);
    const [a, b, c, e] = await Promise.all([huy(d6.id), huy(d6.id, { ly_do_ma: 'bam_nham' }, tk.owner), huy(le.id), huy(le.id, { ly_do_ma: 'bam_nham' }, tk.owner)]);
    k('G6 hai người bấm huỷ cùng lúc → đúng một 200; ví +25.000 một lần; khoản hoàn tiền mặt một dòng', [a, b].filter((r) => r.status === 200).length === 1
      && [c, e].filter((r) => r.status === 200).length === 1 && (await vi(s6)) === 25000 && (await hoanTM(le.id)).length === 1,
    `${[a, b, c, e].map(moTa).join(' / ')} ví ${await vi(s6)}`);
    // G7 yêu cầu hoàn đang chờ
    const s7 = sdtMoi();
    await nap(s7, 25000);
    const d7 = await ban({ customer_phone: s7, items: [mon(0)], payment_method: 'balance', balance_amount: 25000 });
    const yc =await goi('POST', '/refunds', { order_id: d7.id, reason: 'thử HUY1' });
    await huy(d7.id);
    const ycSau = yc.refund_id ? await mot('SELECT status FROM pos_refund_requests WHERE id = ?', [yc.refund_id]) : null;
    const duyet = yc.refund_id ? await goi('POST', `/refunds/${yc.refund_id}/approve`, {}) : { status: 0 };
    k('G7 yêu cầu hoàn đang chờ → rejected khi huỷ; duyệt sau đó → 400', ycSau?.status === 'rejected' && duyet.status === 400, `${moTa(yc)} ${ycSau?.status} ${moTa(duyet)}`);
    // G4 đơn mua gói
    const goiId = Number((await db.run("INSERT INTO pos_packages (code, name, price, unit, total_qty, is_active) VALUES ('GOI_HUY1', 'Gói HUY1', 100000, 'ly', 10, 1)")).lastInsertRowid);
    const sg = sdtMoi();
    const mg = await goi('POST', '/orders', { customer_phone: sg, customer_name: 'Khách HUY1', items: [], package_buy: { package_id: goiId, total_qty: 10, pkg_qty: 1 },
      payment_method: 'cash', cash_amount: 100000 });
    const g4a = await huy(mg.order?.id, { ly_do_ma: 'bam_nham' }, tk.manager);
    const g4b = await huy(mg.order?.id, { ly_do_ma: 'bam_nham' }, tk.owner);
    const rg = await dongHoan(mg.order?.id);
    k('G4 đơn mua gói: manager → 403 như cũ; owner → 200, ví +100.000 dòng huy_tien_mat (không còn hoan_goi)', g4a.status === 403 && g4b.status === 200
      && (await vi(sg)) === 100000 && rg.length === 1 && rg[0].payment_method === 'huy_tien_mat', `${moTa(g4a)} / ${moTa(g4b)} ${JSON.stringify(rg)}`);
  }

  // ═══ K5 · không đổi ═══
  muc('[K5] Không đổi — xoá đơn của owner hoàn như cũ (chỉ phần ví)');
  {
    const s = sdtMoi();
    await nap(s, 10000);
    const d = await ban({ customer_phone: s, items: [mon(0)], payment_method: 'combined', balance_amount: 10000, cash_amount: 15000 });
    const x = await goi('DELETE', `/orders/${d.id}`);
    k('K1 xoá đơn ví 10.000 + tiền mặt 15.000 → ví về 10.000 (chỉ phần ví, như gốc), không dòng hoàn tiền mặt', x.status === 200 && (await vi(s)) === 10000
      && (await hoanTM(d.id)).length === 0, `${moTa(x)} ví ${await vi(s)}`);
  }

  // ═══ D8 · bất biến ═══
  muc('[D8] Bất biến ví sau mọi ca — I11 · I18 · I19 không lệch');
  for (const ten of ['I11', 'I18', 'I19']) {
    const lech = await batBien.BAT_BIEN[ten]((sql, a = []) => db.query(sql, a), {});
    k(`D8 ${ten} không lệch`, lech.length === 0, lech.slice(0, 3).join(' | '));
  }

  // ═══ H5 · hợp đồng App ═══
  muc('[H5] Hợp đồng /api/kh — hai trường mới, PHIEN_BAN ≥ 14');
  {
    const md = fs.readFileSync(path.join(MAY_CHU, '..', 'HOP_DONG_API_KH.md'), 'utf8');
    const pb = Number((md.match(/^PHIEN_BAN: (\d+)$/m) || [])[1]);
    const dong = (cua) => md.split('\n').find((l) => l.startsWith(`| \`${cua}\``)) || '';
    k('H5 PHIEN_BAN ≥ 14; dòng GET /don và GET /don/:ma có hoan_vao_tai_khoan, ly_do_huy; nhật ký có dòng HUY-1', pb >= 14
      && ['GET /don', 'GET /don/:ma'].every((c) => /hoan_vao_tai_khoan/.test(dong(c)) && /ly_do_huy/.test(dong(c))) && /HUY-1/.test(md.split('## Nhật ký')[1] || md.slice(-3000)),
    `PHIEN_BAN ${pb}`);
  }

  sv.close();
  console.log(`\nTHỬ HUY-1: ${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
}

main().catch((e) => { noiLai(); console.error('✗ BÀI SẬP:', e.stack || e.message); console.log(`\nTHỬ HUY-1: ${dat} đạt · ${hong + 1} hỏng`); process.exit(1); });
