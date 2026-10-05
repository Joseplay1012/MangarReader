/**
 * Reading History Manager using localStorage
 * Sections 36 & 37 of specification
 */

const HISTORY_STORAGE_KEY = 'manga_reader_history';

const HistoryManager = {
  getAll() {
    try {
      const data = localStorage.getItem(HISTORY_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Failed to parse reading history', e);
      return {};
    }
  },

  getMangaHistory(mangaSlug) {
    const all = this.getAll();
    return all[mangaSlug] || null;
  },

  saveProgress({ mangaSlug, mangaTitle, mangaCover, chapterId, chapterNumber, chapterSlug, page, totalPages }) {
    try {
      const all = this.getAll();
      all[mangaSlug] = {
        mangaSlug,
        mangaTitle,
        mangaCover,
        chapterId,
        chapterNumber,
        chapterSlug,
        page: page || 1,
        totalPages: totalPages || 1,
        updatedAt: Date.now(),
      };

      // Also save individual chapter specific key as specified in Section 37
      localStorage.setItem(
        `reader:${mangaSlug}:${chapterNumber}`,
        JSON.stringify({ page: page || 1, totalPages: totalPages || 1, updatedAt: Date.now() })
      );

      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to save reading history', e);
    }
  },

  getChapterProgress(mangaSlug, chapterNumber) {
    try {
      const data = localStorage.getItem(`reader:${mangaSlug}:${chapterNumber}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  renderHistorySection(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const all = this.getAll();
    const items = Object.values(all).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    if (items.length === 0) {
      const parentSection = container.closest('.section');
      if (parentSection) parentSection.style.display = 'none';
      return;
    }

    const parentSection = container.closest('.section');
    if (parentSection) parentSection.style.display = 'block';

    container.innerHTML = items.slice(0, 4).map(item => {
      const pct = Math.min(100, Math.round(((item.page || 1) / (item.totalPages || 1)) * 100));
      return `
        <a href="/read/${item.mangaSlug}/${item.chapterSlug || item.chapterNumber}" class="history-card">
          <img src="${item.mangaCover || '/storage/covers/placeholder.webp'}" alt="${item.mangaTitle}" class="history-cover">
          <div class="history-info">
            <div>
              <div class="history-title">${item.mangaTitle}</div>
              <div class="history-sub">Cap. ${item.chapterNumber} • Pág. ${item.page}/${item.totalPages}</div>
            </div>
            <div>
              <div class="history-bar">
                <div class="history-progress" style="width: ${pct}%"></div>
              </div>
            </div>
          </div>
        </a>
      `;
    }).join('');
  }
};
