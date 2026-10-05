const express = require('express');
const authorController = require('../controllers/AuthorController');

const router = express.Router();

router.get('/', authorController.list);
router.get('/:slug', authorController.getBySlug);

module.exports = router;
