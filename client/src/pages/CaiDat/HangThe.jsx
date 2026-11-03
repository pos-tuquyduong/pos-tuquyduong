// HANG-1 — thẻ Cài đặt "Hạng thành viên" (demo tab 2, thiet_ke/THIET_KE_DOT2.md M3): mỗi hạng một thẻ — tên, thứ bậc (▲▼, lớn = cao),
// % giảm thường / nhóm đặc biệt, cách có hạng Bán (danh sách gói: số tháng + giá + bật) hoặc Chỉ cấp (chủ quán cấp ở trang Khách hàng).
// Lưu một lần cả danh sách (PUT /tiers — máy chủ kiểm hết rồi ghi trong một giao dịch). Xoá hạng bấm 2 lần, không hộp thoại trình duyệt.
// PIN chủ quán (cấp / thu hồi hạng) đặt ở đây — chỉ tài khoản chủ quán, gõ lại mật khẩu đăng nhập. % combo KHÔNG ở đây (COMBO-1a).
import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { hangApi } from '../../utils/api';

let soTam = 0;   // khoá tạm cho hạng chưa lưu (chưa có id)
const docVe = (t) => ({ ...t, khoa: 'h' + t.id, goi: (t.goi || []).map((g) => ({ ...g, gia: g.gia ?? '' })) });

export default function HangThe() {
  const { user } = useAuth();
  const [ds, setDs] = useState(null);   // xếp thứ bậc CAO trước
  const [lamTron, setLamTron] = useState({ round_to: 500, round_mode: 'nearest' });
  const [xoaCho, setXoaCho] = useState(null);
  const [dangLuu, setDangLuu] = useState(false);
  const [thongDiep, setThongDiep] = useState('');
  const [coPin, setCoPin] = useState(null);
  const [pin, setPin] = useState({ mat_khau: '', pin: '', pin_lai: '' });

  const bao = (t) => { setThongDiep(t); if (!t.startsWith('Lỗi')) setTimeout(() => setThongDiep((x) => (x === t ? '' : x)), 3000); };
  const tai = async () => {
    try {
      const r = await hangApi.ds();
      setDs((r.data?.tiers || []).map(docVe).sort((a, b) => b.sort_order - a.sort_order));
      setLamTron({ round_to: r.data?.round_to ?? 500, round_mode: r.data?.round_mode || 'nearest' });
      setCoPin((await hangApi.coPin()).data?.co_pin === true);
    } catch (e) { bao('Lỗi: ' + e.message); }
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
  const them = () => setDs((d) => [{ khoa: 't' + (++soTam), name: 'Hạng mới', sort_order: (d[0]?.sort_order || 0) + 1, discount_percent: 0,
    special_discount_percent: 0, cach_co: 'ban', goi: [{ so_thang: 1, gia: '', bat: true }] }, ...d]);

  const xoa = async (h) => {
    if (xoaCho !== h.khoa) { setXoaCho(h.khoa); return; }
    setXoaCho(null);
    if (!h.id) { setDs((d) => d.filter((x) => x.khoa !== h.khoa)); return; }
    try { await hangApi.xoa(h.id); bao('Đã xoá hạng ' + h.name); await tai(); } catch (e) { bao('Lỗi: ' + e.message); }
  };
  const luu = async () => {
    setDangLuu(true);
    try {
      await hangApi.luu({
        tiers: ds.map((h) => ({ id: h.id, name: h.name, sort_order: h.sort_order, discount_percent: h.discount_percent,
          special_discount_percent: h.special_discount_percent, cach_co: h.cach_co,
          goi: h.cach_co === 'ban' ? h.goi.map((g) => ({ so_thang: Number(g.so_thang), gia: g.gia === '' ? null : Number(g.gia), bat: g.bat })) : [] })),
        round_to: lamTron.round_to, round_mode: lamTron.round_mode,
      });
      bao('Đã lưu hạng thành viên');
      await tai();
    } catch (e) { bao('Lỗi: ' + e.message); } finally { setDangLuu(false); }
  };
  const datPin = async () => {
    try {
      await hangApi.datPin(pin.mat_khau, pin.pin, pin.pin_lai);
      setPin({ mat_khau: '', pin: '', pin_lai: '' });
      setCoPin(true);
      bao('Đã đặt PIN chủ quán');
    } catch (e) { bao('Lỗi: ' + e.message); }
  };

  if (!ds) return <div className="loading">{thongDiep || 'Đang tải...'}</div>;
  const dong = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6 };
  const nho = { padding: '2px 10px', fontSize: 13 };
  const giaXem = (h) => {
    let p = 50500 * (1 - (Number(h.discount_percent) || 0) / 100);
    const rt = lamTron.round_to;
    if (rt > 0) p = lamTron.round_mode === 'down' ? Math.floor(p / rt) * rt : Math.round(p / rt) * rt;
    return p.toLocaleString('vi-VN');
  };
  return (
    <>
      <div className="card-title" style={{ margin: '0 0 0.5rem' }}>🏅 Hạng thành viên</div>
      <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 1rem' }}>
        Mỗi hạng một thẻ. Thứ bậc càng lớn càng cao (trên cùng là cao nhất) — khách đang có hạng cao hơn thì không mua được hạng thấp hơn,
        máy luôn áp hạng cao nhất còn hạn. <b>Bán</b>: danh sách gói tuỳ ý, gói chưa đặt giá thì chưa bán, mua thêm gói cùng hạng → hạn cộng nối.
        {' '}<b>Chỉ cấp</b>: chỉ chủ quán cấp ở trang Khách hàng (có PIN chủ quán, ghi người cấp + lúc cấp).
      </p>
      {thongDiep && <div style={{ padding: 8, marginBottom: 8, background: thongDiep.startsWith('Lỗi') ? '#fee2e2' : '#dcfce7', borderRadius: 6 }}>{thongDiep}</div>}

      {ds.map((h, i) => (
        <div key={h.khoa} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
          <div style={dong}>
            <input className="input" style={{ fontWeight: 700, flex: 1, minWidth: 140 }} value={h.name} aria-label="Tên hạng"
              onChange={(e) => sua(h.khoa, { name: e.target.value })} />
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
                onChange={(e) => sua(h.khoa, { discount_percent: e.target.value })} /></label>
            <label style={{ fontSize: 13 }}>% giảm nhóm món đặc biệt{' '}
              <input type="number" className="input" style={{ width: 70 }} min="0" max="90" value={h.special_discount_percent ?? 0}
                onChange={(e) => sua(h.khoa, { special_discount_percent: e.target.value })} /></label>
            <span style={{ fontSize: 12, color: '#6b7280' }}>món 50.500đ → {giaXem(h)}đ</span>
          </div>
          <div style={dong} role="group" aria-label="Cách có hạng">
            {[['ban', 'Bán ở quầy'], ['chi_cap', 'Chỉ cấp (chủ quán)']].map(([v, ten]) => (
              <button key={v} className={`btn ${h.cach_co === v ? 'btn-primary' : 'btn-outline'}`} style={nho} aria-pressed={h.cach_co === v}
                onClick={() => sua(h.khoa, { cach_co: v })}>{ten}</button>
            ))}
          </div>
          {h.cach_co === 'ban' ? (
            <div style={{ marginTop: 6 }}>
              {h.goi.map((g, j) => (
                <div key={j} style={dong}>
                  <label style={{ fontSize: 13 }}><input type="checkbox" checked={g.bat} onChange={(e) => suaGoi(h.khoa, j, { bat: e.target.checked })} /> Bán</label>
                  <input type="number" className="input" style={{ width: 74 }} min="1" max="60" value={g.so_thang} aria-label="Số tháng"
                    onChange={(e) => suaGoi(h.khoa, j, { so_thang: e.target.value })} /> tháng
                  <input className="input" inputMode="numeric" style={{ width: 150 }} placeholder="Giá (chưa đặt)" value={g.gia} aria-label="Giá gói"
                    onChange={(e) => suaGoi(h.khoa, j, { gia: e.target.value.replace(/\D/g, '') })} />đ
                  <button className="btn btn-outline" style={{ ...nho, color: '#dc2626' }}
                    onClick={() => sua(h.khoa, { goi: h.goi.filter((_, x) => x !== j) })}>Xoá gói</button>
                </div>
              ))}
              <button className="btn btn-outline" style={{ ...nho, marginTop: 6 }}
                onClick={() => sua(h.khoa, { goi: [...h.goi, { so_thang: '', gia: '', bat: true }] })}>+ Thêm gói</button>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
              Không hiện ở chỗ bán thẻ. Lúc cấp chủ quán chọn số tháng hoặc "Không thời hạn". Hết hạn mà khách còn hạng thấp hơn đang còn hạn → khách quay về hạng đó.
            </div>
          )}
        </div>
      ))}

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
      <div style={{ display: 'flex', gap: 8, marginTop: '0.5rem' }}>
        <button className="btn btn-outline" onClick={them}>+ Thêm hạng</button>
        <button className="btn btn-primary" onClick={luu} disabled={dangLuu}><Save size={16} /> {dangLuu ? 'Đang lưu...' : 'Lưu'}</button>
      </div>

      <div className="card-title" style={{ margin: '1.5rem 0 0.5rem' }}>🔐 PIN chủ quán</div>
      <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 0.5rem' }}>
        Dùng khi cấp / thu hồi hạng ở trang Khách hàng. {coPin ? 'Đã đặt.' : 'Chưa đặt — chưa cấp hạng được.'}
      </p>
      {user?.role === 'owner' && (
        <div style={dong}>
          <input className="input" type="password" style={{ width: 170 }} placeholder="Mật khẩu đăng nhập" value={pin.mat_khau} aria-label="Mật khẩu đăng nhập"
            onChange={(e) => setPin((p) => ({ ...p, mat_khau: e.target.value }))} />
          <input className="input" type="password" inputMode="numeric" maxLength={6} style={{ width: 130 }} placeholder="PIN mới (4–6 số)" value={pin.pin}
            aria-label="PIN mới" onChange={(e) => setPin((p) => ({ ...p, pin: e.target.value.replace(/\D/g, '') }))} />
          <input className="input" type="password" inputMode="numeric" maxLength={6} style={{ width: 130 }} placeholder="Nhập lại PIN" value={pin.pin_lai}
            aria-label="Nhập lại PIN" onChange={(e) => setPin((p) => ({ ...p, pin_lai: e.target.value.replace(/\D/g, '') }))} />
          <button className="btn btn-primary" onClick={datPin}>{coPin ? 'Đổi PIN' : 'Đặt PIN'}</button>
        </div>
      )}
    </>
  );
}
