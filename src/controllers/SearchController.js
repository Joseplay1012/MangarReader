const SearchService = require('../services/SearchService');

class SearchController {
  constructor() {
    this.searchService = new SearchService();
  }

  search = async (req, res, next) => {
    try {
      const q = req.query.q || req.query.query || '';
      const limit = parseInt(req.query.limit || '12', 10);
      const results = await this.searchService.search(q, limit);

      res.json({
        success: true,
        data: results,
      });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new SearchController();
