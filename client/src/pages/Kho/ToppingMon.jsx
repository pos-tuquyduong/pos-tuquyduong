/**
 * TOPPING-1 (B3) — topping + ghi chú nhanh CÀI THEO TỪNG MÓN, ở Kho › Sản phẩm & công thức (cùng chỗ sửa món — một món sửa ở MỘT chỗ).
 * Máy chủ kiểm quyền (manage_settings, như sửa món) và kiểm dữ liệu (PUT /products/:id, POST /products/:id/chep-nhom). Giá thêm vào ly = giá bán
 * của sản phẩm topping (ô "Giá bán" ở Thông tin bán); ô "Bán riêng" trống = chỉ thêm vào ly.
 */
import { useEffect, useState } from 'react';
import { productsApi } from '../../utils/api';
import { baoXong, baoLoiTu } from '../../components/thongBaoKho.js';

const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';

/** Bảng topping (tên, giá thêm, giá bán riêng, còn) — đầu màn Sản phẩm. */
export function DanhSachTopping() {
  const [ds, setDs] = useState([]);
  useEffect(() => { productsApi.list().then((d) => setDs(Array.isArray(d) ? d : [])).catch((e) => baoLoiTu('tải danh sách topping', e)); }, []);
  const tp = ds.filter((p) => p.la_topping);
  if (!tp.length) return null;
  return (
    <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
      <h3 className="card-title">Topping</h3>
      {tp.map((t) => (
        <div key={t.id} className="kho-dong">
          <span style={{ flex: 1 }}>{t.name}</span>
          <span className="kho-nho">thêm {vnd(t.price)} · {t.gia_ban_rieng ? `bán riêng ${vnd(t.gia_ban_rieng)}` : 'không bán riêng'}</span>
          <b>{t.chua_cong_thuc ? 'chưa công thức' : t.stock_quantity == null ? '—' : t.stock_quantity > 0 ? `còn ${t.stock_quantity}` : 'Hết'}</b>
        </div>
      ))}
    </div>
  );
}

export default function ToppingMon({ sp }) {
  const [ds, setDs] = useState(null);
  const [f, setF] = useState(null);
  const [moi, setMoi] = useState('');
  const [dang, setDang] = useState(false);
  const tai = () => productsApi.list().then((d) => {
    const ra = Array.isArray(d) ? d : [];
    const m = ra.find((p) => p.id === sp.id);
    setDs(ra);
    setF(m ? { la_topping: !!m.la_topping, gia_ban_rieng: m.gia_ban_rieng ?? '', topping: m.topping || [], ghi_chu_nhanh: m.ghi_chu_nhanh || [] } : null);
  }).catch((e) => baoLoiTu('tải topping', e));
  useEffect(() => { tai(); }, [sp.id]);
  if (!ds || !f) return null;

  const dsTp = ds.filter((p) => p.la_topping && p.id !== sp.id);
  const luu = async () => {
    if (dang) return;
    setDang(true);
    try {
      await productsApi.update(sp.id, f.la_topping
        ? { la_topping: 1, gia_ban_rieng: f.gia_ban_rieng === '' ? null : Number(f.gia_ban_rieng), topping_cho_mon: [] }
        : { la_topping: 0, topping_cho_mon: f.topping, ghi_chu_nhanh: f.ghi_chu_nhanh });
      baoXong(`Đã lưu topping & ghi chú của ${sp.name}`);
      tai();
    } catch (e) { baoLoiTu('lưu topping', e); } finally { setDang(false); }
  };
  const chep = async () => {
    if (dang) return;
    setDang(true);
    try { const r = await productsApi.chepNhom(sp.id); baoXong(`Đã chép cho ${r.so_mon} món cùng nhóm "${sp.category}"`); } catch (e) { baoLoiTu('chép cho cả nhóm', e); } finally { setDang(false); }
  };
  const lat = (id) => setF({ ...f, topping: f.topping.includes(id) ? f.topping.filter((x) => x !== id) : [...f.topping, id] });
  const themGc = () => { const x = moi.trim(); if (x && !f.ghi_chu_nhanh.includes(x)) setF({ ...f, ghi_chu_nhanh: [...f.ghi_chu_nhanh, x] }); setMoi(''); };
  return (
    <div className="card" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
      <h3 className="card-title">Topping &amp; ghi chú nhanh</h3>
      <label className="kho-hang"><input type="checkbox" checked={f.la_topping} onChange={(e) => setF({ ...f, la_topping: e.target.checked })} />
        Đây là topping (thêm vào ly; giá thêm = giá bán ở trên)</label>
      {f.la_topping ? (
        <div className="kho-form">
          <label>Bán riêng (giá một phần, để trống = không bán riêng)
            <input className="input" type="number" min="0" step="1000" value={f.gia_ban_rieng} onChange={(e) => setF({ ...f, gia_ban_rieng: e.target.value })} /></label>
        </div>
      ) : (
        <>
          <div className="kho-nho" style={{ margin: '0.5rem 0 0.25rem' }}>Topping được thêm vào món này</div>
          <div className="kho-hang" style={{ flexWrap: 'wrap' }}>
            {dsTp.map((t) => <button key={t.id} className={`btn btn-sm ${f.topping.includes(t.id) ? 'btn-primary' : 'btn-outline'}`} onClick={() => lat(t.id)}>
              {f.topping.includes(t.id) ? '✓ ' : ''}{t.name}</button>)}
            {!dsTp.length && <span className="kho-nho">Chưa có topping — tạo món, đặt kiểu "Làm sẵn" + công thức, rồi tick "Đây là topping".</span>}
          </div>
          <div className="kho-nho" style={{ margin: '0.75rem 0 0.25rem' }}>Ghi chú nhanh (nút ở khung chọn món)</div>
          <div className="kho-hang" style={{ flexWrap: 'wrap' }}>
            {f.ghi_chu_nhanh.map((x) => <button key={x} className="btn btn-sm btn-outline" onClick={() => setF({ ...f, ghi_chu_nhanh: f.ghi_chu_nhanh.filter((y) => y !== x) })}>{x} ✕</button>)}
            {!f.ghi_chu_nhanh.length && <span className="kho-nho">Chưa có — nếu cũng không có topping, chạm món là vào giỏ</span>}
          </div>
          <div className="kho-hang"><input className="input" maxLength={30} placeholder="Thêm ghi chú nhanh, vd Ít đá" value={moi} onChange={(e) => setMoi(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') themGc(); }} /><button className="btn btn-outline" onClick={themGc}>Thêm</button></div>
        </>
      )}
      <div className="kho-hang" style={{ marginTop: '0.75rem' }}>
        <button className="btn btn-primary" disabled={dang} onClick={luu}>{dang ? 'Đang lưu…' : 'Lưu topping & ghi chú'}</button>
        {!f.la_topping && <button className="btn btn-outline" disabled={dang} onClick={chep}>Chép cho cả nhóm "{sp.category}"</button>}
      </div>
    </div>
  );
}
