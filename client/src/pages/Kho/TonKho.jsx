/**
 * KHO-2a — Tồn kho: Nguyên liệu / Thành phẩm, tab nhóm, ô tìm (gõ không dấu), sắp xếp. Dưới tồn tối thiểu → vàng; âm → đỏ;
 * lô sắp hết hạn → đỏ, quá hạn → đỏ đậm (cờ do máy chủ tính). Cột giá chỉ hiện khi máy chủ trả (nhân viên không nhận giá).
 */
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../utils/api';
import { boDau, so, tien, gio } from './chung';

const SAP_XEP = {
  ten: (a, b) => a.ten.localeCompare(b.ten, 'vi'),
  ton: (a, b) => a.ton - b.ton,
  han: (a, b) => String(a.lo?.[0]?.han_dung || '9').localeCompare(String(b.lo?.[0]?.han_dung || '9')),
};
const HAN = { sap_het: ['kho-am', 'sắp hết hạn'], qua_han: ['kho-am kho-dam', 'quá hạn'] };

export default function TonKho() {
  const [dl, setDl] = useState(null);
  const [loi, setLoi] = useState('');
  const [loai, setLoai] = useState('nl');
  const [nhom, setNhom] = useState('tat_ca');
  const [tim, setTim] = useState('');
  const [sapXep, setSapXep] = useState('ten');

  useEffect(() => { api.get('/kho/ton').then(setDl).catch((e) => setLoi(e.message)); }, []);
  const ds = useMemo(() => {
    if (!dl) return [];
    const t = boDau(tim.trim());
    return (loai === 'nl' ? dl.nguyen_lieu : dl.thanh_pham).filter((r) => nhom === 'tat_ca' || r.nhom_id === nhom)
      .filter((r) => !t || boDau(r.ten).includes(t)).sort(SAP_XEP[sapXep]);
  }, [dl, loai, nhom, tim, sapXep]);

  if (!dl) return loi ? <div className="kho-loi">{loi}</div> : <p>Đang tải…</p>;
  const dsNhom = loai === 'nl' ? dl.nhom_nguyen_lieu : dl.nhom_cong_thuc;
  return (
    <div>
      <div className="kho-hang">
        <button className={`btn ${loai === 'nl' ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setLoai('nl'); setNhom('tat_ca'); setSapXep('ten'); }}>Nguyên liệu</button>
        <button className={`btn ${loai === 'tp' ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setLoai('tp'); setNhom('tat_ca'); }}>Thành phẩm</button>
      </div>
      <div className="kho-tabs">
        {[{ id: 'tat_ca', ten: 'Tất cả' }, ...dsNhom].map((n) => (
          <button key={n.id} className={`kho-tab ${nhom === n.id ? 'on' : ''}`} onClick={() => setNhom(n.id)}>{n.ten}</button>
        ))}
      </div>
      <div className="kho-hang">
        <input className="input" placeholder="Tìm (gõ không dấu được)" value={tim} onChange={(e) => setTim(e.target.value)} />
        <select className="input" style={{ flex: 0, minWidth: '9rem' }} value={sapXep} onChange={(e) => setSapXep(e.target.value)}>
          <option value="ten">Theo tên</option><option value="ton">Tồn ít trước</option>{loai === 'tp' && <option value="han">Hạn gần trước</option>}
        </select>
      </div>
      <div className="kho-luoi">
        {loai === 'nl' && ds.map((n) => (
          <div key={n.id} className={`kho-the ${n.am ? 'kho-am' : n.duoi_toi_thieu ? 'kho-vang' : ''} ${n.dang_dung ? '' : 'ngung'}`}>
            <b>{n.ten}</b>
            <div>{so(n.ton_hien)} {n.don_vi_hien || n.don_vi_luu}{n.am && ' · âm'}{!n.am && n.duoi_toi_thieu && ` · dưới tối thiểu ${so(n.ton_toi_thieu)}`}</div>
            <div className="kho-nho">{n.nhom_ten || 'Chưa xếp nhóm'}{'gia_nhap' in n && ` · ${tien(n.gia_nhap)}/${n.don_vi_luu}`}</div>
          </div>
        ))}
        {loai === 'tp' && ds.map((m) => (
          <div key={m.san_pham_id} className="kho-the">
            <b>{m.ten} — {so(m.ton)} phần</b>
            {!m.lo.length && <div className="kho-nho">hết</div>}
            {m.lo.map((l) => (
              <div key={l.id} className={`kho-nho ${HAN[l.han]?.[0] || ''}`}>
                lô {so(l.con)} · {l.han_dung ? `hạn ${gio(l.han_dung)}` : 'chưa có hạn'}{HAN[l.han] && ` · ${HAN[l.han][1]}`}
                {'gia_von' in l && l.gia_von != null && ` · ${tien(l.gia_von)}/phần`}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
