/**
 * KHO-GON-1 (tách KHO-GON-2) — khối "Chỉnh tồn tay" dùng CHUNG cho Tồn kho và thẻ nguyên liệu: số đang có thật + lý do → phiếu KK (POST /kho/chinh-tay).
 * ton = phản hồi GET /kho/ton (duoc_chinh_tay, ton_kiem, moc, moc_luc — máy chủ kiểm mốc C5). Quyền do máy chủ kiểm (chủ quán; quản lý khi được bật).
 */
import { useState } from 'react';
import { api } from '../../utils/api';
import { baoXong, baoLoiTu } from '../../components/thongBaoKho.js';
import { so, maGuiMoi, veLuu } from './chung';

/** Q11: số máy chủ DÙNG để tính lệch — có phiếu chờ thì lấy ton_kiem (đơn vị lưu → hiện), không thì tồn đang hiện. */
const mayGhi = (ton, t) => {
  const k = (ton.ton_kiem || []).find((x) => (t.id ? x.nguyen_lieu_id === t.id : x.san_pham_id === t.san_pham_id));
  const he = t.he_so_doi || 1;
  return k ? { so: k.ton / he, cho: k.cho / he } : { so: t.ton_hien ?? t.ton, cho: 0 };
};

export default function ChinhTonTay({ ton, thu: t, xong, thoi }) {
  const [soThat, setSoThat] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [maGui] = useState(maGuiMoi);
  const [dang, setDang] = useState(false);
  const m = mayGhi(ton, t);
  const luu = async () => {
    setDang(true);
    try {
      const kq = await api.post('/kho/chinh-tay', { nguyen_lieu_id: t.id, san_pham_id: t.san_pham_id, thuc: veLuu(soThat, t.he_so_doi), ly_do: lyDo, moc: ton.moc,
        moc_luc: ton.moc_luc, ma_gui: maGui });
      baoXong(kq.khong_doi ? `Không có gì thay đổi — ${t.ten} đã đúng số đó (có thể lần bấm trước đã lưu)` : `Đã chỉnh tồn ${t.ten}`);
      await xong();
    } catch (e) { baoLoiTu('chỉnh tồn tay', e); } finally { setDang(false); }
  };
  return (
    <div className="card kho-hang" style={{ padding: '0.75rem' }}>
      <b>Chỉnh tồn tay · {t.ten}</b>
      <span className="kho-nho">Máy ghi {so(m.so)} {t.don_vi_hien || t.don_vi_luu || 'phần'}
        {m.cho ? ` — đã tính phiếu chờ duyệt ${m.cho > 0 ? '+' : '−'}${so(Math.abs(m.cho))}` : ''}. Gõ số đang có thật.</span>
      <input className="input kho-hep" type="number" min="0" step="any" inputMode="decimal" aria-label="Số đang có thật" value={soThat} onChange={(e) => setSoThat(e.target.value)} />
      <input className="input" placeholder="Lý do (bắt buộc)" value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
      <button className="btn btn-primary" disabled={dang || soThat === '' || !(Number(soThat) >= 0) || !lyDo.trim()} onClick={luu}>Lưu</button>
      <button className="btn btn-outline" onClick={thoi}>Thôi</button>
    </div>
  );
}
