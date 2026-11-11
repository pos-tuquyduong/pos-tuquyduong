/**
 * GIAO-1 — khung "Mang đi / tại quán | Giao hàng · Ahamove" trong giỏ (đặc tả 24.10 mục 15). Máy chủ hỏi Ahamove; màn hình KHÔNG gửi số phí:
 * chỉ gửi mã báo phí (`ma_bao_phi`) + người nhận. Ô địa chỉ theo cách máy chủ báo (cai-dat → ahamove.goi_y):
 *   cách 1 — gợi ý Ahamove: gõ → chọn một gợi ý (không nhận chữ tự do);
 *   cách 2 — chưa có khoá gợi ý: gõ chữ → "Tính phí" → máy hiện lại địa chỉ + km Ahamove hiểu → nhân viên bấm "Đúng địa chỉ" mới gắn phí.
 * Chưa gắn phí thì khối thu tiền ẩn (BanHangMoi).
 */
import { useEffect, useRef, useState } from 'react';
import { giaoHangApi } from '../../utils/api';

const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const DO_TRE_GOI_Y_MS = 350;

export default function KhungGiao({ bat, onBat, giao, onGiao, khach }) {
  const [ahamove, setAhamove] = useState(null);           // { da_cai, goi_y }
  const [ten, setTen] = useState('');
  const [sdt, setSdt] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const [chu, setChu] = useState('');
  const [goiY, setGoiY] = useState([]);
  const [chon, setChon] = useState(null);                 // gợi ý đã chọn { ma, dia_chi }
  const [cho, setCho] = useState(null);                   // báo phí chờ xác nhận (cách 2)
  const [dangTinh, setDangTinh] = useState(false);
  const [loi, setLoi] = useState('');
  const luot = useRef(0);

  useEffect(() => {
    if (bat && !ahamove) giaoHangApi.caiDat().then((r) => setAhamove(r.ahamove)).catch((e) => setLoi(e.message || 'Không tải được cài đặt giao'));
  }, [bat, ahamove]);
  useEffect(() => { if (bat && khach) { setTen((t) => t || khach.name || ''); setSdt((s) => s || khach.phone || ''); } }, [bat, khach]);
  // Người nhận / ghi chú đổi sau khi đã gắn phí → cập nhật thân gửi (không đổi phí, không hỏi lại máy chủ)
  useEffect(() => {
    if (giao && (giao.ten !== ten || giao.sdt !== sdt || giao.ghi_chu !== ghiChu)) onGiao({ ...giao, ten, sdt, ghi_chu: ghiChu });
  }, [ten, sdt, ghiChu]);   // eslint-disable-line react-hooks/exhaustive-deps -- chỉ theo ô nhập

  useEffect(() => {
    if (!ahamove?.goi_y || chon || chu.trim().length < 2) { setGoiY([]); return undefined; }
    const l = ++luot.current;
    const h = setTimeout(() => {
      giaoHangApi.diaChi(chu.trim()).then((r) => { if (luot.current === l) setGoiY(r.goi_y || []); }).catch(() => {});
    }, DO_TRE_GOI_Y_MS);
    return () => clearTimeout(h);
  }, [chu, chon, ahamove]);

  const gan = (r) => { setCho(null); onGiao({ ma_bao_phi: r.ma_bao_phi, phi: r.phi, km: r.km, dia_chi: r.dia_chi, ten, sdt, ghi_chu: ghiChu }); };
  const doiDiaChi = (v) => { setChu(v); setChon(null); setCho(null); if (giao) onGiao(null); };
  const tinhPhi = async () => {
    setLoi(''); setDangTinh(true);
    try {
      const r = await giaoHangApi.baoPhi(ahamove?.goi_y ? { ma_goi_y: chon?.ma } : { dia_chi: chu });
      if (r.can_xac_nhan) setCho(r); else gan(r);
    } catch (e) { setLoi(e.message || 'Không tính được phí'); }
    finally { setDangTinh(false); }
  };
  const tat = () => { onBat(false); onGiao(null); setCho(null); };

  return (
    <div className="bh-chan-gio">
      <div className="bh-to" style={{ padding: '0 0.9rem' }}>
        <button className={`bh-nut ${bat ? 'bh-phu' : ''}`} onClick={tat}>Mang đi / tại quán</button>
        <button className={`bh-nut ${bat ? '' : 'bh-phu'}`} onClick={() => onBat(true)}>Giao hàng · Ahamove</button>
      </div>
      {bat && (
        <div className="bh-giao">
          {ahamove && !ahamove.da_cai && <div className="bh-loi-nho">Chưa cài Ahamove — báo chủ quán (Cài đặt → Giao hàng)</div>}
          <input value={sdt} onChange={(e) => setSdt(e.target.value.replace(/[^\d]/g, '').slice(0, 11))} placeholder="SĐT người nhận" inputMode="tel" />
          <input value={ten} onChange={(e) => setTen(e.target.value.slice(0, 100))} placeholder="Tên người nhận" />
          <div style={{ position: 'relative' }}>
            <input value={chon ? chon.dia_chi : chu} onChange={(e) => doiDiaChi(e.target.value)}
              placeholder={ahamove?.goi_y ? 'Gõ địa chỉ rồi chọn trong gợi ý Ahamove' : 'Địa chỉ giao (số nhà, đường, phường / quận)'} />
            {goiY.length > 0 && (
              <div className="bh-goi-y">
                {goiY.map((g) => <button key={g.ma} onClick={() => { setChon(g); setGoiY([]); if (giao) onGiao(null); }}>{g.dia_chi}</button>)}
              </div>
            )}
          </div>
          <input value={ghiChu} onChange={(e) => setGhiChu(e.target.value.slice(0, 300))} placeholder="Ghi chú cho tài xế (ngõ, tầng, gọi trước…)" />
          {loi && <div className="bh-loi-nho">{loi}</div>}
          {cho && (
            <div className="bh-bao bh-thieu">
              Ahamove hiểu: <b>{cho.dia_chi_ahamove || cho.dia_chi}</b> · {cho.km} km · {vnd(cho.phi)}
              <div className="bh-to" style={{ marginTop: 6 }}>
                <button className="bh-nut bh-xanh" onClick={() => gan(cho)}>Đúng địa chỉ</button>
                <button className="bh-nut bh-phu" onClick={() => setCho(null)}>Sửa lại</button>
              </div>
            </div>
          )}
          {giao ? (
            <div className="bh-tien-dong"><span>Phí giao Ahamove · {giao.km} km</span><span><b>{vnd(giao.phi)}</b> <button className="bh-nut-nho" onClick={() => onGiao(null)}>Tính lại</button></span></div>
          ) : !cho && (
            <button className="bh-nut bh-lon" disabled={dangTinh || !ahamove?.da_cai || (ahamove.goi_y ? !chon : chu.trim().length < 5)} onClick={tinhPhi}>
              {dangTinh ? 'Đang hỏi Ahamove…' : 'Tính phí'}
            </button>
          )}
          {!giao && <div className="bh-ghi-chu-ngu">Tính phí xong mới thu tiền được. Phí giao là dòng riêng — không giảm hạng, không áp mã, không tích điểm.</div>}
        </div>
      )}
    </div>
  );
}
