/**
 * BAO-1b — phát hiện "có thay đổi chưa lưu": chụp giá trị lúc tải xong (chup(giaTriVuaTai)), so với giá trị đang gõ (giaTri).
 * Chưa chụp (đang tải / tải lỗi) thì KHÔNG báo thay đổi. Lưu xong gọi tai() → chup lại số máy chủ giữ → thanh tự tắt.
 */
import { useState } from 'react';

export default function useThayDoi(giaTri) {
  const [goc, setGoc] = useState(null);
  const coDoi = goc !== null && JSON.stringify(giaTri) !== goc;
  return [coDoi, (v) => setGoc(JSON.stringify(v))];
}
