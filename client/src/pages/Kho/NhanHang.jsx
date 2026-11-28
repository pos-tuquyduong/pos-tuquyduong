/**
 * KHO-2b — Nhận hàng: "Theo đơn" (đơn đã duyệt còn mở → bảng tick từng dòng, "Nhận đủ tất cả", sửa số thực nhận — lệch số đặt tô vàng, thêm dòng
 * ngoài đơn) hoặc "Mua lẻ". Mỗi dòng: hạn (trống = máy chủ tự điền theo hạn nguyên liệu), giá nhập thật.
 * KHO-GON-2 (bản thử chủ quán duyệt 26.11): mua lẻ / ngoài đơn = MỘT danh sách, mỗi nguyên liệu một dòng (tick · tên · "Có x" — đỏ "thấp" khi dưới ngưỡng ·
 * ô số khi tick), ô tìm, sắp hết & hay mua lên đầu. E1 (chủ quán 27.11): gửi là CỘNG KHO NGAY — người nhận chịu trách nhiệm. B2: "Chụp hoá đơn" (không
 * bắt buộc, tối đa 3) — thu nhỏ ở máy (anh.js), gửi SAU khi lưu phiếu; ảnh lỗi thì phiếu vẫn còn, gắn lại ở chi tiết phiếu.
 */
import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { baoXong, baoLoiTu } from '../../components/thongBaoKho.js';   // BAO-1a
import { so, gio, maGuiMoi, veLuu, raHien, boDau } from './chung';
import { thuNhoAnh, guiAnhPhieu, ANH_HOA_DON, SO_ANH_HOA_DON, kb, mb } from './anh';

const dongMoi = (n, datHien = null) => ({ nguyen_lieu_id: n.id, ten: n.ten, don_vi: n.don_vi, don_vi_luu: n.don_vi_luu, he_so_doi: n.he_so_doi, dat: datHien,
  tick: datHien == null, nhan: datHien == null ? '' : String(datHien), gia: '', han: '' });

export default function NhanHang({ moPhieu }) {
  const [gy, setGy] = useState(null);
  const [cheDo, setCheDo] = useState(null);   // null | 'don' | 'le'
  const [don, setDon] = useState(null);
  const [dong, setDong] = useState([]);
  const [themNgoai, setThemNgoai] = useState(false);
  const [tim, setTim] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const [anh, setAnh] = useState([]);   // [{ khoi (Blob đã thu nhỏ), goc (byte ảnh gốc) }]
  const [loi, setLoi] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [maGui, setMaGui] = useState(maGuiMoi);

  useEffect(() => { api.get('/kho/goi-y-nhap').then(setGy).catch((e) => setLoi(e.message)); }, []);
  if (!gy) return loi ? <div className="kho-loi">{loi}</div> : <p>Đang tải…</p>;
  const nl = gy.nguyen_lieu.map((n) => ({ ...n, don_vi: n.don_vi_hien || n.don_vi_luu }));
  const theoId = new Map(nl.map((n) => [n.id, n]));

  const batDau = (che, d = null) => {
    setCheDo(che); setDon(d); setThemNgoai(false); setTim(''); setMaGui(maGuiMoi());
    setDong(d ? d.con_lai.filter((x) => x.con_lai > 0 && theoId.has(x.nguyen_lieu_id))
      .map((x) => dongMoi(theoId.get(x.nguyen_lieu_id), raHien(x.con_lai, theoId.get(x.nguyen_lieu_id).he_so_doi))) : []);
  };
  const doi = (i, them) => setDong(dong.map((d, j) => (j === i ? { ...d, ...them } : d)));
  const coLe = (id) => dong.some((d) => d.nguyen_lieu_id === id && d.dat == null);
  const chon = (n) => (coLe(n.id) ? setDong(dong.filter((d) => !(d.nguyen_lieu_id === n.id && d.dat == null))) : setDong([...dong, dongMoi(n)]));
  const gui = dong.filter((d) => d.tick);
  const hopLe = gui.length && gui.every((d) => Number(d.nhan) > 0);
  const chupAnh = async (e) => {
    const tep = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!tep || anh.length >= SO_ANH_HOA_DON) return;
    try {
      const khoi = await thuNhoAnh(tep, ANH_HOA_DON);
      if (!khoi) throw new Error('Máy này không thu nhỏ được ảnh — thử ảnh khác');
      setAnh((a) => [...a, { khoi, goc: tep.size }]);
    } catch (err) { baoLoiTu('thu nhỏ ảnh hoá đơn', err); }
  };
  const nhan = async () => {
    setDangGui(true);
    let r;
    try {
      r = await api.post('/kho/phieu-nhan', { don_id: don?.id ?? null, ghi_chu: ghiChu, ma_gui: maGui, nha_cung_cap_id: don?.nha_cung_cap_id ?? null,
        dong: gui.map((d) => ({ nguyen_lieu_id: d.nguyen_lieu_id, luong: veLuu(d.nhan, d.he_so_doi), don_gia: d.gia === '' ? null : Number(d.gia), han_dung: d.han || null })) });
      baoXong('Đã nhận hàng — kho đã cộng');
    } catch (e) { baoLoiTu('ghi phiếu nhận hàng', e); setDangGui(false); return; }
    for (const a of anh) {   // phiếu đã lưu — ảnh lỗi không làm mất phiếu; gắn lại ở chi tiết phiếu
      try { await guiAnhPhieu(r.phieu.id, a.khoi); } catch (e) { baoLoiTu('gửi ảnh hoá đơn (gắn lại ở chi tiết phiếu)', e); break; }
    }
    moPhieu(r.phieu.id);
  };

  const oNhap = (d, i) => (
    <>
      <input className="input kho-hep" type="number" min="0" step="any" inputMode="decimal" placeholder={d.don_vi} value={d.nhan}
        onChange={(e) => doi(i, { nhan: e.target.value, tick: true })} />
      <input className="input kho-hep" type="number" min="0" step="1" inputMode="numeric" placeholder={`đ/${d.don_vi_luu}`} title={`Giá nhập: đồng cho 1 ${d.don_vi_luu}`} value={d.gia} onChange={(e) => doi(i, { gia: e.target.value })} />
      <input className="input kho-hep" type="date" title="Hạn dùng (trống = tự tính)" value={d.han} onChange={(e) => doi(i, { han: e.target.value })} />
    </>
  );
  // Danh sách một dòng một thứ: dưới ngưỡng → hay mua → còn lại; gõ tên lọc (không dấu)
  const t = boDau(tim.trim());
  const hang = (n) => (n.duoi_toi_thieu ? 0 : gy.hay_mua.includes(n.id) ? 1 : 2);
  const dsLe = nl.filter((n) => !t || boDau(n.ten).includes(t)).sort((a, b) => hang(a) - hang(b) || a.ten.localeCompare(b.ten, 'vi'));
  const danhSach = (
    <div>
      <input className="input" placeholder="Tìm nguyên liệu (gõ không dấu được)" value={tim} onChange={(e) => setTim(e.target.value)} style={{ width: '100%', marginBottom: '0.5rem' }} />
      {!dsLe.length && <p className="kho-nho">Không thấy nguyên liệu nào.</p>}
      {dsLe.map((n) => {
        const i = dong.findIndex((d) => d.nguyen_lieu_id === n.id && d.dat == null);
        return (
          <div key={n.id} className={`kho-dong ${i >= 0 ? 'kho-chon' : ''}`} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.35rem' }}>
            <input type="checkbox" className="kho-o-tick" checked={i >= 0} onChange={() => chon(n)} aria-label={`Chọn ${n.ten}`} />
            <span style={{ flex: '1 1 8rem' }} onClick={() => chon(n)}><b>{n.ten}</b>
              <span className={`kho-nho ${n.duoi_toi_thieu ? 'kho-thieu' : ''}`}> · Có {so(n.ton_hien)} {n.don_vi}{n.duoi_toi_thieu && ' · thấp'}</span></span>
            {i >= 0 && oNhap(dong[i], i)}
          </div>
        );
      })}
    </div>
  );
  const dongDon = dong.map((d, i) => (d.dat == null ? null : (
    <div key={`${d.nguyen_lieu_id}-${i}`} className={`kho-dong ${d.tick && Math.abs(Number(d.nhan) - d.dat) > 1e-9 ? 'kho-vang' : ''}`} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.35rem' }}>
      <input type="checkbox" className="kho-o-tick" checked={d.tick} onChange={() => doi(i, { tick: !d.tick })} />
      <b style={{ flex: '1 1 8rem' }}>{d.ten}<span className="kho-nho"> · đặt {so(d.dat)} {d.don_vi}</span></b>
      {oNhap(d, i)}
    </div>
  )));

  if (!cheDo) {
    return (
      <div className="kho-nhan">
        <div className="kho-buoc"><button className="btn btn-outline" onClick={() => batDau('le')}>🛒 Mua lẻ (không có đơn)</button></div>
        <h4 className="kho-muc">Nhận theo đơn ({gy.don_mo.length})</h4>
        {!gy.don_mo.length && <p className="kho-nho">Không có đơn đặt hàng nào đang chờ nhận.</p>}
        <div className="kho-luoi">
          {gy.don_mo.map((d) => (
            <div key={d.id} className="kho-the" onClick={() => batDau('don', d)}>
              <b>{d.so_phieu}</b>
              <div className="kho-nho">{gio(d.tao_luc)} · còn {d.con_lai.filter((x) => x.con_lai > 0).length} món</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="kho-nhan">
      <div className="kho-hang"><button className="btn btn-outline" onClick={() => setCheDo(null)}>← Quay lại</button><b>{don ? `Nhận theo đơn ${don.so_phieu}` : 'Mua lẻ'}</b></div>
      {don && (
        <>
          <button className="btn btn-primary" onClick={() => setDong(dong.map((d) => (d.dat != null ? { ...d, tick: true, nhan: String(d.dat) } : d)))}>✓ Nhận đủ tất cả</button>
          {dongDon}
          <button className="kho-lien-ket" style={{ margin: '0.5rem 0' }} onClick={() => setThemNgoai(!themNgoai)}>{themNgoai ? 'Xong thêm' : '+ Thêm dòng ngoài đơn'}</button>
        </>
      )}
      {(!don || themNgoai) && danhSach}
      <div className="kho-nho">Giá: đồng cho 1 đơn vị lưu (kg, lít…) · Hạn trống = máy chủ tự tính theo hạn của nguyên liệu</div>
      <input className="input" placeholder="Số hoá đơn / ghi chú" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} style={{ width: '100%', marginTop: '0.75rem' }} />
      <div className="kho-anh-hd">
        {anh.map((a, i) => (
          <span key={i} className="kho-nho">📄 ≈ {kb(a.khoi.size)} (gốc {mb(a.goc)}) <button className="kho-lien-ket" onClick={() => setAnh(anh.filter((_, j) => j !== i))}>Bỏ</button></span>
        ))}
        {anh.length < SO_ANH_HOA_DON && (
          <label className="btn btn-outline">📷 Chụp hoá đơn{anh.length ? ` (${anh.length}/${SO_ANH_HOA_DON})` : ''}
            <input type="file" accept="image/*" capture="environment" onChange={chupAnh} style={{ display: 'none' }} /></label>
        )}
      </div>
      <div className="kho-chan">
        <button className="btn btn-primary kho-nut-lon" disabled={dangGui || !hopLe} onClick={nhan}>
          {dangGui ? 'Đang gửi…' : `Nhận hàng (${gui.length} dòng) — cộng kho ngay`}
        </button>
      </div>
    </div>
  );
}
