# Party Finder Bot (Discord.js)

## Alur Kerja

1. Siapkan bot di Discord Developer Portal.
   - Buat application dan aktifkan bot.
   - Ambil `DISCORD_TOKEN` dan `CLIENT_ID`.
   - Undang bot ke server dengan scope `bot applications.commands`.

2. Siapkan file konfigurasi lokal.
   - Jalankan `npm install`.
   - Copy `.env.example` menjadi `.env`.
   - Isi `DISCORD_TOKEN`, `CLIENT_ID`, dan jika perlu `GUILD_ID`.

3. Daftarkan slash command ke Discord.
   ```bash
   npm run deploy
   ```

4. Jalankan bot.
   ```bash
   npm start
   ```

5. Buat party dari Discord.
   - Gunakan `/party create` untuk membuat party baru.
   - Isi `title` untuk nama party.
   - Isi `preset` kalau mau template cepat, atau `roles` kalau mau role kustom.

6. Bot membuat pesan party.
   - Bot mengirim embed party ke channel.
   - Bot menambahkan tombol role sesuai konfigurasi yang kamu pilih.
   - Tombol dipakai user untuk join, keluar, atau mengelola party.

7. Host mengelola party lewat tombol.
   - Host bisa mengunci atau membuka party.
   - Host bisa menghapus member, mengubah judul, mengirim notifikasi ulang, atau menandai party selesai.

8. Party tersimpan selama bot tetap berjalan.
   - Data party disimpan di memori.
   - Kalau bot restart, status party yang sedang aktif ikut hilang.
