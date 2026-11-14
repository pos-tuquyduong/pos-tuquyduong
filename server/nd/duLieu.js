/**
 * ND-API-1 — mọi câu đọc / ghi bảng nd_* (bước nâng cấp 027). Không chạm bảng nào khác.
 * Đường ghi bản (cập nhật, quay lại, nhập toàn bộ) chạy trong MỘT giao dịch ghi: đọc bản đang chạy TRONG giao dịch rồi mới so ban_goc —
 * hai người bấm cùng lúc thì người sau thấy bản mới → 409 CO_BAN_MOI_HON. Chỉ mục nd_ban_mot_dang_chay giữ "đúng MỘT bản đang chạy".
 * Q-C: câu đọc nặng chỉ lấy MỘT dòng (xuất đọc từng bản, từng ảnh; danh sách phiên bản không kèm gia_tri).
 */
const crypto = require('crypto');
const { query, queryOne, run, beginTransaction } = require('../database');
const { getNow } = require('../utils/helpers');
const T = require('./tinh');

const GIO = "strftime('%Y-%m-%dT%H:%M:%S', ?, ?)";   // (bây giờ getNow, '+15 minutes') → cùng dạng getNow()
const so = (x) => (x == null ? null : Number(x));
const banRa = (r, coGiaTri = true) => ({ so_ban: Number(r.so_ban), ...(coGiaTri ? { gia_tri: JSON.parse(r.gia_tri) } : {}), ghi_chu: r.ghi_chu ?? null,
  tom_tat: r.tom_tat ?? null, nguoi: r.nguoi ?? null, luc: r.luc, tu_ban: so(r.tu_ban), dang_chay: Number(r.dang_chay) });
const nhapRa = (r) => ({ khoa: r.khoa, gia_tri: JSON.parse(r.gia_tri), nguoi: r.nguoi ?? null, luc: r.luc, ban_goc: Number(r.ban_goc) });

/** Chạy fn(tx) trong một giao dịch ghi; fn trả { loi } → huỷ, không ghi gì. */
async function trongGd(fn) {
  const tx = await beginTransaction();
  try {
    const kq = await fn(tx);
    if (kq && kq.loi) await tx.rollback(); else await tx.commit();
    return kq;
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}
const ghiNhatKy = (q, nguoi, viec, soBan = null, soKhoa = null) => q.run('INSERT INTO nd_nhat_ky (nguoi, luc, viec, so_ban, so_khoa) VALUES (?, ?, ?, ?, ?)',
  [nguoi, getNow(), viec, soBan, soKhoa]);
const banDangChay = async (q = { queryOne }) => {
  const r = await q.queryOne('SELECT * FROM nd_ban WHERE dang_chay = 1');
  return r ? banRa(r) : { so_ban: 0, gia_tri: {} };
};
const soBanDangChay = async () => Number((await queryOne('SELECT so_ban FROM nd_ban WHERE dang_chay = 1'))?.so_ban || 0);
const dsNhap = async (q = { query }) => (await q.query('SELECT * FROM nd_nhap ORDER BY khoa')).map(nhapRa);

/** Lưu nháp MỘT khoá (ghi đè nháp cũ của khoá đó). Bản đang chạy + mọi nháp (đã thay khoá này) > 1 MB → QUA_LON, không ghi. */
const luuNhap = (nguoi, khoa, giaTri, banGoc) => trongGd(async (tx) => {
  const gop = (await banDangChay(tx)).gia_tri;
  for (const n of await dsNhap(tx)) gop[n.khoa] = n.gia_tri;
  gop[khoa] = giaTri;
  if (T.soByte(gop) > T.GIOI_HAN.ban_toi_da_byte) return { loi: 'QUA_LON' };
  const luc = getNow();
  await tx.run(`INSERT INTO nd_nhap (khoa, gia_tri, nguoi, luc, ban_goc) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, nguoi = excluded.nguoi, luc = excluded.luc, ban_goc = excluded.ban_goc`,
  [khoa, JSON.stringify(giaTri), nguoi, luc, banGoc]);
  await ghiNhatKy(tx, nguoi, 'luu', banGoc, 1);
  return { khoa, luc };
});

const xoaNhap = (nguoi, khoa) => trongGd(async (tx) => {
  if ((await tx.run('DELETE FROM nd_nhap WHERE khoa = ?', [khoa])).changes !== 1) return { loi: 'KHONG_TIM_THAY' };
  await ghiNhatKy(tx, nguoi, 'bo_nhap', null, 1);
  return { khoa };
});

/** Thay bản đang chạy bằng bản MỚI (số = cũ + 1) — MỘT hàm cho cập nhật, quay lại. Gọi trong giao dịch, sau khi đã so ban_goc. */
async function doiBan(tx, cu, giaTri, { nguoi, ghiChu, tomTat, tuBan, viec, soKhoa }) {
  if (T.soByte(giaTri) > T.GIOI_HAN.ban_toi_da_byte) return { loi: 'QUA_LON' };
  const moi = cu.so_ban + 1;
  if (cu.so_ban) await tx.run('UPDATE nd_ban SET dang_chay = 0 WHERE so_ban = ?', [cu.so_ban]);
  await tx.run('INSERT INTO nd_ban (so_ban, gia_tri, ghi_chu, tom_tat, nguoi, luc, tu_ban, dang_chay) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
    [moi, JSON.stringify(giaTri), ghiChu ?? null, tomTat, nguoi, getNow(), tuBan]);
  await ghiNhatKy(tx, nguoi, viec, moi, soKhoa);
  return { so_ban: moi, tu_ban: tuBan };
}

/** Cập nhật toàn bộ: bản mới = bản đang chạy + mọi nháp; xoá nháp; ban_goc ≠ bản đang chạy → CO_BAN_MOI_HON (không ghi gì). */
const capNhat = (nguoi, banGoc, ghiChu) => trongGd(async (tx) => {
  const cu = await banDangChay(tx);
  if (cu.so_ban !== banGoc) return { loi: 'CO_BAN_MOI_HON' };
  const nhap = await dsNhap(tx);
  if (!nhap.length) return { loi: 'KHONG_CO_NHAP' };
  const kq = await doiBan(tx, cu, { ...cu.gia_tri, ...Object.fromEntries(nhap.map((n) => [n.khoa, n.gia_tri])) },
    { nguoi, ghiChu, tomTat: T.tomTat(nhap.map((n) => n.khoa)), tuBan: null, viec: 'cap_nhat', soKhoa: nhap.length });
  if (!kq.loi) await tx.run('DELETE FROM nd_nhap');
  return { ...kq, so_khoa: nhap.length };
});

/** Quay lại bản `soCu`: tạo bản MỚI cùng nội dung (tu_ban = soCu), không xoá gì; nháp giữ nguyên. */
const quayLai = (nguoi, soCu, banGoc, ghiChu) => trongGd(async (tx) => {
  const cu = await banDangChay(tx);
  if (cu.so_ban !== banGoc) return { loi: 'CO_BAN_MOI_HON' };
  const dich = await tx.queryOne('SELECT gia_tri FROM nd_ban WHERE so_ban = ?', [soCu]);
  if (!dich) return { loi: 'KHONG_TIM_THAY' };
  const giaTri = JSON.parse(dich.gia_tri);
  return doiBan(tx, cu, giaTri, { nguoi, ghiChu, tomTat: `Quay lại bản ${soCu}`, tuBan: soCu, viec: 'quay_lai', soKhoa: Object.keys(giaTri).length });
});

const dsBan = async () => (await query('SELECT so_ban, ghi_chu, tom_tat, nguoi, luc, tu_ban, dang_chay FROM nd_ban ORDER BY so_ban DESC')).map((r) => banRa(r, false));
const motBan = async (soBan) => { const r = await queryOne('SELECT * FROM nd_ban WHERE so_ban = ?', [soBan]); return r ? banRa(r) : null; };

/** Ảnh: mã = SHA-256 nội dung; trùng mã → giữ ảnh cũ (moi: false). Dữ liệu ảnh nằm ngay trong bảng (không đường dẫn tệp). */
async function luuAnh(buf, loai) {
  const ma = T.bam(buf);
  const r = await run('INSERT OR IGNORE INTO nd_anh (ma, loai, kich_thuoc, du_lieu, luc) VALUES (?, ?, ?, ?, ?)', [ma, loai, buf.length, buf, getNow()]);
  return { ma, url: '/api/nd/anh/' + ma, loai, kich_thuoc: buf.length, moi: r.changes === 1 };
}
async function docAnh(ma) {
  const r = await queryOne('SELECT loai, du_lieu FROM nd_anh WHERE ma = ?', [ma]);
  return r ? { loai: r.loai, buf: Buffer.from(r.du_lieu) } : null;
}

/** Tệp Xuất toàn bộ (dinh_dang 1): mọi bản + nháp + ảnh (base64) + nhật ký. Không xuất khoá sao lưu, bộ đếm đăng nhập sai. */
async function xuat() {
  const ban = [];
  for (const { so_ban: s } of await query('SELECT so_ban FROM nd_ban ORDER BY so_ban')) ban.push(await motBan(Number(s)));
  const anh = [];
  for (const { ma } of await query('SELECT ma FROM nd_anh ORDER BY ma')) {
    const r = await queryOne('SELECT ma, loai, kich_thuoc, du_lieu, luc FROM nd_anh WHERE ma = ?', [ma]);
    anh.push({ ma: r.ma, loai: r.loai, kich_thuoc: Number(r.kich_thuoc), luc: r.luc, du_lieu_base64: Buffer.from(r.du_lieu).toString('base64') });
  }
  const nhatKy = (await query('SELECT nguoi, luc, viec, so_ban, so_khoa FROM nd_nhat_ky ORDER BY id'))
    .map((r) => ({ nguoi: r.nguoi ?? null, luc: r.luc, viec: r.viec, so_ban: so(r.so_ban), so_khoa: so(r.so_khoa) }));
  return { dinh_dang: 1, xuat_luc: getNow(), ban, nhap: await dsNhap(), anh, nhat_ky: nhatKy };
}

/** Nhập toàn bộ CHỈ vào kho TRỐNG (không bản, không nháp, không ảnh — đếm TRONG giao dịch); có dữ liệu → KHO_DA_CO_DU_LIEU, không xoá gì.
 *  Nhật ký của tệp nối tiếp nhật ký đang có (vd dòng "xuat" ghi lúc kho còn trống). `du` đã qua tinh.kiemTepNhap. */
const nhapToanBo = (nguoi, du) => trongGd(async (tx) => {
  const dem = await tx.queryOne('SELECT (SELECT COUNT(*) FROM nd_ban) + (SELECT COUNT(*) FROM nd_nhap) + (SELECT COUNT(*) FROM nd_anh) AS n');
  if (Number(dem.n) > 0) return { loi: 'KHO_DA_CO_DU_LIEU' };
  for (const b of du.ban) {
    await tx.run('INSERT INTO nd_ban (so_ban, gia_tri, ghi_chu, tom_tat, nguoi, luc, tu_ban, dang_chay) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [b.so_ban, JSON.stringify(b.gia_tri), b.ghi_chu ?? null, b.tom_tat ?? null, b.nguoi ?? null, b.luc, b.tu_ban ?? null, b.dang_chay]);
  }
  for (const n of du.nhap) {
    await tx.run('INSERT INTO nd_nhap (khoa, gia_tri, nguoi, luc, ban_goc) VALUES (?, ?, ?, ?, ?)', [n.khoa, JSON.stringify(n.gia_tri), n.nguoi ?? null, n.luc, n.ban_goc]);
  }
  for (const a of du.anh) {
    await tx.run('INSERT INTO nd_anh (ma, loai, kich_thuoc, du_lieu, luc) VALUES (?, ?, ?, ?, ?)', [a.ma, a.loai, a.buf.length, a.buf, a.luc]);
  }
  for (const n of du.nhat_ky) {
    await tx.run('INSERT INTO nd_nhat_ky (nguoi, luc, viec, so_ban, so_khoa) VALUES (?, ?, ?, ?, ?)', [n.nguoi ?? null, n.luc, n.viec, n.so_ban ?? null, n.so_khoa ?? null]);
  }
  const dang = du.ban.find((b) => b.dang_chay === 1);
  await ghiNhatKy(tx, nguoi, 'nhap', dang ? dang.so_ban : 0, du.nhap.length);
  return { so_ban: du.ban.length, so_nhap: du.nhap.length, so_anh: du.anh.length, so_nhat_ky: du.nhat_ky.length };
});

// ── Khoá sao lưu chỉ đọc (nghiệm thu J): máy chủ chỉ giữ BĂM SHA-256 của khoá ──
const dsKhoa = () => query('SELECT id, ten, tao_luc, tao_boi, thu_hoi_luc FROM nd_khoa_sao_luu ORDER BY id DESC');
async function taoKhoa(ten, nguoi) {
  const khoa = 'ndk_' + crypto.randomBytes(32).toString('base64url');
  const r = await run('INSERT INTO nd_khoa_sao_luu (ten, ma_bam, tao_luc, tao_boi) VALUES (?, ?, ?, ?)', [ten, T.bam(khoa), getNow(), nguoi]);
  return { id: Number(r.lastInsertRowid), khoa };
}
const thuHoiKhoa = async (id) => (await run('UPDATE nd_khoa_sao_luu SET thu_hoi_luc = ? WHERE id = ? AND thu_hoi_luc IS NULL', [getNow(), id])).changes === 1;
const khoaConHieuLuc = (maBam) => queryOne('SELECT id, ten FROM nd_khoa_sao_luu WHERE ma_bam = ? AND thu_hoi_luc IS NULL', [maBam]);

// ── Đếm đăng nhập sai (Q-A) — khuôn utils/pinChuQuan: MỘT câu giữ chỗ lượt TRƯỚC khi so mật khẩu; đang khoá → changes 0 ──
async function giuLuot(khoa) {
  const now = getNow();
  const dem = 'CASE WHEN khoa_den IS NULL THEN sai + 1 ELSE 1 END';
  const r = await run(`INSERT INTO nd_lan_sai (khoa, sai, khoa_den) VALUES (?, 1, NULL)
    ON CONFLICT(khoa) DO UPDATE SET sai = ${dem}, khoa_den = CASE WHEN ${dem} >= ? THEN ${GIO} ELSE NULL END
    WHERE khoa_den IS NULL OR khoa_den <= ?`, [khoa, T.GIOI_HAN.sai_toi_da, now, `+${T.GIOI_HAN.khoa_phut} minutes`, now]);
  return r.changes === 1;
}
const datLaiLuot = (cacKhoa) => run(`DELETE FROM nd_lan_sai WHERE khoa IN (${cacKhoa.map(() => '?').join(', ')})`, cacKhoa);
const gioSau = async (gio) => (await queryOne(`SELECT ${GIO} AS t`, [getNow(), `+${gio} hours`])).t;

const ghiXuat = async (nguoi) => ghiNhatKy({ run }, nguoi, 'xuat', await soBanDangChay(), null);

module.exports = { ghiXuat, banDangChay, soBanDangChay, dsNhap, luuNhap, xoaNhap, capNhat, quayLai, dsBan, motBan, luuAnh, docAnh, xuat, nhapToanBo,
  dsKhoa, taoKhoa, thuHoiKhoa, khoaConHieuLuc, giuLuot, datLaiLuot, gioSau };
