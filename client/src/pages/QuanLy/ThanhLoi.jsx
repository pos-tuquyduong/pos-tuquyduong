/**
 * Thanh lối phụ phía trên một màn đã có (BH-2): Đơn hàng → Hoàn tiền, Khách hàng → Số dư. Bọc ngoài màn ở App.jsx nên không phải sửa màn.
 * Quyền như mục menu cũ (approve_refund / view_customer_balance); không có quyền thì không hiện gì.
 */
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { loiThem } from './menu';

export default function ThanhLoi({ man, children }) {
  const { hasPermission } = useAuth();
  const loi = loiThem(man, hasPermission);
  return (
    <>
      {loi.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
          {loi.map((l) => <Link key={l.to} to={l.to} className="btn btn-outline">{l.ten} →</Link>)}
        </div>
      )}
      {children}
    </>
  );
}
