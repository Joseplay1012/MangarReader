function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Ocorreu um erro interno no servidor';

  if (req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api/')) {
    return res.status(statusCode).json({
      success: false,
      error: message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }

  // Otherwise return a friendly html error or 404
  if (statusCode === 404) {
    return res.status(404).sendFile('404.html', { root: './public' });
  }

  res.status(statusCode).send(`
    <div style="font-family: sans-serif; padding: 40px; background: #0f172a; color: #f8fafc; min-height: 100vh;">
      <h1 style="color: #ef4444;">Erro ${statusCode}</h1>
      <p>${message}</p>
      <a href="/" style="color: #6366f1; text-decoration: underline;">Voltar para o Início</a>
    </div>
  `);
}

module.exports = {
  errorHandler,
};
