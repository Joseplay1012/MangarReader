const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const config = require('../config/config');

class ImageService {
  constructor() {
    this.ensureDirectory(config.storage.root);
    this.ensureDirectory(config.storage.covers);
    this.ensureDirectory(config.storage.chapters);
  }

  ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Process and save a manga cover to WebP.
   * @param {Buffer|string} input - Buffer or file path of original cover.
   * @param {number|string} mangaId - Manga ID.
   * @returns {Promise<{ path: string, width: number, height: number }>}
   */
  async processAndSaveCover(input, mangaId) {
    const targetDir = path.join(config.storage.covers, String(mangaId));
    this.ensureDirectory(targetDir);

    const filename = `cover_${Date.now()}.webp`;
    const targetPath = path.join(targetDir, filename);

    const image = sharp(input);
    const metadata = await image.metadata();

    // Optimize and convert to WebP
    await image
      .rotate() // Auto-orient based on EXIF
      .resize({ width: 800, withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: 85 })
      .toFile(targetPath);

    const finalMetadata = await sharp(targetPath).metadata();
    const publicUrl = `/storage/covers/${mangaId}/${filename}`;

    return {
      path: publicUrl,
      width: finalMetadata.width,
      height: finalMetadata.height,
      filePath: targetPath
    };
  }

  /**
   * Process and save a chapter page to WebP.
   * @param {Buffer|string} input 
   * @param {number|string} mangaId 
   * @param {number|string} chapterId 
   * @param {number} pageNumber 
   * @returns {Promise<{ url: string, width: number, height: number, pageNumber: number }>}
   */
  async processAndSavePage(input, mangaId, chapterId, pageNumber) {
    const targetDir = path.join(config.storage.chapters, String(mangaId), String(chapterId));
    this.ensureDirectory(targetDir);

    const paddedNumber = String(pageNumber).padStart(3, '0');
    const filename = `${paddedNumber}_${Date.now().toString().slice(-4)}.webp`;
    const targetPath = path.join(targetDir, filename);

    const image = sharp(input);
    
    // Auto-orient and convert to WebP with good balance of quality and size
    await image
      .rotate()
      .webp({ quality: 85, effort: 4 })
      .toFile(targetPath);

    const metadata = await sharp(targetPath).metadata();
    const publicUrl = `/storage/chapters/${mangaId}/${chapterId}/${filename}`;

    return {
      url: publicUrl,
      width: metadata.width || 1200,
      height: metadata.height || 1800,
      pageNumber
    };
  }

  /**
   * Delete cover directory for manga
   */
  async deleteMangaStorage(mangaId) {
    try {
      const coverDir = path.join(config.storage.covers, String(mangaId));
      if (fs.existsSync(coverDir)) {
        fs.rmSync(coverDir, { recursive: true, force: true });
      }
      const chapterDir = path.join(config.storage.chapters, String(mangaId));
      if (fs.existsSync(chapterDir)) {
        fs.rmSync(chapterDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.error(`[ImageService] Error deleting storage for manga ${mangaId}:`, err.message);
    }
  }

  /**
   * Delete chapter pages directory
   */
  async deleteChapterStorage(mangaId, chapterId) {
    try {
      const chapterDir = path.join(config.storage.chapters, String(mangaId), String(chapterId));
      if (fs.existsSync(chapterDir)) {
        fs.rmSync(chapterDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.error(`[ImageService] Error deleting storage for chapter ${chapterId}:`, err.message);
    }
  }
}

module.exports = new ImageService();
