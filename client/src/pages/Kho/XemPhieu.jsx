/**
 * KHO-2a — xem / duyệt / in một phiếu xuất. A tổng cần lấy (ô ☐) · B định lượng từng công thức ngay dưới tên món (cả mẻ + 1 phần) ·
 * C kết quả (✓ một chạm / sửa số + ghi chú; vàng khi lệch quá ngưỡng; "tự chốt" khi qua ngày). Mọi số do máy chủ trả — ở đây chỉ hiện.
 * In: POST /in đếm lần (lần ≥ 2 in "IN LẠI · LẦN n") rồi window.print(); máy in lỗi không đụng sổ. Phiếu chờ duyệt tự làm mới 15 s.
 */
import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { so, tien, gio, TRANG_THAI } from './chung';

const LAM_MOI_MS = 15000;
const KHO_IN = { k80: '@page { size: 80mm auto; margin: 3mm; }', a4: '@page { size: A4; margin: 12mm; }' };
const luong = (n) => `${so(n.luong_hien)} ${n.don_vi || ''}`;

export default function XemPhieu({ id, vaiTro, tenDangNhap, moPhieu, dong }) {
  const [dl, setDl] = useState(null);
  const [loi, setLoi] = useState('');
  const [dangGhi, setDangGhi] = useState(false);
  const [kho, setKho] = useState(null);   // khổ đang in: k80 | a4
  const [nhap, setNhap] = useState({});   // san_pham_id → { so_thuc, ghi_chu } đang sửa
  const [sua, setSua] = useState(null);   // chủ quán sửa: san_pham_id → số phần

  const tai = () => api.get(`/kho/phieu/${id}`).then(setDl).catch((e) => setLoi(e.message));
  useEffect(() => { setDl(null); tai(); }, [id]);
  useEffect(() => {
    if (dl?.phieu.trang_thai !== 'cho_duyet') return undefined;
    const t = setInterval(tai, LAM_MOI_MS);
    return () => clearInterval(t);
  }, [dl?.phieu.trang_thai, id]);
  useEffect(() => {
    if (!kho) return undefined;
    const kieu = document.createElement('style');
    kieu.textContent = KHO_IN[kho];
    document.head.appendChild(kieu);
    const xong = () => setKho(null);
    window.addEventListener('afterprint', xong);
    window.print();
    return () => { window.removeEventListener('afterprint', xong); kieu.remove(); };
  }, [kho]);

  const ghi = async (lam) => {
    setLoi('');
    setDangGhi(true);
    try { const r = await lam(); if (r?.phieu) setDl(r); return r; } catch (e) { setLoi(e.message); return null; } finally { setDangGhi(false); }
  };
  const hoiLyDo = (cau) => { const l = window.prompt(cau); return l && l.trim() ? l.trim() : null; };
  const tuChoi = () => { const l = hoiLyDo('Lý do từ chối?'); if (l) ghi(() => api.post(`/kho/phieu/${id}/tu-choi`, { ly_do: l })); };
  const huy = () => { const l = hoiLyDo('Lý do huỷ phiếu?'); if (l) ghi(() => api.post(`/kho/phieu/${id}/huy`, { ly_do: l })); };
  const luuSua = async () => {
    const l = hoiLyDo('Lý do sửa phiếu?');
    if (!l) return;
    const r = await ghi(() => api.post(`/kho/phieu/${id}/sua`, { ly_do: l, mon: Object.entries(sua).map(([sp, sl]) => ({ san_pham_id: Number(sp), so_phan: Number(sl) })) }));
    if (r?.phieu) { setSua(null); moPhieu(r.phieu.id); }
  };
  const inRa = async (k) => { if (await ghi(() => api.post(`/kho/phieu/${id}/in`))) setKho(k); };
  const ketQua = (m, than) => ghi(async () => {
    const r = await api.post(`/kho/phieu/${id}/ket-qua`, { san_pham_id: m.san_pham_id, ...than });
    setNhap((n) => { const moi = { ...n }; delete moi[m.san_pham_id]; return moi; });
    return r;
  });

  if (!dl) return <div>{loi ? <div className="kho-loi">{loi}</div> : 'Đang tải…'}<button className="btn btn-outline" onClick={dong}>Quay lại</button></div>;
  const p = dl.phieu;
  const quanLy = vaiTro === 'owner' || vaiTro === 'manager';
  const chuQuan = vaiTro === 'owner';
  const daDuyet = p.trang_thai === 'da_duyet';

  return (
    <div>
      <div className={`kho-in ${kho === 'k80' ? 'kho-in-80' : ''}`}>
        <h3 className="card-title">{p.so_phieu} · {TRANG_THAI[p.trang_thai]}</h3>
        {p.so_lan_in >= 2 && kho && <div className="kho-in-lai">IN LẠI · LẦN {p.so_lan_in}</div>}
        <div className="kho-nho">
          Tạo: {p.nguoi_tao} · {gio(p.tao_luc)}{p.nguoi_duyet && ` — ${p.trang_thai === 'huy' && !p.thay_bang_id ? 'Từ chối' : 'Duyệt'}: ${p.nguoi_duyet} · ${gio(p.duyet_luc)}`}
        </div>
        {p.ly_do && <div className="kho-nho">Lý do: {p.ly_do}</div>}
        {p.thay_cho_id && <div className="kho-nho kho-khong-in"><button className="kho-lien-ket" onClick={() => moPhieu(p.thay_cho_id)}>Thay cho phiếu cũ</button></div>}
        {p.thay_bang_id && <div className="kho-canh kho-khong-in">Phiếu đã được sửa — <button onClick={() => moPhieu(p.thay_bang_id)}>xem phiếu thay</button></div>}

        <h4 className="kho-muc">A · Tổng cần lấy</h4>
        {dl.tong.map((n) => (
          <div key={n.nguyen_lieu_id} className={`kho-dong ${n.am ? 'kho-am' : ''}`}>
            <span className="kho-o">☐</span><span style={{ flex: 1 }}>{n.ten}</span><b>{luong(n)}</b>
            {n.am && <span className="kho-khong-in"> · tồn âm</span>}
            {n.don_gia != null && <span className="kho-nho kho-khong-in"> · {tien(n.don_gia)}</span>}
          </div>
        ))}

        <h4 className="kho-muc">B · Định lượng từng công thức</h4>
        {dl.theo_mon.map((m) => (
          <div key={m.san_pham_id} className="kho-mon">
            <b>{m.ten} — {so(m.so_phan)} phần</b>{m.han_dung && <span className="kho-nho"> · hạn {gio(m.han_dung)}</span>}
            {m.gia_von != null && <span className="kho-nho kho-khong-in"> · giá vốn {tien(m.gia_von)}/phần</span>}
            {m.nguyen_lieu.map((n) => (
              <div key={n.nguyen_lieu_id} className="kho-dong"><span style={{ flex: 1 }}>{n.ten}</span><b>{luong(n)}</b>
                <span className="kho-nho"> · 1 phần {so(n.mot_phan_hien)} {n.don_vi}</span></div>
            ))}
          </div>
        ))}

        {daDuyet && <h4 className="kho-muc">C · Kết quả</h4>}
        {daDuyet && dl.theo_mon.map((m) => {
          const k = m.ket_qua;
          const n = nhap[m.san_pham_id];
          return (
            <div key={m.san_pham_id} className={`kho-dong ${k?.lech ? 'kho-lech' : ''}`}>
              <span style={{ flex: 1 }}>{m.ten} (chuẩn {so(m.so_phan)})</span>
              {kho && <span>Thực ra: ________</span>}
              {!kho && k?.trang_thai === 'da_dien' && <span>✓ {so(k.so_thuc ?? m.so_phan)}{k.ghi_chu && ` · ${k.ghi_chu}`}{k.nguoi && ` · ${k.nguoi} ${gio(k.luc)}`}{k.lech && ' · lệch quá ngưỡng'}</span>}
              {!kho && k?.trang_thai === 'tu_chot' && <span className="kho-nho">tự chốt (đúng chuẩn)</span>}
              {!kho && k?.trang_thai === 'cho_dien' && !n && (
                <span className="kho-hang" style={{ margin: 0 }}>
                  <button className="btn btn-sm btn-primary" disabled={dangGhi} onClick={() => ketQua(m, {})}>✓ Đúng chuẩn</button>
                  <button className="btn btn-sm btn-outline" onClick={() => setNhap({ ...nhap, [m.san_pham_id]: { so_thuc: String(m.so_phan), ghi_chu: '' } })}>Khác</button>
                </span>
              )}
              {!kho && n && (
                <span className="kho-hang" style={{ margin: 0 }}>
                  <input className="input" type="number" min="0" step="any" inputMode="decimal" style={{ maxWidth: '5rem' }} value={n.so_thuc}
                    onChange={(e) => setNhap({ ...nhap, [m.san_pham_id]: { ...n, so_thuc: e.target.value } })} />
                  <input className="input" placeholder="Ghi chú" value={n.ghi_chu} onChange={(e) => setNhap({ ...nhap, [m.san_pham_id]: { ...n, ghi_chu: e.target.value } })} />
                  <button className="btn btn-sm btn-primary" disabled={dangGhi || !(Number(n.so_thuc) >= 0) || n.so_thuc === ''} onClick={() => ketQua(m, n)}>Lưu</button>
                </span>
              )}
            </div>
          );
        })}
        {kho && <div className="kho-nho" style={{ marginTop: '0.6rem' }}>Người lấy hàng: ________ · Người pha: ________</div>}
      </div>

      {loi && <div className="kho-loi">{loi}</div>}
      {sua && (
        <div className="card kho-khong-in" style={{ padding: '0.75rem', marginTop: '0.75rem' }}>
          {dl.theo_mon.map((m) => (
            <div key={m.san_pham_id} className="kho-dong"><span style={{ flex: 1 }}>{m.ten}</span>
              <input className="input" type="number" min="0" step="any" style={{ maxWidth: '6rem' }} value={sua[m.san_pham_id]}
                onChange={(e) => setSua({ ...sua, [m.san_pham_id]: e.target.value })} /> phần</div>
          ))}
          <div className="kho-hang"><button className="btn btn-primary" disabled={dangGhi} onClick={luuSua}>Lưu thành phiếu mới</button>
            <button className="btn btn-outline" onClick={() => setSua(null)}>Thôi</button></div>
        </div>
      )}
      <div className="kho-hang kho-khong-in" style={{ marginTop: '1rem' }}>
        {p.trang_thai === 'cho_duyet' && !quanLy && <span className="kho-thieu">Chờ quản lý duyệt — màn tự làm mới</span>}
        {p.trang_thai === 'cho_duyet' && quanLy && p.nguoi_tao !== tenDangNhap && (
          <>
            <button className="btn btn-primary" disabled={dangGhi} onClick={() => ghi(() => api.post(`/kho/phieu/${id}/duyet`))}>Duyệt</button>
            <button className="btn btn-outline" disabled={dangGhi} onClick={tuChoi}>Từ chối</button>
          </>
        )}
        {daDuyet && <button className="btn btn-outline" disabled={dangGhi} onClick={() => inRa('k80')}>In 80 mm</button>}
        {daDuyet && <button className="btn btn-outline" disabled={dangGhi} onClick={() => inRa('a4')}>In A4</button>}
        {chuQuan && p.loai === 'PX' && ['cho_duyet', 'da_duyet'].includes(p.trang_thai) && !sua && (
          <>
            <button className="btn btn-outline" onClick={() => setSua(Object.fromEntries(dl.theo_mon.map((m) => [m.san_pham_id, String(m.so_phan)])))}>Sửa</button>
            <button className="btn btn-outline" disabled={dangGhi} onClick={huy}>Huỷ phiếu</button>
          </>
        )}
        <button className="btn btn-outline" onClick={dong}>Quay lại</button>
      </div>
    </div>
  );
}
