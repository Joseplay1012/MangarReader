const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

const router = express.Router();

/**
 * Safe file sender preventing path traversal
 */
function sendStorageFile(res, relativePath) {
  // Normalize and resolve against storage root
  const safeRelativePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
  const absolutePath = path.resolve(config.storage.root, safeRelativePath);

  // Ensure absolutePath is strictly inside config.storage.root
  if (!absolutePath.startsWith(config.storage.root)) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }

  // Set immutable cache header for images
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(absolutePath);
}

// Cover images
router.get('/covers/:mangaId/:filename', (req, res) => {
  const { mangaId, filename } = req.params;
  const rel = path.join('covers', mangaId, filename);
  sendStorageFile(res, rel);
});

// Chapter page images
router.get('/chapters/:mangaId/:chapterId/:filename', (req, res) => {
  const { mangaId, chapterId, filename } = req.params;
  const rel = path.join('chapters', mangaId, chapterId, filename);
  sendStorageFile(res, rel);
});

module.exports = router;
