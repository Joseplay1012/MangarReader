const express = require('express');
const searchController = require('../controllers/SearchController');

const router = express.Router();

router.get('/', searchController.search);

module.exports = router;
