// P26b — bằng chứng kho bận (chạy: node viec/P26b/thu_kho_ban.js ở gốc kho). libsql file, KHÔNG đụng data/.
// Mở tx ghi thứ 2 khi tx 1 chưa xong → SQLITE_BUSY ngay; kết nối của lần thất bại hỏng: tx sau lỗi lúc COMMIT.
const { createClient } = require('../../node_modules/@libsql/client');
const fs = require('fs');
const f = require('os').tmpdir() + '/p26b_kho_ban.db';
try { fs.unlinkSync(f); } catch { /* chưa có */ }
(async () => {
  const c = createClient({ url: 'file:' + f });
  await c.execute('CREATE TABLE w (phone TEXT PRIMARY KEY, balance INT)');
  await c.execute("INSERT INTO w VALUES ('a', 100)");
  const t1 = await c.transaction('write');
  await t1.execute('UPDATE w SET balance = balance - 5');
  let e2 = 'không lỗi';
  try { await c.transaction('write'); } catch (e) { e2 = e.code; }
  console.log('tx 2 mở khi tx 1 chưa xong:', e2);
  try { await t1.commit(); console.log('tx 1 commit: ok'); } catch (e) { console.log('tx 1 commit: LỖI', e.code); }
  try {
    const t3 = await c.transaction('write');
    await t3.execute('UPDATE w SET balance = balance + 1');
    await t3.commit();
    console.log('tx 3 (sau BUSY): ok');
  } catch (e) { console.log('tx 3 (sau BUSY): LỖI', e.code, e.message); }
  console.log('số dư:', (await c.execute('SELECT balance FROM w')).rows[0].balance);
  c.close();
  try { fs.unlinkSync(f); } catch { /* bỏ qua */ }
})();
