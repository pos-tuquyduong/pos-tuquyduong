/**
 * KHO-2b — Xử lý phát sinh, 4 bước: Chuyện gì xảy ra? → Món nào? (máy chủ chỉ gợi ý thứ liên quan) → Bao nhiêu? → Xem phiếu rồi mới gửi.
 * Quay lại từ bước 4 = chưa ghi gì. Máy chủ quyết tự duyệt / chờ duyệt (hạn mức nội bộ, công tắc) và trừ kho theo lô hạn gần trước.
 */
import { useState } from 'react';
import { api } from '../../utils/api';
import ChonNguyenLieu from './ChonNguyenLieu';
import { so, gio, maGuiMoi, veLuu, raHien, SU_CO } from './chung';

const khoaCua = (m) => (m.lo_id ? `lo${m.lo_id}` : m.nguyen_lieu_id ? `nl${m.nguyen_lieu_id}` : `sp${m.san_pham_id}`);

export default function PhatSinh({ moPhieu }) {
  const [buoc, setBuoc] = useState(1);
  const [suCo, setSuCo] = useState('');
  const [ds, setDs] = useState([]);
  const [chon, setChon] = useState({});   // khoá → lượng theo đơn vị hiện (chuỗi)
  const [ghiChu, setGhiChu] = useState('');
  const [loi, setLoi] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [maGui, setMaGui] = useState(maGuiMoi);

  const chonSuCo = async (ma) => {
    setLoi('');
    try {
      const r = await api.get(`/kho/phat-sinh/goi-y?su_co=${ma}`);
      setDs(r.muc.map((m) => ({ ...m, id: khoaCua(m), ton_hien: m.con == null ? null : raHien(m.con, m.he_so_doi) })));
      setSuCo(ma); setChon({}); setMaGui(maGuiMoi()); setBuoc(2);
    } catch (e) { setLoi(e.message); }
  };
  const theoKhoa = new Map(ds.map((m) => [m.id, m]));
  const daChon = Object.keys(chon).filter((k) => theoKhoa.has(k));
  const muc = daChon.map((k) => { const m = theoKhoa.get(k); return { lo_id: m.lo_id, nguyen_lieu_id: m.lo_id ? null : m.nguyen_lieu_id, san_pham_id: m.lo_id ? null : m.san_pham_id,
    luong: veLuu(chon[k], m.he_so_doi) }; });
  const gui = async () => {
    setLoi(''); setDangGui(true);
    try { const r = await api.post('/kho/phieu-phat-sinh', { su_co: suCo, ghi_chu: ghiChu, muc, ma_gui: maGui }); moPhieu(r.phieu.id); } catch (e) { setLoi(e.message); setDangGui(false); }
  };
  const ten = (m) => `${m.ten}${m.lo_id && m.han_dung ? ` (lô hạn ${gio(m.han_dung)})` : ''}`;

  return (
    <div>
      {buoc > 1 && <div className="kho-hang"><button className="btn btn-outline" onClick={() => setBuoc(buoc - 1)}>← Quay lại</button><b>{SU_CO[suCo]} · bước {buoc}/4</b></div>}
      {buoc === 1 && (
        <>
          <h4 className="kho-muc">1 · Chuyện gì xảy ra?</h4>
          <div className="kho-buoc">{Object.entries(SU_CO).map(([ma, t]) => <button key={ma} className="btn btn-outline" onClick={() => chonSuCo(ma)}>{t}</button>)}</div>
        </>
      )}
      {buoc === 2 && (
        <>
          <h4 className="kho-muc">2 · Món nào?</h4>
          <ChonNguyenLieu ds={ds} daChon={daChon} tabDau={{ ten: 'Tất cả', loc: () => true }}
            chon={(m) => { const c = { ...chon }; if (m.id in c) delete c[m.id]; else c[m.id] = ''; setChon(c); }}>
            <div className="kho-nho">{daChon.map((k) => theoKhoa.get(k).ten).join(', ')}</div>
          </ChonNguyenLieu>
          <button className="btn btn-primary kho-nut-lon" disabled={!daChon.length} onClick={() => setBuoc(3)}>Tiếp</button>
        </>
      )}
      {buoc === 3 && (
        <>
          <h4 className="kho-muc">3 · Bao nhiêu?</h4>
          {daChon.map((k) => { const m = theoKhoa.get(k); return (
            <div key={k} className="kho-dong"><span style={{ flex: 1 }}>{ten(m)}{m.ton_hien != null && <span className="kho-nho"> · còn {so(m.ton_hien)}</span>}</span>
              <input className="input kho-hep" type="number" min="0" step="any" inputMode="decimal" value={chon[k]} onChange={(e) => setChon({ ...chon, [k]: e.target.value })} />
              {m.don_vi}</div>
          ); })}
          <button className="btn btn-primary kho-nut-lon" disabled={!muc.every((x) => x.luong > 0)} onClick={() => setBuoc(4)}>Xem phiếu</button>
        </>
      )}
      {buoc === 4 && (
        <>
          <h4 className="kho-muc">4 · Xem phiếu trước khi gửi — {SU_CO[suCo]}</h4>
          {daChon.map((k) => { const m = theoKhoa.get(k); return (
            <div key={k} className="kho-mon"><div className="kho-dong"><span style={{ flex: 1 }}>{ten(m)}</span><b>{so(chon[k])} {m.don_vi}</b></div>
              {(m.mot_phan || []).map((n) => <div key={n.nguyen_lieu_id} className="kho-nho">· {n.ten}: {so(raHien(n.luong * Number(chon[k]), n.he_so_doi))} {n.don_vi}</div>)}
            </div>
          ); })}
          <input className="input" placeholder={suCo === 'khac' ? 'Ghi rõ chuyện gì (bắt buộc)' : 'Ghi chú (nếu có)'} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)}
            style={{ width: '100%', marginTop: '0.5rem' }} />
          {loi && <div className="kho-loi">{loi}</div>}
          <button className="btn btn-primary kho-nut-lon" disabled={dangGui || (suCo === 'khac' && !ghiChu.trim())} onClick={gui}>{dangGui ? 'Đang gửi…' : 'Gửi phiếu'}</button>
        </>
      )}
      {buoc < 4 && loi && <div className="kho-loi">{loi}</div>}
    </div>
  );
}
