class TagRepository {
  constructor(db) {
    this.db = db;
  }

  async findAll() {
    return this.db.query(`
      SELECT t.*, COUNT(mt.manga_id) as mangas_count 
      FROM tags t
      LEFT JOIN manga_tags mt ON t.id = mt.tag_id
      GROUP BY t.id
      ORDER BY t.name ASC
    `);
  }

  async findById(id) {
    return this.db.get('SELECT * FROM tags WHERE id = ?', [id]);
  }

  async findBySlug(slug) {
    return this.db.get('SELECT * FROM tags WHERE slug = ?', [slug]);
  }

  async existsBySlug(slug, excludeId = null) {
    let sql = 'SELECT id FROM tags WHERE slug = ?';
    const params = [slug];
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    const row = await this.db.get(sql, params);
    return !!row;
  }

  async create({ name, slug }) {
    const res = await this.db.run(
      'INSERT INTO tags (name, slug) VALUES (?, ?)',
      [name, slug]
    );
    return this.findById(res.insertId || res.lastInsertRowid);
  }

  async update(id, { name, slug }) {
    await this.db.run(
      'UPDATE tags SET name = ?, slug = ? WHERE id = ?',
      [name, slug, id]
    );
    return this.findById(id);
  }

  async delete(id) {
    const res = await this.db.run('DELETE FROM tags WHERE id = ?', [id]);
    return res.changes > 0;
  }

  async findByMangaId(mangaId) {
    return this.db.query(
      `SELECT t.* FROM tags t
       INNER JOIN manga_tags mt ON t.id = mt.tag_id
       WHERE mt.manga_id = ?
       ORDER BY t.name ASC`,
      [mangaId]
    );
  }

  async syncMangaTags(mangaId, tagIds = []) {
    await this.db.run('DELETE FROM manga_tags WHERE manga_id = ?', [mangaId]);
    if (Array.isArray(tagIds) && tagIds.length > 0) {
      for (const tagId of tagIds) {
        if (tagId) {
          await this.db.run(
            'INSERT INTO manga_tags (manga_id, tag_id) VALUES (?, ?)',
            [mangaId, tagId]
          );
        }
      }
    }
  }
}

module.exports = TagRepository;
