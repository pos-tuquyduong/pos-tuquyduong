/**
 * KHO-1 — Sản phẩm & công thức: danh sách theo nhóm; bấm món → công thức cho 1 đơn vị + "Tính cho N phần" (máy chủ triển khai,
 * cùng hàm tinh.trienKhai). Chỉ chủ quán sửa kiểu + công thức (máy chủ kiểm). Lượng lưu theo đơn vị LƯU, hiện theo đơn vị hiện.
 */
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../utils/api';

const KIEU = { pha_tai_cho: 'Pha tại chỗ', lam_san: 'Làm sẵn (theo lô)', chua_dinh_luong: 'Chưa định lượng' };
const so = (x) => Number(Number(x).toFixed(3)).toLocaleString('vi-VN');
const hien = (d) => `${so(d.luong_hien)} ${d.don_vi_hien || d.don_vi_luu || ''}`;   // luong_hien do máy chủ đổi (tinh.doiDonVi)

export default function SanPham({ vaiTro }) {
  const chuQuan = vaiTro === 'owner';
  const [dl, setDl] = useState({ san_pham: [], nhom: [] });
  const [nl, setNl] = useState([]);
  const [loi, setLoi] = useState('');
  const [tim, setTim] = useState('');
  const [chon, setChon] = useState(null);

  const tai = () => Promise.all([api.get('/kho/san-pham'), api.get('/kho/nguyen-lieu')])
    .then(([sp, n]) => { setDl(sp); setNl(n.nguyen_lieu); }).catch((e) => setLoi(e.message));
  useEffect(() => { tai(); }, []);

  const theoNhom = useMemo(() => {
    const t = tim.trim().toLowerCase();
    const nhom = [...dl.nhom, { id: null, ten: 'Chưa xếp nhóm' }];
    return nhom.map((n) => ({ ...n, mon: dl.san_pham.filter((p) => (p.nhom_id ?? null) === n.id && (!t || p.name.toLowerCase().includes(t))) }))
      .filter((n) => n.mon.length);
  }, [dl, tim]);

  if (chon) {
    return <ChiTiet sp={chon} dl={dl} nl={nl} chuQuan={chuQuan} dong={(doi) => { setChon(null); if (doi) tai(); }} />;
  }
  return (
    <div>
      {loi && <div className="kho-loi">{loi}</div>}
      <div className="kho-hang"><input className="input" placeholder="Tìm món" value={tim} onChange={(e) => setTim(e.target.value)} /></div>
      {theoNhom.map((n) => (
        <div key={n.id ?? 'chua'} style={{ marginBottom: '1rem' }}>
          <h3 className="card-title">{n.ten}</h3>
          <div className="kho-luoi">
            {n.mon.map((p) => (
              <div key={p.id} className={`kho-the ${p.is_active ? '' : 'ngung'}`} onClick={() => setChon(p)}>
                <b>{p.name}{!p.is_active && ' · ẩn'}</b>
                <div className="kho-nho">{KIEU[p.kieu]} · {p.cong_thuc.length ? `${p.cong_thuc.length} thành phần` : <span className="kho-thieu">chưa có công thức</span>}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChiTiet({ sp, dl, nl, chuQuan, dong }) {
  const nlTheo = useMemo(() => new Map(nl.map((n) => [n.id, n])), [nl]);
  const [soPhan, setSoPhan] = useState(1);
  const [ket, setKet] = useState(null);
  const [loi, setLoi] = useState('');
  const [sua, setSua] = useState(null);   // { kieu, nhom_id, dong: [{ loai: 'nl' | 'sp', id, so (đơn vị hiện / phần) }] }

  const tinh = async () => {
    setLoi('');
    try { setKet((await api.get(`/kho/san-pham/${sp.id}/trien-khai?so_phan=${soPhan}`)).nguyen_lieu); } catch (e) { setLoi(e.message); }
  };
  const batSua = () => setSua({ kieu: sp.kieu, nhom_id: sp.nhom_id ?? '', dong: sp.cong_thuc.map((d) => (d.nguyen_lieu_id
    ? { loai: 'nl', id: d.nguyen_lieu_id, so: d.luong_hien }
    : { loai: 'sp', id: d.thanh_phan_id, so: d.luong })) });
  // Món SX nhập vào được tạo ẨN giá 0: đặt giá ở màn giá như mọi khi, rồi bật bán ở đây (máy chủ đòi giá > 0).
  const doiBan = async () => {
    setLoi('');
    try { await api.put(`/kho/san-pham/${sp.id}/ban`, { ban: sp.is_active ? 0 : 1 }); dong(true); } catch (e) { setLoi(e.message); }
  };
  const doiDong = (i, gt) => setSua({ ...sua, dong: sua.dong.map((d, j) => (j === i ? { ...d, ...gt } : d)) });
  const luu = async () => {
    setLoi('');
    const congThuc = sua.dong.filter((d) => d.id).map((d) => (d.loai === 'nl'
      ? { nguyen_lieu_id: Number(d.id), luong: Number(d.so) * (nlTheo.get(Number(d.id))?.he_so_doi || 1) }
      : { thanh_phan_id: Number(d.id), luong: Number(d.so) }));
    try {
      await api.put(`/kho/san-pham/${sp.id}`, { kieu: sua.kieu, nhom_id: sua.nhom_id ? Number(sua.nhom_id) : null, cong_thuc: congThuc });
      dong(true);
    } catch (e) { setLoi(e.message); }
  };

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <h3 className="card-title">{sp.name}</h3>
      <div className="kho-nho" style={{ marginBottom: '0.75rem' }}>{KIEU[sp.kieu]} · công thức cho 1 {sp.category === 'tea' ? 'gói' : 'phần'}</div>
      {!sua && (
        <>
          {sp.cong_thuc.map((d) => (
            <div key={d.id} className="kho-dong">
              <span style={{ flex: 1 }}>{d.nguyen_lieu_ten || d.thanh_phan_ten}</span>
              <b>{d.nguyen_lieu_id ? hien(d) : `${so(d.luong)} phần`}</b>
            </div>
          ))}
          {!sp.cong_thuc.length && <p className="text-gray">Chưa có công thức.</p>}
          <div className="kho-hang" style={{ marginTop: '0.75rem' }}>
            <span>Tính cho</span>
            <input className="input" type="number" min="1" style={{ flex: 0, minWidth: '5rem' }} value={soPhan} onChange={(e) => setSoPhan(e.target.value)} />
            <span>phần</span>
            <button className="btn btn-outline" onClick={tinh}>Tính</button>
          </div>
          {ket && ket.map((r) => (
            <div key={r.nguyen_lieu_id} className="kho-dong"><span style={{ flex: 1 }}>{r.ten}</span><b>{hien(r)}</b></div>
          ))}
        </>
      )}
      {sua && (
        <>
          <div className="kho-form" style={{ marginBottom: '0.75rem' }}>
            <label>Kiểu
              <select className="input" value={sua.kieu} onChange={(e) => setSua({ ...sua, kieu: e.target.value })}>
                {Object.entries(KIEU).map(([ma, ten]) => <option key={ma} value={ma}>{ten}</option>)}
              </select>
            </label>
            <label>Nhóm
              <select className="input" value={sua.nhom_id} onChange={(e) => setSua({ ...sua, nhom_id: e.target.value })}>
                <option value="">—</option>
                {dl.nhom.map((n) => <option key={n.id} value={n.id}>{n.ten}</option>)}
              </select>
            </label>
          </div>
          {sua.dong.map((d, i) => (
            <div key={i} className="kho-dong">
              <select className="input" value={`${d.loai}:${d.id || ''}`} onChange={(e) => { const [loai, id] = e.target.value.split(':'); doiDong(i, { loai, id: Number(id) || '' }); }}>
                <option value="nl:">— chọn —</option>
                <optgroup label="Nguyên liệu">{nl.filter((n) => n.dang_dung || n.id === d.id).map((n) => <option key={n.id} value={`nl:${n.id}`}>{n.ten}</option>)}</optgroup>
                <optgroup label="Sản phẩm khác">{dl.san_pham.filter((p) => p.id !== sp.id).map((p) => <option key={p.id} value={`sp:${p.id}`}>{p.name}</option>)}</optgroup>
              </select>
              <input className="input" type="number" step="any" value={d.so} onChange={(e) => doiDong(i, { so: e.target.value })} />
              <span className="kho-nho">{d.loai === 'nl' ? (nlTheo.get(Number(d.id))?.don_vi_hien || nlTheo.get(Number(d.id))?.don_vi_luu || '') : 'phần'}</span>
              <button className="btn btn-sm btn-outline" onClick={() => setSua({ ...sua, dong: sua.dong.filter((_, j) => j !== i) })}>✕</button>
            </div>
          ))}
          <button className="btn btn-sm btn-outline" onClick={() => setSua({ ...sua, dong: [...sua.dong, { loai: 'nl', id: '', so: '' }] })}>+ Thêm dòng</button>
        </>
      )}
      {loi && <div className="kho-loi">{loi}</div>}
      <div className="kho-hang" style={{ marginTop: '1rem' }}>
        {sua && <button className="btn btn-primary" onClick={luu}>Lưu công thức</button>}
        {!sua && chuQuan && <button className="btn btn-primary" onClick={batSua}>Sửa công thức</button>}
        {!sua && chuQuan && <button className="btn btn-outline" onClick={doiBan}>{sp.is_active ? 'Ẩn khỏi quầy' : 'Bật bán ở quầy'}</button>}
        <button className="btn btn-outline" onClick={() => (sua ? setSua(null) : dong(false))}>{sua ? 'Huỷ' : 'Quay lại'}</button>
      </div>
    </div>
  );
}
