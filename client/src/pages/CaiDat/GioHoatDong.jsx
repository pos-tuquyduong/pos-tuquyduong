// KH-API-2 (F) — thẻ Cài đặt "Giờ hoạt động": lịch tuần, ngày nghỉ, câu báo ngoài giờ, ngừng nhận đơn App trước giờ đóng.
// Lưu 4 khoá gio_hd_* qua PUT /settings (máy chủ kiểm bằng gioHoatDong.kiemCaiDat — sai một khoá thì không ghi khoá nào).
// Chỉ App KH đọc (GET /api/kh/gio-hoat-dong); quầy KHÔNG bị chặn theo giờ hoạt động.
import { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { api } from '../../utils/api';

const THU = [[2, 'Thứ Hai'], [3, 'Thứ Ba'], [4, 'Thứ Tư'], [5, 'Thứ Năm'], [6, 'Thứ Sáu'], [7, 'Thứ Bảy'], [8, 'Chủ nhật']];
const NGAY_MAC_DINH = { mo: '07:00', dong: '22:00', nghi: false };
const CHU_GIO = '{gio_mo_lai}';

const docJson = (s, macDinh) => { try { return JSON.parse(s); } catch { return macDinh; } };

export default function GioHoatDong() {
  const [dangTai, setDangTai] = useState(true);
  const [dangLuu, setDangLuu] = useState(false);
  const [taiLoi, setTaiLoi] = useState(false);   // chưa nạp được cài đặt → KHÔNG cho Lưu (Lưu gửi đủ 4 khoá, sẽ xoá cài đặt đã có)
  const [thongDiep, setThongDiep] = useState('');
  const [coLich, setCoLich] = useState(false);
  const [lich, setLich] = useState(() => Object.fromEntries(THU.map(([t]) => [t, { ...NGAY_MAC_DINH }])));
  const [ngayNghi, setNgayNghi] = useState([]);
  const [thongBao, setThongBao] = useState('');
  const [ngung, setNgung] = useState('0');

  const tai = async () => {
    setDangTai(true);
    try {
      const s = (await api.get('/settings')).data || {};
      const l = s.gio_hd_lich ? docJson(s.gio_hd_lich, null) : null;
      setCoLich(!!l);
      if (l) setLich(Object.fromEntries(THU.map(([t]) => [t, l[t]?.nghi ? { ...NGAY_MAC_DINH, nghi: true } : { ...NGAY_MAC_DINH, ...l[t], nghi: false }])));
      setNgayNghi(docJson(s.gio_hd_ngay_nghi || '[]', []));
      setThongBao(s.gio_hd_thong_bao || '');
      setNgung(s.gio_hd_ngung_truoc_phut || '0');
      setTaiLoi(false);
    } catch (err) { setTaiLoi(true); setThongDiep('Lỗi: chưa tải được cài đặt — tải lại trang trước khi sửa (' + err.message + ')'); }
    finally { setDangTai(false); }
  };
  useEffect(() => { tai(); }, []);

  const suaNgay = (t, truong, v) => setLich((cu) => ({ ...cu, [t]: { ...cu[t], [truong]: v } }));
  const suaNghi = (i, truong, v) => setNgayNghi((cu) => cu.map((d, j) => (j === i ? { ...d, [truong]: v } : d)));

  const luu = async () => {
    if (taiLoi) return;
    setDangLuu(true);
    try {
      const lichLuu = Object.fromEntries(THU.map(([t]) => [t, lich[t].nghi ? { nghi: true } : { mo: lich[t].mo, dong: lich[t].dong }]));
      await api.put('/settings', { settings: {
        gio_hd_lich: coLich ? JSON.stringify(lichLuu) : '',
        gio_hd_ngay_nghi: JSON.stringify(ngayNghi.filter((d) => d.ngay).map((d) => ({ ngay: d.ngay, ly_do: (d.ly_do || '').trim() }))),
        gio_hd_thong_bao: thongBao,
        gio_hd_ngung_truoc_phut: String(ngung).trim() || '0',
      } });
      setThongDiep('Đã lưu giờ hoạt động');
      setTimeout(() => setThongDiep(''), 3000);
      await tai();
    } catch (err) { setThongDiep('Lỗi: ' + err.message); }
    finally { setDangLuu(false); }
  };

  if (dangTai) return <div className="loading">Đang tải...</div>;
  const hang = { display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0', borderTop: '1px solid #eee', flexWrap: 'wrap' };
  return (
    <>
      <div className="card-title" style={{ margin: '0 0 0.5rem' }}>🕘 Giờ hoạt động</div>
      <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 1rem' }}>
        App khách xem quán đang mở hay nghỉ. <b>Quầy bán bình thường, không bị chặn.</b> Giờ đóng nhỏ hơn giờ mở = mở
        qua nửa đêm (vd 18:00 → 02:00).
      </p>
      {thongDiep && <div style={{ padding: 8, marginBottom: 8, background: thongDiep.startsWith('Lỗi') ? '#fee2e2' : '#dcfce7', borderRadius: 6 }}>{thongDiep}</div>}

      <label style={{ ...hang, borderTop: 'none', fontWeight: 600 }}>
        <input type="checkbox" checked={coLich} onChange={(e) => setCoLich(e.target.checked)} />
        Dùng lịch tuần (bỏ chọn = mở cả ngày, mọi ngày)
      </label>
      {coLich && THU.map(([t, ten]) => (
        <div key={t} style={hang}>
          <div style={{ width: 80, fontWeight: 500 }}>{ten}</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={lich[t].nghi} onChange={(e) => suaNgay(t, 'nghi', e.target.checked)} /> Nghỉ
          </label>
          {!lich[t].nghi && (
            <>
              <input type="time" className="input" style={{ width: 110 }} value={lich[t].mo} onChange={(e) => suaNgay(t, 'mo', e.target.value)} />
              <span>→</span>
              <input type="time" className="input" style={{ width: 110 }} value={lich[t].dong} onChange={(e) => suaNgay(t, 'dong', e.target.value)} />
            </>
          )}
        </div>
      ))}

      <div style={{ ...hang, fontWeight: 600, marginTop: 8 }}>Ngày nghỉ đặc biệt</div>
      {ngayNghi.map((d, i) => (
        <div key={i} style={hang}>
          <input type="date" className="input" style={{ width: 160 }} value={d.ngay || ''} onChange={(e) => suaNghi(i, 'ngay', e.target.value)} />
          <input className="input" style={{ flex: 1, minWidth: 140 }} placeholder="Lý do (vd: Nghỉ Tết)" maxLength={200} value={d.ly_do || ''}
            onChange={(e) => suaNghi(i, 'ly_do', e.target.value)} />
          <button className="btn btn-outline" onClick={() => setNgayNghi((cu) => cu.filter((_, j) => j !== i))} title="Xoá ngày nghỉ"><Trash2 size={16} /></button>
        </div>
      ))}
      <button className="btn btn-outline" style={{ marginTop: 4 }} onClick={() => setNgayNghi((cu) => [...cu, { ngay: '', ly_do: '' }])}>
        <Plus size={16} /> Thêm ngày nghỉ
      </button>

      <div style={{ ...hang, fontWeight: 600, marginTop: 12 }}>Câu báo khi quán nghỉ</div>
      <textarea className="input" rows={2} style={{ width: '100%' }} maxLength={300} value={thongBao} onChange={(e) => setThongBao(e.target.value)} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6b7280' }}>
        <button className="btn btn-outline" onClick={() => setThongBao((cu) => (cu.includes(CHU_GIO) ? cu : `${cu}${cu ? ' ' : ''}${CHU_GIO}`))}>Chèn giờ mở lại</button>
        <span>{CHU_GIO} tự điền giờ mở lại, vd "07:00" hoặc "07:00 05/11"</span>
      </div>

      <div style={{ ...hang, marginTop: 12 }}>
        <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>Ngừng nhận đơn App trước giờ đóng</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>0 = nhận tới đúng giờ đóng</div></div>
        <input type="number" className="input" style={{ width: 80, textAlign: 'right' }} min="0" max="600" value={ngung} onChange={(e) => setNgung(e.target.value)} />
        <span>phút</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button className="btn btn-primary" onClick={luu} disabled={dangLuu || taiLoi}><Save size={16} /> {dangLuu ? 'Đang lưu...' : 'Lưu'}</button>
      </div>
    </>
  );
}
