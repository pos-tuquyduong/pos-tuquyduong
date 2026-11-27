/**
 * Khung chọn món: topping (TOPPING-1) + ghi chú nhanh CỦA MÓN + ô tự gõ + số ly + "Thêm vào giỏ · <giá>". Trên điện thoại trượt từ đáy, máy tính
 * bảng nổi giữa. Mở lại từ dòng giỏ để sửa / xoá (có `dong`). Topping: chạm = thêm một phần (tối đa `topping_toi_da_phan` — máy chủ trả ở menu),
 * nút − bớt, hết hàng mờ, còn < NGUONG_CON phần hiện "còn n" (tồn trừ phần đã có ở các dòng KHÁC trong giỏ). Giá chỉ để hiện — máy chủ tự tra.
 */
import { useState } from 'react';
import { ghepGhiChu, tpCanTrongGio } from './tinh';

const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const NGUONG_CON = 5;
const vietTat = (ten) => String(ten || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export default function KhungChonMon({ sp, dong, dsTopping = [], gio = [], giaHang, noi, onLuu, onXoa, onDong }) {
  const nhanMon = sp.ghi_chu_nhanh || [];
  const toiDa = Number(sp.topping_toi_da_phan) || 1;
  const [nhan, setNhan] = useState(() => (dong?.note || '').split(',').map((s) => s.trim()).filter((s) => s && nhanMon.includes(s)));
  const [tuGo, setTuGo] = useState(() => (dong?.note || '').split(',').map((s) => s.trim()).filter((s) => s && !nhanMon.includes(s)).join(', '));
  const [soLy, setSoLy] = useState(dong?.quantity || 1);
  const [chon, setChon] = useState(() => (dong?.topping || []).map((t) => ({ ...t })));
  const [bao, setBao] = useState('');

  const tps = dsTopping.filter((t) => (sp.topping || []).includes(t.id) && t.sellable !== false);   // chưa giá / chưa công thức → không hiện (cùng App)
  const con = (t) => (t.khong_quan_kho ? Infinity : Number(t.stock_quantity ?? Infinity)) - tpCanTrongGio(gio, t.id, dong?.key);
  const phanCua = (t) => chon.find((x) => x.product_id === t.id)?.so_phan || 0;
  const them = (t) => {
    const n = phanCua(t);
    if (n >= toiDa) return setBao(`Tối đa ${toiDa} phần mỗi topping`);
    if ((n + 1) * soLy > con(t)) return setBao(`${t.name} chỉ còn ${Math.max(0, con(t))} phần`);
    setBao('');
    setChon((ds) => (n ? ds.map((x) => (x.product_id === t.id ? { ...x, so_phan: n + 1 } : x))
      : [...ds, { product_id: t.id, sx_product_type: t.sx_product_type, sx_product_id: t.sx_product_id, name: t.name, unit_price: t.price,
        is_special_group: !!t.is_special_group, so_phan: 1 }]));
  };
  const bot = (t) => setChon((ds) => ds.map((x) => (x.product_id === t.id ? { ...x, so_phan: x.so_phan - 1 } : x)).filter((x) => x.so_phan > 0));
  const doiLy = (d) => {
    const n = Math.max(1, soLy + d);
    const vuot = chon.find((x) => x.so_phan * n > con(tps.find((t) => t.id === x.product_id) || {}));
    if (vuot) return setBao(`${vuot.name} không đủ cho ${n} ly`);
    setBao(''); setSoLy(n);
  };
  const bat = (n) => setNhan((ds) => (ds.includes(n) ? ds.filter((x) => x !== n) : [...ds, n]));
  const giaMotLy = giaHang(sp) + chon.reduce((s, x) => s + giaHang(x) * x.so_phan, 0);
  return (
    <div className="bh-lop" onClick={onDong}>
      <div className={`bh-khung${noi ? ' bh-noi' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h3 style={{ margin: 0 }}>{sp.name}</h3>
          <span className="bh-gia">{vnd(giaHang(sp))}</span>
        </div>
        {tps.length > 0 && <div className="bh-muc-nho">Topping · chạm thêm để tăng phần (tối đa {toiDa})</div>}
        {tps.length > 0 && (
          <div className="bh-tp-luoi">
            {tps.map((t) => {
              const n = phanCua(t), conLai = con(t) - n * soLy, het = con(t) <= 0 && !n;
              return (
                <div key={t.id} className="bh-tp-bao">
                  <button className={`bh-tp${n ? ' bh-chon' : ''}`} disabled={het} onClick={() => them(t)} aria-label={t.name}>
                    {n > 0 && <b className="bh-tp-so">{n}</b>}
                    <span className="bh-tp-anh">{vietTat(t.name)}</span>
                    <span className="bh-tp-ten">{t.name}</span>
                    <span className="bh-mon-ton">{het ? 'Hết' : `+${vnd(giaHang(t))}`}</span>
                    {!het && conLai < NGUONG_CON && <span className="bh-mon-ton bh-tp-con">còn {Math.max(0, conLai)} phần</span>}
                  </button>
                  {n > 0 && <button className="bh-tp-bot" onClick={() => bot(t)} aria-label={`Bớt ${t.name}`}>−</button>}
                </div>
              );
            })}
          </div>
        )}
        {nhanMon.length > 0 && (
          <div className="bh-chip-hang">
            {nhanMon.map((n) => (
              <button key={n} className={`bh-chip${nhan.includes(n) ? ' bh-chon' : ''}`} onClick={() => bat(n)}>{n}</button>
            ))}
          </div>
        )}
        <input type="text" value={tuGo} onChange={(e) => setTuGo(e.target.value)} placeholder="Ghi chú khác (tự gõ)" maxLength={120} />
        {bao && <div className="bh-ghi-chu-ngu" style={{ color: 'var(--bh-do)' }}>{bao}</div>}
        <div className="bh-so-ly">
          <button onClick={() => doiLy(-1)} aria-label="Bớt một ly">−</button>
          <b>{soLy}</b>
          <button onClick={() => doiLy(1)} aria-label="Thêm một ly">+</button>
        </div>
        <button className="bh-nut" onClick={() => onLuu({ note: ghepGhiChu(nhan, tuGo), quantity: soLy, topping: chon })}>
          {dong ? 'Lưu' : 'Thêm vào giỏ'} · {vnd(giaMotLy * soLy)}
        </button>
        {dong && <button className="bh-nut bh-phu" onClick={onXoa}>Xoá khỏi giỏ</button>}
      </div>
    </div>
  );
}
