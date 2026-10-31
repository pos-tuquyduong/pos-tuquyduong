// KH-MUA-1 (H) — thẻ Cài đặt "Chuông đơn App": bật / tắt, chọn tiếng, âm lượng — CHUNG cả quán (chủ quán Q2), lưu 3 khoá don_app_chuong_*
// qua PUT /settings (máy chủ kiểm giá trị). Máy nào kêu do công tắc "Máy ở quán" ở màn Đơn App (riêng từng máy).
import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { api } from '../utils/api';
import { TIENG_CHUONG, AM_LUONG_MAC_DINH, keuChuong } from './DonAppNoi';

export default function CaiDatChuong() {
  const [bat, setBat] = useState(true);
  const [tieng, setTieng] = useState(TIENG_CHUONG[0][0]);
  const [amLuong, setAmLuong] = useState(AM_LUONG_MAC_DINH);
  const [taiLoi, setTaiLoi] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);
  const [thongDiep, setThongDiep] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const s = (await api.get('/settings')).data || {};
        setBat(s.don_app_chuong_bat !== '0');
        if (TIENG_CHUONG.some(([k]) => k === s.don_app_chuong_tieng)) setTieng(s.don_app_chuong_tieng);
        if (s.don_app_chuong_am_luong != null) setAmLuong(Number(s.don_app_chuong_am_luong));
      } catch (e) { setTaiLoi(true); setThongDiep('Lỗi: chưa tải được cài đặt chuông (' + e.message + ')'); }
    })();
  }, []);

  const luu = async () => {
    setDangLuu(true);
    try {
      await api.put('/settings', { settings: { don_app_chuong_bat: bat ? '1' : '0', don_app_chuong_tieng: tieng, don_app_chuong_am_luong: String(amLuong) } });
      setThongDiep('Đã lưu cài đặt chuông');
    } catch (e) { setThongDiep('Lỗi: ' + e.message); }
    finally { setDangLuu(false); }
  };

  return (
    <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
      <div className="card-title" style={{ margin: '0 0 0.5rem' }}>🔔 Chuông đơn App</div>
      <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 0.75rem' }}>
        Áp cho cả quán. Chỉ máy bật "Máy ở quán" (màn Đơn App) mới kêu — mỗi đơn mới kêu một lần.
      </p>
      {thongDiep && <div style={{ padding: 8, marginBottom: 8, background: thongDiep.startsWith('Lỗi') ? '#fee2e2' : '#dcfce7', borderRadius: 6 }}>{thongDiep}</div>}
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <input type="checkbox" checked={bat} onChange={(e) => setBat(e.target.checked)} /> Bật chuông
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 8 }}>
        <select className="input" style={{ width: 180 }} value={tieng} onChange={(e) => setTieng(e.target.value)}>
          {TIENG_CHUONG.map(([k, ten]) => <option key={k} value={k}>{ten}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Âm lượng <input type="range" min="0" max="100" step="5" value={amLuong} onChange={(e) => setAmLuong(Number(e.target.value))} /> {amLuong}
        </label>
        <button className="btn btn-outline" onClick={() => keuChuong(tieng, amLuong)}>Thử</button>
      </div>
      <button className="btn btn-primary" onClick={luu} disabled={dangLuu || taiLoi}>
        <Save size={16} /> {dangLuu ? 'Đang lưu...' : 'Lưu'}
      </button>
    </div>
  );
}
