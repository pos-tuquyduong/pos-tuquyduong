#!/usr/bin/env node
/**
 * LUOI-1 — đo thời gian CHẠY RIÊNG (A0/A1/A2). Chạy ở GỐC kho, KHÔNG chạy lệnh nào khác song song:
 *   node viec/LUOI-1/do_thoi_gian.js [gl] [thugl] [kb] [kiem]      (mặc định: gl kb)
 *     gl    node cong_cu/gia_lap/chay.js
 *     thugl node cong_cu/thu_gia_lap.js
 *     kb    bản sao giả lập trong thư mục tạm, chèn mốc giờ quanh từng kịch bản + vòng bất biến (không ghi vào cong_cu/)
 *     kiem  node kiem_tra_truoc_khi_giao.js --day-du
 * Môi trường đã lọc sạch như bộ kiểm gọi (chỉ PATH, HOME, LANG, LC_ALL).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const GOC = path.join(__dirname, '..', '..');
const SACH = Object.fromEntries(Object.entries(process.env).filter(([t]) => /^(PATH|HOME|LANG|LC_ALL)$/.test(t)));
const chay = (ten, args) => {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, args, { cwd: GOC, env: SACH, encoding: 'utf8', maxBuffer: 1 << 26 });
  const dong = `${r.stdout}${r.stderr}`.trim().split('\n');
  console.log(`${ten}: ${((Date.now() - t0) / 1000).toFixed(1)} s · thoát ${r.status} · ${dong.slice(-1)[0].trim()}`);
  dong.filter((l) => /ĐẾM|CẢNH BÁO:|⚠/.test(l)).forEach((l) => console.log('  ' + l.trim()));
  return dong;
};
const lam = process.argv.slice(2).length ? process.argv.slice(2) : ['gl', 'kb'];
console.log(`máy ${os.cpus().length} lõi · ${new Date().toISOString()}`);
if (lam.includes('gl')) chay('giả lập', ['cong_cu/gia_lap/chay.js']);
if (lam.includes('thugl')) chay('thu_gia_lap', ['cong_cu/thu_gia_lap.js']);
if (lam.includes('kb')) {
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'do_luoi1_'));
  try {
    fs.cpSync(path.join(GOC, 'cong_cu', 'gia_lap'), tam, { recursive: true });
    const p = path.join(tam, 'chay.js');
    let s = fs.readFileSync(p, 'utf8');
    const neo = [['    try { await kb.chay(ctx); }', '    const t0 = Date.now();\n'], ['    for (const h of ctx.http)', '    const t1 = Date.now();\n']];
    for (const [a, b] of neo) {
      if (s.split(a).length !== 2) throw new Error('neo đo không khớp đúng 1 lần: ' + a);
      s = s.replace(a, b + a);
    }
    const a3 = '  const tong = `Giả lập:';
    if (s.split(a3).length !== 2) throw new Error('neo đo không khớp: ' + a3);
    s = s.replace(/(\n    for \(const ten of tenBB\) \{[\s\S]*?\n    \}\n)(  \}\n)/, '$1    viet(`DO KB${i + 1} kb ${t1 - t0} ms · bb ${Date.now() - t1} ms`);\n$2');
    if (!s.includes('DO KB')) throw new Error('không chèn được mốc vòng bất biến');
    fs.writeFileSync(p, s);
    const ra = chay('giả lập (bản đo từng KB)', [p, '--may-chu', path.join(GOC, 'server'), '--cau-hinh', path.join(GOC, 'tu_chay', 'cau_hinh.json')]);
    ra.filter((l) => l.startsWith('DO ')).forEach((l) => console.log('  ' + l));
  } finally { fs.rmSync(tam, { recursive: true, force: true }); }
}
if (lam.includes('kiem')) chay('kiem_tra --day-du', ['kiem_tra_truoc_khi_giao.js', '--day-du']);
