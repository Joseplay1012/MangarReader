/**
 * Admin Manga Editor (Create / Edit)
 * Section 18 of specification
 */

let editingMangaId = null;
let coverFile = null;

document.addEventListener('DOMContentLoaded', async () => {
  await checkAdminAuth();

  const urlParams = new URLSearchParams(window.location.search);
  editingMangaId = urlParams.get('id');

  // Load available tags and authors
  await loadTaxonomies();

  if (editingMangaId) {
    document.getElementById('editor-page-title').textContent = 'Editar Mangá';
    await loadMangaForEdit(editingMangaId);
  }

  setupFormListeners();
});

async function loadTaxonomies() {
  try {
    const [tagsRes, authorsRes] = await Promise.all([
      api.get('/tags'),
      api.get('/authors')
    ]);

    const tagsBox = document.getElementById('tags-checkbox-grid');
    if (tagsBox && tagsRes.success) {
      tagsBox.innerHTML = tagsRes.data.map(t => `
        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer; background: var(--bg-surface-elevated); padding: 0.4rem 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border);">
          <input type="checkbox" name="tag_ids" value="${t.id}">
          <span>${t.name}</span>
        </label>
      `).join('');
    }

    const authorsBox = document.getElementById('authors-checkbox-grid');
    if (authorsBox && authorsRes.success) {
      authorsBox.innerHTML = authorsRes.data.map(a => `
        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer; background: var(--bg-surface-elevated); padding: 0.4rem 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border);">
          <input type="checkbox" name="author_ids" value="${a.id}">
          <span>${a.name}</span>
        </label>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading taxonomies:', err);
  }
}

async function loadMangaForEdit(id) {
  try {
    const res = await api.get(`/mangas/${id}`);
    if (!res.success) throw new Error(res.error);

    const manga = res.data;
    document.getElementById('manga-title-input').value = manga.title || '';
    document.getElementById('manga-slug-input').value = manga.slug || '';
    document.getElementById('manga-status-select').value = manga.status || 'ongoing';
    document.getElementById('manga-year-input').value = manga.release_year || '';
    document.getElementById('manga-desc-input').value = manga.description || '';

    if (manga.cover) {
      const preview = document.getElementById('cover-preview-img');
      if (preview) {
        preview.src = manga.cover;
        preview.style.display = 'block';
      }
    }

    // Check tags
    if (manga.tags) {
      const tagIds = manga.tags.map(t => String(t.id));
      document.querySelectorAll('input[name="tag_ids"]').forEach(chk => {
        if (tagIds.includes(chk.value)) chk.checked = true;
      });
    }

    // Check authors
    if (manga.authors) {
      const authorIds = manga.authors.map(a => String(a.id));
      document.querySelectorAll('input[name="author_ids"]').forEach(chk => {
        if (authorIds.includes(chk.value)) chk.checked = true;
      });
    }
  } catch (err) {
    console.error('Error loading manga for edit:', err);
    showToast('Erro ao carregar dados do mangá', 'error');
  }
}

function setupFormListeners() {
  const titleInput = document.getElementById('manga-title-input');
  const slugInput = document.getElementById('manga-slug-input');
  const coverInput = document.getElementById('manga-cover-file');
  const form = document.getElementById('manga-form');
  const dropzone = document.getElementById('cover-dropzone');

  // Auto-slug
  if (titleInput && slugInput) {
    titleInput.addEventListener('input', (e) => {
      if (!editingMangaId) {
        slugInput.value = e.target.value
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
    });
  }

  // Cover file handling
  function handleCoverFile(file) {
    if (!file) return;
    coverFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById('cover-preview-img');
      if (preview) {
        preview.src = e.target.result;
        preview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  }

  if (coverInput) {
    coverInput.addEventListener('change', (e) => {
      handleCoverFile(e.target.files[0]);
    });
  }

  if (dropzone) {
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleCoverFile(e.dataTransfer.files[0]);
      }
    });
  }

  // Form Submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = titleInput.value.trim();
      if (!title) {
        showToast('O título do mangá é obrigatório', 'error');
        return;
      }

      const saveBtn = document.getElementById('save-manga-btn');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Salvando...';
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('slug', slugInput.value.trim());
      formData.append('status', document.getElementById('manga-status-select').value);
      formData.append('release_year', document.getElementById('manga-year-input').value);
      formData.append('description', document.getElementById('manga-desc-input').value);

      if (coverFile) {
        formData.append('cover', coverFile);
      }

      const selectedTags = Array.from(document.querySelectorAll('input[name="tag_ids"]:checked')).map(c => c.value);
      const selectedAuthors = Array.from(document.querySelectorAll('input[name="author_ids"]:checked')).map(c => c.value);

      formData.append('tag_ids', selectedTags.join(','));
      formData.append('author_ids', selectedAuthors.join(','));

      try {
        let res;
        if (editingMangaId) {
          res = await api.put(`/admin/mangas/${editingMangaId}`, formData);
        } else {
          res = await api.post('/admin/mangas', formData);
        }

        if (res.success) {
          showToast(`Mangá ${editingMangaId ? 'atualizado' : 'criado'} com sucesso!`, 'success');
          setTimeout(() => {
            window.location.href = '/admin';
          }, 1000);
        } else {
          throw new Error(res.error || 'Erro ao salvar mangá');
        }
      } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Salvar Mangá';
        }
      }
    });
  }
}
