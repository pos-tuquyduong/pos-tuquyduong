/**
 * KHO-2a — Pha chế: "Cho hôm nay" / "Cho ngày mai"; mỗi món làm sẵn: định mức · đang có (thành phẩm còn hạn) · cần làm (máy chủ tính).
 * Tick (mặc định món cần làm > 0), sửa số phần → "Xuất kho nguyên liệu" = MỘT phiếu cho cả lần. Nút khoá khi đang gửi + ma_gui (bấm hai lần
 * máy chủ trả cùng phiếu).
 */
import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { so, maGuiMoi, THU } from './chung';

export default function PhaChe({ moPhieu }) {
  const [ngay, setNgay] = useState('hom_nay');
  const [dl, setDl] = useState(null);
  const [chon, setChon] = useState({});   // san_pham_id → số phần (chuỗi ô nhập); không có khoá = không tick
  const [loi, setLoi] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [maGui, setMaGui] = useState(maGuiMoi);

  useEffect(() => {
    setLoi('');
    api.get(`/kho/pha-che?ngay=${ngay}`).then((r) => {
      setDl(r);
      setChon(Object.fromEntries(r.mon.filter((m) => m.can_lam > 0 && m.co_cong_thuc).map((m) => [m.san_pham_id, String(m.can_lam)])));
      setMaGui(maGuiMoi());
    }).catch((e) => setLoi(e.message));
  }, [ngay]);

  const doiTick = (m) => setChon((c) => {
    const moi = { ...c };
    if (m.san_pham_id in moi) delete moi[m.san_pham_id]; else moi[m.san_pham_id] = String(m.can_lam || 1);
    return moi;
  });
  const monGui = Object.entries(chon).map(([id, sl]) => ({ san_pham_id: Number(id), so_phan: Number(sl) }));
  const xuat = async () => {
    setLoi('');
    setDangGui(true);
    try {
      const r = await api.post('/kho/phieu-xuat', { mon: monGui, ma_gui: maGui });
      moPhieu(r.phieu.id);
    } catch (e) { setLoi(e.message); setDangGui(false); }
  };

  return (
    <div>
      <div className="kho-hang">
        <button className={`btn ${ngay === 'hom_nay' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setNgay('hom_nay')}>Cho hôm nay</button>
        <button className={`btn ${ngay === 'ngay_mai' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setNgay('ngay_mai')}>Cho ngày mai</button>
        {dl && <span className="kho-nho">{THU[dl.thu]} · {dl.ngay.split('-').reverse().join('/')}</span>}
      </div>
      {loi && <div className="kho-loi">{loi}</div>}
      {dl && !dl.mon.length && <p className="text-gray">Chưa có món làm sẵn — đặt kiểu "Làm sẵn" ở Sản phẩm & công thức.</p>}
      <div className="kho-luoi">
        {dl?.mon.map((m) => {
          const tick = m.san_pham_id in chon;
          return (
            <div key={m.san_pham_id} className={`kho-the ${tick ? 'kho-chon' : ''}`} onClick={() => m.co_cong_thuc && doiTick(m)}>
              <b>{tick ? '☑' : '☐'} {m.ten}</b>
              <div className="kho-nho">định mức {so(m.dinh_muc)} · đang có {so(m.dang_co)} · <b className={m.can_lam > 0 ? 'kho-thieu' : ''}>cần làm {so(m.can_lam)}</b></div>
              {!m.co_cong_thuc && <div className="kho-thieu">chưa có công thức</div>}
              {tick && (
                <div className="kho-hang" style={{ marginTop: '0.4rem', marginBottom: 0 }} onClick={(e) => e.stopPropagation()}>
                  <input className="input" type="number" min="0" step="any" inputMode="decimal" style={{ maxWidth: '6rem' }} value={chon[m.san_pham_id]}
                    onChange={(e) => setChon({ ...chon, [m.san_pham_id]: e.target.value })} />
                  <span>phần</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button className="btn btn-primary kho-nut-lon" disabled={dangGui || !monGui.length || monGui.some((m) => !(m.so_phan > 0))} onClick={xuat}>
        {dangGui ? 'Đang gửi…' : `Xuất kho nguyên liệu (${monGui.length} món)`}
      </button>
    </div>
  );
}
