/**
 * KHO-1 — màn Quản lý kho. Quyền kiểm ở máy chủ; ở đây chỉ ẩn tab không dùng được.
 * KHO-2a: tab đầu Pha chế (mọi vai trò) · Tồn kho · Phiếu (huy hiệu số phiếu chờ duyệt cho chủ / quản lý — MỘT vòng hỏi 30 s cho cả huy hiệu
 * và khung Chờ duyệt) · Định mức. Mở một phiếu → XemPhieu thay cho nội dung tab.
 * KHO-2b: việc hay dùng lên trước (Nhận hàng, Phát sinh), ít dùng sau (Đặt hàng). Huy hiệu gồm cả DH / PN / PS — quản lý không đếm đơn vượt hạn
 * mức (can_chu_quan: chỉ chủ quán duyệt được).
 * KHO-3a A7: tab "Chưa sẵn sàng bán" (chủ / quản lý) có số đếm; "Mở món" mở thẳng món ở Sản phẩm & công thức.
 * KHO-GON-1: tab ĐẦU "Việc hôm nay" (mọi vai trò; chủ / quản lý: huy hiệu số diễn biến chưa xem — CÙNG vòng hỏi 30 s); "Làm" mở Pha chế hoặc
 * màn Kiểm kê / Nhận bàn giao (kk / bg — không có nút tab riêng); tab "Cài đặt kho" (chủ / quản lý).
 * KHO-GON-2 D3: thẻ nguyên liệu mở từ Tồn kho / Nguyên liệu / dải dưới ngưỡng của Việc hôm nay — ngăn xếp màn `ngan` (thẻ › Nhận hàng …), nút "← màn
 * trước" + dòng đường dẫn; nội dung tab KHÔNG tháo ra khi mở thẻ HOẶC mở phiếu (ẩn bằng display) → quay lại giữ bộ lọc, ô tìm; vị trí cuộn của cửa sổ
 * nhớ lúc mở, trả lại lúc đóng (trang cuộn theo cửa sổ — ẩn danh sách làm trang ngắn lại). Đóng phiếu / thẻ → `lanDong` tăng: màn ghi phiếu (Pha chế,
 * Nhận hàng, Phát sinh, Đặt hàng) dựng lại mới (số mới, mã lần bấm mới), Danh sách phiếu / Tồn kho / Nguyên liệu / Việc hôm nay tải lại số mà GIỮ bộ lọc.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
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
import ChuaSan from './ChuaSan';
import ViecHomNay from './ViecHomNay';
import KiemKe from './KiemKe';
import CaiDatKho from './CaiDatKho';
import TheNguyenLieu from './TheNguyenLieu';   // KHO-GON-2
import './kho.css';
import './inPhieuKho.css';

const HOI_CHO_DUYET_MS = 30000;

export default function Kho() {
  const { user } = useAuth();
  const vaiTro = user?.role;
  const quanLy = vaiTro === 'owner' || vaiTro === 'manager';
  const tabs = [
    { ma: 'viec', ten: 'Việc hôm nay', hien: true },
    { ma: 'pc', ten: 'Pha chế', hien: true },
    { ma: 'nh', ten: 'Nhận hàng', hien: true },
    { ma: 'ps', ten: 'Phát sinh', hien: true },
    { ma: 'ton', ten: 'Tồn kho', hien: true },
    { ma: 'phieu', ten: 'Phiếu', hien: true },
    { ma: 'nl', ten: 'Nguyên liệu', hien: true },
    { ma: 'cs', ten: 'Chưa sẵn sàng bán', hien: quanLy },
    { ma: 'sp', ten: 'Sản phẩm & công thức', hien: quanLy },
    { ma: 'dm', ten: 'Định mức', hien: quanLy },
    { ma: 'dh', ten: 'Đặt hàng', hien: true },
    { ma: 'caidat', ten: 'Cài đặt kho', hien: quanLy },
    { ma: 'sx', ten: 'Nhập từ SX', hien: vaiTro === 'owner' },
  ].filter((t) => t.hien);
  const [tab, setTab] = useState('viec');
  const [soMoi, setSoMoi] = useState(0);   // KHO-GON-1: diễn biến chưa xem của người đang đăng nhập
  const [phieuMo, setPhieuMo] = useState(null);
  const [choDuyet, setChoDuyet] = useState([]);
  const [soChuaSan, setSoChuaSan] = useState(0);
  const [monMo, setMonMo] = useState(null);   // KHO-3a: id món mở từ tab Chưa sẵn sàng bán
  const [ngan, setNgan] = useState([]);   // KHO-GON-2 D3: [{ man: 'the', id, ten }, { man: 'nhan' | 'xuat' | 'chinh', ten }?]
  const [lanDong, setLanDong] = useState(0);   // tăng khi đóng phiếu / thẻ → màn ghi phiếu dựng lại, danh sách tải lại (giữ bộ lọc)
  const cuon = useRef(0);   // vị trí cuộn cửa sổ lúc mở phiếu / thẻ từ danh sách

  const taiChoDuyet = useCallback(() => {
    if (!quanLy) return;
    api.get('/kho/phieu?trang_thai=cho_duyet').then((r) => setChoDuyet(r.phieu.filter((p) => vaiTro === 'owner' || !p.can_chu_quan))).catch(() => {});
    api.get('/kho/dien-bien/so').then((r) => setSoMoi(r.chua_xem)).catch(() => {});   // huy hiệu: lỗi thì giữ số cũ, lần hỏi sau thử lại
  }, [quanLy, vaiTro]);
  useEffect(() => {
    if (quanLy) api.get('/kho/mon-chua-san').then((r) => setSoChuaSan(r.so)).catch(() => {});
  }, [quanLy]);
  useEffect(() => {
    taiChoDuyet();
    const t = setInterval(taiChoDuyet, HOI_CHO_DUYET_MS);
    return () => clearInterval(t);
  }, [taiChoDuyet]);

  const dangMo = !!(phieuMo || ngan.length);
  const nhoCuon = () => { if (!dangMo) cuon.current = window.scrollY; };
  useEffect(() => {
    if (dangMo) window.scrollTo(0, 0);
    else requestAnimationFrame(() => window.scrollTo(0, cuon.current));
  }, [dangMo]);
  const dongPhieu = () => { setPhieuMo(null); taiChoDuyet(); setLanDong((n) => n + 1); };
  const moPhieuTuDs = (id) => { nhoCuon(); setPhieuMo(id); };
  const moThe = (id, ten) => { nhoCuon(); setNgan([{ man: 'the', id, ten }]); };
  const luiNgan = () => { if (ngan.length === 1) setLanDong((n) => n + 1); setNgan(ngan.slice(0, -1)); };
  const tenTab = tabs.find((t) => t.ma === tab)?.ten || 'Kho';
  const dinh = ngan[ngan.length - 1];
  const doiTab = (ma) => { if (ngan.length) setLanDong((n) => n + 1); setNgan([]); setTab(ma); };

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">📦 Quản lý kho</h1>
      </header>
      <div className="page-content">
        {!phieuMo && !ngan.length && (
          <div className="kho-tabs">
            {tabs.map((t) => (
              <button key={t.ma} className={`kho-tab ${tab === t.ma ? 'on' : ''}`} onClick={() => doiTab(t.ma)}>
                {t.ten}{t.ma === 'phieu' && choDuyet.length > 0 && <span className="kho-huy-hieu">{choDuyet.length}</span>}
                {t.ma === 'cs' && soChuaSan > 0 && <span className="kho-huy-hieu">{soChuaSan}</span>}
                {t.ma === 'viec' && soMoi > 0 && <span className="kho-huy-hieu">{soMoi}</span>}
              </button>
            ))}
          </div>
        )}
        {phieuMo && <XemPhieu id={phieuMo} vaiTro={vaiTro} tenDangNhap={user?.username} moPhieu={setPhieuMo} dong={dongPhieu} />}
        {!phieuMo && dinh && (
          <div>
            <button className="btn btn-outline" onClick={luiNgan}>← {ngan.length > 1 ? ngan[ngan.length - 2].ten : tenTab}</button>
            <div className="kho-duong-dan">{[tenTab, ...ngan.map((n) => n.ten)].join(' › ')}</div>
            <TheNguyenLieu id={ngan[0].id} man={dinh.man === 'the' ? null : dinh.man} moMan={(man, ten) => setNgan([ngan[0], { man, ten }])} veThe={() => setNgan([ngan[0]])} />
          </div>
        )}
        <div style={{ display: ngan.length || phieuMo ? 'none' : undefined }}>
        {tab === 'viec' && <ViecHomNay vaiTro={vaiTro} moTab={setTab} doiSoMoi={setSoMoi} moThe={moThe} lamMoi={lanDong} />}
        {(tab === 'kk' || tab === 'bg') && <KiemKe key={tab} cheDo={tab === 'kk' ? 'kiemke' : 'bangiao'} xong={() => setTab('viec')} />}
        {tab === 'caidat' && <CaiDatKho vaiTro={vaiTro} />}
        {tab === 'pc' && <PhaChe key={lanDong} moPhieu={moPhieuTuDs} />}
        {tab === 'nh' && <NhanHang key={lanDong} moPhieu={moPhieuTuDs} />}
        {tab === 'ps' && <PhatSinh key={lanDong} moPhieu={moPhieuTuDs} />}
        {tab === 'dh' && <DatHang key={lanDong} moPhieu={moPhieuTuDs} />}
        {tab === 'ton' && <TonKho moThe={moThe} lamMoi={lanDong} />}
        {tab === 'phieu' && <DsPhieu choDuyet={quanLy ? choDuyet : []} moPhieu={moPhieuTuDs} lamMoi={lanDong} />}
        {tab === 'nl' && <NguyenLieu vaiTro={vaiTro} moThe={moThe} lamMoi={lanDong} />}
        {tab === 'cs' && <ChuaSan doiSo={setSoChuaSan} moSanPham={(id) => { setMonMo(id); setTab('sp'); }} />}
        {tab === 'sp' && <SanPham vaiTro={vaiTro} moId={monMo} />}
        {tab === 'dm' && <DinhMuc vaiTro={vaiTro} />}
        {tab === 'sx' && <NhapSx />}
        </div>
      </div>
    </div>
  );
}
