const db = require('better-sqlite3')('./data/pos.db'); db.exec('ALTER TABLE pos_orders ADD COLUMN balance_used INTEGER DEFAULT 0'); console.log('Done');
