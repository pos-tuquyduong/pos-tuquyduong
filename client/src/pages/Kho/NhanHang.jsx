/**
 * KHO-2b — Nhận hàng: "Theo đơn" (đơn đã duyệt còn mở → bảng tick từng dòng, "Nhận đủ tất cả", sửa số thực nhận — lệch số đặt tô vàng, thêm dòng
 * ngoài đơn) hoặc "Mua lẻ" (bộ chọn ô chạm). Mỗi dòng: hạn (trống = máy chủ tự điền theo hạn nguyên liệu), giá nhập thật. Gửi → phiếu chờ người KHÁC
 * duyệt; chỉ khi duyệt mới cộng kho. Ảnh hoá đơn hoãn (chủ quán 31.10) — ghi số hoá đơn vào ô ghi chú.
 */
import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import ChonNguyenLieu from './ChonNguyenLieu';
import { so, gio, maGuiMoi, veLuu, raHien } from './chung';

const dongMoi = (n, datHien = null) => ({ nguyen_lieu_id: n.id, ten: n.ten, don_vi: n.don_vi, don_vi_luu: n.don_vi_luu, he_so_doi: n.he_so_doi, dat: datHien,
  tick: datHien == null, nhan: datHien == null ? '' : String(datHien), gia: '', han: '' });

export default function NhanHang({ moPhieu }) {
  const [gy, setGy] = useState(null);
  const [cheDo, setCheDo] = useState(null);   // null | 'don' | 'le'
  const [don, setDon] = useState(null);
  const [dong, setDong] = useState([]);
  const [themNgoai, setThemNgoai] = useState(false);
  const [ghiChu, setGhiChu] = useState('');
  const [loi, setLoi] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [maGui, setMaGui] = useState(maGuiMoi);

  useEffect(() => { api.get('/kho/goi-y-nhap').then(setGy).catch((e) => setLoi(e.message)); }, []);
  if (!gy) return loi ? <div className="kho-loi">{loi}</div> : <p>Đang tải…</p>;
  const nl = gy.nguyen_lieu.map((n) => ({ ...n, don_vi: n.don_vi_hien || n.don_vi_luu }));
  const theoId = new Map(nl.map((n) => [n.id, n]));

  const batDau = (che, d = null) => {
    setCheDo(che); setDon(d); setThemNgoai(false); setMaGui(maGuiMoi());
    setDong(d ? d.con_lai.filter((x) => x.con_lai > 0 && theoId.has(x.nguyen_lieu_id))
      .map((x) => dongMoi(theoId.get(x.nguyen_lieu_id), raHien(x.con_lai, theoId.get(x.nguyen_lieu_id).he_so_doi))) : []);
  };
  const doi = (i, them) => setDong(dong.map((d, j) => (j === i ? { ...d, ...them } : d)));
  const chon = (n) => (dong.some((d) => d.nguyen_lieu_id === n.id && d.dat == null)
    ? setDong(dong.filter((d) => !(d.nguyen_lieu_id === n.id && d.dat == null))) : setDong([...dong, dongMoi(n)]));
  const gui = dong.filter((d) => d.tick);
  const hopLe = gui.length && gui.every((d) => Number(d.nhan) > 0);
  const nhan = async () => {
    setLoi(''); setDangGui(true);
    try {
      const r = await api.post('/kho/phieu-nhan', { don_id: don?.id ?? null, ghi_chu: ghiChu, ma_gui: maGui, nha_cung_cap_id: don?.nha_cung_cap_id ?? null,
        dong: gui.map((d) => ({ nguyen_lieu_id: d.nguyen_lieu_id, luong: veLuu(d.nhan, d.he_so_doi), don_gia: d.gia === '' ? null : Number(d.gia), han_dung: d.han || null })) });
      moPhieu(r.phieu.id);
    } catch (e) { setLoi(e.message); setDangGui(false); }
  };

  const bangDong = (
    <div>
      {dong.map((d, i) => {
        const lech = d.dat != null && d.tick && Math.abs(Number(d.nhan) - d.dat) > 1e-9;
        return (
          <div key={`${d.nguyen_lieu_id}-${i}`} className={`kho-dong ${lech ? 'kho-vang' : ''}`} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.35rem' }}>
            {d.dat != null && <input type="checkbox" checked={d.tick} onChange={() => doi(i, { tick: !d.tick })} />}
            <b style={{ flex: '1 1 8rem' }}>{d.ten}{d.dat != null ? <span className="kho-nho"> · đặt {so(d.dat)} {d.don_vi}</span> : don && <span className="kho-nho"> · ngoài đơn</span>}</b>
            <input className="input kho-hep" type="number" min="0" step="any" inputMode="decimal" placeholder={d.don_vi} value={d.nhan}
              onChange={(e) => doi(i, { nhan: e.target.value, tick: true })} />
            <input className="input kho-hep" type="number" min="0" step="1" inputMode="numeric" placeholder={`đ/${d.don_vi_luu}`} title={`Giá nhập: đồng cho 1 ${d.don_vi_luu}`} value={d.gia} onChange={(e) => doi(i, { gia: e.target.value })} />
            <input className="input kho-hep" type="date" title="Hạn dùng (trống = tự tính)" value={d.han} onChange={(e) => doi(i, { han: e.target.value })} />
            {d.dat == null && <button className="kho-lien-ket" onClick={() => setDong(dong.filter((_, j) => j !== i))}>Bỏ</button>}
          </div>
        );
      })}
      <div className="kho-nho">Giá: đồng cho 1 đơn vị lưu (kg, lít…) · Hạn trống = máy chủ tự tính theo hạn của nguyên liệu</div>
    </div>
  );

  if (!cheDo) {
    return (
      <div>
        {loi && <div className="kho-loi">{loi}</div>}
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
    <div>
      <div className="kho-hang"><button className="btn btn-outline" onClick={() => setCheDo(null)}>← Quay lại</button><b>{don ? `Nhận theo đơn ${don.so_phieu}` : 'Mua lẻ'}</b></div>
      {don && (
        <>
          <button className="btn btn-primary" onClick={() => setDong(dong.map((d) => (d.dat != null ? { ...d, tick: true, nhan: String(d.dat) } : d)))}>✓ Nhận đủ tất cả</button>
          {bangDong}
          <button className="kho-lien-ket" style={{ margin: '0.5rem 0' }} onClick={() => setThemNgoai(!themNgoai)}>{themNgoai ? 'Xong thêm' : '+ Thêm dòng ngoài đơn'}</button>
        </>
      )}
      {(!don || themNgoai) && (
        <ChonNguyenLieu ds={nl} nhom={gy.nhom} hayMua={gy.hay_mua} daChon={dong.filter((d) => d.dat == null).map((d) => d.nguyen_lieu_id)} chon={chon}>
          {!don && bangDong}
        </ChonNguyenLieu>
      )}
      <input className="input" placeholder="Số hoá đơn / ghi chú" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} style={{ width: '100%', marginTop: '0.75rem' }} />
      {loi && <div className="kho-loi">{loi}</div>}
      <button className="btn btn-primary kho-nut-lon" disabled={dangGui || !hopLe} onClick={nhan}>
        {dangGui ? 'Đang gửi…' : `Gửi phiếu nhận (${gui.length} dòng) — chờ người khác duyệt`}
      </button>
    </div>
  );
}
