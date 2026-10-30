/**
 * Màn nhập PIN khách 4 số (DAC_TA_BAN_HANG_2410 mục 1.12). Nhân viên xoay máy cho khách tự bấm.
 * PIN KHÔNG kiểm ở đây: cha gửi kèm yêu cầu tạo phiên, máy chủ kiểm (băm, khoá 15 phút). Chế độ "dat": khách chưa có PIN → gõ 2 lần
 * rồi cha gọi datPin (chỉ đặt lần đầu ở quầy). Bỏ trừ tài khoản = nút Bỏ.
 */
import { useState } from 'react';
import { datPinHopLe, DO_DAI_PIN, nhapPhim } from './tinh';

const PHIM = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
const LOI_DAT = { PIN_KHONG_HOP_LE: 'PIN phải đúng 4 chữ số', PIN_KHONG_KHOP: 'Hai lần nhập chưa giống nhau — nhập lại từ đầu' };

export default function ManPin({ tieuDe, loi, kieu, dangGui, onXong, onDat, onBo }) {
  const [pin, setPin] = useState('');
  const [lanMot, setLanMot] = useState(null);                 // kiểu "dat": PIN lần 1 đã gõ
  const [loiDat, setLoiDat] = useState('');
  const dat = kieu === 'dat';

  const bam = (p) => { if (!dangGui) setPin((c) => nhapPhim(c, p)); };
  const xacNhan = () => {
    if (pin.length !== DO_DAI_PIN || dangGui) return;
    if (!dat) { onXong(pin); setPin(''); return; }
    if (lanMot === null) { setLanMot(pin); setPin(''); setLoiDat(''); return; }
    const sai = datPinHopLe(lanMot, pin);
    if (sai) { setLoiDat(LOI_DAT[sai]); setLanMot(null); setPin(''); return; }
    onDat(lanMot, pin);
  };

  const huongDan = dat
    ? (lanMot === null ? 'Khách chưa có PIN — mời khách đặt PIN 4 số' : 'Nhập lại PIN lần nữa')
    : 'Mời khách nhập PIN 4 số';
  return (
    <div className="bh-lop" style={{ alignItems: 'center' }}>
      <div className="bh-khung bh-noi" style={{ textAlign: 'center' }}>
        <b>{tieuDe}</b>
        <div className="bh-ghi-chu-ngu">Xoay máy cho khách tự nhập</div>
        <div>{huongDan}</div>
        <div className="bh-so-lon" style={{ textAlign: 'center', letterSpacing: '0.6rem' }} aria-label="PIN">{'●'.repeat(pin.length) || ' '}</div>
        {(loiDat || loi) && <div className="bh-loi"><span>{loiDat || loi}</span></div>}
        <div className="bh-phim">
          {PHIM.map((p, i) => (p ? <button key={p} disabled={dangGui} onClick={() => bam(p)}>{p}</button> : <span key={`trong${i}`} />))}
        </div>
        <button className="bh-nut bh-xanh" disabled={dangGui || pin.length !== DO_DAI_PIN} onClick={xacNhan}>{dat && lanMot === null ? 'Tiếp' : dat ? 'Đặt PIN' : 'Xác nhận'}</button>
        <button className="bh-nut bh-phu" disabled={dangGui} onClick={onBo}>Bỏ trừ tài khoản</button>
      </div>
    </div>
  );
}
