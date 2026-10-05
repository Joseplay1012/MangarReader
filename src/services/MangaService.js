const { getDatabase } = require('../config/database');
const MangaRepository = require('../repositories/MangaRepository');
const AuthorRepository = require('../repositories/AuthorRepository');
const TagRepository = require('../repositories/TagRepository');
const imageService = require('./ImageService');
const { generateSlug, ensureUniqueSlug } = require('../utils/slug');

class MangaService {
  constructor() {
    this.db = getDatabase();
    this.mangaRepo = new MangaRepository(this.db);
    this.authorRepo = new AuthorRepository(this.db);
    this.tagRepo = new TagRepository(this.db);
  }

  async getMangaById(id) {
    return this.mangaRepo.findById(id);
  }

  async getMangaBySlug(slug) {
    return this.mangaRepo.findBySlug(slug);
  }

  async listMangas(options = {}) {
    const mangas = await this.mangaRepo.findWithFilters(options);
    const total = await this.mangaRepo.countWithFilters(options);
    return { mangas, total };
  }

  async getHomeSections() {
    const [featured, recentAdded, recentUpdated] = await Promise.all([
      this.mangaRepo.findFeatured(6),
      this.mangaRepo.findRecent(12),
      this.mangaRepo.findUpdated(12)
    ]);

    return {
      featured,
      recentAdded,
      recentUpdated,
    };
  }

  async createManga(data, coverBufferOrPath = null) {
    const baseSlug = data.slug ? generateSlug(data.slug) : generateSlug(data.title);
    const slug = await ensureUniqueSlug(baseSlug, (s) => this.mangaRepo.existsBySlug(s));

    // First insert without cover to get the ID
    const manga = await this.mangaRepo.create({
      title: data.title,
      slug,
      description: data.description || '',
      status: data.status || 'ongoing',
      cover: null,
      release_year: data.release_year ? parseInt(data.release_year, 10) : null,
    });

    let coverPath = null;
    if (coverBufferOrPath) {
      const processed = await imageService.processAndSaveCover(coverBufferOrPath, manga.id);
      coverPath = processed.path;
      await this.mangaRepo.update(manga.id, { cover: coverPath });
    }

    // Sync authors and tags
    if (data.author_ids) {
      const authorIds = Array.isArray(data.author_ids) 
        ? data.author_ids 
        : data.author_ids.toString().split(',').map(id => parseInt(id.trim(), 10)).filter(Boolean);
      await this.authorRepo.syncMangaAuthors(manga.id, authorIds);
    }

    if (data.tag_ids) {
      const tagIds = Array.isArray(data.tag_ids) 
        ? data.tag_ids 
        : data.tag_ids.toString().split(',').map(id => parseInt(id.trim(), 10)).filter(Boolean);
      await this.tagRepo.syncMangaTags(manga.id, tagIds);
    }

    return this.mangaRepo.findById(manga.id);
  }

  async updateManga(id, data, coverBufferOrPath = null) {
    const current = await this.mangaRepo.findById(id);
    if (!current) {
      throw new Error('Manga not found');
    }

    let slug = current.slug;
    if (data.slug && data.slug !== current.slug) {
      const baseSlug = generateSlug(data.slug);
      slug = await ensureUniqueSlug(baseSlug, (s, excludeId) => this.mangaRepo.existsBySlug(s, excludeId), id);
    } else if (data.title && !data.slug && data.title !== current.title) {
      const baseSlug = generateSlug(data.title);
      slug = await ensureUniqueSlug(baseSlug, (s, excludeId) => this.mangaRepo.existsBySlug(s, excludeId), id);
    }

    let coverPath = current.cover;
    if (coverBufferOrPath) {
      const processed = await imageService.processAndSaveCover(coverBufferOrPath, id);
      coverPath = processed.path;
    }

    await this.mangaRepo.update(id, {
      title: data.title !== undefined ? data.title : current.title,
      slug,
      description: data.description !== undefined ? data.description : current.description,
      status: data.status !== undefined ? data.status : current.status,
      cover: coverPath,
      release_year: data.release_year !== undefined ? parseInt(data.release_year, 10) : current.release_year,
    });

    if (data.author_ids !== undefined) {
      const authorIds = Array.isArray(data.author_ids) 
        ? data.author_ids 
        : data.author_ids.toString().split(',').map(item => parseInt(item.trim(), 10)).filter(Boolean);
      await this.authorRepo.syncMangaAuthors(id, authorIds);
    }

    if (data.tag_ids !== undefined) {
      const tagIds = Array.isArray(data.tag_ids) 
        ? data.tag_ids 
        : data.tag_ids.toString().split(',').map(item => parseInt(item.trim(), 10)).filter(Boolean);
      await this.tagRepo.syncMangaTags(id, tagIds);
    }

    return this.mangaRepo.findById(id);
  }

  async deleteManga(id) {
    const manga = await this.mangaRepo.findById(id);
    if (!manga) return false;

    await imageService.deleteMangaStorage(id);
    return this.mangaRepo.delete(id);
  }
}

module.exports = MangaService;
