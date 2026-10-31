/**
 * KHO-2b — bộ chọn dùng chung cho Đặt hàng, Nhận hàng (mua lẻ, thêm dòng ngoài đơn), Phát sinh: khung "Đã chọn" ở TRÊN (children = dòng đang chọn),
 * dưới là ô chạm theo tab ("Sắp hết & hay mua" · từng nhóm) hoặc gõ tên lọc (không dấu). Không bao giờ hiện một danh sách dài liền.
 * ds: [{ id, ten, nhom_id, ton_hien, don_vi, duoi_toi_thieu }] — cờ do máy chủ tính. tabDau: tab đầu thay cho "Sắp hết & hay mua" (Phát sinh).
 */
import { useState } from 'react';
import { boDau, so } from './chung';

export default function ChonNguyenLieu({ ds, nhom = [], hayMua = [], daChon, chon, tabDau, children }) {
  const [tab, setTab] = useState('dau');
  const [tim, setTim] = useState('');
  const t = boDau(tim.trim());
  const dau = tabDau || { ten: 'Sắp hết & hay mua', loc: (n) => n.duoi_toi_thieu || hayMua.includes(n.id) };
  const tabs = [{ id: 'dau', ten: dau.ten }, ...nhom, ...(nhom.length && ds.some((n) => n.nhom_id == null) ? [{ id: 'khac', ten: 'Chưa xếp nhóm' }] : [])];
  const hien = t ? ds.filter((n) => boDau(n.ten).includes(t))
    : ds.filter(tab === 'dau' ? dau.loc : tab === 'khac' ? (n) => n.nhom_id == null : (n) => n.nhom_id === tab);

  return (
    <div>
      <div className="kho-da-chon">
        <b>Đã chọn ({daChon.length})</b>
        {daChon.length ? children : <div className="kho-nho">Chạm ô bên dưới để thêm</div>}
      </div>
      <input className="input" placeholder="Gõ tên để lọc (không dấu được)" value={tim} onChange={(e) => setTim(e.target.value)} style={{ width: '100%', marginBottom: '0.5rem' }} />
      {!t && (
        <div className="kho-tabs">
          {tabs.map((n) => <button key={n.id} className={`kho-tab ${tab === n.id ? 'on' : ''}`} onClick={() => setTab(n.id)}>{n.ten}</button>)}
        </div>
      )}
      {!hien.length && <p className="kho-nho">Không có món nào ở đây — đổi tab hoặc gõ tên.</p>}
      <div className="kho-o-cham">
        {hien.map((n) => (
          <button key={n.id} className={`kho-o-chon ${daChon.includes(n.id) ? 'kho-chon' : ''} ${n.duoi_toi_thieu ? 'kho-vang' : ''}`} onClick={() => chon(n)}>
            <b>{daChon.includes(n.id) ? '✓ ' : ''}{n.ten}</b>
            {n.ton_hien != null && <span className="kho-nho">còn {so(n.ton_hien)} {n.don_vi}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
