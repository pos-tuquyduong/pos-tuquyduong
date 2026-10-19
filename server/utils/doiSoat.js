/**
 * ĐỐI SOÁT (DOI-SOAT-1) — chạy các bất biến sổ sách của giả lập (cong_cu/gia_lap/bat_bien.js, MỘT bản — chủ quán chốt 18.10) trên
 * dữ liệu THẬT, chỉ ĐỌC. Màn hình chỉ BÁO, không bao giờ tự sửa số. Hàm ghi duy nhất là `ghiMoi` (một dòng vào pos_doi_soat_ghi).
 *
 * Ba nhóm dòng lệch: `do` (đỏ) · `can_xem` (vàng — bất biến so với trạng thái HIỆN TẠI nên có thể oan) · `cu` (vàng — dòng cũ hơn
 * ngày bản vá tương ứng có hiệu lực, `AP_DUNG_TU`). Kết quả XANH khi `do` rỗng và két không chênh.
 * Bất biến trả chuỗi (không có ngày) nên ngày suy từ chữ mô tả bằng bảng KHOA riêng từng bất biến; dòng không suy được ngày thì
 * ĐỎ ở mọi kỳ (không bao giờ ẩn một lệch). Ngày = sự việc MỚI NHẤT của đối tượng (lệch mới trên đơn cũ không thành "LỆCH CŨ").
 * Đổi chữ mô tả trong bat_bien.js thì cập nhật KHOA — bài thử C4 canh từng bất biến.
 */
const db = require('../database');
const { getToday, getNow, addDaysToDateString } = require('./helpers');
// Nạp LƯỜI (lúc chạy đối soát, không phải lúc khởi động máy chủ): thiếu cong_cu/ thì chỉ màn Đối soát báo lỗi, máy chủ vẫn lên
// (lỗi downstream không cascade); và bản sao đột biến của thu_gia_lap.js chỉ chép server/ nên nạp lúc khởi động sẽ làm sập chúng.
const batBien = () => require('../../cong_cu/gia_lap/bat_bien.js').BAT_BIEN;

const TRAN_KET = 1000000000;       // số tiền két nhập tay tối đa (đồng)
const TRAN_DONG = 200;             // số dòng lệch trả về mỗi nhóm (đếm vẫn đủ ở so_luong)
const NHAC_KHO = 'Kiểm kê kho thật: đếm tồn ở xưởng rồi đối chiếu với số kho bên SX (số kho nằm ở SX, màn này không có).';

// I7 cần số liệu kho SX của giả lập (SX giả nhận bao nhiêu lần) — dữ liệu thật không có; đối chiếu SX ↔ POS đã có ở doi-chieu.js.
const BO_QUA = { I7: 'Cần số liệu nhận của kho SX — đối chiếu SX ↔ POS làm ở doi-chieu.js (đã có), không viết đường mới.' };
// Dùng ctx.thuc: bỏ vế so với "số quầy tự đếm" của giả lập (xem bat_bien.js).
const RUT_GON = new Set(['I9', 'I13', 'I14']);
// So với trạng thái HIỆN TẠI (danh mục quà, mã giảm, đơn hoàn) nên có thể đỏ oan → nhóm CẦN XEM (chủ quán chốt 18.10).
const CAN_XEM = new Set(['I12', 'I13', 'I14']);
// Ngày đầu tiên bản vá tương ứng chạy trọn = ngày gộp (TIEN_DO_POS.json) + 1. Dòng có ngày TRƯỚC mốc → "LỆCH CŨ". null = chưa có nguồn → không vàng.
// Ngày gộp lấy từ sổ việc; kho nông nên CHƯA đối chiếu với git log (chat soát kiểm lúc duyệt PR).
const AP_DUNG_TU = {
  I1: '2026-09-28',   // P20
  I2: '2026-10-14',   // P26c H5
  I3: null,
  I4: '2026-09-28',   // P21
  I5: '2026-09-28',   // P21
  I6: null,
  I8: '2026-10-03',   // luật điểm chốt 02.10 (kèm D2)
  I9: '2026-09-24',   // P19 (nhật ký đơn)
  I11: '2026-10-04',  // P26b
  I12: null,
  I13: '2026-10-14',  // P26c H7
  I14: '2026-10-15',  // GOI-1 / GOI-2
  I15: null,
  I16: null,
  I17: '2026-10-04',  // P26b
  I18: '2026-10-14',  // P26c
  I19: '2026-10-14',  // P26c
  D1: '2026-10-17',   // P20c
  DEN: null,          // luôn CẦN XEM (không đỏ) — không cần mốc
};

const so = (x) => Number(x || 0);
const tien = (x) => so(x).toLocaleString('vi-VN') + 'đ';

function loiDS(status, code, error) {
  return Object.assign(new Error(error), { status, code });
}

// Mọi câu SQL của lượt chạy đi qua đây: không mở đầu SELECT / WITH, hoặc có từ khoá ghi ở bất kỳ đâu (SQLite chạy cả
// lệnh ghi mở đầu bằng WITH), hoặc nhiều câu → ném lỗi. Bỏ chú thích và chuỗi '…' trước khi soi để chữ trong dữ liệu không bị bắt oan.
const TU_GHI = /\b(insert|update|delete|replace\s+into|create|drop|alter|attach|detach|pragma|vacuum|reindex)\b|;\s*\S/i;
function chiDoc(sql, args = []) {
  const dau = String(sql).replace(/\/\*[\s\S]*?\*\/|--[^\n]*|'(?:[^']|'')*'/g, "''").trim();
  if (!/^(SELECT|WITH)\b/i.test(dau) || TU_GHI.test(dau)) throw new Error('Đối soát chỉ được ĐỌC: ' + dau.slice(0, 40));
  return db.query(sql, args);
}

// ─── Kỳ ngày / tuần (thứ 2 → CN) / tháng, tính bằng lịch trên chuỗi ngày (không dính múi giờ máy) ───
const DANG_NGAY = /^(\d{4})-(\d{2})-(\d{2})$/;
function ngayHopLe(s) {
  const m = DANG_NGAY.exec(String(s));
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}
const thuTrongTuan = (s) => new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10))).getUTCDay();   // 0 = CN

function tinhKy(kieu, ngay) {
  if (!['ngay', 'tuan', 'thang'].includes(kieu)) throw loiDS(400, 'DOI_SOAT_KIEU_SAI', 'Kiểu đối soát chỉ nhận ngay, tuan hoặc thang');
  const n = ngay || getToday();
  if (!ngayHopLe(n)) throw loiDS(400, 'DOI_SOAT_KY_SAI', 'Ngày không đúng dạng YYYY-MM-DD');
  if (kieu === 'ngay') return { kieu, tu: n, den: n };
  if (kieu === 'tuan') {
    const tu = addDaysToDateString(n, -((thuTrongTuan(n) + 6) % 7));
    return { kieu, tu, den: addDaysToDateString(tu, 6) };
  }
  const cuoi = new Date(Date.UTC(+n.slice(0, 4), +n.slice(5, 7), 0)).getUTCDate();
  return { kieu, tu: n.slice(0, 8) + '01', den: n.slice(0, 8) + String(cuoi).padStart(2, '0') };
}

// ─── Tiền theo sổ ───
// Một quy tắc cho tiền mặt và chuyển khoản (cach = 'cash' | 'transfer'); chủ quán chốt 18.10 (B): tiền thật vào két trong kỳ =
// bán + nạp ví + thu nợ theo NGÀY THU − trả ra. Thu nợ cộng thẳng vào cột tiền của đơn GỐC (orders.js pay-debt) nên bán phải trừ phần thu.
async function tienTheoSo(tu, den, cach) {
  const cot = cach === 'cash' ? 'cash_amount' : 'transfer_amount';
  const jTien = `CASE WHEN json_valid(chi_tiet) THEN (CASE WHEN json_extract(chi_tiet, '$.cach') = ? THEN json_extract(chi_tiet, '$.so_tien') END) END`;
  const [ban, thuNo, napVi, traRa] = await Promise.all([
    chiDoc(`SELECT COALESCE(SUM(o.${cot} - (SELECT COALESCE(SUM(${jTien}), 0) FROM pos_order_log WHERE order_id = o.id AND loai = 'thu')), 0) AS n
      FROM pos_orders o WHERE DATE(o.created_at) BETWEEN ? AND ?`, [cach, tu, den]),
    chiDoc(`SELECT COALESCE(SUM(${jTien}), 0) AS n FROM pos_order_log WHERE loai = 'thu' AND DATE(luc) BETWEEN ? AND ?`, [cach, tu, den]),
    chiDoc(`SELECT COALESCE(SUM(amount), 0) AS n FROM pos_balance_transactions
      WHERE type = 'topup' AND COALESCE(payment_method, 'cash') = ? AND DATE(created_at) BETWEEN ? AND ?`, [cach, tu, den]),
    // Huỷ đơn chỉ hoàn VÍ phần khách trả bằng ví; tiền mặt / CK của đơn thường không vào đâu → trả tận tay. Đơn MUA GÓI hoàn phần tiền
    // mặt / CK vào ví khách (dòng 'hoan_goi') nên két không ra. Dòng gói: product_id = −pkg.id (orders.js).
    chiDoc(`SELECT COALESCE(SUM(o.${cot}), 0) AS n FROM pos_orders o WHERE o.status = 'cancelled' AND DATE(o.cancelled_at) BETWEEN ? AND ?
      AND NOT EXISTS (SELECT 1 FROM pos_order_items oi WHERE oi.order_id = o.id AND oi.product_id < 0 AND oi.product_id > -1000000)`, [tu, den]),
  ]);
  const t = { ban: so(ban[0].n), thu_no: so(thuNo[0].n), nap_vi: so(napVi[0].n), tra_ra: so(traRa[0].n) };
  return { ...t, rong: t.ban + t.thu_no + t.nap_vi - t.tra_ra };
}

async function tongHop(tu, den) {
  const [tm, ck, nap, chi, diem] = await Promise.all([
    tienTheoSo(tu, den, 'cash'), tienTheoSo(tu, den, 'transfer'),
    chiDoc(`SELECT COALESCE(SUM(amount), 0) AS n FROM pos_balance_transactions WHERE type = 'topup' AND DATE(created_at) BETWEEN ? AND ?`, [tu, den]),
    chiDoc(`SELECT COALESCE(SUM(COALESCE(balance_amount, 0) + COALESCE(parent_balance_amount, 0)), 0) AS n FROM pos_orders WHERE status = 'completed' AND DATE(created_at) BETWEEN ? AND ?`, [tu, den]),
    chiDoc(`SELECT COALESCE(SUM(CASE WHEN points > 0 THEN points END), 0) AS cong, COALESCE(-SUM(CASE WHEN points < 0 THEN points END), 0) AS tru
      FROM pos_point_transactions WHERE DATE(created_at) BETWEEN ? AND ?`, [tu, den]),
  ]);
  return { tien_mat: tm, chuyen_khoan: ck, vi: { nap: so(nap[0].n), chi: so(chi[0].n) }, diem: { cong: so(diem[0].cong), tru: so(diem[0].tru) } };
}

// ─── Két của một ngày: sổ = để lại của ngày CÓ ghi gần nhất trước đó + tiền mặt vào − ra các ngày sau đó tới hết ngày này ───
async function soKet(ngay) {
  const lichSu = await chiDoc('SELECT * FROM pos_doi_soat_ghi WHERE loai = ? AND ky = ? ORDER BY id DESC', ['ket', ngay]);
  const moc = (await chiDoc(`SELECT g.ky, g.de_lai FROM pos_doi_soat_ghi g WHERE g.loai = 'ket' AND g.ky < ?
    AND g.id = (SELECT MAX(x.id) FROM pos_doi_soat_ghi x WHERE x.loai = 'ket' AND x.ky = g.ky) ORDER BY g.ky DESC LIMIT 1`, [ngay]))[0] || null;
  const soTheoSo = moc ? so(moc.de_lai) + (await tienTheoSo(addDaysToDateString(moc.ky, 1), ngay, 'cash')).rong : null;
  const dem = lichSu[0] || null;
  const chenh = dem && soTheoSo !== null ? so(dem.so_tien) - soTheoSo : null;
  const trangThai = !dem ? 'chua_dem' : soTheoSo === null ? 'chua_co_moc' : chenh === 0 ? 'khop' : 'lech';
  return {
    ky: ngay, trang_thai: trangThai, so_dem: dem ? so(dem.so_tien) : null, de_lai: dem ? so(dem.de_lai) : null,
    nguoi: dem?.nguoi || null, luc: dem?.luc || null, moc: moc ? { ky: moc.ky, de_lai: so(moc.de_lai) } : null,
    so_theo_so: soTheoSo, chenh, lich_su: lichSu,
  };
}

// ─── Ngày của dòng lệch: bảng KHOA theo từng bất biến: [mẫu chữ mô tả, phạm vi, hàm tra ngày THEO LÔ | null] ───
// phạm vi 'ky' = lọc theo kỳ; 'toan_so' = chạy cả sổ. Hàm tra = null → dòng GỘP không có khoá (loại dòng lạ): luôn đỏ, không ngày.
// Tra theo LÔ: mỗi bất biến một câu cho mỗi 400 khoá (không một câu mỗi dòng — dữ liệu cũ nhiều lệch vẫn nhanh). sql trả cột k, d.
const lo = (sql, lan = 1) => async (khoa, q) => {
  const m = new Map();
  for (let i = 0; i < khoa.length; i += 400) {
    const phan = khoa.slice(i, i + 400);
    for (const r of await q(sql(phan.map(() => '?').join(',')), Array(lan).fill(phan).flat())) m.set(String(r.k), r.d);
  }
  return m;
};
// Đơn: tạo, huỷ, nhật ký (thu / đổi cách trả), dòng ví (hoàn / đền / thu nợ), dòng điểm — lấy cái MỚI NHẤT.
const donMoiNhat = lo((ph) => `SELECT o.code AS k, MAX(o.created_at, COALESCE(o.cancelled_at, ''),
    COALESCE((SELECT MAX(luc) FROM pos_order_log WHERE order_id = o.id), ''),
    COALESCE((SELECT MAX(created_at) FROM pos_balance_transactions WHERE order_id = o.id), ''),
    COALESCE((SELECT MAX(created_at) FROM pos_point_transactions WHERE order_id = o.id), '')) AS d
  FROM pos_orders o WHERE o.code IN (${ph})`);
const viMoiNhat = lo((ph) => `SELECT customer_phone AS k, MAX(created_at) AS d FROM pos_balance_transactions WHERE customer_phone IN (${ph}) GROUP BY customer_phone`);
const KHOA = {
  I1: [[/^mã (\S+) đã dùng trên đơn/, 'ky', lo((ph) => `SELECT code AS k, CASE WHEN claimed_at IS NULL THEN diem_nhan_luc
    WHEN diem_nhan_luc IS NULL THEN claimed_at ELSE MAX(claimed_at, diem_nhan_luc) END AS d FROM pos_signup_codes WHERE code IN (${ph})`)]],
  I2: [[/^mã (\S+) mồ côi/, 'toan_so', lo((ph) => `SELECT code AS k, issued_at AS d FROM pos_signup_codes WHERE code IN (${ph})`)]],
  I3: [[/^đơn (\S+): /, 'ky', donMoiNhat]],
  I4: [[/^ví (\S+): số dư/, 'toan_so', viMoiNhat]],
  I5: [[/^loại dòng ví lạ/, 'toan_so', null]],
  I6: [[/^đơn (\S+): đã ghi/, 'ky', donMoiNhat]],
  I8: [[/^đơn (\S+): /, 'ky', donMoiNhat], [/^dòng đổi điểm #(\d+)/, 'ky', lo((ph) => `SELECT id AS k, created_at AS d FROM pos_point_transactions WHERE id IN (${ph})`)],
    [/^loại dòng điểm lạ/, 'toan_so', null]],
  I9: [[/^đơn (\S+?): /, 'ky', donMoiNhat]],
  I11: [[/^đơn #(\d+), ví/, 'ky', lo((ph) => `SELECT order_id AS k, MAX(created_at) AS d FROM pos_balance_transactions WHERE order_id IN (${ph}) GROUP BY order_id`)]],
  I12: [[/^quà #(\d+) mã/, 'ky', lo((ph) => `SELECT id AS k, granted_at AS d FROM pos_voucher_grants WHERE id IN (${ph})`)]],
  I13: [[/^mã (\S+): đã dùng/, 'toan_so', lo((ph) => `SELECT d.code AS k, COALESCE((SELECT MAX(o.created_at) FROM pos_orders o
    WHERE UPPER(o.discount_code) = UPPER(d.code)), d.created_at) AS d FROM pos_discount_codes d WHERE d.code IN (${ph})`)]],
  I14: [[/^gói #(\d+)/, 'ky', lo((ph) => `SELECT id AS k, MAX(created_at, COALESCE(updated_at, '')) AS d FROM pos_customer_packages WHERE id IN (${ph})`)],
    [/^đơn mua gói (\S+) lấy ngay/, 'ky', donMoiNhat], [/^đơn (\S+) trỏ gói/, 'ky', donMoiNhat]],
  I15: [[/^đơn mua thẻ (\S+): /, 'ky', donMoiNhat],
    [/^dòng mua thẻ #(\d+)/, 'ky', lo((ph) => `SELECT id AS k, purchased_at AS d FROM pos_membership_purchases WHERE id IN (${ph})`)]],
  I16: [[/^đơn (\S+): nhật ký đổi/, 'ky', donMoiNhat]],
  I17: [[/^yêu cầu hoàn #(\d+)/, 'ky', lo((ph) => `SELECT id AS k, COALESCE(processed_at, requested_at) AS d FROM pos_refund_requests WHERE id IN (${ph})`)]],
  I18: [[/^ví (\S+): tổng nạp/, 'toan_so', viMoiNhat]],
  I19: [[/^đơn (\S+): khách nhận lại/, 'ky', donMoiNhat]],
};

// Gắn ngày cho cả danh sách lệch của một bất biến: khớp mẫu, gom khoá theo hàm tra, tra một lượt mỗi hàm.
async function phanLoai(ten, dsLech, q) {
  const khop = dsLech.map((moTa) => {
    for (const [mau, phamVi, tra] of KHOA[ten] || []) {
      const m = mau.exec(moTa);
      if (m) return { moTa, phamVi, tra, khoa: m[1] };
    }
    return { moTa, phamVi: 'ky' };   // không khoá nào khớp → không rõ ngày
  });
  const ngay = new Map();
  for (const tra of new Set(khop.map((x) => x.tra).filter(Boolean))) {
    ngay.set(tra, await tra([...new Set(khop.filter((x) => x.tra === tra).map((x) => x.khoa))], q));
  }
  return khop.map((x) => ({ moTa: x.moTa, phamVi: x.phamVi, gop: x.tra === null, ngay: x.tra ? ngay.get(x.tra).get(x.khoa) ?? null : null }));
}

// ─── D1: SĐT có ≥ 2 dòng nhận mã bill (claimed_phone) / nhận điểm (diem_nhan_phone) — dấu vết đua (P20c) ───
async function phepD1(q) {
  const chiLanDau = ((await q("SELECT value FROM pos_settings WHERE key = 'nhandiem_chi_lan_dau'"))[0]?.value ?? '1') !== '0';
  const ds = await q(`SELECT 'claimed_phone' AS cot, claimed_phone AS sdt, COUNT(*) AS n, MAX(claimed_at) AS ngay, GROUP_CONCAT(code) AS ma
      FROM pos_signup_codes WHERE claimed_phone IS NOT NULL GROUP BY claimed_phone HAVING COUNT(*) > 1
    UNION ALL
    SELECT 'diem_nhan_phone', diem_nhan_phone, COUNT(*), MAX(diem_nhan_luc), GROUP_CONCAT(code)
      FROM pos_signup_codes WHERE diem_nhan_phone IS NOT NULL GROUP BY diem_nhan_phone HAVING COUNT(*) > 1`);
  return ds.map((r) => ({
    mo_ta: `SĐT ${r.sdt}: ${r.n} dòng ${r.cot} (mã ${r.ma})` + (r.cot === 'diem_nhan_phone' && !chiLanDau ? ' — cài đặt đang cho nhận nhiều lần' : ''),
    ngay: r.ngay || null, canXem: r.cot === 'diem_nhan_phone' && !chiLanDau,
  }));
}

// ─── DEN: đền TIỀN cho khách lẻ (đơn không SĐT — damages.js chỉ ghi ví khi đơn có SĐT). Quán không đền tiền cho khách lẻ (làm lại ly /
// tặng món — chủ quán chốt 19.10) nên két không tính khoản này; sổ có thì liệt kê CẦN XEM. created_at ghi bằng datetime('now') = UTC → +7 giờ.
async function phepDenLe(q) {
  const ds = await q(`SELECT id, order_code, refund_amount, DATETIME(created_at, '+7 hours') AS ngay FROM pos_damage_logs
    WHERE refund_amount > 0 AND COALESCE(customer_phone, '') = ''`);
  return ds.map((r) => ({ mo_ta: `đơn ${r.order_code}: đền ${tien(r.refund_amount)} cho khách lẻ không SĐT (sự cố #${r.id}) — két không tính`,
    ngay: r.ngay || null, canXem: true }));
}

async function chayDoiSoat({ kieu, ngay } = {}, boBatBien = batBien()) {
  const ky = tinhKy(kieu, ngay);
  const ctx = { thuc: true };
  const bangBB = [];
  const dong = { do: [], can_xem: [], cu: [] };
  const dem = { do: 0, can_xem: 0, cu: 0 };
  const them = (nhom, l) => { dem[nhom]++; if (dong[nhom].length < TRAN_DONG) dong[nhom].push(l); };
  const xep = (ten, moTa, ngayDong, phamVi, gop, canXemTen) => {
    const n10 = ngayDong ? String(ngayDong).slice(0, 10) : null;
    const troi = !gop && !n10;   // không rõ ngày: ĐỎ ở mọi kỳ
    if (!gop && phamVi === 'ky' && n10 && (n10 < ky.tu || n10 > ky.den)) return null;
    const apDung = AP_DUNG_TU[ten];
    const nhom = !troi && n10 && apDung && n10 < apDung ? 'cu' : !troi && canXemTen ? 'can_xem' : 'do';
    return { nhom, dong: { bat_bien: ten, mo_ta: moTa, ngay: n10, pham_vi: gop || phamVi === 'toan_so' ? 'toan_so' : 'ky' } };
  };
  for (const ten of Object.keys(boBatBien)) {
    if (BO_QUA[ten]) { bangBB.push({ ten, trang_thai: 'bo', ly_do: BO_QUA[ten] }); continue; }
    const dsLech = await boBatBien[ten](chiDoc, ctx);
    const toanSo = (KHOA[ten] || []).length > 0 && KHOA[ten].every(([, phamVi]) => phamVi === 'toan_so');
    bangBB.push({ ten, pham_vi: toanSo ? 'toan_so' : 'ky', trang_thai: RUT_GON.has(ten) ? 'rut_gon' : 'day_du' });
    for (const p of await phanLoai(ten, dsLech, chiDoc)) {
      const x = xep(ten, p.moTa, p.ngay, p.phamVi, p.gop, CAN_XEM.has(ten));
      if (x) them(x.nhom, x.dong);
    }
  }
  for (const [ten, phep] of [['D1', phepD1], ['DEN', phepDenLe]]) {
    bangBB.push({ ten, pham_vi: 'ky', trang_thai: 'day_du' });
    for (const l of await phep(chiDoc)) {
      const x = xep(ten, l.mo_ta, l.ngay, 'ky', false, l.canXem);
      if (x) them(x.nhom, x.dong);
    }
  }
  // D2 = I8 cho đơn mua thẻ / gói / lấy từ gói: chỉ gắn nhãn (không viết phép mới — chủ quán chốt giữ floor(total/per))
  const ma = [...new Set(Object.values(dong).flat().filter((l) => l.bat_bien === 'I8').map((l) => /^đơn (\S+): /.exec(l.mo_ta)?.[1]).filter(Boolean))];
  for (let i = 0; i < ma.length; i += 400) {
    const phan = ma.slice(i, i + 400);
    const the = new Set((await chiDoc(`SELECT o.code FROM pos_orders o WHERE o.code IN (${phan.map(() => '?').join(',')})
      AND (o.customer_package_id IS NOT NULL OR EXISTS (SELECT 1 FROM pos_order_items oi WHERE oi.order_id = o.id AND oi.product_id < 0)
        OR EXISTS (SELECT 1 FROM pos_customer_packages cp WHERE cp.order_id = o.id))`, phan)).map((r) => r.code));
    for (const l of Object.values(dong).flat()) {
      if (l.bat_bien === 'I8') { const c = /^đơn (\S+): /.exec(l.mo_ta)?.[1]; if (c && the.has(c)) l.nhan = 'D2'; }
    }
  }

  const kq = { ket_qua: 'XANH', kieu, ...ky, hom_nay: getToday(), bat_bien: bangBB, tien: await tongHop(ky.tu, ky.den) };
  if (kieu === 'ngay') {
    kq.ket = await soKet(ky.tu);
    if (kq.ket.trang_thai === 'lech') {
      const c = kq.ket.chenh;
      them('do', { bat_bien: 'KET', ngay: ky.tu, pham_vi: 'ky',
        mo_ta: `Két ${ky.tu}: đếm ${tien(kq.ket.so_dem)}, sổ ${tien(kq.ket.so_theo_so)}, lệch ${c > 0 ? '+' : '-'}${tien(Math.abs(c))}` });
    }
  }
  if (kieu === 'tuan') {
    kq.sao_ke = (await chiDoc('SELECT * FROM pos_doi_soat_ghi WHERE loai = ? AND ky = ? ORDER BY id DESC LIMIT 1', ['sao_ke', ky.tu]))[0] || null;
  }
  if (kieu === 'thang') kq.nhac_kho = NHAC_KHO;
  kq.do = dong.do; kq.can_xem = dong.can_xem; kq.cu = dong.cu;
  kq.so_luong = dem;
  kq.ket_qua = dem.do > 0 ? 'DO' : 'XANH';
  return kq;
}

// ─── Ghi: kiểm đầu vào, rồi THÊM một dòng (không bao giờ sửa dòng cũ) ───
function kiemTraGhi(b = {}) {
  if (!['ket', 'sao_ke'].includes(b.loai)) throw loiDS(400, 'DOI_SOAT_LOAI_SAI', 'Loại ghi chỉ nhận ket hoặc sao_ke');
  if (!ngayHopLe(b.ky) || String(b.ky) > getToday()) throw loiDS(400, 'DOI_SOAT_KY_SAI', 'Ngày không đúng dạng YYYY-MM-DD hoặc ở tương lai');
  if (b.loai === 'sao_ke') {
    if (thuTrongTuan(b.ky) !== 1) throw loiDS(400, 'DOI_SOAT_KY_SAI', 'Sao kê ghi theo tuần: ngày phải là THỨ 2 của tuần');
    if (b.da_so !== 0 && b.da_so !== 1) throw loiDS(400, 'DOI_SOAT_DA_SO_SAI', 'Đã so sao kê chỉ nhận 0 hoặc 1');
    return { loai: 'sao_ke', ky: b.ky, so_tien: null, de_lai: null, da_so: b.da_so, ghi_chu: typeof b.ghi_chu === 'string' ? b.ghi_chu.trim().slice(0, 200) : null };
  }
  const nguyen = (v) => Number.isInteger(v) && v >= 0 && v <= TRAN_KET;
  if (!nguyen(b.so_tien) || !nguyen(b.de_lai)) throw loiDS(400, 'DOI_SOAT_SO_TIEN_SAI', `Số tiền phải là số nguyên đồng từ 0 đến ${TRAN_KET.toLocaleString('vi-VN')}`);
  if (b.de_lai > b.so_tien) throw loiDS(400, 'DOI_SOAT_DE_LAI_SAI', 'Tiền để lại cho mai không được lớn hơn tiền đếm cuối ngày');
  return { loai: 'ket', ky: b.ky, so_tien: b.so_tien, de_lai: b.de_lai, da_so: null, ghi_chu: typeof b.ghi_chu === 'string' ? b.ghi_chu.trim().slice(0, 200) : null };
}

// <ghi-moi>
async function ghiMoi(b, nguoi) {
  const d = kiemTraGhi(b);
  const kq = await db.run(`INSERT INTO pos_doi_soat_ghi (loai, ky, so_tien, de_lai, da_so, ghi_chu, nguoi, luc) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [d.loai, d.ky, d.so_tien, d.de_lai, d.da_so, d.ghi_chu, nguoi, getNow()]);
  return Number(kq.lastInsertRowid);
}
// </ghi-moi>

module.exports = { chayDoiSoat, ghiMoi, kiemTraGhi, tinhKy, tienTheoSo, AP_DUNG_TU, TRAN_KET, get BAT_BIEN() { return batBien(); } };
