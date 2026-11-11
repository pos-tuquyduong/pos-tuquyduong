// HANG-1 — trang Khách hàng: "Cấp hạng" (chỉ người có quyền cap_hang — mặc định chủ quán — + PIN chủ quán) và "Nhật ký hạng" (mọi dòng sổ
// thẻ của khách: mua / cấp / thu hồi, ai làm, lúc nào). Cấp chỉ hạng "chỉ cấp", chọn số tháng hoặc Không thời hạn; không thu tiền, không
// tạo đơn. Máy chủ kiểm quyền + PIN + hạng (membership.js) — màn chỉ gửi yêu cầu.
import { useState, useEffect } from 'react';
import { hangApi } from '../utils/api';
import { hienNgayGio } from '../utils/ngayVN';
import { baoXong, baoLoiTu } from './thongBaoKho.js';   // BAO-1a

const THOI_HAN = [['0', 'Không thời hạn'], ['1', '1 tháng'], ['3', '3 tháng'], ['6', '6 tháng'], ['12', '12 tháng']];
const VIEC = { ban: 'Mua', cap: 'Cấp', thu_hoi: 'Thu hồi' };

export default function CapHang({ sdt, coQuyen, onDoi }) {
  const [dsHang, setDsHang] = useState([]);
  const [nhatKy, setNhatKy] = useState(null);
  const [chon, setChon] = useState({ tier_id: '', han: '0', pin: '' });
  const [dangGui, setDangGui] = useState(false);

  const tai = async () => {
    try {
      setNhatKy((await hangApi.nhatKy(sdt)).data || []);
      if (coQuyen) {
        const ds = ((await hangApi.ds()).data?.tiers || []).filter((t) => t.cach_co === 'chi_cap');
        setDsHang(ds);
        setChon((c) => ({ ...c, tier_id: c.tier_id || (ds[0] ? String(ds[0].id) : '') }));
      }
    } catch (e) { baoLoiTu('tải hạng thẻ', e); }
  };
  useEffect(() => { if (sdt) tai(); }, [sdt, coQuyen]);

  const gui = async (viec) => {
    if (!chon.tier_id) return;
    setDangGui(true);
    try {
      if (viec === 'cap') await hangApi.cap(sdt, Number(chon.tier_id), chon.han === '0' ? null : Number(chon.han), chon.pin);
      else await hangApi.thuHoi(sdt, Number(chon.tier_id), chon.pin);
      setChon((c) => ({ ...c, pin: '' }));
      const hang = dsHang.find((t) => String(t.id) === String(chon.tier_id));
      baoXong(`${viec === 'cap' ? 'Đã cấp' : 'Đã thu hồi'} hạng ${hang?.name || ''} ${viec === 'cap' ? 'cho' : 'của'} khách ${sdt}`.replace('  ', ' '));
      await tai();
      onDoi?.();
    } catch (e) { baoLoiTu(viec === 'cap' ? 'cấp hạng' : 'thu hồi hạng', e); } finally { setDangGui(false); }
  };

  const dong = { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 };
  return (
    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0', fontSize: '0.85rem' }}>
      {coQuyen && (
        <>
          <div style={{ fontWeight: 600 }}>Cấp hạng (chỉ chủ quán)</div>
          {dsHang.length === 0 ? (
            <div style={{ color: '#94a3b8', marginTop: 4 }}>Chưa có hạng "chỉ cấp" — đặt ở Cài đặt → Hạng thành viên.</div>
          ) : (
            <div style={dong}>
              <select className="input" style={{ width: 'auto' }} value={chon.tier_id} aria-label="Hạng cấp"
                onChange={(e) => setChon((c) => ({ ...c, tier_id: e.target.value }))}>
                {dsHang.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <select className="input" style={{ width: 'auto' }} value={chon.han} aria-label="Thời hạn cấp"
                onChange={(e) => setChon((c) => ({ ...c, han: e.target.value }))}>
                {THOI_HAN.map(([v, ten]) => <option key={v} value={v}>{ten}</option>)}
              </select>
              <input className="input" type="password" inputMode="numeric" maxLength={6} style={{ width: 120 }} placeholder="PIN chủ quán"
                aria-label="PIN chủ quán" value={chon.pin} onChange={(e) => setChon((c) => ({ ...c, pin: e.target.value.replace(/\D/g, '') }))} />
              <button className="btn btn-primary" disabled={dangGui || !chon.pin} onClick={() => gui('cap')}>Cấp</button>
              <button className="btn btn-outline" disabled={dangGui || !chon.pin} onClick={() => gui('thu_hoi')}>Thu hồi hạng này</button>
            </div>
          )}
        </>
      )}
      <div style={{ fontWeight: 600, marginTop: 8 }}>Nhật ký hạng</div>
      {!nhatKy ? <div style={{ color: '#94a3b8' }}>Đang tải...</div> : nhatKy.length === 0 ? <div style={{ color: '#94a3b8' }}>Chưa có.</div> : (
        <div style={{ marginTop: 4, color: '#475569' }}>
          {nhatKy.map((d) => (
            <div key={d.id}>
              • {hienNgayGio(d.purchased_at)} — {VIEC[d.loai] || d.loai} {d.tier_name}
              {d.loai !== 'thu_hoi' && ` (${d.so_thang ? d.so_thang + ' tháng' : d.loai === 'cap' ? 'Không thời hạn' : 'thẻ cũ'})`}
              {Number(d.price_paid) > 0 && ` · ${Number(d.price_paid).toLocaleString('vi-VN')}đ`}
              {d.order_id && ` · đơn #${d.order_id}`}
              {d.created_by && ` · ${d.created_by}`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
