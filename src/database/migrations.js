const { getDatabase } = require('../config/database');

async function runMigrations() {
  const db = getDatabase();
  const isMySQL = db.driver === 'mysql';

  const autoInc = isMySQL ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  const intType = isMySQL ? 'INT' : 'INTEGER';
  const realType = isMySQL ? 'DOUBLE' : 'REAL';
  const timestampDefault = isMySQL 
    ? 'DATETIME DEFAULT CURRENT_TIMESTAMP' 
    : 'DATETIME DEFAULT CURRENT_TIMESTAMP';
  const timestampUpdate = isMySQL 
    ? 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' 
    : 'DATETIME DEFAULT CURRENT_TIMESTAMP';

  // 1. mangas table
  await db.run(`
    CREATE TABLE IF NOT EXISTS mangas (
      id ${autoInc},
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'ongoing',
      cover VARCHAR(255),
      release_year ${intType},
      created_at ${timestampDefault},
      updated_at ${timestampUpdate}
    )
  `);

  // 2. authors table
  await db.run(`
    CREATE TABLE IF NOT EXISTS authors (
      id ${autoInc},
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      biography TEXT,
      created_at ${timestampDefault}
    )
  `);

  // 3. manga_authors pivot table
  await db.run(`
    CREATE TABLE IF NOT EXISTS manga_authors (
      manga_id ${intType} NOT NULL,
      author_id ${intType} NOT NULL,
      PRIMARY KEY (manga_id, author_id),
      FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
    )
  `);

  // 4. tags table
  await db.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id ${autoInc},
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      created_at ${timestampDefault}
    )
  `);

  // 5. manga_tags pivot table
  await db.run(`
    CREATE TABLE IF NOT EXISTS manga_tags (
      manga_id ${intType} NOT NULL,
      tag_id ${intType} NOT NULL,
      PRIMARY KEY (manga_id, tag_id),
      FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);

  // 6. chapters table
  await db.run(`
    CREATE TABLE IF NOT EXISTS chapters (
      id ${autoInc},
      manga_id ${intType} NOT NULL,
      number ${realType} NOT NULL,
      title VARCHAR(255),
      slug VARCHAR(255) NOT NULL,
      created_at ${timestampDefault},
      updated_at ${timestampUpdate},
      UNIQUE (manga_id, number),
      FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE
    )
  `);

  // 7. pages table
  await db.run(`
    CREATE TABLE IF NOT EXISTS pages (
      id ${autoInc},
      chapter_id ${intType} NOT NULL,
      page_number ${intType} NOT NULL,
      image_path VARCHAR(255) NOT NULL,
      width ${intType},
      height ${intType},
      created_at ${timestampDefault},
      UNIQUE (chapter_id, page_number),
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
    )
  `);

  // Indexes
  const createIndex = async (name, table, columns) => {
    try {
      await db.run(`CREATE INDEX IF NOT EXISTS ${name} ON ${table} (${columns})`);
    } catch (err) {
      // In MySQL, CREATE INDEX IF NOT EXISTS might not be standard in all versions, fallback silently if exists
      if (!err.message.includes('Duplicate key') && !err.message.includes('already exists')) {
        // Ignored or logged
      }
    }
  };

  await createIndex('idx_mangas_slug', 'mangas', 'slug');
  await createIndex('idx_mangas_created_at', 'mangas', 'created_at');
  await createIndex('idx_mangas_updated_at', 'mangas', 'updated_at');
  await createIndex('idx_authors_slug', 'authors', 'slug');
  await createIndex('idx_tags_slug', 'tags', 'slug');
  await createIndex('idx_chapters_manga_id', 'chapters', 'manga_id');
  await createIndex('idx_chapters_number', 'chapters', 'number');
  await createIndex('idx_pages_chapter_id', 'pages', 'chapter_id');
  await createIndex('idx_pages_page_number', 'pages', 'page_number');

  console.log(`[Database] Migrations executed successfully (${db.driver}).`);
}

module.exports = {
  runMigrations,
};
