/**
 * Manga Reader - Shared API Client & UI Helpers
 */

const API_BASE = '/api';

const api = {
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const headers = options.headers || {};

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! Status: ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  get(endpoint, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const qs = query.toString();
    const url = qs ? `${endpoint}?${qs}` : endpoint;
    return this.request(url, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

// Toast notification helper
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Global Nav Search Autocomplete & Mobile Menu
document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const navLinks = document.getElementById('nav-links');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }

  // Quick search autocomplete
  const quickSearchInput = document.getElementById('nav-search-input');
  const searchDropdown = document.getElementById('nav-search-dropdown');

  if (quickSearchInput && searchDropdown) {
    let debounceTimer;

    quickSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      clearTimeout(debounceTimer);

      if (q.length < 2) {
        searchDropdown.classList.remove('show');
        searchDropdown.innerHTML = '';
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          const res = await api.get('/search', { q, limit: 5 });
          const mangas = res.data?.mangas || [];

          if (mangas.length === 0) {
            searchDropdown.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Nenhum mangá encontrado</div>`;
            searchDropdown.classList.add('show');
            return;
          }

          searchDropdown.innerHTML = mangas.map(m => `
            <a href="/manga/${m.slug}" class="search-dropdown-item">
              <img src="${m.cover || '/storage/covers/placeholder.webp'}" alt="${m.title}">
              <div class="search-dropdown-info">
                <div class="search-dropdown-title">${m.title}</div>
                <div class="search-dropdown-sub">${m.status.toUpperCase()} • ${m.release_year || ''}</div>
              </div>
            </a>
          `).join('') + `
            <a href="/search?q=${encodeURIComponent(q)}" style="display: block; padding: 0.6rem; text-align: center; font-size: 0.8rem; color: var(--primary); font-weight: 600; border-top: 1px solid var(--border);">Ver todos os resultados →</a>
          `;
          searchDropdown.classList.add('show');
        } catch (err) {
          console.error(err);
        }
      }, 250);
    });

    document.addEventListener('click', (e) => {
      if (!quickSearchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.classList.remove('show');
      }
    });

    quickSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = quickSearchInput.value.trim();
        if (q) {
          window.location.href = `/search?q=${encodeURIComponent(q)}`;
        }
      }
    });
  }
});
