/**
 * Góc màn Bán hàng mới: mã ghép màn khách. useQuayManKhach giữ quay_id của MÁY QUẦY này (localStorage), xin / làm mới mã định kỳ
 * và báo phiên QR cho máy chủ. Mọi lỗi mạng nuốt im: màn khách hỏng không bao giờ chặn bán hàng (CLAUDE.md §5.3).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Monitor } from 'lucide-react';
import { manKhachApi } from '../../utils/api';
import { docQuayId, ghiQuayId } from './luu';

const CHU_KY_LAM_MOI_MS = 4 * 60 * 1000;   // mã sống 10 phút (máy chủ) — làm mới giữa chừng để góc màn luôn hiện mã còn hạn

export function useQuayManKhach() {
  const [q, setQ] = useState(null);
  const quayId = useRef(docQuayId());
  const lamMoi = useCallback(async (doiMa = false) => {
    try {
      const r = doiMa && quayId.current ? await manKhachApi.doiMa(quayId.current) : await manKhachApi.moQuay(quayId.current);
      if (r.quay_id !== quayId.current) { quayId.current = r.quay_id; ghiQuayId(r.quay_id); }
      setQ(r);
    } catch { /* màn khách không dùng được lúc này: quầy vẫn bán bình thường */ }
  }, []);
  useEffect(() => {
    lamMoi();
    const h = setInterval(lamMoi, CHU_KY_LAM_MOI_MS);
    return () => clearInterval(h);
  }, [lamMoi]);
  const baoPhien = useCallback((phienId) => {
    if (!quayId.current || !phienId) return;
    manKhachApi.baoPhien(quayId.current, phienId).catch(() => {});
  }, []);
  return { q, lamMoi, baoPhien };
}

export default function MaGhep({ q, lamMoi }) {
  const [mo, setMo] = useState(false);
  const soMay = q?.may?.length || 0;
  return (
    <div style={{ position: 'relative' }}>
      <button className="bh-nut-nho" onClick={() => { setMo((v) => !v); if (!mo) lamMoi(); }} aria-label="Ghép màn khách">
        <Monitor size={16} /> Màn khách{soMay > 0 ? ` · ${soMay}` : ''}
      </button>
      {mo && (
        <div className="bh-cai-dat">
          <b>Ghép màn khách</b>
          {q ? (
            <>
              <div className="bh-ghi-chu-ngu">Trên máy tính bảng quay về phía khách, mở trang <b>/man-khach</b> rồi nhập mã:</div>
              <div style={{ fontSize: 34, letterSpacing: '0.25em', fontWeight: 800, textAlign: 'center' }}>{q.ma}</div>
              <div className="bh-ghi-chu-ngu">Mã có hạn vài phút.{soMay > 0 ? ` Đã ghép: ${q.may.map((m) => m.ten).join(', ')}.` : ' Chưa ghép màn nào.'}</div>
              <button className="bh-nut bh-phu" onClick={() => lamMoi(true)}>Đổi mã</button>
            </>
          ) : <div className="bh-ghi-chu-ngu">Chưa lấy được mã — kiểm tra mạng rồi mở lại.</div>}
        </div>
      )}
    </div>
  );
}
