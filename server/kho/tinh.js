/**
 * KHO-1 — phép tính THUẦN của mục kho: không đọc CSDL, không đọc giờ. KHO-2a: định mức, phiếu xuất, chia lô, kết quả, hạn. Dùng lại ở KHO-3.
 */

const KIEU_SAN_PHAM = ['pha_tai_cho', 'lam_san', 'chua_dinh_luong'];

/** Tên gọn: NFC, cắt đầu / cuối, gộp khoảng trắng — giữ hoa / thường. */
function gonTen(ten) {
  return String(ten ?? '').normalize('NFC').trim().replace(/\s+/g, ' ');
}

/** Khoá so tên: gonTen + chữ thường — GIỮ dấu ("Táo tươi" ≠ "Táo đỏ"). */
function chuanHoaTen(ten) {
  return gonTen(ten).toLocaleLowerCase('vi');
}

/** Tên để hiện: như chuanHoaTen rồi viết hoa chữ đầu ("lá  DỨA" → "Lá dứa"). */
function chuanTenHienThi(ten) {
  const t = chuanHoaTen(ten);
  return t.charAt(0).toLocaleUpperCase('vi') + t.slice(1);
}

/** Đổi đơn vị: 1 đơn vị hiện = heSo đơn vị lưu. Mặc định lưu → hiện; veLuu = true thì hiện → lưu. */
function doiDonVi(so, heSo, veLuu = false) {
  return veLuu ? so * heSo : so / heSo;
}

/**
 * Triển khai công thức ra nguyên liệu gốc, cộng dồn. congThuc = { goc: <pos_product_id>, bang: { [spId]: [dòng] } },
 * dòng = { nguyen_lieu_id, luong } hoặc { thanh_phan_id, luong } (lượng cho 1 đơn vị). Trả [{ nguyen_lieu_id, luong }].
 * Gặp vòng (kể cả A→A) → ném lỗi code CONG_THUC_VONG_LAP, `chuoi` = các id từ gốc tới chỗ lặp. Hình kim cương không phải vòng.
 */
function trienKhai(congThuc, soPhan) {
  const tong = new Map();
  const di = (spId, he, duong) => {
    for (const d of congThuc.bang[spId] || []) {
      if (d.nguyen_lieu_id != null) {
        tong.set(d.nguyen_lieu_id, (tong.get(d.nguyen_lieu_id) || 0) + he * d.luong);
      } else if (duong.includes(d.thanh_phan_id)) {
        const loi = new Error('Công thức vòng lặp');
        loi.code = 'CONG_THUC_VONG_LAP';
        loi.chuoi = [...duong, d.thanh_phan_id];
        throw loi;
      } else {
        di(d.thanh_phan_id, he * d.luong, [...duong, d.thanh_phan_id]);
      }
    }
  };
  di(congThuc.goc, soPhan, [congThuc.goc]);
  return [...tong].map(([nguyen_lieu_id, luong]) => ({ nguyen_lieu_id, luong }));
}

// ── KHO-2a: pha chế · phiếu xuất · kết quả · tồn ──
const SAP_HET_HAN_NGAY = 1;   // còn ≤ 1 ngày → đỏ "sắp hết hạn" (chủ quán chốt 29.10)
const HAN_NGAY_TOI_DA = 3650;   // hạn dùng thành phẩm tối đa 10 năm — số lớn hơn làm phép cộng ngày theo lịch ném lỗi (Date ngoài tầm)
const SAI_SO = 1e-9;
const KHOA_GIA = ['gia_nhap', 'don_gia', 'gia_von', 'tong_uoc_tinh'];   // KHO-2b: mọi khoá tiền trả ra phải ở đây

/** Thứ trong tuần (0 = chủ nhật) của 'YYYY-MM-DD' theo LỊCH — không dính múi giờ máy (Render chạy UTC). */
function thuCuaNgay(ngay) {
  const [nam, thang, ngayThang] = String(ngay).slice(0, 10).split('-').map(Number);
  const y = thang < 3 ? nam - 1 : nam;
  return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4][thang - 1] + ngayThang) % 7;
}

/** Định mức của một món cho thứ `thu`: dòng đúng thứ, không có thì dòng "mọi ngày" (thu NULL), không có nữa → 0. */
function chonDinhMuc(dong, thu) {
  const d = dong.find((x) => x.thu != null && Number(x.thu) === thu) || dong.find((x) => x.thu == null);
  return d ? Number(d.so_luong) : 0;
}

const canLam = (dinhMuc, dangCo) => Math.max(0, dinhMuc - dangCo);

/** Số ngày hạn dùng: chữ số thập phân nguyên, 1 … HAN_NGAY_TOI_DA, còn lại null (true, '0x10', 1.5, 0 đều null). MỘT vị từ cho PUT /san-pham, nhập SX, hanLo. */
const soNgayNguyen = (x) => (/^\d+$/.test(String(x ?? '').trim()) && Number(x) >= 1 && Number(x) <= HAN_NGAY_TOI_DA ? Number(x) : null);

/** mon = [{ san_pham_id, so_phan }] → { theo_mon: [{ san_pham_id, so_phan, nguyen_lieu }], thieu_cong_thuc: [id] }. MỘT hàm cho tạo và sửa phiếu. */
function lapPhieuXuat(mon, bang) {
  const thieu_cong_thuc = mon.filter((m) => !(bang[m.san_pham_id] || []).length).map((m) => m.san_pham_id);
  const theo_mon = thieu_cong_thuc.length ? [] : mon.map((m) => ({ ...m, nguyen_lieu: trienKhai({ goc: m.san_pham_id, bang }, m.so_phan) }));
  return { theo_mon, thieu_cong_thuc };
}

/** Chia lượng cần (mỗi dòng { khoa, luong }) vào các lô đã xếp hạn gần nhất trước ([{ id, con }]). Hết lô → phần thiếu lo_id null (tồn âm, không chặn). */
function chiaTheoLo(can, lo) {
  const con = lo.map((l) => ({ id: l.id, con: Number(l.con) }));
  const manh = [];
  let i = 0;
  for (const c of can) {
    let thieu = c.luong;
    while (thieu > SAI_SO && i < con.length) {
      const lay = Math.min(thieu, con[i].con);
      manh.push({ khoa: c.khoa, lo_id: con[i].id, luong: lay });
      con[i].con -= lay;
      thieu -= lay;
      if (con[i].con <= SAI_SO) i++;
    }
    if (thieu > SAI_SO) manh.push({ khoa: c.khoa, lo_id: null, luong: thieu });
  }
  return manh;
}

/** Số phiếu kế tiếp trong ngày: PX-YYMMDD-NNN. soCuoi = số phiếu cuối cùng của ngày đó (hoặc null). */
function soPhieuKe(loai, ngay, soCuoi) {
  const n = soCuoi ? Number(String(soCuoi).split('-').pop()) + 1 : 1;
  return `${loai}-${ngay.slice(2, 4)}${ngay.slice(5, 7)}${ngay.slice(8, 10)}-${String(n).padStart(3, '0')}`;
}

const lechQuaNguong = (chuan, thuc, lechChoPhep) => lechChoPhep != null && chuan > 0 && (Math.abs(thuc - chuan) / chuan) * 100 > Number(lechChoPhep) + SAI_SO;

/** Kết quả pha chế: đủ kết quả (hoặc phiếu sửa của chủ quán — số đã chốt) → da_dien; qua ngày làm (giờ VN) → tu_chot; còn lại cho_dien. */
function trangThaiKetQua(ngayLam, homNay, duKetQua, laPhieuSua) {
  if (duKetQua || laPhieuSua) return 'da_dien';
  return homNay > ngayLam ? 'tu_chot' : 'cho_dien';
}

/** Hạn lô so với bây giờ và mốc "bây giờ + SAP_HET_HAN_NGAY" (chuỗi getNow so được theo thứ tự chữ). */
function trangThaiHan(han, bayGio, mocSapHet) {
  if (!han) return null;
  return han <= bayGio ? 'qua_han' : han <= mocSapHet ? 'sap_het' : 'con';
}

/**
 * Dòng phiếu (đọc từ sổ — in lại sau khi sửa công thức vẫn đúng số) → bảng tổng + bảng theo món. nl: Map id → nguyên liệu; ten: Map spId → tên.
 * Lượng trả dương, theo đơn vị lưu; luong_hien theo đơn vị hiện.
 */
function bangPhieu(dong, nl, ten) {
  const hien = (id, luong) => {
    const n = nl.get(id) || {};
    return { nguyen_lieu_id: id, ten: n.ten, don_vi: n.don_vi_hien || n.don_vi_luu, luong, luong_hien: doiDonVi(luong, n.he_so_doi || 1) };
  };
  const gop = (ds) => {
    const m = new Map();
    for (const d of ds) {
      const id = Number(d.nguyen_lieu_id);
      const g = m.get(id) || { luong: 0, don_gia: d.don_gia };
      g.luong += -d.so_luong;
      m.set(id, g);
    }
    return [...m].map(([id, g]) => ({ ...hien(id, g.luong), don_gia: g.don_gia }));
  };
  const xuat = dong.filter((d) => d.loai === 'xuat');
  return {
    tong: gop(xuat),
    theo_mon: dong.filter((d) => d.loai === 'thanh_pham').map((d) => {
      const spId = Number(d.san_pham_id);
      const soPhan = Number(d.so_luong);
      return { san_pham_id: spId, ten: ten.get(spId), so_phan: soPhan, lo_id: d.lo_id == null ? null : Number(d.lo_id),
        nguyen_lieu: gop(xuat.filter((x) => Number(x.cho_mon_id) === spId)).map((n) => ({ ...n, mot_phan_hien: n.luong_hien / soPhan })) };
    }),
  };
}

/** Bỏ mọi khoá giá (giá nhập, đơn giá, giá vốn) ở mọi tầng — phản hồi cho người không được thấy giá. */
function boGia(x) {
  if (Array.isArray(x)) return x.map(boGia);
  if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).filter(([khoa]) => !KHOA_GIA.includes(khoa)).map(([khoa, v]) => [khoa, boGia(v)]));
  return x;
}

// ── KHO-2b: đặt hàng · nhận hàng · phát sinh ──
const HAN_MUC_DAT_HANG_MAC_DINH = 500000;   // quản lý tự duyệt đơn đặt hàng tới mức này (chủ quán chốt 26.10)
const HAN_MUC_NOI_BO_MAC_DINH = 50000;   // dùng nội bộ / người / ngày theo giá vốn (chủ quán chốt 31.10)
const SU_CO = ['hong', 'do_vo', 'het_han', 'noi_bo', 'khac'];
const HAY_MUA_SO = 8;   // tab "Sắp hết & hay mua": số nguyên liệu nhận nhiều nhất …
const HAY_MUA_NGAY = 30;   // … trong ngần này ngày

/** Hạn mức từ Cài đặt: không có dòng → mặc định; số nguyên ≥ 0 → số đó; giá trị lạ (khôi phục không qua kiểm) → 0 = chặt nhất. */
const hanMuc = (giaTri, macDinh) => (giaTri == null ? macDinh : /^\d+$/.test(String(giaTri).trim()) ? Number(giaTri) : 0);

/** Tổng tiền dòng [{ so_luong, don_gia }] = Σ |lượng| × giá, làm tròn đồng; một dòng thiếu giá → null. */
const tongTien = (dong) => (dong.every((d) => d.don_gia != null) ? Math.round(dong.reduce((t, d) => t + Math.abs(d.so_luong) * d.don_gia, 0)) : null);

/** MỘT vị từ cho tạo và duyệt: tổng không tính được = coi như vượt. */
const trongHanMuc = (tong, muc) => tong != null && tong <= muc;

/** Gộp lượng theo nguyên liệu, giữ thứ tự gặp đầu: [{ nguyen_lieu_id, luong }] → cùng dạng, mỗi nguyên liệu một dòng. */
function gopLuong(ds) {
  const m = new Map();
  for (const d of ds) m.set(d.nguyen_lieu_id, (m.get(d.nguyen_lieu_id) || 0) + d.luong);
  return [...m].map(([nguyen_lieu_id, luong]) => ({ nguyen_lieu_id, luong }));
}

/** Phần còn lại của đơn: dòng đặt [{ nguyen_lieu_id, so_luong }] trừ dòng đã nhận (cùng dạng). Trả mỗi dòng đặt + cờ đơn đã đủ. */
function conLaiDon(dat, nhan) {
  const daNhan = new Map(gopLuong(nhan.map((d) => ({ nguyen_lieu_id: Number(d.nguyen_lieu_id), luong: Number(d.so_luong) }))).map((d) => [d.nguyen_lieu_id, d.luong]));
  const con_lai = gopLuong(dat.map((d) => ({ nguyen_lieu_id: Number(d.nguyen_lieu_id), luong: Number(d.so_luong) })))
    .map((d) => ({ nguyen_lieu_id: d.nguyen_lieu_id, dat: d.luong, da_nhan: daNhan.get(d.nguyen_lieu_id) || 0, con_lai: Math.max(0, d.luong - (daNhan.get(d.nguyen_lieu_id) || 0)) }));
  return { con_lai, du: con_lai.every((d) => d.con_lai <= SAI_SO) };
}

/** Hạn gõ tay: 'YYYY-MM-DD' → cuối ngày đó; 'YYYY-MM-DDTHH:mm:ss' giữ; trống → null; sai dạng → undefined (đường trả 400). */
function chuanHan(x) {
  const s = String(x ?? '').trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s + 'T23:59:59';
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(s) ? s : undefined;
}

/** Lỗi do đụng khoá duy nhất / khoá chính (tên trùng, bước nâng cấp đã chạy). */
function laTrungKhoa(loi) {
  return /SQLITE_CONSTRAINT_(UNIQUE|PRIMARYKEY)/.test(String(loi && loi.code)) || /UNIQUE constraint|PRIMARY KEY/i.test(String(loi && loi.message));
}

module.exports = { KIEU_SAN_PHAM, SAP_HET_HAN_NGAY, HAN_NGAY_TOI_DA, gonTen, chuanHoaTen, chuanTenHienThi, doiDonVi, trienKhai, laTrungKhoa, thuCuaNgay, chonDinhMuc,
  canLam, soNgayNguyen, lapPhieuXuat, chiaTheoLo, soPhieuKe, lechQuaNguong, trangThaiKetQua, trangThaiHan, bangPhieu, boGia,
  HAN_MUC_DAT_HANG_MAC_DINH, HAN_MUC_NOI_BO_MAC_DINH, SU_CO, HAY_MUA_SO, HAY_MUA_NGAY, SAI_SO, hanMuc, tongTien, trongHanMuc, gopLuong, conLaiDon, chuanHan };
