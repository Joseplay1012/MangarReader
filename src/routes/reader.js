const express = require('express');
const readerController = require('../controllers/ReaderController');

const router = express.Router();

// Reader endpoint matching Section 16 of spec
router.get('/:mangaSlug/chapters/:chapterSlug', readerController.getReaderData);
router.get('/:mangaSlug/:chapterSlug', readerController.getReaderData);

module.exports = router;
