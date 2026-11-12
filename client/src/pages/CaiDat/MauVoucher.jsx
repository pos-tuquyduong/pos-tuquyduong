// VOUCHER-2 — Cài đặt → Mẫu voucher. Mỗi lần phát (đổi điểm, giới thiệu, khách mới…) máy chủ sinh MỘT mã riêng từ mẫu (utils/voucherCode.js).
// Câu khách thấy do MÁY CHỦ dựng (POST /rewards/mau/mo-ta) — màn này không tự dựng câu. Lưu cần quyền manage_promotions (máy chủ chặn).
// "Tối đa N voucher / đơn" là cài đặt voucher_toi_da (1–10). Sửa mẫu không đổi voucher đã phát.
import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { baoXong, baoLoiTu } from '../../components/thongBaoKho.js';

const KIEU = [['tien', 'Giảm số tiền'], ['phan_tram', 'Giảm % (có trần)'], ['ship_tien', 'Giảm phí giao — số tiền'], ['ship_phan_tram', 'Giảm phí giao — % (có trần)']];
const AP_DUNG = [['tat_ca', 'Tất cả món'], ['nhom', 'Nhóm món (mã nhóm)'], ['mon', 'Món chọn (mã món)']];
const MOI = { ten: '', kieu: 'tien', gia_tri: '', tran: '', don_toi_thieu: '', ap_dung: 'tat_ca', ap_dung_ids: '', han_ngay: 30, chinh_chu: 0, bat: 1 };
const O = { padding: '0.4rem', border: '1px solid #d1d5db', borderRadius: 6, width: '100%' };
const laPhanTram = (k) => k === 'phan_tram' || k === 'ship_phan_tram';

// Form → thân gửi máy chủ (số nguyên; danh sách id gõ "1, 2" → [1, 2]). Máy chủ kiểm lại hết (kiemMau).
const thanGui = (f) => ({
  ten: f.ten, kieu: f.kieu, gia_tri: Number(f.gia_tri), tran: laPhanTram(f.kieu) ? Number(f.tran || 0) : 0, don_toi_thieu: Number(f.don_toi_thieu || 0),
  ap_dung: f.kieu.startsWith('ship') ? 'tat_ca' : f.ap_dung, han_ngay: Number(f.han_ngay), chinh_chu: f.chinh_chu ? 1 : 0, bat: f.bat ? 1 : 0,
  ap_dung_ids: f.ap_dung === 'tat_ca' || f.kieu.startsWith('ship') ? null : String(f.ap_dung_ids).split(',').map((x) => Number(x.trim())).filter(Boolean),
});

export default function MauVoucher() {
  const { hasPermission } = useAuth();
  const duocSua = hasPermission('manage_promotions');
  const [ds, setDs] = useState([]);
  const [form, setForm] = useState(null);   // null = đang đóng; { id? , … } = đang thêm / sửa
  const [xem, setXem] = useState('');
  const [toiDa, setToiDa] = useState('3');
  const [dangLuu, setDangLuu] = useState(false);

  const tai = async () => {
    try {
      setDs((await api.get('/rewards/mau')).data || []);
      setToiDa(String((await api.get('/settings')).data?.voucher_toi_da || '3'));
    } catch (e) { baoLoiTu('tải mẫu voucher', e); }
  };
  useEffect(() => { tai(); }, []);

  // Xem trước câu khách thấy mỗi khi đổi form (máy chủ dựng; form chưa hợp lệ → hiện lý do).
  useEffect(() => {
    if (!form) return undefined;
    const h = setTimeout(async () => {
      try { setXem((await api.post('/rewards/mau/mo-ta', thanGui(form))).mo_ta); } catch (e) { setXem('— ' + e.message); }
    }, 300);
    return () => clearTimeout(h);
  }, [form]);

  const luu = async () => {
    setDangLuu(true);
    try {
      const r = form.id ? await api.put(`/rewards/mau/${form.id}`, thanGui(form)) : await api.post('/rewards/mau', thanGui(form));
      baoXong(r.message || 'Đã lưu mẫu voucher');
      setForm(null);
      await tai();
    } catch (e) { baoLoiTu('lưu mẫu voucher', e); }
    setDangLuu(false);
  };
  const batTat = async (m) => {
    try { await api.put(`/rewards/mau/${m.id}`, { bat: m.bat ? 0 : 1 }); baoXong(`Đã ${m.bat ? 'tắt' : 'bật'} mẫu "${m.ten}"`); await tai(); } catch (e) { baoLoiTu('đổi mẫu voucher', e); }
  };
  const luuToiDa = async () => {
    try { await api.put('/settings', { settings: { voucher_toi_da: toiDa } }); baoXong(`Đã lưu: tối đa ${toiDa} voucher mỗi đơn`); } catch (e) { baoLoiTu('lưu số voucher tối đa', e); }
  };
  const sua = (m) => setForm({ ...m, ap_dung_ids: (() => { try { return JSON.parse(m.ap_dung_ids || '[]').join(', '); } catch { return ''; } })() });
  const o = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value }));

  return (
    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
      <div className="card-title" style={{ marginBottom: '0.5rem' }}>🎟️ Mẫu voucher</div>
      <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 0.75rem' }}>
        Mỗi lần phát, máy sinh một mã riêng từ mẫu (hạn tính từ lúc phát). Voucher không giảm thẻ hạng, gói trả trước, nạp tiền. Sửa mẫu không đổi voucher đã
        phát.{duocSua ? '' : ' Bạn chỉ xem được — cần quyền "Quản lý khuyến mãi" để sửa.'}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <label htmlFor="voucher-toi-da">Tối đa voucher mỗi đơn (1–10, chưa tính mã khuyến mãi chung):</label>
        <input id="voucher-toi-da" type="number" min="1" max="10" value={toiDa} onChange={(e) => setToiDa(e.target.value)} style={{ ...O, width: 70 }} disabled={!duocSua} />
        {duocSua && <button className="btn btn-outline" onClick={luuToiDa}>Lưu</button>}
        {duocSua && !form && <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setForm({ ...MOI })}>+ Thêm mẫu</button>}
      </div>

      {form && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem', display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <label>Tên hiển thị<input style={O} value={form.ten} onChange={o('ten')} /></label>
          <label>Kiểu<select style={O} value={form.kieu} onChange={o('kieu')}>{KIEU.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
          <label>{laPhanTram(form.kieu) ? 'Phần trăm giảm (%)' : 'Số tiền giảm (đ)'}<input style={O} type="number" min="1" value={form.gia_tri} onChange={o('gia_tri')} /></label>
          {laPhanTram(form.kieu) && <label>Trần giảm (đ, 0 = không trần)<input style={O} type="number" min="0" value={form.tran} onChange={o('tran')} /></label>}
          <label>Đơn tối thiểu (đ, tính trên món thường)<input style={O} type="number" min="0" value={form.don_toi_thieu} onChange={o('don_toi_thieu')} /></label>
          {!form.kieu.startsWith('ship') && (
            <label>Áp dụng<select style={O} value={form.ap_dung} onChange={o('ap_dung')}>{AP_DUNG.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
          )}
          {!form.kieu.startsWith('ship') && form.ap_dung !== 'tat_ca' && (
            <label>{form.ap_dung === 'nhom' ? 'Mã nhóm' : 'Mã món'} (cách nhau dấu phẩy)<input style={O} value={form.ap_dung_ids} onChange={o('ap_dung_ids')} /></label>
          )}
          <label>Hạn dùng (số ngày từ lúc phát)<input style={O} type="number" min="1" value={form.han_ngay} onChange={o('han_ngay')} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={!!form.chinh_chu} onChange={o('chinh_chu')} /> Chỉ chính chủ (không tích = ai cầm mã cũng dùng)
          </label>
          <div style={{ gridColumn: '1 / -1', background: '#f9fafb', padding: '0.5rem', borderRadius: 6 }}>Khách thấy: <b>{xem}</b></div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={() => setForm(null)} disabled={dangLuu}>Huỷ</button>
            <button className="btn btn-primary" onClick={luu} disabled={dangLuu}>{dangLuu ? 'Đang lưu...' : 'Lưu mẫu'}</button>
          </div>
        </div>
      )}

      {ds.length === 0 && <div style={{ color: '#9ca3af', fontSize: 13 }}>Chưa có mẫu nào.</div>}
      {ds.map((m) => (
        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.45rem 0', borderTop: '1px solid #f3f4f6', opacity: m.bat ? 1 : 0.55 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{m.ten}{m.chinh_chu ? ' · chỉ chính chủ' : ''}{m.bat ? '' : ' · đang tắt'}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{m.mo_ta}</div>
          </div>
          {duocSua && <button className="btn btn-outline" onClick={() => sua(m)}>Sửa</button>}
          {duocSua && <button className="btn btn-outline" onClick={() => batTat(m)}>{m.bat ? 'Tắt' : 'Bật'}</button>}
        </div>
      ))}
    </div>
  );
}
