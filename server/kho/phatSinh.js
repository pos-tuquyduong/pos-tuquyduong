/**
 * KHO-2b — xử lý phát sinh (PS): hỏng · đổ vỡ · hết hạn · dùng nội bộ · khác. Dòng 'phat_sinh' (−lượng, đơn giá = giá vốn để đo hạn mức).
 * Trừ kho lúc DUYỆT theo lô hạn gần trước (FEFO) KỂ CẢ lô quá hạn (khác phiếu xuất: đây là bỏ hàng); chọn đúng lô (hết hạn) thì trừ lô đó.
 * Món pha tại chỗ → trừ nguyên liệu theo công thức. Thành phẩm không đủ lô, hoặc lô đã chọn bị trừ hết giữa lúc tạo và lúc duyệt → 409
 * KHONG_DU_TON, rollback (tồn thành phẩm = Σ lô còn hàng — lô âm sẽ biến khỏi tồn).
 * Dùng nội bộ vượt hạn mức (đồng / người / ngày giờ VN theo giá vốn; thiếu giá = vượt — chủ quán chốt 31.10) → luôn chờ duyệt; còn lại quản lý tự
 * duyệt, nhân viên theo công tắc "nhân viên xuất kho cần duyệt".
 */
const tinh = require('./tinh');
const duLieu = require('./duLieu');

const loi = (http, code, error) => ({ loi: [http, { error, code }] });
const khongDuTon = () => loi(409, 'KHONG_DU_TON', 'Thành phẩm không còn đủ trong kho — tải lại');
const LO_FEFO = 'han_dung IS NULL, han_dung, id';
const loCua = (tx, cot, id) => duLieu.conLaiTheoLo(tx, `l.${cot} = ?`, [id], LO_FEFO);

/** Bước "Món nào?": chỉ thứ liên quan tới chuyện đã chọn. */
async function goiY(csdl, suCo, luc) {
  const ton = await duLieu.docTon(csdl, luc);
  const nl = duLieu.theoId(ton.nguyen_lieu);
  const tenSP = new Map(ton.thanh_pham.map((m) => [m.san_pham_id, m.ten]));
  if (suCo === 'het_han') {
    const lo = await duLieu.conLaiTheoLo(csdl, 'l.han_dung IS NOT NULL AND l.han_dung <= ?', [duLieu.hanLo(luc, tinh.SAP_HET_HAN_NGAY)], 'han_dung, id');
    return { muc: lo.map((l) => {
      const n = nl.get(Number(l.nguyen_lieu_id));
      return { lo_id: Number(l.id), nguyen_lieu_id: n ? n.id : null, san_pham_id: n ? null : Number(l.san_pham_id), ten: n ? n.ten : tenSP.get(Number(l.san_pham_id)),
        don_vi: n ? n.don_vi_hien || n.don_vi_luu : 'phần', he_so_doi: n ? n.he_so_doi : 1, con: Number(l.con), han_dung: l.han_dung };
    }) };
  }
  // thành phẩm xếp chung một tab "Thành phẩm" (nhom_id 'tp' — không lẫn với nhóm nguyên liệu)
  const thanhPham = ton.thanh_pham.filter((m) => m.ton > tinh.SAI_SO).map((m) => ({ san_pham_id: m.san_pham_id, ten: m.ten, nhom_id: 'tp', don_vi: 'phần', he_so_doi: 1, con: m.ton }));
  if (suCo === 'noi_bo') {
    const bang = await duLieu.docBangCongThuc(csdl);
    const pha = await csdl.query(`SELECT p.id, p.name FROM kho_san_pham s JOIN pos_products p ON p.id = s.pos_product_id WHERE s.kieu = 'pha_tai_cho' AND p.is_active = 1
      AND EXISTS (SELECT 1 FROM kho_cong_thuc c WHERE c.san_pham_id = p.id) ORDER BY p.sort_order, p.name`);
    return { muc: [...thanhPham, ...pha.map((p) => ({ san_pham_id: Number(p.id), ten: p.name, don_vi: 'ly', he_so_doi: 1, pha_tai_cho: true,
      mot_phan: tinh.trienKhai({ goc: Number(p.id), bang }, 1).map((d) => { const n = nl.get(d.nguyen_lieu_id) || {};
        return { ...d, ten: n.ten, don_vi: n.don_vi_hien || n.don_vi_luu, he_so_doi: n.he_so_doi }; }) }))] };
  }
  return { muc: [...ton.nguyen_lieu.filter((n) => n.dang_dung).map((n) => ({ nguyen_lieu_id: n.id, ten: n.ten, nhom_id: n.nhom_id, don_vi: n.don_vi_hien || n.don_vi_luu,
    he_so_doi: n.he_so_doi, con: n.ton })), ...thanhPham], nhom: ton.nhom_nguyen_lieu };
}

/** Mục người chọn → dòng phiếu { nguyen_lieu_id | san_pham_id, lo_id, luong, cho_mon_id, don_gia } hoặc { loi }. */
async function lapDong(tx, muc) {
  const bang = await duLieu.docBangCongThuc(tx);
  const dong = [];
  for (const m of muc) {
    if (m.lo_id) {
      const l = (await duLieu.conLaiTheoLo(tx, 'l.id = ?', [m.lo_id]))[0];
      if (!l || m.luong > Number(l.con) + tinh.SAI_SO) return khongDuTon();
      dong.push({ nguyen_lieu_id: l.nguyen_lieu_id, san_pham_id: l.san_pham_id, lo_id: m.lo_id, luong: m.luong, gia_lo: l.gia_von });
    } else if (m.nguyen_lieu_id) {
      dong.push({ nguyen_lieu_id: m.nguyen_lieu_id, luong: m.luong, cho_mon_id: m.cho_mon_id });   // cho_mon_id: sửa phiếu nội bộ giữ "ly gì"
    } else if ((await tx.queryOne('SELECT kieu FROM kho_san_pham WHERE pos_product_id = ?', [m.san_pham_id]))?.kieu === 'pha_tai_cho') {
      const px = tinh.lapPhieuXuat([{ san_pham_id: m.san_pham_id, so_phan: m.luong }], bang);
      if (px.thieu_cong_thuc.length) return loi(400, 'MON_CHUA_CONG_THUC', 'Món chưa có công thức');
      for (const n of px.theo_mon[0].nguyen_lieu) dong.push({ nguyen_lieu_id: n.nguyen_lieu_id, luong: n.luong, cho_mon_id: m.san_pham_id });
    } else {
      // thành phẩm: giá vốn theo các lô FEFO sẽ trừ; không đủ lô → không lập phiếu
      const lo = await loCua(tx, 'san_pham_id', m.san_pham_id);
      const manh = tinh.chiaTheoLo([{ khoa: 0, luong: m.luong }], lo);
      if (manh.some((x) => x.lo_id == null)) return khongDuTon();
      const gia = duLieu.theoId(lo);
      const coGia = manh.every((x) => gia.get(x.lo_id)?.gia_von != null);
      dong.push({ san_pham_id: m.san_pham_id, luong: m.luong, don_gia: coGia ? Math.round(manh.reduce((t, x) => t + x.luong * gia.get(x.lo_id).gia_von, 0) / m.luong) : null });
    }
  }
  const nlIds = [...new Set(dong.filter((d) => d.nguyen_lieu_id != null).map((d) => Number(d.nguyen_lieu_id)))];
  if (await duLieu.demThieu(tx, 'kho_nguyen_lieu', nlIds)) return loi(400, 'KHONG_THAY', 'Nguyên liệu không có');
  const giaNL = duLieu.theoId(nlIds.length ? await tx.query(`SELECT id, gia_nhap FROM kho_nguyen_lieu WHERE id IN (${duLieu.dauHoi(nlIds)})`, nlIds) : []);
  return { dong: dong.map((d) => (d.nguyen_lieu_id != null ? { ...d, don_gia: d.gia_lo ?? giaNL.get(Number(d.nguyen_lieu_id))?.gia_nhap ?? null }
    : d.lo_id ? { ...d, don_gia: d.gia_lo ?? null } : d)) };
}

/** Đã dùng nội bộ trong ngày (giờ VN) của một người — phiếu chờ duyệt / đã duyệt; dòng thiếu giá không cộng (phiếu có nó đã phải chờ duyệt). */
async function daDungNoiBo(tx, nguoi, ngay) {
  const ds = await tx.query(`SELECT d.so_luong, d.don_gia FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id WHERE p.loai = 'PS' AND p.su_co = 'noi_bo'
    AND p.nguoi_tao = ? AND substr(p.tao_luc, 1, 10) = ? AND p.trang_thai IN ('cho_duyet', 'da_duyet') AND d.loai = 'phat_sinh' AND d.don_gia IS NOT NULL`, [nguoi, ngay]);
  return tinh.tongTien(ds.map((d) => ({ so_luong: Number(d.so_luong), don_gia: Number(d.don_gia) })));
}

async function taoPhatSinh(tx, { suCo, muc, ghiChu, nguoi, quanLy, maGui, luc, thayCho = null, lyDo = null, ep = false }) {
  if (!tinh.SU_CO.includes(suCo)) return loi(400, 'SU_CO_SAI', 'Chọn chuyện gì xảy ra');
  if (suCo === 'khac' && !ghiChu) return loi(400, 'THIEU_GHI_CHU', 'Chuyện "khác" cần ghi rõ là chuyện gì');
  // Có lô thì lô quyết định món (màn sửa gửi kèm id nguyên liệu / món của lô) — bỏ hai khoá kia.
  const ds = Array.isArray(muc) ? muc.map((m) => { const lo = Number(m?.lo_id) || null;
    return { lo_id: lo, nguyen_lieu_id: lo ? null : Number(m?.nguyen_lieu_id) || null, san_pham_id: lo ? null : Number(m?.san_pham_id) || null, luong: Number(m?.luong),
      cho_mon_id: Number(m?.cho_mon_id) || null }; }) : [];
  if (!ds.length || ds.some((m) => [m.lo_id, m.nguyen_lieu_id, m.san_pham_id].filter((x) => x > 0).length !== 1 || !(m.luong > 0) || !Number.isFinite(m.luong))) {
    return loi(400, 'DONG_SAI', 'Chọn món và số lượng lớn hơn 0');
  }
  if (await duLieu.demThieu(tx, 'pos_products', ds.filter((m) => m.san_pham_id).map((m) => m.san_pham_id))) return loi(400, 'KHONG_THAY', 'Món không có');
  const r = await lapDong(tx, ds);
  if (r.loi) return r;
  const tong = tinh.tongTien(r.dong.map((d) => ({ so_luong: d.luong, don_gia: d.don_gia })));
  const vuot = suCo === 'noi_bo' && !tinh.trongHanMuc(tong == null ? null : tong + await daDungNoiBo(tx, nguoi, luc.slice(0, 10)),
    await duLieu.docHanMuc(tx, duLieu.KHOA_HAN_MUC_NOI_BO));
  const tuDuyet = ep || (!vuot && (quanLy || !(await duLieu.nvCanDuyet(tx))));
  const id = await duLieu.themPhieu(tx, { loai: 'PS', tuDuyet, nguoi, luc, ghiChu, suCo, thayCho, lyDo, maGui });
  for (const d of r.dong) {
    await tx.run(`INSERT INTO kho_phieu_dong (phieu_id, nguyen_lieu_id, san_pham_id, lo_id, so_luong, don_gia, loai, cho_mon_id, nguoi, luc)
      VALUES (?, ?, ?, ?, ?, ?, 'phat_sinh', ?, ?, ?)`, [id, d.nguyen_lieu_id ?? null, d.san_pham_id ?? null, d.lo_id ?? null, -d.luong, d.don_gia, d.cho_mon_id ?? null, nguoi, luc]);
  }
  if (tuDuyet) {
    const g = await ghiKhoPhatSinh(tx, id);
    if (g.loi) return g;
  }
  return { id };
}

/** Phiếu VỪA chuyển da_duyet: dòng chưa có lô → chia theo lô FEFO (dòng nhận mảnh đầu, mảnh sau thêm dòng). Thành phẩm thiếu lô → { loi }. */
async function ghiKhoPhatSinh(tx, id) {
  // Lô chọn sẵn (hết hạn): phiếu này đã da_duyet nên dòng của nó đã tính — lô nào thành âm là đã bị phiếu khác trừ trước
  if (await tx.queryOne(`SELECT 1 AS am FROM kho_lo l WHERE l.id IN (SELECT lo_id FROM kho_phieu_dong WHERE phieu_id = ? AND lo_id IS NOT NULL) AND (SELECT COALESCE(SUM(d.so_luong), 0)
    FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id WHERE d.lo_id = l.id AND ${duLieu.DA_DUYET}) < -${tinh.SAI_SO} LIMIT 1`, [id])) {
    return khongDuTon();
  }
  const nhom = new Map();
  for (const d of await tx.query("SELECT * FROM kho_phieu_dong WHERE phieu_id = ? AND loai = 'phat_sinh' AND lo_id IS NULL ORDER BY id", [id])) {
    const khoa = d.nguyen_lieu_id != null ? `nguyen_lieu_id:${d.nguyen_lieu_id}` : `san_pham_id:${d.san_pham_id}`;
    nhom.set(khoa, [...(nhom.get(khoa) || []), d]);
  }
  for (const [khoa, ds] of nhom) {
    const [cot, ma] = khoa.split(':');
    const daGan = new Set();
    for (const m of tinh.chiaTheoLo(ds.map((x) => ({ khoa: x, luong: -Number(x.so_luong) })), await loCua(tx, cot, Number(ma)))) {
      if (m.lo_id == null && cot === 'san_pham_id') return khongDuTon();
      const x = m.khoa;
      if (!daGan.has(x.id)) {
        daGan.add(x.id);
        await tx.run('UPDATE kho_phieu_dong SET lo_id = ?, so_luong = ? WHERE id = ?', [m.lo_id, -m.luong, x.id]);
      } else {
        await tx.run(`INSERT INTO kho_phieu_dong (phieu_id, ${cot}, lo_id, so_luong, don_gia, loai, cho_mon_id, nguoi, luc) VALUES (?, ?, ?, ?, ?, 'phat_sinh', ?, ?, ?)`,
          [id, Number(ma), m.lo_id, -m.luong, x.don_gia, x.cho_mon_id, x.nguoi, x.luc]);
      }
    }
  }
  return {};
}

module.exports = { goiY, taoPhatSinh, ghiKhoPhatSinh };
