/**
 * Ultimate Manga Reader
 * Sections 13, 14, 15, 16, 36, 37 of specification
 */

let readerData = null;
let currentPage = 1;
let currentMode = localStorage.getItem('reader_mode') || 'page'; // 'page' | 'scroll'
let readingDirection = localStorage.getItem('reader_direction') || 'ltr'; // 'ltr' | 'rtl'
let hudTimeout = null;
let isHudVisible = true;
const preloadedImages = new Map();

document.addEventListener('DOMContentLoaded', async () => {
  // Extract params: /read/:manga/:chapter or query
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const mangaSlug = pathParts[1] || new URLSearchParams(window.location.search).get('manga');
  const chapterSlug = pathParts[2] || new URLSearchParams(window.location.search).get('chapter');

  if (!mangaSlug || !chapterSlug) {
    window.location.href = '/mangas';
    return;
  }

  await loadReader(mangaSlug, chapterSlug);
  setupHudControls();
  setupKeyboardShortcuts();
});

async function loadReader(mangaSlug, chapterSlug) {
  try {
    const data = await api.get(`/manga/${mangaSlug}/chapters/${chapterSlug}`);
    if (!data || !data.chapter) throw new Error('Dados do capítulo não encontrados');

    readerData = data;
    document.title = `${readerData.manga.title} - Cap. ${readerData.chapter.number} — MangaReader`;

    // Initialize HUD elements
    document.getElementById('hud-manga-title').textContent = readerData.manga.title;
    document.getElementById('hud-chapter-title').textContent = readerData.chapter.title || `Capítulo ${readerData.chapter.number}`;
    document.getElementById('hud-back-btn').href = `/manga/${readerData.manga.slug}`;

    // Populate chapter select dropdown
    const chapterSelect = document.getElementById('hud-chapter-select');
    if (chapterSelect && readerData.allChapters) {
      chapterSelect.innerHTML = readerData.allChapters.map(ch => `
        <option value="${ch.slug || ch.number}" ${ch.id === readerData.chapter.id ? 'selected' : ''}>
          Cap. ${ch.number} ${ch.title ? `- ${ch.title}` : ''}
        </option>
      `).join('');

      chapterSelect.addEventListener('change', (e) => {
        window.location.href = `/read/${readerData.manga.slug}/${e.target.value}`;
      });
    }

    // Check saved page in local storage (Section 37)
    const saved = HistoryManager.getChapterProgress(readerData.manga.slug, readerData.chapter.number);
    if (saved && saved.page && saved.page > 1 && saved.page <= (readerData.pages?.length || 1)) {
      currentPage = saved.page;
      showToast(`Continuando da página ${currentPage}`, 'info');
    } else {
      currentPage = 1;
    }

    // Render Mode
    renderCurrentMode();

    // Auto-hide HUD timer
    resetHudTimer();
  } catch (err) {
    console.error('Error loading reader:', err);
    document.getElementById('reader-root').innerHTML = `
      <div style="text-align: center; padding: 6rem 1.5rem;">
        <h2 style="color: var(--primary); margin-bottom: 1rem;">Erro ao carregar capítulo</h2>
        <p style="color: var(--text-muted); margin-bottom: 2rem;">${err.message || 'Capítulo não encontrado'}</p>
        <a href="/mangas" class="btn btn-primary"><i class="fa-solid fa-arrow-left"></i> Voltar para o catálogo</a>
      </div>
    `;
  }
}

function renderCurrentMode() {
  const container = document.getElementById('reader-root');
  if (!container || !readerData) return;

  const modeBtn = document.getElementById('hud-mode-toggle');
  if (modeBtn) {
    modeBtn.innerHTML = currentMode === 'page' 
      ? '<i class="fa-solid fa-file-lines"></i> <span>Página</span>' 
      : '<i class="fa-solid fa-bars"></i> <span>Cascata</span>';
  }

  if (currentMode === 'page') {
    renderPageMode(container);
  } else {
    renderScrollMode(container);
  }

  saveCurrentProgress();
}

/* ==========================================================================
   MODE 1: PAGE BY PAGE
   ========================================================================== */
function renderPageMode(container) {
  const totalPages = readerData.pages.length;
  if (totalPages === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 5rem; color: var(--text-muted);">Capítulo sem páginas cadastradas.</div>`;
    return;
  }

  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const page = readerData.pages[currentPage - 1];

  // Preload adjacent pages (Section 15 of spec)
  preloadPage(currentPage + 1);
  preloadPage(currentPage + 2);
  preloadPage(currentPage - 1);

  container.innerHTML = `
    <div class="page-mode-wrapper" id="page-mode-wrapper">
      <button class="reader-nav-arrow reader-nav-prev" onclick="goToPreviousPage()" title="Página Anterior">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
      
      <div class="single-page-frame" id="single-page-frame">
        <div class="click-zone click-zone-left" id="click-zone-left"></div>
        <div class="click-zone click-zone-right" id="click-zone-right"></div>
        <img id="single-page-img" src="${page.url}" alt="Página ${page.number}">
      </div>

      <button class="reader-nav-arrow reader-nav-next" onclick="goToNextPage()" title="Próxima Página">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    </div>

    <div class="reader-bottom-hud" id="reader-bottom-hud">
      <button class="btn btn-secondary btn-sm" onclick="goToPreviousPage()" title="Página Anterior">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
      <div class="page-scrubber">
        <input type="range" id="page-slider" min="1" max="${totalPages}" value="${currentPage}">
        <span class="page-indicator-text" id="page-indicator-text">${currentPage} / ${totalPages}</span>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="goToNextPage()" title="Próxima Página">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  `;

  // Attach touch/click zones
  const leftZone = document.getElementById('click-zone-left');
  const rightZone = document.getElementById('click-zone-right');

  if (leftZone && rightZone) {
    leftZone.addEventListener('click', (e) => {
      e.stopPropagation();
      if (readingDirection === 'rtl') {
        goToNextPage();
      } else {
        goToPreviousPage();
      }
    });

    rightZone.addEventListener('click', (e) => {
      e.stopPropagation();
      if (readingDirection === 'rtl') {
        goToPreviousPage();
      } else {
        goToNextPage();
      }
    });
  }

  // Slider change
  const slider = document.getElementById('page-slider');
  if (slider) {
    slider.addEventListener('input', (e) => {
      const targetPage = parseInt(e.target.value, 10);
      setPage(targetPage);
    });
  }
}

function setPage(pageNum) {
  const totalPages = readerData.pages.length;
  if (pageNum < 1) {
    if (readerData.navigation?.previous) {
      if (confirm(`Ir para o Capítulo ${readerData.navigation.previous.number}?`)) {
        window.location.href = `/read/${readerData.manga.slug}/${readerData.navigation.previous.slug || readerData.navigation.previous.number}`;
      }
    }
    return;
  }

  if (pageNum > totalPages) {
    if (readerData.navigation?.next) {
      if (confirm(`Capítulo finalizado! Ir para o Capítulo ${readerData.navigation.next.number}?`)) {
        window.location.href = `/read/${readerData.manga.slug}/${readerData.navigation.next.slug || readerData.navigation.next.number}`;
      }
    } else {
      showToast('Você chegou ao último capítulo!', 'info');
    }
    return;
  }

  currentPage = pageNum;
  const page = readerData.pages[currentPage - 1];

  const img = document.getElementById('single-page-img');
  const slider = document.getElementById('page-slider');
  const text = document.getElementById('page-indicator-text');

  if (img) img.src = page.url;
  if (slider) slider.value = currentPage;
  if (text) text.textContent = `${currentPage} / ${totalPages}`;

  // Preload next
  preloadPage(currentPage + 1);
  preloadPage(currentPage + 2);

  saveCurrentProgress();
}

function goToNextPage() {
  setPage(currentPage + 1);
}

function goToPreviousPage() {
  setPage(currentPage - 1);
}

function preloadPage(pageNum) {
  if (!readerData || !readerData.pages) return;
  if (pageNum < 1 || pageNum > readerData.pages.length) return;

  const page = readerData.pages[pageNum - 1];
  if (page && page.url && !preloadedImages.has(page.url)) {
    const img = new Image();
    img.src = page.url;
    preloadedImages.set(page.url, img);
  }
}

/* ==========================================================================
   MODE 2: VERTICAL CONTINUOUS SCROLL (WEBTOON)
   ========================================================================== */
function renderScrollMode(container) {
  const totalPages = readerData.pages.length;
  const prevChapter = readerData.navigation?.previous;
  const nextChapter = readerData.navigation?.next;

  container.innerHTML = `
    <div class="scroll-mode-wrapper" id="scroll-mode-wrapper">
      ${readerData.pages.map(p => `
        <div class="scroll-page-item" data-page="${p.number}" style="min-height: 400px;">
          <img data-src="${p.url}" alt="Página ${p.number}" class="lazy-page">
        </div>
      `).join('')}

      <!-- Chapter Navigation Banner -->
      <div class="chapter-end-banner">
        <h3 class="chapter-end-title">Fim do Capítulo ${readerData.chapter.number}</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">${readerData.manga.title} • ${totalPages} Páginas</p>
        <div class="chapter-end-nav">
          ${prevChapter ? `
            <a href="/read/${readerData.manga.slug}/${prevChapter.slug || prevChapter.number}" class="btn btn-secondary btn-lg">
              <i class="fa-solid fa-arrow-left"></i> Cap. ${prevChapter.number}
            </a>
          ` : ''}
          <a href="/manga/${readerData.manga.slug}" class="btn btn-accent btn-lg">
            <i class="fa-solid fa-list"></i> Lista de Capítulos
          </a>
          ${nextChapter ? `
            <a href="/read/${readerData.manga.slug}/${nextChapter.slug || nextChapter.number}" class="btn btn-primary btn-lg">
              Próximo: Cap. ${nextChapter.number} <i class="fa-solid fa-arrow-right"></i>
            </a>
          ` : ''}
        </div>
      </div>
    </div>

    <div class="scroll-floating-pill" id="scroll-pill">
      Pág. ${currentPage} / ${totalPages}
    </div>
  `;

  setupScrollLazyLoading();
}

function setupScrollLazyLoading() {
  const lazyImages = document.querySelectorAll('.lazy-page');
  const scrollPill = document.getElementById('scroll-pill');
  const totalPages = readerData.pages.length;

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.getAttribute('data-src');
        img.onload = () => img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '600px 0px 600px 0px',
  });

  lazyImages.forEach(img => imageObserver.observe(img));

  // Page position tracking observer
  const pageItems = document.querySelectorAll('.scroll-page-item');
  const pageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const pNum = parseInt(entry.target.getAttribute('data-page'), 10);
        if (pNum) {
          currentPage = pNum;
          if (scrollPill) scrollPill.textContent = `Pág. ${currentPage} / ${totalPages}`;
          saveCurrentProgress();
        }
      }
    });
  }, {
    threshold: 0.3,
  });

  pageItems.forEach(item => pageObserver.observe(item));
}

/* ==========================================================================
   PROGRESS SAVING
   ========================================================================== */
function saveCurrentProgress() {
  if (!readerData) return;
  HistoryManager.saveProgress({
    mangaSlug: readerData.manga.slug,
    mangaTitle: readerData.manga.title,
    mangaCover: readerData.manga.cover,
    chapterId: readerData.chapter.id,
    chapterNumber: readerData.chapter.number,
    chapterSlug: readerData.chapter.slug,
    page: currentPage,
    totalPages: readerData.pages.length,
  });
}

/* ==========================================================================
   HUD AUTO-HIDE & INTERACTION
   ========================================================================== */
function setupHudControls() {
  const hud = document.getElementById('reader-hud');
  const modeToggle = document.getElementById('hud-mode-toggle');
  const dirToggle = document.getElementById('hud-dir-toggle');
  const fullscreenToggle = document.getElementById('hud-fullscreen-toggle');
  const helpToggle = document.getElementById('hud-help-toggle');
  const helpModal = document.getElementById('help-modal');
  const closeHelpBtn = document.getElementById('close-help-modal');

  // Mode Toggle
  if (modeToggle) {
    modeToggle.addEventListener('click', () => {
      currentMode = currentMode === 'page' ? 'scroll' : 'page';
      localStorage.setItem('reader_mode', currentMode);
      renderCurrentMode();
    });
  }

  // Reading Direction Toggle (LTR / RTL)
  if (dirToggle) {
    dirToggle.innerHTML = `<i class="fa-solid ${readingDirection === 'rtl' ? 'fa-arrow-left-long' : 'fa-arrow-right-long'}"></i> <span>${readingDirection.toUpperCase()}</span>`;
    dirToggle.addEventListener('click', () => {
      readingDirection = readingDirection === 'ltr' ? 'rtl' : 'ltr';
      localStorage.setItem('reader_direction', readingDirection);
      dirToggle.innerHTML = `<i class="fa-solid ${readingDirection === 'rtl' ? 'fa-arrow-left-long' : 'fa-arrow-right-long'}"></i> <span>${readingDirection.toUpperCase()}</span>`;
      showToast(`Direção: ${readingDirection.toUpperCase()}`, 'info');
    });
  }

  // Fullscreen Toggle
  if (fullscreenToggle) {
    fullscreenToggle.addEventListener('click', toggleFullscreen);
  }

  // Help Modal
  if (helpToggle && helpModal) {
    helpToggle.addEventListener('click', () => helpModal.classList.add('show'));
  }
  if (closeHelpBtn && helpModal) {
    closeHelpBtn.addEventListener('click', () => helpModal.classList.remove('show'));
  }
  if (helpModal) {
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) helpModal.classList.remove('show');
    });
  }

  // Reveal HUD on mouse move or screen tap
  window.addEventListener('mousemove', (e) => {
    if (e.clientY < 80 || e.clientY > window.innerHeight - 80) {
      showHud();
    }
  });

  window.addEventListener('click', (e) => {
    // Only toggle HUD if not clicking an interactive button
    if (!e.target.closest('button') && !e.target.closest('a') && !e.target.closest('select') && !e.target.closest('input')) {
      toggleHud();
    }
  });
}

function showHud() {
  const topHud = document.getElementById('reader-hud');
  const bottomHud = document.getElementById('reader-bottom-hud');

  if (topHud) topHud.classList.remove('hidden');
  if (bottomHud) bottomHud.classList.remove('hidden');
  isHudVisible = true;
  resetHudTimer();
}

function hideHud() {
  const topHud = document.getElementById('reader-hud');
  const bottomHud = document.getElementById('reader-bottom-hud');

  if (topHud) topHud.classList.add('hidden');
  if (bottomHud) bottomHud.classList.add('hidden');
  isHudVisible = false;
}

function toggleHud() {
  if (isHudVisible) {
    hideHud();
  } else {
    showHud();
  }
}

function resetHudTimer() {
  clearTimeout(hudTimeout);
  hudTimeout = setTimeout(() => {
    hideHud();
  }, 4000);
}

function toggleFullscreen() {
  const fullscreenToggle = document.getElementById('hud-fullscreen-toggle');
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      if (fullscreenToggle) fullscreenToggle.innerHTML = '<i class="fa-solid fa-compress"></i>';
    }).catch(() => {});
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        if (fullscreenToggle) fullscreenToggle.innerHTML = '<i class="fa-solid fa-expand"></i>';
      }).catch(() => {});
    }
  }
}

/* ==========================================================================
   KEYBOARD SHORTCUTS
   ========================================================================== */
function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key) {
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (readingDirection === 'rtl') goToPreviousPage();
        else goToNextPage();
        break;

      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (readingDirection === 'rtl') goToNextPage();
        else goToPreviousPage();
        break;

      case ' ': // Space bar
        goToNextPage();
        break;

      case 'f':
      case 'F':
        toggleFullscreen();
        break;

      case 'm':
      case 'M':
        currentMode = currentMode === 'page' ? 'scroll' : 'page';
        localStorage.setItem('reader_mode', currentMode);
        renderCurrentMode();
        break;

      case '?':
        const modal = document.getElementById('help-modal');
        if (modal) modal.classList.toggle('show');
        break;
    }
  });
}
