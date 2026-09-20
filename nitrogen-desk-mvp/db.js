const Database = require('better-sqlite3');
const path = require('path');

// Railway: usar /data se um Volume estiver montado, senao usa pasta local (efemera entre deploys)
const dbPath = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    comex_ok INTEGER NOT NULL,
    comex_period TEXT,
    comex_kg REAL,
    comex_usd REAL,
    comex_raw TEXT,
    news_count INTEGER,
    news_signal_count INTEGER,
    news_json TEXT
  );
`);

function saveSnapshot(snapshot) {
  const stmt = db.prepare(`
    INSERT INTO snapshots
      (created_at, comex_ok, comex_period, comex_kg, comex_usd, comex_raw, news_count, news_signal_count, news_json)
    VALUES (@created_at, @comex_ok, @comex_period, @comex_kg, @comex_usd, @comex_raw, @news_count, @news_signal_count, @news_json)
  `);
  return stmt.run(snapshot);
}

function getLatest() {
  return db.prepare('SELECT * FROM snapshots ORDER BY id DESC LIMIT 1').get();
}

function getPrevious() {
  return db.prepare('SELECT * FROM snapshots ORDER BY id DESC LIMIT 1 OFFSET 1').get();
}

function getHistory(limit = 20) {
  return db.prepare('SELECT * FROM snapshots ORDER BY id DESC LIMIT ?').all(limit);
}

module.exports = { db, saveSnapshot, getLatest, getPrevious, getHistory };
