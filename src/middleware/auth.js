const authService = require('../services/AuthService');

function requireAuth(req, res, next) {
  // Check cookie or authorization header
  const tokenFromCookie = req.cookies && req.cookies.manga_admin_session;
  let tokenFromHeader = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    tokenFromHeader = req.headers.authorization.substring(7);
  }

  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    if (req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api/')) {
      return res.status(401).json({ success: false, error: 'Autenticação necessária' });
    }
    return res.redirect('/admin/login.html');
  }

  const user = authService.verifyToken(token);
  if (!user) {
    if (req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api/')) {
      return res.status(401).json({ success: false, error: 'Sessão inválida ou expirada' });
    }
    return res.redirect('/admin/login.html');
  }

  req.adminUser = user;
  next();
}

module.exports = {
  requireAuth,
};
