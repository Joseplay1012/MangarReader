const express = require('express');
const tagController = require('../controllers/TagController');

const router = express.Router();

router.get('/', tagController.list);
router.get('/:slug', tagController.getBySlug);

module.exports = router;
