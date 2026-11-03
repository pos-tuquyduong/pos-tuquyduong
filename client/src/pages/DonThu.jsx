// KH-SDT-1 — màn "Dọn dữ liệu thử" (chỉ chủ quán, chạy MỘT lần trước khai trương). Chủ quán chốt 01.11: liệt kê → tải danh sách →
// tải sao lưu → gõ DON DU LIEU THU → Dọn. Máy chủ chọn lại + so mã trong giao dịch (server/utils/donThu.js); màn chỉ khoá thứ tự bấm.
import { useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { CHU_XAC_NHAN, docDanhSachSdt, dungCsv, moNutDon } from './QuanLy/donThu';

const tien = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
const taiFile = (ten, noiDung, loai) => {
  const url = URL.createObjectURL(new Blob([noiDung], { type: loai }));
  const a = document.createElement('a');
  a.href = url; a.download = ten; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
};

export default function DonThu() {
  const { user } = useAuth();
  const [ngay, setNgay] = useState('');
  const [oSdt, setOSdt] = useState('');
  const [ketQua, setKetQua] = useState(null);
  const [daTaiDs, setDaTaiDs] = useState(false);
  const [daTaiSaoLuu, setDaTaiSaoLuu] = useState(false);
  const [go, setGo] = useState('');
  const [loi, setLoi] = useState('');
  const [dangChay, setDangChay] = useState(false);
  const [xong, setXong] = useState(null);

  if (user?.role !== 'owner') return <div className="page-content">Chỉ chủ quán mở được màn này.</div>;

  const tieuChi = () => ({ truoc_ngay: ngay || undefined, sdt: docDanhSachSdt(oSdt) });
  const doiTieuChi = (dat) => (e) => { dat(e.target.value); setKetQua(null); setDaTaiDs(false); setDaTaiSaoLuu(false); setGo(''); };
  const chay = async (viec) => {
    setDangChay(true); setLoi('');
    try { await viec(); } catch (e) { setLoi('Lỗi: ' + e.message); } finally { setDangChay(false); }
  };
  const lietKe = () => chay(async () => {
    setXong(null); setDaTaiDs(false); setDaTaiSaoLuu(false); setGo('');
    setKetQua(await api.post('/don-thu/liet-ke', tieuChi()));
  });
  const taiDanhSach = () => { taiFile(`danh-sach-don-thu_${ngay || 'sdt'}.csv`, dungCsv(ketQua), 'text/csv;charset=utf-8'); setDaTaiDs(true); };
  const taiSaoLuu = () => chay(async () => {
    await api.download('/backup/export-all', `POS-backup-truoc-don-thu.xlsx`);
    setDaTaiSaoLuu(true);
  });
  const don = () => chay(async () => {
    const kq = await api.post('/don-thu/don', { ...tieuChi(), ma_xac_nhan: ketQua.ma_xac_nhan, go_xac_nhan: go });
    if (kq.da_don > 0) taiFile(`ban-chup-don-thu_${kq.nhat_ky_id}.json`, JSON.stringify(kq.ban_chup, null, 1), 'application/json');
    setXong(kq); setKetQua(null); setDaTaiDs(false); setDaTaiSaoLuu(false); setGo('');
  });

  const gl = ketQua?.giu_lai || { vi: [], sdt: [], don: [] };
  return (
    <div>
      <header className="page-header"><h1>Dọn dữ liệu thử</h1></header>
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 820 }}>
        <div className="card" style={{ padding: '1rem' }}>
          Chạy <b>một lần</b> trước khai trương. Xoá đơn / điểm / voucher của giai đoạn thử. <b>Không</b> xoá: SĐT còn tiền ví, đơn có
          tiền ngân hàng (QR), đơn hôm nay, đơn còn nợ kho, đơn trả bằng ví / lấy từ gói của khách không dọn, đơn có tiền mặt vào két đã đếm từ ngày X, đối soát, kho, sản phẩm, cài đặt. Số nào còn đơn phải giữ thì giữ cả số.
        </div>
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <b>1. Chọn dữ liệu thử</b>
          <label>Mọi giao dịch TRƯỚC ngày <input type="date" value={ngay} onChange={doiTieuChi(setNgay)} /></label>
          <label>và / hoặc xoá sạch các SĐT thử (mỗi dòng một số):
            <textarea rows={3} value={oSdt} onChange={doiTieuChi(setOSdt)} style={{ width: '100%' }} /></label>
          <button className="btn btn-primary" disabled={dangChay} onClick={lietKe}>Liệt kê</button>
        </div>
        {loi && <div style={{ color: '#dc2626' }}>{loi}</div>}
        {xong && <div className="card" style={{ padding: '1rem', color: '#16a34a' }}>
          {xong.da_don > 0 ? `Đã dọn ${xong.da_don} dòng. Bản chụp các dòng đã xoá đã tải về và lưu trong nhật ký #${xong.nhat_ky_id}.` : 'Không còn gì để dọn.'}
        </div>}
        {ketQua && <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <b>2. Xem danh sách — {ketQua.tong_dong} dòng, {ketQua.don.length} đơn ({tien(ketQua.tong_tien)}) · {ketQua.tong_diem_con_han} điểm còn hạn sẽ mất</b>
          <div style={{ fontSize: '0.85rem' }}>{Object.entries(ketQua.so_dong).map(([b, n]) => `${b}: ${n}`).join(' · ') || 'Không có gì để dọn'}</div>
          {ketQua.sdt.length > 0 && <div>SĐT xoá sạch: {ketQua.sdt.join(', ')}</div>}
          {gl.vi.length > 0 && <div style={{ color: '#d97706' }}>Giữ lại — ví còn tiền (xử lý tay): {gl.vi.map((v) => `${v.phone} ${tien(v.balance)}`).join(', ')}</div>}
          {gl.sdt.length > 0 && <div style={{ color: '#d97706' }}>Giữ lại cả số (không xoá sạch): {gl.sdt.map((p) => `${p} (${(gl.ly_do_sdt || {})[p] || ''})`).join('; ')}</div>}
          {gl.don.length > 0 && <div style={{ color: '#d97706' }}>Giữ lại {gl.don.length} đơn: {gl.don.map((d) => `${d.code} (${d.ly_do})`).join('; ')}</div>}
          {(ketQua.ket_se_lech || []).length > 0 && <div style={{ color: '#d97706' }}>Lưu ý: két các ngày {ketQua.ket_se_lech.join(', ')} (trước ngày X) đã đếm — dọn xong màn Đối soát ngày đó sẽ báo lệch (sổ đối soát thử không dọn). Két từ ngày X không đổi: đơn có tiền rơi vào đó được giữ lại.</div>}
          {ketQua.diem_am.length > 0 && <div style={{ color: '#dc2626' }}>KHÔNG dọn được — các số sau sẽ bị điểm âm, thêm vào ô SĐT rồi liệt kê lại: {ketQua.diem_am.map((d) => d.phone).join(', ')}</div>}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={taiDanhSach}>{daTaiDs ? '✓ ' : ''}Tải danh sách (CSV)</button>
            <button className="btn btn-outline" disabled={dangChay || !daTaiDs} onClick={taiSaoLuu}>{daTaiSaoLuu ? '✓ ' : ''}3. Tải sao lưu toàn bộ</button>
          </div>
          <label>4. Gõ <b>{CHU_XAC_NHAN}</b> để dọn: <input value={go} onChange={(e) => setGo(e.target.value)} disabled={!daTaiSaoLuu} /></label>
          <button className="btn btn-danger" disabled={!moNutDon({ ketQua, daTaiDs, daTaiSaoLuu, go }) || dangChay} onClick={don}>Dọn</button>
        </div>}
      </div>
    </div>
  );
}
