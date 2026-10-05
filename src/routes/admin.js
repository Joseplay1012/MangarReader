const express = require('express');
const adminController = require('../controllers/AdminController');
const mangaController = require('../controllers/MangaController');
const chapterController = require('../controllers/ChapterController');
const authorController = require('../controllers/AuthorController');
const tagController = require('../controllers/TagController');
const { requireAuth } = require('../middleware/auth');
const { uploadCover, uploadPages } = require('../middleware/upload');

const router = express.Router();

// Public admin auth routes
router.post('/login', adminController.login);
router.post('/logout', adminController.logout);

// Protected routes below
router.use(requireAuth);

router.get('/me', adminController.me);
router.get('/stats', adminController.getStats);

// Mangas
router.post('/mangas', uploadCover, mangaController.create);
router.put('/mangas/:id', uploadCover, mangaController.update);
router.delete('/mangas/:id', mangaController.delete);

// Chapters
router.post('/mangas/:id/chapters', uploadPages, chapterController.create);
router.put('/chapters/:id', chapterController.update);
router.delete('/chapters/:id', chapterController.delete);

// Pages
router.post('/chapters/:id/pages', uploadPages, chapterController.addPages);
router.put('/chapters/:id/reorder-pages', chapterController.reorderPages);
router.delete('/pages/:id', chapterController.deletePage);

// Tags
router.post('/tags', tagController.create);
router.put('/tags/:id', tagController.update);
router.delete('/tags/:id', tagController.delete);

// Authors
router.post('/authors', authorController.create);
router.put('/authors/:id', authorController.update);
router.delete('/authors/:id', authorController.delete);

module.exports = router;
