const express = require('express');
const mangaController = require('../controllers/MangaController');
const chapterController = require('../controllers/ChapterController');

const router = express.Router();

// Home page data (featured, recent, updated)
router.get('/home', mangaController.getHome);

// List mangas with filters and pagination
router.get('/', mangaController.list);

// Get manga by slug
router.get('/:slug', mangaController.getBySlug);

// Get chapters of manga
router.get('/:slugOrId/chapters', chapterController.listByManga);

module.exports = router;
