/**
 * KHO-GON-1 — Cài đặt kho (chủ / quản lý): số ca + cho quản lý chỉnh tồn tay (CHỈ chủ quán đổi — Q2), việc cố định hằng ngày (thêm, sửa, lên / xuống,
 * xoá việc thường), ngưỡng cảnh báo + "Kiểm hằng ngày" từng nguyên liệu. Sửa mẫu việc áp dụng từ ngày sau (máy chủ).
 */
import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { baoXong, baoLoiTu } from '../../components/thongBaoKho.js';

const GIAO = { nv: 'Nhân viên', sang: 'Ca sáng / đầu ngày', toi: 'Ca tối / cuối ngày', ql: 'Quản lý', tat_ca: 'Mọi người' };
const LOAI = { bangiao: 'Nhận bàn giao', phache: 'Pha chế', kiemke: 'Kiểm kê' };
const MAU_TRONG = { ten: '', giao: 'nv', gio_han: '' };

export default function CaiDatKho({ vaiTro }) {
  const chuQuan = vaiTro === 'owner';
  const [cd, setCd] = useState(null);
  const [mau, setMau] = useState([]);
  const [nl, setNl] = useState([]);
  const [sua, setSua] = useState(null);   // { id?, ten, giao, gio_han }
  const [nguong, setNguong] = useState({});   // id → { ton_toi_thieu, kiem_hang_ngay }
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState('');

  const tai = () => Promise.all([api.get('/kho/cai-dat-viec'), api.get('/kho/viec-mau'), api.get('/kho/nguyen-lieu')])
    .then(([c, m, n]) => { setCd(c); setMau(m.mau); setNl(n.nguyen_lieu.filter((x) => x.dang_dung)); setNguong({}); }).catch((e) => setLoi(e.message));
  useEffect(() => { tai(); }, []);
  const ghi = async (lam, viec, xong) => {
    setDang(true);
    try { await lam(); baoXong(xong); await tai(); return true; } catch (e) { baoLoiTu(viec, e); return false; } finally { setDang(false); }
  };
  if (!cd) return loi ? <div className="kho-loi">{loi}</div> : <p>Đang tải…</p>;
  const luuMau = async () => {
    const than = { ten: sua.ten, giao: sua.giao, gio_han: sua.gio_han || null };
    if (await ghi(() => (sua.id ? api.put(`/kho/viec-mau/${sua.id}`, than) : api.post('/kho/viec-mau', than)), 'lưu việc', 'Đã lưu — áp dụng từ ngày mai')) setSua(null);
  };
  const oNguong = (n) => ({ ton_toi_thieu: n.ton_toi_thieu ?? '', kiem_hang_ngay: Number(n.kiem_hang_ngay) || 0, ...nguong[n.id] });

  return (
    <div>
      <h4 className="kho-muc">Số ca</h4>
      <div className="kho-hang">
        {[1, 2].map((s) => <button key={s} className={`btn ${cd.so_ca === s ? 'btn-primary' : 'btn-outline'}`} disabled={!chuQuan || dang}
          onClick={() => ghi(() => api.put('/kho/cai-dat-viec', { so_ca: s }), 'đổi số ca', 'Đã đổi số ca')}>{s === 1 ? '1 ca (một người cả ngày)' : '2 ca (sáng / tối)'}</button>)}
      </div>
      <label className="kho-hang"><input type="checkbox" checked={cd.ql_chinh_tay} disabled={!chuQuan || dang}
        onChange={(e) => ghi(() => api.put('/kho/cai-dat-viec', { ql_chinh_tay: e.target.checked ? 1 : 0 }), 'đổi quyền chỉnh tay', 'Đã lưu')} /> Cho quản lý chỉnh tồn tay</label>
      {!chuQuan && <p className="kho-nho">Chỉ chủ quán đổi số ca và quyền chỉnh tồn tay.</p>}

      <h4 className="kho-muc">Việc cố định hằng ngày</h4>
      {mau.map((m, i) => (
        <div key={m.id} className="kho-dong kho-the" style={{ cursor: 'default' }}>
          <span style={{ flex: 1 }}><b>{i + 1}. {m.ten}</b>
            <span className="kho-nho">{m.gio_han && `trước ${m.gio_han} · `}{GIAO[m.giao]}{LOAI[m.loai] && ` · ${LOAI[m.loai]}`}</span></span>
          <button className="btn btn-sm btn-outline" aria-label="Lên" disabled={dang || !i} onClick={() => ghi(() => api.post(`/kho/viec-mau/${m.id}/len`), 'đổi thứ tự', 'Đã đổi thứ tự')}>↑</button>
          <button className="btn btn-sm btn-outline" aria-label="Xuống" disabled={dang || i === mau.length - 1} onClick={() => ghi(() => api.post(`/kho/viec-mau/${m.id}/xuong`), 'đổi thứ tự', 'Đã đổi thứ tự')}>↓</button>
          <button className="btn btn-sm btn-outline" onClick={() => setSua({ id: m.id, ten: m.ten, giao: m.giao, gio_han: m.gio_han || '' })}>Sửa</button>
          <button className="btn btn-sm btn-outline" disabled={dang || m.loai !== 'thuong'} onClick={() => ghi(() => api.delete(`/kho/viec-mau/${m.id}`), 'xoá việc', 'Đã xoá')}>Xoá</button>
        </div>
      ))}
      {!sua && <button className="btn btn-outline" onClick={() => setSua(MAU_TRONG)}>+ Thêm việc cố định</button>}
      {sua && (
        <div className="kho-hang card" style={{ padding: '0.75rem' }}>
          <input className="input" placeholder="Tên việc" value={sua.ten} onChange={(e) => setSua({ ...sua, ten: e.target.value })} />
          <select className="input" style={{ flex: 0, minWidth: '9rem' }} value={sua.giao} onChange={(e) => setSua({ ...sua, giao: e.target.value })}>
            {Object.entries(GIAO).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
          <input className="input kho-hep" type="time" aria-label="Làm trước giờ (không bắt buộc)" value={sua.gio_han} onChange={(e) => setSua({ ...sua, gio_han: e.target.value })} />
          <button className="btn btn-primary" disabled={dang || !sua.ten.trim()} onClick={luuMau}>Lưu</button>
          <button className="btn btn-outline" onClick={() => setSua(null)}>Thôi</button>
        </div>
      )}

      <h4 className="kho-muc">Ngưỡng cảnh báo &amp; kiểm hằng ngày</h4>
      <p className="kho-nho">Dưới ngưỡng → dải cam ở Việc hôm nay. Tick "Kiểm hằng ngày" → có trong bảng nhận bàn giao / kiểm kê (hàng pha sẵn luôn có).</p>
      {nl.map((n) => (
        <div key={n.id} className="kho-dong">
          <span style={{ flex: 1 }}>{n.ten}</span>
          <input className="input kho-hep" type="number" min="0" step="any" aria-label={`Ngưỡng ${n.ten}`} value={oNguong(n).ton_toi_thieu}
            onChange={(e) => setNguong({ ...nguong, [n.id]: { ...oNguong(n), ton_toi_thieu: e.target.value } })} />
          <span className="kho-nho">{n.don_vi_luu}</span>
          <label className="kho-nho"><input type="checkbox" checked={oNguong(n).kiem_hang_ngay === 1}
            onChange={(e) => setNguong({ ...nguong, [n.id]: { ...oNguong(n), kiem_hang_ngay: e.target.checked ? 1 : 0 } })} /> Kiểm hằng ngày</label>
        </div>
      ))}
      <button className="btn btn-primary" disabled={dang || !Object.keys(nguong).length}
        onClick={() => ghi(() => api.put('/kho/nguong', { nguyen_lieu: Object.entries(nguong).map(([id, x]) => ({ id: Number(id), ...x })) }), 'lưu ngưỡng', 'Đã lưu ngưỡng')}>Lưu ngưỡng</button>
    </div>
  );
}
