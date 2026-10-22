import { layMenu } from '../api.js';
import { dungTai } from '../dungTai.js';
import { dinhDangGia, dinhDangNgay } from '../dinhDang.js';
import TrangTai from '../components/TrangTai.jsx';

// Món lấy tồn từ bản lưu (ton_cu) thì nói rõ "theo số lúc …" — không hiện tồn thật, không bịa (CLAUDE.md §5.8).
function nhomTheoTen(ds) {
  const ban = new Map();
  for (const m of ds) {
    const ten = m.nhom || 'Khác';
    if (!ban.has(ten)) ban.set(ten, []);
    ban.get(ten).push(m);
  }
  return [...ban];
}

function Mon({ m }) {
  return (
    <div className="dong">
      <div>
        <div>{m.ten}</div>
        {m.ton_cu && m.ton_luc && <div className="phu">theo số lúc {dinhDangNgay(m.ton_luc)}</div>}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div>{dinhDangGia(m.gia)}</div>
        {m.con_hang === true && <div className="nhan-tot">Còn hàng</div>}
        {m.con_hang === false && <div className="nhan-xau">Hết hàng</div>}
      </div>
    </div>
  );
}

export default function Menu() {
  const tai = dungTai(layMenu);
  return (
    <TrangTai tai={tai}>
      {(dl) => (
        <div>
          <h2>Menu</h2>
          {dl.data.length === 0 && <div className="giua">Chưa có món nào.</div>}
          {nhomTheoTen(dl.data).map(([nhom, mon]) => (
            <div key={nhom}>
              <div className="nhom">{nhom}</div>
              <div className="the">{mon.map((m) => <Mon key={m.ma} m={m} />)}</div>
            </div>
          ))}
        </div>
      )}
    </TrangTai>
  );
}
