/**
 * Vòng chạy của màn khách: hỏi trạng thái theo nhịp (nhanh khi đang thu, chậm khi rảnh), hỏi nội dung rảnh mỗi phút.
 * Mất mạng → GIỮ NGUYÊN màn đang hiện (chỉ hiện chấm vàng sau vài lần hỏng), có mạng lại tự nối. Mỗi vòng là MỘT setTimeout, trạng thái
 * chỉ giữ bản mới nhất — chạy cả ngày không đầy bộ nhớ. Màn khách không tính tiền: mọi số lấy nguyên từ máy chủ.
 */
import { useEffect, useRef, useState } from 'react';
import { manKhachApi } from '../../utils/api';
import ManThu from './ManThu';
import TrangRanh from './TrangRanh';

const NHIP_THU_MS = 1500;       // đang thu / vừa thu: ≤ 2 giây từ lúc quầy mở QR tới lúc màn khách hiện
const NHIP_RANH_MS = 2000;       // cũng ≤ 2 giây: QR vừa mở phải lên màn khách trong ≤ 2 giây dù đang rảnh
const NHIP_LOI_MS = 5000;
const NHIP_NOI_DUNG_MS = 60000;
const SO_LAN_LOI_BAO = 3;       // hỏng liên tiếp bấy nhiêu lần mới báo "mất kết nối"
const MA_MAT_QUYEN = ['KHOA_THU_HOI', 'KHOA_KHONG_HOP_LE'];
const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';

export default function ManChay({ khoa, onMatQuyen }) {
  const [tt, setTt] = useState(null);          // { ...trạng thái, nhanLuc } — bản mới nhất
  const [nd, setNd] = useState(null);          // nội dung lúc rảnh
  const [soLoi, setSoLoi] = useState(0);
  const matQuyen = useRef(onMatQuyen);
  matQuyen.current = onMatQuyen;

  useEffect(() => {
    let dung = false, h;
    const vong = async () => {
      let cho = NHIP_LOI_MS;
      try {
        const r = await manKhachApi.trangThai(khoa);
        if (dung) return;
        setTt({ ...r, nhanLuc: performance.now() }); setSoLoi(0);
        cho = r.che_do === 'ranh' ? NHIP_RANH_MS : NHIP_THU_MS;
      } catch (e) {
        if (dung) return;
        if (MA_MAT_QUYEN.includes(e.code)) { matQuyen.current(); return; }
        setSoLoi((n) => n + 1);
      }
      h = setTimeout(vong, cho);
    };
    vong();
    return () => { dung = true; clearTimeout(h); };
  }, [khoa]);

  useEffect(() => {
    let dung = false, h;
    const vong = async () => {
      try {
        const r = await manKhachApi.noiDung(khoa);
        if (!dung) setNd(r);
      } catch (e) {
        if (!dung && MA_MAT_QUYEN.includes(e.code)) { matQuyen.current(); return; }
      }
      if (!dung) h = setTimeout(vong, NHIP_NOI_DUNG_MS);
    };
    vong();
    return () => { dung = true; clearTimeout(h); };
  }, [khoa]);

  return (
    <>
      {soLoi >= SO_LAN_LOI_BAO && <div className="mk-vang">Mất kết nối — đang thử lại</div>}
      {tt?.che_do === 'thu' && <ManThu thu={tt.thu} nhanLuc={tt.nhanLuc} />}
      {tt?.che_do === 'cam_on' && (
        <div className="mk-giua"><div className="mk-to">Cảm ơn quý khách</div><div className="mk-vua">Đã nhận {vnd(tt.cam_on.so_tien)}</div></div>
      )}
      {(!tt || tt.che_do === 'ranh') && <TrangRanh nd={nd} />}
    </>
  );
}
