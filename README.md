# Party Finder Bot (Discord.js)

## Fitur
- `/party create` — buat party baru dengan role kustom atau preset.
- Tombol role dinamis sesuai jumlah & nama role yang kamu tentukan.
- **Cancel My Role** — user bisa keluar dari role sendiri.
- **Lock Party / Unlock Party** — host mengunci party biar tidak bisa join lagi.
- **Remove Member** — host bisa keluarkan member tertentu (via dropdown).
- **Done** — tandai party selesai (tombol jadi nonaktif).
- **Cancel Run** — batalkan party.
- **Edit Title** — host ubah judul party lewat modal/popup.
- **Notify Again** — host kirim ulang notifikasi `@here`.

## Setup

1. Buat aplikasi bot di https://discord.com/developers/applications
   - Aktifkan bot, copy **token**-nya, dan copy **Application ID** (jadi `CLIENT_ID`).
   - Di tab "Bot", scope yang dibutuhkan cukup default (tidak perlu privileged intents).
   - Invite bot ke server dengan scope `bot applications.commands` dan permission
     minimal: **Send Messages**, **Embed Links**, **Read Message History**,
     **Manage Messages** (untuk bisa edit pesan saat remove member / edit title).

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` jadi `.env`, lalu isi `DISCORD_TOKEN` dan `CLIENT_ID`
   (dan `GUILD_ID` kalau mau testing cepat di 1 server saja).

4. Daftarkan slash command:
   ```bash
   npm run deploy
   ```

5. Jalankan bot:
   ```bash
   npm start
   ```

## Cara pakai

```
/party create title:"GDN HC TO CLASSIC DD" preset:lineup
```
atau role kustom sendiri:
```
/party create title:"Raid Malam Ini" roles:"Tank:1,Healer:1,DPS:3"
```

## Catatan penting

- **Data party disimpan di memori (RAM)**, bukan database. Kalau bot di-restart,
  party yang sedang berjalan akan hilang datanya (tombolnya masih tampil tapi
  tidak akan berfungsi lagi). Kalau kamu butuh party tetap "hidup" setelah
  restart, tinggal ganti `utils/partyStore.js` supaya baca/tulis dari
  database (SQLite/MongoDB dsb) — strukturnya sudah dipisah biar gampang diganti.
- Format `roles` bebas: `Nama:JumlahSlot`, dipisah koma. Nama role yang
  dikenali (FU, PR, MC, SM, MT, Ice Stacking, Archer, DPS, Tank, Heal/Healer)
  otomatis dapat emoji yang sesuai; nama lain dapat emoji default berurutan.
- Custom ID tombol pakai format `party:<id>:<action>:<extra>` — kalau mau
  nambah aksi baru, tinggal tambah case baru di `handlers/interactionHandler.js`.
