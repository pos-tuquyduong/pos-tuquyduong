/**
 * BAO-1b — thanh cố định cuối màn: "Có thay đổi chưa lưu" + Bỏ (tải lại số máy chủ giữ) / Lưu. Mỗi thẻ có ô sửa gắn MỘT thanh;
 * thanh cũng ghi vào thayDoiKho để Settings hỏi lại khi chuyển thẻ lúc còn thay đổi.
 */
import { useEffect } from 'react';
import { Save } from 'lucide-react';
import { datChuaLuu } from './thayDoiKho.js';

export default function ThanhLuu({ id, coDoi, dangLuu, onLuu, onBo }) {
  useEffect(() => {
    datChuaLuu(id, coDoi);
    return () => datChuaLuu(id, false);
  }, [id, coDoi]);
  if (!coDoi) return null;
  return (
    <>
    <div className="thanh-luu-cho" aria-hidden="true" />
    <div className="thanh-luu" role="region" aria-label="Có thay đổi chưa lưu">
      <span className="thanh-luu-chu">Có thay đổi chưa lưu</span>
      <button type="button" className="btn btn-outline" disabled={dangLuu} onClick={onBo}>Bỏ</button>
      <button type="button" className="btn btn-primary" disabled={dangLuu} onClick={onLuu}><Save size={16} /> {dangLuu ? 'Đang lưu…' : 'Lưu'}</button>
    </div>
    </>
  );
}
