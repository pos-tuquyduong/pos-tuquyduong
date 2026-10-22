export const CAC_TAB = [
  ['menu', 'Menu'],
  ['diem', 'Điểm'],
  ['voucher', 'Voucher'],
  ['don', 'Đơn'],
  ['toi', 'Tôi'],
];

export default function ThanhTab({ tab, chon }) {
  return (
    <nav className="tab">
      {CAC_TAB.map(([ma, ten]) => (
        <button key={ma} className={ma === tab ? 'dang-chon' : ''} onClick={() => chon(ma)}>{ten}</button>
      ))}
    </nav>
  );
}
