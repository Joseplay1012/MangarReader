/**
 * Search Results Page Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q') || urlParams.get('query') || '';

  const searchInput = document.getElementById('search-page-input');
  if (searchInput) searchInput.value = query;

  if (query) {
    await performSearch(query);
  }

  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        const q = e.target.value.trim();
        const newUrl = q ? `/search?q=${encodeURIComponent(q)}` : '/search';
        window.history.pushState({}, '', newUrl);
        performSearch(q);
      }, 300);
    });
  }
});

async function performSearch(query) {
  const container = document.getElementById('search-results-container');
  const titleEl = document.getElementById('search-title-label');

  if (!container) return;

  if (!query) {
    if (titleEl) titleEl.textContent = 'Digite algo para pesquisar';
    container.innerHTML = `<div style="text-align: center; padding: 4rem; color: var(--text-muted);">Busque por títulos de mangá, autores ou gêneros.</div>`;
    return;
  }

  if (titleEl) titleEl.innerHTML = `Resultados para: <span style="color: var(--primary);">"${query}"</span>`;

  try {
    const res = await api.get('/search', { q: query, limit: 30 });
    if (!res.success) throw new Error(res.error);

    const { mangas = [], authors = [], tags = [] } = res.data;

    if (mangas.length === 0 && authors.length === 0 && tags.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 5rem 1rem; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px dashed var(--border);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
          <h3>Nenhum resultado encontrado</h3>
          <p style="color: var(--text-muted); margin-top: 0.5rem;">Tente buscar com outras palavras-chave.</p>
        </div>
      `;
      return;
    }

    let html = '';

    // Authors match
    if (authors.length > 0) {
      html += `
        <div style="margin-bottom: 2.5rem;">
          <h3 style="margin-bottom: 1rem; font-size: 1.1rem; color: var(--text-muted);"><i class="fa-solid fa-user" style="color: var(--primary); margin-right: 0.4rem;"></i> Autores Encontrados (${authors.length})</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
            ${authors.map(a => `<a href="/author/${a.slug}" class="tag-pill" style="font-size: 0.9rem; padding: 0.4rem 1rem;">${a.name} <span style="opacity: 0.6;">(${a.mangas_count || 0} obras)</span></a>`).join('')}
          </div>
        </div>
      `;
    }

    // Tags match
    if (tags.length > 0) {
      html += `
        <div style="margin-bottom: 2.5rem;">
          <h3 style="margin-bottom: 1rem; font-size: 1.1rem; color: var(--text-muted);"><i class="fa-solid fa-tags" style="color: var(--primary); margin-right: 0.4rem;"></i> Gêneros & Tags (${tags.length})</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
            ${tags.map(t => `<a href="/tag/${t.slug}" class="tag-pill" style="font-size: 0.9rem; padding: 0.4rem 1rem;">${t.name} <span style="opacity: 0.6;">(${t.mangas_count || 0})</span></a>`).join('')}
          </div>
        </div>
      `;
    }

    // Mangas match
    if (mangas.length > 0) {
      html += `
        <div>
          <h3 style="margin-bottom: 1.25rem; font-size: 1.1rem; color: var(--text-muted);"><i class="fa-solid fa-book-open" style="color: var(--primary); margin-right: 0.4rem;"></i> Mangás (${mangas.length})</h3>
          <div class="manga-grid">
            ${mangas.map(m => `
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
                  <div class="manga-card-author">${m.authors?.map(a => a.name).join(', ') || ''}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  } catch (err) {
    console.error('Error performing search:', err);
    container.innerHTML = `<div style="color: var(--danger); text-align: center; padding: 3rem;">Erro ao realizar busca: ${err.message}</div>`;
  }
}
