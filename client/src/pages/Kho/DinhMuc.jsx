/**
 * KHO-2a — Định mức (chủ / quản lý): mỗi món làm sẵn "mọi ngày" + 7 ô theo thứ (trống = theo mọi ngày); "% lệch cho phép" theo nhóm món;
 * công tắc "Nhân viên xuất kho cần duyệt" (chỉ chủ quán — máy chủ kiểm).
 */
import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { THU } from './chung';

const O = ['', 0, 1, 2, 3, 4, 5, 6];   // '' = mọi ngày, rồi CN..T7
const khoaO = (thu) => (thu == null ? '' : thu);

export default function DinhMuc({ vaiTro }) {
  const [dl, setDl] = useState(null);
  const [nhap, setNhap] = useState({});   // san_pham_id → { ['' | 0..6]: chuỗi }
  const [lech, setLech] = useState({});   // nhom id → chuỗi %
  const [loi, setLoi] = useState('');
  const [bao, setBao] = useState('');

  const tai = () => api.get('/kho/dinh-muc').then((r) => {
    setDl(r);
    setNhap(Object.fromEntries(r.mon.map((m) => [m.san_pham_id, Object.fromEntries(m.dinh_muc.map((d) => [khoaO(d.thu), String(d.so_luong)]))])));
    setLech(Object.fromEntries(r.nhom.map((n) => [n.id, n.lech_cho_phep == null ? '' : String(n.lech_cho_phep)])));
  }).catch((e) => setLoi(e.message));
  useEffect(() => { tai(); }, []);

  const lam = async (viec, loiBao) => {
    setLoi(''); setBao('');
    try { await viec(); setBao(loiBao); tai(); } catch (e) { setLoi(e.message); }
  };
  const luuMon = (m) => lam(() => api.put('/kho/dinh-muc', { san_pham_id: m.san_pham_id,
    dinh_muc: O.filter((t) => (nhap[m.san_pham_id]?.[t] ?? '') !== '').map((t) => ({ thu: t === '' ? null : t, so_luong: Number(nhap[m.san_pham_id][t]) })) }), `Đã lưu ${m.ten}`);
  const luuLech = (n) => lam(() => api.put(`/kho/nhom-cong-thuc/${n.id}`, { ten: n.ten, thu_tu: n.thu_tu, lech_cho_phep: lech[n.id] === '' ? null : Number(lech[n.id]) }), `Đã lưu ${n.ten}`);
  const doiCongTac = () => lam(() => api.put('/settings', { settings: { kho_px_nv_can_duyet: dl.nv_can_duyet ? '0' : '1' } }), 'Đã đổi công tắc');

  if (!dl) return loi ? <div className="kho-loi">{loi}</div> : <p>Đang tải…</p>;
  return (
    <div>
      {loi && <div className="kho-loi">{loi}</div>}
      {bao && <div className="kho-ok">{bao}</div>}
      {vaiTro === 'owner' && (
        <label className="kho-hang"><input type="checkbox" checked={dl.nv_can_duyet} onChange={doiCongTac} /> Nhân viên xuất kho cần duyệt</label>
      )}
      <h3 className="card-title">Định mức mỗi ngày (số phần)</h3>
      {!dl.mon.length && <p className="text-gray">Chưa có món làm sẵn.</p>}
      {dl.mon.map((m) => (
        <div key={m.san_pham_id} className="kho-the" style={{ cursor: 'default', marginBottom: '0.6rem' }}>
          <b>{m.ten}</b>
          <div className="kho-dinh-muc">
            {O.map((t) => (
              <label key={String(t)} className="kho-nho">{t === '' ? 'Mọi ngày' : THU[t]}
                <input className="input" type="number" min="0" step="any" inputMode="decimal" placeholder={t === '' ? '' : 'như trên'}
                  value={nhap[m.san_pham_id]?.[t] ?? ''} onChange={(e) => setNhap({ ...nhap, [m.san_pham_id]: { ...nhap[m.san_pham_id], [t]: e.target.value } })} />
              </label>
            ))}
          </div>
          <button className="btn btn-sm btn-primary" onClick={() => luuMon(m)}>Lưu</button>
        </div>
      ))}
      <h3 className="card-title">% lệch cho phép theo nhóm món</h3>
      <p className="kho-nho">Số thực ra lệch số chuẩn quá mức này → cảnh báo vàng (không chặn). Trống = không cảnh báo.</p>
      {dl.nhom.map((n) => (
        <div key={n.id} className="kho-dong">
          <span style={{ flex: 1 }}>{n.ten}</span>
          <input className="input" type="number" min="0" step="any" style={{ maxWidth: '6rem' }} value={lech[n.id] ?? ''} onChange={(e) => setLech({ ...lech, [n.id]: e.target.value })} />
          <span>%</span>
          <button className="btn btn-sm btn-outline" onClick={() => luuLech(n)}>Lưu</button>
        </div>
      ))}
    </div>
  );
}
