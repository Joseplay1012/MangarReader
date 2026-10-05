const express = require('express');
const mangaRoutes = require('./manga');
const chapterRoutes = require('./chapters');
const readerRoutes = require('./reader');
const searchRoutes = require('./search');
const authorRoutes = require('./authors');
const tagRoutes = require('./tags');
const adminRoutes = require('./admin');

const router = express.Router();

router.use('/mangas', mangaRoutes);
router.use('/chapters', chapterRoutes);
router.use('/reader', readerRoutes);
router.use('/manga', readerRoutes); // Section 16 spec: /api/manga/:mangaSlug/chapters/:chapterSlug
router.use('/search', searchRoutes);
router.use('/authors', authorRoutes);
router.use('/tags', tagRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
