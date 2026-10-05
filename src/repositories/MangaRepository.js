class MangaRepository {
  constructor(db) {
    this.db = db;
  }

  async findById(id) {
    const manga = await this.db.get('SELECT * FROM mangas WHERE id = ?', [id]);
    if (!manga) return null;
    return this._attachRelations(manga);
  }

  async findBySlug(slug) {
    const manga = await this.db.get('SELECT * FROM mangas WHERE slug = ?', [slug]);
    if (!manga) return null;
    return this._attachRelations(manga);
  }

  async existsBySlug(slug, excludeId = null) {
    let sql = 'SELECT id FROM mangas WHERE slug = ?';
    const params = [slug];
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    const row = await this.db.get(sql, params);
    return !!row;
  }

  async create({ title, slug, description, status, cover, release_year }) {
    const res = await this.db.run(
      `INSERT INTO mangas (title, slug, description, status, cover, release_year, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [title, slug, description || null, status || 'ongoing', cover || null, release_year || null]
    );
    return this.findById(res.insertId || res.lastInsertRowid);
  }

  async update(id, { title, slug, description, status, cover, release_year }) {
    const current = await this.db.get('SELECT * FROM mangas WHERE id = ?', [id]);
    if (!current) return null;

    const newCover = cover !== undefined ? cover : current.cover;
    await this.db.run(
      `UPDATE mangas 
       SET title = ?, slug = ?, description = ?, status = ?, cover = ?, release_year = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        title || current.title,
        slug || current.slug,
        description !== undefined ? description : current.description,
        status || current.status,
        newCover,
        release_year !== undefined ? release_year : current.release_year,
        id
      ]
    );
    return this.findById(id);
  }

  async touchUpdated(id) {
    await this.db.run('UPDATE mangas SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  }

  async delete(id) {
    const res = await this.db.run('DELETE FROM mangas WHERE id = ?', [id]);
    return res.changes > 0;
  }

  async findWithFilters(options = {}) {
    const {
      search = '',
      tagSlug = '',
      authorSlug = '',
      status = '',
      releaseYear = null,
      sort = 'updated', // 'updated', 'recent', 'title', 'popular'
      limit = 24,
      offset = 0
    } = options;

    const { whereClause, params } = this._buildWhereClause({
      search,
      tagSlug,
      authorSlug,
      status,
      releaseYear
    });

    let orderBy = 'm.updated_at DESC';
    if (sort === 'recent') {
      orderBy = 'm.created_at DESC';
    } else if (sort === 'title') {
      orderBy = 'm.title ASC';
    } else if (sort === 'year') {
      orderBy = 'm.release_year DESC, m.title ASC';
    }

    const sql = `
      SELECT DISTINCT m.*, 
        (SELECT COUNT(*) FROM chapters c WHERE c.manga_id = m.id) as chapters_count,
        (SELECT c.number FROM chapters c WHERE c.manga_id = m.id ORDER BY c.number DESC LIMIT 1) as latest_chapter_number,
        (SELECT c.title FROM chapters c WHERE c.manga_id = m.id ORDER BY c.number DESC LIMIT 1) as latest_chapter_title
      FROM mangas m
      ${tagSlug ? 'INNER JOIN manga_tags mt ON m.id = mt.manga_id INNER JOIN tags t ON mt.tag_id = t.id' : ''}
      ${authorSlug ? 'INNER JOIN manga_authors ma ON m.id = ma.manga_id INNER JOIN authors a ON ma.author_id = a.id' : ''}
      ${whereClause ? `WHERE ${whereClause}` : ''}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, limit, offset];
    const rows = await this.db.query(sql, queryParams);

    return Promise.all(rows.map(manga => this._attachRelations(manga)));
  }

  async countWithFilters(options = {}) {
    const {
      search = '',
      tagSlug = '',
      authorSlug = '',
      status = '',
      releaseYear = null
    } = options;

    const { whereClause, params } = this._buildWhereClause({
      search,
      tagSlug,
      authorSlug,
      status,
      releaseYear
    });

    const sql = `
      SELECT COUNT(DISTINCT m.id) as total
      FROM mangas m
      ${tagSlug ? 'INNER JOIN manga_tags mt ON m.id = mt.manga_id INNER JOIN tags t ON mt.tag_id = t.id' : ''}
      ${authorSlug ? 'INNER JOIN manga_authors ma ON m.id = ma.manga_id INNER JOIN authors a ON ma.author_id = a.id' : ''}
      ${whereClause ? `WHERE ${whereClause}` : ''}
    `;

    const row = await this.db.get(sql, params);
    return row ? Number(row.total) : 0;
  }

  async findRecent(limit = 10) {
    return this.findWithFilters({ sort: 'recent', limit, offset: 0 });
  }

  async findUpdated(limit = 10) {
    return this.findWithFilters({ sort: 'updated', limit, offset: 0 });
  }

  async findFeatured(limit = 5) {
    return this.findWithFilters({ sort: 'updated', limit, offset: 0 });
  }

  async getStats() {
    const mangaCount = await this.db.get('SELECT COUNT(*) as count FROM mangas');
    const chapterCount = await this.db.get('SELECT COUNT(*) as count FROM chapters');
    const pageCount = await this.db.get('SELECT COUNT(*) as count FROM pages');
    const authorCount = await this.db.get('SELECT COUNT(*) as count FROM authors');
    const tagCount = await this.db.get('SELECT COUNT(*) as count FROM tags');

    return {
      mangas: Number(mangaCount ? mangaCount.count : 0),
      chapters: Number(chapterCount ? chapterCount.count : 0),
      pages: Number(pageCount ? pageCount.count : 0),
      authors: Number(authorCount ? authorCount.count : 0),
      tags: Number(tagCount ? tagCount.count : 0),
    };
  }

  _buildWhereClause({ search, tagSlug, authorSlug, status, releaseYear }) {
    const conditions = [];
    const params = [];

    if (search && search.trim() !== '') {
      conditions.push('(m.title LIKE ? OR m.description LIKE ?)');
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern);
    }

    if (tagSlug && tagSlug.trim() !== '') {
      conditions.push('t.slug = ?');
      params.push(tagSlug.trim());
    }

    if (authorSlug && authorSlug.trim() !== '') {
      conditions.push('a.slug = ?');
      params.push(authorSlug.trim());
    }

    if (status && status.trim() !== '') {
      conditions.push('m.status = ?');
      params.push(status.trim().toLowerCase());
    }

    if (releaseYear) {
      conditions.push('m.release_year = ?');
      params.push(parseInt(releaseYear, 10));
    }

    return {
      whereClause: conditions.length > 0 ? conditions.join(' AND ') : '',
      params,
    };
  }

  async _attachRelations(manga) {
    const authors = await this.db.query(
      `SELECT a.id, a.name, a.slug FROM authors a
       INNER JOIN manga_authors ma ON a.id = ma.author_id
       WHERE ma.manga_id = ?
       ORDER BY a.name ASC`,
      [manga.id]
    );

    const tags = await this.db.query(
      `SELECT t.id, t.name, t.slug FROM tags t
       INNER JOIN manga_tags mt ON t.id = mt.tag_id
       WHERE mt.manga_id = ?
       ORDER BY t.name ASC`,
      [manga.id]
    );

    return {
      ...manga,
      authors: authors || [],
      tags: tags || []
    };
  }
}

module.exports = MangaRepository;
