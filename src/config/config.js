const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const rootDir = path.resolve(__dirname, '../..');
const storageRoot = path.resolve(rootDir, process.env.STORAGE_PATH || './storage');
const dataRoot = path.resolve(rootDir, './data');

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseDriver: (process.env.DATABASE_DRIVER || 'sqlite').toLowerCase(),
  
  sqlite: {
    path: path.resolve(rootDir, process.env.SQLITE_PATH || './data/database.sqlite'),
  },

  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    database: process.env.MYSQL_DATABASE || 'manga_reader',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    connectionLimit: 10,
    waitForConnections: true,
  },

  storage: {
    root: storageRoot,
    covers: path.join(storageRoot, 'covers'),
    chapters: path.join(storageRoot, 'chapters'),
  },

  dataDir: dataRoot,
  rootDir,

  admin: {
    user: process.env.ADMIN_USER || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    sessionSecret: process.env.SESSION_SECRET || 'manga-reader-secret-session-key',
  },

  site: {
    name: process.env.SITE_NAME || 'MangaReader',
    url: process.env.SITE_URL || 'http://localhost:3000',
  }
};
