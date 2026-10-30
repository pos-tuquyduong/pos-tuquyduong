/**
 * Màn "Đã thanh toán · đơn #<số>" (DAC_TA_BAN_HANG_2410 mục 1.16). Hoá đơn vẽ bằng thành phần HD-1 từ GET /hoa-don/:id (cùng số với bản in):
 * tab Tờ khách · Tờ lưu · Tem ly, chọn 2 tờ (mặc định theo cài đặt) hoặc 1 tờ cho riêng đơn này. Nút In mở InvoicePrint sẵn có ở chế độ tự in
 * (đường in duy nhất của quầy — lỗi máy in không đụng tới đơn). Lưới món khoá tới khi In xong (cờ daIn do cha giữ).
 */
import { useEffect, useMemo, useState } from 'react';
import InvoicePrint from '../../components/InvoicePrint';
import { HoaDonTo } from '../../components/InvoicePreview';
import { hoaDonApi } from '../../utils/api';
import { danhSachTo, soToTuCaiDat } from '../../utils/hoaDon';
import { dungBoIn, KHOA_BO_IN } from '../../utils/inPhieu';

const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const TAB = [['khach', 'Tờ khách'], ['luu', 'Tờ lưu'], ['tem', 'Tem ly']];

/** Cài đặt cho riêng lần in này: số tờ đã chọn + tự mở in (bấm In là in ngay, không hỏi lại). */
function caiDatLanIn(caiDat, soTo) {
  let luu = {};
  try { luu = JSON.parse(caiDat?.[KHOA_BO_IN] || '{}') || {}; } catch { /* hỏng → mặc định */ }
  return { ...caiDat, invoice_so_to: String(soTo), [KHOA_BO_IN]: JSON.stringify({ ...luu, tu_mo: true }) };
}

export default function ManKetThuc({ don, caiDatHoaDon, nhomTheoMa, daIn, onIn, onDonMoi }) {
  const { order, successInfo } = don;
  const [hd, setHd] = useState(null);
  const [loiHd, setLoiHd] = useState(false);
  const [tab, setTab] = useState('khach');
  const [soTo, setSoTo] = useState(() => soToTuCaiDat(caiDatHoaDon));
  const [moIn, setMoIn] = useState(false);

  useEffect(() => {
    let huy = false;
    hoaDonApi.lay(order.id).then((r) => { if (!huy) setHd(r.hoa_don); }).catch(() => { if (!huy) setLoiHd(true); });
    return () => { huy = true; };
  }, [order.id]);

  const cacTo = useMemo(() => (hd ? danhSachTo(hd, caiDatHoaDon, { inLai: daIn, soTo }) : []), [hd, caiDatHoaDon, daIn, soTo]);
  const soTem = useMemo(() => dungBoIn(order, caiDatHoaDon, { nhomTheoMa, loai: ['tem'] })[0]?.trang.length || 0, [order, caiDatHoaDon, nhomTheoMa]);
  const soDon = order.invoice_number || order.code;
  const tabDangXem = tab === 'luu' && soTo === 1 ? 'khach' : tab;

  return (
    <div className="bh-xong">
      <h2>Đã thanh toán · đơn #{soDon}</h2>
      <div>{order.customer_name} · Tổng {vnd(order.total)}</div>
      {successInfo.paymentMethod === 'cash' && (
        <div className="bh-tra-lai">Trả lại khách<b>{vnd(successInfo.change)}</b></div>
      )}
      {successInfo.balanceUsed > 0 && (
        <div className="bh-ghi-chu-ngu">Trừ tài khoản {vnd(successInfo.balanceUsed)}{successInfo.balanceAfter !== undefined ? ` · còn ${vnd(successInfo.balanceAfter)}` : ''}</div>
      )}
      <div className="bh-chip-hang">
        {TAB.filter(([ma]) => !(ma === 'luu' && soTo === 1)).map(([ma, ten]) => (
          <button key={ma} className={`bh-chip${tabDangXem === ma ? ' bh-chon' : ''}`} onClick={() => setTab(ma)}>{ten}</button>
        ))}
      </div>
      <div style={{ maxHeight: 260, overflowY: 'auto', background: '#e5e7eb', padding: 6, borderRadius: 8, maxWidth: '100%' }}>
        {loiHd && <div className="bh-ghi-chu-ngu">Chưa tải được dữ liệu hoá đơn — vẫn in được bằng bố cục cũ.</div>}
        {!hd && !loiHd && <div className="bh-ghi-chu-ngu">Đang tải hoá đơn…</div>}
        {tabDangXem !== 'tem' && cacTo.filter((t) => t.lien === tabDangXem).map((t) => <HoaDonTo key={t.lien} to={t} size="58mm" logo={caiDatHoaDon.store_logo || ''} />)}
        {tabDangXem === 'tem' && (soTem > 0
          ? <div className="bh-ghi-chu-ngu">{soTem} tem — mỗi ly một tem, in cùng hoá đơn.</div>
          : <div className="bh-ghi-chu-ngu">Đơn này không có tem ly.</div>)}
      </div>
      <div className="bh-chip-hang">
        {[2, 1].map((n) => <button key={n} className={`bh-chip${soTo === n ? ' bh-chon' : ''}`} onClick={() => setSoTo(n)}>{n} tờ</button>)}
      </div>
      <button className="bh-nut" onClick={() => setMoIn(true)}>{daIn ? 'Xem / In lại hoá đơn' : `In hoá đơn (${soTo} tờ) + ${soTem} tem`}</button>
      <button className="bh-nut bh-phu" onClick={onDonMoi}>Đơn mới</button>
      {!daIn && <div className="bh-ghi-chu-ngu">Bấm In để mở lại lưới món. Đơn đã ghi rồi.</div>}
      {moIn && (
        <InvoicePrint
          order={order}
          settings={caiDatLanIn(caiDatHoaDon, soTo)}
          nhomTheoMa={nhomTheoMa}
          successInfo={daIn ? undefined : successInfo}
          inLai={daIn}
          onClose={() => setMoIn(false)}
          onPrintComplete={() => { onIn(); setMoIn(false); }}
        />
      )}
    </div>
  );
}
