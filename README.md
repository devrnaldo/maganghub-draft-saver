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
- **Auto-Restore:** Teks langsung terisi kembali ketika halaman ter-reload (F5) atau form dibuka ulang.
- **Kompatibel Reactive Framework:** Memulihkan nilai menggunakan event input native agar sinkron dengan state React / Vue / Inertia.
- **Popup & Widget Minimalis:** Dilengkapi floating button di halaman, tombol salin ke clipboard, serta dukungan tema Gelap dan Terang.
- **Privat & Lokal:** Seluruh data draft disimpan di media lokal browser Anda (`chrome.storage.local`) tanpa dikirim ke server mana pun.

---

## Cara Instalasi

1. Clone atau download repository ini ke komputer Anda:
   ```bash
   git clone https://github.com/devrnaldo/maganghub-draft-saver.git
   ```
2. Buka halaman ekstensi browser:
   - **Chrome:** `chrome://extensions`
   - **Edge:** `edge://extensions`
   - **Brave:** `brave://extensions`
3. Aktifkan toggle **Developer Mode** (Mode Pengembang) di pojok kanan atas.
4. Klik tombol **Load unpacked** (Muat yang belum dibongkar), lalu pilih folder repository ini.

---

## Cara Kerja

1. Ekstensi aktif pada halaman `https://monev.maganghub.kemnaker.go.id/dashboard/riwayat`.
2. Skrip mendeteksi field target berdasarkan label, placeholder, dan ID:
   - *Uraian Aktivitas*
   - *Pemelajaran yang Diperoleh*
   - *Kendala yang Dialami*
3. Perubahan teks disimpan dengan jeda debounce 500ms ke storage lokal.
4. Ketika form dimuat kembali dalam kondisi kosong, draft akan otomatis diisikan kembali ke form.

---

## Uji Coba Lokal

Tersedia form simulasi lokal untuk mencoba ekstensi secara langsung tanpa harus login:
- Buka file `test/demo-riwayat.html` di browser Anda.
- Ketik laporan, lalu tekan **F5 (Reload)** untuk melihat draft terisi kembali secara otomatis.

---

## Lisensi

[MIT License](LICENSE)
