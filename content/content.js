(() => {
  const STORAGE_KEY = 'maganghub_draft_data';
  const CONFIG_KEY = 'maganghub_draft_config';
  const THEME_KEY = 'maganghub_theme';
  let currentTheme = 'system';

  let currentDraft = {
    uraian: '',
    pembelajaran: '',
    kendala: '',
    updatedAt: null,
    url: window.location.href
  };

  let config = {
    autoRestore: true
  };

  let saveTimeout = null;
  let isRestoring = false;

  // Theme Handling sinkron dengan toolbar popup
  function applyTheme(theme) {
    const effectiveTheme = theme || 'system';
    let isDark = false;
    if (effectiveTheme === 'dark') {
      isDark = true;
    } else if (effectiveTheme === 'system') {
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    const root = document.getElementById('mhd-floating-root');
    if (root) {
      if (isDark) {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
    }
  }

  function initTheme() {
    chrome.storage.local.get([THEME_KEY], (res) => {
      applyTheme(res[THEME_KEY] || 'system');
    });

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        chrome.storage.local.get([THEME_KEY], (res) => {
          if (!res[THEME_KEY] || res[THEME_KEY] === 'system') {
            applyTheme('system');
          }
        });
      });
    }
  }

  // Helper to format date
  function formatTime(timestamp) {
    if (!timestamp) return 'Belum ada';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' (' + date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ')';
  }

  // Set input value cleanly triggering reactive frameworks (React, Vue, Inertia)
  function setNativeValue(element, value) {
    if (!element) return;
    if (element.isContentEditable) {
      element.innerText = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    const proto = Object.getPrototypeOf(element);
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) {
      setter.call(element, value);
    } else {
      element.value = value;
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function getElementValue(element) {
    if (!element) return '';
    if (element.isContentEditable) {
      return element.innerText || '';
    }
    return element.value || '';
  }

  // Identify field type based on keywords
  function identifyField(element) {
    if (!element || !(element instanceof HTMLElement)) return null;

    const tagName = element.tagName.toLowerCase();
    const isTextarea = tagName === 'textarea';
    const isInput = tagName === 'input' && (!element.type || element.type === 'text');
    const isEditable = element.isContentEditable;

    if (!isTextarea && !isInput && !isEditable) return null;

    // Collect clues
    const clues = [];
    if (element.id) clues.push(element.id);
    if (element.name) clues.push(element.name);
    if (element.placeholder) clues.push(element.placeholder);
    if (element.getAttribute('aria-label')) clues.push(element.getAttribute('aria-label'));

    // Check associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label && label.innerText) clues.push(label.innerText);
    }

    // Check parent/surrounding label or form-group header
    const parentContainer = element.closest('.form-group, .form-item, .mb-3, .mb-4, .space-y-2, label, div');
    if (parentContainer) {
      const labels = parentContainer.querySelectorAll('label, span, p, h4, h5, h6');
      labels.forEach(lbl => {
        if (lbl !== element && lbl.innerText) {
          clues.push(lbl.innerText);
        }
      });
    }

    const textToMatch = clues.join(' ').toLowerCase();

    // 1. Uraian aktivitas
    if (/(uraian\s*aktivitas|uraian\s*kegiatan|uraian|aktivitas|kegiatan|ringkasan\s*kegiatan)/i.test(textToMatch)) {
      // make sure it doesn't also match pembelajaran / kendala
      if (!/(pembelajaran|pemelajaran|kendala|hambatan)/i.test(textToMatch)) {
        return 'uraian';
      }
    }

    // 2. Pembelajaran yang diperoleh
    if (/(pemelajaran|pembelajaran|yang\s*diperoleh|lesson\s*learned|ilmu\s*yang|kompetensi)/i.test(textToMatch)) {
      return 'pembelajaran';
    }

    // 3. Kendala yang dialami
    if (/(kendala|hambatan|masalah|tantangan|kesulitan)/i.test(textToMatch)) {
      return 'kendala';
    }

    return null;
  }

  // Find all 3 target elements on current DOM
  function findTargetElements() {
    const targets = {
      uraian: null,
      pembelajaran: null,
      kendala: null
    };

    const candidates = document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]');
    for (const el of candidates) {
      // Skip our own extension elements
      if (el.closest('#mhd-floating-root') || el.closest('.mhd-form-banner')) continue;

      const type = identifyField(el);
      if (type && !targets[type]) {
        targets[type] = el;
      }
    }

    return targets;
  }

  // Cek apakah tanggal timestamp sama dengan hari ini
  function isToday(timestamp) {
    if (!timestamp) return false;
    const d = new Date(timestamp);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
  }

  // Load draft from storage (otomatis reset jika sudah berganti hari)
  function loadDraft(callback) {
    chrome.storage.local.get([STORAGE_KEY, CONFIG_KEY], (res) => {
      if (res[STORAGE_KEY]) {
        const saved = res[STORAGE_KEY];
        // Jika draft berasal dari hari sebelumnya, bersihkan untuk hari baru
        if (saved.updatedAt && !isToday(saved.updatedAt)) {
          currentDraft = {
            uraian: '',
            pembelajaran: '',
            kendala: '',
            updatedAt: null,
            url: window.location.href
          };
          chrome.storage.local.set({ [STORAGE_KEY]: currentDraft });
        } else {
          currentDraft = Object.assign(currentDraft, saved);
        }
      }
      if (res[CONFIG_KEY]) {
        config = Object.assign(config, res[CONFIG_KEY]);
      }
      updateUI();
      if (callback) callback();
    });
  }

  // Save draft with debounce
  function triggerAutoSave() {
    if (isRestoring) return;

    setSavingStatus(true);
    clearTimeout(saveTimeout);

    saveTimeout = setTimeout(() => {
      const targets = findTargetElements();
      let hasChanges = false;

      for (const key of ['uraian', 'pembelajaran', 'kendala']) {
        if (targets[key]) {
          const val = getElementValue(targets[key]);
          if (val !== currentDraft[key]) {
            currentDraft[key] = val;
            hasChanges = true;
          }
        }
      }

      if (hasChanges || !currentDraft.updatedAt) {
        currentDraft.updatedAt = Date.now();
        currentDraft.url = window.location.href;
        chrome.storage.local.set({ [STORAGE_KEY]: currentDraft }, () => {
          setSavingStatus(false);
          updateUI();
        });
      } else {
        setSavingStatus(false);
      }
    }, 500);
  }

  // Restore draft to detected fields
  function restoreDraftToFields(showToastMsg = true) {
    const targets = findTargetElements();
    let restoredCount = 0;

    isRestoring = true;

    for (const key of ['uraian', 'pembelajaran', 'kendala']) {
      const el = targets[key];
      const savedVal = currentDraft[key];
      if (el && savedVal && savedVal.trim().length > 0) {
        setNativeValue(el, savedVal);
        restoredCount++;
      }
    }

    setTimeout(() => {
      isRestoring = false;
    }, 150);

    if (showToastMsg) {
      if (restoredCount > 0) {
        showToast(`Berhasil memulihkan ${restoredCount} kolom draft`);
      } else {
        showToast('Kolom form tidak ditemukan atau draft masih kosong');
      }
    }

    // Dismiss banner if present
    const banner = document.querySelector('.mhd-form-banner');
    if (banner) banner.remove();

    updateUI();
  }

  // Toast notification
  function showToast(message) {
    let toast = document.querySelector('.mhd-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'mhd-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // Check if current draft has any content
  function hasDraftContent() {
    return (
      (currentDraft.uraian && currentDraft.uraian.trim().length > 0) ||
      (currentDraft.pembelajaran && currentDraft.pembelajaran.trim().length > 0) ||
      (currentDraft.kendala && currentDraft.kendala.trim().length > 0)
    );
  }

  // Check if form fields are currently empty
  function areFieldsEmpty(targets) {
    for (const key of ['uraian', 'pembelajaran', 'kendala']) {
      if (targets[key] && getElementValue(targets[key]).trim().length > 0) {
        return false;
      }
    }
    return true;
  }

  // Inject in-form restore prompt banner if fields appear and draft exists
  function checkAndInjectBanner() {
    if (!hasDraftContent()) return;
    if (document.querySelector('.mhd-form-banner')) return;

    const targets = findTargetElements();
    const foundAny = targets.uraian || targets.pembelajaran || targets.kendala;

    if (foundAny && areFieldsEmpty(targets)) {
      if (config.autoRestore) {
        restoreDraftToFields(false);
        showToast('Draft laporan otomatis dipulihkan ke form');
        return;
      }

      // If auto-restore is off, inject convenient banner above first target element
      const firstEl = targets.uraian || targets.pembelajaran || targets.kendala;
      const container = firstEl.closest('form') || firstEl.parentElement;

      if (container) {
        const banner = document.createElement('div');
        banner.className = 'mhd-form-banner';
        banner.innerHTML = `
          <div class="mhd-banner-left">
            <span>📝</span>
            <span>Draft laporan tersimpan (${formatTime(currentDraft.updatedAt)}).</span>
          </div>
          <div class="mhd-banner-actions">
            <button type="button" class="mhd-banner-btn mhd-banner-btn-apply" id="mhd-btn-banner-restore">Pulihkan Draft</button>
            <button type="button" class="mhd-banner-btn mhd-banner-btn-dismiss" id="mhd-btn-banner-dismiss">Tutup</button>
          </div>
        `;

        container.insertBefore(banner, container.firstChild);

        document.getElementById('mhd-btn-banner-restore')?.addEventListener('click', () => {
          restoreDraftToFields(true);
        });
        document.getElementById('mhd-btn-banner-dismiss')?.addEventListener('click', () => {
          banner.remove();
        });
      }
    }
  }

  // Create floating widget
  function createFloatingUI() {
    if (document.getElementById('mhd-floating-root')) return;

    const root = document.createElement('div');
    root.id = 'mhd-floating-root';

    root.innerHTML = `
      <div class="mhd-panel" id="mhd-panel">
        <div class="mhd-panel-header">
          <div class="mhd-panel-title">
            <img src="${chrome.runtime.getURL('icons/icon.svg')}" class="mhd-header-logo" alt="Logo">
            <span>MagangHub Draft Keeper</span>
          </div>
          <button type="button" class="mhd-close-btn" id="mhd-close-panel">✕</button>
        </div>
        <div class="mhd-panel-body">
          <div class="mhd-sync-notice">
            <svg class="mhd-sync-icon" width="14" height="14" viewBox="0 0 32 32" fill="currentColor">
              <path d="M24.96 12.649a9 9 0 0 0-17.917 0A7.5 7.5 0 0 0 8.5 27.5h15a7.5 7.5 0 0 0 1.46-14.851M23.5 25.5h-15a5.5 5.5 0 0 1-.423-10.978A1.02 1.02 0 0 0 9 13.5a7 7 0 0 1 14-.075v.1a1 1 0 0 0 .924 1A5.5 5.5 0 0 1 23.5 25.5"></path>
              <path d="M19.793 15.293 14.5 20.586l-2.293-2.293a1 1 0 0 0-1.414 1.414l3 3a1 1 0 0 0 1.414 0l6-6a1 1 0 0 0-1.414-1.414"></path>
            </svg>
            <span>Semua perubahan tersimpan otomatis</span>
          </div>

          <div class="mhd-meta-row">
            <span>Status Terakhir:</span>
            <strong id="mhd-last-time">Belum ada</strong>
          </div>

          <div class="mhd-draft-field">
            <div class="mhd-field-label">
              <span>1. Uraian Aktivitas</span>
              <span class="mhd-char-count" id="mhd-uraian-count">0 krt</span>
            </div>
            <div class="mhd-field-preview" id="mhd-uraian-prev"><em>Kosong</em></div>
          </div>

          <div class="mhd-draft-field">
            <div class="mhd-field-label">
              <span>2. Pembelajaran yang Diperoleh</span>
              <span class="mhd-char-count" id="mhd-pem-count">0 krt</span>
            </div>
            <div class="mhd-field-preview" id="mhd-pem-prev"><em>Kosong</em></div>
          </div>

          <div class="mhd-draft-field">
            <div class="mhd-field-label">
              <span>3. Kendala yang Dialami</span>
              <span class="mhd-char-count" id="mhd-ken-count">0 krt</span>
            </div>
            <div class="mhd-field-preview" id="mhd-ken-prev"><em>Kosong</em></div>
          </div>

          <div class="mhd-actions-grid">
            <button type="button" class="mhd-btn mhd-btn-primary" id="mhd-btn-restore">
              Pulihkan ke Form
            </button>
            <button type="button" class="mhd-btn mhd-btn-secondary" id="mhd-btn-copy">
              Salin Semua
            </button>
            <button type="button" class="mhd-btn mhd-btn-danger" id="mhd-btn-clear">
              Hapus Draft
            </button>
          </div>
        </div>
      </div>

      <div class="mhd-pill-btn" id="mhd-pill" title="Klik untuk melihat draft. Semua perubahan otomatis tersimpan.">
        <img src="${chrome.runtime.getURL('icons/icon.svg')}" class="mhd-pill-icon" alt="Logo">
        <span class="mhd-status-dot" id="mhd-dot"></span>
        <span class="mhd-pill-text" id="mhd-pill-label">Tersimpan Otomatis</span>
      </div>
    `;

    document.body.appendChild(root);

    // Event listeners
    const pill = root.querySelector('#mhd-pill');
    const panel = root.querySelector('#mhd-panel');
    const closeBtn = root.querySelector('#mhd-close-panel');

    pill?.addEventListener('click', () => {
      panel?.classList.toggle('open');
    });

    closeBtn?.addEventListener('click', () => {
      panel?.classList.remove('open');
    });

    document.getElementById('mhd-btn-restore')?.addEventListener('click', () => {
      restoreDraftToFields(true);
    });

    document.getElementById('mhd-btn-save-now')?.addEventListener('click', () => {
      const targets = findTargetElements();
      for (const k of ['uraian', 'pembelajaran', 'kendala']) {
        if (targets[k]) {
          currentDraft[k] = getElementValue(targets[k]);
        }
      }
      currentDraft.updatedAt = Date.now();
      chrome.storage.local.set({ [STORAGE_KEY]: currentDraft }, () => {
        showToast('Draft berhasil disimpan');
        updateUI();
      });
    });

    document.getElementById('mhd-btn-copy')?.addEventListener('click', () => {
      if (!hasDraftContent()) {
        showToast('Draft masih kosong');
        return;
      }
      const combined = `[URAIAN AKTIVITAS]
${currentDraft.uraian || '-'}

[PEMBELAJARAN YANG DIPEROLEH]
${currentDraft.pembelajaran || '-'}

[KENDALA YANG DIALAMI]
${currentDraft.kendala || '-'}`;
      navigator.clipboard.writeText(combined).then(() => {
        showToast('Semua draft disalin ke clipboard');
      }).catch(() => {
        showToast('Gagal menyalin ke clipboard');
      });
    });

    document.getElementById('mhd-btn-clear')?.addEventListener('click', () => {
      if (confirm('Yakin ingin mengosongkan draft laporan?')) {
        currentDraft = {
          uraian: '',
          pembelajaran: '',
          kendala: '',
          updatedAt: null,
          url: window.location.href
        };
        chrome.storage.local.set({ [STORAGE_KEY]: currentDraft }, () => {
          showToast('Draft berhasil dibersihkan');
          updateUI();
        });
      }
    });
  }

  function setSavingStatus(saving) {
    const dot = document.getElementById('mhd-dot');
    const label = document.getElementById('mhd-pill-label');
    if (!dot || !label) return;

    if (saving) {
      dot.classList.add('saving');
      label.textContent = 'Menyimpan...';
    } else {
      dot.classList.remove('saving');
      label.textContent = hasDraftContent() ? 'Tersimpan Otomatis' : 'Draft Kosong';
    }
  }

  function updateUI() {
    const timeEl = document.getElementById('mhd-last-time');
    const pillLabel = document.getElementById('mhd-pill-label');
    const autoStatus = document.getElementById('mhd-auto-status');

    if (timeEl) timeEl.textContent = formatTime(currentDraft.updatedAt);
    if (pillLabel) pillLabel.textContent = hasDraftContent() ? 'Tersimpan Otomatis' : 'Draft Kosong';
    if (autoStatus) autoStatus.textContent = config.autoRestore ? 'Aktif' : 'Nonaktif';

    const fields = [
      { key: 'uraian', prevId: 'mhd-uraian-prev', countId: 'mhd-uraian-count' },
      { key: 'pembelajaran', prevId: 'mhd-pem-prev', countId: 'mhd-pem-count' },
      { key: 'kendala', prevId: 'mhd-ken-prev', countId: 'mhd-ken-count' }
    ];

    fields.forEach(({ key, prevId, countId }) => {
      const prevEl = document.getElementById(prevId);
      const countEl = document.getElementById(countId);
      const val = currentDraft[key] || '';

      if (countEl) countEl.textContent = `${val.length} karakter`;
      if (prevEl) {
        if (val.trim()) {
          prevEl.textContent = val;
          prevEl.classList.remove('mhd-field-empty');
        } else {
          prevEl.innerHTML = '<em>Kosong</em>';
          prevEl.classList.add('mhd-field-empty');
        }
      }
    });
  }

  // Bind input listeners
  function attachListeners() {
    document.addEventListener('input', (e) => {
      const fieldType = identifyField(e.target);
      if (fieldType) {
        triggerAutoSave();
      }
    }, true);

    document.addEventListener('change', (e) => {
      const fieldType = identifyField(e.target);
      if (fieldType) {
        triggerAutoSave();
      }
    }, true);
  }

  // Observe DOM for dynamic modal / SPA route changes
  function startObserver() {
    let checkTimer = null;
    const observer = new MutationObserver(() => {
      clearTimeout(checkTimer);
      checkTimer = setTimeout(() => {
        checkAndInjectBanner();
      }, 350);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Listen to chrome storage changes (e.g. from popup)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes[STORAGE_KEY]) {
        currentDraft = Object.assign(currentDraft, changes[STORAGE_KEY].newValue || {});
        updateUI();
      }
      if (changes[CONFIG_KEY]) {
        config = Object.assign(config, changes[CONFIG_KEY].newValue || {});
        updateUI();
      }
      if (changes[THEME_KEY]) {
        applyTheme(changes[THEME_KEY].newValue);
      }
    }
  });

  // Init
  function init() {
    createFloatingUI();
    initTheme();
    attachListeners();
    startObserver();
    loadDraft(() => {
      setTimeout(checkAndInjectBanner, 500);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
