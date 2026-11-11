// NAP-1 — thẻ Cài đặt "Gói nạp": khách trả X → vào tài khoản Y (Y ≥ X; phần hơn là thưởng nạp, không hạn). Thêm / sửa / bật / tắt.
// Không xoá (đơn cũ trỏ tới gói) — bớt gói thì tắt. Máy chủ kiểm mọi giá trị (sai → 400, hiện nguyên lời báo); quầy bán gói ở màn Bán hàng mới.
// Thêm / sửa / bật / tắt CHỈ chủ quán + PIN chủ quán (chủ quán 06.11 — máy chủ chặn; người khác chỉ xem danh sách).
// BAO-1b: bấm Lưu / Bật / Tắt thì HỎI PIN (ô nổi); lỗi ô hiện dưới ô; báo qua thông báo chung; form đang sửa có thanh "Có thay đổi chưa lưu".
import { useEffect, useState } from 'react';
import { Plus, Save, Pencil, Power } from 'lucide-react';
import { goiNapApi } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { baoXong, baoLoiTu, baoLoi, lyDoLoi } from '../../components/thongBaoKho.js';
import LoiO from '../../components/LoiO';
import ThanhLuu from '../../components/ThanhLuu';
import HoiPin from '../../components/HoiPin';
import useThayDoi from '../../components/useThayDoi';

const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const TRONG = { ten: '', khach_tra: '', vao_tk: '', thu_tu: 0 };

export default function GoiNap() {
  const { user } = useAuth();
  const laChu = user?.role === 'owner';
  const [ds, setDs] = useState([]);
  const [form, setForm] = useState(null);   // null = đóng; { id?, ...trường } = đang thêm / sửa
  const [dangLuu, setDangLuu] = useState(false);
  const [taiLoi, setTaiLoi] = useState('');
  const [loiO, setLoiO] = useState({});   // ô → câu lỗi hiện dưới ô
  const [loiLuu, setLoiLuu] = useState('');
  const [hoiPin, setHoiPin] = useState(null);   // null = đóng; { tieuDe, ten, viec(pin) }
  const [coDoi, chup] = useThayDoi(form);

  const tai = async () => {
    try { setDs(await goiNapApi.tatCa()); setTaiLoi(''); } catch (e) { setTaiLoi(lyDoLoi(e)); baoLoiTu('tải danh sách gói nạp', e); }
  };
  useEffect(() => { tai(); }, []);

  const moForm = (f) => { setForm(f); chup(f); setLoiO({}); setLoiLuu(''); };
  const sua = (truong, v) => setForm((cu) => ({ ...cu, [truong]: v }));
  const so = (v) => (v === '' || v === null ? null : Number(v));
  const luuThat = async (pin) => {
    setDangLuu(true);
    const du = { ten: form.ten, khach_tra: so(form.khach_tra), vao_tk: so(form.vao_tk), thu_tu: so(form.thu_tu) ?? 0, pin };
    try {
      if (form.id) await goiNapApi.sua(form.id, du); else await goiNapApi.them(du);
      baoXong(`Đã lưu gói nạp ${form.ten}: khách trả ${vnd(du.khach_tra)} → vào tài khoản ${vnd(du.vao_tk)}`);
      moForm(null); await tai();
    } finally { setDangLuu(false); }
  };
  const luu = () => {
    const l = {};
    if (!String(form.ten || '').trim()) l.ten = 'Nhập tên gói';
    if (!(Number.isInteger(so(form.khach_tra)) && so(form.khach_tra) > 0)) l.khach_tra = 'Số tiền khách trả phải là số đồng nguyên lớn hơn 0';
    if (!(Number.isInteger(so(form.vao_tk)) && so(form.vao_tk) >= so(form.khach_tra))) l.vao_tk = '"Vào tài khoản" phải là số đồng nguyên, không nhỏ hơn "Khách trả"';
    setLoiO(l); setLoiLuu('');
    if (Object.keys(l).length) { baoLoi('Chưa lưu gói nạp được', 'Sửa các ô báo đỏ rồi bấm Lưu lại.'); return; }
    setHoiPin({ tieuDe: 'Lưu gói nạp — gõ PIN chủ quán', ten: 'lưu gói nạp', viec: luuThat });
  };
  const batTat = (g) => setHoiPin({ tieuDe: `${g.is_active ? 'Tắt' : 'Bật'} gói ${g.ten} — gõ PIN chủ quán`, ten: `${g.is_active ? 'tắt' : 'bật'} gói nạp`,
    viec: async (pin) => { await goiNapApi.sua(g.id, { is_active: g.is_active ? 0 : 1, pin }); baoXong(`Đã ${g.is_active ? 'tắt' : 'bật'} gói nạp ${g.ten}`); await tai(); } });
  const thuong = form ? (so(form.vao_tk) || 0) - (so(form.khach_tra) || 0) : 0;

  return (
    <div>
      <div className="card-title" style={{ marginBottom: '0.5rem' }}>💳 Gói nạp tiền</div>
      <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 0.75rem' }}>
        Khách trả "Khách trả", tài khoản cộng "Vào tài khoản". Phần chênh là thưởng nạp (không hạn). Tiền nạp không hoàn. Bán ở màn Bán hàng → nhóm "Nạp tiền".
        {laChu ? ' Bấm Lưu / Bật / Tắt thì máy hỏi PIN chủ quán.' : ' Chỉ chủ quán thêm / sửa / bật / tắt gói.'}
      </p>
      <LoiO loi={taiLoi && `Chưa tải được danh sách gói nạp: ${taiLoi}`} />
      {ds.length === 0 && <div style={{ color: '#6b7280', padding: '0.5rem 0' }}>Chưa có gói nạp nào.</div>}
      {ds.map((g) => (
        <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 0', borderTop: '1px solid #eee', opacity: g.is_active ? 1 : 0.5 }}>
          <div style={{ flex: 1 }}>
            <b>{g.ten}</b>{!g.is_active && ' · đang tắt'}
            <div style={{ fontSize: 13, color: '#6b7280' }}>Khách trả {vnd(g.khach_tra)} → vào tài khoản {vnd(g.vao_tk)} (thưởng {vnd(g.vao_tk - g.khach_tra)})</div>
          </div>
          {laChu && <button className="btn btn-outline" onClick={() => moForm({ ...TRONG, ...g })}><Pencil size={14} /> Sửa</button>}
          {laChu && <button className="btn btn-outline" onClick={() => batTat(g)}><Power size={14} /> {g.is_active ? 'Tắt' : 'Bật'}</button>}
        </div>
      ))}
      {laChu && !form && <button className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={() => moForm({ ...TRONG })}><Plus size={16} /> Thêm gói</button>}
      {form && (
        <div style={{ marginTop: '0.75rem', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: 8, display: 'grid', gap: 8, maxWidth: 420 }}>
          <label>Tên gói<input className="form-input" value={form.ten} maxLength={60} onChange={(e) => sua('ten', e.target.value)} placeholder="Nạp 100k" /><LoiO loi={loiO.ten} /></label>
          <label>Khách trả (đồng)<input className="form-input" type="number" inputMode="numeric" value={form.khach_tra} onChange={(e) => sua('khach_tra', e.target.value)} /><LoiO loi={loiO.khach_tra} /></label>
          <label>Vào tài khoản (đồng)<input className="form-input" type="number" inputMode="numeric" value={form.vao_tk} onChange={(e) => sua('vao_tk', e.target.value)} /><LoiO loi={loiO.vao_tk} /></label>
          <label>Thứ tự hiện<input className="form-input" type="number" inputMode="numeric" value={form.thu_tu} onChange={(e) => sua('thu_tu', e.target.value)} /></label>
          <div style={{ fontSize: 13, color: thuong < 0 ? '#b91c1c' : '#6b7280' }}>{thuong < 0 ? '"Vào tài khoản" không được nhỏ hơn "Khách trả"' : `Thưởng nạp: ${vnd(thuong)}`}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" disabled={dangLuu} onClick={luu}><Save size={16} /> {dangLuu ? 'Đang lưu…' : 'Lưu'}</button>
            <button className="btn btn-outline" disabled={dangLuu} onClick={() => moForm(null)}>Huỷ</button>
          </div>
          <LoiO loi={loiLuu} />
        </div>
      )}
      <HoiPin mo={!!hoiPin} tieuDe={hoiPin?.tieuDe} chay={(p) => hoiPin.viec(p)} ten={hoiPin?.ten} loiKhac={(e) => { setLoiLuu(lyDoLoi(e)); baoLoiTu(hoiPin.ten, e); }} dong={() => setHoiPin(null)} />
      <ThanhLuu id="goi-nap" coDoi={coDoi} dangLuu={dangLuu} onLuu={luu} onBo={() => moForm(null)} />
    </div>
  );
}
