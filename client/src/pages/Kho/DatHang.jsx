/**
 * KHO-2b — Đặt hàng: thêm theo công thức (chọn món + số phần → lượng từng nguyên liệu nhảy theo) hoặc từng nguyên liệu (bộ chọn ô chạm).
 * Bảng "Đơn sẽ gửi" gộp nguyên liệu trùng — chỉ để XEM; máy chủ tự triển khai + gộp lại khi ghi và tự quyết duyệt theo hạn mức.
 */
import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import ChonNguyenLieu from './ChonNguyenLieu';
import { so, maGuiMoi, veLuu, raHien } from './chung';

export default function DatHang({ moPhieu }) {
  const [gy, setGy] = useState(null);
  const [mon, setMon] = useState({});   // san_pham_id → số phần (chuỗi)
  const [chonMon, setChonMon] = useState('');
  const [le, setLe] = useState({});   // nguyen_lieu_id → lượng theo đơn vị hiện (chuỗi)
  const [ncc, setNcc] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const [loi, setLoi] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [maGui] = useState(maGuiMoi);

  useEffect(() => { api.get('/kho/goi-y-nhap').then(setGy).catch((e) => setLoi(e.message)); }, []);
  if (!gy) return loi ? <div className="kho-loi">{loi}</div> : <p>Đang tải…</p>;
  const nl = gy.nguyen_lieu.map((n) => ({ ...n, don_vi: n.don_vi_hien || n.don_vi_luu }));
  const theoId = new Map(nl.map((n) => [n.id, n]));
  const tenMon = new Map(gy.mon.map((m) => [m.san_pham_id, m]));

  // Xem trước: Σ (1 phần × số phần) + lẻ, theo đơn vị lưu
  const gop = new Map();
  const cong = (id, luong) => gop.set(id, (gop.get(id) || 0) + luong);
  for (const [id, sp] of Object.entries(mon)) for (const d of tenMon.get(Number(id))?.mot_phan || []) cong(d.nguyen_lieu_id, d.luong * (Number(sp) || 0));
  for (const [id, sl] of Object.entries(le)) cong(Number(id), veLuu(Number(sl) || 0, theoId.get(Number(id))?.he_so_doi));
  const xem = [...gop].filter(([, l]) => l > 0);
  const monGui = Object.entries(mon).map(([id, sp]) => ({ san_pham_id: Number(id), so_phan: Number(sp) }));
  const leGui = Object.entries(le).map(([id, sl]) => ({ nguyen_lieu_id: Number(id), luong: veLuu(sl, theoId.get(Number(id))?.he_so_doi) }));
  const hopLe = (monGui.length || leGui.length) && monGui.every((m) => m.so_phan > 0) && leGui.every((d) => d.luong > 0);

  const gui = async () => {
    setLoi(''); setDangGui(true);
    try {
      const r = await api.post('/kho/phieu-dat', { mon: monGui, nguyen_lieu: leGui, nha_cung_cap_id: ncc || null, ghi_chu: ghiChu, ma_gui: maGui });
      moPhieu(r.phieu.id);
    } catch (e) { setLoi(e.message); setDangGui(false); }
  };

  return (
    <div>
      <h4 className="kho-muc">Theo công thức</h4>
      <div className="kho-hang">
        <select className="input" value={chonMon} onChange={(e) => setChonMon(e.target.value)}>
          <option value="">— chọn món —</option>{gy.mon.map((m) => <option key={m.san_pham_id} value={m.san_pham_id}>{m.ten}</option>)}
        </select>
        <button className="btn btn-outline" disabled={!chonMon} onClick={() => { setMon({ ...mon, [chonMon]: mon[chonMon] || '1' }); setChonMon(''); }}>Thêm</button>
      </div>
      {Object.entries(mon).map(([id, sp]) => (
        <div key={id} className="kho-dong">
          <span style={{ flex: 1 }}>{tenMon.get(Number(id))?.ten}</span>
          <input className="input kho-hep" type="number" min="0" step="any" inputMode="decimal" value={sp} onChange={(e) => setMon({ ...mon, [id]: e.target.value })} /> phần
          <button className="kho-lien-ket" onClick={() => { const m = { ...mon }; delete m[id]; setMon(m); }}>Bỏ</button>
        </div>
      ))}
      <h4 className="kho-muc">Từng nguyên liệu</h4>
      <ChonNguyenLieu ds={nl} nhom={gy.nhom} hayMua={gy.hay_mua} daChon={Object.keys(le).map(Number)}
        chon={(n) => { const m = { ...le }; if (n.id in m) delete m[n.id]; else m[n.id] = ''; setLe(m); }}>
        {Object.entries(le).map(([id, sl]) => (
          <div key={id} className="kho-dong">
            <span style={{ flex: 1 }}>{theoId.get(Number(id))?.ten}</span>
            <input className="input kho-hep" type="number" min="0" step="any" inputMode="decimal" value={sl} onChange={(e) => setLe({ ...le, [id]: e.target.value })} />
            {theoId.get(Number(id))?.don_vi}
          </div>
        ))}
      </ChonNguyenLieu>
      <h4 className="kho-muc">Đơn sẽ gửi ({xem.length} món)</h4>
      {xem.map(([id, luong]) => (
        <div key={id} className="kho-dong"><span style={{ flex: 1 }}>{theoId.get(id)?.ten}</span>
          <b>{so(raHien(luong, theoId.get(id)?.he_so_doi))} {theoId.get(id)?.don_vi}</b></div>
      ))}
      <div className="kho-form" style={{ marginTop: '0.5rem' }}>
        <label>Nhà cung cấp<select className="input" value={ncc} onChange={(e) => setNcc(e.target.value)}>
          <option value="">—</option>{gy.nha_cung_cap.map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}</select></label>
        <label>Ghi chú<input className="input" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} /></label>
      </div>
      {loi && <div className="kho-loi">{loi}</div>}
      <button className="btn btn-primary kho-nut-lon" disabled={dangGui || !hopLe} onClick={gui}>{dangGui ? 'Đang gửi…' : 'Gửi đơn đặt hàng'}</button>
    </div>
  );
}
