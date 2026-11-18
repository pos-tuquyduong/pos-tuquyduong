/**
 * BanHang/index.jsx — trang chủ quầy: LUÔN màn Bán hàng (BanHangMoi). BO-MAN-CU-1 (chủ quán 11.11): chỉ còn một màn, không còn công tắc.
 * Máy này chỉ nhớ KIỂU bố cục (Tự động / Điện thoại / Máy tính bảng) — đổi ở bảng ⚙ của màn.
 */
import { useState } from 'react';
import BanHangMoi from './BanHangMoi';
import { docKieu, ghiKieu } from './tinh';

const layKho = () => {
  try { return window.localStorage; } catch { return undefined; }
};

export default function TrangChu() {
  const [kieu, setKieu] = useState(() => docKieu(layKho()));
  const doiKieu = (k) => {
    ghiKieu(layKho(), k);
    setKieu(docKieu(layKho()));
  };
  return <BanHangMoi kieu={kieu} onDoiKieu={doiKieu} />;
}
