class PageRepository {
  constructor(db) {
    this.db = db;
  }

  async findById(id) {
    return this.db.get('SELECT * FROM pages WHERE id = ?', [id]);
  }

  async findByChapterId(chapterId) {
    return this.db.query(
      `SELECT id, chapter_id, page_number, image_path, width, height, created_at 
       FROM pages 
       WHERE chapter_id = ? 
       ORDER BY page_number ASC`,
      [chapterId]
    );
  }

  async create({ chapter_id, page_number, image_path, width, height }) {
    const res = await this.db.run(
      `INSERT INTO pages (chapter_id, page_number, image_path, width, height, created_at) 
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [chapter_id, page_number, image_path, width || null, height || null]
    );
    return this.findById(res.insertId || res.lastInsertRowid);
  }

  async bulkInsert(pages) {
    const results = [];
    for (const page of pages) {
      const created = await this.create(page);
      results.push(created);
    }
    return results;
  }

  async updatePageNumber(id, page_number) {
    await this.db.run(
      'UPDATE pages SET page_number = ? WHERE id = ?',
      [page_number, id]
    );
  }

  async reorderPages(chapterId, pageOrderArray) {
    // Two-pass update to safely avoid UNIQUE(chapter_id, page_number) constraint collisions
    // Pass 1: Set to temporary negative values
    for (let i = 0; i < pageOrderArray.length; i++) {
      const item = pageOrderArray[i];
      const pageId = typeof item === 'object' ? item.id : item;
      await this.db.run(
        'UPDATE pages SET page_number = ? WHERE id = ? AND chapter_id = ?',
        [-(i + 10000), pageId, chapterId]
      );
    }

    // Pass 2: Set to target final order
    for (let i = 0; i < pageOrderArray.length; i++) {
      const item = pageOrderArray[i];
      const pageId = typeof item === 'object' ? item.id : item;
      const targetNumber = typeof item === 'object' && item.page_number !== undefined ? item.page_number : (i + 1);
      await this.db.run(
        'UPDATE pages SET page_number = ? WHERE id = ? AND chapter_id = ?',
        [targetNumber, pageId, chapterId]
      );
    }
  }

  async delete(id) {
    const res = await this.db.run('DELETE FROM pages WHERE id = ?', [id]);
    return res.changes > 0;
  }

  async deleteByChapterId(chapterId) {
    const res = await this.db.run('DELETE FROM pages WHERE chapter_id = ?', [chapterId]);
    return res.changes;
  }
}

module.exports = PageRepository;
