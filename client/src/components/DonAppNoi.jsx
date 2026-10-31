// KH-MUA-1 (H) — đơn App về quầy, thấy từ MỌI màn (gắn trong Layout): hỏi GET /api/pos/kh/don-app mỗi NHIP_MS, hiện nút "Đơn App" kèm số
// đơn đã trả chưa bấm "Đang làm" (bấm → /don-app). Render ngủ khi không ai mở → hỏi theo nhịp, không websocket.
// Chuông chỉ kêu ở máy bật "Máy ở quán" (lưu riêng máy, mặc định tắt) VÀ Cài đặt chuông bật; kêu MỘT lần mỗi đơn mới — nhớ id lớn nhất đã
// xét trong localStorage → tải lại trang không kêu lại; máy chưa có mốc thì lần đầu chỉ ghi mốc, không kêu dồn đơn cũ.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

export const TIENG_CHUONG = [['ding', 'Ding'], ['chuong', 'Chuông hai tiếng'], ['bip', 'Bíp ba lần']];   // cùng danh sách server/routes/settings.js
export const AM_LUONG_MAC_DINH = 70;
const NHIP_MS = 15000;
const KHOA_MAY = 'may_o_quan';
const KHOA_DA_XET = 'don_app_da_xet';

const docMay = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const ghiMay = (k, v) => { try { localStorage.setItem(k, v); } catch { /* trình duyệt chặn lưu — bỏ qua */ } };
export const mayOQuan = () => docMay(KHOA_MAY) === '1';
export const datMayOQuan = (bat) => ghiMay(KHOA_MAY, bat ? '1' : '0');

// [tần số Hz, bắt đầu sau (giây), dài (giây)] — tiếng tạo bằng Web Audio, không tệp, không thư viện.
const NOT = { ding: [[880, 0, 0.6]], chuong: [[660, 0, 0.35], [880, 0.35, 0.6]], bip: [[1000, 0, 0.15], [1000, 0.25, 0.15], [1000, 0.5, 0.15]] };

export function keuChuong(tieng, amLuong = AM_LUONG_MAC_DINH) {
  const muc = Math.max(0, Math.min(100, Number(amLuong) || 0)) / 100;
  if (!muc) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ac = new AC();
    for (const [tan, sau, dai] of NOT[tieng] || NOT.ding) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.frequency.value = tan;
      o.connect(g);
      g.connect(ac.destination);
      const t = ac.currentTime + sau;
      g.gain.setValueAtTime(muc, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dai);
      o.start(t);
      o.stop(t + dai);
    }
    setTimeout(() => ac.close(), 2000);
  } catch { /* trình duyệt chặn âm thanh — im lặng, không làm vỡ màn */ }
}

export default function DonAppNoi() {
  const navigate = useNavigate();
  const [soMoi, setSoMoi] = useState(0);

  useEffect(() => {
    let tat = false;
    const hoi = async () => {
      try {
        const ds = (await api.get('/kh/don-app')).data || [];
        if (tat) return;
        setSoMoi(ds.filter((d) => d.tien_trinh === 'da_tra').length);
        const lonNhat = ds.reduce((m, d) => Math.max(m, d.id), 0);
        const moc = docMay(KHOA_DA_XET);
        if (moc === null) { ghiMay(KHOA_DA_XET, String(lonNhat)); return; }
        if (lonNhat <= Number(moc)) return;
        ghiMay(KHOA_DA_XET, String(lonNhat));
        if (!mayOQuan() || !ds.some((d) => d.id > Number(moc) && d.tien_trinh === 'da_tra')) return;
        const s = (await api.get('/settings')).data || {};
        if (s.don_app_chuong_bat !== '0') keuChuong(s.don_app_chuong_tieng, s.don_app_chuong_am_luong ?? AM_LUONG_MAC_DINH);
      } catch { /* im lặng: đài báo hỏng không được làm hỏng màn hình */ }
    };
    hoi();
    const h = setInterval(hoi, NHIP_MS);
    return () => { tat = true; clearInterval(h); };
  }, []);

  return (
    <button
      onClick={() => navigate('/don-app')}
      title="Đơn khách đặt qua App, đã trả tiền"
      style={{
        position: 'fixed', top: 10, right: 12, zIndex: 900, border: 'none', borderRadius: 999, padding: '6px 12px',
        fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        background: soMoi ? '#dc2626' : '#e5e7eb', color: soMoi ? '#fff' : '#374151',
      }}
    >
      🔔 Đơn App{soMoi ? ` · ${soMoi} mới` : ''}
    </button>
  );
}
