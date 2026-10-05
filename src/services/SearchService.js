const { getDatabase } = require('../config/database');
const MangaRepository = require('../repositories/MangaRepository');
const AuthorRepository = require('../repositories/AuthorRepository');
const TagRepository = require('../repositories/TagRepository');

class SearchService {
  constructor() {
    this.db = getDatabase();
    this.mangaRepo = new MangaRepository(this.db);
    this.authorRepo = new AuthorRepository(this.db);
    this.tagRepo = new TagRepository(this.db);
  }

  async search(query, limit = 10) {
    if (!query || query.trim() === '') {
      return { query: '', mangas: [], authors: [], tags: [] };
    }

    const q = query.trim();
    const pattern = `%${q}%`;

    // 1. Search mangas
    const mangas = await this.mangaRepo.findWithFilters({ search: q, limit });

    // 2. Search authors
    const authors = await this.db.query(
      `SELECT a.*, COUNT(ma.manga_id) as mangas_count 
       FROM authors a 
       LEFT JOIN manga_authors ma ON a.id = ma.author_id 
       WHERE a.name LIKE ? 
       GROUP BY a.id 
       LIMIT ?`,
      [pattern, limit]
    );

    // 3. Search tags
    const tags = await this.db.query(
      `SELECT t.*, COUNT(mt.manga_id) as mangas_count 
       FROM tags t 
       LEFT JOIN manga_tags mt ON t.id = mt.tag_id 
       WHERE t.name LIKE ? 
       GROUP BY t.id 
       LIMIT ?`,
      [pattern, limit]
    );

    return {
      query: q,
      mangas,
      authors,
      tags,
    };
  }
}

module.exports = SearchService;
