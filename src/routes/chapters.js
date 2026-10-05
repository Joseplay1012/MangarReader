const express = require('express');
const chapterController = require('../controllers/ChapterController');

const router = express.Router();

// Get chapter details with pages
router.get('/:id', chapterController.getById);

module.exports = router;
