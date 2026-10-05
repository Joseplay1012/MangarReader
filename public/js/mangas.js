/**
 * Catalog / Mangas Page Logic with Advanced Filters
 */

let currentFilters = {
  page: 1,
  limit: 24,
  search: '',
  tag: '',
  author: '',
  status: '',
  year: '',
  sort: 'updated'
};

document.addEventListener('DOMContentLoaded', async () => {
  // Read params from URL
  const urlParams = new URLSearchParams(window.location.search);
  currentFilters.page = parseInt(urlParams.get('page') || '1', 10);
  currentFilters.search = urlParams.get('search') || urlParams.get('q') || '';
  currentFilters.tag = urlParams.get('tag') || '';
  currentFilters.author = urlParams.get('author') || '';
  currentFilters.status = urlParams.get('status') || '';
  currentFilters.year = urlParams.get('year') || '';
  currentFilters.sort = urlParams.get('sort') || 'updated';

  // Setup form inputs with URL values
  const searchInput = document.getElementById('filter-search');
  const tagSelect = document.getElementById('filter-tag');
  const statusSelect = document.getElementById('filter-status');
  const sortSelect = document.getElementById('filter-sort');

  if (searchInput) searchInput.value = currentFilters.search;
  if (statusSelect) statusSelect.value = currentFilters.status;
  if (sortSelect) sortSelect.value = currentFilters.sort;

  // Load tag options
  await loadFilterOptions();

  // Attach event listeners
  setupFilterListeners();

  // Fetch and render initial list
  await fetchAndRenderMangas();
});

async function loadFilterOptions() {
  try {
    const [tagsRes, authorsRes] = await Promise.all([
      api.get('/tags'),
      api.get('/authors')
    ]);

    const tagSelect = document.getElementById('filter-tag');
    if (tagSelect && tagsRes.success) {
      tagsRes.data.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.slug;
        opt.textContent = `${t.name} (${t.mangas_count || 0})`;
        if (t.slug === currentFilters.tag) opt.selected = true;
        tagSelect.appendChild(opt);
      });
    }

    const authorSelect = document.getElementById('filter-author');
    if (authorSelect && authorsRes.success) {
      authorsRes.data.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.slug;
        opt.textContent = `${a.name} (${a.mangas_count || 0})`;
        if (a.slug === currentFilters.author) opt.selected = true;
        authorSelect.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Error loading filter options:', err);
  }
}

function setupFilterListeners() {
  const searchInput = document.getElementById('filter-search');
  const tagSelect = document.getElementById('filter-tag');
  const authorSelect = document.getElementById('filter-author');
  const statusSelect = document.getElementById('filter-status');
  const sortSelect = document.getElementById('filter-sort');
  const resetBtn = document.getElementById('filter-reset-btn');

  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentFilters.search = e.target.value.trim();
        currentFilters.page = 1;
        updateUrlAndFetch();
      }, 350);
    });
  }

  if (tagSelect) {
    tagSelect.addEventListener('change', (e) => {
      currentFilters.tag = e.target.value;
      currentFilters.page = 1;
      updateUrlAndFetch();
    });
  }

  if (authorSelect) {
    authorSelect.addEventListener('change', (e) => {
      currentFilters.author = e.target.value;
      currentFilters.page = 1;
      updateUrlAndFetch();
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      currentFilters.status = e.target.value;
      currentFilters.page = 1;
      updateUrlAndFetch();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentFilters.sort = e.target.value;
      currentFilters.page = 1;
      updateUrlAndFetch();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentFilters = {
        page: 1,
        limit: 24,
        search: '',
        tag: '',
        author: '',
        status: '',
        year: '',
        sort: 'updated'
      };
      if (searchInput) searchInput.value = '';
      if (tagSelect) tagSelect.value = '';
      if (authorSelect) authorSelect.value = '';
      if (statusSelect) statusSelect.value = '';
      if (sortSelect) sortSelect.value = 'updated';
      updateUrlAndFetch();
    });
  }
}

function updateUrlAndFetch() {
  const params = new URLSearchParams();
  Object.entries(currentFilters).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState({}, '', newUrl);

  fetchAndRenderMangas();
}

async function fetchAndRenderMangas() {
  const container = document.getElementById('mangas-catalog-grid');
  const countLabel = document.getElementById('catalog-total-count');
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
      <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <p style="margin-top: 1rem; color: var(--text-muted);">Carregando mangás...</p>
    </div>
  `;

  try {
    const res = await api.get('/mangas', currentFilters);
    if (!res.success) throw new Error(res.error);

    const mangas = res.data || [];
    const pagination = res.pagination || {};

    if (countLabel) {
      countLabel.textContent = `${pagination.total || 0} mangás encontrados`;
    }

    if (mangas.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: var(--bg-surface); border: 1px dashed var(--border); border-radius: var(--radius-lg);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
          <h3>Nenhum mangá encontrado</h3>
          <p style="color: var(--text-muted); margin-top: 0.5rem;">Tente ajustar seus filtros ou termo de busca.</p>
        </div>
      `;
      renderPagination(null);
      return;
    }

    container.innerHTML = mangas.map(m => {
      const authors = m.authors?.map(a => a.name).join(', ') || '';
      const latestChapter = m.latest_chapter_number ? `Cap. ${m.latest_chapter_number}` : 'Nenhum';

      return `
        <div class="manga-card">
          <div class="manga-card-cover">
            <a href="/manga/${m.slug}">
              <img src="${m.cover || '/storage/covers/placeholder.webp'}" alt="${m.title}" loading="lazy">
            </a>
            <span class="badge badge-${m.status} manga-card-badge">${m.status}</span>
            ${m.release_year ? `<span class="manga-card-year">${m.release_year}</span>` : ''}
            <div class="manga-card-overlay"></div>
          </div>
          <div class="manga-card-info">
            <a href="/manga/${m.slug}" class="manga-card-title" title="${m.title}">${m.title}</a>
            <div class="manga-card-author">${authors}</div>
            <div class="manga-card-chapter">
              <span>Último:</span>
              <span class="chapter-tag">${latestChapter}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    renderPagination(pagination);
  } catch (err) {
    console.error('Error fetching catalog mangas:', err);
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--danger); padding: 3rem;">Erro ao carregar catálogo: ${err.message}</div>`;
  }
}

function renderPagination(pagination) {
  const container = document.getElementById('catalog-pagination');
  if (!container) return;

  if (!pagination || pagination.totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  const { page, totalPages, hasPrevPage, hasNextPage } = pagination;
  let html = '';

  html += `<button class="page-btn" ${!hasPrevPage ? 'disabled' : ''} onclick="changePage(${page - 1})">← Anterior</button>`;

  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);

  if (startPage > 1) {
    html += `<button class="page-btn" onclick="changePage(1)">1</button>`;
    if (startPage > 2) html += `<span style="padding: 0 0.5rem; color: var(--text-subtle);">...</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span style="padding: 0 0.5rem; color: var(--text-subtle);">...</span>`;
    html += `<button class="page-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
  }

  html += `<button class="page-btn" ${!hasNextPage ? 'disabled' : ''} onclick="changePage(${page + 1})">Próxima →</button>`;

  container.innerHTML = html;
}

window.changePage = function(newPage) {
  currentFilters.page = newPage;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  updateUrlAndFetch();
};
