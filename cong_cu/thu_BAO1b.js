#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ BAO-1b — màn Cài đặt báo rõ mọi thao tác (dùng thông báo chung BAO-1a)
 * ═══════════════════════════════════════════════════════════════════════════
 *  PHẢI ĐỎ TRÊN CODE CHƯA VÁ (Settings.jsx còn setMessage; CaiDat/** còn thongDiep đầu thẻ; chưa có ThanhLuu / HoiPin / LoiO).
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_BAO1b.js [--goc <thư mục gốc bản sao>]      (in "n đạt · m hỏng")
 *  [A] hết dải chữ báo đầu trang + alert( ; mọi thẻ nối thongBaoKho và gọi baoXong / baoLoi
 *  [B] lỗi ô cụ thể hiện NGAY DƯỚI ô (components/LoiO.jsx) ở mọi thẻ Cài đặt
 *  [C] thanh cố định "Có thay đổi chưa lưu" (thayDoiKho.js chạy thật + ThanhLuu.jsx) và hỏi lại khi chuyển thẻ
 *  [D] PIN: nút Lưu không mờ vì thiếu PIN; bấm Lưu thì hỏi PIN (HoiPin.jsx), PIN sai báo dưới ô PIN
 *  [E] lưu xong tải lại số máy chủ giữ; nút đang xử lý mờ + "Đang lưu…"
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const iG = process.argv.indexOf('--goc');
const GOC = path.resolve(iG > 0 ? process.argv[iG + 1] : path.join(__dirname, '..'));
const SRC = path.join(GOC, 'client', 'src');
const DOC = (...p) => { try { return fs.readFileSync(path.join(SRC, ...p), 'utf8'); } catch { return ''; } };
const sach = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const SX = (...p) => sach(DOC(...p));

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const dem = (s, re) => (s.match(re) || []).length;

// Thẻ Cài đặt trong pages/CaiDat/ → [số lời GỌI baoXong/baoLoi/baoLoiTu tối thiểu, số <LoiO tối thiểu]
const THE = {
  'HangThe': [7, 7], 'GoiNap': [5, 5], 'TichDiem': [3, 2], 'ChuongTrinh': [10, 4], 'GioHoatDong': [4, 3],
  'GiaoHang': [8, 4], 'ManKhach': [7, 4], 'InPhieu': [3, 1], 'CongQr': [1, 1],
};
const THE_CO_THANH_LUU = ['HangThe', 'GioHoatDong', 'InPhieu', 'ManKhach', 'GiaoHang', 'GoiNap', 'ChuongTrinh'];
const THE_GHI_KHO = ['HangThe', 'GoiNap', 'TichDiem', 'ChuongTrinh', 'GioHoatDong', 'GiaoHang', 'ManKhach', 'InPhieu'];
const CD = (t) => SX('pages', 'CaiDat', t + '.jsx');

(async () => {
  muc('A · dùng thông báo chung, hết chữ báo đầu trang');
  const st = SX('pages', 'Settings.jsx');
  k('A1 Settings.jsx không còn state message / setMessage', !/\bsetMessage\b/.test(st) && !/\[message,/.test(st), `còn ${dem(st, /\bsetMessage\(/g)} lời gọi setMessage`);
  k('A1b Settings.jsx không vẽ dải chữ báo ở đầu trang ({message && …alert})', !/\{message\s*&&/.test(st) && !/className=\{`alert /.test(st));
  k('A1c Settings.jsx không còn alert(', !/(^|[^.\w])alert\(/m.test(st));
  k('A1d Settings.jsx nối thongBaoKho và gọi ≥ 40 lần baoXong/baoLoi/baoLoiTu', /from '\.\.\/components\/thongBaoKho\.js'/.test(st) && dem(st, /\bbao(?:Xong|Loi|LoiTu)\(/g) >= 40,
    `chỉ ${dem(st, /\bbao(?:Xong|Loi|LoiTu)\(/g)} lời gọi`);
  k("A1e Settings.jsx hết chuỗi 'Lỗi: ' + (câu lỗi tự ghép)", !/'Lỗi: ' \+|`Lỗi:/.test(st));
  const chuong = SX('components', 'CaiDatChuong.jsx');
  k('A2 components/CaiDatChuong.jsx hết thongDiep, nối thongBaoKho', !/thongDiep/i.test(chuong) && /thongBaoKho\.js/.test(chuong) && dem(chuong, /\bbao(?:Xong|Loi|LoiTu)\(/g) >= 2);
  for (const [t, [goiToiThieu]] of Object.entries(THE)) {
    const s = CD(t);
    k(`A3 CaiDat/${t}: hết thongDiep, không alert(, không 'Lỗi: ' +`, s.length > 0 && !/thongDiep/i.test(s) && !/(^|[^.\w])alert\(/m.test(s) && !/'Lỗi: ' \+|`Lỗi:/.test(s));
    const nhap = ((s.match(/import \{([^}]*)\} from '[^']*thongBaoKho\.js'/) || [])[1] || '').split(',').map((x) => x.trim());
    const goiTen = ['baoXong', 'baoLoi', 'baoLoiTu'].filter((f) => new RegExp(`\\b${f}\\(`).test(s));
    k(`A4 CaiDat/${t}: nối thongBaoKho (import đủ hàm đã gọi), gọi ≥ ${goiToiThieu} lần`, goiTen.every((f) => nhap.includes(f)) && dem(s, /\bbao(?:Xong|Loi|LoiTu)\(/g) >= goiToiThieu,
      `chỉ ${dem(s, /\bbao(?:Xong|Loi|LoiTu)\(/g)} lời gọi; import: ${nhap.join(',')}`);
  }

  muc('B · lỗi của ô hiện ngay dưới ô');
  const loiO = SX('components', 'LoiO.jsx');
  k('B1 components/LoiO.jsx chữ đỏ role="alert"; chỉ trả null khi không có lỗi', /className="loi-o"/.test(loiO) && /role="alert"/.test(loiO) && dem(loiO, /return null/g) === 1 && /if \(!loi\) return null/.test(loiO));
  const css = sach(DOC('index.css'));
  k('B2 CSS .loi-o chữ đỏ', /\.loi-o\s*\{[^}]*color:\s*#(?:b91c1c|dc2626)/.test(css));
  for (const [t, [, loiToiThieu]] of Object.entries(THE)) {
    const s = CD(t);
    k(`B3 CaiDat/${t}: dùng <LoiO ≥ ${loiToiThieu} chỗ`, /import LoiO from '\.\.\/\.\.\/components\/LoiO'/.test(s) && dem(s, /<LoiO\b/g) >= loiToiThieu, `chỉ ${dem(s, /<LoiO\b/g)} chỗ`);
  }

  muc('C · thanh "Có thay đổi chưa lưu" + hỏi lại khi chuyển thẻ');
  let K;
  try { K = await import(pathToFileURL(path.join(SRC, 'components', 'thayDoiKho.js')).href); } catch (e) { K = { loiNap: e.message }; }
  k('C0 nạp được components/thayDoiKho.js', !K.loiNap, K.loiNap || '');
  if (!K.loiNap) {
    k('C1a mới vào: không thẻ nào chưa lưu', K.coChuaLuu() === false);
    K.datChuaLuu('a', true);
    k('C1b một thẻ đang đổi → coChuaLuu', K.coChuaLuu() === true);
    K.datChuaLuu('b', true); K.datChuaLuu('a', false);
    k('C1c hai thẻ độc lập: gỡ a mà b còn đổi → vẫn chưa lưu', K.coChuaLuu() === true);
    K.datChuaLuu('b', false);
    k('C1d gỡ hết → sạch', K.coChuaLuu() === false);
    K.datChuaLuu('c', true); K.datChuaLuu('c', true); K.datChuaLuu('c', false);
    k('C1e đặt hai lần rồi gỡ một lần → sạch (không đếm cộng dồn)', K.coChuaLuu() === false);
  }
  const tl = SX('components', 'ThanhLuu.jsx');
  k('C2a ThanhLuu: chữ "Có thay đổi chưa lưu" + nút Bỏ + nút Lưu', /Có thay đổi chưa lưu/.test(tl) && />\s*Bỏ\s*</.test(tl) && /Đang lưu…/.test(tl) && /onClick=\{onBo\}/.test(tl) && /onClick=\{onLuu\}/.test(tl));
  k('C2b ThanhLuu chỉ trả null khi không đổi', /if \(!coDoi\) return null/.test(tl) && dem(tl, /return null/g) === 1);
  k('C2c ThanhLuu đăng ký với thayDoiKho trong effect và GỠ khi thoát', /useEffect\(\(\) => \{\s*datChuaLuu\(id, coDoi\);\s*return \(\) => datChuaLuu\(id, false\);/.test(tl));
  k('C2d ThanhLuu: nút khoá khi đang lưu (không bấm đôi)', dem(tl, /disabled=\{dangLuu\}/g) >= 2);
  k('C3 CSS .thanh-luu cố định cuối màn', /\.thanh-luu\s*\{[^}]*position:\s*fixed[^}]*bottom:\s*0/.test(css));
  const uth = SX('components', 'useThayDoi.js');
  k('C4a useThayDoi so ảnh chụp lúc tải với giá trị hiện tại', /JSON\.stringify\(giaTri\)/.test(uth) && /goc !== null && /.test(uth) && /!==\s*goc/.test(uth));
  for (const t of THE_CO_THANH_LUU) {
    const s = CD(t);
    k(`C4 CaiDat/${t}: dùng useThayDoi + <ThanhLuu`, /import useThayDoi from '\.\.\/\.\.\/components\/useThayDoi'/.test(s) && /useThayDoi\(/.test(s) && /<ThanhLuu\b/.test(s) && /import ThanhLuu from '\.\.\/\.\.\/components\/ThanhLuu'/.test(s));
  }
  k('C5 Settings.doiThe hỏi lại khi coChuaLuu()', /import \{ coChuaLuu \} from '\.\.\/components\/thayDoiKho\.js'/.test(st) && /const doiThe = [\s\S]{0,400}coChuaLuu\(\)[\s\S]{0,300}window\.confirm/.test(st));

  muc('D · PIN: Lưu không mờ vì thiếu PIN, bấm Lưu thì hỏi PIN');
  let P;
  try { P = await import(pathToFileURL(path.join(SRC, 'components', 'loiPin.js')).href); } catch (e) { P = { loiNap: e.message }; }
  k('D0 nạp được components/loiPin.js', !P.loiNap, P.loiNap || '');
  if (!P.loiNap) {
    const e = (code) => Object.assign(new Error('x'), { code });
    k('D1a PIN sai / khoá / không hợp lệ / chưa đặt → lỗi của ô PIN', ['PIN_CHU_QUAN_SAI', 'PIN_CHU_QUAN_KHOA', 'PIN_CHU_QUAN_KHONG_HOP_LE', 'CHUA_CO_PIN_CHU_QUAN'].every((c) => P.laLoiPin(e(c)) === true));
    k('D1b mật khẩu sai, lỗi khác, mã có PIN nằm GIỮA chuỗi, Error trơn, rỗng → KHÔNG phải lỗi ô PIN', [e('MAT_KHAU_SAI'), e('TEN_HANG_TRUNG'), e('KHAC_PIN_CHU_QUAN_SAI'), e('KHAC_CHUA_CO_PIN_CHU_QUAN'), new Error('PIN'), e(undefined), null, undefined].every((x) => P.laLoiPin(x) === false));
  }
  const hp = SX('components', 'HoiPin.jsx');
  k('D2a HoiPin: ô PIN password 4–6 số, nút xác nhận khoá khi đang xử lý', /type="password"/.test(hp) && /maxLength=\{6\}/.test(hp) && /disabled=\{dang\}/.test(hp) && /Đang lưu…|Đang xử lý…/.test(hp));
  k('D2b HoiPin báo lỗi PIN NGAY DƯỚI ô (LoiO) + thông báo nổi', /<LoiO\b/.test(hp) && /laLoiPin\(/.test(hp) && /baoLoi\(/.test(hp));
  k('D2c HoiPin: PIN sai thì KHÔNG tự đóng (giữ dữ liệu đã gõ), lỗi khác mới trả cho nơi gọi', /if \(laLoiPin\(e\)\) \{\s*setLoi\([\s\S]{0,200}?\}\s*else \{\s*dong\(\);\s*loiKhac\(e\)/.test(hp) && !/if \(laLoiPin\(e\)\) \{\s*dong\(\)/.test(hp));
  k('D2d HoiPin: đóng được bằng nút Huỷ, xoá PIN đã gõ khi mở lại', /onClick=\{dong\}/.test(hp) && /useEffect\(\(\) => \{ if \(mo\) \{ setPin\(''\)/.test(hp));
  k('D2e CSS ô nổi hỏi PIN nằm TRÊN thanh lưu, DƯỚI thông báo nổi', /\.hoi-pin-nen\s*\{[^}]*position:\s*fixed/.test(css));
  const ht = CD('HangThe'), gn = CD('GoiNap');
  k('D3a HangThe: dùng <HoiPin, hết ô PIN cạnh nút Lưu (aria-label "PIN chủ quán để lưu / xoá hạng")', /<HoiPin\b/.test(ht) && !/PIN chủ quán để lưu \/ xoá hạng/.test(ht));
  k('D3b HangThe: nút Lưu KHÔNG mờ vì thiếu PIN (disabled không nhắc pin)', !/disabled=\{[^}]*\bpin/i.test(ht) && /onClick=\{batLuu\}\s+disabled=\{dangLuu\}/.test(ht));
  k('D3c HangThe: Lưu hạng và Xoá hạng đều đi qua HoiPin (hangApi.luu / hangApi.xoa nằm trong hàm gọi từ HoiPin)', /hangApi\.luu\(\{[\s\S]{0,700}pin\b/.test(ht) && /viec: async \((\w+)\) => \{ await hangApi\.xoa\(h\.id, \1\)/.test(ht));
  k('D3d GoiNap: dùng <HoiPin, hết ô PIN đầu thẻ', /<HoiPin\b/.test(gn) && !/PIN chủ quán để thêm/.test(gn));
  k('D3e GoiNap: nút Lưu / Bật / Tắt không mờ vì thiếu PIN', !/disabled=\{[^}]*\bpin\b/i.test(gn));
  k('D3f HangThe: PIN chủ quán đặt / đổi báo lỗi NGAY DƯỚI các ô PIN', /datPin[\s\S]{0,700}setLoiPin\(/.test(ht) && /<LoiO loi=\{loiPin\}/.test(ht));
  k('D3g luồng hợp lệ: Giờ hoạt động / In phiếu / Màn khách / Giao hàng Lưu KHÔNG hỏi PIN', ['GioHoatDong', 'InPhieu', 'ManKhach', 'GiaoHang'].every((t) => !/HoiPin/.test(CD(t))));

  muc('B · phép kiểm ô phía quầy chạy thật (ngay trên / ngay dưới ngưỡng)');
  let V;
  try { V = await import(pathToFileURL(path.join(SRC, 'components', 'kiemCaiDat.js')).href); } catch (e) { V = { loiNap: e.message }; }
  k('B4 nạp được components/kiemCaiDat.js', !V.loiNap, V.loiNap || '');
  if (!V.loiNap) {
    const hang = (kv = {}, goi) => ({ khoa: 'h1', name: 'Vàng', discount_percent: 10, special_discount_percent: 0, cach_co: 'ban', goi: goi || [{ so_thang: 1, gia: '' }], ...kv });
    const co = (ds, o) => Object.keys(V.kiemHang(ds)).includes('h1:' + o);
    k('B4a hạng hợp lệ → không lỗi', Object.keys(V.kiemHang([hang()])).length === 0);
    k('B4b % thường: 0 và 90 qua; -1 và 91 lỗi dưới ô pt', !co([hang({ discount_percent: 0 })], 'pt') && !co([hang({ discount_percent: 90 })], 'pt') && co([hang({ discount_percent: -1 })], 'pt') && co([hang({ discount_percent: 91 })], 'pt'));
    k('B4c % nhóm đặc biệt: 90 qua, 91 lỗi dưới ô dacbiet; để trống = 0 qua', !co([hang({ special_discount_percent: 90 })], 'dacbiet') && co([hang({ special_discount_percent: 91 })], 'dacbiet') && !co([hang({ special_discount_percent: undefined })], 'dacbiet'));
    k('B4d tên trống / toàn dấu cách → lỗi dưới ô name', co([hang({ name: '' })], 'name') && co([hang({ name: '   ' })], 'name') && !co([hang({ name: 'A' })], 'name'));
    const g = (...t) => t.map((x) => ({ so_thang: x, gia: '' }));
    k('B4e số tháng: 1 và 60 qua; 0, 61, 1.5, rỗng lỗi dưới ô goi', !co([hang({}, g(1))], 'goi') && !co([hang({}, g(60))], 'goi') && [0, 61, 1.5, ''].every((x) => co([hang({}, g(x))], 'goi')));
    k('B4f hai gói cùng số tháng → lỗi; khác nhau qua; hạng "chỉ cấp" không xét gói', co([hang({}, g(3, 3))], 'goi') && !co([hang({}, g(3, 6))], 'goi') && !co([hang({ cach_co: 'chi_cap' }, g(0, 0))], 'goi'));
    const gi = (...t) => Object.keys(V.kiemGiay(t.map((giay) => ({ giay }))));
    k('B4g giây mỗi trang: 3 và 120 qua; 2, 121, 10.5, rỗng lỗi đúng dòng', gi(3, 120).length === 0 && gi(2).join() === 'giay0' && gi(10, 121).join() === 'giay1' && gi(10.5).length === 1 && gi('').length === 1);
    k('B4h ngừng nhận đơn: 0, rỗng, 600 qua; 601, -1, 1.5, chữ lỗi', ['0', '', '  ', '600'].every((x) => V.ngungHopLe(x)) && ['601', '-1', '1.5', 'a'].every((x) => !V.ngungHopLe(x)));
  }
  const ht2 = CD('HangThe'), mk2 = CD('ManKhach'), gh2 = CD('GioHoatDong'), gn2 = CD('GoiNap');
  k('B5 HangThe / ManKhach / GioHoatDong gọi phép kiểm chung (không viết lại số ngưỡng trong thẻ)', /kiemHang\(ds\)/.test(ht2) && /kiemGiay\(trang\)/.test(mk2) && /ngungHopLe\(/.test(gh2) && !/<= 90|<= 600|<= 120/.test(ht2 + mk2 + gh2));
  k('B6 GoiNap: số đồng phải nguyên (khớp máy chủ)', /Number\.isInteger\(so\(form\.khach_tra\)\)/.test(gn2) && /Number\.isInteger\(so\(form\.vao_tk\)\)/.test(gn2));
  k('K4a ManKhach.luu thoát khi taiLoi (thanh chưa lưu cũng gọi hàm này)', /const luu = async \(\) => \{\s*if \(taiLoi\) return;/.test(mk2));
  k('D4 HoiPin: xoá PIN sau khi xong, tiêu đề thông báo theo việc (ten)', /await chay\(pin\); setPin\(''\)/.test(hp) && /Chưa \$\{ten \|\| 'lưu'\} được/.test(hp) && /ten=\{hoiPin\?\.ten\}/.test(ht2) && /ten=\{hoiPin\?\.ten\}/.test(gn2));
  k('C6 ThanhLuu chừa chỗ cuối nội dung (không che nút Lưu cuối form)', /thanh-luu-cho/.test(tl) && /\.thanh-luu-cho\s*\{[^}]*height:\s*\d+px/.test(css));

  muc('E · lưu xong tải lại số máy chủ giữ; nút đang xử lý mờ + "Đang lưu…"');
  const GHI = {
    HangThe: /hangApi\.luu\(\{[\s\S]{0,900}?await tai\(\)/, GoiNap: /goiNapApi\.(?:sua|them)\([\s\S]{0,600}?await tai\(\)/,
    TichDiem: /tichDiemApi\.dat\([\s\S]{0,400}?await tai\(\)/, ChuongTrinh: /chuongTrinhApi\.(?:sua|them)\([\s\S]{0,600}?await tai\(\)/,
    GioHoatDong: /api\.put\('\/settings'[\s\S]{0,900}?await tai\(\)/, GiaoHang: /api\.put\('\/settings'[\s\S]{0,300}?await tai\(\)/,
    ManKhach: /api\.put\('\/settings'[\s\S]{0,600}?await tai\(\)/,
  };
  for (const [t, re] of Object.entries(GHI)) k(`E1 CaiDat/${t}: lệnh ghi xong thì await tai() (hiện số máy chủ giữ)`, re.test(CD(t)));
  k('E1b InPhieu: lưu xong nạp lại cài đặt (hàm tai)', /const tai = /.test(CD('InPhieu')) && /api\.put\('\/settings'[\s\S]{0,700}?await tai\(\)/.test(CD('InPhieu')));
  const KHOA_NUT = {   // thẻ → nút ghi chính phải khoá theo cờ đang lưu (đúng cụm trong mã)
    HangThe: 'onClick={batLuu} disabled={dangLuu}', GoiNap: 'disabled={dangLuu} onClick={luu}', TichDiem: 'disabled={!duocSua || dangLuu}',
    ChuongTrinh: 'onClick={luu} disabled={dangLuu}', GioHoatDong: 'disabled={dangLuu || taiLoi}', GiaoHang: 'onClick={luu} disabled={dangLuu}',
    ManKhach: 'disabled={dangLuu || taiLoi}', InPhieu: 'disabled={dangLuu || taiLoi || !gia}',
  };
  for (const t of THE_GHI_KHO) k(`E2 CaiDat/${t}: nút ghi chính khoá khi đang lưu (${KHOA_NUT[t]})`, CD(t).includes(KHOA_NUT[t]));
  for (const t of ['GioHoatDong', 'InPhieu', 'ManKhach', 'HangThe', 'ChuongTrinh', 'GoiNap']) {
    k(`E3 CaiDat/${t}: nút Lưu đổi chữ "Đang lưu…"`, /Đang lưu…/.test(CD(t)));
  }
  k('E4 GiaoHang: nút Lưu khoá khi đang lưu (trước đây bấm đôi được)', CD('GiaoHang').includes('onClick={luu} disabled={dangLuu}') && /Đang lưu…/.test(CD('GiaoHang')));

  muc('F · nối vào bộ kiểm');
  const kt = fs.existsSync(path.join(GOC, 'kiem_tra_truoc_khi_giao.js')) ? fs.readFileSync(path.join(GOC, 'kiem_tra_truoc_khi_giao.js'), 'utf8') : '';
  k("F1 kiem_tra_truoc_khi_giao.js có chayBaiThat('cong_cu/thu_BAO1b.js')", /^chayBaiThat\('cong_cu\/thu_BAO1b\.js'\)/m.test(kt));

  console.log(`\n${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
})();
