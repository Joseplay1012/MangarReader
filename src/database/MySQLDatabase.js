const Database = require('./Database');
const mysql = require('mysql2/promise');

class MySQLDatabase extends Database {
  constructor(config) {
    super();
    this.config = config;
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: config.waitForConnections !== undefined ? config.waitForConnections : true,
      connectionLimit: config.connectionLimit || 10,
      queueLimit: 0,
      dateStrings: true,
    });
    this.driver = 'mysql';
  }

  async query(sql, params = []) {
    const [rows] = await this.pool.execute(sql, params);
    return rows;
  }

  async get(sql, params = []) {
    const [rows] = await this.pool.execute(sql, params);
    if (Array.isArray(rows) && rows.length > 0) {
      return rows[0];
    }
    return null;
  }

  async run(sql, params = []) {
    const [result] = await this.pool.execute(sql, params);
    return {
      lastInsertRowid: result.insertId,
      insertId: result.insertId,
      changes: result.affectedRows
    };
  }

  async transaction(callback) {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();
    try {
      // Create a wrapper delegating queries to the specific connection
      const wrapper = {
        query: async (sql, params = []) => {
          const [rows] = await connection.execute(sql, params);
          return rows;
        },
        get: async (sql, params = []) => {
          const [rows] = await connection.execute(sql, params);
          return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
        },
        run: async (sql, params = []) => {
          const [res] = await connection.execute(sql, params);
          return {
            lastInsertRowid: res.insertId,
            insertId: res.insertId,
            changes: res.affectedRows
          };
        }
      };

      const result = await callback(wrapper);
      await connection.commit();
      return result;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

module.exports = MySQLDatabase;
