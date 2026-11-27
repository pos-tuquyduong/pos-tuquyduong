/**
 * KHO-1 — Sản phẩm & công thức: danh sách theo nhóm; bấm món → công thức cho 1 đơn vị + "Tính cho N phần" (máy chủ triển khai,
 * cùng hàm tinh.trienKhai). Chỉ chủ quán sửa kiểu + công thức + hạn dùng (KHO-2a) (máy chủ kiểm). Lượng lưu theo đơn vị LƯU, hiện theo đơn vị hiện.
 * KHO-3a A5: MỘT chỗ sửa món — tên, nhóm, giá (route giá có sẵn), đơn vị, thứ tự, đang bán (quản lý / chủ quán — máy chủ kiểm manage_settings);
 * "Cho bán khi thiếu nguyên liệu" (chỉ chủ quán, món pha tại chỗ); nút "Thêm món" (món mới không cần SX).
 */
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../utils/api';
import { baoXong, baoLoiTu } from '../../components/thongBaoKho.js';   // BAO-1a
import ToppingMon, { DanhSachTopping } from './ToppingMon';   // TOPPING-1 (B3)

const KIEU = { pha_tai_cho: 'Pha tại chỗ', lam_san: 'Làm sẵn (theo lô)', chua_dinh_luong: 'Chưa định lượng' };
const so = (x) => Number(Number(x).toFixed(3)).toLocaleString('vi-VN');
const hien = (d) => `${so(d.luong_hien)} ${d.don_vi_hien || d.don_vi_luu || ''}`;   // luong_hien do máy chủ đổi (tinh.doiDonVi)
// Giá NULL = chưa có giá (món nhập từ SX); giá 0 thật (hàng tặng) là hợp lệ. MỘT vị từ cho cả số đếm lẫn lọc.
const chuaCoGia = (p) => !!p.is_active && p.price === null;

export default function SanPham({ vaiTro, moId }) {
  const chuQuan = vaiTro === 'owner';
  const quanLy = chuQuan || vaiTro === 'manager';
  const [themMoi, setThemMoi] = useState(false);
  const [dl, setDl] = useState({ san_pham: [], nhom: [] });
  const [nl, setNl] = useState([]);
  const [loi, setLoi] = useState('');
  const [tim, setTim] = useState('');
  const [chon, setChon] = useState(null);
  const [locGia, setLocGia] = useState(false);

  const tai = () => Promise.all([api.get('/kho/san-pham'), api.get('/kho/nguyen-lieu')])
    .then(([sp, n]) => { setDl(sp); setNl(n.nguyen_lieu); return sp; }).catch((e) => setLoi(e.message));
  useEffect(() => { tai().then((sp) => { const m = moId && sp?.san_pham.find((p) => p.id === moId); if (m) setChon(m); }); }, [moId]);

  const theoNhom = useMemo(() => {
    const t = tim.trim().toLowerCase();
    const nhom = [...dl.nhom, { id: null, ten: 'Chưa xếp nhóm' }];
    return nhom.map((n) => ({ ...n, mon: dl.san_pham.filter((p) => (p.nhom_id ?? null) === n.id && (!t || p.name.toLowerCase().includes(t))
      && (!locGia || chuaCoGia(p))) })).filter((n) => n.mon.length);
  }, [dl, tim, locGia]);

  const soChuaGia = dl.san_pham.filter(chuaCoGia).length;
  if (chon) {
    return <ChiTiet sp={chon} dl={dl} nl={nl} chuQuan={chuQuan} quanLy={quanLy} dong={(doi) => { setChon(null); if (doi) tai(); }} />;
  }
  if (themMoi) return <ThongTinMon sp={null} dong={(doi) => { setThemMoi(false); if (doi) tai(); }} />;
  return (
    <div>
      {loi && <div className="kho-loi">{loi}</div>}
      {soChuaGia > 0 && (
        <div className="kho-canh">
          <span>⚠️ Thiếu thông tin:</span>
          <button onClick={() => { setLocGia(!locGia); setTim(''); }}>{soChuaGia} món chưa có giá{locGia ? ' ✓' : ''}</button>
          <span className="kho-nho">bấm món để đặt giá</span>
        </div>
      )}
      <div className="kho-hang"><input className="input" placeholder="Tìm món" value={tim} onChange={(e) => setTim(e.target.value)} />
        {quanLy && <button className="btn btn-primary" onClick={() => setThemMoi(true)}>+ Thêm món</button>}</div>
      {quanLy && <DanhSachTopping />}
      {theoNhom.map((n) => (
        <div key={n.id ?? 'chua'} style={{ marginBottom: '1rem' }}>
          <h3 className="card-title">{n.ten}</h3>
          <div className="kho-luoi">
            {n.mon.map((p) => (
              <div key={p.id} className={`kho-the ${p.is_active ? '' : 'ngung'}`} onClick={() => setChon(p)}>
                <b>{p.name}{!p.is_active && ' · ẩn'}</b>{chuaCoGia(p) && <span className="kho-thieu"> · chưa có giá</span>}
                <div className="kho-nho">{KIEU[p.kieu]} · {p.cong_thuc.length ? `${p.cong_thuc.length} thành phần` : <span className="kho-thieu">chưa có công thức</span>}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── KHO-3a A4 / A5: thông tin bán của món (tạo mới khi sp = null) ──
function ThongTinMon({ sp, dong }) {
  const [f, setF] = useState({ name: sp?.name ?? '', category: sp?.category ?? 'juice', price: sp?.price ?? '', unit: sp?.unit ?? 'ly',
    sort_order: sp?.sort_order ?? 0, is_active: sp ? Number(sp.is_active) : 1 });
  const [dang, setDang] = useState(false);
  const [dsNhom, setDsNhom] = useState([]);   // NHOM-MON-1: nhóm chọn từ danh sách chung (Cài đặt › Nhóm món), không gõ tay
  useEffect(() => { api.get('/products/nhom').then((r) => setDsNhom(r.data || [])).catch((e) => baoLoiTu('tải nhóm món', e)); }, []);
  const doi = (gt) => setF({ ...f, ...gt });
  const luu = async () => {
    if (dang) return;
    setDang(true);
    try {
      const than = { name: f.name, category: f.category, unit: f.unit, sort_order: Number(f.sort_order) || 0, is_active: Number(f.is_active) };
      if (!sp) {
        await api.post('/products', { ...than, price: f.price === '' ? 0 : Number(f.price) });
      } else {
        await api.put(`/products/${sp.id}`, than);
        if (f.price !== '' && Number(f.price) !== sp.price) {
          await api.put('/products/price', { sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id, price: Number(f.price) });
        }
      }
      baoXong(sp ? `Đã lưu ${f.name}` : `Đã thêm món ${f.name} — nhớ đặt kiểu và công thức`);
      dong(true);
    } catch (e) { baoLoiTu(sp ? 'lưu món' : 'thêm món', e); } finally { setDang(false); }
  };
  return (
    <div className="card" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
      <h3 className="card-title">{sp ? 'Thông tin bán' : 'Thêm món'}</h3>
      <div className="kho-form">
        <label>Tên món<input className="input" value={f.name} onChange={(e) => doi({ name: e.target.value })} /></label>
        <label>Nhóm (tab ở màn Bán hàng)<select className="input" value={f.category} onChange={(e) => doi({ category: e.target.value })}>
          {(dsNhom.some((g) => g.ma === f.category) ? dsNhom : [...dsNhom, { ma: f.category, ten: f.category }]).map((g) => <option key={g.ma} value={g.ma}>{g.ten}</option>)}
        </select></label>
        <label>Giá bán (đồng)<input className="input" type="number" min="0" step="1000" value={f.price ?? ''} onChange={(e) => doi({ price: e.target.value })} /></label>
        <label>Đơn vị<input className="input" value={f.unit} onChange={(e) => doi({ unit: e.target.value })} /></label>
        <label>Thứ tự<input className="input" type="number" step="1" value={f.sort_order} onChange={(e) => doi({ sort_order: e.target.value })} /></label>
        <label className="kho-hang"><input type="checkbox" checked={!!f.is_active} onChange={(e) => doi({ is_active: e.target.checked ? 1 : 0 })} /> Đang bán (bỏ chọn = ẩn khỏi quầy và App)</label>
      </div>
      <div className="kho-hang" style={{ marginTop: '0.75rem' }}>
        <button className="btn btn-primary" disabled={dang} onClick={luu}>{dang ? 'Đang lưu…' : sp ? 'Lưu thông tin' : 'Thêm món'}</button>
        {!sp && <button className="btn btn-outline" onClick={() => dong(false)}>Huỷ</button>}
      </div>
    </div>
  );
}

function ChiTiet({ sp, dl, nl, chuQuan, quanLy, dong }) {
  const nlTheo = useMemo(() => new Map(nl.map((n) => [n.id, n])), [nl]);
  const [soPhan, setSoPhan] = useState(1);
  const [ket, setKet] = useState(null);
  const [loi, setLoi] = useState('');
  const [dang, setDang] = useState(false);   // BAO-1a D: đang lưu công thức → khóa nút
  const [sua, setSua] = useState(null);   // { kieu, nhom_id, dong: [{ loai: 'nl' | 'sp', id, so (đơn vị hiện / phần) }] }

  const tinh = async () => {
    setLoi('');
    try { setKet((await api.get(`/kho/san-pham/${sp.id}/trien-khai?so_phan=${soPhan}`)).nguyen_lieu); } catch (e) { setLoi(e.message); }
  };
  const batSua = () => setSua({ kieu: sp.kieu, nhom_id: sp.nhom_id ?? '', han_ngay: sp.han_ngay ?? '', cho_ban_thieu: Number(sp.cho_ban_thieu) === 1,
    dong: sp.cong_thuc.map((d) => (d.nguyen_lieu_id
    ? { loai: 'nl', id: d.nguyen_lieu_id, so: d.luong_hien }
    : { loai: 'sp', id: d.thanh_phan_id, so: d.luong })) });
  const doiDong = (i, gt) => setSua({ ...sua, dong: sua.dong.map((d, j) => (j === i ? { ...d, ...gt } : d)) });
  const luu = async () => {
    setLoi('');
    const congThuc = sua.dong.filter((d) => d.id).map((d) => (d.loai === 'nl'
      ? { nguyen_lieu_id: Number(d.id), luong: Number(d.so) * (nlTheo.get(Number(d.id))?.he_so_doi || 1) }
      : { thanh_phan_id: Number(d.id), luong: Number(d.so) }));
    if (dang) return;
    setDang(true);
    try {
      await api.put(`/kho/san-pham/${sp.id}`, { kieu: sua.kieu, nhom_id: sua.nhom_id ? Number(sua.nhom_id) : null, han_ngay: sua.han_ngay === '' ? null : Number(sua.han_ngay),
        cong_thuc: congThuc, cho_ban_thieu: sua.kieu === 'pha_tai_cho' && sua.cho_ban_thieu ? 1 : 0 });
      baoXong(`Đã lưu công thức ${sp.name}`);
      dong(true);
    } catch (e) { baoLoiTu('lưu công thức', e); } finally { setDang(false); }
  };

  return (
    <div>
    {quanLy && <ThongTinMon sp={sp} dong={(doi) => { if (doi) dong(true); }} />}
    {quanLy && <ToppingMon sp={sp} />}
    <div className="card" style={{ padding: '1rem' }}>
      <h3 className="card-title">{sp.name}</h3>
      <div className="kho-nho" style={{ marginBottom: '0.75rem' }}>{KIEU[sp.kieu]} · công thức cho 1 {sp.category === 'tea' ? 'gói' : 'phần'}
        {sp.kieu === 'lam_san' && ` · hạn dùng ${sp.han_ngay ? sp.han_ngay + ' ngày' : 'chưa đặt'}`}
        {sp.kieu === 'pha_tai_cho' && Number(sp.cho_ban_thieu) === 1 && <span className="kho-thieu"> · cho bán khi thiếu nguyên liệu (ghi âm)</span>}</div>
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
            <label>Hạn dùng thành phẩm (ngày)
              <input className="input" type="number" min="1" step="1" value={sua.han_ngay} onChange={(e) => setSua({ ...sua, han_ngay: e.target.value })} />
            </label>
            {sua.kieu === 'pha_tai_cho' && (
              <label className="kho-hang"><input type="checkbox" checked={sua.cho_ban_thieu} onChange={(e) => setSua({ ...sua, cho_ban_thieu: e.target.checked })} />
                Cho bán khi thiếu nguyên liệu (vẫn bán, ghi âm, báo đỏ ở Tồn kho)</label>
            )}
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
        {sua && <button className="btn btn-primary" disabled={dang} onClick={luu}>{dang ? 'Đang lưu…' : 'Lưu công thức'}</button>}
        {!sua && chuQuan && <button className="btn btn-primary" onClick={batSua}>Sửa công thức</button>}
        <button className="btn btn-outline" onClick={() => (sua ? setSua(null) : dong(false))}>{sua ? 'Huỷ' : 'Quay lại'}</button>
      </div>
    </div>
    </div>
  );
}
