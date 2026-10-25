/**
 * Màn Bán hàng mới (BH-1 đợt 1) — bố cục chủ quán chốt 22–24.10.2026 (ban_mau_pos/DAC_TA_BAN_HANG_2410.md).
 * Dùng API sẵn có, gửi đúng payload như Sales.jsx (xem dungDonHang). Máy chủ tự tra giá và tính tiền; giá hạng ở đây chỉ để hiển thị.
 * Đợt 2 (BH-2): payOS, PIN, giữ tiền, topping, đổi điểm, giao hàng, hoá đơn mới.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Settings as IconCaiDat, ShoppingCart, ArrowLeft } from 'lucide-react';
import { api, ordersApi, productsApi } from '../../utils/api';
import { getLogo } from '../../utils/logoCache';
import ThanhKhach from './ThanhKhach';
import KhungChonMon from './KhungChonMon';
import ThuTien from './ThuTien';
import ManKetThuc from './ManKetThuc';
import { dungDonHang, giaHang, kiemTraThem, phanTramHang, tachTrang, tinhGio } from './tinh';
import './banHang.css';

const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const TEN_NHOM = { juice: 'Nước ép', tea: 'Trà' };          // nhóm lạ hiện đúng mã nhóm
const CHU_KY_FLASH_MS = 60000;                              // như Sales.jsx: làm mới Flash mỗi 60 giây
const NHAN_KIEU = { tudong: 'Tự động', dienthoai: 'Điện thoại', maytinhbang: 'Máy tính bảng' };

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
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState('');
  const [xong, setXong] = useState(null);                   // đơn vừa thanh toán
  const [daIn, setDaIn] = useState(false);
  const [moCaiDat, setMoCaiDat] = useState(false);
  const dangGuiRef = useRef(false);                         // chặn bấm đôi ĐỒNG BỘ (state cập nhật muộn một nhịp)
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
    setKhach(c); setLoi(''); setDungTK(true); setDungMe(false); setHang(null);
    try {
      const r = await api.get(`/membership/status/${encodeURIComponent(c.phone)}`);
      if (r.success) {
        const dung = r.data.status === 'active' || r.data.status === 'expiring_soon';
        const t = dung ? dsHang.find((x) => x.id === r.data.tier_id) : null;
        setHang({ ...r.data, usable: dung, discount_percent: t?.discount_percent || 0, special_discount_percent: t?.special_discount_percent || 0 });
      }
    } catch { /* không tra được hạng: bán như khách chưa có hạng, máy chủ vẫn tự tính lại */ }
  };
  const boKhach = () => { setKhach(null); setHang(null); setDungTK(true); setDungMe(false); };

  const tinh = useMemo(() => {
    const khachGiam = khach && khach.discount_value > 0 ? { loai: khach.discount_type || 'percent', gia_tri: khach.discount_value } : null;
    return tinhGio(gio, { flash, hang, khachGiam });
  }, [gio, flash, hang, khach]);
  const soDuDung = khach && dungTK ? Math.min(khach.balance || 0, tinh.tong) : 0;
  const soDuMeDung = khach && dungMe ? Math.min(khach.parent_balance || 0, tinh.tong - soDuDung) : 0;
  const soLy = gio.reduce((s, m) => s + m.quantity, 0);

  const giaMotLy = (s) => {
    const dacBiet = !!s.is_special_group;
    return giaHang(s.price, phanTramHang(hang, dacBiet)).hang;
  };

  // ── Giỏ ──
  const batDauDonMoi = () => { setXong(null); setDaIn(false); setGio([]); setKhach(null); setHang(null); setDungTK(true); setDungMe(false); setTrang('mon'); setLoi(''); };
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

  // ── Gửi đơn ──
  const thu = async ({ cach, khachDua }) => {
    if (dangGuiRef.current || !gio.length) return;
    dangGuiRef.current = true; setDangGui(true); setLoi('');
    try {
      const body = dungDonHang({ gio, tamTinh: tinh, cach, khach, soDuDung, soDuMeDung, khachDua });
      const kq = await ordersApi.create(body);
      const o = kq.order;
      const conLai = (o.total ?? tinh.tong) - soDuDung - soDuMeDung;
      setXong({
        order: {
          id: o.id, code: o.code, invoice_number: o.invoice_number,
          customer_name: khach?.name || 'Khách lẻ', customer_phone: khach?.phone || null, customer_address: khach?.address || '',
          customer_balance: khach?.balance || 0, customer_type: khach?.customer_type || '', customer_tier: o.customer_tier || null,
          customer_note: khach?.discount_note || '', created_by: o.created_by, created_at: o.created_at, items: o.items,
          subtotal: o.subtotal || tinh.tamTinh, discount: o.discount ?? tinh.giamKhach, flash_discount: o.flash_discount || 0,
          tier_discount: o.tier_discount || 0, discount_type: o.discount_type, discount_value: o.discount_value, discount_code: o.discount_code,
          shipping_fee: o.shipping_fee || 0, total: o.total, payment_method: cach, cash_received: body.cash_received,
          change_amount: body.change_amount, balance_amount: soDuDung,
          signup_code: o.signup_code || null, signup_nhan: o.signup_nhan || null, signup_loi: o.signup_loi || null,
        },
        successInfo: { cashReceived: body.cash_received, change: cach === 'cash' ? Math.max(0, body.cash_received - conLai) : 0,
          balanceUsed: soDuDung, balanceAfter: o.balance_after, paymentMethod: cach },
      });
      setDaIn(false); setGio([]); napSanPham();
    } catch (e) {
      setLoi(e.message || 'Không tạo được đơn');
    } finally {
      dangGuiRef.current = false; setDangGui(false);
    }
  };

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
          const g = giaMotLy(s);
          const het = !s.khong_quan_kho && s.stock_quantity === 0;
          return (
            <button key={s.id} className="bh-mon" disabled={het} onClick={() => chamMon(s)}>
              <span className="bh-mon-ten">{s.name}</span>
              <span>{g < s.price && <span className="bh-gia-goc">{vnd(s.price)}</span>}<span className="bh-gia">{typeof s.price === 'number' ? vnd(g) : 'Chưa có giá'}</span></span>
              {het && <span className="bh-mon-ton">Hết hàng</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

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
        {tinh.dong.map((d) => (
          <button key={d.key} className="bh-dong" onClick={() => moLaiDong(d)}>
            <div className="bh-dong-ten"><b>{d.quantity} x {d.product_name}</b>{d.note && <div className="bh-dong-note">{d.note}</div>}</div>
            <div className="bh-dong-tien">
              {d.giaHang < d.unit_price && <div className="bh-gia-goc">{vnd(d.unit_price * d.quantity)}</div>}
              <b>{vnd(d.giaHang * d.quantity)}</b>
            </div>
          </button>
        ))}
      </div>
      {gio.length > 0 && (
        <>
          <div className="bh-chan-gio">
            <div className="bh-tien-dong"><span>Tạm tính</span><span>{vnd(tinh.tamTinh)}</span></div>
            {tinh.giamFlash > 0 && <div className="bh-tien-dong"><span>Giảm Flash</span><span>−{vnd(tinh.giamFlash)}</span></div>}
            {tinh.giamHang > 0 && <div className="bh-tien-dong"><span>Giảm hạng{hang?.tier_name ? ` ${hang.tier_name}` : ''}</span><span>−{vnd(tinh.giamHang)}</span></div>}
            {tinh.giamKhach > 0 && <div className="bh-tien-dong"><span>Chiết khấu khách</span><span>−{vnd(tinh.giamKhach)}</span></div>}
          </div>
          <ThuTien key={tinh.tong} tong={tinh.tong} khach={khach} soDuDung={soDuDung} soDuMeDung={soDuMeDung}
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
            <ShoppingCart size={16} /> Xem giỏ · {soLy} món · {vnd(tinh.tong)}
          </button>
        </div>
      )}
      {khung && <KhungChonMon sp={khung.sp} dong={khung.dong} giaMotLy={giaMotLy(khung.sp)} noi={!haiTrang}
        onLuu={luuKhung} onXoa={() => { setGio((g) => g.filter((m) => m.key !== khung.dong.key)); setKhung(null); }} onDong={() => setKhung(null)} />}
    </div>
  );
}
