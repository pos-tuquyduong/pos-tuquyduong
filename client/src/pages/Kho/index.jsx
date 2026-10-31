/**
 * KHO-1 — màn Quản lý kho. Quyền kiểm ở máy chủ; ở đây chỉ ẩn tab không dùng được.
 * KHO-2a: tab đầu Pha chế (mọi vai trò) · Tồn kho · Phiếu (huy hiệu số phiếu chờ duyệt cho chủ / quản lý — MỘT vòng hỏi 30 s cho cả huy hiệu
 * và khung Chờ duyệt) · Định mức. Mở một phiếu → XemPhieu thay cho nội dung tab.
 * KHO-2b: việc hay dùng lên trước (Nhận hàng, Phát sinh), ít dùng sau (Đặt hàng). Huy hiệu gồm cả DH / PN / PS — quản lý không đếm đơn vượt hạn
 * mức (can_chu_quan: chỉ chủ quán duyệt được).
 */
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import PhaChe from './PhaChe';
import TonKho from './TonKho';
import DsPhieu from './DsPhieu';
import XemPhieu from './XemPhieu';
import DinhMuc from './DinhMuc';
import NguyenLieu from './NguyenLieu';
import SanPham from './SanPham';
import NhapSx from './NhapSx';
import NhanHang from './NhanHang';
import PhatSinh from './PhatSinh';
import DatHang from './DatHang';
import './kho.css';
import './inPhieuKho.css';

const HOI_CHO_DUYET_MS = 30000;

export default function Kho() {
  const { user } = useAuth();
  const vaiTro = user?.role;
  const quanLy = vaiTro === 'owner' || vaiTro === 'manager';
  const tabs = [
    { ma: 'pc', ten: 'Pha chế', hien: true },
    { ma: 'nh', ten: 'Nhận hàng', hien: true },
    { ma: 'ps', ten: 'Phát sinh', hien: true },
    { ma: 'ton', ten: 'Tồn kho', hien: true },
    { ma: 'phieu', ten: 'Phiếu', hien: true },
    { ma: 'nl', ten: 'Nguyên liệu', hien: true },
    { ma: 'sp', ten: 'Sản phẩm & công thức', hien: quanLy },
    { ma: 'dm', ten: 'Định mức', hien: quanLy },
    { ma: 'dh', ten: 'Đặt hàng', hien: true },
    { ma: 'sx', ten: 'Nhập từ SX', hien: vaiTro === 'owner' },
  ].filter((t) => t.hien);
  const [tab, setTab] = useState('pc');
  const [phieuMo, setPhieuMo] = useState(null);
  const [choDuyet, setChoDuyet] = useState([]);

  const taiChoDuyet = useCallback(() => {
    if (!quanLy) return;
    api.get('/kho/phieu?trang_thai=cho_duyet').then((r) => setChoDuyet(r.phieu.filter((p) => vaiTro === 'owner' || !p.can_chu_quan))).catch(() => {});
  }, [quanLy, vaiTro]);
  useEffect(() => {
    taiChoDuyet();
    const t = setInterval(taiChoDuyet, HOI_CHO_DUYET_MS);
    return () => clearInterval(t);
  }, [taiChoDuyet]);

  const dongPhieu = () => { setPhieuMo(null); taiChoDuyet(); };

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">📦 Quản lý kho</h1>
      </header>
      <div className="page-content">
        {!phieuMo && (
          <div className="kho-tabs">
            {tabs.map((t) => (
              <button key={t.ma} className={`kho-tab ${tab === t.ma ? 'on' : ''}`} onClick={() => setTab(t.ma)}>
                {t.ten}{t.ma === 'phieu' && choDuyet.length > 0 && <span className="kho-huy-hieu">{choDuyet.length}</span>}
              </button>
            ))}
          </div>
        )}
        {phieuMo && <XemPhieu id={phieuMo} vaiTro={vaiTro} tenDangNhap={user?.username} moPhieu={setPhieuMo} dong={dongPhieu} />}
        {!phieuMo && tab === 'pc' && <PhaChe moPhieu={setPhieuMo} />}
        {!phieuMo && tab === 'nh' && <NhanHang moPhieu={setPhieuMo} />}
        {!phieuMo && tab === 'ps' && <PhatSinh moPhieu={setPhieuMo} />}
        {!phieuMo && tab === 'dh' && <DatHang moPhieu={setPhieuMo} />}
        {!phieuMo && tab === 'ton' && <TonKho />}
        {!phieuMo && tab === 'phieu' && <DsPhieu choDuyet={quanLy ? choDuyet : []} moPhieu={setPhieuMo} />}
        {!phieuMo && tab === 'nl' && <NguyenLieu vaiTro={vaiTro} />}
        {!phieuMo && tab === 'sp' && <SanPham vaiTro={vaiTro} />}
        {!phieuMo && tab === 'dm' && <DinhMuc vaiTro={vaiTro} />}
        {!phieuMo && tab === 'sx' && <NhapSx />}
      </div>
    </div>
  );
}
