/**
 * KHO-2a — Pha chế: "Cho hôm nay" / "Cho ngày mai"; mỗi món làm sẵn: định mức · đang có (thành phẩm còn hạn) · cần làm (máy chủ tính).
 * KHO-GON-2 (bản thử chủ quán duyệt 26.11): lọc nhóm (chỉ nhóm có món; 1 nhóm thì ẩn) · mỗi dòng tick · tên (chạm mở định lượng) · "Có x · tối đa n"
 * (máy chủ tính — tinh.toiDa) · − [số] + · món đun nồi (me_ra) nhập theo NỒI, gửi số phần = nồi × mẻ. Chân dính đáy: "Thiếu: …" (màn cộng định lượng
 * máy chủ gửi — chỉ để HIỆN) + nút "Xem phiếu & in" khoá khi thiếu / vượt. Máy chủ vẫn tự chặn (409 THIEU_NGUYEN_LIEU / KHONG_DU_TON).
 * Nút khoá khi đang gửi + ma_gui (bấm hai lần máy chủ trả cùng phiếu).
 */
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../utils/api';
import { baoXong, baoLoiTu } from '../../components/thongBaoKho.js';   // BAO-1a
import { so, maGuiMoi, raHien, THU } from './chung';

const SAI_SO = 1e-9;
/** Món nồi: ô nhập là số nồi → số phần gửi máy chủ = nồi × mỗi mẻ ra. */
const soGuiCua = (m, n) => (m.me_ra ? n * m.me_ra : n);
const toiDaNhap = (m) => (m.toi_da == null ? null : m.me_ra ? Math.floor(m.toi_da / m.me_ra + SAI_SO) : m.toi_da);
const donVi = (m) => (m.me_ra ? 'nồi' : 'phần');

export default function PhaChe({ moPhieu }) {
  const [ngay, setNgay] = useState('hom_nay');
  const [dl, setDl] = useState(null);
  const [chon, setChon] = useState({});   // san_pham_id → số (chuỗi ô nhập; món nồi = số nồi); không có khoá = không tick
  const [nhom, setNhom] = useState('tat_ca');
  const [mo, setMo] = useState(null);   // món đang mở định lượng
  const [loi, setLoi] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [maGui, setMaGui] = useState(maGuiMoi);

  useEffect(() => {
    setLoi('');
    api.get(`/kho/pha-che?ngay=${ngay}`).then((r) => {
      setDl(r);
      setChon(Object.fromEntries(r.mon.filter((m) => m.can_lam > 0 && m.co_cong_thuc)
        .map((m) => [m.san_pham_id, String(m.me_ra ? Math.ceil(m.can_lam / m.me_ra) : m.can_lam)])));
      setMaGui(maGuiMoi());
    }).catch((e) => setLoi(e.message));
  }, [ngay]);

  const kho = useMemo(() => new Map((dl?.kho || []).map((k) => [k.khoa, k])), [dl]);
  const monGui = Object.entries(chon).map(([id, sl]) => {
    const m = dl?.mon.find((x) => x.san_pham_id === Number(id));
    return { m, n: Number(sl), so_phan: m ? soGuiCua(m, Number(sl)) : 0 };
  }).filter((x) => x.m);
  // Tổng cần theo từng thứ của mọi món đang tick → thứ nào vượt tồn
  const can = new Map();
  for (const { m, so_phan: sp } of monGui) for (const d of m.mot_phan) can.set(d.khoa, (can.get(d.khoa) || 0) + d.luong * (sp > 0 ? sp : 0));
  const thieu = [...can].filter(([k, c]) => c > Number(kho.get(k)?.ton ?? 0) + SAI_SO).map(([k, c]) => ({ ...kho.get(k), can: c }));
  const vuot = (m) => m.san_pham_id in chon && toiDaNhap(m) != null && Number(chon[m.san_pham_id]) > toiDaNhap(m) + SAI_SO;
  const hien = (k, x) => `${so(raHien(x, k?.he_so_doi))} ${k?.don_vi || ''}`;

  const doiTick = (m) => setChon((c) => {
    const moi = { ...c };
    if (m.san_pham_id in moi) delete moi[m.san_pham_id]; else moi[m.san_pham_id] = String(m.me_ra ? Math.max(1, Math.ceil(m.can_lam / m.me_ra)) : m.can_lam || 1);
    return moi;
  });
  const buoc = (m, d) => setChon((c) => ({ ...c, [m.san_pham_id]: String(Math.max(0, Number(c[m.san_pham_id] || 0) + d)) }));
  const xuat = async () => {
    setDangGui(true);
    try {
      const r = await api.post('/kho/phieu-xuat', { mon: monGui.map((x) => ({ san_pham_id: x.m.san_pham_id, so_phan: x.so_phan })), ma_gui: maGui });
      baoXong('Đã ghi phiếu xuất pha chế');
      moPhieu(r.phieu.id);
    } catch (e) { baoLoiTu('ghi phiếu xuất pha chế', e); setDangGui(false); }
  };

  const nhomCo = (dl?.nhom || []).filter((n) => dl.mon.some((m) => m.nhom_id === Number(n.id)));
  const ds = (dl?.mon || []).filter((m) => nhom === 'tat_ca' || m.nhom_id === nhom);
  const khoa = dangGui || !monGui.length || monGui.some((x) => !(x.so_phan > 0)) || (dl?.mon || []).some(vuot);

  return (
    <div className="kho-pha-che">
      <div className="kho-hang">
        <button className={`btn ${ngay === 'hom_nay' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setNgay('hom_nay')}>Cho hôm nay</button>
        <button className={`btn ${ngay === 'ngay_mai' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setNgay('ngay_mai')}>Cho ngày mai</button>
        {dl && <span className="kho-nho">{THU[dl.thu]} · {dl.ngay.split('-').reverse().join('/')}</span>}
      </div>
      <div className="kho-nho" style={{ marginBottom: '0.5rem' }}>Món pha tại chỗ (vd Cà phê đen) không cần pha trước — chỉ cần Nhận hàng nguyên liệu.</div>
      {loi && <div className="kho-loi">{loi}</div>}
      {nhomCo.length > 1 && (
        <div className="kho-tabs">
          <button className={`kho-tab ${nhom === 'tat_ca' ? 'on' : ''}`} onClick={() => setNhom('tat_ca')}>Tất cả</button>
          {nhomCo.map((n) => <button key={n.id} className={`kho-tab ${nhom === Number(n.id) ? 'on' : ''}`} onClick={() => setNhom(Number(n.id))}>{n.ten}</button>)}
        </div>
      )}
      {dl && !dl.mon.length && <p className="text-gray">Chưa có món làm sẵn — đặt kiểu "Làm sẵn" ở Sản phẩm & công thức.</p>}
      {ds.map((m) => {
        const tick = m.san_pham_id in chon;
        const td = toiDaNhap(m);
        return (
          <div key={m.san_pham_id} className={`kho-the kho-dong-mon ${tick ? 'kho-chon' : ''} ${vuot(m) ? 'kho-am' : ''}`}>
            <div className="kho-dong" style={{ marginBottom: 0 }}>
              <input type="checkbox" className="kho-o-tick" checked={tick} disabled={!m.co_cong_thuc} onChange={() => doiTick(m)} aria-label={`Chọn ${m.ten}`} />
              <button className="kho-lien-ket kho-ten-mon" onClick={() => setMo(mo === m.san_pham_id ? null : m.san_pham_id)}>{m.ten}</button>
              {tick && (
                <span className="kho-so-nhap">
                  <button className="btn btn-outline kho-nut-so" aria-label="Bớt" onClick={() => buoc(m, -1)}>−</button>
                  <input className="input kho-o-so" type="number" min="0" step="any" inputMode="decimal" value={chon[m.san_pham_id]}
                    onChange={(e) => setChon({ ...chon, [m.san_pham_id]: e.target.value })} />
                  <button className="btn btn-outline kho-nut-so" aria-label="Thêm" onClick={() => buoc(m, 1)}>+</button>
                </span>
              )}
            </div>
            <div className="kho-nho">
              Có {so(m.dang_co)} · tối đa {td == null ? '—' : `${so(td)} ${donVi(m)}`} · định mức {so(m.dinh_muc)} · <b className={m.can_lam > 0 ? 'kho-thieu' : ''}>cần làm {so(m.can_lam)}</b>
              {m.me_ra && tick && <span> · = {so(soGuiCua(m, Number(chon[m.san_pham_id]) || 0))} phần</span>}
            </div>
            {!m.co_cong_thuc && <div className="kho-thieu">chưa có công thức</div>}
            {vuot(m) && <div className="kho-thieu">Vượt — kho chỉ đủ {so(td)} {donVi(m)}</div>}
            {mo === m.san_pham_id && (
              <div className="kho-nho" style={{ marginTop: '0.35rem' }}>
                {m.me_ra && <div>1 nồi = {m.mot_phan.map((d) => hien(kho.get(d.khoa), d.luong * m.me_ra) + ' ' + (kho.get(d.khoa)?.ten || '')).join(' + ')}
                  {m.me_ghi ? ` ${m.me_ghi}` : ''} → ra {m.me_ra} phần</div>}
                {m.mot_phan.map((d) => <div key={d.khoa}>{kho.get(d.khoa)?.ten}: 1 phần {hien(kho.get(d.khoa), d.luong)} · có {hien(kho.get(d.khoa), kho.get(d.khoa)?.ton ?? 0)}</div>)}
              </div>
            )}
          </div>
        );
      })}
      <div className="kho-chan">
        {thieu.length > 0 && <div className="kho-thieu">Thiếu: {thieu.map((t) => `${t.ten} (cần ${hien(t, t.can)}, có ${hien(t, t.ton)})`).join(' · ')}</div>}
        <button className="btn btn-primary kho-nut-lon" disabled={khoa || thieu.length > 0} onClick={xuat}>
          {dangGui ? 'Đang gửi…' : `Xem phiếu & in (${monGui.length} món)`}
        </button>
      </div>
    </div>
  );
}
