// KHO-IN-1 — thẻ Cài đặt "In phiếu kho": mỗi loại phiếu (xuất / đặt hàng / nhận / phát sinh) chọn khổ giấy mặc định A5 · A4 và số bản.
// Lưu 8 khoá in_phieu_<loai>_kho / _ban qua PUT /settings (máy chủ kiểm giá trị — sai một khoá thì không ghi khoá nào), dùng chung mọi máy.
// BAO-1b: báo qua thông báo chung; lỗi dưới nút Lưu; sửa mà chưa Lưu → thanh "Có thay đổi chưa lưu"; lưu xong nạp lại số máy chủ giữ.
// Màn xem phiếu kho đọc lại bằng docInPhieuKho: nút khổ mặc định đứng đầu, vẫn đổi được khổ lúc in. Hoá đơn khách KHÔNG ở đây (chỉ khổ nhiệt).
import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { api } from '../../utils/api';
import { baoXong, baoLoiTu, lyDoLoi } from '../../components/thongBaoKho.js';
import LoiO from '../../components/LoiO';
import ThanhLuu from '../../components/ThanhLuu';
import useThayDoi from '../../components/useThayDoi';
import { KHO_PHIEU_KHO, LOAI_PHIEU_KHO, SO_BAN_TOI_DA, khoaInPhieu, docInPhieuKho } from '../../utils/inPhieu';

const NHAN_KHO = { a5: 'A5', a4: 'A4' };

export default function InPhieu() {
  const [gia, setGia] = useState(null);   // loại → { kho, ban }; null = chưa tải xong
  const [taiLoi, setTaiLoi] = useState(false);   // chưa nạp được cài đặt → KHÔNG cho Lưu (Lưu gửi đủ 8 khoá, sẽ đè cài đặt đã có)
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState('');
  const [coDoi, chup] = useThayDoi(gia);

  const tai = () => api.get('/settings').then((r) => {
    const moi = Object.fromEntries(Object.keys(LOAI_PHIEU_KHO).map((l) => [l, docInPhieuKho(r.data || {}, l)]));
    setGia(moi); chup(moi); setTaiLoi(false); setLoi('');
  }).catch((e) => { setTaiLoi(true); setLoi(lyDoLoi(e)); baoLoiTu('tải cài đặt in phiếu', e); });
  useEffect(() => { tai(); }, []);

  const sua = (loai, kv) => setGia((g) => ({ ...g, [loai]: { ...g[loai], ...kv } }));
  const luu = async () => {
    if (taiLoi || !gia) return;
    setDangLuu(true); setLoi('');
    try {
      const settings = {};
      for (const l of Object.keys(LOAI_PHIEU_KHO)) {
        settings[khoaInPhieu(l, 'kho')] = gia[l].kho;
        settings[khoaInPhieu(l, 'ban')] = String(gia[l].ban);
      }
      await api.put('/settings', { settings });
      baoXong('Đã lưu cài đặt in phiếu kho: ' + Object.entries(LOAI_PHIEU_KHO).map(([l, ten]) => `${ten} ${NHAN_KHO[gia[l].kho]} × ${gia[l].ban}`).join(', '));
      await tai();
    } catch (e) { setLoi(lyDoLoi(e)); baoLoiTu('lưu cài đặt in phiếu', e); }
    finally { setDangLuu(false); }
  };

  if (!gia && !taiLoi) return <div className="loading">Đang tải...</div>;
  const hang = { display: 'flex', alignItems: 'center', gap: 12, padding: '0.5rem 0', borderTop: '1px solid #eee', flexWrap: 'wrap' };
  return (
    <>
      <div className="card-title" style={{ margin: '0 0 0.5rem' }}>🖨 In phiếu kho</div>
      <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 1rem' }}>
        Khổ giấy và số bản mặc định cho từng loại phiếu kho. Lúc in vẫn đổi được khổ. Áp cho cả quán. Hoá đơn khách chỉ in khổ nhiệt nên không nằm ở đây.
      </p>
      {gia && Object.entries(LOAI_PHIEU_KHO).map(([l, ten]) => (
        <div key={l} style={hang}>
          <div style={{ minWidth: 160, fontWeight: 600 }}>{ten}</div>
          <label>Khổ{' '}
            <select value={gia[l].kho} onChange={(e) => sua(l, { kho: e.target.value })}>
              {KHO_PHIEU_KHO.map((k) => <option key={k} value={k}>{NHAN_KHO[k]}</option>)}
            </select>
          </label>
          <label>Số bản{' '}
            <select value={gia[l].ban} onChange={(e) => sua(l, { ban: Number(e.target.value) })}>
              {Array.from({ length: SO_BAN_TOI_DA }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
            </select>
          </label>
        </div>
      ))}
      <div style={{ marginTop: '0.75rem' }}>
        <button className="btn btn-primary" onClick={luu} disabled={dangLuu || taiLoi || !gia}>
          <Save size={16} /> {dangLuu ? 'Đang lưu…' : 'Lưu'}
        </button>
        <LoiO loi={loi && (taiLoi ? `Chưa tải được cài đặt — tải lại trang trước khi sửa: ${loi}` : loi)} />
      </div>
      <ThanhLuu id="in-phieu" coDoi={coDoi} dangLuu={dangLuu} onLuu={luu} onBo={tai} />
    </>
  );
}
