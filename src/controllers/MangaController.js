const MangaService = require('../services/MangaService');
const ChapterService = require('../services/ChapterService');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

class MangaController {
  constructor() {
    this.mangaService = new MangaService();
    this.chapterService = new ChapterService();
  }

  getHome = async (req, res, next) => {
    try {
      const data = await this.mangaService.getHomeSections();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  list = async (req, res, next) => {
    try {
      const { page, limit, offset } = parsePagination(req.query, 24);
      const filters = {
        search: req.query.search || req.query.q || '',
        tagSlug: req.query.tag || '',
        authorSlug: req.query.author || '',
        status: req.query.status || '',
        releaseYear: req.query.year || null,
        sort: req.query.sort || 'updated',
        limit,
        offset,
      };

      const { mangas, total } = await this.mangaService.listMangas(filters);
      const pagination = buildPaginationMeta(total, page, limit);

      res.json({
        success: true,
        data: mangas,
        pagination,
      });
    } catch (err) {
      next(err);
    }
  };

  getBySlug = async (req, res, next) => {
    try {
      const { slug } = req.params;
      const manga = await this.mangaService.getMangaBySlug(slug);
      if (!manga) {
        return res.status(404).json({ success: false, error: 'Mangá não encontrado' });
      }

      const order = req.query.order || 'DESC';
      const chapters = await this.chapterService.getChaptersByMangaId(manga.id, order);

      res.json({
        success: true,
        data: {
          ...manga,
          chapters,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const manga = await this.mangaService.getMangaById(id);
      if (!manga) {
        return res.status(404).json({ success: false, error: 'Mangá não encontrado' });
      }

      const chapters = await this.chapterService.getChaptersByMangaId(manga.id, 'DESC');
      res.json({
        success: true,
        data: {
          ...manga,
          chapters,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const { title, slug, description, status, release_year, author_ids, tag_ids } = req.body;
      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, error: 'O título do mangá é obrigatório' });
      }

      const coverFile = req.file ? req.file.buffer : null;

      const manga = await this.mangaService.createManga({
        title,
        slug,
        description,
        status,
        release_year,
        author_ids,
        tag_ids,
      }, coverFile);

      res.status(201).json({ success: true, data: manga });
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { title, slug, description, status, release_year, author_ids, tag_ids } = req.body;

      const coverFile = req.file ? req.file.buffer : null;

      const manga = await this.mangaService.updateManga(id, {
        title,
        slug,
        description,
        status,
        release_year,
        author_ids,
        tag_ids,
      }, coverFile);

      res.json({ success: true, data: manga });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await this.mangaService.deleteManga(id);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Mangá não encontrado' });
      }
      res.json({ success: true, message: 'Mangá excluído com sucesso' });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new MangaController();
