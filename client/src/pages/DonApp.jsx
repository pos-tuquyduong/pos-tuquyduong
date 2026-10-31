// KH-MUA-1 (H) — màn "Đơn App": đơn khách đặt qua App ĐÃ TRẢ (hôm nay + đơn chưa xong từ trước). Đơn chưa trả không hiện ở quầy.
// Mỗi đơn: mã, giờ, món + ghi chú, tên khách, đã trả bao nhiêu bằng gì; nút "Đang làm" → "Xong" (máy chủ ghi người + giờ, bấm trùng → 409).
// Công tắc "Máy ở quán" lưu riêng máy này (mặc định tắt) — chỉ máy bật mới kêu chuông. Tiếng / âm lượng ở Cài đặt › Giờ hoạt động.
import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { mayOQuan, datMayOQuan, keuChuong, AM_LUONG_MAC_DINH } from '../components/DonAppNoi';

const NHAN = { da_tra: ['Mới', '#dc2626'], dang_lam: ['Đang làm', '#d97706'], xong: ['Xong', '#16a34a'], da_huy: ['Đã huỷ', '#6b7280'] };
const tien = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
const cachTra = (d) => (d.tra_vi && d.tra_qr ? `Ví ${tien(d.tra_vi)} + QR ${tien(d.tra_qr)}` : d.tra_vi ? 'Ví' : 'QR');

export default function DonApp() {
  const [ds, setDs] = useState([]);
  const [loi, setLoi] = useState('');
  const [dangBam, setDangBam] = useState(null);
  const [may, setMay] = useState(mayOQuan());

  const tai = async () => {
    try {
      setDs((await api.get('/kh/don-app')).data || []);
      setLoi('');
    } catch (e) { setLoi('Lỗi: ' + e.message); }
  };
  useEffect(() => {
    tai();
    const h = setInterval(tai, 15000);
    return () => clearInterval(h);
  }, []);

  const bam = async (d, buoc) => {
    setDangBam(d.id);
    try { await api.post(`/kh/don-app/${d.id}/${buoc}`, {}); } catch (e) { setLoi('Lỗi: ' + e.message); }
    finally { setDangBam(null); tai(); }
  };
  const doiMay = (bat) => { datMayOQuan(bat); setMay(bat); };
  const thuChuong = async () => {
    try {
      const s = (await api.get('/settings')).data || {};
      keuChuong(s.don_app_chuong_tieng, s.don_app_chuong_am_luong ?? AM_LUONG_MAC_DINH);
    } catch (e) { setLoi('Lỗi: ' + e.message); }
  };

  return (
    <div className="page">
      <div className="card">
        <div className="card-title" style={{ margin: '0 0 0.5rem' }}>🔔 Đơn App</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <input type="checkbox" checked={may} onChange={(e) => doiMay(e.target.checked)} />
            Máy ở quán (máy này kêu chuông khi có đơn mới)
          </label>
          <button className="btn btn-outline" onClick={thuChuong}>Thử chuông</button>
        </div>
        {loi && <div style={{ padding: 8, marginBottom: 8, background: '#fee2e2', borderRadius: 6 }}>{loi}</div>}
        {!ds.length && <p style={{ color: '#6b7280' }}>Chưa có đơn App nào hôm nay.</p>}
        {ds.map((d) => {
          const [nhan, mau] = NHAN[d.tien_trinh] || [d.tien_trinh, '#6b7280'];
          return (
            <div key={d.id} style={{ borderTop: '1px solid #eee', padding: '10px 0' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
                <strong>{d.ma}</strong>
                <span style={{ color: '#6b7280', fontSize: 13 }}>{(d.gio || '').slice(11, 16)} · bill {d.ma_bill}</span>
                <span style={{ color: mau, fontWeight: 700, fontSize: 13 }}>{nhan}</span>
              </div>
              <div style={{ fontSize: 14, margin: '4px 0' }}>{d.ten_khach} · đã trả {tien(d.da_tra)} ({cachTra(d)})</div>
              <ul style={{ margin: '4px 0 6px 18px', padding: 0 }}>
                {d.mon.map((m, i) => (
                  <li key={i}>{m.so_luong} × {m.ten}{m.ghi_chu ? <em style={{ color: '#b45309' }}> — {m.ghi_chu}</em> : null}</li>
                ))}
              </ul>
              {d.tien_trinh === 'da_tra' && (
                <button className="btn btn-primary" disabled={dangBam === d.id} onClick={() => bam(d, 'dang-lam')}>Đang làm</button>
              )}
              {d.tien_trinh === 'dang_lam' && (
                <button className="btn btn-primary" disabled={dangBam === d.id} onClick={() => bam(d, 'xong')}>Xong</button>
              )}
              {d.nguoi_lam && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                Làm: {d.nguoi_lam} {(d.luc_lam || '').slice(11, 16)}{d.nguoi_xong ? ` · Xong: ${d.nguoi_xong} ${(d.luc_xong || '').slice(11, 16)}` : ''}
              </div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
