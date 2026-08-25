// test-xlsx.js — chạy SAU khi nâng cấp xlsx, TRƯỚC khi push.
// Mục đích: chắc chắn (1) đã lên bản vá (>=0.19.3) và (2) export/import vẫn chạy đúng.
// Cách chạy trong Shell:   node test-xlsx.js
// PASS -> in "✅ AN TOÀN ĐỂ PUSH".  FAIL -> in lỗi, ĐỪNG push.

const XLSX = require('xlsx');

function fail(msg) { console.error('❌ FAIL:', msg); process.exit(1); }

// 1) Kiểm phiên bản đã vá chưa
let version;
try { version = require('xlsx/package.json').version; }
catch { fail('không đọc được version xlsx'); }
console.log('xlsx version:', version);

const [maj, min, pat] = version.split('.').map(Number);
const patched = maj > 0 || min > 19 || (min === 19 && pat >= 3);
if (!patched) fail(`vẫn là bản dính lỗ hổng (${version}). Cần >= 0.19.3.`);
console.log('→ Đã ở bản vá (>=0.19.3) ✓');

// 2) Round-trip EXPORT -> IMPORT đúng workflow backup.js
const rows = [
  { phone: '0900000001', balance: 150000, note: 'test' },
  { phone: '0933555595', balance: 69500, note: 'x' },
];
try {
  // export (backup.js dòng 97-117)
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'So du'.substring(0, 31));
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  if (!buffer || !buffer.length) fail('export tạo buffer rỗng');
  console.log('EXPORT: tạo file xlsx', buffer.length, 'bytes ✓');

  // import (backup.js dòng 173-186)
  const wb2 = XLSX.read(buffer, { type: 'buffer' });
  const ws2 = wb2.Sheets[wb2.SheetNames[0]];
  const back = XLSX.utils.sheet_to_json(ws2);
  console.log('IMPORT: đọc lại', back.length, 'dòng ✓');

  if (JSON.stringify(back) !== JSON.stringify(rows)) fail('dữ liệu round-trip KHÔNG khớp');
  console.log('ROUND-TRIP khớp 100% ✓');
} catch (e) {
  fail('lỗi khi chạy export/import: ' + e.message);
}

console.log('\n✅ AN TOÀN ĐỂ PUSH — đã vá lỗ hổng và export/import vẫn chạy đúng.');
