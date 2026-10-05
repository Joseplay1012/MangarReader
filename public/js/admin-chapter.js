/**
 * Admin Chapter Editor & Drag-and-Drop Page Reordering
 * Sections 19, 20, 22, 23 of specification
 */

let selectedMangaId = null;
let editingChapterId = null;
let stagedFiles = []; // Array of { file, previewUrl, id }
let existingPages = []; // Array of { id, page_number, image_path, width, height }
let draggedItemIndex = null;
let isDraggingExisting = false;

document.addEventListener('DOMContentLoaded', async () => {
  await checkAdminAuth();

  const urlParams = new URLSearchParams(window.location.search);
  selectedMangaId = urlParams.get('mangaId');
  editingChapterId = urlParams.get('id');

  await loadMangasDropdown();

  if (editingChapterId) {
    document.getElementById('chapter-editor-title').textContent = 'Editar Capítulo & Páginas';
    await loadChapterForEdit(editingChapterId);
  } else if (selectedMangaId) {
    document.getElementById('chapter-manga-select').value = selectedMangaId;
    loadMangaChaptersList(selectedMangaId);
  }

  setupDropzone();
  setupForm();
});

async function loadMangasDropdown() {
  try {
    const res = await api.get('/mangas', { limit: 100 });
    const select = document.getElementById('chapter-manga-select');
    if (select && res.success) {
      select.innerHTML = `<option value="">-- Selecione o Mangá --</option>` + res.data.map(m => `
        <option value="${m.id}" ${String(m.id) === String(selectedMangaId) ? 'selected' : ''}>${m.title}</option>
      `).join('');

      select.addEventListener('change', (e) => {
        selectedMangaId = e.target.value;
        if (selectedMangaId) {
          loadMangaChaptersList(selectedMangaId);
        }
      });
    }
  } catch (err) {
    console.error('Error loading mangas dropdown:', err);
  }
}

async function loadMangaChaptersList(mangaId) {
  const container = document.getElementById('manga-chapters-table');
  if (!container) return;

  try {
    const res = await api.get(`/mangas/${mangaId}/chapters`);
    const chapters = res.data?.chapters || [];

    if (chapters.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">Nenhum capítulo cadastrado para este mangá.</p>`;
      return;
    }

    container.innerHTML = `
      <table class="admin-table" style="font-size: 0.85rem;">
        <thead>
          <tr>
            <th>Cap.</th>
            <th>Título</th>
            <th>Páginas</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${chapters.map(c => `
            <tr>
              <td><strong>${c.number}</strong></td>
              <td>${c.title || '—'}</td>
              <td>${c.pages_count || 0}</td>
              <td>
                <div class="table-actions">
                  <a href="/admin/chapter-editor?id=${c.id}" class="btn btn-secondary btn-sm">Editar / Ordenar</a>
                  <button class="btn btn-danger btn-sm" onclick="confirmDeleteChapter(${c.id})">🗑️</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error('Error loading chapters list:', err);
  }
}

async function loadChapterForEdit(chapterId) {
  try {
    const res = await api.get(`/chapters/${chapterId}`);
    if (!res.success) throw new Error(res.error);

    const ch = res.data;
    selectedMangaId = ch.manga_id;
    document.getElementById('chapter-manga-select').value = ch.manga_id;
    document.getElementById('chapter-number-input').value = ch.number;
    document.getElementById('chapter-title-input').value = ch.title || '';
    document.getElementById('chapter-slug-input').value = ch.slug || '';

    existingPages = ch.pages || [];
    renderExistingPagesGrid();
    loadMangaChaptersList(ch.manga_id);

    // Show reorder save button
    const reorderBtn = document.getElementById('save-reorder-btn');
    if (reorderBtn) reorderBtn.style.display = 'inline-flex';
  } catch (err) {
    console.error('Error loading chapter:', err);
    showToast('Erro ao carregar dados do capítulo', 'error');
  }
}

/* ==========================================================================
   DROPZONE & CLIENT-SIDE STAGING
   ========================================================================== */
function setupDropzone() {
  const dropzone = document.getElementById('pages-dropzone');
  const fileInput = document.getElementById('pages-file-input');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files) {
        handleFilesSelected(Array.from(e.dataTransfer.files));
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files) {
        handleFilesSelected(Array.from(e.target.files));
      }
    });
  }
}

function handleFilesSelected(files) {
  // Filter only images and sort naturally by name
  const validFiles = files
    .filter(f => f.type.startsWith('image/'))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  if (validFiles.length === 0) {
    showToast('Nenhuma imagem válida selecionada', 'warning');
    return;
  }

  validFiles.forEach((file) => {
    const previewUrl = URL.createObjectURL(file);
    stagedFiles.push({
      file,
      previewUrl,
      id: `staged_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: file.name
    });
  });

  renderStagedPagesGrid();
  showToast(`${validFiles.length} imagens adicionadas para ordenação`, 'info');
}

/* ==========================================================================
   DRAG AND DROP PAGE REORDERING (Section 20 of spec)
   ========================================================================== */
function renderStagedPagesGrid() {
  const grid = document.getElementById('staged-pages-grid');
  const stagedSection = document.getElementById('staged-pages-section');
  if (!grid || !stagedSection) return;

  if (stagedFiles.length === 0) {
    stagedSection.style.display = 'none';
    grid.innerHTML = '';
    return;
  }

  stagedSection.style.display = 'block';
  document.getElementById('staged-count-badge').textContent = `${stagedFiles.length} imagens preparadas`;

  grid.innerHTML = stagedFiles.map((item, index) => {
    const pageNum = index + 1;
    const padded = String(pageNum).padStart(2, '0');

    return `
      <div class="page-reorder-item" 
           draggable="true" 
           data-index="${index}" 
           ondragstart="handleDragStart(event, ${index}, false)"
           ondragover="handleDragOver(event)"
           ondragenter="handleDragEnter(event)"
           ondragleave="handleDragLeave(event)"
           ondrop="handleDrop(event, ${index}, false)">
        <div class="page-thumb-wrapper">
          <span class="page-number-tag">${padded}</span>
          <img src="${item.previewUrl}" alt="Página ${pageNum}">
        </div>
        <div class="page-item-controls">
          <button type="button" class="page-control-btn" onclick="moveStagedItem(${index}, -1)" title="Mover para esquerda/cima">◀</button>
          <button type="button" class="page-control-btn delete-btn" onclick="removeStagedItem(${index})" title="Remover">✕</button>
          <button type="button" class="page-control-btn" onclick="moveStagedItem(${index}, 1)" title="Mover para direita/baixo">▶</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderExistingPagesGrid() {
  const grid = document.getElementById('existing-pages-grid');
  const section = document.getElementById('existing-pages-section');
  if (!grid || !section) return;

  if (existingPages.length === 0) {
    section.style.display = 'none';
    grid.innerHTML = '';
    return;
  }

  section.style.display = 'block';
  document.getElementById('existing-count-badge').textContent = `${existingPages.length} páginas salvas`;

  grid.innerHTML = existingPages.map((page, index) => {
    const pageNum = index + 1;
    const padded = String(pageNum).padStart(2, '0');

    return `
      <div class="page-reorder-item" 
           draggable="true" 
           data-index="${index}" 
           ondragstart="handleDragStart(event, ${index}, true)"
           ondragover="handleDragOver(event)"
           ondragenter="handleDragEnter(event)"
           ondragleave="handleDragLeave(event)"
           ondrop="handleDrop(event, ${index}, true)">
        <div class="page-thumb-wrapper">
          <span class="page-number-tag">${padded}</span>
          <img src="${page.image_path}" alt="Página ${pageNum}">
        </div>
        <div class="page-item-controls">
          <button type="button" class="page-control-btn" onclick="moveExistingItem(${index}, -1)" title="Mover para esquerda">◀</button>
          <button type="button" class="page-control-btn delete-btn" onclick="confirmDeleteExistingPage(${page.id})" title="Excluir página">✕</button>
          <button type="button" class="page-control-btn" onclick="moveExistingItem(${index}, 1)" title="Mover para direita">▶</button>
        </div>
      </div>
    `;
  }).join('');
}

// Drag & Drop Handlers
window.handleDragStart = function(e, index, isExisting) {
  draggedItemIndex = index;
  isDraggingExisting = isExisting;
  e.dataTransfer.effectAllowed = 'move';
  e.target.classList.add('dragging');
};

window.handleDragOver = function(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
};

window.handleDragEnter = function(e) {
  const item = e.target.closest('.page-reorder-item');
  if (item) item.classList.add('drag-over');
};

window.handleDragLeave = function(e) {
  const item = e.target.closest('.page-reorder-item');
  if (item) item.classList.remove('drag-over');
};

window.handleDrop = function(e, targetIndex, isExisting) {
  e.preventDefault();
  const item = e.target.closest('.page-reorder-item');
  if (item) item.classList.remove('drag-over');

  document.querySelectorAll('.page-reorder-item').forEach(el => el.classList.remove('dragging'));

  if (draggedItemIndex === null || isDraggingExisting !== isExisting) return;

  if (isExisting) {
    const moved = existingPages.splice(draggedItemIndex, 1)[0];
    existingPages.splice(targetIndex, 0, moved);
    renderExistingPagesGrid();
  } else {
    const moved = stagedFiles.splice(draggedItemIndex, 1)[0];
    stagedFiles.splice(targetIndex, 0, moved);
    renderStagedPagesGrid();
  }

  draggedItemIndex = null;
};

// Reorder with buttons
window.moveStagedItem = function(index, delta) {
  const newIndex = index + delta;
  if (newIndex < 0 || newIndex >= stagedFiles.length) return;
  const item = stagedFiles.splice(index, 1)[0];
  stagedFiles.splice(newIndex, 0, item);
  renderStagedPagesGrid();
};

window.removeStagedItem = function(index) {
  stagedFiles.splice(index, 1);
  renderStagedPagesGrid();
};

window.moveExistingItem = function(index, delta) {
  const newIndex = index + delta;
  if (newIndex < 0 || newIndex >= existingPages.length) return;
  const item = existingPages.splice(index, 1)[0];
  existingPages.splice(newIndex, 0, item);
  renderExistingPagesGrid();
};

// Save reordered pages sequence
window.saveExistingPageOrder = async function() {
  if (!editingChapterId) return;

  const pageOrder = existingPages.map((p, idx) => ({
    id: p.id,
    page_number: idx + 1
  }));

  try {
    const res = await api.put(`/admin/chapters/${editingChapterId}/reorder-pages`, { pageOrder });
    if (res.success) {
      showToast('Nova ordem das páginas salva com sucesso!', 'success');
      existingPages = res.data;
      renderExistingPagesGrid();
    } else {
      showToast(res.error || 'Erro ao reordenar páginas', 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.confirmDeleteExistingPage = async function(pageId) {
  if (!confirm('Deseja realmente excluir esta página?')) return;

  try {
    const res = await api.delete(`/admin/pages/${pageId}`);
    if (res.success) {
      showToast('Página excluída', 'success');
      existingPages = existingPages.filter(p => p.id !== pageId);
      renderExistingPagesGrid();
    } else {
      showToast(res.error || 'Erro ao excluir página', 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.confirmDeleteChapter = async function(chapterId) {
  if (!confirm('Deseja realmente excluir este capítulo e todas as suas páginas?')) return;

  try {
    const res = await api.delete(`/admin/chapters/${chapterId}`);
    if (res.success) {
      showToast('Capítulo excluído com sucesso', 'success');
      if (selectedMangaId) loadMangaChaptersList(selectedMangaId);
      if (editingChapterId == chapterId) {
        setTimeout(() => {
          window.location.href = `/admin/chapter-editor?mangaId=${selectedMangaId}`;
        }, 800);
      }
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

/* ==========================================================================
   FORM SUBMISSION
   ========================================================================== */
function setupForm() {
  const form = document.getElementById('chapter-form');
  const numberInput = document.getElementById('chapter-number-input');
  const titleInput = document.getElementById('chapter-title-input');

  if (numberInput && titleInput) {
    numberInput.addEventListener('input', (e) => {
      if (!titleInput.value) {
        titleInput.placeholder = `Capítulo ${e.target.value}`;
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!selectedMangaId) {
        showToast('Selecione um mangá', 'error');
        return;
      }

      const number = numberInput.value.trim();
      if (!number) {
        showToast('O número do capítulo é obrigatório', 'error');
        return;
      }

      const title = titleInput.value.trim();
      const slug = document.getElementById('chapter-slug-input').value.trim();

      const saveBtn = document.getElementById('save-chapter-btn');
      const progressBar = document.getElementById('upload-progress-bar');
      const progressFill = document.getElementById('upload-progress-fill');

      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Processando imagens com Sharp...';
      }

      if (progressBar && stagedFiles.length > 0) {
        progressBar.style.display = 'block';
        if (progressFill) progressFill.style.width = '60%';
      }

      try {
        if (editingChapterId) {
          // 1. Update metadata
          await api.put(`/admin/chapters/${editingChapterId}`, { number, title, slug });

          // 2. Upload staged pages if any
          if (stagedFiles.length > 0) {
            const formData = new FormData();
            stagedFiles.forEach(item => {
              formData.append('pages', item.file);
            });
            await api.post(`/admin/chapters/${editingChapterId}/pages`, formData);
          }

          if (progressFill) progressFill.style.width = '100%';
          showToast('Capítulo atualizado com sucesso!', 'success');
          setTimeout(() => {
            window.location.href = `/admin/chapter-editor?id=${editingChapterId}`;
          }, 800);
        } else {
          // Create new chapter
          const formData = new FormData();
          formData.append('number', number);
          formData.append('title', title);
          formData.append('slug', slug);

          stagedFiles.forEach(item => {
            formData.append('pages', item.file);
          });

          const res = await api.post(`/admin/mangas/${selectedMangaId}/chapters`, formData);
          if (progressFill) progressFill.style.width = '100%';

          showToast('Capítulo criado com sucesso!', 'success');
          setTimeout(() => {
            window.location.href = `/admin/chapter-editor?id=${res.data.id}`;
          }, 800);
        }
      } catch (err) {
        console.error('Error saving chapter:', err);
        showToast(err.message, 'error');
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Salvar Capítulo';
        }
        if (progressBar) progressBar.style.display = 'none';
      }
    });
  }
}
