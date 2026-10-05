const authService = require('../services/AuthService');
const { getDatabase } = require('../config/database');
const MangaRepository = require('../repositories/MangaRepository');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

function getFolderSize(dirPath) {
  let size = 0;
  if (!fs.existsSync(dirPath)) return 0;
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    if (file.isDirectory()) {
      size += getFolderSize(fullPath);
    } else {
      try {
        const stat = fs.statSync(fullPath);
        size += stat.size;
      } catch (e) {}
    }
  }
  return size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

class AdminController {
  constructor() {
    this.db = getDatabase();
    this.mangaRepo = new MangaRepository(this.db);
  }

  login = async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const result = authService.login(username, password);

      if (!result.success) {
        return res.status(401).json(result);
      }

      // Set secure HTTP-only cookie
      res.cookie('manga_admin_session', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  logout = async (req, res, next) => {
    try {
      res.clearCookie('manga_admin_session');
      res.json({ success: true, message: 'Logout realizado com sucesso' });
    } catch (err) {
      next(err);
    }
  };

  me = async (req, res, next) => {
    try {
      res.json({
        success: true,
        authenticated: true,
        user: req.adminUser ? req.adminUser.user : config.admin.user,
      });
    } catch (err) {
      next(err);
    }
  };

  getStats = async (req, res, next) => {
    try {
      const dbStats = await this.mangaRepo.getStats();
      const storageBytes = getFolderSize(config.storage.root);

      res.json({
        success: true,
        data: {
          ...dbStats,
          storageBytes,
          storageFormatted: formatBytes(storageBytes),
          databaseDriver: config.databaseDriver,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new AdminController();
