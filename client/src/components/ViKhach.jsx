/**
 * ViKhach — khu "Ví" trong ô chi tiết một khách (GIAO-DIEN-1 C), thay màn Số dư cũ: số dư · Lịch sử ví · Điều chỉnh · Nạp tay (thử).
 * Quyền như cũ: xem số dư = view_customer_balance, Điều chỉnh = adjust_balance; "Nạp tay (thử)" CHỈ chủ quán (role owner).
 * Máy chủ vẫn là bên kiểm quyền thật (POST /wallets/topup + /adjust). `onDoi` = tải lại danh sách khách sau khi ví đổi.
 */
import { useState } from 'react';
import { walletsApi } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { hienNgayGio } from '../utils/ngayVN';
import { X } from 'lucide-react';

const tien = (n) => (n || 0).toLocaleString() + 'đ';
const ngayGio = (d) => (d ? hienNgayGio(d, { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-');

function KhungModal({ tieuDe, dong, children, rong }) {
  return (
    <div className="modal-overlay" onClick={dong}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={rong ? { maxWidth: '600px' } : undefined}>
        <div className="modal-header">
          <div className="modal-title">{tieuDe}</div>
          <button className="btn btn-outline" onClick={dong}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ViKhach({ khach, onDoi }) {
  const { hasPermission, user } = useAuth();
  const [cua, setCua] = useState(null);   // null | 'nap' | 'chinh' | 'lichsu'
  const [nhap, setNhap] = useState({ amount: '', text: '' });
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState('');
  const [ok, setOk] = useState('');
  const [gd, setGd] = useState({ dang: false, ds: [] });

  if (!hasPermission('view_customer_balance') || !khach?.phone) return null;
  const ten = khach.name || khach.phone;
  const mo = (c) => { setCua(c); setNhap({ amount: '', text: '' }); setLoi(''); setOk(''); };

  const moLichSu = async () => {
    mo('lichsu');
    setGd({ dang: true, ds: [] });
    try { setGd({ dang: false, ds: (await walletsApi.transactions(khach.phone)).transactions || [] }); } catch { setGd({ dang: false, ds: [] }); }
  };
  const gui = async (e, nap) => {
    e.preventDefault();
    setDang(true); setLoi('');
    try {
      const so = parseInt(nhap.amount);
      const r = nap
        ? await walletsApi.topup({ phone: khach.phone, amount: so, customer_name: khach.name, notes: nhap.text, payment_method: 'cash' })
        : await walletsApi.adjust({ phone: khach.phone, amount: so, customer_name: khach.name, reason: nhap.text });
      setOk(`${nap ? 'Đã nạp' : 'Đã điều chỉnh'} ${(nap ? so : r.adjusted).toLocaleString()}đ cho ${ten}. Số dư mới: ${r.balance.toLocaleString()}đ`);
      setCua(null);
      onDoi?.();
    } catch (err) { setLoi(err.message); } finally { setDang(false); }
  };

  const bieuMau = (nap) => (
    <form onSubmit={(e) => gui(e, nap)}>
      <div className="modal-body">
        {loi && <div className="alert alert-danger">{loi}</div>}
        <div className="form-group"><label className="form-label">Khách hàng</label><input className="input" value={`${ten} - ${khach.phone}`} disabled /></div>
        <div className="form-group">
          <label className="form-label">{nap ? 'Số tiền nạp *' : 'Số tiền điều chỉnh *'}</label>
          <input type="number" className="input" value={nhap.amount} onChange={(e) => setNhap({ ...nhap, amount: e.target.value })} required
            placeholder={nap ? '500000' : 'VD: 50000 hoặc -30000'} {...(nap ? { min: '1000', step: '1000' } : {})} />
          <div className="text-sm text-gray mt-1">{nap ? (nhap.amount && `= ${parseInt(nhap.amount || 0).toLocaleString()}đ`) : 'Nhập số dương để tăng, số âm để giảm'}</div>
        </div>
        <div className="form-group">
          <label className="form-label">{nap ? 'Lý do / Ghi chú' : 'Lý do điều chỉnh *'}</label>
          <input className="input" value={nhap.text} onChange={(e) => setNhap({ ...nhap, text: e.target.value })}
            placeholder={nap ? 'VD: Nạp trước 2 tháng' : 'VD: Sửa lỗi nhập sai, bù trừ...'} {...(nap ? {} : { required: true, minLength: 3 })} />
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-outline" onClick={() => setCua(null)}>Hủy</button>
        <button type="submit" className={`btn ${nap ? 'btn-success' : 'btn-warning'}`} disabled={dang}>
          {dang ? 'Đang xử lý...' : nap ? 'Xác nhận nạp tiền' : 'Xác nhận điều chỉnh'}
        </button>
      </div>
    </form>
  );

  return (
    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 600 }}>💰 Ví: <span style={{ color: khach.balance > 0 ? '#22c55e' : '#64748b' }}>{tien(khach.balance)}</span></div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={moLichSu}>Lịch sử ví</button>
          {hasPermission('adjust_balance') && <button className="btn btn-warning" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => mo('chinh')}>Điều chỉnh</button>}
          {user?.role === 'owner' && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => mo('nap')}>Nạp tay (thử)</button>}
        </div>
      </div>
      {ok && <div className="alert alert-success" style={{ marginTop: 8 }}>{ok}</div>}

      {cua === 'nap' && <KhungModal tieuDe="💰 Nạp tay (thử)" dong={() => setCua(null)}>{bieuMau(true)}</KhungModal>}
      {cua === 'chinh' && <KhungModal tieuDe="⚖️ Điều chỉnh số dư" dong={() => setCua(null)}>{bieuMau(false)}</KhungModal>}
      {cua === 'lichsu' && (
        <KhungModal tieuDe={`📜 Lịch sử ví - ${ten}`} dong={() => setCua(null)} rong>
          <div className="modal-body">
            {gd.dang ? <div className="loading">Đang tải...</div> : gd.ds.length === 0 ? <div className="text-gray text-center">Chưa có giao dịch nào</div> : (
              <table className="table">
                <thead><tr><th>Thời gian</th><th>Loại</th><th style={{ textAlign: 'right' }}>Số tiền</th><th style={{ textAlign: 'right' }}>Số dư</th><th>Ghi chú</th></tr></thead>
                <tbody>
                  {gd.ds.map((t) => (
                    <tr key={t.id}>
                      <td className="text-sm">{ngayGio(t.created_at)}</td>
                      <td><span className={`badge ${{ topup: 'badge-success', purchase: 'badge-warning', refund: 'badge-info' }[t.type] || 'badge-gray'}`}>{{ topup: 'Nạp', purchase: 'Mua', refund: 'Hoàn' }[t.type] || t.type}</span></td>
                      <td style={{ textAlign: 'right' }}><span style={{ color: t.amount > 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{t.amount > 0 ? '+' : ''}{tien(t.amount)}</span></td>
                      <td style={{ textAlign: 'right' }} className="text-gray">{tien(t.balance_after)}</td>
                      <td className="text-sm">{t.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </KhungModal>
      )}
    </div>
  );
}
