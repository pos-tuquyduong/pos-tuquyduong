/**
 * Màn Bán hàng mới — bố cục chủ quán chốt 22–24.10.2026 (ban_mau_pos/DAC_TA_BAN_HANG_2410.md).
 * BH-2: giá do MÁY CHỦ tính (POST /orders/tinh-thu, gọi lại chỉ khi nội dung tính tiền đổi); thu tiền qua MỘT đường phiên thanh toán
 * (/thanh-toan/phien → chốt | QR payOS) với PIN + giữ tiền; xong sang màn kết thúc in hoá đơn HD-1. Giá hạng ở lưới món chỉ để hiển thị.
 * Chưa làm (việc khác): topping, đổi điểm, giao hàng, combo.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Settings as IconCaiDat, ShoppingCart, ArrowLeft } from 'lucide-react';
import { api, customersV2Api, ordersApi, productsApi, thanhToanApi } from '../../utils/api';
import { getLogo } from '../../utils/logoCache';
import ThanhKhach from './ThanhKhach';
import KhungChonMon from './KhungChonMon';
import ThuTien from './ThuTien';
import ManKetThuc from './ManKetThuc';
import ManPin from './ManPin';
import ManQr from './ManQr';
import { chiaTra, coGia, coSoMayChu, giaHang, hanhDongPhien, khoaTinh, kiemTraThem, phanTramHang, tachTrang, thanPhien, thanTinhThu, tinhGio, xuLyLoiPin } from './tinh';
import { NutThongTin } from '../../components/ThongTinMon';
import './banHang.css';

const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const TEN_NHOM = { juice: 'Nước ép', tea: 'Trà' };          // nhóm lạ hiện đúng mã nhóm
const CHU_KY_FLASH_MS = 60000;                              // như Sales.jsx: làm mới Flash mỗi 60 giây
const DO_TRE_TINH_MS = 250;                                 // gom các lần chạm liên tiếp thành một lần hỏi máy chủ
const NHAN_KIEU = { tudong: 'Tự động', dienthoai: 'Điện thoại', maytinhbang: 'Máy tính bảng' };
const CACH_DON = { tien_mat: 'cash', chuyen_khoan: 'transfer', tai_khoan: 'balance' };   // cách trên màn → payment_method của đơn

function useRongMan() {
  const [rong, setRong] = useState(() => window.innerWidth);
  useEffect(() => {
    const doi = () => setRong(window.innerWidth);
    window.addEventListener('resize', doi);
    window.addEventListener('orientationchange', doi);
    return () => { window.removeEventListener('resize', doi); window.removeEventListener('orientationchange', doi); };
  }, []);
  return rong;
}

export default function BanHangMoi({ kieu, onDoiCaiDat }) {
  const rong = useRongMan();
  const bo = tachTrang(rong, kieu);

  const [sp, setSp] = useState([]);
  const [nhom, setNhom] = useState('all');
  const [gio, setGio] = useState([]);
  const [khach, setKhach] = useState(null);
  const [hang, setHang] = useState(null);
  const [dsHang, setDsHang] = useState([]);
  const [flash, setFlash] = useState(null);
  const [caiDatHoaDon, setCaiDatHoaDon] = useState({});
  const [trang, setTrang] = useState('mon');
  const [khung, setKhung] = useState(null);                 // { sp, dong? }
  const [dungTK, setDungTK] = useState(true);
  const [dungMe, setDungMe] = useState(false);
  const [ma, setMa] = useState('');                          // mã giảm giá đã áp (máy chủ quyết dùng hay không)
  const [maGo, setMaGo] = useState('');
  const [mayChu, setMayChu] = useState(null);               // kết quả tinh-thu + khoá giỏ lúc hỏi
  const [loiTinh, setLoiTinh] = useState('');
  const [lanTinhLai, setLanTinhLai] = useState(0);
  const [dangGui, setDangGui] = useState(false);
  const [hoiPin, setHoiPin] = useState(null);               // { cach, khachDua, i, da, kieu: 'nhap'|'dat', loi }
  const [qr, setQr] = useState(null);                       // phiên payOS đang chờ tiền về
  const [loi, setLoi] = useState('');
  const [xong, setXong] = useState(null);                   // đơn vừa thanh toán
  const [daIn, setDaIn] = useState(false);
  const [moCaiDat, setMoCaiDat] = useState(false);
  const luotKhach = useRef(0);
  const luotTinh = useRef(0);
  const dangGuiRef = useRef(false);                         // chặn bấm đôi ĐỒNG BỘ (state cập nhật muộn một nhịp)
  const anhQr = useRef(null);                               // khách + tiền trừ tài khoản lúc hiện QR (để dựng màn kết thúc)
  const hoanTatRef = useRef(null);
  const maDong = useRef(1);

  const napSanPham = useCallback(async () => {
    try { setSp(await productsApi.list({ with_stock: 'true' })); } catch (e) { setLoi('Không thể tải danh sách sản phẩm: ' + e.message); }
  }, []);
  const napFlash = useCallback(async () => {
    try { const r = await api.get('/flash'); if (r.success) setFlash(r.data); } catch { /* lỗi mạng: coi như không có Flash, không chặn bán */ }
  }, []);

  useEffect(() => {
    napSanPham();
    napFlash();
    api.get('/tiers').then((r) => { if (r.success) setDsHang(r.data.tiers || []); }).catch(() => {});
    getLogo().then((logo) => { if (logo) setCaiDatHoaDon((c) => ({ ...c, store_logo: logo })); }).catch(() => {});
    api.get('/settings').then((r) => { if (r.success && r.data) setCaiDatHoaDon((c) => ({ ...c, ...r.data })); }).catch(() => {});
    const h = setInterval(napFlash, CHU_KY_FLASH_MS);
    return () => clearInterval(h);
  }, [napSanPham, napFlash]);

  const chonKhach = async (c) => {
    const luot = ++luotKhach.current;                      // tra hạng / điểm về muộn của khách trước thì bỏ
    setKhach(c); setLoi(''); setDungTK(true); setDungMe(false); setHang(null);
    api.get(`/loyalty/points/${encodeURIComponent(c.phone)}`)
      .then((r) => { if (luotKhach.current === luot && r.success) setKhach((k) => (k && k.phone === c.phone ? { ...k, points: r.points } : k)); })
      .catch(() => {});                                    // không tra được điểm: dải khách chỉ không hiện điểm
    try {
      const r = await api.get(`/membership/status/${encodeURIComponent(c.phone)}`);
      if (luotKhach.current !== luot) return;
      if (r.success) {
        const dung = r.data.status === 'active' || r.data.status === 'expiring_soon';
        const t = dung ? dsHang.find((x) => x.id === r.data.tier_id) : null;
        setHang({ ...r.data, usable: dung, discount_percent: t?.discount_percent || 0, special_discount_percent: t?.special_discount_percent || 0 });
      }
    } catch { /* không tra được hạng: lưới chỉ không gạch giá; máy chủ vẫn tự tính hạng khi hỏi giá */ }
  };
  const boKhach = () => { luotKhach.current++; setKhach(null); setHang(null); setDungTK(true); setDungMe(false); };

  // ── Giá do máy chủ tính ── chỉ hỏi lại khi khoá (khách + tổng số lượng từng món + mã) đổi; gõ ghi chú không đổi khoá.
  const khoa = useMemo(() => khoaTinh(gio, khach, ma), [gio, khach, ma]);
  useEffect(() => {
    const luot = ++luotTinh.current;                       // câu trả về muộn của giỏ cũ bị bỏ
    if (!gio.length) { setMayChu(null); setLoiTinh(''); return undefined; }
    const h = setTimeout(async () => {
      try {
        const r = await ordersApi.tinhThu(thanTinhThu(gio, khach, ma));
        if (luotTinh.current === luot) { setMayChu({ ...r, khoa }); setLoiTinh(''); }
      } catch (e) {
        if (luotTinh.current === luot) { setMayChu(null); setLoiTinh(e.message || 'Không tính được giá'); }
      }
    }, DO_TRE_TINH_MS);
    return () => clearTimeout(h);
  }, [khoa, lanTinhLai]);   // eslint-disable-line react-hooks/exhaustive-deps -- gio / khach / ma đã nằm trong `khoa`

  const coSo = coSoMayChu(mayChu, khoa);
  const tinh = useMemo(() => tinhGio(gio, { flash, hang }), [gio, flash, hang]);   // chỉ để hiện giá dòng khi chưa có số máy chủ
  const tong = coSo ? Math.round(mayChu.total) : tinh.tong;
  const { soDuDung, soDuMeDung, phaiTra } = chiaTra({ tong: coSo ? tong : 0, khach, dungTK, dungMe });
  const soLy = gio.reduce((s, m) => s + m.quantity, 0);
  const dongMayChu = coSo && mayChu.items?.length === gio.length ? mayChu.items : null;   // giá từng dòng do máy chủ trả

  const giaMotLy = (s) => {
    const dacBiet = !!s.is_special_group;
    return giaHang(s.price, phanTramHang(hang, dacBiet)).hang;
  };

  // ── Giỏ ──
  const batDauDonMoi = () => {
    setXong(null); setDaIn(false); setGio([]); setKhach(null); setHang(null); setDungTK(true); setDungMe(false); setMa(''); setMaGo('');
    setTrang('mon'); setLoi('');
  };
  const chamMon = (s) => {
    if (xong) { if (!daIn) return; batDauDonMoi(); }        // chạm món sau khi đã In = đơn mới
    setLoi('');
    const soDangCo = gio.filter((m) => m.product_id === s.id).reduce((t, m) => t + m.quantity, 0);
    const e = kiemTraThem(s, soDangCo, 1);
    if (e) { setLoi(e); return; }
    setKhung({ sp: s });
  };
  const luuKhung = ({ note, quantity }) => {
    const { sp: s, dong } = khung;
    const soKhac = gio.filter((m) => m.product_id === s.id && m.key !== dong?.key).reduce((t, m) => t + m.quantity, 0);
    const e = kiemTraThem(s, soKhac, quantity);
    if (e) { setLoi(e); return; }
    setKhung(null);
    if (dong) { setGio((g) => g.map((m) => (m.key === dong.key ? { ...m, note, quantity } : m))); return; }
    setGio((g) => {
      const trung = g.find((m) => m.product_id === s.id && (m.note || '') === note);       // hai ly khác ghi chú = hai dòng
      if (trung) return g.map((m) => (m === trung ? { ...m, quantity: m.quantity + quantity } : m));
      return [...g, { key: maDong.current++, product_id: s.id, sx_product_type: s.sx_product_type, sx_product_id: s.sx_product_id,
        product_name: s.name, unit_price: s.price, quantity, note, nhom: s.category, is_special_group: !!s.is_special_group }];
    });
  };
  const moLaiDong = (d) => { const s = sp.find((x) => x.id === d.product_id); if (s) setKhung({ sp: s, dong: d }); };

  // ── Thu tiền: MỘT đường phiên cho mọi cách ──
  const nhaPhien = (p) => thanhToanApi.huyPhien(p.id).catch(() => {});   // đã chốt / đã huỷ: không sao, phần giữ không còn

  /** Đơn đã ghi (id) → màn kết thúc. Lấy dòng đơn đã lưu; không lấy được thì vẫn sang màn kết thúc (hoá đơn tải lại bằng id). */
  const hoanTat = async (id, anh, cach, khachDua) => {
    if (!id) { setQr(null); setLoi('Tiền đã nhận nhưng chưa thấy mã đơn — mở mục Đơn hàng để kiểm tra, đừng thu lại'); return; }
    let dong = { id, total: anh.tong, payment_method: CACH_DON[cach], cash_received: khachDua, change_amount: cach === 'tien_mat' ? Math.max(0, khachDua - anh.phaiTra) : 0 };   // dự phòng cùng công thức máy chủ: trả lại = khách đưa − còn lại
    try { dong = await ordersApi.get(id); } catch { /* giữ số tính từ phiên: đơn đã ghi, màn kết thúc vẫn đúng tiền trả lại */ }
    const kh = anh.khach;
    const cachDon = dong.payment_method || CACH_DON[cach];
    setXong({
      order: {
        ...dong, id,
        customer_name: kh?.name || 'Khách lẻ', customer_phone: kh?.phone || null, customer_address: kh?.address || '',
        customer_balance: kh?.balance || 0, customer_type: kh?.customer_type || '', customer_note: kh?.discount_note || '',
      },
      successInfo: { cashReceived: dong.cash_received ?? khachDua ?? 0, change: cachDon === 'cash' ? (dong.change_amount || 0) : 0,
        balanceUsed: anh.soDuDung + anh.soDuMeDung, balanceAfter: kh && anh.soDuDung + anh.soDuMeDung > 0 ? Math.max(0, kh.balance - anh.soDuDung) : undefined,
        paymentMethod: cachDon },
    });
    setDaIn(false); setGio([]); setQr(null); setHoiPin(null); setMa(''); setMaGo(''); napSanPham();
  };
  hoanTatRef.current = hoanTat;

  /** Nạp lại số dư khách / mẹ từ máy chủ (số dư lúc chọn khách có thể đã cũ). */
  const lamMoiSoDu = async () => {
    if (!khach) return;
    try {
      const ds = (await customersV2Api.search(khach.phone)).results || [];
      const moi = ds.find((c) => c.phone === khach.phone);
      if (moi) setKhach((k) => (k && k.phone === moi.phone ? { ...k, balance: moi.balance, parent_balance: moi.parent_balance } : k));
    } catch { /* không nạp được: lần thu sau báo lệch tiếp, không sai tiền */ }
  };

  const chayPhien = async ({ cach, khachDua = 0, pin, pinMe }) => {
    if (dangGuiRef.current || !coSo) return;
    dangGuiRef.current = true; setDangGui(true); setLoi('');
    const anh = { khach, soDuDung, soDuMeDung, tong, phaiTra };
    let phien = null;
    try {
      const than = thanPhien({ gio, khach, ma, cach: cach === 'chuyen_khoan' ? 'payos' : cach, dungTK: soDuDung > 0, dungMe: soDuMeDung > 0, pin, pinMe });
      phien = (await thanhToanApi.taoPhien(than)).phien;
      if (phien.tong !== tong || phien.con_lai !== phaiTra) {   // giá / số dư đổi giữa lúc hỏi giá và lúc giữ tiền (Flash, quầy khác): không thu theo số cũ
        const p = phien; phien = null;
        await nhaPhien(p);
        setHoiPin(null); setLanTinhLai((n) => n + 1);
        await lamMoiSoDu();                                 // số dư đổi (quầy khác đang giữ ví) → nạp lại, không thì bấm lại vẫn lệch
        setLoi('Giá hoặc số dư vừa thay đổi — kiểm tra lại giỏ rồi thu lại');
        return;
      }
      setHoiPin(null);
      if (cach === 'chuyen_khoan') { anhQr.current = anh; setQr(phien); phien = null; return; }
      const c = await thanhToanApi.chotPhien(phien.id, cach === 'tien_mat' ? { cash_received: khachDua } : {});
      phien = null;
      await hoanTat(c.order?.id, anh, cach, khachDua);
    } catch (e) {
      if (phien) {                                         // phiên đã tạo mà chốt hỏng: kiểm xem máy chủ đã ghi chưa rồi mới nhả
        const p = phien; phien = null;
        const tt = await thanhToanApi.hoiPhien(p.id).catch(() => null);
        if (hanhDongPhien(tt?.phien?.trang_thai) === 'xong') await hoanTat(tt.phien.order?.id, anh, cach, khachDua);
        else if (!tt) setLoi('Mất kết nối khi chốt — KHÔNG thu lại ngay: mở mục Đơn hàng xem đơn đã ghi chưa, rồi mới thu tiếp');
        else { await nhaPhien(p); setLoi(e.message || 'Không thu được tiền'); }
      } else {
        const viec = xuLyLoiPin(e.code);
        if (viec === 'nhap_lai') setHoiPin({ cach, khachDua, i: 0, da: {}, kieu: 'nhap', loi: 'PIN không đúng — nhập lại' });
        else if (viec === 'dat_pin') setHoiPin({ cach, khachDua, i: 0, da: {}, kieu: 'dat', loi: '' });
        else { setHoiPin(null); setLoi(e.message || 'Không thu được tiền'); }   // gồm khoá 15 phút: quay về giỏ
      }
    } finally {
      dangGuiRef.current = false; setDangGui(false);
    }
  };

  const thu = ({ cach, khachDua = 0 }) => {
    if (dangGuiRef.current || !gio.length || !coSo) return;
    if (soDuDung + soDuMeDung > 0) { setHoiPin({ cach, khachDua, i: 0, da: {}, kieu: 'nhap', loi: '' }); return; }   // trừ tài khoản → khách nhập PIN
    chayPhien({ cach, khachDua });
  };
  const buocPin = [soDuDung > 0 && 'khach', soDuMeDung > 0 && 'me'].filter(Boolean);
  const nhapPin = (pin) => {
    const da = { ...hoiPin.da, [buocPin[hoiPin.i]]: pin };
    if (hoiPin.i + 1 < buocPin.length) { setHoiPin({ ...hoiPin, i: hoiPin.i + 1, da, loi: '' }); return; }
    chayPhien({ cach: hoiPin.cach, khachDua: hoiPin.khachDua, pin: da.khach, pinMe: da.me });
  };
  const datPinQuay = async (pin, lai) => {
    setDangGui(true);
    const ds = [soDuDung > 0 && khach.phone, soDuMeDung > 0 && khach.parent_phone].filter(Boolean);   // máy chủ không nói ví nào thiếu PIN → thử lần lượt, ví đã có PIN trả PIN_DA_CO
    let thongBao = 'Không đặt được PIN — hỏi chủ quán';
    for (const sdt of ds) {
      try { await thanhToanApi.datPin(sdt, pin, lai); thongBao = ''; break; } catch (e) { if (e.code !== 'PIN_DA_CO') { thongBao = e.message; break; } }
    }
    setHoiPin((h) => ({ ...h, i: 0, da: {}, kieu: thongBao ? 'dat' : 'nhap', loi: thongBao || 'Đã đặt PIN — nhập lại PIN để xác nhận' }));
    setDangGui(false);
  };
  const boTruTaiKhoan = () => { setHoiPin(null); setDungTK(false); setDungMe(false); };

  const xongQr = useCallback((id) => hoanTatRef.current(id, anhQr.current, 'chuyen_khoan', 0), []);
  const nhaQr = useCallback((thongBao) => { setQr(null); setLoi(thongBao); setLanTinhLai((n) => n + 1); }, []);

  const dsNhom = [...new Set(sp.map((p) => p.category).filter(Boolean))];
  const dsMon = nhom === 'all' ? sp : sp.filter((p) => p.category === nhom);
  const nhomTheoMa = useMemo(() => Object.fromEntries(sp.filter((p) => p.code && p.category).map((p) => [p.code, p.category])), [sp]);
  const haiTrang = bo === 'hai-trang';
  const hienMon = !haiTrang || trang === 'mon';
  const hienGio = !haiTrang || trang === 'gio';

  const cotMon = (
    <div className="bh-cot-mon">
      <ThanhKhach khach={khach} hang={hang} onChon={chonKhach} onBo={boKhach} />
      <div className="bh-hang-tren">
        {['all', ...dsNhom].map((n) => (
          <button key={n} className={`bh-tab${nhom === n ? ' bh-chon' : ''}`} onClick={() => setNhom(n)}>{n === 'all' ? 'Tất cả' : TEN_NHOM[n] || n}</button>
        ))}
      </div>
      <div className={`bh-luoi${xong && !daIn ? ' bh-khoa' : ''}`}>
        {dsMon.map((s) => {
          const g = coGia(s) ? giaMotLy(s) : 0;
          const het = !s.khong_quan_kho && s.stock_quantity === 0;
          return (
            <div key={s.id} className="bh-mon-bao">
              <button className="bh-mon" disabled={het || !coGia(s)} onClick={() => chamMon(s)}>
                <span className="bh-mon-ten">{s.name}</span>
                {coGia(s)
                  ? <span>{g < s.price && <span className="bh-gia-goc">{vnd(s.price)}</span>}<span className="bh-gia">{vnd(g)}</span></span>
                  : <span className="bh-mon-ton">Chưa có giá</span>}
                {het && <span className="bh-mon-ton">Hết hàng</span>}
              </button>
              <NutThongTin mon={s} kieu={{ top: 6, right: 6 }} />
            </div>
          );
        })}
      </div>
    </div>
  );

  const giaDong = (d, i) => {
    const m = dongMayChu?.[i];
    const hienTai = m ? (m.flash_unit_price ?? m.tier_unit_price ?? m.unit_price) : d.giaHang;
    return { goc: m ? m.unit_price : d.unit_price, hienTai };
  };

  const cotGio = xong ? (
    <ManKetThuc don={xong} caiDatHoaDon={caiDatHoaDon} nhomTheoMa={nhomTheoMa} daIn={daIn} onIn={() => setDaIn(true)} onDonMoi={batDauDonMoi} />
  ) : (
    <div className="bh-cot-gio">
      <div className="bh-gio-dau">
        <span>{haiTrang && <button className="bh-nut-nho" onClick={() => setTrang('mon')}><ArrowLeft size={14} /> Thêm món</button>} Giỏ · {soLy} ly</span>
        <button className="bh-nut-nho" disabled={!gio.length} onClick={() => setGio([])}>Xoá hết</button>
      </div>
      <div className="bh-gio-ds">
        {gio.length === 0 && <div className="bh-trong">Chạm món để thêm vào giỏ</div>}
        {tinh.dong.map((d, i) => {
          const { goc, hienTai } = giaDong(d, i);
          return (
            <button key={d.key} className="bh-dong" onClick={() => moLaiDong(d)}>
              <div className="bh-dong-ten"><b>{d.quantity} x {d.product_name}</b>{d.note && <div className="bh-dong-note">{d.note}</div>}</div>
              <div className="bh-dong-tien">
                {hienTai < goc && <div className="bh-gia-goc">{vnd(goc * d.quantity)}</div>}
                <b>{vnd(hienTai * d.quantity)}</b>
              </div>
            </button>
          );
        })}
      </div>
      {gio.length > 0 && (
        <>
          <div className="bh-chan-gio">
            {coSo ? (
              <>
                <div className="bh-tien-dong"><span>Tạm tính</span><span>{vnd(mayChu.subtotal)}</span></div>
                {mayChu.flash_discount > 0 && <div className="bh-tien-dong"><span>Giảm Flash</span><span>−{vnd(mayChu.flash_discount)}</span></div>}
                {mayChu.tier_discount > 0 && <div className="bh-tien-dong"><span>Giảm hạng{mayChu.customer_tier ? ` ${mayChu.customer_tier}` : ''}</span><span>−{vnd(mayChu.tier_discount)}</span></div>}
                {mayChu.discount_amount > 0 && <div className="bh-tien-dong"><span>Ưu đãi{mayChu.discount_code ? ` ${mayChu.discount_code}` : ''}</span><span>−{vnd(mayChu.discount_amount)}</span></div>}
                {mayChu.cau_ghi && <div className="bh-ghi-chu-ngu" style={{ padding: '0 0.9rem' }}>{mayChu.cau_ghi}</div>}
                {mayChu.ma_loi && <div className="bh-ghi-chu-ngu" style={{ padding: '0 0.9rem', color: 'var(--bh-do)' }}>Mã không áp: {mayChu.ma_loi}</div>}
              </>
            ) : (
              <div className="bh-ghi-chu-ngu" style={{ padding: '0 0.9rem' }}>{loiTinh || 'Đang hỏi máy chủ giá…'} {loiTinh && <button className="bh-nut-nho" onClick={() => setLanTinhLai((n) => n + 1)}>Thử lại</button>}</div>
            )}
            <div className="bh-tien-dong">
              <input value={maGo} onChange={(e) => setMaGo(e.target.value)} onBlur={() => setMa(maGo)} onKeyDown={(e) => { if (e.key === 'Enter') setMa(maGo); }}
                placeholder="Mã giảm giá (nếu có)" maxLength={40} style={{ flex: 1, minHeight: 40, border: '1px solid var(--bh-vien)', borderRadius: 8, padding: '0 0.6rem' }} />
            </div>
          </div>
          <ThuTien key={`${tong}-${soDuDung}-${soDuMeDung}-${khoa}`} coSo={coSo} tong={tong} phaiTra={phaiTra} khach={khach} soDuDung={soDuDung} soDuMeDung={soDuMeDung}
            dungTK={dungTK} dungMe={dungMe} onDungTK={setDungTK} onDungMe={setDungMe} dangGui={dangGui} onThu={thu} />
        </>
      )}
    </div>
  );

  return (
    <div className="bh">
      <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
        <button className="bh-nut-nho" onClick={() => setMoCaiDat((v) => !v)} aria-label="Cài đặt màn bán hàng"><IconCaiDat size={16} /> Màn bán hàng</button>
        {moCaiDat && (
          <div className="bh-cai-dat">
            <b>Màn bán hàng mới (máy này)</b>
            <div className="bh-chip-hang">
              {Object.entries(NHAN_KIEU).map(([k, ten]) => (
                <button key={k} className={`bh-chip${kieu === k ? ' bh-chon' : ''}`} onClick={() => onDoiCaiDat(true, k)}>{ten}</button>
              ))}
            </div>
            <button className="bh-nut bh-phu" onClick={() => onDoiCaiDat(false, kieu)}>Tắt — về màn cũ</button>
          </div>
        )}
      </div>
      {loi && <div className="bh-loi"><span>{loi}</span><button className="bh-nut-nho" onClick={() => setLoi('')}>Đóng</button></div>}
      <div className={`bh-than ${bo === 'hai-trang' ? 'bh-hai-trang' : ''}`}>
        {hienMon && cotMon}
        {hienGio && cotGio}
      </div>
      {haiTrang && trang === 'mon' && gio.length > 0 && !xong && (
        <div className="bh-thanh-gio">
          <button className="bh-nut" style={{ width: '100%' }} onClick={() => setTrang('gio')}>
            <ShoppingCart size={16} /> Xem giỏ · {soLy} món · {coSo ? vnd(tong) : 'đang tính…'}
          </button>
        </div>
      )}
      {khung && <KhungChonMon sp={khung.sp} dong={khung.dong} giaMotLy={giaMotLy(khung.sp)} noi={!haiTrang}
        onLuu={luuKhung} onXoa={() => { setGio((g) => g.filter((m) => m.key !== khung.dong.key)); setKhung(null); }} onDong={() => setKhung(null)} />}
      {hoiPin && (
        <ManPin tieuDe={hoiPin.kieu === 'dat' ? 'Đặt PIN cho tài khoản' : buocPin[hoiPin.i] === 'me' ? `PIN của ${khach?.parent_name || 'tài khoản mẹ'}` : `PIN của ${khach?.name || 'khách'}`}
          kieu={hoiPin.kieu} loi={hoiPin.loi} dangGui={dangGui} onXong={nhapPin} onDat={datPinQuay} onBo={boTruTaiKhoan}
          key={`${hoiPin.kieu}-${hoiPin.i}-${hoiPin.loi}`} />
      )}
      {qr && <ManQr phien={qr} onXong={xongQr} onNha={nhaQr} />}
    </div>
  );
}
