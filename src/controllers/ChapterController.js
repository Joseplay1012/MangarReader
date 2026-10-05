const ChapterService = require('../services/ChapterService');
const MangaService = require('../services/MangaService');

class ChapterController {
  constructor() {
    this.chapterService = new ChapterService();
    this.mangaService = new MangaService();
  }

  listByManga = async (req, res, next) => {
    try {
      const { slugOrId } = req.params;
      const order = req.query.order || 'DESC';

      let chapters;
      let manga;

      if (!isNaN(parseInt(slugOrId, 10))) {
        const id = parseInt(slugOrId, 10);
        manga = await this.mangaService.getMangaById(id);
        if (!manga) return res.status(404).json({ success: false, error: 'Mangá não encontrado' });
        chapters = await this.chapterService.getChaptersByMangaId(id, order);
      } else {
        const result = await this.chapterService.getChaptersByMangaSlug(slugOrId, order);
        if (!result) return res.status(404).json({ success: false, error: 'Mangá não encontrado' });
        manga = result.manga;
        chapters = result.chapters;
      }

      res.json({
        success: true,
        data: {
          manga,
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
      const chapter = await this.chapterService.getChapterById(id);
      if (!chapter) {
        return res.status(404).json({ success: false, error: 'Capítulo não encontrado' });
      }

      const manga = await this.mangaService.getMangaById(chapter.manga_id);

      res.json({
        success: true,
        data: {
          ...chapter,
          manga,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const mangaId = parseInt(req.params.id || req.params.mangaId, 10);
      const { number, title, slug } = req.body;

      if (number === undefined || number === '') {
        return res.status(400).json({ success: false, error: 'O número do capítulo é obrigatório' });
      }

      const files = req.files || [];
      const chapter = await this.chapterService.createChapter(mangaId, {
        number,
        title,
        slug,
      }, files);

      res.status(201).json({ success: true, data: chapter });
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { number, title, slug } = req.body;

      const chapter = await this.chapterService.updateChapter(id, {
        number,
        title,
        slug,
      });

      res.json({ success: true, data: chapter });
    } catch (err) {
      next(err);
    }
  };

  addPages = async (req, res, next) => {
    try {
      const chapterId = parseInt(req.params.id, 10);
      const chapter = await this.chapterService.getChapterById(chapterId);
      if (!chapter) {
        return res.status(404).json({ success: false, error: 'Capítulo não encontrado' });
      }

      const files = req.files || [];
      if (files.length === 0) {
        return res.status(400).json({ success: false, error: 'Nenhuma imagem enviada' });
      }

      await this.chapterService.saveChapterPages(chapter.manga_id, chapterId, files);
      const updated = await this.chapterService.getChapterById(chapterId);

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };

  reorderPages = async (req, res, next) => {
    try {
      const chapterId = parseInt(req.params.id, 10);
      const { pageOrder } = req.body;

      if (!Array.isArray(pageOrder)) {
        return res.status(400).json({ success: false, error: 'pageOrder deve ser um array de IDs ou { id, page_number }' });
      }

      const pages = await this.chapterService.reorderPages(chapterId, pageOrder);
      res.json({ success: true, data: pages });
    } catch (err) {
      next(err);
    }
  };

  deletePage = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await this.chapterService.deletePage(id);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Página não encontrada' });
      }
      res.json({ success: true, message: 'Página excluída com sucesso' });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await this.chapterService.deleteChapter(id);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Capítulo não encontrado' });
      }
      res.json({ success: true, message: 'Capítulo excluído com sucesso' });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new ChapterController();
