/**
 * POS - Balance Page (Quản lý số dư)
 * Updated: Dùng walletsApi mới
 */

import { useState } from 'react';
import { walletsApi, customersV2Api } from '../utils/api';
import { Search, Plus, Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default function Balance() {
  const [customer, setCustomer] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [searchPhone, setSearchPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Topup form
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const normalizePhone = (phone) => {
    let p = phone.replace(/\D/g, '');
    if (p.startsWith('84')) p = '0' + p.slice(2);
    return p;
  };

  const searchCustomer = async () => {
    if (!searchPhone.trim()) return;

    setLoading(true);
    setError('');

    try {
      const phone = normalizePhone(searchPhone.trim());

      // Lấy thông tin khách từ V2 API (merge SX + POS)
      const customerData = await customersV2Api.get(phone);
      setCustomer(customerData);

      // Lấy wallet
      const walletData = await walletsApi.get(phone);
      setWallet(walletData);

      // Lấy transactions
      const txData = await walletsApi.transactions(phone);
      setTransactions(txData.transactions || []);
    } catch (err) {
      setError('Không tìm thấy khách hàng');
      setCustomer(null);
      setWallet(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async (e) => {
    e.preventDefault();

    const amount = parseInt(topupAmount);
    if (!amount || amount <= 0) {
      setError('Số tiền không hợp lệ');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await walletsApi.topup({
        phone: customer.phone,
        amount,
        customer_name: customer.name,
        payment_method: paymentMethod,
        notes
      });

      setSuccess(`Đã nạp ${amount.toLocaleString()}đ thành công!`);
      setShowTopup(false);
      setTopupAmount('');
      setNotes('');

      // Refresh data
      const walletData = await walletsApi.get(customer.phone);
      setWallet(walletData);
      const txData = await walletsApi.transactions(customer.phone);
      setTransactions(txData.transactions || []);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const quickAmounts = [100000, 200000, 500000, 1000000, 2000000];

  const formatPrice = (price) => (price || 0).toLocaleString() + 'đ';

  const formatDate = (date) => new Date(date).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getTypeLabel = (type) => {
    switch(type) {
      case 'topup': return { label: 'Nạp tiền', color: '#22c55e', icon: ArrowUpCircle };
      case 'purchase': return { label: 'Thanh toán', color: '#ef4444', icon: ArrowDownCircle };
      case 'payment': return { label: 'Thanh toán', color: '#ef4444', icon: ArrowDownCircle };
      case 'refund': return { label: 'Hoàn tiền', color: '#3b82f6', icon: ArrowUpCircle };
      case 'adjust': return { label: 'Điều chỉnh', color: '#64748b', icon: Wallet };
      default: return { label: type, color: '#64748b', icon: Wallet };
    }
  };

  const currentBalance = wallet?.balance || customer?.balance || 0;

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">💰 Quản lý số dư</h1>
      </header>

      <div className="page-content">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Search */}
        <div className="card mb-2">
          <div className="form-label">Tìm khách hàng</div>
          <div className="flex gap-1">
            <input
              type="text"
              className="input"
              placeholder="Nhập SĐT..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchCustomer()}
            />
            <button className="btn btn-primary" onClick={searchCustomer} disabled={loading}>
              <Search size={16} /> {loading ? 'Đang tìm...' : 'Tìm'}
            </button>
          </div>
        </div>

        {customer && (
          <div className="grid grid-2 gap-2">
            {/* Customer Info & Balance */}
            <div>
              <div className="card">
                <div className="flex flex-between flex-center mb-2">
                  <div>
                    <div className="font-bold text-lg">{customer.name || 'Khách lẻ'}</div>
                    <div className="text-gray">{customer.phone}</div>
                    {customer.is_pending && (
                      <span className="badge badge-warning mt-1">Chờ đồng bộ</span>
                    )}
                    {customer.is_synced && (
                      <span className="badge badge-success mt-1">Đã đồng bộ SX</span>
                    )}
                  </div>
                </div>

                <div className="balance-display">
                  <div className="text-sm" style={{ opacity: 0.8 }}>Số dư hiện tại</div>
                  <div className="balance-amount">{formatPrice(currentBalance)}</div>
                </div>

                {wallet && (
                  <div className="flex gap-2 mt-2" style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    <div>Tổng nạp: {formatPrice(wallet.total_topup)}</div>
                    <div>Đã dùng: {formatPrice(wallet.total_spent)}</div>
                  </div>
                )}

                <div className="flex gap-1 mt-2">
                  <button 
                    className="btn btn-success btn-lg"
                    style={{ flex: 1 }}
                    onClick={() => setShowTopup(true)}
                  >
                    <Plus size={18} /> Nạp tiền
                  </button>
                </div>
              </div>

              {/* Topup Form */}
              {showTopup && (
                <div className="card mt-2">
                  <div className="card-title">Nạp tiền</div>
                  <form onSubmit={handleTopup}>
                    <div className="form-group">
                      <label className="form-label">Số tiền</label>
                      <input
                        type="number"
                        className="input"
                        value={topupAmount}
                        onChange={(e) => setTopupAmount(e.target.value)}
                        placeholder="Nhập số tiền"
                      />
                    </div>

                    <div className="flex gap-1 mb-2" style={{ flexWrap: 'wrap' }}>
                      {quickAmounts.map(amount => (
                        <button
                          key={amount}
                          type="button"
                          className="btn btn-outline"
                          onClick={() => setTopupAmount(amount.toString())}
                        >
                          {(amount / 1000)}k
                        </button>
                      ))}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Phương thức</label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className={`btn ${paymentMethod === 'cash' ? 'btn-primary' : 'btn-outline'}`}
                          style={{ flex: 1 }}
                          onClick={() => setPaymentMethod('cash')}
                        >
                          💵 Tiền mặt
                        </button>
                        <button
                          type="button"
                          className={`btn ${paymentMethod === 'transfer' ? 'btn-primary' : 'btn-outline'}`}
                          style={{ flex: 1 }}
                          onClick={() => setPaymentMethod('transfer')}
                        >
                          🏦 Chuyển khoản
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Ghi chú</label>
                      <input
                        type="text"
                        className="input"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    {topupAmount && (
                      <div className="text-sm mb-2" style={{ color: '#22c55e' }}>
                        Số dư sau nạp: {formatPrice(currentBalance + parseInt(topupAmount))}
                      </div>
                    )}

                    <div className="flex gap-1">
                      <button type="button" className="btn btn-outline" onClick={() => setShowTopup(false)}>
                        Hủy
                      </button>
                      <button type="submit" className="btn btn-success" disabled={submitting}>
                        {submitting ? 'Đang nạp...' : 'Xác nhận nạp tiền'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Transaction History */}
            <div className="card">
              <div className="card-title">Lịch sử giao dịch</div>
              {transactions.length === 0 ? (
                <div className="text-gray text-sm">Chưa có giao dịch</div>
              ) : (
                <div>
                  {transactions.map(tx => {
                    const typeInfo = getTypeLabel(tx.type);
                    const Icon = typeInfo.icon;
                    return (
                      <div key={tx.id} style={{ 
                        padding: '0.75rem 0', 
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div className="flex flex-center gap-1">
                          <Icon size={20} style={{ color: typeInfo.color }} />
                          <div>
                            <div className="font-bold" style={{ fontSize: '0.875rem' }}>
                              {typeInfo.label}
                            </div>
                            <div className="text-sm text-gray">
                              {formatDate(tx.created_at)}
                            </div>
                            {tx.notes && (
                              <div className="text-sm text-gray">{tx.notes}</div>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="font-bold" style={{ 
                            color: tx.amount >= 0 ? '#22c55e' : '#ef4444' 
                          }}>
                            {tx.amount >= 0 ? '+' : ''}{formatPrice(tx.amount)}
                          </div>
                          <div className="text-sm text-gray">
                            → {formatPrice(tx.balance_after)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
