/**
 * Manga Detail Page Logic
 */

let currentManga = null;
let allChapters = [];
let sortOrder = 'DESC';

document.addEventListener('DOMContentLoaded', async () => {
  // Extract slug from URL: /manga/:slug or ?slug=:slug
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  let slug = pathParts[1] || new URLSearchParams(window.location.search).get('slug');

  if (!slug) {
    window.location.href = '/mangas';
    return;
  }

  await loadMangaDetails(slug);
});

async function loadMangaDetails(slug) {
  try {
    const res = await api.get(`/mangas/${slug}`);
    if (!res.success) throw new Error(res.error);

    currentManga = res.data;
    allChapters = currentManga.chapters || [];

    renderMangaHeader(currentManga);
    renderChapterList(allChapters);
    setupChapterListeners();
  } catch (err) {
    console.error('Error loading manga details:', err);
    document.getElementById('manga-detail-container').innerHTML = `
      <div style="text-align: center; padding: 5rem 1rem;">
        <h2>Mangá não encontrado</h2>
        <p style="color: var(--text-muted); margin: 1rem 0 2rem;">O mangá que você está procurando não existe ou foi removido.</p>
        <a href="/mangas" class="btn btn-primary">Explorar Catálogo</a>
      </div>
    `;
  }
}

function renderMangaHeader(manga) {
  document.title = `${manga.title} — MangaReader`;

  const banner = document.getElementById('manga-hero-banner');
  if (banner && manga.cover) {
    banner.style.backgroundImage = `url('${manga.cover}')`;
  }

  const coverImg = document.getElementById('manga-cover-img');
  if (coverImg) coverImg.src = manga.cover || '/storage/covers/placeholder.webp';

  const titleEl = document.getElementById('manga-title');
  if (titleEl) titleEl.textContent = manga.title;

  const statusEl = document.getElementById('manga-status-badge');
  if (statusEl) {
    statusEl.className = `badge badge-${manga.status}`;
    statusEl.textContent = manga.status;
  }

  const yearEl = document.getElementById('manga-year');
  if (yearEl && manga.release_year) {
    yearEl.textContent = manga.release_year;
    yearEl.style.display = 'inline-block';
  }

  // Authors
  const authorsContainer = document.getElementById('manga-authors');
  if (authorsContainer && manga.authors) {
    authorsContainer.innerHTML = manga.authors.map(a => `
      <a href="/author/${a.slug}" class="tag-pill">
        <i class="fa-solid fa-user" style="color: var(--primary); font-size: 0.75rem; margin-right: 0.3rem;"></i>${a.name}
      </a>
    `).join('');
  }

  // Tags
  const tagsContainer = document.getElementById('manga-tags');
  if (tagsContainer && manga.tags) {
    tagsContainer.innerHTML = manga.tags.map(t => `
      <a href="/tag/${t.slug}" class="tag-pill">
        <i class="fa-solid fa-tag" style="color: var(--primary); font-size: 0.75rem; margin-right: 0.3rem;"></i>${t.name}
      </a>
    `).join('');
  }

  // Description
  const descEl = document.getElementById('manga-description');
  if (descEl) {
    descEl.textContent = manga.description || 'Nenhuma sinopse cadastrada.';
  }

  // Smart Resume / Read First Buttons
  const actionsContainer = document.getElementById('manga-action-buttons');
  if (actionsContainer && allChapters.length > 0) {
    const history = HistoryManager.getMangaHistory(manga.slug);
    const sortedAsc = [...allChapters].sort((a, b) => a.number - b.number);
    const firstChapter = sortedAsc[0];

    let buttonsHtml = `
      <a href="/read/${manga.slug}/${firstChapter.slug || firstChapter.number}" class="btn btn-primary btn-lg">
        <i class="fa-solid fa-book-open"></i> Ler Primeiro Cap. (${firstChapter.number})
      </a>
    `;

    if (history && history.chapterNumber) {
      buttonsHtml = `
        <a href="/read/${manga.slug}/${history.chapterSlug || history.chapterNumber}" class="btn btn-accent btn-lg">
          <i class="fa-solid fa-bolt" style="color: var(--primary);"></i> Continuar Cap. ${history.chapterNumber} (Pág. ${history.page})
        </a>
      ` + buttonsHtml;
    }

    actionsContainer.innerHTML = buttonsHtml;
  }
}

function renderChapterList(chapters) {
  const container = document.getElementById('chapters-list-container');
  const countEl = document.getElementById('chapters-count-label');
  if (!container) return;

  if (countEl) countEl.textContent = `${chapters.length} Capítulos`;

  if (chapters.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; background: var(--bg-surface); border-radius: var(--radius-md); color: var(--text-muted);">
        Nenhum capítulo disponível no momento.
      </div>
    `;
    return;
  }

  const sorted = [...chapters].sort((a, b) => {
    return sortOrder === 'DESC' ? (b.number - a.number) : (a.number - b.number);
  });

  const mangaSlug = currentManga.slug;
  const history = HistoryManager.getMangaHistory(mangaSlug);

  container.innerHTML = sorted.map(ch => {
    const isLastRead = history && history.chapterNumber === ch.number;
    const dateFormatted = ch.created_at ? new Date(ch.created_at).toLocaleDateString('pt-BR') : '';

    return `
      <a href="/read/${mangaSlug}/${ch.slug || ch.number}" class="chapter-list-item ${isLastRead ? 'last-read' : ''}">
        <div class="chapter-item-left">
          <span class="chapter-num-badge">Cap. ${ch.number}</span>
          <span class="chapter-title-text">${ch.title || `Capítulo ${ch.number}`}</span>
        </div>
        <div class="chapter-item-right">
          ${isLastRead ? `<span class="badge badge-ongoing" style="font-size: 0.65rem;"><i class="fa-solid fa-check"></i> Lido</span>` : ''}
          <span class="chapter-pages-tag">${ch.pages_count || 0} pág.</span>
          <span class="chapter-date">${dateFormatted}</span>
        </div>
      </a>
    `;
  }).join('');
}

function setupChapterListeners() {
  const searchInput = document.getElementById('chapter-search-input');
  const sortBtn = document.getElementById('chapter-sort-btn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = allChapters.filter(ch => 
        String(ch.number).includes(q) || 
        (ch.title && ch.title.toLowerCase().includes(q))
      );
      renderChapterList(filtered);
    });
  }

  if (sortBtn) {
    sortBtn.addEventListener('click', () => {
      sortOrder = sortOrder === 'DESC' ? 'ASC' : 'DESC';
      sortBtn.innerHTML = `<i class="fa-solid fa-arrow-${sortOrder === 'DESC' ? 'down-wide-short' : 'up-wide-short'}"></i> Ordem: ${sortOrder === 'DESC' ? 'Decrescente' : 'Crescente'}`;
      renderChapterList(allChapters);
    });
  }
}
