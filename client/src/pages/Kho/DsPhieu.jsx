/**
 * KHO-2a — danh sách phiếu: khung "Chờ duyệt" trên cùng (chủ / quản lý — số từ vòng hỏi của index.jsx), lọc loại / trạng thái / ngày,
 * nhãn "tự chốt". Bấm một phiếu → XemPhieu.
 */
import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { gio, TRANG_THAI } from './chung';

const LOAI = { PX: 'Xuất', PN: 'Nhập', DH: 'Đặt hàng', PS: 'Phát sinh', KK: 'Kiểm kê' };

function DongPhieu({ p, mo }) {
  return (
    <div className={`kho-the ${p.trang_thai === 'huy' ? 'ngung' : ''}`} onClick={() => mo(p.id)}>
      <b>{p.so_phieu} · {TRANG_THAI[p.trang_thai]}{p.ket_qua === 'tu_chot' && <span className="kho-thieu"> · tự chốt</span>}</b>
      <div className="kho-nho">{p.mon || LOAI[p.loai]}</div>
      <div className="kho-nho">{p.nguoi_tao} · {gio(p.tao_luc)}{p.so_lan_in > 0 && ` · đã in ${p.so_lan_in}`}</div>
    </div>
  );
}

export default function DsPhieu({ choDuyet, moPhieu }) {
  const [loc, setLoc] = useState({ loai: '', trang_thai: '', tu: '', den: '' });
  const [ds, setDs] = useState([]);
  const [loi, setLoi] = useState('');

  useEffect(() => {
    const qs = new URLSearchParams(Object.entries(loc).filter(([, v]) => v)).toString();
    api.get('/kho/phieu' + (qs ? '?' + qs : '')).then((r) => setDs(r.phieu)).catch((e) => setLoi(e.message));
  }, [loc]);
  const o = (ten, phanTu) => <label className="kho-nho">{ten}{phanTu}</label>;

  return (
    <div>
      {choDuyet.length > 0 && (
        <div className="kho-canh" style={{ display: 'block' }}>
          <b>Chờ duyệt ({choDuyet.length})</b>
          <div className="kho-luoi" style={{ marginTop: '0.5rem' }}>{choDuyet.map((p) => <DongPhieu key={p.id} p={p} mo={moPhieu} />)}</div>
        </div>
      )}
      <div className="kho-form" style={{ marginBottom: '0.75rem' }}>
        {o('Loại', <select className="input" value={loc.loai} onChange={(e) => setLoc({ ...loc, loai: e.target.value })}>
          <option value="">Tất cả</option>{Object.entries(LOAI).map(([ma, ten]) => <option key={ma} value={ma}>{ten}</option>)}</select>)}
        {o('Trạng thái', <select className="input" value={loc.trang_thai} onChange={(e) => setLoc({ ...loc, trang_thai: e.target.value })}>
          <option value="">Tất cả</option>{Object.entries(TRANG_THAI).map(([ma, ten]) => <option key={ma} value={ma}>{ten}</option>)}</select>)}
        {o('Từ ngày', <input className="input" type="date" value={loc.tu} onChange={(e) => setLoc({ ...loc, tu: e.target.value })} />)}
        {o('Đến ngày', <input className="input" type="date" value={loc.den} onChange={(e) => setLoc({ ...loc, den: e.target.value })} />)}
      </div>
      {loi && <div className="kho-loi">{loi}</div>}
      {!ds.length && <p className="text-gray">Không có phiếu.</p>}
      <div className="kho-luoi">{ds.map((p) => <DongPhieu key={p.id} p={p} mo={moPhieu} />)}</div>
    </div>
  );
}
