const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const config = require('../config/config');

async function ensurePlaceholder() {
  const dir = config.storage.covers;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const placeholderPath = path.join(dir, 'placeholder.webp');
  if (!fs.existsSync(placeholderPath)) {
    const svg = `
      <svg width="600" height="900" viewBox="0 0 600 900" xmlns="http://www.w3.org/2000/svg">
        <rect width="600" height="900" fill="#EBECEF"/>
        <rect x="30" y="30" width="540" height="840" fill="#FFFFFF" stroke="#D6D6D6" stroke-width="2"/>
        <circle cx="300" cy="400" r="80" fill="#FDF2F2" stroke="#D62C20" stroke-width="3"/>
        <text x="300" y="415" font-family="sans-serif" font-size="54" fill="#D62C20" font-weight="bold" text-anchor="middle">📖</text>
        <text x="300" y="550" font-family="sans-serif" font-size="30" fill="#1A1D20" font-weight="bold" text-anchor="middle">MangaReader</text>
        <text x="300" y="590" font-family="sans-serif" font-size="16" fill="#8792A2" text-anchor="middle">Sem Capa Disponível</text>
      </svg>
    `;
    await sharp(Buffer.from(svg)).webp({ quality: 85 }).toFile(placeholderPath);
    console.log('✅ Placeholder cover generated (solid clean)');
  }
}

if (require.main === module) {
  ensurePlaceholder();
}

module.exports = { ensurePlaceholder };
