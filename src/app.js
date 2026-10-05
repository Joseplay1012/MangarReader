const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const config = require('./config/config');
const { runMigrations } = require('./database/migrations');
const { ensurePlaceholder } = require('./utils/placeholder');
const apiRoutes = require('./routes/index');
const storageRoutes = require('./routes/storage');
const { errorHandler } = require('./middleware/error');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Static storage serving (safe with cache-control and traversal protection)
app.use('/storage', storageRoutes);

// Static assets (CSS, JS, images in public)
const publicPath = path.resolve(config.rootDir, 'public');
app.use(express.static(publicPath));

// API Routes
app.use('/api', apiRoutes);

// Frontend Page Routing (Clean URLs matching Section 35 of spec)
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/mangas', (req, res) => {
  res.sendFile(path.join(publicPath, 'mangas.html'));
});

app.get('/manga/:slug', (req, res) => {
  res.sendFile(path.join(publicPath, 'manga.html'));
});

app.get('/read/:manga/:chapter', (req, res) => {
  res.sendFile(path.join(publicPath, 'reader.html'));
});

app.get('/search', (req, res) => {
  res.sendFile(path.join(publicPath, 'search.html'));
});

app.get('/author/:slug', (req, res) => {
  res.sendFile(path.join(publicPath, 'author.html'));
});

app.get('/tag/:slug', (req, res) => {
  res.sendFile(path.join(publicPath, 'tag.html'));
});

// Admin Panel Routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicPath, 'admin', 'index.html'));
});

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(publicPath, 'admin', 'login.html'));
});

app.get('/admin/manga-editor', (req, res) => {
  res.sendFile(path.join(publicPath, 'admin', 'manga-editor.html'));
});

app.get('/admin/chapter-editor', (req, res) => {
  res.sendFile(path.join(publicPath, 'admin', 'chapter-editor.html'));
});

app.get('/admin/taxonomies', (req, res) => {
  res.sendFile(path.join(publicPath, 'admin', 'taxonomies.html'));
});

// 404 Handler
app.use((req, res, next) => {
  if (req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'Endpoint não encontrado' });
  }
  res.status(404).sendFile(path.join(publicPath, '404.html'));
});

// Global Error Handler
app.use(errorHandler);

// Server boot function
async function startServer() {
  try {
    // Run database migrations on boot
    await runMigrations();
    await ensurePlaceholder();

    const server = app.listen(config.port, () => {
      console.log(`
=====================================================
🚀 Manga Reader Server Running!
📡 URL: ${config.site.url} (Port: ${config.port})
🗄️  Database Driver: ${config.databaseDriver.toUpperCase()}
📂 Storage Path: ${config.storage.root}
🛡️  Admin Login: ${config.site.url}/admin/login
👤 Default Admin: ${config.admin.user} / ${config.admin.password}
=====================================================
      `);
    });

    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
