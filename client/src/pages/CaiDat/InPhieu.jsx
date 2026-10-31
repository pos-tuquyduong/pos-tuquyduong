// KHO-IN-1 — thẻ Cài đặt "In phiếu kho": mỗi loại phiếu (xuất / đặt hàng / nhận / phát sinh) chọn khổ giấy mặc định 80mm · A5 · A4 và số bản.
// Lưu 8 khoá in_phieu_<loai>_kho / _ban qua PUT /settings (máy chủ kiểm giá trị — sai một khoá thì không ghi khoá nào), dùng chung mọi máy.
// Màn xem phiếu kho đọc lại bằng docInPhieuKho: nút khổ mặc định đứng đầu, vẫn đổi được khổ lúc in. Hoá đơn khách KHÔNG ở đây (chỉ khổ nhiệt).
import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { api } from '../../utils/api';
import { KHO_PHIEU_KHO, LOAI_PHIEU_KHO, SO_BAN_TOI_DA, khoaInPhieu, docInPhieuKho } from '../../utils/inPhieu';

const NHAN_KHO = { '80mm': '80 mm (máy in nhiệt)', a5: 'A5', a4: 'A4' };

export default function InPhieu() {
  const [gia, setGia] = useState(null);   // loại → { kho, ban }; null = chưa tải xong
  const [taiLoi, setTaiLoi] = useState(false);   // chưa nạp được cài đặt → KHÔNG cho Lưu (Lưu gửi đủ 8 khoá, sẽ đè cài đặt đã có)
  const [dangLuu, setDangLuu] = useState(false);
  const [thongDiep, setThongDiep] = useState('');

  useEffect(() => {
    api.get('/settings').then((r) => {
      setGia(Object.fromEntries(Object.keys(LOAI_PHIEU_KHO).map((l) => [l, docInPhieuKho(r.data || {}, l)])));
    }).catch((e) => { setTaiLoi(true); setThongDiep('Lỗi: chưa tải được cài đặt — tải lại trang trước khi sửa (' + e.message + ')'); });
  }, []);

  const sua = (loai, kv) => setGia((g) => ({ ...g, [loai]: { ...g[loai], ...kv } }));
  const luu = async () => {
    if (taiLoi || !gia) return;
    setDangLuu(true);
    try {
      const settings = {};
      for (const l of Object.keys(LOAI_PHIEU_KHO)) {
        settings[khoaInPhieu(l, 'kho')] = gia[l].kho;
        settings[khoaInPhieu(l, 'ban')] = String(gia[l].ban);
      }
      await api.put('/settings', { settings });
      setThongDiep('Đã lưu cài đặt in phiếu');
      setTimeout(() => setThongDiep((t) => (t === 'Đã lưu cài đặt in phiếu' ? '' : t)), 3000);
    } catch (e) { setThongDiep('Lỗi: ' + e.message); }
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
      {thongDiep && <div style={{ padding: 8, marginBottom: 8, background: thongDiep.startsWith('Lỗi') ? '#fee2e2' : '#dcfce7', borderRadius: 6 }}>{thongDiep}</div>}
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
          <Save size={16} /> {dangLuu ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </>
  );
}
