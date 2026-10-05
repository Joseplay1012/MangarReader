/**
 * Home Page Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Render reading history
  HistoryManager.renderHistorySection('history-grid');

  // 2. Fetch home sections
  try {
    const res = await api.get('/mangas/home');
    if (!res.success) throw new Error(res.error);

    const { featured, recentAdded, recentUpdated } = res.data;

    // Render Featured Hero
    renderHero(featured);

    // Render Recent Added
    renderMangaGrid('recent-added-grid', recentAdded);

    // Render Recent Updated
    renderMangaGrid('recent-updated-grid', recentUpdated);

    // Fetch and render top tags
    loadPopularTags();
  } catch (err) {
    console.error('Error loading home data:', err);
    showToast('Erro ao carregar os dados da página inicial', 'error');
  }
});

function renderHero(featuredMangas) {
  const container = document.getElementById('hero-container');
  if (!container || !featuredMangas || featuredMangas.length === 0) return;

  const manga = featuredMangas[0];
  const authorsText = manga.authors?.map(a => a.name).join(', ') || 'Autor Desconhecido';
  const latestChapter = manga.latest_chapter_number ? `Capítulo ${manga.latest_chapter_number}` : 'Em breve';

  container.innerHTML = `
    <div class="hero-card">
      <div class="hero-content">
        <div class="hero-tag">
          <span>●</span> DESTAQUE
        </div>
        <h1 class="hero-title">${manga.title}</h1>
        <div class="hero-meta">
          <span class="badge badge-${manga.status}">${manga.status}</span>
          <span class="tag-pill">${manga.release_year || '2024'}</span>
          <span class="tag-pill">${authorsText}</span>
          ${manga.tags ? manga.tags.slice(0, 3).map(t => `<a href="/tag/${t.slug}" class="tag-pill">${t.name}</a>`).join('') : ''}
        </div>
        <p class="hero-description">${manga.description || 'Sem descrição disponível no momento.'}</p>
        <div style="display: flex; gap: 0.85rem; flex-wrap: wrap; margin-top: 0.5rem;">
          <a href="/manga/${manga.slug}" class="btn btn-primary btn-lg">
            <span>📖</span> Ver Mangá
          </a>
          <a href="/manga/${manga.slug}" class="btn btn-secondary btn-lg">
            ${latestChapter}
          </a>
        </div>
      </div>
      <div class="hero-cover-col">
        <img src="${manga.cover || '/storage/covers/placeholder.webp'}" alt="${manga.title}" class="hero-cover-img">
      </div>
    </div>
  `;
}

function renderMangaGrid(containerId, mangas) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!mangas || mangas.length === 0) {
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">Nenhum mangá disponível nesta seção.</div>`;
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
}

async function loadPopularTags() {
  const container = document.getElementById('tags-cloud');
  if (!container) return;

  try {
    const res = await api.get('/tags');
    if (res.success && res.data) {
      container.innerHTML = res.data.map(t => `
        <a href="/tag/${t.slug}" class="tag-pill">
          ${t.name} <span style="opacity: 0.6; font-size: 0.7rem; margin-left: 0.25rem;">(${t.mangas_count || 0})</span>
        </a>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading tags:', err);
  }
}
