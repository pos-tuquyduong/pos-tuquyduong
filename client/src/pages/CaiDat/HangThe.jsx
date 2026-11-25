// HANG-1 — thẻ Cài đặt "Hạng thành viên" (demo tab 2, thiet_ke/THIET_KE_DOT2.md M3): mỗi hạng một thẻ — tên, thứ bậc (▲▼, lớn = cao),
// % giảm thường / nhóm đặc biệt, cách có hạng Bán (danh sách gói: số tháng + giá + bật) hoặc Chỉ cấp (chủ quán cấp ở trang Khách hàng).
// Lưu một lần cả danh sách (PUT /tiers — máy chủ kiểm hết rồi ghi trong một giao dịch). Xoá hạng bấm 2 lần, không hộp thoại trình duyệt.
// PIN chủ quán đặt ở đây — chỉ tài khoản chủ quán, gõ lại mật khẩu; đã có PIN thì gõ cả PIN cũ (chủ quán 05.11 — quên PIN: nhờ chat xoá, không
// có nút). Lưu / Xoá hạng và cấp / thu hồi hạng phải gõ PIN (chủ quán 04.11 — máy chủ kiểm, sai 5 lần khoá). % combo KHÔNG ở đây (COMBO-1a).
// BAO-1b: báo qua thông báo chung (BAO-1a); lỗi của ô hiện ngay dưới ô; bấm Lưu / Xoá thì HỎI PIN (ô nổi, PIN sai báo dưới ô PIN, dữ liệu đã gõ giữ nguyên);
// sửa mà chưa Lưu → thanh "Có thay đổi chưa lưu"; lưu xong tải lại số máy chủ giữ.
// GIAO-DIEN-2 (M3, chủ quán duyệt 17.11): một hạng MỞ để sửa (viền đậm), hạng khác thu gọn một dòng + nút Sửa; thanh dính đáy là ThanhLuu sẵn có; PIN chủ quán
// tách sang CaiDat/PinChuQuan.jsx (ở đây còn một dòng dẫn sang). Cách lưu / API / PIN-khi-lưu KHÔNG đổi.
// KH-THE-1 (F): mỗi hạng một ô "Quyền lợi" nhiều dòng — App KH hiện từng dòng (GET /api/kh/hang quyen_loi[]); máy chủ kiểm số dòng / độ dài.
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { hangApi } from '../../utils/api';
import { baoXong, baoLoi, baoLoiTu, lyDoLoi } from '../../components/thongBaoKho.js';
import LoiO from '../../components/LoiO';
import ThanhLuu from '../../components/ThanhLuu';
import HoiPin from '../../components/HoiPin';
import useThayDoi from '../../components/useThayDoi';
import { kiemHang, ghepSauTai } from '../../components/kiemCaiDat.js';

let soTam = 0;   // khoá tạm cho hạng chưa lưu (chưa có id)
const docVe = (t) => ({ ...t, khoa: 'h' + t.id, quyen_loi: t.quyen_loi || '', goi: (t.goi || []).map((g) => ({ ...g, gia: g.gia ?? '' })) });

export default function HangThe() {
  const { hasPermission } = useAuth();
  const [ds, setDs] = useState(null);   // xếp thứ bậc CAO trước
  const [lamTron, setLamTron] = useState({ round_to: 500, round_mode: 'nearest' });
  const [xoaCho, setXoaCho] = useState(null);
  const [dangLuu, setDangLuu] = useState(false);
  const [taiLoi, setTaiLoi] = useState('');
  const [loiHang, setLoiHang] = useState({});   // `${khoa}:${ô}` → câu lỗi hiện dưới ô đó
  const [loiLuu, setLoiLuu] = useState('');
  const [hoiPin, setHoiPin] = useState(null);   // null = đóng; { tieuDe, viec(pin), ten } = đang hỏi PIN
  const [dangSua, setDangSua] = useState(null);   // khoá hạng đang mở để sửa (null → hạng đầu)
  const [coDoi, chup] = useThayDoi({ ds, lamTron });

  // giu = nạp lại sau thao tác ghi cục bộ (xoá hạng): KHÔNG đè phần đang gõ dở ở chỗ khác; ảnh chụp vẫn là số máy chủ giữ
  const tai = async ({ giu } = {}) => {
    try {
      const r = await hangApi.ds();
      const moi = (r.data?.tiers || []).map(docVe).sort((a, b) => b.sort_order - a.sort_order);
      const tron = { round_to: r.data?.round_to ?? 500, round_mode: r.data?.round_mode || 'nearest' };
      giu ? setDs((cu) => ghepSauTai(cu, moi)) : setDs(moi);
      if (!giu) setLamTron(tron);
      chup({ ds: moi, lamTron: tron }); if (!giu) { setLoiHang({}); setLoiLuu(''); } setTaiLoi('');
    } catch (e) { setTaiLoi(lyDoLoi(e)); baoLoiTu('tải danh sách hạng', e); }
  };
  useEffect(() => { tai(); }, []);

  const sua = (khoa, kv) => setDs((d) => d.map((h) => (h.khoa === khoa ? { ...h, ...kv } : h)));
  const suaGoi = (khoa, j, kv) => setDs((d) => d.map((h) => (h.khoa === khoa ? { ...h, goi: h.goi.map((g, i) => (i === j ? { ...g, ...kv } : g)) } : h)));
  // ▲▼ đổi chỗ với hạng kề rồi đánh lại thứ bậc n..1 (trên cùng = cao nhất)
  const doiBac = (i, buoc) => setDs((d) => {
    const j = i + buoc;
    if (j < 0 || j >= d.length) return d;
    const m = [...d];
    [m[i], m[j]] = [m[j], m[i]];
    return m.map((h, n) => ({ ...h, sort_order: m.length - n }));
  });
  const them = () => {
    const khoa = 't' + (++soTam);
    setDs((d) => [{ khoa, name: 'Hạng mới', sort_order: (d[0]?.sort_order || 0) + 1, discount_percent: 0,
      special_discount_percent: 0, cach_co: 'ban', quyen_loi: '', goi: [{ so_thang: 1, gia: '', bat: true }] }, ...d]);
    setDangSua(khoa);
  };

  const xoa = (h) => {
    if (xoaCho !== h.khoa) { setXoaCho(h.khoa); return; }
    setXoaCho(null);
    if (!h.id) { setDs((d) => d.filter((x) => x.khoa !== h.khoa)); return; }
    setHoiPin({ tieuDe: `Xoá hạng ${h.name} — gõ PIN chủ quán`, ten: 'xoá hạng', viec: async (pinSua) => { await hangApi.xoa(h.id, pinSua); baoXong(`Đã xoá hạng ${h.name}`); await tai({ giu: true }); } });
  };
  // Kiểm trước từng ô (máy chủ vẫn kiểm lại hết): ô nào sai hiện chữ đỏ ngay dưới ô đó, chưa hỏi PIN.
  const batLuu = () => {
    const l = kiemHang(ds);
    setLoiHang(l); setLoiLuu('');
    if (Object.keys(l).length) { baoLoi('Chưa lưu hạng thành viên được', 'Sửa các ô báo đỏ rồi bấm Lưu lại.'); return; }
    setHoiPin({ tieuDe: 'Lưu hạng thành viên — gõ PIN chủ quán', ten: 'lưu hạng thành viên', viec: luu });
  };
  const luu = async (pinLuu) => {
    setDangLuu(true);
    try {
      await hangApi.luu({
        tiers: ds.map((h) => ({ id: h.id, name: h.name, sort_order: h.sort_order, discount_percent: h.discount_percent,
          special_discount_percent: h.special_discount_percent, cach_co: h.cach_co, quyen_loi: h.quyen_loi,
          goi: h.cach_co === 'ban' ? h.goi.map((g) => ({ so_thang: Number(g.so_thang), gia: g.gia === '' ? null : Number(g.gia), bat: g.bat })) : [] })),
        round_to: lamTron.round_to, round_mode: lamTron.round_mode, pin: pinLuu,
      });
      baoXong(`Đã lưu ${ds.length} hạng thành viên: ${ds.map((h) => h.name).join(', ')}`);
      await tai();
    } finally { setDangLuu(false); }
  };
  // GIAO-DIEN-2 (E1): sửa hạng khác khi còn thay đổi chưa lưu → hỏi như doiThe của Settings; đồng ý thì BỎ thay đổi (tải lại số máy chủ giữ) rồi mở hạng kia.
  const moHangKhac = async (khoa) => {
    if (coDoi && !window.confirm('Còn thay đổi chưa lưu ở hạng đang sửa. Sửa hạng khác sẽ bỏ các thay đổi này. Vẫn sửa?')) return;
    if (coDoi) await tai();
    setDangSua(khoa);
  };

  if (!ds) return <div className="loading">{taiLoi ? <><LoiO loi={`Chưa tải được danh sách hạng: ${taiLoi}`} /><button className="btn btn-outline" onClick={tai}>Tải lại</button></> : 'Đang tải...'}</div>;
  const dong = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6 };
  const nho = { padding: '2px 10px', fontSize: 13 };
  const giaXem = (h) => {
    let p = 50500 * (1 - (Number(h.discount_percent) || 0) / 100);
    const rt = lamTron.round_to;
    if (rt > 0) p = lamTron.round_mode === 'down' ? Math.floor(p / rt) * rt : Math.round(p / rt) * rt;
    return p.toLocaleString('vi-VN');
  };
  const khoaMo = ds.some((h) => h.khoa === dangSua) ? dangSua : ds[0]?.khoa;
  const hangMo = ds.find((h) => h.khoa === khoaMo);
  const tomTat = (h) => `Giảm ${Number(h.discount_percent) || 0}% · ${h.cach_co === 'ban' ? 'Mua ở quầy / trên App' : 'Chỉ chủ quán cấp'}`;
  return (
    <>
      <div className="card-title" style={{ margin: '0 0 0.5rem' }}>🏅 Hạng thành viên</div>
      <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 1rem' }}>
        Khách có hạng được giảm giá khi mua. Khách có nhiều hạng thì máy dùng hạng cao nhất. Thứ bậc càng lớn càng cao (trên cùng là cao nhất) —
        khách đang có hạng cao hơn thì không mua được hạng thấp hơn; mua thêm gói cùng hạng → hạn cộng nối. Gói chưa đặt giá thì chưa bán.
        {' '}Bấm Lưu hoặc Xoá hạng: máy sẽ hỏi PIN chủ quán.
        {hasPermission('chi_chu_quan') && <>{' '}<Link to="/settings?the=pin">Đặt / đổi PIN chủ quán ›</Link></>}
      </p>

      {ds.map((h, i) => (h.khoa !== khoaMo ? (
        <div key={h.khoa} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <b style={{ flex: 1, minWidth: 120 }}>{h.name}</b>
          <span style={{ fontSize: 13, color: '#6b7280' }}>{tomTat(h)}</span>
          <button className="btn btn-outline" style={nho} onClick={() => moHangKhac(h.khoa)}>Sửa</button>
        </div>
      ) : (
        <div key={h.khoa} style={{ border: '2px solid #5b21b6', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
          <div style={dong}>
            <input className="input" style={{ fontWeight: 700, flex: 1, minWidth: 140 }} value={h.name} aria-label="Tên hạng"
              onChange={(e) => sua(h.khoa, { name: e.target.value })} />
            <span style={{ fontSize: 12, color: '#5b21b6' }}>· đang sửa</span>
            <div style={{ flexBasis: '100%' }}><LoiO loi={loiHang[`${h.khoa}:name`]} /></div>
            <span style={{ fontSize: 12, background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 10 }}>Thứ bậc {h.sort_order}</span>
            <button className="btn btn-outline" style={nho} aria-label="Lên bậc" onClick={() => doiBac(i, -1)} disabled={i === 0}>▲</button>
            <button className="btn btn-outline" style={nho} aria-label="Xuống bậc" onClick={() => doiBac(i, 1)} disabled={i === ds.length - 1}>▼</button>
            <button className="btn btn-outline" onClick={() => xoa(h)} onBlur={() => setXoaCho(null)}
              style={{ ...nho, color: xoaCho === h.khoa ? '#fff' : '#dc2626', background: xoaCho === h.khoa ? '#dc2626' : undefined }}>
              {xoaCho === h.khoa ? 'Bấm lần nữa để xoá' : 'Xoá'}
            </button>
          </div>
          <div style={dong}>
            <label style={{ fontSize: 13 }}>% giảm thường{' '}
              <input type="number" className="input" style={{ width: 70 }} min="0" max="90" value={h.discount_percent}
                onChange={(e) => sua(h.khoa, { discount_percent: e.target.value })} /><LoiO loi={loiHang[`${h.khoa}:pt`]} /></label>
            <label style={{ fontSize: 13 }}>% giảm nhóm món đặc biệt{' '}
              <input type="number" className="input" style={{ width: 70 }} min="0" max="90" value={h.special_discount_percent ?? 0}
                onChange={(e) => sua(h.khoa, { special_discount_percent: e.target.value })} /><LoiO loi={loiHang[`${h.khoa}:dacbiet`]} /></label>
            <span style={{ fontSize: 12, color: '#6b7280' }}>món 50.500đ → {giaXem(h)}đ</span>
          </div>
          <div style={dong} role="group" aria-label="Cách có hạng">
            {[['ban', 'Mua ở quầy / trên App'], ['chi_cap', 'Chỉ chủ quán cấp']].map(([v, ten]) => (
              <button key={v} className={`btn ${h.cach_co === v ? 'btn-primary' : 'btn-outline'}`} style={nho} aria-pressed={h.cach_co === v}
                onClick={() => sua(h.khoa, { cach_co: v })}>{ten}</button>
            ))}
          </div>
          {h.cach_co === 'ban' ? (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Gói bán</div>
              {h.goi.map((g, j) => (
                <div key={j} style={dong}>
                  <input type="number" className="input" style={{ width: 74 }} min="1" max="60" value={g.so_thang} aria-label="Số tháng"
                    onChange={(e) => suaGoi(h.khoa, j, { so_thang: e.target.value })} /> tháng
                  <input className="input" inputMode="numeric" style={{ width: 150 }} placeholder="Giá (chưa đặt)" value={g.gia} aria-label="Giá gói"
                    onChange={(e) => suaGoi(h.khoa, j, { gia: e.target.value.replace(/\D/g, '') })} />đ
                  <label style={{ fontSize: 13 }}><input type="checkbox" checked={g.bat} onChange={(e) => suaGoi(h.khoa, j, { bat: e.target.checked })} /> Đang bán</label>
                  <button className="btn btn-outline" style={{ ...nho, color: '#dc2626' }}
                    onClick={() => sua(h.khoa, { goi: h.goi.filter((_, x) => x !== j) })}>Xoá gói</button>
                </div>
              ))}
              <button className="btn btn-outline" style={{ ...nho, marginTop: 6 }}
                onClick={() => sua(h.khoa, { goi: [...h.goi, { so_thang: '', gia: '', bat: true }] })}>+ Thêm gói</button>
              <LoiO loi={loiHang[`${h.khoa}:goi`]} />
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
              Không hiện ở chỗ bán thẻ. Lúc cấp chủ quán chọn số tháng hoặc "Không thời hạn", ở trang Khách hàng (có PIN chủ quán, ghi người cấp + lúc cấp).
              Hết hạn mà khách còn hạng thấp hơn đang còn hạn → khách quay về hạng đó.
            </div>
          )}
          <label style={{ display: 'block', fontSize: 13, marginTop: 8 }}>Quyền lợi (App khách hiện — mỗi dòng một ý, tối đa 10 dòng)
            <textarea className="input" rows={3} style={{ width: '100%', marginTop: 4 }} value={h.quyen_loi} aria-label="Quyền lợi của hạng"
              onChange={(e) => sua(h.khoa, { quyen_loi: e.target.value })} /></label>
        </div>
      )))}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid #eee', flexWrap: 'wrap', gap: 8 }}>
        <div><div style={{ fontWeight: 600 }}>Làm tròn giá</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>Giá sau giảm được làm tròn cho đẹp</div></div>
        <select className="input" style={{ width: 200 }} value={`${lamTron.round_to}_${lamTron.round_mode}`}
          onChange={(e) => { const [rt, rm] = e.target.value.split('_'); setLamTron({ round_to: parseInt(rt, 10), round_mode: rm }); }}>
          <option value="500_nearest">Gần nhất tới 500đ</option>
          <option value="1000_nearest">Gần nhất tới 1.000đ</option>
          <option value="500_down">Tròn xuống tới 500đ (lợi khách)</option>
          <option value="1000_down">Tròn xuống tới 1.000đ (lợi khách)</option>
          <option value="0_nearest">Không làm tròn</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <button className="btn btn-outline" onClick={them}>+ Thêm hạng</button>
        <button className="btn btn-primary" onClick={batLuu} disabled={dangLuu}><Save size={16} /> {dangLuu ? 'Đang lưu…' : 'Lưu'}</button>
      </div>
      <LoiO loi={loiLuu} />

      <HoiPin mo={!!hoiPin} tieuDe={hoiPin?.tieuDe} chay={(p) => hoiPin.viec(p)} ten={hoiPin?.ten} loiKhac={(e) => { setLoiLuu(lyDoLoi(e)); baoLoiTu(hoiPin.ten, e); }} dong={() => setHoiPin(null)} />
      <ThanhLuu id="hang-the" coDoi={coDoi} dangLuu={dangLuu} onLuu={batLuu} onBo={tai} />
    </>
  );
}
