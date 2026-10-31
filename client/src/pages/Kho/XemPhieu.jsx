/**
 * KHO-2a — xem / duyệt / in một phiếu xuất. A tổng cần lấy (ô ☐) · B định lượng từng công thức ngay dưới tên món (cả mẻ + 1 phần) ·
 * C kết quả (✓ một chạm / sửa số + ghi chú; vàng khi lệch quá ngưỡng; "tự chốt" khi qua ngày). Mọi số do máy chủ trả — ở đây chỉ hiện.
 * In: POST /in đếm lần (lần ≥ 2 in "IN LẠI · LẦN n") rồi window.print(); máy in lỗi không đụng sổ. Phiếu chờ duyệt tự làm mới 15 s.
 * KHO-2b: DH / PN / PS hiện bảng dòng (BangDong) thay cho A/B/C; đơn vượt hạn mức chỉ chủ quán thấy nút Duyệt; chủ quán sửa số từng dòng.
 */
import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { so, tien, gio, TRANG_THAI, SU_CO, veLuu } from './chung';
import { docInPhieuKho, thuTuNutIn } from '../../utils/inPhieu';

const LAM_MOI_MS = 15000;
// KHO-IN-1: khổ giấy theo tên khổ của KHO_PHIEU_KHO (utils/inPhieu.js); khổ mặc định của từng loại do Cài đặt in phiếu quyết định.
const KHO_IN = { '80mm': '@page { size: 80mm auto; margin: 3mm; }', a5: '@page { size: A5; margin: 8mm; }', a4: '@page { size: A4; margin: 12mm; }' };
const NHAN_NUT_IN = { '80mm': 'In 80 mm', a5: 'In A5', a4: 'In A4' };
const luong = (n) => `${so(n.luong_hien)} ${n.don_vi || ''}`;
const TEN_LOAI = { DH: 'Đơn đặt hàng', PN: 'Phiếu nhận hàng', PS: 'Phiếu xử lý phát sinh' };

/** KHO-2b: bảng dòng của DH / PN / PS — dòng lệch đơn / ngoài đơn tô vàng (cờ máy chủ); đơn đã duyệt kèm phần còn chờ nhận. */
function BangDong({ dl, kho }) {
  const p = dl.phieu;
  return (
    <>
      <div className="kho-nho">{TEN_LOAI[p.loai]}{p.su_co && ` · ${SU_CO[p.su_co]}`}{p.ghi_chu && ` · ${p.ghi_chu}`}
        {p.tong_uoc_tinh != null && <span className="kho-khong-in"> · ước tính {tien(p.tong_uoc_tinh)}</span>}</div>
      {p.can_chu_quan && <div className="kho-canh kho-khong-in">Vượt hạn mức đặt hàng — chỉ chủ quán duyệt</div>}
      {dl.dong.map((d) => (
        <div key={d.id} className={`kho-dong ${d.lech || d.ngoai_don ? 'kho-vang' : ''}`}>
          {p.loai === 'DH' && <span className="kho-o">☐</span>}
          <span style={{ flex: 1 }}>{d.ten}{d.ngoai_don && ' · ngoài đơn'}{d.han_dung && <span className="kho-nho"> · hạn {gio(d.han_dung)}</span>}</span>
          <b>{luong(d)}</b>
          {d.don_gia != null && <span className="kho-nho kho-khong-in"> · {tien(d.don_gia)}</span>}
        </div>
      ))}
      {dl.con_lai && !kho && (
        <div className="kho-khong-in">
          <h4 className="kho-muc">Còn chờ nhận</h4>
          {dl.con_lai.every((d) => d.con_lai <= 1e-9) && <div className="kho-ok">Đã nhận đủ — đơn đóng</div>}
          {dl.con_lai.filter((d) => d.con_lai > 1e-9).map((d) => (
            <div key={d.nguyen_lieu_id} className="kho-dong"><span style={{ flex: 1 }}>{d.ten}</span><b>{so(d.con_lai_hien)} / {so(d.dat_hien)} {d.don_vi}</b></div>
          ))}
        </div>
      )}
    </>
  );
}

/** Thân sửa theo loại: số mới từng dòng (đơn vị hiện) → đúng dạng thân của đường tạo phiếu loại đó. */
function thanSua(dl, sua) {
  const p = dl.phieu;
  const dong = dl.dong.filter((d) => Number(sua[d.id]) > 0).map((d) => ({ ...d, moi: veLuu(sua[d.id], d.luong / d.luong_hien || 1) }));
  if (p.loai === 'DH') return { nguyen_lieu: dong.map((d) => ({ nguyen_lieu_id: d.nguyen_lieu_id, luong: d.moi })) };
  if (p.loai === 'PN') return { dong: dong.map((d) => ({ nguyen_lieu_id: d.nguyen_lieu_id, luong: d.moi, don_gia: d.don_gia ?? null, han_dung: d.han_dung })) };
  return { su_co: p.su_co, ghi_chu: p.ghi_chu, muc: dong.map((d) => (p.su_co === 'het_han' && d.lo_id ? { lo_id: d.lo_id, luong: d.moi }
    : d.nguyen_lieu_id ? { nguyen_lieu_id: d.nguyen_lieu_id, luong: d.moi, cho_mon_id: d.cho_mon_id } : { san_pham_id: d.san_pham_id, luong: d.moi })) };
}

export default function XemPhieu({ id, vaiTro, tenDangNhap, moPhieu, dong }) {
  const [dl, setDl] = useState(null);
  const [loi, setLoi] = useState('');
  const [dangGhi, setDangGhi] = useState(false);
  const [kho, setKho] = useState(null);   // khổ đang in: 80mm | a5 | a4
  const [caiDat, setCaiDat] = useState({});   // khổ + số bản mặc định (in_phieu_*); không tải được → mặc định 80mm, 1 bản
  const [nhap, setNhap] = useState({});   // san_pham_id → { so_thuc, ghi_chu } đang sửa
  const [sua, setSua] = useState(null);   // chủ quán sửa: san_pham_id → số phần

  const tai = () => api.get(`/kho/phieu/${id}`).then(setDl).catch((e) => setLoi(e.message));
  useEffect(() => { setDl(null); tai(); }, [id]);
  useEffect(() => { api.get('/settings').then((r) => setCaiDat(r.data || {})).catch(() => {}); }, []);
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
    const than = dl.phieu.loai === 'PX' ? { mon: Object.entries(sua).map(([sp, sl]) => ({ san_pham_id: Number(sp), so_phan: Number(sl) })) } : thanSua(dl, sua);
    const r = await ghi(() => api.post(`/kho/phieu/${id}/sua`, { ly_do: l, ...than }));
    if (r?.phieu) { setSua(null); moPhieu(r.phieu.id); }
  };
  const inRa = async (k) => { if (await ghi(() => api.post(`/kho/phieu/${id}/in`))) setKho(k); };
  const ketQua = (m, than) => ghi(async () => {
    const r = await api.post(`/kho/phieu/${id}/ket-qua`, { san_pham_id: m.san_pham_id, ...than });
    setNhap((n) => { const moi = { ...n }; delete moi[m.san_pham_id]; return moi; });
    return r;
  });

  const mac = docInPhieuKho(caiDat, dl?.phieu.loai);
  if (!dl) return <div>{loi ? <div className="kho-loi">{loi}</div> : 'Đang tải…'}<button className="btn btn-outline" onClick={dong}>Quay lại</button></div>;
  const p = dl.phieu;
  const quanLy = vaiTro === 'owner' || vaiTro === 'manager';
  const chuQuan = vaiTro === 'owner';
  const daDuyet = p.trang_thai === 'da_duyet';
  const laPX = p.loai === 'PX';

  const noiDung = (
    <>
        <h3 className="card-title">{p.so_phieu} · {TRANG_THAI[p.trang_thai]}</h3>
        {p.so_lan_in >= 2 && kho && <div className="kho-in-lai">IN LẠI · LẦN {p.so_lan_in}</div>}
        <div className="kho-nho">
          Tạo: {p.nguoi_tao} · {gio(p.tao_luc)}{p.nguoi_duyet && ` — Duyệt: ${p.nguoi_duyet} · ${gio(p.duyet_luc)}`}
          {p.nguoi_huy && ` — ${p.thay_bang_id ? 'Sửa' : p.nguoi_duyet ? 'Huỷ' : 'Từ chối / huỷ'}: ${p.nguoi_huy} · ${gio(p.huy_luc)}`}
        </div>
        {p.ly_do && <div className="kho-nho">Lý do: {p.ly_do}</div>}
        {p.thay_cho_id && <div className="kho-nho kho-khong-in"><button className="kho-lien-ket" onClick={() => moPhieu(p.thay_cho_id)}>Thay cho phiếu cũ</button></div>}
        {p.thay_bang_id && <div className="kho-canh kho-khong-in">Phiếu đã được sửa — <button onClick={() => moPhieu(p.thay_bang_id)}>xem phiếu thay</button></div>}

        {!laPX && <BangDong dl={dl} kho={kho} />}
        {laPX && <h4 className="kho-muc">A · Tổng cần lấy</h4>}
        {dl.tong.map((n) => (
          <div key={n.nguyen_lieu_id} className={`kho-dong ${n.am ? 'kho-am' : ''}`}>
            <span className="kho-o">☐</span><span style={{ flex: 1 }}>{n.ten}</span><b>{luong(n)}</b>
            {n.am && <span className="kho-khong-in"> · tồn âm</span>}
            {n.don_gia != null && <span className="kho-nho kho-khong-in"> · {tien(n.don_gia)}</span>}
          </div>
        ))}

        {laPX && <h4 className="kho-muc">B · Định lượng từng công thức</h4>}
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

        {daDuyet && laPX && <h4 className="kho-muc">C · Kết quả</h4>}
        {daDuyet && laPX && dl.theo_mon.map((m) => {
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
        {kho && <div className="kho-nho" style={{ marginTop: '0.6rem' }}>{laPX ? 'Người lấy hàng: ________ · Người pha: ________' : 'Người lập: ________ · Người nhận / duyệt: ________'}</div>}
    </>
  );

  return (
    <div>
      <div className={`kho-in ${kho ? `kho-in-${kho}` : ''}`}>
        {Array.from({ length: kho ? mac.ban : 1 }, (_, i) => <div key={i} className="kho-ban">{noiDung}</div>)}
      </div>

      {loi && <div className="kho-loi">{loi}</div>}
      {sua && (
        <div className="card kho-khong-in" style={{ padding: '0.75rem', marginTop: '0.75rem' }}>
          {!laPX && dl.dong.map((d) => (
            <div key={d.id} className="kho-dong"><span style={{ flex: 1 }}>{d.ten}</span>
              <input className="input kho-hep" type="number" min="0" step="any" value={sua[d.id]} onChange={(e) => setSua({ ...sua, [d.id]: e.target.value })} /> {d.don_vi}</div>
          ))}
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
        {p.trang_thai === 'cho_duyet' && quanLy && p.nguoi_tao !== tenDangNhap && (!p.can_chu_quan || chuQuan) && (
          <>
            <button className="btn btn-primary" disabled={dangGhi} onClick={() => ghi(() => api.post(`/kho/phieu/${id}/duyet`))}>Duyệt</button>
            <button className="btn btn-outline" disabled={dangGhi} onClick={tuChoi}>Từ chối</button>
          </>
        )}
        {daDuyet && thuTuNutIn(mac.kho).map((k, i) => (
          <button key={k} className={`btn ${i === 0 ? 'btn-primary' : 'btn-outline'}`} disabled={dangGhi} onClick={() => inRa(k)}>{NHAN_NUT_IN[k]}{i === 0 && ` · mặc định${mac.ban > 1 ? ` · ${mac.ban} bản` : ''}`}</button>
        ))}
        {chuQuan && ['cho_duyet', 'da_duyet'].includes(p.trang_thai) && !sua && (
          <>
            {(laPX || daDuyet) && <button className="btn btn-outline" onClick={() => setSua(laPX ? Object.fromEntries(dl.theo_mon.map((m) => [m.san_pham_id, String(m.so_phan)]))
              : Object.fromEntries(dl.dong.map((d) => [d.id, String(d.luong_hien)])))}>Sửa</button>}
            <button className="btn btn-outline" disabled={dangGhi} onClick={huy}>Huỷ phiếu</button>
          </>
        )}
        <button className="btn btn-outline" onClick={dong}>Quay lại</button>
      </div>
    </div>
  );
}
