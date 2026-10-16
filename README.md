<p align="center">
  <img src="icons/icon-full.svg" alt="MagangHub Logo" width="280">
</p>

<h1 align="center">MagangHub Auto-Draft Saver</h1>

<p align="center">
  Ekstensi browser Chromium (Manifest V3) untuk menyimpan sementara dan memulihkan draft laporan di portal <a href="https://monev.maganghub.kemnaker.go.id/dashboard/riwayat">Monev MagangHub Kemnaker</a>.
</p>

---

## Fitur

- **Autosave Otomatis:** Menyimpan ketikan secara real-time saat Anda mengisi form (Uraian Aktivitas, Pemelajaran, Kendala).
- **Auto-Restore:** Teks langsung terisi kembali ketika halaman ter-reload (F5), tab tertutup, atau form dibuka ulang.
- **Auto-Reset Ganti Hari:** Draft otomatis dikosongkan ketika berganti tanggal baru sehingga form siap untuk laporan hari berjalan.
- **Kompatibel Reactive Framework:** Menggunakan trigger input native agar state form React / Vue / Inertia di portal Kemnaker tetap sinkron.
- **Popup & Widget Minimalis:** Dilengkapi floating button di halaman, tombol salin ke clipboard, serta dukungan tema Gelap dan Terang.
- **Privat & Lokal:** Seluruh data disimpan langsung di browser Anda (`chrome.storage.local`) tanpa dikirim ke server pihak ketiga mana pun.

---

## Cara Download & Instalasi

Ekstensi ini kompatibel dengan semua browser berbasis Chromium (**Google Chrome**, **Microsoft Edge**, **Brave**, **Opera**, dll).

### Langkah 1: Download File
Pilih salah satu cara:
- **Download via Google Drive (Paling Mudah):**  
  Buka [Folder Google Drive](https://drive.google.com/drive/folders/1oda79wnvKSRtOxpJHhErvLnyvrmmV8ix), download file `.zip`, lalu ekstrak di komputer Anda.
- **Download via GitHub:**  
  Klik tombol hijau **Code** > **Download ZIP** di halaman GitHub ini, lalu ekstrak filenya.
- **Via Git Clone:**
  ```bash
  git clone https://github.com/devrnaldo/maganghub-draft-saver.git
  ```

### Langkah 2: Pasang ke Browser
1. Buka browser Anda, lalu ketik alamat berikut di address bar:
   - **Google Chrome:** `chrome://extensions`
   - **Microsoft Edge:** `edge://extensions`
   - **Brave:** `brave://extensions`
2. Di pojok kanan atas, aktifkan sakelar **Developer Mode** (Mode Pengembang).
3. Klik tombol **Load unpacked** (Muat yang belum dibongkar) yang muncul di kiri atas.
4. Pilih folder hasil ekstrak bernama **"maganghub-draft-saver"** yang berisi file `manifest.json`.
5. Ekstensi **MagangHub Auto-Draft Saver** sekarang sudah aktif!
6. *(Tips)* Klik ikon puzzle di toolbar atas browser, lalu klik ikon **Pin** di sebelah MagangHub Draft Saver agar ikonnya selalu terlihat di toolbar.

---

## Cara Kerja

1. Ekstensi hanya aktif saat Anda membuka [Monev MagangHub Kemnaker](https://monev.maganghub.kemnaker.go.id/dashboard/riwayat).
2. Sistem secara otomatis mendeteksi 3 kolom input utama:
   - **Uraian Aktivitas**
   - **Pemelajaran yang Diperoleh**
   - **Kendala yang Dialami**
3. Ketikan Anda akan tersimpan otomatis setiap kali berhenti mengetik (jeda debounce 500ms).
4. Saat halaman di-reload atau form dibuka kembali, draft yang tersimpan akan langsung otomatis mengisi kolom-kolom yang masih kosong.
5. Jika laporan sudah resmi Anda kirimkan, klik floating button di pojok kanan bawah > klik **Hapus Draft** untuk mengosongkan draft.

---

## Lisensi

[MIT License](LICENSE)
