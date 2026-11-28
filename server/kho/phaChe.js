/**
 * KHO-GON-2 — pha chế theo kho: tồn theo khoá ('nl:' nguyên liệu · 'sp:' gói / thành phẩm), màn Pha chế (tối đa theo kho, mẻ), kiểm đủ kho cho phiếu
 * xuất pha chế (Q1 — tạo và duyệt), tập món làm sẵn (Q2 — thành phần làm sẵn trừ LÔ của nó). Tách khỏi duLieu.js (đã gần 500 dòng).
 */
const { thuCuaNgay, chonDinhMuc, canLam, khoaThu, toiDa, thieuKho, trienKhai, gopLuong } = require('./tinh');
const { conLaiTheoLo, COT_TON_NL, dauHoi, docBangCongThuc, docMonLamSan } = require('./duLieu');

/** KHO-GON-2 Q2: món làm sẵn (gói…) — thành phần thuộc tập này trong phiếu xuất pha chế trừ LÔ của nó, không triển khai xuống nguyên liệu. */
const docLamSan = async (csdl) => new Set((await csdl.query("SELECT pos_product_id FROM kho_san_pham WHERE kieu = 'lam_san'")).map((r) => Number(r.pos_product_id)));

/** KHO-GON-2: tồn của các thứ theo khoá — nguyên liệu = Σ dòng đã duyệt (cùng số màn Tồn kho); thành phẩm / gói = lô còn hạn tại `moc`. */
async function docTonTheoKhoa(csdl, khoa, moc) {
  const ton = new Map();
  const nlIds = khoa.filter((x) => x.startsWith('nl:')).map((x) => Number(x.slice(3)));
  const spIds = khoa.filter((x) => x.startsWith('sp:')).map((x) => Number(x.slice(3)));
  if (nlIds.length) {
    for (const r of await csdl.query(`SELECT l.id, l.ten, l.don_vi_luu, l.don_vi_hien, l.he_so_doi, ${COT_TON_NL} AS ton FROM kho_nguyen_lieu l WHERE l.id IN (${dauHoi(nlIds)})`, nlIds)) {
      ton.set('nl:' + r.id, { khoa: 'nl:' + r.id, ten: r.ten, don_vi: r.don_vi_hien || r.don_vi_luu, he_so_doi: r.he_so_doi || 1, ton: Number(r.ton) });
    }
  }
  if (spIds.length) {
    const lo = await conLaiTheoLo(csdl, `l.san_pham_id IN (${dauHoi(spIds)}) AND (l.han_dung IS NULL OR l.han_dung > ?)`, [...spIds, moc]);
    for (const p of await csdl.query(`SELECT id, name, unit FROM pos_products WHERE id IN (${dauHoi(spIds)})`, spIds)) {
      ton.set('sp:' + p.id, { khoa: 'sp:' + p.id, ten: p.name, don_vi: p.unit || 'phần', he_so_doi: 1,
        ton: lo.filter((l) => Number(l.san_pham_id) === Number(p.id)).reduce((t, l) => t + Number(l.con), 0) });
    }
  }
  return ton;
}

/** Q1 + Q2: phiếu xuất pha chế cần nhiều hơn kho → { loi } (nguyên liệu 409 THIEU_NGUYEN_LIEU · gói / thành phẩm 409 KHONG_DU_TON), đủ → null.
 *  can = dòng triển khai [{ nguyen_lieu_id | san_pham_id, luong }]. MỘT hàm cho tạo và duyệt. */
async function kiemDuKho(csdl, can, moc) {
  const gop = gopLuong(can.map((d) => ({ nguyen_lieu_id: khoaThu(d), luong: d.luong }))).map((d) => ({ khoa: d.nguyen_lieu_id, luong: d.luong }));
  const ton = await docTonTheoKhoa(csdl, gop.map((d) => d.khoa), moc);
  const thieu = thieuKho(gop, new Map([...ton].map(([k, v]) => [k, v.ton]))).map((t) => ({ ...t, ten: ton.get(t.khoa)?.ten, don_vi: ton.get(t.khoa)?.don_vi }));
  if (!thieu.length) return null;
  const nl = thieu.some((t) => t.khoa.startsWith('nl:'));
  const chu = thieu.map((t) => `${t.ten} (cần ${Number(t.can.toFixed(3))}, có ${Number(t.co.toFixed(3))})`).join(', ');
  return { loi: [409, { error: nl ? `Thiếu nguyên liệu: ${chu}` : `Không đủ thành phẩm trong kho: ${chu}`, code: nl ? 'THIEU_NGUYEN_LIEU' : 'KHONG_DU_TON', thieu }] };
}

/** Màn Pha chế cho ngày `ngay` (giờ VN): đang có = lô thành phẩm còn hạn tại `moc`. KHO-GON-2: mỗi món kèm định lượng 1 đơn vị (mot_phan, theo khoá),
 *  tối đa theo kho (tinh.toiDa), mẻ; bảng `kho` = tên + tồn của mọi thứ xuất hiện — màn cộng chân "Thiếu:" (chỉ hiện; máy chủ chặn ở kiemDuKho). */
async function docPhaChe(csdl, ngay, moc) {
  const thu = thuCuaNgay(ngay);
  const dm = await csdl.query('SELECT san_pham_id, thu, so_luong FROM kho_dinh_muc');
  const lo = await conLaiTheoLo(csdl, 'l.san_pham_id IS NOT NULL AND (l.han_dung IS NULL OR l.han_dung > ?)', [moc]);
  const bang = await docBangCongThuc(csdl);
  const lamSan = await docLamSan(csdl);
  const mon = (await docMonLamSan(csdl)).map((m) => {
    const spId = Number(m.san_pham_id);
    const dinhMuc = chonDinhMuc(dm.filter((d) => Number(d.san_pham_id) === spId), thu);
    const dangCo = lo.filter((l) => Number(l.san_pham_id) === spId).reduce((t, l) => t + Number(l.con), 0);
    let motPhan = [];
    try { motPhan = Number(m.co_ct) ? trienKhai({ goc: spId, bang }, 1, lamSan).map((d) => ({ khoa: khoaThu(d), luong: d.luong })) : []; } catch { /* công thức vòng: màn hiện như chưa có */ }
    return { san_pham_id: spId, ten: m.ten, nhom_id: m.nhom_id == null ? null : Number(m.nhom_id), dinh_muc: dinhMuc, dang_co: dangCo, can_lam: canLam(dinhMuc, dangCo),
      co_cong_thuc: !!Number(m.co_ct), me_ra: m.me_ra == null ? null : Number(m.me_ra), me_ghi: m.me_ghi ?? null, mot_phan: motPhan };
  });
  const kho = await docTonTheoKhoa(csdl, [...new Set(mon.flatMap((m) => m.mot_phan.map((d) => d.khoa)))], moc);
  const ton = new Map([...kho].map(([k, v]) => [k, v.ton]));
  return { ngay, thu, nhom: await csdl.query('SELECT id, ten FROM kho_nhom_cong_thuc ORDER BY thu_tu, ten'), kho: [...kho.values()],
    mon: mon.map((m) => ({ ...m, toi_da: m.co_cong_thuc ? toiDa(m.mot_phan, ton) : 0 })) };
}

module.exports = { docLamSan, docTonTheoKhoa, kiemDuKho, docPhaChe };
