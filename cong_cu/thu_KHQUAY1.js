#!/usr/bin/env node
/**
 * THỬ KH-QUAY-1 — hàm thuần của hộp "Mã đăng nhập App" (client/src/utils/maApp.js).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_KHQUAY1.js
 *  GỌI THẲNG client/src/utils/maApp.js (không chép lại logic). Bản đột biến: --file <đường dẫn maApp.js>
 *  Không đụng mạng, kho, máy chủ.
 */
const path = require('path');
const { pathToFileURL } = require('url');

const iF = process.argv.indexOf('--file');
const FILE = iF > 0 ? path.resolve(process.argv[iF + 1]) : path.join(__dirname, '..', 'client', 'src', 'utils', 'maApp.js');

let dat = 0;
let hong = 0;
function ca(ten, dung, chiTiet) {
  if (dung) { dat++; return; }
  hong++;
  console.log(`  ✗ ${ten}${chiTiet === undefined ? '' : ' — ' + JSON.stringify(chiTiet)}`);
}

async function main() {
  const M = await import(pathToFileURL(FILE).href);
  const { dinhDangDemNguoc, giayConLai, loiMaApp } = M;

  // ── đồng hồ: m:ss ──
  ca('D1 300 giây → "5:00"', dinhDangDemNguoc(300) === '5:00', dinhDangDemNguoc(300));
  ca('D2 299 giây → "4:59"', dinhDangDemNguoc(299) === '4:59', dinhDangDemNguoc(299));
  ca('D3 61 giây → "1:01"', dinhDangDemNguoc(61) === '1:01', dinhDangDemNguoc(61));
  ca('D4 60 giây → "1:00"', dinhDangDemNguoc(60) === '1:00', dinhDangDemNguoc(60));
  ca('D5 9 giây → "0:09" (giây đủ 2 chữ số)', dinhDangDemNguoc(9) === '0:09', dinhDangDemNguoc(9));
  ca('D6 0 → "0:00"', dinhDangDemNguoc(0) === '0:00', dinhDangDemNguoc(0));
  ca('D7 âm không ra số âm', dinhDangDemNguoc(-5) === '0:00', dinhDangDemNguoc(-5));
  ca('D8 không phải số → "0:00"', dinhDangDemNguoc(undefined) === '0:00' && dinhDangDemNguoc(NaN) === '0:00' && dinhDangDemNguoc('x') === '0:00');
  ca('D9 số lẻ làm tròn xuống (59.9 → "0:59")', dinhDangDemNguoc(59.9) === '0:59', dinhDangDemNguoc(59.9));

  // ── giây còn lại theo mốc hết hạn (ms) ──
  const MOC = 1000000;
  ca('G1 còn đúng 300 000 ms → 300 giây', giayConLai(MOC + 300000, MOC) === 300, giayConLai(MOC + 300000, MOC));
  ca('G2 còn 1 ms → 1 giây (chưa hết hạn)', giayConLai(MOC + 1, MOC) === 1, giayConLai(MOC + 1, MOC));
  ca('G3 đúng mốc → 0 (hết hạn)', giayConLai(MOC, MOC) === 0, giayConLai(MOC, MOC));
  ca('G4 quá mốc → 0, không âm', giayConLai(MOC, MOC + 7000) === 0, giayConLai(MOC, MOC + 7000));
  ca('G5 còn 1001 ms → 2 giây', giayConLai(MOC + 1001, MOC) === 2, giayConLai(MOC + 1001, MOC));
  ca('G6 mốc hỏng → 0 (hết hạn, không treo mã)', giayConLai(NaN, MOC) === 0 && giayConLai(undefined, MOC) === 0);
  ca('G7 giờ hiện tại hỏng → 0 (không ra NaN làm mã không bao giờ hết hạn)', giayConLai(MOC, NaN) === 0 && giayConLai(MOC, undefined) === 0);

  // ── lời báo lỗi ──
  const loi = (o) => Object.assign(new Error(o.message), o);
  const CHUA_BAT = 'App khách chưa bật — báo quản lý';
  ca('L1 503 → "App khách chưa bật — báo quản lý"', loiMaApp(loi({ status: 503, code: 'KH_CHUA_CAU_HINH', message: 'App khách chưa được cấu hình' })) === CHUA_BAT);
  const CHUNG = 'Máy chủ chưa sẵn sàng, thử lại sau';
  ca('L2 503 KHÔNG code (Render đang ngủ…) → lời chung, không báo "chưa bật"', loiMaApp(loi({ status: 503, message: 'x' })) === CHUNG, loiMaApp(loi({ status: 503, message: 'x' })));
  ca('L2b code KH_CHUA_CAU_HINH khoá theo code, kể cả khi status khác 503', loiMaApp(loi({ status: 500, code: 'KH_CHUA_CAU_HINH', message: 'x' })) === CHUA_BAT);
  ca('L2c 503 mang code khác → lời chung', loiMaApp(loi({ status: 503, code: 'KHAC', message: 'x' })) === CHUNG);
  const sdtLoi = loiMaApp(loi({ status: 400, code: 'SDT_KHONG_HOP_LE', message: 'Số điện thoại không hợp lệ' }));
  ca('L3 SDT_KHONG_HOP_LE → nêu SĐT của khách không hợp lệ', /SĐT.*khách.*không hợp lệ/.test(sdtLoi), sdtLoi);
  ca('L4 lỗi khác → giữ nguyên `error` máy chủ', loiMaApp(loi({ status: 429, code: 'QUA_NHIEU_LAN', message: 'Thử quá nhiều lần' })) === 'Thử quá nhiều lần');
  ca('L5 lỗi không có lời → lời mặc định, không trắng', typeof loiMaApp(new Error('')) === 'string' && loiMaApp(new Error('')).length > 0);
  ca('L6 không truyền gì → lời mặc định', typeof loiMaApp(undefined) === 'string' && loiMaApp(undefined).length > 0);

  console.log(`${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
}
main().catch((e) => { console.log(`  ✗ bài thử sập — ${e.message}`); console.log(`${dat} đạt · ${hong + 1} hỏng`); process.exit(1); });
