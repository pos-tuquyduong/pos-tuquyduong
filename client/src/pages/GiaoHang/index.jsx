/**
 * GIAO-1 — màn "Giao hàng" (phiếu mục E, chủ quán duyệt hình mẫu 05.11): 4 cột màu khác nhau Mới · Đang pha · Đợi tài xế · Đang giao (điện thoại:
 * 4 tab). Mỗi thẻ: số HD, tên, số món, km và MỘT nút chính = việc tiếp theo; bấm thẻ → chi tiết để quyết. Máy chủ quyết mọi thứ (utils/giaoHang.js):
 * màn này chỉ hiển thị + gửi yêu cầu. Tới giờ gợi ý gọi tài xế → thẻ đổi màu + kêu nhẹ (không tự gọi). Có tài xế → máy giành được thì in tem túi
 * MỘT lần (lỗi máy in không tự in lại — nút "In tem" trong chi tiết, tờ in lại ghi "IN LẠI · LẦN n").
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { giaoHangApi } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { keuChuong } from '../../components/DonAppNoi';
import { taiLieuIn, inQuaIframe } from '../../components/InPhieu';
import './giaoHang.css';

const COT = [['moi', 'Mới'], ['dang_pha', 'Đang pha'], ['doi_tai_xe', 'Đợi tài xế'], ['dang_giao', 'Đang giao']];
const HOI_MS = 15000;   // hỏi máy chủ — máy chủ so giờ (toi_gio, nhac, tim_lau), màn không dùng đồng hồ máy quầy
const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const gio = (luc) => (luc ? String(luc).slice(11, 16) : '');
const thoat = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Nút chính của thẻ: { chu, viec } — viec null = không bấm được (chỉ báo). */
function nutChinh(c, toiGio) {
  if (c.trang_thai === 'moi') return { chu: 'Nhận đơn', viec: 'nhan' };
  if (c.trang_thai === 'dang_pha') return { chu: toiGio ? 'Gọi tài xế ngay' : 'Gọi tài xế', viec: 'goi' };
  if (c.trang_thai === 'dang_goi') return c.loi ? { chu: 'Gọi lại', viec: 'goi' } : { chu: 'Đang gọi xe…', viec: null };
  if (c.trang_thai === 'chuyen_huy') return { chu: 'Gọi lại', viec: 'goi' };
  if (c.trang_thai === 'tim_xe') return c.tim_lau ? { chu: 'Tìm lại', viec: 'goi' } : { chu: 'Đang tìm xe…', viec: null };
  if (c.trang_thai === 'doi_tai_xe') return { chu: c.in_tem_luc ? 'Chờ tài xế lấy' : 'In tem túi', viec: c.in_tem_luc ? null : 'tem' };
  return { chu: c.trang_thai === 'giao_loi' ? 'Giao lỗi' : 'Đang giao', viec: null };
}

function inTemTui(c, lan) {
  const dong = (a, b) => `<div><b>${thoat(a)}</b> ${thoat(b)}</div>`;
  const than = `<div class="trang" style="font-family:Arial,sans-serif;font-size:12px;padding:2mm">
    <div style="font-size:16px;font-weight:bold">GIAO HÀNG · ${thoat(c.code)}</div>
    ${lan > 1 ? `<div style="border:1px solid #000;display:inline-block;padding:0 2mm"><b>IN LẠI · LẦN ${lan}</b></div>` : ''}
    ${dong('Người nhận:', c.ten)}${dong('SĐT:', c.sdt)}${dong('Địa chỉ:', c.dia_chi)}${c.ghi_chu ? dong('Ghi chú:', c.ghi_chu) : ''}
    ${dong('Số món:', c.so_mon)}${dong('Tài xế:', [c.tai_xe?.ten, c.tai_xe?.sdt].filter(Boolean).join(' · '))}${dong('Biển số:', c.tai_xe?.bien_so || '')}</div>`;
  return inQuaIframe(taiLieuIn('Tem giao ' + c.code, than, '80mm'));
}

export default function GiaoHang() {
  const { user } = useAuth();
  const quanLy = ['owner', 'manager'].includes(user?.role);
  const [ds, setDs] = useState([]);
  const [loi, setLoi] = useState('');
  const [tab, setTab] = useState('dang_pha');
  const [moThe, setMoThe] = useState(null);           // order_id đang xem chi tiết
  const [dang, setDang] = useState(false);
  const daKeu = useRef(new Set());

  const tai = useCallback(async () => {
    try { setDs((await giaoHangApi.danhSach()).chuyen || []); setLoi(''); } catch (e) { setLoi('Không tải được danh sách giao: ' + e.message); }
  }, []);
  useEffect(() => {
    tai();
    const h = setInterval(tai, HOI_MS);
    return () => clearInterval(h);
  }, [tai]);

  // Kêu nhẹ: tới giờ gợi ý gọi tài xế, hoặc quá phút nhắc mà chưa gọi (mỗi thẻ một lần mỗi loại).
  useEffect(() => {
    for (const c of ds) {
      for (const [loai, toi] of [['gio', c.toi_gio], ['nhac', c.nhac]]) {
        const k = `${c.order_id}:${loai}`;
        if (toi && !daKeu.current.has(k)) { daKeu.current.add(k); keuChuong(loai === 'gio' ? 'ding' : 'bip'); }
      }
    }
  });
  // Có tài xế → máy giành được thì in tem túi một lần.
  useEffect(() => {
    for (const c of ds.filter((x) => x.trang_thai === 'doi_tai_xe' && !x.in_tem_luc)) {
      giaoHangApi.inTem(c.order_id).then((r) => { if (r.duoc) return inTemTui(c, r.lan).then(tai); return null; }).catch(() => {});
    }
  }, [ds]);   // eslint-disable-line react-hooks/exhaustive-deps -- chỉ khi danh sách đổi

  const lam = async (c, viec, them = {}) => {
    if (dang) return;
    setDang(true); setLoi('');
    try {
      if (viec === 'nhan') await giaoHangApi.nhan(c.order_id);
      else if (viec === 'goi') await giaoHangApi.goiXe(c.order_id, them.loaiXe);
      else if (viec === 'tem' || viec === 'tem_lai') {
        const r = await giaoHangApi.inTem(c.order_id, viec === 'tem_lai');
        if (r.duoc) await inTemTui(c, r.lan);
      } else if (viec === 'huy_chuyen') {
        const lyDo = window.prompt('Lý do huỷ chuyến Ahamove (phí huỷ nếu có quán chịu):');
        if (!lyDo) return;
        await giaoHangApi.huyChuyen(c.order_id, lyDo);
      } else if (viec === 'huy_don') {
        const lyDo = window.prompt(c.trang_thai === 'moi' ? 'Lý do từ chối đơn:' : 'Lý do huỷ đơn giao:');
        if (!lyDo) return;
        await giaoHangApi.huyDon(c.order_id, lyDo, them.doDaPha);
        setMoThe(null);
      }
      await tai();
    } catch (e) { setLoi(e.message || 'Không làm được'); await tai(); }
    finally { setDang(false); }
  };

  const the = (c) => {
    const toiGio = c.toi_gio;
    const nut = nutChinh(c, toiGio);
    const canh = c.tim_lau || c.trang_thai === 'chuyen_huy' || c.trang_thai === 'giao_loi' || (c.loi && c.trang_thai !== 'tim_xe');
    return (
      <div key={c.order_id} className={`gh-the${toiGio ? ' gh-toi-gio' : ''}${c.nhac ? ' gh-nhac' : ''}${canh ? ' gh-do' : ''}`} onClick={() => setMoThe(c.order_id)}>
        <div className="gh-the-dau"><b>{c.code}</b><span>{c.km} km</span></div>
        <div>{c.ten} · {c.so_mon} món</div>
        {c.goi_luc_goi_y && <div className="gh-phu">Gọi tài xế lúc {gio(c.goi_luc_goi_y)}</div>}
        {c.tai_xe?.ten && <div className="gh-phu">🛵 {c.tai_xe.ten}{c.tai_xe.bien_so ? ` · ${c.tai_xe.bien_so}` : ''}</div>}
        {c.chenh > 0 && <div className="gh-phu">Quán bù {vnd(c.chenh)}</div>}
        {c.loi && <div className="gh-loi">{c.loi}</div>}
        <button className="gh-nut" disabled={!nut.viec || dang} onClick={(e) => { e.stopPropagation(); lam(c, nut.viec); }}>{nut.chu}</button>
      </div>
    );
  };

  const ct = ds.find((x) => x.order_id === moThe);
  const daPha = ct && ['dang_pha', 'chuyen_huy'].includes(ct.trang_thai);
  return (
    <div className="gh">
      <div className="gh-dau"><h2>Giao hàng · Ahamove</h2><button className="gh-nut-phu" onClick={tai}>Tải lại</button></div>
      {loi && <div className="gh-loi gh-loi-to">{loi}</div>}
      <div className="gh-tab">
        {COT.map(([k, ten]) => <button key={k} className={`gh-tab-${k}${tab === k ? ' gh-chon' : ''}`} onClick={() => setTab(k)}>{ten} ({ds.filter((c) => c.cot === k).length})</button>)}
      </div>
      <div className="gh-cot-bao">
        {COT.map(([k, ten]) => (
          <div key={k} className={`gh-cot gh-cot-${k}${tab === k ? ' gh-hien' : ''}`}>
            <div className="gh-cot-ten">{ten} · {ds.filter((c) => c.cot === k).length}</div>
            {ds.filter((c) => c.cot === k).map(the)}
          </div>
        ))}
      </div>
      {ct && (
        <div className="gh-nen" onClick={() => setMoThe(null)}>
          <div className="gh-chi-tiet" onClick={(e) => e.stopPropagation()}>
            <div className="gh-the-dau"><b>{ct.code}</b><button className="gh-nut-phu" onClick={() => setMoThe(null)}>Đóng</button></div>
            {ct.mon.map((m, i) => <div key={i}>{m.sl} x {m.ten}{m.ghi_chu && <div className="gh-phu">↳ {m.ghi_chu}</div>}</div>)}
            <hr />
            <div>Người nhận: <b>{ct.ten}</b> · <a href={`tel:${ct.sdt}`}>{ct.sdt}</a></div>
            <div>Địa chỉ: {ct.dia_chi} · {ct.km} km · {ct.loai_xe}</div>
            {ct.ghi_chu && <div>Ghi chú tài xế: {ct.ghi_chu}</div>}
            <div>Phí giao khách trả: {vnd(ct.phi_khach)}{ct.phi_that != null && <> · phí Ahamove {vnd(ct.phi_that)}{ct.chenh ? ` (quán ${ct.chenh > 0 ? 'bù' : 'dư'} ${vnd(Math.abs(ct.chenh))})` : ''}</>}</div>
            <div>Tổng đơn {vnd(ct.tong)} · đã trả bằng {ct.thanh_toan}</div>
            {ct.tai_xe?.ten && <div>Tài xế: {ct.tai_xe.ten} · <a href={`tel:${ct.tai_xe.sdt}`}>{ct.tai_xe.sdt}</a> · {ct.tai_xe.bien_so || 'chưa có biển số'}</div>}
            {ct.phi_huy > 0 && <div>Phí huỷ chuyến (quán chịu): {vnd(ct.phi_huy)}</div>}
            {ct.loi && <div className="gh-loi">{ct.loi}</div>}
            <div className="gh-hang-nut">
              {nutChinh(ct, false).viec && <button className="gh-nut" disabled={dang} onClick={() => lam(ct, nutChinh(ct, false).viec)}>{nutChinh(ct, false).chu}</button>}
              {(ct.tim_lau || ct.trang_thai === 'chuyen_huy') && (
                <button className="gh-nut-phu" disabled={dang} onClick={() => lam(ct, 'goi', { loaiXe: ct.loai_xe === 'HAN-BIKE' ? 'HAN-EXPRESS' : 'HAN-BIKE' })}>
                  Tìm lại bằng {ct.loai_xe === 'HAN-BIKE' ? 'HAN-EXPRESS' : 'HAN-BIKE'}
                </button>
              )}
              {['doi_tai_xe', 'dang_giao'].includes(ct.trang_thai) && <button className="gh-nut-phu" disabled={dang} onClick={() => lam(ct, 'tem_lai')}>In lại tem túi</button>}
              {quanLy && ['tim_xe', 'doi_tai_xe'].includes(ct.trang_thai) && <button className="gh-nut-do" disabled={dang} onClick={() => lam(ct, 'huy_chuyen')}>Huỷ chuyến</button>}
              {quanLy && ct.trang_thai === 'moi' && <button className="gh-nut-do" disabled={dang} onClick={() => lam(ct, 'huy_don')}>Từ chối</button>}
              {quanLy && daPha && (
                <>
                  <span className="gh-phu">Huỷ đơn — đồ đã pha:</span>
                  <button className="gh-nut-do" disabled={dang} onClick={() => lam(ct, 'huy_don', { doDaPha: 'dung_lai' })}>Dùng cho đơn khác</button>
                  <button className="gh-nut-do" disabled={dang} onClick={() => lam(ct, 'huy_don', { doDaPha: 'bo_di' })}>Bỏ đi</button>
                </>
              )}
              {ct.trang_thai === 'dang_giao' && <span className="gh-phu">Tài xế đã lấy hàng — không huỷ trên máy (gọi tài xế / Ahamove nếu có sự cố)</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
