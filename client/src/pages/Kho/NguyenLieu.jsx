/**
 * KHO-1 — Nguyên liệu: tìm (gõ không dấu vẫn ra), sắp xếp, tab theo nhóm, ô "Thiếu thông tin"; thêm / sửa / ngừng dùng / xoá
 * (máy chủ chặn xoá nguyên liệu đang dùng); quản lý nhóm + nhà cung cấp. Nhân viên chỉ xem.
 */
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../utils/api';

const boDau = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const tien = (x) => (x == null ? '—' : Number(x).toLocaleString('vi-VN') + 'đ');
const THIEU = { gia: ['giá', (n) => n.gia_nhap === null], han: ['hạn dùng', (n) => n.han_ngay == null], toi_thieu: ['tồn tối thiểu', (n) => n.ton_toi_thieu == null] };
// MỘT vị từ cho cả số trên nút lẫn danh sách khi bấm (nguyên liệu ngừng dùng không tính). Nhân viên không nhận gia_nhap (undefined) → không đếm.
const thieu_ = (ma, n) => !!n.dang_dung && THIEU[ma][1](n);
const SAP_XEP = {
  ten: (a, b) => a.ten.localeCompare(b.ten, 'vi'),
  nhom: (a, b) => String(a.nhom_ten || '').localeCompare(String(b.nhom_ten || ''), 'vi') || a.ten.localeCompare(b.ten, 'vi'),
  gia: (a, b) => (b.gia_nhap ?? -1) - (a.gia_nhap ?? -1),
  moi: (a, b) => b.id - a.id,
};
const MAU = { ten: '', nhom_id: '', nha_cung_cap_id: '', don_vi_luu: 'kg', don_vi_hien: 'g', he_so_doi: 0.001, gia_nhap: '', ton_toi_thieu: '', han_ngay: '', ghi_chu: '', dang_dung: 1 };

export default function NguyenLieu({ vaiTro }) {
  const suaDuoc = vaiTro === 'owner' || vaiTro === 'manager';
  const [dl, setDl] = useState({ nguyen_lieu: [], nhom: [], nha_cung_cap: [] });
  const [loi, setLoi] = useState('');
  const [tim, setTim] = useState('');
  const [sapXep, setSapXep] = useState('ten');
  const [tab, setTab] = useState('tat_ca');
  const [thieu, setThieu] = useState(null);
  const [sua, setSua] = useState(null);
  const [danhMuc, setDanhMuc] = useState(false);

  const tai = () => api.get('/kho/nguyen-lieu').then(setDl).catch((e) => setLoi(e.message));
  useEffect(() => { tai(); }, []);

  const ds = useMemo(() => {
    const t = boDau(tim.trim());
    return dl.nguyen_lieu
      .filter((n) => tab === 'tat_ca' || n.nhom_id === tab)
      .filter((n) => !thieu || thieu_(thieu, n))
      .filter((n) => !t || boDau(n.ten).includes(t))
      .sort(SAP_XEP[sapXep]);
  }, [dl, tim, tab, thieu, sapXep]);

  const luu = async (e) => {
    e.preventDefault();
    setLoi('');
    try {
      if (sua.id) await api.put(`/kho/nguyen-lieu/${sua.id}`, sua); else await api.post('/kho/nguyen-lieu', sua);
      setSua(null);
      tai();
    } catch (err) { setLoi(err.message); }
  };
  const xoa = async () => {
    if (!window.confirm(`Xoá hẳn "${sua.ten}"?`)) return;
    try { await api.delete(`/kho/nguyen-lieu/${sua.id}`); setSua(null); tai(); } catch (err) { setLoi(err.message); }
  };
  const o = (ten, nhan, kieu = 'text') => (
    <label>{nhan}<input className="input" type={kieu} value={sua[ten] ?? ''} onChange={(e) => setSua({ ...sua, [ten]: e.target.value })} /></label>
  );
  const chon = (ten, nhan, ds2) => (
    <label>{nhan}
      <select className="input" value={sua[ten] ?? ''} onChange={(e) => setSua({ ...sua, [ten]: e.target.value })}>
        <option value="">—</option>
        {ds2.map((x) => <option key={x.id} value={x.id}>{x.ten}</option>)}
      </select>
    </label>
  );

  if (danhMuc) return <DanhMuc dl={dl} tai={tai} dong={() => setDanhMuc(false)} />;

  if (sua) {
    return (
      <form onSubmit={luu} className="card" style={{ padding: '1rem' }}>
        <h3 className="card-title">{sua.id ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu'}</h3>
        <div className="kho-form">
          {o('ten', 'Tên')}
          {chon('nhom_id', 'Nhóm', dl.nhom)}
          {chon('nha_cung_cap_id', 'Nhà cung cấp', dl.nha_cung_cap)}
          {o('gia_nhap', `Giá nhập (đ / ${sua.don_vi_luu || 'kg'})`, 'number')}
          {o('han_ngay', 'Hạn dùng (ngày)', 'number')}
          {o('ton_toi_thieu', `Tồn tối thiểu (${sua.don_vi_luu || 'kg'})`, 'number')}
          {o('don_vi_luu', 'Đơn vị lưu')}
          {o('don_vi_hien', 'Đơn vị hiện')}
          {o('he_so_doi', '1 đơn vị hiện = ? đơn vị lưu', 'number')}
          {o('ghi_chu', 'Ghi chú')}
        </div>
        {loi && <div className="kho-loi">{loi}</div>}
        <div className="kho-hang" style={{ marginTop: '1rem' }}>
          <button className="btn btn-primary" type="submit">Lưu</button>
          <button className="btn btn-outline" type="button" onClick={() => { setSua(null); setLoi(''); }}>Huỷ</button>
          {sua.id && (
            <button className="btn btn-outline" type="button" onClick={() => setSua({ ...sua, dang_dung: sua.dang_dung ? 0 : 1 })}>
              {sua.dang_dung ? 'Ngừng dùng' : 'Dùng lại'} (bấm Lưu)
            </button>
          )}
          {sua.id && <button className="btn btn-outline" type="button" onClick={xoa}>Xoá hẳn</button>}
        </div>
      </form>
    );
  }

  const demThieu = Object.fromEntries(Object.keys(THIEU).map((ma) => [ma, dl.nguyen_lieu.filter((n) => thieu_(ma, n)).length]));
  return (
    <div>
      {loi && <div className="kho-loi">{loi}</div>}
      {suaDuoc && Object.values(demThieu).some(Boolean) && (
        <div className="kho-canh">
          <span>⚠️ Thiếu thông tin:</span>
          {Object.entries(THIEU).map(([ma, [nhan]]) => demThieu[ma] > 0 && (
            <button key={ma} onClick={() => setThieu(thieu === ma ? null : ma)}>{demThieu[ma]} thiếu {nhan}{thieu === ma ? ' ✓' : ''}</button>
          ))}
        </div>
      )}
      <div className="kho-hang">
        <input className="input" placeholder="Tìm nguyên liệu (gõ không dấu được)" value={tim} onChange={(e) => setTim(e.target.value)} />
        <select className="input" style={{ flex: 0, minWidth: '8rem' }} value={sapXep} onChange={(e) => setSapXep(e.target.value)}>
          <option value="ten">Theo tên</option><option value="nhom">Theo nhóm</option><option value="gia">Theo giá</option><option value="moi">Mới thêm</option>
        </select>
        {suaDuoc && <button className="btn btn-primary" onClick={() => setSua({ ...MAU })}>+ Thêm</button>}
        {suaDuoc && <button className="btn btn-outline" onClick={() => setDanhMuc(true)}>Nhóm & nhà cung cấp</button>}
      </div>
      <div className="kho-tabs">
        {[{ id: 'tat_ca', ten: 'Tất cả' }, ...dl.nhom].map((n) => (
          <button key={n.id} className={`kho-tab ${tab === n.id ? 'on' : ''}`} onClick={() => setTab(n.id)}>{n.ten}</button>
        ))}
      </div>
      <div className="kho-luoi">
        {ds.map((n) => (
          <div key={n.id} className={`kho-the ${n.dang_dung ? '' : 'ngung'}`} onClick={() => suaDuoc && setSua({ ...n })}>
            <b>{n.ten}{!n.dang_dung && ' · ngừng dùng'}</b>
            <div className="kho-nho">{n.nhom_ten || 'Chưa có nhóm'} · đơn vị {n.don_vi_hien || n.don_vi_luu}</div>
            <div className="kho-nho">
              {n.gia_nhap !== undefined && <>Giá {n.gia_nhap === null ? <span className="kho-thieu">chưa có</span> : `${tien(n.gia_nhap)}/${n.don_vi_luu}`}{' · '}</>}
              Hạn {n.han_ngay == null ? <span className="kho-thieu">?</span> : `${n.han_ngay} ngày`}
              {' · '}Tối thiểu {n.ton_toi_thieu == null ? <span className="kho-thieu">?</span> : `${n.ton_toi_thieu} ${n.don_vi_luu}`}
            </div>
          </div>
        ))}
      </div>
      {!ds.length && <p className="text-gray">Không có nguyên liệu nào khớp.</p>}
    </div>
  );
}

/** Nhóm nguyên liệu + nhà cung cấp: sửa tên tại chỗ, thêm mới. */
function DanhMuc({ dl, tai, dong }) {
  const [loi, setLoi] = useState('');
  const [moi, setMoi] = useState({ nhom: '', 'nha-cung-cap': '' });
  const ghi = async (duong, id, than) => {
    setLoi('');
    try { if (id) await api.put(`/kho/${duong}/${id}`, than); else await api.post(`/kho/${duong}`, than); tai(); return true; } catch (e) { setLoi(e.message); return false; }
  };
  const khoi = (duong, tieuDe, ds) => (
    <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
      <h3 className="card-title">{tieuDe}</h3>
      {ds.map((x) => (
        <div key={x.id} className="kho-dong">
          <input className="input" defaultValue={x.ten} onBlur={(e) => e.target.value !== x.ten && ghi(duong, x.id, { ...x, ten: e.target.value })} />
          {duong === 'nha-cung-cap' && (
            <input className="input" placeholder="SĐT" defaultValue={x.sdt || ''} onBlur={(e) => e.target.value !== (x.sdt || '') && ghi(duong, x.id, { ...x, sdt: e.target.value })} />
          )}
        </div>
      ))}
      <div className="kho-dong">
        <input className="input" placeholder="Thêm mới…" value={moi[duong]} onChange={(e) => setMoi({ ...moi, [duong]: e.target.value })} />
        <button className="btn btn-outline" onClick={async () => { if (await ghi(duong, null, { ten: moi[duong] })) setMoi({ ...moi, [duong]: '' }); }}>Thêm</button>
      </div>
    </div>
  );
  return (
    <div>
      {loi && <div className="kho-loi">{loi}</div>}
      {khoi('nhom', 'Nhóm nguyên liệu', dl.nhom)}
      {khoi('nha-cung-cap', 'Nhà cung cấp', dl.nha_cung_cap)}
      <button className="btn btn-primary" onClick={dong}>Xong</button>
    </div>
  );
}
