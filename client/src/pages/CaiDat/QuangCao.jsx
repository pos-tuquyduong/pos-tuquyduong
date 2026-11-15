// QC-APP-1 — thẻ Cài đặt "📣 Quảng cáo trên App": chủ quán tự gõ chữ chạy trên dải quảng cáo (và banner Trang chủ) của App khách, chọn hôm nay /
// khung giờ nào hiện. Mỗi dòng: chữ dải (≤ 32 ký tự, đếm ngược), tiêu đề / dòng phụ / chữ nút banner (tuỳ chọn), bấm vào thì mở gì, khi nào hiện,
// Bật / Tắt, ▲▼ ưu tiên, dòng xem trước. Lưu cả danh sách một lần (PUT /api/pos/quang-cao — máy chủ kiểm lại hết, hỏi PIN chủ quán).
// BAO-1b: báo qua thông báo chung; lỗi của ô hiện ngay dưới ô (máy chủ trả loi_o → đúng ô); sửa mà chưa Lưu → thanh "Có thay đổi chưa lưu".
import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { quangCaoApi } from '../../utils/api';
import { baoXong, baoLoi, baoLoiTu, lyDoLoi } from '../../components/thongBaoKho.js';
import LoiO from '../../components/LoiO';
import ThanhLuu from '../../components/ThanhLuu';
import HoiPin from '../../components/HoiPin';
import useThayDoi from '../../components/useThayDoi';
import { GIOI_HAN, conLai, kiemDong } from './quangCao.js';

let soTam = 0;   // khoá tạm cho dòng chưa lưu (chưa có id)
const THU = [[1, 'T2'], [2, 'T3'], [3, 'T4'], [4, 'T5'], [5, 'T6'], [6, 'T7'], [7, 'CN']];
const NOI_MO = [['', 'Không mở gì'], ['menu', 'Menu'], ['mon', 'Một món'], ['uudai', 'Ưu đãi'], ['tracnghiem', 'Trắc nghiệm thể trạng']];
const KIEU_NGAY = [['hang_ngay', 'Hằng ngày'], ['thu', 'Các thứ trong tuần'], ['khoang', 'Từ ngày – đến ngày']];
const docVe = (d) => ({ ...d, khoa: 'q' + d.id, ma_mon: d.ma_mon || '', cac_thu: d.cac_thu || [], tu_ngay: d.tu_ngay || '', den_ngay: d.den_ngay || '',
  tu_gio: d.tu_gio || '', den_gio: d.den_gio || '' });
const dongMoi = () => ({ khoa: 't' + (++soTam), chu_dai: '', tieu_de: '', phu: '', chu_nut: '', dich: '', ma_mon: '', kieu_ngay: 'hang_ngay', cac_thu: [],
  tu_ngay: '', den_ngay: '', tu_gio: '', den_gio: '', bat: true });

export default function QuangCao() {
  const [ds, setDs] = useState(null);
  const [gioVang, setGioVang] = useState(false);
  const [mon, setMon] = useState([]);   // món ĐANG BÁN (máy chủ trả) — để chọn "Một món"
  const [xoaCho, setXoaCho] = useState(null);
  const [dangLuu, setDangLuu] = useState(false);
  const [taiLoi, setTaiLoi] = useState('');
  const [loiO, setLoiO] = useState({});   // `${khoa}:${ô}` → câu lỗi hiện dưới ô đó
  const [loiLuu, setLoiLuu] = useState('');
  const [hoiPin, setHoiPin] = useState(null);   // null = đóng; { tieuDe, ten, viec(pin) }
  const [coDoi, chup] = useThayDoi({ ds, gioVang });

  const tai = async () => {
    try {
      const r = await quangCaoApi.ds();
      const moi = (r.dong || []).map(docVe);
      setDs(moi); setGioVang(r.gio_vang === true); setMon(r.mon || []);
      chup({ ds: moi, gioVang: r.gio_vang === true }); setLoiO({}); setLoiLuu(''); setTaiLoi('');
    } catch (e) { setTaiLoi(lyDoLoi(e)); baoLoiTu('tải danh sách quảng cáo', e); }
  };
  useEffect(() => { tai(); }, []);

  const sua = (khoa, kv) => setDs((d) => d.map((x) => (x.khoa === khoa ? { ...x, ...kv } : x)));
  const doiViTri = (i, buoc) => setDs((d) => {
    const j = i + buoc;
    if (j < 0 || j >= d.length) return d;
    const m = [...d];
    [m[i], m[j]] = [m[j], m[i]];
    return m;
  });
  const bamThu = (d, t) => sua(d.khoa, { cac_thu: d.cac_thu.includes(t) ? d.cac_thu.filter((x) => x !== t) : [...d.cac_thu, t].sort((a, b) => a - b) });
  const xoa = (d) => {
    if (xoaCho !== d.khoa) { setXoaCho(d.khoa); return; }
    setXoaCho(null);
    setDs((x) => x.filter((y) => y.khoa !== d.khoa));
  };

  // Kiểm trước từng ô (máy chủ vẫn kiểm lại hết): ô sai hiện chữ đỏ ngay dưới ô, chưa hỏi PIN.
  const batLuu = () => {
    const l = kiemDong(ds);
    setLoiO(l); setLoiLuu(l.chung || '');
    if (Object.keys(l).length) { baoLoi('Chưa lưu quảng cáo được', 'Sửa các ô báo đỏ rồi bấm Lưu lại.'); return; }
    setHoiPin({ tieuDe: 'Lưu quảng cáo trên App — gõ PIN chủ quán', ten: 'lưu quảng cáo', viec: luu });
  };
  const luu = async (pin) => {
    setDangLuu(true);
    try {
      await quangCaoApi.luu({
        dong: ds.map((d) => ({ id: d.id, chu_dai: d.chu_dai, tieu_de: d.tieu_de, phu: d.phu, chu_nut: d.chu_nut, dich: d.dich, ma_mon: d.dich === 'mon' ? d.ma_mon : null,
          kieu_ngay: d.kieu_ngay, cac_thu: d.kieu_ngay === 'thu' ? d.cac_thu : [], tu_ngay: d.kieu_ngay === 'khoang' ? d.tu_ngay : null,
          den_ngay: d.kieu_ngay === 'khoang' ? d.den_ngay : null, tu_gio: d.tu_gio || null, den_gio: d.den_gio || null, bat: d.bat })),
        gio_vang: gioVang, pin,
      });
      baoXong(`Đã lưu ${ds.length} dòng quảng cáo`);
      await tai();
    } finally { setDangLuu(false); }
  };
  // Lỗi khác PIN: máy chủ có loi_o → hiện dưới đúng ô; không thì hiện dưới nút Lưu.
  const loiKhac = (e) => {
    const vt = e?.loi_o;
    if (vt && ds[vt.dong]) setLoiO({ [`${ds[vt.dong].khoa}:${vt.truong}`]: lyDoLoi(e) });
    else setLoiLuu(lyDoLoi(e));
    baoLoiTu('lưu quảng cáo', e);
  };

  if (!ds) return <div className="loading">{taiLoi ? <><LoiO loi={`Chưa tải được quảng cáo: ${taiLoi}`} /><button className="btn btn-outline" onClick={tai}>Tải lại</button></> : 'Đang tải...'}</div>;
  const dong = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6 };
  const nho = { padding: '2px 10px', fontSize: 13 };
  const tenMon = (ma) => mon.find((m) => m.ma === ma)?.ten;
  return (
    <>
      <div className="card-title" style={{ margin: '0 0 0.5rem' }}>📣 Quảng cáo trên App</div>
      <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 1rem' }}>
        Mỗi dòng là một câu chạy trên dải quảng cáo của App khách (và banner Trang chủ nếu điền tiêu đề). Dòng ở trên được ưu tiên hơn dòng ở dưới.
        Bấm Lưu: máy sẽ hỏi PIN chủ quán.
      </p>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 14 }}>
        <input type="checkbox" checked={gioVang} onChange={(e) => setGioVang(e.target.checked)} />
        Khi Giờ vàng đang chạy thì dải hiện Giờ vàng
      </label>

      {ds.map((d, i) => {
        const o = (t) => <LoiO loi={loiO[`${d.khoa}:${t}`]} />;
        const con = conLai(d.chu_dai);
        return (
          <div key={d.khoa} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', marginBottom: 10, opacity: d.bat ? 1 : 0.6 }}>
            <div style={dong}>
              <input className="input" style={{ fontWeight: 700, flex: 1, minWidth: 180 }} value={d.chu_dai} aria-label="Chữ dải" placeholder="Chữ chạy trên dải (bắt buộc)"
                onChange={(e) => sua(d.khoa, { chu_dai: e.target.value })} />
              <span style={{ fontSize: 12, color: con < 0 ? '#b91c1c' : '#6b7280' }}>{con < 0 ? `Quá ${-con} ký tự` : `Còn ${con} ký tự`}</span>
              <button className="btn btn-outline" style={nho} aria-label="Lên" onClick={() => doiViTri(i, -1)} disabled={i === 0}>▲</button>
              <button className="btn btn-outline" style={nho} aria-label="Xuống" onClick={() => doiViTri(i, 1)} disabled={i === ds.length - 1}>▼</button>
              <label style={{ fontSize: 13 }}><input type="checkbox" checked={d.bat} onChange={(e) => sua(d.khoa, { bat: e.target.checked })} /> {d.bat ? 'Bật' : 'Tắt'}</label>
              <button className="btn btn-outline" onClick={() => xoa(d)} onBlur={() => setXoaCho(null)}
                style={{ ...nho, color: xoaCho === d.khoa ? '#fff' : '#dc2626', background: xoaCho === d.khoa ? '#dc2626' : undefined }}>
                {xoaCho === d.khoa ? 'Bấm lần nữa để xoá' : 'Xoá'}
              </button>
            </div>
            {o('chu_dai')}
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Không ghi công dụng chữa bệnh (quy định quảng cáo thực phẩm).</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Xem trước dải:</div>
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280, background: '#fef3c7', color: '#92400e', fontSize: 13, padding: '3px 10px', borderRadius: 4 }}>
              {d.chu_dai.trim() || '(chưa gõ chữ)'}
            </div>

            <div style={dong}>
              <input className="input" style={{ flex: 1, minWidth: 140 }} value={d.tieu_de} aria-label="Tiêu đề banner" placeholder={`Tiêu đề banner (tuỳ chọn, ≤ ${GIOI_HAN.tieu_de})`}
                onChange={(e) => sua(d.khoa, { tieu_de: e.target.value })} />
              <input className="input" style={{ flex: 1, minWidth: 140 }} value={d.phu} aria-label="Dòng phụ banner" placeholder={`Dòng phụ (tuỳ chọn, ≤ ${GIOI_HAN.phu})`}
                onChange={(e) => sua(d.khoa, { phu: e.target.value })} />
              <input className="input" style={{ width: 150 }} value={d.chu_nut} aria-label="Chữ nút banner" placeholder={`Chữ nút (≤ ${GIOI_HAN.chu_nut})`}
                onChange={(e) => sua(d.khoa, { chu_nut: e.target.value })} />
            </div>
            {o('tieu_de')}{o('phu')}{o('chu_nut')}

            <div style={dong}>
              <label style={{ fontSize: 13 }}>Bấm vào thì mở{' '}
                <select className="input" value={d.dich} aria-label="Bấm vào thì mở" onChange={(e) => sua(d.khoa, { dich: e.target.value })}>
                  {NOI_MO.map(([v, ten]) => <option key={v} value={v}>{ten}</option>)}
                </select></label>
              {d.dich === 'mon' && (
                <select className="input" value={d.ma_mon} aria-label="Chọn món" onChange={(e) => sua(d.khoa, { ma_mon: e.target.value })}>
                  <option value="">— chọn món —</option>
                  {d.ma_mon && !tenMon(d.ma_mon) && <option value={d.ma_mon}>{d.ma_mon} (món đã tắt)</option>}
                  {mon.map((m) => <option key={m.ma} value={m.ma}>{m.ten}</option>)}
                </select>
              )}
            </div>
            {o('ma_mon')}

            <div style={dong} role="group" aria-label="Khi nào hiện">
              {KIEU_NGAY.map(([v, ten]) => (
                <button key={v} className={`btn ${d.kieu_ngay === v ? 'btn-primary' : 'btn-outline'}`} style={nho} aria-pressed={d.kieu_ngay === v}
                  onClick={() => sua(d.khoa, { kieu_ngay: v })}>{ten}</button>
              ))}
            </div>
            {d.kieu_ngay === 'thu' && (
              <div style={dong}>
                {THU.map(([t, ten]) => (
                  <button key={t} className={`btn ${d.cac_thu.includes(t) ? 'btn-primary' : 'btn-outline'}`} style={nho} aria-pressed={d.cac_thu.includes(t)}
                    onClick={() => bamThu(d, t)}>{ten}</button>
                ))}
              </div>
            )}
            {o('cac_thu')}
            {d.kieu_ngay === 'khoang' && (
              <div style={dong}>
                <label style={{ fontSize: 13 }}>Từ ngày <input type="date" className="input" value={d.tu_ngay} onChange={(e) => sua(d.khoa, { tu_ngay: e.target.value })} /></label>
                <label style={{ fontSize: 13 }}>đến ngày <input type="date" className="input" value={d.den_ngay} onChange={(e) => sua(d.khoa, { den_ngay: e.target.value })} /></label>
              </div>
            )}
            {o('tu_ngay')}{o('den_ngay')}
            <div style={dong}>
              <label style={{ fontSize: 13 }}>Từ giờ <input type="time" className="input" value={d.tu_gio} onChange={(e) => sua(d.khoa, { tu_gio: e.target.value })} /></label>
              <label style={{ fontSize: 13 }}>đến giờ <input type="time" className="input" value={d.den_gio} onChange={(e) => sua(d.khoa, { den_gio: e.target.value })} /></label>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Để trống cả hai = cả ngày. Giờ kết thúc phải sau giờ bắt đầu.</span>
            </div>
            {o('tu_gio')}{o('den_gio')}
          </div>
        );
      })}
      {ds.length === 0 && <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 10 }}>Chưa có dòng quảng cáo nào.</div>}

      <div style={{ display: 'flex', gap: 8, marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <button className="btn btn-outline" onClick={() => setDs((x) => [...x, dongMoi()])} disabled={ds.length >= GIOI_HAN.so_dong}>+ Thêm dòng</button>
        <button className="btn btn-primary" onClick={batLuu} disabled={dangLuu}><Save size={16} /> {dangLuu ? 'Đang lưu…' : 'Lưu'}</button>
      </div>
      <LoiO loi={loiLuu} />
      <HoiPin mo={!!hoiPin} tieuDe={hoiPin?.tieuDe} chay={(p) => hoiPin.viec(p)} ten={hoiPin?.ten} loiKhac={loiKhac} dong={() => setHoiPin(null)} />
      <ThanhLuu id="quang-cao" coDoi={coDoi} dangLuu={dangLuu} onLuu={batLuu} onBo={tai} />
    </>
  );
}
