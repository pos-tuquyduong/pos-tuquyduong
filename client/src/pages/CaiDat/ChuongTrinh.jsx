// CT-1a — thẻ Cài đặt "Chương trình": chương trình đặc biệt (học sinh giỏi, sinh nhật, khác) + khoảng tuổi cho ngày sinh khách.
// BAO-1b: báo qua thông báo chung; lỗi ô hiện dưới ô; form đang sửa có thanh "Có thay đổi chưa lưu".
// CHỈ lưu cấu hình và hiển thị — áp ưu đãi vào đơn tại quầy là việc CT-1b. Máy chủ kiểm mọi giá trị (sai → 400, hiện nguyên lời báo).
import { useEffect, useState } from 'react';
import { Plus, Save, Pencil, Trash2, Power } from 'lucide-react';
import { chuongTrinhApi } from '../../utils/api';
import { baoXong, baoLoi, baoLoiTu, lyDoLoi } from '../../components/thongBaoKho.js';
import LoiO from '../../components/LoiO';
import ThanhLuu from '../../components/ThanhLuu';
import useThayDoi from '../../components/useThayDoi';

const LOAI = { sinh_nhat: 'Sinh nhật', hoc_sinh_gioi: 'Học sinh giỏi', khac: 'Khác' };
const KY = { moi_khach: 'mỗi khách', ngay: 'mỗi ngày', nam_hoc: 'mỗi năm học', nam: 'mỗi năm' };
const TRONG = { ten: '', mo_ta: '', loai: 'khac', mien_so_mon: 0, mien_gia_toi_da: '', giam_ca_don_pt: 0, giam_con_lai_pt: 0, chi_tai_quan: true,
  can_xem_giay_to: false, gioi_han_ky: 'nam', gioi_han_so: 1, bat_dau: '', ket_thuc: '', dang_bat: false };
const CHU_XOA_MS = 4000;   // bấm Xoá lần một → nút đổi chữ; không bấm lần hai trong ngần này thì về như cũ

const tomTat = (c) => {
  const u = [];
  if (c.mien_so_mon > 0) u.push(`miễn ${c.mien_so_mon} món${c.mien_gia_toi_da ? ` (tối đa ${c.mien_gia_toi_da.toLocaleString('vi-VN')}đ/món)` : ''}`);
  if (c.giam_ca_don_pt > 0) u.push(`giảm ${c.giam_ca_don_pt}% cả đơn`);
  if (c.giam_con_lai_pt > 0) u.push(`giảm ${c.giam_con_lai_pt}% phần còn lại`);
  const dk = [c.chi_tai_quan ? 'chỉ tại quán' : 'cả khi mua App', c.can_xem_giay_to ? 'phải xem giấy tờ' : null, `${c.gioi_han_so} lần ${KY[c.gioi_han_ky]}`].filter(Boolean);
  const han = c.bat_dau || c.ket_thuc ? ` · chạy ${c.bat_dau || '…'} → ${c.ket_thuc || '…'}` : '';
  return `${u.join(' + ')} · ${dk.join(', ')}${han}`;
};

export default function CaiDatChuongTrinh() {
  const [ds, setDs] = useState([]);
  const [tuoi, setTuoi] = useState({ toi_thieu: 5, toi_da: 100 });
  const [taiLoi, setTaiLoi] = useState(false);
  const [form, setForm] = useState(null);   // null = đóng; { id?, ...trường } = đang thêm / sửa
  const [dangLuu, setDangLuu] = useState(false);
  const [loiO, setLoiO] = useState({});   // ô → câu lỗi dưới ô (ten / uu_dai / tuoi / tai)
  const [coDoi, chup] = useThayDoi(form);
  const [choXoa, setChoXoa] = useState(null);   // id chương trình đang chờ bấm Xoá lần hai

  const tai = async () => {
    try {
      const r = await chuongTrinhApi.danhSach();
      setDs(r.data || []);
      setTuoi(r.khoang_tuoi || { toi_thieu: 5, toi_da: 100 });
      setTaiLoi(false);
    } catch (e) { setTaiLoi(true); setLoiO((l) => ({ ...l, tai: lyDoLoi(e) })); baoLoiTu('tải danh sách chương trình', e); }
  };
  useEffect(() => { tai(); }, []);
  useEffect(() => {
    if (choXoa === null) return undefined;
    const h = setTimeout(() => setChoXoa(null), CHU_XOA_MS);
    return () => clearTimeout(h);
  }, [choXoa]);

  const sua = (truong, v) => setForm((cu) => ({ ...cu, [truong]: v }));
  const moForm = (f) => { setForm(f); chup(f); setLoiO((l) => ({ ...l, ten: '', form: '' })); };
  const mo = (c) => moForm(c ? { ...TRONG, ...c, mien_gia_toi_da: c.mien_gia_toi_da ?? '', bat_dau: c.bat_dau || '', ket_thuc: c.ket_thuc || '' } : { ...TRONG });

  const luu = async () => {
    const so = (v) => (v === '' || v === null ? null : Number(v));
    if (!String(form.ten || '').trim()) { setLoiO((l) => ({ ...l, ten: 'Nhập tên chương trình' })); baoLoi('Chưa lưu chương trình được', 'Nhập tên chương trình rồi bấm Lưu lại.'); return; }
    setDangLuu(true); setLoiO((l) => ({ ...l, ten: '', form: '' }));
    const du = { ten: form.ten, mo_ta: form.mo_ta, loai: form.loai, mien_so_mon: so(form.mien_so_mon), mien_gia_toi_da: so(form.mien_gia_toi_da),
      giam_ca_don_pt: so(form.giam_ca_don_pt), giam_con_lai_pt: so(form.giam_con_lai_pt), chi_tai_quan: !!form.chi_tai_quan, can_xem_giay_to: !!form.can_xem_giay_to,
      gioi_han_ky: form.gioi_han_ky, gioi_han_so: so(form.gioi_han_so), bat_dau: form.bat_dau || null, ket_thuc: form.ket_thuc || null, dang_bat: !!form.dang_bat };
    try {
      if (form.id) await chuongTrinhApi.sua(form.id, du); else await chuongTrinhApi.them(du);
      baoXong(`Đã lưu chương trình ${form.ten}`);
      moForm(null); await tai();
    } catch (e) { setLoiO((l) => ({ ...l, form: lyDoLoi(e) })); baoLoiTu('lưu chương trình', e); }
    setDangLuu(false);
  };
  const batTat = async (c) => {
    setDangLuu(true);
    try { await chuongTrinhApi.sua(c.id, { dang_bat: !c.dang_bat }); baoXong(`Đã ${c.dang_bat ? 'tắt' : 'bật'} chương trình ${c.ten}`); await tai(); } catch (e) { baoLoiTu(`${c.dang_bat ? 'tắt' : 'bật'} chương trình`, e); }
    setDangLuu(false);
  };
  const xoa = async (c) => {
    if (choXoa !== c.id) { setChoXoa(c.id); return; }
    setChoXoa(null); setDangLuu(true);
    try { await chuongTrinhApi.xoa(c.id); baoXong(`Đã xoá chương trình ${c.ten}`); await tai(); } catch (e) { baoLoiTu('xoá chương trình', e); }
    setDangLuu(false);
  };
  const luuTuoi = async () => {
    setLoiO((l) => ({ ...l, tuoi: '' })); setDangLuu(true);
    try {
      const r = await chuongTrinhApi.datKhoangTuoi(Number(tuoi.toi_thieu), Number(tuoi.toi_da));
      setTuoi(r.khoang_tuoi); baoXong(`Đã lưu khoảng tuổi ${r.khoang_tuoi.toi_thieu}–${r.khoang_tuoi.toi_da}`);
    } catch (e) { setLoiO((l) => ({ ...l, tuoi: lyDoLoi(e) })); baoLoiTu('lưu khoảng tuổi', e); }
    setDangLuu(false);
  };

  const o = { display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 160px' };
  return (
    <>
      <div className="card-title" style={{ margin: '0 0 0.5rem' }}>🎁 Chương trình</div>
      <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 1rem' }}>
        Khai báo các chương trình đặc biệt (học sinh giỏi, sinh nhật…). Ở bước này POS chỉ <b>lưu</b> và cho App hiện “áp dụng tại quán” — chưa tự giảm giá vào đơn.
        Chương trình chỉ hiện trên App khi đang <b>bật</b> và nằm trong ngày bắt đầu – kết thúc.
      </p>
      <LoiO loi={loiO.tai && `Chưa tải được danh sách chương trình: ${loiO.tai}`} />

      {ds.map((c) => (
        <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '0.6rem 0', borderTop: '1px solid #eee' }}>
          <div style={{ flex: '1 1 260px' }}>
            <b>{c.ten}</b> <span style={{ fontSize: 12, color: '#6b7280' }}>· {LOAI[c.loai]} · {c.dang_bat ? '🟢 đang bật' : '⚪ đang tắt'}</span>
            {c.mo_ta && <div style={{ fontSize: 13 }}>{c.mo_ta}</div>}
            <div style={{ fontSize: 12, color: '#6b7280' }}>{tomTat(c)}</div>
          </div>
          <button className="btn btn-outline" onClick={() => batTat(c)} disabled={dangLuu} title={c.dang_bat ? 'Tắt' : 'Bật'}><Power size={14} /> {c.dang_bat ? 'Tắt' : 'Bật'}</button>
          <button className="btn btn-outline" onClick={() => mo(c)}><Pencil size={14} /> Sửa</button>
          <button className="btn btn-outline" onClick={() => xoa(c)} disabled={dangLuu} style={choXoa === c.id ? { background: '#fee2e2', borderColor: '#ef4444' } : undefined}>
            <Trash2 size={14} /> {choXoa === c.id ? 'Bấm lần nữa để xoá' : 'Xoá'}
          </button>
        </div>
      ))}
      {!ds.length && !taiLoi && <div style={{ color: '#6b7280' }}>Chưa có chương trình nào.</div>}
      {!form && <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => mo(null)} disabled={taiLoi}><Plus size={14} /> Thêm chương trình</button>}

      {form && (
        <div style={{ marginTop: 12, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{form.id ? 'Sửa chương trình' : 'Chương trình mới'}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <label style={o}>Tên<input className="input" maxLength={80} value={form.ten} onChange={(e) => sua('ten', e.target.value)} /><LoiO loi={loiO.ten} /></label>
            <label style={o}>Loại
              <select className="input" value={form.loai} onChange={(e) => sua('loai', e.target.value)}>{Object.entries(LOAI).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
            </label>
            <label style={{ ...o, flexBasis: '100%' }}>Mô tả ngắn (hiện trên App)<input className="input" maxLength={200} value={form.mo_ta} onChange={(e) => sua('mo_ta', e.target.value)} /></label>
          </div>
          <div style={{ fontWeight: 500, margin: '10px 0 4px' }}>Ưu đãi (điền ít nhất một)</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <label style={o}>Miễn bao nhiêu món<input type="number" className="input" min={0} max={20} value={form.mien_so_mon} onChange={(e) => sua('mien_so_mon', e.target.value)} /></label>
            <label style={o}>Giá tối đa món miễn (đồng; trống = không giới hạn)<input type="number" className="input" min={1} value={form.mien_gia_toi_da} onChange={(e) => sua('mien_gia_toi_da', e.target.value)} /></label>
            <label style={o}>Giảm % cả đơn<input type="number" className="input" min={0} max={100} value={form.giam_ca_don_pt} onChange={(e) => sua('giam_ca_don_pt', e.target.value)} /></label>
            <label style={o}>Giảm % phần còn lại của đơn<input type="number" className="input" min={0} max={100} value={form.giam_con_lai_pt} onChange={(e) => sua('giam_con_lai_pt', e.target.value)} /></label>
          </div>
          <div style={{ fontWeight: 500, margin: '10px 0 4px' }}>Điều kiện</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label><input type="checkbox" checked={!!form.chi_tai_quan} onChange={(e) => sua('chi_tai_quan', e.target.checked)} /> Chỉ tại quán</label>
            <label><input type="checkbox" checked={!!form.can_xem_giay_to} onChange={(e) => sua('can_xem_giay_to', e.target.checked)} /> Bắt buộc “đã xem giấy tờ”</label>
            <label style={o}>Số lần<input type="number" className="input" min={1} max={99} value={form.gioi_han_so} onChange={(e) => sua('gioi_han_so', e.target.value)} /></label>
            <label style={o}>Tính theo
              <select className="input" value={form.gioi_han_ky} onChange={(e) => sua('gioi_han_ky', e.target.value)}>{Object.entries(KY).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
            </label>
            <label style={o}>Từ ngày<input type="date" className="input" value={form.bat_dau} onChange={(e) => sua('bat_dau', e.target.value)} /></label>
            <label style={o}>Đến ngày<input type="date" className="input" value={form.ket_thuc} onChange={(e) => sua('ket_thuc', e.target.value)} /></label>
          </div>
          <label style={{ display: 'block', marginTop: 8 }}><input type="checkbox" checked={!!form.dang_bat} onChange={(e) => sua('dang_bat', e.target.checked)} /> Bật ngay</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn btn-primary" onClick={luu} disabled={dangLuu}><Save size={14} /> {dangLuu ? 'Đang lưu…' : 'Lưu'}</button>
            <button className="btn btn-outline" disabled={dangLuu} onClick={() => moForm(null)}>Bỏ</button>
          </div>
          <LoiO loi={loiO.form} />
        </div>
      )}

      <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
        <div style={{ fontWeight: 600 }}>Ngày sinh khách — khoảng tuổi cho phép</div>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 8px' }}>
          Ngày sinh nhập một lần (khách tự nhập trên App hoặc nhân viên nhập ở màn Khách hàng); sau đó chỉ chủ quán sửa. Ngày nằm ngoài khoảng tuổi này bị từ chối.
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label style={o}>Từ (tuổi)<input type="number" className="input" min={0} max={150} value={tuoi.toi_thieu} onChange={(e) => setTuoi({ ...tuoi, toi_thieu: e.target.value })} /></label>
          <label style={o}>Đến (tuổi)<input type="number" className="input" min={0} max={150} value={tuoi.toi_da} onChange={(e) => setTuoi({ ...tuoi, toi_da: e.target.value })} /></label>
          <button className="btn btn-outline" onClick={luuTuoi} disabled={taiLoi || dangLuu}><Save size={14} /> Lưu khoảng tuổi</button>
        </div>
        <LoiO loi={loiO.tuoi} />
      </div>
      <ThanhLuu id="chuong-trinh" coDoi={coDoi} dangLuu={dangLuu} onLuu={luu} onBo={() => moForm(null)} />
    </>
  );
}
