/**
 * Admin Authors and Tags Management
 */

document.addEventListener('DOMContentLoaded', async () => {
  await checkAdminAuth();
  await loadTags();
  await loadAuthors();
  setupModals();
});

async function loadTags() {
  const tbody = document.getElementById('tags-table-body');
  if (!tbody) return;

  try {
    const res = await api.get('/tags');
    const tags = res.data || [];

    tbody.innerHTML = tags.map(t => `
      <tr>
        <td><strong>${t.name}</strong></td>
        <td><code>${t.slug}</code></td>
        <td><span class="badge badge-completed">${t.mangas_count || 0} mangás</span></td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="openEditTagModal(${t.id}, '${t.name.replace(/'/g, "\\'")}', '${t.slug}')">✏️ Editar</button>
            <button class="btn btn-danger btn-sm" onclick="deleteTag(${t.id}, '${t.name.replace(/'/g, "\\'")}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error loading tags:', err);
  }
}

async function loadAuthors() {
  const tbody = document.getElementById('authors-table-body');
  if (!tbody) return;

  try {
    const res = await api.get('/authors');
    const authors = res.data || [];

    tbody.innerHTML = authors.map(a => `
      <tr>
        <td><strong>${a.name}</strong></td>
        <td><code>${a.slug}</code></td>
        <td><span class="badge badge-ongoing">${a.mangas_count || 0} mangás</span></td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="openEditAuthorModal(${a.id}, '${a.name.replace(/'/g, "\\'")}', '${a.slug}', '${(a.biography || '').replace(/'/g, "\\'").replace(/\n/g, '\\n')}')">✏️ Editar</button>
            <button class="btn btn-danger btn-sm" onclick="deleteAuthor(${a.id}, '${a.name.replace(/'/g, "\\'")}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error loading authors:', err);
  }
}

function setupModals() {
  // Tag form submit
  const tagForm = document.getElementById('tag-form');
  if (tagForm) {
    tagForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('tag-id-input').value;
      const name = document.getElementById('tag-name-input').value.trim();
      const slug = document.getElementById('tag-slug-input').value.trim();

      try {
        if (id) {
          await api.put(`/admin/tags/${id}`, { name, slug });
          showToast('Tag atualizada', 'success');
        } else {
          await api.post('/admin/tags', { name, slug });
          showToast('Tag criada com sucesso', 'success');
        }
        closeModal('tag-modal');
        loadTags();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Author form submit
  const authorForm = document.getElementById('author-form');
  if (authorForm) {
    authorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('author-id-input').value;
      const name = document.getElementById('author-name-input').value.trim();
      const slug = document.getElementById('author-slug-input').value.trim();
      const biography = document.getElementById('author-bio-input').value.trim();

      try {
        if (id) {
          await api.put(`/admin/authors/${id}`, { name, slug, biography });
          showToast('Autor atualizado', 'success');
        } else {
          await api.post('/admin/authors', { name, slug, biography });
          showToast('Autor cadastrado com sucesso', 'success');
        }
        closeModal('author-modal');
        loadAuthors();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

window.openCreateTagModal = function() {
  document.getElementById('tag-modal-title').textContent = 'Nova Tag / Gênero';
  document.getElementById('tag-id-input').value = '';
  document.getElementById('tag-name-input').value = '';
  document.getElementById('tag-slug-input').value = '';
  openModal('tag-modal');
};

window.openEditTagModal = function(id, name, slug) {
  document.getElementById('tag-modal-title').textContent = 'Editar Tag';
  document.getElementById('tag-id-input').value = id;
  document.getElementById('tag-name-input').value = name;
  document.getElementById('tag-slug-input').value = slug;
  openModal('tag-modal');
};

window.openCreateAuthorModal = function() {
  document.getElementById('author-modal-title').textContent = 'Novo Autor';
  document.getElementById('author-id-input').value = '';
  document.getElementById('author-name-input').value = '';
  document.getElementById('author-slug-input').value = '';
  document.getElementById('author-bio-input').value = '';
  openModal('author-modal');
};

window.openEditAuthorModal = function(id, name, slug, bio) {
  document.getElementById('author-modal-title').textContent = 'Editar Autor';
  document.getElementById('author-id-input').value = id;
  document.getElementById('author-name-input').value = name;
  document.getElementById('author-slug-input').value = slug;
  document.getElementById('author-bio-input').value = bio;
  openModal('author-modal');
};

window.openModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('show');
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('show');
};

window.deleteTag = async function(id, name) {
  if (!confirm(`Deseja excluir a tag "${name}"?`)) return;
  try {
    const res = await api.delete(`/admin/tags/${id}`);
    if (res.success) {
      showToast('Tag excluída', 'success');
      loadTags();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.deleteAuthor = async function(id, name) {
  if (!confirm(`Deseja excluir o autor "${name}"?`)) return;
  try {
    const res = await api.delete(`/admin/authors/${id}`);
    if (res.success) {
      showToast('Autor excluído', 'success');
      loadAuthors();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};
