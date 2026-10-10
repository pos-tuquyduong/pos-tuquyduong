#!/usr/bin/env node
/**
 * TACH-GL — B6 TRƯỚC khi chốt cách chia: 13 đột biến máy chủ E2 của cong_cu/thu_gia_lap.js (đọc nguyên mảng DOT_BIEN từ file
 * đó) chạy trên cách chia ĐỀ XUẤT — mỗi đột biến chỉ chạy lượt chứa KB của nó, tới KB đó (nghĩa --den-kb rút ngắn). Bản sao
 * server/ + cong_cu/gia_lap/ trong thư mục tạm, không ghi file thật. Chạy ở GỐC kho, CHẠY RIÊNG:
 *   node viec/TACH-GL/do_chia_e2.js '<LUOT dạng JSON>'
 * BẮT = thoát 1 và có dòng `KB<n> → <bất biến>:` · SỐNG/LẠC/HỎNG in rõ. Thoát 1 nếu có đột biến không BẮT.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const GOC = path.join(__dirname, '..', '..');
const LUOT = JSON.parse(process.argv[2]);
const SACH = Object.fromEntries(Object.entries(process.env).filter(([t]) => /^(PATH|HOME|LANG|LC_ALL)$/.test(t)));
const src = fs.readFileSync(path.join(GOC, 'cong_cu', 'thu_gia_lap.js'), 'utf8');
const a = src.indexOf('const DOT_BIEN = [');
const DOT_BIEN = new Function('return ' + src.slice(src.indexOf('[', a), src.indexOf('\n];\n', a) + 2))();
const TAM = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'do_tach_e2_')));
process.on('exit', () => fs.rmSync(TAM, { recursive: true, force: true }));

const gl = path.join(TAM, 'gl');
fs.cpSync(path.join(GOC, 'cong_cu', 'gia_lap'), gl, { recursive: true });
const p = path.join(gl, 'chay.js');
let s = fs.readFileSync(p, 'utf8');
const neo = '    if (i + 1 > DEN_KB) break;\n';
if (s.split(neo).length !== 2) throw new Error('neo không khớp');
fs.writeFileSync(p, s.replace(neo, neo + "    if (!String(process.env.GL_CHI).split(',').map(Number).includes(i + 1)) continue;\n"));

const chay = ([ma, file, goc, thay, soLan, kb, bb]) => new Promise((xong) => {
  const thu = path.join(TAM, ma.split(' ')[0]);
  fs.cpSync(path.join(GOC, 'server'), path.join(thu, 'server'), { recursive: true, dereference: true });
  fs.symlinkSync(path.join(GOC, 'node_modules'), path.join(thu, 'node_modules'));   // chỉ đọc, như banSao của thu_gia_lap
  const f = path.join(thu, 'server', file);
  if (!fs.realpathSync(f).startsWith(TAM + path.sep)) return xong(`HỎNG ${ma}: đích ngoài thư mục tạm`);
  const nd = fs.readFileSync(f, 'utf8');
  if (nd.split(goc).length - 1 !== soLan) return xong(`HỎNG ${ma}: chuỗi gốc khớp ${nd.split(goc).length - 1} lần`);
  fs.writeFileSync(f, nd.split(goc).join(thay));
  const luot = LUOT.find((l) => l.includes(kb));
  const chi = luot.filter((x) => x <= kb).join(',');
  const c = spawn(process.execPath, [p, '--may-chu', path.join(thu, 'server'), '--cau-hinh', path.join(GOC, 'tu_chay', 'cau_hinh.json')],
    { cwd: GOC, env: { ...SACH, GL_CHI: chi } });
  let ra = '';
  c.stdout.on('data', (d) => { ra += d; });
  c.stderr.on('data', (d) => { ra += d; });
  c.on('close', (st) => {
    const bat = st === 1 && new RegExp(`KB${kb} → ${bb}:`).test(ra);
    xong(`${bat ? 'BẮT' : st === 0 ? 'SỐNG' : 'LẠC'} ${ma} → KB${kb} → ${bb} · lượt [${chi}] · thoát ${st}`
      + (bat ? '' : ' · ' + (ra.split('\n').filter((l) => / → /.test(l)).join(' | ') || ra.trim().split('\n').pop())));
  });
});

(async () => {
  console.log(`máy ${os.cpus().length} lõi · ${new Date().toISOString()} · LUOT ${JSON.stringify(LUOT)}`);
  const kq = await Promise.all(DOT_BIEN.map(chay));
  kq.forEach((l) => console.log('  ' + l));
  const bat = kq.filter((l) => l.startsWith('BẮT')).length;
  console.log(`  ${bat}/${kq.length} BẮT`);
  process.exitCode = bat === kq.length ? 0 : 1;
})();
