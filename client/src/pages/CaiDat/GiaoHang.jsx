// GIAO-1 (B) — thẻ Cài đặt "Giao hàng": khoá giao_* lưu qua PUT /settings (máy chủ kiểm bằng giaoHang.kiemCaiDat — sai một khoá không ghi khoá nào).
// Điểm lấy hàng chọn qua ô địa chỉ (POST /giao-hang/diem-lay — cùng hàm máy chủ với ô địa chỉ ở quầy). Khoá Ahamove CHỈ ở biến môi trường Render:
// thẻ này chỉ hiện "đã cài ✓ (bản thử | bản thật) / chưa cài ✗".
import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { api, giaoHangApi } from '../../utils/api';

const O = [['giao_km_toi_da', 'Khoảng cách giao tối đa (km)', 'km_toi_da'], ['giao_phut_moi_mon', 'Phút pha mỗi món', 'phut_moi_mon'],
  ['giao_phut_tim_xe', 'Phút tìm xe ước tính', 'phut_tim_xe'], ['giao_phut_nhac', 'Nhắc khi đã nhận mà chưa gọi xe (phút)', 'phut_nhac']];

export default function CaiDatGiaoHang() {
  const [kq, setKq] = useState(null);
  const [o, setO] = useState({});
  const [diaChi, setDiaChi] = useState('');
  const [goiY, setGoiY] = useState([]);
  const [thongDiep, setThongDiep] = useState('');

  const tai = async () => {
    try {
      const r = await giaoHangApi.caiDat();
      setKq(r);
      const c = r.cai_dat;
      setO({ ...Object.fromEntries(O.map(([k, , f]) => [k, String(c[f])])), giao_gio_nhan: c.gio_nhan, giao_loai_xe: c.loai_xe, giao_sdt_quan: c.sdt_quan });
    } catch (e) { setThongDiep('Lỗi: chưa tải được cài đặt giao — ' + e.message); }
  };
  useEffect(() => { tai(); }, []);

  const luu = async () => {
    try { await api.put('/settings', { settings: o }); setThongDiep('Đã lưu cài đặt giao hàng'); await tai(); } catch (e) { setThongDiep('Lỗi: ' + e.message); }
  };
  const timDiaChi = async () => {
    setGoiY([]);
    if (!kq?.ahamove?.goi_y) return datDiemLay({ dia_chi: diaChi });
    try { setGoiY((await giaoHangApi.diaChi(diaChi)).goi_y || []); } catch (e) { setThongDiep('Lỗi: ' + e.message); }
  };
  const datDiemLay = async (than) => {
    try { await giaoHangApi.diemLay(than); setGoiY([]); setDiaChi(''); setThongDiep('Đã lưu điểm lấy hàng'); await tai(); } catch (e) { setThongDiep('Lỗi: ' + e.message); }
  };

  if (!kq) return <div className="card">{thongDiep || 'Đang tải…'}</div>;
  const a = kq.ahamove;
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxWidth: 560 }}>
      <h3 style={{ margin: 0 }}>🛵 Giao hàng Ahamove</h3>
      <div>Ahamove: {a.da_cai ? <b style={{ color: '#15803d' }}>đã cài ✓ ({a.ban === 'that' ? 'bản thật' : 'bản thử'})</b> : <b style={{ color: '#b91c1c' }}>chưa cài ✗</b>}
        {' · '}Gợi ý địa chỉ: {a.goi_y ? 'có (Ahamove)' : 'chưa có khoá — nhân viên gõ địa chỉ rồi xác nhận km'}</div>
      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Khoá Ahamove chỉ đặt ở biến môi trường của Render (AHAMOVE_API_KEY, AHAMOVE_SDT, AHAMOVE_MOI_TRUONG, AHAMOVE_KHOA_BAO, AHAMOVE_DIA_CHI_URL, AHAMOVE_DIA_CHI_KHOA).</div>
      {O.map(([k, ten]) => (
        <label key={k}>{ten}<input className="input" inputMode="decimal" value={o[k] ?? ''} onChange={(e) => setO({ ...o, [k]: e.target.value })} /></label>
      ))}
      <label>Giờ nhận đơn giao (vd 08:00-21:00 · để trống = cả ngày)<input className="input" value={o.giao_gio_nhan ?? ''} onChange={(e) => setO({ ...o, giao_gio_nhan: e.target.value.trim() })} /></label>
      <label>Loại xe mặc định
        <select className="input" value={o.giao_loai_xe} onChange={(e) => setO({ ...o, giao_loai_xe: e.target.value })}>{kq.loai_xe.map((x) => <option key={x}>{x}</option>)}</select>
      </label>
      <label>SĐT liên hệ của quán cho tài xế<input className="input" inputMode="tel" value={o.giao_sdt_quan ?? ''} onChange={(e) => setO({ ...o, giao_sdt_quan: e.target.value.replace(/[^\d]/g, '') })} /></label>
      <button className="btn btn-primary" onClick={luu}><Save size={16} /> Lưu</button>
      <hr />
      <div>Điểm lấy hàng: <b>{kq.cai_dat.diem_lay?.dia_chi || 'chưa cài'}</b>{kq.cai_dat.diem_lay?.lat != null && ` (${kq.cai_dat.diem_lay.lat}, ${kq.cai_dat.diem_lay.lng})`}</div>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <input className="input" style={{ flex: 1 }} value={diaChi} onChange={(e) => setDiaChi(e.target.value)} placeholder="Địa chỉ quán" />
        <button className="btn btn-outline" onClick={timDiaChi}>{a.goi_y ? 'Tìm' : 'Lưu địa chỉ'}</button>
      </div>
      {goiY.map((g) => <button key={g.ma} className="btn btn-outline" style={{ textAlign: 'left' }} onClick={() => datDiemLay({ ma_goi_y: g.ma })}>{g.dia_chi}</button>)}
      {thongDiep && <div>{thongDiep}</div>}
    </div>
  );
}
