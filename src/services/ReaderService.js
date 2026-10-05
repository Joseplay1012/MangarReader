const { getDatabase } = require('../config/database');
const MangaRepository = require('../repositories/MangaRepository');
const ChapterRepository = require('../repositories/ChapterRepository');
const PageRepository = require('../repositories/PageRepository');

class ReaderService {
  constructor() {
    this.db = getDatabase();
    this.mangaRepo = new MangaRepository(this.db);
    this.chapterRepo = new ChapterRepository(this.db);
    this.pageRepo = new PageRepository(this.db);
  }

  async getReaderData(mangaSlug, chapterIdentifier) {
    const manga = await this.mangaRepo.findBySlug(mangaSlug);
    if (!manga) {
      return null;
    }

    // Try finding by slug first, then by number
    let chapter = await this.chapterRepo.findByMangaIdAndSlug(manga.id, chapterIdentifier);
    if (!chapter) {
      const num = parseFloat(chapterIdentifier);
      if (!isNaN(num)) {
        chapter = await this.chapterRepo.findByMangaIdAndNumber(manga.id, num);
      }
    }

    if (!chapter) {
      return null;
    }

    const pages = await this.pageRepo.findByChapterId(chapter.id);
    const navigation = await this.chapterRepo.getNavigation(manga.id, chapter.number);
    const allChapters = await this.chapterRepo.findAllByMangaId(manga.id, 'DESC');

    return {
      manga: {
        id: manga.id,
        title: manga.title,
        slug: manga.slug,
        cover: manga.cover,
        status: manga.status,
      },
      chapter: {
        id: chapter.id,
        number: chapter.number,
        title: chapter.title,
        slug: chapter.slug,
        created_at: chapter.created_at,
      },
      pages: pages.map(p => ({
        id: p.id,
        number: p.page_number,
        url: p.image_path,
        width: p.width,
        height: p.height,
      })),
      navigation: {
        previous: navigation.previous ? {
          id: navigation.previous.id,
          number: navigation.previous.number,
          slug: navigation.previous.slug,
          title: navigation.previous.title,
        } : null,
        next: navigation.next ? {
          id: navigation.next.id,
          number: navigation.next.number,
          slug: navigation.next.slug,
          title: navigation.next.title,
        } : null,
      },
      allChapters: allChapters.map(c => ({
        id: c.id,
        number: c.number,
        title: c.title,
        slug: c.slug,
      }))
    };
  }
}

module.exports = ReaderService;
