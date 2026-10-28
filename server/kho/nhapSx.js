/**
 * KHO-1 — nhập danh mục từ bản sao lưu SX (.db): nguyên liệu, nhóm sản phẩm, món, công thức. KHÔNG lấy tồn, lô, khách, gói, giao, việc.
 * Một hàm lapKeHoach (thuần) cho cả XEM TRƯỚC lẫn NHẬP (K4). Nhập chỉ THÊM cái còn thiếu, không ghi đè chỗ chủ quán đã sửa trong POS.
 * Cấu trúc SX + khoá nối: viec/KHO-1/phieu.md mục "Cấu trúc SX".
 */
const os = require('os');
const path = require('path');
const { createClient } = require('@libsql/client');
const { chuanHoaTen, chuanTenHienThi } = require('./tinh');

// ── Thông tin riêng của quán (chủ quán chốt 28.10) — đóng gói cho quán khác thì thay khối này ──
const TEN_CHINH_THUC = [   // [tên POS, nhóm, các tên SX gộp vào]
  ['Củ dền', 'Rau củ quả', ['Củ dền', 'Dền Đỏ']], ['Gừng', 'Rau củ quả', ['Gừng', 'Gừng tươi']],
  ['Táo đỏ', 'Dược liệu', ['Táo đỏ', 'Táo Đỏ', 'Táo đỏ khô']], ['Trần bì', 'Dược liệu', ['Trần bì', 'Trần Bì ', 'Trần bì khô']],
  ['Kỷ tử', 'Dược liệu', ['Kỷ tử', 'Kỳ Tử ']], ['Mẹ thuốc', 'Dược liệu', ['Mẹ Thuốc', 'Mẹ Thuốc ']],
  ['Cẩu tích', 'Dược liệu', ['Cẩu tích', 'Cẩu Tích']],
  ...['Bí đỏ', 'Bông cải xanh', 'Bạc hà', 'Cam', 'Cà rốt', 'Cải bó xôi', 'Cải xoăn', 'Củ cải trắng', 'Dưa chuột', 'Táo tươi']
    .map((t) => [t, 'Rau củ quả', [t]]),
  ...['Bạch truật chích mật', 'Cam thảo', 'Hoàng kỳ', 'Hoắc hương', 'Lạc tiên', 'Mè đen rang', 'Phục linh', 'Sa nhân', 'Thục địa chế',
    'Vông nem', 'Ý dĩ', 'Đương quy', 'Đảng sâm', 'Đỗ trọng nam', 'Đỗ đen rang'].map((t) => [t, 'Dược liệu', [t]]),
];
const NHOM_THEO_CATEGORY = { juice: 'Rau củ quả', tea: 'Dược liệu' };   // tên SX mới (không có trong bảng trên)
const DON_VI_HIEN = { 'Dược liệu': ['g', 0.001], 'Rau củ quả': ['kg', 1] };   // [đơn vị hiện, hệ số đổi]; đơn vị lưu luôn kg
const GIA_TOI_THIEU = 1000;   // giá SX < 1.000 đ/kg coi như chưa có giá (gõ thiếu số)
const GIOI_HAN_FILE_SX = 20 * 1024 * 1024;
const THU_MUC_TAM = path.join(os.tmpdir(), 'pos_nhap_sx');

/** khoá chuanHoaTen(tên SX) → [tên POS, nhóm]. */
const BANG_TEN_CHINH_THUC = Object.fromEntries(TEN_CHINH_THUC.flatMap(([ten, nhom, cu]) => cu.map((c) => [chuanHoaTen(c), [ten, nhom]])));

const loiFileSx = (chiTiet) => Object.assign(new Error('File không phải bản sao lưu SX — ' + chiTiet), { code: 'FILE_SX_HONG' });
const lamTron6 = (x) => Math.round(x * 1e6) / 1e6;   // số kg SX có sai số máy (0.004200000000000001)
const duong = (x) => (Number(x) > 0 ? Number(x) : null);

/** Đọc file SX (chỉ SELECT). Trả { nguyen_lieu, nhom_sp, mon, canh_bao }; mon = { loai, khoa_id, code, ten, dong: [{ ingredient_id, amount }] }. */
async function docFileSx(duongFile) {
  const c = createClient({ url: 'file:' + duongFile });
  try {
    const doc = async (sql) => (await c.execute(sql)).rows.map((r) => ({ ...r }));
    let co;
    try { co = new Set((await doc("SELECT name FROM sqlite_master WHERE type IN ('table', 'view')")).map((r) => r.name)); } catch (e) { throw loiFileSx(e.message); }
    if (!co.has('ingredients')) throw loiFileSx('không có bảng ingredients');
    const canh_bao = [];
    const nguon = (view, bang) => {
      if (co.has(view)) return view;
      canh_bao.push({ loai: 'THIEU_VIEW', loi: `File không có ${view} — đọc bảng cũ ${bang}` });
      return bang;
    };
    const conDung = (r) => Number(r.is_active ?? 1) !== 0;
    const nhomDong = (dong, cot) => (id) => dong.filter((d) => Number(d[cot]) === Number(id))
      .map((d) => ({ ingredient_id: Number(d.ingredient_id), amount: Number(d.amount) }));
    const mon = [];
    for (const [loai, vMon, bMon, vDong, bDong, cot] of [['juice', 'v_recipes', 'recipes', 'v_recipe_ingredients', 'recipe_ingredients', 'recipe_id'],
      ['tea', 'v_tea_products', 'tea_products', 'v_tea_ingredients', 'tea_ingredients', 'tea_product_id']]) {
      const dongCua = nhomDong(await doc(`SELECT * FROM ${nguon(vDong, bDong)}`), cot);
      for (const r of (await doc(`SELECT * FROM ${nguon(vMon, bMon)}`)).filter(conDung)) {
        mon.push({ loai, khoa_id: Number(r.id), code: r.code, ten: r.name, dong: dongCua(r.id) });
      }
    }
    let nhom_sp = [{ code: 'juice', name: 'Nước ép' }, { code: 'tea', name: 'Trà' }];
    if (co.has('product_types') && co.has('sx_products') && co.has('sx_product_ingredients')) {
      nhom_sp = await doc('SELECT code, name FROM product_types WHERE is_active = 1 ORDER BY sort_order, id');
      const dongCua = nhomDong(await doc('SELECT * FROM sx_product_ingredients'), 'product_id');
      for (const r of await doc(`SELECT p.id, p.code, p.name, p.legacy_id, t.code AS loai FROM sx_products p JOIN product_types t ON t.id = p.type_id
        WHERE p.is_active = 1 AND t.is_active = 1 AND t.code NOT IN ('juice', 'tea')`)) {
        mon.push({ loai: r.loai, khoa_id: r.legacy_id == null ? null : Number(r.legacy_id), code: r.code, ten: r.name, dong: dongCua(r.id) });
      }
    } else {
      canh_bao.push({ loai: 'THIEU_VIEW', loi: 'File không có bảng nhóm sản phẩm (Đợt D) — chỉ nhập nước ép và trà' });
    }
    const nguyen_lieu = await doc('SELECT id, name, unit, price, category, shelf_life_days, min_stock FROM ingredients ORDER BY id');
    return { nguyen_lieu, nhom_sp, mon, canh_bao };
  } catch (e) {
    throw e.code === 'FILE_SX_HONG' ? e : loiFileSx(e.message);
  } finally {
    c.close();
  }
}

/** Đọc những gì POS đang có (để không thêm trùng, không ghi đè). csdl có query(); gọi trong giao dịch khi nhập. */
async function docHienCo(csdl) {
  const cot = async (sql, ten) => (await csdl.query(sql)).map((r) => r[ten]);
  return {
    nguyen_lieu: await csdl.query('SELECT ten_chuan, sx_id FROM kho_nguyen_lieu'),
    nhom_nl: await cot('SELECT ten_sx FROM kho_nhom_nguyen_lieu WHERE ten_sx IS NOT NULL', 'ten_sx'),
    nhom_ct: await cot('SELECT ten_sx FROM kho_nhom_cong_thuc WHERE ten_sx IS NOT NULL', 'ten_sx'),
    san_pham: await csdl.query('SELECT id, code, sx_product_type, sx_product_id FROM pos_products'),
    co_cong_thuc: await cot('SELECT DISTINCT san_pham_id FROM kho_cong_thuc', 'san_pham_id'),
    co_kho_sp: await cot('SELECT pos_product_id FROM kho_san_pham', 'pos_product_id'),
  };
}

/** THUẦN: dữ liệu SX + POS hiện có → kế hoạch nhập (bản xem trước chính là nó). */
function lapKeHoach(sx, hienCo) {
  const canh_bao = [...sx.canh_bao];
  const cb = (loai, loi) => canh_bao.push({ loai, loi });
  const gopTheo = new Map();   // ten_chuan POS → dòng gộp
  const sxVePos = new Map();   // id nguyên liệu SX → ten_chuan POS
  for (const n of sx.nguyen_lieu) {
    let [ten, nhom] = BANG_TEN_CHINH_THUC[chuanHoaTen(n.name)] || [];
    if (!ten) {
      ten = chuanTenHienThi(n.name);
      nhom = NHOM_THEO_CATEGORY[n.category] || null;
      cb('TEN_MOI', `Tên mới "${n.name}" → "${ten}" (${nhom || 'chưa có nhóm'})`);
    }
    if (!String(n.unit ?? '').trim()) cb('THIEU_DON_VI', `"${n.name}" thiếu đơn vị ở SX — lưu theo kg`);
    if (Number(n.price) > 0 && Number(n.price) < GIA_TOI_THIEU) cb('GIA_BAT_THUONG', `"${n.name}" giá SX ${Number(n.price)}đ/kg — có thể gõ thiếu số, để trống`);
    const khoa = chuanHoaTen(ten);
    const g = gopTheo.get(khoa) || { ten, ten_chuan: khoa, nhom, sx_id: Number(n.id), gia_nhap: null, han_ngay: null, ton_toi_thieu: null, ten_sx: [] };
    const gia = Number(n.price) >= GIA_TOI_THIEU ? Number(n.price) : null;
    const lon = (a, b) => (a == null ? b : (b == null ? a : Math.max(a, b)));
    Object.assign(g, { sx_id: Math.min(g.sx_id, Number(n.id)), gia_nhap: lon(g.gia_nhap, gia), han_ngay: lon(g.han_ngay, duong(n.shelf_life_days)),
      ton_toi_thieu: lon(g.ton_toi_thieu, duong(n.min_stock)) });
    g.ten_sx.push(n.name);
    gopTheo.set(khoa, g);
    sxVePos.set(Number(n.id), khoa);
  }
  const daCoNL = new Set(hienCo.nguyen_lieu.map((r) => r.ten_chuan));
  const daCoSx = new Set(hienCo.nguyen_lieu.map((r) => Number(r.sx_id)));
  const nguyen_lieu = [...gopTheo.values()].filter((g) => !daCoNL.has(g.ten_chuan) && !daCoSx.has(g.sx_id))
    .map((g) => ({ ...g, don_vi_luu: 'kg', don_vi_hien: (DON_VI_HIEN[g.nhom] || ['kg'])[0], he_so_doi: (DON_VI_HIEN[g.nhom] || [0, 1])[1] }));
  const thieuGia = nguyen_lieu.filter((g) => g.gia_nhap == null).map((g) => g.ten);
  if (thieuGia.length) cb('THIEU_GIA', `${thieuGia.length} nguyên liệu chưa có giá (SX để 0 / trống) — điền ở ô "Thiếu thông tin": ${thieuGia.join(', ')}`);
  const nhom_nguyen_lieu = [...new Set(nguyen_lieu.map((g) => g.nhom).filter((x) => x && !hienCo.nhom_nl.includes(x)))];
  const nhom_san_pham = sx.nhom_sp.filter((n) => !hienCo.nhom_ct.includes(n.code)).map((n) => ({ ten: chuanTenHienThi(n.name), ten_sx: n.code }));

  const mon = [];
  const maSeTao = new Set();
  for (const m of sx.mon) {
    const sp = hienCo.san_pham.find((p) => (m.khoa_id == null
      ? p.code === m.code && p.sx_product_id == null
      : p.sx_product_type === m.loai && Number(p.sx_product_id) === m.khoa_id));
    if (!sp && (maSeTao.has(m.code) || hienCo.san_pham.some((p) => p.code === m.code))) {
      cb('TRUNG_MA', `Mã ${m.code} ("${m.ten}") đã dùng cho món khác ở POS — bỏ qua`);
      continue;
    }
    if (!sp) {
      maSeTao.add(m.code);
      cb('MON_TAO_AN', `Món ${m.ten} tạo ẩn — đặt giá, rồi bật bán ở Quản lý kho › Sản phẩm`);
    }
    const dong = new Map();
    for (const d of m.dong) {
      const khoa = sxVePos.get(d.ingredient_id);
      if (!khoa) { cb('THIEU_NGUYEN_LIEU', `Công thức ${m.ten} trỏ nguyên liệu SX id ${d.ingredient_id} không có — bỏ dòng này`); continue; }
      if (dong.has(khoa)) cb('GOP_CONG_THUC', `Công thức ${m.ten} có hai tên cùng gộp vào "${gopTheo.get(khoa).ten}" — đã cộng lượng`);
      dong.set(khoa, (dong.get(khoa) || 0) + d.amount);
    }
    const ghiCT = dong.size > 0 && !(sp && hienCo.co_cong_thuc.map(Number).includes(Number(sp.id)));
    mon.push({ loai: m.loai, khoa_id: m.khoa_id, code: m.code, ten: m.ten, pos_id: sp ? Number(sp.id) : null,
      kieu: sp && hienCo.co_kho_sp.map(Number).includes(Number(sp.id)) ? null : (dong.size ? 'lam_san' : 'chua_dinh_luong'),
      cong_thuc: ghiCT ? [...dong].map(([ten_chuan, luong]) => ({ ten_chuan, sx_id: gopTheo.get(ten_chuan).sx_id, luong: lamTron6(luong) })) : null });
  }
  return {
    nguyen_lieu_them: nguyen_lieu.length, nhom_nguyen_lieu_them: nhom_nguyen_lieu.length, nhom_san_pham_them: nhom_san_pham.length,
    mon_tao_an: mon.filter((m) => m.pos_id == null).length, cong_thuc_ghi: mon.filter((m) => m.cong_thuc).length,
    gop: [...gopTheo.values()].filter((g) => g.ten_sx.length > 1).map((g) => ({ giu: g.ten, cu: g.ten_sx })),
    canh_bao, nguyen_lieu, nhom_nguyen_lieu, nhom_san_pham, mon,
  };
}

/** Ghi kế hoạch trong giao dịch tx (đã đọc hienCo trong CÙNG giao dịch). Mọi câu chỉ THÊM, OR IGNORE theo khoá duy nhất. */
async function ghiKeHoach(tx, kh, luc) {
  const idTheo = async (sql, a) => Number((await tx.queryOne(sql, a))?.id) || null;
  // Nhóm chủ quán đã tự tạo trùng tên (ten_sx trống) → dùng lại nhóm đó, ghi ten_sx để lần nhập sau khớp
  const themNhom = (bang, ten, tenSx) => tx.run(`INSERT INTO ${bang} (ten, ten_sx) VALUES (?, ?)
    ON CONFLICT(ten) DO UPDATE SET ten_sx = COALESCE(${bang}.ten_sx, excluded.ten_sx)`, [ten, tenSx]);
  for (const ten of kh.nhom_nguyen_lieu) await themNhom('kho_nhom_nguyen_lieu', ten, ten);
  for (const g of kh.nguyen_lieu) {
    await tx.run(`INSERT OR IGNORE INTO kho_nguyen_lieu (ten, ten_chuan, nhom_id, don_vi_luu, don_vi_hien, he_so_doi, gia_nhap, ton_toi_thieu,
      han_ngay, sx_id, tao_luc) VALUES (?, ?, (SELECT id FROM kho_nhom_nguyen_lieu WHERE ten_sx = ?), ?, ?, ?, ?, ?, ?, ?, ?)`,
    [g.ten, g.ten_chuan, g.nhom, g.don_vi_luu, g.don_vi_hien, g.he_so_doi, g.gia_nhap, g.ton_toi_thieu, g.han_ngay, g.sx_id, luc]);
  }
  for (const n of kh.nhom_san_pham) await themNhom('kho_nhom_cong_thuc', n.ten, n.ten_sx);
  for (const m of kh.mon) {
    if (m.pos_id == null) {
      // Món ẩn, giá 0: menu dự phòng chỉ lấy is_active = 1 (routes/products.js getFallbackProducts), tạo đơn chỉ nhận is_active = 1 và
      // price > 0 (routes/orders.js). Chủ quán đặt giá (PUT /products/price) rồi bật bán (PUT /api/pos/kho/san-pham/:id/ban).
      await tx.run(`INSERT OR IGNORE INTO pos_products (code, name, category, price, unit, is_active, sx_product_type, sx_product_id)
        VALUES (?, ?, ?, 0, ?, 0, ?, ?)`, [m.code, m.ten, m.loai, m.loai === 'tea' ? 'gói' : 'túi', m.loai, m.khoa_id]);
    }
    const spId = m.pos_id ?? await idTheo('SELECT id FROM pos_products WHERE code = ?', [m.code]);
    if (m.kieu) {
      await tx.run(`INSERT OR IGNORE INTO kho_san_pham (pos_product_id, kieu, nhom_id, sua_luc)
        VALUES (?, ?, (SELECT id FROM kho_nhom_cong_thuc WHERE ten_sx = ?), ?)`, [spId, m.kieu, m.loai, luc]);
    }
    for (const d of m.cong_thuc || []) {   // lapKeHoach chỉ đưa công thức cho món CHƯA có (đọc trong cùng giao dịch)
      // nguyên liệu chủ quán đã đổi tên trong POS vẫn tìm ra qua sx_id
      await tx.run(`INSERT INTO kho_cong_thuc (san_pham_id, nguyen_lieu_id, luong)
        VALUES (?, (SELECT id FROM kho_nguyen_lieu WHERE ten_chuan = ? OR sx_id = ? ORDER BY ten_chuan = ? DESC LIMIT 1), ?)`,
      [spId, d.ten_chuan, d.sx_id, d.ten_chuan, d.luong]);
    }
  }
}

module.exports = { BANG_TEN_CHINH_THUC, GIOI_HAN_FILE_SX, THU_MUC_TAM, docFileSx, docHienCo, lapKeHoach, ghiKeHoach };
