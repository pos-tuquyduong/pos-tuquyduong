/**
 * KHO-3a A7 — "Món chưa sẵn sàng bán": món đang bán mà chưa có kiểu / công thức, hoặc làm sẵn hết lô còn hạn. Quầy chặn bán đúng các món này
 * (máy chủ — kho/banHang.js). Chủ quán làm cho đủ trước khi gộp và hằng ngày; món không bán nữa thì bấm "Ẩn" (khỏi quầy và App).
 */
import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { baoXong, baoLoiTu } from '../../components/thongBaoKho.js';

export default function ChuaSan({ moSanPham, doiSo }) {
  const [ds, setDs] = useState(null);
  const [loi, setLoi] = useState('');
  const [dang, setDang] = useState(null);
  const tai = () => api.get('/kho/mon-chua-san').then((r) => { setDs(r.mon); doiSo(r.so); }).catch((e) => setLoi(e.message));
  useEffect(() => { tai(); }, []);
  const an = async (m) => {
    if (dang || !window.confirm(`Ẩn "${m.ten}" khỏi quầy và App?`)) return;
    setDang(m.san_pham_id);
    try { await api.put(`/products/${m.san_pham_id}`, { is_active: 0 }); baoXong(`Đã ẩn ${m.ten}`); tai(); } catch (e) { baoLoiTu('ẩn món', e); } finally { setDang(null); }
  };
  if (loi) return <div className="kho-loi">{loi}</div>;
  if (!ds) return <p className="text-gray">Đang tải…</p>;
  if (!ds.length) return <p className="text-gray">Mọi món đang bán đều đủ kiểu, công thức và hàng.</p>;
  return (
    <div>
      <div className="kho-canh">Quầy KHÔNG bán được {ds.length} món dưới đây cho tới khi đủ công thức / có lô.</div>
      <div className="kho-luoi">
        {ds.map((m) => (
          <div key={m.san_pham_id} className="kho-the">
            <b>{m.ten}</b>
            <div className="kho-nho kho-thieu">{m.ly_do}</div>
            <div className="kho-hang" style={{ marginTop: '0.5rem' }}>
              <button className="btn btn-sm btn-outline" onClick={() => moSanPham(m.san_pham_id)}>Mở món</button>
              <button className="btn btn-sm btn-outline" disabled={dang === m.san_pham_id} onClick={() => an(m)}>Ẩn</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
