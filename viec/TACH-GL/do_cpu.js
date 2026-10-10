#!/usr/bin/env node
/**
 * TACH-GL — A1/A2: đo thời gian thực + TỔNG CPU (user + sys) của một lệnh node KÈM mọi tiến trình con đã được chờ (cutime +
 * cstime của chính công cụ này trong /proc/self/stat, Linux). Trên máy 1 lõi, tổng CPU là sàn thời gian. Chạy ở GỐC kho, RIÊNG:
 *   node viec/TACH-GL/do_cpu.js [số lần] <file.js> [đối số…]     vd: node viec/TACH-GL/do_cpu.js 3 cong_cu/thu_gia_lap.js
 * Môi trường lọc sạch như bộ kiểm (PATH, HOME, LANG, LC_ALL). Con mồ côi (ca T5 của thu_gia_lap: cha bị SIGKILL) không được
 * chờ → không tính — phần đó nhỏ (con tự thoát ngay khi mất kênh với cha).
 */
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');

const SACH = Object.fromEntries(Object.entries(process.env).filter(([t]) => /^(PATH|HOME|LANG|LC_ALL)$/.test(t)));
const a = process.argv.slice(2);
const lan = /^\d+$/.test(a[0]) ? Number(a.shift()) : 1;
const HZ = 100;   // USER_HZ của Linux (sysconf CLK_TCK) — 100 trên mọi bản Linux thường gặp
const con = () => { const f = fs.readFileSync('/proc/self/stat', 'utf8').split(') ')[1].split(' '); return (Number(f[13]) + Number(f[14])) / HZ; };
console.log(`máy ${os.cpus().length} lõi · ${new Date().toISOString()} · ${a.join(' ')} × ${lan}`);
for (let i = 1; i <= lan; i++) {
  const c0 = con(), t0 = Date.now();
  const r = spawnSync(process.execPath, a, { env: SACH, encoding: 'utf8', maxBuffer: 1 << 26 });
  const dong = `${r.stdout}${r.stderr}`.trim().split('\n');
  console.log(`  lần ${i}: ${((Date.now() - t0) / 1000).toFixed(1)} s thực · CPU con ${(con() - c0).toFixed(1)} s · thoát ${r.status} · ${dong.pop().trim()}`);
  dong.filter((l) => /ĐẾM/.test(l)).forEach((l) => console.log('    ' + l.trim()));
}
