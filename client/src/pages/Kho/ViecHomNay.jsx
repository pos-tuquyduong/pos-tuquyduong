/**
 * KHO-GON-1 — Việc hôm nay (tab ĐẦU của Kho, mọi vai trò): việc theo thứ tự (máy chủ sinh từ mẫu, lọc theo vai trò / ca, cờ quá giờ), nút Xong
 * (việc thường) / Làm (bàn giao · pha sẵn · kiểm kê mở màn của nó), + Việc phát sinh, dải cam nguyên liệu dưới ngưỡng. Chủ / quản lý thêm khung
 * Diễn biến hôm nay (Đã xem riêng từng người) và Cần chú ý. Hai ca: nhân viên chọn ca, nhớ trong ngày trên máy này (localStorage — mất thì chọn lại).
 */
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { baoXong, baoLoiTu } from '../../components/thongBaoKho.js';
import { so, gio } from './chung';

const GIAO_1CA = { nv: 'Nhân viên', sang: 'Nhân viên · đầu ngày', toi: 'Nhân viên · cuối ngày', ql: 'Quản lý', tat_ca: 'Mọi người' };
const GIAO_2CA = { nv: 'Nhân viên đang ca', sang: 'Ca sáng', toi: 'Ca tối', ql: 'Quản lý', tat_ca: 'Mọi người' };
const LAM = { bangiao: 'bg', phache: 'pc', kiemke: 'kk' };
const GOI_Y = ['Hết đá — gọi đá', 'Gọi thêm đường', 'Máy xay kêu — báo sửa', 'Khách đặt nhiều — pha thêm'];
const KHOA_CA = 'kho_ca_hom_nay';
const docCa = (ngay) => { try { const x = JSON.parse(localStorage.getItem(KHOA_CA) || 'null'); return x?.ngay === ngay ? x.ca : null; } catch { return null; } };
const nhoCa = (ngay, ca) => { try { localStorage.setItem(KHOA_CA, JSON.stringify({ ngay, ca })); } catch { /* không nhớ được: lần sau chọn lại */ } };

export default function ViecHomNay({ vaiTro, moTab, doiSoMoi, moThe }) {   // KHO-GON-2 D3: moThe — chạm tên nguyên liệu dưới ngưỡng mở thẻ
  const quanLy = vaiTro === 'owner' || vaiTro === 'manager';
  const [dl, setDl] = useState(null);
  const [ca, setCa] = useState(null);
  const [db, setDb] = useState(null);
  const [loi, setLoi] = useState('');
  const [dang, setDang] = useState(false);
  const [moi, setMoi] = useState(null);   // { ten, giao } khi đang thêm việc phát sinh

  const tai = useCallback(async (caChon = ca) => {
    try {
      const r = await api.post('/kho/viec/hom-nay', { ca: caChon });
      const nho = docCa(r.ngay);
      if (r.so_ca === 2 && !quanLy && !caChon && nho) return tai(nho);
      setCa(caChon); setDl(r); setLoi('');
      if (quanLy) { const d = await api.get('/kho/dien-bien'); setDb(d); doiSoMoi?.(d.chua_xem); }
    } catch (e) { setLoi(e.message); }
  }, [ca, quanLy, doiSoMoi]);
  useEffect(() => { tai(); }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const ghi = async (lam, viecGi, xong) => {
    setDang(true);
    try { await lam(); if (xong) baoXong(xong); await tai(); return true; } catch (e) { baoLoiTu(viecGi, e); return false; } finally { setDang(false); }
  };
  if (!dl) return loi ? <div className="kho-loi">{loi}</div> : <p>Đang tải…</p>;
  const canChonCa = dl.so_ca === 2 && !quanLy && !ca;
  const giaoTen = dl.so_ca === 2 ? GIAO_2CA : GIAO_1CA;
  const daXong = dl.viec.filter((v) => v.xong_luc).length;
  const chonCa = (c) => { nhoCa(dl.ngay, c); tai(c); };
  const themViec = (than, xong) => ghi(() => api.post('/kho/viec', than), 'thêm việc', xong);

  if (canChonCa) {
    return (
      <div className="kho-hang"><b>Bạn làm ca nào hôm nay?</b>
        <button className="btn btn-primary" onClick={() => chonCa('sang')}>Ca sáng</button>
        <button className="btn btn-primary" onClick={() => chonCa('toi')}>Ca tối</button>
      </div>
    );
  }
  return (
    <div>
      <div className="kho-hang"><b>Việc hôm nay</b>
        <span className="kho-nho">{dl.ngay.split('-').reverse().join('/')}{ca && ` · ca ${ca === 'sang' ? 'sáng' : 'tối'}`} · xong {daXong}/{dl.viec.length}</span></div>
      {dl.duoi_nguong.length > 0 && (
        <div className="kho-canh"><b>Nguyên liệu dưới ngưỡng:</b>
          {dl.duoi_nguong.map((n) => <button key={'the' + n.id} className="kho-lien-ket" onClick={() => moThe && moThe(n.id, n.ten)}>{n.ten} ›</button>)}
          {dl.duoi_nguong.map((n) => (n.da_giao ? <span key={n.id} className="kho-nho">đã giao gọi {n.ten}</span>
            : <button key={n.id} disabled={dang} onClick={() => themViec({ nguyen_lieu_id: n.id }, `Đã giao việc gọi thêm ${n.ten}`)}>Giao việc gọi thêm {n.ten} (còn {so(n.ton_hien)} {n.don_vi})</button>))}
        </div>
      )}
      {!dl.viec.length && <p className="text-gray">Không có việc nào giao cho bạn.</p>}
      {dl.viec.map((v, i) => (
        <div key={v.id} className={`kho-dong kho-the ${v.xong_luc ? 'ngung' : ''}`} style={{ cursor: 'default' }}>
          <b style={{ minWidth: '1.5rem' }}>{v.xong_luc ? '✓' : i + 1}</b>
          <span style={{ flex: 1 }}>{v.ten}
            <span className="kho-nho" style={{ display: 'block' }}>
              {v.gio_han && <span className={v.qua_gio ? 'kho-am kho-dam' : ''}>trước {v.gio_han}{v.qua_gio && ' · quá giờ'} · </span>}
              {giaoTen[v.giao]}{v.nguoi_tao && <span className="kho-thieu"> · phát sinh do {v.nguoi_tao}</span>}
              {v.xong_luc && ` · xong ${gio(v.xong_luc)} bởi ${v.nguoi_xong}`}
            </span>
          </span>
          {!v.xong_luc && LAM[v.loai] && <button className="btn btn-sm btn-primary" onClick={() => moTab(LAM[v.loai])}>Làm</button>}
          {!v.xong_luc && v.nguyen_lieu_id && <button className="btn btn-sm btn-outline" onClick={() => moTab('nh')}>Hàng về → nhận</button>}
          {!v.xong_luc && v.loai === 'thuong' && (
            <button className="btn btn-sm btn-outline" disabled={dang} onClick={() => ghi(() => api.post(`/kho/viec/${v.id}/xong`, { ca }), 'đánh dấu xong')}>Xong</button>
          )}
          {v.xong_luc && vaiTro === 'owner' && (
            <button className="btn btn-sm btn-outline" disabled={dang} onClick={() => ghi(() => api.post(`/kho/viec/${v.id}/mo-lai`), 'mở lại việc', 'Đã mở lại việc')}>Mở lại</button>
          )}
        </div>
      ))}
      {!moi && <button className="btn btn-outline" style={{ marginTop: '0.5rem' }} onClick={() => setMoi({ ten: '', giao: 'nv' })}>+ Việc phát sinh</button>}
      {moi && (
        <div className="card" style={{ padding: '0.75rem', marginTop: '0.5rem' }}>
          <div className="kho-hang">{GOI_Y.map((t) => <button key={t} className="kho-tab" onClick={() => setMoi({ ...moi, ten: t })}>{t}</button>)}</div>
          <div className="kho-hang">
            <input className="input" placeholder="Việc gì?" value={moi.ten} onChange={(e) => setMoi({ ...moi, ten: e.target.value })} />
            <select className="input" style={{ flex: 0, minWidth: '9rem' }} value={moi.giao} onChange={(e) => setMoi({ ...moi, giao: e.target.value })}>
              {Object.entries(giaoTen).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
            <button className="btn btn-primary" disabled={dang || !moi.ten.trim()} onClick={async () => { if (await themViec(moi, 'Đã thêm việc')) setMoi(null); }}>Thêm</button>
            <button className="btn btn-outline" onClick={() => setMoi(null)}>Thôi</button>
          </div>
        </div>
      )}
      {quanLy && db && <DienBien db={db} dang={dang} daXem={(den) => ghi(() => api.post('/kho/dien-bien/da-xem', { den_id: den }), 'đánh dấu đã xem')} />}
    </div>
  );
}

function DienBien({ db, dang, daXem }) {
  const den = Math.max(0, ...db.dong.map((d) => d.id), ...db.can_chu_y.dien_bien.map((d) => d.id));
  const cy = db.can_chu_y;
  return (
    <>
      <h4 className="kho-muc">Diễn biến hôm nay {db.chua_xem > 0 && <span className="kho-huy-hieu">{db.chua_xem} mới</span>}
        {(db.chua_xem > 0 || cy.dien_bien.length > 0) && <button className="btn btn-sm btn-outline" style={{ marginLeft: '0.5rem' }} disabled={dang} onClick={() => daXem(den)}>Đã xem</button>}</h4>
      {!db.dong.length && <p className="kho-nho">Chưa có gì hôm nay.</p>}
      {db.dong.map((d) => (
        <div key={d.id} className={`kho-dong ${d.chu_y ? 'kho-vang' : ''}`} style={{ opacity: d.id > db.den_id ? 1 : 0.6 }}>
          <span className="kho-nho">{d.luc.slice(11, 16)}</span><b>{d.viec}</b><span style={{ flex: 1 }}>{d.chi_tiet}</span><span className="kho-nho">{d.nguoi}</span>
        </div>
      ))}
      {(cy.mon_chua_san.length > 0 || cy.dien_bien.length > 0) && (
        <div className="kho-canh" style={{ display: 'block' }}><b>Cần chủ quán / quản lý chú ý</b>
          {cy.mon_chua_san.length > 0 && <div>Quầy chưa bán được: {cy.mon_chua_san.map((m) => `${m.ten} (${m.ly_do})`).join(', ')}</div>}
          {cy.dien_bien.map((d) => <div key={d.id}>{gio(d.luc)} · {d.viec}: {d.chi_tiet} — {d.nguoi}</div>)}
        </div>
      )}
    </>
  );
}
