/**
 * Thanh khách ngay trên màn: gõ SĐT / tên (trống = khách lẻ) hoặc Quét thẻ. KHÔNG tạo khách ở quầy (luật 6) —
 * không dùng CustomerSearch vì nó có nút "Thêm khách mới". Tra bằng đúng API ô tìm cũ (customersV2Api.search).
 */
import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { customersApi, customersV2Api } from '../../utils/api';
import QrScanModal from '../../components/QrScanModal';

const chuSo = (s) => String(s || '').replace(/\D/g, '');
const chuanSdt = (s) => { const p = chuSo(s); return p.startsWith('84') && p.length >= 11 ? '0' + p.slice(2) : p; };
const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';

export default function ThanhKhach({ khach, hang, onChon, onBo }) {
  const [q, setQ] = useState('');
  const [ds, setDs] = useState([]);
  const [moQuet, setMoQuet] = useState(false);
  const lan = useRef(0);

  useEffect(() => {
    const tim = q.trim();
    if (!tim) return undefined;
    const luot = ++lan.current;
    const h = setTimeout(async () => {
      try {
        const data = await customersV2Api.search(tim);
        if (lan.current === luot) setDs(data.results || []);   // lượt tra cũ về muộn thì bỏ
      } catch { if (lan.current === luot) setDs([]); }
    }, 300);
    return () => clearTimeout(h);
  }, [q]);

  const chon = (c) => { lan.current++; setQ(''); setDs([]); onChon(c); };

  // Quét thẻ: mã → SĐT → tra đúng SĐT bằng API ô tìm (như CustomerSearch). Trả chuỗi = lỗi hiện trong hộp quét.
  const quet = async (doc) => {
    const ma = String(doc || '').trim();
    if (/^QR-/i.test(ma)) return 'Mã kiểu cũ — mời khách mở mã mới trong app, hoặc tìm theo SĐT.';
    if (!/^[A-Za-z0-9-]+$/.test(ma)) return 'Không phải thẻ thành viên của quán.';
    try {
      const kh = await customersApi.getByQR(ma);
      const data = await customersV2Api.search(kh.phone);
      const dong = (data.results || []).find((c) => chuanSdt(c.phone) === chuanSdt(kh.phone));
      if (!dong) return 'Khách chưa có trong danh sách quầy — tìm theo SĐT.';
      setMoQuet(false);
      chon(dong);
    } catch (err) {
      return err.status === 404 ? 'Không phải thẻ thành viên của quán.' : 'Không tra được thẻ — quét lại, hoặc tìm theo SĐT.';
    }
    return undefined;
  };

  if (khach) {
    return (
      <div className="bh-khach">
        <div className="bh-dai-khach">
          <b>{khach.name}</b>
          {hang?.usable && <span className="bh-the">{hang.tier_name || hang.name || 'Hạng'} · -{hang.discount_percent || 0}%</span>}
          <span className="bh-the">Tài khoản {vnd(khach.balance)}</span>
          {khach.points != null && <span className="bh-the">{Number(khach.points) || 0} điểm</span>}
          <button className="bh-nut-nho" style={{ marginLeft: 'auto' }} onClick={onBo}><X size={14} /> Đổi</button>
        </div>
      </div>
    );
  }
  return (
    <div className="bh-khach">
      <div className="bh-khach-o">
        <input value={q} onChange={(e) => { setQ(e.target.value); if (!e.target.value.trim()) { lan.current++; setDs([]); } }} placeholder="Khách quen? Gõ SĐT / tên — trống = khách lẻ" />
        <button className="bh-nut-nho" onClick={() => setMoQuet(true)}><Camera size={16} /> Quét thẻ</button>
      </div>
      {ds.length > 0 && (
        <div className="bh-goi-y">
          {ds.map((c) => (
            <button key={c.phone} onClick={() => chon(c)}>
              <b>{c.name}</b> · {c.phone} {c.balance > 0 && <span className="bh-ghi-chu-ngu">· TK {vnd(c.balance)}</span>}
            </button>
          ))}
        </div>
      )}
      {moQuet && <QrScanModal tieuDe="Quét thẻ thành viên" onResult={quet} onClose={() => setMoQuet(false)} />}
    </div>
  );
}
