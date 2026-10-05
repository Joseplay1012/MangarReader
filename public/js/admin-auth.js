/**
 * Admin Authentication Guard & Helper
 */

async function checkAdminAuth(isLoginPage = false) {
  try {
    const res = await api.get('/admin/me');
    if (res.authenticated) {
      if (isLoginPage) {
        window.location.href = '/admin';
      }
      const adminNameEl = document.getElementById('admin-username');
      if (adminNameEl) adminNameEl.textContent = res.user || 'Administrador';
      return res;
    }
  } catch (err) {
    if (!isLoginPage) {
      window.location.href = '/admin/login';
    }
  }
}

async function handleAdminLogout() {
  try {
    await api.post('/admin/logout');
    window.location.href = '/admin/login';
  } catch (err) {
    console.error('Logout error:', err);
    window.location.href = '/admin/login';
  }
}
