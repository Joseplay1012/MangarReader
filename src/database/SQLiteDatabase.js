const Database = require('./Database');
const SQLite = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

class SQLiteDatabase extends Database {
  constructor(dbPath) {
    super();
    this.dbPath = dbPath;
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new SQLite(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('busy_timeout = 5000');
    this.driver = 'sqlite';
  }

  async query(sql, params = []) {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }

  async get(sql, params = []) {
    const stmt = this.db.prepare(sql);
    const row = stmt.get(...params);
    return row !== undefined ? row : null;
  }

  async run(sql, params = []) {
    const stmt = this.db.prepare(sql);
    const info = stmt.run(...params);
    return {
      lastInsertRowid: Number(info.lastInsertRowid),
      insertId: Number(info.lastInsertRowid),
      changes: info.changes
    };
  }

  async transaction(callback) {
    // better-sqlite3 transactions are synchronous internally
    const trx = this.db.transaction((...args) => {
      return callback(this, ...args);
    });
    return trx();
  }

  async close() {
    if (this.db && this.db.open) {
      this.db.close();
    }
  }
}

module.exports = SQLiteDatabase;
