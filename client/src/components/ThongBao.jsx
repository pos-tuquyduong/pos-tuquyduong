/**
 * BAO-1a — thông báo nổi góc trên phải, gắn MỘT lần ở Layout. Xanh "Đã lưu …" tự ẩn; đỏ có tiêu đề + lý do + nút đóng ×.
 * Gọi từ mọi màn: import { baoXong, baoLoi, baoLoiTu } from '../components/thongBaoKho.js' (hàm gọi nằm ở thongBaoKho.js).
 */
import { useSyncExternalStore } from 'react';
import { dangKy, laySnapshot, bo } from './thongBaoKho.js';

export default function ThongBao() {
  const ds = useSyncExternalStore(dangKy, laySnapshot);
  if (!ds.length) return null;
  return (
    <div className="thong-bao-khung">
      {ds.map((t) => (
        <div key={t.id} className={`thong-bao thong-bao-${t.loai}`} role={t.loai === 'loi' ? 'alert' : 'status'}>
          <span className="thong-bao-dau" aria-hidden="true">{t.loai === 'loi' ? '!' : '✓'}</span>
          <div className="thong-bao-chu">
            <div className="thong-bao-tieu-de">{t.tieuDe}</div>
            {t.lyDo && <div className="thong-bao-ly-do">{t.lyDo}</div>}
          </div>
          {t.loai === 'loi' && (
            <button type="button" className="thong-bao-dong" aria-label="Đóng thông báo" onClick={() => bo(t.id)}>×</button>
          )}
        </div>
      ))}
    </div>
  );
}
