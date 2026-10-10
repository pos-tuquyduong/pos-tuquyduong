#!/usr/bin/env node
/**
 * TACH-GL — bằng chứng ĐỎ (A16): chạy cong_cu/thu_gia_lap.js của HEAD trên cong_cu/gia_lap/ của GỐC 2237259 (git archive vào
 * thư mục tạm; server/, tu_chay/, node_modules nối về kho thật — chỉ đọc, như viec/TU-CHAY-4/dot_bien.py kiểu 'gl').
 * Chạy ở GỐC kho, RIÊNG:   node viec/TACH-GL/chay_goc.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const GOC = path.join(__dirname, '..', '..');
const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'tachgl_goc_'));
try {
  const tar = execFileSync('git', ['archive', '2237259', 'cong_cu/gia_lap'], { cwd: GOC, maxBuffer: 1 << 26 });
  execFileSync('tar', ['-x', '-C', tam], { input: tar });
  for (const x of ['server', 'tu_chay', 'node_modules']) fs.symlinkSync(path.join(GOC, x), path.join(tam, x));
  const r = spawnSync(process.execPath, ['cong_cu/thu_gia_lap.js', '--gia-lap', path.join(tam, 'cong_cu', 'gia_lap')],
    { cwd: GOC, encoding: 'utf8', maxBuffer: 1 << 26 });
  process.stdout.write(`thu_gia_lap (HEAD) trên gia_lap gốc 2237259 · thoát ${r.status}\n`
    + `${r.stdout}${r.stderr}`.split('\n').filter((l) => /✗|đạt ·/.test(l)).join('\n') + '\n');
} finally { fs.rmSync(tam, { recursive: true, force: true }); }
