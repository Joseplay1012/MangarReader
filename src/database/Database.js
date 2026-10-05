/**
 * Base abstract Database class.
 * All repository classes interact exclusively through this interface.
 */
class Database {
  constructor() {
    if (new.target === Database) {
      throw new TypeError('Cannot construct Database instances directly');
    }
  }

  /**
   * Execute a query that returns multiple rows.
   * @param {string} sql 
   * @param {Array<any>} params 
   * @returns {Promise<Array<any>>}
   */
  async query(sql, params = []) {
    throw new Error('Method "query" must be implemented.');
  }

  /**
   * Execute a query that returns a single row.
   * @param {string} sql 
   * @param {Array<any>} params 
   * @returns {Promise<any|null>}
   */
  async get(sql, params = []) {
    throw new Error('Method "get" must be implemented.');
  }

  /**
   * Execute an INSERT, UPDATE, or DELETE statement.
   * @param {string} sql 
   * @param {Array<any>} params 
   * @returns {Promise<{ lastInsertRowid: number, insertId: number, changes: number }>}
   */
  async run(sql, params = []) {
    throw new Error('Method "run" must be implemented.');
  }

  /**
   * Execute multiple operations within an atomic transaction.
   * @param {Function} callback (dbInstance) => Promise<any>
   * @returns {Promise<any>}
   */
  async transaction(callback) {
    throw new Error('Method "transaction" must be implemented.');
  }

  /**
   * Close the database connection.
   */
  async close() {
    throw new Error('Method "close" must be implemented.');
  }
}

module.exports = Database;
