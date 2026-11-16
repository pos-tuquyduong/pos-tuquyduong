// SAOLUU-DEM-1 — thẻ Cài đặt › Sao lưu: "Sao lưu tự động lên Google Drive", CHỈ chủ quán. Mỗi đêm Google Apps Script lấy đúng tệp "Sao lưu toàn bộ"
// bằng MỘT khoá chỉ đọc. Tạo / thu hồi hỏi PIN chủ quán; khoá hiện ĐÚNG MỘT lần sau khi tạo (máy chủ chỉ giữ băm) — không lưu ở đâu trong trình duyệt.
import { useEffect, useState } from 'react';
import { Copy, KeyRound, Ban } from 'lucide-react';
import api from '../../utils/api';
import { hienNgayGio } from '../../utils/ngayVN';
import { baoXong, baoLoiTu, lyDoLoi } from '../../components/thongBaoKho.js';
import LoiO from '../../components/LoiO';
import HoiPin from '../../components/HoiPin';

const CUA = '/backup/khoa-tu-dong';
const KB = 1024;
const hienCoTep = (n) => (n >= KB * KB ? `${(n / (KB * KB)).toFixed(1)} MB` : `${Math.max(1, Math.round(n / KB))} KB`);

export default function KhoaSaoLuuPos() {
  const [tt, setTt] = useState(null);   // null = đang tải; { co_khoa, tao_luc, tao_boi, lay_luc, lay_co }
  const [khoaMoi, setKhoaMoi] = useState('');   // khoá vừa tạo — chỉ giữ trong thẻ này; đóng hộp là mất
  const [hoiThay, setHoiThay] = useState(false);   // đã có khoá: hỏi lại trước khi thay
  const [taiLoi, setTaiLoi] = useState('');
  const [hoiPin, setHoiPin] = useState(null);   // null = đóng; { tieuDe, ten, viec(pin) }

  const tai = async () => {
    try { setTt((await api.get(CUA)).data); setTaiLoi(''); } catch (e) { setTaiLoi(lyDoLoi(e)); baoLoiTu('tải trạng thái sao lưu tự động', e); }
  };
  useEffect(() => { tai(); }, []);

  const tao = () => { setHoiThay(false); setHoiPin({ tieuDe: 'Tạo khoá sao lưu tự động — gõ PIN chủ quán', ten: 'tạo khoá sao lưu tự động',
    viec: async (pin) => { const r = await api.post(CUA, { pin }); setKhoaMoi(r.khoa); baoXong('Đã tạo khoá sao lưu tự động — chép ngay, khoá chỉ hiện một lần'); await tai(); } }); };
  const thuHoi = () => setHoiPin({ tieuDe: 'Thu hồi khoá sao lưu tự động — gõ PIN chủ quán', ten: 'thu hồi khoá sao lưu tự động',
    viec: async (pin) => { await api.post(`${CUA}/thu-hoi`, { pin }); setKhoaMoi(''); baoXong('Đã thu hồi khoá — Google hết lấy được bản sao lưu'); await tai(); } });
  const chep = async () => {
    try { await navigator.clipboard.writeText(khoaMoi); baoXong('Đã chép khoá'); } catch (e) { baoLoiTu('chép khoá (hãy bôi đen rồi chép tay)', e); }
  };

  return (
    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 8, marginBottom: '1rem' }}>
      <div className="card-title" style={{ marginBottom: '0.5rem' }}>☁️ Sao lưu tự động lên Google Drive</div>
      <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 0.75rem' }}>
        Mỗi đêm Google tự lấy một bản "Sao lưu toàn bộ" (giống nút Tải tất cả) bằng một khoá chỉ đọc. Khoá không sửa được dữ liệu và không mở được chỗ nào khác.
      </p>
      <LoiO loi={taiLoi && `Chưa tải được trạng thái: ${taiLoi}`} />
      {tt && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div><b>{tt.co_khoa ? 'Có khoá' : 'Chưa có khoá'}</b>{tt.co_khoa && ` — tạo lúc ${hienNgayGio(tt.tao_luc)}${tt.tao_boi ? ` bởi ${tt.tao_boi}` : ''}`}</div>
          <div style={{ fontSize: 13, color: '#374151' }}>
            Lần Google lấy gần nhất: {tt.lay_luc ? `${hienNgayGio(tt.lay_luc)} · ${hienCoTep(tt.lay_co)}` : 'Chưa lấy lần nào'}
          </div>
        </div>
      )}
      {khoaMoi && (
        <div style={{ padding: '0.75rem', background: '#fef9c3', border: '1px solid #fbbf24', borderRadius: 8, marginBottom: '0.75rem' }}>
          <b>Khoá mới — chép ngay, đóng hộp này là không xem lại được:</b>
          <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', margin: '0.5rem 0' }}>{khoaMoi}</div>
          <div style={{ fontSize: 13, marginBottom: '0.5rem' }}>Dán vào Apps Script › Cài đặt dự án › Thuộc tính tập lệnh, tên KHOA_POS. Không gửi khoá qua chat / Zalo.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={chep}><Copy size={14} /> Chép</button>
            <button className="btn btn-outline" onClick={() => setKhoaMoi('')}>Đóng</button>
          </div>
        </div>
      )}
      {hoiThay && (
        <div style={{ padding: '0.6rem', background: '#fee2e2', borderRadius: 8, marginBottom: '0.75rem' }}>
          Khoá cũ sẽ ngừng dùng ngay — nhớ dán khoá mới vào Apps Script, không thì đêm nay Google không lấy được bản sao lưu.
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button className="btn btn-primary" onClick={tao}>Vẫn tạo khoá mới</button>
            <button className="btn btn-outline" onClick={() => setHoiThay(false)}>Thôi</button>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" disabled={!tt} onClick={() => (tt.co_khoa ? setHoiThay(true) : tao())}><KeyRound size={14} /> Tạo khoá mới</button>
        {tt?.co_khoa && <button className="btn btn-outline" onClick={thuHoi}><Ban size={14} /> Thu hồi khoá</button>}
      </div>
      <HoiPin mo={!!hoiPin} tieuDe={hoiPin?.tieuDe} chay={(p) => hoiPin.viec(p)} ten={hoiPin?.ten} loiKhac={(e) => baoLoiTu(hoiPin.ten, e)} dong={() => setHoiPin(null)} />
    </div>
  );
}
