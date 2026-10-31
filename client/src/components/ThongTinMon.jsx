/**
 * KH-SP-1 — thông tin ngắn của món. Hai phần dùng chung:
 *  - NutThongTin: dấu ⓘ + thẻ xem ở màn Bán hàng (cũ VÀ mới). Món không có thông tin thì không vẽ gì; chạm ⓘ không thêm món vào giỏ.
 *  - FormThongTinMon: ô nhập ở Cài đặt → Sản phẩm (nút bấm nhu cầu / thể chất, 3 ô chữ có đếm ký tự còn lại, lưu một lần).
 * Mã + giới hạn: utils/thongTinMon.js (giống máy chủ). Tiền / luồng bán không đi qua đây.
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { productsApi } from '../utils/api';
import { NHU_CAU, THE_CHAT, GIOI_HAN, tenNhuCau, tenTheChat, demKyTu, coThongTin } from '../utils/thongTinMon';

const dung = (e) => e.stopPropagation();
const CHU = [['mo_ta', 'Mô tả'], ['cong_dung', 'Công dụng'], ['thanh_phan', 'Thành phần']];

export function NutThongTin({ mon, kieu }) {
  const [mo, setMo] = useState(false);
  if (!coThongTin(mon)) return null;
  const dong = (e) => { e.stopPropagation(); setMo(false); };
  return (
    <>
      <span
        role="button" tabIndex={0} aria-label={`Thông tin ${mon.name}`} title="Thông tin món"
        onClick={(e) => { e.stopPropagation(); setMo(true); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setMo(true); } }}
        style={{ position: 'absolute', width: 22, height: 22, lineHeight: '22px', textAlign: 'center', borderRadius: '50%', background: '#e0f2fe',
          color: '#0369a1', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', ...kieu }}
      >ⓘ</span>
      {mo && createPortal(
        <div onClick={dong} style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={dung} style={{ background: '#fff', borderRadius: 12, padding: '1rem', maxWidth: 360, width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.25)' }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{mon.name}</div>
            <DongThongTin ten="Nhu cầu" noiDung={(mon.nhu_cau || []).map(tenNhuCau).join(' · ')} />
            <DongThongTin ten="Thể chất hợp" noiDung={(mon.the_chat || []).map(tenTheChat).join(' · ')} />
            {CHU.map(([cot, ten]) => <DongThongTin key={cot} ten={ten} noiDung={mon[cot]} />)}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

const DongThongTin = ({ ten, noiDung }) => (noiDung ? (
  <div style={{ marginBottom: 6, fontSize: '0.9rem' }}><b style={{ color: '#475569' }}>{ten}: </b>{noiDung}</div>
) : null);

const nutChon = (bat) => ({
  fontSize: '0.8rem', padding: '3px 10px', borderRadius: 12, marginRight: 6, marginBottom: 6, cursor: 'pointer',
  background: bat ? '#dcfce7' : 'transparent', color: bat ? '#166534' : '#6b7280', border: bat ? '1px solid #86efac' : '1px dashed #d1d5db',
});

/** mon: một dòng của productsApi.list (có sx_product_type / sx_product_id). onXong(thongTinMoi) sau khi lưu thành công. */
export function FormThongTinMon({ mon, onXong }) {
  const [nhuCau, setNhuCau] = useState(mon.nhu_cau || []);
  const [theChat, setTheChat] = useState(mon.the_chat || []);
  const [chu, setChu] = useState({ mo_ta: mon.mo_ta || '', cong_dung: mon.cong_dung || '', thanh_phan: mon.thanh_phan || '' });
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState('');
  const [daLuu, setDaLuu] = useState(false);

  const bat = (ds, set, ma) => { set(ds.includes(ma) ? ds.filter((x) => x !== ma) : [...ds, ma]); setDaLuu(false); };
  const luu = async () => {
    setDangLuu(true); setLoi(''); setDaLuu(false);
    try {
      const kq = await productsApi.updateThongTin({ sx_product_type: mon.sx_product_type, sx_product_id: mon.sx_product_id, name: mon.name, code: mon.code, nhu_cau: nhuCau, the_chat: theChat, ...chu });
      setDaLuu(true);
      onXong?.({ nhu_cau: kq.nhu_cau, the_chat: kq.the_chat, mo_ta: kq.mo_ta, cong_dung: kq.cong_dung, thanh_phan: kq.thanh_phan });
    } catch (e) {
      setLoi(e.message || 'Không lưu được');
    } finally {
      setDangLuu(false);
    }
  };
  const nhomNut = (tieuDe, ds, chon, set) => (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 4 }}>{tieuDe}</div>
      {ds.map((x) => <button key={x.ma} type="button" style={nutChon(chon.includes(x.ma))} onClick={() => bat(chon, set, x.ma)}>{x.ten}</button>)}
    </div>
  );
  return (
    <div style={{ padding: '0.5rem 0.25rem' }}>
      {nhomNut('Nhu cầu', NHU_CAU, nhuCau, setNhuCau)}
      {nhomNut('Thể chất hợp', THE_CHAT, theChat, setTheChat)}
      {CHU.map(([cot, ten]) => (
        <label key={cot} style={{ display: 'block', marginBottom: 6 }}>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{ten} — còn {GIOI_HAN[cot] - demKyTu(chu[cot].trim())} ký tự</span>
          <textarea className="input" rows={2} style={{ width: '100%' }} value={chu[cot]}
            onChange={(e) => { setChu({ ...chu, [cot]: e.target.value }); setDaLuu(false); }} />
        </label>
      ))}
      <button type="button" className="btn btn-primary" onClick={luu}
        disabled={dangLuu || CHU.some(([cot]) => demKyTu(chu[cot].trim()) > GIOI_HAN[cot])}>
        {dangLuu ? 'Đang lưu...' : 'Lưu thông tin món'}
      </button>
      {daLuu && <span style={{ marginLeft: 10, color: '#16a34a', fontSize: '0.85rem' }}>Đã lưu</span>}
      {loi && <span style={{ marginLeft: 10, color: '#dc2626', fontSize: '0.85rem' }}>{loi}</span>}
    </div>
  );
}
