document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'maganghub_draft_data';
  const CONFIG_KEY = 'maganghub_draft_config';

  const inputUraian = document.getElementById('input-uraian');
  const inputPembelajaran = document.getElementById('input-pembelajaran');
  const inputKendala = document.getElementById('input-kendala');

  const badgeUraian = document.getElementById('badge-uraian');
  const badgePembelajaran = document.getElementById('badge-pembelajaran');
  const badgeKendala = document.getElementById('badge-kendala');

  const lastSavedTime = document.getElementById('last-saved-time');
  const statusText = document.getElementById('status-text');
  const toggleAutoRestore = document.getElementById('toggle-autorestore');

  const btnCopyUraian = document.getElementById('btn-copy-uraian');
  const btnCopyPembelajaran = document.getElementById('btn-copy-pembelajaran');
  const btnCopyKendala = document.getElementById('btn-copy-kendala');
  const btnCopyAll = document.getElementById('btn-copy-all');
  const btnSave = document.getElementById('btn-save');
  const btnClearAll = document.getElementById('btn-clear-all');
  const toastEl = document.getElementById('popup-toast');

  function showToast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2000);
  }

  function formatTime(timestamp) {
    if (!timestamp) return 'Belum ada data';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + 
           ', ' + date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  function updateCharCount() {
    badgeUraian.textContent = `${inputUraian.value.length} krt`;
    badgePembelajaran.textContent = `${inputPembelajaran.value.length} krt`;
    badgeKendala.textContent = `${inputKendala.value.length} krt`;
  }

  function loadData() {
    chrome.storage.local.get([STORAGE_KEY, CONFIG_KEY], (res) => {
      const data = res[STORAGE_KEY] || {};
      const config = res[CONFIG_KEY] || { autoRestore: true };

      inputUraian.value = data.uraian || '';
      inputPembelajaran.value = data.pembelajaran || '';
      inputKendala.value = data.kendala || '';
      lastSavedTime.textContent = formatTime(data.updatedAt);
      toggleAutoRestore.checked = config.autoRestore !== false;

      updateCharCount();

      const hasContent = (data.uraian || data.pembelajaran || data.kendala);
      statusText.textContent = hasContent ? 'Tersimpan' : 'Kosong';
    });
  }

  function saveData() {
    const data = {
      uraian: inputUraian.value,
      pembelajaran: inputPembelajaran.value,
      kendala: inputKendala.value,
      updatedAt: Date.now()
    };

    chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
      lastSavedTime.textContent = formatTime(data.updatedAt);
      statusText.textContent = 'Tersimpan';
      showToast('Draft tersimpan!');
    });
  }

  // Input listeners for live counter
  inputUraian.addEventListener('input', updateCharCount);
  inputPembelajaran.addEventListener('input', updateCharCount);
  inputKendala.addEventListener('input', updateCharCount);

  // Auto-restore toggle
  toggleAutoRestore.addEventListener('change', () => {
    chrome.storage.local.set({
      [CONFIG_KEY]: { autoRestore: toggleAutoRestore.checked }
    }, () => {
      showToast(toggleAutoRestore.checked ? 'Auto-restore aktif' : 'Auto-restore nonaktif');
    });
  });

  // Copy single fields
  btnCopyUraian.addEventListener('click', () => {
    if (!inputUraian.value) return showToast('Kolom uraian kosong');
    navigator.clipboard.writeText(inputUraian.value);
    showToast('Uraian disalin!');
  });

  btnCopyPembelajaran.addEventListener('click', () => {
    if (!inputPembelajaran.value) return showToast('Kolom pembelajaran kosong');
    navigator.clipboard.writeText(inputPembelajaran.value);
    showToast('Pembelajaran disalin!');
  });

  btnCopyKendala.addEventListener('click', () => {
    if (!inputKendala.value) return showToast('Kolom kendala kosong');
    navigator.clipboard.writeText(inputKendala.value);
    showToast('Kendala disalin!');
  });

  // Copy all
  btnCopyAll.addEventListener('click', () => {
    if (!inputUraian.value && !inputPembelajaran.value && !inputKendala.value) {
      return showToast('Draft masih kosong');
    }
    const combined = `[URAIAN AKTIVITAS]\n${inputUraian.value || '-'}\n\n[PEMBELAJARAN YANG DIPEROLEH]\n${inputPembelajaran.value || '-'}\n\n[KENDALA YANG DIALAMI]\n${inputKendala.value || '-'}`;
    navigator.clipboard.writeText(combined);
    showToast('Semua draft disalin!');
  });

  // Save button
  btnSave.addEventListener('click', saveData);

  // Clear button
  btnClearAll.addEventListener('click', () => {
    if (confirm('Yakin ingin mengosongkan semua draft?')) {
      inputUraian.value = '';
      inputPembelajaran.value = '';
      inputKendala.value = '';
      updateCharCount();

      chrome.storage.local.remove([STORAGE_KEY], () => {
        lastSavedTime.textContent = 'Belum ada data';
        statusText.textContent = 'Kosong';
        showToast('Draft dibersihkan');
      });
    }
  });

  // Initial load
  loadData();
});
