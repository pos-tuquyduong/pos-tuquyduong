// NAP-1 — thẻ Cài đặt "Gói nạp": khách trả X → vào tài khoản Y (Y ≥ X; phần hơn là thưởng nạp, không hạn). Thêm / sửa / bật / tắt.
// Không xoá (đơn cũ trỏ tới gói) — bớt gói thì tắt. Máy chủ kiểm mọi giá trị (sai → 400, hiện nguyên lời báo); quầy bán gói ở màn Bán hàng mới.
// Thêm / sửa / bật / tắt CHỈ chủ quán + PIN chủ quán (chủ quán 06.11 — máy chủ chặn; người khác chỉ xem danh sách).
import { useEffect, useState } from 'react';
import { Plus, Save, Pencil, Power } from 'lucide-react';
import { goiNapApi } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const TRONG = { ten: '', khach_tra: '', vao_tk: '', thu_tu: 0 };

export default function GoiNap() {
  const { user } = useAuth();
  const laChu = user?.role === 'owner';
  const [pin, setPin] = useState('');
  const [ds, setDs] = useState([]);
  const [form, setForm] = useState(null);   // null = đóng; { id?, ...trường } = đang thêm / sửa
  const [dangLuu, setDangLuu] = useState(false);
  const [thongDiep, setThongDiep] = useState('');

  const tai = async () => {
    try { setDs(await goiNapApi.tatCa()); } catch (e) { setThongDiep('Lỗi: chưa tải được danh sách gói nạp — tải lại trang (' + e.message + ')'); }
  };
  useEffect(() => { tai(); }, []);

  const sua = (truong, v) => setForm((cu) => ({ ...cu, [truong]: v }));
  const so = (v) => (v === '' || v === null ? null : Number(v));
  const luu = async () => {
    setDangLuu(true); setThongDiep('');
    const du = { ten: form.ten, khach_tra: so(form.khach_tra), vao_tk: so(form.vao_tk), thu_tu: so(form.thu_tu) ?? 0, pin };
    try {
      if (form.id) await goiNapApi.sua(form.id, du); else await goiNapApi.them(du);
      setForm(null); setThongDiep('Đã lưu.'); await tai();
    } catch (e) { setThongDiep('Lỗi: ' + e.message); }
    setDangLuu(false);
  };
  const batTat = async (g) => {
    setThongDiep('');
    try { await goiNapApi.sua(g.id, { is_active: g.is_active ? 0 : 1, pin }); await tai(); } catch (e) { setThongDiep('Lỗi: ' + e.message); }
  };
  const thuong = form ? (so(form.vao_tk) || 0) - (so(form.khach_tra) || 0) : 0;

  return (
    <div>
      <div className="card-title" style={{ marginBottom: '0.5rem' }}>💳 Gói nạp tiền</div>
      <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 0.75rem' }}>
        Khách trả "Khách trả", tài khoản cộng "Vào tài khoản". Phần chênh là thưởng nạp (không hạn). Tiền nạp không hoàn. Bán ở màn Bán hàng → nhóm "Nạp tiền".
        {laChu ? ' Thêm / sửa / bật / tắt cần PIN chủ quán.' : ' Chỉ chủ quán thêm / sửa / bật / tắt gói.'}
      </p>
      {laChu && <input className="form-input" type="password" inputMode="numeric" maxLength={6} style={{ width: 170, marginBottom: '0.75rem' }}
        placeholder="PIN chủ quán" aria-label="PIN chủ quán để thêm / sửa / bật / tắt gói" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />}
      {thongDiep && <div style={{ margin: '0 0 0.75rem', color: thongDiep.startsWith('Lỗi') ? '#b91c1c' : '#047857' }}>{thongDiep}</div>}
      {ds.length === 0 && <div style={{ color: '#6b7280', padding: '0.5rem 0' }}>Chưa có gói nạp nào.</div>}
      {ds.map((g) => (
        <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 0', borderTop: '1px solid #eee', opacity: g.is_active ? 1 : 0.5 }}>
          <div style={{ flex: 1 }}>
            <b>{g.ten}</b>{!g.is_active && ' · đang tắt'}
            <div style={{ fontSize: 13, color: '#6b7280' }}>Khách trả {vnd(g.khach_tra)} → vào tài khoản {vnd(g.vao_tk)} (thưởng {vnd(g.vao_tk - g.khach_tra)})</div>
          </div>
          {laChu && <button className="btn btn-outline" onClick={() => setForm({ ...TRONG, ...g })}><Pencil size={14} /> Sửa</button>}
          {laChu && <button className="btn btn-outline" onClick={() => batTat(g)}><Power size={14} /> {g.is_active ? 'Tắt' : 'Bật'}</button>}
        </div>
      ))}
      {laChu && !form && <button className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={() => setForm({ ...TRONG })}><Plus size={16} /> Thêm gói</button>}
      {form && (
        <div style={{ marginTop: '0.75rem', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: 8, display: 'grid', gap: 8, maxWidth: 420 }}>
          <label>Tên gói<input className="form-input" value={form.ten} maxLength={60} onChange={(e) => sua('ten', e.target.value)} placeholder="Nạp 100k" /></label>
          <label>Khách trả (đồng)<input className="form-input" type="number" inputMode="numeric" value={form.khach_tra} onChange={(e) => sua('khach_tra', e.target.value)} /></label>
          <label>Vào tài khoản (đồng)<input className="form-input" type="number" inputMode="numeric" value={form.vao_tk} onChange={(e) => sua('vao_tk', e.target.value)} /></label>
          <label>Thứ tự hiện<input className="form-input" type="number" inputMode="numeric" value={form.thu_tu} onChange={(e) => sua('thu_tu', e.target.value)} /></label>
          <div style={{ fontSize: 13, color: thuong < 0 ? '#b91c1c' : '#6b7280' }}>{thuong < 0 ? '"Vào tài khoản" không được nhỏ hơn "Khách trả"' : `Thưởng nạp: ${vnd(thuong)}`}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" disabled={dangLuu} onClick={luu}><Save size={16} /> {dangLuu ? 'Đang lưu...' : 'Lưu'}</button>
            <button className="btn btn-outline" disabled={dangLuu} onClick={() => setForm(null)}>Huỷ</button>
          </div>
        </div>
      )}
    </div>
  );
}
