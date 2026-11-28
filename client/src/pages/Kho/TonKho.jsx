/**
 * KHO-2a — Tồn kho: Nguyên liệu / Thành phẩm, tab nhóm, ô tìm (gõ không dấu), sắp xếp. Dưới tồn tối thiểu → vàng; âm → đỏ;
 * lô sắp hết hạn → đỏ, quá hạn → đỏ đậm (cờ do máy chủ tính). Cột giá chỉ hiện khi máy chủ trả (nhân viên không nhận giá).
 * KHO-GON-1: "Chỉnh tồn tay" ở từng thứ khi máy chủ báo duoc_chinh_tay (chủ quán; quản lý khi được bật) — số đang có thật + lý do → phiếu KK.
 */
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../utils/api';
import { baoXong, baoLoiTu } from '../../components/thongBaoKho.js';
import { boDau, so, tien, gio, maGuiMoi, veLuu } from './chung';

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
  const [chinh, setChinh] = useState(null);   // { thu, so, ly_do, ma_gui }
  const [dang, setDang] = useState(false);

  const tai = () => api.get('/kho/ton').then(setDl).catch((e) => setLoi(e.message));
  useEffect(() => { tai(); }, []);
  const luuChinh = async () => {
    setDang(true);
    try {
      const t = chinh.thu;
      const kq = await api.post('/kho/chinh-tay', { nguyen_lieu_id: t.id, san_pham_id: t.san_pham_id, thuc: veLuu(chinh.so, t.he_so_doi), ly_do: chinh.ly_do, moc: dl.moc,
        moc_luc: dl.moc_luc, ma_gui: chinh.ma_gui });
      baoXong(kq.khong_doi ? `Không có gì thay đổi — ${t.ten} đã đúng số đó (có thể lần bấm trước đã lưu)` : `Đã chỉnh tồn ${t.ten}`);
      setChinh(null);
      await tai();
    } catch (e) { baoLoiTu('chỉnh tồn tay', e); } finally { setDang(false); }
  };
  // Q11: số máy chủ DÙNG để tính lệch — có phiếu chờ thì lấy ton_kiem (đơn vị lưu → hiện), không thì tồn đang hiện
  const mayGhi = (t) => {
    const k = (dl.ton_kiem || []).find((x) => (t.id ? x.nguyen_lieu_id === t.id : x.san_pham_id === t.san_pham_id));
    const he = t.he_so_doi || 1;
    return k ? { so: k.ton / he, cho: k.cho / he } : { so: t.ton_hien ?? t.ton, cho: 0 };
  };
  const nutChinh = (t) => dl.duoc_chinh_tay && (
    <button className="btn btn-sm btn-outline" onClick={() => setChinh({ thu: t, so: '', ly_do: '', ma_gui: maGuiMoi() })}>Chỉnh tồn tay</button>);
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
      {chinh && (
        <div className="card kho-hang" style={{ padding: '0.75rem' }}>
          <b>Chỉnh tồn tay · {chinh.thu.ten}</b>
          <span className="kho-nho">Máy ghi {so(mayGhi(chinh.thu).so)} {chinh.thu.don_vi_hien || chinh.thu.don_vi_luu || 'phần'}
            {mayGhi(chinh.thu).cho ? ` — đã tính phiếu chờ duyệt ${mayGhi(chinh.thu).cho > 0 ? '+' : '−'}${so(Math.abs(mayGhi(chinh.thu).cho))}` : ''}. Gõ số đang có thật.</span>
          <input className="input kho-hep" type="number" min="0" step="any" inputMode="decimal" aria-label="Số đang có thật" value={chinh.so}
            onChange={(e) => setChinh({ ...chinh, so: e.target.value })} />
          <input className="input" placeholder="Lý do (bắt buộc)" value={chinh.ly_do} onChange={(e) => setChinh({ ...chinh, ly_do: e.target.value })} />
          <button className="btn btn-primary" disabled={dang || chinh.so === '' || !(Number(chinh.so) >= 0) || !chinh.ly_do.trim()} onClick={luuChinh}>Lưu</button>
          <button className="btn btn-outline" onClick={() => setChinh(null)}>Thôi</button>
        </div>
      )}
      <div className="kho-luoi">
        {loai === 'nl' && ds.map((n) => (
          <div key={n.id} className={`kho-the ${n.am ? 'kho-am' : n.duoi_toi_thieu ? 'kho-vang' : ''} ${n.dang_dung ? '' : 'ngung'}`}>
            <b>{n.ten}</b>
            <div>{so(n.ton_hien)} {n.don_vi_hien || n.don_vi_luu}{n.am && ' · âm'}{!n.am && n.duoi_toi_thieu && ` · dưới tối thiểu ${so(n.ton_toi_thieu)}`}</div>
            <div className="kho-nho">{n.nhom_ten || 'Chưa xếp nhóm'}{'gia_nhap' in n && ` · ${tien(n.gia_nhap)}/${n.don_vi_luu}`}</div>
            {nutChinh(n)}
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
            {nutChinh(m)}
          </div>
        ))}
      </div>
    </div>
  );
}
