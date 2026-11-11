// MANKHACH-1 (D) — thẻ Cài đặt "Màn khách": danh sách trang chạy lúc rảnh, địa chỉ QR App, hiện tên khách, các màn đã ghép + thu hồi.
// Lưu ba khoá man_khach_* qua PUT /settings (máy chủ kiểm bằng utils/manKhach.kiemCaiDat — sai một khoá thì không ghi khoá nào).
// BAO-1b: báo qua thông báo chung; lỗi ô dưới ô; sửa mà chưa Lưu → thanh "Có thay đổi chưa lưu"; lưu xong nạp lại số máy chủ giữ.
import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { api, manKhachApi } from '../../utils/api';
import { baoXong, baoLoi, baoLoiTu, lyDoLoi } from '../../components/thongBaoKho.js';
import LoiO from '../../components/LoiO';
import ThanhLuu from '../../components/ThanhLuu';
import useThayDoi from '../../components/useThayDoi';

const LOAI = { menu: 'Thực đơn (giá, hết hàng tự cập nhật)', flash: 'Giờ vàng (chỉ hiện khi đang chạy)', qr_app: 'QR tải App / tích điểm', chu: 'Chữ giới thiệu', anh: 'Ảnh (chờ có chỗ lưu ảnh)' };
const MAC_DINH = [{ loai: 'menu', bat: true, giay: 15 }, { loai: 'flash', bat: true, giay: 10 }, { loai: 'qr_app', bat: true, giay: 10 }];
const GIAY_MAC_DINH = 10;
const docJson = (s) => { try { return JSON.parse(s); } catch { return undefined; } };

export default function CaiDatManKhach() {
  const [trang, setTrang] = useState(MAC_DINH);
  const [diaChi, setDiaChi] = useState('');
  const [hienTen, setHienTen] = useState(false);
  const [may, setMay] = useState([]);
  const [taiLoi, setTaiLoi] = useState(false);   // chưa nạp được cài đặt → KHÔNG cho Lưu (Lưu ghi đè cả danh sách)
  const [dangLuu, setDangLuu] = useState(false);
  const [loiO, setLoiO] = useState({});   // tai / giay{i} / diaChi / luu / may → câu lỗi hiện dưới chỗ đó
  const [coDoi, chup] = useThayDoi({ trang, diaChi, hienTen });

  const tai = async () => {
    try {
      const s = (await api.get('/settings')).data || {};
      const ds = docJson(s.man_khach_trang);
      const trangMoi = Array.isArray(ds) ? ds : MAC_DINH;
      const diaChiMoi = s.man_khach_dia_chi_app || '';
      const hienTenMoi = s.man_khach_hien_ten === '1';
      setTrang(trangMoi); setDiaChi(diaChiMoi); setHienTen(hienTenMoi);
      chup({ trang: trangMoi, diaChi: diaChiMoi, hienTen: hienTenMoi });
      setTaiLoi(false); setLoiO({});
    } catch (e) { setTaiLoi(true); setLoiO({ tai: lyDoLoi(e) }); baoLoiTu('tải cài đặt màn khách', e); }
    try { setMay((await manKhachApi.danhSachMay()).may || []); } catch (e) { setLoiO((l) => ({ ...l, may: lyDoLoi(e) })); baoLoiTu('tải danh sách màn đã ghép', e); }
  };
  useEffect(() => { tai(); }, []);

  const sua = (i, truong, v) => setTrang((cu) => cu.map((t, j) => (j === i ? { ...t, [truong]: v } : t)));
  const doi = (i, d) => setTrang((cu) => { const j = i + d; if (j < 0 || j >= cu.length) return cu; const m = [...cu]; [m[i], m[j]] = [m[j], m[i]]; return m; });
  const them = (loai) => setTrang((cu) => [...cu, { loai, bat: loai !== 'anh', giay: GIAY_MAC_DINH }]);

  const luu = async () => {
    const l = {};
    trang.forEach((t, i) => { if (!(Number.isInteger(Number(t.giay)) && Number(t.giay) >= 3 && Number(t.giay) <= 120)) l[`giay${i}`] = 'Số giây phải từ 3 đến 120'; });
    setLoiO(l);
    if (Object.keys(l).length) { baoLoi('Chưa lưu màn khách được', 'Sửa các ô báo đỏ rồi bấm Lưu lại.'); return; }
    setDangLuu(true);
    try {
      const sach = trang.map((t) => ({ loai: t.loai, bat: !!t.bat, giay: Number(t.giay), ...(t.tieu_de ? { tieu_de: t.tieu_de } : {}), ...(t.noi_dung ? { noi_dung: t.noi_dung } : {}) }));
      await api.put('/settings', { settings: { man_khach_trang: JSON.stringify(sach), man_khach_dia_chi_app: diaChi.trim(), man_khach_hien_ten: hienTen ? '1' : '0' } });
      baoXong(`Đã lưu màn khách (${trang.filter((t) => t.bat).length} trang đang bật) — màn khách cập nhật trong khoảng một phút`);
      await tai();
    } catch (e) { setLoiO({ luu: lyDoLoi(e) }); baoLoiTu('lưu màn khách', e); }
    setDangLuu(false);
  };
  const thuHoi = async (m) => {
    if (!window.confirm(`Thu hồi màn “${m.ten}”? Màn này sẽ phải nhập mã ghép mới.`)) return;
    setDangLuu(true);
    try { await manKhachApi.thuHoi(m.id); setMay((cu) => cu.filter((x) => x.id !== m.id)); baoXong(`Đã thu hồi màn “${m.ten}”`); } catch (e) { setLoiO((l) => ({ ...l, may: lyDoLoi(e) })); baoLoiTu('thu hồi màn', e); }
    setDangLuu(false);
  };

  const hang = { display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0', borderTop: '1px solid #eee', flexWrap: 'wrap' };
  return (
    <>
      <div className="card-title" style={{ margin: '0 0 0.5rem' }}>🖥️ Màn khách</div>
      <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 1rem' }}>
        Máy tính bảng quay về phía khách: lúc thu hiện mã QR + món + tổng; lúc rảnh chạy vòng các trang dưới đây. Ghép máy: mở trang <b>/man-khach</b> trên
        máy tính bảng, nhập mã ở nút “Màn khách” góc màn Bán hàng.
      </p>
      <LoiO loi={loiO.tai && `Chưa tải được cài đặt — tải lại trang trước khi sửa: ${loiO.tai}`} />

      <div style={{ fontWeight: 600 }}>Các trang lúc rảnh (chạy từ trên xuống)</div>
      {trang.map((t, i) => (
        <div key={i} style={hang}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 90 }}>
            <input type="checkbox" checked={!!t.bat} disabled={t.loai === 'anh'} onChange={(e) => sua(i, 'bat', e.target.checked)} /> Bật
          </label>
          <div style={{ flex: '1 1 220px', fontWeight: 500 }}>{LOAI[t.loai] || t.loai}</div>
          <input type="number" className="input" style={{ width: 80 }} min={3} max={120} value={t.giay} onChange={(e) => sua(i, 'giay', e.target.value)} aria-label="Số giây" /> giây
          <div style={{ flexBasis: '100%' }}><LoiO loi={loiO[`giay${i}`]} /></div>
          <button className="btn btn-outline" onClick={() => doi(i, -1)} aria-label="Lên"><ArrowUp size={14} /></button>
          <button className="btn btn-outline" onClick={() => doi(i, 1)} aria-label="Xuống"><ArrowDown size={14} /></button>
          <button className="btn btn-outline" onClick={() => setTrang((cu) => cu.filter((_, j) => j !== i))} aria-label="Xoá"><Trash2 size={14} /></button>
          {(t.loai === 'chu' || t.loai === 'qr_app') && (
            <div style={{ flexBasis: '100%', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="input" style={{ flex: '1 1 200px' }} maxLength={80} placeholder="Tiêu đề" value={t.tieu_de || ''} onChange={(e) => sua(i, 'tieu_de', e.target.value)} />
              <textarea className="input" style={{ flex: '2 1 300px' }} maxLength={500} rows={2} placeholder="Nội dung" value={t.noi_dung || ''} onChange={(e) => sua(i, 'noi_dung', e.target.value)} />
            </div>
          )}
        </div>
      ))}
      <div style={{ ...hang, gap: 6 }}>
        <Plus size={14} />
        {['menu', 'flash', 'qr_app', 'chu'].map((l) => <button key={l} className="btn btn-outline" onClick={() => them(l)}>{LOAI[l].split(' (')[0]}</button>)}
      </div>

      <div style={{ ...hang, flexDirection: 'column', alignItems: 'stretch' }}>
        <label style={{ fontWeight: 600 }}>Địa chỉ App khách (mã QR ở trang “QR tải App”)</label>
        <input className="input" maxLength={300} placeholder="https://…" value={diaChi} onChange={(e) => setDiaChi(e.target.value)} />
      </div>
      <label style={{ ...hang, fontWeight: 500 }}>
        <input type="checkbox" checked={hienTen} onChange={(e) => setHienTen(e.target.checked)} />
        Hiện tên khách trên màn khách lúc thu (chỉ khi nhân viên đã chọn khách; không bao giờ hiện số điện thoại, số dư, điểm)
      </label>
      <div style={{ marginTop: '0.5rem' }}>
        <button className="btn btn-primary" onClick={luu} disabled={dangLuu || taiLoi}><Save size={16} /> {dangLuu ? 'Đang lưu…' : 'Lưu'}</button>
        <LoiO loi={loiO.luu} />
      </div>
      <ThanhLuu id="man-khach" coDoi={coDoi} dangLuu={dangLuu} onLuu={luu} onBo={tai} />

      <div style={{ fontWeight: 600, marginTop: '1.5rem' }}>Màn khách đã ghép</div>
      <LoiO loi={loiO.may} />
      {may.length === 0 && <div style={{ color: '#6b7280', padding: '0.5rem 0' }}>Chưa ghép màn nào.</div>}
      {may.map((m) => (
        <div key={m.id} style={hang}>
          <div style={{ flex: 1 }}>{m.ten} <span style={{ color: '#6b7280', fontSize: 12 }}>· ghép lúc {String(m.tao_luc).replace('T', ' ')}</span></div>
          <button className="btn btn-outline" disabled={dangLuu} onClick={() => thuHoi(m)}>Thu hồi</button>
        </div>
      ))}
    </>
  );
}
