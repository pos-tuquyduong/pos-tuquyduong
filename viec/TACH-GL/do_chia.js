#!/usr/bin/env node
/**
 * TACH-GL — đo THỬ cách chia lượt TRƯỚC khi sửa chay.js (bản sao, không ghi cong_cu/). Chạy ở GỐC kho, CHẠY RIÊNG:
 *   node viec/TACH-GL/do_chia.js [--rieng] <nhóm> <nhóm> …      vd: 1-16 17-27   ·   1,7,14,23,27 2-6,8-13
 *     mặc định  các nhóm chạy CÙNG LÚC (mỗi nhóm một tiến trình giả lập, kho tạm riêng)
 *     --rieng   thêm: từng nhóm chạy MỘT MÌNH trước (bằng chứng "mỗi lượt chạy riêng → ĐẠT" cho bảng phụ thuộc)
 * Bản sao chay.js: chỉ chạy các KB trong GL_CHI (giữ SỐ GỐC), in CPU (user + sys) của tiến trình lúc thoát. Sau chia lượt
 * (TACH-GL), công cụ chạy THẲNG tiến trình lượt của bản sao (--luot 1, LUOT ghi đè = một lượt chứa mọi KB) — không qua cha,
 * nên dùng được cả trên gốc lẫn HEAD (gốc bỏ qua --luot). Đo từng KB: node viec/TACH-GL/do_chia.js 17 (một nhóm một KB).
 * Môi trường đã lọc sạch như bộ kiểm (PATH, HOME, LANG, LC_ALL) + GL_CHI.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const GOC = path.join(__dirname, '..', '..');
const SACH = Object.fromEntries(Object.entries(process.env).filter(([t]) => /^(PATH|HOME|LANG|LC_ALL)$/.test(t)));
const a = process.argv.slice(2);
const rieng = a.includes('--rieng');
const nhom = a.filter((x) => !x.startsWith('--'));
const mo = (s) => s.split(',').flatMap((p) => { const [x, y] = p.split('-').map(Number); return y ? Array.from({ length: y - x + 1 }, (_, i) => x + i) : [x]; });

const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'do_tach_'));
process.on('exit', () => fs.rmSync(tam, { recursive: true, force: true }));
fs.cpSync(path.join(GOC, 'cong_cu', 'gia_lap'), tam, { recursive: true });
const p = path.join(tam, 'chay.js');
let s = fs.readFileSync(p, 'utf8');
for (const [neo, them] of [
  ['const TRE_MS = 40;\n', "const CHI = new Set(String(process.env.GL_CHI || '').split(',').map(Number));\n"
    + "process.on('exit', () => { const u = process.cpuUsage(); viet(`CPU ${((u.user + u.system) / 1e6).toFixed(1)} s`); });\n"],
  ['    if (i + 1 > DEN_KB) break;\n', '    if (!CHI.has(i + 1)) continue;\n']]) {
  if (s.split(neo).length !== 2) throw new Error('neo không khớp đúng 1 lần: ' + neo);
  s = s.replace(neo, neo + them);
}
fs.writeFileSync(p, s);
fs.appendFileSync(path.join(tam, 'kich_ban.js'), '\nmodule.exports.LUOT = [module.exports.KICH_BAN.map((_, i) => i + 1)];   // do_chia: một lượt\n');

const chay = (chi) => new Promise((xong) => {
  const t0 = Date.now();
  const c = spawn(process.execPath, [p, '--luot', '1', '--may-chu', path.join(GOC, 'server'), '--cau-hinh', path.join(GOC, 'tu_chay', 'cau_hinh.json')],
    { cwd: GOC, env: { ...SACH, GL_CHI: chi } });
  let ra = '';
  c.stdout.on('data', (d) => { ra += d; });
  c.stderr.on('data', (d) => { ra += d; });
  c.on('close', (st) => {
    const d = ra.trim().split('\n');
    xong(`  [${chi}] ${((Date.now() - t0) / 1000).toFixed(1)} s · thoát ${st} · ${d.find((l) => l.startsWith('CPU')) || ''} · `
      + `${d.filter((l) => /^(Giả lập|Lượt)/.test(l)).join(' ')}${d.filter((l) => / → /.test(l)).map((l) => '\n      ' + l.trim()).join('')}`);
  });
});

(async () => {
  const ds = nhom.map((n) => mo(n).join(','));
  console.log(`máy ${os.cpus().length} lõi · ${new Date().toISOString()} · nhóm: ${nhom.join(' | ')}`);
  if (rieng) for (const chi of ds) console.log('riêng' + (await chay(chi)));
  const t0 = Date.now();
  const kq = await Promise.all(ds.map(chay));
  console.log(`cùng lúc: ${((Date.now() - t0) / 1000).toFixed(1)} s\n${kq.join('\n')}`);
})();
