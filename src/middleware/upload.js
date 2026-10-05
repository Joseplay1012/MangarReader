const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
  ];

  if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}. Use imagens JPG, PNG ou WebP.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 MB per file max
    files: 300, // up to 300 pages in one batch upload
  },
});

module.exports = {
  uploadCover: upload.single('cover'),
  uploadPages: upload.array('pages', 300),
  uploadMixed: upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'pages', maxCount: 300 }
  ]),
};
