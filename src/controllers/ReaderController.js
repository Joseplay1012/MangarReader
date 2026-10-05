const ReaderService = require('../services/ReaderService');

class ReaderController {
  constructor() {
    this.readerService = new ReaderService();
  }

  getReaderData = async (req, res, next) => {
    try {
      const { mangaSlug, chapterSlug } = req.params;
      const data = await this.readerService.getReaderData(mangaSlug, chapterSlug);

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Capítulo ou mangá não encontrado'
        });
      }

      res.json(data);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new ReaderController();
