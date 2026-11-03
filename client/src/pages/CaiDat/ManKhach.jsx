// MANKHACH-1 (D) — thẻ Cài đặt "Màn khách": danh sách trang chạy lúc rảnh, địa chỉ QR App, hiện tên khách, các màn đã ghép + thu hồi.
// Lưu ba khoá man_khach_* qua PUT /settings (máy chủ kiểm bằng utils/manKhach.kiemCaiDat — sai một khoá thì không ghi khoá nào).
import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { api, manKhachApi } from '../../utils/api';

const LOAI = { menu: 'Thực đơn (giá, hết hàng tự cập nhật)', flash: 'Giờ vàng (chỉ hiện khi đang chạy)', qr_app: 'QR tải App / tích điểm', chu: 'Chữ giới thiệu', anh: 'Ảnh (chờ có chỗ lưu ảnh)' };
const MAC_DINH = [{ loai: 'menu', bat: true, giay: 15 }, { loai: 'flash', bat: true, giay: 10 }, { loai: 'qr_app', bat: true, giay: 10 }];
const GIAY_MAC_DINH = 10;
const docJson = (s) => { try { return JSON.parse(s); } catch { return undefined; } };

export default function CaiDatManKhach() {
  const [trang, setTrang] = useState(MAC_DINH);
  const [diaChi, setDiaChi] = useState('');
  const [hienTen, setHienTen] = useState(false);
  const [may, setMay] = useState([]);
  const [taiLoi, setTaiLoi] = useState(false);   // chưa nạp được cài đặt → KHÔNG cho Lưu (Lưu ghi đè cả danh sách)
  const [dangLuu, setDangLuu] = useState(false);
  const [thongDiep, setThongDiep] = useState('');

  const tai = async () => {
    try {
      const s = (await api.get('/settings')).data || {};
      const ds = docJson(s.man_khach_trang);
      setTrang(Array.isArray(ds) ? ds : MAC_DINH);
      setDiaChi(s.man_khach_dia_chi_app || '');
      setHienTen(s.man_khach_hien_ten === '1');
      setTaiLoi(false);
    } catch (e) { setTaiLoi(true); setThongDiep('Lỗi: chưa tải được cài đặt — tải lại trang trước khi sửa (' + e.message + ')'); }
    try { setMay((await manKhachApi.danhSachMay()).may || []); } catch { /* danh sách máy lỗi: phần cài đặt vẫn dùng được */ }
  };
  useEffect(() => { tai(); }, []);

  const sua = (i, truong, v) => setTrang((cu) => cu.map((t, j) => (j === i ? { ...t, [truong]: v } : t)));
  const doi = (i, d) => setTrang((cu) => { const j = i + d; if (j < 0 || j >= cu.length) return cu; const m = [...cu]; [m[i], m[j]] = [m[j], m[i]]; return m; });
  const them = (loai) => setTrang((cu) => [...cu, { loai, bat: loai !== 'anh', giay: GIAY_MAC_DINH }]);

  const luu = async () => {
    setDangLuu(true); setThongDiep('');
    try {
      const sach = trang.map((t) => ({ loai: t.loai, bat: !!t.bat, giay: Number(t.giay), ...(t.tieu_de ? { tieu_de: t.tieu_de } : {}), ...(t.noi_dung ? { noi_dung: t.noi_dung } : {}) }));
      await api.put('/settings', { settings: { man_khach_trang: JSON.stringify(sach), man_khach_dia_chi_app: diaChi.trim(), man_khach_hien_ten: hienTen ? '1' : '0' } });
      setThongDiep('Đã lưu. Màn khách cập nhật trong khoảng một phút.');
    } catch (e) { setThongDiep('Lỗi: ' + e.message); }
    setDangLuu(false);
  };
  const thuHoi = async (m) => {
    if (!window.confirm(`Thu hồi màn “${m.ten}”? Màn này sẽ phải nhập mã ghép mới.`)) return;
    try { await manKhachApi.thuHoi(m.id); setMay((cu) => cu.filter((x) => x.id !== m.id)); } catch (e) { setThongDiep('Lỗi: ' + e.message); }
  };

  const hang = { display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0', borderTop: '1px solid #eee', flexWrap: 'wrap' };
  return (
    <>
      <div className="card-title" style={{ margin: '0 0 0.5rem' }}>🖥️ Màn khách</div>
      <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 1rem' }}>
        Máy tính bảng quay về phía khách: lúc thu hiện mã QR + món + tổng; lúc rảnh chạy vòng các trang dưới đây. Ghép máy: mở trang <b>/man-khach</b> trên
        máy tính bảng, nhập mã ở nút “Màn khách” góc màn Bán hàng.
      </p>
      {thongDiep && <div style={{ padding: 8, marginBottom: 8, background: thongDiep.startsWith('Lỗi') ? '#fee2e2' : '#dcfce7', borderRadius: 6 }}>{thongDiep}</div>}

      <div style={{ fontWeight: 600 }}>Các trang lúc rảnh (chạy từ trên xuống)</div>
      {trang.map((t, i) => (
        <div key={i} style={hang}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 90 }}>
            <input type="checkbox" checked={!!t.bat} disabled={t.loai === 'anh'} onChange={(e) => sua(i, 'bat', e.target.checked)} /> Bật
          </label>
          <div style={{ flex: '1 1 220px', fontWeight: 500 }}>{LOAI[t.loai] || t.loai}</div>
          <input type="number" className="input" style={{ width: 80 }} min={3} max={120} value={t.giay} onChange={(e) => sua(i, 'giay', e.target.value)} aria-label="Số giây" /> giây
          <button className="btn btn-outline" onClick={() => doi(i, -1)} aria-label="Lên"><ArrowUp size={14} /></button>
          <button className="btn btn-outline" onClick={() => doi(i, 1)} aria-label="Xuống"><ArrowDown size={14} /></button>
          <button className="btn btn-outline" onClick={() => setTrang((cu) => cu.filter((_, j) => j !== i))} aria-label="Xoá"><Trash2 size={14} /></button>
          {(t.loai === 'chu' || t.loai === 'qr_app') && (
            <div style={{ flexBasis: '100%', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="input" style={{ flex: '1 1 200px' }} maxLength={80} placeholder="Tiêu đề" value={t.tieu_de || ''} onChange={(e) => sua(i, 'tieu_de', e.target.value)} />
              <textarea className="input" style={{ flex: '2 1 300px' }} maxLength={500} rows={2} placeholder="Nội dung" value={t.noi_dung || ''} onChange={(e) => sua(i, 'noi_dung', e.target.value)} />
            </div>
          )}
        </div>
      ))}
      <div style={{ ...hang, gap: 6 }}>
        <Plus size={14} />
        {['menu', 'flash', 'qr_app', 'chu'].map((l) => <button key={l} className="btn btn-outline" onClick={() => them(l)}>{LOAI[l].split(' (')[0]}</button>)}
      </div>

      <div style={{ ...hang, flexDirection: 'column', alignItems: 'stretch' }}>
        <label style={{ fontWeight: 600 }}>Địa chỉ App khách (mã QR ở trang “QR tải App”)</label>
        <input className="input" maxLength={300} placeholder="https://…" value={diaChi} onChange={(e) => setDiaChi(e.target.value)} />
      </div>
      <label style={{ ...hang, fontWeight: 500 }}>
        <input type="checkbox" checked={hienTen} onChange={(e) => setHienTen(e.target.checked)} />
        Hiện tên khách trên màn khách lúc thu (chỉ khi nhân viên đã chọn khách; không bao giờ hiện số điện thoại, số dư, điểm)
      </label>
      <div style={{ marginTop: '0.5rem' }}>
        <button className="btn btn-primary" onClick={luu} disabled={dangLuu || taiLoi}><Save size={16} /> {dangLuu ? 'Đang lưu...' : 'Lưu'}</button>
      </div>

      <div style={{ fontWeight: 600, marginTop: '1.5rem' }}>Màn khách đã ghép</div>
      {may.length === 0 && <div style={{ color: '#6b7280', padding: '0.5rem 0' }}>Chưa ghép màn nào.</div>}
      {may.map((m) => (
        <div key={m.id} style={hang}>
          <div style={{ flex: 1 }}>{m.ten} <span style={{ color: '#6b7280', fontSize: 12 }}>· ghép lúc {String(m.tao_luc).replace('T', ' ')}</span></div>
          <button className="btn btn-outline" onClick={() => thuHoi(m)}>Thu hồi</button>
        </div>
      ))}
    </>
  );
}
