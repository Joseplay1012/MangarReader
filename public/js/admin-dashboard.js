/**
 * Admin Dashboard Presenter
 */

document.addEventListener('DOMContentLoaded', async () => {
  await checkAdminAuth();
  await loadStats();
  await loadMangasTable();
});

async function loadStats() {
  try {
    const res = await api.get('/admin/stats');
    if (res.success && res.data) {
      const { mangas, chapters, pages, storageFormatted, databaseDriver } = res.data;
      document.getElementById('stat-mangas').textContent = mangas;
      document.getElementById('stat-chapters').textContent = chapters;
      document.getElementById('stat-pages').textContent = pages;
      document.getElementById('stat-storage').textContent = storageFormatted;
      
      const dbTag = document.getElementById('stat-db-driver');
      if (dbTag) dbTag.textContent = `Driver: ${databaseDriver.toUpperCase()}`;
    }
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

async function loadMangasTable(search = '') {
  const tbody = document.getElementById('mangas-table-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem;">Carregando mangás...</td></tr>`;

  try {
    const res = await api.get('/mangas', { search, limit: 100 });
    const mangas = res.data || [];

    if (mangas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">Nenhum mangá cadastrado</td></tr>`;
      return;
    }

    tbody.innerHTML = mangas.map(m => {
      const authors = m.authors?.map(a => a.name).join(', ') || 'Nenhum';
      const tags = m.tags?.map(t => `<span class="badge" style="background: rgba(255,255,255,0.05); font-size: 0.65rem;">${t.name}</span>`).join(' ') || '';

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <img src="${m.cover || '/storage/covers/placeholder.webp'}" alt="" style="width: 40px; height: 55px; object-fit: cover; border-radius: 4px;">
              <div>
                <a href="/manga/${m.slug}" target="_blank" style="font-weight: 700; color: #fff;">${m.title}</a>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${m.slug}</div>
              </div>
            </div>
          </td>
          <td><span class="badge badge-${m.status}">${m.status}</span></td>
          <td>${m.release_year || '—'}</td>
          <td>
            <div style="font-size: 0.85rem;">${authors}</div>
            <div style="margin-top: 0.25rem;">${tags}</div>
          </td>
          <td>
            <span style="font-weight: 700; color: var(--primary);">${m.chapters_count || 0}</span> capítulos
          </td>
          <td>
            <div class="table-actions">
              <a href="/admin/chapter-editor?mangaId=${m.id}" class="btn btn-secondary btn-sm" title="Gerenciar Capítulos">
                <i class="fa-solid fa-list-ol"></i> Capítulos
              </a>
              <a href="/admin/manga-editor?id=${m.id}" class="btn btn-secondary btn-sm" title="Editar Mangá">
                <i class="fa-solid fa-pen"></i>
              </a>
              <button class="btn btn-danger btn-sm" onclick="confirmDeleteManga(${m.id}, '${m.title.replace(/'/g, "\\'")}')" title="Excluir Mangá">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading manga table:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="color: var(--danger); text-align: center; padding: 2rem;">Erro ao carregar lista de mangás</td></tr>`;
  }
}

window.confirmDeleteManga = async function(id, title) {
  if (!confirm(`Tem certeza que deseja excluir o mangá "${title}"?\nTODOS os capítulos, páginas e arquivos serão permanentemente removidos!`)) {
    return;
  }

  try {
    const res = await api.delete(`/admin/mangas/${id}`);
    if (res.success) {
      showToast('Mangá excluído com sucesso', 'success');
      await loadStats();
      await loadMangasTable();
    } else {
      showToast(res.error || 'Erro ao excluir mangá', 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};
