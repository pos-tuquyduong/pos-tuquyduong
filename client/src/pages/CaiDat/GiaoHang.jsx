// GIAO-1 (B) — thẻ Cài đặt "Giao hàng": khoá giao_* lưu qua PUT /settings (máy chủ kiểm bằng giaoHang.kiemCaiDat — sai một khoá không ghi khoá nào).
// Điểm lấy hàng chọn qua ô địa chỉ (POST /giao-hang/diem-lay — cùng hàm máy chủ với ô địa chỉ ở quầy). Khoá Ahamove CHỈ ở biến môi trường Render:
// thẻ này chỉ hiện "đã cài ✓ (bản thử | bản thật) / chưa cài ✗".
// BAO-1b: báo qua thông báo chung; lỗi ô dưới ô; sửa mà chưa Lưu → thanh "Có thay đổi chưa lưu"; nút khoá khi đang lưu.
import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { api, giaoHangApi } from '../../utils/api';
import { baoXong, baoLoi, baoLoiTu, lyDoLoi } from '../../components/thongBaoKho.js';
import LoiO from '../../components/LoiO';
import ThanhLuu from '../../components/ThanhLuu';
import useThayDoi from '../../components/useThayDoi';

const O = [['giao_km_toi_da', 'Khoảng cách giao tối đa (km)', 'km_toi_da'], ['giao_phut_moi_mon', 'Phút pha mỗi món', 'phut_moi_mon'],
  ['giao_phut_tim_xe', 'Phút tìm xe ước tính', 'phut_tim_xe'], ['giao_phut_nhac', 'Nhắc khi đã nhận mà chưa gọi xe (phút)', 'phut_nhac']];

export default function CaiDatGiaoHang() {
  const [kq, setKq] = useState(null);
  const [o, setO] = useState({});
  const [diaChi, setDiaChi] = useState('');
  const [goiY, setGoiY] = useState([]);
  const [loiO, setLoiO] = useState({});   // khoá ô (hoặc tai / luu / diaChi) → câu lỗi hiện dưới ô đó
  const [dangLuu, setDangLuu] = useState(false);
  const [coDoi, chup] = useThayDoi(o);

  const tai = async () => {
    try {
      const r = await giaoHangApi.caiDat();
      setKq(r);
      const c = r.cai_dat;
      const moi = { ...Object.fromEntries(O.map(([k, , f]) => [k, String(c[f])])), giao_gio_nhan: c.gio_nhan, giao_loai_xe: c.loai_xe, giao_sdt_quan: c.sdt_quan };
      setO(moi); chup(moi); setLoiO({});
    } catch (e) { setLoiO({ tai: lyDoLoi(e) }); baoLoiTu('tải cài đặt giao hàng', e); }
  };
  useEffect(() => { tai(); }, []);

  const luu = async () => {
    const l = {};
    for (const [k, ten] of O) if (String(o[k] ?? '').trim() === '' || !Number.isFinite(Number(o[k]))) l[k] = `Nhập một con số cho "${ten}"`;
    setLoiO(l);
    if (Object.keys(l).length) { baoLoi('Chưa lưu cài đặt giao hàng được', 'Sửa các ô báo đỏ rồi bấm Lưu lại.'); return; }
    setDangLuu(true);
    try { await api.put('/settings', { settings: o }); baoXong('Đã lưu cài đặt giao hàng'); await tai(); } catch (e) { setLoiO({ luu: lyDoLoi(e) }); baoLoiTu('lưu cài đặt giao hàng', e); }
    setDangLuu(false);
  };
  const timDiaChi = async () => {
    setGoiY([]);
    if (!diaChi.trim()) { setLoiO({ diaChi: 'Nhập địa chỉ quán' }); baoLoi('Chưa tìm được địa chỉ', 'Nhập địa chỉ quán vào ô rồi bấm lại.'); return; }
    setLoiO({});
    if (!kq?.ahamove?.goi_y) return datDiemLay({ dia_chi: diaChi });
    setDangLuu(true);
    try { setGoiY((await giaoHangApi.diaChi(diaChi)).goi_y || []); } catch (e) { setLoiO({ diaChi: lyDoLoi(e) }); baoLoiTu('tìm địa chỉ', e); }
    setDangLuu(false);
  };
  const datDiemLay = async (than) => {
    setDangLuu(true);
    try { await giaoHangApi.diemLay(than); setGoiY([]); setDiaChi(''); baoXong('Đã lưu điểm lấy hàng'); await tai(); } catch (e) { setLoiO({ diaChi: lyDoLoi(e) }); baoLoiTu('lưu điểm lấy hàng', e); }
    setDangLuu(false);
  };

  if (!kq) return <div className="card">{loiO.tai ? <LoiO loi={`Chưa tải được cài đặt giao: ${loiO.tai}`} /> : 'Đang tải…'}</div>;
  const a = kq.ahamove;
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxWidth: 560 }}>
      <h3 style={{ margin: 0 }}>🛵 Giao hàng Ahamove</h3>
      <div>Ahamove: {a.da_cai ? <b style={{ color: '#15803d' }}>đã cài ✓ ({a.ban === 'that' ? 'bản thật' : 'bản thử'})</b> : <b style={{ color: '#b91c1c' }}>chưa cài ✗</b>}
        {' · '}Gợi ý địa chỉ: {a.goi_y ? 'có (Ahamove)' : 'chưa có khoá — nhân viên gõ địa chỉ rồi xác nhận km'}</div>
      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Khoá Ahamove chỉ đặt ở biến môi trường của Render (AHAMOVE_API_KEY, AHAMOVE_SDT, AHAMOVE_MOI_TRUONG, AHAMOVE_KHOA_BAO, AHAMOVE_DIA_CHI_URL, AHAMOVE_DIA_CHI_KHOA).</div>
      {O.map(([k, ten]) => (
        <label key={k}>{ten}<input className="input" inputMode="decimal" value={o[k] ?? ''} onChange={(e) => setO({ ...o, [k]: e.target.value })} /><LoiO loi={loiO[k]} /></label>
      ))}
      <label>Giờ nhận đơn giao (vd 08:00-21:00 · để trống = cả ngày)<input className="input" value={o.giao_gio_nhan ?? ''} onChange={(e) => setO({ ...o, giao_gio_nhan: e.target.value.trim() })} /></label>
      <label>Loại xe mặc định
        <select className="input" value={o.giao_loai_xe} onChange={(e) => setO({ ...o, giao_loai_xe: e.target.value })}>{kq.loai_xe.map((x) => <option key={x}>{x}</option>)}</select>
      </label>
      <label>SĐT liên hệ của quán cho tài xế<input className="input" inputMode="tel" value={o.giao_sdt_quan ?? ''} onChange={(e) => setO({ ...o, giao_sdt_quan: e.target.value.replace(/[^\d]/g, '') })} /></label>
      <button className="btn btn-primary" onClick={luu} disabled={dangLuu}><Save size={16} /> {dangLuu ? 'Đang lưu…' : 'Lưu'}</button>
      <LoiO loi={loiO.luu} />
      <hr />
      <div>Điểm lấy hàng: <b>{kq.cai_dat.diem_lay?.dia_chi || 'chưa cài'}</b>{kq.cai_dat.diem_lay?.lat != null && ` (${kq.cai_dat.diem_lay.lat}, ${kq.cai_dat.diem_lay.lng})`}</div>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <input className="input" style={{ flex: 1 }} value={diaChi} onChange={(e) => setDiaChi(e.target.value)} placeholder="Địa chỉ quán" />
        <button className="btn btn-outline" onClick={timDiaChi} disabled={dangLuu}>{a.goi_y ? 'Tìm' : 'Lưu địa chỉ'}</button>
      </div>
      <LoiO loi={loiO.diaChi} />
      {goiY.map((g) => <button key={g.ma} className="btn btn-outline" style={{ textAlign: 'left' }} disabled={dangLuu} onClick={() => datDiemLay({ ma_goi_y: g.ma })}>{g.dia_chi}</button>)}
      <ThanhLuu id="giao-hang" coDoi={coDoi} dangLuu={dangLuu} onLuu={luu} onBo={tai} />
    </div>
  );
}
