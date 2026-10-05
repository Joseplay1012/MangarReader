class AuthorRepository {
  constructor(db) {
    this.db = db;
  }

  async findAll() {
    return this.db.query(`
      SELECT a.*, COUNT(ma.manga_id) as mangas_count 
      FROM authors a
      LEFT JOIN manga_authors ma ON a.id = ma.author_id
      GROUP BY a.id
      ORDER BY a.name ASC
    `);
  }

  async findById(id) {
    return this.db.get('SELECT * FROM authors WHERE id = ?', [id]);
  }

  async findBySlug(slug) {
    return this.db.get('SELECT * FROM authors WHERE slug = ?', [slug]);
  }

  async existsBySlug(slug, excludeId = null) {
    let sql = 'SELECT id FROM authors WHERE slug = ?';
    const params = [slug];
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    const row = await this.db.get(sql, params);
    return !!row;
  }

  async create({ name, slug, biography }) {
    const res = await this.db.run(
      'INSERT INTO authors (name, slug, biography) VALUES (?, ?, ?)',
      [name, slug, biography || null]
    );
    return this.findById(res.insertId || res.lastInsertRowid);
  }

  async update(id, { name, slug, biography }) {
    await this.db.run(
      'UPDATE authors SET name = ?, slug = ?, biography = ? WHERE id = ?',
      [name, slug, biography || null, id]
    );
    return this.findById(id);
  }

  async delete(id) {
    const res = await this.db.run('DELETE FROM authors WHERE id = ?', [id]);
    return res.changes > 0;
  }

  async findByMangaId(mangaId) {
    return this.db.query(
      `SELECT a.* FROM authors a
       INNER JOIN manga_authors ma ON a.id = ma.author_id
       WHERE ma.manga_id = ?
       ORDER BY a.name ASC`,
      [mangaId]
    );
  }

  async syncMangaAuthors(mangaId, authorIds = []) {
    await this.db.run('DELETE FROM manga_authors WHERE manga_id = ?', [mangaId]);
    if (Array.isArray(authorIds) && authorIds.length > 0) {
      for (const authorId of authorIds) {
        if (authorId) {
          await this.db.run(
            'INSERT INTO manga_authors (manga_id, author_id) VALUES (?, ?)',
            [mangaId, authorId]
          );
        }
      }
    }
  }
}

module.exports = AuthorRepository;
