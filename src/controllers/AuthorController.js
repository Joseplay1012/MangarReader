const { getDatabase } = require('../config/database');
const AuthorRepository = require('../repositories/AuthorRepository');
const MangaRepository = require('../repositories/MangaRepository');
const { generateSlug, ensureUniqueSlug } = require('../utils/slug');

class AuthorController {
  constructor() {
    this.db = getDatabase();
    this.authorRepo = new AuthorRepository(this.db);
    this.mangaRepo = new MangaRepository(this.db);
  }

  list = async (req, res, next) => {
    try {
      const authors = await this.authorRepo.findAll();
      res.json({ success: true, data: authors });
    } catch (err) {
      next(err);
    }
  };

  getBySlug = async (req, res, next) => {
    try {
      const { slug } = req.params;
      const author = await this.authorRepo.findBySlug(slug);
      if (!author) {
        return res.status(404).json({ success: false, error: 'Autor não encontrado' });
      }

      const mangas = await this.mangaRepo.findWithFilters({ authorSlug: slug, limit: 50 });
      res.json({
        success: true,
        data: {
          ...author,
          mangas,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const { name, slug, biography } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Nome do autor é obrigatório' });
      }

      const baseSlug = slug ? generateSlug(slug) : generateSlug(name);
      const uniqueSlug = await ensureUniqueSlug(baseSlug, (s) => this.authorRepo.existsBySlug(s));

      const author = await this.authorRepo.create({
        name: name.trim(),
        slug: uniqueSlug,
        biography: biography ? biography.trim() : null,
      });

      res.status(201).json({ success: true, data: author });
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { name, slug, biography } = req.body;
      const current = await this.authorRepo.findById(id);
      if (!current) {
        return res.status(404).json({ success: false, error: 'Autor não encontrado' });
      }

      let uniqueSlug = current.slug;
      if (slug && slug !== current.slug) {
        uniqueSlug = await ensureUniqueSlug(generateSlug(slug), (s, excludeId) => this.authorRepo.existsBySlug(s, excludeId), id);
      } else if (name && !slug && name !== current.name) {
        uniqueSlug = await ensureUniqueSlug(generateSlug(name), (s, excludeId) => this.authorRepo.existsBySlug(s, excludeId), id);
      }

      const author = await this.authorRepo.update(id, {
        name: name !== undefined ? name.trim() : current.name,
        slug: uniqueSlug,
        biography: biography !== undefined ? biography.trim() : current.biography,
      });

      res.json({ success: true, data: author });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await this.authorRepo.delete(id);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Autor não encontrado' });
      }
      res.json({ success: true, message: 'Autor excluído com sucesso' });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new AuthorController();
