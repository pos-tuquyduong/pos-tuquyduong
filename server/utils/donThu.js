/**
 * KH-SDT-1 — dọn dữ liệu thử trước khai trương (chỉ chủ quán, chạy một lần). Chủ quán chốt 01.11: liệt kê → tải danh sách → tải sao
 * lưu → gõ CHU_XAC_NHAN → dọn. MỘT hàm chọn dòng (`chonDong`) cho cả liệt kê và dọn — dọn chọn lại TRONG giao dịch và so `ma_xac_nhan`
 * (băm tiêu chí + mọi id), dữ liệu đổi giữa hai bước → 409.
 *
 * Tiêu chí (hợp hai phần):
 *  - truoc_ngay X (< hôm nay): đơn tạo trước X + dòng gắn đơn; điểm không gắn đơn, voucher, mã / lần thử App trước X.
 *    KHÔNG xoá hồ sơ khách, ví, sổ ví không gắn đơn, gói / thẻ không gắn đơn theo ngày (hồ sơ có thể là khách thật).
 *  - sdt [..]: mọi đơn + mọi dòng của số đó (hồ sơ, ví 0, sổ ví, điểm, voucher, gói, thẻ, đăng ký, mã bill đã nhận, mã App).
 * Giữ lại CẢ CỤM (liệt kê, không xoá): đơn hôm nay (mã đơn = số lớn nhất trong ngày + 1) · đơn có phiên thanh toán (tiền ngân hàng) ·
 * đơn còn nợ kho SX · đơn của / trả hộ bởi SĐT ví ≠ 0 · đơn có dòng sổ ví của số không dọn, hoặc dòng điểm / gói / thẻ / mã bill của SĐT
 * KHÁC chủ đơn mà số đó không dọn · đơn lấy từ gói còn giữ / mua gói mà đơn giữ đang dùng · hoá đơn năm nay khi còn hoá đơn khác của năm
 * giữ lại. SĐT trong danh sách có đơn giữ, có dòng gắn đơn còn giữ, có gói đang được đơn giữ dùng, hoặc là mẹ của khách không xoá → giữ
 * cả số. Dòng mồ côi (order_id trỏ tới đơn đã xoá) dọn được.
 * Két đã đếm (sổ đối soát không dọn — chủ quán chốt 02.11, Q9): két một ngày = để lại lần đếm TRƯỚC + tiền mặt cả KHOẢNG tới ngày đó
 * (doiSoat.js soKet). Két TRƯỚC ngày X được lệch — liệt kê đúng ngày (ket_se_lech); két TỪ ngày X (không chọn ngày: mọi két) không được
 * đổi → đơn có tiền mặt rơi vào khoảng của két đó giữ lại, SĐT có nạp ví tiền mặt rơi vào đó giữ cả số.
 * Không bao giờ dọn: đối soát, payOS, phiên, đơn App, PIN, kho, sản phẩm, cài đặt, nhân viên, nội dung App (nd_*). Điểm âm sau dọn → từ chối (DIEM_AM).
 * Xoá đơn completed có mã giảm → trả lượt mã như xoá đơn (`traLuotMa`). Nhật ký: pos_sync_logs 'don_thu' (tiêu chí, số dòng, băm) và các
 * phần 'don_thu_chup' = { xoa: dòng đã xoá, sua_truoc: dòng trả lượt TRƯỚC khi sửa } chia ≤ PHAN ký tự / ô (sao lưu Excel không nhận ô
 * dài hơn 32767); cột bí mật che bằng '[ẩn]'.
 */
const crypto = require('crypto');
const { beginTransaction, query } = require('../database');
const { getNow, getToday } = require('./helpers');
const { traLuotMa } = require('./tienDaTra');

const CHU_XAC_NHAN = 'DON DU LIEU THU';
const VI_KHAC_0 = 'SELECT phone FROM pos_wallets WHERE balance <> 0';
const PHAN = 30000;                                   // ký tự / ô nhật ký — dưới trần 32767 của ô Excel (sao lưu export-all)
const COT_BI_MAT = ['pin_code', 'password', 'ma_bam'];  // nhật ký nhân viên đọc được (GET /sync/logs) — che trong bản lưu

// Bảng gắn đơn qua order_id (con có khoá ngoại tới pos_orders đứng trước — khoá ngoại đang bật).
const BANG_THEO_DON = ['pos_order_items', 'pos_refund_requests', 'pos_damage_logs', 'pos_promotion_usage', 'pos_invoice_logs',
  'pos_order_log', 'pos_membership_purchases', 'pos_customer_packages', 'pos_point_transactions', 'pos_balance_transactions', 'pos_signup_codes',
  'pos_giao_chuyen', 'pos_giao_bao_phi',   // GIAO-1: chuyến + báo phí đi theo đơn
  'pos_hoan_tien_mat'];   // HUY-1: khoản trả tiền mặt khách lẻ khi huỷ đơn — két của ngày đó đã đếm (tienMatTheoNgay) nên xoá đơn đã đếm két thì giữ đơn
// Theo ngày X: [bảng, cột SĐT, cột giờ, có order_id] — dòng gắn đơn chỉ đi theo đơn.
const BANG_THEO_NGAY = [['pos_point_transactions', 'customer_phone', 'created_at', true], ['pos_voucher_grants', 'customer_phone', 'granted_at', false],
  ['pos_kh_ma_dang_nhap', 'sdt', 'tao_luc', false], ['pos_kh_lan_thu', 'sdt', 'tao_luc', false]];
// Theo SĐT: [bảng, các cột SĐT, có order_id] — số có dòng gắn đơn KHÔNG dọn thì cả số được giữ (chiaGiu).
const BANG_THEO_SDT = [['pos_customers', ['phone'], false], ['pos_wallets', ['phone'], false], ['pos_registrations', ['phone'], false],
  ['pos_voucher_grants', ['customer_phone'], false], ['pos_kh_ma_dang_nhap', ['sdt'], false], ['pos_kh_lan_thu', ['sdt'], false],
  ['pos_signup_codes', ['claimed_phone', 'diem_nhan_phone'], false], ['pos_point_transactions', ['customer_phone'], true],
  ['pos_balance_transactions', ['customer_phone'], true], ['pos_customer_packages', ['customer_phone'], true],
  ['pos_membership_purchases', ['customer_phone'], true]];
// Dòng gắn đơn có cột SĐT — [bảng, cột]. Dòng của SĐT KHÁC chủ đơn (vd khách nhận mã bill in trên đơn thử) → giữ đơn (chiaGiu).
const DONG_CON_CO_SDT = [['pos_point_transactions', 'customer_phone'], ['pos_balance_transactions', 'customer_phone'],
  ['pos_customer_packages', 'customer_phone'], ['pos_membership_purchases', 'customer_phone'], ['pos_signup_codes', 'claimed_phone'],
  ['pos_signup_codes', 'diem_nhan_phone']];
// Bảng có cột SĐT / order_id mà công cụ KHÔNG BAO GIỜ xoá (chỉ dùng để giữ lại) — bài thử dò PRAGMA canh danh sách này.
const BANG_KHONG_DON = ['pos_stock_pending', 'pos_phien_thanh_toan', 'pos_don_app', 'pos_nhat_ky_pin', 'kho_nha_cung_cap',
  'pos_ngay_sinh_sua',   // CT-1a: sổ sửa ngày sinh chỉ-thêm-dòng (như nhật ký PIN) — dọn dữ liệu thử không xoá
  'pos_so_hoa_don',   // CK-NOIDUNG-1: sổ số hoá đơn chỉ-thêm — xoá thì số đã cấp bị cấp lại cho đơn thật (trùng số trên sao kê)
  // ND-API-1: kho nội dung App KH (server/nd/) là nội dung THẬT chủ quán soạn ở /admin — dọn dữ liệu thử không bao giờ xoá
  'nd_ban', 'nd_nhap', 'nd_anh', 'nd_nhat_ky', 'nd_khoa_sao_luu', 'nd_lan_sai'];
const THU_TU_XOA = [...BANG_THEO_DON, 'pos_voucher_grants', 'pos_discount_codes', 'pos_kh_ma_dang_nhap', 'pos_kh_lan_thu',
  'pos_registrations', 'pos_wallets', 'pos_customers', 'pos_orders'];

const loi = (status, code, error) => ({ loi: { status, code, error } });
const trong = (ids) => `(${ids.map(Number).join(',')})`;
const dau = (ds) => ds.map(() => '?').join(', ');
const bam = (s) => crypto.createHash('sha256').update(s).digest('hex');

/** Chuỗi → các phần ≤ PHAN ký tự; không cắt đôi cặp thay thế UTF-16 (emoji trong ghi chú). */
function chiaPhan(chuoi) {
  const phan = [];
  for (let i = 0; i < chuoi.length;) {
    let j = Math.min(i + PHAN, chuoi.length);
    if (j < chuoi.length && /[\uD800-\uDBFF]/.test(chuoi[j - 1])) j--;
    phan.push(chuoi.slice(i, j)); i = j;
  }
  return phan;
}

// Tiền mặt vào (+) / ra (−) két theo ngày của từng đơn ('d<id>') và nạp ví của từng SĐT ('s<sđt>') — CÙNG công thức doiSoat.js
// tienTheoSo('cash'): bán = cash_amount − thu nợ, theo ngày tạo; thu nợ theo ngày thu; huỷ trước HUY-1 (trừ đơn mua gói) trả ra theo ngày huỷ;
// huỷ từ HUY-1 (có mã lý do) chỉ trả ra khoản hoàn tiền mặt khách lẻ (pos_hoan_tien_mat) theo ngày ghi.
const J_TIEN_MAT = `CASE WHEN json_valid(chi_tiet) THEN (CASE WHEN json_extract(chi_tiet, '$.cach') = 'cash' THEN json_extract(chi_tiet, '$.so_tien') END) END`;
const tienMatTheoNgay = (q, idDon, sdt) => q.query(`SELECT 'd' || o.id AS khoa, DATE(o.created_at) AS ngay, o.cash_amount
    - (SELECT COALESCE(SUM(${J_TIEN_MAT}), 0) FROM pos_order_log WHERE order_id = o.id AND loai = 'thu') AS n FROM pos_orders o WHERE o.id IN ${trong(idDon)}
  UNION ALL SELECT 'd' || order_id, DATE(luc), ${J_TIEN_MAT} FROM pos_order_log WHERE loai = 'thu' AND order_id IN ${trong(idDon)}
  UNION ALL SELECT 'd' || o.id, DATE(o.cancelled_at), -o.cash_amount FROM pos_orders o WHERE o.status = 'cancelled' AND o.huy_ly_do_ma IS NULL
    AND o.id IN ${trong(idDon)} AND NOT EXISTS (SELECT 1 FROM pos_order_items oi WHERE oi.order_id = o.id AND oi.product_id < 0 AND oi.product_id > -1000000)
  UNION ALL SELECT 'd' || order_id, DATE(luc), -so_tien FROM pos_hoan_tien_mat WHERE order_id IN ${trong(idDon)}
  UNION ALL SELECT 's' || customer_phone, DATE(created_at), amount FROM pos_balance_transactions WHERE type = 'topup'
    AND COALESCE(payment_method, 'cash') = 'cash' AND customer_phone IN (${dau(sdt)})`, sdt);
/** Dòng tiền → các khoá (gom theo `khoa(dòng, két)`) có tổng khác 0 trong một két đã đếm. Tiền ngày e thuộc lần đếm ĐẦU TIÊN từ e,
 *  nếu trước e đã có lần đếm (két chưa có mốc thì không có số theo sổ để lệch). */
function ketBiDoi(dong, ngayKet, khoa) {
  const tong = new Map();
  for (const r of dong) {
    const i = ngayKet.findIndex((k) => k >= r.ngay);
    if (i > 0 && r.n) tong.set(khoa(r, ngayKet[i]), (tong.get(khoa(r, ngayKet[i])) || 0) + Number(r.n));
  }
  return [...tong].filter(([, n]) => Math.round(n) !== 0).map(([k]) => k);
}

function chuanSdt(v) {
  let s = String(v ?? '').replace(/[\s.\-]/g, '');
  if (s.startsWith('+84')) s = '0' + s.slice(3);
  return /^0\d{9,10}$/.test(s) ? s : null;
}

/** Thân yêu cầu → { tieuChi: { truoc_ngay, sdt } } hoặc { loi }. Cùng một kiểm cho liệt kê và dọn. */
function docTieuChi(than, homNay) {
  const ngay = than.truoc_ngay;
  let truocNgay = null;
  if (ngay !== undefined && ngay !== null && ngay !== '') {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(String(ngay)) ? new Date(ngay + 'T00:00:00Z') : null;
    if (!d || isNaN(d) || d.toISOString().slice(0, 10) !== ngay || ngay >= homNay) {
      return loi(400, 'NGAY_KHONG_HOP_LE', 'Ngày phải đúng dạng và TRƯỚC hôm nay (đơn hôm nay không dọn được)');
    }
    truocNgay = ngay;
  }
  if (than.sdt !== undefined && !Array.isArray(than.sdt)) return loi(400, 'SDT_KHONG_HOP_LE', 'Danh sách SĐT không hợp lệ');
  const sdt = [];
  for (const v of than.sdt || []) {
    const s = chuanSdt(v);
    if (!s) return loi(400, 'SDT_KHONG_HOP_LE', `SĐT không hợp lệ: ${String(v).slice(0, 20)}`);
    if (!sdt.includes(s)) sdt.push(s);
  }
  if (!truocNgay && !sdt.length) return loi(400, 'TIEU_CHI_TRONG', 'Chọn ngày hoặc nhập ít nhất một SĐT thử');
  return { tieuChi: { truoc_ngay: truocNgay, sdt } };
}

/** Đơn ứng viên → { giu: Map(id → lý do), P: SĐT xoá sạch }. Lặp tới khi đứng yên: giữ một đơn có thể kéo theo giữ cả số / gói. */
async function chiaGiu(q, ung, L, coVi, homNay, X, ngayKet) {
  const id = trong(ung.map((o) => o.id));
  const tap = async (sql) => new Set((await q.query(sql)).map((r) => Number(r.order_id)));
  const coPhien = await tap(`SELECT DISTINCT order_id FROM pos_phien_thanh_toan WHERE order_id IN ${id}`);
  const noKho = await tap(`SELECT DISTINCT order_id FROM pos_stock_pending WHERE order_id IN ${id}`);
  // Dòng gắn đơn có SĐT (của đơn ứng viên) + dòng gắn đơn CÒN TỒN TẠI của các số trong danh sách. order_id trỏ tới đơn đã xoá
  // (xoá đơn ở quầy để lại dòng điểm / sổ ví) không giữ gì — dọn được. Mã bill số thử nhận trên đơn thật không giữ số (không phải tiền).
  // Một vị từ cho cả hai: chủ đơn khác số dòng (hoặc dòng sổ ví) và số đó không dọn → giữ.
  const con = [], ganDon = [];
  for (const [t, cot] of DONG_CON_CO_SDT) {
    for (const r of await q.query(`SELECT DISTINCT order_id, ${cot} AS phone FROM ${t} WHERE order_id IN ${id} AND ${cot} IS NOT NULL`)) {
      con.push({ ...r, soVi: t === 'pos_balance_transactions' });
    }
    if (L.length && !t.startsWith('pos_signup')) ganDon.push(...await q.query(`SELECT DISTINCT order_id, ${cot} AS phone FROM ${t}
      WHERE ${cot} IN (${dau(L)}) AND order_id IN (SELECT id FROM pos_orders)`, L));
  }
  const goi = await q.query(`SELECT id, customer_phone, order_id FROM pos_customer_packages WHERE order_id IN ${id}
    OR id IN (SELECT customer_package_id FROM pos_orders WHERE id IN ${id})${L.length ? ` OR customer_phone IN (${dau(L)})` : ''}`, L);
  const goiTheoId = new Map(goi.map((g) => [Number(g.id), g]));
  const dungGoi = await q.query(`SELECT id, customer_package_id FROM pos_orders WHERE customer_package_id IN ${trong([...goiTheoId.keys()])}`);
  const conCua = L.length ? await q.query(`SELECT phone, parent_phone FROM pos_customers WHERE parent_phone IN (${dau(L)})
    UNION SELECT phone, parent_phone FROM pos_registrations WHERE parent_phone IN (${dau(L)})`, [...L, ...L]) : [];
  // Số hoá đơn kế tiếp = ĐẾM hoá đơn trong năm (settings.js invoice/next-number): xoá HẾT hoặc KHÔNG xoá hoá đơn năm nay, không xoá một phần.
  const hdNam = await q.query('SELECT DISTINCT order_id FROM pos_invoice_logs WHERE invoice_number LIKE ?', [`%/${homNay.slice(0, 4)}`]);
  // Két không được đổi (từ ngày X; không chọn ngày → mọi két): khoá → ngày két đầu tiên bị đổi.
  const ketGiu = new Map();
  for (const [kh, ky] of ketBiDoi(await tienMatTheoNgay(q, ung.map((o) => o.id), L), ngayKet, (r, ky) => `${r.khoa}|${ky}`)
    .map((k) => k.split('|')).filter(([, ky]) => !X || ky >= X).sort((a, b) => (a[1] < b[1] ? -1 : 1))) if (!ketGiu.has(kh)) ketGiu.set(kh, ky);
  const veKet = (ky) => `rơi vào két ngày ${ky} đã đếm (két ${X ? 'từ ngày X' : 'đã đếm'} không được đổi)`;
  const laUng = new Set(ung.map((o) => Number(o.id)));
  const giu = new Map();
  for (const o of ung) {
    const l = o.created_at >= homNay ? 'Đơn hôm nay — không dọn (mã đơn trong ngày sẽ bị dùng lại)'
      : coVi.has(o.customer_phone) ? `SĐT ${o.customer_phone} còn số dư ví`
        : coVi.has(o.parent_phone) ? `Người trả hộ ${o.parent_phone} còn số dư ví`
          : coPhien.has(Number(o.id)) ? 'Có phiên thanh toán (tiền ngân hàng)'
            : noKho.has(Number(o.id)) ? 'Còn việc kho chưa gửi sang SX'
              : ketGiu.has('d' + o.id) ? `Tiền mặt của đơn ${veKet(ketGiu.get('d' + o.id))}` : '';
    if (l) giu.set(Number(o.id), l);
  }
  for (;;) {
    const xoaDon = (d) => laUng.has(Number(d)) && !giu.has(Number(d));
    const sdtGiu = new Map();   // SĐT → lý do giữ cả số (lý do đầu tiên)
    const giuSo = (ds, l) => { for (const s of ds) if (s && !sdtGiu.has(s)) sdtGiu.set(s, typeof l === 'function' ? l(s) : l); };
    giuSo(L.filter((s) => coVi.has(s)), 'Còn số dư ví (xử lý tay)');
    giuSo(L.filter((s) => ketGiu.has('s' + s)), (s) => `Nạp ví tiền mặt ${veKet(ketGiu.get('s' + s))}`);
    giuSo(ung.filter((o) => giu.has(Number(o.id))).flatMap((o) => [o.customer_phone, o.parent_phone]), 'Có đơn phải giữ lại (lý do ở từng đơn)');
    giuSo(ganDon.filter((r) => !xoaDon(r.order_id)).map((r) => r.phone), 'Có dòng điểm / sổ ví / gói / thẻ gắn đơn không dọn');
    giuSo(goi.filter((g) => dungGoi.some((d) => Number(d.customer_package_id) === Number(g.id) && !xoaDon(d.id))).map((g) => g.customer_phone),
      'Có gói đang được đơn không dọn dùng');
    let P = L.filter((s) => !sdtGiu.has(s));
    for (let n = -1; n !== P.length;) {   // số là mẹ của khách KHÔNG xoá → giữ (con không trỏ tới mẹ đã xoá)
      n = P.length;
      giuSo(P.filter((s) => conCua.some((c) => c.parent_phone === s && !P.includes(c.phone))), 'Là người thân chính (trả hộ) của khách không xoá');
      P = P.filter((s) => !sdtGiu.has(s));
    }
    const goiXoa = (g) => (g.order_id != null ? xoaDon(g.order_id) : P.includes(g.customer_phone));
    const hdGiu = hdNam.some((r) => !xoaDon(r.order_id));
    const khac = (o) => con.find((r) => Number(r.order_id) === Number(o.id) && !P.includes(r.phone) && (r.soVi || r.phone !== o.customer_phone));
    let doi = false;
    for (const o of ung) {
      if (giu.has(Number(o.id))) continue;
      const g = goiTheoId.get(Number(o.customer_package_id));
      const l = !o.theo_ngay && !P.includes(o.customer_phone) ? 'SĐT này được giữ lại cả số'
        : khac(o) ? (khac(o).soVi ? 'Có dòng sổ ví của SĐT không dọn (ví phải khớp sổ)' : 'Có dòng điểm / gói / thẻ / mã bill của SĐT khác không dọn')
          : g && !goiXoa(g) ? 'Lấy từ gói còn giữ'
            : goi.some((m) => Number(m.order_id) === Number(o.id) && dungGoi.some((d) => Number(d.customer_package_id) === Number(m.id) && !xoaDon(d.id)))
              ? 'Mua gói mà đơn giữ lại đang dùng'
              : hdGiu && hdNam.some((r) => Number(r.order_id) === Number(o.id)) ? 'Có hoá đơn năm nay mà hoá đơn khác của năm còn giữ (số hoá đơn sẽ trùng)' : '';
      if (l) { giu.set(Number(o.id), l); doi = true; }
    }
    if (!doi) return { giu, P, lyDoSdt: Object.fromEntries(L.filter((s) => !P.includes(s)).map((s) => [s, sdtGiu.get(s)])) };
  }
}

/** Chọn mọi dòng sẽ dọn. `q` = kết nối thường (liệt kê) hoặc giao dịch (dọn). Không ghi gì. */
async function chonDong(q, { truoc_ngay: X, sdt: L }, homNay, now) {
  const vi = await q.query('SELECT phone, balance FROM pos_wallets WHERE balance <> 0');
  const coVi = new Set(vi.map((v) => v.phone));
  const theoNgay = X ? 'created_at < ?' : '0';   // MỘT vị từ ngày: chọn đơn + đánh dấu đơn chọn theo ngày (theo_ngay)
  const ung = await q.query(`SELECT id, code, created_at, customer_phone, parent_phone, total, status, customer_package_id,
      (${theoNgay}) AS theo_ngay FROM pos_orders WHERE ${theoNgay}${L.length ? ` OR customer_phone IN (${dau(L)})` : ''} ORDER BY id`,
    [...(X ? [X, X] : []), ...L]);
  const ngayKet = (await q.query("SELECT DISTINCT ky FROM pos_doi_soat_ghi WHERE loai = 'ket' ORDER BY ky")).map((r) => r.ky);
  const { giu, P, lyDoSdt } = await chiaGiu(q, ung, L, coVi, homNay, X, ngayKet);
  const don = ung.filter((o) => !giu.has(Number(o.id)));
  const O = trong(don.map((o) => o.id));
  const ids = new Map(THU_TU_XOA.map((t) => [t, new Set()]));
  const gom = async (t, sql, args = []) => { for (const r of await q.query(`SELECT id FROM ${t} WHERE ${sql}`, args)) ids.get(t).add(Number(r.id)); };
  for (const o of don) ids.get('pos_orders').add(Number(o.id));
  for (const t of BANG_THEO_DON) await gom(t, `order_id IN ${O}`);
  if (X) {
    for (const [t, cot, gio, coDon] of BANG_THEO_NGAY) {
      await gom(t, `${gio} < ? AND (${cot} IS NULL OR ${cot} NOT IN (${VI_KHAC_0}))`
        + (coDon ? ' AND (order_id IS NULL OR order_id NOT IN (SELECT id FROM pos_orders))' : ''), [X]);   // dòng mồ côi (đơn đã xoá) dọn theo ngày
    }
  }
  if (P.length) {
    for (const [t, cots] of BANG_THEO_SDT) {
      await gom(t, cots.map((c) => `${c} IN (${dau(P)})`).join(' OR '), cots.flatMap(() => P));   // số trong P không còn dòng gắn đơn giữ (chiaGiu)
    }
  }
  // Mã giảm riêng của voucher / mã bill bị dọn (cùng code — loyalty.js, signup-codes.js).
  const maGiam = [...new Set([
    ...(await q.query(`SELECT code FROM pos_voucher_grants WHERE id IN ${trong([...ids.get('pos_voucher_grants')])}`)),
    ...(await q.query(`SELECT code FROM pos_signup_codes WHERE id IN ${trong([...ids.get('pos_signup_codes')])}`)),
  ].map((r) => String(r.code).toUpperCase()))];
  if (maGiam.length) await gom('pos_discount_codes', `UPPER(code) IN (${dau(maGiam)})`, maGiam);

  // Điểm âm: CÙNG vị từ còn hạn với số dư thật (diemKhach.js BALANCE_SQL) — dòng hết hạn không tính.
  const diemChon = trong([...ids.get('pos_point_transactions')]);
  const diem = await q.query(`SELECT customer_phone AS phone, SUM(CASE WHEN id IN ${diemChon} THEN 0 ELSE points END) AS con_lai,
      SUM(CASE WHEN id IN ${diemChon} THEN points ELSE 0 END) AS mat FROM pos_point_transactions
    WHERE (expires_at IS NULL OR expires_at > ?) AND customer_phone IN (SELECT customer_phone FROM pos_point_transactions WHERE id IN ${diemChon})
    GROUP BY customer_phone`, [now]);

  // Két sẽ lệch sau khi dọn: tổng tiền mặt của mọi đơn + nạp ví bị dọn trong khoảng của từng két (chỉ còn két < X — chiaGiu đã giữ phần còn lại).
  const ketLech = ketBiDoi(await tienMatTheoNgay(q, don.map((o) => o.id), P), ngayKet, (r, ky) => ky).sort();
  const tieuChi = { truoc_ngay: X, sdt: P };
  const idTheoBang = Object.fromEntries(THU_TU_XOA.map((t) => [t, [...ids.get(t)].sort((a, b) => a - b)]).filter(([, a]) => a.length));
  const viLienQuan = new Set([...L, ...ung.flatMap((o) => [o.customer_phone, o.parent_phone])]);
  return {
    tieu_chi: tieuChi,
    so_dong: Object.fromEntries(Object.entries(idTheoBang).map(([t, a]) => [t, a.length])),
    tong_dong: Object.values(idTheoBang).reduce((s, a) => s + a.length, 0),
    don: don.map(({ id, code, created_at, customer_phone, total, status }) => ({ id, code, created_at, customer_phone, total, status })),
    tong_tien: don.reduce((s, o) => s + Number(o.total || 0), 0),
    tong_diem_con_han: diem.reduce((s, r) => s + Number(r.mat || 0), 0),
    sdt: P,
    giu_lai: {
      vi: vi.filter((v) => viLienQuan.has(v.phone)),
      sdt: L.filter((s) => !P.includes(s)),
      ly_do_sdt: lyDoSdt,
      don: ung.filter((o) => giu.has(Number(o.id))).map((o) => ({ code: o.code, created_at: o.created_at, customer_phone: o.customer_phone, ly_do: giu.get(Number(o.id)) })),
    },
    diem_am: diem.filter((r) => Number(r.con_lai) < 0).map((r) => ({ phone: r.phone, con_lai: Number(r.con_lai) })),
    ket_se_lech: ketLech,
    ma_xac_nhan: bam(JSON.stringify({ tieuChi, idTheoBang })),
    idTheoBang,
  };
}

async function lietKe(than) {
  const homNay = getToday();
  const tc = docTieuChi(than, homNay);
  if (tc.loi) return tc;
  const { idTheoBang, ...kq } = await chonDong({ query }, tc.tieuChi, homNay, getNow());
  return kq;
}

/** Dọn trong MỘT giao dịch: chọn lại, so mã, chụp nguyên dòng, trả lượt mã, xoá, ghi nhật ký. Hỏng ở bất kỳ bước nào → không xoá gì. */
async function donDuLieuThu(than, nguoi) {
  const homNay = getToday();
  const tc = docTieuChi(than, homNay);
  if (tc.loi) return tc;
  if (than.go_xac_nhan !== CHU_XAC_NHAN) return loi(400, 'CHU_XAC_NHAN_SAI', `Gõ đúng "${CHU_XAC_NHAN}" để dọn`);
  const tx = await beginTransaction();
  try {
    const now = getNow();
    const c = await chonDong(tx, tc.tieuChi, homNay, now);
    let tra = null;
    if (c.ma_xac_nhan !== than.ma_xac_nhan) tra = loi(409, 'DANH_SACH_DA_DOI', 'Dữ liệu đã đổi từ lúc liệt kê — liệt kê lại, tải lại danh sách rồi dọn');
    else if (c.diem_am.length) tra = loi(409, 'DIEM_AM', 'Có SĐT sẽ bị điểm âm — thêm số đó vào danh sách SĐT hoặc đổi ngày');
    else if (!c.tong_dong) tra = { da_don: 0, so_dong: {} };
    if (tra) { await tx.rollback(); return tra; }
    const banChup = {};
    for (const [t, a] of Object.entries(c.idTheoBang)) banChup[t] = await tx.query(`SELECT * FROM ${t} WHERE id IN ${trong(a)} ORDER BY id`);
    // Như xoá đơn (orders.js DELETE): CHỈ đơn completed trả lượt — huỷ / duyệt hoàn đã trả rồi. Chụp dòng sắp sửa trước.
    const traMa = (banChup.pos_orders || []).filter((o) => o.status === 'completed');
    const suaTruoc = {
      pos_discount_codes: await tx.query(`SELECT * FROM pos_discount_codes WHERE UPPER(code) IN (${dau(traMa)})`, traMa.map((o) => String(o.discount_code || '').toUpperCase())),
      pos_voucher_grants: await tx.query(`SELECT * FROM pos_voucher_grants WHERE used_order_id IN ${trong(traMa.map((o) => o.id))}`),
    };
    for (const o of traMa) await traLuotMa(tx, o);
    for (const t of THU_TU_XOA) {
      const a = c.idTheoBang[t];
      if (!a) continue;
      const r = await tx.run(`DELETE FROM ${t} WHERE id IN ${trong(a)}`);
      if (r.changes !== a.length) throw new Error(`${t}: xoá ${r.changes}/${a.length} dòng`);
    }
    const luu = JSON.stringify({ xoa: banChup, sua_truoc: suaTruoc }, (k, v) => (COT_BI_MAT.includes(k) && v != null ? '[ẩn]' : v));
    const phan = chiaPhan(luu);
    const nk = await tx.run(`INSERT INTO pos_sync_logs (type, record_count, details, status, created_by, created_at)
      VALUES ('don_thu', ?, ?, 'success', ?, ?)`,
      [c.tong_dong, JSON.stringify({ tieu_chi: c.tieu_chi, so_dong: c.so_dong, so_phan: phan.length, bam_ban_chup: bam(luu) }), nguoi, now]);
    for (const [i, p] of phan.entries()) {
      await tx.run(`INSERT INTO pos_sync_logs (type, file_name, record_count, details, status, created_by, created_at)
        VALUES ('don_thu_chup', ?, ?, ?, 'success', ?, ?)`, [`don_thu#${nk.lastInsertRowid}`, i + 1, p, nguoi, now]);
    }
    await tx.commit();
    return { da_don: c.tong_dong, so_dong: c.so_dong, nhat_ky_id: nk.lastInsertRowid, ban_chup: banChup };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

module.exports = { CHU_XAC_NHAN, THU_TU_XOA, BANG_KHONG_DON, chiaPhan, lietKe, donDuLieuThu };
