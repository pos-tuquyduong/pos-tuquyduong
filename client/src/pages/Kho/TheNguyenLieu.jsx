/**
 * KHO-GON-2 D1–D2 (bản thử chủ quán duyệt 27.11) — thẻ một nguyên liệu: tồn chữ to + nhãn (đủ / dưới ngưỡng / hết), phiếu chờ duyệt, "Dùng cho món"
 * (đủ khoảng bao nhiêu phần — máy chủ tính bằng tinh.toiDa), lô đang có, lịch sử nhập / xuất. Ba nút đi ĐÚNG đường có sẵn: "＋ Nhận hàng" =
 * POST /kho/phieu-nhan (cùng tab Nhận hàng — cộng ngay), "− Xuất / hao hụt" = POST /kho/phieu-phat-sinh (lý do như Phát sinh), "Chỉnh tồn" = khối
 * ChinhTonTay (POST /kho/chinh-tay — chỉ hiện khi máy chủ báo duoc_chinh_tay). Lưu xong về lại thẻ (veThe) và tải lại số.
 * Điều hướng (← / đường dẫn) do index.jsx giữ; `man` = màn con đang mở (null = thẻ).
 */
import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { baoXong, baoLoiTu } from '../../components/thongBaoKho.js';
import { so, tien, gio, maGuiMoi, veLuu, SU_CO, TEN_SU_CO, TRANG_THAI } from './chung';
import ChinhTonTay from './ChinhTonTay';

const NHAN = { du: 'Đủ', duoi_nguong: 'Dưới ngưỡng', het: 'Hết' };
const TEN_LOAI = { PN: 'Nhận hàng', PX: 'Pha chế', PS: 'Phát sinh', KK: 'Kiểm kê / chỉnh tay' };
export const TEN_MAN = { nhan: 'Nhận hàng', xuat: 'Xuất / hao hụt', chinh: 'Chỉnh tồn tay' };

export default function TheNguyenLieu({ id, man, moMan, veThe }) {
  const [the, setThe] = useState(null);
  const [ton, setTon] = useState(null);
  const [loi, setLoi] = useState('');
  const [dang, setDang] = useState(false);
  const [f, setF] = useState({ so: '', gia: '', han: '', ghi_chu: '', su_co: 'hong', lo_id: '' });
  const [maGui, setMaGui] = useState(maGuiMoi);

  const taiLai = () => Promise.all([api.get(`/kho/nguyen-lieu/${id}/the`), api.get('/kho/ton')])
    .then(([t, k]) => { setThe(t); setTon(k); }).catch((e) => setLoi(e.message));
  useEffect(() => { setThe(null); taiLai(); }, [id]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setF({ so: '', gia: '', han: '', ghi_chu: '', su_co: 'hong', lo_id: '' }); setMaGui(maGuiMoi()); }, [man]);

  if (!the || !ton) return loi ? <div className="kho-loi">{loi}</div> : <p>Đang tải…</p>;
  const n = the.nguyen_lieu;
  const thuTon = ton.nguyen_lieu.find((x) => x.id === id);
  const xong = async (tin) => { baoXong(tin); veThe(); await taiLai(); };
  const gui = async (viec, lam, tin) => {
    if (dang) return;
    setDang(true);
    try { await lam(); await xong(tin); } catch (e) { baoLoiTu(viec, e); } finally { setDang(false); }
  };
  const nhan = () => gui('nhận hàng', () => api.post('/kho/phieu-nhan', { ma_gui: maGui, ghi_chu: f.ghi_chu,
    dong: [{ nguyen_lieu_id: id, luong: veLuu(f.so, n.he_so_doi), don_gia: f.gia === '' ? null : Number(f.gia), han_dung: f.han || null }] }), `Đã nhận ${n.ten} — kho đã cộng`);
  const xuat = () => gui('ghi xuất / hao hụt', () => api.post('/kho/phieu-phat-sinh', { ma_gui: maGui, su_co: f.su_co, ghi_chu: f.ghi_chu || null,
    muc: [f.su_co === 'het_han' && f.lo_id ? { lo_id: Number(f.lo_id), luong: veLuu(f.so, n.he_so_doi) } : { nguyen_lieu_id: id, luong: veLuu(f.so, n.he_so_doi) }] }), `Đã ghi xuất ${n.ten}`);
  const soOk = f.so !== '' && Number(f.so) > 0;

  if (man === 'nhan') {
    return (
      <div className="kho-the-nl">
        <h3 className="card-title">Nhận hàng · {n.ten}</h3>
        <div className="kho-nho">Ai nhận cũng cộng kho NGAY — người nhận chịu trách nhiệm; chủ / quản lý thấy ở Diễn biến.</div>
        <div className="kho-dong" style={{ marginTop: '0.5rem' }}>
          <input className="input kho-hep" type="number" min="0" step="any" inputMode="decimal" placeholder={n.don_vi} aria-label="Số nhận" value={f.so} onChange={(e) => setF({ ...f, so: e.target.value })} />
          <span>{n.don_vi}</span>
          <input className="input kho-hep" type="number" min="0" step="1" inputMode="numeric" placeholder={`đ/${n.don_vi_luu}`} title={`Giá nhập: đồng cho 1 ${n.don_vi_luu}`} value={f.gia} onChange={(e) => setF({ ...f, gia: e.target.value })} />
          <input className="input kho-hep" type="date" title="Hạn dùng (trống = tự tính)" value={f.han} onChange={(e) => setF({ ...f, han: e.target.value })} />
        </div>
        <input className="input" placeholder="Số hoá đơn / ghi chú" value={f.ghi_chu} onChange={(e) => setF({ ...f, ghi_chu: e.target.value })} style={{ width: '100%' }} />
        <div className="kho-chan"><button className="btn btn-primary kho-nut-lon" disabled={dang || !soOk} onClick={nhan}>{dang ? 'Đang gửi…' : 'Nhận hàng — cộng kho ngay'}</button></div>
      </div>
    );
  }
  if (man === 'xuat') {
    return (
      <div className="kho-the-nl">
        <h3 className="card-title">Xuất / hao hụt · {n.ten}</h3>
        <div className="kho-tabs">{Object.entries(SU_CO).map(([ma, ten]) => <button key={ma} className={`kho-tab ${f.su_co === ma ? 'on' : ''}`} onClick={() => setF({ ...f, su_co: ma })}>{ten}</button>)}</div>
        {f.su_co === 'het_han' && (
          <select className="input" value={f.lo_id} onChange={(e) => setF({ ...f, lo_id: e.target.value })} style={{ width: '100%', marginBottom: '0.5rem' }}>
            <option value="">— chọn lô hết hạn —</option>
            {the.lo.map((l) => <option key={l.id} value={l.id}>lô còn {so(l.con_hien)} {n.don_vi} · {l.han_dung ? `hạn ${gio(l.han_dung)}` : 'không hạn'}</option>)}
          </select>
        )}
        <div className="kho-dong">
          <input className="input kho-hep" type="number" min="0" step="any" inputMode="decimal" placeholder={n.don_vi} aria-label="Số xuất" value={f.so} onChange={(e) => setF({ ...f, so: e.target.value })} />
          <span>{n.don_vi}</span>
          <input className="input" placeholder={f.su_co === 'khac' ? 'Ghi rõ chuyện gì (bắt buộc)' : 'Ghi chú'} value={f.ghi_chu} onChange={(e) => setF({ ...f, ghi_chu: e.target.value })} />
        </div>
        <div className="kho-chan">
          <button className="btn btn-primary kho-nut-lon" disabled={dang || !soOk || (f.su_co === 'khac' && !f.ghi_chu.trim()) || (f.su_co === 'het_han' && !f.lo_id)} onClick={xuat}>
            {dang ? 'Đang gửi…' : `Ghi ${TEN_SU_CO[f.su_co].toLowerCase()}`}</button>
        </div>
      </div>
    );
  }
  if (man === 'chinh' && thuTon) return <ChinhTonTay ton={ton} thu={thuTon} thoi={veThe} xong={() => xong(`Đã chỉnh tồn ${n.ten}`)} />;

  return (
    <div className="kho-the-nl">
      <h3 className="card-title">{n.ten}{n.nhom_ten && <span className="kho-nho"> · {n.nhom_ten}</span>}</h3>
      <div className="kho-hang" style={{ alignItems: 'baseline' }}>
        <span className="kho-ton-to">{so(n.ton_hien)} {n.don_vi}</span>
        <span className={`kho-nhan-ton ${n.nhan}`}>{NHAN[n.nhan]}</span>
        {n.ton_toi_thieu != null && <span className="kho-nho">ngưỡng {so(n.ton_toi_thieu / (n.he_so_doi || 1))} {n.don_vi}</span>}
        {'gia_nhap' in n && n.gia_nhap != null && <span className="kho-nho">· {tien(n.gia_nhap)}/{n.don_vi_luu}</span>}
      </div>
      {the.cho_duyet.length > 0 && (
        <div className="kho-canh">Phiếu chờ duyệt: {the.cho_duyet.map((p) => `${p.so_phieu} ${p.tang ? '+' : '−'}${so(p.luong_hien)} ${n.don_vi} (${p.nguoi_tao})`).join(' · ')}</div>
      )}
      <div className="kho-hang">
        <button className="btn btn-primary" onClick={() => moMan('nhan', TEN_MAN.nhan)}>＋ Nhận hàng</button>
        <button className="btn btn-outline" onClick={() => moMan('xuat', TEN_MAN.xuat)}>− Xuất / hao hụt</button>
        {ton.duoc_chinh_tay && <button className="btn btn-outline" onClick={() => moMan('chinh', TEN_MAN.chinh)}>Chỉnh tồn</button>}
      </div>
      <h4 className="kho-muc">Dùng cho món</h4>
      {!the.dung_cho_mon.length && <p className="kho-nho">Chưa có công thức nào dùng nguyên liệu này.</p>}
      {the.dung_cho_mon.map((m) => (
        <div key={m.san_pham_id} className="kho-dong"><span style={{ flex: 1 }}>{m.ten}</span>
          <span className="kho-nho">1 phần {so(m.mot_phan_hien)} {n.don_vi} · đủ khoảng <b>{so(m.du_phan)}</b> phần</span></div>
      ))}
      <h4 className="kho-muc">Lô đang có</h4>
      {!the.lo.length && <p className="kho-nho">Không còn lô nào.</p>}
      {the.lo.map((l) => (
        <div key={l.id} className="kho-dong kho-nho"><span style={{ flex: 1 }}>nhận {gio(l.tao_luc)}</span>
          <span>còn {so(l.con_hien)} {n.don_vi} · {l.han_dung ? `hạn ${gio(l.han_dung)}` : 'không hạn'}</span></div>
      ))}
      <h4 className="kho-muc">Lịch sử nhập / xuất</h4>
      {the.lich_su.map((d) => (
        <div key={d.phieu_id} className="kho-dong kho-nho"><span style={{ flex: 1 }}>{gio(d.luc)} · {d.so_phieu} · {TEN_LOAI[d.loai] || d.loai}{d.su_co && ` (${TEN_SU_CO[d.su_co] || d.su_co})`}</span>
          <b>{d.so_luong > 0 ? '+' : '−'}{so(Math.abs(d.so_luong_hien))} {n.don_vi}</b>
          <span>· {d.nguoi}{d.trang_thai !== 'da_duyet' && ` · ${TRANG_THAI[d.trang_thai] || d.trang_thai}`}{d.ghi_chu && ` · ${d.ghi_chu}`}</span></div>
      ))}
    </div>
  );
}
