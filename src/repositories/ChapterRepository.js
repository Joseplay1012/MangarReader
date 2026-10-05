class ChapterRepository {
  constructor(db) {
    this.db = db;
  }

  async findById(id) {
    return this.db.get('SELECT * FROM chapters WHERE id = ?', [id]);
  }

  async findByMangaIdAndNumber(mangaId, number) {
    return this.db.get(
      'SELECT * FROM chapters WHERE manga_id = ? AND number = ?',
      [mangaId, number]
    );
  }

  async findByMangaIdAndSlug(mangaId, slug) {
    return this.db.get(
      'SELECT * FROM chapters WHERE manga_id = ? AND slug = ?',
      [mangaId, slug]
    );
  }

  async findAllByMangaId(mangaId, order = 'DESC') {
    const dir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    return this.db.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM pages p WHERE p.chapter_id = c.id) as pages_count 
       FROM chapters c 
       WHERE c.manga_id = ? 
       ORDER BY c.number ${dir}`,
      [mangaId]
    );
  }

  async create({ manga_id, number, title, slug }) {
    const res = await this.db.run(
      `INSERT INTO chapters (manga_id, number, title, slug, created_at, updated_at) 
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [manga_id, number, title || null, slug]
    );
    return this.findById(res.insertId || res.lastInsertRowid);
  }

  async update(id, { number, title, slug }) {
    const current = await this.findById(id);
    if (!current) return null;

    await this.db.run(
      `UPDATE chapters 
       SET number = ?, title = ?, slug = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        number !== undefined ? number : current.number,
        title !== undefined ? title : current.title,
        slug !== undefined ? slug : current.slug,
        id
      ]
    );
    return this.findById(id);
  }

  async delete(id) {
    const res = await this.db.run('DELETE FROM chapters WHERE id = ?', [id]);
    return res.changes > 0;
  }

  async getNavigation(mangaId, currentNumber) {
    // Previous chapter (lower number)
    const prev = await this.db.get(
      `SELECT id, number, slug, title 
       FROM chapters 
       WHERE manga_id = ? AND number < ? 
       ORDER BY number DESC 
       LIMIT 1`,
      [mangaId, currentNumber]
    );

    // Next chapter (higher number)
    const next = await this.db.get(
      `SELECT id, number, slug, title 
       FROM chapters 
       WHERE manga_id = ? AND number > ? 
       ORDER BY number ASC 
       LIMIT 1`,
      [mangaId, currentNumber]
    );

    return {
      previous: prev || null,
      next: next || null
    };
  }
}

module.exports = ChapterRepository;
