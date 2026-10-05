const { getDatabase } = require('../config/database');
const ChapterRepository = require('../repositories/ChapterRepository');
const PageRepository = require('../repositories/PageRepository');
const MangaRepository = require('../repositories/MangaRepository');
const imageService = require('./ImageService');
const { generateSlug } = require('../utils/slug');

class ChapterService {
  constructor() {
    this.db = getDatabase();
    this.chapterRepo = new ChapterRepository(this.db);
    this.pageRepo = new PageRepository(this.db);
    this.mangaRepo = new MangaRepository(this.db);
  }

  async getChapterById(id) {
    const chapter = await this.chapterRepo.findById(id);
    if (!chapter) return null;
    const pages = await this.pageRepo.findByChapterId(id);
    return { ...chapter, pages };
  }

  async getChaptersByMangaId(mangaId, order = 'DESC') {
    return this.chapterRepo.findAllByMangaId(mangaId, order);
  }

  async getChaptersByMangaSlug(mangaSlug, order = 'DESC') {
    const manga = await this.mangaRepo.findBySlug(mangaSlug);
    if (!manga) return null;
    const chapters = await this.chapterRepo.findAllByMangaId(manga.id, order);
    return { manga, chapters };
  }

  async createChapter(mangaId, data, files = []) {
    const manga = await this.mangaRepo.findById(mangaId);
    if (!manga) {
      throw new Error('Manga not found');
    }

    const number = parseFloat(data.number);
    if (isNaN(number)) {
      throw new Error('Valid chapter number is required');
    }

    // Check unique (manga_id, number)
    const existing = await this.chapterRepo.findByMangaIdAndNumber(mangaId, number);
    if (existing) {
      throw new Error(`Chapter number ${number} already exists for this manga`);
    }

    const title = data.title ? data.title.trim() : `Chapter ${number}`;
    const slug = data.slug ? generateSlug(data.slug) : `chapter-${number}`;

    const chapter = await this.chapterRepo.create({
      manga_id: mangaId,
      number,
      title,
      slug,
    });

    // Touch manga updated_at
    await this.mangaRepo.touchUpdated(mangaId);

    // Process files if provided
    if (Array.isArray(files) && files.length > 0) {
      await this.saveChapterPages(mangaId, chapter.id, files);
    }

    return this.getChapterById(chapter.id);
  }

  async updateChapter(id, data) {
    const current = await this.chapterRepo.findById(id);
    if (!current) {
      throw new Error('Chapter not found');
    }

    let number = current.number;
    if (data.number !== undefined) {
      number = parseFloat(data.number);
      if (isNaN(number)) throw new Error('Valid chapter number is required');

      if (number !== current.number) {
        const existing = await this.chapterRepo.findByMangaIdAndNumber(current.manga_id, number);
        if (existing && existing.id !== id) {
          throw new Error(`Chapter number ${number} already exists for this manga`);
        }
      }
    }

    const title = data.title !== undefined ? data.title : current.title;
    const slug = data.slug !== undefined ? generateSlug(data.slug) : (number !== current.number ? `chapter-${number}` : current.slug);

    await this.chapterRepo.update(id, { number, title, slug });
    await this.mangaRepo.touchUpdated(current.manga_id);

    return this.getChapterById(id);
  }

  async saveChapterPages(mangaId, chapterId, files = []) {
    // Get existing pages count to append
    const existingPages = await this.pageRepo.findByChapterId(chapterId);
    let startPageNumber = existingPages.length + 1;

    for (const file of files) {
      const buffer = file.buffer || file.path;
      const processed = await imageService.processAndSavePage(buffer, mangaId, chapterId, startPageNumber);
      
      await this.pageRepo.create({
        chapter_id: chapterId,
        page_number: startPageNumber,
        image_path: processed.url,
        width: processed.width,
        height: processed.height,
      });

      startPageNumber++;
    }
  }

  async reorderPages(chapterId, pageOrder) {
    const chapter = await this.chapterRepo.findById(chapterId);
    if (!chapter) throw new Error('Chapter not found');

    await this.pageRepo.reorderPages(chapterId, pageOrder);
    return this.pageRepo.findByChapterId(chapterId);
  }

  async deletePage(pageId) {
    const page = await this.pageRepo.findById(pageId);
    if (!page) return false;

    const chapter = await this.chapterRepo.findById(page.chapter_id);
    const deleted = await this.pageRepo.delete(pageId);

    // Normalize remaining page numbers
    if (chapter) {
      const remaining = await this.pageRepo.findByChapterId(chapter.id);
      for (let i = 0; i < remaining.length; i++) {
        const p = remaining[i];
        if (p.page_number !== i + 1) {
          await this.pageRepo.updatePageNumber(p.id, i + 1);
        }
      }
    }

    return deleted;
  }

  async deleteChapter(id) {
    const chapter = await this.chapterRepo.findById(id);
    if (!chapter) return false;

    await imageService.deleteChapterStorage(chapter.manga_id, id);
    return this.chapterRepo.delete(id);
  }
}

module.exports = ChapterService;
