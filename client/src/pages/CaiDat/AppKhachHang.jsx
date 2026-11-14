// ND-API-1 (Q-D) — thẻ Cài đặt "📱 App khách hàng", CHỈ chủ quán: khoá sao lưu CHỈ ĐỌC cho tác vụ đêm của App KH (chỉ gọi được tải tệp Xuất
// nội dung App, không sửa / không xem gì khác). Tạo / thu hồi hỏi PIN chủ quán; khoá hiện ĐÚNG MỘT lần sau khi tạo (máy chủ chỉ giữ băm).
// Ai được sửa nội dung App: tick ở thẻ Phân quyền, nhóm "App khách hàng — nội dung".
import { useEffect, useState } from 'react';
import { Plus, Copy, Ban } from 'lucide-react';
import { ndKhoaApi } from '../../utils/api';
import { hienNgayGio } from '../../utils/ngayVN';
import { baoXong, baoLoiTu, lyDoLoi } from '../../components/thongBaoKho.js';
import LoiO from '../../components/LoiO';
import HoiPin from '../../components/HoiPin';

export default function AppKhachHang() {
  const [ds, setDs] = useState([]);
  const [ten, setTen] = useState('Sao lưu đêm GitHub');
  const [khoaMoi, setKhoaMoi] = useState('');   // khoá vừa tạo — chỉ giữ trong màn này, rời thẻ là mất
  const [taiLoi, setTaiLoi] = useState('');
  const [hoiPin, setHoiPin] = useState(null);   // null = đóng; { tieuDe, ten, viec(pin) }

  const tai = async () => {
    try { setDs((await ndKhoaApi.ds()).data || []); setTaiLoi(''); } catch (e) { setTaiLoi(lyDoLoi(e)); baoLoiTu('tải danh sách khoá sao lưu', e); }
  };
  useEffect(() => { tai(); }, []);

  const tao = () => setHoiPin({ tieuDe: 'Tạo khoá sao lưu — gõ PIN chủ quán', ten: 'tạo khoá sao lưu',
    viec: async (pin) => { const r = await ndKhoaApi.tao(ten.trim(), pin); setKhoaMoi(r.khoa); baoXong(`Đã tạo khoá "${ten.trim()}" — chép ngay, khoá chỉ hiện một lần`); await tai(); } });
  const thuHoi = (k) => setHoiPin({ tieuDe: `Thu hồi khoá "${k.ten}" — gõ PIN chủ quán`, ten: 'thu hồi khoá sao lưu',
    viec: async (pin) => { await ndKhoaApi.thuHoi(k.id, pin); baoXong(`Đã thu hồi khoá "${k.ten}" — tác vụ dùng khoá này hết tải được`); await tai(); } });
  const chep = async () => {
    try { await navigator.clipboard.writeText(khoaMoi); baoXong('Đã chép khoá'); } catch (e) { baoLoiTu('chép khoá (hãy bôi đen rồi chép tay)', e); }
  };

  return (
    <div>
      <div className="card-title" style={{ marginBottom: '0.5rem' }}>📱 App khách hàng — khoá sao lưu nội dung</div>
      <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 0.75rem' }}>
        Khoá này cho tác vụ tự động của App mỗi đêm tải một bản sao nội dung App (chữ, ảnh, phiên bản) cất sang chỗ thứ hai. Khoá CHỈ tải được bản sao —
        không sửa, không xem gì khác. Ai được sửa nội dung App: thẻ Phân quyền, nhóm "App khách hàng — nội dung".
      </p>
      <LoiO loi={taiLoi && `Chưa tải được danh sách khoá: ${taiLoi}`} />
      {khoaMoi && (
        <div style={{ padding: '0.75rem', background: '#fef9c3', border: '1px solid #fbbf24', borderRadius: 8, marginBottom: '0.75rem' }}>
          <b>Khoá mới — chép ngay, rời thẻ này là không xem lại được:</b>
          <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', margin: '0.5rem 0' }}>{khoaMoi}</div>
          <button className="btn btn-primary" onClick={chep}><Copy size={14} /> Chép khoá</button>
        </div>
      )}
      {ds.length === 0 && <div style={{ color: '#6b7280', padding: '0.5rem 0' }}>Chưa có khoá sao lưu nào.</div>}
      {ds.map((k) => (
        <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 0', borderTop: '1px solid #eee', opacity: k.thu_hoi_luc ? 0.5 : 1 }}>
          <div style={{ flex: 1 }}>
            <b>{k.ten}</b>{k.thu_hoi_luc && ` · đã thu hồi ${hienNgayGio(k.thu_hoi_luc)}`}
            <div style={{ fontSize: 13, color: '#6b7280' }}>Tạo {hienNgayGio(k.tao_luc)}{k.tao_boi ? ` bởi ${k.tao_boi}` : ''}</div>
          </div>
          {!k.thu_hoi_luc && <button className="btn btn-outline" onClick={() => thuHoi(k)}><Ban size={14} /> Thu hồi</button>}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem', maxWidth: 420 }}>
        <input className="form-input" value={ten} maxLength={60} onChange={(e) => setTen(e.target.value)} placeholder="Tên khoá" aria-label="Tên khoá" />
        <button className="btn btn-primary" disabled={!ten.trim()} onClick={tao}><Plus size={16} /> Tạo khoá</button>
      </div>
      <HoiPin mo={!!hoiPin} tieuDe={hoiPin?.tieuDe} chay={(p) => hoiPin.viec(p)} ten={hoiPin?.ten} loiKhac={(e) => baoLoiTu(hoiPin.ten, e)} dong={() => setHoiPin(null)} />
    </div>
  );
}
