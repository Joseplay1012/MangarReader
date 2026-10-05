/**
 * Author & Tag Taxonomy Page Presenter
 */

document.addEventListener('DOMContentLoaded', async () => {
  const path = window.location.pathname;
  const pathParts = path.split('/').filter(Boolean);
  const type = pathParts[0]; // 'author' | 'tag'
  const slug = pathParts[1] || new URLSearchParams(window.location.search).get('slug');

  if (!slug) {
    window.location.href = '/mangas';
    return;
  }

  if (type === 'author') {
    await loadAuthor(slug);
  } else {
    await loadTag(slug);
  }
});

async function loadAuthor(slug) {
  try {
    const res = await api.get(`/authors/${slug}`);
    if (!res.success) throw new Error(res.error);

    const author = res.data;
    document.title = `${author.name} — Obras e Mangás`;

    const titleEl = document.getElementById('taxonomy-title');
    const descEl = document.getElementById('taxonomy-desc');
    const badgeEl = document.getElementById('taxonomy-type-badge');

    if (titleEl) titleEl.textContent = author.name;
    if (badgeEl) badgeEl.textContent = 'AUTOR / MANGAKÁ';
    if (descEl) descEl.textContent = author.biography || 'Sem biografia cadastrada.';

    renderMangas(author.mangas || []);
  } catch (err) {
    console.error('Error loading author:', err);
    showNotFound('Autor não encontrado');
  }
}

async function loadTag(slug) {
  try {
    const res = await api.get(`/tags/${slug}`);
    if (!res.success) throw new Error(res.error);

    const tag = res.data;
    document.title = `${tag.name} — Mangás por Gênero`;

    const titleEl = document.getElementById('taxonomy-title');
    const descEl = document.getElementById('taxonomy-desc');
    const badgeEl = document.getElementById('taxonomy-type-badge');

    if (titleEl) titleEl.textContent = tag.name;
    if (badgeEl) badgeEl.textContent = 'GÊNERO / TAG';
    if (descEl) descEl.textContent = `Mangás classificados com o gênero "${tag.name}".`;

    renderMangas(tag.mangas || []);
  } catch (err) {
    console.error('Error loading tag:', err);
    showNotFound('Gênero não encontrado');
  }
}

function renderMangas(mangas) {
  const container = document.getElementById('taxonomy-mangas-grid');
  const countEl = document.getElementById('taxonomy-count');

  if (countEl) countEl.textContent = `${mangas.length} obras encontradas`;

  if (!container) return;

  if (mangas.length === 0) {
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-muted);">Nenhum mangá associado no momento.</div>`;
    return;
  }

  container.innerHTML = mangas.map(m => `
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
  `).join('');
}

function showNotFound(msg) {
  document.getElementById('taxonomy-root').innerHTML = `
    <div style="text-align: center; padding: 5rem 1rem;">
      <h2>${msg}</h2>
      <p style="color: var(--text-muted); margin: 1rem 0 2rem;">Não foi possível encontrar as informações solicitadas.</p>
      <a href="/mangas" class="btn btn-primary">Voltar para o catálogo</a>
    </div>
  `;
}
