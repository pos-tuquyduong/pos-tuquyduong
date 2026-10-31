#!/usr/bin/env node
/**
 * THỬ P16 — hàm thuần dựng bộ in sau thanh toán (bill · tem cốc · phiếu pha chế).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_P16.js
 *  GỌI THẲNG client/src/utils/inPhieu.js (không chép lại logic). Để thử bản đột biến:
 *    node cong_cu/thu_P16.js --file <đường dẫn inPhieu.js>   (viec/P16/dot_bien.py dùng)
 *
 *  Không đụng mạng, kho, máy chủ.
 */
const path = require('path');
const { pathToFileURL } = require('url');

const iF = process.argv.indexOf('--file');
const FILE = iF > 0 ? path.resolve(process.argv[iF + 1]) : path.join(__dirname, '..', 'client', 'src', 'utils', 'inPhieu.js');

let dat = 0;
let hong = 0;
function ca(ten, dung, chiTiet) {
  if (dung) { dat++; return; }
  hong++;
  console.log(`  ✗ ${ten}${chiTiet === undefined ? '' : ' — ' + JSON.stringify(chiTiet)}`);
}
const bang = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Đơn kiểu "vừa tạo" (POST /orders: note, is_package_item) và kiểu "đã lưu" (GET /orders/:id: notes, product_id < 0)
const monMoi = (o) => ({ product_id: 7, product_code: 'EP-CAM', product_name: 'Nước ép cam', quantity: 1, note: null, ...o });
const donMoi = (items, o = {}) => ({
  code: 'ORD-20261018-007', created_at: '2026-10-18T14:03:22', customer_name: 'Lan', customer_phone: '0912345678', items, ...o,
});
const NHOM = { 'EP-CAM': 'juice', 'TRA-GUNG': 'tea' };

async function main() {
  const P = await import(pathToFileURL(FILE).href);
  const { docBoIn, dungTem, dungPhieuPhaChe, dungBoIn, DON_MAU, NHOM_MAU, MAC_DINH_BO_IN, KHOA_BO_IN } = P;
  const cauHinh = (o) => docBoIn({ [KHOA_BO_IN]: JSON.stringify(o) });
  const macDinh = docBoIn({});

  // ── C · đọc cài đặt: thiếu khoá → mặc định ──
  ca('C1 thiếu khoá: bill bật 1 bản', macDinh.bill.bat === true && macDinh.bill.ban === 1, macDinh.bill);
  ca('C2 thiếu khoá: tem bật', macDinh.tem.bat === true && macDinh.tem.ban === 1, macDinh.tem);
  ca('C3 thiếu khoá: phiếu pha chế bật', macDinh.pha_che.bat === true && macDinh.pha_che.ban === 1, macDinh.pha_che);
  ca('C4 thiếu khoá: tự mở in TẮT', macDinh.tu_mo === false, macDinh.tu_mo);
  ca('C5 settings undefined cũng ra mặc định', bang(docBoIn(undefined), macDinh));
  ca('C6 JSON hỏng → mặc định', bang(docBoIn({ [KHOA_BO_IN]: '{hỏng' }), macDinh));
  ca('C7 khổ bill mặc định theo invoice_default_size', docBoIn({ invoice_default_size: '80mm' }).bill.kho === '80mm');
  ca('C8 khổ bill lạ → rơi về khổ mặc định', docBoIn({ invoice_default_size: 'a5', [KHOA_BO_IN]: JSON.stringify({ bill: { kho: 'xyz' } }) }).bill.kho === '80mm');   // KH-QUAY-2: khổ cũ a5 không còn → khổ mặc định 80mm
  ca('C9 chỉ ghi đè một loại, loại khác giữ mặc định', cauHinh({ tem: { bat: false } }).pha_che.bat === true && cauHinh({ tem: { bat: false } }).tem.bat === false);
  ca('C10 MAC_DINH_BO_IN không bị sửa chéo', MAC_DINH_BO_IN.tem.bat === true);
  // số bản: ngay dưới / ngay trên ngưỡng (K3)
  const ban = (v) => cauHinh({ tem: { ban: v } }).tem.ban;
  ca('C11 số bản 0 → 1', ban(0) === 1, ban(0));
  ca('C12 số bản 1 → 1', ban(1) === 1);
  ca('C13 số bản 3 → 3', ban(3) === 3);
  ca('C14 số bản 4 → 3', ban(4) === 3, ban(4));
  ca('C15 số bản "2" (chuỗi) → 2', ban('2') === 2, ban('2'));
  ca('C16 số bản rác → mặc định 1', ban('x') === 1 && ban(null) === 1, [ban('x'), ban(null)]);
  ca('C17 số bản âm → 1', ban(-5) === 1);
  ca('C18 nhóm không pha rác → danh sách rỗng', bang(cauHinh({ khong_pha: 'juice' }).khong_pha, []));
  ca('C19 tự mở in đã lưu BẬT thì đọc ra BẬT', cauHinh({ tu_mo: true }).tu_mo === true && cauHinh({ tu_mo: false }).tu_mo === false);
  ca('C20 nhóm không pha đã lưu đọc lại đúng', bang(cauHinh({ khong_pha: ['tea', 'juice'] }).khong_pha, ['tea', 'juice']));
  ca('C21 nhóm không pha lẫn phần tử rác → chỉ giữ chuỗi', bang(cauHinh({ khong_pha: ['tea', 5, null] }).khong_pha, ['tea']));
  ca('C22 JSON là mảng → mặc định', bang(docBoIn({ [KHOA_BO_IN]: '[1,2]' }), macDinh));
  const docAnToan = (s) => { try { return bang(docBoIn({ [KHOA_BO_IN]: s }), macDinh); } catch { return false; } };
  ca('C23 JSON "null" / số / chuỗi → mặc định, không ném', ['null', '5', '"x"'].every(docAnToan));
  ca('C24 không truyền gì: khổ bill 80mm · tem 40x30 · phiếu 80mm', macDinh.bill.kho === '80mm' && macDinh.tem.kho === '40x30' && macDinh.pha_che.kho === '80mm', [macDinh.bill.kho, macDinh.tem.kho, macDinh.pha_che.kho]);
  ca('C25 khổ phiếu chỉ nhận khổ của phiếu (a5 → về mặc định 80mm), tem không nhận khổ bill',
    cauHinh({ pha_che: { kho: 'a5' }, tem: { kho: 'a4' } }).pha_che.kho === '80mm' && cauHinh({ tem: { kho: 'a4' } }).tem.kho === '40x30');
  ca('C26 số bản lẻ làm tròn xuống: 1.5 → 1 · 2.9 → 2', ban(1.5) === 1 && ban(2.9) === 2, [ban(1.5), ban(2.9)]);

  // ── A · tem cốc ──
  const t2 = dungTem(donMoi([monMoi({ quantity: 2, note: 'Ít đường' })]), NHOM, macDinh);
  ca('A1 2 ly cùng món → 2 tem', t2.length === 2, t2.length);
  ca('A2 đánh 1/2, 2/2', bang(t2.map((t) => t.stt), ['1/2', '2/2']), t2.map((t) => t.stt));
  ca('A3 tem ghi tên món + ghi chú', t2[0].ten === 'Nước ép cam' && t2[0].ghiChu === 'Ít đường', t2[0]);
  ca('A4 tem ghi tên + 4 số cuối SĐT', t2[0].khach.includes('Lan') && t2[0].khach.includes('5678') && !t2[0].khach.includes('0912'), t2[0].khach);
  ca('A5 mã đơn rút gọn (đoạn cuối)', t2[0].ma === '007', t2[0].ma);
  ca('A6 giờ HH:mm lấy thẳng từ created_at (không đổi múi giờ)', t2[0].gio === '14:03', t2[0].gio);
  ca('A7 1 ly → 1 tem "1/1"', bang(dungTem(donMoi([monMoi()]), NHOM, macDinh).map((t) => t.stt), ['1/1']));
  ca('A8 hai món khác nhau: số thứ tự tính riêng từng món',
    bang(dungTem(donMoi([monMoi({ quantity: 2 }), monMoi({ product_code: 'TRA-GUNG', product_name: 'Trà gừng' })]), NHOM, macDinh).map((t) => t.stt), ['1/2', '2/2', '1/1']));
  ca('A9 khách lẻ không SĐT: không in tên "Khách lẻ"',
    dungTem(donMoi([monMoi()], { customer_name: 'Khách lẻ', customer_phone: null }), NHOM, macDinh)[0].khach === '');
  ca('A10 thiếu created_at → giờ rỗng, không ném', dungTem(donMoi([monMoi()], { created_at: undefined }), NHOM, macDinh)[0].gio === '');
  ca('A11 đơn đã lưu: ghi chú nằm ở `notes`', dungTem(donMoi([monMoi({ note: undefined, notes: 'Không đá' })]), NHOM, macDinh)[0].ghiChu === 'Không đá');
  // món không phải đồ uống pha
  const hon = donMoi([
    monMoi({ product_id: -3, product_code: 'GOI-A', product_name: '📦 Gói A', is_package_item: true }),   // đúng như POST /orders trả
    monMoi({ product_id: -1000001, product_code: 'THE-VANG', product_name: '🎟️ Thẻ Vàng', is_membership_item: true }),
  ]);
  ca('A12 gói + thẻ (đơn vừa tạo) → 0 tem', dungTem(hon, NHOM, macDinh).length === 0);
  const honLuu = donMoi([
    monMoi({ product_id: -3, product_code: 'GOI-A', product_name: 'Gói A' }),
    monMoi({ product_id: -1000001, product_code: 'THE-VANG', product_name: 'Thẻ Vàng' }),
  ]);
  ca('A13 gói + thẻ (đơn đã lưu, chỉ có product_id âm) → 0 tem', dungTem(honLuu, NHOM, macDinh).length === 0);
  ca('A14 đơn lẫn gói + 1 ly → chỉ 1 tem (K5: đơn mua gói vẫn ra tem món)',
    dungTem(donMoi([...hon.items, monMoi()]), NHOM, macDinh).length === 1);
  const tatTra = cauHinh({ khong_pha: ['tea'] });
  const lan = donMoi([monMoi(), monMoi({ product_code: 'TRA-GUNG', product_name: 'Trà gừng', quantity: 3 })]);
  ca('A15 nhóm bị tắt (tea) → 0 tem trà, vẫn tem nước ép', dungTem(lan, NHOM, tatTra).map((t) => t.ten).join() === 'Nước ép cam', dungTem(lan, NHOM, tatTra).map((t) => t.ten));
  ca('A16 không tắt nhóm → trà ra 3 tem', dungTem(lan, NHOM, macDinh).length === 4);
  ca('A17 món tra không ra nhóm → vẫn in tem (mặc định bật)', dungTem(donMoi([monMoi({ product_code: 'LA' })]), {}, tatTra).length === 1);
  ca('A18 nhóm tra không ra bảng (nhomTheoMa undefined) không ném', dungTem(donMoi([monMoi()]), undefined, macDinh).length === 1);
  ca('A19 số lượng rác (null / chữ) → 0 tem, không ném', dungTem(donMoi([monMoi({ quantity: null }), monMoi({ quantity: 'x' })]), NHOM, macDinh).length === 0);
  ca('A14b đơn ĐÃ LƯU: món lấy từ gói (giá 0, không cờ) vẫn ra tem',
    dungTem(donMoi([monMoi({ unit_price: 0, notes: null }), ...honLuu.items]), NHOM, macDinh).length === 1);
  ca('A14c món mất product_id (sản phẩm đã xoá: null / 0) vẫn ra tem, không bị tưởng là gói',
    dungTem(donMoi([monMoi({ product_id: null }), monMoi({ product_id: 0 })]), NHOM, macDinh).length === 2);
  // tem quá dài: cắt kèm "…" (DAC_TA: giới hạn ~40 ký tự)
  const dai40 = 'a'.repeat(40);
  const dai41 = 'a'.repeat(41);
  const tDai = (s) => dungTem(donMoi([monMoi({ note: s })]), NHOM, macDinh)[0].ghiChu;
  ca('A20 ghi chú đúng 40 ký tự → giữ nguyên', tDai(dai40) === dai40);
  ca('A21 ghi chú 41 ký tự → cắt kèm …, không dài quá 40', tDai(dai41) === 'a'.repeat(39) + '…', tDai(dai41));
  ca('A23 tên món đúng 40 giữ nguyên, 41 cắt kèm …',
    dungTem(donMoi([monMoi({ product_name: 'b'.repeat(40) })]), NHOM, macDinh)[0].ten === 'b'.repeat(40)
    && dungTem(donMoi([monMoi({ product_name: 'b'.repeat(41) })]), NHOM, macDinh)[0].ten === 'b'.repeat(39) + '…');
  ca('A24 giờ 1 chữ số được đệm 0: "9:05" → "09:05"', dungTem(donMoi([monMoi()], { created_at: '2026-10-18 9:05:00' }), NHOM, macDinh)[0].gio === '09:05');
  ca('A25 tên khách có khoảng trắng thừa được cắt', dungTem(donMoi([monMoi()], { customer_name: '  Lan  ' }), NHOM, macDinh)[0].khach === 'Lan · 5678');
  ca('A26 số lượng lẻ 1.9 → 1 tem (làm tròn xuống)', dungTem(donMoi([monMoi({ quantity: 1.9 })]), NHOM, macDinh).length === 1);
  ca('A27 khách có tên, không SĐT → vẫn ghi tên', dungTem(donMoi([monMoi()], { customer_name: 'Lan', customer_phone: '' }), NHOM, macDinh)[0].khach === 'Lan');
  ca('A28 SĐT có dấu chấm / cách: lấy 4 số cuối', dungTem(donMoi([monMoi()], { customer_phone: '0912.345.678' }), NHOM, macDinh)[0].khach === 'Lan · 5678');
  ca('A29 số lượng âm → 0 tem, không vào phiếu',
    dungTem(donMoi([monMoi({ quantity: -2 })]), NHOM, macDinh).length === 0 && dungPhieuPhaChe(donMoi([monMoi({ quantity: -2 })]), NHOM, macDinh).dong.length === 0);
  ca('A22 tem in lại mang cờ inLai', dungTem(donMoi([monMoi()]), NHOM, macDinh, true)[0].inLai === true && t2[0].inLai === false);

  // ── B · phiếu pha chế ──
  const don2 = donMoi([
    monMoi({ product_code: 'TRA-GUNG', product_name: 'Trà gừng', quantity: 1, note: 'Ít đường' }),
    monMoi({ product_code: 'TRA-GUNG', product_name: 'Trà gừng', quantity: 1, note: ' Ít đường ' }),
    monMoi({ product_code: 'TRA-GUNG', product_name: 'Trà gừng', quantity: 1, notes: 'Không đá' }),
    monMoi({ quantity: 2 }),
    ...hon.items,
  ]);
  const ph = dungPhieuPhaChe(don2, NHOM, macDinh);
  ca('B1 gộp cùng món + cùng ghi chú: 2 × Trà gừng — Ít đường', ph.dong[0].sl === 2 && ph.dong[0].ten === 'Trà gừng' && ph.dong[0].ghiChu === 'Ít đường', ph.dong);
  ca('B2 khác ghi chú thì tách dòng', ph.dong[1]?.sl === 1 && ph.dong[1]?.ghiChu === 'Không đá', ph.dong);
  ca('B3 món không ghi chú: dòng riêng, ghiChu rỗng', ph.dong[2]?.sl === 2 && ph.dong[2]?.ghiChu === '', ph.dong);
  ca('B4 đúng 3 dòng (gói + thẻ không vào phiếu)', ph.dong.length === 3, ph.dong.length);
  ca('B5 phiếu có mã đơn đầy đủ + giờ', ph.ma === 'ORD-20261018-007' && ph.gio === '14:03', [ph.ma, ph.gio]);
  ca('B6 phiếu KHÔNG có giá tiền', !/gia|price|total|tien/i.test(JSON.stringify(Object.keys(ph).concat(ph.dong.flatMap((d) => Object.keys(d))))), ph);
  ca('B7 đơn không có món pha → phiếu rỗng', dungPhieuPhaChe(hon, NHOM, macDinh).dong.length === 0);
  ca('B8 nhóm bị tắt cũng không vào phiếu', dungPhieuPhaChe(lan, NHOM, tatTra).dong.length === 1);
  ca('B10 phiếu giữ ĐỦ tên + ghi chú dài (DAC_TA: phiếu in đủ, chỉ tem bị cắt)',
    (() => { const d = dungPhieuPhaChe(donMoi([monMoi({ product_name: 'c'.repeat(60), note: 'd'.repeat(60) })]), NHOM, macDinh).dong[0]; return d.ten === 'c'.repeat(60) && d.ghiChu === 'd'.repeat(60); })());
  ca('B11 số lượng lẻ 1.9 → "1 ×" (làm tròn xuống)', dungPhieuPhaChe(donMoi([monMoi({ quantity: 1.9 })]), NHOM, macDinh).dong[0].sl === 1);
  ca('B12 hai món KHÁC MÃ trùng tên + ghi chú → không gộp',
    dungPhieuPhaChe(donMoi([monMoi({ product_code: 'A', product_name: 'Trà' }), monMoi({ product_code: 'B', product_name: 'Trà' })]), NHOM, macDinh).dong.length === 2);
  ca('B9 phiếu in lại mang cờ inLai', dungPhieuPhaChe(lan, NHOM, macDinh, true).inLai === true && ph.inLai === false);

  // ── D · bộ in theo cài đặt ──
  const don = donMoi([monMoi({ quantity: 2 }), monMoi({ product_code: 'TRA-GUNG', product_name: 'Trà gừng' })]);
  const bo = dungBoIn(don, { }, { nhomTheoMa: NHOM });
  ca('D1 thứ tự bill → tem → phiếu pha chế', bang(bo.map((j) => j.loai), ['bill', 'tem', 'pha_che']), bo.map((j) => j.loai));
  ca('D2 mặc định: bill 1 trang, tem 3 trang, phiếu 1 trang', bang(bo.map((j) => j.trang.length), [1, 3, 1]), bo.map((j) => j.trang.length));
  const bo2 = dungBoIn(don, { [KHOA_BO_IN]: JSON.stringify({ bill: { ban: 2 }, tem: { ban: 2 }, pha_che: { ban: 3 } }) }, { nhomTheoMa: NHOM });
  ca('D3 số bản nhân số trang (bill 2 · tem 3×2=6 · phiếu 3)', bang(bo2.map((j) => j.trang.length), [2, 6, 3]), bo2.map((j) => j.trang.length));
  ca('D4 tem 2 bản lặp lại cả bộ: 1/2 2/2 1/1 1/2 2/2 1/1', bang(bo2[1].trang.map((t) => t.stt), ['1/2', '2/2', '1/1', '1/2', '2/2', '1/1']), bo2[1].trang.map((t) => t.stt));
  const tatHet = JSON.stringify({ bill: { bat: false }, tem: { bat: false }, pha_che: { bat: false } });
  ca('D5 tắt hết → không có việc in nào', dungBoIn(don, { [KHOA_BO_IN]: tatHet }, { nhomTheoMa: NHOM }).length === 0);
  const chiTem = dungBoIn(don, { [KHOA_BO_IN]: JSON.stringify({ tem: { bat: false } }) }, { nhomTheoMa: NHOM });
  ca('D6 tắt tem → còn bill + phiếu', bang(chiTem.map((j) => j.loai), ['bill', 'pha_che']), chiTem.map((j) => j.loai));
  ca('D7 đơn không có món pha → không có job tem / phiếu, vẫn có bill',
    bang(dungBoIn(hon, {}, { nhomTheoMa: NHOM }).map((j) => j.loai), ['bill']));
  ca('D8 khổ: tem 40x30, phiếu 80mm, bill theo invoice_default_size',
    bang(dungBoIn(don, { invoice_default_size: '58mm' }, { nhomTheoMa: NHOM }).map((j) => j.kho), ['58mm', '40x30', '80mm']));

  // đơn huỷ: chỉ còn bill (K5: mọi trạng thái đơn khác vẫn ra đủ bộ)
  const huy = dungBoIn({ ...don, status: 'cancelled' }, {}, { nhomTheoMa: NHOM, inLai: true });
  ca('D9 đơn huỷ → chỉ còn bill, không tem / phiếu', bang(huy.map((j) => j.loai), ['bill']), huy.map((j) => j.loai));
  ca('D9b đơn đã hoàn tiền (refunded) → cũng chỉ còn bill', bang(dungBoIn({ ...don, status: 'refunded' }, {}, { nhomTheoMa: NHOM }).map((j) => j.loai), ['bill']));
  ca('D10 đơn huỷ: chọn tem cũng không ra', dungBoIn({ ...don, status: 'cancelled' }, {}, { nhomTheoMa: NHOM, loai: ['tem', 'pha_che'] }).length === 0);
  ca('D11 trạng thái khác (completed / cho_thu / debt / không có) → đủ bộ',
    ['completed', 'cho_thu', 'debt', undefined].every((s) => dungBoIn({ ...don, status: s }, {}, { nhomTheoMa: NHOM }).length === 3));

  // ── E · in lại ──
  const lanDau = dungBoIn(don, {}, { nhomTheoMa: NHOM });
  ca('E1 lần đầu: không cờ inLai ở bất kỳ job nào', lanDau.every((j) => j.inLai === false && j.trang.every((t) => !t.inLai)));
  const inLai = dungBoIn(don, {}, { nhomTheoMa: NHOM, inLai: true });
  ca('E2 in lại: mọi job + mọi trang mang inLai', inLai.every((j) => j.inLai === true && j.trang.every((t) => t.inLai === true)));
  const chon = dungBoIn(don, { [KHOA_BO_IN]: tatHet }, { nhomTheoMa: NHOM, loai: ['tem'], inLai: true });
  ca('E3 chọn loại: in loại được chọn kể cả khi cài đặt đang tắt', bang(chon.map((j) => j.loai), ['tem']), chon.map((j) => j.loai));
  ca('E4 chọn loại: loại không chọn không in dù cài đặt bật', bang(dungBoIn(don, {}, { nhomTheoMa: NHOM, loai: ['pha_che'] }).map((j) => j.loai), ['pha_che']));
  ca('E5 chọn rỗng [] → không in gì', dungBoIn(don, {}, { nhomTheoMa: NHOM, loai: [] }).length === 0);

  // ── Đơn mẫu cho nút Xem trước ──
  const mau = dungBoIn(DON_MAU, {}, { nhomTheoMa: NHOM_MAU });
  ca('M1 đơn mẫu ra đủ ba loại', bang(mau.map((j) => j.loai), ['bill', 'tem', 'pha_che']), mau.map((j) => j.loai));
  ca('M3 khổ đọc lại đúng từ cài đặt', cauHinh({ pha_che: { kho: '58mm' }, bill: { kho: '80mm' } }).pha_che.kho === '58mm' && cauHinh({ bill: { kho: '80mm' } }).bill.kho === '80mm');
  ca('M2 đơn mẫu có ≥ 2 tem (xem được "1/2", "2/2")', mau[1].trang.length >= 2);

  // ── Đầu vào rác: không được ném ──
  let nem = null;
  try { dungBoIn({}, {}, {}); dungBoIn({ items: null }, null, undefined); dungTem(null, null, macDinh); } catch (e) { nem = e.message; }
  ca('R1 đơn / cài đặt rỗng không ném', nem === null, nem);

  console.log(`\n${dat} đạt · ${hong} hỏng\n`);
  process.exit(hong ? 1 : 0);
}

main().catch((e) => {
  console.error(`\n✖ Bài thử sập: ${e.message}\n`);
  process.exit(2);
});
