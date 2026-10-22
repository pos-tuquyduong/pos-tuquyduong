import { useCallback, useEffect, useState } from 'react';

/** Tải dữ liệu khi màn mở: { dl, loi, dangTai, taiLai }. `ham` phải ổn định (hàm của api.js hoặc useCallback). */
export function dungTai(ham) {
  const [trangThai, datTrangThai] = useState({ dl: null, loi: '', dangTai: true });
  const taiLai = useCallback(() => {
    datTrangThai((t) => ({ ...t, loi: '', dangTai: true }));
    ham().then(
      (dl) => datTrangThai({ dl, loi: '', dangTai: false }),
      (e) => datTrangThai({ dl: null, loi: e.message, dangTai: false }),
    );
  }, [ham]);
  useEffect(() => { taiLai(); }, [taiLai]);
  return { ...trangThai, taiLai };
}
