/**
 * POS - Balance Page (Quản lý số dư)
 * Hiện danh sách khách + số dư + nạp tiền + lịch sử giao dịch
 */

import { useState, useEffect } from 'react';
import { walletsApi, customersV2Api } from '../utils/api';
import { hienNgayGio } from '../utils/ngayVN';
import { Search, RefreshCw, Plus, X, History, Wallet } from 'lucide-react';

export default function Balance() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ total: 0, hasBalance: 0, totalBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Topup modal
  const [showTopup, setShowTopup] = useState(false);
  const [topupData, setTopupData] = useState({ phone: '', name: '', amount: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  // History modal
  const [showHistory, setShowHistory] = useState(false);
  const [historyPhone, setHistoryPhone] = useState('');
  const [historyName, setHistoryName] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Adjust modal (chỉ owner)
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustData, setAdjustData] = useState({ phone: "", name: "", amount: "", reason: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Lấy danh sách khách từ V2 API (merge SX + POS)
      const data = await customersV2Api.list();
      const allCustomers = data.customers || [];

      // Tính stats
      const hasBalance = allCustomers.filter(c => c.balance > 0);
      const totalBalance = hasBalance.reduce((sum, c) => sum + (c.balance || 0), 0);

      setStats({
        total: allCustomers.length,
        hasBalance: hasBalance.length,
        totalBalance
      });

      setCustomers(allCustomers);
    } catch (err) {
      setError('Không thể tải dữ liệu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter và search
  const filteredCustomers = customers.filter(c => {
    // Filter
    if (filter === 'has_balance' && (!c.balance || c.balance <= 0)) return false;

    // Search
    if (search) {
      const q = search.toLowerCase();
      if (!c.name?.toLowerCase().includes(q) && !c.phone?.includes(q)) return false;
    }

    return true;
  }).sort((a, b) => (b.balance || 0) - (a.balance || 0)); // Sort theo số dư giảm dần

  const handleSearch = (e) => {
    e.preventDefault();
    // Search đã được xử lý qua filteredCustomers
  };

  // Mở popup nạp tiền
  const openTopup = (customer = null) => {
    if (customer) {
      setTopupData({
        phone: customer.phone || '',
        name: customer.name || '',
        amount: '',
        notes: ''
      });
    } else {
      setTopupData({ phone: '', name: '', amount: '', notes: '' });
    }
    setShowTopup(true);
  };

  // Xử lý nạp tiền
  const handleTopup = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const result = await walletsApi.topup({
        phone: topupData.phone,
        amount: parseInt(topupData.amount),
        customer_name: topupData.name,
        notes: topupData.notes,
        payment_method: 'cash'
      });

      setSuccess(`Đã nạp ${parseInt(topupData.amount).toLocaleString()}đ cho ${topupData.name || topupData.phone}. Số dư mới: ${result.balance.toLocaleString()}đ`);
      setShowTopup(false);
      loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Xem lịch sử giao dịch
  const openHistory = async (customer) => {
    setHistoryPhone(customer.phone);
    setHistoryName(customer.name);
    setShowHistory(true);
    setLoadingHistory(true);

    try {
      const data = await walletsApi.transactions(customer.phone);
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error(err);
      setTransactions([]);
    } finally {
      setLoadingHistory(false);
    }
  };


  // Mở popup điều chỉnh (chỉ owner)
  const openAdjust = (customer) => {
    setAdjustData({
      phone: customer.phone || "",
      name: customer.name || "",
      amount: "",
      reason: ""
    });
    setShowAdjust(true);
  };

  // Xử lý điều chỉnh số dư
  const handleAdjust = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const result = await walletsApi.adjust({
        phone: adjustData.phone,
        amount: parseInt(adjustData.amount),
        customer_name: adjustData.name,
        reason: adjustData.reason
      });

      const sign = result.adjusted > 0 ? "+" : "";
      setSuccess(`Đã điều chỉnh ${sign}${result.adjusted.toLocaleString()}đ cho ${adjustData.name || adjustData.phone}. Số dư mới: ${result.balance.toLocaleString()}đ`);
      setShowAdjust(false);
      loadData();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return hienNgayGio(date, {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMoney = (amount) => {
    return (amount || 0).toLocaleString() + 'đ';
  };

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">💰 Quản lý số dư</h1>
        <div className="flex gap-1">
          <button className="btn btn-outline" onClick={loadData}>
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-primary" onClick={() => openTopup()}>
            <Plus size={16} /> Nạp tiền
          </button>
        </div>
      </header>

      <div className="page-content">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Stats */}
        <div className="grid grid-3 mb-2">
          <div className="stat-card">
            <div className="stat-label">Tổng khách hàng</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card" style={{ background: '#dcfce7' }}>
            <div className="stat-label">💰 Có số dư</div>
            <div className="stat-value">{stats.hasBalance}</div>
          </div>
          <div className="stat-card" style={{ background: '#dbeafe' }}>
            <div className="stat-label">💵 Tổng số dư</div>
            <div className="stat-value">{formatMoney(stats.totalBalance)}</div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="card">
          <form onSubmit={handleSearch} className="flex gap-1 mb-2">
            <input
              type="text"
              className="input"
              placeholder="Tìm theo SĐT hoặc tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              <Search size={16} /> Tìm
            </button>
          </form>

          <div className="flex gap-1 mb-2">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'has_balance', label: '💰 Có số dư' }
            ].map(f => (
              <button
                key={f.key}
                className={`btn ${filter === f.key ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-gray text-center" style={{ padding: '2rem' }}>
              Không có khách hàng nào
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>SĐT</th>
                  <th>Tên KH</th>
                  <th style={{ textAlign: 'right' }}>Số dư</th>
                  <th style={{ width: '120px' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c, idx) => (
                  <tr key={c.phone || idx}>
                    <td className="text-gray">{idx + 1}</td>
                    <td>{c.phone || <span className="text-gray">(trống)</span>}</td>
                    <td>
                      <strong>{c.name || 'Chưa có tên'}</strong>
                      {c.relationship && c.parent_name && (
                        <div className="text-sm text-gray">
                          └ {c.relationship} của {c.parent_name}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-bold" style={{ 
                        color: c.balance > 0 ? '#22c55e' : '#64748b' 
                      }}>
                        {formatMoney(c.balance)}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => openTopup(c)}
                          title="Nạp tiền"
                        >
                          <Wallet size={14} /> Nạp
                        </button>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.25rem 0.5rem' }}
                          onClick={() => openHistory(c)}
                          title="Lịch sử"
                        >
                          <History size={14} />
                        </button>
                        <button 
                          className="btn btn-warning" 
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                          onClick={() => openAdjust(c)}
                          title="Điều chỉnh số dư"
                        >
                          ±
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Topup Modal */}
      {showTopup && (
        <div className="modal-overlay" onClick={() => setShowTopup(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">💰 Nạp tiền</div>
              <button className="btn btn-outline" onClick={() => setShowTopup(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleTopup}>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="form-group">
                  <label className="form-label">SĐT khách hàng *</label>
                  <input
                    type="text"
                    className="input"
                    value={topupData.phone}
                    onChange={(e) => setTopupData({...topupData, phone: e.target.value})}
                    placeholder="0901234567"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tên KH</label>
                  <input
                    type="text"
                    className="input"
                    value={topupData.name}
                    onChange={(e) => setTopupData({...topupData, name: e.target.value})}
                    placeholder="Tên khách hàng"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Số tiền nạp *</label>
                  <input
                    type="number"
                    className="input"
                    value={topupData.amount}
                    onChange={(e) => setTopupData({...topupData, amount: e.target.value})}
                    placeholder="500000"
                    min="1000"
                    step="1000"
                    required
                  />
                  <div className="text-sm text-gray mt-1">
                    {topupData.amount && `= ${parseInt(topupData.amount || 0).toLocaleString()}đ`}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Lý do / Ghi chú</label>
                  <input
                    type="text"
                    className="input"
                    value={topupData.notes}
                    onChange={(e) => setTopupData({...topupData, notes: e.target.value})}
                    placeholder="VD: Nạp trước 2 tháng"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowTopup(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-success" disabled={submitting}>
                  {submitting ? 'Đang nạp...' : 'Xác nhận nạp tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div className="modal-title">
                📜 Lịch sử giao dịch - {historyName || historyPhone}
              </div>
              <button className="btn btn-outline" onClick={() => setShowHistory(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              {loadingHistory ? (
                <div className="loading">Đang tải...</div>
              ) : transactions.length === 0 ? (
                <div className="text-gray text-center">Chưa có giao dịch nào</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Loại</th>
                      <th style={{ textAlign: 'right' }}>Số tiền</th>
                      <th style={{ textAlign: 'right' }}>Số dư</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => (
                      <tr key={t.id}>
                        <td className="text-sm">{formatDate(t.created_at)}</td>
                        <td>
                          {t.type === 'topup' ? (
                            <span className="badge badge-success">Nạp</span>
                          ) : t.type === 'purchase' ? (
                            <span className="badge badge-warning">Mua</span>
                          ) : t.type === 'refund' ? (
                            <span className="badge badge-info">Hoàn</span>
                          ) : (
                            <span className="badge badge-gray">{t.type}</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ 
                            color: t.amount > 0 ? '#22c55e' : '#ef4444',
                            fontWeight: 600
                          }}>
                            {t.amount > 0 ? '+' : ''}{formatMoney(t.amount)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }} className="text-gray">
                          {formatMoney(t.balance_after)}
                        </td>
                        <td className="text-sm">{t.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {showAdjust && (
        <div className="modal-overlay" onClick={() => setShowAdjust(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">⚖️ Điều chỉnh số dư</div>
              <button className="btn btn-outline" onClick={() => setShowAdjust(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAdjust}>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="form-group">
                  <label className="form-label">Khách hàng</label>
                  <input type="text" className="input" value={`${adjustData.name} - ${adjustData.phone}`} disabled />
                </div>

                <div className="form-group">
                  <label className="form-label">Số tiền điều chỉnh *</label>
                  <input
                    type="number"
                    className="input"
                    value={adjustData.amount}
                    onChange={(e) => setAdjustData({...adjustData, amount: e.target.value})}
                    placeholder="VD: 50000 hoặc -30000"
                    required
                  />
                  <div className="text-sm text-gray mt-1">
                    Nhập số dương để tăng, số âm để giảm
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Lý do điều chỉnh *</label>
                  <input
                    type="text"
                    className="input"
                    value={adjustData.reason}
                    onChange={(e) => setAdjustData({...adjustData, reason: e.target.value})}
                    placeholder="VD: Sửa lỗi nhập sai, bù trừ..."
                    required
                    minLength={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAdjust(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-warning" disabled={submitting}>
                  {submitting ? "Đang xử lý..." : "Xác nhận điều chỉnh"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
}
