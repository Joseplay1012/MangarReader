const config = require('./config');
const SQLiteDatabase = require('../database/SQLiteDatabase');
const MySQLDatabase = require('../database/MySQLDatabase');

let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    if (config.databaseDriver === 'mysql') {
      dbInstance = new MySQLDatabase(config.mysql);
    } else {
      dbInstance = new SQLiteDatabase(config.sqlite.path);
    }
  }
  return dbInstance;
}

module.exports = {
  getDatabase,
};
