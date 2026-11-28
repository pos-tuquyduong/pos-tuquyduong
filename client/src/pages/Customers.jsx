/**
 * POS - Customers Page (GIAO-DIEN-2, mẫu M5 / M6 chủ quán duyệt 17.11)
 * Danh sách khách trong POS + chip lọc (QuanLy/locKhach.js) + chi tiết 3 số chính: Số dư · Điểm · Hạng.
 * Máy tính (≥ 1024px): hai cột (danh sách | chi tiết). Hẹp: danh sách → chi tiết TOÀN MÀN có "← Khách hàng"; Back trình duyệt về danh sách (?khach=<SĐT>).
 * Chi tiết: nút Nạp tiền · Sửa thông tin (ghi chú khách, địa chỉ, ngày sinh) · Thêm… (đổi quà, mã App, cấp hạng, người thân) + hai tab Đơn gần đây | Voucher.
 * /customers?phone=<SĐT> (GOI-1) mở thẳng khách đó. KHACH-CK-1: không còn chiết khấu riêng từng khách.
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api, customersV2Api, registrationsApi, hangApi, ordersApi } from '../utils/api';
import { ngayVN, hienNgayGio } from '../utils/ngayVN';
import { locKhach, BO_LOC } from './QuanLy/locKhach';
import { useAuth } from '../contexts/AuthContext';
import CapHang from '../components/CapHang';   // HANG-1: cấp hạng (chủ quán + PIN) + nhật ký hạng
import MaDangNhapApp from '../components/MaDangNhapApp';
import { chuanSdtQuay } from '../utils/maApp';   // QUAY-UI-1 C: cùng cách chuẩn hoá SĐT với quầy
import ViKhach from '../components/ViKhach';   // GIAO-DIEN-1 C: khu Ví (thay màn Số dư cũ)
import MaAppSoMoi from '../components/MaAppSoMoi';
import { baoXong, baoLoi, baoLoiTu } from '../components/thongBaoKho.js';   // BAO-1a
import { Plus, X, RefreshCw, Users } from 'lucide-react';
import TieuDeMan from '../components/TieuDeMan';   // GIAO-DIEN-4

// Màn rộng (≥ 1024px) vẽ hai cột; hẹp thì danh sách → chi tiết toàn màn.
function useRong(truyVan) {
  const [rong, setRong] = useState(() => !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia(truyVan).matches));
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const m = window.matchMedia(truyVan);
    const doi = () => setRong(m.matches);
    m.addEventListener('change', doi); doi();
    return () => m.removeEventListener('change', doi);
  }, [truyVan]);
  return rong;
}

const ddmm = (iso) => (iso ? `${String(iso).slice(8, 10)}/${String(iso).slice(5, 7)}` : '');
const nhanDon = { cancelled: 'Đã huỷ', refunded: 'Đã hoàn' };

export default function Customers() {
  const { hasPermission } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [tongGui, setTongGui] = useState(0);   // GIAO-DIEN-1: tổng khách đang gửi quán
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    phone: '', name: '', notes: '',
    parent_phone: '',
    relationship: '',
    requested_product: 'Nước ép',
    requested_cycles: 1,
    ma_bill: ''   // VOUCHER-2 (Q9): mã in trên bill của lần mua đầu — khách mới đăng ký tại quầy nhận ưu đãi khách mới
  });
  const [submitting, setSubmitting] = useState(false);
  const [khachTrung, setKhachTrung] = useState(null);   // QUAY-UI-1 C: khách đã có ngay khi gõ đủ SĐT (máy chủ vẫn chặn 409 khi lưu)

  // Modal chi tiết khách hàng (ghi chú POS)
  const rong = useRong('(min-width: 1024px)');
  const dieuHuong = useNavigate();
  const daDayUrl = useRef(false);   // đã đẩy ?khach= vào lịch sử → nút "← Khách hàng" lùi một bước thay vì thêm mục mới
  const [panel, setPanel] = useState(null);   // null | 'nap' | 'sua' | 'them'
  const [tab, setTab] = useState('don');   // 'don' | 'voucher'
  const [donGan, setDonGan] = useState({ dang: false, ds: [], loi: '' });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  // CT-1a: ngày sinh nhập MỘT lần (trống → nhân viên nào cũng nhập); đã có → chỉ người có quyền sua_ngay_sinh sửa, bắt lý do
  const [ngaySinh, setNgaySinh] = useState({ gia: '', lyDo: '', sua: false, loi: '', dangLuu: false });

  // LOY-2: đổi quà tại quầy (dùng chung API mà app KH sẽ gọi)
  const [rewards, setRewards] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState(null);
  const [showRedeem, setShowRedeem] = useState(false);

  // === TIER-1c / HANG-1: hạng thành viên hiện tại (hạng CAO NHẤT còn hạn). Mua thẻ qua màn Bán hàng; chủ quán cấp hạng "chỉ cấp" ở CapHang ===
  const [membershipStatus, setMembershipStatus] = useState(null);

  const loadMembershipStatus = async (phone) => {
    if (!phone) { setMembershipStatus(null); return; }
    try {
      const result = await hangApi.trangThai(phone);
      if (result.success) setMembershipStatus(result.data);
    } catch (err) {
      console.error('Load membership status error:', err);
      setMembershipStatus(null);
    }
  };
  const [detailForm, setDetailForm] = useState({
    discount_note: '',
    address: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await customersV2Api.list();
      const allCustomers = data.customers || [];

      setCustomers(allCustomers);
      setTongGui(allCustomers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0));
      return allCustomers;
    } catch (err) {
      baoLoiTu('tải danh sách khách', err);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Tải lại danh sách rồi cập nhật khách đang xem theo số mới
  const lamMoiKhach = async () => {
    const ds = await loadCustomers();
    const moi = ds?.find((x) => x.phone === selectedCustomer?.phone);
    if (moi) setSelectedCustomer(moi);
  };

  // Lọc + tìm (hàm thuần QuanLy/locKhach.js; "hôm nay" theo giờ VN)
  const filteredCustomers = locKhach(customers, { tim: search, loc: filter, homNay: ngayVN() });

  // QUAY-UI-1 C: gõ đủ SĐT → tự tra (cửa đọc khách sẵn có); đã có khách → báo + mờ nút Lưu. Câu trả về muộn của số cũ bị bỏ.
  useEffect(() => {
    const sdtChuan = chuanSdtQuay(formData.phone);
    setKhachTrung(null);
    if (!showModal || !sdtChuan) return undefined;
    let huy = false;
    customersV2Api.search(sdtChuan)
      .then((r) => { if (!huy) setKhachTrung((r.results || []).find((c) => c.phone === sdtChuan) || null); })
      .catch(() => {});   // tra hỏng: không chặn — máy chủ vẫn chặn khi lưu
    return () => { huy = true; };
  }, [formData.phone, showModal]);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await registrationsApi.create({
        phone: formData.phone,
        name: formData.name,
        notes: formData.notes,
        parent_phone: formData.parent_phone || null,
        relationship: formData.relationship || null,
        requested_product: formData.requested_product,
        requested_cycles: formData.requested_cycles
      });

      // VOUCHER-2 (Q2 · Q9): có mã trên bill → nhận ưu đãi khách mới qua ĐÚNG cửa /claim (cùng hàm App). Khách ĐÃ lưu; mã lỗi chỉ báo, không bỏ khách.
      let phat = '';
      const maBill = String(formData.ma_bill || '').trim();
      if (maBill) {
        try {
          const r = await api.post('/signup-codes/claim', { code: maBill, phone: formData.phone });
          phat = ` Đã phát voucher ${r.data?.voucher_code || ''}${r.data?.mo_ta ? ` (${r.data.mo_ta})` : ''} vào tài khoản.`;
        } catch (eMa) {
          baoLoiTu('nhận mã trên bill (khách đã lưu)', eMa);
        }
      }
      baoXong(`Đã thêm khách ${formData.name || formData.phone}.${phat}`);
      setShowModal(false);
      setFormData({
        phone: '', name: '', notes: '',
        parent_phone: '',
        relationship: '',
        requested_product: 'Nước ép',
        requested_cycles: 1,
    ma_bill: ''   // VOUCHER-2 (Q9): mã in trên bill của lần mua đầu — khách mới đăng ký tại quầy nhận ưu đãi khách mới
      });
      loadCustomers();
    } catch (err) {
      baoLoiTu('thêm khách', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Chọn một khách: dọn trạng thái chi tiết, nạp hạng + đơn gần đây + voucher. Câu trả về muộn của khách cũ bị bỏ (dangTai).
  const dangTai = useRef(null);
  const chonKhach = (customer) => {
    dangTai.current = customer.phone || null;
    setSelectedCustomer(customer);
    setPanel(null);
    setTab('don');
    setShowRedeem(false);
    setRedeemResult(null);
    setRewards([]);
    setVouchers([]);
    setDonGan({ dang: !!customer.phone, ds: [], loi: '' });
    setNgaySinh({ gia: '', lyDo: '', sua: false, loi: '', dangLuu: false });
    setDetailForm({
      discount_note: customer.discount_note || '',
      address: customer.address || ''
    });
    loadMembershipStatus(customer.phone);
    if (!customer.phone) return;
    const sdt = customer.phone;
    ordersApi.list({ customer_phone: sdt, limit: 10 })
      .then((r) => { if (dangTai.current === sdt) setDonGan({ dang: false, ds: r.orders || [], loi: '' }); })
      .catch((e) => { if (dangTai.current === sdt) setDonGan({ dang: false, ds: [], loi: e.message || 'Không tải được đơn' }); });
    loyaltyApi('GET', `/api/pos/loyalty/vouchers/${encodeURIComponent(sdt)}`)
      .then((v) => { if (dangTai.current === sdt && v.success) setVouchers(v.data || []); })
      .catch(() => {});   // voucher chỉ để xem; lỗi tải thì tab hiện "chưa có" — đổi quà vẫn tải lại khi mở
  };
  // Hẹp: mở chi tiết = đẩy ?khach=<SĐT> vào lịch sử để nút Back của trình duyệt về danh sách
  const moKhach = (customer) => {
    chonKhach(customer);
    if (!rong && customer.phone) { daDayUrl.current = true; setSearchParams({ khach: customer.phone }); }
  };
  const dongChiTiet = () => {
    if (daDayUrl.current) { daDayUrl.current = false; dieuHuong(-1); return; }
    setSelectedCustomer(null);
    if (searchParams.get('khach')) setSearchParams({}, { replace: true });
  };

  // GOI-1 (Q4): /customers?phone=<SĐT> (bấm tên khách ở Báo cáo → Gói SP) — tải xong danh sách thì mở đúng khách đó, MỘT lần:
  // xoá tham số ngay, để các lần tải lại sau (lưu khách, đổi quà) không mở lại chi tiết.
  const [searchParams, setSearchParams] = useSearchParams();
  const sdtMo = searchParams.get('phone');
  const khachUrl = searchParams.get('khach');
  useEffect(() => {
    if (!sdtMo || loading) return;
    const kh = customers.find(c => c.phone === sdtMo);
    setSearchParams(kh && !rong ? { khach: sdtMo } : {}, { replace: true });
    if (kh) chonKhach(kh);
    else if (customers.length) baoLoi(`Không tìm thấy khách ${sdtMo}`, 'Số này chưa có trong danh sách khách.');
  }, [sdtMo, loading]);
  // Back / Forward trình duyệt trên màn hẹp: ?khach= mất → về danh sách; ?khach= có mà chưa mở đúng khách đó → mở
  useEffect(() => {
    if (loading || sdtMo) return;
    if (!khachUrl) { if (!rong && selectedCustomer) setSelectedCustomer(null); return; }
    if (selectedCustomer?.phone === khachUrl) return;
    const kh = customers.find(c => c.phone === khachUrl);
    if (kh) chonKhach(kh);
  }, [khachUrl, loading]);

  // ─── LOY-2: đổi quà tại quầy — dùng ĐÚNG 3 API mà app KH sẽ gọi (không viết logic riêng) ───
  const loyaltyApi = async (method, url, body) => {
    const token = localStorage.getItem('pos_token');
    const opts = { method, headers: { 'Authorization': 'Bearer ' + token } };
    if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    const res = await fetch(url, opts);
    return res.json();
  };

  const openRedeem = async () => {
    if (!selectedCustomer?.phone) return;
    setShowRedeem(true);
    setRedeemResult(null);
    try {
      const ph = encodeURIComponent(selectedCustomer.phone);
      const [r, v, p] = await Promise.all([
        loyaltyApi('GET', '/api/pos/rewards?active=1'),
        loyaltyApi('GET', `/api/pos/loyalty/vouchers/${ph}`),
        loyaltyApi('GET', `/api/pos/loyalty/points/${ph}`),
      ]);
      // Báo lỗi THẬT — đừng để màn hình nói "chưa có quà" khi thực ra là lỗi tải.
      if (!r.success) throw new Error(r.error || 'Không tải được kho quà');
      setRewards(r.data || []);
      if (v.success) setVouchers(v.data || []);
      // Lấy điểm TƯƠI (số ở danh sách có thể cũ nếu khách vừa mua ở quầy khác).
      if (p.success) setSelectedCustomer(prev => ({ ...prev, points: p.points }));
    } catch (err) {
      baoLoiTu('tải kho quà', err);
      setShowRedeem(false);
    }
  };

  const doRedeem = async (reward) => {
    if (!selectedCustomer?.phone || redeeming) return;
    if (!window.confirm(`Đổi ${reward.points_cost} điểm lấy "${reward.name}" cho khách ${selectedCustomer.phone}?`)) return;
    setRedeeming(true);
    try {
      const data = await loyaltyApi('POST', '/api/pos/loyalty/redeem', {
        phone: selectedCustomer.phone,
        reward_id: reward.id,
      });
      if (!data.success) throw new Error(data.error || 'Đổi quà thất bại');
      setRedeemResult(data.data);
      // cập nhật điểm hiển thị ngay + tải lại ví
      setSelectedCustomer(prev => ({ ...prev, points: data.data.points_left }));
      const v = await loyaltyApi('GET', `/api/pos/loyalty/vouchers/${encodeURIComponent(selectedCustomer.phone)}`);
      if (v.success) setVouchers(v.data || []);
      baoXong(`Đã đổi quà "${reward.name}" cho khách ${selectedCustomer.phone}`);
      await loadCustomers();
    } catch (err) {
      baoLoiTu('đổi quà', err);
    } finally {
      setRedeeming(false);
    }
  };

  // Kiểm tra khách có SĐT không (để cho phép sửa ghi chú / địa chỉ)
  const canEditNote = (customer) => !!customer?.phone;

  // Lưu thông tin (ghi chú khách + địa chỉ)
  const handleSaveDetail = async () => {
    if (!selectedCustomer) return;
    
    setSubmitting(true);
    
    try {
      // Cập nhật ghi chú khách (cửa /discount — KHACH-CK-1: chỉ còn ghi chú, máy chủ từ chối mức > 0)
      await customersV2Api.updateDiscount(selectedCustomer.phone, {
        discount_note: detailForm.discount_note
      });

      // Cập nhật địa chỉ
      const token = localStorage.getItem('pos_token');
      const addrRes = await fetch(`/api/pos/v2/customers/${selectedCustomer.phone}/address`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: detailForm.address })
      });
      if (!addrRes.ok) {
        const err = await addrRes.json().catch(() => ({}));
        throw new Error(err.error || 'Không thể cập nhật địa chỉ');
      }
      
      baoXong(`Đã cập nhật thông tin cho ${selectedCustomer.name || selectedCustomer.phone}`);
      setPanel(null);
      lamMoiKhach();
    } catch (err) {
      baoLoiTu('cập nhật thông tin khách', err);
    } finally {
      setSubmitting(false);
    }
  };

  const luuNgaySinh = async () => {
    const daCo = !!selectedCustomer.ngay_sinh;
    setNgaySinh((n) => ({ ...n, loi: '', dangLuu: true }));
    try {
      const r = await customersV2Api.datNgaySinh(selectedCustomer.phone, ngaySinh.gia, daCo ? ngaySinh.lyDo : undefined);
      setSelectedCustomer((c) => ({ ...c, ngay_sinh: r.ngay_sinh }));
      setNgaySinh({ gia: '', lyDo: '', sua: false, loi: '', dangLuu: false });
      baoXong(`Đã lưu ngày sinh của ${selectedCustomer.name || selectedCustomer.phone}`);
      lamMoiKhach();
    } catch (err) {
      setNgaySinh((n) => ({ ...n, loi: err.message || 'Không lưu được ngày sinh', dangLuu: false }));
    }
  };

  const relationships = [
    { value: '', label: '-- Chọn quan hệ --' },
    { value: 'con', label: 'Con' },
    { value: 'bố', label: 'Bố' },
    { value: 'mẹ', label: 'Mẹ' },
    { value: 'vợ', label: 'Vợ' },
    { value: 'chồng', label: 'Chồng' },
    { value: 'anh/chị/em', label: 'Anh/Chị/Em' },
    { value: 'bạn bè', label: 'Bạn bè' },
    { value: 'khác', label: 'Khác' }
  ];

  const formatMoney = (amount) => {
    return (amount || 0).toLocaleString() + 'đ';
  };

  const kh = selectedCustomer;
  const hang = membershipStatus || kh?.membership || null;
  const coHang = !!hang && !!hang.tier_name && hang.status !== 'none';
  const chuHang = !coHang ? '—' : hang.tier_name;
  const phuHang = !coHang ? '' : hang.status === 'expired' ? `hết hạn ${ddmm(hang.expires_at)}`.trim()
    : hang.vo_han ? 'Không thời hạn' : hang.expires_at ? `hết hạn ${ddmm(hang.expires_at)}` : `còn ${hang.days_remaining} ngày`;
  const o = { background: '#f8fafc', borderRadius: 8, padding: '0.6rem 0.75rem' };
  const nhanO = { fontSize: '0.75rem', color: '#64748b' };
  const nutPanel = (ma, ten) => (
    <button type="button" className={`btn ${panel === ma ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPanel(panel === ma ? null : ma)}>{ten}</button>
  );

  const danhSach = () => (
    <div className="card">
      <input type="text" className="input mb-2" placeholder="Tìm khách (tên hoặc SĐT)" aria-label="Tìm khách" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="flex gap-1 mb-2" style={{ flexWrap: 'wrap' }}>
        {BO_LOC.map(([ma, ten]) => (
          <button key={ma} className={`btn ${filter === ma ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(ma)}>{ten}</button>
        ))}
      </div>
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-gray text-center" style={{ padding: '2rem' }}>Không có khách hàng nào</div>
      ) : (
        <div>
          {filteredCustomers.map((c, idx) => {
            const chon = !!kh && (c.phone ? c.phone === kh.phone : c === kh);
            const conHan = c.membership?.tier_name && c.membership.status !== 'none';
            return (
              <div key={c.phone || idx} role="button" tabIndex={0} className="kh-dong" onClick={() => moKhach(c)} onKeyDown={(e) => { if (e.key === 'Enter') moKhach(c); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 0.5rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', minHeight: 52, background: chon ? '#ede9fe' : undefined }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{c.name || 'Chưa có tên'}</div>
                  <div className="text-sm text-gray">{c.phone || '(trống)'}</div>
                  {c.discount_note && (
                    <div className="text-sm" style={{ color: '#dc2626' }}>💬 {c.discount_note}</div>
                  )}
                </div>
                {c.balance > 0 && <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>{formatMoney(c.balance)}</span>}
                {conHan && (
                  <span style={{ fontWeight: 700, padding: '2px 7px', borderRadius: 5, fontSize: '0.75rem', whiteSpace: 'nowrap',
                    background: c.membership.status === 'expired' ? '#fee2e2' : c.membership.status === 'expiring_soon' ? '#fef3c7' : '#ede9fe',
                    color: c.membership.status === 'expired' ? '#b91c1c' : c.membership.status === 'expiring_soon' ? '#92400e' : '#5b3ea3' }}>
                    {c.membership.tier_name}{c.membership.status === 'expired' && ' (hết hạn)'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const chiTiet = () => (
    <div className="card" style={{ padding: '1rem' }}>
      {!rong && <button type="button" className="btn btn-outline" style={{ marginBottom: '0.75rem' }} onClick={dongChiTiet}>← Khách hàng</button>}
      <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{kh.name || 'Khách lẻ'}</div>
      <div style={{ color: '#64748b', margin: '2px 0 0.75rem' }}>{kh.phone || 'Chưa có SĐT'}{kh.ngay_sinh ? ` · sinh nhật ${ddmm(kh.ngay_sinh)}` : ''}</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: '0.75rem' }}>
        <div style={o}><div style={nhanO}>Số dư</div><b style={{ color: kh.balance > 0 ? '#16a34a' : '#64748b' }}>{formatMoney(kh.balance)}</b></div>
        <div style={o}><div style={nhanO}>Điểm</div><b style={{ color: kh.points > 0 ? '#7c3aed' : '#94a3b8' }}>{kh.points || 0}</b></div>
        <div style={o}><div style={nhanO}>Hạng</div><b>{chuHang}</b>{phuHang && <div style={{ fontSize: '0.72rem', color: hang?.status === 'expired' ? '#b91c1c' : '#64748b' }}>{phuHang}</div>}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: '0.75rem' }}>
        {kh.phone && nutPanel('nap', 'Nạp tiền')}
        {nutPanel('sua', 'Sửa thông tin')}
        {nutPanel('them', 'Thêm…')}
      </div>

      {panel === 'nap' && (
        <div style={{ marginBottom: '0.75rem' }}>
          <ViKhach khach={kh} onDoi={lamMoiKhach} />
        </div>
      )}

      {panel === 'sua' && (
        <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 8, marginBottom: '0.75rem' }}>
          {canEditNote(kh) ? (
            <>
              <div className="form-group">
                <label className="form-label">💬 Ghi chú khách (in trên hoá đơn)</label>
                <input type="text" className="input" value={detailForm.discount_note}
                  onChange={(e) => setDetailForm({...detailForm, discount_note: e.target.value})} placeholder="VD: Ít ngọt, không đá..." />
              </div>
              <div className="form-group">
                <label className="form-label">📍 Địa chỉ (hiển thị trên hóa đơn)</label>
                <input type="text" className="input" value={detailForm.address}
                  onChange={(e) => setDetailForm({...detailForm, address: e.target.value})} placeholder="VD: 123 Nguyễn Trãi, Thanh Xuân, Hà Nội" />
              </div>
                {/* CT-1a: ngày sinh — nhập MỘT lần; KHÔNG lưu số căn cước */}
                <div className="form-group">
                  <label className="form-label">🎂 Ngày sinh (nhập một lần)</label>
                  {selectedCustomer.ngay_sinh && !ngaySinh.sua ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <b>{selectedCustomer.ngay_sinh.split('-').reverse().join('/')}</b>
                      {hasPermission('sua_ngay_sinh')
                        ? <button type="button" className="btn btn-outline" onClick={() => setNgaySinh((n) => ({ ...n, sua: true, gia: selectedCustomer.ngay_sinh }))}>Sửa</button>
                        : <span style={{ fontSize: 12, color: '#6b7280' }}>Chỉ chủ quán sửa được</span>}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <input type="date" className="input" style={{ flex: '0 1 170px' }} value={ngaySinh.gia} onChange={(e) => setNgaySinh((n) => ({ ...n, gia: e.target.value }))} />
                      {selectedCustomer.ngay_sinh && (
                        <input type="text" className="input" style={{ flex: '1 1 200px' }} maxLength={200} placeholder="Lý do sửa (bắt buộc)" value={ngaySinh.lyDo}
                          onChange={(e) => setNgaySinh((n) => ({ ...n, lyDo: e.target.value }))} />
                      )}
                      <button type="button" className="btn btn-primary" onClick={luuNgaySinh}
                        disabled={ngaySinh.dangLuu || !ngaySinh.gia || (!!selectedCustomer.ngay_sinh && !ngaySinh.lyDo.trim())}>
                        {ngaySinh.dangLuu ? 'Đang lưu…' : 'Lưu ngày sinh'}
                      </button>
                      {ngaySinh.sua && <button type="button" className="btn btn-outline" onClick={() => setNgaySinh((n) => ({ ...n, sua: false, loi: '' }))}>Bỏ</button>}
                    </div>
                  )}
                  {ngaySinh.loi && <div style={{ color: '#b91c1c', fontSize: 13, marginTop: 4 }}>{ngaySinh.loi}</div>}
                  {!selectedCustomer.ngay_sinh && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Khách chưa có ngày sinh. Nhập theo căn cước khách đưa xem — POS không lưu số căn cước.</div>}
                </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setPanel(null)}>Đóng</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveDetail} disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
              </div>
            </>
          ) : (
            <div style={{ color: '#991b1b' }}>
              <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>⚠️ Không thể sửa ghi chú</div>
              <div style={{ fontSize: '0.85rem' }}>Khách chưa có SĐT — sửa thông tin khách để thêm SĐT trước</div>
            </div>
          )}
        </div>
      )}

      {panel === 'them' && (
        <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 8, marginBottom: '0.75rem' }}>
          {kh.phone && (
            <button className="btn btn-outline" style={{ marginBottom: 8 }} onClick={() => (showRedeem ? setShowRedeem(false) : openRedeem())}>
              {showRedeem ? 'Đóng đổi quà' : '🎫 Đổi quà'}
            </button>
          )}
            {/* LOY-2: khu đổi quà tại quầy */}
            {showRedeem && (
              <div style={{ marginTop: '12px', padding: '10px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px' }}>
                {redeemResult && (
                  <div style={{ padding: '10px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '6px', marginBottom: '10px' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>✅ Mã voucher: {redeemResult.code}</div>
                    <div style={{ fontSize: '0.85rem', color: '#166534', marginTop: '2px' }}>
                      {redeemResult.reward_name} · hạn {redeemResult.expires_at} · đã trừ {redeemResult.points_spent} điểm, còn {redeemResult.points_left}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: '4px' }}>
                      Đọc mã này cho khách. Dùng được <b>1 lần</b> rồi hết hiệu lực — khách tặng ai cũng được.
                    </div>
                  </div>
                )}

                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Kho quà</div>
                {rewards.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Chưa có quà. Thêm ở Cài đặt → 🎫 Kho quà.</div>
                ) : rewards.map(r => {
                  const enough = (selectedCustomer.points || 0) >= r.points_cost;
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #f3e8ff' }}>
                      <div style={{ fontSize: '0.85rem' }}>
                        {r.name}
                        <span style={{ color: '#7c3aed', fontWeight: 600, marginLeft: '6px' }}>{r.points_cost} điểm</span>
                      </div>
                      <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.78rem' }} disabled={!enough || redeeming}
                        title={enough ? '' : 'Khách chưa đủ điểm'}
                        onClick={() => doRedeem(r)}>
                        {redeeming ? '...' : 'Đổi'}
                      </button>
                    </div>
                  );
                })}

              </div>
            )}
          {kh.phone && <MaDangNhapApp key={selectedCustomer.phone} sdt={selectedCustomer.phone} />}
          <CapHang sdt={kh.phone} coQuyen={hasPermission('cap_hang')} onDoi={() => loadMembershipStatus(kh.phone)} />
          {kh.relationship && kh.parent_name && (
            <div style={{ marginTop: '8px', padding: '8px', background: '#f3e8ff', borderRadius: '6px', fontSize: '0.85rem' }}>
              {kh.relationship} của <strong>{kh.parent_name}</strong>
            </div>
          )}
        </div>
      )}

      {kh.notes && (
        <div style={{ marginBottom: '0.75rem', padding: '8px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.85rem', color: '#64748b' }}>
          <span style={{ fontStyle: 'italic' }}>Ghi chú: {kh.notes}</span>
        </div>
      )}

      <div className="flex gap-1 mb-2">
        {[['don', 'Đơn gần đây'], ['voucher', `Voucher (${vouchers.length})`]].map(([ma, ten]) => (
          <button key={ma} className={`btn ${tab === ma ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(ma)}>{ten}</button>
        ))}
      </div>
      {tab === 'don' ? (
        donGan.dang ? <div className="loading">Đang tải...</div>
          : donGan.loi ? <div className="alert alert-danger">Chưa tải được đơn: {donGan.loi}</div>
          : donGan.ds.length === 0 ? <div className="text-gray">Chưa có đơn nào.</div>
          : donGan.ds.map((d) => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderTop: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
              <span><b>{d.order_code}</b> · {hienNgayGio(d.created_at, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              <span>{formatMoney(d.total)}{nhanDon[d.status] ? ` · ${nhanDon[d.status]}` : ''}</span>
            </div>
          ))
      ) : (
        vouchers.length === 0 ? <div className="text-gray">Chưa có voucher nào chưa dùng.</div>
          : vouchers.map((v) => (
            <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
              <span><b>{v.code}</b> · {v.reward_name || '—'}</span>
              <span style={{ color: '#64748b' }}>hạn {v.expires_at || '—'}</span>
            </div>
          ))
      )}
    </div>
  );

  return (
    <>
      <header className="page-header">
        <TieuDeMan icon={Users} ten="Khách hàng" />
        <div className="flex gap-1">
          <button className="btn btn-outline" onClick={loadCustomers} aria-label="Tải lại"><RefreshCw size={16} /></button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Thêm khách</button>
        </div>
      </header>

      <div className="page-content">
        <MaAppSoMoi />
        <div className="text-sm text-gray mb-2">💵 Khách đang gửi quán: <b>{formatMoney(tongGui)}</b></div>

        {rong ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 2fr) 3fr', gap: '1rem', alignItems: 'start' }}>
            {danhSach()}
            {kh ? chiTiet() : <div className="card text-gray" style={{ padding: '2rem', textAlign: 'center' }}>Chọn một khách ở bên trái</div>}
          </div>
        ) : (kh ? chiTiet() : danhSach())}
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Thêm khách hàng mới</div>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">SĐT *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="0901234567"
                    required
                  />
                  {khachTrung && <div className="alert alert-danger" style={{ marginTop: 6 }}>Khách đã có: {khachTrung.name} — tìm khách ở màn Bán hàng</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Tên KH *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nguyễn Thị A"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ghi chú</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Ghi chú thêm..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mã trên bill (nếu có)</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.ma_bill}
                    onChange={(e) => setFormData({...formData, ma_bill: e.target.value})}
                    placeholder="Mã in trên bill lần mua đầu — nhận ưu đãi khách mới"
                    maxLength={20}
                  />
                </div>

                <div className="grid grid-2 gap-1">
                  <div className="form-group">
                    <label className="form-label">Sản phẩm</label>
                    <select
                      className="select"
                      value={formData.requested_product}
                      onChange={(e) => setFormData({...formData, requested_product: e.target.value})}
                    >
                      <option value="Nước ép">Nước ép</option>
                      <option value="Trà">Trà</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số chu kỳ</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.requested_cycles}
                      onChange={(e) => setFormData({...formData, requested_cycles: parseInt(e.target.value) || 1})}
                      min="1"
                    />
                  </div>
                </div>

                {/* Khách phụ (mua hộ) */}
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  background: '#f8fafc', 
                  borderRadius: '8px' 
                }}>
                  <div className="form-label" style={{ marginBottom: '0.75rem' }}>
                    👥 Là người nhận của khách khác (tùy chọn)
                  </div>
                  <div className="form-group">
                    <label className="form-label">SĐT khách chính</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.parent_phone}
                      onChange={(e) => setFormData({...formData, parent_phone: e.target.value})}
                      placeholder="SĐT người thanh toán"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quan hệ</label>
                    <select
                      className="select"
                      value={formData.relationship}
                      onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                    >
                      {relationships.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !!khachTrung}>
                  {submitting ? 'Đang lưu...' : 'Lưu khách hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
        .kh-dong:hover { background-color: #f8fafc; }
      `}</style>
    </>
  );
}
