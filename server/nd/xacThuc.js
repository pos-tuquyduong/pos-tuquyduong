/**
 * ND-API-1 — đăng nhập riêng của /api/nd (nghiệm thu G) + kiểm quyền MỖI lần gọi (F) + khoá sao lưu chỉ đọc (J).
 * Vé ký bằng khoá DẪN từ khoá vé POS (tinh.khoaVe, Q-E) + aud 'nd' → vé nd không dùng được ở /api/pos và ngược lại.
 * Sai đăng nhập: không có tên / sai mật khẩu / tài khoản khoá → MỘT câu chung (không lộ tên có tồn tại). Đếm sai (Q-A chủ quán 13.11):
 * theo CẶP (tên + IP) và theo IP, giữ chỗ lượt TRƯỚC khi so mật khẩu; KHÔNG khoá một tên trên mọi máy (người lạ gõ sai tên chủ quán
 * từ xa không làm chủ quán bị khoá). Đăng nhập đúng → đặt lại bộ đếm của cặp đó và của IP đó.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cauNoi = require('./cauNoi');
const D = require('./duLieu');
const T = require('./tinh');

const BAM_GIA = bcrypt.hashSync('nd-khong-co-nguoi-nay', 10);   // so với người không có → thời gian trả lời như người có thật
const khoa = () => T.khoaVe(cauNoi.khoaVePos());
const guiLoi = (res, code, chu) => res.status(T.LOI[code][0]).json({ error: chu || T.LOI[code][1], code });

async function dangNhap(ten, matKhau, ip) {
  const lo = ['ip:' + ip, `cap:${ten}|${ip}`];
  for (const k of lo) if (!(await D.giuLuot(k))) return { loi: 'QUA_NHIEU_LAN' };
  const u = await cauNoi.timNguoiDung(ten);
  const bamThat = String(u?.password || '');
  const dung = await bcrypt.compare(matKhau, bamThat.startsWith('$2') ? bamThat : BAM_GIA);
  if (!u || !dung || !Number(u.is_active)) return { loi: 'SAI_DANG_NHAP' };
  await D.datLaiLuot(lo);
  const quyen = [];
  for (const q of T.QUYEN) if (await cauNoi.coQuyen(u.role, q)) quyen.push(q);
  return {
    ve: jwt.sign({ nd: u.id }, khoa(), { audience: 'nd', expiresIn: T.GIOI_HAN.ve_gio * 3600 }),
    het_han: await D.gioSau(T.GIOI_HAN.ve_gio),
    quyen,
    nguoi: { ten_dang_nhap: u.username, ten_hien: u.display_name || u.username },
  };
}

/** Cửa cần quyền `quyen`. Vé nd: đọc lại người dùng + quyền từ POS mỗi lần. Khoá sao lưu (`ndk_…`): chỉ cửa có choKhoa (GET /xuat). */
const canQuyen = (quyen, choKhoa = false) => async (req, res, next) => {
  try {
    const h = String(req.headers.authorization || '');
    const ve = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
    if (ve.startsWith('ndk_')) {
      if (!choKhoa) return guiLoi(res, 'KHONG_DU_QUYEN');
      const k = await D.khoaConHieuLuc(T.bam(ve));
      if (!k) return guiLoi(res, 'CHUA_DANG_NHAP');
      req.ndNguoi = 'khoa:' + k.ten;
      return next();
    }
    let id;
    try { id = jwt.verify(ve, khoa(), { audience: 'nd' }).nd; } catch { return guiLoi(res, 'CHUA_DANG_NHAP'); }
    const u = await cauNoi.docNguoiDung(id);
    if (!u || !Number(u.is_active)) return guiLoi(res, 'CHUA_DANG_NHAP');
    if (!(await cauNoi.coQuyen(u.role, quyen))) return guiLoi(res, 'KHONG_DU_QUYEN');
    req.ndNguoi = u.username;
    return next();
  } catch (e) {
    return next(e);
  }
};

module.exports = { dangNhap, canQuyen, guiLoi };
