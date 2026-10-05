const { getDatabase } = require('../config/database');
const TagRepository = require('../repositories/TagRepository');
const MangaRepository = require('../repositories/MangaRepository');
const { generateSlug, ensureUniqueSlug } = require('../utils/slug');

class TagController {
  constructor() {
    this.db = getDatabase();
    this.tagRepo = new TagRepository(this.db);
    this.mangaRepo = new MangaRepository(this.db);
  }

  list = async (req, res, next) => {
    try {
      const tags = await this.tagRepo.findAll();
      res.json({ success: true, data: tags });
    } catch (err) {
      next(err);
    }
  };

  getBySlug = async (req, res, next) => {
    try {
      const { slug } = req.params;
      const tag = await this.tagRepo.findBySlug(slug);
      if (!tag) {
        return res.status(404).json({ success: false, error: 'Gênero/Tag não encontrada' });
      }

      const mangas = await this.mangaRepo.findWithFilters({ tagSlug: slug, limit: 50 });
      res.json({
        success: true,
        data: {
          ...tag,
          mangas,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const { name, slug } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Nome da tag é obrigatório' });
      }

      const baseSlug = slug ? generateSlug(slug) : generateSlug(name);
      const uniqueSlug = await ensureUniqueSlug(baseSlug, (s) => this.tagRepo.existsBySlug(s));

      const tag = await this.tagRepo.create({
        name: name.trim(),
        slug: uniqueSlug,
      });

      res.status(201).json({ success: true, data: tag });
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { name, slug } = req.body;
      const current = await this.tagRepo.findById(id);
      if (!current) {
        return res.status(404).json({ success: false, error: 'Tag não encontrada' });
      }

      let uniqueSlug = current.slug;
      if (slug && slug !== current.slug) {
        uniqueSlug = await ensureUniqueSlug(generateSlug(slug), (s, excludeId) => this.tagRepo.existsBySlug(s, excludeId), id);
      } else if (name && !slug && name !== current.name) {
        uniqueSlug = await ensureUniqueSlug(generateSlug(name), (s, excludeId) => this.tagRepo.existsBySlug(s, excludeId), id);
      }

      const tag = await this.tagRepo.update(id, {
        name: name !== undefined ? name.trim() : current.name,
        slug: uniqueSlug,
      });

      res.json({ success: true, data: tag });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await this.tagRepo.delete(id);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Tag não encontrada' });
      }
      res.json({ success: true, message: 'Tag excluída com sucesso' });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new TagController();
