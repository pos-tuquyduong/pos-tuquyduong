/**
 * KHO-GON-1 — một màn hai chế độ. Kiểm kê cuối ngày (kiemke): ĐẾM MÙ — không hiện số máy, mọi dòng phải gõ số (chủ quán 26.11 Q1); "Chốt & in"
 * → in bảng chốt có chỗ ký (khung in phiếu kho). Nhận bàn giao (bangiao): hiện "Chốt" tối qua, ô trống = đúng, dòng lệch bắt buộc ghi chú.
 * Máy chủ tự tính lệch (so với tồn lúc màn mở — moc), ghi phiếu KK đã duyệt ngay. Màn hẹp: mỗi dòng một thẻ, nút chốt dính đáy màn.
 */
import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { baoXong, baoLoiTu } from '../../components/thongBaoKho.js';
import { so, gio, maGuiMoi, veLuu, raHien } from './chung';

const khoa = (d) => (d.nguyen_lieu_id ? 'nl' + d.nguyen_lieu_id : 'sp' + d.san_pham_id);

export default function KiemKe({ cheDo, xong }) {
  const laKiemKe = cheDo === 'kiemke';
  const [dl, setDl] = useState(null);
  const [nhap, setNhap] = useState({});   // khoá → { so, ghi }
  const [chung, setChung] = useState('');
  const [loi, setLoi] = useState('');
  const [dang, setDang] = useState(false);
  const [daChot, setDaChot] = useState(null);
  const [maGui] = useState(maGuiMoi);

  useEffect(() => { api.get(`/kho/kiem-ke?che_do=${cheDo}`).then(setDl).catch((e) => setLoi(e.message)); }, [cheDo]);
  if (!dl) return loi ? <div className="kho-loi">{loi}</div> : <p>Đang tải…</p>;

  const o = (d) => nhap[khoa(d)] || { so: '', ghi: '' };
  const datO = (d, x) => setNhap({ ...nhap, [khoa(d)]: { ...o(d), ...x } });
  const lechCua = (d) => (!laKiemKe && o(d).so !== '' ? veLuu(o(d).so, d.he_so_doi) - d.chot : 0);
  const thieu = laKiemKe ? dl.dong.filter((d) => o(d).so === '').length : 0;
  const lech = dl.dong.filter((d) => Math.abs(lechCua(d)) > 1e-9);
  const luu = async () => {
    setDang(true);
    try {
      const r = await api.post('/kho/kiem-ke', { che_do: cheDo, moc: dl.moc, moc_luc: dl.moc_luc, ghi_chu_chung: chung, ma_gui: maGui,
        dong: dl.dong.map((d) => ({ nguyen_lieu_id: d.nguyen_lieu_id, san_pham_id: d.san_pham_id, thuc: o(d).so === '' ? '' : veLuu(o(d).so, d.he_so_doi), ghi_chu: o(d).ghi })) });
      baoXong(laKiemKe ? 'Đã chốt kiểm kê' : 'Đã nhận ca');
      if (!laKiemKe) return xong();
      setDaChot(r);
      setTimeout(() => window.print(), 300);   // lỗi máy in không đụng sổ — đã ghi xong mới in
    } catch (e) { baoLoiTu(laKiemKe ? 'chốt kiểm kê' : 'nhận ca', e); } finally { setDang(false); }
  };

  if (daChot) {
    return (
      <div>
        <div className="kho-in">
          <div className="kho-ban">
            <h3 className="card-title">Bảng chốt cuối ngày · {gio(dl.moc_luc)}</h3>
            {daChot.anh.map((a) => (
              <div key={khoa(a)} className="kho-dong"><span style={{ flex: 1 }}>{a.ten}</span>
                <b>{so(raHien(a.thuc, dl.dong.find((d) => khoa(d) === khoa(a))?.he_so_doi))} {dl.dong.find((d) => khoa(d) === khoa(a))?.don_vi}</b>
                {a.ghi_chu && <span className="kho-nho"> · {a.ghi_chu}</span>}</div>
            ))}
            {chung && <div className="kho-nho">Dặn ca sau: {chung}</div>}
            <div className="kho-nho" style={{ marginTop: '0.6rem' }}>Người chốt: ________ · Người nhận ca: ________</div>
          </div>
        </div>
        <div className="kho-hang kho-khong-in" style={{ marginTop: '1rem' }}>
          <button className="btn btn-outline" onClick={() => window.print()}>In bảng chốt</button>
          <button className="btn btn-primary" onClick={xong}>Về Việc hôm nay</button>
        </div>
      </div>
    );
  }
  return (
    <div className="kho-kiem">
      <div className="kho-hang"><button className="btn btn-outline btn-sm" onClick={xong}>← Việc hôm nay</button>
        <b>{laKiemKe ? 'Kiểm kê cuối ngày' : 'Nhận bàn giao'}</b></div>
      <p className="kho-nho">{laKiemKe ? 'Đếm thực tế, gõ số cho MỌI dòng (máy không hiện số để đếm khách quan).'
        : `So với số chốt ${dl.chua_co_chot ? '(chưa có lần chốt — so với máy)' : `lúc ${gio(dl.chot_luc)}`}. Ô trống = đúng.`} Dòng lệch phải ghi chú.</p>
      {!laKiemKe && dl.ca_truoc_dan && <div className="kho-canh"><b>Ca trước dặn:</b> {dl.ca_truoc_dan}</div>}
      {!dl.dong.length && <p className="text-gray">Chưa có thứ nào để kiểm — tick "Kiểm hằng ngày" ở Cài đặt kho.</p>}
      {dl.dong.map((d) => {
        const c = lechCua(d);
        return (
          <div key={khoa(d)} className={`kho-the kho-dong ${Math.abs(c) > 1e-9 ? 'kho-vang' : ''}`} style={{ cursor: 'default' }}>
            <span style={{ flex: '1 1 100%' }}><b>{d.ten}</b>
              {!laKiemKe && <span className="kho-nho">{d.chua_co_chot ? 'Máy' : 'Chốt'} {so(raHien(d.chot, d.he_so_doi))} {d.don_vi}{Math.abs(c) > 1e-9 && ` · lệch ${c > 0 ? '+' : ''}${so(raHien(c, d.he_so_doi))}`}</span>}</span>
            <input className="input kho-hep" type="number" min="0" step="any" inputMode="decimal" aria-label={`Thực tế ${d.ten}`}
              placeholder={laKiemKe ? 'Đếm' : String(so(raHien(d.chot, d.he_so_doi)))} value={o(d).so} onChange={(e) => datO(d, { so: e.target.value })} />
            <span className="kho-nho">{d.don_vi}</span>
            <input className="input" aria-label={`Ghi chú ${d.ten}`} placeholder={Math.abs(c) > 1e-9 ? 'Vì sao lệch? (bắt buộc)' : 'Ghi chú (nếu có)'} value={o(d).ghi}
              onChange={(e) => datO(d, { ghi: e.target.value })} />
          </div>
        );
      })}
      <label className="kho-nho" style={{ display: 'block', marginTop: '0.5rem' }}>Ghi chú chung cho {laKiemKe ? 'ca sau' : 'ca này'}
        <input className="input" value={chung} onChange={(e) => setChung(e.target.value)} placeholder="vd: máy xay kêu, còn 1 bao đá" /></label>
      <div className="kho-chan">
        <b>{laKiemKe ? (thieu ? `Còn ${thieu} dòng chưa gõ` : 'Đã gõ đủ') : lech.length ? `${lech.length} dòng lệch` : 'Tất cả đúng'}</b>
        <button className="btn btn-primary" disabled={dang || thieu > 0 || lech.some((d) => !o(d).ghi.trim())} onClick={luu}>
          {dang ? 'Đang lưu…' : laKiemKe ? 'Chốt & in' : lech.length ? 'Nhận ca' : 'Nhận ca — đúng hết'}</button>
      </div>
    </div>
  );
}
