/**
 * BanHang/index.jsx — chọn màn trang chủ theo công tắc của MÁY NÀY (localStorage, mặc định TẮT = màn cũ Sales.jsx).
 * Bật / tắt: panel ⚙ trong màn mới, hoặc mở địa chỉ "/?man=moi" · "/?man=cu" (đặt công tắc rồi bỏ query).
 */
import { useState } from 'react';
import Sales from '../Sales';
import BanHangMoi from './BanHangMoi';
import { docCongTac, ghiCongTac } from './tinh';

const layKho = () => {
  try { return window.localStorage; } catch { return undefined; }
};

/** Địa chỉ ?man=moi|cu đặt công tắc ngay lúc dựng (chỉ đọc đường dẫn, không gọi máy chủ). */
function apDungQuery() {
  const cur = docCongTac(layKho());
  try {
    const man = new URLSearchParams(window.location.search).get('man');
    if (man !== 'moi' && man !== 'cu') return cur;
    ghiCongTac(layKho(), man === 'moi', cur.kieu);
    window.history.replaceState(null, '', window.location.pathname);
    return { ...cur, bat: man === 'moi' };
  } catch {
    return cur;
  }
}

export default function TrangChu() {
  const [cfg, setCfg] = useState(apDungQuery);
  const doi = (bat, kieu) => {
    ghiCongTac(layKho(), bat, kieu);
    setCfg({ bat, kieu });
  };
  return cfg.bat ? <BanHangMoi kieu={cfg.kieu} onDoiCaiDat={doi} /> : <Sales />;
}
